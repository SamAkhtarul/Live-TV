import Cocoa
import WebKit

public class WebViewController: NSObject, WKNavigationDelegate, WKUIDelegate {
    public var webView: WKWebView!

    public func setupWebView(frame: NSRect, scriptHandler: WKScriptMessageHandler, savedPrefsJSON: String) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        config.setValue(true, forKey: "allowUniversalAccessFromFileURLs")
        config.preferences.setValue(true, forKey: "developerExtrasEnabled")
        config.preferences.setValue(true, forKey: "acceleratedDrawingEnabled")
        config.preferences.setValue(true, forKey: "canvasUsesAcceleratedDrawing")
        if #available(macOS 12.3, *) {
            config.preferences.isElementFullscreenEnabled = true
        } else {
            config.preferences.setValue(true, forKey: "fullScreenEnabled")
        }
        config.allowsAirPlayForMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        config.websiteDataStore = WKWebsiteDataStore.default()

        // User Content Controller & Bridge Handlers
        let contentController = WKUserContentController()
        let handlers = [
            "savePreferences", "consoleLog", "startWindowDrag", "moveWindow", "zoomWindow",
            "openExternalUrl", "setAlwaysOnTop", "togglePictureInPicture", "resizeWindowDelta",
            "startAppUpdate", "cancelAppUpdate", "restartApp", "getRemoteServerInfo",
            "updateRemoteStatus", "updateRemoteChannels"
        ]
        for h in handlers {
            contentController.add(scriptHandler, name: h)
        }

        // Saved preferences script
        let initScript = WKUserScript(
            source: "window.__LIVETV_SAVED_PREFERENCES__ = \(savedPrefsJSON);",
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )
        contentController.addUserScript(initScript)

        // AdShield Anti-Popup Script
        let adShieldScript = WKUserScript(
            source: """
            (function() {
                try {
                    window.open = function(url, target, features) {
                        console.log('[AdShield] Blocked popup window.open attempt:', url);
                        return null;
                    };
                    window.alert = function() { return null; };
                    window.confirm = function() { return false; };
                    window.prompt = function() { return null; };
                } catch(e) {}
            })();
            """,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: false
        )
        contentController.addUserScript(adShieldScript)
        config.userContentController = contentController

        webView = WKWebView(frame: frame, configuration: config)
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.autoresizingMask = [.width, .height]
        webView.wantsLayer = true
        webView.layer?.drawsAsynchronously = true
        webView.customUserAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        webView.setValue(false, forKey: "drawsBackground")

        return webView
    }

    public func loadContent() {
        let bundle = Bundle.main
        var loaded = false
        if let resourcePath = bundle.resourcePath {
            let webDir = URL(fileURLWithPath: resourcePath).appendingPathComponent("web")
            let indexUrl = webDir.appendingPathComponent("index.html")
            if FileManager.default.fileExists(atPath: indexUrl.path) {
                webView.loadFileURL(indexUrl, allowingReadAccessTo: webDir)
                loaded = true
            }
        }
        if !loaded {
            let candidates = [
                URL(fileURLWithPath: FileManager.default.currentDirectoryPath).appendingPathComponent("desktop/web/index.html"),
                URL(fileURLWithPath: FileManager.default.currentDirectoryPath).appendingPathComponent("web/index.html")
            ]
            for candidate in candidates {
                if FileManager.default.fileExists(atPath: candidate.path) {
                    webView.loadFileURL(candidate, allowingReadAccessTo: candidate.deletingLastPathComponent())
                    loaded = true
                    break
                }
            }
        }
    }

    // MARK: - WKUIDelegate (Zero-Ad Anti-Popup Enforcement)
    public func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        print("[AdShield] Blocked popup window creation attempt to: \(navigationAction.request.url?.absoluteString ?? "unknown")")
        return nil
    }

    // MARK: - WKNavigationDelegate (Ad Domain Filtering)
    public func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        if let url = navigationAction.request.url {
            let host = url.host?.lowercased() ?? ""
            let blockList = [
                "doubleclick.net", "googlesyndication.com", "popads.net", "adcash.com",
                "propellerads.com", "juicyads.com", "exoclick.com", "trafficjunky.com",
                "adnxs.com", "bet365", "1xbet", "parimatch", "clickadu.com", "adsterra.com",
                "adservice", "popcash", "syndication", "onclick", "popunder"
            ]
            if blockList.contains(where: { host.contains($0) }) {
                print("[AdShield] Denied ad/redirect navigation to: \(url.absoluteString)")
                decisionHandler(.cancel)
                return
            }
        }
        decisionHandler(.allow)
    }
}
