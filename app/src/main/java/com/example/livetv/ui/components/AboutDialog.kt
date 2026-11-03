package com.example.livetv.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.LiveTv
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.livetv.ui.theme.AccentRed
import com.example.livetv.ui.theme.DarkSurface
import com.example.livetv.ui.theme.TextPrimary
import com.example.livetv.ui.theme.TextSecondary

@Composable
fun AboutDialog(
    appVersion: String,
    totalChannels: Int,
    favoriteCount: Int,
    recentCount: Int,
    hiddenCount: Int,
    onRestoreHidden: () -> Unit,
    onClearRecent: () -> Unit,
    onClearFavorites: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = DarkSurface,
        icon = {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(RoundedCornerShape(12.dp))
                    .background(AccentRed),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.LiveTv, contentDescription = null, tint = Color.White)
            }
        },
        title = {
            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                Text("Live TV", color = TextPrimary, fontWeight = FontWeight.Black)
                Text(
                    "Version $appVersion",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )
            }
        },
        text = {
            Column(
                modifier = Modifier.verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                StatRow(Icons.Default.LiveTv, "Channels available", totalChannels.toString())
                StatRow(Icons.Default.Star, "Favorites", favoriteCount.toString())
                StatRow(Icons.Default.History, "Recently watched", recentCount.toString())
                StatRow(Icons.Default.Visibility, "Hidden channels", hiddenCount.toString())

                HorizontalDivider(color = Color.White.copy(alpha = 0.1f))

                Text(
                    "Manage",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                OutlinedButton(
                    onClick = onRestoreHidden,
                    enabled = hiddenCount > 0,
                    modifier = Modifier.fillMaxWidth()
                ) { Text("Restore $hiddenCount hidden channel(s)") }
                OutlinedButton(
                    onClick = onClearRecent,
                    enabled = recentCount > 0,
                    modifier = Modifier.fillMaxWidth()
                ) { Text("Clear watch history") }
                OutlinedButton(
                    onClick = onClearFavorites,
                    enabled = favoriteCount > 0,
                    modifier = Modifier.fillMaxWidth()
                ) { Text("Clear all favorites") }

                HorizontalDivider(color = Color.White.copy(alpha = 0.1f))

                Text(
                    "Shortcuts (keyboard / TV remote)",
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                ShortcutRow("Channel ▲ / ▼, Page Up / Down", "Previous / next channel")
                ShortcutRow("↑ / ↓ (full screen)", "Previous / next channel")
                ShortcutRow("Space / Play-Pause", "Pause or resume")
                ShortcutRow("Back / Esc", "Close the player")

                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    "Tip: long-press any channel to favorite or hide it. Streams come from public " +
                            "IPTV sources, so some channels may go offline at times.",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary
                )
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) { Text("Close", color = AccentRed) }
        }
    )
}

@Composable
private fun StatRow(icon: ImageVector, label: String, value: String) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
        Icon(icon, contentDescription = null, tint = TextSecondary, modifier = Modifier.size(18.dp))
        Spacer(modifier = Modifier.width(10.dp))
        Text(label, color = TextSecondary, modifier = Modifier.weight(1f))
        Text(value, color = TextPrimary, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun ShortcutRow(keys: String, action: String) {
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 1.dp)) {
        Text(
            keys,
            style = MaterialTheme.typography.bodySmall,
            color = TextPrimary,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.weight(1f)
        )
        Text(action, style = MaterialTheme.typography.bodySmall, color = TextSecondary)
    }
}

