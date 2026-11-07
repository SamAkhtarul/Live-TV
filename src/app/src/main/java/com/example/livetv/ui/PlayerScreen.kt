package com.example.livetv.ui

import android.content.res.Configuration
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.grid.LazyGridState
import androidx.compose.foundation.lazy.grid.rememberLazyGridState
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import com.example.livetv.data.Channel
import com.example.livetv.player.LiveTvPlayerManager
import com.example.livetv.player.ResizeMode
import com.example.livetv.ui.components.VideoPlayerView
import com.example.livetv.ui.theme.DarkBackground

@Composable
fun PlayerScreen(
    playerManager: LiveTvPlayerManager,
    currentChannel: Channel,
    allChannels: List<Channel>,
    categories: List<String>,
    selectedCategory: String,
    searchQuery: String,
    isPlaying: Boolean,
    isBuffering: Boolean,
    errorMessage: String?,
    resizeMode: ResizeMode,
    onClose: () -> Unit,
    onNextChannel: () -> Unit,
    onPrevChannel: () -> Unit,
    onSelectChannel: (Channel) -> Unit,
    onToggleFavorite: (String) -> Unit,
    onCategorySelected: (String) -> Unit,
    onSearchQueryChange: (String) -> Unit,
    onOpenAddDialog: () -> Unit,
    onEnterPiP: () -> Unit,
    modifier: Modifier = Modifier,
    autoRetryAttempt: Int = 0,
    maxAutoRetries: Int = 2,
    sleepTimerRemainingMs: Long? = null,
    onRetry: () -> Unit = {},
    onHideChannel: (Channel) -> Unit = {},
    onSetSleepTimer: (Int?) -> Unit = {},
    onOpenAbout: () -> Unit = {},
    onMinimizeToMiniPlayer: () -> Unit = {},
    previousChannel: Channel? = null,
    onRecallPreviousChannel: () -> Unit = {},
    sortLabel: String = "Featured",
    onCycleSort: () -> Unit = {},
    onPlayRandom: () -> Unit = {},
    categoryCounts: Map<String, Int> = emptyMap(),
    gridState: LazyGridState = rememberLazyGridState(),
    categoryRowState: LazyListState = rememberLazyListState(),
    onOpenRearrangeCategories: () -> Unit = {},
    onOpenReorderFavorites: () -> Unit = {}
) {
    val configuration = LocalConfiguration.current
    val isLandscape = configuration.orientation == Configuration.ORIENTATION_LANDSCAPE

    val player: @Composable (Modifier) -> Unit = { playerModifier ->
        VideoPlayerView(
            playerManager = playerManager,
            currentChannel = currentChannel,
            channelsList = allChannels,
            isPlaying = isPlaying,
            isBuffering = isBuffering,
            errorMessage = errorMessage,
            resizeMode = resizeMode,
            onClose = onClose,
            onNextChannel = onNextChannel,
            onPrevChannel = onPrevChannel,
            onSelectChannel = onSelectChannel,
            onToggleFavorite = onToggleFavorite,
            onEnterPiP = onEnterPiP,
            autoRetryAttempt = autoRetryAttempt,
            maxAutoRetries = maxAutoRetries,
            sleepTimerRemainingMs = sleepTimerRemainingMs,
            onRetry = onRetry,
            onHideChannel = onHideChannel,
            onSetSleepTimer = onSetSleepTimer,
            onMinimizeToMiniPlayer = onMinimizeToMiniPlayer,
            previousChannel = previousChannel,
            onRecallPreviousChannel = onRecallPreviousChannel,
            modifier = playerModifier
        )
    }

    if (isLandscape) {
        // In landscape, video player takes the full screen
        player(modifier.fillMaxSize())
    } else {
        // In portrait, video is at the top with 16:9 ratio, and channel browser is below
        Column(
            modifier = modifier
                .fillMaxSize()
                .background(DarkBackground)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(16f / 9f)
            ) {
                player(Modifier.fillMaxSize())
            }

            // Bottom section: channel list to zap or switch channels seamlessly
            ChannelListScreen(
                channels = allChannels,
                categories = categories,
                selectedCategory = selectedCategory,
                searchQuery = searchQuery,
                selectedChannelId = currentChannel.id,
                onSelectChannel = onSelectChannel,
                onToggleFavorite = onToggleFavorite,
                onCategorySelected = onCategorySelected,
                onSearchQueryChange = onSearchQueryChange,
                onOpenAddDialog = onOpenAddDialog,
                onOpenAbout = onOpenAbout,
                onHideChannel = onHideChannel,
                sortLabel = sortLabel,
                onCycleSort = onCycleSort,
                onPlayRandom = onPlayRandom,
                categoryCounts = categoryCounts,
                gridState = gridState,
                categoryRowState = categoryRowState,
                onOpenRearrangeCategories = onOpenRearrangeCategories,
                onOpenReorderFavorites = onOpenReorderFavorites,
                modifier = Modifier.weight(1f)
            )
        }
    }
}
