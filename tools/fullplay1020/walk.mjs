// =========================================================
// 2026-10-20 道路美術 P0：盤の上を実際に歩かせて、歩いている途中を連続で撮る（カメラの追尾・道の境界・門と看板の通過の確認用。テストではない道具）
//  node tools/fullplay1020/walk.mjs <出力フォルダ> ch:route:node:出目[:分かれ道で選ぶ番号] ...
//  試遊の URL（?chNtrial=R&qaSeed=1）を開き、QA 移動（MMQAJ.jump）で地点へ移ってから、出目を固定してサイコロ（MMWB.roll）→ 0.35 秒ごとに 12 枚撮る。
//  分かれ道で止まったら、選ぶ番号（既定 0）の道を選んで続ける。試遊は保存しない。390×844（WALK_SIZE=375x667 で小さい画面）
// =========================================================
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import * as H from '../../tests/e2e/harness.mjs';

const OUT = process.argv[2];
const RUNS = process.argv.slice(3).map((s) => { const [ch, route, node, die, pick] = s.split(':'); return { ch: +ch, route, node, die: +die || 6, pick: +(pick || 0) }; });
const SIZE = (process.env.WALK_SIZE || '390x844').split('x').map(Number);
mkdirSync(OUT, { recursive: true });
const L = await H.launch();
try {
  for (const r of RUNS) {
    const p = await L.open({ worldCh1: true, worldCh2: true, worldCh3: true, worldCh4: true, route: r.route, route2: r.route, route3: r.route, route4: r.route, query: `?ch${r.ch}trial=${r.route}&qaSeed=1`, size: SIZE });
    const pg = p.page;
    await pg.waitForFunction((ch) => window.MMWB && MMWB.world() && MMWB.world().isReady() && S.m && S.m.raise && S.m.raise.ch === ch, r.ch, { timeout: 120000 });
    await pg.waitForTimeout(1500);
    await pg.evaluate((id) => { try { if (MMWB.world().inIntro && MMWB.world().inIntro()) MMWB.world().skipIntro(); } catch (e) {} return MMQAJ.jump(id); }, r.node);
    for (let i = 0; i < 40; i++) { const q = await pg.evaluate(() => { const r2 = MMWB.world().qaRoad(); return r2 ? r2.pending : 0; }); if (!q && i > 6) break; await pg.waitForTimeout(250); }
    await pg.evaluate(() => { document.querySelectorAll('.ch2tv,.ch3tv,.ch4tv,.ch1tv,.qajb,#qajb,.qabadge,[id$="tv"]').forEach((e) => { e.style.visibility = 'hidden'; }); });
    await pg.evaluate((die) => { const R = Math.random; Math.random = () => (die - 0.5) / 6; try { MMWB.roll(); } finally { setTimeout(() => { Math.random = R; }, 50); } }, r.die);
    const tag = `walk_ch${r.ch}${r.route}_${r.node}_d${r.die}`;
    for (let k = 0; k < 12; k++) {
      await pg.waitForTimeout(350);
      const st = await pg.evaluate(() => (S.m.raise.pend ? S.m.raise.pend.stage : null));
      if (st === 'branch') await pg.evaluate((i) => { const o = S.m.raise.pend.opts || []; if (o.length) MMWB.pick(o[Math.min(i, o.length - 1)]); }, r.pick);
      await pg.screenshot({ path: path.join(OUT, `${tag}_${String(k).padStart(2, '0')}.png`) });
    }
    console.log('walk', tag, await pg.evaluate(() => S.m.raise.node));
    await p.ctx.close();
  }
} finally { await L.close(); }
