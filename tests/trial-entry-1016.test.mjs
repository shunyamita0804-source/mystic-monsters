// =========================================================
// 2026-10-16：作業ブランチの試遊の入口（trial.html）と QA の直接起動（?mmQaTrial=1&qaDirect=1）
//  （TE-01＝trial.html の入口のリンク：2026-10-16 バトル最終統合で trial.html を main に持ち込まない＝削除）
//  TE-02：qaDirect は mmQaTrial=1 のときだけ（普段の URL では動かない）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('TE-02：qaDirect は mmQaTrial=1 のときだけ', () => {
  const src = fs.readFileSync(path.join(ROOT, 'js/qa/trial.js'), 'utf8');
  const load = (search) => { const w = { location: { search } }; (new Function('window', 'globalThis', src.replace(/\}\)\(typeof window[^;]+;\s*$/, '})(window);')))(w, w); return w.MMQA; };
  assert.equal(load('?qaDirect=1').DIRECT, false);
  assert.equal(load('').DIRECT, false);
  assert.equal(load('?mmQaTrial=1&qaDirect=1').DIRECT, true);
  assert.equal(load('?mmQaTrial=1').DIRECT, false);
});
