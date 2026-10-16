// =========================================================
// 実ブラウザ：本編の Chapter 2「潮風の海岸」＝1枚の世界のボード A／B／C（2026-10-16・試遊ブランチ。js/chapter/world-driver-ch2.js・world-board.js・js/proto/ch2-world.js）
//  CWB-1（375×667・390×844・393×852 × A／B／C）：?ch2trial=X → 本編の盤（Chapter 2・ルート X・地点の数）・HUD「潮風の海岸」・版の札・正式美術の絵が読める（404 なし）・
//        START で1回振って進む・モンスターは HUD と操作欄の間・横にはみ出さない・試遊ではセーブ（mr4v6）を書き換えない
//  CWB-2：本物の流れ：Chapter 2 のベースキャンプから出発 → 新しい盤（world・route）→ 1ターン → 再読み込みで同じ地点・同じルート
//  CWB-3：旧 Chapter 2 の途中のセーブ（旧の盤）→ 新しいコードでも旧のボード（field-view の #chf・1〜3）のまま続く
//  QA_E2E=1 のときだけ（tests/e2e/harness.mjs。既定の MM_QA_OLD_CH2 を worldCh2:true で外す）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
let L = null;
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });
const OPEN = [];
const openPage = async (o = {}) => { const p = await L.open({ worldCh2: true, ...o }); OPEN.push(p); return p; };
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close().catch(() => {}); });
const idle = (pg) => pg.waitForFunction(() => !bBusy && !MMDICE3D.isLocked() && !document.querySelector('.wb-pop,.chf-enc2,.mmtalk,.chdz,.wbrelay'), null, { timeout: 60000 }).then(() => pg.waitForTimeout(300));
const COUNT = { A: 298, B: 284, C: 304 };

for (const size of [[375, 667], [390, 844], [393, 852]]) for (const route of ['A', 'B', 'C']) {
  test(`CWB-1（${size.join('×')}・${route}）：?ch2trial の本編の盤・正式美術・1ターン・セーブは変わらない`, { skip: SKIP, timeout: 180000 }, async () => {
    const p = await openPage({ size, query: `?ch2trial=${route}` }); const pg = p.page;
    const before = await pg.evaluate(() => localStorage.getItem('mr4v6'));
    await pg.waitForSelector('#wbw #brollbtn', { timeout: 60000 }); await idle(pg);
    const a = await pg.evaluate(() => ({ ch: S.m.raise.ch, route: S.m.raise.field.route, world: S.m.raise.field.world, tiles: MMWB.state().world.tiles, nm: document.querySelector('.chh-nm').textContent,
      tv: (document.getElementById('ch2tv') || {}).textContent || '', sea: !!document.querySelector('.rfw.sea'), sides: MMP8.diceSides(S.m), lim: S.m.raise.turnLimit }));
    assert.deepEqual([a.ch, a.route, a.world, a.tiles, a.nm, a.sea, a.sides, a.lim], [2, route, 1, COUNT[route], '潮風の海岸', true, 6, 40]);
    assert.match(a.tv, /Ch2 試遊/); assert.match(a.tv, /2026-10-16-ch2art/);
    // 正式美術の絵（art_1016）：画面に置いた絵はすべて読めている
    const imgs = await pg.evaluate(() => [...document.querySelectorAll('.rfw img')].filter((i) => /art_1016/.test(i.src)).map((i) => ({ s: i.src.split('/').pop(), ok: i.complete && i.naturalWidth > 0 })));
    assert.ok(imgs.length > 20, `正式美術の景物・目印（${imgs.length}）`); assert.deepEqual(imgs.filter((x) => !x.ok), [], '読めない絵が無い');
    const n0 = await pg.evaluate(() => S.m.raise.node);
    await pg.evaluate(() => { window.__mr = Math.random; Math.random = () => 0.6; }); await pg.click('#brollbtn'); await pg.evaluate(() => { Math.random = window.__mr; });
    await idle(pg);
    for (let i = 0; i < 6 && await pg.$('.wbbr .chroute'); i++) { await pg.click('.wbbr .chroute'); await idle(pg); }
    const b = await pg.evaluate(() => ({ used: S.m.raise.turnsUsed, node: S.m.raise.node, saved: localStorage.getItem('mr4v6') }));
    assert.equal(b.used, 1); assert.notEqual(b.node, n0); assert.equal(b.saved, before, '試遊ではセーブ（mr4v6）を書き換えない');
    const mon = await pg.evaluate(() => { const r = document.querySelector('.rfw-mon').getBoundingClientRect(), d = document.getElementById('chdock').getBoundingClientRect(), h = document.querySelector('.chh').getBoundingClientRect(); return { b: r.bottom, t: r.top, deck: d.top, hud: h.bottom, l: r.left, r: r.right, W: innerWidth }; });
    assert.ok(mon.b <= mon.deck + 4 && mon.t >= mon.hud - 30 && mon.l >= -4 && mon.r <= mon.W + 4, `モンスターは HUD と操作欄の間（${JSON.stringify(mon)}）`);
    assert.equal(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, '横にはみ出さない');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('CWB-2：本物の流れ＝Chapter 2 のベースキャンプから出発 → 新しい盤 → 1ターン → 再読み込みで同じ', { skip: SKIP, timeout: 180000 }, async () => {
  const p = await openPage({ route2: 'C' }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; MMP8.canDepart(S, m); Object.assign(m.raise, { state: 'farm', ch: 2, log: [{ ch: 1, reachedGoal: true, turnsUsed: 30 }], field: null }); save();
    const r = MMP8.depart(S, m, Math.random); save(); board(); return r; });
  await pg.waitForSelector('#wbw #brollbtn', { timeout: 60000 }); await idle(pg);
  await pg.evaluate(() => { window.__mr = Math.random; Math.random = () => 0.4; }); await pg.click('#brollbtn'); await pg.evaluate(() => { Math.random = window.__mr; }); await idle(pg);
  for (let i = 0; i < 6 && await pg.$('.wbbr .chroute'); i++) { await pg.click('.wbbr .chroute'); await idle(pg); }
  const a = await pg.evaluate(() => { const s = JSON.parse(localStorage.getItem('mr4v6')); return { node: S.m.raise.node, used: S.m.raise.turnsUsed, sv: s.m.raise.field.world, route: s.m.raise.field.route, ch: s.m.raise.ch }; });
  assert.deepEqual([a.sv, a.route, a.ch, a.used], [1, 'C', 2, 1]);
  await pg.reload(); await pg.waitForFunction(() => typeof window.MMP8 === 'object' && typeof S === 'object'); await pg.waitForSelector('.p15start'); await pg.click('.p15start');
  await pg.waitForSelector('#wbw #brollbtn', { timeout: 60000 }); await idle(pg);
  assert.deepEqual(await pg.evaluate(() => [S.m.raise.node, S.m.raise.turnsUsed, S.m.raise.field.route, MMWB.state().world.tiles]), [a.node, 1, 'C', 304]);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('CWB-3：旧 Chapter 2 の途中のセーブ → 旧のボードのまま', { skip: SKIP, timeout: 180000 }, async () => {
  const o = await L.open({}); OPEN.push(o); const po = o.page;   // 既定（MM_QA_OLD_CH2）＝旧エンジンで Chapter 2 へ出発したセーブを作る
  await H.newGame(po, 'テスト');
  const save = await po.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; MMP8.canDepart(S, m); Object.assign(m.raise, { state: 'farm', ch: 2, log: [{ ch: 1, reachedGoal: true, turnsUsed: 30 }], field: null });
    MMP8.depart(S, m, Math.random); save(); return JSON.parse(localStorage.getItem('mr4v6')); });
  assert.equal(save.m.raise.field.world, undefined); assert.equal(save.m.raise.field.chapterId, 2);
  const p = await openPage({ save }); const pg = p.page;   // 新しいコード（Chapter 2 の盤あり）で読み込む
  await pg.waitForSelector('.p15start'); await pg.click('.p15start');
  await pg.waitForSelector('#chf', { timeout: 60000 });
  const s = await pg.evaluate(() => ({ old: MMWD2.oldBoard(S.m), wb: !!document.querySelector('#wbw'), sides: MMP8.diceSides(S.m), field: S.m.raise.field.world }));
  assert.deepEqual(s, { old: true, wb: false, sides: 3, field: undefined });
  assert.deepEqual(p.errors, []);
});
