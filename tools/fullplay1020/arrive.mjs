// 2026-10-20：大会会場への到着（正門前の全画面）の確認。GOAL の手前へ移り、出目 1 で GOAL に入って、正門前が出たところを撮る
//  node tools/fullplay1020/arrive.mjs <出力フォルダ> ch:route ...
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import * as H from '../../tests/e2e/harness.mjs';
const OUT = process.argv[2]; mkdirSync(OUT, { recursive: true });
const L = await H.launch();
try {
  for (const s of process.argv.slice(3)) {
    const [ch, route] = s.split(':');
    const p = await L.open({ worldCh1: true, worldCh2: true, worldCh3: true, worldCh4: true, route, route2: route, route3: route, route4: route, arrival: true, query: `?ch${ch}trial=${route}&qaSeed=1`, size: [390, 844], dsf: 2 });
    const pg = p.page;
    await pg.waitForFunction((ch) => window.MMWB && MMWB.world() && MMWB.world().isReady() && S.m.raise.ch === +ch, ch, { timeout: 120000 });
    await pg.waitForTimeout(800);
    await pg.evaluate(() => { const D = (S.m.raise.ch === 4 ? MMWD4 : S.m.raise.ch === 3 ? MMWD3 : S.m.raise.ch === 2 ? MMWD2 : MMWD).dataOf(S.m); S.m.raise.field.core.rival = true; S.m.raise.field.rivalMet = true; MMQAJ.jump(MMQAJ.prevOf(D, 'GOAL'), 1); });
    await pg.waitForTimeout(2500);
    await pg.screenshot({ path: path.join(OUT, `arr_ch${ch}${route}_0.png`) });
    await pg.evaluate(() => document.getElementById('brollbtn').click());
    for (let i = 0; i < 40; i++) { if (await pg.$('#wbgate.on')) break; await pg.waitForTimeout(300); }
    await pg.waitForTimeout(1300);
    await pg.screenshot({ path: path.join(OUT, `arr_ch${ch}${route}_1.png`) });
    console.log('arr', ch, route, p.errors);
    await p.ctx.close();
  }
} finally { await L.close(); }
