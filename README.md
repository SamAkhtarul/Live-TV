<div align="center">

# 📺 Live TV

### Next-Generation Live Streaming for macOS & Android
**2,989+ Live Channels • Real-Time WebGL AI Super-Resolution • Sports Telemetry • 10-Band EQ**

[![Platform: macOS](https://img.shields.io/badge/Platform-macOS%20(Apple%20Silicon%20arm64)-000000?style=for-the-badge&logo=apple)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![Platform: Android](https://img.shields.io/badge/Platform-Android%208.0+-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![Version: 5.1.8](https://img.shields.io/badge/Version-5.1.8%20(Build%2044)-E50914?style=for-the-badge)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![Live Channels](https://img.shields.io/badge/Channels-2%2C989%20Active-blue?style=for-the-badge)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![100% Ad-Free](https://img.shields.io/badge/Zero--Ad%20Shield-100%25%20Clean-success?style=for-the-badge)](https://github.com/SamAkhtarul/Live-TV/releases/latest)

---

### 🚀 Direct App Downloads

| Platform | Installer Package | Architecture / OS | Direct Download Link |
| :--- | :--- | :--- | :--- |
| **🍎 macOS** | `LiveTV-v5.1.8.dmg` | Apple Silicon (M1/M2/M3/M4) • macOS 11+ | [⬇️ **Download for macOS (.dmg)**](https://github.com/SamAkhtarul/Live-TV/releases/download/v5.1.8/LiveTV-v5.1.8.dmg) |
| **🤖 Android** | `LiveTV-v5.1.8.apk` | Universal APK • Android 8.0+ (Phone, Tablet, TV) | [⬇️ **Download for Android (.apk)**](https://github.com/SamAkhtarul/Live-TV/releases/download/v5.1.8/LiveTV-v5.1.8.apk) |

*All releases are pre-compiled and ready to install immediately.*

---

</div>

## 🌟 Feature Highlights (v5.1.8)

### 1. 🎬 Zero-Distraction Video Player View
- **Search Bar Completely Removed from Player**: Guaranteed that `.search-container` never leaks, overlaps, or punches through the active video player. When watching a live stream, the search bar is 100% hidden and isolated.
- **High-Priority Fixed Player Overlay**: `.player-overlay` is promoted to `position: fixed; inset: 0; z-index: 500`, ensuring complete fullscreen immersion without any catalog elements visible.
- **Active State Coordination**: Added `body.player-active` state management so `#browser-view` and search are cleanly hidden during playback and instantly restored when returning to the channel browser.

### 2. 📌 Fixed Sticky Search Bar in Channel Browser
- **Search From Anywhere**: The search container in the macOS desktop app remains sticky at the top of the browser catalog, allowing effortless live search across 2,989 channels without scrolling back to the top.

### 3. 📱 Edge-to-Edge Phone TV Video Player
- **100% Screen Width**: Spans the full glass width of the phone with `object-fit: cover` and expanded aspect-ratio height, completely eliminating letterboxing black side bars.
- **Cushioned Controls Area**: All buttons, sliders, channel surfer, and status bars below the video are wrapped in a comfortable 8px padded container.

### 4. 🛡️ 100% Ad-Free Experience (Zero-Ad Shield)
- All 2,989 channels stream without commercial interruptions, popup ads, or tracking scripts.

---

## 🛠️ Build & Installation

### macOS
```bash
./desktop/build_mac.sh 5.1.8 44
```

### Android
```bash
./gradlew assembleRelease
```

---

<div align="center">
Crafted with ❤️ by <b>SamAkhtarul</b>
</div>
