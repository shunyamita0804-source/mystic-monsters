// =========================================================
// 実ブラウザ：本編の Chapter 3「天空の浮島」＝1枚の世界のボード A／B／C（2026-10-18。js/chapter/world-driver-ch3.js・world-board.js・js/proto/roadfirst-world.js の空の世界）
//  C3B-1（375×667・390×844・430×932 × A／B／C）：?ch3trial=X → 本編の盤（Chapter 3・ルート X・299地点）・HUD「天空の浮島」・空の世界（.rfw.sky・雲海の外）・
//        空の素材が読める（404 なし）・START で1回振って進む・モンスターは HUD と操作欄の間・横にはみ出さない・試遊ではセーブ（mr4v6）を書き換えない
//  C3B-2：本物の流れ：Chapter 3 のベースキャンプから出発 → 新しい盤 → 1ターン → 再読み込みで同じ地点・同じルート
//  C3B-3：QA 移動：ライバルの手前 → 1 → ライバルの遭遇・ゴールの手前 → 1 → 大会受付
//  C3B-4：旧 Chapter 3 の途中のセーブ → 旧のボードのまま（新しい盤にしない）
//  QA_E2E=1 のときだけ（tests/e2e/harness.mjs。既定の MM_QA_OLD_CH3 を worldCh3:true で外す）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
let L = null;
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });
const OPEN = [];
const openPage = async (o = {}) => { const p = await L.open({ worldCh1: true, worldCh3: true, ...o }); OPEN.push(p); return p; };
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close().catch(() => {}); });
const idle = (pg) => pg.waitForFunction(() => !bBusy && !MMDICE3D.isLocked() && !document.querySelector('.wb-pop,.chf-enc2,.mmtalk,.chdz,.wbrelay'), null, { timeout: 60000 }).then(() => pg.waitForTimeout(300));
const roll = async (pg, v) => { await pg.evaluate((v) => { window.__mr = Math.random; Math.random = () => (v - 0.5) / 6; }, v); await pg.click('#brollbtn'); await pg.evaluate(() => { Math.random = window.__mr; }); };

for (const size of [[375, 667], [390, 844], [430, 932]]) for (const route of ['A', 'B', 'C']) {
  test(`C3B-1（${size.join('×')}・${route}）：?ch3trial の本編の盤・空の世界・1ターン・セーブは変わらない`, { skip: SKIP, timeout: 180000 }, async () => {
    const p = await openPage({ size, query: `?ch3trial=${route}` }); const pg = p.page;
    const before = await pg.evaluate(() => localStorage.getItem('mr4v6'));
    await pg.waitForSelector('#wbw #brollbtn', { timeout: 60000 }); await idle(pg);
    const a = await pg.evaluate(() => ({ ch: S.m.raise.ch, route: S.m.raise.field.route, world: S.m.raise.field.world, tiles: MMWB.state().world.tiles, nm: document.querySelector('.chh-nm').textContent,
      sky: !!document.querySelector('.rfw.sky'), apron: (document.querySelector('.rfw-apron') || { style: {} }).style.backgroundImage || '', gl: MMWB.world().gl(), sides: MMP8.diceSides(S.m), lim: S.m.raise.turnLimit, qa: !!document.getElementById('qajb') }));
    assert.deepEqual([a.ch, a.route, a.world, a.tiles, a.nm, a.sky, a.sides, a.lim, a.qa], [3, route, 1, 299, '天空の浮島', true, 6, 40, true]);
    if (a.gl) assert.equal(a.gl.tex.cloud, true, '2026-10-20 第4便B：WebGL の盤＝世界の外も雲海（E03 の雲海・範囲の外の重み）'); else assert.match(a.apron, /ground_cloud/, '世界の外も雲海');
    const imgs = await pg.evaluate(() => [...document.querySelectorAll('.rfw img')].filter((i) => /sky_1016/.test(i.src)).map((i) => ({ s: i.src.split('/').pop(), ok: i.complete && i.naturalWidth > 0 })));
    assert.ok(imgs.length > 20, `空の景物・目印（${imgs.length}）`); assert.deepEqual(imgs.filter((x) => !x.ok), [], '読めない絵が無い');
    const n0 = await pg.evaluate(() => S.m.raise.node);
    await roll(pg, 4); await idle(pg);
    for (let i = 0; i < 6 && await pg.$('.wbbr .chroute'); i++) { await pg.click('.wbbr .chroute'); await idle(pg); }
    const b = await pg.evaluate(() => ({ used: S.m.raise.turnsUsed, node: S.m.raise.node, saved: localStorage.getItem('mr4v6') }));
    assert.equal(b.used, 1); assert.notEqual(b.node, n0); assert.equal(b.saved, before, '試遊ではセーブ（mr4v6）を書き換えない');
    const mon = await pg.evaluate(() => { const r = document.querySelector('.rfw-mon').getBoundingClientRect(), d = document.getElementById('chdock').getBoundingClientRect(), h = document.querySelector('.chh').getBoundingClientRect(); return { b: r.bottom, t: r.top, deck: d.top, hud: h.bottom, l: r.left, r: r.right, W: innerWidth }; });
    assert.ok(mon.b <= mon.deck + 4 && mon.t >= mon.hud - 30 && mon.l >= -4 && mon.r <= mon.W + 4, `モンスターは HUD と操作欄の間（${JSON.stringify(mon)}）`);
    assert.equal(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, '横にはみ出さない');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('C3B-2：本物の流れ＝Chapter 3 のベースキャンプから出発 → 新しい盤 → 1ターン → 再読み込みで同じ', { skip: SKIP, timeout: 180000 }, async () => {
  const p = await openPage({ route3: 'C' }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); for (let i = 0; i <= 2; i++) m.prog.rankClr[i] = true; S.m = m; MMP8.canDepart(S, m);
    Object.assign(m.raise, { state: 'farm', ch: 3, log: [{ ch: 1, reachedGoal: true, turnsUsed: 30 }, { ch: 2, reachedGoal: true, turnsUsed: 34 }], field: null }); save();
    const r = MMP8.depart(S, m, Math.random); save(); board(); return r; });
  await pg.waitForSelector('#wbw #brollbtn', { timeout: 60000 }); await idle(pg);
  await roll(pg, 3); await idle(pg);
  for (let i = 0; i < 6 && await pg.$('.wbbr .chroute'); i++) { await pg.click('.wbbr .chroute'); await idle(pg); }
  const a = await pg.evaluate(() => { const s = JSON.parse(localStorage.getItem('mr4v6')); return { node: S.m.raise.node, used: S.m.raise.turnsUsed, sv: s.m.raise.field.world, route: s.m.raise.field.route, ch: s.m.raise.ch, cid: s.m.raise.field.chapterId }; });
  assert.deepEqual([a.sv, a.route, a.ch, a.cid, a.used], [1, 'C', 3, 3, 1]);
  await pg.reload(); await pg.waitForFunction(() => typeof window.MMP8 === 'object' && typeof S === 'object'); await pg.waitForSelector('.p15start'); await pg.click('.p15start');
  await pg.waitForSelector('#wbw #brollbtn', { timeout: 60000 }); await idle(pg);
  assert.deepEqual(await pg.evaluate(() => [S.m.raise.node, S.m.raise.turnsUsed, S.m.raise.field.route, MMWB.state().world.tiles, !!document.querySelector('.rfw.sky')]), [a.node, 1, 'C', 299, true]);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('C3B-3：QA 移動＝ライバルの手前 → ライバルの遭遇・ゴールの手前 → 大会受付', { skip: SKIP, timeout: 240000 }, async () => {
  const p = await openPage({ query: '?ch3trial=B' }); const pg = p.page;
  await pg.waitForSelector('#wbw #brollbtn', { timeout: 60000 }); await idle(pg);
  await pg.click('#qajb'); await pg.waitForSelector('#qaj'); await pg.click('#qaj [data-p="RIVAL"]');
  await pg.waitForFunction(() => S.m.raise.node === MMQAJ.prevOf(MMWD3.dataOf(S.m), 'RIVAL') && MMWB.world() && MMWB.world().isReady(), null, { timeout: 60000 }); await idle(pg);
  await pg.click('#brollbtn');
  await pg.waitForFunction(() => S.m.raise.node === 'RIVAL' && MMP8.boardPhase(S.m) === 'battle', null, { timeout: 60000 });
  assert.equal(await pg.evaluate(() => S.m.raise.pend.fx.battleType), 'rival');
  // バトルは始めずに、ゴールの手前へ（QA の移動は途中の状態を片付ける）
  await pg.waitForTimeout(800);
  await pg.evaluate(() => { document.querySelectorAll('#bt,#tvs,#cmp,.wbx').forEach((e) => e.remove()); bBusy = false; MMQAJ.jump(MMQAJ.prevOf(MMWD3.dataOf(S.m), 'GOAL'), 1); });
  await pg.waitForFunction(() => MMWB.world() && MMWB.world().isReady() && !bBusy, null, { timeout: 60000 }); await idle(pg);
  await pg.click('#brollbtn');
  await pg.waitForSelector('.rcv,.p9rcv,#chrcv,.rcvw', { timeout: 60000 });
  assert.equal(await pg.evaluate(() => [S.m.raise.node, MMP8.boardPhase(S.m)].join(':')), 'GOAL:goal');
  assert.deepEqual(p.bad, []);
});

test('C3B-4：旧 Chapter 3 の途中のセーブ → 旧のボードのまま', { skip: SKIP, timeout: 180000 }, async () => {
  const o = await L.open({}); OPEN.push(o); const po = o.page;   // 既定（MM_QA_OLD_CH3）＝旧ボードで Chapter 3 へ出発したセーブを作る
  await H.newGame(po, 'テスト');
  const save = await po.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); for (let i = 0; i <= 2; i++) m.prog.rankClr[i] = true; S.m = m; MMP8.canDepart(S, m);
    Object.assign(m.raise, { state: 'farm', ch: 3, log: [{ ch: 1, reachedGoal: true, turnsUsed: 30 }, { ch: 2, reachedGoal: true, turnsUsed: 34 }], field: null });
    MMP8.depart(S, m, Math.random); save(); return JSON.parse(localStorage.getItem('mr4v6')); });
  assert.equal(save.m.raise.ch, 3); assert.ok(!save.m.raise.field);
  const p = await openPage({ save }); const pg = p.page;
  await pg.waitForSelector('.p15start'); await pg.click('.p15start');
  await pg.waitForTimeout(2500);
  const s = await pg.evaluate(() => ({ old: MMWD3.oldBoard(S.m), wb: !!document.querySelector('#wbw'), sides: MMP8.diceSides(S.m) }));
  assert.deepEqual(s, { old: true, wb: false, sides: 3 });
  assert.deepEqual(p.errors, []);
});
