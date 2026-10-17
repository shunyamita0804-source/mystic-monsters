// 2026-10-17 道路画質（P0）の QA：従来／旧素材＋近くの層（?qaRoad=1）／新素材 raw／新素材 fix を同じ出目・同じ道・C案カメラで歩かせて撮り、計る（テストではない道具）
//   node tools/road1017/compare.mjs <出力フォルダ> [録画する？ 1]
//   画素比 3（iPhone と同じ）・390×844。GPU で描く（QA_CHROME_ARGS を付けて起動＝iPhone の Safari に近い・ソフトウェア描画では 3D の板が低い倍率で描かれてブロック状になる）。マスの中身は空（出来事・バトルを出さない＝ページの中だけ・保存しない）
//   撮る物：止まるたびの画面（ふつう）と「地面だけ」（マス・モンスター・景物・UI を隠す）
//   計る物：カメラの倍率 s・画面の画素 ÷ 素材の画素（引き伸ばしの倍率）・地面の細かさ（隣の画素の差の平均・画面の下半分）・近くの層の枚数とメモリ・歩く間のフレームの時間
import { launch, finishTalk } from '../../tests/e2e/harness.mjs';
import { writeFileSync, mkdirSync } from 'node:fs';
const OUT = process.argv[2] || 'road1017-out', VID = process.argv[3] === '1';
mkdirSync(OUT, { recursive: true });
const SIZE = process.env.QA_SIZE ? JSON.parse(process.env.QA_SIZE) : [390, 844];
const DICE = [3, 4, 2, 5, 3, 4];
const VAR = process.env.QA_VAR ? JSON.parse(process.env.QA_VAR) : [['old', ''], ['old_hi', '&qaRoad=1'], ['raw', '&qaRoadArt=raw'], ['fix', '&qaRoadArt=fix'], ['fix_r01', '&qaRoadArt=fix&qaRoad=2']];
const CASES = process.env.QA_CASES ? JSON.parse(process.env.QA_CASES) : [{ ch: 1, route: 'A', rolls: 5 }, { ch: 1, route: 'C', rolls: 4 }, { ch: 2, route: 'A', rolls: 5 }];
const L = await launch();
const res = [];
async function settle(pg) {
  for (let i = 0; i < 240; i++) {
    if (await pg.$('.mmtalk:not(.mmtalk-out)')) { await finishTalk(pg); continue; }
    const st = await pg.evaluate(() => ({ busy: !!bBusy, fx: !!document.querySelector('.wbrelay,.wb-pop,.chf-enc2,.d3z,#bt,#tvs'), ph: S.m && S.m.raise ? MMP8.boardPhase(S.m) : '' }));
    if (st.ph === 'branch' && !st.busy) { await pg.evaluate(() => { const b = document.querySelector('.wbbr .chroute'); if (b) b.click(); }); await pg.waitForTimeout(300); continue; }
    if (!st.busy && !st.fx) break;
    await pg.waitForTimeout(250);
  }
}
async function hiDone(pg) { for (let i = 0; i < 80; i++) { const q = await pg.evaluate(() => MMWB.world().qaRoad()); if (!q || !q.pending) return q; await pg.waitForTimeout(150); } return null; }
/** 地面の細かさ：画面の下 45〜90% の帯の、隣どうしの画素の差の平均（RGB・0〜255）＝大きいほど描き込みが見えている */
async function sharpOf(pg, file) {
  const buf = await pg.screenshot({ path: file });
  return pg.evaluate(async (b64) => {
    const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
    const c = document.createElement('canvas'), W = im.width, H = im.height; c.width = W; c.height = H; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
    const y0 = Math.round(H * 0.45), y1 = Math.round(H * 0.9), d = g.getImageData(0, y0, W, y1 - y0).data; let s = 0, n = 0;
    for (let y = 0; y < y1 - y0 - 1; y++) for (let x = 0; x < W - 1; x++) { const k = (y * W + x) * 4, r = k + 4, u = k + W * 4;
      for (let ch = 0; ch < 3; ch++) { s += Math.abs(d[k + ch] - d[r + ch]) + Math.abs(d[k + ch] - d[u + ch]); n += 2; } }
    return +(s / n).toFixed(3);
  }, buf.toString('base64'));
}
for (const cs of CASES) for (const [tag, q] of VAR) {
  if (cs.ch === 1 && /r01/.test(tag)) continue;   // 白い橋帯 R01 は Chapter 2 だけ
  const name = `ch${cs.ch}${cs.route}_${tag}`; console.log('case', name);
  const query = (cs.ch === 1 ? `?ch1trial=${cs.route}` : `?ch2trial=${cs.route}`) + '&qaCam=c' + q;
  const p = await L.open({ worldCh1: true, worldCh2: true, route: cs.route, route2: cs.route, query, size: SIZE, dsf: 3, ...(VID ? { video: `${OUT}/video_${name}` } : {}) });
  const pg = p.page;
  try {
    await pg.waitForFunction((ch) => window.MMWB && MMWB.world() && MMWB.world().isReady() && S.m && S.m.raise && S.m.raise.ch === ch, cs.ch, { timeout: 120000 });
    await pg.evaluate(() => { const f = S.m.raise.field; f.tiles = {}; board(); });
    await settle(pg);
    const save0 = await pg.evaluate(() => localStorage.getItem('mr4v6'));
    const stops = [];
    for (let i = 0; i < cs.rolls; i++) {
      if (await pg.evaluate(() => MMP8.boardPhase(S.m)) !== 'roll') break;
      const v = DICE[i % DICE.length];
      await pg.evaluate(() => { window.__ft = []; let last = performance.now(); const loop = (t) => { window.__ft.push(t - last); last = t; if (window.__ft.length < 2000 && !window.__ftStop) requestAnimationFrame(loop); }; window.__ftStop = false; requestAnimationFrame(loop); });
      await pg.evaluate((v) => { const mr = Math.random; Math.random = () => (v - 0.5) / 6; document.getElementById('brollbtn').click(); Math.random = mr; }, v);
      await pg.waitForTimeout(400); await settle(pg);
      const ft = await pg.evaluate(() => { window.__ftStop = true; const a = window.__ft.slice(3).sort((x, y) => x - y); const at = (p) => a.length ? +a[Math.min(a.length - 1, Math.floor(a.length * p))].toFixed(1) : null; return { n: a.length, p50: at(0.5), p95: at(0.95), max: at(1), over33: a.filter((x) => x > 34).length }; });
      const hq = await hiDone(pg); await pg.waitForTimeout(500);
      const cam = await pg.evaluate(() => { const s = MMWB.world().state(); const g = MMWB.world().artInfo ? MMWB.world().artInfo() : null; return { s: +s.cam.s.toFixed(2), node: S.m.raise.node, yaw: +(s.yaw || 0).toFixed(1) }; });
      const f1 = `${OUT}/${name}_${i}.png`, f2 = `${OUT}/${name}_${i}_ground.png`;
      await pg.screenshot({ path: f1 });
      await pg.addStyleTag({ content: '.rfw-bb,.chh,.wbh,#wbw>*:not(.wbv),.chdeck,.chdeckwrap,.wbdeck,#bmsg{visibility:hidden!important}' });
      const sharp = await sharpOf(pg, f2);
      await pg.evaluate(() => { const st = [...document.querySelectorAll('style')].pop(); st.remove(); });
      stops.push({ ...cam, sharp, hi: hq, ft });
      console.log(' ', JSON.stringify(stops[stops.length - 1]));
    }
    const save1 = await pg.evaluate(() => localStorage.getItem('mr4v6'));
    const art = await pg.evaluate(() => (window.MMQRA ? MMQRA.loaded() : null));
    res.push({ name, query, stops, saveUnchanged: save0 === save1, art, errors: p.errors, bad: p.bad });
  } catch (e) { res.push({ name, error: String(e && e.message || e) }); console.log('ERR', name, e.message); }
  await p.ctx.close();
}
await L.close();
writeFileSync(`${OUT}/result.json`, JSON.stringify(res, null, 1));
for (const r of res) if (r.stops) console.log(r.name, 'sharp', r.stops.map((s) => s.sharp).join(' '), 's', r.stops.map((s) => s.s).join(' '), 'p95', r.stops.map((s) => s.ft.p95).join(' '), 'err', r.errors.length, r.bad.length, 'saveSame', r.saveUnchanged);
