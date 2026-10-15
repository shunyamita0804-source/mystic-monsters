// =========================================================
// Chapter 2「潮風の海岸」A／B／C 設計案の試作 — 海の世界ボードの描画 `MMRF_SEA`（2026-10-15・未承認。本編にはつながない）
//
//  js/proto/roadfirst-world.js（MMRF_WORLD）が、道のデータが art.sea3d を持つとき（js/proto/ch2-routes.js の MMRF_CH2）だけ呼ぶ。Chapter 1 では何もしない。
//  2.5D の作り（ユーザー承認の論点 3＝螺旋塔の 12〜13 歩の上昇を、塔の絵を置くだけにせず歩行・斜路・上昇がつながる表現で）：
//    ・海面の板（区画の canvas・高さ 0）：海・陸の島・港町・海面の桟橋。海底の盆地の上は半透明の水（下の海底が透けて見える）
//    ・海底の板（canvas 1枚・高さ −depth）：海底の砂地・ガラス回廊（海底の道）・沈んだ遺跡
//    ・盆地の壁（ふちから海底まで）・潮の塔の下り坂と螺旋塔の上り坂（高さが少しずつ変わる石の斜路と、その下の壁）・螺旋塔と潮の塔（多角柱）＝CSS 3D の板
//    ・マス・モンスター・景物は従来どおり立てて置く（MMRF_WORLD.project が高さを含めて写す＝斜路の上ではマスもモンスターも上がる）
//  絵：正式の Chapter 2 の素材はまだ無い。Chapter 1 の正式素材（海の浅瀬・岸の帯・石の道・草地・景物）を「代用」として使う（docs/ch2_abc_design_1015/asset_requirements.tsv）。
//    塔・壁・海底の色は CSS と canvas の塗り（素材待ちの仮）。画像は生成していない。
// =========================================================
(function (root) {
  'use strict';
  const FILES = { water: 'ground_water.webp', shore: 'edge_shore.webp', rock: 'edge_rock.webp' };
  const TOWN_TEX = './assets/fields/ch1a/board_hq_1014/road_r1.webp', STONE_TEX = './assets/fields/ch1a/board_hq_1014/road_r2.webp';
  const W_TILE = 96, SEA_TINT = 'rgba(18,86,138,.42)', DEEP_TINT = 'rgba(8,40,78,.55)';
  const BASIN_ALPHA = 0.62, BASIN_UNDER = 0.86;   // 盆地の上の海面の濃さ（海面にいるとき）・海底に潜ったときに消す割合（大きいほど海底がよく見える）

  function load(loadFn, base) {   // board_art_1010 の絵（読めなければ null＝仮の色で描く）
    const keys = Object.keys(FILES);
    const town = new Promise((res) => { const im = new root.Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = TOWN_TEX; });
    return Promise.all([...keys.map((k) => loadFn(FILES[k])), town]).then((a) => { const o = {}; keys.forEach((k, i) => { o[k] = a[i]; }); o.town = a[keys.length]; return o; });
  }
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
  const signedArea = (P) => { let a = 0; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; };
  const basinOf = (D) => soft(D.art.basin, 7, 'basin');
  const regionsOf = (D) => D.art.regions.map((r) => ({ r, P: soft(r.poly, r.kind === 'arena' ? 3 : 8, r.id) }));
  function pat(g, H, im, tile) { return im ? H.pattern(g, im, tile) : null; }

  // ---- 海面の板（区画ごと） ----
  function ground(g, D, bx, art, H) {
    const S = art.sea || {}, [x0, y0, w, h] = bx;
    // 海：浅瀬の絵＋深い青
    const wp = pat(g, H, S.water, W_TILE);
    g.fillStyle = wp || '#2d8fc4'; g.fillRect(x0, y0, w, h);
    g.fillStyle = SEA_TINT; g.fillRect(x0, y0, w, h);
    // 盆地の上：海面を薄くする（下の海底が透ける）＋ふちに沿って明るい波の帯
    const B = basinOf(D);
    // 盆地の上は穴をあける（盆地の上の海面は別の板＝build3d の rfs-water。モンスターが海底にいる間は薄くなる＝潜った見え方）
    g.save(); polyPath(g, B); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.fill(); g.restore();
    // 陸（島・港町・会場の島）：草地（港町は石畳）＋岸の帯
    for (const { r, P } of regionsOf(D)) {
      g.save(); polyPath(g, P); g.clip();
      const tp = r.id === 'town' ? pat(g, H, S.town, 57.5) : r.kind === 'arena' ? pat(g, H, S.town, 57.5) : pat(g, H, art.ground, H.ART.ground.tile);
      g.fillStyle = tp || (r.kind === 'arena' ? '#e9dfba' : '#8fbf5a'); g.fillRect(x0, y0, w, h);
      if (r.kind === 'arena') { g.fillStyle = 'rgba(255,240,205,.28)'; g.fillRect(x0, y0, w, h); }
      g.restore();
      if (S.shore) { const Q = signedArea(P) > 0 ? P.slice().reverse() : P.slice(); Q.push(Q[0]); H.stripAlong(g, Q, S.shore, 16, bx, 4); }
      else { g.save(); polyPath(g, P); g.strokeStyle = '#e8dcb0'; g.lineWidth = 5; g.stroke(); g.restore(); }
    }
  }
  /** 海面の道（桟橋・橋・島の道）：海の上は石の道の帯＋下に落ちる影（橋に見せる）。海底・斜路の区間は描かない（海底の板と CSS 3D の斜路が描く） */
  function roads(g, D, o, art, bx, H) {
    const segs = Object.entries(D.segments).filter(([sid]) => isSurface(zoneOf(D, sid)));
    const pts = segs.map(([, s]) => H.curvePts(s[3].map((id) => D.nodes[id])));
    g.lineCap = g.lineJoin = 'round';
    g.save(); g.translate(0, 7); g.strokeStyle = 'rgba(6,30,52,.38)'; g.lineWidth = 22;
    for (const P of pts) { g.beginPath(); P.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); }
    g.restore();
    if (art.strip) for (const P of pts) H.stripAlong(g, P, art.strip, H.ART.strip.w, bx);
    else { g.strokeStyle = '#d9cfb0'; g.lineWidth = 18; for (const P of pts) { g.beginPath(); P.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); } }
    hubs(g, D, (sid) => isSurface(zoneOf(D, sid)), art, H);
  }
  /** 分かれ目・合流・行き止まりの敷石の円（その板の区間だけ） */
  function hubs(g, D, keep, art, H) {
    const out = {}, inn = {}, mine = new Set();
    for (const e of D.edges) { if (!keep(e[2])) continue; mine.add(e[0]); mine.add(e[1]); if (e[3] === 'forward') { out[e[0]] = (out[e[0]] || 0) + 1; inn[e[1]] = (inn[e[1]] || 0) + 1; } }
    const ids = [...mine].filter((id) => (out[id] || 0) > 1 || (inn[id] || 0) > 1 || /dead_end/.test(D.nodes[id][2]));
    const rp = art.road ? H.pattern(g, art.road, 57.5) : null, r = H.ART.strip.w * 0.62;
    for (const id of ids) { const n = D.nodes[id]; g.fillStyle = '#8f8573'; g.beginPath(); g.arc(n[0], n[1], r + 1.5, 0, 7); g.fill(); g.fillStyle = rp || '#d9cfb0'; g.beginPath(); g.arc(n[0], n[1], r - 1, 0, 7); g.fill(); }
  }
  function apron(el, base, m) {   // 世界の外の海。世界の中は区画の canvas が描く（重ねると盆地の上の透ける所から海底が見えなくなる＝世界の範囲は切り抜く）
    el.style.backgroundImage = `linear-gradient(${SEA_TINT},${SEA_TINT}),url(${base}${FILES.water})`; el.style.backgroundSize = `auto,${W_TILE}px ${W_TILE}px`;
    const W = 1024, H = 1536, a = m + 2, b = m - 2;
    el.style.clipPath = `polygon(evenodd,0 0,100% 0,100% 100%,0 100%,0 0,${a}px ${a}px,${a}px ${b + H}px,${b + W}px ${b + H}px,${b + W}px ${a}px,${a}px ${a}px)`;
  }

  // ---- 景物：陸には木・茂み・岩・花、海には岩礁、海底には苔むした岩と遺跡の柱 ----
  function scatter(D, o, H) {
    const rnd = H.mulberry(0x2C2A), out = [], B = basinOf(D), regs = regionsOf(D), dep = D.art.depth || 36;
    const lines = Object.values(D.segments).map((s) => s[3].map((id) => D.nodes[id]));
    const nearRoad = (x, y, r) => lines.some((l) => H.distLine(l, x, y) < r);
    const towers = D.art.towers || [];
    const nearTower = (x, y, m) => towers.some((t) => Math.hypot(t.c[0] - x, t.c[1] - y) < t.r + m);
    const lmNear = (x, y, r) => (D.art.landmarks || []).some((L) => { const at = H.landmarkAt(D, L); return at && Math.hypot(at[0] - x, at[1] - y) < r; });
    const gn = D.nodes.GOAL;
    const LAND = [['prop_tree.webp', 28, 0.32], ['prop_shrub.webp', 16, 0.22], ['prop_flowers.webp', 13, 0.18], ['prop_rock.webp', 20, 0.14], ['prop_conifer.webp', 16, 0.14]];
    const SEABED = [['prop_mossy_rock.webp', 17, 0.42], ['rock_pillar.webp', 18, 0.22], ['prop_pillar.webp', 11, 0.18], ['prop_stream_rocks.webp', 17, 0.18]];
    const pick = (L) => { let r = rnd(), acc = 0; for (const c of L) { acc += c[2]; if (r < acc) return c; } return L[L.length - 1]; };
    for (let y = 30; y < 1530; y += 26) for (let x = 14; x < 1020; x += 26) {
      const px = x + (rnd() - 0.5) * 20, py = y + (rnd() - 0.5) * 20, r1 = rnd();
      if (gn && Math.hypot(gn[0] - px, gn[1] - py + 30) < 90) continue;
      if (nearTower(px, py, 16) || lmNear(px, py, 34)) continue;
      const reg = regs.find((q) => H.inPoly(q.P, px, py));
      if (reg && reg.r.kind !== 'arena' && reg.r.id !== 'town') {   // 陸の島
        if (r1 > 0.62 || nearRoad(px, py, 16)) continue; const c = pick(LAND); out.push({ file: c[0], x: px, y: py, w: c[1] * (0.8 + rnd() * 0.4) }); continue;
      }
      if (reg) continue;
      if (H.inPoly(B, px, py)) {   // 海底（盆地の中）：道から少し離して岩と遺跡
        if (r1 > 0.2 || nearRoad(px, py, 22)) continue; const c = pick(SEABED); out.push({ file: c[0], x: px, y: py, w: c[1] * (0.8 + rnd() * 0.4), h: -dep }); continue;
      }
      if (r1 < 0.022 && !nearRoad(px, py, 30)) out.push({ file: 'prop_stream_rocks.webp', x: px, y: py, w: 18 + rnd() * 8 });   // 海の岩礁（まばら）
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
    g.fillStyle = (S.water && H.pattern(g, S.water, 70)) || '#2a6f93'; g.fillRect(bx0, by0, bw, bh);
    g.fillStyle = DEEP_TINT; g.fillRect(bx0, by0, bw, bh);
    // 砂地のまだら（決まった乱数）
    const rnd = H.mulberry(0x5EA); for (let i = 0; i < 900; i++) { g.fillStyle = rnd() < 0.5 ? 'rgba(230,214,170,.10)' : 'rgba(10,40,60,.12)'; g.beginPath(); g.arc(bx0 + rnd() * bw, by0 + rnd() * bh, 2 + rnd() * 9, 0, 7); g.fill(); }
    // ガラス回廊：海底の道に沿った明るい帯（ガラスの床と両側の光る縁）
    const under = Object.entries(D.segments).filter(([sid]) => zoneOf(D, sid) === 'undersea');
    const lines = under.map(([, s]) => H.curvePts(s[3].map((id) => D.nodes[id])));
    g.lineCap = g.lineJoin = 'round';
    for (const [lw, col] of [[40, 'rgba(160,236,255,.22)'], [32, 'rgba(200,248,255,.22)']]) { g.strokeStyle = col; g.lineWidth = lw; for (const P of lines) { g.beginPath(); P.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); } }
    if (art.strip) for (const P of lines) H.stripAlong(g, P, art.strip, H.ART.strip.w, box);
    hubs(g, D, (sid) => zoneOf(D, sid) === 'undersea', art, H);
    // 盆地のふちの影（内側を暗く＝深さ）
    g.strokeStyle = 'rgba(4,20,36,.35)'; g.lineWidth = 46; polyPath(g, B); g.stroke();
    g.restore();
    g3.appendChild(cv);
    // 盆地の上の海面（高さ 0 の別の板）：モンスターが海面にいる間は濃く（下が少し透ける）・海底へ潜ると薄く＝海の中の景色
    const wv = doc.createElement('canvas'); wv.className = 'rfs-water'; wv.width = Math.ceil(bw * 0.8); wv.height = Math.ceil(bh * 0.8);
    Object.assign(wv.style, { left: bx0 + 'px', top: by0 + 'px', width: bw + 'px', height: bh + 'px', transform: 'translateZ(0.3px)' });
    { const w2 = wv.getContext('2d'); w2.setTransform(0.8, 0, 0, 0.8, -bx0 * 0.8, -by0 * 0.8); w2.save(); polyPath(w2, B); w2.clip();
      w2.fillStyle = (S.water && H.pattern(w2, S.water, W_TILE)) || '#2d8fc4'; w2.fillRect(bx0, by0, bw, bh); w2.fillStyle = SEA_TINT; w2.fillRect(bx0, by0, bw, bh); w2.restore();
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
      quad(doc, g3, [p[0], p[1], 0], U, [0, 0, -1], L + 0.6, dep, 'rfs-wall', { background: `linear-gradient(180deg, rgba(20,70,96,${(0.25 / lit).toFixed(2)}) 0%, rgba(8,34,56,${(0.62 / lit).toFixed(2)}) 100%), url(${STONE_TEX}) ${(-i * 7) % 30}px 0/30px 30px` });
    }
    // 斜路（潮の塔の下り坂・螺旋塔の上り坂）：高さの変わる石の道（細かい板を並べる）＋その下の壁
    const stripUrl = art.strip ? (art.strip.currentSrc || art.strip.src) : null, RW = 18;
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
          if (hh > 1) quad(doc, g3, E, [dx2 / L2, dy2 / L2, 0], [0, 0, -1], L2 + 0.5, hh, 'rfs-skirt', { background: `linear-gradient(180deg, rgba(0,0,0,0) 0 2px, rgba(30,26,20,.28) 3px, rgba(10,30,44,.55) 100%), url(${TOWN_TEX}) ${(-cum) % 28}px 0/28px 28px` });
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
        quad(doc, g3, [p[0], p[1], top], U, [0, 0, -1], L + 0.4, hgt, 'rfs-tw', { background: `linear-gradient(rgba(30,24,16,${(0.62 - lit * 0.55).toFixed(2)}),rgba(30,24,16,${(0.62 - lit * 0.55).toFixed(2)})), repeating-linear-gradient(180deg, rgba(0,0,0,0) 0 11px, rgba(60,48,30,.35) 11px 12px), url(${TOWN_TEX}) ${(-i * L) % 28}px 0/28px 28px` });
      }
      // 屋上（円）と灯（螺旋塔は頂上の灯台）
      const cap = doc.createElement('div'); cap.className = 'rfs-cap'; const d = t.r * 2;
      Object.assign(cap.style, { width: d + 'px', height: d + 'px', transform: `translate3d(${t.c[0] - t.r}px,${t.c[1] - t.r}px,${top + 0.2}px)`,
        background: `radial-gradient(circle, ${shade(stone, 1.08)} 0 55%, ${shade(stone, 0.86)} 56% 62%, ${shade(stone, 1.02)} 63% 100%)` });
      g3.appendChild(cap);
      if (t.kind === 'spiral' || t.kind === 'tide') {
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
    let dived = null;
    function mon(h) { const u = (h || 0) < -2; if (u === dived) return; dived = u; wv.style.opacity = u ? String(1 - BASIN_UNDER) : String(BASIN_ALPHA); }
    mon(0);
    return { occl, mon, el: g3 };
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
:is(#rfp,.wbv) .rfs-glow{position:absolute;left:0;top:0;transform-origin:0 0;border-radius:50%;background:radial-gradient(circle,#fffbe0 0 30%,rgba(255,236,150,.55) 45%,rgba(255,236,150,0) 70%)}`;
    doc.head.appendChild(s);
  }
  const api = { FILES, load, ground, roads, scatter, apron, build3d, curve3, m3 };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.MMRF_SEA = api;
})(typeof window !== 'undefined' ? window : globalThis);
