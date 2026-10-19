// 2026-10-20：出来事の挿絵カード（Chapter ごとの題・本文・仮の背景）の確認。いちばん近い出来事のマスの手前へ移り（QA 移動）、出目 1 で止まって撮る
//  node tools/fullplay1020/event-shot.mjs <出力フォルダ> ch:route ...
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import * as H from '../../tests/e2e/harness.mjs';
const OUT = process.argv[2]; mkdirSync(OUT, { recursive: true });
const L = await H.launch();
try {
  for (const s of process.argv.slice(3)) {
    const [ch, route] = s.split(':');
    const p = await L.open({ worldCh1: true, worldCh2: true, worldCh3: true, worldCh4: true, route, route2: route, route3: route, route4: route, query: `?ch${ch}trial=${route}&qaSeed=1`, size: [390, 844], dsf: 2 });
    const pg = p.page;
    await pg.waitForFunction((ch) => window.MMWB && MMWB.world() && MMWB.world().isReady() && S.m.raise.ch === +ch, ch, { timeout: 120000 });
    await pg.waitForTimeout(800);
    const hit = await pg.evaluate(() => MMQAJ.before('event'));
    await pg.waitForTimeout(2000);
    await pg.evaluate(() => document.getElementById('brollbtn').click());
    for (let i = 0; i < 40; i++) { if (await pg.$('.wbcard .cap')) break; await pg.waitForTimeout(300); }
    await pg.waitForTimeout(1800);
    const info = await pg.evaluate(() => ({ cap: (document.querySelector('.wbcard .cap') || {}).textContent, bg: (document.querySelector('.wbcard img.bg') || {}).src }));
    await pg.screenshot({ path: path.join(OUT, `ev_ch${ch}${route}.png`) });
    console.log('event', ch, route, hit, JSON.stringify(info), p.errors);
    await p.ctx.close();
  }
} finally { await L.close(); }
