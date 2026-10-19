// =========================================================
// 2026-10-19 次便一括・第2工程：正式決定の一元化（再混入を防ぐ）
//  UN-01 カメラは C案だけ・比較の URL（qaCam・qaRoad・qaRoadArt・boardSkin）を本編のコードが読まない
//  UN-02 Chapter 1〜4 の盤はすべて 40ターン・サイコロ 1〜6（同じ make）・旧い 20ターンの盤は旧盤の途中のセーブだけ
//  UN-03 シミュレーター（tools/ch4/sim.mjs）はゲームと同じ TUNING（js/proto/roadfirst-play.js）を読む＝数値の二重定義なし。休む −10 は試遊用の暫定値のまま（正式化していない）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const jsFiles = (d) => readdirSync(path.join(ROOT, d), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? jsFiles(path.join(d, e.name)) : e.name.endsWith('.js') ? [path.join(d, e.name)] : []));

test('UN-01：カメラは C案だけ・比較の URL を読まない', () => {
  const code = (f) => rd(f).split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n');
  for (const f of jsFiles('js')) {
    const s = code(f);
    for (const k of ['qaCam', 'qaRoadArt', 'boardSkin', 'MM_BOARD_SKIN']) assert.ok(!new RegExp(`get\\(['"]${k}['"]\\)|\\b${k === 'MM_BOARD_SKIN' ? 'root\\.MM_BOARD_SKIN' : 'qaZZ'}\\b`).test(s), `${f}：${k}`);
    assert.ok(!/get\(['"]qaRoad['"]\)/.test(s), `${f}：qaRoad`);
  }
  assert.match(rd('js/chapter/world-board.js'), /const QA_CAM = Object\.freeze\(\{ mode: 'c'/);
});

test('UN-02：Chapter 1〜4 の盤は 40ターン・1〜6（同じ make）', () => {
  const w = rd('js/chapter/world-driver.js'); assert.match(w, /const CH = cfg\.ch \|\| 1, TURN_LIMIT = 40, DICE = 6;/);
  for (const [f, ch] of [['js/chapter/world-driver-ch2.js', 2], ['js/chapter/world-driver-ch3.js', 3], ['js/chapter/world-driver-ch4.js', 4]]) { const s = rd(f); assert.match(s, /root\.MMWD_MAKE\(\{/); assert.match(s, new RegExp(`ch: ${ch},`)); assert.doesNotMatch(s, /TURN_LIMIT|turnLimit:\s*\d/, f + '：ターン数を別に決めない'); }
  const h = rd('index.html'); for (const f of ['world-driver-ch2.js', 'world-driver-ch3.js', 'world-driver-ch4.js']) assert.ok(h.includes('./js/chapter/' + f), f);
  // 旧盤（20ターン）へ入るのは旧盤の途中のセーブだけ（handles が false になる条件＝oldBoard／QA の旧テストの変数）
  assert.match(rd('js/chapter/world-driver-ch4.js'), /handles: \(key, m\) => key === 4 && !qaOff\(\) && !oldBoard\(m\)/);
});

test('UN-03：シミュレーターはゲームと同じ TUNING を読む（二重定義なし）', () => {
  const sim = rd('tools/ch4/sim.mjs');
  assert.match(sim, /roadfirst-play\.js/, 'MMRF_PLAY（ゲームの TUNING）を読む');
  assert.doesNotMatch(sim, /restAmount\s*[:=]\s*\d|fatigueByDie\s*[:=]/, '休む・空腹の数値をシミュレーター側で決めない');
  assert.match(rd('js/proto/roadfirst-play.js'), /restAmount: 10,\s+\/\/ 「休む」：空腹 −10・1ターン・移動なし（2026-10-12 P2 試遊用の暫定値/, '休む −10 は暫定値のまま（正式化しない＝報告事項）');
});
