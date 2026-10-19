// =========================================================
// 2026-10-19：index.html の base64 埋め込み画像（175件）を assets/inline/ のファイルへ出した
//  IN-01 manifest の全ファイルが存在し、中身（sha256・バイト数）が記録と同じ・形式が拡張子どおり
//  IN-02 index.html は manifest の全パスを参照し、base64 の画像は1件も残っていない・assets/inline/ に manifest に無い画像が無い
//  IN-03 Phase 6 のハッシュで照合している範囲（fight() 本体）には外部化したパスが入っていない（fight() は名前で参照するだけ）
//  IN-04 起動後の先読み（inlineWarm）は表示するバトルの絵だけを対象にする（旧カード AS.mkt…・NPI は読まない）
// 元に戻す確認：node tools/inline-images/restore.mjs（パスを data URI へ戻す）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const HTML = readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const MAN = JSON.parse(readFileSync(path.join(ROOT, 'assets/inline/manifest.json'), 'utf8'));
const walk = (d) => readdirSync(path.join(ROOT, d), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));

test('IN-01：manifest の175ファイルが存在し、中身が記録と同じ', () => {
  assert.equal(MAN.length, 175);
  for (const e of MAN) {
    const b = readFileSync(path.join(ROOT, e.file));
    assert.equal(b.length, e.bytes, e.file);
    assert.equal(createHash('sha256').update(b).digest('hex'), e.sha256, e.file);
    const ext = path.extname(e.file);
    const magic = ext === '.png' ? b[0] === 0x89 && b[1] === 0x50 : ext === '.jpg' ? b[0] === 0xff && b[1] === 0xd8 : b.slice(8, 12).toString() === 'WEBP';
    assert.ok(magic, e.file + ' の形式');
    assert.ok(e.uses.length >= 1, e.file + ' の使う場所');
  }
});

test('IN-02：index.html は全パスを参照し、base64 の画像は残っていない', () => {
  assert.equal((HTML.match(/data:image\/[a-z+]+;base64,/g) || []).length, 0);
  for (const e of MAN) assert.ok(HTML.includes(`"${e.file}"`), e.file);
  const files = walk('assets/inline').filter((f) => !f.endsWith('.json') && !f.endsWith('.md')).map((f) => f.split(path.sep).join('/')).sort();
  assert.deepEqual(files, MAN.map((e) => e.file).sort());
  assert.ok(Buffer.byteLength(HTML) < 1_200_000, 'index.html は約1MB');
});

test('IN-03：fight() 本体には外部化したパスが入っていない', () => {
  const i = HTML.indexOf('async function fight('), j = HTML.indexOf('\n$("#snd").textContent', i);
  assert.ok(i > 0 && j > i);
  assert.ok(!HTML.slice(i, j).includes('assets/inline/'));
});

test('IN-04：先読みは表示するバトルの絵だけ', () => {
  const l = HTML.split('\n').find((x) => x.startsWith('const MM_INLINE=[];function inlineWarm(){'));
  assert.ok(l, 'inlineWarm がある');
  for (const k of ['STOPART', 'BTB', 'SKART', 'SPX', 'SFR', 'SFXL']) assert.ok(l.includes(k), k);
  assert.doesNotMatch(l, /AS\.(mkt|soL|soR|gaL|gaR)|NPI/);
  assert.doesNotMatch(l, /decode\(/, 'デコードした絵を抱えない');
});
