// =========================================================
// 1枚の世界ビュー（2026-10-10・絵なしの技術検証。js/proto/roadfirst-world.js・roadfirst-view.js の &rfView=world）とレアの1マス
//  RW-01 project：注視点は画面の注視位置へ・傾き0は等倍で線形・傾けると奥ほど小さく上へ
//  RW-02 fitZoom：返した倍率で点がすべて枠の中・入らなければ下限
//  RW-03 lookahead：START から6マス先・分かれ目のあとは3マスずつ・枝を戻る途中は逆向き・原本の接続だけ
//  RW-04 レア（ユーザー決定）：1つの Chapter に1マス・Z1 右の本道と Z2 石像の尾根の通常マスだけ・野生の隣に置かない・同じ seed＝同じ
//  RW-05 フラグ：&rfView=world のときだけ・保存の鍵は同じ・index.html の読み込み順・world は保存／通信をしない
//  RW-07 地形（2026-10-11）：谷の多角形は原本の区間だけでできる・石橋の区間がある・谷の中／道のまわり（陸）／谷の外を正しく分ける・景物は谷に置かない
//  RW-08 第4便（2026-10-11）：雲海＝後半の左右の輪の内側（LATE_SAFE は雲海の上の尾根）・森・目印のまわりの岩棚・川の景物・山の岩峰
//  RW-06 ボード素材の試し貼り（&rfArt=1010・第1便＋第2便）：ファイルがそろう・景物は道とマスに重ならない・同じ配置・GOAL のまわりに置かない
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEngine } from './chapter-sim.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
loadEngine();
await import('../js/proto/roadfirst-data.js');
await import('../js/proto/roadfirst-core.js');
await import('../js/proto/roadfirst-play.js');
await import('../js/proto/roadfirst-world.js');
const D = globalThis.MMRF_DATA, C = globalThis.MMRF_CORE, P = globalThis.MMRF_PLAY, Wd = globalThis.MMRF_WORLD;

test('RW-01：project＝注視点は注視位置・傾き0は線形・傾けると奥ほど小さく上へ', () => {
  const cam = { tx: 500, ty: 1000, s: 2, tilt: 0, P: 900, ax: 195, ay: 500 };
  assert.deepEqual([Wd.project(cam, 500, 1000).x, Wd.project(cam, 500, 1000).y], [195, 500]);
  const a = Wd.project(cam, 510, 990); assert.equal(a.x, 215); assert.equal(a.y, 480); assert.equal(a.k, 1);
  const t = Object.assign({}, cam, { tilt: 40 });
  const far = Wd.project(t, 500, 900), near = Wd.project(t, 500, 1050);
  assert.ok(far.k < 1 && near.k > 1, '奥は縮み手前は大きい'); assert.ok(far.y < 500 && near.y > 500);
  assert.ok(500 - far.y < 100 * 2, '奥は傾きのぶん詰まって見える');
});

test('RW-02：fitZoom＝返した倍率で点がすべて枠の中', () => {
  const cam = { tx: 512, ty: 1400, s: 1, tilt: 40, P: 900, ax: 160, ay: 520 };
  const rect = { l: 22, r: 298, t: 160, b: 640 };
  const pts = D.segments.S01[3].slice(1, 7).map((id) => D.nodes[id]);
  const s = Wd.fitZoom(cam, pts, rect, 1.3, 4.2);
  assert.ok(s >= 1.3 && s <= 4.2);
  for (const p of pts) { const q = Wd.project(Object.assign({}, cam, { s }), p[0], p[1]); assert.ok(q.x >= rect.l && q.x <= rect.r && q.y >= rect.t - 1e-6 && q.y <= rect.b, `${q.x},${q.y}`); }
  assert.equal(Wd.fitZoom(cam, [[0, 0]], rect, 1.3, 4.2), 1.3, '入らなければ下限');
});

test('RW-03：lookahead＝6マス先・分かれ目のあとは3マスずつ・枝を戻る途中は逆向き', () => {
  assert.deepEqual(Wd.lookahead(D, 'START', null, null, 6), D.segments.S01[3].slice(1, 7));
  const j = Wd.lookahead(D, 'J0', ['EL01_01', 'ER01_01'], null, 6);
  assert.deepEqual(j, ['EL01_01', 'EL01_02', 'EL01_03', 'ER01_01', 'ER01_02', 'ER01_03']);
  const fwd = new Set(D.edges.filter((e) => e[3] === 'forward').map((e) => e[0] + '>' + e[1]));
  for (const id of Object.keys(D.nodes)) for (const x of Wd.lookahead(D, id, null, null, 6)) assert.ok(D.nodes[x], x);
  const s = D.segments.D_RC[3]; assert.deepEqual(Wd.lookahead(D, s[s.length - 1], null, 'D_RC', 6), s.slice(0, -1).reverse(), '戻り道は枝を逆に');
  assert.ok(fwd.has('START>S01_01'));
});

test('RW-04：レアは育成開始時に1回だけ 10%（当たれば1マス・外れれば0マス）・Z1／Z2 の行き止まりでない通常マスだけ・野生の隣に置かない（2026-10-11）', () => {
  const zones = new Set(Object.values(P.TUNING.rare.zones).flat());
  assert.deepEqual([P.TUNING.rare.chance, P.TUNING.rare.count, zones.size], [0.1, 1, 38]);
  const nb = {}; for (const s of Object.values(D.segments)) for (let i = 0; i < s[3].length; i++) (nb[s[3][i]] = nb[s[3][i]] || []).push(s[3][i - 1], s[3][i + 1]);
  // 行き止まりでない＝その地点から前へ進む道で GOAL に着ける
  const out = {}; for (const e of D.edges) if (e[3] === 'forward') (out[e[0]] = out[e[0]] || []).push(e[1]);
  const reach = (id) => { const seen = new Set([id]), q = [id]; while (q.length) { const x = q.shift(); if (x === 'GOAL') return true; for (const y of out[x] || []) if (!seen.has(y)) { seen.add(y); q.push(y); } } return false; };
  for (const id of zones) assert.ok(reach(id), `${id} は GOAL へ進める（行き止まりではない）`);
  const N = 3000, seen = new Set(); let hits = 0;
  for (let seed = 1; seed <= N; seed++) {
    const t = P.layout(D, seed), r = Object.keys(t).filter((k) => t[k].rare);
    assert.ok(r.length <= 1, `${seed}：1回の育成で最大1マス`);
    if (!r.length) continue;
    hits++;
    assert.ok(zones.has(r[0]) && D.nodes[r[0]][2] === 'ordinary_tile', `${seed}：${r[0]} はゾーンの通常マス`);
    assert.ok(!(nb[r[0]] || []).some((x) => x && t[x] && t[x].t === 'wild' && !t[x].rare), `${seed}：野生の隣ではない`);
    seen.add(r[0].startsWith('ER') ? 'Z1' : 'Z2');
  }
  assert.ok(hits / N > 0.085 && hits / N < 0.115, `出現率はおよそ 10%（${(hits / N * 100).toFixed(1)}%）`);
  assert.deepEqual([...seen].sort(), ['Z1', 'Z2']);
  assert.deepEqual(P.layout(D, 5), P.layout(D, 5), '同じ seed は同じ配置');
});

test('RW-05：&rfView=world のときだけ・保存の鍵は同じ・読み込み順・world は保存／通信をしない', () => {
  const v = rd('js/proto/roadfirst-view.js'), w = rd('js/proto/roadfirst-world.js'), html = rd('index.html');
  assert.match(v, /const ZWORLD = ON && \(Q\.get\('rfView'\) === 'world' \|\| \(!!CH2 && Q\.get\('rfView'\) !== 'plan'\)\)/);   // 2026-10-15：Chapter 2 設計案のプレビューは既定で世界ビュー（Chapter 1 の試作は従来どおり &rfView=world のときだけ）
  assert.match(v, /const KEY = 'mmrf_proto_v1'/);
  assert.doesNotMatch(w, /localStorage|fetch\(|XMLHttpRequest/);
  const iz = html.indexOf('roadfirst-zones.js'), iw = html.indexOf('roadfirst-world.js'), iv = html.indexOf('roadfirst-view.js');
  assert.ok(iz < iw && iw < iv, 'zones → world → view');
});

test('RW-06：ボード素材の試し貼り（&rfArt=1010）＝ファイル・景物は道に重ならない・同じ配置', async () => {
  const { existsSync } = await import('node:fs');
  const A = Wd.ART, files = [A.ground.file, A.road.file, A.goal.file, ...A.props.map((q) => q.file)];
  for (const f of files) assert.ok(existsSync(path.join(ROOT, 'assets/proto/board_art_1010', f)), f);
  assert.match(rd('js/proto/roadfirst-view.js'), /const ART = ZWORLD && \(Q\.get\('rfArt'\) === '1010' \|\| \(!!CH2 && Q\.get\('rfArt'\) !== 'none'\)\)/);
  for (const L of A.landmarks) {
    for (const f of [L.file, L.open].filter(Boolean)) assert.ok(existsSync(path.join(ROOT, 'assets/proto/board_art_1010', f)), f);
    assert.ok(D.nodes[L.node], L.node); const at = Wd.landmarkAt(D, L); assert.ok(at && at[0] > 0 && at[0] < Wd.WORLD.w && at[1] > 0 && at[1] < Wd.WORLD.h, `${L.node} は世界の中`);
  }
  assert.equal(new Set(A.landmarks.map((L) => L.node)).size, A.landmarks.length, '1地点に目印1つ');
  // 第3便：役割ごとの専用マス（view の ART_TILE）と合流マス
  const vsrc = rd('js/proto/roadfirst-view.js'), tiles = [...vsrc.match(/const ART_TILE = \{([^}]*)\}/)[1].matchAll(/'([a-z_]+\.webp)'/g)].map((m) => m[1]).concat('tile_merge.webp');
  assert.ok(tiles.length >= 8, tiles.join());
  for (const f of tiles) assert.ok(existsSync(path.join(ROOT, 'assets/proto/board_art_1010', f)), f);
  assert.ok(existsSync(path.join(ROOT, 'assets/proto/board_art_1010', A.strip.file)));
  assert.ok(Math.abs(A.props.reduce((v, q) => v + q.p, 0) - 1) < 1e-9, '景物の割合の合計 1');
  const o = Object.assign({}, Wd.DEF), a = Wd.scatter(D, o), b = Wd.scatter(D, o);
  assert.deepEqual(a, b, '決まった乱数'); assert.ok(a.length > 100 && a.length < 600, `景物 ${a.length}`);
  for (const q of a) {
    assert.ok(q.y >= 150, 'GOAL の会場のまわりに置かない');
    for (const n of Object.values(D.nodes)) assert.ok(Math.hypot(n[0] - q.x, n[1] - q.y) >= o.roadW / 2 + 9, `マスに近すぎる (${q.x | 0},${q.y | 0})`);
  }
});

test('RW-07：地形＝谷は原本の区間から・石橋・谷の中と道のまわりの陸・景物は谷に置かない', () => {
  for (const T of Wd.TERRAIN) {
    for (const id of T.bridges) assert.ok(D.segments[id], `石橋 ${id}`);
    const P = Wd.loopPoly(D, T); assert.ok(P.length > 20, `${T.id} の多角形`);
    if (T.poly) { assert.equal(T.kind, 'forest', `${T.id}：決まった形は森だけ`); continue; }
    for (const [id] of T.loop) assert.ok(D.segments[id], `区間 ${id}`);
    assert.ok(Math.hypot(P[0][0] - P.at(-1)[0], P[0][1] - P.at(-1)[1]) < 1, `${T.id} は閉じた輪`);
  }
  assert.equal(Wd.inValley(D, 512, 1150), 'collapse', '崩落の谷の中'); assert.equal(Wd.inValley(D, 512, 760), 'central', '中央の崖の中');
  for (const id of ['J0', 'P', 'Q', 'R', 'EL1', 'ER3', 'START', 'GOAL']) assert.equal(Wd.inValley(D, D.nodes[id][0], D.nodes[id][1]), null, `${id} は陸`);
  assert.equal(Wd.inValley(D, 512, 1400), null, 'START の道のまわりは谷ではない');
  for (const q of Wd.scatter(D, Object.assign({}, Wd.DEF))) assert.equal(Wd.inValley(D, q.x, q.y), null, `景物 (${q.x | 0},${q.y | 0}) は谷の外`);
});

test('RW-08：第4便＝雲海は後半の輪の内側・尾根と目印のまわりは陸・森・川の景物・岩峰', async () => {
  const { existsSync } = await import('node:fs');
  const A = Wd.ART, T = A.terrain, files = [T.cloud.file, ...Object.values(T.edges).map((e) => e.file), ...Object.values(A.water).filter((v) => v.file).map((v) => v.file), A.peaks.file];
  for (const f of files) assert.ok(existsSync(path.join(ROOT, 'assets/proto/board_art_1010', f)), f);
  const kind = (x, y) => { const id = Wd.inValley(D, x, y); return id ? Wd.TERRAIN.find((t) => t.id === id).kind || 'valley' : null; };
  assert.equal(Wd.inValley(D, 640, 300), 'sky_r', '右の輪の内側＝雲海'); assert.equal(Wd.inValley(D, 420, 330), 'sky_l', '左の輪の内側＝雲海');
  for (const id of ['H', 'FINAL', 'STATUE', 'HR1', 'HR3', 'CHALLENGE', 'L_MERGE', 'LATE_SAFE_08']) assert.equal(Wd.inValley(D, D.nodes[id][0], D.nodes[id][1]), null, `${id} は陸（尾根）`);
  assert.equal(kind(60, 940), 'forest', '左の祭壇のまわりは森'); assert.equal(kind(380, 1480), 'forest', 'START の左は森');
  // 雲海・森の中の目印は岩棚・空き地（マスクから円で抜く＝landmarkAt の位置に雲・樹冠を描かない）
  const lion = Wd.landmarkAt(D, A.landmarks.find((l) => l.node === 'STATUE')); assert.equal(Wd.inValley(D, lion[0], lion[1]), 'sky_r', 'ライオン石像は雲海の輪の中＝岩棚を抜いて立てる');
  // 川の景物：川の始まりに滝が2つ・すべて世界の中・道（石橋）から離す
  const wp = Wd.waterProps(D), segs = Object.values(D.segments).map((s) => s[3].map((n) => D.nodes[n]));
  const dl = (l, x, y) => { let m = 1e9; for (let i = 0; i < l.length - 1; i++) { const a = l[i], b = l[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1))); m = Math.min(m, Math.hypot(a[0] + dx * t - x, a[1] + dy * t - y)); } return m; };
  assert.equal(wp.filter((q) => q.file === A.water.fall.file).length, 2, '滝 2'); assert.ok(wp.length >= 16, `川の景物 ${wp.length}`);
  for (const q of wp) { assert.ok(q.x > 0 && q.x < Wd.WORLD.w && q.y > 0 && q.y < Wd.WORLD.h, '世界の中'); if (q.file !== A.water.fall.file) assert.ok(Math.min(...segs.map((l) => dl(l, q.x, q.y))) >= 20, `道から離す (${q.x | 0},${q.y | 0})`); }
  assert.deepEqual(Wd.waterProps(D), wp, '決まった並び');
  // 岩峰：道から十分離れ・地形の外
  for (const [x, y, w] of A.peaks.at) { assert.ok(Math.min(...segs.map((l) => dl(l, x, y))) > w * 0.9, `岩峰 (${x},${y}) は道から離れる`); assert.equal(Wd.inValley(D, x, y), null, `岩峰 (${x},${y}) は地形の外`); }
  for (const q of Wd.scatter(D, Object.assign({}, Wd.DEF))) assert.ok(A.peaks.at.every(([x, y, w]) => Math.hypot(x - q.x, y - q.y) >= w * 0.6), '景物は岩峰に重ねない');
});
