/**
 * Live TV - Sports & Event Telemetry Model
 * Architecture: Model / EventModel
 */

import { state } from "./State.js";
import { STOP_WORDS_SPORTS, CHANNEL_SERVERS } from "./Constants.js";
import { formatToBST } from "../utils/TimeUtils.js";
import { showStreamNotice, escapeHtml } from "../utils/DomUtils.js";
import { playChannel } from "../controllers/PlayerController.js";
import { applyFilterAndSearch } from "./ChannelModel.js";
import { detectSportsHighlights, updateSportsScoreTicker, renderLiveEvents } from "../views/HUDView.js";
import { checkSportsReminders } from "../views/ModalView.js";

export function cleanSportTokens(name) {
  return (name || "").toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS_SPORTS.has(w));
}

export function matchSportTeams(fcTeam1, fcTeam2, espnTeam1, espnTeam2) {
  const t1 = cleanSportTokens(fcTeam1);
  const t2 = cleanSportTokens(fcTeam2);
  const e1 = cleanSportTokens(espnTeam1);
  const e2 = cleanSportTokens(espnTeam2);
  if (!t1.length || !t2.length || !e1.length || !e2.length) return false;

  const hasOverlap = (a, b) => a.some(x => b.includes(x));
  return (hasOverlap(t1, e1) && hasOverlap(t2, e2)) || (hasOverlap(t1, e2) && hasOverlap(t2, e1));
}

// Real-Time Live Sports Telemetry Engine (100% Real Live Information)
export async function fetchRealSportsEvents(isBackground = false) {
  if (isBackground && (state.isPlayerOpen || document.body.classList.contains("player-active"))) {
    return; // Conserve CPU, network and battery while video is actively playing
  }
  if (!isBackground) {
    state.isLiveEventsLoading = state.liveEvents.length === 0;
    renderLiveEvents(state.selectedLiveSport);
  }

  const results = await Promise.allSettled([
    fetch("https://raw.githubusercontent.com/drmlive/fancode-live-events/main/fancode.json").then(r => r.json()),
    fetch("https://site.api.espn.com/apis/site/v2/sports/cricket/scorepanel").then(r => r.json()),
    fetch("https://site.api.espn.com/apis/site/v2/sports/soccer/scorepanel").then(r => r.json()),
    fetch("https://site.api.espn.com/apis/site/v2/sports/tennis/scorepanel").then(r => r.json()),
    fetch("https://site.api.espn.com/apis/site/v2/sports/racing/f1/scoreboard").then(r => r.json())
  ]);

  const fcData = results[0].status === "fulfilled" ? results[0].value : {};
  const cricData = results[1].status === "fulfilled" ? results[1].value : {};
  const socData = results[2].status === "fulfilled" ? results[2].value : {};
  const tenData = results[3].status === "fulfilled" ? results[3].value : {};
  const f1Data = results[4].status === "fulfilled" ? results[4].value : {};
  const now = new Date();

  // 1. Process ESPN Cricket Telemetry (Runs, overs, wickets, target, summary, multi-day session aware)
  const espnCricket = [];
  for (const g of (cricData.scores || [])) {
    for (const ev of (g.events || [])) {
      const comp = ev.competitions?.[0];
      const comps = comp?.competitors || [];
      const statusType = ev.status?.type || {};
      const descLower = (statusType.description || "").toLowerCase();
      const stateStr = (statusType.state || "").toLowerCase();
      const summary = ev.status?.summary || statusType.detail || "";
      const sumLower = summary.toLowerCase();

      const startDate = ev.date ? new Date(ev.date) : now;
      const endDate = ev.endDate ? new Date(ev.endDate) : startDate;

      // Intelligent multi-day test match detection
      const classType = comp?.class?.eventType || "";
      const generalCard = comp?.class?.generalClassCard || "";
      const descStr = ev.description || "";
      const rangeMatch = descStr.match(/\b([A-Za-z]+)\s+(\d+)-(\d+)\s+(\d{4})\b/i);
      let totalDays = 1;
      if (rangeMatch) {
        totalDays = Math.max(1, parseInt(rangeMatch[3], 10) - parseInt(rangeMatch[2], 10) + 1);
      } else if ((endDate.getTime() - startDate.getTime()) >= 24 * 3600 * 1000) {
        totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (24 * 3600 * 1000)));
      }
      const isMultiDay = totalDays > 1 || classType === "Test" || generalCard.toLowerCase().includes("first-class");

      const msPerDay = 24 * 3600 * 1000;
      const diffDays = Math.floor((now.getTime() - startDate.getTime()) / msPerDay);
      const currentDayNum = Math.min(totalDays, Math.max(1, diffDays + 1));

      // Calculate elapsed hours since scheduled daily session start
      const todayDailyStart = new Date(now);
      todayDailyStart.setUTCHours(startDate.getUTCHours(), startDate.getUTCMinutes(), 0, 0);
      const hoursSinceDailyStart = (now.getTime() - todayDailyStart.getTime()) / (3600 * 1000);
      const isPastDailyPlayHours = hoursSinceDailyStart > 7.5; // Cricket daily session ends ~7.5h after start

      const isStumps = descLower.includes("stumps") ||
                       descLower.includes("close of play") ||
                       descLower.includes("end of day") ||
                       sumLower.includes("stumps");

      const isExplicitFinal = statusType.completed ||
                              stateStr === "post" ||
                              descLower.includes("result") ||
                              descLower.includes("final") ||
                              descLower.includes("ended") ||
                              descLower.includes("abandoned") ||
                              sumLower.includes("won by") ||
                              sumLower.includes("match drawn") ||
                              sumLower.includes("won the match") ||
                              sumLower.includes("won the series") ||
                              sumLower.includes("won by an innings");

      let isFinal = isExplicitFinal;
      if (!isFinal && isMultiDay) {
        if (diffDays + 1 > totalDays) {
          isFinal = true; // Match was scheduled for past dates
        } else if (diffDays + 1 === totalDays && isPastDailyPlayHours) {
          isFinal = true; // Today was the last day and play ended hours ago
        }
      } else if (!isFinal && !isMultiDay) {
        if (hoursSinceDailyStart > 14) {
          isFinal = true; // Stale single-day match
        }
      }

      // Live match calculation: strictly in-progress, not stumps and not past daily playing hours
      let isLive = false;
      if (!isFinal && !isStumps) {
        if (isMultiDay) {
          isLive = (stateStr === "in" || descLower.includes("live") || descLower.includes("drinks") || descLower.includes("tea") || descLower.includes("lunch")) &&
                   (hoursSinceDailyStart >= -0.5 && hoursSinceDailyStart <= 8.0);
        } else {
          isLive = (stateStr === "in" || descLower.includes("live")) &&
                   (hoursSinceDailyStart >= -0.5 && hoursSinceDailyStart <= 9.0);
        }
      }

      let scoreParts = [];
      for (const c of comps) {
        const teamName = c.team?.shortDisplayName || c.team?.abbreviation || c.team?.name || "";
        if (c.score) scoreParts.push(`${teamName}: ${c.score}`);
      }
      const scoreStr = scoreParts.length > 0 ? scoreParts.join(" • ") : "";

      // Time display: multi-day session aware, never shows old start date for live matches
      let displayTime = "";
      const sessionStr = (ev.status?.session || "").trim();
      if (isMultiDay) {
        if (isFinal) {
          displayTime = `Completed (Day ${totalDays})`;
        } else if (isStumps) {
          displayTime = `Day ${currentDayNum} Stumps • Resumes Tomorrow`;
        } else if (isLive) {
          displayTime = sessionStr ? `Today • ${sessionStr}` : `Today • Day ${currentDayNum} of ${totalDays}`;
        } else {
          if (diffDays < 0) {
            displayTime = formatToBST(ev.date);
          } else if (hoursSinceDailyStart < 0) {
            const formattedDailyStart = formatToBST(todayDailyStart);
            displayTime = `Day ${currentDayNum} • Starts ${formattedDailyStart}`;
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

  // 2. Process ESPN Soccer Telemetry (Goal score, live clock, extra time, BST time)
  const espnSoccer = [];
  for (const g of (socData.scores || [])) {
    for (const ev of (g.events || [])) {
      const comp = ev.competitions?.[0];
      const comps = comp?.competitors || [];
      const statusType = ev.status?.type || {};
      const stateStr = (statusType.state || "").toLowerCase();
      const isLive = stateStr === "in";
      const isFinal = statusType.completed || stateStr === "post";
      if (isFinal) continue;

      const evDate = new Date(ev.date);
      // Skip stale past matches (> 12 hours ago)
      if ((now.getTime() - evDate.getTime()) > 12 * 3600 * 1000) continue;

      let scoreStr = "";
      let homeTeam = "Home", awayTeam = "Away";
      if (comps.length >= 2) {
        const home = comps.find(c => c.homeAway === "home") || comps[0];
        const away = comps.find(c => c.homeAway === "away") || comps[1];
        homeTeam = home.team?.name || "";
        awayTeam = away.team?.name || "";
        scoreStr = `${home.team?.shortDisplayName || home.team?.name || "Home"} ${home.score ?? 0} - ${away.score ?? 0} ${away.team?.shortDisplayName || away.team?.name || "Away"}`;
        if (isLive && ev.status?.displayClock) scoreStr += ` • ${ev.status.displayClock}`;
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

  // 3. Process FanCode Matches and Merge with Live ESPN Telemetry
  for (const m of (fcData.matches || [])) {
    let sport = "Sports";
    let emoji = "🏆";
    const cat = (m.event_category || "").toLowerCase();
    const titleRaw = (m.title || "").toLowerCase();
    const eventNameRaw = (m.event_name || "").toLowerCase();

    if (cat.includes("cricket") || titleRaw.includes("cricket")) { sport = "Cricket"; emoji = "🏏"; }
    else if (cat.includes("football") || cat.includes("soccer") || titleRaw.includes("laliga") || titleRaw.includes("league")) { sport = "Football"; emoji = "⚽"; }
    else if (cat.includes("tennis") || titleRaw.includes("atp") || titleRaw.includes("wta") || cat.includes("badminton")) {
      sport = "Tennis";
      emoji = cat.includes("badminton") ? "🏸" : "🎾";
    } else if (cat.includes("moto") || cat.includes("racing") || cat.includes("formula") || cat.includes("f1") || titleRaw.includes("grand prix") || eventNameRaw.includes("sepang")) {
      sport = "MotoGP";
      emoji = "🏍️";
    }

    const isLive = (m.status || "").toUpperCase() === "LIVE";
    const streamUrl = m.dai_url || m.adfree_url;
    const bstTime = formatToBST(m.startTime);

    let cleanTitle = (m.match_name || m.title || m.event_name || "")
      .replace(/\s*\[(English|Hindi|Bangla)\]/gi, "").trim();
    let cleanSubtitle = (m.event_name || m.title || "")
      .replace(/\s*\[(English|Hindi|Bangla)\]/gi, "").trim();

    // Skip generic placeholder events with no participants
    if (cleanTitle.toLowerCase().includes("tbc vs tbc") || cleanTitle.toLowerCase().includes("tbd vs tbd")) {
      continue;
    }

    // Attempt intelligent fuzzy match with live telemetry
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
      scoreOrDetail = matchedEspn.scoreStr || (isLive ? "🔴 Live HD Stream Broadcast" : (bstTime ? `Starts: ${bstTime}` : "Scheduled Match"));
      summary = matchedEspn.summary || "";
    } else {
      scoreOrDetail = isLive ? "🔴 Live HD Stream Broadcast" : (bstTime ? `Starts: ${bstTime}` : "Upcoming Official Match");
    }

    let targetChan = "Live Sports HD";
    let targetId = "t_sports_hd";
    if (sport === "Cricket") { targetChan = "T Sports HD"; targetId = "t_sports_hd"; }
    else if (sport === "Football") { targetChan = "beIN Sports 1 HD"; targetId = "bein_sports_1"; }
    else if (sport === "Tennis") { targetChan = "Tennis Channel HD"; targetId = "tennis_channel_intl_hd"; }
    else if (sport === "MotoGP") { targetChan = "SPOTV 2 / ServusTV"; targetId = "spotv_2_hd_motogp"; }

    if (isLive && sport === "MotoGP" && streamUrl) {
      state.allChannels.forEach(ch => {
        if (ch.id === "fancode_motogp_live" || ch.id === "motogp_official_world_feed") {
          ch.name = ch.id === "motogp_official_world_feed" ? "MotoGP Live HD (MGP World Feed)" : `FanCode MotoGP • ${cleanTitle}`;
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
      statusText: isLive ? "LIVE" : (m.status || "UPCOMING"),
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

  // 4. Add remaining unmerged ESPN Cricket matches (strictly live or scheduled, never completed)
  for (const ec of espnCricket) {
    if (ec.merged || ec.isFinal) continue;
    let targetId = "t_sports_hd";
    let targetName = "T Sports HD";
    const titleLower = (ec.title || "").toLowerCase();
    if (titleLower.includes("india") || titleLower.includes("australia") || titleLower.includes("england")) {
      targetId = "willow_tv_hd"; targetName = "Willow TV HD";
    } else if (titleLower.includes("bangladesh")) {
      targetId = "t_sports_hd"; targetName = "T Sports HD";
    } else if (titleLower.includes("pakistan")) {
      targetId = "sky_sports_cricket_hd"; targetName = "Sky Sports Cricket HD";
    }

    const statusText = ec.isLive ? "LIVE" : (ec.isStumps ? "STUMPS" : "SCHEDULED");

    events.push({
      id: "espn_cric_" + ec.raw.id,
      title: ec.title,
      subtitle: ec.subtitle,
      sport: "Cricket",
      sportEmoji: "🏏",
      statusText,
      bstTime: ec.bstTime,
      scoreOrDetail: ec.scoreStr || (ec.isLive ? "🔴 Live Match" : (ec.isStumps ? "⏸️ Stumps (Day Ended)" : (ec.bstTime ? `Starts: ${ec.bstTime}` : "Scheduled Match"))),
      summary: ec.summary,
      targetChannelName: targetName,
      targetChannelId: targetId,
      isLive: ec.isLive,
      priority: ec.isLive ? 2 : (ec.isStumps ? 18 : 20)
    });
  }

  // 5. Add remaining unmerged ESPN Football (Soccer) matches (strictly live or scheduled, never completed)
  for (const es of espnSoccer) {
    if (es.merged || es.isFinal) continue;
    events.push({
      id: "espn_soc_" + es.raw.id,
      title: es.title,
      subtitle: es.subtitle,
      sport: "Football",
      sportEmoji: "⚽",
      statusText: es.isLive ? "LIVE" : "SCHEDULED",
      bstTime: es.bstTime,
      scoreOrDetail: es.scoreStr || (es.isLive ? "⚽ Live Football" : (es.bstTime ? `Starts: ${es.bstTime}` : "Scheduled Match")),
      summary: es.summary,
      targetChannelName: "beIN Sports 1 HD",
      targetChannelId: "bein_sports_1",
      isLive: es.isLive,
      priority: es.isLive ? 2 : 20
    });
  }

  // 6. Add ESPN Tennis matches (strictly live or scheduled, never completed)
  for (const g of (tenData.scores || [])) {
    for (const ev of (g.events || [])) {
      const statusType = ev.status?.type || {};
      const stateStr = (statusType.state || "").toLowerCase();
      const isLive = stateStr === "in";
      const isFinal = statusType.completed || stateStr === "post";
      if (isFinal) continue;

      const evDate = new Date(ev.date);
      if ((now.getTime() - evDate.getTime()) > 12 * 3600 * 1000) continue;

      const detail = statusType.detail || statusType.description || "ATP / WTA World Tour";
      const bstTime = formatToBST(ev.date);

      const isParis = (ev.name || "").toLowerCase().includes("paris") || (g.league?.name || "").toLowerCase().includes("paris") || (g.league?.name || "").toLowerCase().includes("atp");
      const targetChannelId = isParis ? "atp_paris_masters_live_hd" : "tennis_channel_intl_hd";
      const targetChannelName = isParis ? "ATP Paris Masters Live HD (Setanta)" : "Tennis Channel HD";

      events.push({
        id: "espn_ten_" + ev.id,
        title: ev.name,
        subtitle: g.league?.name || "Professional Tennis",
        sport: "Tennis",
        sportEmoji: "🎾",
        statusText: isLive ? "LIVE" : "SCHEDULED",
        bstTime,
        scoreOrDetail: detail,
        summary: "",
        targetChannelName,
        targetChannelId,
        isLive,
        priority: isLive ? 3 : 22
      });
    }
  }

  // 7. Add ESPN Racing / Formula 1 (strictly live or scheduled, never completed)
  for (const ev of (f1Data.events || [])) {
    const statusType = ev.status?.type || {};
    const stateStr = (statusType.state || "").toLowerCase();
    const isLive = stateStr === "in";
    const isFinal = statusType.completed || stateStr === "post";
    if (isFinal) continue;

    const evDate = new Date(ev.date);
    if ((now.getTime() - evDate.getTime()) > 24 * 3600 * 1000) continue;

    const detail = statusType.detail || statusType.description || "FIA Formula 1 World Championship";
    const bstTime = formatToBST(ev.date);

    events.push({
      id: "espn_f1_" + ev.id,
      title: ev.name,
      subtitle: "Formula 1 Grand Prix",
      sport: "MotoGP",
      sportEmoji: "🏎️",
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

  // Deduplicate events by sanitized title
  const seenTitles = new Set();
  const uniqueEvents = [];
  for (const ev of events) {
    const key = (ev.title || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!key || seenTitles.has(key)) continue;
    seenTitles.add(key);
    uniqueEvents.push(ev);
  }

  // Sort: LIVE with stream first, then LIVE with score, then upcoming by priority
  uniqueEvents.sort((a, b) => {
    if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
    if (a.isLive && b.isLive) {
      if (!!a.streamUrl !== !!b.streamUrl) return a.streamUrl ? -1 : 1;
    }
    return (a.priority || 50) - (b.priority || 50);
  });

  state.liveEvents = uniqueEvents;
  state.liveEventsTargetMap = new Map();
  uniqueEvents.forEach(ev => {
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

// Verified 24/7 Live Broadcast Streams for Major Sports Disciplines
export function getVerifiedSportsServers(sport, targetChannelId) {
  const sportLower = (sport || "").toLowerCase();
  let backupServers = [];

  if (sportLower.includes("tennis") || sportLower.includes("badminton") || sportLower.includes("paris")) {
    backupServers = [
      { label: "Server 1 (Rolex Paris Masters • Setanta Live)", url: "https://a116.azplay55.me/hls/streama270965/index.m3u8?cst=ef934564a1c5f38e25bf13cd9ea7a7b6" },
      { label: "Server 2 (Paris Masters Court 2)", url: "https://a116.azplay55.me/hls/streama271413/index.m3u8?cst=a1f9cd95beb9d4331a98dece81c6f6e8" },
      { label: "Server 3 (Setanta Sports 2 Eurasia 1080p)", url: "http://stream.mcquack.net/235/index.m3u8" },
      { label: "Server 4 (Tennis Channel HD)", url: "https://cdn-uw2-prod.tsv2.amagi.tv/linear/amg01444-tennischannelth-tennischnlintl-lggb/playlist.m3u8" }
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
      { label: "Server 1 (TNT Sports 2 HD • MotoGP)", url: "https://a122aivottlinear-a.akamaihd.net/OTTB/syd-nitro/live/clients/dash/enc/puehlftk5j/out/v1/f7f0da1ee112481ca0024e6d4dd97f4a/cenc.mpd|clearkey=f3df7843080ae743bf865dc5fdf64c68:567c863bc12eb74788ea74888c042e1b" },
      { label: "Server 2 (Eurosport Motorsport 4K)", url: "http://88.212.15.50/live/esp_4k_atk/playlist.m3u8" },
      { label: "Server 3 (beIN Sports Racing HD)", url: "https://bein-esp-xumo.amagi.tv/playlistR1080p.m3u8" }
    ];
  }

  // Include target catalog channel if valid and not already in list
  if (targetChannelId && state.allChannels) {
    const ch = state.allChannels.find(c => c.id === targetChannelId);
    if (ch && ch.streamUrl && !backupServers.some(s => s.url === ch.streamUrl)) {
      backupServers.push({ label: `Server (${ch.name})`, url: ch.streamUrl });
    }
  }

  return backupServers;
}

// One-tap redirection from Live Event to direct stream or corresponding TV Channel
export function tuneToEventChannel(evt) {
  if (!evt) return;

  const sportBackups = getVerifiedSportsServers(evt.sport, evt.targetChannelId);

  // 1. Direct match broadcast stream (e.g. from FanCode or live event stream)
  if (evt.streamUrl) {
    const directId = evt.id || `live_event_${Date.now()}`;
    const directChannel = {
      id: directId,
      name: `${evt.sportEmoji || '🏆'} ${evt.title}`.trim(),
      category: evt.sport || "Sports",
      country: "Live Sports",
      streamUrl: evt.streamUrl,
      headers: evt.userAgent ? { "User-Agent": evt.userAgent } : {}
    };

    // Configure multi-server failover: Server 1 is the direct feed; Servers 2+ are verified live feeds for that sport
    const servers = [{ label: "Server 1 (Direct Feed)", url: evt.streamUrl }];
    sportBackups.forEach((b) => {
      if (b.url !== evt.streamUrl) {
        servers.push({ label: `Server ${servers.length + 1} (${b.label.replace(/^Server \d+ \((.*)\)$/, '$1')})`, url: b.url });
      }
    });
    CHANNEL_SERVERS[directId] = servers;

    playChannel(directChannel);
    return;
  }

  // 2. Direct match by targetChannelId in catalog
  let target = state.allChannels.find(c => c.id === evt.targetChannelId);

  // 3. Fallback by channel name
  if (!target && evt.targetChannelName) {
    const targetLower = evt.targetChannelName.toLowerCase();
    target = state.allChannels.find(c => c.name && c.name.toLowerCase().includes(targetLower));
  }

  // 4. Fallback by sport category / keywords
  if (!target && evt.sport) {
    const sportLower = evt.sport.toLowerCase();
    target = state.allChannels.find(c =>
      (c.category && c.category.toLowerCase().includes(sportLower)) ||
      (c.name && c.name.toLowerCase().includes(sportLower))
    );
  }

  // 5. If target channel found, ensure it has verified sport servers for instant failover
  if (target) {
    if (!CHANNEL_SERVERS[target.id] && sportBackups.length > 0) {
      const servers = [{ label: `Server 1 (${target.name})`, url: target.streamUrl }];
      sportBackups.forEach(b => {
        if (b.url !== target.streamUrl) {
          servers.push({ label: `Server ${servers.length + 1} (${b.label.replace(/^Server \d+ \((.*)\)$/, '$1')})`, url: b.url });
        }
      });
      CHANNEL_SERVERS[target.id] = servers;
    }
    playChannel(target);
  } else if (sportBackups.length > 0) {
    // 6. If no catalog channel matched, immediately create and play dynamic sport channel
    const backupChannel = {
      id: `sport_fallback_${Date.now()}`,
      name: `${evt.sportEmoji || '🏆'} ${evt.title} (${evt.sport})`,
      category: evt.sport || "Sports",
      country: "Live Sports",
      streamUrl: sportBackups[0].url
    };
    CHANNEL_SERVERS[backupChannel.id] = sportBackups;
    playChannel(backupChannel);
  } else {
    showStreamNotice(`Channel ${evt.targetChannelName || 'for event'} not found in catalog`);
  }
}

// Global hook for event card button clicks
window.tuneFromSportsEvent = function(eventId) {
  const evt = (state.liveEvents || []).find(e => e.id === eventId);
  if (evt) {
    tuneToEventChannel(evt);
  }
};

// Dynamic FanCode MotoGP Events Fetcher (Matches Android LiveTvViewModel)
export async function refreshDynamicMotoGpEvents() {
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
        const channelTitle = matchName ? `FanCode MotoGP • ${matchName}` : `FanCode MotoGP • ${m.title || 'Live'}`;

        state.allChannels.forEach(ch => {
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
    // Fallback to static bundled stream silently
  }
}
