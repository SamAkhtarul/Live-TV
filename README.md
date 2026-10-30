<div align="center">

# 📺 Live TV

### Next-Generation Live Streaming for macOS & Android
**2,986+ Live Channels • Real-Time Sports Telemetry • Multi-View Studio • 1-Hour DVR**

[![Platform: macOS](https://img.shields.io/badge/Platform-macOS%20(Apple%20Silicon%20arm64)-000000?style=for-the-badge&logo=apple)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![Platform: Android](https://img.shields.io/badge/Platform-Android%208.0+-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![Version: 3.2](https://img.shields.io/badge/Version-3.2%20(Build%2018)-E50914?style=for-the-badge)](https://github.com/SamAkhtarul/Live-TV/releases/latest)
[![Live Channels](https://img.shields.io/badge/Channels-2%2C986%20Active-blue?style=for-the-badge)](https://github.com/SamAkhtarul/Live-TV/releases/latest)

---

### 🚀 Direct App Downloads

| Platform | Installer Package | Architecture / OS | Direct Download Link |
| :--- | :--- | :--- | :--- |
| **🍎 macOS** | `LiveTV-v3.2.dmg` | Apple Silicon (M1/M2/M3/M4) • macOS 11+ | [⬇️ **Download for macOS (.dmg)**](https://github.com/SamAkhtarul/Live-TV/releases/download/v3.2/LiveTV-v3.2.dmg) |
| **🤖 Android** | `LiveTV-v3.2.apk` | Universal APK • Android 8.0+ (Phone, Tablet, TV) | [⬇️ **Download for Android (.apk)**](https://github.com/SamAkhtarul/Live-TV/releases/download/v3.2/LiveTV-v3.2.apk) |

*All releases are pre-compiled and ready to install immediately.*

---

</div>

## 🌟 Feature Highlights

### 1. 📺 Massive Catalog of 2,986+ HD Live Channels
- Extensive selection of Bangladeshi, Indian, USA, UK, and international broadcasts.
- Categories include: **Sports, News, Entertainment, Movies, Music, Kids, Documentary, and Religious**.
- Native HLS/DASH streaming with automatic quality switching up to **1080p HD & 4K UHD**.

### 2. 🔥 Real-Time Live Sports Telemetry Engine
- **100% genuine real-time data**: Live feeds from FanCode and ESPN API scorepanels.
- Dynamic match status indicators, live scores, overs/wickets/sets/match clocks.
- One-click tuning directly into active HD live match broadcasts for **Cricket, Football, Tennis, and MotoGP**.

### 3. 🔲 Multi-View Studio (Dual & Quad Stream)
- Watch **2 or 4 live streams simultaneously** on the same screen.
- Switch between **Dual (2-Up)** and **Quad (4-Up)** modes with a single click.
- Click any video quadrant to immediately route active audio focus to that channel.

### 4. 🕒 Recently Watched Carousel ("Jump Back In")
- Automatically tracks your last 15 tuned channels in a quick horizontal strip.
- Resume any stream instantly without browsing categories or searching.
- Includes a dedicated "Clear History" option for privacy.

### 5. 📌 Native macOS "Always On Top" Floating Mode
- Keeps Live TV floating above all other desktop applications (browsers, IDEs, Slack).
- Dedicated pin button (**📌**) or keyboard shortcut (**`T`** or `Cmd+T`).

### 6. 🔊 200% Web Audio Booster & Normalizer
- Integrated Web Audio API `GainNode` and `DynamicsCompressorNode` to boost low-volume stream sources up to **200%**.
- Automated compression prevents audio distortion and speaker clipping.

### 7. ⏺️ Live Stream Recorder / Highlight Clip Saver
- One-click **● REC** button (or keyboard shortcut **`R`**) to record live stream segments.
- Live duration counter (`REC 00:24`) and automatic saving to your Downloads folder as `.mp4` / `.webm`.

### 8. 🔢 Digital Cable TV Dialing
- Every channel has a dedicated channel number (e.g. `#01`, `#102`, `#505`).
- Type any numbers on your keyboard to trigger the on-screen display (**`CH 102`**) and tune immediately.

### 9. 📅 Live EPG (Electronic Program Guide) "Now & Next"
- Integrated schedule strip in the video player overlay.
- Displays the current program title, real-time segment progress bar, and upcoming programming.

### 10. 🌐 Multilingual Audio & Subtitle Track Selector
- Switch between commentary languages (English, Bengali, Hindi, Spanish) on multi-track feeds.
- Full closed caption / subtitle track toggle.

### 11. ⚡ Multi-Server Auto-Healing Failover
- Dual and triple broadcast server feeds for major channels (Server 1 / Server 2 / Server 3).
- Instant fallback automatically switches streams if a network hiccup or geo-block occurs.

### 12. ⏪ 1-Hour DVR Timeshift Catch-Up
- 1-hour backbuffer scrubbing with **-15m**, **-30m**, and **-1h** instant jump buttons.
- One-click **"GO LIVE"** button to snap back to the live broadcast edge instantly.

### 13. 📥 Custom M3U / M3U8 Playlist Importer
- Import your own IPTV playlist via remote URL or local `.m3u` / `.m3u8` file.

---

## ⌨️ Keyboard Shortcuts (Desktop)

| Shortcut | Action |
| :--- | :--- |
| **`Space`** / **`K`** | Play / Pause |
| **`Left`** / **`Right` Arrow** | Seek -10s / +10s Catch-Up |
| **`Up`** / **`Down` Arrow** | Volume Up / Down (up to 200% Boost) |
| **`[`** / **`]`** | Previous / Next Channel |
| **`F`** | Toggle Fullscreen |
| **`M`** | Mute / Unmute |
| **`T`** | Toggle Always on Top (Floating Window) |
| **`V`** | Multi-View Studio (Dual/Quad Stream) |
| **`R`** | Record Live Clip |
| **`A`** | Audio & Subtitle Track Selector |
| **`0` - `9`** | Cable TV Numeric Channel Dialing |
| **`S`** | Switch Broadcast Server (Server 1 / 2) |
| **`G`** | Return to Live Edge |
| **`L`** | Lock / Unlock Player Overlay Controls |
| **`Esc`** | Exit Fullscreen / Close Player / Exit Multi-View |

---

## 📥 Installation Guide

### macOS Installation
1. Download **[`LiveTV-v3.2.dmg`](https://github.com/SamAkhtarul/Live-TV/releases/download/v3.2/LiveTV-v3.2.dmg)**.
2. Double-click the `.dmg` file to open the installer disk image.
3. Drag **Live TV.app** into your **Applications** folder.
4. Launch **Live TV** from Launchpad or Applications.
   > **Note for macOS Gatekeeper**: If macOS displays an "unidentified developer" prompt on first launch, open Terminal and run:
   > ```bash
   > xattr -cr "/Applications/Live TV.app"
   > ```
   > Then open Live TV normally.

### Android Installation
1. Download **[`LiveTV-v3.2.apk`](https://github.com/SamAkhtarul/Live-TV/releases/download/v3.2/LiveTV-v3.2.apk)** directly on your Android phone, tablet, or Android TV.
2. Open the downloaded `.apk` file and tap **Install**.
   *(Enable "Allow from this source" in Android Settings if prompted).*
3. Open **Live TV** and start watching.

---

## 🔒 Distribution Notice
This repository is the official binary distribution portal for **Live TV**. All source code is maintained privately and is not publicly released.

To download the latest version or report issues, visit the [Releases](https://github.com/SamAkhtarul/Live-TV/releases) tab.

---

<div align="center">
  <b>Developed & Maintained by <a href="https://github.com/SamAkhtarul">SamAkhtarul</a></b>
</div>
