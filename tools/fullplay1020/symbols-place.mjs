// =========================================================
// 2026-10-20 第3便：Chapter ごとのシンボル建物（正式の FRONT の絵）の置き場所を計算する（テストではない道具）
//  node tools/fullplay1020/symbols-place.mjs  → js/chapter/world-board.js の SYMBOLS（at・foot）に写す値を出す
//  規則：道（区間の折れ線）から足もとの半径（絵の幅の半分＋道の半幅ほど＝斜めのカメラで絵の裾が奥の道とマスに掛からない）以上・マスから足もとの半径＋8 以上・ほかの目印から離す。A／B／C で同じ所に置ければ同じ所（3ルートとも空いている所のうち、
//   好みの位置にいちばん近い所）。置けなければルートごとにいちばん近い空いている所。Chapter 2 は盆地（海底の広い所）の中だけ・2つの建物どうしも離す
// =========================================================
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const w = {};
for (const f of ['js/proto/roadfirst-data.js', 'js/proto/roadfirst-routes.js', 'js/proto/ch3-routes.js', 'js/proto/ch2-routes.js', 'js/proto/ch4-routes.js', 'js/proto/board-display.js', 'js/proto/roadfirst-world.js', 'js/proto/ch2-world.js', 'js/proto/ch4-world.js'])
  new Function('window', 'module', readFileSync(path.join(ROOT, f), 'utf8'))(w, undefined);
const X = w.MMRF_DISP, W = w.MMRF_WORLD;
const C4 = { clear: 24, gap: 14, minD: 11, uniform: true };
const data = { 1: { A: X.clearPlazas(w.MMRF_DATA), B: X.clearPlazas(w.MMRF_ROUTES.B), C: X.clearPlazas(w.MMRF_ROUTES.C) }, 2: w.MMRF_CH2,
  3: { A: X.clearPlazas(w.MMRF_CH3.A), B: X.clearPlazas(w.MMRF_CH3.B), C: X.clearPlazas(w.MMRF_CH3.C) }, 4: Object.fromEntries(['A', 'B', 'C'].map((r) => [r, X.clearPlazas(w.MMRF_CH4[r], C4)])) };
const SYM = {   // w＝絵の幅（単位）・foot＝足もとの半径（単位）・pref＝好みの位置・inBasin＝Chapter 2 の盆地の中だけ
  1: [{ key: 'tree', w: 150, foot: 84, pref: [342, 558] }],
  2: [{ key: 'tower', w: 64, foot: 42, pref: [636, 558], inBasin: true }, { key: 'temple', w: 132, foot: 76, pref: [462, 732], inBasin: true }],
  3: [{ key: 'temple', w: 160, foot: 90, pref: [378, 618] }],
};
const dSeg = (x, y, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L2)); return Math.hypot(a[0] + dx * t - x, a[1] + dy * t - y); };
const inPoly = (P, x, y) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
function free(D, s, x, y, taken) {
  if (x < s.w / 2 || x > 1024 - s.w / 2 || y < s.foot + 20 || y > 1536 - s.foot - 10) return false;
  if (s.inBasin) { const B = D.art.basin; if (!inPoly(B, x, y)) return false; for (let i = 0; i < B.length; i++) if (dSeg(x, y, B[i], B[(i + 1) % B.length]) < s.foot * 0.8) return false; }
  for (const sg of Object.values(D.segments)) { const l = sg[3].map((id) => D.nodes[id]); for (let i = 0; i < l.length - 1; i++) if (dSeg(x, y, l[i], l[i + 1]) < s.foot) return false; }
  for (const n of Object.values(D.nodes)) if (Math.hypot(n[0] - x, n[1] - y) < s.foot + 8) return false;
  const lms = D.art && D.art.sea3d ? w.MMRF_SEA.lm(D) : (D.art && D.art.landmarks) || W.ART.landmarks;
  for (const L of lms || []) { if (!D.nodes[L.node]) continue; const a = W.landmarkAt(D, L); if (a && Math.hypot(a[0] - x, a[1] - y) < s.foot + L.w * 0.35) return false; }
  if (D.art && D.art.towers) for (const t of D.art.towers) if (Math.hypot(t.c[0] - x, t.c[1] - y) < s.foot + t.r + 6) return false;
  for (const t of taken) if (Math.hypot(t[0] - x, t[1] - y) < s.foot + t[2] + 10) return false;
  return true;
}
const out = {};
for (const ch of [1, 2, 3]) {
  out[ch] = {}; const takenBy = { A: [], B: [], C: [] };
  for (const s of SYM[ch]) {
    const cands = []; for (let y = 0; y <= 1536; y += 6) for (let x = 0; x <= 1024; x += 6) cands.push([x, y, Math.hypot(x - s.pref[0], y - s.pref[1])]);
    cands.sort((a, b) => a[2] - b[2]);
    const common = cands.find(([x, y]) => ['A', 'B', 'C'].every((r) => free(data[ch][r], s, x, y, takenBy[r])));
    for (const r of ['A', 'B', 'C']) {
      const p = common || cands.find(([x, y]) => free(data[ch][r], s, x, y, takenBy[r]));
      (out[ch][r] = out[ch][r] || {})[s.key] = p ? [p[0], p[1]] : null; if (p) takenBy[r].push([p[0], p[1], s.foot]);
    }
    console.error(ch, s.key, common ? `共通 ${common.slice(0, 2)}` : 'ルートごと', JSON.stringify(['A', 'B', 'C'].map((r) => out[ch][r][s.key])));
  }
}
console.log(JSON.stringify(out));
