// =========================================================
// 2026-10-12 開発21 ③（実ブラウザ・本編の Chapter 1＝worldCh1:true）：出発 → 中継カット → 描き終わった盤の全景 → START へ寄る
//  CR-1（375×667・390×844・430×932）：出発の直後は「はじまりの草原」の全景（ch1_intro_overview.webp）の中継カットが盤を覆う。
//         盤の絵がそろう前（world.state().painted が false の間）に盤が見えたフレームは0・覆っている間は START を押せない・
//         描き終わったら中継カットが消えて実際の盤の全景（.rfw.intro）→ START へ寄る → 操作できる・新しいカメラ（先の地点・1.2倍）は従来どおり
//  CR-2：盤の絵が読めない（404）でも永久に待たない＝仮の色で描いて進む
//  CR-3：絵がとても遅いと「もう一度読み込む」「タイトルへ戻る」が出る → もう一度読み込む → 盤へ（出発は1回だけ・セーブは壊れない）
//  CR-4：Chapter の途中から再開＝暗い幕と「読み込み中…」だけ（全景の演出はくり返さない）→ 盤
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
const idle = (pg) => pg.waitForFunction(() => !bBusy && !MMCHD.isLocked() && !document.querySelector('.wbrelay,.wb-pop,.chf-enc2,.mmtalk,.chdz') && !MMWB.state().intro, null, { timeout: 40000 });
/** rAF ごとに「描き終わる前の盤が見えた」フレーム・覆いのある間に START が押せたフレームを数える */
const watch = (pg) => pg.evaluate(() => { window.__w = { bad: 0, frames: 0, cover: 0, startOn: 0, art: 0 }; const f = () => { const w = window.__w; w.frames++;
  const c = document.querySelector('.wbrelay:not(.out)'), st = window.MMWB && MMWB.state().world, painted = st && st.painted;
  if (c) { w.cover++; if (c.classList.contains('art')) w.art++; const b = document.getElementById('brollbtn'); if (b && !b.disabled) w.startOn++; }
  else if (document.querySelector('#wbw .rfw') && st && !painted) w.bad++;
  if (w.frames < 3000) requestAnimationFrame(f); }; requestAnimationFrame(f); });
const depart = (pg) => pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMRF_WORLD.warmArt(); MMP8.depart(S, m, () => 0.37); save(); board(); });

for (const size of [[375, 667], [390, 844], [430, 932]]) {
  test(`CR-1（${size.join('×')}）：出発 → 中継カット → 描き終わった盤の全景 → START へ寄る（描きかけの盤は見せない）`, { skip: SKIP, timeout: 120000 }, async () => {
    const p = await openPage({ size, intro: true }); const pg = p.page;
    await H.newGame(pg, 'テスト');
    await watch(pg); await depart(pg);
    const c0 = await pg.evaluate(() => { const c = document.querySelector('.wbrelay'); const i = c && c.querySelector('.wbr-img'); return { on: !!c, art: !!(c && c.classList.contains('art')), src: i && i.getAttribute('src'), load: !!(c && c.querySelector('.wbr-load')) }; });
    assert.deepEqual(c0, { on: true, art: true, src: './assets/fields/ch1a/intro/ch1_intro_overview.webp', load: true }, '出発の直後は既存の全景の中継カット＋読み込み中');
    await shot(pg, `cr1_relay_${size.join('x')}`);
    await pg.waitForSelector('.wbv .rfw.intro', { timeout: 20000 });
    await pg.waitForTimeout(300); await shot(pg, `cr1_overview_${size.join('x')}`);
    await idle(pg); await pg.waitForTimeout(400);
    const w = await pg.evaluate(() => window.__w);
    assert.equal(w.bad, 0, `描き終わる前の盤が見えたフレーム ${JSON.stringify(w)}`); assert.equal(w.startOn, 0, '覆っている間は START を押せない'); assert.ok(w.art > 5);
    const st = await pg.evaluate(() => ({ painted: MMWB.state().world.painted, cover: !!document.querySelector('.wbrelay'), start: !document.getElementById('brollbtn').disabled, seen: S.m.raise.field.introSeen, s: MMWB.state().world.cam.s, ahead: MMWB.state().world.ahead.length }));
    assert.deepEqual([st.painted, st.cover, st.start, st.seen], [true, false, true, true], JSON.stringify(st));
    assert.ok(st.s >= 2.2 && st.s <= 5.6 && st.ahead >= 4, `新しいカメラのまま ${JSON.stringify(st)}`);
    await shot(pg, `cr1_start_${size.join('x')}`);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('CR-2：盤の絵が読めない（404）でも永久に待たない（仮の色で描いて進む）', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({ intro: true }); const pg = p.page;
  await pg.route('**/assets/{proto/board_art_1010,fields/ch1a/board_hq_1014}/**', (r) => r.fulfill({ status: 404, body: '' }));   // 2026-10-14：新しい絵（skin）も従来の絵も読めない
  await H.newGame(pg, 'テスト'); await depart(pg);
  await pg.waitForSelector('.wbv .rfw.intro', { timeout: 20000 }); await idle(pg);
  assert.equal(await pg.evaluate(() => MMWB.state().world.painted), true);
  assert.deepEqual(p.errors, []);
});

test('CR-3：絵がとても遅い → 「もう一度読み込む」「タイトルへ戻る」→ もう一度読み込む → 盤（出発は1回・セーブはそのまま）', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({ intro: true }); const pg = p.page;
  let hold = true; await pg.route('**/assets/{proto/board_art_1010/ground_grass,fields/ch1a/board_hq_1014/ground_a1}.webp', async (r) => { while (hold) await new Promise((ok) => setTimeout(ok, 200)); await r.continue(); });
  await H.newGame(pg, 'テスト'); await depart(pg);
  await pg.waitForSelector('.wbrelay.slow .wbr-err', { timeout: 15000 });
  const b = await pg.evaluate(() => [...document.querySelectorAll('.wbrelay .wbr-err button')].map((x) => x.textContent));
  assert.deepEqual(b, ['もう一度読み込む', 'タイトルへ戻る']);
  const before = await H.storedSave(pg);
  hold = false; await pg.click('.wbrelay .wbr-err button[data-act="retry"]');
  await idle(pg);
  const after = await H.storedSave(pg);
  assert.deepEqual([after.m.raise.ch, after.m.raise.turnsUsed, after.m.raise.node], [before.m.raise.ch, before.m.raise.turnsUsed, before.m.raise.node], '出発は1回・進行は同じ');
  assert.equal(await pg.evaluate(() => MMWB.state().world.painted), true);
  assert.deepEqual(p.errors, []);
});

test('CR-4：Chapter の途中から再開＝暗い幕と「読み込み中…」だけ → 盤（全景の演出はくり返さない）', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({ intro: true }); const pg = p.page;
  await H.newGame(pg, 'テスト'); await depart(pg); await idle(pg);
  await pg.reload(); await pg.waitForFunction(() => typeof window.MMWB === 'object');
  await watch(pg); await pg.evaluate(() => board());
  const c = await pg.evaluate(() => { const e = document.querySelector('.wbrelay'); return e ? { art: e.classList.contains('art'), load: !!e.querySelector('.wbr-load') } : null; });
  assert.deepEqual(c, { art: false, load: true });
  await idle(pg);
  const w = await pg.evaluate(() => window.__w); assert.equal(w.bad, 0, JSON.stringify(w));
  assert.equal(await pg.$('.wbv .rfw.intro'), null, '全景の演出はくり返さない');
  assert.deepEqual(p.errors, []);
});
