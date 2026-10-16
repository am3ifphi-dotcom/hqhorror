// ---------------------------------------------------------------------------
// Renders real frames of the game headlessly with @napi-rs/canvas and writes
// them to tools/shots/*.png so the art can be inspected without a browser.
//
//   REAL2D=1 node tools/shot.mjs
//
// Note: WebGL post-processing (grain / aberration / vignette / wobble) cannot
// run headlessly, so these PNGs show the RAW 2D scene only.
// ---------------------------------------------------------------------------
import { boot } from './harness.mjs';

const { game, step, press, release, tapZ, drain, dump } = await boot({ real2d: true });
const { ROOMS } = await import('../src/game/rooms.js');

const wait = (n) => step(n);
const shot = async (name, n = 1) => { await step(n); const f = dump(name); console.log('  wrote', f); };

// ---- boot -> title -> play -------------------------------------------------
await wait(2);
await shot('00_boot.png', 20);
await game.start();          // boot -> title (also unlocks audio)
await wait(5);
await shot('01_title.png', 40);
await game.start();          // title -> play
await wait(5);
await drain(600);
await shot('02_hall.png', 30);

// ---- walk a little (fear 0, lantern on) ------------------------------------
press('KeyD'); await wait(45); release('KeyD');
await shot('03_hall_walk.png', 10);

// ---- each room -------------------------------------------------------------
for (const [id, spawn] of [['corridor', ROOMS.corridor.spawn], ['childroom', ROOMS.childroom.spawn], ['study', ROOMS.study.spawn], ['basement', ROOMS.basement.spawn]]) {
  game.setRoom(id, spawn);
  await drain(400);
  game.player.lightOn = true;
  game.player.battery = 1;
  await wait(20);
  await shot(`04_${id}.png`, 20);
  // same frame with the darkness mask lifted -- shows the raw art underneath
  const keep = game.room.d.dark;
  game.room.d.dark = 0.25;
  await shot(`07_${id}_lit.png`, 2);
  game.room.d.dark = keep;
}

// ---- fear / ghost -----------------------------------------------------------
game.setRoom('basement', ROOMS.basement.spawn);
await drain(300);
game.player.fear = 0.8;
game.ghost.spawn(game.player.x + 90, game.player.y + 40, 'stalk');
await wait(60);
await shot('05_fear_ghost.png', 10);

// ---- open the portrait dialogue --------------------------------------------
game.ghost.vanish();
game.player.fear = 0.1;
game.player.battery = 1;
game.setRoom('hall', ROOMS.hall.spawn);
await drain(300);
game.dir.run(function* () { yield game.say('結衣', '……誰か、いる？', 'fear'); }, 'scene');
await wait(20);
await shot('06_dialogue.png', 10);

console.log('done');
