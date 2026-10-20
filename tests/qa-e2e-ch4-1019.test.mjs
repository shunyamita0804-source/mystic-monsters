// =========================================================
// 実ブラウザ：本編の Chapter 4「灼熱の火山」＝1枚の世界のボード A／B／C（2026-10-19。js/chapter/world-driver-ch4.js・world-board.js・js/proto/ch4-world.js の火山の世界）
//  C4B-1（375×667・390×844・430×932 × A／B／C）：?ch4trial=X → 本編の盤（Chapter 4・ルート X・320／301／292地点（2026-10-20 第5便：C の寄り道 D_LLA を 7→5 歩））・HUD「灼熱の火山」・火山の世界（.rfw.volc）・
//        正式素材が読める（404 なし）・START で1回振って進む・モンスターは HUD と操作欄の間・横にはみ出さない・試遊ではセーブ（mr4v6）を書き換えない
//  C4B-2：本物の流れ：Chapter 4 のベースキャンプから出発 → 新しい盤 → 1ターン → 再読み込みで同じ地点・同じルート
//  C4B-3：QA 移動：ライバルの手前 → 1 → ライバルの遭遇・ゴールの手前 → 1 → 大会受付
//  C4B-4：旧 Chapter 4（20ターン）の途中のセーブ → 旧のボードのまま（新しい盤にしない・消さない）
//  QA_E2E=1 のときだけ（tests/e2e/harness.mjs。既定の MM_QA_OLD_CH4 を worldCh4:true で外す）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
let L = null;
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });
const OPEN = [];
const openPage = async (o = {}) => { const p = await L.open({ worldCh1: true, worldCh3: true, worldCh4: true, ...o }); OPEN.push(p); return p; };
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close().catch(() => {}); });
const idle = (pg) => pg.waitForFunction(() => !bBusy && !MMDICE3D.isLocked() && !document.querySelector('.wb-pop,.chf-enc2,.mmtalk,.chdz,.wbrelay'), null, { timeout: 60000 }).then(() => pg.waitForTimeout(300));
const roll = async (pg, v) => { await pg.evaluate((v) => { window.__mr = Math.random; Math.random = () => (v - 0.5) / 6; }, v); await pg.click('#brollbtn'); await pg.evaluate(() => { Math.random = window.__mr; }); };

for (const size of [[375, 667], [390, 844], [430, 932]]) for (const route of ['A', 'B', 'C']) {
  test(`C4B-1（${size.join('×')}・${route}）：?ch4trial の本編の盤・火山の世界・1ターン・セーブは変わらない`, { skip: SKIP, timeout: 180000 }, async () => {
    const p = await openPage({ size, query: `?ch4trial=${route}` }); const pg = p.page;
    const before = await pg.evaluate(() => localStorage.getItem('mr4v6'));
    await pg.waitForSelector('#wbw #brollbtn', { timeout: 60000 }); await idle(pg);
    const a = await pg.evaluate(() => ({ ch: S.m.raise.ch, route: S.m.raise.field.route, world: S.m.raise.field.world, tiles: MMWB.state().world.tiles, nm: document.querySelector('.chh-nm').textContent,
      sky: !!document.querySelector('.rfw.volc'), apron: (document.querySelector('.rfw-apron') || { style: {} }).style.backgroundImage || '', gl: MMWB.world().gl(), sides: MMP8.diceSides(S.m), lim: S.m.raise.turnLimit, qa: !!document.getElementById('qajb') }));
    assert.deepEqual([a.ch, a.route, a.world, a.tiles, a.nm, a.sky, a.sides, a.lim, a.qa], [4, route, 1, ({ A: 320, B: 301, C: 292 })[route], '灼熱の火山', true, 6, 40, true]);
    if (a.gl) assert.equal(a.gl.tex.ground, true, '2026-10-20 第4便B：WebGL の盤＝世界の外も火山の地面（E03）'); else assert.match(a.apron, /ground_basalt/, '世界の外も火山の地面');
    const imgs = await pg.evaluate(() => [...document.querySelectorAll('.rfw img')].filter((i) => /ch4\/art_1019/.test(i.src)).map((i) => ({ s: i.src.split('/').pop(), ok: i.complete && i.naturalWidth > 0 })));
    assert.ok(imgs.length > 15, `火山の景物（${imgs.length}）`); assert.deepEqual(imgs.filter((x) => !x.ok), [], '読めない絵が無い');
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

test('C4B-2：本物の流れ＝Chapter 4 のベースキャンプから出発 → 新しい盤 → 1ターン → 再読み込みで同じ', { skip: SKIP, timeout: 180000 }, async () => {
  const p = await openPage({ route4: 'C' }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); for (let i = 0; i <= 3; i++) m.prog.rankClr[i] = true; S.m = m; MMP8.canDepart(S, m);
    Object.assign(m.raise, { state: 'farm', ch: 4, log: [{ ch: 1, reachedGoal: true, turnsUsed: 30 }, { ch: 2, reachedGoal: true, turnsUsed: 34 }, { ch: 3, reachedGoal: true, turnsUsed: 33 }], field: null }); save();
    const r = MMP8.depart(S, m, Math.random); save(); board(); return r; });
  await pg.waitForSelector('#wbw #brollbtn', { timeout: 60000 }); await idle(pg);
  await roll(pg, 3); await idle(pg);
  for (let i = 0; i < 6 && await pg.$('.wbbr .chroute'); i++) { await pg.click('.wbbr .chroute'); await idle(pg); }
  const a = await pg.evaluate(() => { const s = JSON.parse(localStorage.getItem('mr4v6')); return { node: S.m.raise.node, used: S.m.raise.turnsUsed, sv: s.m.raise.field.world, route: s.m.raise.field.route, ch: s.m.raise.ch, cid: s.m.raise.field.chapterId }; });
  assert.deepEqual([a.sv, a.route, a.ch, a.cid, a.used], [1, 'C', 4, 4, 1]);
  await pg.reload(); await pg.waitForFunction(() => typeof window.MMP8 === 'object' && typeof S === 'object'); await pg.waitForSelector('.p15start'); await pg.click('.p15start');
  await pg.waitForSelector('#wbw #brollbtn', { timeout: 60000 }); await idle(pg);
  assert.deepEqual(await pg.evaluate(() => [S.m.raise.node, S.m.raise.turnsUsed, S.m.raise.field.route, MMWB.state().world.tiles, !!document.querySelector('.rfw.volc')]), [a.node, 1, 'C', 292, true]);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('C4B-3：QA 移動＝ライバルの手前 → ライバルの遭遇・ゴールの手前 → 大会受付', { skip: SKIP, timeout: 240000 }, async () => {
  const p = await openPage({ query: '?ch4trial=B' }); const pg = p.page;
  await pg.waitForSelector('#wbw #brollbtn', { timeout: 60000 }); await idle(pg);
  await pg.click('#qajb'); await pg.waitForSelector('#qaj'); await pg.click('#qaj [data-p="RIVAL"]');
  await pg.waitForFunction(() => S.m.raise.node === MMQAJ.prevOf(MMWD4.dataOf(S.m), 'RIVAL') && MMWB.world() && MMWB.world().isReady(), null, { timeout: 60000 }); await idle(pg);
  await pg.click('#brollbtn');
  await pg.waitForFunction(() => S.m.raise.node === 'RIVAL' && MMP8.boardPhase(S.m) === 'battle', null, { timeout: 60000 });
  assert.equal(await pg.evaluate(() => S.m.raise.pend.fx.battleType), 'rival');
  // バトルは始めずに、ゴールの手前へ（QA の移動は途中の状態を片付ける）
  await pg.waitForTimeout(800);
  await pg.evaluate(() => { document.querySelectorAll('#bt,#tvs,#cmp,.wbx').forEach((e) => e.remove()); bBusy = false; MMQAJ.jump(MMQAJ.prevOf(MMWD4.dataOf(S.m), 'GOAL'), 1); });
  await pg.waitForFunction(() => MMWB.world() && MMWB.world().isReady() && !bBusy, null, { timeout: 60000 }); await idle(pg);
  await pg.click('#brollbtn');
  await pg.waitForSelector('.rcv,.p9rcv,#chrcv,.rcvw', { timeout: 60000 });
  assert.equal(await pg.evaluate(() => [S.m.raise.node, MMP8.boardPhase(S.m)].join(':')), 'GOAL:goal');
  assert.deepEqual(p.bad, []);
});

test('C4B-4：旧 Chapter 4 の途中のセーブ → 旧のボードのまま', { skip: SKIP, timeout: 180000 }, async () => {
  const o = await L.open({}); OPEN.push(o); const po = o.page;   // 既定（MM_QA_OLD_CH4）＝旧ボードで Chapter 4 へ出発したセーブを作る
  await H.newGame(po, 'テスト');
  const save = await po.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); for (let i = 0; i <= 3; i++) m.prog.rankClr[i] = true; S.m = m; MMP8.canDepart(S, m);
    Object.assign(m.raise, { state: 'farm', ch: 4, log: [{ ch: 1, reachedGoal: true, turnsUsed: 30 }, { ch: 2, reachedGoal: true, turnsUsed: 34 }, { ch: 3, reachedGoal: true, turnsUsed: 33 }], field: null });
    MMP8.depart(S, m, Math.random); save(); return JSON.parse(localStorage.getItem('mr4v6')); });
  assert.equal(save.m.raise.ch, 4); assert.ok(!save.m.raise.field); assert.equal(save.m.raise.turnLimit, 20);
  const p = await openPage({ save }); const pg = p.page;
  await pg.waitForSelector('.p15start'); await pg.click('.p15start');
  await pg.waitForTimeout(2500);
  const s = await pg.evaluate(() => ({ old: MMWD4.oldBoard(S.m), wb: !!document.querySelector('#wbw'), sides: MMP8.diceSides(S.m) }));
  assert.deepEqual(s, { old: true, wb: false, sides: 3 });
  assert.deepEqual(p.errors, []);
});

test('C4B-5：通信の失敗＝Chapter 4 の正式素材がすべて読めなくても盤は動く（仮の塗り・エラーなし）・1ターン進む', { skip: SKIP, timeout: 180000 }, async () => {
  const p = await openPage({ query: '?ch4trial=B' }); const pg = p.page;
  await pg.route('**/assets/fields/ch4/**', (r) => r.fulfill({ status: 404, body: '' }));
  await pg.reload(); await pg.waitForSelector('#wbw #brollbtn', { timeout: 90000 }); await idle(pg);
  assert.equal(await pg.evaluate(() => [S.m.raise.ch, MMWB.state().world.tiles, !!document.querySelector('.rfw.volc')].join(':')), '4:301:true');
  await roll(pg, 3); await idle(pg);
  for (let i = 0; i < 6 && await pg.$('.wbbr .chroute'); i++) { await pg.click('.wbbr .chroute'); await idle(pg); }
  assert.equal(await pg.evaluate(() => S.m.raise.turnsUsed), 1);
  assert.deepEqual(p.errors, [], 'スクリプトのエラーなし（404 は素材だけ）');
  assert.ok(p.bad.every((b) => /assets\/fields\/ch4\//.test(b)), `404 は Chapter 4 の素材だけ ${JSON.stringify(p.bad.slice(0, 4))}`);
});
