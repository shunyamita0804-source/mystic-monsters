// =========================================================
// 2026-10-12：ソラモの技アニメ（修正納品の46コマ）を通常のバトルへ（js/battle/soramo-moves-data.js・js/battle/art25d.js の正式の経路）
//  SM-01：10技・46コマ（4・4・4・4・6・4・4・4・6・6）・技の番号と名前＝OFFICIAL_MOVES.solamo.list の slot と name・ファイルの実在・納品の sha256 の記録
//  SM-02：重ねる層：ソラモビームの F003 はビームだけ（F002 と同じ区切り）・スターフォールの F04〜F06 は星群だけ（F03 を最後まで残す）
//  SM-03：通常の URL＝ソラモ（sp 0）の技 0〜9 は新しいコマ・待機の立ち絵は変えない・ガウルの技は今まで・合体の子が別の種族の技を使うときは今まで・?battleArt=old の「旧」では今まで
//  SM-04：区切りの時間（共通演出のとき 6コマの大技は長め・通らないときは fight() の 1.44秒）・補助技は当たる瞬間の効果なし
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (f) => readFileSync(path.join(ROOT, f), 'utf8');
const DATA = JSON.parse(rd('js/battle/soramo-moves-data.js').split('= ').slice(1).join('= ').trim().replace(/;$/, ''));

function load(search = '', bpl = [{ sp: 0 }, { sp: 1 }]) {
  const c = { location: { search }, URLSearchParams, BPL: bpl, SK: { 0: [0, 70], 3: [0, 0], 7: [0, 0], 9: [0, 140] }, matchMedia: () => ({ matches: false }) };
  c.window = c; vm.createContext(c);
  for (const f of ['js/battle/art25d-data.js', 'js/battle/soramo-moves-data.js', 'js/battle/art25d.js']) vm.runInContext(rd(f), c);
  return c;
}
const official = () => { const c = { window: {} }; c.globalThis = c; vm.createContext(c); vm.runInContext(rd('js/phase10/monsters.js'), c); return (c.MMP10M || c.window.MMP10M).OFFICIAL_MOVES.solamo.list; };

test('SM-01：10技・46コマ・技の番号と名前・ファイル・sha256', () => {
  const ks = Object.keys(DATA).map(Number).sort((a, b) => a - b);
  assert.deepEqual(ks, [...Array(10).keys()]);
  const n = ks.map((k) => DATA[k].cuts.length + DATA[k].fx.length);
  assert.deepEqual(n, [4, 4, 4, 4, 6, 4, 4, 4, 6, 6]); assert.equal(n.reduce((a, b) => a + b), 46);
  const L = official(), norm = (s) => s.replace(/吠える/, 'ほえる');
  for (const m of L) assert.equal(norm(DATA[m.slot].name), norm(m.name), `slot ${m.slot}`);
  const files = new Set();
  for (const k of ks) for (const c of DATA[k].cuts.concat(DATA[k].fx)) {
    assert.ok(existsSync(path.join(ROOT, 'assets/battle/soramo_moves_1012', c.f)), c.f); files.add(c.name);
    assert.match(c.name, /^SORAMO_[A-Z_]+_F\d+.*\.png$/);
    if (c.b) assert.ok(c.b[2] > c.b[0] && c.b[3] > c.b[1] && c.b[2] <= c.pw + 1 && c.b[3] <= c.ph + 1, `${c.src}：本体の外接矩形`);
  }
  assert.equal(files.size, 46, '納品の46枚をすべて使う');
  const sha = rd('assets/battle/soramo_moves_1012/sha256.txt').trim().split('\n');
  assert.equal(sha.length, 46); for (const l of sha) assert.match(l, /^[0-9a-f]{64} {2}SORAMO_.+\.png$/);
  assert.ok(sha.some((l) => l.startsWith('d20917dfc882d58c033e49d40a59ef1efc43aa7f27ece36b2a87ca3112f16418  SORAMO_STARDUST_RAY_F002_swirl.png')), 'スターダストレイ F002＝再構成版（修正後の sha256）');
  for (const f of ['idle_soramo.webp']) assert.ok(existsSync(path.join(ROOT, 'assets/battle/idle', f)), '待機の立ち絵は残す');
});

test('SM-02：ビーム・星群は効果だけの層として重ねる（単独のモンスターの絵にしない）', () => {
  const b = DATA[5];
  assert.equal(b.steps, 3); assert.deepEqual(b.fx.map((c) => [c.at, c.t]), [['beam', [1, 1]]]);
  assert.equal(b.cuts[1].name, 'SORAMO_SORAMO_BEAM_F002_HASTUHA_no_beam.png'); assert.deepEqual(b.cuts[1].t, [1, 1], 'F002 と同じ区切り');
  assert.ok(b.cuts.every((c) => !/LAYER_ONLY/.test(c.name)), 'F003 は本体のコマにしない');
  const s = DATA[9];
  assert.equal(s.steps, 6); assert.deepEqual(s.fx.map((c) => c.at), ['sky', 'barrage', 'impact']); assert.deepEqual(s.fx.map((c) => c.t[0]), [3, 4, 5]);
  assert.deepEqual(s.cuts[2].t, [2, 5], 'F03（見上げる姿）は最後まで残す'); assert.equal(s.hit, 6, '着弾の光で当たる');
  const js = rd('js/battle/art25d.js');
  assert.match(js, /FXP = \{ sky:/); assert.match(js, /c\.at === 'beam'/);
});

test('SM-03：通常の URL＝ソラモの技は新しいコマ・待機の立ち絵は変えない・ガウルは今まで', () => {
  let c = load('');
  for (let k = 0; k < 10; k++) assert.equal(c.MM25D.handles(k, 0), true, `ソラモの技 ${k}`);
  assert.equal(c.MM25D.handles(10, 1), false, 'ガウルの技は今まで（比較試遊のときだけ）');
  assert.equal(c.MM25D.handles(0, 1), false, '相手（ガウル）がソラモの技番号を使っても新しいコマにしない');
  assert.equal(c.MM25D.idleSrc(0), null, '待機の立ち絵は変えない'); assert.equal(c.MM25D.on, false);
  c = load('', [{ sp: 1 }, { sp: 0 }]); assert.equal(c.MM25D.handles(9, 1), true, '相手側のソラモ'); assert.equal(c.MM25D.handles(9, 0), false);
  c = load('?battleArt=old'); assert.equal(c.MM25D.handles(0, 0), false, '比較の「旧」では今まで');
  c = load('?battleArt=2p5d'); assert.equal(c.MM25D.handles(0, 0), true); assert.ok(c.MM25D.offData(0, 0), '比較の 2.5D でもソラモは新しいコマ');
  const html = rd('index.html');
  assert.ok(html.indexOf('js/battle/art25d-data.js') < html.indexOf('js/battle/soramo-moves-data.js') && html.indexOf('js/battle/soramo-moves-data.js') < html.indexOf('js/battle/art25d.js'));
  assert.doesNotMatch(rd('js/battle/art25d.js'), /localStorage|S\.\w+\s*=|save\(/, 'セーブに触れない');
});

test('SM-04：区切りの時間・補助技', () => {
  const c = load('');
  const p0 = c.MM25D.planOff(0, true), p9 = c.MM25D.planOff(9, true), q = c.MM25D.planOff(9, false), h = c.MM25D.planOff(3, true);
  assert.equal(p0.win.length, 4); assert.ok(p0.dur >= 1500 && p0.dur <= 2700);
  assert.equal(p9.dur, 2700); assert.equal(p9.win.length, 6); assert.ok(p9.hit >= p9.win[5][0] && p9.hit < p9.win[5][1]);
  assert.equal(q.dur, 1440, '共通演出を通らないときは fight() の次のターンに収める');
  assert.equal(h.hit, null, '補助技（威力なし）は当たる瞬間の効果を出さない');
});
