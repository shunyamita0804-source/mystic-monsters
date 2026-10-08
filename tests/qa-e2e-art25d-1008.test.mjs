// =========================================================
// 2026-10-08：2.5D バトル素材の比較試遊（実ブラウザ）
//  A25-B1：通常の URL＝今までの立ち絵・技の演出（新しい絵を1枚も読まない・切り替えの札なし）
//  A25-B2：?battleArt=2p5d（3サイズ）＝ソラモ・ガウルの立ち絵が 2.5D・技のコマが出て消える（DOM を残さない）・札で旧へ戻せる・相手は今まで
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

async function toBattle(pg, sp) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate((sp) => { const m = mk(sp); m.name = 'テスト'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); board(); }, sp);
  await pg.waitForSelector('#chrcv .rcv-row', { timeout: 20000 });
  await pg.evaluate((sp) => { MMP8.startTournament(S, S.m, 0, 7); S.m.sk = sp ? [10, 11, 12, 13, 14, 15, 16, 17, 18, 19] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; S.m.eq = S.m.sk.slice(0, 6); save(); p8TourFight(); }, sp);
  await pg.waitForSelector('#bt #m0 .mon .mma-idle', { timeout: 20000 });
  await pg.waitForTimeout(300);
}
const idleSrc = (pg, s) => pg.evaluate((s) => { const i = document.querySelector(`#bt #m${s} .mon .mma-idle`); return i && i.getAttribute('src'); }, s);

test('A25-B1：通常の URL では今までの絵・演出（2.5D の素材を読まない・札なし）', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({ size: H.SIZES.base }); const pg = p.page;
  await toBattle(pg, 0);
  assert.match(await idleSrc(pg, 0), /assets\/battle\/idle\/idle_soramo\.webp$/);
  await pg.evaluate(() => anim(0, 0)); await pg.waitForTimeout(500);
  const r = await pg.evaluate(() => ({ p25: document.querySelectorAll('#bt .p25f').length, sw: !!document.querySelector('#bt .p25sw'), on: MM25D.on }));
  assert.deepEqual(r, { p25: 0, sw: false, on: false });
  assert.equal(L.requests ? L.requests.filter((u) => /2p5d/.test(u)).length : 0, 0, '2.5D の素材を読まない');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

for (const size of [H.SIZES.base, H.SIZES.se, [430, 932]]) {
  for (const sp of [0, 1]) {
    test(`A25-B2（${size.join('×')}・${sp ? 'ガウル' : 'ソラモ'}）：?battleArt=2p5d の立ち絵・技のコマ・切り替え`, { skip: SKIP, timeout: 120000 }, async () => {
      const p = await openPage({ size, query: '?battleArt=2p5d' }); const pg = p.page;
      await toBattle(pg, sp);
      const name = sp ? 'gauru' : 'soramo';
      assert.match(await idleSrc(pg, 0), new RegExp(`assets/battle/2p5d/${name}/idle\\.webp$`));
      const k = sp ? 11 : 0;
      await pg.evaluate((k) => anim(k, 0), k);
      await pg.waitForTimeout(450);
      const mid = await pg.evaluate(() => { const im = [...document.querySelectorAll('#bt .p25f')]; const bt = document.getElementById('bt').getBoundingClientRect();
        const vis = im.filter((i) => +getComputedStyle(i).opacity > 0.5); const r = vis[0] && vis[0].getBoundingClientRect();
        return { n: im.length, vis: vis.length, ok: im.every((i) => i.complete && i.naturalWidth > 0), r: r && { l: r.left, r: r.right, t: r.top, b: r.bottom }, W: bt.width, sw: document.documentElement.scrollWidth, iw: innerWidth }; });
      assert.ok(mid.n >= 3 && mid.vis >= 1 && mid.ok, `コマが出ている ${JSON.stringify(mid)}`);
      assert.ok(mid.sw <= mid.iw + 1, '横にはみ出さない');
      await pg.waitForTimeout(2300);
      assert.equal(await pg.evaluate(() => document.querySelectorAll('#bt .p25f').length), 0, '終わったら DOM を残さない');
      // 切り替えの札 → 旧の立ち絵 → もう一度 2.5D
      await pg.click('#bt .p25sw');
      assert.match(await idleSrc(pg, 0), new RegExp(`assets/battle/idle/idle_${name}\\.webp$`));
      await pg.evaluate((k) => anim(k, 0), k); await pg.waitForTimeout(400);
      assert.equal(await pg.evaluate(() => document.querySelectorAll('#bt .p25f').length), 0, '旧へ戻すと今までの演出');
      await pg.waitForTimeout(1800);
      await pg.click('#bt .p25sw');
      assert.match(await idleSrc(pg, 0), /2p5d/);
      assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
    });
  }
}
