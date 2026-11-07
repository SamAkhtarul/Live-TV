package com.example.livetv.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone

object RealSportsFetcher {

    private val STOP_WORDS = setOf("vs", "v", "women", "men", "fc", "club", "the", "and", "team", "sixes", "cup", "league")

    fun formatToBst(dateInput: String?): String? {
        if (dateInput.isNullOrBlank()) return null
        return try {
            val trimmed = dateInput.trim()
            val dhakaTz = TimeZone.getTimeZone("Asia/Dhaka")
            val date: Date? = if (trimmed.matches(Regex("""\d{1,2}:\d{2}(?::\d{2})?\s*(AM|PM)\s*\d{1,2}-\d{1,2}-\d{4}""", RegexOption.IGNORE_CASE))) {
                // FanCode format: 05:30:00 AM 28-10-2026 in IST (UTC+5:30)
                val istFmt = SimpleDateFormat("hh:mm:ss a dd-MM-yyyy", Locale.US).apply {
                    timeZone = TimeZone.getTimeZone("Asia/Kolkata")
                }
                istFmt.parse(trimmed)
            } else if (trimmed.contains("T")) {
                // ISO 8601: 2026-10-31T06:45Z
                val isoFmt = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).apply {
                    timeZone = TimeZone.getTimeZone("UTC")
                }
                val cleanIso = trimmed.replace("Z", "").substringBefore(".")
                isoFmt.parse(cleanIso)
            } else {
                null
            }

            if (date != null) {
                val nowCal = Calendar.getInstance(dhakaTz)
                val eventCal = Calendar.getInstance(dhakaTz).apply { time = date }
                val isToday = nowCal.get(Calendar.YEAR) == eventCal.get(Calendar.YEAR) &&
                        nowCal.get(Calendar.DAY_OF_YEAR) == eventCal.get(Calendar.DAY_OF_YEAR)

                val timeStr = SimpleDateFormat("h:mm a", Locale.US).apply { timeZone = dhakaTz }.format(date)
                val dateStr = SimpleDateFormat("MMM d", Locale.US).apply { timeZone = dhakaTz }.format(date)

                if (isToday) "Today, $timeStr BST" else "$dateStr, $timeStr BST"
            } else null
        } catch (_: Exception) {
            null
        }
    }

    private fun cleanSportTokens(name: String): List<String> {
        return name.lowercase()
            .replace(Regex("[^a-z0-9\\s]"), " ")
            .split(Regex("\\s+"))
            .filter { it.length > 2 && it !in STOP_WORDS }
    }

    private fun matchSportTeams(fcT1: String, fcT2: String, espnT1: String, espnT2: String): Boolean {
        val t1 = cleanSportTokens(fcT1)
        val t2 = cleanSportTokens(fcT2)
        val e1 = cleanSportTokens(espnT1)
        val e2 = cleanSportTokens(espnT2)
        if (t1.isEmpty() || t2.isEmpty() || e1.isEmpty() || e2.isEmpty()) return false

        val overlap = { a: List<String>, b: List<String> -> a.any { it in b } }
        return (overlap(t1, e1) && overlap(t2, e2)) || (overlap(t1, e2) && overlap(t2, e1))
    }

    private data class ParsedTelemetry(
        val rawEv: JSONObject,
        val team1: String,
        val team2: String,
        val title: String,
        val subtitle: String,
        val scoreStr: String,
        val summary: String,
        val bstTime: String?,
        val isLive: Boolean,
        val isFinal: Boolean,
        var merged: Boolean = false
    )

    suspend fun fetchAllLiveEvents(): List<LiveEvent> = withContext(Dispatchers.IO) {
        val events = mutableListOf<LiveEvent>()

        // 1. Fetch ESPN Cricket Telemetry
        val espnCricket = mutableListOf<ParsedTelemetry>()
        try {
            val jsonStr = fetchUrl("https://site.api.espn.com/apis/site/v2/sports/cricket/scorepanel")
            if (jsonStr != null) {
                val root = JSONObject(jsonStr)
                val scores = root.optJSONArray("scores")
                if (scores != null) {
                    for (i in 0 until scores.length()) {
                        val group = scores.getJSONObject(i)
                        val eventsArr = group.optJSONArray("events") ?: continue
                        for (j in 0 until eventsArr.length()) {
                            val ev = eventsArr.getJSONObject(j)
                            val comp = ev.optJSONArray("competitions")?.optJSONObject(0)
                            val competitors = comp?.optJSONArray("competitors")
                            val statusObj = ev.optJSONObject("status")
                            val statusType = statusObj?.optJSONObject("type")
                            val desc = statusType?.optString("description").orEmpty()
                            val descLower = desc.lowercase()
                            val state = statusType?.optString("state").orEmpty()
                            val isLive = state == "in" || descLower.contains("live") || descLower.contains("stumps")
                            val isFinal = statusType?.optBoolean("completed", false) == true || descLower.contains("result") || descLower.contains("final")

                            val scoreParts = mutableListOf<String>()
                            var t1Name = ""
                            var t2Name = ""
                            if (competitors != null) {
                                for (k in 0 until competitors.length()) {
                                    val c = competitors.getJSONObject(k)
                                    val teamObj = c.optJSONObject("team")
                                    val sName = teamObj?.optString("shortDisplayName")?.ifEmpty { teamObj.optString("abbreviation") }?.ifEmpty { teamObj?.optString("name") }.orEmpty()
                                    val fName = teamObj?.optString("name").orEmpty()
                                    if (k == 0) t1Name = fName else if (k == 1) t2Name = fName
                                    val score = c.optString("score")
                                    if (sName.isNotBlank() && score.isNotBlank()) {
                                        scoreParts.add("$sName: $score")
                                    }
                                }
                            }
                            val scoreDetail = if (scoreParts.isNotEmpty()) scoreParts.joinToString(" • ") else ""
                            val summary = statusObj?.optString("summary")?.ifEmpty { statusType?.optString("detail") }.orEmpty()
                            val bstTime = formatToBst(ev.optString("date"))

                            espnCricket.add(
                                ParsedTelemetry(
                                    rawEv = ev,
                                    team1 = t1Name,
                                    team2 = t2Name,
                                    title = ev.optString("name"),
                                    subtitle = comp?.optJSONObject("series")?.optString("name") ?: group.optJSONObject("league")?.optString("name") ?: "ICC / Bilateral Tour",
                                    scoreStr = scoreDetail,
                                    summary = summary,
                                    bstTime = bstTime,
                                    isLive = isLive,
                                    isFinal = isFinal
                                )
                            )
                        }
                    }
                }
            }
        } catch (_: Exception) {}

        // 2. Fetch ESPN Soccer Telemetry
        val espnSoccer = mutableListOf<ParsedTelemetry>()
        try {
            val jsonStr = fetchUrl("https://site.api.espn.com/apis/site/v2/sports/soccer/scorepanel")
            if (jsonStr != null) {
                val root = JSONObject(jsonStr)
                val scores = root.optJSONArray("scores")
                if (scores != null) {
                    for (i in 0 until scores.length()) {
                        val group = scores.getJSONObject(i)
                        val eventsArr = group.optJSONArray("events") ?: continue
                        for (j in 0 until eventsArr.length()) {
                            val ev = eventsArr.getJSONObject(j)
                            val comp = ev.optJSONArray("competitions")?.optJSONObject(0)
                            val competitors = comp?.optJSONArray("competitors")
                            val statusObj = ev.optJSONObject("status")
                            val statusType = statusObj?.optJSONObject("type")
                            val isLive = statusType?.optString("state") == "in"
                            val isFinal = statusType?.optBoolean("completed", false) == true

                            var scoreStr = ""
                            var t1Name = ""
                            var t2Name = ""
                            if (competitors != null && competitors.length() >= 2) {
                                val c1 = competitors.getJSONObject(0)
                                val c2 = competitors.getJSONObject(1)
                                t1Name = c1.optJSONObject("team")?.optString("name").orEmpty()
                                t2Name = c2.optJSONObject("team")?.optString("name").orEmpty()
                                val n1 = c1.optJSONObject("team")?.optString("shortDisplayName") ?: "Team 1"
                                val s1 = c1.optString("score", "0")
                                val n2 = c2.optJSONObject("team")?.optString("shortDisplayName") ?: "Team 2"
                                val s2 = c2.optString("score", "0")
                                scoreStr = "$n1 $s1 - $s2 $n2"
                                val clock = statusObj?.optString("displayClock").orEmpty()
                                if (isLive && clock.isNotBlank()) scoreStr += " • $clock"
                            }
                            val summary = statusType?.optString("detail") ?: ""
                            val bstTime = formatToBst(ev.optString("date"))

                            espnSoccer.add(
                                ParsedTelemetry(
                                    rawEv = ev,
                                    team1 = t1Name,
                                    team2 = t2Name,
                                    title = ev.optString("name"),
                                    subtitle = group.optJSONObject("league")?.optString("name") ?: "World Football",
                                    scoreStr = scoreStr,
                                    summary = summary,
                                    bstTime = bstTime,
                                    isLive = isLive,
                                    isFinal = isFinal
                                )
                            )
                        }
                    }
                }
            }
        } catch (_: Exception) {}

        // 3. Fetch FanCode Live Events and Merge
        try {
            val jsonStr = fetchUrl("https://raw.githubusercontent.com/drmlive/fancode-live-events/main/fancode.json")
            if (jsonStr != null) {
                val root = JSONObject(jsonStr)
                val matches = root.optJSONArray("matches")
                if (matches != null) {
                    for (i in 0 until matches.length()) {
                        val m = matches.getJSONObject(i)
                        val cat = m.optString("event_category").lowercase()
                        val titleRaw = m.optString("title").lowercase()
                        val eventNameRaw = m.optString("event_name").lowercase()

                        val (sport, emoji) = when {
                            cat.contains("cricket") || titleRaw.contains("cricket") -> "Cricket" to "🏏"
                            cat.contains("football") || cat.contains("soccer") || titleRaw.contains("league") -> "Football" to "⚽"
                            cat.contains("tennis") || titleRaw.contains("atp") || titleRaw.contains("wta") -> "Tennis" to "🎾"
                            cat.contains("badminton") -> "Tennis" to "🏸"
                            cat.contains("moto") || cat.contains("racing") || cat.contains("formula") || cat.contains("f1") || titleRaw.contains("grand prix") || eventNameRaw.contains("sepang") -> "MotoGP" to "🏍️"
                            else -> "Sports" to "🏆"
                        }

                        val isLive = m.optString("status").equals("LIVE", ignoreCase = true)
                        val streamUrl = m.optString("dai_url").ifEmpty { m.optString("adfree_url") }.ifEmpty { null }
                        val ua = m.optString("user-agent").ifEmpty { null }
                        val bstTime = formatToBst(m.optString("startTime"))

                        val cleanTitle = (m.optString("match_name").ifEmpty { m.optString("title") }.ifEmpty { m.optString("event_name") })
                            .replace(Regex("\\[(English|Hindi|Bangla)\\]", RegexOption.IGNORE_CASE), "")
                            .trim()

                        if (cleanTitle.lowercase().contains("tbc vs tbc") || cleanTitle.lowercase().contains("tbd vs tbd")) {
                            continue
                        }

                        val cleanSubtitle = (m.optString("event_name").ifEmpty { m.optString("title") })
                            .replace(Regex("\\[(English|Hindi|Bangla)\\]", RegexOption.IGNORE_CASE), "")
                            .trim()

                        val fcTeam1 = m.optString("team_1")
                        val fcTeam2 = m.optString("team_2")

                        var matchedTelemetry: ParsedTelemetry? = null
                        if (sport == "Cricket") {
                            matchedTelemetry = espnCricket.firstOrNull { !it.merged && matchSportTeams(fcTeam1, fcTeam2, it.team1, it.team2) }
                            matchedTelemetry?.merged = true
                        } else if (sport == "Football") {
                            matchedTelemetry = espnSoccer.firstOrNull { !it.merged && matchSportTeams(fcTeam1, fcTeam2, it.team1, it.team2) }
                            matchedTelemetry?.merged = true
                        }

                        val scoreOrDetail = matchedTelemetry?.scoreStr?.ifEmpty { null }
                            ?: if (isLive) "🔴 Live HD Stream Broadcast" else (bstTime?.let { "Starts: $it" } ?: "Upcoming Match")

                        val summary = matchedTelemetry?.summary.orEmpty()

                        val (targetChan, targetId) = when (sport) {
                            "Cricket" -> "T Sports HD" to "t_sports_hd"
                            "Football" -> "beIN Sports 1 HD" to "bein_sports_1"
                            "Tennis" -> "Tennis Channel HD" to "tennis_channel_intl_hd"
                            "MotoGP" -> "SPOTV 2 / ServusTV" to "spotv_2_hd_motogp"
                            else -> "Live Sports" to "t_sports_hd"
                        }

                        events.add(
                            LiveEvent(
                                id = "fc_${m.optString("match_id").ifEmpty { i.toString() }}",
                                title = cleanTitle,
                                subtitle = cleanSubtitle,
                                sport = sport,
                                sportEmoji = emoji,
                                statusText = if (isLive) "LIVE" else m.optString("status", "UPCOMING"),
                                scoreOrDetail = scoreOrDetail,
                                targetChannelId = targetId,
                                targetChannelName = if (isLive) "$cleanTitle (Live)" else targetChan,
                                streamUrl = streamUrl,
                                userAgent = ua,
                                isLive = isLive,
                                priority = if (isLive) 1 else 15,
                                bstTime = bstTime,
                                summary = summary.ifBlank { null }
                            )
                        )
                    }
                }
            }
        } catch (_: Exception) {}

        // 4. Add remaining unmerged ESPN Cricket matches
        for (ec in espnCricket.filter { !it.merged }) {
            val titleLower = ec.title.lowercase()
            val (targetId, targetName) = when {
                titleLower.contains("india") || titleLower.contains("australia") || titleLower.contains("england") -> "willow_tv_hd" to "Willow TV HD"
                titleLower.contains("bangladesh") -> "t_sports_hd" to "T Sports HD"
                titleLower.contains("pakistan") -> "sky_sports_cricket_hd" to "Sky Sports Cricket HD"
                else -> "t_sports_hd" to "T Sports HD"
            }

            events.add(
                LiveEvent(
                    id = "espn_cric_${ec.rawEv.optString("id")}",
                    title = ec.title,
                    subtitle = ec.subtitle,
                    sport = "Cricket",
                    sportEmoji = "🏏",
                    statusText = if (ec.isLive) "LIVE" else if (ec.isFinal) "FINAL" else "SCHEDULED",
                    scoreOrDetail = ec.scoreStr.ifEmpty { if (ec.isLive) "🔴 Live Match" else (ec.bstTime?.let { "Starts: $it" } ?: "Scheduled Match") },
                    targetChannelId = targetId,
                    targetChannelName = targetName,
                    isLive = ec.isLive,
                    priority = if (ec.isLive) 2 else if (ec.isFinal) 25 else 20,
                    bstTime = ec.bstTime,
                    summary = ec.summary.ifBlank { null }
                )
            )
        }

        // 5. Add remaining unmerged ESPN Soccer matches
        for (es in espnSoccer.filter { !it.merged }) {
            events.add(
                LiveEvent(
                    id = "espn_soc_${es.rawEv.optString("id")}",
                    title = es.title,
                    subtitle = es.subtitle,
                    sport = "Football",
                    sportEmoji = "⚽",
                    statusText = if (es.isLive) "LIVE" else if (es.isFinal) "FINAL" else "SCHEDULED",
                    scoreOrDetail = es.scoreStr.ifEmpty { if (es.isLive) "⚽ Live Football" else (es.bstTime?.let { "Starts: $it" } ?: "Scheduled Match") },
                    targetChannelId = "bein_sports_1",
                    targetChannelName = "beIN Sports 1 HD",
                    isLive = es.isLive,
                    priority = if (es.isLive) 2 else if (es.isFinal) 25 else 20,
                    bstTime = es.bstTime,
                    summary = es.summary.ifBlank { null }
                )
            )
        }

        // Deduplicate events by title
        val seen = mutableSetOf<String>()
        val unique = mutableListOf<LiveEvent>()
        for (ev in events) {
            val key = ev.title.lowercase().replace(Regex("[^a-z0-9]"), "")
            if (key.isNotBlank() && seen.add(key)) {
                unique.add(ev)
            }
        }

        // Sort: LIVE with stream first, then LIVE with scores, then upcoming
        unique.sortedWith(
            compareBy<LiveEvent> { !it.isLive }
                .thenBy { if (it.isLive) (it.streamUrl == null) else false }
                .thenBy { it.priority }
        )
    }

    private fun fetchUrl(urlStr: String): String? {
        return try {
            val url = URL(urlStr)
            val conn = url.openConnection() as HttpURLConnection
            conn.connectTimeout = 6000
            conn.readTimeout = 6000
            conn.setRequestProperty("User-Agent", "Mozilla/5.0")
            if (conn.responseCode == 200) {
                conn.inputStream.bufferedReader().use { it.readText() }
            } else null
        } catch (_: Exception) {
            null
        }
    }
}
