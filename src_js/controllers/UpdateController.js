/**
 * Live TV - GitHub Release Checker & OTA Updater
 * Architecture: Controller / UpdateController
 */

import { el } from "../views/Elements.js";
import {
  APP_VERSION,
  APP_BUILD,
  GITHUB_RELEASES_URL,
  GITHUB_API_LATEST_RELEASE,
  UPDATE_MANIFEST_URL
} from "../models/Constants.js";
import { escapeHtml } from "../utils/DomUtils.js";
import { openExternalUrl, openAboutModal } from "../views/ModalView.js";

export function compareVersions(v1, v2) {
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

export async function checkForAppUpdates(isManual = false) {
  if (!el.updateCard || !el.btnCheckUpdate) return;

  el.updateCard.classList.remove("has-update");
  el.updateCard.classList.add("is-checking");
  el.btnCheckUpdate.disabled = true;
  el.btnCheckUpdate.textContent = "Checking...";
  if (el.updateStatusIcon) el.updateStatusIcon.textContent = "⏳";
  if (el.updateStatusTitle) el.updateStatusTitle.textContent = "Checking GitHub for App Updates...";
  if (el.updateStatusSubtitle) el.updateStatusSubtitle.textContent = "Connecting to github.com/SamAkhtarul/Live-TV...";

  if (el.updateDetailsArea) {
    el.updateDetailsArea.style.display = "block";
    el.updateDetailsArea.innerHTML = `
      <div style="font-size: 11.5px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
        <span>🔍</span> Querying latest releases and build manifests from GitHub...
      </div>
    `;
  }

  if (isManual) {
    await new Promise(r => setTimeout(r, 700));
  }

  try {
    let latestVer = null;
    let latestBuild = null;
    let releaseNotes = "";
    let downloadUrlMac = GITHUB_RELEASES_URL;
    let downloadUrlAndroid = GITHUB_RELEASES_URL;
    let releaseDate = "";

    try {
      const manifestResp = await fetch(`${UPDATE_MANIFEST_URL}?_=${Date.now()}`, { cache: "no-cache" });
      if (manifestResp.ok) {
        const data = await manifestResp.json();
        latestVer = data.version;
        latestBuild = data.build;
        releaseDate = data.release_date || "";
        if (data.download_mac) downloadUrlMac = data.download_mac;
        if (data.download_android) downloadUrlAndroid = data.download_android;
        if (Array.isArray(data.changelog)) {
          releaseNotes = data.changelog.join("\n");
        } else if (typeof data.changelog === "string") {
          releaseNotes = data.changelog;
        }
      }
    } catch (e) {
      console.warn("Manifest check fallback:", e);
    }

    try {
      const ghResp = await fetch(GITHUB_API_LATEST_RELEASE, {
        headers: { "Accept": "application/vnd.github+json" }
      });
      if (ghResp.ok) {
        const ghData = await ghResp.json();
        const tag = (ghData.tag_name || "").replace(/^v/i, "");
        if (!latestVer || compareVersions(tag, latestVer) > 0) {
          latestVer = tag;
        }
        if (ghData.body && !releaseNotes) {
          releaseNotes = ghData.body;
        }
        if (ghData.published_at && !releaseDate) {
          releaseDate = new Date(ghData.published_at).toLocaleDateString();
        }
        if (Array.isArray(ghData.assets)) {
          const dmgAsset = ghData.assets.find(a => a.name.endsWith(".dmg"));
          if (dmgAsset) downloadUrlMac = dmgAsset.browser_download_url;
          const apkAsset = ghData.assets.find(a => a.name.endsWith(".apk"));
          if (apkAsset) downloadUrlAndroid = apkAsset.browser_download_url;
        }
      }
    } catch (e) {
      console.warn("GitHub API release check fallback:", e);
    }

    if (!latestVer) latestVer = APP_VERSION;
    if (!latestBuild) latestBuild = APP_BUILD;

    const hasUpdate = (latestBuild > APP_BUILD) || (compareVersions(latestVer, APP_VERSION) > 0);

    el.updateCard.classList.remove("is-checking");
    el.btnCheckUpdate.disabled = false;
    el.btnCheckUpdate.textContent = "Check Again";

    const checkTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (hasUpdate) {
      if (el.btnHeaderUpdateBadge) el.btnHeaderUpdateBadge.classList.add("has-update");
      if (el.headerUpdateText) el.headerUpdateText.textContent = `v${latestVer} Available!`;
      if (el.btnHeaderUpdater) {
        el.btnHeaderUpdater.classList.add("has-update");
        el.btnHeaderUpdater.title = `Update Available: Live TV v${latestVer}`;
      }
      el.updateCard.classList.add("has-update");
      if (el.updateStatusIcon) el.updateStatusIcon.textContent = "🎉";
      if (el.updateStatusTitle) el.updateStatusTitle.textContent = `Update Available: Live TV v${latestVer}`;
      if (el.updateStatusSubtitle) el.updateStatusSubtitle.textContent = `A newer release (v${latestVer} Build ${latestBuild}) is ready on GitHub.`;

      if (el.updateDetailsArea) {
        el.updateDetailsArea.style.display = "block";
        const formattedNotes = releaseNotes
          ? escapeHtml(releaseNotes).replace(/\n/g, "<br>")
          : "Includes latest performance improvements, new features, and stability fixes.";

        el.updateDetailsArea.innerHTML = `
          <div style="margin-bottom: 8px;">
            <span class="update-badge-new">NEW VERSION</span>
            <strong>Live TV v${latestVer} (Build ${latestBuild})</strong>
            <span style="font-size: 10.5px; color: var(--text-secondary); margin-left: 6px;">${releaseDate ? `• Released ${releaseDate}` : ""}</span>
          </div>
          <div style="font-size: 11.5px; color: var(--text-secondary); margin-bottom: 10px; max-height: 90px; overflow-y: auto; background: rgba(0,0,0,0.25); padding: 6px 10px; border-radius: 4px; line-height: 1.5;">
            ${formattedNotes}
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button class="inapp-update-primary-btn" id="btn-inapp-update">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
              <span>⚡ One-Click Update & Restart (v${latestVer})</span>
            </button>

            <div id="update-progress-card" class="update-progress-card" style="display: none;">
              <div class="update-progress-track">
                <div id="update-progress-fill" class="update-progress-fill" style="width: 0%;"></div>
              </div>
              <div class="update-progress-labels">
                <span id="update-progress-status"><span class="update-spin">⏳</span> Connecting to update server...</span>
                <span id="update-progress-pct" style="font-weight: 700;">0%</span>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-secondary); padding-top: 2px;">
              <span>Manual packages:</span>
              <div style="display: flex; gap: 8px; align-items: center;">
                <button class="update-link-btn" id="btn-download-mac-manual">Download .dmg</button>
                <span>•</span>
                <button class="update-link-btn" id="btn-download-android-manual">Android .apk</button>
              </div>
            </div>
          </div>
        `;

        const btnInApp = document.getElementById("btn-inapp-update");
        const progCard = document.getElementById("update-progress-card");
        const progStatus = document.getElementById("update-progress-status");

        if (btnInApp) {
          btnInApp.onclick = () => {
            btnInApp.disabled = true;
            btnInApp.style.opacity = "0.6";
            btnInApp.style.cursor = "not-allowed";
            btnInApp.innerHTML = `<span>⏳ Updating in progress...</span>`;
            if (progCard) progCard.style.display = "flex";
            if (el.btnCheckUpdate) el.btnCheckUpdate.disabled = true;

            if (window.webkit?.messageHandlers?.startAppUpdate) {
              window.webkit.messageHandlers.startAppUpdate.postMessage({
                url: downloadUrlMac,
                version: latestVer
              });
            } else {
              if (progStatus) progStatus.textContent = "Opening DMG download in browser...";
              setTimeout(() => {
                openExternalUrl(downloadUrlMac);
                if (progCard) progCard.style.display = "none";
                btnInApp.disabled = false;
                btnInApp.style.opacity = "1";
                btnInApp.style.cursor = "pointer";
                btnInApp.innerHTML = `<span>⚡ One-Click Update & Restart (v${latestVer})</span>`;
              }, 1000);
            }
          };
        }

        const btnMacManual = document.getElementById("btn-download-mac-manual");
        if (btnMacManual) btnMacManual.onclick = () => openExternalUrl(downloadUrlMac);
        const btnAndroidManual = document.getElementById("btn-download-android-manual");
        if (btnAndroidManual) btnAndroidManual.onclick = () => openExternalUrl(downloadUrlAndroid);
      }
    } else {
      if (el.btnHeaderUpdateBadge) el.btnHeaderUpdateBadge.classList.remove("has-update");
      if (el.headerUpdateText) el.headerUpdateText.textContent = "Up to Date";
      if (el.btnHeaderUpdater) {
        el.btnHeaderUpdater.classList.remove("has-update");
        el.btnHeaderUpdater.title = "Live TV is Up to Date";
      }
      if (el.updateStatusIcon) el.updateStatusIcon.textContent = "✅";
      if (el.updateStatusTitle) el.updateStatusTitle.textContent = "You're on the Latest Release";
      if (el.updateStatusSubtitle) el.updateStatusSubtitle.textContent = `Version ${APP_VERSION} (Build ${APP_BUILD}) • Checked GitHub at ${checkTimeStr}`;

      if (el.updateDetailsArea) {
        el.updateDetailsArea.style.display = "block";
        el.updateDetailsArea.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11.5px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: var(--text-secondary);">Installed App Version:</span>
              <span style="font-weight: 700; color: #fff;">v${APP_VERSION} (Build ${APP_BUILD})</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: var(--text-secondary);">Latest on GitHub:</span>
              <span style="font-weight: 700; color: #34c759;">v${latestVer} (Build ${latestBuild})</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: var(--text-secondary);">Release Channel:</span>
              <span style="color: var(--gold); font-weight: 600;">github.com/SamAkhtarul/Live-TV</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 6px; margin-top: 2px;">
              <span style="color: var(--text-secondary);">Software Status:</span>
              <span style="color: #34c759; font-weight: 700; display: flex; align-items: center; gap: 4px;">
                <span>●</span> Up to Date • No New Updates Found
              </span>
            </div>
          </div>
        `;
      }
    }
  } catch (err) {
    console.error("Update check failed:", err);
    el.updateCard.classList.remove("is-checking");
    el.btnCheckUpdate.disabled = false;
    el.btnCheckUpdate.textContent = "Retry";
    if (el.updateStatusIcon) el.updateStatusIcon.textContent = "ℹ️";
    if (el.updateStatusTitle) el.updateStatusTitle.textContent = "Live TV v" + APP_VERSION;
    if (el.updateStatusSubtitle) el.updateStatusSubtitle.textContent = "Could not reach update server. Check your network.";
  }
}

window.triggerUpdateCheck = function(interactive = false) {
  openAboutModal();
  checkForAppUpdates(interactive);
};

window.onUpdateProgress = function(data) {
  const progFill = document.getElementById("update-progress-fill");
  const progStatus = document.getElementById("update-progress-status");
  const progPct = document.getElementById("update-progress-pct");
  const btnInApp = document.getElementById("btn-inapp-update");

  const pct = Math.min(100, Math.max(0, data.percent || 0));
  if (progFill) progFill.style.width = `${pct}%`;
  if (progPct) progPct.textContent = `${pct}%`;

  if (progStatus) {
    if (data.stage === "downloading") {
      progStatus.innerHTML = `<span class="update-spin">⬇️</span> ${escapeHtml(data.text || "Downloading update...")}`;
    } else if (data.stage === "verifying") {
      progStatus.innerHTML = `<span class="update-spin">🔍</span> ${escapeHtml(data.text || "Verifying and mounting DMG...")}`;
    } else if (data.stage === "installing") {
      progStatus.innerHTML = `<span class="update-spin">⚙️</span> ${escapeHtml(data.text || "Installing update...")}`;
    } else if (data.stage === "restarting") {
      progStatus.innerHTML = `<span>🚀</span> Relaunching Live TV...`;
    } else if (data.stage === "error") {
      progStatus.innerHTML = `<span>❌</span> ${escapeHtml(data.text || "Update failed")}`;
      progStatus.style.color = "#ef4444";
      if (btnInApp) {
        btnInApp.disabled = false;
        btnInApp.style.opacity = "1";
        btnInApp.style.cursor = "pointer";
        btnInApp.innerHTML = `<span>⚠️ Retry One-Click Update</span>`;
      }
      if (el.btnCheckUpdate) el.btnCheckUpdate.disabled = false;
    }
  }
};
