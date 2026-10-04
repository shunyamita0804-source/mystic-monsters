// =========================================================
// QA（実ブラウザ）：2026-10-04 PHASE G（実機試遊の違和感の修正）
//  G-A：新しいゲーム → プロローグの途中で終了（再読み込み）→ 次に開いてもプロローグが出る（「見た」の記録は最後まで見たときだけ）
//  G-B：プロローグの文章は1文字ずつのタイプ表示をしない（各行は最初から全文・下から入って上へ流れる）
//  G-C：開始ボタン → プロローグの間に、旧い見出し（金枠の「ミスティックモンスターズ」）が1フレームも見えない
//  ほかの項目（D〜M）は、同じファイルの後ろに足す
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
const T = (name, fn) => test(name, { skip: SKIP }, fn);
const SIZES = [[390, 844], [375, 667]];

/** 毎フレーム、旧い見出し（h1）が画面に見えているかを記録する（全画面の幕に覆われているときは数えない） */
const watchH1 = (pg) => pg.evaluate(() => {
  window.__h1 = []; const cover = '.mmpro,.p11cover,.tveil.on,.mmtscr,.p11reg';
  const tick = () => {
    const h = document.querySelector('h1'); const vis = !!h && getComputedStyle(h).display !== 'none' && h.getBoundingClientRect().height > 0;
    if (vis && !document.querySelector(cover)) window.__h1.push(performance.now());
    if (window.__h1w !== false) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

for (const size of SIZES) {
  T(`G-A（${size.join('×')}）：プロローグの途中で終了 → 再読み込み → 開始ボタン → プロローグがもう一度出る（見た記録は付かない）`, async () => {
    const p = await openPage({ size, prologue: true }); const pg = p.page;
    await pg.click('.p15start');
    await pg.waitForSelector('.mmpro .mmpro-nar p.on', { timeout: 20000 });
    await pg.waitForTimeout(1800);
    const mid = await H.storedSave(pg);
    assert.ok(mid && mid.playerNamePending, '新しいゲームは保存済み（名前はまだ）');
    assert.ok(!(mid.npcFlags && mid.npcFlags.prologue), '途中では「見た」を保存しない');
    await pg.reload(); await pg.waitForFunction(() => typeof window.MMP8 === 'object' && typeof S === 'object');
    await pg.click('.p15start');
    await pg.waitForSelector('.mmpro .mmpro-nar p.on', { timeout: 20000 });
    assert.equal(await pg.evaluate(() => !!document.querySelector('#p11nm')), false, '名前登録へ飛ばない');
    // 最後まで（スキップの確定）→ 記録
    await pg.click('.mmpro-skip'); await pg.waitForTimeout(400); await pg.click('.mmpro-skip');
    await pg.waitForSelector('#p11nm', { timeout: 20000 });
    assert.equal((await H.storedSave(pg)).npcFlags.prologue, 1, 'スキップを確定したら記録');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });

  T(`G-B・G-C（${size.join('×')}）：タイプ表示なし（行は最初から全文・下から入って上へ）。開始 → プロローグの間に旧い見出しが出ない`, async () => {
    const p = await openPage({ size, prologue: true }); const pg = p.page;
    await watchH1(pg);
    await pg.click('.p15start');
    await pg.waitForSelector('.mmpro .mmpro-nar p', { timeout: 20000 });
    // 各行の文字と位置を細かく記録する
    const log = await pg.evaluate(async () => {
      const out = []; const t0 = performance.now();
      while (performance.now() - t0 < 5200) {
        const ps = [...document.querySelectorAll('.mmpro .mmpro-nar p')];
        out.push(ps.map((q) => ({ t: q.textContent, y: q.getBoundingClientRect().top })));
        await new Promise((r) => requestAnimationFrame(r));
      }
      return out;
    });
    const page0 = log.filter((f) => f.length && f[0].t === log[0][0].t);
    const full = page0[0].map((x) => x.t);
    for (const f of page0) f.forEach((x, i) => assert.equal(x.t, full[i], `行 ${i} は最初から全文（タイプ表示なし）`));
    const H0 = size[1];
    const first = page0.map((f) => f[0].y);
    assert.ok(first[0] >= H0 * 0.9, `1行目は画面の下の外で待つ（${Math.round(first[0])}）`);
    const minY = Math.min(...first);
    assert.ok(minY < H0 * 0.66 && minY > H0 * 0.2, `下から上へ流れ、中央より上まで上がる（${Math.round(minY)}）`);
    for (let i = 1; i < first.length; i++) assert.ok(first[i] <= first[i - 1] + 0.5, '1行目は上へ動くだけ（戻らない）');
    await pg.evaluate(() => { window.__h1w = false; });
    assert.deepEqual(await pg.evaluate(() => window.__h1), [], '旧い見出し（h1）は1フレームも見えない');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}
