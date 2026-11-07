/**
 * Live TV - Keyboard Shortcuts & Remote Navigation Controller
 * Architecture: Controller / NavigationController
 */

import { state } from "../models/State.js";
import { el } from "../views/Elements.js";
import { showToast } from "../utils/DomUtils.js";
import {
  updatePlayPauseIcons,
  showVolumeHud,
  triggerSeekRipple,
  lockScreen,
  unlockScreen,
  goLive,
  cycleAspectRatio,
  triggerInstantSlowmoReplay
} from "../views/PlayerView.js";
import {
  playChannel,
  playNextChannel,
  playPrevChannel,
  toggleServer,
  closePlayer,
  cycleVideoZoom,
  cycleVideoClarity
} from "./PlayerController.js";
import { handleNumericKey, toggleTurboMode } from "./ChannelController.js";
import { applyVolume } from "./AudioController.js";
import { openRemoteControlModal, open10BandEqModal, closeModal, openModal, toggleMiniGuide } from "../views/ModalView.js";
import { toggleSportsHUD, openPlayerSearch } from "../views/HUDView.js";
import { toggleAlwaysOnTop, toggleRecording, openMultiView, closeMultiView, toggleAmbilight } from "./AppController.js";
import { cycleAIUpscaler, toggleAISplitCompare } from "./AIUpscalerController.js";

export function getPreviousChannelCandidate() {
  if (state.previousChannel && state.currentChannel && state.previousChannel.id !== state.currentChannel.id) {
    return state.previousChannel;
  }

  if (state.recentChannels && state.recentChannels.length > 0) {
    const curId = state.currentChannel ? state.currentChannel.id : null;
    const prevId = state.recentChannels.find(id => id && id !== curId);
    if (prevId) {
      const found = state.allChannels.find(c => c.id === prevId);
      if (found) return found;
    }
  }

  const list = (state.filteredChannels && state.filteredChannels.length > 0) ? state.filteredChannels : state.allChannels;
  if (list && list.length > 1) {
    const curIdx = state.currentChannel ? list.findIndex(c => c.id === state.currentChannel.id) : 0;
    const targetIdx = curIdx > 0 ? curIdx - 1 : 1;
    return list[targetIdx];
  }

  return null;
}
window.getPreviousChannelCandidate = getPreviousChannelCandidate;

export function recallPreviousChannel() {
  const target = getPreviousChannelCandidate();
  if (!target) {
    showToast("No channel available to recall", "ℹ️");
    return;
  }

  const current = state.currentChannel;
  showToast(`Swapping to ${target.name}...`, "⇄");
  state.previousChannel = current;
  playChannel(target);
  updateRecallButton();
}
window.recallPreviousChannel = recallPreviousChannel;

export function updateRecallButton() {
  const btn = el.playerBtnRecall || document.getElementById("player-btn-recall");
  const lbl = el.playerRecallLabel || document.getElementById("player-recall-label");
  if (!btn || !lbl) return;

  const target = getPreviousChannelCandidate();
  if (target) {
    btn.style.display = "inline-flex";
    btn.title = `Toggle Last Channel: ${target.name} (Hotkey Q)`;
    const shortName = target.name.length > 11 ? target.name.slice(0, 10) + "…" : target.name;
    lbl.textContent = `⇄ ${shortName}`;
  } else {
    btn.title = "Recall Last Channel (Hotkey Q)";
    lbl.textContent = "Last CH";
  }
}
window.updateRecallButton = updateRecallButton;

export function setupKeyboardShortcuts() {
  window.addEventListener("keydown", (e) => {
    if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;

    switch (e.key) {
      case " ":
      case "k":
      case "K":
        e.preventDefault();
        if (state.video) {
          if (state.video.paused) {
            state.video.play();
            updatePlayPauseIcons(true);
          } else {
            state.video.pause();
            updatePlayPauseIcons(false);
          }
        }
        break;

      case "ArrowLeft":
        e.preventDefault();
        triggerSeekRipple("left");
        break;

      case "ArrowRight":
        e.preventDefault();
        triggerSeekRipple("right");
        break;

      case "ArrowUp":
        if (state.isPlayerOpen || (el.playerOverlay && el.playerOverlay.style.display !== "none")) {
          e.preventDefault();
          applyVolume(state.volume + 5);
          showVolumeHud();
        } else if (el.browserView) {
          e.preventDefault();
          el.browserView.scrollBy({ top: -140, behavior: "smooth" });
        }
        break;

      case "ArrowDown":
        if (state.isPlayerOpen || (el.playerOverlay && el.playerOverlay.style.display !== "none")) {
          e.preventDefault();
          applyVolume(state.volume - 5);
          showVolumeHud();
        } else if (el.browserView) {
          e.preventDefault();
          el.browserView.scrollBy({ top: 140, behavior: "smooth" });
        }
        break;

      case "PageDown":
        if (!state.isPlayerOpen && el.browserView) {
          e.preventDefault();
          el.browserView.scrollBy({ top: window.innerHeight * 0.8, behavior: "smooth" });
        }
        break;

      case "PageUp":
        if (!state.isPlayerOpen && el.browserView) {
          e.preventDefault();
          el.browserView.scrollBy({ top: -window.innerHeight * 0.8, behavior: "smooth" });
        }
        break;

      case "Home":
        if (!state.isPlayerOpen && el.browserView) {
          e.preventDefault();
          el.browserView.scrollTo({ top: 0, behavior: "smooth" });
        }
        break;

      case "End":
        if (!state.isPlayerOpen && el.browserView) {
          e.preventDefault();
          el.browserView.scrollTo({ top: el.browserView.scrollHeight, behavior: "smooth" });
        }
        break;

      case "[":
        e.preventDefault();
        playPrevChannel();
        break;

      case "]":
        e.preventDefault();
        playNextChannel();
        break;

      case "f":
      case "F":
        e.preventDefault();
        if (el.playerBtnFullscreen) el.playerBtnFullscreen.click();
        break;

      case "p":
      case "P":
        e.preventDefault();
        if (el.playerBtnPip) el.playerBtnPip.click();
        break;

      case "i":
      case "I":
        e.preventDefault();
        if (el.playerBtnStats) el.playerBtnStats.click();
        break;

      case "o":
      case "O":
        e.preventDefault();
        openRemoteControlModal();
        break;

      case "m":
      case "M":
        e.preventDefault();
        if (state.video) {
          state.video.muted = !state.video.muted;
          state.isMuted = state.video.muted;
          if (el.hudVolumeVal) el.hudVolumeVal.textContent = state.isMuted ? "MUTED" : `${state.volume}%`;
          showVolumeHud();
        }
        break;

      case "l":
      case "L":
        e.preventDefault();
        if (el.playerOverlay && el.playerOverlay.style.display !== "none") {
          if (state.isLocked) {
            unlockScreen();
          } else {
            lockScreen();
          }
        }
        break;

      case "g":
      case "G":
        e.preventDefault();
        goLive();
        break;

      case "s":
      case "S":
        e.preventDefault();
        toggleServer();
        break;

      case "t":
      case "T":
        e.preventDefault();
        toggleAlwaysOnTop();
        break;

      case "r":
      case "R":
        e.preventDefault();
        toggleRecording();
        break;

      case "v":
      case "V":
        e.preventDefault();
        if (state.multiviewActive) closeMultiView();
        else openMultiView();
        break;

      case "a":
      case "A":
        e.preventDefault();
        openModal(el.modalPlayerSettings);
        break;

      case "u":
      case "U":
        e.preventDefault();
        cycleAIUpscaler();
        break;

      case "c":
      case "C":
        e.preventDefault();
        toggleAISplitCompare();
        break;

      case "e":
      case "E":
        e.preventDefault();
        open10BandEqModal();
        break;

      case "x":
      case "X":
        e.preventDefault();
        toggleTurboMode();
        break;

      case "z":
      case "Z":
        e.preventDefault();
        cycleAspectRatio();
        break;

      case "q":
      case "Q":
        e.preventDefault();
        recallPreviousChannel();
        break;

      case "/":
        e.preventDefault();
        openPlayerSearch();
        break;

      case "w":
      case "W":
        e.preventDefault();
        cycleVideoZoom();
        break;

      case "0": case "1": case "2": case "3": case "4":
      case "5": case "6": case "7": case "8": case "9":
        handleNumericKey(e.key);
        break;

      case "Escape":
        const openModalElem = Array.from(document.querySelectorAll(".modal-overlay")).find(m => m.style.display !== "none" && m.style.display !== "");
        if (openModalElem) {
          closeModal(openModalElem);
          return;
        }
        if (state.isPipActive && window.togglePictureInPicture) {
          window.togglePictureInPicture();
        } else if (state.multiviewActive) {
          closeMultiView();
        } else if (state.isLocked) {
          unlockScreen();
        } else if (document.fullscreenElement) {
          document.exitFullscreen();
        } else if (el.playerOverlay && el.playerOverlay.style.display !== "none") {
          closePlayer();
        }
        break;
    }
  });
}

// Voice Assistant
let isVoiceAssistantActive = false;
let voiceRecognizer = null;

export function toggleVoiceAssistant(force) {
  isVoiceAssistantActive = (force !== undefined) ? force : !isVoiceAssistantActive;
  if (el.voiceCommandHud) {
    el.voiceCommandHud.style.display = isVoiceAssistantActive ? "flex" : "none";
  }

  if (isVoiceAssistantActive) {
    if (!voiceRecognizer && (window.webkitSpeechRecognition || window.SpeechRecognition)) {
      const Speech = window.webkitSpeechRecognition || window.SpeechRecognition;
      voiceRecognizer = new Speech();
      voiceRecognizer.continuous = false;
      voiceRecognizer.lang = "en-US";
      voiceRecognizer.onresult = (e) => {
        const text = e.results[0][0].transcript;
        if (el.voiceTranscript) el.voiceTranscript.textContent = `"${text}"`;
        handleVoiceCommand(text);
      };
      voiceRecognizer.onerror = () => toggleVoiceAssistant(false);
      voiceRecognizer.onend = () => {
        setTimeout(() => toggleVoiceAssistant(false), 2200);
      };
      try { voiceRecognizer.start(); } catch (e) {}
    } else {
      if (el.voiceTranscript) el.voiceTranscript.textContent = 'Say a command...';
      setTimeout(() => toggleVoiceAssistant(false), 3000);
    }
  }
}

export function handleVoiceCommand(raw) {
  const text = raw.toLowerCase().trim();
  if (text.includes("mute") && !text.includes("unmute")) {
    if (state.video) state.video.muted = true;
    showToast("Voice Command: Audio Muted 🔇", "🎙️");
  } else if (text.includes("unmute")) {
    if (state.video) state.video.muted = false;
    showToast("Voice Command: Audio Unmuted 🔊", "🎙️");
  } else if (text.includes("sports") || text.includes("score") || text.includes("hud")) {
    toggleSportsHUD(true);
    showToast("Voice Command: Opened Sports HUD 🏆", "🎙️");
  } else if (text.includes("slow") || text.includes("replay")) {
    triggerInstantSlowmoReplay();
  } else if (text.includes("ambient") || text.includes("light")) {
    toggleAmbilight();
  } else if (text.includes("guide")) {
    toggleMiniGuide();
  } else if (text.includes("full") || text.includes("screen")) {
    if (el.playerBtnFullscreen) el.playerBtnFullscreen.click();
  } else if (text.includes("clarity") || text.includes("hdr")) {
    cycleVideoClarity();
  } else if (text.includes("tune") || text.includes("play") || text.includes("channel")) {
    const query = text.replace(/tune|play|channel|to/g, "").trim();
    const found = state.allChannels.find(c => c.name.toLowerCase().includes(query));
    if (found) {
      playChannel(found);
      showToast(`Voice Command: Tuning ${found.name} 📺`, "🎙️");
    }
  }
}
