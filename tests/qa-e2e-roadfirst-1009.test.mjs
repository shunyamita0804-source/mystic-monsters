// =========================================================
// 実ブラウザ：Chapter 1 Pattern A 道路先行の試作（2026-10-09・?chapterBoard=roadfirst）
//  RF-B1 通常の URL では何も出ない（試作の画面・状態の鍵なし）
//  RF-B2 3サイズ（390×844・375×667・430×932）：画面に収まる・サイコロ → 1地点ずつ移動 → J0 で道を選ぶ・再読み込みで続きから・ゲームのセーブは変わらない
//  RF-B3 START → GOAL を画面の操作（サイコロ・選択）で最後まで → 「大会の入口へ」＝既存の大会受付（TEST 大会）・セーブは変わらない
//  QA_E2E=1 のときだけ実行（tests/e2e/harness.mjs）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
let L, opened = [];
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });
async function open(opt = {}) { for (const q of opened) await q.ctx.close().catch(() => {}); const p = await L.open(opt); opened = [p]; return p; }
const SHOT = process.env.RF_SHOT_DIR || null;
const shot = (pg, name) => (SHOT ? pg.screenshot({ path: `${SHOT}/${name}.png` }) : null);
/** 画面の操作（サイコロ・選択ボタン）で進める。prefer＝分岐で選ぶ道（無ければ最初のボタン） */
async function drive(pg, maxTurns = 60, prefer = []) {
  for (let i = 0; i < maxTurns * 4; i++) {
    const s = await pg.evaluate(() => MMRF.state());
    if (s.done || s.timeUp) return s;
    await pg.waitForFunction(() => !MMRF.busy());
    const btns = await pg.$$eval('#rfp .rf-ch button', (b) => b.map((x) => x.dataset.seg));
    if (btns.length) { const seg = prefer.find((p) => btns.includes(p)) || btns[0]; await pg.click(`#rfp .rf-ch button[data-seg="${seg}"]`); }
    else await pg.click('#rfp .rf-go');
    await pg.waitForFunction(() => !MMRF.busy());
  }
  return pg.evaluate(() => MMRF.state());
}

test('RF-B1：通常の URL では試作の画面も状態も出ない（今の Chapter 1・開始画面のまま）', { skip: SKIP }, async () => {
  const p = await open(); const pg = p.page; await pg.waitForTimeout(600);
  const r = await pg.evaluate(() => ({ el: !!document.getElementById('rfp'), on: window.MMRF && MMRF.on, key: localStorage.getItem('mmrf_proto_v1'), cfg: !!(MMCH.getConfig(1)) }));
  assert.deepEqual(r, { el: false, on: false, key: null, cfg: true }); assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('RF-B2：3サイズ：画面に収まる・サイコロで1地点ずつ・J0 で左右を選ぶ・再読み込みで続きから・ゲームのセーブは変わらない', { skip: SKIP }, async () => {
  for (const size of [[390, 844], [375, 667], [430, 932]]) {
    const p = await open({ size, query: '?chapterBoard=roadfirst&rfSeed=11&rfRand=open' }); const pg = p.page;
    await pg.waitForSelector('#rfp .rf-go'); await pg.waitForTimeout(400); await shot(pg, `RF-B2_${size.join('x')}_start`);
    const save0 = await pg.evaluate(() => localStorage.getItem('mr4v6'));
    const box = await pg.evaluate(() => { const r = (s) => { const b = document.querySelector(s).getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom]; }; return { go: r('#rfp .rf-go'), top: r('#rfp .rf-top'), msg: r('#rfp .rf-msg'), mon: r('#rfp .rf-mon'), sw: document.documentElement.scrollWidth, iw: innerWidth, ih: innerHeight }; });
    assert.ok(box.sw <= box.iw, `${size}：横にはみ出さない`); for (const k of ['go', 'top', 'msg', 'mon']) assert.ok(box[k][0] >= 0 && box[k][2] <= box.iw + 0.5 && box[k][1] >= 0 && box[k][3] <= box.ih + 0.5, `${size}：${k} は画面の中 ${box[k]}`);
    // 約6地点が見える倍率：画面の高さに見える縦の地点の数（S01 の間隔 21.25 × 倍率 3）
    const seen = await pg.evaluate(() => { const c = document.querySelector('#rfp .rf-cam'); const m = new DOMMatrix(getComputedStyle(c).transform); return Math.round((innerHeight * 0.56) / (21.25 * m.a) * 10) / 10; });
    assert.ok(seen >= 4 && seen <= 9, `${size}：モンスターから上へ見える地点 ${seen}`);
    // 1回目：出目 3 で S01 を3地点
    const steps = []; await pg.exposeFunction('__rfStep', (n) => steps.push(n)).catch(() => {});
    await pg.evaluate(() => { const o = new MutationObserver(() => window.__rfStep && window.__rfStep(MMRF.state().node)); o.observe(document.querySelector('#rfp .rf-mon'), { attributes: true }); });
    await pg.evaluate(() => MMRF.roll(3)); await pg.waitForFunction(() => !MMRF.busy());
    let s = await pg.evaluate(() => MMRF.state()); assert.equal(s.node, 'S01_03'); assert.equal(s.turn, 1); assert.deepEqual(s.trail, ['START', 'S01_01', 'S01_02', 'S01_03']);
    assert.ok(steps.length >= 3, `1地点ずつ動く（${steps.join(',')}）`);
    // J0 で止まらずに選ぶ（残りの目のまま）
    await pg.evaluate(() => MMRF.roll(6)); await pg.waitForFunction(() => !MMRF.busy()); s = await pg.evaluate(() => MMRF.state());
    assert.equal(s.node, 'J0'); assert.equal(s.moveLeft, 1);
    const ch = await pg.$$eval('#rfp .rf-ch button', (b) => b.map((x) => [x.dataset.seg, x.textContent]));
    assert.deepEqual(ch, [['EL01', '左の道'], ['ER01', '右の道']]); assert.equal(await pg.$eval('#rfp .rf-go', (b) => b.disabled), true, '選ぶまでサイコロは押せない');
    await shot(pg, `RF-B2_${size.join('x')}_J0`);
    await pg.click('#rfp .rf-ch button[data-seg="ER01"]'); await pg.waitForFunction(() => !MMRF.busy()); s = await pg.evaluate(() => MMRF.state());
    assert.equal(s.node, 'ER01_01'); assert.equal(s.moveLeft, 0);
    // 再読み込み＝続きから（試作の鍵 mmrf_proto_v1）・ゲームのセーブは変わらない
    await pg.reload(); await pg.waitForSelector('#rfp .rf-go'); s = await pg.evaluate(() => MMRF.state());
    assert.equal(s.node, 'ER01_01'); assert.equal(s.turn, 2);
    assert.equal(await pg.evaluate(() => localStorage.getItem('mr4v6')), save0, 'ゲームのセーブ（mr4v6）は変わらない');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  }
});

test('RF-B3：START → GOAL を画面の操作で最後まで（下の門・Q・上の門・RIVAL を通る）→「大会の入口へ」＝既存の大会受付・セーブは変わらない', { skip: SKIP, timeout: 300000 }, async () => {
  const p = await open(); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); });
  const before = await pg.evaluate(() => localStorage.getItem('mr4v6'));
  await pg.goto(L.url + 'index.html?chapterBoard=roadfirst&rfSeed=5&rfRand=closed'); await pg.waitForSelector('#rfp .rf-go');
  await pg.evaluate(() => { MMRF.reset({ seed: 5, randOpen: false }); MMRF.fast = true; });
  const s = await drive(pg, 60, ['EL01', 'LATE_SAFE']);
  assert.ok(s.done, `GOAL（${s.node}・${s.turn}ターン）`); assert.ok(s.turn <= 40);
  for (const m of ['LOWER_GATE', 'Q', 'R', 'UPPER_GATE', 'RIVAL', 'H', 'FINAL', 'GOAL']) assert.ok(s.trail.includes(m), m);
  assert.ok(s.qDie >= 1 && s.qDie <= 6);
  await pg.evaluate(() => { MMRF.fast = false; }); await pg.waitForTimeout(300); await shot(pg, 'RF-B3_goal');
  assert.equal(await pg.$eval('#rfp .rf-go', (b) => b.textContent), '大会の入口へ');
  await pg.click('#rfp .rf-go');
  await pg.waitForFunction(() => !document.getElementById('rfp') && /公式大会/.test(document.querySelector('#app').innerText) && !!document.querySelector('[onclick*="p9RcvJoin"]'), null, { timeout: 15000 });
  await shot(pg, 'RF-B3_reception');
  assert.equal(await pg.evaluate(() => localStorage.getItem('mr4v6')), before, '試作から大会受付へ入ってもセーブは変わらない（TEST 大会）');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
