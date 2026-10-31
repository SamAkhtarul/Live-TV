<div align="center">

# 📺 Live TV

### Next-Generation Live Streaming for macOS & Android
**2,989+ Live Channels • Real-Time WebGL AI Super-Resolution • Sports Telemetry • 10-Band EQ**

[![Platform: macOS](https://img.shields.io/badge/Platform-macOS%20(Apple%20Silicon%20arm64)-000000?style=for-the-badge&logo=apple)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![Platform: Android](https://img.shields.io/badge/Platform-Android%208.0+-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![Version: 5.1.1](https://img.shields.io/badge/Version-5.1.1%20(Build%2037)-E50914?style=for-the-badge)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![Live Channels](https://img.shields.io/badge/Channels-2%2C989%20Active-blue?style=for-the-badge)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![100% Ad-Free](https://img.shields.io/badge/Zero--Ad%20Shield-100%25%20Clean-success?style=for-the-badge)](https://github.com/SamAkhtarul/Live-TV/releases/latest)

---

### 🚀 Direct App Downloads

| Platform | Installer Package | Architecture / OS | Direct Download Link |
| :--- | :--- | :--- | :--- |
| **🍎 macOS** | `LiveTV-v5.1.1.dmg` | Apple Silicon (M1/M2/M3/M4) • macOS 11+ | [⬇️ **Download for macOS (.dmg)**](https://github.com/SamAkhtarul/Live-TV/releases/download/v5.1.1/LiveTV-v5.1.1.dmg) |
| **🤖 Android** | `LiveTV-v5.1.1.apk` | Universal APK • Android 8.0+ (Phone, Tablet, TV) | [⬇️ **Download for Android (.apk)**](https://github.com/SamAkhtarul/Live-TV/releases/download/v5.1.1/LiveTV-v5.1.1.apk) |

*All releases are pre-compiled and ready to install immediately.*

---

</div>

## 🌟 Feature Highlights (v5.1.1)

### 1. 🚀 Smooth Channel Browsing & Pinned Category Header
- **Unblocked Channel Access**: Fully restored smooth scrolling across all banners and the 2,989 channel grid, with automated lazy-loading batches.
- **Sticky Category Bar**: Category navigation chips and live channel counts remain pinned to the top as you scroll through channels.
- **Collapsible Hero Spotlight Billboard**: Compact 140px featured broadcast hero with 1-click dismiss (`✕`) and quick toggle button in the browser tools bar.

### 2. 📱 Mobile Remote AI Video Enhancer & Immersive Fullscreen
- **Retained AI Enhancer in Fullscreen**: Re-engineered phone player with Container Fullscreen and iOS Immersive Fullscreen Mode preventing native player overlays from stripping AI filters.
- **Hardware-Accelerated Mobile WebGL AI Super-Resolution**: Zero-latency GPU WebGL Sobel convolution, high-pass sharpening, and HDR tone mapping directly on smartphones.
- **Interactive Mobile Split-Screen Slider**: Real-time touch-draggable divider to compare Native 1080p vs AI 4K live.
- **In-Video Floating Fullscreen HUD & Gestures**: Auto-dimming on-screen controls, double-tap to toggle fullscreen, and vertical swipe channel surfing.
- **Mobile Voice Assistant**: Hands-free voice commands to tune channels, mute, and toggle AI enhancement.
- **Pure OLED Pitch-Black Mode**: True `#000000` power-saving background mode on OLED screens.

### 3. ✨ Hardware-Accelerated Real-Time WebGL AI Super-Resolution & Enhancer (macOS)
- **Zero-Latency GPU Engine**: Direct WebGL 2D Quad running edge-adaptive Sobel convolution and high-pass unsharp masking natively at 60fps on Apple Silicon GPUs without taxing CPU cores.
- **Interactive Split-Screen Slider**: Live draggable before/after comparison divider (`Native 1080p` vs `✨ AI 4K Upscaled`).
- **5 Selectable AI Enhancement Modes**: AI 4K Super Resolution, Retina HDR Cinema, Sports Motion Clarity Pro, Anime/Cartoon Sharp, and Passthrough.

### 4. 🎛️ 10-Band Studio Graphic Audio Equalizer (32Hz–16kHz)
- Hardware-accelerated Web Audio BiquadFilter bank covering 32Hz, 64Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz.
- Instant acoustic presets: Flat, Stadium Live, Voice Clarity, Bass Extreme, Cinema Theater, and Night Mode.

### 5. 🚀 Turbo Performance Engine (-60% RAM, Near-Zero CPU)
- Low-RAM optimizer activating DOM virtualization and throttling background overhead.

### 6. 🛡️ 100% Ad-Free Experience (Zero-Ad Shield)
- All 2,989 channels stream without commercial interruptions, popup ads, or tracking scripts.

---

## 🛠️ Build & Installation

### macOS
```bash
./desktop/build_mac.sh 5.1.1 37
```
Or download `LiveTV-v5.1.1.dmg`, drag `Live TV.app` into `/Applications`, and launch.

### Android
```bash
./gradlew assembleRelease
```
Or download `LiveTV-v5.1.1.apk` directly to your Android device or TV.
