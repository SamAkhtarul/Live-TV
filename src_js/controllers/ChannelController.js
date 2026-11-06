/**
 * Live TV - Channel, Favorites & Playlist Controller
 * Architecture: Controller / ChannelController
 */

import { state } from "../models/State.js";
import { STORAGE_RECENTS } from "../models/Constants.js";
import { el } from "../views/Elements.js";
import { showToast } from "../utils/DomUtils.js";
import { persistAllPreferences, buildCategories, applyFilterAndSearch } from "../models/ChannelModel.js";
import { renderCategoriesBar, renderRecentlyWatched } from "../views/ChannelView.js";
import { updatePlayerFavButton, setStreamQuality } from "../views/PlayerView.js";
import { stopPeekPreview, closeModal } from "../views/ModalView.js";
import { playChannel } from "./PlayerController.js";
import { syncRemoteStatus, syncRemoteChannels } from "./AppController.js";
import { updateRecallButton } from "./NavigationController.js";

// Toggle Favorite Channel
export function toggleFavorite(channelId) {
  const sId = String(channelId);
  const idx = (state.favorites || []).findIndex(f => String(f) === sId);
  if (idx >= 0) {
    state.favorites.splice(idx, 1);
  } else {
    const found = state.allChannels.find(c => String(c.id) === sId);
    state.favorites.unshift(found ? found.id : channelId);
  }
  persistAllPreferences();

  renderCategoriesBar();
  applyFilterAndSearch();
  updatePlayerFavButton();
  syncRemoteStatus();
  syncRemoteChannels();
}

export function addToRecentlyWatched(channel) {
  if (!channel || !channel.id) return;
  state.recentChannels = (state.recentChannels || []).filter(id => id !== channel.id);
  state.recentChannels.unshift(channel.id);
  if (state.recentChannels.length > 15) {
    state.recentChannels = state.recentChannels.slice(0, 15);
  }
  try {
    localStorage.setItem(STORAGE_RECENTS, JSON.stringify(state.recentChannels));
  } catch (e) {}
  renderRecentlyWatched();
}

export function loadRecentlyWatched() {
  try {
    const raw = localStorage.getItem(STORAGE_RECENTS);
    if (raw) state.recentChannels = JSON.parse(raw);
  } catch (e) {
    state.recentChannels = [];
  }
  renderRecentlyWatched();
  if (typeof updateRecallButton === "function") updateRecallButton();
}

export function clearRecentlyWatched() {
  state.recentChannels = [];
  try {
    localStorage.removeItem(STORAGE_RECENTS);
  } catch (e) {}
  renderRecentlyWatched();
  showToast("Recently watched history cleared", "🧹");
}

// Digital Cable TV Numeric Dialing
export function handleNumericKey(digit) {
  state.dialInput = (state.dialInput || "") + digit;
  clearTimeout(state.dialTimeout);

  if (el.channelDialOsd) {
    el.channelDialOsd.style.display = "flex";
    if (el.dialNumber) el.dialNumber.textContent = `CH ${state.dialInput}`;

    const num = parseInt(state.dialInput, 10);
    const match = state.allChannels.find(c => c.channelNumber === num);
    if (el.dialName) {
      el.dialName.textContent = match ? match.name : "Tuning...";
    }
  }

  state.dialTimeout = setTimeout(() => {
    tuneToDialedChannel();
  }, 1200);
}

export function tuneToDialedChannel() {
  if (!state.dialInput) return;
  const num = parseInt(state.dialInput, 10);
  const targetChannel = state.allChannels.find(c => c.channelNumber === num);
  const dialStr = state.dialInput;
  state.dialInput = "";

  if (el.channelDialOsd) {
    el.channelDialOsd.style.display = "none";
  }

  if (targetChannel) {
    showToast(`Tuning to CH ${dialStr}: ${targetChannel.name}`, "📺");
    playChannel(targetChannel);
  } else {
    showToast(`Channel ${dialStr} not found`, "⚠️");
  }
}

// Keypad TV Number Dialing System (OSD Overlay)
export let dialBuffer = "";
export let dialTimer = null;

export function handleKeypadDigit(digit) {
  dialBuffer += digit;
  if (el.playerOsdDialer && el.osdDialerNum) {
    el.osdDialerNum.textContent = dialBuffer;
    el.playerOsdDialer.style.display = "block";

    const num = parseInt(dialBuffer, 10);
    const candidate = state.allChannels.find(c => c.channelNumber === num || c.ch === num) || state.allChannels[num - 1];
    if (el.osdDialerName) {
      el.osdDialerName.textContent = candidate ? candidate.name : "Tuning...";
    }
  }

  clearTimeout(dialTimer);
  dialTimer = setTimeout(() => {
    executeKeypadTune();
  }, 1300);
}

export function executeKeypadTune() {
  if (!dialBuffer) return;
  const num = parseInt(dialBuffer, 10);
  dialBuffer = "";
  clearTimeout(dialTimer);

  const found = state.allChannels.find(c => c.channelNumber === num || c.ch === num) || state.allChannels[num - 1];
  if (found) {
    playChannel(found);
    showToast(`Tuned to CH ${num}: ${found.name}`, "📺");
  } else {
    showToast(`Channel ${num} not found`, "⚠️");
  }

  setTimeout(() => {
    if (el.playerOsdDialer) el.playerOsdDialer.style.display = "none";
  }, 1000);
}

// Custom M3U Parser
export function parseCustomM3u(content) {
  const lines = content.split("\n");
  const parsed = [];
  let currentTitle = "Custom Channel";
  let currentLogo = "";
  let currentGroup = "Custom M3U";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("#EXTINF:")) {
      const matchName = line.split(",")[1];
      if (matchName) currentTitle = matchName.trim();
      const matchLogo = line.match(/tvg-logo="([^"]+)"/);
      if (matchLogo) currentLogo = matchLogo[1];
      const matchGroup = line.match(/group-title="([^"]+)"/);
      if (matchGroup) currentGroup = matchGroup[1];
    } else if (line.startsWith("http://") || line.startsWith("https://")) {
      parsed.push({
        id: `custom_${Date.now()}_${parsed.length}`,
        name: currentTitle,
        streamUrl: line,
        logoUrl: currentLogo,
        category: currentGroup,
        country: "Custom"
      });
      currentTitle = "Custom Channel";
      currentLogo = "";
    }
  }

  if (parsed.length > 0) {
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem("livetv_custom_channels") || "[]");
    } catch (e) {}
    saved = parsed.concat(saved);
    localStorage.setItem("livetv_custom_channels", JSON.stringify(saved));

    state.allChannels = parsed.concat(state.allChannels);
    buildCategories();
    applyFilterAndSearch();
    syncRemoteChannels();
    showToast(`Successfully imported ${parsed.length} custom channels!`);
  } else {
    showToast("No valid streams found in M3U playlist.");
  }
}

// Low Latency Mode
export function toggleLowLatencyMode() {
  state.isLowLatencyMode = !state.isLowLatencyMode;
  const btn = document.getElementById("player-btn-lowlatency");
  const label = document.getElementById("player-lowlatency-label");

  if (state.isLowLatencyMode) {
    if (btn) btn.classList.add("active-setting");
    if (label) label.textContent = "Low Latency ON";
    if (state.hls) {
      state.hls.config.liveSyncDurationCount = 1;
      state.hls.config.liveMaxLatencyDurationCount = 2;
      state.hls.config.maxBufferLength = 2;
      if (state.video && state.hls.liveSyncPosition) {
        state.video.currentTime = state.hls.liveSyncPosition;
      }
    }
    showToast("Ultra-Low Latency Active (~2s broadcast sync)", "⚡");
  } else {
    if (btn) btn.classList.remove("active-setting");
    if (label) label.textContent = "Low Latency";
    if (state.hls) {
      state.hls.config.liveSyncDurationCount = 3;
      state.hls.config.liveMaxLatencyDurationCount = 10;
      state.hls.config.maxBufferLength = 60;
    }
    showToast("Standard Smooth Buffer Mode Restored (~10s buffer)", "📺");
  }
}

// Data Saver Mode
export function toggleDataSaverMode() {
  state.isDataSaver = !state.isDataSaver;
  const label = document.getElementById("label-datasaver");
  const btn = document.getElementById("btn-header-datasaver");
  if (label) {
    label.textContent = state.isDataSaver ? "Data Saver: ON" : "Data Saver";
  }
  if (btn) {
    btn.style.borderColor = state.isDataSaver ? "#38bdf8" : "";
    btn.style.color = state.isDataSaver ? "#38bdf8" : "";
  }
  if (state.isDataSaver) {
    setStreamQuality(720, "720p HD");
    stopPeekPreview();
    showToast("Data Saver ON • Optimized 720p stream bitrate", "📶");
  } else {
    setStreamQuality(-1, "Auto");
    showToast("Data Saver OFF • Adaptive High Bitrate", "📶");
  }
}

// Xtream Codes IPTV Login & Importer
export async function submitXtreamLogin() {
  const urlEl = document.getElementById("xtream-server-url");
  const userEl = document.getElementById("xtream-username");
  const passEl = document.getElementById("xtream-password");
  if (!urlEl || !userEl || !passEl) return;

  let server = (urlEl.value || "").trim().replace(/\/+$/, "");
  const username = (userEl.value || "").trim();
  const password = (passEl.value || "").trim();

  if (!server || !username || !password) {
    showToast("Please enter server URL, username & password", "⚠️");
    return;
  }

  showToast("Connecting to Xtream Codes server...", "⏳");
  try {
    const apiUrl = `${server}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_live_streams`;
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error("Authentication failed");
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("Invalid playlist response");

    const newChannels = data.map((item, idx) => ({
      id: `xtream_${item.stream_id || idx}`,
      name: item.name || `Xtream Stream ${idx + 1}`,
      category: "Xtream IPTV",
      logoUrl: item.stream_icon || "",
      streamUrl: `${server}/live/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${item.stream_id}.m3u8`,
      channelNumber: 3000 + idx
    }));

    state.allChannels = [...newChannels, ...state.allChannels];
    state.filteredChannels = state.allChannels;
    if (!state.categories.includes("Xtream IPTV")) {
      state.categories.push("Xtream IPTV");
    }
    renderCategoriesBar();
    applyFilterAndSearch();
    closeModal(el.modalXtreamCodes);
    showToast(`Successfully connected! Imported ${newChannels.length} Xtream channels`, "✅");
  } catch (err) {
    showToast(`Xtream Connection Error: ${err.message}`, "⚠️");
  }
}

// Turbo & Density
export function toggleTurboMode() {
  state.turboMode = !state.turboMode;
  document.body.classList.toggle("turbo-mode", state.turboMode);
  if (el.btnTurboMode) {
    el.btnTurboMode.classList.toggle("active", state.turboMode);
  }
  if (el.turboLabel) {
    el.turboLabel.textContent = state.turboMode ? "Turbo: ON" : "Turbo Mode";
  }
  localStorage.setItem("livetv_turbo_mode", state.turboMode ? "1" : "0");
  showToast(state.turboMode ? "🚀 Turbo Mode ON: High FPS, Ultra-Low RAM & CPU" : "Turbo Mode OFF", state.turboMode ? "⚡" : "ℹ️");
}

export function toggleViewDensity() {
  state.isCompactDensity = !state.isCompactDensity;
  if (el.channelsGrid) {
    el.channelsGrid.classList.toggle("grid-compact", state.isCompactDensity);
  }
  if (el.densityLabel) {
    el.densityLabel.textContent = state.isCompactDensity ? "Compact" : "Grid";
  }
  localStorage.setItem("livetv_compact_density", state.isCompactDensity ? "1" : "0");
  showToast(state.isCompactDensity ? "Switched to Compact Grid" : "Switched to Comfortable Grid", "⊞");
}
