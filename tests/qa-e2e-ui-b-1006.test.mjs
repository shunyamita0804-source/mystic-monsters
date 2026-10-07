// =========================================================
// QA（実ブラウザ）：2026-10-06 共通UI（A2・A3・B1〜B3 のうち適用したもの）
//  UB-B1：セーブ／ロード・プロフィール・牧場・ステータス・研究所・市場が 4サイズで横にはみ出さない・画像が読める・縦横比が画像のまま
//  UB-B2：画像の上のボタンは従来どおり押せる（牧場の「見る」・研究所の「図鑑」・市場の矢印・セーブ）
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
// 2026-10-07：牧場・研究所の下のコマンドは1つずつ正式画像（assets/ui/cmd/。data-cmd）＝ボタンごとに確かめる
const SCR = { save: 'savescr()', profile: 'profileScr()', ranch: 'farm()', status: "hall('st')", lab: 'museum()', market: 'market()' };
const PART = { save: ['.svs .card.slot', 720 / 178], profile: ['.pfprof .pfhead', 720 / 443], ranch: ['.rn2 nav.rnact .rna[data-cmd="ranch_look"]', 0], status: ['.sts .stskill', 0], lab: ['.lab nav.labnav .labc[data-cmd="lab_book"]', 0], market: ['.p10mk .p10arw.next', 0] };

async function setup(pg) {
  await H.newGame(pg, 'ユウ');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; const b = mk(1); b.name = 'ガウ'; S.box = [b]; save(); });
}

for (const size of [[360, 800], [375, 667], [390, 844], [414, 896]]) {
  T(`UB-B1（${size.join('×')}）：6画面で横にはみ出さない・正式画像が読める・縦横比のまま`, async () => {
    const p = await openPage({ size }); const pg = p.page; await setup(pg);
    for (const [k, js] of Object.entries(SCR)) {
      await pg.evaluate(js); await pg.waitForTimeout(700); await H.finishTalk(pg).catch(() => {});
      const [sel, ar] = PART[k];
      await pg.waitForSelector(sel);
      const r = await pg.evaluate(async ({ sel }) => {
        const e = document.querySelector(sel), cs = getComputedStyle(e), b = e.getBoundingClientRect();
        const url = (cs.backgroundImage.match(/url\("?([^")]+)"?\)/) || cs.borderImageSource.match(/url\("?([^")]+)"?\)/) || [])[1];
        const ok = url ? await new Promise((res) => { const i = new Image(); i.onload = () => res(i.naturalWidth > 0); i.onerror = () => res(false); i.src = url; }) : false;
        return { url, ok, ratio: b.width / b.height, sw: document.documentElement.scrollWidth, left: b.left, right: b.right };
      }, { sel });
      assert.ok(r.ok, `${k}：画像 ${r.url}`); assert.equal(r.sw, size[0], `${k}：横にはみ出さない`); assert.ok(r.left >= -1 && r.right <= size[0] + 1, `${k}：画面の中`);
      if (ar) assert.ok(Math.abs(r.ratio - ar) < 0.05, `${k}：縦横比 ${r.ratio} ≒ ${ar}`);
    }
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

T('UB-B2：画像の上のボタンは従来どおり押せる（牧場の見る・研究所の図鑑・市場の矢印・セーブ）', async () => {
  const p = await openPage({ size: [390, 844] }); const pg = p.page; await setup(pg);
  await pg.evaluate(() => farm()); await pg.waitForSelector('.rn2 nav.rnact'); await H.finishTalk(pg).catch(() => {});
  await pg.click('.rn2 nav.rnact .rna:nth-child(1)'); await pg.waitForTimeout(500);
  assert.ok(await pg.evaluate(() => !!document.querySelector('.rn2 .rnsheet, .rn2 .rnview, .rn2 .rnrhd')), '見る＝詳細');
  await pg.evaluate(() => museum()); await pg.waitForSelector('.lab nav.labnav'); await H.finishTalk(pg).catch(() => {});
  await pg.click('.lab nav.labnav .labc:nth-child(1)'); await pg.waitForTimeout(600);
  assert.ok(await pg.evaluate(() => !!document.querySelector('.lab nav.labnav .labc.on:nth-child(1)')), '図鑑が開く');
  await pg.evaluate(() => market()); await pg.waitForSelector('.p10mk .p10arw.next'); await H.finishTalk(pg).catch(() => {});
  await pg.waitForTimeout(500); const k0 = await pg.evaluate(() => P10_MK);
  await pg.click('#p10car .p10arw.next'); await pg.waitForFunction(() => !P10_ANIM);
  assert.notEqual(await pg.evaluate(() => P10_MK), k0, '次のモンスター');
  await pg.evaluate(() => savescr()); await pg.waitForSelector('.svs .card.slot'); await pg.waitForTimeout(450);
  await pg.locator('.svs .card.slot .row2 button').first().click(); await pg.waitForTimeout(400);
  assert.match(await pg.evaluate(() => document.querySelector('.svs #msg').textContent), /スロット1にセーブしました/);
  assert.match(await pg.evaluate(() => document.querySelector('.svs .card.slot .svpic img')?.getAttribute('src') || ''), /assets\/monsters\/solamo/, 'スロットの四角に連れている子');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
