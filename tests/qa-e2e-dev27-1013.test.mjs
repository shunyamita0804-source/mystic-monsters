// =========================================================
// 2026-10-13 開発27（実ブラウザ・QA_E2E=1 のときだけ）：iPhone 試遊の修正（局所の確認だけ）
//  D27-07：施設の入口（2回目以降の訪問）＝施設の背景だけ＋NPC のアップと一言（声と同時）→ 通常の画面。牧場の「見る」に能力のバー（999＝いっぱい）
//  D27-10：出発の「始める」→ 盤（覆い）が会話のフェードの前に下に描かれる（ベースキャンプ・出発準備が一瞬も見えない）
//  D27-18：イベントのサイコロ＝案内 → 「サイコロを振る」を押すまで振らない → 連打でも1回（DICE_CUBE 1回）・後ろに帯
//  D27-21：ライバル＝登場の SE（RIVAL_APPEAR）1回・「よっ」なし・案内のシートなしでバトルへ → 勝ったらボードでリュウの会話（やるじゃん 1回）
//  D27-22：HP の4段（名前 → バー → 数 → 札）＝札が増えても名前・バー・数は動かない（左右とも）
//  D27-23：勝ち＝暖色の横帯・正式の勝利の絵だけ（旧のポーズの層は見えない）／負け＝寒色の横帯
//  D27-14：サイコロは真正面で止まる（横の傾き 0）・止まった目＝出目
//  D27-28：対戦表（6体／8体 × 375・390）＝表が画面の中・名前が切れない・顔の枠は四角
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
let L = null;
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });
const OPEN = [];
const openPage = async (o) => { const p = await L.open(o); OPEN.push(p); return p; };
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close().catch(() => {}); });

/** 世界のボードで会話を送り切って止まるまで待つ */
async function settle(pg, ms = 60000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (await pg.$('.mmtalk:not(.mmtalk-out)')) { await H.finishTalk(pg); continue; }
    if (await pg.evaluate(() => !bBusy && !document.querySelector('.wbrelay,.wb-pop,.chf-enc2,.d3z'))) break;
    await pg.waitForTimeout(300);
  }
  await pg.waitForTimeout(400);
}
async function toWorld(pg, stats) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate((st) => { const m = mk(0); m.name = 'ソラ'; if (st) Object.assign(m, st); MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); S.m.raise.field.introSeen = true; save(); board(); }, stats || null);
  await pg.waitForSelector('#wbw #brollbtn'); await settle(pg);
}
const place = (pg, node, pend) => pg.evaluate(([node, pend]) => { const r = S.m.raise, f = r.field, c = f.core; r.node = node; c.node = node; c.trail.push(node); c.moveLeft = 0; c.back = null; c.exclude = null; r.pend = pend; save(); board(); }, [node, pend]);
async function fightToEnd(pg, ms = 200000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const d = await pg.evaluate(() => { const g = document.getElementById('go'); if (!document.getElementById('bt')) return true; if (g && g.classList.contains('bk')) return true; if (g && !g.disabled) g.click(); return false; }).catch(() => false);
    if (d) return; await pg.waitForTimeout(250);
  }
  throw new Error('バトルが終わらない');
}

test('D27-07：施設の入口＝背景だけ＋NPC のアップと一言（声と同時）→ 通常の画面・牧場の「見る」に能力のバー', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({ npc: true }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; Object.assign(m, { li: 150, po: 420, in: 80, hi: 999, ev: 30, de: 260 }); S.m = m; finaFlags().first = Object.assign(finaFlags().first || {}, { ranch: 1 }); save(); farm(); });
  await pg.waitForSelector('.mmtalk:not(.mmtalk-out)');
  await pg.waitForTimeout(900);
  const a = await pg.evaluate(() => ({ npc: MMNPC.state().npc, view: MMNPC.state().view, scene: document.documentElement.getAttribute('data-mmscene'), app: getComputedStyle(document.getElementById('app')).visibility, txt: document.querySelector('.mmtalk-text').textContent, cue: MMVOICE.log().filter((x) => x.cue === 'facility.ranch').map((x) => x.result), entry: FAC_ENTRY_LOG.slice() }));
  assert.deepEqual([a.npc, a.view, a.scene, a.entry], ['nick', 'closeup', '1', ['ranch']], JSON.stringify(a));
  assert.equal(a.app, 'hidden', '一言の間は通常の画面（一覧・コマンド）を出さない');
  assert.match(a.txt, /今日も元気そうだな/);
  assert.ok(a.cue.includes('entry') && a.cue.filter((x) => x !== 'entry').length === 1, `入口の声は1回 ${a.cue}`);
  await H.finishTalk(pg);
  await pg.waitForSelector('.rn2 .rngrid');
  // 同じ訪問の中で画面を替えても繰り返さない
  await pg.evaluate(() => { rnView = rnSel; farm('', 'e'); }); await pg.waitForSelector('.rnlook');
  assert.equal(await pg.evaluate(() => !!document.querySelector('.mmtalk')), false);
  const bars = await pg.evaluate(() => [...document.querySelectorAll('.rnlst.rnbars>div')].map((d) => [d.dataset.k, d.querySelector('dd').textContent, parseFloat(d.querySelector('.rnsb i').style.width), Math.round(d.querySelector('.rnsb').getBoundingClientRect().width)]));
  assert.deepEqual(bars.map((b) => b.slice(0, 3)), [['li', '150', 15], ['po', '420', 42], ['in', '80', 8], ['hi', '999', 100], ['ev', '30', 3], ['de', '260', 26]]);
  assert.ok(bars.every((b) => b[3] > 60), '棒が見える幅');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('D27-10：出発の「始める」→ 会話のフェードの間にベースキャンプ・出発準備が見えない', { skip: SKIP, timeout: 150000 }, async () => {
  const p = await openPage({ worldCh1: true, intro: true }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; finaFlags().first = Object.assign(finaFlags().first || {}, { farm: 1 }); save(); hall('t'); });
  await pg.waitForSelector('.bcgo button'); await pg.waitForTimeout(600);
  await pg.click('.bcgo button'); await pg.waitForTimeout(600);
  if (!(await pg.$('.mmtalk'))) await pg.click('#app button[onclick*="p7Depart"]');
  await pg.waitForSelector('.mmtalk');
  await H.chooseTalk(pg, 'start');
  await pg.evaluate(() => { window.__f = []; const t0 = performance.now(); const tick = () => { const app = document.getElementById('app'), sc = document.documentElement.hasAttribute('data-mmscene'), t = document.querySelector('.mmtalk'), op = t ? +getComputedStyle(t).opacity : null, old = !!app.querySelector('.fm,.pp'); window.__f.push([old, sc, op]); if (performance.now() - t0 < 3500) requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
  await H.finishTalk(pg); await pg.waitForTimeout(2500);
  const f = await pg.evaluate(() => window.__f);
  const bad = f.filter((x) => x[0] && !x[1] && (x[2] == null || x[2] < 0.99));
  assert.equal(bad.length, 0, `前の画面が見えたフレーム ${bad.length}`);
  assert.ok(await pg.$('#wbw'), '盤へ');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('D27-18：イベントのサイコロ＝案内 → 押すまで振らない → 連打でも1回・後ろに帯', { skip: SKIP, timeout: 180000 }, async () => {
  const p = await openPage({ worldCh1: true, story: true }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); S.m.raise.field.introSeen = true; save(); board(); });
  await pg.waitForSelector('#wbw #brollbtn'); await settle(pg);
  await place(pg, 'Q', { stage: 'resolve', evs: [{ type: 'eventDie', at: 'Q', kind: 'Q', die: 3, result: 'left' }] });
  for (let i = 0; i < 30 && !(await pg.$('.wbdask')); i++) { if (await pg.$('.mmtalk:not(.mmtalk-out)')) await H.finishTalk(pg); await pg.waitForTimeout(300); }
  assert.ok(await pg.$('.wbdask'), '案内が出る');
  await pg.waitForTimeout(1500);
  assert.equal(await pg.evaluate(() => !!document.querySelector('.d3z')), false, '押すまでサイコロは回らない');
  const n0 = await pg.evaluate(() => MMAUDIO.seLog().filter((x) => x === 'DICE_CUBE').length);
  await pg.evaluate(() => { const b = document.querySelector('.wbdgo'); b.click(); b.click(); });
  await pg.waitForTimeout(400);
  assert.deepEqual(await pg.evaluate(() => [document.querySelectorAll('.d3z').length, !!document.querySelector('.wbdband'), !!document.querySelector('.wbdask')]), [1, true, false]);
  await pg.waitForTimeout(3000);
  assert.equal(await pg.evaluate(() => MMAUDIO.seLog().filter((x) => x === 'DICE_CUBE').length) - n0, 1, 'サイコロは1回');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('D27-21：ライバル＝SE 1回・「よっ」なし・シートなしでバトル → 勝てばボードでリュウの会話（やるじゃん 1回）', { skip: SKIP, timeout: 300000 }, async () => {
  const p = await openPage({ worldCh1: true, npc: true }); const pg = p.page;
  await toWorld(pg, { li: 999, po: 999, in: 999, hi: 999, ev: 500, de: 999 });
  const s0 = await pg.evaluate(() => MMAUDIO.seLog().length), v0 = await pg.evaluate(() => MMAUDIO.voiceLog().length);
  await place(pg, 'RIVAL', { stage: 'resolve' });
  let sheet = false; const t0 = Date.now();
  while (Date.now() - t0 < 20000) { const s = await pg.evaluate(() => [!!document.querySelector('.chbat'), !!document.getElementById('bt')]); if (s[0]) sheet = true; if (s[1]) break; await pg.waitForTimeout(100); }
  assert.equal(sheet, false, 'ライバルの説明のシート（バトルする）は出ない');
  assert.ok(await pg.$('#bt'), 'そのままバトル');
  assert.deepEqual(await pg.evaluate((n) => MMAUDIO.seLog().slice(n).filter((x) => x === 'RIVAL_APPEAR'), s0), ['RIVAL_APPEAR']);
  await fightToEnd(pg); await pg.waitForTimeout(1300);
  assert.match(await pg.evaluate(() => (document.getElementById('ban') || {}).textContent || ''), /^WIN/);
  assert.deepEqual(await pg.evaluate((n) => MMAUDIO.voiceLog().slice(n).map((x) => x.id), v0), [], 'バトルの裏では声を出さない（「よっ」も無い）');
  await pg.click('#go');
  await pg.waitForSelector('.mmtalk:not(.mmtalk-out)', { timeout: 10000 });
  const t = await pg.evaluate(() => ({ npc: MMNPC.state().npc, board: !!document.getElementById('wbw'), txt: document.querySelector('.mmtalk-text').textContent }));
  assert.deepEqual([t.npc, t.board], ['ryu', true]);
  await pg.waitForTimeout(1500);
  assert.deepEqual(await pg.evaluate((n) => MMAUDIO.voiceLog().slice(n).filter((x) => x.result === 'play').map((x) => x.id), v0), ['ryu_praise']);
  await H.finishTalk(pg); await pg.waitForTimeout(800);
  assert.deepEqual(await pg.evaluate(() => RYU_WIN_LOG), [1], '会話は1回');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

async function battle(pg, sp, stats, bt = 'wild') {
  await H.newGame(pg, 'テスト');
  await pg.evaluate(([sp, st]) => { const m = mk(sp); m.name = 'ソラ'; Object.assign(m, st); MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); save(); board(); }, [sp, stats]);
  await pg.waitForTimeout(1500);
  await pg.evaluate((bt) => { const r = S.m.raise; r.pend = { roll: 1, left: 0, stage: 'battle', fx: { kind: 'battle', battleType: bt } }; save(); bBattleGo(); }, bt);
  await pg.waitForSelector('#bt #m0 .mon', { timeout: 20000 });
}

test('D27-22・23：HP の4段（札が増えても動かない）・勝ち＝暖色の横帯と勝利の絵だけ／負け＝寒色の横帯', { skip: SKIP, timeout: 400000 }, async () => {
  const p = await openPage({}); const pg = p.page;
  await battle(pg, 0, { li: 999, po: 999, in: 999, hi: 999, ev: 500, de: 999 });
  await pg.waitForTimeout(3500);
  const pos = () => pg.evaluate(() => [0, 1].map((i) => ['.hn1', '.eg2', 'small'].map((s) => { const b = document.querySelector(`#hp${i} ${s}`).getBoundingClientRect(); return [Math.round(b.top), Math.round(b.bottom)]; }).concat([[Math.round(document.getElementById('mmchips' + i).getBoundingClientRect().top)]])));
  const a = await pos();
  for (const side of a) { assert.ok(side[0][1] <= side[1][0] + 1 && side[1][1] <= side[2][0] + 1 && side[2][1] <= side[3][0] + 1, `名前 → バー → 数 → 札 ${JSON.stringify(side)}`); }
  await pg.evaluate(() => { for (const i of [0, 1]) document.getElementById('st' + i).insertAdjacentHTML('beforeend', '<span class="stb up"><i>▲</i>命中↑小<b>2</b></span><span class="stb dn"><i>▼</i>防御↓小<b>1</b></span><span class="stb up"><i>▲</i>回避↑中<b>2</b></span>'); });
  await pg.waitForTimeout(200);
  const b = await pos();
  assert.deepEqual(b.map((s) => s.slice(0, 3)), a.map((s) => s.slice(0, 3)), '札が増えても名前・バー・数は動かない');
  await pg.evaluate(() => { for (const i of [0, 1]) document.getElementById('st' + i).innerHTML = ''; });
  await fightToEnd(pg); await pg.waitForTimeout(1500);
  await pg.waitForSelector('#m0 .mon.mma-won .mma-win', { timeout: 4000 }).catch(() => {});
  const w = await pg.evaluate(() => { const bt = document.getElementById('bt'), band = bt.querySelector('.mma-endband'); const old = [...document.querySelectorAll('#m0 .mon > :not(.mma-win)')].filter((e) => getComputedStyle(e).visibility !== 'hidden' && +getComputedStyle(e).opacity > 0.01); return { cls: bt.className, bg: getComputedStyle(band).backgroundImage, win: !!document.querySelector('#m0 .mma-win'), old: old.length, h: band.getBoundingClientRect().height }; });
  assert.match(w.cls, /mma-res-win/); assert.match(w.bg, /rgba\(250, 196, 84/, '暖色の横帯'); assert.ok(w.win, '正式の勝利の絵'); assert.equal(w.old, 0, '旧のポーズの層は見えない'); assert.ok(w.h < 160, '横帯（画面の下を覆う暗い面ではない）');
  const q = await openPage({}); const qg = q.page;
  await battle(qg, 0, { li: 10, po: 5, in: 5, hi: 5, ev: 1, de: 5 });
  await fightToEnd(qg); await qg.waitForTimeout(1500);
  const l = await qg.evaluate(() => ({ cls: document.getElementById('bt').className, bg: getComputedStyle(document.querySelector('#bt .mma-endband')).backgroundImage, ban: document.getElementById('ban').textContent }));
  assert.match(l.cls, /mma-res-lose/); assert.match(l.bg, /rgba\(58, 92, 162/, '寒色の横帯'); assert.match(l.ban, /^LOSE/);
  assert.deepEqual(p.errors, []); assert.deepEqual(q.errors, []);
});

test('D27-14：世界のボードのサイコロは真正面で止まる・止まった目＝出目', { skip: SKIP, timeout: 200000 }, async () => {
  const p = await openPage({ worldCh1: true }); const pg = p.page;
  await toWorld(pg); await pg.mouse.click(4, 300);
  for (const v of [1, 6]) {
    await settle(pg);
    await pg.evaluate((v) => { const mr = Math.random; Math.random = () => (v - 0.5) / 6; document.getElementById('brollbtn').click(); Math.random = mr; }, v);
    await pg.waitForFunction(() => document.querySelector('.d3z') && document.querySelector('.d3z').dataset.final, null, { timeout: 8000 });
    const r = await pg.evaluate(() => { const t = document.querySelector('.d3z .d3-tilt'); return { m: getComputedStyle(t).transform, fin: document.querySelector('.d3z').dataset.final }; });
    assert.equal(r.fin, String(v));
    const m = /matrix3d\(([^)]+)\)/.exec(r.m); const n = m ? m[1].split(',').map(Number) : null;
    assert.ok(n && Math.abs(n[2]) < 0.01 && Math.abs(n[8]) < 0.01, `横の傾き 0（${r.m}）`);
  }
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('D27-28：対戦表（6体／8体 × 375・390）＝画面の中・名前が切れない・顔の枠は四角', { skip: SKIP, timeout: 300000 }, async () => {
  for (const size of [[375, 667], [390, 844]]) for (const rk of [1, 2]) {
    const p = await openPage({ size }); const pg = p.page;
    await H.newGame(pg, 'テスト');
    await pg.evaluate((rk) => { const m = mk(0); m.name = 'テストテストテ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); if (rk >= 2) { m.raise.ch = 2; MMP7.recordRankClear(S, m, rk - 1); } const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); MMP8.startTournament(S, m, rk, 7); save(); p8TourScr(); }, rk);
    await pg.waitForSelector('.tb1g'); await pg.waitForTimeout(1200);
    const r = await pg.evaluate(() => { const g = document.querySelector('.tb1g').getBoundingClientRect(), go = document.querySelector('.tb1 .tbgo').getBoundingClientRect(); return { in: g.left >= 0 && g.right <= innerWidth && g.bottom <= go.top, clip: [...document.querySelectorAll('.tb1g .tbnm b,.tb1g .tbh b')].filter((x) => x.scrollHeight > x.clientHeight + 1).length, sq: getComputedStyle(document.querySelector('.tb1g .tbh .tbic')).borderRadius, n: document.querySelectorAll('.tb1g .tbrw').length, sw: document.documentElement.scrollWidth <= innerWidth }; });
    assert.ok(r.in && r.sw, `${size} ${rk}：表は画面の中 ${JSON.stringify(r)}`); assert.equal(r.clip, 0, '名前が切れない'); assert.equal(r.sq, '5px', '四角い枠'); assert.equal(r.n, rk === 1 ? 6 : 8);
    assert.deepEqual(p.errors, []); await p.ctx.close();
  }
});
