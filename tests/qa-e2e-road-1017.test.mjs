// =========================================================
// 2026-10-17 道路画質（P0）の QA（?qaRoadArt=raw|fix）の実ブラウザ確認（作業ブランチ claude/qa-road-1017 だけ・試作）
//  RA-B1 Chapter 1 A・C × 2サイズ × raw／fix：新しい草地・道の帯・敷石の円を読む・近くの層（1単位 10px）・上限のメモリ以内・エラー／404 なし
//  RA-B2 Chapter 2 A × fix × 橋床（qaRoad=1）／白い橋帯（qaRoad=2）＋独立の門（qaArch=1）：新しい海・橋床・白石畳・R01・欄干・門
//  RA-B3 ?qaRoadArt=old（従来の絵）は新しい絵を1枚も読まない・近くの層を作らない（2026-10-18 から本編の既定は fix）
//  RA-B4 同じ出目なら、フラグなし・raw・fix で止まる地点が同じ・セーブ（mr4v6）を書き換えない
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';
const skip = H.skipReason();
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
async function open(L, ch, route, q, size) {
  const p = await L.open({ worldCh1: true, worldCh2: true, route, route2: route, query: q, size });
  const reqs = []; p.page.on('request', (r) => { if (/assets\/qa\/road_1017\//.test(r.url())) reqs.push(r.url().split('/').pop()); });
  await p.page.waitForFunction((ch) => window.MMWB && MMWB.world() && MMWB.world().isReady() && S.m && S.m.raise && S.m.raise.ch === ch, ch, { timeout: 90000 });
  await p.page.evaluate(() => { S.m.raise.field.tiles = {}; board(); });
  await settle(p.page); p.reqs = reqs; return p;
}
async function roll(pg, n) { const nodes = []; for (let i = 0; i < n; i++) { if (await pg.evaluate(() => MMP8.boardPhase(S.m)) !== 'roll') break;
  await pg.evaluate((v) => { const mr = Math.random; Math.random = () => (v - 0.5) / 6; document.getElementById('brollbtn').click(); Math.random = mr; }, DICE[i % DICE.length]);
  await pg.waitForTimeout(400); await settle(pg); nodes.push(await pg.evaluate(() => S.m.raise.node)); } return nodes; }
const info = (pg) => pg.evaluate(() => ({ q: MMWB.world().qaRoad(), loaded: MMQRA.loaded().map((x) => x[0]), mode: MMQRA.mode, arch: document.querySelectorAll('.rfs-qarch').length }));

test('RA-B1：Chapter 1 A・C（2サイズ × raw／fix）', { skip, timeout: 1800000 }, async () => {
  const L = await H.launch();
  try {
    for (const [route, gr, rd] of [['A', 'ch1_ground_a1', 'ch1_road_r1'], ['C', 'ch1_ground_a3', 'ch1_road_r2']]) for (const size of [[375, 667], [390, 844]]) for (const v of ['raw', 'fix']) {
      if (route === 'C' && size[0] === 375) continue;
      const tag = `${route} ${size.join('x')} ${v}`, p = await open(L, 1, route, `?ch1trial=${route}&qaCam=c&qaRoadArt=${v}`, size), pg = p.page;
      await roll(pg, 2); await pg.waitForTimeout(800);
      const h = await info(pg);
      assert.equal(h.mode, v, tag); assert.deepEqual(h.loaded.sort(), [gr, rd, rd.replace('road', 'strip')].sort(), tag);
      assert.equal(h.q.mode, '1', tag); assert.equal(h.q.res, 10, tag); assert.ok(h.q.tiles >= 1 && h.q.pending === 0, `${tag}：${JSON.stringify(h.q)}`);
      assert.ok(h.q.bytes <= 40 * 1048576 + 642 * 642 * 4, `${tag}：メモリの上限 ${h.q.bytes}`);
      assert.ok(p.reqs.every((u) => u.includes('_' + v + '.')), `${tag}：${p.reqs}`);
      assert.equal(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, tag);
      assert.deepEqual(p.errors, [], tag); assert.deepEqual(p.bad, [], tag);
      await p.ctx.close();
    }
  } finally { await L.close(); }
});

test('RA-B2：Chapter 2 A（fix × 橋床／白い橋帯＋独立の門）', { skip, timeout: 900000 }, async () => {
  const L = await H.launch();
  try {
    for (const v of ['1', '2']) {
      const p = await open(L, 2, 'A', `?ch2trial=A&qaCam=c&qaRoadArt=fix&qaRoad=${v}&qaArch=1`, [390, 844]), pg = p.page; await roll(pg, 2); await pg.waitForTimeout(800);
      const h = await info(pg);
      assert.equal(h.q.mode, v);
      assert.deepEqual(h.loaded.sort(), ['ch2_R01_white_bridge_walkstrip', 'ch2_coastal_white_stone_road', 'ch2_open_sea_water', 'ch2_sea_bridge_deck', 'ch2_sea_bridge_railing_left', 'ch2_sea_bridge_railing_right'].sort());
      assert.ok(h.arch >= 1, '独立の門 ' + h.arch);
      assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
      await p.ctx.close();
    }
  } finally { await L.close(); }
});

test('RA-B3・B4：フラグなしは新しい絵を読まない・止まる地点とセーブは同じ', { skip, timeout: 1200000 }, async () => {
  const L = await H.launch();
  try {
    const seq = {};
    for (const v of ['old', 'raw', 'fix']) {   // 2026-10-18：本編の既定は fix＝従来の絵は ?qaRoadArt=old
      const p = await open(L, 1, 'A', '?ch1trial=A&qaCam=c' + `&qaRoadArt=${v}`, [390, 844]), pg = p.page;
      const s0 = await pg.evaluate(() => localStorage.getItem('mr4v6'));
      seq[v === 'old' ? '0' : v] = await roll(pg, DICE.length);
      assert.equal(await pg.evaluate(() => localStorage.getItem('mr4v6')), s0, 'セーブを書き換えない（試遊はページの中だけ）');
      if (v === 'old') { const h = await info(pg); assert.equal(h.q, null); assert.equal(h.mode, null); assert.deepEqual(p.reqs, []); assert.equal(await pg.evaluate(() => document.querySelectorAll('.rfw-hi').length), 0); }
      await p.ctx.close();
    }
    assert.deepEqual(seq.raw, seq['0']); assert.deepEqual(seq.fix, seq['0']);
  } finally { await L.close(); }
});
