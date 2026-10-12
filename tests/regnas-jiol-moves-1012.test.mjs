// =========================================================
// 2026-10-12：レグナス（正式補正版 48枚）・ジオル（正式採用用・透過補正版 96枚）の技アニメ（js/battle/regnas-moves-data.js・jiol-moves-data.js・art25d.js）
//  RJ-01：レグナス 10技・48枚＝SK 20〜29（正式No 1〜10）。納品のフォルダの番号は正式No と違う＝依頼書の対応表どおり・ファイルの実在・sha256
//  RJ-02：ジオル 10技・96枚（本体48＋効果48・ジオインパクトは12コマ×2）＝正式の技表の名前と番号・SK の番号は無い・ファイル・sha256
//  RJ-03：レグナス（sp 4）の技だけ新しいコマ・ライバル戦の初期4技（20〜23）・ジオルの技はバトルの技の番号を引き受けない（プレビューだけ）
//  RJ-04：読み込めないコマがある技は従来の演出（MMRP.anim）へ戻す・旧の比較では今まで・性能／セーブに触れない
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (f) => readFileSync(path.join(ROOT, f), 'utf8');
const json = (f) => JSON.parse(rd(f).split('= ').slice(1).join('= ').trim().replace(/;$/, ''));
const RE = json('js/battle/regnas-moves-data.js'), JI = json('js/battle/jiol-moves-data.js');
function load(search = '', bpl = [{ sp: 0 }, { sp: 4 }]) {
  const c = { location: { search }, URLSearchParams, BPL: bpl, SK: { 20: [0, 0.8], 22: [0, 0], 23: [0, 0], 29: [0, 1.25] }, matchMedia: () => ({ matches: false }) };
  c.window = c; vm.createContext(c);
  for (const f of ['js/battle/art25d-data.js', 'js/battle/soramo-moves-data.js', 'js/battle/gauru-moves-data.js', 'js/battle/nobiton-moves-data.js', 'js/battle/regnas-moves-data.js', 'js/battle/jiol-moves-data.js', 'js/battle/art25d.js']) vm.runInContext(rd(f), c);
  return c;
}

test('RJ-01：レグナス 10技・48枚・SK 20〜29・納品のフォルダの対応・sha256', () => {
  const ks = Object.keys(RE).map(Number).sort((a, b) => a - b);
  assert.deepEqual(ks, [20, 21, 22, 23, 24, 25, 26, 27, 28, 29]);
  const FOLDER = { 1: '02_きりさく', 2: '01_しっぽアタック', 3: '09_竜眼ロック', 4: '10_残影ステップ', 5: '06_ドラゴンクラッシュ', 6: '08_蒼光ブレス', 7: '07_スナイプファング', 8: '03_幻影クロー', 9: '04_蒼刃乱舞', 10: '05_テイルサイクロン' };
  const NAME = ['きりさく', 'しっぽアタック', '竜眼ロック', '残影ステップ', 'ドラゴンクラッシュ', '蒼光ブレス', 'スナイプファング', '幻影クロー', '蒼刃乱舞', 'テイルサイクロン'];
  const off = rd('js/phase10/monsters.js'); NAME.forEach((n) => assert.ok(off.includes(`'${n}'`) || off.includes(`"${n}"`), `正式の技表に ${n}`));
  let n = 0;
  for (const k of ks) {
    const d = RE[k]; assert.equal(d.no, k - 19); assert.equal(d.folder, FOLDER[d.no]); assert.equal(d.name, NAME[d.no - 1]);
    assert.equal(d.fx.length, 0, '1枚に本体と効果が描かれている（別の層なし）');
    for (const c of d.cuts) { assert.ok(existsSync(path.join(ROOT, 'assets/battle/regnas_moves_1012', c.f)), c.f); assert.ok(c.b[2] > c.b[0] && c.b[3] > c.b[1]); n++; }
    assert.ok(d.cuts.every((c) => c.b.join() === d.cuts[0].b.join() && c.pw === d.cuts[0].pw && c.ph === d.cuts[0].ph), `技 ${k}：全コマ同じ切り出し（位置・接地が原本のまま）`);
  }
  assert.equal(n, 48);
  assert.deepEqual(ks.map((k) => RE[k].cuts.length), [4, 4, 4, 4, 4, 4, 4, 4, 8, 8]);
  assert.equal(RE[22].hit, null); assert.equal(RE[23].hit, null, '補助技（竜眼ロック・残影ステップ）は当たる瞬間なし');
  assert.equal(rd('assets/battle/regnas_moves_1012/sha256.txt').trim().split('\n').length, 48);
});

test('RJ-02：ジオル 10技・96枚（本体48＋効果48）・正式の技表の名前・SK の番号なし・sha256', () => {
  const ks = Object.keys(JI).map(Number).sort((a, b) => a - b);
  assert.deepEqual(ks, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const NAME = ['パンチ', 'キック', '力をためる', 'のしかかり', 'グランドハンマー', 'クリスタルレイ', 'グランドスパイク', 'ロックアッパー', 'ジオインパクト', 'クリスタルノヴァ'];
  let body = 0, fx = 0;
  for (const k of ks) {
    const d = JI[k]; assert.equal(d.name, NAME[k - 1]); assert.ok(d.folder.startsWith(String(k).padStart(2, '0') + '_'));
    assert.equal(d.cuts.length, k === 9 ? 12 : 4);
    for (const c of d.cuts) { body++; assert.ok(existsSync(path.join(ROOT, 'assets/battle/jiol_moves_1012', c.f))); if (c.fx) { fx++; assert.ok(existsSync(path.join(ROOT, 'assets/battle/jiol_moves_1012', c.fx))); } }
    for (const c of d.fx) { fx++; assert.ok(['tgt', 'ray', 'self'].includes(c.at)); assert.ok(existsSync(path.join(ROOT, 'assets/battle/jiol_moves_1012', c.f))); }
    // 本体と効果は同じコマ番号（同じ時刻）
    for (let i = 0; i < d.steps; i++) assert.equal(d.cuts.filter((c) => c.t[0] === i).length + 0, 1);
    assert.equal(d.cuts.filter((c) => c.fx).length + d.fx.length, d.steps, `技 ${k}：効果は各コマに1枚`);
  }
  assert.equal(body, 48); assert.equal(fx, 48);
  assert.equal(rd('assets/battle/jiol_moves_1012/sha256.txt').trim().split('\n').length, 96);
  assert.doesNotMatch(rd('js/phase10/monsters.js').match(/jiol: fz\(\{ style[\s\S]*?\}\)\),/)?.[0] || '', /power: \d/, 'ジオルの技の性能は未決のまま（作らない）');
});

test('RJ-03：レグナスの技だけ新しいコマ・ジオルはプレビューだけ', () => {
  const c = load('');
  for (let k = 20; k < 30; k++) assert.equal(c.MM25D.handles(k, 1), true, `レグナスの技 ${k}`);
  assert.equal(c.MM25D.handles(20, 0), false, 'ソラモが 20 番を使っても新しいコマにしない');
  assert.equal(c.MM25D.owner(25), 4);
  assert.equal(c.MM25D.planOff(28, true, RE[28]).dur, 2700); assert.equal(c.MM25D.planOff(22, true, RE[22]).hit, null);
  // ジオル（sp 3）はバトルの技の番号を持たない＝どの番号でも引き受けない
  const j = load('', [{ sp: 3 }, { sp: 0 }]);
  for (let k = 0; k < 40; k++) assert.equal(j.MM25D.offData(k, 0), null);
  assert.equal(typeof c.MM25D.preview, 'function');
  assert.match(rd('js/battle/art25d.js'), /c\.at === 'ray'/);
  const html = rd('index.html'); assert.ok(html.indexOf('js/battle/regnas-moves-data.js') < html.indexOf('js/battle/art25d.js') && html.indexOf('js/battle/jiol-moves-data.js') < html.indexOf('js/battle/art25d.js'));
});

test('RJ-04：読み込めない技は従来の演出へ・旧の比較・性能とセーブに触れない', () => {
  const c = load('');
  c.MM25D.failed.add(RE[21].dir + RE[21].cuts[2].f);
  assert.equal(c.MM25D.handles(21, 1), false, '読めないコマがある技は従来（MMRP.anim）へ');
  assert.equal(c.MM25D.handles(20, 1), true, 'ほかの技はそのまま');
  assert.equal(load('?battleArt=old').MM25D.handles(20, 1), false);
  const idx = rd('index.html'); assert.match(idx, /function animRaw\(k,s\)\{if\(window\.MM25D&&MM25D\.anim\(k,s\)\)return;if\(k>=20&&window\.MMRP&&MMRP\.anim\(k,s\)\)return;/);
  for (const f of ['js/battle/regnas-moves-data.js', 'js/battle/jiol-moves-data.js']) assert.doesNotMatch(rd(f), /localStorage|save\(|SK\[|EFF\[/);
  assert.doesNotMatch(rd('js/battle/rival-partner.js'), /regnas_moves_1012/, 'ライバル戦の技構成・固有スキルは変えない');
});
