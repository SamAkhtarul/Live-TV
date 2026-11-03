package com.example.livetv.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Category
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.History
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.livetv.ui.LiveTvViewModel
import com.example.livetv.ui.theme.AccentRed
import com.example.livetv.ui.theme.DarkSurface
import com.example.livetv.ui.theme.DarkSurfaceVariant
import com.example.livetv.ui.theme.TextPrimary
import com.example.livetv.ui.theme.TextSecondary

@Composable
fun RearrangeCategoriesDialog(
    categories: List<String>,
    categoryCounts: Map<String, Int>,
    onMoveUp: (String) -> Unit,
    onMoveDown: (String) -> Unit,
    onMoveToFirst: (String) -> Unit,
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
                            .background(AccentRed.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Category,
                            contentDescription = null,
                            tint = AccentRed,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(
                            text = "Rearrange Categories",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Text(
                            text = "Move your favorite genres to the front",
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
            LazyColumn(
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(max = 420.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                itemsIndexed(categories, key = { _, cat -> cat }) { index, category ->
                    val isFirst = index == 0
                    val isLast = index == categories.size - 1
                    val isAll = category == LiveTvViewModel.CATEGORY_ALL

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
                            // Category Icon
                            val iconTint = when (category) {
                                LiveTvViewModel.CATEGORY_ALL -> AccentRed
                                LiveTvViewModel.CATEGORY_FAVORITES -> Color(0xFFFFD166)
                                LiveTvViewModel.CATEGORY_RECENT -> Color(0xFF7FD1FF)
                                else -> TextSecondary
                            }
                            val icon = when (category) {
                                LiveTvViewModel.CATEGORY_ALL -> Icons.Default.LiveTv
                                LiveTvViewModel.CATEGORY_FAVORITES -> Icons.Default.Star
                                LiveTvViewModel.CATEGORY_RECENT -> Icons.Default.History
                                else -> Icons.Default.Category
                            }

                            Box(
                                modifier = Modifier
                                    .size(28.dp)
                                    .clip(CircleShape)
                                    .background(iconTint.copy(alpha = 0.15f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = icon,
                                    contentDescription = null,
                                    tint = iconTint,
                                    modifier = Modifier.size(16.dp)
                                )
                            }

                            Spacer(modifier = Modifier.width(10.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = category,
                                    style = MaterialTheme.typography.bodyMedium,
                                    fontWeight = FontWeight.SemiBold,
                                    color = TextPrimary,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                val count = categoryCounts[category]
                                if (count != null && count > 0) {
                                    Text(
                                        text = "$count channels",
                                        style = MaterialTheme.typography.labelSmall,
                                        color = TextSecondary
                                    )
                                }
                            }

                            // Actions: Move to Front, Move Up, Move Down
                            if (!isAll) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    if (index > 1) {
                                        IconButton(
                                            onClick = { onMoveToFirst(category) },
                                            modifier = Modifier.size(28.dp)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.VerticalAlignTop,
                                                contentDescription = "Move to Front",
                                                tint = AccentRed,
                                                modifier = Modifier.size(16.dp)
                                            )
                                        }
                                    }

                                    IconButton(
                                        onClick = { onMoveUp(category) },
                                        enabled = index > 1,
                                        modifier = Modifier.size(28.dp)
                                    ) {
                                        Icon(
                                            imageVector = Icons.Default.KeyboardArrowUp,
                                            contentDescription = "Move Up",
                                            tint = if (index > 1) TextPrimary else TextSecondary.copy(alpha = 0.3f),
                                            modifier = Modifier.size(18.dp)
                                        )
                                    }

                                    IconButton(
                                        onClick = { onMoveDown(category) },
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
                            } else {
                                Text(
                                    text = "Pinned",
                                    fontSize = 11.sp,
                                    color = TextSecondary,
                                    modifier = Modifier.padding(end = 8.dp)
                                )
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
            TextButton(onClick = onResetOrder) {
                Text("Reset to Default", color = TextSecondary)
            }
        }
    )
}

