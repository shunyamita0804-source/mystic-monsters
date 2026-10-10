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
  };
  // 第1便の絵（assets/proto/board_art_1010/README.md）。大きさは世界の単位
  const ART = {
    ground: { file: 'ground_grass.webp', tile: 128 },       // 草地のくり返し1枚＝128単位
    road: { file: 'road_flagstone.webp', tile: 46 },        // 道の中の敷石のくり返し1枚＝46単位
    props: [{ key: 'tree', file: 'prop_tree.webp', w: 30, p: 0.68 }, { key: 'rock', file: 'prop_rock.webp', w: 26, p: 0.32 }],
    goal: { file: 'goal_arena.webp', w: 150, dy: 14 },      // GOAL の後ろ（足もと＝GOAL の 14単位手前）
  };
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
  function lookahead(D, node, first, back, n) {
    n = n || DEF.ahead;
    const fwd = {}; for (const e of D.edges) if (e[3] === 'forward') (fwd[e[0]] = fwd[e[0]] || []).push(e[1]);
    if (back && D.segments[back]) {   // 行き止まりから戻る途中：その枝を逆にたどる
      const list = D.segments[back][3], i = list.indexOf(node);
      return i > 0 ? list.slice(Math.max(0, i - n), i).reverse() : [];
    }
    const out = [], seen = new Set([node]);
    const walk = (id, left, nexts) => {
      if (left <= 0) return;
      const ns = (nexts || fwd[id] || []).filter((x) => !seen.has(x));
      const per = ns.length > 1 ? Math.min(left, 3) : left;
      for (const x of ns) { seen.add(x); out.push(x); walk(x, per - 1); }
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
    function paint() {
      for (const c of chunks) { const g = c.getContext('2d'); g.setTransform(o.res, 0, 0, o.res, -c._x, -c._y);
        drawGround(g, D, c._x / o.res, c._y / o.res, c.width / o.res, c.height / o.res, art); drawRoads(g, D, o, art); }
    }
    paint();
    // マス（全地点・立てて置く）とモンスター
    const tiles = {};
    for (const id of Object.keys(D.nodes)) {
      const d = doc.createElement('div'); d.className = 'rfw-tile'; d.dataset.node = id; d.innerHTML = '<img alt="" draggable="false"><span></span>';
      bb.appendChild(d); tiles[id] = { el: d, img: d.firstChild, lab: d.lastChild, src: '', mk: '', used: false };
    }
    const rootEl = host.closest ? host.closest('#rfp') || wrap : wrap;
    const mon = doc.createElement('div'); mon.className = 'rfw-mon'; mon.innerHTML = `<img alt="" draggable="false" src="${o.monSrc || './assets/monsters/solamo.png'}">`; bb.appendChild(mon);
    // 景物（木・岩）と GOAL の大会会場：立てて置く（第1便の絵があるときだけ）
    const props = [];
    if (o.art) {
      const base = o.art.base || './assets/proto/board_art_1010/';
      const load = (f) => new Promise((res) => { const im = new root.Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = base + f; });
      Promise.all([load(ART.ground.file), load(ART.road.file)]).then(([gi, ri]) => { if (S.dead) return; art.ground = gi; art.road = ri; if (gi || ri) { paint(); wrap.classList.add('art'); } });
      for (const q of scatter(D, o)) { const d = doc.createElement('img'); d.className = 'rfw-prop'; d.alt = ''; d.draggable = false; d.src = base + q.file; bb.appendChild(d); props.push({ el: d, x: q.x, y: q.y, w: q.w }); }
      const gn = D.nodes.GOAL; if (gn) { const d = doc.createElement('img'); d.className = 'rfw-prop rfw-goal'; d.alt = ''; d.draggable = false; d.src = base + ART.goal.file; bb.appendChild(d); props.push({ el: d, x: gn[0], y: gn[1] + ART.goal.dy, w: ART.goal.w, z: -40 }); }
    }
    const S = {
      cam: { tx: WORLD.w / 2, ty: WORLD.h / 2, s: 1, tilt: 0, P: o.persp, ax: 0, ay: 0 }, goal: null, mon: null, monGoal: null,
      raf: 0, last: 0, intro: null, view: null, frames: [], dead: false,
    };
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
        const q = project(c, p.x, p.y), w = p.w * c.s * q.k;
        const vis = q.x > -w && q.x < Wd + w && q.y > -10 && q.y < Hd + w * 1.2 && w > 1.5;
        if (!vis) { if (!p.hid) { p.el.style.display = 'none'; p.hid = true; } continue; }
        if (p.hid) { p.el.style.display = ''; p.hid = false; }
        p.el.style.transform = `translate(${(q.x - w / 2).toFixed(1)}px,${(q.y - w * (p.ah || 0.92)).toFixed(1)}px)`; p.el.style.width = w.toFixed(1) + 'px';
        p.el.style.zIndex = String(Math.round(q.y) + (p.z || 0));
      }
      if (S.mon) {
        const q = project(c, S.mon[0], S.mon[1]), w = Math.max(c.s < 1 ? 14 : 40, Math.min(100, 24 * c.s * q.k));
        mon.style.transform = `translate(${(q.x - w / 2).toFixed(1)}px,${(q.y - w * 0.92).toFixed(1)}px)`; mon.style.width = w.toFixed(1) + 'px'; mon.style.zIndex = String(Math.round(q.y) + 2);
      }
    }
    const lerp = (a, b, t) => a + (b - a) * t;
    function tick(now) {
      if (S.dead) return;
      const dt = S.last ? Math.min(64, now - S.last) : 16; S.last = now;
      if (S.frames.length < 600) S.frames.push(dt);
      S.view = viewRect();
      if (S.intro) {
        const it = S.intro, t = Math.min(1, (now - it.t0) / it.dur);
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
        S.cam.s = Math.exp(lerp(Math.log(S.cam.s), Math.log(g.s), f * 0.8));
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
        if (info.look) for (const [id, t] of Object.entries(tiles)) {
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
        S.intro = { from, to: () => S.goal || from, t0: now, hold: now + hold, dur, done };
      },
      skipIntro() { if (S.intro) { const d = S.intro.done; S.intro = null; wrap.classList.remove('intro'); rootEl.classList.remove('rfw-intro'); title.style.opacity = '0'; if (S.goal) S.cam = Object.assign({}, S.goal); if (d) d(); } },
      inIntro: () => !!S.intro,
      state: () => ({ cam: Object.assign({}, S.cam), goal: S.goal && Object.assign({}, S.goal), mon: S.mon && S.mon.slice(), view: S.view, intro: !!S.intro, ahead: S.lastAhead || [],
        tiles: Object.keys(tiles).length, chunks: chunks.length, res: o.res, tilt: o.tilt, props: props.length, art: !!(art.ground || art.road) }),
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
  function drawRoads(g, D, o, art) {
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
    g.strokeStyle = rp ? '#8f8573' : '#6f6248'; g.lineWidth = o.roadW + 4; for (const s of segs) { path(s[3]); g.stroke(); }
    g.fillStyle = rp ? '#8f8573' : '#6f6248'; for (const id of hubs) disc(id, o.roadW * 0.8 + 2); for (const id of ends) disc(id, o.roadW * 0.75 + 2);
    g.strokeStyle = rp || '#e7dcc0'; g.lineWidth = o.roadW; for (const s of segs) { path(s[3]); g.stroke(); }
    g.fillStyle = rp || '#ece3ca'; for (const id of hubs) disc(id, o.roadW * 0.8); for (const id of ends) disc(id, o.roadW * 0.75);
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
      const P = pick < ART.props[0].p ? ART.props[0] : ART.props[1];
      out.push({ x: px, y: py, file: P.file, w: P.w * (0.8 + rnd() * 0.45) });
    }
    return out;
  }

  let cssDone = false;
  function css(doc) {
    if (cssDone || doc.getElementById('rfw-css')) return; cssDone = true;
    const s = doc.createElement('style'); s.id = 'rfw-css';
    s.textContent = `#rfp .rfw{position:absolute;inset:0;overflow:hidden;background:#86b65a;z-index:1}
#rfp .rfw-plane{position:absolute;left:0;top:0;transform-origin:0 0;will-change:transform}
#rfp .rfw-chunk{position:absolute;display:block}
#rfp .rfw-bb{position:absolute;inset:0;pointer-events:none}
#rfp .rfw-tile{position:absolute;left:0;top:0;will-change:transform}
#rfp .rfw-tile img{display:block;width:100%;height:auto}
#rfp .rfw-tile span{position:absolute;left:0;right:0;top:30%;text-align:center;font:800 11px/1 "Noto Sans JP",sans-serif;color:#13233a;text-shadow:0 0 3px #fff,0 0 3px #fff}
#rfp .rfw-tile span:empty{display:none}
#rfp .rfw-tile.used img{opacity:.55}
#rfp .rfw-tile.cur img{filter:drop-shadow(0 0 5px #fff6c0)}
#rfp .rfw-prop{position:absolute;left:0;top:0;will-change:transform;pointer-events:none;user-select:none;-webkit-user-drag:none}
#rfp .rfw.art{background:#7aa84c}
#rfp .rfw-mon{position:absolute;left:0;top:0;will-change:transform}
#rfp .rfw-mon img{display:block;width:100%;height:auto;filter:drop-shadow(0 3px 2px rgba(0,0,0,.45))}
#rfp .rfw-title{position:absolute;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 18px);text-align:center;font-family:"Shippori Mincho",serif;font-weight:800;font-size:26px;color:#fff;text-shadow:0 2px 6px rgba(0,0,0,.6);opacity:0;pointer-events:none;z-index:3}
#rfp .rfw-title small{display:block;font-size:12px;letter-spacing:.25em;font-family:"Noto Sans JP",sans-serif}
#rfp .rfw-title em{display:block;font-style:normal;font-size:12px;font-family:"Noto Sans JP",sans-serif;opacity:.9}
#rfp.rfw-intro .rf-top,#rfp.rfw-intro .rf-tools,#rfp.rfw-intro .rf-bot{opacity:0;pointer-events:none;transition:opacity .4s}
#rfp.rfw-on .rf-cam{display:none}`;
    doc.head.appendChild(s);
  }

  const api = { DEF, WORLD, ART, project, fitZoom, lookahead, create, scatter };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.MMRF_WORLD = api;
})(typeof window !== 'undefined' ? window : globalThis);
