// =========================================================
// Chapter 2「潮風の海岸」A／B／C — 海の世界ボードの描画 `MMRF_SEA`
//
//  js/proto/roadfirst-world.js（MMRF_WORLD）が、道のデータが art.sea3d を持つとき（js/proto/ch2-routes.js の MMRF_CH2）だけ呼ぶ。Chapter 1 では何もしない。
//  2.5D の作り（2026-10-15 論点 3）：海面の板（区画の canvas・高さ 0）／盆地の上の海面（別の板）／海底の板（高さ −depth）／盆地の壁・斜路・塔（CSS 3D の板）／
//    マス・モンスター・景物は立てて置く（MMRF_WORLD.project が高さを含めて写す＝斜路の上ではマスもモンスターも上がる）
//  2026-10-16 正式美術（ユーザー納品 68点のうち届いた 60点・assets/fields/ch2/art_1016/・tools/ch2art1016/derive.py）：
//    地面＝外海 open_sea_water・浅瀬 shallow_turquoise_water・白砂 coastal_sand_base・草地 G02b・港町と会場の島 coastal_white_stone_road、
//    海上の道＝海上橋の石板 sea_bridge_deck（陸の上は白石の道）、波打ち際 E03、海底＝undersea_sand_base・海底のふち E04、
//    ガラス回廊＝床 glass_corridor_floor＋天井 U01、遺跡の通路 sunken_temple_road、遺跡の広場 U08（base／cracked_a／cracked_b）、
//    斜路＝白い橋帯 R01＋側壁 R07、盆地の壁 R08、螺旋塔＝壁 R05・扉・灯、海中の光 FX04、景物と目印（lm）・大会会場 ocean_arena（goal）。
//    読めない絵は従来の仮の塗り・Chapter 1 の代用へ戻す（ゲームは止めない）。地点・道・高さは変えない
// =========================================================
(function (root) {
  'use strict';
  const FILES = { water: 'ground_water.webp', shore: 'edge_shore.webp', rock: 'edge_rock.webp' };   // 正式素材が読めないときの代用（Chapter 1 の素材）
  const TOWN_TEX = './assets/fields/ch1a/board_hq_1014/road_r1.webp', STONE_TEX = './assets/fields/ch1a/board_hq_1014/road_r2.webp';
  const A2 = './assets/fields/ch2/art_1016/', U = (n) => (/^\.\//.test(n) ? n : A2 + n + '.webp');   // './' で始まる名前はそのままの場所（2026-10-19 正面向きの港の門＝art_1019）
  // 正式素材（名前＝納品の名前のまま。tile＝くり返し1枚の大きさ（世界の単位））
  const TEX = { sea: ['open_sea_water', 110], shallow: ['shallow_turquoise_water', 96], sand: ['coastal_sand_base', 72], grass: ['G02b_coastal_grass_tile', 96],
    white: ['coastal_white_stone_road', 56], deck: ['sea_bridge_deck', 72], seabed: ['undersea_sand_base', 96], glass: ['glass_corridor_floor', 38],
    temple: ['sunken_temple_road', 40], ruins: ['sunken_ruins_ground', 84] };
  const STRIPS = { walk: 'R01_white_bridge_walkstrip', foam: 'E03_shore_foam_edge_tile', rim: 'E04_seabed_cliff_edge_tile', roof: 'U01_glass_corridor_roof_strip', railL: 'sea_bridge_railing_left', railR: 'sea_bridge_railing_right' };
  const PLAZA = ['U08_ruins_plaza_base', 'U08_ruins_plaza_cracked_a', 'U08_ruins_plaza_cracked_b'];
  const WALL = { tower: U('R05_spiral_tower_wall_tile'), ramp: U('R07_ramp_sidewall_tile'), basin: U('R08_seabed_basin_wall_tile') };
  const FX = U('FX04_underwater_light_screen_strip');
  // 2026-10-16 Part04A／04B の再送で届いた8点：海上橋の欄干（左右）・海中の泡（光の層）・分かれ目の塔・島／海底のふちの崖・珊瑚の浅瀬
  // 2026-10-19 P0：海上橋の欄干（STRIPS の railL／railR）は描かない（roads の注記）
  const BUB = U('undersea_bubble_light_fx');
  const ROAD_W = 22, CURB_W = 27, GLASS_W = 30;
  const W_TILE = 96, SEA_TINT = 'rgba(18,86,138,.42)';
  const BASIN_ALPHA = 0.62, BASIN_UNDER = 0.86;   // 盆地の上の海面の濃さ（海面にいるとき）・海底に潜ったときに消す割合（大きいほど海底がよく見える）
  const imgP = (src) => new Promise((res) => { const im = new root.Image(); im.decoding = 'async'; im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  function load(loadFn, base) {   // 正式素材と代用（読めなければ null＝仮の色・代用で描く）
    const keys = Object.keys(FILES), tk = Object.keys(TEX), sk = Object.keys(STRIPS);
    return Promise.all([...keys.map((k) => loadFn(FILES[k])), imgP(TOWN_TEX), ...tk.map((k) => imgP(U(TEX[k][0]))), ...sk.map((k) => imgP(U(STRIPS[k]))), ...PLAZA.map((n) => imgP(U(n)))]).then((a) => {
      const o = { tex: {}, strip: {}, plaza: [] }; let i = 0;
      keys.forEach((k) => { o[k] = a[i++]; }); o.town = a[i++];
      tk.forEach((k) => { o.tex[k] = a[i++]; }); sk.forEach((k) => { o.strip[k] = a[i++]; }); PLAZA.forEach(() => { o.plaza.push(a[i++]); });
      // 2026-10-17 QA（道路画質・?qaRoadArt=raw|fix のときだけ）：外海・海上橋の石板・白い石畳・白い橋帯 R01・欄干は新しい素材（js/qa/road-art-1017.js）。読めなければ上の絵のまま
      // 2026-10-18 v2（ユーザー指示「Chapter 2 の正式が旧道路を指さない」）：既定（URL なし）でも新しい素材（MMQRA.mode＝fix）。?qaRoadArt=old で従来の絵（比較用）
      const QRA = root.MMQRA && root.MMQRA.mode ? root.MMQRA : null;
      if (QRA) return Promise.all([...Object.entries(QRA.CH2.tex).map(([k, n]) => QRA.load(n).then((im) => { if (im) o.tex[k] = im; })),
        ...Object.entries(QRA.CH2.strip).map(([k, n]) => QRA.load(n).then((im) => { if (im) o.strip[k] = im; }))]).then(() => { o.formal = Object.values(o.tex).filter(Boolean).length; return o; });
      o.formal = Object.values(o.tex).filter(Boolean).length;   // 読めた正式の地面の数（確認用）
      return o;
    });
  }
  /** 出発の前に読み始めておく（ブラウザの取り置き）。1回だけ */
  let warmed = null;
  function warm() { if (warmed || !root.Image) return warmed; const fs = [...Object.values(TEX).map((t) => U(t[0])), ...Object.values(STRIPS).map(U), ...PLAZA.map(U), ...Object.values(WALL), FX, BUB, ...ALL_LM.map(U)];
    warmed = fs.map((u) => { const im = new root.Image(); im.decoding = 'async'; im.src = u; return im; }); return warmed; }
  const tp = (g, H, S, k) => (S && S.tex && S.tex[k] ? H.pattern(g, S.tex[k], TEX[k][1]) : null);
  const zoneOf = (D, sid) => (D.art.zoneOf || {})[sid] || 'surface_early';
  const isSurface = (z) => z === 'surface_early' || z === 'surface_late';
  const polyPath = (g, P) => { g.beginPath(); P.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); };
  /** 多角形のふちを自然な形に（決まった揺らぎ・角を少し丸める）。1回だけ計算 */
  const SOFT = new WeakMap();
  function soft(poly, amp, seed) {
    if (SOFT.has(poly)) return SOFT.get(poly);
    const out = [], n = poly.length; let u = 0, h = 0; for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) % 997;
    for (let i = 0; i < n; i++) {
      const a = poly[i], b = poly[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(2, Math.round(L / 6)), nx = -(b[1] - a[1]) / (L || 1), ny = (b[0] - a[0]) / (L || 1);
      for (let j = 0; j < k; j++) { const t = j / k, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t;
        const w = amp * (0.55 * Math.sin(u / 21 + h) + 0.3 * Math.sin(u / 8.3 + h * 1.7) + 0.15 * Math.sin(u / 3.9 + h * 0.3)); out.push([x + nx * w, y + ny * w]); u += L / k; }
    }
    // 角を丸める（3点の平均を2回）
    let p = out; for (let it = 0; it < 2; it++) p = p.map((q, i) => { const A = p[(i - 1 + p.length) % p.length], C = p[(i + 1) % p.length]; return [(A[0] + 2 * q[0] + C[0]) / 4, (A[1] + 2 * q[1] + C[1]) / 4]; });
    SOFT.set(poly, p); return p;
  }
  const GROW = new WeakMap();
  /** 多角形を外へ d 単位広げる（頂点ごとに両隣の辺の外向きの法線の平均の向きへ）。1回だけ計算 */
  function grow(P, d) {
    let m = GROW.get(P); if (!m) { m = {}; GROW.set(P, m); } if (m[d]) return m[d];
    const n = P.length, sg = signedArea(P) > 0 ? 1 : -1, out = [];
    for (let i = 0; i < n; i++) { const a = P[(i - 1 + n) % n], b = P[i], c = P[(i + 1) % n];
      const n1 = norm(b[0] - a[0], b[1] - a[1]), n2 = norm(c[0] - b[0], c[1] - b[1]), nx = (n1[1] + n2[1]) * sg, ny = -(n1[0] + n2[0]) * sg, L = Math.hypot(nx, ny) || 1;
      out.push([b[0] + (nx / L) * d, b[1] + (ny / L) * d]); }
    m[d] = out; return out;
  }
  const norm = (x, y) => { const L = Math.hypot(x, y) || 1; return [x / L, y / L]; };
  const signedArea = (P) => { let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; };
  const basinOf = (D) => soft(D.art.basin, 7, 'basin');
  const regionsOf = (D) => D.art.regions.map((r) => ({ r, P: soft(r.poly, r.kind === 'arena' ? 3 : 8, r.id) }));
  function pat(g, H, im, tile) { return im ? H.pattern(g, im, tile) : null; }

  const landRegs = (D) => regionsOf(D);
  const onLand = (D, H, x, y) => landRegs(D).some((q) => H.inPoly(q.P, x, y));
  /** 2026-10-16：海底の道のうちガラス回廊（運命の分かれ道の左右・B の回廊）。ほかの海底の道は遺跡の通路 */
  const isGlass = (D, sid) => /^(Q_|QL_|QR_)/.test(sid) || (D.route === 'B' && /^U0[34]/.test(sid));
  const pathOf = (g, P) => { g.beginPath(); P.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); };

  // ---- 海面の板（区画ごと） ----
  function ground(g, D, bx, art, H) {
    const S = art.sea || {}, [x0, y0, w, h] = bx;
    // 外海（正式：open_sea_water）。読めなければ代用の浅瀬の絵＋深い青
    const sp = tp(g, H, S, 'sea');
    if (sp) { g.fillStyle = sp; g.fillRect(x0, y0, w, h);
      // くり返しの明暗が縞に見えないよう、同じ絵を向きと大きさを変えてもう1枚薄く重ねる（絵は変えない）
      const im = S.tex.sea, p2 = g.createPattern(im, 'repeat'); if (p2 && p2.setTransform && root.DOMMatrix) { p2.setTransform(new root.DOMMatrix().rotate(37).scale((TEX.sea[1] * 1.73) / im.width)); g.save(); g.globalAlpha = 0.5; g.fillStyle = p2; g.fillRect(x0, y0, w, h); g.restore(); } }
    else { g.fillStyle = pat(g, H, S.water, W_TILE) || '#2d8fc4'; g.fillRect(x0, y0, w, h); g.fillStyle = SEA_TINT; g.fillRect(x0, y0, w, h); }
    // 陸のまわりの浅瀬（正式：shallow_turquoise_water）＝島の外側へ広がる帯（外ほど薄く）
    const sh = tp(g, H, S, 'shallow');
    if (sh) { g.save(); g.lineJoin = 'round'; g.strokeStyle = sh;   // 外へ向けてなめらかに薄く（太い順に少しずつ重ねる＝帯の境目の線を出さない）
      // 太い線で描くと、線が区画にかかっていても多角形そのものが区画の外にあると描かれない（区画の境目で浅瀬が切れていた）＝外へ広げた多角形を塗る
      g.fillStyle = sh; for (let k = 0; k < 14; k++) { g.globalAlpha = 0.14; const d = 65 - k * 3.5; for (const { P } of regionsOf(D)) { polyPath(g, grow(P, d)); g.fill(); } } g.restore(); }
    // 世界の端（外は同じ外海の背景 apron）へ向けて浅瀬を外海へなめらかに戻す（端で色が切れて直線に見えないように）
    if (sh && sp) { g.save(); g.fillStyle = sp; const E = 90, Wd = 1024, Ht = 1536;
      for (let k = 0; k < 9; k++) { const d = (E * (9 - k)) / 9; g.globalAlpha = 0.2;
        g.fillRect(-20, -20, Wd + 40, d + 20); g.fillRect(-20, Ht - d, Wd + 40, d + 20); g.fillRect(-20, -20, d + 20, Ht + 40); g.fillRect(Wd - d, -20, d + 20, Ht + 40); }
      g.restore(); }
    // 盆地の上は穴をあける（盆地の上の海面は別の板＝build3d の rfs-water。モンスターが海底にいる間は薄くなる＝潜った見え方）
    const B = basinOf(D);
    g.save(); polyPath(g, B); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.fill(); g.restore();
    // 陸（島・港町・会場の島）：白砂＋内側に草地（港町・会場の島は白石の敷石）＋波打ち際の帯
    const sand = tp(g, H, S, 'sand'), grass = tp(g, H, S, 'grass'), white = tp(g, H, S, 'white');
    for (const { r, P } of regionsOf(D)) {
      g.save(); polyPath(g, P); g.clip();
      const paved = r.kind === 'arena';   // 港町は白砂の地面（家並み L01 と白石の道で町に見せる）・会場の島は白石の敷石
      if (sand || white) {
        g.fillStyle = (paved ? white : sand) || sand || white; g.fillRect(x0, y0, w, h);
        if (!paved && grass && r.id !== 'town') {   // 草地は島の内側だけ（ふちは白砂の浜）。港町は白砂（家並み L01 と白石の道）
          g.save(); g.globalCompositeOperation = 'source-atop'; g.lineJoin = 'round';
          g.fillStyle = grass; polyPath(g, P); g.fill();
          g.globalCompositeOperation = 'source-atop'; g.strokeStyle = sand; g.lineWidth = 30; polyPath(g, P); g.stroke(); g.restore();
        }
        if (paved && sand) { g.strokeStyle = sand; g.lineWidth = 18; polyPath(g, P); g.stroke(); }
      } else {
        const tq = paved ? pat(g, H, S.town, 57.5) : pat(g, H, art.ground, H.ART.ground.tile);
        g.fillStyle = tq || (r.kind === 'arena' ? '#e9dfba' : '#8fbf5a'); g.fillRect(x0, y0, w, h);
      }
      g.restore();
      const Q = signedArea(P) > 0 ? P.slice().reverse() : P.slice(); Q.push(Q[0]);
      const foam = S.strip && S.strip.foam;
      if (foam) H.stripAlong(g, Q, foam, 14, bx, 2);   // E03：波打ち際（白い泡が海の側）
      else if (S.shore) H.stripAlong(g, Q, S.shore, 16, bx, 4);
      else { g.save(); polyPath(g, P); g.strokeStyle = '#e8dcb0'; g.lineWidth = 5; g.stroke(); g.restore(); }
    }
  }
  /** 海面の道（桟橋・橋・島の道）：海の上＝海上橋の石板（sea_bridge_deck）・陸の上＝白石の道。下に影（橋に見せる）。海底・斜路の区間は描かない */
  function roads(g, D, o, art, bx, H) {
    const S = art.sea || {};
    // 2026-10-20：区間のつなぎ目（分かれ目でない地点）では切らずに1本の道として描く（H.roadChains）
    const segs = H.roadChains(D, Object.entries(D.segments).filter(([sid]) => isSurface(zoneOf(D, sid)))).map((c) => [c.sids[0], [c.ids[0], c.ids[c.ids.length - 1], '', c.ids]]);
    const pts = segs.map(([, s]) => H.roadPts(D, s[3], 16));   // 曲がりの半径 16 未満は丸める（帯の見える幅の半分 12.3）
    const deck = tp(g, H, S, 'deck'), white = tp(g, H, S, 'white');
    g.lineCap = g.lineJoin = 'round';
    // 2026-10-19 P0（iPhone 試遊「影が別方向・異常に長い」）：道の影は世界の南へ 7 単位ずらしていた＝カメラが回ると道からはみ出す長い帯に見えた → 道のすぐ下に細く（1.5 単位・少し薄く）
    //  影の端は平ら（butt）＝道の帯は端で平らに終わる。丸い端は道の終わり（START など）の先へ半円の影がはみ出していた
    g.save(); g.translate(0, 1.5); g.lineCap = 'butt'; g.strokeStyle = 'rgba(6,30,52,.30)'; g.lineWidth = CURB_W + 2;
    for (const P of pts) { pathOf(g, P); g.stroke(); }
    g.restore();
    // 2026-10-18 v2（iPhone 本編試遊・修正3）：白い橋帯 R01（縁石つきの帯）を陸の道にも敷く＝Chapter 2 の正式素材の縁石で道がつながる（旧：平たい灰色の縁石の線＋白い石畳の塗り）。
    //  分かれ目・合流・行き止まりは R01 の縁石を円に沿って並べた広場（plazaR01）。R01 が読めない・?qaRoad=1 のときは従来の描き方
    const QA0 = art.qaRoad && H.qa && H.qa(), R01 = QA0 && art.qaRoad === '2' && S.strip && S.strip.walk ? S.strip.walk : null;
    if (deck) {
      if (R01) { roadsR01(g, D, segs, pts, R01, white || deck, H, bx, QA0); return; }
      else {
      g.strokeStyle = 'rgb(168,160,140)'; g.lineWidth = CURB_W; for (const P of pts) { pathOf(g, P); g.stroke(); }   // 縁石
      // 2026-10-16 QA（A。URL の ?qaRoad=1|2 のときだけ）：1＝海上橋の石板を鏡映しで並べる（継ぎ目が消える・模様は山形）／2＝正式の白い橋帯 R01 を道に沿わせて敷く（2026-10-17：?qaRoadArt の新しい石板は継ぎ目が小さい＝鏡映しにしない）
      const QA = art.qaRoad && H.qa && H.qa(), walk = S.strip && S.strip.walk;
      if (QA && art.qaRoad === '2' && walk) for (const P of pts) QA.meshStrip(g, P, walk, ROAD_W * 128 / 62, bx);   // R01 の帯の見える所（行 33〜94＝62px）を道の幅 ROAD_W に
      else if (QA && art.qaRoad === '1' && !(S.tex.deck && S.tex.deck._qra)) { const mt = QA.mirrorTile(S.tex.deck), mp = mt ? H.pattern(g, mt, TEX.deck[1] * 2) : null; g.strokeStyle = mp || deck; g.lineWidth = ROAD_W; for (const P of pts) { pathOf(g, P); g.stroke(); } }
      else { g.strokeStyle = deck; g.lineWidth = ROAD_W; for (const P of pts) { pathOf(g, P); g.stroke(); } }
      if (white) { g.save(); g.beginPath(); for (const { P } of regionsOf(D)) { P.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); } g.clip();
        g.strokeStyle = white; g.lineWidth = ROAD_W; for (const P of pts) { pathOf(g, P); g.stroke(); } g.restore(); }
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; for (const P of pts) for (const sg of [-1, 1]) edgeLine(g, P, ROAD_W / 2 * sg);   // 縁の光
      }
      // 2026-10-19 P0（iPhone 試遊「道の横にゴミみたいなものが並ぶ」）：海上橋の欄干（sea_bridge_railing_left／right）は描かない。
      //  海面に平たい帯として描いていたため、道から離れた水の上に小さな杭が並んで見えた（橋につながった欄干に見えない）。素材の読み込みは残す
    } else if (art.strip) for (const P of pts) H.stripAlong(g, P, art.strip, H.ART.strip.w, bx);
    else { g.strokeStyle = '#d9cfb0'; g.lineWidth = 18; for (const P of pts) { pathOf(g, P); g.stroke(); } }
    hubs(g, D, (sid) => isSurface(zoneOf(D, sid)), art, H, (n) => (onLand(D, H, n[0], n[1]) ? white || deck : deck));
  }
  /** 2026-10-18 v2：R01 の縁石の段（行 130〜176 / 522＝帯の外側のふち）を円に沿って並べた広場。中は白い石畳（無ければ橋床）・道の入口は縁石を切る */
  const R01_KERB = [128, 174], R01_IN = [174, 348], R01_VIS = [118, 404];   // 縁石の段（青いモザイク＋金の線）・中の白い石の段（行・522px の fix）
  const R01_TILE = new WeakMap();
  /** 広場の中の床：R01 の中の白い石の段を縦に積んだ模様（段の間に細い目地）。道の床と同じ石・同じ細かさ */
  function r01Floor(strip) { if (R01_TILE.has(strip)) return R01_TILE.get(strip); let c = null;
    try { const h = R01_IN[1] - R01_IN[0]; c = root.document.createElement('canvas'); c.width = strip.width; c.height = h + 2; const x = c.getContext('2d');
      x.drawImage(strip, 0, R01_IN[0], strip.width, h, 0, 0, strip.width, h); x.fillStyle = 'rgb(178,174,160)'; x.fillRect(0, h, strip.width, 2); } catch (e) { c = null; }
    R01_TILE.set(strip, c); return c; }
  /** 2026-10-20（IMG_5997〜6004）：R01 の道と広場を「縁石 → 床」の2回に分けて描く。
   *  1回目＝全部の道の帯（縁石つき）と広場の縁石の輪、2回目＝全部の道の床と広場の床。重なった道・広場の内側の縁石は床が覆う＝外のふちだけに縁石が残る
   *  （狭い角度で集まる道も、広場を大きくせずに1つの舗装につながる。旧：広場の半径を最大 44 まで広げて、広場の中に隣のマスが並んでいた）。
   *  広場の縁石の輪は、縁石の段だけの帯を円に沿って1本の網で貼る（旧：2.2 単位の切れ端を回して並べていた＝細い切れ目が櫛の歯のように見えた） */
  const R01_CROP = new WeakMap();
  function r01Crop(strip, rows) { let m = R01_CROP.get(strip); if (!m) { m = {}; R01_CROP.set(strip, m); } const k = rows.join(':'); if (k in m) return m[k];
    let c = null; try { const f = strip.height / 522, y0 = Math.round(rows[0] * f), y1 = Math.round(rows[1] * f); c = root.document.createElement('canvas'); c.width = strip.width; c.height = Math.max(1, y1 - y0);
      c.getContext('2d').drawImage(strip, 0, y0, strip.width, y1 - y0, 0, 0, strip.width, y1 - y0); c._rows = [y0 / f, y1 / f]; } catch (e) { c = null; }
    m[k] = c; return c; }
  function plazaList(D, segs, H) {
    if (PLAZA_CACHE.has(D)) return PLAZA_CACHE.get(D);
    const dirs = {}, put = (id, a, b) => { (dirs[id] = dirs[id] || []).push(Math.atan2(b[1] - a[1], b[0] - a[0])); };
    for (const [, sg] of segs) { const ids = sg[3]; if (!ids || ids.length < 2) continue; const P = H.curvePts(ids.map((id) => D.nodes[id])), at = (k) => P[Math.min(P.length - 1, Math.max(0, k))];
      put(ids[0], P[0], at(3)); put(ids[ids.length - 1], P[P.length - 1], at(P.length - 4)); }
    const out = {}, inn = {}; for (const e of D.edges) if (e[3] === 'forward') { out[e[0]] = (out[e[0]] || 0) + 1; inn[e[1]] = (inn[e[1]] || 0) + 1; }
    const PL = [];
    for (const id of Object.keys(dirs)) {
      const n = D.nodes[id], dead = /dead_end/.test(n[2]), start = n[2] === 'start'; if (!((out[id] || 0) > 1 || (inn[id] || 0) > 1 || dead || start)) continue;
      // 半径＝縁石の外のふちまで 27 単位（道の縁石の幅と同じ＝60° 離れた道どうしの間にも縁石の輪が残る）・行き止まりは 0.78 倍。
      //  中は中心の1マスだけ＝隣のマスは道の上（tools/ch2/build_ch2_routes.py の CLEAR＝中心から 38 単位）
      PL.push({ id, x: n[0], y: n[1], r: dead ? ROAD_W * 0.78 : PLAZA_R });
    }
    PLAZA_CACHE.set(D, PL); return PL;
  }
  const PLAZA_CACHE = new WeakMap(), PLAZA_R = 27;
  function roadsR01(g, D, segs, pts, strip, fill, H, bx, QA) {
    const full = ROAD_W * 128 / 62, ppu = strip.height / full, PL = plazaList(D, segs, H);
    const kerb = r01Crop(strip, R01_KERB), floor = r01Crop(strip, R01_IN), th = (R01_KERB[1] - R01_KERB[0]) * strip.height / 522 / ppu;
    const wF = floor ? floor.height / ppu : 0;
    const vis = (P) => !(bx && (P.x + P.r + 6 < bx[0] || P.x - P.r - 6 > bx[0] + bx[2] || P.y + P.r + 6 < bx[1] || P.y - P.r - 6 > bx[1] + bx[3]));
    for (const P of PL) {   // 広場の外の薄い影（道の帯より先＝道の上に影の輪が出ない）
      if (!vis(P)) continue; const { x, y, r } = P;
      const sh = g.createRadialGradient(x, y, r - 1, x, y, r + 4.5); sh.addColorStop(0, 'rgba(20,34,44,.32)'); sh.addColorStop(1, 'rgba(20,34,44,0)');
      g.fillStyle = sh; g.beginPath(); g.arc(x, y, r + 4.5, 0, 7); g.fill();
    }
    // 1回目：道の帯（縁石つき）。帯の絵の透明な上下（行 0〜118・404〜522）は切る＝曲がりの内側で帯の幅の半分が曲がりの半径を超えて折り返さない
    const vis0 = r01Crop(strip, R01_VIS), wV = vis0 ? vis0.height / ppu : full;
    for (const P of pts) QA.meshStrip(g, P, vis0 || strip, wV, bx);
    if (floor) for (const P of pts) QA.meshStrip(g, P, floor, wF, bx);   // 2回目：道の床（重なった道の縁石を覆う）
    // 2026-10-20 第3便（iPhone 試遊「丸の道は全て縁そのままに」）：広場の縁石の輪は道の床の後に描く＝道が入ってくる所も切らない 360° の輪（旧：道の床が入口の縁石を覆っていた）
    if (kerb) for (const P of PL) {   // 広場の縁石の輪（外のふちが円の外周＝道の縁石の外のふちと同じ位置）
      if (!vis(P)) continue; const rm = P.r - th / 2, N = Math.max(24, Math.ceil(Math.PI * 2 * rm / 1.5)), ring = [];
      for (let i = 0; i <= N + 2; i++) { const a = (i / N) * Math.PI * 2; ring.push([P.x + Math.cos(a) * rm, P.y + Math.sin(a) * rm]); }
      QA.meshStrip(g, ring, kerb, th, bx);
    }
    const fl = r01Floor(strip), fp = fl ? g.createPattern(fl, 'repeat') : null, IW = floor ? floor.width : 0;
    if (fp && fp.setTransform && root.DOMMatrix) fp.setTransform(new root.DOMMatrix().scale(1 / ppu));
    // 2026-10-20 道路美術 P0（IMG_6006「奥の道と手前の広場が同じ道路に見えない」）：広場の床の模様は世界の縦横に固定だった＝道の床と石の向きが直角にずれ、入口に円弧の継ぎ目が出ていた。
    //  広場から出る道（無ければ入る道）の床と、模様の向き・始まりの位置（meshStrip と同じ測り方の道のりの位置）をそろえる＝その道の入口では目地がそのままつながる
    const plen = (P) => { let acc = 0, L = 0, prev = P[0]; for (let i = 1; i < P.length; i++) { acc += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); if (acc >= 2 || i === P.length - 1) { L += Math.hypot(P[i][0] - prev[0], P[i][1] - prev[1]); prev = P[i]; acc = 0; } } return L; };
    const align = (P) => {
      if (!fp || !fp.setTransform || !root.DOMMatrix || !floor) return;
      let k = segs.findIndex(([, sg]) => sg[3][0] === P.id), end = false; if (k < 0) { k = segs.findIndex(([, sg]) => sg[3][sg[3].length - 1] === P.id); end = k >= 0; }
      const Q = k >= 0 ? pts[k] : null; if (!Q || Q.length < 2) { fp.setTransform(new root.DOMMatrix().scale(1 / ppu)); return; }
      const a = end ? Q[Math.max(0, Q.length - 4)] : Q[0], b = end ? Q[Q.length - 1] : Q[Math.min(3, Q.length - 1)], th0 = Math.atan2(b[1] - a[1], b[0] - a[0]);
      const u = end ? (plen(Q) * ppu) % IW : 0, o = end ? Q[Q.length - 1] : Q[0];
      fp.setTransform(new root.DOMMatrix().translate(o[0], o[1]).rotate(th0 * 180 / Math.PI).translate(-u / ppu, -wF / 2).scale(1 / ppu));
    };
    for (const P of PL) {   // 広場の床（道の床より上＝中心の1マスのまわりは広場の石畳）
      if (!vis(P)) continue; const { x, y, r } = P; align(P);
      g.fillStyle = fp || fill || '#e6e1d4'; g.beginPath(); g.arc(x, y, r - th, 0, 7); g.fill();
      //  2026-10-20 道路美術 P0：床のふちを暗くする放射の陰はやめた（道の入口で道の床との境に円弧の継ぎ目が見え、広場の中心が白く浮いて見えた）
    }
  }
  function edgeLine(g, P, off) { g.beginPath(); P.forEach((p, i) => { const q = P[Math.min(i + 1, P.length - 1)], r0 = P[Math.max(i - 1, 0)], dx = q[0] - r0[0], dy = q[1] - r0[1], L = Math.hypot(dx, dy) || 1, x = p[0] - dy / L * off, y = p[1] + dx / L * off; i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); }
  /** 分かれ目・合流・行き止まりの敷石の円（その板の区間だけ）。fillOf(n)＝塗り（正式の模様）。無ければ従来の敷石 */
  function hubs(g, D, keep, art, H, fillOf) {
    const out = {}, inn = {}, mine = new Set();
    for (const e of D.edges) { if (!keep(e[2])) continue; mine.add(e[0]); mine.add(e[1]); if (e[3] === 'forward') { out[e[0]] = (out[e[0]] || 0) + 1; inn[e[1]] = (inn[e[1]] || 0) + 1; } }
    const ids = [...mine].filter((id) => (out[id] || 0) > 1 || (inn[id] || 0) > 1 || /dead_end/.test(D.nodes[id][2]));
    const rp = art.road ? H.pattern(g, art.road, 57.5) : null, r = (fillOf ? CURB_W : H.ART.strip.w) * 0.62;
    for (const id of ids) { const n = D.nodes[id]; g.fillStyle = fillOf ? 'rgb(168,160,140)' : '#8f8573'; g.beginPath(); g.arc(n[0], n[1], r + 1.5, 0, 7); g.fill(); g.fillStyle = (fillOf && fillOf(n)) || rp || '#d9cfb0'; g.beginPath(); g.arc(n[0], n[1], r - 1, 0, 7); g.fill(); }
  }
  function apron(el, base, m) {   // 世界の外の海。世界の中は区画の canvas が描く（重ねると盆地の上の透ける所から海底が見えなくなる＝世界の範囲は切り抜く）
    el.style.backgroundImage = `url(${U(TEX.sea[0])}),linear-gradient(${SEA_TINT},${SEA_TINT}),url(${base}${FILES.water})`; el.style.backgroundSize = `${TEX.sea[1]}px ${TEX.sea[1]}px,auto,${W_TILE}px ${W_TILE}px`;
    el.style.backgroundPosition = `${m % TEX.sea[1]}px ${m % TEX.sea[1]}px,0 0,0 0`;
    const W = 1024, H = 1536, a = m + 2, b = m - 2;
    el.style.clipPath = `polygon(evenodd,0 0,100% 0,100% 100%,0 100%,0 0,${a}px ${a}px,${a}px ${b + H}px,${b + W}px ${b + H}px,${b + W}px ${a}px,${a}px ${a}px)`;
  }

  // ---- 目印（決まった地点の建物・門）と大会会場：2026-10-16 正式美術。意味（設計の standin）に合う絵をルートごとに。地点・道・判定は変えない ----
  //  along＝その地点へ入ってくる向きにずらす（行き止まりは奥へ）・z＝前後（負＝モンスターより奥）・open＝隠れ家が開いている回の絵
  //  2026-10-19 P0（iPhone 試遊・ユーザー判断「道の上のまま大きさを直す」「角度をつけず道に対して正面に」）：START の港の門は正面向きの派生
  //   （正式の harbor_start_gate の左半分＝左の柱とアーチの半分を、アーチの中心で左右に折り返した絵。色は変えない・右の小屋は無い＝art_1019/harbor_start_gate_front）。
  //   アーチの口（絵の幅の 41%・中央）が道幅 22 より少し広い 24 単位になる幅 58。階段が START のマスにかからないよう 14 単位先。side＝6番目（進む向きの右へ）
  //  2026-10-20（IMG_6003「狭い切り貼りの門・柱と植え込みと階段が道をふさぐ」）：植え込みと階段（絵の行 376 から下）を切った派生 art_1020/harbor_start_gate_open（柱は地面から立つ・色は変えない。盤の景物の足もと＝絵の幅の 92% の高さ＝上に透明の余白 64px）。
  //   アーチの口が縁石の外のふち（27 単位）より広い 29.5 単位になる幅 72・START の広場の出口（27 単位先）。向きは START から本線の最初のマス S01_01（7番目）＝ルート C のように
  //   START が分かれ道でも、本線（港の大通り）の上に門。探索路（岸壁）は門をくぐらない。
  //   前後（z＝8番目）は 0＝門の地面の位置で決める（旧 −30＝いつもマスより奥＝門の先のマスが柱の手前に重なり、柱が宙に浮いて見えた）
  //  2026-10-20 追加指示（「切り貼り感・狭さ」）：柱の下端が植え込みを切った所で水平に切れていて、足もとが地面から浮いて見えた＝柱の足もとにやわらかい接地の影を足した派生
  //   art_1020/harbor_start_gate_open_foot（門の画素は同じ・絵の下へ透明の余白 44px と影だけ足す＝足もとの位置 0.92 は同じ）。左右対称の折り返しの絵であることは変わらない＝正式な正面向きの全体の絵が要る（docs/fullplay_1020/REPORT.md）
  //  2026-10-20 第3便（ユーザー指示「門や看板は斜めに置くのではなく正面・正対するように」）：START の門は道をまたいで正面を向く形に戻す＝正面向きの絵は派生（art_1020/harbor_start_gate_open_foot）しか無い。
  //   正面向き・左右対称の正式の全体の絵（docs/design_requests_1020/D03）が届いたら差し替える。以下は道路美術 P0 の旧記録：
  //  2026-10-20 道路美術 P0（IMG_6006「門が切り貼りのよう・柱の足もとが不自然」・指示「左右反転合成や切り欠きの目立つ派生は正式合格ではない・正式門の原画は描き換えない」）：
  //   折り返しの派生（art_1019・art_1020）は使わない（ファイルは残す）。正式の原画 harbor_start_gate（斜め向き・右に小屋）をそのまま、START の広場の左脇（道の外）に置く。
  //   道をまたぐ門は、正面向き・左右対称の全体の原画が届いてから（docs/fullplay_1020/REPORT_ROADART.md の必要素材）。A／B／C とも同じ（C の S01_02 の門は外した）
  const JT = 'sea_junction_tower', EDGE_PROPS = ['coral_shoal_edge', 'white_coastal_cliff_edge', 'undersea_cliff_edge'];
  const LM_BASE = {
    START: ['./assets/fields/ch2/art_1020/harbor_start_gate_open_foot.webp', 72, 27, null, null, 0, 'S01_01', 0], LOWER_GATE: ['undersea_descent_gate', 40, 6], RIVAL: ['rival_pass_gate', 34, 10], Q: ['glass_corridor_arch', 50, 4],
    STATUE: ['L07_winged_sea_god_statue', 30, 0, [-34, -20]], RANDOM_DEN: ['L11_sunken_ship_den_closed', 44, 20, null, 'L11_sunken_ship_den_open'],
    REWARD5: ['coastal_rock_shells', 40, 20], R_SPECIAL: ['L10_coral_treasure_landmark', 34, 20],
  };
  const LM_ROUTE = {
    A: { CHALLENGE: ['L09_western_sealed_sea_gate', 48, 14], L_CHEST: ['coastal_lighthouse', 30, 20], R_CHEST: ['L04_shell_shrine', 32, 20], L_ALTAR: ['L05_temple_island_altar', 50, 20], L_LATE_ALTAR: ['L08_western_white_tower', 34, 20], UPPER_GATE: ['undersea_ascent_gate', 36, 4] },
    B: { CHALLENGE: ['U03_sunken_temple_gate', 38, 14], L_CHEST: ['coastal_lighthouse', 30, 20], R_CHEST: ['L05_temple_island_altar', 50, 20], L_ALTAR: ['L08_western_white_tower', 34, 20], L_LATE_ALTAR: ['U05_sealed_chamber_altar', 40, 20] },
    // 2026-10-20 第3便：C の START は分かれ道（大通りと岸壁が狭い角度）＝門は大通りが岸壁から離れる S01_02 の先（道をまたぐ・正面）
    C: { START: null, S01_02: ['./assets/fields/ch2/art_1020/harbor_start_gate_open_foot.webp', 68, 11, null, null, 0, null, 0], CHALLENGE: ['U03_sunken_temple_gate', 38, 14], L_CHEST: ['L04_shell_shrine', 32, 20], R_CHEST: ['undersea_treasure_vault', 32, 20], L_ALTAR: ['trial_monolith', 40, 20], L_LATE_ALTAR: ['U05_sealed_chamber_altar', 40, 20] },
  };
  const ALL_LM = [...new Set([...Object.values(LM_BASE), ...Object.values(LM_ROUTE).flatMap(Object.values)].filter(Boolean).flatMap((v) => [v[0], v[4]].filter(Boolean)).concat(['ocean_arena', 'R05_spiral_tower_door', 'R05_spiral_tower_beacon', 'arena_approach_gate', 'L01_harbor_town_cluster', 'chapter2_sea_medallion', 'sea_zone_nameplate', JT, ...EDGE_PROPS]))];
  const LM_CACHE = new WeakMap();
  const dSeg = (x, y, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L2)); return Math.hypot(a[0] + dx * t - x, a[1] + dy * t - y); };
  /** 海上の自由な分かれ道（free_fork・late_free_fork）の脇に分かれ目の塔（sea_junction_tower）。道からいちばん離れる向きへ 30 単位（8 方向から選ぶ） */
  function junctionTowers(D, taken) {
    const out = [], lines = Object.values(D.segments).map((s) => s[3].map((id) => D.nodes[id]));
    const far = (x, y) => Math.min(...lines.map((l) => { let m = 1e9; for (let i = 0; i < l.length - 1; i++) m = Math.min(m, dSeg(x, y, l[i], l[i + 1])); return m; }));
    for (const [id, n] of Object.entries(D.nodes)) {
      if (!/free_fork/.test(n[2]) || taken.has(id)) continue;
      const fw = D.edges.filter((e) => e[0] === id && e[3] === 'forward'); if (fw.length < 2 || fw.some((e) => !isSurface(zoneOf(D, e[2])))) continue;
      // 2026-10-20：入ってくる道の向き（カメラはその後ろから見る）より前（奥）の向きだけ＝手前に立ってマスやモンスターを隠さない
      //  2026-10-20 追加指示（Chapter 2 B の J0：塔がモンスターの手前に立って隠していた）：入ってくる向きは 3 地点前から（すぐ前の地点だけでは曲がりの途中の向きになる）・
      //  前の向きから 65° 以内（旧：直角より少し後ろまで許していた＝カメラの手前に立つことがあった）
      let back = id; for (let j = 0; j < 3; j++) { const e = D.edges.find((x) => x[1] === back && x[3] === 'forward'); if (!e) break; back = e[0]; }
      const pv = back !== id ? D.nodes[back] : null, ix = pv ? n[0] - pv[0] : 0, iy = pv ? n[1] - pv[1] : -1, il = Math.hypot(ix, iy) || 1;
      let best = null; for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2, cx = Math.cos(a), cy = Math.sin(a); if ((cx * ix + cy * iy) / il < 0.42) continue;
        const x = n[0] + cx * 38, y = n[1] + cy * 38, d = far(x, y); if (!best || d > best.d) best = { d, off: [x - n[0], y - n[1]] }; }
      if (!best) continue;
      // 2026-10-19 P0（iPhone 試遊：道の集まる広場の真ん中に塔が立っていた）：道から塔の半分の幅＋道の半分（約 26 単位）離せる所が無ければ立てない
      if (best.d < 26) continue;
      out.push({ node: id, file: U(JT), w: 26, off: best.off, z: -30 });
    }
    return out;
  }
  /** 道のデータの目印（設計の standin・Chapter 1 の代用）を正式の絵へ。UPPER_GATE が無いルートは螺旋塔の上り坂の入口に上り門 */
  function lm(D) {
    if (LM_CACHE.has(D)) return LM_CACHE.get(D);
    const M = Object.assign({}, LM_BASE, LM_ROUTE[D.route] || {}), out = [];
    for (const [node, v] of Object.entries(M)) if (v && D.nodes[node]) out.push({ node, file: U(v[0]), w: v[1], along: v[2] || 0, off: v[3] || undefined, side: v[5] || 0, z: v[7] != null ? v[7] : -30, open: v[4] ? U(v[4]) : undefined, aim: v[6] && D.nodes[v[6]] ? v[6] : undefined });
    out.push(...junctionTowers(D, new Set(Object.keys(M))));
    if (!D.nodes.UPPER_GATE || !M.UPPER_GATE) { const sp = Object.entries(D.segments).find(([sid]) => /ascent/.test(zoneOf(D, sid))); if (sp && D.nodes[sp[1][0]]) out.push({ node: sp[1][0], file: U('undersea_ascent_gate'), w: 36, along: -6, z: -30 }); }
    LM_CACHE.set(D, out); return out;
  }
  /** 大会会場（GOAL の後ろ）＝ocean_arena。会場島の手前に会場への門（arena_approach_gate）＝景物として scatter が置く */
  const goal = { file: U('ocean_arena'), w: 168, dy: 14, back: 4 };

  // ---- 景物（2026-10-16 正式美術）：陸＝ヤシ・白い花・貝殻の岩、海＝岩礁・小さな岩の島・海の岩柱、海底＝珊瑚・海草・苔むした岩・青い結晶・沈んだ列柱 ----
  function scatter(D, o, H) {
    const rnd = H.mulberry(0x2C2A), out = [], B = basinOf(D), regs = regionsOf(D), dep = D.art.depth || 36;
    const lines = Object.values(D.segments).map((s) => s[3].map((id) => D.nodes[id]));
    const nearRoad = (x, y, r) => lines.some((l) => H.distLine(l, x, y) < r);
    const towers = D.art.towers || [];
    const nearTower = (x, y, m) => towers.some((t) => Math.hypot(t.c[0] - x, t.c[1] - y) < t.r + m);
    const lms = lm(D);
    const lmNear = (x, y, r) => lms.some((L) => { const at = H.landmarkAt(D, L); return at && Math.hypot(at[0] - x, at[1] - y) < r + L.w * 0.5; });
    const gn = D.nodes.GOAL;
    const LAND = [[U('E02_small_coastal_palm'), 15, 0.42], [U('E02_white_coastal_flower_patch'), 11, 0.38], [U('coastal_rock_shells'), 18, 0.2]];
    const SEA = [[U('E02_small_rocky_islet'), 22, 0.35], [U('E02_tidal_sea_stack'), 10, 0.35], [U('coral_shoal_edge'), 34, 0.3]];
    const SEABED = [[U('coral_cluster'), 17, 0.22], [U('seagrass_cluster'), 14, 0.22], [U('E01_small_blue_coral'), 9, 0.18], [U('E01_undersea_mossy_rock'), 11, 0.18], [U('undersea_blue_crystal'), 14, 0.1], [U('sunken_columns'), 15, 0.1]];
    const pick = (L) => { let r = rnd(), acc = 0; for (const c of L) { acc += c[2]; if (r < acc) return c; } return L[L.length - 1]; };
    // 決まった景物：港町の家並み・会場への門・海底の洞窟（重ならない所だけ）
    const fixed = [];
    { const t = regs.find((q) => q.r.id === 'town'); if (t) fixed.push({ file: U('L01_harbor_town_cluster'), x: 150, y: 1405, w: 120 }); }
    if (gn) { const ap = Object.values(D.segments).find((s) => s[1] === 'GOAL'); const ids = ap ? ap[3] : null; const id = ids && ids.length > 3 ? ids[ids.length - 3] : null;
      if (id && D.nodes[id]) { const n = D.nodes[id]; fixed.push({ file: U('arena_approach_gate'), x: n[0] + 32, y: n[1] + 6, w: 40, z: -30, at: id }); } }
    for (const f of fixed) out.push(f);
    for (let y = 30; y < 1530; y += 26) for (let x = 14; x < 1020; x += 26) {
      const px = x + (rnd() - 0.5) * 20, py = y + (rnd() - 0.5) * 20, r1 = rnd();
      if (gn && Math.hypot(gn[0] - px, gn[1] - py + 30) < 100) continue;
      if (nearTower(px, py, 16) || lmNear(px, py, 30) || fixed.some((f) => Math.hypot(f.x - px, f.y - py) < f.w * 0.6)) continue;
      const reg = regs.find((q) => H.inPoly(q.P, px, py));
      if (reg && reg.r.kind !== 'arena' && reg.r.id !== 'town') {   // 陸の島
        if (r1 > 0.5 || nearRoad(px, py, 16)) continue; const c = pick(LAND); out.push({ file: c[0], x: px, y: py, w: c[1] * (0.8 + rnd() * 0.4) }); continue;
      }
      if (reg) continue;
      if (H.inPoly(B, px, py)) {   // 海底（盆地の中）：道から少し離して
        if (r1 > 0.24 || nearRoad(px, py, 22)) continue; const c = pick(SEABED); out.push({ file: c[0], x: px, y: py, w: c[1] * (0.8 + rnd() * 0.4), h: -dep }); continue;
      }
      if (r1 < 0.03 && !nearRoad(px, py, 30)) { const c = pick(SEA); out.push({ file: c[0], x: px, y: py, w: c[1] * (0.8 + rnd() * 0.4) }); }   // 海の岩礁（まばら）
    }
    // 2026-10-16 再送：島のふちの海の側（岸のすぐ外）に白い海岸の崖（陸の上に立てると石の台に見えた）・盆地のふち（海底の側）に海底の崖。道・目印から離れた所に間をあけて
    const edgeAt = (P, step, inset, ok, push) => { let acc = step * 0.5; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); acc += L; if (acc < step) continue; acc = 0;
      const nx = -(b[1] - a[1]) / (L || 1), ny = (b[0] - a[0]) / (L || 1), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      for (const sg of [1, -1]) { const x = m[0] + nx * inset * sg, y = m[1] + ny * inset * sg; if (ok(x, y)) { push(x, y); break; } } } };
    for (const { r, P } of regs) { if (r.kind === 'arena' || r.id === 'town') continue;
      edgeAt(P, 120, 12, (x, y) => !H.inPoly(P, x, y) && !H.inPoly(B, x, y) && !regs.some((q) => H.inPoly(q.P, x, y)) && !nearRoad(x, y, 24) && !lmNear(x, y, 26) && !nearTower(x, y, 12), (x, y) => out.push({ file: U('white_coastal_cliff_edge'), x, y, w: 30 + rnd() * 6 })); }
    edgeAt(B, 150, 14, (x, y) => H.inPoly(B, x, y) && !nearRoad(x, y, 24) && !lmNear(x, y, 26) && !nearTower(x, y, 14), (x, y) => out.push({ file: U('undersea_cliff_edge'), x, y, w: 30 + rnd() * 6, h: -dep }));
    // 沈没遺跡の広場のまわりに沈んだ列柱と珊瑚（海底の地面に立つ）
    for (const R of (D.art.ruins || [])) {
      const n = D.nodes[R.at]; if (!n) continue;
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + rnd() * 0.4, rr = R.r + 8 + rnd() * 12, px = n[0] + Math.cos(a) * rr, py = n[1] + Math.sin(a) * rr;
        if (!H.inPoly(B, px, py) || nearRoad(px, py, 15) || nearTower(px, py, 10)) continue;
        out.push({ file: rnd() < 0.55 ? U('sunken_columns') : U('E01_small_blue_coral'), x: px, y: py, w: 10 + rnd() * 7, h: -dep });
      }
    }
    // 螺旋塔の扉（海底の根もと・上り坂の入口の側）と頂上の灯
    for (const t of towers) {
      if (t.kind !== 'spiral') continue;
      const inB = H.inPoly(B, t.c[0], t.c[1]), z0 = inB ? -dep : 0;
      const sp = Object.entries(D.segments).find(([sid]) => /ascent/.test(zoneOf(D, sid))), a0 = sp ? D.nodes[sp[1][3][0]] : null;
      const ang = a0 ? Math.atan2(a0[1] - t.c[1], a0[0] - t.c[0]) : Math.PI / 2;
      out.push({ file: U('R05_spiral_tower_door'), x: t.c[0] + Math.cos(ang) * (t.r + 1), y: t.c[1] + Math.sin(ang) * (t.r + 1), w: 20, h: z0, z: -5 });
      out.push({ file: U('R05_spiral_tower_beacon'), x: t.c[0], y: t.c[1], w: 16, h: t.top, z: 5, cls: 'rfs-beacon' });
    }
    // 2026-10-17 QA（道路画質・?qaRoadArt=…&qaArch=1 のときだけ）：新しい白い橋のアーチ（L02・正面寄りの絵）を、橋の本体へ結合せず「独立の門」として、
    //  海上の道が島（陸）から海へ出る所（陸の最後の地点と海の最初の地点の間）に立てる。立てた絵（景物と同じ）＝カメラの向きで見え方が変わる＝それを試遊で確かめる
    const QRA = root.MMQRA && root.MMQRA.urlMode && root.location && /[?&]qaArch=1/.test(root.location.search) ? root.MMQRA : null;
    if (QRA) {
      const onLand = (n) => regs.some((q) => q.r.kind !== 'arena' && H.inPoly(q.P, n[0], n[1]));
      for (const [sid, sg] of Object.entries(D.segments)) {
        if (!isSurface(zoneOf(D, sid))) continue;
        const ids = sg[3];
        for (let i = 0; i < ids.length - 1; i++) { const a = D.nodes[ids[i]], b = D.nodes[ids[i + 1]]; if (!a || !b || onLand(a) === onLand(b)) continue;
          out.push({ file: QRA.BASE + 'ch2_L02_white_bridge_arch_pier.webp', x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, w: 34, z: 6, cls: 'rfs-qarch' }); }
      }
    }
    return out;
  }

  // ---- 3D：海底の板・盆地の壁・斜路・塔 ----
  /** 局所の (u, v) → 世界の (x, y, z)：T＝左上・U＝横の向き・V＝下の向き（単位ベクトル）。CSS の matrix3d（列優先） */
  function m3(T, U, V) {
    const N = [U[1] * V[2] - U[2] * V[1], U[2] * V[0] - U[0] * V[2], U[0] * V[1] - U[1] * V[0]];
    return `matrix3d(${U[0]},${U[1]},${U[2]},0,${V[0]},${V[1]},${V[2]},0,${N[0]},${N[1]},${N[2]},0,${T[0]},${T[1]},${T[2]},1)`;
  }
  function quad(doc, par, T, U, V, w, h, cls, style) {
    const d = doc.createElement('div'); d.className = 'rfs-q ' + (cls || '');
    d.style.width = w.toFixed(2) + 'px'; d.style.height = h.toFixed(2) + 'px'; d.style.transform = m3(T, U, V);
    if (style) Object.assign(d.style, style); par.appendChild(d); return d;
  }
  /** 地点の並びの曲線（MMRF_WORLD の道と同じベジェ）を細かく：[x, y, h] の列。h は地点の高さを区間の中で補間 */
  function curve3(D, ids) {
    const E = D.art.elev || {}, p = ids.map((id) => [D.nodes[id][0], D.nodes[id][1], E[id] || 0]), out = [p[0].slice()];
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], d = p[i + 2] || c;
      const c1 = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6], c2 = [c[0] - (d[0] - b[0]) / 6, c[1] - (d[1] - b[1]) / 6];
      const n = Math.max(2, Math.ceil(Math.hypot(c[0] - b[0], c[1] - b[1]) / 4));
      for (let k = 1; k <= n; k++) { const t = k / n, u = 1 - t;
        out.push([u * u * u * b[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * c[0], u * u * u * b[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * c[1], b[2] + (c[2] - b[2]) * t]); }
    }
    return out;
  }
  // 正式素材が読めないときの仮の海底（2026-10-15 の描き方のまま）
  function oldFloor(g, rnd, bx0, by0, bw, bh) {
    { const gr = g.createLinearGradient(bx0, by0, bx0 + bw * 0.35, by0 + bh); gr.addColorStop(0, 'rgb(122,150,136)'); gr.addColorStop(0.55, 'rgb(104,134,126)'); gr.addColorStop(1, 'rgb(92,120,118)'); g.fillStyle = gr; g.fillRect(bx0, by0, bw, bh); }
    for (let i = 0; i < 260; i++) { const x = bx0 + rnd() * bw, y = by0 + rnd() * bh, r = 8 + rnd() * 30; g.fillStyle = rnd() < 0.55 ? 'rgba(52,86,74,.16)' : 'rgba(196,186,150,.12)'; g.beginPath(); g.ellipse(x, y, r, r * (0.45 + rnd() * 0.4), rnd() * 3, 0, 7); g.fill(); }
  }
  function oldRuin(g, H, art, rnd, n, R) {
    const rp = art.road ? H.pattern(g, art.road, 57.5) : null;
    g.save(); g.beginPath(); for (let k = 0; k <= 24; k++) { const a = (k / 24) * Math.PI * 2, rr = R.r * (0.86 + 0.14 * Math.sin(k * 2.7 + R.r)); k ? g.lineTo(n[0] + rr * Math.cos(a), n[1] + rr * Math.sin(a)) : g.moveTo(n[0] + rr * Math.cos(a), n[1] + rr * Math.sin(a)); } g.closePath();
    g.fillStyle = 'rgba(40,58,60,.55)'; g.fill(); g.clip(); g.globalAlpha = 0.78; g.fillStyle = rp || '#b9b09a'; g.fill(); g.restore();
  }
  function oldGlass(g, H, art, box, lines, D) {
    for (const [lw, col] of [[44, 'rgba(10,30,36,.20)'], [36, 'rgba(170,236,255,.20)']]) { g.strokeStyle = col; g.lineWidth = lw; for (const P of lines) { pathOf(g, P); g.stroke(); } }
    if (art.strip) for (const P of lines) H.stripAlong(g, P, art.strip, H.ART.strip.w, box);
    hubs(g, D, (sid) => zoneOf(D, sid) === 'undersea', art, H);
  }
  const shade = (base, k) => { const m = base.match(/\d+/g).map(Number); return `rgb(${m.map((v) => Math.round(Math.max(0, Math.min(255, v * k)))).join(',')})`; };
  function build3d(ctx) {
    if (ctx.gl) return build3dGL(ctx);   // 2026-10-20 第4便：WebGL の盤（js/proto/board-gl.js）＝海底・壁・斜路・塔も GPU で（CSS の 3D の板を作らない）
    const { doc, plane, D, art, base } = ctx, A = D.art, dep = A.depth || 36, B = basinOf(D), S = art.sea || {};
    css(doc);
    const g3 = doc.createElement('div'); g3.className = 'rfs-3d'; plane.appendChild(g3);
    // 海底の板（盆地の範囲だけ・高さ −depth）
    const xs = B.map((p) => p[0]), ys = B.map((p) => p[1]), bx0 = Math.floor(Math.min(...xs)) - 4, by0 = Math.floor(Math.min(...ys)) - 4, bw = Math.ceil(Math.max(...xs)) - bx0 + 8, bh = Math.ceil(Math.max(...ys)) - by0 + 8;
    const res = 1.6, cv = doc.createElement('canvas'); cv.className = 'rfs-floor'; cv.width = Math.ceil(bw * res); cv.height = Math.ceil(bh * res);
    Object.assign(cv.style, { left: bx0 + 'px', top: by0 + 'px', width: bw + 'px', height: bh + 'px', transform: `translateZ(${-dep}px)` });
    const g = cv.getContext('2d'); g.setTransform(res, 0, 0, res, -bx0 * res, -by0 * res);
    const H = ctx.H, box = [bx0, by0, bw, bh];
    g.save(); polyPath(g, B); g.clip();
    // 2026-10-15 追補2（ユーザー指示：海底の道を高架橋に見せない＝海底の地形・ガラス回廊・沈没遺跡・海中の光がつながる構成）：
    //  海底は「水の色」ではなく砂地の地面（砂紋・藻場・岩の斑）＋差し込む光の網（コースティクス）。道は地面の上（板の高さ −depth）
    const rnd = H.mulberry(0x5EA), seabed = tp(g, H, S, 'seabed');
    if (seabed) {   // 2026-10-16 正式：海底の砂地（undersea_sand_base）＋ゆるい明暗（深さ）
      g.fillStyle = seabed; g.fillRect(bx0, by0, bw, bh);
      const gr = g.createLinearGradient(bx0, by0, bx0 + bw * 0.35, by0 + bh); gr.addColorStop(0, 'rgba(20,60,90,.22)'); gr.addColorStop(1, 'rgba(10,40,80,.42)'); g.fillStyle = gr; g.fillRect(bx0, by0, bw, bh);
    } else oldFloor(g, rnd, bx0, by0, bw, bh);
    // 沈没遺跡の広場（art.ruins）：正式＝遺跡の地面（sunken_ruins_ground）の上に U08 の広場（base／cracked_a／cracked_b を順に）
    const ruinsG = tp(g, H, S, 'ruins');
    (A.ruins || []).forEach((R, i) => {
      const n = D.nodes[R.at]; if (!n) return; const pl = S.plaza && S.plaza[i % 3];
      if (pl) {
        if (ruinsG) for (const [k, al] of [[2.2, 0.3], [1.8, 0.5], [1.45, 0.8]]) { g.save(); g.globalAlpha = al; g.fillStyle = ruinsG; g.beginPath(); g.arc(n[0], n[1], R.r * k, 0, 7); g.fill(); g.restore(); }
        const d = R.r * 2.5; g.drawImage(pl, n[0] - d / 2, n[1] - d / 2, d, d);
      } else oldRuin(g, H, art, rnd, n, R);
    });
    // 海底の道：ガラス回廊（床 glass_corridor_floor＋天井 U01）／遺跡の通路（sunken_temple_road）。どちらも海底の地面に接した道（橋脚・下への影なし）
    const under = Object.entries(D.segments).filter(([sid]) => zoneOf(D, sid) === 'undersea');
    const chainL = (ok) => H.roadChains(D, under.filter(([sid]) => ok(sid))).map((c) => H.roadPts(D, c.ids, 18));   // 2026-10-20：つなぎ目で切らない
    const glassL = chainL((sid) => isGlass(D, sid)), templeL = chainL((sid) => !isGlass(D, sid));
    const gp = tp(g, H, S, 'glass'), tr = tp(g, H, S, 'temple'), roof = S.strip && S.strip.roof;
    g.lineCap = g.lineJoin = 'round';
    if (gp || tr) {
      g.strokeStyle = 'rgba(10,30,36,.28)'; g.lineWidth = GLASS_W + 10; for (const P of [...glassL, ...templeL]) { pathOf(g, P); g.stroke(); }   // 地面への接地の影（道のまわりだけ・下へずらさない）
      g.strokeStyle = 'rgb(150,160,150)'; g.lineWidth = CURB_W; for (const P of templeL) { pathOf(g, P); g.stroke(); }
      g.strokeStyle = tr || '#b9b09a'; g.lineWidth = ROAD_W; for (const P of templeL) { pathOf(g, P); g.stroke(); }
      g.strokeStyle = 'rgba(214,250,255,.85)'; g.lineWidth = GLASS_W + 3; for (const P of glassL) { pathOf(g, P); g.stroke(); }
      g.strokeStyle = gp || 'rgba(170,236,255,.6)'; g.lineWidth = GLASS_W; for (const P of glassL) { pathOf(g, P); g.stroke(); }
      if (roof) { g.save(); g.globalAlpha = 0.72; for (const P of glassL) H.stripAlong(g, P, roof, GLASS_W + 4, box); g.restore(); }   // 天井（透ける帯＝床が見える・浮かない＝床と同じ板）
      hubs(g, D, (sid) => zoneOf(D, sid) === 'undersea', art, H, (n) => tr || gp);
    } else oldGlass(g, H, art, box, [...glassL, ...templeL], D);
    // 差し込む光の網（コースティクス）：細い明るい曲線の網を全体に薄く
    g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(160,220,230,.08)'; g.lineWidth = 2.4;
    for (let i = 0; i < 160; i++) { const x = bx0 + rnd() * bw, y = by0 + rnd() * bh, r = 10 + rnd() * 18; g.beginPath(); for (let k = 0; k <= 6; k++) { const a = (k / 6) * Math.PI * 2, rr = r * (0.7 + 0.3 * Math.sin(k * 2.1 + i)); k ? g.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a) * 0.8) : g.moveTo(x + rr, y); } g.stroke(); }
    g.restore();
    // 盆地のふちの影（内側を暗く＝深さ）
    g.strokeStyle = 'rgba(4,20,36,.35)'; g.lineWidth = 46; polyPath(g, B); g.stroke();
    // 2026-10-16 正式：海底のふち（E04＝崖の根もとの岩と海草の帯。盆地の壁の下端に沿って海底の側へ）
    if (S.strip && S.strip.rim) { const Q = signedArea(B) > 0 ? B.slice() : B.slice().reverse(); Q.push(Q[0]); H.stripAlong(g, Q, S.strip.rim, 16, box, -6); }
    g.restore();
    g3.appendChild(cv);
    // 盆地の上の海面（高さ 0 の別の板）：モンスターが海面にいる間は濃く（下が少し透ける）・海底へ潜ると薄く＝海の中の景色
    const wv = doc.createElement('canvas'); wv.className = 'rfs-water'; wv.width = Math.ceil(bw * 0.8); wv.height = Math.ceil(bh * 0.8);
    Object.assign(wv.style, { left: bx0 + 'px', top: by0 + 'px', width: bw + 'px', height: bh + 'px', transform: 'translateZ(0.3px)' });
    { const w2 = wv.getContext('2d'); w2.setTransform(0.8, 0, 0, 0.8, -bx0 * 0.8, -by0 * 0.8); w2.save(); polyPath(w2, B); w2.clip();
      { const sp = tp(w2, H, S, 'sea'); if (sp) { w2.fillStyle = sp; w2.fillRect(bx0, by0, bw, bh); } else { w2.fillStyle = (S.water && H.pattern(w2, S.water, W_TILE)) || '#2d8fc4'; w2.fillRect(bx0, by0, bw, bh); w2.fillStyle = SEA_TINT; w2.fillRect(bx0, by0, bw, bh); } } w2.restore();
      w2.save(); polyPath(w2, B); w2.strokeStyle = 'rgba(220,250,255,.6)'; w2.lineWidth = 3; w2.stroke(); w2.strokeStyle = 'rgba(255,255,255,.25)'; w2.lineWidth = 12; w2.stroke(); w2.restore(); }
    g3.appendChild(wv);
    // 盆地の壁（ふち → 海底）。斜路がふちを越える所は開ける
    const ramps = Object.entries(D.segments).filter(([sid]) => /descent|ascent/.test(zoneOf(D, sid))).map(([, s]) => s[3].map((id) => D.nodes[id]));
    const wallCol = 'rgb(84,118,128)';
    const WSTEP = Math.max(1, Math.round(B.length / 64));   // 壁は約 64 枚（板の数＝合成の層の数を抑える。iPhone の層のメモリ）
    for (let i = 0; i < B.length; i += WSTEP) {
      const p = B[i], q = B[(i + WSTEP) % B.length], L = Math.hypot(q[0] - p[0], q[1] - p[1]); if (L < 0.5) continue;
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      if (ramps.some((l) => H.distLine(l, mx, my) < 16)) continue;
      const U = [(q[0] - p[0]) / L, (q[1] - p[1]) / L, 0], lit = 0.62 + 0.38 * Math.max(0, -U[0] * 0.2 + U[1] * -0.1 + 0.6);
      quad(doc, g3, [p[0], p[1], 0], U, [0, 0, -1], L + 0.6, dep, 'rfs-wall', { background: `linear-gradient(180deg, rgba(20,70,96,${(0.08 / lit).toFixed(2)}) 0%, rgba(8,34,56,${(0.34 / lit).toFixed(2)}) 100%), url(${WALL.basin}) ${(-i * 9) % 72}px 0/72px ${dep}px repeat-x, url(${STONE_TEX}) ${(-i * 7) % 30}px 0/30px 30px` });
    }
    // 斜路（潮の塔の下り坂・螺旋塔の上り坂）：高さの変わる石の道（細かい板を並べる）＋その下の壁
    const walk = S.strip && S.strip.walk, stripUrl = walk ? (walk.currentSrc || walk.src) : art.strip ? (art.strip.currentSrc || art.strip.src) : null, RW = 18;   // 2026-10-16 正式：斜路の道＝白い橋帯 R01
    const rOut = {}, rIn = {}; for (const e of D.edges) if (e[3] === 'forward') { rOut[e[0]] = (rOut[e[0]] || 0) + 1; rIn[e[1]] = (rIn[e[1]] || 0) + 1; }
    for (const [sid, s] of Object.entries(D.segments)) {
      if (!/descent|ascent/.test(zoneOf(D, sid))) continue;
      // 2026-10-20 追加指示（12ルートの接合）：斜路の板は円の広場の中（地面の高さのまま）には敷かない＝広場の床の上に細い石の帯が重なって見えていた（Chapter 2 A の H＝螺旋塔の上り口）。
      //  広場の半径（縁石の外のふち）の所で板を切る（高さが 1.5 単位を超えた所からは切らない）
      //  広場の一覧（plazaList）は海面の道だけで作ってキャッシュしている＝ここでは呼ばない（海底の分かれ目まで広場として海面に描かれてしまう）。斜路の両端が広場になる地点かだけを見る
      const PLs = [s[3][0], s[3][s[3].length - 1]].filter((id) => { const n = D.nodes[id]; return (rOut[id] || 0) > 1 || (rIn[id] || 0) > 1 || /dead_end/.test(n[2]) || n[2] === 'start'; })
        .map((id) => ({ id, x: D.nodes[id][0], y: D.nodes[id][1], r: /dead_end/.test(D.nodes[id][2]) ? ROAD_W * 0.78 : PLAZA_R }));
      const inPl = (q) => Math.abs(q[2]) < 1.5 && PLs.some((p) => Math.hypot(q[0] - p.x, q[1] - p.y) < p.r);
      let P1 = curve3(D, s[3]);
      for (const rev of [false, true]) { if (rev) P1.reverse(); let k = 0; while (k < P1.length - 1 && inPl(P1[k])) k++; if (k > 0) { const a = P1[k - 1], b = P1[k]; let lo = 0, hi = 1; for (let it = 0; it < 12; it++) { const m = (lo + hi) / 2, q = a.map((v, j) => v + (b[j] - v) * m); if (inPl(q)) lo = m; else hi = m; } P1 = [a.map((v, j) => v + (b[j] - v) * hi)].concat(P1.slice(k)); } if (rev) P1.reverse(); }
      const P0 = P1, P = P0.filter((q, i) => i % 2 === 0 || i === P0.length - 1); let cum = 0;   // 約 8 単位ごとの板
      for (let i = 0; i < P.length - 1; i++) {
        const a = P[i], b = P[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], Lxy = Math.hypot(dx, dy), L = Math.hypot(Lxy, dz); if (L < 0.2) continue;
        const U = [dx / L, dy / L, dz / L], side = [-dy / Lxy, dx / Lxy, 0];
        const T = [a[0] - side[0] * RW / 2, a[1] - side[1] * RW / 2, a[2] + 0.4];
        quad(doc, g3, T, U, side, L + 0.5, RW, 'rfs-deck', stripUrl ? { backgroundImage: `url(${stripUrl})`, backgroundSize: `${RW * (walk && walk._qra ? walk.naturalWidth / walk.naturalHeight : 960 / 128)}px 100%`, backgroundPosition: `${-cum.toFixed(1)}px 0` } : null);
        // 斜路の両側の壁（道のふち → 海底）。2 枚の板ごとに 1 枚（層の数を抑える）
        if (i % 2 === 0) for (const sg of [-1, 1]) {
          const E = [a[0] + side[0] * RW / 2 * sg, a[1] + side[1] * RW / 2 * sg, a[2] + 0.4], hh = a[2] + dep + 0.4;
          const b2 = P[Math.min(i + 2, P.length - 1)], dx2 = b2[0] - a[0], dy2 = b2[1] - a[1], L2 = Math.hypot(dx2, dy2) || Lxy;
          if (hh > 1) quad(doc, g3, E, [dx2 / L2, dy2 / L2, 0], [0, 0, -1], L2 + 0.5, hh, 'rfs-skirt', { background: `linear-gradient(180deg, rgba(0,0,0,0) 0 2px, rgba(30,26,20,.28) 3px, rgba(10,30,44,.55) 100%), url(${WALL.ramp}) ${(-cum) % 32}px 0/32px 32px, url(${TOWN_TEX}) ${(-cum) % 28}px 0/28px 28px` });
        }
        cum += L;
      }
    }
    // 塔（多角柱）：螺旋塔＝海底から海面より上へ・潮の塔＝島の上（盆地の外なら地面 0 から）
    const towers = A.towers || [], NF = 18;
    for (const t of towers) {
      const inB = H.inPoly(B, t.c[0], t.c[1]), z0 = inB ? -dep : 0, top = t.top, hgt = top - z0, stone = t.kind === 'spiral' ? 'rgb(214,206,186)' : 'rgb(196,204,210)';
      for (let i = 0; i < NF; i++) {
        const a0 = (i / NF) * Math.PI * 2, a1 = ((i + 1) / NF) * Math.PI * 2;
        const p = [t.c[0] + t.r * Math.cos(a0), t.c[1] + t.r * Math.sin(a0)], q = [t.c[0] + t.r * Math.cos(a1), t.c[1] + t.r * Math.sin(a1)];
        const L = Math.hypot(q[0] - p[0], q[1] - p[1]), U = [(q[0] - p[0]) / L, (q[1] - p[1]) / L, 0], nx = Math.cos((a0 + a1) / 2), ny = Math.sin((a0 + a1) / 2);
        const lit = 0.55 + 0.45 * Math.max(0, -nx * 0.55 + ny * 0.25 + 0.55);
        quad(doc, g3, [p[0], p[1], top], U, [0, 0, -1], L + 0.4, hgt, 'rfs-tw', { background: `linear-gradient(rgba(30,24,16,${(0.62 - lit * 0.55).toFixed(2)}),rgba(30,24,16,${(0.62 - lit * 0.55).toFixed(2)})), url(${WALL.tower}) ${(-i * L) % 32}px 0/32px 32px, repeating-linear-gradient(180deg, rgba(0,0,0,0) 0 11px, rgba(60,48,30,.35) 11px 12px), url(${TOWN_TEX}) ${(-i * L) % 28}px 0/28px 28px` });
      }
      // 屋上（円）と灯（螺旋塔は頂上の灯台）
      const cap = doc.createElement('div'); cap.className = 'rfs-cap'; const d = t.r * 2;
      Object.assign(cap.style, { width: d + 'px', height: d + 'px', transform: `translate3d(${t.c[0] - t.r}px,${t.c[1] - t.r}px,${top + 0.2}px)`,
        background: `radial-gradient(circle, ${shade(stone, 1.08)} 0 55%, ${shade(stone, 0.86)} 56% 62%, ${shade(stone, 1.02)} 63% 100%)` });
      g3.appendChild(cap);
      if (t.kind === 'tide') {   // 螺旋塔の頂上は正式の灯（R05_spiral_tower_beacon＝scatter の景物）
        const r2 = t.r * 0.32, h2 = t.kind === 'spiral' ? 16 : 10, N2 = 10;
        for (let i = 0; i < N2; i++) {
          const a0 = (i / N2) * Math.PI * 2, a1 = ((i + 1) / N2) * Math.PI * 2, p = [t.c[0] + r2 * Math.cos(a0), t.c[1] + r2 * Math.sin(a0)], q = [t.c[0] + r2 * Math.cos(a1), t.c[1] + r2 * Math.sin(a1)];
          const L = Math.hypot(q[0] - p[0], q[1] - p[1]);
          quad(doc, g3, [p[0], p[1], top + h2], [(q[0] - p[0]) / L, (q[1] - p[1]) / L, 0], [0, 0, -1], L + 0.3, h2, 'rfs-lamp', null);
        }
        const lc = doc.createElement('div'); lc.className = 'rfs-glow'; const ld = r2 * 2.6;
        Object.assign(lc.style, { width: ld + 'px', height: ld + 'px', transform: `translate3d(${t.c[0] - ld / 2}px,${t.c[1] - ld / 2}px,${top + h2 + 0.3}px)` }); g3.appendChild(lc);
      }
    }
    /** そのマス（世界 x, y, 高さ h・画面の点 q）が螺旋塔のうしろに隠れるか（カメラから見て塔の中心より奥で、塔の画面の範囲の中） */
    const sp = towers.find((t) => t.kind === 'spiral');
    function occl(cam, x, y, h, q) {
      if (!sp || cam.tilt < 5) return false;
      const P = ctx.H.project, inB = H.inPoly(B, sp.c[0], sp.c[1]), z0 = inB ? -dep : 0;
      const cT = P(cam, sp.c[0], sp.c[1], sp.top), cB = P(cam, sp.c[0], sp.c[1], z0), r = sp.r * cam.s * cB.k;
      if (q.z >= cB.z) return false;   // 塔の中心より手前
      return q.x > cT.x - r && q.x < cT.x + r && q.y > cT.y - r * 0.6 && q.y < cB.y + r * 0.4;
    }
    /** モンスターの高さ（毎フレーム）：海底（−2 より下）にいる間は盆地の上の海面を薄く */
    // 海中の光（画面の上から差し込む光の筋）：モンスターが海底にいる間だけ。画面に固定の薄い層（押せない・視差を減らす設定では動かさない）
    const view = plane.parentElement, rays = doc.createElement('div'); rays.className = 'rfs-rays'; rays.style.setProperty('--fx', `url(${FX})`); rays.style.setProperty('--bub', `url(${BUB})`); if (view) view.insertBefore(rays, plane.nextSibling);
    let dived = null;
    function mon(h) { const u = (h || 0) < -2; if (u === dived) return; dived = u; wv.style.opacity = u ? String(1 - BASIN_UNDER) : String(BASIN_ALPHA); rays.classList.toggle('on', u); }
    mon(0);
    return { occl, mon, el: g3, rays };
  }
  // ---- 2026-10-20 第4便：WebGL の盤（js/proto/board-gl.js）----
  //  地面＝外海の絵（open_sea_water）をくり返し・陸＝ユーザー納品の白砂（E03）を陸の範囲の画像で重ねる・盆地の上は穴（海底が見える）。
  //  浅瀬・島の草地・会場の白石・波打ち際・盆地のふちの光は従来と同じ描画（地形の絵）。海面の道＝E04 の白い大理石の石畳＋青いモザイクの縁石・広場＝E04 の円の広場。
  //  海底（E03 の海底の砂＋従来の海底の道・遺跡・ふち・光の網の絵）・盆地の壁・斜路・塔・盆地の上の海面は 3D の網（深さで前後を決める）
  const GL_SEA_ALPHA = BASIN_ALPHA;
  function surfaceLines(D, H) { return H.roadChains(D, Object.entries(D.segments).filter(([sid]) => isSurface(zoneOf(D, sid)))).map((c) => ({ ids: c.ids, P: H.roadPts(D, c.ids, 16) })); }
  function glKit(D, o, art, H) {
    const T = (k, repeat) => ({ src: H.GL_DIR + 'ch2_' + k + '.webp', repeat }), L = surfaceLines(D, H), mine = new Set(L.flatMap((l) => [l.ids[0], l.ids[l.ids.length - 1]]));
    const R = H.glRoadsOf(D, L, { w: ROAD_W, tile: 44, curb: (CURB_W - ROAD_W) / 2, r: PLAZA_R, rEnd: ROAD_W * 0.78, sa: 0.3, ps: 3, shadow: { w: 2, a: 0.3, rgb: [0.02, 0.12, 0.2], dy: 1.5 } });
    R.hubs = R.hubs.filter((id) => mine.has(id)); R.ends = R.ends.filter((id) => mine.has(id));   // 海面の道の広場だけ（海底の分かれ目は海底の絵の中）
    return {
      textures: { land: T('ground', true), road: T('road', true), curb: T('curb', 'u'), plaza: T('plaza', false), seabed: T('seabed', true),
        basinWall: { src: WALL.basin, repeat: true }, rampWall: { src: WALL.ramp, repeat: true }, towerWall: { src: WALL.tower, repeat: true } },
      macro: { k: 0.4 }, depth: true, hole: true,
      ground: { tex: 'sea', tile: TEX.sea[1], layers: [{ tex: 'land', tile: 64 }] },
      features: (g, bx) => featuresGL(g, D, bx, art, H),
      roads: R,
      onArt(G, a) {
        const Sx = a.sea || {}; if (Sx.tex && Sx.tex.sea) G.texture('sea', Sx.tex.sea, true);
        //  範囲の画像（1単位 1px）：R＝陸（白砂を重ねる）・B＝盆地（穴）
        const c = root.document.createElement('canvas'); c.width = 1024; c.height = 1536; const g = c.getContext('2d');
        g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
        g.fillStyle = '#f00'; for (const { P } of regionsOf(D)) { polyPath(g, P); g.fill(); }
        g.globalCompositeOperation = 'lighter'; g.fillStyle = '#00f'; polyPath(g, basinOf(D)); g.fill();
        G.setMask(c, [0, 0, 1024, 1536]);
      },
    };
  }
  /** 地形の絵（透明な canvas に）：浅瀬（陸と盆地の外だけ）・島の草地／会場の白石（ふちは白砂のまま）・波打ち際・盆地のふちの光 */
  function featuresGL(g, D, bx, art, H) {
    const S = art.sea || {}, [x0, y0, w, h] = bx, B = basinOf(D);
    const sh = tp(g, H, S, 'shallow');
    if (sh) { g.save(); g.fillStyle = sh; for (let k = 0; k < 14; k++) { g.globalAlpha = 0.14; const d = 65 - k * 3.5; for (const { P } of regionsOf(D)) { polyPath(g, grow(P, d)); g.fill(); } } g.restore();
      const sp = tp(g, H, S, 'sea');   // 世界の端へ向けて浅瀬を外海へなめらかに戻す（ground と同じ）
      if (sp) { g.save(); g.globalCompositeOperation = 'destination-out'; const E = 90; for (let k = 0; k < 9; k++) { const d = (E * (9 - k)) / 9; g.globalAlpha = 0.2;
        g.fillRect(-20, -20, 1064, d + 20); g.fillRect(-20, 1536 - d, 1064, d + 20); g.fillRect(-20, -20, d + 20, 1576); g.fillRect(1024 - d, -20, d + 20, 1576); } g.restore(); }
      g.save(); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; for (const { P } of regionsOf(D)) { polyPath(g, P); g.fill(); } g.restore(); }
    const grass = tp(g, H, S, 'grass'), white = tp(g, H, S, 'white');
    for (const { r, P } of regionsOf(D)) {
      const paved = r.kind === 'arena', fill = paved ? white : r.id !== 'town' ? grass : null; if (!fill) continue;
      g.save(); polyPath(g, P); g.clip(); g.fillStyle = fill; g.fillRect(x0, y0, w, h);
      g.globalCompositeOperation = 'destination-out'; g.lineJoin = 'round'; g.strokeStyle = '#000'; g.lineWidth = paved ? 18 : 30; polyPath(g, P); g.stroke(); g.restore();
    }
    const foam = S.strip && S.strip.foam;
    for (const { P } of regionsOf(D)) { const Q = signedArea(P) > 0 ? P.slice().reverse() : P.slice(); Q.push(Q[0]);
      if (foam) H.stripAlong(g, Q, foam, 14, bx, 2); else if (S.shore) H.stripAlong(g, Q, S.shore, 16, bx, 4); }
    g.save(); polyPath(g, B); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.fill(); g.restore();   // 盆地の上は穴
    g.save(); polyPath(g, B); g.strokeStyle = 'rgba(220,250,255,.6)'; g.lineWidth = 3; g.stroke(); g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 12; g.stroke(); g.restore();   // 盆地のふちの光（旧：海面の板）
  }
  /** 網の頂点（board-gl の mesh）：x, y, h, u, v, 色（乗算済み・不透明） */
  function V(out, x, y, h, u, v, k, t) { const c = t || [1, 1, 1]; out.push(x, y, h, u, v, c[0] * k, c[1] * k, c[2] * k, 1); return out.length / 9 - 1; }
  function build3dGL(ctx) {
    const { doc, plane, D, art, gl: G } = ctx, H = ctx.H, A = D.art, dep = A.depth || 36, B = basinOf(D), S = art.sea || {};
    css(doc);
    const xs = B.map((p) => p[0]), ys = B.map((p) => p[1]), bx0 = Math.floor(Math.min(...xs)) - 4, by0 = Math.floor(Math.min(...ys)) - 4, bw = Math.ceil(Math.max(...xs)) - bx0 + 8, bh = Math.ceil(Math.max(...ys)) - by0 + 8, box = [bx0, by0, bw, bh];
    // 海底：E03 の海底の砂（くり返し）＋その上の絵（深さの明暗・遺跡・海底の道・光の網・ふち）。絵は 1単位 3px（旧 1.6）
    { const v = [], T = 64; for (const [x, y] of [[bx0, by0], [bx0 + bw, by0], [bx0 + bw, by0 + bh], [bx0, by0 + bh]]) V(v, x, y, -dep, x / T, y / T, 1);
      G.add({ kind: 'mesh', verts: v, idx: [0, 1, 2, 0, 2, 3], tex: 'seabed', phase: 'pre' }); }
    const res = 3, cv = doc.createElement('canvas'); cv.width = Math.ceil(bw * res); cv.height = Math.ceil(bh * res);
    const g = cv.getContext('2d'); g.setTransform(res, 0, 0, res, -bx0 * res, -by0 * res);
    g.save(); polyPath(g, B); g.clip();
    { const gr = g.createLinearGradient(bx0, by0, bx0 + bw * 0.35, by0 + bh); gr.addColorStop(0, 'rgba(20,60,90,.22)'); gr.addColorStop(1, 'rgba(10,40,80,.42)'); g.fillStyle = gr; g.fillRect(bx0, by0, bw, bh); }
    const rnd = H.mulberry(0x5EA), ruinsG = tp(g, H, S, 'ruins');
    (A.ruins || []).forEach((R, i) => { const n = D.nodes[R.at]; if (!n) return; const pl = S.plaza && S.plaza[i % 3];
      if (pl) { if (ruinsG) for (const [k, al] of [[2.2, 0.3], [1.8, 0.5], [1.45, 0.8]]) { g.save(); g.globalAlpha = al; g.fillStyle = ruinsG; g.beginPath(); g.arc(n[0], n[1], R.r * k, 0, 7); g.fill(); g.restore(); }
        const d = R.r * 2.5; g.drawImage(pl, n[0] - d / 2, n[1] - d / 2, d, d); } else oldRuin(g, H, art, rnd, n, R); });
    const under = Object.entries(D.segments).filter(([sid]) => zoneOf(D, sid) === 'undersea');
    const chainL = (ok) => H.roadChains(D, under.filter(([sid]) => ok(sid))).map((c) => H.roadPts(D, c.ids, 18));
    const glassL = chainL((sid) => isGlass(D, sid)), templeL = chainL((sid) => !isGlass(D, sid));
    const gp = tp(g, H, S, 'glass'), tr = tp(g, H, S, 'temple'), roof = S.strip && S.strip.roof;
    g.lineCap = g.lineJoin = 'round';
    if (gp || tr) {
      g.strokeStyle = 'rgba(10,30,36,.28)'; g.lineWidth = GLASS_W + 10; for (const P of [...glassL, ...templeL]) { pathOf(g, P); g.stroke(); }
      g.strokeStyle = 'rgb(150,160,150)'; g.lineWidth = CURB_W; for (const P of templeL) { pathOf(g, P); g.stroke(); }
      g.strokeStyle = tr || '#b9b09a'; g.lineWidth = ROAD_W; for (const P of templeL) { pathOf(g, P); g.stroke(); }
      g.strokeStyle = 'rgba(214,250,255,.85)'; g.lineWidth = GLASS_W + 3; for (const P of glassL) { pathOf(g, P); g.stroke(); }
      g.strokeStyle = gp || 'rgba(170,236,255,.6)'; g.lineWidth = GLASS_W; for (const P of glassL) { pathOf(g, P); g.stroke(); }
      if (roof) { g.save(); g.globalAlpha = 0.72; for (const P of glassL) H.stripAlong(g, P, roof, GLASS_W + 4, box); g.restore(); }
      hubs(g, D, (sid) => zoneOf(D, sid) === 'undersea', art, H, () => tr || gp);
    } else oldGlass(g, H, art, box, [...glassL, ...templeL], D);
    g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(160,220,230,.08)'; g.lineWidth = 2.4;
    for (let i = 0; i < 160; i++) { const x = bx0 + rnd() * bw, y = by0 + rnd() * bh, r = 10 + rnd() * 18; g.beginPath(); for (let k = 0; k <= 6; k++) { const a = (k / 6) * Math.PI * 2, rr = r * (0.7 + 0.3 * Math.sin(k * 2.1 + i)); k ? g.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a)) : g.moveTo(x + rr * Math.cos(a), y + rr * Math.sin(a)); } g.stroke(); }
    g.restore();
    g.strokeStyle = 'rgba(4,20,36,.35)'; g.lineWidth = 46; polyPath(g, B); g.stroke();
    if (S.strip && S.strip.rim) { const Q = signedArea(B) > 0 ? B.slice() : B.slice().reverse(); Q.push(Q[0]); H.stripAlong(g, Q, S.strip.rim, 16, box, -6); }
    g.restore();
    G.texture('floor', cv, false);
    { const v = []; for (const [x, y, u, w] of [[bx0, by0, 0, 0], [bx0 + bw, by0, 1, 0], [bx0 + bw, by0 + bh, 1, 1], [bx0, by0 + bh, 0, 1]]) V(v, x, y, -dep + 0.05, u, w, 1);
      G.add({ kind: 'mesh', verts: v, idx: [0, 1, 2, 0, 2, 3], tex: 'floor', phase: 'pre' }); }
    // 盆地の壁（ふち → 海底）：斜路がふちを越える所は開ける。上は明るく下は暗い（深さ）
    const ramps = Object.entries(D.segments).filter(([sid]) => /descent|ascent/.test(zoneOf(D, sid))).map(([, s]) => s[3].map((id) => D.nodes[id]));
    { const v = [], ix = []; let cum = 0;
      for (let i = 0; i < B.length; i++) { const p = B[i], q = B[(i + 1) % B.length], L = Math.hypot(q[0] - p[0], q[1] - p[1]); if (L < 0.01) continue;
        const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2; if (ramps.some((l) => H.distLine(l, mx, my) < 16)) { cum += L; continue; }
        const ux = (q[0] - p[0]) / L, uy = (q[1] - p[1]) / L, lit = 0.62 + 0.38 * Math.max(0, -ux * 0.2 + uy * -0.1 + 0.6), t0 = 1 - 0.08 / lit, t1 = 1 - 0.34 / lit, tint = [0.86, 0.95, 1];
        const a = V(v, p[0], p[1], 0, cum / 72, 0, lit * t0, tint), b = V(v, q[0], q[1], 0, (cum + L) / 72, 0, lit * t0, tint), c = V(v, q[0], q[1], -dep, (cum + L) / 72, 1, lit * t1 * 0.8, tint), d = V(v, p[0], p[1], -dep, cum / 72, 1, lit * t1 * 0.8, tint);
        ix.push(a, b, c, a, c, d); cum += L; }
      G.add({ kind: 'mesh', verts: v, idx: ix, tex: 'basinWall', phase: 'pre' }); }
    // 斜路（潮の塔の下り坂・螺旋塔の上り坂）：高さの変わる白い橋帯（R01）＋その下の壁。円の広場の中（地面の高さ）には敷かない
    const walk = S.strip && S.strip.walk, RW = 18;
    if (walk) G.texture('walk', walk, 'u');
    const rOut = {}, rIn = {}; for (const e of D.edges) if (e[3] === 'forward') { rOut[e[0]] = (rOut[e[0]] || 0) + 1; rIn[e[1]] = (rIn[e[1]] || 0) + 1; }
    { const dv = [], di = [], sv = [], si = [], aspect = walk ? walk.naturalWidth / walk.naturalHeight : 960 / 128;
      for (const [sid, sg] of Object.entries(D.segments)) {
        if (!/descent|ascent/.test(zoneOf(D, sid))) continue;
        const PLs = [sg[3][0], sg[3][sg[3].length - 1]].filter((id) => { const n = D.nodes[id]; return (rOut[id] || 0) > 1 || (rIn[id] || 0) > 1 || /dead_end/.test(n[2]) || n[2] === 'start'; })
          .map((id) => ({ x: D.nodes[id][0], y: D.nodes[id][1], r: /dead_end/.test(D.nodes[id][2]) ? ROAD_W * 0.78 : PLAZA_R }));
        const inPl = (q) => Math.abs(q[2]) < 1.5 && PLs.some((p) => Math.hypot(q[0] - p.x, q[1] - p.y) < p.r);
        let P = curve3(D, sg[3]);
        for (const rev of [false, true]) { if (rev) P.reverse(); let k = 0; while (k < P.length - 1 && inPl(P[k])) k++; if (k > 0) { const a = P[k - 1], b = P[k]; let lo = 0, hi = 1; for (let it = 0; it < 12; it++) { const m = (lo + hi) / 2, q = a.map((x, j) => x + (b[j] - x) * m); if (inPl(q)) lo = m; else hi = m; } P = [a.map((x, j) => x + (b[j] - x) * hi), ...P.slice(k)]; } }
        P.reverse();
        let cum = 0, prev = null;
        for (let i = 0; i < P.length; i++) {
          const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], Lxy = Math.hypot(dx, dy) || 1, nx = -dy / Lxy, ny = dx / Lxy, p = P[i];
          if (i) cum += Math.hypot(p[0] - P[i - 1][0], p[1] - P[i - 1][1], p[2] - P[i - 1][2]);
          const z = p[2] + 0.4, u = cum / (RW * aspect);
          const l = V(dv, p[0] + nx * RW / 2, p[1] + ny * RW / 2, z, u, 1, 1), r = V(dv, p[0] - nx * RW / 2, p[1] - ny * RW / 2, z, u, 0, 1);
          const hh = z + dep, wl = [V(sv, p[0] + nx * RW / 2, p[1] + ny * RW / 2, z, cum / 32, 0, 0.72), V(sv, p[0] + nx * RW / 2, p[1] + ny * RW / 2, -dep, cum / 32, hh / 32, 0.45)],
            wr = [V(sv, p[0] - nx * RW / 2, p[1] - ny * RW / 2, z, cum / 32, 0, 0.72), V(sv, p[0] - nx * RW / 2, p[1] - ny * RW / 2, -dep, cum / 32, hh / 32, 0.45)];
          if (prev) { di.push(prev.l, prev.r, r, prev.l, r, l); for (const [A0, A1] of [[prev.wl, wl], [prev.wr, wr]]) si.push(A0[0], A1[0], A1[1], A0[0], A1[1], A0[1]); }
          prev = { l, r, wl, wr };
        }
      }
      if (si.length) G.add({ kind: 'mesh', verts: sv, idx: si, tex: 'rampWall', phase: 'pre' });
      if (di.length && walk) G.add({ kind: 'mesh', verts: dv, idx: di, tex: 'walk', phase: 'pre' });
    }
    // 塔（多角柱）：螺旋塔＝海底から海面より上へ・潮の塔＝島の上。屋上の円・潮の塔の灯
    const towers = A.towers || [], NF = 24, disc = (col, edge) => { const c = doc.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 63);
      gr.addColorStop(0, col); gr.addColorStop(0.86, col); gr.addColorStop(0.9, edge); gr.addColorStop(0.98, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gr; x.beginPath(); x.arc(64, 64, 63.5, 0, 7); x.fill(); return c; };
    towers.forEach((t, ti) => {
      const inB = H.inPoly(B, t.c[0], t.c[1]), z0 = inB ? -dep : 0, top = t.top, v = [], ix = [];
      for (let i = 0; i <= NF; i++) { const a = (i / NF) * Math.PI * 2, nx = Math.cos(a), ny = Math.sin(a), lit = 0.55 + 0.45 * Math.max(0, -nx * 0.55 + ny * 0.25 + 0.55), k = 1 - (0.62 - lit * 0.55), u = (i / NF) * Math.PI * 2 * t.r / 32;
        V(v, t.c[0] + t.r * nx, t.c[1] + t.r * ny, top, u, 0, k); V(v, t.c[0] + t.r * nx, t.c[1] + t.r * ny, z0, u, (top - z0) / 32, k * 0.92);
        if (i) { const b = i * 2; ix.push(b - 2, b, b + 1, b - 2, b + 1, b - 1); } }
      G.add({ kind: 'mesh', verts: v, idx: ix, tex: 'towerWall', phase: 'pre' });
      const stone = t.kind === 'spiral' ? 'rgb(214,206,186)' : 'rgb(196,204,210)'; G.texture('cap' + ti, disc(shade(stone, 1.08), shade(stone, 0.86)), false);
      const cv2 = []; for (const [x, y, u, w] of [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, 1, 0, 1]]) V(cv2, t.c[0] + x * t.r, t.c[1] + y * t.r, top + 0.2, u, w, 1);
      G.add({ kind: 'mesh', verts: cv2.map((x, i) => (i % 9 === 8 ? x : x)), idx: [0, 1, 2, 0, 2, 3], tex: 'cap' + ti, phase: 'post' });
    });
    // 盆地の上の海面（高さ 0.3）：モンスターが海面にいる間は濃く・海底へ潜ると薄く（旧 rfs-water と同じ濃さ）
    { const wr = 1.2, wv = doc.createElement('canvas'); wv.width = Math.ceil(bw * wr); wv.height = Math.ceil(bh * wr); const w2 = wv.getContext('2d'); w2.setTransform(wr, 0, 0, wr, -bx0 * wr, -by0 * wr);
      w2.save(); polyPath(w2, B); w2.clip(); { const sp = tp(w2, H, S, 'sea'); w2.fillStyle = sp || '#2d8fc4'; w2.fillRect(bx0, by0, bw, bh); } w2.restore();
      G.texture('water', wv, false); const v = []; for (const [x, y, u, w] of [[bx0, by0, 0, 0], [bx0 + bw, by0, 1, 0], [bx0 + bw, by0 + bh, 1, 1], [bx0, by0 + bh, 0, 1]]) V(v, x, y, 0.3, u, w, 1);
      G.add({ kind: 'mesh', verts: v, idx: [0, 1, 2, 0, 2, 3], tex: 'water', phase: 'post', name: 'water', alpha: GL_SEA_ALPHA }); }
    const sp = towers.find((t) => t.kind === 'spiral');
    function occl(cam, x, y, h, q) {
      if (!sp || cam.tilt < 5) return false;
      const P = ctx.H.project, inB = H.inPoly(B, sp.c[0], sp.c[1]), z0 = inB ? -dep : 0;
      const cT = P(cam, sp.c[0], sp.c[1], sp.top), cB = P(cam, sp.c[0], sp.c[1], z0), r = sp.r * cam.s * cB.k;
      if (q.z >= cB.z) return false;
      return q.x > cT.x - r && q.x < cT.x + r && q.y > cT.y - r * 0.6 && q.y < cB.y + r * 0.4;
    }
    const view = plane.parentElement, rays = doc.createElement('div'); rays.className = 'rfs-rays'; rays.style.setProperty('--fx', `url(${FX})`); rays.style.setProperty('--bub', `url(${BUB})`); if (view) view.insertBefore(rays, plane.nextSibling);
    let dived = null;
    function mon(h) { const u = (h || 0) < -2; if (u === dived) return; dived = u; G.alpha('water', u ? 1 - BASIN_UNDER : GL_SEA_ALPHA); rays.classList.toggle('on', u); }
    mon(0);
    return { occl, mon, el: null, rays };
  }
  let cssDone = false;
  function css(doc) {
    if (cssDone || doc.getElementById('rfs-css')) return; cssDone = true;
    const s = doc.createElement('style'); s.id = 'rfs-css';
    s.textContent = `:is(#rfp,.wbv) .rfs-3d{position:absolute;left:0;top:0;width:0;height:0;transform-style:preserve-3d;pointer-events:none}
:is(#rfp,.wbv) .rfs-floor,:is(#rfp,.wbv) .rfs-water{position:absolute;display:block}:is(#rfp,.wbv) .rfs-water{transition:opacity .7s ease}
:is(#rfp,.wbv) .rfs-q{position:absolute;left:0;top:0;transform-origin:0 0;backface-visibility:visible}
:is(#rfp,.wbv) .rfs-deck{background-color:#cfc4a6;background-repeat:repeat-x}
:is(#rfp,.wbv) .rfs-wall{opacity:.92}
:is(#rfp,.wbv) .rfs-lamp{background:linear-gradient(180deg,#fff6c8,#e7c46a)}
:is(#rfp,.wbv) .rfs-cap{position:absolute;left:0;top:0;transform-origin:0 0;border-radius:50%}
:is(#rfp,.wbv) .rfs-rays{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .7s ease;mix-blend-mode:screen;background:var(--bub) 0 0/min(140vw,620px) auto repeat,var(--fx) 0 0/auto 100% repeat-x,linear-gradient(180deg,rgba(90,180,220,.12),rgba(20,60,90,0) 55%)}
:is(#rfp,.wbv) .rfs-rays.on{opacity:1;animation:rfsRay 7s ease-in-out infinite alternate}@keyframes rfsRay{from{background-position:0 0,0 0,0 0}to{background-position:0 -180px,120px 0,0 0}}@media (prefers-reduced-motion:reduce){:is(#rfp,.wbv) .rfs-rays.on{animation:none}}
:is(#rfp,.wbv) .rfs-glow{position:absolute;left:0;top:0;transform-origin:0 0;border-radius:50%;background:radial-gradient(circle,#fffbe0 0 30%,rgba(255,236,150,.55) 45%,rgba(255,236,150,0) 70%)}`;
    doc.head.appendChild(s);
  }
  /** 2026-10-20 第4便：描く道の中心線（roads と同じ鎖・同じ丸め）＝マスを置く線。海面の道は 16・海底の道は 18。斜路（螺旋塔・潮の塔）は道の帯ではない＝含めない */
  function lines(D, H) {
    const L = (ok, r) => H.roadChains(D, Object.entries(D.segments).filter(([sid]) => ok(sid))).map((c) => ({ ids: c.ids, P: H.roadPts(D, c.ids, r) }));
    return [...L((sid) => isSurface(zoneOf(D, sid)), 16), ...L((sid) => zoneOf(D, sid) === 'undersea' && isGlass(D, sid), 18), ...L((sid) => zoneOf(D, sid) === 'undersea' && !isGlass(D, sid), 18)];
  }
  const api = { FILES, A2, TEX, STRIPS, PLAZA, WALL, FX, LM_BASE, LM_ROUTE, ALL_LM, load, warm, ground, roads, lines, glKit, scatter, apron, build3d, curve3, m3, lm, goal, isGlass };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.MMRF_SEA = api;
})(typeof window !== 'undefined' ? window : globalThis);
