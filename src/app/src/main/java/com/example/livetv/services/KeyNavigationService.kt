package com.example.livetv.services

import android.view.KeyEvent
import android.webkit.WebView

/**
 * Live TV - Key Navigation Microservice
 * Architecture: Service / KeyNavigationService
 * Responsibility: TV remote control, D-pad, and media key navigation.
 */
class KeyNavigationService(private val webView: WebView) {

    fun handleKeyEvent(event: KeyEvent): Boolean {
        if (event.action == KeyEvent.ACTION_DOWN) {
            when (event.keyCode) {
                KeyEvent.KEYCODE_CHANNEL_UP,
                KeyEvent.KEYCODE_PAGE_UP -> {
                    webView.evaluateJavascript("window.playPrevChannel && window.playPrevChannel();", null)
                    return true
                }
                KeyEvent.KEYCODE_CHANNEL_DOWN,
                KeyEvent.KEYCODE_PAGE_DOWN -> {
                    webView.evaluateJavascript("window.playNextChannel && window.playNextChannel();", null)
                    return true
                }
                KeyEvent.KEYCODE_MEDIA_NEXT -> {
                    webView.evaluateJavascript("window.playNextChannel && window.playNextChannel();", null)
                    return true
                }
                KeyEvent.KEYCODE_MEDIA_PREVIOUS -> {
                    webView.evaluateJavascript("window.playPrevChannel && window.playPrevChannel();", null)
                    return true
                }
                KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE,
                KeyEvent.KEYCODE_MEDIA_PLAY,
                KeyEvent.KEYCODE_MEDIA_PAUSE -> {
                    webView.evaluateJavascript(
                        """
                        (function() {
                            var v = document.getElementById('video-player');
                            if (v) { if (v.paused) v.play(); else v.pause(); }
                        })();
                        """.trimIndent(), null
                    )
                    return true
                }
            }
        }
        return false
    }
}
