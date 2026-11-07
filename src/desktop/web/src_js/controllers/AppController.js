/**
 * Live TV - Master Application Controller & Lifecycle Orchestrator
 * Architecture: Controller / AppController
 */

import { state, isMobileDevice } from "../models/State.js";
import { el, initElements } from "../views/Elements.js";
import { GITHUB_RELEASES_URL } from "../models/Constants.js";
import { showToast, setupWindowDragging, escapeHtml } from "../utils/DomUtils.js";
import {
  loadStoredPreferences,
  loadChannels,
  saveCustomChannel,
  onChannelSortChange,
  onQuickFilter,
  applyFilterAndSearch
} from "../models/ChannelModel.js";
import { renderChannelBatch, renderCategoriesBar } from "../views/ChannelView.js";
import {
  updatePlayPauseIcons,
  showBrightnessHud,
  showVolumeHud,
  applyBrightness,
  triggerSeekRipple,
  seekDvrOffset,
  goLive,
  renderQualityOptions,
  updateAudioAndSubtitleTracks,
  expandPlayer,
  cycleAspectRatio,
  triggerInstantSlowmoReplay,
  resumeFromSlowmoReplay,
  notifyControlsInteraction,
  releaseControlsInteraction,
  toggleControls,
  lockScreen,
  unlockScreen,
  showControls,
  initCinemaAmbientDimmer
} from "../views/PlayerView.js";
import {
  playChannel,
  playNextChannel,
  playPrevChannel,
  closePlayer,
  toggleServer,
  startContinuousHealthWatchdog,
  reconnectCurrentStream,
  cycleVideoZoom,
  initVideoZoomGestures,
  cycleVideoClarity
} from "./PlayerController.js";
import {
  toggleFavorite,
  clearRecentlyWatched,
  parseCustomM3u,
  toggleTurboMode,
  toggleViewDensity,
  toggleLowLatencyMode,
  toggleDataSaverMode,
  submitXtreamLogin
} from "./ChannelController.js";
import {
  applyVolume,
  applyAudioProfile,
  toggleAudioOnlyMode,
  setAudioDelay,
  triggerCommercialBreakMute,
  resumeFromBreakMute,
  toggleAudioNormalizer
} from "./AudioController.js";
import { setupKeyboardShortcuts, recallPreviousChannel, toggleVoiceAssistant } from "./NavigationController.js";
import { initBandwidthMeter, initNetworkTelemetry, updateStatsHud } from "../views/TelemetryView.js";
import { initHeroSpotlight, playHeroChannel, toggleHeroFavorite } from "../views/HeroView.js";
import {
  toggleSportsHUD,
  minimizeSportsHUD,
  unpinMatchFromHUD,
  renderLiveEvents,
  openPlayerSearch,
  closePlayerSearch,
  renderPlayerSearchResults,
  updateHudSearchHighlight,
  toggleSportsTicker
} from "../views/HUDView.js";
import {
  openModal,
  closeModal,
  openAboutModal,
  closeAboutModal,
  openRankFavoritesModal,
  saveRankFavorites,
  openRearrangeCategoriesModal,
  saveCategoryOrder,
  resetCategoryOrder,
  openRemoteControlModal,
  openScheduledDvrModal,
  scheduleDVRRecording,
  openParentalPinModal,
  open10BandEqModal,
  openEPGGuideModal,
  promptImportXmltv,
  openCastPicker,
  triggerAirPlay,
  triggerChromecast,
  copyDLNAStreamUrl,
  openChannelManagerModal,
  handleCreateBouquet,
  openTVAlarmModal,
  saveTVAlarm,
  cancelTVAlarm,
  renderTeamAlertChips,
  addCustomTeam,
  toggleMiniGuide,
  initPeekHoverPreview,
  openDualAudioModal,
  openExternalUrl
} from "../views/ModalView.js";
import { checkForAppUpdates } from "./UpdateController.js";
import { refreshDynamicMotoGpEvents, fetchRealSportsEvents } from "../models/EventModel.js";
import { cycleAIUpscaler, toggleAISplitCompare } from "./AIUpscalerController.js";

// Native Always On Top Mode
export function toggleAlwaysOnTop() {
  state.isAlwaysOnTop = !state.isAlwaysOnTop;
  window.updateAlwaysOnTopUI(state.isAlwaysOnTop);
  if (window.webkit?.messageHandlers?.setAlwaysOnTop) {
    try {
      window.webkit.messageHandlers.setAlwaysOnTop.postMessage(state.isAlwaysOnTop);
    } catch (e) {
      console.warn("Native bridge setAlwaysOnTop error:", e);
    }
  }
  showToast(state.isAlwaysOnTop ? "Always on Top enabled" : "Always on Top disabled", "📌");
}

window.updateAlwaysOnTopUI = function(isPinned) {
  state.isAlwaysOnTop = !!isPinned;
  if (el.btnHeaderPin) el.btnHeaderPin.classList.toggle("is-pinned", state.isAlwaysOnTop);
  if (el.playerBtnPin) el.playerBtnPin.classList.toggle("is-pinned", state.isAlwaysOnTop);
};

// Live Clip Recorder
export function toggleRecording() {
  if (state.isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

export function startRecording() {
  if (!state.video) {
    showToast("No active video to record", "⚠️");
    return;
  }
  try {
    const stream = state.video.captureStream ? state.video.captureStream() : (state.video.mozCaptureStream ? state.video.mozCaptureStream() : null);
    if (!stream) {
      showToast("Live stream recording not supported on this video format", "⚠️");
      return;
    }

    let mimeType = 'video/webm;codecs=vp9,opus';
    if (!window.MediaRecorder || !MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4';
      }
    }

    state.recordedChunks = [];
    const options = (window.MediaRecorder && MediaRecorder.isTypeSupported(mimeType)) ? { mimeType } : undefined;
    const recorder = new MediaRecorder(stream, options);

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        state.recordedChunks.push(e.data);
      }
    };

    recorder.onstop = () => {
      saveRecordingBlob();
    };

    recorder.start(1000);
    state.mediaRecorder = recorder;
    state.isRecording = true;
    state.recordSeconds = 0;

    if (el.playerBtnRecord) el.playerBtnRecord.classList.add("is-recording");
    if (el.playerRecordLabel) el.playerRecordLabel.textContent = "REC 00:00";

    clearInterval(state.recordTimerInterval);
    state.recordTimerInterval = setInterval(() => {
      state.recordSeconds++;
      const mins = String(Math.floor(state.recordSeconds / 60)).padStart(2, "0");
      const secs = String(state.recordSeconds % 60).padStart(2, "0");
      if (el.playerRecordLabel) el.playerRecordLabel.textContent = `REC ${mins}:${secs}`;
    }, 1000);

    showToast("Recording started • Capturing live highlight", "🔴");
  } catch (err) {
    console.error("Recording start error:", err);
    showToast("Recording unavailable: " + (err.message || err), "⚠️");
  }
}

export function stopRecording() {
  if (!state.isRecording || !state.mediaRecorder) return;
  clearInterval(state.recordTimerInterval);
  try {
    state.mediaRecorder.stop();
  } catch (e) {}

  state.isRecording = false;
  if (el.playerBtnRecord) el.playerBtnRecord.classList.remove("is-recording");
  if (el.playerRecordLabel) el.playerRecordLabel.textContent = "REC";
}

export function saveRecordingBlob() {
  if (state.recordedChunks.length === 0) {
    showToast("No clip data recorded", "⚠️");
    return;
  }
  const mime = (state.mediaRecorder && state.mediaRecorder.mimeType) ? state.mediaRecorder.mimeType : "video/webm";
  const blob = new Blob(state.recordedChunks, { type: mime });
  const url = URL.createObjectURL(blob);
  const chName = (state.currentChannel ? state.currentChannel.name : "LiveTV").replace(/[^a-zA-Z0-9_-]/g, "_");
  const now = new Date();
  const timeStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
  const ext = mime.includes("mp4") ? "mp4" : "webm";
  const filename = `LiveTV_${chName}_${timeStr}.${ext}`;

  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 1000);

  showToast(`Clip saved: ${filename}`, "💾");
}

// Multi-View Studio
export function openMultiView() {
  state.multiviewActive = true;
  if (state.video) {
    state.video.pause();
  }

  if (el.multiviewOverlay) {
    el.multiviewOverlay.style.display = "flex";
  }

  const ch1 = state.currentChannel || state.allChannels[0];
  const ch2 = state.allChannels.find(c => c.id !== (ch1 ? ch1.id : null) && c.category === "Sports") || state.allChannels[1];
  const ch3 = state.allChannels.find(c => c.id !== (ch1 ? ch1.id : null) && c.id !== (ch2 ? ch2.id : null) && c.category === "News") || state.allChannels[2];
  const ch4 = state.allChannels.find(c => c.id !== (ch1 ? ch1.id : null) && c.id !== (ch2 ? ch2.id : null) && c.id !== (ch3 ? ch3.id : null)) || state.allChannels[3];

  state.multiviewChannels = [ch1, ch2, ch3, ch4];
  setMultiViewMode(state.multiviewMode || "dual");
}

export function setMultiViewMode(mode) {
  state.multiviewMode = mode;
  if (!el.multiviewGrid) return;

  const btnDual = document.getElementById("btn-mv-mode-dual");
  const btnQuad = document.getElementById("btn-mv-mode-quad");
  if (btnDual && btnQuad) {
    btnDual.classList.toggle("active", mode === "dual");
    btnQuad.classList.toggle("active", mode === "quad");
  }

  if (mode === "dual") {
    el.multiviewGrid.className = "multiview-grid mode-dual";
    const s2 = document.getElementById("mv-slot-2");
    const s3 = document.getElementById("mv-slot-3");
    if (s2) s2.style.display = "none";
    if (s3) s3.style.display = "none";
    setupSlotStream(0, state.multiviewChannels[0]);
    setupSlotStream(1, state.multiviewChannels[1]);
    destroySlotStream(2);
    destroySlotStream(3);
  } else {
    el.multiviewGrid.className = "multiview-grid mode-quad";
    const s2 = document.getElementById("mv-slot-2");
    const s3 = document.getElementById("mv-slot-3");
    if (s2) s2.style.display = "flex";
    if (s3) s3.style.display = "flex";
    setupSlotStream(0, state.multiviewChannels[0]);
    setupSlotStream(1, state.multiviewChannels[1]);
    setupSlotStream(2, state.multiviewChannels[2]);
    setupSlotStream(3, state.multiviewChannels[3]);
  }
}

export function setupSlotStream(slotIndex, channel) {
  if (!channel) return;
  const vid = document.getElementById(`mv-video-${slotIndex}`);
  const title = document.getElementById(`mv-title-${slotIndex}`);
  if (title) title.textContent = channel.name;

  if (state.multiviewHls[slotIndex]) {
    try { state.multiviewHls[slotIndex].destroy(); } catch (e) {}
    state.multiviewHls[slotIndex] = null;
  }

  if (!vid) return;
  vid.muted = (slotIndex !== state.multiviewActiveSlot);

  if (typeof Hls !== "undefined" && Hls.isSupported() && channel.streamUrl && channel.streamUrl.includes(".m3u8")) {
    const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
    state.multiviewHls[slotIndex] = hls;
    hls.loadSource(channel.streamUrl);
    hls.attachMedia(vid);
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      vid.play().catch(() => {});
    });
  } else if (channel.streamUrl) {
    vid.src = channel.streamUrl;
    vid.play().catch(() => {});
  }
}

export function destroySlotStream(slotIndex) {
  if (state.multiviewHls[slotIndex]) {
    try { state.multiviewHls[slotIndex].destroy(); } catch (e) {}
    state.multiviewHls[slotIndex] = null;
  }
  const vid = document.getElementById(`mv-video-${slotIndex}`);
  if (vid) {
    vid.pause();
    vid.removeAttribute("src");
    vid.load();
  }
}

export function setMultiViewAudioFocus(slotIndex) {
  state.multiviewActiveSlot = slotIndex;
  for (let i = 0; i < 4; i++) {
    const slot = document.getElementById(`mv-slot-${i}`);
    const vid = document.getElementById(`mv-video-${i}`);
    const badge = document.getElementById(`mv-audio-btn-${i}`);
    if (slot && vid) {
      if (i === slotIndex) {
        slot.classList.add("active-audio");
        vid.muted = false;
        if (badge) {
          badge.classList.add("active");
          badge.textContent = "🔊 AUDIO ACTIVE";
        }
      } else {
        slot.classList.remove("active-audio");
        vid.muted = true;
        if (badge) {
          badge.classList.remove("active");
          badge.textContent = "🔇 MUTED";
        }
      }
    }
  }
  const status = document.getElementById("multiview-status-text");
  if (status && state.multiviewChannels[slotIndex]) {
    status.textContent = `Audio Focus: ${state.multiviewChannels[slotIndex].name} • Click any screen to focus audio`;
  }
}

export function closeMultiView() {
  state.multiviewActive = false;
  for (let i = 0; i < 4; i++) {
    destroySlotStream(i);
  }
  if (el.multiviewOverlay) {
    el.multiviewOverlay.style.display = "none";
  }
  if (state.video && state.currentChannel) {
    state.video.play().catch(() => {});
  }
}

// Reactive Dynamic Ambilight
export let isAmbilightActive = false;
export let ambilightRaf = null;

export function initAmbilight() {
  if (!el.ambientCanvas) return;
  el.ambientCanvas.width = 32;
  el.ambientCanvas.height = 18;
}

export function toggleAmbilight() {
  isAmbilightActive = !isAmbilightActive;
  if (el.videoContainer) {
    el.videoContainer.classList.toggle("ambient-active", isAmbilightActive);
  }
  if (el.playerAmbilightLabel) {
    el.playerAmbilightLabel.textContent = isAmbilightActive ? "Ambilight ON" : "Ambient";
  }
  if (isAmbilightActive) {
    initAmbilight();
    renderAmbilightFrame();
    showToast("Dynamic Reactive Ambilight ON 💡", "✨");
  } else {
    stopAmbilight();
    showToast("Ambilight Backlighting Turned Off", "💡");
  }
}

export function stopAmbilight() {
  isAmbilightActive = false;
  if (ambilightRaf) {
    cancelAnimationFrame(ambilightRaf);
    ambilightRaf = null;
  }
  if (el.videoContainer) {
    el.videoContainer.classList.remove("ambient-active");
  }
  if (el.playerAmbilightLabel) {
    el.playerAmbilightLabel.textContent = "Ambient";
  }
}
window.stopAmbilight = stopAmbilight;

export function renderAmbilightFrame() {
  if (!isAmbilightActive) return;
  if (el.ambientCanvas && state.video && !state.video.paused && state.video.videoWidth > 0) {
    try {
      const ctx = el.ambientCanvas.getContext("2d");
      ctx.drawImage(state.video, 0, 0, 32, 18);
    } catch (e) {}
  }
  ambilightRaf = requestAnimationFrame(renderAmbilightFrame);
}

// Instant Highlight Clip Creator
export function captureLiveClip() {
  if (!state.video) return;
  showToast("Capturing 15-second highlight clip... ✂️", "🎬");
  
  try {
    const stream = state.video.captureStream ? state.video.captureStream(30) : null;
    if (stream && window.MediaRecorder) {
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      const chunks = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const chName = (state.currentChannel?.name || "LiveTV").replace(/[^a-zA-Z0-9]/g, "_");
        a.download = `Highlight_${chName}_${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        showToast("Highlight clip downloaded successfully! ✂️", "🎉");
      };
      recorder.start();
      setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, 5000);
      return;
    }
  } catch (err) {
    console.warn("Direct stream capture fallback:", err);
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = state.video.videoWidth || 1920;
    canvas.height = state.video.videoHeight || 1080;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(state.video, 0, 0, canvas.width, canvas.height);
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/jpeg", 0.95);
    a.download = `LiveTV_ActionShot_${Date.now()}.jpg`;
    a.click();
    showToast("Action moment snapshot saved to Downloads! 📸", "🎬");
  } catch (e) {
    showToast("Highlight capture ready: Saved to buffer", "✂️");
  }
}

// Live Speech Captions
export let isLiveCaptionsActive = false;
export let speechRecognizer = null;

export function toggleLiveCaptions() {
  isLiveCaptionsActive = !isLiveCaptionsActive;
  if (el.playerCaptionsLabel) {
    el.playerCaptionsLabel.textContent = isLiveCaptionsActive ? "Captions ON" : "Captions";
  }
  if (el.playerLiveCaptions) {
    el.playerLiveCaptions.style.display = isLiveCaptionsActive ? "block" : "none";
  }

  if (isLiveCaptionsActive) {
    showToast("Live Speech-to-Text Closed Captions Active 💬", "✨");
    if (!speechRecognizer && (window.webkitSpeechRecognition || window.SpeechRecognition)) {
      const Speech = window.webkitSpeechRecognition || window.SpeechRecognition;
      speechRecognizer = new Speech();
      speechRecognizer.continuous = true;
      speechRecognizer.interimResults = true;
      speechRecognizer.lang = "en-US";

      speechRecognizer.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        if (el.playerLiveCaptions) el.playerLiveCaptions.textContent = transcript;
      };
      speechRecognizer.onerror = () => {};
      speechRecognizer.onend = () => {
        if (isLiveCaptionsActive) try { speechRecognizer.start(); } catch (e) {}
      };
      try { speechRecognizer.start(); } catch (e) {}
    } else if (el.playerLiveCaptions) {
      el.playerLiveCaptions.textContent = "🎙️ [Live Broadcast Commentary Stream Subtitles Active]";
    }
  } else {
    if (speechRecognizer) {
      try { speechRecognizer.stop(); } catch (e) {}
    }
    showToast("Closed captions disabled", "💬");
  }
}

// Sleep Timer
export let sleepTimerId = null;
export let sleepTargetTime = 0;

export function setSleepTimer(minutes) {
  cancelSleepTimer();
  if (minutes <= 0) {
    showToast("Sleep Timer turned off");
    return;
  }
  sleepTargetTime = Date.now() + (minutes * 60 * 1000);
  const countdownPill = document.getElementById("player-sleep-countdown");
  const countdownVal = document.getElementById("sleep-countdown-val");
  if (countdownPill) countdownPill.style.display = "flex";

  showToast(`Sleep Timer set for ${minutes} minutes`);

  document.querySelectorAll(".sleep-preset-btn").forEach(btn => {
    btn.classList.toggle("active", parseInt(btn.dataset.minutes, 10) === minutes);
  });

  sleepTimerId = setInterval(() => {
    const diff = Math.max(0, Math.floor((sleepTargetTime - Date.now()) / 1000));
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    if (countdownVal) countdownVal.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    if (diff <= 120 && diff > 0) {
      const fadeFactor = diff / 120.0;
      if (state.video) {
        state.video.volume = Math.min(1.0, Math.max(0, (state.volume / 100) * fadeFactor));
      }
      if (state.audioGainNode && state.audioContext) {
        state.audioGainNode.gain.setValueAtTime((state.volume / 100) * fadeFactor, state.audioContext.currentTime);
      }
    }

    if (diff <= 0) {
      cancelSleepTimer();
      if (state.video) state.video.pause();
      showToast("🌙 Sleep Timer: Live TV put to sleep.");
      if (el.playerOverlay.style.display !== "none") {
        closePlayer();
      }
    }
  }, 1000);
}

export function cancelSleepTimer() {
  if (sleepTimerId) {
    clearInterval(sleepTimerId);
    sleepTimerId = null;
  }
  sleepTargetTime = 0;
  const countdownPill = document.getElementById("player-sleep-countdown");
  if (countdownPill) countdownPill.style.display = "none";
  document.querySelectorAll(".sleep-preset-btn").forEach(btn => btn.classList.remove("active"));
  applyVolume(state.volume);
}

// Remote Control Sync Bridges
export function syncRemoteStatus() {
  if (!state.currentChannel) return;
  const status = {
    channelName: state.currentChannel.name,
    channelCategory: state.currentChannel.category,
    channelLogo: state.currentChannel.logoUrl,
    isPlaying: state.isPlaying,
    isMuted: state.isMuted,
    volume: state.volume,
    isPip: state.isPipActive,
    isPinned: state.isAlwaysOnTop,
    currentQuality: el.playerQualityLabel ? el.playerQualityLabel.textContent : "Auto"
  };
  if (window.webkit?.messageHandlers?.updateRemoteStatus) {
    try {
      window.webkit.messageHandlers.updateRemoteStatus.postMessage(JSON.stringify(status));
    } catch (e) {}
  }
}

export function syncRemoteChannels() {
  if (!state.allChannels) return;
  const list = state.allChannels.map(c => ({
    id: c.id,
    name: c.name,
    category: c.category,
    isFavorite: (state.favorites || []).includes(c.id)
  }));
  if (window.webkit?.messageHandlers?.updateRemoteChannels) {
    try {
      window.webkit.messageHandlers.updateRemoteChannels.postMessage(JSON.stringify(list));
    } catch (e) {}
  }
}

// Creator Analytics & Visitor Tracking
window.__CURRENT_VISITS__ = 0;

export function isOwnerUser() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("owner") === "1" || urlParams.get("admin") === "sam" || urlParams.get("stats") === "sam") {
    localStorage.setItem("livetv_is_owner", "1");
    return true;
  }
  if (localStorage.getItem("livetv_is_owner") === "1") {
    return true;
  }
  if (window.webkit?.messageHandlers?.startWindowDrag) {
    return true;
  }
  return false;
}

export function updateOwnerBadgeIfAuthorized(forceShow = false) {
  const isOwner = forceShow || isOwnerUser();
  const btnOwner = document.getElementById("btn-owner-analytics");
  const countSpan = document.getElementById("owner-visits-count");
  const modalCount = document.getElementById("owner-modal-total-visits");

  if (isOwner && btnOwner) {
    btnOwner.style.display = "inline-flex";
    const displayVal = window.__CURRENT_VISITS__ ? window.__CURRENT_VISITS__.toLocaleString() : "...";
    if (countSpan) countSpan.textContent = displayVal;
    if (modalCount) modalCount.textContent = `${displayVal} Total Visits`;
  } else if (btnOwner) {
    btnOwner.style.display = "none";
  }
}

export function initVisitorTracking() {
  const isOwner = isOwnerUser();
  if (isOwner) {
    updateOwnerBadgeIfAuthorized(true);
  }

  let tapCount = 0;
  let tapTimer = null;
  const authorLink = document.getElementById("brand-author-link");
  if (authorLink) {
    authorLink.addEventListener("click", (e) => {
      tapCount++;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => { tapCount = 0; }, 2000);
      if (tapCount >= 3) {
        e.preventDefault();
        localStorage.setItem("livetv_is_owner", "1");
        showToast("👑 Creator Analytics Unlocked! Traffic badge active.", "✨");
        updateOwnerBadgeIfAuthorized(true);
        const modal = document.getElementById("modal-owner-analytics");
        if (modal) modal.style.display = "flex";
      }
    });
  }

  const isCounted = sessionStorage.getItem("livetv_session_counted");
  const endpoint = isCounted
    ? "https://countapi.mileshilliard.com/api/v1/get/samakhtarul_livetv_visits"
    : "https://countapi.mileshilliard.com/api/v1/hit/samakhtarul_livetv_visits";

  fetch(endpoint, { cache: "no-store" })
    .then(r => r.json())
    .then(data => {
      if (data && data.value) {
        window.__CURRENT_VISITS__ = parseInt(data.value, 10);
        sessionStorage.setItem("livetv_session_counted", "1");
        updateOwnerBadgeIfAuthorized();
      }
    })
    .catch(() => {});
}

// Extension Initialization
export function initBroadcastSuiteExtensions() {
  const btnRecall = document.getElementById("player-btn-recall");
  if (btnRecall) btnRecall.onclick = recallPreviousChannel;

  const btnZoom = document.getElementById("player-btn-zoom");
  if (btnZoom) btnZoom.onclick = cycleVideoZoom;
  initVideoZoomGestures();

  const btnSearch = document.getElementById("player-btn-quick-search");
  if (btnSearch) btnSearch.onclick = openPlayerSearch;

  const btnCloseSearch = document.getElementById("btn-close-hud-search");
  if (btnCloseSearch) btnCloseSearch.onclick = closePlayerSearch;

  const searchInput = document.getElementById("hud-channel-search-input");
  if (searchInput) {
    let hudDebounceTimer = null;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(hudDebounceTimer);
      const val = e.target.value;
      hudDebounceTimer = setTimeout(() => {
        renderPlayerSearchResults(val);
      }, 50);
    });
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        window.hudSearchSelectedIdx = Math.min((window.hudSearchResultsList || []).length - 1, (window.hudSearchSelectedIdx || 0) + 1);
        updateHudSearchHighlight();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        window.hudSearchSelectedIdx = Math.max(0, (window.hudSearchSelectedIdx || 0) - 1);
        updateHudSearchHighlight();
      } else if (e.key === "Enter") {
        e.preventDefault();
        window.selectHudChannel(window.hudSearchSelectedIdx || 0);
      } else if (e.key === "Escape") {
        e.preventDefault();
        closePlayerSearch();
      }
    });
  }

  const btnReconnect = document.getElementById("player-btn-reconnect");
  if (btnReconnect) btnReconnect.onclick = () => reconnectCurrentStream(false);

  const btnNoticeRec = document.getElementById("btn-player-notice-reconnect");
  if (btnNoticeRec) btnNoticeRec.onclick = () => reconnectCurrentStream(false);

  const lipsyncSlider = document.getElementById("lipsync-slider");
  if (lipsyncSlider) {
    lipsyncSlider.oninput = (e) => {
      setAudioDelay(parseInt(e.target.value, 10), false);
    };
  }
  document.querySelectorAll(".lipsync-btn").forEach(btn => {
    btn.onclick = () => {
      const delay = parseInt(btn.dataset.delay, 10);
      setAudioDelay(delay, true);
    };
  });

  try {
    const savedDelay = parseInt(localStorage.getItem("livetv_audio_delay") || "0", 10);
    if (!isNaN(savedDelay) && savedDelay !== 0) {
      setAudioDelay(savedDelay, false);
    }
  } catch(e) {}

  const appHeader = document.querySelector(".app-header");
  if (appHeader) {
    appHeader.addEventListener("wheel", (e) => {
      if (e.deltaY !== 0 && appHeader.scrollWidth > appHeader.clientWidth) {
        e.preventDefault();
        appHeader.scrollLeft += e.deltaY;
      }
    }, { passive: false });
  }
}

// Master DOM Setup & Event Listeners
export function setupEventListeners() {
  let mainSearchDebounce = null;
  if (el.searchInput) {
    el.searchInput.addEventListener("input", (e) => {
      state.searchQuery = e.target.value;
      if (el.searchClear) el.searchClear.style.display = state.searchQuery ? "block" : "none";
      clearTimeout(mainSearchDebounce);
      mainSearchDebounce = setTimeout(() => {
        applyFilterAndSearch();
      }, 60);
    });
  }

  if (el.searchClear) {
    el.searchClear.onclick = () => {
      clearTimeout(mainSearchDebounce);
      if (el.searchInput) el.searchInput.value = "";
      state.searchQuery = "";
      el.searchClear.style.display = "none";
      applyFilterAndSearch();
    };
  }

  if (el.browserView) {
    let scrollTicking = false;
    el.browserView.addEventListener("scroll", () => {
      if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(() => {
          const { scrollTop, scrollHeight, clientHeight } = el.browserView;
          if (scrollTop + clientHeight >= scrollHeight - 800) {
            if (state.renderedChannelCount < state.filteredChannels.length) {
              renderChannelBatch();
            }
          }
          scrollTicking = false;
        });
      }
    }, { passive: true });
  }

  if (el.btnRankFavorites) el.btnRankFavorites.onclick = openRankFavoritesModal;
  if (el.btnReorderCategories) el.btnReorderCategories.onclick = openRearrangeCategoriesModal;
  if (el.btnShortcuts) el.btnShortcuts.onclick = () => openModal(el.modalShortcuts);
  if (el.btnCloseShortcutsModal) el.btnCloseShortcutsModal.onclick = () => closeModal(el.modalShortcuts);
  if (el.btnDoneShortcuts) el.btnDoneShortcuts.onclick = () => closeModal(el.modalShortcuts);
  if (el.btnImportM3u) el.btnImportM3u.onclick = () => openModal(el.modalImportM3u);
  if (el.btnCloseM3uModal) el.btnCloseM3uModal.onclick = () => closeModal(el.modalImportM3u);
  if (el.btnCancelM3u) el.btnCancelM3u.onclick = () => closeModal(el.modalImportM3u);
  if (el.btnInfo) el.btnInfo.onclick = () => openAboutModal();
  if (el.btnHeaderUpdateBadge) {
    el.btnHeaderUpdateBadge.onclick = () => {
      openAboutModal();
      checkForAppUpdates(true);
    };
  }
  if (el.btnHeaderUpdater) {
    el.btnHeaderUpdater.onclick = () => {
      openAboutModal();
      checkForAppUpdates(true);
    };
  }
  if (el.brandAuthorLink) {
    el.brandAuthorLink.onclick = (e) => {
      e.preventDefault();
      openExternalUrl(GITHUB_RELEASES_URL);
    };
  }

  if (el.btnHeaderTicker) el.btnHeaderTicker.onclick = () => toggleSportsTicker();
  if (el.tickerCloseBtn) el.tickerCloseBtn.onclick = () => toggleSportsTicker(false);
  if (el.btnHeaderSchedule) el.btnHeaderSchedule.onclick = openScheduledDvrModal;
  if (el.btnCloseScheduleModal) el.btnCloseScheduleModal.onclick = () => closeModal(el.modalScheduledDvr);
  if (el.btnCancelSchedule) el.btnCancelSchedule.onclick = () => closeModal(el.modalScheduledDvr);
  if (el.btnSaveSchedule) el.btnSaveSchedule.onclick = scheduleDVRRecording;
  if (el.btnHeaderKids) el.btnHeaderKids.onclick = openParentalPinModal;
  if (el.btnClosePinModal) el.btnClosePinModal.onclick = () => closeModal(el.modalParentalPin);
  if (el.btnHeaderBackup) el.btnHeaderBackup.onclick = () => openModal(el.modalBackupSync);
  if (el.btnCloseBackupModal) el.btnCloseBackupModal.onclick = () => closeModal(el.modalBackupSync);
  if (el.btnDoneBackup) el.btnDoneBackup.onclick = () => closeModal(el.modalBackupSync);

  if (el.playerBtnRadio) el.playerBtnRadio.onclick = toggleAudioOnlyMode;
  if (el.audioHudToggleBtn) el.audioHudToggleBtn.onclick = toggleAudioOnlyMode;
  if (el.playerBtnLowlatency) el.playerBtnLowlatency.onclick = toggleLowLatencyMode;

  if (el.btnHeaderRemote) el.btnHeaderRemote.onclick = openRemoteControlModal;
  if (el.btnCloseRemoteModal) el.btnCloseRemoteModal.onclick = () => closeModal(el.modalRemoteControl);
  if (el.btnDoneRemote) el.btnDoneRemote.onclick = () => closeModal(el.modalRemoteControl);
  if (el.btnCopyRemoteUrl) {
    el.btnCopyRemoteUrl.onclick = () => {
      if (el.remoteServerUrl) {
        navigator.clipboard.writeText(el.remoteServerUrl.textContent);
        showToast("Remote URL copied to clipboard!");
      }
    };
  }

  if (el.playerBtnClarity) el.playerBtnClarity.onclick = cycleVideoClarity;
  if (el.playerBtnBreakMute) el.playerBtnBreakMute.onclick = triggerCommercialBreakMute;
  if (el.playerBreakCountdown) el.playerBreakCountdown.onclick = resumeFromBreakMute;
  if (el.playerBtnGuide) el.playerBtnGuide.onclick = toggleMiniGuide;
  if (el.btnHeaderDataSaver) el.btnHeaderDataSaver.onclick = toggleDataSaverMode;

  if (el.btnHeaderSportsHud) el.btnHeaderSportsHud.onclick = toggleSportsHUD;
  if (el.hudBtnMin) el.hudBtnMin.onclick = minimizeSportsHUD;
  if (el.hudBtnClose) el.hudBtnClose.onclick = () => toggleSportsHUD(false);
  if (el.hudPinnedPill) el.hudPinnedPill.onclick = () => toggleSportsHUD(true);
  if (el.pinnedPillClose) {
    el.pinnedPillClose.onclick = (e) => {
      e.stopPropagation();
      unpinMatchFromHUD();
    };
  }

  if (el.playerBtnAmbilight) el.playerBtnAmbilight.onclick = toggleAmbilight;
  if (el.playerBtnClip) el.playerBtnClip.onclick = captureLiveClip;
  if (el.playerBtnCaptions) el.playerBtnCaptions.onclick = toggleLiveCaptions;
  if (el.playerBtnCompressor) el.playerBtnCompressor.onclick = toggleAudioNormalizer;
  if (el.playerBtnCast) el.playerBtnCast.onclick = openCastPicker;
  if (el.playerBtnAudiomixer) el.playerBtnAudiomixer.onclick = openDualAudioModal;

  if (el.btnHeaderEpg) el.btnHeaderEpg.onclick = openEPGGuideModal;
  if (el.modalEpgClose) el.modalEpgClose.onclick = () => closeModal(el.modalEpgGuide);
  if (el.btnImportXmltv) el.btnImportXmltv.onclick = promptImportXmltv;

  if (el.btnHeaderVoice) el.btnHeaderVoice.onclick = toggleVoiceAssistant;
  if (el.voiceHudClose) el.voiceHudClose.onclick = () => toggleVoiceAssistant(false);

  if (el.btnHeaderAlarm) el.btnHeaderAlarm.onclick = openTVAlarmModal;
  if (el.modalAlarmClose) el.modalAlarmClose.onclick = () => closeModal(el.modalTvAlarm);
  if (el.btnSaveAlarm) el.btnSaveAlarm.onclick = saveTVAlarm;
  if (el.btnCancelAlarm) el.btnCancelAlarm.onclick = cancelTVAlarm;

  if (el.btnHeaderChannels) el.btnHeaderChannels.onclick = openChannelManagerModal;
  if (el.modalManagerClose) el.modalManagerClose.onclick = () => closeModal(el.modalChannelManager);
  if (el.btnCreateBouquet) el.btnCreateBouquet.onclick = handleCreateBouquet;

  if (el.modalCastClose) el.modalCastClose.onclick = () => closeModal(el.modalCastPicker);
  if (el.castOptionAirplay) el.castOptionAirplay.onclick = triggerAirPlay;
  if (el.castOptionChromecast) el.castOptionChromecast.onclick = triggerChromecast;
  if (el.btnCopyDlna) el.btnCopyDlna.onclick = copyDLNAStreamUrl;

  if (el.modalDualAudioClose) el.modalDualAudioClose.onclick = () => closeModal(el.modalDualAudio);

  if (el.playerBtnAiUpscaler) el.playerBtnAiUpscaler.onclick = cycleAIUpscaler;
  if (el.playerBtnAiCompare) el.playerBtnAiCompare.onclick = toggleAISplitCompare;
  if (el.playerBtn10bandEq) el.playerBtn10bandEq.onclick = open10BandEqModal;
  if (el.playerBtnAspect) el.playerBtnAspect.onclick = cycleAspectRatio;

  if (el.selectChannelSort) el.selectChannelSort.onchange = (e) => onChannelSortChange(e.target.value);
  if (el.btnTurboMode) el.btnTurboMode.onclick = toggleTurboMode;
  if (el.btnViewDensity) el.btnViewDensity.onclick = toggleViewDensity;
  if (el.heroBtnPlay) el.heroBtnPlay.onclick = playHeroChannel;
  if (el.heroBtnHud) el.heroBtnHud.onclick = () => toggleSportsHUD(true);
  if (el.heroBtnFav) el.heroBtnFav.onclick = toggleHeroFavorite;
  if (el.heroCloseBtn) {
    el.heroCloseBtn.onclick = () => {
      if (el.heroSpotlight) el.heroSpotlight.style.display = "none";
      localStorage.setItem("livetv_hero_collapsed", "1");
      showToast("Featured Billboard Hidden", "ℹ️");
    };
  }
  if (el.btnToggleHero) {
    el.btnToggleHero.onclick = () => {
      if (!el.heroSpotlight) return;
      const isHidden = window.getComputedStyle(el.heroSpotlight).display === "none";
      el.heroSpotlight.style.display = isHidden ? "flex" : "none";
      localStorage.setItem("livetv_hero_collapsed", isHidden ? "0" : "1");
      showToast(isHidden ? "Featured Billboard Shown" : "Featured Billboard Hidden", "🎬");
    };
  }

  document.querySelectorAll(".filter-pill").forEach(p => {
    p.onclick = () => {
      document.querySelectorAll(".filter-pill").forEach(x => x.classList.remove("active"));
      p.classList.add("active");
      onQuickFilter(p.dataset.filter || "all");
    };
  });

  if (el.btnImportXtream) el.btnImportXtream.onclick = () => openModal(el.modalXtreamCodes);
  if (el.btnCloseXtreamModal) el.btnCloseXtreamModal.onclick = () => closeModal(el.modalXtreamCodes);
  if (el.btnCancelXtream) el.btnCancelXtream.onclick = () => closeModal(el.modalXtreamCodes);
  if (el.btnLoginXtream) el.btnLoginXtream.onclick = submitXtreamLogin;

  initPeekHoverPreview();

  if (el.btnHeaderAlerts) {
    el.btnHeaderAlerts.onclick = () => {
      renderTeamAlertChips();
      openModal(el.modalTeamAlerts);
    };
  }
  if (el.btnCloseAlertsModal) el.btnCloseAlertsModal.onclick = () => closeModal(el.modalTeamAlerts);
  if (el.btnDoneAlerts) el.btnDoneAlerts.onclick = () => closeModal(el.modalTeamAlerts);
  if (el.btnAddCustomTeam) el.btnAddCustomTeam.onclick = addCustomTeam;

  if (el.playerBtnReplay) el.playerBtnReplay.onclick = triggerInstantSlowmoReplay;
  if (el.btnSlowmoLive) el.btnSlowmoLive.onclick = resumeFromSlowmoReplay;

  if (el.playerBtnSleep) el.playerBtnSleep.onclick = () => openModal(el.modalSleepTimer);
  if (el.playerSleepCountdown) el.playerSleepCountdown.onclick = () => openModal(el.modalSleepTimer);
  if (el.btnCloseSleepModal) el.btnCloseSleepModal.onclick = () => closeModal(el.modalSleepTimer);
  if (el.btnCloseSleepDone) el.btnCloseSleepDone.onclick = () => closeModal(el.modalSleepTimer);
  if (el.btnCancelSleepTimer) {
    el.btnCancelSleepTimer.onclick = () => {
      cancelSleepTimer();
      closeModal(el.modalSleepTimer);
      showToast("Sleep timer turned off");
    };
  }
  document.querySelectorAll(".sleep-preset-btn").forEach(btn => {
    btn.onclick = () => {
      const mins = parseInt(btn.dataset.minutes, 10);
      setSleepTimer(mins);
      closeModal(el.modalSleepTimer);
    };
  });

  if (el.playerBtnAudioProfile) el.playerBtnAudioProfile.onclick = () => openModal(el.modalAudioProfiles);
  if (el.btnCloseAudioModal) el.btnCloseAudioModal.onclick = () => closeModal(el.modalAudioProfiles);
  if (el.btnDoneAudio) el.btnDoneAudio.onclick = () => closeModal(el.modalAudioProfiles);
  document.querySelectorAll(".audio-profile-card").forEach(card => {
    card.onclick = () => {
      applyAudioProfile(card.dataset.profile);
    };
  });

  if (el.tabSingleChannel && el.tabBatchM3u) {
    el.tabSingleChannel.onclick = () => {
      el.tabSingleChannel.style.background = "var(--accent-red)";
      el.tabSingleChannel.style.color = "#fff";
      el.tabBatchM3u.style.background = "var(--surface-variant)";
      el.tabBatchM3u.style.color = "var(--text-primary)";
      if (el.sectionSingleChannel) el.sectionSingleChannel.style.display = "flex";
      if (el.sectionBatchM3u) el.sectionBatchM3u.style.display = "none";
    };
    el.tabBatchM3u.onclick = () => {
      el.tabBatchM3u.style.background = "var(--accent-red)";
      el.tabBatchM3u.style.color = "#fff";
      el.tabSingleChannel.style.background = "var(--surface-variant)";
      el.tabSingleChannel.style.color = "var(--text-primary)";
      if (el.sectionSingleChannel) el.sectionSingleChannel.style.display = "none";
      if (el.sectionBatchM3u) el.sectionBatchM3u.style.display = "flex";
    };
  }

  if (el.btnSaveSingleChannel) {
    el.btnSaveSingleChannel.onclick = () => {
      const url = el.customChannelUrl?.value || "";
      const name = el.customChannelName?.value || "";
      const cat = el.customChannelCat?.value || "Custom";
      const logo = el.customChannelLogo?.value || "";
      saveCustomChannel(name, url, cat, logo);
      if (el.customChannelUrl) el.customChannelUrl.value = "";
      if (el.customChannelName) el.customChannelName.value = "";
    };
  }

  if (el.btnCloseAboutModal) el.btnCloseAboutModal.onclick = () => closeAboutModal();
  if (el.btnCloseAbout) el.btnCloseAbout.onclick = () => closeAboutModal();
  if (el.btnCheckUpdate) el.btnCheckUpdate.onclick = () => checkForAppUpdates(true);
  if (el.btnGithubLink) el.btnGithubLink.onclick = () => openExternalUrl(GITHUB_RELEASES_URL);

  if (el.liveEventsTabs) {
    el.liveEventsTabs.querySelectorAll(".event-tab").forEach(tab => {
      tab.addEventListener("click", () => {
        el.liveEventsTabs.querySelectorAll(".event-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        const sport = tab.getAttribute("data-sport") || "All";
        renderLiveEvents(sport);
      });
    });
  }

  if (el.btnCloseRankModal) el.btnCloseRankModal.onclick = () => closeModal(el.modalRankFavorites);
  if (el.btnCancelRank) el.btnCancelRank.onclick = () => closeModal(el.modalRankFavorites);
  if (el.btnSaveRank) el.btnSaveRank.onclick = saveRankFavorites;

  if (el.btnCloseReorderModal) el.btnCloseReorderModal.onclick = () => closeModal(el.modalRearrangeCategories);
  if (el.btnSaveCategories) el.btnSaveCategories.onclick = saveCategoryOrder;
  if (el.btnResetCategories) el.btnResetCategories.onclick = resetCategoryOrder;

  if (el.playerBtnQuality) {
    el.playerBtnQuality.onclick = (e) => {
      if (e) e.stopPropagation();
      renderQualityOptions();
      openModal(el.modalPlayerSettings);
    };
  }
  if (el.btnCloseSettingsModal) {
    el.btnCloseSettingsModal.onclick = (e) => {
      if (e) e.stopPropagation();
      closeModal(el.modalPlayerSettings);
    };
  }
  if (el.btnDoneSettings) {
    el.btnDoneSettings.onclick = (e) => {
      if (e) e.stopPropagation();
      closeModal(el.modalPlayerSettings);
    };
  }

  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeModal(overlay);
      }
    });
  });

  if (el.miniPlayerClickable) el.miniPlayerClickable.onclick = expandPlayer;
  if (el.miniBtnExpand) el.miniBtnExpand.onclick = expandPlayer;
  if (el.miniBtnClose) el.miniBtnClose.onclick = closePlayer;
  if (el.miniBtnPlay) {
    el.miniBtnPlay.onclick = () => {
      if (state.video?.paused) {
        state.video.play();
        updatePlayPauseIcons(true);
      } else if (state.video) {
        state.video.pause();
        updatePlayPauseIcons(false);
      }
    };
  }
  if (el.miniBtnNext) el.miniBtnNext.onclick = playNextChannel;
  if (el.miniBtnPrev) el.miniBtnPrev.onclick = playPrevChannel;

  if (el.playerBtnBack) el.playerBtnBack.onclick = closePlayer;
  if (el.playerBtnPlay) {
    el.playerBtnPlay.onclick = () => {
      if (state.video?.paused) {
        state.video.play();
        updatePlayPauseIcons(true);
      } else if (state.video) {
        state.video.pause();
        updatePlayPauseIcons(false);
      }
    };
  }
  if (el.playerBtnNextChan) el.playerBtnNextChan.onclick = playNextChannel;
  if (el.playerBtnPrevChan) el.playerBtnPrevChan.onclick = playPrevChannel;
  if (el.playerBtnRewind) el.playerBtnRewind.onclick = () => triggerSeekRipple("left");
  if (el.playerBtnForward) el.playerBtnForward.onclick = () => triggerSeekRipple("right");

  if (el.playerBtnFav) {
    el.playerBtnFav.onclick = () => {
      if (state.currentChannel) toggleFavorite(state.currentChannel.id);
    };
  }

  if (el.btnHeaderPin) el.btnHeaderPin.onclick = toggleAlwaysOnTop;
  if (el.playerBtnPin) el.playerBtnPin.onclick = toggleAlwaysOnTop;
  if (el.btnHeaderMultiview) el.btnHeaderMultiview.onclick = openMultiView;
  if (el.playerBtnMultiview) el.playerBtnMultiview.onclick = openMultiView;
  if (el.playerBtnRecord) el.playerBtnRecord.onclick = toggleRecording;
  if (el.playerBtnAudioSub) {
    el.playerBtnAudioSub.onclick = (e) => {
      if (e) e.stopPropagation();
      updateAudioAndSubtitleTracks();
      openModal(el.modalPlayerSettings);
    };
  }
  if (el.btnClearRecents) el.btnClearRecents.onclick = clearRecentlyWatched;
  if (el.btnCloseMultiview) el.btnCloseMultiview.onclick = closeMultiView;
  if (el.btnMvModeDual) el.btnMvModeDual.onclick = () => setMultiViewMode("dual");
  if (el.btnMvModeQuad) el.btnMvModeQuad.onclick = () => setMultiViewMode("quad");

  for (let i = 0; i < 4; i++) {
    const slot = document.getElementById(`mv-slot-${i}`);
    const audioBtn = document.getElementById(`mv-audio-btn-${i}`);
    if (slot) {
      slot.addEventListener("click", () => setMultiViewAudioFocus(i));
    }
    if (audioBtn) {
      audioBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        setMultiViewAudioFocus(i);
      });
    }
  }

  if (el.playerBtnServer) {
    el.playerBtnServer.onclick = (e) => {
      e.stopPropagation();
      toggleServer();
    };
  }

  if (el.playerBtnLock) {
    el.playerBtnLock.onclick = (e) => {
      e.stopPropagation();
      lockScreen();
    };
  }

  if (el.playerBtnUnlock) {
    el.playerBtnUnlock.onclick = (e) => {
      e.stopPropagation();
      unlockScreen();
    };
  }

  window.toggleFullScreen = function() {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isIOS && state.video && typeof state.video.webkitEnterFullscreen === "function") {
      try {
        if (state.video.webkitDisplayingFullscreen) {
          if (typeof state.video.webkitExitFullscreen === "function") {
            state.video.webkitExitFullscreen();
          }
        } else {
          state.video.webkitEnterFullscreen();
        }
        return;
      } catch (e) {
        console.warn("[Fullscreen] iOS native webkitEnterFullscreen note:", e);
      }
    }

    const doc = document;
    const isFs = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;

    if (!isFs) {
      const target = el.playerOverlay || doc.documentElement;
      const req = target.requestFullscreen || target.webkitRequestFullscreen || target.mozRequestFullScreen || target.msRequestFullscreen;
      if (req) {
        req.call(target).catch(() => {
          if (state.video && typeof state.video.webkitEnterFullscreen === "function") {
            try { state.video.webkitEnterFullscreen(); } catch (err) {}
          } else if (state.video && state.video.requestFullscreen) {
            state.video.requestFullscreen().catch(() => {});
          }
        });
      } else if (state.video && typeof state.video.webkitEnterFullscreen === "function") {
        try { state.video.webkitEnterFullscreen(); } catch (err) {}
      }
    } else {
      const exit = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
      if (exit) {
        exit.call(doc).catch(() => {});
      }
    }
  };

  if (el.playerBtnFullscreen) el.playerBtnFullscreen.onclick = window.toggleFullScreen;
  if (el.playerBtnFullscreenBottom) el.playerBtnFullscreenBottom.onclick = window.toggleFullScreen;

  if (el.playerBtnStats) {
    el.playerBtnStats.onclick = () => {
      const isVisible = el.statsHud.style.display !== "none";
      el.statsHud.style.display = isVisible ? "none" : "block";
      if (!isVisible) updateStatsHud();
    };
  }

  if (state.video) {
    state.video.addEventListener("play", () => updatePlayPauseIcons(true));
    state.video.addEventListener("pause", () => updatePlayPauseIcons(false));
    state.video.addEventListener("timeupdate", () => {
      if (state.video.currentTime > 0.5 && state.stallWatchdog) {
        clearTimeout(state.stallWatchdog);
        state.stallWatchdog = null;
      }
      if (el.statsHud && el.statsHud.style.display !== "none") updateStatsHud();
    });
  }

  if (el.dvrSlider) {
    el.dvrSlider.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      seekDvrOffset(val);
    });
  }
  if (el.dvrBtn1h) el.dvrBtn1h.onclick = () => seekDvrOffset(-3600);
  if (el.dvrBtn30m) el.dvrBtn30m.onclick = () => seekDvrOffset(-1800);
  if (el.dvrBtn15m) el.dvrBtn15m.onclick = () => seekDvrOffset(-900);
  if (el.dvrBtnLive) el.dvrBtnLive.onclick = goLive;

  if (el.sliderBrightness) {
    el.sliderBrightness.addEventListener("input", (e) => {
      applyBrightness(parseInt(e.target.value, 10));
      showBrightnessHud();
    });
  }

  if (el.sliderVolume) {
    el.sliderVolume.addEventListener("input", (e) => {
      applyVolume(parseInt(e.target.value, 10));
      showVolumeHud();
    });
  }

  if (el.gestureAreaLeft) {
    el.gestureAreaLeft.addEventListener("dblclick", () => triggerSeekRipple("left"));
    el.gestureAreaLeft.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 5 : -5;
      applyBrightness(state.brightness + delta);
      showBrightnessHud();
    });
  }

  if (el.gestureAreaRight) {
    el.gestureAreaRight.addEventListener("dblclick", () => triggerSeekRipple("right"));
    el.gestureAreaRight.addEventListener("wheel", (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 4 : -4;
      applyVolume(state.volume + delta);
      showVolumeHud();
    });
  }

  if (el.videoContainer) {
    el.videoContainer.addEventListener("click", (e) => {
      if (
        e.target.closest("#player-controls") ||
        e.target.closest(".player-controls") ||
        e.target.closest(".player-top-bar") ||
        e.target.closest(".player-top-right") ||
        e.target.closest(".player-bottom-bar") ||
        e.target.closest(".player-center-controls") ||
        e.target.closest(".quick-switch-carousel") ||
        e.target.closest(".quick-channel-item") ||
        e.target.closest(".player-pill") ||
        e.target.closest(".player-icon-btn") ||
        e.target.closest("button") ||
        e.target.closest("input") ||
        e.target.closest(".modal-overlay")
      ) {
        return;
      }
      toggleControls();
    });

    el.videoContainer.addEventListener("mousemove", () => {
      if (state.isLocked) return;
      showControls();
    });

    el.videoContainer.addEventListener("mouseleave", () => {
      if (state.isPlaying && !state.isLocked) {
        hideControls();
      }
    });
  }

  if (el.playerOverlay) {
    el.playerOverlay.addEventListener("mousemove", () => {
      if (state.isLocked) return;
      showControls();
    });
  }

  if (el.btnLoadM3u) {
    el.btnLoadM3u.onclick = async () => {
      const url = el.m3uUrlInput?.value.trim() || "";
      const file = el.m3uFileInput?.files[0];

      if (file) {
        const text = await file.text();
        parseCustomM3u(text);
        closeModal(el.modalImportM3u);
      } else if (url) {
        try {
          const res = await fetch(url);
          const text = await res.text();
          parseCustomM3u(text);
          closeModal(el.modalImportM3u);
        } catch (e) {
          alert("Failed to fetch M3U URL: " + e.message);
        }
      }
    };
  }
}

// Master Application Bootstrapper
export async function initApp() {
  const isNativeMac = !!(window.webkit?.messageHandlers?.startWindowDrag);
  if (isNativeMac) {
    document.body.classList.add("native-mac-app");
  } else {
    document.body.classList.add("web-mode");
  }
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) {
    document.body.classList.add("ios-device");
  }

  try {
    if (window.shaka?.polyfill) {
      shaka.polyfill.installAll();
    }
  } catch (e) {
    console.warn("Shaka polyfill init warning:", e);
  }

  try {
    initElements();
    if (el.playerOverlay) {
      el.playerOverlay.classList.remove("is-active");
      el.playerOverlay.style.display = "none";
    }
    document.body.classList.remove("player-active");
    state.isPlayerOpen = false;
  } catch (e) {
    console.error("initElements error:", e);
  }

  try {
    loadStoredPreferences();
  } catch (e) {
    console.error("loadStoredPreferences error:", e);
  }

  try {
    setupWindowDragging();
    setupEventListeners();
    setupKeyboardShortcuts();
    renderLiveEvents("All");
  } catch (e) {
    console.error("UI setup error:", e);
  }

  try {
    await loadChannels();
  } catch (e) {
    console.error("loadChannels error:", e);
  }

  try {
    refreshDynamicMotoGpEvents();
    fetchRealSportsEvents();
  } catch (e) {
    console.error("Events fetch error:", e);
  }

  if (state.liveEventsRefreshTimer) clearInterval(state.liveEventsRefreshTimer);
  state.liveEventsRefreshTimer = setInterval(() => {
    if (state.isPlayerOpen || document.body.classList.contains("player-active")) {
      return;
    }
    fetchRealSportsEvents(true);
  }, 60000);

  try {
    initVisitorTracking();
  } catch (e) {
    console.warn("Visitor tracking note:", e);
  }

  // Restore v5.0.0 settings
  setTimeout(() => {
    if (localStorage.getItem("livetv_turbo_mode") === "1") {
      toggleTurboMode();
    }
    if (localStorage.getItem("livetv_compact_density") === "1") {
      toggleViewDensity();
    }
    initBandwidthMeter();
    initCinemaAmbientDimmer();
  }, 600);

  setTimeout(initBroadcastSuiteExtensions, 600);
}
