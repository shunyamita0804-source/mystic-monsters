// =========================================================
// 実ブラウザ：本編の Chapter 1＝1枚の世界のボード（2026-10-11。js/chapter/world-driver.js・world-board.js）
//  WB-1（390×844・375×667）：出発 → 新ボード（HUD Turn 1/40・START）→ START で 1〜6 → 1地点ずつ歩く → ターンは1回・保存は v6 の配置 → 再読み込みで同じ地点
//  WB-2：分かれ道（J0）：シートが出る・モンスターはシートより上・選ぶと進む／宝の行き止まりへの寄り道の名前
//  WB-3：野生のマス → 遭遇 → 本物の fight() → 降参 → 新ボードへ戻る・疲れ +5・バトルの途中状態は残らない
//  WB-4：ゴール → 会場のロビー → フィナの会話（arrival:true）→ 大会受付（p9ReceptionHtml）→ D の大会が始まる（canvas は手放す）
//  WB-5：開始の俯瞰（intro:true）＝操作欄は隠れて押せない → START へ寄ったら押せる・再読み込みでは出ない
//  WB-6：旧い Chapter 1（14枚）の途中のセーブ → 新ボードの最初から（能力・所持金は保つ）
//  QA_E2E=1 のときだけ実行（tests/e2e/harness.mjs。既定の MM_QA_OLD_CH1 を worldCh1:true で外す）
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
async function toBoard(pg, over = {}) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate((o) => { const m = mk(o.sp || 0); m.name = 'ソラ'; Object.assign(m, o.stats || {}); MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); save(); board(); }, over);
  await pg.waitForSelector('#wbw #brollbtn'); await idle(pg);
}
const place = (pg, node, extra = {}) => pg.evaluate(([node, extra]) => { const r = S.m.raise, c = r.field.core; r.node = node; c.node = node; c.trail.push(node); c.moveLeft = 0; c.back = null; c.exclude = null; r.pend = null; Object.assign(r, extra); save(); board(); }, [node, extra]);
async function rollAs(pg, v) { await pg.evaluate((v) => { window.__mr = Math.random; Math.random = () => (v - 0.5) / 6; }, v); await pg.click('#brollbtn'); await pg.evaluate(() => { Math.random = window.__mr; }); }

for (const size of [H.SIZES.base, H.SIZES.se]) {
  test(`WB-1（${size.join('×')}）：出発 → 新ボード → START で 1〜6 → 歩く → ターンは1回 → 再読み込みで同じ地点`, { skip: SKIP, timeout: 120000 }, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await toBoard(pg);
    const a = await pg.evaluate(() => ({ act: MMWB.active(S.m), turn: document.getElementById('chturn').textContent, lim: S.m.raise.turnLimit, sides: MMP8.diceSides(S.m), node: S.m.raise.node, old: !!document.querySelector('#chf'), w: MMWB.state().world }));
    assert.deepEqual([a.act, a.turn, a.lim, a.sides, a.node, a.old], [true, '1', 40, 6, 'START', false]);
    assert.ok(a.w && a.w.tiles === 299, '299地点のマス');
    await rollAs(pg, 4); await idle(pg);
    const b = await pg.evaluate(() => ({ used: S.m.raise.turnsUsed, node: S.m.raise.node, trail: S.m.raise.field.core.trail.length, pend: S.m.raise.pend, saved: JSON.parse(localStorage.getItem('mr4v6')).m.raise }));
    assert.equal(b.used, 1, 'ターンは1回');
    assert.ok(b.trail >= 2 && b.node !== 'START', `進んだ（${b.node}）`);
    assert.equal(b.saved.field.world, 1); assert.equal(b.saved.node, b.node, 'セーブ（mr4v6）に同じ地点');
    const mon = await pg.evaluate(() => { const r = document.querySelector('.rfw-mon').getBoundingClientRect(), d = document.getElementById('chdock').getBoundingClientRect(); return { b: r.bottom, top: r.top, deck: d.top, W: innerWidth, l: r.left, r: r.right }; });
    assert.ok(mon.b <= mon.deck + 4 && mon.top > 60 && mon.l >= 0 && mon.r <= mon.W, `モンスターは HUD と操作欄の間（${JSON.stringify(mon)}）`);
    assert.equal(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, '横にはみ出さない');
    await pg.reload(); await pg.waitForFunction(() => typeof window.MMP8 === 'object' && typeof S === 'object'); await pg.waitForSelector('.p15start'); await pg.click('.p15start');
    await pg.waitForSelector('#wbw #brollbtn'); await idle(pg);
    assert.deepEqual(await pg.evaluate(() => [S.m.raise.node, S.m.raise.turnsUsed]), [b.node, 1], '再読み込みで同じ地点・同じターン');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('WB-2：分かれ道（J0）＝シートより上にモンスター・選ぶと進む／寄り道の名前', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage(); const pg = p.page;
  await toBoard(pg);
  const before = await pg.evaluate(() => { const d = MMRF_DATA, s = d.segments.S01[3]; return s[s.length - 2]; });
  await place(pg, before); await idle(pg);
  await rollAs(pg, 3);
  await pg.waitForSelector('.wbbr .chroute'); await idle(pg);
  const names = await pg.$$eval('.wbbr .chroute b', (bs) => bs.map((b) => b.textContent));
  assert.deepEqual(names.sort(), ['右の道（滝沿いの右岸）', '左の道（崩落の谷の左岸）'].sort());
  await pg.waitForTimeout(900);
  const pos = await pg.evaluate(() => { const r = document.querySelector('.rfw-mon').getBoundingClientRect(), s = document.querySelector('.wbbr').getBoundingClientRect(); return { mon: r.bottom, sheet: s.top }; });
  assert.ok(pos.mon <= pos.sheet + 2, `モンスターはシートより上（${JSON.stringify(pos)}）`);
  await pg.click('.wbbr .chroute:nth-child(2)'); await idle(pg);
  const st = await pg.evaluate(() => ({ node: S.m.raise.node, seg: (MMRF_DATA.nodes[S.m.raise.node] || [])[3], used: S.m.raise.turnsUsed, ph: MMP8.boardPhase(S.m) }));
  assert.equal(st.used, 1); assert.ok(/^(EL|ER)/.test(st.node) || ['roll', 'battle', 'branch'].includes(st.ph), `選んだ道へ進んだ（${st.node}）`);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('WB-3：野生のマス → 遭遇 → 本物の fight() → 降参 → 新ボードへ戻る・疲れ +5', { skip: SKIP, timeout: 150000 }, async () => {
  const p = await openPage({ size: H.SIZES.se }); const pg = p.page;
  await toBoard(pg);
  await pg.evaluate(() => { const f = S.m.raise.field, id = Object.keys(f.tiles).find((x) => f.tiles[x].t === 'wild' && !f.tiles[x].rare), r = S.m.raise, c = f.core; r.node = id; c.node = id; c.trail.push(id); r.turnsUsed = 3; c.turn = 3; r.fatigue = 20; r.pend = { roll: 1, left: 0, stage: 'resolve' }; save(); board(); });
  await pg.waitForSelector('.chbat', { timeout: 20000 });
  assert.match(await pg.textContent('.chbat h3'), /野生のモンスターが現れた/);
  await pg.click('.chbat .p9btn');
  await pg.waitForSelector('#bt #m1 img', { timeout: 15000 });
  await pg.waitForFunction(() => { const g = document.getElementById('go'); return g && !g.disabled; }, null, { timeout: 15000 });
  await pg.click('#sur', { force: true }); await pg.waitForTimeout(300); await pg.click('#sur', { force: true });
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => { const g = document.getElementById('go'); return !!g && g.classList.contains('bk'); })) break;
    if (await pg.evaluate(() => { const g = document.getElementById('go'); return !!g && !g.disabled; })) await pg.click('#go').catch(() => {}); await pg.waitForTimeout(400); }
  await pg.click('#go');
  await pg.waitForFunction(() => !document.getElementById('bt') && !!document.querySelector('#wbw #brollbtn'), null, { timeout: 20000 });
  assert.deepEqual(await pg.evaluate(() => [S.m.raise.battle, S.m.raise.pend, S.m.raise.fatigue, MMP8.boardPhase(S.m)]), [null, null, 25, 'roll'], 'バトルの後は疲れ +5・次のターンへ');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('WB-4：ゴール → ロビー → フィナの会話 → 大会受付 → D の大会が始まる', { skip: SKIP, timeout: 150000 }, async () => {
  const p = await openPage({ arrival: true }); const pg = p.page;
  await toBoard(pg);
  const s2 = await pg.evaluate(() => MMRF_DATA.segments.S_END[3]);
  await place(pg, s2[s2.length - 2], { turnsUsed: 30 }); await idle(pg);
  await rollAs(pg, 2);
  await pg.waitForSelector('.mmtalk', { timeout: 20000 });
  assert.match(await pg.textContent('.mmtalk'), /やっと着いたね|大会会場/);
  await H.finishTalk(pg);
  await pg.waitForSelector('#wbw #chrcv', { timeout: 15000 });
  assert.deepEqual(await pg.evaluate(() => [S.m.raise.node, S.m.raise.goal, S.m.raise.field.arrivalSeen]), ['GOAL', true, true]);
  await pg.reload(); await pg.waitForFunction(() => typeof window.MMP8 === 'object' && typeof S === 'object'); await pg.waitForSelector('.p15start'); await pg.click('.p15start');
  await pg.waitForSelector('#wbw #chrcv', { timeout: 20000 });
  assert.equal(await pg.evaluate(() => !!document.querySelector('.mmtalk')), false, '再読み込みでは会話を出さずに受付から');
  await pg.click('#chrcv [onclick^="p9RcvPick(1,"]'); await pg.waitForTimeout(500);
  await pg.click('#chrcv [onclick^="p9RcvJoin"]');
  await pg.waitForFunction(() => !!S.m.raise.tour, null, { timeout: 20000 });
  await pg.waitForFunction(() => !document.querySelector('#wbw'), null, { timeout: 20000 });
  assert.equal(await pg.evaluate(() => MMWB.state().world), null, '大会では canvas を手放す');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('WB-5：開始の俯瞰＝操作欄は隠れて押せない → 寄ったら押せる・再読み込みでは出ない', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({ intro: true }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); save(); board(); });
  await pg.waitForSelector('#wbw.wb-intro');
  const a = await pg.evaluate(() => ({ dis: document.getElementById('brollbtn').disabled, op: getComputedStyle(document.getElementById('chdock')).opacity, seen: JSON.parse(localStorage.getItem('mr4v6')).m.raise.field.introSeen }));
  assert.deepEqual([a.dis, a.seen], [true, true], '俯瞰の間は押せない・見た記録は先に保存');
  await pg.waitForFunction(() => !document.querySelector('#wbw.wb-intro') && !document.getElementById('brollbtn').disabled, null, { timeout: 15000 });
  await pg.reload(); await pg.waitForFunction(() => typeof window.MMP8 === 'object' && typeof S === 'object'); await pg.waitForSelector('.p15start'); await pg.click('.p15start');
  await pg.waitForSelector('#wbw #brollbtn');
  assert.equal(await pg.evaluate(() => !!document.querySelector('#wbw.wb-intro')), false, '再読み込みでは出ない');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('WB-6：旧い Chapter 1（14枚）の途中のセーブ → 新ボードの最初から（能力・所持金は保つ）', { skip: SKIP, timeout: 120000 }, async () => {
  const old = await L.open({});   // 既定＝旧い Chapter 1（MM_QA_OLD_CH1）
  OPEN.push(old);
  await H.newGame(old.page, 'テスト');
  const sv = await old.page.evaluate(() => { const m = mk(0); m.name = 'ソラ'; m.po = 321; MMP7.ensureProg(m); S.m = m; S.g = 640; MMP8.depart(S, m, () => 0.37); S.m.raise.node = 'p4_1'; S.m.raise.turnsUsed = 9; save(); return JSON.parse(localStorage.getItem('mr4v6')); });
  assert.notEqual(sv.m.raise.field.world, 1);
  const p = await openPage({ save: sv }); const pg = p.page;
  await pg.waitForSelector('.p15start'); await pg.click('.p15start');
  await pg.waitForSelector('#wbw #brollbtn');
  assert.deepEqual(await pg.evaluate(() => [S.m.raise.node, S.m.raise.turnsUsed, S.m.raise.turnLimit, S.m.po, S.g, S.m.raise.field.world]), ['START', 0, 40, 321, 640, 1]);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
