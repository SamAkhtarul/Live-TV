package com.example.livetv.data

/**
 * Represents a live television channel.
 *
 * @param id Unique identifier
 * @param name Display name of the channel
 * @param streamUrl Live HLS (.m3u8), DASH (.mpd), or progressive video stream URL
 * @param logoUrl Optional URL for the channel logo
 * @param category Genre/category (e.g., News, Sports, Music, Science)
 * @param country Country of origin or code
 * @param isCustom True if added by the user via M3U playlist or direct URL
 * @param isFavorite True if bookmarked by the user
 */
data class Channel(
    val id: String,
    val name: String,
    val streamUrl: String,
    val logoUrl: String? = null,
    val category: String = "General",
    val country: String? = null,
    val isCustom: Boolean = false,
    val isFavorite: Boolean = false
)

