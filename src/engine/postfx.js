// ---------------------------------------------------------------------------
// WebGL post processing: barrel distortion, chromatic aberration, bloom,
// scanlines, grain, vignette (tightens with dread), colour grading, glitch and
// white flash.  The pixel-art scene canvas is the only texture.
// ---------------------------------------------------------------------------

const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec2  uTexel;      // 1 / texture size
uniform float uTime;
uniform float uFear;       // 0..1 dread
uniform float uFlash;      // white flash 0..1
uniform float uGlitch;     // 0..1
uniform float uFade;       // 0..1 fade to black
uniform float uAberr;      // chromatic aberration strength
uniform float uVignette;
uniform float uDesat;
uniform float uWobble;
uniform float uBloom;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec3 sampleTex(vec2 uv) { return texture2D(uTex, clamp(uv, vec2(0.0005), vec2(0.9995))).rgb; }

void main() {
  vec2 uv = vUv;
  vec2 c = uv - 0.5;
  float r2 = dot(c, c);

  // --- vertical wobble: the house breathing when you are scared
  if (uWobble > 0.0001) {
    uv.x += sin(uv.y * 26.0 + uTime * 1.7) * 0.0016 * uWobble;
    uv.y += sin(uv.x * 18.0 - uTime * 1.1) * 0.0011 * uWobble;
  }

  // --- barrel distortion
  uv = 0.5 + c * (1.0 + 0.055 * r2 + 0.03 * r2 * r2);

  // --- glitch: horizontal band tearing
  float g = uGlitch;
  if (g > 0.001) {
    float band = floor(uv.y * 34.0);
    float n = hash(vec2(band, floor(uTime * 22.0)));
    float amt = step(0.72 - g * 0.35, n) * g;
    uv.x += (n - 0.5) * 0.09 * amt;
  }

  // --- chromatic aberration, stronger towards the edges
  float ab = (uAberr + g * 0.01) * (0.35 + r2 * 1.8);
  vec3 col;
  col.r = sampleTex(uv + c * ab * 1.0).r;
  col.g = sampleTex(uv).g;
  col.b = sampleTex(uv - c * ab * 1.0).b;

  // --- cheap bloom: bright pass, 8 taps
  if (uBloom > 0.001) {
    vec3 bl = vec3(0.0);
    for (int i = 0; i < 8; i++) {
      float a = float(i) * 0.785398163;
      vec2 o = vec2(cos(a), sin(a));
      bl += max(sampleTex(uv + o * uTexel * 2.5) - 0.55, 0.0);
      bl += max(sampleTex(uv + o * uTexel * 5.5) - 0.62, 0.0);
    }
    col += bl * (uBloom / 16.0);
  }

  // --- colour grade: cold moonlight, crushed blacks, contrast
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  vec3 cold = vec3(0.72, 0.84, 1.06);
  vec3 warm = vec3(1.05, 0.96, 0.86);
  vec3 tint = mix(warm, cold, 0.55 + uFear * 0.35);
  col *= tint;
  col = mix(vec3(lum), col, 1.0 - uDesat);
  col = (col - 0.5) * (1.16 + uFear * 0.14) + 0.5;
  col = max(col - 0.012, 0.0);

  // --- scanlines + grain
  float scan = 0.94 + 0.06 * sin(uv.y / uTexel.y * 3.14159265);
  col *= mix(1.0, scan, 0.55);
  float grain = hash(uv * vec2(1024.0, 640.0) + fract(uTime) * 91.7);
  col += (grain - 0.5) * (0.055 + uFear * 0.075);

  // --- vignette (closes in as dread rises)
  float vig = smoothstep(0.92 - uFear * 0.34, 0.22, length(c) * (1.0 + uVignette));
  col *= mix(1.0, vig, 0.55 + uFear * 0.4);

  // --- flash / fade
  col += vec3(uFlash);
  col *= 1.0 - uFade;

  gl_FragColor = vec4(col, 1.0);
}`;

export class PostFX {
  constructor(canvas) {
    this.canvas = canvas;
    const gl = (this.gl =
      canvas.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false }) ||
      canvas.getContext('experimental-webgl'));
    if (!gl) throw new Error('WebGL unavailable');

    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s), src);
      return s;
    };
    const prog = (this.prog = gl.createProgram());
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    this.u = {};
    for (const n of ['uTex', 'uTexel', 'uTime', 'uFear', 'uFlash', 'uGlitch', 'uFade', 'uAberr', 'uVignette', 'uDesat', 'uWobble', 'uBloom']) {
      this.u[n] = gl.getUniformLocation(prog, n);
    }

    this.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.uniform1i(this.u.uTex, 0);
    this.texW = 0;
    this.texH = 0;
  }

  resize(w, h, dpr) {
    const cw = Math.max(1, Math.round(w * dpr));
    const ch = Math.max(1, Math.round(h * dpr));
    if (this.canvas.width !== cw || this.canvas.height !== ch) {
      this.canvas.width = cw;
      this.canvas.height = ch;
    }
    this.dpr = dpr;
  }

  render(src, p) {
    const gl = this.gl;
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    if (src.width !== this.texW || src.height !== this.texH) {
      this.texW = src.width;
      this.texH = src.height;
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.uniform2f(this.u.uTexel, 1 / src.width, 1 / src.height);
    } else {
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, src);
    }
    gl.uniform1f(this.u.uTime, p.time);
    gl.uniform1f(this.u.uFear, p.fear);
    gl.uniform1f(this.u.uFlash, p.flash);
    gl.uniform1f(this.u.uGlitch, p.glitch);
    gl.uniform1f(this.u.uFade, p.fade);
    gl.uniform1f(this.u.uAberr, p.aberr);
    gl.uniform1f(this.u.uVignette, p.vignette);
    gl.uniform1f(this.u.uDesat, p.desat);
    gl.uniform1f(this.u.uWobble, p.wobble);
    gl.uniform1f(this.u.uBloom, p.bloom);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
