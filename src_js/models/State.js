/**
 * Live TV - Global Reactive Application State
 * Architecture: Model / State
 */

export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export const state = {
  allChannels: [],
  filteredChannels: [],
  categories: [],
  selectedCategory: "All",
  searchQuery: "",
  favorites: [], // Array of channel IDs ordered by user ranking (#1, #2, ...)
  categoryOrder: [], // Custom ordering of category names
  currentChannel: null,
  currentChannelIndex: -1,
  previousChannel: null,
  hls: null,
  shakaPlayer: null,
  video: null,
  isPlaying: false,
  isLive: true,
  dvrOffsetSeconds: 0, // 0 = LIVE, negative = seconds behind
  qualityLevels: [],
  currentQualityIndex: -1, // -1 = Auto
  selectedQualityHeight: -1, // -1 = Auto, or 144 to 2160
  playbackSpeed: 1.0,
  sleepTimerTimeout: null,
  sleepMinutes: 0,
  isLocked: false,
  lockTimeout: null,
  noticeTimeout: null,
  aspectRatios: ['fit', '16-9', 'fill', '4-3'],
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
  videoZoom: 1.0,
  videoPanX: 0,
  videoPanY: 0,
  isPanning: false,
  streamRetryCount: 0,
  eventReminders: new Set(),
  activeSortMode: "default",
  isDataSaver: false
};
