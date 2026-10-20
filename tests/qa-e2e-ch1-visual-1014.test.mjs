// =========================================================
// 2026-10-14 Chapter 1「はじまりの草原」A／B／C（実ブラウザ・本編の Chapter 1＝worldCh1:true）。2026-10-14 後半：B／C は独立ルート・選択ボタンは撤去
//  VB-1（375×667・390×844・430×932）：出発準備に景色の選択ボタンが無い・「出発する」の位置は従来どおり → B に固定して実際の出発
//         → route／visualPattern＝'B'・盤の data-visual＝'B'・B の目印（b_*.webp）が読める・B の道（接続の地点）→ 再読み込みでも同じルート・同じ地点・404 なし
//  VB-2：本番の抽選（route:'random'）で出発 → A／B／C のどれか・景観＝ルート・再読み込みで変わらない。旧い Chapter 1 では何も出さない
//  VB-3：route の無い旧セーブ（景観 C で A の道を進んでいた個体）は A の道のまま C の景観で描く・C のルートは C の目印
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
const routeState = (pg) => pg.evaluate(() => { const f = S.m.raise.field; return { route: f.route, vp: f.visualPattern, node: f.core.node, inA: !!MMRF_DATA.nodes[f.core.node],
  vis: document.querySelector('#wbw .rfw') && document.querySelector('#wbw .rfw').dataset.visual, lm: [...document.querySelectorAll('#wbw img.rfw-lm')].map((i) => (i.getAttribute('src') || '').split('/').pop()).sort(),
  lmOk: [...document.querySelectorAll('#wbw img.rfw-lm')].every((i) => i.complete && i.naturalWidth > 0) }; });

for (const size of [[375, 667], [390, 844], [430, 932]]) {
  test(`VB-1（${size.join('×')}）：選択ボタンなし → B に固定して出発 → 保存・盤・目印・再読み込み`, { skip: SKIP, timeout: 150000 }, async () => {
    const p = await openPage({ size, route: 'B' }); const pg = p.page;
    await H.newGame(pg, 'テスト'); await toPrep(pg);
    const a = await pg.evaluate(() => { const g = document.querySelector('.pp .ppgobtn'), pp = document.querySelector('.pp');
      return { n: document.querySelectorAll('.ppvis,.ppvb').length, gap: pp.getBoundingClientRect().bottom - g.getBoundingClientRect().bottom, goBottom: g.getBoundingClientRect().bottom, H: innerHeight }; });
    assert.equal(a.n, 0, '景色の選択ボタンは無い');
    assert.ok(a.gap >= (size[1] <= 700 ? 24 : 34) && a.goBottom <= a.H, `「出発する」の位置は従来どおり ${JSON.stringify(a)}`);
    await shot(pg, `vb1_prep_${size.join('x')}`);
    await H.startRaising(pg); await idle(pg);
    const s1 = await routeState(pg);
    assert.deepEqual([s1.route, s1.vp, s1.vis], ['B', 'B', 'B'], JSON.stringify(s1));
    assert.ok(s1.lm.length >= 8 && s1.lm.every((f) => /^b_|^ch1_great_tree_temple\./.test(f)) && s1.lmOk, `B の目印 ${JSON.stringify(s1.lm)}`);
    const saved = await H.storedSave(pg);
    assert.deepEqual([saved.m.raise.field.route, saved.m.raise.field.patternId], ['B', 'W']);
    await shot(pg, `vb1_board_b_${size.join('x')}`);
    await reopen(pg);
    const s2 = await routeState(pg);
    assert.deepEqual([s2.route, s2.vis, s2.node], ['B', 'B', s1.node], `再読み込みでも B のまま ${JSON.stringify(s2)}`);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('VB-2：本番の抽選で出発 → A／B／C のどれか・景観＝ルート・再読み込みで変わらない／旧い Chapter 1 では何も出さない', { skip: SKIP, timeout: 150000 }, async () => {
  const p = await openPage({ size: [390, 844], route: 'random' }); const pg = p.page;
  await H.newGame(pg, 'テスト'); await toPrep(pg);
  assert.equal(await pg.evaluate(() => window.MM_CH1ROUTE || null), null);
  await H.startRaising(pg); await idle(pg);
  const s1 = await routeState(pg);
  assert.ok(['A', 'B', 'C'].includes(s1.route) && s1.vp === s1.route && s1.vis === s1.route, JSON.stringify(s1));
  await reopen(pg); const s2 = await routeState(pg);
  assert.deepEqual([s2.route, s2.node], [s1.route, s1.node], '再開で決め直さない');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  const q = await openPage({ worldCh1: false }); await H.newGame(q.page, 'テスト'); await toPrep(q.page);
  assert.equal(await q.page.evaluate(() => document.querySelectorAll('.ppvis').length), 0);
  assert.deepEqual(q.errors, []);
});

test('VB-3：route の無い旧セーブは A の道のまま（景観 C）・C のルートは C の目印', { skip: SKIP, timeout: 150000 }, async () => {
  const p = await openPage({ size: [390, 844], route: 'C' }); const pg = p.page;
  await H.newGame(pg, 'テスト'); await toPrep(pg);
  await H.startRaising(pg); await idle(pg);
  const c = await routeState(pg);
  assert.deepEqual([c.route, c.vp, c.vis], ['C', 'C', 'C'], JSON.stringify(c)); assert.ok(c.lm.every((f) => /^c_|^ch1_great_tree_temple\./.test(f)) && c.lmOk, JSON.stringify(c.lm));
  // 旧セーブ：A の道を進んでいた景観 C の個体（route なし）
  await pg.evaluate(() => { const f = MMWD.newField(undefined, 4242, 'A'); delete f.route; f.visualPattern = 'C'; f.introSeen = true; S.m.raise.field = f; S.m.raise.node = 'START'; save(); });
  await reopen(pg);
  const a = await routeState(pg);
  assert.deepEqual([a.route, a.vp, a.vis, a.inA], [undefined, 'C', 'C', true], `旧セーブは A の道・C の景観 ${JSON.stringify(a)}`);
  assert.ok(!a.lm.some((f) => /^[bc]_/.test(f)), 'A の道の目印は A の絵');
  assert.equal(await pg.evaluate(() => MMWD.routeOf(S.m)), 'A');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
