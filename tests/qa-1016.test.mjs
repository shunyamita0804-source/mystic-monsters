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

test('QB-01：カメラは C案だけ（2026-10-19 から比較の切り替えなし）・MMRF_WORLD の既定（試作）は camMode null', async () => {
  await import('../js/proto/roadfirst-world.js');
  const W = globalThis.MMRF_WORLD;
  assert.equal(W.DEF ? W.DEF.camMode : null, null);
  const wb = rd('js/chapter/world-board.js');
  // 2026-10-19 第2工程：C案が本編と QA の唯一のカメラ（?qaCam の比較は撤去＝old／fixed／ccut に戻せない）
  assert.match(wb, /const QA_CAM = Object\.freeze\(\{ mode: 'c', deg: 50, ms: 600 \}\);/);
  assert.match(wb, /const camOpts = \(\) => \(\{ heading: true, yawTau: 600, camMode: QA_CAM\.mode, camTurnDeg: QA_CAM\.deg, camTurnMs: QA_CAM\.ms \}\);/);
  assert.doesNotMatch(wb, /get\('qaCam'\)/, 'URL でカメラを変えない');
  const rw = rd('js/proto/roadfirst-world.js');
  assert.match(rw, /const CMODE = o\.heading && \(o\.camMode === 'c' \|\| o\.camMode === 'ccut'\) \? o\.camMode : null;/);
  assert.match(rw, /if \(CMODE\) camC\(info, n, pts, instant\);\s*else \{/, '従来の道筋はそのまま残す');
});

test('QB-02：QA の入口は QA の URL のときだけ・保存しない', () => {
  const s = rd('js/qa/qa-board-1016.js');
  assert.match(s, /const QA = !!\(R1 \|\| get\('ch2trial'\)\);/);   // 2026-10-19：比較の URL（qaCam・qaWalk・qaRoad・qaRoadArt）は撤去＝試遊の URL だけ
  assert.match(s, /if \(QA\) root\.addEventListener\('load'/);
  assert.match(s, /TEST_TOUR = \{ snap:/, '試遊の間は TEST_TOUR（save() は何もしない）');
  assert.ok(!/localStorage/.test(s), 'localStorage に書かない');
  assert.match(rd('index.html'), /<script src="\.\/js\/qa\/qa-board-1016\.js"><\/script>/);
});

// ---- C（盤の歩行＝5方向×4コマ・2026-10-19 から walk_1018 だけ）----
test('QW-01：8つの向きの選び方（画面の上＝奥＝背面・時計回り・左は反転・境目の近くは直前を保つ）', async () => {
  await import('../js/qa/walk5-1016.js');
  const Q = globalThis.MMQAW; assert.equal(Q.active, true, '新歩行が正式（URL の切り替えは無い）'); assert.equal(Q.new7, true); assert.equal(Q.legacy, false);
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
test('QW-03：10-16 のソラモ試作の素材（v5 シート・sha256 一致・20コマ 344×344）は記録としてファイルだけ残り、コードからは読まない（2026-10-19）', () => {
  const J = JSON.parse(rd('assets/qa/soramo_5dir_1016/derive.json'));
  assert.equal(J.source_sha256, '355890ecb8a98d69b6c54fea5614bde55b23a27c05620bc2c642987730612c36');
  assert.equal(J.frames.length, 20); assert.deepEqual(J.box, [84, 92, 428, 436]);
  for (const f of J.frames) { const b = readFileSync(path.join(ROOT, 'assets/qa/soramo_5dir_1016', f.file)); assert.equal(b.toString('ascii', 12, 16), 'VP8X'); assert.deepEqual([1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)], [344, 344], f.file); }
  for (const f of ['js/qa/walk5-1016.js', 'js/chapter/world-board.js', 'js/chapter/configs/ch2a.js', 'js/qa/trial.js']) { const t = rd(f).replace(/^\s*\/\/.*$/gm, ''); assert.ok(!t.includes('soramo_5dir_1016') && !t.includes('walk_1017/'), f); }
});
test('QW-04：盤の歩行＝新歩行（walk_1018・7体）だけ。比較の URL（?qaWalk=old／1017／soramo5）は撤去（2026-10-19）', () => {
  const wb = rd('js/chapter/world-board.js');
  assert.match(wb, /SPR\.qa = !!\(root\.MMQAW && root\.MMQAW\.active && \(root\.MMQAW\.has \? root\.MMQAW\.has\(key\) : key === root\.MMQAW\.species\)\);/);
  assert.match(wb, /if \(SPR\.qa\) return qaWalk\(/);
  const w5 = rd('js/qa/walk5-1016.js');
  assert.match(w5, /const ACTIVE = true, NEW7 = true, LEGACY = false, SET = '1018';/);
  for (const f of ['js/qa/walk5-1016.js', 'js/chapter/configs/ch2a.js', 'js/chapter/field-view.js', 'js/qa/qa-board-1016.js']) assert.ok(!/get\('qaWalk|qaWalkFps|qaWalkTurn|MMQAW\.legacy\)/.test(rd(f).replace(/^\s*\/\/.*$/gm, '')), f);
  assert.match(rd('index.html'), /<script src="\.\/js\/qa\/walk5-1016\.js"><\/script>/);
});
test('QW-05：歩行の速さ・向きを変える間は固定（8fps・70ms）＝URL の数の指定は読まない', async () => {
  await import('../js/qa/walk5-1016.js'); assert.equal(globalThis.MMQAW.TURN_MS, 70); assert.equal(globalThis.MMQAW.FPS, 8);
  assert.match(rd('js/qa/walk5-1016.js'), /const FPS = 8, TURN_MS = 70;/);
});

// ---- A（道路の見た目・?qaRoad=1|2）----
test('QR-01：道路の比較案は ?qaRoad=1|2 のときだけ（通常は従来の描き方のまま）', async () => {
  await import('../js/qa/road-1016.js');
  const R = globalThis.MMQAR; assert.equal(R.mode, null); assert.equal(R.RES, 5); assert.equal(R.MAX, 14);
  const wb = rd('js/chapter/world-board.js'), rw = rd('js/proto/roadfirst-world.js'), c2 = rd('js/proto/ch2-world.js');
  assert.match(wb, /\.\.\.\(roadFor\(m\) \? \{ qaRoad: roadFor\(m\) \} : \{\}\)/);
  assert.match(rw, /const HI = QR && !GL \? QR\.hiLayer\(/, '近くの層は qaRoad のときだけ（2026-10-20 第4便：WebGL の盤では作らない）');
  assert.match(rw, /if \(QA\) for \(const P of cps\) QA\.meshStrip\(g, P, art\.strip, ART\.strip\.w, bx\);[^\n]*\n\s*else for \(const s of segs\) stripAlong\(/, '従来は stripAlong のまま');
  assert.match(c2, /else \{ g\.strokeStyle = deck; g\.lineWidth = ROAD_W; for \(const P of pts\) \{ pathOf\(g, P\); g\.stroke\(\); \} \}/, 'Chapter 2 も従来の石板のまま');
});
