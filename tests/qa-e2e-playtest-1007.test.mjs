// =========================================================
// QA（実ブラウザ）：2026-10-07 実機試遊・軽微 UI／遷移修正便
//  PT-B1（4サイズ）：大会ランク選択の S〜E がスクロールなしで1画面に収まる
//  PT-B2：「最初からやり直す」→ 再読み込み（アプリを閉じて開き直す）でも新しいゲームの開始画面のまま。つづきからに戻れば印は消える
//  PT-B3：プロローグ → フィナの声かけ・街 → リュウ・セドリック → 対戦表で、前の画面（街・受付）が会話の外に1フレームも見えない
//  PT-B4：冒険のメニュー＝4つのボタンは同じ大きさ・大会をやめるは はい／いいえ の確認
//  PT-B5：ほかの参加者どうしの新しい結果だけ短い演出（次の描き直しでは出ない）・次の相手の行が光る
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

async function toReception(pg) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); board(); });
  await pg.waitForSelector('#chrcv .rcv-row', { timeout: 20000 });
}
/** rAF ごとに「会話・幕の外に見えてはいけない画面」が見えたフレームを数える */
const watchFrames = (pg, sel) => pg.evaluate((sel) => { window.__bad = 0; window.__frames = 0; window.__stop = false; const f = () => { if (window.__stop) return; window.__frames++;
  const hidden = document.documentElement.hasAttribute('data-mmscene') || document.getElementById('opcur') || document.querySelector('.mmpro');
  const talkUp = [...document.querySelectorAll('.mmtalk')].some((t) => !t.classList.contains('mmtalk-out'));
  if (!hidden && !talkUp && document.querySelector(sel)) window.__bad++; requestAnimationFrame(f); }; requestAnimationFrame(f); }, sel);

for (const size of [H.SIZES.base, H.SIZES.se, H.SIZES.android, [414, 896]]) {
  test(`PT-B1（${size.join('×')}）：大会ランク選択の S〜E が1画面（スクロールなし）`, { skip: SKIP, timeout: 120000 }, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await toReception(pg); await pg.waitForTimeout(700);
    const r = await pg.evaluate(() => { const l = document.querySelector('#chrcv .rcv-list'), lb = l.getBoundingClientRect(); const rows = [...l.querySelectorAll('.rcv-row')].map((x) => x.getBoundingClientRect());
      return { n: rows.length, sh: l.scrollHeight, ch: l.clientHeight, inside: rows.every((b) => b.top >= lb.top - 1 && b.bottom <= lb.bottom + 1), minH: Math.min(...rows.map((b) => b.height)), sw: document.documentElement.scrollWidth, W: innerWidth }; });
    assert.equal(r.n, 6); assert.ok(r.sh <= r.ch + 1 && r.inside, `6段とも一覧の中・スクロールなし ${JSON.stringify(r)}`);
    assert.ok(r.minH >= 48, `行を極端に小さくしない ${JSON.stringify(r)}`); assert.ok(r.sw <= r.W + 1);
    assert.deepEqual([p.errors, p.bad], [[], []]);
  });
}

test('PT-B2：「最初からやり直す」のあと閉じて開き直しても新しいゲームの開始画面。つづきからに戻れば印は消える', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({}); const pg = p.page;
  await H.newGame(pg, 'テスト'); await pg.evaluate(() => { S.g = 777; save(); P_NEWGAME = true; title(); });
  assert.equal(await pg.evaluate(() => localStorage.getItem('mr4ng')), '1');
  await pg.reload(); await pg.waitForFunction(() => typeof S === 'object' && document.querySelector('.p15start'));
  const a = await pg.evaluate(() => ({ ng: P_NEWGAME, cancel: !!document.querySelector('.tcancel'), g: S.g }));
  assert.deepEqual(a, { ng: true, cancel: true, g: 777 }, '新しいゲームの開始画面のまま（セーブはまだ消えていない）');
  await pg.click('.p15start'); await pg.waitForSelector('#ngm .ngm-ok');
  const yn = await pg.evaluate(() => [...document.querySelectorAll('#ngm .ngm-yn button')].map((b) => b.textContent));
  assert.deepEqual(yn, ['はい', 'いいえ']);
  await pg.waitForTimeout(450); await pg.click('#ngm .ngm-back');
  await pg.evaluate(() => { document.querySelector('.tcancel') && document.querySelector('.tcancel').click(); save(); });
  assert.equal(await pg.evaluate(() => localStorage.getItem('mr4ng')), null, 'つづきからに戻って保存したら印は消える');
  assert.deepEqual([p.errors, p.bad], [[], []]);
});

test('PT-B3a：プロローグ → フィナの声かけで、会話の外に街が1フレームも見えない', { skip: SKIP, timeout: 180000 }, async () => {
  const p = await openPage({ opening: true, prologue: true }); const pg = p.page;
  await pg.evaluate(() => { S = p10NewSave(); S.playerName = MMP11P.DEFAULT_NAME; S.playerNamePending = true; save(); lobby(); });
  await pg.waitForSelector('.mmpro-skip:not([disabled])', { timeout: 20000 });
  await watchFrames(pg, '#app .map.town');
  await pg.click('.mmpro-skip'); await pg.waitForTimeout(350); await pg.click('.mmpro-skip');
  await pg.waitForSelector('.mmtalk:not(.mmtalk-out)', { timeout: 20000 }); await pg.waitForTimeout(500);
  const r = await pg.evaluate(() => { window.__stop = true; return { bad: window.__bad, frames: window.__frames, cur: !!document.getElementById('opcur') }; });
  assert.equal(r.bad, 0, `街が見えたフレーム ${JSON.stringify(r)}`); assert.ok(r.frames > 10); assert.equal(r.cur, false, '会話が出たら幕は消える');
  assert.deepEqual([p.errors, p.bad], [[], []]);
});

test('PT-B3b：街 → リュウの出会いで、会話の前に街が見えない・会話のあとは案内つきの街', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({}); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { finaFlags().ryuMet = 0; finaFlags().op = 'done'; save(); opShell(); });
  await watchFrames(pg, '#app .map.town');
  await pg.evaluate(() => { opRyu(); });
  await pg.waitForSelector('.mmtalk:not(.mmtalk-out)', { timeout: 20000 }); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => { window.__stop = true; return { bad: window.__bad, frames: window.__frames }; });
  assert.equal(r.bad, 0, `会話の前に街が見えた ${JSON.stringify(r)}`);
  await H.finishTalk(pg); await pg.waitForSelector('#app .map.town');
  assert.equal(await pg.evaluate(() => finaFlags().ryuMet), 1);
  assert.deepEqual([p.errors, p.bad], [[], []]);
});

test('PT-B3c：セドリックの開会 → 対戦表で、受付の画面が会話の外に見えない', { skip: SKIP, timeout: 150000 }, async () => {
  const p = await openPage({ npc: true }); const pg = p.page;
  await toReception(pg);
  await pg.evaluate(() => { MMP8.startTournament(S, S.m, 0, 7); save(); p9TourOpen(0); });
  await pg.waitForSelector('.mmtalk:not(.mmtalk-out)', { timeout: 30000 });
  await watchFrames(pg, '#app #chrcv, #app .rcv');
  await H.finishTalk(pg); await pg.waitForSelector('.tb1 .tbgo', { timeout: 20000 }); await pg.waitForTimeout(300);
  const r = await pg.evaluate(() => { window.__stop = true; return { bad: window.__bad, frames: window.__frames }; });
  assert.equal(r.bad, 0, `受付が見えたフレーム ${JSON.stringify(r)}`);
  assert.deepEqual([p.errors, p.bad], [[], []]);
});

test('PT-B4：冒険のメニュー＝4つのボタンは同じ大きさ（育成放棄だけ赤）・大会をやめるは はい／いいえ', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({}); const pg = p.page;
  await toReception(pg);
  await pg.evaluate(() => { TEST_TOUR = { snap: JSON.stringify(S) }; MMP8.startTournament(S, S.m, 0, 7); board(); });
  await pg.waitForSelector('.tb1 .tbgo'); await pg.evaluate(() => p9Menu()); await pg.waitForSelector('#p9ov .p8menu');
  const r = await pg.evaluate(() => { const b = [...document.querySelectorAll('#p9ov .p8menu button')].map((x) => x.getBoundingClientRect()); const t = document.querySelector('#p9ov .ttest');
    return { n: b.length, w: [...new Set(b.map((x) => Math.round(x.width)))], h: [...new Set(b.map((x) => Math.round(x.height)))], inView: b.every((x) => x.left >= 0 && x.right <= innerWidth), ttest: t.textContent }; });
  assert.equal(r.n, 4); assert.equal(r.w.length, 1, `同じ幅 ${JSON.stringify(r)}`); assert.equal(r.h.length, 1, `同じ高さ ${JSON.stringify(r)}`); assert.ok(r.inView);
  assert.equal(r.ttest, '大会をやめて街へ戻る');
  await pg.click('#p9ov .ttest'); await pg.waitForSelector('#ynm .ynm-y');
  assert.deepEqual(await pg.evaluate(() => [...document.querySelectorAll('#ynm button')].map((b) => b.textContent)), ['はい', 'いいえ']);
  await pg.waitForTimeout(450); await pg.click('#ynm .ynm-n'); assert.equal(await pg.$('#ynm'), null, 'いいえ＝閉じるだけ');
  await pg.click('#p9ov .ttest'); await pg.waitForSelector('#ynm .ynm-y'); await pg.waitForTimeout(450); await pg.click('#ynm .ynm-y');
  await pg.waitForFunction(() => TEST_TOUR === null && !document.getElementById('p9ov') && !document.getElementById('ynm'));   // はい＝控えたセーブへ戻す（従来の testTourEnd）
  assert.deepEqual([p.errors, p.bad], [[], []]);
});

test('PT-B5：ほかの参加者どうしの新しい結果だけ短い演出・次の相手の行が光る', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({}); const pg = p.page;
  await toReception(pg);
  await pg.evaluate(() => { MMP8.startTournament(S, S.m, 0, 7); save(); board(); });
  await pg.waitForSelector('.tb1 .tbgo');
  assert.equal(await pg.$$eval('.tbc.fresh', (a) => a.length), 0, '始めは結果がない');
  const before = await pg.evaluate(() => JSON.stringify(MMP8L.standings(S.m.raise.tour.league)));
  await pg.evaluate(() => { MMP8L.recordPlayerResult(S.m.raise.tour.league, true); board(); });
  const a = await pg.evaluate(() => ({ fresh: document.querySelectorAll('.tbc.fresh').length, bars: document.querySelectorAll('.tbc.fresh .tblf').length, rnx: document.querySelectorAll('.tbrw.rnx').length, mine: [...document.querySelectorAll('.tbc.fresh')].some((x) => x.classList.contains('rme')) }));
  assert.deepEqual(a, { fresh: 4, bars: 4, rnx: 1, mine: false }, '6体＝ほかの2試合（4マス）だけ・プレイヤーの行は対象外・次の相手の行は1つ');
  await pg.evaluate(() => board());
  assert.equal(await pg.$$eval('.tbc.fresh', (x) => x.length), 0, '同じ結果は2回演出しない');
  assert.notEqual(await pg.evaluate(() => JSON.stringify(MMP8L.standings(S.m.raise.tour.league))), before);
  assert.deepEqual([p.errors, p.bad], [[], []]);
});
