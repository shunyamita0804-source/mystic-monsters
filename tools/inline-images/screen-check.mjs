// 外部化した画像（assets/inline/）の実ブラウザ確認（テストではない道具。Playwright＋Chromium が要る）
//   node tools/inline-images/screen-check.mjs <スクリーンショットの出力先>
//  1) manifest の175ファイルをすべてページから読み、404 が無い・画像として読める（naturalWidth>0）
//  2) 主要画面（開始・街・牧場・市場・研究所・Chapter 1・大会・バトル＝新／旧の画面）で、表示中の assets/inline の <img> がすべて読めている・404 が無い
//  3) 先読み（MMINL）：開始・街などでは何も読まない／大会の対戦表で、そのバトルの絵を読み終えている＝バトルの開始の瞬間に表示中の絵がすべて読めている
//  5) 回線を遅くした状態（4倍遅い CPU・下り 1.6Mbps・往復 150ms）で、開始画面が出るまでの時間を外部化の前と比べ、対戦表を3秒見てからのバトル開始で絵が読めている
//  4) 動かない画面（開始・街・研究所の図鑑・大会の対戦表）を外部化の前の index.html（git の HEAD~ の版を一時ファイルに）と画素で比べる（任意：環境変数 ORIG に元の index.html のパス）
import { writeFileSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import * as H from '../../tests/e2e/harness.mjs';

const OUT = process.argv[2] || '/tmp/inline-check';
mkdirSync(OUT, { recursive: true });
const MAN = JSON.parse(readFileSync(path.join(H.ROOT, 'assets/inline/manifest.json'), 'utf8'));
const ORIG = process.env.ORIG;
const ORIG_NAME = '__orig_index_check.html';
// 外部化の前の index.html は版（MM_BUILD）を今の値にそろえる（そろえないと version.json を見て読み込み直す＝公開の更新の仕組み）
const CUR_BUILD = (/const MM_BUILD="([^"]+)";/.exec(readFileSync(path.join(H.ROOT, 'index.html'), 'utf8')) || [])[1];
if (ORIG) writeFileSync(path.join(H.ROOT, ORIG_NAME), readFileSync(ORIG, 'utf8').replace(/const MM_BUILD="[^"]+";/, `const MM_BUILD="${CUR_BUILD}";`));
const L = await H.launch();
const res = [];
const ok = (name, cond, info = '') => { res.push([cond ? 'OK' : 'NG', name, info]); console.log(cond ? 'OK' : 'NG', name, info); };
const inlineReq = (pg, list) => pg.on('response', (r) => { if (r.url().includes('/assets/inline/')) list.push([r.status(), r.url().split('/assets/inline/')[1]]); });

async function imgState(pg) {
  return pg.evaluate(() => {
    const im = [...document.querySelectorAll('img')].filter((i) => (i.getAttribute('src') || '').includes('assets/inline/'));
    const bg = [...document.querySelectorAll('*')].map((e) => getComputedStyle(e).backgroundImage).filter((b) => b.includes('assets/inline/'));
    return { n: im.length, bad: im.filter((i) => !(i.complete && i.naturalWidth > 0)).map((i) => i.getAttribute('src')), bg: bg.length };
  });
}
async function waitImgs(pg, ms = 4000) {
  const t0 = Date.now(); let s;
  do { s = await imgState(pg); if (!s.bad.length) break; await pg.waitForTimeout(150); } while (Date.now() - t0 < ms);
  return s;
}
async function shot(pg, name) { await pg.screenshot({ path: path.join(OUT, name + '.png') }); }
const pressStop = async (pg) => { if (await pg.evaluate(() => { const g = document.getElementById('go'); return !!g && !g.disabled && !g.classList.contains('bk'); })) await pg.click('#go').catch(() => {}); };

// 1) 全ファイル
{
  const p = await L.open({ size: H.SIZES.base }); const pg = p.page;
  const r = await pg.evaluate(async (files) => Promise.all(files.map((f) => new Promise((ok) => { const i = new Image(); i.onload = () => ok([f, i.naturalWidth]); i.onerror = () => ok([f, 0]); i.src = f; }))), MAN.map((e) => e.file));
  const bad = r.filter((x) => !x[1]);
  ok('1) manifest の全ファイルが画像として読める', bad.length === 0 && r.length === 175, `${r.length - bad.length}/${r.length} ${bad.map((x) => x[0]).join(',')}`);
  ok('1) 404 なし', p.bad.length === 0, p.bad.join(','));
  await p.ctx.close();
}

// 2) 主要画面
for (const [ui, query] of [['new', ''], ['old', '?battleArt=old']]) {
  const reqs = [];
  const p = await L.open({ size: H.SIZES.base, query, raw: ui === 'old' ? { mmbattleui: 'old' } : {} }); const pg = p.page;
  inlineReq(pg, reqs);
  const tag = ui === 'new' ? '' : '（旧のバトル画面）';
  if (ui === 'new') {
    await pg.waitForTimeout(800); await shot(pg, '01_title');
    let s = await waitImgs(pg); ok('2) 開始画面', !s.bad.length, JSON.stringify(s));
    ok('3) 開始画面では外へ出した絵を読まない', (await pg.evaluate(() => MMINL.count())) === 0 && reqs.length === 0, `MMINL ${await pg.evaluate(() => MMINL.count())}・要求 ${reqs.length}`);
    await H.newGame(pg, 'テスト'); await pg.waitForTimeout(600); await shot(pg, '02_town');
    s = await waitImgs(pg); ok('2) 街', !s.bad.length, JSON.stringify(s));
    await pg.evaluate(() => { S.m = mk(0); S.m.name = 'ソラ'; MMP7.ensureProg(S.m); S.box = [mk(1)]; save(); farm(); }); await pg.waitForTimeout(800); await shot(pg, '03_ranch');
    s = await waitImgs(pg); ok('2) 牧場', !s.bad.length, JSON.stringify(s));
    await pg.evaluate(() => { lobby(); market(); }); await pg.waitForTimeout(1200); await shot(pg, '04_market');
    s = await waitImgs(pg); ok('2) 市場', !s.bad.length, JSON.stringify(s));
    await pg.evaluate(() => museum('book')); await pg.waitForTimeout(800); await shot(pg, '05_lab_book');
    s = await waitImgs(pg); ok('2) 研究所の図鑑', !s.bad.length, JSON.stringify(s));
    await pg.evaluate(() => musd(0)); await pg.waitForTimeout(600); await shot(pg, '06_lab_detail');
    s = await waitImgs(pg); ok('2) 研究所の図鑑の詳細', !s.bad.length, JSON.stringify(s));
    ok('3) 街・牧場・市場・研究所では外へ出した絵を読まない', reqs.length === 0, `要求 ${reqs.length}`);
  } else {
    await H.newGame(pg, 'テスト');
  }
  // 大会 → バトル（ソラモ・ガウル）
  for (const sp of [0, 1]) {
    await pg.evaluate((sp) => { const m = mk(sp); m.name = sp ? 'ガウ' : 'ソラ'; Object.assign(m, { po: 999, in: 999, hi: 999, li: 999 }); MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); if (!MMP8.startTournament(S, S.m, 0, 7).ok) throw new Error('startTournament'); save(); board(); }, sp);
    await pg.waitForSelector('.tb1 .tbgo', { timeout: 20000 }); await pg.waitForTimeout(600);
    if (sp === 0) { await shot(pg, `08_tournament_${ui}`); const s = await waitImgs(pg); ok('2) 大会の対戦表' + tag, !s.bad.length, JSON.stringify(s)); }
    const kitOk = await pg.evaluate(() => new Promise((ok) => { const t0 = Date.now(); const k = () => { const S0 = S, m = S0.m, t = m.raise.tour, pm = MMP8.tourNext(m), ev = MMP8L.entrantView(t.league, pm.opp); const U = MMINL.kit(m, t.rank, ev.sp, true); const r = U.filter((u) => !MMINL.isReady(u)); if (!r.length || Date.now() - t0 > 3000) ok({ n: U.length, notReady: r }); else setTimeout(k, 50); }; k(); }));
    ok(`3) 大会の対戦表でそのバトルの絵を読み終えている sp${sp}` + tag, kitOk.n > 0 && !kitOk.notReady.length, JSON.stringify(kitOk));
    const first = await pg.evaluate(() => new Promise((ok) => { p8TourFight(); requestAnimationFrame(() => { const im = [...document.querySelectorAll('#bt img')].filter((i) => (i.getAttribute('src') || '').includes('assets/inline/')); ok({ n: im.length, bad: im.filter((i) => !(i.complete && i.naturalWidth > 0)).map((i) => i.getAttribute('src')) }); }); }));
    ok(`3) バトル開始の最初のフレームで外へ出した絵がすべて読めている sp${sp}` + tag, first.n > 0 && !first.bad.length, JSON.stringify(first));
    await pg.waitForSelector('#bt', { timeout: 15000 });
    await pg.waitForTimeout(1500); await shot(pg, `09_battle_${ui}_${sp}`);
    let s = await waitImgs(pg); ok(`2) バトル開始 sp${sp}` + tag, !s.bad.length, JSON.stringify(s));
    const seen = new Set(); let worst = [];
    for (let i = 0; i < 160; i++) {
      if (await pg.evaluate(() => { const g = document.getElementById('go'); return !!g && g.classList.contains('bk'); })) break;
      await pressStop(pg); await pg.waitForTimeout(120);
      const st = await imgState(pg);
      // 新しく出た絵が 0.25秒の間に読めていない（＝遅れて出た）ものを数える
      for (const b of st.bad) if (!seen.has(b)) { seen.add(b); worst.push(b); }
    }
    await pg.waitForTimeout(1200); await shot(pg, `10_battle_end_${ui}_${sp}`);
    s = await waitImgs(pg); ok(`2) バトルの決着 sp${sp}` + tag, !s.bad.length, JSON.stringify(s));
    ok(`2) バトル中に出た絵は 0.12秒以内に読めていた sp${sp}` + tag, worst.length === 0, worst.join(','));
    await pg.click('#go').catch(() => {}); await pg.waitForTimeout(800);
  }
  const r404 = reqs.filter((x) => x[0] >= 400);
  ok('2) assets/inline の 404 なし' + tag, r404.length === 0, `要求 ${reqs.length}・${r404.map((x) => x.join(' ')).join(',')}`);
  ok('2) 404・エラーなし' + tag, p.bad.length === 0 && p.errors.length === 0, [...p.bad, ...p.errors].join(' | '));
  await p.ctx.close();
}

// 2') Chapter 1（本編の1枚の世界の盤）
{
  const p = await L.open({ size: H.SIZES.base, worldCh1: true }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); save(); board(); });
  await pg.waitForSelector('#wbw #brollbtn', { timeout: 60000 }); await pg.waitForTimeout(2500); await shot(pg, '07_chapter1');
  const s = await waitImgs(pg); ok('2) Chapter 1（1枚の世界の盤）', !s.bad.length, JSON.stringify(s));
  const b = await pg.evaluate(() => MMINL.loaded());
  ok('3) Chapter の盤ではバトル開始の瞬間の絵だけを読む', b.length > 0 && b.length <= 20 && !b.some((u) => /skill_frames|skill_fx|_win_|_lose_/.test(u)), `${b.length} 件 ${b.join(',')}`);
  ok('2) Chapter 1 の 404・エラーなし', p.bad.length === 0 && p.errors.length === 0, [...p.bad, ...p.errors].join(' | '));
  await p.ctx.close();
}

// 4) 外部化の前と画素で比べる
if (ORIG) {
  const cap = async (file) => {
    const p = await L.open({ size: H.SIZES.base }); const pg = p.page;
    if (file) { await pg.goto(L.url + file); await pg.waitForFunction(() => typeof window.MMP8 === 'object' && typeof S === 'object'); }
    await pg.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' });
    const out = {};
    await pg.waitForTimeout(1200); out.title = await pg.screenshot();
    await H.newGame(pg, 'テスト'); await pg.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' }); await pg.waitForTimeout(1200); out.town = await pg.screenshot();
    await pg.evaluate(() => { S.m = mk(0); S.m.name = 'ソラ'; MMP7.ensureProg(S.m); save(); museum('book'); }); await pg.waitForTimeout(1500); out.lab = await pg.screenshot();
    await pg.evaluate(() => { const m = S.m; Object.assign(m, { po: 999 }); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); MMP8.startTournament(S, S.m, 0, 7); save(); board(); });
    await pg.waitForSelector('.tb1 .tbgo'); await pg.waitForTimeout(2500); out.tour = await pg.screenshot();
    await p.ctx.close(); return out;
  };
  const a = await cap(null), b = await cap(ORIG_NAME);
  for (const k of Object.keys(a)) {
    const same = Buffer.compare(a[k], b[k]) === 0;
    writeFileSync(path.join(OUT, `cmp_${k}_new.png`), a[k]); writeFileSync(path.join(OUT, `cmp_${k}_orig.png`), b[k]);
    ok(`4) 外部化の前と同じ画素（${k}）`, same, same ? '' : 'スクリーンショットが違う（cmp_*.png を見る）');
  }
  rmSync(path.join(H.ROOT, ORIG_NAME), { force: true });
}
// 5) 回線を遅くした状態（iPhone のモバイル回線の想定）
{
  const slow = async (pg) => { const c = await pg.context().newCDPSession(pg); await c.send('Network.enable'); await c.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6e6 / 8, uploadThroughput: 0.75e6 / 8 }); await c.send('Emulation.setCPUThrottlingRate', { rate: 4 }); return c; };
  const timing = async (file) => {
    const p = await L.open({ size: H.SIZES.base }); const pg = p.page; await slow(pg);
    await pg.goto(L.url + (file || 'index.html'), { waitUntil: 'load', timeout: 300000 });
    await pg.waitForFunction(() => typeof window.MMP8 === 'object' && typeof S === 'object', null, { timeout: 300000 });
    const t = await pg.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return { html: Math.round(n.responseEnd), dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), bytes: n.encodedBodySize }; });
    await p.ctx.close(); return t;
  };
  const tNew = await timing(null);
  ok('5) 遅い回線：今の index.html の読み込み', true, JSON.stringify(tNew));
  if (ORIG) { const tOld = await timing(ORIG_NAME); ok('5) 遅い回線：外部化の前の index.html の読み込み', true, JSON.stringify(tOld)); ok('5) 遅い回線：開始までの時間が短くなった（DOMContentLoaded）', tNew.dcl < tOld.dcl, `${tOld.dcl}ms → ${tNew.dcl}ms`); }
  // 対戦表を3秒見てからバトル（遅い回線のまま）
  const p = await L.open({ size: H.SIZES.base }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await slow(pg);
  await pg.evaluate(() => { const m = mk(1); m.name = 'ガウ'; Object.assign(m, { po: 999, in: 999, hi: 999, li: 999 }); MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); MMP8.startTournament(S, S.m, 0, 7); save(); board(); });
  await pg.waitForSelector('.tb1 .tbgo', { timeout: 60000 }); await pg.waitForTimeout(3000);
  const first = await pg.evaluate(() => new Promise((ok) => { p8TourFight(); requestAnimationFrame(() => { const im = [...document.querySelectorAll('#bt img')].filter((i) => (i.getAttribute('src') || '').includes('assets/inline/')); ok({ n: im.length, bad: im.filter((i) => !(i.complete && i.naturalWidth > 0)).map((i) => i.getAttribute('src')) }); }); }));
  ok('5) 遅い回線：対戦表を3秒見てからのバトル開始の最初のフレームで絵がすべて読めている', first.n > 0 && !first.bad.length, JSON.stringify(first));
  await p.ctx.close();
}
// 6) オフライン：大会の対戦表で先読みしたあと回線を切ってバトル（Service Worker は無い＝ゲーム全体はオフラインでは動かない。先読みした絵だけは手元にある）
{
  const p = await L.open({ size: H.SIZES.base }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(1); m.name = 'ガウ'; Object.assign(m, { po: 999, in: 999, hi: 999, li: 999 }); MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); MMP8.startTournament(S, S.m, 0, 7); save(); board(); });
  await pg.waitForSelector('.tb1 .tbgo'); await pg.waitForTimeout(2000);
  await p.ctx.setOffline(true);
  const first = await pg.evaluate(() => new Promise((ok) => { p8TourFight(); requestAnimationFrame(() => { const im = [...document.querySelectorAll('#bt img')].filter((i) => /assets\/inline\/|^data:image/.test(i.getAttribute('src') || '')); ok({ n: im.length, bad: im.filter((i) => !(i.complete && i.naturalWidth > 0)).length }); }); }));
  ok('6) 回線を切った状態でもバトル開始の最初のフレームで絵が出る（先読み済み）', first.n > 0 && first.bad === 0, JSON.stringify(first));
  for (let i = 0; i < 160; i++) { if (await pg.evaluate(() => { const g = document.getElementById('go'); return !!g && g.classList.contains('bk'); })) break; await pressStop(pg); await pg.waitForTimeout(150); }
  await pg.waitForTimeout(1500); await shot(pg, '11_offline_battle_end');
  const bad = await pg.evaluate(() => [...document.querySelectorAll('#bt img')].filter((i) => /assets\/inline\/|^data:image/.test(i.getAttribute('src') || '') && !(i.complete && i.naturalWidth > 0)).length);
  ok('6) 回線を切った状態でも決着まで外へ出した絵が出る', bad === 0, `読めていない ${bad}`);
  await p.ctx.close();
}
await L.close();
const ng = res.filter((r) => r[0] === 'NG');
console.log(`\n${res.length - ng.length}/${res.length} OK`);
process.exit(ng.length ? 1 : 0);
