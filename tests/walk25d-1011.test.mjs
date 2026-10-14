// =========================================================
// 2.5D の歩行コマ・対戦表の横顔アイコン（2026-10-11）
//  WK-01 ガウルの front・back（各8コマ・walk_25d の派生 384×384）・h／foot・止まると front の1コマ目。ほかの種族は従来の walk のまま（検収で問題があったセットは組み込まない）
//  WK-02 対戦表の顔＝faces_25d（256×256・5体＝種族 0〜4）・読めないときは従来の faces・日本語名の重複を登録しない・原本（PNG）を置かない
//  WK-03 盤の歩行コマの置き方：横の位置は旧 index.html の .wk（牧場の歩く子）のアニメーションを受けない・高さと足は静止の立ち絵の実際の高さ（--sth）に合わせる・
//        読み込み前は静止の立ち絵を消さない（:has）・奥へ back／手前へ front（反転なし）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
/** WebP（VP8X／VP8L／VP8）の幅・高さ */
function webpSize(p) {
  const b = readFileSync(path.join(ROOT, p)); assert.equal(b.toString('ascii', 0, 4), 'RIFF'); assert.equal(b.toString('ascii', 8, 12), 'WEBP');
  const t = b.toString('ascii', 12, 16);
  if (t === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3), true];
  if (t === 'VP8L') { const v = b.readUInt32LE(21); return [1 + (v & 0x3fff), 1 + ((v >> 14) & 0x3fff), true]; }
  return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff, false];
}
const FILES = ['js/phase7/progression.js', 'js/phase8/league.js', 'js/phase8/raising.js', 'js/phase10/monsters.js', 'js/phase9/chapters.js', 'js/chapter/engine.js', 'js/chapter/configs/ch1a.js'];
function load() { const w = {}; for (const f of FILES) new Function('window', rd(f))(w); new Function('window', rd('js/chapter/world-board.js'))(w); return w; }

test('WK-01：ガウルの 2.5D 歩行＝front・back 各8コマ（walk_25d・384×384・透過）。ほかの種族は従来のまま', () => {
  const w = load(), S = w.MMCH.getConfig(1).monsterSprites, ds = w.MMWB.dirSets(S.gauru);
  assert.deepEqual(Object.keys(ds).sort(), ['back', 'front']);
  for (const k of ['front', 'back']) {
    assert.equal(ds[k].frames.length, 8);
    ds[k].frames.forEach((f, i) => {
      assert.equal(f, `./assets/monsters/walk_25d/gauru/gauru_walk_${k}_0${i + 1}.webp`);
      const [W, H, alpha] = webpSize(f.slice(2)); assert.deepEqual([W, H, alpha], [384, 384, true], f);
    });
    assert.equal(ds[k].h, 1.106); assert.equal(ds[k].foot, 0.049); assert.equal(ds[k].face, 'none', '正面・後ろ姿＝反転しない'); assert.equal(ds[k].idle, 0);
  }
  assert.deepEqual(S.gauru.walk.frames.length, 6, '旧 Chapter 1（field-view）は従来の walk（6コマ）');
  // 2026-10-14：ソラモ・ノビトン・ジオルも作り直された 2.5D の front・back（各8コマ・384×384・h 1.169・foot 0.066）。横の1歩は standFace の立ち絵（旧 2D の横向きは使わない）
  for (const [k, face] of [['solamo', 'left'], ['nobiton', 'right'], ['jiol', 'right']]) {
    const d = w.MMWB.dirSets(S[k]); assert.deepEqual(Object.keys(d).sort(), ['back', 'front'], k); assert.equal(S[k].standFace, face, k);
    for (const dn of ['front', 'back']) {
      assert.equal(d[dn].frames.length, 8); assert.deepEqual([d[dn].fps, d[dn].h, d[dn].foot, d[dn].face], [12, 1.169, 0.066, 'none'], k + dn);
      d[dn].frames.forEach((f, i) => { assert.equal(f, `./assets/monsters/walk_25d/${k}/${k}_walk_${dn}_0${i + 1}.webp`); assert.deepEqual(webpSize(f.slice(2)), [384, 384, true], f); });
    }
    assert.ok(S[k].walk.frames.length >= 8 && !S[k].walk.frames[0].includes('walk_25d'), `${k}：旧 Chapter 1（field-view）は従来の walk`);
  }
  const rm = rd('assets/monsters/walk_25d/README.md');
  for (const k of ['soramo', 'regnas back', 'nobiton', 'gioru']) assert.match(rm, new RegExp(k), `組み込まなかった理由：${k}`);
  assert.equal((rm.match(/\| gauru\/gauru_walk_(front|back)_0[1-8]\.png \|/g) || []).length, 16, '元ファイルと sha256');
  assert.equal((rm.match(/\| (solamo|nobiton|jiol)\/\1_walk_(front|back)_0[1-8]\.png \|/g) || []).length, 48, '2026-10-14 の48枚の元ファイルと sha256');
});

test('WK-02：対戦表の顔＝faces_25d（5体・256×256）・読めないときは従来の faces・重複を登録しない・原本を置かない', () => {
  const w = {}; new Function('window', rd('js/battle/arena.js'))(w);
  const A = w.MMARENA, keys = ['soramo', 'gauru', 'nobiton', 'jiol', 'regnas'];
  keys.forEach((k, sp) => {
    assert.equal(A.faceSrc(sp), `./assets/tournament/faces_25d/face_${k}.webp`);
    assert.equal(A.faceOldSrc(sp), `./assets/tournament/faces/face_${k}.webp`);
    assert.deepEqual(webpSize(A.faceSrc(sp).slice(2)), [256, 256, true]);
    assert.ok(existsSync(path.join(ROOT, A.faceOldSrc(sp).slice(2))), '従来の顔は残す');
  });
  assert.equal(A.faceSrc(9), null, '5体以外の種族には当てない（従来の表示）');
  assert.deepEqual(readdirSync(path.join(ROOT, 'assets/tournament/faces_25d')).sort(), ['README.md', ...keys.map((k) => `face_${k}.webp`)].sort(), '日本語名の重複・PNG の原本は置かない');
  assert.deepEqual(readdirSync(path.join(ROOT, 'assets/monsters/walk_25d/gauru')).filter((f) => !f.endsWith('.webp')), []);
  const html = rd('index.html');
  assert.match(html, /function tbIcon\(x\)\{const f=window\.MMARENA&&x&&MMARENA\.faceSrc\(x\.sp\);if\(f\)\{const o=MMARENA\.faceOldSrc&&MMARENA\.faceOldSrc\(x\.sp\);return `<img class="tbface f25" src="\$\{f\}" alt=""\$\{o\?` onerror="this\.onerror=null;this\.classList\.remove\('f25'\);this\.src='\$\{o\}'"`:""\}>`\}/);
  assert.match(html, /\.tbic img\.tbface\.f25\{object-fit:contain;transform:scale\(\.9\)\}/);
  assert.match(rd('assets/tournament/faces_25d/README.md'), /georu\.png \| assets\/tournament\/faces_25d\/face_jiol\.webp/);
});

test('WK-03：盤の歩行コマ＝横は旧 .wk のアニメーションを受けない・高さと足は立ち絵の実際の高さ・読み込み前は立ち絵を消さない・奥へ back／手前へ front', () => {
  const src = rd('js/chapter/world-board.js');
  assert.match(src, /\.rfw-mon \.mon>img\.wk\{position:absolute;left:50%;bottom:calc\(\(1 - var\(--sth,1\)\) \* 100%\);width:auto;height:calc\(100% \* var\(--wkh,1\) \* var\(--sth,1\)\);[^}]*animation:none\}/);
  assert.match(rd('index.html'), /\.wk\{position:absolute;width:58px;height:58px;animation:wk/, '旧 index.html の .wk（牧場の歩く子）は残る＝盤の側で止める');
  assert.match(src, /\.rfw-mon:is\(\.wk-on,\.wk-idle\) \.mon:has\(>img\.wk\.on\)>img\.st\{opacity:0\}/);
  assert.match(src, /box\.style\.setProperty\('--sth', String\(Math\.min\(1, sh \/ bh\)\)\)/);
  assert.match(src, /img\.addEventListener\('load', \(\) => \{ const e2 = monEl\(\); if \(e2 && e2\.classList\.contains\('wk-idle'\) && !SPR\.on\) sprShow\('front', f\.idle\); \}, \{ once: true \}\)/);
  const w = load(), ds = w.MMWB.dirSets(w.MMCH.getConfig(1).monsterSprites.gauru);
  assert.deepEqual([w.MMWB.pickDir(0, -10, ds), w.MMWB.pickDir(0, 10, ds)].map((r) => [r.set, r.flip]), [['back', false], ['front', false]], 'ムーンウォークしない');
  assert.equal(w.MMWB.pickDir(10, 0, ds, { set: 'front' }).set, null, '2026-10-13 開発27（13）：横の1歩は静止の立ち絵を進む向きへ（横向きの絵は無い・作らない）');
});
