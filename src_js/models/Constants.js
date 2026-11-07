/**
 * Live TV - Application Constants & Configuration
 * Architecture: Model / Constants
 */

export const APP_VERSION = "5.5.0";
export const APP_BUILD = 68;

// GitHub Repository & Update Manifest URLs
export const GITHUB_REPO_URL = "https://github.com/SamAkhtarul/Live-TV";
export const GITHUB_RELEASES_URL = "https://github.com/SamAkhtarul/Live-TV/releases";
export const GITHUB_API_LATEST_RELEASE = "https://api.github.com/repos/SamAkhtarul/Live-TV/releases/latest";
export const UPDATE_MANIFEST_URL = "https://raw.githubusercontent.com/SamAkhtarul/Live-TV/main/version.json";

// Local Storage Keys
export const STORAGE_FAVORITES = "livetv_favorites_order_v3";
export const STORAGE_CATEGORIES = "livetv_category_order_v3";
export const STORAGE_VOLUME = "livetv_volume";
export const STORAGE_BRIGHTNESS = "livetv_brightness";
export const STORAGE_RECENTS = "livetv_recents_v1";
export const STORAGE_SLEEP = "livetv_sleep_minutes";
export const STORAGE_DATA_SAVER = "livetv_datasaver_enabled";
export const STORAGE_CUSTOM_CHANNELS = "livetv_custom_channels_v2";

// Stop Words for Sports Team Token Matching
export const STOP_WORDS_SPORTS = new Set(["vs", "v", "women", "men", "fc", "club", "the", "and", "team", "sixes", "cup", "league"]);

// Quality Presets
export const STANDARD_QUALITIES = [
  { label: "Auto", height: -1 },
  { label: "1080p FHD", height: 1080 },
  { label: "720p HD", height: 720 },
  { label: "480p SD", height: 480 },
  { label: "360p Low", height: 360 }
];

// Audio Equalizer Presets
export const AUDIO_PROFILES = {
  standard: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  stadium: [4, 3, 1, 0, -1, 1, 3, 4, 5, 4],
  commentary: [-4, -3, -1, 2, 5, 5, 4, 2, 0, -2],
  bass: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0],
  night: [-6, -4, -2, 1, 2, 2, 1, -1, -3, -5]
};

// 10-Band Graphic Audio Equalizer Frequencies
export const EQ_BANDS = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

// Clarity Video Filter Modes
export const CLARITY_MODES = [
  { label: "Normal", filter: "none" },
  { label: "Vivid Sports", filter: "saturate(1.25) contrast(1.15) brightness(1.05)" },
  { label: "High Contrast", filter: "contrast(1.3) brightness(1.02)" },
  { label: "Warm Cinema", filter: "sepia(0.15) saturate(1.1) brightness(0.98)" },
  { label: "Cool Turf", filter: "hue-rotate(5deg) saturate(1.2) contrast(1.1)" }
];

// Commercial Break Snooze Durations (seconds)
export const BREAK_DURATIONS = [30, 60, 90, 120, 180];

// Default Followed Sports Teams
export const DEFAULT_TEAMS = [
  "Real Madrid", "Barcelona", "Arsenal", "Manchester City", "Liverpool",
  "Bangladesh", "India", "Ferrari", "Ducati", "Mercedes"
];

// Aspect Ratio Display Modes
export const ASPECT_MODES = [
  { id: "fit", label: "Fit (Original)", class: "aspect-fit" },
  { id: "16-9", label: "16:9 Cinema", class: "aspect-16-9" },
  { id: "fill", label: "Fill Screen", class: "aspect-fill" },
  { id: "4-3", label: "4:3 Classic", class: "aspect-4-3" }
];

// Multi-Server Alternate Streams (Instant Failover & Manual Switching)
export const CHANNEL_SERVERS = {
  // --- MotoGP Primary Feeds ---
  "motogp_official_world_feed": [
    { label: "Server 1 (MotoGP World Feed FHD • Dorna Live)", url: "https://otte.cache.aiv-cdn.net/bom-nitro/live/clients/dash/enc/wjeweupwyc/out/v1/8197c8e055c94a868623653ac55c10bf/cenc.mpd|clearkey=e03f302ec4dabcccca82cc9f76731ec9:53ea1027d2bf2893a552cf15bc0366de" },
    { label: "Server 2 (TNT Sports 2 HD • MotoGP UK Live)", url: "https://a122aivottlinear-a.akamaihd.net/OTTB/syd-nitro/live/clients/dash/enc/puehlftk5j/out/v1/f7f0da1ee112481ca0024e6d4dd97f4a/cenc.mpd|clearkey=f3df7843080ae743bf865dc5fdf64c68:567c863bc12eb74788ea74888c042e1b" },
    { label: "Server 3 (FanCode 1 FHD • MotoGP Live)", url: "https://otte.cache.aiv-cdn.net/iad-nitro/live/clients/dash/enc/b3b3fkmrbl/out/v1/1084d5c9a97a4c5b9f9554c88f486646/cenc.mpd|clearkey=82dfca238e8c4b430a3269db71965db9:a00b28caf4ac628e77a553d440c0ddca" },
    { label: "Server 4 (Sky Sports Top Event FHD)", url: "https://otte.live.fly.ww.aiv-cdn.net/iad-nitro/live/clients/dash/enc/gjsukewpxp/out/v1/ef14aacf858248839b9867eec5caf563/cenc.mpd|clearkey=368bd4ebe301406897324bc777650411:69d27c2c2b7de927d67aacc973259901" },
    { label: "Server 5 (Eurosport Motorsport 4K)", url: "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8" }
  ],
  "fancode_motogp_live": [
    { label: "Server 1 (FanCode 1 FHD • MotoGP Dedicated)", url: "https://otte.cache.aiv-cdn.net/iad-nitro/live/clients/dash/enc/b3b3fkmrbl/out/v1/1084d5c9a97a4c5b9f9554c88f486646/cenc.mpd|clearkey=82dfca238e8c4b430a3269db71965db9:a00b28caf4ac628e77a553d440c0ddca" },
    { label: "Server 2 (FanCode 2 FHD • Motorsports & Sports)", url: "https://otte.cache.aiv-cdn.net/iad-nitro/live/clients/dash/enc/avqlywnuzx/out/v1/aefca6420f944a9482e117f315de535f/cenc.mpd|clearkey=1994b1df7dfd2e8a8d7b9bf3fb900285:22a1444b3da18e139191665b3d652835" },
    { label: "Server 3 (MotoGP World Feed FHD)", url: "https://otte.cache.aiv-cdn.net/bom-nitro/live/clients/dash/enc/wjeweupwyc/out/v1/8197c8e055c94a868623653ac55c10bf/cenc.mpd|clearkey=e03f302ec4dabcccca82cc9f76731ec9:53ea1027d2bf2893a552cf15bc0366de" },
    { label: "Server 4 (FanCode Live HD)", url: "https://otte.live.fly.ww.aiv-cdn.net/iad-nitro/live/clients/dash-sd/enc/eayjamsonn/out/v1/6c25cddab58043a6ace0ac64d97983f0/cenc-sd.mpd|clearkey=5318e462b9e0677487cb87837f0bbdb1:4fa0fb973b95738306005f2e8591bf8e" },
    { label: "Server 5 (Eurosport Motorsport 4K)", url: "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8" }
  ],
  "spotv_2_hd_motogp": [
    { label: "Server 1 (MotoGP World Feed FHD)", url: "https://otte.cache.aiv-cdn.net/bom-nitro/live/clients/dash/enc/wjeweupwyc/out/v1/8197c8e055c94a868623653ac55c10bf/cenc.mpd|clearkey=e03f302ec4dabcccca82cc9f76731ec9:53ea1027d2bf2893a552cf15bc0366de" },
    { label: "Server 2 (TNT Sports 2 HD • MotoGP UK Live)", url: "https://a122aivottlinear-a.akamaihd.net/OTTB/syd-nitro/live/clients/dash/enc/puehlftk5j/out/v1/f7f0da1ee112481ca0024e6d4dd97f4a/cenc.mpd|clearkey=f3df7843080ae743bf865dc5fdf64c68:567c863bc12eb74788ea74888c042e1b" },
    { label: "Server 3 (FanCode 1 FHD • MotoGP)", url: "https://otte.cache.aiv-cdn.net/iad-nitro/live/clients/dash/enc/b3b3fkmrbl/out/v1/1084d5c9a97a4c5b9f9554c88f486646/cenc.mpd|clearkey=82dfca238e8c4b430a3269db71965db9:a00b28caf4ac628e77a553d440c0ddca" },
    { label: "Server 4 (Sky Sports Racing FHD)", url: "https://bl.rutube.ru/livestream/362d68a2d5d5b48dbf23522573e64d57/index.m3u8?s=SyXrFpONvusXH9PA0isg7Q&e=2075285628&scheme=https" },
    { label: "Server 5 (Eurosport Motorsport 4K)", url: "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8" }
  ],
  "spotv_hd_motogp": [
    { label: "Server 1 (MotoGP World Feed FHD)", url: "https://otte.cache.aiv-cdn.net/bom-nitro/live/clients/dash/enc/wjeweupwyc/out/v1/8197c8e055c94a868623653ac55c10bf/cenc.mpd|clearkey=e03f302ec4dabcccca82cc9f76731ec9:53ea1027d2bf2893a552cf15bc0366de" },
    { label: "Server 2 (FanCode 1 FHD • MotoGP)", url: "https://otte.cache.aiv-cdn.net/iad-nitro/live/clients/dash/enc/b3b3fkmrbl/out/v1/1084d5c9a97a4c5b9f9554c88f486646/cenc.mpd|clearkey=82dfca238e8c4b430a3269db71965db9:a00b28caf4ac628e77a553d440c0ddca" },
    { label: "Server 3 (TNT Sports 2 HD • MotoGP)", url: "https://a122aivottlinear-a.akamaihd.net/OTTB/syd-nitro/live/clients/dash/enc/puehlftk5j/out/v1/f7f0da1ee112481ca0024e6d4dd97f4a/cenc.mpd|clearkey=f3df7843080ae743bf865dc5fdf64c68:567c863bc12eb74788ea74888c042e1b" },
    { label: "Server 4 (Eurosport Motorsport 4K)", url: "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8" }
  ],
  "tnt_sports_2_hd": [
    { label: "Server 1 (TNT Sports 2 HD • MotoGP UK Live)", url: "https://a122aivottlinear-a.akamaihd.net/OTTB/syd-nitro/live/clients/dash/enc/puehlftk5j/out/v1/f7f0da1ee112481ca0024e6d4dd97f4a/cenc.mpd|clearkey=f3df7843080ae743bf865dc5fdf64c68:567c863bc12eb74788ea74888c042e1b" },
    { label: "Server 2 (MotoGP World Feed FHD)", url: "https://otte.cache.aiv-cdn.net/bom-nitro/live/clients/dash/enc/wjeweupwyc/out/v1/8197c8e055c94a868623653ac55c10bf/cenc.mpd|clearkey=e03f302ec4dabcccca82cc9f76731ec9:53ea1027d2bf2893a552cf15bc0366de" },
    { label: "Server 3 (Sky Sports Racing FHD)", url: "https://bl.rutube.ru/livestream/362d68a2d5d5b48dbf23522573e64d57/index.m3u8?s=SyXrFpONvusXH9PA0isg7Q&e=2075285628&scheme=https" },
    { label: "Server 4 (Eurosport Motorsport 4K)", url: "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8" }
  ],
  "tnt_sports_1_hd": [
    { label: "Server 1 (TNT Sports 1 HD • Football & UCL)", url: "https://a122aivottlinear-a.akamaihd.net/OTTB/syd-nitro/live/clients/dash/enc/jkemlgrttp/out/v1/2af1401c8abe4e69ab861ea75fa1fa7f/cenc.mpd|clearkey=69a5aa835a061ce64a630d1046727e40:d02feac8a999bd06bf4059bf33411749" },
    { label: "Server 2 (Sky Sports Premier League FHD)", url: "https://bl.rutube.ru/livestream/e5bacac3b8e730791d4cab20ae81cd8f/index.m3u8?s=Dxx13S3dlOjavbRFqRtQ6g&e=2075285630&scheme=" }
  ],
  "tnt_sports_3_hd": [
    { label: "Server 1 (TNT Sports 3 HD)", url: "https://a122aivottlinear-a.akamaihd.net/OTTB/syd-nitro/live/clients/dash/enc/dev1hjwzh9/out/v1/a5f0ee7ad7b24906b14f43bebbbe4678/cenc.mpd|clearkey=cc91508324ce9dcaf425a43d58f1d9d4:643e5474d9edd87c7d9091c8c97994ca" },
    { label: "Server 2 (Sky Sports Mix FHD)", url: "https://otte.live.fly.ww.aiv-cdn.net/iad-nitro/live/clients/dash/enc/oln41tn1gj/out/v1/1247ce6ac92b4ee3be02e7082954348a/cenc.mpd|clearkey=fa23a7c0d9c82f0c7b113506e202af8c:a883237ef30932b731f71aa59a0805c0" }
  ],
  "servustv_motogp_hd": [
    { label: "Server 1 (Red Bull TV / MotoGP)", url: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8" },
    { label: "Server 2 (MotoGP World Feed FHD)", url: "https://otte.cache.aiv-cdn.net/bom-nitro/live/clients/dash/enc/wjeweupwyc/out/v1/8197c8e055c94a868623653ac55c10bf/cenc.mpd|clearkey=e03f302ec4dabcccca82cc9f76731ec9:53ea1027d2bf2893a552cf15bc0366de" },
    { label: "Server 3 (Eurosport Motorsport 4K)", url: "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8" }
  ],

  // --- Willow Sports / Cricket ---
  "willow_cricket_hd": [
    { label: "Server 1 (Willow Cricket FHD • Amazon CDN)", url: "https://otte.live.fly.ww.aiv-cdn.net/iad-nitro/live/clients/dash/enc/vyjgbcddti/out/v1/afd9c25f5179456fb3caf61ccbde2652/cenc.mpd|clearkey=2fcc4db0b53bea0a25def717c67cfe57:71ba2e8f5ea6cd6ad995206b300f051a" },
    { label: "Server 2 (Willow Cricket Live 2 • Amazon CDN)", url: "https://otte.live.fly.ww.aiv-cdn.net/iad-nitro/live/clients/dash/enc/luldqqjdgc/out/v1/819f4b259e5248c089feb5934af92890/cenc.mpd|clearkey=cf6092dc6444b182d9ef6fde4152ff7d:2a868d1944e597930dde32f183a0c6bf" },
    { label: "Server 3 (Willow TV BDIX)", url: "https://tvsen5.aynaott.com/willowhd/index.m3u8" }
  ],
  "willow_hd_2054": [
    { label: "Server 1 (Willow Cricket FHD • Amazon CDN)", url: "https://otte.live.fly.ww.aiv-cdn.net/iad-nitro/live/clients/dash/enc/vyjgbcddti/out/v1/afd9c25f5179456fb3caf61ccbde2652/cenc.mpd|clearkey=2fcc4db0b53bea0a25def717c67cfe57:71ba2e8f5ea6cd6ad995206b300f051a" },
    { label: "Server 2 (Willow Cricket Live 2 • Amazon CDN)", url: "https://otte.live.fly.ww.aiv-cdn.net/iad-nitro/live/clients/dash/enc/luldqqjdgc/out/v1/819f4b259e5248c089feb5934af92890/cenc.mpd|clearkey=cf6092dc6444b182d9ef6fde4152ff7d:2a868d1944e597930dde32f183a0c6bf" },
    { label: "Server 3 (Willow TV BDIX)", url: "https://tvsen5.aynaott.com/willowhd/index.m3u8" }
  ],
  "willow_tv_2691": [
    { label: "Server 1 (Willow Cricket FHD • Amazon CDN)", url: "https://otte.live.fly.ww.aiv-cdn.net/iad-nitro/live/clients/dash/enc/vyjgbcddti/out/v1/afd9c25f5179456fb3caf61ccbde2652/cenc.mpd|clearkey=2fcc4db0b53bea0a25def717c67cfe57:71ba2e8f5ea6cd6ad995206b300f051a" },
    { label: "Server 2 (Willow Cricket Live 2 • Amazon CDN)", url: "https://otte.live.fly.ww.aiv-cdn.net/iad-nitro/live/clients/dash/enc/luldqqjdgc/out/v1/819f4b259e5248c089feb5934af92890/cenc.mpd|clearkey=cf6092dc6444b182d9ef6fde4152ff7d:2a868d1944e597930dde32f183a0c6bf" },
    { label: "Server 3 (Willow TV BDIX)", url: "https://tvsen5.aynaott.com/willowhd/index.m3u8" }
  ],

  // --- Sky Sports ---
  "sky_sports_main_event_hd": [
    { label: "Server 1 (Sky Sports Premier League FHD)", url: "https://bl.rutube.ru/livestream/e5bacac3b8e730791d4cab20ae81cd8f/index.m3u8?s=Dxx13S3dlOjavbRFqRtQ6g&e=2075285630&scheme=" },
    { label: "Server 2 (Sky Sports Top Event FHD)", url: "https://otte.live.fly.ww.aiv-cdn.net/iad-nitro/live/clients/dash/enc/gjsukewpxp/out/v1/ef14aacf858248839b9867eec5caf563/cenc.mpd|clearkey=368bd4ebe301406897324bc777650411:69d27c2c2b7de927d67aacc973259901" },
    { label: "Server 3 (Sky Sports Mix FHD)", url: "https://otte.live.fly.ww.aiv-cdn.net/iad-nitro/live/clients/dash/enc/oln41tn1gj/out/v1/1247ce6ac92b4ee3be02e7082954348a/cenc.mpd|clearkey=fa23a7c0d9c82f0c7b113506e202af8c:a883237ef30932b731f71aa59a0805c0" }
  ],
  "sky_sports_f1_1989": [
    { label: "Server 1 (Sky Sports Racing FHD)", url: "https://bl.rutube.ru/livestream/362d68a2d5d5b48dbf23522573e64d57/index.m3u8?s=SyXrFpONvusXH9PA0isg7Q&e=2075285628&scheme=https" },
    { label: "Server 2 (Sky Sports Top Event FHD)", url: "https://otte.live.fly.ww.aiv-cdn.net/iad-nitro/live/clients/dash/enc/gjsukewpxp/out/v1/ef14aacf858248839b9867eec5caf563/cenc.mpd|clearkey=368bd4ebe301406897324bc777650411:69d27c2c2b7de927d67aacc973259901" },
    { label: "Server 3 (Eurosport Motorsport 4K)", url: "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8" }
  ],
  "sky_sports_nfl_1990": [
    { label: "Server 1 (Sky Sports Action FHD)", url: "https://bl.rutube.ru/livestream/a8983f2de47db830f6a6977cb71a13df/index.m3u8?s=0IPFuH3ITcZpvnrqHhYw0A&e=2075285628&scheme=https" },
    { label: "Server 2 (Sky Sports Mix FHD)", url: "https://otte.live.fly.ww.aiv-cdn.net/iad-nitro/live/clients/dash/enc/oln41tn1gj/out/v1/1247ce6ac92b4ee3be02e7082954348a/cenc.mpd|clearkey=fa23a7c0d9c82f0c7b113506e202af8c:a883237ef30932b731f71aa59a0805c0" }
  ],

  // --- beIN Sports ---
  "bein_sports_1": [
    { label: "Server 1 (beIN Sports 1 FHD • Amazon CDN)", url: "https://otte.cache.aiv-cdn.net/bom-nitro/live/clients/dash/enc/ghwcl6hv68/out/v1/83536910d8034e9b9895a20fbe1c1687/cenc.mpd|clearkey=335dad778109954503dcbb21dc92015f:24bfd75d436cbf73168a2a2dccd40281" },
    { label: "Server 2 (beIN Sports English 1080p FAST)", url: "https://bein-xtra-bein.amagi.tv/playlist.m3u8" }
  ],
  "bein_sports_2": [
    { label: "Server 1 (beIN Sports 2 FHD • Amazon CDN)", url: "https://otte.cache.aiv-cdn.net/bom-nitro/live/clients/dash/enc/8m8cd46i1t/out/v1/83985c68e4174e90a58a1f2c024be4c9/cenc.mpd|clearkey=0b42be2664d7e811d04f3e504e0924c5:ae24090123b8c72ac5404dc152847cb8" },
    { label: "Server 2 (beIN Sports English 1080p FAST)", url: "https://bein-xtra-bein.amagi.tv/playlist.m3u8" }
  ],
  "bein_sports_3": [
    { label: "Server 1 (beIN Sports 3 FHD • Amazon CDN)", url: "https://otte.cache.aiv-cdn.net/bom-nitro/live/clients/dash/enc/q4u5nwaogz/out/v1/18de6d3e65934f3a8de4358e69eab86c/cenc.mpd|clearkey=7995c724a13748ed970840a8ab5bb9b3:67bdaf1e2175b9ff682fcdf0e2354b1e" },
    { label: "Server 2 (beIN Sports English 1080p FAST)", url: "https://bein-xtra-bein.amagi.tv/playlist.m3u8" }
  ],
  "bein_sports_xtra_fb": [
    { label: "Server 1 (beIN Sports XTRA 1080p FAST 24/7)", url: "https://bein-xtra-bein.amagi.tv/playlist.m3u8" },
    { label: "Server 2 (beIN Sports XTRA Español 1080p)", url: "https://dc1644a9jazgj.cloudfront.net/beIN_Sports_Xtra_Espanol.m3u8" }
  ],
  "bein_motogp": [
    { label: "Server 1 (beIN Sports XTRA 1080p FAST 24/7)", url: "https://bein-xtra-bein.amagi.tv/playlist.m3u8" },
    { label: "Server 2 (MotoGP World Feed FHD)", url: "https://otte.cache.aiv-cdn.net/bom-nitro/live/clients/dash/enc/wjeweupwyc/out/v1/8197c8e055c94a868623653ac55c10bf/cenc.mpd|clearkey=e03f302ec4dabcccca82cc9f76731ec9:53ea1027d2bf2893a552cf15bc0366de" }
  ],
  "discovery_bangla": [
    { label: "Server 1 (GP CDN Bangladesh)", url: "https://drk6xq0vhn.gpcdn.net/live/discovery_sd_abr/index.m3u8" },
    { label: "Server 2 (1080p World Feed)", url: "https://streaming.aurora.enhanced.live/live/mpc/enl0eG1mLmVncmVzcy5mZDJ2eHI=/out/v1/IT_SIMULCAST/DISCOVERYCHANNEL/CMAF/index.m3u8" },
    { label: "Server 3 (Asharq Discovery HD)", url: "https://svs.itworkscdn.net/asharqdiscoverylive/asharqd.smil/playlist_dvr.m3u8" }
  ],
  "discovery_kids_bangla": [
    { label: "Server 1 (GP CDN Bangladesh)", url: "https://drk6xq0vhn.gpcdn.net/live/discovery_kids_abr/index.m3u8" }
  ],
  "atp_paris_masters_live_hd": [
    { label: "Server 1 (Tennis Channel 2 Live 1080p • Paris Masters)", url: "https://mumbai-edge.smartplaytv.in/Tennis2/index.m3u8" },
    { label: "Server 2 (Setanta Sports 2 Eurasia 1080p)", url: "http://stream.mcquack.net/235/index.m3u8" },
    { label: "Server 3 (Setanta Sports 1 Live)", url: "http://178.124.179.122:8080/Setanta1/index.m3u8" },
    { label: "Server 4 (Tennis Channel International HD)", url: "https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01444-tennischannelth-tennischnlintl-lggb/playlist.m3u8" },
    { label: "Server 5 (Court 1 Live • Setanta Live Feed)", url: "https://a118.azplay55.me/hls/streama270965/index.m3u8?cst=a555f23b216f6c16da8b13b325fab55b" },
    { label: "Server 6 (Court 2 Alternate Feed)", url: "https://a78.azplay55.me/hls/streama271413/index.m3u8?cst=d31262c2d03413d05fc26dc25f97e9be" },
    { label: "Server 7 (Tennis Channel Europe)", url: "https://cdn-ue1-prod.tsv2.amagi.tv/linear/amg01444-tennischannelth-tennischannelnl-samsungnl/playlist.m3u8" }
  ],
  "setanta_sports_1_hd": [
    { label: "Server 1 (Setanta Sports 1 Live • ATP Paris)", url: "http://178.124.179.122:8080/Setanta1/index.m3u8" },
    { label: "Server 2 (Setanta Sports 2 Eurasia 1080p)", url: "http://stream.mcquack.net/235/index.m3u8" },
    { label: "Server 3 (Tennis Channel 2 Live 1080p)", url: "https://mumbai-edge.smartplaytv.in/Tennis2/index.m3u8" },
    { label: "Server 4 (Tennis Channel HD)", url: "https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01444-tennischannelth-tennischnlintl-lggb/playlist.m3u8" },
    { label: "Server 5 (Court 1 Live • Setanta Feed)", url: "https://a118.azplay55.me/hls/streama270965/index.m3u8?cst=a555f23b216f6c16da8b13b325fab55b" }
  ],
  "setanta_sports_2_hd": [
    { label: "Server 1 (Setanta Sports 2 Eurasia 1080p)", url: "http://stream.mcquack.net/235/index.m3u8" },
    { label: "Server 2 (Tennis Channel 2 Live 1080p)", url: "https://mumbai-edge.smartplaytv.in/Tennis2/index.m3u8" },
    { label: "Server 3 (Setanta Sports 1 Live)", url: "http://178.124.179.122:8080/Setanta1/index.m3u8" },
    { label: "Server 4 (Tennis Channel HD)", url: "https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01444-tennischannelth-tennischnlintl-lggb/playlist.m3u8" }
  ],
  "tennis_channel_intl_hd": [
    { label: "Server 1 (Tennis Channel HD)", url: "https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01444-tennischannelth-tennischnlintl-lggb/playlist.m3u8" },
    { label: "Server 2 (Tennis Channel T2)", url: "https://mumbai-edge.smartplaytv.in/Tennis2/index.m3u8" },
    { label: "Server 3 (Tennis Channel Europe)", url: "https://cdn-ue1-prod.tsv2.amagi.tv/linear/amg01444-tennischannelth-tennischannelnl-samsungnl/playlist.m3u8" },
    { label: "Server 4 (beIN Sports XTRA)", url: "https://bein-xtra-bein.amagi.tv/playlist.m3u8" }
  ],
  "tennis_channel_2_t2": [
    { label: "Server 1 (Tennis Channel T2)", url: "https://mumbai-edge.smartplaytv.in/Tennis2/index.m3u8" },
    { label: "Server 2 (Tennis Channel HD)", url: "https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01444-tennischannelth-tennischnlintl-lggb/playlist.m3u8" },
    { label: "Server 3 (Tennis Channel Europe)", url: "https://cdn-ue1-prod.tsv2.amagi.tv/linear/amg01444-tennischannelth-tennischannelnl-samsungnl/playlist.m3u8" }
  ],
  "tsn_1_hd": [
    { label: "Server 1 (TSN 1 HD • Paris Masters)", url: "https://a122aivottlinear-a.akamaihd.net/OTTB/syd-nitro/live/clients/dash/enc/qf74k0ebqw/out/v1/59385c7bb957434fa5ef111816f1df15/cenc.mpd|clearkey=990924040da2bb17d848773950b71ee9:ca5427b233a1e9487c631e51ba976527" },
    { label: "Server 2 (Tennis Channel HD)", url: "https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01444-tennischannelth-tennischnlintl-lggb/playlist.m3u8" },
    { label: "Server 3 (Tennis Channel T2)", url: "https://mumbai-edge.smartplaytv.in/Tennis2/index.m3u8" }
  ],
  "espn_2_brasil_hd": [
    { label: "Server 1 (ESPN 2 Brasil HD)", url: "https://mumbai-edge.smartplaytv.in/Tennis2/index.m3u8" },
    { label: "Server 2 (Tennis Channel HD)", url: "https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01444-tennischannelth-tennischnlintl-lggb/playlist.m3u8" }
  ],
  "channel_24_hd": [
    { label: "Server 1 (AynaOTT BDIX)", url: "https://tvsen6.aynaott.com/YrVDF8gujkdh/index.m3u8" },
    { label: "Server 2 (AynaOTT Direct)", url: "https://tvsen5.aynaott.com/channel24/index.m3u8" }
  ],
  "zee_bangla_hd": [
    { label: "Server 1 (CloudFront HD Master)", url: "https://d1rc86nwwc9fag.cloudfront.net/260723/smil:zeebangla.smil/chunklist_b2628000.m3u8" },
    { label: "Server 2 (GP CDN Bangladesh)", url: "https://drk6xq0vhn.gpcdn.net/live/zee_bangla_abr/index.m3u8" }
  ],
  "t_sports_hd": [
    { label: "Server 1 (BDIX Full HD)", url: "http://103.135.253.32:8080/T-SPORTS-FULL-HD/tracks-v1a1/mono.m3u8" },
    { label: "Server 2 (AynaOTT Live)", url: "https://tvsen5.aynaott.com/tsports/index.m3u8" },
    { label: "Server 3 (Willow HD Live)", url: "https://tvsen5.aynaott.com/willowhd/index.m3u8" }
  ],
  "star_sports_1": [
    { label: "Server 1 (BDIX Select 1)", url: "http://103.135.253.32:8080/STAR-SPORTS-SELECT-1/index.m3u8" },
    { label: "Server 2 (Willow HD Direct)", url: "https://tvsen5.aynaott.com/willowhd/index.m3u8" }
  ],
  "star_sports_2_hd": [
    { label: "Server 1 (AynaOTT Direct)", url: "https://tvsen7.aynaott.com/ssport2hd/index.m3u8" },
    { label: "Server 2 (BDIX Select 1)", url: "http://103.135.253.32:8080/STAR-SPORTS-SELECT-1/index.m3u8" }
  ]
};

// Guaranteed Working Live Backups for Automated Failover
export const MOTOGP_BACKUPS = {
  "spotv_2_hd_motogp": "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8",
  "spotv_hd_motogp": "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8",
  "motogp_official_world_feed": "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8",
  "fancode_motogp_live": "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8",
  "tnt_sports_2_hd": "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8",
  "tnt_sports_1_hd": "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8",
  "tnt_sports_3_hd": "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8",
  "tnt_sports_4_hd": "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8"
};
