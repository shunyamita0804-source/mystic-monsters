// =========================================================
// Chapter 1 Pattern A 道路先行の試作 — 1枚の世界ビュー `MMRF_WORLD`（2026-10-10・絵なしの技術検証。正式ではない）
//
//  URL に ?chapterBoard=roadfirst&rfView=world を付けたときだけ js/proto/roadfirst-view.js が使う（それ以外は何もしない）。
//  方針（ユーザー決定 2026-10-10）：添付の全体マップ＝原本の座標（MMRF_DATA の 1024×1536 単位）を正式の世界座標として1枚の世界にする。
//    ・地面と道はこのファイルが canvas に描く（道の形は原本の地点の並びだけから＝作り道・欠けた道が起きない）。今は絵が無いので仮の色。
//      絵が届いたら drawGround／drawRoads の塗りをテクスチャに替えるだけ（A・B・C・D 群）。
//    ・地面の板を CSS 3D で手前に傾ける（tilt）。マス・モンスターは傾けずに立てて置く（板の上の点を同じ式で画面へ写す＝project）。
//    ・開始の俯瞰：傾けない真上で世界全体 → START へ寄りながら傾ける。追従：今の道で6マス先までが空いている所に入る倍率。
//  移動・サイコロ・保存は MMRF_CORE／MMRF_PLAY／roadfirst-view.js のまま（ここでは決めない・状態を持たない＝カメラは保存しない）。
//  純粋な関数（project・fitZoom・lookahead）は Node でも動く（tests/roadfirst-world-1010.test.mjs）。
// =========================================================
(function (root) {
  'use strict';
  const WORLD = { w: 1024, h: 1536 };
  const DEF = {
    tilt: 40,            // 地面を手前に傾ける角度（度）【検証用の値】
    persp: 900,          // 遠近の強さ（CSS の perspective・px）
    res: 2,              // 地面の canvas の細かさ（px／単位）
    chunk: 512,          // canvas の区画（px）
    roadW: 18,           // 道の幅（単位）
    tileW: 13,           // マスの幅（単位）。原本の間隔は中央値 21・枝の D_LLA／D_R5 は約15
    tilePx: [22, 58],    // 追従のときのマスの画面の大きさの下限・上限（px。俯瞰では下限なし）
    sMin: 1.3, sMax: 4.2,// 追従の倍率の範囲（px／単位・注視点の奥行きで）
    ahead: 6,            // 何マス先まで見せるか
    anchor: 0.70,        // モンスターを空いている所の上から何割の高さに置くか
    margin: 22,          // 空いている所の内側の余白（px）
    art: null,           // 2026-10-10 第1便の絵の試し貼り（&rfArt=1010）＝{ base }。無ければ仮の色のまま
    // 2026-10-12 試遊修正（本編の Chapter 1＝js/chapter/world-board.js が渡す。試作の既定は従来どおり）
    focus: false,        // true＝今の道筋（info.focus＝直前の数地点・今の地点・先の地点）以外のマスを薄くし、地面に道筋のまわりだけを明るく残す薄い幕
    monRatio: 0,         // >0＝モンスターの幅をその地点のマスの幅 × この倍率に（0＝従来の 24単位）
    zoomTau: 170,        // 追従の倍率を寄せる速さ（ms。大きいほどゆっくり）
  };
  // 第1便の絵（assets/proto/board_art_1010/README.md）。大きさは世界の単位
  const ART = {
    ground: { file: 'ground_grass.webp', tile: 128 },       // 草地のくり返し1枚＝128単位
    road: { file: 'road_flagstone.webp', tile: 46 },        // 道の中の敷石のくり返し1枚＝46単位
    strip: { file: 'strip_road_stone.webp', w: 23 },        // 第2便の追加：直線の石の道（縁石つき）を道筋に沿って並べる（幅＝縁石まで 23単位）
    // 景物の割合（p の合計 1）。第2便で針葉樹・茂み・石柱・小花を追加
    props: [{ key: 'tree', file: 'prop_tree.webp', w: 30, p: 0.30 }, { key: 'conifer', file: 'prop_conifer.webp', w: 17, p: 0.22 },
      { key: 'shrub', file: 'prop_shrub.webp', w: 17, p: 0.18 }, { key: 'rock', file: 'prop_rock.webp', w: 24, p: 0.12 },
      { key: 'flowers', file: 'prop_flowers.webp', w: 13, p: 0.10 }, { key: 'pillar', file: 'prop_pillar.webp', w: 11, p: 0.04 },
      { key: 'mossy', file: 'prop_mossy_rock.webp', w: 16, p: 0.04 }],   // 第4便：苔むした岩
    goal: { file: 'goal_arena.webp', w: 150, dy: 14 },      // GOAL の後ろ（足もと＝GOAL の 14単位手前）
    terrain: { valley: { file: 'ground_valley.webp', tile: 72 }, water: { file: 'ground_water.webp', tile: 80 },   // 谷底は小さく＝遠く深く見せる
      cloud: { file: 'ground_cloud.webp', tile: 150 }, canopy: { row: 13 },   // 第4便：雲海（A6）・森の樹冠（B3 の帯を段に重ねたくり返し・段の間隔 13単位）
      edges: { grass: { file: 'edge_grass.webp', w: 22, shift: 5 }, rock: { file: 'edge_rock.webp', w: 22, shift: 5 },
        shore: { file: 'edge_shore.webp', w: 16, shift: 2 }, cloud: { file: 'edge_cloud.webp', w: 26, shift: 7 }, forest: { file: 'edge_forest.webp', w: 30, shift: 3, flip: true } }, depth: 0.32 },
    // 第4便：水辺の景物（谷の中の川に沿って並べる。滝は川の始まり）・山の岩峰（後半の山の区域の道から離れた所）
    water: { fall: { file: 'prop_waterfall.webp', w: 40 }, rocks: { file: 'prop_stream_rocks.webp', w: 17 }, lilies: { file: 'prop_lilies.webp', w: 15 }, reeds: { file: 'prop_reeds.webp', w: 12 }, every: 34 },
    peaks: { file: 'prop_peak.webp', at: [[160, 112, 62], [330, 96, 54], [700, 84, 56], [872, 96, 60], [994, 262, 50], [58, 486, 58], [236, 566, 50], [800, 560, 54]] },   // shift＝崖の帯を谷の側へずらす（岩肌が谷へ垂れる）・depth＝谷の暗さ
    // 決まった地点の目印（第2便・第3便）。along＝進む向きへずらす（行き止まりは奥へ）・side＝進む向きの右へずらす・z＝前後（負＝モンスターより奥）
    //   off＝地点からの決まったずれ（石像＝3本の道の分かれ目の奥の空き地）。門（START・下門・上門）は地点のすぐ奥で道をまたぐ＝モンスターは門の前に立つ。open＝隠れ家が開いている回の絵（st.randOpen）
    landmarks: [{ node: 'START', file: 'lm_start_gate.webp', w: 40, along: 7, z: -30 },
      { node: 'LOWER_GATE', file: 'lm_lower_gate.webp', w: 46, along: 3, z: -30 }, { node: 'UPPER_GATE', file: 'lm_upper_gate.webp', w: 52, along: 3, z: -30 },
      { node: 'CHALLENGE', file: 'lm_seal_gate.webp', w: 46, along: 14, z: -30 }, { node: 'STATUE', file: 'lm_lion.webp', w: 38, off: [-36, -21], z: -30 },
      { node: 'L_CHEST', file: 'lm_moss_tower.webp', w: 38, along: 20, z: -30 }, { node: 'R_CHEST', file: 'lm_watchpost.webp', w: 40, along: 20, z: -30 },
      { node: 'L_ALTAR', file: 'lm_forest_altar.webp', w: 46, along: 22, z: -30 }, { node: 'L_LATE_ALTAR', file: 'lm_cliff_shrine.webp', w: 40, along: 20, z: -30 },
      { node: 'REWARD5', file: 'lm_watch_statue.webp', w: 42, along: 20, z: -30 }, { node: 'R_SPECIAL', file: 'lm_rainbow_falls.webp', w: 44, along: 22, z: -30 },
      { node: 'RANDOM_DEN', file: 'lm_den_closed.webp', open: 'lm_den_open.webp', w: 42, along: 20, z: -30 }],
  };
  // 2026-10-11 地形の範囲（設計：68 Scene の表の景観の説明から）。谷＝輪になった道の内側（崩落の谷・中央の崖）＋石橋の下を横切る谷の腕。
  //   loop＝区間を順にたどった多角形（rev＝逆向き）・arms＝谷の腕の中心線と幅・bridges＝谷の上を渡る区間（道のまわりを陸にしない）・water＝谷の中の水（滝の側）
  const TERRAIN = [
    { id: 'collapse', edge: 'grass',   // 序盤の崩落の谷（Scene03〜20）。左の古石橋 EL02・右の滝の前の石橋 ER02
      loop: [['EL01'], ['EL02'], ['EL03'], ['EL04'], ['ER04', 1], ['ER03', 1], ['ER02', 1], ['ER01', 1]],
      arms: [{ line: [[300, 1150], [275, 1215], [230, 1310], [160, 1430], [95, 1560]], w: 48 }, { line: [[724, 1150], [749, 1212], [796, 1310], [868, 1430], [935, 1560]], w: 48 }],
      bridges: ['EL02', 'ER02'], water: [{ line: [[690, 1120], [749, 1212], [796, 1310], [868, 1430], [935, 1560]], w: 26 }] },
    { id: 'central', edge: 'rock',     // 中盤の中央の崖（Scene24〜33）。左の石橋 Q_L2・右の滝側の石橋 Q_R2
      loop: [['Q_L1'], ['Q_L2'], ['Q_L3'], ['Q_L4'], ['Q_R4', 1], ['Q_R3', 1], ['Q_R2', 1], ['Q_R1', 1]],
      arms: [{ line: [[410, 770], [372, 794], [325, 856], [262, 938]], w: 44 }, { line: [[614, 770], [652, 794], [699, 856], [762, 938]], w: 44 }],
      bridges: ['Q_L2', 'Q_R2'], water: [{ line: [[600, 745], [652, 794], [699, 856], [762, 938]], w: 22 }] },
    // 第4便（2026-10-11）：後半の山の区域＝左右の輪の内側が雲海（Scene36〜62「山並み」「雲海」）→ 真ん中の LATE_SAFE は雲海の上の尾根（中央の安全な尾根）
    { id: 'sky_l', kind: 'cloud', edge: 'cloud', loop: [['LATE_L1'], ['LATE_L_FAIL'], ['LATE_L_FAIL_JOIN'], ['LATE_L_DONE'], ['LATE_SAFE', 1]], arms: [], bridges: [], water: [] },
    { id: 'sky_r', kind: 'cloud', edge: 'cloud', loop: [['LATE_R1'], ['LATE_R2'], ['LATE_R3'], ['LATE_R_DONE'], ['LATE_SAFE', 1]], arms: [], bridges: [], water: [] },
    // 森（樹冠）：START の両側の針葉樹林（Scene01）・左の祭壇のまわり（Scene11〜13）・左下の岩棚の森。道のまわり・谷・目印のまわりは空ける
    { id: 'forest_s', kind: 'forest', edge: 'forest', wobble: 12, poly: [[300, 1352], [470, 1338], [470, 1536], [228, 1536]], arms: [], bridges: [], water: [] },
    { id: 'forest_se', kind: 'forest', edge: 'forest', wobble: 12, poly: [[554, 1338], [724, 1352], [796, 1536], [554, 1536]], arms: [], bridges: [], water: [] },
    { id: 'forest_w', kind: 'forest', edge: 'forest', wobble: 12, poly: [[0, 872], [300, 872], [452, 948], [248, 1036], [120, 1006], [0, 1010]], arms: [], bridges: [], water: [] },
    { id: 'forest_sw', kind: 'forest', edge: 'forest', wobble: 12, poly: [[0, 1262], [196, 1238], [214, 1330], [120, 1536], [0, 1536]], arms: [], bridges: [], water: [] },
  ];
  const ROAD_LAND = 18;   // 道の中心から谷のふちまで（単位）＝道の両側に残す陸
  const APRON = 640;   // 世界の外に続ける草地の幅（単位）
  const rad = (d) => (d * Math.PI) / 180;

  // ---- 純粋な関数 ----
  /** 世界の点 (x, y) → 画面の点。cam＝{ tx, ty（注視点）, s, tilt（度）, P, ax, ay（注視点を写す画面の位置） }。k＝遠近の縮み */
  function project(cam, x, y) {
    const X = (x - cam.tx) * cam.s, Y = (y - cam.ty) * cam.s, th = rad(cam.tilt);
    const z = Y * Math.sin(th), k = cam.P / (cam.P - z);
    return { x: cam.ax + X * k, y: cam.ay + Y * Math.cos(th) * k, k };
  }
  /** 点がすべて rect（{ l, t, r, b }）の内側に入る最大の倍率（二分探索）。入らなければ sMin */
  function fitZoom(cam, pts, rect, sMin, sMax) {
    const ok = (s) => pts.every((p) => { const q = project(Object.assign({}, cam, { s }), p[0], p[1]); return q.x >= rect.l && q.x <= rect.r && q.y >= rect.t && q.y <= rect.b; });
    if (ok(sMax)) return sMax;
    if (!ok(sMin)) return sMin;
    let lo = sMin, hi = sMax;
    for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; if (ok(m)) lo = m; else hi = m; }
    return lo;
  }
  /** 今の地点から先の地点（6マス先まで・分かれ目のあとはそれぞれ3マスまで）。first＝最初の一歩の候補（MMRF_CORE.options の dst）。back＝枝を戻る途中の区間 */
  function lookahead(D, node, first, back, n, per) {
    n = n || DEF.ahead; per = per || 3;
    const fwd = {}; for (const e of D.edges) if (e[3] === 'forward') (fwd[e[0]] = fwd[e[0]] || []).push(e[1]);
    if (back && D.segments[back]) {   // 行き止まりから戻る途中：その枝を逆にたどる
      const list = D.segments[back][3], i = list.indexOf(node);
      return i > 0 ? list.slice(Math.max(0, i - n), i).reverse() : [];
    }
    const out = [], seen = new Set([node]);
    const walk = (id, left, nexts) => {
      if (left <= 0) return;
      const ns = (nexts || fwd[id] || []).filter((x) => !seen.has(x));
      const k = ns.length > 1 ? Math.min(left, per) : left;
      for (const x of ns) { seen.add(x); out.push(x); walk(x, k - 1); }
    };
    walk(node, n, first && first.length ? first : null);
    return out;
  }

  // ---- 画面 ----
  function create(host, D, P, o) {
    o = Object.assign({}, DEF, Object.fromEntries(Object.entries(o || {}).filter(([, v]) => v !== undefined)));
    const doc = host.ownerDocument;
    const wrap = doc.createElement('div'); wrap.className = 'rfw';
    const plane = doc.createElement('div'); plane.className = 'rfw-plane';
    const bb = doc.createElement('div'); bb.className = 'rfw-bb';
    const title = doc.createElement('div'); title.className = 'rfw-title'; title.innerHTML = '<small>CHAPTER 1</small>はじまりの草原<em>全体マップ</em>';
    wrap.appendChild(plane); wrap.appendChild(bb); wrap.appendChild(title); host.appendChild(wrap);
    css(doc);
    const W = Math.ceil(WORLD.w * o.res), H = Math.ceil(WORLD.h * o.res);
    plane.style.width = WORLD.w + 'px'; plane.style.height = WORLD.h + 'px';
    // 地面と道を区画ごとの canvas に1回だけ描く（区画の大きさ chunk px）
    const chunks = [], art = {};
    for (let y = 0; y < H; y += o.chunk) for (let x = 0; x < W; x += o.chunk) {
      // 区画どうしを 1px 重ねる（境目に細い線が出ないように）
      const c = doc.createElement('canvas'); const cw = Math.min(o.chunk, W - x) + 2, ch = Math.min(o.chunk, H - y) + 2;
      c.width = cw; c.height = ch; c.className = 'rfw-chunk'; c._x = x - 1; c._y = y - 1;
      c.style.left = (x - 1) / o.res + 'px'; c.style.top = (y - 1) / o.res + 'px'; c.style.width = cw / o.res + 'px'; c.style.height = ch / o.res + 'px';
      plane.appendChild(c); chunks.push(c);
    }
    // 2026-10-12：道筋のまわりだけを明るく残す薄い幕（地面の区画の上・マスや景物の下。世界の半分の細かさ）。o.focus のときだけ
    let veil = null, veilSig = '';
    if (o.focus) { veil = doc.createElement('canvas'); veil.className = 'rfw-veil'; veil.width = WORLD.w / 2; veil.height = WORLD.h / 2;
      Object.assign(veil.style, { left: '0px', top: '0px', width: WORLD.w + 'px', height: WORLD.h + 'px' }); }
    function paintVeil(ids) {
      const sig = ids.join(','); if (!veil || sig === veilSig) return; veilSig = sig;
      const g = veil.getContext('2d'); g.setTransform(0.5, 0, 0, 0.5, 0, 0); g.globalCompositeOperation = 'source-over';
      g.clearRect(0, 0, WORLD.w, WORLD.h); g.fillStyle = 'rgba(8,18,30,.46)'; g.fillRect(0, 0, WORLD.w, WORLD.h);
      const set = new Set(ids), lines = [];
      for (const e of D.edges) if (set.has(e[0]) && set.has(e[1])) lines.push([D.nodes[e[0]], D.nodes[e[1]]]);
      g.globalCompositeOperation = 'destination-out'; g.lineCap = 'round'; g.lineJoin = 'round';
      for (const [w, a] of [[92, 0.22], [72, 0.3], [54, 0.45], [38, 1]]) {   // 外ほど薄く消す＝ふちがやわらかい
        g.strokeStyle = `rgba(0,0,0,${a})`; g.fillStyle = g.strokeStyle; g.lineWidth = w;
        for (const [p, q] of lines) { g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); }
        for (const id of ids) { const n = D.nodes[id]; if (n) { g.beginPath(); g.arc(n[0], n[1], w / 2, 0, 7); g.fill(); } }
      }
      g.globalCompositeOperation = 'source-over';
    }
    function paintChunk(c) { const g = c.getContext('2d'); g.setTransform(o.res, 0, 0, o.res, -c._x, -c._y);
      const bx = [c._x / o.res, c._y / o.res, c.width / o.res, c.height / o.res];
      drawGround(g, D, bx[0], bx[1], bx[2], bx[3], art); drawTerrain(g, D, o, art, bx); drawRoads(g, D, o, art, bx); }
    // 区画は数フレームに分けて描く（1回の長い処理で画面を止めない。iPhone で開始の俯瞰が引っかからないように）。今の注視点に近い区画から
    let queue = [], painted = false, artDone = !o.art; const dead = () => typeof S !== 'undefined' && S.dead;   // artDone＝絵の読み込みが終わった（失敗した絵は仮の色で描く＝読み込みは必ず終わる）
    function paint(sync) {
      if (sync || !root.requestAnimationFrame) { queue = []; chunks.forEach(paintChunk); painted = true; return; }
      const c0 = (typeof S !== 'undefined' && S.cam) || { tx: WORLD.w / 2, ty: WORLD.h }; const d = (c) => Math.hypot(c._x / o.res + 128 - c0.tx, c._y / o.res + 128 - c0.ty);
      const idle = !queue.length; queue = chunks.slice().sort((a, b) => d(a) - d(b)); painted = false;
      const step = () => { if (dead()) return; const t0 = root.performance.now(); while (queue.length && root.performance.now() - t0 < 10) paintChunk(queue.shift());
        if (queue.length) root.requestAnimationFrame(step); else painted = true; };
      if (idle) root.requestAnimationFrame(step);
    }
    if (!o.art) paint(true);   // 絵を貼るときは読み込みが終わってから1回だけ描く（失敗したら仮の色で描く）
    if (veil) plane.appendChild(veil);
    // マス（全地点・立てて置く）とモンスター
    const tiles = {};
    for (const id of Object.keys(D.nodes)) {
      const d = doc.createElement('div'); d.className = 'rfw-tile'; d.dataset.node = id; d.innerHTML = '<img alt="" draggable="false"><span></span>';
      bb.appendChild(d); tiles[id] = { el: d, img: d.firstChild, lab: d.lastChild, src: '', mk: '', used: false };
    }
    const rootEl = host.closest ? host.closest('#rfp,.wbv') || wrap : wrap;   // 2026-10-11 本編の Chapter 1（js/chapter/world-board.js の .wbv）でも同じ描画
    const mon = doc.createElement('div'); mon.className = 'rfw-mon'; mon.innerHTML = `<img alt="" draggable="false" src="${o.monSrc || './assets/monsters/2p5d/solamo.webp'}">`; bb.appendChild(mon);
    // 景物（木・岩）と GOAL の大会会場：立てて置く（第1便の絵があるときだけ）
    const props = [];
    if (o.art) {
      const base = o.art.base || './assets/proto/board_art_1010/';
      const load = (f) => new Promise((res) => { const im = new root.Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = base + f; });
      const T = ART.terrain;
      const EK = Object.keys(T.edges);
      Promise.all([load(ART.ground.file), load(ART.road.file), o.art.road === 'pattern' ? null : load(ART.strip.file),
        load(T.valley.file), load(T.water.file), load(T.cloud.file), ...EK.map((k) => load(T.edges[k].file))]).then(([gi, ri, si, vi, wi, ci, ...ei]) => {
        if (S.dead) return; art.ground = gi; art.road = ri; art.strip = si;
        if (vi) { art.terrain = terrainMasks(doc, D, o); art.valley = vi; art.water = wi; art.cloud = ci; art.edges = {}; EK.forEach((k, i) => { art.edges[k] = ei[i]; });
          if (art.edges.forest) art.canopy = canopyTile(doc, art.edges.forest); }
        if (gi || ri) { paint(); wrap.classList.add('art'); } else paint();
        artDone = true;
        // 世界の外（端へ寄ったときに見える所）も同じ草地で続ける：平面の中の安い背景（canvas は世界の中だけ）
        if (gi) { const ap = doc.createElement('div'); ap.className = 'rfw-apron'; const m = APRON;
          Object.assign(ap.style, { left: -m + 'px', top: -m + 'px', width: WORLD.w + 2 * m + 'px', height: WORLD.h + 2 * m + 'px', backgroundImage: `url(${base + ART.ground.file})`,
            backgroundSize: `${ART.ground.tile}px ${ART.ground.tile}px`, backgroundPosition: `${m % ART.ground.tile}px ${m % ART.ground.tile}px` });
          plane.insertBefore(ap, plane.firstChild); } });
      const add = (file, x, y, w, z, cls) => { const d = doc.createElement('img'); d.className = 'rfw-prop' + (cls ? ' ' + cls : ''); d.alt = ''; d.draggable = false; d.src = base + file; bb.appendChild(d); props.push({ el: d, x, y, w, z: z || 0 }); };
      for (const q of scatter(D, o)) add(q.file, q.x, q.y, q.w);
      const gn = D.nodes.GOAL; if (gn) add(ART.goal.file, gn[0], gn[1] + ART.goal.dy, ART.goal.w, -40, 'rfw-goal');
      for (const L of ART.landmarks) { const at = landmarkAt(D, L); if (at) { add(L.file, at[0], at[1], L.w, L.z || 0, 'rfw-lm'); props[props.length - 1].L = L; } }
      for (const q of waterProps(D)) add(q.file, q.x, q.y, q.w, q.z || 0, 'rfw-wp');   // 第4便：川の景物
      for (const [x, y, w] of ART.peaks.at) add(ART.peaks.file, x, y, w, -20, 'rfw-peak');   // 第4便：山の岩峰
    }
    const S = {
      cam: { tx: WORLD.w / 2, ty: WORLD.h / 2, s: 1, tilt: 0, P: o.persp, ax: 0, ay: 0 }, goal: null, mon: null, monGoal: null,
      raf: 0, last: 0, intro: null, view: null, frames: [], dead: false,
    };
    // 2026-10-11：モンスターの足を地点に合わせる＝静止の立ち絵の実際の縦横比で上へずらす（旧：一律 0.92＝縦長・横長の絵で浮く・沈む）。読み込み前は 0.92
    { const mi = mon.firstChild, fit = () => { if (mi.naturalWidth) { S.monAh = (mi.naturalHeight / mi.naturalWidth) * (o.monFoot || 0.97); S.dirty = true; } }; if (mi.complete) fit(); else mi.addEventListener('load', fit, { once: true }); }
    function viewRect() { const v = o.view ? o.view() : null; const r = host.getBoundingClientRect(); return v || { W: r.width, H: r.height, top: 0, bottom: r.height, right: r.width }; }
    /** 俯瞰のカメラ（傾けない・世界全体が画面に入る） */
    function overviewCam(v) {
      const xs = Object.values(D.nodes).map((n) => n[0]), ys = Object.values(D.nodes).map((n) => n[1]);
      const x0 = Math.min(...xs) - 30, x1 = Math.max(...xs) + 30, y0 = Math.min(...ys) - 30, y1 = Math.max(...ys) + 30;
      const s = Math.min(v.W / (x1 - x0), (v.H - 70) / (y1 - y0));
      return { tx: (x0 + x1) / 2, ty: (y0 + y1) / 2, s, tilt: 0, P: o.persp, ax: v.W / 2, ay: v.H / 2 + 26 };
    }
    /** 追従のカメラ：モンスター（mx, my）と先の地点 pts が空いている所に入る倍率 */
    function followCam(v, mx, my, pts) {
      const rect = { l: o.margin, r: v.right - o.margin, t: v.top + o.margin, b: v.bottom - o.margin };
      const fh = v.bottom - v.top, ax = (rect.l + rect.r) / 2, ay = v.top + fh * o.anchor;
      let tx = mx; if (pts.length) { const xs = pts.map((p) => p[0]).concat(mx); tx = (Math.min(...xs) + Math.max(...xs)) / 2 * 0.6 + mx * 0.4; }
      const cam = { tx, ty: my, s: o.sMax, tilt: o.tilt, P: o.persp, ax, ay };
      cam.s = fitZoom(cam, pts.concat([[mx, my]]), rect, o.sMin, o.sMax);
      return cam;
    }
    function apply() {
      const c = S.cam;
      // カメラもモンスターも動いていなければ描き直さない（止まっている間は何もしない）
      const sig = [c.tx, c.ty, c.s * 100, c.tilt * 10, c.ax, c.ay, S.mon ? S.mon[0] : 0, S.mon ? S.mon[1] : 0, S.dirty ? 1 : 0].map((x) => Math.round(x * 10)).join(',');
      if (sig === S.sig) return; S.sig = sig; S.dirty = false;
      // 平面：注視点を原点に移して → 倍率 → 傾き → 画面の位置へ（project と同じ式。perspective-origin＝注視点の画面位置）
      wrap.style.perspective = c.P + 'px'; wrap.style.perspectiveOrigin = `${c.ax}px ${c.ay}px`;
      plane.style.transform = `translate(${c.ax}px,${c.ay}px) rotateX(${c.tilt}deg) scale(${c.s}) translate(${-c.tx}px,${-c.ty}px)`;
      const v = S.view, Wd = v ? v.W : 400, Hd = v ? v.H : 800;
      for (const [id, t] of Object.entries(tiles)) {
        const n = D.nodes[id], q = project(c, n[0], n[1]);
        const w = Math.max(c.s < 1 ? 2 : o.tilePx[0], Math.min(o.tilePx[1], o.tileW * c.s * q.k));
        const vis = q.x > -w && q.x < Wd + w && q.y > -w && q.y < Hd + w;
        if (!vis) { if (!t.hid) { t.el.style.display = 'none'; t.hid = true; } continue; }
        if (t.hid) { t.el.style.display = ''; t.hid = false; }
        t.el.style.transform = `translate(${(q.x - w / 2).toFixed(1)}px,${(q.y - w * 0.62).toFixed(1)}px)`; t.el.style.width = w.toFixed(1) + 'px';
        t.el.style.zIndex = String(Math.round(q.y));
      }
      for (const p of props) {
        const q = project(c, p.x, p.y), w = Math.min(p.max || 1e9, Math.max(p.min || 0, p.w * c.s * q.k));
        const vis = q.x > -w && q.x < Wd + w && q.y > -10 && q.y < Hd + w * 1.2 && w > 1.5;
        if (!vis) { if (!p.hid) { p.el.style.display = 'none'; p.hid = true; } continue; }
        if (p.hid) { p.el.style.display = ''; p.hid = false; }
        p.el.style.transform = `translate(${(q.x - w / 2).toFixed(1)}px,${(q.y - w * (p.ah || 0.92)).toFixed(1)}px)`; p.el.style.width = w.toFixed(1) + 'px';
        p.el.style.zIndex = String(Math.round(q.y) + (p.z || 0));
      }
      if (S.mon) {
        const q = project(c, S.mon[0], S.mon[1]);
        const w = o.monRatio > 0 ? Math.max(c.s < 1 ? 14 : 30, Math.max(c.s < 1 ? 2 : o.tilePx[0], Math.min(o.tilePx[1], o.tileW * c.s * q.k)) * o.monRatio)   // 2026-10-12：その地点のマスの幅 × 倍率（マスと同じ式）
          : Math.max(c.s < 1 ? 14 : 40, Math.min(100, 24 * c.s * q.k));
        mon.style.transform = `translate(${(q.x - w / 2).toFixed(1)}px,${(q.y - w * (S.monAh || 0.92)).toFixed(1)}px)`; mon.style.width = w.toFixed(1) + 'px'; mon.style.zIndex = String(Math.round(q.y) + 2);
      }
    }
    const lerp = (a, b, t) => a + (b - a) * t;
    function tick(now) {
      if (S.dead) return;
      if (!wrap.isConnected) { S.last = 0; S.raf = root.requestAnimationFrame(tick); return; }   // 2026-10-11：本編で別の画面へ移っている間（要素は残して戻ったら付け直す）は何もしない
      const dt = S.last ? Math.min(64, now - S.last) : 16; S.last = now;
      if (S.frames.length < 600) S.frames.push(dt);
      S.view = viewRect();
      if (S.intro) {
        const it = S.intro, t = Math.min(1, (now - it.t0) / it.dur);
        if (!painted && o.art && now - it.t0 < 3000) it.hold = now + it.holdMs;   // 区画を描き終えるまで俯瞰を止めておく（最大3秒）
        if (now < it.hold) { S.cam = Object.assign({}, it.from); }
        else {
          const u = Math.min(1, (now - it.hold) / it.dur), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
          const to = it.to(); for (const k of ['tx', 'ty', 'tilt', 'ax', 'ay']) S.cam[k] = lerp(it.from[k], to[k], e);
          S.cam.s = Math.exp(lerp(Math.log(it.from.s), Math.log(to.s), e)); S.cam.P = o.persp;
          title.style.opacity = String(Math.max(0, 1 - u * 2.2));
          if (u >= 1) { const done = it.done; S.intro = null; title.style.opacity = '0'; wrap.classList.remove('intro'); rootEl.classList.remove('rfw-intro'); if (done) done(); }
        }
        void t;
      } else if (S.goal) {
        const f = 1 - Math.exp(-dt / 170), g = S.goal;
        for (const k of ['tx', 'ty', 'ax', 'ay', 'tilt']) S.cam[k] = lerp(S.cam[k], g[k], f);
        S.cam.s = Math.exp(lerp(Math.log(S.cam.s), Math.log(g.s), (1 - Math.exp(-dt / o.zoomTau)) * 0.8));
      }
      if (S.monGoal) { if (!S.mon) S.mon = S.monGoal.slice(); const f = 1 - Math.exp(-dt / 70); S.mon[0] = lerp(S.mon[0], S.monGoal[0], f); S.mon[1] = lerp(S.mon[1], S.monGoal[1], f); }
      apply();
      S.raf = root.requestAnimationFrame(tick);
    }
    const api = {
      el: wrap,
      /** 今の地点・先の地点・マスの見た目を渡す（roadfirst-view の render／cam から呼ぶ）。instant＝すぐ合わせる */
      update(info, instant) {
        const n = D.nodes[info.node]; if (!n) return;
        S.monGoal = [n[0], n[1]]; if (instant || !S.mon) S.mon = S.monGoal.slice();
        S.view = viewRect();
        const pts = (info.ahead || []).map((id) => D.nodes[id]).filter(Boolean).map((p) => [p[0], p[1]]);
        S.goal = followCam(S.view, n[0], n[1], pts); S.lastAhead = info.ahead || [];
        if (instant && !S.intro) S.cam = Object.assign({}, S.goal);
        S.dirty = true;
        if ('denOpen' in info) for (const p of props) if (p.L && p.L.open) { const f = info.denOpen ? p.L.open : p.L.file; if (p.f !== f) { p.el.src = (o.art.base || './assets/proto/board_art_1010/') + f; p.f = f; } }
        const foc = o.focus ? new Set(info.focus || [info.node].concat(info.ahead || [])) : null;
        if (foc) paintVeil([...foc]);
        if (info.look || foc) for (const [id, t] of Object.entries(tiles)) {
          if (foc) { const far = !foc.has(id); if (far !== t.far) { t.el.classList.toggle('far', far); t.far = far; } }
          if (!info.look) continue;
          const L = info.look(id) || {}; if (L.src && L.src !== t.src) { t.img.src = L.src; t.src = L.src; }
          const m = L.mark || ''; if (m !== t.mk) { t.lab.textContent = m; t.mk = m; }
          const u = !!L.used; if (u !== t.used) { t.el.classList.toggle('used', u); t.used = u; }
          const c = info.node === id; if (c !== t.cur) { t.el.classList.toggle('cur', c); t.cur = c; }
        }
      },
      /** 開始の俯瞰 → START へ寄りながら傾ける。終わったら done */
      intro(done, opt) {
        const v = viewRect(); S.view = v; const from = overviewCam(v); S.cam = Object.assign({}, from);
        const now = root.performance.now(), hold = (opt && opt.hold) ?? 1500, dur = (opt && opt.dur) ?? 1600;
        wrap.classList.add('intro'); rootEl.classList.add('rfw-intro'); title.style.opacity = '1';
        S.intro = { from, to: () => S.goal || from, t0: now, hold: now + hold, holdMs: hold, dur, done };
      },
      skipIntro() { if (S.intro) { const d = S.intro.done; S.intro = null; wrap.classList.remove('intro'); rootEl.classList.remove('rfw-intro'); title.style.opacity = '0'; if (S.goal) S.cam = Object.assign({}, S.goal); if (d) d(); } },
      inIntro: () => !!S.intro,
      /** 2026-10-12 開発21（C-3〜6）：描き終わったか＝絵の読み込み・地面と道の全区画・景物とマスの絵のデコードが終わった。Promise は true で解決（壊れたら false） */
      ready() {
        const imgs = () => [...bb.querySelectorAll('img')].filter((i) => i.getAttribute('src'));
        return new Promise((res) => {
          const chk = () => { if (S.dead) return res(false); if (!artDone || !painted) return root.requestAnimationFrame(chk);
            Promise.all(imgs().map((i) => (i.complete ? (i.decode ? i.decode().catch(() => {}) : null) : new Promise((r) => { i.addEventListener('load', r, { once: true }); i.addEventListener('error', r, { once: true }); })))).then(() => res(!S.dead)); };
          chk(); });
      },
      isReady: () => artDone && painted,
      /** 2026-10-11：地点の上に浮かぶ目印（レアの紋章など）。w＝世界の幅・min／max＝画面の画素の下限・上限（全景でも見える大きさ）。地面・道は描き直さない */
      marker(id, src, opt = {}) {
        const n = D.nodes[id]; if (!n) return null;
        let p = props.find((x) => x.mark === id);
        if (!p) { const d = doc.createElement('img'); d.className = 'rfw-prop rfw-mark' + (opt.cls ? ' ' + opt.cls : ''); d.alt = ''; d.draggable = false; d.decoding = 'async'; bb.appendChild(d); p = { el: d, x: n[0], y: n[1], mark: id }; props.push(p); }
        p.el.src = src; p.w = opt.w || 46; p.min = opt.min || 0; p.max = opt.max || 0; p.ah = opt.ah || 1.6; p.z = opt.z == null ? 60 : opt.z; p.el.dataset.node = id;
        S.dirty = true; return p.el;
      },
      markerDim(id, dim) { const p = props.find((x) => x.mark === id); if (p) p.el.classList.toggle('dim', !!dim); },
      markerOff(id) { const i = props.findIndex((x) => x.mark === id); if (i >= 0) { props[i].el.remove(); props.splice(i, 1); } },
      state: () => ({ focus: o.focus ? veilSig.split(',').filter(Boolean) : null, cam: Object.assign({}, S.cam), goal: S.goal && Object.assign({}, S.goal), mon: S.mon && S.mon.slice(), view: S.view, intro: !!S.intro, ahead: S.lastAhead || [],
        tiles: Object.keys(tiles).length, chunks: chunks.length, painted, res: o.res, tilt: o.tilt, props: props.length, art: !!(art.ground || art.road), rims: art.terrain ? art.terrain.rims.filter((r) => r.kind === 'valley').map((r) => r.pts.length) : null,
        rimKinds: art.terrain ? art.terrain.rims.reduce((a, r) => { a[r.kind] = (a[r.kind] || 0) + 1; return a; }, {}) : null }),
      project: (x, y) => project(S.cam, x, y),
      frames: (reset) => { const f = S.frames.slice(); if (reset) S.frames = []; return f; },
      destroy() { S.dead = true; root.cancelAnimationFrame(S.raf); wrap.remove(); },
      opts: o,
    };
    S.raf = root.requestAnimationFrame(tick);
    return api;
  }

  // 仮の地面（絵が届いたら A 群のテクスチャ・B 群の縁に替える）：草地の色＋小さなまだら（決まった乱数）
  function pattern(g, im, tile) { const p = g.createPattern(im, 'repeat'); if (p && p.setTransform && root.DOMMatrix) p.setTransform(new root.DOMMatrix().scale(tile / im.width)); return p; }
  function drawGround(g, D, x0, y0, w, h, art) {
    if (art && art.ground) { g.fillStyle = pattern(g, art.ground, ART.ground.tile); g.fillRect(x0, y0, w, h); return; }
    g.fillStyle = '#86b65a'; g.fillRect(x0, y0, w, h);
    let a = ((Math.floor(x0) * 73856093) ^ (Math.floor(y0) * 19349663)) >>> 0;
    const rnd = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    for (let i = 0; i < (w * h) / 90; i++) { g.fillStyle = rnd() < 0.5 ? 'rgba(60,110,40,.22)' : 'rgba(180,220,120,.22)'; const r = 1 + rnd() * 3; g.beginPath(); g.arc(x0 + rnd() * w, y0 + rnd() * h, r, 0, 7); g.fill(); }
  }
  // 道：原本の区間ごとに地点を通るなめらかな帯（絵が届いたら C 群の帯の模様を貼る）。分かれ目・合流は小広場、行き止まりは踊り場（D 群）
  function drawRoads(g, D, o, art, bx) {
    const segs = Object.values(D.segments);
    const path = (ids) => { const p = ids.map((id) => D.nodes[id]); g.beginPath(); g.moveTo(p[0][0], p[0][1]);
      for (let i = 0; i < p.length - 1; i++) { const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], d = p[i + 2] || c;
        g.bezierCurveTo(b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6, c[0] - (d[0] - b[0]) / 6, c[1] - (d[1] - b[1]) / 6, c[0], c[1]); } };
    g.lineCap = 'round'; g.lineJoin = 'round';
    const out = {}, inn = {}; for (const e of D.edges) if (e[3] === 'forward') { out[e[0]] = (out[e[0]] || 0) + 1; inn[e[1]] = (inn[e[1]] || 0) + 1; }
    const hubs = Object.keys(D.nodes).filter((id) => (out[id] || 0) > 1 || (inn[id] || 0) > 1);
    const ends = Object.keys(D.nodes).filter((id) => /dead_end/.test(D.nodes[id][2]));
    const disc = (id, r) => { const n = D.nodes[id]; g.beginPath(); g.arc(n[0], n[1], r, 0, 7); g.fill(); };
    const rp = art && art.road ? pattern(g, art.road, ART.road.tile) : null;
    if (rp) { g.strokeStyle = 'rgba(40,52,20,.28)'; g.lineWidth = o.roadW + 9; for (const s of segs) { path(s[3]); g.stroke(); } }   // 草へ落ちる薄い影
    if (rp && art.strip) {   // 直線の石の道を道筋に沿って並べる（分かれ目・合流・行き止まりは敷石の円で覆う）
      if (art.terrain) {   // 谷の上を渡る石橋：下へ落ちる影（高さに見せる）
        g.strokeStyle = 'rgba(10,20,30,.42)'; g.lineWidth = ART.strip.w + 2;
        for (const id of TERRAIN.flatMap((T) => T.bridges)) { const s = D.segments[id]; if (!s) continue; g.save(); g.translate(0, 10); path(s[3]); g.stroke(); g.restore(); }
      }
      for (const s of segs) stripAlong(g, curvePts(s[3].map((id) => D.nodes[id])), art.strip, ART.strip.w, bx);
      g.fillStyle = '#8f8573'; for (const id of hubs) disc(id, ART.strip.w * 0.62 + 1.5); for (const id of ends) disc(id, ART.strip.w * 0.6 + 1.5);
      g.fillStyle = rp; for (const id of hubs) disc(id, ART.strip.w * 0.62 - 1); for (const id of ends) disc(id, ART.strip.w * 0.6 - 1);
      return;
    }
    g.strokeStyle = rp ? '#8f8573' : '#6f6248'; g.lineWidth = o.roadW + 4; for (const s of segs) { path(s[3]); g.stroke(); }
    g.fillStyle = rp ? '#8f8573' : '#6f6248'; for (const id of hubs) disc(id, o.roadW * 0.8 + 2); for (const id of ends) disc(id, o.roadW * 0.75 + 2);
    g.strokeStyle = rp || '#e7dcc0'; g.lineWidth = o.roadW; for (const s of segs) { path(s[3]); g.stroke(); }
    g.fillStyle = rp || '#ece3ca'; for (const id of hubs) disc(id, o.roadW * 0.8); for (const id of ends) disc(id, o.roadW * 0.75);
  }

  /** 谷の多角形（区間を順にたどる） */
  const POLY_CACHE = new Map();
  function loopPoly(D, T) {
    if (T.poly) { if (!POLY_CACHE.has(T)) POLY_CACHE.set(T, wobble(T.poly, T.wobble || 0, T.id)); return POLY_CACHE.get(T); }
    const out = []; for (const [id, rev] of T.loop) { const s = D.segments[id]; if (!s) continue; const ns = s[3].map((n) => D.nodes[n]); (rev ? ns.slice().reverse() : ns).forEach((p) => out.push([p[0], p[1]])); }
    return out;
  }
  /** 多角形の辺を細かく分けて、決まった揺らぎ（いくつかの正弦の和）で外へ内へずらす＝森のふちを自然な形に。世界の端の上の点は動かさない */
  function wobble(poly, amp, seed) {
    if (!amp) return poly; let h = 0; for (const c of String(seed)) h = (h * 31 + c.charCodeAt(0)) % 997;
    const out = [], n = poly.length; let u = 0;
    for (let i = 0; i < n; i++) { const a = poly[i], b = poly[(i + 1) % n], L = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.round(L / 8)), nx = -(b[1] - a[1]) / (L || 1), ny = (b[0] - a[0]) / (L || 1);
      for (let j = 0; j < k; j++) { const t = j / k, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, e = x <= 0 || y >= WORLD.h || x >= WORLD.w || y <= 0;
        const w = e ? 0 : amp * (0.55 * Math.sin(u / 23 + h) + 0.3 * Math.sin(u / 9.7 + h * 1.7) + 0.15 * Math.sin(u / 4.1 + h * 0.3)); out.push([x + nx * w, y + ny * w]); u += L / k; } }
    return out;
  }
  function inPoly(poly, x, y) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
  function distLine(line, x, y) { let m = 1e9; for (let i = 0; i < line.length - 1; i++) { const a = line[i], b = line[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L)); m = Math.min(m, Math.hypot(a[0] + dx * t - x, a[1] + dy * t - y)); } return m; }
  /** その点が谷か（純粋な関数＝景物の置き場所・テスト用。道のまわり ROAD_LAND は陸。石橋の区間のまわりは谷のまま） */
  function inValley(D, x, y) {
    const segs = Object.entries(D.segments), bridges = new Set(TERRAIN.flatMap((T) => T.bridges));
    for (const T of TERRAIN) {
      const hit = inPoly(loopPoly(D, T), x, y) || T.arms.some((A) => distLine(A.line, x, y) <= A.w / 2);
      if (!hit) continue;
      const nearRoad = segs.some(([id, s]) => !bridges.has(id) && distLine(s[3].map((n) => D.nodes[n]), x, y) < ROAD_LAND);
      if (!nearRoad) return T.id;
    }
    return null;
  }
  /** 谷・雲海・森と水の範囲の画像（世界の1単位＝1px。区画ごとに切り抜きに使う）と、ふちの線（帯を並べる） */
  function terrainMasks(doc, D, o) {
    const mk = () => { const c = doc.createElement('canvas'); c.width = WORLD.w; c.height = WORLD.h; return c; };
    const M = { valley: mk(), cloud: mk(), forest: mk() }, water = mk(), wg = water.getContext('2d');
    const bridges = new Set(TERRAIN.flatMap((T) => T.bridges));
    for (const T of TERRAIN) { const g = M[T.kind || 'valley'].getContext('2d'); g.fillStyle = '#fff'; g.strokeStyle = '#fff'; g.lineCap = g.lineJoin = 'round';
      const P = loopPoly(D, T); g.beginPath(); P.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill();
      for (const A of T.arms) { g.lineWidth = A.w; g.beginPath(); A.line.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); } }
    for (const [kind, cv] of Object.entries(M)) {   // 道のまわりは陸（谷だけ石橋の区間は谷の上を渡る）
      const g = cv.getContext('2d'); g.globalCompositeOperation = 'destination-out'; g.lineCap = g.lineJoin = 'round'; g.lineWidth = ROAD_LAND * 2;
      for (const [id, s] of Object.entries(D.segments)) { if (kind === 'valley' && bridges.has(id)) continue; const P = curvePts(s[3].map((n) => D.nodes[n])); g.beginPath(); P.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); }
      if (kind !== 'valley') {   // 雲海・森：目印（石像・祭壇など）のまわりは岩棚・空き地にする。森は谷にかからない
        g.fillStyle = '#000'; for (const L of ART.landmarks) { const at = landmarkAt(D, L); if (at) { g.beginPath(); g.arc(at[0], at[1] - L.w * 0.18, L.w * 0.62, 0, 7); g.fill(); } }
        if (kind === 'forest') g.drawImage(M.valley, 0, 0);
      }
    }
    wg.strokeStyle = '#fff'; wg.lineCap = wg.lineJoin = 'round';
    for (const T of TERRAIN) for (const A of T.water || []) { wg.lineWidth = A.w; wg.beginPath(); A.line.forEach((p, i) => (i ? wg.lineTo(p[0], p[1]) : wg.moveTo(p[0], p[1]))); wg.stroke(); }
    wg.globalCompositeOperation = 'destination-in'; wg.drawImage(M.valley, 0, 0);
    const edgeAt = (kind) => (p) => { const T = TERRAIN.filter((t) => (t.kind || 'valley') === kind).find((t) => inPoly(loopPoly(D, t), p[0], p[1]) || t.arms.some((A) => distLine(A.line, p[0], p[1]) < A.w)); return T ? T.edge : kind === 'valley' ? TERRAIN[0].edge : kind; };
    const rims = [...rimsOf(M.valley, edgeAt('valley'), 'valley'), ...rimsOf(water, () => 'shore', 'water'), ...rimsOf(M.cloud, edgeAt('cloud'), 'cloud'), ...rimsOf(M.forest, edgeAt('forest'), 'forest')];
    return { valley: M.valley, cloud: M.cloud, forest: M.forest, water, rims };
  }
  /** 範囲の画像の輪郭（3単位の格子の marching squares → つないで → なめらかに）。範囲は進む向きの右側（帯の絵の上＝左＝外側） */
  function rimsOf(cv, edgeOf, kind) {
    const a = cv.getContext('2d').getImageData(0, 0, WORLD.w, WORLD.h).data, step = 3, nx = Math.ceil(WORLD.w / step) + 1, ny = Math.ceil(WORLD.h / step) + 1;
    const inside = (i, j) => { const x = Math.min(WORLD.w - 1, i * step), y = Math.min(WORLD.h - 1, j * step); return a[(y * WORLD.w + x) * 4 + 3] > 127; };
    const edges = [];
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const tl = inside(i, j), tr = inside(i + 1, j), br = inside(i + 1, j + 1), bl = inside(i, j + 1);
      const k = (tl ? 8 : 0) | (tr ? 4 : 0) | (br ? 2 : 0) | (bl ? 1 : 0); if (k === 0 || k === 15) continue;
      const T = [(i + 0.5) * step, j * step], R = [(i + 1) * step, (j + 0.5) * step], B = [(i + 0.5) * step, (j + 1) * step], L = [i * step, (j + 0.5) * step];
      const map = { 1: [[L, B]], 2: [[B, R]], 3: [[L, R]], 4: [[R, T]], 5: [[L, T], [R, B]], 6: [[B, T]], 7: [[L, T]], 8: [[T, L]], 9: [[T, B]], 10: [[T, R], [B, L]], 11: [[T, R]], 12: [[R, L]], 13: [[R, B]], 14: [[B, L]] };
      for (const e of map[k]) edges.push(e);
    }
    // 端の点でつなぐ（向きは問わない＝両方向へ伸ばす。向きはあとで範囲の側からそろえる）
    const key = (p) => p[0] + ',' + p[1], at = new Map();
    edges.forEach((e, i) => { for (const p of e) { const k = key(p); if (!at.has(k)) at.set(k, []); at.get(k).push(i); } });
    const used = new Set(), lines = [];
    const grow = (ln, tail) => { for (;;) { const k = key(tail ? ln[ln.length - 1] : ln[0]); const n = (at.get(k) || []).find((j) => !used.has(j)); if (n === undefined) return;
      used.add(n); const e = edges[n], nx = key(e[0]) === k ? e[1] : e[0]; if (tail) ln.push(nx); else ln.unshift(nx); } };
    for (let i = 0; i < edges.length; i++) { if (used.has(i)) continue; used.add(i); const ln = [edges[i][0], edges[i][1]]; grow(ln, true); grow(ln, false); if (ln.length > 6) lines.push(ln); }
    const inAt = (x, y) => x >= 0 && y >= 0 && x < WORLD.w && y < WORLD.h && a[((y | 0) * WORLD.w + (x | 0)) * 4 + 3] > 127;
    const smooth = (p) => { for (let it = 0; it < 3; it++) { const q = [p[0]]; for (let i = 0; i < p.length - 1; i++) { const A = p[i], B = p[i + 1]; q.push([A[0] * 0.75 + B[0] * 0.25, A[1] * 0.75 + B[1] * 0.25], [A[0] * 0.25 + B[0] * 0.75, A[1] * 0.25 + B[1] * 0.75]); } q.push(p[p.length - 1]); p = q; } return p; };
    return lines.map((ln) => {
      let vote = 0; for (let i = 0; i < ln.length - 1; i += 3) { const A = ln[i], B = ln[i + 1], dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy) || 1, mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
        vote += inAt(mx - dy / L * 4, my + dx / L * 4) ? 1 : -1; }   // 右側（y が下向き）＝(-dy, dx)
      const p = vote >= 0 ? ln : ln.slice().reverse();
      return { pts: resample(smooth(p), 2.5), edge: edgeOf(p[0]), kind };
    });
  }
  /** 点の列をおよそ同じ間隔（d 単位）に間引く */
  function resample(p, d) { const out = [p[0]]; let acc = 0; for (let i = 1; i < p.length; i++) { acc += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); if (acc >= d || i === p.length - 1) { out.push(p[i]); acc = 0; } } return out; }
  let TMP = null;
  /** 谷（谷底の絵・水・岸）・崖のふち・雲海・森を描く。どの範囲にもかからない区画は何もしない・区画の外の帯は描かない */
  function drawTerrain(g, D, o, art, bx) {
    const m = art && art.terrain; if (!m) return;
    if (!m.bbox) { const xs = m.rims.flatMap((r) => r.pts.map((q) => q[0])), ys = m.rims.flatMap((r) => r.pts.map((q) => q[1])); m.bbox = [Math.min(...xs) - 30, Math.min(...ys) - 30, Math.max(...xs) + 30, Math.max(...ys) + 30]; }
    if (bx[0] > m.bbox[2] || bx[0] + bx[2] < m.bbox[0] || bx[1] > m.bbox[3] || bx[1] + bx[3] < m.bbox[1]) return;
    if (!TMP) TMP = g.canvas.ownerDocument.createElement('canvas');
    const tmp = TMP; if (tmp.width !== g.canvas.width || tmp.height !== g.canvas.height) { tmp.width = g.canvas.width; tmp.height = g.canvas.height; }
    const tg = tmp.getContext('2d'); tg.setTransform(g.getTransform());
    const sx = Math.max(0, Math.floor(bx[0])), sy = Math.max(0, Math.floor(bx[1])), sw = Math.min(WORLD.w, Math.ceil(bx[0] + bx[2])) - sx, sh = Math.min(WORLD.h, Math.ceil(bx[1] + bx[3])) - sy;
    const clip = (mask) => { tg.globalCompositeOperation = 'destination-in'; if (sw > 0 && sh > 0) tg.drawImage(mask, sx, sy, sw, sh, sx, sy, sw, sh); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(tmp, 0, 0); g.restore(); };
    const layer = (im, tile, mask) => { if (!im) return; tg.globalCompositeOperation = 'source-over'; tg.clearRect(bx[0], bx[1], bx[2], bx[3]); tg.fillStyle = pattern(tg, im, tile); tg.fillRect(bx[0], bx[1], bx[2], bx[3]); clip(mask); };
    const edgesOf = (kind) => { for (const r of m.rims) { if (r.kind !== kind) continue; const E = art.edges && art.edges[r.edge], C = ART.terrain.edges[r.edge]; if (E && C) stripAlong(g, C.flip ? r.pts.slice().reverse() : r.pts, E, C.w, bx, C.shift); } };
    layer(art.valley, ART.terrain.valley.tile, m.valley);
    if (art.water) { layer(art.water, ART.terrain.water.tile, m.water); edgesOf('water'); }   // 川の岸（B2）も谷の暗さの下に入れる
    // 深さ：谷全体を少し暗く＋ふちの内側に崖の影（谷の範囲で切り抜く）
    tg.globalCompositeOperation = 'source-over'; tg.clearRect(bx[0], bx[1], bx[2], bx[3]);
    tg.fillStyle = `rgba(8,26,38,${ART.terrain.depth})`; tg.fillRect(bx[0], bx[1], bx[2], bx[3]);
    tg.lineJoin = tg.lineCap = 'round';
    for (const [lw, a] of [[46, 0.22], [26, 0.28]]) { tg.strokeStyle = `rgba(4,14,22,${a})`; tg.lineWidth = lw;
      for (const r of m.rims) { if (r.kind !== 'valley') continue; tg.beginPath(); r.pts.forEach((q, i) => (i ? tg.lineTo(q[0], q[1]) : tg.moveTo(q[0], q[1]))); tg.stroke(); } }
    clip(m.valley);
    edgesOf('valley');
    layer(art.cloud, ART.terrain.cloud.tile, m.cloud); edgesOf('cloud');
    if (art.canopy) layer(art.canopy.cv, art.canopy.tile, m.forest); edgesOf('forest');
  }
  /** 森の樹冠のくり返し（B3 の帯を段に重ねる。横は帯のくり返し・縦は段の間隔でつながる） */
  function canopyTile(doc, im) {
    const C = ART.terrain.edges.forest, ppu = im.height / C.w, step = Math.round(ART.terrain.canopy.row * ppu), rows = 4, H = step * rows;
    const cv = doc.createElement('canvas'); cv.width = im.width; cv.height = H; const g = cv.getContext('2d');
    g.fillStyle = '#2f5a24'; g.fillRect(0, 0, im.width, H);   // 樹冠のすき間＝暗い森の床
    // 上の段から下の段へ（下の段が上の段の影を隠す）。くり返しの継ぎ目をまたぐ写しは先に描く
    const row = (k, dy) => { const x = Math.round((k % rows) * im.width * 0.37) % im.width; for (const xx of [x, x - im.width]) g.drawImage(im, xx, k * step - im.height / 2 + dy); };
    for (let k = 0; k <= rows; k++) row(k, -H);
    for (let k = 0; k <= rows; k++) row(k, 0);
    return { cv, tile: im.width / ppu };
  }
  /** 地点を通るなめらかな線（drawRoads の path と同じ曲線）を細かい点の列に */
  function curvePts(p) {
    const out = [p[0]];
    for (let i = 0; i < p.length - 1; i++) { const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], d = p[i + 2] || c;
      const c1 = [b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6], c2 = [c[0] - (d[0] - b[0]) / 6, c[1] - (d[1] - b[1]) / 6];
      const n = Math.max(2, Math.ceil(Math.hypot(c[0] - b[0], c[1] - b[1]) / 1.5));
      for (let k = 1; k <= n; k++) { const t = k / n, u = 1 - t;
        out.push([u * u * u * b[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * c[0], u * u * u * b[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * c[1]]); } }
    return out;
  }
  /** 横長の帯の絵を点の列に沿って細い切れ端で並べる（帯の高さ＝幅 w・くり返す） */
  function stripAlong(g, pts, im, w, bx, shift) {
    const y0 = -w / 2 + (shift || 0);
    const ppu = im.height / w; let u = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1e-6) continue;
      if (bx && (Math.max(a[0], b[0]) < bx[0] - w || Math.min(a[0], b[0]) > bx[0] + bx[2] + w || Math.max(a[1], b[1]) < bx[1] - w || Math.min(a[1], b[1]) > bx[1] + bx[3] + w)) { u += L; continue; }   // 区画の外は描かない
      let sx = (u * ppu) % im.width, sw = Math.min(L * ppu, im.width - sx);
      g.save(); g.translate(a[0], a[1]); g.rotate(Math.atan2(b[1] - a[1], b[0] - a[0]));
      g.drawImage(im, sx, 0, Math.max(1, sw), im.height, -0.35, y0, sw / ppu + 0.7, w);
      if (sw < L * ppu - 0.5) g.drawImage(im, 0, 0, L * ppu - sw, im.height, sw / ppu - 0.35, y0, L - sw / ppu + 0.7, w);   // 絵の端をまたぐ切れ端
      g.restore(); u += L;
    }
  }
  /** 目印の置き場所：地点から、その地点へ入ってくる向きに along 単位（負＝手前） */
  function landmarkAt(D, L) {
    const n = D.nodes[L.node]; if (!n) return null;
    if (L.off) return [n[0] + L.off[0], n[1] + L.off[1]];
    const e = D.edges.find((x) => x[1] === L.node && x[3] === 'forward') || null, f = D.edges.find((x) => x[0] === L.node && x[3] === 'forward') || null;
    const p = e ? D.nodes[e[0]] : null, q = f ? D.nodes[f[1]] : null;
    let dx = 0, dy = -1;
    if (p) { dx = n[0] - p[0]; dy = n[1] - p[1]; } else if (q) { dx = q[0] - n[0]; dy = q[1] - n[1]; }
    const k = Math.hypot(dx, dy) || 1, a = L.along || 0, sd = L.side || 0; return [n[0] + (dx * a - dy * sd) / k, n[1] + (dy * a + dx * sd) / k];
  }
  /** 折れ線の上に d 単位ごとの点（始点を含む） */
  function alongLine(line, d) { const out = [line[0]]; let rest = d; for (let i = 0; i < line.length - 1; i++) { const a = line[i], b = line[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]); let t = rest;
    while (t <= L) { out.push([a[0] + (b[0] - a[0]) * t / L, a[1] + (b[1] - a[1]) * t / L]); t += d; } rest = t - L; } return out; }
  /** 川の景物（決まった並び）：川の始まりに小さな滝、川筋に沿って渓流の岩と睡蓮を交互に、岸に葦。道（石橋）のまわりには置かない */
  function waterProps(D) {
    const W = ART.water, out = [], segs = Object.values(D.segments).map((s) => s[3].map((n) => D.nodes[n]));
    const nearRoad = (x, y, r) => segs.some((l) => distLine(l, x, y) < r);
    for (const T of TERRAIN) for (const A of T.water || []) {
      const P = alongLine(A.line, W.every).filter((q) => q[1] < WORLD.h - 20 && q[0] < WORLD.w - 10); out.push({ file: W.fall.file, x: A.line[0][0], y: A.line[0][1] + 6, w: W.fall.w, z: -10 });
      P.slice(1).forEach((q, i) => {
        const r = P[Math.min(i + 2, P.length - 1)], dx = r[0] - q[0], dy = r[1] - q[1], L = Math.hypot(dx, dy) || 1, s = i % 2 ? 1 : -1;
        if (nearRoad(q[0], q[1], 24)) return;
        const P2 = i % 2 ? W.lilies : W.rocks; out.push({ file: P2.file, x: q[0] - dy / L * A.w * 0.12 * s, y: q[1] + dx / L * A.w * 0.12 * s, w: P2.w });
        const rx = q[0] + dy / L * (A.w * 0.5 + 3) * s, ry = q[1] - dx / L * (A.w * 0.5 + 3) * s;
        if (i % 3 === 1 && !nearRoad(rx, ry, 24)) out.push({ file: W.reeds.file, x: rx, y: ry, w: W.reeds.w });
      });
    }
    return out;
  }
  /** 道の外に木と岩を散らす（決まった乱数・道とマスから離す・道の近くだけ）。第1便の検証用 */
  function scatter(D, o) {
    const pts = []; for (const s of Object.values(D.segments)) { const p = s[3].map((id) => D.nodes[id]);
      for (let i = 0; i < p.length - 1; i++) { const n = Math.max(1, Math.ceil(Math.hypot(p[i + 1][0] - p[i][0], p[i + 1][1] - p[i][1]) / 4)); for (let k = 0; k <= n; k++) pts.push([p[i][0] + (p[i + 1][0] - p[i][0]) * k / n, p[i][1] + (p[i + 1][1] - p[i][1]) * k / n]); } }
    const cell = 24, grid = new Map(), key = (x, y) => Math.floor(x / cell) + ',' + Math.floor(y / cell);
    for (const q of pts) { const k = key(q[0], q[1]); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(q); }
    const near = (x, y) => { let m = 1e9; const cx = Math.floor(x / cell), cy = Math.floor(y / cell);
      for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) for (const q of grid.get((cx + i) + ',' + (cy + j)) || []) m = Math.min(m, Math.hypot(q[0] - x, q[1] - y)); return m; };
    let a = 0x1010; const rnd = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const out = [], gap = o.roadW / 2 + 10;
    for (let y = 10; y < WORLD.h; y += 30) for (let x = 10; x < WORLD.w; x += 30) {
      const px = x + (rnd() - 0.5) * 24, py = y + (rnd() - 0.5) * 24, d = near(px, py), r = rnd(), pick = rnd();
      if (d < gap || d > 66 || r > 0.62 || py < 150) continue;   // GOAL の会場のまわり（y<150）には置かない
      if (inValley(D, px, py)) continue;   // 谷の中には置かない
      if (ART.landmarks.some((L) => { const at = landmarkAt(D, L); return at && Math.hypot(at[0] - px, at[1] - py) < L.w * 0.75; })) continue;   // 目印のまわりにも置かない
      if (ART.peaks.at.some(([x0, y0, w0]) => Math.hypot(x0 - px, y0 - py) < w0 * 0.6)) continue;   // 岩峰のまわりにも置かない
      let acc = 0, P = ART.props[ART.props.length - 1]; for (const c of ART.props) { acc += c.p; if (pick < acc) { P = c; break; } }
      out.push({ x: px, y: py, file: P.file, w: P.w * (0.8 + rnd() * 0.45) });
    }
    return out;
  }

  let cssDone = false;
  function css(doc) {
    if (cssDone || doc.getElementById('rfw-css')) return; cssDone = true;
    const s = doc.createElement('style'); s.id = 'rfw-css';
    s.textContent = `:is(#rfp,.wbv) .rfw{position:absolute;inset:0;overflow:hidden;background:#86b65a;z-index:1}
:is(#rfp,.wbv) .rfw-plane{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform}
:is(#rfp,.wbv) .rfw-chunk{position:absolute;display:block}
:is(#rfp,.wbv) .rfw-bb{position:absolute;inset:0;pointer-events:none}
:is(#rfp,.wbv) .rfw-tile{position:absolute;left:0;top:0;will-change:transform}
:is(#rfp,.wbv) .rfw-tile img{display:block;width:100%;height:auto}
:is(#rfp,.wbv) .rfw-tile span{position:absolute;left:0;right:0;top:30%;text-align:center;font:800 11px/1 "Noto Sans JP",sans-serif;color:#13233a;text-shadow:0 0 3px #fff,0 0 3px #fff}
:is(#rfp,.wbv) .rfw-tile span:empty{display:none}
:is(#rfp,.wbv) .rfw-tile.used img{opacity:.55}
:is(#rfp,.wbv) .rfw-tile.cur img{filter:drop-shadow(0 0 5px #fff6c0)}
:is(#rfp,.wbv) .rfw-tile{transition:opacity .35s}
:is(#rfp,.wbv) .rfw-tile.far{opacity:.22}
:is(#rfp,.wbv) .rfw-veil{position:absolute;display:block;pointer-events:none;transition:opacity .5s}
:is(#rfp,.wbv) .rfw.intro .rfw-tile.far{opacity:1}
:is(#rfp,.wbv) .rfw.intro .rfw-veil{opacity:0}
:is(#rfp,.wbv) .rfw-apron{position:absolute;pointer-events:none}
:is(#rfp,.wbv) .rfw-prop{position:absolute;left:0;top:0;will-change:transform;pointer-events:none;user-select:none;-webkit-user-drag:none}
:is(#rfp,.wbv) .rfw-mark{filter:drop-shadow(0 0 6px rgba(190,110,255,.85));transition:opacity .5s,filter .5s}
:is(#rfp,.wbv) .rfw-mark.dim{opacity:.32;filter:none}
:is(#rfp,.wbv) .rfw.art{background:#7aa84c}
:is(#rfp,.wbv) .rfw-mon{position:absolute;left:0;top:0;will-change:transform}
:is(#rfp,.wbv) .rfw-mon img{display:block;width:100%;height:auto;filter:drop-shadow(0 3px 2px rgba(0,0,0,.45))}
:is(#rfp,.wbv) .rfw-title{position:absolute;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 18px);text-align:center;font-family:"Shippori Mincho",serif;font-weight:800;font-size:26px;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,.6);opacity:0;pointer-events:none;z-index:3}
:is(#rfp,.wbv) .rfw-title small{display:block;font-size:12px;letter-spacing:.25em;font-family:"Noto Sans JP",sans-serif}
:is(#rfp,.wbv) .rfw-title em{display:block;font-style:normal;font-size:12px;font-family:"Noto Sans JP",sans-serif;opacity:.9}
#rfp.rfw-intro .rf-top,#rfp.rfw-intro .rf-tools,#rfp.rfw-intro .rf-bot{opacity:0;pointer-events:none;transition:opacity .4s}
#rfp.rfw-on .rf-cam{display:none}`;
    doc.head.appendChild(s);
  }

  /** 2026-10-12 開発21：出発の前に盤の絵を先に読み込んでおく（ブラウザの取り置き。描画はしない）。1回だけ */
  let pre = null;
  function warmArt(base) {
    if (pre || !root.Image) return pre; base = base || './assets/proto/board_art_1010/';
    const T = ART.terrain, files = [ART.ground.file, ART.road.file, ART.strip.file, ART.goal.file, ART.peaks.file, T.valley.file, T.water.file, T.cloud.file, ...Object.values(T.edges).map((e) => e.file),
      ...ART.props.map((p) => p.file), ...ART.landmarks.map((l) => l.file), ...Object.values(ART.water).filter((w) => w && w.file).map((w) => w.file)];
    pre = [...new Set(files)].map((f) => { const im = new root.Image(); im.decoding = 'async'; im.src = base + f; return im; });
    return pre;
  }
  const api = { DEF, WORLD, ART, TERRAIN, project, fitZoom, lookahead, create, scatter, waterProps, curvePts, landmarkAt, inValley, loopPoly, warmArt };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.MMRF_WORLD = api;
})(typeof window !== 'undefined' ? window : globalThis);
