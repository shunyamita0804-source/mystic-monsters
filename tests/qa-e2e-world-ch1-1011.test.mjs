// =========================================================
// 実ブラウザ：本編の Chapter 1＝1枚の世界のボード（2026-10-11。js/chapter/world-driver.js・world-board.js）
//  WB-1（390×844・375×667）：出発 → 新ボード（HUD Turn 1/40・START）→ START で 1〜6 → 1地点ずつ歩く → ターンは1回・保存は v6 の配置 → 再読み込みで同じ地点
//  WB-2：分かれ道（J0）：シートが出る・モンスターはシートより上・選ぶと進む／宝の行き止まりへの寄り道の名前
//  WB-3：野生のマス → 遭遇 → 本物の fight() → 降参 → 新ボードへ戻る・疲れ +5・バトルの途中状態は残らない
//  WB-4：ゴール → 会場のロビー → フィナの会話（arrival:true）→ 大会受付（p9ReceptionHtml）→ D の大会が始まる（canvas は手放す）
//  WB-5：開始の俯瞰（intro:true）＝操作欄は隠れて押せない → START へ寄ったら押せる・再読み込みでは出ない
//  WB-6：旧い Chapter 1（14枚）の途中のセーブ → 新ボードの最初から（能力・所持金は保つ）
//  WB-7（2026-10-11 次の作業・story:true）：出発のチュートリアル（40ターン・1〜6）→ 分かれ道のチュートリアル → 歩行アニメ（奥へ進む間だけ歩行の絵）→
//        能力マス＝特訓の道具と動き → 能力マスのチュートリアル・見た記録は S.npcFlags.story（再読み込みで出ない）
//  WB-8（story:true）：通常の地点（使ったマス）に止まる → 冒険リアクション（しぐさ → フィナの選択肢 → 小さな結果）・記録は配置の中（rx）
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
/** 会話が開いていれば最後まで（選択肢が出たら最初の候補を選ぶ）。出来事の2択・冒険リアクションは止まった地点しだいで出る */
async function drain(pg) {
  for (let i = 0; i < 8; i++) {
    const s = await pg.evaluate(() => (document.querySelector('.mmtalk:not(.mmtalk-out)') && window.MMNPC ? MMNPC.state() : null));
    if (!s) return;
    if (s.choices && s.choices.length) await H.chooseTalk(pg, s.choices[0].id); else await H.finishTalk(pg).catch(async (e) => { if (!/選択肢/.test(e.message)) throw e; });
    await pg.waitForTimeout(400);
  }
}
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
    if (await pg.evaluate(() => { const g = document.getElementById('go'); return !!g && !g.disabled; })) await pg.click('#go').catch(() => {}); await pg.waitForTimeout(400);
    if (await pg.evaluate(() => !document.getElementById('bt'))) break; }   // 降参のあとの「もどる」を先に押していれば、もう盤に戻っている
  if (await pg.evaluate(() => !!document.getElementById('go'))) await pg.click('#go');
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

test('WB-7：チュートリアル（40ターン・1〜6）→ 分かれ道 → 歩行アニメ → 能力マスの特訓の動き → 見た記録', { skip: SKIP, timeout: 180000 }, async () => {
  const p = await openPage({ story: true }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); save(); board(); });
  await pg.waitForSelector('.mmtalk:not(.mmtalk-out)', { timeout: 15000 });
  const t1 = await pg.evaluate(() => MMNPC.state());
  await H.finishTalk(pg);
  const seen1 = await pg.evaluate(() => (S.npcFlags.story || []).slice());
  assert.ok(seen1.includes('tut_turns_w'), `出発のチュートリアルを見た（${seen1}）`);
  assert.ok(await pg.evaluate(() => !document.getElementById('brollbtn').disabled), '会話のあとは START が押せる');
  assert.ok(t1, '会話が出た');
  // 歩行アニメ：歩いている間に .wk-on（奥へ）か .bob（手前へ）が付き、止まると外れる
  await pg.evaluate(() => { window.__wk = { on: 0, bob: 0 }; const el = document.querySelector('.rfw-mon'); new MutationObserver(() => { if (el.classList.contains('wk-on')) __wk.on++; if (el.classList.contains('bob')) __wk.bob++; }).observe(el, { attributes: true, attributeFilter: ['class'] }); });
  await rollAs(pg, 3);
  for (let i = 0; i < 4; i++) { await idle(pg).catch(() => {}); await drain(pg); if (await pg.evaluate(() => !!document.querySelector('.chbat'))) await pg.evaluate(() => bBattleSkip()); /* 2026-10-12：遭遇は強制バトル（やめておくは無い）＝先へ進めるために直接呼ぶ */ }
  await idle(pg);
  const wk = await pg.evaluate(() => ({ ...__wk, now: document.querySelector('.rfw-mon').className, frames: document.querySelectorAll('.rfw-mon img.wk').length }));
  assert.ok(wk.frames >= 6, `歩行の絵を重ねて置く（${wk.frames}）`);
  assert.ok(wk.on > 0, `奥へ進む間は歩行の絵（${JSON.stringify(wk)}）`);
  assert.ok(!/wk-on|bob/.test(wk.now), '止まったら正面の絵');
  // 分かれ道：J0 の1つ手前から → 分かれ道のチュートリアル
  const before = await pg.evaluate(() => { const s = MMRF_DATA.segments.S01[3]; return s[s.length - 2]; });
  await place(pg, before); await idle(pg);
  await rollAs(pg, 3);
  await pg.waitForSelector('.wbbr .chroute');
  await pg.waitForSelector('.mmtalk:not(.mmtalk-out)', { timeout: 10000 });
  assert.match(await pg.evaluate(() => document.querySelector('.mmtalk').textContent), /分かれ道/);
  await H.finishTalk(pg); await idle(pg);
  await pg.click('.wbbr .chroute');
  for (let i = 0; i < 4; i++) { await idle(pg).catch(() => {}); await drain(pg); if (await pg.evaluate(() => !!document.querySelector('.chbat'))) await pg.evaluate(() => bBattleSkip()); /* 2026-10-12：遭遇は強制バトル（やめておくは無い）＝先へ進めるために直接呼ぶ */ }
  await idle(pg);
  // 能力マス：1つ手前の地点から 1 を出す → 道具と特訓の動き → 能力マスのチュートリアル
  const tgt = await pg.evaluate(() => {
    const f = S.m.raise.field, d = MMRF_DATA;
    for (const [k, s] of Object.entries(d.segments)) { const pts = s[3]; for (let i = 2; i < pts.length - 1; i++) { const t = f.tiles[pts[i]]; if (t && t.t === 'stat' && f.used[pts[i]] == null && /^(EL|ER)0[12]$/.test(k)) return { at: pts[i - 1], id: pts[i], key: t.k }; } }
    return null;
  });
  assert.ok(tgt, '能力マスが見つかる');
  await place(pg, tgt.at, { turnsUsed: 2 }); await pg.evaluate(() => { S.m.raise.field.core.turn = 2; save(); }); await idle(pg);
  const v0 = await pg.evaluate((k) => S.m[k], tgt.key);
  await pg.evaluate(() => { window.__tact = 0; new MutationObserver(() => { if (document.querySelector('#wb-ui .chf-tact')) __tact++; }).observe(document.getElementById('wbw'), { childList: true, subtree: true }); });
  await rollAs(pg, 1);
  await pg.waitForSelector('.mmtalk:not(.mmtalk-out)', { timeout: 15000 });
  assert.match(await pg.evaluate(() => document.querySelector('.mmtalk').textContent), /能力マス/);
  await H.finishTalk(pg); await idle(pg);
  const st = await pg.evaluate((k) => ({ v: S.m[k], node: S.m.raise.node, tact: __tact, story: S.npcFlags.story.slice(), left: document.querySelectorAll('.chf-tact,.chf-tact-tx').length }), tgt.key);
  assert.equal(st.node, tgt.id); assert.ok(st.v > v0, `能力が上がった（${v0}→${st.v}）`);
  assert.ok(st.tact > 0, '特訓の道具が出た'); assert.equal(st.left, 0, '道具・文字は消える');
  assert.ok(['tut_turns_w', 'tut_branch', 'tut_stat'].every((x) => st.story.includes(x)), `見た記録（${st.story}）`);
  await pg.reload(); await pg.waitForFunction(() => typeof window.MMP8 === 'object' && typeof S === 'object'); await pg.waitForSelector('.p15start'); await pg.click('.p15start');
  await pg.waitForSelector('#wbw #brollbtn'); await pg.waitForTimeout(900);
  assert.equal(await pg.evaluate(() => !!document.querySelector('.mmtalk')), false, '再読み込みでは同じチュートリアルを出さない');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('WB-8：通常の地点に止まる → 冒険リアクション（しぐさ → 選択肢 → 小さな結果）・記録は配置の中', { skip: SKIP, timeout: 150000 }, async () => {
  const p = await openPage({ story: true }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { S.npcFlags = { ...(S.npcFlags || {}), story: ['tut_turns_w', 'tut_branch', 'tut_stat', 'tut_event', 'tut_rest', 'tut_treasure', 'tut_wild'] }; const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); S.m.raise.field.storySeen = ['ch1_start']; save(); board(); });
  await pg.waitForSelector('#wbw #brollbtn'); await idle(pg);
  const pts = await pg.evaluate(() => MMRF_DATA.segments.EL01[3]);
  await place(pg, pts[1], { turnsUsed: 3, fatigue: 40 });
  await pg.evaluate((id) => { const f = S.m.raise.field; f.used[id] = 0; f.core.turn = 3; f.storySeen.push('w_left'); save(); }, pts[2]); await idle(pg);
  await rollAs(pg, 1);
  await pg.evaluate(() => { window.__mr2 = Math.random; Math.random = () => 0.01; });   // 発生の判定（確率 0.4）を必ず通す
  await pg.waitForFunction(() => window.MMNPC && MMNPC.state() && MMNPC.state().choices, null, { timeout: 15000 });
  await pg.evaluate(() => { Math.random = window.__mr2; });
  const rx = await pg.evaluate(() => ({ rx: S.m.raise.field.rx, saved: JSON.parse(localStorage.getItem('mr4v6')).m.raise.field.rx }));
  assert.ok(Array.isArray(rx.rx) && rx.rx.length === 1 && /^rx\d{3}$/.test(rx.rx[0]), `記録（${JSON.stringify(rx)}）`);
  assert.deepEqual(rx.saved, rx.rx, '選ぶ前に記録を保存');
  await H.chooseTalk(pg, '0');
  await idle(pg);
  assert.equal(await pg.evaluate(() => MMP8.boardPhase(S.m)), 'roll');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
