// =========================================================
// 2026-10-19：index.html の base64 埋め込み画像（175件）を assets/inline/ のファイルへ出した
//  IN-01 manifest の全ファイルが存在し、中身（sha256・バイト数）が記録と同じ・形式が拡張子どおり
//  IN-02 index.html は manifest の全パスを参照し、base64 の画像は1件も残っていない・assets/inline/ に manifest に無い画像が無い
//  IN-03 Phase 6 のハッシュで照合している範囲（fight() 本体）には外部化したパスが入っていない（fight() は名前で参照するだけ）
//  IN-04 先読み（js/battle/inline-preload.js＝MMINL）：起動時には読まない・バトルの直前に要る絵だけ（base＝開始の瞬間・full＝そのバトルの全部）・旧カード AS.mkt…・NPI は読まない
//  IN-05 MMINL の相手の技の表（OPP_BASE）＝fight()（Phase 6）が相手を作るときの表と同じ（fight() は読むだけ）
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

import vm from 'node:vm';
function loadMMINL(opt = {}) {
  const loaded = [];
  // XMLHttpRequest／FileReader の代わり（ファイルの中身から data URI を作る＝ブラウザと同じ結果）
  class XMLHttpRequest { open(m, u) { this.u = u; } send() { loaded.push(this.u); const b = readFileSync(path.join(ROOT, this.u)); const e = MAN.find((x) => x.file === this.u); this.status = 200; this.response = { b, type: e.mime }; setTimeout(() => this.onload && this.onload(), 0); } }
  class FileReader { readAsDataURL(x) { this.result = `data:${x.type};base64,${x.b.toString('base64')}`; setTimeout(() => this.onload && this.onload(), 0); } }
  const ctx = vm.createContext({ XMLHttpRequest, FileReader, setTimeout, localStorage: { getItem: (k) => (opt.ui && k === 'mmbattleui' ? opt.ui : null) }, console });
  const line = (p) => HTML.split('\n').find((x) => x.startsWith(p));
  for (const p of ['const SK=', 'const SKART=', 'const SFXL=', 'const AS=', 'let BPL=null;const SFR=', 'const STOPART=', 'const BTB=']) vm.runInContext(line(p), ctx);
  ctx.window = ctx; ctx.MM25D = opt.mm25d === undefined ? { offered: false, on: false, owner: (k) => (k < 10 ? 0 : k < 20 ? 1 : 9) } : opt.mm25d;
  vm.runInContext(readFileSync(path.join(ROOT, 'js/battle/inline-preload.js'), 'utf8'), ctx);
  return { M: ctx.MMINL, loaded };
}

test('IN-04：先読みは起動時に何も読まず、バトルの直前にそのバトルの絵だけを読む', async () => {
  assert.doesNotMatch(HTML, /inlineWarm|MM_INLINE/, '起動後に全部を読む旧い先読みは無い');
  assert.match(HTML, /<script src="\.\/js\/battle\/inline-preload\.js"><\/script>/);
  const { M, loaded } = loadMMINL();
  assert.equal(loaded.length, 0, '読み込んだだけでは何も読まない');
  const m = { sp: 0, eq: [0, 1, 2, 3, -1, -1] };
  const base = [...M.kit(m, 0, 1, false)];
  assert.deepEqual(base, ['assets/inline/battle/stop_button.webp', 'assets/inline/battle_bg/btb_00_rank_E.jpg',
    'assets/inline/sprite/soramo_intro_0.webp', 'assets/inline/sprite/soramo_intro_1.webp', 'assets/inline/sprite/soramo_intro_2.webp',
    'assets/inline/sprite/gauru_intro_0.webp', 'assets/inline/sprite/gauru_intro_1.webp', 'assets/inline/sprite/gauru_intro_2.webp',
    'assets/inline/skill_icon/skart_00.jpg', 'assets/inline/skill_icon/skart_01.jpg', 'assets/inline/skill_icon/skart_02.jpg', 'assets/inline/skill_icon/skart_03.jpg']);
  const full = M.kit(m, 0, 1, true);
  for (const u of base) assert.ok(full.includes(u));
  assert.ok(full.includes('assets/inline/sprite/gauru_win_2.webp') && full.includes('assets/inline/sprite/soramo_lose_0.webp'), '決着のポーズ');
  assert.ok(['skart_10', 'skart_11', 'skart_12', 'skart_13'].every((n) => full.includes(`assets/inline/skill_icon/${n}.jpg`)), '相手（ガウル・ランクE）の技の小さな絵');
  assert.ok(!full.some((u) => /skill_frames|skill_fx/.test(u)), '新しいコマのある技は4コマ・効果を読まない');
  assert.ok(!full.some((u) => /lab_card|npc_old/.test(u)), '表示しない旧カード・旧 NPC は読まない');
  assert.ok(full.length < 40, `そのバトルの分だけ（${full.length} 件）`);
  // 旧のバトル画面は技の4コマと効果も読む
  const old = loadMMINL({ ui: 'old' }).M.kit(m, 0, 1, true);
  assert.ok(old.includes('assets/inline/skill_frames/sfr_00_0.png') || old.some((u) => u.startsWith('assets/inline/skill_frames/sfr_00_')), '旧：自分の技の4コマ');
  assert.ok(old.some((u) => u.startsWith('assets/inline/skill_frames/sfr_10_')), '旧：相手の技の4コマ');
  assert.ok(old.includes('assets/inline/skill_fx/sfxl_00.webp'));
  // 相手の種族が分からないときは両方の候補
  const unk = M.kit(m, 4, -1, false);
  assert.ok(unk.includes('assets/inline/battle_bg/btb_04_rank_A.jpg') && unk.includes('assets/inline/sprite/gauru_intro_0.webp'));
  // prepare で読み、同じ絵は2回読まない・読んだ絵は元と同じバイト列の data URI（外部化の前の index.html にあった data URI と同じ文字列）
  M.prepare(m, 0, 1, true); M.prepare(m, 0, 1, true);
  assert.equal(await M.whenReady(full, 5000), true);
  assert.equal(loaded.length, full.length);
  assert.equal(new Set(loaded).size, loaded.length);
  for (const u of full) {
    const e = MAN.find((x) => x.file === u), d = await M.load(u);
    assert.ok(d.startsWith(`data:${e.mime};base64,`), u);
    const b = Buffer.from(d.split(',')[1], 'base64');
    assert.equal(createHash('sha256').update(b).digest('hex'), e.sha256, u + ' の中身');
  }
});

test('IN-06：バトル画面に入った <img> は、手元にある絵なら描画の前に data URI へ差し替える（無い絵・別の画像はそのまま）', async () => {
  // MutationObserver の中身だけを確かめる（観測の仕組みはブラウザ＝tools/inline-images/battle-timing.mjs）
  const src = readFileSync(path.join(ROOT, 'js/battle/inline-preload.js'), 'utf8');
  assert.match(src, /new MutationObserver\(/);
  assert.match(src, /attributeFilter: \['src'\]/);
  assert.match(src, /im\.setAttribute\('src', d\)/);
  assert.doesNotMatch(src, /decode\(/);
});

test('IN-05：相手の技の表は fight() の表と同じ', () => {
  const i = HTML.indexOf('async function fight('), f = HTML.slice(i, HTML.indexOf('\n$("#snd").textContent', i));
  const { M } = loadMMINL();
  const expr = (t) => t.slice(0, 3).map(([r, a]) => `rkk>=${r}?[${a.join(',')}]:`).join('') + `[${t[3][1].join(',')}]`;
  assert.ok(f.includes(`base=esp?(dj?[DJP[1][teach][0],10,11,12]:${expr(M.OPP_BASE[1])}):(dj?[DJP[0][teach][0],0,1,3]:${expr(M.OPP_BASE[0])});`));
  assert.ok(f.includes('const esp=teach!=null?0:R(SP.length)'));
  for (let r = 0; r < 6; r++) assert.equal(M.oppMoves(1, r).length, 4);
});
