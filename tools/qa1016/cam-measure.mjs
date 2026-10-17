// 2026-10-16 QA：カメラの方式（従来／固定／C案／C案切替）を同じ出目・同じ道で歩かせて比べる（テストではない計測の道具）
//   node tools/qa1016/cam-measure.mjs [出力 JSON] [録画フォルダ（任意）]
//   Chapter 1 A と Chapter 2 A／B／C。マスの中身は空にして（出来事・バトルを出さない）、決まった出目で歩く。分かれ道は最初の道
//   計る物：回った角度の合計・回っている時間・回り始めた回数・最大の速さ・止まったときに先の地点（最大4）が画面の空いている所に入っている割合・モンスターの画面の位置の揺れ
import { launch, finishTalk } from '../../tests/e2e/harness.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
const OUT = process.argv[2] || 'cam-measure.json', VID = process.argv[3] || null;
const DICE = [3, 4, 2, 5, 3, 4, 2, 3, 4, 3, 5, 2];
const MODES = process.env.QA_MODES ? JSON.parse(process.env.QA_MODES) : ['', 'fixed', 'c', 'ccut'];   // 例 '["c","c&qaCamDeg=70"]'（qaCam= のあとに足す）
const CASES = [{ ch: 1, route: 'A', rolls: 10 }, { ch: 2, route: 'A', rolls: 10 }, { ch: 2, route: 'B', rolls: 10 }, { ch: 2, route: 'C', rolls: 10 }];
const L = await launch();
const res = [];
async function settle(pg) {
  for (let i = 0; i < 200; i++) {
    if (await pg.$('.mmtalk:not(.mmtalk-out)')) { await finishTalk(pg); continue; }
    const st = await pg.evaluate(() => ({ busy: !!bBusy, fx: !!document.querySelector('.wbrelay,.wb-pop,.chf-enc2,.d3z,#bt,#tvs'), ph: S.m && S.m.raise ? MMP8.boardPhase(S.m) : '' }));
    if (st.ph === 'branch' && !st.busy) { await pg.evaluate(() => { const b = document.querySelector('.wbbr .chroute'); if (b) b.click(); }); await pg.waitForTimeout(300); continue; }
    if (!st.busy && !st.fx) break;
    await pg.waitForTimeout(250);
  }
  await pg.waitForTimeout(700);
}
const ONLY = process.env.QA_ONLY ? JSON.parse(process.env.QA_ONLY) : null;
for (const cs of CASES) for (const mode of MODES) {
  if (ONLY && !(ONLY.ch === cs.ch && ONLY.route === cs.route && (ONLY.mode == null || ONLY.mode === mode))) continue;
  console.log('case', cs.ch, cs.route, mode || 'old');
  const q = (cs.ch === 1 ? `?ch1trial=${cs.route}` : `?ch2trial=${cs.route}`) + (mode ? `&qaCam=${mode}` : '');
  const p = await L.open({ worldCh1: true, worldCh2: true, route: cs.route, route2: cs.route, query: q, ...(VID ? { video: VID } : {}) });
  const pg = p.page;
  try {
    await pg.waitForFunction((ch) => window.MMWB && MMWB.world() && MMWB.world().isReady() && S.m && S.m.raise && S.m.raise.ch === ch, cs.ch, { timeout: 90000 });
    await pg.evaluate(() => { const f = S.m.raise.field; f.tiles = {}; board(); });   // 出来事・バトルを出さない（ページの中だけ・保存しない）
    await settle(pg);
    const save0 = await pg.evaluate(() => localStorage.getItem('mr4v6'));
    await pg.evaluate(() => MMWB.world().qa(true));
    const stops = [], monPx = [];
    for (let i = 0; i < cs.rolls; i++) {
      const ph = await pg.evaluate(() => MMP8.boardPhase(S.m));
      if (ph !== 'roll') break;
      const v = DICE[i % DICE.length];
      await pg.evaluate((v) => { const mr = Math.random; Math.random = () => (v - 0.5) / 6; document.getElementById('brollbtn').click(); Math.random = mr; }, v);
      await pg.waitForTimeout(400);
      await settle(pg);
      const st = await pg.evaluate(() => {
        const W = MMWB.world(), s = W.state(), v = s.view, D = MMWB.world().opts && null;
        const nodes = (window.MMWD2 && S.m.raise.ch === 2 ? MMWD2 : MMWD).dataOf(S.m).nodes;
        const ah = (s.ahead || []).slice(0, 4).map((id) => W.project(nodes[id][0], nodes[id][1]));
        const inn = ah.filter((q) => q.x > 0 && q.x < v.W && q.y > v.top && q.y < v.bottom).length;
        const mq = s.mon ? W.project(s.mon[0], s.mon[1]) : null;
        return { node: S.m.raise.node, ahead: ah.length, inView: inn, mon: mq && [Math.round(mq.x), Math.round(mq.y)], yaw: +s.yaw.toFixed(1), s: +s.cam.s.toFixed(2) };
      });
      stops.push(st); if (st.mon) monPx.push(st.mon);
    }
    const qa = await pg.evaluate(() => MMWB.world().qa());
    const save1 = await pg.evaluate(() => localStorage.getItem('mr4v6'));
    const vis = stops.reduce((a, s) => a + (s.ahead ? s.inView / s.ahead : 1), 0) / Math.max(1, stops.length);
    const xs = monPx.map((m) => m[0]), ys = monPx.map((m) => m[1]);
    res.push({ ch: cs.ch, route: cs.route, mode: mode || 'old', rolls: stops.length, deg: Math.round(qa.deg), rotMs: Math.round(qa.ms), turns: qa.turns, maxRate: Math.round(qa.maxRate), reorient: qa.reorient,
      aheadInView: +vis.toFixed(3), monX: [Math.min(...xs), Math.max(...xs)], monY: [Math.min(...ys), Math.max(...ys)], saveUnchanged: save0 === save1, errors: p.errors.length, bad: p.bad.length, stops });
    console.log(JSON.stringify(res[res.length - 1]).slice(0, 300));
  } catch (e) { res.push({ ch: cs.ch, route: cs.route, mode: mode || 'old', error: String(e && e.message || e) }); console.log('ERR', cs, mode, e.message); }
  await p.ctx.close();
}
await L.close();
mkdirSync(new URL('.', 'file://' + (OUT.startsWith('/') ? OUT : process.cwd() + '/' + OUT)).pathname, { recursive: true });
writeFileSync(OUT, JSON.stringify(res, null, 1));
