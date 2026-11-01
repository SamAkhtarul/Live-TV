<div align="center">

# 📺 Live TV

### Next-Generation Live Streaming for macOS, Android & Web
**2,989+ Live Channels • Real-Time WebGL AI Super-Resolution • Sports Telemetry • 10-Band EQ**

[![Platform: macOS](https://img.shields.io/badge/Platform-macOS%20(Apple%20Silicon%20arm64)-000000?style=for-the-badge&logo=apple)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![Platform: Android](https://img.shields.io/badge/Platform-Android%208.0+-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![Version: 5.1.19](https://img.shields.io/badge/Version-5.1.19%20(Build%2054)-E50914?style=for-the-badge)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![Live Channels](https://img.shields.io/badge/Channels-2%2C989%20Active-blue?style=for-the-badge)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![100% Ad-Free](https://img.shields.io/badge/Zero--Ad%20Shield-100%25%20Clean-success?style=for-the-badge)](https://github.com/SamAkhtarul/Live-TV/releases/latest)

---

### 🚀 Direct App Downloads & Live Web

| Platform | Installer Package / Link | Architecture / OS | Direct Access Link |
| :--- | :--- | :--- | :--- |
| **🍎 macOS** | `LiveTV-v5.1.19.dmg` | Apple Silicon (M1/M2/M3/M4) • macOS 11+ | [⬇️ **Download for macOS (.dmg)**](https://github.com/SamAkhtarul/Live-TV/releases/download/v5.1.19/LiveTV-v5.1.19.dmg) |
| **🤖 Android** | `LiveTV-v5.1.19.apk` | Universal APK • Android 8.0+ (Phone, Tablet, TV) | [⬇️ **Download for Android (.apk)**](https://github.com/SamAkhtarul/Live-TV/releases/download/v5.1.19/LiveTV-v5.1.19.apk) |
| **🌐 Web / iPhone** | GitHub Pages Web App | Safari, Chrome, iOS WebKit, Edge, Firefox | [🌐 **Open Live TV Web App**](https://samakhtarul.github.io/Live-TV/) |

*All releases are pre-compiled and ready to install immediately.*

---

</div>

## 🌟 Feature Highlights (v5.1.19)

### 1. 👆 Player Controls Touch & Horizontal Scroll Lock
- Touching, swiping, or horizontally scrolling through the top action pills (`.player-top-right`) or quick-switch channel carousel will **NEVER** hide or dismiss the player controls overlay.
- Active gesture tracking on `touchstart`, `touchmove`, and `scroll` pauses the auto-hide timer with a 4-second grace period after lifting your finger.
- Clicks and touches anywhere inside player controls containers are strictly excluded from triggering background video taps.

### 2. 📱 Smooth Swipeable Header on Mobile Phones & Web
- The entire top header bar now glides horizontally with native inertial touch scrolling on mobile browsers and Android.
- Every single feature tool is easily accessible (EPG, Scores Ticker, TV Alarm, Bouquets Manager, DVR Recording, Kids PIN, Cloud Backup, Multi-View, Phone Remote, Custom M3U, and Update Checker).
- Streamlined compact pill indicators on narrow screens to maximize accessible feature tools upfront.

### 3. ⇄ "Last Channel" Flashback / Instant Recall (Hotkey Q)
- Instant channel switching between your current channel and previous channel with one click on the player OSD pill or pressing `Q`.

### 4. 🎚️ Web Audio Lip-Sync Offset Calibrator (-500ms to +1500ms)
- Native Web Audio `DelayNode` integration to fix audio-video drift on international and IPTV feeds directly in Playback Settings.

### 5. 🔍 In-Player Spotlight Channel Search (Hotkey /)
- Search across all 2,989+ channels, sports, and numbers without interrupting or leaving fullscreen playback.

### 6. 🔔 Live Sports Match Start Reminder & Chime Alerts
- 1-click "🔔 Remind" button on upcoming fixtures with audio chime and 1-tap "▶ Tune Now" button when live.

### 7. 🔎 Custom Video Zoom & Pan Cropper (1.0x to 2.0x, Hotkey W)
- Multi-step zoom ladder (`1.0x`, `1.25x`, `1.5x`, `2.0x`) with drag-to-pan and touch pinch-to-zoom to eliminate letterboxing.

---

## 🛠️ Build & Installation Commands

### macOS Native App
```bash
./desktop/build_mac.sh 5.1.19 54
```

### Android Release APK
```bash
./gradlew assembleRelease
```

### Production Web Assets (Obfuscation & Compilation)
```bash
./desktop/web/build_prod_assets.sh
```

---

<div align="center">
Crafted with ❤️ by <b>SamAkhtarul</b>
</div>
