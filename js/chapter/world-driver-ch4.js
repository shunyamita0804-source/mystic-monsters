// =========================================================
// 本編の Chapter 4「灼熱の火山」＝1枚の世界のボード（A／B／C）の進行 `MMWD4`（2026-10-19。ユーザー承認の次便一括指示・第3工程）
//
//  道：js/proto/ch4-routes.js（MMRF_CH4＝A 主登山道 320・B 溶岩渓谷 301・C 外輪山周遊 294 地点。tools/ch4/build_ch4_routes.py が spec_*.json から作る＝手で書き換えない）。
//    設計は docs/ch4/DESIGN.md・RESULTS.md・graph_*.json。描画は js/proto/ch4-world.js（MMRF_VOLC＝正式素材 assets/fields/ch4/art_1019/）。
//  進み方・40ターン・サイコロ 1〜6・空腹・食事・バトル（野生・レア・ライバルは強制）・固定報酬の中身は Chapter 1〜3 と同じ（js/chapter/world-driver.js の make）。成長量は Chapter 4 の表。
//  ルート：新しい Chapter 4 の出発で 0〜999 の整数を1回引き、0〜333＝A（33.4%）・334〜666＝B（33.3%）・667〜999＝C（33.3%）。m.raise.field.route に保存
//    （再開・読み込み・再表示では決め直さない）。プレイヤーは選ばない（選択の画面は無い）。確認用（QA）の固定だけ ?ch4route=A|B|C・window.MM_CH4ROUTE。
//  旧 Chapter 4 のセーブ：その個体が旧ボード（phase9 の火山の道・20ターン）の途中なら、その育成の終わりまで旧ボードのまま（巻き戻さない・消さない）＝handles が false。
//    出発の時点で旧ボードの途中でない個体はすべて新しい盤（旧ボードの 20ターンの道は新しく始まらない）。
//  出来事：Chapter 1 の出来事の表（挿絵つき）。「草原」の言葉だけ火山に合わせる。フィナの一言：チュートリアル（このセーブで1回）＋Chapter 4 の景色の一言（仮案）。
//  自動テスト：window.MM_QA_OLD_CH4 のときは登録しない（旧 Chapter 4 を前提にした実ブラウザテスト用。tests/e2e/harness.mjs の既定。open({ worldCh4:true }) で新しい盤）
// =========================================================
(function (root) {
  'use strict';
  if (!root.MMWD_MAKE) return;
  const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  const routeKey = (v) => (v === 'B' || v === 'C' ? v : 'A');
  /** 0〜999 の整数 → ルート（A 334・B 333・C 333）。純粋な関数（テスト用に公開） */
  const routeOfInt = (n) => (n < 334 ? 'A' : n < 667 ? 'B' : 'C');
  const drawRoute = (rnd) => routeOfInt(Math.min(999, Math.max(0, Math.floor(rnd() * 1000))));
  /** 旧 Chapter 4 の盤の途中（新しい盤を持たない・Chapter 4 の盤の上） */
  const oldBoard = (m) => !!(m && isObj(m.raise) && m.raise.ch === 4 && (m.raise.state === 'board' || m.raise.state === 'BOARD') && !(isObj(m.raise.field) && m.raise.field.world === 1 && m.raise.field.chapterId === 4));
  const dataOf = (k) => (root.MMRF_CH4 && root.MMRF_CH4[routeKey(k)]) || null;
  const VOLCWORD = (t) => String(t).replace(/草原/g, '火山の道');
  const pool = () => { try { const c = root.MMCH && root.MMCH.getConfig(1); if (c && Array.isArray(c.eventPool)) return c.eventPool.map((e) => (/草原/.test(JSON.stringify(e)) ? JSON.parse(VOLCWORD(JSON.stringify(e))) : e)); } catch (e) {} return null; };
  const L = (expression, text) => ({ expression, text });
  const base = () => (root.MMWD && root.MMWD.STORY ? root.MMWD.STORY.filter((e) => e.scope === 'save') : []);
  // Chapter 4 の景色の一言（仮案＝ユーザーの承認前）。夕暮れの麓 → 薄暮の斜面 → 夜の火口縁
  //  条件は既存の pass（今回の移動で通った地点・区間）だけ＝区域（art.zoneOf）・ライバルの手前の区間は3ルートの道のデータから集める（ルートごとに区間 ID が違う＝和集合）
  const segsWhere = (fn) => { const out = new Set(); for (const k of ['A', 'B', 'C']) { const d = dataOf(k); if (!d) continue; for (const [sid, s] of Object.entries(d.segments)) if (fn(sid, s, d)) out.add(sid); } return [...out]; };
  const zoneSegs = (zs) => segsWhere((sid, s, d) => zs.includes((d.art.zoneOf || {})[sid]));
  const rivalSegs = () => segsWhere((sid, s) => s[1] === 'RIVAL');
  const VOLCLINES = [
    { id: 'c4_start', trigger: 'start', lines: [L('happy', '空が夕焼け色…！ あの火山のてっぺんに、最後の会場があるんだね。'), L('guide', '登るほど夜になっていくよ。足もとに気をつけて進もう。')] },
    { id: 'c4_twilight', trigger: 'land', priority: 11, when: { pass: zoneSegs(['slope_twilight', 'gorge_twilight']) }, lines: [L('surprised', '日が沈んできた…。溶岩の明かりで道が赤く光ってるね。')] },
    { id: 'c4_night', trigger: 'land', priority: 12, when: { pass: zoneSegs(['rim_night']) }, lines: [L('smile', 'すっかり夜だね。火口の光と星がきれい…！ 会場はもうすぐだよ。')] },
    { id: 'c4_rival_before', trigger: 'land', priority: 20, when: { pass: rivalSegs(), notNode: ['RIVAL'] }, lines: [L('serious', 'この先に誰かいる…。リュウかな？')] },
    { id: 'c4_tired', trigger: 'land', priority: 5, when: { fatigueMin: 80 }, lines: [L('worried', 'だいぶお腹がすいてきたみたい。何か食べさせるか、休もうね。')] },
  ];
  const linesBy = () => { const out = {}; for (const k of ['A', 'B', 'C']) { const d = dataOf(k), pl = (d && d.places && d.places.CHALLENGE) || '火の神殿の門';
    out[k] = { tut_challenge_w: [L('guide', `この先は${pl}だよ。サイコロで5か6が出れば、近道へ進めるんだ。`), L('normal', '失敗しても、遠回りの道で先へ進めるから安心してね。')] }; } return out; };
  const qaOff = () => !!root.MM_QA_OLD_CH4;
  const W = root.MMWD_MAKE({
    ch: 4, dataOf, pool, story: base().concat(VOLCLINES), storyLinesBy: linesBy(), forceVar: 'MM_CH4ROUTE', forceParam: 'ch4route', qaOld: 'MM_QA_OLD_CH4', visual: 'V',
    drawRoute, ensureRoute: (f) => routeKey(f && f.route),
    handles: (key, m) => key === 4 && !qaOff() && !oldBoard(m),
    routeName: (seg, k, d) => (d && d.names && d.names[seg]) || (/^D_/.test(seg) ? '寄り道' : 'このまま進む'),
    placeOf: (id, k, d) => (d && d.places && d.places[id]) || (root.MMWD && root.MMWD.PLACE && root.MMWD.PLACE[id]) || null,
    rewardTitle: (id, k, def, d) => (d && d.rewardTitles && d.rewardTitles[id]) || def,
  });
  root.MMWD4 = Object.freeze(Object.assign({}, W, { oldBoard, routeOfInt, drawRoute }));
})(typeof window !== 'undefined' ? window : globalThis);
