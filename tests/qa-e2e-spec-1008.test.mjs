// =========================================================
// QA（実ブラウザ）：2026-10-08 監査後の仕様確定差分
//  SF-B1：S ランクへの正式導線＝Chapter 4 の A 優勝 → 結果の画面の「最終公式大会へ挑戦する」→ 参加の確認 → 開始 → 8体の対戦表 → 実際の fight() で7試合 → S 優勝
//         → 三伝説への挑戦の解禁（イベント＝システム通知 → S.npcFlags.legend＝2・保存）。旧「Chapter 5 は準備中」は出ない
//  SF-B2：大会で降参した試合の残りライフ% は 0（実際の fight() の降参ボタン）
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
const openPage = async (o) => { const p = await L.open(o); OPEN.push(p); return p; };
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close().catch(() => {}); });

const pressStop = async (pg) => { if (await pg.evaluate(() => { const g = document.getElementById('go'); return !!g && !g.disabled && !g.classList.contains('bk'); })) await pg.click('#go').catch(() => {}); };
/** 今の大会の次の試合を実際の fight() で最後まで（STOP を押し続ける）→ もどる */
async function fightOnce(pg) {
  await pg.evaluate(() => p8TourFight());
  await pg.waitForSelector('#bt', { timeout: 20000 });
  for (let i = 0; i < 600; i++) { if (await pg.evaluate(() => { const g = document.getElementById('go'); return !!g && g.classList.contains('bk'); })) break; await pressStop(pg); await pg.waitForTimeout(400); }
  const msg = await pg.evaluate(() => document.getElementById('msg').textContent);
  await pg.click('#go');
  await pg.waitForFunction(() => !document.getElementById('bt') && !!document.querySelector('.p9tour'), null, { timeout: 20000 });
  await pg.waitForTimeout(300);
  return msg;
}

test('SF-B1：Chapter 4 の A 優勝 → 最終公式大会（S・8体7試合）を実際の fight() で完走 → S 優勝 → 三伝説への挑戦の解禁（イベントのあと）', { skip: SKIP, timeout: 1500000 }, async () => {
  const p = await openPage({ size: H.SIZES.base, tourconf: true }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  // Chapter 4 のゴール（B までクリア済み・強い個体）→ A ランク大会に優勝（ここは API で決着）→ 結果の画面
  await pg.evaluate(() => {
    const m = mk(1); m.name = 'ガウ'; Object.assign(m, { li: 999, po: 999, in: 999, hi: 999, ev: 999, de: 999 }); MMP7.ensureProg(m); for (const r of [0, 1, 2, 3]) m.prog.rankClr[r] = true;
    S.m = m; Object.assign(m.raise, { state: 'farm', ch: 4, log: [1, 2, 3].map((ch) => ({ ch, reachedGoal: true })) }); MMP8.depart(S, m, () => 0.3);
    Object.assign(m.raise, { node: MMP8.boardOf(m).goal, goal: true, pend: null });
    if (!MMP8.startTournament(S, m, 4, 11).ok) throw new Error('A');
    while (m.raise.tour.status === 'league') { MMP8.beginBattle(S, m, { kind: 'league', rank: 4 }); S.wins = (S.wins || 0) + 1; MMP8.markBattleDone(S); MMP8.finishBattle(S, m); }
    save(); board();
  });
  await pg.waitForSelector('.p9tour .p9final', { timeout: 20000 });
  const r0 = await pg.evaluate(() => ({ won: S.m.raise.tour.result.won, rank: S.m.raise.tour.rank, btn: document.querySelector('.p9final').textContent, ch5: /Chapter 5/.test(document.body.innerText) }));
  assert.deepEqual(r0, { won: true, rank: 4, btn: '最終公式大会へ挑戦する同じ子のまま 公式ランクS大会へ', ch5: false });
  // 参加の確認 → はい
  await pg.waitForTimeout(500); await pg.click('.p9final'); await pg.waitForSelector('#ynm .ynm-y'); await pg.waitForTimeout(450);
  assert.equal(await pg.evaluate(() => S.m.raise.tour.rank), 4, '確認の前はまだ始まらない');
  await pg.click('#ynm .ynm-y');
  await pg.waitForSelector('.tb1 .tbgo', { timeout: 30000 }); await pg.waitForTimeout(600);
  const t = await pg.evaluate(() => ({ rank: S.m.raise.tour.rank, final: S.m.raise.tour.final, n: S.m.raise.tour.league.entrants.length, rows: document.querySelectorAll('.tb1g .tbnm').length, uid: S.m.uid, saved: JSON.parse(localStorage.getItem('mr4v6')).m.raise.tour.rank }));
  assert.deepEqual([t.rank, t.final, t.n, t.rows, t.saved], [5, true, 8, 8, 5], 'S の大会＝8体（対戦表 8行）・保存済み');
  // 1試合目は画面の操作（対戦する → 比較 → 対戦開始の2度押し）で fight() まで
  await pg.click('.tb1 .tbgo'); await pg.waitForSelector('.p9cmps .pcgo'); await pg.waitForTimeout(500);
  await pg.click('.pcgo'); await pg.waitForTimeout(600); await pg.click('.pcgo');
  await pg.waitForSelector('#bt', { timeout: 20000 });
  for (let i = 0; i < 600; i++) { if (await pg.evaluate(() => { const g = document.getElementById('go'); return !!g && g.classList.contains('bk'); })) break; await pressStop(pg); await pg.waitForTimeout(400); }
  assert.match(await pg.evaluate(() => document.getElementById('msg').textContent), /^勝利/);
  await pg.click('#go'); await pg.waitForFunction(() => !document.getElementById('bt') && !!document.querySelector('.p9tour'), null, { timeout: 20000 });
  // 2〜7試合目
  for (let k = 2; k <= 7; k++) assert.match(await fightOnce(pg), /^勝利/, `${k}試合目`);
  await pg.waitForSelector('.p9tour.p9won', { timeout: 20000 });
  await pg.waitForFunction(() => S.npcFlags && S.npcFlags.legend === 2, null, { timeout: 20000 });
  await pg.waitForTimeout(300);
  const end = await pg.evaluate(() => { const r = S.m.raise.tour.result; const st = JSON.parse(localStorage.getItem('mr4v6'));
    return { won: r.won, rank: r.rank, place: r.place, sClr: S.m.prog.rankClr[5], legend: S.npcFlags.legend, savedLegend: st.npcFlags.legend, played: S.m.raise.tour.league.round,
      seiha: !!document.querySelector('.p9newroad'), ch5: /Chapter 5/.test(document.body.innerText), notes: MMNOTE.log().map((n) => n.title) }; });
  assert.deepEqual([end.won, end.rank, end.place, end.sClr, end.played], [true, 5, 1, true, 7], 'S 優勝（7試合）');
  assert.deepEqual([end.legend, end.savedLegend], [2, 2], 'イベントのあと三伝説への挑戦が解禁（保存済み）');
  assert.ok(end.notes.includes('三伝説への挑戦が解禁された！'), `解禁のイベント（システム通知）${JSON.stringify(end.notes)}`);
  assert.equal(end.seiha, true); assert.equal(end.ch5, false, '旧「Chapter 5 は準備中」は出ない');
  assert.equal(await pg.evaluate(() => !!document.querySelector('.p9final')), false, '最終公式大会は1回だけ');
  // Chapter を終える → A 以上クリアなので最終ルートの前のベースキャンプ（従来どおり）
  await pg.evaluate(() => p8EndChapter());
  await pg.waitForFunction(() => S.m.raise.state === 'farm' && S.m.raise.ch === 'final', null, { timeout: 20000 });
  const log = await pg.evaluate(() => S.m.raise.log.slice(-1)[0]);
  assert.deepEqual([log.tour.rank, log.finalTour.rank, log.finalTour.won], [4, 5, true]);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('SF-B2：大会で降参した試合（実際の fight() の降参ボタン）＝敗北・残りライフ% は 0 で記録', { skip: SKIP, timeout: 200000 }, async () => {
  const p = await openPage({ size: H.SIZES.base }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true;
    if (!MMP8.startTournament(S, m, 0, 7).ok) throw new Error('E'); save(); board(); });
  await pg.waitForSelector('.tb1 .tbgo', { timeout: 20000 });
  await pg.evaluate(() => p8TourFight()); await pg.waitForSelector('#bt #sur', { timeout: 20000 });
  // 1手だけ進めてから降参（ライフが残っている状態）
  await pg.waitForTimeout(3500); await pressStop(pg); await pg.waitForTimeout(4000);
  await pg.click('#sur', { force: true }); await pg.waitForTimeout(300); await pg.click('#sur', { force: true });
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => { const g = document.getElementById('go'); return !!g && g.classList.contains('bk'); })) break; await pressStop(pg); await pg.waitForTimeout(400); }
  assert.match(await pg.evaluate(() => document.getElementById('msg').textContent), /降参した/);
  await pg.click('#go'); await pg.waitForSelector('.tb1 .tbgo', { timeout: 20000 });
  const r = await pg.evaluate(() => { const lg = S.m.raise.tour.league, mt = lg.rounds[0].find((x) => x.a === 0 || x.b === 0); return { round: lg.round, winner: mt.winner, st: mt.st ? mt.st[0] : null }; });
  assert.equal(r.round, 1); assert.notEqual(r.winner, 0, '敗北');
  assert.ok(r.st, '試合の内容を記録'); assert.equal(r.st.life, 0, '降参した試合の残りライフ% は 0');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
