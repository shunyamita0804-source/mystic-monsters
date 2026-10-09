// 2.5D 完全版の検証：node qa25.mjs <me sp> <foe sp> <side 0|1> <moves> <outdir> [w,h]
import * as H from '../../tests/e2e/harness.mjs';
import fs from 'node:fs';
const [,, mySp, foeSp, side, moves, out, size = '390,844'] = process.argv;
fs.mkdirSync(out, { recursive: true });
const L = await H.launch();
const p = await L.open({ size: size.split(',').map(Number), query: '?battleArt=2p5d', stage: true });
const pg = p.page;
await H.newGame(pg, 'テスト');
await pg.evaluate((sp) => { const m = mk(sp); m.name = 'テスト'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); board(); }, +mySp);
await pg.waitForSelector('#chrcv .rcv-row', { timeout: 20000 });
await pg.evaluate(([sp, foe]) => { MMP8.startTournament(S, S.m, 0, 7); S.m.sk = sp == 0 ? [0,1,2,3,4,5,6,7,8,9] : [10,11,12,13,14,15,16,17,18,19]; S.m.eq = S.m.sk.slice(0, 6); save();
  const o = window.battleFoeOnce; window.battleFoeOnce = () => o(foe); p8TourFight(); }, [+mySp, +foeSp]);
await pg.waitForSelector('#bt #m0 .mon .mma-idle', { timeout: 20000 });
await pg.waitForFunction(() => { const g = document.getElementById('go'); return g && !g.disabled && !document.getElementById('ban'); }, null, { timeout: 30000 });
await pg.waitForTimeout(500);
// バトルの進行（fight() のタイマー）を止める＝演出だけを確かめる（QA 専用）
await pg.evaluate(() => { window.setTimeout = function () { return 0; }; window.setInterval = function () { return 0; }; });
const results = [];
for (const k of moves.split(',').map(Number)) {
  // 自分の番でないときの技の演出が残っていないように待つ
  
  const ok = await pg.evaluate(([k, s]) => { window.__t0 = performance.now(); if (!MM25D.handles(k, s)) return 'not handled sp=' + (BPL && BPL[s] && BPL[s].sp); anim(k, s); return 'ok'; }, [k, +side]);
  if (ok !== 'ok') { results.push({ k, err: ok }); continue; }
  await pg.waitForFunction(() => document.querySelectorAll('#bt .p25f').length > 0, null, { timeout: 4000 });
  const n = await pg.evaluate(() => { const A = document.getAnimations(); window.__A = A.filter((a) => a.effect && a.effect.target && (a.effect.target.classList.contains('p25f'))); window.__A.forEach((a) => a.pause()); document.getAnimations().forEach((a) => { try { a.pause(); } catch (e) {} }); return document.querySelectorAll('#bt .p25f').length; });
  for (let j = 0; j < n; j++) {
    const r = await pg.evaluate(([k, j, s]) => {
      const d = MM25D_DATA[k], P = MM25D.plan(k, true), D = window.__A[0].effect.getTiming().duration;
      const step = (D * 0.88) / d.cuts.length, t = step * (j + 0.55);
      window.__A.forEach((a) => { a.currentTime = t; });
      const ims = [...document.querySelectorAll('#bt .p25f')];
      const im = ims[j], c = d.cuts[j], r = im.getBoundingClientRect(), S = r.width / c.w, f = s ? -1 : 1;
      const bx0 = f > 0 ? r.left + (c.b[0] - c.x) * S : r.right - (c.b[2] - c.x) * S, bx1 = f > 0 ? r.left + (c.b[2] - c.x) * S : r.right - (c.b[0] - c.x) * S;
      const by0 = r.top + (c.b[1] - c.y) * S, by1 = r.top + (c.b[3] - c.y) * S;
      const hud = document.querySelector('#bt .hpr').getBoundingClientRect().bottom;
      const tm = document.querySelector('#m' + (1 - s) + ' .mon').getBoundingClientRect(), tcx = tm.left + tm.width / 2;
      const op = +getComputedStyle(im).opacity;
      return { j: j + 1, src: c.src, m: c.m, op: Math.round(op * 100) / 100, body: [bx0, by0, bx1, by1].map(Math.round), img: [r.left, r.top, r.right, r.bottom].map(Math.round), hud: Math.round(hud), W: innerWidth,
        reachT: f > 0 ? r.right >= tcx : r.left <= tcx, vsT: getComputedStyle(document.querySelector('#bt .vs')).transform, vsL: Math.round(document.querySelector('#bt .vs').getBoundingClientRect().left), imT: getComputedStyle(im).transform, S: Math.round(S * 1000) / 1000 };
    }, [k, j, +side]);
    await pg.waitForTimeout(60);
    await pg.screenshot({ path: `${out}/k${String(k).padStart(2, '0')}_${String(r.j).padStart(2, '0')}.png` });
    r.clipX = r.body[0] < 0 || r.body[2] > r.W; r.clipTop = r.body[1] < r.hud;
    results.push({ k, ...r });
  }
  await pg.evaluate(() => { document.querySelectorAll('#bt .p25f, #bt .mmst').forEach((e) => e.remove()); document.getAnimations().forEach((a) => { try { a.cancel(); } catch (e) {} }); });
  await pg.waitForTimeout(300);
}
fs.writeFileSync(`${out}/result.json`, JSON.stringify(results, null, 0));
for (const r of results) console.log(JSON.stringify(r));
console.log('errors', JSON.stringify(p.errors), 'bad', JSON.stringify(p.bad));
await L.close();
