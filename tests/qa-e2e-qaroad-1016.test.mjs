// =========================================================
// 道路の描き方（近くの高い解像度の区画）の実ブラウザ確認。2026-10-16 の比較案（?qaRoad=1|2）から始まり、2026-10-19 に比較の URL を撤去
//   ＝Chapter 1 はいつも '1'（新素材の帯）・Chapter 2 はいつも '2'（白い橋帯）
//  QR-B1 Chapter 1 A × 3サイズ（フラグなし／撤去した ?qaRoad=2）：'1'・近くの区画（上限の枚数以内・32MB まで）・エラー／404・はみ出しなし
//  QR-B2 Chapter 2 A（390×844）（フラグなし／撤去した ?qaRoad=1）：'2'・近くの区画
//  QR-B3 フラグなし＝新素材＋近くの区画（32MB まで）
//  QR-B4 同じ出目なら、フラグなし・撤去した ?qaRoad=1／2 で止まる地点が同じ
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';
const skip = H.skipReason();
const SIZES = [[375, 667], [390, 844], [393, 852]];
const DICE = [3, 4, 2, 5];
async function settle(pg) {
  for (let i = 0; i < 200; i++) {
    if (await pg.$('.mmtalk:not(.mmtalk-out)')) { await H.finishTalk(pg); continue; }
    const st = await pg.evaluate(() => ({ busy: !!bBusy, fx: !!document.querySelector('.wbrelay,.wb-pop,.chf-enc2,.d3z,#bt,#tvs'), ph: MMP8.boardPhase(S.m) }));
    if (st.ph === 'branch' && !st.busy) { await pg.evaluate(() => { const b = document.querySelector('.wbbr .chroute'); if (b) b.click(); }); await pg.waitForTimeout(300); continue; }
    if (!st.busy && !st.fx) break;
    await pg.waitForTimeout(200);
  }
  await pg.waitForTimeout(900);
}
async function open(L, ch, q, size) {
  const p = await L.open({ worldCh1: true, worldCh2: true, route: 'A', route2: 'A', query: q, size });
  await p.page.waitForFunction((ch) => window.MMWB && MMWB.world() && MMWB.world().isReady() && S.m && S.m.raise && S.m.raise.ch === ch, ch, { timeout: 90000 });
  await p.page.evaluate(() => { S.m.raise.field.tiles = {}; board(); });
  await settle(p.page); return p;
}
async function roll(pg, n) { const nodes = []; for (let i = 0; i < n; i++) { if (await pg.evaluate(() => MMP8.boardPhase(S.m)) !== 'roll') break;
  await pg.evaluate((v) => { const mr = Math.random; Math.random = () => (v - 0.5) / 6; document.getElementById('brollbtn').click(); Math.random = mr; }, DICE[i % DICE.length]);
  await pg.waitForTimeout(400); await settle(pg); nodes.push(await pg.evaluate(() => S.m.raise.node)); } return nodes; }
const hiOf = (pg) => pg.evaluate(() => ({ q: MMWB.world().qaRoad(), dom: document.querySelectorAll('.rfw-hi').length }));

test('QR-B1：Chapter 1 A（3サイズ × フラグなし／撤去した ?qaRoad=2）＝いつも 1・近くの区画・エラーなし', { skip, timeout: 1800000 }, async () => {
  const L = await H.launch();
  try {
    for (const size of SIZES) for (const v of ['', '2']) {
      const tag = `${size.join('x')} ${v || 'フラグなし'}`, p = await open(L, 1, '?ch1trial=A' + (v ? `&qaRoad=${v}` : ''), size), pg = p.page;
      await roll(pg, 2); await pg.waitForTimeout(800);
      const h = await hiOf(pg);
      assert.equal(h.q.mode, '1', tag); const LIM = await pg.evaluate(() => ({ MAX: MMQAR.MAX, BYTES: MMQAR.BYTES })); assert.ok(h.q.tiles >= 1 && h.q.tiles <= 96 && h.q.bytes <= LIM.BYTES && h.q.pending === 0, `${tag}：${JSON.stringify(h.q)}`);   // 2026-10-20：遠くの区画は半分の細かさ＝枚数ではなくメモリの上限（MMQAR.BYTES）で決める assert.equal(h.dom, h.q.tiles);   // 2026-10-17 から新素材は 10px／単位・64単位の区画＝枚数の上限は MMQAR.MAX（メモリ 40MB）
      assert.ok(h.q.bytes <= 32 * 1048576, `${tag}：メモリの上限（本編の 32MB）${h.q.bytes}`);
      assert.equal(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, tag);
      assert.deepEqual(p.errors, [], tag); assert.deepEqual(p.bad, [], tag);
      await p.ctx.close();
    }
  } finally { await L.close(); }
});

test('QR-B2：Chapter 2 A（フラグなし／撤去した ?qaRoad=1）＝いつも 2', { skip, timeout: 900000 }, async () => {
  const L = await H.launch();
  try {
    for (const v of ['', '1']) {
      const p = await open(L, 2, '?ch2trial=A' + (v ? `&qaRoad=${v}` : ''), [390, 844]), pg = p.page; await roll(pg, 2); await pg.waitForTimeout(800);
      const h = await hiOf(pg); assert.equal(h.q.mode, '2', v); assert.ok(h.q.tiles >= 1 && h.q.pending === 0, JSON.stringify(h.q));
      assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
      await p.ctx.close();
    }
  } finally { await L.close(); }
});

test('QR-B3・B4：フラグなしで近くの区画（32MB まで）・撤去した ?qaRoad を付けても止まる地点は同じ', { skip, timeout: 1200000 }, async () => {
  const L = await H.launch();
  try {
    const seq = {};
    for (const v of ['', '1', '2']) {
      const p = await open(L, 1, '?ch1trial=A' + (v ? `&qaRoad=${v}` : ''), [390, 844]), pg = p.page;
      seq[v || '0'] = await roll(pg, DICE.length);
      { const h = await hiOf(pg); assert.equal(h.q && h.q.mode, '1', `${v}：いつも新素材＋近くの区画`); assert.ok(h.q.bytes <= 32 * 1048576, `32MB まで ${h.q.bytes}`); }
      await p.ctx.close();
    }
    assert.deepEqual(seq['1'], seq['0']); assert.deepEqual(seq['2'], seq['0']);
  } finally { await L.close(); }
});
