// 2026-10-20：分かれ道の選択肢（「◯◯が伸びやすい道」の表記）の確認。分かれ道の手前へ移り、出目 2 で分かれ道を通って選択肢を出す
//  node tools/fullplay1020/branch-shot.mjs <出力フォルダ> ch:route:分かれ道の地点 ...
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import * as H from '../../tests/e2e/harness.mjs';
const OUT = process.argv[2]; mkdirSync(OUT, { recursive: true });
const L = await H.launch();
try {
  for (const s of process.argv.slice(3)) {
    const [ch, route, node] = s.split(':');
    const p = await L.open({ worldCh1: true, worldCh2: true, worldCh3: true, worldCh4: true, route, route2: route, route3: route, route4: route, query: `?ch${ch}trial=${route}&qaSeed=1`, size: [390, 844], dsf: 2 });
    const pg = p.page;
    await pg.waitForFunction((ch) => window.MMWB && MMWB.world() && MMWB.world().isReady() && S.m.raise.ch === +ch, ch, { timeout: 120000 });
    await pg.waitForTimeout(800);
    await pg.evaluate((id) => { const D = (S.m.raise.ch === 4 ? MMWD4 : S.m.raise.ch === 3 ? MMWD3 : S.m.raise.ch === 2 ? MMWD2 : MMWD).dataOf(S.m); MMQAJ.jump(MMQAJ.prevOf(D, id), 2); }, node);
    await pg.waitForTimeout(2000);
    await pg.evaluate(() => document.getElementById('brollbtn').click());
    for (let i = 0; i < 40; i++) { if (await pg.$('.wbbr .chroute')) break; await pg.waitForTimeout(300); }
    await pg.waitForTimeout(1200);
    const opts = await pg.evaluate(() => [...document.querySelectorAll('.wbbr .chroute')].map((b) => b.innerText.replace(/\n/g, '｜')));
    await pg.screenshot({ path: path.join(OUT, `br_ch${ch}${route}_${node}.png`) });
    console.log('branch', ch, route, node, JSON.stringify(opts), p.errors);
    await p.ctx.close();
  }
} finally { await L.close(); }
