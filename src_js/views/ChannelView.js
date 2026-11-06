/**
 * Live TV - Channel Grid & Category UI Views
 * Architecture: View / ChannelView
 */

import { state } from "../models/State.js";
import { el } from "./Elements.js";
import { escapeHtml } from "../utils/DomUtils.js";
import { selectCategory, applyFilterAndSearch, getChannelEPG } from "../models/ChannelModel.js";
import { playChannel } from "../controllers/PlayerController.js";
import { toggleFavorite } from "../controllers/ChannelController.js";

// Render Categories Horizontal Tabs
export function renderCategoriesBar() {
  if (!el.categoriesBar) return;
  el.categoriesBar.innerHTML = "";

  // 1. "All" Chip
  const allChip = document.createElement("button");
  allChip.className = `category-chip ${state.selectedCategory === "All" ? "active" : ""}`;
  allChip.innerHTML = `<span>🌐</span><span>All</span>`;
  allChip.onclick = () => selectCategory("All");
  el.categoriesBar.appendChild(allChip);

  // 2. "⭐ Favorites" Chip
  const favChip = document.createElement("button");
  favChip.className = `category-chip ${state.selectedCategory === "Favorites" ? "active" : ""}`;
  const favCount = (state.favorites || []).length;
  favChip.innerHTML = `<span>⭐</span><span>Favorites</span><span style="opacity: 0.7; font-size: 11px;">(${favCount})</span>`;
  favChip.onclick = () => selectCategory("Favorites");
  el.categoriesBar.appendChild(favChip);

  // 3. User Categorized Chips
  (state.categories || []).forEach(cat => {
    const chip = document.createElement("button");
    chip.className = `category-chip ${state.selectedCategory === cat ? "active" : ""}`;
    chip.textContent = cat;
    chip.onclick = () => selectCategory(cat);
    el.categoriesBar.appendChild(chip);
  });
}

// Progressive Chunked Grid Rendering for 60fps Scrolling (Single Fragment Reflow)
export function renderChannelBatch() {
  if (!el.channelsGrid) return;
  const start = state.renderedChannelCount;
  const end = Math.min(start + state.PAGE_SIZE, state.filteredChannels.length);
  if (start >= end) return;

  const fragment = document.createDocumentFragment();
  for (let i = start; i < end; i++) {
    const channel = state.filteredChannels[i];
    const card = createChannelCard(channel, i);
    fragment.appendChild(card);
  }
  el.channelsGrid.appendChild(fragment);

  state.renderedChannelCount = end;
}

// Channel Card DOM Node
export function createChannelCard(channel, index) {
  const card = document.createElement("div");
  const isCurrentlyPlaying = state.currentChannel && state.currentChannel.id === channel.id;
  card.className = `channel-card ${isCurrentlyPlaying ? "active" : ""}`;

  const isFav = (state.favorites || []).includes(channel.id);
  const favRank = isFav ? state.favorites.indexOf(channel.id) + 1 : null;
  const epg = getChannelEPG(channel);

  // Extract initial for placeholder
  const initial = (channel.name || "TV").charAt(0).toUpperCase();

  card.innerHTML = `
    <div class="channel-logo-wrap">
      ${channel.logoUrl ?
        `<img class="channel-logo" src="${escapeHtml(channel.logoUrl)}" loading="lazy" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
         <div class="channel-logo-placeholder" style="display:none;">${initial}</div>` :
        `<div class="channel-logo-placeholder">${initial}</div>`
      }
    </div>
    <div class="channel-info">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 3px;">
        <span class="channel-card-number">#${channel.channelNumber || (index + 1)}</span>
        <div class="channel-name" title="${escapeHtml(channel.name)}">${escapeHtml(channel.name)}</div>
      </div>
      <div class="channel-meta">
        <span>${escapeHtml(channel.category || 'Live')}</span>
        ${channel.country ? `<span class="channel-country-badge">${escapeHtml(channel.country)}</span>` : ""}
        ${favRank ? `<span style="color:#fbbf24; font-weight:800; font-size:10.5px;">★ #${favRank}</span>` : ""}
      </div>
      <div class="card-epg-now" title="Now: ${escapeHtml(epg.current)}">
        <span class="card-epg-dot"></span>
        <span>${escapeHtml(epg.current)}</span>
      </div>
    </div>
    <div class="channel-actions">
      <button class="fav-star-btn ${isFav ? "is-fav" : ""}" title="${isFav ? "Remove Favorite" : "Add to Favorites"}">
        ${isFav ? "★" : "☆"}
      </button>
    </div>
  `;

  // Play channel on card click
  card.onclick = (e) => {
    if (e.target.closest(".fav-star-btn")) return;
    playChannel(channel, index);
  };

  // Toggle favorite
  const favBtn = card.querySelector(".fav-star-btn");
  if (favBtn) {
    favBtn.onclick = (e) => {
      e.stopPropagation();
      toggleFavorite(channel.id);
    };
  }

  return card;
}

export function updateActiveCardHighlight() {
  if (!el.channelsGrid) return;
  // O(1) removal of previously active card highlight instead of scanning all cards
  const prevActive = el.channelsGrid.querySelector(".channel-card.active");
  if (prevActive) prevActive.classList.remove("active");
  if (!state.currentChannel) return;

  const currentIdx = state.filteredChannels.findIndex(c => c.id === state.currentChannel.id);
  if (currentIdx >= 0) {
    const targetCard = el.channelsGrid.children[currentIdx];
    if (targetCard && targetCard.classList.contains("channel-card")) {
      targetCard.classList.add("active");
    }
  }
}

// Render Quick Switch Horizontal Carousel at Bottom of Player
export function renderQuickSwitchCarousel() {
  if (!el.quickSwitchCarousel) return;
  el.quickSwitchCarousel.innerHTML = "";
  if (!state.filteredChannels.length) return;

  // Show 15 nearest channels
  const currentIdx = state.currentChannelIndex >= 0 ? state.currentChannelIndex : 0;
  const count = state.filteredChannels.length;
  const start = Math.max(0, currentIdx - 7);
  const end = Math.min(count, start + 15);

  const fragment = document.createDocumentFragment();
  for (let i = start; i < end; i++) {
    const ch = state.filteredChannels[i];
    const item = document.createElement("button");
    const isCurrent = state.currentChannel && state.currentChannel.id === ch.id;
    const isFav = (state.favorites || []).includes(ch.id);

    item.className = `quick-channel-item ${isCurrent ? "active" : ""}`;
    item.innerHTML = `
      ${isFav ? `<span style="color:var(--gold);">★</span>` : ""}
      <span>${escapeHtml(ch.name)}</span>
    `;

    item.onclick = (e) => {
      e.stopPropagation();
      playChannel(ch, i);
    };

    fragment.appendChild(item);
  }
  el.quickSwitchCarousel.appendChild(fragment);
}

export function renderRecentlyWatched() {
  if (!el.recentlyWatchedContainer || !el.recentlyWatchedCarousel) return;
  if (!state.recentChannels || state.recentChannels.length === 0) {
    el.recentlyWatchedContainer.style.display = "none";
    return;
  }

  const channelMap = new Map();
  state.allChannels.forEach(c => channelMap.set(c.id, c));

  const validRecents = state.recentChannels
    .map(id => channelMap.get(id))
    .filter(Boolean);

  if (validRecents.length === 0) {
    el.recentlyWatchedContainer.style.display = "none";
    return;
  }

  el.recentlyWatchedContainer.style.display = "block";
  el.recentlyWatchedCarousel.innerHTML = "";

  validRecents.forEach(ch => {
    const card = document.createElement("div");
    card.className = "recent-card";
    card.onclick = () => playChannel(ch);
    card.innerHTML = `
      <img class="recent-card-logo" src="${escapeHtml(ch.logoUrl || '')}" alt="" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'28\\' height=\\'28\\' fill=\\'%23555\\'><rect width=\\'100%\\' height=\\'100%\\'/></svg>';" />
      <div class="recent-card-info">
        <div class="recent-card-name" title="${escapeHtml(ch.name)}">${escapeHtml(ch.name)}</div>
        <div class="recent-card-meta">${escapeHtml(ch.category || 'Live')} • CH ${String(ch.channelNumber || '').padStart(2, '0')}</div>
      </div>
    `;
    el.recentlyWatchedCarousel.appendChild(card);
  });
}
