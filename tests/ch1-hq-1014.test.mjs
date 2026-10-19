// =========================================================
// 2026-10-14 Chapter 1 A／B／C 高品質化（正式13点の派生・js/proto/roadfirst-world.js の SKIN 'hq1014'）
//  HQ-01 派生 15ファイル（地面7・道の帯2・景物6）がある・WebP・README の SHA-256 と一致・原本 PNG を置いていない
//  HQ-02 SKIN の読み替え：各パターンの元の名前はそのパターンの景物の一覧（VISUAL）にある・行き先のファイルがある・13点すべてどこかで使う
//  HQ-03 配置は変えない：skin を渡しても scatter・waterProps・peaksOf の出力は同じ（VP-01 の基準の sha256 も同じ）・skinOf は skin が無ければ null
//  HQ-04 つなぎ先：本編（world-board）だけが skin を渡す・?boardSkin=1010 で従来の絵・出発の先読みも skin の絵・読めない絵は従来の絵へ戻す作り
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const fsha = (p) => createHash('sha256').update(readFileSync(path.join(ROOT, p))).digest('hex');
const sha = (x) => createHash('sha256').update(JSON.stringify(x)).digest('hex');
await import('../js/proto/roadfirst-data.js'); await import('../js/proto/roadfirst-world.js');
const D = globalThis.MMRF_DATA, Wd = globalThis.MMRF_WORLD;
const DIR = 'assets/fields/ch1a/board_hq_1014';
const FILES = ['ground_a1.webp', 'ground_a2.webp', 'ground_a3.webp', 'road_r1.webp', 'road_r2.webp', 'strip_r1.webp', 'strip_r2.webp', 'water_w1.webp', 'water_w2.webp',
  'tree_t1.webp', 'tree_t2.webp', 'rockpillar_rp1.webp', 'rockpillar_rp2.webp', 'flowers_f1.webp', 'flowers_f2.webp'];
const ORIG = { A1: 'ground_a1', A2: 'ground_a2', A3: 'ground_a3', R1: 'road_r1', R2: 'road_r2', W1: 'water_w1', W2: 'water_w2', T1: 'tree_t1', T2: 'tree_t2', RP1: 'rockpillar_rp1', RP2: 'rockpillar_rp2', F1: 'flowers_f1', F2: 'flowers_f2' };

test('HQ-01：派生 15ファイル・WebP・README の SHA-256・原本 PNG なし', () => {
  const readme = rd(DIR + '/README.md');
  for (const f of FILES) {
    const b = readFileSync(path.join(ROOT, DIR, f));
    assert.equal(b.subarray(0, 4).toString(), 'RIFF', f); assert.equal(b.subarray(8, 12).toString(), 'WEBP', f);
    assert.ok(b.length < 160000, f + '：ゲームの大きさ（' + b.length + '）');
    assert.ok(readme.includes(fsha(DIR + '/' + f)), f + '：README の SHA-256');
  }
  assert.deepEqual(readdirSync(path.join(ROOT, DIR)).filter((f) => !/\.(webp|md)$/.test(f)), [], '原本 PNG などを置かない');
  assert.ok(existsSync(path.join(ROOT, 'tools/boardhq1014/derive.py')));
  for (const s of ['96da3260', 'a24977e2', 'c8c154da', '4c7ad385', '6c8c9def', 'd5fc2b7f', 'bf68e3bb', '58713666', '4acb4212', '0b09bc70', 'ecc37696', 'ad11a74c', 'fc09db52'])
    assert.ok(readme.includes(s), '原本の SHA-256 ' + s);
});

test('HQ-02：SKIN の読み替え（元の名前はそのパターンの景物・行き先がある・13点すべて使う）', () => {
  const K = Wd.SKIN.hq1014; assert.equal(K.base, './' + DIR + '/');
  const used = new Set();
  for (const v of ['A', 'B', 'C']) {
    const S = K[v], own = new Set(Wd.VISUAL[v].props.map((p) => p.file));
    for (const k of ['ground', 'road', 'strip', 'water']) { assert.ok(FILES.includes(S[k]), v + ' ' + k); used.add(S[k]); }
    for (const [from, [to, k]] of Object.entries(S.props)) {
      assert.ok(own.has(from), `${v}：${from} はこのパターンの景物`); assert.ok(FILES.includes(to), to); assert.ok(k > 0.5 && k <= 1, '幅の倍率'); used.add(to);
    }
  }
  for (const [code, f] of Object.entries(ORIG)) assert.ok([...used].some((u) => u.startsWith(f)), code + ' を使う');
  assert.deepEqual([K.A.ground, K.B.ground, K.C.ground], ['ground_a1.webp', 'ground_a2.webp', 'ground_a3.webp']);
  assert.deepEqual([K.A.strip, K.B.strip, K.C.strip], ['strip_r1.webp', 'strip_r1.webp', 'strip_r2.webp']);
  assert.ok(K.roadTile > Wd.ART.strip.w * 0.62 * 2, 'R の1枚は敷石の円より大きい（円の中につなぎ目が入らない）');
});

test('HQ-03：配置は変えない（skin を渡しても同じ出力・VP-01 の基準も同じ）', () => {
  for (const v of ['A', 'B', 'C']) {
    const o = Object.assign({}, Wd.DEF, { visual: v }), os = Object.assign({}, o, { skin: 'hq1014' });
    assert.deepEqual(Wd.scatter(D, os), Wd.scatter(D, o), v + ' scatter'); assert.deepEqual(Wd.waterProps(D, os), Wd.waterProps(D, o), v + ' waterProps'); assert.deepEqual(Wd.peaksOf(D, os), Wd.peaksOf(D, o));
    const sk = Wd.skinOf(os); assert.equal(sk.key, 'hq1014'); assert.equal(sk.ground, Wd.SKIN.hq1014[v].ground);
  }
  const a = Object.assign({}, Wd.DEF, { visual: 'A', skin: 'hq1014' });
  assert.equal(sha(Wd.scatter(D, a)), '58a0ce1af9fb1661441d6412e6c7f290d32dff3946df415d549525d8497177ac', 'A の景物の配置は従来の基準のまま');
  assert.equal(Wd.skinOf(Object.assign({}, Wd.DEF)), null, '試作の既定＝skin なし'); assert.equal(Wd.skinOf({ skin: 'zzz' }), null);
  assert.equal(Wd.DEF.skin, undefined, 'DEF は変えない');
  assert.equal(Wd.skinOf({ skin: 'hq1014', visual: 'zzz' }).ground, 'ground_a1.webp', '知らない景観は A');
});

test('HQ-04：本編だけが skin を渡す（いつも hq1014・2026-10-19 から比較の切り替えなし）・先読み・読めないときは従来の絵', () => {
  const WB = rd('js/chapter/world-board.js'), W = rd('js/proto/roadfirst-world.js'), IX = rd('index.html');
  assert.match(WB, /visual: vis, skin: skinKey\(\) \}\);/);
  assert.match(WB, /const skinKey = \(\) => 'hq1014';/, '2026-10-19：?boardSkin=1010 の比較は撤去＝いつも正式の hq1014');
  assert.match(IX, /MMRF_WORLD\.warmArt\(null,MMWB\.skinKey&&MMWB\.skinKey\(\)\)/);
  assert.match(W, /\.then\(\(im\) => im \|\| load\(f\)\)/, '地面・道・水：読めなければ従来の絵');
  assert.match(W, /addEventListener\('error', \(\) => \{ d\.src = base \+ file; p\.w = w;/, '景物：読めなければ従来の絵と幅');
  // 試作（?chapterBoard=roadfirst）は skin を渡さない（2026-10-15：Chapter 2 設計案のプレビュー＝&rfData=ch2 の分かれ道の中だけ hq1014）
  const RV = rd('js/proto/roadfirst-view.js'), sk = [...RV.matchAll(/skin:/g)].map((m) => m.index);
  assert.equal(sk.length, 1, '試作の画面は従来の絵（Chapter 2 のプレビューだけ）');
  assert.ok(/\.\.\.\(CH2 \? \{[^}]*skin: 'hq1014' \} : \{\}\)/.test(RV), 'skin は CH2 の分かれ道の中');
});
