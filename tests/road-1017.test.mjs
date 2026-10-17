// =========================================================
// 2026-10-17 道路画質（P0）の QA（作業ブランチ claude/qa-road-1017 だけ・試作）
//  RQ-01 フラグなしは何もしない（MMQRA.mode null・近くの層の既定は従来の 5px・新しい絵を読まない）
//  RQ-02 派生の台帳（derive.json）と js の px／単位・ファイルが一致・WebP の大きさ
//  RQ-03 継ぎ目：fix は左右・上下とも 1.35 以下（raw より小さい）・raw と fix で px／単位が同じ（石・草の大きさが変わらない）
//  RQ-04 差し込み口は ?qaRoadArt のときだけ（pattern は _ppu を持つ絵だけ倍率を変える・Chapter 2 は読めた絵だけ差し替え）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (f) => readFileSync(path.join(ROOT, f), 'utf8');
const DIR = 'assets/qa/road_1017';
const J = JSON.parse(rd(DIR + '/derive.json'));

test('RQ-01：フラグなしは何もしない', async () => {
  await import('../js/qa/road-art-1017.js');
  const A = globalThis.MMQRA; assert.equal(A.mode, null); assert.equal(A.macroOn, false);
  assert.equal(await A.load('ch1_ground_a1'), null, 'フラグなしは読まない');
  await import('../js/qa/road-1016.js');
  assert.equal(globalThis.MMQAR.mode, null); assert.equal(globalThis.MMQAR.RES, 5); assert.equal(globalThis.MMQAR.TILE, 128); assert.equal(globalThis.MMQAR.MAX, 14);
  assert.match(rd('index.html'), /<script src="\.\/js\/qa\/road-art-1017\.js"><\/script><script src="\.\/js\/qa\/road-1016\.js"><\/script>/, '近くの層より先に読む');
});

test('RQ-02：台帳と js の px／単位・ファイル', async () => {
  await import('../js/qa/road-art-1017.js');
  const A = globalThis.MMQRA;
  for (const [k, ppu] of Object.entries(A.PPU)) {
    for (const t of ['raw', 'fix']) { const r = J[k][t]; assert.ok(r, k + t); assert.equal(r.px_per_unit, ppu, k + t); assert.ok(existsSync(path.join(ROOT, DIR, r.out)), r.out);
      const b = readFileSync(path.join(ROOT, DIR, r.out)); assert.equal(b.toString('ascii', 8, 12), 'WEBP', r.out); }
  }
  for (const k of ['ch1_strip_r1', 'ch1_strip_r2', 'ch2_R01_white_bridge_walkstrip']) for (const t of ['raw', 'fix']) assert.ok(existsSync(path.join(ROOT, DIR, J[k][t].out)), k + t);
  for (const v of Object.values(A.CH1)) for (const n of Object.values(v)) assert.ok(J[n], n);
  for (const g of Object.values(A.CH2)) for (const n of Object.values(g)) assert.ok(J[n], n);
  assert.equal(J.ch1_strip_r1.raw.size[1], 384, '道の帯は高さ 384（従来 128）');
  assert.equal(J.ch2_R01_white_bridge_walkstrip.band_px, 253, 'R01 の帯の見える所');
  assert.equal(Object.keys(J).length, 14, '12枚＋道の帯2');
});

test('RQ-03：継ぎ目は fix で 1.35 以下・raw と同じ細かさ', () => {
  for (const [k, v] of Object.entries(J)) {
    if (v.kind !== 'tex') continue;
    assert.equal(v.fix.px_per_unit, v.raw.px_per_unit, k);
    assert.ok(Math.max(...v.fix.seam) <= 1.35, `${k} fix ${v.fix.seam}`);
    assert.ok(Math.max(...v.fix.seam) <= Math.max(...v.raw.seam), `${k} raw ${v.raw.seam} fix ${v.fix.seam}`);
  }
  assert.ok(Math.max(...J.ch1_road_r1.src_seam) > 5, '原本の R1 の上下の継ぎ目（5.77）');
});

test('RQ-04：差し込み口は ?qaRoadArt のときだけ', () => {
  const rw = rd('js/proto/roadfirst-world.js'), c2 = rd('js/proto/ch2-world.js'), r16 = rd('js/qa/road-1016.js');
  assert.match(rw, /scale\(im\._ppu \? 1 \/ im\._ppu : tile \/ im\.width\)/, '_ppu の無い従来の絵は従来の倍率');
  assert.match(rw, /const QRA = !SEA && root\.MMQRA && root\.MMQRA\.mode \? root\.MMQRA : null/);
  assert.match(c2, /const QRA = root\.MMQRA && root\.MMQRA\.mode \? root\.MMQRA : null;\n\s*if \(QRA\) return/);
  assert.match(c2, /qaArch=1/, 'アーチは &qaArch=1 のときだけ');
  assert.match(r16, /const MODE = q === '1' \|\| q === '2' \? q : ART17 \? '1' : null;/);
});
