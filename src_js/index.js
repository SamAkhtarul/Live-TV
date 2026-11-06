/**
 * Live TV - Master Bootstrap Entry Point
 * Architecture: MVC (Model - View - Controller) Entry Point
 */

import { state, isMobileDevice } from "./models/State.js";
import { APP_VERSION, APP_BUILD, CHANNEL_SERVERS } from "./models/Constants.js";
import {
  loadStoredPreferences,
  persistAllPreferences,
  loadChannels,
  saveCustomChannel,
  sanitizeFavorites,
  buildCategories,
  selectCategory,
  applyFilterAndSearch,
  onChannelSortChange,
  onQuickFilter,
  getChannelEPG
} from "./models/ChannelModel.js";
import {
  fetchRealSportsEvents,
  tuneToEventChannel,
  getVerifiedSportsServers,
  refreshDynamicMotoGpEvents
} from "./models/EventModel.js";

import { el, initElements } from "./views/Elements.js";
import {
  renderCategoriesBar,
  renderChannelBatch,
  createChannelCard,
  updateActiveCardHighlight,
  renderRecentlyWatched,
  renderQuickSwitchCarousel
} from "./views/ChannelView.js";
import {
  updatePlayPauseIcons,
  updatePlayerFavButton,
  seekDvrOffset,
  goLive,
  updateDvrDisplay,
  renderQualityOptions,
  setStreamQuality,
  triggerSeekRipple,
  applyBrightness,
  showBrightnessHud,
  showVolumeHud,
  cycleAspectRatio,
  notifyControlsInteraction,
  releaseControlsInteraction,
  showControls,
  hideControls,
  toggleControls,
  lockScreen,
  unlockScreen,
  showLockOverlay,
  hideLockOverlay,
  toggleLockOverlay,
  expandPlayer,
  updatePlayerEpg,
  updateAudioAndSubtitleTracks,
  updateMediaSessionMetadata,
  triggerInstantSlowmoReplay,
  resumeFromSlowmoReplay,
  initCinemaAmbientDimmer
} from "./views/PlayerView.js";
import {
  initHeroSpotlight,
  playHeroChannel,
  toggleHeroFavorite
} from "./views/HeroView.js";
import {
  initSportsHUD,
  toggleSportsHUD,
  minimizeSportsHUD,
  renderSportsHUD,
  unpinMatchFromHUD,
  openMatchCenter,
  toggleSportsTicker,
  updateSportsScoreTicker,
  detectSportsHighlights,
  showSportsFlashToast,
  renderLiveEvents,
  openPlayerSearch,
  closePlayerSearch,
  renderPlayerSearchResults,
  updateHudSearchHighlight
} from "./views/HUDView.js";
import {
  openModal,
  closeModal,
  openAboutModal,
  closeAboutModal,
  openRankFavoritesModal,
  saveRankFavorites,
  openRearrangeCategoriesModal,
  saveCategoryOrder,
  resetCategoryOrder,
  openRemoteControlModal,
  openScheduledDvrModal,
  renderActiveSchedules,
  scheduleDVRRecording,
  loadScheduledRecordings,
  saveScheduledRecordings,
  openParentalPinModal,
  updatePinDots,
  verifyPinAndToggle,
  updateKidsModeHeaderUI,
  renderTeamAlertChips,
  addCustomTeam,
  checkTeamAlerts,
  toggleMiniGuide,
  openMiniGuide,
  closeMiniGuide,
  renderMiniGuide,
  initPeekHoverPreview,
  stopPeekPreview,
  openDualAudioModal,
  applyDualAudioPreset,
  openEPGGuideModal,
  renderEPGTimeline,
  promptImportXmltv,
  openCastPicker,
  triggerAirPlay,
  triggerChromecast,
  copyDLNAStreamUrl,
  openChannelManagerModal,
  renderCustomBouquets,
  handleCreateBouquet,
  openTVAlarmModal,
  saveTVAlarm,
  cancelTVAlarm,
  checkTVAlarm,
  open10BandEqModal,
  render10BandSliders,
  openOwnerAnalyticsModal,
  closeOwnerAnalyticsModal,
  playReminderChime,
  showInteractiveMatchAlert,
  checkSportsReminders
} from "./views/ModalView.js";
import {
  initBandwidthMeter,
  initNetworkTelemetry,
  updateStatsHud
} from "./views/TelemetryView.js";

import {
  playChannel,
  closePlayer,
  loadMediaStream,
  loadHlsStream,
  updateServerButton,
  toggleServer,
  parseStreamEndpoint,
  startContinuousHealthWatchdog,
  playNextChannel,
  playPrevChannel,
  reconnectCurrentStream,
  cycleVideoZoom,
  setVideoZoom,
  applyVideoTransform,
  initVideoZoomGestures,
  cycleVideoClarity,
  applyVideoClarity
} from "./controllers/PlayerController.js";
import {
  toggleFavorite,
  addToRecentlyWatched,
  loadRecentlyWatched,
  clearRecentlyWatched,
  handleNumericKey,
  tuneToDialedChannel,
  handleKeypadDigit,
  executeKeypadTune,
  parseCustomM3u,
  toggleLowLatencyMode,
  toggleDataSaverMode,
  submitXtreamLogin,
  toggleTurboMode,
  toggleViewDensity
} from "./controllers/ChannelController.js";
import {
  initAudioBooster,
  applyAudioProfile,
  cycleNextAudioProfile,
  applyVolume,
  init10BandEqualizer,
  setAudioDelay,
  toggleAudioOnlyMode,
  startAudioHudVisualizer,
  stopAudioHudVisualizer,
  triggerCommercialBreakMute,
  updateBreakCountdownLabel,
  resumeFromBreakMute,
  toggleAudioNormalizer
} from "./controllers/AudioController.js";
import {
  getPreviousChannelCandidate,
  recallPreviousChannel,
  updateRecallButton,
  setupKeyboardShortcuts,
  toggleVoiceAssistant,
  handleVoiceCommand
} from "./controllers/NavigationController.js";
import {
  initAIUpscaler,
  startAIUpscaler,
  renderAIUpscalerFrame,
  stopAIUpscaler,
  cycleAIUpscaler,
  updateAIUpscalerUI,
  toggleAISplitCompare,
  initSplitCompareDrag
} from "./controllers/AIUpscalerController.js";
import {
  compareVersions,
  checkForAppUpdates
} from "./controllers/UpdateController.js";
import {
  initApp,
  setupEventListeners,
  syncRemoteStatus,
  syncRemoteChannels,
  isOwnerUser,
  updateOwnerBadgeIfAuthorized,
  initVisitorTracking,
  toggleAlwaysOnTop,
  toggleRecording,
  startRecording,
  stopRecording,
  saveRecordingBlob,
  openMultiView,
  setMultiViewMode,
  setupSlotStream,
  destroySlotStream,
  setMultiViewAudioFocus,
  closeMultiView,
  initAmbilight,
  toggleAmbilight,
  renderAmbilightFrame,
  captureLiveClip,
  toggleLiveCaptions,
  setSleepTimer,
  cancelSleepTimer,
  initBroadcastSuiteExtensions
} from "./controllers/AppController.js";

// Global Window Bindings for HTML onclick and Native Mobile/macOS Wrappers
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

// Automatic DOM Lifecycle Startup
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
