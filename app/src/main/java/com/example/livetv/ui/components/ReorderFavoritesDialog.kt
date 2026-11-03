package com.example.livetv.ui.components

import androidx.compose.foundation.background
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
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material.icons.filled.LiveTv
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.VerticalAlignTop
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.example.livetv.data.Channel
import com.example.livetv.ui.theme.AccentRed
import com.example.livetv.ui.theme.DarkSurface
import com.example.livetv.ui.theme.DarkSurfaceVariant
import com.example.livetv.ui.theme.TextPrimary
import com.example.livetv.ui.theme.TextSecondary

@Composable
fun ReorderFavoritesDialog(
    favoriteChannels: List<Channel>,
    onMoveUp: (String) -> Unit,
    onMoveDown: (String) -> Unit,
    onMoveToTop: (String) -> Unit,
    onResetOrder: () -> Unit,
    onDismiss: () -> Unit
) {
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
                    Box(
                        modifier = Modifier
                            .size(34.dp)
                            .clip(CircleShape)
                            .background(Color(0xFFFFD166).copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Star,
                            contentDescription = null,
                            tint = Color(0xFFFFD166),
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(
                            text = "Rank Favorite Channels",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Text(
                            text = "Ranked channels appear first in player Quick Switch",
                            style = MaterialTheme.typography.labelSmall,
                            color = TextSecondary
                        )
                    }
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
            if (favoriteChannels.isEmpty()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(24.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No favorites to rank yet. Star some channels first!",
                        color = TextSecondary,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 420.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    itemsIndexed(favoriteChannels, key = { _, ch -> ch.id }) { index, channel ->
                        val isFirst = index == 0
                        val isLast = index == favoriteChannels.size - 1

                        Surface(
                            shape = RoundedCornerShape(10.dp),
                            color = DarkSurfaceVariant,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 10.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                // Rank Pill Badge (#1, #2, #3, ...)
                                val rankBg = when (index) {
                                    0 -> Color(0xFFFFD166)
                                    1 -> Color(0xFFC0C0C0)
                                    2 -> Color(0xFFCD7F32)
                                    else -> Color.White.copy(alpha = 0.15f)
                                }
                                val rankTextColor = if (index < 3) Color.Black else Color.White
                                Box(
                                    modifier = Modifier
                                        .size(28.dp)
                                        .clip(CircleShape)
                                        .background(rankBg),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = "#${index + 1}",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Black,
                                        color = rankTextColor
                                    )
                                }

                                Spacer(modifier = Modifier.width(10.dp))

                                // Channel Logo / Icon
                                if (channel.logoUrl != null) {
                                    AsyncImage(
                                        model = ImageRequest.Builder(LocalContext.current)
                                            .data(channel.logoUrl)
                                            .crossfade(true)
                                            .build(),
                                        contentDescription = null,
                                        contentScale = ContentScale.Fit,
                                        modifier = Modifier
                                            .size(28.dp)
                                            .clip(RoundedCornerShape(6.dp))
                                    )
                                } else {
                                    Icon(
                                        imageVector = Icons.Default.LiveTv,
                                        contentDescription = null,
                                        tint = AccentRed,
                                        modifier = Modifier.size(24.dp)
                                    )
                                }

                                Spacer(modifier = Modifier.width(10.dp))

                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = channel.name,
                                        style = MaterialTheme.typography.bodyMedium,
                                        fontWeight = FontWeight.SemiBold,
                                        color = TextPrimary,
                                        maxLines = 1,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                    Text(
                                        text = channel.category,
                                        style = MaterialTheme.typography.labelSmall,
                                        color = TextSecondary,
                                        maxLines = 1
                                    )
                                }

                                // Quick Actions: Move to Top, Move Up, Move Down
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    if (!isFirst) {
                                        IconButton(
                                            onClick = { onMoveToTop(channel.id) },
                                            modifier = Modifier.size(28.dp)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.VerticalAlignTop,
                                                contentDescription = "Move to Top",
                                                tint = Color(0xFFFFD166),
                                                modifier = Modifier.size(16.dp)
                                            )
                                        }
                                    }

                                    IconButton(
                                        onClick = { onMoveUp(channel.id) },
                                        enabled = !isFirst,
                                        modifier = Modifier.size(28.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.KeyboardArrowUp,
                                            contentDescription = "Move Up",
                                            tint = if (!isFirst) TextPrimary else TextSecondary.copy(alpha = 0.3f),
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }

                                    IconButton(
                                        onClick = { onMoveDown(channel.id) },
                                        enabled = !isLast,
                                        modifier = Modifier.size(28.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.KeyboardArrowDown,
                                            contentDescription = "Move Down",
                                            tint = if (!isLast) TextPrimary else TextSecondary.copy(alpha = 0.3f),
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }
                                }
                            }
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
                Text("Done")
            }
        },
        dismissButton = {
            if (favoriteChannels.size > 1) {
                TextButton(onClick = onResetOrder) {
                    Text("Reset A–Z", color = TextSecondary)
                }
            }
        }
    )
}

