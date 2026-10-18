// =========================================================
// 本編の Chapter 3「天空の浮島」＝1枚の世界のボード（2026-10-18。js/chapter/world-driver-ch3.js の MMWD3・js/proto/ch3-routes.js の MMRF_CH3）
//  C3-01 道のデータ：A／B／C 各 299地点・370接続・42区間＝Chapter 1 と同じ部品（地点 ID・役割・接続・条件）・START から全地点・全地点から GOAL・ライバルと H は必通・
//        ライバルの位置（A 60〜80%＝Chapter 1 A の形・B／C 50〜70%）・区間の平均の間隔・世界の内側・空の世界（雲海・浮島・空の橋）・目印の絵がある
//  C3-02 出発：Chapter 3 は新しい盤（1〜6・40ターン・ルート抽選・景観 S）・旧 Chapter 3 の途中のセーブは旧ボードのまま・MM_QA_OLD_CH3 なら登録しない
//  C3-03 通し（A／B／C 各 80回）：ゴールか40ターン・ライバル1回・Chapter 3 の成長量・能力 0〜999・保存→読み込みで同じ
//  C3-04 index.html の読み込み順・空の素材・QA の出目の固定は1回だけ・QA 移動は試遊の URL のときだけ
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const FILES = ['js/phase7/progression.js', 'js/phase8/league.js', 'js/phase8/raising.js', 'js/phase10/monsters.js', 'js/phase9/chapters.js', 'js/chapter/engine.js', 'js/chapter/configs/ch1a.js', 'js/chapter/configs/ch2a.js',
  'js/proto/roadfirst-data.js', 'js/proto/roadfirst-routes.js', 'js/proto/ch3-routes.js', 'js/proto/roadfirst-core.js', 'js/proto/roadfirst-play.js', 'js/proto/ch2-routes.js', 'js/chapter/world-driver.js', 'js/chapter/world-driver-ch2.js', 'js/chapter/world-driver-ch3.js'];
const SRC = Object.fromEntries(FILES.map((f) => [f, rd(f)]));
function load(pre = {}) {
  const w = { ...pre };
  for (const f of FILES) new Function('window', 'module', SRC[f])(w, undefined);
  for (const c of w.MMP9C.CHAPTERS) w.MMP7.registerChapterBoard(c.no, c.track, { provisional: false });
  return w;
}
const lcg = (seed) => { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };
const SIX = ['li', 'po', 'in', 'hi', 'ev', 'de'];
function setup(w, seed = 1, route = null) {
  const { MMP7: P7, MMP8: P8 } = w, S = P8.newSave();
  S.m = P8.initIndividual(S, { sp: 0, name: 'テスト', rk: 0, fa: 0, st: 0, li: 100, po: 100, in: 100, hi: 100, ev: 100, de: 100, sk: [0, 1, 2, 3], eq: [0, 1, 2, 3, -1, -1] });
  P7.ensureProg(S.m); for (let i = 0; i <= 2; i++) S.m.prog.rankClr[i] = true;   // Chapter 3 の解放条件（C クリア）
  Object.assign(S.m.raise, { state: 'farm', ch: 3, log: [{ ch: 1, reachedGoal: true, turnsUsed: 30 }, { ch: 2, reachedGoal: true, turnsUsed: 34 }], field: null, fatigue: 0 });
  if (route && w.MMWD3) w.MMWD3.setRoute(route);
  const r = P8.depart(S, S.m, lcg(seed)); assert.equal(r.ok, true, JSON.stringify(r)); assert.equal(r.key, 3);
  return S;
}
const store = (S) => ({ getItem: (k) => (k === 'mr4v6' ? JSON.stringify(S) : null), setItem() {}, removeItem() {} });
const reload = (w, S) => { const r = w.MMP8.loadFromStorage(store(S)); assert.equal(r.status, 'ok'); return r.S; };
function play(w, seed, route, every = 0) {
  const { MMP8: P8, MMWD3: WD } = w, rnd = lcg(seed * 7 + 3);
  let S = setup(w, seed, route), m = S.m;
  const seen = { rival: 0, stat: 0, reward: 0, branch: 0 };
  for (let g = 0; g < 4000; g++) {
    if (every && g % every === 0) { S = reload(w, S); m = S.m; }
    P8.ensureBoardPosition(S, m);
    const ph = P8.boardPhase(m);
    if (ph === 'goal' || ph === 'timeup') return { S, m, ph, seen };
    if (ph === 'roll') { if (!P8.canRoll(m) || m.raise.fatigue >= 86) P8.rest(S, m); else P8.roll(S, m, rnd); }
    else if (ph === 'move') P8.step(S, m);
    else if (ph === 'branch') { seen.branch++; const o = WD.branchOptions(m); assert.ok(o.length >= 2); assert.equal(P8.chooseBranch(S, m, o[Math.floor(rnd() * o.length)].id).ok, true); }
    else if (ph === 'resolve') { const r = P8.resolveLanding(S, m, rnd); if (r.choice) assert.equal(P8.resolveChoice(S, m, r.fx.options[0].id, rnd).ok, true); if (r.fx.kind === 'stat') seen.stat++; if (r.fx.kind === 'reward') seen.reward++; }
    else if (ph === 'battle') { if (m.raise.pend.fx.battleType === 'rival') seen.rival++; assert.equal(P8.skipBattleSquare(S, m).ok, true); }
    else throw new Error('想定外の局面 ' + ph);
  }
  throw new Error('終わらない seed=' + seed);
}
function reach(D, from, block) { const fwd = {}; for (const e of D.edges) (fwd[e[0]] = fwd[e[0]] || []).push(e[1]); const seen = new Set([from]), q = [from]; while (q.length) { const x = q.shift(); for (const y of fwd[x] || []) if (!seen.has(y) && y !== block) { seen.add(y); q.push(y); } } return seen; }

test('C3-01：道のデータ（Chapter 1 と同じ部品・空の世界）', () => {
  const w = load(), A1 = w.MMRF_DATA;
  for (const k of 'ABC') {
    const D = w.MMRF_CH3[k];
    assert.equal(D.chapter, 3); assert.equal(D.route, k); assert.ok(D.name);
    assert.equal(Object.keys(D.nodes).length, 299); assert.equal(D.edges.length, 370); assert.equal(Object.keys(D.segments).length, 42);
    const CONN = /^(S01|C0\d|S_END)_/;   // つなぎの区間（歩数は形ごと＝Chapter 1 の B／C と同じ）以外の地点 ID は Chapter 1 A と同じ
    assert.deepEqual(Object.keys(D.nodes).filter((i) => !CONN.test(i)).sort(), Object.keys(A1.nodes).filter((i) => !CONN.test(i)).sort(), '地点 ID は Chapter 1 と同じ（つなぎの区間を除く）');
    assert.deepEqual(Object.values(D.nodes).map((v) => v[2]).sort(), Object.values(A1.nodes).map((v) => v[2]).sort(), '役割の種類と数');
    const ce = (E) => E.filter((e) => !/^(S01|C0\d|S_END)$/.test(e[2])).map((e) => [e[2], e[3], e[4]]).sort();
    assert.deepEqual(ce(D.edges), ce(A1.edges), '接続の区間・向き・条件（つなぎの区間を除く）');
    assert.equal(reach(D, 'START').size, 299);
    for (const id of Object.keys(D.nodes)) assert.ok(reach(D, id).has('GOAL'), id);
    assert.ok(!reach(D, 'START', 'RIVAL').has('GOAL') && !reach(D, 'START', 'H').has('GOAL'), 'ライバルと H は必通');
    for (const v of Object.values(D.nodes)) assert.ok(v[0] >= 30 && v[0] <= 994 && v[1] >= 50 && v[1] <= 1510);
    for (const [sid, s] of Object.entries(D.segments)) { const P = s[3].map((i) => D.nodes[i]); const L = P.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - P[i][0], p[1] - P[i][1]), 0) / (P.length - 1); assert.ok(L >= 14 && L <= 29, `${k} ${sid} ${L.toFixed(1)}`); }
    assert.equal(D.art.sky, true); assert.ok(D.art.islands.length >= 40); assert.equal(D.art.terrain[0].kind, 'cloud'); assert.equal(D.art.terrain[0].bridges.length, 42);
    assert.ok(Array.isArray(D.calm) && D.calm.length);
    for (const L of D.art.landmarks) assert.ok(existsSync(path.join(ROOT, L.file.startsWith('./') ? L.file : 'assets/proto/board_art_1010/' + L.file)), L.file);
    for (const id of ['START', 'Q', 'RIVAL', 'H', 'CHALLENGE', 'GOAL']) assert.ok(D.places[id], id);
  }
});

test('C3-02：Chapter 3 の出発＝新しい盤（1〜6・40ターン・抽選・景観 S）・旧 Chapter 3 の途中は旧ボード・MM_QA_OLD_CH3', () => {
  const w = load(), S = setup(w, 5), m = S.m, f = m.raise.field;
  assert.equal(w.MMP8.driverFor(3, m), w.MMWD3.DRIVER); assert.equal(f.world, 1); assert.equal(f.chapterId, 3); assert.ok(['A', 'B', 'C'].includes(f.route));
  assert.equal(m.raise.turnLimit, 40); assert.equal(w.MMP8.diceSides(m), 6); assert.equal(w.MMWD3.visualOf(m), 'S'); assert.equal(w.MMWD3.active(m), true); assert.equal(w.MMWD.active(m), false);
  const cnt = { A: 0, B: 0, C: 0 }; for (let i = 0; i < 240; i++) cnt[setup(w, Math.imul(300 + i, 2654435761) >>> 0).m.raise.field.route]++;
  for (const k of 'ABC') assert.ok(cnt[k] > 50 && cnt[k] < 110, `ルートは各 1/3（${JSON.stringify(cnt)}）`);
  // 旧 Chapter 3（phase9 の空の道）の途中のセーブ
  const o = load({ MM_QA_OLD_CH3: true }), So = setup(o, 7), mo = So.m;
  assert.equal(o.MMWD3.isAttached(), false); assert.equal(mo.raise.field, null); assert.equal(o.MMP8.diceSides(mo), 3);
  const w2 = load(), S2 = reload(w2, So), m2 = S2.m;
  assert.equal(w2.MMWD3.oldBoard(m2), true); assert.notEqual(w2.MMP8.driverFor(3, m2), w2.MMWD3.DRIVER, '旧ボードの途中は旧ボードのまま'); assert.equal(w2.MMP8.diceSides(m2), 3);
});

test('C3-03：通し（A／B／C 各 80回）・ライバル1回・Chapter 3 の成長量・保存→読み込みで同じ', () => {
  const w = load(), M = w.MMP10M;
  for (const route of 'ABC') {
    let goal = 0;
    for (let seed = 1; seed <= 80; seed++) {
      const { m, ph, seen } = play(w, seed, route);
      assert.equal(m.raise.field.route, route); assert.ok(m.raise.turnsUsed <= 40);
      if (ph === 'goal') { goal++; assert.equal(m.raise.node, 'GOAL'); assert.equal(seen.rival, 1); }
      for (const k of SIX) assert.ok(m[k] >= 0 && m[k] <= 999);
    }
    assert.ok(goal > 30, `${route}：ゴールに着く回（${goal}/80）`);
    const a = play(w, 9, route), b = play(w, 9, route, 3);
    assert.deepEqual([b.m.raise.node, b.m.raise.turnsUsed, b.ph, ...SIX.map((k) => b.m[k])], [a.m.raise.node, a.m.raise.turnsUsed, a.ph, ...SIX.map((k) => a.m[k])]);
  }
  const S = setup(w, 21, 'B'), m = S.m, f = m.raise.field, statId = Object.keys(f.tiles).find((id) => f.tiles[id].t === 'stat'), k = f.tiles[statId].k, b0 = m[k];
  m.raise.node = statId; f.core.node = statId; m.raise.pend = { roll: 1, left: 0, stage: 'resolve' }; w.MMP8.resolveLanding(S, m, () => 0.5);
  assert.equal(m[k] - b0, M.GROWTH_GAIN_BY_CH[3][M.growthOf(m, k)], 'Chapter 3 の成長量');
  assert.equal(w.MMWD3.placeOf('GOAL', 'A'), '天空闘技場'); assert.equal(w.MMWD3.routeName('EL01', 'A'), '左の白い橋');
});

test('C3-04：index.html・空の素材・QA（出目の固定は1回・移動は試遊の URL だけ）', () => {
  const html = rd('index.html');
  const ix = (s) => html.indexOf(s);
  assert.ok(ix('js/proto/ch3-routes.js') > 0 && ix('js/chapter/world-driver-ch2.js') < ix('js/chapter/world-driver-ch3.js') && ix('js/chapter/world-driver-ch3.js') < ix('js/chapter/world-board.js'));
  assert.ok(ix('js/chapter/ch3-trial.js') > ix('js/chapter/world-board.js') && ix('js/qa/qa-jump-1018.js') > 0);
  for (const f of ['C3_UI_sky_medallion', 'C3_UI_sky_nameplate', 'C3_ENV_sky_flowering_tree', 'C3_ENV_floating_island_small_green', 'C3_ARCH_white_bridge_arch_pier', 'C3_FX_sky_waterfall_column']) assert.ok(existsSync(path.join(ROOT, 'assets/fields/ch3/sky_1016', f + '.webp')), f);
  const w = load(), S = setup(w, 3); w.MM_QA_DIE = 5; assert.equal(w.MMP8.roll(S, S.m, () => 0).value, 5); assert.equal(w.MM_QA_DIE, null, '1回使ったら消える');
  const q = {}; new Function('window', rd('js/qa/qa-jump-1018.js'))(Object.assign(q, { location: { search: '' } })); assert.equal(q.MMQAJ.on, false, '通常の URL では動かない');
  const q2 = {}; new Function('window', 'setInterval', rd('js/qa/qa-jump-1018.js'))(Object.assign(q2, { location: { search: '?ch3trial=B' } }), () => 0); assert.equal(q2.MMQAJ.on, true);
  assert.match(rd('js/chapter/world-board.js'), /3: \{ name: '天空の浮島'/);
});
