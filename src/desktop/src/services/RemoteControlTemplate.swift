import Foundation

struct RemoteControlTemplate {
    static let html = """
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
      <meta name="apple-mobile-web-app-capable" content="yes">
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
      <link rel="icon" type="image/png" href="/icon.png">
      <link rel="apple-touch-icon" href="/icon.png">
      <title>Live TV Remote Hub</title>
      <script src="/js/hls.min.js"></script>
      <script>
        if (typeof Hls === 'undefined') {
          var cdnScript = document.createElement('script');
          cdnScript.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.8/dist/hls.min.js';
          document.head.appendChild(cdnScript);
        }
      </script>
      <style>
        :root {
          --bg: #09090b;
          --card: #141418;
          --card-hover: #1f1f26;
          --border: #26262e;
          --red: #e50914;
          --red-hover: #ff1f2d;
          --text: #f4f4f5;
          --muted: #a1a1aa;
          --emerald: #10b981;
          --radius: 12px;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        html, body {
          width: 100%;
          height: 100%;
          height: 100dvh;
          max-height: 100dvh;
          overflow: hidden !important;
          margin: 0;
          padding: 0;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }
        body {
          background: var(--bg);
          color: var(--text);
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
          display: flex;
          flex-direction: column;
          user-select: none;
        }
        /* Top Navigation Header */
        .top-header {
          position: relative;
          z-index: 50;
          background: rgba(9, 9, 11, 0.96);
          border-bottom: 1px solid var(--border);
          padding: 6px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 46px;
          flex-shrink: 0;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 7px;
          font-weight: 800;
          font-size: 16px;
          letter-spacing: -0.3px;
        }
        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--red);
          box-shadow: 0 0 8px var(--red);
          animation: pulse 1.6s infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:0.35;transform:scale(0.85);} }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-update-pill {
          background: rgba(229, 9, 20, 0.15);
          border: 1px solid rgba(229, 9, 20, 0.35);
          color: #ff4d4f;
          font-size: 11px;
          font-weight: 700;
          padding: 5px 10px;
          border-radius: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.15s ease;
        }
        .btn-update-pill:active { transform: scale(0.95); }
        .btn-update-pill.has-update {
          background: var(--red);
          color: #fff;
          border-color: var(--red);
          animation: bounce 2s infinite;
        }
        @keyframes bounce { 0%,100%{transform:scale(1);} 50%{transform:scale(1.05);} }
        .conn-badge {
          font-size: 11px;
          color: var(--emerald);
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 600;
          transition: color 0.2s ease;
        }
        .conn-badge.lost {
          color: #eab308;
          animation: pulse 1s infinite;
        }

        /* Auto-Reconnect Banner */
        .reconnect-banner {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #18181b;
          border-bottom: 2px solid #eab308;
          color: #f4f4f5;
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 600;
          display: none;
          align-items: center;
          gap: 10px;
          z-index: 200;
          box-shadow: 0 4px 24px rgba(0,0,0,0.85);
          animation: bannerSlide 0.25s ease;
        }
        @keyframes bannerSlide { from{transform:translateY(-100%);} to{transform:translateY(0);} }
        .reconnect-spinner {
          width: 15px;
          height: 15px;
          border: 2px solid rgba(255,255,255,0.25);
          border-top-color: #eab308;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .reconnect-text { flex: 1; line-height: 1.4; }
        .reconnect-btn {
          background: var(--red);
          border: none;
          color: #fff;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }
        .reconnect-btn:active { transform: scale(0.96); }

        /* Now Playing Bar */
        .now-playing-bar {
          position: relative;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .np-info {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          flex: 1;
        }
        .np-logo {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: #000;
          object-fit: cover;
          flex-shrink: 0;
          border: 1px solid var(--border);
        }
        .np-text {
          min-width: 0;
          flex: 1;
        }
        .np-title {
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #fff;
        }
        .np-sub {
          font-size: 11px;
          color: var(--muted);
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 1px;
        }
        .np-badge-live {
          color: #ef4444;
          font-weight: 800;
          font-size: 9px;
        }
        .quality-pill-header {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--border);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .quality-pill-header:active { background: var(--red); }
        .np-controls {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }
        .np-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid var(--border);
          color: #fff;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          cursor: pointer;
        }
        .np-btn:active { background: var(--red); transform: scale(0.92); }
        .np-btn.play {
          background: var(--red);
          border-color: var(--red);
          font-size: 15px;
        }

        /* Tab Content Panels - Flex Column Viewport Bounded */
        .tab-panel {
          display: none;
          width: 100%;
          flex: 1 1 0;
          min-height: 0;
          max-height: 100%;
          box-sizing: border-box;
          overflow: hidden;
        }
        .tab-panel.active {
          display: flex;
          flex-direction: column;
        }
        #tab-channels {
          overflow-y: auto !important;
          -webkit-overflow-scrolling: touch;
          padding: 0 12px 24px 12px;
          overscroll-behavior-y: contain;
        }
        #tab-channels.active {
          display: block !important;
        }

        /* Search Input - Fixed Sticky at Top of Channels Tab */
        .search-wrapper {
          position: sticky;
          top: 0;
          z-index: 45;
          background: var(--bg);
          padding: 8px 0 6px 0;
          margin: 0 0 8px 0;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        }
        .search-input {
          width: 100%;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 9px 36px 9px 14px;
          color: #fff;
          font-size: 13.5px;
          outline: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          transition: border-color 0.2s;
        }
        .search-input:focus { border-color: var(--red); }
        .search-clear {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--muted);
          font-size: 14px;
          cursor: pointer;
          display: none;
        }

        /* Category Ribbon */
        .category-ribbon {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 8px;
          margin-bottom: 10px;
          scrollbar-width: none;
        }
        .category-ribbon::-webkit-scrollbar { display: none; }
        .cat-pill {
          background: var(--card);
          border: 1px solid var(--border);
          color: var(--muted);
          font-size: 12px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 20px;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .cat-pill.active {
          background: var(--red);
          border-color: var(--red);
          color: #fff;
        }
        .cat-pill:active { transform: scale(0.95); }

        .channels-status-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          font-size: 12px;
          color: var(--muted);
          font-weight: 600;
        }

        /* 2-Column Channel Grid */
        .channels-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        .channel-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: transform 0.12s ease, border-color 0.12s ease;
        }
        .channel-card:active {
          transform: scale(0.97);
          border-color: var(--red);
          background: var(--card-hover);
        }
        .channel-card.active-now {
          border-color: #22c55e;
          background: rgba(34, 197, 94, 0.08);
        }
        .card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }
        .card-logo {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background: #000;
          object-fit: cover;
          border: 1px solid var(--border);
          flex-shrink: 0;
        }
        .card-logo-placeholder {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background: #27272a;
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .card-ch-num {
          font-size: 10px;
          font-weight: 800;
          background: rgba(255,255,255,0.08);
          color: var(--muted);
          padding: 2px 6px;
          border-radius: 4px;
        }
        .card-name {
          font-size: 12.5px;
          font-weight: 700;
          color: #fff;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .card-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 10.5px;
          color: var(--muted);
        }
        .card-cat-tag {
          background: rgba(255,255,255,0.05);
          padding: 2px 5px;
          border-radius: 4px;
          max-width: 80px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .card-fav-star {
          font-size: 15px;
          cursor: pointer;
          color: var(--muted);
          padding: 2px;
          transition: transform 0.15s ease, color 0.15s ease;
        }
        .card-fav-star:active { transform: scale(1.3); }
        .card-fav-star.active { color: #f59e0b; }
        .card-rank-badge {
          font-size: 10px;
          font-weight: 800;
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.16);
          border: 1px solid rgba(245, 158, 11, 0.35);
          padding: 1px 5px;
          border-radius: 4px;
          letter-spacing: 0.3px;
        }

        /* Channel Card Actions (Mac vs Phone) */
        .card-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 5px;
          margin-top: 4px;
        }
        .card-btn {
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          padding: 5px 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          cursor: pointer;
          transition: all 0.15s ease;
          border: 1px solid transparent;
          user-select: none;
        }
        .card-btn:active {
          transform: scale(0.94);
        }
        .card-btn.tune-mac {
          color: #93c5fd;
          border-color: rgba(59, 130, 246, 0.35);
          background: rgba(59, 130, 246, 0.12);
        }
        .card-btn.tune-mac:active {
          background: rgba(59, 130, 246, 0.28);
        }
        .card-btn.watch-phone {
          color: #fca5a5;
          border-color: rgba(229, 9, 20, 0.45);
          background: rgba(229, 9, 20, 0.15);
        }
        .card-btn.watch-phone:active {
          background: var(--red);
          color: #fff;
        }
        .channel-card.active-phone-now {
          border-color: #38bdf8 !important;
          box-shadow: 0 0 14px rgba(56, 189, 248, 0.25);
        }

        /* Phone TV Zero-Scroll Viewport Styling */
        #tab-phonetv {
          padding: 0 0 4px 0;
          width: 100%;
          height: 100%;
          max-height: 100%;
          overflow: hidden !important;
          overscroll-behavior: none !important;
          touch-action: pan-x;
          box-sizing: border-box;
          display: none;
          flex-direction: column;
          justify-content: space-between;
        }
        #tab-phonetv.active {
          display: flex !important;
        }
        .phone-player-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          max-height: 100%;
          justify-content: space-between;
          gap: 0;
          max-width: 520px;
          margin: 0 auto;
          width: 100%;
          overflow: hidden !important;
          overscroll-behavior: none !important;
          box-sizing: border-box;
        }
        .phone-video-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 9;
          max-height: clamp(180px, 28vh, 230px);
          flex-shrink: 0;
          background: #000;
          border-radius: 0;
          overflow: hidden;
          border-top: none;
          border-left: none;
          border-right: none;
          border-bottom: 1px solid var(--border);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
          margin: 0;
        }
        .phone-video-wrap video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          background: #000;
          display: block;
        }
        .phone-video-wrap.zoom-contain video {
          object-fit: contain !important;
        }
        /* Mobile Immersive Fullscreen (Works on iOS Safari & Android without stripping AI filters) */
        .phone-video-wrap.phone-immersive-fs {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          max-width: none !important;
          max-height: none !important;
          border-radius: 0 !important;
          border: none !important;
          z-index: 999999 !important;
          background: #000 !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
        }
        .phone-video-wrap.phone-immersive-fs video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        .phone-video-wrap.phone-immersive-fs.zoom-contain video {
          object-fit: contain !important;
        }
        .phone-video-wrap.zoom-fill video {
          object-fit: cover !important;
        }
        body.phone-fs-locked {
          overflow: hidden !important;
          position: fixed !important;
          width: 100% !important;
          height: 100% !important;
        }
        .phone-ai-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          pointer-events: none;
          z-index: 2;
        }
        .phone-video-wrap.zoom-contain .phone-ai-canvas {
          object-fit: contain !important;
        }
        .phone-video-wrap.zoom-fill .phone-ai-canvas {
          object-fit: cover !important;
        }

        .phone-controls-area {
          display: flex;
          flex-direction: column;
          flex: 1 1 auto;
          justify-content: space-between;
          gap: 3px;
          padding: 4px 8px 0 8px;
          min-height: 0;
          overflow: hidden;
        }

        /* Mobile Draggable AI Compare Slider */
        .phone-ai-compare-container {
          position: absolute;
          inset: 0;
          z-index: 15;
          pointer-events: none;
        }
        .phone-ai-compare-line {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 50%;
          width: 2px;
          background: #38bdf8;
          box-shadow: 0 0 10px #38bdf8;
          pointer-events: auto;
          cursor: ew-resize;
        }
        .phone-ai-compare-handle {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #38bdf8;
          border: 2px solid #fff;
          color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 900;
          box-shadow: 0 2px 10px rgba(0,0,0,0.7);
        }
        .phone-ai-compare-label {
          position: absolute;
          top: 10px;
          padding: 3px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 800;
          background: rgba(0,0,0,0.75);
          color: #fff;
          backdrop-filter: blur(4px);
        }
        .phone-ai-compare-label.left { left: 10px; color: #a1a1aa; }
        .phone-ai-compare-label.right { right: 10px; color: #38bdf8; border: 1px solid #38bdf8; }

        /* Floating Fullscreen In-Video HUD */
        .phone-video-hud {
          position: absolute;
          inset: 0;
          z-index: 25;
          background: linear-gradient(180deg, rgba(0,0,0,0.85) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.92) 100%);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 12px 16px;
          transition: opacity 0.25s ease;
          pointer-events: none;
        }
        .phone-video-hud * { pointer-events: auto; }
        .phone-hud-top, .phone-hud-bottom {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .phone-hud-bottom {
          justify-content: center;
          gap: 12px;
        }
        .phone-hud-title {
          flex: 1;
          font-size: 13px;
          font-weight: 800;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: center;
        }
        .phone-hud-btn {
          background: rgba(255, 255, 255, 0.14);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #fff;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .phone-hud-btn:active { transform: scale(0.95); background: rgba(255, 255, 255, 0.3); }
        .phone-hud-btn.ai-badge {
          background: rgba(56, 189, 248, 0.25);
          border-color: #38bdf8;
          color: #38bdf8;
          font-weight: 800;
        }
        .phone-hud-btn.play-circle {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--red);
          border: none;
          justify-content: center;
          font-size: 18px;
        }

        /* Pure OLED Black Theme */
        body.oled-black {
          --bg: #000000 !important;
          --card: #050505 !important;
          --card-hover: #0c0c0c !important;
          --border: #141414 !important;
          background: #000000 !important;
        }
        .phone-lock-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(2px);
          z-index: 25;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .phone-lock-pill {
          background: rgba(229, 9, 20, 0.95);
          color: #fff;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.5);
        }
        .phone-toast {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.88);
          border: 1px solid rgba(255, 255, 255, 0.25);
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 20px;
          z-index: 30;
          pointer-events: none;
          box-shadow: 0 4px 16px rgba(0,0,0,0.6);
        }

        /* Header Row */
        .phone-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 4px 8px;
          flex-shrink: 0;
        }
        .phone-info-left {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          flex: 1;
        }
        .phone-logo-box {
          width: 24px;
          height: 24px;
          border-radius: 5px;
          background: #27272a;
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }
        .phone-logo-box img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .phone-logo-ph {
          font-size: 12px;
        }
        .phone-titles {
          min-width: 0;
          flex: 1;
        }
        .phone-main-title {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11.5px;
          font-weight: 700;
          color: #fff;
        }
        .phone-main-title span:first-child {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .phone-star-btn {
          color: var(--muted);
          cursor: pointer;
          font-size: 13px;
          transition: color 0.15s;
        }
        .phone-star-btn.active {
          color: #f59e0b;
        }
        .phone-sub-title {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 9.5px;
          color: var(--muted);
          margin-top: 0px;
        }
        .live-indicator-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 6px #22c55e;
        }
        .phone-quality-tag {
          background: rgba(56, 189, 248, 0.15);
          border: 1px solid rgba(56, 189, 248, 0.3);
          color: #38bdf8;
          font-size: 8.5px;
          font-weight: 800;
          padding: 1px 3px;
          border-radius: 3px;
        }
        .phone-cast-btn {
          background: rgba(59, 130, 246, 0.15);
          border: 1px solid rgba(59, 130, 246, 0.35);
          color: #93c5fd;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 6px;
          border-radius: 5px;
          display: flex;
          align-items: center;
          gap: 3px;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }
        .phone-cast-btn:active {
          transform: scale(0.95);
          background: rgba(59, 130, 246, 0.3);
        }

        /* Control Strips */
        .phone-ctrl-strip {
          display: flex;
          align-items: center;
          gap: 3px;
          flex-shrink: 0;
        }
        .phone-ctrl-strip.primary {
          justify-content: space-between;
        }
        .phone-ctrl-btn {
          flex: 1;
          background: var(--card);
          border: 1px solid var(--border);
          color: #fff;
          border-radius: 6px;
          padding: 4px 2px;
          font-size: 10px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
          cursor: pointer;
          transition: all 0.12s ease;
        }
        .phone-ctrl-btn:active {
          transform: scale(0.95);
          background: #27272a;
        }
        .phone-ctrl-btn.play-btn {
          flex: 1.2;
          background: var(--red);
          border-color: var(--red);
          color: #fff;
          font-size: 12px;
          padding: 4px 2px;
        }
        .phone-ctrl-btn.play-btn:active {
          background: var(--red-hover);
        }
        .phone-ctrl-btn.live-btn {
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.3);
          background: rgba(239, 68, 68, 0.1);
          font-size: 9.5px;
        }
        .live-dot-mini {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #ef4444;
        }

        .phone-ctrl-strip.secondary {
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: 1px;
        }
        .phone-ctrl-strip.secondary::-webkit-scrollbar { display: none; }
        .phone-tool-btn {
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 5px;
          color: var(--muted);
          font-size: 9.5px;
          font-weight: 600;
          padding: 3px 6px;
          display: flex;
          align-items: center;
          gap: 3px;
          cursor: pointer;
          transition: all 0.12s ease;
          white-space: nowrap;
        }
        .phone-tool-btn:active {
          transform: scale(0.95);
          background: rgba(255, 255, 255, 0.15);
          color: #fff;
        }

        /* Surfer Box */
        .phone-surfer-box {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 4px 7px;
          display: flex;
          flex-direction: column;
          gap: 3px;
          flex-shrink: 0;
        }
        .phone-surfer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }
        .surfer-title {
          font-size: 9.5px;
          font-weight: 700;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        .surfer-search-wrap {
          position: relative;
          flex: 1;
          max-width: 140px;
        }
        .surfer-search-input {
          width: 100%;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border);
          border-radius: 5px;
          padding: 2px 16px 2px 6px;
          font-size: 9.5px;
          color: #fff;
          outline: none;
          box-sizing: border-box;
        }
        .surfer-search-input:focus {
          border-color: var(--red);
        }
        .surfer-clear-btn {
          position: absolute;
          right: 4px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--muted);
          font-size: 10px;
          cursor: pointer;
          display: none;
        }
        .phone-quick-scroll {
          display: flex;
          gap: 5px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: none;
        }
        .phone-quick-scroll::-webkit-scrollbar { display: none; }
        .phone-quick-item {
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 3px 6px;
          display: flex;
          align-items: center;
          gap: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .phone-quick-item:active {
          transform: scale(0.96);
        }
        .phone-quick-item.active {
          border-color: #38bdf8;
          background: rgba(56, 189, 248, 0.12);
        }
        .phone-quick-logo {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          background: #000;
          object-fit: cover;
        }
        .phone-quick-name {
          font-size: 10px;
          font-weight: 600;
          color: #fff;
          max-width: 85px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .phone-diag-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 8.5px;
          color: var(--muted);
          padding: 1px 0;
          opacity: 0.8;
          flex-shrink: 0;
        }

        /* Remote View - Dedicated Hardware Remote with ZERO Player & ZERO Scroll */
        #tab-remote {
          padding: 6px 12px;
          box-sizing: border-box;
          width: 100%;
          height: 100%;
          max-height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          overscroll-behavior: none;
          display: none;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        #tab-remote.active {
          display: flex !important;
        }
        #tab-remote.keypad-open {
          justify-content: flex-start !important;
        }
        .remote-view-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 330px;
          width: 100%;
          margin: 0 auto;
          overflow: visible;
          box-sizing: border-box;
        }

        /* Remote TV Active Status Bar */
        .remote-tv-status-bar {
          width: 100%;
          height: 34px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 0 10px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          box-sizing: border-box;
        }
        .remote-status-left {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          flex: 1;
        }
        .remote-status-title {
          font-size: 11px;
          font-weight: 700;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .remote-status-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 6px;
          color: #fff;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.12s ease;
        }
        .remote-status-btn:active {
          background: var(--red);
          border-color: var(--red);
          transform: scale(0.92);
        }

        /* Stepper Clusters (Channel / Volume) & Quality Selectors */
        .stepper-cluster {
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin-bottom: 14px;
          box-sizing: border-box;
          height: 108px;
        }
        .stepper-box {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 5px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          height: 108px;
          box-sizing: border-box;
        }
        .stepper-label {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.5px;
          color: var(--muted);
          text-transform: uppercase;
        }
        .stepper-name {
          font-size: 12px;
          font-weight: 800;
          color: #fff;
        }
        .stepper-btn {
          width: 100%;
          height: 30px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 7px;
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.12s ease;
        }
        .stepper-btn:active {
          background: var(--red);
          transform: scale(0.95);
        }
        .stepper-center {
          display: flex;
          flex-direction: column;
          gap: 6px;
          justify-content: space-between;
          height: 108px;
          box-sizing: border-box;
        }
        .center-action-btn {
          height: 50px;
          max-height: 50px;
          flex: 1;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 2px 4px;
          gap: 1px;
          transition: all 0.12s ease;
          overflow: hidden;
          box-sizing: border-box;
        }
        .center-action-btn:active {
          background: #27272a;
          transform: scale(0.96);
        }

        /* Tactile Hardware D-Pad */
        .dpad-container {
          width: 140px;
          height: 140px;
          background: radial-gradient(circle at 50% 50%, #24242a 0%, #151518 100%);
          border: 2px solid rgba(255,255,255,0.12);
          border-radius: 50%;
          position: relative;
          margin: 0 auto 14px auto;
          box-shadow: 0 8px 24px rgba(0,0,0,0.6), inset 0 1px 3px rgba(255,255,255,0.08);
          flex-shrink: 0;
          box-sizing: border-box;
        }
        .dpad-btn {
          position: absolute;
          background: transparent;
          border: none;
          color: #fff;
          font-size: 15px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.1s ease;
        }
        .dpad-btn:active { color: var(--red); transform: scale(0.9); }
        .dpad-up { top: 4px; left: 45px; width: 50px; height: 36px; }
        .dpad-down { bottom: 4px; left: 45px; width: 50px; height: 36px; }
        .dpad-left { left: 4px; top: 45px; width: 36px; height: 50px; }
        .dpad-right { right: 4px; top: 45px; width: 36px; height: 50px; }
        .dpad-center {
          top: 42px;
          left: 42px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2a2a30, #1c1c20);
          border: 2px solid rgba(255,255,255,0.14);
          font-size: 18px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }
        .dpad-center:active { background: var(--red); border-color: var(--red); color: #fff; }

        .quick-grid {
          width: 100%;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
          margin-bottom: 6px;
          box-sizing: border-box;
        }
        .quick-btn {
          background: var(--card);
          border: 1px solid var(--border);
          color: #d4d4d8;
          border-radius: 9px;
          padding: 8px 2px;
          font-size: 10.5px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: all 0.12s ease;
        }
        .quick-btn:active { background: var(--red); border-color: var(--red); color: #fff; transform: scale(0.96); }

        .keypad-toggle-btn {
          width: 100%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px dashed var(--border);
          border-radius: 9px;
          color: var(--muted);
          font-size: 10.5px;
          font-weight: 700;
          padding: 7px 12px;
          margin: 4px 0 0 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: background 0.15s, border-color 0.15s;
          box-sizing: border-box;
        }
        .keypad-toggle-btn:active {
          background: rgba(255, 255, 255, 0.1);
        }

        /* Numeric Keypad Cluster */
        .numeric-keypad-cluster {
          width: 100%;
          background: #18181b;
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 8px;
          margin-top: 4px;
          margin-bottom: 8px;
          box-sizing: border-box;
        }
        .keypad-display {
          background: #09090b;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px;
          padding: 5px 8px;
          text-align: center;
          font-family: ui-monospace, monospace;
          font-size: 12px;
          font-weight: 800;
          color: #38bdf8;
          letter-spacing: 1px;
          margin-bottom: 6px;
        }
        .keypad-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px;
        }
        .keypad-btn {
          background: var(--card);
          border: 1px solid var(--border);
          color: #fff;
          font-size: 14px;
          font-weight: 700;
          padding: 7px 0;
          border-radius: 7px;
          cursor: pointer;
          transition: transform 0.1s ease, background 0.15s ease;
        }
        .keypad-btn:active { background: #27272a; transform: scale(0.95); }
        .keypad-btn.keypad-clr { color: #ef4444; font-size: 11px; font-weight: 800; }
        .keypad-btn.keypad-ent { color: #22c55e; font-size: 11px; font-weight: 800; background: rgba(34, 197, 94, 0.12); border-color: rgba(34, 197, 94, 0.3); }
        .quality-opt-btn {
          width: 100%;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 12px 14px;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          text-align: left;
        }
        .quality-opt-btn:active, .quality-opt-btn.active {
          background: rgba(229, 9, 20, 0.18);
          border-color: var(--red);
        }
        .quality-opt-btn .desc {
          font-size: 11px;
          color: var(--muted);
          font-weight: 400;
          margin-top: 2px;
        }
        .np-quality-btn {
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 7px;
          padding: 5px 8px;
          font-size: 11px;
          font-weight: 700;
          color: #38bdf8;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .np-quality-btn:active {
          background: rgba(56, 189, 248, 0.22);
        }

        /* Dynamic In-Flow Bottom Navigation Bar */
        .bottom-nav {
          position: relative;
          width: 100%;
          height: 52px;
          flex-shrink: 0;
          background: rgba(14, 14, 18, 0.98);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-top: 1px solid var(--border);
          display: flex;
          z-index: 60;
          padding-bottom: env(safe-area-inset-bottom, 0px);
          box-sizing: content-box;
        }
        .nav-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          color: var(--muted);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          background: transparent;
          border: none;
          transition: color 0.15s ease;
        }
        .nav-item.active { color: var(--red); }
        .nav-item svg { width: 20px; height: 20px; }

        /* Software Update Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.78);
          backdrop-filter: blur(8px);
          z-index: 100;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .modal-box {
          width: 100%;
          max-width: 360px;
          background: #18181b;
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.8);
          animation: modalFade 0.2s ease;
        }
        @keyframes modalFade { from{opacity:0;transform:scale(0.95);} to{opacity:1;transform:scale(1);} }
        .modal-title { font-size: 16px; font-weight: 800; color: #fff; }
        .modal-body { font-size: 12.5px; color: var(--muted); line-height: 1.5; }
        .modal-btn {
          background: var(--red);
          color: #fff;
          border: none;
          padding: 12px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 700;
          cursor: pointer;
          text-align: center;
        }
        .modal-btn:active { background: var(--red-hover); transform: scale(0.98); }
        .modal-btn.secondary {
          background: var(--card);
          border: 1px solid var(--border);
          color: var(--text);
        }
        .progress-bar-wrap {
          width: 100%;
          height: 8px;
          background: rgba(255,255,255,0.1);
          border-radius: 4px;
          overflow: hidden;
          margin-top: 6px;
        }
        .progress-bar-inner {
          height: 100%;
          background: #22c55e;
          width: 0%;
          transition: width 0.3s ease;
        }
      </style>
    </head>
    <body>
      <!-- Auto Reconnect Notification Banner -->
      <div id="reconnect-banner" class="reconnect-banner">
        <div class="reconnect-spinner" id="reconnect-spinner"></div>
        <div class="reconnect-text" id="reconnect-msg">Reconnecting to Mac...</div>
        <button class="reconnect-btn" id="reconnect-btn" style="display:none;" onclick="triggerAutoDiscoveryManually()">Scan Wi-Fi</button>
      </div>

      <!-- Top Navigation Header -->
      <div class="top-header">
        <div class="brand">
          <img src="/icon.png" style="width:22px; height:22px; border-radius:6px; vertical-align:middle; margin-right:4px;" alt="Live TV">
          <span class="live-dot"></span>
          <span>Live TV Hub</span>
        </div>
        <div class="header-actions">
          <button class="btn-update-pill" id="btn-theme-oled" onclick="toggleOledMode()" title="Toggle OLED Pure Black Mode">
            <span id="oled-icon">🌙</span>
          </button>
          <button class="btn-update-pill" id="btn-phone-voice" onclick="startPhoneVoiceSearch()" title="Voice Search / Assistant">
            <span>🎙️</span>
          </button>
          <button class="btn-update-pill" id="btn-update-status" onclick="openUpdateModal()">
            <span>⚡</span>
            <span id="update-badge-label">Update</span>
          </button>
          <span class="conn-badge" id="conn-badge">● Mac Live</span>
        </div>
      </div>

      <!-- Tab 1: Channels & Home Guide -->
      <div class="tab-panel active" id="tab-channels">
        <!-- Search Field (Pinned Sticky at Top of Channels Tab) -->
        <div class="search-wrapper">
          <input type="text" class="search-input" id="search-input" placeholder="🔍 Search all 2,989 live channels..." oninput="onSearchInput(this.value)">
          <button class="search-clear" id="search-clear-btn" onclick="clearSearch()">✕</button>
        </div>

        <!-- Now Playing Bar (Mac Sync - Scoped to Channels Tab) -->
        <div class="now-playing-bar" id="now-playing-bar">
          <div class="np-info" onclick="switchTab('channels')">
            <img class="np-logo" id="np-logo" src="" style="display:none;" alt="">
            <div class="np-logo-placeholder" id="np-logo-ph" style="display:none;">📺</div>
            <div class="np-text">
              <div style="display:flex; align-items:center; gap:6px;">
                <div class="np-title" id="np-title">Live TV</div>
                <span class="card-fav-star" id="np-fav-star" onclick="toggleCurrentMacFav(event)" style="font-size:16px; display:none;" title="Toggle Favorite on Mac">☆</span>
              </div>
              <div class="np-sub">
                <span class="np-badge-live" id="np-state">● LIVE</span>
                <span id="np-meta">1080p HD</span>
              </div>
            </div>
          </div>
          <div class="np-controls">
            <button class="np-btn" onclick="sendCmd('prev')" title="Previous Channel">⏮</button>
            <button class="np-btn play" id="np-play-btn" onclick="sendCmd('play_pause')" title="Play/Pause">⏸</button>
            <button class="np-btn" onclick="sendCmd('next')" title="Next Channel">⏭</button>
            <button class="np-quality-btn" onclick="openQualityModal()" title="Stream Quality">
              <span>🎬</span>
              <span id="np-quality-label">1080p</span>
            </button>
            <button class="np-btn" onclick="sendCmd('pip')" title="Picture-in-Picture">🪟</button>
          </div>
        </div>

        <div class="category-ribbon" id="cat-ribbon">
          <button class="cat-pill active" onclick="selectCategory('All')">🌟 All</button>
          <button class="cat-pill" id="cat-pill-fav" onclick="selectCategory('Favorites')">⭐ Favorites <span id="fav-count-pill" style="opacity:0.8; font-size:11px;">(0)</span></button>
          <button class="cat-pill" onclick="selectCategory('Bangladesh')">🇧🇩 Bangladesh</button>
          <button class="cat-pill" onclick="selectCategory('Sports')">⚽ Sports</button>
          <button class="cat-pill" onclick="selectCategory('News')">📰 News</button>
          <button class="cat-pill" onclick="selectCategory('Movies')">🎬 Movies</button>
          <button class="cat-pill" onclick="selectCategory('Entertainment')">🎭 Entertainment</button>
          <button class="cat-pill" onclick="selectCategory('Music')">🎵 Music</button>
          <button class="cat-pill" onclick="selectCategory('Kids')">👶 Kids</button>
          <button class="cat-pill" onclick="selectCategory('Documentary')">🌍 Documentary</button>
          <button class="cat-pill" onclick="selectCategory('Religious')">🕌 Religious</button>
        </div>

        <div class="channels-status-row">
          <span id="channel-count-label">Loading channels...</span>
          <span style="color:var(--emerald);">● Instant Tune</span>
        </div>

        <div class="channels-grid" id="channels-grid"></div>
      </div>

      <!-- Tab 2: Phone TV Player (Watch Independent Channel on Phone) -->
      <div class="tab-panel" id="tab-phonetv">
        <div class="phone-player-container">

          <!-- Phone Video Wrapper with Custom Overlays -->
          <div class="phone-video-wrap" id="phone-video-wrap">
            <video id="phone-video" playsinline webkit-playsinline preload="auto" x5-playsinline></video>
            
            <!-- Mobile Hardware-Accelerated Real-Time WebGL AI Super-Resolution Canvas -->
            <canvas id="phone-ai-canvas" class="phone-ai-canvas" style="display:none;"></canvas>

            <!-- Live Before/After Split-Screen Comparison Slider -->
            <div id="phone-ai-compare-container" class="phone-ai-compare-container" style="display:none;">
              <div class="phone-ai-compare-line" id="phone-ai-compare-line">
                <div class="phone-ai-compare-handle">◀▶</div>
              </div>
              <div class="phone-ai-compare-label left">Native 1080p</div>
              <div class="phone-ai-compare-label right">✨ AI 4K Pro</div>
            </div>

            <!-- Floating Fullscreen In-Video HUD (Auto-Dimming) -->
            <div class="phone-video-hud" id="phone-video-hud" style="display:none;">
              <div class="phone-hud-top">
                <button class="phone-hud-btn" onclick="phoneToggleFullscreen()" title="Exit Fullscreen">
                  <span>✕ Exit</span>
                </button>
                <div class="phone-hud-title" id="phone-hud-channel-name">Live TV</div>
                <button class="phone-hud-btn ai-badge" id="phone-hud-ai-btn" onclick="phoneCycleClarity()" title="Cycle AI Enhancer">
                  <span>✨ AI 4K</span>
                </button>
                <button class="phone-hud-btn" id="phone-hud-split-btn" onclick="phoneToggleSplitCompare()" title="Compare Native vs AI">
                  <span>⚖️ Split</span>
                </button>
              </div>
              <div class="phone-hud-bottom">
                <button class="phone-hud-btn" onclick="phonePrevChannel()">⏮ CH-</button>
                <button class="phone-hud-btn" onclick="phoneSeek(-10)">⏪ 10s</button>
                <button class="phone-hud-btn play-circle" id="phone-hud-play-btn" onclick="phoneTogglePlay()">⏸</button>
                <button class="phone-hud-btn" onclick="phoneSeek(10)">10s ⏩</button>
                <button class="phone-hud-btn" onclick="phoneNextChannel()">CH+ ⏭</button>
                <button class="phone-hud-btn" onclick="togglePhoneZoom()">⛶ Fit/Fill</button>
                <button class="phone-hud-btn" onclick="phoneToggleMute()" id="phone-hud-mute-btn">🔊</button>
              </div>
            </div>

            <!-- Loading Overlay -->
            <div class="phone-player-overlay" id="phone-player-overlay" style="display:none;">
              <div class="reconnect-spinner" style="border-top-color:#38bdf8;"></div>
              <span id="phone-status-msg">Connecting to live stream...</span>
            </div>

            <!-- Screen Lock Overlay -->
            <div class="phone-lock-overlay" id="phone-lock-overlay" style="display:none;" onclick="togglePhoneLock()">
              <div class="phone-lock-pill">
                <span>🔒 Screen Locked</span>
                <span style="font-size:11px; opacity:0.8;">Tap anywhere to unlock</span>
              </div>
            </div>

            <!-- Toast Notification Inside Video -->
            <div class="phone-toast" id="phone-toast" style="display:none;"></div>
          </div>

          <!-- Controls and Information Area (padded comfortably from edges) -->
          <div class="phone-controls-area">
            <!-- Channel Info & Top Quick Action Header -->
            <div class="phone-header-row">
            <div class="phone-info-left">
              <div class="phone-logo-box">
                <img id="phone-np-logo" src="" alt="" onerror="this.style.display='none'; document.getElementById('phone-np-ph').style.display='flex';" style="display:none;">
                <div class="phone-logo-ph" id="phone-np-ph">📱</div>
              </div>
              <div class="phone-titles">
                <div class="phone-main-title">
                  <span id="phone-np-title">Live TV</span>
                  <span class="phone-star-btn" id="phone-fav-btn" onclick="togglePhoneCurrentFav()" title="Toggle Favorite">☆</span>
                </div>
                <div class="phone-sub-title">
                  <span class="live-indicator-dot"></span>
                  <span id="phone-np-sub">Live Broadcast</span>
                  <span class="phone-quality-tag" id="phone-active-res">1080p</span>
                </div>
              </div>
            </div>
            <div class="phone-info-right">
              <button class="phone-cast-btn" onclick="sendPhoneChannelToMac()" title="Play on Mac screen">
                <span>📺</span> Send to Mac
              </button>
            </div>
          </div>

          <!-- Primary Playback Controls Row: Channel Stepper + DVR + Live -->
          <div class="phone-ctrl-strip primary">
            <button class="phone-ctrl-btn ch-btn" onclick="phonePrevChannel()" title="Previous Channel">
              <span>⏮</span> CH -
            </button>
            <button class="phone-ctrl-btn dvr-btn" onclick="phoneSeek(-10)" title="Rewind 10s">
              <span>⏪</span> 10s
            </button>
            <button class="phone-ctrl-btn play-btn" id="phone-play-pause-btn" onclick="phoneTogglePlay()" title="Play / Pause">
              <span id="phone-play-icon">⏸</span>
            </button>
            <button class="phone-ctrl-btn dvr-btn" onclick="phoneSeek(10)" title="Fast Forward 10s">
              10s <span>⏩</span>
            </button>
            <button class="phone-ctrl-btn ch-btn" onclick="phoneNextChannel()" title="Next Channel">
              CH + <span>⏭</span>
            </button>
            <button class="phone-ctrl-btn live-btn" onclick="phoneGoLive()" title="Jump to Live edge">
              <span class="live-dot-mini"></span> LIVE
            </button>
          </div>

          <!-- Secondary Feature Controls Row: Quality, Full Screen, PiP, Lock, Audio then others -->
          <div class="phone-ctrl-strip secondary">
            <button class="phone-tool-btn" id="phone-btn-quality" onclick="openPhoneQualityModal()" title="Video Quality">
              <span>🎬</span> <span id="phone-tool-quality-label">Quality</span>
            </button>
            <button class="phone-tool-btn" id="phone-btn-fs" onclick="phoneToggleFullscreen()" title="Full Screen">
              <span>⛶</span> Full
            </button>
            <button class="phone-tool-btn" id="phone-btn-pip" onclick="phoneTogglePiP()" title="Mobile Picture-in-Picture">
              <span>🪟</span> PiP
            </button>
            <button class="phone-tool-btn" id="phone-btn-lock" onclick="togglePhoneLock()" title="Screen Lock">
              <span>🔒</span> Lock
            </button>
            <button class="phone-tool-btn" id="phone-btn-audio" onclick="openPhoneAudioModal()" title="Audio Track / Language">
              <span>🔊</span> Audio
            </button>
            <button class="phone-tool-btn" id="phone-btn-zoom" onclick="togglePhoneZoom()" title="Zoom / Fit Display">
              <span>⛶</span> Fit
            </button>
            <button class="phone-tool-btn" id="phone-btn-radio" onclick="togglePhoneRadioMode()" title="Audio-Only Radio Mode (Saves 85% Battery)">
              <span>📻</span> <span id="phone-radio-label">Radio</span>
            </button>
            <button class="phone-tool-btn" id="phone-btn-speed" onclick="togglePhoneSpeed()" title="Playback Speed">
              <span>⚡</span> 1.0x
            </button>
            <button class="phone-tool-btn" id="phone-btn-sleep" onclick="openPhoneSleepModal()" title="Sleep Timer">
              <span>⏱️</span> Sleep
            </button>
            <button class="phone-tool-btn" id="phone-btn-dim" onclick="togglePhoneBrightness()" title="Night Brightness Dimmer">
              <span>🌙</span> 100%
            </button>
            <button class="phone-tool-btn" id="phone-btn-slowmo" onclick="phoneInstantSlowmo()" title="0.5x Slow-Motion Action Replay">
              <span>⏱️</span> 0.5x
            </button>
            <button class="phone-tool-btn" id="phone-btn-eq" onclick="phoneCycleAudioEq()" title="Audio EQ Voice Boost">
              <span>🎛️</span> <span id="phone-eq-label">EQ</span>
            </button>
            <button class="phone-tool-btn" id="phone-btn-clarity" onclick="phoneCycleClarity()" title="AI Clarity & HDR">
              <span>✨</span> <span id="phone-clarity-label">AI Clear</span>
            </button>
            <button class="phone-tool-btn" id="phone-btn-break-mute" onclick="phoneTriggerAdMute()" title="Commercial Break Muter">
              <span>🔇</span> <span id="phone-break-label">Ad Mute</span>
            </button>
          </div>

          <!-- In-Player Quick Channel Surfer & Search -->
          <div class="phone-surfer-box">
            <div class="phone-surfer-header">
              <div class="surfer-title">⚡ Quick Channels</div>
              <div class="surfer-search-wrap">
                <input type="text" class="surfer-search-input" id="surfer-search" placeholder="🔍 Find channel..." oninput="onPhoneQuickSearch(this.value)">
                <button class="surfer-clear-btn" id="surfer-clear" onclick="clearPhoneQuickSearch()">✕</button>
              </div>
            </div>
            <div class="phone-quick-scroll" id="phone-quick-scroll">
              <!-- Rendered dynamically -->
            </div>
          </div>

          <!-- Diagnostics status badge (compact single row) -->
          <div class="phone-diag-bar">
            <span>Engine: <strong id="phone-engine-badge">Native HLS</strong></span>
            <span style="color:var(--border);">|</span>
            <span id="phone-playback-badge" style="color:var(--emerald);">● Playing</span>
            <span style="color:var(--border);">|</span>
            <span style="color:#38bdf8;">Runs Parallel to Mac</span>
          </div>

          </div>
        </div>
      </div>

      <!-- Tab 3: TV Remote Controller -->
      <div class="tab-panel" id="tab-remote">
        <div class="remote-view-container">

          <!-- Sleek Remote Active Status Bar -->
          <div class="remote-tv-status-bar">
            <div class="remote-status-left">
              <span class="live-dot-mini" style="background:#22c55e; box-shadow:0 0 6px #22c55e;"></span>
              <span class="remote-status-title" id="remote-status-title">Live TV • Mac Connected</span>
            </div>
            <button class="remote-status-btn" onclick="sendCmd('play_pause')" title="Toggle TV Play/Pause">
              <span id="remote-status-icon">⏯</span>
            </button>
          </div>

          <!-- Channel & Volume Stepper Rockers with Quality Selector -->
          <div class="stepper-cluster">
            <div class="stepper-box">
              <div class="stepper-label">Channel</div>
              <button class="stepper-btn" onclick="sendCmd('next')" title="Next Channel (CH +)">▲</button>
              <div class="stepper-name">CH</div>
              <button class="stepper-btn" onclick="sendCmd('prev')" title="Previous Channel (CH -)">▼</button>
            </div>

            <div class="stepper-center">
              <button class="center-action-btn" onclick="openQualityModal()" title="Change Video Quality">
                <span style="font-size:16px;">🎬</span>
                <span id="remote-quality-badge" style="font-size:11px; font-weight:800; color:#38bdf8; line-height:1.1;">1080p</span>
                <span style="font-size:8.5px; color:var(--muted); text-transform:uppercase; letter-spacing:0.3px;">Quality</span>
              </button>
              <button class="center-action-btn" onclick="sendCmd('mute')" title="Mute Audio">
                <span style="font-size:16px;">🔇</span>
                <span style="font-size:11px; font-weight:700; line-height:1.1;">Mute</span>
              </button>
            </div>

            <div class="stepper-box">
              <div class="stepper-label">Volume</div>
              <button class="stepper-btn" onclick="sendCmd('vol_up')" title="Volume Up">▲</button>
              <div class="stepper-name">VOL</div>
              <button class="stepper-btn" onclick="sendCmd('vol_down')" title="Volume Down">▼</button>
            </div>
          </div>

          <!-- D-Pad Directional Controller -->
          <div class="dpad-container">
            <button class="dpad-btn dpad-up" onclick="sendCmd('next')" title="Next Channel (CH +)">▲</button>
            <button class="dpad-btn dpad-down" onclick="sendCmd('prev')" title="Previous Channel (CH -)">▼</button>
            <button class="dpad-btn dpad-left" onclick="sendCmd('rewind')" title="Rewind 10s">◀</button>
            <button class="dpad-btn dpad-right" onclick="sendCmd('forward')" title="Forward 10s">▶</button>
            <button class="dpad-btn dpad-center" onclick="sendCmd('play_pause')" title="Play / Pause">⏯</button>
          </div>

          <div class="quick-grid">
            <button class="quick-btn" onclick="sendCmd('pip')"><span>🪟</span> PiP</button>
            <button class="quick-btn" onclick="sendCmd('fullscreen')"><span>⛶</span> Full</button>
            <button class="quick-btn" onclick="sendCmd('always_on_top')"><span>📌</span> Pin</button>
            <button class="quick-btn" onclick="sendCmd('stats')"><span>📊</span> Stats</button>
          </div>

          <div class="quick-grid">
            <button class="quick-btn" onclick="sendCmd('toggle_sportshud')"><span>🏆</span> Sports HUD</button>
            <button class="quick-btn" onclick="sendCmd('sleep_30')"><span>⏱️</span> Sleep</button>
            <button class="quick-btn" onclick="sendCmd('multiview')"><span>🔲</span> Multi</button>
            <button class="quick-btn" onclick="openUpdateModal()"><span>⚡</span> Update</button>
          </div>

          <!-- Channel Keypad Drawer Toggle (Keeps Remote Compact & Scroll-Free) -->
          <button class="keypad-toggle-btn" id="btn-toggle-keypad" onclick="toggleKeypadDrawer()">
            <span>🔢 Direct Channel Dial (1-9)</span>
            <span id="keypad-toggle-arrow">▼</span>
          </button>

          <!-- Numeric Keypad Cluster for Channel Dialing (Collapsed by default) -->
          <div class="numeric-keypad-cluster" id="keypad-cluster" style="display: none;">
            <div class="keypad-display" id="phone-keypad-display">DIAL CH: _ _ _</div>
            <div class="keypad-grid">
              <button class="keypad-btn" onclick="phoneDialDigit('1')">1</button>
              <button class="keypad-btn" onclick="phoneDialDigit('2')">2</button>
              <button class="keypad-btn" onclick="phoneDialDigit('3')">3</button>
              <button class="keypad-btn" onclick="phoneDialDigit('4')">4</button>
              <button class="keypad-btn" onclick="phoneDialDigit('5')">5</button>
              <button class="keypad-btn" onclick="phoneDialDigit('6')">6</button>
              <button class="keypad-btn" onclick="phoneDialDigit('7')">7</button>
              <button class="keypad-btn" onclick="phoneDialDigit('8')">8</button>
              <button class="keypad-btn" onclick="phoneDialDigit('9')">9</button>
              <button class="keypad-btn keypad-clr" onclick="phoneDialClear()">CLR</button>
              <button class="keypad-btn" onclick="phoneDialDigit('0')">0</button>
              <button class="keypad-btn keypad-ent" onclick="phoneDialEnter()">TUNE ⏎</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Fixed Bottom Navigation Bar -->
      <div class="bottom-nav">
        <button class="nav-item active" id="nav-btn-channels" onclick="switchTab('channels')">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z"/>
          </svg>
          <span>Channels</span>
        </button>
        <button class="nav-item" id="nav-btn-phonetv" onclick="switchTab('phonetv')">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M17 1H7c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm0 18H7V5h10v14z"/>
          </svg>
          <span>Phone TV</span>
        </button>
        <button class="nav-item" id="nav-btn-remote" onclick="switchTab('remote')">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 1H9c-.55 0-1 .45-1 1v20c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V2c0-.55-.45-1-1-1zm-3 19c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm2-6H10v-2h4v2zm0-4H10V8h4v2z"/>
          </svg>
          <span>Remote</span>
        </button>
      </div>

      <!-- Software Update Modal -->
      <div class="modal-overlay" id="update-modal" onclick="closeUpdateModal(event)">
        <div class="modal-box" onclick="event.stopPropagation()">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div class="modal-title" id="update-modal-title">Live TV Updates</div>
            <button style="background:none; border:none; color:var(--muted); font-size:18px; cursor:pointer;" onclick="closeUpdateModal()">✕</button>
          </div>
          <div class="modal-body" id="update-modal-body">
            Checking GitHub for latest app releases...
          </div>
          <div id="update-progress-box" style="display:none;">
            <div style="font-size:11.5px; color:#fff; font-weight:600;" id="update-progress-label">Downloading update...</div>
            <div class="progress-bar-wrap">
              <div class="progress-bar-inner" id="update-progress-bar"></div>
            </div>
          </div>
          <div style="display:flex; gap:8px; margin-top:4px;">
            <button class="modal-btn" id="modal-btn-update" style="flex:1; display:none;" onclick="triggerMacAppUpdate()">⚡ Update Mac App</button>
            <button class="modal-btn secondary" style="flex:1;" onclick="checkUpdatesLive(true)">Check Again</button>
          </div>
        </div>
      </div>

      <!-- Stream Quality Modal -->
      <div class="modal-overlay" id="quality-modal" onclick="closeQualityModal(event)">
        <div class="modal-box" onclick="event.stopPropagation()">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div class="modal-title">🎬 Stream Quality</div>
            <button style="background:none; border:none; color:var(--muted); font-size:18px; cursor:pointer;" onclick="closeQualityModal()">✕</button>
          </div>
          <div class="modal-body" style="display:flex; flex-direction:column; gap:8px; margin-top:4px;">
            <button class="quality-opt-btn" onclick="selectQuality(-1, 'Auto')">
              <div>
                <div style="font-weight:700; color:#fff;">⚡ Auto (Adaptive)</div>
                <div class="desc">Automatically picks best resolution for network</div>
              </div>
            </button>
            <button class="quality-opt-btn" onclick="selectQuality(1080, '1080p FHD')">
              <div>
                <div style="font-weight:700; color:#fff;">🌟 1080p Full HD</div>
                <div class="desc">Crisp, crystal clear & maximum bitrate</div>
              </div>
            </button>
            <button class="quality-opt-btn" onclick="selectQuality(720, '720p HD')">
              <div>
                <div style="font-weight:700; color:#fff;">✨ 720p HD</div>
                <div class="desc">Smooth playback for standard broadband</div>
              </div>
            </button>
            <button class="quality-opt-btn" onclick="selectQuality(480, '480p SD')">
              <div>
                <div style="font-weight:700; color:#fff;">📺 480p SD</div>
                <div class="desc">Data-saving resolution for mobile data</div>
              </div>
            </button>
            <button class="quality-opt-btn" onclick="selectQuality(360, '360p Low')">
              <div>
                <div style="font-weight:700; color:#fff;">📶 360p Low</div>
                <div class="desc">Low bandwidth / slow cellular connection</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Video Quality Modal -->
      <div class="modal-overlay" id="phone-quality-modal" onclick="closePhoneQualityModal(event)">
        <div class="modal-box" onclick="event.stopPropagation()">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div class="modal-title">📱 Mobile Video Quality</div>
            <button style="background:none; border:none; color:var(--muted); font-size:18px; cursor:pointer;" onclick="closePhoneQualityModal()">✕</button>
          </div>
          <div class="modal-body" id="phone-quality-options" style="display:flex; flex-direction:column; gap:8px; margin-top:6px;"></div>
        </div>
      </div>

      <!-- Mobile Sleep Timer Modal -->
      <div class="modal-overlay" id="phone-sleep-modal" onclick="closePhoneSleepModal(event)">
        <div class="modal-box" onclick="event.stopPropagation()">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div class="modal-title">⏱️ Mobile Sleep Timer</div>
            <button style="background:none; border:none; color:var(--muted); font-size:18px; cursor:pointer;" onclick="closePhoneSleepModal()">✕</button>
          </div>
          <div class="modal-body" style="display:flex; flex-direction:column; gap:8px; margin-top:6px;">
            <button class="quality-opt-btn" onclick="setPhoneSleep(15)">
              <div><strong>15 Minutes</strong><div class="desc">Pause playback in 15 minutes</div></div>
            </button>
            <button class="quality-opt-btn" onclick="setPhoneSleep(30)">
              <div><strong>30 Minutes</strong><div class="desc">Pause playback in 30 minutes</div></div>
            </button>
            <button class="quality-opt-btn" onclick="setPhoneSleep(45)">
              <div><strong>45 Minutes</strong><div class="desc">Pause playback in 45 minutes</div></div>
            </button>
            <button class="quality-opt-btn" onclick="setPhoneSleep(60)">
              <div><strong>60 Minutes (1 Hour)</strong><div class="desc">Pause playback in 1 hour</div></div>
            </button>
            <button class="quality-opt-btn" onclick="setPhoneSleep(90)">
              <div><strong>90 Minutes</strong><div class="desc">Pause playback in 1.5 hours</div></div>
            </button>
            <button class="quality-opt-btn" style="border-color:rgba(239,68,68,0.4); color:#ef4444;" onclick="setPhoneSleep(0)">
              <div><strong>Turn Off Timer</strong><div class="desc">Keep stream playing indefinitely</div></div>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Audio Track Modal -->
      <div class="modal-overlay" id="phone-audio-modal" onclick="closePhoneAudioModal(event)">
        <div class="modal-box" onclick="event.stopPropagation()">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div class="modal-title">🔊 Audio Track / Language</div>
            <button style="background:none; border:none; color:var(--muted); font-size:18px; cursor:pointer;" onclick="closePhoneAudioModal()">✕</button>
          </div>
          <div class="modal-body" id="phone-audio-options" style="display:flex; flex-direction:column; gap:8px; margin-top:6px;"></div>
        </div>
      </div>

      <script>
        let allChannels = [];
        let filteredChannels = [];
        let selectedCategory = "All";
        let searchQuery = "";
        let displayedCount = 40;
        let currentStatus = {};
        let updateManifest = null;
        let macFavorites = [];
        let userFavorites = [];
        let macConnection = {
          ip: window.location.hostname,
          hostname: "",
          port: window.location.port || "8998"
        };

        try {
          const saved = localStorage.getItem("livetv_mac_conn");
          if (saved) macConnection = JSON.parse(saved);
        } catch (e) {}

        let consecutiveFailures = 0;
        let isSearchingForMac = false;

        function showReconnectBanner(text, borderColor = "#eab308", showBtn = false, btnText = "Scan Wi-Fi") {
          const banner = document.getElementById('reconnect-banner');
          const msg = document.getElementById('reconnect-msg');
          const spinner = document.getElementById('reconnect-spinner');
          const btn = document.getElementById('reconnect-btn');
          if (!banner || !msg) return;
          banner.style.display = 'flex';
          banner.style.borderBottomColor = borderColor;
          msg.textContent = text;
          if (showBtn) {
            spinner.style.display = 'none';
            btn.style.display = 'block';
            btn.textContent = btnText;
          } else {
            spinner.style.display = 'block';
            btn.style.display = 'none';
          }
        }

        function hideReconnectBanner() {
          const banner = document.getElementById('reconnect-banner');
          if (banner) banner.style.display = 'none';
        }

        function updateConnBadge(connected) {
          const b = document.getElementById('conn-badge');
          if (!b) return;
          if (connected) {
            b.className = "conn-badge";
            b.textContent = "● Mac Live";
            b.style.color = "var(--emerald)";
          } else {
            b.className = "conn-badge lost";
            b.textContent = "⚠️ Reconnecting...";
            b.style.color = "#eab308";
          }
        }

        async function startAutoDiscovery() {
          if (isSearchingForMac) return;
          isSearchingForMac = true;
          const port = macConnection.port || "8998";

          // Step 1: Probe permanent .local mDNS hostname if we know it or if not already on it
          const host = macConnection.hostname || "sams-macbook-pro.local";
          if (window.location.hostname !== host) {
            showReconnectBanner(`🔍 Reconnecting via permanent ${host}...`, "#38bdf8");
            try {
              const ctrl = new AbortController();
              const tid = setTimeout(() => ctrl.abort(), 2000);
              const r = await fetch(`http://${host}:${port}/api/status`, { signal: ctrl.signal });
              clearTimeout(tid);
              if (r.ok) {
                showReconnectBanner(`✅ Connected to ${host}! Reloading...`, "#10b981");
                setTimeout(() => {
                  window.location.href = `http://${host}:${port}/`;
                }, 600);
                return;
              }
            } catch (e) {}
          }

          // Step 2: High-speed subnet sweep across 192.168.x.1 - 254
          let baseIp = macConnection.ip;
          if (!baseIp || baseIp === "localhost" || baseIp === "127.0.0.1") {
            baseIp = window.location.hostname;
          }
          const parts = baseIp.split('.');
          if (parts.length === 4) {
            const subnet = `${parts[0]}.${parts[1]}.${parts[2]}`;
            showReconnectBanner(`🔄 Mac IP changed. Scanning ${subnet}.1-254 for Mac...`, "#eab308");

            const ips = [];
            for (let i = 1; i <= 254; i++) {
              ips.push(`${subnet}.${i}`);
            }

            let foundIp = null;
            const batchSize = 25;
            for (let i = 0; i < ips.length; i += batchSize) {
              if (foundIp) break;
              const batch = ips.slice(i, i + batchSize);
              const promises = batch.map(ip => {
                const ctrl = new AbortController();
                const tid = setTimeout(() => ctrl.abort(), 1200);
                return fetch(`http://${ip}:${port}/api/status`, { signal: ctrl.signal })
                  .then(res => res.json())
                  .then(data => {
                    clearTimeout(tid);
                    if (data && (data.channelName !== undefined || data.version !== undefined)) {
                      return ip;
                    }
                    return null;
                  })
                  .catch(() => {
                    clearTimeout(tid);
                    return null;
                  });
              });
              const batchResults = await Promise.all(promises);
              foundIp = batchResults.find(res => res !== null);
            }

            if (foundIp) {
              showReconnectBanner(`🎉 Found Mac at ${foundIp}! Connecting...`, "#10b981");
              macConnection.ip = foundIp;
              try { localStorage.setItem("livetv_mac_conn", JSON.stringify(macConnection)); } catch (e) {}
              setTimeout(() => {
                window.location.href = `http://${foundIp}:${port}/`;
              }, 700);
              return;
            }
          }

          // Step 3: Wi-Fi disconnected or different subnet
          showReconnectBanner(
            "⚠️ Lost connection to Mac. Ensure phone is on same Wi-Fi, or press 'O' on Mac to scan QR.",
            "#ef4444",
            true,
            "Scan Again"
          );
          isSearchingForMac = false;
        }

        function triggerAutoDiscoveryManually() {
          isSearchingForMac = false;
          startAutoDiscovery();
        }

        try {
          userFavorites = JSON.parse(localStorage.getItem("livetv_remote_favs") || "[]");
        } catch (e) { userFavorites = []; }

        function haptic() {
          if (navigator.vibrate) navigator.vibrate(20);
        }

        function sendCmd(action, param = '') {
          haptic();
          fetch('/api/cmd?action=' + encodeURIComponent(action) + '&param=' + encodeURIComponent(param) + '&t=' + Date.now()).catch(console.warn);
        }

        let currentPhoneChannel = null;
        let phoneHls = null;
        let phoneSelectedQuality = -1;
        let phoneToastTimer = null;
        let phoneSleepTimer = null;
        let phoneSleepEndTime = 0;
        let phoneZoomModes = ['contain', 'cover', 'fill'];
        let phoneZoomLabels = ['Fit', 'Fill', 'Stretch'];
        let phoneZoomIdx = 0;
        let phoneSpeeds = [0.75, 1.0, 1.25, 1.5, 2.0];
        let phoneSpeedIdx = 1; // 1.0x
        let phoneBrightnessModes = [1.0, 0.8, 0.6, 0.4];
        let phoneBrightIdx = 0;
        let phoneLocked = false;
        let phoneSearchQuery = "";

        function showPhoneToast(msg) {
          const t = document.getElementById('phone-toast');
          if (!t) return;
          if (phoneToastTimer) clearTimeout(phoneToastTimer);
          t.textContent = msg;
          t.style.display = 'block';
          phoneToastTimer = setTimeout(() => {
            t.style.display = 'none';
          }, 1500);
        }

        function phoneTogglePlay() {
          const video = document.getElementById('phone-video');
          if (!video) return;
          haptic();
          if (video.paused) {
            video.play().then(() => {
              updatePhonePlayIcon(false);
              showPhoneToast("▶ Playing");
            }).catch(e => console.warn(e));
          } else {
            video.pause();
            updatePhonePlayIcon(true);
            showPhoneToast("⏸ Paused");
          }
        }

        function updatePhonePlayIcon(isPaused) {
          const icon = document.getElementById('phone-play-icon');
          if (icon) icon.textContent = isPaused ? '▶' : '⏸';
        }

        function phonePrevChannel() {
          if (!currentPhoneChannel || allChannels.length === 0) return;
          haptic();
          const idx = allChannels.findIndex(c => String(c.id) === String(currentPhoneChannel.id));
          const newIdx = (idx - 1 + allChannels.length) % allChannels.length;
          watchOnPhone(allChannels[newIdx].id);
        }

        function phoneNextChannel() {
          if (!currentPhoneChannel || allChannels.length === 0) return;
          haptic();
          const idx = allChannels.findIndex(c => String(c.id) === String(currentPhoneChannel.id));
          const newIdx = (idx + 1) % allChannels.length;
          watchOnPhone(allChannels[newIdx].id);
        }

        function phoneSeek(offset) {
          const video = document.getElementById('phone-video');
          if (!video) return;
          haptic();
          video.currentTime = Math.max(0, video.currentTime + offset);
          showPhoneToast(offset > 0 ? "+10s" : "-10s");
        }

        let isPhoneSlowmo = false;
        function phoneInstantSlowmo() {
          const video = document.getElementById('phone-video');
          if (!video) return;
          haptic();
          if (isPhoneSlowmo) {
            video.playbackRate = 1.0;
            isPhoneSlowmo = false;
            showPhoneToast("Normal Speed (1.0x)");
          } else {
            video.currentTime = Math.max(0, video.currentTime - 10);
            video.playbackRate = 0.5;
            isPhoneSlowmo = true;
            showPhoneToast("⏱️ 0.5x Slow-Mo Replay");
          }
        }

        const phoneEqProfiles = ["Normal", "Voice Boost", "Bass Boost", "Night EQ"];
        let phoneEqIdx = 0;
        function phoneCycleAudioEq() {
          haptic();
          phoneEqIdx = (phoneEqIdx + 1) % phoneEqProfiles.length;
          const p = phoneEqProfiles[phoneEqIdx];
          const lbl = document.getElementById('phone-eq-label');
          if (lbl) lbl.textContent = p.split(' ')[0];
          showPhoneToast(`Audio EQ: ${p}`);
        }

        // ======================================================================
        // Mobile Hardware-Accelerated Real-Time WebGL AI Super-Resolution Engine
        // ======================================================================
        let phoneClarityIdx = 0;
        const phoneClarityModes = [
          { id: "off", name: "Off / Passthrough", label: "Normal", filter: "none" },
          { id: "ai_sharp", name: "AI 4K Super Res", label: "AI 4K", filter: "contrast(1.12) saturate(1.20) brightness(1.02)" },
          { id: "hdr_cinema", name: "Retina HDR Cinema", label: "HDR Cinema", filter: "contrast(1.18) saturate(1.32) brightness(1.05)" },
          { id: "sports_vivid", name: "Sports Motion Clarity", label: "Sports 60fps", filter: "contrast(1.15) saturate(1.40) brightness(1.04)" },
          { id: "anime_sharp", name: "Anime/Cartoon Sharp", label: "Anime Sharp", filter: "contrast(1.22) saturate(1.25) brightness(1.03)" }
        ];

        const phoneAiState = {
          mode: "off",
          gl: null,
          program: null,
          tex: null,
          posBuffer: null,
          uvBuffer: null,
          locs: {},
          splitCompare: false,
          splitX: 0.5,
          isDragging: false,
          rafId: null
        };

        function initPhoneAi() {
          if (phoneAiState.gl) return true;
          const canvas = document.getElementById('phone-ai-canvas');
          if (!canvas) return false;

          try {
            const gl = canvas.getContext("webgl", {
              alpha: false,
              depth: false,
              stencil: false,
              antialias: false,
              preserveDrawingBuffer: true,
              powerPreference: "high-performance"
            }) || canvas.getContext("experimental-webgl");

            if (!gl) return false;

            const vsSource = `
              attribute vec2 a_pos;
              attribute vec2 a_uv;
              varying vec2 v_uv;
              void main() {
                gl_Position = vec4(a_pos, 0.0, 1.0);
                v_uv = a_uv;
              }
            `;

            const fsSource = `
              precision highp float;
              uniform sampler2D u_tex;
              uniform vec2 u_texSize;
              uniform int u_mode;
              uniform float u_splitX;
              varying vec2 v_uv;

              void main() {
                if (u_splitX > 0.001) {
                  float diff = abs(v_uv.x - u_splitX);
                  if (diff < 0.0025) {
                    gl_FragColor = vec4(0.22, 0.74, 0.98, 1.0);
                    return;
                  }
                  if (v_uv.x < u_splitX) {
                    gl_FragColor = texture2D(u_tex, v_uv);
                    return;
                  }
                }

                vec4 col = texture2D(u_tex, v_uv);
                if (u_mode == 0) {
                  gl_FragColor = col;
                  return;
                }

                vec2 step = 1.0 / u_texSize;
                vec4 n  = texture2D(u_tex, v_uv + vec2(0.0, -step.y));
                vec4 s  = texture2D(u_tex, v_uv + vec2(0.0, step.y));
                vec4 e  = texture2D(u_tex, v_uv + vec2(step.x, 0.0));
                vec4 w  = texture2D(u_tex, v_uv + vec2(-step.x, 0.0));

                vec4 laplacian = (col * 4.0) - (n + s + e + w);
                vec3 rgb = col.rgb;

                if (u_mode == 1) {
                  rgb += laplacian.rgb * 0.22;
                  rgb = (rgb - 0.5) * 1.08 + 0.5;
                } else if (u_mode == 2) {
                  rgb += laplacian.rgb * 0.16;
                  rgb = pow(clamp(rgb, 0.0, 1.0), vec3(0.95));
                  rgb = (rgb - 0.5) * 1.15 + 0.5;
                } else if (u_mode == 3) {
                  rgb += laplacian.rgb * 0.28;
                  rgb = (rgb - 0.5) * 1.10 + 0.5;
                } else if (u_mode == 4) {
                  rgb += laplacian.rgb * 0.35;
                  rgb = (rgb - 0.5) * 1.18 + 0.5;
                }

                gl_FragColor = vec4(clamp(rgb, 0.0, 1.0), col.a);
              }
            `;

            function createShader(src, type) {
              const s = gl.createShader(type);
              gl.shaderSource(s, src);
              gl.compileShader(s);
              return s;
            }

            const vs = createShader(vsSource, gl.VERTEX_SHADER);
            const fs = createShader(fsSource, gl.FRAGMENT_SHADER);
            const prog = gl.createProgram();
            gl.attachShader(prog, vs);
            gl.attachShader(prog, fs);
            gl.linkProgram(prog);

            phoneAiState.gl = gl;
            phoneAiState.program = prog;

            const posBuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
            phoneAiState.posBuffer = posBuf;

            const uvBuf = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,1, 1,1, 0,0, 1,0]), gl.STATIC_DRAW);
            phoneAiState.uvBuffer = uvBuf;

            phoneAiState.locs = {
              a_pos: gl.getAttribLocation(prog, "a_pos"),
              a_uv: gl.getAttribLocation(prog, "a_uv"),
              u_tex: gl.getUniformLocation(prog, "u_tex"),
              u_texSize: gl.getUniformLocation(prog, "u_texSize"),
              u_mode: gl.getUniformLocation(prog, "u_mode"),
              u_splitX: gl.getUniformLocation(prog, "u_splitX")
            };

            gl.enableVertexAttribArray(phoneAiState.locs.a_pos);
            gl.enableVertexAttribArray(phoneAiState.locs.a_uv);

            const tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            phoneAiState.tex = tex;

            initPhoneSplitCompareDrag();
            return true;
          } catch (e) {
            return false;
          }
        }

        function startPhoneAiUpscaler() {
          if (phoneAiState.mode === "off") return false;
          if (!initPhoneAi()) return false;
          const canvas = document.getElementById('phone-ai-canvas');
          if (canvas) canvas.style.display = 'block';

          if (phoneAiState.rafId) cancelAnimationFrame(phoneAiState.rafId);

          function loop() {
            if (phoneAiState.mode === "off") {
              stopPhoneAiUpscaler();
              return;
            }
            const v = document.getElementById('phone-video');
            if (v && !v.paused && !v.ended && v.readyState >= 2) {
              renderPhoneAiFrame();
            }
            phoneAiState.rafId = requestAnimationFrame(loop);
          }
          phoneAiState.rafId = requestAnimationFrame(loop);
          return true;
        }

        function renderPhoneAiFrame() {
          const gl = phoneAiState.gl;
          const v = document.getElementById('phone-video');
          const canvas = document.getElementById('phone-ai-canvas');
          if (!gl || !v || !canvas) return;

          const vw = v.videoWidth || 1280;
          const vh = v.videoHeight || 720;

          if (canvas.width !== vw || canvas.height !== vh) {
            canvas.width = vw;
            canvas.height = vh;
            gl.viewport(0, 0, vw, vh);
          }

          gl.useProgram(phoneAiState.program);

          gl.bindBuffer(gl.ARRAY_BUFFER, phoneAiState.posBuffer);
          gl.vertexAttribPointer(phoneAiState.locs.a_pos, 2, gl.FLOAT, false, 0, 0);

          gl.bindBuffer(gl.ARRAY_BUFFER, phoneAiState.uvBuffer);
          gl.vertexAttribPointer(phoneAiState.locs.a_uv, 2, gl.FLOAT, false, 0, 0);

          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, phoneAiState.tex);
          try {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, v);
          } catch (e) {
            return;
          }

          gl.uniform1i(phoneAiState.locs.u_tex, 0);
          gl.uniform2f(phoneAiState.locs.u_texSize, vw, vh);

          const modeMap = { "off": 0, "ai_sharp": 1, "hdr_cinema": 2, "sports_vivid": 3, "anime_sharp": 4 };
          gl.uniform1i(phoneAiState.locs.u_mode, modeMap[phoneAiState.mode] || 1);
          gl.uniform1f(phoneAiState.locs.u_splitX, phoneAiState.splitCompare ? phoneAiState.splitX : 0.0);

          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }

        function stopPhoneAiUpscaler() {
          if (phoneAiState.rafId) {
            cancelAnimationFrame(phoneAiState.rafId);
            phoneAiState.rafId = null;
          }
          const canvas = document.getElementById('phone-ai-canvas');
          if (canvas) canvas.style.display = 'none';
          const compare = document.getElementById('phone-ai-compare-container');
          if (compare) compare.style.display = 'none';
          phoneAiState.splitCompare = false;
        }

        function phoneCycleClarity() {
          haptic();
          phoneClarityIdx = (phoneClarityIdx + 1) % phoneClarityModes.length;
          const mode = phoneClarityModes[phoneClarityIdx];
          phoneAiState.mode = mode.id;

          const v = document.getElementById('phone-video');
          if (v) v.style.filter = mode.filter;

          const lbl = document.getElementById('phone-clarity-label');
          if (lbl) lbl.textContent = mode.label;
          const hudBtn = document.getElementById('phone-hud-ai-btn');
          if (hudBtn) hudBtn.innerHTML = `<span>✨ ${mode.label}</span>`;

          if (mode.id === "off") {
            stopPhoneAiUpscaler();
            showPhoneToast("AI Video Enhancer: OFF");
          } else {
            const ok = startPhoneAiUpscaler();
            if (ok) {
              showPhoneToast(`✨ AI Video Enhancer: ${mode.name} (GPU 60fps)`);
            } else {
              showPhoneToast(`✨ AI Video Enhancer: ${mode.name} (Active)`);
            }
          }
        }

        function phoneToggleSplitCompare() {
          haptic();
          if (phoneAiState.mode === "off") {
            phoneCycleClarity();
          }
          phoneAiState.splitCompare = !phoneAiState.splitCompare;
          const compare = document.getElementById('phone-ai-compare-container');
          if (compare) compare.style.display = phoneAiState.splitCompare ? 'block' : 'none';
          showPhoneToast(phoneAiState.splitCompare ? "⚖️ Drag slider to compare Native vs AI 4K" : "Split Compare Closed");
        }

        function initPhoneSplitCompareDrag() {
          const container = document.getElementById('phone-ai-compare-container');
          const line = document.getElementById('phone-ai-compare-line');
          if (!container || !line) return;

          function updateDrag(clientX) {
            const rect = container.getBoundingClientRect();
            const x = Math.max(0.05, Math.min(0.95, (clientX - rect.left) / rect.width));
            phoneAiState.splitX = x;
            line.style.left = `${(x * 100).toFixed(1)}%`;
          }

          line.addEventListener('touchstart', (e) => {
            phoneAiState.isDragging = true;
          }, { passive: true });

          window.addEventListener('touchmove', (e) => {
            if (!phoneAiState.isDragging || !e.touches[0]) return;
            updateDrag(e.touches[0].clientX);
          }, { passive: true });

          window.addEventListener('touchend', () => {
            phoneAiState.isDragging = false;
          });
        }

        let phoneBreakTimer = null;
        let phoneBreakSeconds = 0;
        function phoneTriggerAdMute() {
          haptic();
          const v = document.getElementById('phone-video');
          if (!v) return;
          if (phoneBreakTimer) {
            clearInterval(phoneBreakTimer);
            phoneBreakTimer = null;
            v.muted = false;
            const lbl = document.getElementById('phone-break-label');
            if (lbl) lbl.textContent = 'Ad Mute';
            showPhoneToast('🔊 Ad Mute Cancelled');
            return;
          }
          phoneBreakSeconds = 60;
          v.muted = true;
          const lbl = document.getElementById('phone-break-label');
          if (lbl) lbl.textContent = `${phoneBreakSeconds}s`;
          showPhoneToast(`🔇 Ad Mute 60s active`);
          phoneBreakTimer = setInterval(() => {
            phoneBreakSeconds--;
            if (phoneBreakSeconds <= 0) {
              clearInterval(phoneBreakTimer);
              phoneBreakTimer = null;
              v.muted = false;
              if (lbl) lbl.textContent = 'Ad Mute';
              showPhoneToast('🔊 Commercial break ended, audio restored');
            } else {
              if (lbl) lbl.textContent = `${phoneBreakSeconds}s`;
            }
          }, 1000);
        }

        function phoneGoLive() {
          const video = document.getElementById('phone-video');
          if (!video) return;
          haptic();
          if (isPhoneSlowmo) {
            video.playbackRate = 1.0;
            isPhoneSlowmo = false;
          }
          if (video.seekable && video.seekable.length > 0) {
            video.currentTime = video.seekable.end(video.seekable.length - 1);
          }
          video.play().catch(console.warn);
          showPhoneToast("🔴 Live Broadcast");
        }

        function openPhoneQualityModal() {
          haptic();
          const modal = document.getElementById('phone-quality-modal');
          const list = document.getElementById('phone-quality-options');
          if (!list || !modal) return;

          let html = `
            <button class="quality-opt-btn ${phoneSelectedQuality === -1 ? 'active' : ''}" onclick="setPhoneQuality(-1, 'Auto')">
              <div>
                <strong>⚡ Auto (Adaptive)</strong>
                <div class="desc">Automatically selects best bitrate for mobile signal</div>
              </div>
              <span>${phoneSelectedQuality === -1 ? '✓' : ''}</span>
            </button>
          `;

          if (phoneHls && phoneHls.levels && phoneHls.levels.length > 0) {
            phoneHls.levels.forEach((lvl, idx) => {
              const res = `${lvl.height || 720}p`;
              const kbps = lvl.bitrate ? `${Math.round(lvl.bitrate / 1000)} kbps` : 'HD';
              const isActive = (phoneSelectedQuality === idx);
              html += `
                <button class="quality-opt-btn ${isActive ? 'active' : ''}" onclick="setPhoneQuality(${idx}, '${res}')">
                  <div>
                    <strong>${res} ${lvl.height >= 720 ? 'HD' : 'SD'}</strong>
                    <div class="desc">${lvl.width || ''}x${lvl.height || ''} • ${kbps}</div>
                  </div>
                  <span>${isActive ? '✓' : ''}</span>
                </button>
              `;
            });
          } else {
            [1080, 720, 480, 360].forEach(h => {
              const isActive = (phoneSelectedQuality === h);
              html += `
                <button class="quality-opt-btn ${isActive ? 'active' : ''}" onclick="setPhoneQuality(${h}, '${h}p')">
                  <div>
                    <strong>${h}p ${h >= 720 ? 'HD' : 'SD'}</strong>
                    <div class="desc">${h >= 720 ? 'High Definition Stream' : 'Mobile Data Saver'}</div>
                  </div>
                  <span>${isActive ? '✓' : ''}</span>
                </button>
              `;
            });
          }
          list.innerHTML = html;
          modal.style.display = 'flex';
        }

        function closePhoneQualityModal(e) {
          if (!e || e.target.id === 'phone-quality-modal') {
            const m = document.getElementById('phone-quality-modal');
            if (m) m.style.display = 'none';
          }
        }

        function setPhoneQuality(levelIndex, label) {
          haptic();
          phoneSelectedQuality = levelIndex;
          if (phoneHls) {
            phoneHls.currentLevel = levelIndex;
          }
          const lbl = document.getElementById('phone-tool-quality-label');
          if (lbl) lbl.textContent = label;
          const tag = document.getElementById('phone-active-res');
          if (tag) tag.textContent = label;
          showPhoneToast(`Quality: ${label}`);
          closePhoneQualityModal();
        }

        function togglePhoneZoom() {
          haptic();
          phoneZoomIdx = (phoneZoomIdx + 1) % phoneZoomModes.length;
          const mode = phoneZoomModes[phoneZoomIdx];
          const label = phoneZoomLabels[phoneZoomIdx];
          const video = document.getElementById('phone-video');
          if (video) video.style.objectFit = mode;
          const btn = document.getElementById('phone-btn-zoom');
          if (btn) btn.innerHTML = `<span>⛶</span> ${label}`;
          showPhoneToast(`Display: ${label}`);
        }

        function openPhoneAudioModal() {
          haptic();
          const modal = document.getElementById('phone-audio-modal');
          const list = document.getElementById('phone-audio-options');
          if (!modal || !list) return;

          let html = '';
          if (phoneHls && phoneHls.audioTracks && phoneHls.audioTracks.length > 0) {
            phoneHls.audioTracks.forEach((t, i) => {
              const isActive = (phoneHls.audioTrack === i);
              html += `
                <button class="quality-opt-btn ${isActive ? 'active' : ''}" onclick="setPhoneAudio(${i}, '${t.name || ('Audio ' + (i+1))}')">
                  <div>
                    <strong>${t.name || ('Track ' + (i+1))}</strong>
                    <div class="desc">${t.lang ? 'Language: ' + t.lang : 'Default Broadcast'}</div>
                  </div>
                  <span>${isActive ? '✓' : ''}</span>
                </button>
              `;
            });
          } else {
            html = `
              <button class="quality-opt-btn active" onclick="closePhoneAudioModal()">
                <div><strong>Standard Stereo Audio</strong><div class="desc">Default live broadcast track</div></div>
                <span>✓</span>
              </button>
            `;
          }
          list.innerHTML = html;
          modal.style.display = 'flex';
        }

        function closePhoneAudioModal(e) {
          if (!e || e.target.id === 'phone-audio-modal') {
            const m = document.getElementById('phone-audio-modal');
            if (m) m.style.display = 'none';
          }
        }

        function setPhoneAudio(trackIdx, label) {
          haptic();
          if (phoneHls && phoneHls.audioTracks && phoneHls.audioTracks.length > trackIdx) {
            phoneHls.audioTrack = trackIdx;
          }
          showPhoneToast(`Audio: ${label}`);
          closePhoneAudioModal();
        }

        function togglePhoneSpeed() {
          haptic();
          phoneSpeedIdx = (phoneSpeedIdx + 1) % phoneSpeeds.length;
          const rate = phoneSpeeds[phoneSpeedIdx];
          const video = document.getElementById('phone-video');
          if (video) video.playbackRate = rate;
          const btn = document.getElementById('phone-btn-speed');
          if (btn) btn.innerHTML = `<span>⚡</span> ${rate}x`;
          showPhoneToast(`Speed: ${rate}x`);
        }

        function openPhoneSleepModal() {
          haptic();
          const m = document.getElementById('phone-sleep-modal');
          if (m) m.style.display = 'flex';
        }

        function closePhoneSleepModal(e) {
          if (!e || e.target.id === 'phone-sleep-modal') {
            const m = document.getElementById('phone-sleep-modal');
            if (m) m.style.display = 'none';
          }
        }

        function setPhoneSleep(mins) {
          haptic();
          if (phoneSleepTimer) {
            clearInterval(phoneSleepTimer);
            phoneSleepTimer = null;
          }
          const badge = document.getElementById('phone-btn-sleep');
          if (mins <= 0) {
            if (badge) badge.innerHTML = `<span>⏱️</span> Sleep`;
            showPhoneToast("Sleep Timer Off");
            closePhoneSleepModal();
            return;
          }
          phoneSleepEndTime = Date.now() + mins * 60000;
          phoneSleepTimer = setInterval(() => {
            const remaining = Math.max(0, Math.round((phoneSleepEndTime - Date.now()) / 1000));
            if (remaining <= 0) {
              clearInterval(phoneSleepTimer);
              phoneSleepTimer = null;
              const video = document.getElementById('phone-video');
              if (video) video.pause();
              if (badge) badge.innerHTML = `<span>⏱️</span> Sleep`;
              showPhoneToast("⏱️ Sleep timer finished. Playback paused.");
            } else {
              const m = Math.floor(remaining / 60);
              const s = remaining % 60;
              if (badge) badge.innerHTML = `<span>⏱️</span> ${m}:${s < 10 ? '0' : ''}${s}`;
            }
          }, 1000);
          showPhoneToast(`Sleep Timer: ${mins}m`);
          closePhoneSleepModal();
        }

        function togglePhoneBrightness() {
          haptic();
          phoneBrightIdx = (phoneBrightIdx + 1) % phoneBrightnessModes.length;
          const b = phoneBrightnessModes[phoneBrightIdx];
          const video = document.getElementById('phone-video');
          if (video) video.style.filter = `brightness(${b})`;
          const btn = document.getElementById('phone-btn-dim');
          if (btn) btn.innerHTML = `<span>🌙</span> ${Math.round(b * 100)}%`;
          showPhoneToast(`Brightness: ${Math.round(b * 100)}%`);
        }

        let isPhoneRadioMode = false;
        function togglePhoneRadioMode() {
          haptic();
          isPhoneRadioMode = !isPhoneRadioMode;
          const v = document.getElementById('phone-video');
          const btn = document.getElementById('phone-btn-radio');
          const lbl = document.getElementById('phone-radio-label');
          if (isPhoneRadioMode) {
            if (v) v.style.opacity = '0.05';
            if (btn) btn.classList.add('active');
            if (lbl) lbl.textContent = 'Video';
            showPhoneToast('📻 Radio Mode ON: Video dimmed to save battery');
          } else {
            if (v) v.style.opacity = '1';
            if (btn) btn.classList.remove('active');
            if (lbl) lbl.textContent = 'Radio';
            showPhoneToast('📺 Full Video Mode Restored');
          }
        }

        function togglePhoneLock() {
          haptic();
          phoneLocked = !phoneLocked;
          const overlay = document.getElementById('phone-lock-overlay');
          if (overlay) overlay.style.display = phoneLocked ? 'flex' : 'none';
          showPhoneToast(phoneLocked ? "Screen Locked 🔒" : "Screen Unlocked 🔓");
        }

        function phoneTogglePiP() {
          haptic();
          const video = document.getElementById('phone-video');
          if (!video) return;
          if (document.pictureInPictureElement) {
            document.exitPictureInPicture().catch(console.warn);
          } else if (video.requestPictureInPicture) {
            video.requestPictureInPicture().catch(console.warn);
          } else if (video.webkitSetPresentationMode) {
            video.webkitSetPresentationMode(video.webkitPresentationMode === 'picture-in-picture' ? 'inline' : 'picture-in-picture');
          }
        }

        let phoneIsFullscreen = false;
        let phoneHudTimer = null;

        function phoneToggleFullscreen() {
          haptic();
          const wrap = document.getElementById('phone-video-wrap');
          if (!wrap) return;

          if (phoneIsFullscreen || document.fullscreenElement || wrap.classList.contains('phone-immersive-fs')) {
            phoneExitFullscreen();
          } else {
            phoneEnterFullscreen();
          }
        }

        function phoneEnterFullscreen() {
          const wrap = document.getElementById('phone-video-wrap');
          if (!wrap) return;
          phoneIsFullscreen = true;
          wrap.classList.add('phone-immersive-fs');
          document.body.classList.add('phone-fs-locked');

          // Attempt standard HTML5 container fullscreen (Android Chrome / Tablets)
          if (wrap.requestFullscreen) {
            wrap.requestFullscreen().catch(() => {});
          } else if (wrap.webkitRequestFullscreen) {
            wrap.webkitRequestFullscreen().catch(() => {});
          }

          // Attempt screen orientation lock to landscape if available
          try {
            if (screen.orientation && screen.orientation.lock) {
              screen.orientation.lock('landscape').catch(() => {});
            }
          } catch (e) {}

          showPhoneVideoHud();
          showPhoneToast("⛶ Fullscreen Active • AI Enhancer 60fps Active");

          // Keep AI video enhancer canvas sized to screen
          if (phoneAiState && phoneAiState.mode !== "off") {
            setTimeout(startPhoneAiUpscaler, 120);
          }
        }

        function phoneExitFullscreen() {
          const wrap = document.getElementById('phone-video-wrap');
          phoneIsFullscreen = false;
          if (wrap) wrap.classList.remove('phone-immersive-fs');
          document.body.classList.remove('phone-fs-locked');

          if (document.fullscreenElement) {
            if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen().catch(() => {});
          }

          try {
            if (screen.orientation && screen.orientation.unlock) {
              screen.orientation.unlock();
            }
          } catch (e) {}

          const hud = document.getElementById('phone-video-hud');
          if (hud) hud.style.display = 'none';
          showPhoneToast("Exited Fullscreen");

          if (phoneAiState && phoneAiState.mode !== "off") {
            setTimeout(startPhoneAiUpscaler, 120);
          }
        }

        document.addEventListener('fullscreenchange', () => {
          if (!document.fullscreenElement && phoneIsFullscreen) {
            phoneExitFullscreen();
          }
        });
        document.addEventListener('webkitfullscreenchange', () => {
          if (!document.webkitFullscreenElement && phoneIsFullscreen) {
            phoneExitFullscreen();
          }
        });

        function showPhoneVideoHud() {
          const hud = document.getElementById('phone-video-hud');
          if (!hud) return;
          hud.style.display = 'flex';
          hud.style.opacity = '1';

          const title = document.getElementById('phone-hud-channel-name');
          if (title && currentPhoneChannel) title.textContent = currentPhoneChannel.name;

          if (phoneHudTimer) clearTimeout(phoneHudTimer);
          phoneHudTimer = setTimeout(() => {
            if (phoneIsFullscreen) {
              hud.style.opacity = '0';
              setTimeout(() => { if (hud.style.opacity === '0') hud.style.display = 'none'; }, 250);
            }
          }, 3500);
        }

        function togglePhoneVideoHud() {
          const hud = document.getElementById('phone-video-hud');
          if (!hud) return;
          if (hud.style.display === 'flex' && hud.style.opacity !== '0') {
            hud.style.opacity = '0';
            setTimeout(() => { hud.style.display = 'none'; }, 250);
          } else {
            showPhoneVideoHud();
          }
        }

        function togglePhoneZoom() {
          haptic();
          const wrap = document.getElementById('phone-video-wrap');
          if (!wrap) return;
          wrap.classList.toggle('zoom-contain');
          const isContain = wrap.classList.contains('zoom-contain');
          showPhoneToast(isContain ? "⛶ Zoom: Fit Aspect (Letterbox)" : "⛶ Zoom: Fill Screen (No Black Bars)");
        }

        function phoneToggleMute() {
          haptic();
          const v = document.getElementById('phone-video');
          if (!v) return;
          v.muted = !v.muted;
          const btn = document.getElementById('phone-hud-mute-btn');
          if (btn) btn.textContent = v.muted ? '🔇' : '🔊';
          showPhoneToast(v.muted ? 'Muted 🔇' : 'Unmuted 🔊');
        }

        // Voice Search & Assistant for Phone Remote
        function startPhoneVoiceSearch() {
          haptic();
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          if (!SpeechRecognition) {
            showPhoneToast("Voice recognition not supported on this browser", "⚠️");
            return;
          }
          const recog = new SpeechRecognition();
          recog.lang = 'en-US';
          recog.interimResults = false;
          recog.maxAlternatives = 1;

          const micBtn = document.getElementById('btn-phone-voice');
          if (micBtn) micBtn.style.background = 'var(--red)';
          showPhoneToast("🎙️ Listening... Say channel name (e.g. 'T Sports', 'Discovery')");

          recog.onresult = (e) => {
            if (micBtn) micBtn.style.background = '';
            const transcript = (e.results[0][0].transcript || '').trim();
            showPhoneToast(`Recognized: "${transcript}"`);
            handlePhoneVoiceCommand(transcript);
          };

          recog.onerror = (e) => {
            if (micBtn) micBtn.style.background = '';
            showPhoneToast("Voice command cancelled or not heard");
          };

          recog.onend = () => {
            if (micBtn) micBtn.style.background = '';
          };

          try {
            recog.start();
          } catch (err) {
            if (micBtn) micBtn.style.background = '';
          }
        }

        function handlePhoneVoiceCommand(cmd) {
          const lower = cmd.toLowerCase();
          if (lower.includes('mute')) {
            phoneToggleMute();
            return;
          }
          if (lower.includes('next')) {
            phoneNextChannel();
            return;
          }
          if (lower.includes('prev')) {
            phonePrevChannel();
            return;
          }
          if (lower.includes('full') || lower.includes('screen')) {
            phoneToggleFullscreen();
            return;
          }
          if (lower.includes('ai') || lower.includes('enhanc') || lower.includes('upscal')) {
            phoneCycleClarity();
            return;
          }

          const clean = lower.replace(/^(play|watch|tune|channel|switch to|put on)\\s+/i, '').trim();
          const found = allChannels.find(c => c.name.toLowerCase().includes(clean) || (c.category && c.category.toLowerCase().includes(clean)));
          if (found) {
            playPhoneChannel(found);
            showPhoneToast(`Tuned to ${found.name} 📺`);
          } else {
            showPhoneToast(`Channel "${clean}" not found`);
          }
        }

        // Pure OLED Black Mode Toggle
        function toggleOledMode() {
          haptic();
          document.body.classList.toggle('oled-black');
          const isOled = document.body.classList.contains('oled-black');
          localStorage.setItem('phone_oled_black', isOled ? '1' : '0');
          const icon = document.getElementById('oled-icon');
          if (icon) icon.textContent = isOled ? '☀️' : '🌙';
          showPhoneToast(isOled ? 'Pure OLED Black Active (Battery Saver)' : 'Standard Dark Theme');
        }

        if (localStorage.getItem('phone_oled_black') === '1') {
          document.body.classList.add('oled-black');
          const icon = document.getElementById('oled-icon');
          if (icon) icon.textContent = '☀️';
        }

        function togglePhoneCurrentFav() {
          if (!currentPhoneChannel) return;
          haptic();
          toggleFavorite(currentPhoneChannel.id);
          updatePhoneFavStar();
        }

        function updatePhoneFavStar() {
          const star = document.getElementById('phone-fav-btn');
          if (!star || !currentPhoneChannel) return;
          const isFav = isFavoriteChannel(currentPhoneChannel.id);
          star.classList.toggle('active', isFav);
          star.textContent = isFav ? '★' : '☆';
        }

        function onPhoneQuickSearch(val) {
          phoneSearchQuery = (val || "").trim().toLowerCase();
          document.getElementById('surfer-clear').style.display = phoneSearchQuery ? 'block' : 'none';
          renderPhoneQuickChannels();
        }

        function clearPhoneQuickSearch() {
          document.getElementById('surfer-search').value = '';
          phoneSearchQuery = '';
          document.getElementById('surfer-clear').style.display = 'none';
          renderPhoneQuickChannels();
        }

        function switchTab(tab) {
          haptic();
          document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
          document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
          const macBar = document.getElementById('now-playing-bar');

          if (tab === 'channels') {
            document.getElementById('tab-channels').classList.add('active');
            document.getElementById('nav-btn-channels').classList.add('active');
            if (macBar) macBar.style.display = 'flex';
          } else if (tab === 'remote') {
            document.getElementById('tab-remote').classList.add('active');
            document.getElementById('nav-btn-remote').classList.add('active');
            if (macBar) macBar.style.display = 'none'; // Dedicated TV Remote: ABSOLUTELY NO player on Remote tab!
            window.scrollTo({ top: 0, behavior: 'instant' });
          } else if (tab === 'phonetv') {
            document.getElementById('tab-phonetv').classList.add('active');
            document.getElementById('nav-btn-phonetv').classList.add('active');
            if (macBar) macBar.style.display = 'none'; // Phone TV Player: ABSOLUTELY NO Mac player bar!
            window.scrollTo({ top: 0, behavior: 'instant' });
            renderPhoneQuickChannels();
            if (!currentPhoneChannel && allChannels.length > 0) {
              const suggest = allChannels.find(c => isFavoriteChannel(c.id)) || allChannels[0];
              if (suggest) {
                watchOnPhone(suggest.id);
              }
            }
          }
        }

        function renderPhoneQuickChannels() {
          const scrollEl = document.getElementById('phone-quick-scroll');
          if (!scrollEl) return;
          let list = allChannels;
          if (phoneSearchQuery) {
            list = list.filter(c => (c.name && c.name.toLowerCase().includes(phoneSearchQuery)) || (c.category && c.category.toLowerCase().includes(phoneSearchQuery)));
          } else {
            const favMap = new Map();
            allChannels.forEach(c => favMap.set(String(c.id), c));
            const favList = [];
            macFavorites.forEach(fId => {
              const ch = favMap.get(String(fId));
              if (ch) favList.push(ch);
            });
            list = favList.length > 0 ? favList : allChannels;
          }
          const topList = list.slice(0, 30);
          if (topList.length === 0) {
            scrollEl.innerHTML = '<span style="font-size:11px; color:var(--muted); padding:6px 10px;">No channels found</span>';
            return;
          }
          scrollEl.innerHTML = topList.map(c => {
            const isCur = currentPhoneChannel && String(currentPhoneChannel.id) === String(c.id);
            return `
              <div class="phone-quick-item ${isCur ? 'active' : ''}" onclick="watchOnPhone('${c.id}')">
                ${c.logo ? `<img class="phone-quick-logo" src="${c.logo}" loading="lazy" onerror="this.style.display='none'" alt="">` : `<span style="font-size:14px;">📺</span>`}
                <span class="phone-quick-name">${c.name}</span>
              </div>
            `;
          }).join('');
        }

        // Phone Remote Keypad Drawer Toggle (Scroll-Free Remote)
        function toggleKeypadDrawer() {
          haptic();
          const k = document.getElementById('keypad-cluster');
          const arr = document.getElementById('keypad-toggle-arrow');
          const remoteTab = document.getElementById('tab-remote');
          if (!k) return;
          const isHidden = k.style.display === 'none';
          k.style.display = isHidden ? 'block' : 'none';
          if (arr) arr.textContent = isHidden ? '▲' : '▼';
          if (remoteTab) remoteTab.classList.toggle('keypad-open', isHidden);
        }

        // Phone Remote Numeric Keypad Dialing
        let phoneDialDigits = "";
        let phoneDialTimer = null;

        function phoneDialDigit(digit) {
          haptic();
          if (phoneDialDigits.length >= 4) phoneDialDigits = "";
          phoneDialDigits += digit;
          const display = document.getElementById('phone-keypad-display');
          if (display) display.textContent = `DIAL CH: ${phoneDialDigits}`;

          clearTimeout(phoneDialTimer);
          phoneDialTimer = setTimeout(() => {
            phoneDialEnter();
          }, 1500);
        }

        function phoneDialClear() {
          haptic();
          phoneDialDigits = "";
          clearTimeout(phoneDialTimer);
          const display = document.getElementById('phone-keypad-display');
          if (display) display.textContent = "DIAL CH: _ _ _";
        }

        function phoneDialEnter() {
          if (!phoneDialDigits) return;
          haptic();
          clearTimeout(phoneDialTimer);
          const chNum = phoneDialDigits;
          phoneDialDigits = "";
          const display = document.getElementById('phone-keypad-display');
          if (display) display.textContent = `TUNING CH ${chNum}...`;

          const phoneTab = document.getElementById('tab-phonetv');
          if (phoneTab && phoneTab.classList.contains('active')) {
            const num = parseInt(chNum, 10);
            const found = allChannels.find(c => c.ch === num || c.channelNumber === num) || allChannels[num - 1];
            if (found) {
              watchOnPhone(found.id);
              showPhoneToast(`Tuned CH ${num}: ${found.name}`);
            } else {
              showPhoneToast(`CH ${num} not found`);
            }
          } else {
            sendCmd('play_channel_num', chNum);
            showPhoneToast(`Mac Tuning CH ${chNum}...`);
          }

          setTimeout(() => {
            if (display) display.textContent = "DIAL CH: _ _ _";
          }, 2000);
        }

        // Phone MediaSession API for lock-screen / Control Center / AirPods
        function updatePhoneMediaSession(ch) {
          if (!('mediaSession' in navigator) || !ch) return;
          try {
            navigator.mediaSession.metadata = new MediaMetadata({
              title: ch.name || "Live TV",
              artist: `Live TV • ${ch.category || "Live"}`,
              album: `CH ${ch.ch || "Live"}`,
              artwork: ch.logo ? [
                { src: ch.logo, sizes: '192x192', type: 'image/png' },
                { src: ch.logo, sizes: '512x512', type: 'image/png' }
              ] : []
            });
            const video = document.getElementById('phone-video');
            navigator.mediaSession.setActionHandler('play', () => { if (video) video.play().catch(()=>{}); });
            navigator.mediaSession.setActionHandler('pause', () => { if (video) video.pause(); });
            navigator.mediaSession.setActionHandler('previoustrack', () => phonePrevChannel());
            navigator.mediaSession.setActionHandler('nexttrack', () => phoneNextChannel());
            navigator.mediaSession.setActionHandler('seekbackward', () => phoneSeek(-10));
            navigator.mediaSession.setActionHandler('seekforward', () => phoneSeek(10));
          } catch (e) {}
        }

        // Phone TV Touch Swipe Channel Surfing & Double-Tap Fullscreen
        function initPhoneSwipeSurfer() {
          const wrap = document.getElementById('phone-video-wrap');
          if (!wrap) return;
          let startY = 0;
          let startX = 0;
          let lastTap = 0;

          wrap.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
              startY = e.touches[0].clientY;
              startX = e.touches[0].clientX;
            }
          }, { passive: true });

          wrap.addEventListener('touchend', (e) => {
            if (e.changedTouches.length === 1) {
              const diffY = e.changedTouches[0].clientY - startY;
              const diffX = e.changedTouches[0].clientX - startX;

              // Swipe vertical gesture
              if (Math.abs(diffY) > 55 && Math.abs(diffY) > Math.abs(diffX) * 1.5) {
                if (diffY < 0) {
                  phoneNextChannel();
                  showPhoneToast("Next Channel ▲");
                } else {
                  phonePrevChannel();
                  showPhoneToast("Previous Channel ▼");
                }
                return;
              }

              // Double-tap vs Single-tap detection
              const now = Date.now();
              const timesince = now - lastTap;
              if (timesince < 320 && timesince > 0) {
                // Double tap -> Fullscreen toggle
                e.preventDefault();
                phoneToggleFullscreen();
                lastTap = 0;
              } else {
                // Single tap -> Toggle HUD
                if (phoneIsFullscreen) {
                  togglePhoneVideoHud();
                }
                lastTap = now;
              }
            }
          }, { passive: false });
        }

        function sendPhoneChannelToMac() {
          if (!currentPhoneChannel) return;
          haptic();
          tuneChannel(currentPhoneChannel.id);
          const btn = document.querySelector('.phone-cast-btn');
          if (btn) {
            const orig = btn.innerHTML;
            btn.innerHTML = '<span>✓</span> Tuned on Mac!';
            btn.style.borderColor = 'var(--emerald)';
            btn.style.color = 'var(--emerald)';
            setTimeout(() => {
              btn.innerHTML = orig;
              btn.style.borderColor = '';
              btn.style.color = '';
            }, 2000);
          }
        }

        function watchOnPhone(channelId, event) {
          if (event) event.stopPropagation();
          haptic();

          const ch = allChannels.find(c => String(c.id) === String(channelId));
          if (!ch) return;

          currentPhoneChannel = ch;
          updatePhoneMediaSession(ch);

          // Switch to Phone TV tab
          switchTab('phonetv');

          // Update Phone UI
          const titleEl = document.getElementById('phone-np-title');
          const subEl = document.getElementById('phone-np-sub');
          const logoEl = document.getElementById('phone-np-logo');
          const iconEl = document.getElementById('phone-np-ph');
          if (titleEl) titleEl.textContent = ch.name;
          if (subEl) subEl.textContent = `${ch.category || 'Live TV'} • ${ch.ch ? 'CH ' + ch.ch : 'HD Live'}`;
          if (logoEl && iconEl) {
            if (ch.logo) {
              logoEl.src = ch.logo;
              logoEl.style.display = 'block';
              iconEl.style.display = 'none';
            } else {
              logoEl.style.display = 'none';
              iconEl.style.display = 'flex';
            }
          }
          updatePhoneFavStar();

          const video = document.getElementById('phone-video');
          if (!video) return;

          // Wire play/pause status update & AI video upscaler auto-resume
          video.onplay = () => {
            updatePhonePlayIcon(false);
            if (phoneAiState && phoneAiState.mode !== "off") {
              startPhoneAiUpscaler();
            }
          };
          video.onpause = () => updatePhonePlayIcon(true);

          const statusMsg = document.getElementById('phone-status-msg');
          const overlay = document.getElementById('phone-player-overlay');
          const playbackBadge = document.getElementById('phone-playback-badge');
          const engineBadge = document.getElementById('phone-engine-badge');

          if (overlay) overlay.style.display = 'flex';
          if (statusMsg) statusMsg.textContent = `Connecting to ${ch.name}...`;
          if (playbackBadge) {
            playbackBadge.textContent = "● Tuning...";
            playbackBadge.style.color = "#38bdf8";
          }

          if (phoneHls) {
            phoneHls.destroy();
            phoneHls = null;
          }

          video.pause();
          video.removeAttribute('src');
          video.load();

          let streamUrl = ch.url || "";
          if (streamUrl.includes("|")) {
            streamUrl = streamUrl.split("|")[0];
          }

          if (video.canPlayType('application/vnd.apple.mpegurl')) {
            if (engineBadge) engineBadge.textContent = "Apple Native HLS";
            video.src = streamUrl;
            video.play().then(() => {
              if (overlay) overlay.style.display = 'none';
              if (playbackBadge) {
                playbackBadge.textContent = "● Playing Live";
                playbackBadge.style.color = "var(--emerald)";
              }
              updatePhonePlayIcon(false);
            }).catch(err => {
              console.warn("Autoplay note:", err);
              if (overlay) overlay.style.display = 'none';
              if (playbackBadge) {
                playbackBadge.textContent = "▶ Tap Play";
                playbackBadge.style.color = "#eab308";
              }
              updatePhonePlayIcon(true);
            });
          } else if (typeof Hls !== 'undefined' && Hls.isSupported()) {
            if (engineBadge) engineBadge.textContent = "Hls.js Engine";
            phoneHls = new Hls({
              enableWorker: true,
              lowLatencyMode: true,
              maxBufferLength: 30,
              backBufferLength: 15
            });
            phoneHls.loadSource(streamUrl);
            phoneHls.attachMedia(video);

            phoneHls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
              if (overlay) overlay.style.display = 'none';
              if (playbackBadge) {
                playbackBadge.textContent = "● Playing Live";
                playbackBadge.style.color = "var(--emerald)";
              }
              video.play().then(() => updatePhonePlayIcon(false)).catch(err => {
                console.warn("User interaction needed:", err);
                if (playbackBadge) {
                  playbackBadge.textContent = "▶ Tap Play";
                  playbackBadge.style.color = "#eab308";
                }
                updatePhonePlayIcon(true);
              });
            });

            phoneHls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
              const lvl = phoneHls.levels[data.level];
              if (lvl && lvl.height) {
                const tag = document.getElementById('phone-active-res');
                if (tag) tag.textContent = `${lvl.height}p`;
              }
            });

            phoneHls.on(Hls.Events.ERROR, (evt, data) => {
              console.warn("Phone Hls.js error:", data);
              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    phoneHls.startLoad();
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    phoneHls.recoverMediaError();
                    break;
                  default:
                    phoneHls.destroy();
                    phoneHls = null;
                    video.src = streamUrl;
                    video.play().catch(e => console.log(e));
                    break;
                }
              }
            });
          } else {
            if (engineBadge) engineBadge.textContent = "Standard Video";
            video.src = streamUrl;
            video.play().then(() => updatePhonePlayIcon(false)).catch(e => {
              console.log(e);
              updatePhonePlayIcon(true);
            });
            if (overlay) overlay.style.display = 'none';
          }

          renderPhoneQuickChannels();
          renderChannels();
        }
        window.playPhoneChannel = watchOnPhone;

        function selectCategory(cat) {
          haptic();
          selectedCategory = cat;
          document.querySelectorAll('.cat-pill').forEach(p => {
            p.classList.toggle('active', p.textContent.includes(cat));
          });
          displayedCount = 40;
          applyFilters();
        }

        function onSearchInput(val) {
          searchQuery = val.trim();
          document.getElementById('search-clear-btn').style.display = searchQuery ? 'block' : 'none';
          displayedCount = 40;
          applyFilters();
        }

        function clearSearch() {
          document.getElementById('search-input').value = '';
          searchQuery = '';
          document.getElementById('search-clear-btn').style.display = 'none';
          displayedCount = 40;
          applyFilters();
        }

        function isFavoriteChannel(chId) {
          const sId = String(chId);
          return macFavorites.some(f => String(f) === sId);
        }

        function toggleFavorite(id, e) {
          if (e) e.stopPropagation();
          haptic();
          const sId = String(id);
          const mIdx = macFavorites.findIndex(f => String(f) === sId);
          if (mIdx >= 0) {
            macFavorites.splice(mIdx, 1);
          } else {
            macFavorites.unshift(sId);
          }
          sendCmd('toggle_fav', sId);
          updateFavPillCount();
          applyFilters();
          renderPhoneQuickChannels();
          updatePhoneFavStar();
          updateNowPlayingFavStar();
        }

        function toggleCurrentMacFav(e) {
          if (e) e.stopPropagation();
          if (currentStatus && currentStatus.channelId) {
            toggleFavorite(currentStatus.channelId);
          }
        }

        function updateFavPillCount() {
          const pill = document.getElementById('fav-count-pill');
          if (!pill) return;
          const favMap = new Map();
          allChannels.forEach(c => favMap.set(String(c.id), true));
          const validCount = allChannels.length > 0
            ? macFavorites.filter(fId => favMap.has(String(fId))).length
            : macFavorites.length;
          pill.textContent = `(${validCount})`;
        }

        function updateNowPlayingFavStar() {
          const star = document.getElementById('np-fav-star');
          if (!star) return;
          if (currentStatus && currentStatus.channelId) {
            const isFav = isFavoriteChannel(currentStatus.channelId);
            star.classList.toggle('active', isFav);
            star.textContent = isFav ? '★' : '☆';
            star.style.display = 'inline-block';
          } else {
            star.style.display = 'none';
          }
        }

        function openQualityModal() {
          haptic();
          document.getElementById('quality-modal').style.display = 'flex';
        }

        function closeQualityModal(e) {
          if (!e || e.target.id === 'quality-modal') {
            document.getElementById('quality-modal').style.display = 'none';
          }
        }

        function selectQuality(height, label) {
          haptic();
          sendCmd('set_quality', height);
          const ql = document.getElementById('np-quality-label');
          if (ql) ql.textContent = label;
          const rq = document.getElementById('remote-quality-badge');
          if (rq) rq.textContent = label;
          closeQualityModal();
        }

        function applyFilters() {
          updateFavPillCount();
          let list = allChannels;
          if (selectedCategory === "Favorites") {
            const favMap = new Map();
            allChannels.forEach(c => favMap.set(String(c.id), c));
            list = [];
            macFavorites.forEach(fId => {
              const ch = favMap.get(String(fId));
              if (ch) list.push(ch);
            });
          } else if (selectedCategory !== "All") {
            const catLower = selectedCategory.toLowerCase();
            list = list.filter(c => c.category && c.category.toLowerCase().includes(catLower));
          }

          if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(c => (c.name && c.name.toLowerCase().includes(q)) || (c.category && c.category.toLowerCase().includes(q)));
          }

          filteredChannels = list;
          document.getElementById('channel-count-label').textContent = `${filteredChannels.length} Channels Found`;
          renderChannels();
        }

        function renderChannels() {
          const grid = document.getElementById('channels-grid');
          if (filteredChannels.length === 0) {
            grid.innerHTML = '<div style="grid-column: span 2; text-align: center; padding: 40px 10px; color: var(--muted); font-size: 13px;">No channels found matching your search.</div>';
            return;
          }

          const slice = filteredChannels.slice(0, displayedCount);
          grid.innerHTML = slice.map(c => {
            const isFav = isFavoriteChannel(c.id);
            const fIdx = macFavorites.findIndex(f => String(f) === String(c.id));
            const favRank = (isFav && fIdx >= 0) ? fIdx + 1 : null;
            const isCur = currentStatus && (currentStatus.channelId === c.id || currentStatus.channelName === c.name);
            const isPhoneCur = currentPhoneChannel && String(currentPhoneChannel.id) === String(c.id);
            return `
              <div class="channel-card ${isCur ? 'active-now' : ''} ${isPhoneCur ? 'active-phone-now' : ''}" onclick="tuneChannel('${c.id}')">
                <div class="card-top">
                  ${c.logo ? `<img class="card-logo" src="${c.logo}" loading="lazy" onerror="this.outerHTML='<div class=\\'card-logo-placeholder\\'>📺</div>'" alt="">` : `<div class="card-logo-placeholder">📺</div>`}
                  <div style="display:flex; align-items:center; gap:5px;">
                    ${favRank ? `<span class="card-rank-badge">#${favRank}</span>` : ''}
                    <span class="card-fav-star ${isFav ? 'active' : ''}" onclick="toggleFavorite('${c.id}', event)">★</span>
                  </div>
                </div>
                <div class="card-name" title="${c.name}">${c.name}</div>
                <div class="card-meta">
                  <span class="card-cat-tag">${c.category || 'Live'}</span>
                  <span class="card-ch-num">${c.ch ? 'CH ' + c.ch : 'HD'}</span>
                </div>
                <div class="card-actions">
                  <button class="card-btn tune-mac" onclick="tuneChannel('${c.id}', event)" title="Play on Mac TV">
                    📺 Mac
                  </button>
                  <button class="card-btn watch-phone" onclick="watchOnPhone('${c.id}', event)" title="Watch on Phone">
                    📱 Phone
                  </button>
                </div>
              </div>
            `;
          }).join('');
        }

        function tuneChannel(id, event) {
          if (event) event.stopPropagation();
          haptic();
          sendCmd('play_channel', id);
          const found = allChannels.find(c => c.id === id);
          if (found) {
            document.getElementById('np-title').textContent = found.name;
            document.getElementById('np-meta').textContent = `${found.category || 'Live'} • 1080p HD`;
          }
          applyFilters();
        }

        // Infinite Scroll Pagination
        window.addEventListener('scroll', () => {
          if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 400) {
            if (displayedCount < filteredChannels.length) {
              displayedCount += 40;
              renderChannels();
            }
          }
        });

        // Periodic Status Polling & Real-Time Sync
        function pollStatus() {
          fetch('/api/status?t=' + Date.now()).then(r => r.json()).then(data => {
            currentStatus = data;
            consecutiveFailures = 0;
            isSearchingForMac = false;
            hideReconnectBanner();
            updateConnBadge(true);

            // Remember Mac network identity
            if (data.ip) macConnection.ip = data.ip;
            if (data.hostname) macConnection.hostname = data.hostname;
            if (data.port) macConnection.port = data.port;
            try { localStorage.setItem("livetv_mac_conn", JSON.stringify(macConnection)); } catch (e) {}

            if (data.channelName) document.getElementById('np-title').textContent = data.channelName;
            if (data.category) document.getElementById('np-meta').textContent = `${data.category} • 1080p HD`;
            const isPlaying = (data.state === "LIVE" || data.state === "PLAYING");
            document.getElementById('np-play-btn').textContent = isPlaying ? "⏸" : "▶";
            document.getElementById('np-state').textContent = isPlaying ? "● LIVE" : "⏸ PAUSED";
            document.getElementById('np-state').style.color = isPlaying ? "#ef4444" : "#eab308";
            updateNowPlayingFavStar();

            // Update TV Remote Header Status
            const rTitle = document.getElementById('remote-status-title');
            if (rTitle) rTitle.textContent = data.channelName ? `TV: ${data.channelName}` : `Live TV • Mac Connected`;
            const rIcon = document.getElementById('remote-status-icon');
            if (rIcon) rIcon.textContent = isPlaying ? "⏸" : "▶";
            if (data.quality) {
              const rqb = document.getElementById('remote-quality-badge');
              if (rqb) rqb.textContent = data.quality;
            }

            if (data.logo) {
              const img = document.getElementById('np-logo');
              img.src = data.logo;
              img.style.display = 'block';
              document.getElementById('np-logo-ph').style.display = 'none';
            } else {
              document.getElementById('np-logo').style.display = 'none';
              document.getElementById('np-logo-ph').style.display = 'flex';
            }

            // Sync favorites from Mac in REAL-TIME
            if (Array.isArray(data.favorites)) {
              const oldFavStr = JSON.stringify(macFavorites);
              const newFavStr = JSON.stringify(data.favorites);
              if (oldFavStr !== newFavStr) {
                macFavorites = data.favorites;
                updateFavPillCount();
                if (selectedCategory === "Favorites") {
                  applyFilters();
                } else {
                  renderChannels();
                }
                renderPhoneQuickChannels();
                updatePhoneFavStar();
                updateNowPlayingFavStar();
              }
            }

            // Update app update badge dynamically from Mac status
            if (data.version && data.build && updateManifest) {
              const hasUpdate = (updateManifest.build > data.build);
              if (!hasUpdate) {
                document.getElementById('update-badge-label').textContent = `v${data.version} Up to Date`;
                document.getElementById('btn-update-status').classList.remove('has-update');
              }
            }

            // Sync Quality from Mac
            if (data.quality) {
              const ql = document.getElementById('np-quality-label');
              if (ql) ql.textContent = data.quality;
              const rq = document.getElementById('remote-quality-badge');
              if (rq) rq.textContent = data.quality;
            }

            // Sync Update Progress if active on Mac
            if (data.progress && data.progress.stage) {
              const p = data.progress;
              document.getElementById('update-progress-box').style.display = 'block';
              document.getElementById('update-progress-label').textContent = p.text || 'Updating...';
              document.getElementById('update-progress-bar').style.width = (p.percent || 0) + '%';
            }
          }).catch(() => {
            consecutiveFailures++;
            if (consecutiveFailures >= 2) {
              updateConnBadge(false);
              if (!isSearchingForMac) {
                startAutoDiscovery();
              }
            }
          });
        }
        setInterval(pollStatus, 1500);
        pollStatus();

        // Load Channel Catalog
        fetch('/api/channels?t=' + Date.now()).then(r => r.json()).then(data => {
          allChannels = data || [];
          if (Array.isArray(currentStatus.favorites)) {
            macFavorites = currentStatus.favorites;
          } else if (macFavorites.length === 0) {
            macFavorites = allChannels.filter(c => c.fav).map(c => c.id);
          }
          updateFavPillCount();
          applyFilters();
          renderPhoneQuickChannels();
        }).catch(err => {
          console.warn("Could not load channels:", err);
        });

        // Software Update Modal Logic
        function openUpdateModal() {
          haptic();
          document.getElementById('update-modal').style.display = 'flex';
          checkUpdatesLive(true);
        }

        function closeUpdateModal(e) {
          if (!e || e.target.id === 'update-modal') {
            document.getElementById('update-modal').style.display = 'none';
          }
        }

        async function checkUpdatesLive(forceCheck = false) {
          const bodyEl = document.getElementById('update-modal-body');
          const btnUpdate = document.getElementById('modal-btn-update');
          bodyEl.innerHTML = '<span style="color:var(--muted);">Checking GitHub releases in real time...</span>';
          btnUpdate.style.display = 'none';

          // 1. First fetch fresh live status directly from Mac
          try {
            const statRes = await fetch('/api/status?t=' + Date.now());
            if (statRes.ok) {
              const liveStat = await statRes.json();
              currentStatus = liveStat;
              if (Array.isArray(liveStat.favorites)) {
                macFavorites = liveStat.favorites;
                updateFavPillCount();
                if (selectedCategory === "Favorites") applyFilters();
                renderPhoneQuickChannels();
                updatePhoneFavStar();
                updateNowPlayingFavStar();
              }
            }
          } catch (e) {}

          const macVer = (currentStatus && currentStatus.version) ? currentStatus.version : "5.1.8";
          const macBuild = (currentStatus && currentStatus.build) ? currentStatus.build : 44;

          fetch('https://raw.githubusercontent.com/SamAkhtarul/Live-TV/main/version.json?t=' + Date.now())
            .then(r => r.json())
            .then(manifest => {
              updateManifest = manifest;
              const hasUpdate = (manifest.build > macBuild);

              if (hasUpdate) {
                document.getElementById('update-badge-label').textContent = `v${manifest.version} Available!`;
                document.getElementById('btn-update-status').classList.add('has-update');
                bodyEl.innerHTML = `
                  <div style="font-weight:700; color:#fff; font-size:14px; margin-bottom:4px;">🎉 Update Available: Live TV v${manifest.version}</div>
                  <div style="font-size:11.5px; color:#22c55e; margin-bottom:8px;">Installed on Mac: v${macVer} (Build ${macBuild}) • Latest: v${manifest.version}</div>
                  <div style="background:rgba(255,255,255,0.05); padding:8px 10px; border-radius:8px; font-size:11px; margin-bottom:8px;">
                    ${(manifest.changelog || []).slice(0, 4).map(c => `<div>• ${c}</div>`).join('')}
                  </div>
                  <div>Tap below to update and restart Live TV on your Mac automatically.</div>
                `;
                btnUpdate.style.display = 'block';
                btnUpdate.textContent = `⚡ Update Mac App to v${manifest.version}`;
              } else {
                document.getElementById('update-badge-label').textContent = `v${macVer} Up to Date`;
                document.getElementById('btn-update-status').classList.remove('has-update');
                bodyEl.innerHTML = `
                  <div style="color:#22c55e; font-weight:700; font-size:13.5px; margin-bottom:4px;">✅ Live TV on your Mac is Up to Date</div>
                  <div style="font-size:12px;">Running <strong>Version ${macVer} (Build ${macBuild})</strong>. All 2,989 channels and real-time feeds are active.</div>
                `;
              }
            })
            .catch(err => {
              bodyEl.innerHTML = `<span style="color:#ff4d4f;">Could not reach GitHub release server. Make sure your phone has internet access.</span>`;
            });
        }

        function triggerMacAppUpdate() {
          haptic();
          sendCmd('start_update');
          document.getElementById('modal-btn-update').style.display = 'none';
          document.getElementById('update-progress-box').style.display = 'block';
          document.getElementById('update-progress-label').textContent = 'Staging download on Mac...';
          document.getElementById('update-progress-bar').style.width = '10%';
        }

        // Check for updates on initial connect
        setTimeout(checkUpdatesLive, 1000);
        setTimeout(initPhoneSwipeSurfer, 500);
      </script>
    </body>
    </html>
"""
}
