package com.example.livetv.player

import android.content.Context
import android.net.Uri
import android.util.Base64
import androidx.annotation.OptIn
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MimeTypes
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.TrackSelectionOverride
import androidx.media3.common.Tracks
import androidx.media3.common.VideoSize
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.DefaultRenderersFactory
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.dash.DashMediaSource
import androidx.media3.exoplayer.drm.DefaultDrmSessionManager
import androidx.media3.exoplayer.drm.DrmSessionManagerProvider
import androidx.media3.exoplayer.drm.FrameworkMediaDrm
import androidx.media3.exoplayer.drm.LocalMediaDrmCallback
import androidx.media3.exoplayer.hls.HlsMediaSource
import androidx.media3.exoplayer.mediacodec.MediaCodecSelector
import androidx.media3.exoplayer.source.MediaSource
import androidx.media3.exoplayer.source.ProgressiveMediaSource
import androidx.media3.ui.AspectRatioFrameLayout
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.security.SecureRandom
import java.security.cert.X509Certificate
import javax.net.ssl.HttpsURLConnection
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManager
import javax.net.ssl.X509TrustManager
import kotlin.math.roundToInt

enum class ResizeMode(val value: Int) {
    FIT(AspectRatioFrameLayout.RESIZE_MODE_FIT),
    FILL(AspectRatioFrameLayout.RESIZE_MODE_FILL),
    ZOOM(AspectRatioFrameLayout.RESIZE_MODE_ZOOM)
}

/**
 * Video quality presets ordered top-to-bottom by resolution:
 * 2160p (4K), 1440p (HD), 1080p (HD), 720p, 480p, 360p, 240p, 144p, and Auto.
 */
enum class VideoQuality(
    val label: String,
    val shortLabel: String,
    val badge: String?,
    val maxWidth: Int,
    val maxHeight: Int,
    val fallbackBitrateCap: Int,
    val forceLowest: Boolean = false,
    val forceHighest: Boolean = false
) {
    P2160("2160p", "2160p", "4K", 3840, 2160, Int.MAX_VALUE, forceHighest = true),
    P1440("1440p", "1440p", "HD", 2560, 1440, 25_000_000),
    P1080("1080p", "1080p", "HD", 1920, 1080, 20_000_000),
    P720("720p", "720p", null, 1280, 720, 8_000_000),
    P480("480p", "480p", null, 854, 480, 3_000_000),
    P360("360p", "360p", null, 640, 360, 1_300_000),
    P240("240p", "240p", null, 426, 240, 700_000),
    P144("144p", "144p", null, 256, 144, 350_000, forceLowest = true),
    AUTO("Auto", "Auto", null, Int.MAX_VALUE, Int.MAX_VALUE, Int.MAX_VALUE);

    companion object {
        fun fromStoredName(name: String?): VideoQuality {
            return when (name) {
                "P4K" -> P2160
                else -> entries.firstOrNull { it.name == name } ?: AUTO
            }
        }
    }
}

data class AudioTrackOption(
    val groupIndex: Int,
    val trackIndex: Int,
    val label: String,
    val isSelected: Boolean
)

data class StreamStats(
    val width: Int? = null,
    val height: Int? = null,
    val frameRate: Int? = null,
    val bitrateKbps: Int? = null,
    val videoCodec: String? = null,
    val audioCodec: String? = null,
    val availableHeights: List<Int> = emptyList()
)

data class DvrState(
    val isSeekable: Boolean = false,
    val durationMs: Long = 0L,
    val currentPositionMs: Long = 0L,
    val behindLiveMs: Long = 0L,
    val isAtLiveEdge: Boolean = true,
    val catchUpMinutesAgo: Int = 0,
    val statusNotice: String? = null
)

@OptIn(UnstableApi::class)
class LiveTvPlayerManager(private val context: Context) {

    init {
        configureSslTrustAll()
    }

    private fun configureSslTrustAll() {
        try {
            val trustAllCerts = arrayOf<TrustManager>(
                object : X509TrustManager {
                    override fun checkClientTrusted(chain: Array<out X509Certificate>?, authType: String?) {}
                    override fun checkServerTrusted(chain: Array<out X509Certificate>?, authType: String?) {}
                    override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf()
                }
            )
            val sslContext = SSLContext.getInstance("TLS")
            sslContext.init(null, trustAllCerts, SecureRandom())
            HttpsURLConnection.setDefaultSSLSocketFactory(sslContext.socketFactory)
            HttpsURLConnection.setDefaultHostnameVerifier { _, _ -> true }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private var exoPlayer: ExoPlayer? = null

    private val _isPlaying = MutableStateFlow(false)
    val isPlaying: StateFlow<Boolean> = _isPlaying.asStateFlow()

    private val _isBuffering = MutableStateFlow(false)
    val isBuffering: StateFlow<Boolean> = _isBuffering.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    private val _resizeMode = MutableStateFlow(ResizeMode.FIT)
    val resizeMode: StateFlow<ResizeMode> = _resizeMode.asStateFlow()

    private val _volume = MutableStateFlow(1.0f)
    val volume: StateFlow<Float> = _volume.asStateFlow()

    private val _isMuted = MutableStateFlow(false)
    val isMuted: StateFlow<Boolean> = _isMuted.asStateFlow()

    private val _playbackSpeed = MutableStateFlow(1.0f)
    val playbackSpeed: StateFlow<Float> = _playbackSpeed.asStateFlow()

    private var lastUnmutedVolume: Float = 1.0f

    private val prefs = context.getSharedPreferences("livetv_prefs", Context.MODE_PRIVATE)

    private val _selectedQuality = MutableStateFlow(
        VideoQuality.fromStoredName(prefs.getString("video_quality", VideoQuality.AUTO.name))
    )
    val selectedQuality: StateFlow<VideoQuality> = _selectedQuality.asStateFlow()

    private val _activeVideoHeight = MutableStateFlow<Int?>(null)
    val activeVideoHeight: StateFlow<Int?> = _activeVideoHeight.asStateFlow()

    private val _streamStats = MutableStateFlow(StreamStats())
    val streamStats: StateFlow<StreamStats> = _streamStats.asStateFlow()

    private val _audioTracks = MutableStateFlow<List<AudioTrackOption>>(emptyList())
    val audioTracks: StateFlow<List<AudioTrackOption>> = _audioTracks.asStateFlow()

    private val _dvrState = MutableStateFlow(DvrState())
    val dvrState: StateFlow<DvrState> = _dvrState.asStateFlow()

    private var currentBaseUrl: String? = null
    private var requestedCatchUpMinutes: Int = 0
    private var pendingCatchUpUrlFallback: Boolean = false
    private var pendingSeekToEarliestOnReady: Boolean = false

    private val httpDataSourceFactory = DefaultHttpDataSource.Factory()
        .setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36")
        .setAllowCrossProtocolRedirects(true)
        .setConnectTimeoutMs(15000)
        .setReadTimeoutMs(15000)

    fun getPlayer(): ExoPlayer {
        if (exoPlayer == null) {
            val renderersFactory = DefaultRenderersFactory(context)
                .setEnableDecoderFallback(true)
                .setMediaCodecSelector { mimeType, requiresSecureDecoder, requiresTunnelingDecoder ->
                    val decoders = MediaCodecSelector.DEFAULT.getDecoderInfos(
                        mimeType,
                        requiresSecureDecoder,
                        requiresTunnelingDecoder
                    )
                    // Avoid buggy emulator goldfish video decoders ("no frame!" on broadcast H264/HEVC)
                    val nonGoldfish = decoders.filterNot { it.name.contains("goldfish", ignoreCase = true) }
                    val goldfish = decoders.filter { it.name.contains("goldfish", ignoreCase = true) }
                    nonGoldfish + goldfish
                }

            // Retain up to 30 minutes of watched stream in the rolling back-buffer so users can rewind live TV
            val loadControl = DefaultLoadControl.Builder()
                .setBufferDurationsMs(
                    /* minBufferMs = */ 10_000,
                    /* maxBufferMs = */ 45_000,
                    /* bufferForPlaybackMs = */ 1_200,
                    /* bufferForPlaybackAfterRebufferMs = */ 2_500
                )
                .setBackBuffer(
                    /* backBufferDurationMs = */ 30 * 60 * 1000,
                    /* retainBackBufferFromKeyframe = */ true
                )
                .build()

            exoPlayer = ExoPlayer.Builder(context, renderersFactory)
                .setLoadControl(loadControl)
                .setHandleAudioBecomingNoisy(true)
                .setWakeMode(C.WAKE_MODE_NETWORK)
                .build()
                .apply {
                    repeatMode = Player.REPEAT_MODE_OFF
                    playWhenReady = true
                    volume = if (_isMuted.value) 0f else _volume.value
                    setPlaybackSpeed(_playbackSpeed.value)
                    applyVideoQuality(this, _selectedQuality.value, userInitiated = false)
                    addListener(playerListener)
                }
        }
        return exoPlayer!!
    }

    private val playerListener = object : Player.Listener {
        override fun onPlaybackStateChanged(playbackState: Int) {
            when (playbackState) {
                Player.STATE_BUFFERING -> {
                    _isBuffering.value = true
                    _errorMessage.value = null
                }
                Player.STATE_READY -> {
                    _isBuffering.value = false
                    _errorMessage.value = null
                    pendingCatchUpUrlFallback = false
                    if (pendingSeekToEarliestOnReady) {
                        pendingSeekToEarliestOnReady = false
                        exoPlayer?.seekTo(0L)
                    }
                    refreshDvrState()
                }
                Player.STATE_ENDED -> {
                    _isBuffering.value = false
                }
                Player.STATE_IDLE -> {
                    _isBuffering.value = false
                }
            }
        }

        override fun onIsPlayingChanged(playing: Boolean) {
            _isPlaying.value = playing
            if (playing) {
                _isBuffering.value = false
            }
            refreshDvrState()
        }

        override fun onVideoSizeChanged(videoSize: VideoSize) {
            _activeVideoHeight.value = if (videoSize.height > 0) videoSize.height else null
            _streamStats.value = _streamStats.value.copy(
                width = if (videoSize.width > 0) videoSize.width else null,
                height = if (videoSize.height > 0) videoSize.height else null
            )
        }

        override fun onTracksChanged(tracks: Tracks) {
            val audioList = mutableListOf<AudioTrackOption>()
            val heights = sortedSetOf<Int>()
            var activeFps: Int? = null
            var activeBitrateKbps: Int? = null
            var vCodec: String? = null
            var aCodec: String? = null

            tracks.groups.forEachIndexed { groupIdx, group ->
                when (group.type) {
                    C.TRACK_TYPE_VIDEO -> {
                        for (trackIdx in 0 until group.length) {
                            val format = group.getTrackFormat(trackIdx)
                            if (format.height > 0) {
                                heights.add(format.height)
                            }
                            if (group.isTrackSelected(trackIdx)) {
                                if (format.frameRate > 0f) {
                                    activeFps = format.frameRate.roundToInt()
                                }
                                val effectiveBitrate = when {
                                    format.bitrate > 0 -> format.bitrate
                                    format.peakBitrate > 0 -> format.peakBitrate
                                    format.averageBitrate > 0 -> format.averageBitrate
                                    else -> 0
                                }
                                if (effectiveBitrate > 0) {
                                    activeBitrateKbps = effectiveBitrate / 1000
                                }
                                vCodec = format.sampleMimeType
                                    ?.substringAfter("/")
                                    ?.uppercase()
                                    ?.replace("AVC", "H.264")
                                    ?.replace("HEVC", "H.265")
                            }
                        }
                    }
                    C.TRACK_TYPE_AUDIO -> {
                        for (trackIdx in 0 until group.length) {
                            val format = group.getTrackFormat(trackIdx)
                            val lang = format.language?.let { java.util.Locale(it).displayLanguage }
                                ?.takeIf { it.isNotBlank() }
                            val label = buildString {
                                append(format.label ?: lang ?: "Audio Track ${audioList.size + 1}")
                                if (!lang.isNullOrBlank() && format.label != null && !format.label!!.contains(lang, ignoreCase = true)) {
                                    append(" ($lang)")
                                }
                            }
                            val selected = group.isTrackSelected(trackIdx)
                            if (selected) {
                                aCodec = format.sampleMimeType
                                    ?.substringAfter("/")
                                    ?.uppercase()
                                    ?.replace("MP4A-LATM", "AAC")
                            }
                            audioList.add(
                                AudioTrackOption(
                                    groupIndex = groupIdx,
                                    trackIndex = trackIdx,
                                    label = label,
                                    isSelected = selected
                                )
                            )
                        }
                    }
                }
            }

            _audioTracks.value = audioList
            _streamStats.value = _streamStats.value.copy(
                frameRate = activeFps,
                bitrateKbps = activeBitrateKbps,
                videoCodec = vCodec,
                audioCodec = aCodec,
                availableHeights = heights.toList()
            )
            refreshDvrState()

            // Re-lock explicit video track override when new stream tracks arrive
            val currentQuality = _selectedQuality.value
            if (currentQuality != VideoQuality.AUTO) {
                exoPlayer?.let { applyVideoQuality(it, currentQuality, userInitiated = false) }
            }
        }

        override fun onPlayerError(error: PlaybackException) {
            // If a server catch-up archive URL failed (server doesn't store 1h archive),
            // gracefully fall back to the live stream and rewind to the earliest DVR point.
            val baseUrl = currentBaseUrl
            if (pendingCatchUpUrlFallback && baseUrl != null) {
                pendingCatchUpUrlFallback = false
                val attemptedMins = requestedCatchUpMinutes
                requestedCatchUpMinutes = 0
                pendingSeekToEarliestOnReady = true
                _dvrState.value = _dvrState.value.copy(
                    catchUpMinutesAgo = 0,
                    statusNotice = "Server doesn't store ${attemptedMins}m archive • Rewound to earliest DVR buffer"
                )
                val player = getPlayer()
                _errorMessage.value = null
                _isBuffering.value = true
                player.setMediaSource(buildMediaSource(baseUrl))
                player.prepare()
                player.play()
                return
            }

            _isBuffering.value = false
            val message = when (error.errorCode) {
                PlaybackException.ERROR_CODE_IO_NETWORK_CONNECTION_FAILED ->
                    "Network error: check internet connection"
                PlaybackException.ERROR_CODE_IO_BAD_HTTP_STATUS ->
                    "Server returned HTTP error (stream might be geo-blocked or offline)"
                PlaybackException.ERROR_CODE_IO_FILE_NOT_FOUND ->
                    "Stream not found (404)"
                PlaybackException.ERROR_CODE_PARSING_CONTAINER_MALFORMED,
                PlaybackException.ERROR_CODE_PARSING_MANIFEST_MALFORMED ->
                    "Corrupt or unsupported stream format"
                else -> error.localizedMessage ?: "Unknown playback error (${error.errorCodeName})"
            }
            _errorMessage.value = message
        }
    }

    fun playStream(url: String) {
        val player = getPlayer()
        currentBaseUrl = url
        requestedCatchUpMinutes = 0
        pendingCatchUpUrlFallback = false
        pendingSeekToEarliestOnReady = false
        _errorMessage.value = null
        _isBuffering.value = true
        _activeVideoHeight.value = null
        _streamStats.value = StreamStats()
        _audioTracks.value = emptyList()
        _dvrState.value = DvrState()

        // Ensure baseline quality constraints are active before preparing the new media source
        applyVideoQuality(player, _selectedQuality.value, userInitiated = false)

        val mediaSource = buildMediaSource(url)

        player.setMediaSource(mediaSource)
        player.prepare()
        player.play()
    }

    fun refreshDvrState() {
        val player = exoPlayer ?: return
        val rawDuration = player.duration
        val duration = if (rawDuration != C.TIME_UNSET && rawDuration > 0L) rawDuration else 0L
        val pos = player.currentPosition.coerceIn(0L, if (duration > 0L) duration else Long.MAX_VALUE)
        val seekable = player.isCurrentMediaItemSeekable && duration > 5_000L
        val windowBehind = if (seekable && duration > pos) (duration - pos).coerceAtLeast(0L) else 0L
        val totalBehind = windowBehind + (requestedCatchUpMinutes * 60_000L)
        val atLive = requestedCatchUpMinutes == 0 && (!seekable || windowBehind <= 8_000L)
        _dvrState.value = _dvrState.value.copy(
            isSeekable = seekable,
            durationMs = duration,
            currentPositionMs = pos,
            behindLiveMs = totalBehind,
            isAtLiveEdge = atLive,
            catchUpMinutesAgo = requestedCatchUpMinutes
        )
    }

    fun clearDvrNotice() {
        if (_dvrState.value.statusNotice != null) {
            _dvrState.value = _dvrState.value.copy(statusNotice = null)
        }
    }

    fun seekByMs(deltaMs: Long) {
        val player = exoPlayer ?: return
        val rawDuration = player.duration
        val duration = if (rawDuration != C.TIME_UNSET && rawDuration > 0L) rawDuration else 0L
        if (duration > 5_000L && player.isCurrentMediaItemSeekable) {
            val target = (player.currentPosition + deltaMs).coerceIn(0L, duration)
            player.seekTo(target)
            player.play()
            refreshDvrState()
        } else if (deltaMs < 0L) {
            player.seekTo(0L)
            player.play()
            _dvrState.value = _dvrState.value.copy(
                statusNotice = "Rewound to start of live buffer"
            )
            refreshDvrState()
        }
    }

    fun seekToPositionMs(positionMs: Long) {
        val player = exoPlayer ?: return
        val rawDuration = player.duration
        val duration = if (rawDuration != C.TIME_UNSET && rawDuration > 0L) rawDuration else return
        val clamped = positionMs.coerceIn(0L, duration)
        player.seekTo(clamped)
        player.play()
        refreshDvrState()
    }

    /**
     * Loads or seeks to `minutesAgo` (e.g. 5, 15, 30, 60 minutes ago) for the current channel:
     * 1. If the channel's active HLS manifest already contains a DVR window covering `minutesAgo`,
     *    seeks directly inside the active DVR timeline.
     * 2. Otherwise, requests the server's archive/timeshift manifest (`index-<epoch>-3600.m3u8` / `?utc=<epoch>`),
     *    and automatically falls back to the earliest point in the live DVR window if the broadcaster
     *    does not store server-side archives.
     */
    fun startCatchUp(minutesAgo: Int) {
        val player = exoPlayer ?: return
        val rawBase = currentBaseUrl ?: return
        val baseUrl = rawBase.substringBefore("|")
        val metadata = if (rawBase.contains("|")) "|" + rawBase.substringAfter("|") else ""

        if (minutesAgo <= 0) {
            seekToLiveEdge()
            return
        }

        val targetOffsetMs = minutesAgo * 60_000L
        val rawDuration = player.duration
        val duration = if (rawDuration != C.TIME_UNSET && rawDuration > 0L) rawDuration else 0L

        // Case 1: Active stream already exposes a DVR window long enough
        if (requestedCatchUpMinutes == 0 && player.isCurrentMediaItemSeekable && duration >= targetOffsetMs) {
            val targetPos = (duration - targetOffsetMs).coerceAtLeast(0L)
            player.seekTo(targetPos)
            player.play()
            _dvrState.value = _dvrState.value.copy(
                statusNotice = "Rewound ${minutesAgo}m in channel DVR timeline"
            )
            refreshDvrState()
            return
        }

        // Case 2: Request server-side archive/timeshift stream for `minutesAgo`
        val nowEpochSec = System.currentTimeMillis() / 1000L
        val startEpochSec = nowEpochSec - (minutesAgo * 60L)
        val catchUpUrl = buildCatchUpUrl(baseUrl, startEpochSec, nowEpochSec) + metadata

        requestedCatchUpMinutes = minutesAgo
        pendingCatchUpUrlFallback = true
        pendingSeekToEarliestOnReady = false
        _errorMessage.value = null
        _isBuffering.value = true
        _dvrState.value = _dvrState.value.copy(
            catchUpMinutesAgo = minutesAgo,
            isAtLiveEdge = false,
            statusNotice = "Loading stream from ${if (minutesAgo == 60) "1 hour" else "${minutesAgo}m"} ago…"
        )

        player.setMediaSource(buildMediaSource(catchUpUrl))
        player.prepare()
        player.play()
    }

    private fun buildCatchUpUrl(baseUrl: String, startEpochSec: Long, nowEpochSec: Long): String {
        val durationSec = (nowEpochSec - startEpochSec).coerceAtLeast(300L)
        return when {
            // Flussonic / BDIX standard archive format: .../index.m3u8 -> .../index-<start>-<duration>.m3u8
            baseUrl.contains("/index.m3u8") && !baseUrl.contains("?") -> {
                baseUrl.replace("/index.m3u8", "/index-$startEpochSec-$durationSec.m3u8")
            }
            baseUrl.contains("/mono.m3u8") && !baseUrl.contains("?") -> {
                baseUrl.replace("/mono.m3u8", "/index-$startEpochSec-$durationSec.m3u8")
            }
            // Append standard IPTV timeshift query params (?utc=<start>&lutc=<now>)
            baseUrl.contains("?") -> "$baseUrl&utc=$startEpochSec&lutc=$nowEpochSec"
            else -> "$baseUrl?utc=$startEpochSec&lutc=$nowEpochSec"
        }
    }

    data class StreamEndpointConfig(
        val cleanUrl: String,
        val headers: Map<String, String> = emptyMap(),
        val clearKeys: List<Pair<String, String>> = emptyList()
    )

    private fun parseStreamConfig(rawUrl: String): StreamEndpointConfig {
        if (!rawUrl.contains("|")) {
            return StreamEndpointConfig(cleanUrl = rawUrl.trim())
        }
        val cleanUrl = rawUrl.substringBefore("|").trim()
        val paramPart = rawUrl.substringAfter("|").trim()
        val headers = mutableMapOf<String, String>()
        val clearKeys = mutableListOf<Pair<String, String>>()

        val pairs = paramPart.split('&', '|').filter { it.isNotBlank() }
        for (pair in pairs) {
            val k = pair.substringBefore('=').trim()
            val v = pair.substringAfter('=', "").trim()
            when {
                k.equals("clearkey", ignoreCase = true) ||
                k.equals("drmkey", ignoreCase = true) ||
                k.equals("key", ignoreCase = true) -> {
                    if (v.contains(":")) {
                        val kid = v.substringBefore(":").trim()
                        val key = v.substringAfter(":").trim()
                        clearKeys.add(kid to key)
                    }
                }
                k.equals("user-agent", ignoreCase = true) || k.equals("ua", ignoreCase = true) -> {
                    headers["User-Agent"] = v
                }
                k.equals("referer", ignoreCase = true) -> {
                    headers["Referer"] = v
                    if (headers["Origin"] == null) {
                        headers["Origin"] = v.trimEnd('/')
                    }
                }
                k.equals("origin", ignoreCase = true) -> {
                    headers["Origin"] = v
                }
                else -> {
                    if (k.isNotBlank() && v.isNotBlank()) {
                        headers[k] = v
                    }
                }
            }
        }
        return StreamEndpointConfig(cleanUrl = cleanUrl, headers = headers, clearKeys = clearKeys)
    }

    private fun hexToBytes(hex: String): ByteArray {
        val clean = hex.replace("-", "").trim()
        val bytes = ByteArray(clean.length / 2)
        for (i in bytes.indices) {
            val index = i * 2
            bytes[i] = clean.substring(index, index + 2).toInt(16).toByte()
        }
        return bytes
    }

    private fun buildClearKeyDrmProvider(clearKeys: List<Pair<String, String>>): DrmSessionManagerProvider? {
        if (clearKeys.isEmpty()) return null
        return try {
            val keysArray = clearKeys.joinToString(",") { (kidHex, keyHex) ->
                val kidBytes = hexToBytes(kidHex)
                val keyBytes = hexToBytes(keyHex)
                val kidB64 = Base64.encodeToString(kidBytes, Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP)
                val keyB64 = Base64.encodeToString(keyBytes, Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP)
                """{"kty":"oct","k":"$keyB64","kid":"$kidB64"}"""
            }
            val clearKeyJson = """{"keys":[$keysArray],"type":"temporary"}"""
            val callback = LocalMediaDrmCallback(clearKeyJson.toByteArray(Charsets.UTF_8))
            val drmManager = DefaultDrmSessionManager.Builder()
                .setUuidAndExoMediaDrmProvider(C.CLEARKEY_UUID, FrameworkMediaDrm.DEFAULT_PROVIDER)
                .setMultiSession(false)
                .build(callback)
            DrmSessionManagerProvider { drmManager }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    private fun createHttpDataSourceFactory(config: StreamEndpointConfig): DefaultHttpDataSource.Factory {
        val customUa = config.headers["User-Agent"]
            ?: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        val factory = DefaultHttpDataSource.Factory()
            .setUserAgent(customUa)
            .setAllowCrossProtocolRedirects(true)
            .setConnectTimeoutMs(15000)
            .setReadTimeoutMs(15000)
        if (config.headers.isNotEmpty()) {
            factory.setDefaultRequestProperties(config.headers)
        }
        return factory
    }

    private fun buildMediaSource(rawUrl: String): MediaSource {
        val config = parseStreamConfig(rawUrl)
        val uri = Uri.parse(config.cleanUrl)
        val cleanLower = config.cleanUrl.lowercase()
        val dataSourceFactory = createHttpDataSourceFactory(config)
        val drmProvider = buildClearKeyDrmProvider(config.clearKeys)

        val mediaItemBuilder = MediaItem.Builder().setUri(uri)
        if (config.clearKeys.isNotEmpty()) {
            mediaItemBuilder.setDrmConfiguration(
                MediaItem.DrmConfiguration.Builder(C.CLEARKEY_UUID).build()
            )
        }

        return when {
            cleanLower.contains("m3u8") || cleanLower.contains("hls") -> {
                val mediaItem = mediaItemBuilder
                    .setMimeType(MimeTypes.APPLICATION_M3U8)
                    .build()
                val factory = HlsMediaSource.Factory(dataSourceFactory)
                    .setAllowChunklessPreparation(true)
                if (drmProvider != null) {
                    factory.setDrmSessionManagerProvider(drmProvider)
                }
                factory.createMediaSource(mediaItem)
            }
            cleanLower.contains(".mpd") || cleanLower.contains("dash") -> {
                val mediaItem = mediaItemBuilder
                    .setMimeType(MimeTypes.APPLICATION_MPD)
                    .build()
                val factory = DashMediaSource.Factory(dataSourceFactory)
                if (drmProvider != null) {
                    factory.setDrmSessionManagerProvider(drmProvider)
                }
                factory.createMediaSource(mediaItem)
            }
            else -> {
                val mediaItem = mediaItemBuilder.build()
                ProgressiveMediaSource.Factory(dataSourceFactory)
                    .createMediaSource(mediaItem)
            }
        }
    }

    fun togglePlayPause() {
        exoPlayer?.let { player ->
            if (player.isPlaying) {
                player.pause()
            } else {
                if (player.playbackState == Player.STATE_IDLE || player.playbackState == Player.STATE_ENDED) {
                    _isBuffering.value = true
                    player.prepare()
                }
                player.play()
            }
        }
    }

    fun seekToLiveEdge() {
        val player = exoPlayer ?: return
        val baseUrl = currentBaseUrl
        if (requestedCatchUpMinutes > 0 && baseUrl != null) {
            requestedCatchUpMinutes = 0
            pendingCatchUpUrlFallback = false
            pendingSeekToEarliestOnReady = false
            _errorMessage.value = null
            _isBuffering.value = true
            _dvrState.value = _dvrState.value.copy(
                catchUpMinutesAgo = 0,
                isAtLiveEdge = true,
                behindLiveMs = 0L,
                statusNotice = "Returned to Live broadcast"
            )
            player.setMediaSource(buildMediaSource(baseUrl))
            player.prepare()
            player.play()
        } else {
            _isBuffering.value = true
            player.seekToDefaultPosition()
            player.play()
            _dvrState.value = _dvrState.value.copy(
                catchUpMinutesAgo = 0,
                isAtLiveEdge = true,
                behindLiveMs = 0L,
                statusNotice = "Synced to Live edge"
            )
            refreshDvrState()
        }
    }

    fun cycleResizeMode() {
        _resizeMode.value = when (_resizeMode.value) {
            ResizeMode.FIT -> ResizeMode.FILL
            ResizeMode.FILL -> ResizeMode.ZOOM
            ResizeMode.ZOOM -> ResizeMode.FIT
        }
    }

    fun setVolume(newVolume: Float) {
        val clamped = newVolume.coerceIn(0f, 1f)
        _volume.value = clamped
        _isMuted.value = clamped == 0f
        if (clamped > 0f) {
            lastUnmutedVolume = clamped
        }
        exoPlayer?.volume = clamped
    }

    fun toggleMute() {
        if (_isMuted.value || _volume.value == 0f) {
            val restored = if (lastUnmutedVolume > 0.05f) lastUnmutedVolume else 1.0f
            _isMuted.value = false
            _volume.value = restored
            exoPlayer?.volume = restored
        } else {
            lastUnmutedVolume = _volume.value
            _isMuted.value = true
            exoPlayer?.volume = 0f
        }
    }

    fun adjustVolumeBy(delta: Float) {
        val current = if (_isMuted.value) 0f else _volume.value
        setVolume(current + delta)
    }

    fun setPlaybackSpeed(speed: Float) {
        val clamped = speed.coerceIn(0.25f, 3.0f)
        _playbackSpeed.value = clamped
        exoPlayer?.setPlaybackSpeed(clamped)
    }

    fun setVideoQuality(quality: VideoQuality) {
        _selectedQuality.value = quality
        prefs.edit().putString("video_quality", quality.name).apply()
        exoPlayer?.let { applyVideoQuality(it, quality, userInitiated = true) }
    }

    fun selectAudioTrack(option: AudioTrackOption) {
        val player = exoPlayer ?: return
        val groups = player.currentTracks.groups
        if (option.groupIndex !in groups.indices) return
        val mediaTrackGroup = groups[option.groupIndex].mediaTrackGroup
        player.trackSelectionParameters = player.trackSelectionParameters
            .buildUpon()
            .clearOverridesOfType(C.TRACK_TYPE_AUDIO)
            .addOverride(TrackSelectionOverride(mediaTrackGroup, listOf(option.trackIndex)))
            .build()
    }

    private data class VideoTrackCandidate(
        val group: Tracks.Group,
        val trackIndex: Int,
        val height: Int,
        val bitrate: Int,
        val frameRate: Float,
        val isSupported: Boolean
    )

    private fun applyVideoQuality(player: ExoPlayer, quality: VideoQuality, userInitiated: Boolean) {
        val builder = player.trackSelectionParameters.buildUpon()
            .clearOverridesOfType(C.TRACK_TYPE_VIDEO)
            .clearVideoSizeConstraints()
            .setMaxVideoBitrate(Int.MAX_VALUE)
            .setForceLowestBitrate(false)
            .setForceHighestSupportedBitrate(false)

        if (quality != VideoQuality.AUTO) {
            builder
                .setMaxVideoSize(quality.maxWidth, quality.maxHeight)
                .setForceLowestBitrate(quality.forceLowest)
                .setForceHighestSupportedBitrate(quality.forceHighest)

            // Inspect currently loaded video tracks to lock onto the highest quality matching HLS/DASH rendition
            val allCandidates = mutableListOf<VideoTrackCandidate>()
            player.currentTracks.groups.forEach { group ->
                if (group.type == C.TRACK_TYPE_VIDEO && group.length > 0) {
                    for (trackIdx in 0 until group.length) {
                        val format = group.getTrackFormat(trackIdx)
                        val effectiveBitrate = when {
                            format.bitrate > 0 -> format.bitrate
                            format.peakBitrate > 0 -> format.peakBitrate
                            format.averageBitrate > 0 -> format.averageBitrate
                            else -> 0
                        }
                        allCandidates.add(
                            VideoTrackCandidate(
                                group = group,
                                trackIndex = trackIdx,
                                height = format.height,
                                bitrate = effectiveBitrate,
                                frameRate = format.frameRate,
                                isSupported = group.isTrackSupported(trackIdx)
                            )
                        )
                    }
                }
            }

            if (allCandidates.isNotEmpty()) {
                val pool = allCandidates.filter { it.isSupported }.ifEmpty { allCandidates }
                val hasHeightMetadata = pool.any { it.height > 0 }

                val chosen: VideoTrackCandidate? = when {
                    quality.forceLowest -> {
                        if (hasHeightMetadata) {
                            pool.filter { it.height > 0 }
                                .minWithOrNull(compareBy<VideoTrackCandidate> { it.height }.thenBy { if (it.bitrate > 0) it.bitrate else Int.MAX_VALUE })
                                ?: pool.first()
                        } else {
                            pool.minByOrNull { if (it.bitrate > 0) it.bitrate else Int.MAX_VALUE }
                        }
                    }
                    quality.forceHighest -> {
                        if (hasHeightMetadata) {
                            pool.maxWithOrNull(compareBy<VideoTrackCandidate> { it.height }.thenBy { it.frameRate }.thenBy { it.bitrate })
                        } else {
                            pool.maxWithOrNull(compareBy<VideoTrackCandidate> { it.frameRate }.thenBy { it.bitrate })
                        }
                    }
                    hasHeightMetadata -> {
                        val withHeight = pool.filter { it.height > 0 }
                        val underOrEqual = withHeight.filter { it.height <= quality.maxHeight }
                        if (underOrEqual.isNotEmpty()) {
                            // Pick the track closest to the requested height, preferring higher framerate (e.g. 50/60fps) and highest bitrate
                            underOrEqual.maxWithOrNull(compareBy<VideoTrackCandidate> { it.height }.thenBy { it.frameRate }.thenBy { it.bitrate })
                        } else {
                            // Stream only offers higher resolutions than requested; pick the lowest available
                            withHeight.minWithOrNull(compareBy<VideoTrackCandidate> { it.height }.thenBy { if (it.bitrate > 0) it.bitrate else Int.MAX_VALUE })
                        }
                    }
                    else -> {
                        val withBitrate = pool.filter { it.bitrate > 0 }
                        val underCap = withBitrate.filter { it.bitrate <= quality.fallbackBitrateCap }
                        if (underCap.isNotEmpty()) {
                            underCap.maxWithOrNull(compareBy<VideoTrackCandidate> { it.frameRate }.thenBy { it.bitrate })
                        } else {
                            withBitrate.minByOrNull { it.bitrate } ?: pool.firstOrNull()
                        }
                    }
                }

                if (chosen != null) {
                    builder.addOverride(
                        TrackSelectionOverride(chosen.group.mediaTrackGroup, listOf(chosen.trackIndex))
                    )
                }
            }
        }

        val newParams = builder.build()
        if (player.trackSelectionParameters != newParams) {
            player.trackSelectionParameters = newParams
            if (userInitiated && player.playbackState == Player.STATE_READY) {
                // Flush buffered segments of the previous quality so the new quality takes effect immediately
                player.seekToDefaultPosition()
            }
        }
    }

    fun retry() {
        exoPlayer?.let {
            _errorMessage.value = null
            _isBuffering.value = true
            it.prepare()
            it.play()
        }
    }

    fun release() {
        exoPlayer?.removeListener(playerListener)
        exoPlayer?.release()
        exoPlayer = null
    }
}
