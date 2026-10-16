// =========================================================
// 2026-10-16：作業ブランチの試遊の入口（trial.html）と QA の直接起動（?mmQaTrial=1&qaDirect=1）
//  TE-01：入口のリンクはすべて同じ場所の index.html（相対パス）・検索に出さない
//  TE-02：qaDirect は mmQaTrial=1 のときだけ（普段の URL では動かない）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('TE-01：入口のリンクは相対パスの index.html・noindex', () => {
  const html = fs.readFileSync(path.join(ROOT, 'trial.html'), 'utf8');
  assert.match(html, /<meta name="robots" content="noindex,nofollow">/);
  const hrefs = [...html.matchAll(/<a [^>]*href="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(hrefs.length >= 7, `リンク ${hrefs.length}`);
  for (const h of hrefs) assert.match(h, /^\.\/index\.html(\?|$)/, h);
  assert.ok(hrefs.some((h) => /mmQaTrial=1&qaDirect=1/.test(h)));
  assert.ok(hrefs.some((h) => /mmSize=1/.test(h)));
  assert.ok(['A', 'B', 'C'].every((r) => hrefs.some((h) => h.includes(`ch2route=${r}`))));
});

test('TE-02：qaDirect は mmQaTrial=1 のときだけ', () => {
  const src = fs.readFileSync(path.join(ROOT, 'js/qa/trial.js'), 'utf8');
  const load = (search) => { const w = { location: { search } }; (new Function('window', 'globalThis', src.replace(/\}\)\(typeof window[^;]+;\s*$/, '})(window);')))(w, w); return w.MMQA; };
  assert.equal(load('?qaDirect=1').DIRECT, false);
  assert.equal(load('').DIRECT, false);
  assert.equal(load('?mmQaTrial=1&qaDirect=1').DIRECT, true);
  assert.equal(load('?mmQaTrial=1').DIRECT, false);
});
