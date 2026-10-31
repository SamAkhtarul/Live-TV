<div align="center">

# 📺 Live TV

### Next-Generation Live Streaming for macOS & Android
**2,989+ Live Channels • Real-Time WebGL AI Super-Resolution • Sports Telemetry • 10-Band EQ**

[![Platform: macOS](https://img.shields.io/badge/Platform-macOS%20(Apple%20Silicon%20arm64)-000000?style=for-the-badge&logo=apple)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![Platform: Android](https://img.shields.io/badge/Platform-Android%208.0+-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![Version: 5.1.0](https://img.shields.io/badge/Version-5.1.0%20(Build%2035)-E50914?style=for-the-badge)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![Live Channels](https://img.shields.io/badge/Channels-2%2C989%20Active-blue?style=for-the-badge)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![100% Ad-Free](https://img.shields.io/badge/Zero--Ad%20Shield-100%25%20Clean-success?style=for-the-badge)](https://github.com/SamAkhtarul/Live-TV/releases/latest)

---

### 🚀 Direct App Downloads

| Platform | Installer Package | Architecture / OS | Direct Download Link |
| :--- | :--- | :--- | :--- |
| **🍎 macOS** | `LiveTV-v5.1.0.dmg` | Apple Silicon (M1/M2/M3/M4) • macOS 11+ | [⬇️ **Download for macOS (.dmg)**](https://github.com/SamAkhtarul/Live-TV/releases/download/v5.1.0/LiveTV-v5.1.0.dmg) |
| **🤖 Android** | `LiveTV-v5.1.0.apk` | Universal APK • Android 8.0+ (Phone, Tablet, TV) | [⬇️ **Download for Android (.apk)**](https://github.com/SamAkhtarul/Live-TV/releases/download/v5.1.0/LiveTV-v5.1.0.apk) |

*All releases are pre-compiled and ready to install immediately.*

---

</div>

## 🌟 Feature Highlights (v5.1.0)

### 1. ✨ Hardware-Accelerated Real-Time WebGL AI Super-Resolution & Enhancer
- **Zero-Latency GPU Engine**: Direct WebGL 2D Quad running edge-adaptive Sobel convolution and high-pass unsharp masking natively at 60fps on Apple Silicon GPUs without taxing CPU cores.
- **Interactive Split-Screen Slider**: Live draggable before/after comparison divider (`Native 1080p` vs `✨ AI 4K Upscaled`) so viewers can immediately verify the picture enhancement live.
- **5 Selectable AI Enhancement Modes**:
  - `✨ AI 4K Super Resolution`: High-frequency edge restoration without halo artifacts.
  - `🎬 Retina HDR Cinema`: Expands dynamic range, deepens blacks, and boosts color vibrance.
  - `🏎️ Sports Motion Clarity Pro`: Optimizes edge contrast for fast-moving balls and athletes.
  - `🎨 Anime/Cartoon Sharp`: Dynamic contour accentuation with saturated flats.
  - `Off / Clean Passthrough`: Native stream unmodified.

### 2. 🌟 Ultra-Modern Home Page Redesign
- **Obsidian Depth & Frosted Glass**: Modern glassmorphism UI featuring `#090a0f` deep obsidian aesthetic with subtle multi-layer drop shadows and 1px translucent borders.
- **Cinematic Hero Broadcast Spotlight Billboard**: Curated featured live broadcast billboard with 1-click 4K HDR playback, live match scores, and Sports HUD integration.
- **Clean Inline Metallic Channel Cards**: Polished layout placing metallic channel numbers (`#01`, `#50`) cleanly inline beside channel titles, eliminating clutter.
- **Modern Sports Cards**: Refined glass sports event cards without harsh reddish-brown borders.

### 3. 🚀 Turbo Performance Engine (-60% RAM, Near-Zero CPU)
- Low-RAM optimizer activating DOM virtualization and throttling unnecessary background animations.
- Preserves battery life and keeps playback lightning-fast even during long viewing sessions.

### 4. 🗂️ Advanced Channel Sorting & Multi-View Filtering
- Instant sorting: Numerical (`#1 - #3000`), Alphabetical (`A - Z`), Favorites First, or Live Sports Priority.
- Quick filter chips: All, HD/4K, Sports, News.

### 5. 🎛️ 10-Band Studio Graphic Audio Equalizer (32Hz–16kHz)
- Hardware-accelerated Web Audio BiquadFilter bank covering 32Hz, 64Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz.
- Instant acoustic presets: Flat, Stadium Live, Voice Clarity, Bass Extreme, Cinema Theater, and Night Mode.

### 6. 📊 Interactive Live Match Center Scorecard Modal
- Real-time telemetry for Cricket, Football, Tennis, and Motorsport with detailed batsmen statistics, active bowlers, overs, run rates, and instant 1-click tune-in.

### 7. 📶 Real-Time Bandwidth & Data Consumption Meter
- Live bitrate monitor displaying actual data usage (e.g. `4.8 Mbps (1.2 GB/h)`) in the player HUD.

### 8. 📱 Permanent Auto-Reconnecting Remote Hub & Bonjour Zero-Config
- Connect seamlessly from any smartphone via `http://sams-macbook-pro.local:8998` or local IP.
- Full bi-directional favorites synchronization, haptic feedback, and volume/channel control.

### 9. 🛡️ 100% Ad-Free Experience (Zero-Ad Shield)
- All 2,989 channels stream without commercial interruptions, popup ads, or tracking scripts.

---

## 🛠️ Build & Installation

### macOS
```bash
./desktop/build_mac.sh 5.1.0 35
```
Or download `LiveTV-v5.1.0.dmg`, drag `Live TV.app` into `/Applications`, and launch.

### Android
```bash
./gradlew assembleRelease
```
Or download `LiveTV-v5.1.0.apk` directly to your Android device or TV.
