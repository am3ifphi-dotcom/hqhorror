// ---------------------------------------------------------------------------
// audio: procedural Web Audio synthesis + the CC0 Kenney one-shot samples.
//
// Everything that could not be sourced under a verified open licence from a
// reachable host (the sandbox only reaches github.com / npm / pypi) is
// synthesised here at runtime: rain, wind, drones, heart beats, whispers,
// stingers, the music box and the piano.  Kenney's CC0 wavs cover footsteps,
// creaks, doors and UI clicks.
// ---------------------------------------------------------------------------

const SAMPLES = [
  'step_00', 'step_01', 'step_02', 'step_03', 'step_04', 'step_05', 'step_06', 'step_07',
  'creak_01', 'creak_02', 'door_open', 'door_close', 'page', 'cloth', 'metal', 'latch',
  'thud', 'ui_move', 'ui_ok',
];

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.ready = false;
    this.buffers = {};
    this.loops = {};
    this.heartTimer = 0;
    this.fear = 0;
  }

  async unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = (this.ctx = new AC({ latencyHint: 'interactive' }));
    if (ctx.state === 'suspended') await ctx.resume();

    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 6;
    comp.attack.value = 0.004;
    comp.release.value = 0.25;
    this.master.connect(comp).connect(ctx.destination);

    // a global "underwater" filter we can close when dread peaks
    this.muffle = ctx.createBiquadFilter();
    this.muffle.type = 'lowpass';
    this.muffle.frequency.value = 20000;
    this.muffle.connect(this.master);

    this.sfx = ctx.createGain();
    this.sfx.gain.value = 0.85;
    this.sfx.connect(this.muffle);

    this.amb = ctx.createGain();
    this.amb.gain.value = 0.0;
    this.amb.connect(this.muffle);

    this.music = ctx.createGain();
    this.music.gain.value = 0.55;
    this.music.connect(this.muffle);

    // reverb
    this.verb = ctx.createConvolver();
    this.verb.buffer = this._impulse(2.6, 2.2);
    this.verbGain = ctx.createGain();
    this.verbGain.gain.value = 0.5;
    this.verb.connect(this.verbGain).connect(this.muffle);

    this.noise = this._noiseBuffer(4);
    this.ready = true;
    await this._loadSamples();
  }

  // -------------------------------------------------------------- buffers
  _noiseBuffer(seconds) {
    const ctx = this.ctx;
    const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  _impulse(seconds, decay) {
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay) * (1 - t * 0.2);
      }
    }
    return buf;
  }

  async _loadSamples() {
    await Promise.all(
      SAMPLES.map(async (name) => {
        try {
          const res = await fetch(`/assets/audio/${name}.wav`);
          if (!res.ok) throw new Error(res.status);
          this.buffers[name] = await this.ctx.decodeAudioData(await res.arrayBuffer());
        } catch (e) {
          console.warn('[audio] sample missing', name, e.message);
        }
      })
    );
  }

  // ------------------------------------------------------------ primitives
  _src(buf, { rate = 1, loop = false } = {}) {
    const s = this.ctx.createBufferSource();
    s.buffer = buf;
    s.loop = loop;
    s.playbackRate.value = rate;
    return s;
  }

  _env(gain, t0, a, d, peak = 1, sustain = 0, dur = 0) {
    const g = gain.gain;
    g.cancelScheduledValues(t0);
    g.setValueAtTime(0.0001, t0);
    g.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + a);
    if (sustain > 0) {
      g.exponentialRampToValueAtTime(Math.max(peak * 0.6, 0.0002), t0 + a + d);
      g.setValueAtTime(Math.max(peak * 0.6, 0.0002), t0 + a + d + sustain);
      g.exponentialRampToValueAtTime(0.0001, t0 + a + d + sustain + dur);
    } else {
      g.exponentialRampToValueAtTime(0.0001, t0 + a + d);
    }
  }

  play(name, opt = {}) {
    if (!this.ready) return;
    const buf = this.buffers[name];
    if (!buf) return;
    const t = this.ctx.currentTime;
    const src = this._src(buf, { rate: opt.rate ?? 1 + (Math.random() - 0.5) * (opt.jitter ?? 0.06) });
    const g = this.ctx.createGain();
    const pan = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    if (pan) pan.pan.value = opt.pan ?? 0;
    const vol = (opt.volume ?? 1) * (opt.gain ?? 1);
    g.gain.value = vol;
    src.connect(g);
    if (pan) g.connect(pan).connect(this.sfx);
    else g.connect(this.sfx);
    if (opt.verb) {
      const vg = this.ctx.createGain();
      vg.gain.value = opt.verb;
      g.connect(vg).connect(this.verb);
    }
    src.start(t);
    src.stop(t + buf.duration / src.playbackRate.value + 0.02);
    return src;
  }

  /** filtered noise burst — the workhorse for wind, breath, scrapes */
  noiseHit({ dur = 0.4, type = 'bandpass', freq = 800, q = 1, gain = 0.2, attack = 0.005, sweepTo = null, verb = 0, pan = 0, dest = null } = {}) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const src = this._src(this.noise, { rate: 0.8 + Math.random() * 0.4 });
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    f.Q.value = q;
    const g = this.ctx.createGain();
    this._env(g, t, attack, dur, gain);
    let node = src.connect(f).connect(g);
    if (this.ctx.createStereoPanner) {
      const p = this.ctx.createStereoPanner();
      p.pan.value = pan;
      g.connect(p);
      node = p;
    }
    node.connect(dest || this.sfx);
    if (verb) {
      const vg = this.ctx.createGain();
      vg.gain.value = verb;
      g.connect(vg).connect(this.verb);
    }
    src.start(t);
    src.stop(t + dur + 0.1);
  }

  tone({ freq = 220, dur = 0.6, type = 'sine', gain = 0.15, attack = 0.01, detune = 0, sweepTo = null, verb = 0, dest = null, pan = 0 } = {}) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (sweepTo) o.frequency.exponentialRampToValueAtTime(sweepTo, t + dur);
    o.detune.value = detune;
    const g = this.ctx.createGain();
    this._env(g, t, attack, dur, gain);
    let node = o.connect(g);
    if (this.ctx.createStereoPanner) {
      const p = this.ctx.createStereoPanner();
      p.pan.value = pan;
      g.connect(p);
      node = p;
    }
    node.connect(dest || this.sfx);
    if (verb) {
      const vg = this.ctx.createGain();
      vg.gain.value = verb;
      g.connect(vg).connect(this.verb);
    }
    o.start(t);
    o.stop(t + dur + 0.1);
  }

  // ------------------------------------------------------------- ambience
  startAmbience(profile = 'house') {
    if (!this.ready) return;
    this.stopAmbience();
    const ctx = this.ctx;
    const out = this.amb;

    // --- rain -------------------------------------------------------------
    const rain = this._src(this.noise, { loop: true, rate: 1 });
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = profile === 'outside' ? 700 : 420;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = profile === 'outside' ? 5200 : 2600;
    const rg = ctx.createGain();
    rg.gain.value = profile === 'outside' ? 0.16 : 0.075;
    rain.connect(hp).connect(lp).connect(rg).connect(out);
    rain.start();

    // slow gusting LFO on the rain low-pass
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.09;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 700;
    lfo.connect(lfoG).connect(lp.frequency);
    lfo.start();

    // --- wind -------------------------------------------------------------
    const wind = this._src(this.noise, { loop: true, rate: 0.7 });
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 320;
    bp.Q.value = 0.7;
    const wg = ctx.createGain();
    wg.gain.value = 0.0;
    wind.connect(bp).connect(wg).connect(out);
    wind.start();
    const wlfo = ctx.createOscillator();
    wlfo.frequency.value = 0.055;
    const wlfoG = ctx.createGain();
    wlfoG.gain.value = 0.075;
    wlfo.connect(wlfoG).connect(wg.gain);
    wlfo.start();
    const wlfo2 = ctx.createOscillator();
    wlfo2.frequency.value = 0.031;
    const wlfo2G = ctx.createGain();
    wlfo2G.gain.value = 160;
    wlfo2.connect(wlfo2G).connect(bp.frequency);
    wlfo2.start();

    // --- sub drone --------------------------------------------------------
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0.0;
    const dlp = ctx.createBiquadFilter();
    dlp.type = 'lowpass';
    dlp.frequency.value = 220;
    dlp.Q.value = 3;
    droneGain.connect(dlp).connect(out);
    const oscs = [];
    for (const f of [41.2, 41.9, 61.7, 82.4]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.detune.value = (Math.random() - 0.5) * 14;
      const g = ctx.createGain();
      g.gain.value = 0.16;
      o.connect(g).connect(droneGain);
      o.start();
      oscs.push(o);
    }
    const dlfo = ctx.createOscillator();
    dlfo.frequency.value = 0.037;
    const dlfoG = ctx.createGain();
    dlfoG.gain.value = 90;
    dlfo.connect(dlfoG).connect(dlp.frequency);
    dlfo.start();

    this.loops.ambience = {
      nodes: [rain, wind, lfo, wlfo, wlfo2, dlfo, ...oscs],
      droneGain,
      windGain: wg,
      rainGain: rg,
    };
    this.amb.gain.cancelScheduledValues(ctx.currentTime);
    this.amb.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.amb.gain.linearRampToValueAtTime(1, ctx.currentTime + 2.5);
  }

  setAmbienceMix({ drone = 0.0, wind = 0.0, rain = 0.075 } = {}) {
    const a = this.loops.ambience;
    if (!a || !this.ready) return;
    const t = this.ctx.currentTime;
    a.droneGain.gain.linearRampToValueAtTime(drone, t + 1.4);
    a.windGain.gain.linearRampToValueAtTime(wind, t + 1.4);
    a.rainGain.gain.linearRampToValueAtTime(rain, t + 1.4);
  }

  stopAmbience() {
    const a = this.loops.ambience;
    if (!a) return;
    for (const n of a.nodes) {
      try { n.stop(this.ctx.currentTime + 0.05); } catch (e) { /* already stopped */ }
    }
    delete this.loops.ambience;
  }

  /** continuous dread: drives the heart beat rate and the muffle filter */
  setFear(v) {
    this.fear = v;
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    this.muffle.frequency.linearRampToValueAtTime(20000 - v * 19200, t + 0.6);
  }

  update(dt) {
    if (!this.ready) return;
    if (this.fear > 0.25) {
      this.heartTimer -= dt * (0.55 + this.fear * 1.5);
      if (this.heartTimer <= 0) {
        this.heartTimer = 1;
        this.heartbeat(0.06 + this.fear * 0.22);
      }
    } else {
      this.heartTimer = 0.2;
    }
  }

  // ----------------------------------------------------------- one shots
  heartbeat(vol = 0.12) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const thump = (at, f, g) => {
      const o = this.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(f, at);
      o.frequency.exponentialRampToValueAtTime(f * 0.55, at + 0.13);
      const gn = this.ctx.createGain();
      gn.gain.setValueAtTime(0.0001, at);
      gn.gain.exponentialRampToValueAtTime(g, at + 0.015);
      gn.gain.exponentialRampToValueAtTime(0.0001, at + 0.19);
      o.connect(gn).connect(this.sfx);
      o.start(at);
      o.stop(at + 0.25);
    };
    thump(t, 62, vol);
    thump(t + 0.19, 52, vol * 0.72);
  }

  thunder(near = false) {
    if (!this.ready) return;
    const delay = near ? 0 : 0.25;
    const t = this.ctx.currentTime + delay;
    const dur = near ? 2.6 : 3.8;
    const src = this._src(this.noise, { rate: near ? 0.55 : 0.35 });
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(near ? 900 : 420, t);
    lp.frequency.exponentialRampToValueAtTime(80, t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(near ? 0.5 : 0.26, t + (near ? 0.03 : 0.35));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(lp).connect(g);
    g.connect(this.sfx);
    const vg = this.ctx.createGain();
    vg.gain.value = 0.8;
    g.connect(vg).connect(this.verb);
    src.start(t);
    src.stop(t + dur + 0.2);
    if (near) this.noiseHit({ dur: 0.5, freq: 3200, sweepTo: 600, gain: 0.12, type: 'bandpass', q: 0.6 });
  }

  /** breathy, unintelligible whisper */
  whisper(pan = 0) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const dur = 0.9 + Math.random() * 0.8;
    const src = this._src(this.noise, { rate: 0.9 + Math.random() * 0.3 });
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    let node = src;
    // three moving formants = vowel-ish whisper
    for (const [f0, f1, q, amp] of [[520, 780, 9, 1], [1180, 1500, 12, 0.55], [2400, 2900, 14, 0.22]]) {
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(f0 * (0.8 + Math.random() * 0.4), t);
      bp.frequency.linearRampToValueAtTime(f1 * (0.8 + Math.random() * 0.4), t + dur);
      bp.Q.value = q;
      const bg = this.ctx.createGain();
      bg.gain.value = amp;
      node.connect(bp).connect(bg);
      node = bg;
    }
    const env = this.ctx.createGain();
    const n = 5;
    for (let i = 0; i < n; i++) {
      const at = t + (dur / n) * i;
      env.gain.setValueAtTime(0.0001, at);
      env.gain.exponentialRampToValueAtTime(0.05 + Math.random() * 0.05, at + dur / n / 2);
    }
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    node.connect(env);
    const p = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    if (p) { p.pan.value = pan; env.connect(p).connect(this.sfx); }
    else env.connect(this.sfx);
    const vg = this.ctx.createGain();
    vg.gain.value = 0.7;
    env.connect(vg).connect(this.verb);
    src.start(t);
    src.stop(t + dur + 0.1);
  }

  /** dissonant orchestral-ish hit for jump scares */
  sting(intensity = 1) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    const base = 110 * (intensity > 0.8 ? 1 : 0.75);
    for (const [mult, type, amp] of [[1, 'sawtooth', 0.16], [1.06, 'sawtooth', 0.14], [1.41, 'sawtooth', 0.1], [2.02, 'square', 0.05], [2.83, 'sawtooth', 0.04]]) {
      const o = this.ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(base * mult * 2, t);
      o.frequency.exponentialRampToValueAtTime(base * mult, t + 0.7);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(amp * intensity, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(4200, t);
      lp.frequency.exponentialRampToValueAtTime(400, t + 1.2);
      o.connect(g).connect(lp).connect(this.sfx);
      const vg = this.ctx.createGain();
      vg.gain.value = 0.55;
      g.connect(vg).connect(this.verb);
      o.start(t);
      o.stop(t + 1.7);
    }
    this.noiseHit({ dur: 0.6, type: 'highpass', freq: 2600, gain: 0.14 * intensity, verb: 0.6 });
    this.tone({ freq: 58, dur: 1.1, type: 'sine', gain: 0.3 * intensity, sweepTo: 30 });
  }

  /** simple bell-ish music box note */
  musicNote(freq, when = 0, dur = 1.6, gain = 0.14) {
    if (!this.ready) return;
    const t = this.ctx.currentTime + when;
    const carrier = this.ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.value = freq;
    const mod = this.ctx.createOscillator();
    mod.type = 'sine';
    mod.frequency.value = freq * 3.02;
    const modGain = this.ctx.createGain();
    modGain.gain.setValueAtTime(freq * 1.6, t);
    modGain.gain.exponentialRampToValueAtTime(1, t + dur * 0.6);
    mod.connect(modGain).connect(carrier.frequency);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    carrier.connect(g).connect(this.music);
    const vg = this.ctx.createGain();
    vg.gain.value = 0.6;
    g.connect(vg).connect(this.verb);
    carrier.start(t);
    mod.start(t);
    carrier.stop(t + dur + 0.1);
    mod.stop(t + dur + 0.1);
  }

  playMelody(notes, { gap = 0.42, gain = 0.14, dur = 1.6 } = {}) {
    notes.forEach((n, i) => {
      if (n == null) return;
      this.musicNote(440 * Math.pow(2, (n - 69) / 12), i * gap, dur, gain);
    });
  }

  piano(freq, { dur = 2.2, gain = 0.12 } = {}) {
    if (!this.ready) return;
    const t = this.ctx.currentTime;
    for (const [mult, amp] of [[1, 1], [2, 0.24], [3, 0.09], [4.2, 0.04]]) {
      const o = this.ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = freq * mult;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain * amp, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur * (1 - 0.1 * mult));
      o.connect(g).connect(this.music);
      const vg = this.ctx.createGain();
      vg.gain.value = 0.5;
      g.connect(vg).connect(this.verb);
      o.start(t);
      o.stop(t + dur + 0.1);
    }
  }

  creak(pan = 0, vol = 1) {
    this.play(Math.random() < 0.5 ? 'creak_01' : 'creak_02', {
      volume: 0.55 * vol, pan, rate: 0.85 + Math.random() * 0.3, verb: 0.5,
    });
  }

  footstep(vol = 1, pan = 0) {
    const n = Math.floor(Math.random() * 8);
    this.play('step_0' + n, {
      volume: 0.3 * vol, pan, rate: 0.9 + Math.random() * 0.25, jitter: 0.1, verb: 0.25,
    });
  }

  door(vol = 1, pan = 0) {
    this.play('door_open', { volume: 0.5 * vol, pan, verb: 0.6, rate: 0.9 });
  }

  ui(kind = 'move') {
    this.play(kind === 'ok' ? 'ui_ok' : 'ui_move', { volume: kind === 'ok' ? 0.35 : 0.12 });
  }

  blip() {
    if (!this.ready) return;
    this.tone({ freq: 1500 + Math.random() * 300, dur: 0.03, type: 'square', gain: 0.012 });
  }
}

export const audio = new AudioEngine();
