// =========================================================
// 2026-10-12：ノビトンの技アニメ（透過PNG 全59枚）を技の番号（SK 30〜39）へ（js/battle/nobiton-moves-data.js・js/battle/art25d.js の正式の経路）
//  NM-01：10技・59枚（4・5・6・4・6・6・5・6・7・10）すべて使う・技の番号＝30＋(番号−1)・ファイルの実在・納品の sha256
//  NM-02：ノビトン（sp 2）の技だけ新しいコマ（ソラモ・ガウルのコマとは混ざらない）・効果の置き方（tgt／self／fly）・旧の比較では今まで
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (f) => readFileSync(path.join(ROOT, f), 'utf8');
const DATA = JSON.parse(rd('js/battle/nobiton-moves-data.js').split('= ').slice(1).join('= ').trim().replace(/;$/, ''));
function load(search = '', bpl = [{ sp: 2 }, { sp: 0 }]) {
  const c = { location: { search }, URLSearchParams, BPL: bpl, SK: { 30: [0, 0.65], 33: [0, 0], 39: [0, 1.5] }, matchMedia: () => ({ matches: false }) };
  c.window = c; vm.createContext(c);
  for (const f of ['js/battle/art25d-data.js', 'js/battle/soramo-moves-data.js', 'js/battle/gauru-moves-data.js', 'js/battle/nobiton-moves-data.js', 'js/battle/art25d.js']) vm.runInContext(rd(f), c);
  return c;
}

test('NM-01：10技・59枚・技の番号・ファイル・sha256', () => {
  const ks = Object.keys(DATA).map(Number).sort((a, b) => a - b);
  assert.deepEqual(ks, [30, 31, 32, 33, 34, 35, 36, 37, 38, 39]);
  const n = ks.map((k) => DATA[k].cuts.length + DATA[k].fx.length);
  assert.deepEqual(n, [4, 5, 6, 4, 6, 6, 5, 6, 7, 10]); assert.equal(n.reduce((a, b) => a + b), 59);
  for (const k of ks) {
    assert.equal(DATA[k].no, k - 29);
    for (const c of DATA[k].cuts.concat(DATA[k].fx)) assert.ok(existsSync(path.join(ROOT, 'assets/battle/nobiton_moves_1012', c.f)), c.f);
    for (const c of DATA[k].cuts) assert.ok(c.b[2] > c.b[0] && c.b[3] > c.b[1], c.src);
  }
  const sha = rd('assets/battle/nobiton_moves_1012/sha256.txt').trim().split('\n'); assert.equal(sha.length, 59);
  assert.match(DATA[34].folder, /まきつく/, '05 まきつく（2026-10-14 から正式の技表も まきつく）');
});

test('NM-02：ノビトンの技だけ新しいコマ・効果の置き方・旧の比較', () => {
  let c = load('');
  for (let k = 30; k < 40; k++) assert.equal(c.MM25D.handles(k, 0), true, `ノビトンの技 ${k}`);
  assert.equal(c.MM25D.handles(30, 1), false, '相手（ソラモ）が 30 番を使っても新しいコマにしない');
  assert.equal(c.MM25D.offData(32, 0).fx.map((x) => x.at).join(','), 'fly,tgt', 'はなみず：飛ぶ → 当たる');
  assert.equal(c.MM25D.planOff(39, true, DATA[39]).dur, 2700); assert.equal(c.MM25D.planOff(33, true, DATA[33]).hit, null, 'ひとやすみ（回復）は当たる瞬間の効果なし');
  assert.match(rd('js/battle/art25d.js'), /c\.at === 'fly'/);
  c = load('?battleArt=old'); assert.equal(c.MM25D.handles(30, 0), false);
  const html = rd('index.html'); assert.ok(html.indexOf('js/battle/nobiton-moves-data.js') < html.indexOf('js/battle/art25d.js'));
});
