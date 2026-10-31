<div align="center">

# 📺 Live TV

### Next-Generation Live Streaming for macOS & Android
**2,989+ Live Channels • Real-Time WebGL AI Super-Resolution • Sports Telemetry • 10-Band EQ**

[![Platform: macOS](https://img.shields.io/badge/Platform-macOS%20(Apple%20Silicon%20arm64)-000000?style=for-the-badge&logo=apple)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![Platform: Android](https://img.shields.io/badge/Platform-Android%208.0+-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![Version: 5.1.7](https://img.shields.io/badge/Version-5.1.7%20(Build%2043)-E50914?style=for-the-badge)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![Live Channels](https://img.shields.io/badge/Channels-2%2C989%20Active-blue?style=for-the-badge)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![100% Ad-Free](https://img.shields.io/badge/Zero--Ad%20Shield-100%25%20Clean-success?style=for-the-badge)](https://github.com/SamAkhtarul/Live-TV/releases/latest)

---

### 🚀 Direct App Downloads

| Platform | Installer Package | Architecture / OS | Direct Download Link |
| :--- | :--- | :--- | :--- |
| **🍎 macOS** | `LiveTV-v5.1.7.dmg` | Apple Silicon (M1/M2/M3/M4) • macOS 11+ | [⬇️ **Download for macOS (.dmg)**](https://github.com/SamAkhtarul/Live-TV/releases/download/v5.1.7/LiveTV-v5.1.7.dmg) |
| **🤖 Android** | `LiveTV-v5.1.7.apk` | Universal APK • Android 8.0+ (Phone, Tablet, TV) | [⬇️ **Download for Android (.apk)**](https://github.com/SamAkhtarul/Live-TV/releases/download/v5.1.7/LiveTV-v5.1.7.apk) |

*All releases are pre-compiled and ready to install immediately.*

---

</div>

## 🌟 Feature Highlights (v5.1.7)

### 1. 🔍 Fixed Sticky Channels Search Bar in Mobile Remote
- **Always Visible**: Positioned directly at the top of the Channels tab with `position: sticky; top: 0`, completely preventing it from hiding under the top navigation bar.
- **Solid Backdrop & Shadow**: Channel cards scroll smoothly underneath the search bar while it stays permanently pinned for instant lookup across all 2,989 channels.

### 2. 📌 Fixed Sticky Search Bar in Mac App
- **Search From Anywhere**: The search container in the macOS desktop app is now `position: sticky; top: -12px; z-index: 95` with glassmorphic backdrop blur and crisp border.
- **Zero Scroll Overhead**: Search any channel without having to scroll all the way back to the top of the catalog.

### 3. 📱 Edge-to-Edge Phone TV Video Player
- **100% Screen Width**: Removed lateral padding on `#tab-phonetv`, allowing the video player to span the full glass width of the phone.
- **Zero Black Letterbox Bars**: Styled with `object-fit: cover` and expanded aspect-ratio height (`clamp(180px, 28vh, 230px)`) so broadcast video fills the entire screen width.
- **Cushioned Controls Area**: All buttons, sliders, channel surfer, and status bars below the video are wrapped in a comfortable 8px padded container.

### 4. 🎮 Tactile TV Remote Layout
- 108px rocker clusters, 140px hardware circular D-Pad with 14px safety clearance, and zero scroll viewport on mobile.

### 5. 🛡️ 100% Ad-Free Experience (Zero-Ad Shield)
- All 2,989 channels stream without commercial interruptions, popup ads, or tracking scripts.

---

## 🛠️ Build & Installation

### macOS
```bash
./desktop/build_mac.sh 5.1.7 43
```

### Android
```bash
./gradlew assembleRelease
```

---

<div align="center">
Crafted with ❤️ by <b>SamAkhtarul</b>
</div>
