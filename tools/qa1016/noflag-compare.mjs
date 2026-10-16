// 2026-10-16 QA：フラグなしの URL で、QA ブランチの盤が土台（BASE のコミット）と同じ動き・同じ絵になるかを比べる（テストではない確認の道具）
//   node tools/qa1016/noflag-compare.mjs <土台のフォルダ（git worktree）> <QA のフォルダ> <出力フォルダ>
//   どちらも Math.random を同じ種で固定し、Chapter 1 A（本物の出発）と Chapter 2 A（?ch2trial=A）で決まった出目で歩かせ、止まるたびに
//   カメラの目標（goal）・地面の板とモンスターの transform・画面の画素を記録して比べる（画素は止まって 2.5秒後）。
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const pw = createRequire(import.meta.url)('/opt/node22/lib/node_modules/playwright');
const [BASE, QA, OUT] = process.argv.slice(2); mkdirSync(OUT, { recursive: true });
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.PNG': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4' };
async function serve(root) {
  const s = createServer(async (req, res) => { const u = decodeURIComponent(new URL(req.url, 'http://x').pathname), f = path.join(root, u === '/' ? 'index.html' : u);
    try { const st = await stat(f); if (!st.isFile()) throw 0; res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' }); res.end(await readFile(f)); } catch (e) { res.writeHead(404); res.end(); } });
  await new Promise((ok) => s.listen(0, '127.0.0.1', ok)); return { url: `http://127.0.0.1:${s.address().port}/`, close: () => new Promise((ok) => s.close(ok)) };
}
const DICE = [3, 4, 2, 5, 3, 4];
async function run(browser, root, tag, ch) {
  const srv = await serve(root), ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route(/^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com)\//, (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.addInitScript(() => { let s = 12345; Math.random = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x80000000; };
    Object.assign(window, { MM_QA_NO_KAREN: true, MM_QA_NO_NPC: true, MM_QA_NO_INTRO: true, MM_QA_NO_STORY: true, MM_QA_NO_PROLOGUE: true, MM_QA_NO_OPENING: true, MM_QA_NAV_INSTANT: true, MM_QA_NO_ARRIVAL: true, MM_QA_NO_TOURVS: true, MM_CH1ROUTE: 'A', MM_CH2ROUTE: 'A' }); });
  const pg = await ctx.newPage(), errs = []; pg.on('pageerror', (e) => errs.push(String(e)));
  await pg.goto(srv.url + 'index.html' + (ch === 2 ? '?ch2trial=A' : ''));
  await pg.waitForFunction(() => typeof window.MMP8 === 'object' && typeof S === 'object', null, { timeout: 120000 });
  if (ch === 1) await pg.evaluate(() => new Promise((ok) => setTimeout(() => {
    TEST_TOUR = { snap: JSON.stringify(S), ch2: 'cmp' }; const base = Object.assign(mk(0), { name: 'テスト' }); delete base.raise; MMP7.ensureProg(base); S.m = base; S.playerNamePending = false;
    MMP8.canDepart(S, base); MMWD.setRoute('A'); MMP8.depart(S, base, Math.random); board(); ok(); }, 400)));
  await pg.waitForFunction((ch) => window.MMWB && MMWB.world() && MMWB.world().isReady() && S.m && S.m.raise && S.m.raise.ch === ch, ch, { timeout: 90000 });
  await pg.evaluate(() => { S.m.raise.field.tiles = {}; board(); });
  const settle = async () => { for (let i = 0; i < 160; i++) { const st = await pg.evaluate(() => ({ b: !!bBusy, fx: !!document.querySelector('.wbrelay,.wb-pop,.d3z,.mmtalk'), ph: MMP8.boardPhase(S.m) }));
    if (st.ph === 'branch' && !st.b) { await pg.evaluate(() => { const b = document.querySelector('.wbbr .chroute'); if (b) b.click(); }); await pg.waitForTimeout(300); continue; }
    if (!st.b && !st.fx) break; await pg.waitForTimeout(250); } await pg.waitForTimeout(2500); };
  await settle();
  const rec = [];
  for (let i = 0; i <= DICE.length; i++) {
    const r = await pg.evaluate(() => { const W = MMWB.world(), s = W.state(), pl = document.querySelector('.rfw-plane'), mon = document.querySelector('.rfw-mon');
      const rd = (o) => o && Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'number' ? Math.round(v * 100) / 100 : v]));
      return { node: S.m.raise.node, goal: rd(s.goal), plane: pl.style.transform, mon: mon.style.transform, dir: mon.dataset.dir || '' }; });
    const png = await pg.screenshot({ path: path.join(OUT, `${tag}_ch${ch}_${i}.png`) });
    rec.push(r);
    if (i === DICE.length) break;
    await pg.evaluate((v) => { const mr = Math.random; Math.random = () => (v - 0.5) / 6; document.getElementById('brollbtn').click(); Math.random = mr; }, DICE[i]);
    await pg.waitForTimeout(400); await settle();
  }
  await ctx.close(); await srv.close();
  return { rec, errs };
}
const b = await pw.chromium.launch(), res = {};
for (const ch of [1, 2]) { res['base' + ch] = await run(b, BASE, 'base', ch); res['qa' + ch] = await run(b, QA, 'qa', ch); }
await b.close();
const { PNG } = await (async () => { try { return { PNG: createRequire(import.meta.url)('/opt/node22/lib/node_modules/playwright-core/lib/utilsBundle.js').PNG }; } catch (e) { return { PNG: null }; } })();
writeFileSync(path.join(OUT, 'noflag.json'), JSON.stringify(res, null, 1));
for (const ch of [1, 2]) { const a = res['base' + ch].rec, q = res['qa' + ch].rec; let same = a.length === q.length; const diffs = [];
  for (let i = 0; i < Math.min(a.length, q.length); i++) if (JSON.stringify(a[i]) !== JSON.stringify(q[i])) { same = false; diffs.push(i); }
  console.log(`Chapter ${ch}: 止まった回数 ${a.length}/${q.length}・目標と transform ${same ? '一致' : '不一致 ' + diffs.join(',')}・errors ${res['base' + ch].errs.length}/${res['qa' + ch].errs.length}`); }
