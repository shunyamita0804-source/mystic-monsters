// =========================================================
// 2026-10-20 第4便B：盤の地面と道を WebGL2 で描く（実ブラウザ）。QA_E2E=1 のときだけ
//  GL-E1（Chapter 1〜4 の A・390×844）：盤は WebGL（.rfw-gl）で描き、区画の canvas（.rfw-chunk）・近くの層は作らない・素材（地面・道・縁石・広場）が読めている・
//        地形の絵の全体の区画が描き終わる・画面の上の方（奥の地面）・モンスターの足もと（道）・画面の下（手前の地面）に色がある（透明でない）・エラーなし
//  GL-E2：?glBoard=0 は従来の描き方（区画の canvas あり・WebGL の canvas なし）
//  GL-E3：Chapter 2 の盆地＝海底へ潜ると盆地の上の海面が薄くなる（名前つきの網の濃さ）。マスの位置は描いた道の中心線の上（world.at）
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
const W_ALL = { worldCh1: true, worldCh2: true, worldCh3: true, worldCh4: true };
const settle = (pg) => pg.waitForFunction(() => window.MMWB && MMWB.world() && MMWB.world().isReady() && MMWB.world().gl() && !MMWB.world().gl().pending, null, { timeout: 120000 }).then(() => pg.waitForTimeout(800));

for (const ch of [1, 2, 3, 4]) {
  test(`GL-E1（Chapter ${ch} A）：WebGL の盤・素材・地形の絵・画面に色がある`, { skip: SKIP, timeout: 180000 }, async () => {
    const p = await openPage({ ...W_ALL, size: H.SIZES.base, query: `?ch${ch}trial=A&qaSeed=1` }); const pg = p.page; await settle(pg);
    const r = await pg.evaluate(() => { const w = MMWB.world(), mon = w.state().mon, q = w.project(mon[0], mon[1]);
      return { gl: !!document.querySelector('.rfw-gl'), chunks: document.querySelectorAll('.rfw-chunk').length, st: w.gl(), top: w.glProbe(195, 160).px, foot: w.glProbe(q.x, q.y + 2).px, bottom: w.glProbe(60, innerHeight - 280).px }; });
    assert.ok(r.gl, 'WebGL の canvas'); assert.equal(r.chunks, 0, '区画の canvas（CSS 3D の層）は作らない');
    for (const k of [ch === 2 ? 'land' : 'ground', 'road', 'curb', 'plaza', ...(ch === 2 ? ['sea', 'seabed', 'floor', 'water'] : ch === 3 ? ['cloud'] : [])]) assert.equal(r.st.tex[k], true, `素材 ${k}`);
    assert.ok(r.st.macro > 0 && r.st.pending === 0, `地形の絵 ${JSON.stringify(r.st)}`);
    for (const k of ['top', 'foot', 'bottom']) assert.ok(r[k][3] > 200, `${k} に色 ${JSON.stringify(r[k])}`);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('GL-E2：?glBoard=0 は従来の描き方', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({ ...W_ALL, size: H.SIZES.base, query: '?ch1trial=A&qaSeed=1&glBoard=0' }); const pg = p.page;
  await pg.waitForFunction(() => window.MMWB && MMWB.world() && MMWB.world().isReady(), null, { timeout: 120000 });
  const r = await pg.evaluate(() => ({ gl: !!document.querySelector('.rfw-gl'), chunks: document.querySelectorAll('.rfw-chunk').length, st: MMWB.world().gl() }));
  assert.equal(r.gl, false); assert.ok(r.chunks > 0); assert.equal(r.st, null);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('GL-E3：Chapter 2 の海底へ潜ると盆地の上の海面が薄い・マスは道の中心線の上', { skip: SKIP, timeout: 180000 }, async () => {
  const p = await openPage({ ...W_ALL, size: H.SIZES.base, query: '?ch2trial=A&qaSeed=1' }); const pg = p.page; await settle(pg);
  const deep = await pg.evaluate(() => { const D = MMWD2.dataOf(S.m), E = D.art.elev || {}; return Object.keys(D.nodes).find((id) => (E[id] || 0) < -10); });
  assert.ok(deep, '海底の地点');
  await pg.evaluate((id) => MMQAJ.jump(id), deep); await settle(pg);
  const r = await pg.evaluate(() => { const w = MMWB.world(), mon = w.state().mon; return { h: mon[2], st: w.gl() }; });
  assert.ok(r.h < -2, `海底にいる ${r.h}`);
  assert.ok(r.st.tex.seabed && r.st.tex.floor && r.st.tex.water && r.st.tex.basinWall, `海底・壁の素材 ${JSON.stringify(r.st.tex)}`);
  const at = await pg.evaluate(() => { const w = MMWB.world(), D = MMWD2.dataOf(S.m); return Object.keys(D.nodes).slice(0, 40).map((id) => [w.at(id), D.nodes[id]]); });
  assert.ok(at.every(([a, n]) => a && Math.hypot(a[0] - n[0], a[1] - n[1]) < 16), 'マスの位置は地点のすぐ近く（道の中心線の上）');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
