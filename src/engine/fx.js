// ---------------------------------------------------------------------------
// screen effects + particle systems (rain, dust motes, fog, embers)
// ---------------------------------------------------------------------------
import { clamp, lerp, noise1 } from './core.js';

export class ScreenFX {
  constructor() {
    this.shakeAmt = 0;
    this.shakeT = 0;
    this.shakeDur = 0;
    this.flashV = 0;
    this.glitchV = 0;
    this.fadeV = 1;
    this.fadeTarget = 1;
    this.fadeSpeed = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.rot = 0;
  }
  shake(amount, duration = 0.4) {
    this.shakeAmt = Math.max(this.shakeAmt, amount);
    this.shakeDur = Math.max(this.shakeDur, duration);
    this.shakeT = 0;
  }
  flash(v = 0.7, decay = 2.6) {
    this.flashV = Math.max(this.flashV, v);
    this.flashDecay = decay;
  }
  glitch(v = 1, decay = 1.6) {
    this.glitchV = Math.max(this.glitchV, v);
    this.glitchDecay = decay;
  }
  fadeTo(v, speed = 1.2) {
    this.fadeTarget = v;
    this.fadeSpeed = speed;
  }
  update(dt) {
    if (this.shakeDur > 0) {
      this.shakeT += dt;
      const k = 1 - clamp(this.shakeT / this.shakeDur, 0, 1);
      const a = this.shakeAmt * k * k;
      this.offsetX = (Math.random() * 2 - 1) * a;
      this.offsetY = (Math.random() * 2 - 1) * a;
      this.rot = (Math.random() * 2 - 1) * a * 0.0016;
      if (this.shakeT >= this.shakeDur) {
        this.shakeDur = 0;
        this.shakeAmt = 0;
        this.offsetX = this.offsetY = this.rot = 0;
      }
    }
    this.flashV = Math.max(0, this.flashV - dt * (this.flashDecay ?? 2.6));
    this.glitchV = Math.max(0, this.glitchV - dt * (this.glitchDecay ?? 1.6));
    const d = this.fadeTarget - this.fadeV;
    if (Math.abs(d) < 0.002) this.fadeV = this.fadeTarget;
    else this.fadeV += d * clamp(dt * this.fadeSpeed, 0, 1);
  }
}

export class Particles {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.rain = [];
    this.dust = [];
    this.fog = [];
    this.embers = [];
    this.rainAmount = 0;
    this.dustAmount = 1;
    this.fogAmount = 0;
    for (let i = 0; i < 260; i++) {
      this.rain.push({ x: Math.random() * w, y: Math.random() * h, l: 4 + Math.random() * 10, s: 220 + Math.random() * 220, a: 0.1 + Math.random() * 0.3 });
    }
    for (let i = 0; i < 70; i++) {
      this.dust.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 5, vy: -1.5 - Math.random() * 4, r: 0.4 + Math.random() * 0.9, ph: Math.random() * 10 });
    }
    for (let i = 0; i < 14; i++) {
      this.fog.push({ x: Math.random() * w, y: Math.random() * h, r: 40 + Math.random() * 70, vx: (Math.random() - 0.5) * 4, a: 0.03 + Math.random() * 0.05, ph: Math.random() * 10 });
    }
  }

  addEmbers(x, y, n = 1) {
    for (let i = 0; i < n; i++) {
      this.embers.push({
        x: x + (Math.random() - 0.5) * 14,
        y: y + (Math.random() - 0.5) * 4,
        vx: (Math.random() - 0.5) * 6,
        vy: -8 - Math.random() * 14,
        life: 0.6 + Math.random() * 0.9,
        t: 0,
      });
    }
  }

  update(dt, t, view) {
    const { w, h } = this;
    for (const d of this.rain) {
      d.y += d.s * dt;
      d.x += d.s * dt * 0.22;
      if (d.y > h + 20) { d.y = -20; d.x = Math.random() * (w + 60) - 60; }
      if (d.x > w + 20) d.x -= w + 40;
    }
    for (const p of this.dust) {
      p.ph += dt;
      p.x += (p.vx + Math.sin(p.ph * 0.7) * 4) * dt;
      p.y += p.vy * dt + Math.cos(p.ph * 0.9) * 2 * dt;
      if (p.y < -4) { p.y = h + 4; p.x = Math.random() * w; }
      if (p.x < -4) p.x = w + 4;
      if (p.x > w + 4) p.x = -4;
    }
    for (const f of this.fog) {
      f.ph += dt * 0.3;
      f.x += f.vx * dt;
      if (f.x < -f.r) f.x = w + f.r;
      if (f.x > w + f.r) f.x = -f.r;
    }
    for (let i = this.embers.length - 1; i >= 0; i--) {
      const e = this.embers[i];
      e.t += dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.vy += 6 * dt;
      if (e.t > e.life) this.embers.splice(i, 1);
    }
  }

  drawRain(ctx) {
    if (this.rainAmount <= 0.001) return;
    ctx.save();
    ctx.globalAlpha = clamp(this.rainAmount, 0, 1);
    ctx.strokeStyle = 'rgba(196,214,238,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const d of this.rain) {
      ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x - d.l * 0.22, d.y + d.l);
    }
    ctx.stroke();
    ctx.restore();
  }

  drawDust(ctx, view, lightX, lightY) {
    if (this.dustAmount <= 0.001) return;
    ctx.save();
    for (const p of this.dust) {
      const dx = p.x + view.x - lightX;
      const dy = p.y + view.y - lightY;
      const d = Math.hypot(dx, dy);
      const near = clamp(1 - d / 130, 0, 1);
      const a = (0.05 + near * 0.35) * this.dustAmount;
      if (a < 0.01) continue;
      ctx.fillStyle = `rgba(232,226,208,${a.toFixed(3)})`;
      ctx.fillRect(p.x | 0, p.y | 0, 1, 1);
    }
    ctx.restore();
  }

  drawFog(ctx) {
    if (this.fogAmount <= 0.001) return;
    ctx.save();
    for (const f of this.fog) {
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      const a = f.a * this.fogAmount;
      g.addColorStop(0, `rgba(150,164,180,${a.toFixed(3)})`);
      g.addColorStop(1, 'rgba(150,164,180,0)');
      ctx.fillStyle = g;
      ctx.fillRect(f.x - f.r, f.y - f.r, f.r * 2, f.r * 2);
    }
    ctx.restore();
  }

  drawEmbers(ctx, view) {
    if (!this.embers.length) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const e of this.embers) {
      const k = 1 - e.t / e.life;
      ctx.fillStyle = `rgba(255,${140 + 80 * k | 0},60,${(k * 0.85).toFixed(3)})`;
      ctx.fillRect((e.x - view.x) | 0, (e.y - view.y) | 0, 1, 1);
    }
    ctx.restore();
  }
}

/** flickering value for candle / fire light sources */
export function flicker(t, seed = 0, speed = 1) {
  return 0.78 + 0.22 * (0.5 + 0.5 * noise1(t * 7 * speed, seed)) + 0.06 * noise1(t * 23 * speed, seed + 11);
}
