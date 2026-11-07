/**
 * Live TV - Audio DSP Microservice
 * Architecture: Service / AudioDSPService
 * Responsibility: Web Audio graph construction, 10-band equalization,
 *                 delay synchronization, and FFT frequency analysis.
 */

export class AudioDSPService {
  /**
   * Initializes Web Audio Context and audio processing nodes
   */
  static createAudioGraph(videoEl) {
    if (!videoEl || typeof window === "undefined") return null;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    try {
      const ctx = new AudioContextClass();
      const source = ctx.createMediaElementSource(videoEl);

      const lowShelf = ctx.createBiquadFilter();
      lowShelf.type = "lowshelf";
      lowShelf.frequency.setValueAtTime(120, ctx.currentTime);
      lowShelf.gain.setValueAtTime(0, ctx.currentTime);

      const midPeak = ctx.createBiquadFilter();
      midPeak.type = "peaking";
      midPeak.frequency.setValueAtTime(2200, ctx.currentTime);
      midPeak.Q.setValueAtTime(1.0, ctx.currentTime);
      midPeak.gain.setValueAtTime(0, ctx.currentTime);

      const highShelf = ctx.createBiquadFilter();
      highShelf.type = "highshelf";
      highShelf.frequency.setValueAtTime(8000, ctx.currentTime);
      highShelf.gain.setValueAtTime(0, ctx.currentTime);

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-24, ctx.currentTime);
      compressor.knee.setValueAtTime(30, ctx.currentTime);
      compressor.ratio.setValueAtTime(12, ctx.currentTime);
      compressor.attack.setValueAtTime(0.003, ctx.currentTime);
      compressor.release.setValueAtTime(0.25, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(1.0, ctx.currentTime);

      const delay = ctx.createDelay(3.0);
      delay.delayTime.setValueAtTime(0, ctx.currentTime);

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;

      // Connect pipeline: source -> lowShelf -> midPeak -> highShelf -> compressor -> delay -> gain -> destination & analyser
      source.connect(lowShelf);
      lowShelf.connect(midPeak);
      midPeak.connect(highShelf);
      highShelf.connect(compressor);
      compressor.connect(delay);
      delay.connect(gain);
      gain.connect(ctx.destination);
      gain.connect(analyser);

      return {
        ctx,
        source,
        lowShelf,
        midPeak,
        highShelf,
        compressor,
        gain,
        delay,
        analyser
      };
    } catch (e) {
      console.warn("[AudioDSPService] Failed constructing audio graph:", e);
      return null;
    }
  }

  /**
   * Applies target gain to the gain node safely with ramping
   */
  static setVolumeBoost(gainNode, ctx, multiplier) {
    if (!gainNode || !ctx) return;
    try {
      gainNode.gain.cancelScheduledValues(ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(multiplier, ctx.currentTime + 0.05);
    } catch (e) {
      gainNode.gain.value = multiplier;
    }
  }

  /**
   * Adjusts audio delay (in milliseconds) for lip-sync correction
   */
  static setDelayMs(delayNode, ctx, delayMs) {
    if (!delayNode || !ctx) return;
    const sec = Math.max(0, delayMs / 1000);
    try {
      delayNode.delayTime.cancelScheduledValues(ctx.currentTime);
      delayNode.delayTime.linearRampToValueAtTime(sec, ctx.currentTime + 0.05);
    } catch (e) {
      delayNode.delayTime.value = sec;
    }
  }
}
