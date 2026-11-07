/**
 * Live TV - Channel Catalog & Storage Model
 * Architecture: Model / ChannelModel
 */

import { state } from "./State.js";
import {
  STORAGE_FAVORITES,
  STORAGE_CATEGORIES,
  STORAGE_VOLUME,
  STORAGE_BRIGHTNESS
} from "./Constants.js";
import { el } from "../views/Elements.js";
import { showToast } from "../utils/DomUtils.js";
import { renderCategoriesBar, renderChannelBatch } from "../views/ChannelView.js";
import { applyBrightness } from "../views/PlayerView.js";
import { loadRecentlyWatched } from "../controllers/ChannelController.js";
import { initHeroSpotlight } from "../views/HeroView.js";
import { syncRemoteChannels, syncRemoteStatus } from "../controllers/AppController.js";
import { playChannel } from "../controllers/PlayerController.js";
import { closeModal } from "../views/ModalView.js";
import { updateKidsModeHeaderUI, loadScheduledRecordings } from "../views/ModalView.js";
import { toggleSportsTicker } from "../views/HUDView.js";

// Live EPG Schedule Provider
export function getChannelEPG(channel) {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const progressPct = ((minutes % 30) / 30) * 100;
  const remainingMins = 30 - (minutes % 30);

  const cat = (channel && channel.category) ? channel.category.toLowerCase() : "";
  const name = (channel && channel.name) ? channel.name.toLowerCase() : "";

  // 1. Check if there's a matching live sport event (O(1) indexed check first, skip non-sports)
  if (state.liveEvents && state.liveEvents.length > 0) {
    let liveMatch = null;
    if (channel && channel.id && state.liveEventsTargetMap && state.liveEventsTargetMap.has(channel.id)) {
      liveMatch = state.liveEventsTargetMap.get(channel.id);
    } else if (cat.includes("sport") || cat.includes("cricket") || cat.includes("moto") || cat.includes("racing") || cat.includes("ten") || name.includes("sport")) {
      liveMatch = state.liveEvents.find(ev => 
        ev.isLive && (
          (ev.targetChannelName && name.includes(ev.targetChannelName.toLowerCase())) ||
          (ev.sport && name.includes(ev.sport.toLowerCase()))
        )
      );
    }
    if (liveMatch) {
      return {
        current: `${liveMatch.sportEmoji || '🏆'} ${liveMatch.title} • LIVE`,
        next: liveMatch.subtitle || "Post-Match Analysis & Studio Highlights",
        progress: Math.min(95, Math.max(15, Math.round(progressPct))),
        remainingMins: remainingMins
      };
    }
  }

  let currentShow = "Live Broadcast Coverage";
  let nextShow = "Prime Time Special";

  if (cat.includes("sport") || cat.includes("cricket") || cat.includes("motogp") || cat.includes("racing")) {
    if (hours >= 19 || hours < 2) {
      currentShow = "Championship Matchday Live";
      nextShow = "Post-Match Analysis & Highlights";
    } else if (hours >= 12) {
      currentShow = "World Sports Live Coverage";
      nextShow = "Matchday Studio Countdown";
    } else {
      currentShow = "Morning Highlights & Replay";
      nextShow = "Live World Feed";
    }
  } else if (cat.includes("news")) {
    if (hours >= 20) {
      currentShow = "Prime News Bulletin & Special Report";
      nextShow = "Late Night Headlines & Analysis";
    } else if (hours >= 18) {
      currentShow = "Evening Primetime News Hour";
      nextShow = "Global Round-Up";
    } else if (hours >= 12) {
      currentShow = "Midday News & Stock Telemetry";
      nextShow = "Special Investigation";
    } else {
      currentShow = "Morning News Watch & Weather";
      nextShow = "Business & Regional News";
    }
  } else if (cat.includes("movie") || cat.includes("cinema")) {
    currentShow = "Feature Film Presentation";
    nextShow = "Blockbuster Cinema Night";
  } else if (cat.includes("kids") || cat.includes("animation") || cat.includes("cartoon")) {
    currentShow = "Animated Adventures Hour";
    nextShow = "Fun Cartoons Marathon";
  } else if (cat.includes("documentary") || cat.includes("nature")) {
    currentShow = "Planet Earth / Wildlife Chronicles";
    nextShow = "Science & History Discovery";
  } else if (cat.includes("music")) {
    currentShow = "Non-Stop Hit Music Countdown";
    nextShow = "Top 40 Chartbusters Live";
  } else {
    currentShow = "World Programming Live";
    nextShow = "Continuous Broadcast";
  }

  return {
    current: currentShow,
    next: nextShow,
    progress: Math.round(progressPct),
    remainingMins: remainingMins
  };
}

// Load Stored Settings (Supports Native macOS Application Support & Web LocalStorage)
export function loadStoredPreferences() {
  let prefs = null;
  if (window.__LIVETV_SAVED_PREFERENCES__) {
    if (typeof window.__LIVETV_SAVED_PREFERENCES__ === "string") {
      try {
        prefs = JSON.parse(window.__LIVETV_SAVED_PREFERENCES__);
      } catch (e) {}
    } else if (typeof window.__LIVETV_SAVED_PREFERENCES__ === "object") {
      prefs = window.__LIVETV_SAVED_PREFERENCES__;
    }
  }

  // 1. Favorites Order
  if (prefs && Array.isArray(prefs.favorites) && prefs.favorites.length > 0) {
    state.favorites = prefs.favorites;
  } else {
    try {
      const savedFavs = localStorage.getItem(STORAGE_FAVORITES);
      if (savedFavs) state.favorites = JSON.parse(savedFavs);
    } catch (e) {
      state.favorites = [];
    }
  }

  // 2. Category Order
  if (prefs && Array.isArray(prefs.categoryOrder) && prefs.categoryOrder.length > 0) {
    state.categoryOrder = prefs.categoryOrder;
  } else {
    try {
      const savedCats = localStorage.getItem(STORAGE_CATEGORIES);
      if (savedCats) state.categoryOrder = JSON.parse(savedCats);
    } catch (e) {
      state.categoryOrder = [];
    }
  }

  // 3. Volume
  if (prefs && typeof prefs.volume === "number") {
    state.volume = prefs.volume;
  } else {
    const savedVol = localStorage.getItem(STORAGE_VOLUME);
    if (savedVol !== null) state.volume = parseInt(savedVol, 10);
  }
  const isBoosted = state.volume > 100;
  if (el.sliderVolume) el.sliderVolume.value = state.volume;
  if (el.volumeValText) el.volumeValText.textContent = isBoosted ? `${state.volume}% 🚀` : `${state.volume}%`;
  if (state.video) state.video.volume = Math.min(1.0, Math.max(0, state.volume / 100));

  // 4. Brightness
  if (prefs && typeof prefs.brightness === "number") {
    state.brightness = prefs.brightness;
  } else {
    const savedBri = localStorage.getItem(STORAGE_BRIGHTNESS);
    if (savedBri !== null) state.brightness = parseInt(savedBri, 10);
  }
  if (el.sliderBrightness) el.sliderBrightness.value = state.brightness;
  applyBrightness(state.brightness);

  // 5. Version 4.0 & Quality Preferences
  const savedQuality = localStorage.getItem("livetv_preferred_quality");
  if (savedQuality !== null) {
    state.selectedQualityHeight = parseInt(savedQuality, 10);
  } else {
    state.selectedQualityHeight = 1080; // Always start with 1080p by default
  }

  state.parentalPin = localStorage.getItem("livetv_parental_pin") || "0000";
  state.isKidsModeActive = localStorage.getItem("livetv_kids_mode") === "true";
  if (typeof updateKidsModeHeaderUI === "function") updateKidsModeHeaderUI();
  if (typeof loadScheduledRecordings === "function") loadScheduledRecordings();
  if (localStorage.getItem("livetv_ticker_visible") === "true" && typeof toggleSportsTicker === "function") {
    toggleSportsTicker(true);
  }
}

// Persist All Settings to macOS Native Application Support & LocalStorage
export function persistAllPreferences() {
  const payload = {
    favorites: state.favorites,
    categoryOrder: state.categoryOrder,
    volume: state.volume,
    brightness: state.brightness,
    parentalPin: state.parentalPin,
    kidsMode: state.isKidsModeActive
  };
  const jsonStr = JSON.stringify(payload);

  try {
    localStorage.setItem(STORAGE_FAVORITES, JSON.stringify(state.favorites));
    localStorage.setItem(STORAGE_CATEGORIES, JSON.stringify(state.categoryOrder));
    localStorage.setItem(STORAGE_VOLUME, state.volume.toString());
    localStorage.setItem(STORAGE_BRIGHTNESS, state.brightness.toString());
  } catch (e) {}

  if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.savePreferences) {
    try {
      window.webkit.messageHandlers.savePreferences.postMessage(jsonStr);
    } catch (e) {
      console.warn("Native bridge save error:", e);
    }
  }
}

// Load Saved Custom Channels from LocalStorage
export function loadSavedCustomChannels() {
  try {
    const raw = localStorage.getItem("livetv_custom_channels");
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        state.allChannels = list.concat(state.allChannels);
      }
    }
  } catch (e) {
    console.warn("Could not load saved custom channels:", e);
  }
}

export function saveCustomChannel(name, url, category, logo) {
  if (!url || !name) {
    alert("Please enter both Stream URL and Channel Name.");
    return;
  }
  const newChan = {
    id: `custom_${Date.now()}`,
    name: name.trim(),
    streamUrl: url.trim(),
    logoUrl: logo ? logo.trim() : "",
    category: category.trim() || "Custom Channels",
    country: "Custom",
    isCustom: true
  };
  let saved = [];
  try {
    saved = JSON.parse(localStorage.getItem("livetv_custom_channels") || "[]");
  } catch (e) {}
  saved.unshift(newChan);
  localStorage.setItem("livetv_custom_channels", JSON.stringify(saved));

  state.allChannels.unshift(newChan);
  buildCategories();
  applyFilterAndSearch();
  syncRemoteChannels();
  showToast(`Added channel: ${newChan.name}`);
  closeModal(el.modalImportM3u);
  playChannel(newChan, 0);
}

// Sanitize Favorites (Remove orphaned IDs not present in channels catalog)
export function sanitizeFavorites() {
  if (!state.allChannels || state.allChannels.length === 0) return;
  const validIds = new Set(state.allChannels.map(c => String(c.id)));
  const origLen = state.favorites.length;
  state.favorites = state.favorites.filter(id => validIds.has(String(id)));
  if (state.favorites.length !== origLen) {
    console.log(`[LiveTV] Sanitized favorites: pruned ${origLen - state.favorites.length} orphaned IDs. Total valid favorites: ${state.favorites.length}`);
    persistAllPreferences();
  }
}

// Load Channels from Local channels_data.js or fallback to fetch
export async function loadChannels() {
  if (window.CHANNELS_DATA && Array.isArray(window.CHANNELS_DATA) && window.CHANNELS_DATA.length > 0) {
    state.allChannels = window.CHANNELS_DATA.slice();
    loadSavedCustomChannels();
    state.allChannels.forEach((ch, idx) => {
      ch.channelNumber = idx + 1;
    });
    sanitizeFavorites();
    buildCategories();
    applyFilterAndSearch();
    loadRecentlyWatched();
    initHeroSpotlight();
    syncRemoteChannels();
    syncRemoteStatus();
    return;
  }

  try {
    const res = await fetch("channels.json");
    if (!res.ok) throw new Error("Failed to load channels.json");
    const data = await res.json();
    state.allChannels = data;
    loadSavedCustomChannels();
    state.allChannels.forEach((ch, idx) => {
      ch.channelNumber = idx + 1;
    });
    sanitizeFavorites();
    buildCategories();
    applyFilterAndSearch();
    loadRecentlyWatched();
    initHeroSpotlight();
    syncRemoteChannels();
    syncRemoteStatus();
  } catch (err) {
    console.error("Error loading channels:", err);
    if (el.channelCountText) el.channelCountText.textContent = "Error loading channel catalog.";
  }
}

// Build & Sort Categories
export function buildCategories() {
  const catSet = new Set();
  state.allChannels.forEach(c => {
    if (c.category) catSet.add(c.category);
  });

  const discovered = Array.from(catSet);

  let ordered = [];
  if (state.categoryOrder && state.categoryOrder.length > 0) {
    state.categoryOrder.forEach(cat => {
      if (discovered.includes(cat) && !ordered.includes(cat)) {
        ordered.push(cat);
      }
    });
    discovered.forEach(cat => {
      if (!ordered.includes(cat)) ordered.push(cat);
    });
  } else {
    const primary = ["Bangladesh", "Sports", "Cricket", "MotoGP", "News", "Movies", "Entertainment", "Music", "Kids", "Documentary"];
    primary.forEach(p => {
      if (discovered.includes(p) && !ordered.includes(p)) ordered.push(p);
    });
    discovered.sort().forEach(cat => {
      if (!ordered.includes(cat)) ordered.push(cat);
    });
  }

  state.categories = ordered;
  renderCategoriesBar();
}

export function selectCategory(category) {
  state.selectedCategory = category;
  renderCategoriesBar();
  applyFilterAndSearch();
  const activeChip = el.categoriesBar?.querySelector(".category-chip.active");
  if (activeChip) activeChip.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
}

// Filter and Search
export function applyFilterAndSearch() {
  const query = state.searchQuery.trim().toLowerCase();

  let list = [];
  if (state.selectedCategory === "Favorites") {
    const favSet = new Set(state.favorites);
    const favMap = new Map();
    state.allChannels.forEach(c => {
      if (favSet.has(c.id)) favMap.set(c.id, c);
    });
    state.favorites.forEach(id => {
      if (favMap.has(id)) list.push(favMap.get(id));
    });
  } else if (state.selectedCategory === "All") {
    list = state.allChannels.slice();
  } else {
    list = state.allChannels.filter(c => c.category === state.selectedCategory);
  }

  if (query.length > 0) {
    list = list.filter(c => {
      const nameMatch = c.name && c.name.toLowerCase().includes(query);
      const catMatch = c.category && c.category.toLowerCase().includes(query);
      const countryMatch = c.country && c.country.toLowerCase().includes(query);
      return nameMatch || catMatch || countryMatch;
    });
  }

  if (state.isKidsModeActive) {
    const safeCategories = ["animation", "kids", "cartoons", "children", "family", "documentary", "nature", "sports", "music", "educational"];
    list = list.filter(c => {
      const cat = (c.category || "").toLowerCase();
      const name = (c.name || "").toLowerCase();
      if (cat.includes("xxx") || cat.includes("adult") || name.includes("xxx") || name.includes("adult") || cat.includes("erotic") || cat.includes("crime")) return false;
      return safeCategories.some(sc => cat.includes(sc) || name.includes(sc));
    });
  }

  state.filteredChannels = list;
  if (el.channelCountText) {
    el.channelCountText.textContent = `Showing ${list.length.toLocaleString()} channels • ${state.selectedCategory}${state.isKidsModeActive ? ' (Kids Mode 🔒)' : ''}`;
  }

  if (el.channelsGrid) el.channelsGrid.innerHTML = "";
  state.renderedChannelCount = 0;
  renderChannelBatch();

  if (el.emptyState) {
    el.emptyState.style.display = list.length === 0 ? "block" : "none";
  }
}

export function onChannelSortChange(sortMode) {
  state.currentSortMode = sortMode;
  if (!state.allChannels) return;

  let list = [...state.filteredChannels];
  switch (sortMode) {
    case "number":
      list.sort((a, b) => (a.channelNumber || 9999) - (b.channelNumber || 9999));
      break;
    case "name":
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      break;
    case "favorites": {
      const favSet = new Set((state.favorites || []).map(String));
      list.sort((a, b) => {
        const aFav = favSet.has(String(a.id));
        const bFav = favSet.has(String(b.id));
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return (a.channelNumber || 9999) - (b.channelNumber || 9999);
      });
      break;
    }
    case "sports":
      list.sort((a, b) => {
        const sportsA = /sport|cricket|football|tennis|motogp/i.test(a.category || "");
        const sportsB = /sport|cricket|football|tennis|motogp/i.test(b.category || "");
        if (sportsA && !sportsB) return -1;
        if (!sportsA && sportsB) return 1;
        return (a.channelNumber || 9999) - (b.channelNumber || 9999);
      });
      break;
    case "default":
    default:
      applyFilterAndSearch();
      return;
  }
  state.filteredChannels = list;
  state.renderedChannelCount = 0;
  if (el.channelsGrid) el.channelsGrid.innerHTML = "";
  renderChannelBatch();
  showToast(`Channels sorted: ${sortMode.toUpperCase()} 🗂️`, "⚡");
}

export function onQuickFilter(filterKey) {
  state.quickFilter = filterKey;
  if (filterKey === "all") {
    applyFilterAndSearch();
  } else if (filterKey === "hd") {
    state.filteredChannels = state.allChannels.filter(c => /hd|4k|fhd|uhd|1080/i.test(c.name || "") || (c.category && /hd/i.test(c.category)));
    state.renderedChannelCount = 0;
    if (el.channelsGrid) el.channelsGrid.innerHTML = "";
    renderChannelBatch();
    showToast(`Filtered: HD / 4K Channels (${state.filteredChannels.length}) ⚡`);
  } else if (filterKey === "sports") {
    state.filteredChannels = state.allChannels.filter(c => /sport|cricket|football|tennis|motogp|racing|wwe/i.test(c.category || "") || /sport|cricket/i.test(c.name || ""));
    state.renderedChannelCount = 0;
    if (el.channelsGrid) el.channelsGrid.innerHTML = "";
    renderChannelBatch();
    showToast(`Filtered: Live Sports Channels (${state.filteredChannels.length}) 🏆`);
  } else if (filterKey === "news") {
    state.filteredChannels = state.allChannels.filter(c => /news|somoy|jamuna|bbc|cnn|al jazeera|dd news/i.test(c.category || "") || /news/i.test(c.name || ""));
    state.renderedChannelCount = 0;
    if (el.channelsGrid) el.channelsGrid.innerHTML = "";
    renderChannelBatch();
    showToast(`Filtered: Live News Channels (${state.filteredChannels.length}) 📰`);
  }
}
