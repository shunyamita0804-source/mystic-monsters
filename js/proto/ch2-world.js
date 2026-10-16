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
  const A2 = './assets/fields/ch2/art_1016/', U = (n) => A2 + n + '.webp';
  // 正式素材（名前＝納品の名前のまま。tile＝くり返し1枚の大きさ（世界の単位））
  const TEX = { sea: ['open_sea_water', 110], shallow: ['shallow_turquoise_water', 96], sand: ['coastal_sand_base', 72], grass: ['G02b_coastal_grass_tile', 96],
    white: ['coastal_white_stone_road', 56], deck: ['sea_bridge_deck', 72], seabed: ['undersea_sand_base', 96], glass: ['glass_corridor_floor', 38],
    temple: ['sunken_temple_road', 40], ruins: ['sunken_ruins_ground', 84] };
  const STRIPS = { walk: 'R01_white_bridge_walkstrip', foam: 'E03_shore_foam_edge_tile', rim: 'E04_seabed_cliff_edge_tile', roof: 'U01_glass_corridor_roof_strip' };
  const PLAZA = ['U08_ruins_plaza_base', 'U08_ruins_plaza_cracked_a', 'U08_ruins_plaza_cracked_b'];
  const WALL = { tower: U('R05_spiral_tower_wall_tile'), ramp: U('R07_ramp_sidewall_tile'), basin: U('R08_seabed_basin_wall_tile') };
  const FX = U('FX04_underwater_light_screen_strip');
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
      o.formal = Object.values(o.tex).filter(Boolean).length;   // 読めた正式の地面の数（確認用）
      return o;
    });
  }
  /** 出発の前に読み始めておく（ブラウザの取り置き）。1回だけ */
  let warmed = null;
  function warm() { if (warmed || !root.Image) return warmed; const fs = [...Object.values(TEX).map((t) => U(t[0])), ...Object.values(STRIPS).map(U), ...PLAZA.map(U), ...Object.values(WALL), FX, ...ALL_LM.map(U)];
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
    const segs = Object.entries(D.segments).filter(([sid]) => isSurface(zoneOf(D, sid)));
    const pts = segs.map(([, s]) => H.curvePts(s[3].map((id) => D.nodes[id])));
    const deck = tp(g, H, S, 'deck'), white = tp(g, H, S, 'white');
    g.lineCap = g.lineJoin = 'round';
    g.save(); g.translate(0, 7); g.strokeStyle = 'rgba(6,30,52,.38)'; g.lineWidth = CURB_W;
    for (const P of pts) { pathOf(g, P); g.stroke(); }
    g.restore();
    if (deck) {
      g.strokeStyle = 'rgb(168,160,140)'; g.lineWidth = CURB_W; for (const P of pts) { pathOf(g, P); g.stroke(); }   // 縁石
      g.strokeStyle = deck; g.lineWidth = ROAD_W; for (const P of pts) { pathOf(g, P); g.stroke(); }
      if (white) { g.save(); g.beginPath(); for (const { P } of regionsOf(D)) { P.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); } g.clip();
        g.strokeStyle = white; g.lineWidth = ROAD_W; for (const P of pts) { pathOf(g, P); g.stroke(); } g.restore(); }
      g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; for (const P of pts) for (const sg of [-1, 1]) edgeLine(g, P, ROAD_W / 2 * sg);   // 縁の光
    } else if (art.strip) for (const P of pts) H.stripAlong(g, P, art.strip, H.ART.strip.w, bx);
    else { g.strokeStyle = '#d9cfb0'; g.lineWidth = 18; for (const P of pts) { pathOf(g, P); g.stroke(); } }
    hubs(g, D, (sid) => isSurface(zoneOf(D, sid)), art, H, (n) => (onLand(D, H, n[0], n[1]) ? white || deck : deck));
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
  const LM_BASE = {
    START: ['harbor_start_gate', 52, 8], LOWER_GATE: ['undersea_descent_gate', 40, 6], RIVAL: ['rival_pass_gate', 34, 10], Q: ['glass_corridor_arch', 50, 4],
    STATUE: ['L07_winged_sea_god_statue', 30, 0, [-34, -20]], RANDOM_DEN: ['L11_sunken_ship_den_closed', 44, 20, null, 'L11_sunken_ship_den_open'],
    REWARD5: ['coastal_rock_shells', 40, 20], R_SPECIAL: ['L10_coral_treasure_landmark', 34, 20],
  };
  const LM_ROUTE = {
    A: { CHALLENGE: ['L09_western_sealed_sea_gate', 48, 14], L_CHEST: ['coastal_lighthouse', 30, 20], R_CHEST: ['L04_shell_shrine', 32, 20], L_ALTAR: ['L05_temple_island_altar', 50, 20], L_LATE_ALTAR: ['L08_western_white_tower', 34, 20], UPPER_GATE: ['undersea_ascent_gate', 36, 4] },
    B: { CHALLENGE: ['U03_sunken_temple_gate', 38, 14], L_CHEST: ['coastal_lighthouse', 30, 20], R_CHEST: ['L05_temple_island_altar', 50, 20], L_ALTAR: ['L08_western_white_tower', 34, 20], L_LATE_ALTAR: ['U05_sealed_chamber_altar', 40, 20] },
    C: { CHALLENGE: ['U03_sunken_temple_gate', 38, 14], L_CHEST: ['L04_shell_shrine', 32, 20], R_CHEST: ['undersea_treasure_vault', 32, 20], L_ALTAR: ['trial_monolith', 40, 20], L_LATE_ALTAR: ['U05_sealed_chamber_altar', 40, 20] },
  };
  const ALL_LM = [...new Set([...Object.values(LM_BASE), ...Object.values(LM_ROUTE).flatMap(Object.values)].flatMap((v) => [v[0], v[4]].filter(Boolean)).concat(['ocean_arena', 'R05_spiral_tower_door', 'R05_spiral_tower_beacon', 'arena_approach_gate', 'L01_harbor_town_cluster', 'chapter2_sea_medallion']))];
  const LM_CACHE = new WeakMap();
  /** 道のデータの目印（設計の standin・Chapter 1 の代用）を正式の絵へ。UPPER_GATE が無いルートは螺旋塔の上り坂の入口に上り門 */
  function lm(D) {
    if (LM_CACHE.has(D)) return LM_CACHE.get(D);
    const M = Object.assign({}, LM_BASE, LM_ROUTE[D.route] || {}), out = [];
    for (const [node, v] of Object.entries(M)) if (D.nodes[node]) out.push({ node, file: U(v[0]), w: v[1], along: v[2] || 0, off: v[3] || undefined, z: -30, open: v[4] ? U(v[4]) : undefined });
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
    const SEA = [[U('E02_small_rocky_islet'), 22, 0.5], [U('E02_tidal_sea_stack'), 10, 0.5]];
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
    const glassL = under.filter(([sid]) => isGlass(D, sid)).map(([, s]) => H.curvePts(s[3].map((id) => D.nodes[id])));
    const templeL = under.filter(([sid]) => !isGlass(D, sid)).map(([, s]) => H.curvePts(s[3].map((id) => D.nodes[id])));
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
    for (const [sid, s] of Object.entries(D.segments)) {
      if (!/descent|ascent/.test(zoneOf(D, sid))) continue;
      const P0 = curve3(D, s[3]), P = P0.filter((q, i) => i % 2 === 0 || i === P0.length - 1); let cum = 0;   // 約 8 単位ごとの板
      for (let i = 0; i < P.length - 1; i++) {
        const a = P[i], b = P[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], Lxy = Math.hypot(dx, dy), L = Math.hypot(Lxy, dz); if (L < 0.2) continue;
        const U = [dx / L, dy / L, dz / L], side = [-dy / Lxy, dx / Lxy, 0];
        const T = [a[0] - side[0] * RW / 2, a[1] - side[1] * RW / 2, a[2] + 0.4];
        quad(doc, g3, T, U, side, L + 0.5, RW, 'rfs-deck', stripUrl ? { backgroundImage: `url(${stripUrl})`, backgroundSize: `${RW * 960 / 128}px 100%`, backgroundPosition: `${-cum.toFixed(1)}px 0` } : null);
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
    const view = plane.parentElement, rays = doc.createElement('div'); rays.className = 'rfs-rays'; rays.style.setProperty('--fx', `url(${FX})`); if (view) view.insertBefore(rays, plane.nextSibling);
    let dived = null;
    function mon(h) { const u = (h || 0) < -2; if (u === dived) return; dived = u; wv.style.opacity = u ? String(1 - BASIN_UNDER) : String(BASIN_ALPHA); rays.classList.toggle('on', u); }
    mon(0);
    return { occl, mon, el: g3, rays };
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
:is(#rfp,.wbv) .rfs-rays{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .7s ease;mix-blend-mode:screen;background:var(--fx) 0 0/auto 100% repeat-x,linear-gradient(180deg,rgba(90,180,220,.12),rgba(20,60,90,0) 55%)}
:is(#rfp,.wbv) .rfs-rays.on{opacity:1;animation:rfsRay 7s ease-in-out infinite alternate}@keyframes rfsRay{from{background-position:0 0,0 0}to{background-position:120px 0,0 0}}@media (prefers-reduced-motion:reduce){:is(#rfp,.wbv) .rfs-rays.on{animation:none}}
:is(#rfp,.wbv) .rfs-glow{position:absolute;left:0;top:0;transform-origin:0 0;border-radius:50%;background:radial-gradient(circle,#fffbe0 0 30%,rgba(255,236,150,.55) 45%,rgba(255,236,150,0) 70%)}`;
    doc.head.appendChild(s);
  }
  const api = { FILES, A2, TEX, STRIPS, PLAZA, WALL, FX, LM_BASE, LM_ROUTE, ALL_LM, load, warm, ground, roads, scatter, apron, build3d, curve3, m3, lm, goal, isGlass };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.MMRF_SEA = api;
})(typeof window !== 'undefined' ? window : globalThis);
