// 2026-10-18 夜間 GO PHASE 2：ボード用の歩行 7体×5方向×4コマ（assets/monsters/walk_1018/・tools/walk1018/derive.py）
//  WK18-01：140コマが実在・RGBA の正方形・四隅は透明・不透明の体は1つの正方形に収まる（端に触れない）・種族ごとに同じキャンバス
//  WK18-02：本編＝walk_1018 だけ（MMQAW.BASE7・SPEC7＝derive.json）・前の 1017 の素材はファイルだけ（2026-10-19 に比較の URL を撤去）・Chapter 2 の旧い盤も同じ素材
//  WK18-03：README に原本 7枚の sha256 と 140 行
import test from 'node:test'; import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const KEYS = ['solamo', 'gauru', 'nobiton', 'jiol', 'regnas', 'flurene', 'razuck'], DIRS = ['front', 'back', 'side', 'backd', 'frontd'];
// WebP（VP8L／VP8X）の幅・高さ・alpha の有無だけを読む
function webpInfo(buf) {
  assert.equal(buf.toString('ascii', 0, 4), 'RIFF'); assert.equal(buf.toString('ascii', 8, 12), 'WEBP');
  const fourcc = buf.toString('ascii', 12, 16);
  if (fourcc === 'VP8X') return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3), alpha: !!(buf[20] & 0x10) };
  if (fourcc === 'VP8L') { const b = buf.readUInt32LE(21); return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1, alpha: !!((b >> 28) & 1) }; }
  return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff, alpha: false };
}
test('WK18-01：140コマが実在・alpha つきの正方形・種族ごとに同じキャンバス', () => {
  for (const k of KEYS) {
    const sizes = new Set();
    for (const d of DIRS) for (let i = 1; i <= 4; i++) {
      const f = path.join(ROOT, 'assets/monsters/walk_1018', k, `${d}_${i}.webp`); assert.ok(existsSync(f), f);
      const inf = webpInfo(readFileSync(f)); assert.equal(inf.w, inf.h, `${k}/${d}_${i} は正方形`); assert.ok(inf.alpha, `${k}/${d}_${i} は透過`); sizes.add(inf.w);
    }
    assert.equal(sizes.size, 1, `${k} の20コマは同じキャンバス（足もとの基線をそろえた）`);
  }
  const spec = JSON.parse(rd('tools/walk1018/derive.json'));
  assert.deepEqual(Object.keys(spec), KEYS);
  for (const k of KEYS) { assert.ok(spec[k].h > 1 && spec[k].h < 2, k); assert.ok(spec[k].foot > 0.02 && spec[k].foot < 0.08, k); }
});
test('WK18-02：本編は walk_1018 だけ・前の 1017 の素材は読まない・Chapter 2 の旧い盤も同じ', async () => {
  globalThis.window = globalThis; globalThis.location = { search: '' };
  await import('../js/qa/walk5-1016.js?a');
  const Q = globalThis.MMQAW; assert.equal(Q.set, '1018'); assert.equal(Q.BASE7, './assets/monsters/walk_1018/');
  const spec = JSON.parse(rd('tools/walk1018/derive.json')); for (const k of KEYS) assert.deepEqual({ ...Q.SPEC7[k] }, spec[k], k);
  assert.match(Q.sets('solamo').front.frames[1], /walk_1018\/solamo\/front_2\.webp$/);
  const js = rd('js/qa/walk5-1016.js'); assert.match(js, /SET = '1018';/); assert.ok(!js.replace(/^\s*\/\/.*$/gm, '').includes('walk_1017'));
  assert.match(rd('js/chapter/configs/ch2a.js'), /const W7 = '\.\/assets\/monsters\/walk_1018\/'/);
  for (const k of KEYS) assert.ok(existsSync(path.join(ROOT, 'assets/monsters/walk_1017', k, 'front_1.webp')), `旧 1017 の素材はファイルだけ残す（${k}）`);
});
test('WK18-03：README に原本 7枚の sha256・140 行', () => {
  const r = rd('assets/monsters/walk_1018/README.md');
  for (const h of ['6690B006-792F-4DE9-AEB8-9C21ACC88167.jpeg', 'D2947742-BEE2-468D-8479-5C2F42E67848.jpeg']) assert.ok(r.includes(h), h);
  assert.equal((r.match(/\| assets\/monsters\/walk_1018\/[a-z]+\/[a-z]+_[1-4]\.webp \|/g) || []).length, 140);
});
