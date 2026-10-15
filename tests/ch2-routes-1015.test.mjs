// =========================================================
// Chapter 2「潮風の海岸」A／B／C 連続世界ボードの設計案（2026-10-15・未承認・限定試作）＝js/proto/ch2-routes.js（MMRF_CH2）
//  C2-01 データ：3ルートとも MMRF_DATA と同じ形・役割の語彙・固定の規則（D6・40ターン）。Q／特殊挑戦／隠れ家 各1・固定報酬 6・ライバル 1・地点は 280〜320（2026-10-15 追補・論点 4）
//  C2-02 到達性：START から全地点・全地点から GOAL・ライバルと潮の塔（下降）を通らずに GOAL へ行けない・寄り道（行き止まり）から戻れる
//  C2-03 3ルートは別のグラフ（区間の並び・接続・本線の歩数が互いに違う）＝見た目だけの複製ではない
//  C2-04 実際の進行（MMRF_CORE）：運命の分かれ道（奇数＝左／偶数＝右）・特殊挑戦（5／6）・寄り道の往復・大きな出目でライバルを飛ばせない・40ターンの時間切れ
//  C2-06 2026-10-15 追補（論点 2・3・5）：特殊挑戦は成功＝近道・失敗＝回り道・高さ（海面 0・海底 −depth・下降／螺旋塔の上昇は単調）・螺旋塔 12〜13 歩・海底の地点は盆地の中・
//        報酬 7 枠の中身の種類と数は Chapter 1 と同じ・探索路（explore）は道のデータにある区間
//  C2-07 試作の進行が道のデータの割り当てを使う（報酬の中身・能力の道の偏り）・Chapter 1 のデータでは従来どおり
//  C2-08 2026-10-15 追補2：道のデータ・tools/ch2/out/summary.json・設計書（DESIGN.md）の数値が一致（地点数 A 298・B 280・C 304、特殊挑戦の成功／失敗 A 6／20・B 2／14・C 6／18、螺旋塔）
//  C2-05 隔離：本編（world-driver・world-board・raising.js）と Chapter 1 の試作のデータ（roadfirst-data.js・roadfirst-routes.js）は ch2-routes を参照しない・保存の鍵は別
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
await import('../js/proto/roadfirst-data.js'); await import('../js/proto/roadfirst-core.js'); await import('../js/proto/ch2-routes.js');
const A1 = globalThis.MMRF_DATA, C = globalThis.MMRF_CORE, R = globalThis.MMRF_CH2;
const SPUR = (D, k) => /spur/.test(D.segments[k][2]);
function reach(D, start, block) { const f = {}; for (const e of D.edges) (f[e[0]] = f[e[0]] || []).push(e[1]); const seen = new Set([start]), q = [start];
  while (q.length) { const x = q.shift(); for (const y of f[x] || []) if (!seen.has(y) && y !== block) { seen.add(y); q.push(y); } } return seen; }
function mainRoutes(D) {
  const nx = {}; for (const [k, s] of Object.entries(D.segments)) if (!SPUR(D, k)) (nx[s[0]] = nx[s[0]] || []).push(k);
  const out = []; const walk = (n, p) => { if (n === 'GOAL') return out.push(p); for (const k of nx[n] || []) walk(D.segments[k][1], p.concat(k)); }; walk('START', []);
  const L = (k) => D.segments[k][3].length - 1;
  return out.map((p) => ({ segs: p, tot: p.reduce((a, k) => a + L(k), 0), rival: (() => { let s = 0; for (const k of p) { s += L(k); if (D.segments[k][1] === 'RIVAL') return s; } return null; })() }));
}
const ROLES = new Set(Object.values(A1.nodes).map((n) => n[2]));

test('C2-01：3ルートの形・役割・規則・数', () => {
  assert.deepEqual(Object.keys(R), ['A', 'B', 'C']);
  for (const [k, D] of Object.entries(R)) {
    assert.equal(D.route, k); assert.equal(D.chapter, 2); assert.ok(D.name && D.concept);
    assert.deepEqual(D.fixed_rules.normal_movement_die, [1, 2, 3, 4, 5, 6]); assert.equal(D.fixed_rules.training_turn_limit, 40);
    const n = Object.keys(D.nodes).length; assert.ok(n >= 280 && n <= 320, `${k}：地点 ${n}`);   // 2026-10-15 追補（論点 4）：意味のある探索路を足して 280〜320
    for (const [id, v] of Object.entries(D.nodes)) { assert.ok(ROLES.has(v[2]), `${k} ${id}：役割 ${v[2]} は Chapter 1 の語彙`); assert.ok(Number.isFinite(v[0]) && Number.isFinite(v[1])); if (v[2] === 'ordinary_tile') assert.ok(D.segments[v[3]], `${k} ${id}：区間`); }
    const cnt = {}; for (const v of Object.values(D.nodes)) cnt[v[2]] = (cnt[v[2]] || 0) + 1;
    assert.equal(cnt.start, 1); assert.equal(cnt.goal, 1); assert.equal(cnt.parity_forced_fork, 1); assert.equal(cnt.challenge_d6_5_6, 1); assert.equal(cnt.mandatory_rival, 1);
    assert.equal(cnt.fixed_reward_dead_end, 6); assert.equal(cnt.optional_random_unlock_dead_end, 1); assert.equal(cnt.lower_walk_through_gate, 1);
    for (const e of D.edges) { assert.ok(D.nodes[e[0]] && D.nodes[e[1]] && D.segments[e[2]], `${k}：接続 ${e}`); assert.ok(['forward', 'reverse'].includes(e[3])); }
    for (const [sid, s] of Object.entries(D.segments)) { assert.equal(s[3][0], s[0]); assert.equal(s[3][s[3].length - 1], s[1]); for (const id of s[3]) assert.ok(D.nodes[id], `${k} ${sid} ${id}`); }
    assert.ok(Array.isArray(D.art.regions) && D.art.title && D.art.sea3d && Array.isArray(D.art.basin) && Array.isArray(D.art.towers), k + '：試作の区域・題字・海底の盆地・塔');
    assert.deepEqual(Object.keys(D.rewardTitles).sort(), ['L_ALTAR', 'L_CHEST', 'L_LATE_ALTAR', 'RANDOM_DEN', 'REWARD5', 'R_CHEST', 'R_SPECIAL']);
  }
});

test('C2-02：到達性・必通・寄り道から戻れる・ライバルは本線の 45〜80%', () => {
  for (const [k, D] of Object.entries(R)) {
    assert.equal(reach(D, 'START').size, Object.keys(D.nodes).length, k + '：START から全地点');
    for (const id of Object.keys(D.nodes)) assert.ok(reach(D, id).has('GOAL'), `${k} ${id} から GOAL`);
    assert.ok(!reach(D, 'START', 'RIVAL').has('GOAL'), k + '：ライバルを通らずに GOAL へ行けない');
    assert.ok(!reach(D, 'START', 'LOWER_GATE').has('GOAL'), k + '：潮の塔（海底へ下りる）を必ず通る');
    for (const sid of Object.keys(D.segments)) if (SPUR(D, sid)) assert.ok(reach(D, D.segments[sid][1]).has(D.segments[sid][0]), `${k} ${sid}：戻れる`);
    const ms = mainRoutes(D); assert.ok(ms.length >= 4, k + '：本線が複数');
    for (const m of ms) { assert.ok(m.rival != null); assert.ok(m.rival / m.tot >= 0.45 && m.rival / m.tot <= 0.8, `${k}：ライバル ${m.rival}/${m.tot}`); assert.ok(m.tot >= 85 && m.tot <= 140, `${k}：本線 ${m.tot}歩`); }   // 2026-10-15 追補2：B は特殊挑戦の成功の近道（2歩）を含めて最短 88 歩
  }
});

test('C2-03：A／B／C は互いに別のグラフ（区間の並び・接続・本線の歩数が違う）', () => {
  const sig = (D) => JSON.stringify(Object.keys(D.segments).map((k) => [k, D.segments[k][0], D.segments[k][1], D.segments[k][3].length]));
  const tot = (D) => mainRoutes(D).map((m) => m.tot).sort((a, b) => a - b).join(',');
  assert.notEqual(sig(R.A), sig(R.B)); assert.notEqual(sig(R.B), sig(R.C)); assert.notEqual(sig(R.A), sig(R.C));
  assert.notEqual(tot(R.A), tot(R.B)); assert.notEqual(tot(R.B), tot(R.C));
  assert.notEqual(sig(R.A), sig(A1), 'Chapter 1 A の複製ではない');
  // 分かれ道の種類の並び（構造の違い）：A＝自由→運命→自由3択、B＝自由→自由→特殊挑戦→運命、C＝自由（海底）→運命…
  const forks = (D) => Object.values(D.nodes).filter((n) => ['free_fork', 'late_free_fork', 'parity_forced_fork', 'challenge_d6_5_6'].includes(n[2])).sort((a, b) => b[1] - a[1]).map((n) => n[2]).join('>');
  assert.notEqual(forks(R.A), forks(R.B)); assert.notEqual(forks(R.B), forks(R.C));
});

test('C2-04：実際の進行（MMRF_CORE）＝運命の分かれ道・特殊挑戦・寄り道の往復・ライバルで止まる・時間切れ', () => {
  const policy = (want) => (D, st, ops) => { const ix = C.index(D); const sp = ops.find((s) => want.has(s) && !st.rewards[ix.endOf[s]]); if (sp) return sp; const main = ops.filter((s) => !ix.spurs.includes(s)); return main[0] || ops[0]; };
  for (const [k, D] of Object.entries(R)) {
    for (let seed = 1; seed <= 12; seed++) {
      const st = C.create(D, { seed, turnLimit: 999, randOpen: true }); const pol = policy(new Set(seed % 2 ? ['D_RAND'] : []));
      while (!st.done && !st.timeUp) C.playTurn(D, st, pol, { eventDie: 1 + (seed % 6), challengeDie: seed % 2 ? 6 : 2 });
      assert.ok(st.done && st.node === 'GOAL', `${k}/${seed}：GOAL`); assert.equal(st.rival, true); assert.ok(st.trail.includes('LOWER_GATE'));
      if (st.qDie != null) { const side = st.qDie % 2 ? 'Q_L' : 'Q_R'; assert.ok(st.trail.some((id) => id.startsWith(side)), `${k}：運命のサイコロ ${st.qDie} → ${side}`); }
      if (st.chal) assert.ok(st.trail.includes(st.chal === 'success' ? 'SUCCESS_L1' : 'FAIL_L') && !st.trail.includes(st.chal === 'success' ? 'FAIL_L' : 'SUCCESS_L1'), `${k}：特殊挑戦 ${st.chal}`);   // B の成功の道は 1歩＋1歩＝途中の地点が無い
      if (seed % 2 && st.trail.includes('RANDOM_DEN')) { assert.equal(st.rewards.RANDOM_DEN, true); const i = st.trail.indexOf('RANDOM_DEN'); assert.ok(st.trail.slice(i).includes(D.segments.D_RAND[0]), k + '：隠れ家から戻る'); }
    }
    // ライバルで止まり残りの目は捨てる
    const st = C.create(D, { seed: 5, turnLimit: 999 }); const pol = policy(new Set());
    while (!st.rival && !st.done) C.playTurn(D, st, pol);
    const log = st.log; assert.ok(st.trail[st.trail.length - 1] === 'RIVAL' || st.trail.includes('RIVAL'), k + '：ライバルの地点');
    // 40ターンで時間切れ（出目1だけなら届かない）
    const t = C.create(D, { seed: 1, turnLimit: 40 }); while (!t.done && !t.timeUp) C.playTurn(D, t, pol, { die: 1 });
    assert.equal(t.timeUp, true); assert.equal(t.done, false); assert.equal(t.turn, 40);
  }
});

test('C2-05：隔離＝本編と Chapter 1 の試作は ch2-routes を参照しない・試作の保存の鍵は別・script は1本', () => {
  for (const f of ['js/chapter/world-driver.js', 'js/chapter/world-board.js', 'js/phase8/raising.js', 'js/proto/roadfirst-data.js', 'js/proto/roadfirst-routes.js', 'js/proto/roadfirst-core.js', 'js/proto/roadfirst-play.js']) assert.doesNotMatch(rd(f), /MMRF_CH2|ch2-routes/, f);
  const v = rd('js/proto/roadfirst-view.js');
  assert.match(v, /rfData'\) === 'ch2'/); assert.match(v, /mmrf_proto_ch2_\$\{CH2\}_v1/); assert.match(v, /const KEY = 'mmrf_proto_v1'/); assert.match(v, /getItem\(SKEY\)/); assert.match(v, /setItem\(SKEY,/);
  assert.doesNotMatch(rd('js/proto/ch2-routes.js'), /mr4v\d/);
  // 2026-10-15 追補：海の世界の描画（MMRF_SEA）は道のデータが art.sea3d を持つときだけ＝Chapter 1 のデータには無い
  assert.ok(!(A1.art && A1.art.sea3d), 'Chapter 1 A には sea3d が無い');
  const W = rd('js/proto/roadfirst-world.js'); assert.match(W, /const SEA = D && D\.art && D\.art\.sea3d && root\.MMRF_SEA \? root\.MMRF_SEA : null;/);
  assert.match(rd('js/proto/roadfirst-routes.js'), /"route":"B"/); assert.doesNotMatch(rd('js/proto/roadfirst-routes.js'), /sea3d/, 'Chapter 1 B／C にも sea3d が無い');
  const html = rd('index.html'); assert.equal((html.match(/js\/proto\/ch2-routes\.js/g) || []).length, 1);
  assert.ok(html.indexOf('js/proto/ch2-routes.js') < html.indexOf('js/proto/roadfirst-view.js'), 'データは view より先に読む');
});

test('C2-06：特殊挑戦の規則・高さ・螺旋塔・盆地・報酬の種類と数・探索路', () => {
  const inPoly = (P, x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  const STD = ['all10', 'all15', 'best30', 'food', 'gold150', 'gold150', 'gold200'];
  for (const [k, D] of Object.entries(R)) {
    const L = (sid) => D.segments[sid][3].length - 1, Z = D.art.zoneOf, E = D.art.elev, dep = D.art.depth, h = (id) => E[id] || 0;
    // 成功＝近道・失敗＝回り道（Chapter 1 と同じ）
    const pathLen = (first) => { let n = 0, node = 'CHALLENGE', sid = first; for (let g = 0; g < 9 && node !== 'L_MERGE'; g++) { n += L(sid); node = D.segments[sid][1]; sid = Object.keys(D.segments).find((x) => D.segments[x][0] === node && !SPUR(D, x)); } return n; };
    const ok = pathLen('LATE_L_SUCCESS1'), ng = pathLen('LATE_L_FAIL'); assert.ok(ok < ng, `${k}：成功 ${ok} < 失敗 ${ng}`);
    // 高さ：区域ごと
    for (const [sid, s] of Object.entries(D.segments)) {
      const z = Z[sid], ids = s[3];
      if (z === 'undersea') for (const id of ids) assert.equal(h(id), -dep, `${k} ${sid} ${id}：海底`);
      if (z === 'surface_early' || z === 'surface_late') for (const id of ids) assert.equal(h(id), 0, `${k} ${sid} ${id}：海面`);
      if (z === 'ascent') { assert.ok(L(sid) >= 12 && L(sid) <= 13, `${k}：螺旋塔 ${L(sid)} 歩`); assert.equal(h(ids[0]), -dep); assert.equal(h(ids[ids.length - 1]), 0); for (let i = 1; i < ids.length; i++) assert.ok(h(ids[i]) >= h(ids[i - 1]), `${k} 上り ${ids[i]}`); }
      if (z === 'descent') { assert.equal(h(ids[0]), 0); assert.equal(h(ids[ids.length - 1]), -dep); for (let i = 1; i < ids.length; i++) assert.ok(h(ids[i]) <= h(ids[i - 1]), `${k} 下り ${ids[i]}`); }
      if (z === 'undersea') for (const id of ids) assert.ok(inPoly(D.art.basin, D.nodes[id][0], D.nodes[id][1]), `${k} ${id}：盆地の中`);
    }
    for (const t of D.art.towers) for (const [id, n] of Object.entries(D.nodes)) assert.ok(Math.hypot(n[0] - t.c[0], n[1] - t.c[1]) >= t.r + 12, `${k} ${id}：塔 ${t.id} の外`);
    // 報酬：7 枠の中身の種類と数は Chapter 1 と同じ（どの建物に置くかだけルートごと）
    assert.deepEqual(Object.values(D.rewards).map((r) => r.key).sort(), STD, k + '：報酬の種類と数');
    for (const [id, r] of Object.entries(D.rewards)) { assert.equal(r.title, D.rewardTitles[id]); assert.ok(Array.isArray(r.eff) && r.eff.length); }
    // 探索路：道のデータにあり、能力の偏りを持つ
    assert.ok(Object.keys(D.explore).length >= 4, k + '：探索路');
    for (const [sid, x] of Object.entries(D.explore)) { assert.ok(D.segments[sid], `${k} ${sid}`); assert.ok(x.name && x.note && ['lane', 'loop'].includes(x.kind)); assert.deepEqual(D.statLanes[sid], x.lean); }
  }
  // 3ルートとも同じ世界（盆地・塔・島は共通）
  assert.deepEqual(R.A.art.basin, R.B.art.basin); assert.deepEqual(R.A.art.towers, R.C.art.towers); assert.deepEqual(R.B.art.regions, R.C.art.regions);
});

test('C2-07：試作の進行が道のデータの割り当てを使う（報酬の中身・能力の道の偏り）・Chapter 1 は従来どおり', async () => {
  await import('../js/proto/roadfirst-play.js'); const P = globalThis.MMRF_PLAY;
  // 報酬：D.rewards の中身で確定（Chapter 1 の TUNING.rewards とは別の割り当て）
  for (const [k, D] of Object.entries(R)) {
    const st = P.attach(D, C.create(D, { seed: 3, randOpen: true }), {});
    for (const id of ['L_CHEST', 'R_CHEST', 'L_ALTAR', 'REWARD5']) {
      st.node = id; st.turn += 1; st.moveLeft = 0; st.play.notice = null; const before = JSON.parse(JSON.stringify(st.play)); const n = P.land(D, st, C);
      assert.equal(n.title, D.rewards[id].title, `${k} ${id}`);
      const e = D.rewards[id].eff; if (e[0].gold) assert.equal(st.play.gold - before.gold, e.reduce((a, x) => a + (x.gold || 0), 0)); if (e[0].statAll) assert.equal(st.play.stats.po - before.stats.po, e[0].statAll);
    }
  }
  // 能力の道の偏り：偏りのある区間では対象の2能力が多い（多数の seed で）
  const D = R.A, lane = D.statLanes.EL03B, cnt = { hit: 0, all: 0 };
  for (let seed = 1; seed <= 400; seed++) { const t = P.layout(D, seed, {}); for (const id of D.segments.EL03B[3]) { const x = t[id]; if (x && x.t === 'stat') { cnt.all++; if (lane.includes(x.k)) cnt.hit++; } } }
  assert.ok(cnt.hit / cnt.all > 0.45, `偏り ${cnt.hit}/${cnt.all}`);   // 偏りなしなら 2/6≒0.33・重み 3 で ≒0.6
  // Chapter 1 のデータには statLanes・rewards・calm・rareZones が無い＝従来の TUNING のまま
  for (const k of ['statLanes', 'rewards', 'calm', 'rareZones']) assert.equal(A1[k], undefined, k);
});

test('C2-08：道のデータ・summary.json・設計書の数値が一致（2026-10-15 追補2）', () => {
  const sum = JSON.parse(rd('tools/ch2/out/summary.json')), doc = rd('docs/ch2_abc_design_1015/DESIGN.md');
  const WANT = { A: { nodes: 298, ok: 6, ng: 20, sp: 12 }, B: { nodes: 280, ok: 2, ng: 14, sp: 12 }, C: { nodes: 304, ok: 6, ng: 18, sp: 13 } };
  const L = (D, sid) => D.segments[sid][3].length - 1;
  for (const [k, w] of Object.entries(WANT)) {
    const D = R[k], n = Object.keys(D.nodes).length;
    assert.equal(n, w.nodes, k + '：地点数'); assert.equal(sum[k].nodes, n, k + '：summary の地点数'); assert.equal(sum[k].edges, D.edges.length); assert.equal(sum[k].segments, Object.keys(D.segments).length);
    assert.equal(L(D, 'LATE_L_SUCCESS1') + L(D, 'LATE_L_SUCCESS_JOIN'), w.ok, k + '：成功の道');
    assert.equal(L(D, 'LATE_L_FAIL') + L(D, 'LATE_L_FAIL_JOIN'), w.ng, k + '：失敗の道');
    assert.deepEqual(sum[k].challenge, { success: w.ok, fail: w.ng }); assert.deepEqual(sum[k].spiralSteps, [w.sp]); assert.equal(L(D, 'SPIRAL'), w.sp);
    assert.ok(doc.includes(`${k} ${w.nodes}`), k + '：設計書の地点数'); assert.ok(doc.includes(`成功 ${w.ok}・失敗 ${w.ng}`), k + '：設計書の特殊挑戦');
  }
});
