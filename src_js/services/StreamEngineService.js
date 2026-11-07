/**
 * Live TV - Stream Engine Microservice
 * Architecture: Service / StreamEngineService
 * Responsibility: Low-level playback engine instantiation, HLS/DASH configuration,
 *                 failover cycling, and playback health monitoring.
 */

export class StreamEngineService {
  static watchdogTimer = null;

  static isHlsSupported() {
    return typeof window !== "undefined" && typeof Hls !== "undefined" && Hls.isSupported();
  }

  static isAppleNativeHls(videoEl) {
    if (!videoEl || typeof navigator === "undefined") return false;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const canPlay = videoEl.canPlayType("application/vnd.apple.mpegurl");
    return isIOS && !!canPlay;
  }

  /**
   * Builds an optimized configuration object for HLS.js
   */
  static getHlsConfig(isMobile = false, isLowLatency = false) {
    return {
      enableWorker: true,
      lowLatencyMode: !!isLowLatency,
      backBufferLength: isMobile ? 30 : 180,
      maxBufferLength: isLowLatency ? 2 : (isMobile ? 30 : 60),
      maxMaxBufferLength: isMobile ? 60 : 180,
      maxBufferSize: isMobile ? 30 * 1024 * 1024 : 120 * 1024 * 1024,
      liveSyncDurationCount: isLowLatency ? 1 : 3,
      liveMaxLatencyDurationCount: isLowLatency ? 2 : 10,
      manifestLoadingTimeOut: 15000,
      manifestLoadingMaxRetry: 4,
      levelLoadingTimeOut: 15000,
      levelLoadingMaxRetry: 4,
      fragLoadingTimeOut: 20000,
      fragLoadingMaxRetry: 5
    };
  }

  /**
   * Instantiates and attaches a new Hls.js player
   */
  static createHlsPlayer(videoEl, options = {}) {
    if (!this.isHlsSupported()) return null;
    const config = this.getHlsConfig(options.isMobile, options.isLowLatency);
    const hls = new Hls(config);
    if (videoEl) {
      hls.attachMedia(videoEl);
    }
    return hls;
  }

  /**
   * Safely disposes of an active HLS instance
   */
  static destroyHlsPlayer(hlsInstance) {
    if (hlsInstance) {
      try {
        hlsInstance.stopLoad();
        hlsInstance.detachMedia();
        hlsInstance.destroy();
      } catch (e) {
        console.warn("[StreamEngineService] Error destroying HLS instance:", e);
      }
    }
  }

  /**
   * Selects the next alternate server when playback fails
   */
  static getNextServer(availableServers, currentIndex) {
    if (!availableServers || availableServers.length <= 1) return null;
    const nextIndex = (currentIndex + 1) % availableServers.length;
    return {
      index: nextIndex,
      server: availableServers[nextIndex]
    };
  }

  /**
   * Starts a stream watchdog timer that detects freeze/stall conditions
   */
  static startWatchdog(callback, intervalMs = 4000) {
    this.stopWatchdog();
    this.watchdogTimer = setInterval(callback, intervalMs);
  }

  /**
   * Stops the stream watchdog timer
   */
  static stopWatchdog() {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }
  }
}
