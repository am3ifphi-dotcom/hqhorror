// ---------------------------------------------------------------------------
// small shared helpers: math, rng, input, asset loading
// ---------------------------------------------------------------------------

export const TAU = Math.PI * 2;

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, rate, dt) => lerp(a, b, 1 - Math.exp(-rate * dt));
export const smoothstep = (t) => t * t * (3 - 2 * t);
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

/** deterministic per-room noise so props/floors look hand placed but stable */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** value noise in 1d, used for flicker / breathing */
export function noise1(t, seed = 0) {
  const i = Math.floor(t);
  const f = t - i;
  const h = (n) => {
    let x = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  return lerp(h(i), h(i + 1), smoothstep(f));
}

// ---------------------------------------------------------------------------
// input
// ---------------------------------------------------------------------------
const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  KeyZ: 'ok', Enter: 'ok', Space: 'ok',
  KeyX: 'cancel', Escape: 'cancel',
  ShiftLeft: 'run', ShiftRight: 'run',
};

export class Input {
  constructor(target = window) {
    this.down = new Set();
    this.pressed = new Set();
    this.released = new Set();
    this.axis = { x: 0, y: 0 };
    target.addEventListener('keydown', (e) => {
      const k = KEYMAP[e.code];
      if (!k) return;
      e.preventDefault();
      if (!this.down.has(k)) this.pressed.add(k);
      this.down.add(k);
    });
    target.addEventListener('keyup', (e) => {
      const k = KEYMAP[e.code];
      if (!k) return;
      e.preventDefault();
      this.down.delete(k);
      this.released.add(k);
    });
    window.addEventListener('blur', () => this.down.clear());
  }
  /** call once per frame, after polling */
  endFrame() {
    this.pressed.clear();
    this.released.clear();
  }
  held(k) { return this.down.has(k); }
  hit(k) { return this.pressed.has(k); }
  /** normalised movement vector */
  move() {
    let x = (this.held('right') ? 1 : 0) - (this.held('left') ? 1 : 0);
    let y = (this.held('down') ? 1 : 0) - (this.held('up') ? 1 : 0);
    if (x && y) { const s = Math.SQRT1_2; x *= s; y *= s; }
    return { x, y };
  }
}

// ---------------------------------------------------------------------------
// assets
// ---------------------------------------------------------------------------
export function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('failed to load ' + src));
    img.src = src;
  });
}

export class Atlas {
  constructor(image, meta) {
    this.img = image;
    this.frames = meta.frames;
    this.w = meta.w;
    this.h = meta.h;
  }
  frame(name) {
    const f = this.frames[name];
    if (!f) {
      console.warn('[atlas] missing frame', name);
      return { x: 0, y: 0, w: 1, h: 1, ax: 0.5, ay: 1, cw: 0, ch: 0, tile: true };
    }
    return f;
  }
  /** draw a frame so that the anchor point lands on (x, y) */
  draw(ctx, name, x, y, opt = {}) {
    const f = this.frame(name);
    const s = opt.scale ?? 1;
    const dx = Math.round(x - f.w * (f.ax ?? 0.5) * s);
    const dy = Math.round(y - f.h * (f.ay ?? 1) * s);
    if (opt.alpha != null && opt.alpha < 1) {
      ctx.save();
      ctx.globalAlpha = opt.alpha;
    }
    if (opt.tint) {
      ctx.save();
      // cheap tint: draw silhouette then colour over it
      ctx.drawImage(this.img, f.x, f.y, f.w, f.h, dx, dy, f.w * s, f.h * s);
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = opt.tint;
      ctx.fillRect(dx, dy, f.w * s, f.h * s);
      ctx.restore();
    } else {
      ctx.drawImage(this.img, f.x, f.y, f.w, f.h, dx, dy, f.w * s, f.h * s);
    }
    if (opt.alpha != null && opt.alpha < 1) ctx.restore();
    return { dx, dy, w: f.w * s, h: f.h * s };
  }
}

/** A frame grid inside a single image (character sprite sheets). */
export class Sheet {
  constructor(image, fw, fh, rows, cols) {
    this.img = image;
    this.fw = fw;
    this.fh = fh;
    this.rows = rows;
    this.cols = cols;
  }
  static async load(src, fw, fh) {
    const img = await loadImage(src);
    return new Sheet(img, fw, fh, img.height / fh, img.width / fw);
  }
  draw(ctx, frame, row, x, y, opt = {}) {
    const s = opt.scale ?? 1;
    const ax = opt.ax ?? 0.5;
    const ay = opt.ay ?? 1;
    const w = this.fw * s;
    const h = this.fh * s;
    const dx = Math.round(x - w * ax);
    const dy = Math.round(y - h * ay);
    ctx.save();
    if (opt.alpha != null) ctx.globalAlpha = opt.alpha;
    if (opt.flip) {
      ctx.translate(dx + w, dy);
      ctx.scale(-1, 1);
      ctx.drawImage(this.img, frame * this.fw, row * this.fh, this.fw, this.fh, 0, 0, w, h);
    } else {
      ctx.drawImage(this.img, frame * this.fw, row * this.fh, this.fw, this.fh, dx, dy, w, h);
    }
    ctx.restore();
  }
}
