import Cocoa
import WebKit

public class AppDelegate: NSObject, NSApplicationDelegate {
    public var windowController: WindowController!
    public var webViewController: WebViewController!
    public var bridgeHandler: NativeBridgeHandler!
    let prefsFileName = "preferences.json"

    var preferencesFileURL: URL {
        let fm = FileManager.default
        let appSupport = fm.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
        let dir = appSupport.appendingPathComponent("Live TV", isDirectory: true)
        try? fm.createDirectory(at: dir, withIntermediateDirectories: true, attributes: nil)
        return dir.appendingPathComponent(prefsFileName)
    }

    public func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.regular)

        // Force macOS Dock and App Switcher icon
        if let iconUrl = Bundle.main.url(forResource: "AppIcon", withExtension: "icns"),
           let iconImg = NSImage(contentsOf: iconUrl) {
            NSApp.applicationIconImage = iconImg
        } else if let iconPath = Bundle.main.path(forResource: "icon", ofType: "png", inDirectory: "web"),
                  let iconImg = NSImage(contentsOfFile: iconPath) {
            NSApp.applicationIconImage = iconImg
        }

        // Initialize Window and Web controllers
        windowController = WindowController()
        webViewController = WebViewController()

        // Read stored preferences
        var savedPrefsJSON = "{}"
        if let data = try? Data(contentsOf: preferencesFileURL),
           let str = String(data: data, encoding: .utf8), !str.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            savedPrefsJSON = str
        }

        // Initialize Bridge Handler
        bridgeHandler = NativeBridgeHandler(
            windowController: windowController,
            webView: nil,
            preferencesFileURL: preferencesFileURL
        )

        // Setup WebView
        let webView = webViewController.setupWebView(
            frame: windowController.window.frame,
            scriptHandler: bridgeHandler,
            savedPrefsJSON: savedPrefsJSON
        )
        windowController.webView = webView
        bridgeHandler.webView = webView

        windowController.window.contentView = webView
        webViewController.loadContent()

        setupMenuBar()

        RemoteServer.shared.start(port: 8998, webView: webView)

        windowController.window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    public func setupMenuBar() {
        let mainMenu = NSMenu()
        let appMenuItem = NSMenuItem()
        mainMenu.addItem(appMenuItem)
        let appMenu = NSMenu()
        appMenuItem.submenu = appMenu

        appMenu.addItem(withTitle: "About Live TV", action: #selector(showAboutModal), keyEquivalent: "")
        appMenu.addItem(withTitle: "Check for Updates...", action: #selector(checkForUpdates), keyEquivalent: "u")
        appMenu.addItem(NSMenuItem.separator())
        appMenu.addItem(withTitle: "Hide Live TV", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        let hideOthers = NSMenuItem(title: "Hide Others", action: #selector(NSApplication.hideOtherApplications(_:)), keyEquivalent: "h")
        hideOthers.keyEquivalentModifierMask = [.command, .option]
        appMenu.addItem(hideOthers)
        appMenu.addItem(withTitle: "Show All", action: #selector(NSApplication.unhideAllApplications(_:)), keyEquivalent: "")
        appMenu.addItem(NSMenuItem.separator())
        appMenu.addItem(withTitle: "Quit Live TV", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")

        // View menu
        let viewMenuItem = NSMenuItem()
        mainMenu.addItem(viewMenuItem)
        let viewMenu = NSMenu(title: "View")
        viewMenuItem.submenu = viewMenu
        viewMenu.addItem(withTitle: "Reload", action: #selector(reloadPage), keyEquivalent: "r")
        viewMenu.addItem(withTitle: "Toggle Full Screen", action: #selector(toggleFullScreen), keyEquivalent: "f")

        // Window menu
        let windowMenuItem = NSMenuItem()
        mainMenu.addItem(windowMenuItem)
        let windowMenu = NSMenu(title: "Window")
        windowMenuItem.submenu = windowMenu
        windowMenu.addItem(withTitle: "Minimize", action: #selector(NSWindow.performMiniaturize(_:)), keyEquivalent: "m")
        windowMenu.addItem(withTitle: "Zoom", action: #selector(NSWindow.performZoom(_:)), keyEquivalent: "")
        windowMenu.addItem(NSMenuItem.separator())
        windowMenu.addItem(withTitle: "Always on Top", action: #selector(toggleAlwaysOnTopFromMenu), keyEquivalent: "t")

        NSApp.mainMenu = mainMenu
    }

    @objc func showAboutModal() {
        webViewController.webView.evaluateJavaScript("window.openAboutModal && window.openAboutModal()")
    }

    @objc func checkForUpdates() {
        webViewController.webView.evaluateJavaScript("window.triggerUpdateCheck && window.triggerUpdateCheck(true)")
    }

    @objc func reloadPage() {
        webViewController.webView.reload()
    }

    @objc func toggleFullScreen() {
        windowController.window.toggleFullScreen(nil)
    }

    @objc func toggleAlwaysOnTopFromMenu() {
        let newState = (windowController.window.level != .floating)
        windowController.setAlwaysOnTop(newState)
        webViewController.webView.evaluateJavaScript("window.updateAlwaysOnTopUI && window.updateAlwaysOnTopUI(\(newState))")
    }

    public func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}
