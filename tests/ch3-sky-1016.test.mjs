// =========================================================
// 2026-10-16 QA（D）：Chapter 3 天空の先行素材 18点（作業ブランチ claude/qa-ch3-sky-1016 だけ・配置先は未決）
//  CS-01 18点の派生がそろう・sha256 と寸法が derive.json と一致・原本の検査（寸法・RGBA・外周・重複）が合格
//  CS-02 本編からつながない（index.html・js/ が参照しない）＝Chapter 3 のボードは未設計
//  CS-03 独立のプレビュー（prototype/ch3_sky_1016/）が参照するファイルがある
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'assets/fields/ch3/sky_1016');
const J = JSON.parse(readFileSync(path.join(DIR, 'derive.json'), 'utf8'));
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const webpSize = (b) => { const t = b.toString('ascii', 12, 16); if (t === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)]; return null; };

test('CS-01：18点の派生・sha256・寸法・原本の検査', () => {
  assert.equal(J.count, 18); assert.deepEqual(J.missing, []); assert.deepEqual(J.extra, []);
  const files = readdirSync(DIR).filter((f) => f.endsWith('.webp')).sort();
  assert.equal(files.length, 18);
  for (const it of J.items) {
    const p = path.join(DIR, it.derived); assert.ok(existsSync(p), it.derived);
    assert.equal(sha(p), it.derived_sha256, it.derived);
    assert.deepEqual(webpSize(readFileSync(p)), it.derived_size, it.derived);
    assert.ok(it.spec_ok && it.mode === 'RGBA' && !it.edge_touch && !it.dup_of, it.file);
  }
});

test('CS-02：本編からつながない', () => {
  assert.ok(!/sky_1016/.test(readFileSync(path.join(ROOT, 'index.html'), 'utf8')));
  const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  for (const f of walk(path.join(ROOT, 'js')).filter((f) => f.endsWith('.js'))) assert.ok(!/sky_1016/.test(readFileSync(f, 'utf8')), f);
});

test('CS-03：プレビューの参照先がある', () => {
  const h = readFileSync(path.join(ROOT, 'prototype/ch3_sky_1016/index.html'), 'utf8');
  for (const m of h.matchAll(/'(C3_[A-Za-z_]+)'/g)) assert.ok(existsSync(path.join(DIR, m[1] + '.webp')), m[1]);
  for (const m of h.matchAll(/\['C3_[A-Za-z_]+', '([A-Za-z0-9_]+)'\]/g)) assert.ok(existsSync(path.join(ROOT, 'assets/fields/ch2/art_1016', m[1] + '.webp')), m[1]);
  assert.ok(existsSync(path.join(ROOT, 'assets/fields/ch2/art_1016/open_sea_water.webp')));
});
