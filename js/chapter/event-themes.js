// =========================================================
// Chapter ごとの出来事の見せ方 `MMEVTH`（2026-10-20 通し試遊の品質改善・ユーザー指示「各章で同じイベント文章と背景の使い回しにしない」）
//
//  出来事の効果（handler・params・選択肢の効果と desc）は Chapter 1 の表（js/chapter/configs/ch1a.js の eventPool）のまま＝数値は変えない。
//  この表は「題・本文・フィナの一言・選択肢の文」だけを Chapter の舞台（3＝天空・浮遊神殿／4＝火山・溶岩）に合わせて差し替える。文は【仮案】（ユーザーの承認前）。
//  新しい人物・事件・設定は足さない（既存の NPC・世界観の言葉だけ）。
//
//  背景（挿絵）：出来事の背景は「Chapter × 出来事 → 背景キー → 絵」で引く（bgKey・image）。
//   IMAGES（背景キー → 絵）に専用の絵が登録されていればそれ（後日 Chapter ごとに制作予定＝今は Chapter 1 の24枚だけ）。
//   無ければ Chapter の仮の背景（CH_BG＝その Chapter の野外のバトル背景＝正式素材 assets/battle/field_1012/）。Chapter 1 の草原の挿絵を空・海・火山で出さない。
//   差し替えは IMAGES に1行（背景キー: 絵のパス）。必要な絵の一覧は docs/fullplay_1020/REPORT.md
// =========================================================
(function (root) {
  'use strict';
  const fz = Object.freeze;
  const L = (expression, text) => ({ expression, text });
  /** Chapter の仮の背景（その Chapter の野外のバトル背景） */
  const CH_BG = fz({ 1: null, 2: './assets/battle/field_1012/ch2_coast.webp', 3: './assets/battle/field_1012/ch3_sky.webp', 4: './assets/battle/field_1012/ch4_volcano.webp' });
  /** 背景キー（`ch{N}:{出来事 ID}`）→ 専用の絵。未制作は登録しない（仮の背景になる） */
  const IMAGES = fz({});
  // ---- Chapter 3「天空の浮島」の見せ方（仮案） ----
  const SKY = fz({
    shade: { text: '雲の陰でひと休みして、持っていた木の実を少しかじった。' },
    break: { text: '浮島の岩棚で小休憩をとって、軽く腹ごしらえをした。' },
    spring: { text: '浮島の泉で水を飲み、ほとりの果実を少し食べた。' },
    herb: { text: '雲の上にしか生えない、珍しい草を見つけた！' },
    trip: { text: '浮き石につまずいて転んでしまった…' },
    coin: { text: '空の橋のすき間でお金を見つけた！' },
    tailwind: { title: '空の追い風', text: '空を渡る追い風に乗って、軽やかに動けた。', lines: [L('happy', 'わっ、雲の上の風！'), L('guide', 'こういう時は、力を抜いて風に合わせると動きやすいよ。')] },
    spring_water: { title: '雲の滴の湧き水', text: '雲から落ちる澄んだ滴を飲んで、お腹が少し落ち着いた。', lines: [L('smile', '雲の滴がたまってる。少し飲んでいこうか。'), L('happy', 'うん、お腹も少し落ち着いたみたい。')] },
    stone_tablet: { title: '浮遊神殿の石碑', text: '浮遊神殿のかけらの石碑をじっくり眺めた。', lines: [L('normal', '空の神殿の石碑だね。文字はほとんど消えてるけど……'), L('guide', '昔の旅人が、空の道の目印にしてたのかも。')] },
    break_with_fina: { text: '雲を眺めながらフィナと休んで、おやつを少し分けあった。' },
    sudden_rain: { title: '空の通り雨', text: '雲の上で通り雨に降られた。', lines: [L('surprised', 'うわ、雲から降ってきた！'), L('troubled', 'すぐ止みそうだけど……どうする？')],
      choices: { shelter: { text: '浮島の岩陰で雨宿りをして、そのあいだに軽く腹ごしらえをした。' }, go: { text: '雨の中、空の橋をそのまま進んだ。' } } },
    beast_tracks: { title: '大きな羽根の跡', text: '橋に落ちた大きな羽根の跡に気をつけながら進んだ。', lines: [L('serious', '見て、この羽根。まだ新しい。'), L('guide', '周りをよく見ながら進もう。')] },
    distant_cry: { title: '雲に響く鳴き声', text: '雲の向こうから響く鳴き声に耳を澄ませた。' },
    wild_flowers: { title: '浮島の花畑', text: '浮島の花畑のそばで元気をもらった。' },
    traveler_trace: { title: '古い旅人の痕跡', text: '空の橋の上で旅人の休んだ跡を見つけ、残っていた木の実を少し食べた。' },
    small_animal: { title: '小さな鳥に導かれる', text: '小さな鳥について、足元に気をつけて進んだ。' },
    old_grounds: { title: '空の訓練跡', text: '浮島の古い訓練場を見つけた。', lines: [L('guide', 'ここ、昔の訓練場みたい。風が強いね。'), L('normal', '少し使ってみる？ それとも動きを確かめるだけにする？')],
      choices: { train: { text: '浮島の訓練跡で少し鍛えた。' }, check: { text: '風の中で動きを確かめた。' } } },
    small_shrine: { title: '空の祠', text: '浮島の小さな祠のそばの湧き水を飲んで、お腹が少し落ち着いた。', lines: [L('normal', '浮島の小さな祠だね。そばに湧き水があるよ。'), L('smile', '少しだけ、ここで落ち着いていこう。')] },
  });
  // ---- Chapter 4「灼熱の火山」の見せ方（仮案） ----
  const VOLC = fz({
    shade: { text: '熱い風を避けて岩陰でひと休みし、持っていた木の実を少しかじった。' },
    break: { text: '火山の道のそばで小休憩をとって、軽く腹ごしらえをした。' },
    spring: { text: '冷たい湧き水の泉で水を飲み、持っていた果実を少し食べた。' },
    herb: { text: '溶岩のそばにしか生えない、珍しい草を見つけた！' },
    trip: { text: '溶岩の石につまずいて転んでしまった…' },
    coin: { text: '黒い岩の道端でお金を見つけた！' },
    tailwind: { title: '火口からの上昇気流', text: '火口から吹き上がる風に乗って、軽やかに動けた。', lines: [L('happy', 'わっ、あったかい風！'), L('guide', 'こういう時は、力を抜いて風に合わせると動きやすいよ。')] },
    spring_water: { title: '岩の割れ目の湧き水', text: '岩の割れ目からしみ出す冷たい水を飲んで、お腹が少し落ち着いた。', lines: [L('smile', 'こんな所に冷たい水が！ 少し飲んでいこうか。'), L('happy', 'うん、お腹も少し落ち着いたみたい。')] },
    stone_tablet: { title: '黒曜石の石碑', text: '黒曜石の石碑をじっくり眺めた。', lines: [L('normal', '黒くて光る石碑だね。文字はほとんど消えてるけど……'), L('guide', '昔の旅人が、火山の道の目印にしてたのかも。')] },
    break_with_fina: { text: 'フィナと岩陰で休んで、おやつを少し分けあった。' },
    sudden_rain: { title: '突然の降灰', text: '火山灰が降ってきた。', lines: [L('surprised', 'うわ、灰が降ってきた！'), L('troubled', 'すぐ止みそうだけど……どうする？')],
      choices: { shelter: { label: '岩陰でやり過ごす', text: '岩陰で灰をやり過ごし、そのあいだに軽く腹ごしらえをした。' }, go: { text: '灰の中をそのまま進んだ。' } } },
    beast_tracks: { title: '焼けた足跡', text: '岩に残る焼けた足跡に気をつけながら進んだ。', lines: [L('serious', '見て、この足跡。岩が焦げてる。'), L('guide', '周りをよく見ながら進もう。')] },
    distant_cry: { title: '火口に響く鳴き声', text: '火口に響く鳴き声に耳を澄ませた。' },
    wild_flowers: { title: '溶岩のすき間の花', text: '溶岩のすき間に咲く花のそばで元気をもらった。' },
    traveler_trace: { title: '古い旅人の痕跡', text: '火山の道で旅人の休んだ跡を見つけ、残っていた木の実を少し食べた。' },
    small_animal: { text: '小さな生き物について、熱い岩を避けながら進んだ。' },
    wind_cry: { text: '熱い風に乗って鳴き声が聞こえた。' },
    old_grounds: { title: '火の訓練跡', text: '溶岩のそばの古い訓練場を見つけた。', lines: [L('guide', 'ここ、昔の訓練場みたい。すごく暑いね。'), L('normal', '少し使ってみる？ それとも動きを確かめるだけにする？')],
      choices: { train: { text: '火の訓練跡で少し鍛えた。' }, check: { text: '熱気の中で動きを確かめた。' } } },
    small_shrine: { title: '火山の祠', text: '火山の小さな祠のそばの湧き水を飲んで、お腹が少し落ち着いた。', lines: [L('normal', '火山の小さな祠だね。そばに湧き水があるよ。'), L('smile', '少しだけ、ここで落ち着いていこう。')] },
  });
  const THEMES = fz({ 3: SKY, 4: VOLC });
  const bgKey = (ch, id) => `ch${ch}:${id}`;
  /** その Chapter の出来事の背景：専用の絵 → Chapter 1 は元の挿絵 → Chapter の仮の背景 */
  function image(ch, e) { const k = bgKey(ch, e && e.id); if (IMAGES[k]) return IMAGES[k]; return ch === 1 ? (e && e.image) || null : CH_BG[ch] || null; }
  /** 出来事の表を Chapter の見せ方へ（効果は変えない）。pool＝元の表（変えない＝写しを返す） */
  function themed(ch, pool) {
    if (!Array.isArray(pool)) return pool;
    const T = THEMES[ch] || {};
    return pool.map((e) => {
      const o = T[e.id], out = Object.assign({}, e, { bgKey: bgKey(ch, e.id), image: image(ch, e) });
      if (!o) return out;
      if (o.title) out.title = o.title;
      if (o.text) out.text = o.text;
      if (o.lines) out.lines = o.lines.map((l) => Object.assign({}, l));
      if (o.choices && Array.isArray(e.choices)) out.choices = e.choices.map((c) => (o.choices[c.id] ? Object.assign({}, c, o.choices[c.id]) : c));
      return out;
    });
  }
  root.MMEVTH = fz({ CH_BG, IMAGES, THEMES, bgKey, image, themed });
})(typeof window !== 'undefined' ? window : globalThis);
