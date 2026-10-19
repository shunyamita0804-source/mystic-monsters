// 起動の時間（キャッシュなしで初めて開く・開始画面が出るまで）を外部化の前と後で比べる道具（テストではない）
//   QA_CACHE_CONTROL=max-age=600 ORIG=<外部化の前の index.html> node tools/inline-images/boot-timing.mjs
//   回線：速い（そのまま）／遅い（4倍遅い CPU・下り 1.6Mbps・往復 150ms＝iPhone のモバイル回線の想定）
import { writeFileSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import * as H from '../../tests/e2e/harness.mjs';
const ORIG = process.env.ORIG, ORIG_NAME = '__orig_index_boot.html';
const CUR_BUILD = (/const MM_BUILD="([^"]+)";/.exec(readFileSync(path.join(H.ROOT, 'index.html'), 'utf8')) || [])[1];
if (ORIG) writeFileSync(path.join(H.ROOT, ORIG_NAME), readFileSync(ORIG, 'utf8').replace(/const MM_BUILD="[^"]+";/, `const MM_BUILD="${CUR_BUILD}";`));
const L = await H.launch();
const res = {};
for (const f of ORIG ? ['index.html', ORIG_NAME] : ['index.html']) for (const net of ['fast', 'slow']) {
  const p = await L.open({ size: H.SIZES.base }); const pg = p.page;
  const c = await pg.context().newCDPSession(pg); await c.send('Network.enable');
  await c.send('Network.setCacheDisabled', { cacheDisabled: true });   // 初めて開く（キャッシュなし）
  if (net === 'slow') { await c.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 0.75e6 / 8 }); await c.send('Emulation.setCPUThrottlingRate', { rate: 4 }); }
  const t0 = Date.now();
  await pg.goto(L.url + f, { waitUntil: 'domcontentloaded', timeout: 600000 });
  await pg.waitForFunction(() => typeof window.MMP8 === 'object' && typeof S === 'object' && !!document.querySelector('[onclick*="startGame"]'), null, { timeout: 600000, polling: 500 });
  const t = await pg.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return { html: Math.round(n.responseEnd), dcl: Math.round(n.domContentLoadedEventEnd), bytes: n.transferSize }; });
  res[f + ' ' + net] = { ...t, title: Date.now() - t0 }; console.log(f, net, JSON.stringify(res[f + ' ' + net]));
  await p.ctx.close();
}
await L.close();
if (ORIG) rmSync(path.join(H.ROOT, ORIG_NAME), { force: true });
