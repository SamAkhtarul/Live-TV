/**
 * Live TV - Storage Microservice
 * Architecture: Service / StorageService
 * Responsibility: Persistent state management, schema migrations, and secure fallback.
 */

import {
  STORAGE_FAVORITES,
  STORAGE_CATEGORIES,
  STORAGE_VOLUME,
  STORAGE_BRIGHTNESS,
  STORAGE_RECENTS,
  STORAGE_SLEEP,
  STORAGE_DATA_SAVER,
  STORAGE_CUSTOM_CHANNELS
} from "../models/Constants.js";

export class StorageService {
  static getItem(key, defaultValue = null) {
    try {
      const val = localStorage.getItem(key);
      if (val === null) return defaultValue;
      return JSON.parse(val);
    } catch (e) {
      return localStorage.getItem(key) || defaultValue;
    }
  }

  static setItem(key, value) {
    try {
      if (typeof value === "object") {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        localStorage.setItem(key, String(value));
      }
      return true;
    } catch (e) {
      console.warn(`[StorageService] Failed writing key '${key}':`, e);
      return false;
    }
  }

  static removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Domain-specific helpers
  static getFavorites() {
    return this.getItem(STORAGE_FAVORITES, []);
  }

  static setFavorites(favArray) {
    return this.setItem(STORAGE_FAVORITES, favArray);
  }

  static getRecents() {
    return this.getItem(STORAGE_RECENTS, []);
  }

  static setRecents(recentsArray) {
    return this.setItem(STORAGE_RECENTS, recentsArray);
  }

  static getCustomChannels() {
    return this.getItem(STORAGE_CUSTOM_CHANNELS, []);
  }

  static setCustomChannels(channels) {
    return this.setItem(STORAGE_CUSTOM_CHANNELS, channels);
  }

  static getCategoriesOrder() {
    return this.getItem(STORAGE_CATEGORIES, null);
  }

  static setCategoriesOrder(categories) {
    return this.setItem(STORAGE_CATEGORIES, categories);
  }
}
