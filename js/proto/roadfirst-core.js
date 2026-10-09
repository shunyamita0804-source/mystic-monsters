// =========================================================
// Chapter 1 Pattern A 道路先行ブロックアウトの試作 — 進行のロジック `MMRF_CORE`（2026-10-09・試作。正式の Chapter 1 ではない）
//
//  データ：js/proto/roadfirst-data.js（MMRF_DATA＝キットの 09_original_source_graph.json の 299ノード／370有向接続／42区間をそのまま。
//    座標は 02_walkable_geometry.json の暫定の描画座標）。経路・分岐・通過条件はデータの edges の condition だけで決める（ここで削ったり作り直したりしない）。
//  ルール（キットの fixed_rules）：移動のサイコロ 1〜6・40ターン・Q はイベントのサイコロ（奇数＝左／偶数＝右）・CHALLENGE は 5／6 成功・1〜4 失敗・
//    報酬の枝は行き止まり（自動では戻らない＝帰りもサイコロで歩いてターンを使う）・同じ固定報酬は1回の育成で1回だけ・D_RAND の開閉は開始時に決めて保存。
//  【仮】未承認の値（ここだけにまとめる）：
//    - D_RAND が開いている確率 RAND_OPEN_P＝0.5（キットでは UNDECIDED）
//    - 途中で止まるか（stopRule）：'stop'＝Q・RIVAL・CHALLENGE・報酬の行き止まりで止まり残りの目は捨てる（キットの draft_rules。既存の Chapter 1 のライバル＝強制停止と同じ）／
//      'pass'＝通りながら出来事を起こして残りの目で進む（比較用）。既定 'stop'
//  まだ無いもの（データに無い）：能力マス・イベントマス・疲れ・成長・所持金・バトル（RIVAL は「出来事」の印だけ）
//  セーブ：ゲームのセーブ（mr4v6）とは別。状態はこのファイルの関数が作る素の JSON（表示側が localStorage の別の鍵に置く）。
// =========================================================
(function (root) {
  'use strict';
  const RAND_OPEN_P = 0.5;   // 【仮】
  const STOP_ROLES = ['parity_forced_fork', 'mandatory_rival', 'challenge_d6_5_6'];   // 'stop' のとき止まる所（＋行き止まり・GOAL）
  const DEAD_ROLES = ['fixed_reward_dead_end', 'optional_random_unlock_dead_end'];
  const SPUR_KINDS = ['reward_spur', 'optional_random_spur'];

  function mulberry(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function index(D) {
    if (D.__ix) return D.__ix;
    const out = {}, seg = D.segments;
    for (const e of D.edges) (out[e[0]] = out[e[0]] || []).push({ src: e[0], dst: e[1], seg: e[2], dir: e[3], cond: e[4] });
    const spurs = Object.keys(seg).filter((k) => SPUR_KINDS.includes(seg[k][2]));
    const ix = { out, spurs, parentOf: Object.fromEntries(spurs.map((k) => [k, seg[k][0]])), endOf: Object.fromEntries(spurs.map((k) => [k, seg[k][1]])) };
    Object.defineProperty(D, '__ix', { value: ix, enumerable: false });
    return ix;
  }
  const role = (D, id) => (D.nodes[id] ? D.nodes[id][2] : '');

  /** 新しい試作の進行（開始時に D_RAND の開閉を決める） */
  function create(D, opts = {}) {
    const seed = Number.isFinite(opts.seed) ? opts.seed >>> 0 : Math.floor(Math.random() * 2 ** 31);
    const rng = mulberry(seed ^ 0x9E3779B9);
    const p = Number.isFinite(opts.randP) ? opts.randP : RAND_OPEN_P;
    return {
      v: 1, seed, rs: seed, limit: opts.turnLimit || D.fixed_rules.training_turn_limit || 40, stopRule: opts.stopRule === 'pass' ? 'pass' : 'stop',
      randOpen: typeof opts.randOpen === 'boolean' ? opts.randOpen : rng() < p, randP: p,
      node: 'START', turn: 0, moveLeft: 0, lastDie: null, back: null, exclude: null, qPar: null, qDie: null, chal: null, chalDie: null,
      rival: false, gates: [], rewards: {}, spurDone: {}, trail: ['START'], discarded: 0, done: false, timeUp: false, log: [],
    };
  }
  function rand(st) { const r = mulberry(st.rs); const v = r(); st.rs = (st.rs + 0x6D2B79F5) >>> 0; return v; }
  const d6 = (st) => 1 + Math.floor(rand(st) * 6);

  function condOk(st, c) {
    if (c === 'always') return true;
    if (c === 'Q_odd_only') return st.qPar === 'odd';
    if (c === 'Q_even_only') return st.qPar === 'even';
    if (c === 'CHALLENGE_5_6') return st.chal === 'success';
    if (c === 'CHALLENGE_1_4') return st.chal === 'fail';
    if (c === 'unlock_random_event') return !!st.randOpen;
    return false;
  }
  /** 今の地点から進める接続（行き止まりから戻る途中は、その枝の戻りの接続だけ） */
  function options(D, st) {
    const ix = index(D), out = ix.out[st.node] || [];
    if (st.back) return out.filter((e) => e.dir === 'reverse' && e.seg === st.back);
    return out.filter((e) => e.dir === 'forward' && condOk(st, e.cond) && e.seg !== st.exclude);
  }
  const needsChoice = (D, st) => !st.done && st.moveLeft > 0 && options(D, st).length > 1;

  /** サイコロを振る（1ターン）。die を渡すとその目（テスト用）。o.max＝出目の上限（既定 6。2026-10-09 育成の試作：ダブルダイス【仮】の 2〜12 用＝js/proto/roadfirst-play.js） */
  function roll(D, st, die, o = {}) {
    if (st.done || st.timeUp || st.moveLeft > 0 || st.turn >= st.limit) return null;
    const max = o && Number.isInteger(o.max) ? o.max : 6;
    const v = Number.isInteger(die) && die >= 1 && die <= max ? die : d6(st);
    st.turn++; st.moveLeft = v; st.lastDie = v; st.discarded = 0;
    // 行き止まりにいる＝今回の移動は戻り道から（自動では戻らない＝ここで初めて戻り始める）
    const r = role(D, st.node);
    if (DEAD_ROLES.includes(r) && !st.back) { const sp = index(D).spurs.find((k) => index(D).endOf[k] === st.node); if (sp) st.back = sp; }
    st.log.push({ t: st.turn, die: v, at: st.node });
    return v;
  }

  /** 進める。止まる・分岐で選ぶ・使い切るまで1地点ずつ。戻り値＝起きたこと（表示用）の配列。choose に接続の seg を渡すと分岐で選ぶ */
  function advance(D, st, o = {}) {
    const ev = [], ix = index(D);
    let pick = o.choose || null;
    while (st.moveLeft > 0 && !st.done) {
      const op = options(D, st);
      if (!op.length) { ev.push({ type: 'blocked', at: st.node }); st.discarded += st.moveLeft; st.moveLeft = 0; break; }
      let e = op[0];
      if (op.length > 1) {
        const hit = pick && op.find((x) => x.seg === pick);
        if (!hit) { ev.push({ type: 'choice', at: st.node, options: op.map((x) => x.seg) }); return ev; }
        e = hit; pick = null;
      }
      const from = st.node; st.node = e.dst; st.moveLeft--; st.trail.push(e.dst);
      if (st.back && e.dst === ix.parentOf[st.back]) { st.spurDone[st.back] = true; st.exclude = st.back; st.back = null; }
      else if (!st.back) st.exclude = null;
      ev.push({ type: 'step', from, to: e.dst, seg: e.seg, left: st.moveLeft });
      arrive(D, st, e, ev, o);
    }
    if (!st.done && st.moveLeft === 0 && st.turn >= st.limit) { st.timeUp = true; ev.push({ type: 'timeup', at: st.node }); }
    return ev;
  }
  function stopHere(st, ev, why) {
    if (st.moveLeft > 0 && st.stopRule === 'stop') { st.discarded += st.moveLeft; ev.push({ type: 'stop', at: st.node, why, discarded: st.moveLeft }); st.moveLeft = 0; }
  }
  function arrive(D, st, e, ev, o) {
    const id = st.node, r = role(D, id);
    if (r === 'goal') { st.done = true; st.discarded += st.moveLeft; st.moveLeft = 0; ev.push({ type: 'goal', at: id }); return; }
    if (r === 'lower_walk_through_gate' || r === 'upper_walk_through_gate') { if (!st.gates.includes(id)) st.gates.push(id); ev.push({ type: 'gate', at: id }); return; }
    if (r === 'parity_forced_fork' && !st.qPar) {
      const v = Number.isInteger(o.eventDie) ? o.eventDie : d6(st); st.qDie = v; st.qPar = v % 2 ? 'odd' : 'even';
      ev.push({ type: 'eventDie', at: id, kind: 'Q', die: v, result: st.qPar }); stopHere(st, ev, 'Q'); return;
    }
    if (r === 'mandatory_rival') { st.rival = true; ev.push({ type: 'rival', at: id }); stopHere(st, ev, 'RIVAL'); return; }
    if (r === 'challenge_d6_5_6' && !st.chal) {
      const v = Number.isInteger(o.challengeDie) ? o.challengeDie : d6(st); st.chalDie = v; st.chal = v >= 5 ? 'success' : 'fail';
      ev.push({ type: 'eventDie', at: id, kind: 'CHALLENGE', die: v, result: st.chal }); stopHere(st, ev, 'CHALLENGE'); return;
    }
    if (DEAD_ROLES.includes(r)) {
      const first = !st.rewards[id]; st.rewards[id] = true;
      ev.push({ type: r === 'fixed_reward_dead_end' ? 'reward' : 'den', at: id, first });
      // 行き止まり：自動では戻らない＝残りの目は捨てる（次のターンに戻り始める）
      if (st.moveLeft > 0) { st.discarded += st.moveLeft; ev.push({ type: 'stop', at: id, why: 'dead_end', discarded: st.moveLeft }); st.moveLeft = 0; }
    }
  }

  /** 1ターンを最後まで（選択は policy(D, st, options) が返す seg）。シミュレーション・テスト用 */
  function playTurn(D, st, policy, o = {}) {
    if (roll(D, st, o.die) == null) return [];
    const all = [];
    for (let guard = 0; guard < 64; guard++) {
      const ev = advance(D, st, o); all.push(...ev);
      const c = ev.find((x) => x.type === 'choice'); if (!c) break;
      o = Object.assign({}, o, { choose: policy(D, st, c.options) });
    }
    return all;
  }

  /** 方針（分岐での選び方）。spurs＝寄り道する報酬の枝（区間 ID）の集まり、j0／h＝左右の選び方 */
  function makePolicy(p = {}, rng = Math.random) {
    const want = new Set(p.spurs || []);
    return (D, st, ops) => {
      const ix = index(D);
      const sp = ops.find((s) => want.has(s) && !st.rewards[ix.endOf[s]]); if (sp) return sp;
      const main = ops.filter((s) => !ix.spurs.includes(s));
      if (st.node === 'J0') return p.j0 === 'L' ? 'EL01' : p.j0 === 'R' ? 'ER01' : main[Math.floor(rng() * main.length)];
      if (st.node === 'H') return { safe: 'LATE_SAFE', left: 'LATE_L1', right: 'LATE_R1' }[p.h] || main[Math.floor(rng() * main.length)];
      return main[0] || ops[0];
    };
  }
  /** 40ターンを最後まで（GOAL か時間切れ） */
  function simulate(D, opts = {}) {
    const st = create(D, opts), pol = opts.policy || makePolicy(opts.p || {}, mulberry((opts.seed || 1) ^ 0x51ED));
    while (!st.done && !st.timeUp) playTurn(D, st, pol);
    return st;
  }

  const api = { RAND_OPEN_P, STOP_ROLES, DEAD_ROLES, d6, create, options, needsChoice, roll, advance, playTurn, makePolicy, simulate, index, role, mulberry };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.MMRF_CORE = api;
})(typeof window !== 'undefined' ? window : globalThis);
