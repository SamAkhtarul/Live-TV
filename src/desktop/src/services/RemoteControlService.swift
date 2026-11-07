import Cocoa
import WebKit
import Network

class RemoteServer {
    static let shared = RemoteServer()
    private var listener: NWListener?
    private var pathMonitor: NWPathMonitor?
    private var lastKnownIP: String = ""
    var port: UInt16 = 8998
    weak var webView: WKWebView?
    private var currentStatusJSON: String = "{\"channelName\":\"Live TV\",\"isPlaying\":true,\"volume\":100,\"isMuted\":false}"
    private var currentChannelsJSON: String = "[]"
    private var currentProgressJSON: String = "null"

    func start(port: UInt16 = 8998, webView: WKWebView) {
        self.port = port
        self.webView = webView
        preloadChannelsIfAvailable()
        do {
            let tcpOptions = NWProtocolTCP.Options()
            let params = NWParameters(tls: nil, tcp: tcpOptions)
            params.allowLocalEndpointReuse = true
            listener = try NWListener(using: params, on: NWEndpoint.Port(rawValue: port)!)
            listener?.service = NWListener.Service(name: "Live TV Remote", type: "_http._tcp")
            listener?.stateUpdateHandler = { state in
                switch state {
                case .ready:
                    print("[RemoteServer] TV Remote Server listening on http://\(getLocalIPAddress()):\(self.port)")
                case .failed(let err):
                    print("[RemoteServer] Listener failed: \(err)")
                default: break
                }
            }
            listener?.newConnectionHandler = { [weak self] connection in
                self?.handleConnection(connection)
            }
            listener?.start(queue: .main)
            startNetworkMonitoring()
        } catch {
            print("[RemoteServer] Failed to bind port \(port): \(error)")
        }
    }

    private func startNetworkMonitoring() {
        lastKnownIP = getLocalIPAddress()
        pathMonitor = NWPathMonitor()
        pathMonitor?.pathUpdateHandler = { [weak self] path in
            guard let self = self else { return }
            let newIP = getLocalIPAddress()
            if !self.lastKnownIP.isEmpty && self.lastKnownIP != newIP {
                print("[RemoteServer] Network IP changed from \(self.lastKnownIP) to \(newIP)")
                self.lastKnownIP = newIP
                DispatchQueue.main.async {
                    self.webView?.evaluateJavaScript("window.onNetworkIpChanged && window.onNetworkIpChanged('\(newIP)')", completionHandler: nil)
                }
            } else {
                self.lastKnownIP = newIP
            }
        }
        let queue = DispatchQueue(label: "com.livetv.pathmonitor")
        pathMonitor?.start(queue: queue)
    }

    private func preloadChannelsIfAvailable() {
        if currentChannelsJSON != "[]" { return }
        let candidatePaths = [
            Bundle.main.url(forResource: "channels", withExtension: "json", subdirectory: "web")?.path,
            Bundle.main.resourcePath.map { "\($0)/web/channels.json" },
            "desktop/web/channels.json"
        ].compactMap { $0 }
        for p in candidatePaths {
            if FileManager.default.fileExists(atPath: p),
               let data = try? Data(contentsOf: URL(fileURLWithPath: p)),
               let json = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] {
                let mapped = json.map { ch -> [String: Any] in
                    return [
                        "id": ch["id"] ?? "",
                        "name": ch["name"] ?? "",
                        "category": ch["category"] ?? "General",
                        "logo": ch["logoUrl"] ?? "",
                        "ch": 0,
                        "fav": false,
                        "url": ch["streamUrl"] ?? ""
                    ]
                }
                if let mappedData = try? JSONSerialization.data(withJSONObject: mapped),
                   let mappedStr = String(data: mappedData, encoding: .utf8) {
                    self.currentChannelsJSON = mappedStr
                    break
                }
            }
        }
    }

    func updateStatus(json: String) {
        self.currentStatusJSON = json
    }

    func updateChannels(json: String) {
        self.currentChannelsJSON = json
    }

    func updateProgress(stage: String, percent: Int, text: String) {
        let escaped = text.replacingOccurrences(of: "\\", with: "\\\\").replacingOccurrences(of: "\"", with: "\\\"")
        self.currentProgressJSON = "{\"stage\":\"\(stage)\",\"percent\":\(percent),\"text\":\"\(escaped)\"}"
    }

    private func handleConnection(_ connection: NWConnection) {
        connection.start(queue: .main)
        connection.receive(minimumIncompleteLength: 1, maximumLength: 65536) { [weak self] data, _, _, _ in
            guard let self = self, let data = data, let reqStr = String(data: data, encoding: .utf8) else {
                connection.cancel()
                return
            }
            self.routeRequest(reqStr, connection: connection)
        }
    }

    private func routeRequest(_ req: String, connection: NWConnection) {
        let lines = req.components(separatedBy: "\r\n")
        guard let firstLine = lines.first else {
            sendResponse(connection: connection, status: "400 Bad Request", contentType: "text/plain", body: "Bad Request")
            return
        }
        let parts = firstLine.components(separatedBy: " ")
        guard parts.count >= 2 else {
            sendResponse(connection: connection, status: "400 Bad Request", contentType: "text/plain", body: "Bad Request")
            return
        }
        let path = parts[1]

        if path.hasPrefix("/api/cmd") {
            var action = ""
            var param = ""
            if let queryIndex = path.firstIndex(of: "?") {
                let query = String(path[path.index(after: queryIndex)...])
                for pair in query.components(separatedBy: "&") {
                    let kv = pair.components(separatedBy: "=")
                    if kv.count == 2 {
                        let key = kv[0]
                        let val = kv[1].removingPercentEncoding ?? kv[1]
                        if key == "action" { action = val }
                        if key == "param" || key == "id" || key == "num" { param = val }
                    }
                }
            }
            if !action.isEmpty {
                let safeAction = action.replacingOccurrences(of: "'", with: "\\'")
                let safeParam = param.replacingOccurrences(of: "'", with: "\\'")
                DispatchQueue.main.async { [weak self] in
                    if safeAction == "start_update" {
                        self?.webView?.evaluateJavaScript("window.checkForAppUpdates && window.checkForAppUpdates(true)", completionHandler: nil)
                    } else if safeAction == "check_update" {
                        self?.webView?.evaluateJavaScript("window.checkForAppUpdates && window.checkForAppUpdates(false)", completionHandler: nil)
                    } else {
                        self?.webView?.evaluateJavaScript("window.handleRemoteCommand && window.handleRemoteCommand('\(safeAction)', '\(safeParam)')", completionHandler: nil)
                    }
                }
            }
            sendResponse(connection: connection, status: "200 OK", contentType: "application/json", body: "{\"ok\":true}", noCache: true)
        } else if path.hasPrefix("/stream/") {
            let chId = String(path.dropFirst("/stream/".count))
            let html = """
            <!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Live TV Smart Stream</title><style>body{margin:0;background:#000;display:flex;align-items:center;justify-content:center;height:100vh;}video{width:100vw;height:100vh;object-fit:contain;}</style></head><body><video src="" controls autoplay playsinline id="tv"></video><script>fetch('/api/channels').then(r=>r.json()).then(channels=>{const ch=channels.find(c=>c.id==='\(chId)')||channels[0];if(ch&&ch.url){document.getElementById('tv').src=ch.url;}});</script></body></html>
            """
            sendResponse(connection: connection, status: "200 OK", contentType: "text/html; charset=utf-8", body: html, noCache: true)
        } else if path.hasPrefix("/api/status") {
            var body = currentStatusJSON
            let ip = getLocalIPAddress()
            let host = getLocalHostName()
            if body.hasSuffix("}") {
                body = String(body.dropLast()) + ",\"progress\":" + currentProgressJSON + ",\"ip\":\"" + ip + "\",\"hostname\":\"" + host + "\",\"port\":" + String(port) + "}"
            }
            sendResponse(connection: connection, status: "200 OK", contentType: "application/json", body: body, noCache: true)
        } else if path.hasPrefix("/api/channels") {
            sendResponse(connection: connection, status: "200 OK", contentType: "application/json", body: currentChannelsJSON, noCache: true)
        } else if path.hasPrefix("/icon.png") || path.hasPrefix("/favicon.png") {
            let candidatePaths = [
                Bundle.main.url(forResource: "icon", withExtension: "png", subdirectory: "web")?.path,
                Bundle.main.resourcePath.map { "\($0)/web/icon.png" },
                Bundle.main.resourcePath.map { "\($0)/desktop/web/icon.png" },
                "desktop/web/icon.png",
                "web/icon.png"
            ].compactMap { $0 }

            var iconData: Data? = nil
            for p in candidatePaths {
                if FileManager.default.fileExists(atPath: p), let d = try? Data(contentsOf: URL(fileURLWithPath: p)) {
                    iconData = d
                    break
                }
            }
            if let data = iconData {
                sendResponseData(connection: connection, status: "200 OK", contentType: "image/png", data: data, noCache: false)
            } else {
                sendResponse(connection: connection, status: "404 Not Found", contentType: "text/plain", body: "Not found", noCache: true)
            }
        } else if path.hasPrefix("/js/hls.min.js") || path.hasPrefix("/hls.min.js") {
            let candidatePaths = [
                Bundle.main.url(forResource: "hls.min", withExtension: "js", subdirectory: "web/js")?.path,
                Bundle.main.resourcePath.map { "\($0)/web/js/hls.min.js" },
                Bundle.main.resourcePath.map { "\($0)/desktop/web/js/hls.min.js" },
                "desktop/web/js/hls.min.js",
                "web/js/hls.min.js"
            ].compactMap { $0 }

            var jsData: Data? = nil
            for p in candidatePaths {
                if FileManager.default.fileExists(atPath: p), let d = try? Data(contentsOf: URL(fileURLWithPath: p)) {
                    jsData = d
                    break
                }
            }
            if let data = jsData {
                sendResponseData(connection: connection, status: "200 OK", contentType: "application/javascript; charset=utf-8", data: data, noCache: false)
            } else {
                sendResponse(connection: connection, status: "404 Not Found", contentType: "text/plain", body: "Not found", noCache: true)
            }
        } else {
            sendResponse(connection: connection, status: "200 OK", contentType: "text/html; charset=utf-8", body: RemoteControlTemplate.html, noCache: true)
        }
    }

    private func sendResponseData(connection: NWConnection, status: String, contentType: String, data: Data, noCache: Bool = false) {
        let cacheHeader = noCache ? "Cache-Control: no-cache, no-store, must-revalidate\r\nPragma: no-cache\r\nExpires: 0" : "Cache-Control: public, max-age=86400"
        let headers = "HTTP/1.1 \(status)\r\nContent-Type: \(contentType)\r\nContent-Length: \(data.count)\r\nAccess-Control-Allow-Origin: *\r\n\(cacheHeader)\r\nConnection: close\r\n\r\n"
        var responseData = headers.data(using: .utf8) ?? Data()
        responseData.append(data)
        connection.send(content: responseData, completion: .contentProcessed({ _ in
            connection.cancel()
        }))
    }

    private func sendResponse(connection: NWConnection, status: String, contentType: String, body: String, noCache: Bool = false) {
        let bodyData = body.data(using: .utf8) ?? Data()
        sendResponseData(connection: connection, status: status, contentType: contentType, data: bodyData, noCache: noCache)
    }


}
