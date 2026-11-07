/**
 * Live TV - Native Bridge Microservice
 * Architecture: Service / NativeBridgeService
 * Responsibility: Uniform abstraction over macOS WKWebView, Android WebView, and Web/PWA.
 */

export class NativeBridgeService {
  static isMacOS() {
    return typeof window !== "undefined" &&
      window.webkit &&
      window.webkit.messageHandlers !== undefined;
  }

  static isAndroid() {
    return typeof window !== "undefined" &&
      window.AndroidBridge !== undefined;
  }

  static isWeb() {
    return !this.isMacOS() && !this.isAndroid();
  }

  /**
   * Post message to native host (macOS WKScriptMessageHandler or Android JSInterface)
   */
  static postMessage(handlerName, payload = {}) {
    try {
      if (this.isMacOS()) {
        const handler = window.webkit?.messageHandlers?.[handlerName];
        if (handler && typeof handler.postMessage === "function") {
          handler.postMessage(payload);
          return true;
        }
      } else if (this.isAndroid()) {
        const bridge = window.AndroidBridge;
        if (bridge && typeof bridge[handlerName] === "function") {
          if (typeof payload === "string") {
            bridge[handlerName](payload);
          } else {
            bridge[handlerName](JSON.stringify(payload));
          }
          return true;
        }
      }
    } catch (err) {
      console.warn(`[NativeBridgeService] Failed sending '${handlerName}':`, err);
    }
    return false;
  }

  /**
   * Triggers native application auto-update
   */
  static triggerNativeUpdate(dmgUrl, version, build) {
    if (this.isMacOS()) {
      return this.postMessage("startAppUpdate", {
        url: dmgUrl,
        version: version,
        build: build
      });
    } else if (this.isAndroid()) {
      return this.postMessage("downloadUpdateApk", {
        url: dmgUrl.replace(/\.dmg$/, ".apk"),
        version: version,
        build: build
      });
    }
    return false;
  }

  static minimizeWindow() {
    return this.postMessage("minimizeWindow");
  }

  static toggleMaximize() {
    return this.postMessage("toggleMaximize");
  }

  static closeWindow() {
    return this.postMessage("closeApp");
  }

  static toggleAlwaysOnTop(enabled) {
    return this.postMessage("setAlwaysOnTop", { enabled });
  }

  static triggerHaptic(type = "light") {
    if (this.isAndroid()) {
      this.postMessage("hapticFeedback", type);
    } else if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(type === "heavy" ? 40 : 15);
      } catch (e) {}
    }
  }
}
