// ---------------------------------------------------------------------------
// Scenario.  Every entry is a generator: `yield` a number to wait seconds,
// a promise (ui.say) to wait for the player, or a waiter object.
// ---------------------------------------------------------------------------

const wait = (t) => ({ t, update(dt) { this.t -= dt; return this.t <= 0; } });
const until = (fn) => ({ update() { return !!fn(); } });

/** ------------------------------------------------------------------ 玄関 */
export function enterHall(g) {
  return function* () {
    g.audio.setAmbienceMix({ drone: 0.06, wind: 0.06, rain: 0.09 });
    g.sfx.fadeTo(0, 1.6);
    g.ui.chapter('一　　到着');
    yield wait(2.4);
    g.audio.thunder(false);
    yield wait(0.4);
    yield g.mono('……着いた。', 'base');
    yield g.mono('地図に載っていない家。*母*が最後に送ってきた手紙の、あの住所。', 'base');
    yield wait(0.3);
    yield g.say('結衣', '……すみません。', 'base');
    yield g.mono('返事はない。雨の音だけが、ずっと続いている。', 'base');
    g.flags.hallIntro = true;
  };
}

/** ------------------------------------------------------------------ 廊下 */
export function enterCorridor(g) {
  return function* () {
    if (g.flags.corIntro) return;
    g.flags.corIntro = true;
    g.audio.setAmbienceMix({ drone: 0.14, wind: 0.12, rain: 0.07 });
    yield wait(0.6);
    g.audio.creak(-0.3);
    yield g.mono('……いま、どこかで扉がきしんだ。', 'base');
    yield wait(0.5);
    g.flickerLights(0.8);
    yield wait(0.5);
    yield g.mono('廊下の奥が、暗い。', 'base');
  };
}

export function enterChildroom(g) {
  return function* () {
    if (g.flags.kidIntro) return;
    g.flags.kidIntro = true;
    g.audio.setAmbienceMix({ drone: 0.12, wind: 0.1, rain: 0.06 });
    yield g.mono('子供部屋。壁の色だけが、やけに明るい。', 'base');
    yield wait(0.4);
    yield g.mono('……ベッドの上に、だれか座っていたような跡がある。', 'base');
  };
}

export function enterStudy(g) {
  return function* () {
    if (g.flags.studyIntro) return;
    g.flags.studyIntro = true;
    g.audio.setAmbienceMix({ drone: 0.14, wind: 0.1, rain: 0.06 });
    yield wait(0.4);
    yield g.mono('書斎。暖炉の火が、まだ生きている。', 'base');
  };
}

export function enterBasement(g) {
  return function* () {
    if (g.flags.baseIntro) {
      g.audio.setAmbienceMix({ drone: 0.3, wind: 0.14, rain: 0.02 });
      return;
    }
    g.flags.baseIntro = true;
    g.ui.chapter('二　　地下');
    g.audio.setAmbienceMix({ drone: 0.34, wind: 0.16, rain: 0.02 });
    g.particles.fogAmount = 0.8;
    yield wait(1.2);
    g.audio.creak(0.2);
    yield g.mono('階段の下は、底のない暗さだ。', 'fear');
    yield g.say('結衣', '……懐中電灯、つけておかないと。', 'fear');
    g.addFear(0.25);
    yield wait(0.6);
    g.audio.whisper(0.6);
    yield wait(0.5);
    yield g.mono('（……だれか、呼んだ）', 'fear');
  };
}

// ------------------------------------------------------------------ 調べる
export const INTERACT = {
  // ================================================================ 玄関
  hall_clock: function* (g) {
    g.flags.clock = (g.flags.clock || 0) + 1;
    g.audio.play('metal', { volume: 0.5, verb: 0.6 });
    yield wait(0.2);
    if (g.flags.clock === 1) {
      yield g.mono('振り子時計。針は*二時十五分*で止まっている。', 'base');
    } else if (g.flags.clock === 2) {
      yield g.mono('……さっきより、針が進んでいる。', 'base');
      g.audio.piano(196, { gain: 0.09, dur: 3 });
      yield wait(0.5);
      yield g.mono('（時計が、鳴った）', 'fear');
      g.addFear(0.08);
    } else {
      g.audio.piano(196, { gain: 0.1, dur: 3 });
      yield wait(0.4);
      yield g.mono('……時計の音が、家じゅうに響く。', 'fear');
      g.flickerLights(1);
    }
  },

  hall_door: function* (g) {
    g.audio.play('latch', { volume: 0.6 });
    yield wait(0.2);
    g.sfx.shake(1.2, 0.2);
    yield g.mono('鍵がかかっている。外から、かけられたみたい。', 'base');
  },

  hall_window: function* (g) {
    yield g.mono('窓の外は、雨。庭の先に、小さな*離れ*が見える。', 'base');
    yield wait(0.3);
    yield g.mono('……離れの二階に、明かりがついている。', 'base');
  },

  hall_stairs: function* (g) {
    yield g.mono('二階への階段。途中から、ひどく朽ちている。', 'base');
    yield wait(0.2);
    yield g.mono('（のぼるべきじゃない）', 'base');
  },

  hall_portrait: function* (g) {
    yield g.mono('見たことのない男の肖像画。', 'base');
    g.flickerLights(0.5);
    yield wait(0.4);
    yield g.mono('……目が、こっちを向いていた気がする。', 'fear');
    g.addFear(0.05);
  },

  hall_candle: function* (g) {
    yield g.mono('蝋燭の火が、ひとりでに揺れている。風はないのに。', 'base');
  },

  // ================================================================ 廊下
  cor_portrait: function* (g) {
    g.flags.portrait = (g.flags.portrait || 0) + 1;
    if (g.flags.portrait === 1) {
      yield g.mono('女の子の肖像画。プレートには*「しずか」*とある。', 'base');
      yield wait(0.4);
      yield g.say('結衣', '……しずか。', 'base');
    } else {
      yield g.mono('……また、目が動いた。', 'fear');
      g.audio.whisper(-0.4);
      g.scare(0.22, 0.5);
      g.addFear(0.12);
    }
  },

  cor_mirror: function* (g) {
    yield g.mono('鏡。曇っていて、よく見えない。', 'base');
    yield wait(0.5);
    g.audio.play('cloth', { volume: 0.4 });
    yield wait(0.3);
    yield g.mono('……。', 'fear');
    yield wait(0.25);
    g.jumpScare('ghost');
    yield g.mono('（……いま、後ろに）', 'fear');
    g.addFear(0.3);
    g.sfx.shake(3, 0.5);
    yield g.say('結衣', '………………っ。', 'fear');
  },

  cor_cabinet: function* (g) {
    g.audio.play('cloth', { volume: 0.35 });
    yield g.mono('戸棚。中には、埃をかぶった食器が並んでいる。', 'base');
    yield wait(0.4);
    yield g.mono('……いちばん奥に、*小さな人形の腕*が置いてある。', 'fear');
    g.addFear(0.1);
  },

  cor_window: function* (g) {
    yield g.mono('雨が、ガラスを叩いている。', 'base');
    yield wait(0.3);
    yield g.mono('……窓の外に、だれか立っている。', 'fear');
    g.addFear(0.1);
  },

  cor_stairs: function* (g) {
    if (!g.has('basement_key')) {
      yield g.mono('地下室への階段。扉には鍵がかかっている。', 'base');
      return;
    }
    yield g.mono('鍵が、合った。', 'base');
  },

  cor_basement_door: function* (g) {
    if (!g.has('basement_key')) {
      g.audio.play('latch', { volume: 0.7 });
      yield g.mono('鍵がかかっている。*小さな鍵*が必要だ。', 'base');
      return;
    }
    g.audio.play('latch', { volume: 0.7 });
    yield wait(0.2);
    g.audio.door(0.8);
    yield g.mono('……開いた。', 'base');
  },

  // ============================================================= 子供部屋
  kid_bed: function* (g) {
    yield g.mono('小さなベッド。布団が、めくられたままになっている。', 'base');
    yield wait(0.4);
    yield g.mono('（……さっきまで、温かかった）', 'fear');
    g.addFear(0.1);
  },

  kid_doll: function* (g) {
    g.flags.doll = (g.flags.doll || 0) + 1;
    if (g.flags.doll === 1) {
      yield g.mono('古い人形。片方の腕が、ない。', 'base');
      yield wait(0.5);
      g.audio.creak(0.2, 0.7);
      g.dollTurn = 1;
      yield wait(0.5);
      yield g.mono('……人形の首が、*こっち*を向いた。', 'fear');
      g.sfx.shake(1.5, 0.3);
      g.addFear(0.15);
    } else {
      yield g.mono('人形は、もう動かない。ずっと、こっちを見ている。', 'fear');
    }
  },

  kid_musicbox: function* (g) {
    if (g.has('musicbox')) return;
    yield g.mono('オルゴール。ふたを開けると、音が鳴りそうだ。', 'base');
    yield wait(0.3);
    yield g.say('結衣', '……開けてみる。', 'base');
    g.audio.play('metal', { volume: 0.4 });
    yield wait(0.35);
    g.audio.playMelody([72, 74, 76, 79, 76, 74, 72, null, 67, 69, 72], { gap: 0.34, gain: 0.13, dur: 2.4 });
    yield wait(1.2);
    yield g.mono('……きれいな音。', 'base');
    yield wait(1.0);
    g.give('musicbox', 'オルゴール');
    yield wait(0.4);
    yield g.mono('（持っていこう）', 'base');
    g.flags.gotBox = true;
  },

  kid_window: function* (g) {
    yield g.mono('窓の外、雨。', 'base');
    yield wait(0.4);
    yield g.mono('……ガラスに、*手形*がついている。内側から。', 'fear');
    g.addFear(0.12);
  },

  kid_boxes: function* (g) {
    yield g.mono('段ボール。古い絵本と、丈の合わなくなった服。', 'base');
  },

  kid_cabinet: function* (g) {
    yield g.mono('たんす。引き出しのひとつが、開かない。', 'base');
    g.audio.play('cloth', { volume: 0.35 });
    yield wait(0.3);
    yield g.mono('（なにか、中で動いた）', 'fear');
    g.addFear(0.08);
  },

  // ================================================================= 書斎
  st_desk: function* (g) {
    g.flags.desk = (g.flags.desk || 0) + 1;
    g.audio.play('page', { volume: 0.5 });
    if (g.flags.desk === 1) {
      yield g.mono('書き物机。日記が、開いたままになっている。', 'base');
      yield wait(0.4);
      yield g.mono('『*しずか*は、今日も地下に降りていった。』', 'base');
      yield wait(0.5);
      yield g.mono('『あの子は、もう戻ってこない。』', 'base');
      g.addFear(0.1);
    } else {
      yield g.mono('『……わたしが、呼んでいる。』', 'fear');
      g.audio.whisper(0.3);
      g.addFear(0.15);
    }
  },

  st_fire: function* (g) {
    yield g.mono('暖炉の火。紙がくべられた跡がある。', 'base');
    yield wait(0.3);
    yield g.mono('燃え残りの紙に、*「しずか」*という字。', 'base');
  },

  st_mirror: function* (g) {
    yield g.mono('大きな鏡。部屋が、そのまま映っている。', 'base');
    yield wait(0.6);
    g.audio.whisper(0);
    yield wait(0.4);
    yield g.mono('……映っている*わたし*が、動かない。', 'fear');
    yield wait(0.7);
    g.jumpScare('face');
    yield g.say('結衣', '……っ！', 'fear');
    g.addFear(0.35);
    g.sfx.shake(2.5, 0.4);
    yield wait(0.6);
    yield g.mono('（……落ち着いて）', 'fear');
  },

  st_shelf: function* (g) {
    yield g.mono('棚には、錆びた道具と、鍵の束。', 'base');
    yield wait(0.3);
    yield g.mono('……その中の*小さな鍵*が、地下室のものに似ている。', 'base');
  },

  st_key: function* (g) {
    if (g.has('basement_key')) return;
    g.audio.play('metal', { volume: 0.6 });
    yield wait(0.3);
    g.give('basement_key', '地下室の鍵');
    yield g.mono('小さな鍵を、手に入れた。', 'base');
    g.flags.gotKey = true;
  },

  // =============================================================== 地下室
  base_altar: function* (g) {
    if (g.flags.altar) {
      yield g.mono('祭壇。蝋燭の火は、消えない。', 'fear');
      return;
    }
    g.flags.altar = true;
    yield g.mono('……人形の祭壇。', 'fear');
    yield wait(0.5);
    if (g.has('musicbox')) {
      yield g.mono('（……この人形、子供部屋にあったものと）', 'fear');
    }
    g.audio.playMelody([79, 77, 74, 72, 69, null, 72], { gap: 0.5, gain: 0.1, dur: 3 });
    yield wait(1.4);
    yield g.mono('……オルゴールの音が、地下で鳴っている。', 'fear');
    yield wait(0.8);
    yield* chase(g);
  },

  base_cauldron: function* (g) {
    g.audio.play('metal', { volume: 0.35, verb: 0.7 });
    yield g.mono('大鍋。底に、黒いものが乾いている。', 'fear');
  },

  base_bones: function* (g) {
    yield g.mono('小さな骨。鳥のものにしては、細長い。', 'fear');
    g.addFear(0.1);
  },

  base_chains: function* (g) {
    g.audio.play('metal', { volume: 0.5, verb: 0.8 });
    yield g.mono('鎖。ほどけたまま、床に落ちている。', 'fear');
  },
};

// --------------------------------------------------------------- チェイス
function* chase(g) {
  g.setFlow?.();
  g.flags.chase = true;
  g.player.frozen = true;
  g.audio.sting(1);
  g.sfx.flash(0.5, 3);
  g.sfx.shake(4, 0.7);
  g.audio.setAmbienceMix({ drone: 0.5, wind: 0.2, rain: 0.02 });
  yield wait(0.5);
  g.ghost.spawn(g.player.x + 20, g.player.y + 130, 'hunt');
  g.ghost.targetAlpha = 0.95;
  g.ui.setBars(1);
  yield wait(0.6);
  g.player.frozen = false;
  g.player.battery = 0.18;
  yield g.say('結衣', '……！', 'fear');
  g.audio.whisper(-0.5);
  g.chaseUntil = () => g.room.id !== 'basement';
  g.ui.prompt('にげろ！　階段まで');
  g.addFear(0.5);
  g.audio.heartbeat(0.3);
  yield until(() => g.room.id !== 'basement');
  g.ui.prompt(null);
  g.ui.setBars(0);
  yield* ending(g);
}

// -------------------------------------------------------------------- 結末
function* ending(g) {
  g.player.frozen = true;
  g.ghost.vanish();
  g.audio.setAmbienceMix({ drone: 0.1, wind: 0.3, rain: 0.32 });
  g.particles.rainAmount = 0.9;
  g.sfx.fadeTo(0.72, 1.2);
  yield wait(1.4);
  g.ui.chapter('三　　外');
  yield wait(2.6);
  yield g.mono('……外に、出ていた。', 'base');
  yield wait(0.5);
  yield g.mono('雨は、まだ降っている。', 'base');
  yield wait(0.6);
  g.sfx.fadeTo(0.25, 1.6);
  yield g.say('結衣', '……わたし、*一人*で戻ってきちゃった。', 'look');
  yield wait(0.8);
  yield g.mono('家の二階の窓に、明かりがついている。', 'base');
  yield wait(0.6);
  yield g.mono('……そこに、*わたし*が立っている。', 'fear');
  g.audio.sting(0.9);
  g.sfx.flash(0.35, 2);
  yield wait(1.2);
  g.ui.chapter('　　　　　了');
  yield wait(3.4);
  g.sfx.fadeTo(1, 2.2);
  yield wait(2.6);
  g.restart();
}

export { wait, until };
