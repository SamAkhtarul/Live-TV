package com.example.livetv.ui.components

import android.app.Activity
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.annotation.OptIn
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.VolumeDown
import androidx.compose.material.icons.automirrored.filled.VolumeOff
import androidx.compose.material.icons.automirrored.filled.VolumeUp
import androidx.compose.material.icons.filled.BrightnessMedium
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.FastForward
import androidx.compose.material.icons.filled.FastRewind
import androidx.compose.material.icons.filled.HighQuality
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PictureInPictureAlt
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material.icons.filled.SkipPrevious
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.outlined.StarBorder
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.common.util.UnstableApi
import androidx.media3.ui.PlayerView
import com.example.livetv.data.Channel
import com.example.livetv.player.LiveTvPlayerManager
import com.example.livetv.player.ResizeMode
import com.example.livetv.player.VideoQuality
import com.example.livetv.ui.theme.AccentRed
import com.example.livetv.ui.theme.LiveBadgeRed
import com.example.livetv.ui.theme.TextPrimary
import com.example.livetv.ui.theme.TextSecondary
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/** Formats a remaining duration as `H:MM:SS` or `MM:SS`. */
private fun formatRemaining(ms: Long): String {
    val totalSeconds = (ms + 999) / 1000
    val hours = totalSeconds / 3600
    val minutes = (totalSeconds % 3600) / 60
    val seconds = totalSeconds % 60
    return if (hours > 0) {
        "%d:%02d:%02d".format(hours, minutes, seconds)
    } else {
        "%02d:%02d".format(minutes, seconds)
    }
}

@OptIn(UnstableApi::class)
@Composable
fun VideoPlayerView(
    playerManager: LiveTvPlayerManager,
    currentChannel: Channel,
    channelsList: List<Channel>,
    isPlaying: Boolean,
    isBuffering: Boolean,
    errorMessage: String?,
    resizeMode: ResizeMode,
    onClose: () -> Unit,
    onNextChannel: () -> Unit,
    onPrevChannel: () -> Unit,
    onSelectChannel: (Channel) -> Unit,
    onToggleFavorite: (String) -> Unit,
    onEnterPiP: () -> Unit,
    modifier: Modifier = Modifier,
    autoRetryAttempt: Int = 0,
    maxAutoRetries: Int = 2,
    sleepTimerRemainingMs: Long? = null,
    onRetry: () -> Unit = { playerManager.retry() },
    onHideChannel: (Channel) -> Unit = {},
    onSetSleepTimer: (Int?) -> Unit = {},
    onMinimizeToMiniPlayer: () -> Unit = {},
    previousChannel: Channel? = null,
    onRecallPreviousChannel: () -> Unit = {},
    showOverlayControls: Boolean = true
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    var showControls by remember { mutableStateOf(true) }
    var showSettingsDialog by remember { mutableStateOf(false) }
    var showStreamStats by remember { mutableStateOf(false) }
    var isScreenLocked by remember { mutableStateOf(false) }

    var screenBrightness by remember {
        val currentWindowBrightness = (context as? Activity)?.window?.attributes?.screenBrightness ?: -1f
        mutableStateOf(if (currentWindowBrightness in 0.05f..1.0f) currentWindowBrightness else 0.85f)
    }

    // Gestures HUD & Double-Tap seek state
    var showBrightnessHud by remember { mutableStateOf(false) }
    var showVolumeHud by remember { mutableStateOf(false) }
    var hudJob by remember { mutableStateOf<Job?>(null) }

    var showRewindIndicator by remember { mutableStateOf(false) }
    var showForwardIndicator by remember { mutableStateOf(false) }
    var indicatorJob by remember { mutableStateOf<Job?>(null) }
    var tapJob by remember { mutableStateOf<Job?>(null) }
    var lastTapTime by remember { mutableStateOf(0L) }
    var lastTapPos by remember { mutableStateOf(Offset.Zero) }

    val volume by playerManager.volume.collectAsState()
    val isMuted by playerManager.isMuted.collectAsState()
    val playbackSpeed by playerManager.playbackSpeed.collectAsState()
    val selectedQuality by playerManager.selectedQuality.collectAsState()
    val activeVideoHeight by playerManager.activeVideoHeight.collectAsState()
    val streamStats by playerManager.streamStats.collectAsState()
    val audioTracks by playerManager.audioTracks.collectAsState()
    val dvrState by playerManager.dvrState.collectAsState()
    val effectiveVolume = if (isMuted) 0f else volume

    // Periodically refresh DVR / Live timeline state while player is open
    LaunchedEffect(currentChannel.id, isPlaying, showControls, isBuffering) {
        while (true) {
            playerManager.refreshDvrState()
            delay(500)
        }
    }

    // Auto-dismiss DVR status notice after 3.5 seconds
    LaunchedEffect(dvrState.statusNotice) {
        if (dvrState.statusNotice != null) {
            delay(3500)
            playerManager.clearDvrNotice()
        }
    }

    // Auto-hide controls after 4 seconds of inactivity
    LaunchedEffect(
        showControls,
        isPlaying,
        isBuffering,
        showSettingsDialog,
        effectiveVolume,
        screenBrightness,
        isScreenLocked
    ) {
        if (showControls && isPlaying && !isBuffering && !showSettingsDialog) {
            delay(4000)
            showControls = false
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Black)
            .pointerInput(isScreenLocked) {
                if (isScreenLocked) {
                    awaitEachGesture {
                        awaitFirstDown(requireUnconsumed = false)
                        showControls = true
                    }
                    return@pointerInput
                }

                awaitEachGesture {
                    val down = awaitFirstDown(requireUnconsumed = false)
                    val startX = down.position.x
                    val startY = down.position.y
                    var isDragging = false
                    val screenWidth = size.width
                    val screenHeight = size.height
                    val isLeftHalf = startX < screenWidth * 0.45f
                    val isRightHalf = startX > screenWidth * 0.55f

                    while (true) {
                        val event = awaitPointerEvent()
                        val change = event.changes.firstOrNull() ?: break
                        if (!change.pressed) break

                        val dragY = change.position.y - startY
                        val dragX = change.position.x - startX
                        if (!isDragging && kotlin.math.abs(dragY) > 20f && kotlin.math.abs(dragY) > kotlin.math.abs(dragX) * 1.5f) {
                            isDragging = true
                        }

                        if (isDragging) {
                            change.consume()
                            val deltaY = change.previousPosition.y - change.position.y // Upward drag increases value
                            val deltaNormalized = deltaY / (screenHeight * 0.7f)

                            if (isLeftHalf) {
                                val currentWindowBrightness = (context as? Activity)?.window?.attributes?.screenBrightness ?: 0.85f
                                val base = if (currentWindowBrightness in 0.05f..1.0f) currentWindowBrightness else screenBrightness
                                val newBrightness = (base + deltaNormalized).coerceIn(0.05f, 1.0f)
                                screenBrightness = newBrightness
                                (context as? Activity)?.window?.let { win ->
                                    val params = win.attributes
                                    params.screenBrightness = newBrightness
                                    win.attributes = params
                                }
                                showBrightnessHud = true
                                showVolumeHud = false
                                hudJob?.cancel()
                                hudJob = coroutineScope.launch {
                                    delay(1200)
                                    showBrightnessHud = false
                                }
                            } else if (isRightHalf) {
                                playerManager.adjustVolumeBy(deltaNormalized)
                                showVolumeHud = true
                                showBrightnessHud = false
                                hudJob?.cancel()
                                hudJob = coroutineScope.launch {
                                    delay(1200)
                                    showVolumeHud = false
                                }
                            }
                        }
                    }

                    if (!isDragging) {
                        val now = System.currentTimeMillis()
                        val timeDiff = now - lastTapTime
                        val dist = (down.position - lastTapPos).getDistance()

                        if (timeDiff < 320 && dist < 120f) {
                            // Double Tap detected (YouTube / Netflix style 10s seek)
                            lastTapTime = 0L
                            tapJob?.cancel()
                            if (startX < screenWidth * 0.42f) {
                                playerManager.seekByMs(-10_000L)
                                showRewindIndicator = true
                                showForwardIndicator = false
                                indicatorJob?.cancel()
                                indicatorJob = coroutineScope.launch {
                                    delay(800)
                                    showRewindIndicator = false
                                }
                            } else if (startX > screenWidth * 0.58f) {
                                playerManager.seekByMs(10_000L)
                                showForwardIndicator = true
                                showRewindIndicator = false
                                indicatorJob?.cancel()
                                indicatorJob = coroutineScope.launch {
                                    delay(800)
                                    showForwardIndicator = false
                                }
                            } else {
                                playerManager.togglePlayPause()
                            }
                        } else {
                            // Single Tap detected: toggle player controls overlay
                            lastTapTime = now
                            lastTapPos = down.position
                            tapJob?.cancel()
                            tapJob = coroutineScope.launch {
                                delay(280)
                                showControls = !showControls
                            }
                        }
                    }
                }
            }
    ) {
        // ExoPlayer Surface View
        AndroidView(
            factory = { ctx ->
                PlayerView(ctx).apply {
                    layoutParams = FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )
                    useController = false
                    keepScreenOn = true
                    player = playerManager.getPlayer()
                    this.resizeMode = resizeMode.value
                }
            },
            update = { playerView ->
                playerView.player = playerManager.getPlayer()
                playerView.resizeMode = resizeMode.value
            },
            modifier = Modifier.fillMaxSize()
        )

        // Buffering Spinner when controls are hidden or screen is locked
        if (isBuffering && errorMessage == null && (!showControls || !showOverlayControls || isScreenLocked)) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(46.dp),
                        color = AccentRed,
                        strokeWidth = 3.5.dp
                    )
                    Spacer(modifier = Modifier.height(10.dp))
                    Surface(
                        shape = RoundedCornerShape(14.dp),
                        color = Color.Black.copy(alpha = 0.65f)
                    ) {
                        Text(
                            text = "Loading live stream…",
                            style = MaterialTheme.typography.labelMedium,
                            color = Color.White,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp)
                        )
                    }
                }
            }
        }

        // Floating Stream Stats HUD (when enabled)
        if (showStreamStats && !isScreenLocked) {
            Surface(
                shape = RoundedCornerShape(12.dp),
                color = Color.Black.copy(alpha = 0.8f),
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(start = 16.dp, top = 80.dp)
            ) {
                Column(modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "Live Stream Info",
                            style = MaterialTheme.typography.labelMedium,
                            fontWeight = FontWeight.Bold,
                            color = AccentRed
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(
                            text = "✕",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextSecondary,
                            modifier = Modifier.clickable { showStreamStats = false }
                        )
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    val resText = if (streamStats.width != null && streamStats.height != null) {
                        "${streamStats.width}×${streamStats.height}" +
                                (streamStats.frameRate?.let { " @ ${it}fps" } ?: "")
                    } else {
                        if (isBuffering) "Loading…" else "Detecting…"
                    }
                    Text(
                        text = "Resolution: $resText",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.White
                    )
                    Text(
                        text = "Quality Mode: ${selectedQuality.label}",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color.White.copy(alpha = 0.85f)
                    )
                    val codecInfo = listOfNotNull(
                        streamStats.videoCodec,
                        streamStats.audioCodec,
                        streamStats.bitrateKbps?.let { "${it} kbps" }
                    ).joinToString(" • ")
                    if (codecInfo.isNotEmpty()) {
                        Text(
                            text = "Stream: $codecInfo",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.White.copy(alpha = 0.85f)
                        )
                    }
                    if (streamStats.availableHeights.isNotEmpty()) {
                        Text(
                            text = "Available Tiers: ${streamStats.availableHeights.joinToString(", ") { "${it}p" }}",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color(0xFFFFD166)
                        )
                    }
                }
            }
        }

        // Vertical Swipe Gesture HUD: Brightness
        if (showBrightnessHud) {
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = Color.Black.copy(alpha = 0.75f),
                modifier = Modifier
                    .align(Alignment.CenterStart)
                    .padding(start = 32.dp)
            ) {
                Column(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = Icons.Default.BrightnessMedium,
                        contentDescription = null,
                        tint = Color(0xFFFFD166),
                        modifier = Modifier.size(22.dp)
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "${(screenBrightness * 100).toInt()}%",
                        color = Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // Vertical Swipe Gesture HUD: Volume
        if (showVolumeHud) {
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = Color.Black.copy(alpha = 0.75f),
                modifier = Modifier
                    .align(Alignment.CenterEnd)
                    .padding(end = 32.dp)
            ) {
                Column(
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    val volIcon = when {
                        effectiveVolume == 0f -> Icons.AutoMirrored.Filled.VolumeOff
                        effectiveVolume < 0.5f -> Icons.AutoMirrored.Filled.VolumeDown
                        else -> Icons.AutoMirrored.Filled.VolumeUp
                    }
                    Icon(
                        imageVector = volIcon,
                        contentDescription = null,
                        tint = AccentRed,
                        modifier = Modifier.size(22.dp)
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = "${(effectiveVolume * 100).toInt()}%",
                        color = Color.White,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // Double Tap Rewind Overlay Indicator (Netflix / YouTube Style)
        AnimatedVisibility(
            visible = showRewindIndicator,
            enter = fadeIn() + scaleIn(),
            exit = fadeOut() + scaleOut(),
            modifier = Modifier
                .align(Alignment.CenterStart)
                .padding(start = 64.dp)
        ) {
            Surface(
                shape = CircleShape,
                color = Color.Black.copy(alpha = 0.7f),
                modifier = Modifier.size(80.dp)
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.FastRewind,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(26.dp)
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "10 seconds",
                        color = Color.White,
                        fontSize = 10.5.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // Double Tap Forward Overlay Indicator (Netflix / YouTube Style)
        AnimatedVisibility(
            visible = showForwardIndicator,
            enter = fadeIn() + scaleIn(),
            exit = fadeOut() + scaleOut(),
            modifier = Modifier
                .align(Alignment.CenterEnd)
                .padding(end = 64.dp)
        ) {
            Surface(
                shape = CircleShape,
                color = Color.Black.copy(alpha = 0.7f),
                modifier = Modifier.size(80.dp)
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.FastForward,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(26.dp)
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "10 seconds",
                        color = Color.White,
                        fontSize = 10.5.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        // Error Overlay
        if (errorMessage != null && autoRetryAttempt > 0) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.6f)),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(44.dp),
                        color = AccentRed,
                        strokeWidth = 3.5.dp
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "Reconnecting… ($autoRetryAttempt/$maxAutoRetries)",
                        style = MaterialTheme.typography.titleMedium,
                        color = TextPrimary
                    )
                }
            }
        } else if (errorMessage != null) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black.copy(alpha = 0.85f))
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Warning,
                        contentDescription = null,
                        tint = LiveBadgeRed,
                        modifier = Modifier.size(38.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Stream Unavailable",
                        style = MaterialTheme.typography.titleLarge,
                        color = TextPrimary
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = errorMessage,
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(14.dp))
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Button(
                            onClick = onRetry,
                            colors = ButtonDefaults.buttonColors(containerColor = AccentRed)
                        ) {
                            Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Retry")
                        }
                        Button(
                            onClick = onNextChannel,
                            colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.15f))
                        ) {
                            Icon(Icons.Default.SkipNext, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Next Channel")
                        }
                        Button(
                            onClick = { onHideChannel(currentChannel) },
                            colors = ButtonDefaults.buttonColors(containerColor = Color.White.copy(alpha = 0.15f))
                        ) {
                            Icon(Icons.Default.VisibilityOff, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Hide")
                        }
                    }
                }
            }
        }

        // Interactive Controls Overlay
        AnimatedVisibility(
            visible = showControls && showOverlayControls,
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier.fillMaxSize()
        ) {
            if (isScreenLocked) {
                // Touch-locked overlay: only shows an Unlock pill at the top center
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(top = 24.dp),
                    contentAlignment = Alignment.TopCenter
                ) {
                    Surface(
                        shape = RoundedCornerShape(24.dp),
                        color = Color.Black.copy(alpha = 0.75f),
                        modifier = Modifier
                            .clip(RoundedCornerShape(24.dp))
                            .clickable { isScreenLocked = false }
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.LockOpen,
                                contentDescription = "Unlock Screen",
                                tint = AccentRed,
                                modifier = Modifier.size(18.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Screen Locked • Tap to Unlock",
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }
                }
            } else {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                colors = listOf(
                                    Color.Black.copy(alpha = 0.75f),
                                    Color.Transparent,
                                    Color.Black.copy(alpha = 0.85f)
                                )
                            )
                        )
                ) {
                    // Top Action Bar
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 20.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(
                            onClick = onClose,
                            modifier = Modifier
                                .size(32.dp)
                                .background(Color.Black.copy(alpha = 0.45f), CircleShape)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Close,
                                contentDescription = "Close Player",
                                tint = Color.White,
                                modifier = Modifier.size(16.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(6.dp))

                        // Minimize to Mini-Player
                        IconButton(
                            onClick = onMinimizeToMiniPlayer,
                            modifier = Modifier
                                .size(32.dp)
                                .background(Color.Black.copy(alpha = 0.45f), CircleShape)
                        ) {
                            Icon(
                                imageVector = Icons.Default.KeyboardArrowDown,
                                contentDescription = "Minimize to Mini-Player",
                                tint = Color.White,
                                modifier = Modifier.size(18.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(10.dp))

                        Column(modifier = Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = currentChannel.name,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Box(modifier = Modifier.clickable { playerManager.seekToLiveEdge() }) {
                                    LiveBadge()
                                }
                            }
                            val subText = buildString {
                                append(currentChannel.category)
                                if (activeVideoHeight != null) {
                                    append(" • ${activeVideoHeight}p")
                                }
                            }
                            Text(
                                text = subText,
                                style = MaterialTheme.typography.labelSmall,
                                color = Color.White.copy(alpha = 0.7f)
                            )
                        }

                        // Favorite Pill
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = if (currentChannel.isFavorite) {
                                Color(0xFFFFD166).copy(alpha = 0.25f)
                            } else {
                                Color.Black.copy(alpha = 0.45f)
                            },
                            modifier = Modifier
                                .clip(RoundedCornerShape(16.dp))
                                .clickable { onToggleFavorite(currentChannel.id) }
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = if (currentChannel.isFavorite) Icons.Filled.Star else Icons.Outlined.StarBorder,
                                    contentDescription = "Toggle Favorite",
                                    tint = if (currentChannel.isFavorite) Color(0xFFFFD166) else Color.White,
                                    modifier = Modifier.size(13.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = if (currentChannel.isFavorite) "Favorited" else "Favorite",
                                    fontSize = 11.5.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = if (currentChannel.isFavorite) Color(0xFFFFD166) else Color.White
                                )
                            }
                        }

                        Spacer(modifier = Modifier.width(6.dp))

                        // Quick Quality Badge Pill
                        val qualityBadgeText = when {
                            selectedQuality == VideoQuality.AUTO && activeVideoHeight != null -> "Auto (${activeVideoHeight}p)"
                            selectedQuality.badge != null -> "${selectedQuality.shortLabel} ${selectedQuality.badge}"
                            else -> selectedQuality.shortLabel
                        }
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = if (selectedQuality != VideoQuality.AUTO) {
                                AccentRed.copy(alpha = 0.35f)
                            } else {
                                Color.Black.copy(alpha = 0.45f)
                            },
                            modifier = Modifier
                                .clip(RoundedCornerShape(16.dp))
                                .clickable { showSettingsDialog = true }
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 5.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(
                                    imageVector = Icons.Default.HighQuality,
                                    contentDescription = "Video Quality",
                                    tint = Color.White,
                                    modifier = Modifier.size(14.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = qualityBadgeText,
                                    fontSize = 11.5.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Color.White
                                )
                            }
                        }

                        Spacer(modifier = Modifier.width(6.dp))

                        // Screen Lock Button
                        IconButton(
                            onClick = { isScreenLocked = true },
                            modifier = Modifier
                                .size(32.dp)
                                .background(Color.Black.copy(alpha = 0.45f), CircleShape)
                        ) {
                            Icon(
                                imageVector = Icons.Default.Lock,
                                contentDescription = "Lock Controls",
                                tint = Color.White,
                                modifier = Modifier.size(16.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(6.dp))

                        // Picture in Picture
                        IconButton(
                            onClick = onEnterPiP,
                            modifier = Modifier
                                .size(32.dp)
                                .background(Color.Black.copy(alpha = 0.45f), CircleShape)
                        ) {
                            Icon(
                                imageVector = Icons.Default.PictureInPictureAlt,
                                contentDescription = "Picture in Picture",
                                tint = Color.White,
                                modifier = Modifier.size(16.dp)
                            )
                        }

                        Spacer(modifier = Modifier.width(6.dp))

                        // Settings (Gear) Button -> Opens Netflix/YouTube style playback settings sheet
                        IconButton(
                            onClick = { showSettingsDialog = true },
                            modifier = Modifier
                                .size(32.dp)
                                .background(
                                    if (showSettingsDialog) AccentRed.copy(alpha = 0.6f) else Color.Black.copy(alpha = 0.45f),
                                    CircleShape
                                )
                        ) {
                            Icon(
                                imageVector = Icons.Default.Settings,
                                contentDescription = "Playback Settings",
                                tint = Color.White,
                                modifier = Modifier.size(17.dp)
                            )
                        }
                    }

                    // Center Playback Controls (Prev, -10s Rewind, Play/Pause with Loading Spinner, +10s Forward, Next)
                    if (errorMessage == null) {
                        Column(
                            modifier = Modifier.align(Alignment.Center),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(24.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // Previous Channel
                                IconButton(
                                    onClick = onPrevChannel,
                                    modifier = Modifier
                                        .size(34.dp)
                                        .background(Color.Black.copy(alpha = 0.28f), CircleShape)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.SkipPrevious,
                                        contentDescription = "Previous Channel",
                                        tint = Color.White,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }

                                // Rewind 10s Button
                                Surface(
                                    shape = CircleShape,
                                    color = Color.Black.copy(alpha = 0.28f),
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .clickable {
                                            playerManager.seekByMs(-10_000L)
                                            showRewindIndicator = true
                                            showForwardIndicator = false
                                            indicatorJob?.cancel()
                                            indicatorJob = coroutineScope.launch {
                                                delay(800)
                                                showRewindIndicator = false
                                            }
                                        }
                                ) {
                                    Column(
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        verticalArrangement = Arrangement.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.FastRewind,
                                            contentDescription = "Rewind 10s",
                                            tint = Color.White,
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Text(
                                            text = "10s",
                                            fontSize = 8.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color.White
                                        )
                                    }
                                }

                                // Center Play/Pause Button: displays active loading spinner when stream is buffering!
                                IconButton(
                                    onClick = { playerManager.togglePlayPause() },
                                    modifier = Modifier
                                        .size(46.dp)
                                        .background(AccentRed.copy(alpha = 0.95f), CircleShape)
                                ) {
                                    if (isBuffering) {
                                        CircularProgressIndicator(
                                            modifier = Modifier.size(22.dp),
                                            color = Color.White,
                                            strokeWidth = 2.dp
                                        )
                                    } else {
                                        Icon(
                                            imageVector = if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow,
                                            contentDescription = if (isPlaying) "Pause" else "Play",
                                            tint = Color.White,
                                            modifier = Modifier.size(24.dp)
                                        )
                                    }
                                }

                                // Fast-Forward 10s Button
                                Surface(
                                    shape = CircleShape,
                                    color = Color.Black.copy(alpha = 0.28f),
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .clickable {
                                            playerManager.seekByMs(10_000L)
                                            showForwardIndicator = true
                                            showRewindIndicator = false
                                            indicatorJob?.cancel()
                                            indicatorJob = coroutineScope.launch {
                                                delay(800)
                                                showForwardIndicator = false
                                            }
                                        }
                                ) {
                                    Column(
                                        horizontalAlignment = Alignment.CenterHorizontally,
                                        verticalArrangement = Arrangement.Center
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.FastForward,
                                            contentDescription = "Forward 10s",
                                            tint = if (dvrState.isAtLiveEdge && dvrState.catchUpMinutesAgo == 0)
                                                Color.White.copy(alpha = 0.45f)
                                            else Color.White,
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Text(
                                            text = "10s",
                                            fontSize = 8.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = if (dvrState.isAtLiveEdge && dvrState.catchUpMinutesAgo == 0)
                                                Color.White.copy(alpha = 0.45f)
                                            else Color.White
                                        )
                                    }
                                }

                                // Next Channel
                                IconButton(
                                    onClick = onNextChannel,
                                    modifier = Modifier
                                        .size(34.dp)
                                        .background(Color.Black.copy(alpha = 0.28f), CircleShape)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.SkipNext,
                                        contentDescription = "Next Channel",
                                        tint = Color.White,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }

                            if (isBuffering) {
                                Spacer(modifier = Modifier.height(10.dp))
                                Surface(
                                    shape = RoundedCornerShape(14.dp),
                                    color = Color.Black.copy(alpha = 0.65f)
                                ) {
                                    Text(
                                        text = "Loading stream…",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = Color.White,
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                                    )
                                }
                            }

                            if (dvrState.statusNotice != null) {
                                Spacer(modifier = Modifier.height(8.dp))
                                Surface(
                                    shape = RoundedCornerShape(14.dp),
                                    color = Color(0xFF1F1F1F).copy(alpha = 0.9f)
                                ) {
                                    Text(
                                        text = dvrState.statusNotice ?: "",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = Color(0xFFFFD166),
                                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                                    )
                                }
                            }
                        }
                    }

                    // Bottom Live DVR Scrubber + Volume Control + Channel Quick Switcher Strip
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .align(Alignment.BottomCenter)
                            .padding(bottom = 14.dp)
                    ) {
                        // Live DVR Timeline Scrubber & Quick Catch-Up Bar
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 2.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            val isBehind = !dvrState.isAtLiveEdge || dvrState.catchUpMinutesAgo > 0
                            Surface(
                                shape = RoundedCornerShape(12.dp),
                                color = if (isBehind) Color(0xFFFFD166).copy(alpha = 0.25f) else LiveBadgeRed.copy(alpha = 0.85f),
                                modifier = Modifier
                                    .clip(RoundedCornerShape(12.dp))
                                    .clickable { playerManager.seekToLiveEdge() }
                            ) {
                                val badgeLabel = when {
                                    dvrState.catchUpMinutesAgo > 0 ->
                                        "⏪ -${dvrState.catchUpMinutesAgo}m (-${formatRemaining(dvrState.behindLiveMs)})"
                                    !dvrState.isAtLiveEdge ->
                                        "⏪ -${formatRemaining(dvrState.behindLiveMs)}"
                                    else -> "● LIVE"
                                }
                                Text(
                                    text = badgeLabel,
                                    fontSize = 10.5.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isBehind) Color(0xFFFFD166) else Color.White,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                )
                            }

                            // Interactive DVR Timeline Slider
                            if (dvrState.isSeekable && dvrState.durationMs > 5_000L) {
                                val safeDuration = dvrState.durationMs.coerceAtLeast(1L).toFloat()
                                val safePos = dvrState.currentPositionMs.coerceIn(0L, dvrState.durationMs).toFloat()
                                Slider(
                                    value = safePos,
                                    onValueChange = { newPos ->
                                        playerManager.seekToPositionMs(newPos.toLong())
                                    },
                                    valueRange = 0f..safeDuration,
                                    colors = SliderDefaults.colors(
                                        thumbColor = if (isBehind) Color(0xFFFFD166) else AccentRed,
                                        activeTrackColor = if (isBehind) Color(0xFFFFD166) else AccentRed,
                                        inactiveTrackColor = Color.White.copy(alpha = 0.28f)
                                    ),
                                    modifier = Modifier
                                        .weight(1f)
                                        .height(18.dp)
                                )
                                Text(
                                    text = "-${formatRemaining(dvrState.durationMs)}",
                                    fontSize = 10.5.sp,
                                    color = Color.White.copy(alpha = 0.7f)
                                )
                            } else {
                                Spacer(modifier = Modifier.weight(1f))
                            }

                            // Quick Catch-Up Pills: -15m, -30m, -1h, GO LIVE
                            listOf(15 to "-15m", 30 to "-30m", 60 to "-1h").forEach { (mins, label) ->
                                val active = dvrState.catchUpMinutesAgo == mins
                                Surface(
                                    shape = RoundedCornerShape(12.dp),
                                    color = if (active) AccentRed else Color.Black.copy(alpha = 0.6f),
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(12.dp))
                                        .clickable { playerManager.startCatchUp(mins) }
                                ) {
                                    Text(
                                        text = label,
                                        fontSize = 10.5.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Color.White,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                    )
                                }
                            }

                            if (isBehind) {
                                Surface(
                                    shape = RoundedCornerShape(12.dp),
                                    color = AccentRed,
                                    modifier = Modifier
                                        .clip(RoundedCornerShape(12.dp))
                                        .clickable { playerManager.seekToLiveEdge() }
                                ) {
                                    Text(
                                        text = "GO LIVE",
                                        fontSize = 10.5.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                    )
                                }
                            }
                        }

                        // Volume Control Row + Quick Switch Header
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 2.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    text = "Quick Switch Channel",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = Color.White.copy(alpha = 0.8f)
                                )

                                if (previousChannel != null && previousChannel.id != currentChannel.id) {
                                    Surface(
                                        shape = RoundedCornerShape(12.dp),
                                        color = Color.Black.copy(alpha = 0.65f),
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(12.dp))
                                            .clickable { onRecallPreviousChannel() }
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.History,
                                                contentDescription = "Recall Previous Channel",
                                                tint = Color(0xFFFFD166),
                                                modifier = Modifier.size(12.dp)
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(
                                                text = "Recall: ${previousChannel.name}",
                                                fontSize = 10.5.sp,
                                                fontWeight = FontWeight.SemiBold,
                                                color = Color.White,
                                                maxLines = 1,
                                                overflow = TextOverflow.Ellipsis
                                            )
                                        }
                                    }
                                }
                            }

                            // Brightness + Volume Sliders Row
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // Brightness Control Pill
                                Surface(
                                    shape = RoundedCornerShape(16.dp),
                                    color = Color.Black.copy(alpha = 0.6f)
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.BrightnessMedium,
                                            contentDescription = "Brightness",
                                            tint = Color(0xFFFFD166),
                                            modifier = Modifier.size(14.dp)
                                        )
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Slider(
                                            value = screenBrightness,
                                            onValueChange = { newVal ->
                                                val clamped = newVal.coerceIn(0.1f, 1.0f)
                                                screenBrightness = clamped
                                                (context as? Activity)?.window?.let { win ->
                                                    val params = win.attributes
                                                    params.screenBrightness = clamped
                                                    win.attributes = params
                                                }
                                            },
                                            valueRange = 0.1f..1.0f,
                                            colors = SliderDefaults.colors(
                                                thumbColor = Color(0xFFFFD166),
                                                activeTrackColor = Color(0xFFFFD166),
                                                inactiveTrackColor = Color.White.copy(alpha = 0.3f)
                                            ),
                                            modifier = Modifier
                                                .width(78.dp)
                                                .height(20.dp)
                                        )
                                    }
                                }

                                // Volume Control Pill
                                Surface(
                                    shape = RoundedCornerShape(16.dp),
                                    color = Color.Black.copy(alpha = 0.6f)
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 7.dp, vertical = 2.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        IconButton(
                                            onClick = { playerManager.toggleMute() },
                                            modifier = Modifier.size(24.dp)
                                        ) {
                                            val volumeIcon = when {
                                                effectiveVolume == 0f -> Icons.AutoMirrored.Filled.VolumeOff
                                                effectiveVolume < 0.5f -> Icons.AutoMirrored.Filled.VolumeDown
                                                else -> Icons.AutoMirrored.Filled.VolumeUp
                                            }
                                            Icon(
                                                imageVector = volumeIcon,
                                                contentDescription = if (isMuted) "Unmute" else "Mute",
                                                tint = if (effectiveVolume == 0f) LiveBadgeRed else Color.White,
                                                modifier = Modifier.size(15.dp)
                                            )
                                        }

                                        Slider(
                                            value = effectiveVolume,
                                            onValueChange = { playerManager.setVolume(it) },
                                            valueRange = 0f..1f,
                                            colors = SliderDefaults.colors(
                                                thumbColor = AccentRed,
                                                activeTrackColor = AccentRed,
                                                inactiveTrackColor = Color.White.copy(alpha = 0.3f)
                                            ),
                                            modifier = Modifier
                                                .width(80.dp)
                                                .height(20.dp)
                                        )

                                        Spacer(modifier = Modifier.width(3.dp))

                                        Text(
                                            text = "${(effectiveVolume * 100).toInt()}%",
                                            fontSize = 10.5.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color.White,
                                            modifier = Modifier.width(30.dp),
                                            textAlign = TextAlign.End
                                        )
                                    }
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(4.dp))

                        // Quick Switch Channel Carousel
                        LazyRow(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            item { Spacer(modifier = Modifier.width(8.dp)) }
                            items(channelsList, key = { it.id }) { ch ->
                                val isCurrent = ch.id == currentChannel.id
                                Surface(
                                    shape = RoundedCornerShape(8.dp),
                                    color = if (isCurrent) AccentRed else Color.Black.copy(alpha = 0.6f),
                                    modifier = Modifier.clickable { onSelectChannel(ch) }
                                ) {
                                    Row(
                                        modifier = Modifier.padding(horizontal = 9.dp, vertical = 4.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        if (ch.isFavorite) {
                                            Icon(
                                                imageVector = Icons.Filled.Star,
                                                contentDescription = "Favorite",
                                                tint = Color(0xFFFFD166),
                                                modifier = Modifier.size(12.dp)
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                        }
                                        Text(
                                            text = ch.name,
                                            color = Color.White,
                                            fontSize = 11.sp,
                                            fontWeight = if (isCurrent) FontWeight.Bold else FontWeight.Normal
                                        )
                                    }
                                }
                            }
                            item { Spacer(modifier = Modifier.width(8.dp)) }
                        }
                    }
                }
            }
        }

        // Netflix / YouTube Style Playback Settings Modal Dialog
        if (showSettingsDialog) {
            PlayerSettingsDialog(
                selectedQuality = selectedQuality,
                activeVideoHeight = activeVideoHeight,
                onSelectQuality = { playerManager.setVideoQuality(it) },
                playbackSpeed = playbackSpeed,
                onSelectSpeed = { playerManager.setPlaybackSpeed(it) },
                dvrState = dvrState,
                onStartCatchUp = { playerManager.startCatchUp(it) },
                sleepTimerRemainingMs = sleepTimerRemainingMs,
                onSetSleepTimer = onSetSleepTimer,
                audioTracks = audioTracks,
                onSelectAudioTrack = { playerManager.selectAudioTrack(it) },
                resizeMode = resizeMode,
                onSelectResizeMode = { playerManager.cycleResizeMode() },
                showStreamStats = showStreamStats,
                onToggleStreamStats = { showStreamStats = !showStreamStats },
                onLockScreen = { isScreenLocked = true },
                onDismiss = { showSettingsDialog = false }
            )
        }
    }
}
