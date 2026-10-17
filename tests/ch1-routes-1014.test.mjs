// =========================================================
// 2026-10-14 Chapter 1 B／C 独立ルート（js/proto/roadfirst-routes.js＝MMRF_ROUTES・tools/roadfirst/build_routes.py）
//  RT-01 A は変えない（roadfirst-data.js の sha256）・B／C は 299地点／370接続／42区間・A と同じ部品（区間の種類・長さ・条件・役割）
//  RT-02 到達性：START から全地点・全地点から GOAL・ライバルと H を必ず通る・ライバルの位置は本線の 50〜70%・H まで 79／80歩（A と同じ）・寄り道は戻れる
//  RT-03 左右の向き：J0／Q／H の左の道（EL／Q_L／LATE_L）は3ルートとも進む向きの左＝能力の道の偏り（左＝物理）が見た目と合う
//  RT-04 固定報酬・隠れ家・レアの候補：7か所の中身は共通（TUNING.rewards）・名前だけルートごと・レアの候補 Z1／Z2 は B／C でも通常の地点で行き止まりではない
//  RT-05 能力の道の偏り：本編（bias:true）だけ・能力マスの数と位置とほかのマスは同じ seed で変わらない・偏った道で対象の能力が多い・試作は従来どおり
//  RT-06 景観と目印：B／C の目印 20枚は実在・透過・景観の区域は実在する区間でできている・道の名前・フィナの一言・場所の名前がルートごとにある
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEngine } from './chapter-sim.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p));
loadEngine();
await import('../js/proto/roadfirst-data.js'); await import('../js/proto/roadfirst-routes.js'); await import('../js/proto/roadfirst-core.js'); await import('../js/proto/roadfirst-play.js');
const A = globalThis.MMRF_DATA, R = globalThis.MMRF_ROUTES, P = globalThis.MMRF_PLAY, C = globalThis.MMRF_CORE;
const CONN = new Set(['S01', 'C01', 'C02', 'C03', 'C04', 'C05', 'S_END']);
const SPUR = (D, k) => /spur/.test(D.segments[k][2]);
function reach(D, start, block) { const f = {}; for (const e of D.edges) (f[e[0]] = f[e[0]] || []).push(e[1]); const seen = new Set([start]), q = [start];
  while (q.length) { const x = q.shift(); for (const y of f[x] || []) if (!seen.has(y) && y !== block) { seen.add(y); q.push(y); } } return seen; }
function mainRoutes(D) {
  const nx = {}; for (const [k, s] of Object.entries(D.segments)) if (!SPUR(D, k)) (nx[s[0]] = nx[s[0]] || []).push(k);
  const out = []; const walk = (n, p) => { if (n === 'GOAL') return out.push(p); for (const k of nx[n] || []) walk(D.segments[k][1], p.concat(k)); }; walk('START', []);
  const L = (k) => D.segments[k][3].length - 1, at = (p, id) => { let s = 0; for (const k of p) { s += L(k); if (D.segments[k][1] === id) return s; } return null; };
  return out.map((p) => ({ tot: p.reduce((a, k) => a + L(k), 0), rival: at(p, 'RIVAL'), h: at(p, 'H') }));
}

test('RT-01：A は変えない・B／C は 299／370／42・A と同じ部品', () => {
  assert.equal(createHash('sha256').update(rd('js/proto/roadfirst-data.js')).digest('hex'), 'a9d22c787f41533fd7c606ff05a30e7507a3d5f3902da47486f5c762b9a96a4d', 'A のデータは main と同じ');
  assert.deepEqual(Object.keys(R), ['B', 'C']);
  for (const [k, D] of Object.entries(R)) {
    assert.equal(D.route, k); assert.equal(Object.keys(D.nodes).length, 299); assert.equal(D.edges.length, 370); assert.equal(Object.keys(D.segments).length, 42);
    assert.deepEqual(Object.keys(D.segments), Object.keys(A.segments), k + '：区間の並びは A と同じ（配置の乱数の順）');
    assert.deepEqual(Object.values(D.nodes).map((n) => n[2]).sort(), Object.values(A.nodes).map((n) => n[2]).sort(), k + '：役割の数は A と同じ');
    for (const [sid, s] of Object.entries(A.segments)) {
      const b = D.segments[sid]; assert.equal(b[2], s[2], sid);
      if (!CONN.has(sid)) { assert.deepEqual([b[0], b[1], b[3].length], [s[0], s[1], s[3].length], `${k} ${sid}：部品は A と同じ`); assert.deepEqual(b[3], s[3], `${k} ${sid}：地点 ID も同じ`); }
    }
    const key = (D2) => D2.edges.filter((e) => !CONN.has(e[2])).map((e) => e.join('|')).sort();
    assert.deepEqual(key(D), key(A), k + '：部品の接続（向き・条件）は A と同じ');
    for (const [id, n] of Object.entries(D.nodes)) assert.ok(n[0] >= 30 && n[0] <= 994 && n[1] >= 50 && n[1] <= 1510, `${k} ${id} は世界の中`);
    assert.notDeepEqual(D.nodes.GOAL, A.nodes.GOAL, k + '：GOAL の位置は A と違う');
  }
  assert.notDeepEqual(R.B.nodes.GOAL, R.C.nodes.GOAL);
});

test('RT-02：到達性・ライバルと H を必ず通る・ライバルは本線の 50〜70%・H まで 79／80歩・寄り道は戻れる', () => {
  for (const [k, D] of Object.entries(R)) {
    assert.equal(reach(D, 'START').size, 299, k + '：START から全地点');
    for (const id of Object.keys(D.nodes)) assert.ok(reach(D, id).has('GOAL'), `${k} ${id} から GOAL へ`);
    assert.ok(!reach(D, 'START', 'RIVAL').has('GOAL') && !reach(D, 'START', 'H').has('GOAL'), k + '：ライバル・H を通らずに GOAL へ行けない');
    const ms = mainRoutes(D); assert.equal(ms.length, 16);
    for (const m of ms) { assert.ok(m.rival / m.tot >= 0.5 && m.rival / m.tot <= 0.7, `${k}：ライバル ${m.rival}/${m.tot}`); assert.ok([79, 80].includes(m.h), `${k}：H ${m.h}`); assert.ok([65, 66].includes(m.rival)); }
    assert.deepEqual([...new Set(ms.map((m) => m.tot))].sort((a, b) => a - b), [97, 98, 112, 113, 118, 119, 121, 122], k + '：本線の総歩数は A と同じ');
    for (const sid of Object.keys(D.segments)) if (SPUR(D, sid)) { const end = D.segments[sid][1]; assert.ok(reach(D, end).has(D.segments[sid][0]), `${k} ${sid}：行き止まりから戻れる`); }
  }
  for (const m of mainRoutes(A)) assert.ok([76, 77].includes(m.rival) && [79, 80].includes(m.h), 'A のライバル・H は従来のまま');
  // 本物の進み方（MMRF_CORE）で、寄り道・挑戦・隠れ家を含めて最後まで行ける
  for (const [k, D] of Object.entries(R)) for (let s = 1; s <= 200; s++) { const st = P.simulate(D, C, { seed: s * 131 + 7, p: { spurs: ['D_RAND', 'D_LC'] }, randOpen: true }); assert.equal(st.stuck, 0, `${k} seed ${s}`); }
});

test('RT-03：左右の向き＝J0／Q／H の左の道は3ルートとも進む向きの左', () => {
  const ang = (D, at, lane) => { const N = D.nodes, inc = Object.values(D.segments).find((s) => s[1] === at && !SPUR(D, Object.keys(D.segments).find((x) => D.segments[x] === s)));
    const p = N[inc[3][inc[3].length - 2]], a = N[at], q = N[D.segments[lane][3][2]], hx = a[0] - p[0], hy = a[1] - p[1], dx = q[0] - a[0], dy = q[1] - a[1];
    return Math.atan2(hx * dy - hy * dx, hx * dx + hy * dy); };
  for (const [k, D] of Object.entries({ A, ...R })) {
    assert.ok(ang(D, 'J0', 'EL01') < ang(D, 'J0', 'ER01'), k + '：J0 は EL が左');
    assert.ok(ang(D, 'Q', 'Q_L1') < ang(D, 'Q', 'Q_R1'), k + '：Q は奇数（Q_L）が左');
    assert.ok(ang(D, 'H', 'LATE_L1') < ang(D, 'H', 'LATE_SAFE') && ang(D, 'H', 'LATE_SAFE') < ang(D, 'H', 'LATE_R1'), k + '：H は 挑戦・安全・石像 の順に左から');
  }
});

test('RT-04：固定報酬・隠れ家は中身が共通（名前だけルートごと）・レアの候補は B／C でも通常の地点・行き止まりではない', () => {
  const REW = ['L_CHEST', 'R_CHEST', 'L_ALTAR', 'L_LATE_ALTAR', 'REWARD5', 'R_SPECIAL', 'RANDOM_DEN'];
  for (const D of [A, R.B, R.C]) for (const id of REW) assert.match(D.nodes[id][2], /dead_end/, id);
  for (const id of REW) assert.ok(P.TUNING.rewards[id], id + '：中身は TUNING.rewards の1か所（ルートで分けない）');
  const cand = Object.values(P.TUNING.rare.zones).flat(); assert.equal(cand.length, 38);
  for (const D of [A, R.B, R.C]) for (const id of cand) { assert.equal(D.nodes[id][2], 'ordinary_tile', id); const s = D.segments[D.nodes[id][3]]; assert.ok(!/spur/.test(s[2]), id + '：寄り道ではない'); }
  // 配置：1育成にレアは最大1マス・候補の中だけ・約10%
  for (const D of [R.B, R.C]) { let hit = 0; for (let s = 1; s <= 2000; s++) { const t = P.layout(D, s, { route: D.route, bias: true }); const r = Object.keys(t).filter((id) => t[id].rare); assert.ok(r.length <= 1); if (r.length) { hit++; assert.ok(cand.includes(r[0])); } } assert.ok(hit > 150 && hit < 260, `${D.route}：約10%（${hit}/2000）`); }
});

test('RT-05：能力の道の偏り＝本編だけ・能力マス以外は同じ seed で同じ・偏った道で対象の能力が多い・試作は従来どおり', () => {
  const SB = P.TUNING.statBias; assert.equal(SB.weight, 3);
  assert.deepEqual(SB.lanes.EL01, ['po', 'de']); assert.deepEqual(SB.lanes.ER04, ['in', 'hi']); assert.deepEqual(SB.lanes.LATE_L_SUCCESS1, ['po', 'in']); assert.deepEqual(SB.lanes.LATE_SAFE, ['li', 'ev']); assert.deepEqual(SB.lanes.LATE_R2, ['li', 'ev']);
  for (const k of ['Q_L1', 'Q_R4', 'S01', 'C05', 'S_END', 'D_LA', 'D_RAND']) assert.equal(SB.lanes[k], undefined, k + '：偏りなし');
  const tally = {}; let n = 0;
  for (const D of [A, R.B, R.C]) for (let s = 1; s <= 1500; s++) {
    const t0 = P.layout(D, s), t1 = P.layout(D, s, { bias: true, route: D.route === undefined ? 'A' : D.route }), t2 = P.layout(D, s, { route: D.route });
    if (!D.route) assert.deepEqual(t2, t0, '偏りなしは従来の配置');
    for (const id of new Set([...Object.keys(t0), ...Object.keys(t1)])) {
      const a = t0[id], b = t1[id]; if (!D.route) { assert.equal(!!a, !!b, id); if (a && a.t !== 'stat') assert.deepEqual(b, a, id); if (a) assert.equal(b.t, a.t, id); }
      if (b && b.t === 'stat') { const sid = D.nodes[id][3]; const g = SB.lanes[sid] ? SB.lanes[sid].join('') : '-'; (tally[g] = tally[g] || {})[b.k] = (tally[g][b.k] || 0) + 1; n++; }
    }
  }
  const share = (g, k) => tally[g][k] / Object.values(tally[g]).reduce((a, b) => a + b, 0);
  for (const [g, ks] of [['pode', ['po', 'de']], ['inhi', ['in', 'hi']], ['poin', ['po', 'in']], ['liev', ['li', 'ev']]]) for (const k of ks) assert.ok(share(g, k) > 0.25, `${g} の ${k} は多い（${share(g, k).toFixed(3)}）`);
  for (const k of ['li', 'po', 'in', 'hi', 'ev', 'de']) assert.ok(Math.abs(share('-', k) - 1 / 6) < 0.02, '偏りの無い区間は均等');
  // 試作（?chapterBoard=roadfirst）の配置は従来どおり＝attach は偏りなし
  const st = C.create(A, { seed: 77 }); const pl = P.attach(A, st, {}); assert.deepEqual(pl.play.tiles, P.layout(A, 77));
  const WD = readFileSync(path.join(ROOT, 'js/chapter/world-driver.js'), 'utf8'); assert.match(WD, /P\(\)\.layout\(d, s, \{ route: rk, bias: true(, pool: cfg\.pool \? cfg\.pool\(\) : undefined)? \}\)/, '本編の新しい配置だけ偏りあり');
});

test('RT-06：B／C の目印 20枚・景観の区域・名前・一言', () => {
  for (const [k, D] of Object.entries(R)) {
    const L = D.art.landmarks; assert.equal(L.length, 9);
    for (const l of L) { assert.ok(D.nodes[l.node], l.node); for (const f of [l.file, l.open].filter(Boolean)) { const p = path.join(ROOT, f); assert.ok(existsSync(p), f); const b = readFileSync(p); assert.equal(b.toString('ascii', 8, 12), 'WEBP', f); } }
    for (const T of D.art.terrain) { for (const [sid] of T.loop || []) assert.ok(D.segments[sid], `${k} ${T.id} ${sid}`); }
  }
  const W = {}; new Function('window', readFileSync(path.join(ROOT, 'js/chapter/world-driver.js'), 'utf8'))(W);
  const M = W.MMWD;
  for (const k of ['B', 'C']) {
    for (const s of ['EL01', 'ER01', 'LATE_SAFE', 'LATE_L1', 'LATE_R1', 'D_LC', 'D_LA', 'D_RC', 'D_LLA', 'D_R5', 'D_RS', 'D_RAND']) assert.ok(M.ROUTE_NAME_BY[k][s] && M.routeName(s, k) === M.ROUTE_NAME_BY[k][s], `${k} ${s}`);
    for (const id of ['L_CHEST', 'R_CHEST', 'L_ALTAR', 'L_LATE_ALTAR', 'REWARD5', 'R_SPECIAL', 'RANDOM_DEN']) assert.ok(M.REWARD_TITLE_BY[k][id], `${k} ${id}`);
    for (const id of ['ch1_start', 'w_left', 'w_right', 'w_merge', 'w_rival_before', 'w_safe', 'w_statue', 'w_castle']) { assert.ok(M.STORY.find((e) => e.id === id), id); assert.ok(M.STORY_LINES_BY[k][id], `${k} ${id}`); }
  }
  assert.equal(M.routeName('EL01', 'A'), '左の道（崩落の谷の左岸）', 'A は従来の名前'); assert.equal(M.placeOf('STATUE', 'A'), 'ライオン石像'); assert.equal(M.placeOf('STATUE', 'B'), '白鳥の石像');
});
