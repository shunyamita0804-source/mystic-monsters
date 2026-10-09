// =========================================================
// Chapter 1 Pattern A 道路先行の試作 — 育成の中身（js/proto/roadfirst-play.js・MMRF_PLAY）のテスト（2026-10-09・?chapterBoard=roadfirst）
//  PL-01 道路データは変わらない（育成を何百回回しても 299／370／42・座標・接続が同じ）・構造の地点はマスにならない
//  PL-02 マスの配置は seed で決まる（同じ seed＝同じ・違う seed＝違う）・序盤の区間に野生／休憩／宝箱なし・同じ能力／野生が続かない
//  PL-03 能力マス＝正式の成長量（MMP10M.GROWTH_GAIN × 適性）・止まったときだけ・そのノードで1回だけ・999 上限・レベルなし
//  PL-04 イベント（2択を含む）・宝箱・野生は止まったときだけ・1回だけ・再読み込み（JSON に戻す）で二重にならない
//  PL-05 6つの固定報酬＋隠れ家：往復して1回だけ・帰り道で取り直さない・正式の所持金／持ち物には触れない
//  PL-06 疲れ：0 から・出目ごとの表【試作用】・100 上限・100 で振れず「休む」で必ず抜けられる・休む＝1ターン・移動なし・最後のターンで時間切れ
//  PL-07 保存：v 1（移動だけ）→ v 2 へ移行（移動の状態はそのまま）・読めない形は null（呼び出し側が元の保存を壊さない）
//  PL-08 40ターン・必通（下の門・Q・上の門・RIVAL・H・FINAL）・D_RAND 閉でも GOAL・48 の組み合わせを育成込みで・詰まない
//  PL-09 ダブルダイス【仮】は &rfItemLab のときだけ・1回ごとに1個減る・2個の合計
//  PL-10 モンスターは読み取り専用の写し（元の個体は変わらない）・いなければデモ個体
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEngine } from './chapter-sim.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const E = loadEngine(); globalThis.MMP10M = E.w.MMP10M;
await import('../js/proto/roadfirst-data.js'); await import('../js/proto/roadfirst-core.js'); await import('../js/proto/roadfirst-play.js');
const D = globalThis.MMRF_DATA, C = globalThis.MMRF_CORE, P = globalThis.MMRF_PLAY, MM = globalThis.MMP10M;
P.setEventPool(E.CH.getConfig(1).eventPool);
const hashD = () => createHash('sha256').update(JSON.stringify([D.nodes, D.edges, D.segments])).digest('hex');
const H0 = hashD();
const MUST = ['LOWER_GATE', 'Q', 'R', 'UPPER_GATE', 'RIVAL', 'H', 'FINAL'];
const newSt = (o = {}) => P.attach(D, C.create(D, Object.assign({ seed: 5, randOpen: false }, o)), { monster: o.monster });
/** ある地点に置いてから die の出目で動かし、止まったら中身を確定する */
function moveFrom(st, node, die, adv = {}) { st.node = node; st.trail.push(node); st.moveLeft = 0; st.back = null; st.exclude = null; st.play.notice = null; const v = P.roll(D, st, C, die); assert.equal(v, die); const ev = C.advance(D, st, adv); return { ev, n: P.land(D, st, C) }; }
/** 次に die 歩先にあるノード（分岐なしの区間の中） */
const segOf = (id) => Object.entries(D.segments).find(([, s]) => s[3].includes(id));
function before(id, k) { const [, s] = segOf(id); const i = s[3].indexOf(id); return i - k >= 0 ? s[3][i - k] : null; }

test('PL-01：道路データは変わらない（育成を回しても）・構造の地点はマスにならない', () => {
  for (let i = 1; i <= 200; i++) P.simulate(D, C, { seed: i, p: { j0: i % 2 ? 'L' : 'R', h: ['safe', 'left', 'right'][i % 3], spurs: ['D_LC', 'D_RC'] } });
  assert.equal(hashD(), H0, '299ノード・370接続・42区間・座標は同じ');
  assert.equal(Object.keys(D.nodes).length, 299); assert.equal(D.edges.length, 370); assert.equal(Object.keys(D.segments).length, 42);
  for (let seed = 1; seed <= 30; seed++) for (const id of Object.keys(P.layout(D, seed))) assert.equal(D.nodes[id][2], 'ordinary_tile', `${id} は通常の地点だけ（START・J0・門・Q・RIVAL・H・CHALLENGE・GOAL・報酬の終点などは上書きしない）`);
});

test('PL-02：マスの配置は seed で決まる・序盤の区間に野生／休憩／宝箱なし・同じ能力／野生が続かない', () => {
  assert.deepEqual(P.layout(D, 77), P.layout(D, 77), '同じ seed＝同じ配置・同じイベント');
  assert.notDeepEqual(P.layout(D, 77), P.layout(D, 78), '違う seed＝違う配置');
  const a = newSt({ seed: 9 }); assert.deepEqual(a.play.tiles, P.layout(D, 9), '育成の状態に保存される');
  let total = 0, n = 0; const kinds = {};
  for (let seed = 1; seed <= 300; seed++) {
    const t = P.layout(D, seed); n++; total += Object.keys(t).length;
    for (const v of Object.values(t)) kinds[v.t] = (kinds[v.t] || 0) + 1;
    for (const sid of P.TUNING.calmSegments) for (const id of D.segments[sid][3]) assert.ok(!t[id] || !['wild', 'rest', 'treasure'].includes(t[id].t), `${seed}：${sid} の ${id}`);
    for (const [, s] of Object.entries(D.segments)) for (let i = 1; i < s[3].length; i++) {
      const p = t[s[3][i - 1]], q = t[s[3][i]]; if (!p || !q) continue;
      assert.ok(!(p.t === 'stat' && q.t === 'stat' && p.k === q.k), `${seed}：同じ能力が続く ${s[3][i]}`);
      assert.ok(!(p.t === 'wild' && q.t === 'wild'), `${seed}：野生が続く ${s[3][i]}`);
    }
    for (const v of Object.values(t)) if (v.t === 'event' || v.t === 'rest') assert.ok(P.pool().some((e) => e.id === v.e), `既存の eventPool の id（${v.e}）`);
  }
  const avg = total / n; assert.ok(avg > 120 && avg < 200, `特別なマスは全部ではない（平均 ${avg.toFixed(1)} / 261）`);
  for (const k of ['stat', 'event', 'rest', 'wild', 'treasure']) assert.ok(kinds[k] > 0, k);
});

test('PL-03：能力マス＝正式の成長量・止まったときだけ・そのノードで1回だけ・999 上限', () => {
  const gauru = { sp: 1, name: 'ガウ', li: 80, po: 110, in: 110, hi: 90, ev: 90, de: 60 };
  const st = newSt({ seed: 21, monster: gauru });
  const [id, tile] = Object.entries(st.play.tiles).find(([i, t]) => t.t === 'stat' && before(i, 2));
  const from = before(id, 2);
  const want = MM.GROWTH_GAIN[MM.growthOf(gauru, tile.k)];
  assert.equal(want, { A: 25, B: 21, C: 18, D: 14, E: 11 }[MM.growthOf(gauru, tile.k)]);
  const b0 = st.play.stats[tile.k];
  let r = moveFrom(st, from, 2); assert.equal(st.node, id); assert.equal(r.n.kind, 'stat');
  assert.equal(st.play.stats[tile.k], b0 + want, `${tile.k}：適性 ${MM.growthOf(gauru, tile.k)} の +${want}`);
  assert.deepEqual(r.n.d[0], { k: tile.k, from: b0, to: b0 + want, d: want, grade: MM.growthOf(gauru, tile.k) });
  assert.equal(P.land(D, st, C), null, '同じターンにもう一度確定しない');
  r = moveFrom(st, from, 2); assert.equal(st.node, id); assert.equal(r.n, null, '同じマスに2回目に止まっても伸びない');
  assert.equal(st.play.stats[tile.k], b0 + want);
  // 通るだけでは起きない
  const st2 = newSt({ seed: 21, monster: gauru }); const pre = before(id, 1), post = (() => { const [, s] = segOf(id); const i = s[3].indexOf(id); return s[3][i + 1]; })();
  if (pre && post && D.nodes[post][2] === 'ordinary_tile') { moveFrom(st2, pre, 2); assert.notEqual(st2.node, id); assert.equal(st2.play.stats[tile.k] - st2.play.mon.base[tile.k] === want && !st2.play.tiles[st2.node], false, '通過したマスの効果は出ない'); assert.ok(!st2.play.used[id], '通過したマスは使っていない'); }
  // 999 上限・レベルは無い
  const st3 = newSt({ seed: 21, monster: Object.assign({}, gauru, { [tile.k]: 990 }) }); moveFrom(st3, from, 2); assert.equal(st3.play.stats[tile.k], 999);
  assert.doesNotMatch(rd('js/proto/roadfirst-play.js').replace(/\/\/.*$/gm, ''), /\b(exp|lv|level)\b|経験値|レベルアップ/i, 'レベル・経験値の仕組みは無い（コメントを除くコード）');
});

test('PL-04：イベント（2択を含む）・宝箱・野生は止まったときだけ・1回だけ・再読み込みで二重にならない', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const st = newSt({ seed });
    const hit = Object.entries(st.play.tiles).find(([i, t]) => t.t === 'event' && P.pool().find((e) => e.id === t.e).choices && before(i, 1));
    if (!hit) continue;
    const [id] = hit; moveFrom(st, before(id, 1), 1);
    const n = st.play.notice; assert.equal(n.kind, 'choice'); assert.ok(n.choices.length === 2);
    const snap = JSON.stringify(st);
    // 選ぶ前に再読み込み → 同じ選択肢・効果はまだ
    const re = P.upgrade(D, JSON.parse(snap)); assert.deepEqual(re.play.notice, n); assert.deepEqual(re.play.stats, st.play.stats); assert.equal(P.land(D, re, C), null, '再読み込みで同じマスの中身を引き直さない');
    const fat0 = re.play.fat, st0 = JSON.stringify(re.play.stats);
    P.choose(D, re, 1); const after = JSON.stringify(re.play);
    assert.ok(after !== JSON.stringify(JSON.parse(snap).play), '選んだ効果が入る'); assert.equal(re.play.notice.kind, 'event');
    assert.equal(P.choose(D, re, 0), null, '2回目は選べない'); assert.equal(JSON.stringify(re.play), after, '効果は1回だけ');
    const re2 = P.upgrade(D, JSON.parse(JSON.stringify(re))); P.choose(D, re2, 1); assert.equal(JSON.stringify(re2.play), after, '選んだあとに再読み込みしても二重にならない');
    assert.ok(fat0 !== re.play.fat || st0 !== JSON.stringify(re.play.stats));
    break;
  }
  // 宝箱・野生・休憩・ふつうのイベント：1回だけ
  for (const kind of ['treasure', 'wild', 'rest', 'event']) {
    let done = false;
    for (let seed = 1; seed <= 80 && !done; seed++) {
      const st = newSt({ seed }); const hit = Object.entries(st.play.tiles).find(([i, t]) => t.t === kind && before(i, 1) && !(kind === 'event' && P.pool().find((e) => e.id === t.e).choices)); if (!hit) continue;
      const [id] = hit; const from = before(id, 1);
      st.play.fat = 40; const r = moveFrom(st, from, 1); assert.ok(r.n && r.n.kind === kind, `${kind} が出る`);
      const g = JSON.stringify([st.play.gold, st.play.fat, st.play.stats]);
      const r2 = moveFrom(st, from, 1); assert.equal(r2.n, null, `${kind}：2回目は何も起きない`); assert.equal(JSON.stringify([st.play.gold, st.play.fat - (P.TUNING.fatigueByDie[1]), st.play.stats]), g);
      done = true;
    }
    assert.ok(done, kind);
  }
});

test('PL-05：6つの固定報酬＋隠れ家：往復して1回だけ・帰り道で取り直さない・正式の所持金／持ち物に触れない', () => {
  const SP = { D_LC: ['L_CHEST', { j0: 'L' }], D_LA: ['L_ALTAR', { j0: 'L' }], D_RC: ['R_CHEST', { j0: 'R' }], D_LLA: ['L_LATE_ALTAR', { h: 'left' }, { challengeDie: 6 }], D_R5: ['REWARD5', { h: 'right' }], D_RS: ['R_SPECIAL', { h: 'right' }], D_RAND: ['RANDOM_DEN', { h: 'right' }, {}, true] };
  for (const [sp, [end, pol, adv, open]] of Object.entries(SP)) {
    let ok = false;
    for (let seed = 1; seed <= 200 && !ok; seed++) {
      const st = P.simulate(D, C, { seed, turnLimit: 999, randOpen: !!open, p: Object.assign({ spurs: [sp] }, pol), adv });
      if (!st.done) continue;
      assert.ok(st.play.claimed[end], `${sp}：${end} を受け取った`);
      assert.equal(st.play.hist.filter((h) => h.node === end && (h.kind === 'reward' || h.kind === 'den') && h.d.length).length, 1, `${sp}：効果は1回だけ`);
      assert.equal(st.spurDone[sp], true, `${sp}：歩いて戻った`);
      ok = true;
    }
    assert.ok(ok, sp);
  }
  // 同じ報酬にもう一度止まっても効果なし
  const st = newSt({ seed: 3 }); st.node = 'EL2'; st.trail = ['EL2'];
  P.roll(D, st, C, 6); C.advance(D, st); C.advance(D, st, { choose: 'D_LC' }); const n = P.land(D, st, C); assert.equal(n.kind, 'reward'); const g = st.play.gold;
  st.play.notice = null; st.turn++; const n2 = P.land(D, st, C); assert.equal(n2.d.length, 0, 'もう受け取った（表示だけ）'); assert.equal(st.play.gold, g);
  // 正式の経済・セーブ・個体には触れない（コードに S・save・gold の書き込みが無い）
  const code = rd('js/proto/roadfirst-play.js').replace(/\/\/.*$/gm, '');   // コメントを除くコード
  assert.doesNotMatch(code, /\bS\.(gold|inv|m)\b|localStorage|mr4v6|[^.\w]save\(/, '正式の所持金・持ち物・セーブに触れない');
  for (const r of Object.values(P.TUNING.rewards)) assert.ok(r.title && r.eff.length);
});

test('PL-06：疲れ・休む・100 でも詰まない・休む＝1ターン・移動なし・最後のターンで時間切れ', () => {
  const st = newSt({ seed: 4 }); assert.equal(st.play.fat, 0);
  for (const v of [1, 2, 3, 4, 5, 6]) { const s = newSt({ seed: 4 }); P.roll(D, s, C, v); assert.equal(s.play.fat, P.TUNING.fatigueByDie[v], `出目 ${v}`); }
  assert.deepEqual(Object.values(P.TUNING.fatigueByDie), [2, 3, 4, 5, 6, 7], '【試作用】の表（旧 1〜3 の +3/+5/+7 とは別）');
  st.play.fat = 99; P.roll(D, st, C, 6); assert.equal(st.play.fat, 100, '100 上限'); C.advance(D, st); P.land(D, st, C); P.ack(st);
  assert.equal(P.canRoll(D, st, C), false, '100 では振れない'); assert.equal(P.canRest(D, st, C), true, '休めば抜けられる');
  const node = st.node, turn = st.turn; P.rest(D, st, C);
  assert.equal(st.play.fat, 100 - P.TUNING.restAmount); assert.equal(st.turn, turn + 1, '1ターン使う'); assert.equal(st.node, node, '移動しない'); P.ack(st);
  assert.equal(P.canRoll(D, st, C), true);
  const last = newSt({ seed: 4 }); last.turn = 39; last.play.fat = 50; P.rest(D, last, C); assert.equal(last.timeUp, true, '40ターン目に休むと時間切れ'); assert.equal(P.canRest(D, last, C), false);
  // 詰まない（たくさん回して、休んでも振れなくなって止まる回は 0）
  for (let seed = 1; seed <= 500; seed++) { const s = P.simulate(D, C, { seed, restAt: 100 }); assert.equal(s.stuck, 0, `seed ${seed}`); assert.ok(s.done || s.timeUp); assert.ok(s.turn <= 40); assert.ok(s.play.fat >= 0 && s.play.fat <= 100); }
});

test('PL-07：保存：v 1（移動だけ）→ v 2 へ移行・読めない形は null（元の保存は呼び出し側が壊さない）', () => {
  const v1 = C.create(D, { seed: 12 }); C.roll(D, v1, 3); C.advance(D, v1);
  const keep = JSON.parse(JSON.stringify(v1));
  const v2 = P.upgrade(D, JSON.parse(JSON.stringify(v1)));
  assert.equal(v2.v, 2); assert.equal(v2.play.migrated, true); assert.ok(P.valid(D, v2));
  for (const k of ['seed', 'node', 'turn', 'trail', 'randOpen', 'rewards', 'stopRule']) assert.deepEqual(v2[k], keep[k], `${k} はそのまま`);
  assert.deepEqual(v2.play.tiles, P.layout(D, 12), 'その育成の seed から配置');
  assert.equal(P.upgrade(D, JSON.parse(JSON.stringify(v2))).play.migrated, true, 'v 2 はそのまま');
  for (const bad of [null, 5, {}, { v: 3, node: 'START', trail: [] }, { v: 2, node: 'START', trail: [] }, { v: 1, node: 'NOPE', trail: [] }, Object.assign(JSON.parse(JSON.stringify(v2)), { play: { fat: 'x' } })]) assert.equal(P.upgrade(D, bad), null, JSON.stringify(bad).slice(0, 40));
  const view = rd('js/proto/roadfirst-view.js');
  assert.match(view, /return \{ broken: t \}/); assert.match(view, /KEY \+ '_broken'/); assert.match(view, /function persist\(\) \{ if \(broken\) return;/, '読めない保存は「最初から」を押すまで上書きしない');
});

test('PL-08：40ターン・必通・D_RAND 閉でも GOAL・48 の組み合わせを育成込みで（道筋だけ・ターン無制限）', () => {
  let n = 0;
  for (const j0 of ['L', 'R']) for (const q of [1, 2]) for (const h of ['safe', 'left', 'right']) for (const chal of [5, 1]) for (const randOpen of [false, true]) {
    const st = P.simulate(D, C, { seed: ++n, turnLimit: 999, randOpen, p: { j0, h, spurs: randOpen ? ['D_RAND'] : [] }, adv: { eventDie: q, challengeDie: chal } });
    assert.ok(st.done, `#${n}`); for (const m of MUST) assert.ok(st.trail.includes(m), `#${n} ${m}`);
    assert.equal(st.stuck, 0);
  }
  assert.equal(n, 48);
  const st = P.simulate(D, C, { seed: 3 }); assert.equal(st.limit, 40); assert.ok(st.turn <= 40);
});

test('PL-09：ダブルダイス【仮】は実験モードのときだけ・1回ごとに1個減る・2個の合計', () => {
  const st = newSt({ seed: 6 }); assert.equal(st.play.items.dd, 0); assert.equal(st.play.lab, false);
  P.roll(D, st, C, undefined, { double: true }); assert.equal(st.play.lastRoll.dice.length, 1, '持っていなければ1個');
  const lab = P.attach(D, C.create(D, { seed: 6 }), { lab: true, dd: 2 }); assert.equal(lab.play.items.dd, 2);
  const v = P.roll(D, lab, C, undefined, { double: true, dice: [6, 5] }); assert.equal(v, 11); assert.equal(lab.moveLeft, 11); assert.equal(lab.play.items.dd, 1);
  assert.equal(lab.play.fat, P.TUNING.fatigueByDie[6] + P.TUNING.fatigueByDie[5]);
  assert.match(rd('js/proto/roadfirst-view.js'), /Q\.get\('rfItemLab'\) === '1'/);
});

test('PL-10：モンスターは読み取り専用の写し・いなければデモ個体', () => {
  const m = Object.freeze({ sp: 3, name: 'ジオ', li: 90, po: 120, in: 40, hi: 50, ev: 30, de: 150, growth: Object.freeze({}) });
  const mon = P.monFrom(m); assert.equal(mon.demo, false); assert.equal(mon.base.de, 150); assert.equal(mon.growth.po, 'A'); assert.equal(mon.growth.in, 'E');
  const st = P.attach(D, C.create(D, { seed: 2 }), { monster: m }); st.play.stats.po = 500; assert.equal(m.po, 120, '元の個体は変わらない');
  const demo = P.monFrom(null); assert.equal(demo.demo, true); assert.match(demo.name, /デモ個体/); assert.deepEqual(Object.values(demo.base), [100, 100, 100, 100, 100, 100]);
});
