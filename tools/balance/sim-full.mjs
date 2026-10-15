// 2026-10-14 実機試遊⑲：育成全体（Chapter 1〜4＋最終公式大会 S）の能力の伸びのシミュレーション（テストではない道具）。
//  Chapter 1＝本編の1枚の世界のボード（js/chapter/world-driver.js＝A／B／C を各 1/3）、Chapter 2＝エンジン（ch2a）、3・4＝旧ボード。本物の進行（MMP8）を node の中で回す。
//  方針：分かれ道は乱数・空腹 86 以上で休む（80 以上でジャガイモを食べる）・出発の前にジャガイモを買い足す・大会は選べる最高ランクに出て全勝（初回の1体が最後まで進む想定）。
//  使い方：node tools/balance/sim-full.mjs [回数=300] [JSON の上書き（例 '{"density":{"stat":0.45},"gainByCh":{"1":{"A":13}},"calmToStat":false}'＝js/proto/roadfirst-play.js の TUNING・js/phase10/monsters.js の GROWTH_GAIN_BY_CH）]
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const FILES = ['js/phase7/progression.js', 'js/phase8/league.js', 'js/phase8/raising.js', 'js/phase10/monsters.js', 'js/phase9/chapters.js', 'js/chapter/engine.js', 'js/chapter/configs/ch1a.js', 'js/chapter/configs/ch2a.js',
  'js/proto/roadfirst-data.js', 'js/proto/roadfirst-routes.js', 'js/proto/roadfirst-core.js', 'js/proto/roadfirst-play.js', 'js/chapter/world-driver.js', 'js/items/food.js'];
const N = +(process.argv[2] || 300), OVER = process.argv[3] ? JSON.parse(process.argv[3]) : null, SPUR = +(process.env.SPUR || 0.25);
const K = ['li', 'po', 'in', 'hi', 'ev', 'de'];
const lcg = (seed) => { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };
function load() {
  const w = {}; if (OVER) w.MM_BALANCE_OVERRIDE = OVER;
  for (const f of FILES) new Function('window', rd(f))(w);
  for (const c of w.MMP9C.CHAPTERS) w.MMP7.registerChapterBoard(c.no, c.track, { provisional: false });
  w.MMFOOD.install(w.MMP7, w.MMCH);
  return w;
}
const pct = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1)))]; };
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const w = load(), P7 = w.MMP7, P8 = w.MMP8, CH = w.MMCH, M = w.MMP10M;
function eat(S, m) { if (CH.fatigue(m) < 80 || !CH.itemUseState(m).ok) return; const bag = S.inv.bag; let best = -1, amt = 0; bag.forEach((it, i) => { const e = CH.fatigueItemEffect(it.id); if (e && (e.amount || 0) > amt) { best = i; amt = e.amount; } }); if (best >= 0) CH.useFatigueItem(S, m, best); }
const restock = (S) => { for (let k = 0; k < 60 && P7.bagRoomFor(S, 'potato') > 0; k++) { if (!P7.shopBuy(S, 'potato').ok) break; const vi = S.inv.vault.findIndex((it) => it.id === 'potato'); P7.moveVaultToBag(S, vi, 1); } };
function playTour(S, m) { while (m.raise.tour.status === 'league') { const rk = m.raise.tour.rank; P8.beginBattle(S, m, { kind: 'league', rank: rk }); S.wins = (S.wins || 0) + 1; P8.markBattleDone(S); P8.finishBattle(S, m, lcg(9)); } }
function runOne(sp, seed) {
  const rnd = lcg(seed), S = P8.newSave();
  S.m = P8.initIndividual(S, { sp, name: 'シム', age: 0, span: 30, h: 0, rk: 0, fa: 0, st: 0, last: null, ...M.baseOf(sp), sk: [0, 1, 2, 3], eq: [0, 1, 2, 3, -1, -1] });
  P7.ensureProg(S.m); const m = S.m; S.g = 500; P7.bagAdd(S, 'potato', 10);
  const base = Object.fromEntries(K.map((k) => [k, m[k]])), ch = {}, c1 = { stat: 0, empty: 0, emptyFirst: 0, revisit: 0, special: 0, event: 0, battle: 0, treasure: 0, meal: 0, reward: 0, stops: 0, goal: false, turns: 0, route: null, dens: null };
  let snap = null;
  for (let g = 0; g < 40; g++) {
    const st = m.raise.state;
    if (st === 'none' || st === 'farm') { if (!P8.canDepart(S, m).ok) { P8.finishWithoutFinal(S, m); break; } restock(S); P8.depart(S, m, rnd); snap = Object.fromEntries(K.map((k) => [k, m[k]]));
      if (m.raise.ch === 1 && w.MMWD && m.raise.field && m.raise.field.tiles) { const D1 = w.MMWD.dataOf(m), ord = Object.keys(D1.nodes).filter((x) => D1.nodes[x][2] === 'ordinary_tile'), dn = { n: ord.length, stat: 0, event: 0, rest: 0, wild: 0, treasure: 0, empty: 0 }; for (const x of ord) { const t = m.raise.field.tiles[x]; dn[t ? t.t : 'empty']++; } c1.dens = dn; }
      continue; }
    if (st !== 'board') break;
    const cn = m.raise.ch;
    for (let i = 0; i < 6000; i++) {
      const ph = P8.boardPhase(m);
      if (['goal', 'timeup', 'tour', 'tour_done'].includes(ph)) break;
      if (ph === 'roll') { eat(S, m); if (P8.canRoll(m) && !(CH.fatigue(m) >= 86)) P8.roll(S, m, rnd); else if (P8.canRest(m)) P8.rest(S, m); else P8.roll(S, m, rnd); continue; }
      if (ph === 'move') { P8.step(S, m); continue; }
      if (ph === 'branch') { const o = m.raise.pend.opts; let pick = o[Math.floor(rnd() * o.length)];
        if (cn === 1 && w.MMWD && w.MMWD.branchOptions) { const bo = w.MMWD.branchOptions(m), main = bo.filter((x) => !x.spur), sp2 = bo.filter((x) => x.spur); const pool = sp2.length && rnd() < SPUR ? sp2 : main.length ? main : bo; if (pool.length) pick = pool[Math.floor(rnd() * pool.length)].id; }   // 寄り道（宝の行き止まり）は SPUR の割合だけ
        P8.chooseBranch(S, m, pick); continue; }
      if (ph === 'resolve') { const f0 = m.raise.field, id0 = m.raise.node, D0 = cn === 1 && w.MMWD ? w.MMWD.dataOf(m) : null, role0 = D0 && D0.nodes[id0] ? D0.nodes[id0][2] : '', had0 = !!(f0 && f0.tiles && f0.tiles[id0]), used0 = !!(f0 && f0.used && f0.used[id0] != null);   // 2026-10-15 追加B：何も起きない停止の内訳
        let r = P8.resolveLanding(S, m, rnd); if (r.fx && r.fx.kind === 'choice') r = P8.resolveChoice(S, m, r.fx.options[Math.floor(rnd() * r.fx.options.length)].id, rnd);
        if (cn === 1) { const fx = r.fx || {}; c1.stops++; const k = fx.kind; if (k === 'stat') c1.stat++; else if (k === 'event') c1.event++; else if (k === 'battle') c1.battle++; else if (k === 'treasure') c1.treasure++; else if (k === 'meal') c1.meal++; else if (k === 'reward') c1.reward++; else if (k === 'none' && fx.note === 'normal') c1.empty++; if (k === 'none') { if (role0 === 'ordinary_tile') { if (had0 && used0) c1.revisit++; else if (!had0) c1.emptyFirst++; } else if (!['goal', 'rival_done', 'claimed'].includes(fx.note)) c1.special++; } }
        continue; }
      if (ph === 'battle') { P8.beginBattle(S, m, { kind: 'practice', rank: 0 }); P8.markBattleDone(S); P8.finishBattle(S, m, rnd); continue; }
    }
    if (cn === 1) { c1.goal = P8.boardPhase(m) === 'goal'; c1.turns = m.raise.turnsUsed; c1.route = m.raise.field && m.raise.field.route || 'A'; }
    const before = snap;
    if (P8.boardPhase(m) === 'goal') { const el = P8.eligibleRanks(m, m.raise.ch); P8.startTournament(S, m, el[el.length - 1], 11); playTour(S, m); if (P8.canStartFinalTournament(S, m).ok) { P8.startFinalTournament(S, m, 12); playTour(S, m); } }
    ch[cn] = Object.fromEntries(K.map((k) => [k, m[k] - before[k]]));
    const e = P8.endChapter(S, m); if (e.next === 'done') break;
    snap = Object.fromEntries(K.map((k) => [k, m[k]]));
  }
  return { base, fin: Object.fromEntries(K.map((k) => [k, m[k]])), ch, c1, full: !!m.prog.rankClr[5] };
}
const NAMES = ['ソラモ', 'ガウル', 'ノビトン', 'ジオル'];
const out = {};
for (let sp = 0; sp < 4; sp++) {
  const R = []; for (let i = 0; i < N; i++) R.push(runOne(sp, 7000 + sp * 100003 + i * 977));
  const growth = Object.fromEntries(K.map((k) => [k, M.growthOf({ sp }, k)]));
  // 得意能力＝適性が最も高い（A→E）中で最終値の平均が最大の能力
  const order = ['A', 'B', 'C', 'D', 'E'], bestG = K.map((k) => order.indexOf(growth[k])).reduce((a, b) => Math.min(a, b));
  const cand = K.filter((k) => order.indexOf(growth[k]) === bestG), bestK = cand.sort((a, b) => avg(R.map((r) => r.fin[b])) - avg(R.map((r) => r.fin[a])))[0];
  const row = { growth, best: bestK, base: R[0].base, final: {}, perCh: {}, full: R.filter((r) => r.full).length / N };
  const RF = R.filter((r) => r.full);   // 最後まで（S の最終公式大会まで）進んだ回＝「Chapter 1〜4 を完了した初回の1体」
  for (const k of K) { const f = RF.map((r) => r.fin[k]); row.final[k] = f.length ? { p10: pct(f, 0.1), avg: Math.round(avg(f)), p90: pct(f, 0.9) } : null; }
  { const f = R.map((r) => r.fin[bestK]); row.finalAll = { p10: pct(f, 0.1), avg: Math.round(avg(f)), p90: pct(f, 0.9) }; }
  for (const c of [1, 2, 3, 4, 'final']) { const xs = RF.filter((r) => r.ch[c]).map((r) => r.ch[c][bestK]); if (xs.length) row.perCh[c] = Math.round(avg(xs) * 10) / 10; }
  const c1 = R.map((r) => r.c1); row.c1 = { goal: +(c1.filter((x) => x.goal).length / N * 100).toFixed(1), turns: +avg(c1.map((x) => x.turns)).toFixed(1), stat: +avg(c1.map((x) => x.stat)).toFixed(2), empty: +avg(c1.map((x) => x.empty)).toFixed(2), event: +avg(c1.map((x) => x.event)).toFixed(2), battle: +avg(c1.map((x) => x.battle)).toFixed(2), treasure: +avg(c1.map((x) => x.treasure)).toFixed(2), meal: +avg(c1.map((x) => x.meal)).toFixed(2), reward: +avg(c1.map((x) => x.reward)).toFixed(2) };
  { const ds = c1.map((x) => x.dens).filter(Boolean); row.c1dens = ds.length ? Object.fromEntries(['stat', 'event', 'rest', 'wild', 'treasure', 'empty'].map((k) => [k, +(avg(ds.map((d) => d[k] / d.n)) * 100).toFixed(1)])) : null;
    row.c1stop = { emptyFirst: +avg(c1.map((x) => x.emptyFirst)).toFixed(2), revisit: +avg(c1.map((x) => x.revisit)).toFixed(2), special: +avg(c1.map((x) => x.special)).toFixed(2), stops: +avg(c1.map((x) => x.stops)).toFixed(2) }; }
  row.c1byRoute = {}; for (const rt of ['A', 'B', 'C']) { const xs = R.filter((r) => r.c1.route === rt); if (!xs.length) continue; row.c1byRoute[rt] = { n: xs.length, goal: +(xs.filter((x) => x.c1.goal).length / xs.length * 100).toFixed(1), gain1: Math.round(avg(xs.map((x) => K.reduce((a, k) => a + x.ch[1][k], 0)))) }; }
  out[NAMES[sp]] = row;
}
console.log(JSON.stringify({ N, OVER, out }, null, 1));
