// =========================================================
// Chapter 1 Pattern A 道路先行の試作 — P ハブの背景ゾーン `MMRF_ZONES`（2026-10-10・試作。正式ではない）
//
//  URL に ?chapterBoard=roadfirst&rfZones=phub を付けたときだけ js/proto/roadfirst-view.js が使う（それ以外は何もしない）。
//  背景の表：prototype/p_hub_1010/scene_registry.json（P ハブの独立プレビューと同じ表・同じ測り直した座標。作り直さない）。
//  ここは純粋な関数だけ：今の地点（と歩いた跡）→ Scene・区域・背景・画像の中の座標、区域 → カメラ。
//  移動・サイコロ・保存は MMRF_CORE／MMRF_PLAY／roadfirst-view.js のまま（ここでは決めない）。
//  P は3つの Scene（09・20・22）に入っている＝歩いた跡の1つ前の地点が入っている Scene（左から＝Scene09・右から＝Scene20）、
//  1つ前が無ければ Scene22。どれも同じ P 中核の候補画像の区域なので、P をまたいでも背景は変わらない（カメラだけ）。
// =========================================================
(function (root) {
  'use strict';
  const ZOOM = 1.15;   // 区域のカメラの範囲より少しだけ寄る（P ハブの独立プレビューと同じ）
  // RoadFirst の画面では使わない区域：approach（EL04_09・10／ER04_09〜11＝構図参考図の下端の地点）。下の操作の上に地点を出すと
  // 絵の外（余白）が見えてしまう＝RoadFirst の図面（既存の仮の背景）のまま。独立プレビューでは使う
  const ROADFIRST_SKIP = ['approach'];

  function layoutOf(reg, id) { return reg && reg.layouts && reg.layouts[id || reg.default_layout] || null; }

  /** 今の地点の区域。trail＝歩いた跡（最後が今の地点）。区域の無い地点は null（通常の図面のまま） */
  function resolve(reg, node, trail, layoutId, skip) {
    const L = layoutOf(reg, layoutId); if (!L) return null;
    const hits = [], sk = skip || [];
    for (const [sid, s] of Object.entries(L.scenes)) for (const z of s.zones) if (z.nodes.includes(node) && !sk.includes(z.id)) hits.push({ scene: sid, zone: z });
    if (!hits.length) return null;
    let h = hits[0];
    if (hits.length > 1) {
      const t = Array.isArray(trail) ? trail : [];
      const i = t.lastIndexOf(node), prev = i > 0 ? t[i - 1] : null;
      const sceneNodes = (sid) => (reg.scenes[sid] || {}).nodes || [];
      // 1つ前の地点が同じ Scene の「1つ前」にある Scene（P なら EL04_12 → Scene09・ER04_13 → Scene20）
      h = hits.find((x) => { const n = sceneNodes(x.scene), k = n.indexOf(node); return prev && k > 0 && n[k - 1] === prev; })
        || hits.find((x) => sceneNodes(x.scene)[0] === node) || hits[0];
    }
    const a = reg.assets[h.zone.asset];
    if (!a || !a.file || !h.zone.xy || !Array.isArray(h.zone.xy[node])) return null;   // 背景・座標がそろっていない区域は使わない（推測で埋めない）
    return { scene: h.scene, zone: h.zone, id: h.zone.id, asset: h.zone.asset, xy: h.zone.xy, at: h.zone.xy[node] };
  }

  /** カメラ：区域の範囲に ZOOM で寄り、今の地点（と次の行き先＝focus）を空いている所（上の帯と下の操作の間・右の道具の左）の 55% の高さへ。
   *  view＝{ W, H, top, bottom, right }（画面の画素。top＝上の帯の下端・bottom＝下の操作の上端・right＝右の道具の左端）。
   *  絵が画面を必ず覆う倍率にし、絵の外（余白）は見せない。絵の端の地点が空いている所に入らないときだけ少しずつ寄る（最大 3倍） */
  const MARGIN = { side: 26, top: 46, bottom: 22 };   // 印（半径12＋光の輪）とモンスター（上へ約40）の分
  function camera(reg, r, view, focus) {
    const a = reg.assets[r.asset], [x0, y0, x1, y1] = r.zone.camera, rw = x1 - x0, rh = y1 - y0;
    const W = view.W, H = view.H, top = view.top || 0, bot = view.bottom || H, right = view.right || W;
    const fw = Math.max(1, right), fh = Math.max(1, bot - top);
    const pts = [r.at].concat((focus || []).filter((q) => Array.isArray(q)));
    const cx = pts.reduce((v, q) => v + q[0], 0) / pts.length, cy = pts.reduce((v, q) => v + q[1], 0) / pts.length;
    const s0 = Math.max(Math.min(fw / rw, fh / rh) * ZOOM, W / a.w, H / a.h);
    const L = MARGIN.side, R = fw - MARGIN.side, T = top + MARGIN.top, B = bot - MARGIN.bottom;
    let best = null;
    for (let s = s0; s <= s0 * 3 + 1e-9; s *= 1.06) {
      let tx = fw / 2 - cx * s, ty = top + fh * 0.55 - cy * s;
      // 区域の範囲の外へは寄らない（範囲が空いている所より小さければ中央）
      tx = rw * s <= fw ? fw / 2 - (x0 + rw / 2) * s : Math.min(-x0 * s, Math.max(fw - x1 * s, tx));
      ty = rh * s <= fh ? top + fh / 2 - (y0 + rh / 2) * s : Math.min(top - y0 * s, Math.max(bot - y1 * s, ty));
      // 印は必ず空いている所の中（区域の端の地点でも）
      const xs = pts.map((q) => q[0] * s), ys = pts.map((q) => q[1] * s);
      tx = Math.min(R - Math.max(...xs), Math.max(L - Math.min(...xs), tx));
      ty = Math.min(B - Math.max(...ys), Math.max(T - Math.min(...ys), ty));
      // 絵の外は見せない（画面全体を覆う）
      tx = Math.min(0, Math.max(W - a.w * s, tx));
      ty = Math.min(0, Math.max(H - a.h * s, ty));
      best = { s, tx, ty };
      if (pts.every((q) => { const x = q[0] * s + tx, y = q[1] * s + ty; return x >= L - 0.5 && x <= R + 0.5 && y >= T - 0.5 && y <= B + 0.5; })) break;
    }
    return best;
  }

  /** 区域の背景の一覧（<img> は背景1枚につき1つ） */
  function assets(reg, layoutId, skip) {
    const L = layoutOf(reg, layoutId); if (!L) return [];
    const sk = skip || [];
    return [...new Set(Object.values(L.scenes).flatMap((s) => s.zones.filter((z) => !sk.includes(z.id)).map((z) => z.asset)))].filter((id) => reg.assets[id] && reg.assets[id].file);
  }
  /** 区域のある地点の一覧と、背景が構図参考図（専用の背景が無い）の地点 */
  function coverage(reg, layoutId, skip) {
    const L = layoutOf(reg, layoutId), all = new Set(), stand = new Set(), sk = skip || [];
    if (!L) return { nodes: [], standIn: [] };
    for (const s of Object.values(L.scenes)) for (const z of s.zones) if (!sk.includes(z.id)) for (const n of z.nodes) { all.add(n); if (reg.assets[z.asset] && reg.assets[z.asset].kind === 'provisional') stand.add(n); }
    return { nodes: [...all], standIn: [...stand] };
  }

  const api = { ZOOM, MARGIN, ROADFIRST_SKIP, resolve, camera, assets, coverage, layoutOf };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.MMRF_ZONES = api;
})(typeof window !== 'undefined' ? window : globalThis);
