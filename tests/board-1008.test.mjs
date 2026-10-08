// =========================================================
// Chapter 1 Pattern A 正式ボード（2026-10-08）：完成背景14枚・道路中央ライン・固定サイズのマス・背景の受け渡し（handoff）・Scene14 の到着
//  BD-01〜07（画面は tests/qa-e2e-board-1008.test.mjs）。ゲームの中身（84マス・ノードID・種類・つながり・分岐）は 2026-10-06 から変えていないことを確かめる
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadEngine, lcg } from './chapter-sim.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const j = (o) => JSON.parse(JSON.stringify(o));
const sha = (b) => createHash('sha256').update(b).digest('hex');
function onCh1(seed = 7) { const E = loadEngine(); const { P7, P8 } = E; const S = P8.newSave(); S.m = P8.initIndividual(S, { sp: 0, name: 'テスト', age: 0, span: 30, h: 0, rk: 0, fa: 0, st: 0, last: null, li: 100, po: 100, in: 100, hi: 100, ev: 100, de: 100, sk: [0, 1, 2, 3], eq: [0, 1, 2, 3, -1, -1] }); P7.ensureProg(S.m); assert.equal(P8.depart(S, S.m, lcg(seed)).ok, true); return { ...E, S, m: S.m }; }

test('BD-01：ゲームの中身は 2026-10-06 と同じ（ノードID・マスの種類・つながり・スタート・ゴール・分かれ道3か所の選択肢）。変えたのは背景と置き方だけ', () => {
  const { CH } = loadEngine(), cfg = CH.getConfig(1), g = CH.buildGraph(cfg);
  const rows = Object.keys(g.nodes).sort().map((id) => [id, g.nodes[id].kind, g.nodes[id].tile || null, g.nodes[id].branch, g.conn[id] || []]);
  const s = JSON.stringify({ rows, start: g.start, goal: g.goal, ba: g.branchAt, br: cfg.branches.map((b) => [b.at, b.options.map((o) => [o.id, o.to])]) });
  assert.equal(sha(s), 'c0f4804b09d4ba7fa75da621729a75967c1feaf479b928154885b57873f02d57', '2026-10-06 のグラフ（84マス＋スタート）と同じ');
  assert.deepEqual(g.routes.map((r) => r.seq.length - 1), Array(8).fill(64), 'どの道でも 64歩');
  assert.deepEqual(CH.rulesOf(cfg).turnLimit, 45);
});

test('BD-02：14 の Scene 定義：完成背景（元の JPEG は original/ に無加工で保存・00 は美術マスターでゲームに出さない）・道路中央ライン・enter／playable／handoff・視線誘導・14＝共通 Scene', () => {
  const { CH } = loadEngine(), cfg = CH.getConfig(1), D = 'assets/fields/ch1a/formal_1008/';
  const readme = rd(D + 'README.md');
  for (let i = 0; i <= 14; i++) {
    const k = String(i).padStart(2, '0'), f = i === 0 ? '00_chapter1A_master.jpeg' : i === 14 ? '14_scene14_common_arena_approach.jpeg' : `${k}_scene${k}.jpeg`, b = readFileSync(path.join(ROOT, D, 'original', f));
    assert.ok(readme.includes(sha(b)), `${f}：README の sha256`);
  }
  assert.ok(!cfg.fieldScenes.some((s) => /00_chapter1A_master/.test(s.bg)) && !/00_chapter1A_master/.test(rd('index.html')), '00 はゲームに出さない');
  for (const s of cfg.fieldScenes) {
    assert.ok(existsSync(path.join(ROOT, s.bg)), s.bg); assert.equal(readFileSync(path.join(ROOT, s.bg)).toString('ascii', 8, 12), 'WEBP');
    const P = s.play; assert.ok(P.enter > P.playable[0] && P.playable[0] > P.playable[1] && P.playable[1] > P.handoff, `${s.key}：enter → playable → handoff`);
    assert.ok(P.playable[1] >= 0.46, `${s.key}：画像の奥まで使い切らない（${P.playable[1]}）`);
    for (const y of [P.enter, ...P.playable, P.handoff]) { const r = CH.roadAt(s, y); assert.ok(r && r.half > 0.12 && r.x > 0.3 && r.x < 0.75, `${s.key}：y ${y} は道の上`); }
    if (s.cue) assert.ok(s.cue.mix > 0 && s.cue.mix <= 0.25, `${s.key}：視線誘導は控えめ`);
  }
  assert.ok(cfg.fieldScenes.filter((s) => s.cue).length <= 7, '視線誘導は意味のある所だけ（毎 Scene ではない）');
  assert.equal(cfg.fieldScenes[13].common, 'arena_approach'); assert.equal(cfg.arrival.bg, cfg.fieldScenes[13].bg, '到着は 14 の広場の全景へ引く');
});

test('BD-03：マスとモンスターの止まる位置は道路中央ライン（左右の道はその ± 0.36×半幅）。1本の道が2つの背景にまたがってもノードID は同じ（key・idOffset）', () => {
  const { CH } = loadEngine(), cfg = CH.getConfig(1), g = CH.buildGraph(cfg);
  for (const n of Object.values(g.nodes)) {
    const sc = cfg.fieldScenes.find((s) => s.id === n.field), r = CH.roadAt(sc, n.y), lane = (cfg.paths.find((p) => (p.key || p.id) === n.path) || {}).lane || 0;
    assert.ok(Math.abs(n.x - (r.x + lane * 0.36 * r.half)) < 0.002, `${n.id}：道路中央ライン`); assert.equal(n.mx, n.x, `${n.id}：止まる位置＝マスの中心`); assert.equal(n.my, n.y);
  }
  assert.deepEqual(['p1_3', 'p1_4', 'p10_2', 'p10_3'].map((id) => g.nodes[id].field), [1, 2, 9, 10], 'p1_・p10_ は2つの背景にまたがる');
  assert.deepEqual(g.conn.p1_3, ['p1_4']); assert.deepEqual(g.conn.p10_2, ['p10_3']);
  assert.deepEqual(CH.routeBetween(g, 'p1_3', 'p1_4'), [], '背景の境目は画面側の受け渡し（handoff）');
  // 従来の config（key・idOffset なし）は今までどおり
  assert.equal(CH.buildGraph(CH.getConfig(2)).start.endsWith('0'), true);
});

test('BD-04：背景の切り替えは見せ方だけ＝背景をまたぐ1ターンでも、ターン・疲れ・停止地点の効果は1回ずつ。途中のセーブ（旧配置の途中を含む）は同じノードから続き', () => {
  const E = onCh1(); const { P8, S, m, CH } = E, A = m.raise.field.nodeAssignments;
  m.raise.node = 'p1_2'; A.p1_5 = { t: 'stat', k: 'po' }; const po = m.po, used = m.raise.turnsUsed;
  P8.roll(S, m, () => 0.9); const path = []; while (m.raise.pend && m.raise.pend.stage === 'move') { const s = P8.step(S, m); path.push(s.node); }
  assert.deepEqual(path, ['p1_3', 'p1_4', 'p1_5'], '01 → 02 をまたいで3歩'); assert.equal(m.raise.turnsUsed, used + 1, 'ターンは1回');
  const r = P8.resolveLanding(S, m, lcg(1)); assert.equal(r.fx.kind, 'chstat'); assert.ok(m.po > po); const po2 = m.po;
  assert.equal(m.raise.pend, null, '停止地点の処理は1回で終わる'); assert.equal(m.po, po2);
  for (const id of ['p1_5', 'p7_2', 'p10_4', 'p14_2']) { const S2 = P8.migrateSave(j({ ...S, m: { ...j(m), raise: { ...j(m.raise), node: id } } })); assert.equal(S2.m.raise.node, id, `${id}：読み込んでも同じノード`); assert.equal(CH.graphFor(S2.m).nodes[id].field, CH.graphFor(m).nodes[id].field); }
});

test('BD-05：マスの見た目の大きさは全背景共通の token（手前でも奥でも同じ）＝CSS の --inv でカメラの拡大を打ち消す（transform だけ）', () => {
  const FV = rd('js/chapter/field-view.js'), HTML = rd('index.html'), { CH } = loadEngine(), cfg = CH.getConfig(1);
  assert.deepEqual({ ...cfg.tileUI.fixedSize }, { vw: 0.18, min: 58, max: 78, aspect: 0.78 });
  assert.match(FV, /cam\.style\.setProperty\('--inv', \(1 \/ S\)\.toFixed\(4\)\)/, 'camApply が毎フレーム --inv を更新');
  assert.match(FV, /const B = tok \? \{ w: tok, h: tok \* \(T\.fixedSize\.aspect \|\| 0\.78\) \} : discBox\(T, n, sc\)/, '小型の立体マスは token の大きさ（奥行きで変えない）');
  assert.match(HTML, /\.chf-tile\.disc\.fx\{transform:translate\(-50%,-42%\) scale\(var\(--inv,1\)\);transform-origin:50% 42%\}/, '止まる位置（マスの中心）は動かさずに大きさだけ打ち消す');
  assert.equal(CH.getConfig(2).tileUI, undefined, 'Chapter 2 は従来どおり');
});

test('BD-06：背景の受け渡し：handoff まで道路中央ラインに沿って歩く → 次の背景の画像をデコードしてから溶かす → enter から入口のマスへ。モンスターは前の背景と同じ画面の位置・大きさから始める（matchCut）。play の無い背景は従来どおり', () => {
  const FV = rd('js/chapter/field-view.js');
  const cf = FV.slice(FV.indexOf('async function crossField('), FV.indexOf('async function switchField('));
  assert.match(cf, /roadSpan\(V\.sc, from\.y, V\.sc\.play\.handoff, laneRatio\(V\.sc, from\)\)/, 'handoff まで道路中央ラインに沿う（左右の道は同じ割合）');
  assert.ok(cf.indexOf('await dec;') > cf.indexOf('moveAlong(H0') && cf.indexOf('await dec;') < cf.indexOf('buildScene(m, fieldId, true, true)'), 'デコードを待ってから次の背景を作る（白・空の画面を見せない）');
  assert.match(cf, /roadSpan\(V\.sc, V\.sc\.play\.enter, n\.y, laneRatio\(V\.sc, n\)\)/, 'enter から入口のマスへ');
  assert.match(cf, /matchCut\(nm, oldPos, ems\)/); assert.doesNotMatch(cf, /P8\(\)\.|MMCH\.(step|resolve)|doSave/, '切り替えの中で進行・保存をしない（見せ方だけ）');
  assert.match(FV, /function matchCut\(nm, oldPos, ms\) \{\n    if \(!nm \|\| !oldPos \|\| V\.calm/, '視差を減らす設定では動かさない');
});

test('BD-07：開発用の表示（?chdebug=1 のときだけ。本番の URL では出ない）：道路中央ライン・道の端・enter／playable／handoff・マスの ID と番号・今の背景・カメラの注視点', () => {
  const FV = rd('js/chapter/field-view.js');
  assert.match(FV, /const debug = \(\) => \{ try \{ return !!root\.MM_CHDEBUG \|\| \/\(\^\|\[\?&\]\)chdebug=1\(&\|\$\)\/\.test\(root\.location\.search\); \} catch \(e\) \{ return false; \} \};/);
  for (const k of ['class="ctr"', 'class="edge"', "hl(P.enter, 'enter'", "'handoff', 'handoff'", 'chf-dbgcam', 'chf-dbgsc']) assert.ok(FV.includes(k), k);
  assert.match(FV, /const dbg = debug\(\) \?/, 'debug() が偽なら何も出さない'); assert.match(FV, /if \(V\.dbg\) dbgCam\(/);
});
