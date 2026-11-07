/**
 * Live TV - Sports Telemetry Microservice
 * Architecture: Service / SportsTelemetryService
 * Responsibility: Real-time live sports scoring, multi-sport API ingestion,
 *                 event-to-channel mapping, and match ticker telemetry.
 */

import { STOP_WORDS_SPORTS } from "../models/Constants.js";

export class SportsTelemetryService {
  static pollingTimer = null;

  static cleanSportTokens(name) {
    return (name || "").toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOP_WORDS_SPORTS.has(w));
  }

  static matchSportTeams(fcTeam1, fcTeam2, espnTeam1, espnTeam2) {
    const t1 = this.cleanSportTokens(fcTeam1);
    const t2 = this.cleanSportTokens(fcTeam2);
    const e1 = this.cleanSportTokens(espnTeam1);
    const e2 = this.cleanSportTokens(espnTeam2);
    if (!t1.length || !t2.length || !e1.length || !e2.length) return false;

    const hasOverlap = (a, b) => a.some(x => b.includes(x));
    return (hasOverlap(t1, e1) && hasOverlap(t2, e2)) || (hasOverlap(t1, e2) && hasOverlap(t2, e1));
  }

  /**
   * Fetches latest live scores across global sports feeds concurrently
   */
  static async fetchTelemetry() {
    const results = await Promise.allSettled([
      fetch("https://raw.githubusercontent.com/drmlive/fancode-live-events/main/fancode.json").then(r => r.json()),
      fetch("https://site.api.espn.com/apis/site/v2/sports/cricket/scorepanel").then(r => r.json()),
      fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/scorepanel").then(r => r.json()),
      fetch("https://site.api.espn.com/apis/site/v2/sports/tennis/scorepanel").then(r => r.json()),
      fetch("https://site.api.espn.com/apis/site/v2/sports/racing/f1/scoreboard").then(r => r.json())
    ]);

    return {
      fancode: results[0].status === "fulfilled" ? results[0].value : null,
      cricket: results[1].status === "fulfilled" ? results[1].value : null,
      soccer: results[2].status === "fulfilled" ? results[2].value : null,
      tennis: results[3].status === "fulfilled" ? results[3].value : null,
      racing: results[4].status === "fulfilled" ? results[4].value : null
    };
  }

  /**
   * Starts periodic polling for live sports events
   */
  static startPolling(callback, intervalMs = 60000) {
    this.stopPolling();
    this.pollingTimer = setInterval(callback, intervalMs);
  }

  /**
   * Stops periodic polling
   */
  static stopPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
  }
}
