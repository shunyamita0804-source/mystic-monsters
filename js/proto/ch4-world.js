// =========================================================
// Chapter 4「灼熱の火山」A／B／C — 火山の世界ボードの描画 `MMRF_VOLC`（2026-10-19）
//
//  js/proto/roadfirst-world.js（MMRF_WORLD）が、道のデータが art.volcano3d を持つとき（js/proto/ch4-routes.js の MMRF_CH4）だけ呼ぶ。Chapter 1〜3 では何もしない。
//  差し込み口は Chapter 2 の海（js/proto/ch2-world.js の MMRF_SEA）と同じ形（load・build3d・ground・roads・scatter・lm・goal・apron）。
//  ただし火山の盤は平ら（flat）：地点の高さ art.elev は景色の区域（夕暮れ → 薄暮 → 夜）を決めるのに使い、マス・モンスターは持ち上げない
//  （平らな地面の上でマスだけ浮くと地面から離れて見える＝roadfirst-world.js は sea3d のときだけ高さを使う）。
//  正式素材（2026-10-19 納品 Mismon_Ch4_FINAL_20261019＋修正差分・tools/ch4art1019/derive.py の派生 assets/fields/ch4/art_1019/）：
//    地面 C4_TERR_01・道 C4_ROAD_01・縁石 STD_C4_ROAD_02 L/R・分かれ目の広場 C4_ROAD_03_CENTER_BLEND・橋の床 C4_ROAD_04（v2／v3 は盤の上で比べて採否＝下の DECK）・
//    橋の欄干 C4_ROAD_05 L/R・岩の崖 STD_C4_TERR_03・溶岩の尾根 STD_C4_TERR_04・空 STD_C4_BG_01／02・会場の門 C4_ARCH_03・イベントの台座 C4_UI_01 v3_ALPHA・
//    道しるべ STD_C4_UI_02・噴煙 C4_FX_01。
//  【未着＝ブロッカー】巨大火山の4分割原画（TL/TR/BL/BR）と溶岩の絵：山の形（等高線の段と火口）と溶岩（湖・川）は描画で代わりに作る（旧い火山・旧盤の絵では埋めない）。
//  【未着】Chapter 4 専用の目印（C4_LM_*）：Chapter 1 の目印のうち火山に合うもの（門・像・祭壇・隠れ家）と C4 の岩の崖・溶岩の尾根で代わりに置く。
// =========================================================
(function (root) {
  'use strict';
  const A4 = './assets/fields/ch4/art_1019/', U = (n) => A4 + n + '.webp';
  // 橋の床：2026-10-19 修正差分の v3_CANDIDATE（道の石材に近づけた候補）と v2 を盤の上で比べた結果（docs/next_1019 の比較画像）。採用した方だけを読む
  const DECK = 'bridge_deck_v3';
  const TEX = { ground: ['ground_basalt', 120], road: ['road_basalt', 40] };
  const STRIP = { curbL: 'curb_l', curbR: 'curb_r', railL: 'rail_l', railR: 'rail_r' };
  const IMG = { plaza: 'plaza_disc', deck: DECK, base: 'event_base', skyDusk: 'sky_dusk', skyNight: 'sky_night' };
  const ROAD_W = 22, CURB_W = 4.2, RAIL_W = 7, PLAZA_D = 50, BASE_D = 46;
  const imgP = (src) => new Promise((res) => { const im = new root.Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  function load() {
    const ks = Object.keys(TEX), ss = Object.keys(STRIP), is = Object.keys(IMG);
    return Promise.all([...ks.map((k) => imgP(U(TEX[k][0]))), ...ss.map((k) => imgP(U(STRIP[k]))), ...is.map((k) => imgP(U(IMG[k])))]).then((a) => {
      const o = { tex: {}, strip: {}, img: {} }; let i = 0;
      ks.forEach((k) => { o.tex[k] = a[i++]; }); ss.forEach((k) => { o.strip[k] = a[i++]; }); is.forEach((k) => { o.img[k] = a[i++]; });
      o.deckStrip = deckStrip(o.img.deck); o.formal = a.filter(Boolean).length; o.total = a.length;
      return o;
    });
  }
  let warmed = null;
  function warm() { if (warmed || !root.Image) return warmed; warmed = [...Object.values(TEX).map((t) => U(t[0])), ...Object.values(STRIP).map(U), ...Object.values(IMG).map(U), U('goal_gate'), U('rock_cliff'), U('lava_ridge'), U('signpost'), U('smoke_back')]
    .map((u) => { const im = new root.Image(); im.decoding = 'async'; im.src = u; return im; }); return warmed; }
  /** 橋の床の絵は縦長（行＝橋の長さの向き）。帯の絵（横＝長さ）として使うため1回だけ 90° 回した canvas を作る */
  function deckStrip(im) {
    if (!im || !root.document) return null;
    try { const c = root.document.createElement('canvas'); c.width = im.height; c.height = im.width; const g = c.getContext('2d');
      g.translate(0, im.width); g.rotate(-Math.PI / 2); g.drawImage(im, 0, 0); return c; } catch (e) { return null; }
  }
  const tp = (g, H, S, k) => (S && S.tex && S.tex[k] ? H.pattern(g, S.tex[k], TEX[k][1]) : null);
  const polyPath = (g, P) => { g.beginPath(); P.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); };
  const pathOf = (g, P) => { g.beginPath(); P.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); };
  const ell = (g, cx, cy, rx, ry) => { g.beginPath(); g.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2); };
  /** 地点の標高（等高線の楕円から補間）＝景色の区域・空の色に使う（マスは持ち上げない） */
  function elevAt(D, x, y) {
    const a = D.art, c = a.summit || [512, 185], C = (a.contours || []).slice().sort((p, q) => p.elev - q.elev);
    if (!C.length) return 0;
    const r = (k) => Math.hypot((x - c[0]) / k.rx, (y - c[1]) / k.ry);   // 1＝その等高線の上
    if (r(C[0]) >= 1) return Math.max(0, C[0].elev * (1 - Math.min(1, (r(C[0]) - 1) * 1.6)));
    for (let i = 1; i < C.length; i++) if (r(C[i]) >= 1) { const t = (r(C[i - 1]) - 1) / ((r(C[i - 1]) - 1) - (r(C[i]) - 1) || 1); return C[i - 1].elev + (C[i].elev - C[i - 1].elev) * Math.max(0, Math.min(1, t)); }
    return C[C.length - 1].elev + 12;
  }
  const phaseOf = (D, e) => { const P = D.art.skyPhase || {}; return e >= ((P.night || [84])[0]) ? 'night' : e >= ((P.twilight || [40])[0]) ? 'twi' : 'dusk'; };
  const lavaOf = (D) => D.art.lava || [];
  /** 閉じた多角形をなめらかな曲線で（辺の中点を通る2次曲線）＝溶岩の川の角ばりを消す。形（位置・幅）は変えない */
  const smoothPath = (g, P) => { const n = P.length, mid = (i) => [(P[i % n][0] + P[(i + 1) % n][0]) / 2, (P[i % n][1] + P[(i + 1) % n][1]) / 2]; g.beginPath(); const m0 = mid(n - 1); g.moveTo(m0[0], m0[1]);
    for (let i = 0; i < n; i++) { const q = mid(i); g.quadraticCurveTo(P[i][0], P[i][1], q[0], q[1]); } g.closePath(); };
  /** 溶岩（湖・川）の塗り：絵は届いていない＝明るい芯から暗い赤のふちへの塗り＋冷えた表面の筋（決まった乱数）＋外の熱の光 */
  function lava(g, D, H) {
    for (const L of lavaOf(D)) {
      const P = L.poly; if (!P || P.length < 3) continue;
      g.save(); g.lineJoin = 'round';
      for (const [w, a] of [[34, 0.07], [22, 0.1], [12, 0.16]]) { g.strokeStyle = `rgba(255,120,30,${a})`; g.lineWidth = w; smoothPath(g, P); g.stroke(); }   // 熱の光
      smoothPath(g, P); g.clip();
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of P) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
      g.fillStyle = '#7a1206'; g.fillRect(x0, y0, x1 - x0, y1 - y0);
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.max(x1 - x0, y1 - y0) / 2;
      const grd = L.kind === 'lake' ? g.createRadialGradient(cx, cy, R * 0.05, cx, cy, R) : g.createLinearGradient(x0, y0, x1, y0);
      if (L.kind === 'lake') { grd.addColorStop(0, '#ffe08a'); grd.addColorStop(0.35, '#ff9a2a'); grd.addColorStop(0.75, '#d9431a'); grd.addColorStop(1, '#8c1608'); }
      else { grd.addColorStop(0, '#a31d0a'); grd.addColorStop(0.5, '#ff8a26'); grd.addColorStop(1, '#a31d0a'); }
      g.fillStyle = grd; g.fillRect(x0, y0, x1 - x0, y1 - y0);
      const rnd = H.mulberry(L.id.length * 7919 + 13); g.strokeStyle = 'rgba(60,10,4,.55)'; g.lineCap = 'round';
      for (let i = 0; i < (L.kind === 'lake' ? 70 : 60); i++) {   // 冷えた表面の筋
        let x = x0 + rnd() * (x1 - x0), y = y0 + rnd() * (y1 - y0); g.lineWidth = 0.8 + rnd() * 1.6; g.beginPath(); g.moveTo(x, y);
        for (let k = 0; k < 4; k++) { x += (rnd() - 0.5) * 22; y += (rnd() - 0.5) * 14; g.lineTo(x, y); } g.stroke();
      }
      g.restore();
      g.save(); g.strokeStyle = 'rgba(40,14,8,.9)'; g.lineWidth = 2.4; smoothPath(g, P); g.stroke(); g.restore();   // 岸の黒い縁
    }
  }
  const REG_TINT = { village: 'rgba(150,104,70,.30)', ash: 'rgba(196,188,176,.30)', obsidian: 'rgba(14,12,20,.36)', fumarole: 'rgba(214,190,90,.22)', temple: 'rgba(150,40,30,.20)', tower: 'rgba(110,90,74,.22)', arena: 'rgba(60,36,30,.28)' };
  function ground(g, D, bx, art, H) {
    const S = art.volc || {}, [x0, y0, w, h] = bx, a = D.art;
    const gp = tp(g, H, S, 'ground');
    g.fillStyle = gp || a.ground || '#5a4034'; g.fillRect(x0, y0, w, h);
    if (gp && S.tex.ground) { const im = S.tex.ground, p2 = g.createPattern(im, 'repeat'); if (p2 && p2.setTransform && root.DOMMatrix) { p2.setTransform(new root.DOMMatrix().rotate(31).scale((TEX.ground[1] * 1.61) / im.width)); g.save(); g.globalAlpha = 0.42; g.fillStyle = p2; g.fillRect(x0, y0, w, h); g.restore(); } }   // くり返しの縞を消す（絵は変えない）
    // 山の形：山頂へ向かって暗く（夜の空気）・麓は夕日の色。等高線の段にやわらかい影と稜線の光
    const c = a.summit || [512, 185], C = (a.contours || []).slice().sort((p, q) => p.elev - q.elev);
    g.save();
    const sun = g.createLinearGradient(0, 1536, 0, 0); sun.addColorStop(0, 'rgba(255,150,80,.18)'); sun.addColorStop(0.45, 'rgba(120,70,90,.08)'); sun.addColorStop(1, 'rgba(10,14,40,.26)');
    g.fillStyle = sun; g.fillRect(x0, y0, w, h);
    // 山体：山頂の円錐を暗く・夕日の当たる左下の斜面を明るく（巨大火山の原画が届くまでの描画による代わり）
    if (C.length) { const big = C[0];
      g.save(); g.translate(c[0], c[1]); g.scale(1, big.ry / big.rx);
      const cone = g.createRadialGradient(0, 0, 40, 0, 0, big.rx); cone.addColorStop(0, 'rgba(20,10,14,.42)'); cone.addColorStop(0.5, 'rgba(36,20,22,.22)'); cone.addColorStop(1, 'rgba(36,20,22,0)');
      g.fillStyle = cone; g.beginPath(); g.arc(0, 0, big.rx, 0, Math.PI * 2); g.fill();
      const lit = g.createRadialGradient(-big.rx * 0.55, big.rx * 0.5, 10, -big.rx * 0.55, big.rx * 0.5, big.rx * 0.95); lit.addColorStop(0, 'rgba(255,170,110,.20)'); lit.addColorStop(1, 'rgba(255,170,110,0)');
      g.fillStyle = lit; g.beginPath(); g.arc(0, 0, big.rx, 0, Math.PI * 2); g.fill(); g.restore(); }
    for (const k of C) {
      ell(g, c[0], c[1] + 7, k.rx, k.ry); g.lineWidth = 22; g.strokeStyle = 'rgba(10,6,6,.16)'; g.stroke();
      ell(g, c[0], c[1], k.rx, k.ry); g.lineWidth = 3; g.strokeStyle = 'rgba(255,190,140,.13)'; g.stroke();
    }
    // 尾根の筋（山頂から放射・決まった並び）＝山の斜面に見せる
    const rnd = H.mulberry(4104); g.lineCap = 'round';
    for (let i = 0; i < 46; i++) { const t = (i / 46) * Math.PI * 2 + rnd() * 0.08, r0 = 130 + rnd() * 30, r1 = 520 + rnd() * 380;
      g.strokeStyle = `rgba(20,10,10,${0.05 + rnd() * 0.05})`; g.lineWidth = 6 + rnd() * 10; g.beginPath();
      g.moveTo(c[0] + Math.cos(t) * r0, c[1] + Math.sin(t) * r0 * 1.15); g.lineTo(c[0] + Math.cos(t) * r1, c[1] + Math.sin(t) * r1 * 1.15); g.stroke(); }
    g.restore();
    // 景色の区域（村・灰の原・黒曜の原・噴気の棚・神殿・見張り塔・会場）：区域の多角形の中心から外へ薄くなる楕円のにじみ（角ばった形を見せない）
    g.save();
    for (const r of a.regions || []) { const col = REG_TINT[r.kind]; if (!col) continue;
      let x0r = 1e9, y0r = 1e9, x1r = -1e9, y1r = -1e9; for (const p of r.poly) { x0r = Math.min(x0r, p[0]); y0r = Math.min(y0r, p[1]); x1r = Math.max(x1r, p[0]); y1r = Math.max(y1r, p[1]); }
      const cx = (x0r + x1r) / 2, cy = (y0r + y1r) / 2, rx = (x1r - x0r) * 0.62, ry = (y1r - y0r) * 0.62, m = col.match(/[\d.]+/g);
      g.save(); g.translate(cx, cy); g.scale(1, ry / rx);
      const rg = g.createRadialGradient(0, 0, 0, 0, 0, rx); rg.addColorStop(0, `rgba(${m[0]},${m[1]},${m[2]},${+m[3] * 1.5})`); rg.addColorStop(0.6, `rgba(${m[0]},${m[1]},${m[2]},${+m[3]})`); rg.addColorStop(1, `rgba(${m[0]},${m[1]},${m[2]},0)`);
      g.fillStyle = rg; g.beginPath(); g.arc(0, 0, rx, 0, Math.PI * 2); g.fill(); g.restore(); }
    g.restore();
    // 火口：外輪の暗い縁 → 内側の黒い岩 → 溶岩の湖
    const cr = a.crater; if (cr) { g.save();
      ell(g, cr.c[0], cr.c[1] + 8, cr.rx + 18, cr.ry + 14); g.fillStyle = 'rgba(0,0,0,.20)'; g.fill();
      ell(g, cr.c[0], cr.c[1], cr.rx, cr.ry); g.fillStyle = 'rgba(24,14,14,.55)'; g.fill();
      ell(g, cr.c[0], cr.c[1], cr.rx, cr.ry); g.lineWidth = 7; g.strokeStyle = 'rgba(70,44,36,.9)'; g.stroke();
      ell(g, cr.c[0], cr.c[1] - 2, cr.rx - 4, cr.ry - 4); g.lineWidth = 2; g.strokeStyle = 'rgba(255,170,110,.22)'; g.stroke(); g.restore(); }
    lava(g, D, H);
  }
  const bridgeSet = (D) => new Set(D.art.bridges || []);
  function roads(g, D, o, art, bx, H) {
    const S = art.volc || {}, br = bridgeSet(D), QA = H.qa && H.qa();
    const segs = Object.entries(D.segments), pts = segs.map(([sid, s]) => [sid, H.curvePts(s[3].map((id) => D.nodes[id]))]);
    const land = pts.filter(([sid]) => !br.has(sid)), brg = pts.filter(([sid]) => br.has(sid));
    g.lineCap = g.lineJoin = 'round';
    // 道の影（地面に落ちる）→ 道の石畳 → 両側の縁石（曲線に沿った帯）
    g.save(); g.translate(0, 3); g.strokeStyle = 'rgba(10,4,4,.34)'; g.lineWidth = ROAD_W + 2 * CURB_W + 4; for (const [, P] of land) { pathOf(g, P); g.stroke(); } g.restore();
    const rp = tp(g, H, S, 'road');
    g.strokeStyle = rp || '#4a4440'; g.lineWidth = ROAD_W + 2 * CURB_W; for (const [, P] of land) { pathOf(g, P); g.stroke(); }
    const cl = S.strip && S.strip.curbL, cr = S.strip && S.strip.curbR, sh = ROAD_W / 2 + CURB_W / 2;
    if (QA && cl && cr) for (const [, P] of land) { QA.meshStrip(g, P, cl, CURB_W, bx, -sh); QA.meshStrip(g, P, cr, CURB_W, bx, sh); }
    else { g.strokeStyle = 'rgba(30,22,20,.7)'; g.lineWidth = 1.4; for (const [, P] of land) for (const s of [-1, 1]) edge(g, P, s * (ROAD_W / 2 + CURB_W)); }
    // 溶岩の上の橋（B の運命が偶数のときの双橋）：下に深い影 → 橋の床（曲線に沿った帯）→ 左右の欄干
    for (const [, P] of brg) {
      g.save(); g.translate(0, 9); g.strokeStyle = 'rgba(20,4,0,.5)'; g.lineWidth = ROAD_W + 10; pathOf(g, P); g.stroke(); g.restore();
      if (QA && S.deckStrip) QA.meshStrip(g, P, S.deckStrip, ROAD_W + 4, bx); else { g.strokeStyle = rp || '#4a4440'; g.lineWidth = ROAD_W + 4; pathOf(g, P); g.stroke(); }
      const rl = S.strip && S.strip.railL, rr = S.strip && S.strip.railR, rs = (ROAD_W + 4) / 2 + RAIL_W / 2 - 1.5;
      if (QA && rl && rr) { QA.meshStrip(g, P, rl, RAIL_W, bx, -rs); QA.meshStrip(g, P, rr, RAIL_W, bx, rs); }
    }
    plazas(g, D, art, H);
  }
  function edge(g, P, off) { g.beginPath(); P.forEach((p, i) => { const q = P[Math.min(i + 1, P.length - 1)], r0 = P[Math.max(i - 1, 0)], dx = q[0] - r0[0], dy = q[1] - r0[1], L = Math.hypot(dx, dy) || 1, x = p[0] - dy / L * off, y = p[1] + dx / L * off; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); }
  const KEY_IDS = ['START', 'GOAL', 'RIVAL', 'Q', 'CHALLENGE', 'STATUE', 'RANDOM_DEN', 'L_CHEST', 'R_CHEST', 'L_ALTAR', 'L_LATE_ALTAR', 'REWARD5', 'R_SPECIAL'];
  /** 分かれ目・合流・行き止まりの広場（C4_ROAD_03_CENTER_BLEND＝ふちが地面へなじむ石畳の円）と、固定の出来事の地点のイベントの台座（C4_UI_01 v3_ALPHA） */
  function plazas(g, D, art, H) {
    const S = art.volc || {}, pz = S.img && S.img.plaza, eb = S.img && S.img.base, out = {}, inn = {};
    for (const e of D.edges) if (e[3] === 'forward') { out[e[0]] = (out[e[0]] || 0) + 1; inn[e[1]] = (inn[e[1]] || 0) + 1; }
    for (const [id, n] of Object.entries(D.nodes)) {
      const hub = (out[id] || 0) > 1 || (inn[id] || 0) > 1 || /dead_end/.test(n[2]);
      if (hub) { if (pz) { const s = PLAZA_D, k = pz.height / pz.width; g.drawImage(pz, n[0] - s / 2, n[1] - (s * k) / 2, s, s * k); } else { g.fillStyle = '#4a4440'; g.beginPath(); g.arc(n[0], n[1], PLAZA_D / 2.4, 0, 7); g.fill(); } }
      if (eb && KEY_IDS.includes(id) && id !== 'START' && id !== 'GOAL') { const s = BASE_D, k = eb.height / eb.width; g.drawImage(eb, n[0] - s / 2, n[1] - (s * k) / 2, s, s * k); }
    }
  }
  function apron(el, base, m) {   // 世界の外も同じ火山の地面
    Object.assign(el.style, { backgroundImage: `linear-gradient(rgba(20,10,14,.35),rgba(20,10,14,.35)),url(${U(TEX.ground[0])})`, backgroundSize: `auto,${TEX.ground[1]}px ${TEX.ground[1]}px`, backgroundPosition: `0 0,${m % TEX.ground[1]}px ${m % TEX.ground[1]}px` });
  }
  // ---- 目印（固定の地点の建物）：C4 専用の目印（C4_LM_*）は未着＝火山に合う代わりの絵（README と報告書に「画像待ち」）----
  const LM_SUB = { L_CHEST: { file: 'lm_watchpost.webp', w: 40 }, R_CHEST: { file: U('rock_cliff'), w: 54 }, R_SPECIAL: { file: U('lava_ridge'), w: 50 }, CHALLENGE: { file: U('goal_gate'), w: 40 } };   // 火の神殿の門＝C4 の門（Chapter 1 の白い蔦の門は火山に合わない）
  function lm(D) {
    return (D.art.landmarks || []).filter((L) => L.node !== 'GOAL' && L.node !== 'START' && L.node !== 'LOWER_GATE')   // 下の門も Chapter 1 の白い門＝出さない（Chapter 1 も中央の門の飾りは出さない）   // 会場は goal（C4 の門）・スタートの門は Chapter 1 の白い門＝火山に合わない（Chapter 1 も START の飾りは出さない）.map((L) => (LM_SUB[L.node] ? Object.assign({}, L, LM_SUB[L.node]) : L));
  }
  const goal = Object.freeze({ file: U('goal_gate'), w: 96, dy: 10, back: 6 });
  // ---- 景物：斜面の岩の崖・溶岩の尾根（道・溶岩・区域の芯から離す）・噴煙（噴気の棚・火口のふち）・道しるべ（自由な分かれ道）。決まった乱数＝毎回同じ ----
  const CACHE = new Map();
  function scatter(D, o, H) {
    const ck = 'v:' + (D.route || 'A'); if (CACHE.has(ck)) return CACHE.get(ck);
    const out = [], rnd = H.mulberry(4400 + (D.route || 'A').charCodeAt(0)), a = D.art;
    const lines = Object.values(D.segments).map((s) => s[3].map((id) => D.nodes[id]));
    const nearRoad = (x, y, d) => lines.some((L) => H.distLine(L, x, y) < d);
    const inLava = (x, y, pad) => lavaOf(D).some((L) => H.inPoly(L.poly, x, y) || L.poly.some((p) => Math.hypot(p[0] - x, p[1] - y) < pad));
    const cr = a.crater, inCrater = (x, y) => cr && Math.hypot((x - cr.c[0]) / (cr.rx + 30), (y - cr.c[1]) / (cr.ry + 30)) < 1;
    const taken = [];
    const free = (x, y, d) => taken.every(([px, py, pd]) => Math.hypot(px - x, py - y) > Math.max(d, pd));
    for (let i = 0; i < 900 && out.length < 34; i++) {
      const x = 30 + rnd() * 964, y = 300 + rnd() * 1200, rock = rnd() < 0.62, w = rock ? 52 + rnd() * 30 : 46 + rnd() * 22;
      if (nearRoad(x, y, w * 0.62 + 12) || inLava(x, y, 26) || inCrater(x, y) || !free(x, y, w * 0.8)) continue;
      out.push({ file: U(rock ? 'rock_cliff' : 'lava_ridge'), x: Math.round(x), y: Math.round(y), w: Math.round(w), z: -14 }); taken.push([x, y, w * 0.8]);
    }
    // 噴煙（半透明の煙・建物ではない）：噴気の棚の中・火口のふち（手前は道を隠さない所だけ）
    const fum = (a.regions || []).find((r) => r.kind === 'fumarole');
    const spots = [];
    if (fum) { const c = fum.poly.reduce((s, p) => [s[0] + p[0] / fum.poly.length, s[1] + p[1] / fum.poly.length], [0, 0]); spots.push([c[0] + 30, c[1] - 10, 70], [c[0] - 70, c[1] + 30, 54]); }
    if (cr) for (const t of [3.6, 5.2, 0.2]) spots.push([cr.c[0] + Math.cos(t) * (cr.rx - 30), cr.c[1] + Math.sin(t) * (cr.ry - 20), 90]);
    for (const [x, y, w] of spots) if (!nearRoad(x, y, 18)) out.push({ file: U('smoke_back'), x: Math.round(x), y: Math.round(y), w, z: -30, cls: 'rfv-smoke' });
    // 道しるべ：自由な分かれ道（J0・H）の脇
    for (const id of ['J0', 'H']) { const n = D.nodes[id]; if (!n) continue; const s = [[30, 0], [-30, 0], [0, 26]].find(([dx, dy]) => !nearRoad(n[0] + dx, n[1] + dy, 14)); if (s) out.push({ file: U('signpost'), x: n[0] + s[0], y: n[1] + s[1], w: 15, z: 4 }); }
    CACHE.set(ck, out); return out;
  }
  // ---- 空と光（夕暮れの START → 夜の GOAL）：盤の後ろの空（STD_C4_BG_01／02）と、地面にかける薄い色の層。モンスターの居る所の標高で切り替える ----
  function build3d(ctx) {
    const { doc, plane, D } = ctx, wrap = plane.parentNode;
    const sky = doc.createElement('div'); sky.className = 'rfv-sky'; sky.innerHTML = `<i style="background-image:url(${U('sky_dusk')})"></i><i class="n" style="background-image:url(${U('sky_night')})"></i>`;
    wrap.insertBefore(sky, wrap.firstChild);
    const tint = doc.createElement('div'); tint.className = 'rfv-tint'; wrap.insertBefore(tint, plane.nextSibling);
    css(doc); wrap.classList.add('volc');
    let ph = '', last = null;
    const ids = Object.keys(D.nodes), EL = D.art.elev || {};
    /** モンスターの居る所の高さ＝いちばん近い地点の設計の高さ（art.elev。無ければ等高線から見積もる）。4単位以上動いたときだけ探す */
    const elevNear = (x, y) => { let best = null, bd = 1e9; for (const id of ids) { const n = D.nodes[id], d = (n[0] - x) * (n[0] - x) + (n[1] - y) * (n[1] - y); if (d < bd) { bd = d; best = id; } } return best && EL[best] != null ? EL[best] : elevAt(D, x, y); };
    function mon(h, M) {
      if (!M || (last && Math.abs(last[0] - M[0]) + Math.abs(last[1] - M[1]) < 4)) return; last = [M[0], M[1]];
      const p = phaseOf(D, elevNear(M[0], M[1])); if (p === ph) return; ph = p;
      wrap.classList.toggle('twi', p === 'twi'); wrap.classList.toggle('night', p === 'night'); wrap.dataset.phase = p;
    }
    // 描き直しが起きない間（止まっている間）も、モンスターの居る所を 0.6秒ごとに見て空の色を合わせる（盤を作り直した直後・QA の移動のあとも確実に）
    const S = ctx.S; if (S) { const poll = () => { if (S.dead) return; try { if (S.mon) mon(0, S.mon); } catch (e) {} setTimeout(poll, 600); }; setTimeout(poll, 0); }   // 盤を捨てたら（S.dead）止まる
    return { occl: () => false, mon, el: null, phase: () => ph };
  }
  let cssDone = false;
  function css(doc) {
    if (cssDone || doc.getElementById('rfv-css')) return; cssDone = true;
    const s = doc.createElement('style'); s.id = 'rfv-css';
    s.textContent = `:is(#rfp,.wbv) .rfw.volc{background:#2a1a24}
:is(#rfp,.wbv) .rfv-sky{position:absolute;inset:0;z-index:0;pointer-events:none}
:is(#rfp,.wbv) .rfv-sky i{position:absolute;inset:0;background-size:cover;background-position:center top;transition:opacity 1.6s ease}
:is(#rfp,.wbv) .rfv-sky i.n{opacity:0}
:is(#rfp,.wbv) .rfw.volc.night .rfv-sky i.n{opacity:1}
:is(#rfp,.wbv) .rfw.volc .rfw-plane{z-index:1}
:is(#rfp,.wbv) .rfv-tint{position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(180deg,rgba(255,120,60,.10),rgba(255,140,80,.06));transition:background 1.6s ease}
:is(#rfp,.wbv) .rfw.volc.twi .rfv-tint{background:linear-gradient(180deg,rgba(90,50,120,.16),rgba(120,60,80,.10))}
:is(#rfp,.wbv) .rfw.volc.night .rfv-tint{background:linear-gradient(180deg,rgba(10,16,60,.30),rgba(20,20,60,.20))}
:is(#rfp,.wbv) .rfw-prop.rfv-smoke{opacity:.62;pointer-events:none}
@media (prefers-reduced-motion:reduce){:is(#rfp,.wbv) .rfv-sky i,:is(#rfp,.wbv) .rfv-tint{transition:none}}`;
    doc.head.appendChild(s);
  }
  const api = { flat: true, A4, DECK, TEX, IMG, ROAD_W, load, warm, ground, roads, plazas, apron, lm, goal, scatter, build3d, elevAt, phaseOf, deckStrip };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.MMRF_VOLC = api;
})(typeof window !== 'undefined' ? window : globalThis);
