# 🗺️ Live TV — 3-Platform Microservices Architecture Map
> **CRITICAL DIRECTORY FOR AI AGENTS & DEVELOPERS**
> Target: Find and modify any feature across macOS, Android, or Web in < 1 second with 0 guesswork.

---

## 🏛️ System Architecture Overview

```
Live TV Multi-Platform System
│
├── 🌐 Platform 1: Shared Web & PWA Core (src/desktop/web/src_js/)
│   ├── services/
│   │   ├── StreamEngineService.js     ── HLS.js, native engines, failover routing, watchdog
│   │   ├── CatalogService.js          ── Channels normalization, search, favorites, categories
│   │   ├── SportsTelemetryService.js  ── Real-time match scores, ESPN/FanCode APIs, ticker
│   │   ├── AIUpscalerService.js       ── WebGL shaders, 4K super-resolution, A/B comparison
│   │   ├── AudioDSPService.js         ── 10-band equalizer, dynamic compressor, FFT visualizer
│   │   ├── NativeBridgeService.js     ── Unified cross-platform bridge (macOS / Android / Web)
│   │   ├── UpdateService.js           ── GitHub release comparison, version manifest resolver
│   │   ├── StorageService.js          ── Safe local persistence & schema migrations
│   │   └── index.js                   ── Barrel export for all domain services
│   ├── models/                        ── Constants.js, State.js, ChannelModel.js, EventModel.js
│   ├── controllers/                   ── Player, Channel, Audio, AIUpscaler, Update, Navigation
│   └── views/                         ── Elements, PlayerView, ChannelView, HUDView, ModalView
│
├── 🍏 Platform 2: macOS Native App (src/desktop/src/)
│   ├── AppMain.swift                  ── @main struct entry point & NSApplication bootstrap
│   ├── AppDelegate.swift              ── App lifecycle, Dock icon, and native system menu bar
│   ├── controllers/
│   │   ├── WindowController.swift     ── Frameless window, PiP mode, dragging, delta resizing
│   │   └── WebViewController.swift    ── WKWebView configuration, AdShield popup blocker, index loader
│   └── services/
│       ├── NativeBridgeHandler.swift  ── WKScriptMessageHandler web-to-native IPC router
│       ├── AppUpdaterService.swift    ── Background DMG download, hdiutil mount, ditto replace, relaunch
│       ├── RemoteControlService.swift ── Local HTTP server (NWListener) for mobile remote control
│       ├── RemoteControlTemplate.swift── HTML/CSS/JS template for mobile phone remote interface
│       └── NetworkUtils.swift         ── Local IP discovery, .local hostname, SVG QR code generation
│
└── 🤖 Platform 3: Android Native App (src/app/src/main/java/com/example/livetv/)
    ├── MainActivity.kt                ── Activity lifecycle, hardware WebView container
    └── services/
        ├── NativeBridgeService.kt     ── @JavascriptInterface bridge (preferences, PiP, APK update, haptics)
        ├── WindowModeService.kt       ── Picture-in-Picture mode & immersive sticky fullscreen
        └── KeyNavigationService.kt    ── Android TV D-pad, channel up/down, and media keys
```

---

## ⚡ Fast-Lookup: "I want to change X, where do I look?"

| If you want to: | Edit this exact file: | Run this build command: |
|---|---|---|
| **Add or edit a channel URL / backup server** | `src/desktop/web/src_js/models/Constants.js` (`CHANNEL_SERVERS`) | `bash src/desktop/web/build_prod_assets.sh` |
| **Change playback engine, HLS buffer, or failover** | `src/desktop/web/src_js/services/StreamEngineService.js` | `bash src/desktop/web/build_prod_assets.sh` |
| **Update sports telemetry / match score polling** | `src/desktop/web/src_js/services/SportsTelemetryService.js` | `bash src/desktop/web/build_prod_assets.sh` |
| **Tweak WebGL AI upscaler shaders or split-compare** | `src/desktop/web/src_js/services/AIUpscalerService.js` | `bash src/desktop/web/build_prod_assets.sh` |
| **Change 10-band audio EQ or volume compressor** | `src/desktop/web/src_js/services/AudioDSPService.js` | `bash src/desktop/web/build_prod_assets.sh` |
| **Change how favorites/recents are saved** | `src/desktop/web/src_js/services/StorageService.js` | `bash src/desktop/web/build_prod_assets.sh` |
| **Modify macOS window, PiP size, or drag behavior** | `src/desktop/src/controllers/WindowController.swift` | `bash src/desktop/build_mac.sh "5.3.3" 65` |
| **Modify macOS WebKit settings or Ad blocker** | `src/desktop/src/controllers/WebViewController.swift` | `bash src/desktop/build_mac.sh "5.3.3" 65` |
| **Modify macOS native auto-updater** | `src/desktop/src/services/AppUpdaterService.swift` | `bash src/desktop/build_mac.sh "5.3.3" 65` |
| **Modify mobile phone Wi-Fi remote control** | `src/desktop/src/services/RemoteControlService.swift` | `bash src/desktop/build_mac.sh "5.3.3" 65` |
| **Modify Android PiP, notch, or fullscreen** | `src/app/src/main/java/com/example/livetv/services/WindowModeService.kt` | `./gradlew assembleRelease --no-daemon` |
| **Modify Android TV remote D-pad controls** | `src/app/src/main/java/com/example/livetv/services/KeyNavigationService.kt` | `./gradlew assembleRelease --no-daemon` |
| **Modify Android JavaScript Bridge interface** | `src/app/src/main/java/com/example/livetv/services/NativeBridgeService.kt` | `./gradlew assembleRelease --no-daemon` |

---

## 🔒 The Golden Rules for AI Agents

1. **NEVER edit `js/app.js` directly**: It is an obfuscated production artifact. Always edit `src_js/` and build with `bash src/desktop/web/build_prod_assets.sh`.
2. **Sync Web to Android**: After changing any web files, sync assets to Android:
   ```bash
   rsync -av --delete --exclude=".DS_Store" src/desktop/web/ src/app/src/main/assets/web/
   ```
3. **4-Point Version Synchronization Rule**: On every release update, keep these 4 files strictly identical:
   - `src/desktop/web/src_js/models/Constants.js` (`APP_VERSION`, `APP_BUILD`)
   - `src/desktop/web/index.html` (header badge & about modal badge)
   - `build.gradle.kts` (`versionName`, `versionCode`)
   - `version.json` (`version`, `buildNumber`)
4. **Preserve Stream Keys & CENC DRM Hook**: Do not alter `cenc_decryptor.src.js` or clean ClearKey bypass hooks unless explicitly requested.
