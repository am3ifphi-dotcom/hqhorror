// ---------------------------------------------------------------------------
// しずかな家 — bootstrap, game loop, scene director
// ---------------------------------------------------------------------------
import { Atlas, Sheet, Input, loadImage, clamp, damp, lerp, noise1 } from './engine/core.js';
import { audio } from './engine/audio.js';
import { PostFX } from './engine/postfx.js';
import { ScreenFX, Particles, flicker } from './engine/fx.js';
import { UI } from './ui/ui.js';
import { ROOMS } from './game/rooms.js';
import { Room, Camera, TILE } from './game/world.js';
import { Player, Ghost } from './game/actors.js';
import { buildPolys, renderDarkness, renderGlows } from './game/lighting.js';
import { INTERACT, enterHall, enterCorridor, enterChildroom, enterStudy, enterBasement, wait, until } from './game/script.js';

const VIEW_W = 480;
const VIEW_H = 270;

class Director {
  constructor() {
    this.stack = [];
  }
  run(gen, tag = '') {
    if (!gen) return;
    const it = gen();
    this.stack.push({ it, w: null, done: false, tag });
  }
  clear(tag) {
    const before = this.stack.length;
    if (tag) this.stack = this.stack.filter((c) => c.tag !== tag);
    else this.stack.length = 0;
    return this.stack.length !== before;
  }
  get busy() {
    return this.stack.length > 0;
  }
  /** true only while a room-scoped, dialogue-driving scene is running */
  busyScene() {
    return this.stack.some((c) => c.tag === 'scene');
  }
  makeWaiter(v) {
    if (v == null) return null;
    if (typeof v === 'number') return { t: v, update(dt) { this.t -= dt; return this.t <= 0; } };
    if (typeof v.then === 'function') {
      let done = false;
      v.then(() => (done = true));
      const w = { _p: v, _done: () => done, update() { return done; } };
      return w;
    }
    if (typeof v.update === 'function') return v;
    return null;
  }
  update(dt) {
    for (const c of this.stack) {
      let guard = 0;
      while (!c.done && guard++ < 200) {
        if (c.w) {
          if (!c.w.update(dt)) break;
          c.w = null;
        }
        const r = c.it.next();
        if (r.done) { c.done = true; break; }
        c.w = this.makeWaiter(r.value);
        if (!c.w) continue;
        if (c.w.update(0)) c.w = null;
      }
    }
    if (this.stack.some((c) => c.done)) this.stack = this.stack.filter((c) => !c.done);
  }
}

class Game {
  constructor() {
    this.state = 'boot';
    this.t = 0;
    this.fear = 0;
    this.flags = {};
    this.items = [];
    this.dir = new Director();
    this.input = new Input();
    this.sfx = new ScreenFX();
    this.particles = new Particles(VIEW_W, VIEW_H);
    this.dollEyes = 0;
    this.chaseUntil = null;
  }

  // ------------------------------------------------------------------ init
  async init() {
    const scene = (this.scene = document.createElement('canvas'));
    scene.width = VIEW_W;
    scene.height = VIEW_H;
    this.sctx = scene.getContext('2d', { alpha: false });
    this.sctx.imageSmoothingEnabled = false;

    const postCanvas = document.getElementById('post');
    this.post = new PostFX(postCanvas);

    const [atlasImg, atlasJson] = await Promise.all([
      loadImage('/assets/atlas.png'),
      fetch('/assets/atlas.json').then((r) => r.json()),
    ]);
    this.atlas = new Atlas(atlasImg, atlasJson);

    const [gi, gw, gr, wi, ww, wr] = await Promise.all([
      Sheet.load('/assets/sprites/girl_idle.png', 64, 64),
      Sheet.load('/assets/sprites/girl_walk.png', 64, 64),
      Sheet.load('/assets/sprites/girl_run.png', 64, 64),
      Sheet.load('/assets/sprites/wraith_idle.png', 64, 64),
      Sheet.load('/assets/sprites/wraith_walk.png', 64, 64),
      Sheet.load('/assets/sprites/wraith_run.png', 64, 64),
    ]);
    this.girlSheets = { idle: gi, walk: gw, run: gr };
    this.wraithSheets = { idle: wi, walk: ww, run: wr };

    this.ui = new UI(document.getElementById('ui'), audio);
    this.player = new Player(this.girlSheets, 0, 0);
    this.player.onStep = (running) => audio.footstep(running ? 1 : 0.7, clamp((this.player.x - this.cam.x) / VIEW_W - 0.5, -1, 1) * 0.4);
    this.ghost = new Ghost(this.wraithSheets, 0, 0);
    this.ghost.onWhisper = () => audio.whisper((Math.random() * 2 - 1) * 0.7);
    this.cam = new Camera(VIEW_W, VIEW_H);

    this.onResize();
    window.addEventListener('resize', () => this.onResize());

    document.getElementById('bootbtn').addEventListener('click', () => this.start());
    document.getElementById('title').addEventListener('click', () => this.start());

    this.sfx.fadeTo(0, 0.001);
    requestAnimationFrame((ts) => this.loop(ts));
  }

  onResize() {
    const pad = 0;
    const aw = window.innerWidth - pad;
    const ah = window.innerHeight - pad;
    const scale = Math.min(aw / VIEW_W, ah / VIEW_H);
    const w = Math.floor(VIEW_W * scale);
    const h = Math.floor(VIEW_H * scale);
    const stage = document.getElementById('stage');
    stage.style.width = w + 'px';
    stage.style.height = h + 'px';
    document.documentElement.style.setProperty('--u', (h / 100).toFixed(3));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.post.resize(w, h, dpr);
  }

  async start() {
    if (this.state !== 'boot' && this.state !== 'title') return;
    document.getElementById('boot').classList.add('gone');
    await audio.unlock();
    if (this.state === 'boot') {
      this.state = 'title';
      this.titleT = 0;
      this.audio = audio;
      audio.startAmbience('outside');
      this.particles.rainAmount = 1;
      return;
    }
    this.beginGame();
  }

  beginGame() {
    this.state = 'play';
    document.getElementById('title').classList.add('gone');
    this.flags = {};
    this.items = [];
    this.fear = 0;
    this.particles.rainAmount = 0;
    this.dir.clear();
    audio.startAmbience('house');
    this.setRoom('hall', ROOMS.hall.spawn, true);
    this.sfx.fadeTo(1, 6);
    this.ui.setItems(this.items);
    this.dir.run(() => this.prologue(), 'flow');
  }

  *prologue() {
    this.sfx.fadeTo(1, 3);
    yield wait(1.2);
    this.sfx.fadeTo(0, 1.4);
    yield wait(0.8);
    this.dir.run(enterHall(this));
  }

  restart() {
    this.state = 'title';
    this.ui.setBars(0);
    this.ui.prompt(null);
    this.sfx.fadeTo(0, 1.5);
    document.getElementById('title').classList.remove('gone');
    this.particles.rainAmount = 1;
    audio.startAmbience('outside');
    this.dir.clear();
    this.ghost.vanish();
  }

  // ----------------------------------------------------------------- rooms
  setRoom(id, spawn, silent = false) {
    const data = ROOMS[id];
    this.room = new Room(id, data, this.atlas);
    this.room.dollEyes = 0;
    const [sx, sy] = spawn;
    this.player.x = sx * TILE;
    this.player.y = sy * TILE;
    this.player.dir = 0;
    this.player.state = 'idle';
    this.cam.snap(this.player.x, this.player.y, this.room);
    const d = data;
    this.particles.rainAmount = d.rain ?? 0;
    this.particles.dustAmount = d.dust ?? 1;
    this.particles.fogAmount = d.fog ?? 0;
    if (!silent) {
      audio.setAmbienceMix({ drone: d.drone ?? 0.1, wind: d.wind ?? 0.08, rain: d.rain ? 0.2 : 0.05 });
    }
    if (d.chapter && !this.flags['chap_' + id]) {
      this.flags['chap_' + id] = true;
    }
    const enter = { hall: enterHall, corridor: enterCorridor, childroom: enterChildroom, study: enterStudy, basement: enterBasement }[id];
    if (this.dir.clear('scene')) this.ui.close();
    this.doorCooldown = 0.6;
    this.dir.run(enter && enter(this), 'scene');
  }

  transition(door) {
    const self = this;
    this.dir.run(function* () {
      self.player.frozen = true;
      self.ui.prompt(null);
      if (door.need && !self.has(door.need)) {
        audio.play('latch', { volume: 0.7 });
        yield self.mono(door.locked || '鍵がかかっている。', 'base');
        self.player.frozen = false;
        return;
      }
      audio.door(0.7);
      yield wait(0.35);
      self.sfx.fadeTo(1, 4.5);
      yield wait(0.95);
      if (self.dir.clear('scene')) self.ui.close();
      self.setRoom(door.to, door.spawn);
      self.player.frozen = false;
      if (self.room.id !== 'basement') self.ghost.vanish();
      yield wait(0.15);
      self.sfx.fadeTo(0, 2.2);
    }, 'flow');
  }

  // ------------------------------------------------------------ game utils
  mono(text, expr) {
    return this.ui.say(null, text, { expr, cps: 30 });
  }
  say(name, text, expr) {
    return this.ui.say(name, text, { expr, cps: 32 });
  }
  has(id) {
    return this.items.some((i) => i.id === id);
  }
  give(id, name) {
    if (this.has(id)) return;
    this.items.push({ id, name });
    this.ui.setItems(this.items);
    this.ui.toast('★ ' + name + ' を手に入れた');
    audio.play('ui_ok', { volume: 0.4 });
  }
  addFear(v) {
    this.fear = clamp(this.fear + v, 0, 1);
    audio.setFear(this.fear);
    this.ui.setFear(this.fear);
  }
  flickerLights(amount = 1) {
    this.lightFlicker = amount;
    this.sfx.glitch(0.25 * amount, 2.4);
  }
  jumpScare(kind = 'ghost') {
    audio.sting(1);
    this.sfx.flash(0.55, 3.4);
    this.sfx.glitch(1, 1.4);
    this.sfx.shake(4, 0.5);
    this.scareFace = kind === 'face' ? 1.6 : 1.2;
  }
  scare(glitch = 0.3, shake = 1) {
    this.sfx.glitch(glitch, 2);
    this.sfx.shake(shake, 0.35);
  }
  /** promote the running cutscene so a room change will not cancel it */
  setFlow() {
    const c = this.dir.stack[this.dir.stack.length - 1];
    if (c) c.tag = 'flow';
  }
  hideProp(t) {
    const p = this.room.props.find((p) => p.t === t);
    if (p) p.hidden = true;
  }

  // ------------------------------------------------------------------ loop
  loop(ts) {
    const dt = Math.min(0.05, (ts - (this.last ?? ts)) / 1000);
    this.last = ts;
    this.t += dt;
    this.update(dt);
    this.render();
    this.input.endFrame();
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    audio.update(dt);
    this.sfx.update(dt);
    this.ui.update(dt);
    this.particles.update(dt, this.t, { x: this.cam.x, y: this.cam.y });

    if (this.state === 'title') {
      this.titleT += dt;
      this.updateTitle(dt);
      return;
    }
    if (this.state !== 'play') return;

    this.dir.update(dt);

    // dialogue / ok handling ---------------------------------------------
    if (this.input.hit('cancel') && !this.ui.type) {
      this.togglePause();
    }
    if (this.ui.type) {
      if (this.input.hit('ok')) this.ui.advance();
      this.player.frozen = true;
    } else if (!this.dir.busy) {
      this.player.frozen = false;
    }

    // player ---------------------------------------------------------------
    if (!this.player.frozen) this.player.update(dt, this.input, this.room, this.t);
    else this.player.update(dt, { move: () => ({ x: 0, y: 0 }), held: () => false }, this.room, this.t);

    // ghost ----------------------------------------------------------------
    if (this.ghost.mode !== 'off') {
      this.ghost.update(dt, this.room, this.player, this.t);
      const d = Math.hypot(this.ghost.x - this.player.x, this.ghost.y - this.player.y);
      if (d < 260) this.addFear(dt * 0.42 * (1 - d / 260) * (this.ghost.mode === 'hunt' ? 2.2 : 1));
      if (this.ghost.mode === 'hunt' && d < 22 && this.ghost.hitCooldown <= 0) {
        this.ghost.hitCooldown = 1.6;
        this.sfx.shake(6, 0.5);
        this.sfx.flash(0.3, 4);
        audio.sting(0.8);
        this.addFear(0.22);
      }
    }

    // fear decay in the light ---------------------------------------------
    const lit = this.player.lightOn ? 1 : 0;
    this.addFear(-dt * 0.028 * (0.4 + lit * 0.6 + (this.room.d.dark < 0.885 ? 0.4 : 0)));

    // camera ---------------------------------------------------------------
    const lead = { x: this.player.vx * 0.16, y: this.player.vy * 0.1 };
    this.cam.follow(this.player.x, this.player.y - 10, this.room, dt, lead);

    // interactions ---------------------------------------------------------
    this.updateInteract();

    // ambient events -------------------------------------------------------
    this.updateAmbient(dt);
  }

  updateInteract() {
    if (this.ui.type || this.dir.busyScene()) {
      this.ui.prompt(null);
      return;
    }
    const p = this.player;
    const inRect = (r) =>
      p.x > r.x * TILE && p.x < (r.x + r.w) * TILE && p.y > r.y * TILE - 6 && p.y < (r.y + r.h) * TILE + 12;

    this.doorCooldown = Math.max(0, (this.doorCooldown ?? 0) - 1 / 60);
    for (const d of this.room.d.doors || []) {
      if (inRect(d) && this.doorCooldown <= 0) {
        this.ui.prompt(`［Z］ ${d.label}`);
        if (this.input.hit('ok')) {
          audio.ui('ok');
          this.transition(d);
        }
        return;
      }
    }
    for (const s of this.room.spots) {
      const r = { x: s.x - 0.35, y: s.y - 0.35, w: s.w + 0.7, h: s.h + 0.7 };
      if (inRect(r)) {
        this.ui.prompt(`［Z］ しらべる：${s.label}`);
        if (this.input.hit('ok')) {
          audio.ui('ok');
          const fn = INTERACT[s.id];
          const self = this;
          if (fn) this.dir.run(() => fn(self), 'scene');
          else this.dir.run(function* () { yield self.mono('……なにもない。', 'base'); }, 'scene');
        }
        return;
      }
    }
    this.ui.prompt(null);
  }

  updateAmbient(dt) {
    const r = this.room;
    if (!r) return;
    // embers in the study fireplace
    if (r.id === 'study' && Math.random() < dt * 6) {
      this.particles.addEmbers(3.4 * TILE, 5.0 * TILE - 24, 1);
    }
    if (r.id === 'basement' && Math.random() < dt * 0.35) {
      audio.play('thud', { volume: 0.18, rate: 0.6 + Math.random() * 0.5, verb: 0.9, pan: Math.random() * 2 - 1 });
    }
    // random whispers when dread is high
    if (this.fear > 0.45 && Math.random() < dt * 0.12) audio.whisper(Math.random() * 2 - 1);
    // distant thunder
    this.thunderT = (this.thunderT ?? 8) - dt;
    if (this.thunderT <= 0) {
      this.thunderT = 14 + Math.random() * 26;
      const near = Math.random() < 0.35;
      audio.thunder(near);
      if (near) {
        this.lightning = 0.55;
        this.lightningT = 0;
      }
    }
    if (this.lightning > 0) {
      this.lightningT += dt;
      this.lightning -= dt * 2.2;
      if (this.lightningT > 0.08 && this.lightningT < 0.18) this.sfx.flash(0.14, 5);
    }
    // the music box, if you kept it, sometimes plays by itself
    if (this.has('musicbox') && Math.random() < dt * 0.045) {
      audio.playMelody([72, 74, 76, 74, 72], { gap: 0.5, gain: 0.055, dur: 2.4 });
    }
    // doll eyes
    this.dollEyes = damp(this.dollEyes, clamp((this.player.x - 9.0 * TILE) / 60, -1, 1), 3, dt);
    r.dollEyes = this.dollEyes;
    // battery
    if (this.flags.chase) this.player.battery = clamp(this.player.battery - dt * 0.02, 0, 1);
  }

  togglePause() {
    const el = document.getElementById('pause');
    if (this.paused) {
      this.paused = false;
      el.classList.add('hidden');
    } else {
      this.paused = true;
      const rows = el.querySelector('.pause-rows');
      rows.innerHTML = `
        <div><b>移動</b>　矢印キー / WASD</div>
        <div><b>調べる・進む</b>　Z / Enter / Space</div>
        <div><b>走る</b>　Shift（長押し）</div>
        <div><b>メニュー</b>　X / Esc</div>
        <div style="margin-top:1em;opacity:.7">持ち物：${this.items.map((i) => i.name).join('・') || 'なし'}</div>
        <div style="margin-top:1.2em;font-size:.72em;line-height:1.7;opacity:.45">
          画像素材：LPC Revised（OGA-BY 3.0）Eliza Wyatt (DeathsDarling) ほか<br>
          フォント：Shippori Mincho（SIL OFL 1.1）The Shippori Mincho Project Authors<br>
          効果音：Kenney（CC0 1.0）／ 音楽・環境音・立ち絵・プログラム：本作オリジナル
        </div>`;
      el.classList.remove('hidden');
    }
  }

  updateTitle(dt) {
    this.particles.rainAmount = 1;
    if (this.input.hit('ok') && this.titleT > 2.2) {
      audio.ui('ok');
      this.beginGame();
      return;
    }
    // lightning on the title
    this.thunderT = (this.thunderT ?? 3) - dt;
    if (this.thunderT <= 0) {
      this.thunderT = 4 + Math.random() * 7;
      audio.thunder(Math.random() < 0.5);
      this.sfx.flash(0.22, 4);
    }
  }

  // ---------------------------------------------------------------- render
  render() {
    const ctx = this.sctx;
    const t = this.t;
    if (this.state === 'title' || !this.room) {
      this.drawTitle(ctx, t);
    } else {
      this.drawScene(ctx, t);
    }
    const fear = this.fear;
    this.post.render(this.scene, {
      time: t,
      fear,
      flash: this.sfx.flashV + (this.lightning > 0 ? this.lightning * 0.35 : 0),
      glitch: this.sfx.glitchV,
      fade: this.sfx.fadeV,
      aberr: 0.0012 + fear * 0.0042 + this.sfx.glitchV * 0.012,
      vignette: 0.08 + fear * 0.3,
      desat: 0.1 + fear * 0.22,
      wobble: fear * 0.9 + this.sfx.glitchV * 1.4,
      bloom: 0.6,
    });
  }

  drawTitle(ctx, t) {
    const W = VIEW_W;
    const H = VIEW_H;
    // sky
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0a0d16');
    g.addColorStop(0.55, '#101319');
    g.addColorStop(1, '#050609');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // moon glow
    const mg = ctx.createRadialGradient(360, 44, 2, 360, 44, 90);
    mg.addColorStop(0, 'rgba(190,205,230,0.20)');
    mg.addColorStop(1, 'rgba(190,205,230,0)');
    ctx.fillStyle = mg;
    ctx.fillRect(270, -46, 180, 180);

    // far trees
    ctx.fillStyle = '#07080c';
    for (let i = 0; i < 22; i++) {
      const x = i * 24 + 4;
      const h = 40 + ((i * 37) % 40);
      ctx.beginPath();
      ctx.moveTo(x, 210);
      ctx.lineTo(x + 11, 210 - h);
      ctx.lineTo(x + 22, 210);
      ctx.closePath();
      ctx.fill();
    }

    // the house
    const bx = 148;
    const by = 118;
    ctx.fillStyle = '#0d0f14';
    ctx.fillRect(bx, by, 184, 92);
    ctx.beginPath();
    ctx.moveTo(bx - 16, by + 2);
    ctx.lineTo(bx + 92, by - 52);
    ctx.lineTo(bx + 200, by + 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(bx + 30, by - 40, 16, 30); // chimney

    // windows — one of them is lit and flickers
    const win = (x, y, w, h, lit) => {
      ctx.fillStyle = lit ? `rgba(${230 + Math.sin(t * 6) * 12 | 0},170,90,${0.5 + flicker(t, 3, 0.5) * 0.4})` : 'rgba(30,34,44,0.9)';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(x + w / 2 - 1, y, 2, h);
      ctx.fillRect(x, y + h / 2 - 1, w, 2);
    };
    win(bx + 26, by + 22, 22, 26, false);
    win(bx + 78, by + 22, 22, 26, true);
    win(bx + 134, by + 22, 22, 26, false);
    win(bx + 78, by + 62, 30, 30, false);
    ctx.fillStyle = '#15181f';
    ctx.fillRect(bx + 74, by + 60, 30, 32);

    // ground
    ctx.fillStyle = '#05070a';
    ctx.fillRect(0, 208, W, H - 208);

    // puddle reflection of the lit window
    ctx.save();
    ctx.globalAlpha = 0.18 * (0.7 + flicker(t, 9, 0.4) * 0.3);
    ctx.fillStyle = '#c89050';
    ctx.fillRect(bx + 84, 214, 12, 30);
    ctx.restore();

    this.particles.drawRain(ctx);
    this.particles.drawFog(ctx);

    // vignette handled in post; add a soft title-side darkening
    const vg = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, 260);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }

  drawScene(ctx, t) {
    const W = VIEW_W;
    const H = VIEW_H;
    const room = this.room;
    const cx = this.cam.x + this.sfx.offsetX;
    const cy = this.cam.y + this.sfx.offsetY;
    const view = { x: Math.round(cx), y: Math.round(cy), w: W, h: H };

    ctx.imageSmoothingEnabled = false;
    // ambient tint of the room floor
    ctx.fillStyle = '#05060a';
    ctx.fillRect(0, 0, W, H);

    room.drawGround(ctx, view);
    room.drawWalls(ctx, view);

    // ---- y-sorted entities ------------------------------------------------
    const ents = [];
    for (const p of room.yProps) {
      if (p.hidden) continue;
      ents.push({ y: p.py, f: () => room.drawProp(ctx, p, view, t) });
    }
    ents.push({ y: this.player.y, f: () => this.player.draw(ctx, view) });
    if (this.ghost.alpha > 0.02 && this.ghost.mode !== 'off') {
      ents.push({ y: this.ghost.y + 0.5, f: () => this.ghost.draw(ctx, view, t) });
    }
    ents.sort((a, b) => a.y - b.y);
    for (const e of ents) e.f();

    // ---- lighting ---------------------------------------------------------
    let dark = room.d.dark;
    const lights = [];
    for (const l of room.d.lights || []) {
      const ll = { ...l, x: l.x * TILE, y: l.y * TILE, seed: l.x * 3 + l.y * 7 };
      if (this.lightFlicker > 0) ll.i *= 0.35 + 0.65 * Math.abs(noise1(t * 22, ll.seed));
      lights.push(ll);
    }
    const fl = this.player.light(t);
    if (fl) lights.push(fl);
    const polys = buildPolys(lights, room.occRects, t);
    renderDarkness(ctx, W, H, clamp(dark - (this.lightning > 0 ? this.lightning * 0.25 : 0), 0, 1), polys, view.x, view.y, room.d.amb);
    renderGlows(ctx, polys, view.x, view.y);

    // ---- the ghost's cold light ------------------------------------------
    if (this.ghost.alpha > 0.05 && this.ghost.mode !== 'off') {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const gx = this.ghost.x - view.x;
      const gy = this.ghost.y - view.y - 24;
      const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 60);
      g.addColorStop(0, `rgba(120,190,230,${0.1 * this.ghost.alpha})`);
      g.addColorStop(1, 'rgba(120,190,230,0)');
      ctx.fillStyle = g;
      ctx.fillRect(gx - 60, gy - 60, 120, 120);
      ctx.restore();
    }

    // ---- particles --------------------------------------------------------
    const flL = fl ? { x: fl.x, y: fl.y } : { x: this.player.x, y: this.player.y - 12 };
    this.particles.drawDust(ctx, view, flL.x, flL.y);
    this.particles.drawEmbers(ctx, view);
    this.particles.drawFog(ctx);
    this.particles.drawRain(ctx);

    // ---- the face in the mirror (jump scare overlay) ----------------------
    if (this.scareFace > 0) {
      this.scareFace -= 0.06;
      const a = clamp(this.scareFace, 0, 1);
      ctx.save();
      ctx.globalAlpha = a * 0.85;
      const fx = W / 2;
      const fy = H / 2 - 10 + Math.sin(t * 40) * 2;
      const s = 1 + (1 - a) * 0.25;
      ctx.translate(fx, fy);
      ctx.scale(s, s);
      // pale face
      ctx.fillStyle = '#d9d2c4';
      ctx.beginPath();
      ctx.ellipse(0, 0, 34, 46, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#14100f';
      ctx.beginPath();
      ctx.ellipse(-12, -8, 6, 10, 0, 0, Math.PI * 2);
      ctx.ellipse(12, -8, 6, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, 18, 9, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a1418';
      ctx.beginPath();
      ctx.moveTo(-36, -20);
      ctx.lineTo(36, -20);
      ctx.lineTo(20, -52);
      ctx.lineTo(-20, -52);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    if (this.lightFlicker > 0) this.lightFlicker -= 0.02;

    // fear "pressure" — a faint pulsing red at the edges of the screen
    if (this.fear > 0.5) {
      const a = (this.fear - 0.5) * 2;
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
      const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.72);
      g.addColorStop(0, 'rgba(90,0,0,0)');
      g.addColorStop(1, `rgba(120,10,10,${0.16 * a * pulse})`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
  }
}

const game = new Game();
game.init().catch((e) => {
  console.error(e);
  document.body.insertAdjacentHTML('beforeend', `<pre style="color:#c88;position:fixed;inset:2em;white-space:pre-wrap">${e.stack || e}</pre>`);
});
window.__game = game;
