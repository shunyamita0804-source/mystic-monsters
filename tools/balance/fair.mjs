// 2026-10-14 実機試遊⑲：Chapter 1 の A／B／C の公平性（GOAL 到達率・平均総能力上昇・固定報酬の取得率）。試作の進行モデル MMRF_PLAY.simulate（本編と同じ配置＝bias・route）で
//  方針 15通り（H の3択 × 寄り道 5通り・J0 は乱数）× seed を回す。使い方：node tools/balance/fair.mjs [seed 数=600] [MM_BALANCE_OVERRIDE の JSON]
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const N = +(process.argv[2] || 600), OVER = process.argv[3] ? JSON.parse(process.argv[3]) : null;
const w = {}; if (OVER) w.MM_BALANCE_OVERRIDE = OVER;
for (const f of ['js/phase10/monsters.js', 'js/chapter/engine.js', 'js/chapter/configs/ch1a.js', 'js/proto/roadfirst-data.js', 'js/proto/roadfirst-routes.js', 'js/proto/roadfirst-core.js', 'js/proto/roadfirst-play.js']) new Function('window', rd(f))(w);
const C = w.MMRF_CORE, P = w.MMRF_PLAY, R = { A: w.MMRF_DATA, B: w.MMRF_ROUTES.B, C: w.MMRF_ROUTES.C };
const K = ['li', 'po', 'in', 'hi', 'ev', 'de'], REW = ['L_CHEST', 'R_CHEST', 'L_ALTAR', 'L_LATE_ALTAR', 'REWARD5', 'R_SPECIAL', 'RANDOM_DEN'];
const SPURS = [[], ['D_LC'], ['D_RC'], ['D_LA'], ['D_R5']], HS = ['safe', 'left', 'right'];
const out = {};
for (const sp of [0, 1]) {
  const mon = { sp, name: 'シム', ...w.MMP10M.baseOf(sp) };
  for (const [rk, D] of Object.entries(R)) {
    let goal = 0, gain = 0, n = 0, rew = 0, statStops = 0, empty = 0;
    for (const h of HS) for (const spurs of SPURS) for (let s = 1; s <= N; s++) {
      const st = P.simulate(D, C, { seed: s * 7919 + 13, p: { h, spurs }, monster: mon, bias: true, route: rk === 'A' ? undefined : rk, randOpen: true });
      n++; if (st.done) goal++;
      gain += K.reduce((a, k) => a + (st.play.stats[k] - st.play.mon.base[k]), 0);
      rew += REW.filter((id) => (st.rewards && st.rewards[id]) || (st.play.claimed && st.play.claimed[id] != null)).length;
      for (const id of Object.keys(st.play.used || {})) { const t = st.play.tiles[id]; if (t && t.t === 'stat') statStops++; }
    }
    out[`${sp}${rk}`] = { goal: +(goal / n * 100).toFixed(2), gain: +(gain / n).toFixed(1), rewards: +(rew / n).toFixed(3), statStops: +(statStops / n).toFixed(2) };
  }
}
const rel = {};
for (const sp of [0, 1]) for (const rk of ['B', 'C']) { const a = out[`${sp}A`], b = out[`${sp}${rk}`]; rel[`${sp}${rk}`] = { goalPP: +(b.goal - a.goal).toFixed(2), gainPct: +((b.gain / a.gain - 1) * 100).toFixed(2), rewardPP: +((b.rewards - a.rewards) / REW.length * 100).toFixed(2) }; }
console.log(JSON.stringify({ N, OVER, out, rel }));
