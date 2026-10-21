// =========================================================
// 2026-10-21 第6便（実ブラウザ・QA_E2E=1 のときだけ）
//  R7-E1（Chapter 1〜4 × A／B／C）：盤の配置（MMWB.world().layout()）
//   ・START の円は道の幅が隠れる大きさ以上（道の幅の半分＋0.5）
//   ・道をまたぐ門（正面向きの門）は、真下を通る道が 1 本だけ・広場の上でない・左右の柱（±0.36w）がほかの道・マスにかからない
//   ・マスどうしが重ならない（小さくしたマスは小さくした大きさで）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
let L = null;
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });

const AUDIT = () => {
  const v = MMWB.world().layout(), rw = v.roadW, tw = v.tileW, T = Object.fromEntries(v.tiles.map((t) => [t.id, t]));
  const dseg = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1e-9, t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)); return [Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dy * t), dx, dy]; };
  const near = (p, P) => { let m = [1e9, 0, 1]; for (let i = 0; i < P.length - 1; i++) { const d = dseg(p, P[i], P[i + 1]); if (d[0] < m[0]) m = d; } return m; };
  const st = v.tiles.find((t) => t.role === 'start'), hs = v.hubs.find((h) => h.id === st.id), startR = v.plan.r[st.id] != null ? v.plan.r[st.id] : hs ? hs.r : 0;
  const bad = [];
  for (const g of v.props.filter((p) => /rfw-front/.test(p.cls))) {
    const ns = v.lines.map((l, i) => ({ i, d: near([g.x, g.y], l.P) })).sort((a, b) => a.d[0] - b.d[0]), own = ns.filter((x) => x.d[0] < rw / 2);
    if (own.length !== 1) { bad.push(`${g.file}@${g.node} 真下の道 ${own.length} 本`); continue; }
    if (v.hubs.some((h) => h.r > 0 && Math.hypot(T[h.id].x - g.x, T[h.id].y - g.y) < h.r + rw * 0.35)) bad.push(`${g.file}@${g.node} 広場の上`);
    const m = own[0].d, k = Math.hypot(m[1], m[2]) || 1, lx = -m[2] / k * g.w * 0.36, ly = m[1] / k * g.w * 0.36, oth = v.lines.filter((l, i) => i !== own[0].i);
    for (const q of [[g.x + lx, g.y + ly], [g.x - lx, g.y - ly]]) {
      const dr = Math.min(...oth.map((l) => near(q, l.P)[0])) - rw / 2 - g.w * 0.08, dt = Math.min(...v.tiles.map((t) => Math.hypot(t.x - q[0], t.y - q[1]))) - tw / 2 - g.w * 0.08;
      if (dr < -0.5 || dt < -0.5) bad.push(`${g.file}@${g.node} 柱 道 ${dr.toFixed(1)}・マス ${dt.toFixed(1)}`); }
  }
  let overlap = 0; for (let i = 0; i < v.tiles.length; i++) for (let j = i + 1; j < v.tiles.length; j++) { const a = v.tiles[i], b = v.tiles[j]; if (Math.hypot(a.x - b.x, a.y - b.y) - tw * ((a.k || 1) + (b.k || 1)) / 2 < 0) overlap++; }
  return { startR, rw, gates: v.props.filter((p) => /rfw-front/.test(p.cls)).length, bad, overlap };
};
for (const ch of [1, 2, 3, 4]) {
  test(`R7-E1（Chapter ${ch} A／B／C）：START の円・門は 1 本の道の上・マスが重ならない`, { skip: SKIP, timeout: 400000 }, async () => {
    for (const route of ['A', 'B', 'C']) {
      const p = await L.open({ worldCh1: true, worldCh2: true, worldCh3: true, worldCh4: true, route, route2: route, route3: route, route4: route, query: `?ch${ch}trial=${route}&qaSeed=1`, size: [390, 844] });
      try {
        await p.page.waitForFunction((ch) => window.MMWB && MMWB.world() && MMWB.world().isReady() && S.m && S.m.raise && S.m.raise.ch === ch, ch, { timeout: 120000 });
        const r = await p.page.evaluate(AUDIT);
        assert.ok(r.startR >= r.rw / 2 + 0.5 - 0.01, `${ch}${route}：START の円 ${r.startR}`);
        assert.ok(r.gates >= 1, `${ch}${route}：門がある`);
        assert.deepEqual(r.bad, [], `${ch}${route}：門`);
        assert.equal(r.overlap, 0, `${ch}${route}：重なるマス`);
        assert.deepEqual(p.errors, [], `${ch}${route}：エラーなし`);
      } finally { await p.ctx.close(); }
    }
  });
}
