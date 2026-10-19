// =========================================================
// 盤の歩行（5方向×4コマ＝walk_1018）の実ブラウザ確認。2026-10-16 のソラモ試作（?qaWalk=soramo5）から始まり、2026-10-19 に比較の URL を撤去＝いつも正式
//  WQ-B1 Chapter 1 A × 3サイズ：8方向の絵（5方向＋反転）を使う・歩く間に向きが変わる・間の向きを通る・足もとの高さが跳ねない・縦横比が絵のまま（縦に伸びない）・止まると正面へ向き直る・エラー／404 なし
//  WQ-B2 撤去した比較の URL（?qaWalk=soramo5&qaCam=fixed）を付けても正式の歩行・C案カメラのまま
//  WQ-B3 フラグなし＝正式（5方向）・?qaWalk=old を付けても正式のまま（旧 8コマに戻らない）
//  WQ-B4 単独の QA 画面（prototype/walk_1016/）3サイズ：はみ出しなし・向きを変えると間の向きを通る
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';
const skip = H.skipReason();
const SIZES = [[375, 667], [390, 844], [393, 852]];
const DICE = [3, 4, 2, 5, 3, 4];
async function settle(pg) {
  for (let i = 0; i < 200; i++) {
    if (await pg.$('.mmtalk:not(.mmtalk-out)')) { await H.finishTalk(pg); continue; }
    const st = await pg.evaluate(() => ({ busy: !!bBusy, fx: !!document.querySelector('.wbrelay,.wb-pop,.chf-enc2,.d3z,#bt,#tvs'), ph: MMP8.boardPhase(S.m) }));
    if (st.ph === 'branch' && !st.busy) { await pg.evaluate(() => { const b = document.querySelector('.wbbr .chroute'); if (b) b.click(); }); await pg.waitForTimeout(300); continue; }
    if (!st.busy && !st.fx) break;
    await pg.waitForTimeout(150);
  }
  await pg.waitForTimeout(900);
}
async function open(L, q, size) {
  const p = await L.open({ worldCh1: true, route: 'A', query: q, size });
  await p.page.waitForFunction(() => window.MMWB && MMWB.world() && MMWB.world().isReady() && S.m && S.m.raise && S.m.raise.ch === 1, null, { timeout: 90000 });
  await p.page.evaluate(() => { S.m.raise.field.tiles = {}; board(); });
  await settle(p.page); return p;
}
/** 歩いている間、40ms ごとに向き（sector）・見えている絵・足もとの画面の高さ（見えている歩行の絵の下端とモンスターの箱の下端の差）を記録 */
async function walkLog(pg, n) {
  await pg.evaluate(() => { window.__wl = []; clearInterval(window.__wlT); window.__wlT = setInterval(() => { const m = document.querySelector('.rfw-mon'), on = m && m.querySelector('img.wk.on'), box = m && m.querySelector('.mon');
    if (!m) return; const r = on ? on.getBoundingClientRect() : null, b = box.getBoundingClientRect();
    window.__wl.push({ sec: m.dataset.sector || '', dir: m.dataset.dir || '', walking: m.classList.contains('wk-on'), src: on ? on.getAttribute('src').split('/').pop() : '', flip: m.classList.contains('wk-flip'), foot: r ? Math.round((b.bottom - r.bottom) / b.height * 1000) / 1000 : null, w: Math.round(b.width) }); }, 40);
    // 向きの変わり目は取り逃さないよう、属性の変化をすべて記録（40ms ごとの取り出しは重いときに間の1コマを飛ばす）
    window.__ws = []; const mm = document.querySelector('.rfw-mon'); if (window.__wsO) window.__wsO.disconnect();
    window.__wsO = new MutationObserver(() => { const v = mm.dataset.sector || ''; if (window.__ws[window.__ws.length - 1] !== v) window.__ws.push(v); }); window.__wsO.observe(mm, { attributes: true, attributeFilter: ['data-sector'] }); });
  for (let i = 0; i < n; i++) {
    if (await pg.evaluate(() => MMP8.boardPhase(S.m)) !== 'roll') break;
    await pg.evaluate((v) => { const mr = Math.random; Math.random = () => (v - 0.5) / 6; document.getElementById('brollbtn').click(); Math.random = mr; }, DICE[i % DICE.length]);
    await pg.waitForTimeout(400); await settle(pg);
  }
  return pg.evaluate(() => { clearInterval(window.__wlT); window.__wsO.disconnect(); const l = window.__wl; l.secs = window.__ws; return { log: l, secs: window.__ws }; });
}

test('WQ-B1：ソラモ 5方向（walk_1018・Chapter 1 A・3サイズ）＝8方向・間の向き・足もとが跳ねない・縦に伸びない・止まると正面', { skip, timeout: 1800000 }, async () => {
  const L = await H.launch();
  try {
    for (const size of SIZES) {
      const tag = size.join('x'), p = await open(L, '?ch1trial=A', size), pg = p.page;
      const sets = await pg.evaluate(() => [...new Set([...document.querySelectorAll('.rfw-mon img.wk')].map((i) => i.dataset.s))].sort());
      assert.deepEqual(sets, ['back', 'backd', 'front', 'frontd', 'side'], `${tag}：5方向の絵`);
      assert.equal(await pg.evaluate(() => document.querySelector('.rfw-mon').dataset.qawalk), '1018');
      const ar = await pg.evaluate(() => [...document.querySelectorAll('.rfw-mon img.wk')].filter((i) => i.naturalWidth).map((i) => { const r = i.getBoundingClientRect(); return r.width && r.height ? Math.abs(r.width / r.height - i.naturalWidth / i.naturalHeight) : 0; }));
      assert.ok(ar.length && ar.every((d) => d < 0.02), `${tag}：歩行コマの縦横比＝絵のまま（縦に伸びない）${Math.max(...ar)}`);
      const { log, secs: seq } = await walkLog(pg, DICE.length), wk = log.filter((x) => x.walking && x.src);
      assert.ok(wk.length > 20, `${tag}：歩いた ${wk.length}`);
      const secs = new Set(wk.map((x) => x.sec)); assert.ok(secs.size >= 2, `${tag}：向きが変わる ${[...secs]}`);
      assert.ok(wk.every((x) => /^(front|back|side|backd|frontd)_[1-4]\.webp$/.test(x.src)), `${tag}：正式の walk_1018 の絵だけ`);
      assert.ok(await pg.evaluate(() => [...document.querySelectorAll('.rfw-mon img.wk')].every((i) => i.getAttribute('src').includes('walk_1018/solamo/'))), `${tag}：walk_1018`);
      // 向きの変わり目は隣の向きへ1つずつ（2つ以上飛ばない）
      for (let i = 1; i < seq.length; i++) { const a = seq[i - 1], b = seq[i]; if (a === '' || b === '' || a === b) continue; let d = ((Number(b) - Number(a)) % 8 + 8) % 8; if (d > 4) d -= 8; assert.ok(Math.abs(d) <= 1, `${tag}：${a}→${b} で向きが飛んだ`); }
      const feet = wk.map((x) => x.foot).filter((x) => x != null), fmin = Math.min(...feet), fmax = Math.max(...feet);
      assert.ok(fmax - fmin < 0.02, `${tag}：足もとの高さ（箱に対する割合）が跳ねない ${fmin}〜${fmax}`);
      await pg.waitForTimeout(600);
      const end = await pg.evaluate(() => { const m = document.querySelector('.rfw-mon'); return { sec: m.dataset.sector, walking: m.classList.contains('wk-on') }; });
      assert.equal(end.walking, false, `${tag}：止まった`);
      assert.deepEqual(p.errors, [], tag); assert.deepEqual(p.bad, [], tag);
      await p.ctx.close();
    }
  } finally { await L.close(); }
});

test('WQ-B2：撤去した比較の URL（?qaWalk=soramo5&qaCam=fixed）を付けても正式の歩行・C案カメラのまま（2026-10-19）', { skip, timeout: 900000 }, async () => {
  const L = await H.launch();
  try {
    const p = await open(L, '?ch1trial=A&qaWalk=soramo5&qaCam=fixed', [390, 844]), { log } = await walkLog(p.page, 5);
    assert.ok(log.filter((x) => x.walking).length > 10);
    assert.ok(log.filter((x) => x.src).every((x) => !x.src.startsWith('soramo_')), 'ソラモの試作の絵は出ない');
    assert.equal(await p.page.evaluate(() => document.querySelector('.rfw-mon').dataset.qawalk), '1018');
    assert.equal(await p.page.evaluate(() => MMWB.world().qa().camMode), 'c');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
    await p.ctx.close();
  } finally { await L.close(); }
});

test('WQ-B3：フラグなしは正式（5方向×4コマ）・?qaWalk=old を付けても正式のまま（2026-10-19 に比較を撤去）', { skip, timeout: 600000 }, async () => {
  const L = await H.launch();
  try {
    const p = await open(L, '?ch1trial=A', [390, 844]), pg = p.page;
    const sets = await pg.evaluate(() => [...new Set([...document.querySelectorAll('.rfw-mon img.wk')].map((i) => i.dataset.s))].sort());
    assert.deepEqual(sets, ['back', 'backd', 'front', 'frontd', 'side']); assert.equal(await pg.evaluate(() => document.querySelector('.rfw-mon').dataset.qawalk || ''), '1018');
    await p.ctx.close();
    const q = await open(L, '?ch1trial=A&qaWalk=old', [390, 844]), qg = q.page;
    assert.deepEqual(await qg.evaluate(() => [...new Set([...document.querySelectorAll('.rfw-mon img.wk')].map((i) => i.dataset.s))].sort()), ['back', 'backd', 'front', 'frontd', 'side'], '旧 8コマに戻らない');
    assert.equal(await qg.evaluate(() => document.querySelector('.rfw-mon').dataset.qawalk || ''), '1018');
    await q.ctx.close();
  } finally { await L.close(); }
});

test('WQ-B4：単独の QA 画面（3サイズ）', { skip, timeout: 600000 }, async () => {
  const L = await H.launch();
  try {
    for (const size of SIZES) {
      const p = await L.open({ size }), pg = p.page;
      await pg.goto(L.url + 'prototype/walk_1016/index.html'); await pg.waitForTimeout(800);
      assert.equal(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${size}：はみ出さない`);
      await pg.click('.cell[data-s="0"]'); await pg.waitForTimeout(110);
      const mid = await pg.evaluate(() => QAW_STATE.demo.sector); assert.notEqual(mid, 0, '間の向きを通る');
      await pg.waitForTimeout(700); assert.equal(await pg.evaluate(() => QAW_STATE.demo.sector), 0);
      assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
      await p.ctx.close();
    }
  } finally { await L.close(); }
});
