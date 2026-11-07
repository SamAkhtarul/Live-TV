/**
 * Live TV - Update Microservice
 * Architecture: Service / UpdateService
 * Responsibility: Version comparisons, remote manifest resolution, and asset downloading orchestration.
 */

import { NativeBridgeService } from "./NativeBridgeService.js";
import {
  APP_VERSION,
  APP_BUILD,
  GITHUB_RELEASES_URL,
  GITHUB_API_LATEST_RELEASE,
  UPDATE_MANIFEST_URL
} from "../models/Constants.js";

export class UpdateService {
  /**
   * Compares two semantic version strings (e.g., "5.3.3" vs "5.3.4")
   * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal
   */
  static compareVersions(v1, v2) {
    const p1 = (v1 || "").replace(/^v/i, "").split(".").map(x => parseInt(x, 10) || 0);
    const p2 = (v2 || "").replace(/^v/i, "").split(".").map(x => parseInt(x, 10) || 0);
    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
      const num1 = p1[i] || 0;
      const num2 = p2[i] || 0;
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  }

  /**
   * Checks if a newer version or build number is available
   */
  static isUpdateAvailable(remoteVersion, remoteBuild) {
    const verDiff = this.compareVersions(remoteVersion, APP_VERSION);
    if (verDiff > 0) return true;
    if (verDiff === 0 && Number(remoteBuild) > Number(APP_BUILD)) return true;
    return false;
  }

  /**
   * Fetches latest release metadata from GitHub API and version manifest
   */
  static async checkLatest() {
    let latestVer = null;
    let latestBuild = null;
    let releaseNotes = "";
    let downloadUrlMac = GITHUB_RELEASES_URL;
    let downloadUrlAndroid = GITHUB_RELEASES_URL;
    let releaseDate = "";

    try {
      const manifestRes = await fetch(`${UPDATE_MANIFEST_URL}?t=${Date.now()}`, { cache: "no-store" });
      if (manifestRes.ok) {
        const m = await manifestRes.json();
        latestVer = m.version || null;
        latestBuild = m.buildNumber || null;
        if (m.releaseNotes) releaseNotes = m.releaseNotes;
        if (m.assets?.dmg) downloadUrlMac = m.assets.dmg;
        if (m.assets?.apk) downloadUrlAndroid = m.assets.apk;
      }
    } catch (e) {
      console.warn("[UpdateService] Manifest fetch skipped, trying GitHub API:", e);
    }

    try {
      const ghRes = await fetch(GITHUB_API_LATEST_RELEASE, { cache: "no-store" });
      if (ghRes.ok) {
        const gh = await ghRes.json();
        if (!latestVer && gh.tag_name) {
          latestVer = gh.tag_name.replace(/^v/i, "");
        }
        if (gh.body && !releaseNotes) {
          releaseNotes = gh.body;
        }
        if (gh.published_at) {
          releaseDate = new Date(gh.published_at).toLocaleDateString();
        }
        if (Array.isArray(gh.assets)) {
          const dmg = gh.assets.find(a => a.name.endsWith(".dmg"));
          if (dmg) downloadUrlMac = dmg.browser_download_url;
          const apk = gh.assets.find(a => a.name.endsWith(".apk"));
          if (apk) downloadUrlAndroid = apk.browser_download_url;
        }
      }
    } catch (e) {
      console.warn("[UpdateService] GitHub API fetch error:", e);
    }

    const hasUpdate = latestVer ? this.isUpdateAvailable(latestVer, latestBuild) : false;

    return {
      hasUpdate,
      currentVersion: APP_VERSION,
      currentBuild: APP_BUILD,
      latestVersion: latestVer || APP_VERSION,
      latestBuild: latestBuild || APP_BUILD,
      releaseNotes,
      releaseDate,
      downloadUrlMac,
      downloadUrlAndroid
    };
  }

  /**
   * Dispatches install request to native bridge
   */
  static startNativeUpdate(downloadUrl, version, build) {
    return NativeBridgeService.triggerNativeUpdate(downloadUrl, version, build);
  }
}
