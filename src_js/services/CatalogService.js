/**
 * Live TV - Catalog Microservice
 * Architecture: Service / CatalogService
 * Responsibility: Channel filtering, indexing, category collation, and custom stream additions.
 */

import { StorageService } from "./StorageService.js";

export class CatalogService {
  /**
   * Normalizes raw channel records into standard internal channel objects
   */
  static normalizeChannel(raw, index = 0) {
    if (!raw) return null;
    return {
      id: raw.id || `custom-${index}-${Date.now()}`,
      name: raw.name || "Unnamed Channel",
      logoUrl: raw.logoUrl || raw.logo || "",
      category: raw.category || "General",
      country: raw.country || "Global",
      language: raw.language || "English",
      streamUrl: raw.streamUrl || raw.url || "",
      channelNumber: raw.channelNumber || index + 1,
      isHd: raw.isHd !== false,
      isCustom: !!raw.isCustom
    };
  }

  /**
   * Merges system channels with user custom channels
   */
  static mergeWithCustomChannels(systemChannels) {
    const customChannels = StorageService.getCustomChannels();
    if (!Array.isArray(customChannels) || customChannels.length === 0) {
      return systemChannels || [];
    }
    const combined = [...(systemChannels || [])];
    customChannels.forEach(custom => {
      if (!combined.some(c => c.id === custom.id)) {
        combined.push(custom);
      }
    });
    return combined;
  }

  /**
   * Filters channels by search query, category, and HD preferences
   */
  static filterChannels(channels, query = "", category = "all", hdOnly = false) {
    if (!Array.isArray(channels)) return [];
    const q = query.trim().toLowerCase();
    const cat = category.toLowerCase();

    return channels.filter(channel => {
      // Category filter
      if (cat !== "all") {
        if (cat === "favorites") {
          const favs = StorageService.getFavorites();
          if (!favs.includes(channel.id)) return false;
        } else if ((channel.category || "").toLowerCase() !== cat) {
          return false;
        }
      }

      // HD filter
      if (hdOnly && !channel.isHd) {
        return false;
      }

      // Search query filter
      if (q) {
        const nameMatch = (channel.name || "").toLowerCase().includes(q);
        const catMatch = (channel.category || "").toLowerCase().includes(q);
        const countryMatch = (channel.country || "").toLowerCase().includes(q);
        const chNumMatch = String(channel.channelNumber || "").includes(q);
        if (!nameMatch && !catMatch && !countryMatch && !chNumMatch) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Extracts unique, sorted category list from channels
   */
  static extractCategories(channels) {
    const set = new Set();
    (channels || []).forEach(ch => {
      if (ch.category && ch.category.trim()) {
        set.add(ch.category.trim());
      }
    });
    return Array.from(set).sort();
  }

  /**
   * Toggles a channel's favorite status
   */
  static toggleFavorite(channelId) {
    const favs = StorageService.getFavorites();
    const idx = favs.indexOf(channelId);
    let isFav = false;
    if (idx >= 0) {
      favs.splice(idx, 1);
      isFav = false;
    } else {
      favs.push(channelId);
      isFav = true;
    }
    StorageService.setFavorites(favs);
    return isFav;
  }

  /**
   * Checks if channel is marked as favorite
   */
  static isFavorite(channelId) {
    const favs = StorageService.getFavorites();
    return favs.includes(channelId);
  }
}
