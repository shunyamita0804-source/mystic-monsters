// 2026-10-15 N11・N12：フルーネの登録（データと正式画像2点だけ・未解禁）と大会の対戦表の顔（正式のイラスト6枚）
//  FL-01 登録の値（6能力・成長適性・素早さ・種族・固有スキルの原文・10技の名前と習得区分。数値の無い項目は持たない）
//  FL-02 分離：番号 5 は SPECIES・レグナス（4）・バトルの表・旧 SP・勝利の絵のどれとも重ならない／市場・図鑑・固有スキル・技の表に入らない／
//        画面のコードは 'flurene' を名前で参照しない（未解禁＝どこにも出ない）
//  FL-03 フルーネの画像2点：派生が実在・大きさ・README に原本と派生の sha256
//  FL-04 対戦表の顔6枚：番号 → 絵の対応（6枚目＝フルーネ・レオナではない）・派生 256×256・README の sha256・読めないときの代わり
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (f) => readFileSync(path.join(ROOT, f), 'utf8');
const HTML = rd('index.html');
const J = (x) => JSON.parse(JSON.stringify(x));   // vm の中の配列・オブジェクトを比べられる形に
const sha = (f) => createHash('sha256').update(readFileSync(path.join(ROOT, f))).digest('hex');
const M = (() => { const ctx = { console }; ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx); vm.runInContext(rd('js/phase10/monsters.js'), ctx); return ctx.MMP10M; })();
/** WebP の大きさ（VP8X・VP8・VP8L） */
function webpSize(f) {
  const b = readFileSync(path.join(ROOT, f));
  assert.equal(b.toString('ascii', 0, 4), 'RIFF', f); assert.equal(b.toString('ascii', 8, 12), 'WEBP', f);
  const k = b.toString('ascii', 12, 16);
  if (k === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  if (k === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  if (k === 'VP8L') { const v = b.readUInt32LE(21); return [1 + (v & 0x3fff), 1 + ((v >> 14) & 0x3fff)]; }
  throw new Error(f + ' ' + k);
}

test('FL-01：フルーネの登録の値（ユーザー提供の正式情報どおり・数値の無い項目は持たない・未解禁）', () => {
  const f = M.pendingSpecies('flurene');
  assert.ok(f, '登録されている');
  assert.equal(f.name, 'フルーネ'); assert.equal(f.key, 'flurene'); assert.equal(f.kind, '植物系');
  assert.deepEqual({ ...f.base }, { li: 150, po: 70, in: 110, hi: 90, ev: 60, de: 70 });
  assert.equal(Object.values(f.base).reduce((a, b) => a + b, 0), 550);
  assert.deepEqual({ ...f.growth }, { li: 'A', po: 'E', in: 'C', hi: 'D', ev: 'E', de: 'D' });
  assert.equal(f.speed, 4); assert.ok(M.isValidSpeed(f.speed));
  assert.equal(f.uniqueSkill.name, '生命の芽吹き');
  assert.equal(f.uniqueSkill.desc, '攻撃を受けた後、残りライフが最大ライフの50％以下になり、生き残っていた場合、1戦闘に1回だけ最大ライフの10％を回復する。');
  assert.equal(f.uniqueSkill.implemented, false, 'バトルには入れていない');
  assert.equal(f.uniqueSkill.params, null, '回復量の丸め・判定の順などは未確定＝数値を持たない');
  const exp = [['つるうち', 'initial'], ['たねとばし', 'initial'], ['はなのかおり', 'initial'], ['ねっこのまもり', 'initial'],
    ['こんさいプレス', 'po'], ['ブルームレイ', 'in'], ['しばりづる', 'hi'], ['はなかげのまい', 'ev'], ['生命のしずく', 'de'], ['ルートテンペスト', 'de']];
  assert.deepEqual(J(f.moves.map((m) => [m.name, m.learn])), exp);
  assert.deepEqual(J(f.moves.map((m) => m.no)), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(f.moves[8].deOrder, 1); assert.equal(f.moves[9].deOrder, 2); assert.equal(f.moves[9].finisher, true, 'ルートテンペスト＝必殺');
  assert.equal(f.moves.filter((m) => m.finisher).length, 1);
  for (const m of f.moves) for (const k of ['power', 'accuracy', 'critical', 'effects', 'ailment', 'heal', 'slot', 'id', 'type'])
    assert.ok(!(k in m), `${m.name} に ${k} を持たない（未提供の数値を作らない）`);
  assert.equal(f.unlocked, false); assert.equal(f.playerAvailable, false);
  assert.ok(Object.isFrozen(M.PENDING_SPECIES) && Object.isFrozen(f) && Object.isFrozen(f.moves));
});

test('FL-02：番号 5 はどの表とも重ならない（SPECIES 0〜3・レグナス 4）・市場／図鑑／技／固有スキルの表に入らない・画面のコードは名前で参照しない', () => {
  const f = M.pendingSpecies('flurene');
  assert.equal(f.id, 5); assert.equal(M.pendingSpecies(5), f);
  assert.deepEqual(J(M.SPECIES.map((s) => s.id)), [0, 1, 2, 3], '既存の4原種は不変');
  assert.equal(M.byId(5), null); assert.equal(M.byKey('flurene'), null, 'byId／byKey では引けない（市場・牧場・図鑑・合体・野生が読む経路）');
  assert.equal(M.keyOf(5), null); assert.equal(M.imageOf('flurene'), null); assert.equal(M.skillOf(5), null); assert.equal(M.growthRegistered(5), false);
  assert.ok(!M.SPECIES.some((s) => s.id === f.id || s.key === f.key));
  assert.ok(!M.RIVAL_MONSTERS.some((s) => s.key === f.key));
  // レグナス＝バトルの絵の番号 4（js/battle/rival-partner.js の SPRITE）
  assert.match(rd('js/battle/rival-partner.js'), /const SPRITE = 4;/);
  assert.notEqual(f.id, 4);
  // バトルの表（0〜4）に 5 は無い
  const ar = rd('js/battle/arena.js');
  assert.match(ar, /const IDLE = \{ 0: 'idle_soramo', 1: 'idle_gauru', 2: 'idle_nobiton', 3: 'idle_jiol', 4: 'idle_regnas' \};/, 'arena の待機立ち絵に 5 を足していない');
  assert.match(ar, /const SCALE = Object\.freeze\(\{ 0: 0\.91, 1: 0\.92, 2: 0\.88, 3: 0\.91, 4: 0\.91 \}\);/);
  assert.match(rd('js/battle/rules.js'), /const SPECIES = Object\.freeze\(\{ 0: 'solamo', 1: 'gauru', 2: 'nobiton', 3: 'jiol', 4: 'regnas' \}\);/, '固有スキルの発動の表に 5 は無い');
  assert.match(HTML, /\nconst VICTORY_IMG=\["solamo","gauru","nobiton","jiol","regnas"\];/, '勝利の絵は5体のまま');
  assert.match(HTML, /\nconst SP=\[\["ソラモ"[^\n]*\["ガウル"[^\n]*\]\]\];/, '旧 SP（バトルの相手・大会の参加者の種族の数）は2種のまま');
  assert.match(HTML, /\nconst IMG=MMP10M\.SPECIES\.map\(s=>s\.image\.src\);/, 'IMG は SPECIES（0〜3）＋レグナスの 4 だけ');
  // 市場・固有スキル・技の表
  assert.ok(!M.MARKET_CATALOG.some((c) => c.key === 'flurene' || c.sp === 5));
  assert.ok(!Object.values(M.UNIQUE_SKILLS).some((u) => u.speciesKey === 'flurene' || u.species === 5));
  assert.ok(!('flurene' in M.OFFICIAL_MOVES));
  // 画面のコードは 'flurene' を名前で参照しない（番号 5 の顔の対応表 arena の TOUR_ICON と登録の monsters.js だけ）
  const hits = [];
  const walk = (d) => { for (const n of readdirSync(path.join(ROOT, d))) { const p = path.join(d, n); if (statSync(path.join(ROOT, p)).isDirectory()) walk(p); else if (/\.(js|mjs|html)$/.test(n) && /flurene|フルーネ/i.test(rd(p))) hits.push(p); } };
  walk('js'); if (/flurene|フルーネ/i.test(HTML)) hits.push('index.html');
  assert.deepEqual(hits.sort(), ['js/battle/arena.js', 'js/phase10/monsters.js']);
  // 大会の参加者の種族は従来どおり（SP.length）
  assert.match(HTML, /MMP8L\.setSpeciesCount\(SP\.length\);/);
});

test('FL-03：フルーネの画像2点＝表示用の派生（原本は置かない）・大きさ・README に原本と派生の sha256', () => {
  const f = M.pendingSpecies('flurene');
  const rel = (s) => s.replace(/^\.\//, '');
  assert.equal(f.image.src, './assets/monsters/2p5d/flurene.webp'); assert.equal(f.battleIdle.src, './assets/battle/idle/idle_flurene.webp');
  assert.deepEqual(webpSize(rel(f.image.src)), [f.image.w, f.image.h]); assert.equal(Math.max(f.image.w, f.image.h), 720);
  assert.deepEqual(webpSize(rel(f.battleIdle.src)), [f.battleIdle.w, f.battleIdle.h]); assert.equal(f.battleIdle.h, 720);
  const r1 = rd('assets/monsters/2p5d/README.md'), r2 = rd('assets/battle/idle/README.md');
  assert.match(r1, /ec08627d77135ddfa11c2f03277a95194b06cc51de62a5f73ba30a4362784411/); assert.ok(r1.includes(sha(rel(f.image.src))), '派生の sha256');
  assert.match(r2, /d5a237c1410511b18a0ad869bc36f8ef07fe79b1b8537d9eea15d103f962798f/); assert.ok(r2.includes(sha(rel(f.battleIdle.src))));
  assert.match(r1, /アルファが 1 以上/); assert.match(r2, /アルファが 1 以上/);
  for (const d of ['assets/monsters/2p5d', 'assets/battle/idle', 'assets/tournament/icons_1015']) assert.ok(!readdirSync(path.join(ROOT, d)).some((n) => /\.png$/i.test(n) && /flurene|Tournament/i.test(n)), d + '：原本の PNG は置かない');
  assert.ok(existsSync(path.join(ROOT, 'tools/next1015/derive.py')));
});

test('FL-04：対戦表の顔＝正式のイラスト6枚（6枚目＝フルーネ・レオナではない）・256×256・README の sha256・読めないときの代わり', () => {
  const ar = rd('js/battle/arena.js');
  assert.match(ar, /const TOUR_ICON = Object\.freeze\(\{ 0: 'solamo', 1: 'gauru', 2: 'nobiton', 3: 'jiol', 4: 'regnas', 5: 'flurene' \}\);/);
  assert.equal(M.pendingSpecies('flurene').id, 5, 'TOUR_ICON の 5 は予約番号と一致');
  assert.doesNotMatch(ar.match(/const TOUR_ICON = [^\n]*/)[0], /leona|レオナ/i, 'レオナに割り当てない');
  const R = rd('assets/tournament/icons_1015/README.md');
  const orig = { solamo: 'cc8b25e4c2b4b940e4f333db97696fc52f57a2fe5f079293abc17fc54750955d', gauru: 'c0cafb34b77b5117fde9681caf3779d8c4c96b89883c3a8fc9300dbe206d3c62',
    nobiton: '18e19d740a5297038fa782de99b4fd0ad9287871467bb4dee6db03401a1978ac', jiol: '492bdd87d5a9bf6dfcff8c9b12f5ceb5ee5ef1feb5e3de0ac6448aa2d3cdfc57',
    regnas: '95d466b6ff85493f39435e0cece9b7b18f66ddbec1fd3d735d5ea1d0e1206048', flurene: '1e568abe37d4b1b654d40b8187259320beb86c2266015545a93024f32a45b0d1' };
  for (const [k, h] of Object.entries(orig)) {
    const f = `assets/tournament/icons_1015/icon_${k}.webp`;
    assert.deepEqual(webpSize(f), [256, 256], f);
    const row = R.split('\n').find((l) => l.startsWith(`| icon_${k}.webp |`));
    assert.ok(row && row.includes(h) && row.includes(sha(f)), `${k}：README に原本と派生の sha256`);
  }
  assert.match(R, /icon_flurene\.webp \| \*\*フルーネ\*\*/); assert.match(R, /6枚目はフルーネ/);
  // tbIcon：新しい絵 → 2.5D の横顔 → 丸い顔 → 正式の立ち絵（読めないときの代わり）・表に無い種族は従来どおり
  const fn = HTML.match(/\nfunction tbIcon\(x\)\{[^\n]*/)[0];
  assert.match(fn, /A\.tourIconSrc\(x\.sp\)/); assert.match(fn, /onerror="tbIconFb\(this\)"/); assert.match(fn, /return tbIconOld\(x\)\}/);
  assert.match(fn, /A\.faceSrc&&A\.faceSrc\(x\.sp\),A\.faceOldSrc&&A\.faceOldSrc\(x\.sp\),st&&st\.image&&st\.image\.src/);
  assert.match(HTML, /\nfunction tbIconFb\(im\)\{/);
  // 旧い顔のファイルは残す（代わりに使う）
  for (const k of ['soramo', 'gauru', 'nobiton', 'jiol', 'regnas']) { assert.ok(existsSync(path.join(ROOT, `assets/tournament/faces_25d/face_${k}.webp`))); assert.ok(existsSync(path.join(ROOT, `assets/tournament/faces/face_${k}.webp`))); }
  // 枠：ユーザー指示（2026-10-15）＝丸くしないで四角形のまま。どの枠も角の小さい四角・絵は枠いっぱい
  assert.match(HTML, /\.tbic img\.tbface\.ti15\{object-fit:cover;object-position:50% 50%;transform:none;box-sizing:border-box;padding:0;background:var\(--tibg,#cfd2d7\)\}/);
  assert.match(HTML, /\.tbic:has\(>img\.ti15\),\.tbvsx \.tvx-s \.tbic:has\(>img\.ti15\)\{border-radius:5px\}/);
  assert.doesNotMatch(HTML, /ti15\{object-fit:contain;object-position:50% 100%/);
});
