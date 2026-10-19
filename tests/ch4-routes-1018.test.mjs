// =========================================================
// Chapter 4「灼熱の火山」A／B／C 設計案（2026-10-18・未承認・本編に出さない）＝js/proto/ch4-routes.js（MMRF_CH4）
//  C4-01 データ：3ルートとも MMRF_DATA と同じ形・Chapter 1 の役割の語彙・固定の規則（D6・40ターン）。Q／特殊挑戦／隠れ家／ライバル／門 各1・固定報酬 6・地点 280〜320
//  C4-02 到達性：START から全地点・全地点から GOAL・ライバルと門（LOWER_GATE）を通らずに GOAL へ行けない・寄り道から戻れる・条件つきの分岐は Q と CHALLENGE だけ
//  C4-03 交差なし・不正な分岐なし：端を共有しない区間どうしが交わらない・溶岩の中に地点が無い（橋の区間だけ渡る）・高さは START が最低・GOAL が最高
//  C4-04 3ルートは互いに別のグラフ・Chapter 1 A の複製ではない・特殊挑戦は成功＝近道
//  C4-05 実際の進行（MMRF_CORE）：GOAL に着いた回は必ずライバルに会っている・運命の奇偶・特殊挑戦 5／6・大きな出目でライバルを飛ばせない・40ターンで止まる（無限ループなし）
//  C4-06 設計資料と一致：docs/ch4/graph_*.json・tools/ch4/out/summary.json の地点数・本線の歩数が道のデータと同じ
//  C4-07 隔離：index.html・本編（js/chapter・js/phase8）は ch4-routes を読み込まない・参照しない
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
await import('../js/proto/roadfirst-data.js'); await import('../js/proto/roadfirst-core.js'); await import('../js/proto/ch4-routes.js');
const A1 = globalThis.MMRF_DATA, C = globalThis.MMRF_CORE, R = globalThis.MMRF_CH4;
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
const inPoly = (poly, x, y) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
const cross = (p1, p2, q1, q2) => { const o = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]); return (o(q1, q2, p1) > 0) !== (o(q1, q2, p2) > 0) && (o(p1, p2, q1) > 0) !== (o(p1, p2, q2) > 0); };

test('C4-01：3ルートの形・役割・規則・数', () => {
  assert.deepEqual(Object.keys(R), ['A', 'B', 'C']);
  for (const [k, D] of Object.entries(R)) {
    assert.equal(D.route, k); assert.equal(D.chapter, 4); assert.ok(D.name && D.concept);
    assert.deepEqual(D.fixed_rules.normal_movement_die, [1, 2, 3, 4, 5, 6]); assert.equal(D.fixed_rules.training_turn_limit, 40);
    const n = Object.keys(D.nodes).length; assert.ok(n >= 280 && n <= 320, `${k}：地点 ${n}`);
    for (const [id, v] of Object.entries(D.nodes)) { assert.ok(ROLES.has(v[2]), `${k} ${id}：役割 ${v[2]} は Chapter 1 の語彙`); if (v[2] === 'ordinary_tile') assert.ok(D.segments[v[3]], `${k} ${id}：区間`); }
    const cnt = {}; for (const v of Object.values(D.nodes)) cnt[v[2]] = (cnt[v[2]] || 0) + 1;
    for (const [role, c] of [['start', 1], ['goal', 1], ['parity_forced_fork', 1], ['challenge_d6_5_6', 1], ['mandatory_rival', 1], ['fixed_reward_dead_end', 6], ['optional_random_unlock_dead_end', 1], ['lower_walk_through_gate', 1], ['rare_zone_candidate', 1]])
      assert.equal(cnt[role], c, `${k}：${role}`);
    for (const e of D.edges) { assert.ok(D.nodes[e[0]] && D.nodes[e[1]] && D.segments[e[2]], `${k}：接続 ${e}`); assert.ok(['forward', 'reverse'].includes(e[3])); }
    for (const [sid, s] of Object.entries(D.segments)) { assert.equal(s[3][0], s[0]); assert.equal(s[3][s[3].length - 1], s[1]); for (const id of s[3]) assert.ok(D.nodes[id], `${k} ${sid} ${id}`); }
    assert.deepEqual(Object.keys(D.rewards).sort(), ['L_ALTAR', 'L_CHEST', 'L_LATE_ALTAR', 'RANDOM_DEN', 'REWARD5', 'R_CHEST', 'R_SPECIAL']);
    assert.deepEqual(Object.values(D.rewards).map((r) => r.key).sort(), ['all10', 'all15', 'best30', 'food', 'gold150', 'gold150', 'gold200'], `${k}：固定報酬の中身は Chapter 1 と同じ 7 種類`);
    assert.ok(D.rareZones && Object.values(D.rareZones).every((z) => z.length > 0), `${k}：レアの候補`);
  }
});

test('C4-02：到達性・必通・寄り道から戻れる・条件つきの分岐は Q と CHALLENGE だけ', () => {
  for (const [k, D] of Object.entries(R)) {
    assert.equal(reach(D, 'START').size, Object.keys(D.nodes).length, k + '：START から全地点');
    for (const id of Object.keys(D.nodes)) assert.ok(reach(D, id).has('GOAL'), `${k} ${id} から GOAL`);
    assert.ok(!reach(D, 'START', 'RIVAL').has('GOAL'), k + '：ライバルを通らずに GOAL へ行けない');
    assert.ok(!reach(D, 'START', 'LOWER_GATE').has('GOAL'), k + '：門を通らずに GOAL へ行けない');
    for (const sid of Object.keys(D.segments)) if (SPUR(D, sid)) assert.ok(reach(D, D.segments[sid][1]).has(D.segments[sid][0]), `${k} ${sid}：戻れる`);
    // 分かれ目（前へ進む道が 2 本以上の地点）で条件の違う道が並ぶのは Q（奇偶）・CHALLENGE（5／6）・隠れ家の入口（D_RAND）だけ
    const fw = {}; for (const e of D.edges) if (e[3] === 'forward') (fw[e[0]] = fw[e[0]] || []).push(e);
    for (const [node, es] of Object.entries(fw)) {
      const conds = new Set(es.map((e) => e[4])); if (conds.size < 2) continue;
      if (node === 'Q') assert.deepEqual([...conds].sort(), ['Q_even_only', 'Q_odd_only'], `${k}：Q`);
      else if (node === 'CHALLENGE') assert.deepEqual([...conds].sort(), ['CHALLENGE_1_4', 'CHALLENGE_5_6'], `${k}：CHALLENGE`);
      else {
        // それ以外：隠れ家の入口（D_RAND）か、条件つきの道（奇偶・挑戦の続き）の途中から出る寄り道（always の行き止まり）だけ＝プレイヤーの選択で条件を変えられない
        const cond = es.filter((e) => e[4] !== 'always' && e[4] !== 'unlock_random_event'), free = es.filter((e) => e[4] === 'always');
        const ok = (es.filter((e) => e[4] === 'unlock_random_event').every((e) => e[2] === 'D_RAND')) && (cond.length === 0 || (new Set(cond.map((e) => e[4])).size === 1 && free.every((e) => SPUR(D, e[2]))));
        assert.ok(ok, `${k} ${node}：条件つきの分岐 ${[...conds]}`);
      }
    }
    for (const e of D.edges) if (e[4] === 'unlock_random_event') assert.equal(e[2], 'D_RAND', `${k}：隠れ家の条件は D_RAND だけ`);
    const ms = mainRoutes(D); assert.ok(ms.length >= 6, k + '：本線が複数');
    for (const m of ms) { assert.ok(m.rival / m.tot >= 0.45 && m.rival / m.tot <= 0.8, `${k}：ライバル ${m.rival}/${m.tot}`); assert.ok(m.tot >= 90 && m.tot <= 130, `${k}：本線 ${m.tot}歩`); }
  }
});

test('C4-03：道が交わらない・溶岩の中に地点が無い（橋だけ渡る）・高さ', () => {
  for (const [k, D] of Object.entries(R)) {
    const N = D.nodes, S = D.segments, ids = Object.keys(S);
    for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) {
      const sa = S[ids[a]], sb = S[ids[b]]; if ([sa[0], sa[1]].some((x) => x === sb[0] || x === sb[1])) continue;
      for (let i = 0; i < sa[3].length - 1; i++) for (let j = 0; j < sb[3].length - 1; j++)
        assert.ok(!cross(N[sa[3][i]], N[sa[3][i + 1]], N[sb[3][j]], N[sb[3][j + 1]]), `${k}：${ids[a]} と ${ids[b]} が交わる`);
    }
    for (const [sid, s] of Object.entries(S)) {
      const br = /bridge/.test(s[2]);
      s[3].forEach((id, i) => { if (br && i > 0 && i < s[3].length - 1) return; for (const L of D.art.lava) assert.ok(!inPoly(L.poly, N[id][0], N[id][1]), `${k} ${sid} ${id}：溶岩 ${L.id} の中`); });
    }
    const H = (id) => D.art.elev[id] || 0, hs = Object.keys(N).map(H);
    assert.equal(H('START'), Math.min(...hs)); assert.equal(H('GOAL'), Math.max(...hs));
  }
});

test('C4-04：3ルートは別のグラフ・Chapter 1 A の複製ではない・特殊挑戦は成功＝近道', () => {
  const sig = (D) => JSON.stringify(Object.keys(D.segments).map((k) => [k, D.segments[k][0], D.segments[k][1], D.segments[k][3].length]));
  assert.notEqual(sig(R.A), sig(R.B)); assert.notEqual(sig(R.B), sig(R.C)); assert.notEqual(sig(R.A), sig(R.C)); for (const D of Object.values(R)) assert.notEqual(sig(D), sig(A1));
  // 運命の分かれ道とライバルの順（構造の違い）：A／B は運命 → ライバル、C はライバル → 運命
  const order = (D) => { const m = mainRoutes(D)[0]; const at = (n) => m.segs.findIndex((s) => D.segments[s][1] === n); return at('Q') < at('RIVAL') ? 'Q>RIVAL' : 'RIVAL>Q'; };
  assert.equal(order(R.A), 'Q>RIVAL'); assert.equal(order(R.B), 'Q>RIVAL'); assert.equal(order(R.C), 'RIVAL>Q');
  const summ = JSON.parse(rd('tools/ch4/out/summary.json'));
  for (const k of 'ABC') assert.ok(summ[k].challenge.success < summ[k].challenge.fail, `${k}：成功 ${summ[k].challenge.success} ＜ 失敗 ${summ[k].challenge.fail}`);
  assert.ok(R.B.art.bridges.length > 0 && R.A.art.bridges.length === 0, 'B だけ溶岩の上の橋');
});

test('C4-05：実際の進行（MMRF_CORE）＝ライバル必通・運命の奇偶・特殊挑戦・40ターンで止まる', () => {
  const pol = (want) => (D, st, ops) => { const ix = C.index(D); const sp = ops.find((s) => want.has(s) && !st.rewards[ix.endOf[s]]); if (sp) return sp; const main = ops.filter((s) => !ix.spurs.includes(s)); return main[(st.turn + st.node.length) % main.length] || ops[0]; };
  for (const [k, D] of Object.entries(R)) {
    for (let seed = 1; seed <= 24; seed++) {
      const st = C.create(D, { seed, turnLimit: 999, randOpen: true }); const p = pol(new Set(seed % 3 ? ['D_RAND', 'D_LC'] : []));
      let g = 0; while (!st.done && !st.timeUp && g++ < 400) C.playTurn(D, st, p, { eventDie: 1 + (seed % 6), challengeDie: seed % 2 ? 6 : 2 });
      assert.ok(st.done && st.node === 'GOAL', `${k}/${seed}：GOAL`); assert.equal(st.rival, true, `${k}/${seed}：ライバル`); assert.ok(st.trail.includes('LOWER_GATE'));
      if (st.qDie != null) { const side = st.qDie % 2 ? 'Q_L' : 'Q_R'; assert.ok(st.trail.some((id) => id.startsWith(side)), `${k}：運命のサイコロ ${st.qDie} → ${side}`); }
      if (st.chalDie != null) assert.equal(st.chal, st.chalDie >= 5 ? 'success' : 'fail');
    }
    // 大きな出目でもライバルで止まる（stopRule 'stop'）
    const st = C.create(D, { seed: 7, turnLimit: 999 }); const p2 = pol(new Set());
    let g = 0; while (!st.rival && !st.done && g++ < 400) C.playTurn(D, st, p2, { die: 6, eventDie: 1, challengeDie: 6 });
    assert.equal(st.node, 'RIVAL', `${k}：出目 6 でもライバルで止まる`);
    // 40ターンで必ず止まる
    for (let seed = 1; seed <= 12; seed++) { const s2 = C.create(D, { seed }); let h = 0; while (!s2.done && !s2.timeUp && h++ < 200) C.playTurn(D, s2, p2); assert.ok(s2.done || s2.timeUp, `${k}/${seed}：止まる`); assert.ok(s2.turn <= 40); }
  }
});

test('C4-06：設計資料（docs/ch4/graph_*.json・summary.json・RESULTS.md）と道のデータが一致', () => {
  const summ = JSON.parse(rd('tools/ch4/out/summary.json'));
  for (const [k, D] of Object.entries(R)) {
    const g = JSON.parse(rd(`docs/ch4/graph_${k}.json`));
    assert.equal(Object.keys(g.nodes).length, Object.keys(D.nodes).length); assert.equal(g.edges.length, D.edges.length); assert.equal(Object.keys(g.segments).length, Object.keys(D.segments).length);
    assert.equal(summ[k].nodes, Object.keys(D.nodes).length);
    assert.deepEqual(summ[k].mainTotals, [...new Set(mainRoutes(D).map((m) => m.tot))].sort((a, b) => a - b));
  }
  const md = rd('docs/ch4/RESULTS.md'); for (const k of 'ABC') assert.ok(md.includes(`| 地点 | ${summ.A.nodes} | ${summ.B.nodes} | ${summ.C.nodes} |`), 'RESULTS.md の地点数');
  const sim = JSON.parse(rd('tools/ch4/out/v4_final/sim_food10_spur0.25.json'));
  for (const k of ['Ch4-A', 'Ch4-B', 'Ch4-C']) { assert.equal(sim.out[k].runs, 24000); assert.equal(sim.out[k].stuck, 0); assert.equal(sim.out[k].guardOut, 0); assert.equal(sim.out[k].nodes, Object.keys(R[k.slice(-1)].nodes).length, k + '：sim の結果は今の道のデータで回したもの'); }
});

test('C4-07：本編の読み込み（2026-10-19 から本編の Chapter 4＝この道のデータ）：index.html が道・描画・進行を読み、進行は MMRF_CH4 だけを道に使う', () => {
  const h = rd('index.html'), i = (f) => h.indexOf(f);
  for (const f of ['js/proto/ch4-routes.js', 'js/proto/ch4-world.js', 'js/chapter/world-driver-ch4.js']) assert.ok(i(f) > 0, f);
  assert.ok(i('js/proto/ch4-routes.js') < i('js/chapter/world-driver-ch4.js') && i('js/chapter/world-driver.js') < i('js/chapter/world-driver-ch4.js'), '道のデータ → make → Chapter 4 の進行の順');
  assert.ok(/MMRF_CH4/.test(rd('js/chapter/world-driver-ch4.js')));
  for (const f of ['js/phase8/raising.js', 'js/chapter/engine.js']) assert.ok(!/MMRF_CH4|ch4-routes/.test(rd(f)), f + '：旧エンジン・育成の進行は道のデータに触れない');
});
