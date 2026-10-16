// =========================================================
// 2026-10-16 夜間 QA（B カメラ・C 歩行の向き・A 道路）のふだんのテスト（作業ブランチ claude/qa-bca-1016 だけ・試作）
//  QB-01 C案カメラは URL の ?qaCam= のときだけ（既定＝従来の後ろから追う・yawTau 600）・MMRF_WORLD の既定は camMode null
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
