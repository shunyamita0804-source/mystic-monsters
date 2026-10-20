// =========================================================
// 2026-10-20 通し試遊の品質改善：盤の定点キャプチャ（修正前・後の比較用）
//  node tools/fullplay1020/capture.mjs <出力フォルダ> [ch:route:node[:yawの補正なし] ...]
//  試遊の URL（?chNtrial=R&qaSeed=1）を開き、QA 移動（MMQAJ.jump）で地点へ移って、カメラと近くの層が落ち着いてから 390×844 で撮る（環境変数 CAP_SIZE＝375x667 などで画面の大きさ）。
//  札（Ch 試遊・QA移動）は撮るときだけ隠す。セーブは変わらない（試遊は保存しない）
// =========================================================
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import * as H from '../../tests/e2e/harness.mjs';

const OUT = process.argv[2];
const SHOTS = process.argv.slice(3).map((s) => { const [ch, route, node, tag] = s.split(':'); return { ch: +ch, route, node, tag: tag || '' }; });
mkdirSync(OUT, { recursive: true });
const L = await H.launch();
const opened = {};
try {
  for (const s of SHOTS) {
    const key = s.ch + s.route;
    if (!opened[key]) {
      for (const k of Object.keys(opened)) { await opened[k].ctx.close(); delete opened[k]; }
      const p = await L.open({ worldCh1: true, worldCh2: true, worldCh3: true, worldCh4: true, route: s.route, route2: s.route, route3: s.route, route4: s.route, query: `?ch${s.ch}trial=${s.route}&qaSeed=1`, size: (process.env.CAP_SIZE || '390x844').split('x').map(Number), dsf: +(process.env.DSF || 1) });
      await p.page.waitForFunction((ch) => window.MMWB && MMWB.world() && MMWB.world().isReady() && S.m && S.m.raise && S.m.raise.ch === ch, s.ch, { timeout: 120000 });
      await p.page.waitForTimeout(1500);
      opened[key] = p;
    }
    const pg = opened[key].page;
    const ok = await pg.evaluate((id) => { try { if (MMWB.world().inIntro && MMWB.world().inIntro()) MMWB.world().skipIntro(); } catch (e) {} return MMQAJ.jump(id); }, s.node);
    if (!ok) { console.log('NG jump', s.ch, s.route, s.node); continue; }
    await pg.waitForFunction(() => MMWB.world() && MMWB.world().isReady(), null, { timeout: 60000 });
    for (let i = 0; i < 60; i++) { const q = await pg.evaluate(() => { const w = MMWB.world(); try { w.inIntro() && w.skipIntro(); } catch (e) {} const r = w.qaRoad(); return r ? r.pending : 0; }); if (!q && i > 8) break; await pg.waitForTimeout(250); }
    await pg.waitForTimeout(1200);
    await pg.evaluate(() => { document.querySelectorAll('.ch2tv,.ch3tv,.ch4tv,.ch1tv,.qajb,#qajb,.qabadge,[id$="tv"]').forEach((e) => { e.style.visibility = 'hidden'; }); });
    const f = path.join(OUT, `ch${s.ch}${s.route}_${s.node}${s.tag ? '_' + s.tag : ''}.png`);
    await pg.screenshot({ path: f });
    console.log('shot', f);
  }
} finally { await L.close(); }
