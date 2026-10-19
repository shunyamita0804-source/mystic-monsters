// =========================================================
// 2026-10-20：盤の地面と道の「真上から」の切り抜き（近くの層＝1単位 10px の区画をつなげる）。継ぎ目・広場・縁石の確認用
//  node tools/fullplay1020/topdown.mjs <出力フォルダ> ch:route:node[:半径] ...
// =========================================================
import path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import * as H from '../../tests/e2e/harness.mjs';
const OUT = process.argv[2]; mkdirSync(OUT, { recursive: true });
const SHOTS = process.argv.slice(3).map((s) => { const [ch, route, node, rad] = s.split(':'); return { ch: +ch, route, node, rad: +(rad || 60) }; });
const L = await H.launch(); let cur = null, key = '';
try {
  for (const s of SHOTS) {
    if (key !== s.ch + s.route) {
      if (cur) await cur.ctx.close();
      cur = await L.open({ worldCh1: true, worldCh2: true, worldCh3: true, worldCh4: true, route: s.route, route2: s.route, route3: s.route, route4: s.route, query: `?ch${s.ch}trial=${s.route}&qaSeed=1`, size: [390, 844] });
      await cur.page.waitForFunction((ch) => window.MMWB && MMWB.world() && MMWB.world().isReady() && S.m.raise.ch === ch, s.ch, { timeout: 120000 }); key = s.ch + s.route;
      await cur.page.waitForTimeout(1200);
    }
    const pg = cur.page;
    await pg.evaluate((id) => MMQAJ.jump(id), s.node);
    for (let i = 0; i < 80; i++) { const q = await pg.evaluate(() => { const w = MMWB.world(); try { w.inIntro() && w.skipIntro(); } catch (e) {} const r = w.qaRoad(); return r ? r.pending : 0; }); if (!q && i > 10) break; await pg.waitForTimeout(250); }
    const url = await pg.evaluate(({ id, rad, ch }) => {
      const W = ch === 4 ? MMWD4 : ch === 3 ? MMWD3 : ch === 2 ? MMWD2 : MMWD, D = W.dataOf(S.m), n = D.nodes[id], R = MMQAR.RES;
      const c = document.createElement('canvas'); c.width = c.height = Math.round(rad * 2 * R); const g = c.getContext('2d'); g.fillStyle = '#f0f'; g.fillRect(0, 0, c.width, c.height);
      for (const t of document.querySelectorAll('canvas.rfw-hi')) { if (t.style.visibility === 'hidden') continue; g.drawImage(t, t._x - (n[0] - rad) * R, t._y - (n[1] - rad) * R); }
      return c.toDataURL('image/png');
    }, { id: s.node, rad: s.rad, ch: s.ch });
    const f = path.join(OUT, `td_ch${s.ch}${s.route}_${s.node}.png`); writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); console.log('top', f);
  }
} finally { await L.close(); }
