package com.example.livetv.ui.components

import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
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
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.livetv.data.Channel
import com.example.livetv.data.LiveEvent
import com.example.livetv.data.SampleLiveEvents
import com.example.livetv.ui.theme.AccentRed
import com.example.livetv.ui.theme.DarkSurface
import com.example.livetv.ui.theme.DarkSurfaceVariant
import com.example.livetv.ui.theme.TextPrimary
import com.example.livetv.ui.theme.TextSecondary

@Composable
fun LiveEventsSection(
    channels: List<Channel>,
    onSelectChannel: (Channel) -> Unit,
    liveEvents: List<LiveEvent> = emptyList(),
    isLoading: Boolean = false,
    modifier: Modifier = Modifier
) {
    var selectedSportFilter by remember { mutableStateOf("All") }
    val sportTabs = listOf("All", "Cricket", "Tennis", "MotoGP", "Football")

    val filteredEvents = remember(liveEvents, selectedSportFilter) {
        if (selectedSportFilter == "All") {
            liveEvents
        } else {
            liveEvents.filter { it.sport.equals(selectedSportFilter, ignoreCase = true) }
        }
    }

    // Do not show the section if no live events and not loading (zero fake mock items)
    if (filteredEvents.isEmpty() && !isLoading && liveEvents.isEmpty()) {
        return
    }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
    ) {
        // Section Header Row
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "🔥",
                    fontSize = 15.sp
                )
                Spacer(modifier = Modifier.width(6.dp))
                Text(
                    text = "LIVE SPORTS EVENTS",
                    style = MaterialTheme.typography.labelLarge,
                    color = TextPrimary,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 0.5.sp
                )
                Spacer(modifier = Modifier.width(6.dp))
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Color(0x2634C759)
                ) {
                    Text(
                        text = "REAL-TIME",
                        color = Color(0xFF34C759),
                        fontSize = 8.5.sp,
                        fontWeight = FontWeight.Black,
                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                    )
                }
            }

            // Sport Filter Tabs
            Row(
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                sportTabs.forEach { tab ->
                    val isSelected = tab == selectedSportFilter
                    val label = when (tab) {
                        "Cricket" -> "🏏"
                        "Tennis" -> "🎾"
                        "MotoGP" -> "🏍️"
                        "Football" -> "⚽"
                        else -> "All"
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .background(if (isSelected) AccentRed.copy(alpha = 0.85f) else DarkSurfaceVariant)
                            .clickable { selectedSportFilter = tab }
                            .padding(horizontal = 7.dp, vertical = 3.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = label,
                            fontSize = 11.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                            color = if (isSelected) Color.White else TextSecondary
                        )
                    }
                }
            }
        }

        // Live Events Horizontal Carousel
        if (filteredEvents.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 10.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = if (isLoading) "Connecting to live sports feeds..." else "No active matches for $selectedSportFilter right now",
                    color = TextSecondary,
                    fontSize = 12.sp
                )
            }
        } else {
            LazyRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 4.dp, bottom = 6.dp),
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(filteredEvents, key = { it.id }) { event ->
                    LiveEventCard(
                        event = event,
                        onClick = {
                            if (!event.streamUrl.isNullOrBlank()) {
                                val directChannel = Channel(
                                    id = event.id,
                                    name = "${event.sportEmoji} ${event.title}".trim(),
                                    category = event.sport,
                                    country = "Live Sports",
                                    streamUrl = event.streamUrl,
                                    logoUrl = ""
                                )
                                onSelectChannel(directChannel)
                                return@LiveEventCard
                            }
                            val targetChannel = channels.find { it.id == event.targetChannelId }
                                ?: channels.find { it.name.contains(event.targetChannelName, ignoreCase = true) }
                                ?: channels.find { it.category.equals(event.sport, ignoreCase = true) }
                                ?: channels.find { it.name.contains(event.sport, ignoreCase = true) }
                            if (targetChannel != null) {
                                onSelectChannel(targetChannel)
                            }
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun LiveEventCard(
    event: LiveEvent,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val dotAlpha by infiniteTransition.animateFloat(
        initialValue = 0.35f,
        targetValue = 1.0f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 800),
            repeatMode = RepeatMode.Reverse
        ),
        label = "dotAlpha"
    )

    Surface(
        shape = RoundedCornerShape(14.dp),
        color = Color(0xFF18181D),
        modifier = modifier
            .width(280.dp)
            .clip(RoundedCornerShape(14.dp))
            .border(1.dp, Color.White.copy(alpha = 0.08f), RoundedCornerShape(14.dp))
            .clickable { onClick() }
    ) {
        Box(
            modifier = Modifier
                .background(
                    Brush.verticalGradient(
                        colors = listOf(
                            Color(0xFF22222B),
                            Color(0xFF141418)
                        )
                    )
                )
                .padding(12.dp)
        ) {
            Column {
                // Top Tag Row: Sport + Status Pill
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(text = event.sportEmoji, fontSize = 13.sp)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = event.sport.uppercase(),
                            style = MaterialTheme.typography.labelSmall,
                            color = TextSecondary,
                            fontWeight = FontWeight.Bold,
                            fontSize = 10.sp
                        )
                    }

                    // Pulsing LIVE Badge
                    Row(
                        modifier = Modifier
                            .clip(RoundedCornerShape(8.dp))
                            .background(AccentRed.copy(alpha = 0.18f))
                            .padding(horizontal = 6.dp, vertical = 2.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .clip(CircleShape)
                                .background(AccentRed.copy(alpha = dotAlpha))
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = event.statusText,
                            fontSize = 9.sp,
                            fontWeight = FontWeight.Black,
                            color = AccentRed
                        )
                    }
                }

                Spacer(modifier = Modifier.height(6.dp))

                // Event Title
                Text(
                    text = event.title,
                    style = MaterialTheme.typography.titleSmall,
                    color = TextPrimary,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                // Subtitle (Series / League)
                if (event.subtitle.isNotBlank()) {
                    Text(
                        text = event.subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary,
                        fontSize = 10.5.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                // Match Time in BST (Bangladesh Standard Time)
                if (!event.bstTime.isNullOrBlank()) {
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "🕒 ${event.bstTime}",
                        color = Color(0xFF5AC8FA),
                        fontWeight = FontWeight.Bold,
                        fontSize = 10.5.sp
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                // Score / Detail (Runs, Overs, Goal Score)
                Text(
                    text = event.scoreOrDetail,
                    style = MaterialTheme.typography.bodySmall,
                    color = Color(0xFF4CD964),
                    fontWeight = FontWeight.Bold,
                    fontSize = 11.5.sp,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )

                // Match Summary / Situation
                if (!event.summary.isNullOrBlank()) {
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "📢 ${event.summary}",
                        color = Color(0xFFFF9F0A),
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 10.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                // Bottom Row: Target Channel + Watch Live Button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "📺 ${event.targetChannelName}",
                        style = MaterialTheme.typography.labelSmall,
                        color = TextSecondary,
                        fontSize = 11.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f, fill = false)
                    )

                    Spacer(modifier = Modifier.width(6.dp))

                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = AccentRed,
                        modifier = Modifier.clip(RoundedCornerShape(12.dp))
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.PlayArrow,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(12.dp)
                            )
                            Spacer(modifier = Modifier.width(2.dp))
                            Text(
                                text = "WATCH",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Black,
                                color = Color.White
                            )
                        }
                    }
                }
            }
        }
    }
}

