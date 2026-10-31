<div align="center">

# 📺 Live TV

### Next-Generation Live Streaming for macOS & Android
**2,989+ Live Channels • Real-Time WebGL AI Super-Resolution • Sports Telemetry • 10-Band EQ**

[![Platform: macOS](https://img.shields.io/badge/Platform-macOS%20(Apple%20Silicon%20arm64)-000000?style=for-the-badge&logo=apple)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![Platform: Android](https://img.shields.io/badge/Platform-Android%208.0+-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![Version: 5.1.5](https://img.shields.io/badge/Version-5.1.5%20(Build%2041)-E50914?style=for-the-badge)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![Live Channels](https://img.shields.io/badge/Channels-2%2C989%20Active-blue?style=for-the-badge)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![100% Ad-Free](https://img.shields.io/badge/Zero--Ad%20Shield-100%25%20Clean-success?style=for-the-badge)](https://github.com/SamAkhtarul/Live-TV/releases/latest)

---

### 🚀 Direct App Downloads

| Platform | Installer Package | Architecture / OS | Direct Download Link |
| :--- | :--- | :--- | :--- |
| **🍎 macOS** | `LiveTV-v5.1.5.dmg` | Apple Silicon (M1/M2/M3/M4) • macOS 11+ | [⬇️ **Download for macOS (.dmg)**](https://github.com/SamAkhtarul/Live-TV/releases/download/v5.1.5/LiveTV-v5.1.5.dmg) |
| **🤖 Android** | `LiveTV-v5.1.5.apk` | Universal APK • Android 8.0+ (Phone, Tablet, TV) | [⬇️ **Download for Android (.apk)**](https://github.com/SamAkhtarul/Live-TV/releases/download/v5.1.5/LiveTV-v5.1.5.apk) |

*All releases are pre-compiled and ready to install immediately.*

---

</div>

## 🌟 Feature Highlights (v5.1.5)

### 1. 📱 100% Zero-Scroll Phone TV Viewport
- **Pure Native Single-Screen Experience**: Redesigned mobile Phone TV page using dynamic in-flow flex layout with `overflow: hidden !important` and `overscroll-behavior: none !important`.
- **Zero Scroll on iOS & Android**: Fits 100% within dynamic viewport height (`100dvh`), bounded between top navigation header (46px) and bottom tabs (52px + safe area) with zero vertical scroll on iPhone and Android screens.
- **Adaptive 16:9 Video Canvas**: Smart responsive video aspect ratio that automatically optimizes height without overflowing.

### 2. 🎮 Pure Dedicated TV Remote Controller
- **Zero Video Player on Remote**: Eliminated the now-playing player bar entirely from the Remote tab.
- **Unified Stepper Rockers**: Precision tactile 3-column cluster featuring Channel (▲ CH ▼), Volume (▲ VOL ▼), and centered 1-click Quality (🎬) & Mute (🔇) selectors.
- **Tactile Circular D-Pad**: Hardware-grade directional pad for navigation, channel skipping, 10s seek, and instant Play/Pause.
- **Compact Quick Actions**: Sleek 4-column action buttons (PiP, Fullscreen, Pin, Stats, Sports HUD, Sleep, Multi-View, Updates).
- **Collapsible Numeric Keypad**: Direct channel dialing drawer (1-9) that remains neatly folded by default.

### 3. 🎯 Scoped Mini Player Bar
- The now-playing sync bar is strictly contained inside the Channels catalog and automatically hidden when switching to Remote or Phone TV.

### 4. 🛡️ 100% Ad-Free Experience (Zero-Ad Shield)
- All 2,989 channels stream without commercial interruptions, popup ads, or tracking scripts.

---

## 🛠️ Build & Installation

### macOS
```bash
./desktop/build_mac.sh 5.1.5 41
```

### Android
```bash
./gradlew assembleRelease
```

---

<div align="center">
Crafted with ❤️ by <b>SamAkhtarul</b>
</div>
