// 2026-10-18 Chapter 3「天空の浮島」A／B／C の 40ターンのシミュレーション（テストではない道具）。
//  試作の進行モデル MMRF_PLAY.simulate（本編と同じ配置＝bias・route・道のデータの calm）で、方針 15通り（H の3択 × 寄り道 5通り・J0 と運命は乱数）× seed を回す。
//  比べる物：GOAL 到達率・平均の使ったターン・平均総能力上昇・固定報酬の取得率・能力マスに止まった回数・行き詰まり（進めない状態）の有無。Chapter 1 A も並べる。
//  使い方：node tools/ch3/sim.mjs [seed 数=600]
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const N = +(process.argv[2] || 600);
const w = {};
for (const f of ['js/phase10/monsters.js', 'js/chapter/engine.js', 'js/chapter/configs/ch1a.js', 'js/proto/roadfirst-data.js', 'js/proto/roadfirst-routes.js', 'js/proto/ch3-routes.js', 'js/proto/roadfirst-core.js', 'js/proto/roadfirst-play.js']) new Function('window', rd(f))(w);
const C = w.MMRF_CORE, P = w.MMRF_PLAY, R = { 'Ch1-A': w.MMRF_DATA, A: w.MMRF_CH3.A, B: w.MMRF_CH3.B, C: w.MMRF_CH3.C };
const K = ['li', 'po', 'in', 'hi', 'ev', 'de'], REW = ['L_CHEST', 'R_CHEST', 'L_ALTAR', 'L_LATE_ALTAR', 'REWARD5', 'R_SPECIAL', 'RANDOM_DEN'];
const SPURS = [[], ['D_LC'], ['D_RC'], ['D_LA'], ['D_R5']], HS = ['safe', 'left', 'right'];
const out = {};
for (const sp of [0, 1]) {
  const mon = { sp, name: 'シム', ...w.MMP10M.baseOf(sp) };
  for (const [rk, D] of Object.entries(R)) {
    let goal = 0, gain = 0, n = 0, rew = 0, statStops = 0, turns = 0, stuck = 0, kinds = {};
    for (const h of HS) for (const spurs of SPURS) for (let s = 1; s <= N; s++) {
      let st; try { st = P.simulate(D, C, { seed: s * 7919 + 13, p: { h, spurs }, monster: mon, bias: true, route: rk === 'A' || rk === 'Ch1-A' ? undefined : rk, randOpen: true }); } catch (e) { stuck++; continue; }
      n++; if (st.done) { goal++; turns += st.turn; }
      gain += K.reduce((a, k) => a + (st.play.stats[k] - st.play.mon.base[k]), 0);
      rew += REW.filter((id) => (st.rewards && st.rewards[id]) || (st.play.claimed && st.play.claimed[id] != null)).length;
      for (const id of Object.keys(st.play.used || {})) { const t = st.play.tiles[id]; if (!t) continue; kinds[t.t] = (kinds[t.t] || 0) + 1; if (t.t === 'stat') statStops++; }
    }
    out[`${sp}:${rk}`] = { runs: n, stuck, goal: +(goal / n * 100).toFixed(1), turnsAtGoal: +(turns / Math.max(1, goal)).toFixed(1), gain: +(gain / n).toFixed(1), rewards: +(rew / n).toFixed(2), statStops: +(statStops / n).toFixed(1),
      stops: Object.fromEntries(Object.entries(kinds).map(([k, v]) => [k, +(v / n).toFixed(2)])) };
  }
}
console.log(JSON.stringify({ N, out }, null, 1));
