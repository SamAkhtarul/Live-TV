/**
 * Live TV - Playback, HLS/DASH Streaming & Video Controller
 * Architecture: Controller / PlayerController
 */

import { state, isMobileDevice } from "../models/State.js";
import { CHANNEL_SERVERS, MOTOGP_BACKUPS, CLARITY_MODES } from "../models/Constants.js";
import { el } from "../views/Elements.js";
import { showToast, showStreamNotice } from "../utils/DomUtils.js";
import { updateRecallButton } from "./NavigationController.js";
import {
  updatePlayerEpg,
  updatePlayerFavButton,
  renderQualityOptions,
  updateAudioAndSubtitleTracks,
  updatePlayPauseIcons,
  showControls,
  hideControls,
  updateDvrDisplay,
  unlockScreen,
  hideLockOverlay,
  updateMediaSessionMetadata
} from "../views/PlayerView.js";
import { addToRecentlyWatched } from "./ChannelController.js";
import { updateActiveCardHighlight, renderQuickSwitchCarousel } from "../views/ChannelView.js";
import { syncRemoteStatus } from "./AppController.js";
import { stopAIUpscaler } from "./AIUpscalerController.js";
import { stopAudioHudVisualizer } from "./AudioController.js";

// Stream load sequencer to prevent async race conditions when switching channels rapidly
let currentStreamLoadId = 0;

export function playChannel(channel, index) {
  if (!channel || !channel.streamUrl) return;

  // Track Previous Channel for Flashback / Instant Recall (Q)
  if (state.currentChannel && state.currentChannel.id !== channel.id) {
    state.previousChannel = state.currentChannel;
  }
  state.streamRetryCount = 0;

  state.currentChannel = channel;
  state.currentChannelIndex = index !== undefined ? index : (state.filteredChannels || []).findIndex(c => c.id === channel.id);
  if (typeof updateRecallButton === "function") updateRecallButton();

  // Update UI Titles
  if (el.playerChannelTitle) el.playerChannelTitle.textContent = channel.name;
  const pipTitle = document.getElementById("pip-channel-title");
  if (pipTitle) pipTitle.textContent = channel.name;
  if (el.playerChannelMeta) el.playerChannelMeta.textContent = `${channel.category || 'Live'} • ${channel.country || 'Global'}`;
  if (el.playerChannelNum) {
    el.playerChannelNum.textContent = `CH ${String(channel.channelNumber || (state.currentChannelIndex + 1)).padStart(2, '0')}`;
  }
  updatePlayerEpg(channel);
  addToRecentlyWatched(channel);
  if (el.miniChannelName) el.miniChannelName.textContent = channel.name;
  if (el.miniChannelMeta) el.miniChannelMeta.textContent = `${channel.category || 'Live'} • 1080p HD`;

  updatePlayerFavButton();
  updateActiveCardHighlight();
  renderQuickSwitchCarousel();
  updateMediaSessionMetadata(channel);
  syncRemoteStatus();

  // Initialize Server Options for Multi-Feed Channels
  const chServers = CHANNEL_SERVERS[channel.id] || [
    { label: "Server 1", url: channel.streamUrl }
  ];
  state.availableServers = chServers;
  state.serverIndex = 0;
  updateServerButton();

  // Show player overlay
  if (el.playerOverlay) {
    el.playerOverlay.classList.add("is-active");
    el.playerOverlay.style.display = "flex";
  }
  document.body.classList.add("player-active");
  state.isPlayerOpen = true;
  if (el.miniPlayerBar) el.miniPlayerBar.style.display = "none";
  showControls();

  // Load Media Stream (DASH or HLS)
  loadMediaStream(chServers[0].url);
}

// Update Multi-Server Switcher Button UI
export function updateServerButton() {
  if (!el.playerBtnServer) return;
  if (state.availableServers && state.availableServers.length > 1) {
    el.playerBtnServer.style.display = "flex";
    const curServer = state.availableServers[state.serverIndex] || state.availableServers[0];
    if (el.playerServerLabel) el.playerServerLabel.textContent = curServer.label;
  } else {
    el.playerBtnServer.style.display = "none";
  }
}

// Switch between available broadcast servers
export function toggleServer() {
  if (!state.availableServers || state.availableServers.length <= 1) return;
  state.serverIndex = (state.serverIndex + 1) % state.availableServers.length;
  updateServerButton();
  const targetServer = state.availableServers[state.serverIndex];
  showStreamNotice(`Switching to ${targetServer.label}...`, 2500);
  loadMediaStream(targetServer.url);
}

// Parse stream parameters (URL, ClearKey DRM, and headers)
export function parseStreamEndpoint(rawUrl) {
  if (!rawUrl.includes("|")) {
    return { cleanUrl: rawUrl.trim(), clearKeys: {}, headers: {} };
  }
  const cleanUrl = rawUrl.substring(0, rawUrl.indexOf("|")).trim();
  const paramPart = rawUrl.substring(rawUrl.indexOf("|") + 1).trim();
  const headers = {};
  const clearKeys = {};

  const pairs = paramPart.split(/[&|]/).filter(p => p.trim().length > 0);
  for (const pair of pairs) {
    const eqIdx = pair.indexOf("=");
    if (eqIdx !== -1) {
      const k = pair.substring(0, eqIdx).trim().toLowerCase();
      const v = pair.substring(eqIdx + 1).trim();
      if (k === "clearkey" || k === "drmkey" || k === "key") {
        if (v.includes(":")) {
          const parts = v.split(":");
          const kid = parts[0].trim();
          const key = parts[1].trim();
          clearKeys[kid] = key;
        }
      } else if (k === "user-agent" || k === "ua") {
        headers["User-Agent"] = v;
      } else if (k === "referer") {
        headers["Referer"] = v;
      } else if (k === "origin") {
        headers["Origin"] = v;
      } else {
        headers[pair.substring(0, eqIdx).trim()] = v;
      }
    }
  }
  return { cleanUrl, clearKeys, headers };
}

// Continuous Playback Health Watchdog
export function startContinuousHealthWatchdog() {
  if (state.healthInterval) {
    clearInterval(state.healthInterval);
    state.healthInterval = null;
  }
  if (isMobileDevice()) {
    return;
  }

  state.lastPlayhead = -1;
  state.freezeCounter = 0;

  state.healthInterval = setInterval(() => {
    if (!state.video || !state.isPlaying || el.playerOverlay.style.display === "none") {
      return;
    }

    if (state.video.paused || state.video.seeking) {
      state.freezeCounter = 0;
      return;
    }

    const cur = state.video.currentTime;

    let isStalled = false;
    if (state.lastPlayhead >= 0 && Math.abs(cur - state.lastPlayhead) < 0.05 && state.video.readyState < 3) {
      isStalled = true;
    }

    if (isStalled) {
      state.freezeCounter++;
      console.warn(`[HealthWatchdog] Playback stall detected (${state.freezeCounter}) at ${cur.toFixed(2)}s`);

      if (state.freezeCounter === 2) {
        let jumped = false;
        if (state.video.buffered && state.video.buffered.length > 0) {
          for (let i = 0; i < state.video.buffered.length; i++) {
            const bStart = state.video.buffered.start(i);
            if (cur < bStart && (bStart - cur) <= 2.0) {
              state.video.currentTime = bStart + 0.1;
              jumped = true;
              break;
            }
          }
        }
        if (!jumped) {
          state.video.currentTime = cur + 0.3;
        }

        if (state.shakaPlayer) {
          try { state.shakaPlayer.retryStreaming(); } catch (e) {}
        }
        state.video.play().catch(() => {});
      } else if (state.freezeCounter === 3) {
        console.warn("[HealthWatchdog] Resyncing stream to live edge...");
        if (state.shakaPlayer) {
          try {
            const range = state.shakaPlayer.seekRange();
            if (range && range.end > 0) {
              state.video.currentTime = Math.max(range.start, range.end - 1.2);
            }
          } catch (e) {}
        } else if (state.video.duration && isFinite(state.video.duration)) {
          state.video.currentTime = Math.max(0, state.video.duration - 1.0);
        }
        state.video.play().catch(() => {});
      } else if (state.freezeCounter >= 4) {
        state.freezeCounter = 0;
        if (state.availableServers && state.availableServers.length > 1) {
          console.warn("[HealthWatchdog] Primary stream halted. Auto-switching to backup server...");
          state.serverIndex = (state.serverIndex + 1) % state.availableServers.length;
          const nextSrv = state.availableServers[state.serverIndex];
          updateServerButton();
          showStreamNotice(`Auto-recovered live broadcast • ${nextSrv.label}`, 3500);
          loadMediaStream(nextSrv.url);
        } else {
          console.warn("[HealthWatchdog] Stream stalled. Reloading stream engine...");
          showStreamNotice("Reconnecting live broadcast...", 2500);
          if (state.currentChannel) {
            loadMediaStream(state.currentChannel.streamUrl);
          }
        }
      }
    } else {
      state.freezeCounter = 0;
    }

    state.lastPlayhead = cur;
  }, 3000);
}

// Dedicated HLS Stream Loader
export function loadHlsStream(cleanUrl) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const canPlayNative = state.video && state.video.canPlayType("application/vnd.apple.mpegurl");

  if (isIOS && canPlayNative) {
    console.log("[StreamEngine] iOS detected: using Apple Hardware Native HLS");
    state.video.src = cleanUrl;
    state.video.play().catch(e => console.log("Native video play note:", e));
    updatePlayPauseIcons(true);
    state.video.onerror = () => {
      console.warn("iOS native video error, checking backup server...");
      if (state.availableServers && state.availableServers.length > 1) {
        state.serverIndex = (state.serverIndex + 1) % state.availableServers.length;
        const nextSrv = state.availableServers[state.serverIndex];
        updateServerButton();
        showStreamNotice(`Auto-recovered live broadcast • ${nextSrv.label}`, 3500);
        state.video.src = nextSrv.url;
        state.video.play().catch(() => {});
      }
    };
    return;
  }

  if (typeof Hls !== "undefined" && Hls.isSupported()) {
    console.log("Playing with HLS.js:", cleanUrl);
    const isMobile = isMobileDevice();
    const config = {
      enableWorker: true,
      lowLatencyMode: !!state.isLowLatencyMode,
      backBufferLength: isMobile ? 30 : 180,
      maxBufferLength: state.isLowLatencyMode ? 2 : (isMobile ? 30 : 60),
      maxMaxBufferLength: isMobile ? 60 : 180,
      maxBufferSize: isMobile ? (30 * 1024 * 1024) : (120 * 1024 * 1024),
      liveSyncDurationCount: state.isLowLatencyMode ? 1 : 3,
      liveMaxLatencyDurationCount: state.isLowLatencyMode ? 2 : 10,
      manifestLoadingTimeOut: 15000,
      manifestLoadingMaxRetry: 4,
      levelLoadingTimeOut: 15000,
      levelLoadingMaxRetry: 4,
      fragLoadingTimeOut: 20000,
      fragLoadingMaxRetry: 5
    };

    const hls = new Hls(config);
    state.hls = hls;

    hls.loadSource(cleanUrl);
    hls.attachMedia(state.video);

    hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
      console.log("HLS Manifest Parsed! Levels:", data.levels ? data.levels.length : 0);
      state.qualityLevels = data.levels || [];
      renderQualityOptions();
      updateAudioAndSubtitleTracks();
      state.video.play().catch(e => console.log("Auto-play blocked, awaiting user click", e));
      updatePlayPauseIcons(true);
      startContinuousHealthWatchdog();
    });

    hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => {
      updateAudioAndSubtitleTracks();
    });

    hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, () => {
      updateAudioAndSubtitleTracks();
    });

    hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
      const level = state.qualityLevels[data.level];
      if (level && level.height && el.playerQualityLabel) {
        el.playerQualityLabel.textContent = `${level.height}p`;
      }
    });

    hls.on(Hls.Events.ERROR, (event, data) => {
      const isHttpFatal = data.response && (data.response.code === 403 || data.response.code === 404 || data.response.code === 410);
      if (data.fatal || isHttpFatal) {
        if (state.availableServers && state.availableServers.length > 1) {
          state.serverIndex = (state.serverIndex + 1) % state.availableServers.length;
          const nextSrv = state.availableServers[state.serverIndex];
          updateServerButton();
          showStreamNotice(`Stream recovered • ${nextSrv.label}`, 3500);
          hls.destroy();
          state.hls = null;
          loadMediaStream(nextSrv.url);
          return;
        }

        const chId = state.currentChannel ? state.currentChannel.id : null;
        const catLower = (state.currentChannel?.category || "").toLowerCase();
        const nameLower = (state.currentChannel?.name || "").toLowerCase();

        // Tennis Fallback
        const isTennis = catLower.includes("tennis") || nameLower.includes("tennis") || (chId && chId.includes("ten"));
        if (isTennis && cleanUrl !== "https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01444-tennischannelth-tennischnlintl-lggb/playlist.m3u8") {
          showStreamNotice("Primary stream unreachable • Playing Tennis Channel HD", 3500);
          hls.destroy();
          state.hls = null;
          loadHlsStream("https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01444-tennischannelth-tennischnlintl-lggb/playlist.m3u8");
          return;
        }

        // MotoGP Fallback
        const isMotoGp = catLower.includes("moto") || catLower.includes("racing") || nameLower.includes("motogp") || nameLower.includes("spotv");
        if (isMotoGp && cleanUrl !== "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8") {
          showStreamNotice("Primary stream unreachable • Playing Eurosport Motorsport 4K", 3500);
          hls.destroy();
          state.hls = null;
          loadHlsStream("http://88.212.15.50/live/esp_4k_atk/playlist.m3u8");
          return;
        }

        // Cricket Fallback
        const isCricket = catLower.includes("cricket") || nameLower.includes("cricket");
        if (isCricket && cleanUrl !== "https://mycoffeetime.net/play/tSDRdsaoGGQ2qYgRPDEe9q-qMIzoahbJArH3W3vOiEaB97nXMpWmLb0Ts759Tjsp/m3u8") {
          showStreamNotice("Primary stream unreachable • Playing T Sports HD", 3500);
          hls.destroy();
          state.hls = null;
          loadHlsStream("https://mycoffeetime.net/play/tSDRdsaoGGQ2qYgRPDEe9q-qMIzoahbJArH3W3vOiEaB97nXMpWmLb0Ts759Tjsp/m3u8");
          return;
        }

        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            state.streamRetryCount = (state.streamRetryCount || 0) + 1;
            if (state.streamRetryCount <= 3) {
              showStreamNotice(`Connection lost • Auto-reconnecting (${state.streamRetryCount}/3)...`, 3500);
              const recBtn = document.getElementById("btn-player-notice-reconnect");
              if (recBtn) recBtn.style.display = "inline-flex";
              setTimeout(() => {
                reconnectCurrentStream(true);
              }, 1200);
              return;
            }
            if (state.video && state.video.canPlayType("application/vnd.apple.mpegurl") && !state._triedNativeHlsFallback) {
              state._triedNativeHlsFallback = true;
              hls.destroy();
              state.hls = null;
              state.video.src = cleanUrl;
              state.video.play().catch(e => console.log("Native video play error:", e));
              updatePlayPauseIcons(true);
              startContinuousHealthWatchdog();
              return;
            }
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;
          default:
            showStreamNotice("Stream error: could not connect to broadcast");
            hls.destroy();
            break;
        }
      }
    });
  } else if (state.video && state.video.canPlayType("application/vnd.apple.mpegurl")) {
    state.video.src = cleanUrl;
    state.video.play().catch(e => console.log("Native video play error:", e));
    updatePlayPauseIcons(true);
    startContinuousHealthWatchdog();
  }
}

// Unified Stream Engine
export async function loadMediaStream(rawUrl) {
  const loadId = ++currentStreamLoadId;
  state._triedNativeHlsFallback = false;
  const { cleanUrl, clearKeys, headers } = parseStreamEndpoint(rawUrl);
  const chId = state.currentChannel ? state.currentChannel.id : null;
  const hasClearKeys = Object.keys(clearKeys).length > 0;

  if (state.healthInterval) {
    clearInterval(state.healthInterval);
    state.healthInterval = null;
  }
  state.freezeCounter = 0;
  state.lastPlayhead = -1;

  if (state.stallWatchdog) {
    clearTimeout(state.stallWatchdog);
    state.stallWatchdog = null;
  }
  if (state.hls) {
    state.hls.destroy();
    state.hls = null;
  }
  if (state.shakaPlayer) {
    try {
      await state.shakaPlayer.destroy();
    } catch (e) {}
    state.shakaPlayer = null;
  }

  if (loadId !== currentStreamLoadId) return;

  state.isLive = true;
  state.dvrOffsetSeconds = 0;
  updateDvrDisplay();

  const isDash = cleanUrl.toLowerCase().includes(".mpd") || hasClearKeys;

  if (isDash && window.shaka && shaka.Player.isBrowserSupported()) {
    console.log("Playing with Shaka Player (DASH/ClearKey):", cleanUrl);
    const player = new shaka.Player();
    state.shakaPlayer = player;
    await player.attach(state.video, false);
    if (loadId !== currentStreamLoadId) {
      try { await player.destroy(); } catch (e) {}
      return;
    }

    const keyList = Object.keys(clearKeys);
    let softCencInstalled = false;

    if (keyList.length > 0 && window.LiveTVSoftCENC) {
      try {
        softCencInstalled = await window.LiveTVSoftCENC.installSoftwareClearKey(player, clearKeys);
        if (softCencInstalled) {
          console.log("[App] Software CENC decryptor successfully initialized for stream!");
        }
      } catch (e) {
        console.warn("[App] Failed to initialize LiveTVSoftCENC:", e);
      }
    }

    const drmConfig = {};
    if (keyList.length > 0 && !softCencInstalled) {
      drmConfig.clearKeys = clearKeys;
    }

    player.configure({
      drm: drmConfig,
      manifest: {
        ignoreDrmInfo: softCencInstalled ? true : false,
        dash: {
          autoCorrectDrift: true,
          ignoreMinBufferTime: true
        }
      },
      streaming: {
        bufferingGoal: 8,
        rebufferingGoal: 2,
        bufferBehind: 5,
        stallEnabled: true,
        stallThreshold: 1.0,
        stallSkip: 0.5,
        jumpLargeGaps: true,
        smallGapLimit: 0.5,
        retryParameters: {
          maxAttempts: 5,
          baseDelay: 800,
          backoffFactor: 1.5,
          fuzzFactor: 0.5,
          timeout: 10000
        }
      }
    });

    if (Object.keys(headers).length > 0) {
      player.getNetworkingEngine().registerRequestFilter((type, request) => {
        for (const [k, v] of Object.entries(headers)) {
          request.headers[k] = v;
        }
      });
    }

    player.addEventListener("error", (event) => {
      console.warn("Shaka Player error event:", event.detail);
      if (player && event.detail && event.detail.severity !== 2) {
        try { player.retryStreaming(); return; } catch (e) {}
      }
      if (state.availableServers && state.availableServers.length > 1) {
        state.serverIndex = (state.serverIndex + 1) % state.availableServers.length;
        const nextSrv = state.availableServers[state.serverIndex];
        updateServerButton();
        showStreamNotice(`Stream recovered • ${nextSrv.label}`, 3500);
        player.destroy().catch(() => {});
        state.shakaPlayer = null;
        loadMediaStream(nextSrv.url);
        return;
      }
      const chId = state.currentChannel ? state.currentChannel.id : null;
      const catLower = (state.currentChannel?.category || "").toLowerCase();
      const nameLower = (state.currentChannel?.name || "").toLowerCase();

      // Tennis fallback
      if (catLower.includes("tennis") || nameLower.includes("tennis") || (chId && chId.includes("ten"))) {
        showStreamNotice("Primary stream unreachable • Playing Tennis Channel HD", 3500);
        player.destroy().catch(() => {});
        state.shakaPlayer = null;
        loadHlsStream("https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01444-tennischannelth-tennischnlintl-lggb/playlist.m3u8");
        return;
      }

      // MotoGP fallback
      const isMotoGp = catLower.includes("moto") || catLower.includes("racing") || nameLower.includes("spotv") || nameLower.includes("motogp");
      if (isMotoGp) {
        const fallbackUrl = (chId && MOTOGP_BACKUPS[chId]) || "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8";
        showStreamNotice("Stream notice • Playing verified live broadcast", 3500);
        player.destroy().catch(() => {});
        state.shakaPlayer = null;
        loadHlsStream(fallbackUrl);
        return;
      }

      // Cricket fallback
      if (catLower.includes("cricket") || nameLower.includes("cricket")) {
        showStreamNotice("Primary stream unreachable • Playing T Sports HD", 3500);
        player.destroy().catch(() => {});
        state.shakaPlayer = null;
        loadHlsStream("https://mycoffeetime.net/play/tSDRdsaoGGQ2qYgRPDEe9q-qMIzoahbJArH3W3vOiEaB97nXMpWmLb0Ts759Tjsp/m3u8");
        return;
      }
    });

    try {
      await player.load(cleanUrl);
      state.video.play().catch(e => console.log("Shaka play blocked:", e));
      updatePlayPauseIcons(true);
      startContinuousHealthWatchdog();

      const tracks = player.getVariantTracks();
      state.qualityLevels = tracks.map(t => ({
        height: t.height,
        width: t.width,
        bitrate: t.bandwidth
      }));
      renderQualityOptions();
    } catch (err) {
      console.warn("Shaka Player load failed for", cleanUrl, err);
      if (state.availableServers && state.availableServers.length > 1) {
        state.serverIndex = (state.serverIndex + 1) % state.availableServers.length;
        const nextSrv = state.availableServers[state.serverIndex];
        updateServerButton();
        showStreamNotice(`Connecting to ${nextSrv.label}...`, 3500);
        try { await player.destroy(); } catch (e) {}
        state.shakaPlayer = null;
        loadMediaStream(nextSrv.url);
        return;
      }
      const chId = state.currentChannel ? state.currentChannel.id : null;
      const catLower = (state.currentChannel?.category || "").toLowerCase();
      const nameLower = (state.currentChannel?.name || "").toLowerCase();

      // Tennis fallback
      if (catLower.includes("tennis") || nameLower.includes("tennis") || (chId && chId.includes("ten"))) {
        showStreamNotice("Playing Tennis Channel HD", 3500);
        try { await player.destroy(); } catch (e) {}
        state.shakaPlayer = null;
        loadHlsStream("https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01444-tennischannelth-tennischnlintl-lggb/playlist.m3u8");
        return;
      }

      // MotoGP fallback
      const isMotoGp = catLower.includes("moto") || catLower.includes("racing") || nameLower.includes("spotv") || nameLower.includes("motogp");
      if (isMotoGp) {
        const fallbackUrl = (chId && MOTOGP_BACKUPS[chId]) || "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8";
        showStreamNotice("Playing verified live broadcast", 3500);
        try { await player.destroy(); } catch (e) {}
        state.shakaPlayer = null;
        loadHlsStream(fallbackUrl);
        return;
      }

      // Cricket fallback
      if (catLower.includes("cricket") || nameLower.includes("cricket")) {
        showStreamNotice("Playing T Sports HD", 3500);
        try { await player.destroy(); } catch (e) {}
        state.shakaPlayer = null;
        loadHlsStream("https://mycoffeetime.net/play/tSDRdsaoGGQ2qYgRPDEe9q-qMIzoahbJArH3W3vOiEaB97nXMpWmLb0Ts759Tjsp/m3u8");
        return;
      }
      showStreamNotice("Stream failed to load (" + (err.message || "DRM Error") + ")");
    }
    return;
  }

  loadHlsStream(cleanUrl);
}

// Next & Previous Channel Switching
export function playNextChannel() {
  const list = (state.filteredChannels && state.filteredChannels.length > 0) ? state.filteredChannels : state.allChannels;
  if (!list || !list.length) return;
  let curIdx = state.currentChannelIndex;
  if (curIdx < 0 && state.currentChannel) {
    curIdx = list.findIndex(c => c.id === state.currentChannel.id);
  }
  let nextIdx = (curIdx >= 0) ? curIdx + 1 : 0;
  if (nextIdx >= list.length) nextIdx = 0;
  playChannel(list[nextIdx], nextIdx);
}

export function playPrevChannel() {
  const list = (state.filteredChannels && state.filteredChannels.length > 0) ? state.filteredChannels : state.allChannels;
  if (!list || !list.length) return;
  let curIdx = state.currentChannelIndex;
  if (curIdx < 0 && state.currentChannel) {
    curIdx = list.findIndex(c => c.id === state.currentChannel.id);
  }
  let prevIdx = (curIdx >= 0) ? curIdx - 1 : 0;
  if (prevIdx < 0) prevIdx = list.length - 1;
  playChannel(list[prevIdx], prevIdx);
}

// Close Video Player
export async function closePlayer() {
  currentStreamLoadId++;
  if (state.isLocked) {
    unlockScreen();
  }
  hideLockOverlay();
  if (state.healthInterval) {
    clearInterval(state.healthInterval);
    state.healthInterval = null;
  }
  state.freezeCounter = 0;
  state.lastPlayhead = -1;

  // Stop background GPU & visualizer animation loops to guarantee 0% idle CPU/GPU
  try { stopAIUpscaler(); } catch (e) {}
  try { stopAudioHudVisualizer(); } catch (e) {}
  if (window.stopAmbilight) window.stopAmbilight();

  // Reset radio mode if player is closed during audio-only playback
  if (state.isAudioOnly) {
    state.isAudioOnly = false;
    if (state.video) state.video.style.display = "block";
    const hud = document.getElementById("audio-only-hud");
    if (hud) hud.style.display = "none";
    const radioBtn = document.getElementById("player-btn-radio");
    if (radioBtn) radioBtn.classList.remove("active-setting");
    const radioLabel = document.getElementById("player-radio-label");
    if (radioLabel) radioLabel.textContent = "Radio Mode";
  }

  // Reset video transform and zoom
  if (state.videoZoom !== 1.0 || state.videoPanX !== 0 || state.videoPanY !== 0) {
    state.videoZoom = 1.0;
    state.videoPanX = 0;
    state.videoPanY = 0;
    if (state.video) state.video.style.transform = "none";
  }

  if (state.hls) {
    state.hls.destroy();
    state.hls = null;
  }
  if (state.shakaPlayer) {
    try {
      await state.shakaPlayer.destroy();
    } catch (e) {}
    state.shakaPlayer = null;
  }
  if (state.video) {
    state.video.pause();
    state.video.removeAttribute("src");
    state.video.load();
  }
  state.isPlaying = false;
  state.currentChannel = null;
  hideControls();
  document.querySelectorAll(".modal-overlay").forEach(m => {
    m.style.display = "none";
    if (m.parentNode !== document.body) {
      document.body.appendChild(m);
    }
  });
  if (el.playerOverlay) {
    el.playerOverlay.classList.remove("is-active");
    el.playerOverlay.classList.remove("controls-hidden");
    el.playerOverlay.style.display = "none";
  }
  document.body.classList.remove("player-active");
  document.body.classList.remove("controls-hidden");
  state.isPlayerOpen = false;
  if (el.miniPlayerBar) el.miniPlayerBar.style.display = "none";
  updateActiveCardHighlight();
}

// Video Pan and Zoom
export function cycleVideoZoom() {
  const levels = [1.0, 1.25, 1.5, 2.0];
  const curIdx = levels.indexOf(state.videoZoom);
  const nextIdx = (curIdx + 1) % levels.length;
  setVideoZoom(levels[nextIdx]);
}
window.cycleVideoZoom = cycleVideoZoom;

export function setVideoZoom(zoom) {
  state.videoZoom = zoom;
  if (zoom === 1.0) {
    state.videoPanX = 0;
    state.videoPanY = 0;
  }
  applyVideoTransform();
  const lbl = el.playerZoomLabel || document.getElementById("player-zoom-label");
  if (lbl) lbl.textContent = `${zoom}x`;
  showToast(`Video Zoom: ${zoom}x${zoom > 1.0 ? ' • Drag to pan' : ''}`, "🔎");
}
window.setVideoZoom = setVideoZoom;

export function applyVideoTransform() {
  if (!state.video) return;
  if (state.videoZoom === 1.0 && state.videoPanX === 0 && state.videoPanY === 0) {
    state.video.style.transform = "";
    state.video.style.cursor = "default";
  } else {
    state.video.style.transform = `scale(${state.videoZoom}) translate(${state.videoPanX}px, ${state.videoPanY}px)`;
    state.video.style.transformOrigin = "center center";
    state.video.style.cursor = "grab";
  }
}
window.applyVideoTransform = applyVideoTransform;

export function initVideoZoomGestures() {
  const container = el.videoContainer || document.getElementById("video-container");
  if (!container) return;

  let initialPinchDist = 0;
  let initialPinchZoom = 1.0;
  let panStartX = 0;
  let panStartY = 0;
  let isTouching = false;

  container.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) {
      initialPinchDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchZoom = state.videoZoom;
    } else if (e.touches.length === 1 && state.videoZoom > 1.0) {
      isTouching = true;
      panStartX = e.touches[0].clientX - state.videoPanX;
      panStartY = e.touches[0].clientY - state.videoPanY;
    }
  }, { passive: true });

  container.addEventListener("touchmove", (e) => {
    if (e.touches.length === 2 && initialPinchDist > 0) {
      const curDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = curDist / initialPinchDist;
      let newZoom = Math.min(2.5, Math.max(1.0, parseFloat((initialPinchZoom * ratio).toFixed(2))));
      state.videoZoom = newZoom;
      applyVideoTransform();
      const lbl = el.playerZoomLabel || document.getElementById("player-zoom-label");
      if (lbl) lbl.textContent = `${state.videoZoom}x`;
    } else if (e.touches.length === 1 && isTouching && state.videoZoom > 1.0) {
      state.videoPanX = Math.round(e.touches[0].clientX - panStartX);
      state.videoPanY = Math.round(e.touches[0].clientY - panStartY);
      applyVideoTransform();
    }
  }, { passive: true });

  container.addEventListener("touchend", () => {
    initialPinchDist = 0;
    isTouching = false;
  }, { passive: true });

  let isMouseDown = false;
  let mouseStartX = 0;
  let mouseStartY = 0;

  container.addEventListener("mousedown", (e) => {
    if (state.videoZoom > 1.0 && e.button === 0 && !e.target.closest(".player-controls, .modal-overlay, .modal")) {
      isMouseDown = true;
      mouseStartX = e.clientX - state.videoPanX;
      mouseStartY = e.clientY - state.videoPanY;
      if (state.video) state.video.style.cursor = "grabbing";
    }
  });

  window.addEventListener("mousemove", (e) => {
    if (isMouseDown && state.videoZoom > 1.0) {
      state.videoPanX = Math.round(e.clientX - mouseStartX);
      state.videoPanY = Math.round(e.clientY - mouseStartY);
      applyVideoTransform();
    }
  });

  window.addEventListener("mouseup", () => {
    if (isMouseDown) {
      isMouseDown = false;
      if (state.video) state.video.style.cursor = state.videoZoom > 1.0 ? "grab" : "default";
    }
  });
}

// Reconnect Stream
export function reconnectCurrentStream(isAuto = false) {
  if (!state.currentChannel) return;
  console.log(`[StreamReconnect] Reconnecting ${state.currentChannel.name} (auto: ${isAuto})...`);
  showStreamNotice(isAuto ? "Auto-reconnecting stream..." : "Reloading stream...", 3500);
  showToast(isAuto ? "Stream stall detected: Auto-reconnecting..." : "Reloading broadcast stream...", "↻");

  if (state.hls) {
    try { state.hls.destroy(); } catch (e) {}
    state.hls = null;
  }
  if (state.shakaPlayer) {
    try { state.shakaPlayer.destroy(); } catch (e) {}
    state.shakaPlayer = null;
  }
  if (state.video) {
    state.video.pause();
    state.video.removeAttribute("src");
    state.video.load();
  }

  const srvUrl = (state.availableServers && state.availableServers[state.serverIndex])
    ? state.availableServers[state.serverIndex].url
    : state.currentChannel.streamUrl;

  setTimeout(() => {
    loadMediaStream(srvUrl);
  }, 300);
}
window.reconnectCurrentStream = reconnectCurrentStream;

// Video Clarity
let clarityIndex = 0;

export function cycleVideoClarity() {
  clarityIndex = (clarityIndex + 1) % CLARITY_MODES.length;
  applyVideoClarity(clarityIndex);
}

export function applyVideoClarity(index) {
  clarityIndex = index % CLARITY_MODES.length;
  const mode = CLARITY_MODES[clarityIndex];
  const video = state.video || document.getElementById("video-player");
  if (video) {
    CLARITY_MODES.forEach(m => {
      if (m.cls) video.classList.remove(m.cls);
    });
    if (mode.cls) video.classList.add(mode.cls);
  }
  if (el.playerClarityLabel) {
    el.playerClarityLabel.textContent = mode.label;
  }
  showToast(`Video Mode: ${mode.label}`, "✨");
}
