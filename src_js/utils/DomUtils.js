/**
 * Live TV - DOM & Notification Utilities
 * Architecture: Utils / DomUtils
 */

import { state } from "../models/State.js";
import { el } from "../views/Elements.js";

export function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

let toastTimeout = null;

export function showToast(message, icon = "✨") {
  if (!el.toastNotification) return;
  if (el.toastIcon) el.toastIcon.textContent = icon;
  if (el.toastMessage) el.toastMessage.textContent = message;
  el.toastNotification.style.display = "flex";
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    if (el.toastNotification) el.toastNotification.style.display = "none";
  }, 2800);
}

export function showStreamNotice(msg, duration = 4000) {
  if (!el.playerStreamNotice || !el.playerStreamNoticeText) return;
  el.playerStreamNoticeText.textContent = msg;
  el.playerStreamNotice.style.display = "flex";
  clearTimeout(state.noticeTimeout);
  state.noticeTimeout = setTimeout(() => {
    if (el.playerStreamNotice) el.playerStreamNotice.style.display = "none";
  }, duration);
}

export function setupWindowDragging() {
  let isDraggingWindow = false;
  let startScreenX = 0;
  let startScreenY = 0;

  function isDraggableHeader(target) {
    if (!target) return false;
    if (target.closest("button, input, select, textarea, a, .header-btn, .search-container, .event-tab, .category-chip, .channel-card, .rank-favorites-btn, .mini-player-btn, .player-btn, .player-slider, input[type='range']")) {
      return false;
    }
    return !!target.closest(".app-header, .player-top-bar, .window-drag-handle");
  }

  document.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    if (isDraggableHeader(e.target)) {
      isDraggingWindow = true;
      startScreenX = e.screenX;
      startScreenY = e.screenY;
      if (window.webkit?.messageHandlers?.startWindowDrag) {
        try {
          window.webkit.messageHandlers.startWindowDrag.postMessage("start");
        } catch (err) {}
      }
    }
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDraggingWindow) return;
    if (e.buttons !== 1) {
      isDraggingWindow = false;
      return;
    }
    const dx = e.screenX - startScreenX;
    const dy = e.screenY - startScreenY;
    if (dx !== 0 || dy !== 0) {
      startScreenX = e.screenX;
      startScreenY = e.screenY;
      if (window.webkit?.messageHandlers?.moveWindow) {
        try {
          window.webkit.messageHandlers.moveWindow.postMessage({ dx: dx, dy: dy });
        } catch (err) {}
      }
    }
  });

  document.addEventListener("mouseup", () => {
    isDraggingWindow = false;
  });

  document.addEventListener("dblclick", (e) => {
    if (isDraggableHeader(e.target)) {
      if (window.webkit?.messageHandlers?.zoomWindow) {
        try {
          window.webkit.messageHandlers.zoomWindow.postMessage("zoom");
        } catch (err) {}
      }
    }
  });
}
