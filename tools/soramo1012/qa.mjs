// ソラモの正式の技アニメ（2026-10-12）の確認：node tools/soramo1012/qa.mjs <side 0|1> <moves> <outdir> [w,h]
//   通常の URL のバトル（大会）を開き、fight() のタイマーを止めて MM25D.anim だけを再生 → 区切りごとの中ほどで止めて画面を撮る（tools/battle25d/qa25.mjs と同じやり方）。
//   side 1＝相手側のソラモ（自分はガウル）。結果は <outdir>/k<技>_s<側>_<区切り>.png と report.json（本体の位置・画面の外・HUD との重なり）
import * as H from '../../tests/e2e/harness.mjs';
import fs from 'node:fs';
const [,, side = '0', moves = '0,1,2,3,4,5,6,7,8,9', out = './qa-soramo', size = '390,844'] = process.argv;
fs.mkdirSync(out, { recursive: true });
const L = await H.launch();
const p = await L.open({ size: size.split(',').map(Number), stage: true });
const pg = p.page, s = +side;
await H.newGame(pg, 'テスト');
await pg.evaluate((s) => { const m = mk(s ? 1 : 0); m.name = 'テスト'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); board(); }, s);
await pg.waitForSelector('#chrcv .rcv-row', { timeout: 20000 });
await pg.evaluate((s) => { MMP8.startTournament(S, S.m, 0, 7); if (!s) { S.m.sk = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; S.m.eq = S.m.sk.slice(0, 6); } save(); const o = window.battleFoeOnce; window.battleFoeOnce = () => o(s ? 0 : 1); p8TourFight(); }, s);
await pg.waitForSelector('#bt #m0 .mon .mma-idle', { timeout: 20000 });
await pg.waitForFunction(() => { const g = document.getElementById('go'); return g && !g.disabled && !document.getElementById('ban'); }, null, { timeout: 30000 });
await pg.waitForTimeout(500);
await pg.evaluate(() => { window.setTimeout = function () { return 0; }; window.setInterval = function () { return 0; }; });
const report = [];
for (const k of moves.split(',').map(Number)) {
  const ok = await pg.evaluate(([k, s]) => { document.querySelectorAll('#bt .p25f').forEach((e) => e.remove()); if (!MM25D.offData(k, s)) return 'not handled'; const r = MM25D.anim(k, s); return r ? 'ok' : 'false'; }, [k, s]);
  if (ok !== 'ok') { report.push({ k, err: ok }); continue; }
  await pg.waitForTimeout(150);
  const steps = await pg.evaluate(() => { window.__A = document.getAnimations().filter((a) => a.effect && a.effect.target && a.effect.target.classList && (a.effect.target.classList.contains('p25f') || a.effect.target.id === 'm0' || a.effect.target.id === 'm1')); window.__A.forEach((a) => a.pause()); return MMSOMV_DATA; });
  const d = steps[k];
  for (let j = 0; j < d.steps; j++) {
    const r = await pg.evaluate(([k, j, s]) => {
      const D = window.__A[0].effect.getTiming().duration, n = MMSOMV_DATA[k].steps, st = (D * 0.88) / n, t = st * (j + 0.6);   // 実際の長さから（共通演出を通るかで長さが変わる）
      window.__A.forEach((a) => { a.currentTime = t; });
      const vis = [...document.querySelectorAll('#bt .p25f')].filter((e) => +getComputedStyle(e).opacity > 0.5).map((e) => { const q = e.getBoundingClientRect(); return { cut: e.dataset.cut, r: [q.left, q.top, q.right, q.bottom].map(Math.round) }; });
      const hud = Math.round(document.querySelector('#bt .hpr').getBoundingClientRect().bottom), me = +getComputedStyle(document.getElementById('m' + s)).opacity;
      return { j: j + 1, vis, hud, W: innerWidth, H: innerHeight, meOpacity: me };
    }, [k, j, s]);
    await pg.screenshot({ path: `${out}/k${k}_s${s}_${j + 1}.png` });
    report.push({ k, ...r });
  }
  await pg.evaluate(() => { window.__A.forEach((a) => a.finish()); document.querySelectorAll('#bt .p25f').forEach((e) => e.remove()); });
}
fs.writeFileSync(`${out}/report.json`, JSON.stringify({ errors: p.errors, bad: p.bad, report }, null, 1));
console.log(JSON.stringify({ errors: p.errors, bad: p.bad, n: report.length }));
await L.close();
