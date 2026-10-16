// Static asset wiring check: every frame name used by the level data must exist
// either in the sprite atlas or as a procedural prop in src/game/custom.js.
// Usage: node tools/verify_assets.mjs
import { readFileSync } from 'node:fs';
import { ROOMS, CUSTOM_FRAMES } from '../src/game/rooms.js';

const atlas = JSON.parse(readFileSync(new URL('../public/assets/atlas.json', import.meta.url)));
const frames = new Set(Object.keys(atlas.frames || atlas));
const custom = new Set(CUSTOM_FRAMES || []);

const used = new Map();
const note = (n) => used.set(n, (used.get(n) || 0) + 1);
for (const [id, r] of Object.entries(ROOMS)) {
  (r.floorPool || []).forEach(note);
  (r.wallPool || []).forEach(note);
  if (r.wallCap) note(r.wallCap);
  if (r.wallBase) note(r.wallBase);
  (r.props || []).forEach((p) => note(p.t));
}
for (const [id, r] of Object.entries(ROOMS)) {
  for (const p of r.props || []) {
    if (!frames.has(p.t) && !custom.has(p.t)) console.log(`  MISSING frame "${p.t}" (room ${id})`);
  }
}
const missing = [...used.keys()].filter((n) => !frames.has(n) && !custom.has(n));
const unused = [...frames].filter((n) => !used.has(n));
const customNoCase = [...custom].filter((n) => !frames.has(n));

console.log(`atlas frames      : ${frames.size}`);
console.log(`frames referenced : ${used.size}`);
if (missing.length) console.log('  !! referenced but NOT available:', missing.join(', '));
else console.log('  ok  : every referenced frame resolves');
console.log(`atlas frames never used by any room: ${unused.length}`);
if (unused.length) console.log('      ', unused.join(', '));
console.log(`procedural props declared: ${[...custom].join(', ')}`);
process.exit(missing.length ? 1 : 0);
