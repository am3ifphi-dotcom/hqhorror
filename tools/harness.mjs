// ---------------------------------------------------------------------------
// Headless browser stand-in: jsdom + stubbed (or real, when REAL2D=1) canvas,
// stubbed WebGL, stubbed WebAudio, file-system fetch.
//
//   import { boot } from './harness.mjs';
//   const { game, step, press, release, tapZ, drain, dump } = await boot();
//
// REAL2D=1 renders with @napi-rs/canvas, so the 2D scene can be dumped to a
// real PNG for visual inspection (tools/shot.mjs).  WebGL post-processing has
// no headless equivalent, so dumps show the raw scene without post FX.
// ---------------------------------------------------------------------------
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
export const REAL2D = process.env.REAL2D === '1';

// ---------------------------------------------------------------- stub utils
const audioParam = () => {
  const p = {
    value: 0,
    setValueAtTime() { return p; },
    linearRampToValueAtTime() { return p; },
    exponentialRampToValueAtTime() { return p; },
    cancelScheduledValues() { return p; },
    setTargetAtTime() { return p; },
  };
  return p;
};

function nodeStub() {
  const target = {
    connect(next) { return next; },
    disconnect() {},
    start() {},
    stop() {},
    gain: audioParam(),
    frequency: audioParam(),
    detune: audioParam(),
    Q: audioParam(),
    pan: audioParam(),
    threshold: audioParam(),
    ratio: audioParam(),
    attack: audioParam(),
    release: audioParam(),
    playbackRate: audioParam(),
    type: 'sine',
    buffer: null,
    loop: false,
  };
  return new Proxy(target, {
    get(t, k) {
      if (k in t) return t[k];
      if (typeof k === 'symbol') return undefined;
      return () => nodeStub();
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}

class FakeAudioContext {
  constructor() {
    this.currentTime = 0;
    this.sampleRate = 44100;
    this.state = 'running';
    this.destination = nodeStub();
  }
  resume() { return Promise.resolve(); }
  createGain() { return nodeStub(); }
  createBiquadFilter() { return nodeStub(); }
  createOscillator() { return nodeStub(); }
  createBufferSource() { return nodeStub(); }
  createConvolver() { return nodeStub(); }
  createStereoPanner() { return nodeStub(); }
  createDynamicsCompressor() { return nodeStub(); }
  createBuffer(ch, len) {
    const data = new Float32Array(len);
    return { length: len, numberOfChannels: ch, getChannelData: () => data, duration: len / this.sampleRate };
  }
  async decodeAudioData() { return this.createBuffer(1, 4410); }
}

function glStub() {
  const t = {
    VERTEX_SHADER: 1, FRAGMENT_SHADER: 2, COMPILE_STATUS: 3, LINK_STATUS: 4,
    TEXTURE_2D: 5, RGBA: 6, UNSIGNED_BYTE: 7, CLAMP_TO_EDGE: 8, NEAREST: 9,
    TEXTURE_WRAP_S: 10, TEXTURE_WRAP_T: 11, TEXTURE_MIN_FILTER: 12, TEXTURE_MAG_FILTER: 13,
    UNPACK_FLIP_Y_WEBGL: 14, ARRAY_BUFFER: 15, STATIC_DRAW: 16, FLOAT: 17, TRIANGLES: 18,
  };
  return new Proxy(t, {
    get(o, k) {
      if (k in o) return o[k];
      if (typeof k === 'symbol') return undefined;
      return () => {
        if (k === 'getShaderParameter' || k === 'getProgramParameter') return true;
        if (k === 'getShaderInfoLog' || k === 'getProgramInfoLog') return '';
        if (k === 'getUniformLocation') return {};
        if (k === 'getAttribLocation') return 0;
        if (String(k).startsWith('create')) return {};
        return undefined;
      };
    },
    set(o, k, v) { o[k] = v; return true; },
  });
}

function ctx2dStub(canvas) {
  const store = { canvas };
  const grad = { addColorStop() {} };
  const fns = {
    createRadialGradient: () => grad,
    createLinearGradient: () => grad,
    measureText: (s) => ({ width: String(s).length * 8 }),
    getImageData: (x, y, w, h) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }),
    createPattern: () => ({}),
  };
  return new Proxy(store, {
    get(o, k) {
      if (k in o) return o[k];
      if (k in fns) return fns[k];
      if (typeof k === 'symbol') return undefined;
      return () => undefined;
    },
    set(o, k, v) { o[k] = v; return true; },
  });
}

function pngSize(buf) {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  return { width: 64, height: 64 };
}

// ------------------------------------------------------------------- harness
export async function boot(opts = {}) {
  const real = opts.real2d ?? REAL2D;
  let napi = null;
  if (real) {
    napi = await import('@napi-rs/canvas');
    try {
      napi.GlobalFonts.registerFromPath(path.join(ROOT, 'public/assets/fonts/shippori-mincho-subset.woff2'), 'Shippori Mincho');
    } catch (e) { console.warn('  [font register failed]', e.message); }
  }

  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const dom = new JSDOM(html, { url: 'http://localhost/' });
  const { window } = dom;
  const proto = window.HTMLCanvasElement.prototype;

  Object.defineProperty(proto, 'width', {
    get() { return this.__w ?? 300; },
    set(v) { this.__w = v | 0; if (this.__napi) this.__napi.width = v | 0; },
    configurable: true,
  });
  Object.defineProperty(proto, 'height', {
    get() { return this.__h ?? 150; },
    set(v) { this.__h = v | 0; if (this.__napi) this.__napi.height = v | 0; },
    configurable: true,
  });
  const noWebGL = opts.noWebGL ?? process.env.NOWEBGL === '1';
  proto.getContext = function (type) {
    if (type !== '2d') return noWebGL ? null : glStub();
    if (!real) return ctx2dStub(this);
    if (!this.__napi) this.__napi = napi.createCanvas(this.__w || 300, this.__h || 150);
    const nctx = this.__napi.getContext('2d');
    // @napi-rs/canvas only accepts ITS OWN canvas objects, while the game (as a
    // browser would) passes DOM elements.  Translate on the way in.
    const el = this;
    return new Proxy(nctx, {
      get(o, k) {
        if (k === 'canvas') return el;
        const v = o[k];
        if (typeof v !== 'function') return v;
        if (k === 'drawImage' || k === 'createPattern') {
          return (...a) => v.apply(o, a.map((x) => (x && x.__napi ? x.__napi : x)));
        }
        return v.bind(o);
      },
      set(o, k, v) { o[k] = v; return true; },
    });
  };

  window.AudioContext = FakeAudioContext;
  window.devicePixelRatio = 1;

  const fileFor = (url) => path.join(ROOT, 'public', String(url).replace(/^\//, ''));

  if (real) {
    const NapiImage = napi.Image;
    const srcSetter = Object.getOwnPropertyDescriptor(NapiImage.prototype, 'src').set;
    window.Image = function () {
      const img = new NapiImage();
      let onload = null, onerror = null;
      Object.defineProperties(img, {
        src: {
          set(v) {
            const f = fileFor(v);
            if (!fs.existsSync(f)) {
              console.error('  [image missing]', f);
              setTimeout(() => onerror?.(new Error('missing ' + f)), 0);
              return;
            }
            const buf = fs.readFileSync(f);
            // decode synchronously-ish; napi-rs parses the buffer on assignment
            srcSetter.call(img, buf);
            setTimeout(() => onload?.(), 0);
          },
          get() { return ''; },
          configurable: true,
        },
        onload: { get: () => onload, set: (f) => { onload = f; }, configurable: true },
        onerror: { get: () => onerror, set: (f) => { onerror = f; }, configurable: true },
      });
      return img;
    };
  } else {
    class FakeImage {
      constructor() {
        this._src = '';
        this.onload = null;
        this.onerror = null;
        this.width = 64;
        this.height = 64;
      }
      set src(v) {
        this._src = v;
        const file = fileFor(v);
        setTimeout(() => {
          if (fs.existsSync(file)) {
            const s = pngSize(fs.readFileSync(file));
            this.width = s.width;
            this.height = s.height;
            this.onload?.();
          } else {
            console.error('  [image missing]', file);
            this.onerror?.(new Error('missing ' + file));
          }
        }, 0);
      }
      get src() { return this._src; }
    }
    window.Image = FakeImage;
  }

  const raf = [];
  window.requestAnimationFrame = (cb) => raf.push(cb);
  window.cancelAnimationFrame = () => {};

  window.fetch = async (url) => {
    const file = fileFor(url);
    if (!fs.existsSync(file)) return { ok: false, status: 404, json: async () => ({}), arrayBuffer: async () => new ArrayBuffer(0) };
    const buf = fs.readFileSync(file);
    return {
      ok: true,
      status: 200,
      json: async () => JSON.parse(buf.toString('utf8')),
      arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength),
    };
  };

  for (const k of ['window', 'document', 'Image', 'requestAnimationFrame', 'cancelAnimationFrame', 'fetch', 'AudioContext', 'devicePixelRatio', 'HTMLElement', 'Event', 'KeyboardEvent']) {
    try {
      Object.defineProperty(globalThis, k, { value: window[k], configurable: true, writable: true });
    } catch { /* read-only global */ }
  }
  globalThis.performance = { now: () => Date.now() };

  await import('../src/main.js');
  while (!window.__game) await new Promise((r) => setTimeout(r, 20));
  const game = window.__game;

  let ts = 0;
  /** one frame; setImmediate lets promise microtasks flush like a browser */
  const step = async (n = 1, dt = 16.7) => {
    for (let i = 0; i < n; i++) {
      ts += dt;
      const cbs = raf.splice(0, raf.length);
      for (const cb of cbs) cb(ts);
      await new Promise((r) => setImmediate(r));
    }
  };
  const press = (code) => window.dispatchEvent(new window.KeyboardEvent('keydown', { code }));
  const release = (code) => window.dispatchEvent(new window.KeyboardEvent('keyup', { code }));
  const tapZ = async () => { press('KeyZ'); await step(1); release('KeyZ'); };
  const drain = async (max = 500) => {
    for (let i = 0; i < max; i++) {
      if (game.ui.type) await tapZ();
      else if (game.dir.busy) await step(1);
      else { await step(1); break; }
    }
  };
  /** write the raw 2D scene canvas out as a PNG (needs real2d): */
  const dump = (name) => {
    const c = game.scene?.__napi;
    if (!c) { console.error('  [dump] no real canvas behind game.scene (run with REAL2D=1)'); return null; }
    const out = path.join(ROOT, 'tools/shots', name);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, c.toBuffer('image/png'));
    return out;
  };

  return { dom, window, game, step, press, release, tapZ, drain, dump, raf };
}
