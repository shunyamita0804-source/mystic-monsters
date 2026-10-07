// =========================================================
// Chapterフィールドエンジン（js/chapter/engine.js）と Chapter 1 Pattern A（js/chapter/configs/ch1a.js）、サイコロ（js/chapter/dice-renderer.js）
//  CH-ENGINE-01〜02・CH1-01〜27・DICE-01〜06・配置の制約・1000回のシミュレーション
//  2026-10-01：Chapter 1 は「リアル巨大ボード方式」（背景15枚＋周回・サイコロ 1〜6・30ターン・ライバルは強制停止）
//  実物の MMP7・MMP8（raising.js）・MMCH を Node で動かす（画面は tests/qa-e2e-chapter1.test.mjs）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadEngine, simulate, lcg } from './chapter-sim.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const j = (o) => JSON.parse(JSON.stringify(o));
const fixed = (...vals) => { let i = 0; return () => vals[Math.min(i++, vals.length - 1)]; };   // 決まった乱数列（最後の値を繰り返す）
const DIE = { 1: 0.05, 2: 0.2, 3: 0.4, 4: 0.55, 5: 0.75, 6: 0.95 };   // MMP7.rollDie(6, rnd)=1+floor(rnd*6)（Chapter 1 は 6面）
const DIE3 = { 1: 0.1, 2: 0.5, 3: 0.9 };   // MMP7.rollDie(3, rnd)（Chapter 2 は 1〜3。2026-10-01 夜）
function mon(P7, P8, S) { const m = P8.initIndividual(S, { sp: 0, name: 'テスト', age: 0, span: 30, h: 0, rk: 0, fa: 0, st: 0, last: null, li: 100, po: 100, in: 100, hi: 100, ev: 100, de: 100, sk: [0, 1, 2, 3], eq: [0, 1, 2, 3, -1, -1] }); P7.ensureProg(m); return m; }
/** 画面側（field-view.js）の純粋な関数（lookOf・tileKeyOf・tileSpriteOf）を Node で読む。DOM は使わない */
function loadView() { const E = loadEngine(); new Function('window', 'MMCH', rd('js/chapter/field-view.js'))(E.w, E.w.MMCH); return E.w.MMCHV; }
/** 空いた候補ノードをすべて能力マスにする（旧 passNormal の頃のテスト用。2026-10-02 の60マス再設計から通常マスも止まれるので、Chapter 1 では使わなくてよい） */
function fillSlots(E) { const g = E.CH.graphFor(E.m), A = E.m.raise.field.nodeAssignments; for (const id of g.order) if (g.nodes[id].kind === 'slot' && !A[id]) A[id] = { t: 'stat', k: 'li' }; return E; }
function onCh1(seed = 7) { const E = loadEngine(); const { P7, P8 } = E; const S = P8.newSave(); S.m = mon(P7, P8, S); assert.equal(P8.depart(S, S.m, lcg(seed)).ok, true); return { ...E, S, m: S.m }; }
/** 出目 v で1ターン（分岐があれば opt を選ぶ）。停止地点の処理まで */
function turn(E, v, opt, die = DIE3) {   // 2026-10-01 夜：Chapter 1・2 とも 1〜3
  const { P8, S, m } = E; const r = P8.roll(S, m, () => die[v]); assert.equal(r.ok, true, 'roll');
  const path = [];
  while (m.raise.pend && ['move', 'branch'].includes(m.raise.pend.stage)) {
    if (m.raise.pend.stage === 'branch') { const g = E.CH.graphFor(m), os = m.raise.pend.opts; P8.chooseBranch(S, m, os.find((o) => g.nodes[o] && g.nodes[o].branch === opt) || os.find((o) => o.startsWith(opt || 'a')) || os[0]); path.push(m.raise.node); continue; }   // opt：道の名前（forest／bridge）か、旧 Chapter の接頭辞
    const s = P8.step(S, m); if (s.node) path.push(s.node);
  }
  return path;
}
function finishTurnAnyway(E) { const { P8, S, m } = E; if (m.raise.pend && m.raise.pend.stage === 'resolve') { let x = P8.resolveLanding(S, m, lcg(1)); if (x.fx && x.fx.kind === 'choice') x = P8.resolveChoice(S, m, x.fx.options[0].id, lcg(1)); if (m.raise.pend && m.raise.pend.stage === 'battle') P8.skipBattleSquare(S, m); return x; } return null; }

test('CH-ENGINE-01：config からフィールド（正式背景14枚 ch1_bg_01〜14。共通 01〜05 → 分かれ道 C → 森 06〜07／大橋 08〜09 → 合流 10 → 14。03・11 の中に左右の分岐 A・B）・ノード・つながり・ルートを作る。公式マス84（2026-10-06・45ターン。スタートを含まない）。Chapter 1 は MMP8 のトラックとして登録される', () => {
  const { CH, P8 } = loadEngine(), cfg = CH.getConfig(1), g = CH.buildGraph(cfg);
  assert.equal(cfg.patternId, 'A'); assert.deepEqual(CH.patterns(1), ['A'], '今は Pattern A だけ（存在しない B・C はプレイヤーに出さない）');
  assert.equal(cfg.fieldScenes.length, 14, '進行する背景は 01〜14 の14枚（15 は到着イベント専用）'); assert.equal(new Set(cfg.fieldScenes.map((s) => s.bg)).size, 14, '背景はどれも1回だけ（背景は変えていない）');
  for (const [i, s] of cfg.fieldScenes.entries()) { const k = String(i + 1).padStart(2, '0'); assert.equal(s.bg, `./assets/fields/ch1a/final/field/ch1_bg_${k}.webp`); assert.equal(s.bgKey, k); assert.ok(existsSync(path.join(ROOT, s.bg)), s.bg); assert.deepEqual([s.w, s.h], [762, 1536]); assert.ok(s.road && s.road.center.length >= 6 && s.road.center.every((c) => c.length === 3), `${s.name}：道の中央線（点ごとの半幅つき）`); }
  assert.deepEqual(cfg.routes, { common: ['01', '02', '03', '04', '05'], forest: ['06', '07'], bridge: ['08', '09'], late: ['10', '11', '12', '13', '14'] });
  for (const s of cfg.fieldScenes) assert.equal(s.route, Object.keys(cfg.routes).find((r) => cfg.routes[r].includes(s.bgKey)));
  // マス数（2026-10-06）：背景ごとに違う。03・11 は左右の道（5＋5）・分かれ道・合流を含む。スタートを含まない合計＝84
  const want = { '01': 6, '02': 6, '03': 12, '04': 6, '05': 4, '06': 5, '07': 5, '08': 5, '09': 5, '10': 6, '11': 12, '12': 5, '13': 3, '14': 4 };
  assert.deepEqual(cfg.tilesPerBackground, want); assert.equal(Object.values(want).reduce((a, b) => a + b, 0), 84); assert.equal(cfg.totalTiles, 84);
  const L = CH.routeLengths(g); assert.deepEqual([L.min, L.max, L.nodes], [64, 64, 85], '1回の旅はどの道でも 64歩。ノード85＝公式マス84＋スタート');
  assert.equal(g.routes.length, 8, '分岐3か所 × 2 ＝ 8通り'); assert.deepEqual(g.branchAt, ['p3_0', 'p5_3', 'p11_0']);
  assert.deepEqual(cfg.branches.map((b) => [b.at, b.options.map((o) => [o.id, o.to, o.side, o.gate || null])]), [['p3_0', [['power', 'p3l_0', -1, null], ['mind', 'p3r_0', 1, null]]], ['p5_3', [['forest', 'p6_0', -1, 'gate_left'], ['bridge', 'p8_0', 1, 'gate_right']]], ['p11_0', [['guard', 'p11l_0', -1, null], ['swift', 'p11r_0', 1, null]]]]);
  for (const b of cfg.branches) for (const o of b.options) assert.ok(o.label && o.desc && !/暫定/.test(o.desc), `${o.id}：選ぶ画面の名前と説明`);
  assert.equal(g.start, 'p1_0'); assert.equal(g.goal, 'p14_3');
  // マスの座標（path.nodePts）：そのままノードの位置。道の安全域の中・手前から奥へ（y が小さくなる）。左右の道は道の中央より左／右
  for (const p of cfg.paths) {
    const sc = cfg.fieldScenes.find((s) => s.id === p.field); assert.equal(p.nodePts.length, p.n, `${p.id}：座標の数＝マス数`); assert.equal(p.tiles.length, p.n);
    for (let k = 0; k < p.n; k++) { const n = g.nodes[`${p.id}${k}`], r = CH.roadAt(sc, n.y); assert.deepEqual([n.x, n.y], p.nodePts[k]); assert.ok(n.mx >= r.safeLeft && n.mx <= r.safeRight, `${n.id} は道の安全域の中`); if (k) assert.ok(n.y < g.nodes[`${p.id}${k - 1}`].y && n.s > g.nodes[`${p.id}${k - 1}`].s, `${n.id}：奥へ進む`);
      if (/l_$/.test(p.id)) assert.ok(n.x < r.x, `${n.id}：左の道`); if (/r_$/.test(p.id)) assert.ok(n.x > r.x, `${n.id}：右の道`); }
    assert.ok(p.nodePts[0][1] >= 0.45 && p.nodePts[p.n - 1][1] >= 0.45, `${p.id}：道の最奥までは置かない`);
  }
  const fieldsOf = (rt) => rt.seq.map((id) => g.nodes[id].field).filter((v, i, a) => i === 0 || a[i - 1] !== v);
  assert.deepEqual([...new Set(g.routes.map((r) => fieldsOf(r).join(',')))], ['1,2,3,4,5,6,7,10,11,12,13,14', '1,2,3,4,5,8,9,10,11,12,13,14'], '森／大橋のどちらかを通り、10 で合流（A・B は同じ背景の中）');
  for (const n of Object.values(g.nodes)) { assert.ok(n.x >= 0 && n.x <= 1 && n.y >= 0 && n.y <= 1, `${n.id} は背景に対する割合`); assert.ok(n.d > 0 && n.d <= 1.3); }
  const kinds = {}; for (const n of Object.values(g.nodes)) if (n.kind !== 'slot' && n.kind !== 'normal') kinds[n.id] = n.kind;
  assert.deepEqual(kinds, { p1_0: 'start', p3_0: 'branch', p3m_0: 'merge', p5_0: 'rival', p5_3: 'branch', p10_0: 'merge', p11_0: 'branch', p11m_0: 'merge', p14_3: 'goal' }, '骨格：スタート・分かれ道3・合流3・ライバル（強制停止）・ゴール');
  assert.equal(g.nodes.p5_0.forceStop, true); assert.equal(P8.trackOf(1).nodes.p5_0.stop, true);   // ライバルは道中（p5_0）
  const R = CH.rulesOf(cfg);
  assert.deepEqual([R.diceSides, R.turnLimit, R.onTimeUp, !!R.passNormal], [3, 45, 'end', false], '1〜3・45ターン（2026-10-06）・間に合わなければ大会なしで終了・通常マスは止まれる'); assert.equal(Object.keys(cfg.dice.resultSprites).length, 6, '4〜6 の停止画像は残す');
  assert.deepEqual(R.growthGain, { A: 5, B: 4, C: 3, D: 2, E: 2 }, '2026-10-06：能力マスの上昇量（C +3。tests/chapter1-board-sim.mjs で比べて決めた）');
  assert.equal(cfg.arrival.bg, './assets/fields/ch1a/final/event/ch1_bg_15_event.webp'); assert.ok(existsSync(path.join(ROOT, cfg.arrival.bg)));
  assert.ok(!cfg.fieldScenes.some((s) => s.bg === cfg.arrival.bg), '15 はフィールドの背景ではない');
  assert.deepEqual(cfg.arrival.talk.map((l) => l.text), ['やっと着いたね、{name}さん！', 'ようこそ、大会会場へ！', 'さあ、参加する大会を選ぼう。']); assert.equal(cfg.arrival.lobby.bg, './assets/tournament/lobby/lobby_main.webp'); assert.ok(existsSync(path.join(ROOT, 'assets/tournament/lobby/lobby_main.webp')), 'ロビーの背景'); assert.equal(cfg.arrival.talk[0].npc, 'fina');
  const t = P8.trackOf(1); assert.equal(t.start, 'p1_0'); assert.equal(t.engine, '1:A'); assert.equal(P8.isPlayable(1), true);
  assert.equal(P8.trackOf(2).engine, '2:A', 'Chapter 2 もエンジン（ch2a.js）'); assert.equal(P8.trackOf(3).engine, undefined, 'Chapter 3〜4 は従来のマップのまま（config を登録するまで）');
});

test('CH1-37：公式84マスの内訳（2026-10-06。旧54）（スタートを含まない・すべての道を合わせた全体）：通常13・能力36（6能力×各6）・野生7・イベント10・宝7・休む3・ライバル1・分かれ道／合流6・ゴール1。分岐の道ごとに伸びる能力が違う。配置は固定（種類は config のとおり。seed で決めるのは中身だけ）', () => {
  const { CH } = loadEngine(), cfg = CH.getConfig(1), g = CH.buildGraph(cfg), C = CH.tileCensus(cfg);
  assert.equal(C.total, 84);
  assert.deepEqual(C.groups, { normal: 13, stat: 36, wild: 7, event: 10, treasure: 7, rest: 3, rival: 1, branchSpecial: 6, goal: 1 });
  assert.equal(Object.values(C.groups).reduce((a, b) => a + b, 0), 84);
  assert.deepEqual(C.stats, { li: 6, po: 6, in: 6, hi: 6, ev: 6, de: 6 });
  assert.deepEqual([C.byType.branch, C.byType.merge, C.byType.start], [3, 3, undefined], '分かれ道・合流は3つずつ。スタートは数えない');
  assert.deepEqual(CH.censusErrors(cfg), []); assert.equal(cfg.layoutRules.fixed, true);
  // 分岐の道の傾向（道の上のマスの種類＝選ぶ画面の説明と一致）
  const lane = (id) => cfg.paths.find((p) => p.id === id).tiles, statsOf = (ts) => [...new Set(ts.filter((t) => t.startsWith('stat_')))].sort();
  assert.deepEqual(statsOf(lane('p3l_')), ['stat_power', 'stat_toughness'], 'A 左＝ちから・丈夫さ'); assert.deepEqual(statsOf(lane('p3r_')), ['stat_accuracy', 'stat_intelligence'], 'A 右＝かしこさ・命中');
  assert.deepEqual(statsOf(lane('p11l_')), ['stat_life', 'stat_toughness'], 'B 左＝ライフ・丈夫さ'); assert.deepEqual(statsOf(lane('p11r_')), ['stat_accuracy', 'stat_evasion'], 'B 右＝回避・命中');
  const both = (a, b) => [...lane(a), ...lane(b)], cnt = (ts, t) => ts.filter((x) => x === t).length;
  assert.ok(cnt(both('p6_', 'p7_'), 'rest') >= 1 && cnt(both('p6_', 'p7_'), 'wild') === 0, 'C 森＝安全（休む・野生なし）'); assert.ok(cnt(both('p8_', 'p9_'), 'wild') >= 3 && cnt(both('p8_', 'p9_'), 'treasure') > cnt(both('p6_', 'p7_'), 'treasure'), 'C 大橋＝挑戦（野生と宝箱が多い）');
  // 配置の規則：同じ能力が続かない・野生が隣り合わない・序盤（最初の10マス）に野生なし・休むは序盤に固まらない・ゴールは最後・ライバルは道中
  for (const rt of g.routes) {
    const f = rt.seq.slice(1).map((id) => (CH.SKELETON.includes(g.nodes[id].kind) ? g.nodes[id].kind : g.nodes[id].tile));
    for (let i = 1; i < f.length; i++) { if (f[i].startsWith('stat_')) assert.notEqual(f[i], f[i - 1], `${rt.branch}：同じ能力が続かない（${i}）`); if (f[i] === 'wild') assert.notEqual(f[i - 1], 'wild', `${rt.branch}：野生が隣り合わない`); if (f[i] === 'treasure') assert.notEqual(f[i - 1], 'treasure'); }
    assert.ok(!f.slice(0, 10).includes('wild'), `${rt.branch}：序盤（10マス）に野生なし`); assert.ok(f.slice(0, 12).filter((x) => x === 'rest').length <= 1, '休むは序盤に固まらない');
    assert.equal(f[f.length - 1], 'goal'); const ri = f.indexOf('rival'); assert.ok(ri >= f.length * 0.35 && ri <= f.length * 0.6, `ライバルは道中の中盤（${ri + 1}/${f.length}）`); assert.ok(f.slice(0, ri).includes('wild') && f.slice(0, ri).includes('event') && f.slice(ri + 1, -1).some((x) => x === 'wild' || x.startsWith('stat_')), '野生・イベント → ライバル → さらに冒険 → 大会');
  }
  for (let s = 1; s <= 200; s++) {
    const A = CH.generateLayout(cfg, s).assign; assert.deepEqual(CH.validateLayout(cfg, g, A), []);
    for (const id of g.order) { const n = g.nodes[id], a = A[id], want = n.kind === 'rival' ? 'rival' : n.kind === 'slot' ? n.tile : null;
      if (!want || want === 'normal') { assert.equal(a, undefined, `${id}：通常マス・骨格は割り当てなし`); continue; }
      const name = CH.nodeTypeName(a); assert.ok(name === want || (want === 'wild' && name === 'rare'), `${s} ${id}：${want} → ${name}`); }
  }
  const bad = j(cfg); bad.patternId = 'Z'; bad.playable = false; bad.paths[1].tiles[1] = 'wild'; const gb = CH.registerConfig(bad); assert.ok(CH.validateLayout(bad, gb, {}).length > 0, '違反を見つける');
});

test('CH-ENGINE-02：Chapter を差し替えられる（config を登録するだけで Chapter 3 もエンジンで動く）。エンジンに Chapter 番号の分岐は無い', () => {
  const E = loadEngine(), { CH, P7, P8 } = E, c1 = CH.getConfig(1);
  const c3 = j(c1); c3.chapterId = 3; c3.patternId = 'A'; c3.title = '大空の回廊'; c3.rules = { turnLimit: 30 };
  CH.registerConfig(c3);
  assert.equal(CH.handles(3), true); assert.equal(P8.trackOf(3).engine, '3:A');
  const S = P8.newSave(); S.m = mon(P7, P8, S); const m = S.m; P8.depart(S, m, lcg(3));
  m.raise.node = P8.trackOf(1).goal; m.raise.goal = true; P8.declineTournament(S, m);
  m.raise.node = P8.trackOf(2).goal; m.raise.ch = 2; m.raise.state = 'board'; m.raise.goal = true; P8.declineTournament(S, m);   // Chapter 2 も終えた状態
  assert.equal(m.raise.state, 'farm'); m.raise.fatigue = 80; m.prog.rankClr = [true, true, true, false, false, false];   // Chapter 3 の条件（公式C大会クリア）
  assert.equal(P8.depart(S, m, lcg(4)).ok, true);
  assert.deepEqual([m.raise.ch, m.raise.turnLimit, m.raise.field.chapterId, m.raise.fatigue], [3, 30, 3, 30], 'Chapter 3 の配置・30ターン・疲れの繰り越し');
  const code = rd('js/chapter/engine.js').split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
  assert.doesNotMatch(code, /chapterId\s*===\s*\d|chapter\s*===\s*\d|ch\s*===\s*\d|\.ch\s*==\s*\d/, 'Chapter 番号での分岐を書かない');
  assert.doesNotMatch(code, /はじまりの草原|大橋|f1_|f3_/, 'Chapter 1 固有の値をエンジンに書かない');
});

test('CH1-01〜03：出目1〜3の数だけ1地点ずつ進む（瞬間移動しない。1〜3）。通常マスも止まれる公式のマス（2026-10-02 の60マス再設計）。01 の奥のマスの先は次の背景（p2_）', () => {
  for (const v of [1, 2, 3]) {
    const E = onCh1(); const path = turn(E, v);
    assert.equal(path.length, v, `出目${v}`); assert.equal(E.m.raise.node, `p1_${v}`); assert.equal(E.m.raise.turnsUsed, 1);
  }
  const E = onCh1(); assert.equal(E.P8.diceSides(E.m), 3); assert.equal(E.P8.roll(E.S, E.m, () => 0.999).value, 3);
  const seen = new Set(); for (let i = 0; i < 3000; i++) seen.add(E.P7.rollDie(E.P8.diceSides(E.m), Math.random)); assert.deepEqual([...seen].sort(), [1, 2, 3], '4〜6 は出ない');
  const E2 = onCh1(); E2.m.raise.node = 'p1_5'; assert.deepEqual(turn(E2, 3), ['p1_6', 'p2_0', 'p2_1'], '背景をまたいで1地点ずつ（背景の境目はマスではない）');
});

test('CH1-04：途中の地点を順番に通る（止まった地点だけ効果）', () => {
  const E = onCh1(); const g = E.CH.graphFor(E.m);
  const path = turn(E, 3); assert.deepEqual(path, ['p1_1', 'p1_2', 'p1_3']);
  for (let i = 1; i < path.length; i++) assert.ok(g.conn[path[i - 1]].includes(path[i]), 'つながった地点だけを通る');
  const before = j(E.m); finishTurnAnyway(E);
  for (const k of ['li', 'po', 'in', 'hi', 'ev', 'de']) assert.equal(E.m[k], before[k], 'p1_1（ちから…ではなくライフ）を通過しても効果なし。止まった p1_3 は通常マス＝何も起きない');
});

test('CH1-05：移動疲れ：出目1 +3・出目2 +5・出目3 +7（出目が決まった時点で加算）。4〜6 は表の最大 +7【暫定・未決】', () => {
  for (const [v, add] of [[1, 3], [2, 5], [3, 7]]) {   // Chapter 1 は 1〜3（4〜6 の暫定値は NX-13）
    const E = onCh1(); E.P8.roll(E.S, E.m, () => DIE3[v]);
    assert.equal(E.CH.fatigue(E.m), add); assert.equal(E.m.raise.pend.fatigueAdded, add, '停止地点の判定より前に加算済み');
  }
});

test('CH1-06：休む：1ターン消費・疲れ −30・移動なし（ライフは回復しない）', () => {
  const E = onCh1(); const { P8, S, m, CH } = E; m.raise.fatigue = 70; const li = m.li, node = m.raise.node;
  const r = P8.rest(S, m); assert.equal(r.ok, true);
  assert.deepEqual([m.raise.turnsUsed, CH.fatigue(m), m.raise.node, m.li], [1, 40, node, li]);
  m.raise.fatigue = 10; P8.rest(S, m); assert.equal(CH.fatigue(m), 0, '0未満にならない');
  m.raise.pend = { roll: 1, left: 1, stage: 'move' }; assert.equal(P8.rest(S, m).ok, false, 'ターンの途中は休めない');
});

test('CH1-07：疲れ100ならサイコロは振れない（休むだけ）。99なら振れる', () => {
  const E = onCh1(); const { P8, S, m } = E; m.raise.fatigue = 100;
  assert.equal(P8.canRoll(m), false); assert.equal(P8.roll(S, m, () => 0).ok, false); assert.equal(P8.canRest(m), true);
  P8.rest(S, m); assert.equal(P8.canRoll(m), true, '休めば振れる');
  m.raise.fatigue = 99; assert.equal(P8.canRoll(m), true); P8.roll(S, m, () => DIE[3]); assert.equal(E.CH.fatigue(m), 100, '上限100');
});

test('CH1-08：能力マスの上昇量＝成長適性（A+7・B+6・C+5・D+4・E+3。2026-10-02 正式）。ランダム幅・失敗・大成功なし、疲れの影響なし。表は monsters.js の GROWTH_GAIN の1か所', () => {
  const { w, CH } = loadEngine(), M = w.MMP10M;
  assert.deepEqual({ ...M.GROWTH_GAIN }, { A: 7, B: 6, C: 5, D: 4, E: 3 }); assert.deepEqual([...M.GROWTH_GRADES], ['A', 'B', 'C', 'D', 'E']);
  const K = ['li', 'po', 'in', 'hi', 'ev', 'de'], of = (sp) => K.map((k) => M.growthOf({ sp }, k)).join(''), gain = (sp) => K.map((k) => M.growthGain({ sp }, k));
  assert.equal(of(0), 'CCCCCC', 'ソラモ'); assert.deepEqual(gain(0), [5, 5, 5, 5, 5, 5]);
  assert.equal(of(1), 'DBBCBE', 'ガウル'); assert.deepEqual(gain(1), [4, 6, 6, 5, 6, 3]);
  assert.equal(of(2), 'BDDDEC', 'ノビトン'); assert.deepEqual(gain(2), [6, 4, 4, 4, 3, 5]);
  assert.equal(of(3), 'CAEDEA', 'ジオル'); assert.deepEqual(gain(3), [5, 7, 3, 4, 3, 7]);
  assert.deepEqual([0, 1, 2, 3].map((sp) => M.growthRegistered(sp)), [true, true, true, true], '4原種とも登録済み（種族ごとのデータ。種族名の分岐は書かない）');
  assert.ok(!/sp\s*===?\s*[0-3]|key\s*===?\s*'(solamo|gauru|nobiton|jiol)'/.test(rd('js/phase10/monsters.js').slice(rd('js/phase10/monsters.js').indexOf('function growthOf'), rd('js/phase10/monsters.js').indexOf('const growthRegistered'))), '適性の取り出しに種族ごとの分岐を書かない');
  assert.equal(M.growthOf({ sp: 0, growth: { po: 'A' } }, 'po'), 'A', '個体ごとの適性（合体個体など将来用）を優先'); assert.equal(M.growthGain({ sp: 0, growth: { po: 'Z' } }, 'po'), 5, '不正な値は種族の適性');
  const SRC = rd('js/chapter/engine.js'); assert.ok(!/statGainRange|greatMultiplier|statOdds/.test(SRC.replace(/^\s*\/\/.*$/gm, '')), '旧仕様（+10〜15・疲れの失敗／大成功）は残さない');
  assert.ok(!/A:\s*7/.test(SRC) && !/\bE:\s*3\b/.test(rd('js/phase8/raising.js')), '上昇量の表を重複して書かない');
  assert.equal(CH.statGain({ sp: 1 }, 'de').amount, 3);
});

test('CH1-09：能力マスに止まる → その能力だけ 適性の値ぶん上がる（どの疲れ・どの乱数でも同じ。2026-10-06：Chapter 1 は config の表 rules.growthGain＝A5 B4 C3 D2 E2）。イベントの能力変化は適性の影響を受けない', () => {
  for (const [sp, want] of [[0, { li: 3, po: 3, in: 3, hi: 3, ev: 3, de: 3 }], [1, { li: 2, po: 4, in: 4, hi: 3, ev: 4, de: 2 }], [2, { li: 4, po: 2, in: 2, hi: 2, ev: 2, de: 3 }], [3, { li: 3, po: 5, in: 2, hi: 2, ev: 2, de: 5 }]]) {
    for (const k of Object.keys(want)) for (const [fat, rv] of [[0, 0.01], [55, 0.5], [99, 0.99]]) {
      const E = onCh1(); E.m.sp = sp; const g = E.CH.graphFor(E.m), id = g.order.find((x) => x !== g.start && g.nodes[x].kind === 'slot');
      E.m.raise.field.nodeAssignments[id] = { t: 'stat', k }; E.m.raise.node = id; E.m.raise.pend = { roll: 1, left: 0, stage: 'resolve' }; E.m.raise.fatigue = fat;
      const before = { ...E.m }, fx = E.P8.resolveLanding(E.S, E.m, () => rv).fx;
      assert.deepEqual([fx.kind, fx.key, fx.outcome, fx.amount, E.m[k] - before[k]], ['chstat', k, 'ok', want[k], want[k]], `sp${sp} ${k} 疲れ${fat}`);
      for (const o of Object.keys(want)) if (o !== k) assert.equal(E.m[o], before[o], 'ほかの能力は変わらない');
    }
  }
  // イベント（賢者 +20）は適性に関係なくイベントの数値のまま（ガウルの丈夫さ E でも +20）
  const E = onCh1(); E.m.sp = 1; const g = E.CH.graphFor(E.m), id = g.order.find((x) => x !== g.start && g.nodes[x].kind === 'slot');
  E.m.raise.field.nodeAssignments[id] = { t: 'event', ev: 'sage', tier: 'rare' }; E.m.raise.node = id; E.m.raise.pend = { roll: 1, left: 0, stage: 'resolve' };
  const fx = E.P8.resolveLanding(E.S, E.m, () => 0.99).fx; assert.equal(fx.amount, 20, '賢者 +20');
});

test('CH1-31：レアモンスターマス（2026-10-02 正式）：バトルの候補マスを作るとき（Chapter開始時に1回）に 10% でレアモンスターマス。配置と一緒に保存し、ロード後も同じ。止まってからの抽選はしない。強敵マスは無い', () => {
  const { CH } = loadEngine(), cfg = CH.getConfig(1), SRC = rd('js/chapter/engine.js').replace(/^\s*\/\/.*$/gm, '');
  assert.equal(cfg.layoutRules.rareBattleRate, 0.1); assert.equal(CH.rulesOf(cfg).rareWildRate, undefined, '旧仕様（止まってから10%）の設定は無い');
  assert.ok(!/rareWildRate|isRareEncounter|fx\.rare\s*=/.test(SRC), '止まってから抽選する旧コードは残さない');
  assert.deepEqual(Object.keys(cfg.battleTypes), ['wild', 'rare', 'rival'], 'バトルのマスは 野生・レアモンスター・ライバル だけ');
  // 多数の配置で、バトルの候補マス（ライバルを除く）のうちレアの割合が約10%。60マス中ちょうど6個などの固定数ではない
  let rare = 0, wild = 0; const perRun = new Set();
  for (let s = 1; s <= 1500; s++) { const A = CH.generateLayout(cfg, Math.imul(s, 2654435761) >>> 0).assign; let n = 0; for (const a of Object.values(A)) if (a.t === 'battle' && !a.fixed) { if (a.bt === 'rare') { rare++; n++; } else { assert.equal(a.bt, 'wild'); wild++; } } perRun.add(n); }
  const rate = rare / (rare + wild); assert.ok(Math.abs(rate - 0.1) < 0.015, `レアの割合 約10%（${(rate * 100).toFixed(1)}%）`); assert.ok(perRun.size >= 3, '1回ごとの数は固定でない');
  // 止まったときはマスの種類をそのまま渡す（乱数に関係なく同じ）
  const at = (bt, rv) => { const E = onCh1(); const g = E.CH.graphFor(E.m), id = g.order.find((x) => x !== g.start && g.nodes[x].kind === 'slot'); E.m.raise.field.nodeAssignments[id] = { t: 'battle', bt }; E.m.raise.node = id; E.m.raise.pend = { roll: 1, left: 0, stage: 'resolve' }; return E.P8.resolveLanding(E.S, E.m, () => rv).fx; };
  for (const rv of [0.01, 0.5, 0.99]) { assert.deepEqual(at('wild', rv), { kind: 'battle', battleType: 'wild' }); assert.deepEqual(at('rare', rv), { kind: 'battle', battleType: 'rare' }); }
  // 保存 → 読み込み：レアの位置は同じ
  for (let s = 1; s < 200; s++) { const E = onCh1(s); const A = E.m.raise.field.nodeAssignments; if (!Object.values(A).some((a) => a.bt === 'rare')) continue;
    const S2 = E.P8.migrateSave(j(E.S)); assert.deepEqual(S2.m.raise.field.nodeAssignments, A, 'ロード後も同じ配置（レアの位置を含む）'); assert.deepEqual(CH.generateLayout(cfg, E.m.raise.field.layoutSeed).assign, A); break; }
  // マスの素材：野生＝赤い爪、レア＝深紅（ZIP の board_node_strong_enemy）、ライバル＝紫
  const T = cfg.tileUI.sprites, TL = './assets/fields/ch1a/tiles/';
  assert.deepEqual([T.wild, T.rare, T.rival, T.strong], [TL + 'tile_wild_battle.webp', TL + 'tile_rare_monster.webp', TL + 'tile_rival.webp', undefined]);
  assert.ok(existsSync(path.join(ROOT, T.rare))); assert.ok(!existsSync(path.join(ROOT, TL + 'tile_strong_enemy.webp')), '旧名のファイルは改名済み');
  const FV = loadView(); assert.equal(FV.tileSpriteOf(cfg, CH.nodeTypeName({ t: 'battle', bt: 'rare' })), T.rare); assert.equal(FV.tileSpriteOf(cfg, CH.nodeTypeName({ t: 'battle', bt: 'wild' })), T.wild); assert.equal(CH.nodeTypeName({ t: 'battle', bt: 'rare' }), 'rare');
  // Chapter 2 はレアの率を書いていない＝配置の乱数列は従来どおり
  assert.equal(CH.getConfig(2).layoutRules.rareBattleRate, undefined);
});

test('CH1-32：互換：60マス再設計（2026-10-02）より前の Chapter 1 の途中のセーブ（ノード w1_〜w14_・強敵 w9_3・止まってからの抽選の記録 pend.fx.rare）は、新しい構成に無いので Chapter 1 の開始地点（0ターン）から。能力・所持金・疲れは保つ', () => {
  const E = onCh1(5); const f = E.m.raise.field;
  f.nodeAssignments = { w9_3: { t: 'battle', bt: 'strong', fixed: true }, w1_1: { t: 'stat', k: 'li' } };
  E.m.raise.node = 'w9_3'; E.m.raise.turnsUsed = 12; E.m.raise.fatigue = 33; E.m.po = 140; E.S.g = 777; E.m.raise.pend = { roll: 1, left: 0, stage: 'battle', fx: { kind: 'battle', battleType: 'strong', rare: true } };
  const S2 = E.P8.migrateSave(j(E.S)), m2 = S2.m;
  assert.equal(m2.raise.field, null, '旧ノードの配置は使わない');
  E.P8.ensureBoardPosition(S2, m2);
  assert.deepEqual([m2.raise.node, m2.raise.turnsUsed, m2.raise.pend, m2.raise.fatigue, m2.po, S2.g], ['p1_0', 0, null, 33, 140, 777]);
  assert.equal(m2.raise.field.chapterId, 1); assert.deepEqual(E.CH.validField(m2.raise.field), true);
});

test('CH1-10：配置はシードで決まり、Chapter開始時に確定して保存される（同じシード＝同じ配置）', () => {
  const { CH } = loadEngine(), cfg = CH.getConfig(1);
  const a = CH.generateLayout(cfg, 12345), b = CH.generateLayout(cfg, 12345), c = CH.generateLayout(cfg, 54321);
  assert.deepEqual(a, b); assert.notDeepEqual(a.assign, c.assign);
  const E = onCh1(11), f = E.m.raise.field;
  assert.deepEqual(CH.generateLayout(cfg, f.layoutSeed).assign, f.nodeAssignments, '保存された割り当て＝シードから作った割り当て');
  for (const k of ['chapterId', 'patternId', 'fieldId', 'layoutSeed', 'nodeAssignments', 'consumedEvents', 'openedTreasures', 'branch']) assert.ok(k in f, k);
});

test('CH1-11：再読み込み（セーブ→読み込み）・Chapter再開でも配置・位置・疲れ・ターンは引き直さない', () => {
  const E = onCh1(21); turn(E, 3); finishTurnAnyway(E); turn(E, 2);
  const saved = j(E.S), S2 = E.P8.migrateSave(saved), m2 = S2.m;
  assert.deepEqual(m2.raise.field, E.m.raise.field); assert.deepEqual([m2.raise.node, m2.raise.turnsUsed, m2.raise.fatigue, m2.raise.pend], [E.m.raise.node, E.m.raise.turnsUsed, E.m.raise.fatigue, E.m.raise.pend]);
  assert.deepEqual(E.P8.ensureBoardPosition(S2, m2), { changed: false }, 'ボードを開いても作り直さない');
  // 壊れた配置は（引き直しではなく）Chapterの開始地点から作り直す
  const bad = j(saved); bad.m.raise.field.nodeAssignments = { nope: { t: 'stat' } }; const S3 = E.P8.migrateSave(bad);
  assert.equal(S3.m.raise.field, null); E.P8.ensureBoardPosition(S3, S3.m); assert.deepEqual([S3.m.raise.node, S3.m.raise.turnsUsed], ['p1_0', 0]);
});

test('CH1-12〜13：分かれ道（2026-10-06：3か所）：A＝03 の中で左右（ちから・丈夫さ／かしこさ・命中）、C＝05 の最後のマス p5_3 で森／大橋（背景が分かれる）、B＝11 の中で左右（ライフ・丈夫さ／回避・命中）。プレイヤーが選ぶ（出目では決めない）。それぞれ合流（p3m_0・p10_0・p11m_0）。分かれ道・合流は止まれる公式のマス（何も起きない）。分かれ道の待ちは保存・再読み込みでも同じ', () => {
  const E = onCh1(); E.m.raise.node = 'p5_1'; E.m.raise.pend = null;
  const t = turn(E, 3, 'forest'); assert.deepEqual(t, ['p5_2', 'p5_3', 'p6_0'], '分かれ道で森を選んで 06 へ'); assert.equal(E.m.raise.field.branch, 'forest');
  const E2 = onCh1(); E2.m.raise.node = 'p5_1'; E2.m.raise.pend = null;
  assert.deepEqual(turn(E2, 3, 'bridge'), ['p5_2', 'p5_3', 'p8_0'], '大橋を選んで 08 へ'); assert.equal(E2.m.raise.field.branch, 'bridge');
  // A（03 の中の左右）・B（11 の中の左右）
  const Ea = onCh1(); Ea.m.raise.node = 'p2_4'; assert.deepEqual(turn(Ea, 3, 'mind'), ['p2_5', 'p3_0', 'p3r_0'], 'A：かしこさの道（右）'); assert.equal(Ea.m.raise.field.branch, 'mind');
  const Ea2 = onCh1(); Ea2.m.raise.node = 'p2_4'; assert.deepEqual(turn(Ea2, 3, 'power'), ['p2_5', 'p3_0', 'p3l_0'], 'A：ちからの道（左）');
  for (const from of ['p3l_4', 'p3r_4']) { const Em = onCh1(); Em.m.raise.node = from; assert.deepEqual(turn(Em, 2), ['p3m_0', 'p4_0'], `${from} から合流 p3m_0 → 04`); }
  const Eb = onCh1(); Eb.m.raise.node = 'p10_5'; Eb.m.raise.field.branch = 'forest'; assert.deepEqual(turn(Eb, 3, 'guard'), ['p11_0', 'p11l_0', 'p11l_1'], 'B：守りの道（左）'); assert.equal(Eb.m.raise.field.branch, 'guard');
  for (const from of ['p11l_4', 'p11r_4']) { const Em = onCh1(); Em.m.raise.node = from; assert.deepEqual(turn(Em, 2), ['p11m_0', 'p12_0']); }
  // 分かれ道にちょうど止まる：何も起きない（通常マスと同じ）→ 次のターンの最初の1歩で選ぶ
  const E3 = onCh1(); E3.m.raise.node = 'p5_1'; E3.m.raise.pend = null; turn(E3, 2); assert.equal(E3.m.raise.node, 'p5_3'); assert.deepEqual(finishTurnAnyway(E3).fx, { kind: 'none', note: 'normal' });
  const { P8, S, m } = E3; P8.roll(S, m, () => DIE3[2]); P8.step(S, m); assert.equal(m.raise.pend.stage, 'branch'); assert.deepEqual(m.raise.pend.opts, ['p6_0', 'p8_0']);
  const S2 = P8.migrateSave(j(S)); assert.deepEqual(S2.m.raise.pend, m.raise.pend, '分かれ道の待ちはそのまま保存・再読み込み'); assert.equal(P8.boardPhase(S2.m), 'branch');
  assert.equal(P8.chooseBranch(S2, S2.m, 'p8_0').ok, true); P8.step(S2, S2.m); assert.equal(S2.m.raise.node, 'p8_1');
  // 合流：森（07 の最後）・大橋（09 の最後）のどちらからも 10 の合流 p10_0 へ
  for (const [from, br] of [['p7_4', 'forest'], ['p9_4', 'bridge']]) { const E4 = onCh1(); E4.m.raise.node = from; E4.m.raise.field.branch = br; assert.deepEqual(turn(E4, 2), ['p10_0', 'p10_1']); }
  const E5 = onCh1(); E5.m.raise.node = 'p9_4'; E5.m.raise.field.branch = 'bridge'; turn(E5, 1); assert.equal(E5.m.raise.node, 'p10_0'); assert.deepEqual(finishTurnAnyway(E5).fx, { kind: 'none', note: 'normal' }, '合流に止まっても何も起きない');
  const g = E.CH.graphFor(E.m); assert.equal(g.nodes.p9_2.terrain, 'bridge'); assert.equal(Object.values(g.nodes).filter((n) => n.kind === 'strong').length, 0, '強敵マスは無い');
});

test('CH1-14〜15：ボード上のバトルの後は疲れ +5（野生・レアモンスター・ライバル同じ）。同じ地点・同じ配置のまま次のターンへ。途中終了・公式大会では増やさない', () => {
  for (const bt of ['wild', 'rare', 'rival']) {
    const E = onCh1(31); const { P8, S, m, CH } = E, g = CH.graphFor(m);
    const id = bt === 'rival' ? g.order.find((x) => g.nodes[x].kind === bt) : g.order.find((x) => m.raise.field.nodeAssignments[x] && m.raise.field.nodeAssignments[x].t === 'battle' && !m.raise.field.nodeAssignments[x].fixed);
    if (bt === 'rare') m.raise.field.nodeAssignments[id].bt = 'rare';
    m.raise.node = id; m.raise.fatigue = 40; m.raise.turnsUsed = 5; m.raise.pend = { roll: 2, left: 0, stage: 'resolve' };
    const r = P8.resolveLanding(S, m, lcg(2)), fieldBefore = j(m.raise.field); assert.equal(r.fx.kind, 'battle'); assert.equal(r.fx.battleType, bt); assert.equal(m.raise.pend.stage, 'battle');
    assert.equal(P8.beginBattle(S, m, { kind: 'practice', rank: 0 }).ok, true); P8.markBattleDone(S);
    const f = P8.finishBattle(S, m); assert.equal(f.fatigueAdded, 5);
    assert.deepEqual([CH.fatigue(m), m.raise.node, m.raise.turnsUsed, m.raise.pend, P8.boardPhase(m)], [45, id, 5, null, 'roll'], bt);
    assert.deepEqual(m.raise.field, fieldBefore, '配置・分岐・開けた宝箱などはそのまま');
  }
  const E = onCh1(32); const { P8, S, m } = E; m.raise.pend = { roll: 1, left: 0, stage: 'battle', fx: { kind: 'battle' } }; m.raise.fatigue = 10;
  P8.beginBattle(S, m, { kind: 'practice', rank: 0 }); const f = P8.finishBattle(S, m); assert.equal(f.interrupted, true); assert.equal(E.CH.fatigue(m), 10, '途中終了（やり直し）では増やさない');
  assert.equal(P8.skipBattleSquare(S, m).ok, true); assert.equal(E.CH.fatigue(m), 10, 'やめておいた時も増やさない');
  assert.match(rd('js/phase8/raising.js'), /if \(b\.kind === 'practice'\) \{\n\s+const d = driverFor\(r\.ch\); if \(d && d\.onBattleFinished\)/, '疲れはボード上のバトル（practice）だけ。公式大会（league）の試合では増やさない');
});

test('CH1-16：バトルの種類：wild・rare・rival（レアモンスターの敵データは未登録＝バトルの中身は野生と同じ【暫定】）。旧目印の asset key は wild・rival で分ける', () => {
  const { CH } = loadEngine(), cfg = CH.getConfig(1), bt = cfg.battleTypes;
  assert.deepEqual(Object.keys(bt), ['wild', 'rare', 'rival']);
  assert.deepEqual([bt.wild.label, bt.rare.label, bt.rival.label], ['野生のモンスター', 'レアモンスター', 'ライバルのリュウ']); assert.equal(bt.rival.name, 'リュウ', '2026-10-04：ライバルの正式名');
  assert.deepEqual([bt.wild.asset, bt.rare.asset, bt.rival.asset], ['battle_wild', 'battle_wild', 'battle_rival']);
  assert.notEqual(cfg.assets.battle_wild, cfg.assets.battle_rival, '別のファイル名'); assert.equal(cfg.assets.battle_strong, undefined);
  for (const k of ['battle_wild', 'battle_rival']) assert.ok(existsSync(path.join(ROOT, cfg.assets[k])), k);
  assert.equal(rd(cfg.assets.battle_wild).length, rd(cfg.assets.battle_rival).length, '今は同じ絵（素材の指定どおり）');
});

test('CH1-17〜18：宝箱・イベント地点は3段階（normal / rare / special）。絵と種類を分ける。開けた宝箱・使ったイベントは記録し、同じ地点で2回起きない', () => {
  const { CH } = loadEngine(), cfg = CH.getConfig(1), seen = { treasure: new Set(), event: new Set() };
  for (let s = 1; s <= 300; s++) for (const a of Object.values(CH.generateLayout(cfg, s).assign)) if (a.t === 'treasure' || a.t === 'event') { assert.ok(CH.TIERS.includes(a.tier)); seen[a.t].add(a.tier); }
  assert.deepEqual([...seen.treasure].sort(), ['normal', 'rare', 'special']); assert.deepEqual([...seen.event].sort(), ['normal', 'rare', 'special']);
  for (const t of CH.TIERS) for (const k of [`treasure_${t}`, `event_${t}`]) assert.ok(existsSync(path.join(ROOT, cfg.assets[k])), k);
  assert.equal(new Set(CH.TIERS.map((t) => cfg.assets[`treasure_${t}`])).size, 3, '宝箱の絵は3種類');
  const E = onCh1(41), g = E.CH.graphFor(E.m), A = E.m.raise.field.nodeAssignments;
  for (const t of ['treasure', 'event']) {
    const id = g.order.find((x) => A[x] && A[x].t === t); E.m.raise.node = id; E.m.raise.pend = { roll: 1, left: 0, stage: 'resolve' };
    const fx = E.P8.resolveLanding(E.S, E.m, lcg(5)).fx; assert.equal(fx.tier, A[id].tier);
    assert.ok((t === 'treasure' ? E.m.raise.field.openedTreasures : E.m.raise.field.consumedEvents).includes(id));
    E.m.raise.pend = { roll: 1, left: 0, stage: 'resolve' }; assert.equal(E.P8.resolveLanding(E.S, E.m, lcg(5)).fx.kind, 'none', '2回目は何も起きない');
  }
  // 休むマス（3）＝疲れ回復のイベント、？イベント（2026-10-06：10）＝回復以外のイベント（2026-10-02 の固定配置）
  for (let s = 1; s <= 300; s++) { const A = Object.values(CH.generateLayout(cfg, s).assign); assert.equal(A.filter((a) => a.recovery).length, 3, `seed ${s}`); for (const a of A.filter((x) => x.t === 'event')) assert.equal(!!a.recovery, !!cfg.eventPool.find((e) => e.id === a.ev).recovery); assert.equal(A.filter((a) => a.t === 'event' && !a.recovery).length, 10); }
});

test('配置（300シード）：固定配置なので、どの seed でも制約（内訳）を満たし、ルートごとの種類の数は同じ。能力は6種類すべて', () => {
  const { CH } = loadEngine(), cfg = CH.getConfig(1), g = CH.buildGraph(cfg);
  for (let s = 1; s <= 300; s++) {
    const L = CH.generateLayout(cfg, s); assert.deepEqual(CH.validateLayout(cfg, g, L.assign), [], `seed ${s}`); assert.equal(L.attempt, 0);
    for (const rt of g.routes) {
      const f = rt.seq.map((id) => (L.assign[id] || {}).t || 'normal'), c = (t) => f.filter((x) => x === t).length;
      const brs = rt.seq.map((id) => g.nodes[id].branch).filter(Boolean), fo = brs.includes('forest'), mi = brs.includes('mind');
      assert.deepEqual([c('stat'), c('event'), c('battle'), c('treasure')], fo ? [25, mi ? 12 : 11, mi ? 4 : 5, 5] : [23, mi ? 9 : 8, mi ? 7 : 8, 6], `${s} ${brs.join('/')}（イベントは休むを含む・バトルはライバルを含む。2026-10-06）`);
      assert.equal(new Set(rt.seq.map((id) => (L.assign[id] || {}).k).filter(Boolean)).size, 6);
    }
  }
});

test('CH1-19〜21：45ターン目にゴール＝成功（2026-10-06。旧 30）。45ターン使い切ってゴールしていなければChapter終了（大会なし・育成失敗ではない・能力は保持）。出目がゴールを超えてもゴールで止まる。ライバルは強制停止', () => {
  const E = onCh1(51); const { P8, S, m } = E;
  m.raise.node = 'p14_2'; m.raise.turnsUsed = 44; m.raise.fatigue = 0;
  const path = turn(E, 3); assert.deepEqual(path, ['p14_3'], '3でも1地点でゴールに止まる（残りの移動は消える）');
  finishTurnAnyway(E); assert.deepEqual([m.raise.turnsUsed, m.raise.goal, P8.boardPhase(m)], [45, true, 'goal'], '45ターン目のゴールは成功');
  assert.equal(P8.canStartTournament(S, m, 0).ok, true, '公式大会へ');
  const E2 = onCh1(52); E2.m.raise.node = 'p1_1'; E2.m.raise.turnsUsed = 44; E2.m.po = 150; turn(E2, 1); finishTurnAnyway(E2);
  assert.equal(E2.P8.boardPhase(E2.m), 'timeup'); assert.equal(E2.P8.canRoll(E2.m), false); assert.equal(E2.P8.canRest(E2.m), false);
  const end = E2.P8.endChapter(E2.S, E2.m); assert.equal(end.ok, true); assert.equal(end.entry.reachedGoal, false); assert.equal(end.entry.tour, null);
  assert.deepEqual([E2.m.raise.state, E2.m.raise.ch, E2.m.po >= 150], ['farm', 2, true], '次のChapterへ（育成失敗ではない。獲得した能力は保持）');
  const E3 = onCh1(53); E3.m.raise.node = 'p1_0'; E3.m.raise.turnsUsed = 44; E3.P8.rest(E3.S, E3.m); assert.equal(E3.P8.boardPhase(E3.m), 'timeup', '45ターン目に休んでも終わり（大会なし）');
  // ライバル（p5_0）は強制停止：p4_4 から 3 が出ても p4_5 → p5_0 で止まり、残りの歩数は消える。次のターンで p5_1
  const E4 = onCh1(54); E4.m.raise.node = 'p4_4'; E4.m.raise.fatigue = 0; const t4 = turn(E4, 3); assert.deepEqual(t4, ['p4_5', 'p5_0']); assert.equal(E4.m.raise.pend.left, 0);
  const r4 = E4.P8.resolveLanding(E4.S, E4.m, lcg(1)); assert.deepEqual([r4.fx.kind, r4.fx.battleType], ['battle', 'rival']); E4.P8.skipBattleSquare(E4.S, E4.m);
  turn(E4, 1); assert.equal(E4.m.raise.node, 'p5_1');
  const E5 = onCh1(55); E5.m.raise.node = 'p14_1'; E5.m.raise.fatigue = 0; turn(E5, 3); assert.equal(E5.m.raise.node, 'p14_3'); assert.equal(E5.m.raise.pend.left, 0, 'ゴールで止まる（門前にはもうライバルはいない）');
});

test('CH1-22：次のChapterの開始時の疲れ＝max(0, 前Chapterの疲れ − 50)。大会・Chapterの終了では疲れは変わらない', () => {
  for (const [f, want] of [[80, 30], [45, 0], [100, 50], [0, 0]]) {
    const E = onCh1(61); const { P8, S, m } = E; m.raise.node = 'f10_5'; m.raise.goal = true; m.raise.fatigue = f;
    P8.declineTournament(S, m); assert.equal(m.raise.fatigue, f, 'Chapter終了時の疲れを保持'); assert.equal(m.raise.field, null, '配置はChapterごと');
    P8.depart(S, m, lcg(62)); assert.equal(m.raise.fatigue, want, `${f} → ${want}`);
  }
  const E = onCh1(63); E.m.raise.fatigue = 90; assert.equal(E.m.raise.fatigue, 90);
  const fresh = onCh1(64); assert.equal(fresh.m.raise.fatigue, 0, '育成開始（Chapter 1）は0から');
});

test('CH1-23〜24：セーブは version 6・キー mr4v6 のまま。疲れ・配置は個体の m.raise の任意項目（古いセーブは疲れ0・配置なし）', () => {
  const E = onCh1(71); assert.equal(E.P8.SAVE_VERSION, 6); assert.equal(E.P8.SAVE_KEY, 'mr4v6'); assert.equal(E.S.v, 6);
  const old = j(E.S); delete old.m.raise.fatigue; delete old.m.raise.field; const S2 = E.P8.migrateSave(old);
  assert.deepEqual([S2.v, S2.m.raise.fatigue, S2.m.raise.field], [6, 0, null]);
  const store = { d: {}, getItem(k) { return this.d[k] ?? null; }, setItem(k, v) { this.d[k] = v; } }; store.setItem('mr4v6', JSON.stringify(E.S));
  const r = E.P8.loadFromStorage(store); assert.equal(r.status, 'ok'); assert.deepEqual(r.S.m.raise.field, E.m.raise.field);
  for (const bad of [-5, 250, 'x', null]) { const o = j(E.S); o.m.raise.fatigue = bad; const x = E.P8.migrateSave(o).m.raise.fatigue; assert.ok(Number.isInteger(x) && x >= 0 && x <= 100, `${bad} → ${x}`); }
});

test('DICE-01〜05：出目は1〜3だけ（等確率）。forcedResult で固定できる。演出中はロック。1枚の画像で動き、停止画像は resultSprites に登録するだけで差し替わる', async () => {
  const w = {}; new Function('window', rd('js/phase7/progression.js'))(w); new Function('window', rd('js/chapter/dice-renderer.js'))(w); const D = w.MMCHD;
  const r = lcg(3), cnt = { 1: 0, 2: 0, 3: 0 }; for (let i = 0; i < 30000; i++) cnt[D.roll({ rnd: r })]++;
  assert.deepEqual(Object.keys(cnt), ['1', '2', '3']); for (const v of [1, 2, 3]) assert.ok(Math.abs(cnt[v] / 30000 - 1 / 3) < 0.012, JSON.stringify(cnt));
  for (const v of [1, 2, 3]) { const x = D.rollDice({ forcedResult: v }); assert.equal(x.result, v); assert.equal(await x.animationPromise, true); }
  assert.throws(() => D.rollDice({ forcedResult: 4 })); assert.equal(D.isLocked(), false);
  const c = D.configure(); assert.equal(c.rollingSprite, './assets/fields/ch1a/dice/dice_rolling.webp'); assert.ok(existsSync(path.join(ROOT, c.rollingSprite)), '正式サイコロ1枚');
  assert.deepEqual(c.resultSprites, {}, '停止画像（2・3が上）は偽造しない＝未登録'); assert.equal(D.resultSprite(2), null);
  D.configure({ resultSprites: { 1: 'a1.webp', 2: 'a2.webp', 3: 'a3.webp' } }); assert.equal(D.resultSprite(2), 'a2.webp', '登録するだけで差し替わる');
  const src = rd('js/chapter/dice-renderer.js'); assert.match(src, /translate/); assert.match(src, /rotate/); assert.doesNotMatch(src, /frames|\/01\.webp/, '連番画像を使わない');
});

test('シミュレーション（1000回）：Chapter 1・1〜3・45ターン・84マス・分岐3か所（2026-10-06）。到達ターン・45ターン内到達率・停止地点・疲れ。森・大橋どちらのルートでも 45ターン以内に到達できる', () => {
  const E = loadEngine();
  for (const pol of ['cautious', 'forced']) {
    const s = simulate(E, 1000, pol);
    assert.ok(s.avgTurns >= 30 && s.avgTurns <= 40, `${pol}：平均 ${s.avgTurns}`);
    assert.ok(s.reachRate >= 0.97 && s.reachRate <= 1, `${pol}：45ターン内到達率 ${s.reachRate}`);
    assert.ok(s.avgStops.stat > 8 && s.avgStops.event > 3 && s.avgStops.battle > 2 && s.avgStops.treasure > 1.5 && s.avgNormalStops > 3, JSON.stringify(s.avgStops) + ' normal ' + s.avgNormalStops);
    assert.ok(s.maxTurns <= 45); assert.ok(s.branch.forest.runs > 300 && s.branch.bridge.runs > 300, '分かれ道はどちらも選ばれる（シミュレーションはランダムに選ぶ）');
  }
  for (const br of ['forest', 'bridge']) { const s = simulate(E, 500, 'cautious', 20261002, 1, br); assert.ok(s.reachRate >= 0.97, `${br}：${s.reachRate}`); assert.equal(s.branch[br].runs, Math.round(s.reachRate * 500)); }
});

// =========================================================
// 2026-09-30 改修：道の曲線・中間点・止まる位置と目印の分離・見せ方の config（Chapter 移動体験の品質向上）
// =========================================================
test('CH1-25：道の曲線（Catmull-Rom）の仕組みは残す。巨大街道は折れ線（curve:linear＝石板の輪をまっすぐ結ぶ）。隣の地点へは道筋の点列で歩く', () => {
  const { CH } = loadEngine(), cfg = CH.getConfig(1), g = CH.buildGraph(cfg);
  const c = CH.smoothCurve([[0, 0], [1, 1], [2, 0]], 4);
  assert.equal(c.length, 9, '2区間 × 4分割 ＋ 始点'); assert.deepEqual(c[0], [0, 0]); assert.deepEqual(c[c.length - 1], [2, 0]);
  assert.ok(c[2][1] > 0.4 && c[2][1] < 1, '中間は通る点の間を滑らかにつなぐ');
  assert.deepEqual(CH.smoothCurve([[0, 0], [1, 1]]), [[0, 0], [1, 1]], '点が2つなら折れ線のまま');
  for (const p of cfg.paths) { const cv = g.curves[p.id]; assert.ok(cv && cv.pts.length === p.pts.length && cv.pts.length >= Math.min(p.n, 4), `${p.id}：道の中央線の折れ線（${cv.pts.length}点）`); assert.equal(cv.terrain, p.terrain); }   // 分かれ道・合流だけの道（1マス）は1点
  const r = CH.routeBetween(g, 'p1_1', 'p1_2');
  assert.ok(r.length >= 2, `道筋（${r.length}）`); assert.deepEqual(r[0], [g.nodes.p1_1.mx, g.nodes.p1_1.my]); assert.deepEqual(r[r.length - 1], [g.nodes.p1_2.mx, g.nodes.p1_2.my]);
  for (let i = 1; i < r.length; i++) assert.ok(r[i][1] <= r[i - 1][1] + 0.01, '奥へ向かって進む（戻らない）');
  const ids = g.order.filter((id) => g.nodes[id].path === 'p1_');
  for (let i = 1; i < ids.length; i++) assert.ok(g.nodes[ids[i]].s > g.nodes[ids[i - 1]].s);
  // 道の中央線の上に、奥行き補正で等間隔（手前 0.87 → 奥＝背景ごとの道が細くなる手前。奥ほど画面上の間隔が縮む）
  assert.deepEqual([g.nodes[ids[0]].y, g.nodes[ids[ids.length - 1]].y], [0.87, 0.49]);
  for (let i = 2; i < ids.length; i++) assert.ok(g.nodes[ids[i - 1]].y - g.nodes[ids[i]].y < g.nodes[ids[i - 2]].y - g.nodes[ids[i - 1]].y + 1e-9, `${ids[i]}：奥ほど詰まる`);
  // 曲がった道（01 小道・08 水道橋の見える道・13 城へ続く道）：隣の地点へ歩く点列の途中も、すべて道の安全域の中（全背景）
  for (const k of cfg.paths.map((p) => p.id)) { const sc = cfg.fieldScenes.find((x) => x.id === g.curves[k].field), ns = g.order.filter((id) => g.nodes[id].path === k); for (let i = 1; i < ns.length; i++) for (const [x, y] of CH.routeBetween(g, ns[i - 1], ns[i])) { const rd2 = CH.roadAt(sc, y); assert.ok(x >= rd2.safeLeft - 1e-6 && x <= rd2.safeRight + 1e-6, `${k}：歩く途中 (${x}, ${y}) は道の中`); } }
  // 別のフィールド（次の背景）へ：空（画面側が背景の切り替えをする）
  assert.deepEqual(CH.routeBetween(g, 'p1_6', 'p2_0'), []);
});

test('CH1-26：別の道へ移るときは config.edges の中間点（曲線化）を通る。無い組み合わせは直線。止まる位置（mx/my）と目印は config.nodeOverrides で分けられる', () => {
  const { CH } = loadEngine(), cfg = CH.getConfig(1), g = CH.buildGraph(cfg);
  assert.deepEqual(CH.routeBetween(g, 'p5_2', 'p6_0'), [], '次の背景へは切り替え');
  const ce = j(cfg); ce.chapterId = 5; ce.patternId = 'E'; ce.paths.find((p) => p.id === 'p6_').field = ce.paths.find((p) => p.id === 'p5_').field; ce.edges = { 'p5_2>p6_0': [[0.5, 0.8]] }; const ge = CH.registerConfig(ce);
  const ra = CH.routeBetween(ge, 'p5_2', 'p6_0'); assert.ok(ra.length > 3, `同じ背景の中で別の道へ移るときは中間点を曲線化（${ra.length}）`);
  assert.deepEqual(ra[0], [ge.nodes.p5_2.mx, ge.nodes.p5_2.my]); assert.deepEqual(ra[ra.length - 1], [ge.nodes.p6_0.mx, ge.nodes.p6_0.my]);
  const c2 = j(cfg); c2.chapterId = 3; c2.patternId = 'T'; c2.nodeOverrides = { p1_1: { monster: [0.5, 0.65], landmark: { x: 0.3, y: 0.6, scale: 1.2, opacity: 0.8, anchor: 'foot' }, camera: { zoom: 1.02 }, terrain: 'slope', side: -1 } };
  const g2 = CH.registerConfig(c2), n = g2.nodes.p1_1;
  assert.deepEqual([n.mx, n.my], [0.5, 0.65], '止まる位置は道の点と別に持てる'); assert.notDeepEqual([n.x, n.y], [n.mx, n.my]);
  assert.deepEqual(n.lm, { x: 0.3, y: 0.6, scale: 1.2, opacity: 0.8, anchor: 'foot' }); assert.deepEqual(n.cam, { zoom: 1.02 }); assert.equal(n.terrain, 'slope'); assert.equal(n.side, -1);
  const r = CH.routeBetween(g2, 'p1_0', 'p1_1'); assert.deepEqual(r[r.length - 1], [0.5, 0.65], '歩く道筋の終点は止まる位置');
  assert.deepEqual(['p1_1', 'p2_1', 'p9_2', 'p8_1'].map((id) => g.nodes[id].terrain), ['grass', 'forest', 'bridge', 'highland']);
  const c3 = j(cfg); c3.chapterId = 4; c3.patternId = 'L'; delete c3.paths[0].curve; const g3 = CH.registerConfig(c3);
  assert.ok(g3.curves.p1_.pts.length > cfg.paths[0].pts.length, 'curve を省けば滑らかな曲線');
});


test('CH1-27：見せ方の config：バトルの目印は常設しない、背景（街道・遺跡・橋・森）に素材を重ねない、サイコロの停止面 1〜6 は正式画像、低いカメラ・視差・歩きの設定、Chapter開始の俯瞰図（Pattern ごと）と START の操作欄（STOP は使わない）', () => {
  const { CH } = loadEngine(), cfg = CH.getConfig(1);
  assert.equal(cfg.battleMarkers, false);
  for (const s of cfg.fieldScenes) { assert.deepEqual(cfg.landmarks[s.id], [], `背景 ${s.id}：背景に描かれている物に素材を重ねない`); assert.deepEqual(cfg.foreground[s.id], []); }
  assert.deepEqual(cfg.landmarkVisibility, { stat: 'arrive', event: 'arrive', treasure: 'arrive' }, '道端の物は着いたときに初めて現れる（宝箱もマスUIがあるので、止まったときに現れて開く。2026-10-02）');
  assert.deepEqual(Object.keys(cfg.dice.resultSprites), ['1', '2', '3', '4', '5', '6'], 'サイコロの停止面（1〜6）'); for (let v = 1; v <= 6; v++) { assert.match(cfg.dice.resultSprites[v], /dice_stop_\d\.webp$/); assert.ok(existsSync(path.join(ROOT, cfg.dice.resultSprites[v])), `dice_stop_${v}`); }
  assert.ok(existsSync(path.join(ROOT, cfg.dice.rollingSprite)), '回転中の無地のサイコロ（停止面がそろわないときの予備）');
  for (const e of cfg.eventPool) assert.ok(!e.asset, `${e.id}：街道の上に木・岩は置かない（tier の祠を小さく）`);
  assert.ok(cfg.nodeLook.stat.side !== 0 && cfg.nodeLook.stat.gap >= 120, '能力の石碑は輪の横（モンスターの上に重ねない）'); assert.equal(cfg.nodeLook.stat.tuft, false, '石の道に草は置かない');
  assert.ok(cfg.camera && cfg.camera.zoom.move < 1 && cfg.camera.zoom.stop > 1 && cfg.camera.zoom.branch < 1 && cfg.camera.lookAhead > 0 && cfg.camera.followDelay >= 80 && cfg.camera.followDelay <= 150);
  assert.ok(cfg.parallax.far < cfg.parallax.back && cfg.parallax.back < cfg.parallax.road && cfg.parallax.road < cfg.parallax.front, '遠景 → 中景 → 前景の順に速い');
  assert.ok(cfg.motion.minMs >= 300 && cfg.motion.maxMs <= 800 && cfg.motion.terrain.forest.speed < 1 && cfg.motion.terrain.bridge.fixed, '1地点＝石板1つ：1地点 0.38〜0.76秒。森は少しゆっくり、橋はやや一定');
  for (const s of cfg.fieldScenes) { assert.ok(s.farBand && s.farBand.k < 1, `${s.name}：遠景の帯`); assert.ok(s.zoom.near >= 1.2 && s.zoom.far > s.zoom.near, '低いカメラ（近景の石板が大きい）'); }
  // Chapter開始の俯瞰図：正式な演出専用の画像（intro/ch1_intro_overview.webp。プレイの背景とは別のファイル。背景の順には入れない）
  const I = cfg.intro, C = I.patterns.A.camera; assert.ok(I && I.overviews && C.from && C.to && C.to.zoom > C.from.zoom, 'Pattern ごとのカメラ（全景 → 開始地点）');
  assert.deepEqual(I.overviews, { A: './assets/fields/ch1a/intro/ch1_intro_overview.webp' }); assert.ok(existsSync(path.join(ROOT, I.overviews.A))); assert.ok(!cfg.fieldScenes.some((s) => s.bg === I.overviews.A));
  for (let k = 1; k <= 3; k++) assert.ok(existsSync(path.join(ROOT, `assets/fields/ch1a/intro/ch1_intro_overview_pattern${k}.webp`)), '旧の俯瞰図はファイルだけ残す（参照しない）');
  // START の操作欄：正式画像と押せる領域。STOP の画像（ui/deck_stop.webp）はファイルだけ残し、config からは参照しない（1タップで自動停止）
  assert.ok(existsSync(path.join(ROOT, cfg.deck.start))); assert.equal(cfg.deck.stop, undefined, 'STOP は使わない'); assert.ok(existsSync(path.join(ROOT, 'assets/fields/ch1a/ui/deck_stop.webp')), 'ファイルは残す'); for (const k of ['center', 'tl', 'tr', 'bl', 'br']) assert.ok(cfg.deck.hit[k] && cfg.deck.hit[k].w > 0 && cfg.deck.hit[k].h > 0, k);
  const view = rd('js/chapter/field-view.js').split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
  assert.doesNotMatch(view, /chapterId\s*===\s*\d|f1_|f2_|f3_|'a\d'|大橋|はじまりの草原/, '画面側に Pattern A 専用の座標・分岐を書かない');
  assert.match(view, /registerMonsterAnimator/, '歩行アニメの差し込み口'); assert.match(view, /routeBetween/, '道の曲線に沿って歩く'); assert.match(view, /requestAnimationFrame/, 'カメラは毎フレーム追従');
  assert.doesNotMatch(view, /manualStop: true|chfStop|requestStop|chdf/, 'STOP の操作は無い（1タップで自動停止。サイコロは START を押すまで出さない）'); assert.match(view, /MMCHI\.play/, 'Chapter開始の俯瞰図（js\/chapter\/intro.js）');
  assert.match(view, /clampToRoad/, 'モンスターの x は道の安全域に収める');
});

test('CH1-29：大会会場への到着（config.arrival）と大会受付：到着は config だけで決まる（画面に Chapter 番号の分岐なし）。受付は既存の解放条件（MMP8.eligibleRanks）と既存の大会開始（startTournament → p9TourIntro → セドリック）を使い、決めるのはプレイヤー', () => {
  const FV = rd('js/chapter/field-view.js'), HTML = rd('index.html');
  assert.match(FV, /if \(ph === 'goal' && V\.cfg\.arrival\) \{ chfArrive\(m, same\); return true; \}/, 'ゴールで config.arrival があるときだけ到着イベント');
  assert.ok(!/chapterId\s*===\s*1|ch\s*===\s*1/.test(FV), '画面に Chapter 番号の分岐を書かない');
  assert.match(FV, /f\.arrivalSeen = true; doSave\(\);/, '会話はこの個体のこの Chapter で1回（配置と一緒に消える任意項目）');
  assert.match(FV, /MMP11P\.sanitize\(S\.playerName\)/, 'プレイヤー名（初期名アルト）を {name} に入れる');
  const fn = (name) => { const i = HTML.indexOf(`function ${name}(`); assert.ok(i >= 0, name); const j = HTML.indexOf('\nfunction ', i + 1); return HTML.slice(i, j); };
  assert.match(fn('p9RankListHtml'), /MMP8\.eligibleRanks\(m,m\.raise\.ch\)/); assert.match(fn('p9RankListHtml'), /\[5,4,3,2,1,0\]\.map\(k=>p9RankRow\(m,k,el[,)]/, '上から S→E（2026-10-04：Chapter 1〜4 共通の部品）'); assert.match(fn('p9ReceptionHtml'), /p9RankListHtml\(m\)/);
  assert.match(fn('p9RcvPick'), /MMP8\.eligibleRanks\(m,m\.raise\.ch\)\.includes\(k\)\)return;/, '参加できないランクは選べない'); assert.match(fn('p9RcvPick'), /finaRankSay\(k\)/, 'フィナは見立てを話すだけ');
  const join = HTML.slice(HTML.indexOf('function p9RcvJoin('), HTML.indexOf('// ---- 大会開始の演出'));
  assert.match(join, /MMP8\.startTournament\(S,m,k\);if\(!r\.ok\)return board\(\);save\(\);p9TourOpen\(k\)/, '既存の大会開始 → 開始演出 → セドリックの導入（2026-10-07 p9TourOpen）');
  const { CH } = loadEngine(); assert.ok(CH.getConfig(1).arrival); assert.equal(CH.getConfig(2).arrival, undefined, 'Chapter 2 は従来どおり（ゴールのシートでランク選択）');
});

test('CH1-30：マスUI（config.tileUI。2026-10-02 正式素材）：能力6種・野生・レア・宝・休む・ライバル・？イベント・ゴール・分かれ道・合流に正式素材。通常マスは共通の台座の石の面だけ（控えめ）。仮表示は通常プレイに出さない（?chdebug=1 だけ）。同じ意味の旧目印は出さない', () => {
  const { CH } = loadEngine(), cfg = CH.getConfig(1), FV = rd('js/chapter/field-view.js'), T = cfg.tileUI.sprites, TL = './assets/fields/ch1a/tiles/';
  assert.deepEqual(T, { stat_life: TL + 'tile_stat_life.webp', stat_power: TL + 'tile_stat_power.webp', stat_intelligence: TL + 'tile_stat_intelligence.webp', stat_accuracy: TL + 'tile_stat_accuracy.webp', stat_evasion: TL + 'tile_stat_evasion.webp', stat_toughness: TL + 'tile_stat_toughness.webp',
    wild: TL + 'tile_wild_battle.webp', rare: TL + 'tile_rare_monster.webp', rival: TL + 'tile_rival.webp', treasure: TL + 'tile_treasure.webp', rest: TL + 'tile_rest.webp', event: TL + 'tile_event.webp', goal: TL + 'tile_chapter_goal.webp',
    branch: TL + 'tile_branch.webp', merge: TL + 'tile_merge.webp' });
  for (const f of [...Object.values(T), ...Object.values(cfg.tileUI.gates)]) { assert.ok(existsSync(path.join(ROOT, f)), f); const b = readFileSync(path.join(ROOT, f)); assert.equal(b.toString('ascii', 8, 12), 'WEBP'); }
  assert.deepEqual(cfg.tileUI.gates, { gate_left: TL + 'branch_gate_left.webp', gate_right: TL + 'branch_gate_right.webp' });
  assert.equal(T.normal, undefined, '通常マスの絵は無い（共通の台座の石の面だけ）'); assert.equal(T.start, undefined);
  assert.deepEqual([cfg.tileUI.placeholder, cfg.tileUI.replacesLandmarks, cfg.tileUI.pedestal], [false, true, true]);
  assert.match(FV, /T\.placeholder === false && !debug\(\) \? '' :/, '仮表示は ?chdebug=1 のときだけ');
  assert.match(FV, /if \(ped && key === 'normal'\) return `<i class="chf-tile ped k-normal\$\{base \? ' pb' : ''\}\$\{u\}"/, '通常マスは土台（台座）だけ');
  // 2026-10-03 品質向上：正式の共通土台（tiles/pedestal_common）をマスの絵の下に敷く（マスの絵の代わりにしない）
  const B = cfg.tileUI.base; assert.equal(B.src, './assets/fields/ch1a/tiles/pedestal_common.webp'); assert.ok(existsSync(path.join(ROOT, B.src)), B.src);
  assert.match(FV, /<img class="chf-tbase" src=/); assert.match(FV, /\$\{under\}<img class="chf-ticon" src="\$\{esc\(src\)\}"/, '土台の上にマスの絵');
  assert.match(FV, /if \(cfg\.tileUI && cfg\.tileUI\.replacesLandmarks && \['stat', 'event', 'treasure'\]\.includes\(a\.t\)\) \{/, '旧目印（石碑・イベントの物・道端の宝箱）は出さない');
  // 宝箱：normal＝通常の宝箱、special＝虹色の宝箱（止まったとき現れて開く）。rare は従来の表示（この2つを流用しない＝宝箱の絵は出さない）
  const V = loadView(), C = cfg.tileUI.chests;
  // 2026-10-03 正式4種類（assets/chests/。本体＋開封4枚）：normal＝chest_01・special＝chest_04。4種類は別ランク・別用途（対応表待ち）。chest_02・03 は保存だけ
  const CB = './assets/chests/';
  assert.deepEqual([cfg.assets[C.normal.closed], cfg.assets[C.normal.open], cfg.assets[C.special.closed], cfg.assets[C.special.open]], [CB + 'chest_01_base.webp', CB + 'chest_01_anim_04.webp', CB + 'chest_04_base.webp', CB + 'chest_04_anim_04.webp']);
  for (const [t, n] of [['normal', '01'], ['special', '04']]) assert.deepEqual(C[t].frames.map((k) => cfg.assets[k]), [1, 2, 3, 4].map((i) => `${CB}chest_${n}_anim_0${i}.webp`), `${t} の開封アニメーション（4枚の順）`);
  for (const k of Object.values(C).flatMap((c) => [c.closed, c.open, ...c.frames])) assert.ok(existsSync(path.join(ROOT, cfg.assets[k])), k);
  assert.match(FV, /async function chestFrames\(im\) \{/, '開封は絵の切り替えだけ（報酬・セーブは resolveLanding のまま）');
  assert.equal(C.rare, undefined); assert.equal(V.lookOf(cfg, { t: 'treasure', tier: 'rare' }), null, 'rare は宝箱の絵を出さない（マスUIだけ＝従来どおり）');
  assert.deepEqual([V.lookOf(cfg, { t: 'treasure', tier: 'normal' }).key, V.lookOf(cfg, { t: 'treasure', tier: 'special' }).key, V.lookOf(cfg, { t: 'treasure', tier: 'special' }).openKey], ['chest_01_base', 'chest_04_base', 'chest_04_anim_04']);
  assert.deepEqual([V.lookOf(cfg, { t: 'stat', k: 'li' }), V.lookOf(cfg, { t: 'event', ev: 'coin', tier: 'normal' })], [null, null]);
  assert.deepEqual({ ...cfg.treasurePool.contents }, { handler: 'gold_table', params: { table: [{ w: 4, gold: 50 }, { w: 1, gold: 150 }] } }, '報酬は変えていない');
  assert.match(FV, /function tileSpriteOf\(cfg, key\) \{ const T = \(cfg && cfg\.tileUI && cfg\.tileUI\.sprites\) \|\| \{\}; return T\[key\] \|\| T\[TILE_GROUP\[key\]\] \|\| T\.normal \|\| null; \}/, '種別名 → まとめた種類 → normal');
  assert.match(FV, /left:\$\{\(n\.mx \* sc\.w\)\.toFixed\(1\)\}px;top:\$\{\(n\.my \* sc\.h\)\.toFixed\(1\)\}px/, 'マスUIの位置はノードの座標（止まる位置）');
  // 2026-10-06：小型の立体マス（tileUI.discs。assets/fields/ch1a/tiles_v2/）。絵そのものが厚みのある円盤＝台座・土台は敷かない。宝箱は段階ごと（1 normal・2 rare・3 special。4 は予約＝使わない）
  const T2 = './assets/fields/ch1a/tiles_v2/', D = cfg.tileUI.discs;
  assert.deepEqual(D, { stat_life: T2 + 'tile_stat_life.webp', stat_power: T2 + 'tile_stat_power.webp', stat_intelligence: T2 + 'tile_stat_intelligence.webp', stat_accuracy: T2 + 'tile_stat_accuracy.webp', stat_evasion: T2 + 'tile_stat_evasion.webp', stat_toughness: T2 + 'tile_stat_toughness.webp',
    normal: T2 + 'tile_blank.webp', merge: T2 + 'tile_blank.webp', branch: T2 + 'tile_branch.webp', event: T2 + 'tile_event.webp', rest: T2 + 'tile_rest.webp', wild: T2 + 'tile_wild_monster.webp', rare: T2 + 'tile_rare_monster.webp', rival: T2 + 'tile_rival.webp',
    treasure_normal: T2 + 'tile_treasure_1.webp', treasure_rare: T2 + 'tile_treasure_2.webp', treasure_special: T2 + 'tile_treasure_3.webp', treasure: T2 + 'tile_treasure_1.webp' });
  for (const f of new Set(Object.values(D))) { assert.ok(existsSync(path.join(ROOT, f)), f); const b = readFileSync(path.join(ROOT, f)); assert.equal(b.toString('ascii', 8, 12), 'WEBP'); assert.ok(b.length < 60000, `${f}：小さい（${b.length}）`); }
  assert.ok(existsSync(path.join(ROOT, T2 + 'tile_treasure_4.webp')) && !Object.values(D).includes(T2 + 'tile_treasure_4.webp'), '宝箱4は予約（置くだけ・使わない）');
  assert.equal(D.goal, undefined, 'ゴール・スタートは従来の表示');
  assert.match(FV, /const dk = T\.discs \? discKeyOf\(m, id, key\) : null, dsrc = dk && \(T\.discs\[dk\] \|\| T\.discs\[key\]\);/);
  const g = CH.buildGraph(cfg); assert.equal(g.order.length, 85);
  const dbox = (id) => V.discBox(cfg.tileUI, g.nodes[id], cfg.fieldScenes.find((x) => x.id === g.nodes[id].field));
  const nb = dbox('p2_0'), fb = dbox('p2_5'); assert.ok(nb.w > fb.w * 1.3 && nb.h / nb.w > fb.h / fb.w, `手前ほど大きく、奥ほど平たい（${nb.w.toFixed(0)} → ${fb.w.toFixed(0)}）`);
  for (const id of g.order.filter((i) => g.nodes[i].kind !== 'start')) { const n = g.nodes[id], sc = cfg.fieldScenes.find((x) => x.id === n.field), b = dbox(id); assert.ok(b.w <= V.seenRoadW(sc, n) * 0.42 + 1e-6, `${id}：見えている道幅の 42% 以下（小型）`); assert.ok(b.w <= 128 * 1.2, id); }
  // 左右の道のマスどうしは重ならない（03・11）
  for (const [l, r] of [['p3l_', 'p3r_'], ['p11l_', 'p11r_']]) for (let k = 0; k < 5; k++) { const a = g.nodes[`${l}${k}`], c = g.nodes[`${r}${k}`], sc = cfg.fieldScenes.find((x) => x.id === a.field); assert.ok((c.mx - a.mx) * sc.w > (dbox(a.id).w + dbox(c.id).w) / 2, `${a.id}／${c.id}：左右の道のマスが離れている`); }
  const FV2 = rd('index.html'); assert.match(FV2, /\.chf-tile\.pb\.u \.chf-ticon\{filter:drop-shadow\(/, '中の紋様の輪郭と金の発光（絵の色は変えない）');
  assert.equal(CH.getConfig(2).tileUI, undefined, 'Chapter 2 は従来どおり（マスUIを出さない）');
});

test('CH1-28：道の安全域（fieldScenes[].road）：中央線と半幅は点ごと（曲がった細い道）。すべての止まる位置は安全域の中。clampToRoad は端に寄った x を戻し、体の半幅ぶん内側にする。半幅を書かない背景は従来の消失点のモデル', () => {
  const { CH } = loadEngine(), cfg = CH.getConfig(1), g = CH.buildGraph(cfg);
  const sc = cfg.fieldScenes[0], far = CH.roadAt(sc, 0.47), near = CH.roadAt(sc, 0.87);
  assert.ok(far.half < near.half && far.half < 0.09 && near.half > 0.2, `奥ほど細い（${far.half} → ${near.half}）`);
  assert.ok(far.safeRight - far.safeLeft < far.right - far.left, '安全域は絵の道より内側');
  const s8 = cfg.fieldScenes.find((s) => s.bgKey === '08'); assert.ok(CH.roadAt(s8, 0.9).x < 0.52 && CH.roadAt(s8, 0.55).x > 0.58, '08 水道橋の見える道：奥で右へ曲がる中央線');
  assert.equal(CH.roadAt({}, 0.5), null, 'road の無い背景は制限なし'); assert.deepEqual(CH.clampToRoad({}, 0.1, 0.5), { x: 0.1, clamped: false, road: null });
  let n = 0;
  for (const id of g.order) { const nd = g.nodes[id], s = cfg.fieldScenes.find((x) => x.id === nd.field), r = CH.roadAt(s, nd.my); assert.ok(nd.mx >= r.safeLeft && nd.mx <= r.safeRight, `${id}：安全域の中（${nd.mx} in ${r.safeLeft}〜${r.safeRight}）`); const lane = /[lr]_$/.test(nd.path) ? (nd.path.endsWith('l_') ? -1 : 1) : 0; assert.ok(Math.abs(nd.mx - (r.x + lane * 0.36 * r.half)) < 0.012, `${id}：中央線（左右の道は中央 ± 0.36×半幅（2026-10-06：0.42 → 0.36））の上（${nd.mx} vs ${r.x}）`); n++; }
  assert.equal(n, 85, '公式マス84＋スタート（2026-10-06）');
  const c = CH.clampToRoad(sc, 0.05, 0.7, 0.03); assert.equal(c.clamped, true); assert.ok(c.x >= c.road.safeLeft + 0.03 - 1e-9 && c.x < 0.55, `端に寄った x は安全域へ（${c.x}）`);
  assert.deepEqual(CH.clampToRoad(sc, 0.5, 0.47, 0.2).x, CH.roadAt(sc, 0.47).x, '安全域が体より狭ければ中央');
  const c2 = j(cfg); c2.chapterId = 3; c2.patternId = 'R'; c2.nodeOverrides = { p1_1: { monster: [0.02, 0.7] } }; const g2 = CH.registerConfig(c2);
  { const rr = CH.roadAt(c2.fieldScenes[0], 0.7); assert.ok(g2.nodes.p1_1.mx >= rr.safeLeft - 1e-9 && g2.nodes.p1_1.mx > 0.2, `nodeOverrides の止まる位置も安全域に収める（${g2.nodes.p1_1.mx} ≥ ${rr.safeLeft}）`); }
  const vm = { road: { center: [[0.3, 0.5], [0.97, 0.5]], vanish: 0.245, slope: 0.95, maxHalf: 0.5, safe: 0.7 } }; assert.equal(CH.roadAt(vm, 0.87).half, 0.5, '半幅を書かない背景は従来の消失点のモデル（2026-10-01 夜から Chapter 2 も半幅つき）');
});


test('DICE-06：サイコロの回転は最後に 360° の倍数（正式の角度）へ収束する（傾いたまま止まらない）。収束は最後の 0.15〜0.2 秒', () => {
  const w = {}; new Function('window', rd('js/phase7/progression.js'))(w); new Function('window', rd('js/chapter/dice-renderer.js'))(w); const D = w.MMCHD;
  for (const dir of [1, -1]) for (const spin of [900, 990, 1080]) {
    const fr = D.spinFrames(dir, spin, 0.19), last = fr[fr.length - 1], deg = parseFloat(last.transform.match(/rotate\(([-\d.]+)deg\)/)[1]);
    assert.equal(Math.abs(deg % 360), 0, `${dir}×${spin}：${deg}`); assert.equal(last.offset, 1);
    const before = fr[fr.length - 2]; assert.ok(Math.abs(1 - before.offset - 0.19) < 1e-9, '収束の区間');
  }
  const c = D.configure(); assert.ok(c.settleMs >= 150 && c.settleMs <= 200); assert.ok(c.ms >= 1400 && c.ms <= 2000 && c.airMs + c.impactMs + c.bounceMs + c.rollMs === c.ms, '出現〜完全停止 1.4〜2.0秒（2026-10-03：投げる・着地・跳ねる・転がる）'); assert.ok(c.resultMs >= 650 && c.resultMs <= 800, '停止面 0.65〜0.8秒（2026-10-04 G5：止まってから消えるまで約1秒＝止まった絵を落ち着いて見せる）');
});

test('BF-01：バトル画面の表示だけの補正（js/battle/fit.js）：fight()・.bt 系 CSS に触れず、寸法から「切れない最大の大きさ」を計算する', () => {
  const w = { addEventListener() {} }; new Function('window', rd('js/battle/fit.js'))(w); const F = w.MMBF;
  assert.deepEqual(F.compute({ top: 148, bottom: 371, width: 179, vsBottom: 371, height: 223 }), { size: 171, lift: 0 }, '390×844：使える高さ 223 − 余白');
  assert.deepEqual(F.compute({ top: 133, bottom: 293, width: 172, vsBottom: 293, height: 160 }), { size: 144, lift: 0 }, '375×667');
  assert.deepEqual(F.compute({ top: 100, bottom: 400, width: 120, vsBottom: 400, height: 300 }), { size: 112, lift: 0 }, '横幅で制限');
  assert.deepEqual(F.compute({ top: 100, bottom: 700, width: 400, vsBottom: 700, height: 600 }), { size: 210, lift: 0 }, '上限');
  assert.equal(F.compute({ top: 100, bottom: 360, width: 200, vsBottom: 400, height: 260 }).lift, 44, '技UIが絵の枠より上なら足元を上げる');
  const src = rd('js/battle/fit.js'); assert.doesNotMatch(src, /innerHTML|insertAdjacentHTML|createElement/, 'DOM を作らない（インラインの寸法だけ）');
  assert.doesNotMatch(rd('index.html').slice(rd('index.html').indexOf('<style>'), rd('index.html').indexOf('</style>')).split('\n').filter((l) => /^\.chf|^\.chd|^\.chs|^\.chw|^\.chh|^\.chp|^\.chm|^\.chc|^#app>\.chfw/.test(l)).join('\n'), /\.bt[\s.{]|#rl|#go|\.rl|\.rw/, 'Chapter の CSS はバトルのセレクタに触れない');
});

test('CH1-29：導入演出の「初回」の記録 introSeen は個体の Chapter の配置（m.raise.field）に持つ：出発で新しい配置（記録なし）→ Chapter の終了で配置ごと消える → 次の Chapter の出発でまた記録なし。読み込みの検査（validField・sanitize）で消えない', () => {
  const E = onCh1(71); const { P8, S, m, CH } = E;
  assert.equal(m.raise.field.introSeen, undefined, '出発した直後は記録なし（＝初回）');
  m.raise.field.introSeen = true;
  const S2 = P8.migrateSave(j(S)); assert.equal(S2.m.raise.field.introSeen, true, 'セーブ → 読み込みで残る'); assert.equal(CH.validField(S2.m.raise.field), true); CH.sanitize(S2.m); assert.equal(S2.m.raise.field.introSeen, true);
  m.raise.node = P8.trackOf(1).goal; m.raise.goal = true; P8.declineTournament(S, m);
  assert.equal(m.raise.field, null, 'Chapter の終了で配置ごと消える');
  P8.depart(S, m, lcg(72)); assert.deepEqual([m.raise.ch, m.raise.field.chapterId, m.raise.field.introSeen], [2, 2, undefined], '次の Chapter（潮風の海岸）の出発＝新しい配置＝初回');
  const code = rd('js/chapter/field-view.js').split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
  assert.match(code, /f\.introSeen/, '画面側は配置の introSeen で判定'); assert.doesNotMatch(code, /MMCHI\.shown\(/, 'sessionStorage の記録では判定しない');
});

// =========================================================
// Chapter 2「潮風の海岸」Pattern A（js/chapter/configs/ch2a.js。2026-10-01）
// =========================================================
test('CH2-01：Chapter 2 の config（正式背景・2026-10-01 夜の再設計）：フィールド 01〜09 → 大会会場前 の10枚をこの順にだけ通る。サイコロ 1〜3。06〜07 で左右の分岐（A 68歩・B 70歩）→ 07 の奥で合流。俯瞰図は演出専用', () => {
  const { CH, P8 } = loadEngine(), cfg = CH.getConfig(2), g = CH.buildGraph(cfg);
  assert.deepEqual([cfg.chapterId, cfg.patternId, cfg.title, cfg.playable], [2, 'A', '潮風の海岸', true]);
  assert.deepEqual(cfg.stageOrder, ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10']);
  assert.equal(cfg.fieldScenes.length, 10); assert.equal(new Set(cfg.fieldScenes.map((s) => s.bg)).size, 10, '背景はどれも1回だけ');
  assert.deepEqual(cfg.fieldScenes.map((s) => s.bg.replace('./assets/fields/ch2a/', '')), [...[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `field/ch2_field_0${i}.webp`), 'arena/ch2_arena_approach.webp'], '01→09→会場前の順');
  for (const s of cfg.fieldScenes) { assert.ok(existsSync(path.join(ROOT, s.bg)), s.bg); assert.deepEqual([s.w, s.h], [864, 1536]); assert.ok(s.road && s.road.center.length >= 6 && s.road.center.every((c) => c.length === 3), `${s.name}：中央線と半幅`); assert.ok(s.zoom.near > 1.32 && s.zoom.far > 1.95, `${s.name}：Chapter 1 より少し寄る`); }
  assert.ok(!cfg.fieldScenes.some((s) => /\/road\//.test(s.bg)), '旧背景（road/）は参照しない');
  assert.deepEqual(cfg.fieldScenes.map((s) => s.stage), ['coast', 'coast', 'coast', 'coast', 'coast', 'undersea', 'undersea', 'undersea', 'late', 'arena'], '海上 → 海中 → 海上 → 会場前');
  // 分岐：1か所（06 の s6_2）。A＝左寄り・B＝右寄り（同じ背景の同じ道の上）。どちらも 07 の奥の合流 m7_0 へ
  assert.deepEqual(g.branchAt, ['s6_2']); assert.deepEqual(g.conn.s6_2, ['a6_0', 'b6_0']); assert.deepEqual(g.conn.a7_3, ['m7_0']); assert.deepEqual(g.conn.b7_4, ['m7_0']); assert.deepEqual(g.conn.m7_0, ['s8_0']);
  assert.deepEqual(g.routes.map((r) => [r.branch, r.seq.length - 1]), [['A', 68], ['B', 70]], 'A 68歩・B 70歩（約70歩）'); assert.deepEqual(CH.routeLengths(g), { min: 68, max: 70, nodes: 78 });
  const per = (f, br) => g.order.filter((id) => g.nodes[id].field === f && (!g.nodes[id].branch || g.nodes[id].branch === br)).length;
  assert.deepEqual([1, 2, 3, 4, 5, 8, 9, 10].map((f) => per(f, 'A')), [8, 8, 6, 9, 7, 7, 8, 5], '背景ごとのマス数（同じ数にしない）'); assert.deepEqual([per(6, 'A'), per(7, 'A'), per(6, 'B'), per(7, 'B')], [6, 5, 7, 6], '06・07：共通3＋A(3・4)／B(4・5)＋合流1');
  for (const id of g.order.filter((x) => g.nodes[x].branch)) { const n = g.nodes[id], c = CH.roadAt(cfg.fieldScenes.find((s) => s.id === n.field), n.my).x; assert.ok(n.branch === 'A' ? n.mx < c - 0.02 : n.mx > c + 0.02, `${id}：${n.branch} は道の${n.branch === 'A' ? '左' : '右'}寄り`); }
  assert.deepEqual(cfg.branches.map((b) => [b.at, b.options.map((o) => [o.id, o.to])]), [['s6_2', [['A', 'a6_0'], ['B', 'b6_0']]]]);
  for (const r of g.routes) { const fs = r.seq.map((id) => g.nodes[id].field).filter((v, i, a) => i === 0 || a[i - 1] !== v); assert.deepEqual(fs, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], `${r.branch}：背景は 1→10 の順に1回ずつ`); }
  assert.deepEqual([g.start, g.goal], ['s1_0', 'sa_4']);
  const kinds = {}; for (const n of Object.values(g.nodes)) if (!['slot', 'normal'].includes(n.kind)) kinds[n.id] = n.kind; assert.deepEqual(kinds, { s1_0: 'start', s4_4: 'strong', sa_2: 'rival', sa_4: 'goal' }, '骨格：スタート・強敵（海上の大橋の真ん中）・ライバル（強制停止）・ゴール');
  assert.deepEqual([g.nodes.s6_2.kind, g.nodes.m7_0.kind], ['normal', 'normal'], '分かれ道・合流は何も起きない地点');
  assert.equal(g.nodes.sa_2.forceStop, true); assert.equal(P8.trackOf(2).nodes.sa_2.stop, true);
  assert.deepEqual([CH.rulesOf(cfg).diceSides, CH.rulesOf(cfg).turnLimit, CH.rulesOf(cfg).onTimeUp], [3, 40, 'end'], 'サイコロ 1〜3・40ターン（2026-10-01 夜・試遊用の値）');
  assert.equal(CH.rulesOf(CH.getConfig(1)).diceSides, 3, 'Chapter 1 も 1〜3（2026-10-01 夜）'); assert.equal(Object.keys(cfg.dice.resultSprites).length, 6, '4〜6 の停止画像は残す');
  // 止まる位置も、歩く途中の点も、道の安全域の中（分岐の道・海中の区間も）
  for (const id of g.order) { const n = g.nodes[id], s = cfg.fieldScenes.find((x) => x.id === n.field), r = CH.roadAt(s, n.my); assert.ok(n.mx >= r.safeLeft && n.mx <= r.safeRight, `${id}：道の安全域の中`); }
  for (const [a, tos] of Object.entries(g.conn)) for (const b of tos) { if (g.nodes[a].field !== g.nodes[b].field) continue; const s = cfg.fieldScenes.find((x) => x.id === g.nodes[a].field); for (const [x, y] of CH.routeBetween(g, a, b)) { const r = CH.roadAt(s, y); assert.ok(x >= r.safeLeft - 1e-6 && x <= r.safeRight + 1e-6, `${a}→${b}：歩く途中も道の上`); } }
  assert.match(cfg.intro.overviews.A, /\/ch2a\/intro\/ch2_intro_overview_v2\.webp$/); assert.ok(existsSync(path.join(ROOT, cfg.intro.overviews.A))); assert.ok(Array.isArray(cfg.intro.via) && cfg.intro.via.length >= 1);
  assert.ok(existsSync(path.join(ROOT, 'assets/fields/ch2a/road/ch2_01_early_a.webp')) && existsSync(path.join(ROOT, 'assets/fields/ch2a/intro/ch2_intro_overview.webp')), '旧素材はファイルだけ残す');
  // 配置：ルートごとの数は Chapter 1 と同じ範囲（マスを増やしても能力・イベント・宝箱・バトルは比例して増やさない）
  for (let s = 1; s <= 60; s++) { const L = CH.generateLayout(cfg, s); for (const r of g.routes) { const c = {}; for (const id of r.seq) { const a = L.assign[id]; if (a) c[a.t] = (c[a.t] || 0) + 1; } assert.ok(c.stat >= 12 && c.stat <= 15 && c.treasure <= 4 && c.battle <= 6 + 2, `seed ${s} ${r.branch}：${JSON.stringify(c)}`); } }
});

test('CH2-02：Chapter 1 を終えた個体が Chapter 2 へ出発できる（疲れ −50・40ターン・1〜3・配置は seed で固定）。ゴール（大会門）で公式大会へ。ターン切れは大会なしで Chapter 3 の前のファームへ（Chapter 3 の条件は QA-RL39）', () => {
  const E = onCh1(81); const { P8, S, m, CH } = E;
  m.raise.node = P8.trackOf(1).goal; m.raise.goal = true; m.raise.fatigue = 90; P8.declineTournament(S, m);
  assert.deepEqual([m.raise.state, m.raise.ch], ['farm', 2]); assert.equal(P8.canDepart(S, m).ok, true, 'Chapter 2 のマップがある');
  assert.equal(P8.depart(S, m, lcg(82)).ok, true);
  assert.deepEqual([m.raise.ch, m.raise.turnLimit, m.raise.field.chapterId, m.raise.field.patternId, m.raise.fatigue, m.raise.node, P8.diceSides(m)], [2, 40, 2, 'A', 40, 's1_0', 3]);
  for (let i = 0; i < 300; i++) { const v = E.P7.rollDie(P8.diceSides(m), Math.random); assert.ok(v >= 1 && v <= 3, `出目 ${v}`); }
  const seed = m.raise.field.layoutSeed, assign = JSON.stringify(m.raise.field.nodeAssignments);
  const S2 = P8.migrateSave(j(S)); assert.deepEqual([S2.m.raise.field.layoutSeed, JSON.stringify(S2.m.raise.field.nodeAssignments)], [seed, assign], '読み込み後も同じ配置');
  const t = turn(E, 3, null, DIE3); assert.equal(t.length, 3); assert.deepEqual(t, ['s1_1', 's1_2', 's1_3'], '1地点ずつ順に'); assert.equal(m.raise.node, 's1_3');
  m.raise.node = 'sa_3'; m.raise.pend = null; m.raise.fatigue = 0; turn(E, 3, null, DIE3); assert.deepEqual([m.raise.node, m.raise.pend.left], ['sa_4', 0], '出目がゴールを超えてもゴールで止まる');
  finishTurnAnyway(E); assert.deepEqual([m.raise.goal, P8.boardPhase(m)], [true, 'goal']); assert.equal(P8.canStartTournament(S, m, 0).ok, true, '公式大会へ');
  const E2 = onCh1(83); E2.m.raise.node = E2.P8.trackOf(1).goal; E2.m.raise.goal = true; E2.P8.declineTournament(E2.S, E2.m); E2.P8.depart(E2.S, E2.m, lcg(84));
  E2.m.raise.node = 's8_1'; E2.m.raise.turnsUsed = 39; E2.m.raise.fatigue = 0; turn(E2, 1, null, DIE3); finishTurnAnyway(E2);
  assert.equal(E2.P8.boardPhase(E2.m), 'timeup'); const end = E2.P8.endChapter(E2.S, E2.m); assert.deepEqual([end.ok, end.entry.reachedGoal, E2.m.raise.state, E2.m.raise.ch], [true, false, 'farm', 3], 'ターン切れ → 大会なし → Chapter 3 へ');
});

test('CH2-03：旧 Chapter 2（背景 road/ 10枚・ノード e1_〜z1_）の途中のセーブ：旧ノードは新しい構成に無いので、Chapter 2 の開始地点（0ターン）から。能力・所持金・疲れ・個体は保つ。セーブ形式は変えない', () => {
  const E = onCh1(91); const { P8, S, m, CH } = E;
  m.raise.node = P8.trackOf(1).goal; m.raise.goal = true; P8.declineTournament(S, m); P8.depart(S, m, lcg(92));
  // 旧構成のときの途中の状態を作る（旧ノード ID・旧配置）
  const f = m.raise.field; f.nodeAssignments = { e1_2: { t: 'stat', k: 'po' }, m2_3: { t: 'event', ev: 'shade' } }; f.fieldId = 5; m.raise.node = 'm2_3'; m.raise.turnsUsed = 12; m.raise.fatigue = 33;
  S.gold = 777; m.st = m.st || {}; const stats = JSON.stringify([m.li, m.po, m.in, m.hi, m.ev, m.de, m.st]), sp = m.sp;
  const S2 = P8.migrateSave(j(S)); assert.equal(S2.v, 6);
  assert.equal(P8.ensureBoardPosition(S2, S2.m).changed, true, 'ボードを開くときに作り直す（既存の安全処理）');
  assert.deepEqual([S2.m.raise.ch, S2.m.raise.node, S2.m.raise.turnsUsed, S2.m.raise.fatigue, S2.gold], [2, 's1_0', 0, 33, 777], '開始地点・0ターンから。疲れ・所持金はそのまま');
  assert.equal(JSON.stringify([S2.m.li, S2.m.po, S2.m.in, S2.m.hi, S2.m.ev, S2.m.de, S2.m.st]), stats, '能力はそのまま'); assert.equal(S2.m.sp, sp);
  assert.ok(CH.validField(S2.m.raise.field) && Object.keys(S2.m.raise.field.nodeAssignments).every((id) => /^(s\d|sa|[ab]\d|m7)_/.test(id)), '新しい配置');
});

test('CH2-04：分岐（06 の分かれ道 s6_2）：プレイヤーが A／B を選ぶ（出目では決めない）。選んだ道だけを1地点ずつ進み、どちらも合流 m7_0 → 08 へ。分岐中のセーブ・読み込みで、今の地点・選んだ道・分かれ道の待ち（残りの出目）を保つ（形式は変えない）', () => {
  for (const pick of ['a', 'b']) {
    const E = onCh1(95); const { P8, S, m, CH } = E;
    m.raise.node = P8.trackOf(1).goal; m.raise.goal = true; P8.declineTournament(S, m); P8.depart(S, m, lcg(96));
    m.raise.node = 's6_0'; m.raise.fatigue = 0;
    // 出目 3：s6_1 → s6_2（分かれ道）で止まり、選ぶまで進まない
    assert.equal(P8.roll(S, m, () => DIE3[3]).ok, true); P8.step(S, m); P8.step(S, m); assert.equal(P8.step(S, m).stage, 'branch', '分かれ道の先が2つ＝選ぶ');
    assert.deepEqual([m.raise.node, m.raise.pend.stage, m.raise.pend.left, m.raise.pend.opts], ['s6_2', 'branch', 1, ['a6_0', 'b6_0']]);
    assert.equal(CH.fieldOf(m).branch, null, '選ぶ前は道は決まっていない');
    // 分かれ道で待っている間のセーブ・読み込み
    const S1 = P8.migrateSave(j(S)); assert.deepEqual([S1.m.raise.node, S1.m.raise.pend.stage, S1.m.raise.pend.opts], ['s6_2', 'branch', ['a6_0', 'b6_0']]); assert.equal(P8.ensureBoardPosition(S1, S1.m).changed, false, '配置はそのまま');
    assert.equal(P8.chooseBranch(S, m, `${pick}6_9`).ok, false, '選択肢に無い地点へは進めない');
    assert.equal(P8.chooseBranch(S, m, `${pick}6_0`).ok, true); assert.equal(m.raise.node, `${pick}6_0`); assert.equal(CH.fieldOf(m).branch, pick.toUpperCase(), '選んだ道を配置に記録（既存の項目 m.raise.field.branch）');
    finishTurnAnyway(E);
    // 分岐の途中のセーブ・読み込み
    const S2 = P8.migrateSave(j(S)); assert.deepEqual([S2.m.raise.node, S2.m.raise.field.branch], [`${pick}6_0`, pick.toUpperCase()]); assert.equal(P8.ensureBoardPosition(S2, S2.m).changed, false);
    // 選んだ道だけを通って合流 → 08
    const seen = []; m.raise.pend = null;
    for (let k = 0; k < 20 && !seen.includes('s8_0'); k++) { m.raise.fatigue = 0; seen.push(...turn(E, 1, null, DIE3)); finishTurnAnyway(E); }
    const other = pick === 'a' ? 'b' : 'a';
    assert.ok(seen.every((id) => !id.startsWith(other)), `${pick}：選ばなかった道は通らない（${seen.join(' ')}）`);
    assert.deepEqual(seen.slice(-2), ['m7_0', 's8_0'], `${pick}：合流 m7_0 → 08`);
    assert.equal(seen.filter((id) => id.startsWith(pick)).length, pick === 'a' ? 6 : 8, 'A は 6地点・B は 8地点（合流の手前まで）');
  }
});

test('CH1-33：ソラモの後ろ向き歩行アニメ（2026-10-02 正式素材）：config.monsterSprites.solamo.walk＝8コマ（01→08）・停止の絵は 01・左右反転しない。素材は透過 WebP（同じ大きさ＝その場歩行）。画面は src を差し替えず、重ねたコマの表示を切り替える', async () => {
  const { CH } = loadEngine(), cfg = CH.getConfig(1), W = cfg.monsterSprites.solamo.walk, D = './assets/monsters/solamo_walk_back/';
  assert.deepEqual(W.frames, [1, 2, 3, 4, 5, 6, 7, 8].map((i) => `${D}solamo_walk_back_0${i}.webp`), '01→08 の順');
  assert.deepEqual([W.idle, W.noFlip, W.fps], [0, true, 12], '停止は 01・後ろ姿は反転しない・12fps（歩く速さで 55〜100%）');
  const sizes = W.frames.map((f) => { const b = readFileSync(path.join(ROOT, f)); assert.equal(b.toString('ascii', 0, 4) + b.toString('ascii', 8, 12), 'RIFFWEBP', f); assert.ok(b.includes(Buffer.from('ALPH')) || b.includes(Buffer.from('VP8L')), `${f}：透過あり`); return b.readUIntLE(24, 3) + 1 + 'x' + (b.readUIntLE(27, 3) + 1); });
  assert.equal(new Set(sizes).size, 1, `8コマとも同じ大きさ（${sizes[0]}。共通の切り抜き＝コマごとのずれを足さない）`);
  const FV = rd('js/chapter/field-view.js'), code = FV.split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
  assert.doesNotMatch(code, /\.chf-spr[^\n]*setAttribute\('src'/, 'コマの切り替えで src を差し替えない（再読み込み・ちらつきなし）');
  assert.match(code, /if \(state === 'walk' && !\(info && info\.calm\)\)/, '歩いている間だけループ');
  assert.match(code, /buildScene\(m, fieldId, true\);/, '背景の切り替え中は暗転を残す（新しい背景の上で明ける）'); assert.match(code, /keepVeil \? '\.chf-cam,\.chf-canopy'/);
  assert.match(code, /await switchField\(m, n\.field, id, cur, last\);\n\s+if \(last\) \{[^\n]*anim\('land'\)[^\n]*anim\('idle'\)/, '背景をまたいで止まるときも停止の姿勢へ');
});


test('CH1-34：通常マスは止まれる公式のマス（2026-10-02 の60マス再設計。旧 passNormal＝通過専用は廃止）：出目に数え、止まると何も起きずにターンが終わる。歩きの見た目の経由点（道の中央線の点）はマスではなく、出目に数えない', () => {
  const { CH } = loadEngine(), cfg = CH.getConfig(1), g = CH.buildGraph(cfg);
  assert.equal(cfg.rules.passNormal, undefined); assert.equal(CH.rulesOf(cfg).passNormal, undefined);
  const E = onCh1(3);
  for (const id of g.order) assert.equal(E.CH.isWaypoint(E.m, id), false, `${id}：どのマスも出目に数える`);
  // 通常マスに止まる：何も起きない（能力・所持金・疲れは出目のぶんだけ）・ターンは終わる
  const normal = g.order.find((id) => g.nodes[id].tile === 'normal' && g.nodes[id].kind === 'slot'), prev = g.order[g.order.indexOf(normal) - 1];
  E.m.raise.node = prev; E.m.raise.fatigue = 0; const before = j(E.m), gold = E.S.g;
  assert.deepEqual(turn(E, 1), [normal]); const fx = finishTurnAnyway(E).fx;
  assert.deepEqual(fx, { kind: 'none', note: 'normal' }); assert.equal(E.P8.boardPhase(E.m), 'roll', '次のターンへ');
  for (const k of ['li', 'po', 'in', 'hi', 'ev', 'de']) assert.equal(E.m[k], before[k]); assert.equal(E.S.g, gold); assert.equal(E.CH.fatigue(E.m), 3, '出目1の疲れだけ');
  // 経由点：隣のマスへ歩く道筋は複数の点（道の中央線）を通るが、出目は1つ＝マス1つ
  let many = 0;
  for (const p of cfg.paths) { const ns = g.order.filter((id) => g.nodes[id].path === p.id); for (let k = 1; k < ns.length; k++) { const r = CH.routeBetween(g, ns[k - 1], ns[k]); if (r.length > 2) many++; } }
  assert.ok(many >= 10, `経由点のある区間 ${many}`);
  const E2 = onCh1(4); E2.m.raise.node = 'p1_1'; const r = CH.routeBetween(g, 'p1_1', 'p1_2'); assert.ok(r.length >= 3, '道筋の点'); assert.deepEqual(turn(E2, 1), ['p1_2'], '経由点を通っても1歩');
  assert.equal(CH.getConfig(2).rules.passNormal, undefined, 'Chapter 2 は従来どおり');
});


test('CH1-35：Chapter開始の演出（2026-10-02 正式・2026-10-03 タイミング調整）：全景を止めて見せる →「Chapter 1」→「はじまりの草原」→ 開始の音 → 読める間と余韻 → 消える → 開始地点へカメラ移動 → FIELD 1。約4〜5秒。Chapter・Pattern ごとの違いは config.intro だけ（コードに Chapter 専用の値なし）', () => {
  const E = loadEngine(); new Function('window', rd('js/chapter/intro.js'))(E.w); const CI = E.w.MMCHI, cfg = E.CH.getConfig(1), I = cfg.intro;
  const T = CI.TIMING, total = T.stillMs + T.chapterInMs + T.nameInMs + T.titleHoldMs + T.titleOutMs + T.moveMs + T.uiInMs;
  assert.ok(total >= 4000 && total <= 5200, `全体 ${total}ms（4〜5秒程度）`);
  assert.ok(T.stillMs >= 600 && T.stillMs <= 900 && T.chapterInMs >= 350 && T.chapterInMs <= 500 && T.nameInMs >= 300 && T.nameInMs <= 450 && T.titleHoldMs >= 1200 && T.titleHoldMs <= 1600 && T.titleOutMs >= 300 && T.titleOutMs <= 400 && T.moveMs >= 1000 && T.moveMs <= 1500, JSON.stringify(T));
  assert.deepEqual([I.label, I.name], ['Chapter 1', 'はじまりの草原']);
  const c = CI.cameraOf(I, 'A'); assert.deepEqual(c.from, { x: 0.5, y: 0.5, zoom: 1 }); assert.ok(c.to.y > 0.85 && c.to.zoom > 2, '開始地点（全景の下端の小道）へ寄る');
  assert.equal(CI.imageOf(cfg, 'A'), './assets/fields/ch1a/intro/ch1_intro_overview.webp');
  // Pattern B／C は config に足すだけ（コードは同じ）：patterns[patternId] が優先、無ければ Chapter 全体の値
  const fake = { ...cfg, intro: { ...I, patterns: { ...I.patterns, B: { overview: 'b.webp', camera: { from: { x: 0.4, y: 0.3 }, to: { x: 0.6, y: 0.9, zoom: 2 }, via: [{ x: 0.5, y: 0.6, zoom: 1.4 }] } } } } };
  assert.equal(CI.imageOf(fake, 'B'), 'b.webp'); assert.deepEqual(CI.cameraOf(fake.intro, 'B').from, { zoom: 1, x: 0.4, y: 0.3 }); assert.equal(CI.cameraOf(fake.intro, 'B').via.length, 1);
  // 旧形式（Chapter 2 の goalFocus・startFocus・zoom・via）もそのまま使える
  const c2 = CI.cameraOf(E.CH.getConfig(2).intro, 'A'); assert.ok(c2.from.zoom === 1 && c2.to.zoom === 2.2 && c2.via.length === 2);
  const SRC = rd('js/chapter/intro.js').split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
  assert.doesNotMatch(SRC, /はじまりの草原|chapterId\s*===|ch1_intro/, 'intro.js に Chapter 専用の値を書かない');
  assert.match(SRC, /const skip = \(\) => \{ if \(skipped\) return;/, 'タップで飛ばす（何回押しても1回だけ）');
  const FV = rd('js/chapter/field-view.js');
  assert.match(FV, /if \(busyGet\(\) \|\| V\.intro\) return;/, '二重に始めない'); assert.match(FV, /w\.classList\.add\('chf-intro'\)/, 'イントロ中は UI・ソラモ・マスを出さない');
  assert.match(rd('index.html'), /\.chfw\.chf-intro #chf-ui,\.chfw\.chf-intro \.chf-mon,\.chfw\.chf-intro \.chf-tile,\.chfw\.chf-intro \.chf-obj\{opacity:0!important\}/);
});


test('CH1-36：ガウル・ノビトン・ジオルの歩行アニメ（2026-10-02 正式素材）：ガウル 6コマ・ノビトン 8コマ・ジオル 8コマ（無いコマは作らない）。透過 WebP・種族ごとに同じ大きさ。1周の時間はそろえる（ガウル 9fps×6 ≒ 12fps×8）。演出：野生バトル突入のカットイン（野生だけ）・能力マスの結果の枠・残りターンの警告（発火ターンは未決＝空）', () => {
  const { CH } = loadEngine(), cfg = CH.getConfig(1), S = cfg.monsterSprites;
  const want = { gauru: 6, nobiton: 8, jiol: 8 };
  for (const [sp, n] of Object.entries(want)) {
    const W = S[sp].walk; assert.equal(W.frames.length, n, `${sp}：${n}コマ`); assert.deepEqual([W.idle, W.noFlip], [0, true]);
    assert.deepEqual(W.frames, Array.from({ length: n }, (_, i) => `./assets/monsters/${sp}_walk/${sp}_walk_0${i + 1}.webp`));
    const sizes = W.frames.map((f) => { const b = readFileSync(path.join(ROOT, f)); assert.equal(b.toString('ascii', 0, 4) + b.toString('ascii', 8, 12), 'RIFFWEBP', f); assert.ok(b.includes(Buffer.from('VP8L')), `${f}：可逆 WebP（透過あり）`); return b.readUIntLE(21, 4) & 0x0fffffff; });
    assert.equal(new Set(sizes).size, 1, `${sp}：コマの大きさがそろっている`);
    assert.ok(Math.abs(n / W.fps - 8 / 12) < 0.01, `${sp}：1周の時間（${(n / W.fps).toFixed(2)}秒）は種族でそろえる`);
  }
  assert.equal(S.solamo.walk.frames.length, 8, 'ソラモはそのまま');
  for (let i = 7; i <= 8; i++) assert.ok(!existsSync(path.join(ROOT, `assets/monsters/gauru_walk/gauru_walk_0${i}.webp`)), 'ガウルの 7・8コマは作らない');
  // 演出：素材と割り当て
  assert.equal(cfg.battleTypes.wild.cutin, undefined, '2026-10-04 G3：野生の遭遇に赤い刃の交差のカットインは使わない（正式のモンスター＋魔法陣＋ENCOUNTER）'); assert.equal(cfg.battleTypes.rare.cutin, undefined); assert.equal(cfg.battleTypes.rival.cutin, undefined);
  assert.deepEqual(cfg.effects, { statUp: 'fx_stat_up', turnWarning: { asset: 'fx_turn_warning', at: [] } }, '残りターンの警告は発火ターン未決＝出さない');
  for (const k of ['fx_battle_encounter', 'fx_stat_up', 'fx_turn_warning']) assert.ok(existsSync(path.join(ROOT, cfg.assets[k])), k);
  const FV = rd('js/chapter/field-view.js');
  assert.match(FV, /const foe = rival \? null : foeImage\(m\)/); assert.match(FV, /if \(!ui \|\| V\.calm \|\| !text\)/);   // 2026-10-03：カットインは encounterShow（絵と文を同時に） assert.match(FV, /c: 'ok stat', frame: 'statUp'/); assert.match(FV, /if \(!W \|\| !Array\.isArray\(W\.at\) \|\| !W\.at\.length/, '発火ターンが空なら出さない');
});

test('CH1-38：2026-10-03 品質向上：HUD の進行ライン＝MMCH.progressOf（ターン数ではなく道の上の位置）。START 0 → ゴール 1。分かれ道のあとは選んだ道の残りで数える。HUD は進行ライン・Turn・疲れ・所持金・特訓チケットの小さなチップ', () => {
  const E = onCh1(101), { CH, m } = E, g = CH.graphFor(m);
  const at = (node, branch) => { m.raise.node = node; m.raise.field.branch = branch || null; return CH.progressOf(m); };
  assert.deepEqual([at(g.start).p, at(g.goal).p], [0, 1]);
  const a = at('p3l_1', 'power'), b = at('p5_2', 'power'), c = at('p10_0', 'forest'), d = at('p12_1', 'guard');
  assert.ok(a.p > 0 && a.p < b.p && b.p < c.p && c.p < d.p && d.p < 1, `進むほど増える ${[a.p, b.p, c.p, d.p].map((x) => x.toFixed(2))}`);
  const f = at('p6_0', 'forest'), br = at('p8_0', 'bridge');
  assert.equal(f.done + f.left, 64, '森の道＝64歩'); assert.equal(br.done + br.left, 64, '大橋の道＝64歩（2026-10-06）');
  m.raise.turnsUsed = 44; assert.equal(at('p3l_1', 'power').p, a.p, 'ターン数では変わらない');
  const FV = rd('js/chapter/field-view.js');
  for (const k of ['chh-line', 'chh-track', 'chh-face', 'id="chturn"', 'id="chfat"', 'id="chgold"', 'id="chtix"', 'chh-menu', 'MMCH.progressOf(m)']) assert.ok(FV.includes(k), k);
  assert.match(FV, /<span class="chh-se">START<\/span>[\s\S]*<span class="chh-se g">GOAL<\/span>/);
});

test('DICE-07：サイコロの停止（2026-10-04 PHASE H で作り直し。iPhone で「止まったあとも面が変わる」が残っていた）：見た目の切り替え（投げる10コマ・転がる面・出目の面・光）も動きと同じ Web Animations の時間軸に載せる。停止 S 以降の keyframe は同じ値・消えるまで終わらせない・src は変えない', () => {
  const D = rd('js/chapter/dice-renderer.js'), wa = D.slice(D.indexOf('  async function physicalWA('), D.indexOf('  /** 従来の見せ方（投げる10コマが無いとき）の WAAPI 版'));
  // 書き直しの理由：旧方式（setTimeout／rAF で class・src を変える）は、iOS の Safari で動き（合成スレッド）が止まったあとに、遅れたメインスレッドの面の切り替えが描かれた
  assert.match(wa, /const S = total - 300, fin = S - 160, r0 = air \+ imp \+ bnc \* 0\.55, D = S \+ 300 \+ C\.resultMs \+ 900;/, 'S＝停止・fin＝出目の面（まだ滑っている間）・D＝消えるまで');
  assert.match(wa, /blink\(el\.img, \[\[fin, Infinity\]\], D\)/, '出目の面は fin から消えるまで');
  assert.match(wa, /const fx = Math\.round\(lx \+ dir \* 44\), fy = Math\.round\(ly\);/, '2026-10-05：最終停止の位置は整数の画素'); assert.match(wa, /\{ transform: P\(fx, fy, 1\), offset: oS \},[^\n]*\n\s*\{ transform: P\(fx, fy, 1\), offset: 1 \},/, '位置は S 以降同じ'); assert.match(wa, /END = SNAP;/, '2026-10-05：最後の区間は漸近しない曲線（止まる瞬間がはっきり）'); assert.match(D, /function freezeFinal\(ov, value\) \{[^\n]*a\.pause\(\)/, '2026-10-05：最終停止の状態＝以後は補間しない');
  assert.match(wa, /\{ transform: 'rotate\(0deg\)', offset: oS \}, \{ transform: 'rotate\(0deg\)', offset: 1 \},/, '傾きは S で 0° のまま');
  assert.doesNotMatch(wa, /\.src\s*=|classList\.(add|remove|toggle)|\.finish\(\)/, '見た目の切り替えに src・class を使わない・アニメーションを途中で終わらせない');
  assert.match(D, /return el\.animate\(k\.map\(\(x\) => \(\{ \.\.\.x, easing: 'step-end' \}\)\), \{ duration: D, fill: 'forwards' \}\);/, '面は opacity の階段（補間しない）');
  assert.match(D, /final\(\) \{ if \(faceLock\) return; faceLock = true; if \(wa\) return;/, 'WAAPI の見せ方では final() は見た目を触らない');
  assert.match(D, /await Promise\.race\(\[Promise\.all\(\[img, \.\.\.rf, \.\.\.frs, roll\]\.filter\(Boolean\)\.map\(\(e\) => \(e\.decode/, '面・投げる10コマの絵のデコードを待ってから投げる'); assert.match(D, /await ensureReady\(value\);/);
  assert.doesNotMatch(D.replace(/\/\/[^\n]*/g, ''), /\bimg\.src = /, 'サイコロの面の src は差し替えない');
  assert.match(D, /ov\.style\.visibility = '';   \/\/ すべてのアニメーションを作ったあと、同じタスクで見せる/);
});
