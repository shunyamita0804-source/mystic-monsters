// Chapter 2 A／B／C 設計案（2026-10-15）の小規模シミュレーション（テストではない道具）。
//  同じ条件（seed・方針・モンスター・休む基準）で Chapter 1 A（基準）と Chapter 2 A／B／C を回し、40T 以内の GOAL 到達率・平均ターン・6能力の合計上昇・
//  固定報酬の取得率・能力マスに止まった回数・寄り道の機会を比べる。
//  進行モデル＝試作の MMRF_PLAY.simulate（MMRF_CORE の移動＋マスの中身）。本編との違い（都合のいい数字にならないよう明記）：
//   ・バトルは起きない（野生のマス＝空腹 +5 だけ）・食事アイテムは使わない・「休む」は空腹が restAt 以上のとき（−10・1ターン）
//   ・マスの配置の割合・上昇量は Chapter 1 の TUNING と GROWTH_GAIN（Chapter の区別なし）。Chapter 2 の正式な上昇量（A25…）は未反映＝公平性の比較が目的
//   ・レアモンスターのマス（Z1／Z2 は Chapter 1 の地点 ID）は Chapter 2 では出ない・能力の道の偏り（statBias）も Chapter 1 の区間 ID だけ
//   ・分かれ道（自由）は乱数で選ぶ・寄り道は SPUR の割合（既定 0.25）で入る・運命のサイコロ・特殊挑戦は本物のルール（奇偶・5/6）
//  使い方：node tools/ch2/sim.mjs [seed 数=400] [SPUR=0.25] [restAt=86]
import { loadEngine } from '../../tests/chapter-sim.mjs';
const N = Number(process.argv[2]) || 400, SPUR = process.argv[3] != null ? Number(process.argv[3]) : 0.25, REST_AT = process.argv[4] != null ? Number(process.argv[4]) : 86;
const SEED0 = Number(process.env.CH2_SEED0) || 0;   // 案の比較だけ：seed の並びをずらす（ばらつきの確かめ）
const E = loadEngine(); globalThis.MMP10M = E.w.MMP10M;
await import('../../js/proto/roadfirst-data.js'); await import('../../js/proto/roadfirst-core.js'); await import('../../js/proto/roadfirst-play.js'); await import(process.env.CH2_ROUTES ? new URL('file://' + process.env.CH2_ROUTES).href : '../../js/proto/ch2-routes.js');
const C = globalThis.MMRF_CORE, P = globalThis.MMRF_PLAY, CH2 = globalThis.MMRF_CH2;
P.setEventPool(E.CH.getConfig(1).eventPool);
const K = P.STAT_KEYS, REW = ['L_CHEST', 'R_CHEST', 'L_ALTAR', 'L_LATE_ALTAR', 'REWARD5', 'R_SPECIAL', 'RANDOM_DEN'];
const MONS = [{ sp: 0, name: 'ソラモ', ...E.w.MMP10M.baseOf(0) }, { sp: 1, name: 'ガウル', ...E.w.MMP10M.baseOf(1) }];
const BOARDS = { 'Ch1-A（基準）': globalThis.MMRF_DATA, 'Ch2-A': CH2.A, 'Ch2-B': CH2.B, 'Ch2-C': CH2.C };
// 案の比較だけ：CH2_BOARDS=Ch2-A,Ch2-B のように回す盤を絞る（既定は全部）
if (process.env.CH2_BOARDS) for (const k of Object.keys(BOARDS)) if (!process.env.CH2_BOARDS.split(',').includes(k)) delete BOARDS[k];
// 2026-10-15 第3版：食事のあるモデル（CH2_FOOD=個数）。本編の Chapter 1 と同じ「空腹 80 以上でジャガイモ（−10）を1ターンに1個・ターンは使わない」
//  （新人支援のジャガイモ 10個・バッグ 2枠＝最大 20個が目安）。それ以外は P.simulate と同じ手順（MMRF_PLAY の公開関数だけを使う＝ゲームのコードは変えない）
const FOOD = Number(process.env.CH2_FOOD) || 0, EAT_AT = 80, POTATO = 10;
const LIMIT = Number(process.env.CH2_LIMIT) || undefined;   // 時間切れの救済案の比較だけ：ターン上限を変えて回す（ゲームの規則は変えない）
/** GOAL までの最短の歩数（条件・向きを見ない逆向きの幅優先）＝時間切れの個体があと何歩だったか */
function goalDist(D) {
  if (D.__gd) return D.__gd;
  const back = {}; for (const e of D.edges) (back[e[1]] = back[e[1]] || []).push(e[0]);
  const d = { GOAL: 0 }, qq = ['GOAL'];
  while (qq.length) { const v = qq.shift(); for (const u of back[v] || []) if (d[u] == null) { d[u] = d[v] + 1; qq.push(u); } }
  Object.defineProperty(D, '__gd', { value: d, enumerable: false });
  return d;
}
function simFood(D, o) {
  const st = P.attach(D, C.create(D, { ...o, turnLimit: LIMIT }), { monster: o.monster });
  const pickRng = C.mulberry(((o.seed || 1) ^ 0xC0FFEE) >>> 0);
  let food = FOOD, ateTurn = -1; st.ate = 0;
  for (let guard = 0; guard < 400 && !st.done && !st.timeUp; guard++) {
    const n = st.play.notice;
    if (n) { if (n.kind === 'choice') P.choose(D, st, Math.floor(pickRng() * n.choices.length)); P.ack(st); continue; }
    if (food > 0 && ateTurn !== st.turn && st.play.fat >= EAT_AT) { st.play.fat = Math.max(0, st.play.fat - POTATO); food--; ateTurn = st.turn; st.ate++; }
    if (st.play.fat >= REST_AT || !P.canRoll(D, st, C)) { if (P.rest(D, st, C)) continue; break; }
    if (P.roll(D, st, C) == null) break;
    let adv = {};
    for (let g = 0; g < 64; g++) { const ev = C.advance(D, st, adv); const c = ev.find((x) => x.type === 'choice'); if (!c) break; adv = { choose: o.policy(D, st, c.options) }; }
    P.land(D, st, C);
  }
  return st;
}
/** 分かれ道の方針：寄り道は SPUR の割合で（未取得のときだけ）・本線は乱数。Chapter 1 の makePolicy（J0／H の名前に依存）は使わない */
function policy(rng) {
  return (D, st, ops) => {
    const ix = C.index(D), sp = ops.filter((s) => ix.spurs.includes(s) && !st.rewards[ix.endOf[s]]), main = ops.filter((s) => !ix.spurs.includes(s));
    if (sp.length && rng() < SPUR) return sp[Math.floor(rng() * sp.length)];
    return main.length ? main[Math.floor(rng() * main.length)] : ops[0];
  };
}
const pct = (x) => (x * 100).toFixed(1);
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const q = (arr, p) => { if (!arr.length) return '-'; const s = arr.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const out = {};
if (LIMIT) process.stderr.write(`turnLimit=${LIMIT}\n`);
for (const [name, D] of Object.entries(BOARDS)) {
  const r = { n: 0, goal: 0, turns: [], gain: [], rew: 0, rewEach: {}, statStops: [], empty: [], spurOpp: [], timeAt: {}, rests: [], fat: [], short: [] };
  for (const mon of MONS) for (let i = 1; i <= N; i++) {
    const seed = (i + SEED0) * 7919 + 13, rng = C.mulberry((seed ^ 0x2CE2) >>> 0);
    const st = FOOD ? simFood(D, { seed, monster: mon, policy: policy(rng) }) : P.simulate(D, C, { seed, monster: mon, policy: policy(rng), restAt: REST_AT, randOpen: undefined, turnLimit: LIMIT });
    r.n++; if (st.done) { r.goal++; r.turns.push(st.turn); }
    else { const seg = Object.entries(D.segments).find(([, s]) => s[3].includes(st.node)); const k = seg ? seg[0] : st.node; r.timeAt[k] = (r.timeAt[k] || 0) + 1; const gd = goalDist(D)[st.node]; if (gd != null) r.short.push(gd); }
    r.gain.push(K.reduce((a, k) => a + (st.play.stats[k] - st.play.mon.base[k]), 0));
    const got = REW.filter((id) => st.play.claimed[id] != null); r.rew += got.length; for (const id of got) r.rewEach[id] = (r.rewEach[id] || 0) + 1;
    let ss = 0, em = 0; for (const h of st.play.hist) { if (h.kind === 'stat') ss++; }
    for (const [id, t] of Object.entries(st.play.used)) { const tile = st.play.tiles[id]; if (!tile) em++; }
    r.statStops.push(ss); r.empty.push(em);
    // 寄り道の機会＝歩いた跡の中で「寄り道の入口（親の地点）」に止まった／通った回数
    const ix = C.index(D), parents = new Set(Object.values(ix.parentOf)); r.spurOpp.push(st.trail.filter((x) => parents.has(x)).length);
    r.rests.push(st.play.rests); r.fat.push(st.play.fat);
  }
  const top = Object.entries(r.timeAt).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} ${pct(v / r.n)}%`).join('・') || '-';
  out[name] = { nodes: Object.keys(D.nodes).length, goal: +pct(r.goal / r.n), avgTurns: +avg(r.turns).toFixed(1), p10: q(r.turns, 0.1), p50: q(r.turns, 0.5), p90: q(r.turns, 0.9),
    gain: Math.round(avg(r.gain)), gainP10: q(r.gain, 0.1), gainP90: q(r.gain, 0.9), statStops: +avg(r.statStops).toFixed(2), rewards: +(r.rew / r.n).toFixed(2), rewardRate: +pct(r.rew / r.n / REW.length),
    rewardEach: Object.fromEntries(REW.map((id) => [id, +pct((r.rewEach[id] || 0) / r.n)])), spurOpp: +avg(r.spurOpp).toFixed(2), rests: +avg(r.rests).toFixed(2), fatEnd: Math.round(avg(r.fat)), timeUpAt: top,
    shortAtTimeUp: r.short.length ? { p25: q(r.short, 0.25), p50: q(r.short, 0.5), p90: q(r.short, 0.9), within6: +pct(r.short.filter((x) => x <= 6).length / r.n) } : null };
}
const base = out['Ch1-A（基準）'];
if (base) for (const k of ['Ch2-A', 'Ch2-B', 'Ch2-C'].filter((k) => out[k])) { const o = out[k]; o.vsCh1 = { goalPP: +(o.goal - base.goal).toFixed(1), gainPct: +((o.gain / base.gain - 1) * 100).toFixed(1), rewardPP: +(o.rewardRate - base.rewardRate).toFixed(1) }; }
const a2 = out['Ch2-A'];
if (a2) for (const k of ['Ch2-B', 'Ch2-C'].filter((k) => out[k])) { const o = out[k]; o.vsCh2A = { goalPP: +(o.goal - a2.goal).toFixed(1), gainPct: +((o.gain / a2.gain - 1) * 100).toFixed(1), rewardPP: +(o.rewardRate - a2.rewardRate).toFixed(1) }; }
console.log(JSON.stringify({ N, SPUR, REST_AT, FOOD, LIMIT: LIMIT || 40, monsters: MONS.map((m) => m.name), out }, null, 1));
