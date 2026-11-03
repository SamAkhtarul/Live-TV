package com.example.livetv.ui

import android.app.Application
import android.content.Context
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.foundation.lazy.grid.LazyGridState
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.livetv.data.Channel
import com.example.livetv.data.M3UParser
import com.example.livetv.data.SampleChannels
import com.example.livetv.player.LiveTvPlayerManager
import com.example.livetv.player.ResizeMode
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.UUID

enum class SortOrder(val label: String) {
    DEFAULT("Featured"),
    NAME_ASC("A–Z"),
    COUNTRY("Country")
}

class LiveTvViewModel(application: Application) : AndroidViewModel(application) {

    companion object {
        const val CATEGORY_ALL = "All"
        const val CATEGORY_FAVORITES = "Favorites"
        const val CATEGORY_RECENT = "Recent"

        private const val PREF_FAVORITES = "favorite_channels"
        private const val PREF_FAVORITE_ORDER = "favorite_channels_order"
        private const val PREF_CATEGORY_ORDER = "user_category_order"
        private const val PREF_RECENT = "recent_channels"
        private const val PREF_HIDDEN = "hidden_channels"
        private const val MAX_RECENT = 30
        private const val RECENT_SEPARATOR = "\n"

        /** Number of automatic reconnect attempts before showing the error to the user. */
        const val MAX_AUTO_RETRIES = 2
        private const val AUTO_RETRY_DELAY_MS = 3_000L
    }

    val playerManager = LiveTvPlayerManager(application)

    val isPlaying: StateFlow<Boolean> = playerManager.isPlaying
    val isBuffering: StateFlow<Boolean> = playerManager.isBuffering
    val errorMessage: StateFlow<String?> = playerManager.errorMessage
    val resizeMode: StateFlow<ResizeMode> = playerManager.resizeMode

    private val prefs = application.getSharedPreferences("livetv_prefs", Context.MODE_PRIVATE)

    // --- Favorites (persisted) ---
    private val favoriteKeys: MutableSet<String> =
        (prefs.getStringSet(PREF_FAVORITES, emptySet()) ?: emptySet()).toMutableSet()

    // --- Favorite Custom Ranking (persisted list of channel IDs in rank order) ---
    private val _favoriteOrder = MutableStateFlow(
        prefs.getString(PREF_FAVORITE_ORDER, "")
            .orEmpty()
            .split(RECENT_SEPARATOR)
            .filter { it.isNotBlank() }
    )
    val favoriteOrder: StateFlow<List<String>> = _favoriteOrder.asStateFlow()

    // --- Custom Category Order (persisted list of category names in order) ---
    private val _customCategoryOrder = MutableStateFlow(
        prefs.getString(PREF_CATEGORY_ORDER, "")
            .orEmpty()
            .split(RECENT_SEPARATOR)
            .filter { it.isNotBlank() }
    )
    val customCategoryOrder: StateFlow<List<String>> = _customCategoryOrder.asStateFlow()

    // --- Recently watched (persisted, most recent first, keyed by stream URL) ---
    private val _recentUrls = MutableStateFlow(
        prefs.getString(PREF_RECENT, "")
            .orEmpty()
            .split(RECENT_SEPARATOR)
            .filter { it.isNotBlank() }
    )

    // --- Hidden / broken channels (persisted, keyed by stream URL) ---
    private val _hiddenUrls = MutableStateFlow(
        (prefs.getStringSet(PREF_HIDDEN, emptySet()) ?: emptySet()).toSet()
    )
    val hiddenCount: StateFlow<Int> = _hiddenUrls
        .map { it.size }
        .stateIn(viewModelScope, SharingStarted.Eagerly, _hiddenUrls.value.size)

    // --- Real-Time Live Sports Events (No Fake Mock Information) ---
    private val _liveSportsEvents = MutableStateFlow<List<com.example.livetv.data.LiveEvent>>(emptyList())
    val liveSportsEvents: StateFlow<List<com.example.livetv.data.LiveEvent>> = _liveSportsEvents.asStateFlow()

    private val _isLiveSportsLoading = MutableStateFlow(true)
    val isLiveSportsLoading: StateFlow<Boolean> = _isLiveSportsLoading.asStateFlow()

    private val _rawChannels = MutableStateFlow<List<Channel>>(
        SampleChannels.list.map { ch ->
            ch.copy(isFavorite = isChannelFavorite(ch))
        }
    )

    private val _totalChannelCount = MutableStateFlow(SampleChannels.list.size)
    val totalChannelCount: StateFlow<Int> = _totalChannelCount.asStateFlow()

    val favoriteCount: StateFlow<Int> = _rawChannels
        .map { list -> list.count { it.isFavorite } }
        .stateIn(viewModelScope, SharingStarted.Eagerly, 0)

    val favoriteChannels: StateFlow<List<Channel>> = combine(_rawChannels, _favoriteOrder) { raw, order ->
        val favs = raw.filter { it.isFavorite }.distinctBy { it.id }
        val orderMap = order.withIndex().associate { it.value to it.index }
        favs.sortedWith(compareBy(
            { orderMap[it.id] ?: Int.MAX_VALUE },
            { it.name.lowercase() }
        ))
    }.stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())

    val recentCount: StateFlow<Int> = _recentUrls
        .map { it.size }
        .stateIn(viewModelScope, SharingStarted.Eagerly, _recentUrls.value.size)

    private fun isChannelFavorite(channel: Channel): Boolean {
        return channel.id in favoriteKeys || channel.streamUrl in favoriteKeys
    }

    private fun saveFavorites() {
        prefs.edit().putStringSet(PREF_FAVORITES, favoriteKeys.toSet()).apply()
    }

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _selectedCategory = MutableStateFlow(CATEGORY_ALL)
    val selectedCategory: StateFlow<String> = _selectedCategory.asStateFlow()

    // Persisted scroll states per category so returning from the player keeps exact scroll position
    private val categoryGridStates = mutableMapOf<String, LazyGridState>()
    val categoryRowState = LazyListState()

    fun getGridState(category: String): LazyGridState {
        return categoryGridStates.getOrPut(category) { LazyGridState() }
    }

    private val _selectedChannel = MutableStateFlow<Channel?>(null)
    val selectedChannel: StateFlow<Channel?> = _selectedChannel.asStateFlow()

    private val _previousWatchedChannel = MutableStateFlow<Channel?>(null)
    val previousWatchedChannel: StateFlow<Channel?> = _previousWatchedChannel.asStateFlow()

    private val _isMiniPlayer = MutableStateFlow(false)
    val isMiniPlayer: StateFlow<Boolean> = _isMiniPlayer.asStateFlow()

    private val _sortOrder = MutableStateFlow(SortOrder.DEFAULT)
    val sortOrder: StateFlow<SortOrder> = _sortOrder.asStateFlow()

    private val _isLoadingPlaylist = MutableStateFlow(false)
    val isLoadingPlaylist: StateFlow<Boolean> = _isLoadingPlaylist.asStateFlow()

    private val _playlistError = MutableStateFlow<String?>(null)
    val playlistError: StateFlow<String?> = _playlistError.asStateFlow()

    // --- Auto reconnect ---
    private var autoRetryCount = 0
    private var autoRetryJob: Job? = null
    private val _autoRetryAttempt = MutableStateFlow(0)
    /** Current automatic reconnect attempt (0 = not reconnecting). */
    val autoRetryAttempt: StateFlow<Int> = _autoRetryAttempt.asStateFlow()

    // --- Sleep timer ---
    private var sleepTimerJob: Job? = null
    private val _sleepTimerRemainingMs = MutableStateFlow<Long?>(null)
    /** Remaining time for the sleep timer in milliseconds, or null if it is off. */
    val sleepTimerRemainingMs: StateFlow<Long?> = _sleepTimerRemainingMs.asStateFlow()

    private val priorityCategories = listOf(
        "Bangladesh",
        "Indian Bangla",
        "4K & Fashion",
        "Music",
        "Cricket",
        "Football",
        "Tennis",
        "MotoGP",
        "Sports",
        "Documentary",
        "News",
        "Indian Entertainment",
        "Movies",
        "Kids",
        "Religious",
        "International",
        "United States",
        "United Kingdom"
    )

    init {
        loadBundledCatalog()
        refreshDynamicMotoGpEvents()
        refreshRealSportsEvents()
        startSportsAutoRefreshLoop()
        observePlaybackForAutoRetry()
        initializeFavoriteOrderIfNeeded()
    }

    fun refreshRealSportsEvents() {
        viewModelScope.launch {
            _isLiveSportsLoading.value = _liveSportsEvents.value.isEmpty()
            val events = com.example.livetv.data.RealSportsFetcher.fetchAllLiveEvents()
            _liveSportsEvents.value = events
            _isLiveSportsLoading.value = false

            // Update MotoGP channel if active stream found in events
            val motoEvent = events.firstOrNull { it.sport.equals("MotoGP", ignoreCase = true) && !it.streamUrl.isNullOrBlank() }
            if (motoEvent != null) {
                val streamUrl = motoEvent.streamUrl!!
                val ua = motoEvent.userAgent
                val finalUrl = if (!ua.isNullOrBlank()) "$streamUrl|User-Agent=$ua" else streamUrl
                _rawChannels.value = _rawChannels.value.map { ch ->
                    if (ch.id == "fancode_motogp_live" || ch.id == "motogp_official_world_feed") {
                        ch.copy(
                            name = if (ch.id == "motogp_official_world_feed") "MotoGP Live HD (MGP World Feed)" else "FanCode MotoGP • ${motoEvent.title}",
                            streamUrl = finalUrl
                        )
                    } else ch
                }
            }
        }
    }

    private fun startSportsAutoRefreshLoop() {
        viewModelScope.launch(Dispatchers.IO) {
            while (true) {
                delay(60_000L)
                val events = com.example.livetv.data.RealSportsFetcher.fetchAllLiveEvents()
                if (events.isNotEmpty()) {
                    withContext(Dispatchers.Main) {
                        _liveSportsEvents.value = events
                    }
                }
            }
        }
    }

    private fun initializeFavoriteOrderIfNeeded() {
        if (_favoriteOrder.value.isEmpty() && favoriteKeys.isNotEmpty()) {
            val favIds = _rawChannels.value.filter { it.isFavorite }.map { it.id }
            if (favIds.isNotEmpty()) {
                _favoriteOrder.value = favIds
                prefs.edit().putString(PREF_FAVORITE_ORDER, favIds.joinToString(RECENT_SEPARATOR)).apply()
            }
        }
    }

    private fun refreshDynamicMotoGpEvents() {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val url = java.net.URL("https://raw.githubusercontent.com/drmlive/fancode-live-events/main/fancode.json")
                val connection = url.openConnection() as java.net.HttpURLConnection
                connection.connectTimeout = 8000
                connection.readTimeout = 8000
                connection.setRequestProperty("User-Agent", "Mozilla/5.0")
                if (connection.responseCode == 200) {
                    val body = connection.inputStream.bufferedReader().use { it.readText() }
                    val json = org.json.JSONObject(body)
                    val matches = json.optJSONArray("matches") ?: return@launch
                    for (i in 0 until matches.length()) {
                        val m = matches.getJSONObject(i)
                        val cat = m.optString("event_category")
                        val title = m.optString("title")
                        val eventName = m.optString("event_name")
                        val matchName = m.optString("match_name")
                        val isMoto = cat.contains("MotoGP", ignoreCase = true) ||
                                     title.contains("MotoGP", ignoreCase = true) ||
                                     eventName.contains("Sepang", ignoreCase = true) ||
                                     title.contains("Grand Prix", ignoreCase = true)
                        if (isMoto) {
                            val streamUrl = m.optString("dai_url").ifEmpty { m.optString("adfree_url") }
                            val ua = m.optString("user-agent")
                            val finalUrl = if (ua.isNotBlank()) "$streamUrl|User-Agent=$ua" else streamUrl
                            val logo = m.optString("src").ifEmpty { "https://www.fancode.com/skillup-uploads/cms-media/Petronas-Grand-Prix-of-Malaysia_fc-web.jpg" }
                            val channelTitle = if (matchName.isNotBlank()) "FanCode MotoGP • $matchName" else "FanCode MotoGP • $title"

                            withContext(Dispatchers.Main) {
                                _rawChannels.value = _rawChannels.value.map { ch ->
                                    if (ch.id == "fancode_motogp_live" || ch.id == "motogp_official_world_feed") {
                                        ch.copy(
                                            name = if (ch.id == "motogp_official_world_feed") "MotoGP Live HD (MGP World Feed)" else channelTitle,
                                            streamUrl = finalUrl,
                                            logoUrl = logo
                                        )
                                    } else ch
                                }
                            }
                            break
                        }
                    }
                }
            } catch (e: Exception) {
                // Silently fallback to bundled static streams
            }
        }
    }

    private fun loadBundledCatalog() {
        viewModelScope.launch {
            val catalogChannels = M3UParser.parseFromAssets(
                context = getApplication(),
                assetFileName = "channels_catalog.m3u",
                isCustom = false
            )
            if (catalogChannels.isNotEmpty()) {
                val existingUrls = _rawChannels.value.map { it.streamUrl }.toHashSet()
                val uniqueCatalog = catalogChannels
                    .filter { it.streamUrl !in existingUrls }
                    .map { ch -> ch.copy(isFavorite = isChannelFavorite(ch)) }
                _rawChannels.value = _rawChannels.value + uniqueCatalog
            }
            _totalChannelCount.value = _rawChannels.value.size
        }
    }

    /**
     * Live IPTV streams frequently drop for a few seconds. Instead of immediately showing an
     * error, silently reconnect a couple of times before surfacing the error overlay.
     */
    private fun observePlaybackForAutoRetry() {
        viewModelScope.launch {
            playerManager.errorMessage.collect { error ->
                val channel = _selectedChannel.value
                if (error != null && channel != null && autoRetryCount < MAX_AUTO_RETRIES) {
                    autoRetryCount++
                    _autoRetryAttempt.value = autoRetryCount
                    autoRetryJob?.cancel()
                    autoRetryJob = viewModelScope.launch {
                        delay(AUTO_RETRY_DELAY_MS)
                        // Only retry if the user is still on the same channel
                        if (_selectedChannel.value?.id == channel.id) {
                            playerManager.playStream(channel.streamUrl)
                        }
                    }
                } else if (error != null) {
                    _autoRetryAttempt.value = 0
                }
            }
        }
        viewModelScope.launch {
            playerManager.isPlaying.collect { playing ->
                if (playing) {
                    autoRetryCount = 0
                    _autoRetryAttempt.value = 0
                }
            }
        }
    }

    val categories: StateFlow<List<String>> = combine(
        _rawChannels,
        _hiddenUrls,
        _customCategoryOrder
    ) { channels, hidden, customOrder ->
        val distinctCats = channels.asSequence()
            .filter { it.streamUrl !in hidden }
            .map { it.category }
            .distinct()
            .toList()

        val baseSpecial = listOf(CATEGORY_ALL, CATEGORY_FAVORITES, CATEGORY_RECENT)
        val allAvailable = (baseSpecial + distinctCats).distinct()

        if (customOrder.isNotEmpty()) {
            val ordered = customOrder.filter { it in allAvailable }
            val remaining = allAvailable.filter { it !in ordered }
            ordered + remaining
        } else {
            val prioritized = priorityCategories.filter { it in distinctCats }
            val remaining = distinctCats.filter { it !in priorityCategories }.sorted()
            baseSpecial + prioritized + remaining
        }
    }.stateIn(
        viewModelScope,
        SharingStarted.Eagerly,
        listOf(CATEGORY_ALL, CATEGORY_FAVORITES, CATEGORY_RECENT) + priorityCategories
    )

    val categoryCounts: StateFlow<Map<String, Int>> = combine(
        _rawChannels,
        _recentUrls,
        _hiddenUrls
    ) { channels, recent, hidden ->
        val visible = channels.filter { it.streamUrl !in hidden }.distinctBy { it.id }
        val counts = mutableMapOf<String, Int>()
        counts[CATEGORY_ALL] = visible.size
        counts[CATEGORY_FAVORITES] = visible.count { it.isFavorite }
        val byUrl = visible.associateBy { it.streamUrl }
        counts[CATEGORY_RECENT] = recent.count { it in byUrl }
        visible.groupBy { it.category }.forEach { (cat, list) ->
            counts[cat] = list.size
        }
        counts
    }.stateIn(viewModelScope, SharingStarted.Eagerly, emptyMap())

    private data class FilterSnapshot(
        val channels: List<Channel>,
        val query: String,
        val category: String,
        val recent: List<String>,
        val hidden: Set<String>
    )

    val filteredChannels: StateFlow<List<Channel>> = combine(
        _rawChannels,
        _searchQuery,
        _selectedCategory,
        _recentUrls,
        _hiddenUrls
    ) { channels, query, category, recent, hidden ->
        FilterSnapshot(channels, query, category, recent, hidden)
    }.combine(_favoriteOrder) { snapshot, favOrder ->
        val visible = snapshot.channels.filter { it.streamUrl !in snapshot.hidden }.distinctBy { it.id }

        val byCategory = when (snapshot.category) {
            CATEGORY_ALL -> visible
            CATEGORY_FAVORITES -> {
                val favs = visible.filter { it.isFavorite }
                val orderMap = favOrder.withIndex().associate { it.value to it.index }
                favs.sortedWith(compareBy(
                    { orderMap[it.id] ?: Int.MAX_VALUE },
                    { it.name.lowercase() }
                ))
            }
            CATEGORY_RECENT -> {
                val byUrl = visible.associateBy { it.streamUrl }
                snapshot.recent.mapNotNull { byUrl[it] }
            }
            else -> visible.filter { it.category.equals(snapshot.category, ignoreCase = true) }
        }

        if (snapshot.query.isBlank()) {
            byCategory
        } else {
            byCategory.filter { channel ->
                channel.name.contains(snapshot.query, ignoreCase = true) ||
                        channel.category.contains(snapshot.query, ignoreCase = true) ||
                        (channel.country?.contains(snapshot.query, ignoreCase = true) == true)
            }
        }
    }.combine(_sortOrder) { list, sort ->
        when (sort) {
            SortOrder.DEFAULT -> list
            SortOrder.NAME_ASC -> list.sortedBy { it.name.lowercase() }
            SortOrder.COUNTRY -> list.sortedWith(
                compareBy<Channel> { it.country?.lowercase() ?: "zzz" }.thenBy { it.name.lowercase() }
            )
        }
    }.stateIn(viewModelScope, SharingStarted.Eagerly, SampleChannels.list)

    fun selectChannel(channel: Channel, keepMiniPlayer: Boolean = false) {
        autoRetryJob?.cancel()
        autoRetryCount = 0
        _autoRetryAttempt.value = 0
        val current = _selectedChannel.value
        if (current != null && current.id != channel.id) {
            _previousWatchedChannel.value = current
        }
        _selectedChannel.value = channel
        if (!keepMiniPlayer) {
            _isMiniPlayer.value = false
        }
        addToRecent(channel)
        playerManager.playStream(channel.streamUrl)
    }

    fun recallPreviousChannel() {
        val prev = _previousWatchedChannel.value ?: return
        selectChannel(prev, keepMiniPlayer = _isMiniPlayer.value)
    }

    fun minimizeToMiniPlayer() {
        if (_selectedChannel.value != null) {
            _isMiniPlayer.value = true
        }
    }

    fun expandFromMiniPlayer() {
        _isMiniPlayer.value = false
    }

    fun cycleSortOrder() {
        _sortOrder.value = when (_sortOrder.value) {
            SortOrder.DEFAULT -> SortOrder.NAME_ASC
            SortOrder.NAME_ASC -> SortOrder.COUNTRY
            SortOrder.COUNTRY -> SortOrder.DEFAULT
        }
    }

    fun playRandomChannel() {
        val currentList = filteredChannels.value
        if (currentList.isNotEmpty()) {
            val currentId = _selectedChannel.value?.id
            val candidates = if (currentList.size > 1) {
                currentList.filter { it.id != currentId }
            } else {
                currentList
            }
            selectChannel(candidates.random())
        }
    }

    private fun addToRecent(channel: Channel) {
        val updated = (listOf(channel.streamUrl) + _recentUrls.value.filter { it != channel.streamUrl })
            .take(MAX_RECENT)
        _recentUrls.value = updated
        prefs.edit().putString(PREF_RECENT, updated.joinToString(RECENT_SEPARATOR)).apply()
    }

    fun clearRecent() {
        _recentUrls.value = emptyList()
        prefs.edit().remove(PREF_RECENT).apply()
    }

    fun closePlayer() {
        autoRetryJob?.cancel()
        autoRetryCount = 0
        _autoRetryAttempt.value = 0
        _isMiniPlayer.value = false
        _selectedChannel.value = null
        playerManager.getPlayer().stop()
    }

    fun togglePlayPause() {
        playerManager.togglePlayPause()
    }

    fun cycleResizeMode() {
        playerManager.cycleResizeMode()
    }

    /** Manual retry from the error overlay: fully reloads the stream. */
    fun retry() {
        autoRetryJob?.cancel()
        autoRetryCount = 0
        _autoRetryAttempt.value = 0
        _selectedChannel.value?.let {
            playerManager.playStream(it.streamUrl)
        } ?: playerManager.retry()
    }

    fun playNextChannel() {
        val currentList = filteredChannels.value
        val current = _selectedChannel.value ?: return
        if (currentList.isEmpty()) return
        val currentIndex = currentList.indexOfFirst { it.id == current.id }
        val nextIndex = if (currentIndex == -1) 0 else (currentIndex + 1) % currentList.size
        selectChannel(currentList[nextIndex])
    }

    fun playPreviousChannel() {
        val currentList = filteredChannels.value
        val current = _selectedChannel.value ?: return
        if (currentList.isEmpty()) return
        val currentIndex = currentList.indexOfFirst { it.id == current.id }
        val prevIndex = when {
            currentIndex == -1 -> 0
            currentIndex - 1 < 0 -> currentList.size - 1
            else -> currentIndex - 1
        }
        selectChannel(currentList[prevIndex])
    }

    fun setSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun setSelectedCategory(category: String) {
        _selectedCategory.value = category
    }

    fun toggleFavorite(channelId: String) {
        _rawChannels.value = _rawChannels.value.map { channel ->
            if (channel.id == channelId) {
                val newFav = !channel.isFavorite
                if (newFav) {
                    favoriteKeys.add(channel.id)
                    favoriteKeys.add(channel.streamUrl)
                    if (channel.id !in _favoriteOrder.value) {
                        val updatedOrder = _favoriteOrder.value + channel.id
                        _favoriteOrder.value = updatedOrder
                        prefs.edit().putString(PREF_FAVORITE_ORDER, updatedOrder.joinToString(RECENT_SEPARATOR)).apply()
                    }
                } else {
                    favoriteKeys.remove(channel.id)
                    favoriteKeys.remove(channel.streamUrl)
                    val updatedOrder = _favoriteOrder.value.filter { it != channel.id }
                    _favoriteOrder.value = updatedOrder
                    prefs.edit().putString(PREF_FAVORITE_ORDER, updatedOrder.joinToString(RECENT_SEPARATOR)).apply()
                }
                saveFavorites()
                val updated = channel.copy(isFavorite = newFav)
                if (_selectedChannel.value?.id == channelId) {
                    _selectedChannel.value = updated
                }
                updated
            } else {
                channel
            }
        }
    }

    fun toggleCurrentFavorite() {
        _selectedChannel.value?.let { toggleFavorite(it.id) }
    }

    fun clearFavorites() {
        favoriteKeys.clear()
        saveFavorites()
        _favoriteOrder.value = emptyList()
        prefs.edit().remove(PREF_FAVORITE_ORDER).apply()
        _rawChannels.value = _rawChannels.value.map { it.copy(isFavorite = false) }
        _selectedChannel.value = _selectedChannel.value?.copy(isFavorite = false)
    }

    // --- Favorite Ranking / Reordering ---

    fun moveFavorite(fromIndex: Int, toIndex: Int) {
        val current = _favoriteOrder.value.toMutableList()
        if (fromIndex in current.indices && toIndex in current.indices && fromIndex != toIndex) {
            val item = current.removeAt(fromIndex)
            current.add(toIndex, item)
            _favoriteOrder.value = current
            prefs.edit().putString(PREF_FAVORITE_ORDER, current.joinToString(RECENT_SEPARATOR)).apply()
        }
    }

    fun moveFavoriteUp(channelId: String) {
        val current = _favoriteOrder.value.toMutableList()
        val index = current.indexOf(channelId)
        if (index > 0) {
            val item = current.removeAt(index)
            current.add(index - 1, item)
            _favoriteOrder.value = current
            prefs.edit().putString(PREF_FAVORITE_ORDER, current.joinToString(RECENT_SEPARATOR)).apply()
        }
    }

    fun moveFavoriteDown(channelId: String) {
        val current = _favoriteOrder.value.toMutableList()
        val index = current.indexOf(channelId)
        if (index in 0 until current.size - 1) {
            val item = current.removeAt(index)
            current.add(index + 1, item)
            _favoriteOrder.value = current
            prefs.edit().putString(PREF_FAVORITE_ORDER, current.joinToString(RECENT_SEPARATOR)).apply()
        }
    }

    fun moveFavoriteToTop(channelId: String) {
        val current = _favoriteOrder.value.toMutableList()
        val index = current.indexOf(channelId)
        if (index > 0) {
            val item = current.removeAt(index)
            current.add(0, item)
            _favoriteOrder.value = current
            prefs.edit().putString(PREF_FAVORITE_ORDER, current.joinToString(RECENT_SEPARATOR)).apply()
        }
    }

    fun resetFavoriteOrder() {
        val favs = _rawChannels.value.filter { it.isFavorite }
        val sorted = favs.sortedBy { it.name.lowercase() }.map { it.id }
        _favoriteOrder.value = sorted
        prefs.edit().putString(PREF_FAVORITE_ORDER, sorted.joinToString(RECENT_SEPARATOR)).apply()
    }

    // --- Category Rearranging ---

    fun moveCategory(fromIndex: Int, toIndex: Int) {
        val current = categories.value.toMutableList()
        if (fromIndex in current.indices && toIndex in current.indices && fromIndex != toIndex) {
            val item = current.removeAt(fromIndex)
            current.add(toIndex, item)
            _customCategoryOrder.value = current
            prefs.edit().putString(PREF_CATEGORY_ORDER, current.joinToString(RECENT_SEPARATOR)).apply()
        }
    }

    fun moveCategoryUp(category: String) {
        val current = categories.value.toMutableList()
        val index = current.indexOf(category)
        if (index > 0) {
            val item = current.removeAt(index)
            current.add(index - 1, item)
            _customCategoryOrder.value = current
            prefs.edit().putString(PREF_CATEGORY_ORDER, current.joinToString(RECENT_SEPARATOR)).apply()
        }
    }

    fun moveCategoryDown(category: String) {
        val current = categories.value.toMutableList()
        val index = current.indexOf(category)
        if (index in 0 until current.size - 1) {
            val item = current.removeAt(index)
            current.add(index + 1, item)
            _customCategoryOrder.value = current
            prefs.edit().putString(PREF_CATEGORY_ORDER, current.joinToString(RECENT_SEPARATOR)).apply()
        }
    }

    fun moveCategoryToFirst(category: String) {
        val current = categories.value.toMutableList()
        val index = current.indexOf(category)
        if (index > 0) {
            val item = current.removeAt(index)
            val target = if (current.firstOrNull() == CATEGORY_ALL && category != CATEGORY_ALL) 1 else 0
            current.add(target, item)
            _customCategoryOrder.value = current
            prefs.edit().putString(PREF_CATEGORY_ORDER, current.joinToString(RECENT_SEPARATOR)).apply()
        }
    }

    fun resetCategoryOrder() {
        _customCategoryOrder.value = emptyList()
        prefs.edit().remove(PREF_CATEGORY_ORDER).apply()
    }

    /**
     * Hides a broken/unwanted channel from every list and jumps to the next channel
     * if it is currently playing.
     */
    fun hideChannel(channel: Channel) {
        val wasPlaying = _selectedChannel.value?.id == channel.id
        val listBefore = filteredChannels.value
        val index = listBefore.indexOfFirst { it.id == channel.id }

        val updated = _hiddenUrls.value + channel.streamUrl
        _hiddenUrls.value = updated
        prefs.edit().putStringSet(PREF_HIDDEN, updated).apply()

        if (wasPlaying) {
            val remaining = listBefore.filter { it.id != channel.id }
            if (remaining.isEmpty()) {
                closePlayer()
            } else {
                val nextIndex = if (index == -1) 0 else index.coerceAtMost(remaining.size - 1)
                selectChannel(remaining[nextIndex])
            }
        }
    }

    fun restoreHiddenChannels() {
        _hiddenUrls.value = emptySet()
        prefs.edit().remove(PREF_HIDDEN).apply()
    }

    // --- Sleep timer ---

    fun setSleepTimer(minutes: Int?) {
        sleepTimerJob?.cancel()
        if (minutes == null || minutes <= 0) {
            _sleepTimerRemainingMs.value = null
            return
        }
        val endAt = System.currentTimeMillis() + minutes * 60_000L
        sleepTimerJob = viewModelScope.launch {
            while (true) {
                val remaining = endAt - System.currentTimeMillis()
                if (remaining <= 0) break
                _sleepTimerRemainingMs.value = remaining
                delay(1_000)
            }
            _sleepTimerRemainingMs.value = null
            closePlayer()
        }
    }

    fun addCustomChannel(name: String, url: String, category: String) {
        val newChannel = Channel(
            id = UUID.randomUUID().toString(),
            name = name.ifBlank { "Custom Live Channel" },
            streamUrl = url.trim(),
            category = category.ifBlank { "Custom" },
            isCustom = true
        )
        _rawChannels.value = listOf(newChannel) + _rawChannels.value
        _totalChannelCount.value = _rawChannels.value.size
        selectChannel(newChannel)
    }

    fun loadM3UPlaylist(url: String) {
        viewModelScope.launch {
            _isLoadingPlaylist.value = true
            _playlistError.value = null
            try {
                val parsed = M3UParser.parseFromUrl(url.trim())
                if (parsed.isEmpty()) {
                    _playlistError.value = "No playable channels found in this playlist."
                } else {
                    _rawChannels.value = parsed.map { it.copy(isFavorite = isChannelFavorite(it)) } +
                            _rawChannels.value
                    _totalChannelCount.value = _rawChannels.value.size
                }
            } catch (e: Exception) {
                _playlistError.value = "Failed to load playlist: ${e.localizedMessage ?: "Unknown error"}"
            } finally {
                _isLoadingPlaylist.value = false
            }
        }
    }

    fun clearPlaylistError() {
        _playlistError.value = null
    }

    override fun onCleared() {
        super.onCleared()
        sleepTimerJob?.cancel()
        autoRetryJob?.cancel()
        playerManager.release()
    }
}
