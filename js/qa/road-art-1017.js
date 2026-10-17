// =========================================================
// 2026-10-17 道路画質（P0）の QA `MMQRA`（作業ブランチ claude/qa-road-1017 だけ・試作＝美術の採否はユーザー）
//
//  URL に ?qaRoadArt=raw|fix を付けたときだけ。通常の URL では何もしない（地点・道・マス・判定・セーブは変えない＝絵だけ）。
//  画像AI担当の改修素材12枚（ZIP Mismon_Ch1Ch2_20261017_Part1_Final）の表示用の派生（assets/qa/road_1017/・tools/road1017/derive.py）。
//    raw＝原本そのまま（縮小だけ）／fix＝継ぎ目だけを直した派生（切れ目の左右 2px だけ混ぜる・全面のぼかしなし）
//  Chapter 1：草地 A1〜A3・道の帯と敷石の円 R1／R2（A／B＝R1・C＝R2＝従来の skin 'hq1014' と同じ割り当て）
//  Chapter 2：外海・海上橋の石板（?qaRoad=1）・白い橋帯 R01（?qaRoad=2）・白い石畳・左右の欄干
//  絵の細かさ（px／世界の1単位）は画像ごとに _ppu で渡す（pattern がこれで倍率を決める＝周期を直して縦横が変わっても石・草の大きさは raw と同じ）。
//  読めない絵は従来の絵へ戻す（404 など）。
//  近くの高い解像度の層（js/qa/road-1016.js の hiLayer）も同時に使う（この素材は 12〜18px／単位＝従来の 1単位 5px では細かさを捨てる）。
//  ?qaRoadMacro=0＝大きな明暗の揺らぎ（くり返しの周期を目立たなくする層）を出さない
// =========================================================
(function (root) {
  'use strict';
  let P = null; try { P = new URLSearchParams(root.location.search); } catch (e) {}
  const q = P ? P.get('qaRoadArt') : null;
  const MODE = q === 'raw' || q === 'fix' ? q : null;
  const MACRO = MODE && !(P && P.get('qaRoadMacro') === '0');
  const BASE = './assets/qa/road_1017/';
  // 名前 → px／単位（tools/road1017/derive.py の derive.json と同じ値）。strip・walk・rail は帯の高さ＝幅で決まる（null）
  const PPU = { ch1_ground_a1: 12, ch1_ground_a2: 12, ch1_ground_a3: 12, ch1_road_r1: 17.809, ch1_road_r2: 17.809,
    ch2_open_sea_water: 13.964, ch2_sea_bridge_deck: 17.778, ch2_coastal_white_stone_road: 18.286 };
  const VARIANT = { ch1_strip_r1: 1, ch1_strip_r2: 1, ch2_R01_white_bridge_walkstrip: 1 };   // raw／fix の2つがある帯
  const file = (name) => BASE + name + (PPU[name] || VARIANT[name] ? '_' + MODE : '') + '.webp';
  /** Chapter 1：skin の鍵（ground・road・strip）→ 新しい絵の名前（景色 A／B／C） */
  const CH1 = { A: { ground: 'ch1_ground_a1', road: 'ch1_road_r1', strip: 'ch1_strip_r1' }, B: { ground: 'ch1_ground_a2', road: 'ch1_road_r1', strip: 'ch1_strip_r1' },
    C: { ground: 'ch1_ground_a3', road: 'ch1_road_r2', strip: 'ch1_strip_r2' } };
  /** Chapter 2：js/proto/ch2-world.js の TEX・STRIPS の鍵 → 新しい絵の名前 */
  const CH2 = { tex: { sea: 'ch2_open_sea_water', deck: 'ch2_sea_bridge_deck', white: 'ch2_coastal_white_stone_road' },
    strip: { walk: 'ch2_R01_white_bridge_walkstrip', railL: 'ch2_sea_bridge_railing_left', railR: 'ch2_sea_bridge_railing_right' } };
  const loaded = [];   // 読めた絵（確認用：名前・大きさ）
  /** 新しい絵を読む（_ppu・_qra を付ける）。読めなければ null（呼ぶ側が従来の絵へ） */
  function load(name) {
    return new Promise((res) => {
      if (!MODE || !name || !root.Image) { res(null); return; }
      const im = new root.Image(); im.decoding = 'async';
      im.onload = () => { im._qra = name; if (PPU[name]) im._ppu = PPU[name]; loaded.push([name, im.naturalWidth, im.naturalHeight]); res(im); };
      im.onerror = () => res(null); im.src = file(name);
    });
  }
  // ---- くり返しの周期を目立たなくする大きな明暗の揺らぎ（世界の座標で決まる＝区画・遠近の層の境目で同じ）----
  //  数百単位の大きさの、ごく弱い（±5% 前後）明るさの揺らぎを地面に重ねる。石・草の細かい描き込みは変えない（ぼかさない）
  let MAC = null;
  function macroTex() {
    if (MAC || !root.document) return MAC;
    const N = 64, c = root.document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), d = g.createImageData(N, N);
    let s = 1017; const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const G = 8, v = []; for (let i = 0; i < G * G; i++) v.push(r());   // 8×8 の値をなめらかに補間（周期 N）
    const at = (x, y) => v[((y % G) + G) % G * G + ((x % G) + G) % G];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const fx = x / N * G, fy = y / N * G, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const a = at(ix, iy) * (1 - sx) + at(ix + 1, iy) * sx, b = at(ix, iy + 1) * (1 - sx) + at(ix + 1, iy + 1) * sx, t = a * (1 - sy) + b * sy;
      const k = (y * N + x) * 4, lum = t > 0.5 ? 255 : 0; d.data[k] = d.data[k + 1] = d.data[k + 2] = lum; d.data[k + 3] = Math.round(Math.abs(t - 0.5) * 2 * 30);
    }
    g.putImageData(d, 0, 0); MAC = c; return c;
  }
  /** 地面の上に揺らぎを重ねる（bx＝描く範囲・世界の単位）。1 枚＝ 900 単位四方のくり返し */
  function macro(g, x0, y0, w, h) {
    if (!MACRO) return; const t = macroTex(); if (!t) return;
    const p = g.createPattern(t, 'repeat'); if (!p) return;
    if (p.setTransform && root.DOMMatrix) p.setTransform(new root.DOMMatrix().translate(-131, -77).scale(900 / t.width));
    g.save(); g.globalAlpha = 0.55; g.fillStyle = p; g.fillRect(x0, y0, w, h); g.restore();
  }
  root.MMQRA = Object.freeze({ mode: MODE, macroOn: !!MACRO, BASE, PPU, CH1, CH2, file, load, macro, loaded: () => loaded.slice() });
})(typeof window !== 'undefined' ? window : globalThis);
