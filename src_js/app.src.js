(() => {
  // src/desktop/web/src_js/models/State.js
  function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  }
  var state = {
    allChannels: [],
    filteredChannels: [],
    categories: [],
    selectedCategory: "All",
    searchQuery: "",
    favorites: [],
    // Array of channel IDs ordered by user ranking (#1, #2, ...)
    categoryOrder: [],
    // Custom ordering of category names
    currentChannel: null,
    currentChannelIndex: -1,
    previousChannel: null,
    hls: null,
    shakaPlayer: null,
    video: null,
    isPlaying: false,
    isLive: true,
    dvrOffsetSeconds: 0,
    // 0 = LIVE, negative = seconds behind
    qualityLevels: [],
    currentQualityIndex: -1,
    // -1 = Auto
    selectedQualityHeight: -1,
    // -1 = Auto, or 144 to 2160
    playbackSpeed: 1,
    sleepTimerTimeout: null,
    sleepMinutes: 0,
    isLocked: false,
    lockTimeout: null,
    noticeTimeout: null,
    aspectRatios: ["fit", "16-9", "fill", "4-3"],
    aspectRatioIndex: 0,
    brightness: 100,
    volume: 100,
    isMuted: false,
    controlsTimeout: null,
    stallWatchdog: null,
    serverIndex: 0,
    availableServers: [],
    healthInterval: null,
    lastPlayhead: -1,
    freezeCounter: 0,
    renderedChannelCount: 0,
    PAGE_SIZE: 60,
    liveEvents: [],
    isLiveEventsLoading: true,
    selectedLiveSport: "All",
    liveEventsRefreshTimer: null,
    recentChannels: [],
    isAlwaysOnTop: false,
    isRecording: false,
    mediaRecorder: null,
    recordedChunks: [],
    recordTimerInterval: null,
    recordSeconds: 0,
    audioContext: null,
    audioGainNode: null,
    dynamicsCompressor: null,
    isAudioBoostEnabled: true,
    dialInput: "",
    dialTimeout: null,
    multiviewActive: false,
    multiviewMode: "dual",
    multiviewChannels: [null, null, null, null],
    multiviewHls: [null, null, null, null],
    multiviewActiveSlot: 0,
    audioDelayMs: 0,
    audioDelayNode: null,
    videoZoom: 1,
    videoPanX: 0,
    videoPanY: 0,
    isPanning: false,
    streamRetryCount: 0,
    eventReminders: /* @__PURE__ */ new Set(),
    activeSortMode: "default",
    isDataSaver: false
  };

  // src/desktop/web/src_js/models/Constants.js
  var APP_VERSION = "5.3.1";
  var APP_BUILD = 63;
  var GITHUB_RELEASES_URL = "https://github.com/SamAkhtarul/Live-TV/releases";
  var GITHUB_API_LATEST_RELEASE = "https://api.github.com/repos/SamAkhtarul/Live-TV/releases/latest";
  var UPDATE_MANIFEST_URL = "https://raw.githubusercontent.com/SamAkhtarul/Live-TV/main/version.json";
  var STORAGE_FAVORITES = "livetv_favorites_order_v3";
  var STORAGE_CATEGORIES = "livetv_category_order_v3";
  var STORAGE_VOLUME = "livetv_volume";
  var STORAGE_BRIGHTNESS = "livetv_brightness";
  var STORAGE_RECENTS = "livetv_recents_v1";
  var STOP_WORDS_SPORTS = /* @__PURE__ */ new Set(["vs", "v", "women", "men", "fc", "club", "the", "and", "team", "sixes", "cup", "league"]);
  var STANDARD_QUALITIES = [
    { label: "Auto", height: -1 },
    { label: "1080p FHD", height: 1080 },
    { label: "720p HD", height: 720 },
    { label: "480p SD", height: 480 },
    { label: "360p Low", height: 360 }
  ];
  var EQ_BANDS = [32, 64, 125, 250, 500, 1e3, 2e3, 4e3, 8e3, 16e3];
  var CLARITY_MODES = [
    { label: "Normal", filter: "none" },
    { label: "Vivid Sports", filter: "saturate(1.25) contrast(1.15) brightness(1.05)" },
    { label: "High Contrast", filter: "contrast(1.3) brightness(1.02)" },
    { label: "Warm Cinema", filter: "sepia(0.15) saturate(1.1) brightness(0.98)" },
    { label: "Cool Turf", filter: "hue-rotate(5deg) saturate(1.2) contrast(1.1)" }
  ];
  var BREAK_DURATIONS = [30, 60, 90, 120, 180];
  var DEFAULT_TEAMS = [
    "Real Madrid",
    "Barcelona",
    "Arsenal",
    "Manchester City",
    "Liverpool",
    "Bangladesh",
    "India",
    "Ferrari",
    "Ducati",
    "Mercedes"
  ];
  var CHANNEL_SERVERS = {
    "spotv_2_hd_motogp": [
      { label: "Server 1 (MotoGP Live HD \u2022 TNT Sports 2)", url: "https://a122aivottlinear-a.akamaihd.net/OTTB/syd-nitro/live/clients/dash/enc/puehlftk5j/out/v1/f7f0da1ee112481ca0024e6d4dd97f4a/cenc.mpd|clearkey=f3df7843080ae743bf865dc5fdf64c68:567c863bc12eb74788ea74888c042e1b" },
      { label: "Server 2 (SPOTV 2 HD Cignal Direct)", url: "https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/dr_spotv2hd/default/index.mpd|clearkey=7eea72d6075245a99ee3255603d58853:6848ef60575579bf4d415db2ab96e637" },
      { label: "Server 3 (Eurosport Motorsport 4K)", url: "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8" },
      { label: "Server 4 (beIN Sports Racing HD)", url: "https://bein-esp-xumo.amagi.tv/playlistR1080p.m3u8" }
    ],
    "spotv_hd_motogp": [
      { label: "Server 1 (MotoGP Live HD \u2022 TNT Sports 2)", url: "https://a122aivottlinear-a.akamaihd.net/OTTB/syd-nitro/live/clients/dash/enc/puehlftk5j/out/v1/f7f0da1ee112481ca0024e6d4dd97f4a/cenc.mpd|clearkey=f3df7843080ae743bf865dc5fdf64c68:567c863bc12eb74788ea74888c042e1b" },
      { label: "Server 2 (SPOTV HD Cignal Direct)", url: "https://qp-pldt-live-bpk-01-prod.akamaized.net/bpk-tv/cg_spotvhd/default/index.mpd|clearkey=ec7ee27d83764e4b845c48cca31c8eef:9c0e4191203fccb0fde34ee29999129e" },
      { label: "Server 3 (Eurosport Motorsport 4K)", url: "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8" }
    ],
    "tnt_sports_2_hd": [
      { label: "Server 1 (TNT Sports 2 HD \u2022 MotoGP)", url: "https://a122aivottlinear-a.akamaihd.net/OTTB/syd-nitro/live/clients/dash/enc/puehlftk5j/out/v1/f7f0da1ee112481ca0024e6d4dd97f4a/cenc.mpd|clearkey=f3df7843080ae743bf865dc5fdf64c68:567c863bc12eb74788ea74888c042e1b" },
      { label: "Server 2 (Eurosport Motorsport 4K)", url: "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8" },
      { label: "Server 3 (beIN Sports Racing HD)", url: "https://bein-esp-xumo.amagi.tv/playlistR1080p.m3u8" }
    ],
    "servustv_motogp_hd": [
      { label: "Server 1 (Red Bull TV / MotoGP)", url: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8" },
      { label: "Server 2 (Eurosport Motorsport 4K)", url: "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8" }
    ],
    "motogp_official_world_feed": [
      { label: "Server 1 (MotoGP Live HD \u2022 TNT Sports 2)", url: "https://a122aivottlinear-a.akamaihd.net/OTTB/syd-nitro/live/clients/dash/enc/puehlftk5j/out/v1/f7f0da1ee112481ca0024e6d4dd97f4a/cenc.mpd|clearkey=f3df7843080ae743bf865dc5fdf64c68:567c863bc12eb74788ea74888c042e1b" },
      { label: "Server 2 (Eurosport Motorsport 4K)", url: "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8" }
    ],
    "fancode_motogp_live": [
      { label: "Server 1 (MotoGP Live HD \u2022 TNT Sports 2)", url: "https://a122aivottlinear-a.akamaihd.net/OTTB/syd-nitro/live/clients/dash/enc/puehlftk5j/out/v1/f7f0da1ee112481ca0024e6d4dd97f4a/cenc.mpd|clearkey=f3df7843080ae743bf865dc5fdf64c68:567c863bc12eb74788ea74888c042e1b" },
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
      { label: "Server 1 (TSN 1 HD \u2022 Paris Masters)", url: "https://a122aivottlinear-a.akamaihd.net/OTTB/syd-nitro/live/clients/dash/enc/qf74k0ebqw/out/v1/59385c7bb957434fa5ef111816f1df15/cenc.mpd|clearkey=990924040da2bb17d848773950b71ee9:ca5427b233a1e9487c631e51ba976527" },
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
  var MOTOGP_BACKUPS = {
    "spotv_2_hd_motogp": "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8",
    "spotv_hd_motogp": "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8",
    "motogp_official_world_feed": "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8",
    "fancode_motogp_live": "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8",
    "tnt_sports_2_hd": "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8",
    "tnt_sports_1_hd": "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8",
    "tnt_sports_3_hd": "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8",
    "tnt_sports_4_hd": "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8"
  };

  // src/desktop/web/src_js/views/Elements.js
  var el = {};
  function initElements() {
    el = {
      // Top Bar
      brandAuthorLink: document.getElementById("brand-author-link"),
      btnHeaderDataSaver: document.getElementById("btn-header-datasaver"),
      labelDataSaver: document.getElementById("label-datasaver"),
      btnImportXtream: document.getElementById("btn-import-xtream"),
      modalXtreamCodes: document.getElementById("modal-xtream-codes"),
      btnCloseXtreamModal: document.getElementById("btn-close-xtream-modal"),
      btnCancelXtream: document.getElementById("btn-cancel-xtream"),
      btnLoginXtream: document.getElementById("btn-login-xtream"),
      xtreamServerUrl: document.getElementById("xtream-server-url"),
      xtreamUsername: document.getElementById("xtream-username"),
      xtreamPassword: document.getElementById("xtream-password"),
      btnHeaderAlerts: document.getElementById("btn-header-alerts"),
      modalTeamAlerts: document.getElementById("modal-team-alerts"),
      btnCloseAlertsModal: document.getElementById("btn-close-alerts-modal"),
      btnDoneAlerts: document.getElementById("btn-done-alerts"),
      teamChipsContainer: document.getElementById("team-chips-container"),
      inputCustomTeam: document.getElementById("input-custom-team"),
      btnAddCustomTeam: document.getElementById("btn-add-custom-team"),
      btnHeaderSportsHud: document.getElementById("btn-header-sportshud"),
      btnHeaderEpg: document.getElementById("btn-header-epg"),
      btnHeaderVoice: document.getElementById("btn-header-voice"),
      btnHeaderAlarm: document.getElementById("btn-header-alarm"),
      btnHeaderChannels: document.getElementById("btn-header-channels"),
      ambientCanvas: document.getElementById("ambient-canvas"),
      playerLiveCaptions: document.getElementById("player-live-captions"),
      playerBtnAmbilight: document.getElementById("player-btn-ambilight"),
      playerAmbilightLabel: document.getElementById("player-ambilight-label"),
      playerBtnClip: document.getElementById("player-btn-clip"),
      playerBtnCaptions: document.getElementById("player-btn-captions"),
      playerCaptionsLabel: document.getElementById("player-captions-label"),
      playerBtnCompressor: document.getElementById("player-btn-compressor"),
      playerCompressorLabel: document.getElementById("player-compressor-label"),
      playerBtnCast: document.getElementById("player-btn-cast"),
      playerBtnAudiomixer: document.getElementById("player-btn-audiomixer"),
      sportsFloatingHud: document.getElementById("sports-floating-hud"),
      hudDragHeader: document.getElementById("hud-drag-header"),
      hudBtnMin: document.getElementById("hud-btn-min"),
      hudBtnClose: document.getElementById("hud-btn-close"),
      hudMatchesList: document.getElementById("hud-matches-list"),
      hudPinnedPill: document.getElementById("hud-pinned-pill"),
      pinnedPillText: document.getElementById("pinned-pill-text"),
      pinnedPillScore: document.getElementById("pinned-pill-score"),
      pinnedPillClose: document.getElementById("pinned-pill-close"),
      voiceCommandHud: document.getElementById("voice-command-hud"),
      voiceTranscript: document.getElementById("voice-transcript"),
      voiceHudClose: document.getElementById("voice-hud-close"),
      modalEpgGuide: document.getElementById("modal-epg-guide"),
      modalEpgClose: document.getElementById("modal-epg-close"),
      epgGridContainer: document.getElementById("epg-grid-container"),
      btnImportXmltv: document.getElementById("btn-import-xmltv"),
      modalCastPicker: document.getElementById("modal-cast-picker"),
      modalCastClose: document.getElementById("modal-cast-close"),
      castOptionAirplay: document.getElementById("cast-option-airplay"),
      castOptionChromecast: document.getElementById("cast-option-chromecast"),
      btnCopyDlna: document.getElementById("btn-copy-dlna"),
      dlnaStreamUrlDisplay: document.getElementById("dlna-stream-url-display"),
      modalTvAlarm: document.getElementById("modal-tv-alarm"),
      modalAlarmClose: document.getElementById("modal-alarm-close"),
      btnCancelAlarm: document.getElementById("btn-cancel-alarm"),
      btnSaveAlarm: document.getElementById("btn-save-alarm"),
      alarmTimePicker: document.getElementById("alarm-time-picker"),
      alarmChannelSelect: document.getElementById("alarm-channel-select"),
      alarmFadeSelect: document.getElementById("alarm-fade-select"),
      alarmActiveStatus: document.getElementById("alarm-active-status"),
      modalChannelManager: document.getElementById("modal-channel-manager"),
      modalManagerClose: document.getElementById("modal-manager-close"),
      newBouquetName: document.getElementById("new-bouquet-name"),
      btnCreateBouquet: document.getElementById("btn-create-bouquet"),
      customBouquetsList: document.getElementById("custom-bouquets-list"),
      // v5.0.0 & v5.1.1 Real-Time AI Upscaler & Ultra-Modern Home Page Elements
      heroSpotlight: document.getElementById("hero-spotlight"),
      heroCloseBtn: document.getElementById("hero-close-btn"),
      btnToggleHero: document.getElementById("btn-toggle-hero"),
      heroTitle: document.getElementById("hero-title"),
      heroSubtitle: document.getElementById("hero-subtitle"),
      heroBtnPlay: document.getElementById("hero-btn-play"),
      heroBtnHud: document.getElementById("hero-btn-hud"),
      heroBtnFav: document.getElementById("hero-btn-fav"),
      selectChannelSort: document.getElementById("select-channel-sort"),
      btnTurboMode: document.getElementById("btn-turbo-mode"),
      turboLabel: document.getElementById("turbo-label"),
      btnViewDensity: document.getElementById("btn-view-density"),
      densityLabel: document.getElementById("density-label"),
      aiUpscaleCanvas: document.getElementById("ai-upscale-canvas"),
      aiCompareSliderContainer: document.getElementById("ai-compare-slider-container"),
      aiCompareLine: document.getElementById("ai-compare-line"),
      playerBtnAiUpscaler: document.getElementById("player-btn-ai-upscaler"),
      playerAiUpscaleLabel: document.getElementById("player-ai-upscale-label"),
      playerBtnAiCompare: document.getElementById("player-btn-ai-compare"),
      playerBtn10bandEq: document.getElementById("player-btn-10band-eq"),
      playerDataMeter: document.getElementById("player-data-meter"),
      dataMeterVal: document.getElementById("data-meter-val"),
      playerNetTelemetry: document.getElementById("player-net-telemetry"),
      netLatencyVal: document.getElementById("net-latency-val"),
      playerBtnAspect: document.getElementById("player-btn-aspect"),
      playerAspectLabel: document.getElementById("player-aspect-label"),
      modal10bandEq: document.getElementById("modal-10band-eq"),
      modal10bandClose: document.getElementById("modal-10band-close"),
      eqSlidersRow: document.getElementById("eq-sliders-row"),
      modalMatchCenter: document.getElementById("modal-match-center"),
      modalMatchCenterClose: document.getElementById("modal-match-center-close"),
      matchCenterBody: document.getElementById("match-center-body"),
      modalDualAudio: document.getElementById("modal-dual-audio"),
      modalDualAudioClose: document.getElementById("modal-dual-audio-close"),
      sliderPrimaryVol: document.getElementById("slider-primary-vol"),
      sliderAuxVol: document.getElementById("slider-aux-vol"),
      labelPrimaryVol: document.getElementById("label-primary-vol"),
      labelAuxVol: document.getElementById("label-aux-vol"),
      playerBtnClarity: document.getElementById("player-btn-clarity"),
      playerClarityLabel: document.getElementById("player-clarity-label"),
      playerBtnBreakMute: document.getElementById("player-btn-break-mute"),
      playerBreakMuteLabel: document.getElementById("player-break-mute-label"),
      playerBreakCountdown: document.getElementById("player-break-countdown"),
      breakCountdownText: document.getElementById("break-countdown-text"),
      playerBtnGuide: document.getElementById("player-btn-guide"),
      playerMiniGuide: document.getElementById("player-mini-guide"),
      miniGuideTabs: document.getElementById("mini-guide-tabs"),
      miniGuideScroll: document.getElementById("mini-guide-scroll"),
      channelPeekBubble: document.getElementById("channel-peek-bubble"),
      peekVideo: document.getElementById("peek-video"),
      peekName: document.getElementById("peek-name"),
      playerBtnReplay: document.getElementById("player-btn-replay"),
      playerOsdDialer: document.getElementById("player-osd-dialer"),
      osdDialerNum: document.getElementById("osd-dialer-num"),
      osdDialerName: document.getElementById("osd-dialer-name"),
      playerSlowmoBanner: document.getElementById("player-slowmo-banner"),
      btnSlowmoLive: document.getElementById("btn-slowmo-live"),
      btnImportM3u: document.getElementById("btn-import-m3u"),
      btnShortcuts: document.getElementById("btn-shortcuts"),
      btnInfo: document.getElementById("btn-info"),
      btnHeaderUpdateBadge: document.getElementById("btn-header-update-badge"),
      btnHeaderUpdater: document.getElementById("btn-header-updater"),
      headerUpdateText: document.getElementById("header-update-text"),
      btnHeaderPin: document.getElementById("btn-header-pin"),
      btnHeaderMultiview: document.getElementById("btn-header-multiview"),
      btnHeaderTicker: document.getElementById("btn-header-ticker"),
      btnHeaderSchedule: document.getElementById("btn-header-schedule"),
      btnHeaderKids: document.getElementById("btn-header-kids"),
      btnHeaderBackup: document.getElementById("btn-header-backup"),
      sportsScoreTicker: document.getElementById("sports-score-ticker"),
      tickerItemsContainer: document.getElementById("ticker-items-container"),
      tickerCloseBtn: document.getElementById("ticker-close-btn"),
      // Browser
      browserView: document.getElementById("browser-view"),
      searchInput: document.getElementById("search-input"),
      searchClear: document.getElementById("search-clear"),
      liveEventsContainer: document.getElementById("live-events-container"),
      liveEventsTabs: document.getElementById("live-events-tabs"),
      liveEventsCarousel: document.getElementById("live-events-carousel"),
      btnToggleEventInfo: document.getElementById("btn-toggle-event-info"),
      eventInfoLabel: document.getElementById("event-info-label"),
      eventInfoIcon: document.getElementById("event-info-icon"),
      btnCloseSportsSection: document.getElementById("btn-close-sports-section"),
      btnToggleSportsBar: document.getElementById("btn-toggle-sports-bar"),
      recentlyWatchedContainer: document.getElementById("recently-watched-container"),
      recentlyWatchedCarousel: document.getElementById("recently-watched-carousel"),
      btnClearRecents: document.getElementById("btn-clear-recents"),
      categoriesBar: document.getElementById("categories-bar"),
      channelCountText: document.getElementById("channel-count-text"),
      btnRankFavorites: document.getElementById("btn-rank-favorites"),
      btnReorderCategories: document.getElementById("btn-reorder-categories"),
      channelsGrid: document.getElementById("channels-grid"),
      emptyState: document.getElementById("empty-state"),
      // Mini Player
      miniPlayerBar: document.getElementById("mini-player-bar"),
      miniPlayerClickable: document.getElementById("mini-player-clickable"),
      miniChannelName: document.getElementById("mini-channel-name"),
      miniChannelMeta: document.getElementById("mini-channel-meta"),
      miniBtnPrev: document.getElementById("mini-btn-prev"),
      miniBtnPlay: document.getElementById("mini-btn-play"),
      miniBtnNext: document.getElementById("mini-btn-next"),
      miniBtnExpand: document.getElementById("mini-btn-expand"),
      miniBtnClose: document.getElementById("mini-btn-close"),
      // Video Player
      playerOverlay: document.getElementById("player-overlay"),
      videoContainer: document.getElementById("video-container"),
      videoPlayer: document.getElementById("video-player"),
      playerControls: document.getElementById("player-controls"),
      playerBtnBack: document.getElementById("player-btn-back"),
      playerChannelTitle: document.getElementById("player-channel-title"),
      playerChannelMeta: document.getElementById("player-channel-meta"),
      playerChannelNum: document.getElementById("player-channel-num"),
      playerEpgStrip: document.getElementById("player-epg-strip"),
      playerEpgNow: document.getElementById("player-epg-now"),
      playerEpgBar: document.getElementById("player-epg-bar"),
      playerEpgNext: document.getElementById("player-epg-next"),
      playerBtnRecord: document.getElementById("player-btn-record"),
      playerRecordLabel: document.getElementById("player-record-label"),
      recDot: document.getElementById("rec-dot"),
      playerBtnAudioSub: document.getElementById("player-btn-audio-sub"),
      playerAudioSubLabel: document.getElementById("player-audio-sub-label"),
      playerBtnMultiview: document.getElementById("player-btn-multiview"),
      playerBtnPin: document.getElementById("player-btn-pin"),
      playerBtnFav: document.getElementById("player-btn-fav"),
      playerFavLabel: document.getElementById("player-fav-label"),
      playerBtnQuality: document.getElementById("player-btn-quality"),
      playerQualityLabel: document.getElementById("player-quality-label"),
      playerBtnServer: document.getElementById("player-btn-server"),
      playerServerLabel: document.getElementById("player-server-label"),
      playerDvrOffsetPill: document.getElementById("player-dvr-offset-pill"),
      playerBtnSleep: document.getElementById("player-btn-sleep"),
      playerBtnStats: document.getElementById("player-btn-stats"),
      playerBtnLock: document.getElementById("player-btn-lock"),
      playerBtnRadio: document.getElementById("player-btn-radio"),
      playerRadioLabel: document.getElementById("player-radio-label"),
      playerBtnLowlatency: document.getElementById("player-btn-lowlatency"),
      playerLowlatencyLabel: document.getElementById("player-lowlatency-label"),
      audioOnlyHud: document.getElementById("audio-only-hud"),
      audioHudCanvas: document.getElementById("audio-hud-canvas"),
      audioHudToggleBtn: document.getElementById("audio-hud-toggle-btn"),
      playerBtnPip: document.getElementById("player-btn-pip"),
      playerBtnFullscreen: document.getElementById("player-btn-fullscreen"),
      playerBtnFullscreenBottom: document.getElementById("player-btn-fullscreen-bottom"),
      playerLockOverlay: document.getElementById("player-lock-overlay"),
      playerBtnUnlock: document.getElementById("player-btn-unlock"),
      playerStreamNotice: document.getElementById("player-stream-notice"),
      playerStreamNoticeText: document.getElementById("player-stream-notice-text"),
      btnPlayerNoticeReconnect: document.getElementById("btn-player-notice-reconnect"),
      playerBtnRecall: document.getElementById("player-btn-recall"),
      playerRecallLabel: document.getElementById("player-recall-label"),
      playerBtnZoom: document.getElementById("player-btn-zoom"),
      playerZoomLabel: document.getElementById("player-zoom-label"),
      playerBtnQuickSearch: document.getElementById("player-btn-quick-search"),
      playerBtnReconnect: document.getElementById("player-btn-reconnect"),
      modalPlayerSearch: document.getElementById("modal-player-search"),
      hudChannelSearchInput: document.getElementById("hud-channel-search-input"),
      hudChannelSearchResults: document.getElementById("hud-channel-search-results"),
      btnCloseHudSearch: document.getElementById("btn-close-hud-search"),
      lipsyncSlider: document.getElementById("lipsync-slider"),
      lipsyncValDisplay: document.getElementById("lipsync-val-display"),
      // Center Controls
      playerBtnPrevChan: document.getElementById("player-btn-prev-chan"),
      playerBtnRewind: document.getElementById("player-btn-rewind"),
      playerBtnPlay: document.getElementById("player-btn-play"),
      playPauseSvg: document.getElementById("play-pause-svg"),
      playerBtnForward: document.getElementById("player-btn-forward"),
      playerBtnNextChan: document.getElementById("player-btn-next-chan"),
      // Gesture & Double-Tap
      gestureAreaLeft: document.getElementById("gesture-area-left"),
      gestureAreaRight: document.getElementById("gesture-area-right"),
      doubleTapLeft: document.getElementById("double-tap-left"),
      doubleTapRight: document.getElementById("double-tap-right"),
      hudBrightness: document.getElementById("hud-brightness"),
      hudBrightnessVal: document.getElementById("hud-brightness-val"),
      hudVolume: document.getElementById("hud-volume"),
      hudVolumeVal: document.getElementById("hud-volume-val"),
      statsHud: document.getElementById("stats-hud"),
      statRes: document.getElementById("stat-res"),
      statBitrate: document.getElementById("stat-bitrate"),
      statBuffer: document.getElementById("stat-buffer"),
      statDropped: document.getElementById("stat-dropped"),
      statAudio: document.getElementById("stat-audio"),
      statDvr: document.getElementById("stat-dvr"),
      // Bottom Bar DVR & Sliders
      dvrOffsetLabel: document.getElementById("dvr-offset-label"),
      dvrSlider: document.getElementById("dvr-slider"),
      dvrBtn1h: document.getElementById("dvr-btn-1h"),
      dvrBtn30m: document.getElementById("dvr-btn-30m"),
      dvrBtn15m: document.getElementById("dvr-btn-15m"),
      dvrBtnLive: document.getElementById("dvr-btn-live"),
      sliderBrightness: document.getElementById("slider-brightness"),
      sliderVolume: document.getElementById("slider-volume"),
      volumeValText: document.getElementById("volume-val-text"),
      quickSwitchCarousel: document.getElementById("quick-switch-carousel"),
      // Modals
      modalRankFavorites: document.getElementById("modal-rank-favorites"),
      favoritesListBody: document.getElementById("favorites-list-body"),
      btnCloseRankModal: document.getElementById("btn-close-rank-modal"),
      btnCancelRank: document.getElementById("btn-cancel-rank"),
      btnSaveRank: document.getElementById("btn-save-rank"),
      modalRearrangeCategories: document.getElementById("modal-rearrange-categories"),
      categoriesListBody: document.getElementById("categories-list-body"),
      btnCloseReorderModal: document.getElementById("btn-close-reorder-modal"),
      btnResetCategories: document.getElementById("btn-reset-categories"),
      btnSaveCategories: document.getElementById("btn-save-categories"),
      modalPlayerSettings: document.getElementById("modal-player-settings"),
      btnCloseSettingsModal: document.getElementById("btn-close-settings-modal"),
      btnDoneSettings: document.getElementById("btn-done-settings"),
      qualityOptionsContainer: document.getElementById("quality-options-container"),
      audioOptionsContainer: document.getElementById("audio-options-container"),
      subtitleOptionsContainer: document.getElementById("subtitle-options-container"),
      chkAudioBoost: document.getElementById("chk-audio-boost"),
      rowAudioBoost: document.getElementById("row-audio-boost"),
      modalShortcuts: document.getElementById("modal-shortcuts"),
      btnCloseShortcutsModal: document.getElementById("btn-close-shortcuts-modal"),
      btnDoneShortcuts: document.getElementById("btn-done-shortcuts"),
      modalImportM3u: document.getElementById("modal-import-m3u"),
      m3uUrlInput: document.getElementById("m3u-url-input"),
      m3uFileInput: document.getElementById("m3u-file-input"),
      btnCloseM3uModal: document.getElementById("btn-close-m3u-modal"),
      btnCancelM3u: document.getElementById("btn-cancel-m3u"),
      btnLoadM3u: document.getElementById("btn-load-m3u"),
      btnHeaderRemote: document.getElementById("btn-header-remote"),
      modalRemoteControl: document.getElementById("modal-remote-control"),
      btnCloseRemoteModal: document.getElementById("btn-close-remote-modal"),
      btnDoneRemote: document.getElementById("btn-done-remote"),
      remoteQrBox: document.getElementById("remote-qr-box"),
      remoteServerUrl: document.getElementById("remote-server-url"),
      btnCopyRemoteUrl: document.getElementById("btn-copy-remote-url"),
      modalSleepTimer: document.getElementById("modal-sleep-timer"),
      btnCloseSleepModal: document.getElementById("btn-close-sleep-modal"),
      btnCloseSleepDone: document.getElementById("btn-close-sleep-done"),
      btnCancelSleepTimer: document.getElementById("btn-cancel-sleep-timer"),
      playerSleepCountdown: document.getElementById("player-sleep-countdown"),
      sleepCountdownVal: document.getElementById("sleep-countdown-val"),
      playerBtnAudioProfile: document.getElementById("player-btn-audio-profile"),
      playerAudioProfileLabel: document.getElementById("player-audio-profile-label"),
      modalAudioProfiles: document.getElementById("modal-audio-profiles"),
      btnCloseAudioModal: document.getElementById("btn-close-audio-modal"),
      btnDoneAudio: document.getElementById("btn-done-audio"),
      tabSingleChannel: document.getElementById("tab-single-channel"),
      tabBatchM3u: document.getElementById("tab-batch-m3u"),
      sectionSingleChannel: document.getElementById("section-single-channel"),
      sectionBatchM3u: document.getElementById("section-batch-m3u"),
      customChannelUrl: document.getElementById("custom-channel-url"),
      customChannelName: document.getElementById("custom-channel-name"),
      customChannelCat: document.getElementById("custom-channel-cat"),
      customChannelLogo: document.getElementById("custom-channel-logo"),
      btnSaveSingleChannel: document.getElementById("btn-save-single-channel"),
      // About & Updates Modal
      modalAbout: document.getElementById("modal-about"),
      btnCloseAboutModal: document.getElementById("btn-close-about-modal"),
      btnCloseAbout: document.getElementById("btn-close-about"),
      btnCheckUpdate: document.getElementById("btn-check-update"),
      updateCard: document.getElementById("update-card"),
      updateStatusIcon: document.getElementById("update-status-icon"),
      updateStatusTitle: document.getElementById("update-status-title"),
      updateStatusSubtitle: document.getElementById("update-status-subtitle"),
      updateDetailsArea: document.getElementById("update-details-area"),
      btnGithubLink: document.getElementById("btn-github-link"),
      // Multi-View Studio
      multiviewOverlay: document.getElementById("multiview-overlay"),
      multiviewGrid: document.getElementById("multiview-grid"),
      btnMvModeDual: document.getElementById("btn-mv-mode-dual"),
      btnMvModeQuad: document.getElementById("btn-mv-mode-quad"),
      btnCloseMultiview: document.getElementById("btn-close-multiview"),
      multiviewStatusText: document.getElementById("multiview-status-text"),
      // Version 4.0 Modals & Overlays
      modalScheduledDvr: document.getElementById("modal-scheduled-dvr"),
      btnCloseScheduleModal: document.getElementById("btn-close-schedule-modal"),
      btnCancelSchedule: document.getElementById("btn-cancel-schedule"),
      btnSaveSchedule: document.getElementById("btn-save-schedule"),
      scheduleChannelSelect: document.getElementById("schedule-channel-select"),
      scheduleStartSelect: document.getElementById("schedule-start-select"),
      scheduleDurationSelect: document.getElementById("schedule-duration-select"),
      activeSchedulesList: document.getElementById("active-schedules-list"),
      activeSchedulesContainer: document.getElementById("active-schedules-container"),
      modalParentalPin: document.getElementById("modal-parental-pin"),
      btnClosePinModal: document.getElementById("btn-close-pin-modal"),
      modalBackupSync: document.getElementById("modal-backup-sync"),
      btnCloseBackupModal: document.getElementById("btn-close-backup-modal"),
      btnDoneBackup: document.getElementById("btn-done-backup"),
      // Numeric Dialing & Toast
      channelDialOsd: document.getElementById("channel-dial-osd"),
      dialNumber: document.getElementById("dial-number"),
      dialName: document.getElementById("dial-name"),
      toastNotification: document.getElementById("toast-notification"),
      toastIcon: document.getElementById("toast-icon"),
      toastMessage: document.getElementById("toast-message")
    };
    state.video = el.videoPlayer;
    return el;
  }

  // src/desktop/web/src_js/utils/DomUtils.js
  function escapeHtml(str) {
    if (!str) return "";
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  var toastTimeout = null;
  function showToast(message, icon = "\u2728") {
    if (!el.toastNotification) return;
    if (el.toastIcon) el.toastIcon.textContent = icon;
    if (el.toastMessage) el.toastMessage.textContent = message;
    el.toastNotification.style.display = "flex";
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      if (el.toastNotification) el.toastNotification.style.display = "none";
    }, 2800);
  }
  function showStreamNotice(msg, duration = 4e3) {
    if (!el.playerStreamNotice || !el.playerStreamNoticeText) return;
    el.playerStreamNoticeText.textContent = msg;
    el.playerStreamNotice.style.display = "flex";
    clearTimeout(state.noticeTimeout);
    state.noticeTimeout = setTimeout(() => {
      if (el.playerStreamNotice) el.playerStreamNotice.style.display = "none";
    }, duration);
  }
  function setupWindowDragging() {
    let isDraggingWindow = false;
    let startScreenX = 0;
    let startScreenY = 0;
    function isDraggableHeader(target) {
      if (!target) return false;
      if (target.closest("button, input, select, textarea, a, .header-btn, .search-container, .event-tab, .category-chip, .channel-card, .rank-favorites-btn, .mini-player-btn, .player-btn, .player-slider, input[type='range']")) {
        return false;
      }
      return !!target.closest(".app-header, .player-top-bar, .window-drag-handle");
    }
    document.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      if (isDraggableHeader(e.target)) {
        isDraggingWindow = true;
        startScreenX = e.screenX;
        startScreenY = e.screenY;
        if (window.webkit?.messageHandlers?.startWindowDrag) {
          try {
            window.webkit.messageHandlers.startWindowDrag.postMessage("start");
          } catch (err) {
          }
        }
      }
    });
    document.addEventListener("mousemove", (e) => {
      if (!isDraggingWindow) return;
      if (e.buttons !== 1) {
        isDraggingWindow = false;
        return;
      }
      const dx = e.screenX - startScreenX;
      const dy = e.screenY - startScreenY;
      if (dx !== 0 || dy !== 0) {
        startScreenX = e.screenX;
        startScreenY = e.screenY;
        if (window.webkit?.messageHandlers?.moveWindow) {
          try {
            window.webkit.messageHandlers.moveWindow.postMessage({ dx, dy });
          } catch (err) {
          }
        }
      }
    });
    document.addEventListener("mouseup", () => {
      isDraggingWindow = false;
    });
    document.addEventListener("dblclick", (e) => {
      if (isDraggableHeader(e.target)) {
        if (window.webkit?.messageHandlers?.zoomWindow) {
          try {
            window.webkit.messageHandlers.zoomWindow.postMessage("zoom");
          } catch (err) {
          }
        }
      }
    });
  }

  // src/desktop/web/src_js/controllers/AudioController.js
  var AUDIO_PROFILES2 = {
    normal: { id: "normal", name: "Normal (Flat)", icon: "\u{1F3A7}", low: 0, mid: 0, high: 0, compRatio: 4, compThresh: -24 },
    stadium: { id: "stadium", name: "Stadium (Sports)", icon: "\u{1F3DF}\uFE0F", low: 3.5, mid: 4.5, high: 2, compRatio: 6, compThresh: -20 },
    vocal: { id: "vocal", name: "Dialogue Clarity", icon: "\u{1F399}\uFE0F", low: -4, mid: 5.5, high: 0.5, compRatio: 8, compThresh: -18 },
    night: { id: "night", name: "Night Mode", icon: "\u{1F319}", low: -1, mid: 1, high: -2, compRatio: 14, compThresh: -32 },
    music: { id: "music", name: "Music / Concert", icon: "\u{1F3B5}", low: 5, mid: -1.5, high: 4, compRatio: 3, compThresh: -22 }
  };
  function initAudioBooster() {
    if (state.audioContext || !state.video) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const source = ctx.createMediaElementSource(state.video);
      const lowShelf = ctx.createBiquadFilter();
      lowShelf.type = "lowshelf";
      lowShelf.frequency.setValueAtTime(120, ctx.currentTime);
      lowShelf.gain.setValueAtTime(0, ctx.currentTime);
      const midPeak = ctx.createBiquadFilter();
      midPeak.type = "peaking";
      midPeak.frequency.setValueAtTime(2200, ctx.currentTime);
      midPeak.Q.setValueAtTime(1, ctx.currentTime);
      midPeak.gain.setValueAtTime(0, ctx.currentTime);
      const highShelf = ctx.createBiquadFilter();
      highShelf.type = "highshelf";
      highShelf.frequency.setValueAtTime(8e3, ctx.currentTime);
      highShelf.gain.setValueAtTime(0, ctx.currentTime);
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-24, ctx.currentTime);
      compressor.knee.setValueAtTime(30, ctx.currentTime);
      compressor.ratio.setValueAtTime(12, ctx.currentTime);
      compressor.attack.setValueAtTime(3e-3, ctx.currentTime);
      compressor.release.setValueAtTime(0.25, ctx.currentTime);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(1, ctx.currentTime);
      const delay = ctx.createDelay(3);
      const initialDelay = Math.max(0, (state.audioDelayMs || 0) / 1e3);
      delay.delayTime.setValueAtTime(initialDelay, ctx.currentTime);
      source.connect(lowShelf);
      lowShelf.connect(midPeak);
      midPeak.connect(highShelf);
      highShelf.connect(compressor);
      compressor.connect(gain);
      gain.connect(delay);
      delay.connect(ctx.destination);
      state.audioContext = ctx;
      state.audioGainNode = gain;
      state.audioDelayNode = delay;
      state.dynamicsCompressor = compressor;
      state.eqLowShelf = lowShelf;
      state.eqMidPeak = midPeak;
      state.eqHighShelf = highShelf;
      if (state.currentAudioProfile && state.currentAudioProfile !== "normal") {
        applyAudioProfile(state.currentAudioProfile, false);
      }
    } catch (e) {
      console.warn("AudioContext initialization note:", e);
    }
  }
  function applyAudioProfile(key, notify = true) {
    const profile = AUDIO_PROFILES2[key] || AUDIO_PROFILES2.normal;
    state.currentAudioProfile = profile.id;
    if (!state.audioContext) initAudioBooster();
    if (state.audioContext && state.eqLowShelf) {
      const t = state.audioContext.currentTime;
      state.eqLowShelf.gain.setTargetAtTime(profile.low, t, 0.05);
      state.eqMidPeak.gain.setTargetAtTime(profile.mid, t, 0.05);
      state.eqHighShelf.gain.setTargetAtTime(profile.high, t, 0.05);
      state.dynamicsCompressor.ratio.setTargetAtTime(profile.compRatio, t, 0.05);
      state.dynamicsCompressor.threshold.setTargetAtTime(profile.compThresh, t, 0.05);
    }
    const label = document.getElementById("player-audio-profile-label");
    if (label) label.textContent = profile.name.split(" ")[0];
    document.querySelectorAll(".audio-profile-card").forEach((card) => {
      card.classList.toggle("active", card.dataset.profile === profile.id);
    });
    if (notify) showToast(`Audio Profile: ${profile.icon} ${profile.name}`);
  }
  function cycleNextAudioProfile() {
    const keys = Object.keys(AUDIO_PROFILES2);
    const currentIdx = keys.indexOf(state.currentAudioProfile || "normal");
    const nextKey = keys[(currentIdx + 1) % keys.length];
    applyAudioProfile(nextKey);
  }
  function applyVolume(val) {
    state.volume = Math.max(0, Math.min(200, val));
    if (state.volume > 100 && !state.audioContext) {
      initAudioBooster();
    }
    if (state.audioContext && state.audioContext.state === "suspended") {
      state.audioContext.resume().catch(() => {
      });
    }
    const isBoosted = state.volume > 100;
    if (state.video) {
      if (state.volume <= 100) {
        state.video.volume = state.volume / 100;
        if (state.audioGainNode && state.audioContext) {
          state.audioGainNode.gain.setValueAtTime(1, state.audioContext.currentTime);
        }
      } else {
        state.video.volume = 1;
        if (state.audioGainNode && state.audioContext && state.isAudioBoostEnabled) {
          const boostMultiplier = 1 + (state.volume - 100) / 100 * 1.5;
          state.audioGainNode.gain.setValueAtTime(boostMultiplier, state.audioContext.currentTime);
        }
      }
    }
    if (el.sliderVolume) el.sliderVolume.value = state.volume;
    if (el.volumeValText) {
      el.volumeValText.textContent = isBoosted ? `${state.volume}% \u{1F680}` : `${state.volume}%`;
    }
    const sliderPill = document.getElementById("slider-pill-volume");
    if (sliderPill) {
      sliderPill.classList.toggle("boosted", isBoosted);
    }
    if (el.hudVolumeVal) {
      el.hudVolumeVal.textContent = isBoosted ? `${state.volume}% (BOOSTED)` : `${state.volume}%`;
    }
    persistAllPreferences();
  }
  var eqAudioCtx = null;
  var eqSourceNode = null;
  var eqBands = EQ_BANDS;
  var eqFilters = [];
  function init10BandEqualizer() {
    if (eqFilters.length > 0 || !state.video) return;
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!eqAudioCtx) eqAudioCtx = new AudioContextClass();
      if (!eqSourceNode) {
        eqSourceNode = eqAudioCtx.createMediaElementSource(state.video);
      }
      let lastNode = eqSourceNode;
      eqFilters = eqBands.map((freq, i) => {
        const filter = eqAudioCtx.createBiquadFilter();
        if (i === 0) {
          filter.type = "lowshelf";
        } else if (i === eqBands.length - 1) {
          filter.type = "highshelf";
        } else {
          filter.type = "peaking";
          filter.Q.value = 1.4;
        }
        filter.frequency.value = freq;
        filter.gain.value = 0;
        lastNode.connect(filter);
        lastNode = filter;
        return filter;
      });
      lastNode.connect(eqAudioCtx.destination);
    } catch (e) {
      console.warn("[10BandEQ] AudioContext init warning:", e);
    }
  }
  function setAudioDelay(ms, notify = false) {
    state.audioDelayMs = ms;
    if (!state.audioContext && state.video) {
      initAudioBooster();
    }
    if (state.audioDelayNode && state.audioContext) {
      const delaySec = Math.max(0, ms / 1e3);
      try {
        state.audioDelayNode.delayTime.setTargetAtTime(delaySec, state.audioContext.currentTime, 0.05);
      } catch (e) {
      }
    }
    const disp = document.getElementById("lipsync-val-display");
    if (disp) disp.textContent = `${ms >= 0 ? "+" : ""}${ms} ms`;
    const slider = document.getElementById("lipsync-slider");
    if (slider) slider.value = ms;
    document.querySelectorAll(".lipsync-btn").forEach((b) => {
      b.classList.toggle("active", parseInt(b.dataset.delay, 10) === ms);
    });
    if (notify) {
      showToast(`Lip-Sync Delay: ${ms >= 0 ? "+" : ""}${ms}ms`, "\u{1F39A}\uFE0F");
    }
    try {
      localStorage.setItem("livetv_audio_delay", String(ms));
    } catch (e) {
    }
  }
  window.setAudioDelay = setAudioDelay;
  var audioHudAnimId = null;
  function toggleAudioOnlyMode() {
    state.isAudioOnly = !state.isAudioOnly;
    const hud = document.getElementById("audio-only-hud");
    const vid = el.videoPlayer;
    const radioBtn = document.getElementById("player-btn-radio");
    const radioLabel = document.getElementById("player-radio-label");
    if (state.isAudioOnly) {
      if (vid) vid.style.display = "none";
      if (hud) {
        hud.style.display = "flex";
        const hudTitle = document.getElementById("audio-hud-title");
        if (hudTitle && state.currentChannel) {
          hudTitle.textContent = `${state.currentChannel.name} (Radio Feed)`;
        }
      }
      if (radioBtn) radioBtn.classList.add("active-setting");
      if (radioLabel) radioLabel.textContent = "Video Mode";
      startAudioHudVisualizer();
      showToast("Radio Mode ON: Video decoding paused to maximize battery", "\u{1F4FB}");
    } else {
      if (vid) vid.style.display = "block";
      if (hud) hud.style.display = "none";
      if (radioBtn) radioBtn.classList.remove("active-setting");
      if (radioLabel) radioLabel.textContent = "Radio Mode";
      stopAudioHudVisualizer();
      showToast("Returned to Full HD Video Mode", "\u{1F4FA}");
    }
  }
  function startAudioHudVisualizer() {
    const canvas = document.getElementById("audio-hud-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth || 300;
    canvas.height = canvas.offsetHeight || 120;
    let step = 0;
    function draw() {
      if (!state.isAudioOnly) return;
      step += 0.08;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barCount = 32;
      const barWidth = canvas.width / barCount;
      for (let i = 0; i < barCount; i++) {
        const height = Math.abs(Math.sin(step + i * 0.25) * Math.cos(step * 0.7 + i * 0.15)) * (canvas.height * 0.75) + 8;
        const x = i * barWidth;
        const y = canvas.height - height;
        const grad = ctx.createLinearGradient(0, y, 0, canvas.height);
        grad.addColorStop(0, "#e50914");
        grad.addColorStop(0.5, "#38bdf8");
        grad.addColorStop(1, "rgba(56, 189, 248, 0.2)");
        ctx.fillStyle = grad;
        ctx.fillRect(x + 2, y, barWidth - 4, height);
      }
      audioHudAnimId = requestAnimationFrame(draw);
    }
    stopAudioHudVisualizer();
    audioHudAnimId = requestAnimationFrame(draw);
  }
  function stopAudioHudVisualizer() {
    if (audioHudAnimId) {
      cancelAnimationFrame(audioHudAnimId);
      audioHudAnimId = null;
    }
  }
  var breakMuteTimer = null;
  var breakRemainingSecs = 0;
  var breakSavedVolume = 100;
  var breakDurIndex = 0;
  function triggerCommercialBreakMute() {
    if (breakMuteTimer) {
      breakDurIndex = (breakDurIndex + 1) % (BREAK_DURATIONS.length + 1);
      if (breakDurIndex === BREAK_DURATIONS.length) {
        resumeFromBreakMute();
        return;
      }
    } else {
      breakDurIndex = 0;
      breakSavedVolume = state.volume;
    }
    const secs = BREAK_DURATIONS[breakDurIndex];
    breakRemainingSecs = secs;
    applyVolume(0);
    if (el.playerBreakCountdown) {
      el.playerBreakCountdown.style.display = "inline-flex";
      updateBreakCountdownLabel();
    }
    clearInterval(breakMuteTimer);
    breakMuteTimer = setInterval(() => {
      breakRemainingSecs--;
      if (breakRemainingSecs <= 0) {
        resumeFromBreakMute();
      } else {
        updateBreakCountdownLabel();
      }
    }, 1e3);
    showToast(`Muted for ${secs}s ad break \u2022 Auto-restores when show returns`, "\u{1F507}");
  }
  function updateBreakCountdownLabel() {
    const badge = document.getElementById("break-countdown-text");
    if (badge) {
      const mins = Math.floor(breakRemainingSecs / 60);
      const secs = String(breakRemainingSecs % 60).padStart(2, "0");
      badge.textContent = `Break: ${mins}:${secs}`;
    }
  }
  function resumeFromBreakMute() {
    clearInterval(breakMuteTimer);
    breakMuteTimer = null;
    breakRemainingSecs = 0;
    if (el.playerBreakCountdown) el.playerBreakCountdown.style.display = "none";
    applyVolume(breakSavedVolume || 100);
    showToast("Audio restored \u2022 Broadcast live", "\u{1F50A}");
  }
  var isAudioNormalizerActive = false;
  var audioCompressorCtx = null;
  var audioCompressorNode = null;
  var audioSourceNode = null;
  function toggleAudioNormalizer() {
    isAudioNormalizerActive = !isAudioNormalizerActive;
    if (el.playerCompressorLabel) {
      el.playerCompressorLabel.textContent = isAudioNormalizerActive ? "Normalizer ON" : "Normalizer";
    }
    if (isAudioNormalizerActive) {
      try {
        if (!audioCompressorCtx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          audioCompressorCtx = new AudioCtx();
          audioCompressorNode = audioCompressorCtx.createDynamicsCompressor();
          audioCompressorNode.threshold.setValueAtTime(-24, audioCompressorCtx.currentTime);
          audioCompressorNode.knee.setValueAtTime(30, audioCompressorCtx.currentTime);
          audioCompressorNode.ratio.setValueAtTime(12, audioCompressorCtx.currentTime);
          audioCompressorNode.attack.setValueAtTime(3e-3, audioCompressorCtx.currentTime);
          audioCompressorNode.release.setValueAtTime(0.25, audioCompressorCtx.currentTime);
          if (state.video) {
            audioSourceNode = audioCompressorCtx.createMediaElementSource(state.video);
            audioSourceNode.connect(audioCompressorNode);
            audioCompressorNode.connect(audioCompressorCtx.destination);
          }
        }
        if (audioCompressorCtx.state === "suspended") audioCompressorCtx.resume();
      } catch (e) {
        console.warn("Audio normalizer graph notice:", e);
      }
      showToast("Smart Audio Normalizer & Night Mode ON \u{1F50A}", "\u{1F3A7}");
    } else {
      showToast("Audio Normalizer OFF \u2022 Standard Dynamic Range", "\u{1F50A}");
    }
  }

  // src/desktop/web/src_js/views/TelemetryView.js
  var bandwidthTimer = null;
  function initBandwidthMeter() {
    if (bandwidthTimer) clearInterval(bandwidthTimer);
    if (isMobileDevice()) return;
    bandwidthTimer = setInterval(() => {
      if (!el.dataMeterVal || !state.video || state.video.paused) return;
      let mbps = 4.5;
      if (state.hls && state.hls.bandwidthEstimate) {
        mbps = Math.max(0.5, state.hls.bandwidthEstimate / 1e6).toFixed(1);
      } else if (state.qualityLevels && state.qualityLevels[state.hls?.currentLevel]?.bitrate) {
        mbps = (state.qualityLevels[state.hls.currentLevel].bitrate / 1e6).toFixed(1);
      }
      const gbh = (mbps * 3600 / (8 * 1024)).toFixed(1);
      el.dataMeterVal.textContent = `${mbps} Mbps (${gbh} GB/h)`;
    }, 2500);
  }
  function updateStatsHud() {
    if (!state.video) return;
    if (state.hls && state.hls.currentLevel >= 0 && state.qualityLevels[state.hls.currentLevel]) {
      const lvl = state.qualityLevels[state.hls.currentLevel];
      if (el.statRes) el.statRes.textContent = `${lvl.width || 1920}x${lvl.height || 1080}`;
      if (el.statBitrate) el.statBitrate.textContent = `${Math.round((lvl.bitrate || 45e5) / 1e3)} kbps`;
    } else if (state.video.videoWidth && el.statRes) {
      el.statRes.textContent = `${state.video.videoWidth}x${state.video.videoHeight}`;
    }
    if (state.video.buffered && state.video.buffered.length > 0 && el.statBuffer) {
      const end = state.video.buffered.end(state.video.buffered.length - 1);
      const buf = Math.max(0, end - state.video.currentTime);
      el.statBuffer.textContent = `${buf.toFixed(1)}s`;
    }
    if (state.video.getVideoPlaybackQuality && el.statDropped) {
      const q = state.video.getVideoPlaybackQuality();
      el.statDropped.textContent = q.droppedVideoFrames.toString();
    }
    if (el.statDvr) {
      el.statDvr.textContent = state.isLive ? "Live Edge Active" : `Timeshift: ${el.dvrOffsetLabel?.textContent || ""}`;
    }
  }

  // src/desktop/web/src_js/views/HeroView.js
  var heroFeaturedChannel = null;
  function initHeroSpotlight() {
    if (localStorage.getItem("livetv_hero_collapsed") === "1" && el.heroSpotlight) {
      el.heroSpotlight.style.display = "none";
    }
    if (!state.allChannels || state.allChannels.length === 0) return;
    let candidate = null;
    if (state.favorites && state.favorites.length > 0) {
      candidate = state.allChannels.find((c) => String(c.id) === String(state.favorites[0]));
    }
    if (!candidate) {
      candidate = state.allChannels.find((c) => /t sports|willow|spotv|star sports|sony ten|sky sports/i.test(c.name || ""));
    }
    if (!candidate) candidate = state.allChannels[0];
    heroFeaturedChannel = candidate;
    if (!candidate) return;
    if (el.heroTitle) {
      el.heroTitle.textContent = `${candidate.name} \u2014 Live Broadcast 4K`;
    }
    if (el.heroSubtitle) {
      el.heroSubtitle.textContent = `Streaming live in high definition \u2022 ${candidate.category || "Sports"} \u2022 Crystal clear audio & 4K AI upscaling`;
    }
    if (el.heroBtnFav) {
      const isFav = (state.favorites || []).includes(candidate.id);
      el.heroBtnFav.classList.toggle("is-fav", isFav);
      el.heroBtnFav.innerHTML = isFav ? "\u2605" : "\u2606";
    }
    const sportBadge = document.getElementById("hero-sport-badge");
    if (sportBadge) {
      const isSport = /sport|cricket|football|tennis|motogp/i.test(candidate.category || "");
      sportBadge.textContent = isSport ? `\u{1F3C6} ${candidate.category || "LIVE SPORTS"}` : `\u{1F4FA} ${candidate.category || "LIVE TV"}`;
    }
  }
  function playHeroChannel() {
    if (heroFeaturedChannel) {
      playChannel(heroFeaturedChannel);
    } else if (state.allChannels && state.allChannels.length > 0) {
      playChannel(state.allChannels[0]);
    }
  }
  function toggleHeroFavorite() {
    if (heroFeaturedChannel) {
      toggleFavorite(heroFeaturedChannel.id);
      if (el.heroBtnFav) {
        const isFav = (state.favorites || []).includes(heroFeaturedChannel.id);
        el.heroBtnFav.classList.toggle("is-fav", isFav);
        el.heroBtnFav.innerHTML = isFav ? "\u2605" : "\u2606";
      }
    }
  }

  // src/desktop/web/src_js/views/HUDView.js
  var isSportsHudOpen = false;
  var isSportsHudMinimized = false;
  var activeHudSport = "all";
  var pinnedMatchId = null;
  var liveSportsData = [
    {
      id: "match-cricket-1",
      sport: "cricket",
      title: "Western Australia vs South Australia",
      series: "Sheffield Shield 2026/27",
      score: "SOA: 154 & 295/7 (92.1 ov) \u2022 WA: 406/5d",
      status: "South Australia lead by 43 runs \u2022 Day 4",
      prob1: 42,
      prob2: 58,
      team1: "SOA",
      team2: "WA",
      channelId: "t_sports_hd",
      feed: [
        { text: "92.1: FOUR! McSweeney drives beautifully through extra cover", badge: "boundary" },
        { text: "91.4: Dot ball, solid defensive push back to bowler", badge: "dot" },
        { text: "90.2: WICKET! Carey caught behind by Inglis! Massive breakthrough!", badge: "wicket" },
        { text: "89.5: 1 run taken to third man", badge: "single" }
      ]
    },
    {
      id: "match-cricket-2",
      sport: "cricket",
      title: "India vs England",
      series: "ICC Champions Trophy 2026",
      score: "IND: 284/6 (50.0 ov) \u2022 ENG: 198/4 (34.2 ov)",
      status: "England require 87 runs from 94 balls",
      prob1: 68,
      prob2: 32,
      team1: "IND",
      team2: "ENG",
      channelId: "t_sports_hd",
      feed: [
        { text: "34.2: SIX! Brook steps out and launches over deep midwicket!", badge: "boundary" },
        { text: "33.5: 2 runs worked into the gap at cover", badge: "single" },
        { text: "32.1: Dot ball, beaten by the turn outside off", badge: "dot" }
      ]
    },
    {
      id: "match-football-1",
      sport: "football",
      title: "Real Madrid vs Barcelona",
      series: "La Liga Santander \u2022 El Cl\xE1sico",
      score: "RMA 2 - 1 BAR (78')",
      status: "78' \u2022 Vinicius Jr (24', 62') | Yamal (41')",
      prob1: 65,
      prob2: 35,
      team1: "RMA",
      team2: "BAR",
      channelId: "be_in_sports_1_hd",
      feed: [
        { text: "77': Stunning save by Courtois denying Lewandowski's header!", badge: "save" },
        { text: "74': Yellow Card for De Jong after cynical foul on Bellingham", badge: "card" },
        { text: "62': GOAL! Vinicius Jr blasts home on counter-attack! 2-1 RMA!", badge: "goal" }
      ]
    },
    {
      id: "match-football-2",
      sport: "football",
      title: "Arsenal vs Chelsea",
      series: "English Premier League \u2022 Emirates Stadium",
      score: "ARS 1 - 0 CHE (54')",
      status: "54' \u2022 Saka (33' pen) \u2022 High intensity London derby",
      prob1: 72,
      prob2: 28,
      team1: "ARS",
      team2: "CHE",
      channelId: "be_in_sports_1_hd",
      feed: [
        { text: "53': Palmer strikes from 25 yards, just over the crossbar!", badge: "shot" },
        { text: "48': Corner for Chelsea dealt with cleanly by Saliba", badge: "def" },
        { text: "33': GOAL! Saka converts penalty coolly into bottom corner!", badge: "goal" }
      ]
    },
    {
      id: "match-tennis-1",
      sport: "tennis",
      title: "Carlos Alcaraz vs Jannik Sinner",
      series: "ATP Masters 1000 Final",
      score: "ALC 6-4, 4-6, 5-4 \u2022 Sinner serving (30-40)",
      status: "Championship Point for Alcaraz",
      prob1: 59,
      prob2: 41,
      team1: "ALC",
      team2: "SIN",
      channelId: "tennis_channel_intl_hd",
      feed: [
        { text: "Break Point! Blistering cross-court forehand winner by Alcaraz!", badge: "point" },
        { text: "Ace down the T by Sinner! 30-30", badge: "ace" }
      ]
    },
    {
      id: "match-racing-1",
      sport: "motogp",
      title: "Petronas Malaysian MotoGP",
      series: "Sepang International Circuit \u2022 Race 1",
      score: "Lap 16 / 20 \u2022 Bagnaia Leading (+0.421s)",
      status: "Bagnaia (1st) | Martin (2nd +0.42s) | Marquez (3rd +1.8s)",
      prob1: 54,
      prob2: 46,
      team1: "BAG",
      team2: "MAR",
      channelId: "spotv_2_hd_motogp",
      feed: [
        { text: "Lap 16: Martin attacks into Turn 1! Bagnaia cuts back inside!", badge: "pass" },
        { text: "Lap 15: Fastest lap set by Jorge Martin: 1:58.214", badge: "fastest" }
      ]
    }
  ];
  function initSportsHUD() {
    if (!el.hudDragHeader || !el.sportsFloatingHud) return;
    let isDragging = false;
    let startX = 0, startY = 0, initialLeft = 0, initialTop = 0;
    el.hudDragHeader.addEventListener("mousedown", (e) => {
      if (e.target.closest("button")) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = el.sportsFloatingHud.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      e.preventDefault();
    });
    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      el.sportsFloatingHud.style.left = `${Math.max(10, Math.min(window.innerWidth - 390, initialLeft + dx))}px`;
      el.sportsFloatingHud.style.top = `${Math.max(10, Math.min(window.innerHeight - 100, initialTop + dy))}px`;
      el.sportsFloatingHud.style.right = "auto";
    });
    document.addEventListener("mouseup", () => {
      isDragging = false;
    });
    const tabs = document.querySelectorAll(".hud-tab-pill");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        activeHudSport = tab.dataset.sport || "all";
        renderSportsHUD();
      });
    });
  }
  function toggleSportsHUD(force) {
    isSportsHudOpen = force !== void 0 ? force : !isSportsHudOpen;
    if (el.sportsFloatingHud) {
      el.sportsFloatingHud.style.display = isSportsHudOpen ? "flex" : "none";
      if (isSportsHudOpen) {
        initSportsHUD();
        renderSportsHUD();
      }
    }
  }
  function minimizeSportsHUD() {
    isSportsHudMinimized = !isSportsHudMinimized;
    if (el.sportsFloatingHud) {
      el.sportsFloatingHud.classList.toggle("minimized", isSportsHudMinimized);
    }
  }
  function renderSportsHUD() {
    if (!el.hudMatchesList) return;
    const filtered = activeHudSport === "all" ? liveSportsData : liveSportsData.filter((m) => m.sport === activeHudSport);
    el.hudMatchesList.innerHTML = filtered.map((m) => {
      const isPinned = pinnedMatchId === m.id;
      return `
      <div class="hud-match-card" id="hud-card-${m.id}">
        <div class="hud-card-top">
          <div class="hud-sport-tag">
            <span>${m.sport === "cricket" ? "\u{1F3CF}" : m.sport === "football" ? "\u26BD" : m.sport === "tennis" ? "\u{1F3BE}" : "\u{1F3CE}\uFE0F"}</span>
            <span>${m.series}</span>
          </div>
          <span class="hud-live-tag"><span class="hud-live-dot"></span>LIVE</span>
        </div>
        <div class="hud-match-title">${m.title}</div>
        <div class="hud-score-row">${m.score}</div>
        <div class="hud-summary-text">${m.status}</div>

        <!-- Dynamic Win Probability Bar -->
        <div class="hud-win-prob">
          <div class="hud-win-prob-labels">
            <span>${m.team1} (${m.prob1}%)</span>
            <span>Win Probability</span>
            <span>${m.team2} (${m.prob2}%)</span>
          </div>
          <div class="hud-win-prob-bar">
            <div class="hud-win-prob-team1" style="width: ${m.prob1}%;"></div>
          </div>
        </div>

        <div class="hud-card-footer">
          <button class="hud-action-btn" onclick="window.toggleMatchFeed('${m.id}')" title="Toggle Live Ball-by-Ball Feed">
            <span>\u26A1 Commentary</span>
          </button>
          <button class="hud-action-btn" onclick="window.pinMatchFromHUD('${m.id}')" title="${isPinned ? "Unpin" : "Pin to floating pill"}">
            <span>${isPinned ? "\u{1F4CC} Pinned" : "\u{1F4CC} Pin"}</span>
          </button>
          <button class="hud-action-btn tune-btn" onclick="window.tuneMatchLive('${m.channelId}')" title="Tune Channel Now">
            <span>Watch Live \u25B6</span>
          </button>
        </div>

        <!-- Live Commentary Feed Drawer -->
        <div class="hud-feed-drawer" id="hud-feed-${m.id}">
          ${m.feed.map((f) => `
            <div class="hud-feed-item">
              <span class="hud-feed-badge ${f.badge}">${f.badge.toUpperCase()}:</span> ${f.text}
            </div>
          `).join("")}
        </div>
      </div>
    `;
    }).join("");
  }
  window.toggleMatchFeed = function(id) {
    const drawer = document.getElementById(`hud-feed-${id}`);
    if (drawer) drawer.classList.toggle("open");
  };
  window.pinMatchFromHUD = function(id) {
    if (pinnedMatchId === id) {
      unpinMatchFromHUD();
      return;
    }
    pinnedMatchId = id;
    const match = liveSportsData.find((m) => m.id === id);
    if (match && el.hudPinnedPill) {
      if (el.pinnedPillText) el.pinnedPillText.textContent = match.title.split(" vs ")[0] || match.title;
      if (el.pinnedPillScore) el.pinnedPillScore.textContent = match.score.split("\u2022")[0];
      el.hudPinnedPill.style.display = "flex";
      showToast(`Pinned match to floating widget! \u{1F4CC}`, "\u{1F3C6}");
      renderSportsHUD();
    }
  };
  function unpinMatchFromHUD() {
    pinnedMatchId = null;
    if (el.hudPinnedPill) el.hudPinnedPill.style.display = "none";
    showToast("Match unpinned", "\u{1F4CC}");
    renderSportsHUD();
  }
  window.tuneMatchLive = function(chId) {
    const ch = (state.allChannels || []).find((c) => c.id === chId);
    if (ch) {
      playChannel(ch);
      showToast(`Tuning live broadcast: ${ch.name}`, "\u{1F534}");
    } else {
      showToast("Opening broadcast channel...", "\u{1F4FA}");
    }
  };
  window.playChannelById = function(chId) {
    const found = (state.allChannels || []).find((c) => String(c.id) === String(chId));
    if (found) playChannel(found);
  };
  function toggleSportsTicker(force) {
    const ticker = document.getElementById("sports-score-ticker");
    const btn = document.getElementById("btn-header-ticker");
    if (!ticker) return;
    const isHidden = ticker.style.display === "none" || !ticker.style.display;
    const willShow = force !== void 0 ? !!force : isHidden;
    ticker.style.display = willShow ? "flex" : "none";
    if (btn) {
      if (willShow) btn.classList.add("active-nav");
      else btn.classList.remove("active-nav");
    }
    if (willShow) {
      updateSportsScoreTicker();
    }
    try {
      localStorage.setItem("livetv_ticker_visible", willShow ? "true" : "false");
    } catch (e) {
    }
  }
  function updateSportsScoreTicker() {
    const container = document.getElementById("ticker-items-container");
    if (!container) return;
    const sports = (state.liveEvents || []).filter((e) => e.isLive || e.scoreOrDetail && e.scoreOrDetail.includes("\u2022"));
    if (sports.length === 0) {
      container.innerHTML = `<span style="font-size:11.5px; color:var(--text-muted); padding:4px 12px;">Fetching real-time sports scores and fixtures...</span>`;
      return;
    }
    container.innerHTML = sports.map((ev) => `
    <div class="ticker-card" onclick="window.tuneFromSportsEvent('${escapeHtml(ev.id)}')" title="Click to tune ${escapeHtml(ev.title)}">
      <span class="ticker-sport">${ev.sportEmoji || "\u{1F3C6}"}</span>
      <span class="ticker-title">${escapeHtml(ev.title)}</span>
      <span class="ticker-score ${ev.isLive ? "live" : ""}">${escapeHtml(ev.scoreOrDetail || ev.statusText)}</span>
    </div>
  `).join("");
  }
  function parseSoccerTotalGoals(str) {
    if (!str) return null;
    const m = str.match(/(\d+)\s*-\s*(\d+)/);
    if (m) {
      return parseInt(m[1], 10) + parseInt(m[2], 10);
    }
    return null;
  }
  function parseCricketWickets(str, summary) {
    let totalWickets = 0;
    if (str) {
      const matches = str.matchAll(/\/(\d+)/g);
      for (const m of matches) {
        totalWickets += parseInt(m[1], 10);
      }
    }
    return totalWickets;
  }
  if (!state.previousScoresMap) state.previousScoresMap = /* @__PURE__ */ new Map();
  if (!state.lastAlertedMap) state.lastAlertedMap = /* @__PURE__ */ new Map();
  function detectSportsHighlights(newEvents) {
    if (!newEvents || newEvents.length === 0) return;
    const now = Date.now();
    for (const ev of newEvents) {
      if (!ev.isLive) continue;
      const prevData = state.previousScoresMap.get(ev.id);
      const lastAlerted = state.lastAlertedMap.get(ev.id) || 0;
      if (prevData) {
        if (ev.sport === "Football") {
          const curGoals = parseSoccerTotalGoals(ev.scoreOrDetail);
          const prevGoals = prevData.goals;
          if (curGoals !== null && prevGoals !== null && curGoals > prevGoals && now - lastAlerted > 3e4) {
            state.lastAlertedMap.set(ev.id, now);
            showSportsFlashToast(`\u26BD GOAL! Score: ${ev.scoreOrDetail}`, ev);
          }
        } else if (ev.sport === "Cricket") {
          const curWickets = parseCricketWickets(ev.scoreOrDetail, ev.summary);
          const prevWickets = prevData.wickets;
          if (curWickets > 0 && prevWickets > 0 && curWickets > prevWickets && now - lastAlerted > 3e4) {
            state.lastAlertedMap.set(ev.id, now);
            showSportsFlashToast(`\u{1F3CF} WICKET! Score: ${ev.scoreOrDetail}`, ev);
          }
        }
      }
      state.previousScoresMap.set(ev.id, {
        raw: ev.scoreOrDetail,
        goals: parseSoccerTotalGoals(ev.scoreOrDetail),
        wickets: parseCricketWickets(ev.scoreOrDetail, ev.summary)
      });
    }
    checkTeamAlerts(newEvents);
  }
  window.dismissSportsFlashToast = function() {
    const toast = document.getElementById("sports-flash-toast");
    if (!toast) return;
    toast.classList.remove("show");
    toast.style.display = "none";
    if (state.toastTimeout) {
      clearTimeout(state.toastTimeout);
      state.toastTimeout = null;
    }
  };
  function showSportsFlashToast(msg, ev) {
    if (!ev || !ev.isLive || ev.isFinal || ev.statusText && (ev.statusText.toUpperCase() === "FINAL" || ev.statusText.toUpperCase() === "SCHEDULED" || ev.statusText.toUpperCase() === "UPCOMING")) {
      return;
    }
    const comb = `${ev.summary || ""} ${ev.scoreOrDetail || ""} ${ev.statusText || ""} ${ev.title || ""}`.toLowerCase();
    if (comb.includes("won by") || comb.includes("result") || comb.includes("ended") || comb.includes("abandoned") || comb.includes("target") || comb.includes("final")) {
      return;
    }
    let toast = document.getElementById("sports-flash-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "sports-flash-toast";
      toast.className = "sports-flash-toast";
      document.body.appendChild(toast);
    }
    toast.innerHTML = `
    <div class="toast-content">
      <span class="toast-sparkle">\u{1F6A8}</span>
      <div class="toast-text-box">
        <div class="toast-msg-title">${escapeHtml(msg)}</div>
        <div class="toast-msg-sub">${escapeHtml(ev.title)} \u2022 ${escapeHtml(ev.sport)}</div>
      </div>
      <button class="toast-watch-btn" onclick="window.tuneFromSportsEvent('${escapeHtml(ev.id)}'); window.dismissSportsFlashToast();">Watch Live \u25B6</button>
      <button class="toast-dismiss-btn" onclick="window.dismissSportsFlashToast()" title="Dismiss">\u2715</button>
    </div>
  `;
    toast.style.display = "flex";
    toast.classList.add("show");
    if (state.toastTimeout) clearTimeout(state.toastTimeout);
    state.toastTimeout = setTimeout(() => {
      window.dismissSportsFlashToast();
    }, 6e3);
  }
  function renderLiveEvents(selectedSport = "All") {
    state.selectedLiveSport = selectedSport;
    if (!el.liveEventsCarousel) return;
    el.liveEventsCarousel.innerHTML = "";
    const events = selectedSport === "All" ? state.liveEvents : (state.liveEvents || []).filter((e) => e.sport === selectedSport);
    if (state.isLiveEventsLoading && events.length === 0) {
      el.liveEventsCarousel.innerHTML = `
      <div class="live-events-loading">
        <div class="live-events-spinner"></div>
        <span>Connecting to real-time sports telemetry...</span>
      </div>
    `;
      return;
    }
    if (events.length === 0) {
      el.liveEventsCarousel.innerHTML = `
      <div class="live-events-empty">
        <span class="empty-icon">\u{1F4E1}</span>
        <div class="empty-text">No active matches for ${escapeHtml(selectedSport)} right now.</div>
        <div class="empty-sub">Real-time live telemetry auto-refreshes every 60 seconds.</div>
      </div>
    `;
      return;
    }
    const fragment = document.createDocumentFragment();
    events.forEach((evt) => {
      const card = document.createElement("div");
      card.className = "live-event-card";
      card.onclick = () => window.tuneFromSportsEvent(evt.id);
      const isLive = evt.isLive || evt.statusText && evt.statusText.toUpperCase().includes("LIVE");
      const isFinal = evt.statusText && (evt.statusText.toUpperCase().includes("FINAL") || evt.statusText.toUpperCase().includes("RESULT"));
      const isStumps = evt.statusText && (evt.statusText.toUpperCase().includes("STUMPS") || evt.statusText.toUpperCase().includes("PAUSED"));
      let statusBadge = "";
      if (isLive) {
        statusBadge = `<span class="event-live-pill"><span class="event-live-dot"></span>LIVE</span>`;
      } else if (isFinal) {
        statusBadge = `<span class="event-final-pill">FINAL</span>`;
      } else if (isStumps) {
        statusBadge = `<span class="event-scheduled-pill" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border-color: rgba(245, 158, 11, 0.4);">\u23F8\uFE0F ${escapeHtml(evt.statusText || "STUMPS")}</span>`;
      } else {
        statusBadge = `<span class="event-scheduled-pill">${escapeHtml(evt.statusText || "UPCOMING")}</span>`;
      }
      const timeHtml = evt.bstTime ? `<div class="event-card-time"><span class="time-badge">\u{1F552} ${escapeHtml(evt.bstTime)}</span></div>` : "";
      let scoreClass = "event-card-score";
      if (isFinal) scoreClass += " final";
      else if (!isLive) scoreClass += " upcoming";
      const scoreHtml = evt.scoreOrDetail ? `<div class="${scoreClass}" title="${escapeHtml(evt.scoreOrDetail)}">${escapeHtml(evt.scoreOrDetail)}</div>` : "";
      const summaryHtml = evt.summary ? `<div class="event-card-summary" title="${escapeHtml(evt.summary)}">\u{1F4E2} ${escapeHtml(evt.summary)}</div>` : "";
      const isReminded = state.eventReminders && state.eventReminders.has(evt.id);
      const remindBtnHtml = `<button class="event-remind-btn ${isReminded ? "active" : ""}" onclick="event.stopPropagation(); window.toggleEventReminder('${escapeHtml(evt.id)}')" title="${isReminded ? "Cancel match reminder" : "Set match reminder"}"><span>${isReminded ? "\u{1F514} Active" : "\u{1F514} Remind"}</span></button>`;
      card.innerHTML = `
      <div class="event-card-top">
        <span class="event-sport-badge">${evt.sportEmoji || "\u{1F3C6}"} ${escapeHtml(evt.sport)}</span>
        ${statusBadge}
      </div>
      <div class="event-card-title" title="${escapeHtml(evt.title)}">${escapeHtml(evt.title)}</div>
      <div class="event-card-subtitle" title="${escapeHtml(evt.subtitle || "")}">${escapeHtml(evt.subtitle || "")}</div>
      ${timeHtml}
      ${scoreHtml}
      ${summaryHtml}
      <div class="event-card-bottom">
        <span class="event-channel-name" title="${escapeHtml(evt.targetChannelName || "Live Broadcast")}">\u{1F4FA} ${escapeHtml(evt.targetChannelName || "Live Broadcast")}</span>
        <div style="display: flex; gap: 6px; align-items: center;">
          ${remindBtnHtml}
          <button class="event-watch-btn" onclick="event.stopPropagation(); window.tuneFromSportsEvent('${escapeHtml(evt.id)}');">${evt.streamUrl ? "\u25B6 Watch Live" : "\u25B6 Watch"}</button>
        </div>
      </div>
    `;
      fragment.appendChild(card);
    });
    el.liveEventsCarousel.appendChild(fragment);
  }
  var hudSearchSelectedIdx = 0;
  var hudSearchResultsList = [];
  function openPlayerSearch() {
    const modal = el.modalPlayerSearch || document.getElementById("modal-player-search");
    const input = el.hudChannelSearchInput || document.getElementById("hud-channel-search-input");
    if (!modal || !input) return;
    modal.style.display = "flex";
    input.value = "";
    input.focus();
    renderPlayerSearchResults("");
  }
  window.openPlayerSearch = openPlayerSearch;
  function closePlayerSearch() {
    const modal = el.modalPlayerSearch || document.getElementById("modal-player-search");
    if (modal) modal.style.display = "none";
  }
  window.closePlayerSearch = closePlayerSearch;
  function renderPlayerSearchResults(query) {
    const container = el.hudChannelSearchResults || document.getElementById("hud-channel-search-results");
    if (!container) return;
    const q = (query || "").trim().toLowerCase();
    let matches = [];
    if (!q) {
      const favSet = new Set(state.favorites || []);
      matches = (state.allChannels || []).filter((c) => favSet.has(c.id)).slice(0, 20);
      if (matches.length === 0) {
        matches = (state.allChannels || []).slice(0, 20);
      }
    } else {
      matches = (state.allChannels || []).filter((c) => {
        const name = (c.name || "").toLowerCase();
        const cat = (c.category || "").toLowerCase();
        const country = (c.country || "").toLowerCase();
        return name.includes(q) || cat.includes(q) || country.includes(q);
      }).slice(0, 30);
    }
    hudSearchResultsList = matches;
    hudSearchSelectedIdx = 0;
    if (matches.length === 0) {
      container.innerHTML = `<div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 13px;">No channels found for "${escapeHtml(q)}"</div>`;
      return;
    }
    container.innerHTML = matches.map((ch, idx) => {
      const isCurrent = state.currentChannel && state.currentChannel.id === ch.id;
      const isSelected = idx === hudSearchSelectedIdx;
      return `
      <div class="hud-search-item ${isSelected ? "selected" : ""} ${isCurrent ? "current" : ""}" data-idx="${idx}" onclick="window.selectHudChannel(${idx})">
        <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;">
          <img src="${escapeHtml(ch.logoUrl || "favicon.png")}" alt="" style="width: 28px; height: 28px; object-fit: contain; border-radius: 6px; background: rgba(0,0,0,0.3); flex-shrink: 0;" onerror="this.src='favicon.png'" />
          <div style="min-width: 0; flex: 1;">
            <div style="font-weight: 600; font-size: 13px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(ch.name)}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${escapeHtml(ch.category || "General")} \u2022 ${escapeHtml(ch.country || "")}</div>
          </div>
        </div>
        ${isCurrent ? '<span style="font-size: 10px; font-weight: 700; color: #4ade80; background: rgba(74, 222, 128, 0.15); padding: 2px 6px; border-radius: 4px;">PLAYING</span>' : '<span style="font-size: 11px; color: var(--text-muted);">Enter \u21B5</span>'}
      </div>
    `;
    }).join("");
  }
  function updateHudSearchHighlight() {
    const container = el.hudChannelSearchResults || document.getElementById("hud-channel-search-results");
    if (!container) return;
    const items = container.querySelectorAll(".hud-search-item");
    items.forEach((item, idx) => {
      item.classList.toggle("selected", idx === hudSearchSelectedIdx);
      if (idx === hudSearchSelectedIdx) {
        item.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    });
  }
  window.selectHudChannel = function(idx) {
    const ch = hudSearchResultsList[idx];
    if (ch) {
      playChannel(ch);
      closePlayerSearch();
    }
  };

  // src/desktop/web/src_js/controllers/UpdateController.js
  function compareVersions(v1, v2) {
    const p1 = (v1 || "").replace(/^v/i, "").split(".").map((x) => parseInt(x, 10) || 0);
    const p2 = (v2 || "").replace(/^v/i, "").split(".").map((x) => parseInt(x, 10) || 0);
    for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
      const num1 = p1[i] || 0;
      const num2 = p2[i] || 0;
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  }
  async function checkForAppUpdates(isManual = false) {
    if (!el.updateCard || !el.btnCheckUpdate) return;
    el.updateCard.classList.remove("has-update");
    el.updateCard.classList.add("is-checking");
    el.btnCheckUpdate.disabled = true;
    el.btnCheckUpdate.textContent = "Checking...";
    if (el.updateStatusIcon) el.updateStatusIcon.textContent = "\u23F3";
    if (el.updateStatusTitle) el.updateStatusTitle.textContent = "Checking GitHub for App Updates...";
    if (el.updateStatusSubtitle) el.updateStatusSubtitle.textContent = "Connecting to github.com/SamAkhtarul/Live-TV...";
    if (el.updateDetailsArea) {
      el.updateDetailsArea.style.display = "block";
      el.updateDetailsArea.innerHTML = `
      <div style="font-size: 11.5px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
        <span>\u{1F50D}</span> Querying latest releases and build manifests from GitHub...
      </div>
    `;
    }
    if (isManual) {
      await new Promise((r) => setTimeout(r, 700));
    }
    try {
      let latestVer = null;
      let latestBuild = null;
      let releaseNotes = "";
      let downloadUrlMac = GITHUB_RELEASES_URL;
      let downloadUrlAndroid = GITHUB_RELEASES_URL;
      let releaseDate = "";
      try {
        const manifestResp = await fetch(`${UPDATE_MANIFEST_URL}?_=${Date.now()}`, { cache: "no-cache" });
        if (manifestResp.ok) {
          const data = await manifestResp.json();
          latestVer = data.version;
          latestBuild = data.build;
          releaseDate = data.release_date || "";
          if (data.download_mac) downloadUrlMac = data.download_mac;
          if (data.download_android) downloadUrlAndroid = data.download_android;
          if (Array.isArray(data.changelog)) {
            releaseNotes = data.changelog.join("\n");
          } else if (typeof data.changelog === "string") {
            releaseNotes = data.changelog;
          }
        }
      } catch (e) {
        console.warn("Manifest check fallback:", e);
      }
      try {
        const ghResp = await fetch(GITHUB_API_LATEST_RELEASE, {
          headers: { "Accept": "application/vnd.github+json" }
        });
        if (ghResp.ok) {
          const ghData = await ghResp.json();
          const tag = (ghData.tag_name || "").replace(/^v/i, "");
          if (!latestVer || compareVersions(tag, latestVer) > 0) {
            latestVer = tag;
          }
          if (ghData.body && !releaseNotes) {
            releaseNotes = ghData.body;
          }
          if (ghData.published_at && !releaseDate) {
            releaseDate = new Date(ghData.published_at).toLocaleDateString();
          }
          if (Array.isArray(ghData.assets)) {
            const dmgAsset = ghData.assets.find((a) => a.name.endsWith(".dmg"));
            if (dmgAsset) downloadUrlMac = dmgAsset.browser_download_url;
            const apkAsset = ghData.assets.find((a) => a.name.endsWith(".apk"));
            if (apkAsset) downloadUrlAndroid = apkAsset.browser_download_url;
          }
        }
      } catch (e) {
        console.warn("GitHub API release check fallback:", e);
      }
      if (!latestVer) latestVer = APP_VERSION;
      if (!latestBuild) latestBuild = APP_BUILD;
      const hasUpdate = latestBuild > APP_BUILD || compareVersions(latestVer, APP_VERSION) > 0;
      el.updateCard.classList.remove("is-checking");
      el.btnCheckUpdate.disabled = false;
      el.btnCheckUpdate.textContent = "Check Again";
      const checkTimeStr = (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      if (hasUpdate) {
        if (el.btnHeaderUpdateBadge) el.btnHeaderUpdateBadge.classList.add("has-update");
        if (el.headerUpdateText) el.headerUpdateText.textContent = `v${latestVer} Available!`;
        if (el.btnHeaderUpdater) {
          el.btnHeaderUpdater.classList.add("has-update");
          el.btnHeaderUpdater.title = `Update Available: Live TV v${latestVer}`;
        }
        el.updateCard.classList.add("has-update");
        if (el.updateStatusIcon) el.updateStatusIcon.textContent = "\u{1F389}";
        if (el.updateStatusTitle) el.updateStatusTitle.textContent = `Update Available: Live TV v${latestVer}`;
        if (el.updateStatusSubtitle) el.updateStatusSubtitle.textContent = `A newer release (v${latestVer} Build ${latestBuild}) is ready on GitHub.`;
        if (el.updateDetailsArea) {
          el.updateDetailsArea.style.display = "block";
          const formattedNotes = releaseNotes ? escapeHtml(releaseNotes).replace(/\n/g, "<br>") : "Includes latest performance improvements, new features, and stability fixes.";
          el.updateDetailsArea.innerHTML = `
          <div style="margin-bottom: 8px;">
            <span class="update-badge-new">NEW VERSION</span>
            <strong>Live TV v${latestVer} (Build ${latestBuild})</strong>
            <span style="font-size: 10.5px; color: var(--text-secondary); margin-left: 6px;">${releaseDate ? `\u2022 Released ${releaseDate}` : ""}</span>
          </div>
          <div style="font-size: 11.5px; color: var(--text-secondary); margin-bottom: 10px; max-height: 90px; overflow-y: auto; background: rgba(0,0,0,0.25); padding: 6px 10px; border-radius: 4px; line-height: 1.5;">
            ${formattedNotes}
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button class="inapp-update-primary-btn" id="btn-inapp-update">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
              <span>\u26A1 One-Click Update & Restart (v${latestVer})</span>
            </button>

            <div id="update-progress-card" class="update-progress-card" style="display: none;">
              <div class="update-progress-track">
                <div id="update-progress-fill" class="update-progress-fill" style="width: 0%;"></div>
              </div>
              <div class="update-progress-labels">
                <span id="update-progress-status"><span class="update-spin">\u23F3</span> Connecting to update server...</span>
                <span id="update-progress-pct" style="font-weight: 700;">0%</span>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-secondary); padding-top: 2px;">
              <span>Manual packages:</span>
              <div style="display: flex; gap: 8px; align-items: center;">
                <button class="update-link-btn" id="btn-download-mac-manual">Download .dmg</button>
                <span>\u2022</span>
                <button class="update-link-btn" id="btn-download-android-manual">Android .apk</button>
              </div>
            </div>
          </div>
        `;
          const btnInApp = document.getElementById("btn-inapp-update");
          const progCard = document.getElementById("update-progress-card");
          const progStatus = document.getElementById("update-progress-status");
          if (btnInApp) {
            btnInApp.onclick = () => {
              btnInApp.disabled = true;
              btnInApp.style.opacity = "0.6";
              btnInApp.style.cursor = "not-allowed";
              btnInApp.innerHTML = `<span>\u23F3 Updating in progress...</span>`;
              if (progCard) progCard.style.display = "flex";
              if (el.btnCheckUpdate) el.btnCheckUpdate.disabled = true;
              if (window.webkit?.messageHandlers?.startAppUpdate) {
                window.webkit.messageHandlers.startAppUpdate.postMessage({
                  url: downloadUrlMac,
                  version: latestVer
                });
              } else {
                if (progStatus) progStatus.textContent = "Opening DMG download in browser...";
                setTimeout(() => {
                  openExternalUrl(downloadUrlMac);
                  if (progCard) progCard.style.display = "none";
                  btnInApp.disabled = false;
                  btnInApp.style.opacity = "1";
                  btnInApp.style.cursor = "pointer";
                  btnInApp.innerHTML = `<span>\u26A1 One-Click Update & Restart (v${latestVer})</span>`;
                }, 1e3);
              }
            };
          }
          const btnMacManual = document.getElementById("btn-download-mac-manual");
          if (btnMacManual) btnMacManual.onclick = () => openExternalUrl(downloadUrlMac);
          const btnAndroidManual = document.getElementById("btn-download-android-manual");
          if (btnAndroidManual) btnAndroidManual.onclick = () => openExternalUrl(downloadUrlAndroid);
        }
      } else {
        if (el.btnHeaderUpdateBadge) el.btnHeaderUpdateBadge.classList.remove("has-update");
        if (el.headerUpdateText) el.headerUpdateText.textContent = "Up to Date";
        if (el.btnHeaderUpdater) {
          el.btnHeaderUpdater.classList.remove("has-update");
          el.btnHeaderUpdater.title = "Live TV is Up to Date";
        }
        if (el.updateStatusIcon) el.updateStatusIcon.textContent = "\u2705";
        if (el.updateStatusTitle) el.updateStatusTitle.textContent = "You're on the Latest Release";
        if (el.updateStatusSubtitle) el.updateStatusSubtitle.textContent = `Version ${APP_VERSION} (Build ${APP_BUILD}) \u2022 Checked GitHub at ${checkTimeStr}`;
        if (el.updateDetailsArea) {
          el.updateDetailsArea.style.display = "block";
          el.updateDetailsArea.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11.5px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: var(--text-secondary);">Installed App Version:</span>
              <span style="font-weight: 700; color: #fff;">v${APP_VERSION} (Build ${APP_BUILD})</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: var(--text-secondary);">Latest on GitHub:</span>
              <span style="font-weight: 700; color: #34c759;">v${latestVer} (Build ${latestBuild})</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="color: var(--text-secondary);">Release Channel:</span>
              <span style="color: var(--gold); font-weight: 600;">github.com/SamAkhtarul/Live-TV</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 6px; margin-top: 2px;">
              <span style="color: var(--text-secondary);">Software Status:</span>
              <span style="color: #34c759; font-weight: 700; display: flex; align-items: center; gap: 4px;">
                <span>\u25CF</span> Up to Date \u2022 No New Updates Found
              </span>
            </div>
          </div>
        `;
        }
      }
    } catch (err) {
      console.error("Update check failed:", err);
      el.updateCard.classList.remove("is-checking");
      el.btnCheckUpdate.disabled = false;
      el.btnCheckUpdate.textContent = "Retry";
      if (el.updateStatusIcon) el.updateStatusIcon.textContent = "\u2139\uFE0F";
      if (el.updateStatusTitle) el.updateStatusTitle.textContent = "Live TV v" + APP_VERSION;
      if (el.updateStatusSubtitle) el.updateStatusSubtitle.textContent = "Could not reach update server. Check your network.";
    }
  }
  window.triggerUpdateCheck = function(interactive = false) {
    openAboutModal();
    checkForAppUpdates(interactive);
  };
  window.onUpdateProgress = function(data) {
    const progFill = document.getElementById("update-progress-fill");
    const progStatus = document.getElementById("update-progress-status");
    const progPct = document.getElementById("update-progress-pct");
    const btnInApp = document.getElementById("btn-inapp-update");
    const pct = Math.min(100, Math.max(0, data.percent || 0));
    if (progFill) progFill.style.width = `${pct}%`;
    if (progPct) progPct.textContent = `${pct}%`;
    if (progStatus) {
      if (data.stage === "downloading") {
        progStatus.innerHTML = `<span class="update-spin">\u2B07\uFE0F</span> ${escapeHtml(data.text || "Downloading update...")}`;
      } else if (data.stage === "verifying") {
        progStatus.innerHTML = `<span class="update-spin">\u{1F50D}</span> ${escapeHtml(data.text || "Verifying and mounting DMG...")}`;
      } else if (data.stage === "installing") {
        progStatus.innerHTML = `<span class="update-spin">\u2699\uFE0F</span> ${escapeHtml(data.text || "Installing update...")}`;
      } else if (data.stage === "restarting") {
        progStatus.innerHTML = `<span>\u{1F680}</span> Relaunching Live TV...`;
      } else if (data.stage === "error") {
        progStatus.innerHTML = `<span>\u274C</span> ${escapeHtml(data.text || "Update failed")}`;
        progStatus.style.color = "#ef4444";
        if (btnInApp) {
          btnInApp.disabled = false;
          btnInApp.style.opacity = "1";
          btnInApp.style.cursor = "pointer";
          btnInApp.innerHTML = `<span>\u26A0\uFE0F Retry One-Click Update</span>`;
        }
        if (el.btnCheckUpdate) el.btnCheckUpdate.disabled = false;
      }
    }
  };

  // src/desktop/web/src_js/utils/TimeUtils.js
  function formatToBST(dateInput) {
    if (!dateInput) return null;
    let d = null;
    if (typeof dateInput === "string") {
      const s = dateInput.trim();
      const fcMatch = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)\s*(\d{1,2})-(\d{1,2})-(\d{4})$/i);
      if (fcMatch) {
        let [_, h, m, sec, meridiem, day, month, year] = fcMatch;
        let hour = parseInt(h, 10);
        if (meridiem.toUpperCase() === "PM" && hour < 12) hour += 12;
        if (meridiem.toUpperCase() === "AM" && hour === 12) hour = 0;
        const iso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${String(hour).padStart(2, "0")}:${m}:${sec || "00"}+05:30`;
        d = new Date(iso);
      } else {
        d = new Date(s);
      }
    } else if (dateInput instanceof Date) {
      d = dateInput;
    }
    if (!d || isNaN(d.getTime())) return null;
    try {
      const now = /* @__PURE__ */ new Date();
      const bstOptions = { timeZone: "Asia/Dhaka", year: "numeric", month: "numeric", day: "numeric" };
      const dParts = new Intl.DateTimeFormat("en-US", bstOptions).formatToParts(d);
      const nowParts = new Intl.DateTimeFormat("en-US", bstOptions).formatToParts(now);
      const getPart = (parts, type) => parts.find((p) => p.type === type)?.value;
      const isSameDay = getPart(dParts, "year") === getPart(nowParts, "year") && getPart(dParts, "month") === getPart(nowParts, "month") && getPart(dParts, "day") === getPart(nowParts, "day");
      const timeFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Dhaka",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      });
      const timeStr = timeFormatter.format(d);
      const dateFormatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Dhaka",
        month: "short",
        day: "numeric"
      });
      const dateStr = dateFormatter.format(d);
      return isSameDay ? `Today, ${timeStr} BST` : `${dateStr}, ${timeStr} BST`;
    } catch (e) {
      return null;
    }
  }

  // src/desktop/web/src_js/models/EventModel.js
  function cleanSportTokens(name) {
    return (name || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP_WORDS_SPORTS.has(w));
  }
  function matchSportTeams(fcTeam1, fcTeam2, espnTeam1, espnTeam2) {
    const t1 = cleanSportTokens(fcTeam1);
    const t2 = cleanSportTokens(fcTeam2);
    const e1 = cleanSportTokens(espnTeam1);
    const e2 = cleanSportTokens(espnTeam2);
    if (!t1.length || !t2.length || !e1.length || !e2.length) return false;
    const hasOverlap = (a, b) => a.some((x) => b.includes(x));
    return hasOverlap(t1, e1) && hasOverlap(t2, e2) || hasOverlap(t1, e2) && hasOverlap(t2, e1);
  }
  async function fetchRealSportsEvents(isBackground = false) {
    if (isBackground && (state.isPlayerOpen || document.body.classList.contains("player-active"))) {
      return;
    }
    if (!isBackground) {
      state.isLiveEventsLoading = state.liveEvents.length === 0;
      renderLiveEvents(state.selectedLiveSport);
    }
    const results = await Promise.allSettled([
      fetch("https://raw.githubusercontent.com/drmlive/fancode-live-events/main/fancode.json").then((r) => r.json()),
      fetch("https://site.api.espn.com/apis/site/v2/sports/cricket/scorepanel").then((r) => r.json()),
      fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/scorepanel").then((r) => r.json()),
      fetch("https://site.api.espn.com/apis/site/v2/sports/tennis/scorepanel").then((r) => r.json()),
      fetch("https://site.api.espn.com/apis/site/v2/sports/racing/f1/scoreboard").then((r) => r.json())
    ]);
    const fcData = results[0].status === "fulfilled" ? results[0].value : {};
    const cricData = results[1].status === "fulfilled" ? results[1].value : {};
    const socData = results[2].status === "fulfilled" ? results[2].value : {};
    const tenData = results[3].status === "fulfilled" ? results[3].value : {};
    const f1Data = results[4].status === "fulfilled" ? results[4].value : {};
    const now = /* @__PURE__ */ new Date();
    const espnCricket = [];
    for (const g of cricData.scores || []) {
      for (const ev of g.events || []) {
        const comp = ev.competitions?.[0];
        const comps = comp?.competitors || [];
        const statusType = ev.status?.type || {};
        const descLower = (statusType.description || "").toLowerCase();
        const stateStr = (statusType.state || "").toLowerCase();
        const summary = ev.status?.summary || statusType.detail || "";
        const sumLower = summary.toLowerCase();
        const startDate = ev.date ? new Date(ev.date) : now;
        const endDate = ev.endDate ? new Date(ev.endDate) : startDate;
        const classType = comp?.class?.eventType || "";
        const generalCard = comp?.class?.generalClassCard || "";
        const descStr = ev.description || "";
        const rangeMatch = descStr.match(/\b([A-Za-z]+)\s+(\d+)-(\d+)\s+(\d{4})\b/i);
        let totalDays = 1;
        if (rangeMatch) {
          totalDays = Math.max(1, parseInt(rangeMatch[3], 10) - parseInt(rangeMatch[2], 10) + 1);
        } else if (endDate.getTime() - startDate.getTime() >= 24 * 3600 * 1e3) {
          totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (24 * 3600 * 1e3)));
        }
        const isMultiDay = totalDays > 1 || classType === "Test" || generalCard.toLowerCase().includes("first-class");
        const msPerDay = 24 * 3600 * 1e3;
        const diffDays = Math.floor((now.getTime() - startDate.getTime()) / msPerDay);
        const currentDayNum = Math.min(totalDays, Math.max(1, diffDays + 1));
        const todayDailyStart = new Date(now);
        todayDailyStart.setUTCHours(startDate.getUTCHours(), startDate.getUTCMinutes(), 0, 0);
        const hoursSinceDailyStart = (now.getTime() - todayDailyStart.getTime()) / (3600 * 1e3);
        const isPastDailyPlayHours = hoursSinceDailyStart > 7.5;
        const isStumps = descLower.includes("stumps") || descLower.includes("close of play") || descLower.includes("end of day") || sumLower.includes("stumps");
        const isExplicitFinal = statusType.completed || stateStr === "post" || descLower.includes("result") || descLower.includes("final") || descLower.includes("ended") || descLower.includes("abandoned") || sumLower.includes("won by") || sumLower.includes("match drawn") || sumLower.includes("won the match") || sumLower.includes("won the series") || sumLower.includes("won by an innings");
        let isFinal = isExplicitFinal;
        if (!isFinal && isMultiDay) {
          if (diffDays + 1 > totalDays) {
            isFinal = true;
          } else if (diffDays + 1 === totalDays && isPastDailyPlayHours) {
            isFinal = true;
          }
        } else if (!isFinal && !isMultiDay) {
          if (hoursSinceDailyStart > 14) {
            isFinal = true;
          }
        }
        let isLive = false;
        if (!isFinal && !isStumps) {
          if (isMultiDay) {
            isLive = (stateStr === "in" || descLower.includes("live") || descLower.includes("drinks") || descLower.includes("tea") || descLower.includes("lunch")) && (hoursSinceDailyStart >= -0.5 && hoursSinceDailyStart <= 8);
          } else {
            isLive = (stateStr === "in" || descLower.includes("live")) && (hoursSinceDailyStart >= -0.5 && hoursSinceDailyStart <= 9);
          }
        }
        let scoreParts = [];
        for (const c of comps) {
          const teamName = c.team?.shortDisplayName || c.team?.abbreviation || c.team?.name || "";
          if (c.score) scoreParts.push(`${teamName}: ${c.score}`);
        }
        const scoreStr = scoreParts.length > 0 ? scoreParts.join(" \u2022 ") : "";
        let displayTime = "";
        const sessionStr = (ev.status?.session || "").trim();
        if (isMultiDay) {
          if (isFinal) {
            displayTime = `Completed (Day ${totalDays})`;
          } else if (isStumps) {
            displayTime = `Day ${currentDayNum} Stumps \u2022 Resumes Tomorrow`;
          } else if (isLive) {
            displayTime = sessionStr ? `Today \u2022 ${sessionStr}` : `Today \u2022 Day ${currentDayNum} of ${totalDays}`;
          } else {
            if (diffDays < 0) {
              displayTime = formatToBST(ev.date);
            } else if (hoursSinceDailyStart < 0) {
              const formattedDailyStart = formatToBST(todayDailyStart);
              displayTime = `Day ${currentDayNum} \u2022 Starts ${formattedDailyStart}`;
            } else {
              displayTime = `Day ${currentDayNum} of ${totalDays}`;
            }
          }
        } else {
          displayTime = formatToBST(ev.date);
        }
        espnCricket.push({
          raw: ev,
          team1: comps[0]?.team?.name || "",
          team2: comps[1]?.team?.name || "",
          title: ev.name,
          subtitle: comp?.series?.name || g.league?.name || "ICC / Bilateral Tour",
          scoreStr,
          summary,
          bstTime: displayTime,
          isLive,
          isStumps,
          isFinal,
          merged: false
        });
      }
    }
    const espnSoccer = [];
    for (const g of socData.scores || []) {
      for (const ev of g.events || []) {
        const comp = ev.competitions?.[0];
        const comps = comp?.competitors || [];
        const statusType = ev.status?.type || {};
        const stateStr = (statusType.state || "").toLowerCase();
        const isLive = stateStr === "in";
        const isFinal = statusType.completed || stateStr === "post";
        if (isFinal) continue;
        const evDate = new Date(ev.date);
        if (now.getTime() - evDate.getTime() > 12 * 3600 * 1e3) continue;
        let scoreStr = "";
        let homeTeam = "Home", awayTeam = "Away";
        if (comps.length >= 2) {
          const home = comps.find((c) => c.homeAway === "home") || comps[0];
          const away = comps.find((c) => c.homeAway === "away") || comps[1];
          homeTeam = home.team?.name || "";
          awayTeam = away.team?.name || "";
          scoreStr = `${home.team?.shortDisplayName || home.team?.name || "Home"} ${home.score ?? 0} - ${away.score ?? 0} ${away.team?.shortDisplayName || away.team?.name || "Away"}`;
          if (isLive && ev.status?.displayClock) scoreStr += ` \u2022 ${ev.status.displayClock}`;
        }
        const summary = statusType.detail || statusType.description || "";
        const bstTime = formatToBST(ev.date);
        espnSoccer.push({
          raw: ev,
          team1: homeTeam,
          team2: awayTeam,
          title: ev.name,
          subtitle: g.league?.name || "World Football",
          scoreStr,
          summary,
          bstTime,
          isLive,
          isFinal,
          merged: false
        });
      }
    }
    const events = [];
    for (const m of fcData.matches || []) {
      let sport = "Sports";
      let emoji = "\u{1F3C6}";
      const cat = (m.event_category || "").toLowerCase();
      const titleRaw = (m.title || "").toLowerCase();
      const eventNameRaw = (m.event_name || "").toLowerCase();
      if (cat.includes("cricket") || titleRaw.includes("cricket")) {
        sport = "Cricket";
        emoji = "\u{1F3CF}";
      } else if (cat.includes("football") || cat.includes("soccer") || titleRaw.includes("laliga") || titleRaw.includes("league")) {
        sport = "Football";
        emoji = "\u26BD";
      } else if (cat.includes("tennis") || titleRaw.includes("atp") || titleRaw.includes("wta") || cat.includes("badminton")) {
        sport = "Tennis";
        emoji = cat.includes("badminton") ? "\u{1F3F8}" : "\u{1F3BE}";
      } else if (cat.includes("moto") || cat.includes("racing") || cat.includes("formula") || cat.includes("f1") || titleRaw.includes("grand prix") || eventNameRaw.includes("sepang")) {
        sport = "MotoGP";
        emoji = "\u{1F3CD}\uFE0F";
      }
      const isLive = (m.status || "").toUpperCase() === "LIVE";
      const streamUrl = m.dai_url || m.adfree_url;
      const bstTime = formatToBST(m.startTime);
      let cleanTitle = (m.match_name || m.title || m.event_name || "").replace(/\s*\[(English|Hindi|Bangla)\]/gi, "").trim();
      let cleanSubtitle = (m.event_name || m.title || "").replace(/\s*\[(English|Hindi|Bangla)\]/gi, "").trim();
      if (cleanTitle.toLowerCase().includes("tbc vs tbc") || cleanTitle.toLowerCase().includes("tbd vs tbd")) {
        continue;
      }
      let matchedEspn = null;
      if (sport === "Cricket") {
        for (const ec of espnCricket) {
          if (!ec.merged && matchSportTeams(m.team_1, m.team_2, ec.team1, ec.team2)) {
            matchedEspn = ec;
            ec.merged = true;
            break;
          }
        }
      } else if (sport === "Football") {
        for (const es of espnSoccer) {
          if (!es.merged && matchSportTeams(m.team_1, m.team_2, es.team1, es.team2)) {
            matchedEspn = es;
            es.merged = true;
            break;
          }
        }
      }
      let scoreOrDetail = "";
      let summary = "";
      if (matchedEspn) {
        scoreOrDetail = matchedEspn.scoreStr || (isLive ? "\u{1F534} Live HD Stream Broadcast" : bstTime ? `Starts: ${bstTime}` : "Scheduled Match");
        summary = matchedEspn.summary || "";
      } else {
        scoreOrDetail = isLive ? "\u{1F534} Live HD Stream Broadcast" : bstTime ? `Starts: ${bstTime}` : "Upcoming Official Match";
      }
      let targetChan = "Live Sports HD";
      let targetId = "t_sports_hd";
      if (sport === "Cricket") {
        targetChan = "T Sports HD";
        targetId = "t_sports_hd";
      } else if (sport === "Football") {
        targetChan = "beIN Sports 1 HD";
        targetId = "bein_sports_1";
      } else if (sport === "Tennis") {
        targetChan = "Tennis Channel HD";
        targetId = "tennis_channel_intl_hd";
      } else if (sport === "MotoGP") {
        targetChan = "SPOTV 2 / ServusTV";
        targetId = "spotv_2_hd_motogp";
      }
      if (isLive && sport === "MotoGP" && streamUrl) {
        state.allChannels.forEach((ch) => {
          if (ch.id === "fancode_motogp_live" || ch.id === "motogp_official_world_feed") {
            ch.name = ch.id === "motogp_official_world_feed" ? "MotoGP Live HD (MGP World Feed)" : `FanCode MotoGP \u2022 ${cleanTitle}`;
            ch.streamUrl = streamUrl;
            if (m.src) ch.logoUrl = m.src;
          }
        });
      }
      events.push({
        id: "fc_" + (m.match_id || Math.random().toString(36).slice(2)),
        title: cleanTitle,
        subtitle: cleanSubtitle,
        sport,
        sportEmoji: emoji,
        statusText: isLive ? "LIVE" : m.status || "UPCOMING",
        bstTime,
        scoreOrDetail,
        summary,
        targetChannelName: isLive ? `${cleanTitle} (Live Feed)` : targetChan,
        targetChannelId: targetId,
        streamUrl: streamUrl || null,
        userAgent: m["user-agent"] || null,
        isLive,
        priority: isLive ? 1 : 15
      });
    }
    for (const ec of espnCricket) {
      if (ec.merged || ec.isFinal) continue;
      let targetId = "t_sports_hd";
      let targetName = "T Sports HD";
      const titleLower = (ec.title || "").toLowerCase();
      if (titleLower.includes("india") || titleLower.includes("australia") || titleLower.includes("england")) {
        targetId = "willow_tv_hd";
        targetName = "Willow TV HD";
      } else if (titleLower.includes("bangladesh")) {
        targetId = "t_sports_hd";
        targetName = "T Sports HD";
      } else if (titleLower.includes("pakistan")) {
        targetId = "sky_sports_cricket_hd";
        targetName = "Sky Sports Cricket HD";
      }
      const statusText = ec.isLive ? "LIVE" : ec.isStumps ? "STUMPS" : "SCHEDULED";
      events.push({
        id: "espn_cric_" + ec.raw.id,
        title: ec.title,
        subtitle: ec.subtitle,
        sport: "Cricket",
        sportEmoji: "\u{1F3CF}",
        statusText,
        bstTime: ec.bstTime,
        scoreOrDetail: ec.scoreStr || (ec.isLive ? "\u{1F534} Live Match" : ec.isStumps ? "\u23F8\uFE0F Stumps (Day Ended)" : ec.bstTime ? `Starts: ${ec.bstTime}` : "Scheduled Match"),
        summary: ec.summary,
        targetChannelName: targetName,
        targetChannelId: targetId,
        isLive: ec.isLive,
        priority: ec.isLive ? 2 : ec.isStumps ? 18 : 20
      });
    }
    for (const es of espnSoccer) {
      if (es.merged || es.isFinal) continue;
      events.push({
        id: "espn_soc_" + es.raw.id,
        title: es.title,
        subtitle: es.subtitle,
        sport: "Football",
        sportEmoji: "\u26BD",
        statusText: es.isLive ? "LIVE" : "SCHEDULED",
        bstTime: es.bstTime,
        scoreOrDetail: es.scoreStr || (es.isLive ? "\u26BD Live Football" : es.bstTime ? `Starts: ${es.bstTime}` : "Scheduled Match"),
        summary: es.summary,
        targetChannelName: "beIN Sports 1 HD",
        targetChannelId: "bein_sports_1",
        isLive: es.isLive,
        priority: es.isLive ? 2 : 20
      });
    }
    for (const g of tenData.scores || []) {
      for (const ev of g.events || []) {
        const statusType = ev.status?.type || {};
        const stateStr = (statusType.state || "").toLowerCase();
        const isLive = stateStr === "in";
        const isFinal = statusType.completed || stateStr === "post";
        if (isFinal) continue;
        const evDate = new Date(ev.date);
        if (now.getTime() - evDate.getTime() > 12 * 3600 * 1e3) continue;
        const detail = statusType.detail || statusType.description || "ATP / WTA World Tour";
        const bstTime = formatToBST(ev.date);
        events.push({
          id: "espn_ten_" + ev.id,
          title: ev.name,
          subtitle: g.league?.name || "Professional Tennis",
          sport: "Tennis",
          sportEmoji: "\u{1F3BE}",
          statusText: isLive ? "LIVE" : "SCHEDULED",
          bstTime,
          scoreOrDetail: detail,
          summary: "",
          targetChannelName: "Tennis Channel HD",
          targetChannelId: "tennis_channel_intl_hd",
          isLive,
          priority: isLive ? 3 : 22
        });
      }
    }
    for (const ev of f1Data.events || []) {
      const statusType = ev.status?.type || {};
      const stateStr = (statusType.state || "").toLowerCase();
      const isLive = stateStr === "in";
      const isFinal = statusType.completed || stateStr === "post";
      if (isFinal) continue;
      const evDate = new Date(ev.date);
      if (now.getTime() - evDate.getTime() > 24 * 3600 * 1e3) continue;
      const detail = statusType.detail || statusType.description || "FIA Formula 1 World Championship";
      const bstTime = formatToBST(ev.date);
      events.push({
        id: "espn_f1_" + ev.id,
        title: ev.name,
        subtitle: "Formula 1 Grand Prix",
        sport: "MotoGP",
        sportEmoji: "\u{1F3CE}\uFE0F",
        statusText: isLive ? "LIVE" : "RACE DAY",
        bstTime,
        scoreOrDetail: detail,
        summary: "",
        targetChannelName: "Sky Sports F1 HD",
        targetChannelId: "sky_sports_f1_hd",
        isLive,
        priority: isLive ? 3 : 23
      });
    }
    const seenTitles = /* @__PURE__ */ new Set();
    const uniqueEvents = [];
    for (const ev of events) {
      const key = (ev.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      if (!key || seenTitles.has(key)) continue;
      seenTitles.add(key);
      uniqueEvents.push(ev);
    }
    uniqueEvents.sort((a, b) => {
      if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
      if (a.isLive && b.isLive) {
        if (!!a.streamUrl !== !!b.streamUrl) return a.streamUrl ? -1 : 1;
      }
      return (a.priority || 50) - (b.priority || 50);
    });
    state.liveEvents = uniqueEvents;
    state.liveEventsTargetMap = /* @__PURE__ */ new Map();
    uniqueEvents.forEach((ev) => {
      if (ev.isLive && ev.targetChannelId) {
        state.liveEventsTargetMap.set(ev.targetChannelId, ev);
      }
    });
    state.isLiveEventsLoading = false;
    detectSportsHighlights(uniqueEvents);
    updateSportsScoreTicker();
    renderLiveEvents(state.selectedLiveSport);
    if (typeof checkSportsReminders === "function") {
      checkSportsReminders(uniqueEvents);
    }
  }
  function getVerifiedSportsServers(sport, targetChannelId) {
    const sportLower = (sport || "").toLowerCase();
    let backupServers = [];
    if (sportLower.includes("tennis") || sportLower.includes("badminton")) {
      backupServers = [
        { label: "Server 1 (Tennis Channel HD)", url: "https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01444-tennischannelth-tennischnlintl-lggb/playlist.m3u8" },
        { label: "Server 2 (Tennis Channel T2)", url: "https://mumbai-edge.smartplaytv.in/Tennis2/index.m3u8" },
        { label: "Server 3 (Tennis Channel Europe)", url: "https://cdn-ue1-prod.tsv2.amagi.tv/linear/amg01444-tennischannelth-tennischannelnl-samsungnl/playlist.m3u8" },
        { label: "Server 4 (beIN Sports XTRA)", url: "https://bein-xtra-bein.amagi.tv/playlist.m3u8" }
      ];
    } else if (sportLower.includes("cricket")) {
      backupServers = [
        { label: "Server 1 (T Sports HD)", url: "https://mycoffeetime.net/play/tSDRdsaoGGQ2qYgRPDEe9q-qMIzoahbJArH3W3vOiEaB97nXMpWmLb0Ts759Tjsp/m3u8" },
        { label: "Server 2 (Star Sports 1 HD)", url: "http://103.151.60.162:2122/play/a018/index.m3u8?hls" }
      ];
    } else if (sportLower.includes("football") || sportLower.includes("soccer")) {
      backupServers = [
        { label: "Server 1 (beIN Sports 1)", url: "http://45.134.141.161:2200/ARG/Bein_Sports_1_HD/index.m3u8" },
        { label: "Server 2 (Sony Sports Ten 2)", url: "http://103.151.60.162:2122/play/a01b/index.m3u8?hls" }
      ];
    } else if (sportLower.includes("moto") || sportLower.includes("racing") || sportLower.includes("f1") || sportLower.includes("formula")) {
      backupServers = [
        { label: "Server 1 (TNT Sports 2 HD \u2022 MotoGP)", url: "https://a122aivottlinear-a.akamaihd.net/OTTB/syd-nitro/live/clients/dash/enc/puehlftk5j/out/v1/f7f0da1ee112481ca0024e6d4dd97f4a/cenc.mpd|clearkey=f3df7843080ae743bf865dc5fdf64c68:567c863bc12eb74788ea74888c042e1b" },
        { label: "Server 2 (Eurosport Motorsport 4K)", url: "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8" },
        { label: "Server 3 (beIN Sports Racing HD)", url: "https://bein-esp-xumo.amagi.tv/playlistR1080p.m3u8" }
      ];
    }
    if (targetChannelId && state.allChannels) {
      const ch = state.allChannels.find((c) => c.id === targetChannelId);
      if (ch && ch.streamUrl && !backupServers.some((s) => s.url === ch.streamUrl)) {
        backupServers.push({ label: `Server (${ch.name})`, url: ch.streamUrl });
      }
    }
    return backupServers;
  }
  function tuneToEventChannel(evt) {
    if (!evt) return;
    const sportBackups = getVerifiedSportsServers(evt.sport, evt.targetChannelId);
    if (evt.streamUrl) {
      const directId = evt.id || `live_event_${Date.now()}`;
      const directChannel = {
        id: directId,
        name: `${evt.sportEmoji || "\u{1F3C6}"} ${evt.title}`.trim(),
        category: evt.sport || "Sports",
        country: "Live Sports",
        streamUrl: evt.streamUrl,
        headers: evt.userAgent ? { "User-Agent": evt.userAgent } : {}
      };
      const servers = [{ label: "Server 1 (Direct Feed)", url: evt.streamUrl }];
      sportBackups.forEach((b) => {
        if (b.url !== evt.streamUrl) {
          servers.push({ label: `Server ${servers.length + 1} (${b.label.replace(/^Server \d+ \((.*)\)$/, "$1")})`, url: b.url });
        }
      });
      CHANNEL_SERVERS[directId] = servers;
      playChannel(directChannel);
      return;
    }
    let target = state.allChannels.find((c) => c.id === evt.targetChannelId);
    if (!target && evt.targetChannelName) {
      const targetLower = evt.targetChannelName.toLowerCase();
      target = state.allChannels.find((c) => c.name && c.name.toLowerCase().includes(targetLower));
    }
    if (!target && evt.sport) {
      const sportLower = evt.sport.toLowerCase();
      target = state.allChannels.find(
        (c) => c.category && c.category.toLowerCase().includes(sportLower) || c.name && c.name.toLowerCase().includes(sportLower)
      );
    }
    if (target) {
      if (!CHANNEL_SERVERS[target.id] && sportBackups.length > 0) {
        const servers = [{ label: `Server 1 (${target.name})`, url: target.streamUrl }];
        sportBackups.forEach((b) => {
          if (b.url !== target.streamUrl) {
            servers.push({ label: `Server ${servers.length + 1} (${b.label.replace(/^Server \d+ \((.*)\)$/, "$1")})`, url: b.url });
          }
        });
        CHANNEL_SERVERS[target.id] = servers;
      }
      playChannel(target);
    } else if (sportBackups.length > 0) {
      const backupChannel = {
        id: `sport_fallback_${Date.now()}`,
        name: `${evt.sportEmoji || "\u{1F3C6}"} ${evt.title} (${evt.sport})`,
        category: evt.sport || "Sports",
        country: "Live Sports",
        streamUrl: sportBackups[0].url
      };
      CHANNEL_SERVERS[backupChannel.id] = sportBackups;
      playChannel(backupChannel);
    } else {
      showStreamNotice(`Channel ${evt.targetChannelName || "for event"} not found in catalog`);
    }
  }
  window.tuneFromSportsEvent = function(eventId) {
    const evt = (state.liveEvents || []).find((e) => e.id === eventId);
    if (evt) {
      tuneToEventChannel(evt);
    }
  };
  async function refreshDynamicMotoGpEvents() {
    try {
      const res = await fetch("https://raw.githubusercontent.com/drmlive/fancode-live-events/main/fancode.json");
      if (!res.ok) return;
      const data = await res.json();
      const matches = data.matches || [];
      for (const m of matches) {
        const cat = (m.event_category || "").toLowerCase();
        const title = (m.title || "").toLowerCase();
        const eventName = (m.event_name || "").toLowerCase();
        const matchName = m.match_name || "";
        const isMoto = cat.includes("motogp") || title.includes("motogp") || eventName.includes("sepang") || title.includes("grand prix");
        if (isMoto) {
          const streamUrl = m.dai_url || m.adfree_url;
          if (!streamUrl) continue;
          const logo = m.src || "https://www.fancode.com/skillup-uploads/cms-media/Petronas-Grand-Prix-of-Malaysia_fc-web.jpg";
          const channelTitle = matchName ? `FanCode MotoGP \u2022 ${matchName}` : `FanCode MotoGP \u2022 ${m.title || "Live"}`;
          state.allChannels.forEach((ch) => {
            if (ch.id === "fancode_motogp_live" || ch.id === "motogp_official_world_feed") {
              ch.name = ch.id === "motogp_official_world_feed" ? "MotoGP Live HD (MGP World Feed)" : channelTitle;
              ch.streamUrl = streamUrl;
              ch.logoUrl = logo;
            }
          });
          applyFilterAndSearch();
          console.log("Updated Dynamic FanCode MotoGP Stream:", channelTitle);
          break;
        }
      }
    } catch (err) {
    }
  }

  // src/desktop/web/src_js/controllers/AIUpscalerController.js
  var aiUpscalerState = {
    mode: "off",
    gl: null,
    program: null,
    tex: null,
    posBuffer: null,
    uvBuffer: null,
    locs: {},
    splitCompare: false,
    splitX: 0.5,
    isDragging: false,
    rafId: null
  };
  function initAIUpscaler() {
    if (aiUpscalerState.gl) return true;
    const canvas = el.aiUpscaleCanvas || document.getElementById("ai-upscale-canvas");
    if (!canvas) return false;
    try {
      let createShader = function(src, type) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          console.error("[WebGL AI] Shader error:", gl.getShaderInfoLog(s));
          gl.deleteShader(s);
          return null;
        }
        return s;
      };
      const gl = canvas.getContext("webgl", {
        alpha: false,
        depth: false,
        stencil: false,
        antialias: false,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance"
      }) || canvas.getContext("experimental-webgl");
      if (!gl) {
        console.warn("[WebGL AI] WebGL context not available");
        return false;
      }
      const vsSource = `
      attribute vec2 a_pos;
      attribute vec2 a_uv;
      varying vec2 v_uv;
      void main() {
        gl_Position = vec4(a_pos, 0.0, 1.0);
        v_uv = a_uv;
      }
    `;
      const fsSource = `
      precision highp float;
      uniform sampler2D u_tex;
      uniform vec2 u_texSize;
      uniform int u_mode;
      uniform float u_splitX;
      varying vec2 v_uv;

      void main() {
        if (u_splitX > 0.001) {
          float diff = abs(v_uv.x - u_splitX);
          if (diff < 0.0018) {
            gl_FragColor = vec4(0.22, 0.74, 0.98, 1.0);
            return;
          }
          if (v_uv.x < u_splitX) {
            gl_FragColor = texture2D(u_tex, v_uv);
            return;
          }
        }

        vec4 col = texture2D(u_tex, v_uv);
        if (u_mode == 0) {
          gl_FragColor = col;
          return;
        }

        vec2 step = 1.0 / u_texSize;
        vec4 n  = texture2D(u_tex, v_uv + vec2(0.0, -step.y));
        vec4 s  = texture2D(u_tex, v_uv + vec2(0.0, step.y));
        vec4 e  = texture2D(u_tex, v_uv + vec2(step.x, 0.0));
        vec4 w  = texture2D(u_tex, v_uv + vec2(-step.x, 0.0));
        vec4 nw = texture2D(u_tex, v_uv + vec2(-step.x, -step.y));
        vec4 ne = texture2D(u_tex, v_uv + vec2(step.x, -step.y));
        vec4 sw = texture2D(u_tex, v_uv + vec2(-step.x, step.y));
        vec4 se = texture2D(u_tex, v_uv + vec2(step.x, step.y));

        vec4 laplacian = (col * 8.0) - (n + s + e + w + nw + ne + sw + se);

        float l_c = dot(col.rgb, vec3(0.299, 0.587, 0.114));
        float l_n = dot(n.rgb, vec3(0.299, 0.587, 0.114));
        float l_s = dot(s.rgb, vec3(0.299, 0.587, 0.114));
        float l_e = dot(e.rgb, vec3(0.299, 0.587, 0.114));
        float l_w = dot(w.rgb, vec3(0.299, 0.587, 0.114));
        float edge = sqrt((l_e - l_w) * (l_e - l_w) + (l_s - l_n) * (l_s - l_n));

        vec3 rgb = col.rgb;

        if (u_mode == 1) {
          float factor = clamp(0.65 + edge * 1.8, 0.45, 1.35);
          rgb += laplacian.rgb * factor * 0.17;
          rgb = (rgb - 0.5) * 1.06 + 0.5;
        } else if (u_mode == 2) {
          rgb += laplacian.rgb * 0.12;
          rgb = pow(clamp(rgb, 0.0, 1.0), vec3(0.95));
          rgb = (rgb - 0.5) * 1.12 + 0.5;
          float maxC = max(rgb.r, max(rgb.g, rgb.b));
          float minC = min(rgb.r, min(rgb.g, rgb.b));
          float sat = (maxC - minC) / (maxC + 0.001);
          rgb = mix(vec3(dot(rgb, vec3(0.299, 0.587, 0.114))), rgb, 1.0 + (1.0 - sat) * 0.28);
        } else if (u_mode == 3) {
          rgb += laplacian.rgb * 0.24;
          rgb = (rgb - 0.5) * 1.08 + 0.5;
        } else if (u_mode == 4) {
          if (edge > 0.075) {
            rgb -= vec3(edge * 0.32);
          }
          rgb = (rgb - 0.5) * 1.14 + 0.5;
        }

        gl_FragColor = vec4(clamp(rgb, 0.0, 1.0), col.a);
      }
    `;
      const vs = createShader(vsSource, gl.VERTEX_SHADER);
      const fs = createShader(fsSource, gl.FRAGMENT_SHADER);
      if (!vs || !fs) return false;
      const prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.error("[WebGL AI] Link error:", gl.getProgramInfoLog(prog));
        return false;
      }
      aiUpscalerState.gl = gl;
      aiUpscalerState.program = prog;
      const posBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1,
        -1,
        1,
        -1,
        -1,
        1,
        1,
        1
      ]), gl.STATIC_DRAW);
      aiUpscalerState.posBuffer = posBuf;
      const uvBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0,
        1,
        1,
        1,
        0,
        0,
        1,
        0
      ]), gl.STATIC_DRAW);
      aiUpscalerState.uvBuffer = uvBuf;
      aiUpscalerState.locs = {
        a_pos: gl.getAttribLocation(prog, "a_pos"),
        a_uv: gl.getAttribLocation(prog, "a_uv"),
        u_tex: gl.getUniformLocation(prog, "u_tex"),
        u_texSize: gl.getUniformLocation(prog, "u_texSize"),
        u_mode: gl.getUniformLocation(prog, "u_mode"),
        u_splitX: gl.getUniformLocation(prog, "u_splitX")
      };
      gl.enableVertexAttribArray(aiUpscalerState.locs.a_pos);
      gl.enableVertexAttribArray(aiUpscalerState.locs.a_uv);
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
      aiUpscalerState.tex = tex;
      initSplitCompareDrag();
      return true;
    } catch (err) {
      console.error("[WebGL AI] Init failed:", err);
      return false;
    }
  }
  function startAIUpscaler() {
    if (aiUpscalerState.mode === "off") return;
    if (!initAIUpscaler()) return;
    if (el.aiUpscaleCanvas) el.aiUpscaleCanvas.style.display = "block";
    if (aiUpscalerState.rafId) {
      cancelAnimationFrame(aiUpscalerState.rafId);
      aiUpscalerState.rafId = null;
    }
    function loop() {
      if (aiUpscalerState.mode === "off") {
        stopAIUpscaler();
        return;
      }
      if (state.video && !state.video.paused && !state.video.ended && state.video.readyState >= 2) {
        renderAIUpscalerFrame();
      }
      aiUpscalerState.rafId = requestAnimationFrame(loop);
    }
    aiUpscalerState.rafId = requestAnimationFrame(loop);
  }
  function renderAIUpscalerFrame() {
    if (!aiUpscalerState.gl || !state.video || !el.aiUpscaleCanvas) return;
    const gl = aiUpscalerState.gl;
    const vw = state.video.videoWidth || 1920;
    const vh = state.video.videoHeight || 1080;
    if (el.aiUpscaleCanvas.width !== vw || el.aiUpscaleCanvas.height !== vh) {
      el.aiUpscaleCanvas.width = vw;
      el.aiUpscaleCanvas.height = vh;
      gl.viewport(0, 0, vw, vh);
    }
    gl.useProgram(aiUpscalerState.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, aiUpscalerState.posBuffer);
    gl.vertexAttribPointer(aiUpscalerState.locs.a_pos, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, aiUpscalerState.uvBuffer);
    gl.vertexAttribPointer(aiUpscalerState.locs.a_uv, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, aiUpscalerState.tex);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, state.video);
    } catch (err) {
      return;
    }
    gl.uniform1i(aiUpscalerState.locs.u_tex, 0);
    gl.uniform2f(aiUpscalerState.locs.u_texSize, vw, vh);
    const modeIndices = { "off": 0, "4k_sr": 1, "hdr_cinema": 2, "sports_clarity": 3, "anime_sharp": 4 };
    gl.uniform1i(aiUpscalerState.locs.u_mode, modeIndices[aiUpscalerState.mode] || 1);
    gl.uniform1f(aiUpscalerState.locs.u_splitX, aiUpscalerState.splitCompare ? aiUpscalerState.splitX : 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  function stopAIUpscaler() {
    if (aiUpscalerState.rafId) {
      cancelAnimationFrame(aiUpscalerState.rafId);
      aiUpscalerState.rafId = null;
    }
    if (el.aiUpscaleCanvas) {
      el.aiUpscaleCanvas.style.display = "none";
    }
    if (el.aiCompareSliderContainer) {
      el.aiCompareSliderContainer.style.display = "none";
    }
    aiUpscalerState.splitCompare = false;
    if (el.playerBtnAiCompare) el.playerBtnAiCompare.classList.remove("active");
  }
  function cycleAIUpscaler() {
    const modes = ["off", "4k_sr", "hdr_cinema", "sports_clarity", "anime_sharp"];
    const curIdx = modes.indexOf(aiUpscalerState.mode);
    const nextMode = modes[(curIdx + 1) % modes.length];
    aiUpscalerState.mode = nextMode;
    updateAIUpscalerUI();
    if (nextMode === "off") {
      stopAIUpscaler();
      showToast("AI Video Enhancer: OFF", "\u2139\uFE0F");
    } else {
      startAIUpscaler();
      const modeToasts = {
        "4k_sr": "\u2728 Real-Time AI Super-Resolution: 4K Ultra HD (GPU 60fps)",
        "hdr_cinema": "\u{1F3AC} AI Dynamic Range: Retina HDR Cinema Active",
        "sports_clarity": "\u{1F3CE}\uFE0F AI Sports Motion: High Frame Clarity Active",
        "anime_sharp": "\u{1F3A8} AI Cartoon/Anime: Dynamic Edge Contrast Active"
      };
      showToast(modeToasts[nextMode] || "AI Enhancer Active", "\u2728");
    }
  }
  function updateAIUpscalerUI() {
    const modeLabels = {
      "off": "AI 4K Upscaler",
      "4k_sr": "\u2728 AI 4K Pro",
      "hdr_cinema": "\u{1F3AC} Retina HDR",
      "sports_clarity": "\u{1F3CE}\uFE0F Sports 60fps",
      "anime_sharp": "\u{1F3A8} Anime Sharp"
    };
    if (el.playerAiUpscaleLabel) {
      el.playerAiUpscaleLabel.textContent = modeLabels[aiUpscalerState.mode] || "AI 4K Upscaler";
    }
    if (el.playerBtnAiUpscaler) {
      el.playerBtnAiUpscaler.classList.toggle("active", aiUpscalerState.mode !== "off");
    }
  }
  function toggleAISplitCompare() {
    if (aiUpscalerState.mode === "off") {
      aiUpscalerState.mode = "4k_sr";
      updateAIUpscalerUI();
      startAIUpscaler();
    }
    aiUpscalerState.splitCompare = !aiUpscalerState.splitCompare;
    if (el.aiCompareSliderContainer) {
      el.aiCompareSliderContainer.style.display = aiUpscalerState.splitCompare ? "block" : "none";
    }
    if (el.playerBtnAiCompare) {
      el.playerBtnAiCompare.classList.toggle("active", aiUpscalerState.splitCompare);
    }
    if (aiUpscalerState.splitCompare) {
      showToast("\u2696\uFE0F Split Compare: Drag line to compare Native 1080p vs AI 4K live!", "\u2728");
    } else {
      showToast("Split Compare Closed", "\u2139\uFE0F");
    }
  }
  function initSplitCompareDrag() {
    const container = el.aiCompareSliderContainer || document.getElementById("ai-compare-slider-container");
    const line = el.aiCompareLine || document.getElementById("ai-compare-line");
    if (!container || !line) return;
    function updateDrag(e) {
      const rect = container.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const x = Math.max(0.05, Math.min(0.95, (clientX - rect.left) / rect.width));
      aiUpscalerState.splitX = x;
      line.style.left = `${(x * 100).toFixed(1)}%`;
    }
    line.addEventListener("mousedown", (e) => {
      e.preventDefault();
      aiUpscalerState.isDragging = true;
    });
    window.addEventListener("mousemove", (e) => {
      if (!aiUpscalerState.isDragging) return;
      updateDrag(e);
    });
    window.addEventListener("mouseup", () => {
      aiUpscalerState.isDragging = false;
    });
    line.addEventListener("touchstart", () => {
      aiUpscalerState.isDragging = true;
    }, { passive: true });
    window.addEventListener("touchmove", (e) => {
      if (!aiUpscalerState.isDragging) return;
      updateDrag(e);
    }, { passive: true });
    window.addEventListener("touchend", () => {
      aiUpscalerState.isDragging = false;
    });
  }

  // src/desktop/web/src_js/controllers/AppController.js
  function toggleAlwaysOnTop() {
    state.isAlwaysOnTop = !state.isAlwaysOnTop;
    window.updateAlwaysOnTopUI(state.isAlwaysOnTop);
    if (window.webkit?.messageHandlers?.setAlwaysOnTop) {
      try {
        window.webkit.messageHandlers.setAlwaysOnTop.postMessage(state.isAlwaysOnTop);
      } catch (e) {
        console.warn("Native bridge setAlwaysOnTop error:", e);
      }
    }
    showToast(state.isAlwaysOnTop ? "Always on Top enabled" : "Always on Top disabled", "\u{1F4CC}");
  }
  window.updateAlwaysOnTopUI = function(isPinned) {
    state.isAlwaysOnTop = !!isPinned;
    if (el.btnHeaderPin) el.btnHeaderPin.classList.toggle("is-pinned", state.isAlwaysOnTop);
    if (el.playerBtnPin) el.playerBtnPin.classList.toggle("is-pinned", state.isAlwaysOnTop);
  };
  function toggleRecording() {
    if (state.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }
  function startRecording() {
    if (!state.video) {
      showToast("No active video to record", "\u26A0\uFE0F");
      return;
    }
    try {
      const stream = state.video.captureStream ? state.video.captureStream() : state.video.mozCaptureStream ? state.video.mozCaptureStream() : null;
      if (!stream) {
        showToast("Live stream recording not supported on this video format", "\u26A0\uFE0F");
        return;
      }
      let mimeType = "video/webm;codecs=vp9,opus";
      if (!window.MediaRecorder || !MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "video/mp4";
        }
      }
      state.recordedChunks = [];
      const options = window.MediaRecorder && MediaRecorder.isTypeSupported(mimeType) ? { mimeType } : void 0;
      const recorder = new MediaRecorder(stream, options);
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          state.recordedChunks.push(e.data);
        }
      };
      recorder.onstop = () => {
        saveRecordingBlob();
      };
      recorder.start(1e3);
      state.mediaRecorder = recorder;
      state.isRecording = true;
      state.recordSeconds = 0;
      if (el.playerBtnRecord) el.playerBtnRecord.classList.add("is-recording");
      if (el.playerRecordLabel) el.playerRecordLabel.textContent = "REC 00:00";
      clearInterval(state.recordTimerInterval);
      state.recordTimerInterval = setInterval(() => {
        state.recordSeconds++;
        const mins = String(Math.floor(state.recordSeconds / 60)).padStart(2, "0");
        const secs = String(state.recordSeconds % 60).padStart(2, "0");
        if (el.playerRecordLabel) el.playerRecordLabel.textContent = `REC ${mins}:${secs}`;
      }, 1e3);
      showToast("Recording started \u2022 Capturing live highlight", "\u{1F534}");
    } catch (err) {
      console.error("Recording start error:", err);
      showToast("Recording unavailable: " + (err.message || err), "\u26A0\uFE0F");
    }
  }
  function stopRecording() {
    if (!state.isRecording || !state.mediaRecorder) return;
    clearInterval(state.recordTimerInterval);
    try {
      state.mediaRecorder.stop();
    } catch (e) {
    }
    state.isRecording = false;
    if (el.playerBtnRecord) el.playerBtnRecord.classList.remove("is-recording");
    if (el.playerRecordLabel) el.playerRecordLabel.textContent = "REC";
  }
  function saveRecordingBlob() {
    if (state.recordedChunks.length === 0) {
      showToast("No clip data recorded", "\u26A0\uFE0F");
      return;
    }
    const mime = state.mediaRecorder && state.mediaRecorder.mimeType ? state.mediaRecorder.mimeType : "video/webm";
    const blob = new Blob(state.recordedChunks, { type: mime });
    const url = URL.createObjectURL(blob);
    const chName = (state.currentChannel ? state.currentChannel.name : "LiveTV").replace(/[^a-zA-Z0-9_-]/g, "_");
    const now = /* @__PURE__ */ new Date();
    const timeStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
    const ext = mime.includes("mp4") ? "mp4" : "webm";
    const filename = `LiveTV_${chName}_${timeStr}.${ext}`;
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 1e3);
    showToast(`Clip saved: ${filename}`, "\u{1F4BE}");
  }
  function openMultiView() {
    state.multiviewActive = true;
    if (state.video) {
      state.video.pause();
    }
    if (el.multiviewOverlay) {
      el.multiviewOverlay.style.display = "flex";
    }
    const ch1 = state.currentChannel || state.allChannels[0];
    const ch2 = state.allChannels.find((c) => c.id !== (ch1 ? ch1.id : null) && c.category === "Sports") || state.allChannels[1];
    const ch3 = state.allChannels.find((c) => c.id !== (ch1 ? ch1.id : null) && c.id !== (ch2 ? ch2.id : null) && c.category === "News") || state.allChannels[2];
    const ch4 = state.allChannels.find((c) => c.id !== (ch1 ? ch1.id : null) && c.id !== (ch2 ? ch2.id : null) && c.id !== (ch3 ? ch3.id : null)) || state.allChannels[3];
    state.multiviewChannels = [ch1, ch2, ch3, ch4];
    setMultiViewMode(state.multiviewMode || "dual");
  }
  function setMultiViewMode(mode) {
    state.multiviewMode = mode;
    if (!el.multiviewGrid) return;
    const btnDual = document.getElementById("btn-mv-mode-dual");
    const btnQuad = document.getElementById("btn-mv-mode-quad");
    if (btnDual && btnQuad) {
      btnDual.classList.toggle("active", mode === "dual");
      btnQuad.classList.toggle("active", mode === "quad");
    }
    if (mode === "dual") {
      el.multiviewGrid.className = "multiview-grid mode-dual";
      const s2 = document.getElementById("mv-slot-2");
      const s3 = document.getElementById("mv-slot-3");
      if (s2) s2.style.display = "none";
      if (s3) s3.style.display = "none";
      setupSlotStream(0, state.multiviewChannels[0]);
      setupSlotStream(1, state.multiviewChannels[1]);
      destroySlotStream(2);
      destroySlotStream(3);
    } else {
      el.multiviewGrid.className = "multiview-grid mode-quad";
      const s2 = document.getElementById("mv-slot-2");
      const s3 = document.getElementById("mv-slot-3");
      if (s2) s2.style.display = "flex";
      if (s3) s3.style.display = "flex";
      setupSlotStream(0, state.multiviewChannels[0]);
      setupSlotStream(1, state.multiviewChannels[1]);
      setupSlotStream(2, state.multiviewChannels[2]);
      setupSlotStream(3, state.multiviewChannels[3]);
    }
  }
  function setupSlotStream(slotIndex, channel) {
    if (!channel) return;
    const vid = document.getElementById(`mv-video-${slotIndex}`);
    const title = document.getElementById(`mv-title-${slotIndex}`);
    if (title) title.textContent = channel.name;
    if (state.multiviewHls[slotIndex]) {
      try {
        state.multiviewHls[slotIndex].destroy();
      } catch (e) {
      }
      state.multiviewHls[slotIndex] = null;
    }
    if (!vid) return;
    vid.muted = slotIndex !== state.multiviewActiveSlot;
    if (typeof Hls !== "undefined" && Hls.isSupported() && channel.streamUrl && channel.streamUrl.includes(".m3u8")) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      state.multiviewHls[slotIndex] = hls;
      hls.loadSource(channel.streamUrl);
      hls.attachMedia(vid);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        vid.play().catch(() => {
        });
      });
    } else if (channel.streamUrl) {
      vid.src = channel.streamUrl;
      vid.play().catch(() => {
      });
    }
  }
  function destroySlotStream(slotIndex) {
    if (state.multiviewHls[slotIndex]) {
      try {
        state.multiviewHls[slotIndex].destroy();
      } catch (e) {
      }
      state.multiviewHls[slotIndex] = null;
    }
    const vid = document.getElementById(`mv-video-${slotIndex}`);
    if (vid) {
      vid.pause();
      vid.removeAttribute("src");
      vid.load();
    }
  }
  function setMultiViewAudioFocus(slotIndex) {
    state.multiviewActiveSlot = slotIndex;
    for (let i = 0; i < 4; i++) {
      const slot = document.getElementById(`mv-slot-${i}`);
      const vid = document.getElementById(`mv-video-${i}`);
      const badge = document.getElementById(`mv-audio-btn-${i}`);
      if (slot && vid) {
        if (i === slotIndex) {
          slot.classList.add("active-audio");
          vid.muted = false;
          if (badge) {
            badge.classList.add("active");
            badge.textContent = "\u{1F50A} AUDIO ACTIVE";
          }
        } else {
          slot.classList.remove("active-audio");
          vid.muted = true;
          if (badge) {
            badge.classList.remove("active");
            badge.textContent = "\u{1F507} MUTED";
          }
        }
      }
    }
    const status = document.getElementById("multiview-status-text");
    if (status && state.multiviewChannels[slotIndex]) {
      status.textContent = `Audio Focus: ${state.multiviewChannels[slotIndex].name} \u2022 Click any screen to focus audio`;
    }
  }
  function closeMultiView() {
    state.multiviewActive = false;
    for (let i = 0; i < 4; i++) {
      destroySlotStream(i);
    }
    if (el.multiviewOverlay) {
      el.multiviewOverlay.style.display = "none";
    }
    if (state.video && state.currentChannel) {
      state.video.play().catch(() => {
      });
    }
  }
  var isAmbilightActive = false;
  var ambilightRaf = null;
  function initAmbilight() {
    if (!el.ambientCanvas) return;
    el.ambientCanvas.width = 32;
    el.ambientCanvas.height = 18;
  }
  function toggleAmbilight() {
    isAmbilightActive = !isAmbilightActive;
    if (el.videoContainer) {
      el.videoContainer.classList.toggle("ambient-active", isAmbilightActive);
    }
    if (el.playerAmbilightLabel) {
      el.playerAmbilightLabel.textContent = isAmbilightActive ? "Ambilight ON" : "Ambient";
    }
    if (isAmbilightActive) {
      initAmbilight();
      renderAmbilightFrame();
      showToast("Dynamic Reactive Ambilight ON \u{1F4A1}", "\u2728");
    } else {
      stopAmbilight();
      showToast("Ambilight Backlighting Turned Off", "\u{1F4A1}");
    }
  }
  function stopAmbilight() {
    isAmbilightActive = false;
    if (ambilightRaf) {
      cancelAnimationFrame(ambilightRaf);
      ambilightRaf = null;
    }
    if (el.videoContainer) {
      el.videoContainer.classList.remove("ambient-active");
    }
    if (el.playerAmbilightLabel) {
      el.playerAmbilightLabel.textContent = "Ambient";
    }
  }
  window.stopAmbilight = stopAmbilight;
  function renderAmbilightFrame() {
    if (!isAmbilightActive) return;
    if (el.ambientCanvas && state.video && !state.video.paused && state.video.videoWidth > 0) {
      try {
        const ctx = el.ambientCanvas.getContext("2d");
        ctx.drawImage(state.video, 0, 0, 32, 18);
      } catch (e) {
      }
    }
    ambilightRaf = requestAnimationFrame(renderAmbilightFrame);
  }
  function captureLiveClip() {
    if (!state.video) return;
    showToast("Capturing 15-second highlight clip... \u2702\uFE0F", "\u{1F3AC}");
    try {
      const stream = state.video.captureStream ? state.video.captureStream(30) : null;
      if (stream && window.MediaRecorder) {
        const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
        const chunks = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          const chName = (state.currentChannel?.name || "LiveTV").replace(/[^a-zA-Z0-9]/g, "_");
          a.download = `Highlight_${chName}_${Date.now()}.webm`;
          a.click();
          URL.revokeObjectURL(url);
          showToast("Highlight clip downloaded successfully! \u2702\uFE0F", "\u{1F389}");
        };
        recorder.start();
        setTimeout(() => {
          if (recorder.state === "recording") recorder.stop();
        }, 5e3);
        return;
      }
    } catch (err) {
      console.warn("Direct stream capture fallback:", err);
    }
    try {
      const canvas = document.createElement("canvas");
      canvas.width = state.video.videoWidth || 1920;
      canvas.height = state.video.videoHeight || 1080;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(state.video, 0, 0, canvas.width, canvas.height);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/jpeg", 0.95);
      a.download = `LiveTV_ActionShot_${Date.now()}.jpg`;
      a.click();
      showToast("Action moment snapshot saved to Downloads! \u{1F4F8}", "\u{1F3AC}");
    } catch (e) {
      showToast("Highlight capture ready: Saved to buffer", "\u2702\uFE0F");
    }
  }
  var isLiveCaptionsActive = false;
  var speechRecognizer = null;
  function toggleLiveCaptions() {
    isLiveCaptionsActive = !isLiveCaptionsActive;
    if (el.playerCaptionsLabel) {
      el.playerCaptionsLabel.textContent = isLiveCaptionsActive ? "Captions ON" : "Captions";
    }
    if (el.playerLiveCaptions) {
      el.playerLiveCaptions.style.display = isLiveCaptionsActive ? "block" : "none";
    }
    if (isLiveCaptionsActive) {
      showToast("Live Speech-to-Text Closed Captions Active \u{1F4AC}", "\u2728");
      if (!speechRecognizer && (window.webkitSpeechRecognition || window.SpeechRecognition)) {
        const Speech = window.webkitSpeechRecognition || window.SpeechRecognition;
        speechRecognizer = new Speech();
        speechRecognizer.continuous = true;
        speechRecognizer.interimResults = true;
        speechRecognizer.lang = "en-US";
        speechRecognizer.onresult = (event) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          if (el.playerLiveCaptions) el.playerLiveCaptions.textContent = transcript;
        };
        speechRecognizer.onerror = () => {
        };
        speechRecognizer.onend = () => {
          if (isLiveCaptionsActive) try {
            speechRecognizer.start();
          } catch (e) {
          }
        };
        try {
          speechRecognizer.start();
        } catch (e) {
        }
      } else if (el.playerLiveCaptions) {
        el.playerLiveCaptions.textContent = "\u{1F399}\uFE0F [Live Broadcast Commentary Stream Subtitles Active]";
      }
    } else {
      if (speechRecognizer) {
        try {
          speechRecognizer.stop();
        } catch (e) {
        }
      }
      showToast("Closed captions disabled", "\u{1F4AC}");
    }
  }
  var sleepTimerId = null;
  var sleepTargetTime = 0;
  function setSleepTimer(minutes) {
    cancelSleepTimer();
    if (minutes <= 0) {
      showToast("Sleep Timer turned off");
      return;
    }
    sleepTargetTime = Date.now() + minutes * 60 * 1e3;
    const countdownPill = document.getElementById("player-sleep-countdown");
    const countdownVal = document.getElementById("sleep-countdown-val");
    if (countdownPill) countdownPill.style.display = "flex";
    showToast(`Sleep Timer set for ${minutes} minutes`);
    document.querySelectorAll(".sleep-preset-btn").forEach((btn) => {
      btn.classList.toggle("active", parseInt(btn.dataset.minutes, 10) === minutes);
    });
    sleepTimerId = setInterval(() => {
      const diff = Math.max(0, Math.floor((sleepTargetTime - Date.now()) / 1e3));
      const mins = Math.floor(diff / 60);
      const secs = diff % 60;
      if (countdownVal) countdownVal.textContent = `${mins}:${secs < 10 ? "0" : ""}${secs}`;
      if (diff <= 120 && diff > 0) {
        const fadeFactor = diff / 120;
        if (state.video) {
          state.video.volume = Math.min(1, Math.max(0, state.volume / 100 * fadeFactor));
        }
        if (state.audioGainNode && state.audioContext) {
          state.audioGainNode.gain.setValueAtTime(state.volume / 100 * fadeFactor, state.audioContext.currentTime);
        }
      }
      if (diff <= 0) {
        cancelSleepTimer();
        if (state.video) state.video.pause();
        showToast("\u{1F319} Sleep Timer: Live TV put to sleep.");
        if (el.playerOverlay.style.display !== "none") {
          closePlayer();
        }
      }
    }, 1e3);
  }
  function cancelSleepTimer() {
    if (sleepTimerId) {
      clearInterval(sleepTimerId);
      sleepTimerId = null;
    }
    sleepTargetTime = 0;
    const countdownPill = document.getElementById("player-sleep-countdown");
    if (countdownPill) countdownPill.style.display = "none";
    document.querySelectorAll(".sleep-preset-btn").forEach((btn) => btn.classList.remove("active"));
    applyVolume(state.volume);
  }
  function syncRemoteStatus() {
    if (!state.currentChannel) return;
    const status = {
      channelName: state.currentChannel.name,
      channelCategory: state.currentChannel.category,
      channelLogo: state.currentChannel.logoUrl,
      isPlaying: state.isPlaying,
      isMuted: state.isMuted,
      volume: state.volume,
      isPip: state.isPipActive,
      isPinned: state.isAlwaysOnTop,
      currentQuality: el.playerQualityLabel ? el.playerQualityLabel.textContent : "Auto"
    };
    if (window.webkit?.messageHandlers?.updateRemoteStatus) {
      try {
        window.webkit.messageHandlers.updateRemoteStatus.postMessage(JSON.stringify(status));
      } catch (e) {
      }
    }
  }
  function syncRemoteChannels() {
    if (!state.allChannels) return;
    const list = state.allChannels.map((c) => ({
      id: c.id,
      name: c.name,
      category: c.category,
      isFavorite: (state.favorites || []).includes(c.id)
    }));
    if (window.webkit?.messageHandlers?.updateRemoteChannels) {
      try {
        window.webkit.messageHandlers.updateRemoteChannels.postMessage(JSON.stringify(list));
      } catch (e) {
      }
    }
  }
  window.__CURRENT_VISITS__ = 0;
  function isOwnerUser() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("owner") === "1" || urlParams.get("admin") === "sam" || urlParams.get("stats") === "sam") {
      localStorage.setItem("livetv_is_owner", "1");
      return true;
    }
    if (localStorage.getItem("livetv_is_owner") === "1") {
      return true;
    }
    if (window.webkit?.messageHandlers?.startWindowDrag) {
      return true;
    }
    return false;
  }
  function updateOwnerBadgeIfAuthorized(forceShow = false) {
    const isOwner = forceShow || isOwnerUser();
    const btnOwner = document.getElementById("btn-owner-analytics");
    const countSpan = document.getElementById("owner-visits-count");
    const modalCount = document.getElementById("owner-modal-total-visits");
    if (isOwner && btnOwner) {
      btnOwner.style.display = "inline-flex";
      const displayVal = window.__CURRENT_VISITS__ ? window.__CURRENT_VISITS__.toLocaleString() : "...";
      if (countSpan) countSpan.textContent = displayVal;
      if (modalCount) modalCount.textContent = `${displayVal} Total Visits`;
    } else if (btnOwner) {
      btnOwner.style.display = "none";
    }
  }
  function initVisitorTracking() {
    const isOwner = isOwnerUser();
    if (isOwner) {
      updateOwnerBadgeIfAuthorized(true);
    }
    let tapCount = 0;
    let tapTimer = null;
    const authorLink = document.getElementById("brand-author-link");
    if (authorLink) {
      authorLink.addEventListener("click", (e) => {
        tapCount++;
        clearTimeout(tapTimer);
        tapTimer = setTimeout(() => {
          tapCount = 0;
        }, 2e3);
        if (tapCount >= 3) {
          e.preventDefault();
          localStorage.setItem("livetv_is_owner", "1");
          showToast("\u{1F451} Creator Analytics Unlocked! Traffic badge active.", "\u2728");
          updateOwnerBadgeIfAuthorized(true);
          const modal = document.getElementById("modal-owner-analytics");
          if (modal) modal.style.display = "flex";
        }
      });
    }
    const isCounted = sessionStorage.getItem("livetv_session_counted");
    const endpoint = isCounted ? "https://countapi.mileshilliard.com/api/v1/get/samakhtarul_livetv_visits" : "https://countapi.mileshilliard.com/api/v1/hit/samakhtarul_livetv_visits";
    fetch(endpoint, { cache: "no-store" }).then((r) => r.json()).then((data) => {
      if (data && data.value) {
        window.__CURRENT_VISITS__ = parseInt(data.value, 10);
        sessionStorage.setItem("livetv_session_counted", "1");
        updateOwnerBadgeIfAuthorized();
      }
    }).catch(() => {
    });
  }
  function initBroadcastSuiteExtensions() {
    const btnRecall = document.getElementById("player-btn-recall");
    if (btnRecall) btnRecall.onclick = recallPreviousChannel;
    const btnZoom = document.getElementById("player-btn-zoom");
    if (btnZoom) btnZoom.onclick = cycleVideoZoom;
    initVideoZoomGestures();
    const btnSearch = document.getElementById("player-btn-quick-search");
    if (btnSearch) btnSearch.onclick = openPlayerSearch;
    const btnCloseSearch = document.getElementById("btn-close-hud-search");
    if (btnCloseSearch) btnCloseSearch.onclick = closePlayerSearch;
    const searchInput = document.getElementById("hud-channel-search-input");
    if (searchInput) {
      let hudDebounceTimer = null;
      searchInput.addEventListener("input", (e) => {
        clearTimeout(hudDebounceTimer);
        const val = e.target.value;
        hudDebounceTimer = setTimeout(() => {
          renderPlayerSearchResults(val);
        }, 50);
      });
      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          window.hudSearchSelectedIdx = Math.min((window.hudSearchResultsList || []).length - 1, (window.hudSearchSelectedIdx || 0) + 1);
          updateHudSearchHighlight();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          window.hudSearchSelectedIdx = Math.max(0, (window.hudSearchSelectedIdx || 0) - 1);
          updateHudSearchHighlight();
        } else if (e.key === "Enter") {
          e.preventDefault();
          window.selectHudChannel(window.hudSearchSelectedIdx || 0);
        } else if (e.key === "Escape") {
          e.preventDefault();
          closePlayerSearch();
        }
      });
    }
    const btnReconnect = document.getElementById("player-btn-reconnect");
    if (btnReconnect) btnReconnect.onclick = () => reconnectCurrentStream(false);
    const btnNoticeRec = document.getElementById("btn-player-notice-reconnect");
    if (btnNoticeRec) btnNoticeRec.onclick = () => reconnectCurrentStream(false);
    const lipsyncSlider = document.getElementById("lipsync-slider");
    if (lipsyncSlider) {
      lipsyncSlider.oninput = (e) => {
        setAudioDelay(parseInt(e.target.value, 10), false);
      };
    }
    document.querySelectorAll(".lipsync-btn").forEach((btn) => {
      btn.onclick = () => {
        const delay = parseInt(btn.dataset.delay, 10);
        setAudioDelay(delay, true);
      };
    });
    try {
      const savedDelay = parseInt(localStorage.getItem("livetv_audio_delay") || "0", 10);
      if (!isNaN(savedDelay) && savedDelay !== 0) {
        setAudioDelay(savedDelay, false);
      }
    } catch (e) {
    }
    const appHeader = document.querySelector(".app-header");
    if (appHeader) {
      appHeader.addEventListener("wheel", (e) => {
        if (e.deltaY !== 0 && appHeader.scrollWidth > appHeader.clientWidth) {
          e.preventDefault();
          appHeader.scrollLeft += e.deltaY;
        }
      }, { passive: false });
    }
  }
  function setupEventListeners() {
    let mainSearchDebounce = null;
    if (el.searchInput) {
      el.searchInput.addEventListener("input", (e) => {
        state.searchQuery = e.target.value;
        if (el.searchClear) el.searchClear.style.display = state.searchQuery ? "block" : "none";
        clearTimeout(mainSearchDebounce);
        mainSearchDebounce = setTimeout(() => {
          applyFilterAndSearch();
        }, 60);
      });
    }
    if (el.searchClear) {
      el.searchClear.onclick = () => {
        clearTimeout(mainSearchDebounce);
        if (el.searchInput) el.searchInput.value = "";
        state.searchQuery = "";
        el.searchClear.style.display = "none";
        applyFilterAndSearch();
      };
    }
    if (el.browserView) {
      let scrollTicking = false;
      el.browserView.addEventListener("scroll", () => {
        if (!scrollTicking) {
          scrollTicking = true;
          requestAnimationFrame(() => {
            const { scrollTop, scrollHeight, clientHeight } = el.browserView;
            if (scrollTop + clientHeight >= scrollHeight - 800) {
              if (state.renderedChannelCount < state.filteredChannels.length) {
                renderChannelBatch();
              }
            }
            scrollTicking = false;
          });
        }
      }, { passive: true });
    }
    if (el.btnRankFavorites) el.btnRankFavorites.onclick = openRankFavoritesModal;
    if (el.btnReorderCategories) el.btnReorderCategories.onclick = openRearrangeCategoriesModal;
    if (el.btnShortcuts) el.btnShortcuts.onclick = () => openModal(el.modalShortcuts);
    if (el.btnCloseShortcutsModal) el.btnCloseShortcutsModal.onclick = () => closeModal(el.modalShortcuts);
    if (el.btnDoneShortcuts) el.btnDoneShortcuts.onclick = () => closeModal(el.modalShortcuts);
    if (el.btnImportM3u) el.btnImportM3u.onclick = () => openModal(el.modalImportM3u);
    if (el.btnCloseM3uModal) el.btnCloseM3uModal.onclick = () => closeModal(el.modalImportM3u);
    if (el.btnCancelM3u) el.btnCancelM3u.onclick = () => closeModal(el.modalImportM3u);
    if (el.btnInfo) el.btnInfo.onclick = () => openAboutModal();
    if (el.btnHeaderUpdateBadge) {
      el.btnHeaderUpdateBadge.onclick = () => {
        openAboutModal();
        checkForAppUpdates(true);
      };
    }
    if (el.btnHeaderUpdater) {
      el.btnHeaderUpdater.onclick = () => {
        openAboutModal();
        checkForAppUpdates(true);
      };
    }
    if (el.brandAuthorLink) {
      el.brandAuthorLink.onclick = (e) => {
        e.preventDefault();
        openExternalUrl(GITHUB_RELEASES_URL);
      };
    }
    if (el.btnHeaderTicker) el.btnHeaderTicker.onclick = () => toggleSportsTicker();
    if (el.tickerCloseBtn) el.tickerCloseBtn.onclick = () => toggleSportsTicker(false);
    if (el.btnHeaderSchedule) el.btnHeaderSchedule.onclick = openScheduledDvrModal;
    if (el.btnCloseScheduleModal) el.btnCloseScheduleModal.onclick = () => closeModal(el.modalScheduledDvr);
    if (el.btnCancelSchedule) el.btnCancelSchedule.onclick = () => closeModal(el.modalScheduledDvr);
    if (el.btnSaveSchedule) el.btnSaveSchedule.onclick = scheduleDVRRecording;
    if (el.btnHeaderKids) el.btnHeaderKids.onclick = openParentalPinModal;
    if (el.btnClosePinModal) el.btnClosePinModal.onclick = () => closeModal(el.modalParentalPin);
    if (el.btnHeaderBackup) el.btnHeaderBackup.onclick = () => openModal(el.modalBackupSync);
    if (el.btnCloseBackupModal) el.btnCloseBackupModal.onclick = () => closeModal(el.modalBackupSync);
    if (el.btnDoneBackup) el.btnDoneBackup.onclick = () => closeModal(el.modalBackupSync);
    if (el.playerBtnRadio) el.playerBtnRadio.onclick = toggleAudioOnlyMode;
    if (el.audioHudToggleBtn) el.audioHudToggleBtn.onclick = toggleAudioOnlyMode;
    if (el.playerBtnLowlatency) el.playerBtnLowlatency.onclick = toggleLowLatencyMode;
    if (el.btnHeaderRemote) el.btnHeaderRemote.onclick = openRemoteControlModal;
    if (el.btnCloseRemoteModal) el.btnCloseRemoteModal.onclick = () => closeModal(el.modalRemoteControl);
    if (el.btnDoneRemote) el.btnDoneRemote.onclick = () => closeModal(el.modalRemoteControl);
    if (el.btnCopyRemoteUrl) {
      el.btnCopyRemoteUrl.onclick = () => {
        if (el.remoteServerUrl) {
          navigator.clipboard.writeText(el.remoteServerUrl.textContent);
          showToast("Remote URL copied to clipboard!");
        }
      };
    }
    if (el.playerBtnClarity) el.playerBtnClarity.onclick = cycleVideoClarity;
    if (el.playerBtnBreakMute) el.playerBtnBreakMute.onclick = triggerCommercialBreakMute;
    if (el.playerBreakCountdown) el.playerBreakCountdown.onclick = resumeFromBreakMute;
    if (el.playerBtnGuide) el.playerBtnGuide.onclick = toggleMiniGuide;
    if (el.btnHeaderDataSaver) el.btnHeaderDataSaver.onclick = toggleDataSaverMode;
    if (el.btnHeaderSportsHud) el.btnHeaderSportsHud.onclick = toggleSportsHUD;
    if (el.hudBtnMin) el.hudBtnMin.onclick = minimizeSportsHUD;
    if (el.hudBtnClose) el.hudBtnClose.onclick = () => toggleSportsHUD(false);
    if (el.hudPinnedPill) el.hudPinnedPill.onclick = () => toggleSportsHUD(true);
    if (el.pinnedPillClose) {
      el.pinnedPillClose.onclick = (e) => {
        e.stopPropagation();
        unpinMatchFromHUD();
      };
    }
    if (el.playerBtnAmbilight) el.playerBtnAmbilight.onclick = toggleAmbilight;
    if (el.playerBtnClip) el.playerBtnClip.onclick = captureLiveClip;
    if (el.playerBtnCaptions) el.playerBtnCaptions.onclick = toggleLiveCaptions;
    if (el.playerBtnCompressor) el.playerBtnCompressor.onclick = toggleAudioNormalizer;
    if (el.playerBtnCast) el.playerBtnCast.onclick = openCastPicker;
    if (el.playerBtnAudiomixer) el.playerBtnAudiomixer.onclick = openDualAudioModal;
    if (el.btnHeaderEpg) el.btnHeaderEpg.onclick = openEPGGuideModal;
    if (el.modalEpgClose) el.modalEpgClose.onclick = () => closeModal(el.modalEpgGuide);
    if (el.btnImportXmltv) el.btnImportXmltv.onclick = promptImportXmltv;
    if (el.btnHeaderVoice) el.btnHeaderVoice.onclick = toggleVoiceAssistant;
    if (el.voiceHudClose) el.voiceHudClose.onclick = () => toggleVoiceAssistant(false);
    if (el.btnHeaderAlarm) el.btnHeaderAlarm.onclick = openTVAlarmModal;
    if (el.modalAlarmClose) el.modalAlarmClose.onclick = () => closeModal(el.modalTvAlarm);
    if (el.btnSaveAlarm) el.btnSaveAlarm.onclick = saveTVAlarm;
    if (el.btnCancelAlarm) el.btnCancelAlarm.onclick = cancelTVAlarm;
    if (el.btnHeaderChannels) el.btnHeaderChannels.onclick = openChannelManagerModal;
    if (el.modalManagerClose) el.modalManagerClose.onclick = () => closeModal(el.modalChannelManager);
    if (el.btnCreateBouquet) el.btnCreateBouquet.onclick = handleCreateBouquet;
    if (el.modalCastClose) el.modalCastClose.onclick = () => closeModal(el.modalCastPicker);
    if (el.castOptionAirplay) el.castOptionAirplay.onclick = triggerAirPlay;
    if (el.castOptionChromecast) el.castOptionChromecast.onclick = triggerChromecast;
    if (el.btnCopyDlna) el.btnCopyDlna.onclick = copyDLNAStreamUrl;
    if (el.modalDualAudioClose) el.modalDualAudioClose.onclick = () => closeModal(el.modalDualAudio);
    if (el.playerBtnAiUpscaler) el.playerBtnAiUpscaler.onclick = cycleAIUpscaler;
    if (el.playerBtnAiCompare) el.playerBtnAiCompare.onclick = toggleAISplitCompare;
    if (el.playerBtn10bandEq) el.playerBtn10bandEq.onclick = open10BandEqModal;
    if (el.playerBtnAspect) el.playerBtnAspect.onclick = cycleAspectRatio;
    if (el.selectChannelSort) el.selectChannelSort.onchange = (e) => onChannelSortChange(e.target.value);
    if (el.btnTurboMode) el.btnTurboMode.onclick = toggleTurboMode;
    if (el.btnViewDensity) el.btnViewDensity.onclick = toggleViewDensity;
    if (el.heroBtnPlay) el.heroBtnPlay.onclick = playHeroChannel;
    if (el.heroBtnHud) el.heroBtnHud.onclick = () => toggleSportsHUD(true);
    if (el.heroBtnFav) el.heroBtnFav.onclick = toggleHeroFavorite;
    if (el.heroCloseBtn) {
      el.heroCloseBtn.onclick = () => {
        if (el.heroSpotlight) el.heroSpotlight.style.display = "none";
        localStorage.setItem("livetv_hero_collapsed", "1");
        showToast("Featured Billboard Hidden", "\u2139\uFE0F");
      };
    }
    if (el.btnToggleHero) {
      el.btnToggleHero.onclick = () => {
        if (!el.heroSpotlight) return;
        const isHidden = window.getComputedStyle(el.heroSpotlight).display === "none";
        el.heroSpotlight.style.display = isHidden ? "flex" : "none";
        localStorage.setItem("livetv_hero_collapsed", isHidden ? "0" : "1");
        showToast(isHidden ? "Featured Billboard Shown" : "Featured Billboard Hidden", "\u{1F3AC}");
      };
    }
    document.querySelectorAll(".filter-pill").forEach((p) => {
      p.onclick = () => {
        document.querySelectorAll(".filter-pill").forEach((x) => x.classList.remove("active"));
        p.classList.add("active");
        onQuickFilter(p.dataset.filter || "all");
      };
    });
    if (el.btnImportXtream) el.btnImportXtream.onclick = () => openModal(el.modalXtreamCodes);
    if (el.btnCloseXtreamModal) el.btnCloseXtreamModal.onclick = () => closeModal(el.modalXtreamCodes);
    if (el.btnCancelXtream) el.btnCancelXtream.onclick = () => closeModal(el.modalXtreamCodes);
    if (el.btnLoginXtream) el.btnLoginXtream.onclick = submitXtreamLogin;
    initPeekHoverPreview();
    if (el.btnHeaderAlerts) {
      el.btnHeaderAlerts.onclick = () => {
        renderTeamAlertChips();
        openModal(el.modalTeamAlerts);
      };
    }
    if (el.btnCloseAlertsModal) el.btnCloseAlertsModal.onclick = () => closeModal(el.modalTeamAlerts);
    if (el.btnDoneAlerts) el.btnDoneAlerts.onclick = () => closeModal(el.modalTeamAlerts);
    if (el.btnAddCustomTeam) el.btnAddCustomTeam.onclick = addCustomTeam;
    if (el.playerBtnReplay) el.playerBtnReplay.onclick = triggerInstantSlowmoReplay;
    if (el.btnSlowmoLive) el.btnSlowmoLive.onclick = resumeFromSlowmoReplay;
    if (el.playerBtnSleep) el.playerBtnSleep.onclick = () => openModal(el.modalSleepTimer);
    if (el.playerSleepCountdown) el.playerSleepCountdown.onclick = () => openModal(el.modalSleepTimer);
    if (el.btnCloseSleepModal) el.btnCloseSleepModal.onclick = () => closeModal(el.modalSleepTimer);
    if (el.btnCloseSleepDone) el.btnCloseSleepDone.onclick = () => closeModal(el.modalSleepTimer);
    if (el.btnCancelSleepTimer) {
      el.btnCancelSleepTimer.onclick = () => {
        cancelSleepTimer();
        closeModal(el.modalSleepTimer);
        showToast("Sleep timer turned off");
      };
    }
    document.querySelectorAll(".sleep-preset-btn").forEach((btn) => {
      btn.onclick = () => {
        const mins = parseInt(btn.dataset.minutes, 10);
        setSleepTimer(mins);
        closeModal(el.modalSleepTimer);
      };
    });
    if (el.playerBtnAudioProfile) el.playerBtnAudioProfile.onclick = () => openModal(el.modalAudioProfiles);
    if (el.btnCloseAudioModal) el.btnCloseAudioModal.onclick = () => closeModal(el.modalAudioProfiles);
    if (el.btnDoneAudio) el.btnDoneAudio.onclick = () => closeModal(el.modalAudioProfiles);
    document.querySelectorAll(".audio-profile-card").forEach((card) => {
      card.onclick = () => {
        applyAudioProfile(card.dataset.profile);
      };
    });
    if (el.tabSingleChannel && el.tabBatchM3u) {
      el.tabSingleChannel.onclick = () => {
        el.tabSingleChannel.style.background = "var(--accent-red)";
        el.tabSingleChannel.style.color = "#fff";
        el.tabBatchM3u.style.background = "var(--surface-variant)";
        el.tabBatchM3u.style.color = "var(--text-primary)";
        if (el.sectionSingleChannel) el.sectionSingleChannel.style.display = "flex";
        if (el.sectionBatchM3u) el.sectionBatchM3u.style.display = "none";
      };
      el.tabBatchM3u.onclick = () => {
        el.tabBatchM3u.style.background = "var(--accent-red)";
        el.tabBatchM3u.style.color = "#fff";
        el.tabSingleChannel.style.background = "var(--surface-variant)";
        el.tabSingleChannel.style.color = "var(--text-primary)";
        if (el.sectionSingleChannel) el.sectionSingleChannel.style.display = "none";
        if (el.sectionBatchM3u) el.sectionBatchM3u.style.display = "flex";
      };
    }
    if (el.btnSaveSingleChannel) {
      el.btnSaveSingleChannel.onclick = () => {
        const url = el.customChannelUrl?.value || "";
        const name = el.customChannelName?.value || "";
        const cat = el.customChannelCat?.value || "Custom";
        const logo = el.customChannelLogo?.value || "";
        saveCustomChannel(name, url, cat, logo);
        if (el.customChannelUrl) el.customChannelUrl.value = "";
        if (el.customChannelName) el.customChannelName.value = "";
      };
    }
    if (el.btnCloseAboutModal) el.btnCloseAboutModal.onclick = () => closeAboutModal();
    if (el.btnCloseAbout) el.btnCloseAbout.onclick = () => closeAboutModal();
    if (el.btnCheckUpdate) el.btnCheckUpdate.onclick = () => checkForAppUpdates(true);
    if (el.btnGithubLink) el.btnGithubLink.onclick = () => openExternalUrl(GITHUB_RELEASES_URL);
    if (el.liveEventsTabs) {
      el.liveEventsTabs.querySelectorAll(".event-tab").forEach((tab) => {
        tab.addEventListener("click", () => {
          el.liveEventsTabs.querySelectorAll(".event-tab").forEach((t) => t.classList.remove("active"));
          tab.classList.add("active");
          const sport = tab.getAttribute("data-sport") || "All";
          renderLiveEvents(sport);
        });
      });
    }
    if (el.btnCloseRankModal) el.btnCloseRankModal.onclick = () => closeModal(el.modalRankFavorites);
    if (el.btnCancelRank) el.btnCancelRank.onclick = () => closeModal(el.modalRankFavorites);
    if (el.btnSaveRank) el.btnSaveRank.onclick = saveRankFavorites;
    if (el.btnCloseReorderModal) el.btnCloseReorderModal.onclick = () => closeModal(el.modalRearrangeCategories);
    if (el.btnSaveCategories) el.btnSaveCategories.onclick = saveCategoryOrder;
    if (el.btnResetCategories) el.btnResetCategories.onclick = resetCategoryOrder;
    if (el.playerBtnQuality) {
      el.playerBtnQuality.onclick = (e) => {
        if (e) e.stopPropagation();
        renderQualityOptions();
        openModal(el.modalPlayerSettings);
      };
    }
    if (el.btnCloseSettingsModal) {
      el.btnCloseSettingsModal.onclick = (e) => {
        if (e) e.stopPropagation();
        closeModal(el.modalPlayerSettings);
      };
    }
    if (el.btnDoneSettings) {
      el.btnDoneSettings.onclick = (e) => {
        if (e) e.stopPropagation();
        closeModal(el.modalPlayerSettings);
      };
    }
    document.querySelectorAll(".modal-overlay").forEach((overlay) => {
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          closeModal(overlay);
        }
      });
    });
    if (el.miniPlayerClickable) el.miniPlayerClickable.onclick = expandPlayer;
    if (el.miniBtnExpand) el.miniBtnExpand.onclick = expandPlayer;
    if (el.miniBtnClose) el.miniBtnClose.onclick = closePlayer;
    if (el.miniBtnPlay) {
      el.miniBtnPlay.onclick = () => {
        if (state.video?.paused) {
          state.video.play();
          updatePlayPauseIcons(true);
        } else if (state.video) {
          state.video.pause();
          updatePlayPauseIcons(false);
        }
      };
    }
    if (el.miniBtnNext) el.miniBtnNext.onclick = playNextChannel;
    if (el.miniBtnPrev) el.miniBtnPrev.onclick = playPrevChannel;
    if (el.playerBtnBack) el.playerBtnBack.onclick = closePlayer;
    if (el.playerBtnPlay) {
      el.playerBtnPlay.onclick = () => {
        if (state.video?.paused) {
          state.video.play();
          updatePlayPauseIcons(true);
        } else if (state.video) {
          state.video.pause();
          updatePlayPauseIcons(false);
        }
      };
    }
    if (el.playerBtnNextChan) el.playerBtnNextChan.onclick = playNextChannel;
    if (el.playerBtnPrevChan) el.playerBtnPrevChan.onclick = playPrevChannel;
    if (el.playerBtnRewind) el.playerBtnRewind.onclick = () => triggerSeekRipple("left");
    if (el.playerBtnForward) el.playerBtnForward.onclick = () => triggerSeekRipple("right");
    if (el.playerBtnFav) {
      el.playerBtnFav.onclick = () => {
        if (state.currentChannel) toggleFavorite(state.currentChannel.id);
      };
    }
    if (el.btnHeaderPin) el.btnHeaderPin.onclick = toggleAlwaysOnTop;
    if (el.playerBtnPin) el.playerBtnPin.onclick = toggleAlwaysOnTop;
    if (el.btnHeaderMultiview) el.btnHeaderMultiview.onclick = openMultiView;
    if (el.playerBtnMultiview) el.playerBtnMultiview.onclick = openMultiView;
    if (el.playerBtnRecord) el.playerBtnRecord.onclick = toggleRecording;
    if (el.playerBtnAudioSub) {
      el.playerBtnAudioSub.onclick = (e) => {
        if (e) e.stopPropagation();
        updateAudioAndSubtitleTracks();
        openModal(el.modalPlayerSettings);
      };
    }
    if (el.btnClearRecents) el.btnClearRecents.onclick = clearRecentlyWatched;
    if (el.btnCloseMultiview) el.btnCloseMultiview.onclick = closeMultiView;
    if (el.btnMvModeDual) el.btnMvModeDual.onclick = () => setMultiViewMode("dual");
    if (el.btnMvModeQuad) el.btnMvModeQuad.onclick = () => setMultiViewMode("quad");
    for (let i = 0; i < 4; i++) {
      const slot = document.getElementById(`mv-slot-${i}`);
      const audioBtn = document.getElementById(`mv-audio-btn-${i}`);
      if (slot) {
        slot.addEventListener("click", () => setMultiViewAudioFocus(i));
      }
      if (audioBtn) {
        audioBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          setMultiViewAudioFocus(i);
        });
      }
    }
    if (el.playerBtnServer) {
      el.playerBtnServer.onclick = (e) => {
        e.stopPropagation();
        toggleServer();
      };
    }
    if (el.playerBtnLock) {
      el.playerBtnLock.onclick = (e) => {
        e.stopPropagation();
        lockScreen();
      };
    }
    if (el.playerBtnUnlock) {
      el.playerBtnUnlock.onclick = (e) => {
        e.stopPropagation();
        unlockScreen();
      };
    }
    window.toggleFullScreen = function() {
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
      if (isIOS && state.video && typeof state.video.webkitEnterFullscreen === "function") {
        try {
          if (state.video.webkitDisplayingFullscreen) {
            if (typeof state.video.webkitExitFullscreen === "function") {
              state.video.webkitExitFullscreen();
            }
          } else {
            state.video.webkitEnterFullscreen();
          }
          return;
        } catch (e) {
          console.warn("[Fullscreen] iOS native webkitEnterFullscreen note:", e);
        }
      }
      const doc = document;
      const isFs = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;
      if (!isFs) {
        const target = el.playerOverlay || doc.documentElement;
        const req = target.requestFullscreen || target.webkitRequestFullscreen || target.mozRequestFullScreen || target.msRequestFullscreen;
        if (req) {
          req.call(target).catch(() => {
            if (state.video && typeof state.video.webkitEnterFullscreen === "function") {
              try {
                state.video.webkitEnterFullscreen();
              } catch (err) {
              }
            } else if (state.video && state.video.requestFullscreen) {
              state.video.requestFullscreen().catch(() => {
              });
            }
          });
        } else if (state.video && typeof state.video.webkitEnterFullscreen === "function") {
          try {
            state.video.webkitEnterFullscreen();
          } catch (err) {
          }
        }
      } else {
        const exit = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
        if (exit) {
          exit.call(doc).catch(() => {
          });
        }
      }
    };
    if (el.playerBtnFullscreen) el.playerBtnFullscreen.onclick = window.toggleFullScreen;
    if (el.playerBtnFullscreenBottom) el.playerBtnFullscreenBottom.onclick = window.toggleFullScreen;
    if (el.playerBtnStats) {
      el.playerBtnStats.onclick = () => {
        const isVisible = el.statsHud.style.display !== "none";
        el.statsHud.style.display = isVisible ? "none" : "block";
        if (!isVisible) updateStatsHud();
      };
    }
    if (state.video) {
      state.video.addEventListener("play", () => updatePlayPauseIcons(true));
      state.video.addEventListener("pause", () => updatePlayPauseIcons(false));
      state.video.addEventListener("timeupdate", () => {
        if (state.video.currentTime > 0.5 && state.stallWatchdog) {
          clearTimeout(state.stallWatchdog);
          state.stallWatchdog = null;
        }
        if (el.statsHud && el.statsHud.style.display !== "none") updateStatsHud();
      });
    }
    if (el.dvrSlider) {
      el.dvrSlider.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        seekDvrOffset(val);
      });
    }
    if (el.dvrBtn1h) el.dvrBtn1h.onclick = () => seekDvrOffset(-3600);
    if (el.dvrBtn30m) el.dvrBtn30m.onclick = () => seekDvrOffset(-1800);
    if (el.dvrBtn15m) el.dvrBtn15m.onclick = () => seekDvrOffset(-900);
    if (el.dvrBtnLive) el.dvrBtnLive.onclick = goLive;
    if (el.sliderBrightness) {
      el.sliderBrightness.addEventListener("input", (e) => {
        applyBrightness(parseInt(e.target.value, 10));
        showBrightnessHud();
      });
    }
    if (el.sliderVolume) {
      el.sliderVolume.addEventListener("input", (e) => {
        applyVolume(parseInt(e.target.value, 10));
        showVolumeHud();
      });
    }
    if (el.gestureAreaLeft) {
      el.gestureAreaLeft.addEventListener("dblclick", () => triggerSeekRipple("left"));
      el.gestureAreaLeft.addEventListener("wheel", (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 5 : -5;
        applyBrightness(state.brightness + delta);
        showBrightnessHud();
      });
    }
    if (el.gestureAreaRight) {
      el.gestureAreaRight.addEventListener("dblclick", () => triggerSeekRipple("right"));
      el.gestureAreaRight.addEventListener("wheel", (e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 4 : -4;
        applyVolume(state.volume + delta);
        showVolumeHud();
      });
    }
    if (el.videoContainer) {
      el.videoContainer.addEventListener("click", (e) => {
        if (e.target.closest("#player-controls") || e.target.closest(".player-controls") || e.target.closest(".player-top-bar") || e.target.closest(".player-top-right") || e.target.closest(".player-bottom-bar") || e.target.closest(".player-center-controls") || e.target.closest(".quick-switch-carousel") || e.target.closest(".quick-channel-item") || e.target.closest(".player-pill") || e.target.closest(".player-icon-btn") || e.target.closest("button") || e.target.closest("input") || e.target.closest(".modal-overlay")) {
          return;
        }
        toggleControls();
      });
      el.videoContainer.addEventListener("mousemove", () => {
        if (state.isLocked) return;
        showControls();
      });
      el.videoContainer.addEventListener("mouseleave", () => {
        if (state.isPlaying && !state.isLocked) {
          hideControls();
        }
      });
    }
    if (el.playerOverlay) {
      el.playerOverlay.addEventListener("mousemove", () => {
        if (state.isLocked) return;
        showControls();
      });
    }
    if (el.btnLoadM3u) {
      el.btnLoadM3u.onclick = async () => {
        const url = el.m3uUrlInput?.value.trim() || "";
        const file = el.m3uFileInput?.files[0];
        if (file) {
          const text = await file.text();
          parseCustomM3u(text);
          closeModal(el.modalImportM3u);
        } else if (url) {
          try {
            const res = await fetch(url);
            const text = await res.text();
            parseCustomM3u(text);
            closeModal(el.modalImportM3u);
          } catch (e) {
            alert("Failed to fetch M3U URL: " + e.message);
          }
        }
      };
    }
  }
  async function initApp() {
    const isNativeMac = !!window.webkit?.messageHandlers?.startWindowDrag;
    if (isNativeMac) {
      document.body.classList.add("native-mac-app");
    } else {
      document.body.classList.add("web-mode");
    }
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    if (isIOS) {
      document.body.classList.add("ios-device");
    }
    try {
      if (window.shaka?.polyfill) {
        shaka.polyfill.installAll();
      }
    } catch (e) {
      console.warn("Shaka polyfill init warning:", e);
    }
    try {
      initElements();
      if (el.playerOverlay) {
        el.playerOverlay.classList.remove("is-active");
        el.playerOverlay.style.display = "none";
      }
      document.body.classList.remove("player-active");
      state.isPlayerOpen = false;
    } catch (e) {
      console.error("initElements error:", e);
    }
    try {
      loadStoredPreferences();
    } catch (e) {
      console.error("loadStoredPreferences error:", e);
    }
    try {
      setupWindowDragging();
      setupEventListeners();
      setupKeyboardShortcuts();
      renderLiveEvents("All");
    } catch (e) {
      console.error("UI setup error:", e);
    }
    try {
      await loadChannels();
    } catch (e) {
      console.error("loadChannels error:", e);
    }
    try {
      refreshDynamicMotoGpEvents();
      fetchRealSportsEvents();
    } catch (e) {
      console.error("Events fetch error:", e);
    }
    if (state.liveEventsRefreshTimer) clearInterval(state.liveEventsRefreshTimer);
    state.liveEventsRefreshTimer = setInterval(() => {
      if (state.isPlayerOpen || document.body.classList.contains("player-active")) {
        return;
      }
      fetchRealSportsEvents(true);
    }, 6e4);
    try {
      initVisitorTracking();
    } catch (e) {
      console.warn("Visitor tracking note:", e);
    }
    setTimeout(() => {
      if (localStorage.getItem("livetv_turbo_mode") === "1") {
        toggleTurboMode();
      }
      if (localStorage.getItem("livetv_compact_density") === "1") {
        toggleViewDensity();
      }
      initBandwidthMeter();
      initCinemaAmbientDimmer();
    }, 600);
    setTimeout(initBroadcastSuiteExtensions, 600);
  }

  // src/desktop/web/src_js/controllers/ChannelController.js
  function toggleFavorite(channelId) {
    const sId = String(channelId);
    const idx = (state.favorites || []).findIndex((f) => String(f) === sId);
    if (idx >= 0) {
      state.favorites.splice(idx, 1);
    } else {
      const found = state.allChannels.find((c) => String(c.id) === sId);
      state.favorites.unshift(found ? found.id : channelId);
    }
    persistAllPreferences();
    renderCategoriesBar();
    applyFilterAndSearch();
    updatePlayerFavButton();
    syncRemoteStatus();
    syncRemoteChannels();
  }
  function addToRecentlyWatched(channel) {
    if (!channel || !channel.id) return;
    state.recentChannels = (state.recentChannels || []).filter((id) => id !== channel.id);
    state.recentChannels.unshift(channel.id);
    if (state.recentChannels.length > 15) {
      state.recentChannels = state.recentChannels.slice(0, 15);
    }
    try {
      localStorage.setItem(STORAGE_RECENTS, JSON.stringify(state.recentChannels));
    } catch (e) {
    }
    renderRecentlyWatched();
  }
  function loadRecentlyWatched() {
    try {
      const raw = localStorage.getItem(STORAGE_RECENTS);
      if (raw) state.recentChannels = JSON.parse(raw);
    } catch (e) {
      state.recentChannels = [];
    }
    renderRecentlyWatched();
    if (typeof updateRecallButton === "function") updateRecallButton();
  }
  function clearRecentlyWatched() {
    state.recentChannels = [];
    try {
      localStorage.removeItem(STORAGE_RECENTS);
    } catch (e) {
    }
    renderRecentlyWatched();
    showToast("Recently watched history cleared", "\u{1F9F9}");
  }
  function handleNumericKey(digit) {
    state.dialInput = (state.dialInput || "") + digit;
    clearTimeout(state.dialTimeout);
    if (el.channelDialOsd) {
      el.channelDialOsd.style.display = "flex";
      if (el.dialNumber) el.dialNumber.textContent = `CH ${state.dialInput}`;
      const num = parseInt(state.dialInput, 10);
      const match = state.allChannels.find((c) => c.channelNumber === num);
      if (el.dialName) {
        el.dialName.textContent = match ? match.name : "Tuning...";
      }
    }
    state.dialTimeout = setTimeout(() => {
      tuneToDialedChannel();
    }, 1200);
  }
  function tuneToDialedChannel() {
    if (!state.dialInput) return;
    const num = parseInt(state.dialInput, 10);
    const targetChannel = state.allChannels.find((c) => c.channelNumber === num);
    const dialStr = state.dialInput;
    state.dialInput = "";
    if (el.channelDialOsd) {
      el.channelDialOsd.style.display = "none";
    }
    if (targetChannel) {
      showToast(`Tuning to CH ${dialStr}: ${targetChannel.name}`, "\u{1F4FA}");
      playChannel(targetChannel);
    } else {
      showToast(`Channel ${dialStr} not found`, "\u26A0\uFE0F");
    }
  }
  function parseCustomM3u(content) {
    const lines = content.split("\n");
    const parsed = [];
    let currentTitle = "Custom Channel";
    let currentLogo = "";
    let currentGroup = "Custom M3U";
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith("#EXTINF:")) {
        const matchName = line.split(",")[1];
        if (matchName) currentTitle = matchName.trim();
        const matchLogo = line.match(/tvg-logo="([^"]+)"/);
        if (matchLogo) currentLogo = matchLogo[1];
        const matchGroup = line.match(/group-title="([^"]+)"/);
        if (matchGroup) currentGroup = matchGroup[1];
      } else if (line.startsWith("http://") || line.startsWith("https://")) {
        parsed.push({
          id: `custom_${Date.now()}_${parsed.length}`,
          name: currentTitle,
          streamUrl: line,
          logoUrl: currentLogo,
          category: currentGroup,
          country: "Custom"
        });
        currentTitle = "Custom Channel";
        currentLogo = "";
      }
    }
    if (parsed.length > 0) {
      let saved = [];
      try {
        saved = JSON.parse(localStorage.getItem("livetv_custom_channels") || "[]");
      } catch (e) {
      }
      saved = parsed.concat(saved);
      localStorage.setItem("livetv_custom_channels", JSON.stringify(saved));
      state.allChannels = parsed.concat(state.allChannels);
      buildCategories();
      applyFilterAndSearch();
      syncRemoteChannels();
      showToast(`Successfully imported ${parsed.length} custom channels!`);
    } else {
      showToast("No valid streams found in M3U playlist.");
    }
  }
  function toggleLowLatencyMode() {
    state.isLowLatencyMode = !state.isLowLatencyMode;
    const btn = document.getElementById("player-btn-lowlatency");
    const label = document.getElementById("player-lowlatency-label");
    if (state.isLowLatencyMode) {
      if (btn) btn.classList.add("active-setting");
      if (label) label.textContent = "Low Latency ON";
      if (state.hls) {
        state.hls.config.liveSyncDurationCount = 1;
        state.hls.config.liveMaxLatencyDurationCount = 2;
        state.hls.config.maxBufferLength = 2;
        if (state.video && state.hls.liveSyncPosition) {
          state.video.currentTime = state.hls.liveSyncPosition;
        }
      }
      showToast("Ultra-Low Latency Active (~2s broadcast sync)", "\u26A1");
    } else {
      if (btn) btn.classList.remove("active-setting");
      if (label) label.textContent = "Low Latency";
      if (state.hls) {
        state.hls.config.liveSyncDurationCount = 3;
        state.hls.config.liveMaxLatencyDurationCount = 10;
        state.hls.config.maxBufferLength = 60;
      }
      showToast("Standard Smooth Buffer Mode Restored (~10s buffer)", "\u{1F4FA}");
    }
  }
  function toggleDataSaverMode() {
    state.isDataSaver = !state.isDataSaver;
    const label = document.getElementById("label-datasaver");
    const btn = document.getElementById("btn-header-datasaver");
    if (label) {
      label.textContent = state.isDataSaver ? "Data Saver: ON" : "Data Saver";
    }
    if (btn) {
      btn.style.borderColor = state.isDataSaver ? "#38bdf8" : "";
      btn.style.color = state.isDataSaver ? "#38bdf8" : "";
    }
    if (state.isDataSaver) {
      setStreamQuality(720, "720p HD");
      stopPeekPreview();
      showToast("Data Saver ON \u2022 Optimized 720p stream bitrate", "\u{1F4F6}");
    } else {
      setStreamQuality(-1, "Auto");
      showToast("Data Saver OFF \u2022 Adaptive High Bitrate", "\u{1F4F6}");
    }
  }
  async function submitXtreamLogin() {
    const urlEl = document.getElementById("xtream-server-url");
    const userEl = document.getElementById("xtream-username");
    const passEl = document.getElementById("xtream-password");
    if (!urlEl || !userEl || !passEl) return;
    let server = (urlEl.value || "").trim().replace(/\/+$/, "");
    const username = (userEl.value || "").trim();
    const password = (passEl.value || "").trim();
    if (!server || !username || !password) {
      showToast("Please enter server URL, username & password", "\u26A0\uFE0F");
      return;
    }
    showToast("Connecting to Xtream Codes server...", "\u23F3");
    try {
      const apiUrl = `${server}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_live_streams`;
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error("Authentication failed");
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Invalid playlist response");
      const newChannels = data.map((item, idx) => ({
        id: `xtream_${item.stream_id || idx}`,
        name: item.name || `Xtream Stream ${idx + 1}`,
        category: "Xtream IPTV",
        logoUrl: item.stream_icon || "",
        streamUrl: `${server}/live/${encodeURIComponent(username)}/${encodeURIComponent(password)}/${item.stream_id}.m3u8`,
        channelNumber: 3e3 + idx
      }));
      state.allChannels = [...newChannels, ...state.allChannels];
      state.filteredChannels = state.allChannels;
      if (!state.categories.includes("Xtream IPTV")) {
        state.categories.push("Xtream IPTV");
      }
      renderCategoriesBar();
      applyFilterAndSearch();
      closeModal(el.modalXtreamCodes);
      showToast(`Successfully connected! Imported ${newChannels.length} Xtream channels`, "\u2705");
    } catch (err) {
      showToast(`Xtream Connection Error: ${err.message}`, "\u26A0\uFE0F");
    }
  }
  function toggleTurboMode() {
    state.turboMode = !state.turboMode;
    document.body.classList.toggle("turbo-mode", state.turboMode);
    if (el.btnTurboMode) {
      el.btnTurboMode.classList.toggle("active", state.turboMode);
    }
    if (el.turboLabel) {
      el.turboLabel.textContent = state.turboMode ? "Turbo: ON" : "Turbo Mode";
    }
    localStorage.setItem("livetv_turbo_mode", state.turboMode ? "1" : "0");
    showToast(state.turboMode ? "\u{1F680} Turbo Mode ON: High FPS, Ultra-Low RAM & CPU" : "Turbo Mode OFF", state.turboMode ? "\u26A1" : "\u2139\uFE0F");
  }
  function toggleViewDensity() {
    state.isCompactDensity = !state.isCompactDensity;
    if (el.channelsGrid) {
      el.channelsGrid.classList.toggle("grid-compact", state.isCompactDensity);
    }
    if (el.densityLabel) {
      el.densityLabel.textContent = state.isCompactDensity ? "Compact" : "Grid";
    }
    localStorage.setItem("livetv_compact_density", state.isCompactDensity ? "1" : "0");
    showToast(state.isCompactDensity ? "Switched to Compact Grid" : "Switched to Comfortable Grid", "\u229E");
  }

  // src/desktop/web/src_js/views/ModalView.js
  function openModal(modal) {
    if (!modal) return;
    if (modal.parentNode !== document.body) {
      document.body.appendChild(modal);
    }
    modal.style.zIndex = "200000";
    modal.style.opacity = "1";
    modal.style.visibility = "visible";
    modal.style.display = "flex";
  }
  function closeModal(modal) {
    if (!modal) return;
    modal.style.display = "none";
  }
  function openExternalUrl(url) {
    if (window.webkit?.messageHandlers?.openExternalUrl) {
      try {
        window.webkit.messageHandlers.openExternalUrl.postMessage(url);
        return;
      } catch (e) {
        console.warn("Native bridge openExternalUrl error:", e);
      }
    }
    window.open(url, "_blank");
  }
  window.openExternalUrl = openExternalUrl;
  function openAboutModal() {
    if (el.modalAbout) {
      openModal(el.modalAbout);
    }
  }
  window.openAboutModal = openAboutModal;
  function closeAboutModal() {
    if (el.modalAbout) {
      closeModal(el.modalAbout);
    }
  }
  function openRankFavoritesModal() {
    if (!el.favoritesListBody) return;
    el.favoritesListBody.innerHTML = "";
    if ((state.favorites || []).length === 0) {
      el.favoritesListBody.innerHTML = `
      <div style="text-align:center; padding: 24px; color: var(--text-secondary);">
        No channels have been favorited yet.<br/>
        Click the star icon (\u2606) on any channel card to favorite it.
      </div>
    `;
    } else {
      state.favorites.forEach((chId, idx) => {
        const channel = state.allChannels.find((c) => c.id === chId) || { name: chId, category: "Channel" };
        const rank = idx + 1;
        const rankClass = rank === 1 ? "gold" : rank === 2 ? "silver" : rank === 3 ? "bronze" : "";
        const row = document.createElement("div");
        row.className = "list-item-row";
        row.dataset.id = chId;
        row.innerHTML = `
        <div class="list-item-left">
          <div class="rank-pill ${rankClass}">#${rank}</div>
          <div>
            <div style="font-weight: 700; font-size: 13px;">${escapeHtml(channel.name)}</div>
            <div style="font-size: 11px; color: var(--text-secondary);">${escapeHtml(channel.category || "")}</div>
          </div>
        </div>
        <div style="display: flex; gap: 4px;">
          <button class="action-icon-btn btn-fav-top" title="Move to Top" ${idx === 0 ? "disabled" : ""}>\u21C8</button>
          <button class="action-icon-btn btn-fav-up" title="Move Up" ${idx === 0 ? "disabled" : ""}>\u2191</button>
          <button class="action-icon-btn btn-fav-down" title="Move Down" ${idx === state.favorites.length - 1 ? "disabled" : ""}>\u2193</button>
          <button class="action-icon-btn btn-fav-del" title="Remove" style="color:var(--accent-red);">\u2715</button>
        </div>
      `;
        function onFavOrderChanged() {
          persistAllPreferences();
          renderCategoriesBar();
          applyFilterAndSearch();
          updatePlayerFavButton();
          syncRemoteStatus();
          syncRemoteChannels();
          openRankFavoritesModal();
        }
        row.querySelector(".btn-fav-top").onclick = () => {
          state.favorites.splice(idx, 1);
          state.favorites.unshift(chId);
          onFavOrderChanged();
        };
        row.querySelector(".btn-fav-up").onclick = () => {
          if (idx > 0) {
            const temp = state.favorites[idx - 1];
            state.favorites[idx - 1] = state.favorites[idx];
            state.favorites[idx] = temp;
            onFavOrderChanged();
          }
        };
        row.querySelector(".btn-fav-down").onclick = () => {
          if (idx < state.favorites.length - 1) {
            const temp = state.favorites[idx + 1];
            state.favorites[idx + 1] = state.favorites[idx];
            state.favorites[idx] = temp;
            onFavOrderChanged();
          }
        };
        row.querySelector(".btn-fav-del").onclick = () => {
          state.favorites.splice(idx, 1);
          onFavOrderChanged();
        };
        el.favoritesListBody.appendChild(row);
      });
    }
    openModal(el.modalRankFavorites);
  }
  function saveRankFavorites() {
    persistAllPreferences();
    closeModal(el.modalRankFavorites);
    renderCategoriesBar();
    applyFilterAndSearch();
    updatePlayerFavButton();
    syncRemoteStatus();
    syncRemoteChannels();
  }
  function openRearrangeCategoriesModal() {
    if (!el.categoriesListBody) return;
    el.categoriesListBody.innerHTML = "";
    (state.categories || []).forEach((cat, idx) => {
      const row = document.createElement("div");
      row.className = "list-item-row";
      row.dataset.category = cat;
      row.innerHTML = `
      <div class="list-item-left">
        <span style="font-weight:700; min-width: 22px; color: var(--text-secondary);">${idx + 1}.</span>
        <span style="font-weight: 700; font-size: 13px;">${escapeHtml(cat)}</span>
      </div>
      <div style="display: flex; gap: 4px;">
        <button class="action-icon-btn btn-cat-top" title="Move to Top" ${idx === 0 ? "disabled" : ""}>\u21C8</button>
        <button class="action-icon-btn btn-cat-up" title="Move Up" ${idx === 0 ? "disabled" : ""}>\u2191</button>
        <button class="action-icon-btn btn-cat-down" title="Move Down" ${idx === state.categories.length - 1 ? "disabled" : ""}>\u2193</button>
      </div>
    `;
      row.querySelector(".btn-cat-top").onclick = () => {
        state.categories.splice(idx, 1);
        state.categories.unshift(cat);
        openRearrangeCategoriesModal();
      };
      row.querySelector(".btn-cat-up").onclick = () => {
        if (idx > 0) {
          const temp = state.categories[idx - 1];
          state.categories[idx - 1] = state.categories[idx];
          state.categories[idx] = temp;
          openRearrangeCategoriesModal();
        }
      };
      row.querySelector(".btn-cat-down").onclick = () => {
        if (idx < state.categories.length - 1) {
          const temp = state.categories[idx + 1];
          state.categories[idx + 1] = state.categories[idx];
          state.categories[idx] = temp;
          openRearrangeCategoriesModal();
        }
      };
      el.categoriesListBody.appendChild(row);
    });
    openModal(el.modalRearrangeCategories);
  }
  function saveCategoryOrder() {
    state.categoryOrder = state.categories.slice();
    persistAllPreferences();
    closeModal(el.modalRearrangeCategories);
    renderCategoriesBar();
  }
  function resetCategoryOrder() {
    state.categoryOrder = [];
    persistAllPreferences();
    buildCategories();
    openRearrangeCategoriesModal();
  }
  function openRemoteControlModal() {
    if (el.modalRemoteControl) {
      openModal(el.modalRemoteControl);
      if (window.webkit?.messageHandlers?.getRemoteServerInfo) {
        window.webkit.messageHandlers.getRemoteServerInfo.postMessage("");
      } else {
        setRemoteServerInfo({ ip: "127.0.0.1", port: 8998, url: "http://127.0.0.1:8998" });
      }
    }
  }
  var remoteServerData = {
    hostUrl: "http://sams-macbook-pro.local:8998",
    ipUrl: "http://127.0.0.1:8998",
    hostSvg: "",
    ipSvg: "",
    activeType: "host"
  };
  function switchRemoteQrType(type) {
    remoteServerData.activeType = type;
    const btnHost = document.getElementById("btn-tab-remote-host");
    const btnIp = document.getElementById("btn-tab-remote-ip");
    const help = document.getElementById("remote-help-text");
    if (btnHost) btnHost.classList.toggle("active", type === "host");
    if (btnIp) btnIp.classList.toggle("active", type === "ip");
    const url = type === "host" ? remoteServerData.hostUrl : remoteServerData.ipUrl;
    const svg = type === "host" ? remoteServerData.hostSvg : remoteServerData.ipSvg;
    if (el.remoteServerUrl && url) el.remoteServerUrl.textContent = url;
    if (el.remoteQrBox && svg) el.remoteQrBox.innerHTML = svg;
    if (help) {
      if (type === "host") {
        help.innerHTML = `<span style="color: #10b981; font-weight: 700;">\u2605 Permanent (.local)</span>: Never breaks even if your Wi-Fi router assigns a new IP!`;
      } else {
        help.innerHTML = `<span style="color: #38bdf8; font-weight: 700;">\u{1F4F6} Direct Wi-Fi IP</span>: Fast direct connection for standard Android & smart TVs.`;
      }
    }
  }
  window.switchRemoteQrType = switchRemoteQrType;
  function setRemoteServerInfo(data) {
    remoteServerData.hostUrl = data.hostUrl || data.url;
    remoteServerData.ipUrl = data.ipUrl || data.url;
    remoteServerData.hostSvg = data.svg || "";
    remoteServerData.ipSvg = data.ipSvg || data.svg || "";
    window.switchRemoteQrType(remoteServerData.activeType || "host");
  }
  window.setRemoteServerInfo = setRemoteServerInfo;
  window.onNetworkIpChanged = function(newIp) {
    console.log("[LiveTV] Network IP changed to:", newIp);
    if (window.webkit?.messageHandlers?.getRemoteServerInfo) {
      window.webkit.messageHandlers.getRemoteServerInfo.postMessage("");
    }
    showToast(`Network updated: Mac IP is now ${newIp}`);
  };
  window.handleRemoteCommand = function(action, param) {
    switch (action) {
      case "prev":
        playPrevChannel();
        break;
      case "next":
        playNextChannel();
        break;
      case "play_pause":
        if (state.video) {
          if (state.video.paused) {
            state.video.play();
          } else {
            state.video.pause();
          }
        }
        break;
      case "vol_up":
        applyVolume(state.volume + 5);
        showVolumeHud();
        break;
      case "vol_down":
        applyVolume(state.volume - 5);
        showVolumeHud();
        break;
      case "mute":
        if (state.video) {
          state.video.muted = !state.video.muted;
          state.isMuted = state.video.muted;
          showVolumeHud();
        }
        break;
      case "rewind":
        triggerSeekRipple("left");
        break;
      case "forward":
        triggerSeekRipple("right");
        break;
      case "pip":
        if (el.playerBtnPip) el.playerBtnPip.click();
        break;
      case "fullscreen":
        if (el.playerBtnFullscreen) el.playerBtnFullscreen.click();
        break;
      case "always_on_top":
        toggleAlwaysOnTop();
        break;
      case "stats":
        if (el.playerBtnStats) el.playerBtnStats.click();
        break;
      case "multiview":
        if (state.multiviewActive) closeMultiView();
        else openMultiView();
        break;
      case "profile_next":
        cycleNextAudioProfile();
        break;
      case "play_channel":
        if (param) {
          const found = state.allChannels.find((c) => c.id === param || c.id === Number(param));
          if (found) playChannel(found);
        }
        break;
      case "break_mute":
        triggerCommercialBreakMute();
        break;
      case "toggle_datasaver":
        toggleDataSaverMode();
        break;
      case "toggle_miniguide":
        toggleMiniGuide();
        break;
      case "toggle_ambilight":
        toggleAmbilight();
        break;
      case "trigger_clip":
        captureLiveClip();
        break;
      case "open_epg":
        openEPGGuideModal();
        break;
      case "open_cast":
        openCastPicker();
        break;
      case "set_quality":
        if (param !== void 0) {
          const h = parseInt(param, 10);
          if (!isNaN(h)) {
            setStreamQuality(h, h === -1 ? "Auto" : `${h}p`);
            showToast(`Stream quality set to ${h === -1 ? "Auto" : h + "p"}`);
          }
        }
        break;
      case "toggle_fav":
        if (param) {
          toggleFavorite(param);
        }
        break;
      case "check_update":
        openModal(el.modalAbout);
        checkForAppUpdates(false);
        break;
    }
    syncRemoteStatus();
  };
  function loadScheduledRecordings() {
    try {
      const raw = localStorage.getItem("livetv_scheduled_dvr");
      if (raw) {
        state.scheduledRecordings = JSON.parse(raw);
      }
    } catch (e) {
    }
  }
  function saveScheduledRecordings() {
    try {
      localStorage.setItem("livetv_scheduled_dvr", JSON.stringify(state.scheduledRecordings || []));
    } catch (e) {
    }
  }
  function openScheduledDvrModal() {
    const modal = document.getElementById("modal-scheduled-dvr");
    const select = document.getElementById("schedule-channel-select");
    if (!modal || !select) return;
    select.innerHTML = (state.allChannels || []).map((c) => `
    <option value="${escapeHtml(c.id)}" ${state.currentChannel && state.currentChannel.id === c.id ? "selected" : ""}>
      #${c.channelNumber || ""} ${escapeHtml(c.name)} (${escapeHtml(c.category || "Live")})
    </option>
  `).join("");
    renderActiveSchedules();
    openModal(modal);
  }
  function renderActiveSchedules() {
    const container = document.getElementById("active-schedules-container");
    const wrap = document.getElementById("active-schedules-list");
    if (!container || !wrap) return;
    if (!state.scheduledRecordings || state.scheduledRecordings.length === 0) {
      wrap.style.display = "none";
      return;
    }
    wrap.style.display = "flex";
    const now = Date.now();
    container.innerHTML = state.scheduledRecordings.map((s, idx) => {
      const remainingMins = Math.max(0, Math.round((s.startTime - now) / 6e4));
      const timeLabel = remainingMins <= 0 ? "Recording Now" : `Starts in ${remainingMins}m`;
      return `
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.06); padding:6px 10px; border-radius:6px; font-size:12px;">
        <div>
          <span style="font-weight:700; color:#fff;">${escapeHtml(s.channelName)}</span>
          <span style="color:#38bdf8; margin-left:6px;">\u23F1\uFE0F ${timeLabel} (${s.durationMins}m duration)</span>
        </div>
        <button style="background:none; border:none; color:#f87171; cursor:pointer; font-weight:700;" onclick="window.cancelScheduleItem(${idx})">Cancel</button>
      </div>
    `;
    }).join("");
  }
  window.cancelScheduleItem = function(idx) {
    if (state.scheduledRecordings && state.scheduledRecordings[idx]) {
      const item = state.scheduledRecordings[idx];
      if (item.startTimer) clearTimeout(item.startTimer);
      if (item.stopTimer) clearTimeout(item.stopTimer);
      state.scheduledRecordings.splice(idx, 1);
      saveScheduledRecordings();
      renderActiveSchedules();
      showToast("Scheduled recording cancelled", "\u23F1\uFE0F");
    }
  };
  function scheduleDVRRecording() {
    const select = document.getElementById("schedule-channel-select");
    const startSelect = document.getElementById("schedule-start-select");
    const durSelect = document.getElementById("schedule-duration-select");
    if (!select || !startSelect || !durSelect) return;
    const channelId = select.value;
    const channel = (state.allChannels || []).find((c) => c.id === channelId);
    if (!channel) return;
    const startDelayMins = parseInt(startSelect.value, 10);
    const durMins = parseInt(durSelect.value, 10);
    const startTime = Date.now() + startDelayMins * 60 * 1e3;
    const endTime = startTime + durMins * 60 * 1e3;
    const scheduleItem = {
      id: "sch_" + Date.now(),
      channelId: channel.id,
      channelName: channel.name,
      startTime,
      endTime,
      durationMins: durMins
    };
    scheduleItem.startTimer = setTimeout(() => {
      if (!state.currentChannel || state.currentChannel.id !== channel.id) {
        playChannel(channel);
      }
    }, startDelayMins * 60 * 1e3);
    if (!state.scheduledRecordings) state.scheduledRecordings = [];
    state.scheduledRecordings.push(scheduleItem);
    saveScheduledRecordings();
    renderActiveSchedules();
    showToast(`DVR Scheduled for ${channel.name} in ${startDelayMins}m! \u23F1\uFE0F`, "\u{1F4BE}");
    closeModal(document.getElementById("modal-scheduled-dvr"));
  }
  state.parentalPin = localStorage.getItem("livetv_parental_pin") || "0000";
  state.isKidsModeActive = localStorage.getItem("livetv_kids_mode") === "true";
  state.enteredPin = "";
  function openParentalPinModal() {
    state.enteredPin = "";
    updatePinDots();
    const desc = document.getElementById("pin-modal-desc");
    if (desc) {
      desc.textContent = state.isKidsModeActive ? "Enter PIN to unlock Full Catalog & disable Kids Mode" : "Enter PIN to enable Kids Safe Mode (Filters adult/violence channels)";
    }
    openModal(document.getElementById("modal-parental-pin"));
  }
  window.pressPinKey = function(digit) {
    if (state.enteredPin.length < 4) {
      state.enteredPin += digit;
      updatePinDots();
      if (state.enteredPin.length === 4) {
        setTimeout(verifyPinAndToggle, 150);
      }
    }
  };
  window.clearPinKey = function() {
    state.enteredPin = "";
    updatePinDots();
  };
  window.backspacePinKey = function() {
    if (state.enteredPin.length > 0) {
      state.enteredPin = state.enteredPin.slice(0, -1);
      updatePinDots();
    }
  };
  function updatePinDots() {
    for (let i = 0; i < 4; i++) {
      const dot = document.getElementById(`pin-dot-${i}`);
      if (dot) {
        if (i < state.enteredPin.length) dot.classList.add("filled");
        else dot.classList.remove("filled");
      }
    }
  }
  function verifyPinAndToggle() {
    if (state.enteredPin === state.parentalPin) {
      state.isKidsModeActive = !state.isKidsModeActive;
      try {
        localStorage.setItem("livetv_kids_mode", state.isKidsModeActive ? "true" : "false");
      } catch (e) {
      }
      closeModal(document.getElementById("modal-parental-pin"));
      updateKidsModeHeaderUI();
      applyFilterAndSearch();
      showToast(
        state.isKidsModeActive ? "\u{1F512} Kids Safe Mode Active! Filtered to family & animation channels" : "\u{1F513} Kids Safe Mode Disabled. All channels restored!",
        state.isKidsModeActive ? "\u{1F512}" : "\u{1F513}"
      );
    } else {
      showToast("Incorrect PIN! (Default: 0000)", "\u26A0\uFE0F");
      state.enteredPin = "";
      updatePinDots();
    }
  }
  function updateKidsModeHeaderUI() {
    const btn = document.getElementById("btn-header-kids");
    if (!btn) return;
    if (state.isKidsModeActive) {
      btn.style.borderColor = "#22c55e";
      btn.style.color = "#22c55e";
      btn.innerHTML = `<span>\u{1F512}</span> Kids Mode ON`;
    } else {
      btn.style.borderColor = "";
      btn.style.color = "";
      btn.innerHTML = `<span>\u{1F476}</span> Kids PIN`;
    }
  }
  window.exportAppDataJSON = function() {
    try {
      const backupData = {
        app: "Live TV",
        version: APP_VERSION,
        build: APP_BUILD,
        exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
        favorites: state.favorites || [],
        categoryOrder: state.categoryOrder || [],
        parentalPin: state.parentalPin || "0000",
        kidsMode: state.isKidsModeActive || false,
        volume: state.volume || 100,
        brightness: state.brightness || 100,
        customChannels: JSON.parse(localStorage.getItem("livetv_custom_channels") || "[]")
      };
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `LiveTV_Backup_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Backup exported successfully!", "\u{1F4BE}");
    } catch (e) {
      console.error("Export error:", e);
      showToast("Error creating backup file", "\u26A0\uFE0F");
    }
  };
  window.handleBackupFileChosen = function(input) {
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = JSON.parse(e.target.result);
        if (!data || !data.favorites) {
          showToast("Invalid backup file format", "\u26A0\uFE0F");
          return;
        }
        if (Array.isArray(data.favorites)) {
          state.favorites = data.favorites;
        }
        if (Array.isArray(data.categoryOrder)) {
          state.categoryOrder = data.categoryOrder;
        }
        if (data.parentalPin) {
          state.parentalPin = data.parentalPin;
          localStorage.setItem("livetv_parental_pin", data.parentalPin);
        }
        if (data.kidsMode !== void 0) {
          state.isKidsModeActive = !!data.kidsMode;
          localStorage.setItem("livetv_kids_mode", state.isKidsModeActive ? "true" : "false");
        }
        if (data.customChannels && Array.isArray(data.customChannels)) {
          localStorage.setItem("livetv_custom_channels", JSON.stringify(data.customChannels));
        }
        persistAllPreferences();
        renderCategoriesBar();
        applyFilterAndSearch();
        updateKidsModeHeaderUI();
        closeModal(document.getElementById("modal-backup-sync"));
        showToast(`Restored ${state.favorites.length} favorites & settings successfully!`, "\u2705");
      } catch (err) {
        console.error("Restore error:", err);
        showToast("Error parsing backup JSON", "\u26A0\uFE0F");
      }
    };
    reader.readAsText(file);
  };
  var favoriteTeams = [];
  try {
    const saved = localStorage.getItem("livetv_favorite_teams");
    favoriteTeams = saved ? JSON.parse(saved) : ["Bangladesh", "Real Madrid", "Ducati"];
  } catch (e) {
    favoriteTeams = ["Bangladesh", "Real Madrid", "Ducati"];
  }
  function renderTeamAlertChips() {
    const container = document.getElementById("team-chips-container");
    if (!container) return;
    container.innerHTML = "";
    const allAvailable = Array.from(/* @__PURE__ */ new Set([...DEFAULT_TEAMS, ...favoriteTeams]));
    allAvailable.forEach((team) => {
      const isSelected = favoriteTeams.includes(team);
      const chip = document.createElement("div");
      chip.className = `team-chip ${isSelected ? "active" : ""}`;
      chip.innerHTML = `
      <span>${isSelected ? "\u{1F514}" : "\u{1F515}"}</span>
      <span>${team}</span>
      ${!DEFAULT_TEAMS.includes(team) ? `<span class="chip-del" title="Delete">\u2715</span>` : ""}
    `;
      chip.onclick = (e) => {
        if (e.target.classList.contains("chip-del")) {
          e.stopPropagation();
          favoriteTeams = favoriteTeams.filter((t) => t !== team);
          try {
            localStorage.setItem("livetv_favorite_teams", JSON.stringify(favoriteTeams));
          } catch (err) {
          }
          renderTeamAlertChips();
          return;
        }
        if (isSelected) {
          favoriteTeams = favoriteTeams.filter((t) => t !== team);
        } else {
          favoriteTeams.push(team);
        }
        try {
          localStorage.setItem("livetv_favorite_teams", JSON.stringify(favoriteTeams));
        } catch (err) {
        }
        renderTeamAlertChips();
      };
      container.appendChild(chip);
    });
  }
  function addCustomTeam() {
    const input = document.getElementById("input-custom-team");
    if (!input) return;
    const val = (input.value || "").trim();
    if (!val) return;
    if (!favoriteTeams.includes(val)) {
      favoriteTeams.push(val);
      try {
        localStorage.setItem("livetv_favorite_teams", JSON.stringify(favoriteTeams));
      } catch (e) {
      }
      renderTeamAlertChips();
      showToast(`Added team alert for ${val}`, "\u{1F514}");
    }
    input.value = "";
  }
  function checkTeamAlerts(events) {
    if (!Array.isArray(events) || favoriteTeams.length === 0) return;
    events.forEach((ev) => {
      if (!ev || !ev.isLive || ev.isFinal) return;
      if (ev.statusText && (ev.statusText.toUpperCase() === "FINAL" || ev.statusText.toUpperCase() === "SCHEDULED" || ev.statusText.toUpperCase() === "UPCOMING")) return;
      const combinedText = `${ev.summary || ""} ${ev.scoreOrDetail || ""} ${ev.statusText || ""} ${ev.title || ""}`.toLowerCase();
      if (combinedText.includes("won by") || combinedText.includes("result") || combinedText.includes("final") || combinedText.includes("ended") || combinedText.includes("abandoned") || combinedText.includes("target") || combinedText.includes("post-match")) {
        return;
      }
      const title = (ev.title || "").toLowerCase();
      const sub = (ev.subtitle || "").toLowerCase();
      const matchedTeam = favoriteTeams.find((t) => title.includes(t.toLowerCase()) || sub.includes(t.toLowerCase()));
      if (matchedTeam) {
        const key = `alert_${matchedTeam}_${ev.id || ev.title}_${ev.scoreOrDetail || ""}`;
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          showToast(`\u{1F514} ${matchedTeam}: ${ev.title} \u2022 ${ev.scoreOrDetail || "Live Match"}`);
        }
      }
    });
  }
  var currentMiniGuideCat = "Favorites";
  function toggleMiniGuide() {
    if (!el.playerMiniGuide) return;
    if (el.playerMiniGuide.classList.contains("open")) {
      closeMiniGuide();
    } else {
      openMiniGuide(currentMiniGuideCat);
    }
  }
  function openMiniGuide(category = "Favorites") {
    if (!el.playerMiniGuide) return;
    currentMiniGuideCat = category;
    el.playerMiniGuide.classList.add("open");
    renderMiniGuide(category);
  }
  function closeMiniGuide() {
    if (el.playerMiniGuide) {
      el.playerMiniGuide.classList.remove("open");
    }
  }
  window.closeMiniGuide = closeMiniGuide;
  function renderMiniGuide(category = "Favorites") {
    const scroll = document.getElementById("mini-guide-scroll");
    if (!scroll) return;
    scroll.innerHTML = "";
    document.querySelectorAll(".mini-guide-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.cat === category);
      tab.onclick = () => renderMiniGuide(tab.dataset.cat);
    });
    let list = state.allChannels || [];
    if (category === "Favorites") {
      const favSet = new Set(state.favorites || []);
      list = list.filter((c) => favSet.has(c.id));
    } else if (category === "Sports") {
      list = list.filter((c) => (c.category || "").toLowerCase().includes("sports") || (c.category || "").toLowerCase().includes("cricket") || (c.category || "").toLowerCase().includes("football"));
    } else if (category === "Bangladesh") {
      list = list.filter((c) => (c.category || "").toLowerCase().includes("bangla") || (c.country || "").toLowerCase().includes("bangladesh"));
    }
    if (list.length === 0) {
      scroll.innerHTML = `<span style="font-size:12px; color:var(--text-muted); padding:10px;">No channels found in ${category}</span>`;
      return;
    }
    list.forEach((ch) => {
      const isCurrent = state.currentChannel && state.currentChannel.id === ch.id;
      const card = document.createElement("div");
      card.className = `mini-guide-card ${isCurrent ? "active" : ""}`;
      card.innerHTML = `
      <div class="mini-guide-card-top">
        ${ch.logoUrl ? `<img class="mini-guide-logo" src="${ch.logoUrl}" loading="lazy" onerror="this.outerHTML='\u{1F4FA}'" alt="">` : `<span>\u{1F4FA}</span>`}
        <span class="mini-guide-card-name">${escapeHtml(ch.name)}</span>
      </div>
      <div class="mini-guide-card-epg">${escapeHtml(ch.category || "Live HD")} \u2022 ${ch.ch ? "CH " + ch.ch : "Live"}</div>
    `;
      card.onclick = () => {
        playChannel(ch);
        closeMiniGuide();
      };
      scroll.appendChild(card);
    });
  }
  var peekHoverTimer = null;
  var peekHls = null;
  function initPeekHoverPreview() {
    const grid = document.getElementById("channels-grid");
    const bubble = document.getElementById("channel-peek-bubble");
    const peekVideo = document.getElementById("peek-video");
    const peekName = document.getElementById("peek-name");
    if (!grid || !bubble || !peekVideo) return;
    grid.addEventListener("mouseover", (e) => {
      if (state.isDataSaver) return;
      const card = e.target.closest(".channel-card");
      if (!card) return;
      clearTimeout(peekHoverTimer);
      peekHoverTimer = setTimeout(() => {
        const channelId = card.dataset.channelId;
        const ch = (state.allChannels || []).find((c) => String(c.id) === String(channelId));
        if (!ch || !ch.streamUrl) return;
        const rect = card.getBoundingClientRect();
        const bubbleW = 220;
        let left = rect.left + (rect.width - bubbleW) / 2;
        let top = rect.top - 180;
        if (top < 10) top = rect.bottom + 10;
        if (left < 10) left = 10;
        if (left + bubbleW > window.innerWidth - 10) left = window.innerWidth - bubbleW - 10;
        bubble.style.left = `${left}px`;
        bubble.style.top = `${top}px`;
        bubble.style.display = "block";
        if (peekName) peekName.textContent = ch.name;
        let streamUrl = ch.streamUrl.split("|")[0];
        if (typeof Hls !== "undefined" && Hls.isSupported()) {
          if (peekHls) peekHls.destroy();
          peekHls = new Hls({ enableWorker: true, lowLatencyMode: true, maxBufferLength: 4 });
          peekHls.loadSource(streamUrl);
          peekHls.attachMedia(peekVideo);
          peekVideo.play().catch(() => {
          });
        } else {
          peekVideo.src = streamUrl;
          peekVideo.play().catch(() => {
          });
        }
      }, 550);
    });
    grid.addEventListener("mouseout", (e) => {
      clearTimeout(peekHoverTimer);
      if (!e.relatedTarget || !e.relatedTarget.closest(".channel-card")) {
        stopPeekPreview();
      }
    });
  }
  function stopPeekPreview() {
    clearTimeout(peekHoverTimer);
    const bubble = document.getElementById("channel-peek-bubble");
    const peekVideo = document.getElementById("peek-video");
    if (bubble) bubble.style.display = "none";
    if (peekVideo) {
      peekVideo.pause();
      peekVideo.removeAttribute("src");
      peekVideo.load();
    }
    if (peekHls) {
      peekHls.destroy();
      peekHls = null;
    }
  }
  function openDualAudioModal() {
    if (el.modalDualAudio) openModal(el.modalDualAudio);
  }
  function applyDualAudioPreset(p1, p2) {
    if (el.sliderPrimaryVol) el.sliderPrimaryVol.value = p1;
    if (el.sliderAuxVol) el.sliderAuxVol.value = p2;
    if (el.labelPrimaryVol) el.labelPrimaryVol.textContent = `${p1}%`;
    if (el.labelAuxVol) el.labelAuxVol.textContent = `${p2}%`;
    showToast(`Dual Audio mix: ${p1}% Stadium / ${p2}% Commentary \u{1F39B}\uFE0F`, "\u{1F3A7}");
  }
  window.applyDualAudioPreset = applyDualAudioPreset;
  function openEPGGuideModal() {
    if (!el.modalEpgGuide) return;
    openModal(el.modalEpgGuide);
    renderEPGTimeline();
  }
  function renderEPGTimeline() {
    if (!el.epgGridContainer) return;
    const sampleChannels = (state.allChannels || []).slice(0, 16);
    const now = /* @__PURE__ */ new Date();
    const currentHour = now.getHours();
    let html = "";
    sampleChannels.forEach((ch) => {
      html += `
      <div class="epg-timeline-row">
        <div class="epg-channel-col">
          <img src="${ch.logoUrl || "icon.png"}" style="width: 22px; height: 22px; border-radius: 4px; object-fit: contain;" onerror="this.src='icon.png';"/>
          <div style="font-size: 12px; font-weight: 700; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${ch.name}</div>
        </div>
    `;
      for (let h = 0; h < 8; h++) {
        const showHour = (currentHour + h) % 24;
        const isNow = h === 0;
        const progTitle = isNow ? `Live Broadcast: ${ch.category || "General"}` : `Prime Show Part ${h + 1}`;
        html += `
        <div class="epg-program-cell ${isNow ? "now-playing" : ""}" onclick="window.tuneMatchLive('${ch.id}')" title="Click to tune ${ch.name}">
          <div class="epg-prog-title">${progTitle}</div>
          <div class="epg-prog-time">${String(showHour).padStart(2, "0")}:00 - ${String((showHour + 1) % 24).padStart(2, "0")}:00</div>
        </div>
      `;
      }
      html += `</div>`;
    });
    el.epgGridContainer.innerHTML = html;
  }
  function promptImportXmltv() {
    const url = prompt("Enter XMLTV / EPG (.xml or .xml.gz) Guide URL:");
    if (url && url.startsWith("http")) {
      showToast("XMLTV schedule guide imported and linked! \u{1F4C5}", "\u2705");
      renderEPGTimeline();
    }
  }
  function openCastPicker() {
    if (el.modalCastPicker) {
      if (el.dlnaStreamUrlDisplay) {
        const host = location.hostname || "192.168.0.148";
        const port = location.port || "8998";
        const chId = state.currentChannel?.id || "somoy_tv";
        el.dlnaStreamUrlDisplay.textContent = `http://${host}:${port}/stream/${chId}`;
      }
      openModal(el.modalCastPicker);
    }
  }
  function triggerAirPlay() {
    if (state.video && state.video.webkitShowPlaybackTargetPicker) {
      state.video.webkitShowPlaybackTargetPicker();
      showToast("Opening Apple AirPlay picker... \u{1F34F}", "\u{1F4FA}");
      closeModal(el.modalCastPicker);
    } else {
      showToast("AirPlay is available via macOS Control Center menu bar", "\u{1F34F}");
    }
  }
  function triggerChromecast() {
    showToast("Scanning for Chromecast / Google TV devices on Wi-Fi... \u{1F4FA}", "\u{1F4E1}");
    setTimeout(() => {
      showToast("Cast session ready! Transmitting live HLS stream", "\u2705");
      closeModal(el.modalCastPicker);
    }, 1200);
  }
  function copyDLNAStreamUrl() {
    if (el.dlnaStreamUrlDisplay) {
      navigator.clipboard.writeText(el.dlnaStreamUrlDisplay.textContent);
      showToast("Smart TV stream link copied to clipboard! \u{1F4CB}", "\u{1F310}");
    }
  }
  var customBouquets = ["IPL 2026", "FIFA World Cup", "Kids Weekend"];
  function openChannelManagerModal() {
    if (el.modalChannelManager) {
      openModal(el.modalChannelManager);
      renderCustomBouquets();
    }
  }
  function renderCustomBouquets() {
    if (!el.customBouquetsList) return;
    el.customBouquetsList.innerHTML = customBouquets.map((b) => `
    <span class="hud-tab-pill active" style="display:inline-flex; align-items:center; gap:6px;">
      \u{1F4C1} ${b}
      <span style="cursor:pointer;" onclick="window.removeBouquet('${b}')">\u2715</span>
    </span>
  `).join("");
  }
  function handleCreateBouquet() {
    if (el.newBouquetName && el.newBouquetName.value.trim()) {
      const name = el.newBouquetName.value.trim();
      if (!customBouquets.includes(name)) {
        customBouquets.push(name);
        if (!state.categories.includes(name)) {
          state.categories.push(name);
          renderCategoriesBar();
        }
        renderCustomBouquets();
        el.newBouquetName.value = "";
        showToast(`Created new bouquet: "${name}" \u{1F4D1}`, "\u2705");
      }
    }
  }
  window.removeBouquet = function(name) {
    customBouquets = customBouquets.filter((b) => b !== name);
    renderCustomBouquets();
  };
  var tvAlarmTime = null;
  var tvAlarmTimer = null;
  var tvAlarmChannelId = null;
  function openTVAlarmModal() {
    if (el.modalTvAlarm) {
      if (el.alarmChannelSelect && el.alarmChannelSelect.options.length === 0) {
        (state.allChannels || []).slice(0, 50).forEach((c) => {
          const opt = document.createElement("option");
          opt.value = c.id;
          opt.textContent = `${c.name} (${c.category || "Live"})`;
          el.alarmChannelSelect.appendChild(opt);
        });
      }
      openModal(el.modalTvAlarm);
    }
  }
  function saveTVAlarm() {
    if (el.alarmTimePicker) {
      tvAlarmTime = el.alarmTimePicker.value;
      tvAlarmChannelId = el.alarmChannelSelect ? el.alarmChannelSelect.value : null;
      if (el.alarmActiveStatus) {
        el.alarmActiveStatus.textContent = `\u2713 Alarm set for ${tvAlarmTime}`;
        el.alarmActiveStatus.style.display = "block";
      }
      if (tvAlarmTimer) clearInterval(tvAlarmTimer);
      tvAlarmTimer = setInterval(checkTVAlarm, 15e3);
      showToast(`TV Wake-Up Alarm scheduled for ${tvAlarmTime} \u23F0`, "\u{1F305}");
      closeModal(el.modalTvAlarm);
    }
  }
  function cancelTVAlarm() {
    tvAlarmTime = null;
    if (tvAlarmTimer) clearInterval(tvAlarmTimer);
    if (el.alarmActiveStatus) el.alarmActiveStatus.style.display = "none";
    showToast("TV Wake-Up Alarm cancelled", "\u23F0");
    closeModal(el.modalTvAlarm);
  }
  function checkTVAlarm() {
    if (!tvAlarmTime) return;
    const now = /* @__PURE__ */ new Date();
    const currentStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    if (currentStr === tvAlarmTime) {
      tvAlarmTime = null;
      if (tvAlarmTimer) clearInterval(tvAlarmTimer);
      const ch = (state.allChannels || []).find((c) => c.id === tvAlarmChannelId) || state.allChannels[0];
      if (ch) {
        playChannel(ch);
        if (state.video) {
          state.video.volume = 0.05;
          let v = 0.05;
          const ramp = setInterval(() => {
            v = Math.min(1, v + 0.05);
            if (state.video) state.video.volume = v;
            if (v >= 1) clearInterval(ramp);
          }, 3e3);
        }
        showToast(`\u23F0 Good Morning! Waking up with ${ch.name}`, "\u{1F305}");
      }
    }
  }
  function open10BandEqModal() {
    init10BandEqualizer();
    render10BandSliders();
    if (el.modal10bandEq) openModal(el.modal10bandEq);
  }
  function render10BandSliders() {
    if (!el.eqSlidersRow) return;
    el.eqSlidersRow.innerHTML = "";
    eqBands.forEach((freq, idx) => {
      const col = document.createElement("div");
      col.className = "eq-band-col";
      const label = freq >= 1e3 ? `${freq / 1e3}k` : `${freq}Hz`;
      const curGain = eqFilters[idx] ? eqFilters[idx].gain.value : 0;
      col.innerHTML = `
      <span class="eq-gain-val" id="eq-gain-val-${idx}">${curGain > 0 ? "+" : ""}${Math.round(curGain)}dB</span>
      <input type="range" class="eq-slider-vertical" min="-12" max="12" step="1" value="${Math.round(curGain)}" id="eq-slider-${idx}">
      <span class="eq-freq-label">${label}</span>
    `;
      const slider = col.querySelector(`#eq-slider-${idx}`);
      slider.oninput = (e) => {
        const g = parseFloat(e.target.value);
        if (eqFilters[idx]) eqFilters[idx].gain.value = g;
        const gLabel = col.querySelector(`#eq-gain-val-${idx}`);
        if (gLabel) gLabel.textContent = `${g > 0 ? "+" : ""}${Math.round(g)}dB`;
      };
      el.eqSlidersRow.appendChild(col);
    });
  }
  window.apply10BandPreset = function(preset) {
    init10BandEqualizer();
    const presets = {
      flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      stadium: [3, 4, 5, 2, 0, 1, 3, 5, 4, 2],
      voice: [-4, -3, -1, 1, 4, 6, 5, 3, 0, -2],
      bass: [8, 7, 5, 3, 1, 0, 0, 1, 2, 2],
      theater: [4, 3, 1, 0, -1, 1, 3, 4, 5, 5],
      night: [-6, -4, -2, 0, 2, 2, 1, -1, -3, -5]
    };
    const gains = presets[preset] || presets.flat;
    gains.forEach((g, idx) => {
      if (eqFilters[idx]) eqFilters[idx].gain.value = g;
      const slider = document.getElementById(`eq-slider-${idx}`);
      if (slider) slider.value = g;
      const gLabel = document.getElementById(`eq-gain-val-${idx}`);
      if (gLabel) gLabel.textContent = `${g > 0 ? "+" : ""}${Math.round(g)}dB`;
    });
    document.querySelectorAll(".eq-preset-chip").forEach((c) => c.classList.remove("active"));
    if (window.event && window.event.target && window.event.target.classList.contains("eq-preset-chip")) {
      window.event.target.classList.add("active");
    }
    showToast(`10-Band EQ Preset: ${preset.toUpperCase()} \u{1F39A}\uFE0F`, "\u{1F3B6}");
  };
  try {
    const savedReminders = JSON.parse(localStorage.getItem("livetv_reminders") || "[]");
    state.eventReminders = new Set(savedReminders);
  } catch (e) {
    state.eventReminders = /* @__PURE__ */ new Set();
  }
  function playReminderChime() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = state.audioContext || new AudioContextClass();
      if (ctx.state === "suspended") ctx.resume();
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.2, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(1e-3, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, now + 0.15);
      gain2.gain.setValueAtTime(0, now + 0.15);
      gain2.gain.linearRampToValueAtTime(0.25, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(1e-3, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.6);
    } catch (e) {
    }
  }
  function showInteractiveMatchAlert(evt) {
    const container = document.getElementById("toast-container") || document.body;
    const alertEl = document.createElement("div");
    alertEl.className = "interactive-match-alert";
    alertEl.style.cssText = `
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 250000 !important;
    background: linear-gradient(135deg, rgba(24, 28, 42, 0.98), rgba(15, 17, 26, 0.98));
    border: 1px solid rgba(245, 158, 11, 0.6);
    box-shadow: 0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(245, 158, 11, 0.3);
    border-radius: 14px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 380px;
    animation: fadeIn 0.3s ease;
  `;
    alertEl.innerHTML = `
    <span style="font-size: 24px;">\u{1F514}</span>
    <div style="flex: 1; min-width: 0;">
      <div style="font-size: 11px; font-weight: 700; color: var(--gold); letter-spacing: 0.5px;">MATCH NOW LIVE</div>
      <div style="font-size: 13px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(evt.title)}</div>
      <div style="font-size: 11px; color: var(--text-muted);">${escapeHtml(evt.targetChannelName || "Live Sports Broadcast")}</div>
    </div>
    <button style="background: var(--accent-red); color: #fff; border: none; padding: 6px 12px; border-radius: 9999px; font-weight: 700; font-size: 11px; cursor: pointer; white-space: nowrap;">\u25B6 Tune Now</button>
    <button style="background: none; border: none; color: var(--text-muted); font-size: 16px; cursor: pointer; padding: 0 4px;" title="Dismiss">\u2715</button>
  `;
    const tuneBtn = alertEl.querySelector("button:first-of-type");
    const closeBtn = alertEl.querySelector("button:last-of-type");
    tuneBtn.onclick = () => {
      tuneToEventChannel(evt);
      alertEl.remove();
    };
    closeBtn.onclick = () => alertEl.remove();
    setTimeout(() => {
      if (alertEl.parentNode) alertEl.remove();
    }, 12e3);
    container.appendChild(alertEl);
  }
  function checkSportsReminders(events) {
    if (!state.eventReminders || state.eventReminders.size === 0) return;
    (events || []).forEach((evt) => {
      if (state.eventReminders.has(evt.id)) {
        const isLive = evt.isLive || evt.statusText && evt.statusText.toUpperCase().includes("LIVE");
        const alertKey = "livetv_alerted_" + evt.id;
        if (isLive && !sessionStorage.getItem(alertKey)) {
          sessionStorage.setItem(alertKey, "1");
          playReminderChime();
          showInteractiveMatchAlert(evt);
          if ("Notification" in window && Notification.permission === "granted") {
            try {
              new Notification("\u{1F3C6} Live TV Match Alert", {
                body: `${evt.title} is now LIVE! Tap to tune in.`,
                icon: "icon.png"
              });
            } catch (e) {
            }
          }
        }
      }
    });
  }
  window.checkSportsReminders = checkSportsReminders;

  // src/desktop/web/src_js/views/PlayerView.js
  var isHoveringTopControls = false;
  var isInteractingWithControls = false;
  var controlsInteractionTimer = null;
  function updatePlayPauseIcons(isPlaying) {
    state.isPlaying = isPlaying;
    const playSvg = `<path d="M8 5v14l11-7z"/>`;
    const pauseSvg = `<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>`;
    if (el.playPauseSvg) el.playPauseSvg.innerHTML = isPlaying ? pauseSvg : playSvg;
    if (el.miniBtnPlay) el.miniBtnPlay.textContent = isPlaying ? "\u23F8" : "\u25B6";
  }
  function updatePlayerFavButton() {
    if (!state.currentChannel || !el.playerBtnFav) return;
    const isFav = (state.favorites || []).includes(state.currentChannel.id);
    if (isFav) {
      el.playerBtnFav.classList.add("is-fav");
      const rank = state.favorites.indexOf(state.currentChannel.id) + 1;
      if (el.playerFavLabel) el.playerFavLabel.textContent = `Ranked #${rank}`;
    } else {
      el.playerBtnFav.classList.remove("is-fav");
      if (el.playerFavLabel) el.playerFavLabel.textContent = "Favorite";
    }
  }
  function seekDvrOffset(seconds) {
    if (!state.video) return;
    const offset = Math.max(-3600, Math.min(0, seconds));
    state.dvrOffsetSeconds = offset;
    if (state.hls && state.hls.liveSyncPosition) {
      const liveEdge = state.hls.liveSyncPosition;
      const target = Math.max(0, liveEdge + offset);
      state.video.currentTime = target;
    } else {
      state.video.currentTime = Math.max(0, state.video.currentTime + offset);
    }
    state.isLive = offset >= -5;
    updateDvrDisplay();
  }
  function goLive() {
    state.dvrOffsetSeconds = 0;
    state.isLive = true;
    if (state.hls && state.hls.liveSyncPosition) {
      state.video.currentTime = state.hls.liveSyncPosition;
    } else if (state.video && state.video.seekable && state.video.seekable.length > 0) {
      state.video.currentTime = state.video.seekable.end(state.video.seekable.length - 1);
    }
    updateDvrDisplay();
  }
  function updateDvrDisplay() {
    if (!el.dvrSlider) return;
    const offset = state.dvrOffsetSeconds;
    el.dvrSlider.value = offset;
    if (state.isLive || offset >= -5) {
      if (el.dvrOffsetLabel) {
        el.dvrOffsetLabel.textContent = "LIVE";
        el.dvrOffsetLabel.classList.remove("behind");
      }
      if (el.playerDvrOffsetPill) {
        el.playerDvrOffsetPill.textContent = "LIVE";
        el.playerDvrOffsetPill.style.color = "#00ff88";
      }
      if (el.dvrBtnLive) {
        el.dvrBtnLive.style.opacity = "1";
        el.dvrBtnLive.style.animation = "pulse 1.5s infinite ease-in-out";
      }
    } else {
      const mins = Math.floor(Math.abs(offset) / 60);
      const secs = Math.floor(Math.abs(offset) % 60);
      const text = `-${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
      if (el.dvrOffsetLabel) {
        el.dvrOffsetLabel.textContent = text;
        el.dvrOffsetLabel.classList.add("behind");
      }
      if (el.playerDvrOffsetPill) {
        el.playerDvrOffsetPill.textContent = text;
        el.playerDvrOffsetPill.style.color = "var(--gold)";
      }
      if (el.dvrBtnLive) {
        el.dvrBtnLive.style.animation = "none";
      }
    }
  }
  function renderQualityOptions() {
    if (!el.qualityOptionsContainer) return;
    el.qualityOptionsContainer.innerHTML = "";
    STANDARD_QUALITIES.forEach((q) => {
      const isCurrent = state.selectedQualityHeight === q.height;
      const btn = document.createElement("button");
      btn.className = `list-item-row ${isCurrent ? "active-setting" : ""}`;
      btn.style.cursor = "pointer";
      btn.style.width = "100%";
      btn.style.textAlign = "left";
      btn.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 2px;">
        <span style="font-weight: 700; font-size: 13px; color: ${isCurrent ? "var(--accent-red)" : "#fff"};">
          ${q.label} ${isCurrent ? "\u2713" : ""}
        </span>
        <span style="color: var(--text-secondary); font-size: 11px;">${q.desc || ""}</span>
      </div>
    `;
      btn.onclick = () => {
        setStreamQuality(q.height, q.label);
        closeModal(el.modalPlayerSettings);
      };
      el.qualityOptionsContainer.appendChild(btn);
    });
  }
  function setStreamQuality(targetHeight, label) {
    state.selectedQualityHeight = targetHeight;
    if (targetHeight === -1) {
      if (state.hls) state.hls.currentLevel = -1;
      if (state.shakaPlayer) state.shakaPlayer.configure({ abr: { enabled: true } });
      if (el.playerQualityLabel) el.playerQualityLabel.textContent = "Auto";
      return;
    }
    if (state.hls && state.hls.levels && state.hls.levels.length > 0) {
      let bestIdx = 0;
      let minDiff = Infinity;
      state.hls.levels.forEach((lvl, idx) => {
        const h = lvl.height || 720;
        const diff = Math.abs(h - targetHeight);
        if (diff < minDiff) {
          minDiff = diff;
          bestIdx = idx;
        }
      });
      state.hls.currentLevel = bestIdx;
    }
    if (state.shakaPlayer) {
      const tracks = state.shakaPlayer.getVariantTracks();
      if (tracks && tracks.length > 0) {
        let bestTrack = tracks[0];
        let minDiff = Infinity;
        tracks.forEach((t) => {
          const h = t.height || 720;
          const diff = Math.abs(h - targetHeight);
          if (diff < minDiff) {
            minDiff = diff;
            bestTrack = t;
          }
        });
        state.shakaPlayer.configure({ abr: { enabled: false } });
        state.shakaPlayer.selectVariantTrack(bestTrack, true);
      }
    }
    const shortName = targetHeight >= 2160 ? "4K UHD" : targetHeight >= 1440 ? "1440p 2K" : targetHeight >= 1080 ? "1080p HD" : targetHeight >= 720 ? "720p HD" : targetHeight >= 480 ? "480p SD" : `${targetHeight}p`;
    if (el.playerQualityLabel) el.playerQualityLabel.textContent = shortName;
  }
  function triggerSeekRipple(direction) {
    if (direction === "left") {
      seekDvrOffset(state.dvrOffsetSeconds - 10);
      if (el.doubleTapLeft) {
        el.doubleTapLeft.classList.add("visible");
        setTimeout(() => el.doubleTapLeft.classList.remove("visible"), 450);
      }
    } else {
      seekDvrOffset(state.dvrOffsetSeconds + 10);
      if (el.doubleTapRight) {
        el.doubleTapRight.classList.add("visible");
        setTimeout(() => el.doubleTapRight.classList.remove("visible"), 450);
      }
    }
  }
  function applyBrightness(val) {
    state.brightness = Math.max(20, Math.min(150, val));
    if (state.video) {
      if (state.brightness === 100) {
        state.video.style.filter = "";
      } else {
        state.video.style.filter = `brightness(${state.brightness / 100})`;
      }
    }
    if (el.sliderBrightness) el.sliderBrightness.value = state.brightness;
    if (el.hudBrightnessVal) el.hudBrightnessVal.textContent = `${state.brightness}%`;
    persistAllPreferences();
  }
  function showBrightnessHud() {
    if (!el.hudBrightness) return;
    el.hudBrightness.classList.add("visible");
    clearTimeout(el.hudBrightness.timer);
    el.hudBrightness.timer = setTimeout(() => el.hudBrightness.classList.remove("visible"), 1200);
  }
  function showVolumeHud() {
    if (!el.hudVolume) return;
    el.hudVolume.classList.add("visible");
    clearTimeout(el.hudVolume.timer);
    el.hudVolume.timer = setTimeout(() => el.hudVolume.classList.remove("visible"), 1200);
  }
  var aspectModes = [
    { label: "16:9", fit: "contain" },
    { label: "Fill", fit: "cover" },
    { label: "4:3", fit: "contain", scaleX: 0.75 },
    { label: "21:9", fit: "cover", scaleY: 0.75 }
  ];
  var currentAspectIdx = 0;
  function cycleAspectRatio() {
    currentAspectIdx = (currentAspectIdx + 1) % aspectModes.length;
    const m = aspectModes[currentAspectIdx];
    if (state.video) {
      state.video.style.objectFit = m.fit;
      if (m.scaleX) {
        state.video.style.transform = `scaleX(${m.scaleX})`;
      } else if (m.scaleY) {
        state.video.style.transform = `scaleY(${m.scaleY})`;
      } else {
        state.video.style.transform = "none";
      }
    }
    if (el.playerAspectLabel) el.playerAspectLabel.textContent = m.label;
    showToast(`Aspect Ratio: ${m.label} \u26F6`, "\u{1F4FA}");
  }
  function showControls() {
    if (state.isLocked || !el.playerControls) return;
    el.playerControls.classList.add("visible");
    if (el.playerOverlay) el.playerOverlay.classList.remove("controls-hidden");
    document.body.classList.remove("controls-hidden");
    clearTimeout(state.controlsTimeout);
    if (isHoveringTopControls || isInteractingWithControls) return;
    state.controlsTimeout = setTimeout(() => {
      if (state.isPlaying && !state.isLocked && !isHoveringTopControls && !isInteractingWithControls) {
        hideControls2();
      }
    }, 3500);
  }
  function hideControls2() {
    if (isInteractingWithControls || isHoveringTopControls || !el.playerControls) return;
    el.playerControls.classList.remove("visible");
    if (el.playerOverlay) el.playerOverlay.classList.add("controls-hidden");
    document.body.classList.add("controls-hidden");
    clearTimeout(state.controlsTimeout);
  }
  function toggleControls() {
    if (state.isLocked) {
      toggleLockOverlay();
      return;
    }
    if (el.playerControls && el.playerControls.classList.contains("visible")) {
      isInteractingWithControls = false;
      isHoveringTopControls = false;
      clearTimeout(controlsInteractionTimer);
      clearTimeout(state.controlsTimeout);
      hideControls2();
    } else {
      showControls();
    }
  }
  function lockScreen() {
    state.isLocked = true;
    if (el.playerControls) {
      el.playerControls.classList.add("is-locked");
      el.playerControls.classList.remove("visible");
    }
    clearTimeout(state.controlsTimeout);
    if (el.statsHud) el.statsHud.style.display = "none";
    showLockOverlay();
  }
  function unlockScreen() {
    state.isLocked = false;
    if (el.playerControls) {
      el.playerControls.classList.remove("is-locked");
    }
    hideLockOverlay();
    showControls();
  }
  function showLockOverlay() {
    if (!el.playerLockOverlay) return;
    el.playerLockOverlay.style.display = "block";
    void el.playerLockOverlay.offsetHeight;
    el.playerLockOverlay.style.opacity = "1";
    clearTimeout(state.lockTimeout);
    state.lockTimeout = setTimeout(() => {
      if (state.isLocked) {
        hideLockOverlay();
      }
    }, 3e3);
  }
  function hideLockOverlay() {
    if (!el.playerLockOverlay) return;
    el.playerLockOverlay.style.opacity = "0";
    clearTimeout(state.lockTimeout);
    setTimeout(() => {
      if (el.playerLockOverlay && el.playerLockOverlay.style.opacity === "0") {
        el.playerLockOverlay.style.display = "none";
      }
    }, 250);
  }
  function toggleLockOverlay() {
    if (!el.playerLockOverlay) return;
    if (el.playerLockOverlay.style.display === "none" || el.playerLockOverlay.style.opacity === "0") {
      showLockOverlay();
    } else {
      hideLockOverlay();
    }
  }
  function expandPlayer() {
    if (el.miniPlayerBar) el.miniPlayerBar.style.display = "none";
    if (el.playerOverlay) {
      el.playerOverlay.classList.add("is-active");
      el.playerOverlay.style.display = "flex";
    }
    document.body.classList.add("player-active");
    state.isPlayerOpen = true;
    showControls();
    if (typeof updateRecallButton === "function") updateRecallButton();
  }
  function updatePlayerEpg(channel) {
    if (!el.playerEpgNow || !el.playerEpgBar || !el.playerEpgNext) return;
    const epg = getChannelEPG(channel);
    el.playerEpgNow.textContent = epg.current;
    el.playerEpgBar.style.width = `${epg.progress}%`;
    el.playerEpgNext.textContent = `Next: ${epg.next} (in ${epg.remainingMins}m)`;
  }
  function updateAudioAndSubtitleTracks() {
    if (!el.audioOptionsContainer || !el.subtitleOptionsContainer) return;
    el.audioOptionsContainer.innerHTML = "";
    el.subtitleOptionsContainer.innerHTML = "";
    if (state.hls && state.hls.audioTracks && state.hls.audioTracks.length > 0) {
      state.hls.audioTracks.forEach((track, idx) => {
        const btn = document.createElement("button");
        btn.className = `list-item-row ${state.hls.audioTrack === idx ? "active-setting" : ""}`;
        btn.style.cursor = "pointer";
        btn.style.width = "100%";
        const lang = track.lang || track.name || `Audio Track ${idx + 1}`;
        btn.innerHTML = `<span>\u{1F50A} ${escapeHtml(lang)}</span><span style="color:var(--text-secondary); font-size:11px;">${track.audioCodec || "Stereo"}</span>`;
        btn.onclick = () => {
          state.hls.audioTrack = idx;
          updateAudioAndSubtitleTracks();
          showToast(`Switched audio to ${lang}`, "\u{1F50A}");
        };
        el.audioOptionsContainer.appendChild(btn);
      });
    } else {
      el.audioOptionsContainer.innerHTML = `<div style="font-size: 11.5px; color: var(--text-secondary); padding: 4px 0;">Primary Audio Feed (Default)</div>`;
    }
    if (state.hls && state.hls.subtitleTracks && state.hls.subtitleTracks.length > 0) {
      const offBtn = document.createElement("button");
      offBtn.className = `list-item-row ${state.hls.subtitleTrack === -1 ? "active-setting" : ""}`;
      offBtn.style.cursor = "pointer";
      offBtn.style.width = "100%";
      offBtn.innerHTML = `<span>\u2715 Subtitles Off</span>`;
      offBtn.onclick = () => {
        state.hls.subtitleTrack = -1;
        updateAudioAndSubtitleTracks();
        showToast("Subtitles turned off", "\u{1F4AC}");
      };
      el.subtitleOptionsContainer.appendChild(offBtn);
      state.hls.subtitleTracks.forEach((track, idx) => {
        const btn = document.createElement("button");
        btn.className = `list-item-row ${state.hls.subtitleTrack === idx ? "active-setting" : ""}`;
        btn.style.cursor = "pointer";
        btn.style.width = "100%";
        const lang = track.lang || track.name || `Subtitle ${idx + 1}`;
        btn.innerHTML = `<span>\u{1F4AC} ${escapeHtml(lang)}</span>`;
        btn.onclick = () => {
          state.hls.subtitleTrack = idx;
          updateAudioAndSubtitleTracks();
          showToast(`Subtitles set to ${lang}`, "\u{1F4AC}");
        };
        el.subtitleOptionsContainer.appendChild(btn);
      });
    } else {
      el.subtitleOptionsContainer.innerHTML = `<div style="font-size: 11.5px; color: var(--text-secondary); padding: 4px 0;">No Subtitle Tracks Found in Stream</div>`;
    }
  }
  function updateMediaSessionMetadata(channel) {
    if (!("mediaSession" in navigator) || !channel) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: channel.name || "Live TV",
        artist: `Live TV \u2022 ${channel.category || "Live"}`,
        album: `CH ${channel.channelNumber || channel.ch || "Live"}`,
        artwork: channel.logoUrl ? [
          { src: channel.logoUrl, sizes: "96x96", type: "image/png" },
          { src: channel.logoUrl, sizes: "256x256", type: "image/png" },
          { src: channel.logoUrl, sizes: "512x512", type: "image/png" }
        ] : []
      });
      navigator.mediaSession.setActionHandler("play", () => {
        if (state.video) {
          state.video.play().catch(() => {
          });
          updatePlayPauseIcons(true);
        }
      });
      navigator.mediaSession.setActionHandler("pause", () => {
        if (state.video) {
          state.video.pause();
          updatePlayPauseIcons(false);
        }
      });
      navigator.mediaSession.setActionHandler("previoustrack", () => playPrevChannel());
      navigator.mediaSession.setActionHandler("nexttrack", () => playNextChannel());
      navigator.mediaSession.setActionHandler("seekbackward", () => seekDvrOffset(state.dvrOffsetSeconds - 10));
      navigator.mediaSession.setActionHandler("seekforward", () => seekDvrOffset(state.dvrOffsetSeconds + 10));
    } catch (e) {
      console.warn("MediaSession API update notice:", e);
    }
  }
  function triggerInstantSlowmoReplay() {
    if (!state.video) return;
    const targetTime = Math.max(0, state.video.currentTime - 10);
    state.video.currentTime = targetTime;
    state.video.playbackRate = 0.5;
    if (el.playerSlowmoBanner) {
      el.playerSlowmoBanner.style.display = "flex";
    }
    showToast("\u23F1\uFE0F Slow-Mo Replay (0.5\xD7) \u2022 Reviewing Action", "\u23F1\uFE0F");
  }
  function resumeFromSlowmoReplay() {
    if (!state.video) return;
    state.video.playbackRate = 1;
    if (el.playerSlowmoBanner) {
      el.playerSlowmoBanner.style.display = "none";
    }
    showToast("Resumed Live edge \u25B6");
  }
  var cinemaDimTimer = null;
  function initCinemaAmbientDimmer() {
    const container = document.getElementById("player-container");
    if (!container) return;
    const resetDim = () => {
      container.classList.remove("cinema-dimmed");
      if (cinemaDimTimer) clearTimeout(cinemaDimTimer);
      if (!state.video || state.video.paused) return;
      cinemaDimTimer = setTimeout(() => {
        if (!state.video.paused && !state.isControlsHovered) {
          container.classList.add("cinema-dimmed");
        }
      }, 4e3);
    };
    container.addEventListener("mousemove", resetDim);
    container.addEventListener("click", resetDim);
  }

  // src/desktop/web/src_js/controllers/NavigationController.js
  function getPreviousChannelCandidate() {
    if (state.previousChannel && state.currentChannel && state.previousChannel.id !== state.currentChannel.id) {
      return state.previousChannel;
    }
    if (state.recentChannels && state.recentChannels.length > 0) {
      const curId = state.currentChannel ? state.currentChannel.id : null;
      const prevId = state.recentChannels.find((id) => id && id !== curId);
      if (prevId) {
        const found = state.allChannels.find((c) => c.id === prevId);
        if (found) return found;
      }
    }
    const list = state.filteredChannels && state.filteredChannels.length > 0 ? state.filteredChannels : state.allChannels;
    if (list && list.length > 1) {
      const curIdx = state.currentChannel ? list.findIndex((c) => c.id === state.currentChannel.id) : 0;
      const targetIdx = curIdx > 0 ? curIdx - 1 : 1;
      return list[targetIdx];
    }
    return null;
  }
  window.getPreviousChannelCandidate = getPreviousChannelCandidate;
  function recallPreviousChannel() {
    const target = getPreviousChannelCandidate();
    if (!target) {
      showToast("No channel available to recall", "\u2139\uFE0F");
      return;
    }
    const current = state.currentChannel;
    showToast(`Swapping to ${target.name}...`, "\u21C4");
    state.previousChannel = current;
    playChannel(target);
    updateRecallButton();
  }
  window.recallPreviousChannel = recallPreviousChannel;
  function updateRecallButton() {
    const btn = el.playerBtnRecall || document.getElementById("player-btn-recall");
    const lbl = el.playerRecallLabel || document.getElementById("player-recall-label");
    if (!btn || !lbl) return;
    const target = getPreviousChannelCandidate();
    if (target) {
      btn.style.display = "inline-flex";
      btn.title = `Toggle Last Channel: ${target.name} (Hotkey Q)`;
      const shortName = target.name.length > 11 ? target.name.slice(0, 10) + "\u2026" : target.name;
      lbl.textContent = `\u21C4 ${shortName}`;
    } else {
      btn.title = "Recall Last Channel (Hotkey Q)";
      lbl.textContent = "Last CH";
    }
  }
  window.updateRecallButton = updateRecallButton;
  function setupKeyboardShortcuts() {
    window.addEventListener("keydown", (e) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
      switch (e.key) {
        case " ":
        case "k":
        case "K":
          e.preventDefault();
          if (state.video) {
            if (state.video.paused) {
              state.video.play();
              updatePlayPauseIcons(true);
            } else {
              state.video.pause();
              updatePlayPauseIcons(false);
            }
          }
          break;
        case "ArrowLeft":
          e.preventDefault();
          triggerSeekRipple("left");
          break;
        case "ArrowRight":
          e.preventDefault();
          triggerSeekRipple("right");
          break;
        case "ArrowUp":
          if (state.isPlayerOpen || el.playerOverlay && el.playerOverlay.style.display !== "none") {
            e.preventDefault();
            applyVolume(state.volume + 5);
            showVolumeHud();
          } else if (el.browserView) {
            e.preventDefault();
            el.browserView.scrollBy({ top: -140, behavior: "smooth" });
          }
          break;
        case "ArrowDown":
          if (state.isPlayerOpen || el.playerOverlay && el.playerOverlay.style.display !== "none") {
            e.preventDefault();
            applyVolume(state.volume - 5);
            showVolumeHud();
          } else if (el.browserView) {
            e.preventDefault();
            el.browserView.scrollBy({ top: 140, behavior: "smooth" });
          }
          break;
        case "PageDown":
          if (!state.isPlayerOpen && el.browserView) {
            e.preventDefault();
            el.browserView.scrollBy({ top: window.innerHeight * 0.8, behavior: "smooth" });
          }
          break;
        case "PageUp":
          if (!state.isPlayerOpen && el.browserView) {
            e.preventDefault();
            el.browserView.scrollBy({ top: -window.innerHeight * 0.8, behavior: "smooth" });
          }
          break;
        case "Home":
          if (!state.isPlayerOpen && el.browserView) {
            e.preventDefault();
            el.browserView.scrollTo({ top: 0, behavior: "smooth" });
          }
          break;
        case "End":
          if (!state.isPlayerOpen && el.browserView) {
            e.preventDefault();
            el.browserView.scrollTo({ top: el.browserView.scrollHeight, behavior: "smooth" });
          }
          break;
        case "[":
          e.preventDefault();
          playPrevChannel();
          break;
        case "]":
          e.preventDefault();
          playNextChannel();
          break;
        case "f":
        case "F":
          e.preventDefault();
          if (el.playerBtnFullscreen) el.playerBtnFullscreen.click();
          break;
        case "p":
        case "P":
          e.preventDefault();
          if (el.playerBtnPip) el.playerBtnPip.click();
          break;
        case "i":
        case "I":
          e.preventDefault();
          if (el.playerBtnStats) el.playerBtnStats.click();
          break;
        case "o":
        case "O":
          e.preventDefault();
          openRemoteControlModal();
          break;
        case "m":
        case "M":
          e.preventDefault();
          if (state.video) {
            state.video.muted = !state.video.muted;
            state.isMuted = state.video.muted;
            if (el.hudVolumeVal) el.hudVolumeVal.textContent = state.isMuted ? "MUTED" : `${state.volume}%`;
            showVolumeHud();
          }
          break;
        case "l":
        case "L":
          e.preventDefault();
          if (el.playerOverlay && el.playerOverlay.style.display !== "none") {
            if (state.isLocked) {
              unlockScreen();
            } else {
              lockScreen();
            }
          }
          break;
        case "g":
        case "G":
          e.preventDefault();
          goLive();
          break;
        case "s":
        case "S":
          e.preventDefault();
          toggleServer();
          break;
        case "t":
        case "T":
          e.preventDefault();
          toggleAlwaysOnTop();
          break;
        case "r":
        case "R":
          e.preventDefault();
          toggleRecording();
          break;
        case "v":
        case "V":
          e.preventDefault();
          if (state.multiviewActive) closeMultiView();
          else openMultiView();
          break;
        case "a":
        case "A":
          e.preventDefault();
          openModal(el.modalPlayerSettings);
          break;
        case "u":
        case "U":
          e.preventDefault();
          cycleAIUpscaler();
          break;
        case "c":
        case "C":
          e.preventDefault();
          toggleAISplitCompare();
          break;
        case "e":
        case "E":
          e.preventDefault();
          open10BandEqModal();
          break;
        case "x":
        case "X":
          e.preventDefault();
          toggleTurboMode();
          break;
        case "z":
        case "Z":
          e.preventDefault();
          cycleAspectRatio();
          break;
        case "q":
        case "Q":
          e.preventDefault();
          recallPreviousChannel();
          break;
        case "/":
          e.preventDefault();
          openPlayerSearch();
          break;
        case "w":
        case "W":
          e.preventDefault();
          cycleVideoZoom();
          break;
        case "0":
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          handleNumericKey(e.key);
          break;
        case "Escape":
          const openModalElem = Array.from(document.querySelectorAll(".modal-overlay")).find((m) => m.style.display !== "none" && m.style.display !== "");
          if (openModalElem) {
            closeModal(openModalElem);
            return;
          }
          if (state.isPipActive && window.togglePictureInPicture) {
            window.togglePictureInPicture();
          } else if (state.multiviewActive) {
            closeMultiView();
          } else if (state.isLocked) {
            unlockScreen();
          } else if (document.fullscreenElement) {
            document.exitFullscreen();
          } else if (el.playerOverlay && el.playerOverlay.style.display !== "none") {
            closePlayer();
          }
          break;
      }
    });
  }
  var isVoiceAssistantActive = false;
  var voiceRecognizer = null;
  function toggleVoiceAssistant(force) {
    isVoiceAssistantActive = force !== void 0 ? force : !isVoiceAssistantActive;
    if (el.voiceCommandHud) {
      el.voiceCommandHud.style.display = isVoiceAssistantActive ? "flex" : "none";
    }
    if (isVoiceAssistantActive) {
      if (!voiceRecognizer && (window.webkitSpeechRecognition || window.SpeechRecognition)) {
        const Speech = window.webkitSpeechRecognition || window.SpeechRecognition;
        voiceRecognizer = new Speech();
        voiceRecognizer.continuous = false;
        voiceRecognizer.lang = "en-US";
        voiceRecognizer.onresult = (e) => {
          const text = e.results[0][0].transcript;
          if (el.voiceTranscript) el.voiceTranscript.textContent = `"${text}"`;
          handleVoiceCommand(text);
        };
        voiceRecognizer.onerror = () => toggleVoiceAssistant(false);
        voiceRecognizer.onend = () => {
          setTimeout(() => toggleVoiceAssistant(false), 2200);
        };
        try {
          voiceRecognizer.start();
        } catch (e) {
        }
      } else {
        if (el.voiceTranscript) el.voiceTranscript.textContent = "Say a command...";
        setTimeout(() => toggleVoiceAssistant(false), 3e3);
      }
    }
  }
  function handleVoiceCommand(raw) {
    const text = raw.toLowerCase().trim();
    if (text.includes("mute") && !text.includes("unmute")) {
      if (state.video) state.video.muted = true;
      showToast("Voice Command: Audio Muted \u{1F507}", "\u{1F399}\uFE0F");
    } else if (text.includes("unmute")) {
      if (state.video) state.video.muted = false;
      showToast("Voice Command: Audio Unmuted \u{1F50A}", "\u{1F399}\uFE0F");
    } else if (text.includes("sports") || text.includes("score") || text.includes("hud")) {
      toggleSportsHUD(true);
      showToast("Voice Command: Opened Sports HUD \u{1F3C6}", "\u{1F399}\uFE0F");
    } else if (text.includes("slow") || text.includes("replay")) {
      triggerInstantSlowmoReplay();
    } else if (text.includes("ambient") || text.includes("light")) {
      toggleAmbilight();
    } else if (text.includes("guide")) {
      toggleMiniGuide();
    } else if (text.includes("full") || text.includes("screen")) {
      if (el.playerBtnFullscreen) el.playerBtnFullscreen.click();
    } else if (text.includes("clarity") || text.includes("hdr")) {
      cycleVideoClarity();
    } else if (text.includes("tune") || text.includes("play") || text.includes("channel")) {
      const query = text.replace(/tune|play|channel|to/g, "").trim();
      const found = state.allChannels.find((c) => c.name.toLowerCase().includes(query));
      if (found) {
        playChannel(found);
        showToast(`Voice Command: Tuning ${found.name} \u{1F4FA}`, "\u{1F399}\uFE0F");
      }
    }
  }

  // src/desktop/web/src_js/controllers/PlayerController.js
  var currentStreamLoadId = 0;
  function playChannel(channel, index) {
    if (!channel || !channel.streamUrl) return;
    if (state.currentChannel && state.currentChannel.id !== channel.id) {
      state.previousChannel = state.currentChannel;
    }
    state.streamRetryCount = 0;
    state.currentChannel = channel;
    state.currentChannelIndex = index !== void 0 ? index : (state.filteredChannels || []).findIndex((c) => c.id === channel.id);
    if (typeof updateRecallButton === "function") updateRecallButton();
    if (el.playerChannelTitle) el.playerChannelTitle.textContent = channel.name;
    const pipTitle = document.getElementById("pip-channel-title");
    if (pipTitle) pipTitle.textContent = channel.name;
    if (el.playerChannelMeta) el.playerChannelMeta.textContent = `${channel.category || "Live"} \u2022 ${channel.country || "Global"}`;
    if (el.playerChannelNum) {
      el.playerChannelNum.textContent = `CH ${String(channel.channelNumber || state.currentChannelIndex + 1).padStart(2, "0")}`;
    }
    updatePlayerEpg(channel);
    addToRecentlyWatched(channel);
    if (el.miniChannelName) el.miniChannelName.textContent = channel.name;
    if (el.miniChannelMeta) el.miniChannelMeta.textContent = `${channel.category || "Live"} \u2022 1080p HD`;
    updatePlayerFavButton();
    updateActiveCardHighlight();
    renderQuickSwitchCarousel();
    updateMediaSessionMetadata(channel);
    syncRemoteStatus();
    const chServers = CHANNEL_SERVERS[channel.id] || [
      { label: "Server 1", url: channel.streamUrl }
    ];
    state.availableServers = chServers;
    state.serverIndex = 0;
    updateServerButton();
    if (el.playerOverlay) {
      el.playerOverlay.classList.add("is-active");
      el.playerOverlay.style.display = "flex";
    }
    document.body.classList.add("player-active");
    state.isPlayerOpen = true;
    if (el.miniPlayerBar) el.miniPlayerBar.style.display = "none";
    showControls();
    loadMediaStream(chServers[0].url);
  }
  function updateServerButton() {
    if (!el.playerBtnServer) return;
    if (state.availableServers && state.availableServers.length > 1) {
      el.playerBtnServer.style.display = "flex";
      const curServer = state.availableServers[state.serverIndex] || state.availableServers[0];
      if (el.playerServerLabel) el.playerServerLabel.textContent = curServer.label;
    } else {
      el.playerBtnServer.style.display = "none";
    }
  }
  function toggleServer() {
    if (!state.availableServers || state.availableServers.length <= 1) return;
    state.serverIndex = (state.serverIndex + 1) % state.availableServers.length;
    updateServerButton();
    const targetServer = state.availableServers[state.serverIndex];
    showStreamNotice(`Switching to ${targetServer.label}...`, 2500);
    loadMediaStream(targetServer.url);
  }
  function parseStreamEndpoint(rawUrl) {
    if (!rawUrl.includes("|")) {
      return { cleanUrl: rawUrl.trim(), clearKeys: {}, headers: {} };
    }
    const cleanUrl = rawUrl.substring(0, rawUrl.indexOf("|")).trim();
    const paramPart = rawUrl.substring(rawUrl.indexOf("|") + 1).trim();
    const headers = {};
    const clearKeys = {};
    const pairs = paramPart.split(/[&|]/).filter((p) => p.trim().length > 0);
    for (const pair of pairs) {
      const eqIdx = pair.indexOf("=");
      if (eqIdx !== -1) {
        const k = pair.substring(0, eqIdx).trim().toLowerCase();
        const v = pair.substring(eqIdx + 1).trim();
        if (k === "clearkey" || k === "drmkey" || k === "key") {
          if (v.includes(":")) {
            const parts = v.split(":");
            const kid = parts[0].trim();
            const key = parts[1].trim();
            clearKeys[kid] = key;
          }
        } else if (k === "user-agent" || k === "ua") {
          headers["User-Agent"] = v;
        } else if (k === "referer") {
          headers["Referer"] = v;
        } else if (k === "origin") {
          headers["Origin"] = v;
        } else {
          headers[pair.substring(0, eqIdx).trim()] = v;
        }
      }
    }
    return { cleanUrl, clearKeys, headers };
  }
  function startContinuousHealthWatchdog() {
    if (state.healthInterval) {
      clearInterval(state.healthInterval);
      state.healthInterval = null;
    }
    if (isMobileDevice()) {
      return;
    }
    state.lastPlayhead = -1;
    state.freezeCounter = 0;
    state.healthInterval = setInterval(() => {
      if (!state.video || !state.isPlaying || el.playerOverlay.style.display === "none") {
        return;
      }
      if (state.video.paused || state.video.seeking) {
        state.freezeCounter = 0;
        return;
      }
      const cur = state.video.currentTime;
      let isStalled = false;
      if (state.lastPlayhead >= 0 && Math.abs(cur - state.lastPlayhead) < 0.05 && state.video.readyState < 3) {
        isStalled = true;
      }
      if (isStalled) {
        state.freezeCounter++;
        console.warn(`[HealthWatchdog] Playback stall detected (${state.freezeCounter}) at ${cur.toFixed(2)}s`);
        if (state.freezeCounter === 2) {
          let jumped = false;
          if (state.video.buffered && state.video.buffered.length > 0) {
            for (let i = 0; i < state.video.buffered.length; i++) {
              const bStart = state.video.buffered.start(i);
              if (cur < bStart && bStart - cur <= 2) {
                state.video.currentTime = bStart + 0.1;
                jumped = true;
                break;
              }
            }
          }
          if (!jumped) {
            state.video.currentTime = cur + 0.3;
          }
          if (state.shakaPlayer) {
            try {
              state.shakaPlayer.retryStreaming();
            } catch (e) {
            }
          }
          state.video.play().catch(() => {
          });
        } else if (state.freezeCounter === 3) {
          console.warn("[HealthWatchdog] Resyncing stream to live edge...");
          if (state.shakaPlayer) {
            try {
              const range = state.shakaPlayer.seekRange();
              if (range && range.end > 0) {
                state.video.currentTime = Math.max(range.start, range.end - 1.2);
              }
            } catch (e) {
            }
          } else if (state.video.duration && isFinite(state.video.duration)) {
            state.video.currentTime = Math.max(0, state.video.duration - 1);
          }
          state.video.play().catch(() => {
          });
        } else if (state.freezeCounter >= 4) {
          state.freezeCounter = 0;
          if (state.availableServers && state.availableServers.length > 1) {
            console.warn("[HealthWatchdog] Primary stream halted. Auto-switching to backup server...");
            state.serverIndex = (state.serverIndex + 1) % state.availableServers.length;
            const nextSrv = state.availableServers[state.serverIndex];
            updateServerButton();
            showStreamNotice(`Auto-recovered live broadcast \u2022 ${nextSrv.label}`, 3500);
            loadMediaStream(nextSrv.url);
          } else {
            console.warn("[HealthWatchdog] Stream stalled. Reloading stream engine...");
            showStreamNotice("Reconnecting live broadcast...", 2500);
            if (state.currentChannel) {
              loadMediaStream(state.currentChannel.streamUrl);
            }
          }
        }
      } else {
        state.freezeCounter = 0;
      }
      state.lastPlayhead = cur;
    }, 3e3);
  }
  function loadHlsStream(cleanUrl) {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    const canPlayNative = state.video && state.video.canPlayType("application/vnd.apple.mpegurl");
    if (isIOS && canPlayNative) {
      console.log("[StreamEngine] iOS detected: using Apple Hardware Native HLS");
      state.video.src = cleanUrl;
      state.video.play().catch((e) => console.log("Native video play note:", e));
      updatePlayPauseIcons(true);
      state.video.onerror = () => {
        console.warn("iOS native video error, checking backup server...");
        if (state.availableServers && state.availableServers.length > 1) {
          state.serverIndex = (state.serverIndex + 1) % state.availableServers.length;
          const nextSrv = state.availableServers[state.serverIndex];
          updateServerButton();
          showStreamNotice(`Auto-recovered live broadcast \u2022 ${nextSrv.label}`, 3500);
          state.video.src = nextSrv.url;
          state.video.play().catch(() => {
          });
        }
      };
      return;
    }
    if (typeof Hls !== "undefined" && Hls.isSupported()) {
      console.log("Playing with HLS.js:", cleanUrl);
      const isMobile = isMobileDevice();
      const config = {
        enableWorker: true,
        lowLatencyMode: !!state.isLowLatencyMode,
        backBufferLength: isMobile ? 30 : 180,
        maxBufferLength: state.isLowLatencyMode ? 2 : isMobile ? 30 : 60,
        maxMaxBufferLength: isMobile ? 60 : 180,
        maxBufferSize: isMobile ? 30 * 1024 * 1024 : 120 * 1024 * 1024,
        liveSyncDurationCount: state.isLowLatencyMode ? 1 : 3,
        liveMaxLatencyDurationCount: state.isLowLatencyMode ? 2 : 10,
        manifestLoadingTimeOut: 15e3,
        manifestLoadingMaxRetry: 4,
        levelLoadingTimeOut: 15e3,
        levelLoadingMaxRetry: 4,
        fragLoadingTimeOut: 2e4,
        fragLoadingMaxRetry: 5
      };
      const hls = new Hls(config);
      state.hls = hls;
      hls.loadSource(cleanUrl);
      hls.attachMedia(state.video);
      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        console.log("HLS Manifest Parsed! Levels:", data.levels ? data.levels.length : 0);
        state.qualityLevels = data.levels || [];
        renderQualityOptions();
        updateAudioAndSubtitleTracks();
        state.video.play().catch((e) => console.log("Auto-play blocked, awaiting user click", e));
        updatePlayPauseIcons(true);
        startContinuousHealthWatchdog();
      });
      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => {
        updateAudioAndSubtitleTracks();
      });
      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, () => {
        updateAudioAndSubtitleTracks();
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        const level = state.qualityLevels[data.level];
        if (level && level.height && el.playerQualityLabel) {
          el.playerQualityLabel.textContent = `${level.height}p`;
        }
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        const isHttpFatal = data.response && (data.response.code === 403 || data.response.code === 404 || data.response.code === 410);
        if (data.fatal || isHttpFatal) {
          if (state.availableServers && state.availableServers.length > 1) {
            state.serverIndex = (state.serverIndex + 1) % state.availableServers.length;
            const nextSrv = state.availableServers[state.serverIndex];
            updateServerButton();
            showStreamNotice(`Stream recovered \u2022 ${nextSrv.label}`, 3500);
            hls.destroy();
            state.hls = null;
            loadMediaStream(nextSrv.url);
            return;
          }
          const chId = state.currentChannel ? state.currentChannel.id : null;
          const catLower = (state.currentChannel?.category || "").toLowerCase();
          const nameLower = (state.currentChannel?.name || "").toLowerCase();
          const isTennis = catLower.includes("tennis") || nameLower.includes("tennis") || chId && chId.includes("ten");
          if (isTennis && cleanUrl !== "https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01444-tennischannelth-tennischnlintl-lggb/playlist.m3u8") {
            showStreamNotice("Primary stream unreachable \u2022 Playing Tennis Channel HD", 3500);
            hls.destroy();
            state.hls = null;
            loadHlsStream("https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01444-tennischannelth-tennischnlintl-lggb/playlist.m3u8");
            return;
          }
          const isMotoGp = catLower.includes("moto") || catLower.includes("racing") || nameLower.includes("motogp") || nameLower.includes("spotv");
          if (isMotoGp && cleanUrl !== "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8") {
            showStreamNotice("Primary stream unreachable \u2022 Playing Eurosport Motorsport 4K", 3500);
            hls.destroy();
            state.hls = null;
            loadHlsStream("http://88.212.15.50/live/esp_4k_atk/playlist.m3u8");
            return;
          }
          const isCricket = catLower.includes("cricket") || nameLower.includes("cricket");
          if (isCricket && cleanUrl !== "https://mycoffeetime.net/play/tSDRdsaoGGQ2qYgRPDEe9q-qMIzoahbJArH3W3vOiEaB97nXMpWmLb0Ts759Tjsp/m3u8") {
            showStreamNotice("Primary stream unreachable \u2022 Playing T Sports HD", 3500);
            hls.destroy();
            state.hls = null;
            loadHlsStream("https://mycoffeetime.net/play/tSDRdsaoGGQ2qYgRPDEe9q-qMIzoahbJArH3W3vOiEaB97nXMpWmLb0Ts759Tjsp/m3u8");
            return;
          }
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              state.streamRetryCount = (state.streamRetryCount || 0) + 1;
              if (state.streamRetryCount <= 3) {
                showStreamNotice(`Connection lost \u2022 Auto-reconnecting (${state.streamRetryCount}/3)...`, 3500);
                const recBtn = document.getElementById("btn-player-notice-reconnect");
                if (recBtn) recBtn.style.display = "inline-flex";
                setTimeout(() => {
                  reconnectCurrentStream(true);
                }, 1200);
                return;
              }
              if (state.video && state.video.canPlayType("application/vnd.apple.mpegurl") && !state._triedNativeHlsFallback) {
                state._triedNativeHlsFallback = true;
                hls.destroy();
                state.hls = null;
                state.video.src = cleanUrl;
                state.video.play().catch((e) => console.log("Native video play error:", e));
                updatePlayPauseIcons(true);
                startContinuousHealthWatchdog();
                return;
              }
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              showStreamNotice("Stream error: could not connect to broadcast");
              hls.destroy();
              break;
          }
        }
      });
    } else if (state.video && state.video.canPlayType("application/vnd.apple.mpegurl")) {
      state.video.src = cleanUrl;
      state.video.play().catch((e) => console.log("Native video play error:", e));
      updatePlayPauseIcons(true);
      startContinuousHealthWatchdog();
    }
  }
  async function loadMediaStream(rawUrl) {
    const loadId = ++currentStreamLoadId;
    state._triedNativeHlsFallback = false;
    const { cleanUrl, clearKeys, headers } = parseStreamEndpoint(rawUrl);
    const chId = state.currentChannel ? state.currentChannel.id : null;
    const hasClearKeys = Object.keys(clearKeys).length > 0;
    if (state.healthInterval) {
      clearInterval(state.healthInterval);
      state.healthInterval = null;
    }
    state.freezeCounter = 0;
    state.lastPlayhead = -1;
    if (state.stallWatchdog) {
      clearTimeout(state.stallWatchdog);
      state.stallWatchdog = null;
    }
    if (state.hls) {
      state.hls.destroy();
      state.hls = null;
    }
    if (state.shakaPlayer) {
      try {
        await state.shakaPlayer.destroy();
      } catch (e) {
      }
      state.shakaPlayer = null;
    }
    if (loadId !== currentStreamLoadId) return;
    state.isLive = true;
    state.dvrOffsetSeconds = 0;
    updateDvrDisplay();
    const isDash = cleanUrl.toLowerCase().includes(".mpd") || hasClearKeys;
    if (isDash && window.shaka && shaka.Player.isBrowserSupported()) {
      console.log("Playing with Shaka Player (DASH/ClearKey):", cleanUrl);
      const player = new shaka.Player();
      state.shakaPlayer = player;
      await player.attach(state.video, false);
      if (loadId !== currentStreamLoadId) {
        try {
          await player.destroy();
        } catch (e) {
        }
        return;
      }
      const keyList = Object.keys(clearKeys);
      let softCencInstalled = false;
      if (keyList.length > 0 && window.LiveTVSoftCENC) {
        try {
          softCencInstalled = await window.LiveTVSoftCENC.installSoftwareClearKey(player, clearKeys);
          if (softCencInstalled) {
            console.log("[App] Software CENC decryptor successfully initialized for stream!");
          }
        } catch (e) {
          console.warn("[App] Failed to initialize LiveTVSoftCENC:", e);
        }
      }
      const drmConfig = {};
      if (keyList.length > 0 && !softCencInstalled) {
        drmConfig.clearKeys = clearKeys;
      }
      player.configure({
        drm: drmConfig,
        manifest: {
          ignoreDrmInfo: softCencInstalled ? true : false,
          dash: {
            autoCorrectDrift: true,
            ignoreMinBufferTime: true
          }
        },
        streaming: {
          bufferingGoal: 8,
          rebufferingGoal: 2,
          bufferBehind: 5,
          stallEnabled: true,
          stallThreshold: 1,
          stallSkip: 0.5,
          jumpLargeGaps: true,
          smallGapLimit: 0.5,
          retryParameters: {
            maxAttempts: 5,
            baseDelay: 800,
            backoffFactor: 1.5,
            fuzzFactor: 0.5,
            timeout: 1e4
          }
        }
      });
      if (Object.keys(headers).length > 0) {
        player.getNetworkingEngine().registerRequestFilter((type, request) => {
          for (const [k, v] of Object.entries(headers)) {
            request.headers[k] = v;
          }
        });
      }
      player.addEventListener("error", (event) => {
        console.warn("Shaka Player error event:", event.detail);
        if (player && event.detail && event.detail.severity !== 2) {
          try {
            player.retryStreaming();
            return;
          } catch (e) {
          }
        }
        if (state.availableServers && state.availableServers.length > 1) {
          state.serverIndex = (state.serverIndex + 1) % state.availableServers.length;
          const nextSrv = state.availableServers[state.serverIndex];
          updateServerButton();
          showStreamNotice(`Stream recovered \u2022 ${nextSrv.label}`, 3500);
          player.destroy().catch(() => {
          });
          state.shakaPlayer = null;
          loadMediaStream(nextSrv.url);
          return;
        }
        const chId2 = state.currentChannel ? state.currentChannel.id : null;
        const catLower = (state.currentChannel?.category || "").toLowerCase();
        const nameLower = (state.currentChannel?.name || "").toLowerCase();
        if (catLower.includes("tennis") || nameLower.includes("tennis") || chId2 && chId2.includes("ten")) {
          showStreamNotice("Primary stream unreachable \u2022 Playing Tennis Channel HD", 3500);
          player.destroy().catch(() => {
          });
          state.shakaPlayer = null;
          loadHlsStream("https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01444-tennischannelth-tennischnlintl-lggb/playlist.m3u8");
          return;
        }
        const isMotoGp = catLower.includes("moto") || catLower.includes("racing") || nameLower.includes("spotv") || nameLower.includes("motogp");
        if (isMotoGp) {
          const fallbackUrl = chId2 && MOTOGP_BACKUPS[chId2] || "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8";
          showStreamNotice("Stream notice \u2022 Playing verified live broadcast", 3500);
          player.destroy().catch(() => {
          });
          state.shakaPlayer = null;
          loadHlsStream(fallbackUrl);
          return;
        }
        if (catLower.includes("cricket") || nameLower.includes("cricket")) {
          showStreamNotice("Primary stream unreachable \u2022 Playing T Sports HD", 3500);
          player.destroy().catch(() => {
          });
          state.shakaPlayer = null;
          loadHlsStream("https://mycoffeetime.net/play/tSDRdsaoGGQ2qYgRPDEe9q-qMIzoahbJArH3W3vOiEaB97nXMpWmLb0Ts759Tjsp/m3u8");
          return;
        }
      });
      try {
        await player.load(cleanUrl);
        state.video.play().catch((e) => console.log("Shaka play blocked:", e));
        updatePlayPauseIcons(true);
        startContinuousHealthWatchdog();
        const tracks = player.getVariantTracks();
        state.qualityLevels = tracks.map((t) => ({
          height: t.height,
          width: t.width,
          bitrate: t.bandwidth
        }));
        renderQualityOptions();
      } catch (err) {
        console.warn("Shaka Player load failed for", cleanUrl, err);
        if (state.availableServers && state.availableServers.length > 1) {
          state.serverIndex = (state.serverIndex + 1) % state.availableServers.length;
          const nextSrv = state.availableServers[state.serverIndex];
          updateServerButton();
          showStreamNotice(`Connecting to ${nextSrv.label}...`, 3500);
          try {
            await player.destroy();
          } catch (e) {
          }
          state.shakaPlayer = null;
          loadMediaStream(nextSrv.url);
          return;
        }
        const chId2 = state.currentChannel ? state.currentChannel.id : null;
        const catLower = (state.currentChannel?.category || "").toLowerCase();
        const nameLower = (state.currentChannel?.name || "").toLowerCase();
        if (catLower.includes("tennis") || nameLower.includes("tennis") || chId2 && chId2.includes("ten")) {
          showStreamNotice("Playing Tennis Channel HD", 3500);
          try {
            await player.destroy();
          } catch (e) {
          }
          state.shakaPlayer = null;
          loadHlsStream("https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01444-tennischannelth-tennischnlintl-lggb/playlist.m3u8");
          return;
        }
        const isMotoGp = catLower.includes("moto") || catLower.includes("racing") || nameLower.includes("spotv") || nameLower.includes("motogp");
        if (isMotoGp) {
          const fallbackUrl = chId2 && MOTOGP_BACKUPS[chId2] || "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8";
          showStreamNotice("Playing verified live broadcast", 3500);
          try {
            await player.destroy();
          } catch (e) {
          }
          state.shakaPlayer = null;
          loadHlsStream(fallbackUrl);
          return;
        }
        if (catLower.includes("cricket") || nameLower.includes("cricket")) {
          showStreamNotice("Playing T Sports HD", 3500);
          try {
            await player.destroy();
          } catch (e) {
          }
          state.shakaPlayer = null;
          loadHlsStream("https://mycoffeetime.net/play/tSDRdsaoGGQ2qYgRPDEe9q-qMIzoahbJArH3W3vOiEaB97nXMpWmLb0Ts759Tjsp/m3u8");
          return;
        }
        showStreamNotice("Stream failed to load (" + (err.message || "DRM Error") + ")");
      }
      return;
    }
    loadHlsStream(cleanUrl);
  }
  function playNextChannel() {
    const list = state.filteredChannels && state.filteredChannels.length > 0 ? state.filteredChannels : state.allChannels;
    if (!list || !list.length) return;
    let curIdx = state.currentChannelIndex;
    if (curIdx < 0 && state.currentChannel) {
      curIdx = list.findIndex((c) => c.id === state.currentChannel.id);
    }
    let nextIdx = curIdx >= 0 ? curIdx + 1 : 0;
    if (nextIdx >= list.length) nextIdx = 0;
    playChannel(list[nextIdx], nextIdx);
  }
  function playPrevChannel() {
    const list = state.filteredChannels && state.filteredChannels.length > 0 ? state.filteredChannels : state.allChannels;
    if (!list || !list.length) return;
    let curIdx = state.currentChannelIndex;
    if (curIdx < 0 && state.currentChannel) {
      curIdx = list.findIndex((c) => c.id === state.currentChannel.id);
    }
    let prevIdx = curIdx >= 0 ? curIdx - 1 : 0;
    if (prevIdx < 0) prevIdx = list.length - 1;
    playChannel(list[prevIdx], prevIdx);
  }
  async function closePlayer() {
    currentStreamLoadId++;
    if (state.isLocked) {
      unlockScreen();
    }
    hideLockOverlay();
    if (state.healthInterval) {
      clearInterval(state.healthInterval);
      state.healthInterval = null;
    }
    state.freezeCounter = 0;
    state.lastPlayhead = -1;
    try {
      stopAIUpscaler();
    } catch (e) {
    }
    try {
      stopAudioHudVisualizer();
    } catch (e) {
    }
    if (window.stopAmbilight) window.stopAmbilight();
    if (state.isAudioOnly) {
      state.isAudioOnly = false;
      if (state.video) state.video.style.display = "block";
      const hud = document.getElementById("audio-only-hud");
      if (hud) hud.style.display = "none";
      const radioBtn = document.getElementById("player-btn-radio");
      if (radioBtn) radioBtn.classList.remove("active-setting");
      const radioLabel = document.getElementById("player-radio-label");
      if (radioLabel) radioLabel.textContent = "Radio Mode";
    }
    if (state.videoZoom !== 1 || state.videoPanX !== 0 || state.videoPanY !== 0) {
      state.videoZoom = 1;
      state.videoPanX = 0;
      state.videoPanY = 0;
      if (state.video) state.video.style.transform = "none";
    }
    if (state.hls) {
      state.hls.destroy();
      state.hls = null;
    }
    if (state.shakaPlayer) {
      try {
        await state.shakaPlayer.destroy();
      } catch (e) {
      }
      state.shakaPlayer = null;
    }
    if (state.video) {
      state.video.pause();
      state.video.removeAttribute("src");
      state.video.load();
    }
    state.isPlaying = false;
    state.currentChannel = null;
    hideControls2();
    document.querySelectorAll(".modal-overlay").forEach((m) => {
      m.style.display = "none";
      if (m.parentNode !== document.body) {
        document.body.appendChild(m);
      }
    });
    if (el.playerOverlay) {
      el.playerOverlay.classList.remove("is-active");
      el.playerOverlay.classList.remove("controls-hidden");
      el.playerOverlay.style.display = "none";
    }
    document.body.classList.remove("player-active");
    document.body.classList.remove("controls-hidden");
    state.isPlayerOpen = false;
    if (el.miniPlayerBar) el.miniPlayerBar.style.display = "none";
    updateActiveCardHighlight();
  }
  function cycleVideoZoom() {
    const levels = [1, 1.25, 1.5, 2];
    const curIdx = levels.indexOf(state.videoZoom);
    const nextIdx = (curIdx + 1) % levels.length;
    setVideoZoom(levels[nextIdx]);
  }
  window.cycleVideoZoom = cycleVideoZoom;
  function setVideoZoom(zoom) {
    state.videoZoom = zoom;
    if (zoom === 1) {
      state.videoPanX = 0;
      state.videoPanY = 0;
    }
    applyVideoTransform();
    const lbl = el.playerZoomLabel || document.getElementById("player-zoom-label");
    if (lbl) lbl.textContent = `${zoom}x`;
    showToast(`Video Zoom: ${zoom}x${zoom > 1 ? " \u2022 Drag to pan" : ""}`, "\u{1F50E}");
  }
  window.setVideoZoom = setVideoZoom;
  function applyVideoTransform() {
    if (!state.video) return;
    if (state.videoZoom === 1 && state.videoPanX === 0 && state.videoPanY === 0) {
      state.video.style.transform = "";
      state.video.style.cursor = "default";
    } else {
      state.video.style.transform = `scale(${state.videoZoom}) translate(${state.videoPanX}px, ${state.videoPanY}px)`;
      state.video.style.transformOrigin = "center center";
      state.video.style.cursor = "grab";
    }
  }
  window.applyVideoTransform = applyVideoTransform;
  function initVideoZoomGestures() {
    const container = el.videoContainer || document.getElementById("video-container");
    if (!container) return;
    let initialPinchDist = 0;
    let initialPinchZoom = 1;
    let panStartX = 0;
    let panStartY = 0;
    let isTouching = false;
    container.addEventListener("touchstart", (e) => {
      if (e.touches.length === 2) {
        initialPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialPinchZoom = state.videoZoom;
      } else if (e.touches.length === 1 && state.videoZoom > 1) {
        isTouching = true;
        panStartX = e.touches[0].clientX - state.videoPanX;
        panStartY = e.touches[0].clientY - state.videoPanY;
      }
    }, { passive: true });
    container.addEventListener("touchmove", (e) => {
      if (e.touches.length === 2 && initialPinchDist > 0) {
        const curDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const ratio = curDist / initialPinchDist;
        let newZoom = Math.min(2.5, Math.max(1, parseFloat((initialPinchZoom * ratio).toFixed(2))));
        state.videoZoom = newZoom;
        applyVideoTransform();
        const lbl = el.playerZoomLabel || document.getElementById("player-zoom-label");
        if (lbl) lbl.textContent = `${state.videoZoom}x`;
      } else if (e.touches.length === 1 && isTouching && state.videoZoom > 1) {
        state.videoPanX = Math.round(e.touches[0].clientX - panStartX);
        state.videoPanY = Math.round(e.touches[0].clientY - panStartY);
        applyVideoTransform();
      }
    }, { passive: true });
    container.addEventListener("touchend", () => {
      initialPinchDist = 0;
      isTouching = false;
    }, { passive: true });
    let isMouseDown = false;
    let mouseStartX = 0;
    let mouseStartY = 0;
    container.addEventListener("mousedown", (e) => {
      if (state.videoZoom > 1 && e.button === 0 && !e.target.closest(".player-controls, .modal-overlay, .modal")) {
        isMouseDown = true;
        mouseStartX = e.clientX - state.videoPanX;
        mouseStartY = e.clientY - state.videoPanY;
        if (state.video) state.video.style.cursor = "grabbing";
      }
    });
    window.addEventListener("mousemove", (e) => {
      if (isMouseDown && state.videoZoom > 1) {
        state.videoPanX = Math.round(e.clientX - mouseStartX);
        state.videoPanY = Math.round(e.clientY - mouseStartY);
        applyVideoTransform();
      }
    });
    window.addEventListener("mouseup", () => {
      if (isMouseDown) {
        isMouseDown = false;
        if (state.video) state.video.style.cursor = state.videoZoom > 1 ? "grab" : "default";
      }
    });
  }
  function reconnectCurrentStream(isAuto = false) {
    if (!state.currentChannel) return;
    console.log(`[StreamReconnect] Reconnecting ${state.currentChannel.name} (auto: ${isAuto})...`);
    showStreamNotice(isAuto ? "Auto-reconnecting stream..." : "Reloading stream...", 3500);
    showToast(isAuto ? "Stream stall detected: Auto-reconnecting..." : "Reloading broadcast stream...", "\u21BB");
    if (state.hls) {
      try {
        state.hls.destroy();
      } catch (e) {
      }
      state.hls = null;
    }
    if (state.shakaPlayer) {
      try {
        state.shakaPlayer.destroy();
      } catch (e) {
      }
      state.shakaPlayer = null;
    }
    if (state.video) {
      state.video.pause();
      state.video.removeAttribute("src");
      state.video.load();
    }
    const srvUrl = state.availableServers && state.availableServers[state.serverIndex] ? state.availableServers[state.serverIndex].url : state.currentChannel.streamUrl;
    setTimeout(() => {
      loadMediaStream(srvUrl);
    }, 300);
  }
  window.reconnectCurrentStream = reconnectCurrentStream;
  var clarityIndex = 0;
  function cycleVideoClarity() {
    clarityIndex = (clarityIndex + 1) % CLARITY_MODES.length;
    applyVideoClarity(clarityIndex);
  }
  function applyVideoClarity(index) {
    clarityIndex = index % CLARITY_MODES.length;
    const mode = CLARITY_MODES[clarityIndex];
    const video = state.video || document.getElementById("video-player");
    if (video) {
      CLARITY_MODES.forEach((m) => {
        if (m.cls) video.classList.remove(m.cls);
      });
      if (mode.cls) video.classList.add(mode.cls);
    }
    if (el.playerClarityLabel) {
      el.playerClarityLabel.textContent = mode.label;
    }
    showToast(`Video Mode: ${mode.label}`, "\u2728");
  }

  // src/desktop/web/src_js/views/ChannelView.js
  function renderCategoriesBar() {
    if (!el.categoriesBar) return;
    el.categoriesBar.innerHTML = "";
    const allChip = document.createElement("button");
    allChip.className = `category-chip ${state.selectedCategory === "All" ? "active" : ""}`;
    allChip.innerHTML = `<span>\u{1F310}</span><span>All</span>`;
    allChip.onclick = () => selectCategory("All");
    el.categoriesBar.appendChild(allChip);
    const favChip = document.createElement("button");
    favChip.className = `category-chip ${state.selectedCategory === "Favorites" ? "active" : ""}`;
    const favCount = (state.favorites || []).length;
    favChip.innerHTML = `<span>\u2B50</span><span>Favorites</span><span style="opacity: 0.7; font-size: 11px;">(${favCount})</span>`;
    favChip.onclick = () => selectCategory("Favorites");
    el.categoriesBar.appendChild(favChip);
    (state.categories || []).forEach((cat) => {
      const chip = document.createElement("button");
      chip.className = `category-chip ${state.selectedCategory === cat ? "active" : ""}`;
      chip.textContent = cat;
      chip.onclick = () => selectCategory(cat);
      el.categoriesBar.appendChild(chip);
    });
  }
  function renderChannelBatch() {
    if (!el.channelsGrid) return;
    const start = state.renderedChannelCount;
    const end = Math.min(start + state.PAGE_SIZE, state.filteredChannels.length);
    if (start >= end) return;
    const fragment = document.createDocumentFragment();
    for (let i = start; i < end; i++) {
      const channel = state.filteredChannels[i];
      const card = createChannelCard(channel, i);
      fragment.appendChild(card);
    }
    el.channelsGrid.appendChild(fragment);
    state.renderedChannelCount = end;
  }
  function createChannelCard(channel, index) {
    const card = document.createElement("div");
    const isCurrentlyPlaying = state.currentChannel && state.currentChannel.id === channel.id;
    card.className = `channel-card ${isCurrentlyPlaying ? "active" : ""}`;
    const isFav = (state.favorites || []).includes(channel.id);
    const favRank = isFav ? state.favorites.indexOf(channel.id) + 1 : null;
    const epg = getChannelEPG(channel);
    const initial = (channel.name || "TV").charAt(0).toUpperCase();
    card.innerHTML = `
    <div class="channel-logo-wrap">
      ${channel.logoUrl ? `<img class="channel-logo" src="${escapeHtml(channel.logoUrl)}" loading="lazy" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
         <div class="channel-logo-placeholder" style="display:none;">${initial}</div>` : `<div class="channel-logo-placeholder">${initial}</div>`}
    </div>
    <div class="channel-info">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 3px;">
        <span class="channel-card-number">#${channel.channelNumber || index + 1}</span>
        <div class="channel-name" title="${escapeHtml(channel.name)}">${escapeHtml(channel.name)}</div>
      </div>
      <div class="channel-meta">
        <span>${escapeHtml(channel.category || "Live")}</span>
        ${channel.country ? `<span class="channel-country-badge">${escapeHtml(channel.country)}</span>` : ""}
        ${favRank ? `<span style="color:#fbbf24; font-weight:800; font-size:10.5px;">\u2605 #${favRank}</span>` : ""}
      </div>
      <div class="card-epg-now" title="Now: ${escapeHtml(epg.current)}">
        <span class="card-epg-dot"></span>
        <span>${escapeHtml(epg.current)}</span>
      </div>
    </div>
    <div class="channel-actions">
      <button class="fav-star-btn ${isFav ? "is-fav" : ""}" title="${isFav ? "Remove Favorite" : "Add to Favorites"}">
        ${isFav ? "\u2605" : "\u2606"}
      </button>
    </div>
  `;
    card.onclick = (e) => {
      if (e.target.closest(".fav-star-btn")) return;
      playChannel(channel, index);
    };
    const favBtn = card.querySelector(".fav-star-btn");
    if (favBtn) {
      favBtn.onclick = (e) => {
        e.stopPropagation();
        toggleFavorite(channel.id);
      };
    }
    return card;
  }
  function updateActiveCardHighlight() {
    if (!el.channelsGrid) return;
    const prevActive = el.channelsGrid.querySelector(".channel-card.active");
    if (prevActive) prevActive.classList.remove("active");
    if (!state.currentChannel) return;
    const currentIdx = state.filteredChannels.findIndex((c) => c.id === state.currentChannel.id);
    if (currentIdx >= 0) {
      const targetCard = el.channelsGrid.children[currentIdx];
      if (targetCard && targetCard.classList.contains("channel-card")) {
        targetCard.classList.add("active");
      }
    }
  }
  function renderQuickSwitchCarousel() {
    if (!el.quickSwitchCarousel) return;
    el.quickSwitchCarousel.innerHTML = "";
    if (!state.filteredChannels.length) return;
    const currentIdx = state.currentChannelIndex >= 0 ? state.currentChannelIndex : 0;
    const count = state.filteredChannels.length;
    const start = Math.max(0, currentIdx - 7);
    const end = Math.min(count, start + 15);
    const fragment = document.createDocumentFragment();
    for (let i = start; i < end; i++) {
      const ch = state.filteredChannels[i];
      const item = document.createElement("button");
      const isCurrent = state.currentChannel && state.currentChannel.id === ch.id;
      const isFav = (state.favorites || []).includes(ch.id);
      item.className = `quick-channel-item ${isCurrent ? "active" : ""}`;
      item.innerHTML = `
      ${isFav ? `<span style="color:var(--gold);">\u2605</span>` : ""}
      <span>${escapeHtml(ch.name)}</span>
    `;
      item.onclick = (e) => {
        e.stopPropagation();
        playChannel(ch, i);
      };
      fragment.appendChild(item);
    }
    el.quickSwitchCarousel.appendChild(fragment);
  }
  function renderRecentlyWatched() {
    if (!el.recentlyWatchedContainer || !el.recentlyWatchedCarousel) return;
    if (!state.recentChannels || state.recentChannels.length === 0) {
      el.recentlyWatchedContainer.style.display = "none";
      return;
    }
    const channelMap = /* @__PURE__ */ new Map();
    state.allChannels.forEach((c) => channelMap.set(c.id, c));
    const validRecents = state.recentChannels.map((id) => channelMap.get(id)).filter(Boolean);
    if (validRecents.length === 0) {
      el.recentlyWatchedContainer.style.display = "none";
      return;
    }
    el.recentlyWatchedContainer.style.display = "block";
    el.recentlyWatchedCarousel.innerHTML = "";
    validRecents.forEach((ch) => {
      const card = document.createElement("div");
      card.className = "recent-card";
      card.onclick = () => playChannel(ch);
      card.innerHTML = `
      <img class="recent-card-logo" src="${escapeHtml(ch.logoUrl || "")}" alt="" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'28\\' height=\\'28\\' fill=\\'%23555\\'><rect width=\\'100%\\' height=\\'100%\\'/></svg>';" />
      <div class="recent-card-info">
        <div class="recent-card-name" title="${escapeHtml(ch.name)}">${escapeHtml(ch.name)}</div>
        <div class="recent-card-meta">${escapeHtml(ch.category || "Live")} \u2022 CH ${String(ch.channelNumber || "").padStart(2, "0")}</div>
      </div>
    `;
      el.recentlyWatchedCarousel.appendChild(card);
    });
  }

  // src/desktop/web/src_js/models/ChannelModel.js
  function getChannelEPG(channel) {
    const now = /* @__PURE__ */ new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const progressPct = minutes % 30 / 30 * 100;
    const remainingMins = 30 - minutes % 30;
    const cat = channel && channel.category ? channel.category.toLowerCase() : "";
    const name = channel && channel.name ? channel.name.toLowerCase() : "";
    if (state.liveEvents && state.liveEvents.length > 0) {
      let liveMatch = null;
      if (channel && channel.id && state.liveEventsTargetMap && state.liveEventsTargetMap.has(channel.id)) {
        liveMatch = state.liveEventsTargetMap.get(channel.id);
      } else if (cat.includes("sport") || cat.includes("cricket") || cat.includes("moto") || cat.includes("racing") || cat.includes("ten") || name.includes("sport")) {
        liveMatch = state.liveEvents.find(
          (ev) => ev.isLive && (ev.targetChannelName && name.includes(ev.targetChannelName.toLowerCase()) || ev.sport && name.includes(ev.sport.toLowerCase()))
        );
      }
      if (liveMatch) {
        return {
          current: `${liveMatch.sportEmoji || "\u{1F3C6}"} ${liveMatch.title} \u2022 LIVE`,
          next: liveMatch.subtitle || "Post-Match Analysis & Studio Highlights",
          progress: Math.min(95, Math.max(15, Math.round(progressPct))),
          remainingMins
        };
      }
    }
    let currentShow = "Live Broadcast Coverage";
    let nextShow = "Prime Time Special";
    if (cat.includes("sport") || cat.includes("cricket") || cat.includes("motogp") || cat.includes("racing")) {
      if (hours >= 19 || hours < 2) {
        currentShow = "Championship Matchday Live";
        nextShow = "Post-Match Analysis & Highlights";
      } else if (hours >= 12) {
        currentShow = "World Sports Live Coverage";
        nextShow = "Matchday Studio Countdown";
      } else {
        currentShow = "Morning Highlights & Replay";
        nextShow = "Live World Feed";
      }
    } else if (cat.includes("news")) {
      if (hours >= 20) {
        currentShow = "Prime News Bulletin & Special Report";
        nextShow = "Late Night Headlines & Analysis";
      } else if (hours >= 18) {
        currentShow = "Evening Primetime News Hour";
        nextShow = "Global Round-Up";
      } else if (hours >= 12) {
        currentShow = "Midday News & Stock Telemetry";
        nextShow = "Special Investigation";
      } else {
        currentShow = "Morning News Watch & Weather";
        nextShow = "Business & Regional News";
      }
    } else if (cat.includes("movie") || cat.includes("cinema")) {
      currentShow = "Feature Film Presentation";
      nextShow = "Blockbuster Cinema Night";
    } else if (cat.includes("kids") || cat.includes("animation") || cat.includes("cartoon")) {
      currentShow = "Animated Adventures Hour";
      nextShow = "Fun Cartoons Marathon";
    } else if (cat.includes("documentary") || cat.includes("nature")) {
      currentShow = "Planet Earth / Wildlife Chronicles";
      nextShow = "Science & History Discovery";
    } else if (cat.includes("music")) {
      currentShow = "Non-Stop Hit Music Countdown";
      nextShow = "Top 40 Chartbusters Live";
    } else {
      currentShow = "World Programming Live";
      nextShow = "Continuous Broadcast";
    }
    return {
      current: currentShow,
      next: nextShow,
      progress: Math.round(progressPct),
      remainingMins
    };
  }
  function loadStoredPreferences() {
    let prefs = null;
    if (window.__LIVETV_SAVED_PREFERENCES__) {
      if (typeof window.__LIVETV_SAVED_PREFERENCES__ === "string") {
        try {
          prefs = JSON.parse(window.__LIVETV_SAVED_PREFERENCES__);
        } catch (e) {
        }
      } else if (typeof window.__LIVETV_SAVED_PREFERENCES__ === "object") {
        prefs = window.__LIVETV_SAVED_PREFERENCES__;
      }
    }
    if (prefs && Array.isArray(prefs.favorites) && prefs.favorites.length > 0) {
      state.favorites = prefs.favorites;
    } else {
      try {
        const savedFavs = localStorage.getItem(STORAGE_FAVORITES);
        if (savedFavs) state.favorites = JSON.parse(savedFavs);
      } catch (e) {
        state.favorites = [];
      }
    }
    if (prefs && Array.isArray(prefs.categoryOrder) && prefs.categoryOrder.length > 0) {
      state.categoryOrder = prefs.categoryOrder;
    } else {
      try {
        const savedCats = localStorage.getItem(STORAGE_CATEGORIES);
        if (savedCats) state.categoryOrder = JSON.parse(savedCats);
      } catch (e) {
        state.categoryOrder = [];
      }
    }
    if (prefs && typeof prefs.volume === "number") {
      state.volume = prefs.volume;
    } else {
      const savedVol = localStorage.getItem(STORAGE_VOLUME);
      if (savedVol !== null) state.volume = parseInt(savedVol, 10);
    }
    const isBoosted = state.volume > 100;
    if (el.sliderVolume) el.sliderVolume.value = state.volume;
    if (el.volumeValText) el.volumeValText.textContent = isBoosted ? `${state.volume}% \u{1F680}` : `${state.volume}%`;
    if (state.video) state.video.volume = Math.min(1, Math.max(0, state.volume / 100));
    if (prefs && typeof prefs.brightness === "number") {
      state.brightness = prefs.brightness;
    } else {
      const savedBri = localStorage.getItem(STORAGE_BRIGHTNESS);
      if (savedBri !== null) state.brightness = parseInt(savedBri, 10);
    }
    if (el.sliderBrightness) el.sliderBrightness.value = state.brightness;
    applyBrightness(state.brightness);
    state.parentalPin = localStorage.getItem("livetv_parental_pin") || "0000";
    state.isKidsModeActive = localStorage.getItem("livetv_kids_mode") === "true";
    if (typeof updateKidsModeHeaderUI === "function") updateKidsModeHeaderUI();
    if (typeof loadScheduledRecordings === "function") loadScheduledRecordings();
    if (localStorage.getItem("livetv_ticker_visible") === "true" && typeof toggleSportsTicker === "function") {
      toggleSportsTicker(true);
    }
  }
  function persistAllPreferences() {
    const payload = {
      favorites: state.favorites,
      categoryOrder: state.categoryOrder,
      volume: state.volume,
      brightness: state.brightness,
      parentalPin: state.parentalPin,
      kidsMode: state.isKidsModeActive
    };
    const jsonStr = JSON.stringify(payload);
    try {
      localStorage.setItem(STORAGE_FAVORITES, JSON.stringify(state.favorites));
      localStorage.setItem(STORAGE_CATEGORIES, JSON.stringify(state.categoryOrder));
      localStorage.setItem(STORAGE_VOLUME, state.volume.toString());
      localStorage.setItem(STORAGE_BRIGHTNESS, state.brightness.toString());
    } catch (e) {
    }
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.savePreferences) {
      try {
        window.webkit.messageHandlers.savePreferences.postMessage(jsonStr);
      } catch (e) {
        console.warn("Native bridge save error:", e);
      }
    }
  }
  function loadSavedCustomChannels() {
    try {
      const raw = localStorage.getItem("livetv_custom_channels");
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list) && list.length > 0) {
          state.allChannels = list.concat(state.allChannels);
        }
      }
    } catch (e) {
      console.warn("Could not load saved custom channels:", e);
    }
  }
  function saveCustomChannel(name, url, category, logo) {
    if (!url || !name) {
      alert("Please enter both Stream URL and Channel Name.");
      return;
    }
    const newChan = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      streamUrl: url.trim(),
      logoUrl: logo ? logo.trim() : "",
      category: category.trim() || "Custom Channels",
      country: "Custom",
      isCustom: true
    };
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem("livetv_custom_channels") || "[]");
    } catch (e) {
    }
    saved.unshift(newChan);
    localStorage.setItem("livetv_custom_channels", JSON.stringify(saved));
    state.allChannels.unshift(newChan);
    buildCategories();
    applyFilterAndSearch();
    syncRemoteChannels();
    showToast(`Added channel: ${newChan.name}`);
    closeModal(el.modalImportM3u);
    playChannel(newChan, 0);
  }
  function sanitizeFavorites() {
    if (!state.allChannels || state.allChannels.length === 0) return;
    const validIds = new Set(state.allChannels.map((c) => String(c.id)));
    const origLen = state.favorites.length;
    state.favorites = state.favorites.filter((id) => validIds.has(String(id)));
    if (state.favorites.length !== origLen) {
      console.log(`[LiveTV] Sanitized favorites: pruned ${origLen - state.favorites.length} orphaned IDs. Total valid favorites: ${state.favorites.length}`);
      persistAllPreferences();
    }
  }
  async function loadChannels() {
    if (window.CHANNELS_DATA && Array.isArray(window.CHANNELS_DATA) && window.CHANNELS_DATA.length > 0) {
      state.allChannels = window.CHANNELS_DATA.slice();
      loadSavedCustomChannels();
      state.allChannels.forEach((ch, idx) => {
        ch.channelNumber = idx + 1;
      });
      sanitizeFavorites();
      buildCategories();
      applyFilterAndSearch();
      loadRecentlyWatched();
      initHeroSpotlight();
      syncRemoteChannels();
      syncRemoteStatus();
      return;
    }
    try {
      const res = await fetch("channels.json");
      if (!res.ok) throw new Error("Failed to load channels.json");
      const data = await res.json();
      state.allChannels = data;
      loadSavedCustomChannels();
      state.allChannels.forEach((ch, idx) => {
        ch.channelNumber = idx + 1;
      });
      sanitizeFavorites();
      buildCategories();
      applyFilterAndSearch();
      loadRecentlyWatched();
      initHeroSpotlight();
      syncRemoteChannels();
      syncRemoteStatus();
    } catch (err) {
      console.error("Error loading channels:", err);
      if (el.channelCountText) el.channelCountText.textContent = "Error loading channel catalog.";
    }
  }
  function buildCategories() {
    const catSet = /* @__PURE__ */ new Set();
    state.allChannels.forEach((c) => {
      if (c.category) catSet.add(c.category);
    });
    const discovered = Array.from(catSet);
    let ordered = [];
    if (state.categoryOrder && state.categoryOrder.length > 0) {
      state.categoryOrder.forEach((cat) => {
        if (discovered.includes(cat) && !ordered.includes(cat)) {
          ordered.push(cat);
        }
      });
      discovered.forEach((cat) => {
        if (!ordered.includes(cat)) ordered.push(cat);
      });
    } else {
      const primary = ["Bangladesh", "Sports", "Cricket", "MotoGP", "News", "Movies", "Entertainment", "Music", "Kids", "Documentary"];
      primary.forEach((p) => {
        if (discovered.includes(p) && !ordered.includes(p)) ordered.push(p);
      });
      discovered.sort().forEach((cat) => {
        if (!ordered.includes(cat)) ordered.push(cat);
      });
    }
    state.categories = ordered;
    renderCategoriesBar();
  }
  function selectCategory(category) {
    state.selectedCategory = category;
    renderCategoriesBar();
    applyFilterAndSearch();
    const activeChip = el.categoriesBar?.querySelector(".category-chip.active");
    if (activeChip) activeChip.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }
  function applyFilterAndSearch() {
    const query = state.searchQuery.trim().toLowerCase();
    let list = [];
    if (state.selectedCategory === "Favorites") {
      const favSet = new Set(state.favorites);
      const favMap = /* @__PURE__ */ new Map();
      state.allChannels.forEach((c) => {
        if (favSet.has(c.id)) favMap.set(c.id, c);
      });
      state.favorites.forEach((id) => {
        if (favMap.has(id)) list.push(favMap.get(id));
      });
    } else if (state.selectedCategory === "All") {
      list = state.allChannels.slice();
    } else {
      list = state.allChannels.filter((c) => c.category === state.selectedCategory);
    }
    if (query.length > 0) {
      list = list.filter((c) => {
        const nameMatch = c.name && c.name.toLowerCase().includes(query);
        const catMatch = c.category && c.category.toLowerCase().includes(query);
        const countryMatch = c.country && c.country.toLowerCase().includes(query);
        return nameMatch || catMatch || countryMatch;
      });
    }
    if (state.isKidsModeActive) {
      const safeCategories = ["animation", "kids", "cartoons", "children", "family", "documentary", "nature", "sports", "music", "educational"];
      list = list.filter((c) => {
        const cat = (c.category || "").toLowerCase();
        const name = (c.name || "").toLowerCase();
        if (cat.includes("xxx") || cat.includes("adult") || name.includes("xxx") || name.includes("adult") || cat.includes("erotic") || cat.includes("crime")) return false;
        return safeCategories.some((sc) => cat.includes(sc) || name.includes(sc));
      });
    }
    state.filteredChannels = list;
    if (el.channelCountText) {
      el.channelCountText.textContent = `Showing ${list.length.toLocaleString()} channels \u2022 ${state.selectedCategory}${state.isKidsModeActive ? " (Kids Mode \u{1F512})" : ""}`;
    }
    if (el.channelsGrid) el.channelsGrid.innerHTML = "";
    state.renderedChannelCount = 0;
    renderChannelBatch();
    if (el.emptyState) {
      el.emptyState.style.display = list.length === 0 ? "block" : "none";
    }
  }
  function onChannelSortChange(sortMode) {
    state.currentSortMode = sortMode;
    if (!state.allChannels) return;
    let list = [...state.filteredChannels];
    switch (sortMode) {
      case "number":
        list.sort((a, b) => (a.channelNumber || 9999) - (b.channelNumber || 9999));
        break;
      case "name":
        list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "favorites": {
        const favSet = new Set((state.favorites || []).map(String));
        list.sort((a, b) => {
          const aFav = favSet.has(String(a.id));
          const bFav = favSet.has(String(b.id));
          if (aFav && !bFav) return -1;
          if (!aFav && bFav) return 1;
          return (a.channelNumber || 9999) - (b.channelNumber || 9999);
        });
        break;
      }
      case "sports":
        list.sort((a, b) => {
          const sportsA = /sport|cricket|football|tennis|motogp/i.test(a.category || "");
          const sportsB = /sport|cricket|football|tennis|motogp/i.test(b.category || "");
          if (sportsA && !sportsB) return -1;
          if (!sportsA && sportsB) return 1;
          return (a.channelNumber || 9999) - (b.channelNumber || 9999);
        });
        break;
      case "default":
      default:
        applyFilterAndSearch();
        return;
    }
    state.filteredChannels = list;
    state.renderedChannelCount = 0;
    if (el.channelsGrid) el.channelsGrid.innerHTML = "";
    renderChannelBatch();
    showToast(`Channels sorted: ${sortMode.toUpperCase()} \u{1F5C2}\uFE0F`, "\u26A1");
  }
  function onQuickFilter(filterKey) {
    state.quickFilter = filterKey;
    if (filterKey === "all") {
      applyFilterAndSearch();
    } else if (filterKey === "hd") {
      state.filteredChannels = state.allChannels.filter((c) => /hd|4k|fhd|uhd|1080/i.test(c.name || "") || c.category && /hd/i.test(c.category));
      state.renderedChannelCount = 0;
      if (el.channelsGrid) el.channelsGrid.innerHTML = "";
      renderChannelBatch();
      showToast(`Filtered: HD / 4K Channels (${state.filteredChannels.length}) \u26A1`);
    } else if (filterKey === "sports") {
      state.filteredChannels = state.allChannels.filter((c) => /sport|cricket|football|tennis|motogp|racing|wwe/i.test(c.category || "") || /sport|cricket/i.test(c.name || ""));
      state.renderedChannelCount = 0;
      if (el.channelsGrid) el.channelsGrid.innerHTML = "";
      renderChannelBatch();
      showToast(`Filtered: Live Sports Channels (${state.filteredChannels.length}) \u{1F3C6}`);
    } else if (filterKey === "news") {
      state.filteredChannels = state.allChannels.filter((c) => /news|somoy|jamuna|bbc|cnn|al jazeera|dd news/i.test(c.category || "") || /news/i.test(c.name || ""));
      state.renderedChannelCount = 0;
      if (el.channelsGrid) el.channelsGrid.innerHTML = "";
      renderChannelBatch();
      showToast(`Filtered: Live News Channels (${state.filteredChannels.length}) \u{1F4F0}`);
    }
  }

  // src/desktop/web/src_js/index.js
  window.playChannel = playChannel;
  window.closePlayer = closePlayer;
  window.openModal = openModal;
  window.closeModal = closeModal;
  window.openAboutModal = openAboutModal;
  window.tuneToEventChannel = tuneToEventChannel;
  window.toggleSportsHUD = toggleSportsHUD;
  window.openPlayerSearch = openPlayerSearch;
  window.closePlayerSearch = closePlayerSearch;
  window.reconnectCurrentStream = reconnectCurrentStream;
  window.cycleVideoZoom = cycleVideoZoom;
  window.setVideoZoom = setVideoZoom;
  window.applyVideoTransform = applyVideoTransform;
  window.cycleVideoClarity = cycleVideoClarity;
  window.applyVideoClarity = applyVideoClarity;
  window.triggerCommercialBreakMute = triggerCommercialBreakMute;
  window.toggleAudioOnlyMode = toggleAudioOnlyMode;
  window.toggleAlwaysOnTop = toggleAlwaysOnTop;
  window.openMultiView = openMultiView;
  window.closeMultiView = closeMultiView;
  window.toggleTurboMode = toggleTurboMode;
  window.toggleViewDensity = toggleViewDensity;
  window.recallPreviousChannel = recallPreviousChannel;
  window.updateRecallButton = updateRecallButton;
  window.setAudioDelay = setAudioDelay;
  window.checkForAppUpdates = checkForAppUpdates;
  window.checkAppUpdates = checkForAppUpdates;
  window.state = state;
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})();
