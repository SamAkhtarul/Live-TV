package com.example.livetv.data

/**
 * Represents a real-time live sports event (Cricket, Tennis, MotoGP, Football)
 * with direct one-tap redirection to its broadcasting TV channel or live stream.
 */
data class LiveEvent(
    val id: String,
    val title: String,
    val subtitle: String,
    val sport: String, // Cricket, Tennis, MotoGP, Football
    val sportEmoji: String,
    val statusText: String, // LIVE, UPCOMING, FINAL
    val scoreOrDetail: String,
    val targetChannelId: String,
    val targetChannelName: String,
    val streamUrl: String? = null,
    val userAgent: String? = null,
    val isLive: Boolean = false,
    val priority: Int = 100,
    val bstTime: String? = null,
    val summary: String? = null
)

object SampleLiveEvents {
    // Dynamic real-time events are fetched by RealSportsFetcher without fake mock data.
    val events: List<LiveEvent> = emptyList()
}
