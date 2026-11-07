import Cocoa
import WebKit

class AppUpdater: NSObject, URLSessionDownloadDelegate {
    static let shared = AppUpdater()
    weak var webView: WKWebView?
    private var downloadTask: URLSessionDownloadTask?
    private var session: URLSession?
    private var targetVersion: String = ""
    private var isUpdating = false

    func startUpdate(downloadUrlString: String, version: String, webView: WKWebView) {
        guard !isUpdating else { return }
        guard let downloadUrl = URL(string: downloadUrlString) else {
            notifyJS(stage: "error", percent: 0, text: "Invalid download URL")
            return
        }

        self.webView = webView
        self.targetVersion = version
        self.isUpdating = true

        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 60
        config.timeoutIntervalForResource = 900
        session = URLSession(configuration: config, delegate: self, delegateQueue: .main)
        downloadTask = session?.downloadTask(with: downloadUrl)
        downloadTask?.resume()

        notifyJS(stage: "downloading", percent: 0, text: "Connecting to GitHub releases...")
    }

    func cancelUpdate() {
        downloadTask?.cancel()
        downloadTask = nil
        isUpdating = false
        notifyJS(stage: "cancelled", percent: 0, text: "Update cancelled.")
    }

    func restartAppNow() {
        let appBundlePath = Bundle.main.bundlePath
        let pid = ProcessInfo.processInfo.processIdentifier
        let script = "while kill -0 \(pid) 2>/dev/null; do sleep 0.1; done; open \"\(appBundlePath)\""
        let p = Process()
        p.executableURL = URL(fileURLWithPath: "/bin/bash")
        p.arguments = ["-c", script]
        try? p.run()
        NSApp.terminate(nil)
    }

    // URLSessionDownloadDelegate
    func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didWriteData bytesWritten: Int64, totalBytesWritten: Int64, totalBytesExpectedToWrite: Int64) {
        var percent = 0
        if totalBytesExpectedToWrite > 0 {
            percent = min(94, max(1, Int((Double(totalBytesWritten) / Double(totalBytesExpectedToWrite)) * 100)))
        }
        let mbWritten = String(format: "%.1f", Double(totalBytesWritten) / 1_048_576.0)
        let mbTotal = totalBytesExpectedToWrite > 0 ? String(format: "%.1f MB", Double(totalBytesExpectedToWrite) / 1_048_576.0) : "MB"
        notifyJS(stage: "downloading", percent: percent, text: "Downloading v\(targetVersion)... \(mbWritten) / \(mbTotal) (\(percent)%)")
    }

    func urlSession(_ session: URLSession, downloadTask: URLSessionDownloadTask, didFinishDownloadingTo location: URL) {
        notifyJS(stage: "verifying", percent: 96, text: "Verifying and mounting DMG package...")

        let pid = ProcessInfo.processInfo.processIdentifier
        let tempDmg = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent("LiveTV_Update_\(pid).dmg")
        try? FileManager.default.removeItem(at: tempDmg)
        do {
            try FileManager.default.moveItem(at: location, to: tempDmg)
        } catch {
            isUpdating = false
            notifyJS(stage: "error", percent: 0, text: "Failed to stage update: \(error.localizedDescription)")
            return
        }

        performInstall(dmgPath: tempDmg.path, pid: pid)
    }

    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        if let error = error {
            isUpdating = false
            notifyJS(stage: "error", percent: 0, text: "Download failed: \(error.localizedDescription)")
        }
    }

    private func performInstall(dmgPath: String, pid: Int32) {
        let appBundlePath = Bundle.main.bundlePath
        let mountPoint = "/tmp/LiveTV_Mount_\(pid)"
        let scriptPath = "/tmp/livetv_install_\(pid).sh"
        let logPath = "/tmp/livetv_install_\(pid).log"

        notifyJS(stage: "installing", percent: 98, text: "Installing v\(targetVersion) and restarting...")

        let script = """
        #!/bin/bash
        exec > "\(logPath)" 2>&1
        echo "=== Live TV Auto-Updater Started ==="
        echo "Target Bundle: \(appBundlePath)"
        echo "Waiting for PID \(pid) to exit..."

        COUNT=0
        while kill -0 \(pid) 2>/dev/null; do
            sleep 0.2
            COUNT=$((COUNT + 1))
            if [ $COUNT -gt 50 ]; then
                kill -9 \(pid) 2>/dev/null || true
                break
            fi
        done

        echo "Attaching DMG: \(dmgPath)..."
        mkdir -p "\(mountPoint)"
        hdiutil attach "\(dmgPath)" -nobrowse -readonly -mountpoint "\(mountPoint)"

        SOURCE_APP="\(mountPoint)/Live TV.app"
        if [ ! -d "$SOURCE_APP" ]; then
            SOURCE_APP=$(find "\(mountPoint)" -maxdepth 2 -name "*.app" | head -n 1)
        fi

        echo "Source app located at: $SOURCE_APP"
        if [ -d "$SOURCE_APP" ]; then
            TARGET="\(appBundlePath)"
            TEMP_NEW="${TARGET}.new"
            rm -rf "$TEMP_NEW"
            echo "Copying $SOURCE_APP to $TEMP_NEW using ditto..."
            ditto "$SOURCE_APP" "$TEMP_NEW"
            if [ -d "$TEMP_NEW" ]; then
                echo "Replacing $TARGET with $TEMP_NEW..."
                rm -rf "$TARGET"
                mv "$TEMP_NEW" "$TARGET"
                xattr -cr "$TARGET" 2>/dev/null || true
                echo "App replacement successful!"
            fi
        fi

        echo "Detaching mount point..."
        hdiutil detach "\(mountPoint)" -force 2>/dev/null || true
        rm -f "\(dmgPath)"
        rm -rf "\(mountPoint)"

        echo "Relaunching \(appBundlePath)..."
        open "\(appBundlePath)"
        echo "Update completed successfully!"
        rm -f "\(scriptPath)"
        """

        do {
            try script.write(toFile: scriptPath, atomically: true, encoding: .utf8)
            let chmod = Process()
            chmod.executableURL = URL(fileURLWithPath: "/bin/chmod")
            chmod.arguments = ["+x", scriptPath]
            try chmod.run()
            chmod.waitUntilExit()

            let helper = Process()
            helper.executableURL = URL(fileURLWithPath: "/bin/bash")
            helper.arguments = [scriptPath]
            try helper.run()

            DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
                NSApp.terminate(nil)
            }
        } catch {
            isUpdating = false
            notifyJS(stage: "error", percent: 0, text: "Installation error: \(error.localizedDescription)")
        }
    }

    func notifyJS(stage: String, percent: Int, text: String) {
        let escapedText = text
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "\"", with: "\\\"")
            .replacingOccurrences(of: "\n", with: " ")
        let js = "window.onUpdateProgress && window.onUpdateProgress({ stage: '\(stage)', percent: \(percent), text: \"\(escapedText)\" });"
        DispatchQueue.main.async { [weak self] in
            self?.webView?.evaluateJavaScript(js, completionHandler: nil)
        }
        RemoteServer.shared.updateProgress(stage: stage, percent: percent, text: text)
    }
}
