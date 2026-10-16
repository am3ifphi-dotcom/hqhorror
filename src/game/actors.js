// ---------------------------------------------------------------------------
// The girl, and the thing that follows her.
// ---------------------------------------------------------------------------
import { clamp, lerp, damp, noise1 } from '../engine/core.js';
import { TILE } from './world.js';

// direction index -> radians (sheet rows are up / left / down / right)
export const DIR_ANGLE = [-Math.PI / 2, Math.PI, Math.PI / 2, 0];

export class Actor {
  constructor(sheets, x, y) {
    this.sheets = sheets;
    this.x = x;
    this.y = y;
    this.cw = 15;
    this.ch = 8;
    this.dir = 2;
    this.vx = 0;
    this.vy = 0;
    this.state = 'idle';
    this.frame = 0;
    this.t = 0;
    this.speed = 0;
  }
  get sheet() {
    return this.sheets[this.state] || this.sheets.idle;
  }
  animate(dt, fps) {
    const s = this.sheet;
    const n = s.cols;
    this.t += dt * fps;
    if (this.t >= 1) {
      this.t -= 1;
      this.frame = (this.frame + 1) % n;
      this.onFrame?.(this.frame);
    }
  }
  draw(ctx, view, opt = {}) {
    const s = this.sheet;
    const x = this.x - view.x;
    const y = this.y - view.y;
    // contact shadow
    ctx.save();
    ctx.globalAlpha = 0.32 * (opt.shadow ?? 1);
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(x, y - 1, 9, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    s.draw(ctx, this.frame, this.dir, x, y, {
      alpha: opt.alpha ?? 1,
      flip: opt.flip,
      scale: opt.scale ?? 1,
      ax: 0.5,
      ay: 1,
    });
  }
}

export class Player extends Actor {
  constructor(sheets, x, y) {
    super(sheets, x, y);
    this.walkSpeed = 58;
    this.runSpeed = 104;
    this.fear = 0;
    this.lightOn = true;
    this.battery = 1;
    this.stepT = 0;
    this.breath = 0;
    this.frozen = false;
    this.onStep = null;
    this.tremble = 0;
  }

  update(dt, input, room, time) {
    this.breath += dt;
    if (this.frozen || room == null) {
      this.vx = this.vy = 0;
      this.state = 'idle';
      this.animate(dt, 3);
      return;
    }
    const mv = this.frozen ? { x: 0, y: 0 } : input.move();
    const running = input.held('run') && (mv.x || mv.y);
    const spd = (running ? this.runSpeed : this.walkSpeed) * (1 - this.fear * 0.1);
    this.vx = mv.x * spd;
    this.vy = mv.y * spd;
    if (mv.x || mv.y) {
      const p = room.move(this, this.vx * dt, this.vy * dt);
      this.x = p.x;
      this.y = p.y;
      if (Math.abs(mv.y) > Math.abs(mv.x)) this.dir = mv.y < 0 ? 0 : 2;
      else this.dir = mv.x < 0 ? 1 : 3;
      const moving = Math.hypot(this.x - (this._lx ?? this.x), this.y - (this._ly ?? this.y)) > 0.4;
      this.state = running ? 'run' : 'walk';
      if (moving) {
        this.stepT -= dt * (running ? 8.4 : 5.6);
        if (this.stepT <= 0) {
          this.stepT = 1;
          this.onStep?.(running);
        }
      }
    } else {
      this.state = 'idle';
    }
    this._lx = this.x;
    this._ly = this.y;
    this.animate(dt, this.state === 'idle' ? 1.6 : this.state === 'run' ? 13 : 9);
  }

  /** the cone of the flashlight, or null when it is off */
  light(time) {
    if (!this.lightOn) return null;
    const flick = noise1(time * 9, 3) * noise1(time * 21, 9);
    const dying = this.battery < 0.3 ? (flick > 0.35 ? 1 : 0.15) : 1;
    const ang = DIR_ANGLE[this.dir];
    // the beam lags behind the body a touch, like a real hand
    const wob = this.fear * 0.05;
    return {
      x: this.x + Math.cos(ang) * 6,
      y: this.y - 14 + Math.sin(ang) * 4,
      r: 176 * (0.9 + this.battery * 0.1),
      cone: ang + Math.sin(time * 1.7) * wob,
      spread: 1.16,
      c: [255, 236, 196],
      i: 0.98 * this.battery * dying,
      f: 0.35 + (1 - this.battery) * 1.4,
      seed: 7,
      flashlight: true,
    };
  }
}

export class Ghost extends Actor {
  constructor(sheets, x, y) {
    super(sheets, x, y);
    this.alpha = 0;
    this.targetAlpha = 0;
    this.mode = 'off'; // off | idle | stalk | hunt | flee
    this.bobT = Math.random() * 10;
    this.speed = 0;
    this.huntSpeed = 66;
    this.stalkSpeed = 26;
    this.cw = 14;
    this.ch = 8;
    this.whisperT = 4;
    this.onWhisper = null;
    this.hitCooldown = 0;
  }

  spawn(x, y, mode = 'stalk') {
    this.x = x;
    this.y = y;
    this.mode = mode;
    this.alpha = 0;
    this.targetAlpha = mode === 'hunt' ? 0.9 : 0.62;
    this.dir = 2;
    this.frame = 0;
  }

  vanish() {
    this.mode = 'off';
    this.targetAlpha = 0;
  }

  update(dt, room, player, time) {
    this.bobT += dt;
    this.alpha = damp(this.alpha, this.targetAlpha, 3.2, dt);
    if (this.alpha < 0.01 && this.mode === 'off') return;
    this.hitCooldown = Math.max(0, this.hitCooldown - dt);

    let tx = player.x;
    let ty = player.y;
    let spd = 0;
    if (this.mode === 'hunt') {
      spd = this.huntSpeed;
    } else if (this.mode === 'stalk') {
      // keeps its distance, drifts sideways — it wants to be seen, slowly
      const d = Math.hypot(player.x - this.x, player.y - this.y);
      spd = d > 120 ? this.stalkSpeed * 1.6 : d < 70 ? -this.stalkSpeed * 0.6 : this.stalkSpeed * 0.2;
      tx = player.x + Math.cos(time * 0.35) * 40;
      ty = player.y + Math.sin(time * 0.27) * 26;
    } else if (this.mode === 'flee') {
      spd = -70;
    }

    if (spd && room) {
      let dx = tx - this.x;
      let dy = ty - this.y;
      const len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
      if (spd < 0) { dx = -dx; dy = -dy; spd = -spd; }
      const p = room.move(this, dx * spd * dt, dy * spd * dt);
      this.x = p.x;
      this.y = p.y;
      if (Math.abs(dy) > Math.abs(dx)) this.dir = dy < 0 ? 0 : 2;
      else this.dir = dx < 0 ? 1 : 3;
      this.state = spd > 45 ? 'run' : 'walk';
    } else {
      this.state = 'idle';
    }
    this.animate(dt, this.state === 'idle' ? 1.4 : this.state === 'run' ? 11 : 7);

    if (this.mode !== 'off') {
      this.whisperT -= dt;
      if (this.whisperT <= 0) {
        this.whisperT = 5 + Math.random() * 9;
        this.onWhisper?.();
      }
    }
  }

  draw(ctx, view, time) {
    if (this.alpha < 0.02) return;
    const x = this.x - view.x;
    const y = this.y - view.y;
    const bob = Math.sin(this.bobT * 1.8) * 2.4;
    const a = this.alpha;

    // cold aura
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y - 26 + bob, 2, x, y - 26 + bob, 46);
    g.addColorStop(0, `rgba(150,205,235,${0.2 * a})`);
    g.addColorStop(1, 'rgba(120,180,220,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 46, y - 72 + bob, 92, 92);
    ctx.restore();

    const s = this.sheet;
    // feet-less float: the sprite hovers, never quite touching the floor
    s.draw(ctx, this.frame, this.dir, x, y - 6 + bob, {
      alpha: a * 0.85,
      ax: 0.5,
      ay: 1,
    });
    // a second, offset ghost image for the "smear" look
    s.draw(ctx, this.frame, this.dir, x + Math.sin(this.bobT * 2.3) * 1.6, y - 6 + bob, {
      alpha: a * 0.22,
      ax: 0.5,
      ay: 1,
    });
  }
}
