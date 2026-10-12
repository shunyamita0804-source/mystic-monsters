// =========================================================
// QA（実ブラウザ）：バッグの正式仕様（2026-10-11）
//  BG-B1：出発準備・アイテム管理（390×844・375×667）＝6つの枠（使える枠＋🔒と解放の条件）・同じアイテムは ×個数・保管庫の個数・はみ出さない
//  BG-B2：旧セーブ（5種類5個のバッグ）を読み込む → 2枠＋保管庫（数と種類を失わない）・何度再読み込みしても同じ
//  BG-B3：Chapter 途中のセーブ（旧バッグが枠を超える）→ 再読み込みしても消えない・Chapter のアイテムは ×個数で1個ずつ減る
//  Playwright / Chromium が無い環境では省略（skip）する。
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
let L = null;
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });
const OPEN = [];
const openPage = async (o) => { const p = await L.open(o); OPEN.push(p); return p; };
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close().catch(() => {}); });
const SHOT = path.join(os.tmpdir(), 'mm-bag-1011');
const fit = (pg) => pg.evaluate(() => ({ sw: document.documentElement.scrollWidth, W: innerWidth, sh: document.scrollingElement.scrollHeight, H: innerHeight }));
const totals = (S) => { const t = {}; for (const it of S.inv.bag.concat(S.inv.vault)) t[it.id] = (t[it.id] || 0) + (Number.isInteger(it.n) && it.n >= 1 ? it.n : 1); return t; };

for (const size of [H.SIZES.base, H.SIZES.se]) {
  test(`BG-B1（${size.join('×')}）：出発準備とアイテム管理＝使える枠と🔒の枠・×個数・保管庫の個数`, { skip: SKIP }, async () => {
    const p = await openPage({ size }); const pg = p.page; mkdirSync(SHOT, { recursive: true });
    await H.newGame(pg, 'テスト');
    await pg.evaluate(() => { const m = mk(0); MMP7.ensureProg(m); S.m = MMP8.initIndividual(S, m); S.inv.bag = []; S.inv.vault = [{ id: 'herb', n: 13 }]; save(); prepScr(); });
    await pg.waitForSelector('.pp .ppslots');
    const slots = await pg.evaluate(() => [...document.querySelectorAll('.pp .ppslots .ppsl')].map((e) => ({ lock: e.classList.contains('lock'), on: e.classList.contains('on'), t: e.textContent.trim(), aria: e.getAttribute('aria-label') })));
    assert.equal(slots.length, 6, '6つの枠');
    assert.deepEqual(slots.map((s) => s.lock), [false, false, true, true, true, true], '未優勝は2枠');
    assert.deepEqual(slots.slice(2).map((s) => s.t), ['🔒', '🔒', '🔒', '🔒'], '2026-10-12 開発21（C-2）：未解放の枠は鍵だけ（「E・D」などの文字は出さない・読み上げの解放条件は残す）');
    assert.match(slots[2].aria, /E・D優勝で解放/);
    assert.match(await pg.textContent('.ppbagh'), /0 \/ 2枠/);
    assert.match(await pg.textContent('.ppvault'), /13個/);
    await pg.evaluate(() => ppVault(true));
    await pg.click('#ppvault .p7it button');
    await pg.waitForFunction(() => document.querySelectorAll('.pp .ppslots .ppsl.on').length === 1);
    assert.match(await pg.textContent('.pp .ppslots .ppsl.on'), /薬草\s*×10/);
    assert.match(await pg.textContent('.ppbagh'), /1 \/ 2枠/);
    assert.match(await pg.textContent('.ppvault'), /3個/);
    let f = await fit(pg); assert.ok(f.sw <= f.W + 1, `はみ出さない ${JSON.stringify(f)}`);
    await pg.evaluate(() => ppVault(false));
    await pg.screenshot({ path: path.join(SHOT, `${size[0]}_prep.png`) });
    // 実績で枠が増える（A 優勝＝6枠）
    await pg.evaluate(() => { for (let i = 0; i <= 4; i++) S.rankRec.cleared[i] = true; save(); itemScr(); });
    await pg.waitForSelector('.itemmg .imslots');
    const s2 = await pg.evaluate(() => [...document.querySelectorAll('.imslots .ppsl')].map((e) => e.classList.contains('lock')));
    assert.deepEqual(s2, [false, false, false, false, false, false]);
    assert.match(await pg.textContent('.itemmg'), /バッグ 10・保管庫 3/);
    f = await fit(pg); assert.ok(f.sw <= f.W + 1, `はみ出さない ${JSON.stringify(f)}`);
    await pg.screenshot({ path: path.join(SHOT, `${size[0]}_items.png`), fullPage: false });
    const S = await H.getS(pg); assert.deepEqual(totals(S), { herb: 13 }, '総数が同じ');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('BG-B2：旧セーブ（5種類5個のバッグ・Chapter 外）→ 2枠＋保管庫。数と種類を失わず、何度再読み込みしても同じ', { skip: SKIP }, async () => {
  const p0 = await openPage({}); const pg0 = p0.page;
  await H.newGame(pg0, 'テスト');
  const base = await pg0.evaluate(() => { const m = mk(0); MMP7.ensureProg(m); S.m = MMP8.initIndividual(S, m); S.inv.bag = [{ id: 'herb' }, { id: 'old1' }, { id: 'herb' }, { id: 'old2' }, { id: 'old3' }]; S.inv.vault = [{ id: 'herb' }]; return JSON.parse(JSON.stringify(S)); });
  await p0.ctx.close(); OPEN.splice(0);
  const p = await openPage({ save: base }); const pg = p.page;
  await pg.waitForFunction(() => S && S.m);
  const a = await H.getS(pg);
  assert.deepEqual(a.inv.bag, [{ id: 'herb', n: 2 }, { id: 'old1' }]);
  assert.deepEqual(a.inv.vault, [{ id: 'herb' }, { id: 'old2' }, { id: 'old3' }]);
  assert.deepEqual(totals(a), totals(base));
  await pg.evaluate(() => { save(); });
  for (let i = 0; i < 2; i++) { await pg.reload(); await pg.waitForFunction(() => typeof S === 'object' && S && S.m); }
  const b = await H.getS(pg);
  assert.equal(JSON.stringify(b.inv), JSON.stringify(a.inv), '再読み込みで変わらない');
  const st = await H.storedSave(pg); assert.equal(st.v, 6);
  assert.deepEqual(p.errors, []);
});

test('BG-B3：Chapter 途中のセーブ（旧バッグが枠を超える）→ 再読み込みでも消えない。Chapter のアイテムは ×個数で1個ずつ減る', { skip: SKIP }, async () => {
  const p = await openPage({}); const pg = p.page; mkdirSync(SHOT, { recursive: true });
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); MMP7.ensureProg(m); S.m = MMP8.initIndividual(S, m); save(); prepScr(); });
  await H.startRaising(pg);
  await pg.evaluate(() => { S.inv.bag = [{ id: 'a' }, { id: 'b' }, { id: 'herb' }, { id: 'herb' }, { id: 'herb' }]; S.m.raise.fatigue = 80; save(); });
  await pg.reload(); await pg.waitForFunction(() => typeof S === 'object' && S && S.m && MMP7.inChapter(S.m));
  const a = await H.getS(pg);
  assert.deepEqual(a.inv.bag, [{ id: 'a' }, { id: 'b' }, { id: 'herb', n: 3 }], 'Chapter 中は消さない・保管庫へ動かさない（まとめるだけ）');
  await pg.evaluate(() => board());
  await pg.waitForSelector('#brollbtn');
  await pg.waitForFunction(() => !(window.MMCHD && MMCHD.isLocked()) && !bBusy);
  await pg.evaluate(() => chfItems());
  await pg.waitForSelector('#chitems');
  assert.match(await pg.textContent('#chitems'), /薬草\s*×3/);
  await pg.screenshot({ path: path.join(SHOT, 'chapter_items.png') });
  await pg.click('#chitems button[onclick^="chfItemUse"]');
  await pg.waitForFunction(() => S.inv.bag.some((it) => it.id === 'herb' && it.n === 2));
  const b = await H.getS(pg);
  assert.equal(b.m.raise.fatigue, 50);
  assert.deepEqual(b.inv.bag, [{ id: 'a' }, { id: 'b' }, { id: 'herb', n: 2 }]);
  assert.deepEqual(p.errors, []);
});
