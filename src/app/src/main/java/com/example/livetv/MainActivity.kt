package com.example.livetv

import android.annotation.SuppressLint
import android.app.PictureInPictureParams
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.util.Rational
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.activity.ComponentActivity
import java.io.InputStream
import java.net.HttpURLConnection
import java.net.URL
import com.example.livetv.services.KeyNavigationService
import com.example.livetv.services.NativeBridgeService
import com.example.livetv.services.WindowModeService

class MainActivity : ComponentActivity() {

    private lateinit var rootContainer: FrameLayout
    private lateinit var webView: WebView
    private lateinit var fullscreenContainer: FrameLayout

    private lateinit var windowModeService: WindowModeService
    private lateinit var nativeBridgeService: NativeBridgeService
    private lateinit var keyNavigationService: KeyNavigationService

    private var customView: View? = null
    private var customViewCallback: WebChromeClient.CustomViewCallback? = null
    private var isInPipMode: Boolean = false

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        WebView.setWebContentsDebuggingEnabled(true)

        // Keep screen awake while Live TV is playing
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        window.statusBarColor = Color.parseColor("#0a0c10")
        window.navigationBarColor = Color.parseColor("#0a0c10")

        rootContainer = FrameLayout(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#0a0c10"))
        }

        fullscreenContainer = FrameLayout(this).apply {
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.BLACK)
            visibility = View.GONE
        }

        webView = WebView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
            setBackgroundColor(Color.parseColor("#0a0c10"))
            setLayerType(View.LAYER_TYPE_HARDWARE, null)
        }

        configureWebSettings(webView.settings)

        windowModeService = WindowModeService(this)
        nativeBridgeService = NativeBridgeService(this, windowModeService)
        keyNavigationService = KeyNavigationService(webView)

        // Native Android Bridge for WebKit JS calls
        webView.addJavascriptInterface(nativeBridgeService, "AndroidBridge")

        setupWebChromeClient()
        setupWebViewClient()

        rootContainer.addView(webView)
        rootContainer.addView(fullscreenContainer)
        setContentView(rootContainer)

        // Load the full Live TV application with zero CORS restriction
        webView.loadUrl("file:///android_asset/web/index.html")
    }

    @Suppress("DEPRECATION")
    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebSettings(settings: WebSettings) {
        settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = true
            allowContentAccess = true
            allowFileAccessFromFileURLs = true
            allowUniversalAccessFromFileURLs = true
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
            useWideViewPort = true
            loadWithOverviewMode = true
            setSupportZoom(false)
            builtInZoomControls = false
            displayZoomControls = false
            cacheMode = WebSettings.LOAD_DEFAULT
            userAgentString = "Mozilla/5.0 (Linux; Android 14; Pixel Tablet) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 LiveTV-Android/5.1.8"
        }
    }

    private fun setupWebChromeClient() {
        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowCustomView(view: View?, callback: CustomViewCallback?) {
                if (customView != null) {
                    onHideCustomView()
                    return
                }
                customView = view
                customViewCallback = callback
                webView.visibility = View.GONE
                fullscreenContainer.apply {
                    removeAllViews()
                    addView(view)
                    visibility = View.VISIBLE
                }
            }

            override fun onHideCustomView() {
                if (customView == null) return
                fullscreenContainer.apply {
                    removeAllViews()
                    visibility = View.GONE
                }
                customView = null
                customViewCallback?.onCustomViewHidden()
                customViewCallback = null
                webView.visibility = View.VISIBLE
            }

            override fun onPermissionRequest(request: PermissionRequest) {
                // Grant microphone permission for voice assistant search
                request.grant(request.resources)
            }

            override fun onConsoleMessage(consoleMessage: ConsoleMessage): Boolean {
                Log.d(
                    "LiveTV-Web",
                    "${consoleMessage.message()} [${consoleMessage.sourceId()}:${consoleMessage.lineNumber()}]"
                )
                return true
            }
        }
    }

    private fun setupWebViewClient() {
        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ): WebResourceResponse? {
                val urlStr = request.url.toString()

                // If an external media stream or API is requested, add CORS headers to prevent browser blocking
                if (urlStr.startsWith("http://") || urlStr.startsWith("https://")) {
                    if (urlStr.contains(".m3u8") || urlStr.contains(".ts") ||
                        urlStr.contains(".m4s") || urlStr.contains(".mpd") ||
                        urlStr.contains("fancode.json")
                    ) {
                        try {
                            val conn = (URL(urlStr).openConnection() as HttpURLConnection).apply {
                                requestMethod = request.method
                                connectTimeout = 7000
                                readTimeout = 7000
                                request.requestHeaders?.forEach { (k, v) ->
                                    if (!k.equals("Host", ignoreCase = true)) {
                                        setRequestProperty(k, v)
                                    }
                                }
                            }
                            conn.connect()
                            val responseCode = conn.responseCode
                            if (responseCode in 200..299) {
                                val contentType = conn.contentType ?: "application/octet-stream"
                                val mimeType = contentType.split(";")[0].trim()
                                val encoding = if (contentType.contains("charset=")) {
                                    contentType.substringAfter("charset=").trim()
                                } else "utf-8"

                                val responseHeaders = mutableMapOf<String, String>()
                                responseHeaders["Access-Control-Allow-Origin"] = "*"
                                responseHeaders["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, HEAD"
                                responseHeaders["Access-Control-Allow-Headers"] = "*"

                                return WebResourceResponse(
                                    mimeType,
                                    encoding,
                                    responseCode,
                                    conn.responseMessage ?: "OK",
                                    responseHeaders,
                                    conn.inputStream
                                )
                            }
                        } catch (e: Exception) {
                            // Fallback to default WebView loader if interception fails
                        }
                    }
                }
                return super.shouldInterceptRequest(view, request)
            }

            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest
            ): Boolean {
                val urlStr = request.url.toString()
                if (urlStr.startsWith("file:///android_asset")) {
                    return false
                }
                // Open external websites (e.g. GitHub releases) in native browser
                if (urlStr.startsWith("http://") || urlStr.startsWith("https://")) {
                    if (!urlStr.contains(".m3u8") && !urlStr.contains(".mpd") && !urlStr.contains(".ts")) {
                        try {
                            startActivity(Intent(Intent.ACTION_VIEW, request.url))
                            return true
                        } catch (e: Exception) {
                            Log.e("LiveTV", "Error opening external url", e)
                        }
                    }
                }
                return false
            }

            override fun onPageFinished(view: WebView, url: String) {
                super.onPageFinished(view, url)
                injectAndroidCompatibilityLayer(view)
            }
        }
    }

    private fun injectAndroidCompatibilityLayer(view: WebView) {
        val script = """
            (function() {
                // Bridge macOS WebKit message handlers to AndroidBridge
                window.webkit = window.webkit || {};
                window.webkit.messageHandlers = window.webkit.messageHandlers || {};

                window.webkit.messageHandlers.consoleLog = {
                    postMessage: function(msg) {
                        if (window.AndroidBridge && window.AndroidBridge.log) {
                            window.AndroidBridge.log(typeof msg === 'string' ? msg : JSON.stringify(msg));
                        }
                    }
                };
                window.webkit.messageHandlers.openExternalUrl = {
                    postMessage: function(url) {
                        if (window.AndroidBridge && window.AndroidBridge.openExternalUrl) {
                            window.AndroidBridge.openExternalUrl(url);
                        }
                    }
                };
                window.webkit.messageHandlers.togglePictureInPicture = {
                    postMessage: function() {
                        if (window.AndroidBridge && window.AndroidBridge.togglePiP) {
                            window.AndroidBridge.togglePiP();
                        }
                    }
                };
                window.webkit.messageHandlers.savePreferences = {
                    postMessage: function(json) {
                        if (window.AndroidBridge && window.AndroidBridge.savePreferences) {
                            window.AndroidBridge.savePreferences(typeof json === 'string' ? json : JSON.stringify(json));
                        }
                    }
                };

                document.body.classList.add('platform-android');

                // Style refinement for Android edge-to-edge screens
                if (!document.getElementById('livetv-android-style')) {
                    var style = document.createElement('style');
                    style.id = 'livetv-android-style';
                    style.textContent = `
                        body.platform-android .app-header {
                            padding-left: 14px !important;
                        }
                        @media (max-width: 650px) {
                            .channels-grid {
                                grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)) !important;
                            }
                        }
                    `;
                    document.head.appendChild(style);
                }
            })();
        """.trimIndent()
        view.evaluateJavascript(script, null)
    }

    fun enterPiP() {
        windowModeService.enterPiP()
    }

    override fun onUserLeaveHint() {
        super.onUserLeaveHint()
        // Automatically enter PiP when pressing Home if video is playing
        webView.evaluateJavascript(
            """
            (function() {
                var v = document.getElementById('video-player');
                return (v && !v.paused && v.currentTime > 0);
            })();
            """.trimIndent()
        ) { isPlaying ->
            if (isPlaying == "true") {
                enterPiP()
            }
        }
    }

    override fun onPictureInPictureModeChanged(
        isInPictureInPictureMode: Boolean,
        newConfig: Configuration
    ) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
        isInPipMode = isInPictureInPictureMode
        val script = if (isInPictureInPictureMode) {
            "document.body.classList.add('pip-mode-active');"
        } else {
            "document.body.classList.remove('pip-mode-active');"
        }
        webView.evaluateJavascript(script, null)
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        // Forward back button: first close any open modal, then close player, or exit
        webView.evaluateJavascript(
            """
            (function() {
                // 1. Check open modals
                var openModals = document.querySelectorAll('.modal-overlay:not([style*="display: none"]), .modal:not([style*="display: none"])');
                if (openModals.length > 0) {
                    openModals.forEach(function(m) {
                        m.style.display = 'none';
                    });
                    return true;
                }
                // 2. Check full video player
                var playerOverlay = document.getElementById('player-overlay');
                if (playerOverlay && playerOverlay.style.display !== 'none') {
                    if (window.closePlayer) {
                        window.closePlayer();
                    } else {
                        playerOverlay.style.display = 'none';
                    }
                    return true;
                }
                return false;
            })();
            """.trimIndent()
        ) { handled ->
            if (handled != "true") {
                @Suppress("DEPRECATION")
                super.onBackPressed()
            }
        }
    }

    /**
     * TV remote, D-pad, and BlueStacks hardware keyboard shortcuts
     */
    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (keyNavigationService.handleKeyEvent(event)) {
            return true
        }
        return super.dispatchKeyEvent(event)
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }
}
