import Cocoa
import WebKit

public class WindowController: NSObject, NSWindowDelegate {
    public var window: NSWindow!
    public weak var webView: WKWebView?

    // MARK: - Picture-in-Picture State
    public var isPipActive: Bool = false
    private var prePipFrame: NSRect = .zero
    private var prePipLevel: NSWindow.Level = .normal
    private var prePipCollectionBehavior: NSWindow.CollectionBehavior = []

    public override init() {
        super.init()
        let rect = NSRect(x: 100, y: 100, width: 1280, height: 800)
        window = NSWindow(
            contentRect: rect,
            styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
            backing: .buffered,
            defer: false
        )
        window.center()
        window.title = "Live TV"
        window.titlebarAppearsTransparent = true
        window.titleVisibility = .hidden
        window.isMovableByWindowBackground = false
        window.minSize = NSSize(width: 960, height: 600)
        window.backgroundColor = NSColor(red: 0.06, green: 0.06, blue: 0.06, alpha: 1.0)
        window.delegate = self
    }

    public func setAlwaysOnTop(_ onTop: Bool) {
        window.level = onTop ? .floating : .normal
    }

    public func startWindowDrag() {
        if let currentEvent = NSApp.currentEvent {
            let sel = NSSelectorFromString("performWindowDragWithEvent:")
            if window.responds(to: sel) {
                _ = window.perform(sel, with: currentEvent)
            }
        }
    }

    public func moveWindow(dx: Double, dy: Double) {
        var origin = window.frame.origin
        origin.x += CGFloat(dx)
        origin.y -= CGFloat(dy)
        window.setFrameOrigin(origin)
    }

    public func zoomWindow() {
        window.performZoom(nil)
    }

    // MARK: - Native Picture-in-Picture Floating Window Mode
    public func togglePictureInPictureMode() {
        if isPipActive {
            exitPictureInPictureMode()
        } else {
            enterPictureInPictureMode()
        }
    }

    public func enterPictureInPictureMode() {
        guard !isPipActive else { return }
        isPipActive = true
        prePipFrame = window.frame
        prePipLevel = window.level
        prePipCollectionBehavior = window.collectionBehavior

        let screen = window.screen ?? NSScreen.main ?? NSScreen.screens.first!
        let visibleFrame = screen.visibleFrame
        let pipWidth: CGFloat = 460
        let pipHeight: CGFloat = 260
        let padding: CGFloat = 20
        let pipRect = NSRect(
            x: visibleFrame.maxX - pipWidth - padding,
            y: visibleFrame.minY + padding,
            width: pipWidth,
            height: pipHeight
        )

        window.minSize = NSSize(width: 260, height: 146)
        window.maxSize = NSSize(width: 1280, height: 720)
        window.aspectRatio = NSSize(width: 16, height: 9)
        window.level = .floating
        window.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        window.showsResizeIndicator = true
        window.styleMask.insert(.resizable)
        window.standardWindowButton(.closeButton)?.isHidden = true
        window.standardWindowButton(.miniaturizeButton)?.isHidden = true
        window.standardWindowButton(.zoomButton)?.isHidden = true
        window.setFrame(pipRect, display: true, animate: true)

        webView?.evaluateJavaScript("window.setPipState && window.setPipState(true)", completionHandler: nil)
    }

    public func resizePipWindowByDelta(dx: CGFloat, dy: CGFloat) {
        guard isPipActive else { return }
        var frame = window.frame
        let minW: CGFloat = 260
        let maxW: CGFloat = 1280
        let targetWidth = max(minW, min(maxW, frame.width + dx))
        let targetHeight = round(targetWidth * (9.0 / 16.0))

        let dHeight = targetHeight - frame.height
        frame.origin.y -= dHeight
        frame.size.width = targetWidth
        frame.size.height = targetHeight
        window.setFrame(frame, display: true, animate: false)
    }

    public func exitPictureInPictureMode() {
        guard isPipActive else { return }
        isPipActive = false

        window.minSize = NSSize(width: 960, height: 600)
        window.maxSize = NSSize(width: CGFloat.greatestFiniteMagnitude, height: CGFloat.greatestFiniteMagnitude)
        window.aspectRatio = .zero
        window.level = prePipLevel
        window.collectionBehavior = prePipCollectionBehavior
        window.standardWindowButton(.closeButton)?.isHidden = false
        window.standardWindowButton(.miniaturizeButton)?.isHidden = false
        window.standardWindowButton(.zoomButton)?.isHidden = false

        let targetFrame: NSRect
        if prePipFrame.width >= 960 && prePipFrame.height >= 600 {
            targetFrame = prePipFrame
        } else {
            let screen = window.screen ?? NSScreen.main ?? NSScreen.screens.first!
            targetFrame = NSRect(
                x: screen.visibleFrame.midX - 560,
                y: screen.visibleFrame.midY - 350,
                width: 1120,
                height: 700
            )
        }
        window.setFrame(targetFrame, display: true, animate: true)

        webView?.evaluateJavaScript("window.setPipState && window.setPipState(false)", completionHandler: nil)
    }
}
