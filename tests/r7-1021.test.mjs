// =========================================================
// 2026-10-21 第6便（iPhone 試遊 road6 の指摘 6 点・ユーザー納品 G01／G02・版 2026-10-21-road7）
//  R7-01 素材：G01（Chapter 4 の道一式 v2）・G02（Chapter 1 の崖のふち v2）を WebP に・旧の Chapter 4 の絵は *_e04 に残す・取り込みの道具
//  R7-02 START の円（planLayout）：道を延ばせる盤では小さくしない（後ろへ延ばす）・延ばせない盤でも道の幅が円に隠れる大きさより小さくしない
//  R7-03 広場から狭い角度で分かれる道：最初のマスどうしがマスの幅の 1.3 倍以上離れる
//  R7-04 崖のふち：切れ目のない帯（meshAlong）・ふちの線をならす（soften）・G02 の絵
//  R7-05 注目の幕：マスを描く位置（at）でつなぐ・暗さ 0.30
//  R7-06 門：1 本だけの道の上（spanAt）・またげない門は道の脇（gateSide）・どこにも置けなければ置かない
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
function load(files) { const w = {}; for (const f of files) new Function('window', 'module', rd(f))(w, undefined); return w; }
const W = load(['js/proto/roadfirst-world.js']).MMRF_WORLD;
const webpSize = (p) => { const b = readFileSync(path.join(ROOT, p)); assert.equal(b.toString('ascii', 0, 4), 'RIFF'); assert.equal(b.toString('ascii', 8, 12), 'WEBP');
  const k = b.toString('ascii', 12, 16); if (k === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)]; if (k === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  const v = b.readUInt32LE(21); return [1 + (v & 0x3fff), 1 + ((v >> 14) & 0x3fff)]; };

test('R7-01：G01・G02 の素材（WebP）・旧の絵・取り込みの道具', () => {
  for (const [f, w, h] of [['ch4_road', 2048, 2048], ['ch4_ground', 2048, 2048], ['ch4_plaza', 1024, 1024]]) assert.deepEqual(webpSize(`assets/fields/gl_1020/${f}.webp`), [w, h], f);
  const c = webpSize('assets/fields/gl_1020/ch4_curb.webp'); assert.equal(c[0], 2048); assert.ok(c[1] > 100 && c[1] < 160, '縁石の帯（上の透明な行を切った）');
  assert.deepEqual(webpSize('assets/proto/board_art_1010/edge_cliff_g02.webp'), [2048, 512]);
  for (const f of ['road', 'ground', 'plaza', 'curb']) assert.ok(existsSync(path.join(ROOT, `assets/fields/gl_1020/ch4_${f}_e04.webp`)), '旧の絵を残す ' + f);
  for (const f of ['edge_rock', 'edge_grass']) assert.ok(existsSync(path.join(ROOT, `assets/proto/board_art_1010/${f}.webp`)), 'Chapter 2 の代用の絵は残す ' + f);
  const t = rd('tools/road1021/g01-art.py');
  assert.match(t, /def blur_runs\(a, axis\):/, '中央のぼけた帯を見つける');
  assert.match(t, /def min_cut\(err\):/, '重なりの中を差の小さい道すじで切り替える');
});

//  小さな盤：START → S1 → S2 → J（分かれ道）→ A1..A3／B1..B3。START から J までは短い
const mini = (ang) => {
  const nodes = { START: [0, 0, 'start'], S1: [0, -14, 'normal'], S2: [0, -28, 'normal'], J: [0, -42, 'normal'] }, edges = [['START', 'S1', 0, 'forward'], ['S1', 'S2', 0, 'forward'], ['S2', 'J', 0, 'forward']];
  for (const [k, sg] of [['A', -1], ['B', 1]]) { let prev = 'J'; for (let i = 1; i <= 4; i++) { const a = (ang / 2) * sg * Math.PI / 180, d = 26 * i; const id = k + i; nodes[id] = [Math.sin(a) * d, -42 - Math.cos(a) * d, i === 4 ? 'dead_end' : 'normal']; edges.push([prev, id, 0, 'forward']); prev = id; } }
  const line = (ids) => ({ ids, P: ids.map((id) => nodes[id].slice(0, 2)) });
  return { D: { nodes, edges, segments: {} }, lines: [line(['START', 'S1', 'S2', 'J']), line(['J', 'A1', 'A2', 'A3', 'A4']), line(['J', 'B1', 'B2', 'B3', 'B4'])] };
};
const opt = (extend) => ({ tw: 11.5, S: 11.5 * 1.35, rOf: (id) => (id === 'START' || id === 'J' ? 18 : /4$/.test(id) ? 12 : 0), extend, extMax: 80, onGround: () => true, roadW: 30, W: 2000, H: 2000 });
const shift = (m, dx, dy) => { for (const n of Object.values(m.D.nodes)) { n[0] += dx; n[1] += dy; } for (const L of m.lines) for (const p of L.P) { p[0] += dx; p[1] += dy; } return m; };

test('R7-02：START の円は小さくしない（延ばせる盤）・延ばせない盤でも道の幅の半分＋0.5 まで', () => {
  const a = shift(mini(60), 1000, 1000), P = W.planLayout(a.D, a.lines, opt(true));
  assert.equal(P.r.START, 18, 'START の円はそのまま');
  const b = shift(mini(60), 1000, 1000), Q = W.planLayout(b.D, b.lines, opt(false));
  assert.ok(Q.r.START >= 30 / 2 + 0.5 - 1e-9, 'START の円は道の幅が隠れる大きさ以上：' + Q.r.START);
  const src = rd('js/proto/roadfirst-world.js');
  assert.match(src, /atStart = !atEnd && \/dead_end\|\^start\$\/\.test/, 'START の後ろへも延ばす');
});

test('R7-03：広場から狭い角度で分かれる道の最初のマスどうしは、マスの幅の 1.3 倍以上離れる', () => {
  for (const ang of [30, 45, 70]) {
    const m = shift(mini(ang), 1000, 1000), P = W.planLayout(m.D, m.lines, opt(true)), a = P.pos.A1, b = P.pos.B1;
    assert.ok(a && b, '最初のマスの位置');
    assert.ok(Math.hypot(a[0] - b[0], a[1] - b[1]) >= 11.5 * 1.3 - 0.6, `角 ${ang}°：${Math.hypot(a[0] - b[0], a[1] - b[1]).toFixed(1)}`);
  }
});

test('R7-04：崖のふちは切れ目のない帯（G02）・ふちの線をならす', () => {
  const src = rd('js/proto/roadfirst-world.js');
  assert.match(src, /grass: \{ file: 'edge_cliff_g02\.webp', w: 22, shift: 5 \}, rock: \{ file: 'edge_cliff_g02\.webp', w: 22, shift: 5 \}/);
  assert.match(src, /function meshAlong\(g, pts, im, w, bx, shift\)/);
  assert.match(src, /if \(E && C\) meshAlong\(g, C\.flip/, '谷・雲・森・岸のふちは meshAlong');
  assert.match(src, /return \{ pts: soften\(resample\(smooth\(p\), 2\.5\)\), edge: edgeOf\(p\[0\]\), kind \};/);
});

test('R7-05：注目の幕はマスを描く位置でつなぐ・暗さ 0.30', () => {
  const src = rd('js/proto/roadfirst-world.js'), i = src.indexOf('function paintVeil'), f = src.slice(i, src.indexOf('function paintChunk', i));
  assert.match(f, /lines\.push\(\[at\(e\[0\]\), at\(e\[1\]\)\]\)/);
  assert.match(f, /rgba\(8,18,30,\.30\)/);
  assert.doesNotMatch(f, /lines\.push\(\[D\.nodes\[e\[0\]\]/, '元の地点（D.nodes）ではつながない');
});

test('R7-06：門は 1 本だけの道の上（spanAt）・またげない門は道の脇（gateSide）', () => {
  const src = rd('js/proto/roadfirst-world.js');
  assert.match(src, /const spanOK = \(x, y, w\) => \{ const own = LINES\.filter/);
  assert.match(src, /u\[0\] \* h\[0\] \+ u\[1\] \* h\[1\] > 0\.866/, '出ていく道は入ってくる向きと 30° 以内');
  assert.match(src, /const gateSide = \(x, y, w0\) =>/);
  assert.match(src, /spans \? gateSide\(p0\[0\], p0\[1\], L\.w\) : placeB\(p0\[0\], p0\[1\], L\.w\); if \(!B\) continue;/);
});
