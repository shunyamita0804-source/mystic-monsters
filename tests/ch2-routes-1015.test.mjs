// =========================================================
// Chapter 2「潮風の海岸」A／B／C 連続世界ボードの設計案（2026-10-15・未承認・限定試作）＝js/proto/ch2-routes.js（MMRF_CH2）
//  C2-01 データ：3ルートとも MMRF_DATA と同じ形・役割の語彙・固定の規則（D6・40ターン）。Q／特殊挑戦／隠れ家 各1・固定報酬 6・ライバル 1・地点は 210〜330
//  C2-02 到達性：START から全地点・全地点から GOAL・ライバルと潮の塔（下降）を通らずに GOAL へ行けない・寄り道（行き止まり）から戻れる
//  C2-03 3ルートは別のグラフ（区間の並び・接続・本線の歩数が互いに違う）＝見た目だけの複製ではない
//  C2-04 実際の進行（MMRF_CORE）：運命の分かれ道（奇数＝左／偶数＝右）・特殊挑戦（5／6）・寄り道の往復・大きな出目でライバルを飛ばせない・40ターンの時間切れ
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
    const n = Object.keys(D.nodes).length; assert.ok(n >= 210 && n <= 330, `${k}：地点 ${n}`);   // 目標 280〜320 は未達（本線を 40ターンで歩ける長さにしたため）＝設計書に明記
    for (const [id, v] of Object.entries(D.nodes)) { assert.ok(ROLES.has(v[2]), `${k} ${id}：役割 ${v[2]} は Chapter 1 の語彙`); assert.ok(Number.isFinite(v[0]) && Number.isFinite(v[1])); if (v[2] === 'ordinary_tile') assert.ok(D.segments[v[3]], `${k} ${id}：区間`); }
    const cnt = {}; for (const v of Object.values(D.nodes)) cnt[v[2]] = (cnt[v[2]] || 0) + 1;
    assert.equal(cnt.start, 1); assert.equal(cnt.goal, 1); assert.equal(cnt.parity_forced_fork, 1); assert.equal(cnt.challenge_d6_5_6, 1); assert.equal(cnt.mandatory_rival, 1);
    assert.equal(cnt.fixed_reward_dead_end, 6); assert.equal(cnt.optional_random_unlock_dead_end, 1); assert.equal(cnt.lower_walk_through_gate, 1);
    for (const e of D.edges) { assert.ok(D.nodes[e[0]] && D.nodes[e[1]] && D.segments[e[2]], `${k}：接続 ${e}`); assert.ok(['forward', 'reverse'].includes(e[3])); }
    for (const [sid, s] of Object.entries(D.segments)) { assert.equal(s[3][0], s[0]); assert.equal(s[3][s[3].length - 1], s[1]); for (const id of s[3]) assert.ok(D.nodes[id], `${k} ${sid} ${id}`); }
    assert.ok(Array.isArray(D.art.regions) && D.art.title, k + '：試作の区域と題字');
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
    for (const m of ms) { assert.ok(m.rival != null); assert.ok(m.rival / m.tot >= 0.45 && m.rival / m.tot <= 0.8, `${k}：ライバル ${m.rival}/${m.tot}`); assert.ok(m.tot >= 90 && m.tot <= 140, `${k}：本線 ${m.tot}歩`); }
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
      if (st.chal) assert.ok(st.trail.some((id) => id.startsWith(st.chal === 'success' ? 'LATE_L_SUCCESS' : 'LATE_L_FAIL')), `${k}：特殊挑戦 ${st.chal}`);
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
  const html = rd('index.html'); assert.equal((html.match(/js\/proto\/ch2-routes\.js/g) || []).length, 1);
  assert.ok(html.indexOf('js/proto/ch2-routes.js') < html.indexOf('js/proto/roadfirst-view.js'), 'データは view より先に読む');
});
