/**
 * Live TV - Audio Booster, 10-Band EQ & Sound Engine Controller
 * Architecture: Controller / AudioController
 */

import { state } from "../models/State.js";
import { el } from "../views/Elements.js";
import { AUDIO_PROFILES as PROFILES_MAP, EQ_BANDS, BREAK_DURATIONS } from "../models/Constants.js";
import { showToast } from "../utils/DomUtils.js";
import { persistAllPreferences } from "../models/ChannelModel.js";
import { closePlayer } from "./PlayerController.js";

export const AUDIO_PROFILES = {
  normal: { id: "normal", name: "Normal (Flat)", icon: "🎧", low: 0, mid: 0, high: 0, compRatio: 4, compThresh: -24 },
  stadium: { id: "stadium", name: "Stadium (Sports)", icon: "🏟️", low: 3.5, mid: 4.5, high: 2.0, compRatio: 6, compThresh: -20 },
  vocal: { id: "vocal", name: "Dialogue Clarity", icon: "🎙️", low: -4.0, mid: 5.5, high: 0.5, compRatio: 8, compThresh: -18 },
  night: { id: "night", name: "Night Mode", icon: "🌙", low: -1.0, mid: 1.0, high: -2.0, compRatio: 14, compThresh: -32 },
  music: { id: "music", name: "Music / Concert", icon: "🎵", low: 5.0, mid: -1.5, high: 4.0, compRatio: 3, compThresh: -22 }
};

export function initAudioBooster() {
  if (state.audioContext || !state.video) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const source = ctx.createMediaElementSource(state.video);

    const lowShelf = ctx.createBiquadFilter();
    lowShelf.type = "lowshelf";
    lowShelf.frequency.setValueAtTime(120, ctx.currentTime);
    lowShelf.gain.setValueAtTime(0, ctx.currentTime);

    const midPeak = ctx.createBiquadFilter();
    midPeak.type = "peaking";
    midPeak.frequency.setValueAtTime(2200, ctx.currentTime);
    midPeak.Q.setValueAtTime(1.0, ctx.currentTime);
    midPeak.gain.setValueAtTime(0, ctx.currentTime);

    const highShelf = ctx.createBiquadFilter();
    highShelf.type = "highshelf";
    highShelf.frequency.setValueAtTime(8000, ctx.currentTime);
    highShelf.gain.setValueAtTime(0, ctx.currentTime);

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-24, ctx.currentTime);
    compressor.knee.setValueAtTime(30, ctx.currentTime);
    compressor.ratio.setValueAtTime(12, ctx.currentTime);
    compressor.attack.setValueAtTime(0.003, ctx.currentTime);
    compressor.release.setValueAtTime(0.25, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(1.0, ctx.currentTime);

    const delay = ctx.createDelay(3.0);
    const initialDelay = Math.max(0, (state.audioDelayMs || 0) / 1000);
    delay.delayTime.setValueAtTime(initialDelay, ctx.currentTime);

    source.connect(lowShelf);
    lowShelf.connect(midPeak);
    midPeak.connect(highShelf);
    highShelf.connect(compressor);
    compressor.connect(gain);
    gain.connect(delay);
    delay.connect(ctx.destination);

    state.audioContext = ctx;
    state.audioGainNode = gain;
    state.audioDelayNode = delay;
    state.dynamicsCompressor = compressor;
    state.eqLowShelf = lowShelf;
    state.eqMidPeak = midPeak;
    state.eqHighShelf = highShelf;

    if (state.currentAudioProfile && state.currentAudioProfile !== "normal") {
      applyAudioProfile(state.currentAudioProfile, false);
    }
  } catch (e) {
    console.warn("AudioContext initialization note:", e);
  }
}

export function applyAudioProfile(key, notify = true) {
  const profile = AUDIO_PROFILES[key] || AUDIO_PROFILES.normal;
  state.currentAudioProfile = profile.id;

  if (!state.audioContext) initAudioBooster();

  if (state.audioContext && state.eqLowShelf) {
    const t = state.audioContext.currentTime;
    state.eqLowShelf.gain.setTargetAtTime(profile.low, t, 0.05);
    state.eqMidPeak.gain.setTargetAtTime(profile.mid, t, 0.05);
    state.eqHighShelf.gain.setTargetAtTime(profile.high, t, 0.05);
    state.dynamicsCompressor.ratio.setTargetAtTime(profile.compRatio, t, 0.05);
    state.dynamicsCompressor.threshold.setTargetAtTime(profile.compThresh, t, 0.05);
  }

  const label = document.getElementById("player-audio-profile-label");
  if (label) label.textContent = profile.name.split(" ")[0];

  document.querySelectorAll(".audio-profile-card").forEach(card => {
    card.classList.toggle("active", card.dataset.profile === profile.id);
  });

  if (notify) showToast(`Audio Profile: ${profile.icon} ${profile.name}`);
}

export function cycleNextAudioProfile() {
  const keys = Object.keys(AUDIO_PROFILES);
  const currentIdx = keys.indexOf(state.currentAudioProfile || "normal");
  const nextKey = keys[(currentIdx + 1) % keys.length];
  applyAudioProfile(nextKey);
}

export function applyVolume(val) {
  state.volume = Math.max(0, Math.min(200, val));

  if (state.volume > 100 && !state.audioContext) {
    initAudioBooster();
  }
  if (state.audioContext && state.audioContext.state === "suspended") {
    state.audioContext.resume().catch(() => {});
  }

  const isBoosted = state.volume > 100;
  if (state.video) {
    if (state.volume <= 100) {
      state.video.volume = state.volume / 100;
      if (state.audioGainNode && state.audioContext) {
        state.audioGainNode.gain.setValueAtTime(1.0, state.audioContext.currentTime);
      }
    } else {
      state.video.volume = 1.0;
      if (state.audioGainNode && state.audioContext && state.isAudioBoostEnabled) {
        const boostMultiplier = 1.0 + ((state.volume - 100) / 100) * 1.5;
        state.audioGainNode.gain.setValueAtTime(boostMultiplier, state.audioContext.currentTime);
      }
    }
  }

  if (el.sliderVolume) el.sliderVolume.value = state.volume;
  if (el.volumeValText) {
    el.volumeValText.textContent = isBoosted ? `${state.volume}% 🚀` : `${state.volume}%`;
  }
  const sliderPill = document.getElementById("slider-pill-volume");
  if (sliderPill) {
    sliderPill.classList.toggle("boosted", isBoosted);
  }

  if (el.hudVolumeVal) {
    el.hudVolumeVal.textContent = isBoosted ? `${state.volume}% (BOOSTED)` : `${state.volume}%`;
  }
  persistAllPreferences();
}

// 10-Band Equalizer Engine
export let eqAudioCtx = null;
export let eqSourceNode = null;
export const eqBands = EQ_BANDS;
export let eqFilters = [];

export function init10BandEqualizer() {
  if (eqFilters.length > 0 || !state.video) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!eqAudioCtx) eqAudioCtx = new AudioContextClass();
    if (!eqSourceNode) {
      eqSourceNode = eqAudioCtx.createMediaElementSource(state.video);
    }

    let lastNode = eqSourceNode;
    eqFilters = eqBands.map((freq, i) => {
      const filter = eqAudioCtx.createBiquadFilter();
      if (i === 0) {
        filter.type = "lowshelf";
      } else if (i === eqBands.length - 1) {
        filter.type = "highshelf";
      } else {
        filter.type = "peaking";
        filter.Q.value = 1.4;
      }
      filter.frequency.value = freq;
      filter.gain.value = 0;
      lastNode.connect(filter);
      lastNode = filter;
      return filter;
    });
    lastNode.connect(eqAudioCtx.destination);
  } catch (e) {
    console.warn("[10BandEQ] AudioContext init warning:", e);
  }
}

// Lip-Sync Delay Slider
export function setAudioDelay(ms, notify = false) {
  state.audioDelayMs = ms;
  if (!state.audioContext && state.video) {
    initAudioBooster();
  }
  if (state.audioDelayNode && state.audioContext) {
    const delaySec = Math.max(0, ms / 1000);
    try {
      state.audioDelayNode.delayTime.setTargetAtTime(delaySec, state.audioContext.currentTime, 0.05);
    } catch(e) {}
  }
  const disp = document.getElementById("lipsync-val-display");
  if (disp) disp.textContent = `${ms >= 0 ? "+" : ""}${ms} ms`;
  const slider = document.getElementById("lipsync-slider");
  if (slider) slider.value = ms;
  document.querySelectorAll(".lipsync-btn").forEach(b => {
    b.classList.toggle("active", parseInt(b.dataset.delay, 10) === ms);
  });
  if (notify) {
    showToast(`Lip-Sync Delay: ${ms >= 0 ? "+" : ""}${ms}ms`, "🎚️");
  }
  try {
    localStorage.setItem("livetv_audio_delay", String(ms));
  } catch(e) {}
}
window.setAudioDelay = setAudioDelay;

// Audio-Only Radio Mode
export let audioHudAnimId = null;

export function toggleAudioOnlyMode() {
  state.isAudioOnly = !state.isAudioOnly;
  const hud = document.getElementById("audio-only-hud");
  const vid = el.videoPlayer;
  const radioBtn = document.getElementById("player-btn-radio");
  const radioLabel = document.getElementById("player-radio-label");

  if (state.isAudioOnly) {
    if (vid) vid.style.display = "none";
    if (hud) {
      hud.style.display = "flex";
      const hudTitle = document.getElementById("audio-hud-title");
      if (hudTitle && state.currentChannel) {
        hudTitle.textContent = `${state.currentChannel.name} (Radio Feed)`;
      }
    }
    if (radioBtn) radioBtn.classList.add("active-setting");
    if (radioLabel) radioLabel.textContent = "Video Mode";
    startAudioHudVisualizer();
    showToast("Radio Mode ON: Video decoding paused to maximize battery", "📻");
  } else {
    if (vid) vid.style.display = "block";
    if (hud) hud.style.display = "none";
    if (radioBtn) radioBtn.classList.remove("active-setting");
    if (radioLabel) radioLabel.textContent = "Radio Mode";
    stopAudioHudVisualizer();
    showToast("Returned to Full HD Video Mode", "📺");
  }
}

export function startAudioHudVisualizer() {
  const canvas = document.getElementById("audio-hud-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  canvas.width = canvas.offsetWidth || 300;
  canvas.height = canvas.offsetHeight || 120;

  let step = 0;
  function draw() {
    if (!state.isAudioOnly) return;
    step += 0.08;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barCount = 32;
    const barWidth = canvas.width / barCount;
    for (let i = 0; i < barCount; i++) {
      const height = Math.abs(Math.sin(step + i * 0.25) * Math.cos(step * 0.7 + i * 0.15)) * (canvas.height * 0.75) + 8;
      const x = i * barWidth;
      const y = canvas.height - height;

      const grad = ctx.createLinearGradient(0, y, 0, canvas.height);
      grad.addColorStop(0, "#e50914");
      grad.addColorStop(0.5, "#38bdf8");
      grad.addColorStop(1, "rgba(56, 189, 248, 0.2)");
      ctx.fillStyle = grad;
      ctx.fillRect(x + 2, y, barWidth - 4, height);
    }
    audioHudAnimId = requestAnimationFrame(draw);
  }
  stopAudioHudVisualizer();
  audioHudAnimId = requestAnimationFrame(draw);
}

export function stopAudioHudVisualizer() {
  if (audioHudAnimId) {
    cancelAnimationFrame(audioHudAnimId);
    audioHudAnimId = null;
  }
}

// Commercial Break Auto-Muter
let breakMuteTimer = null;
let breakRemainingSecs = 0;
let breakSavedVolume = 100;
let breakDurIndex = 0;

export function triggerCommercialBreakMute() {
  if (breakMuteTimer) {
    breakDurIndex = (breakDurIndex + 1) % (BREAK_DURATIONS.length + 1);
    if (breakDurIndex === BREAK_DURATIONS.length) {
      resumeFromBreakMute();
      return;
    }
  } else {
    breakDurIndex = 0;
    breakSavedVolume = state.volume;
  }

  const secs = BREAK_DURATIONS[breakDurIndex];
  breakRemainingSecs = secs;
  applyVolume(0);

  if (el.playerBreakCountdown) {
    el.playerBreakCountdown.style.display = "inline-flex";
    updateBreakCountdownLabel();
  }

  clearInterval(breakMuteTimer);
  breakMuteTimer = setInterval(() => {
    breakRemainingSecs--;
    if (breakRemainingSecs <= 0) {
      resumeFromBreakMute();
    } else {
      updateBreakCountdownLabel();
    }
  }, 1000);

  showToast(`Muted for ${secs}s ad break • Auto-restores when show returns`, "🔇");
}

export function updateBreakCountdownLabel() {
  const badge = document.getElementById("break-countdown-text");
  if (badge) {
    const mins = Math.floor(breakRemainingSecs / 60);
    const secs = String(breakRemainingSecs % 60).padStart(2, "0");
    badge.textContent = `Break: ${mins}:${secs}`;
  }
}

export function resumeFromBreakMute() {
  clearInterval(breakMuteTimer);
  breakMuteTimer = null;
  breakRemainingSecs = 0;
  if (el.playerBreakCountdown) el.playerBreakCountdown.style.display = "none";
  applyVolume(breakSavedVolume || 100);
  showToast("Audio restored • Broadcast live", "🔊");
}

// Smart Dynamic Range Compressor
let isAudioNormalizerActive = false;
let audioCompressorCtx = null;
let audioCompressorNode = null;
let audioSourceNode = null;

export function toggleAudioNormalizer() {
  isAudioNormalizerActive = !isAudioNormalizerActive;
  if (el.playerCompressorLabel) {
    el.playerCompressorLabel.textContent = isAudioNormalizerActive ? "Normalizer ON" : "Normalizer";
  }
  
  if (isAudioNormalizerActive) {
    try {
      if (!audioCompressorCtx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        audioCompressorCtx = new AudioCtx();
        audioCompressorNode = audioCompressorCtx.createDynamicsCompressor();
        audioCompressorNode.threshold.setValueAtTime(-24, audioCompressorCtx.currentTime);
        audioCompressorNode.knee.setValueAtTime(30, audioCompressorCtx.currentTime);
        audioCompressorNode.ratio.setValueAtTime(12, audioCompressorCtx.currentTime);
        audioCompressorNode.attack.setValueAtTime(0.003, audioCompressorCtx.currentTime);
        audioCompressorNode.release.setValueAtTime(0.25, audioCompressorCtx.currentTime);

        if (state.video) {
          audioSourceNode = audioCompressorCtx.createMediaElementSource(state.video);
          audioSourceNode.connect(audioCompressorNode);
          audioCompressorNode.connect(audioCompressorCtx.destination);
        }
      }
      if (audioCompressorCtx.state === "suspended") audioCompressorCtx.resume();
    } catch (e) {
      console.warn("Audio normalizer graph notice:", e);
    }
    showToast("Smart Audio Normalizer & Night Mode ON 🔊", "🎧");
  } else {
    showToast("Audio Normalizer OFF • Standard Dynamic Range", "🔊");
  }
}
