// =========================================================
// 2026-10-16 夜間 QA（B カメラ・C 歩行の向き・A 道路）のふだんのテスト（作業ブランチ claude/qa-bca-1016 だけ・試作）
//  QB-01 C案カメラは URL の ?qaCam= のときだけ（既定＝従来の後ろから追う・yawTau 600）・MMRF_WORLD の既定は camMode null
//  QW-01〜04 C：ソラモ 5方向×4コマ（?qaWalk=soramo5）の向きの選び方・間の向き・素材・つなぎ方
//  QR-01 A：道路の比較案（?qaRoad=1|2）は URL のときだけ
//  QB-02 QA の入口（js/qa/qa-board-1016.js）は ch1trial／ch2trial／qaCam／qaWalk／qaRoad の URL のときだけ・保存しない（TEST_TOUR）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');

test('QB-01：C案カメラは ?qaCam= のときだけ・既定は従来のまま', async () => {
  await import('../js/proto/roadfirst-world.js');
  const W = globalThis.MMRF_WORLD;
  assert.equal(W.DEF ? W.DEF.camMode : null, null);
  const wb = rd('js/chapter/world-board.js');
  assert.match(wb, /const camOpts = \(\) => \(!QA_CAM \? \{ heading: true, yawTau: 600 \}/, 'フラグなし＝従来の { heading: true, yawTau: 600 }');
  assert.match(wb, /get\('qaCam'\)/);
  assert.ok(!/MMWB\.world\(\)\.qa|camMode:\s*'c'/.test(wb.replace(/camMode: QA_CAM\.mode/, '')), '本番の既定で C案を選ばない');
  const rw = rd('js/proto/roadfirst-world.js');
  assert.match(rw, /const CMODE = o\.heading && \(o\.camMode === 'c' \|\| o\.camMode === 'ccut'\) \? o\.camMode : null;/);
  assert.match(rw, /if \(CMODE\) camC\(info, n, pts, instant\);\s*else \{/, '従来の道筋はそのまま残す');
});

test('QB-02：QA の入口は QA の URL のときだけ・保存しない', () => {
  const s = rd('js/qa/qa-board-1016.js');
  assert.match(s, /const QA = !!\(R1 \|\| get\('ch2trial'\) \|\| get\('qaCam'\) \|\| get\('qaWalk'\) \|\| get\('qaRoad'\)\);/);
  assert.match(s, /if \(QA\) root\.addEventListener\('load'/);
  assert.match(s, /TEST_TOUR = \{ snap:/, '試遊の間は TEST_TOUR（save() は何もしない）');
  assert.ok(!/localStorage/.test(s), 'localStorage に書かない');
  assert.match(rd('index.html'), /<script src="\.\/js\/qa\/qa-board-1016\.js"><\/script>/);
});

// ---- C（ソラモ 5方向×4コマ・?qaWalk=soramo5）----
test('QW-01：8つの向きの選び方（画面の上＝奥＝背面・時計回り・左は反転・境目の近くは直前を保つ）', async () => {
  await import('../js/qa/walk5-1016.js');
  const Q = globalThis.MMQAW; assert.equal(Q.active, false, 'URL が無ければ無効');
  const at = (deg, prev) => { const r = deg * Math.PI / 180; return Q.pick8(Math.sin(r), -Math.cos(r), prev); };
  assert.deepEqual([0, 45, 90, 135, 180, -135, -90, -45].map((d) => { const x = at(d); return [x.sector, x.set, x.flip]; }),
    [[0, 'back', false], [1, 'backd', false], [2, 'side', false], [3, 'frontd', false], [4, 'front', false], [-3, 'frontd', true], [-2, 'side', true], [-1, 'backd', true]]);
  assert.equal(at(28, 0).sector, 0, '境目（22.5°）の少し先でも直前の向きを保つ');
  assert.equal(at(40, 0).sector, 1, '十分に離れたら変える');
  assert.equal(at(0, null).sector, 0);
});
test('QW-02：向きを変えるときに通る間の向き（近いほうの回り方・最大3つ）', async () => {
  await import('../js/qa/walk5-1016.js');
  const Q = globalThis.MMQAW;
  assert.deepEqual(Q.turnPath(4, 0), [-3, -2, -1], 'ちょうど反対・既定＝時計回り（正面 → 左手前 → 左 → 左奥 → 背面）');
  assert.deepEqual(Q.turnPath(0, 4, -1), [-1, -2, -3], '反時計回り＝来た向きへ戻る'); assert.equal(Q.rotOf([-3, -2, -1], 4), 1); assert.equal(Q.rotOf([-1, -2, -3], 0), -1);
  assert.deepEqual(Q.turnPath(0, 2), [1]); assert.deepEqual(Q.turnPath(2, 1), []); assert.deepEqual(Q.turnPath(-2, 2), [-1, 0, 1]);
  for (let a = -3; a <= 4; a++) for (let b = -3; b <= 4; b++) assert.ok(Q.turnPath(a, b).length <= 3, `${a}→${b}`);
});
test('QW-03：素材＝v5 シート（sha256 一致）から同じ窓で切り出した 20コマ・344×344', () => {
  const J = JSON.parse(rd('assets/qa/soramo_5dir_1016/derive.json'));
  assert.equal(J.source_sha256, '355890ecb8a98d69b6c54fea5614bde55b23a27c05620bc2c642987730612c36');
  assert.equal(J.frames.length, 20); assert.deepEqual(J.box, [84, 92, 428, 436]);
  for (const f of J.frames) { const b = readFileSync(path.join(ROOT, 'assets/qa/soramo_5dir_1016', f.file)); assert.equal(b.toString('ascii', 12, 16), 'VP8X'); assert.deepEqual([1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)], [344, 344], f.file); }
});
test('QW-04：盤につなぐのは ?qaWalk=soramo5 のソラモだけ（ほかの種族・通常の URL は従来）', () => {
  const wb = rd('js/chapter/world-board.js');
  assert.match(wb, /SPR\.qa = !!\(root\.MMQAW && root\.MMQAW\.active && key === root\.MMQAW\.species\);/);
  assert.match(wb, /if \(SPR\.qa\) return qaWalk\(/);
  assert.match(rd('js/qa/walk5-1016.js'), /const ACTIVE = q === 'soramo5' \|\| q === '5dir';/);
  assert.match(rd('index.html'), /<script src="\.\/js\/qa\/walk5-1016\.js"><\/script>/);
});
test('QW-05：URL の数の指定が無いときは既定の値（Number(null)＝0 にしない）', async () => {
  for (const f of ['js/qa/walk5-1016.js', 'js/chapter/world-board.js']) assert.match(rd(f), /&& (P|q)\.get\(k\) != null \? Number/, f);
  await import('../js/qa/walk5-1016.js'); assert.equal(globalThis.MMQAW.TURN_MS, 70); assert.equal(globalThis.MMQAW.FPS, 8);
});

// ---- A（道路の見た目・?qaRoad=1|2）----
test('QR-01：道路の比較案は ?qaRoad=1|2 のときだけ（通常は従来の描き方のまま）', async () => {
  await import('../js/qa/road-1016.js');
  const R = globalThis.MMQAR; assert.equal(R.mode, null); assert.equal(R.RES, 5); assert.equal(R.MAX, 14);
  const wb = rd('js/chapter/world-board.js'), rw = rd('js/proto/roadfirst-world.js'), c2 = rd('js/proto/ch2-world.js');
  assert.match(wb, /\.\.\.\(QA_ROAD\(\) \? \{ qaRoad: QA_ROAD\(\) \} : \{\}\)/);
  assert.match(rw, /const HI = QR \? QR\.hiLayer\(/, '近くの層は qaRoad のときだけ');
  assert.match(rw, /if \(QA\) for \(const P of cps\) QA\.meshStrip\(g, P, art\.strip, ART\.strip\.w, bx\);[^\n]*\n\s*else for \(const s of segs\) stripAlong\(/, '従来は stripAlong のまま');
  assert.match(c2, /else \{ g\.strokeStyle = deck; g\.lineWidth = ROAD_W; for \(const P of pts\) \{ pathOf\(g, P\); g\.stroke\(\); \} \}/, 'Chapter 2 も従来の石板のまま');
});
