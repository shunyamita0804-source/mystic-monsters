// =========================================================
// 2026-10-15 夜の一括依頼（PHASE B）：技アニメの試遊修正21件・体格サイズ1〜5（暫定プレビュー）・技の SE の時刻（js/battle/move-tune-1015.js）
//  BT-01：修正の表（MOVES）のキーと参照するコマ・効果が実在する／patch は元のデータを変えない
//  BT-02：体格サイズの分類（A3）・倍率は暫定でプレビューのときだけ（通常は 1＝今まで）
//  BT-03：はなビンタの絵文字が「鼻」でない（08）
//  BT-04：素材の修正（tools/battlefix1015/applied.json）の修正後の sha256＝いまのファイル
//  BT-05：体の面積（MMAREA）が全部の技のコマにある（共通スケール）
//  BT-06：フェザーストームの最後の渦巻きを出さない・聖なる炎は相手へ動かない・射撃の技はその場（stay）
//  BT-07（2026-10-16 iPhone 8本）：口先の表（MOUTH）が光線・火球の区切りのコマにある・コマの中・ソラモビームは発射の姿だけ／
//         スターフォールの当たりの絵文字を消す設定／聖なる炎の輪は飛ばない／蒼刃乱舞 28_07 の柱を消した記録
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const load = (f) => { const src = fs.readFileSync(path.join(ROOT, f), 'utf8'); (0, eval)(src); };
globalThis.window = globalThis;
['js/battle/soramo-moves-data.js', 'js/battle/gauru-moves-data.js', 'js/battle/nobiton-moves-data.js', 'js/battle/jiol-moves-data.js', 'js/battle/regnas-moves-data.js', 'js/battle/flurene-moves-data.js', 'js/battle/move-area-1015.js', 'js/battle/move-tune-1015.js'].forEach(load);
const T = globalThis.MMTUNE;
const SETS = [[globalThis.MMSOMV_DATA, 'soramo_moves_1012/'], [globalThis.MMGAMV_DATA, null], [globalThis.MMNOMV_DATA, null], [globalThis.MMJIMV_DATA, null], [globalThis.MMREMV_DATA, null], [globalThis.MMFLMV_DATA, null]];
const all = []; SETS.forEach(([D, dir]) => Object.values(D).forEach((d) => all.push({ d, dir: d.dir || './assets/battle/' + dir })));

test('BT-01：修正の表のキー・コマ・効果が実在する／元のデータは変えない', () => {
  const keys = new Set(all.map(({ d, dir }) => T.keyOf(d, dir)));
  for (const k of Object.keys(T.MOVES)) assert.ok(keys.has(k), `修正の表のキー ${k} に当たる技がある`);
  for (const { d, dir } of all) {
    const key = T.keyOf(d, dir), t = T.MOVES[key]; if (!t) continue;
    const before = JSON.stringify(d), p = T.patch(d, dir);
    assert.equal(JSON.stringify(d), before, `${key}：元のデータは変わらない`);
    assert.ok(p !== d && p.tune === t, `${key}：写しに修正が付く`);
    const base = path.join(ROOT, dir.replace(/^\.\//, ''));
    for (const c of p.cuts) { assert.ok(fs.existsSync(path.join(base, c.f)), `${key}：コマ ${c.f}`); assert.ok(c.b && c.pw && c.ph, `${key}：${c.src} の範囲と枠`); assert.ok(c.t[1] < p.steps, `${key}：${c.src} の区切り`); }
    for (const c of p.fx) {
      const f = c.u ? path.join(ROOT, c.u.replace(/^\.\//, '')) : path.join(base, c.f);
      assert.ok(fs.existsSync(f), `${key}：効果 ${c.u || c.f}`); assert.ok(c.pw && c.ph, `${key}：${c.src} の大きさ`); assert.ok(c.t[1] < p.steps, `${key}：${c.src} の区切り`);
      if (c.at === 'launch' || c.at === 'stretch') assert.ok(!c.fb || (c.fb[2] <= c.pw && c.fb[3] <= c.ph), `${key}：${c.src} の切り出しは絵の中`);
    }
    (t.detach || []).forEach((x) => assert.ok(!p.cuts.find((c) => c.src === x.cut) || !p.cuts.find((c) => c.src === x.cut).fx, `${key}：${x.cut} の効果は体から外した`));
    if (p.hit != null) assert.ok(p.hit >= 1 && p.hit <= p.steps, `${key}：当たりの区切り ${p.hit}`);
  }
  assert.equal(Object.keys(T.MOVES).length, 15, 'コードで直す技 15件（残り 6件は素材の修正だけ：03・08・09・11・12・17）');
});

test('BT-02：体格サイズ（A3）・倍率は暫定でプレビューのときだけ', () => {
  assert.deepEqual({ ...T.SIZE }, { 0: 2, 1: 3, 2: 2, 3: 4, 4: 3, 5: 3 }, 'ソラモ2・ガウル3・ノビトン2・ジオル4・レグナス3・フルーネ3');
  assert.ok(!Object.values(T.SIZE).includes(5), 'サイズ5は予約（誰にも割り当てない）');
  assert.deepEqual({ ...T.SIZE_K }, { 1: 0.7, 2: 0.8, 3: 0.9, 4: 1, 5: 1.15 }, '暫定の倍率 70/80/90/100/115%');
  globalThis.MM_SIZE_PREVIEW = false;
  for (let sp = 0; sp <= 5; sp++) assert.equal(T.sizeK(sp), 1, '通常は今までの大きさ');
  globalThis.MM_SIZE_PREVIEW = true;
  assert.equal(T.sizeK(3), 1); assert.equal(T.sizeK(0), 0.8); assert.ok(Math.abs(T.sizeK(1) - 0.9 * 0.97) < 1e-9);
  globalThis.MM_SIZE_PREVIEW = null;
  for (const sp of Object.keys(T.SIZE)) { const a = T.ANCHOR[sp]; assert.ok(a && ['mouth', 'head', 'fist', 'chest'].every((k) => a[k][0] > 0 && a[k][0] < 1 && a[k][1] > 0 && a[k][1] < 1), `体の目印 ${sp}`); }
});

test('BT-03：はなビンタの絵文字は「鼻」でない（ダメージの数字の横に出る）', () => {
  const src = fs.readFileSync(path.join(ROOT, 'js/battle/rules.js'), 'utf8');
  const m = /const NOBI_EMOJI = \[([^\]]+)\]/.exec(src); assert.ok(m);
  assert.ok(!m[1].includes('👃'), '👃 は使わない');
});

test('BT-04：素材の修正の記録（修正後の sha256＝いまのファイル）', () => {
  const rows = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/battlefix1015/applied.json'), 'utf8'));
  assert.equal(rows.length, 43);
  for (const r of rows) {
    const h = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, r.file))).digest('hex');
    assert.equal(h, r.after, r.file); assert.notEqual(r.before, r.after, `${r.file} は変わった`);
  }
});

test('BT-05：体の面積（共通スケール）が全部の技のコマと待機立ち絵にある', () => {
  const A = globalThis.MMAREA;
  for (const { d, dir } of all) { const m = /([^/]+)\/$/.exec(dir); for (const c of d.cuts) assert.ok(A[m[1] + '/' + c.f] > 0, `${m[1]}/${c.f}`); }
  for (const n of ['soramo', 'gauru', 'nobiton', 'jiol', 'regnas', 'flurene']) assert.ok(A[`idle/idle_${n}.webp`] > 0.3, n);
});

test('BT-06：フェザーストーム・聖なる炎・射撃の技', () => {
  const get = (key) => { const x = all.find(({ d, dir }) => T.keyOf(d, dir) === key); return T.patch(x.d, x.dir); };
  assert.ok(!get('gauru_moves_1012/18_01.webp').fx.some((c) => c.f === '18_05_fx.webp'), '06：最後の渦巻きを出さない');
  const holy = get('gauru_moves_1012/19_01.webp');
  assert.ok(holy.cuts.every((c) => c.m === 'self'), '07：相手へ動かない');
  assert.ok(holy.cuts.some((c) => c.lift < -0.1), '07：その場で上昇');
  assert.ok(!holy.fx.some((c) => c.at === 'launch'), '07（2026-10-16）：炎の輪を相手へ飛ばさない');
  assert.ok(holy.fx.filter((c) => /^G19_aura/.test(c.src)).every((c) => c.at === 'aura' && c.onBody), '07：炎の輪は自分の体の中心から広がる');
  assert.ok(holy.fx.some((c) => c.at === 'tgt' && /bc06_hit/.test(c.u || '')), '07：相手の当たりは別の表現（共通演出 bc06）');
  for (const k of ['soramo_moves_1012/05_01.webp', 'soramo_moves_1012/08_01.webp', 'gauru_moves_1012/15_01.webp', 'gauru_moves_1012/16_01.webp', 'jiol_moves_1012/j06_01.webp']) assert.equal(get(k).stay, true, `${k}：その場で撃つ`);
  assert.ok(get('gauru_moves_1012/15_01.webp').fx.some((c) => c.at === 'launch'), '04：火球を飛ばす');
  assert.ok(get('jiol_moves_1012/j04_01.webp').cuts.some((c) => c.arc > 0), '13：跳ぶ');
});

test('BT-07：口先の表・スターフォールの絵文字・聖なる炎・蒼刃乱舞の柱（2026-10-16）', () => {
  const get = (key) => { const x = all.find(({ d, dir }) => T.keyOf(d, dir) === key); return { p: T.patch(x.d, x.dir), dir: x.dir }; };
  for (const [key, srcs] of [['soramo_moves_1012/05_01.webp', ['SORAMO_BEAM_3']], ['soramo_moves_1012/08_01.webp', ['SDR_BEAM']], ['gauru_moves_1012/15_01.webp', ['G15_2_fx']], ['gauru_moves_1012/16_01.webp', ['G16_2_fx']]]) {
    const { p, dir } = get(key);
    for (const src of srcs) {
      const c = p.fx.find((q) => q.src === src); assert.ok(c, `${key}：${src}`);
      for (let i = c.t[0]; i <= c.t[1]; i++) {
        const cut = p.cuts.find((q) => q.t[0] <= i && q.t[1] >= i), M = T.mouthOf(dir, cut.f);
        assert.ok(M, `${key}：区切り ${i}（${cut.f}）の口先がある`);
        assert.ok(M[0] > cut.b[0] && M[0] < cut.b[2] && M[1] > cut.b[1] && M[1] < cut.b[3], `${cut.f}：口先は体の範囲の中`);
        assert.ok(M[0] > (cut.b[0] + cut.b[2]) / 2, `${cut.f}：口先は体の前の半分（右向き）`);
      }
    }
  }
  assert.deepEqual(get('soramo_moves_1012/05_01.webp').p.fx.find((c) => c.src === 'SORAMO_BEAM_3').t, [1, 1], 'ソラモビームは口を開いた発射の姿だけ');
  assert.equal(get('gauru_moves_1012/15_01.webp').p.fx.find((c) => c.src === 'G15_2_fx').fromMouth, true, 'ファイアボールは口先で生まれる');
  for (const key of Object.keys(T.MOUTH)) assert.ok(fs.existsSync(path.join(ROOT, 'assets/battle', key)), `口先の表のコマ ${key}`);
  assert.deepEqual(Object.keys(T.EMOJI_OFF).map(Number), [9], '当たりの絵文字を消すのはスターフォールだけ');
  const rows = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/battlefix1015/applied.json'), 'utf8'));
  assert.ok(rows.some((r) => r.file === 'assets/battle/regnas_moves_1012/28_07.webp' && /柱/.test(r.how)), '蒼刃乱舞 28_07 の柱を消した記録');
});
