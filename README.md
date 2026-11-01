<div align="center">

# 📺 Live TV

### Next-Generation Live Streaming for macOS, Android & Web
**2,989+ Live Channels • Real-Time WebGL AI Super-Resolution • Sports Telemetry • 10-Band EQ**

[![Platform: macOS](https://img.shields.io/badge/Platform-macOS%20(Apple%20Silicon%20arm64)-000000?style=for-the-badge&logo=apple)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![Platform: Android](https://img.shields.io/badge/Platform-Android%208.0+-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![Version: 5.1.16](https://img.shields.io/badge/Version-5.1.16%20(Build%2051)-E50914?style=for-the-badge)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![Live Channels](https://img.shields.io/badge/Channels-2%2C989%20Active-blue?style=for-the-badge)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![100% Ad-Free](https://img.shields.io/badge/Zero--Ad%20Shield-100%25%20Clean-success?style=for-the-badge)](https://github.com/SamAkhtarul/Live-TV/releases/latest)

---

### 🚀 Direct App Downloads & Live Web

| Platform | Installer Package / Link | Architecture / OS | Direct Access Link |
| :--- | :--- | :--- | :--- |
| **🍎 macOS** | `LiveTV-v5.1.16.dmg` | Apple Silicon (M1/M2/M3/M4) • macOS 11+ | [⬇️ **Download for macOS (.dmg)**](https://github.com/SamAkhtarul/Live-TV/releases/download/v5.1.16/LiveTV-v5.1.16.dmg) |
| **🤖 Android** | `LiveTV-v5.1.16.apk` | Universal APK • Android 8.0+ (Phone, Tablet, TV) | [⬇️ **Download for Android (.apk)**](https://github.com/SamAkhtarul/Live-TV/releases/download/v5.1.16/LiveTV-v5.1.16.apk) |
| **🌐 Web / iPhone** | GitHub Pages Web App | Safari, Chrome, iOS WebKit, Edge, Firefox | [🌐 **Open Live TV Web App**](https://samakhtarul.github.io/Live-TV/) |

*All releases are pre-compiled and ready to install immediately.*

---

</div>

## 🌟 Feature Highlights (v5.1.16)

### 1. 🎬 In-Player Playback & Quality Settings Modal
- **Zero Interruption Over-the-Stream Settings**: Clicking the `[ 1080p ]` quality pill, Audio/Subtitles button, or pressing `A` opens the Playback Settings modal directly centered above the active video stream without closing the player or exposing the home page catalog.
- **Full Resolution Ladder**: Select between Auto (Recommended), 2160p (4K UHD), 1440p (2K QHD), 1080p (Full HD), 720p (HD), 480p (SD), 360p, 240p, and 144p Data Saver.
- **Click-Outside & Keyboard Escape Dismissal**: Clicking outside the modal on the darkened glass backdrop or pressing `Escape` dismisses the dialog while keeping stream playback active.

### 2. ❄️ iPhone & Mobile Zero-Heat Optimization
- **Native iOS Hardware Fullscreen**: Uses Apple WebKit AVPlayer hardware pipeline for iPhone, reducing WebKit DOM CPU usage to 0% and eliminating device heating and battery drain.
- **Dynamic Backdrop & CSS Filter Bypasses**: Prevents expensive GPU filter compositing during video playback on mobile devices.

### 3. 🛡️ 100% Ad-Free Live TV Shield & Code Obfuscation
- All 2,989 channels stream without commercial interruptions, popup ads, or tracking scripts.
- Source code is protected using multi-layer JavaScript obfuscation, hexadecimal variable encoding, and anti-inspection controls.

### 4. ⚡ Seamless In-App Auto-Updater
- One-click update check and DMG background mount/installation on macOS via native Swift URLSession bridge.

---

## 🛠️ Build & Installation Commands

### macOS Native App
```bash
./desktop/build_mac.sh 5.1.16 51
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
