// 2026-10-16 QA：カメラの方式ごとに同じ出目で歩く画面を録画して、横に並べた比較動画を作る（テストではない・確認の資料）
//   node tools/qa1016/cam-record.mjs <出力フォルダ> [ch] [route] [modes（カンマ区切り。既定 old,c,ccut）]
//   道路の比較：QA_SETS='[["従来",""],["案1","qaRoad=1"],["案2","qaRoad=2"]]' のように [名前, URL に足す] の組で渡すと、その組で撮る（名前は動画の下の札）
//   出力：<ch><route>_<mode>.mp4（1本ずつ）と <ch><route>_compare.mp4（横に並べた比較・上に方式の名前）
import { launch, finishTalk } from '../../tests/e2e/harness.mjs';
import { mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
const OUT = process.argv[2], CH = Number(process.argv[3] || 1), RT = process.argv[4] || 'A';
const SETS = process.env.QA_SETS ? JSON.parse(process.env.QA_SETS) : (process.argv[5] || 'old,c,ccut').split(',').map((m) => [m, m === 'old' ? '' : 'qaCam=' + m]);
const MODES = SETS.map((x, i) => 's' + i);
const DICE = [3, 4, 2, 5, 3, 4, 2, 3];
mkdirSync(OUT, { recursive: true });
const FONT = '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc';
async function settle(pg) {
  for (let i = 0; i < 200; i++) {
    if (await pg.$('.mmtalk:not(.mmtalk-out)')) { await finishTalk(pg); continue; }
    const st = await pg.evaluate(() => ({ busy: !!bBusy, fx: !!document.querySelector('.wbrelay,.wb-pop,.d3z,#bt,#tvs'), ph: MMP8.boardPhase(S.m) }));
    if (st.ph === 'branch' && !st.busy) { await pg.waitForTimeout(500); await pg.evaluate(() => { const b = document.querySelector('.wbbr .chroute'); if (b) b.click(); }); await pg.waitForTimeout(300); continue; }
    if (!st.busy && !st.fx) break;
    await pg.waitForTimeout(200);
  }
  await pg.waitForTimeout(1100);
}
const L = await launch(), clips = [];
for (const [si, mode] of MODES.entries()) {
  const [label, extra] = SETS[si];
  const tmp = path.join(OUT, '_v_' + mode); rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
  const q = (CH === 1 ? `?ch1trial=${RT}` : `?ch2trial=${RT}`) + (extra ? '&' + extra : '') + '&qaWalk=' + (process.env.QA_WALK || '');
  const t0 = Date.now();
  const p = await L.open({ worldCh1: true, worldCh2: true, route: RT, route2: RT, query: q.replace(/&qaWalk=$/, ''), video: tmp, size: [390, 844], dsf: Number(process.env.QA_DSF || 1) }), pg = p.page;
  await pg.waitForFunction((ch) => window.MMWB && MMWB.world() && MMWB.world().isReady() && S.m && S.m.raise && S.m.raise.ch === ch, CH, { timeout: 90000 });
  await pg.evaluate(() => { S.m.raise.field.tiles = {}; board(); });
  await settle(pg);
  const start = (Date.now() - t0) / 1000 - 0.3;
  for (const v of DICE) {
    if (await pg.evaluate(() => MMP8.boardPhase(S.m)) !== 'roll') break;
    await pg.evaluate((v) => { const mr = Math.random; Math.random = () => (v - 0.5) / 6; document.getElementById('brollbtn').click(); Math.random = mr; }, v);
    await pg.waitForTimeout(400); await settle(pg);
  }
  const dur = (Date.now() - t0) / 1000 - start;
  await p.ctx.close();
  const webm = readdirSync(tmp).find((f) => f.endsWith('.webm')), mp4 = path.join(OUT, `ch${CH}${RT}_${(process.env.QA_TAG || '')}${si}.mp4`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', start.toFixed(2), '-i', path.join(tmp, webm), '-t', dur.toFixed(2), '-vf', `scale=390:844,drawtext=fontfile=${FONT}:text='${label.replace(/'/g, '')}':x=8:y=h-28:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6`, '-r', '30', '-c:v', 'libx264', '-crf', '30', '-pix_fmt', 'yuv420p', mp4]);
  rmSync(tmp, { recursive: true, force: true });
  clips.push({ mode: label, mp4, dur }); console.log(label, mp4, dur.toFixed(1) + 's');
}
await L.close();
if (clips.length > 1) {
  const D = Math.max(...clips.map((c) => c.dur)), args = ['-y', '-loglevel', 'error'];
  for (const c of clips) args.push('-i', c.mp4);
  const fl = clips.map((c, i) => `[${i}:v]tpad=stop_mode=clone:stop_duration=${(D - c.dur + 0.1).toFixed(2)},scale=260:-2[v${i}]`).join(';') + ';' + clips.map((c, i) => `[v${i}]`).join('') + `hstack=inputs=${clips.length}[o]`;
  args.push('-filter_complex', fl, '-map', '[o]', '-t', D.toFixed(2), '-r', '30', '-c:v', 'libx264', '-crf', '30', '-pix_fmt', 'yuv420p', path.join(OUT, `ch${CH}${RT}_${(process.env.QA_TAG || '')}compare.mp4`));
  execFileSync('ffmpeg', args); console.log('compare', path.join(OUT, `ch${CH}${RT}_${(process.env.QA_TAG || '')}compare.mp4`));
}
