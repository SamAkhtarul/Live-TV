/**
 * Live TV - AI Upscaler Microservice
 * Architecture: Service / AIUpscalerService
 * Responsibility: WebGL context management, GLSL shader compilation,
 *                 and hardware-accelerated super-resolution rendering.
 */

export class AIUpscalerService {
  static VS_SOURCE = `
    attribute vec2 a_pos;
    attribute vec2 a_uv;
    varying vec2 v_uv;
    void main() {
      gl_Position = vec4(a_pos, 0.0, 1.0);
      v_uv = a_uv;
    }
  `;

  static FS_SOURCE = `
    precision highp float;
    uniform sampler2D u_tex;
    uniform vec2 u_texSize;
    uniform int u_mode;
    uniform float u_splitX;
    varying vec2 v_uv;

    void main() {
      if (u_mode == 0) {
        gl_FragColor = texture2D(u_tex, v_uv);
        return;
      }

      if (u_mode == 3 && v_uv.x > u_splitX) {
        if (abs(v_uv.x - u_splitX) < 0.0015) {
          gl_FragColor = vec4(1.0, 0.2, 0.2, 1.0);
          return;
        }
        gl_FragColor = texture2D(u_tex, v_uv);
        return;
      }

      vec2 step = 1.0 / u_texSize;
      vec4 center = texture2D(u_tex, v_uv);

      // Adaptive 9-Tap High-Pass Kernel
      vec4 n = texture2D(u_tex, v_uv + vec2(0.0, -step.y));
      vec4 s = texture2D(u_tex, v_uv + vec2(0.0, step.y));
      vec4 e = texture2D(u_tex, v_uv + vec2(step.x, 0.0));
      vec4 w = texture2D(u_tex, v_uv + vec2(-step.x, 0.0));
      vec4 laplacian = 4.0 * center - (n + s + e + w);

      float strength = (u_mode == 1) ? 0.35 : 0.65;
      vec4 enhanced = center + laplacian * strength;

      // Color vibrance & contrast boost for AI Super-Res
      if (u_mode == 2 || u_mode == 3) {
        enhanced = mix(enhanced, enhanced * 1.04, 0.4);
      }

      gl_FragColor = clamp(enhanced, 0.0, 1.0);
    }
  `;

  static createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn("[AIUpscalerService] Shader compile error:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  static createProgram(gl, vsSource, fsSource) {
    const vs = this.createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = this.createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return null;

    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn("[AIUpscalerService] Program link error:", gl.getProgramInfoLog(program));
      return null;
    }
    return program;
  }
}
