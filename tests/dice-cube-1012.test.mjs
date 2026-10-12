// 開発23 B：立体サイコロの比較試作（js/chapter/dice-cube.js・prototype/dice_1012/）
//  正式採用ではない＝ゲーム本体（index.html）からは読み込まない。出目の面が必ず正面に来ること・デモの素材がそろっていることだけを確かめる
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const load = () => { const ctx = { performance: { now: () => 0 } }; ctx.globalThis = ctx; vm.runInNewContext(read('js/chapter/dice-cube.js'), ctx); return ctx.MMDICE3D; };

// CSS の rotateX／rotateY（3×3。y は下向き＝CSS の座標）
const rad = (d) => (d * Math.PI) / 180;
const RX = (d) => { const c = Math.cos(rad(d)), s = Math.sin(rad(d)); return [[1, 0, 0], [0, c, -s], [0, s, c]]; };
const RY = (d) => { const c = Math.cos(rad(d)), s = Math.sin(rad(d)); return [[c, 0, s], [0, 1, 0], [-s, 0, c]]; };
const mul = (a, v) => a.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
// 面の置き方（dice-cube.js の FACE と同じ）：面の法線
const FACE_N = { 1: [0, 0, 1], 6: mul(RY(180), [0, 0, 1]), 3: mul(RY(90), [0, 0, 1]), 4: mul(RY(-90), [0, 0, 1]), 5: mul(RX(90), [0, 0, 1]), 2: mul(RX(-90), [0, 0, 1]) };

test('DC-01：止まる向き（BASE）で出目の面が正面（＋Z）に来る・周回を足しても同じ・向かい合う面の和は 7', () => {
  const D = load();
  for (let v = 1; v <= 6; v++) {
    const [bx, by] = D.BASE[v];
    for (const [nx, ny] of [[0, 0], [2, -3], [-3, 2], [3, -2]]) {
      const n = mul(RX(bx + 360 * nx), mul(RY(by + 360 * ny), FACE_N[v]));
      assert.ok(Math.abs(n[0]) < 1e-9 && Math.abs(n[1]) < 1e-9 && Math.abs(n[2] - 1) < 1e-9, `出目 ${v} の面が正面に来ない ${n}`);
    }
    assert.equal(D.PIPS[v].length, v, `出目 ${v} の目の数`);
  }
  for (const [a, b] of [[1, 6], [2, 5], [3, 4]]) assert.ok(FACE_N[a].every((x, i) => Math.abs(x + FACE_N[b][i]) < 1e-9), `${a} と ${b} は向かい合う`);
  const src = read('js/chapter/dice-cube.js');
  assert.match(src, /\[1, 'translateZ\(var\(--h\)\)'\], \[6, 'rotateY\(180deg\)/, 'テストの面の置き方が dice-cube.js の FACE と同じ');
});

test('DC-02：時間（0.93秒版＝全体 約1.7秒・1.30秒版＝全体 約2.1秒）・出目は渡された値だけ（乱数は回り方の見た目だけ）', () => {
  const D = load();
  assert.ok(D.T.lock <= 1000 && D.T.lock >= 800, `止まる ${D.T.lock}`);
  assert.ok(D.T.lock + D.T.hold + D.T.fade <= 1800, '全体');
  // 2026-10-12 比較：1.30秒版（tempo:'long'）＝空中で回る時間だけ +0.37秒・回る量 +1周。投げ始め・着地から止まるまで・見せる時間・消える時間は同じ
  const S = D.TEMPO.short, Lg = D.TEMPO.long;
  assert.equal(S.lock, 930); assert.equal(Lg.lock, 1300);
  assert.equal(Lg.air - S.air, 370); assert.equal(Lg.land - S.land, 370);
  assert.equal(Lg.lift, S.lift, '投げ始めは同じ'); assert.equal(Lg.lock - Lg.land, S.lock - S.land, '着地から止まるまでは同じ');
  assert.equal(Lg.turns, S.turns + 1, '回る量は1周多い');
  const total = Lg.lock + Lg.hold + Lg.fade; assert.ok(total >= 2100 && total <= 2200, `全体 ${total}`);
  const src = read('js/chapter/dice-cube.js');
  // 乱数は回る周回の数と向き（見た目のばらつき）だけ。止まる向きは BASE[出目]＋360°の倍数＝出目を引き直さない
  const lines = src.split('\n').filter((l) => /Math\.random/.test(l));
  assert.ok(lines.length >= 1 && lines.every((l) => /k: i \+ Math\.floor\(Math\.random\(\) \* 4\), dir:/.test(l)), lines.join('\n'));
  assert.match(src, /fx = bx \+ 360 \* nx, fy = by \+ 360 \* ny/, '最後の向き＝出目の向き＋周回');
});

test('DC-03：比較試作はゲーム本体から読み込まない・デモの素材と SE がそろっている', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /dice-cube\.js/, 'index.html は dice-cube.js を読み込まない（正式採用前）');
  assert.doesNotMatch(html, /prototype\/dice_1012/);
  const demo = read('prototype/dice_1012/index.html');
  for (const p of ['js/chapter/dice-cube.js', 'js/chapter/dice-renderer.js', 'assets/audio/se/mystic_monsters_official/01_dice_large_full.ogg', 'assets/fields/ch1a/dice/dice_blank.webp', 'assets/dice/std/10.webp']) assert.ok(fs.existsSync(path.join(ROOT, p)), p);
  // B4 版（今回の候補）と旧B2 版（不採用候補・比べるためだけ）。原音の MP3 は置かない（Pixabay の原音単体の再配布の禁止）
  assert.deepEqual(fs.readdirSync(path.join(ROOT, 'prototype/dice_1012/se')).sort(), ['dice_magic_b2_old.m4a', 'dice_magic_b2_old.ogg', 'dice_magic_b4.m4a', 'dice_magic_b4.ogg', 'dice_magic_b4_long.m4a', 'dice_magic_b4_long.ogg']);
  for (const k of ['b4', 'b2_old', 'b4_long']) for (const ext of ['ogg', 'm4a']) {
    const f = path.join(ROOT, `prototype/dice_1012/se/dice_magic_${k}.${ext}`);
    assert.ok(fs.existsSync(f), f); const n = fs.statSync(f).size; assert.ok(n > 10000 && n < 80000, `${f} ${n}`);
  }
  assert.match(demo, /data-v="b4" class="on">B4（新）/, '既定は B4 版'); assert.match(demo, /旧B2・不採用候補/); assert.match(demo, /data-v="long" class="on">1\.30秒（新）/, '既定は 1.30秒版'); assert.match(demo, /0\.93秒（前の版）/);
  assert.match(fs.readFileSync(path.join(ROOT, 'prototype/dice_1012/se/dice_magic_b4.m4a')).subarray(4, 8).toString(), /ftyp/);
  assert.equal(fs.readFileSync(path.join(ROOT, 'prototype/dice_1012/se/dice_magic_b4.ogg')).subarray(0, 4).toString(), 'OggS');
  assert.equal(fs.readdirSync(path.join(ROOT, 'prototype/dice_1012'), { recursive: true }).filter((f) => /\.mp3$/i.test(f)).length, 0); assert.match(demo, /dice-cube\.js/);
  const reg = read('js/audio/audio-registry.js');
  assert.doesNotMatch(reg, /dice_magic|dice_1012/, '正式の SE の登録は変えていない');
});
