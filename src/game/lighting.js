// ---------------------------------------------------------------------------
// 2D visibility polygons + the darkness/glow compositing that gives the house
// its "only what the light touches" look.
// ---------------------------------------------------------------------------
import { clamp } from '../engine/core.js';
import { flicker } from '../engine/fx.js';

const EPS = 1e-6;

function cross(ax, ay, bx, by) {
  return ax * by - ay * bx;
}

/**
 * Ray-cast visibility polygon.
 * @returns {Float32Array} flat world-space points [x0,y0,x1,y1,...]
 */
export function visibility(ox, oy, ang, spread, radius, rects) {
  const half = spread / 2;
  const cos = Math.cos(-ang);
  const sin = Math.sin(-ang);
  const toLocal = (x, y) => {
    const dx = x - ox;
    const dy = y - oy;
    return [dx * cos - dy * sin, dx * sin + dy * cos];
  };

  // segments in local space
  const segs = [];
  for (const r of rects) {
    if (ox >= r.x && ox <= r.x + r.w && oy >= r.y && oy <= r.y + r.h) continue; // inside
    const pts = [
      toLocal(r.x, r.y),
      toLocal(r.x + r.w, r.y),
      toLocal(r.x + r.w, r.y + r.h),
      toLocal(r.x, r.y + r.h),
    ];
    for (let i = 0; i < 4; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % 4];
      segs.push([a[0], a[1], b[0], b[1]]);
    }
  }

  // candidate angles
  const angles = [-half, half];
  const FAN = spread > 1.2 ? 48 : 26;
  for (let i = 1; i < FAN; i++) angles.push(-half + (spread * i) / FAN);
  const near = [];
  for (const r of rects) {
    for (const [cx, cy] of [[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h]]) {
      const [lx, ly] = toLocal(cx, cy);
      if (lx * lx + ly * ly > radius * radius * 1.6) continue;
      near.push([lx, ly]);
    }
  }
  for (const [lx, ly] of near) {
    const a = Math.atan2(ly, lx);
    if (a >= -half - EPS && a <= half + EPS) {
      angles.push(clamp(a - 0.00035, -half, half), clamp(a, -half, half), clamp(a + 0.00035, -half, half));
    }
  }
  angles.sort((a, b) => a - b);

  const localPts = [];
  for (const a of angles) {
    const dx = Math.cos(a);
    const dy = Math.sin(a);
    let best = radius;
    for (const s of segs) {
      const ex = s[2] - s[0];
      const ey = s[3] - s[1];
      const den = cross(dx, dy, ex, ey);
      if (Math.abs(den) < EPS) continue;
      const pxx = s[0];
      const pyy = s[1];
      const t = cross(pxx, pyy, ex, ey) / den;
      const u = cross(pxx, pyy, dx, dy) / den;
      if (u >= 0 && u <= 1 && t > 0 && t < best) best = t;
    }
    localPts.push([Math.cos(a) * best, Math.sin(a) * best]);
  }

  // back to world space
  const c2 = Math.cos(ang);
  const s2 = Math.sin(ang);
  const out = new Float32Array(localPts.length * 2 + 2);
  out[0] = ox;
  out[1] = oy;
  for (let i = 0; i < localPts.length; i++) {
    const lx = localPts[i][0];
    const ly = localPts[i][1];
    out[2 + i * 2] = ox + lx * c2 - ly * s2;
    out[3 + i * 2] = oy + lx * s2 + ly * c2;
  }
  return out;
}

function pathPoly(ctx, poly, vx, vy) {
  ctx.beginPath();
  ctx.moveTo(poly[0] - vx, poly[1] - vy);
  for (let i = 2; i < poly.length; i += 2) ctx.lineTo(poly[i] - vx, poly[i + 1] - vy);
  ctx.closePath();
}

/** punch holes for every light out of the darkness layer */
export function renderDarkness(ctx, w, h, dark, polys, vx, vy, amb) {
  // amb = the room's shadow tint (cold blue outside, warmer indoors) -- it is
  // what the darkness *is*, so every room's night looks slightly different.
  const [ar, ag, ab] = amb || [0.16, 0.18, 0.28];
  const sh = (v) => Math.round(clamp(v, 0, 1) * 42);
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = `rgba(${sh(ar)},${sh(ag)},${sh(ab)},${dark})`;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'destination-out';
  for (const p of polys) {
    const { x, y, r, i = 1 } = p.light;
    ctx.save();
    pathPoly(ctx, p.poly, vx, vy);
    ctx.clip();
    const g = ctx.createRadialGradient(x - vx, y - vy, 0, x - vx, y - vy, r);
    const a = clamp(i, 0, 1);
    g.addColorStop(0, `rgba(0,0,0,${a})`);
    g.addColorStop(0.45, `rgba(0,0,0,${a * 0.72})`);
    g.addColorStop(0.78, `rgba(0,0,0,${a * 0.28})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - vx - r, y - vy - r, r * 2, r * 2);
    ctx.restore();
  }
  ctx.restore();
}

/** warm/coloured glow pass, additive, clipped to the visible polygon */
export function renderGlows(ctx, polys, vx, vy) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const p of polys) {
    const { x, y, r, c = [255, 200, 140], i = 1 } = p.light;
    ctx.save();
    pathPoly(ctx, p.poly, vx, vy);
    ctx.clip();
    const g = ctx.createRadialGradient(x - vx, y - vy, 0, x - vx, y - vy, r);
    const a = clamp(i, 0, 1);
    g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${0.3 * a})`);
    g.addColorStop(0.4, `rgba(${c[0]},${c[1]},${c[2]},${0.12 * a})`);
    g.addColorStop(1, `rgba(${c[0]},${c[1]},${c[2]},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - vx - r, y - vy - r, r * 2, r * 2);
    ctx.restore();
  }
  ctx.restore();
}

/** per-frame light list: static room lights (with flicker) + dynamic ones */
export function buildPolys(lights, occluders, time) {
  const polys = [];
  for (const l of lights) {
    if (l.off) continue;
    const f = l.f ? flicker(time, l.seed ?? (l.x * 7 + l.y * 3), 0.4 + (l.f ?? 0) * 0.6) : 1;
    const intensity = clamp((l.i ?? 1) * (l.f ? 0.82 + f * 0.28 : 1), 0, 1.4);
    const radius = l.r * (l.f ? 0.94 + f * 0.1 : 1);
    const poly = l.cone != null
      ? visibility(l.x, l.y, l.cone, l.spread ?? 1.05, radius, occluders)
      : visibility(l.x, l.y, 0, Math.PI * 1.999, radius, occluders);
    polys.push({ light: { ...l, r: radius, i: intensity }, poly });
  }
  return polys;
}
