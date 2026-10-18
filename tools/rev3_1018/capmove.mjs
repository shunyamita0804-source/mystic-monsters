// 2026-10-18 REV3：技アニメを本番と同じ描画（anim(k, s)）で再生し、時刻ごとに画面を撮る（証拠用・テストではない）
//  使い方：QA_E2E=1 node tools/rev3_1018/capmove.mjs <出力フォルダ> <自分の種族> <相手の種族> <SK…> [--side=1] [--size=390x844] [--q=…]
import * as H from '../../tests/e2e/harness.mjs';
const [out, me, foe, ...rest] = process.argv.slice(2);
const opt = Object.fromEntries(rest.filter((x) => x.startsWith('--')).map((x) => x.slice(2).split('=')));
const ks = rest.filter((x) => !x.startsWith('--')).map(Number);
const size = (opt.size || '390x844').split('x').map(Number);
const side = +(opt.side || 0);
const L = await H.launch();
for (const k of ks) {
  const p = await L.open({ size, stage: true, query: '?mmQaTrial=1' + (opt.q || '') }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(({ me, foe, k, side }) => {
    const mk1 = (sp) => { const m = MMQA.makeMon(sp); m.speed = side ? 1 : 10; return m; };
    const m = mk1(me); m.sk = [k]; m.eq = [k, k, k, k, k, k];
    m.raise = { battle: { kind: 'practice', rank: 0, done: false, qa: true, snap: { g: S.g, wins: S.wins, br: S.br, rk: m.rk, fa: m.fa, st: m.st } } }; S.m = m;
    if (me >= 5 && MMQA._lend) MMQA._lend(me);   // 未解禁の種族（フルーネ 5・ラズック 6）は QA と同じく絵を貸す（ページの中だけ）
    battleDress({ rank: 0, label: 'QA', name: '相手' }); battleFoeOnce(foe); TB_SKIP_INTRO = true; fight(0); battleDressDom();
  }, { me: +me, foe: +foe, k, side });
  await pg.waitForSelector('#bt #m0 .mon .mma-idle');
  await pg.waitForFunction(() => { const g = document.getElementById('go'); return g && !g.disabled && !g.classList.contains('bk'); }, null, { timeout: 30000 });
  await pg.waitForFunction(() => { const t = getComputedStyle(document.querySelector('#bt .vs')).transform; const m = /matrix\(([^,]+),/.exec(t); return t === 'none' || (m && Math.abs(+m[1] - 1) < 0.001); }, null, { timeout: 30000 });
  await pg.waitForTimeout(400);
  await pg.evaluate(({ k, side }) => { window.__t0 = performance.now(); anim(k, side); }, { k, side });
  const ts = (opt.t || '150,450,750,1050,1350,1650,1950,2300').split(',').map(Number);
  let last = 0;
  for (const t of ts) { await pg.waitForTimeout(Math.max(0, t - last)); last = t; await pg.screenshot({ path: `${out}/sk${k}_s${side}_${String(t).padStart(4, '0')}.png` }); }
  const info = await pg.evaluate(() => [...document.querySelectorAll('#bt .p25f')].map((e) => e.getAttribute('src')));
  console.log(k, JSON.stringify(p.errors), JSON.stringify(p.bad), info.length);
  await p.ctx.close();
}
await L.close();
