// =========================================================
// 実ブラウザ：追加修正（2026-10-06）
//  EC-B1 新しいゲーム：登録の新人支援で 1000G・薬草×1 → 市場で 500G の1体 → 500G 残る（補填の通知は出さない）
//  HB-B1 薬草：Chapter のアイテム（サイコロを振る前）で使うと疲れ −30・バッグから消える・保存される
//  TT-B1 TEST 大会：街の小さなボタン → 大会受付へ直接。大会の間は保存しない。やめる（メニュー）・辞退で街へ戻り、セーブも画面の状態も始める前のまま
//  TL-B1 会話：タップで全文 → すぐのタップでは進まない（読む間）→ 次のセリフ。Chapter のフィナの吹き出しは自動で進まない
//  QA_E2E=1 のときだけ実行（tests/e2e/harness.mjs）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
let L, opened = [];
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });
async function open(opt = {}) { for (const q of opened) await q.ctx.close().catch(() => {}); const p = await L.open(opt); opened = [p]; return p; }
const stored = (pg) => pg.evaluate(() => localStorage.getItem(MMP8.SAVE_KEY));
const idle = (pg) => pg.waitForFunction(() => !bBusy && !MMCHD.isLocked() && !document.querySelector('.chpop,.chdz,.chf-fina'), null, { timeout: 30000 }).then(() => pg.waitForTimeout(200));

test('EC-B1：新しいゲーム＝登録の新人支援で 1000G・薬草×1 → 市場で 500G の1体 → 500G 残る。「所持金を500Gまで補填」の通知は出さない', { skip: SKIP }, async () => {
  const p = await open(); const pg = p.page;
  await H.newGame(pg, 'テスト');
  assert.deepEqual(await pg.evaluate(() => [S.g, S.inv.bag.map((i) => i.id), finaFlags().support]), [1000, ['herb'], 1]);
  await pg.evaluate(() => market()); await pg.waitForSelector('#p10car .p10sl.on'); await pg.waitForTimeout(600);
  await H.marketDetail(pg);
  assert.doesNotMatch(await pg.evaluate(() => document.querySelector('.p10mk').innerText), /補填/, '詳細に補填の案内は出ない');
  await pg.click('#p10info .p10buy'); await pg.waitForSelector('#p10ov'); await pg.waitForTimeout(550);
  assert.doesNotMatch(await pg.evaluate(() => document.querySelector('#p10ov').innerText), /補填/, '購入確認に補填の案内は出ない');
  await pg.click('.p10ok'); await pg.waitForFunction(() => !!S.m, null, { timeout: 10000 }); await pg.waitForTimeout(600);
  assert.equal(await pg.evaluate(() => S.g), 500, '500G 残る');
  assert.doesNotMatch(await H.text(pg), /補填/);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('HB-B1：薬草（疲れ −30）：Chapter のアイテムで使うと疲れが30下がり、バッグから消えて保存される（ターンは使わない）', { skip: SKIP }, async () => {
  const p = await open(); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { finaFlags().story = ['tut_turns']; const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); m.raise.fatigue = 50; save(); board(); });
  await pg.waitForSelector('#chf .chf-bg'); await idle(pg);
  const t0 = await pg.evaluate(() => S.m.raise.turnsUsed);
  await pg.evaluate(() => chfItems()); await pg.waitForSelector('#chitems');
  assert.match(await pg.evaluate(() => document.querySelector('#chitems').innerText), /薬草[\s\S]*疲れ −30/);
  await pg.click('#chitems button[onclick^="chfItemUse"]'); await pg.waitForTimeout(500);
  assert.deepEqual(await pg.evaluate(() => [S.m.raise.fatigue, S.inv.bag.length, S.m.raise.turnsUsed]), [20, 0, t0]);
  const sv = JSON.parse(await stored(pg)); assert.deepEqual([sv.m.raise.fatigue, sv.inv.bag.length], [20, 0], '保存された');
  assert.deepEqual(p.errors, []);
});

test('TT-B1：TEST 大会：街のボタン → 大会受付へ直接 → 参加しても保存しない → メニューの「やめて街へ戻る」・辞退で街へ戻り、セーブも状態も始める前のまま', { skip: SKIP }, async () => {
  const p = await open(); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(1); m.name = 'ガウ'; MMP7.ensureProg(m); S.m = m; save(); lobby(); }); await pg.waitForSelector('.map.town .ttest');
  const before = await stored(pg), sBefore = await pg.evaluate(() => JSON.stringify(S));
  // ① 受付 → E に参加 → メニューから街へ
  await pg.click('.map.town .ttest'); await pg.waitForFunction(() => /公式大会/.test(document.querySelector('#app').innerText) && !!document.querySelector('[onclick*="p9RcvJoin"]'), null, { timeout: 15000 });
  assert.equal(await pg.evaluate(() => S.m.raise.goal), true, 'Chapter を進めずに大会受付（ゴール）');
  await pg.evaluate(() => { const r = MMP8.startTournament(S, S.m, 0); if (!r.ok) throw new Error(r.reason); save(); board(); }); await pg.waitForTimeout(800);
  assert.ok(await pg.evaluate(() => !!S.m.raise.tour), '大会が始まった');
  assert.equal(await stored(pg), before, 'TEST 大会の間は保存しない');
  await pg.evaluate(() => p9Menu()); await pg.waitForSelector('#p9ov .ttest'); await pg.click('#p9ov .ttest'); await pg.waitForSelector('#ynm .ynm-y'); await pg.waitForTimeout(450); await pg.click('#ynm .ynm-y');   // 2026-10-07 試遊：はい／いいえ の確認
  await pg.waitForSelector('.map.town');
  assert.equal(await stored(pg), before, 'セーブは始める前のまま'); assert.equal(await pg.evaluate(() => JSON.stringify(S)), sBefore, '画面の状態（S）も始める前のまま');
  // ② 受付で辞退 → 街へ
  await pg.click('.map.town .ttest'); await pg.waitForSelector('[onclick*="p8TourDecline"]'); await pg.waitForTimeout(500);
  await pg.click('[onclick*="p8TourDecline"]'); await pg.waitForTimeout(500); await pg.click('[onclick*="p8TourDecline"]');
  await pg.waitForSelector('.map.town');
  assert.equal(await stored(pg), before); assert.equal(await pg.evaluate(() => JSON.stringify(S)), sBefore);
  // ③ TEST 大会の途中で再読み込み → 始める前のセーブ
  await pg.click('.map.town .ttest'); await pg.waitForSelector('[onclick*="p9RcvJoin"]');
  await pg.reload(); await pg.waitForFunction(() => typeof window.MMP8 === 'object');
  assert.equal(await stored(pg), before); assert.equal(await pg.evaluate(() => !!(S.m && S.m.raise && S.m.raise.goal)), false, '再読み込みで正式の進行に TEST 大会は残らない');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('TL-B1：会話：タップで全文 → すぐ（0.3秒以内）のタップでは次へ進まない → 間をおいたタップで次のセリフ', { skip: SKIP }, async () => {
  const p = await open(); const pg = p.page;
  await pg.evaluate(() => { MMNPC.talk([{ npc: 'fina', text: 'これは読むための長めのセリフです。最後まで読めますか？' }, { text: '二つ目のセリフです。' }]); });
  await pg.waitForSelector('.mmtalk:not(.mmtalk-out)'); await pg.waitForTimeout(300);
  // 2026-10-05 PHASE B：タップの間隔はページの中で測る（Playwright の click は待ちが入り、0.3秒を超えることがある）
  const r = await pg.evaluate(() => new Promise((ok) => { const o = document.querySelector('.mmtalk'); o.click(); const full = !MMNPC.state().typing; setTimeout(() => { o.click(); ok([full, MMNPC.state().idx]); }, 120); }));
  assert.equal(r[0], true, '全文'); assert.equal(r[1], 0, 'すぐ（0.12秒後）のタップでは進まない（読む間）');
  await pg.waitForTimeout(400); await pg.click('.mmtalk');
  assert.equal(await pg.evaluate(() => MMNPC.state().idx), 1, '間をおいたタップで次のセリフ');
  await H.finishTalk(pg);
  assert.deepEqual(p.errors, []);
});
