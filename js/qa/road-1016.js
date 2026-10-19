// =========================================================
// 2026-10-16 夜間 QA（A 道路の見た目）`MMQAR`（作業ブランチ claude/qa-bca-1016 だけ・試作＝美術の採否はユーザー）
//
//  URL に ?qaRoad=1|2 を付けたときだけ。通常の URL では何もしない（地点・道・マス・判定・セーブは変えない＝絵の描き方だけ）。
//  共通（1・2 とも）：カメラの近くだけ、地面と道を高い解像度で描き直す層（hiLayer）。
//    従来の地面と道は 1単位 2px の canvas を、カメラの倍率（2.2〜5.6）× 画面の画素比（3）で最大 約8倍に引き伸ばしていた＝道の石がぼける。
//    近くの層は 1単位 RES px（既定 5）の区画（128単位四方）を、画面に入る所だけ作る（数フレームに分けて描く・最大 MAX 枚＝メモリの上限）。
//    中身は従来と同じ描画の関数（地面・地形・道）＝区画の境目・遠くとの境目で絵が変わらない（細かさだけ変わる）。
//  1「高精細・なめらかな帯」：同じ正式の絵のまま、道の帯を曲線に沿った細い台形の網（meshStrip）で描く（従来は直線の切れ端を回して並べていた＝曲がり角で「く」の字）。
//    Chapter 2 の海上橋の石板（sea_bridge_deck）は、継ぎ目の合わない1枚を上下左右に鏡映しで並べる（mirrorTile＝継ぎ目は消えるが模様が「く」の字の山形になる）。
//  2「地面になじませる」：1 に加えて、道のふちに地面へ落ちる薄い影・ふちにかかる草・マスの足もとの接地の影（naturalize）。
//    Chapter 2 の海上の道は、海上橋の石板の代わりに正式の白い橋帯 R01（道に沿う模様）を道に沿わせて敷く（欄干・縁石は従来のまま）。
//  ?qaRoadRes＝近くの層の細かさ（px／単位・2〜14・既定 5／新しい素材 10）・?qaRoadMB＝近くの層のメモリの上限（MB・既定 40）。
// =========================================================
(function (root) {
  'use strict';
  let P = null; try { P = new URLSearchParams(root.location.search); } catch (e) {}
  const q = null;   // 2026-10-19 第2工程：URL の ?qaRoad=1|2（道の描き方の比較）は撤去＝本編と QA は同じ描き方（Chapter 2 は world-board.js が 2）
  // 2026-10-17：?qaRoadArt=raw|fix（js/qa/road-art-1017.js・新しい素材）のときは、?qaRoad が無くても 1（なめらかな帯・近くの層）で描く
  const ART17 = root.MMQRA && root.MMQRA.mode;
  const MODE = q === '1' || q === '2' ? q : ART17 ? '1' : null;
  const num = (k, d, lo, hi) => { const x = P && P.get(k) != null ? Number(P.get(k)) : NaN; return Number.isFinite(x) && x >= lo && x <= hi ? x : d; };
  //  近くの層の細かさ：従来 5px／単位（従来の素材は 4〜7px／単位）。新しい素材（12〜18px／単位）は既定 10px／単位。
  //  区画は細かいほど小さく（64単位）・枚数はメモリの上限（?qaRoadMB・既定 40MB）で決める（遠い区画は遠近で小さく見える＝遠くの層のままでよい）
  const RES = num('qaRoadRes', ART17 ? 10 : 5, 2, 14), TILE = num('qaRoadTile', RES > 6 ? 64 : 128, 16, 256);
  const LAYER = !(P && P.get('qaRoadLayer') === '0');
  const MB = num('qaRoadMB', root.MMQRA && !root.MMQRA.urlMode && !(q === '1' || q === '2') ? 32 : 40, 8, 120)   /* 2026-10-18：本編の既定（URL なし）は 32MB＝iPhone のメモリに余裕を残す */, MAX = RES > 6 ? Math.max(6, Math.floor(MB * 1048576 / (Math.pow(Math.ceil(TILE * RES) + 2, 2) * 4))) : 14, BUDGET = 6;

  // ---- 三角形ごとのアフィン変換で、帯の絵の切れ端を台形の網へ貼る ----
  function tri(g, im, s0, s1, s2, d0, d1, d2) {
    const den = s0[0] * (s2[1] - s1[1]) - s1[0] * s2[1] + s2[0] * s1[1] + (s1[0] - s2[0]) * s0[1]; if (!den) return;
    const a = -(s0[1] * (d2[0] - d1[0]) - s1[1] * d2[0] + s2[1] * d1[0] + (s1[1] - s2[1]) * d0[0]) / den;
    const b = (s1[1] * d2[1] + s0[1] * (d1[1] - d2[1]) - s2[1] * d1[1] + (s2[1] - s1[1]) * d0[1]) / den;
    const c = (s0[0] * (d2[0] - d1[0]) - s1[0] * d2[0] + s2[0] * d1[0] + (s1[0] - s2[0]) * d0[0]) / den;
    const d = -(s1[0] * d2[1] + s0[0] * (d1[1] - d2[1]) - s2[0] * d1[1] + (s2[0] - s1[0]) * d0[1]) / den;
    const e = (s0[0] * (s2[1] * d1[0] - s1[1] * d2[0]) + s0[1] * (s1[0] * d2[0] - s2[0] * d1[0]) + (s2[0] * s1[1] - s1[0] * s2[1]) * d0[0]) / den;
    const f = (s0[0] * (s2[1] * d1[1] - s1[1] * d2[1]) + s0[1] * (s1[0] * d2[1] - s2[0] * d1[1]) + (s2[0] * s1[1] - s1[0] * s2[1]) * d0[1]) / den;
    // 細い隙間が出ないよう、三角形を重心から少し（0.18単位）外へ広げて切り抜く
    const cx = (d0[0] + d1[0] + d2[0]) / 3, cy = (d0[1] + d1[1] + d2[1]) / 3, gr = (p) => { const dx = p[0] - cx, dy = p[1] - cy, L = Math.hypot(dx, dy) || 1; return [p[0] + dx / L * 0.18, p[1] + dy / L * 0.18]; };
    const D0 = gr(d0), D1 = gr(d1), D2 = gr(d2);
    g.save(); g.beginPath(); g.moveTo(D0[0], D0[1]); g.lineTo(D1[0], D1[1]); g.lineTo(D2[0], D2[1]); g.closePath(); g.clip();
    g.transform(a, b, c, d, e, f);
    const sx = Math.max(0, Math.floor(Math.min(s0[0], s1[0], s2[0])) - 1), ex = Math.min(im.width, Math.ceil(Math.max(s0[0], s1[0], s2[0])) + 1);
    if (ex > sx) g.drawImage(im, sx, 0, ex - sx, im.height, sx, 0, ex - sx, im.height);
    g.restore();
  }
  /** 台形 P0（左上）P1（右上）P2（右下）P3（左下）に、絵の a0〜a1 の縦の帯を1回で貼る（3つの角でアフィン・台形を少し広げて切り抜く） */
  function quadDraw(g, im, a0, a1, P0, P1, P2, P3) {
    const Hh = im.height, s0 = [a0, 0], s1 = [a1, 0], s2 = [a0, Hh];
    const den = s0[0] * (s2[1] - s1[1]) - s1[0] * s2[1] + s2[0] * s1[1] + (s1[0] - s2[0]) * s0[1]; if (!den) return;
    const d0 = P0, d1 = P1, d2 = P3;
    const a = -(s0[1] * (d2[0] - d1[0]) - s1[1] * d2[0] + s2[1] * d1[0] + (s1[1] - s2[1]) * d0[0]) / den;
    const b = (s1[1] * d2[1] + s0[1] * (d1[1] - d2[1]) - s2[1] * d1[1] + (s2[1] - s1[1]) * d0[1]) / den;
    const c = (s0[0] * (d2[0] - d1[0]) - s1[0] * d2[0] + s2[0] * d1[0] + (s1[0] - s2[0]) * d0[0]) / den;
    const d = -(s1[0] * d2[1] + s0[0] * (d1[1] - d2[1]) - s2[0] * d1[1] + (s2[0] - s1[0]) * d0[1]) / den;
    const e = (s0[0] * (s2[1] * d1[0] - s1[1] * d2[0]) + s0[1] * (s1[0] * d2[0] - s2[0] * d1[0]) + (s2[0] * s1[1] - s1[0] * s2[1]) * d0[0]) / den;
    const f = (s0[0] * (s2[1] * d1[1] - s1[1] * d2[1]) + s0[1] * (s1[0] * d2[1] - s2[0] * d1[1]) + (s2[0] * s1[1] - s1[0] * s2[1]) * d0[1]) / den;
    const cx = (P0[0] + P1[0] + P2[0] + P3[0]) / 4, cy = (P0[1] + P1[1] + P2[1] + P3[1]) / 4, gr = (p) => { const dx = p[0] - cx, dy = p[1] - cy, L = Math.hypot(dx, dy) || 1; return [p[0] + dx / L * 0.22, p[1] + dy / L * 0.22]; };
    const Q = [P0, P1, P2, P3].map(gr);
    g.save(); g.beginPath(); g.moveTo(Q[0][0], Q[0][1]); for (let i = 1; i < 4; i++) g.lineTo(Q[i][0], Q[i][1]); g.closePath(); g.clip();
    g.transform(a, b, c, d, e, f);
    const sx = Math.max(0, Math.floor(Math.min(a0, a1)) - 1), ex = Math.min(im.width, Math.ceil(Math.max(a0, a1)) + 1);
    if (ex > sx) g.drawImage(im, sx, 0, ex - sx, Hh, sx, 0, ex - sx, Hh);
    g.restore();
  }
  /** 帯の絵 im を点の列 pts（なめらかな曲線の細かい点）に沿って、幅 w（単位）で貼る。shift＝帯を横へずらす（stripAlong と同じ向き）。bx＝描く範囲 */
  function meshStrip(g, pts, im, w, bx, shift) {
    if (!im || pts.length < 2) return;
    const step = 2, P2 = []; let acc = 0; P2.push(pts[0]);   // 約2単位ごとの点（細かすぎると重い）
    for (let i = 1; i < pts.length; i++) { acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (acc >= step || i === pts.length - 1) { P2.push(pts[i]); acc = 0; } }
    const n = P2.length, N = [], y0 = -w / 2 + (shift || 0), y1 = y0 + w, ppu = im.height / w, IW = im.width;
    for (let i = 0; i < n; i++) { const a = P2[Math.max(0, i - 1)], b = P2[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; N.push([-dy / L, dx / L]); }
    let u = 0;
    for (let i = 0; i < n - 1; i++) {
      const p = P2[i], r = P2[i + 1], L = Math.hypot(r[0] - p[0], r[1] - p[1]); if (L < 1e-6) continue;
      if (bx && (Math.max(p[0], r[0]) < bx[0] - w || Math.min(p[0], r[0]) > bx[0] + bx[2] + w || Math.max(p[1], r[1]) < bx[1] - w || Math.min(p[1], r[1]) > bx[1] + bx[3] + w)) { u += L * ppu; continue; }
      const A = [p[0] + N[i][0] * y0, p[1] + N[i][1] * y0], Bq = [r[0] + N[i + 1][0] * y0, r[1] + N[i + 1][1] * y0], C = [r[0] + N[i + 1][0] * y1, r[1] + N[i + 1][1] * y1], Dq = [p[0] + N[i][0] * y1, p[1] + N[i][1] * y1];
      let s0 = u % IW, s1 = s0 + L * ppu;
      const quad = (a0, a1, P0, P1, P2_, P3) => quadDraw(g, im, a0, a1, P0, P1, P2_, P3);   // 台形1つ＝1回で貼る（2つの三角形の継ぎ目に細い線が出ないように）
      if (s1 <= IW + 0.01) quad(s0, s1, A, Bq, C, Dq);
      else {   // 絵の端をまたぐ＝途中で切って2つに
        const t = (IW - s0) / (s1 - s0), lerp = (X, Y) => [X[0] + (Y[0] - X[0]) * t, X[1] + (Y[1] - X[1]) * t], Am = lerp(A, Bq), Dm = lerp(Dq, C);
        quad(s0, IW, A, Am, Dm, Dq); quad(0, s1 - IW, Am, Bq, C, Dm);
      }
      u += L * ppu;
    }
  }
  /** 継ぎ目の合わない1枚を、上下左右に鏡映しで並べた 2×2 の1枚（端どうしが必ず同じ画素でつながる）。絵は変えない（並べ方だけ） */
  const MIR = new WeakMap();
  function mirrorTile(im) {
    if (!im) return null; if (MIR.has(im)) return MIR.get(im);
    const doc = root.document, W = im.width, H = im.height, c = doc.createElement('canvas'); c.width = W * 2; c.height = H * 2;
    const g = c.getContext('2d');
    g.drawImage(im, 0, 0);
    g.save(); g.translate(W * 2, 0); g.scale(-1, 1); g.drawImage(im, 0, 0); g.restore();
    g.save(); g.translate(0, H * 2); g.scale(1, -1); g.drawImage(im, 0, 0); g.restore();
    g.save(); g.translate(W * 2, H * 2); g.scale(-1, -1); g.drawImage(im, 0, 0); g.restore();
    MIR.set(im, c); return c;
  }
  // ---- 2「地面になじませる」：ふちの影・ふちにかかる草・マスの足もとの接地の影 ----
  function rnd(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function edgeShade(g, paths, w) {   // 道のふちから地面へ薄く落ちる影（広い線ほど薄く＝ふちがやわらかい）
    g.save(); g.lineCap = g.lineJoin = 'round';
    for (const [ex, a] of [[18, 0.08], [12, 0.12], [8, 0.15], [4, 0.17]]) { g.strokeStyle = `rgba(26,36,12,${a})`; g.lineWidth = w + ex; for (const P of paths) { g.beginPath(); P.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); } }
    g.restore();
  }
  function edgeGrass(g, paths, w, bx, seed) {   // ふちにかかる草の葉（決まった並び＝毎回同じ）
    const COL = ['#3f6d22', '#55862c', '#6c9b38', '#86b04a', '#9cc35a'];
    g.save(); g.lineCap = 'round';
    paths.forEach((P, k) => {
      const R = rnd(seed + k * 7919); let acc = 0;
      for (let i = 1; i < P.length; i++) {
        const a = P[i - 1], b = P[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); acc += L; if (acc < 1.3) continue; acc = 0;
        if (bx && (b[0] < bx[0] - 8 || b[0] > bx[0] + bx[2] + 8 || b[1] < bx[1] - 8 || b[1] > bx[1] + bx[3] + 8)) continue;
        const tx = (b[0] - a[0]) / (L || 1), ty = (b[1] - a[1]) / (L || 1), nx = -ty, ny = tx;
        for (const side of [-1, 1]) {
          if (R() < 0.12) continue;
          const off = side * (w / 2 - 0.9 + R() * 1.8), len = 1.6 + R() * 2.4, ang = (R() - 0.5) * 1.1;
          const x = b[0] + nx * off + tx * (R() - 0.5), y = b[1] + ny * off + ty * (R() - 0.5);
          const dxl = (nx * side) * Math.cos(ang) - (ny * side) * Math.sin(ang) * 0.4, dyl = (ny * side) * Math.cos(ang) + (nx * side) * Math.sin(ang) * 0.4;
          g.strokeStyle = COL[Math.floor(R() * COL.length)]; g.lineWidth = 0.42 + R() * 0.35;
          g.beginPath(); g.moveTo(x, y); g.lineTo(x - dxl * len, y - dyl * len - len * 0.25); g.stroke();
        }
      }
    });
    g.restore();
  }
  function tileShadows(g, D, r, bx) {   // マスの足もと＝地面に落ちる丸い接地の影（マスの絵は立てて置く＝地面とつながって見える）
    g.save();
    for (const n of Object.values(D.nodes)) {
      const x = n[0], y = n[1]; if (bx && (x < bx[0] - r || x > bx[0] + bx[2] + r || y < bx[1] - r || y > bx[1] + bx[3] + r)) continue;
      const gr = g.createRadialGradient(x, y + 0.6, 0, x, y + 0.6, r); gr.addColorStop(0, 'rgba(20,24,10,.42)'); gr.addColorStop(0.6, 'rgba(20,24,10,.24)'); gr.addColorStop(1, 'rgba(20,24,10,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y + 0.6, r, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }
  // ---- 近くの高い解像度の層 ----
  //  cfg＝{ doc, parent（区画を入れる親）, paintAt(g, bx)（従来と同じ描画）, S（カメラの状態）, project, WORLD }
  function hiLayer(cfg) {
    const tiles = new Map(); let queue = [], lastSig = '';
    const R = RES, T = TILE;
    function make(ix, iy) {
      const c = cfg.doc.createElement('canvas'), x0 = ix * T, y0 = iy * T, pw = Math.ceil(T * R) + 2;
      c.width = pw; c.height = pw; c.className = 'rfw-chunk rfw-hi'; c._x = x0 * R - 1; c._y = y0 * R - 1;
      // 2026-10-17：区画ごとに別の合成の層（will-change）にする＝3D に傾けた平面の層の中に描かれると、平面の層の低い倍率で描かれてから引き伸ばされ、
      //  1単位 10px で描いても画面ではぼける（Chromium の GPU 描画で確認：層を分けると canvas の画素のまま合成される）。?qaRoadLayer=0 で従来（比較用）
      Object.assign(c.style, { left: (x0 - 1 / R) + 'px', top: (y0 - 1 / R) + 'px', width: pw / R + 'px', height: pw / R + 'px', visibility: 'hidden', willChange: LAYER ? 'transform' : '' });
      // 2026-10-17：3D の中（海の世界の preserve-3d の平面）では、層は CSS の箱の大きさ × 画素比で描かれる＝箱を canvas の画素 ÷ 画素比にして transform で世界の大きさへ縮める（canvas の画素のまま・それ以上は大きくしない＝層のメモリを増やさない）
      if (cfg.big) { const qk = /[?&]qaHiK=([\d.]+)/.exec((root.location && root.location.search) || ''), k = qk ? +qk[1] : Math.max(1, root.devicePixelRatio || 1); Object.assign(c.style, { width: pw / k + 'px', height: pw / k + 'px', transformOrigin: '0 0', transform: `scale(${k / R})` }); }
      cfg.parent.appendChild(c); return { c, ix, iy, done: false };
    }
    const paintMs = [];   // 区画1枚を描くのにかかった時間（確認用・最後の 60 枚）
    function paint(t) { const t0 = root.performance.now(); const g = t.c.getContext('2d'); g.setTransform(R, 0, 0, R, -t.c._x, -t.c._y); cfg.paintAt(g, [t.c._x / R, t.c._y / R, t.c.width / R, t.c.height / R]); t.done = true; t.c.style.visibility = '';
      paintMs.push(+(root.performance.now() - t0).toFixed(1)); if (paintMs.length > 60) paintMs.shift(); }
    /** 画面に入る区画（カメラの今の姿で地点を写して確かめる）。近い順に最大 MAX 枚 */
    function want() {
      const S = cfg.S, c = S.cam, v = S.view; if (!c || !v || c.s < 1) return [];
      const rad = Math.max(v.W, v.H) / c.s * 1.5 + T, out = [];
      for (let iy = Math.max(0, Math.floor((c.ty - rad) / T)); iy * T < Math.min(cfg.WORLD.h, c.ty + rad); iy++)
        for (let ix = Math.max(0, Math.floor((c.tx - rad) / T)); ix * T < Math.min(cfg.WORLD.w, c.tx + rad); ix++) {
          // 区画の四隅を画面へ写した範囲が、画面（少し広げた）と重なるか（角が全部画面の外でも、画面を横切る大きな区画を取りこぼさない）
          const ps = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([fx, fy]) => cfg.project(c, (ix + fx) * T, (iy + fy) * T));
          const ok = ps.filter((p) => p.k > 0 && p.k < 12);
          const hit = ok.length >= 2 && Math.max(...ok.map((p) => p.x)) > -40 && Math.min(...ok.map((p) => p.x)) < v.W + 40 && Math.max(...ok.map((p) => p.y)) > -40 && Math.min(...ok.map((p) => p.y)) < v.H + 40;
          // 2026-10-17：優先＝画面に大きく映る区画から（旧：注視点に近い順＝注視点は画面の上寄り＝いちばん大きく見える手前の区画が漏れて、くっきりとぼけの境目が出ていた）
          if (hit) { const cl = (p) => ({ x: Math.max(0, Math.min(v.W, p.x)), y: Math.max(0, Math.min(v.H, p.y)) }), q = (p0 => p0.some((p) => !(p.k > 0 && p.k < 12)) ? null : p0.map(cl))([ps[0], ps[1], ps[3], ps[2]]);
            if (!q) { out.push([ix, iy, 1]); continue; }   // 角がカメラの後ろ＝面積を測れない区画はいちばん後回し
            const ar = Math.abs(q.reduce((a, p, i) => { const r = q[(i + 1) % 4]; return a + p.x * r.y - r.x * p.y; }, 0)) / 2; out.push([ix, iy, -ar]); }
        }
      return out.sort((a, b) => a[2] - b[2]).slice(0, MAX);
    }
    function tick() {
      const c = cfg.S && cfg.S.cam; if (!c) return;
      const sig = [Math.round(c.tx / 16), Math.round(c.ty / 16), Math.round(c.s * 4), Math.round((c.yaw || 0) / 10)].join(',');
      if (sig !== lastSig) {
        lastSig = sig; const w = want(), keep = new Set(w.map(([ix, iy]) => ix + ':' + iy));
        const add = w.filter(([ix, iy]) => !tiles.has(ix + ':' + iy)).length;   // 2026-10-17：上限（MAX）を超えないよう、画面に要らない区画から先に捨てる
        for (const [k, t] of tiles) if (!keep.has(k) && tiles.size + add > MAX) { t.c.remove(); tiles.delete(k); }
        queue = w.filter(([ix, iy]) => !tiles.has(ix + ':' + iy) || !tiles.get(ix + ':' + iy).done).map(([ix, iy]) => ix + ':' + iy);
        for (const k of queue) if (!tiles.has(k)) { const [ix, iy] = k.split(':').map(Number); tiles.set(k, make(ix, iy)); }
      }
      const t0 = root.performance.now();
      while (queue.length && root.performance.now() - t0 < BUDGET) { const t = tiles.get(queue.shift()); if (t && !t.done) paint(t); }
    }
    function bytes() { let b = 0; for (const t of tiles.values()) b += t.c.width * t.c.height * 4; return b; }
    function destroy() { for (const t of tiles.values()) t.c.remove(); tiles.clear(); }
    return { tick, bytes, count: () => tiles.size, pending: () => queue.length, paintMs: () => paintMs.slice(), destroy, R, setS: (x) => { cfg.S = x; }, ready: () => !!cfg.S };
  }
  root.MMQAR = Object.freeze({ mode: MODE, RES, TILE, MAX, LAYER, meshStrip, mirrorTile, edgeShade, edgeGrass, tileShadows, hiLayer });
})(typeof window !== 'undefined' ? window : globalThis);
