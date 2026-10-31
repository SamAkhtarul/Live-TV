<div align="center">

# 📺 Live TV

### Next-Generation Live Streaming for macOS & Android
**2,989+ Live Channels • Real-Time WebGL AI Super-Resolution • Sports Telemetry • 10-Band EQ**

[![Platform: macOS](https://img.shields.io/badge/Platform-macOS%20(Apple%20Silicon%20arm64)-000000?style=for-the-badge&logo=apple)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![Platform: Android](https://img.shields.io/badge/Platform-Android%208.0+-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![Version: 5.1.6](https://img.shields.io/badge/Version-5.1.6%20(Build%2042)-E50914?style=for-the-badge)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![Live Channels](https://img.shields.io/badge/Channels-2%2C989%20Active-blue?style=for-the-badge)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![100% Ad-Free](https://img.shields.io/badge/Zero--Ad%20Shield-100%25%20Clean-success?style=for-the-badge)](https://github.com/SamAkhtarul/Live-TV/releases/latest)

---

### 🚀 Direct App Downloads

| Platform | Installer Package | Architecture / OS | Direct Download Link |
| :--- | :--- | :--- | :--- |
| **🍎 macOS** | `LiveTV-v5.1.6.dmg` | Apple Silicon (M1/M2/M3/M4) • macOS 11+ | [⬇️ **Download for macOS (.dmg)**](https://github.com/SamAkhtarul/Live-TV/releases/download/v5.1.6/LiveTV-v5.1.6.dmg) |
| **🤖 Android** | `LiveTV-v5.1.6.apk` | Universal APK • Android 8.0+ (Phone, Tablet, TV) | [⬇️ **Download for Android (.apk)**](https://github.com/SamAkhtarul/Live-TV/releases/download/v5.1.6/LiveTV-v5.1.6.apk) |

*All releases are pre-compiled and ready to install immediately.*

---

</div>

## 🌟 Feature Highlights (v5.1.6)

### 1. 🎮 Fixed Remote Layout & Zero-Overlap Tactile D-Pad
- **Zero Collision & Overlap**: Re-engineered stepper clusters with 108px explicit box bounds and proportional center buttons (Quality & Mute), completely eliminating D-Pad collision and overlap.
- **Dedicated TV Status Capsule**: High-contrast OLED status capsule at the top of the remote showing the live channel and play/pause state.
- **Tactile Hardware Circular D-Pad**: Sized to 140px with radial metallic finish, crisp directional arrows (▲ CH+, ▼ CH-, ◀ 10s, ▶ 10s), and a 56px center Play/Pause disc.
- **Proportional Spacing**: 14px safety clearance between rockers and D-Pad, perfectly centered in mobile viewports with zero vertical scroll.

### 2. 📱 100% Zero-Scroll Phone TV Viewport
- **Pure Native Single-Screen Experience**: Dynamic in-flow flex layout with `overflow: hidden !important` and `overscroll-behavior: none !important`.
- **Zero Scroll on iOS & Android**: Fits 100% within dynamic viewport height (`100dvh`), bounded between top navigation header (46px) and bottom tabs (52px + safe area).

### 3. 🎯 Scoped Mini Player Bar
- The now-playing sync bar is strictly contained inside the Channels catalog and automatically hidden when switching to Remote or Phone TV.

### 4. 🛡️ 100% Ad-Free Experience (Zero-Ad Shield)
- All 2,989 channels stream without commercial interruptions, popup ads, or tracking scripts.

---

## 🛠️ Build & Installation

### macOS
```bash
./desktop/build_mac.sh 5.1.6 42
```

### Android
```bash
./gradlew assembleRelease
```

---

<div align="center">
Crafted with ❤️ by <b>SamAkhtarul</b>
</div>
