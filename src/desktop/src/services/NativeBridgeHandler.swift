import Cocoa
import WebKit

public class NativeBridgeHandler: NSObject, WKScriptMessageHandler {
    public weak var windowController: WindowController?
    public weak var webView: WKWebView?
    public var preferencesFileURL: URL

    public init(windowController: WindowController?, webView: WKWebView?, preferencesFileURL: URL) {
        self.windowController = windowController
        self.webView = webView
        self.preferencesFileURL = preferencesFileURL
        super.init()
    }

    public func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let winController = windowController else { return }

        switch message.name {
        case "savePreferences":
            if let body = message.body as? String {
                try? body.write(to: preferencesFileURL, atomically: true, encoding: .utf8)
            }

        case "consoleLog":
            if let body = message.body as? String {
                print("[WebKit JS] \(body)")
                fflush(stdout)
            }

        case "startWindowDrag":
            winController.startWindowDrag()

        case "moveWindow":
            if let dict = message.body as? [String: Any],
               let dx = dict["dx"] as? Double,
               let dy = dict["dy"] as? Double {
                winController.moveWindow(dx: dx, dy: dy)
            }

        case "zoomWindow":
            winController.zoomWindow()

        case "openExternalUrl":
            if let urlString = message.body as? String, let url = URL(string: urlString) {
                NSWorkspace.shared.open(url)
            }

        case "setAlwaysOnTop":
            if let onTop = message.body as? Bool {
                winController.setAlwaysOnTop(onTop)
            }

        case "togglePictureInPicture":
            winController.togglePictureInPictureMode()

        case "resizeWindowDelta":
            if let dict = message.body as? [String: Any],
               let dx = dict["dx"] as? Double,
               let dy = dict["dy"] as? Double {
                winController.resizePipWindowByDelta(dx: CGFloat(dx), dy: CGFloat(dy))
            }

        case "startAppUpdate":
            if let dict = message.body as? [String: Any], let targetView = webView {
                let urlString = dict["url"] as? String ?? ""
                let version = dict["version"] as? String ?? "latest"
                AppUpdater.shared.startUpdate(downloadUrlString: urlString, version: version, webView: targetView)
            }

        case "cancelAppUpdate":
            AppUpdater.shared.cancelUpdate()

        case "restartApp":
            AppUpdater.shared.restartAppNow()

        case "getRemoteServerInfo":
            let ip = getLocalIPAddress()
            let host = getLocalHostName()
            let port = RemoteServer.shared.port
            let ipUrl = "http://\(ip):\(port)"
            let hostUrl = "http://\(host):\(port)"
            let ipSvg = generateQRCodeSVG(from: ipUrl)
            let hostSvg = generateQRCodeSVG(from: hostUrl)
            let escapedIpSvg = ipSvg.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "\"", with: "\\\"").replacingOccurrences(of: "\n", with: "")
            let escapedHostSvg = hostSvg.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "\"", with: "\\\"").replacingOccurrences(of: "\n", with: "")
            let js = "window.setRemoteServerInfo && window.setRemoteServerInfo({ ip: '\(ip)', host: '\(host)', port: \(port), ipUrl: '\(ipUrl)', hostUrl: '\(hostUrl)', url: '\(hostUrl)', svg: \"\(escapedHostSvg)\", ipSvg: \"\(escapedIpSvg)\" });"
            webView?.evaluateJavaScript(js, completionHandler: nil)

        case "updateRemoteStatus":
            if let jsonStr = message.body as? String {
                RemoteServer.shared.updateStatus(json: jsonStr)
            }

        case "updateRemoteChannels":
            if let jsonStr = message.body as? String {
                RemoteServer.shared.updateChannels(json: jsonStr)
            }

        default:
            break
        }
    }
}
