package com.example.livetv.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.AspectRatio
import androidx.compose.material.icons.filled.Bedtime
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.HighQuality
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Language
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Speed
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.SwitchDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.livetv.player.AudioTrackOption
import com.example.livetv.player.DvrState
import com.example.livetv.player.ResizeMode
import com.example.livetv.player.VideoQuality
import com.example.livetv.ui.theme.AccentRed
import com.example.livetv.ui.theme.DarkSurface
import com.example.livetv.ui.theme.DarkSurfaceVariant
import com.example.livetv.ui.theme.TextPrimary
import com.example.livetv.ui.theme.TextSecondary

private enum class SettingsSection {
    MAIN,
    QUALITY,
    SPEED,
    DVR,
    SLEEP,
    AUDIO,
    ASPECT_RATIO
}

@Composable
fun PlayerSettingsDialog(
    selectedQuality: VideoQuality,
    activeVideoHeight: Int?,
    onSelectQuality: (VideoQuality) -> Unit,
    playbackSpeed: Float,
    onSelectSpeed: (Float) -> Unit,
    dvrState: DvrState,
    onStartCatchUp: (Int) -> Unit,
    sleepTimerRemainingMs: Long?,
    onSetSleepTimer: (Int?) -> Unit,
    audioTracks: List<AudioTrackOption>,
    onSelectAudioTrack: (AudioTrackOption) -> Unit,
    resizeMode: ResizeMode,
    onSelectResizeMode: (ResizeMode) -> Unit,
    showStreamStats: Boolean,
    onToggleStreamStats: () -> Unit,
    onLockScreen: () -> Unit,
    onDismiss: () -> Unit
) {
    var currentSection by remember { mutableStateOf(SettingsSection.MAIN) }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = DarkSurface,
        shape = RoundedCornerShape(16.dp),
        title = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (currentSection != SettingsSection.MAIN) {
                        IconButton(
                            onClick = { currentSection = SettingsSection.MAIN },
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(
                                imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                contentDescription = "Back",
                                tint = TextPrimary,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(6.dp))
                    } else {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .clip(CircleShape)
                                .background(AccentRed.copy(alpha = 0.2f)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.Settings,
                                contentDescription = null,
                                tint = AccentRed,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(10.dp))
                    }
                    Text(
                        text = when (currentSection) {
                            SettingsSection.MAIN -> "Playback Settings"
                            SettingsSection.QUALITY -> "Video Quality"
                            SettingsSection.SPEED -> "Playback Speed"
                            SettingsSection.DVR -> "Live Catch-Up / Rewind"
                            SettingsSection.SLEEP -> "Sleep Timer"
                            SettingsSection.AUDIO -> "Audio Track"
                            SettingsSection.ASPECT_RATIO -> "Aspect Ratio"
                        },
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                }
                IconButton(onClick = onDismiss, modifier = Modifier.size(32.dp)) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Close",
                        tint = TextSecondary,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        },
        text = {
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 420.dp),
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                when (currentSection) {
                    SettingsSection.MAIN -> {
                        // Quality option
                        item {
                            val qualityText = if (selectedQuality == VideoQuality.AUTO && activeVideoHeight != null) {
                                "Auto (${activeVideoHeight}p)"
                            } else {
                                selectedQuality.label
                            }
                            SettingItemRow(
                                icon = Icons.Default.HighQuality,
                                title = "Video Quality",
                                subtitle = qualityText,
                                onClick = { currentSection = SettingsSection.QUALITY }
                            )
                        }

                        // Playback speed
                        item {
                            val speedText = if (playbackSpeed == 1.0f) "Normal (1.0x)" else "${playbackSpeed}x"
                            SettingItemRow(
                                icon = Icons.Default.Speed,
                                title = "Playback Speed",
                                subtitle = speedText,
                                onClick = { currentSection = SettingsSection.SPEED }
                            )
                        }

                        // Live Catch-Up / DVR
                        item {
                            val dvrText = when {
                                dvrState.catchUpMinutesAgo > 0 -> "-${dvrState.catchUpMinutesAgo}m ago"
                                !dvrState.isAtLiveEdge -> "Rewound (-${(dvrState.behindLiveMs + 999) / 1000 / 60}m)"
                                else -> "Live broadcast"
                            }
                            SettingItemRow(
                                icon = Icons.Default.History,
                                title = "Live Catch-Up (1-Hour DVR)",
                                subtitle = dvrText,
                                onClick = { currentSection = SettingsSection.DVR }
                            )
                        }

                        // Sleep timer
                        item {
                            val sleepText = if (sleepTimerRemainingMs != null) {
                                val mins = (sleepTimerRemainingMs + 59_999) / 60_000
                                "$mins min remaining"
                            } else {
                                "Off"
                            }
                            SettingItemRow(
                                icon = Icons.Default.Bedtime,
                                title = "Sleep Timer",
                                subtitle = sleepText,
                                onClick = { currentSection = SettingsSection.SLEEP }
                            )
                        }

                        // Audio track selector (if multiple tracks)
                        if (audioTracks.size > 1) {
                            item {
                                val selectedTrack = audioTracks.firstOrNull { it.isSelected }?.label ?: "Default"
                                SettingItemRow(
                                    icon = Icons.Default.Language,
                                    title = "Audio Language",
                                    subtitle = selectedTrack,
                                    onClick = { currentSection = SettingsSection.AUDIO }
                                )
                            }
                        }

                        // Aspect ratio
                        item {
                            val aspectText = when (resizeMode) {
                                ResizeMode.FIT -> "Fit (Original 16:9)"
                                ResizeMode.FILL -> "Fill (Stretch to Screen)"
                                ResizeMode.ZOOM -> "Zoom (Crop Borders)"
                            }
                            SettingItemRow(
                                icon = Icons.Default.AspectRatio,
                                title = "Aspect Ratio",
                                subtitle = aspectText,
                                onClick = { currentSection = SettingsSection.ASPECT_RATIO }
                            )
                        }

                        item {
                            HorizontalDivider(
                                color = Color.White.copy(alpha = 0.1f),
                                modifier = Modifier.padding(vertical = 4.dp)
                            )
                        }

                        // Stream stats toggle
                        item {
                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = DarkSurfaceVariant,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 12.dp, vertical = 8.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Default.Info,
                                            contentDescription = null,
                                            tint = if (showStreamStats) AccentRed else TextSecondary,
                                            modifier = Modifier.size(20.dp)
                                        )
                                        Spacer(modifier = Modifier.width(12.dp))
                                        Column {
                                            Text(
                                                text = "Stats for Nerds",
                                                style = MaterialTheme.typography.bodyMedium,
                                                fontWeight = FontWeight.SemiBold,
                                                color = TextPrimary
                                            )
                                            Text(
                                                text = "Bitrate, resolution, codec HUD",
                                                style = MaterialTheme.typography.labelSmall,
                                                color = TextSecondary
                                            )
                                        }
                                    }
                                    Switch(
                                        checked = showStreamStats,
                                        onCheckedChange = { onToggleStreamStats() },
                                        colors = SwitchDefaults.colors(
                                            checkedThumbColor = Color.White,
                                            checkedTrackColor = AccentRed
                                        )
                                    )
                                }
                            }
                        }

                        // Lock screen controls
                        item {
                            SettingItemRow(
                                icon = Icons.Default.Lock,
                                title = "Lock Controls",
                                subtitle = "Prevent accidental taps on player",
                                onClick = {
                                    onLockScreen()
                                    onDismiss()
                                }
                            )
                        }
                    }

                    SettingsSection.QUALITY -> {
                        items(VideoQuality.entries.size) { idx ->
                            val quality = VideoQuality.entries[idx]
                            val isSelected = quality == selectedQuality
                            val displayLabel = if (quality == VideoQuality.AUTO && activeVideoHeight != null) {
                                "Auto (${activeVideoHeight}p)"
                            } else {
                                quality.label
                            }
                            SelectableItemRow(
                                title = displayLabel,
                                badge = quality.badge,
                                isSelected = isSelected,
                                onClick = {
                                    onSelectQuality(quality)
                                    currentSection = SettingsSection.MAIN
                                }
                            )
                        }
                    }

                    SettingsSection.SPEED -> {
                        val speeds = listOf(0.5f, 0.75f, 1.0f, 1.25f, 1.5f, 2.0f)
                        items(speeds.size) { idx ->
                            val speed = speeds[idx]
                            val isSelected = speed == playbackSpeed
                            val label = if (speed == 1.0f) "Normal (1.0x)" else "${speed}x"
                            SelectableItemRow(
                                title = label,
                                badge = null,
                                isSelected = isSelected,
                                onClick = {
                                    onSelectSpeed(speed)
                                    currentSection = SettingsSection.MAIN
                                }
                            )
                        }
                    }

                    SettingsSection.DVR -> {
                        val options = listOf(
                            0 to "Live Edge (Now)",
                            5 to "5 mins ago (-5m)",
                            15 to "15 mins ago (-15m)",
                            30 to "30 mins ago (-30m)",
                            60 to "1 hour ago (-1h)"
                        )
                        items(options.size) { idx ->
                            val (mins, label) = options[idx]
                            val isSelected = if (mins == 0) {
                                dvrState.catchUpMinutesAgo == 0 && dvrState.isAtLiveEdge
                            } else {
                                dvrState.catchUpMinutesAgo == mins
                            }
                            SelectableItemRow(
                                title = label,
                                badge = if (mins == 0) "LIVE" else null,
                                isSelected = isSelected,
                                onClick = {
                                    onStartCatchUp(mins)
                                    currentSection = SettingsSection.MAIN
                                }
                            )
                        }
                    }

                    SettingsSection.SLEEP -> {
                        val timers = listOf(
                            null to "Off",
                            15 to "15 minutes",
                            30 to "30 minutes",
                            45 to "45 minutes",
                            60 to "1 hour",
                            90 to "1 hour 30 mins",
                            120 to "2 hours"
                        )
                        items(timers.size) { idx ->
                            val (mins, label) = timers[idx]
                            val isSelected = if (mins == null) sleepTimerRemainingMs == null else {
                                val remainingMins = (sleepTimerRemainingMs ?: 0L) / 60_000
                                remainingMins in (mins - 2)..mins
                            }
                            SelectableItemRow(
                                title = label,
                                badge = null,
                                isSelected = isSelected,
                                onClick = {
                                    onSetSleepTimer(mins)
                                    currentSection = SettingsSection.MAIN
                                }
                            )
                        }
                    }

                    SettingsSection.AUDIO -> {
                        items(audioTracks.size) { idx ->
                            val track = audioTracks[idx]
                            SelectableItemRow(
                                title = track.label,
                                badge = null,
                                isSelected = track.isSelected,
                                onClick = {
                                    onSelectAudioTrack(track)
                                    currentSection = SettingsSection.MAIN
                                }
                            )
                        }
                    }

                    SettingsSection.ASPECT_RATIO -> {
                        val modes = listOf(
                            ResizeMode.FIT to "Fit (Original 16:9)",
                            ResizeMode.FILL to "Fill (Stretch)",
                            ResizeMode.ZOOM to "Zoom (Crop)"
                        )
                        items(modes.size) { idx ->
                            val (mode, label) = modes[idx]
                            val isSelected = mode == resizeMode
                            SelectableItemRow(
                                title = label,
                                badge = null,
                                isSelected = isSelected,
                                onClick = {
                                    onSelectResizeMode(mode)
                                    currentSection = SettingsSection.MAIN
                                }
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = onDismiss,
                colors = ButtonDefaults.buttonColors(containerColor = AccentRed),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Close")
            }
        }
    )
}

@Composable
private fun SettingItemRow(
    icon: ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Surface(
        shape = RoundedCornerShape(10.dp),
        color = DarkSurfaceVariant,
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 9.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = TextPrimary,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.labelSmall,
                    color = AccentRed
                )
            }
            Text(
                text = "›",
                fontSize = 18.sp,
                color = TextSecondary,
                fontWeight = FontWeight.Bold
            )
        }
    }
}

@Composable
private fun SelectableItemRow(
    title: String,
    badge: String?,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Surface(
        shape = RoundedCornerShape(10.dp),
        color = if (isSelected) AccentRed.copy(alpha = 0.2f) else DarkSurfaceVariant,
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(10.dp))
            .clickable(onClick = onClick)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 12.dp, vertical = 9.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier.width(28.dp),
                contentAlignment = Alignment.CenterStart
            ) {
                if (isSelected) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = "Selected",
                        tint = AccentRed,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
            Text(
                text = title,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                color = if (isSelected) AccentRed else TextPrimary,
                modifier = Modifier.weight(1f)
            )
            if (badge != null) {
                Surface(
                    shape = RoundedCornerShape(4.dp),
                    color = AccentRed.copy(alpha = 0.3f),
                    modifier = Modifier.padding(start = 6.dp)
                ) {
                    Text(
                        text = badge,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp)
                    )
                }
            }
        }
    }
}

