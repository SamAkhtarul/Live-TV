package com.example.livetv.data

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID
import java.util.regex.Pattern

object M3UParser {

    private val TVG_NAME_PATTERN = Pattern.compile("tvg-name=\"([^\"]+)\"")
    private val TVG_LOGO_PATTERN = Pattern.compile("tvg-logo=\"([^\"]+)\"")
    private val GROUP_TITLE_PATTERN = Pattern.compile("group-title=\"([^\"]+)\"")
    private val TVG_COUNTRY_PATTERN = Pattern.compile("tvg-country=\"([^\"]+)\"")

    suspend fun parseFromUrl(playlistUrl: String): List<Channel> = withContext(Dispatchers.IO) {
        val url = URL(playlistUrl)
        val connection = url.openConnection() as HttpURLConnection
        connection.requestMethod = "GET"
        connection.connectTimeout = 15000
        connection.readTimeout = 15000
        connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Android; Mobile)")

        connection.inputStream.use { inputStream ->
            val reader = BufferedReader(InputStreamReader(inputStream))
            parseLines(reader.readLines(), isCustom = true)
        }
    }

    suspend fun parseFromAssets(
        context: Context,
        assetFileName: String,
        isCustom: Boolean = false
    ): List<Channel> = withContext(Dispatchers.IO) {
        try {
            context.assets.open(assetFileName).use { inputStream ->
                val reader = BufferedReader(InputStreamReader(inputStream))
                parseLines(reader.readLines(), isCustom = isCustom)
            }
        } catch (e: Exception) {
            e.printStackTrace()
            emptyList()
        }
    }

    fun parseContent(content: String): List<Channel> {
        val lines = content.lines()
        return parseLines(lines, isCustom = true)
    }

    private fun parseLines(lines: List<String>, isCustom: Boolean): List<Channel> {
        val channels = mutableListOf<Channel>()
        var currentTvgName: String? = null
        var currentDisplayName: String? = null
        var currentLogo: String? = null
        var currentGroup: String? = null
        var currentCountry: String? = null

        for (rawLine in lines) {
            val line = rawLine.trim()
            if (line.isEmpty()) continue

            if (line.startsWith("#EXTINF:", ignoreCase = true)) {
                val nameMatcher = TVG_NAME_PATTERN.matcher(line)
                currentTvgName = if (nameMatcher.find()) nameMatcher.group(1) else null

                val logoMatcher = TVG_LOGO_PATTERN.matcher(line)
                currentLogo = if (logoMatcher.find()) logoMatcher.group(1) else null

                val groupMatcher = GROUP_TITLE_PATTERN.matcher(line)
                currentGroup = if (groupMatcher.find()) groupMatcher.group(1) else null

                val countryMatcher = TVG_COUNTRY_PATTERN.matcher(line)
                currentCountry = if (countryMatcher.find()) countryMatcher.group(1) else null

                val commaIndex = line.lastIndexOf(',')
                currentDisplayName = if (commaIndex != -1 && commaIndex < line.length - 1) {
                    line.substring(commaIndex + 1).trim()
                } else {
                    currentTvgName ?: "Live Channel ${channels.size + 1}"
                }
            } else if (!line.startsWith("#")) {
                if (line.startsWith("http://") || line.startsWith("https://") || line.startsWith("rtmp://")) {
                    val finalName = currentDisplayName?.takeIf { it.isNotBlank() }
                        ?: currentTvgName?.takeIf { it.isNotBlank() }
                        ?: "Channel ${channels.size + 1}"

                    val group = currentGroup?.takeIf { it.isNotBlank() } ?: "International"
                    val country = currentCountry?.takeIf { it.isNotBlank() }
                        ?: if (group == "Bangladesh") "Bangladesh" else null

                    val stableId = UUID.nameUUIDFromBytes("$finalName|$line".toByteArray()).toString()

                    channels.add(
                        Channel(
                            id = stableId,
                            name = finalName,
                            streamUrl = line,
                            logoUrl = currentLogo?.takeIf { it.isNotBlank() },
                            category = group,
                            country = country,
                            isCustom = isCustom
                        )
                    )
                }
                currentTvgName = null
                currentDisplayName = null
                currentLogo = null
                currentGroup = null
                currentCountry = null
            }
        }

        return channels
    }
}
