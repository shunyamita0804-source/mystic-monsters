// Chapter 4「灼熱の火山」A／B／C 設計案（2026-10-18）の 40ターン反復シミュレーション（テストではない道具）。
//  同じ条件（seed・方針・モンスター・休む基準）で Chapter 1 A（基準）・Chapter 2 A（参考）と Chapter 4 A／B／C を回し、
//  40T 以内の GOAL 到達率・到達の平均ターン・6能力の合計上昇・固定報酬 6＋隠れ家の取得率（各枠）・能力マスに止まった回数・ライバル遭遇率・
//  レアのマスの数・特殊挑戦の成否と使った歩数・寄り道の機会・時間切れの地点と GOAL までの残り歩数・進めなくなった回（0 のはず）を比べる。
//  進行モデル＝試作の MMRF_PLAY（MMRF_CORE の移動＋マスの中身）。本編との違い（都合のいい数字にならないよう明記）：
//   ・バトルは起きない（野生のマス＝空腹 +5 だけ）・「休む」は空腹が restAt（既定 86）以上のとき（−10・1ターン）
//   ・マスの配置の割合・上昇量は Chapter 1 の TUNING と GROWTH_GAIN（Chapter の区別なし）。Chapter 4 の正式な上昇量（A33…）は未反映＝公平性と到達率の比較が目的
//   ・分かれ道（自由）は乱数で選ぶ・寄り道は SPUR の割合（既定 0.25）で入る・運命のサイコロ・特殊挑戦は本物のルール（奇偶・5/6）・隠れ家の開閉は 50%（MMRF_CORE の RAND_OPEN_P【仮】）
//   ・食事あり（CH4_FOOD=個数・既定 10＝新人支援のジャガイモ）：本編と同じく空腹 80 以上でジャガイモ（−10）を1ターンに1個・ターンは使わない。CH4_FOOD=0 で食事なし（下限の目安）
//  使い方：node tools/ch4/sim.mjs [seed 数=12000] [SPUR=0.25] [restAt=86]
//    環境変数：CH4_FOOD（既定 10）・CH4_SEED0（seed の並びをずらす）・CH4_BOARDS（Ch4-A,Ch4-B のように絞る）・CH4_ROUTES（別の ch4-routes.js で比較）・CH4_LIMIT（ターン上限の比較）
//    seed＝(i + CH4_SEED0) * 7919 + 13（i＝1〜N）・方針の乱数＝seed ^ 0x2CE2・2択の乱数＝seed ^ 0xC0FFEE（tools/ch2/sim.mjs と同じ＝決定的）
import { loadEngine } from '../../tests/chapter-sim.mjs';
const N = Number(process.argv[2]) || 12000, SPUR = process.argv[3] != null ? Number(process.argv[3]) : 0.25, REST_AT = process.argv[4] != null ? Number(process.argv[4]) : 86;
const SEED0 = Number(process.env.CH4_SEED0) || 0;
const E = loadEngine(); globalThis.MMP10M = E.w.MMP10M;
await import('../../js/proto/roadfirst-data.js'); await import('../../js/proto/roadfirst-core.js'); await import('../../js/proto/roadfirst-play.js');
await import('../../js/proto/ch2-routes.js');
const M4 = await import(process.env.CH4_ROUTES ? new URL('file://' + process.env.CH4_ROUTES).href : '../../js/proto/ch4-routes.js');
// リポジトリの外の比較用ファイルは CommonJS として読まれる（module.exports）＝その場合は default から取る
const C = globalThis.MMRF_CORE, P = globalThis.MMRF_PLAY, CH2 = globalThis.MMRF_CH2, CH4 = (M4 && M4.default && M4.default.A ? M4.default : null) || globalThis.MMRF_CH4;
P.setEventPool(E.CH.getConfig(1).eventPool);
const K = P.STAT_KEYS, REW = ['L_CHEST', 'R_CHEST', 'L_ALTAR', 'L_LATE_ALTAR', 'REWARD5', 'R_SPECIAL', 'RANDOM_DEN'];
const MONS = [{ sp: 0, name: 'ソラモ', ...E.w.MMP10M.baseOf(0) }, { sp: 1, name: 'ガウル', ...E.w.MMP10M.baseOf(1) }];
const BOARDS = { 'Ch1-A（基準）': globalThis.MMRF_DATA, 'Ch2-A（参考）': CH2.A, 'Ch4-A': CH4.A, 'Ch4-B': CH4.B, 'Ch4-C': CH4.C };
if (process.env.CH4_BOARDS) for (const k of Object.keys(BOARDS)) if (!process.env.CH4_BOARDS.split(',').includes(k)) delete BOARDS[k];
const FOOD = process.env.CH4_FOOD != null ? Number(process.env.CH4_FOOD) : 10, EAT_AT = 80, POTATO = 10;
const LIMIT = Number(process.env.CH4_LIMIT) || undefined;
function goalDist(D) {
  if (D.__gd) return D.__gd;
  const back = {}; for (const e of D.edges) (back[e[1]] = back[e[1]] || []).push(e[0]);
  const d = { GOAL: 0 }, qq = ['GOAL'];
  while (qq.length) { const v = qq.shift(); for (const u of back[v] || []) if (d[u] == null) { d[u] = d[v] + 1; qq.push(u); } }
  Object.defineProperty(D, '__gd', { value: d, enumerable: false });
  return d;
}
/** 1回の育成（40ターン）。食事あり＝サイコロの前に空腹 80 以上なら1個（ターンは使わない）。それ以外は MMRF_PLAY.simulate と同じ手順（公開関数だけ＝ゲームのコードは変えない） */
function run(D, o) {
  const st = P.attach(D, C.create(D, { ...o, turnLimit: LIMIT }), { monster: o.monster });
  const pickRng = C.mulberry(((o.seed || 1) ^ 0xC0FFEE) >>> 0);
  let food = FOOD, ateTurn = -1; st.ate = 0; st.stuck = 0; st.guardOut = false;
  let guard = 0;
  for (; guard < 400 && !st.done && !st.timeUp; guard++) {
    const n = st.play.notice;
    if (n) { if (n.kind === 'choice') P.choose(D, st, Math.floor(pickRng() * n.choices.length)); P.ack(st); continue; }
    if (food > 0 && ateTurn !== st.turn && st.play.fat >= EAT_AT) { st.play.fat = Math.max(0, st.play.fat - POTATO); food--; ateTurn = st.turn; st.ate++; }
    if (st.play.fat >= REST_AT || !P.canRoll(D, st, C)) { if (P.rest(D, st, C)) continue; st.stuck++; break; }
    if (P.roll(D, st, C) == null) { st.stuck++; break; }
    let adv = {};
    for (let g = 0; g < 64; g++) { const ev = C.advance(D, st, adv); const c = ev.find((x) => x.type === 'choice'); if (!c) break; adv = { choose: o.policy(D, st, c.options) }; }
    P.land(D, st, C);
  }
  if (guard >= 400 && !st.done && !st.timeUp) st.guardOut = true;   // 進めない（無限ループ）の検出＝0 のはず
  return st;
}
/** 分かれ道の方針：寄り道は SPUR の割合で（未取得のときだけ）・本線は乱数（区間の名前に依存しない） */
function policy(rng) {
  return (D, st, ops) => {
    const ix = C.index(D), sp = ops.filter((s) => ix.spurs.includes(s) && !st.rewards[ix.endOf[s]]), main = ops.filter((s) => !ix.spurs.includes(s));
    if (sp.length && rng() < SPUR) return sp[Math.floor(rng() * sp.length)];
    return main.length ? main[Math.floor(rng() * main.length)] : ops[0];
  };
}
const pct = (x) => +(x * 100).toFixed(1);
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const q = (arr, p) => { if (!arr.length) return null; const s = arr.slice().sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const out = {};
for (const [name, D] of Object.entries(BOARDS)) {
  const r = { n: 0, goal: 0, turns: [], gain: [], rew: 0, rewEach: {}, statStops: [], empty: [], spurOpp: [], timeAt: {}, rests: [], fat: [], short: [], rival: 0, rivalTurn: [], rare: { 0: 0, 1: 0, more: 0 }, rareHit: 0,
    chal: { none: 0, success: 0, fail: 0 }, qpar: { none: 0, odd: 0, even: 0 }, stuck: 0, guardOut: 0, ate: [], visited: [], kinds: {} };
  for (const mon of MONS) for (let i = 1; i <= N; i++) {
    const seed = (i + SEED0) * 7919 + 13, rng = C.mulberry((seed ^ 0x2CE2) >>> 0);
    const st = run(D, { seed, monster: mon, policy: policy(rng) });
    r.n++; if (st.done) { r.goal++; r.turns.push(st.turn); }
    else { const seg = Object.entries(D.segments).find(([, s]) => s[3].includes(st.node)); const k = seg ? seg[0] : st.node; r.timeAt[k] = (r.timeAt[k] || 0) + 1; const gd = goalDist(D)[st.node]; if (gd != null) r.short.push(gd); }
    r.gain.push(K.reduce((a, k) => a + (st.play.stats[k] - st.play.mon.base[k]), 0));
    const got = REW.filter((id) => st.play.claimed[id] != null); r.rew += got.length; for (const id of got) r.rewEach[id] = (r.rewEach[id] || 0) + 1;
    let ss = 0, em = 0; for (const h of st.play.hist) { if (h.kind === 'stat') ss++; }
    for (const id of Object.keys(st.play.used)) { const tile = st.play.tiles[id]; if (!tile) em++; else r.kinds[tile.t] = (r.kinds[tile.t] || 0) + 1; }
    r.statStops.push(ss); r.empty.push(em);
    const ix = C.index(D), parents = new Set(Object.values(ix.parentOf)); r.spurOpp.push(st.trail.filter((x) => parents.has(x)).length);
    r.rests.push(st.play.rests); r.fat.push(st.play.fat); r.ate.push(st.ate);
    if (st.rival) { r.rival++; const t = st.log.findIndex((l) => l.at === 'RIVAL'); r.rivalTurn.push(t >= 0 ? t : st.turn); }
    const rares = Object.values(st.play.tiles).filter((t) => t.t === 'wild' && t.rare).length; r.rare[rares > 1 ? 'more' : rares]++;
    if (Object.entries(st.play.used).some(([id]) => st.play.tiles[id] && st.play.tiles[id].rare)) r.rareHit++;
    r.chal[st.chal || 'none']++; r.qpar[st.qPar || 'none']++;
    r.stuck += st.stuck; if (st.guardOut) r.guardOut++;
    r.visited.push(new Set(st.trail).size);
  }
  const top = Object.entries(r.timeAt).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} ${pct(v / r.n)}%`).join('・') || '-';
  out[name] = { nodes: Object.keys(D.nodes).length, runs: r.n, goal: pct(r.goal / r.n), avgTurns: +avg(r.turns).toFixed(1), p10: q(r.turns, 0.1), p50: q(r.turns, 0.5), p90: q(r.turns, 0.9),
    gain: Math.round(avg(r.gain)), gainP10: q(r.gain, 0.1), gainP90: q(r.gain, 0.9), statStops: +avg(r.statStops).toFixed(2), emptyStops: +avg(r.empty).toFixed(2),
    stops: Object.fromEntries(Object.entries(r.kinds).map(([k, v]) => [k, +(v / r.n).toFixed(2)])),
    rewards: +(r.rew / r.n).toFixed(2), rewardRate: pct(r.rew / r.n / REW.length), rewardEach: Object.fromEntries(REW.map((id) => [id, pct((r.rewEach[id] || 0) / r.n)])),
    spurOpp: +avg(r.spurOpp).toFixed(2), rests: +avg(r.rests).toFixed(2), ate: +avg(r.ate).toFixed(2), fatEnd: Math.round(avg(r.fat)), visited: +avg(r.visited).toFixed(1),
    rivalRate: pct(r.rival / r.n), rivalRateAtGoal: 100, rivalTurnP50: q(r.rivalTurn, 0.5),
    rare: { none: pct(r.rare[0] / r.n), one: pct(r.rare[1] / r.n), more: pct(r.rare.more / r.n), fought: pct(r.rareHit / r.n) },
    challenge: { entered: pct((r.chal.success + r.chal.fail) / r.n), success: pct(r.chal.success / Math.max(1, r.chal.success + r.chal.fail)), fail: pct(r.chal.fail / Math.max(1, r.chal.success + r.chal.fail)) },
    parity: { odd: pct(r.qpar.odd / r.n), even: pct(r.qpar.even / r.n), none: pct(r.qpar.none / r.n) },
    stuck: r.stuck, guardOut: r.guardOut, timeUpAt: top,
    shortAtTimeUp: r.short.length ? { p25: q(r.short, 0.25), p50: q(r.short, 0.5), p90: q(r.short, 0.9), within6: pct(r.short.filter((x) => x <= 6).length / r.n) } : null };
}
const base = out['Ch1-A（基準）'], a2 = out['Ch2-A（参考）'], a4 = out['Ch4-A'];
for (const k of ['Ch4-A', 'Ch4-B', 'Ch4-C'].filter((k) => out[k])) {
  const o = out[k];
  if (base) o.vsCh1 = { goalPP: +(o.goal - base.goal).toFixed(1), gainPct: +((o.gain / base.gain - 1) * 100).toFixed(1), rewardPP: +(o.rewardRate - base.rewardRate).toFixed(1) };
  if (a2) o.vsCh2A = { goalPP: +(o.goal - a2.goal).toFixed(1), gainPct: +((o.gain / a2.gain - 1) * 100).toFixed(1), rewardPP: +(o.rewardRate - a2.rewardRate).toFixed(1) };
  if (a4 && k !== 'Ch4-A') o.vsCh4A = { goalPP: +(o.goal - a4.goal).toFixed(1), gainPct: +((o.gain / a4.gain - 1) * 100).toFixed(1), rewardPP: +(o.rewardRate - a4.rewardRate).toFixed(1) };
}
console.log(JSON.stringify({ N, SPUR, REST_AT, FOOD, LIMIT: LIMIT || 40, SEED0, seedRule: '(i+SEED0)*7919+13, i=1..N; policy rng seed^0x2CE2; choice rng seed^0xC0FFEE', monsters: MONS.map((m) => m.name), out }, null, 1));
