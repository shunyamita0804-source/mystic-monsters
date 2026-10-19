// 外部化した画像（assets/inline/）の実ブラウザ確認（テストではない道具。Playwright＋Chromium が要る）
//   node tools/inline-images/screen-check.mjs <スクリーンショットの出力先>
//  1) manifest の175ファイルをすべてページから読み、404 が無い・画像として読める（naturalWidth>0）
//  2) 主要画面（開始・街・牧場・市場・研究所・Chapter 1・大会・バトル＝新／旧の画面）で、表示中の assets/inline の <img> がすべて読めている・404 が無い
//  3) 起動後の先読み（MM_INLINE）が終わり、すべて読めている
//  4) 動かない画面（開始・街・研究所の図鑑・大会の対戦表）を外部化の前の index.html（git の HEAD~ の版を一時ファイルに）と画素で比べる（任意：環境変数 ORIG に元の index.html のパス）
import { writeFileSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import * as H from '../../tests/e2e/harness.mjs';

const OUT = process.argv[2] || '/tmp/inline-check';
mkdirSync(OUT, { recursive: true });
const MAN = JSON.parse(readFileSync(path.join(H.ROOT, 'assets/inline/manifest.json'), 'utf8'));
const ORIG = process.env.ORIG;
const ORIG_NAME = '__orig_index_check.html';
if (ORIG) writeFileSync(path.join(H.ROOT, ORIG_NAME), readFileSync(ORIG));
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
  const p = await L.open({ size: H.SIZES.base, worldCh1: true, query, raw: ui === 'old' ? { mmbattleui: 'old' } : {} }); const pg = p.page;
  inlineReq(pg, reqs);
  const tag = ui === 'new' ? '' : '（旧のバトル画面）';
  if (ui === 'new') {
    await pg.waitForTimeout(800); await shot(pg, '01_title');
    let s = await waitImgs(pg); ok('2) 開始画面', !s.bad.length, JSON.stringify(s));
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
    await pg.evaluate(() => { lobby(); hall(); }); await pg.waitForTimeout(600);
    await H.startRaising(pg).catch(() => {}); await pg.waitForTimeout(3500); await shot(pg, '07_chapter1');
    s = await waitImgs(pg); ok('2) Chapter 1（1枚の世界の盤）', !s.bad.length, JSON.stringify(s));
  } else {
    await H.newGame(pg, 'テスト');
  }
  // 大会 → バトル（ソラモ・ガウル）
  for (const sp of [0, 1]) {
    await pg.evaluate((sp) => { const m = mk(sp); m.name = sp ? 'ガウ' : 'ソラ'; Object.assign(m, { po: 999, in: 999, hi: 999, li: 999 }); MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); MMP8.startTournament(S, S.m, 0, 7); save(); board(); }, sp);
    await pg.waitForSelector('.tb1 .tbgo', { timeout: 20000 }); await pg.waitForTimeout(600);
    if (sp === 0) { await shot(pg, `08_tournament_${ui}`); const s = await waitImgs(pg); ok('2) 大会の対戦表' + tag, !s.bad.length, JSON.stringify(s)); }
    await pg.evaluate(() => p8TourFight());
    await pg.waitForSelector('#bt', { timeout: 15000 });
    await pg.waitForTimeout(1500); await shot(pg, `09_battle_${ui}_${sp}`);
    let s = await waitImgs(pg); ok(`2) バトル開始 sp${sp}` + tag, !s.bad.length, JSON.stringify(s));
    const seen = new Set(); let worst = [];
    for (let i = 0; i < 160; i++) {
      if (await pg.evaluate(() => { const g = document.getElementById('go'); return !!g && g.classList.contains('bk'); })) break;
      await pressStop(pg); await pg.waitForTimeout(250);
      const st = await imgState(pg);
      // 新しく出た絵が 0.25秒の間に読めていない（＝遅れて出た）ものを数える
      for (const b of st.bad) if (!seen.has(b)) { seen.add(b); worst.push(b); }
    }
    await pg.waitForTimeout(1200); await shot(pg, `10_battle_end_${ui}_${sp}`);
    s = await waitImgs(pg); ok(`2) バトルの決着 sp${sp}` + tag, !s.bad.length, JSON.stringify(s));
    ok(`2) バトル中に出た絵は 0.25秒以内に読めていた sp${sp}` + tag, worst.length === 0, worst.join(','));
    await pg.click('#go').catch(() => {}); await pg.waitForTimeout(800);
  }
  const warm = await pg.evaluate(() => ({ n: MM_INLINE.length, done: MM_INLINE.filter((i) => i.complete && i.naturalWidth > 0).length }));
  ok('3) 起動後の先読み' + tag, warm.n > 0 && warm.n === warm.done, JSON.stringify(warm));
  const r404 = reqs.filter((x) => x[0] >= 400);
  ok('2) assets/inline の 404 なし' + tag, r404.length === 0, `要求 ${reqs.length}・${r404.map((x) => x.join(' ')).join(',')}`);
  ok('2) 404・エラーなし' + tag, p.bad.length === 0 && p.errors.length === 0, [...p.bad, ...p.errors].join(' | '));
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
    await pg.evaluate(() => { const m = S.m; Object.assign(m, { po: 999 }); MMP8.depart(S, m, () => 0.37); MMP8.startTournament(S, S.m, 0, 7); save(); board(); });
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
await L.close();
const ng = res.filter((r) => r[0] === 'NG');
console.log(`\n${res.length - ng.length}/${res.length} OK`);
process.exit(ng.length ? 1 : 0);
