package com.example.livetv.services

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import android.webkit.JavascriptInterface

/**
 * Live TV - Android Native Bridge Microservice
 * Architecture: Service / NativeBridgeService
 * Responsibility: Secure IPC interface exposed to WebView JavaScript context.
 */
class NativeBridgeService(
    private val activity: Activity,
    private val windowModeService: WindowModeService
) {

    @JavascriptInterface
    fun log(msg: String) {
        Log.d("LiveTV-Web", msg)
    }

    @JavascriptInterface
    fun openExternalUrl(url: String) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
            activity.startActivity(intent)
        } catch (e: Exception) {
            Log.e("LiveTV-Bridge", "Failed to open external url: $url", e)
        }
    }

    @JavascriptInterface
    fun togglePiP() {
        activity.runOnUiThread {
            windowModeService.enterPiP()
        }
    }

    @JavascriptInterface
    fun savePreferences(json: String) {
        try {
            val prefs = activity.getSharedPreferences("livetv_prefs", Context.MODE_PRIVATE)
            prefs.edit().putString("preferences_json", json).apply()
        } catch (e: Exception) {
            Log.e("LiveTV-Bridge", "Failed to save preferences", e)
        }
    }

    @JavascriptInterface
    fun getSavedPreferences(): String {
        val prefs = activity.getSharedPreferences("livetv_prefs", Context.MODE_PRIVATE)
        return prefs.getString("preferences_json", "{}") ?: "{}"
    }

    @JavascriptInterface
    fun hapticFeedback(type: String) {
        try {
            val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vm = activity.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vm?.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                activity.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val ms = if (type == "heavy") 40L else 15L
                vibrator?.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                vibrator?.vibrate(20L)
            }
        } catch (e: Exception) {
            Log.w("LiveTV-Bridge", "Haptic feedback unavailable: ${e.message}")
        }
    }

    @JavascriptInterface
    fun downloadUpdateApk(jsonPayload: String) {
        try {
            // Parses payload and opens the APK download link in the system browser / download manager
            var downloadUrl = ""
            if (jsonPayload.startsWith("{")) {
                val obj = org.json.JSONObject(jsonPayload)
                downloadUrl = obj.optString("url", "")
            } else {
                downloadUrl = jsonPayload
            }
            if (downloadUrl.isNotEmpty()) {
                openExternalUrl(downloadUrl)
            }
        } catch (e: Exception) {
            Log.e("LiveTV-Bridge", "Failed triggering APK download: $jsonPayload", e)
        }
    }
}
