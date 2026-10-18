// 2026-10-18 REV3 F0-3：体格の倍率の実測（証拠用・テストではない）。
//  QA_E2E=1 node tools/rev3_1018/size_fit.mjs [--q=&mmSize=F]
//  各画面サイズ × 公式戦／練習試合 × 種族の組み合わせで、待機立ち絵の不透明な部分（VIS_H から求めた上端）と HP の帯（.hpr）・技名の帯（.skb3）・下の説明（#msg）・画面の左右との余白（px）を出す
import * as H from '../../tests/e2e/harness.mjs';
const opt = Object.fromEntries(process.argv.slice(2).filter((x) => x.startsWith('--')).map((x) => x.slice(2).split('=')));
const SIZES = [[375, 667], [390, 844], [393, 852]], PAIRS = [[3, 3], [3, 1], [0, 3], [1, 4], [2, 0], [6, 3], [5, 3]];
const L = await H.launch(); const rows = [];
for (const size of SIZES) {
  const p = await L.open({ size, stage: true, query: '?mmQaTrial=1' + (opt.q || '') }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  for (const [me, foe] of PAIRS) {
    for (const prac of [false, true]) {
      const r = await pg.evaluate(async ({ me, foe, prac }) => {
        const old = document.getElementById('bt'); if (old) old.remove();
        if (window.MMQA && MMQA.isOn && !MMQA.isOn()) MMQA.toggle && MMQA.toggle();
        const m = MMQA.makeMon(me === 5 || me === 6 ? 0 : me); m.speed = 10;
        m.raise = { battle: { kind: 'practice', rank: 0, done: false, qa: true, snap: { g: S.g, wins: S.wins, br: S.br, rk: m.rk, fa: m.fa, st: m.st } } }; S.m = m;
        battleDress({ rank: 0, label: 'QA', name: '相手' }); battleFoeOnce(foe > 1 ? 0 : foe); TB_SKIP_INTRO = true; fight(0); battleDressDom();
        const bt = document.getElementById('bt'); if (!prac) { delete bt.dataset.mmprac; bt.dataset.mmrank = 'E'; }
        // 種族を差し替え（見た目の大きさだけ）：BPL の sp と待機の絵
        const A = MMARENA, T = MMTUNE; const setSp = (s, sp) => { const mon = document.querySelector(`#bt #m${s} .mon`); if (!mon) return; const img = mon.querySelector('.mma-idle'); if (img && A.idleSrc) { const u = A.idleSrc(sp) || ({ 5: './assets/battle/idle/idle_flurene.webp', 6: './assets/battle/idle/idle_razuck.webp' })[sp]; if (u) img.src = u; } mon.style.setProperty('--mma-k', String((A.SCALE[sp] || 0.91) * T.sizeK(sp))); };
        const wait = (ms) => new Promise((r) => setTimeout(r, ms));
        for (let i = 0; i < 80; i++) { if (document.querySelector('#bt #m1 .mon .mma-idle') && !document.querySelector('#bt .mmskc')) break; await wait(100); }
        const calm = () => { const g = document.getElementById('go'), v = document.querySelector('#bt .vs'), t = v ? getComputedStyle(v).transform : 'none', m = /matrix\(([^,]+),/.exec(t);
          return g && !g.disabled && !g.classList.contains('bk') && !document.querySelector('#bt .mmskc') && (t === 'none' || (m && Math.abs(+m[1] - 1) < 0.001)); };
        for (let i = 0; i < 150 && !calm(); i++) await wait(100);
        await wait(400); setSp(0, me); setSp(1, foe); await wait(500);
        const q = (s) => document.querySelector(s), R = (e) => e ? e.getBoundingClientRect() : null;
        const hud = R(q('#bt .hpr')), msg = R(q('#bt .bui')), W = innerWidth;
        skb(0, 0); await wait(60); const ban = R(q('#bt .skb3'));
        const out = { sp: [me, foe], prac };
        [0, 1].forEach((s) => { const im = q(`#bt #m${s} .mon .mma-idle`), r = R(im), sp = s ? foe : me; if (!r) return;
          const visTop = r.bottom - r.height * (T.VIS_H[sp] || 0.9) / (A.SCALE[sp] || 0.91);
          out['s' + s] = { k: +(T.sizeK(sp)).toFixed(3), h: Math.round(r.bottom - visTop), topGap: Math.round(visTop - hud.bottom), botGap: Math.round(msg.top - r.bottom), calm: calm(), left: Math.round(r.left), right: Math.round(W - r.right), banGap: ban ? Math.round(visTop - ban.bottom) : null }; });
        return out;
      }, { me, foe, prac });
      rows.push(Object.assign({ size: size.join('x') }, r));
    }
  }
  console.error(size, JSON.stringify(p.errors.slice(0, 3)));
  await p.ctx.close();
}
await L.close();
console.log(JSON.stringify(rows));
