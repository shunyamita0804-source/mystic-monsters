// =========================================================
// 2026-10-12 ガウルの正式の技アニメ（最終調整版の95枚）＝実際のバトル（実ブラウザ・通常の URL）
//  GM-B1（390×844・375×667）：公式ランク戦（共通演出あり）でガウルが勝つまで＝発動した技とコマ（本体・同じ切り出しの効果の層・着弾・特殊エフェクト）が一致・
//         自分側は反転なし・技のあと待機の姿に戻る・コマは残らない・待機の立ち絵は今まで・404 なし
//  GM-B2：相手側のガウル＝コマは左右反転・自分のソラモは従来の46コマ
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

/** 技の演出の記録：animRaw(k, s) の呼び出しと、そのあと出たコマ（data-cut）・向き */
const RECORD = () => {
  window.__mv = [];
  const o = window.animRaw; window.animRaw = function (k, s) { window.__mv.push({ k, s, cuts: [], flip: [], t: performance.now() }); return o.apply(this, arguments); };
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => {
    if (n.nodeType !== 1 || !n.classList.contains('p25f')) return; const r = window.__mv[window.__mv.length - 1]; if (!r) return;
    r.cuts.push(n.dataset.cut); requestAnimationFrame(() => r.flip.push(/scaleX\(-1\)|matrix\(-/.test(n.style.transform + ' ' + getComputedStyle(n).transform)));
  }))).observe(document.body, { childList: true, subtree: true });
};
async function fightToEnd(pg, maxMs = 240000) {
  const t0 = Date.now(); const backs = [];
  while (Date.now() - t0 < maxMs) {
    const s = await pg.evaluate(() => { const g = document.getElementById('go'); return { bt: !!document.getElementById('bt'), back: !!g && g.classList.contains('bk'), can: !!g && !g.disabled }; });
    if (!s.bt) return backs;
    // 技の演出が終わって次の番になったら、自分側の待機の姿は見えている
    if (s.can) backs.push(await pg.evaluate(() => +getComputedStyle(document.getElementById('m0')).opacity));
    if (s.back) { await pg.click('#go'); await pg.waitForTimeout(600); continue; }
    if (s.can) await pg.click('#go').catch(() => {});
    await pg.waitForTimeout(300);
  }
  throw new Error('バトルが終わらない');
}
const checkMoves = (mv, D, side, want) => {
  const mine = mv.filter((r) => r.s === side && r.k >= 10 && r.k <= 19);
  assert.ok(mine.length >= want, `ガウルの技が ${mine.length} 回（${JSON.stringify(mv.map((r) => [r.k, r.s]))}）`);
  for (const r of mine) {
    const d = D[r.k], files = d.cuts.map((c) => c.src).concat(d.cuts.filter((c) => c.fx).map((c) => c.src + '_fx'), d.fx.map((c) => c.src));
    assert.ok(r.cuts.length === files.length, `技 ${r.k}（${d.name}）：コマ ${r.cuts.length}/${files.length}`);
    assert.deepEqual([...r.cuts].sort(), [...files].sort(), `技 ${r.k} のコマ＝その技の絵だけ`);
    assert.ok(r.flip.every((f) => f === (side === 1)), `技 ${r.k}：向き（相手側だけ反転）`);
  }
};

for (const size of [H.SIZES.base, H.SIZES.se]) {
  test(`GM-B1（${size.join('×')}）：公式ランク戦でガウルの技＝発動した技とコマが一致・待機に戻る`, { skip: SKIP, timeout: 300000 }, async () => {
    const p = await openPage({ size, stage: true }); const pg = p.page;
    await H.newGame(pg, 'テスト');
    await pg.evaluate(() => { const m = mk(1); m.name = 'ガウ'; Object.assign(m, { li: 500, po: 260, in: 260, hi: 300, ev: 200, de: 300 }); MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); board(); });
    await pg.waitForSelector('#chrcv .rcv-row', { timeout: 20000 });
    await pg.evaluate((eq) => { MMP8.startTournament(S, S.m, 0, 7); S.m.sk = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19]; S.m.eq = eq; save(); }, size === H.SIZES.base ? [19, 18, 17, 15, 16, 13] : [10, 11, 12, 14, 19, 18]);
    await pg.evaluate(RECORD);
    await pg.evaluate(() => { const o = window.battleFoeOnce; window.battleFoeOnce = () => o(1); p8TourFight(); });
    await pg.waitForSelector('#bt #m0 .mon .mma-idle', { timeout: 20000 });
    assert.match(await pg.evaluate(() => document.querySelector('#bt #m0 .mon .mma-idle').getAttribute('src')), /assets\/battle\/idle\//, '待機の立ち絵は今まで');
    const backs = await fightToEnd(pg);
    const { mv, D } = await pg.evaluate(() => ({ mv: window.__mv, D: MMGAMV_DATA }));
    checkMoves(mv, D, 0, 1);
    assert.ok(backs.length && backs.every((o) => o > 0.95), `次の番では待機の姿（${backs}）`);
    assert.equal(await pg.evaluate(() => document.querySelectorAll('.p25f').length), 0, 'コマは残らない');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('GM-B2：相手側のガウル＝コマは左右反転・自分のソラモは46コマ', { skip: SKIP, timeout: 300000 }, async () => {
  const p = await openPage({ size: H.SIZES.base, stage: true }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; Object.assign(m, { li: 900, po: 60, in: 60, hi: 60, ev: 60, de: 400 }); MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); board(); });
  await pg.waitForSelector('#chrcv .rcv-row', { timeout: 20000 });
  await pg.evaluate(() => { MMP8.startTournament(S, S.m, 0, 7); save(); });
  await pg.evaluate(RECORD);
  await pg.evaluate(() => { const o = window.battleFoeOnce; window.battleFoeOnce = () => o(1); p8TourFight(); });
  await pg.waitForSelector('#bt #m1 .mon', { timeout: 20000 });
  assert.equal(await pg.evaluate(() => BPL[1].sp), 1, '相手はガウル');
  const t0 = Date.now();
  while (Date.now() - t0 < 200000) {
    const n = await pg.evaluate(() => window.__mv.filter((r) => r.s === 1 && r.k >= 10 && r.k <= 19).length);
    const s = await pg.evaluate(() => { const g = document.getElementById('go'); return { bt: !!document.getElementById('bt'), back: !!g && g.classList.contains('bk'), can: !!g && !g.disabled }; });
    if (!s.bt || n >= 3) break;
    if (s.back) { await pg.click('#go'); await pg.waitForTimeout(600); continue; }
    if (s.can) await pg.click('#go').catch(() => {});
    await pg.waitForTimeout(300);
  }
  await pg.waitForTimeout(3000);
  const { mv, D } = await pg.evaluate(() => ({ mv: window.__mv, D: MMGAMV_DATA }));
  checkMoves(mv.filter((r) => r.cuts.length), D, 1, 1);
  assert.ok(mv.filter((r) => r.s === 0 && r.cuts.length).every((r) => r.cuts.every((c) => !/^G\d/.test(c))), '自分（ソラモ）の技にガウルのコマは出ない');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
