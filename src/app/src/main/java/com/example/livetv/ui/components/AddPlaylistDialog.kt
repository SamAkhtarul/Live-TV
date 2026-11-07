package com.example.livetv.ui.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Tab
import androidx.compose.material3.TabRow
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.livetv.ui.theme.AccentRed
import com.example.livetv.ui.theme.DarkSurface
import com.example.livetv.ui.theme.LiveBadgeRed
import com.example.livetv.ui.theme.TextPrimary
import com.example.livetv.ui.theme.TextSecondary

@Composable
fun AddPlaylistDialog(
    isLoading: Boolean,
    errorMessage: String?,
    onDismiss: () -> Unit,
    onAddSingleStream: (name: String, url: String, category: String) -> Unit,
    onAddM3UPlaylist: (url: String) -> Unit
) {
    var selectedTab by remember { mutableIntStateOf(0) }

    // Tab 0: Single Stream
    var streamName by remember { mutableStateOf("") }
    var streamUrl by remember { mutableStateOf("") }
    var streamCategory by remember { mutableStateOf("") }

    // Tab 1: M3U URL
    var playlistUrl by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = { if (!isLoading) onDismiss() },
        containerColor = DarkSurface,
        shape = RoundedCornerShape(16.dp),
        title = {
            Text(
                text = "Add Live Streams",
                style = MaterialTheme.typography.titleLarge,
                color = TextPrimary
            )
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                TabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = DarkSurface,
                    contentColor = AccentRed
                ) {
                    Tab(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        text = { Text("Single Channel") }
                    )
                    Tab(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        text = { Text("M3U Playlist") }
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                if (selectedTab == 0) {
                    OutlinedTextField(
                        value = streamName,
                        onValueChange = { streamName = it },
                        label = { Text("Channel Name") },
                        placeholder = { Text("e.g. My TV News") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = streamUrl,
                        onValueChange = { streamUrl = it },
                        label = { Text("Stream URL (.m3u8, .mpd)") },
                        placeholder = { Text("https://example.com/live.m3u8") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    OutlinedTextField(
                        value = streamCategory,
                        onValueChange = { streamCategory = it },
                        label = { Text("Category") },
                        placeholder = { Text("e.g. News, Sports, Custom") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                } else {
                    OutlinedTextField(
                        value = playlistUrl,
                        onValueChange = { playlistUrl = it },
                        label = { Text("M3U / M3U8 Playlist URL") },
                        placeholder = { Text("https://iptv-org.github.io/iptv/...") },
                        singleLine = false,
                        maxLines = 3,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(6.dp))

                    Text(
                        text = "Loads standard IPTV playlists (.m3u, .m3u8) with automatic channel and category grouping.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary
                    )
                }

                if (errorMessage != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = errorMessage,
                        style = MaterialTheme.typography.bodyMedium,
                        color = LiveBadgeRed
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (selectedTab == 0) {
                        if (streamUrl.isNotBlank()) {
                            onAddSingleStream(streamName, streamUrl, streamCategory)
                            onDismiss()
                        }
                    } else {
                        if (playlistUrl.isNotBlank()) {
                            onAddM3UPlaylist(playlistUrl)
                        }
                    }
                },
                enabled = !isLoading && (
                        (selectedTab == 0 && streamUrl.isNotBlank()) ||
                                (selectedTab == 1 && playlistUrl.isNotBlank())
                        ),
                colors = ButtonDefaults.buttonColors(containerColor = AccentRed)
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        color = TextPrimary,
                        modifier = Modifier.width(20.dp).height(20.dp),
                        strokeWidth = 2.dp
                    )
                } else {
                    Text("Add")
                }
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss,
                enabled = !isLoading
            ) {
                Text("Cancel", color = TextSecondary)
            }
        }
    )
}

