// =========================================================
// 2026-10-20 第4便B：盤の地面と道を WebGL2 で描く（js/proto/board-gl.js の MMGL）
//  GL-01 読み込み：index.html は board-gl.js を roadfirst-world.js の前に読む・?glBoard=0／WebGL2 が無い端末は従来の描き方
//  GL-02 カメラの式：project と同じ（yaw → 倍率 → rotateX → perspective）・深さは目からの距離の一次式（一次でないと目の近くの三角形が誤って切られた）
//  GL-03 盤ごとの作り方（glKit）：Chapter 1・3（roadfirst-world.js）・2（ch2-world.js）・4（ch4-world.js）が、ユーザー納品の地面（E03）・道と広場（E04）の素材を使う（素材がある）
//  GL-04 描き直し：描き直しの印（S.dirty）は署名に入れず、立っていれば必ず描く（続けて 2 回立つと 2 回目が描かれなかった）
//  GL-05 縁石の素材：納品の縁石の帯の外（市松模様）を切り落としている（不透明な帯だけ）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');

test('GL-01：board-gl.js を roadfirst-world.js の前に読む・従来の描き方へ戻る口', () => {
  const html = rd('index.html'), i = html.indexOf('./js/proto/board-gl.js'), j = html.indexOf('./js/proto/roadfirst-world.js');
  assert.ok(i > 0 && i < j, 'board-gl.js は roadfirst-world.js の前');
  const g = rd('js/proto/board-gl.js');
  assert.match(g, /const OFF = \/\[\?&\]glBoard=0\/\.test\(QS\);/);
  assert.match(g, /getContext\('webgl2'\)/);
  const w = rd('js/proto/roadfirst-world.js');
  assert.match(w, /const GLK = o\.art && o\.gl !== false && root\.MMGL && root\.MMGL\.supported\(doc\) \? glKitOf\(D, o, SEA, art\) : null;/);
  assert.match(w, /if \(!GL\) for \(let y = 0; y < H; y \+= o\.chunk\)/, 'WebGL の盤は区画の canvas（CSS 3D の層）を作らない');
  assert.match(w, /const HI = QR && !GL \? QR\.hiLayer\(/, '近くの層（CSS 3D）も作らない');
  assert.match(w, /plane\.style\.transform = planeTf\(c\);[^\n]*\n\s+if \(GL\) GL\.draw\(c\);/);
});

test('GL-02：カメラの式は project と同じ・深さは一次式', () => {
  const g = rd('js/proto/board-gl.js');
  assert.match(g, /float rx = X0 \* uY\.x - Y0 \* uY\.y, ry = X0 \* uY\.y \+ Y0 \* uY\.x;/);
  assert.match(g, /float z = Y \* uB\.w \+ Z \* uB\.z, w = \(uA\.w - z\) \/ uA\.w, Yc = Y \* uB\.z - Z \* uB\.w;/);
  assert.match(g, /float d = uA\.w - z, N = 40\.0, F = 60000\.0;/);
  assert.match(g, /\(d \* \(F \+ N\) \/ \(F - N\) - 2\.0 \* F \* N \/ \(F - N\)\) \/ uA\.w, w\);/);
  assert.match(g, /gl\.uniform4f\(U\.uA, c\.tx, c\.ty, c\.s, c\.P\); gl\.uniform4f\(U\.uB, c\.ax, c\.ay, Math\.cos\(th\), Math\.sin\(th\)\);/);
  //  project（roadfirst-world.js）と同じ順の式
  const w = rd('js/proto/roadfirst-world.js');
  assert.match(w, /const Z = \(h \|\| 0\) \* cam\.s, z = Y \* Math\.sin\(th\) \+ Z \* Math\.cos\(th\), k = cam\.P \/ \(cam\.P - z\);/);
});

test('GL-03：盤ごとの作り方と、ユーザー納品の地面・道・広場の素材', () => {
  for (const ch of ['ch1', 'ch2', 'ch3', 'ch4']) for (const k of ['ground', 'road', 'curb', 'plaza']) assert.ok(existsSync(path.join(ROOT, `assets/fields/gl_1020/${ch}_${k}.webp`)), `${ch}_${k}`);
  for (const f of ['ch2_seabed', 'ch3_cloud']) assert.ok(existsSync(path.join(ROOT, `assets/fields/gl_1020/${f}.webp`)), f);
  const w = rd('js/proto/roadfirst-world.js');
  assert.match(w, /const GL_DIR = '\.\/assets\/fields\/gl_1020\/';/);
  assert.match(w, /if \(SEA\) return SEA\.glKit \? SEA\.glKit\(D, o, art, HELP\) : null;/);
  assert.match(rd('js/proto/ch2-world.js'), /function glKit\(D, o, art, H\)/);
  assert.match(rd('js/proto/ch2-world.js'), /if \(ctx\.gl\) return build3dGL\(ctx\);/, 'Chapter 2 の海底・壁・斜路・塔も WebGL');
  assert.match(rd('js/proto/ch4-world.js'), /function glKit\(D, o, art, H\)/);
  assert.match(rd('js/proto/ch4-world.js'), /function ground\(g, D, bx, art, H, noBase\)/, 'Chapter 4 の地形の絵は地面のくり返しを塗らない');
});

test('GL-04：描き直しの印は署名に入れない', () => {
  const w = rd('js/proto/roadfirst-world.js');
  assert.match(w, /S\.mon \? S\.mon\[1\] : 0\]\.map\(\(x\) => Math\.round\(x \* 10\)\)\.join\(','\);/);
  assert.match(w, /if \(sig === S\.sig && !S\.dirty\) return; S\.sig = sig; S\.dirty = false;/);
});

test('GL-05：縁石の素材は帯の外を切り落としている（不透明な帯だけ）', () => {
  const t = rd('tools/fullplay1020/gl-art.py');
  assert.match(t, /rows = np\.where\(a\[\.\.\., 3\]\.mean\(1\) > 200\)\[0\]/);
});
