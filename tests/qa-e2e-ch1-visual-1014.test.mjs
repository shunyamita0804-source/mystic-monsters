// =========================================================
// 2026-10-14 Chapter 1「はじまりの草原」B／C パターン（実ブラウザ・本編の Chapter 1＝worldCh1:true）
//  VB-1（375×667・390×844・430×932）：出発準備に「景色をえらぶ」（A／B／C・A が既定）→ B を選ぶ → 実際の出発（フィナの確認 →「始める」）
//         → m.raise.field.visualPattern＝'B'・盤の data-visual＝'B'・保留は A へ戻る → 再読み込みしても B のまま・画面の中・404 なし
//         「出発する」の位置（下からの距離）は従来どおり（GB-3 と同じ基準）
//  VB-2：旧い Chapter 1（harness の既定＝MM_QA_OLD_CH1）では選択 UI を出さない
//  VB-3：visualPattern の無い途中のセーブ（旧セーブ）は A で描く。C を選んだ出発は C・景物（種類と位置）が A と違う
//  Playwright / Chromium が無い環境では省略（skip）する。
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
let L = null;
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });
const OPEN = [];
const openPage = async (o = {}) => { const p = await L.open({ worldCh1: true, ...o }); OPEN.push(p); return p; };
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close().catch(() => {}); });
const shot = (pg, n) => (process.env.MM_SHOT ? pg.screenshot({ path: `${process.env.MM_SHOT}/${n}.png` }) : null);
const idle = (pg) => pg.waitForFunction(() => !bBusy && !MMCHD.isLocked() && !document.querySelector('.wbrelay,.wb-pop,.chf-enc2,.mmtalk,.chdz') && !MMWB.state().intro, null, { timeout: 40000 }).then(() => pg.waitForTimeout(300));
const reopen = async (pg) => { await pg.reload(); await pg.waitForFunction(() => typeof window.MMP8 === 'object' && typeof S === 'object'); await pg.waitForSelector('.p15start'); await pg.click('.p15start'); await pg.waitForSelector('#wbw #brollbtn', { timeout: 30000 }); await idle(pg); };
const toPrep = async (pg) => {
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); prepScr(); });
  await pg.waitForSelector('.pp .ppgobtn'); await pg.waitForTimeout(400);
};
const picker = (pg) => pg.evaluate(() => { const b = [...document.querySelectorAll('.ppvis .ppvb')]; const g = document.querySelector('.pp .ppgobtn'), pp = document.querySelector('.pp');
  return { n: b.length, keys: b.map((x) => x.dataset.v), on: b.map((x) => x.classList.contains('on')), aria: b.map((x) => x.getAttribute('aria-checked')),
    names: b.map((x) => x.querySelector('b').textContent), inside: b.every((x) => { const r = x.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth; }),
    gap: g && pp ? pp.getBoundingClientRect().bottom - g.getBoundingClientRect().bottom : null, goBottom: g ? g.getBoundingClientRect().bottom : null, H: innerHeight, pend: MMWD.pendingVisual() }; });
const boardState = (pg) => pg.evaluate(() => ({ vp: S.m.raise.field.visualPattern, pid: S.m.raise.field.patternId, vis: document.querySelector('#wbw .rfw') && document.querySelector('#wbw .rfw').dataset.visual,
  wvis: MMWB.state().world.visual, props: document.querySelectorAll('#wbw .rfw-prop').length, sig: [...document.querySelectorAll('#wbw img.rfw-prop:not(.rfw-mark)')].map((i) => (i.getAttribute('src') || '').split('/').pop() + '@' + i.style.transform).sort().join(','), pend: MMWD.pendingVisual(), node: S.m.raise.node, painted: MMWB.state().world.painted }));

for (const size of [[375, 667], [390, 844], [430, 932]]) {
  test(`VB-1（${size.join('×')}）：景色をえらぶ（A が既定）→ B → 実際の出発 → 保存・盤・再読み込み`, { skip: SKIP, timeout: 150000 }, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await H.newGame(pg, 'テスト'); await toPrep(pg);
    const a = await picker(pg);
    assert.deepEqual([a.n, a.keys, a.on, a.aria, a.pend], [3, ['A', 'B', 'C'], [true, false, false], ['true', 'false', 'false'], 'A'], `A が既定 ${JSON.stringify(a)}`);
    assert.deepEqual(a.names, ['はじまりの草原', '花と清流の草原', '岩丘と遺跡の草原']);
    assert.ok(a.inside, '3つのボタンが画面の中');
    assert.ok(a.gap >= (size[1] <= 700 ? 24 : 34) && a.goBottom <= a.H, `「出発する」の位置は従来どおり ${JSON.stringify(a)}`);
    await shot(pg, `vb1_prep_a_${size.join('x')}`);
    await pg.click('.ppvis .ppvb[data-v="B"]'); await pg.waitForTimeout(100);
    const b = await picker(pg);
    assert.deepEqual([b.on, b.aria, b.pend], [[false, true, false], ['false', 'true', 'false'], 'B'], `B を選んだ ${JSON.stringify(b)}`);
    await shot(pg, `vb1_prep_b_${size.join('x')}`);
    await H.startRaising(pg);              // フィナの確認 →「始める」→ ダン → 盤（実際の出発）
    await idle(pg);
    const s1 = await boardState(pg);
    assert.deepEqual([s1.vp, s1.pid, s1.vis, s1.wvis, s1.pend, s1.painted], ['B', 'W', 'B', 'B', 'A', true], `出発で B を保存・盤は B・保留は A へ戻る ${JSON.stringify(s1)}`);
    assert.ok(s1.props > 0);
    const saved = await H.storedSave(pg);
    assert.equal(saved.m.raise.field.visualPattern, 'B', 'セーブに visualPattern');
    assert.equal(saved.m.raise.field.patternId, 'W', 'patternId は変えない');
    await shot(pg, `vb1_board_b_${size.join('x')}`);
    await reopen(pg);
    const s2 = await boardState(pg);
    assert.deepEqual([s2.vp, s2.vis, s2.props, s2.node], ['B', 'B', s1.props, s1.node], `再読み込みでも B のまま ${JSON.stringify(s2)}`);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('VB-2：旧い Chapter 1（自動テストの既定）では景色の選択を出さない', { skip: SKIP, timeout: 90000 }, async () => {
  const p = await openPage({ worldCh1: false }); const pg = p.page;
  await H.newGame(pg, 'テスト'); await toPrep(pg);
  assert.equal(await pg.evaluate(() => document.querySelectorAll('.ppvis').length), 0);
  assert.deepEqual(p.errors, []);
});

test('VB-3：visualPattern の無いセーブは A・C を選んだ出発は C（景物が A と違う）', { skip: SKIP, timeout: 150000 }, async () => {
  const p = await openPage({ size: [390, 844] }); const pg = p.page;
  await H.newGame(pg, 'テスト'); await toPrep(pg);
  await pg.click('.ppvis .ppvb[data-v="C"]');
  await H.startRaising(pg); await idle(pg);
  const c = await boardState(pg);
  assert.deepEqual([c.vp, c.vis, c.wvis], ['C', 'C', 'C'], JSON.stringify(c));
  // 旧セーブ＝visualPattern が無い → A（途中の地点・配置はそのまま）
  await pg.evaluate(() => { delete S.m.raise.field.visualPattern; save(); });
  await reopen(pg);
  const a = await boardState(pg);
  assert.deepEqual([a.vp, a.vis, a.wvis, a.node], [undefined, 'A', 'A', c.node], `旧セーブは A ${JSON.stringify(a)}`);
  assert.notEqual(a.sig, c.sig, 'C と A で景物（種類と位置）が違う'); assert.ok(c.sig.includes('rockpillar_rp2') && !a.sig.includes('rockpillar_rp2'), 'C だけ RP2 の岩柱（2026-10-14 A／B／C 高品質化：岩の絵は skin で読み替え）');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
