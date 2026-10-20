// =========================================================
// 2026-10-20 第4便 `MMGL`：1枚の世界の盤の地面と道を WebGL2 で描く（js/proto/roadfirst-world.js の create から使う）
//
//  なぜ：旧来は地面と道を canvas の区画に描き、CSS の 3D（rotateX・perspective）で傾けて見せていた。
//   ① iPhone の Safari は、カメラの目の近くへはみ出す 3D の層を描かないことがある（Chapter 2 A の START の道がぼける・3 便で直らなかった）。
//   ② 区画の画像のメモリに上限がある（近くの層 32〜48MB）＝道・地面の細かさに天井があった（iPhone で近くは 1単位 約 40 画素で映る）。
//  → 地面と道を GPU が遠近つきで直接描く（CSS の 3D の層を使わない）。地面・道・広場はくり返しの高解像度の絵（E03・E04・mipmap＋異方性フィルタ）。
//   谷・水・森・雲のふち・溶岩などの「地形の絵」は従来と同じ描画の関数（paint）で透明な canvas に描いて重ねる（全体は 1単位 2px・カメラの近くは 1単位 最大 14px の区画）。
//  カメラの式は project（roadfirst-world.js）と同じ＝マス・モンスター・景物（DOM）と地面がずれない。地点・道・判定・保存は変えない（描き方だけ）。
//  ?glBoard=0 で従来の描き方（比較・WebGL2 が無い端末も従来）。
// =========================================================
(function (root) {
  'use strict';
  const QS = (root.location && root.location.search) || '';
  const OFF = /[?&]glBoard=0/.test(QS);
  const num = (k, d, lo, hi) => { const m = new RegExp('[?&]' + k + '=([\\d.]+)').exec(QS), x = m ? Number(m[1]) : NaN; return Number.isFinite(x) && x >= lo && x <= hi ? x : d; };
  const DPR = () => Math.min(3, Math.max(1, root.devicePixelRatio || 1));
  const HIDPR = DPR() >= 2.5;
  //  地形の絵の区画：全体（MACRO＝1単位 2px・256 単位四方）と、カメラの近く（NEAR＝64 単位四方・画面で大きく映るほど細かく 5／10／14px）
  const MACRO_RES = 2, MACRO_T = 256, NEAR_T = 64, RES_HI = num('glRes', HIDPR ? 14 : 10, 4, 20), RES_MID = Math.round(RES_HI * 0.6), RES_LO = 5;
  const NEAR_MB = num('glMB', 64, 16, 160), NEAR_BUDGET_MS = 6, NEAR_CAP = 64;

  let SUP = null;
  /** WebGL2 が使えるか（1回だけ確かめる。?glBoard=0 なら使わない） */
  function supported(doc) {
    if (OFF) return false; if (SUP != null) return SUP;
    try { const c = (doc || root.document).createElement('canvas'), g = c.getContext('webgl2'); SUP = !!g; if (g) { const x = g.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); } } catch (e) { SUP = false; }
    return SUP;
  }

  // ---- シェーダー：project と同じ式（yaw で回す → 倍率 → rotateX(tilt) → perspective(P)）。w＝(P − z)／P で遠近つきの補間 ----
  const VS = `#version 300 es
in vec3 aP; in vec2 aT; in vec4 aC;
uniform vec4 uA; uniform vec4 uB; uniform vec4 uY;
out vec2 vT; out vec4 vC; out vec2 vW;
void main(){
  float X0 = aP.x - uA.x, Y0 = aP.y - uA.y;
  float rx = X0 * uY.x - Y0 * uY.y, ry = X0 * uY.y + Y0 * uY.x;
  float X = rx * uA.z, Y = ry * uA.z, Z = aP.z * uA.z;
  float z = Y * uB.w + Z * uB.z, w = (uA.w - z) / uA.w, Yc = Y * uB.z - Z * uB.w;
  gl_Position = vec4(2.0 * (uB.x * w + X) / uY.z - w, w - 2.0 * (uB.y * w + Yc) / uY.w, (-z / (4.0 * uA.w)) * w, w);
  vT = aT; vC = aC; vW = aP.xy;
}`;
  //  uMode：0＝絵 × 色（乗算済みのアルファ）・1＝色だけ・2＝地面（くり返しの絵 0 に、範囲の画像 uM の R／G で絵 1・2 を重ねる）
  const FS = `#version 300 es
precision highp float;
in vec2 vT; in vec4 vC; in vec2 vW;
uniform sampler2D uT0; uniform sampler2D uT1; uniform sampler2D uT2; uniform sampler2D uM; uniform sampler2D uMac;
uniform int uMode; uniform vec3 uTile; uniform vec4 uMBox; uniform vec3 uN; uniform vec4 uOut; uniform float uK; uniform float uHole;
out vec4 o;
void main(){
  if (uMode == 1) { o = vC * uK; return; }
  if (uMode == 2) {
    vec4 c = texture(uT0, vW / uTile.x);
    if (uHole > 0.5) { float hb = texture(uM, (vW - uMBox.xy) / uMBox.zw).b; if (hb > 0.97) discard; c *= 1.0 - hb; }   // 穴（Chapter 2 の海底の盆地の上）＝描かない・深さも書かない
    if (uN.x > 0.5) { vec4 m = texture(uM, (vW - uMBox.xy) / uMBox.zw); c = mix(c, texture(uT1, vW / uTile.y), m.r); if (uN.y > 0.5) c = mix(c, texture(uT2, vW / uTile.z), m.g); }
    if (uN.z > 0.0) { vec4 q = texture(uMac, (vW + vec2(131.0, 77.0)) / 900.0); c.rgb = c.rgb * (1.0 - uN.z * q.a) + uN.z * q.rgb; }   // くり返しを目立たなくする大きな明暗の揺らぎ（road-art-1017 の macro と同じ絵）
    if (uOut.z > 0.0 && (vW.x < 0.0 || vW.y < 0.0 || vW.x > uOut.x || vW.y > uOut.y)) c.rgb *= 1.0 - uOut.z;   // 世界の外の帯（端へ寄ったときに見える所）を少し暗く
    o = c * vC; return;
  }
  o = texture(uT0, vT) * vC * uK;
}`;

  /** 頂点の列（x, y, h, u, v, r, g, b, a）と三角形の番号。色は乗算済み（r・g・b はアルファを掛けた値） */
  function Mesh() { this.v = []; this.i = []; this.n = 0; }
  Mesh.prototype.vert = function (x, y, h, u, v, c) { this.v.push(x, y, h, u, v, c[0], c[1], c[2], c[3]); return this.n++; };
  Mesh.prototype.tri = function (a, b, c) { this.i.push(a, b, c); };
  Mesh.prototype.quad = function (a, b, c, d) { this.i.push(a, b, c, a, c, d); };
  const WHITE = [1, 1, 1, 1], pm = (r, g, b, a) => [r * a, g * a, b * a, a];

  /** 折れ線 P（なめらかな点の列）に沿った帯。off0／off1＝中心線からの横のずれ（左が負）。uv(s, side)＝道のり s・横 0／1 の絵の座標。col(side) */
  function strip(M, P, off0, off1, h, uv, col0, col1) {
    const n = P.length; if (n < 2) return;
    let s = 0, prev = null;
    for (let i = 0; i < n; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
      if (i) s += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
      const p = P[i], t0 = uv(s, 0), t1 = uv(s, 1);
      const i0 = M.vert(p[0] + nx * off0, p[1] + ny * off0, h, t0[0], t0[1], col0), i1 = M.vert(p[0] + nx * off1, p[1] + ny * off1, h, t1[0], t1[1], col1);
      if (prev) M.quad(prev[0], prev[1], i1, i0); prev = [i0, i1];
    }
  }
  /** 正方形（中心 x, y・半径 r）に絵を1枚 */
  function square(M, x, y, r, h, col) { const a = M.vert(x - r, y - r, h, 0, 0, col), b = M.vert(x + r, y - r, h, 1, 0, col), c = M.vert(x + r, y + r, h, 1, 1, col), d = M.vert(x - r, y + r, h, 0, 1, col); M.quad(a, b, c, d); }

  /** くり返しの周期を目立たなくする大きな明暗の揺らぎ（js/qa/road-art-1017.js の macroTex と同じ絵：64px・白か黒・アルファは揺らぎの強さ） */
  function macroCanvas(doc) {
    const N = 64, c = doc.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), d = g.createImageData(N, N);
    let s = 1017; const r = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    const G = 8, v = []; for (let i = 0; i < G * G; i++) v.push(r());
    const at = (x, y) => v[((y % G) + G) % G * G + ((x % G) + G) % G];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const fx = x / N * G, fy = y / N * G, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const a = at(ix, iy) * (1 - sx) + at(ix + 1, iy) * sx, b = at(ix, iy + 1) * (1 - sx) + at(ix + 1, iy + 1) * sx, t = a * (1 - sy) + b * sy;
      const k = (y * N + x) * 4, lum = t > 0.5 ? 255 : 0; d.data[k] = d.data[k + 1] = d.data[k + 2] = lum; d.data[k + 3] = Math.round(Math.abs(t - 0.5) * 2 * 30);
    }
    g.putImageData(d, 0, 0); return c;
  }

  function create(cfg) {
    const { doc, parent, before, WORLD, kit } = cfg;
    const cv = doc.createElement('canvas'); cv.className = 'rfw-gl';
    Object.assign(cv.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '1' });
    parent.insertBefore(cv, before || parent.firstChild);
    const gl = cv.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: true, stencil: true, depth: true, powerPreference: 'high-performance' });
    if (!gl) { cv.remove(); return null; }
    const AN = gl.getExtension('EXT_texture_filter_anisotropic'), ANMAX = AN ? Math.min(8, gl.getParameter(AN.MAX_TEXTURE_MAX_ANISOTROPY_EXT)) : 0;
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
    const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    const U = {}; for (const k of ['uA', 'uB', 'uY', 'uT0', 'uT1', 'uT2', 'uM', 'uMac', 'uMode', 'uTile', 'uMBox', 'uN', 'uOut', 'uK', 'uHole']) U[k] = gl.getUniformLocation(prog, k);
    gl.uniform1i(U.uT0, 0); gl.uniform1i(U.uT1, 1); gl.uniform1i(U.uT2, 2); gl.uniform1i(U.uM, 3); gl.uniform1i(U.uMac, 4);
    const LOC = { aP: gl.getAttribLocation(prog, 'aP'), aT: gl.getAttribLocation(prog, 'aT'), aC: gl.getAttribLocation(prog, 'aC') };
    let dead = false, dirty = true, lastCam = null, drawn = 0;
    const onDirty = () => { dirty = true; if (cfg.onDirty) cfg.onDirty(); };

    // ---- 絵（くり返し・mipmap・異方性） ----
    const tex = {}, waits = [], after = [];
    function upload(t, src, repeat, premul) {
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premul !== false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      const wS = repeat === true || repeat === 'u' ? gl.REPEAT : gl.CLAMP_TO_EDGE, wT = repeat === true ? gl.REPEAT : gl.CLAMP_TO_EDGE;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wS); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wT);
      if (AN) gl.texParameterf(gl.TEXTURE_2D, AN.TEXTURE_MAX_ANISOTROPY_EXT, ANMAX);
    }
    for (const [k, d] of Object.entries(kit.textures || {})) {
      const t = { t: gl.createTexture(), ok: false, w: 0, h: 0 }; tex[k] = t;
      waits.push(new Promise((res) => { const im = new root.Image(); im.decoding = 'async';
        im.onload = () => { if (dead) return res(); try { upload(t.t, im, d.repeat, true); t.ok = true; t.w = im.naturalWidth; t.h = im.naturalHeight; } catch (e) { /* 読めない絵は描かない */ } onDirty(); res(); };
        im.onerror = () => res(); im.src = d.src; }));
    }
    //  範囲の画像（R＝絵 1・G＝絵 2 の重み。黒の上に白で描いた不透明の canvas）と、その世界の範囲 [x, y, w, h]。あとから渡してもよい（setMask）
    /** 読み込み済みの絵（img／canvas）を名前で登録（あとから・盤ごとの絵） */
    function texture(k, src, repeat) { if (!src) return; const t = tex[k] || (tex[k] = { t: gl.createTexture(), ok: false, w: 0, h: 0 }); try { upload(t.t, src, repeat, true); t.ok = true; t.w = src.naturalWidth || src.width; t.h = src.naturalHeight || src.height; } catch (e) { t.ok = false; } onDirty(); }
    let maskT = null, maskBox = null;
    function setMask(canvas, bx) { if (!canvas) return; if (!maskT) maskT = gl.createTexture(); upload(maskT, canvas, false, false); maskBox = bx; onDirty(); }
    if (kit.mask) setMask(kit.mask.canvas, kit.mask.box);
    let macT = null;
    if (kit.macro) { macT = gl.createTexture(); upload(macT, kit.macro.canvas || macroCanvas(doc), true, true); }

    // ---- 動かない網（地面・道・広場）：作るのは1回 ----
    const meshes = [];
    function addMesh(M, opt) {
      if (!M.n) return null;
      const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(M.v), gl.STATIC_DRAW);
      const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(M.i), gl.STATIC_DRAW);
      const m = Object.assign({ vb, ib, count: M.i.length }, opt);
      const at = opt.under ? meshes.findIndex((x) => x.tex === '_disc' || x.tex === 'plaza') : -1;   // under＝広場より下（道と同じ順）
      if (at > 0) meshes.splice(at, 0, m); else meshes.push(m); return m;
    }
    const AP = kit.apron || 640;
    {   // 地面：世界と、その外へ続く帯（端へ寄ったときに見える所）を1枚
      const M = new Mesh(), x0 = -AP, y0 = -AP, x1 = WORLD.w + AP, y1 = WORLD.h + AP, c = WHITE;
      const a = M.vert(x0, y0, 0, 0, 0, c), b = M.vert(x1, y0, 0, 0, 0, c), d = M.vert(x1, y1, 0, 0, 0, c), e = M.vert(x0, y1, 0, 0, 0, c); M.quad(a, b, d, e);
      addMesh(M, { kind: 'ground' });
    }
    const R = kit.roads;
    if (R) {
      const hw = R.surface.w / 2, cw = R.curb ? R.curb.w : 0, sw = R.shadow ? R.shadow.w : 0, h = 0;
      if (R.shadow) { const M = new Mesh(), a = R.shadow.a, c1 = pm(R.shadow.rgb[0], R.shadow.rgb[1], R.shadow.rgb[2], a), c0 = [0, 0, 0, 0], e = hw + cw;
        for (const L of R.lines) { const P = L.P.map((p) => [p[0] + (R.shadow.dx || 0), p[1] + (R.shadow.dy || 0)]); strip(M, P, -e - sw, -e, h, () => [0, 0], c0, c1); strip(M, P, -e, e, h, () => [0, 0], c1, c1); strip(M, P, e, e + sw, h, () => [0, 0], c1, c0); }
        addMesh(M, { kind: 'solid' }); }
      { const M = new Mesh(), T = R.surface.tile; for (const L of R.lines) strip(M, L.P, -hw - 0.3, hw + 0.3, h, (s, side) => [s / T, (side ? R.surface.w + 0.6 : 0) / T], WHITE, WHITE); addMesh(M, { kind: 'tex', tex: 'road' }); }
      if (R.curb) {   // 縁石：絵の縦横比で、縁石の幅 cw に合う長さ（読み込むまでは仮の長さ・読み込んだら作り直す）
        const cl = () => { const t = tex.curb; return t && t.ok && t.h ? cw * t.w / t.h : cw * 20; };
        const build = () => { const L0 = cl(), M2 = new Mesh(); for (const L of R.lines) { strip(M2, L.P, -hw - cw, -hw, h, (s, side) => [s / L0, side ? 1 : 0], WHITE, WHITE); strip(M2, L.P, hw + cw, hw, h, (s, side) => [s / L0, side ? 1 : 0], WHITE, WHITE); } return M2; };
        const m = addMesh(build(), { kind: 'tex', tex: 'curb' });
        if (m) after.push(() => { if (!tex.curb || !tex.curb.ok) return; const M2 = build(); gl.bindBuffer(gl.ARRAY_BUFFER, m.vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(M2.v), gl.STATIC_DRAW); }); }
      if (R.plaza) {
        const MS = new Mesh(), MP = new Mesh(), ps = R.plaza.shadow || 4;
        const rOf = R.plaza.radius || ((id, end) => (end ? R.plaza.rEnd || R.plaza.r : R.plaza.r));
        for (const [id, r] of [...R.hubs.map((id) => [id, rOf(id, false)]), ...R.ends.map((id) => [id, rOf(id, true)])]) { const n = cfg.D.nodes[id]; if (!n) continue;
          square(MS, n[0] + (R.plaza.sdx || 0), n[1] + (R.plaza.sdy || 0.6), r + ps, h, pm(1, 1, 1, R.plaza.sa || 0.32)); square(MP, n[0], n[1], r, h, WHITE); }
        addMesh(MS, { kind: 'tex', tex: '_disc' }); addMesh(MP, { kind: 'tex', tex: 'plaza' });
      }
    }
    //  広場の下の影：中心が濃く外が透明な円（作った絵）
    { const c = doc.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.72, 'rgba(0,0,0,.85)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
      const t = { t: gl.createTexture(), ok: true, w: 128, h: 128 }; upload(t.t, c, false, true); tex._disc = t; }

    // ---- 地形の絵（従来の描画の関数を透明な canvas に）：全体の区画（MACRO）とカメラの近くの区画（NEAR） ----
    const paintCv = doc.createElement('canvas'), pg = paintCv.getContext('2d');
    const box = kit.featureBox || [0, 0, WORLD.w, WORLD.h];
    const macro = [], near = new Map(); let featOn = false, macroQ = [], nearQ = [], nearSig = '', nearBytes = 0, lastNearCheck = 0;
    const tileBytes = (T, r) => Math.pow(Math.ceil(T * r) + 2, 2) * 4 * 1.34;
    /** 区画を1枚描いて絵にする。中身が空（透明だけ）なら null */
    function paintTile(x0, y0, T, r) {
      const pw = Math.ceil(T * r) + 2; if (paintCv.width !== pw || paintCv.height !== pw) { paintCv.width = pw; paintCv.height = pw; } else pg.clearRect(0, 0, pw, pw);
      pg.setTransform(r, 0, 0, r, -(x0 * r - 1), -(y0 * r - 1));
      kit.features(pg, [x0 - 1 / r, y0 - 1 / r, pw / r, pw / r]);
      pg.setTransform(1, 0, 0, 1, 0, 0);
      if (!kit.keepEmpty) { const s = TMP_S || (TMP_S = doc.createElement('canvas')); s.width = 24; s.height = 24; const sg = s.getContext('2d'); sg.clearRect(0, 0, 24, 24); sg.drawImage(paintCv, 0, 0, 24, 24);
        const d = sg.getImageData(0, 0, 24, 24).data; let any = false; for (let i = 3; i < d.length; i += 4) if (d[i] > 2) { any = true; break; } if (!any) return null; }
      const t = gl.createTexture(); upload(t, paintCv, false, true);
      const M = new Mesh(), u0 = 1 / pw, u1 = (1 + T * r) / pw, c = WHITE, a = M.vert(x0, y0, 0, u0, u0, c), b = M.vert(x0 + T, y0, 0, u1, u0, c), d = M.vert(x0 + T, y0 + T, 0, u1, u1, c), e = M.vert(x0, y0 + T, 0, u0, u1, c); M.quad(a, b, d, e);
      const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(M.v), gl.STATIC_DRAW);
      return { t, vb, bytes: tileBytes(T, r) };
    }
    let TMP_S = null, QIB = null;
    function quadIB() { if (!QIB) { QIB = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, QIB); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW); } return QIB; }
    function freeTile(o) { if (o && o.t) { gl.deleteTexture(o.t); gl.deleteBuffer(o.vb); } }
    /** 地形の絵を描き始める（絵の読み込みが終わってから） */
    function startFeatures() {
      if (!kit.features || featOn) return; featOn = true;
      for (let y = Math.floor(box[1] / MACRO_T) * MACRO_T; y < box[3]; y += MACRO_T) for (let x = Math.floor(box[0] / MACRO_T) * MACRO_T; x < box[2]; x += MACRO_T) macroQ.push([x, y]);
      const c0 = lastCam || { tx: WORLD.w / 2, ty: WORLD.h / 2 }; macroQ.sort((a, b) => Math.hypot(a[0] + 128 - c0.tx, a[1] + 128 - c0.ty) - Math.hypot(b[0] + 128 - c0.tx, b[1] + 128 - c0.ty));
    }
    /** カメラの近くの区画（画面で大きく映る順・メモリの上限まで）。[ix, iy, 順, 細かさ] */
    function wantNear(c, v) {
      if (!c || !v || c.s < 1) return [];
      const T = NEAR_T, rad = Math.max(v.W, v.H) / c.s * 1.5 + T, out = [], dpr = DPR();
      for (let iy = Math.floor(Math.max(box[1], c.ty - rad) / T); iy * T < Math.min(box[3], c.ty + rad); iy++)
        for (let ix = Math.floor(Math.max(box[0], c.tx - rad) / T); ix * T < Math.min(box[2], c.tx + rad); ix++) {
          let sc = 0, px = 0;
          for (let a = 0; a <= 4; a++) for (let b = 0; b <= 4; b++) { const p = cfg.project(c, (ix + a / 4) * T, (iy + b / 4) * T); if (!(p.k > 0 && p.k < 60)) continue;
            if (p.x > -40 && p.x < v.W + 40 && p.y > -40 && p.y < v.H + 40) { sc += p.k * p.k; px = Math.max(px, p.k * c.s * dpr); } }
          if (sc > 0 && px > MACRO_RES * 1.6) out.push([ix, iy, -sc, px > RES_MID * 1.15 ? RES_HI : px > RES_LO * 1.25 ? RES_MID : RES_LO]);
        }
      out.sort((a, b) => a[2] - b[2]);
      const pick = []; let used = 0; const B = NEAR_MB * 1048576;
      for (const w of out) { if (pick.length >= NEAR_CAP) break; let r = w[3];
        while (used + tileBytes(T, r) > B && r > RES_LO) r = r === RES_HI ? RES_MID : RES_LO;
        if (used + tileBytes(T, r) > B) continue; w[3] = r; used += tileBytes(T, r); pick.push(w); }
      return pick;
    }
    function featTick(c, v) {
      if (!featOn) return;
      const t0 = root.performance.now();
      while (macroQ.length && root.performance.now() - t0 < NEAR_BUDGET_MS) { const [x, y] = macroQ.shift(); try { const o = paintTile(x, y, MACRO_T, MACRO_RES); if (o) macro.push(o); } catch (e) { /* 描けない区画は飛ばす */ } onDirty(); }
      if (!c) return;
      const sig = [Math.round(c.tx / 16), Math.round(c.ty / 16), Math.round(c.s * 4), Math.round((c.yaw || 0) / 10), Math.round(c.tilt)].join(',');
      const now = root.performance.now(); if (!nearQ.length && now - lastNearCheck > 1000) { lastNearCheck = now; nearSig = ''; }
      if (sig !== nearSig) {
        nearSig = sig; const w = wantNear(c, v), keep = new Map(w.map(([ix, iy, , r]) => [ix + ':' + iy, r]));
        for (const [k, o] of near) if (!keep.has(k) || (o.r < keep.get(k))) { freeTile(o.o); near.delete(k); }
        nearQ = w.filter(([ix, iy]) => !near.has(ix + ':' + iy)).map(([ix, iy, , r]) => [ix, iy, r]);
      }
      while (nearQ.length && root.performance.now() - t0 < NEAR_BUDGET_MS) { const [ix, iy, r] = nearQ.shift(), k = ix + ':' + iy; if (near.has(k)) continue;
        let o = null; try { o = paintTile(ix * NEAR_T, iy * NEAR_T, NEAR_T, r); } catch (e) { o = null; }
        near.set(k, { o, r }); onDirty(); }
      nearBytes = 0; for (const x of near.values()) if (x.o) nearBytes += x.o.bytes;
    }

    // ---- 描く ----
    function bindMesh(vb, ib) {
      gl.bindBuffer(gl.ARRAY_BUFFER, vb); if (ib) gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
      const S = 9 * 4; gl.enableVertexAttribArray(LOC.aP); gl.vertexAttribPointer(LOC.aP, 3, gl.FLOAT, false, S, 0);
      gl.enableVertexAttribArray(LOC.aT); gl.vertexAttribPointer(LOC.aT, 2, gl.FLOAT, false, S, 12);
      gl.enableVertexAttribArray(LOC.aC); gl.vertexAttribPointer(LOC.aC, 4, gl.FLOAT, false, S, 20);
    }
    const bindTex = (unit, t) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); };
    function size() {
      const r = parent.getBoundingClientRect(), d = DPR(), W = Math.max(1, Math.round(r.width * d)), H = Math.max(1, Math.round(r.height * d));
      if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; dirty = true; }
      return { W: r.width, H: r.height };
    }
    function draw(c) {
      if (dead || !c) return; lastCam = c;
      const vs = size(); gl.viewport(0, 0, cv.width, cv.height);
      const th = c.tilt * Math.PI / 180, ya = (c.yaw || 0) * Math.PI / 180;
      gl.uniform4f(U.uA, c.tx, c.ty, c.s, c.P); gl.uniform4f(U.uB, c.ax, c.ay, Math.cos(th), Math.sin(th)); gl.uniform4f(U.uY, Math.cos(ya), Math.sin(ya), vs.W, vs.H);
      gl.clearColor(0, 0, 0, 0); gl.clearStencil(0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
      gl.disable(gl.CULL_FACE); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.uniform1f(U.uK, 1); gl.uniform1f(U.uHole, 0);
      //  3D の網がある盤（Chapter 2）：深さで前後を決める。海底・壁・塔（pre）→ 地面（穴の所は描かない）→ 高さ 0 の地形の絵・道・広場（地面より少し手前に寄せて深さを比べる＝塔の後ろは隠れる）→ 盆地の上の海面（post）
      const DEP = !!kit.depth;
      if (DEP) { gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true); drawPhase('pre', true); } else gl.disable(gl.DEPTH_TEST);
      // 1. 地面（くり返しの絵＋範囲の画像で重ねる絵）
      const G = kit.ground, t0 = tex[G.tex], t1 = G.layers && G.layers[0] ? tex[G.layers[0].tex] : null, t2 = G.layers && G.layers[1] ? tex[G.layers[1].tex] : null;
      if (t0 && t0.ok) {
        gl.uniform1i(U.uMode, 2); gl.uniform3f(U.uTile, G.tile, G.layers && G.layers[0] ? G.layers[0].tile : 1, G.layers && G.layers[1] ? G.layers[1].tile : 1);
        bindTex(0, t0.t); const n1 = maskT && t1 && t1.ok ? 1 : 0, n2 = n1 && t2 && t2.ok ? 1 : 0;
        if (n1) { bindTex(1, t1.t); bindTex(3, maskT); gl.uniform4f(U.uMBox, maskBox[0], maskBox[1], maskBox[2], maskBox[3]); } if (n2) bindTex(2, t2.t);
        gl.uniform4f(U.uOut, WORLD.w, WORLD.h, G.outDark || 0, 0);
        if (macT && kit.macro.k) bindTex(4, macT); gl.uniform3f(U.uN, n1, n2, macT ? kit.macro.k || 0 : 0);
        if (maskT && kit.hole) { bindTex(3, maskT); gl.uniform4f(U.uMBox, maskBox[0], maskBox[1], maskBox[2], maskBox[3]); gl.uniform1f(U.uHole, 1); }
        const m = meshes[0]; bindMesh(m.vb, m.ib); gl.drawElements(gl.TRIANGLES, m.count, gl.UNSIGNED_INT, 0); gl.uniform1f(U.uHole, 0);
      } else if (G.color) { gl.clearColor(G.color[0], G.color[1], G.color[2], 1); gl.clear(gl.COLOR_BUFFER_BIT); }
      if (DEP) { gl.depthMask(false); gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-1, -4); }
      // 2. 地形の絵：近くの区画（ステンシル 1 を書く）→ 全体の区画（ステンシル 1 の所には描かない＝重ねて濃くならない）
      gl.uniform1i(U.uMode, 0); const ib = quadIB();
      gl.enable(gl.STENCIL_TEST); gl.stencilFunc(gl.ALWAYS, 1, 0xff); gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
      for (const x of near.values()) { if (!x.o) continue; bindTex(0, x.o.t); bindMesh(x.o.vb, ib); gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0); }
      //  空の近くの区画もステンシルを書く（全体の区画を描かない）：空の区画の四角を色なしで
      gl.colorMask(false, false, false, false); gl.uniform1i(U.uMode, 1);
      for (const [k, x] of near) { if (x.o) continue; const [ix, iy] = k.split(':').map(Number); const vb = emptyQuad(ix, iy); bindMesh(vb, ib); gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0); }
      gl.colorMask(true, true, true, true); gl.uniform1i(U.uMode, 0);
      gl.stencilFunc(gl.NOTEQUAL, 1, 0xff); gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
      for (const o of macro) { bindTex(0, o.t); bindMesh(o.vb, ib); gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_INT, 0); }
      gl.disable(gl.STENCIL_TEST);
      // 3. 道の影 → 石畳 → 縁石 → 広場の影 → 広場（広場は道の上＝縁石の輪は切れない）
      drawPhase(null, false);
      if (DEP) { gl.disable(gl.POLYGON_OFFSET_FILL); drawPhase('post', false); gl.depthMask(true); }
      dirty = false; drawn++;
    }
    /** 網を順に描く（phase＝pre／post／null（高さ 0 の道・広場など）） */
    function drawPhase(phase, depthWrite) {
      if (kit.depth) gl.depthMask(!!depthWrite);
      for (const m of meshes.slice(1)) {
        if ((m.phase || null) !== phase) continue;
        gl.uniform1f(U.uK, m.alpha == null ? 1 : m.alpha);
        if (m.kind === 'solid') { gl.uniform1i(U.uMode, 1); bindMesh(m.vb, m.ib); gl.drawElements(gl.TRIANGLES, m.count, gl.UNSIGNED_INT, 0); continue; }
        const t = tex[m.tex]; if (!t || !t.ok) continue;
        gl.uniform1i(U.uMode, 0); bindTex(0, t.t); bindMesh(m.vb, m.ib); gl.drawElements(gl.TRIANGLES, m.count, gl.UNSIGNED_INT, 0);
      }
      gl.uniform1f(U.uK, 1);
    }
    function addSpec(sp) {
      const M = new Mesh(), off = (P) => (sp.dx || sp.dy ? P.map((p) => [p[0] + (sp.dx || 0), p[1] + (sp.dy || 0)]) : P);
      if (sp.kind === 'solid') { const a = sp.a, c1 = pm(sp.rgb[0], sp.rgb[1], sp.rgb[2], a), c0 = [0, 0, 0, 0], e = sp.w / 2, f = sp.fade || 0;
        for (const P0 of sp.lines) { const P = off(P0); if (f) strip(M, P, -e - f, -e, 0, () => [0, 0], c0, c1); strip(M, P, -e, e, 0, () => [0, 0], c1, c1); if (f) strip(M, P, e, e + f, 0, () => [0, 0], c1, c0); }
        return addMesh(M, { kind: 'solid', under: !!sp.under }); }
      if (sp.kind === 'strip') { const t = tex[sp.tex], w = Math.abs(sp.off1 - sp.off0), L0 = sp.len || (t && t.ok && t.h ? w * t.w / t.h : w * 8);
        for (const P0 of sp.lines) strip(M, off(P0), sp.off0, sp.off1, 0, (s, side) => [s / L0, side ? 1 : 0], WHITE, WHITE);
        return addMesh(M, { kind: 'tex', tex: sp.tex, under: !!sp.under }); }
      if (sp.kind === 'mesh') {   // 3D の網（Chapter 2 の海底・壁・斜路・塔）：verts＝[x, y, h, u, v, r, g, b, a]（色は乗算済み）の列・idx＝三角形の番号
        for (let i = 0; i < sp.verts.length; i += 9) M.vert(sp.verts[i], sp.verts[i + 1], sp.verts[i + 2], sp.verts[i + 3], sp.verts[i + 4], [sp.verts[i + 5], sp.verts[i + 6], sp.verts[i + 7], sp.verts[i + 8]]);
        M.i = sp.idx.slice(); return addMesh(M, { kind: sp.tex ? 'tex' : 'solid', tex: sp.tex, phase: sp.phase || 'pre', name: sp.name, alpha: sp.alpha == null ? 1 : sp.alpha }); }
      if (sp.kind === 'quad') { for (const q of sp.items) { const a = M.vert(q.x - q.w / 2, q.y - q.h / 2, 0, 0, 0, WHITE), b = M.vert(q.x + q.w / 2, q.y - q.h / 2, 0, 1, 0, WHITE), c = M.vert(q.x + q.w / 2, q.y + q.h / 2, 0, 1, 1, WHITE), d = M.vert(q.x - q.w / 2, q.y + q.h / 2, 0, 0, 1, WHITE); M.quad(a, b, c, d); }
        return addMesh(M, { kind: 'tex', tex: sp.tex }); }
      return null;
    }
    const EQ = new Map();
    function emptyQuad(ix, iy) { const k = ix + ':' + iy; if (EQ.has(k)) return EQ.get(k); const M = new Mesh(), T = NEAR_T, x0 = ix * T, y0 = iy * T, c = [0, 0, 0, 0];
      const a = M.vert(x0, y0, 0, 0, 0, c), b = M.vert(x0 + T, y0, 0, 0, 0, c), d = M.vert(x0 + T, y0 + T, 0, 0, 0, c), e = M.vert(x0, y0 + T, 0, 0, 0, c); M.quad(a, b, d, e);
      const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(M.v), gl.STATIC_DRAW); EQ.set(k, vb); return vb; }

    const ready = Promise.all(waits).then(() => { if (dead) return false; for (const f of after) f(); onDirty(); return true; });
    cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); dead = true; if (cfg.onLost) cfg.onLost(); }, { once: true });
    return {
      el: cv, ready, setMask, texture,
      /** 道の上に重ねる網（盤ごと・あとから）。spec＝{ kind: 'strip', lines（点の列の列）, off0, off1, tex, len（絵 1 枚の長さ・単位。無ければ絵の縦横比と帯の幅から）, dx, dy }
       *  ／{ kind: 'solid', lines, w, a, rgb, dx, dy }（帯の影）／{ kind: 'quad', items: [{ x, y, w, h }], tex }（地点の上の絵） */
      add(spec) { const m = addSpec(spec); onDirty(); return m; },
      /** 名前の付いた網の濃さ（Chapter 2 の盆地の上の海面：海底に潜ると薄く） */
      alpha(name, a) { for (const m of meshes) if (m.name === name && m.alpha !== a) { m.alpha = a; onDirty(); } },
      /** 地形の絵の描画を始める（roadfirst-world の絵の読み込みが終わったら） */
      start: startFeatures,
      /** 毎フレーム：カメラの近くの地形の区画を少しずつ描く（数ミリ秒まで） */
      tick: (c, v) => { if (!dead) featTick(c, v); },
      draw, isDirty: () => dirty,
      macroDone: () => featOn && !macroQ.length,
      stats: () => ({ macro: macro.length, near: [...near.values()].filter((x) => x.o).length, nearEmpty: [...near.values()].filter((x) => !x.o).length, pending: macroQ.length + nearQ.length, nearMB: +(nearBytes / 1048576).toFixed(1), drawn, tex: Object.fromEntries(Object.entries(tex).map(([k, t]) => [k, t.ok])), aniso: ANMAX, dead }),
      destroy() { dead = true; for (const o of macro) freeTile(o); for (const x of near.values()) freeTile(x.o); try { const x = gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); } catch (e) {} cv.remove(); },
    };
  }
  root.MMGL = Object.freeze({ supported, create, OFF, RES_HI, NEAR_MB });
})(typeof window !== 'undefined' ? window : globalThis);
