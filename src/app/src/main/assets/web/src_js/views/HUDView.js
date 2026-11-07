/**
 * Live TV - Floating HUDs, Ticker & Sports Overlays
 * Architecture: View / HUDView
 */

import { state } from "../models/State.js";
import { el } from "./Elements.js";
import { escapeHtml, showToast } from "../utils/DomUtils.js";
import { playChannel } from "../controllers/PlayerController.js";
import { openModal, closeModal, checkTeamAlerts } from "./ModalView.js";

export let isSportsHudOpen = false;
export let isSportsHudMinimized = false;
export let activeHudSport = "all";
export let pinnedMatchId = null;

export const liveSportsData = [
  {
    id: "match-cricket-1",
    sport: "cricket",
    title: "Western Australia vs South Australia",
    series: "Sheffield Shield 2026/27",
    score: "SOA: 154 & 295/7 (92.1 ov) • WA: 406/5d",
    status: "South Australia lead by 43 runs • Day 4",
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
    score: "IND: 284/6 (50.0 ov) • ENG: 198/4 (34.2 ov)",
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
    series: "La Liga Santander • El Clásico",
    score: "RMA 2 - 1 BAR (78')",
    status: "78' • Vinicius Jr (24', 62') | Yamal (41')",
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
    series: "English Premier League • Emirates Stadium",
    score: "ARS 1 - 0 CHE (54')",
    status: "54' • Saka (33' pen) • High intensity London derby",
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
    score: "ALC 6-4, 4-6, 5-4 • Sinner serving (30-40)",
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
    series: "Sepang International Circuit • Race 1",
    score: "Lap 16 / 20 • Bagnaia Leading (+0.421s)",
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

export function initSportsHUD() {
  if (!el.hudDragHeader || !el.sportsFloatingHud) return;

  // Draggable HUD window
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

  document.addEventListener("mouseup", () => { isDragging = false; });

  // Tab switching
  const tabs = document.querySelectorAll(".hud-tab-pill");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      activeHudSport = tab.dataset.sport || "all";
      renderSportsHUD();
    });
  });
}

export function toggleSportsHUD(force) {
  isSportsHudOpen = (force !== undefined) ? force : !isSportsHudOpen;
  if (el.sportsFloatingHud) {
    el.sportsFloatingHud.style.display = isSportsHudOpen ? "flex" : "none";
    if (isSportsHudOpen) {
      initSportsHUD();
      renderSportsHUD();
    }
  }
}

export function minimizeSportsHUD() {
  isSportsHudMinimized = !isSportsHudMinimized;
  if (el.sportsFloatingHud) {
    el.sportsFloatingHud.classList.toggle("minimized", isSportsHudMinimized);
  }
}

export function renderSportsHUD() {
  if (!el.hudMatchesList) return;
  const filtered = activeHudSport === "all"
    ? liveSportsData
    : liveSportsData.filter(m => m.sport === activeHudSport);

  el.hudMatchesList.innerHTML = filtered.map(m => {
    const isPinned = (pinnedMatchId === m.id);
    return `
      <div class="hud-match-card" id="hud-card-${m.id}">
        <div class="hud-card-top">
          <div class="hud-sport-tag">
            <span>${m.sport === 'cricket' ? '🏏' : m.sport === 'football' ? '⚽' : m.sport === 'tennis' ? '🎾' : '🏎️'}</span>
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
            <span>⚡ Commentary</span>
          </button>
          <button class="hud-action-btn" onclick="window.pinMatchFromHUD('${m.id}')" title="${isPinned ? 'Unpin' : 'Pin to floating pill'}">
            <span>${isPinned ? '📌 Pinned' : '📌 Pin'}</span>
          </button>
          <button class="hud-action-btn tune-btn" onclick="window.tuneMatchLive('${m.channelId}')" title="Tune Channel Now">
            <span>Watch Live ▶</span>
          </button>
        </div>

        <!-- Live Commentary Feed Drawer -->
        <div class="hud-feed-drawer" id="hud-feed-${m.id}">
          ${m.feed.map(f => `
            <div class="hud-feed-item">
              <span class="hud-feed-badge ${f.badge}">${f.badge.toUpperCase()}:</span> ${f.text}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
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
  const match = liveSportsData.find(m => m.id === id);
  if (match && el.hudPinnedPill) {
    if (el.pinnedPillText) el.pinnedPillText.textContent = match.title.split(" vs ")[0] || match.title;
    if (el.pinnedPillScore) el.pinnedPillScore.textContent = match.score.split("•")[0];
    el.hudPinnedPill.style.display = "flex";
    showToast(`Pinned match to floating widget! 📌`, "🏆");
    renderSportsHUD();
  }
};

export function unpinMatchFromHUD() {
  pinnedMatchId = null;
  if (el.hudPinnedPill) el.hudPinnedPill.style.display = "none";
  showToast("Match unpinned", "📌");
  renderSportsHUD();
}

window.tuneMatchLive = function(chId) {
  const ch = (state.allChannels || []).find(c => c.id === chId);
  if (ch) {
    playChannel(ch);
    showToast(`Tuning live broadcast: ${ch.name}`, "🔴");
  } else {
    showToast("Opening broadcast channel...", "📺");
  }
};

export function openMatchCenter(matchInfo) {
  if (!el.modalMatchCenter || !el.matchCenterBody) return;
  const info = matchInfo || {
    title: "Live Sports Scorecard & Match Center",
    score: "Live Telemetry Feed",
    summary: "Select any active match from the Sports Bar to view full scorecard",
    bowlers: "Live broadcast telemetry active",
    target: "Real-time scores update automatically during live play",
    channelId: "t_sports_hd",
    channelName: "T Sports HD"
  };
  el.matchCenterBody.innerHTML = `
    <div class="match-center-header">
      <div style="font-size: 11px; text-transform: uppercase; color: #fbbf24; font-weight: 800; letter-spacing: 1px;">
        🏏 LIVE ICC CRICKET TELEMETRY
      </div>
      <div style="font-size: 18px; font-weight: 800; color: #fff; margin: 4px 0;">${info.title}</div>
      <div class="match-score-big">${info.score}</div>
      <div style="font-size: 12px; color: #94a3b8;">${info.target}</div>
    </div>
    <div class="match-details-grid">
      <div class="match-detail-box">
        <div class="detail-box-title">🏏 Current Batsmen</div>
        <div style="color: #fff; font-size: 12.5px; line-height: 1.6;">${info.summary}</div>
      </div>
      <div class="match-detail-box">
        <div class="detail-box-title">🎯 Active Bowling Attack</div>
        <div style="color: #fff; font-size: 12.5px; line-height: 1.6;">${info.bowlers}</div>
      </div>
    </div>
    <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px;">
      <button class="player-pill" onclick="closeModal(el.modalMatchCenter)" style="background: rgba(255,255,255,0.08);">Close</button>
      <button class="player-pill" style="background: var(--accent-red); border-color: var(--accent-red); font-weight: 800;" onclick="closeModal(el.modalMatchCenter); window.playChannelById && window.playChannelById('${info.channelId}')">
        <span>▶ Watch Live in 4K HDR</span>
      </button>
    </div>
  `;
  openModal(el.modalMatchCenter);
}

window.playChannelById = function(chId) {
  const found = (state.allChannels || []).find(c => String(c.id) === String(chId));
  if (found) playChannel(found);
};

export function toggleSportsTicker(force) {
  const ticker = document.getElementById("sports-score-ticker");
  const btn = document.getElementById("btn-header-ticker");
  if (!ticker) return;

  const isHidden = ticker.style.display === "none" || !ticker.style.display;
  const willShow = (force !== undefined) ? !!force : isHidden;
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
  } catch (e) {}
}

export function updateSportsScoreTicker() {
  const container = document.getElementById("ticker-items-container");
  if (!container) return;

  const sports = (state.liveEvents || []).filter(e => e.isLive || (e.scoreOrDetail && e.scoreOrDetail.includes("•")));
  if (sports.length === 0) {
    container.innerHTML = `<span style="font-size:11.5px; color:var(--text-muted); padding:4px 12px;">Fetching real-time sports scores and fixtures...</span>`;
    return;
  }

  container.innerHTML = sports.map(ev => `
    <div class="ticker-card" onclick="window.tuneFromSportsEvent('${escapeHtml(ev.id)}')" title="Click to tune ${escapeHtml(ev.title)}">
      <span class="ticker-sport">${ev.sportEmoji || '🏆'}</span>
      <span class="ticker-title">${escapeHtml(ev.title)}</span>
      <span class="ticker-score ${ev.isLive ? 'live' : ''}">${escapeHtml(ev.scoreOrDetail || ev.statusText)}</span>
    </div>
  `).join("");
}

export function parseSoccerTotalGoals(str) {
  if (!str) return null;
  const m = str.match(/(\d+)\s*-\s*(\d+)/);
  if (m) {
    return parseInt(m[1], 10) + parseInt(m[2], 10);
  }
  return null;
}

export function parseCricketWickets(str, summary) {
  let totalWickets = 0;
  if (str) {
    const matches = str.matchAll(/\/(\d+)/g);
    for (const m of matches) {
      totalWickets += parseInt(m[1], 10);
    }
  }
  return totalWickets;
}

if (!state.previousScoresMap) state.previousScoresMap = new Map();
if (!state.lastAlertedMap) state.lastAlertedMap = new Map();

export function detectSportsHighlights(newEvents) {
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
        if (curGoals !== null && prevGoals !== null && curGoals > prevGoals && (now - lastAlerted > 30000)) {
          state.lastAlertedMap.set(ev.id, now);
          showSportsFlashToast(`⚽ GOAL! Score: ${ev.scoreOrDetail}`, ev);
        }
      } else if (ev.sport === "Cricket") {
        const curWickets = parseCricketWickets(ev.scoreOrDetail, ev.summary);
        const prevWickets = prevData.wickets;
        if (curWickets > 0 && prevWickets > 0 && curWickets > prevWickets && (now - lastAlerted > 30000)) {
          state.lastAlertedMap.set(ev.id, now);
          showSportsFlashToast(`🏏 WICKET! Score: ${ev.scoreOrDetail}`, ev);
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

export function showSportsFlashToast(msg, ev) {
  if (!ev || !ev.isLive || ev.isFinal || (ev.statusText && (ev.statusText.toUpperCase() === "FINAL" || ev.statusText.toUpperCase() === "SCHEDULED" || ev.statusText.toUpperCase() === "UPCOMING"))) {
    return;
  }
  const comb = `${ev.summary || ''} ${ev.scoreOrDetail || ''} ${ev.statusText || ''} ${ev.title || ''}`.toLowerCase();
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
      <span class="toast-sparkle">🚨</span>
      <div class="toast-text-box">
        <div class="toast-msg-title">${escapeHtml(msg)}</div>
        <div class="toast-msg-sub">${escapeHtml(ev.title)} • ${escapeHtml(ev.sport)}</div>
      </div>
      <button class="toast-watch-btn" onclick="window.tuneFromSportsEvent('${escapeHtml(ev.id)}'); window.dismissSportsFlashToast();">Watch Live ▶</button>
      <button class="toast-dismiss-btn" onclick="window.dismissSportsFlashToast()" title="Dismiss">✕</button>
    </div>
  `;

  toast.style.display = "flex";
  toast.classList.add("show");

  if (state.toastTimeout) clearTimeout(state.toastTimeout);
  state.toastTimeout = setTimeout(() => {
    window.dismissSportsFlashToast();
  }, 6000);
}

export function renderLiveEvents(selectedSport = "All") {
  state.selectedLiveSport = selectedSport;
  if (!el.liveEventsCarousel) return;
  el.liveEventsCarousel.innerHTML = "";

  const events = selectedSport === "All"
    ? state.liveEvents
    : (state.liveEvents || []).filter(e => e.sport === selectedSport);

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
        <span class="empty-icon">📡</span>
        <div class="empty-text">No active matches for ${escapeHtml(selectedSport)} right now.</div>
        <div class="empty-sub">Real-time live telemetry auto-refreshes every 60 seconds.</div>
      </div>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();
  events.forEach(evt => {
    const card = document.createElement("div");
    card.className = "live-event-card";
    card.onclick = () => window.tuneFromSportsEvent(evt.id);

    const isLive = evt.isLive || (evt.statusText && evt.statusText.toUpperCase().includes("LIVE"));
    const isFinal = evt.statusText && (evt.statusText.toUpperCase().includes("FINAL") || evt.statusText.toUpperCase().includes("RESULT"));
    const isStumps = evt.statusText && (evt.statusText.toUpperCase().includes("STUMPS") || evt.statusText.toUpperCase().includes("PAUSED"));

    let statusBadge = "";
    if (isLive) {
      statusBadge = `<span class="event-live-pill"><span class="event-live-dot"></span>LIVE</span>`;
    } else if (isFinal) {
      statusBadge = `<span class="event-final-pill">FINAL</span>`;
    } else if (isStumps) {
      statusBadge = `<span class="event-scheduled-pill" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border-color: rgba(245, 158, 11, 0.4);">⏸️ ${escapeHtml(evt.statusText || 'STUMPS')}</span>`;
    } else {
      statusBadge = `<span class="event-scheduled-pill">${escapeHtml(evt.statusText || 'UPCOMING')}</span>`;
    }

    const timeHtml = evt.bstTime
      ? `<div class="event-card-time"><span class="time-badge">🕒 ${escapeHtml(evt.bstTime)}</span></div>`
      : "";

    let scoreClass = "event-card-score";
    if (isFinal) scoreClass += " final";
    else if (!isLive) scoreClass += " upcoming";

    const scoreHtml = evt.scoreOrDetail
      ? `<div class="${scoreClass}" title="${escapeHtml(evt.scoreOrDetail)}">${escapeHtml(evt.scoreOrDetail)}</div>`
      : "";

    const summaryHtml = evt.summary
      ? `<div class="event-card-summary" title="${escapeHtml(evt.summary)}">📢 ${escapeHtml(evt.summary)}</div>`
      : "";

    const isReminded = state.eventReminders && state.eventReminders.has(evt.id);
    const remindBtnHtml = `<button class="event-remind-btn ${isReminded ? 'active' : ''}" onclick="event.stopPropagation(); window.toggleEventReminder('${escapeHtml(evt.id)}')" title="${isReminded ? 'Cancel match reminder' : 'Set match reminder'}"><span>${isReminded ? '🔔 Active' : '🔔 Remind'}</span></button>`;

    card.innerHTML = `
      <div class="event-card-top">
        <span class="event-sport-badge">${evt.sportEmoji || '🏆'} ${escapeHtml(evt.sport)}</span>
        ${statusBadge}
      </div>
      <div class="event-card-title" title="${escapeHtml(evt.title)}">${escapeHtml(evt.title)}</div>
      <div class="event-card-subtitle" title="${escapeHtml(evt.subtitle || '')}">${escapeHtml(evt.subtitle || '')}</div>
      ${timeHtml}
      ${scoreHtml}
      ${summaryHtml}
      <div class="event-card-bottom">
        <span class="event-channel-name" title="${escapeHtml(evt.targetChannelName || 'Live Broadcast')}">📺 ${escapeHtml(evt.targetChannelName || 'Live Broadcast')}</span>
        <div style="display: flex; gap: 6px; align-items: center;">
          ${remindBtnHtml}
          <button class="event-watch-btn" onclick="event.stopPropagation(); window.tuneFromSportsEvent('${escapeHtml(evt.id)}');">${evt.streamUrl ? '▶ Watch Live' : '▶ Watch'}</button>
        </div>
      </div>
    `;

    fragment.appendChild(card);
  });
  el.liveEventsCarousel.appendChild(fragment);
}

// In-Player Quick Channel Search HUD
export let hudSearchSelectedIdx = 0;
export let hudSearchResultsList = [];

export function openPlayerSearch() {
  const modal = el.modalPlayerSearch || document.getElementById("modal-player-search");
  const input = el.hudChannelSearchInput || document.getElementById("hud-channel-search-input");
  if (!modal || !input) return;
  modal.style.display = "flex";
  input.value = "";
  input.focus();
  renderPlayerSearchResults("");
}
window.openPlayerSearch = openPlayerSearch;

export function closePlayerSearch() {
  const modal = el.modalPlayerSearch || document.getElementById("modal-player-search");
  if (modal) modal.style.display = "none";
}
window.closePlayerSearch = closePlayerSearch;

export function renderPlayerSearchResults(query) {
  const container = el.hudChannelSearchResults || document.getElementById("hud-channel-search-results");
  if (!container) return;

  const q = (query || "").trim().toLowerCase();
  let matches = [];
  if (!q) {
    const favSet = new Set(state.favorites || []);
    matches = (state.allChannels || []).filter(c => favSet.has(c.id)).slice(0, 20);
    if (matches.length === 0) {
      matches = (state.allChannels || []).slice(0, 20);
    }
  } else {
    matches = (state.allChannels || []).filter(c => {
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
      <div class="hud-search-item ${isSelected ? 'selected' : ''} ${isCurrent ? 'current' : ''}" data-idx="${idx}" onclick="window.selectHudChannel(${idx})">
        <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;">
          <img src="${escapeHtml(ch.logoUrl || 'favicon.png')}" alt="" style="width: 28px; height: 28px; object-fit: contain; border-radius: 6px; background: rgba(0,0,0,0.3); flex-shrink: 0;" onerror="this.src='favicon.png'" />
          <div style="min-width: 0; flex: 1;">
            <div style="font-weight: 600; font-size: 13px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(ch.name)}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${escapeHtml(ch.category || 'General')} • ${escapeHtml(ch.country || '')}</div>
          </div>
        </div>
        ${isCurrent ? '<span style="font-size: 10px; font-weight: 700; color: #4ade80; background: rgba(74, 222, 128, 0.15); padding: 2px 6px; border-radius: 4px;">PLAYING</span>' : '<span style="font-size: 11px; color: var(--text-muted);">Enter ↵</span>'}
      </div>
    `;
  }).join("");
}

export function updateHudSearchHighlight() {
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
