/**
 * Live TV - Hero Spotlight UI View
 * Architecture: View / HeroView
 */

import { state } from "../models/State.js";
import { el } from "./Elements.js";
import { playChannel } from "../controllers/PlayerController.js";
import { toggleFavorite } from "../controllers/ChannelController.js";

export let heroFeaturedChannel = null;

export function initHeroSpotlight() {
  if (localStorage.getItem("livetv_hero_collapsed") === "1" && el.heroSpotlight) {
    el.heroSpotlight.style.display = "none";
  }
  if (!state.allChannels || state.allChannels.length === 0) return;
  let candidate = null;
  if (state.favorites && state.favorites.length > 0) {
    candidate = state.allChannels.find(c => String(c.id) === String(state.favorites[0]));
  }
  if (!candidate) {
    candidate = state.allChannels.find(c => /t sports|willow|spotv|star sports|sony ten|sky sports/i.test(c.name || ""));
  }
  if (!candidate) candidate = state.allChannels[0];

  heroFeaturedChannel = candidate;
  if (!candidate) return;

  if (el.heroTitle) {
    el.heroTitle.textContent = `${candidate.name} — Live Broadcast 4K`;
  }
  if (el.heroSubtitle) {
    el.heroSubtitle.textContent = `Streaming live in high definition • ${candidate.category || 'Sports'} • Crystal clear audio & 4K AI upscaling`;
  }
  if (el.heroBtnFav) {
    const isFav = (state.favorites || []).includes(candidate.id);
    el.heroBtnFav.classList.toggle("is-fav", isFav);
    el.heroBtnFav.innerHTML = isFav ? "★" : "☆";
  }
  const sportBadge = document.getElementById("hero-sport-badge");
  if (sportBadge) {
    const isSport = /sport|cricket|football|tennis|motogp/i.test(candidate.category || "");
    sportBadge.textContent = isSport ? `🏆 ${candidate.category || 'LIVE SPORTS'}` : `📺 ${candidate.category || 'LIVE TV'}`;
  }
}

export function playHeroChannel() {
  if (heroFeaturedChannel) {
    playChannel(heroFeaturedChannel);
  } else if (state.allChannels && state.allChannels.length > 0) {
    playChannel(state.allChannels[0]);
  }
}

export function toggleHeroFavorite() {
  if (heroFeaturedChannel) {
    toggleFavorite(heroFeaturedChannel.id);
    if (el.heroBtnFav) {
      const isFav = (state.favorites || []).includes(heroFeaturedChannel.id);
      el.heroBtnFav.classList.toggle("is-fav", isFav);
      el.heroBtnFav.innerHTML = isFav ? "★" : "☆";
    }
  }
}
