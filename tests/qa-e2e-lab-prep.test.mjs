// =========================================================
// QA（実ブラウザ）：第二段階 PHASE C（2026-10-04）：研究所（図鑑・合体・配合表）と出発準備
//  LP-B1：研究所 → 図鑑（2列・近日公開）→ 詳細（ゲージ）→ 配合表 → 合体。390×844・375×667 で横にはみ出さず、ページは伸びない
//  LP-B2：出発準備：6つの枠（2026-10-11：未優勝は2枠＋🔒）・保管庫のシート・Chapter のカード・「出発する」→ フィナの確認（従来の出発）
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
const SHOT = path.join(os.tmpdir(), 'mm-lab-prep');
const fit = (pg) => pg.evaluate(() => ({ sw: document.documentElement.scrollWidth, W: innerWidth, sh: document.scrollingElement.scrollHeight, H: innerHeight, app: document.querySelector('#app').scrollHeight, appH: document.querySelector('#app').clientHeight }));

for (const size of [H.SIZES.base, H.SIZES.se]) {
  test(`LP-B1（${size.join('×')}）：研究所 → 図鑑（2列・No.・正式画像・ノビトンは近日公開）→ 詳細（999 を最大としたゲージ・成長適性）→ 配合表 → 合体（2体以上が必要）`, { skip: SKIP }, async () => {
    const p = await openPage({ size }); const pg = p.page; mkdirSync(SHOT, { recursive: true });
    await H.newGame(pg, 'テスト');
    await pg.evaluate(() => { const m = mk(0); MMP7.ensureProg(m); S.m = m; save(); lobby(); });
    await pg.click('.tpin[onclick="museum()"]'); await pg.waitForSelector('.lab .labnav');
    assert.deepEqual(await pg.evaluate(() => [...document.querySelectorAll('.labnav .labc b')].map((b) => b.textContent)), ['図鑑', '合体', '配合表']);
    assert.doesNotMatch(await pg.textContent('.lab'), /特殊復元|研究・記録・復元/);
    let f = await fit(pg); assert.ok(f.sw <= f.W + 1 && f.sh <= f.H + 1, `入口：はみ出さない ${JSON.stringify(f)}`);
    await pg.click('.labnav .labc:nth-child(1)'); await pg.waitForSelector('.lbk .lbgrid');
    const cards = await pg.evaluate(() => [...document.querySelectorAll('.lbgrid .lbc')].map((c) => ({ no: c.querySelector('.lbno').textContent, nm: c.querySelector('.lbnm').textContent, img: c.querySelector('img') ? c.querySelector('img').getAttribute('src') : null, lk: c.classList.contains('lk'), w: c.getBoundingClientRect().width, x: c.getBoundingClientRect().left })));
    assert.deepEqual(cards.map((c) => [c.no, c.nm, c.lk]), [['No.001', 'ソラモ', false], ['No.002', 'ガウル', false], ['No.003', 'ノビトン', true]]);
    assert.match(cards[0].img, /assets\/monsters\/2p5d\/solamo\.webp$/); assert.match(cards[1].img, /assets\/monsters\/2p5d\/gauru\.webp$/); assert.equal(cards[2].img, null);
    assert.ok(Math.abs(cards[0].w - cards[1].w) < 1 && cards[1].x > cards[0].x + cards[0].w - 1, '2列');
    assert.match(await pg.textContent('.labplq'), /発見 2 \/ 3/);
    f = await fit(pg); assert.ok(f.sw <= f.W + 1 && f.sh <= f.H + 1, `図鑑：ページは伸びない ${JSON.stringify(f)}`);
    await pg.screenshot({ path: path.join(SHOT, `${size[0]}_book.png`) });
    await pg.click('.lbgrid .lbc:nth-child(2)'); await pg.waitForSelector('.lbd .lbsts');
    const st = await pg.evaluate(() => [...document.querySelectorAll('.lbst')].map((r) => ({ k: r.querySelector('.lbsk').textContent, w: parseFloat(r.querySelector('.lbg i').style.width), v: +r.querySelector('b').textContent, g: r.querySelector('.lbgr').textContent })));
    assert.deepEqual(st.map((r) => [r.k, r.v, r.g]), [['ライフ', 80, 'D'], ['ちから', 110, 'B'], ['かしこさ', 110, 'B'], ['命中', 90, 'C'], ['回避', 90, 'B'], ['丈夫さ', 60, 'E']], 'ガウルの基礎能力と成長適性');
    for (const r of st) assert.equal(r.w, Math.round(r.v / 999 * 100), `${r.k}：ゲージは 999 を 100% とする`);
    assert.match(await pg.textContent('.lbd'), /鳥種/); assert.equal(await pg.evaluate(() => document.querySelectorAll('.lbd img.pcard').length), 0);
    await pg.screenshot({ path: path.join(SHOT, `${size[0]}_detail.png`) });
    await pg.click('.lbd .dback'); await pg.waitForSelector('.lbk');
    await pg.click('.labnav .labc:nth-child(3)'); await pg.waitForSelector('.lbt .lbtr');
    assert.deepEqual(await pg.evaluate(() => [...document.querySelectorAll('.lbtr')].map((r) => r.textContent.replace(/\s+/g, ''))), ['ソラモ×ソラモ→ソラモ', 'ソラモ×ガウル→ソラモ', 'ガウル×ソラモ→ガウル', 'ガウル×ガウル→ガウル']);
    await pg.click('.labnav .labc:nth-child(2)'); await pg.waitForSelector('.lbf .wpanel');
    assert.match(await pg.textContent('.lbf .wpanel'), /合体には2体以上必要です/);
    f = await fit(pg); assert.ok(f.sw <= f.W + 1 && f.sh <= f.H + 1);
    await pg.click('.lbf .dback'); await pg.waitForSelector('.lab .labnpc');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });

  test(`LP-B2（${size.join('×')}）：出発準備：育成中モンスター・Chapter の札・バッグ5スロット・保管庫のシート・Chapter 1 のカード・「出発する」→ フィナの確認（従来の出発）`, { skip: SKIP }, async () => {
    const p = await openPage({ size }); const pg = p.page; mkdirSync(SHOT, { recursive: true });
    await H.newGame(pg, 'テスト');
    await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; S.inv.vault.push({ id: 'qa_item' }); S.inv.bag = []; save(); prepScr(); });   // 2026-10-06：新人支援の薬草（バッグ）は外して空のバッグで確かめる
    await pg.waitForSelector('.pp .ppslots');
    const r = await pg.evaluate(() => ({ slots: document.querySelectorAll('.ppsl').length, lock: document.querySelectorAll('.ppsl.lock').length, on: document.querySelectorAll('.ppsl.on').length, name: document.querySelector('.ppname b').textContent, img: document.querySelector('.ppmon img').getAttribute('src'), ch: document.querySelector('.ppch').textContent.replace(/\s+/g, ''), card: document.querySelector('.ppcin').textContent.replace(/\s+/g, ''), art: getComputedStyle(document.querySelector('.ppart')).backgroundImage, go: document.querySelector('.ppgobtn').textContent.replace(/\s+/g, ''), goOn: !document.querySelector('.ppgobtn').disabled, sheet: document.querySelector('#ppvault').hidden }));
    assert.equal(r.slots, 6, '2026-10-11：6つの枠（未優勝は2枠＋🔒の4枠）'); assert.equal(r.lock, 4); assert.equal(r.on, 0); assert.equal(r.name, 'ソラ'); assert.match(r.img, /assets\/monsters\/2p5d\/solamo\.webp$/);
    assert.match(r.ch, /CHAPTER1はじまりの草原/); assert.match(r.card, /^CHAPTER1はじまりの草原/); assert.match(r.art, /ch1_intro_overview\.webp/); assert.match(r.go, /^出発する/); assert.equal(r.goOn, true); assert.equal(r.sheet, true);
    let f = await fit(pg); assert.ok(f.sw <= f.W + 1 && f.sh <= f.H + 1, `はみ出さない ${JSON.stringify(f)}`);
    await pg.screenshot({ path: path.join(SHOT, `${size[0]}_prep.png`) });
    // 空きスロット → 保管庫のシート → バッグへ → スロットが埋まる → タップで保管庫へ戻す
    await pg.click('.ppsl:nth-child(1)'); await pg.waitForFunction(() => !document.querySelector('#ppvault').hidden);
    assert.match(await pg.textContent('#ppvault'), /qa_item/);
    await pg.click('#ppvault .p7it button'); await pg.waitForSelector('.ppsl.on');
    assert.deepEqual(await pg.evaluate(() => [S.inv.bag.length, S.inv.vault.length, document.querySelector('.ppsl.on b').textContent]), [1, 0, 'qa_item']);
    await pg.click('.ppsl.on'); await pg.waitForFunction(() => !document.querySelector('.ppsl.on'));
    assert.deepEqual(await pg.evaluate(() => [S.inv.bag.length, S.inv.vault.length]), [0, 1]);
    await pg.evaluate(() => { S.inv.vault = []; save(); prepScr(); }); await pg.waitForSelector('.pp .ppslots');
    await H.startRaising(pg); await pg.waitForSelector('#chf .chf-bg', { timeout: 20000 });
    assert.equal(await pg.evaluate(() => MMP7.raiseState(S.m)), 'board', '「出発する」から従来の出発（フィナの確認 → ボード）');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

// 2026-10-14 実機試遊 Q06：3つの機能の一言（.labhint）が実際に見える（研究所の背景 .labbg＝absolute の下に隠れていた＝play47b で修正）
for (const size of [H.SIZES.base, H.SIZES.se, H.SIZES.max]) {
  test(`LP-B3（${size.join('×')}）：研究所の3つの機能の一言が見える（背景の下に隠れない・会話窓と下のボタンに重ならない・画面の中）`, { skip: SKIP }, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await H.newGame(pg, 'テスト');
    await pg.evaluate(() => { const m = mk(1); MMP7.ensureProg(m); S.m = m; save(); museum(); });
    await pg.waitForSelector('.lab .labhint span'); await pg.waitForTimeout(900);
    const r = await pg.evaluate(() => {
      const R = (e) => { const b = e.getBoundingClientRect(); return { t: b.top, b: b.bottom, l: b.left, r: b.right }; };
      const spans = [...document.querySelectorAll('.lab .labhint span')];
      const hint = document.querySelector('.lab .labhint'), pe = hint.style.pointerEvents; hint.style.pointerEvents = 'auto';   // 押せない札（pointer-events:none）でも、いちばん上に描かれているかを確かめる
      const top = spans.map((s) => { const b = s.getBoundingClientRect(), e = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); return !!(e && (e === s || s.contains(e))); });
      hint.style.pointerEvents = pe;
      const lines = spans.map((s) => Math.round(s.getBoundingClientRect().height / parseFloat(getComputedStyle(s).lineHeight)));
      const nav = document.querySelector('.lab .labnav'), nst = document.querySelector('.lab .nst .nstw') || document.querySelector('.lab .nst');
      return { text: spans.map((s) => s.textContent), top, lines, hint: R(document.querySelector('.lab .labhint')), nav: R(nav), talk: nst ? R(nst) : null, W: innerWidth, H: innerHeight };
    });
    assert.deepEqual(r.text, ['出会った子の記録', '育てた2体を合体', '合体の組み合わせ']);
    assert.deepEqual(r.top, [true, true, true], `一言がいちばん上に見える ${JSON.stringify(r)}`);
    assert.ok(r.lines.every((n) => n <= 1), `一言は1行（語の途中で折り返さない） ${JSON.stringify(r)}`);
    assert.ok(r.hint.b <= r.nav.t + 0.5, `下のボタンに重ならない ${JSON.stringify(r)}`);
    if (r.talk) assert.ok(r.talk.b <= r.hint.t + 0.5, `会話窓に重ならない ${JSON.stringify(r)}`);
    assert.ok(r.hint.t >= 0 && r.hint.b <= r.H && r.hint.l >= 0 && r.hint.r <= r.W + 0.5, `画面の中 ${JSON.stringify(r)}`);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}
