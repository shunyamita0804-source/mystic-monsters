// =========================================================
// 本編の Chapter 3「天空の浮島」＝1枚の世界のボード（A／B／C）の進行 `MMWD3`（2026-10-18）
//
//  道：js/proto/ch3-routes.js（MMRF_CH3＝A 白亜の大橋・B 雲海の螺旋・C 風の浮島めぐり。各 299地点・tools/ch3/build_ch3_routes.py が作る）。
//    Chapter 1 と同じ 42区間の部品（RoadFirst の文法：自由な分かれ道・運命の分かれ道＝奇数左／偶数右・封印の門＝5／6・寄り道の宝・隠れ家・ライバル必通）を空の世界の形にしたもの。
//  進み方・40ターン・サイコロ 1〜6・空腹・食事・バトル・固定報酬の中身は Chapter 1 と同じ（js/chapter/world-driver.js の make）。成長量は Chapter 3 の表（GROWTH_GAIN_BY_CH[3]）。
//  ルート：新しい Chapter 3 の出発で A／B／C を各 1/3 で抽選して m.raise.field.route に保存（再開・読み込みでは決め直さない）。確認用 ?ch3route=A|B|C・window.MM_CH3ROUTE。
//  旧 Chapter 3 のセーブ：その個体が旧ボード（phase9 の空の道）の途中（ch 3・盤の上・field が無い／world でない）なら、その育成の終わりまで旧ボードのまま＝handles が false。
//  出来事：Chapter 1 の出来事の表（挿絵つき）。「草原」の言葉だけ空に合わせる。フィナの一言：チュートリアル（このセーブで1回）＋Chapter 3 の景色の一言。
//  自動テスト：window.MM_QA_OLD_CH3 のときは登録しない（旧 Chapter 3 を前提にした実ブラウザテスト用。tests/e2e/harness.mjs の既定。open({ worldCh3:true }) で新しい盤）
// =========================================================
(function (root) {
  'use strict';
  if (!root.MMWD_MAKE) return;
  const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  const routeKey = (v) => (v === 'B' || v === 'C' ? v : 'A');
  /** 旧 Chapter 3 の盤の途中（新しい盤を持たない・Chapter 3 の盤の上） */
  const oldBoard = (m) => !!(m && isObj(m.raise) && m.raise.ch === 3 && (m.raise.state === 'board' || m.raise.state === 'BOARD') && !(isObj(m.raise.field) && m.raise.field.world === 1 && m.raise.field.chapterId === 3));
  const dataOf = (k) => (root.MMRF_CH3 && root.MMRF_CH3[routeKey(k)]) || null;
  const SKYWORD = (t) => String(t).replace(/草原/g, '雲海');
  // 2026-10-20：出来事の題・本文・背景は Chapter の舞台に合わせる（js/chapter/event-themes.js の MMEVTH＝効果は変えない）
  const themed = (p) => (p && root.MMEVTH ? root.MMEVTH.themed(3, p) : p);
  const pool = () => themed(pool0());
  const pool0 = () => { try { const c = root.MMCH && root.MMCH.getConfig(1); if (c && Array.isArray(c.eventPool)) return c.eventPool.map((e) => (e.id === 'tailwind' ? JSON.parse(SKYWORD(JSON.stringify(e))) : e)); } catch (e) {} return null; };
  const L = (expression, text, speaker) => (speaker ? { speaker, expression: expression || 'normal', text } : { expression, text });
  const base = () => (root.MMWD && root.MMWD.STORY ? root.MMWD.STORY.filter((e) => e.scope === 'save') : []);
  // Chapter 3 の景色の一言（仮案＝ユーザーの承認前）。条件は Chapter 1 と同じ区間 ID
  const SKYLINES = [
    { id: 'c3_start', trigger: 'start', lines: [L('happy', 'わあ…雲の上だ！ 白い橋で浮島から浮島へ渡っていくんだね。'), L('guide', '橋の上も道と同じ。マスに止まれば、いつもどおり出来事が起きるよ。')] },
    { id: 'c3_bridge', trigger: 'land', priority: 12, when: { pass: ['EL01', 'ER01'] }, lines: [L('surprised', '下は一面の雲海…！ 落ちないように、ゆっくり進もう。')] },
    { id: 'c3_merge', trigger: 'land', priority: 11, when: { pass: ['P', 'C01'] }, lines: [L('smile', '大きな浮島に出たね。この先に空の門があるよ。')] },
    { id: 'c3_rival_before', trigger: 'land', priority: 20, when: { pass: ['C03', 'UPPER_GATE', 'C04'], notNode: ['RIVAL'] }, lines: [L('serious', '上の空門の先に誰かいる…。またリュウかな？')] },
    { id: 'c3_safe', trigger: 'land', priority: 12, when: { pass: ['LATE_SAFE'] }, lines: [L('smile', '雲海の尾根を渡る橋だね。風が気持ちいい！')] },
    { id: 'c3_statue', trigger: 'land', priority: 13, when: { pass: ['STATUE'] }, lines: [L('surprised', '青い結晶が光ってる…！ この浮島、なにか特別な力を感じる。')] },
    { id: 'c3_castle', trigger: 'land', priority: 14, when: { pass: ['LATE_L_DONE', 'LATE_R_DONE', 'FINAL', 'S_END'], notNode: ['GOAL'] }, lines: [L('happy', '天空闘技場が見えてきた！ あと少しだよ。')] },
    { id: 'c3_tired', trigger: 'land', priority: 5, when: { fatigueMin: 80 }, lines: [L('worried', 'だいぶお腹がすいてきたみたい。何か食べさせるか、休もうね。')] },
  ];
  const linesBy = () => { const out = {}; for (const k of ['A', 'B', 'C']) out[k] = { tut_challenge_w: [L('guide', 'この先には風の神殿の門があるよ。サイコロで5か6が出れば、門が開いて近道へ進めるんだ。'), L('normal', '失敗しても、遠回りの橋で先へ進めるから安心してね。')] }; return out; };
  const qaOff = () => !!root.MM_QA_OLD_CH3;
  const W = root.MMWD_MAKE({
    ch: 3, dataOf, pool, story: base().concat(SKYLINES), storyLinesBy: linesBy(), forceVar: 'MM_CH3ROUTE', forceParam: 'ch3route', qaOld: 'MM_QA_OLD_CH3', visual: 'S',
    ensureRoute: (f) => routeKey(f && f.route),
    handles: (key, m) => key === 3 && !qaOff() && !oldBoard(m),
    routeName: (seg, k, d) => (d && d.names && d.names[seg]) || (/^D_/.test(seg) ? '寄り道' : 'このまま進む'),
    placeOf: (id, k, d) => (d && d.places && d.places[id]) || (root.MMWD && root.MMWD.PLACE && root.MMWD.PLACE[id]) || null,
    rewardTitle: (id, k, def, d) => (d && d.rewardTitles && d.rewardTitles[id]) || def,
  });
  root.MMWD3 = Object.freeze(Object.assign({}, W, { oldBoard }));
})(typeof window !== 'undefined' ? window : globalThis);
