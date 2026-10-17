// =========================================================
// 2026-10-12 正式モンスター5体のリアクション（被弾・回避）＝実際のバトル（実ブラウザ・通常の URL・共通演出あり）
//  RX-B1（375×667・390×844・430×932）：公式ランク戦を最後まで。攻撃を受けた側のダメージの数字が出た瞬間に、
//         当たった＝被弾（05_hit）・かわした＝回避（06_dodge）の絵へ一瞬だけ差し替わる（攻撃した側・自分の番のミスでは出ない）。
//         差し替えの間は待機立ち絵を隠す（2枚が同時に見えない）・技のコマ（p25f）と同じモンスターに重ならない・向きは待機立ち絵と同じ・
//         画面の中・約0.5秒で消えて待機立ち絵に戻る・最後に何も残らない・404 なし
//  RX-B2：相手側（自分はガウル・相手はソラモ）＝相手の差し替えは左右反転（待機立ち絵と同じ）
//  RX-B3：リアクションの絵が読めない（404）＝差し替えない（待機立ち絵のまま）・JS エラーなし・バトルは最後まで
//  RX-B4（3サイズ）：確認ページ（prototype/reactions_1012/）＝30枚とも読める・横はみ出しなし
//  QA_E2E=1 のときだけ実行
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

/** 記録：resolveAction の結果（受けた側・当たった）、ダメージの数字、差し替えの出入り */
const RECORD = () => {
  window.__rx = { acts: [], pops: [], shows: [], bad: [] };
  const R = window.__rx;
  new MutationObserver((ms) => ms.forEach((m) => {
    m.addedNodes.forEach((n) => {
      if (n.nodeType !== 1) return;
      if (n.tagName === 'SPAN' && n.classList.contains('dmg') && !n.classList.contains('ef') && /^f[01]$/.test((n.parentNode || {}).id || '')) R.pops.push({ side: +n.parentNode.id.slice(1), ms: n.classList.contains('ms'), t: performance.now() });
      if (n.classList && n.classList.contains('mma-rx')) {
        requestAnimationFrame(() => {
          const mon = n.parentNode; if (!mon) return;
          const side = +mon.closest('[id^="m"]').id.slice(1), idle = mon.querySelector('.mma-idle'), r = n.getBoundingClientRect();
          const flip = /matrix\(-1/.test(getComputedStyle(n).transform), idleFlip = idle && /matrix\(-1/.test(getComputedStyle(idle).transform);
          R.shows.push({ side, kind: n.dataset.kind, src: n.getAttribute('src'), t: performance.now(), idleHidden: !idle || getComputedStyle(idle).visibility === 'hidden', flip, idleFlip,
            // 画面の中：絵の幅の 6割以上が見えている・上下は画面の中（ノックバックの最中は待機立ち絵も同じだけ端へ押される）
            inView: r.width > 20 && r.height > 20 && (Math.min(r.right, innerWidth) - Math.max(r.left, 0)) / r.width > 0.6 && r.top > -10 && r.bottom < innerHeight + 10,
            // 待機立ち絵と同じ置き方：中心の横位置がほぼ同じ・高さは待機立ち絵の 0.7〜1.15倍
            same: (() => { if (!idle) return false; const q = idle.getBoundingClientRect(); return Math.abs((r.left + r.right) / 2 - (q.left + q.right) / 2) < 6 && r.height / q.height > 0.7 && r.height / q.height < 1.15; })(),
            frames: !!(mon.closest('[id^="m"]').querySelector('.p25f')), monOn: mon.classList.contains('mma-on'), rect: [r.left, r.top, r.width, r.height].map(Math.round), vw: innerWidth });
        });
      }
    });
    m.removedNodes.forEach((n) => { if (n.nodeType === 1 && n.classList && n.classList.contains('mma-rx')) { const s = R.shows[R.shows.length - 1]; if (s && s.end == null) s.end = performance.now(); } });
  })).observe(document.body, { childList: true, subtree: true });
};
async function fightToEnd(pg, maxMs = 240000) {
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    const s = await pg.evaluate(() => { const g = document.getElementById('go'); return { bt: !!document.getElementById('bt'), back: !!g && g.classList.contains('bk'), can: !!g && !g.disabled }; });
    if (!s.bt) return;
    if (s.back) { await pg.click('#go'); await pg.waitForTimeout(600); continue; }
    if (s.can) await pg.click('#go').catch(() => {});
    await pg.waitForTimeout(250);
  }
  throw new Error('バトルが終わらない');
}
async function tourFight(pg, mySp, foeSp, stats) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate(({ mySp, stats }) => { const m = mk(mySp); m.name = 'テス'; Object.assign(m, stats); MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); board(); }, { mySp, stats });
  await pg.waitForSelector('#chrcv .rcv-row', { timeout: 20000 });
  await pg.evaluate(() => { MMP8.startTournament(S, S.m, 0, 7); save(); });
  await pg.evaluate(RECORD);
  await pg.evaluate((foeSp) => { const o = window.battleFoeOnce; window.battleFoeOnce = () => o(foeSp); p8TourFight(); }, foeSp);
  await pg.waitForSelector('#bt #m0 .mon .mma-idle', { timeout: 20000 });
}
/** 記録を照らす：差し替え＝受けた側のダメージの数字のときだけ・種類が合う */
function check(R, wantFlip) {
  assert.ok(R.shows.length >= 1, `差し替えが1回以上（数字 ${R.pops.length}）`);
  for (const s of R.shows) {
    const pop = [...R.pops].reverse().find((p) => p.side === s.side && p.t <= s.t + 1);
    assert.ok(pop && s.t - pop.t < 120, `ダメージの数字の瞬間に差し替え ${JSON.stringify(s)}`);
    assert.equal(s.kind, pop.ms ? 'dodge' : 'hit', `当たった＝被弾・かわした＝回避 ${JSON.stringify(s)}`);
    assert.match(s.src, new RegExp(`reactions_1012/\\w+/0${s.kind === 'hit' ? '5_hit' : '6_dodge'}\\.webp$`));
    assert.ok(s.idleHidden, '差し替えの間は待機立ち絵を隠す（2枚が同時に見えない）');
    assert.ok(s.monOn && !s.frames, '技のコマが出ているモンスターには差し替えない');
    assert.equal(s.flip, s.idleFlip, '向きは待機立ち絵と同じ');
    if (wantFlip) assert.equal(s.flip, wantFlip[s.side], `side ${s.side} の向き`);
    assert.ok(s.inView, `画面の中 ${JSON.stringify(s)}`);
    assert.ok(s.same, `待機立ち絵と同じ位置・同じくらいの大きさ ${JSON.stringify(s)}`);
    assert.ok(s.end != null && s.end - s.t > 380 && s.end - s.t < 800, `約0.5秒で戻る（${s.end - s.t}ms）`);
  }
}

for (const size of [H.SIZES.se, H.SIZES.base, H.SIZES.max]) {
  test(`RX-B1（${size.join('×')}）：公式ランク戦＝被弾・回避の差し替え → 待機立ち絵に戻る`, { skip: SKIP, timeout: 300000 }, async () => {
    const p = await openPage({ size, stage: true }); const pg = p.page;
    // 回避が出やすいよう自分の回避を高く（バトルの計算は変えない＝能力の値を入れるだけ）
    await tourFight(pg, 0, 1, { li: 600, po: 260, in: 260, hi: 400, ev: 900, de: 300 });
    await fightToEnd(pg);
    const R = await pg.evaluate(() => window.__rx);
    check(R, { 0: false, 1: true });
    const kinds = new Set(R.shows.map((s) => s.kind));
    assert.ok(kinds.has('hit'), `被弾が出た ${JSON.stringify([...kinds])}`);
    assert.equal(await pg.evaluate(() => document.querySelectorAll('.mma-rx').length), 0, '最後に何も残らない');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('RX-B2：相手側のソラモ（自分はガウル）＝相手の差し替えは左右反転・回避も出る', { skip: SKIP, timeout: 300000 }, async () => {
  const p = await openPage({ size: H.SIZES.base, stage: true }); const pg = p.page;
  await tourFight(pg, 1, 0, { li: 700, po: 120, in: 120, hi: 300, ev: 60, de: 400 });
  // テストの中だけ：自分の攻撃の命中の乱数を1回おきに外れ側へ（hitRng＝bridge の乱数の差し込み口。計算そのものは変えない）＝相手がかわす場面が必ず来る
  await pg.evaluate(() => { const B = window.MMBattle; let n = 0; window.MMBattle = Object.freeze(Object.assign({}, B, { resolveAction(o) { if (o && o.attackerSide === 'A' && (n++ % 2 === 0)) o = Object.assign({}, o, { rng: Object.assign({}, o.rng || {}, { hitRng: () => 0.999 }) }); return B.resolveAction(o); } })); });
  await fightToEnd(pg);
  const R = await pg.evaluate(() => window.__rx);
  check(R, { 0: false, 1: true });
  assert.ok(R.shows.some((s) => s.side === 1), '相手側の差し替え');
  assert.ok(R.shows.some((s) => s.kind === 'dodge'), `回避が出た（${JSON.stringify(R.shows.map((s) => [s.side, s.kind]))} 数字 ${JSON.stringify(R.pops.map((p) => [p.side, p.ms]))} 記録 ${JSON.stringify(await pg.evaluate(() => MMARENA.rxLog()))}）`);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('RX-B3：リアクションの絵が 404＝差し替えない・待機立ち絵のまま・バトルは最後まで', { skip: SKIP, timeout: 300000 }, async () => {
  const p = await openPage({ size: H.SIZES.base, stage: true }); const pg = p.page;
  await pg.route('**/reactions_1012/**', (r) => r.fulfill({ status: 404, body: '' }));
  await tourFight(pg, 0, 1, { li: 600, po: 260, in: 260, hi: 400, ev: 300, de: 300 });
  await fightToEnd(pg);
  const R = await pg.evaluate(() => window.__rx);
  assert.ok(R.pops.length > 0, 'ダメージの数字は出た');
  assert.equal(R.shows.length, 0, '読めない絵には差し替えない');
  assert.deepEqual(p.errors, []);
  assert.ok(p.bad.every((b) => /reactions_1012/.test(b)), `404 はリアクションの絵だけ ${p.bad}`);
});

for (const size of [H.SIZES.se, H.SIZES.base, H.SIZES.max]) {
  test(`RX-B4（${size.join('×')}）：確認ページ＝36枚（2026-10-17：ラズックの6枚を含む）とも読める・横はみ出しなし`, { skip: SKIP, timeout: 60000 }, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await pg.goto(L.url + 'prototype/reactions_1012/index.html');
    await pg.waitForFunction(() => window.MM_RX_STATUS && Object.keys(MM_RX_STATUS).length === 36, null, { timeout: 20000 });
    const r = await pg.evaluate(() => ({ bad: Object.entries(MM_RX_STATUS).filter(([, v]) => !v || v.w < 300 || v.h < 300).map(([k]) => k), sw: document.documentElement.scrollWidth, iw: innerWidth }));
    assert.deepEqual(r.bad, []); assert.ok(r.sw <= r.iw + 1, '横はみ出しなし');
    await pg.click('#side button[data-v="1"]'); await pg.click('.sp[data-sp="regnas"] .try button[data-k="dodge"]');
    assert.ok(await pg.evaluate(() => { const m = document.querySelector('.sp[data-sp="regnas"] .stage .mon'); return m.classList.contains('rxon') && /06_dodge/.test(m.querySelector('.rx').src); }));
    await pg.waitForFunction(() => !document.querySelector('.sp[data-sp="regnas"] .stage .mon.rxon'), null, { timeout: 3000 });
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}
