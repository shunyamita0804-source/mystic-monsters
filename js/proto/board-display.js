// =========================================================
// 2026-10-20 通し試遊の追加指示（全 Chapter の円の広場を同じ美術規則に）：盤の「表示の配置」`MMRF_DISP`
//  円の広場（分かれ目・合流・START・行き止まり）の中心から、隣の地点を clear 単位以上離して道の上へ並べ直した「表示用の道のデータ」を作る。
//  Chapter 2／4 は道の生成（tools/common/board_layout.py）で同じ規則にしてある。Chapter 1（A＝原本 MMRF_DATA）・Chapter 3 は原本の座標を変えずに、
//  ここで表示用の写しを作る（world-driver.js・world-driver-ch3.js の dataOf が返す）。
//  変えるのは地点の座標だけ（ID・種類・区間・接続・歩数は原本のまま＝進行・出来事・サイコロの歩数・分岐・保存は同じ）。
//  並べ直すのは「広場につながる区間」の中の地点だけ・その区間の元の地点を結んだ折れ線の上に等間隔（道の形は変わらない）。
//  別の区間の地点に近づきすぎる区間（minD 未満）は元の座標のまま。原本（MMRF_DATA など）は書き換えない。
// =========================================================
(function (root) {
  'use strict';
  const CACHE = new WeakMap();
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  /** 盤の描画（js/proto/roadfirst-world.js の drawRoads）と同じ「円の広場」の地点 */
  function plazaIds(D) {
    const out = {}, inn = {}; for (const e of D.edges) if (e[3] === 'forward') { out[e[0]] = (out[e[0]] || 0) + 1; inn[e[1]] = (inn[e[1]] || 0) + 1; }
    return new Set(Object.keys(D.nodes).filter((id) => (out[id] || 0) > 1 || (inn[id] || 0) > 1 || D.nodes[id][2] === 'start' || /dead_end/.test(D.nodes[id][2])));
  }
  /** 端から k 個の地点を「広場から c の位置 → k+1 番目の元の地点」の間に等間隔で並べ直す（それより先の地点は元のまま）。並べられなければ null */
  function remapEnd(t, c, gap, limit) {
    const n = t.length - 1; if (!(c > 0) || t[1] >= c) return { t, k: 0 };
    for (let k = 1; k <= limit; k++) {
      const anchor = t[k + 1]; if (k + 1 > n) return null;
      const sp = (anchor - c) / k; if (sp < gap) continue;
      const s = t.slice(); for (let i = 1; i <= k; i++) s[i] = c + (i - 1) * sp;
      return { t: s, k };
    }
    return null;
  }
  /**
   * 折れ線 p（元の地点を結んだ線）の上の地点の位置を、両端の広場の中心から c0／c1 以上離す（両端の地点は元のまま）。
   *  広場の近くの数個だけを動かし、残りは元の位置のまま（歩数・道の形は同じ）。道の中の間隔は gap 以上。離せない区間（短い区間）は null＝元のまま
   */
  function resampleClear(p, n, c0, c1, gap) {
    const cum = [0]; for (let i = 0; i < p.length - 1; i++) cum.push(cum[i] + dist(p[i], p[i + 1]));
    const L = cum[cum.length - 1];
    if (n < 3 || !(c0 || c1)) return null;
    const at = (t) => { let seg = 0; while (seg < p.length - 2 && cum[seg + 1] < t) seg++; const u = (t - cum[seg]) / Math.max(1e-9, cum[seg + 1] - cum[seg]); return [p[seg][0] + (p[seg + 1][0] - p[seg][0]) * u, p[seg][1] + (p[seg + 1][1] - p[seg][1]) * u]; };
    for (let r = 0; r < 12; r++, c0 *= 0.95, c1 *= 0.95) {
      const a = remapEnd(cum, c0, gap, n - 2); if (!a) continue;
      const rev = a.t.map((x) => L - x).reverse(), b = remapEnd(rev, c1, gap, n - 2 - a.k); if (!b) continue;
      if (a.k + b.k > n - 1) continue;
      const s = b.t.map((x) => L - x).reverse(), q = s.map((t, i) => (i === 0 || i === n ? p[i] : at(t)));
      // 隣どうしの直線の距離も gap 以上（元が狭い所は元の距離まで）＝曲がり角で地点が寄らない
      let ok = true; for (let i = 0; i < n; i++) if (dist(q[i], q[i + 1]) < Math.min(gap, dist(p[i], p[i + 1])) - 0.5) { ok = false; break; }
      if (ok) return q;
    }
    return null;   // 短い区間（1〜2地点）・離せない区間は元のまま
  }
  /**
   * 表示用の道のデータ（同じ D には同じ写しを返す）。opt：clear（広場の中心から隣の地点まで）・gap（道の中の最小の間隔）・minD（別の区間の地点との最小の距離）
   *  返す写しは D と同じ形（nodes だけ新しい座標・ほかの項目は D と同じものを共有）。display＝{ moved, kept, plazas }
   */
  function clearPlazas(D, opt) {
    if (!D || !D.nodes || !D.segments || !Array.isArray(D.edges)) return D;
    const o = Object.assign({ clear: 30, gap: 15, minD: 12 }, opt || {});
    const key = `${o.clear}|${o.gap}|${o.minD}`;
    let C = CACHE.get(D); if (C && C[key]) return C[key];
    const P = plazaIds(D), pos = {};
    // 道筋＝広場から広場まで（途中の門・目印などの名前のある地点で区間がつながっているときは1本にまとめる。名前のある地点も道の上を動く）
    const ends = {}; for (const [sid, s] of Object.entries(D.segments)) for (const id of [s[3][0], s[3][s[3].length - 1]]) (ends[id] = ends[id] || []).push(sid);
    const chains = [], used = new Set();
    for (const [sid, s] of Object.entries(D.segments)) {
      if (used.has(sid)) continue;
      let ids = s[3].slice(); used.add(sid);
      for (const dir of [1, -1]) {
        for (let g = 0; g < 20; g++) {
          const tip = dir > 0 ? ids[ids.length - 1] : ids[0];
          if (P.has(tip) || (ends[tip] || []).length !== 2) break;
          const nx = ends[tip].find((x) => !used.has(x)); if (!nx) break;
          const t = D.segments[nx][3]; used.add(nx);
          if (dir > 0) ids = ids.concat((t[0] === tip ? t : t.slice().reverse()).slice(1));
          else ids = (t[t.length - 1] === tip ? t : t.slice().reverse()).slice(0, -1).concat(ids);
        }
      }
      chains.push(ids);
    }
    const plan = [];
    for (const ids of chains) {
      if (ids.length < 4) continue;
      const a = ids[0], b = ids[ids.length - 1], e0 = P.has(a), e1 = P.has(b); if (!e0 && !e1) continue;
      const pts = ids.map((id) => D.nodes[id]);
      const near = ids.slice(1, -1).some((id) => (e0 && dist(D.nodes[id], D.nodes[a]) < o.clear) || (e1 && dist(D.nodes[id], D.nodes[b]) < o.clear));
      if (!near) continue;
      let g0 = Infinity; for (let i = 0; i < pts.length - 1; i++) g0 = Math.min(g0, dist(pts[i], pts[i + 1]));
      const gap = Math.min(o.gap, g0);   // 元の間隔が狭い道（枝の D_LLA など）は元のいちばん狭い間隔まで（元より詰めない）
      const q = resampleClear(pts, ids.length - 1, e0 ? o.clear : 0, e1 ? o.clear : 0, gap); if (q) plan.push([ids, q]);
    }
    // 別の道の地点に近づきすぎる道は元の座標に戻す（くり返し）
    const chainOf = {}; chains.forEach((ids, ci) => ids.slice(1, -1).forEach((id) => { chainOf[id] = ci; }));
    const kept = new Set();
    for (let r = 0; r < 8; r++) {
      for (const k of Object.keys(pos)) delete pos[k];
      plan.forEach(([ids, q], pi) => { if (!kept.has(pi)) ids.forEach((id, i) => { if (i > 0 && i < q.length - 1 && dist(q[i], D.nodes[id]) > 0.05) pos[id] = q[i]; }); });
      const at = (id) => pos[id] || D.nodes[id], planOf = {}; plan.forEach(([ids], pi) => ids.slice(1, -1).forEach((id) => { planOf[id] = pi; }));
      const items = Object.keys(D.nodes), bad = new Set();
      for (const id of Object.keys(pos)) for (const jd of items) {
        if (jd === id || (chainOf[jd] != null && chainOf[jd] === chainOf[id]) || P.has(jd) && chains[chainOf[id]] && (chains[chainOf[id]][0] === jd || chains[chainOf[id]][chains[chainOf[id]].length - 1] === jd)) continue;
        const p = at(id), q = at(jd); if (Math.abs(p[0] - q[0]) < o.minD && Math.abs(p[1] - q[1]) < o.minD && dist(p, q) < o.minD) { bad.add(planOf[id]); if (pos[jd]) bad.add(planOf[jd]); }
      }
      const fresh = [...bad].filter((x) => x != null && !kept.has(x)); if (!fresh.length) break;
      fresh.forEach((x) => kept.add(x));
    }
    const nodes = {};
    for (const [id, n] of Object.entries(D.nodes)) nodes[id] = pos[id] ? [Math.round(pos[id][0] * 10) / 10, Math.round(pos[id][1] * 10) / 10, ...n.slice(2)] : n;
    const out = Object.assign({}, D, { nodes, display: { moved: Object.keys(pos).length, kept: [...kept].map((pi) => plan[pi][0][0] + '→' + plan[pi][0][plan[pi][0].length - 1]), plazas: P.size, clear: o.clear, source: D } });
    if (!C) { C = {}; CACHE.set(D, C); } C[key] = out;
    return out;
  }
  /** 表示用の写しなら元の道のデータ（原本）を返す */
  const sourceOf = (D) => (D && D.display && D.display.source) || D;
  const api = { clearPlazas, plazaIds, sourceOf, resampleClear };
  root.MMRF_DISP = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
