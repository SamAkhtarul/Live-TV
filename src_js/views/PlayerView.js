/**
 * Live TV - Video Player Controls & UI Views
 * Architecture: View / PlayerView
 */

import { state } from "../models/State.js";
import { el } from "./Elements.js";
import { STANDARD_QUALITIES } from "../models/Constants.js";
import { escapeHtml, showToast } from "../utils/DomUtils.js";
import { persistAllPreferences, getChannelEPG } from "../models/ChannelModel.js";
import { closeModal } from "./ModalView.js";
import { playNextChannel, playPrevChannel } from "../controllers/PlayerController.js";
import { updateRecallButton } from "../controllers/NavigationController.js";

export let isHoveringTopControls = false;
export let isInteractingWithControls = false;
export let controlsInteractionTimer = null;

export function updatePlayPauseIcons(isPlaying) {
  state.isPlaying = isPlaying;
  const playSvg = `<path d="M8 5v14l11-7z"/>`;
  const pauseSvg = `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>`;

  if (el.playPauseSvg) el.playPauseSvg.innerHTML = isPlaying ? pauseSvg : playSvg;
  if (el.miniBtnPlay) el.miniBtnPlay.textContent = isPlaying ? "⏸" : "▶";
}

// Update Player Favorite Button
export function updatePlayerFavButton() {
  if (!state.currentChannel || !el.playerBtnFav) return;
  const isFav = (state.favorites || []).includes(state.currentChannel.id);
  if (isFav) {
    el.playerBtnFav.classList.add("is-fav");
    const rank = state.favorites.indexOf(state.currentChannel.id) + 1;
    if (el.playerFavLabel) el.playerFavLabel.textContent = `Ranked #${rank}`;
  } else {
    el.playerBtnFav.classList.remove("is-fav");
    if (el.playerFavLabel) el.playerFavLabel.textContent = "Favorite";
  }
}

// 1-Hour Timeshift DVR Logic
export function seekDvrOffset(seconds) {
  if (!state.video) return;

  // Clamp offset between -3600 (1 hour behind) and 0 (Live)
  const offset = Math.max(-3600, Math.min(0, seconds));
  state.dvrOffsetSeconds = offset;

  if (state.hls && state.hls.liveSyncPosition) {
    const liveEdge = state.hls.liveSyncPosition;
    const target = Math.max(0, liveEdge + offset);
    state.video.currentTime = target;
  } else {
    state.video.currentTime = Math.max(0, state.video.currentTime + offset);
  }

  state.isLive = offset >= -5;
  updateDvrDisplay();
}

export function goLive() {
  state.dvrOffsetSeconds = 0;
  state.isLive = true;
  if (state.hls && state.hls.liveSyncPosition) {
    state.video.currentTime = state.hls.liveSyncPosition;
  } else if (state.video && state.video.seekable && state.video.seekable.length > 0) {
    state.video.currentTime = state.video.seekable.end(state.video.seekable.length - 1);
  }
  updateDvrDisplay();
}

export function updateDvrDisplay() {
  if (!el.dvrSlider) return;
  const offset = state.dvrOffsetSeconds;
  el.dvrSlider.value = offset;

  if (state.isLive || offset >= -5) {
    if (el.dvrOffsetLabel) {
      el.dvrOffsetLabel.textContent = "LIVE";
      el.dvrOffsetLabel.classList.remove("behind");
    }
    if (el.playerDvrOffsetPill) {
      el.playerDvrOffsetPill.textContent = "LIVE";
      el.playerDvrOffsetPill.style.color = "#00ff88";
    }
    if (el.dvrBtnLive) {
      el.dvrBtnLive.style.opacity = "1";
      el.dvrBtnLive.style.animation = "pulse 1.5s infinite ease-in-out";
    }
  } else {
    const mins = Math.floor(Math.abs(offset) / 60);
    const secs = Math.floor(Math.abs(offset) % 60);
    const text = `-${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (el.dvrOffsetLabel) {
      el.dvrOffsetLabel.textContent = text;
      el.dvrOffsetLabel.classList.add("behind");
    }
    if (el.playerDvrOffsetPill) {
      el.playerDvrOffsetPill.textContent = text;
      el.playerDvrOffsetPill.style.color = "var(--gold)";
    }
    if (el.dvrBtnLive) {
      el.dvrBtnLive.style.animation = "none";
    }
  }
}

export function renderQualityOptions() {
  if (!el.qualityOptionsContainer) return;
  el.qualityOptionsContainer.innerHTML = "";

  STANDARD_QUALITIES.forEach(q => {
    const isCurrent = state.selectedQualityHeight === q.height;
    const btn = document.createElement("button");
    btn.className = `list-item-row ${isCurrent ? "active-setting" : ""}`;
    btn.style.cursor = "pointer";
    btn.style.width = "100%";
    btn.style.textAlign = "left";

    btn.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 2px;">
        <span style="font-weight: 700; font-size: 13px; color: ${isCurrent ? 'var(--accent-red)' : '#fff'};">
          ${q.label} ${isCurrent ? "✓" : ""}
        </span>
        <span style="color: var(--text-secondary); font-size: 11px;">${q.desc || ''}</span>
      </div>
    `;

    btn.onclick = () => {
      setStreamQuality(q.height, q.label);
      closeModal(el.modalPlayerSettings);
    };

    el.qualityOptionsContainer.appendChild(btn);
  });
}

export function setStreamQuality(targetHeight, label) {
  state.selectedQualityHeight = targetHeight;

  if (targetHeight === -1) {
    if (state.hls) state.hls.currentLevel = -1;
    if (state.shakaPlayer) state.shakaPlayer.configure({ abr: { enabled: true } });
    if (el.playerQualityLabel) el.playerQualityLabel.textContent = "Auto";
    return;
  }

  // If HLS.js has variant levels, switch to closest matching level
  if (state.hls && state.hls.levels && state.hls.levels.length > 0) {
    let bestIdx = 0;
    let minDiff = Infinity;
    state.hls.levels.forEach((lvl, idx) => {
      const h = lvl.height || 720;
      const diff = Math.abs(h - targetHeight);
      if (diff < minDiff) {
        minDiff = diff;
        bestIdx = idx;
      }
    });
    state.hls.currentLevel = bestIdx;
  }

  // If Shaka Player has variant tracks, switch to closest matching track
  if (state.shakaPlayer) {
    const tracks = state.shakaPlayer.getVariantTracks();
    if (tracks && tracks.length > 0) {
      let bestTrack = tracks[0];
      let minDiff = Infinity;
      tracks.forEach(t => {
        const h = t.height || 720;
        const diff = Math.abs(h - targetHeight);
        if (diff < minDiff) {
          minDiff = diff;
          bestTrack = t;
        }
      });
      state.shakaPlayer.configure({ abr: { enabled: false } });
      state.shakaPlayer.selectVariantTrack(bestTrack, true);
    }
  }

  const shortName = targetHeight >= 2160 ? "4K UHD" :
                    targetHeight >= 1440 ? "1440p 2K" :
                    targetHeight >= 1080 ? "1080p HD" :
                    targetHeight >= 720 ? "720p HD" :
                    targetHeight >= 480 ? "480p SD" :
                    `${targetHeight}p`;
  if (el.playerQualityLabel) el.playerQualityLabel.textContent = shortName;
}

// Double-Click / Tap 10s Seek Ripple Handlers
export function triggerSeekRipple(direction) {
  if (direction === "left") {
    seekDvrOffset(state.dvrOffsetSeconds - 10);
    if (el.doubleTapLeft) {
      el.doubleTapLeft.classList.add("visible");
      setTimeout(() => el.doubleTapLeft.classList.remove("visible"), 450);
    }
  } else {
    seekDvrOffset(state.dvrOffsetSeconds + 10);
    if (el.doubleTapRight) {
      el.doubleTapRight.classList.add("visible");
      setTimeout(() => el.doubleTapRight.classList.remove("visible"), 450);
    }
  }
}

// Gesture HUDs: Brightness & Volume
export function applyBrightness(val) {
  state.brightness = Math.max(20, Math.min(150, val));
  if (state.video) {
    if (state.brightness === 100) {
      state.video.style.filter = "";
    } else {
      state.video.style.filter = `brightness(${state.brightness / 100})`;
    }
  }
  if (el.sliderBrightness) el.sliderBrightness.value = state.brightness;
  if (el.hudBrightnessVal) el.hudBrightnessVal.textContent = `${state.brightness}%`;
  persistAllPreferences();
}

export function showBrightnessHud() {
  if (!el.hudBrightness) return;
  el.hudBrightness.classList.add("visible");
  clearTimeout(el.hudBrightness.timer);
  el.hudBrightness.timer = setTimeout(() => el.hudBrightness.classList.remove("visible"), 1200);
}

export function showVolumeHud() {
  if (!el.hudVolume) return;
  el.hudVolume.classList.add("visible");
  clearTimeout(el.hudVolume.timer);
  el.hudVolume.timer = setTimeout(() => el.hudVolume.classList.remove("visible"), 1200);
}

// Aspect Ratio Pan & Crop Engine
const aspectModes = [
  { label: "16:9", fit: "contain" },
  { label: "Fill", fit: "cover" },
  { label: "4:3", fit: "contain", scaleX: 0.75 },
  { label: "21:9", fit: "cover", scaleY: 0.75 }
];
let currentAspectIdx = 0;

export function cycleAspectRatio() {
  currentAspectIdx = (currentAspectIdx + 1) % aspectModes.length;
  const m = aspectModes[currentAspectIdx];
  if (state.video) {
    state.video.style.objectFit = m.fit;
    if (m.scaleX) {
      state.video.style.transform = `scaleX(${m.scaleX})`;
    } else if (m.scaleY) {
      state.video.style.transform = `scaleY(${m.scaleY})`;
    } else {
      state.video.style.transform = "none";
    }
  }
  if (el.playerAspectLabel) el.playerAspectLabel.textContent = m.label;
  showToast(`Aspect Ratio: ${m.label} ⛶`, "📺");
}

export function notifyControlsInteraction() {
  isInteractingWithControls = true;
  clearTimeout(state.controlsTimeout);
  clearTimeout(controlsInteractionTimer);
  if (el.playerControls && !el.playerControls.classList.contains("visible")) {
    el.playerControls.classList.add("visible");
  }
}

export function releaseControlsInteraction(graceMs = 4000) {
  clearTimeout(controlsInteractionTimer);
  controlsInteractionTimer = setTimeout(() => {
    isInteractingWithControls = false;
    if (state.isPlaying && !state.isLocked && !isHoveringTopControls) {
      clearTimeout(state.controlsTimeout);
      state.controlsTimeout = setTimeout(() => {
        if (!isInteractingWithControls && !isHoveringTopControls) {
          hideControls();
        }
      }, 3500);
    }
  }, graceMs);
}

export function showControls() {
  if (state.isLocked || !el.playerControls) return;
  el.playerControls.classList.add("visible");
  if (el.playerOverlay) el.playerOverlay.classList.remove("controls-hidden");
  document.body.classList.remove("controls-hidden");
  clearTimeout(state.controlsTimeout);

  if (isHoveringTopControls || isInteractingWithControls) return;

  state.controlsTimeout = setTimeout(() => {
    if (state.isPlaying && !state.isLocked && !isHoveringTopControls && !isInteractingWithControls) {
      hideControls();
    }
  }, 3500);
}

export function hideControls() {
  if (isInteractingWithControls || isHoveringTopControls || !el.playerControls) return;
  el.playerControls.classList.remove("visible");
  if (el.playerOverlay) el.playerOverlay.classList.add("controls-hidden");
  document.body.classList.add("controls-hidden");
  clearTimeout(state.controlsTimeout);
}

export function toggleControls() {
  if (state.isLocked) {
    toggleLockOverlay();
    return;
  }
  if (el.playerControls && el.playerControls.classList.contains("visible")) {
    isInteractingWithControls = false;
    isHoveringTopControls = false;
    clearTimeout(controlsInteractionTimer);
    clearTimeout(state.controlsTimeout);
    hideControls();
  } else {
    showControls();
  }
}

export function lockScreen() {
  state.isLocked = true;
  if (el.playerControls) {
    el.playerControls.classList.add("is-locked");
    el.playerControls.classList.remove("visible");
  }
  clearTimeout(state.controlsTimeout);
  if (el.statsHud) el.statsHud.style.display = "none";
  showLockOverlay();
}

export function unlockScreen() {
  state.isLocked = false;
  if (el.playerControls) {
    el.playerControls.classList.remove("is-locked");
  }
  hideLockOverlay();
  showControls();
}

export function showLockOverlay() {
  if (!el.playerLockOverlay) return;
  el.playerLockOverlay.style.display = "block";
  void el.playerLockOverlay.offsetHeight;
  el.playerLockOverlay.style.opacity = "1";
  clearTimeout(state.lockTimeout);
  state.lockTimeout = setTimeout(() => {
    if (state.isLocked) {
      hideLockOverlay();
    }
  }, 3000);
}

export function hideLockOverlay() {
  if (!el.playerLockOverlay) return;
  el.playerLockOverlay.style.opacity = "0";
  clearTimeout(state.lockTimeout);
  setTimeout(() => {
    if (el.playerLockOverlay && el.playerLockOverlay.style.opacity === "0") {
      el.playerLockOverlay.style.display = "none";
    }
  }, 250);
}

export function toggleLockOverlay() {
  if (!el.playerLockOverlay) return;
  if (el.playerLockOverlay.style.display === "none" || el.playerLockOverlay.style.opacity === "0") {
    showLockOverlay();
  } else {
    hideLockOverlay();
  }
}

export function expandPlayer() {
  if (el.miniPlayerBar) el.miniPlayerBar.style.display = "none";
  if (el.playerOverlay) {
    el.playerOverlay.classList.add("is-active");
    el.playerOverlay.style.display = "flex";
  }
  document.body.classList.add("player-active");
  state.isPlayerOpen = true;
  showControls();
  if (typeof updateRecallButton === "function") updateRecallButton();
}

export function updatePlayerEpg(channel) {
  if (!el.playerEpgNow || !el.playerEpgBar || !el.playerEpgNext) return;
  const epg = getChannelEPG(channel);
  el.playerEpgNow.textContent = epg.current;
  el.playerEpgBar.style.width = `${epg.progress}%`;
  el.playerEpgNext.textContent = `Next: ${epg.next} (in ${epg.remainingMins}m)`;
}

export function updateAudioAndSubtitleTracks() {
  if (!el.audioOptionsContainer || !el.subtitleOptionsContainer) return;
  el.audioOptionsContainer.innerHTML = "";
  el.subtitleOptionsContainer.innerHTML = "";

  if (state.hls && state.hls.audioTracks && state.hls.audioTracks.length > 0) {
    state.hls.audioTracks.forEach((track, idx) => {
      const btn = document.createElement("button");
      btn.className = `list-item-row ${state.hls.audioTrack === idx ? 'active-setting' : ''}`;
      btn.style.cursor = "pointer";
      btn.style.width = "100%";
      const lang = track.lang || track.name || `Audio Track ${idx + 1}`;
      btn.innerHTML = `<span>🔊 ${escapeHtml(lang)}</span><span style="color:var(--text-secondary); font-size:11px;">${track.audioCodec || 'Stereo'}</span>`;
      btn.onclick = () => {
        state.hls.audioTrack = idx;
        updateAudioAndSubtitleTracks();
        showToast(`Switched audio to ${lang}`, "🔊");
      };
      el.audioOptionsContainer.appendChild(btn);
    });
  } else {
    el.audioOptionsContainer.innerHTML = `<div style="font-size: 11.5px; color: var(--text-secondary); padding: 4px 0;">Primary Audio Feed (Default)</div>`;
  }

  if (state.hls && state.hls.subtitleTracks && state.hls.subtitleTracks.length > 0) {
    const offBtn = document.createElement("button");
    offBtn.className = `list-item-row ${state.hls.subtitleTrack === -1 ? 'active-setting' : ''}`;
    offBtn.style.cursor = "pointer";
    offBtn.style.width = "100%";
    offBtn.innerHTML = `<span>✕ Subtitles Off</span>`;
    offBtn.onclick = () => {
      state.hls.subtitleTrack = -1;
      updateAudioAndSubtitleTracks();
      showToast("Subtitles turned off", "💬");
    };
    el.subtitleOptionsContainer.appendChild(offBtn);

    state.hls.subtitleTracks.forEach((track, idx) => {
      const btn = document.createElement("button");
      btn.className = `list-item-row ${state.hls.subtitleTrack === idx ? 'active-setting' : ''}`;
      btn.style.cursor = "pointer";
      btn.style.width = "100%";
      const lang = track.lang || track.name || `Subtitle ${idx + 1}`;
      btn.innerHTML = `<span>💬 ${escapeHtml(lang)}</span>`;
      btn.onclick = () => {
        state.hls.subtitleTrack = idx;
        updateAudioAndSubtitleTracks();
        showToast(`Subtitles set to ${lang}`, "💬");
      };
      el.subtitleOptionsContainer.appendChild(btn);
    });
  } else {
    el.subtitleOptionsContainer.innerHTML = `<div style="font-size: 11.5px; color: var(--text-secondary); padding: 4px 0;">No Subtitle Tracks Found in Stream</div>`;
  }
}

export function updateMediaSessionMetadata(channel) {
  if (!('mediaSession' in navigator) || !channel) return;
  try {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: channel.name || "Live TV",
      artist: `Live TV • ${channel.category || "Live"}`,
      album: `CH ${channel.channelNumber || channel.ch || "Live"}`,
      artwork: channel.logoUrl ? [
        { src: channel.logoUrl, sizes: '96x96', type: 'image/png' },
        { src: channel.logoUrl, sizes: '256x256', type: 'image/png' },
        { src: channel.logoUrl, sizes: '512x512', type: 'image/png' }
      ] : []
    });

    navigator.mediaSession.setActionHandler('play', () => {
      if (state.video) {
        state.video.play().catch(() => {});
        updatePlayPauseIcons(true);
      }
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      if (state.video) {
        state.video.pause();
        updatePlayPauseIcons(false);
      }
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => playPrevChannel());
    navigator.mediaSession.setActionHandler('nexttrack', () => playNextChannel());
    navigator.mediaSession.setActionHandler('seekbackward', () => seekDvrOffset(state.dvrOffsetSeconds - 10));
    navigator.mediaSession.setActionHandler('seekforward', () => seekDvrOffset(state.dvrOffsetSeconds + 10));
  } catch (e) {
    console.warn("MediaSession API update notice:", e);
  }
}

export function triggerInstantSlowmoReplay() {
  if (!state.video) return;
  const targetTime = Math.max(0, state.video.currentTime - 10);
  state.video.currentTime = targetTime;
  state.video.playbackRate = 0.5;

  if (el.playerSlowmoBanner) {
    el.playerSlowmoBanner.style.display = "flex";
  }
  showToast("⏱️ Slow-Mo Replay (0.5×) • Reviewing Action", "⏱️");
}

export function resumeFromSlowmoReplay() {
  if (!state.video) return;
  state.video.playbackRate = 1.0;
  if (el.playerSlowmoBanner) {
    el.playerSlowmoBanner.style.display = "none";
  }
  showToast("Resumed Live edge ▶");
}

let cinemaDimTimer = null;
export function initCinemaAmbientDimmer() {
  const container = document.getElementById("player-container");
  if (!container) return;
  const resetDim = () => {
    container.classList.remove("cinema-dimmed");
    if (cinemaDimTimer) clearTimeout(cinemaDimTimer);
    if (!state.video || state.video.paused) return;
    cinemaDimTimer = setTimeout(() => {
      if (!state.video.paused && !state.isControlsHovered) {
        container.classList.add("cinema-dimmed");
      }
    }, 4000);
  };
  container.addEventListener("mousemove", resetDim);
  container.addEventListener("click", resetDim);
}
