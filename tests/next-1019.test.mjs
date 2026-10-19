// =========================================================
// 2026-10-19 次便一括・第1工程の修正（ブラウザなし）
//  NX19-01 ソラモ・ガウルの特訓で覚える技＝CLAUDE.md §3（2026-10-06・5）の正式ルートを MMP7 に登録（旧：未登録で特訓のゴールで技を覚えなかった）・ノビトンは未確定＝登録しない
//  NX19-02 敗北の音：LOSE の曲のあと保持音（Chapter の曲を結果の画面で鳴らし直さない）・ライバル戦の悲しみボイスはボードで（MMAUDIO.holdStart／holdStop）
//  NX19-03 バトルの立ち絵が画面の端で切れない（MMARENA.keepIn）・Chapter 3 の道は Chapter 1 の石畳を使わない
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');

test('NX19-01：ソラモ・ガウルの特訓の技（正式ルート）・ノビトンは未登録', () => {
  const ctx = { console }; ctx.window = ctx; vm.createContext(ctx);
  for (const f of ['js/phase7/progression.js', 'js/phase10/monsters.js', 'js/battle/official-moves.js']) vm.runInContext(rd(f), ctx, { filename: f });
  const T = ctx.MMMOVES.TRAIN_LEARN, P7 = ctx.MMP7;
  assert.deepEqual(JSON.parse(JSON.stringify(T)), { 0: { initial: [0, 1, 2, 3], po: [4], in: [5], hi: [6], ev: [7], de: [8, 9] }, 1: { initial: [11, 12, 10, 13], po: [14], in: [15], hi: [16], ev: [17], de: [18, 19] } });
  for (const sp of [0, 1]) P7.registerMoveset(sp, T[sp]);   // 形の検査（4・1・1・1・1・2・重複なし）を通る
  // 正式技の表と一致：初期の4技・特訓の技の番号は OFFICIAL_MOVES の slot
  const M = ctx.MMP10M; for (const [key, sp] of [['solamo', 0], ['gauru', 1]]) { const slots = M.movesOf(key).map((m) => m.slot).sort((a, b) => a - b); assert.deepEqual(JSON.parse(JSON.stringify(Object.values(T[sp]).flat().sort((a, b) => a - b))), JSON.parse(JSON.stringify(slots)), key); }
  assert.equal(P7.getMoveset(2), null, 'ノビトンは習得の表が未確定＝登録しない（捏造しない）');
  const js = rd('js/battle/official-moves.js'); assert.match(js, /registerLearn\(\);\n\s*installed = true;/);
  assert.match(rd('index.html'), /覚える技は準備中（能力は伸びる）/); assert.doesNotMatch(rd('index.html'), /<i>技データ未登録<\/i>/);
});

test('NX19-02：敗北の保持音・ライバル戦の悲しみボイス', () => {
  const ctx = { console }; ctx.window = ctx; vm.createContext(ctx); vm.runInContext(rd('js/audio/audio-manager.js'), ctx);
  const A = ctx.MMAUDIO; for (const k of ['holdStart', 'holdStop', 'holding']) assert.equal(typeof A[k], 'function', k);
  assert.equal(A.holdStart(), false, 'Web Audio が無い環境では何もしない'); assert.equal(A.holding(), false);
  const am = rd('js/audio/audio-manager.js'); assert.match(am, /function scene\(name, opts = \{\}\) \{\n\s*holdStop\(400\);/); assert.match(am, /function stopBgm\(opts = \{\}\) \{ holdStop\(250\);/);
  const h = rd('index.html');
  assert.match(h, /if\(!win\)\{RJ\.after=setTimeout\(function hold\(\)\{[^}]*MMAUDIO\.holdStart/, '負けたら LOSE のあと保持音');
  assert.doesNotMatch(h, /win\?4250:6600/, '結果の画面で Chapter の曲を鳴らし直さない（旧：LOSE の 6.6秒後に次の場面）');
});

test('NX19-03：立ち絵が端で切れない・Chapter 3 の道', () => {
  const a = rd('js/battle/arena.js'); assert.match(a, /function keepIn\(bt\)/); assert.match(a, /margin-left:var\(--mma-dx,0px\)/);
  const r = rd('js/qa/road-art-1017.js'); assert.match(r, /S: \{ ground: 'ch1_ground_a2', road: 'gen:sky_road', strip: 'gen:sky_strip' \}/);
});
