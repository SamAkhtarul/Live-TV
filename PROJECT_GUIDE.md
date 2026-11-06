# 📺 Live TV — Architecture, Release Pipeline & Development Guide

> **CRITICAL REFERENCE FOR AGENTS & DEVELOPERS**  
> Read this document before making any modifications to versions, assets, build scripts, or GitHub releases. Adhering to these rules prevents regressions, version rollback loops, and updater failures.

---

## 1. Project Overview & Architecture

Live TV is a unified, cross-platform streaming suite delivering 2,989+ live television channels, sports telemetry, WebGL AI super-resolution, and catch-up DVR timeshift.

It is delivered across three target environments from a single shared web core:
1. **macOS Native App** (`Live TV.app` / `LiveTV-vX.Y.Z.dmg`):
   - Cocoa + WKWebView native wrapper built in Swift (`desktop/src/main.swift`).
   - Native bridges for window dragging, window resizing, Picture-in-Picture (PiP), local remote control server, and seamless In-App Auto-Updates (`AppUpdater`).
2. **Android Native App** (`LiveTV-vX.Y.Z.apk`):
   - Kotlin + Android Gradle Plugin + WebView wrapper (`app/build.gradle.kts`).
   - Bundles local assets inside `app/src/main/assets/web/`.
3. **Web / iPhone PWA** ([https://samakhtarul.github.io/Live-TV/](https://samakhtarul.github.io/Live-TV/)):
   - Hosted via GitHub Pages (`gh-pages` branch).
   - Optimized for iPhone Safari & Brave with native hardware AVPlayer fullscreen (`video.webkitEnterFullscreen()`) and 0% idle GPU overhead.

---

## 2. Directory Layout & Key File Roles

```
/Users/SAM/RiderProjects/Live TTV/           <-- Master workspace root
├── desktop/
│   ├── build_mac.sh                        <-- Compiles Swift app, stages DMG, packages canonical LiveTV.dmg
│   ├── src/main.swift                      <-- Native Cocoa app, WKScriptMessageHandler, and AppUpdater engine
│   └── web/                                <-- Primary Web application folder
│       ├── src_js/                         <-- [EDITABLE MVC SOURCE MODULES]
│       │   ├── models/                     <-- Models: State, Constants, ChannelModel, EventModel
│       │   ├── views/                      <-- Views: Elements, ChannelView, PlayerView, HeroView, HUDView, ModalView, TelemetryView
│       │   ├── controllers/                <-- Controllers: AppController, ChannelController, PlayerController, AudioController, NavigationController, AIUpscalerController, UpdateController
│       │   ├── utils/                      <-- Utilities: DomUtils, TimeUtils
│       │   ├── index.js                    <-- Master entry point bundling the MVC modules
│       │   ├── app.src.js                  <-- [AUTO-BUNDLED via esbuild] Output bundle from index.js
│       │   └── cenc_decryptor.src.js       <-- [EDITABLE SOURCE] DRM & stream decryptor
│       ├── build_prod_assets.sh            <-- Bundles src_js/index.js via esbuild, then obfuscates & encrypts into js/
│       ├── js/                             <-- [AUTO-GENERATED] Obfuscated production code (DO NOT edit manually!)
│       │   ├── app.js
│       │   ├── cenc_decryptor.js
│       │   └── channels_data.js
│       ├── css/style.css                   <-- Master stylesheets, themes, and modal stacking
│       └── index.html                      <-- Master HTML template
├── app/                                    <-- Android project
│   ├── build.gradle.kts                    <-- Version code & name (must match desktop/web)
│   └── src/main/assets/web/                <-- Synchronized mirror of desktop/web/
├── version.json                            <-- Canonical update manifest read by the in-app updater
├── build_release.sh                        <-- Orchestrates dual Android & macOS release builds
└── /tmp/Live-TV-dist/                      <-- Git working clone of https://github.com/SamAkhtarul/Live-TV.git
    ├── main                                <-- Branch holding version.json, README, and repo sources
    └── gh-pages                            <-- Branch holding live deployed website at samakhtarul.github.io/Live-TV
```

---

## 3. The 4-Point Version Synchronization Rule (CRITICAL)

When releasing a new version (e.g. `v5.1.16`, Build `51`), **ALL 4 of the following files MUST be updated to the EXACT SAME version and build number**:

| # | File Path | Field / Variable | Example Value |
|---|---|---|---|
| **1** | `desktop/web/src_js/models/Constants.js`<br>(bundled to `app.src.js`) | `export const APP_VERSION`<br>`export const APP_BUILD` | `"5.1.16"`<br>`51` |
| **2** | `desktop/web/index.html` | `.app-version`<br>`.modal-subtitle`<br>Asset query params | `v5.1.16`<br>`Version 5.1.16 (Build 51)`<br>`style.css?v=5.1.16`, `app.js?v=5.1.16` |
| **3** | `app/build.gradle.kts` | `versionCode`<br>`versionName` | `51`<br>`"5.1.16"` |
| **4** | `version.json` (root & dist) | `version`, `build`, `download_mac`, `download_android` | `"5.1.16"`, `51`, and URLs pointing to `releases/download/v5.1.16/...` |

> [!CAUTION]
> **Why this matters**: If `APP_VERSION` in `app.src.js` is left as an older version (e.g., `5.1.8`), the in-app updater will see that GitHub is newer, prompt the user to update, fail to locate missing intermediate tags, and fall back to reinstalling `5.1.8`, causing an infinite rollback loop!

---

## 4. How the In-App Updater Works

1. **Manifest & API Check**:
   - `checkAppUpdates()` in `app.src.js` queries:
     1. Raw manifest: `https://raw.githubusercontent.com/SamAkhtarul/Live-TV/main/version.json` (fast, unmetered).
     2. GitHub API: `https://api.github.com/repos/SamAkhtarul/Live-TV/releases/latest`.
   - Compares remote `build` and `version` against local `APP_BUILD` and `APP_VERSION`.
2. **Native Update Flow (macOS)**:
   - When user clicks **"One-Click Update & Restart"**, `window.webkit.messageHandlers.startAppUpdate.postMessage(...)` is invoked.
   - `AppUpdater` (`desktop/src/main.swift`) downloads the DMG package into `NSTemporaryDirectory()` using `URLSessionDownloadTask`.
   - Upon completion, it mounts the DMG via `hdiutil attach`, copies the new `Live TV.app` into `/Applications/Live TV.app` using `ditto`, detaches the DMG, and relaunches the updated application.
3. **Android & Browser Fallback**:
   - If outside the native macOS wrapper, the button initiates direct download of `LiveTV-vX.Y.Z.apk` or `LiveTV-vX.Y.Z.dmg`.

---

## 5. GitHub Releases & Deployment Pipeline

### Credentials & Auth
- GitHub Repository: `https://github.com/SamAkhtarul/Live-TV.git`
- GitHub Token with Release Rights: Pre-configured in git remote origin, or set in environment via `export GH_TOKEN="<GITHUB_TOKEN>"`.

### Standard Release Checklist (Step-by-Step)

```bash
# 1. Update versions in app.src.js, index.html, build.gradle.kts, and version.json (Section 3)

# 2. Rebuild obfuscated production web assets
bash "/Users/SAM/RiderProjects/Live TTV/desktop/web/build_prod_assets.sh"

# 3. Synchronize assets to Android app
rsync -av --delete --exclude=".DS_Store" "/Users/SAM/RiderProjects/Live TTV/desktop/web/" "/Users/SAM/RiderProjects/Live TTV/app/src/main/assets/web/"

# 4. Build Android Release APK
cd "/Users/SAM/RiderProjects/Live TTV" && ./gradlew assembleRelease
cp "app/build/outputs/apk/release/LiveTV-v<VERSION>-release.apk" "LiveTV-v<VERSION>.apk"
cp "app/build/outputs/apk/release/LiveTV-v<VERSION>-release.apk" "LiveTV.apk"

# 5. Build macOS Apple Silicon App & DMG
bash "/Users/SAM/RiderProjects/Live TTV/desktop/build_mac.sh" <VERSION> <BUILD>
# Update local /Applications copy
rm -rf "/Applications/Live TV.app" && cp -R "desktop/build/Live TV.app" "/Applications/Live TV.app"

# 6. Publish Official GitHub Release
gh release create v<VERSION> \
  --repo SamAkhtarul/Live-TV \
  --title "Live TV v<VERSION> (Build <BUILD>)" \
  --notes "<CHANGELOG>" \
  "LiveTV-v<VERSION>.dmg" "LiveTV.dmg" "LiveTV-v<VERSION>.apk" "LiveTV.apk"

# 7. Push Web Assets to gh-pages and version.json to main
rsync -av --delete --exclude=".git" --exclude="src_js" --exclude="build_prod_assets.sh" --exclude=".DS_Store" \
  "/Users/SAM/RiderProjects/Live TTV/desktop/web/" /tmp/Live-TV-dist/
cp "/Users/SAM/RiderProjects/Live TTV/version.json" /tmp/Live-TV-dist/version.json

cd /tmp/Live-TV-dist
git add -A && git commit -m "v<VERSION>: Deploy release" && git push origin gh-pages
git checkout main && git checkout gh-pages -- . && git commit -m "v<VERSION>: Sync release to main" && git push origin main && git checkout gh-pages
```

---

## 6. Critical UI & Technical Rules (Do Not Violate)

1. **Modal Stacking Rule**:
   - Modals (like `.modal-overlay`, `#modal-player-settings`) must ALWAYS remain direct children of `document.body` with `z-index: 200000 !important;`.
   - Never append modals inside `#player-overlay`. `#player-overlay` is a flexbox column with `overflow: hidden`; appending inside pushes modals off-screen on mobile and landscape.
2. **Escape Key Handling**:
   - Global `Escape` handler must check for and dismiss open modals (`.modal-overlay`) before calling `closePlayer()`.
3. **iPhone / Mobile Thermal Optimization**:
   - iPhone fullscreen must use `video.webkitEnterFullscreen()` to invoke native iOS AVPlayer hardware decode (0% DOM CPU).
   - In `style.css`, avoid CSS backdrop filters or video filters during active mobile playback to prevent battery drain and overheating.
4. **Proprietary Code Protection**:
   - Never edit `js/app.js` directly; always edit `src_js/app.src.js` and compile via `build_prod_assets.sh`.
   - Keep sourcemaps disabled (`--source-map false`).
