// =========================================================
// 2026-10-14 Chapter 1 進入時のクラッシュ対策（実ブラウザ・本編の Chapter 1＝worldCh1:true・開始の俯瞰あり＝intro:true）
//  CR14-B1（375×667・390×844）：実際の出発 → 題字 → 全景 → START。寄る間はマス・景物の幅が縮んでいる（層の大きさの合計が小さい）・
//          俯瞰の間は will-change なし → 寄り終わったら幅は決まった base に戻り・見えているマス・景物は will-change:transform・エラーなし
//  Playwright / Chromium が無い環境では省略（skip）する。
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
let L = null;
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });

for (const size of [[375, 667], [390, 844]]) {
  test(`CR14-B1（${size.join('×')}）：寄る間は縮めた幅・終わったら base に戻る`, { skip: SKIP, timeout: 180000 }, async () => {
    const p = await L.open({ worldCh1: true, intro: true, size }); const pg = p.page;
    try {
      await H.newGame(pg, 'テスト');
      await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); prepScr(); });
      await pg.waitForSelector('.pp .ppgobtn'); await pg.waitForTimeout(300);
      await pg.click('#app button[onclick="p7Depart(this)"]'); await pg.waitForSelector('.mmtalk');
      assert.ok(await H.chooseTalk(pg, 'start')); await H.finishTalk(pg);
      await pg.waitForFunction(() => document.querySelectorAll('#wbw .rfw-tile').length > 0 && document.getAnimations().filter((a) => a.effect && a.effect.target && a.effect.target.matches && a.effect.target.matches('.rfw-tile,.rfw-prop')).length > 300, null, { timeout: 40000 });
      const mid = await pg.evaluate(() => {
        const els = document.getAnimations().map((a) => a.effect && a.effect.target).filter((e) => e && e.matches && e.matches('.rfw-tile,.rfw-prop'));
        const area = els.reduce((s, e) => s + e.offsetWidth * e.offsetHeight, 0);
        return { n: els.length, area, resized: MMWB.world().state().introResized, wc: getComputedStyle(els[0]).willChange, intro: document.querySelector('#wbw .rfw').classList.contains('intro') };
      });
      assert.ok(mid.resized > 400, `寄る間に縮めた要素の数 ${mid.resized}`);
      assert.ok(mid.area < 400000, `寄る間の要素の大きさの合計（px²）${mid.area}＝決まった base のままなら数百万`);
      assert.deepEqual([mid.intro, mid.wc], [true, 'auto'], '俯瞰の間は will-change なし');
      await pg.waitForFunction(() => !MMWB.state().intro && !document.querySelector('.wbrelay') && document.querySelector('#brollbtn:not([disabled])'), null, { timeout: 40000 });
      await pg.waitForTimeout(400);
      const end = await pg.evaluate(() => {
        const tiles = [...document.querySelectorAll('#wbw .rfw-tile')], vis = [...document.querySelectorAll('#wbw .rfw-tile, #wbw .rfw-prop')].filter((e) => getComputedStyle(e).display !== 'none');
        return { tileW: [...new Set(tiles.map((t) => t.style.width))], small: [...document.querySelectorAll('#wbw .rfw-prop')].filter((e) => parseFloat(e.style.width) < 8).length,
          vis: vis.length, wc: [...new Set(vis.map((e) => getComputedStyle(e).willChange))], anims: document.getAnimations().filter((a) => a.effect && a.effect.target && a.effect.target.matches && a.effect.target.matches('.rfw-tile,.rfw-prop')).length };
      });
      assert.deepEqual(end.tileW, ['84px'], 'マスの幅は決まった base（84px）に戻る');
      assert.equal(end.small, 0, '景物の幅も base に戻る（8px 未満の景物なし）');
      assert.ok(end.vis > 5 && end.vis < 120, `寄り終わりに見えている要素 ${end.vis}`);
      assert.deepEqual(end.wc, ['transform'], '追従の間は will-change:transform');
      assert.equal(end.anims, 0, '寄るアニメーションは片付いている');
      assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
    } finally { await p.ctx.close().catch(() => {}); }
  });
}
