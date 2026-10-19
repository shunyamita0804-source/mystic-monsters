// =========================================================
// 本編の Chapter 4「灼熱の火山」A／B／C（2026-10-19。js/chapter/world-driver-ch4.js の MMWD4・js/proto/ch4-routes.js の MMRF_CH4・js/proto/ch4-world.js の MMRF_VOLC）
//  C4W-01 抽選：0〜999 の整数＝A 0〜333・B 334〜666・C 667〜999（境界）・100,000 回の分布（A 33.4%・B 33.3%・C 33.3% ±0.6pt）・プレイヤーは選ばない（固定は QA の変数だけ）
//  C4W-02 出発：新しい盤（1〜6・40ターン）・ルートは保存され再読み込み・ensure で決め直さない・旧 Chapter 4（20ターン）の途中は旧ボードのまま・MM_QA_OLD_CH4
//  C4W-03 通し（A／B／C 各 60回）：ゴールか40ターン・ライバルは全ルートで必ず1回（ゴールした回）・Chapter 4 の成長量・保存→読み込みで同じ
//  C4W-04 描画の部品・正式素材（v2 の台座を使わない・橋の床は採用の1枚）・index.html の読み込み順・設計書の B の文が実測と合う
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const FILES = ['js/phase7/progression.js', 'js/phase8/league.js', 'js/phase8/raising.js', 'js/phase10/monsters.js', 'js/phase9/chapters.js', 'js/chapter/engine.js', 'js/chapter/configs/ch1a.js', 'js/chapter/configs/ch2a.js',
  'js/proto/roadfirst-data.js', 'js/proto/roadfirst-routes.js', 'js/proto/ch3-routes.js', 'js/proto/roadfirst-core.js', 'js/proto/roadfirst-play.js', 'js/proto/ch2-routes.js', 'js/chapter/world-driver.js', 'js/chapter/world-driver-ch2.js', 'js/chapter/world-driver-ch3.js', 'js/proto/ch4-routes.js', 'js/chapter/world-driver-ch4.js'];
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
  P7.ensureProg(S.m); for (let i = 0; i <= 3; i++) S.m.prog.rankClr[i] = true;   // Chapter 4 の解放条件（B クリア）
  Object.assign(S.m.raise, { state: 'farm', ch: 4, log: [{ ch: 1, reachedGoal: true, turnsUsed: 30 }, { ch: 2, reachedGoal: true, turnsUsed: 34 }, { ch: 3, reachedGoal: true, turnsUsed: 33 }], field: null, fatigue: 0 });
  if (route && w.MMWD4) w.MMWD4.setRoute(route);
  const r = P8.depart(S, S.m, lcg(seed)); assert.equal(r.ok, true, JSON.stringify(r)); assert.equal(r.key, 4);
  return S;
}
const store = (S) => ({ getItem: (k) => (k === 'mr4v6' ? JSON.stringify(S) : null), setItem() {}, removeItem() {} });
const reload = (w, S) => { const r = w.MMP8.loadFromStorage(store(S)); assert.equal(r.status, 'ok'); return r.S; };
function play(w, seed, route, every = 0) {
  const { MMP8: P8, MMWD4: WD } = w, rnd = lcg(seed * 7 + 3);
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


test('C4W-01：ルートの抽選（0〜999・A 334／B 333／C 333）', () => {
  const w = load(), W = w.MMWD4;
  const b = { 0: 'A', 333: 'A', 334: 'B', 500: 'B', 666: 'B', 667: 'C', 999: 'C' };
  for (const [n, k] of Object.entries(b)) assert.equal(W.routeOfInt(+n), k, `${n} → ${k}`);
  const cntI = { A: 0, B: 0, C: 0 }; for (let n = 0; n < 1000; n++) cntI[W.routeOfInt(n)]++;
  assert.deepEqual(cntI, { A: 334, B: 333, C: 333 }, '0〜999 の内訳');
  assert.equal(W.drawRoute(() => 0), 'A'); assert.equal(W.drawRoute(() => 0.3339), 'A'); assert.equal(W.drawRoute(() => 0.334), 'B'); assert.equal(W.drawRoute(() => 0.667), 'C'); assert.equal(W.drawRoute(() => 0.99999999), 'C');
  const rnd = lcg(20261019), cnt = { A: 0, B: 0, C: 0 }, N = 100000; for (let i = 0; i < N; i++) cnt[W.drawRoute(rnd)]++;
  for (const [k, p] of [['A', 33.4], ['B', 33.3], ['C', 33.3]]) assert.ok(Math.abs((cnt[k] / N) * 100 - p) < 0.6, `${k}：${(cnt[k] / N * 100).toFixed(2)}%`);
  assert.equal(W.forcedRoute(), null, '本番はプレイヤーが選ばない（固定なし）');
  const q = load({ MM_CH4ROUTE: 'C' }); assert.equal(q.MMWD4.forcedRoute(), 'C', 'QA の変数のときだけ固定');
  assert.ok(!/ch4route|MMWD4/.test(rd('index.html').replace(/<script[^>]*ch4[^>]*><\/script>/g, '')), 'index.html に選択の画面・入口は無い');
});

test('C4W-02：Chapter 4 の出発＝新しい盤・ルートの保存・旧 Chapter 4 の途中は旧ボード', () => {
  const w = load(), S = setup(w, 5), m = S.m, f = m.raise.field;
  assert.equal(w.MMP8.driverFor(4, m), w.MMWD4.DRIVER); assert.equal(f.world, 1); assert.equal(f.chapterId, 4); assert.ok(['A', 'B', 'C'].includes(f.route));
  assert.equal(m.raise.turnLimit, 40); assert.equal(w.MMP8.diceSides(m), 6); assert.equal(w.MMWD4.active(m), true); assert.equal(w.MMWD3.active(m), false);
  assert.equal(Object.keys(w.MMWD4.dataOf(m).nodes).length, { A: 320, B: 301, C: 294 }[f.route]);
  const r0 = f.route, S2 = reload(w, S); w.MMP8.ensureBoardPosition(S2, S2.m); assert.equal(S2.m.raise.field.route, r0, '再読み込みで決め直さない');
  for (let i = 0; i < 5; i++) { w.MMWD4.DRIVER.ensure(S2, S2.m, Math.random); assert.equal(S2.m.raise.field.route, r0); }
  // 旧 Chapter 4（phase9 の火山の道・20ターン）の途中のセーブ
  const o = load({ MM_QA_OLD_CH4: true }), So = setup(o, 7), mo = So.m;
  assert.equal(o.MMWD4.isAttached(), false); assert.equal(mo.raise.field, null); assert.equal(mo.raise.turnLimit, 20); assert.equal(o.MMP8.diceSides(mo), 3);
  const w2 = load(), S3 = reload(w2, So), m3 = S3.m;
  assert.equal(w2.MMWD4.oldBoard(m3), true); assert.notEqual(w2.MMP8.driverFor(4, m3), w2.MMWD4.DRIVER, '旧ボードの途中は旧ボードのまま（巻き戻さない）'); assert.equal(m3.raise.turnLimit, 20);
});

test('C4W-03：通し（A／B／C 各 60回）・ライバルは全ルートで必通・Chapter 4 の成長量・保存→読み込みで同じ', () => {
  const w = load(), M = w.MMP10M;
  for (const route of 'ABC') {
    let goal = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const { m, ph, seen } = play(w, seed, route);
      assert.equal(m.raise.field.route, route); assert.ok(m.raise.turnsUsed <= 40);
      if (ph === 'goal') { goal++; assert.equal(m.raise.node, 'GOAL'); assert.equal(seen.rival, 1, 'ライバルは強制で1回'); }
      for (const k of SIX) assert.ok(m[k] >= 0 && m[k] <= 999);
    }
    assert.ok(goal >= 15, `${route}：ゴールに着く回（${goal}/60・この通しは食事なし・寄り道ありの単純な進め方）`);
    const a = play(w, 9, route), b = play(w, 9, route, 3);
    assert.deepEqual([b.m.raise.node, b.m.raise.turnsUsed, b.ph, ...SIX.map((k) => b.m[k])], [a.m.raise.node, a.m.raise.turnsUsed, a.ph, ...SIX.map((k) => a.m[k])]);
  }
  const S = setup(w, 21, 'B'), m = S.m, f = m.raise.field, statId = Object.keys(f.tiles).find((id) => f.tiles[id].t === 'stat'), k = f.tiles[statId].k, b0 = m[k];
  m.raise.node = statId; f.core.node = statId; m.raise.pend = { roll: 1, left: 0, stage: 'resolve' }; w.MMP8.resolveLanding(S, m, () => 0.5);
  assert.equal(m[k] - b0, M.GROWTH_GAIN_BY_CH[4][M.growthOf(m, k)], 'Chapter 4 の成長量');
  assert.equal(w.MMWD4.placeOf('GOAL', 'A'), '火口縁の闘技場'); assert.equal(w.MMWD4.routeName('Q_R1', 'B'), '黒曜の双橋（東岸へ）');
});

test('C4W-04：描画の部品・正式素材・読み込み順・設計書の B の文', () => {
  const V = (() => { const w = {}; new Function('window', 'module', rd('js/proto/ch4-world.js'))(w, undefined); return w.MMRF_VOLC; })();
  assert.equal(V.flat, true, '火山の盤は平ら（マスを持ち上げない）');
  for (const k of ['load', 'ground', 'roads', 'scatter', 'lm', 'apron', 'build3d']) assert.equal(typeof V[k], 'function', k);
  const js = rd('js/proto/ch4-world.js');
  assert.ok(!/EVENT_BASE_v2|event_base_v2/.test(js), '市松の焼き込みの v2 の台座は使わない');
  assert.equal(V.DECK, 'bridge_deck_v3', '橋の床は比較して採用した v3');
  const used = [...new Set([...js.matchAll(/U\('([a-z_0-9]+)'\)/g)].map((x) => x[1]).concat(Object.values(V.IMG), Object.values(V.TEX).map((t) => t[0]), ['curb_l', 'curb_r', 'rail_l', 'rail_r']))];
  for (const n of used) assert.ok(existsSync(path.join(ROOT, 'assets/fields/ch4/art_1019', n + '.webp')), n);
  assert.ok(existsSync(path.join(ROOT, 'assets/fields/ch4/intro/ch4_overview.webp')));
  const d = JSON.parse(rd('tools/ch4art1019/derive.json')); assert.ok(!Object.keys(d.originals).some((k) => /EVENT_BASE_v2/.test(k))); assert.ok(d.originals['C4_UI_01_EVENT_BASE_v3_ALPHA.png']);
  // 高さ（art.elev）で夕暮れ → 薄暮 → 夜
  const w = load(); for (const k of 'ABC') { const D = w.MMRF_CH4[k]; const ph = (id) => V.phaseOf(D, V.elevAt(D, D.nodes[id][0], D.nodes[id][1])); assert.equal(ph('START'), 'dusk'); assert.equal(ph('GOAL'), 'night', k); }
  const md = rd('docs/ch4/DESIGN.md'); assert.ok(!/能力の伸び・報酬の取得が3ルートで最も大きい/.test(md), 'B の文は実測（報酬の取得率は C が最も高い）に合わせる');
});
