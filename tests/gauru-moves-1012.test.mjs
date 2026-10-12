// =========================================================
// 2026-10-12：ガウルの技アニメ（最終余白調整版の95枚）を通常のバトルへ（js/battle/gauru-moves-data.js・js/battle/art25d.js の正式の経路）
//  GA-01：10技・本体46＋効果46＋特殊3＝95枚・技の番号と名前＝OFFICIAL_MOVES.gauru.list の slot と name・ファイルの実在・納品の sha256 の記録
//  GA-02：本体と効果は別の層（同じ切り出し＝相対位置のまま）・着弾の効果は相手の体・特殊エフェクトは補助技と聖なる炎の最後
//  GA-03：通常の URL＝ガウル（sp 1）の技 10〜19 は新しいコマ・ソラモの46コマはそのまま・?battleArt=old の「旧」では今まで・読み込みの順・セーブに触れない
//  GA-04：区切りの時間（6コマの大技は長め・共通演出を通らないときは 1.44秒）・補助技は当たる瞬間の効果なし・共通演出の専用の飾りを重ねない
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (f) => readFileSync(path.join(ROOT, f), 'utf8');
const DATA = JSON.parse(rd('js/battle/gauru-moves-data.js').split('= ').slice(1).join('= ').trim().replace(/;$/, ''));
const SO = JSON.parse(rd('js/battle/soramo-moves-data.js').split('= ').slice(1).join('= ').trim().replace(/;$/, ''));

function load(search = '', bpl = [{ sp: 1 }, { sp: 0 }]) {
  const c = { location: { search }, URLSearchParams, BPL: bpl, SK: { 10: [0, 95], 13: [0, 0], 18: [0, 145], 19: [0, 115] }, matchMedia: () => ({ matches: false }) };
  c.window = c; vm.createContext(c);
  for (const f of ['js/battle/art25d-data.js', 'js/battle/soramo-moves-data.js', 'js/battle/gauru-moves-data.js', 'js/battle/art25d.js']) vm.runInContext(rd(f), c);
  return c;
}
const official = () => { const c = { window: {} }; c.globalThis = c; vm.createContext(c); vm.runInContext(rd('js/phase10/monsters.js'), c); return (c.MMP10M || c.window.MMP10M).OFFICIAL_MOVES.gauru.list; };

test('GA-01：10技・95枚・技の番号と名前・ファイル・sha256', () => {
  const ks = Object.keys(DATA).map(Number).sort((a, b) => a - b);
  assert.deepEqual(ks, [10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
  for (const m of official()) assert.equal(DATA[m.slot].name, m.name, `slot ${m.slot}`);
  const names = new Set(), files = new Set();
  for (const k of ks) {
    const d = DATA[k]; assert.equal(d.cuts.length, d.steps);
    for (const c of d.cuts) {
      names.add(c.name); if (c.fxName) names.add(c.fxName);
      for (const f of [c.f, c.fx].filter(Boolean)) { assert.ok(existsSync(path.join(ROOT, 'assets/battle/gauru_moves_1012', f)), f); files.add(f); }
      assert.ok(c.b[2] > c.b[0] && c.b[3] > c.b[1] && c.b[2] <= c.pw + 1 && c.b[3] <= c.ph + 1, `${c.src}：本体の外接矩形`);
      assert.match(c.name, /キャラ\d/);
    }
    for (const x of d.fx) { names.add(x.name); files.add(x.f); assert.ok(existsSync(path.join(ROOT, 'assets/battle/gauru_moves_1012', x.f)), x.f); }
  }
  assert.equal(names.size, 95, '納品の95枚をすべて使う');
  const sha = rd('assets/battle/gauru_moves_1012/sha256.txt').trim().split('\n');
  assert.equal(sha.length, 95); for (const l of sha) assert.match(l, /^[0-9a-f]{64} {2}\S+\.png$/);
  assert.equal(Object.keys(SO).length, 10, 'ソラモの46コマのデータはそのまま');
});

test('GA-02：本体と効果は別の層・着弾は相手の体・特殊エフェクト', () => {
  const nFx = Object.values(DATA).reduce((a, d) => a + d.cuts.filter((c) => c.fx).length + d.fx.filter((x) => x.at === 'tgt').length, 0);
  assert.equal(nFx, 46, '効果の層 46');
  assert.deepEqual(DATA[15].fx.filter((x) => x.at === 'tgt').map((x) => x.t[0]), [2, 3], 'ファイアボールの着弾爆発・煙は相手の体');
  assert.deepEqual(DATA[13].fx.map((x) => [x.at, x.f]), [['self', 'sp_buff.webp']], 'ソニックムーブ（補助）＝最後に自分の上でバフのキラキラ');
  assert.deepEqual(DATA[19].fx.map((x) => x.f), ['sp_aura1.webp', 'sp_aura2.webp', 'sp_buff.webp'], '聖なる炎の最後＝炎のオーラ2コマ＋キラキラ');
  assert.equal(DATA[11].cuts[2].m, 'contact', 'つつく：3コマ目で相手へ'); assert.equal(DATA[11].hit, 3);
  const js = rd('js/battle/art25d.js');
  assert.match(js, /\[\[c\.f, 0\], \[c\.fx, 8\]\]/, '効果の層は本体と同じ動き・本体の上');
  assert.match(js, /c\.at === 'tgt' \|\| c\.at === 'self'/);
});

test('GA-03：通常の URL＝ガウルの技は新しいコマ・ソラモはそのまま・旧の比較', () => {
  let c = load('');
  for (let k = 10; k < 20; k++) assert.equal(c.MM25D.handles(k, 0), true, `ガウルの技 ${k}`);
  assert.equal(c.MM25D.handles(10, 1), false, '相手（ソラモ）がガウルの技番号を使っても新しいコマにしない');
  assert.equal(c.MM25D.handles(0, 1), true, '相手側のソラモは46コマ'); assert.equal(c.MM25D.offData(0, 1), c.MMSOMV_DATA[0]);
  assert.equal(c.MM25D.offData(15, 0).dir, './assets/battle/gauru_moves_1012/');
  assert.equal(c.MM25D.idleSrc(1), null, '待機の立ち絵は変えない');
  c = load('?battleArt=old'); assert.equal(c.MM25D.handles(10, 0), false, '比較の「旧」では今まで');
  const html = rd('index.html');
  assert.ok(html.indexOf('js/battle/soramo-moves-data.js') < html.indexOf('js/battle/gauru-moves-data.js') && html.indexOf('js/battle/gauru-moves-data.js') < html.indexOf('js/battle/art25d.js'));
  assert.doesNotMatch(rd('js/battle/gauru-moves-data.js'), /localStorage|save\(/);
});

test('GA-04：区切りの時間・補助技・共通演出の専用の飾りを重ねない', () => {
  const c = load('');
  const d17 = c.MM25D.planOff(17, true, DATA[17]), d11 = c.MM25D.planOff(11, true, DATA[11]), q = c.MM25D.planOff(19, false, DATA[19]), h = c.MM25D.planOff(13, true, DATA[13]);
  assert.equal(d17.dur, 2300); assert.equal(d17.win.length, 6); assert.ok(d11.dur >= 1500 && d11.dur <= 2700);
  assert.equal(q.dur, 1440); assert.equal(h.hit, null, '補助技は当たる瞬間の効果なし');
  assert.match(rd('js/battle/stage.js'), /kind = p25 \? null : SPECIAL\[k\];/, 'コマで見せる技に嵐・加護の飾りを重ねない');
});
