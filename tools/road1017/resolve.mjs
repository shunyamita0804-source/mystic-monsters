// 2026-10-17 道路画質（P0）の QA：画面で実際に見分けられる地面の細かさ（実効の px／世界の1単位）を測る（テストではない道具）
//   node tools/road1017/resolve.mjs [出力 JSON]   （QA_CHROME_ARGS で GPU／ソフトウェアの描き方を切り替えて比べる）
//   いちばん寄った所（倍率 s≈5.6）で、近くの層の区画（canvas）に縦縞を描く：周期 p＝0.25／0.5／1／2／4 単位（白黒）。
//   画面を撮り、縞の中央の横1行の明暗の差（コントラスト・0〜1）を周期ごとに計る。0.5 以上で見分けられる＝その周期の半分が実効の画素
//   同じことを従来の遠くの層（1単位 2px）にも描いて比べる（?qaRoadRes で近くの層の細かさを変えられる）
import { launch } from '../../tests/e2e/harness.mjs';
import { writeFileSync } from 'node:fs';
const OUT = process.argv[2] || 'resolve.json';
const VARS = process.env.QA_VAR ? JSON.parse(process.env.QA_VAR) : [['far', ''], ['hi5', '&qaRoad=1'], ['hi10', '&qaRoadArt=fix']];
const L = await launch(); const res = [];
for (const [tag, q] of VARS) {
  const p = await L.open({ worldCh1: true, route: 'A', query: '?ch1trial=A&qaCam=c' + q, size: [390, 844], dsf: 3 }); const pg = p.page;
  await pg.waitForFunction(() => window.MMWB && MMWB.world() && MMWB.world().isReady() && S.m && S.m.raise && S.m.raise.ch === 1, null, { timeout: 120000 });
  await pg.evaluate(() => { S.m.raise.field.tiles = {}; board(); }); await pg.waitForTimeout(7000);
  const r = await pg.evaluate(() => {
    const W = MMWB.world(), s = W.state(), c = s.cam;
    // 画面の中央・下から 35% の所の世界の点（注視点の少し手前）に、横 40 単位 × 縦 6 単位の縞の帯を5本（周期ごと）
    const cx = c.tx, cy = c.ty + 6;
    const cvs = [...document.querySelectorAll('.rfw-chunk')];   // 遠くの層と近くの層の両方（重なる区画すべて・canvas の外は自然に切れる）
    const P = [0.25, 0.5, 1, 2, 4], out = [];
    for (const k of cvs) {
      const R = k.width / parseFloat(k.style.width), x0 = parseFloat(k.style.left), y0 = parseFloat(k.style.top), w = parseFloat(k.style.width), h = parseFloat(k.style.height);
      if (cx + 20 < x0 || cx - 20 > x0 + w || cy + 28 < y0 || cy - 2 > y0 + h) continue;
      const g = k.getContext('2d'); g.save(); g.setTransform(R, 0, 0, R, -(x0 * R), -(y0 * R));
      P.forEach((per, i) => { const yy = cy + i * 6; g.fillStyle = '#000'; g.fillRect(cx - 20, yy, 40, 5); g.fillStyle = '#fff'; for (let x = cx - 20; x < cx + 20; x += per) g.fillRect(x, yy, per / 2, 5); });
      g.restore(); out.push(R);
    }
    const rows = P.map((per, i) => { const a = W.project(cx - 18, cy + i * 6 + 2.5), b = W.project(cx + 18, cy + i * 6 + 2.5); return { per, y: (a.y + b.y) / 2, x0: a.x, x1: b.x }; });
    return { s: +c.s.toFixed(2), painted: out, rows, dpr: devicePixelRatio };
  });
  await pg.waitForTimeout(800);
  const buf = await pg.screenshot({ path: OUT.replace(/\.json$/, '') + `_${tag}.png` });
  const con = await pg.evaluate(async ({ b64, rows, dpr }) => {
    const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
    const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
    return rows.map((r) => { const y = Math.round(r.y * dpr), x0 = Math.round(r.x0 * dpr), x1 = Math.round(r.x1 * dpr); const d = g.getImageData(x0, y, x1 - x0, 1).data; const v = [];
      for (let i = 0; i < d.length; i += 4) v.push((d[i] + d[i + 1] + d[i + 2]) / 3); v.sort((a, b) => a - b); const lo = v[Math.floor(v.length * 0.05)], hi = v[Math.floor(v.length * 0.95)];
      return { per: r.per, contrast: +((hi - lo) / 255).toFixed(2), screenPxPerPeriod: +((r.x1 - r.x0) * dpr / 36 * r.per).toFixed(1) }; });
  }, { b64: buf.toString('base64'), rows: r.rows, dpr: r.dpr });
  res.push({ tag, s: r.s, painted: r.painted, con }); console.log(tag, r.s, JSON.stringify(r.painted), JSON.stringify(con));
  await p.ctx.close();
}
await L.close(); writeFileSync(OUT, JSON.stringify(res, null, 1));
