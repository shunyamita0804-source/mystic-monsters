// =========================================================
// QA（実ブラウザ）：2026-10-05 ライバルの相棒レグナス（正式技・固有スキル・技の演出。js/battle/rival-partner.js）
//  RV-B1：ライバルのマス → バトル：相手はレグナス（名前・正式画像・初期の4技）・強さはランクの値のまま。野生のバトルは従来どおり
//  RV-B2：10技の演出（ポーズ＋FX）が出て 1.5秒以内に片付く・画像の 404 なし・視差を減らす設定でも出る
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

async function toBattle(pg, bt) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); save(); board(); });
  await pg.waitForSelector('#chf .chf-bg');
  await pg.waitForFunction(() => !bBusy && !MMCHD.isLocked() && !document.querySelector('.chpop,.chdz,.chf-enc,.chf-fina,.mmtalk'), null, { timeout: 20000 });
  await pg.evaluate((bt) => { const g = MMCH.graphFor(S.m), a = S.m.raise.field.nodeAssignments; const id = bt === 'rival' ? 'p5_0' : g.order.find((x) => a[x] && a[x].t === 'battle' && a[x].bt === 'wild'); const r = S.m.raise; r.node = id; r.pend = { roll: 1, left: 0, stage: 'resolve' }; save(); board(); }, bt);
  await pg.waitForSelector('.chbat', { timeout: 20000 });
  await pg.evaluate(() => bBattleGo());
  await pg.waitForSelector('#bt #m1 img', { timeout: 15000 });
}

for (const size of [[390, 844], [375, 667]]) {
  T(`RV-B1（${size.join('×')}）：ライバル戦の相手はレグナス（名前・正式画像・初期の4技）。強さはランクの値・野生は従来どおり`, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await toBattle(pg, 'rival');
    const r = await pg.evaluate(() => ({ name: BPL[1].name, sp: BPL[1].sp, eq: BPL[1].eq, st: [BPL[1].li, BPL[1].po, BPL[1].de], rk: MMRIVAL.rankFor(S.m), src: document.querySelector('#bt #m1 img').getAttribute('src'), hud: document.querySelector('#hp1 .hn1 b').textContent, wrapped: !!MMBattle.__rp, spn: SP.length }));
    assert.equal(r.name, 'レグナス'); assert.equal(r.hud, 'レグナス'); assert.equal(r.sp, 4); assert.equal(r.spn, 2);
    assert.match(r.src, /assets\/monsters\/regnas\/regnas_official\.webp$/);
    assert.deepEqual(r.eq, [20, 21, 22, 23, -1, -1]);
    const RV = [70, 90, 120, 160, 220, 300]; assert.deepEqual(r.st, [RV[r.rk], RV[r.rk], RV[r.rk]], '強さは従来のランクの値のまま');
    assert.equal(r.wrapped, true, '固有スキルはこのバトルの間だけ');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

T('RV-B1b：野生のバトルは従来どおり（レグナスにならない）', async () => {
  const p = await openPage({ size: [390, 844] }); const pg = p.page;
  await toBattle(pg, 'wild');
  const r = await pg.evaluate(() => ({ name: BPL[1].name, sp: BPL[1].sp, n: battleFoeCount() }));
  assert.notEqual(r.name, "レグナス"); assert.ok(r.sp < r.n);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

T('RV-B2：10技の演出（ポーズ＋FX）が出て 1.5秒以内に片付く・画像の 404 なし・視差を減らす設定でも出る', async () => {
  const p = await openPage({ size: [390, 844] }); const pg = p.page;
  await toBattle(pg, 'rival');
  for (let k = 20; k <= 29; k++) {
    const t0 = await pg.evaluate((k) => { anim(k, 1); return { n: document.querySelectorAll('#bt .rp-l img').length, hid: document.getElementById('m1').classList.contains('rp-on') }; }, k);
    assert.ok(t0.n >= 2, `技 ${k}：ポーズと FX（${t0.n}）`); assert.equal(t0.hid, true);
    await pg.waitForTimeout(250);
    const loaded = await pg.evaluate(() => [...document.querySelectorAll('#bt .rp-l img')].every((i) => !i.complete || i.naturalWidth > 0));
    assert.ok(loaded, `技 ${k}：画像が読める`);
    await pg.waitForFunction(() => !document.querySelector('#bt .rp-l'), null, { timeout: 1600 });
    assert.equal(await pg.evaluate(() => document.getElementById('m1').classList.contains('rp-on')), false);
  }
  await pg.emulateMedia({ reducedMotion: 'reduce' });
  assert.ok(await pg.evaluate(() => { anim(28, 1); return document.querySelectorAll('#bt .rp-l img').length > 0; }));
  await pg.waitForFunction(() => !document.querySelector('#bt .rp-l'), null, { timeout: 1600 });
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
