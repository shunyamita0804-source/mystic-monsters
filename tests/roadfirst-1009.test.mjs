// =========================================================
// Chapter 1 Pattern A 道路先行ブロックアウトの試作（2026-10-09・?chapterBoard=roadfirst）— 進行のロジック（js/proto/roadfirst-core.js）を実際に動かすテスト
//  RF-01 データ：299ノード・370有向接続・42区間がキットの原本と同じ・全ノードに描画座標（02 の centerline と同じ順・同じ ID）
//  RF-02 START→GOAL（J0 の左右）・下の門／上の門／RIVAL を必ず通る・Q→R の直進が無い
//  RF-03 Q のイベントのサイコロ（奇数＝左・偶数＝右）・CHALLENGE（5・6 成功／1〜4 失敗）・どちらも GOAL へ
//  RF-04 48 の組み合わせ（J0 2 × Q 2 × H 3 × 挑戦 2 × D_RAND 2）を実際の進行で GOAL まで
//  RF-05 6つの報酬の枝の往復（行き止まりで止まる・帰りもサイコロ・報酬は1回だけ）・D_RAND の開閉
//  RF-06 大きな出目でも RIVAL・門・Q・CHALLENGE を飛ばせない（停止ルール 'stop'＝止まって残りを捨てる／'pass'＝通りながら出来事）
//  RF-07 40ターン・時間切れ・状態は素の JSON（ゲームのセーブ mr4v6 とは別の鍵）・通常の URL では何もしない
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
await import('../js/proto/roadfirst-data.js'); await import('../js/proto/roadfirst-core.js');
const D = globalThis.MMRF_DATA, C = globalThis.MMRF_CORE;
const K = 'assets/proto/ch1a_roadfirst_1009/';
const G = JSON.parse(rd(K + '09_original_source_graph.json')), V = JSON.parse(rd(K + '02_walkable_geometry.json'));
const MUST = ['LOWER_GATE', 'Q', 'R', 'UPPER_GATE', 'RIVAL', 'H', 'FINAL'];
const SPUR = { D_LC: ['L_CHEST', { j0: 'L' }], D_LA: ['L_ALTAR', { j0: 'L' }], D_RC: ['R_CHEST', { j0: 'R' }], D_LLA: ['L_LATE_ALTAR', { h: 'left', chal: 5 }], D_R5: ['REWARD5', { h: 'right' }], D_RS: ['R_SPECIAL', { h: 'right' }], D_RAND: ['RANDOM_DEN', { h: 'right', randOpen: true }] };
/** 計画どおりに最後まで（turnLimit を大きく＝道筋だけを確かめる） */
function run(plan = {}, seed = 1) {
  const st = C.create(D, { seed, turnLimit: plan.limit || 999, randOpen: plan.randOpen ?? false, stopRule: plan.stopRule });
  const pol = C.makePolicy({ j0: plan.j0, h: plan.h, spurs: plan.spurs }, C.mulberry(seed));
  while (!st.done && !st.timeUp) C.playTurn(D, st, pol, { eventDie: plan.q ?? undefined, challengeDie: plan.chal ?? undefined });
  return st;
}
const segsOf = (st) => { const s = new Set(); for (let i = 1; i < st.trail.length; i++) { const e = D.edges.find((x) => x[0] === st.trail[i - 1] && x[1] === st.trail[i]); assert.ok(e, `接続が無い移動 ${st.trail[i - 1]}→${st.trail[i]}`); s.add(e[2]); } return s; };

test('RF-01：データ＝キットの原本（299ノード・370有向接続・42区間）・全ノードに暫定の描画座標（02 の centerline と同じ ID・同じ順）', () => {
  assert.equal(Object.keys(D.nodes).length, 299); assert.equal(D.edges.length, 370); assert.equal(Object.keys(D.segments).length, 42);
  assert.deepEqual(new Set(Object.keys(D.nodes)), new Set(G.nodes.map((n) => n.id)), 'ノード ID は原本と同じ');
  assert.deepEqual(D.edges, G.edges.map((e) => [e.source, e.target, e.segment_id, e.direction, e.condition]), '接続は原本と同じ（順も同じ）');
  for (const s of G.segments) assert.deepEqual(D.segments[s.id][3], s.node_ids, `${s.id} の道路順序`);
  for (const f of V.segment_surfaces) f.phase18_node_ids.forEach((id, i) => { const n = D.nodes[id]; assert.ok(Number.isFinite(n[0]) && Number.isFinite(n[1]), id); assert.ok(Math.abs(n[0] - f.centerline_xy[i][0]) < 0.01 && Math.abs(n[1] - f.centerline_xy[i][1]) < 0.01, `${id} の座標は 02 の centerline`); });
  assert.deepEqual(D.fixed_rules.normal_movement_die, [1, 2, 3, 4, 5, 6]); assert.equal(D.fixed_rules.training_turn_limit, 40);
  assert.match(rd('js/proto/roadfirst-data.js'), /暫定の描画座標/);
});

test('RF-02：START→GOAL（J0 左・右）・下の門／上の門／RIVAL を必ず通る・Q→R の直進は無い', () => {
  for (const j0 of ['L', 'R']) for (let seed = 1; seed <= 20; seed++) {
    const st = run({ j0, q: 1 + (seed % 2), h: ['safe', 'left', 'right'][seed % 3], chal: seed % 2 ? 6 : 2 }, seed);
    assert.ok(st.done && st.node === 'GOAL', `${j0}/${seed}：GOAL`);
    for (const m of MUST) assert.ok(st.trail.includes(m), `${m} を通る`);
    assert.ok(segsOf(st).has(j0 === 'L' ? 'EL01' : 'ER01'));
    assert.equal(st.rival, true); assert.deepEqual(st.gates, ['LOWER_GATE', 'UPPER_GATE']);
  }
  assert.ok(!D.edges.some((e) => e[0] === 'Q' && e[1] === 'R'), 'Q→R の接続は無い');
  for (const e of D.edges.filter((x) => x[0] === 'Q')) assert.match(e[4], /^Q_(odd|even)_only$/, 'Q から出る道は偶奇の条件つきだけ');
});

test('RF-03：Q＝イベントのサイコロ（奇数＝左 Q_L・偶数＝右 Q_R）・CHALLENGE（5・6 成功／1〜4 失敗＝通常の道へ）', () => {
  for (const [q, side, other] of [[1, 'Q_L', 'Q_R'], [3, 'Q_L', 'Q_R'], [5, 'Q_L', 'Q_R'], [2, 'Q_R', 'Q_L'], [4, 'Q_R', 'Q_L'], [6, 'Q_R', 'Q_L']]) {
    const st = run({ q }, q); const s = [...segsOf(st)];
    assert.equal(st.qDie, q); assert.ok(s.some((x) => x.startsWith(side)) && !s.some((x) => x.startsWith(other)), `Q ${q} → ${side}`);
  }
  for (const v of [1, 2, 3, 4, 5, 6]) {
    const st = run({ h: 'left', chal: v }, 10 + v); const s = segsOf(st);
    assert.ok(st.done, `挑戦 ${v}：GOAL`); assert.equal(st.chal, v >= 5 ? 'success' : 'fail');
    assert.ok(s.has(v >= 5 ? 'LATE_L_SUCCESS1' : 'LATE_L_FAIL') && !s.has(v >= 5 ? 'LATE_L_FAIL' : 'LATE_L_SUCCESS1'));
    assert.ok(s.has('LATE_L_DONE'), '挑戦のあとは通常の道（L_MERGE → FINAL）へ戻る＝失敗のペナルティなし');
  }
});

test('RF-04：48 の組み合わせ（J0 × Q 偶奇 × H × 挑戦 × D_RAND）をゲームの進行で GOAL まで・必須の地点はいつも通る', () => {
  let n = 0;
  for (const j0 of ['L', 'R']) for (const q of [1, 2]) for (const h of ['safe', 'left', 'right']) for (const chal of [5, 1]) for (const randOpen of [false, true]) {
    const st = run({ j0, q, h, chal, randOpen, spurs: randOpen ? ['D_RAND'] : [] }, ++n);
    assert.ok(st.done, `#${n}`); for (const m of MUST) assert.ok(st.trail.includes(m), `#${n} ${m}`);
    const s = segsOf(st); assert.ok(s.has({ safe: 'LATE_SAFE', left: 'LATE_L1', right: 'LATE_R1' }[h]));
    if (h === 'right') assert.equal(s.has('D_RAND'), randOpen, `#${n} D_RAND は開いているときだけ`);
  }
  assert.equal(n, 48);
});

test('RF-05：6つの報酬の枝＋D_RAND の往復（行き止まりで止まる・帰りもサイコロでターンを使う・報酬は1回だけ）', () => {
  for (const [sp, [end, plan]] of Object.entries(SPUR)) {
    const st = run({ ...plan, chal: plan.chal ?? 1, spurs: [sp], randOpen: plan.randOpen ?? false }, 7);
    assert.ok(st.done, sp); assert.equal(st.rewards[end], true, `${sp}：${end} に着いた`); assert.equal(st.spurDone[sp], true, `${sp}：親の地点へ歩いて戻った`);
    const i = st.trail.indexOf(end), parent = D.segments[sp][0], back = st.trail.indexOf(parent, i);
    assert.ok(i > 0 && back > i, `${sp}：行き止まりから ${parent} へ戻る`);
    const len = D.segments[sp][3].length - 1; assert.ok(back - i === len, `${sp}：帰りは ${len} 歩（自動では戻らない）`);
  }
  // 行き止まりで残りの目は捨てる・次のターンに戻り始める
  const st = C.create(D, { seed: 3, randOpen: false }); st.node = 'EL2'; st.trail = ['EL2'];
  C.roll(D, st, 6); let ev = C.advance(D, st); assert.equal(ev.at(-1).type, 'choice'); ev = C.advance(D, st, { choose: 'D_LC' });
  assert.equal(st.node, 'L_CHEST'); assert.ok(ev.some((x) => x.type === 'reward' && x.first)); assert.ok(ev.some((x) => x.type === 'stop' && x.why === 'dead_end' && x.discarded === 1));
  C.roll(D, st, 5); C.advance(D, st); assert.equal(st.node, 'EL2', '帰りは5歩（ちょうど親の地点）'); assert.equal(st.spurDone.D_LC, true);
  // 同じ報酬は1回だけ（もう一度入っても first:false）
  st.exclude = null; st.moveLeft = 0; C.roll(D, st, 5); ev = C.advance(D, st, { choose: 'D_LC' }); assert.ok(ev.some((x) => x.type === 'reward' && !x.first));
  // D_RAND：閉じていれば道が出ない・開いていれば出る
  for (const open of [false, true]) { const s = C.create(D, { seed: 1, randOpen: open }); s.node = 'HR1'; s.moveLeft = 1; assert.equal(C.options(D, s).some((e) => e.seg === 'D_RAND'), open); }
  // 開閉は開始時に決めて状態に残す（再読み込み＝JSON から戻しても同じ）
  const a = C.create(D, { seed: 99 }); const b = JSON.parse(JSON.stringify(a)); assert.equal(b.randOpen, a.randOpen); assert.equal(typeof a.randOpen, 'boolean');
});

test('RF-06：大きな出目でも RIVAL・門・Q・CHALLENGE を飛ばせない（stop＝止まって残りを捨てる【仮】／pass＝通りながら出来事）', () => {
  const at = (node, stopRule, o = {}) => { const st = C.create(D, { seed: 4, stopRule, randOpen: false }); st.node = node; st.trail = [node]; Object.assign(st, o); C.roll(D, st, 6); const ev = C.advance(D, st, { eventDie: 1, challengeDie: 6, choose: o.choose }); return { st, ev }; };
  let r = at('UPPER_GATE', 'stop'); assert.equal(r.st.node, 'RIVAL'); assert.equal(r.st.rival, true); assert.equal(r.st.discarded, 3);
  r = at('UPPER_GATE', 'pass'); assert.notEqual(r.st.node, 'RIVAL'); assert.equal(r.st.rival, true, '通過でもライバルの出来事は起きる'); assert.ok(r.st.trail.includes('RIVAL'));
  r = at('C02_01', 'stop'); assert.equal(r.st.node, 'Q'); assert.equal(r.st.qPar, 'odd');
  r = at('P', 'stop'); assert.ok(r.st.trail.includes('LOWER_GATE') && r.st.gates.includes('LOWER_GATE'), '門は通り抜け（止まらない）でも必ず通る'); assert.equal(r.st.node, 'C02_03', '門では止まらずに6歩');
  r = at('LATE_L1_09', 'stop'); assert.equal(r.st.node, 'CHALLENGE'); assert.equal(r.st.chal, 'success');
  assert.equal(C.create(D).stopRule, 'stop', '既定はキットの draft_rules（止まる）＝【仮】');
});

test('RF-07：40ターンで時間切れ・状態は素の JSON・通常の URL では何もしない・ゲームのセーブとは別の鍵', () => {
  const st = C.create(D, { seed: 2 }); assert.equal(st.limit, 40);
  const pol = C.makePolicy({ spurs: Object.keys(SPUR) }, C.mulberry(2));
  while (!st.done && !st.timeUp) C.playTurn(D, st, pol, { die: 1 });
  assert.ok(st.timeUp && !st.done && st.turn === 40, '出目1ばかりなら 40ターンで時間切れ'); assert.equal(C.roll(D, st, 3), null, '時間切れのあとは振れない');
  assert.deepEqual(JSON.parse(JSON.stringify(st)), st);
  const view = rd('js/proto/roadfirst-view.js'); assert.match(view, /get\('chapterBoard'\) === 'roadfirst'/); assert.match(view, /const KEY = 'mmrf_proto_v1'/); assert.doesNotMatch(view, /setItem\([^)]*mr4v6|[^.\w]save\(\)/, 'ゲームのセーブには触れない');
  assert.match(rd('index.html'), /<script src="\.\/js\/proto\/roadfirst-view\.js"><\/script>/);
});
