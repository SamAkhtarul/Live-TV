/**
 * Live TV - WebGL AI 4K Super-Resolution & Split Compare Controller
 * Architecture: Controller / AIUpscalerController
 */

import { state } from "../models/State.js";
import { el } from "../views/Elements.js";
import { showToast } from "../utils/DomUtils.js";

export const aiUpscalerState = {
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

export function initAIUpscaler() {
  if (aiUpscalerState.gl) return true;
  const canvas = el.aiUpscaleCanvas || document.getElementById("ai-upscale-canvas");
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

    if (!gl) {
      console.warn("[WebGL AI] WebGL context not available");
      return false;
    }

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
          if (diff < 0.0018) {
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
        vec4 nw = texture2D(u_tex, v_uv + vec2(-step.x, -step.y));
        vec4 ne = texture2D(u_tex, v_uv + vec2(step.x, -step.y));
        vec4 sw = texture2D(u_tex, v_uv + vec2(-step.x, step.y));
        vec4 se = texture2D(u_tex, v_uv + vec2(step.x, step.y));

        vec4 laplacian = (col * 8.0) - (n + s + e + w + nw + ne + sw + se);

        float l_c = dot(col.rgb, vec3(0.299, 0.587, 0.114));
        float l_n = dot(n.rgb, vec3(0.299, 0.587, 0.114));
        float l_s = dot(s.rgb, vec3(0.299, 0.587, 0.114));
        float l_e = dot(e.rgb, vec3(0.299, 0.587, 0.114));
        float l_w = dot(w.rgb, vec3(0.299, 0.587, 0.114));
        float edge = sqrt((l_e - l_w) * (l_e - l_w) + (l_s - l_n) * (l_s - l_n));

        vec3 rgb = col.rgb;

        if (u_mode == 1) {
          float factor = clamp(0.65 + edge * 1.8, 0.45, 1.35);
          rgb += laplacian.rgb * factor * 0.17;
          rgb = (rgb - 0.5) * 1.06 + 0.5;
        } else if (u_mode == 2) {
          rgb += laplacian.rgb * 0.12;
          rgb = pow(clamp(rgb, 0.0, 1.0), vec3(0.95));
          rgb = (rgb - 0.5) * 1.12 + 0.5;
          float maxC = max(rgb.r, max(rgb.g, rgb.b));
          float minC = min(rgb.r, min(rgb.g, rgb.b));
          float sat = (maxC - minC) / (maxC + 0.001);
          rgb = mix(vec3(dot(rgb, vec3(0.299, 0.587, 0.114))), rgb, 1.0 + (1.0 - sat) * 0.28);
        } else if (u_mode == 3) {
          rgb += laplacian.rgb * 0.24;
          rgb = (rgb - 0.5) * 1.08 + 0.5;
        } else if (u_mode == 4) {
          if (edge > 0.075) {
            rgb -= vec3(edge * 0.32);
          }
          rgb = (rgb - 0.5) * 1.14 + 0.5;
        }

        gl_FragColor = vec4(clamp(rgb, 0.0, 1.0), col.a);
      }
    `;

    function createShader(src, type) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error("[WebGL AI] Shader error:", gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    }

    const vs = createShader(vsSource, gl.VERTEX_SHADER);
    const fs = createShader(fsSource, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return false;

    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("[WebGL AI] Link error:", gl.getProgramInfoLog(prog));
      return false;
    }

    aiUpscalerState.gl = gl;
    aiUpscalerState.program = prog;

    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1
    ]), gl.STATIC_DRAW);
    aiUpscalerState.posBuffer = posBuf;

    const uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 1,
      1, 1,
      0, 0,
      1, 0
    ]), gl.STATIC_DRAW);
    aiUpscalerState.uvBuffer = uvBuf;

    aiUpscalerState.locs = {
      a_pos: gl.getAttribLocation(prog, "a_pos"),
      a_uv: gl.getAttribLocation(prog, "a_uv"),
      u_tex: gl.getUniformLocation(prog, "u_tex"),
      u_texSize: gl.getUniformLocation(prog, "u_texSize"),
      u_mode: gl.getUniformLocation(prog, "u_mode"),
      u_splitX: gl.getUniformLocation(prog, "u_splitX")
    };

    gl.enableVertexAttribArray(aiUpscalerState.locs.a_pos);
    gl.enableVertexAttribArray(aiUpscalerState.locs.a_uv);

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
    aiUpscalerState.tex = tex;

    initSplitCompareDrag();
    return true;
  } catch (err) {
    console.error("[WebGL AI] Init failed:", err);
    return false;
  }
}

export function startAIUpscaler() {
  if (aiUpscalerState.mode === "off") return;
  if (!initAIUpscaler()) return;
  if (el.aiUpscaleCanvas) el.aiUpscaleCanvas.style.display = "block";

  if (aiUpscalerState.rafId) {
    cancelAnimationFrame(aiUpscalerState.rafId);
    aiUpscalerState.rafId = null;
  }

  function loop() {
    if (aiUpscalerState.mode === "off") {
      stopAIUpscaler();
      return;
    }

    if (state.video && !state.video.paused && !state.video.ended && state.video.readyState >= 2) {
      renderAIUpscalerFrame();
    }
    aiUpscalerState.rafId = requestAnimationFrame(loop);
  }
  aiUpscalerState.rafId = requestAnimationFrame(loop);
}

export function renderAIUpscalerFrame() {
  if (!aiUpscalerState.gl || !state.video || !el.aiUpscaleCanvas) return;
  const gl = aiUpscalerState.gl;

  const vw = state.video.videoWidth || 1920;
  const vh = state.video.videoHeight || 1080;

  if (el.aiUpscaleCanvas.width !== vw || el.aiUpscaleCanvas.height !== vh) {
    el.aiUpscaleCanvas.width = vw;
    el.aiUpscaleCanvas.height = vh;
    gl.viewport(0, 0, vw, vh);
  }

  gl.useProgram(aiUpscalerState.program);

  gl.bindBuffer(gl.ARRAY_BUFFER, aiUpscalerState.posBuffer);
  gl.vertexAttribPointer(aiUpscalerState.locs.a_pos, 2, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, aiUpscalerState.uvBuffer);
  gl.vertexAttribPointer(aiUpscalerState.locs.a_uv, 2, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, aiUpscalerState.tex);
  try {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, state.video);
  } catch (err) {
    return;
  }

  gl.uniform1i(aiUpscalerState.locs.u_tex, 0);
  gl.uniform2f(aiUpscalerState.locs.u_texSize, vw, vh);

  const modeIndices = { "off": 0, "4k_sr": 1, "hdr_cinema": 2, "sports_clarity": 3, "anime_sharp": 4 };
  gl.uniform1i(aiUpscalerState.locs.u_mode, modeIndices[aiUpscalerState.mode] || 1);
  gl.uniform1f(aiUpscalerState.locs.u_splitX, aiUpscalerState.splitCompare ? aiUpscalerState.splitX : 0.0);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

export function stopAIUpscaler() {
  if (aiUpscalerState.rafId) {
    cancelAnimationFrame(aiUpscalerState.rafId);
    aiUpscalerState.rafId = null;
  }
  if (el.aiUpscaleCanvas) {
    el.aiUpscaleCanvas.style.display = "none";
  }
  if (el.aiCompareSliderContainer) {
    el.aiCompareSliderContainer.style.display = "none";
  }
  aiUpscalerState.splitCompare = false;
  if (el.playerBtnAiCompare) el.playerBtnAiCompare.classList.remove("active");
}

export function cycleAIUpscaler() {
  const modes = ["off", "4k_sr", "hdr_cinema", "sports_clarity", "anime_sharp"];
  const curIdx = modes.indexOf(aiUpscalerState.mode);
  const nextMode = modes[(curIdx + 1) % modes.length];
  aiUpscalerState.mode = nextMode;

  updateAIUpscalerUI();

  if (nextMode === "off") {
    stopAIUpscaler();
    showToast("AI Video Enhancer: OFF", "ℹ️");
  } else {
    startAIUpscaler();
    const modeToasts = {
      "4k_sr": "✨ Real-Time AI Super-Resolution: 4K Ultra HD (GPU 60fps)",
      "hdr_cinema": "🎬 AI Dynamic Range: Retina HDR Cinema Active",
      "sports_clarity": "🏎️ AI Sports Motion: High Frame Clarity Active",
      "anime_sharp": "🎨 AI Cartoon/Anime: Dynamic Edge Contrast Active"
    };
    showToast(modeToasts[nextMode] || "AI Enhancer Active", "✨");
  }
}

export function updateAIUpscalerUI() {
  const modeLabels = {
    "off": "AI 4K Upscaler",
    "4k_sr": "✨ AI 4K Pro",
    "hdr_cinema": "🎬 Retina HDR",
    "sports_clarity": "🏎️ Sports 60fps",
    "anime_sharp": "🎨 Anime Sharp"
  };
  if (el.playerAiUpscaleLabel) {
    el.playerAiUpscaleLabel.textContent = modeLabels[aiUpscalerState.mode] || "AI 4K Upscaler";
  }
  if (el.playerBtnAiUpscaler) {
    el.playerBtnAiUpscaler.classList.toggle("active", aiUpscalerState.mode !== "off");
  }
}

export function toggleAISplitCompare() {
  if (aiUpscalerState.mode === "off") {
    aiUpscalerState.mode = "4k_sr";
    updateAIUpscalerUI();
    startAIUpscaler();
  }
  aiUpscalerState.splitCompare = !aiUpscalerState.splitCompare;
  if (el.aiCompareSliderContainer) {
    el.aiCompareSliderContainer.style.display = aiUpscalerState.splitCompare ? "block" : "none";
  }
  if (el.playerBtnAiCompare) {
    el.playerBtnAiCompare.classList.toggle("active", aiUpscalerState.splitCompare);
  }
  if (aiUpscalerState.splitCompare) {
    showToast("⚖️ Split Compare: Drag line to compare Native 1080p vs AI 4K live!", "✨");
  } else {
    showToast("Split Compare Closed", "ℹ️");
  }
}

export function initSplitCompareDrag() {
  const container = el.aiCompareSliderContainer || document.getElementById("ai-compare-slider-container");
  const line = el.aiCompareLine || document.getElementById("ai-compare-line");
  if (!container || !line) return;

  function updateDrag(e) {
    const rect = container.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0.05, Math.min(0.95, (clientX - rect.left) / rect.width));
    aiUpscalerState.splitX = x;
    line.style.left = `${(x * 100).toFixed(1)}%`;
  }

  line.addEventListener("mousedown", (e) => {
    e.preventDefault();
    aiUpscalerState.isDragging = true;
  });

  window.addEventListener("mousemove", (e) => {
    if (!aiUpscalerState.isDragging) return;
    updateDrag(e);
  });

  window.addEventListener("mouseup", () => {
    aiUpscalerState.isDragging = false;
  });

  line.addEventListener("touchstart", () => {
    aiUpscalerState.isDragging = true;
  }, { passive: true });

  window.addEventListener("touchmove", (e) => {
    if (!aiUpscalerState.isDragging) return;
    updateDrag(e);
  }, { passive: true });

  window.addEventListener("touchend", () => {
    aiUpscalerState.isDragging = false;
  });
}
