// ---------------------------------------------------------------------------
// Hand drawn (procedural) pixel props — used where the LPC set had nothing
// suitable: the music box, the doll, the brass key, the altar, curtains and
// the staircase overlays.  Drawn with 1px rects so they stay in style.
// ---------------------------------------------------------------------------

const px = (ctx, x, y, w, h, c) => {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

const rect = (ctx, x, y, w, h, c, hi, lo) => {
  px(ctx, x, y, w, h, c);
  if (hi) px(ctx, x, y, w, 1, hi);
  if (lo) px(ctx, x, y + h - 1, w, 1, lo);
};

export function drawCustom(ctx, name, x, y, t = 0, opt = {}) {
  // (x, y) is the anchor: bottom centre of the sprite
  switch (name) {
    // ---------------------------------------------------------- music box
    case 'musicbox': {
      const w = 18, h = 14;
      const bx = x - w / 2, by = y - h;
      rect(ctx, bx, by + 5, w, 9, '#5b3a22', '#8a5c36', '#2a180d');
      rect(ctx, bx + 1, by, w - 2, 6, '#7a4c2a', '#a8703f', '#3a2211');
      px(ctx, bx + 3, by + 2, w - 6, 2, '#c9973f');
      px(ctx, bx + w - 5, by + 6, 2, 4, '#d8b25a');
      if (opt.open) {
        px(ctx, bx + 2, by - 5, w - 4, 5, '#6b4025');
        px(ctx, bx + 3, by - 4, w - 6, 3, '#e8d9b0');
        const s = Math.sin(t * 3) * 1.5;
        px(ctx, x + s, by - 8, 1, 4, '#f0e6cf');
        px(ctx, x + 4 - s, by - 7, 1, 3, '#e2d3b4');
      }
      break;
    }
    // -------------------------------------------------------------- doll
    case 'doll': {
      const w = 12, h = 24;
      const bx = x - w / 2, by = y - h;
      // dress
      px(ctx, bx + 2, by + 12, 8, 12, '#5c2630');
      px(ctx, bx + 3, by + 14, 6, 8, '#7a3340');
      px(ctx, bx + 2, by + 22, 8, 2, '#33131a');
      // arms
      px(ctx, bx, by + 13, 2, 7, '#5c2630');
      px(ctx, bx + w - 2, by + 13, 2, 7, '#5c2630');
      // head
      px(ctx, bx + 2, by + 2, 8, 9, '#e6d8c6');
      px(ctx, bx + 3, by + 3, 6, 7, '#f2e6d6');
      // hair
      px(ctx, bx + 1, by, 10, 4, '#1a1418');
      px(ctx, bx + 1, by + 3, 2, 6, '#1a1418');
      px(ctx, bx + 9, by + 3, 2, 6, '#1a1418');
      // eyes — they follow you
      const ex = opt.eyes ? Math.round(opt.eyes * 2) : 0;
      px(ctx, bx + 3 + ex, by + 6, 2, 2, '#120d10');
      px(ctx, bx + 7 + ex, by + 6, 2, 2, '#120d10');
      px(ctx, bx + 4, by + 9, 4, 1, '#b98d8d');
      break;
    }
    // --------------------------------------------------------------- key
    case 'key': {
      const w = 6, h = 12;
      const bx = x - w / 2, by = y - h;
      const glow = 0.55 + 0.45 * Math.sin(t * 2.2);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(255,214,120,${0.12 * glow})`;
      ctx.fillRect(bx - 5, by - 5, w + 10, h + 10);
      ctx.restore();
      px(ctx, bx + 1, by, 2, 2, '#d9b25c');
      px(ctx, bx, by + 1, 4, 3, '#d9b25c');
      px(ctx, bx + 1, by + 2, 2, 1, '#6b4a17');
      px(ctx, bx + 2, by + 4, 2, 7, '#c69f4c');
      px(ctx, bx + 4, by + 8, 2, 1, '#c69f4c');
      px(ctx, bx + 4, by + 10, 2, 1, '#c69f4c');
      break;
    }
    // ------------------------------------------------------------ altar
    case 'doll_altar': {
      const w = 26, h = 16;
      const bx = x - w / 2, by = y - h;
      px(ctx, bx, by + 12, w, 4, '#3a2c22');
      px(ctx, bx + 2, by + 13, w - 4, 2, '#4b392c');
      // candles
      for (const cx of [bx + 3, bx + 10, bx + 17, bx + 23]) {
        px(ctx, cx, by + 5, 2, 7, '#e4d7bd');
        const f = Math.sin(t * 9 + cx) * 0.5 + 0.5;
        px(ctx, cx, by + 1 + f, 2, 3 - f, '#ffcf6a');
        px(ctx, cx, by + f, 2, 2, '#fff2c8');
      }
      // offering
      px(ctx, bx + 11, by + 7, 5, 5, '#7a3340');
      px(ctx, bx + 12, by + 6, 3, 3, '#e6d8c6');
      px(ctx, bx + 12, by + 8, 1, 1, '#120d10');
      px(ctx, bx + 14, by + 8, 1, 1, '#120d10');
      break;
    }
    // ---------------------------------------------------------- curtains
    case 'curtain': {
      const w = 30, h = 46;
      const bx = x - w / 2, by = y - h;
      for (let i = 0; i < w; i++) {
        const k = Math.abs(i / (w - 1) - 0.5) * 2;
        const shade = 40 + 30 * (1 - k) - 8 * Math.sin(i * 0.9);
        px(ctx, bx + i, by, 1, h, `rgb(${shade + 26},${shade + 12},${shade + 18})`);
      }
      px(ctx, bx, by, w, 2, '#4a3a34');
      px(ctx, bx, by + h - 3, w, 3, '#2a1e1c');
      break;
    }
    // ------------------------------------------------------------ stairs
    case 'stair_up': {
      opt.atlas.draw(ctx, 'stairs', x, y, { scale: opt.scale ?? 1 });
      break;
    }
    case 'stair_down': {
      opt.atlas.draw(ctx, 'stairs', x, y, { scale: opt.scale ?? 1, tint: 'rgba(10,12,20,0.55)' });
      break;
    }
    default:
      break;
  }
}

/** footprint (width, height in px) for the procedural props */
export const CUSTOM_SIZE = {
  musicbox: [18, 14],
  doll: [12, 24],
  key: [6, 12],
  doll_altar: [26, 16],
  curtain: [30, 46],
  stair_up: [64, 64],
  stair_down: [64, 64],
};
