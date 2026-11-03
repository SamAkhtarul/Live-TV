package com.example.livetv.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyGridState
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.grid.rememberLazyGridState
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.LiveTv
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Shuffle
import androidx.compose.material.icons.filled.SortByAlpha
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.livetv.data.Channel
import com.example.livetv.ui.components.ChannelItemCard
import com.example.livetv.ui.components.LiveBadge
import com.example.livetv.ui.components.LiveEventsSection
import com.example.livetv.ui.theme.AccentRed
import com.example.livetv.ui.theme.CardBorder
import com.example.livetv.ui.theme.DarkBackground
import com.example.livetv.ui.theme.DarkSurface
import com.example.livetv.ui.theme.DarkSurfaceVariant
import com.example.livetv.ui.theme.TextPrimary
import com.example.livetv.ui.theme.TextSecondary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChannelListScreen(
    channels: List<Channel>,
    categories: List<String>,
    selectedCategory: String,
    searchQuery: String,
    selectedChannelId: String?,
    onSelectChannel: (Channel) -> Unit,
    onToggleFavorite: (String) -> Unit,
    onCategorySelected: (String) -> Unit,
    onSearchQueryChange: (String) -> Unit,
    onOpenAddDialog: () -> Unit,
    modifier: Modifier = Modifier,
    onOpenAbout: () -> Unit = {},
    onHideChannel: (Channel) -> Unit = {},
    sortLabel: String = "Featured",
    onCycleSort: () -> Unit = {},
    onPlayRandom: () -> Unit = {},
    categoryCounts: Map<String, Int> = emptyMap(),
    gridState: LazyGridState = rememberLazyGridState(),
    categoryRowState: LazyListState = rememberLazyListState(),
    onOpenRearrangeCategories: () -> Unit = {},
    onOpenReorderFavorites: () -> Unit = {},
    liveEvents: List<com.example.livetv.data.LiveEvent> = emptyList(),
    isLiveSportsLoading: Boolean = false
) {
    val appVersion = rememberAppVersion()
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(DarkBackground)
            .statusBarsPadding()
    ) {
        // App Header Bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(AccentRed),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.LiveTv,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(22.dp)
                    )
                }

                Spacer(modifier = Modifier.width(10.dp))

                Text(
                    text = "LIVE TV",
                    style = MaterialTheme.typography.titleLarge,
                    color = TextPrimary,
                    fontWeight = FontWeight.Black,
                    letterSpacing = 1.sp
                )

                Spacer(modifier = Modifier.width(8.dp))

                LiveBadge()

                Spacer(modifier = Modifier.width(6.dp))

                Text(
                    text = "v$appVersion",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextSecondary,
                    fontWeight = FontWeight.Medium
                )
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
            // Random Channel / Surprise Me button
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = DarkSurfaceVariant,
                modifier = Modifier.clickable { onPlayRandom() }
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Shuffle,
                        contentDescription = "Random Channel",
                        tint = AccentRed,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Random",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = TextPrimary
                    )
                }
            }

            Spacer(modifier = Modifier.width(6.dp))

            // Add Custom Playlist / Channel button
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = DarkSurfaceVariant,
                modifier = Modifier.clickable { onOpenAddDialog() }
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = "Add Playlist",
                        tint = AccentRed,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Add M3U",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = TextPrimary
                    )
                }
            }

            Spacer(modifier = Modifier.width(6.dp))

            // About & Settings
            IconButton(
                onClick = onOpenAbout,
                modifier = Modifier
                    .size(38.dp)
                    .clip(CircleShape)
                    .background(DarkSurfaceVariant)
            ) {
                Icon(
                    imageVector = Icons.Default.Settings,
                    contentDescription = "About & Settings",
                    tint = TextPrimary,
                    modifier = Modifier.size(20.dp)
                )
            }
            }
        }

        // Search Bar
        OutlinedTextField(
            value = searchQuery,
            onValueChange = onSearchQueryChange,
            placeholder = { Text("Search channels, genres…", color = TextSecondary) },
            leadingIcon = {
                Icon(Icons.Default.Search, contentDescription = null, tint = TextSecondary)
            },
            trailingIcon = {
                if (searchQuery.isNotEmpty()) {
                    IconButton(onClick = { onSearchQueryChange("") }) {
                        Icon(Icons.Default.Clear, contentDescription = "Clear", tint = TextSecondary)
                    }
                }
            },
            singleLine = true,
            shape = RoundedCornerShape(12.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedContainerColor = DarkSurface,
                unfocusedContainerColor = DarkSurface,
                focusedBorderColor = AccentRed,
                unfocusedBorderColor = CardBorder,
                focusedTextColor = TextPrimary,
                unfocusedTextColor = TextPrimary
            ),
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 6.dp)
        )

        // Featured Real-Time Live Sports Events Segment (Cricket, Tennis, MotoGP, Football)
        if (searchQuery.isEmpty()) {
            LiveEventsSection(
                channels = channels,
                onSelectChannel = onSelectChannel,
                liveEvents = liveEvents,
                isLoading = isLiveSportsLoading
            )
        }

        // Category Chips Row
        LazyRow(
            state = categoryRowState,
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(categories, key = { it }) { category ->
                val isSelected = category == selectedCategory
                val chipIcon = when (category) {
                    "Favorites" -> Icons.Default.Star to Color(0xFFFFD166)
                    "Recent" -> Icons.Default.History to Color(0xFF7FD1FF)
                    else -> null
                }
                FilterChip(
                    selected = isSelected,
                    onClick = { onCategorySelected(category) },
                    leadingIcon = if (chipIcon != null) {
                        {
                            Icon(
                                imageVector = chipIcon.first,
                                contentDescription = null,
                                tint = chipIcon.second,
                                modifier = Modifier.size(16.dp)
                            )
                        }
                    } else null,
                    label = {
                        val count = categoryCounts[category]
                        val chipText = if (count != null && count > 0) "$category ($count)" else category
                        Text(
                            text = chipText,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal,
                            color = if (isSelected) Color.White else TextSecondary
                        )
                    },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = AccentRed,
                        containerColor = DarkSurface
                    ),
                    border = FilterChipDefaults.filterChipBorder(
                        enabled = true,
                        selected = isSelected,
                        borderColor = if (isSelected) AccentRed else CardBorder
                    ),
                    shape = RoundedCornerShape(8.dp)
                )
            }

            // Quick Reorder Categories Button
            item {
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = DarkSurfaceVariant,
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .clickable { onOpenRearrangeCategories() }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 7.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Tune,
                            contentDescription = "Rearrange Categories",
                            tint = AccentRed,
                            modifier = Modifier.size(15.dp)
                        )
                        Spacer(modifier = Modifier.width(5.dp))
                        Text(
                            text = "Reorder",
                            fontSize = 12.5.sp,
                            fontWeight = FontWeight.Medium,
                            color = TextPrimary
                        )
                    }
                }
            }
        }

        // Channels Counter + Sort Pill + Reorder Favorites
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 4.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = "${channels.size} live channels",
                    style = MaterialTheme.typography.labelSmall,
                    color = TextSecondary
                )

                if (selectedCategory == "Favorites" && channels.isNotEmpty()) {
                    Spacer(modifier = Modifier.width(8.dp))
                    Surface(
                        shape = RoundedCornerShape(12.dp),
                        color = Color(0xFFFFD166).copy(alpha = 0.2f),
                        modifier = Modifier
                            .clip(RoundedCornerShape(12.dp))
                            .clickable { onOpenReorderFavorites() }
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Default.Star,
                                contentDescription = "Rank Channels",
                                tint = Color(0xFFFFD166),
                                modifier = Modifier.size(12.dp)
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = "Rank / Reorder",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFFFD166)
                            )
                        }
                    }
                }
            }

            Surface(
                shape = RoundedCornerShape(14.dp),
                color = DarkSurface,
                modifier = Modifier
                    .clip(RoundedCornerShape(14.dp))
                    .clickable { onCycleSort() }
            ) {
                Row(
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.SortByAlpha,
                        contentDescription = "Sort Order",
                        tint = AccentRed,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "Sort: $sortLabel",
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = FontWeight.SemiBold,
                        color = TextPrimary
                    )
                }
            }
        }

        // Channels List / Grid
        if (channels.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Default.LiveTv,
                        contentDescription = null,
                        tint = TextSecondary,
                        modifier = Modifier.size(64.dp)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = when {
                            searchQuery.isNotBlank() -> "No channels found"
                            selectedCategory == "Favorites" -> "No favorites yet"
                            selectedCategory == "Recent" -> "Nothing watched yet"
                            else -> "No channels found"
                        },
                        style = MaterialTheme.typography.titleMedium,
                        color = TextPrimary
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = when {
                            searchQuery.isNotBlank() ->
                                "Try searching with a different keyword or adding a custom M3U playlist."
                            selectedCategory == "Favorites" ->
                                "Tap the ☆ star on any channel (or in the player) to add it here."
                            selectedCategory == "Recent" ->
                                "Channels you watch will appear here so you can jump back quickly."
                            else ->
                                "Try searching with a different keyword or adding a custom M3U playlist."
                        },
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary,
                        textAlign = TextAlign.Center
                    )
                }
            }
        } else {
            LazyVerticalGrid(
                state = gridState,
                columns = GridCells.Adaptive(minSize = 320.dp),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(channels, key = { it.id }) { channel ->
                    ChannelItemCard(
                        channel = channel,
                        isSelected = channel.id == selectedChannelId,
                        onSelect = { onSelectChannel(channel) },
                        onToggleFavorite = { onToggleFavorite(channel.id) },
                        onHide = { onHideChannel(channel) }
                    )
                }
            }
        }
    }
}

/** Reads the installed app version (e.g. "0.1.1") from the package manager. */
@Composable
fun rememberAppVersion(): String {
    val context = LocalContext.current
    return remember(context) {
        try {
            context.packageManager.getPackageInfo(context.packageName, 0).versionName ?: "?"
        } catch (e: Exception) {
            "?"
        }
    }
}

