// ---------------------------------------------------------------------------
// Room construction (tiles, collision, occluders) and the world renderer.
// ---------------------------------------------------------------------------
import { clamp, mulberry32, damp } from '../engine/core.js';
import { drawCustom, CUSTOM_SIZE } from './custom.js';

export const TILE = 32;

/** greedy merge of a boolean grid into a handful of big rectangles */
function mergeRects(solid, w, h) {
  const rects = [];
  const runs = [];
  for (let y = 0; y < h; y++) {
    const row = [];
    let x = 0;
    while (x < w) {
      if (!solid[y][x]) { x++; continue; }
      let x2 = x;
      while (x2 + 1 < w && solid[y][x2 + 1]) x2++;
      row.push([x, x2]);
      x = x2 + 1;
    }
    runs.push(row);
  }
  const open = [];
  for (let y = 0; y < h; y++) {
    const next = [];
    for (const [a, b] of runs[y]) {
      let merged = false;
      for (let i = 0; i < open.length; i++) {
        const r = open[i];
        if (r.a === a && r.b === b) { r.h = y + 1 - r.y; merged = true; break; }
      }
      if (!merged) next.push({ a, b, y, h: 1 });
    }
    for (const r of open) if (!runs[y].some(([a, b]) => r.a === a && r.b === b)) rects.push(r);
    open.length = 0;
    open.push(...next);
  }
  for (const r of open) rects.push(r);
  return rects.map((r) => ({ x: r.a * TILE, y: r.y * TILE, w: (r.b - r.a + 1) * TILE, h: r.h * TILE }));
}

export class Room {
  constructor(id, data, atlas) {
    this.id = id;
    this.d = data;
    this.atlas = atlas;
    this.w = data.w;
    this.h = data.h;
    this.pxW = data.w * TILE;
    this.pxH = data.h * TILE;
    this.build();
  }

  build() {
    const d = this.d;
    const rnd = mulberry32(hashStr(this.id));
    this.tile = [];
    this.solid = [];
    const gaps = d.gaps || [];
    const inGap = (x) => gaps.some(([gx, gw]) => x >= gx && x < gx + gw);
    const blocks = d.blocks || [];
    const inBlock = (x, y) => blocks.some(([bx, by, bw, bh]) => x >= bx && x < bx + bw && y >= by && y < by + bh);

    for (let y = 0; y < this.h; y++) {
      const trow = [];
      const srow = [];
      for (let x = 0; x < this.w; x++) {
        const border = x === 0 || x === this.w - 1 || y === this.h - 1;
        const band = y < d.wallH && !inGap(x);
        const wall = band || border || inBlock(x, y);
        srow.push(wall);
        if (wall) {
          let n;
          if (band && y === 0) n = d.wallCap || d.wallPool[0];
          else if (band && y === d.wallH - 1) n = d.wallBase || d.wallPool[0];
          else n = d.wallPool[(rnd() * d.wallPool.length) | 0];
          trow.push({ k: 'w', n });
        } else {
          trow.push({ k: 'f', n: d.floorPool[(rnd() * d.floorPool.length) | 0] });
        }
      }
      this.tile.push(trow);
      this.solid.push(srow);
    }

    this.occluders = mergeRects(this.solid, this.w, this.h);

    // props
    this.props = (d.props || []).map((p, i) => {
      const px = p.x * TILE;
      const py = p.y * TILE;
      let size;
      if (CUSTOM_SIZE[p.t]) size = CUSTOM_SIZE[p.t];
      else {
        const f = this.atlas.frame(p.t);
        size = [f.w, f.h];
      }
      const prop = { ...p, px, py, w: size[0], h: size[1], idx: i };
      if (p.solid && !p.flat) {
        let cw, ch;
        if (CUSTOM_SIZE[p.t]) { cw = size[0] * 0.6; ch = size[1] * 0.25; }
        else { const f = this.atlas.frame(p.t); cw = f.cw; ch = f.ch; }
        prop.rect = { x: px - cw / 2, y: py - ch, w: cw, h: ch };
      }
      return prop;
    });
    this.occRects = this.occluders.concat(
      this.props.filter((p) => p.rect && p.h > 22 && p.t !== 'door_closed').map((p) => p.rect)
    );
    // smallest hotspots first so a big "desk" rect never shadows the key on it
    this.spots = (d.spots || []).slice().sort((a, b) => a.w * a.h - b.w * b.h);
    this.wallProps = this.props.filter((p) => p.wall);
    this.flatProps = this.props.filter((p) => p.flat);
    this.yProps = this.props.filter((p) => !p.wall && !p.flat).sort((a, b) => a.py - b.py);
  }

  isSolid(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return true;
    return this.solid[ty | 0][tx | 0];
  }

  /** collide a moving AABB (px) against tiles + prop footprints; returns resolved pos */
  move(ent, dx, dy) {
    const hw = ent.cw / 2;
    let x = ent.x;
    let y = ent.y;
    x += dx;
    if (this.blocked(x - hw, y - ent.ch, ent.cw, ent.ch)) { x = ent.x; ent.hitX = true; }
    y += dy;
    if (this.blocked(x - hw, y - ent.ch, ent.cw, ent.ch)) { y = ent.y; ent.hitY = true; }
    return { x, y };
  }

  blocked(x, y, w, h) {
    const x0 = Math.floor(x / TILE);
    const x1 = Math.floor((x + w - 0.001) / TILE);
    const y0 = Math.floor(y / TILE);
    const y1 = Math.floor((y + h - 0.001) / TILE);
    for (let ty = y0; ty <= y1; ty++)
      for (let tx = x0; tx <= x1; tx++)
        if (this.isSolid(tx, ty)) return true;
    for (const p of this.props) {
      if (!p.rect) continue;
      const r = p.rect;
      if (x < r.x + r.w && x + w > r.x && y < r.y + r.h && y + h > r.y) return true;
    }
    return false;
  }

  drawGround(ctx, view) {
    const x0 = Math.max(0, (view.x / TILE) | 0);
    const x1 = Math.min(this.w - 1, ((view.x + view.w) / TILE) | 0);
    const y0 = Math.max(0, (view.y / TILE) | 0);
    const y1 = Math.min(this.h - 1, ((view.y + view.h) / TILE) | 0);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const t = this.tile[y][x];
        if (t.k !== 'f') continue;
        this.atlas.draw(ctx, t.n, x * TILE - view.x, y * TILE - view.y);
      }
    }
    for (const p of this.flatProps) this.drawProp(ctx, p, view);
  }

  drawWalls(ctx, view) {
    const x0 = Math.max(0, (view.x / TILE) | 0);
    const x1 = Math.min(this.w - 1, ((view.x + view.w) / TILE) | 0);
    const y0 = Math.max(0, (view.y / TILE) | 0);
    const y1 = Math.min(this.h - 1, ((view.y + view.h) / TILE) | 0);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const t = this.tile[y][x];
        if (t.k !== 'w') continue;
        this.atlas.draw(ctx, t.n, x * TILE - view.x, y * TILE - view.y);
      }
    }
    for (const p of this.wallProps) this.drawProp(ctx, p, view);
  }

  drawProp(ctx, p, view, t = 0) {
    const x = p.px - view.x;
    const y = p.py - view.y;
    if (x < -120 || x > view.w + 120 || y < -180 || y > view.h + 120) return;
    if (CUSTOM_SIZE[p.t]) drawCustom(ctx, p.t, x, y, t, { atlas: this.atlas, ...p });
    else this.atlas.draw(ctx, p.t, x, y, { scale: p.scale ?? 1, alpha: p.alpha ?? 1, tint: p.tint });
    // emissive props get a little bloom seed
    if (p.glow) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(x - 40, y - 90, x + 40, y);
      g.addColorStop(0, 'rgba(120,150,210,0)');
      g.addColorStop(1, 'rgba(130,160,220,0.10)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 44, y - 96, 88, 96);
      ctx.restore();
    }
  }
}

export class Camera {
  constructor(w, h) {
    this.x = 0;
    this.y = 0;
    this.w = w;
    this.h = h;
  }
  snap(tx, ty, room) {
    this.x = clamp(tx - this.w / 2, 0, Math.max(0, room.pxW - this.w));
    this.y = clamp(ty - this.h / 2, 0, Math.max(0, room.pxH - this.h));
  }
  follow(tx, ty, room, dt, lead = { x: 0, y: 0 }) {
    const gx = clamp(tx + lead.x - this.w / 2, 0, Math.max(0, room.pxW - this.w));
    const gy = clamp(ty + lead.y - this.h / 2, 0, Math.max(0, room.pxH - this.h));
    this.x = damp(this.x, gx, 7, dt);
    this.y = damp(this.y, gy, 7, dt);
  }
}

export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
