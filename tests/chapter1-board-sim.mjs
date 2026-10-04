// =========================================================
// Chapter 1 のボード設計の比較（テストではない道具。2026-10-06）
//  実物の進行（MMP8・MMCH・ch1a.js）を Node で動かし、分かれ道はすべてランダムに選んで、
//  到達率・ターン（平均・中央値・p90）・ルートごとの結果・能力マスに止まった回数・6能力の合計の伸びを数える。
//  使い方：node tests/chapter1-board-sim.mjs [回数=1000] [ターン上限の並び=45] [上昇量の候補の並び=cur]
//   上昇量の候補：cur＝今の表（js/phase10/monsters.js の GROWTH_GAIN）・g4＝A6 B5 C4 D3 E2・g3＝A5 B4 C3 D2 E2
//   例：node tests/chapter1-board-sim.mjs 1000 40,45,50 cur,g4,g3
//  環境変数 MM_SIM_ROOT＝別のリポジトリの木（旧 Chapter 1 との比較用。git archive で取り出した js/ と同じ並び）
// =========================================================
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { lcg } from './chapter-sim.mjs';

const ROOT = process.env.MM_SIM_ROOT || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TABLES = { cur: null, g4: { A: 6, B: 5, C: 4, D: 3, E: 2 }, g3: { A: 5, B: 4, C: 3, D: 2, E: 2 } };
const STATS = ['li', 'po', 'in', 'hi', 'ev', 'de'];

function load(turnLimit, table) {
  const w = { MMCH_CH1A_TURN_LIMIT: turnLimit, MMCH_CH1A_GROWTH: table };
  for (const f of ['js/phase7/progression.js', 'js/phase8/league.js', 'js/phase8/raising.js', 'js/phase10/monsters.js', 'js/phase9/chapters.js', 'js/chapter/engine.js', 'js/chapter/configs/ch1a.js'])
    new Function('window', readFileSync(path.join(ROOT, f), 'utf8'))(w);
  for (const c of w.MMP9C.CHAPTERS) w.MMP7.registerChapterBoard(c.no, c.track, { provisional: false });
  return { P7: w.MMP7, P8: w.MMP8, CH: w.MMCH, w };
}

function runOnce(E, seed, sp) {
  const { P7, P8, CH } = E, rnd = lcg(seed);
  const S = P8.newSave(); S.m = P8.initIndividual(S, { sp, name: 'シム', age: 0, span: 30, h: 0, rk: 0, fa: 0, st: 0, last: null, li: 100, po: 100, in: 100, hi: 100, ev: 100, de: 100, sk: [0, 1, 2, 3], eq: [0, 1, 2, 3, -1, -1] });
  P7.ensureProg(S.m); const m = S.m, start = STATS.map((k) => m[k]);
  const d = P8.depart(S, m, rnd); if (!d.ok) throw new Error('depart ' + d.reason);
  const st = { picks: [], stat: 0, battle: 0, event: 0, treasure: 0, rests: 0 };
  for (let guard = 0; guard < 600; guard++) {
    const ph = P8.boardPhase(m);
    if (ph === 'goal' || ph === 'timeup') break;
    if (ph === 'roll') { if (!P8.canRoll(m) || CH.fatigue(m) >= 86) { st.rests++; P8.rest(S, m); } else P8.roll(S, m, rnd); continue; }
    if (ph === 'move') { P8.step(S, m); continue; }
    if (ph === 'branch') { const o = m.raise.pend.opts, id = o[Math.floor(rnd() * o.length)]; st.picks.push(CH.graphFor(m).nodes[id].branch || id); P8.chooseBranch(S, m, id); continue; }
    if (ph === 'resolve') {
      let r = P8.resolveLanding(S, m, rnd), fx = r.fx || {};
      if (fx.kind === 'choice') { r = P8.resolveChoice(S, m, fx.options[Math.floor(rnd() * fx.options.length)].id, rnd); fx = r.fx || {}; }
      if (fx.kind === 'chstat') st.stat++; else if (fx.kind === 'treasure') st.treasure++; else if (fx.ev) st.event++;
      if (fx.kind === 'battle') { st.battle++; P8.beginBattle(S, m, { kind: 'practice', rank: 0 }); P8.markBattleDone(S); P8.finishBattle(S, m, rnd); }
      continue;
    }
    throw new Error('unexpected phase ' + ph);
  }
  st.turns = m.raise.turnsUsed; st.goal = !!m.raise.goal; st.gain = STATS.reduce((a, k, i) => a + m[k] - start[i], 0);
  st.route = st.picks.join('/');
  return st;
}

const avg = (xs) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length), med = (xs) => { const a = [...xs].sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : 0; };
const pct = (xs, p) => { const a = [...xs].sort((x, y) => x - y); return a.length ? a[Math.min(a.length - 1, Math.floor(a.length * p))] : 0; };
export function simulate(n, turnLimit, tableKey, sp = 0) {
  const E = load(turnLimit, TABLES[tableKey]), runs = [];
  for (let i = 0; i < n; i++) runs.push(runOnce(E, 20261006 + i * 101, sp));
  const ok = runs.filter((r) => r.goal), routes = {};
  for (const r of runs) (routes[r.route] = routes[r.route] || []).push(r);
  return {
    turnLimit, table: tableKey, n, reach: +(ok.length / n * 100).toFixed(1), avgTurns: +avg(ok.map((r) => r.turns)).toFixed(1), median: med(ok.map((r) => r.turns)), p90: pct(ok.map((r) => r.turns), 0.9), max: Math.max(...ok.map((r) => r.turns)),
    statStops: +avg(runs.map((r) => r.stat)).toFixed(1), gain: +avg(runs.map((r) => r.gain)).toFixed(1), battles: +avg(runs.map((r) => r.battle)).toFixed(1), events: +avg(runs.map((r) => r.event)).toFixed(1), treasure: +avg(runs.map((r) => r.treasure)).toFixed(1), rests: +avg(runs.map((r) => r.rests)).toFixed(1),
    routes: Object.fromEntries(Object.entries(routes).sort().map(([k, rs]) => [k, { n: rs.length, reach: +(rs.filter((r) => r.goal).length / rs.length * 100).toFixed(1), avgTurns: +avg(rs.filter((r) => r.goal).map((r) => r.turns)).toFixed(1), gain: +avg(rs.map((r) => r.gain)).toFixed(1), statStops: +avg(rs.map((r) => r.stat)).toFixed(1) }])),
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const n = +(process.argv[2] || 1000), limits = (process.argv[3] || '45').split(',').map(Number), tables = (process.argv[4] || 'cur').split(',');
  for (const L of limits) for (const t of tables) { const r = simulate(n, L, t, +(process.env.MM_SIM_SP || 0)); console.log(JSON.stringify(r)); }
}
