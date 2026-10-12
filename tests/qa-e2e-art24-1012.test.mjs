// =========================================================
// 2026-10-12 開発23 A：正式画像24枚（能力アップ6・冒険リアクション／共通の出来事2・Chapter 1 の出来事12・野外のバトル背景4）
//  AR-B1（375×667・390×844・430×932）：能力マスに止まる → 挿絵カードの絵＝assets/chapter/stat_art_1012/stat_<能力>.webp（読めている・カードは画面の中）
//  AR-B2：出来事のマス（旧は挿絵なしの shade）→ 挿絵カードの絵＝assets/events/ch1/13_shade.webp
//  AR-B3（story:true）：冒険リアクション → 挿絵カードの絵＝assets/chapter/event_art_1012/reaction.webp
//  AR-B4：野生のバトル（Chapter 1）の背景＝assets/battle/field_1012/ch1_meadow.webp・Chapter 2〜4 の背景の絵も読める
//  QA_E2E=1 のときだけ実行（worldCh1:true）
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
const idle = (pg) => pg.waitForFunction(() => !bBusy && !MMCHD.isLocked() && !document.querySelector('.wb-pop,.chf-enc2,.mmtalk,.chdz'), null, { timeout: 30000 }).then(() => pg.waitForTimeout(300));
async function toBoard(pg) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); save(); board(); });
  await pg.waitForSelector('#wbw #brollbtn'); await idle(pg);
}
/** 止まった地点の結果を出す（その地点のマスを書き換えてから resolve） */
const landOn = (pg, tile) => pg.evaluate((tile) => {
  const f = S.m.raise.field, id = Object.keys(f.tiles).find((x) => f.tiles[x].t === tile.t && f.used[x] == null), r = S.m.raise, c = f.core;
  Object.assign(f.tiles[id], tile); r.node = id; c.node = id; c.trail.push(id); r.turnsUsed = 3; c.turn = 3; r.pend = { roll: 1, left: 0, stage: 'resolve' }; save(); board(); return id;
}, tile);
const card = (pg) => pg.waitForFunction(() => { const i = document.querySelector('#wb-ui .wbcard figure img.bg'); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 15000 })
  .then(() => pg.evaluate(() => { const d = document.querySelector('#wb-ui .wbcard'), i = d.querySelector('figure img.bg'), r = d.getBoundingClientRect(); return { src: i.getAttribute('src'), art: d.querySelector('figure').classList.contains('art'), nw: i.naturalWidth, in: r.left >= -1 && r.right <= innerWidth + 1 && r.top >= -1 && r.bottom <= innerHeight + 1 }; }));

for (const size of [H.SIZES.se, H.SIZES.base, H.SIZES.max]) {
  test(`AR-B1（${size.join('×')}）：能力マス → 能力アップの正式の挿絵`, { skip: SKIP, timeout: 150000 }, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await toBoard(pg);
    for (const k of ['li', 'de']) {
      await landOn(pg, { t: 'stat', k });
      const c = await card(pg);
      assert.equal(c.src, `./assets/chapter/stat_art_1012/stat_${k}.webp`, k); assert.equal(c.art, true); assert.equal(c.nw, 1080); assert.ok(c.in, `${k}：カードは画面の中`);
      await pg.waitForTimeout(700); await pg.screenshot({ path: `/tmp/ar-b1-${size.join('x')}-${k}.png` }).catch(() => {});
      await pg.waitForFunction(() => !document.querySelector('#wb-ui .wbcard'), null, { timeout: 15000 }).catch(() => pg.mouse.click(size[0] / 2, size[1] / 2));
      await idle(pg);
    }
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('AR-B2：出来事のマス（shade）→ 出来事の正式の挿絵 13_shade', { skip: SKIP, timeout: 150000 }, async () => {
  const p = await openPage(); const pg = p.page;
  await toBoard(pg);
  await landOn(pg, { t: 'event', e: 'shade' });
  const c = await card(pg);
  assert.equal(c.src, './assets/events/ch1/13_shade.webp'); assert.equal(c.nw, 1080); assert.ok(c.in);
  await pg.waitForTimeout(700); await pg.screenshot({ path: '/tmp/ar-b2.png' }).catch(() => {});
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('AR-B3（story:true）：冒険リアクション → 共通の正式の挿絵 reaction', { skip: SKIP, timeout: 150000 }, async () => {
  const p = await openPage({ story: true }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { S.npcFlags = { ...(S.npcFlags || {}), story: ['tut_turns_w', 'tut_branch', 'tut_stat', 'tut_event', 'tut_rest', 'tut_treasure', 'tut_wild'] }; const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); S.m.raise.field.storySeen = ['ch1_start']; save(); board(); });
  await pg.waitForSelector('#wbw #brollbtn'); await idle(pg);
  const pts = await pg.evaluate(() => MMRF_DATA.segments.EL01[3]);
  await pg.evaluate((node) => { const r = S.m.raise, c = r.field.core; r.node = node; c.node = node; c.trail.push(node); c.moveLeft = 0; c.back = null; c.exclude = null; r.pend = null; r.turnsUsed = 3; r.fatigue = 40; save(); board(); }, pts[1]);
  await pg.evaluate((id) => { const f = S.m.raise.field; f.used[id] = 0; f.core.turn = 3; f.storySeen.push('w_left'); save(); }, pts[2]); await idle(pg);
  await pg.evaluate(() => { window.__mr = Math.random; Math.random = () => (1 - 0.5) / 6; }); await pg.click('#brollbtn'); await pg.evaluate(() => { Math.random = window.__mr; });
  await pg.evaluate(() => { window.__mr2 = Math.random; Math.random = () => 0.01; });
  const c = await card(pg);
  await pg.evaluate(() => { Math.random = window.__mr2; });
  assert.equal(c.src, './assets/chapter/event_art_1012/reaction.webp'); assert.equal(c.nw, 1080); assert.ok(c.in);
  await pg.waitForTimeout(700); await pg.screenshot({ path: '/tmp/ar-b3.png' }).catch(() => {});
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('AR-B4：野生のバトル（Chapter 1）の背景＝ch1_meadow・Chapter 2〜4 の絵も読める', { skip: SKIP, timeout: 150000 }, async () => {
  const p = await openPage({ stage: true }); const pg = p.page;
  await toBoard(pg);
  await landOn(pg, { t: 'wild', rare: false });
  await pg.waitForSelector('.chbat', { timeout: 20000 }); await pg.click('.chbat .p9btn');
  await pg.waitForSelector('#bt .mma-bg', { timeout: 20000 });
  await pg.waitForFunction(() => { const b = document.querySelector('#bt .mma-bg'); return b && b.complete && b.naturalWidth > 0; }, null, { timeout: 15000 });
  const b = await pg.evaluate(() => ({ src: document.querySelector('#bt .mma-bg').getAttribute('src'), nw: document.querySelector('#bt .mma-bg').naturalWidth }));
  assert.equal(b.src, './assets/battle/field_1012/ch1_meadow.webp'); assert.equal(b.nw, 864);
  await pg.waitForTimeout(2500); await pg.screenshot({ path: '/tmp/ar-b4.png' }).catch(() => {});
  const all = await pg.evaluate(() => Promise.all([1, 2, 3, 4].map((ch) => new Promise((ok) => { const i = new Image(); i.onload = () => ok([MMARENA.fieldSrc(ch), i.naturalWidth, i.naturalHeight]); i.onerror = () => ok([MMARENA.fieldSrc(ch), 0, 0]); i.src = MMARENA.fieldSrc(ch); }))));
  assert.deepEqual(all, [1, 2, 3, 4].map((ch) => [`./assets/battle/field_1012/${['ch1_meadow', 'ch2_coast', 'ch3_sky', 'ch4_volcano'][ch - 1]}.webp`, 864, 1536]));
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
