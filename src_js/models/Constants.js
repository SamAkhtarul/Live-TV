/**
 * Live TV - Application Constants & Configuration
 * Architecture: Model / Constants
 */

export const APP_VERSION = "5.3.0";
export const APP_BUILD = 62;

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
  "spotv_2_hd_motogp": [
    { label: "Server 1 (MotoGP Live HD • TNT Sports 2)", url: "https://a122aivottlinear-a.akamaihd.net/OTTB/syd-nitro/live/clients/dash/enc/puehlftk5j/out/v1/f7f0da1ee112481ca0024e6d4dd97f4a/cenc.mpd|clearkey=f3df7843080ae743bf865dc5fdf64c68:567c863bc12eb74788ea74888c042e1b" },
    { label: "Server 2 (SPOTV 2 HD Cignal Direct)", url: "https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/dr_spotv2hd/default/index.mpd|clearkey=7eea72d6075245a99ee3255603d58853:6848ef60575579bf4d415db2ab96e637" },
    { label: "Server 3 (Eurosport Motorsport 4K)", url: "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8" },
    { label: "Server 4 (beIN Sports Racing HD)", url: "https://bein-esp-xumo.amagi.tv/playlistR1080p.m3u8" }
  ],
  "spotv_hd_motogp": [
    { label: "Server 1 (MotoGP Live HD • TNT Sports 2)", url: "https://a122aivottlinear-a.akamaihd.net/OTTB/syd-nitro/live/clients/dash/enc/puehlftk5j/out/v1/f7f0da1ee112481ca0024e6d4dd97f4a/cenc.mpd|clearkey=f3df7843080ae743bf865dc5fdf64c68:567c863bc12eb74788ea74888c042e1b" },
    { label: "Server 2 (SPOTV HD Cignal Direct)", url: "https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/cg_spotvhd/default/index.mpd|clearkey=ec7ee27d83764e4b845c48cca31c8eef:9c0e4191203fccb0fde34ee29999129e" },
    { label: "Server 3 (Eurosport Motorsport 4K)", url: "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8" }
  ],
  "tnt_sports_2_hd": [
    { label: "Server 1 (TNT Sports 2 HD • MotoGP)", url: "https://a122aivottlinear-a.akamaihd.net/OTTB/syd-nitro/live/clients/dash/enc/puehlftk5j/out/v1/f7f0da1ee112481ca0024e6d4dd97f4a/cenc.mpd|clearkey=f3df7843080ae743bf865dc5fdf64c68:567c863bc12eb74788ea74888c042e1b" },
    { label: "Server 2 (Eurosport Motorsport 4K)", url: "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8" },
    { label: "Server 3 (beIN Sports Racing HD)", url: "https://bein-esp-xumo.amagi.tv/playlistR1080p.m3u8" }
  ],
  "servustv_motogp_hd": [
    { label: "Server 1 (Red Bull TV / MotoGP)", url: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8" },
    { label: "Server 2 (Eurosport Motorsport 4K)", url: "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8" }
  ],
  "motogp_official_world_feed": [
    { label: "Server 1 (MotoGP Live HD • TNT Sports 2)", url: "https://a122aivottlinear-a.akamaihd.net/OTTB/syd-nitro/live/clients/dash/enc/puehlftk5j/out/v1/f7f0da1ee112481ca0024e6d4dd97f4a/cenc.mpd|clearkey=f3df7843080ae743bf865dc5fdf64c68:567c863bc12eb74788ea74888c042e1b" },
    { label: "Server 2 (Eurosport Motorsport 4K)", url: "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8" }
  ],
  "fancode_motogp_live": [
    { label: "Server 1 (MotoGP Live HD • TNT Sports 2)", url: "https://a122aivottlinear-a.akamaihd.net/OTTB/syd-nitro/live/clients/dash/enc/puehlftk5j/out/v1/f7f0da1ee112481ca0024e6d4dd97f4a/cenc.mpd|clearkey=f3df7843080ae743bf865dc5fdf64c68:567c863bc12eb74788ea74888c042e1b" },
    { label: "Server 2 (Eurosport Motorsport 4K)", url: "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8" }
  ],
  "discovery_bangla": [
    { label: "Server 1 (GP CDN Bangladesh)", url: "https://drk6xq0vhn.gpcdn.net/live/discovery_sd_abr/index.m3u8" },
    { label: "Server 2 (1080p World Feed)", url: "https://streaming.aurora.enhanced.live/live/mpc/enl0eG1mLmVncmVzcy5mZDJ2eHI=/out/v1/IT_SIMULCAST/DISCOVERYCHANNEL/CMAF/index.m3u8" },
    { label: "Server 3 (Asharq Discovery HD)", url: "https://svs.itworkscdn.net/asharqdiscoverylive/asharqd.smil/playlist_dvr.m3u8" }
  ],
  "discovery_kids_bangla": [
    { label: "Server 1 (GP CDN Bangladesh)", url: "https://drk6xq0vhn.gpcdn.net/live/discovery_kids_abr/index.m3u8" }
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
  ],
  "bein_sports_1": [
    { label: "Server 1 (Amagi 1080p Broadcast)", url: "https://bein-esp-xumo.amagi.tv/playlistR1080p.m3u8" },
    { label: "Server 2 (CloudFront Backup)", url: "https://dc1644a9jazgj.cloudfront.net/beIN_Sports_Xtra_Espanol.m3u8" }
  ],
  "sky_sports_main_event_hd": [
    { label: "Server 1 (Akamai ClearKey DASH)", url: "https://a122aivottlinear-a.akamaihd.net/OTTB/syd-nitro/live/clients/dash/enc/puehlftk5j/out/v1/f7f0da1ee112481ca0024e6d4dd97f4a/cenc.mpd|clearkey=f3df7843080ae743bf865dc5fdf64c68:567c863bc12eb74788ea74888c042e1b" },
    { label: "Server 2 (Eurosport Motorsport 4K)", url: "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8" }
  ]
};

// Guaranteed Working Live Backups for Automated Failover
export const MOTOGP_BACKUPS = {
  "spotv_2_hd_motogp": "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8",
  "spotv_hd_motogp": "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8",
  "motogp_official_world_feed": "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8",
  "fancode_motogp_live": "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8",
  "tnt_sports_2_hd": "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8",
  "tnt_sports_1_hd": "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8",
  "tnt_sports_3_hd": "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8",
  "tnt_sports_4_hd": "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8"
};
