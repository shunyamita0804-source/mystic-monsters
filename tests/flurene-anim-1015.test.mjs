// =========================================================
// 2026-10-15：フルーネの技アニメ（本体 42＋効果 35＝77枚）と 2.5D 歩行（front・back 各8コマ）
//  （ZIP Mismon_Flurene_Walk_And_Claude_Instructions_20261015 ＋ Mismon_Flurene_SkillAnim_Part1of5〜5of5）
//  FA-01 技アニメ 77枚：技ごとの本体・効果の枚数（09＝効果2・10＝効果0＝作らない）・ファイルの実在・WebP・原本の sha256 の一覧
//  FA-02 技アニメのデータ：番号は登録の No.（SK の番号なし）・置き方（self／lunge／back・tgt／fly／ray）・保存や技の表に触れない
//  FA-03 歩行 16コマ：派生（384×384 WebP）・ch1a.js の monsterSprites.flurene.dirs（12fps・停止＝front の1コマ目）・README の sha256・本編の盤では引けない（未解禁）
//  FA-04 つなぎ：art25d.js の preview('flurene')・index.html の読み込みの順・QA のプレビュー（技の番号なし＝実戦なし）
// =========================================================
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (f) => readFileSync(path.join(ROOT, f), 'utf8');
const sha = (f) => createHash('sha256').update(readFileSync(path.join(ROOT, f))).digest('hex');
const J = (x) => JSON.parse(JSON.stringify(x));
const load = (files, extra = {}) => { const ctx = Object.assign({ console }, extra); ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx); files.forEach((f) => vm.runInContext(rd(f), ctx, { filename: f })); return ctx; };
/** WebP の幅・高さ（VP8X／VP8L／VP8） */
const webpSize = (f) => {
  const b = readFileSync(path.join(ROOT, f)); assert.equal(b.toString('ascii', 0, 4) + b.toString('ascii', 8, 12), 'RIFFWEBP', f);
  const k = b.toString('ascii', 12, 16);
  if (k === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if (k === 'VP8L') { const v = b.readUInt32LE(21); return [1 + (v & 0x3fff), 1 + ((v >> 14) & 0x3fff)]; }
  return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
};
const D = load(['js/battle/flurene-moves-data.js']).MMFLMV_DATA;
const WANT = { 1: [4, 4], 2: [4, 4], 3: [4, 4], 4: [4, 4], 5: [5, 5], 6: [4, 4], 7: [4, 4], 8: [4, 4], 9: [4, 2], 10: [5, 0] };
const NAMES = ['つるうち', 'たねとばし', 'はなのかおり', 'ねっこのまもり', 'こんさいプレス', 'ブルームレイ', 'しばりづる', 'はなかげのまい', '生命のしずく', 'ルートテンペスト'];

test('FA-01：技アニメ 77枚＝本体 42＋効果 35（09＝効果2・10＝効果0）・ファイルは実在する WebP・原本 77枚の sha256 の一覧', () => {
  assert.deepEqual(Object.keys(D).map(Number), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  let nb = 0, nf = 0; const used = new Set();
  for (const [no, d] of Object.entries(D)) {
    assert.equal(d.name, NAMES[no - 1], `${no}：技名（登録の技表と同じ）`);
    assert.deepEqual([d.bodies, d.effects], WANT[no], `${no}：本体・効果の枚数`);
    assert.equal(d.cuts.length, d.bodies); assert.equal(d.steps, d.bodies);
    const fx = d.cuts.filter((c) => c.fx).length + (d.fx || []).length;
    assert.equal(fx, d.effects, `${no}：効果の層＝届いた枚数だけ（作らない）`);
    for (const f of d.cuts.flatMap((c) => [c.f, c.fx]).concat((d.fx || []).map((c) => c.f)).filter(Boolean)) {
      const p = 'assets/battle/flurene_moves_1015/' + f; assert.ok(existsSync(path.join(ROOT, p)), p); webpSize(p); used.add(f);
    }
    nb += d.bodies; nf += d.effects;
  }
  assert.deepEqual([nb, nf], [42, 35]);
  // 2026-10-16（バトル最終統合）：技10 の専用の根4＋命中3（f10_d01_fx〜d07_fx）は別の便（Part01）＝js/battle/move-tune-1015.js の MOVES から使う。ここでは 77枚の便だけを数える
  const all = readdirSync(path.join(ROOT, 'assets/battle/flurene_moves_1015')).filter((f) => f.endsWith('.webp')), files = all.filter((f) => !/^f10_d0[1-7]_fx\.webp$/.test(f));
  assert.deepEqual(all.filter((f) => !files.includes(f)), ['f10_d01_fx.webp', 'f10_d02_fx.webp', 'f10_d03_fx.webp', 'f10_d04_fx.webp', 'f10_d05_fx.webp', 'f10_d06_fx.webp', 'f10_d07_fx.webp']);
  assert.equal(files.length, 77); assert.deepEqual([...used].sort(), files.sort(), '置いた絵はすべてデータから使う（余分な絵・自作の効果は無い）');
  assert.ok(!files.some((f) => /^f10_fx|^f09_fx0[34]/.test(f)), '10 の効果・09 の3〜4枚目は無い（届いていない）');
  const lines = rd('assets/battle/flurene_moves_1015/sha256.txt').trim().split('\n');
  assert.equal(lines.length, 77); assert.ok(lines.every((l) => /^[0-9a-f]{64} {2}(0[1-9]|10)_[^/]+\/[^/]+\.png$/.test(l)), '原本（PNG）の sha256 と相対パス');
  assert.equal(lines.filter((l) => /_B\d\d/.test(l)).length, 42); assert.equal(lines.filter((l) => /_FX\d\d/.test(l)).length, 35);
});

test('FA-02：データ＝登録の No.（SK の番号なし）・置き方・保存や技の表に触れない', () => {
  for (const d of Object.values(D)) {
    for (const c of d.cuts) { assert.ok(['self', 'lunge', 'back'].includes(c.m), '本体はその場（立ち位置・向き・足もとを保つ）'); assert.equal(c.b.length, 4); assert.deepEqual(J(c.t), [c.t[0], c.t[0]]); assert.match(c.src, new RegExp(`^F${d.no}_\\d+$`), '1つの技で1つの地面（足もと）'); }
    for (const c of d.fx || []) assert.ok(['tgt', 'fly', 'ray'].includes(c.at));
    assert.equal(new Set(d.cuts.map((c) => `${c.pw}x${c.ph}`)).size, 1, `${d.no}：本体のコマは全部同じ切り出し（引き伸ばし・位置ずれなし）`);
  }
  assert.deepEqual(Object.values(D).map((d) => d.hit), [3, 3, null, null, 4, 3, 3, null, null, 5], '当たる区切り（補助技は無し）');
  assert.deepEqual(J(D[2].fx.map((c) => c.at)), ['fly', 'tgt']); assert.deepEqual(J(D[6].fx.map((c) => c.at)), ['ray']); assert.deepEqual(J(D[7].fx.map((c) => c.at)), ['tgt', 'tgt']);
  assert.deepEqual(J(D[9].cuts.map((c) => !!c.fx)), [false, true, true, false], '09：光のつゆ＝B02・降り注ぎ光＝B03');
  assert.ok(D[10].cuts.every((c) => !c.fx) && !D[10].fx.length);
  const src = rd('js/battle/flurene-moves-data.js');
  assert.doesNotMatch(src, /localStorage|save\(|SK\[|EFF\[|"slot"|power|accuracy/, '性能・技の番号・保存は持たない');
  assert.doesNotMatch(rd('tools/flurene1015/build.py'), /ImageFilter|ImageDraw\.Draw\(C|putpixel/, '原本の絵は描き直さない（切り出し・縮小・WebP だけ）');
});

test('FA-03：歩行 16コマ＝派生（384×384 WebP）・monsterSprites.flurene.dirs（12fps・停止＝front の1コマ目・他の4体の歩行は不変）・README の sha256・本編の盤では引けない', () => {
  const ctx = load(['js/phase10/monsters.js', 'js/chapter/engine.js', 'js/chapter/configs/ch1a.js']);
  const S = ctx.MMCH.getConfig(1).monsterSprites, F = S.flurene;
  assert.deepEqual(Object.keys(F.dirs), ['front', 'back']);
  for (const dn of ['front', 'back']) {
    const d = F.dirs[dn];
    assert.deepEqual([d.fps, d.idle, d.h, d.foot, d.face], [12, 0, 1.125, 0.047, 'none']);
    assert.deepEqual(J(d.frames), Array.from({ length: 8 }, (_, i) => `./assets/monsters/walk_25d/flurene/flurene_walk_${dn}_0${i + 1}.webp`));
    for (const f of d.frames) assert.deepEqual(webpSize(f.slice(2)), [384, 384], f);
  }
  for (const k of ['solamo', 'nobiton', 'jiol']) for (const dn of ['front', 'back']) assert.deepEqual([S[k].dirs[dn].fps, S[k].dirs[dn].h, S[k].dirs[dn].foot], [12, 1.169, 0.066], `${k}：従来のまま`);
  assert.deepEqual([S.gauru.dirs.front.fps, S.gauru.dirs.front.h], [10, 1.106]);
  const md = rd('assets/monsters/walk_25d/README.md');
  for (const dn of ['front', 'back']) for (let i = 1; i <= 8; i++) {
    const f = `flurene/flurene_walk_${dn}_0${i}.webp`; assert.ok(md.includes(`| walk/${dn}_0${i}.png | ${f} |`), f);
    assert.ok(md.includes(sha('assets/monsters/walk_25d/' + f)), `${f}：派生の sha256`);
  }
  assert.match(md, /back_05[^\n]*切れ/); assert.match(md, /加工済み・ユーザー実機未検収/);
  assert.equal(ctx.MMP10M.keyOf(5), null, '本編の盤（番号 → キー）はフルーネを引けない＝未解禁のまま');
});

test('FA-04：art25d.js の preview(\'flurene\')・index.html の読み込みの順・QA はプレビューだけ（実戦なし）・プレビューの間だけバトルの絵を貸す', () => {
  const a = rd('js/battle/art25d.js');
  assert.match(a, /const FLOFF = \(\) => root\.MMFLMV_DATA \|\| \{\};/);
  assert.match(a, /kind === 'flurene' \? FLOFF\(\)\[no\]/);
  assert.doesNotMatch(a, /SRC_OF = \{[^}]*FLOFF/, '通常のバトルの技（SK の番号）には入れない');
  const html = rd('index.html');
  assert.ok(html.indexOf('js/battle/jiol-moves-data.js') < html.indexOf('js/battle/flurene-moves-data.js') && html.indexOf('js/battle/flurene-moves-data.js') < html.indexOf('js/battle/art25d.js'));
  const qa = rd('js/qa/trial.js');
  assert.match(qa, /if \(key === 'flurene' && FL\(\) && slot == null\) return 'preview';/);
  assert.match(qa, /function lendFlurene\(sp\)/);   // 2026-10-17：ラズック（6）にも使う assert.match(qa, /function unlendFlurene\(\)/);
  assert.match(qa, /guardStorage\(false\); unlendFlurene\(\);/, 'OFF で貸した絵を戻す');
  assert.match(qa, /FX追加待ち/);
});
