// ---------------------------------------------------------------------------
// Headless smoke test: boots the game in jsdom (stubbed WebGL / WebAudio, file
// fetch) and drives simulated frames: every room, every interaction, the key,
// the locked door, the chase, the escape, the ending and back to the title.
// Catches runtime errors without a browser.
//
//   node tools/smoke.mjs
// ---------------------------------------------------------------------------
import { boot } from './harness.mjs';

// collect console.error before the game modules are imported
const errors = [];
const origError = console.error;
console.error = (...a) => { errors.push(a.join(' ')); origError('   !', ...a); };

const { window, game, step, press, release, tapZ, drain } = await boot();

// ------------------------------------------------------------------ run test
await step(2);
console.log('state after init:', game.state);

await game.start();
await step(5);
console.log('state after first click:', game.state);
await game.start();
await step(5);
console.log('state:', game.state, '| room:', game.room?.id, '| player', game.player.x | 0, game.player.y | 0);

// ---- roam ------------------------------------------------------------------
const seq = ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'];
let held = null;
for (let i = 0; i < 300; i++) {
  if (i % 25 === 0) {
    if (held) release(held);
    held = seq[(i / 25) % seq.length | 0];
    press(held);
  }
  if (i % 19 === 0) await tapZ();
  await step(1);
}
if (held) release(held);
console.log('after roaming: room =', game.room?.id, '| fear =', game.fear.toFixed(2));

// ---- every room, every interaction ----------------------------------------
const roomsMod = await import('../src/game/rooms.js');
const report = {};
for (const id of Object.keys(roomsMod.ROOMS)) {
  game.setRoom(id, roomsMod.ROOMS[id].spawn);
  await drain();
  const spots = game.room.d.spots || [];
  for (const s of spots) {
    game.player.x = (s.x + s.w / 2) * 32;
    game.player.y = (s.y + s.h) * 32;
    await step(3);
    const promptedBefore = !window.document.getElementById('prompt').classList.contains('hidden');
    await tapZ();
    const opened = !!game.ui.type;
    console.log('     spot', s.id.padEnd(16), 'promptShown=', promptedBefore, 'dialogueOpened=', opened, 'dirbusy=', game.dir.busy);
    await drain(600);
  }
  report[id] = { flags: { ...game.flags }, items: game.items.map((i) => i.id) };
  console.log('  room', id.padEnd(10), 'spots', String(spots.length).padEnd(2), '| items:', game.items.map((i) => i.id).join(',') || '-');
}

let failed = 0;
const checks = [
  ['clock examined', (report.hall.flags.clock || 0) >= 1],
  ['hall intro played', !!report.hall.flags.hallIntro],
  ['portrait examined', (report.corridor.flags.portrait || 0) >= 1],
  ['doll examined', (report.childroom.flags.doll || 0) >= 1],
  ['music box picked up', report.childroom.items.includes('musicbox')],
  ['diary read', (report.study.flags.desk || 0) >= 1],
  ['basement key picked up', report.study.items.includes('basement_key')],
  ['altar examined', report.basement.flags.altar === true],
];
for (const [name, ok] of checks) {
  if (!ok) { failed++; console.error('  FAIL:', name); }
  else console.log('  ok  :', name);
}

// reset: the spot walk may have started the chase / the ending
game.dir.clear();
game.ui.close();
game.flags = {};
game.ghost.vanish();
game.player.fear = 0;
game.state = 'play';
await drain(200);

// ---- locked door -----------------------------------------------------------
game.items = [];
game.ui.setItems([]);
game.setRoom('corridor', [15, 6]);
await drain();
for (const d of game.room.d.doors) {
  if (d.to !== 'basement') continue;
  game.player.x = (d.x + d.w / 2) * 32;
  game.player.y = (d.y + d.h) * 32;
  await step(2);
  await tapZ();
  await drain(600);
}
if (game.room.id !== 'corridor') { failed++; console.error('  FAIL: locked door let us through -> now in ' + game.room.id + ' items=' + JSON.stringify(game.items) + ' player=' + game.player.x + ',' + game.player.y); }
else console.log('  ok  : locked basement door stays locked');

// ---- unlocked door ---------------------------------------------------------
game.give('basement_key', '地下室の鍵');
for (let i = 0; i < 120 && game.room.id === 'corridor'; i++) {
  const d = game.room.d.doors.find((x) => x.to === 'basement');
  game.player.x = (d.x + d.w / 2) * 32;
  game.player.y = (d.y + d.h) * 32;
  await tapZ();
  await step(2);
}
if (game.room.id !== 'basement') { failed++; console.error('  FAIL: key did not open the basement'); }
else console.log('  ok  : basement opens with the key');

// ---- chase + ending --------------------------------------------------------
game.setRoom('basement', roomsMod.ROOMS.basement.spawn);
await drain();
game.player.x = 12 * 32;
game.player.y = 13 * 32;
await step(3);
const script = await import('../src/game/script.js');
game.dir.run(() => script.INTERACT.base_altar(game), 'scene');
for (let i = 0; i < 300 && !game.flags.chase; i++) { await tapZ(); await step(1); }
if (!game.flags.chase) { failed++; console.error('  FAIL: chase never started'); }
else {
  for (let i = 0; i < 90; i++) await step(1);
  if (game.ghost.mode !== 'hunt') { failed++; console.error('  FAIL: ghost is not hunting (mode=' + game.ghost.mode + ')'); }
  else console.log('  ok  : chase started | ghost hunting | fear', game.player.fear.toFixed(2));
}

let escaped = false;
for (let i = 0; i < 900; i++) {
  const d = game.room.d.doors[0];
  game.player.x += ((d.x + d.w / 2) * 32 - game.player.x) * 0.08;
  game.player.y += ((d.y + d.h) * 32 - game.player.y) * 0.08;
  await tapZ();
  if (game.room.id !== 'basement') { escaped = true; break; }
}
if (!escaped) { failed++; console.error('  FAIL: could not escape the basement'); }
else console.log('  ok  : escaped the basement ->', game.room.id);

let ended = false;
for (let i = 0; i < 2000; i++) {
  await tapZ();
  await step(1);
  if (game.state !== 'play') { ended = true; break; }
}
if (!ended) { failed++; console.error('  FAIL: ending never played'); }
else console.log('  ok  : ending reached, state =', game.state);
await step(60);

// ---- title -----------------------------------------------------------------
game.state = 'title';
game.room = null;
await step(30);
console.log('  ok  : title screen renders');

if (failed) errors.push(failed + ' gameplay assertion(s) failed');
if (errors.length) {
  console.log('\n=== ERRORS (' + errors.length + ') ===');
  for (const e of [...new Set(errors)].slice(0, 40)) console.log(' -', e);
  process.exit(1);
}
console.log('\nSMOKE TEST PASSED — no runtime errors');
