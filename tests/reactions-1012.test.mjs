// 2026-10-12 正式モンスター5体のリアクション 30枚（assets/monsters/reactions_1012/・js/monsters/reaction-art.js）
//  RA-01：30枚がそろう・WebP（透過あり）・大きさがデータと同じ・原本の PNG は置かない・README と sha256 の表
//  RA-02：データ（MMRXART）＝5体 × 6種・hRel は待機立ち絵に近い範囲・src は番号順の名前
//  RA-03：index.html の読み込み順（データ → MMRXART → arena.js）・バトルの差し替えは表示だけ（resolveAction は呼ぶだけ・Phase 6 に触れない）
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIR = path.join(ROOT, 'assets/monsters/reactions_1012');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const load = () => { const ctx = {}; ctx.window = ctx; vm.runInNewContext(read('js/monsters/reaction-art.data.js') + '\n' + read('js/monsters/reaction-art.js'), ctx); return ctx.MMRXART; };
const FIVE = ['soramo', 'gauru', 'nobiton', 'jiol', 'regnas'];   // 2026-10-12 の5体（reactions_1012）。2026-10-17：6＝ラズック（reactions_1017_razuck・RA-04）
/** WebP（VP8X）の幅・高さと透過の有無 */
function webp(f) {
  const b = fs.readFileSync(f);
  assert.equal(b.toString('ascii', 0, 4), 'RIFF'); assert.equal(b.toString('ascii', 8, 12), 'WEBP');
  assert.equal(b.toString('ascii', 12, 16), 'VP8X', `${f}：透過つきの WebP（VP8X）`);
  return { alpha: !!(b[20] & 0x10), w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
}

test('RA-01：30枚がそろう・透過 WebP・大きさがデータと同じ・原本の PNG は置かない・README と sha256 の表', () => {
  const X = load();
  for (const sp of FIVE) {
    const files = fs.readdirSync(path.join(DIR, sp)).sort();
    assert.deepEqual(files, ['01_joy.webp', '02_surprise.webp', '03_sad.webp', '04_eat.webp', '05_hit.webp', '06_dodge.webp'], sp);
    for (const k of X.KINDS) {
      const i = X.info(sp, k), f = path.join(ROOT, i.src), m = webp(f);
      assert.ok(m.alpha, `${sp} ${k}：透過`);
      assert.deepEqual([m.w, m.h], [i.w, i.h], `${sp} ${k}：大きさ`);
      assert.ok(m.h >= 500 && m.h <= 800 && m.w >= 500 && m.w <= 900, `${sp} ${k}：${m.w}×${m.h}`);
      const n = fs.statSync(f).size; assert.ok(n < 220000, `${sp} ${k}：${n} バイト`);
    }
  }
  assert.equal(fs.readdirSync(DIR, { recursive: true }).filter((f) => /\.png$/i.test(f)).length, 0, '原本の PNG は置かない');
  const tsv = fs.readFileSync(path.join(DIR, 'sha256_originals.tsv'), 'utf8').trim().split('\n');
  assert.equal(tsv.length, 31, '見出し＋30行');
  assert.ok(tsv.slice(1).every((l) => /\t[0-9a-f]{64}\t/.test(l)));
  const readme = fs.readFileSync(path.join(DIR, 'README.md'), 'utf8');
  for (const w of ['喜ぶ', '驚く', 'しょんぼり', '食べる', '被弾', '回避', 'hRel']) assert.ok(readme.includes(w), w);
});

test('RA-02：データ＝5体 × 6種・hRel は待機立ち絵に近い範囲・src は番号順の名前・知らない種族は null', () => {
  const X = load();
  assert.deepEqual([...X.SPECIES], [...FIVE, null, 'razuck']);
  assert.equal(X.all().length, 36);
  for (const sp of FIVE) for (const [i, k] of X.KINDS.entries()) {
    const f = X.info(sp, k);
    assert.equal(f.src, `./assets/monsters/reactions_1012/${sp}/0${i + 1}_${k}.webp`);
    assert.ok(f.hRel >= 0.7 && f.hRel <= 1.15, `${sp} ${k} hRel ${f.hRel}`);
  }
  assert.equal(X.src(0, 'hit'), X.src('soramo', 'hit'), '番号 0〜4 でも引ける');
  assert.equal(X.src(4, 'dodge'), './assets/monsters/reactions_1012/regnas/06_dodge.webp');
  assert.equal(X.src(9, 'hit'), null); assert.equal(X.src('solamo', 'hit'), null); assert.equal(X.info(0, 'cry'), null);
});

test('RA-03：読み込み順・バトルの差し替えは表示だけ（resolveAction は呼ぶだけ・Phase 6 に触れない）', () => {
  const html = read('index.html');
  const a = html.indexOf('js/monsters/reaction-art.data.js'), b = html.indexOf('js/monsters/reaction-art.js"'), c = html.indexOf('js/battle/arena.js');
  assert.ok(a > 0 && a < b && b < c, 'データ → MMRXART → arena.js');
  const src = read('js/battle/arena.js');
  assert.match(src, /W\.resolveAction = function \(o\) \{ const r = B\.resolveAction\(o\);/, 'resolveAction は元を呼ぶだけ');
  assert.match(src, /return r; \};/);
  assert.doesNotMatch(src.slice(src.indexOf('被弾／回避のリアクション（2026-10-12）----')), /\.hit\s*=|\.damage\s*=|currentLife/, '結果を書き換えない');
  assert.match(src, /'#bt \.mon\.mma-rxon>\.mma-idle\{visibility:hidden\}'/, '差し替えの間は待機立ち絵を隠す＝二重に見えない');
  assert.match(src, /'#bt \.mon:not\(\.mma-on\) \.mma-rx\{display:none\}'/, '技のコマが出ている間は出さない');
  assert.match(src, /hit: 560, dodge: 520/);
});

test('RA-04：ラズック（2026-10-17・制作候補＝QA だけ）＝6種・置き場所は reactions_1017_razuck・番号 6・番号 5（フルーネ）は null・大きさがデータと同じ', () => {
  const X = load();
  const files = fs.readdirSync(path.join(ROOT, 'assets/monsters/reactions_1017_razuck')).filter((f) => /\.webp$/.test(f)).sort();
  assert.deepEqual(files, ['01_joy.webp', '02_surprise.webp', '03_sad.webp', '04_eat.webp', '05_hit.webp', '06_dodge.webp']);
  for (const [i, k] of X.KINDS.entries()) {
    const f = X.info(6, k); assert.equal(f.src, `./assets/monsters/reactions_1017_razuck/0${i + 1}_${k}.webp`);
    const m = webp(path.join(ROOT, f.src)); assert.ok(m.alpha); assert.deepEqual([m.w, m.h], [f.w, f.h], k);
    assert.ok(f.hRel >= 0.85 && f.hRel <= 1.2, `${k} hRel ${f.hRel}`);
  }
  assert.equal(X.src(5, 'hit'), null, 'フルーネの表情は無い');
});
