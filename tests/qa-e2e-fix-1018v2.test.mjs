// =========================================================
// 実ブラウザ：2026-10-18 本編試遊の緊急修正 v2（iPhone 実機の IMG_5928〜5940）
//  FX-B1（最重要・2サイズ）：通常の本編（QA の URL・フラグなし）で Chapter 1 のあとのベースキャンプ → 出発する → Chapter 2 の出発 → 新しい A／B／C の盤
//        （旧い1本道 #chf が出ない）・道路は新素材（R01 の帯）・再読み込みで同じ地点・同じルート
//  FX-B2：旧 Chapter 2 の盤のセーブ＝1ターンも使っていなければ新しい盤の START へ（失う進み具合なし）／1ターンでも使っていれば旧い盤のまま（巻き戻さない）
//  FX-B3：通常の本編で Chapter 2 のあとのベースキャンプ → Chapter 3 の出発 → 新しい空の盤（A／B／C・299地点）
//  FX-B4：建物（目印・門・会場）は半透明にならない（Chapter 1 C のゴーレム像・Chapter 3 の門）
//  FX-B5：金貨・宝箱の報酬演出にモンスターを出さない／挿絵の出来事は連れている子を挿絵の中に出して1回だけ鳴く・会話窓は操作欄より上
//  FX-B6：Chapter からの帰還のフィナは半身（closeup）
//  QA_E2E=1 のときだけ（tests/e2e/harness.mjs）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
let L = null;
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });
const OPEN = [];
const openPage = async (o = {}) => { const p = await L.open({ worldCh1: true, worldCh2: true, worldCh3: true, route2: 'random', route3: 'random', ...o }); OPEN.push(p); return p; };
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close().catch(() => {}); });
const idle = (pg) => pg.waitForFunction(() => !bBusy && !MMDICE3D.isLocked() && !document.querySelector('.wb-pop,.chf-enc2,.mmtalk,.chdz,.wbrelay,.wbtr,.wbcard'), null, { timeout: 60000 }).then(() => pg.waitForTimeout(300));
/** 会話が出ていれば送りながら、盤が操作できる状態になるまで待つ（story:true のフィナの一言が途中で出る） */
const settle = async (pg) => { for (let i = 0; i < 120; i++) { if (await pg.$('.mmtalk:not(.mmtalk-out)')) { await H.finishTalk(pg).catch(async () => { const c = await pg.$('.mmtalk-choice'); if (c) await c.click().catch(() => {}); }); continue; }
  if (await pg.evaluate(() => !bBusy && !MMDICE3D.isLocked() && !document.querySelector('.wb-pop,.chf-enc2,.mmtalk,.chdz,.wbrelay,.wbtr,.wbcard') && MMP8.boardPhase(S.m) === 'roll')) return pg.waitForTimeout(300); await pg.waitForTimeout(250); } throw new Error('settle'); };
/** sel が出るまで、間に出る会話（初めての宝箱などのフィナの一言）を送る */
const until = async (pg, sel) => { for (let i = 0; i < 160; i++) { if (await pg.$(sel)) return true; if (await pg.$('.mmtalk:not(.mmtalk-out)') && !(await pg.$('#wb-ui .wbcard'))) await H.finishTalk(pg).catch(async () => { const c = await pg.$('.mmtalk-choice'); if (c) await c.click().catch(() => {}); }); await pg.waitForTimeout(200); } throw new Error('until ' + sel); };
const roll = async (pg, v) => { await pg.evaluate((v) => { window.__mr = Math.random; Math.random = () => (v - 0.5) / 6; }, v); await pg.click('#brollbtn'); await pg.evaluate(() => { Math.random = window.__mr; }); };
const TILES2 = { A: 298, B: 284, C: 304 };
/** Chapter N の前のベースキャンプ（前の Chapter を終えた個体）→ 画面の「出発する」→ 出発準備の出発ボタン */
async function departVia(pg, ch) {
  await pg.evaluate((ch) => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); for (let i = 0; i < ch; i++) m.prog.rankClr[i] = true; S.m = m; MMP8.canDepart(S, m);
    const log = []; for (let c = 1; c < ch; c++) log.push({ ch: c, reachedGoal: true, turnsUsed: 30 });
    Object.assign(m.raise, { state: 'farm', ch, log, field: null, evSeen: log.map((x) => 'ret' + x.ch) }); save(); hall('t'); }, ch);
  await pg.waitForSelector('.bcgo .fmgo'); await pg.click('.bcgo .fmgo');
  await pg.waitForSelector('#app button[onclick="p7Depart(this)"]'); await pg.click('#app button[onclick="p7Depart(this)"]');
  await pg.waitForSelector('#wbw #brollbtn', { timeout: 60000 });
  for (let i = 0; i < 20 && await pg.$('.mmtalk:not(.mmtalk-out)'); i++) await H.finishTalk(pg);
  await idle(pg);
}

for (const size of [[390, 844], [375, 667]]) {
  test(`FX-B1（${size.join('×')}）：通常の本編で Chapter 2 へ出発 → 新しい A／B／C の盤・新素材の道路・再読み込みで同じ`, { skip: SKIP, timeout: 240000 }, async () => {
    const p = await openPage({ size }); const pg = p.page;
    assert.equal(await pg.evaluate(() => location.search), '', 'QA の URL ではない');
    await H.newGame(pg, 'テスト');
    await departVia(pg, 2);
    const a = await pg.evaluate(() => ({ ch: S.m.raise.ch, world: S.m.raise.field.world, cid: S.m.raise.field.chapterId, route: S.m.raise.field.route, tiles: MMWB.state().world.tiles, nm: document.querySelector('.chh-nm').textContent,
      oldView: !!document.getElementById('chf'), sides: MMP8.diceSides(S.m), lim: S.m.raise.turnLimit, road: (MMWB.world().qaRoad() || {}).mode, qra: MMQRA.loaded().map((x) => x[0]) }));
    assert.deepEqual([a.ch, a.world, a.cid, a.nm, a.oldView, a.sides, a.lim], [2, 1, 2, '潮風の海岸', false, 6, 40]);
    assert.ok(['A', 'B', 'C'].includes(a.route)); assert.equal(a.tiles, TILES2[a.route]);
    assert.equal(a.road, '2', 'Chapter 2 は縁石つきの白い橋帯 R01'); assert.ok(a.qra.includes('ch2_R01_white_bridge_walkstrip'), `新素材が読めている（${a.qra}）`);
    await roll(pg, 3); await idle(pg);
    for (let i = 0; i < 6 && await pg.$('.wbbr .chroute'); i++) { await pg.click('.wbbr .chroute'); await idle(pg); }
    const b = await pg.evaluate(() => { const s = JSON.parse(localStorage.getItem('mr4v6')); return { node: S.m.raise.node, used: S.m.raise.turnsUsed, sv: s.m.raise.field.world, route: s.m.raise.field.route }; });
    assert.deepEqual([b.used, b.sv, b.route], [1, 1, a.route]);
    await pg.reload(); await pg.waitForFunction(() => typeof window.MMP8 === 'object' && typeof S === 'object'); await pg.waitForSelector('.p15start'); await pg.click('.p15start');
    await pg.waitForSelector('#wbw #brollbtn', { timeout: 60000 }); await idle(pg);
    assert.deepEqual(await pg.evaluate(() => [S.m.raise.node, S.m.raise.turnsUsed, S.m.raise.field.route, !!document.getElementById('chf')]), [b.node, 1, a.route, false]);
    assert.equal(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('FX-B2：旧 Chapter 2 の盤＝0ターンなら新しい盤の START へ・1ターン以上なら旧い盤のまま', { skip: SKIP, timeout: 240000 }, async () => {
  const o = await L.open({}); OPEN.push(o); const po = o.page;   // 既定（MM_QA_OLD_CH2）＝旧エンジンで Chapter 2 へ出発したセーブを作る
  await H.newGame(po, 'テスト');
  const mkSave = (turns) => po.evaluate((turns) => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; MMP8.canDepart(S, m); Object.assign(m.raise, { state: 'farm', ch: 2, log: [{ ch: 1, reachedGoal: true, turnsUsed: 30 }], field: null });
    MMP8.depart(S, m, Math.random); m.raise.fatigue = 7; if (turns) { m.raise.turnsUsed = turns; } save(); return JSON.parse(localStorage.getItem('mr4v6')); }, turns);
  for (const [turns, wantNew] of [[0, true], [2, false]]) {
    const save = await mkSave(turns);
    assert.equal(save.m.raise.field.world, undefined); assert.equal(save.m.raise.field.chapterId, 2);
    const p = await openPage({ save }); const pg = p.page;
    await pg.waitForSelector('.p15start'); await pg.click('.p15start');
    if (wantNew) {
      await pg.waitForSelector('#wbw #brollbtn', { timeout: 60000 });
      const s = await pg.evaluate(() => ({ old: MMWD2.oldBoard(S.m), world: S.m.raise.field.world, node: S.m.raise.node, used: S.m.raise.turnsUsed, fat: S.m.raise.fatigue, route: S.m.raise.field.route }));
      assert.deepEqual([s.old, s.world, s.node, s.used, s.fat], [false, 1, 'START', 0, 7], '0ターン＝新しい盤の START（空腹はそのまま）'); assert.ok(['A', 'B', 'C'].includes(s.route));
    } else {
      await pg.waitForSelector('#chf', { timeout: 60000 });
      const s = await pg.evaluate(() => ({ old: MMWD2.oldBoard(S.m), wb: !!document.querySelector('#wbw'), used: S.m.raise.turnsUsed, field: S.m.raise.field.world }));
      assert.deepEqual(s, { old: true, wb: false, used: 2, field: undefined }, '1ターン以上＝旧い盤のまま（巻き戻さない）');
    }
    assert.deepEqual(p.errors, []);
  }
});

test('FX-B3：通常の本編で Chapter 3 へ出発 → 新しい空の盤', { skip: SKIP, timeout: 240000 }, async () => {
  const p = await openPage({}); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await departVia(pg, 3);
  const a = await pg.evaluate(() => ({ ch: S.m.raise.ch, world: S.m.raise.field.world, cid: S.m.raise.field.chapterId, route: S.m.raise.field.route, tiles: MMWB.state().world.tiles, nm: document.querySelector('.chh-nm').textContent, sky: !!document.querySelector('.rfw.sky') }));
  assert.deepEqual([a.ch, a.world, a.cid, a.tiles, a.nm, a.sky], [3, 1, 3, 299, '天空の浮島', true]); assert.ok(['A', 'B', 'C'].includes(a.route));
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('FX-B4：建物（目印・門・会場）は半透明にならない＝Chapter 1 C のゴーレム像・Chapter 3 の門', { skip: SKIP, timeout: 240000 }, async () => {
  for (const [q, ch, node] of [['?ch1trial=C', 1, 'STATUE'], ['?ch3trial=A', 3, 'START']]) {
    const p = await openPage({ query: q }); const pg = p.page;
    await pg.waitForSelector('#wbw #brollbtn', { timeout: 60000 }); await idle(pg);
    if (node !== 'START') { await pg.evaluate((id) => MMQAJ.jump(id), node); await pg.waitForTimeout(2500); }
    const r = await pg.evaluate(() => ({ lm: document.querySelectorAll('.rfw-lm').length, thruLm: [...document.querySelectorAll('.rfw-lm.thru,.rfw-goal.thru')].map((e) => e.src.split('/').pop()), arch: MMWB.world() ? 1 : 0 }));
    assert.ok(r.lm > 0); assert.deepEqual(r.thruLm, [], `${q}：建物は半透明にしない`);
    assert.deepEqual(p.errors, []);
  }
});

test('FX-B5：宝箱・金貨の演出にモンスターなし／挿絵の出来事はモンスター＋1回鳴く・会話窓は操作欄より上', { skip: SKIP, timeout: 240000 }, async () => {
  const p = await openPage({ query: '?ch1trial=A', story: true }); const pg = p.page;
  await pg.waitForSelector('#wbw #brollbtn', { timeout: 60000 });
  await settle(pg);
  const cries = (pg, t0) => pg.evaluate((t0) => MMAUDIO.voiceLog().filter((x) => /^cry_/.test(x.id) && !x.late && x.at >= t0).map((x) => x.result), t0);   // 鳴き声を頼んだ記録（鳴った・待った・間隔で見送った）
  // 宝箱
  assert.ok(await pg.evaluate(() => MMQAJ.before('treasure')), '宝箱の手前へ');
  await settle(pg); await roll(pg, 1);
  await until(pg, '.wbtr');
  const tr = await pg.evaluate(() => ({ mon: !!document.querySelector('.wbtr .wbtr-mon'), card: !!document.querySelector('.wbtr .wbtr-card') }));
  assert.deepEqual(tr, { mon: false, card: true }, '宝箱の報酬演出にモンスターの立ち絵を出さない');
  await settle(pg);
  // 挿絵の出来事（Chapter 1 の出来事は24種とも挿絵つき）
  assert.ok(await pg.evaluate(() => MMQAJ.before('event')), '出来事の手前へ');
  await settle(pg); const t0 = await pg.evaluate(() => Date.now()); await roll(pg, 1);
  await until(pg, '#wb-ui .wbcard figure');
  const fig = await pg.evaluate(() => { const fig = document.querySelector('#wb-ui .wbcard figure'), mon = fig.querySelector('.mon'); return { art: fig.classList.contains('art'), side: fig.classList.contains('side'), mon: !!mon }; });
  assert.equal(fig.art, true); assert.equal(fig.side, true, '挿絵つき＝モンスターは挿絵の右下'); assert.equal(fig.mon, true, '連れている子が挿絵の中に見える');
  await pg.waitForFunction(() => { const m = document.querySelector('#wb-ui .wbcard figure .mon'); return !m || (m.complete && m.naturalWidth > 0); }, null, { timeout: 10000 });
  const ev = await pg.waitForFunction(() => { const st = document.querySelector('.mmtalk:not(.mmtalk-out) .mmtalk-stage'), card = document.querySelector('#wb-ui .wbcard'); if (!card) return { none: true }; if (!st) return false;
    const dock = document.getElementById('chdock'), r = st.getBoundingClientRect(); return { talkB: Math.round(r.bottom), talkT: Math.round(r.top), deckT: Math.round(dock.getBoundingClientRect().top), cardB: Math.round(card.getBoundingClientRect().bottom) }; }, null, { timeout: 8000 }).then((h) => h.jsonValue()).catch(() => ({ none: true }));
  if (!ev.none) { assert.ok(ev.talkB <= ev.deckT + 2, `会話窓は操作欄より上（${JSON.stringify(ev)}）`); assert.ok(ev.cardB <= ev.talkT + 40, `挿絵は会話窓とほぼ重ならない（${JSON.stringify(ev)}）`); }
  await pg.waitForTimeout(900); const c1 = await cries(pg, t0);
  assert.equal(c1.length, 1, `出来事を表示したとき1回だけ鳴く（${c1}）`); assert.ok(['play', 'wait'].includes(c1[0]), `鳴いた（${c1}）`);
  await settle(pg);
  assert.equal((await cries(pg, t0)).length, 1, '会話を送っても遅れて鳴かない（1回のまま）');
  assert.deepEqual(p.errors, []);
});

test('FX-B6：Chapter からの帰還のフィナは半身（closeup）', { skip: SKIP, timeout: 180000 }, async () => {
  const p = await openPage({ npc: true }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; MMP8.canDepart(S, m);
    Object.assign(m.raise, { state: 'farm', ch: 2, log: [{ ch: 1, reachedGoal: true, turnsUsed: 30 }], field: null, evSeen: [] }); save(); farmReturn(m); });
  await pg.waitForSelector('.mmtalk:not(.mmtalk-out) .mmtalk-fig img', { timeout: 30000 });
  await pg.waitForTimeout(400);
  const f = await pg.evaluate(() => [...document.querySelectorAll('.mmtalk:not(.mmtalk-out) .mmtalk-fig img')].map((i) => i.getAttribute('src')).filter(Boolean));
  assert.ok(f.length && f.every((s) => !/fullbody/.test(s)), `全身ではない（${f}）`); assert.ok(f.some((s) => /fina\/closeup\//.test(s)), `フィナの半身（${f}）`);
  assert.deepEqual(p.errors, []);
});
