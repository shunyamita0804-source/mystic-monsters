// バトルの絵の表示までの時間を、外部化の前（data URI の index.html）と後で比べる道具（テストではない）
//   QA_CACHE_CONTROL=max-age=600 ORIG=<外部化の前の index.html> node tools/inline-images/battle-timing.mjs
//  ・本番の GitHub Pages と同じキャッシュ（max-age=600）で配る（harness の QA_CACHE_CONTROL）
//  ・回線：速い（そのまま）／遅い（4倍遅い CPU・下り 1.6Mbps・往復 150ms＝iPhone のモバイル回線の想定）
//  ・大会の対戦表を1.5秒見て「対戦する」→ 比較画面を1.5秒見て「対戦開始」（本物のボタン）→ バトル。#bt の中に新しく入った絵（data URI／assets/inline）が読み終わるまでの時間を測る
//    wait＝「対戦開始」から #bt が出るまで（MMINL が絵を待った時間を含む）・start＝「対戦開始」からバトル開始の絵がすべて読めるまで（ms）・max＝バトル中に新しく入った絵 1枚ごとの読み終わりまでの最大（ms）・late＝100ms を超えた枚数
import { writeFileSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import * as H from '../../tests/e2e/harness.mjs';

const ORIG = process.env.ORIG;
const ORIG_NAME = '__orig_index_timing.html';
// 外部化の前の index.html は版（MM_BUILD）を今の値にそろえる（そろえないと version.json を見て読み込み直す＝公開の更新の仕組み）
const CUR_BUILD = (/const MM_BUILD="([^"]+)";/.exec(readFileSync(path.join(H.ROOT, 'index.html'), 'utf8')) || [])[1];
if (ORIG) writeFileSync(path.join(H.ROOT, ORIG_NAME), readFileSync(ORIG, 'utf8').replace(/const MM_BUILD="[^"]+";/, `const MM_BUILD="${CUR_BUILD}";`));
const L = await H.launch();
const rows = [];
const pressStop = async (pg) => { if (await pg.evaluate(() => { const g = document.getElementById('go'); return !!g && !g.disabled && !g.classList.contains('bk'); })) await pg.click('#go').catch(() => {}); };

async function run(variant, net, ui, sp) {
  const p = await L.open({ size: H.SIZES.base, raw: ui === 'old' ? { mmbattleui: 'old' } : {}, query: ui === 'old' ? '?battleArt=old' : '' }); const pg = p.page;
  if (variant === 'orig') { await pg.goto(L.url + ORIG_NAME + (ui === 'old' ? '?battleArt=old' : '')); await pg.waitForFunction(() => typeof window.MMP8 === 'object' && typeof S === 'object'); }
  await H.newGame(pg, 'テスト');
  if (net === 'slow') { const c = await pg.context().newCDPSession(pg); await c.send('Network.enable'); await c.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 0.75e6 / 8 }); await c.send('Emulation.setCPUThrottlingRate', { rate: 4 }); }
  await pg.evaluate((sp) => { const m = mk(sp); m.name = sp ? 'ガウ' : 'ソラ'; Object.assign(m, { po: 999, in: 999, hi: 999, li: 999 }); MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); MMP8.startTournament(S, S.m, 0, 7); save(); board(); }, sp);
  await pg.waitForSelector('.tb1 .tbgo', { timeout: 120000 }); await pg.waitForTimeout(1500);
  await pg.click('.tb1 .tbgo'); await pg.waitForSelector('.tbstart', { timeout: 60000 }); await pg.waitForTimeout(1500);
  await pg.evaluate(() => {
    const isImg = (s) => /^data:image\/|assets\/inline\//.test(s || '');
    const W = window.__tm = { t0: performance.now(), start: null, rec: [] };
    const track = (im, phase) => { if (im.__tm || !isImg(im.getAttribute('src'))) return; im.__tm = 1; const r = { phase, t: performance.now(), done: null, src: (im.getAttribute('src') || '').slice(0, 40) }; W.rec.push(r); const chk = () => { if (im.complete && im.naturalWidth > 0) r.done = performance.now(); else if (performance.now() - r.t < 5000) requestAnimationFrame(chk); }; chk(); };
    new MutationObserver((ms) => ms.forEach((m) => { const add = (n) => { if (n.nodeType !== 1) return; if (n.tagName === 'IMG') track(n, W.phase); n.querySelectorAll && n.querySelectorAll('img').forEach((i) => track(i, W.phase)); }; m.addedNodes.forEach(add); if (m.type === 'attributes' && m.target.tagName === 'IMG') { m.target.__tm = 0; track(m.target, W.phase); } })).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
    W.phase = 'start'; document.querySelector('.tbstart').click(); const bt = () => { if (document.getElementById('bt')) { W.bt = performance.now(); setTimeout(() => { W.phase = 'turn'; }, 300); } else requestAnimationFrame(bt); }; bt();
  });
  for (let i = 0; i < 200; i++) { if (await pg.evaluate(() => { const g = document.getElementById('go'); return !!g && g.classList.contains('bk'); })) break; await pressStop(pg); await pg.waitForTimeout(150); }
  await pg.waitForTimeout(2500);
  const r = await pg.evaluate(() => { const R = window.__tm.rec, d = (x) => (x.done == null ? 5000 : x.done - x.t); const st = R.filter((x) => x.phase === 'start'); return { wait: Math.round((window.__tm.bt || 0) - window.__tm.t0), lateSrc: R.filter((x) => d(x) > 100).map((x) => x.src.replace('assets/inline/', '')).slice(0, 6), n: R.length, start: Math.round(Math.max(0, ...st.map((x) => x.done == null ? 5000 : x.done - window.__tm.t0))), max: Math.round(Math.max(0, ...R.map(d))), late: R.filter((x) => d(x) > 100).length, never: R.filter((x) => x.done == null).length }; });
  rows.push({ variant, net, ui, sp, ...r }); console.log(JSON.stringify(rows[rows.length - 1]));
  await p.ctx.close();
}
for (const net of ['fast', 'slow']) for (const ui of ['new', 'old']) for (const sp of [0, 1]) for (const v of ORIG ? ['orig', 'new'] : ['new']) await run(v, net, ui, sp);
await L.close();
if (ORIG) rmSync(path.join(H.ROOT, ORIG_NAME), { force: true });
console.log('\n| 回線 | 画面 | 種族 | 版 | 絵の数 | 対戦開始→バトル | 対戦開始→開始の絵がそろう | 1枚の最大 | 100ms 超 | 出ない |');
console.log('|---|---|---|---|---|---|---|---|---|---|');
for (const r of rows) console.log(`| ${r.net} | ${r.ui} | ${r.sp} | ${r.variant} | ${r.n} | ${r.wait}ms | ${r.start}ms | ${r.max}ms | ${r.late} | ${r.never} |`);
