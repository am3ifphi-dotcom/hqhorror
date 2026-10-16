// ---------------------------------------------------------------------------
// DOM overlay: dialogue box, the standing portrait (立ち絵) with blinking and
// breathing, item toast, fear meter, chapter cards, interaction prompt.
// ---------------------------------------------------------------------------
import { clamp, lerp } from '../engine/core.js';

const PORTRAITS = {
  base: '/assets/portrait/yui_base.png',
  blink: '/assets/portrait/yui_blink.png',
  fear: '/assets/portrait/yui_fear.png',
  look: '/assets/portrait/yui_look.png',
};

export class UI {
  constructor(root, audio) {
    this.audio = audio;
    this.el = {
      dialogue: root.querySelector('#dialogue'),
      portrait: root.querySelector('#portrait'),
      portraitImg: root.querySelector('#portrait img'),
      name: root.querySelector('#namebox span'),
      namebox: root.querySelector('#namebox'),
      text: root.querySelector('#dtext'),
      next: root.querySelector('#nextmark'),
      toast: root.querySelector('#toast'),
      toastSpan: root.querySelector('#toast span'),
      items: root.querySelector('#items'),
      fear: root.querySelector('#fearbar'),
      prompt: root.querySelector('#prompt'),
      promptSpan: root.querySelector('#prompt span'),
      chapter: root.querySelector('#chapter'),
      chapterSpan: root.querySelector('#chapter span'),
      barTop: root.querySelector('#letterbox-top'),
      barBottom: root.querySelector('#letterbox-bottom'),
    };
    for (const k of Object.keys(PORTRAITS)) {
      const im = new Image();
      im.src = PORTRAITS[k];
    }
    this.portraitState = {
      expr: 'base',
      blinkIn: 2 + Math.random() * 3,
      blinking: 0,
      t: 0,
      shown: false,
      shake: 0,
    };
    this.type = null;
    this.bars = 0;
  }

  // ------------------------------------------------------------ dialogue
  say(speaker, text, opt = {}) {
    const el = this.el;
    // a new line always supersedes the previous one: never leave a waiter
    // hanging on a promise that will never resolve
    this.type?.resolve?.();
    el.dialogue.classList.remove('hidden');
    if (speaker) {
      el.namebox.style.display = '';
      el.name.textContent = speaker;
    } else {
      el.namebox.style.display = 'none';
    }
    el.text.innerHTML = '';
    el.next.classList.remove('on');
    this.showPortrait(opt.expr || 'base');
    this.type = {
      full: text,
      i: 0,
      t: 0,
      cps: opt.cps ?? 34,
      done: false,
      resolve: null,
      wait: opt.wait ?? null,
    };
    return new Promise((res) => {
      this.type.resolve = res;
    });
  }

  /** returns true when the line was finished by this press */
  advance() {
    if (!this.type) return false;
    const t = this.type;
    if (!t.done) {
      t.i = t.full.length;
      this.render();
      this.finishTyping();
      return false;
    }
    const res = t.resolve;
    this.type = null;
    this.el.dialogue.classList.add('hidden');
    this.hidePortrait();
    res?.();
    return true;
  }

  /** force-close the box (room changes, restarts) */
  close() {
    const t = this.type;
    this.type = null;
    this.el.dialogue.classList.add('hidden');
    this.hidePortrait();
    t?.resolve?.();
  }

  finishTyping() {
    const t = this.type;
    if (!t || t.done) return;
    t.done = true;
    this.el.next.classList.add('on');
  }

  render() {
    const t = this.type;
    if (!t) return;
    let s = t.full.slice(0, t.i);
    // '*' emphasis + trembling text
    s = s.replace(/\*([^*]*)\*/g, '<em>$1</em>');
    this.el.text.innerHTML = s + (t.i < t.full.length ? '<span style="opacity:.5">▍</span>' : '');
  }

  updateDialogue(dt) {
    const t = this.type;
    if (!t || t.done) return;
    t.t += dt;
    const step = 1 / t.cps;
    let blip = false;
    while (t.t >= step && t.i < t.full.length) {
      t.t -= step;
      t.i++;
      if (t.i > 1) blip = true;
      const ch = t.full[t.i - 1];
      if ('。、…！？'.includes(ch)) {
        t.t -= step * 8;
        blip = false;
      }
    }
    this.render();
    if (blip && t.i % 2 === 0) this.audio?.blip();
    if (t.i >= t.full.length) this.finishTyping();
  }

  // ------------------------------------------------------------ portrait
  showPortrait(expr = 'base') {
    const p = this.portraitState;
    if (!p.shown) {
      this.el.portrait.classList.remove('leave');
      this.el.portrait.classList.add('enter');
      p.shown = true;
    }
    if (p.expr !== expr) {
      p.expr = expr;
      if (expr !== 'blink') this.el.portraitImg.src = PORTRAITS[expr] || PORTRAITS.base;
    }
    if (expr === 'fear') p.shake = 1;
  }

  hidePortrait() {
    const p = this.portraitState;
    if (!p.shown) return;
    this.el.portrait.classList.remove('enter');
    this.el.portrait.classList.add('leave');
    p.shown = false;
  }

  updatePortrait(dt) {
    const p = this.portraitState;
    if (!p.shown) return;
    p.t += dt;
    p.blinkIn -= dt;
    if (p.blinkIn <= 0 && p.blinking <= 0) {
      p.blinking = 0.13;
      p.blinkIn = 2.4 + Math.random() * 4.2;
      this.el.portraitImg.src = PORTRAITS.blink;
    }
    if (p.blinking > 0) {
      p.blinking -= dt;
      if (p.blinking <= 0 && p.expr !== 'blink') this.el.portraitImg.src = PORTRAITS[p.expr] || PORTRAITS.base;
    }
    // breathing: slow vertical drift + tiny scale + fear tremble
    const breath = Math.sin(p.t * 1.35) * 0.006 + Math.sin(p.t * 0.53) * 0.003;
    let sx = 0;
    let sy = breath;
    if (p.expr === 'fear') {
      p.shake = Math.max(0, p.shake - dt * 0.4);
      sx = (Math.random() - 0.5) * 0.9 * p.shake;
      sy += (Math.random() - 0.5) * 0.7 * p.shake;
    }
    this.el.portraitImg.style.transform =
      `translateX(-50%) translate(${sx.toFixed(2)}px, ${(sy * 100).toFixed(2)}%) scale(${(1 + breath * 0.12).toFixed(4)})`;
  }

  // --------------------------------------------------------------- others
  toast(text, dur = 2.2) {
    this.el.toastSpan.textContent = text;
    this.el.toast.classList.remove('hidden');
    this.toastT = dur;
  }

  chapter(text) {
    this.el.chapterSpan.textContent = text;
    this.el.chapter.classList.remove('on');
    void this.el.chapter.offsetWidth;
    this.el.chapter.classList.add('on');
  }

  prompt(text) {
    if (!text) {
      this.el.prompt.classList.add('hidden');
      return;
    }
    this.el.promptSpan.textContent = text;
    this.el.prompt.classList.remove('hidden');
  }

  setFear(v) {
    this.el.fear.style.width = `${clamp(v, 0, 1) * 100}%`;
  }

  setItems(items) {
    this.el.items.innerHTML = '';
    for (const it of items) {
      const d = document.createElement('div');
      d.className = 'item';
      d.textContent = it.name;
      this.el.items.appendChild(d);
    }
  }

  setBars(v) {
    if (this.bars === v) return;
    this.bars = v;
    this.el.barTop.style.height = `${v * 12}%`;
    this.el.barBottom.style.height = `${v * 12}%`;
  }

  update(dt) {
    this.updateDialogue(dt);
    this.updatePortrait(dt);
    if (this.toastT > 0) {
      this.toastT -= dt;
      if (this.toastT <= 0) this.el.toast.classList.add('hidden');
    }
  }
}
