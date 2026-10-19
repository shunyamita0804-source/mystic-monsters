// =========================================================
// 2026-10-20：盤の世界全体（地面と道）を真上から1枚に（world.snapshot＝近くの層と同じ描画）。継ぎ目・広場・海の上の破片の総点検用
//  node tools/fullplay1020/world.mjs <出力フォルダ> <res（px／単位）> ch:route ...
// =========================================================
import path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import * as H from '../../tests/e2e/harness.mjs';
const OUT = process.argv[2], RES = +process.argv[3] || 2; mkdirSync(OUT, { recursive: true });
const L = await H.launch();
try {
  for (const s of process.argv.slice(4)) {
    const [ch, route] = s.split(':');
    const p = await L.open({ worldCh1: true, worldCh2: true, worldCh3: true, worldCh4: true, route, route2: route, route3: route, route4: route, query: `?ch${ch}trial=${route}&qaSeed=1`, size: [390, 844] });
    await p.page.waitForFunction((ch) => window.MMWB && MMWB.world() && MMWB.world().isReady() && S.m.raise.ch === +ch, ch, { timeout: 120000 });
    await p.page.waitForTimeout(800);
    const url = await p.page.evaluate((r) => MMWB.world().snapshot([0, 0, 1024, 1536], r), RES);
    const f = path.join(OUT, `world_ch${ch}${route}.jpg`); writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); console.log('world', f, p.errors.length ? p.errors : '');
    await p.ctx.close();
  }
} finally { await L.close(); }
