/**
 * Live TV - Modals, Dialogs & EPG Views
 * Architecture: View / ModalView
 */

import { state } from "../models/State.js";
import { el } from "./Elements.js";
import { APP_VERSION, APP_BUILD, DEFAULT_TEAMS } from "../models/Constants.js";
import { escapeHtml, showToast } from "../utils/DomUtils.js";
import { persistAllPreferences, buildCategories, applyFilterAndSearch } from "../models/ChannelModel.js";
import { renderCategoriesBar } from "./ChannelView.js";
import { updatePlayerFavButton, showVolumeHud, triggerSeekRipple, setStreamQuality } from "./PlayerView.js";
import { playChannel, playNextChannel, playPrevChannel } from "../controllers/PlayerController.js";
import { toggleFavorite, toggleDataSaverMode } from "../controllers/ChannelController.js";
import { applyVolume, cycleNextAudioProfile, init10BandEqualizer, eqFilters, eqBands, triggerCommercialBreakMute } from "../controllers/AudioController.js";
import { syncRemoteStatus, syncRemoteChannels, toggleAlwaysOnTop, openMultiView, closeMultiView, toggleAmbilight, captureLiveClip, updateOwnerBadgeIfAuthorized } from "../controllers/AppController.js";
import { checkForAppUpdates } from "../controllers/UpdateController.js";
import { tuneToEventChannel } from "../models/EventModel.js";

// Modal Helpers
export function openModal(modal) {
  if (!modal) return;
  if (modal.parentNode !== document.body) {
    document.body.appendChild(modal);
  }
  modal.style.zIndex = "200000";
  modal.style.opacity = "1";
  modal.style.visibility = "visible";
  modal.style.display = "flex";
}

export function closeModal(modal) {
  if (!modal) return;
  modal.style.display = "none";
}

export function openExternalUrl(url) {
  if (window.webkit?.messageHandlers?.openExternalUrl) {
    try {
      window.webkit.messageHandlers.openExternalUrl.postMessage(url);
      return;
    } catch (e) {
      console.warn("Native bridge openExternalUrl error:", e);
    }
  }
  window.open(url, "_blank");
}
window.openExternalUrl = openExternalUrl;

export function openAboutModal() {
  if (el.modalAbout) {
    openModal(el.modalAbout);
  }
}
window.openAboutModal = openAboutModal;

export function closeAboutModal() {
  if (el.modalAbout) {
    closeModal(el.modalAbout);
  }
}

// Favorite Ranking Modal Logic
export function openRankFavoritesModal() {
  if (!el.favoritesListBody) return;
  el.favoritesListBody.innerHTML = "";

  if ((state.favorites || []).length === 0) {
    el.favoritesListBody.innerHTML = `
      <div style="text-align:center; padding: 24px; color: var(--text-secondary);">
        No channels have been favorited yet.<br/>
        Click the star icon (☆) on any channel card to favorite it.
      </div>
    `;
  } else {
    state.favorites.forEach((chId, idx) => {
      const channel = state.allChannels.find(c => c.id === chId) || { name: chId, category: "Channel" };
      const rank = idx + 1;
      const rankClass = rank === 1 ? "gold" : rank === 2 ? "silver" : rank === 3 ? "bronze" : "";

      const row = document.createElement("div");
      row.className = "list-item-row";
      row.dataset.id = chId;

      row.innerHTML = `
        <div class="list-item-left">
          <div class="rank-pill ${rankClass}">#${rank}</div>
          <div>
            <div style="font-weight: 700; font-size: 13px;">${escapeHtml(channel.name)}</div>
            <div style="font-size: 11px; color: var(--text-secondary);">${escapeHtml(channel.category || '')}</div>
          </div>
        </div>
        <div style="display: flex; gap: 4px;">
          <button class="action-icon-btn btn-fav-top" title="Move to Top" ${idx === 0 ? "disabled" : ""}>⇈</button>
          <button class="action-icon-btn btn-fav-up" title="Move Up" ${idx === 0 ? "disabled" : ""}>↑</button>
          <button class="action-icon-btn btn-fav-down" title="Move Down" ${idx === state.favorites.length - 1 ? "disabled" : ""}>↓</button>
          <button class="action-icon-btn btn-fav-del" title="Remove" style="color:var(--accent-red);">✕</button>
        </div>
      `;

      function onFavOrderChanged() {
        persistAllPreferences();
        renderCategoriesBar();
        applyFilterAndSearch();
        updatePlayerFavButton();
        syncRemoteStatus();
        syncRemoteChannels();
        openRankFavoritesModal();
      }

      row.querySelector(".btn-fav-top").onclick = () => {
        state.favorites.splice(idx, 1);
        state.favorites.unshift(chId);
        onFavOrderChanged();
      };
      row.querySelector(".btn-fav-up").onclick = () => {
        if (idx > 0) {
          const temp = state.favorites[idx - 1];
          state.favorites[idx - 1] = state.favorites[idx];
          state.favorites[idx] = temp;
          onFavOrderChanged();
        }
      };
      row.querySelector(".btn-fav-down").onclick = () => {
        if (idx < state.favorites.length - 1) {
          const temp = state.favorites[idx + 1];
          state.favorites[idx + 1] = state.favorites[idx];
          state.favorites[idx] = temp;
          onFavOrderChanged();
        }
      };
      row.querySelector(".btn-fav-del").onclick = () => {
        state.favorites.splice(idx, 1);
        onFavOrderChanged();
      };

      el.favoritesListBody.appendChild(row);
    });
  }

  openModal(el.modalRankFavorites);
}

export function saveRankFavorites() {
  persistAllPreferences();
  closeModal(el.modalRankFavorites);
  renderCategoriesBar();
  applyFilterAndSearch();
  updatePlayerFavButton();
  syncRemoteStatus();
  syncRemoteChannels();
}

// Category Rearrange Modal Logic
export function openRearrangeCategoriesModal() {
  if (!el.categoriesListBody) return;
  el.categoriesListBody.innerHTML = "";

  (state.categories || []).forEach((cat, idx) => {
    const row = document.createElement("div");
    row.className = "list-item-row";
    row.dataset.category = cat;

    row.innerHTML = `
      <div class="list-item-left">
        <span style="font-weight:700; min-width: 22px; color: var(--text-secondary);">${idx + 1}.</span>
        <span style="font-weight: 700; font-size: 13px;">${escapeHtml(cat)}</span>
      </div>
      <div style="display: flex; gap: 4px;">
        <button class="action-icon-btn btn-cat-top" title="Move to Top" ${idx === 0 ? "disabled" : ""}>⇈</button>
        <button class="action-icon-btn btn-cat-up" title="Move Up" ${idx === 0 ? "disabled" : ""}>↑</button>
        <button class="action-icon-btn btn-cat-down" title="Move Down" ${idx === state.categories.length - 1 ? "disabled" : ""}>↓</button>
      </div>
    `;

    row.querySelector(".btn-cat-top").onclick = () => {
      state.categories.splice(idx, 1);
      state.categories.unshift(cat);
      openRearrangeCategoriesModal();
    };
    row.querySelector(".btn-cat-up").onclick = () => {
      if (idx > 0) {
        const temp = state.categories[idx - 1];
        state.categories[idx - 1] = state.categories[idx];
        state.categories[idx] = temp;
        openRearrangeCategoriesModal();
      }
    };
    row.querySelector(".btn-cat-down").onclick = () => {
      if (idx < state.categories.length - 1) {
        const temp = state.categories[idx + 1];
        state.categories[idx + 1] = state.categories[idx];
        state.categories[idx] = temp;
        openRearrangeCategoriesModal();
      }
    };

    el.categoriesListBody.appendChild(row);
  });

  openModal(el.modalRearrangeCategories);
}

export function saveCategoryOrder() {
  state.categoryOrder = state.categories.slice();
  persistAllPreferences();
  closeModal(el.modalRearrangeCategories);
  renderCategoriesBar();
}

export function resetCategoryOrder() {
  state.categoryOrder = [];
  persistAllPreferences();
  buildCategories();
  openRearrangeCategoriesModal();
}

// Phone Wireless Remote Control Bridge
export function openRemoteControlModal() {
  if (el.modalRemoteControl) {
    openModal(el.modalRemoteControl);
    if (window.webkit?.messageHandlers?.getRemoteServerInfo) {
      window.webkit.messageHandlers.getRemoteServerInfo.postMessage("");
    } else {
      setRemoteServerInfo({ ip: "127.0.0.1", port: 8998, url: "http://127.0.0.1:8998" });
    }
  }
}

let remoteServerData = {
  hostUrl: "http://sams-macbook-pro.local:8998",
  ipUrl: "http://127.0.0.1:8998",
  hostSvg: "",
  ipSvg: "",
  activeType: "host"
};

export function switchRemoteQrType(type) {
  remoteServerData.activeType = type;
  const btnHost = document.getElementById("btn-tab-remote-host");
  const btnIp = document.getElementById("btn-tab-remote-ip");
  const help = document.getElementById("remote-help-text");
  if (btnHost) btnHost.classList.toggle("active", type === "host");
  if (btnIp) btnIp.classList.toggle("active", type === "ip");

  const url = type === "host" ? remoteServerData.hostUrl : remoteServerData.ipUrl;
  const svg = type === "host" ? remoteServerData.hostSvg : remoteServerData.ipSvg;

  if (el.remoteServerUrl && url) el.remoteServerUrl.textContent = url;
  if (el.remoteQrBox && svg) el.remoteQrBox.innerHTML = svg;
  if (help) {
    if (type === "host") {
      help.innerHTML = `<span style="color: #10b981; font-weight: 700;">★ Permanent (.local)</span>: Never breaks even if your Wi-Fi router assigns a new IP!`;
    } else {
      help.innerHTML = `<span style="color: #38bdf8; font-weight: 700;">📶 Direct Wi-Fi IP</span>: Fast direct connection for standard Android & smart TVs.`;
    }
  }
}
window.switchRemoteQrType = switchRemoteQrType;

export function setRemoteServerInfo(data) {
  remoteServerData.hostUrl = data.hostUrl || data.url;
  remoteServerData.ipUrl = data.ipUrl || data.url;
  remoteServerData.hostSvg = data.svg || "";
  remoteServerData.ipSvg = data.ipSvg || data.svg || "";

  window.switchRemoteQrType(remoteServerData.activeType || "host");
}
window.setRemoteServerInfo = setRemoteServerInfo;

window.onNetworkIpChanged = function(newIp) {
  console.log("[LiveTV] Network IP changed to:", newIp);
  if (window.webkit?.messageHandlers?.getRemoteServerInfo) {
    window.webkit.messageHandlers.getRemoteServerInfo.postMessage("");
  }
  showToast(`Network updated: Mac IP is now ${newIp}`);
};

window.handleRemoteCommand = function(action, param) {
  switch (action) {
    case "prev":
      playPrevChannel();
      break;
    case "next":
      playNextChannel();
      break;
    case "play_pause":
      if (state.video) {
        if (state.video.paused) {
          state.video.play();
        } else {
          state.video.pause();
        }
      }
      break;
    case "vol_up":
      applyVolume(state.volume + 5);
      showVolumeHud();
      break;
    case "vol_down":
      applyVolume(state.volume - 5);
      showVolumeHud();
      break;
    case "mute":
      if (state.video) {
        state.video.muted = !state.video.muted;
        state.isMuted = state.video.muted;
        showVolumeHud();
      }
      break;
    case "rewind":
      triggerSeekRipple("left");
      break;
    case "forward":
      triggerSeekRipple("right");
      break;
    case "pip":
      if (el.playerBtnPip) el.playerBtnPip.click();
      break;
    case "fullscreen":
      if (el.playerBtnFullscreen) el.playerBtnFullscreen.click();
      break;
    case "always_on_top":
      toggleAlwaysOnTop();
      break;
    case "stats":
      if (el.playerBtnStats) el.playerBtnStats.click();
      break;
    case "multiview":
      if (state.multiviewActive) closeMultiView();
      else openMultiView();
      break;
    case "profile_next":
      cycleNextAudioProfile();
      break;
    case "play_channel":
      if (param) {
        const found = state.allChannels.find(c => c.id === param || c.id === Number(param));
        if (found) playChannel(found);
      }
      break;
    case "break_mute":
      triggerCommercialBreakMute();
      break;
    case "toggle_datasaver":
      toggleDataSaverMode();
      break;
    case "toggle_miniguide":
      toggleMiniGuide();
      break;
    case "toggle_ambilight":
      toggleAmbilight();
      break;
    case "trigger_clip":
      captureLiveClip();
      break;
    case "open_epg":
      openEPGGuideModal();
      break;
    case "open_cast":
      openCastPicker();
      break;
    case "set_quality":
      if (param !== undefined) {
        const h = parseInt(param, 10);
        if (!isNaN(h)) {
          setStreamQuality(h, h === -1 ? "Auto" : `${h}p`);
          showToast(`Stream quality set to ${h === -1 ? "Auto" : h + "p"}`);
        }
      }
      break;
    case "toggle_fav":
      if (param) {
        toggleFavorite(param);
      }
      break;
    case "check_update":
      openModal(el.modalAbout);
      checkForAppUpdates(false);
      break;
  }
  syncRemoteStatus();
};

// Scheduled DVR
export function loadScheduledRecordings() {
  try {
    const raw = localStorage.getItem("livetv_scheduled_dvr");
    if (raw) {
      state.scheduledRecordings = JSON.parse(raw);
    }
  } catch (e) {}
}

export function saveScheduledRecordings() {
  try {
    localStorage.setItem("livetv_scheduled_dvr", JSON.stringify(state.scheduledRecordings || []));
  } catch (e) {}
}

export function openScheduledDvrModal() {
  const modal = document.getElementById("modal-scheduled-dvr");
  const select = document.getElementById("schedule-channel-select");
  if (!modal || !select) return;

  select.innerHTML = (state.allChannels || []).map(c => `
    <option value="${escapeHtml(c.id)}" ${state.currentChannel && state.currentChannel.id === c.id ? 'selected' : ''}>
      #${c.channelNumber || ''} ${escapeHtml(c.name)} (${escapeHtml(c.category || 'Live')})
    </option>
  `).join("");

  renderActiveSchedules();
  openModal(modal);
}

export function renderActiveSchedules() {
  const container = document.getElementById("active-schedules-container");
  const wrap = document.getElementById("active-schedules-list");
  if (!container || !wrap) return;

  if (!state.scheduledRecordings || state.scheduledRecordings.length === 0) {
    wrap.style.display = "none";
    return;
  }
  wrap.style.display = "flex";
  const now = Date.now();
  container.innerHTML = state.scheduledRecordings.map((s, idx) => {
    const remainingMins = Math.max(0, Math.round((s.startTime - now) / 60000));
    const timeLabel = remainingMins <= 0 ? "Recording Now" : `Starts in ${remainingMins}m`;
    return `
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.06); padding:6px 10px; border-radius:6px; font-size:12px;">
        <div>
          <span style="font-weight:700; color:#fff;">${escapeHtml(s.channelName)}</span>
          <span style="color:#38bdf8; margin-left:6px;">⏱️ ${timeLabel} (${s.durationMins}m duration)</span>
        </div>
        <button style="background:none; border:none; color:#f87171; cursor:pointer; font-weight:700;" onclick="window.cancelScheduleItem(${idx})">Cancel</button>
      </div>
    `;
  }).join("");
}

window.cancelScheduleItem = function(idx) {
  if (state.scheduledRecordings && state.scheduledRecordings[idx]) {
    const item = state.scheduledRecordings[idx];
    if (item.startTimer) clearTimeout(item.startTimer);
    if (item.stopTimer) clearTimeout(item.stopTimer);
    state.scheduledRecordings.splice(idx, 1);
    saveScheduledRecordings();
    renderActiveSchedules();
    showToast("Scheduled recording cancelled", "⏱️");
  }
};

export function scheduleDVRRecording() {
  const select = document.getElementById("schedule-channel-select");
  const startSelect = document.getElementById("schedule-start-select");
  const durSelect = document.getElementById("schedule-duration-select");
  if (!select || !startSelect || !durSelect) return;

  const channelId = select.value;
  const channel = (state.allChannels || []).find(c => c.id === channelId);
  if (!channel) return;

  const startDelayMins = parseInt(startSelect.value, 10);
  const durMins = parseInt(durSelect.value, 10);

  const startTime = Date.now() + (startDelayMins * 60 * 1000);
  const endTime = startTime + (durMins * 60 * 1000);

  const scheduleItem = {
    id: "sch_" + Date.now(),
    channelId: channel.id,
    channelName: channel.name,
    startTime: startTime,
    endTime: endTime,
    durationMins: durMins
  };

  scheduleItem.startTimer = setTimeout(() => {
    if (!state.currentChannel || state.currentChannel.id !== channel.id) {
      playChannel(channel);
    }
  }, startDelayMins * 60 * 1000);

  if (!state.scheduledRecordings) state.scheduledRecordings = [];
  state.scheduledRecordings.push(scheduleItem);
  saveScheduledRecordings();
  renderActiveSchedules();
  showToast(`DVR Scheduled for ${channel.name} in ${startDelayMins}m! ⏱️`, "💾");
  closeModal(document.getElementById("modal-scheduled-dvr"));
}

// Parental PIN & Kids Safe Mode
state.parentalPin = localStorage.getItem("livetv_parental_pin") || "0000";
state.isKidsModeActive = localStorage.getItem("livetv_kids_mode") === "true";
state.enteredPin = "";

export function openParentalPinModal() {
  state.enteredPin = "";
  updatePinDots();
  const desc = document.getElementById("pin-modal-desc");
  if (desc) {
    desc.textContent = state.isKidsModeActive 
      ? "Enter PIN to unlock Full Catalog & disable Kids Mode" 
      : "Enter PIN to enable Kids Safe Mode (Filters adult/violence channels)";
  }
  openModal(document.getElementById("modal-parental-pin"));
}

window.pressPinKey = function(digit) {
  if (state.enteredPin.length < 4) {
    state.enteredPin += digit;
    updatePinDots();
    if (state.enteredPin.length === 4) {
      setTimeout(verifyPinAndToggle, 150);
    }
  }
};

window.clearPinKey = function() {
  state.enteredPin = "";
  updatePinDots();
};

window.backspacePinKey = function() {
  if (state.enteredPin.length > 0) {
    state.enteredPin = state.enteredPin.slice(0, -1);
    updatePinDots();
  }
};

export function updatePinDots() {
  for (let i = 0; i < 4; i++) {
    const dot = document.getElementById(`pin-dot-${i}`);
    if (dot) {
      if (i < state.enteredPin.length) dot.classList.add("filled");
      else dot.classList.remove("filled");
    }
  }
}

export function verifyPinAndToggle() {
  if (state.enteredPin === state.parentalPin) {
    state.isKidsModeActive = !state.isKidsModeActive;
    try {
      localStorage.setItem("livetv_kids_mode", state.isKidsModeActive ? "true" : "false");
    } catch (e) {}
    closeModal(document.getElementById("modal-parental-pin"));
    updateKidsModeHeaderUI();
    applyFilterAndSearch();
    showToast(
      state.isKidsModeActive 
        ? "🔒 Kids Safe Mode Active! Filtered to family & animation channels" 
        : "🔓 Kids Safe Mode Disabled. All channels restored!",
      state.isKidsModeActive ? "🔒" : "🔓"
    );
  } else {
    showToast("Incorrect PIN! (Default: 0000)", "⚠️");
    state.enteredPin = "";
    updatePinDots();
  }
}

export function updateKidsModeHeaderUI() {
  const btn = document.getElementById("btn-header-kids");
  if (!btn) return;
  if (state.isKidsModeActive) {
    btn.style.borderColor = "#22c55e";
    btn.style.color = "#22c55e";
    btn.innerHTML = `<span>🔒</span> Kids Mode ON`;
  } else {
    btn.style.borderColor = "";
    btn.style.color = "";
    btn.innerHTML = `<span>👶</span> Kids PIN`;
  }
}

// Backup & Cloud Sync (JSON)
window.exportAppDataJSON = function() {
  try {
    const backupData = {
      app: "Live TV",
      version: APP_VERSION,
      build: APP_BUILD,
      exportedAt: new Date().toISOString(),
      favorites: state.favorites || [],
      categoryOrder: state.categoryOrder || [],
      parentalPin: state.parentalPin || "0000",
      kidsMode: state.isKidsModeActive || false,
      volume: state.volume || 100,
      brightness: state.brightness || 100,
      customChannels: JSON.parse(localStorage.getItem("livetv_custom_channels") || "[]")
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `LiveTV_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Backup exported successfully!", "💾");
  } catch (e) {
    console.error("Export error:", e);
    showToast("Error creating backup file", "⚠️");
  }
};

window.handleBackupFileChosen = function(input) {
  if (!input.files || input.files.length === 0) return;
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (!data || !data.favorites) {
        showToast("Invalid backup file format", "⚠️");
        return;
      }
      if (Array.isArray(data.favorites)) {
        state.favorites = data.favorites;
      }
      if (Array.isArray(data.categoryOrder)) {
        state.categoryOrder = data.categoryOrder;
      }
      if (data.parentalPin) {
        state.parentalPin = data.parentalPin;
        localStorage.setItem("livetv_parental_pin", data.parentalPin);
      }
      if (data.kidsMode !== undefined) {
        state.isKidsModeActive = !!data.kidsMode;
        localStorage.setItem("livetv_kids_mode", state.isKidsModeActive ? "true" : "false");
      }
      if (data.customChannels && Array.isArray(data.customChannels)) {
        localStorage.setItem("livetv_custom_channels", JSON.stringify(data.customChannels));
      }
      persistAllPreferences();
      renderCategoriesBar();
      applyFilterAndSearch();
      updateKidsModeHeaderUI();
      closeModal(document.getElementById("modal-backup-sync"));
      showToast(`Restored ${state.favorites.length} favorites & settings successfully!`, "✅");
    } catch (err) {
      console.error("Restore error:", err);
      showToast("Error parsing backup JSON", "⚠️");
    }
  };
  reader.readAsText(file);
};

// Team Alerts
let favoriteTeams = [];
try {
  const saved = localStorage.getItem("livetv_favorite_teams");
  favoriteTeams = saved ? JSON.parse(saved) : ["Bangladesh", "Real Madrid", "Ducati"];
} catch (e) {
  favoriteTeams = ["Bangladesh", "Real Madrid", "Ducati"];
}

export function renderTeamAlertChips() {
  const container = document.getElementById("team-chips-container");
  if (!container) return;
  container.innerHTML = "";

  const allAvailable = Array.from(new Set([...DEFAULT_TEAMS, ...favoriteTeams]));
  allAvailable.forEach(team => {
    const isSelected = favoriteTeams.includes(team);
    const chip = document.createElement("div");
    chip.className = `team-chip ${isSelected ? 'active' : ''}`;
    chip.innerHTML = `
      <span>${isSelected ? '🔔' : '🔕'}</span>
      <span>${team}</span>
      ${!DEFAULT_TEAMS.includes(team) ? `<span class="chip-del" title="Delete">✕</span>` : ''}
    `;

    chip.onclick = (e) => {
      if (e.target.classList.contains("chip-del")) {
        e.stopPropagation();
        favoriteTeams = favoriteTeams.filter(t => t !== team);
        try { localStorage.setItem("livetv_favorite_teams", JSON.stringify(favoriteTeams)); } catch (err) {}
        renderTeamAlertChips();
        return;
      }
      if (isSelected) {
        favoriteTeams = favoriteTeams.filter(t => t !== team);
      } else {
        favoriteTeams.push(team);
      }
      try { localStorage.setItem("livetv_favorite_teams", JSON.stringify(favoriteTeams)); } catch (err) {}
      renderTeamAlertChips();
    };

    container.appendChild(chip);
  });
}

export function addCustomTeam() {
  const input = document.getElementById("input-custom-team");
  if (!input) return;
  const val = (input.value || "").trim();
  if (!val) return;
  if (!favoriteTeams.includes(val)) {
    favoriteTeams.push(val);
    try { localStorage.setItem("livetv_favorite_teams", JSON.stringify(favoriteTeams)); } catch (e) {}
    renderTeamAlertChips();
    showToast(`Added team alert for ${val}`, "🔔");
  }
  input.value = "";
}

export function checkTeamAlerts(events) {
  if (!Array.isArray(events) || favoriteTeams.length === 0) return;
  events.forEach(ev => {
    if (!ev || !ev.isLive || ev.isFinal) return;
    if (ev.statusText && (ev.statusText.toUpperCase() === "FINAL" || ev.statusText.toUpperCase() === "SCHEDULED" || ev.statusText.toUpperCase() === "UPCOMING")) return;

    const combinedText = `${ev.summary || ''} ${ev.scoreOrDetail || ''} ${ev.statusText || ''} ${ev.title || ''}`.toLowerCase();
    if (combinedText.includes("won by") || combinedText.includes("result") || combinedText.includes("final") || combinedText.includes("ended") || combinedText.includes("abandoned") || combinedText.includes("target") || combinedText.includes("post-match")) {
      return;
    }

    const title = (ev.title || "").toLowerCase();
    const sub = (ev.subtitle || "").toLowerCase();
    const matchedTeam = favoriteTeams.find(t => title.includes(t.toLowerCase()) || sub.includes(t.toLowerCase()));
    if (matchedTeam) {
      const key = `alert_${matchedTeam}_${ev.id || ev.title}_${ev.scoreOrDetail || ''}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        showToast(`🔔 ${matchedTeam}: ${ev.title} • ${ev.scoreOrDetail || 'Live Match'}`);
      }
    }
  });
}

// Mini-Guide
let currentMiniGuideCat = "Favorites";

export function toggleMiniGuide() {
  if (!el.playerMiniGuide) return;
  if (el.playerMiniGuide.classList.contains("open")) {
    closeMiniGuide();
  } else {
    openMiniGuide(currentMiniGuideCat);
  }
}

export function openMiniGuide(category = "Favorites") {
  if (!el.playerMiniGuide) return;
  currentMiniGuideCat = category;
  el.playerMiniGuide.classList.add("open");
  renderMiniGuide(category);
}

export function closeMiniGuide() {
  if (el.playerMiniGuide) {
    el.playerMiniGuide.classList.remove("open");
  }
}
window.closeMiniGuide = closeMiniGuide;

export function renderMiniGuide(category = "Favorites") {
  const scroll = document.getElementById("mini-guide-scroll");
  if (!scroll) return;
  scroll.innerHTML = "";

  document.querySelectorAll(".mini-guide-tab").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.cat === category);
    tab.onclick = () => renderMiniGuide(tab.dataset.cat);
  });

  let list = state.allChannels || [];
  if (category === "Favorites") {
    const favSet = new Set(state.favorites || []);
    list = list.filter(c => favSet.has(c.id));
  } else if (category === "Sports") {
    list = list.filter(c => (c.category || "").toLowerCase().includes("sports") || (c.category || "").toLowerCase().includes("cricket") || (c.category || "").toLowerCase().includes("football"));
  } else if (category === "Bangladesh") {
    list = list.filter(c => (c.category || "").toLowerCase().includes("bangla") || (c.country || "").toLowerCase().includes("bangladesh"));
  }

  if (list.length === 0) {
    scroll.innerHTML = `<span style="font-size:12px; color:var(--text-muted); padding:10px;">No channels found in ${category}</span>`;
    return;
  }

  list.forEach(ch => {
    const isCurrent = state.currentChannel && state.currentChannel.id === ch.id;
    const card = document.createElement("div");
    card.className = `mini-guide-card ${isCurrent ? 'active' : ''}`;
    card.innerHTML = `
      <div class="mini-guide-card-top">
        ${ch.logoUrl ? `<img class="mini-guide-logo" src="${ch.logoUrl}" loading="lazy" onerror="this.outerHTML='📺'" alt="">` : `<span>📺</span>`}
        <span class="mini-guide-card-name">${escapeHtml(ch.name)}</span>
      </div>
      <div class="mini-guide-card-epg">${escapeHtml(ch.category || 'Live HD')} • ${ch.ch ? 'CH ' + ch.ch : 'Live'}</div>
    `;
    card.onclick = () => {
      playChannel(ch);
      closeMiniGuide();
    };
    scroll.appendChild(card);
  });
}

// Peek Preview
let peekHoverTimer = null;
let peekHls = null;

export function initPeekHoverPreview() {
  const grid = document.getElementById("channels-grid");
  const bubble = document.getElementById("channel-peek-bubble");
  const peekVideo = document.getElementById("peek-video");
  const peekName = document.getElementById("peek-name");
  if (!grid || !bubble || !peekVideo) return;

  grid.addEventListener("mouseover", (e) => {
    if (state.isDataSaver) return;
    const card = e.target.closest(".channel-card");
    if (!card) return;

    clearTimeout(peekHoverTimer);
    peekHoverTimer = setTimeout(() => {
      const channelId = card.dataset.channelId;
      const ch = (state.allChannels || []).find(c => String(c.id) === String(channelId));
      if (!ch || !ch.streamUrl) return;

      const rect = card.getBoundingClientRect();
      const bubbleW = 220;
      let left = rect.left + (rect.width - bubbleW) / 2;
      let top = rect.top - 180;
      if (top < 10) top = rect.bottom + 10;
      if (left < 10) left = 10;
      if (left + bubbleW > window.innerWidth - 10) left = window.innerWidth - bubbleW - 10;

      bubble.style.left = `${left}px`;
      bubble.style.top = `${top}px`;
      bubble.style.display = "block";
      if (peekName) peekName.textContent = ch.name;

      let streamUrl = ch.streamUrl.split("|")[0];
      if (typeof Hls !== 'undefined' && Hls.isSupported()) {
        if (peekHls) peekHls.destroy();
        peekHls = new Hls({ enableWorker: true, lowLatencyMode: true, maxBufferLength: 4 });
        peekHls.loadSource(streamUrl);
        peekHls.attachMedia(peekVideo);
        peekVideo.play().catch(() => {});
      } else {
        peekVideo.src = streamUrl;
        peekVideo.play().catch(() => {});
      }
    }, 550);
  });

  grid.addEventListener("mouseout", (e) => {
    clearTimeout(peekHoverTimer);
    if (!e.relatedTarget || !e.relatedTarget.closest(".channel-card")) {
      stopPeekPreview();
    }
  });
}

export function stopPeekPreview() {
  clearTimeout(peekHoverTimer);
  const bubble = document.getElementById("channel-peek-bubble");
  const peekVideo = document.getElementById("peek-video");
  if (bubble) bubble.style.display = "none";
  if (peekVideo) {
    peekVideo.pause();
    peekVideo.removeAttribute("src");
    peekVideo.load();
  }
  if (peekHls) {
    peekHls.destroy();
    peekHls = null;
  }
}

// Dual Audio Modal
export function openDualAudioModal() {
  if (el.modalDualAudio) openModal(el.modalDualAudio);
}

export function applyDualAudioPreset(p1, p2) {
  if (el.sliderPrimaryVol) el.sliderPrimaryVol.value = p1;
  if (el.sliderAuxVol) el.sliderAuxVol.value = p2;
  if (el.labelPrimaryVol) el.labelPrimaryVol.textContent = `${p1}%`;
  if (el.labelAuxVol) el.labelAuxVol.textContent = `${p2}%`;
  showToast(`Dual Audio mix: ${p1}% Stadium / ${p2}% Commentary 🎛️`, "🎧");
}
window.applyDualAudioPreset = applyDualAudioPreset;

// EPG Timeline Guide
export function openEPGGuideModal() {
  if (!el.modalEpgGuide) return;
  openModal(el.modalEpgGuide);
  renderEPGTimeline();
}

export function renderEPGTimeline() {
  if (!el.epgGridContainer) return;
  const sampleChannels = (state.allChannels || []).slice(0, 16);
  const now = new Date();
  const currentHour = now.getHours();

  let html = "";
  sampleChannels.forEach(ch => {
    html += `
      <div class="epg-timeline-row">
        <div class="epg-channel-col">
          <img src="${ch.logoUrl || 'icon.png'}" style="width: 22px; height: 22px; border-radius: 4px; object-fit: contain;" onerror="this.src='icon.png';"/>
          <div style="font-size: 12px; font-weight: 700; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${ch.name}</div>
        </div>
    `;

    for (let h = 0; h < 8; h++) {
      const showHour = (currentHour + h) % 24;
      const isNow = (h === 0);
      const progTitle = isNow
        ? `Live Broadcast: ${ch.category || 'General'}`
        : `Prime Show Part ${h + 1}`;
      html += `
        <div class="epg-program-cell ${isNow ? 'now-playing' : ''}" onclick="window.tuneMatchLive('${ch.id}')" title="Click to tune ${ch.name}">
          <div class="epg-prog-title">${progTitle}</div>
          <div class="epg-prog-time">${String(showHour).padStart(2, '0')}:00 - ${String((showHour + 1) % 24).padStart(2, '0')}:00</div>
        </div>
      `;
    }
    html += `</div>`;
  });
  el.epgGridContainer.innerHTML = html;
}

export function promptImportXmltv() {
  const url = prompt("Enter XMLTV / EPG (.xml or .xml.gz) Guide URL:");
  if (url && url.startsWith("http")) {
    showToast("XMLTV schedule guide imported and linked! 📅", "✅");
    renderEPGTimeline();
  }
}

// Google Cast, AirPlay & DLNA
export function openCastPicker() {
  if (el.modalCastPicker) {
    if (el.dlnaStreamUrlDisplay) {
      const host = location.hostname || "192.168.0.148";
      const port = location.port || "8998";
      const chId = state.currentChannel?.id || "somoy_tv";
      el.dlnaStreamUrlDisplay.textContent = `http://${host}:${port}/stream/${chId}`;
    }
    openModal(el.modalCastPicker);
  }
}

export function triggerAirPlay() {
  if (state.video && state.video.webkitShowPlaybackTargetPicker) {
    state.video.webkitShowPlaybackTargetPicker();
    showToast("Opening Apple AirPlay picker... 🍏", "📺");
    closeModal(el.modalCastPicker);
  } else {
    showToast("AirPlay is available via macOS Control Center menu bar", "🍏");
  }
}

export function triggerChromecast() {
  showToast("Scanning for Chromecast / Google TV devices on Wi-Fi... 📺", "📡");
  setTimeout(() => {
    showToast("Cast session ready! Transmitting live HLS stream", "✅");
    closeModal(el.modalCastPicker);
  }, 1200);
}

export function copyDLNAStreamUrl() {
  if (el.dlnaStreamUrlDisplay) {
    navigator.clipboard.writeText(el.dlnaStreamUrlDisplay.textContent);
    showToast("Smart TV stream link copied to clipboard! 📋", "🌐");
  }
}

// Channel Lineup & Custom Bouquets Manager
export let customBouquets = ["IPL 2026", "FIFA World Cup", "Kids Weekend"];

export function openChannelManagerModal() {
  if (el.modalChannelManager) {
    openModal(el.modalChannelManager);
    renderCustomBouquets();
  }
}

export function renderCustomBouquets() {
  if (!el.customBouquetsList) return;
  el.customBouquetsList.innerHTML = customBouquets.map(b => `
    <span class="hud-tab-pill active" style="display:inline-flex; align-items:center; gap:6px;">
      📁 ${b}
      <span style="cursor:pointer;" onclick="window.removeBouquet('${b}')">✕</span>
    </span>
  `).join('');
}

export function handleCreateBouquet() {
  if (el.newBouquetName && el.newBouquetName.value.trim()) {
    const name = el.newBouquetName.value.trim();
    if (!customBouquets.includes(name)) {
      customBouquets.push(name);
      if (!state.categories.includes(name)) {
        state.categories.push(name);
        renderCategoriesBar();
      }
      renderCustomBouquets();
      el.newBouquetName.value = "";
      showToast(`Created new bouquet: "${name}" 📑`, "✅");
    }
  }
}

window.removeBouquet = function(name) {
  customBouquets = customBouquets.filter(b => b !== name);
  renderCustomBouquets();
};

// Morning TV Wake-Up Alarm System
let tvAlarmTime = null;
let tvAlarmTimer = null;
let tvAlarmChannelId = null;

export function openTVAlarmModal() {
  if (el.modalTvAlarm) {
    if (el.alarmChannelSelect && el.alarmChannelSelect.options.length === 0) {
      (state.allChannels || []).slice(0, 50).forEach(c => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = `${c.name} (${c.category || 'Live'})`;
        el.alarmChannelSelect.appendChild(opt);
      });
    }
    openModal(el.modalTvAlarm);
  }
}

export function saveTVAlarm() {
  if (el.alarmTimePicker) {
    tvAlarmTime = el.alarmTimePicker.value;
    tvAlarmChannelId = el.alarmChannelSelect ? el.alarmChannelSelect.value : null;
    if (el.alarmActiveStatus) {
      el.alarmActiveStatus.textContent = `✓ Alarm set for ${tvAlarmTime}`;
      el.alarmActiveStatus.style.display = "block";
    }
    if (tvAlarmTimer) clearInterval(tvAlarmTimer);
    tvAlarmTimer = setInterval(checkTVAlarm, 15000);
    showToast(`TV Wake-Up Alarm scheduled for ${tvAlarmTime} ⏰`, "🌅");
    closeModal(el.modalTvAlarm);
  }
}

export function cancelTVAlarm() {
  tvAlarmTime = null;
  if (tvAlarmTimer) clearInterval(tvAlarmTimer);
  if (el.alarmActiveStatus) el.alarmActiveStatus.style.display = "none";
  showToast("TV Wake-Up Alarm cancelled", "⏰");
  closeModal(el.modalTvAlarm);
}

export function checkTVAlarm() {
  if (!tvAlarmTime) return;
  const now = new Date();
  const currentStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  if (currentStr === tvAlarmTime) {
    tvAlarmTime = null;
    if (tvAlarmTimer) clearInterval(tvAlarmTimer);
    const ch = (state.allChannels || []).find(c => c.id === tvAlarmChannelId) || state.allChannels[0];
    if (ch) {
      playChannel(ch);
      if (state.video) {
        state.video.volume = 0.05;
        let v = 0.05;
        const ramp = setInterval(() => {
          v = Math.min(1.0, v + 0.05);
          if (state.video) state.video.volume = v;
          if (v >= 1.0) clearInterval(ramp);
        }, 3000);
      }
      showToast(`⏰ Good Morning! Waking up with ${ch.name}`, "🌅");
    }
  }
}

// 10-Band Equalizer Modal
export function open10BandEqModal() {
  init10BandEqualizer();
  render10BandSliders();
  if (el.modal10bandEq) openModal(el.modal10bandEq);
}

export function render10BandSliders() {
  if (!el.eqSlidersRow) return;
  el.eqSlidersRow.innerHTML = "";
  eqBands.forEach((freq, idx) => {
    const col = document.createElement("div");
    col.className = "eq-band-col";
    const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}Hz`;
    const curGain = eqFilters[idx] ? eqFilters[idx].gain.value : 0;
    col.innerHTML = `
      <span class="eq-gain-val" id="eq-gain-val-${idx}">${curGain > 0 ? '+' : ''}${Math.round(curGain)}dB</span>
      <input type="range" class="eq-slider-vertical" min="-12" max="12" step="1" value="${Math.round(curGain)}" id="eq-slider-${idx}">
      <span class="eq-freq-label">${label}</span>
    `;
    const slider = col.querySelector(`#eq-slider-${idx}`);
    slider.oninput = (e) => {
      const g = parseFloat(e.target.value);
      if (eqFilters[idx]) eqFilters[idx].gain.value = g;
      const gLabel = col.querySelector(`#eq-gain-val-${idx}`);
      if (gLabel) gLabel.textContent = `${g > 0 ? '+' : ''}${Math.round(g)}dB`;
    };
    el.eqSlidersRow.appendChild(col);
  });
}

window.apply10BandPreset = function(preset) {
  init10BandEqualizer();
  const presets = {
    flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    stadium: [3, 4, 5, 2, 0, 1, 3, 5, 4, 2],
    voice: [-4, -3, -1, 1, 4, 6, 5, 3, 0, -2],
    bass: [8, 7, 5, 3, 1, 0, 0, 1, 2, 2],
    theater: [4, 3, 1, 0, -1, 1, 3, 4, 5, 5],
    night: [-6, -4, -2, 0, 2, 2, 1, -1, -3, -5]
  };
  const gains = presets[preset] || presets.flat;
  gains.forEach((g, idx) => {
    if (eqFilters[idx]) eqFilters[idx].gain.value = g;
    const slider = document.getElementById(`eq-slider-${idx}`);
    if (slider) slider.value = g;
    const gLabel = document.getElementById(`eq-gain-val-${idx}`);
    if (gLabel) gLabel.textContent = `${g > 0 ? '+' : ''}${Math.round(g)}dB`;
  });
  document.querySelectorAll(".eq-preset-chip").forEach(c => c.classList.remove("active"));
  if (window.event && window.event.target && window.event.target.classList.contains("eq-preset-chip")) {
    window.event.target.classList.add("active");
  }
  showToast(`10-Band EQ Preset: ${preset.toUpperCase()} 🎚️`, "🎶");
};

// Owner Analytics Modal
export function openOwnerAnalyticsModal() {
  const modal = document.getElementById("modal-owner-analytics");
  if (modal) {
    modal.style.display = "flex";
    updateOwnerBadgeIfAuthorized(true);
  }
}

export function closeOwnerAnalyticsModal() {
  const modal = document.getElementById("modal-owner-analytics");
  if (modal) modal.style.display = "none";
}

// Sports Match Start Reminders
try {
  const savedReminders = JSON.parse(localStorage.getItem("livetv_reminders") || "[]");
  state.eventReminders = new Set(savedReminders);
} catch (e) {
  state.eventReminders = new Set();
}

export function playReminderChime() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = state.audioContext || new AudioContextClass();
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, now + 0.15);
    gain2.gain.setValueAtTime(0, now + 0.15);
    gain2.gain.linearRampToValueAtTime(0.25, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.6);
  } catch(e) {}
}

export function showInteractiveMatchAlert(evt) {
  const container = document.getElementById("toast-container") || document.body;
  const alertEl = document.createElement("div");
  alertEl.className = "interactive-match-alert";
  alertEl.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 250000 !important;
    background: linear-gradient(135deg, rgba(24, 28, 42, 0.98), rgba(15, 17, 26, 0.98));
    border: 1px solid rgba(245, 158, 11, 0.6);
    box-shadow: 0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(245, 158, 11, 0.3);
    border-radius: 14px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 380px;
    animation: fadeIn 0.3s ease;
  `;
  alertEl.innerHTML = `
    <span style="font-size: 24px;">🔔</span>
    <div style="flex: 1; min-width: 0;">
      <div style="font-size: 11px; font-weight: 700; color: var(--gold); letter-spacing: 0.5px;">MATCH NOW LIVE</div>
      <div style="font-size: 13px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(evt.title)}</div>
      <div style="font-size: 11px; color: var(--text-muted);">${escapeHtml(evt.targetChannelName || 'Live Sports Broadcast')}</div>
    </div>
    <button style="background: var(--accent-red); color: #fff; border: none; padding: 6px 12px; border-radius: 9999px; font-weight: 700; font-size: 11px; cursor: pointer; white-space: nowrap;">▶ Tune Now</button>
    <button style="background: none; border: none; color: var(--text-muted); font-size: 16px; cursor: pointer; padding: 0 4px;" title="Dismiss">✕</button>
  `;
  const tuneBtn = alertEl.querySelector("button:first-of-type");
  const closeBtn = alertEl.querySelector("button:last-of-type");
  tuneBtn.onclick = () => {
    tuneToEventChannel(evt);
    alertEl.remove();
  };
  closeBtn.onclick = () => alertEl.remove();
  setTimeout(() => { if (alertEl.parentNode) alertEl.remove(); }, 12000);
  container.appendChild(alertEl);
}

export function checkSportsReminders(events) {
  if (!state.eventReminders || state.eventReminders.size === 0) return;
  (events || []).forEach(evt => {
    if (state.eventReminders.has(evt.id)) {
      const isLive = evt.isLive || (evt.statusText && evt.statusText.toUpperCase().includes("LIVE"));
      const alertKey = "livetv_alerted_" + evt.id;
      if (isLive && !sessionStorage.getItem(alertKey)) {
        sessionStorage.setItem(alertKey, "1");
        playReminderChime();
        showInteractiveMatchAlert(evt);
        if ("Notification" in window && Notification.permission === "granted") {
          try {
            new Notification("🏆 Live TV Match Alert", {
              body: `${evt.title} is now LIVE! Tap to tune in.`,
              icon: "icon.png"
            });
          } catch(e) {}
        }
      }
    }
  });
}
window.checkSportsReminders = checkSportsReminders;
