// =========================================================
// 実ブラウザ：Chapter 1 の画像演出（2026-10-11。js/chapter/world-board.js）
//  FXB-1（390×844・375×667）：ライバル＝EV01 の幕 → リュウとレグナス → EV06 の X（各1回）→ バトルの案内（やめておくは無い）
//  FXB-2：野生（影・？？？・Lv なし）／レア（名前・★レア）→ バトルの案内に「やめておく」・150G 以上だけ金貨の演出（50G では出ない）
//  FXB-3：残り10・5・1ターンの砂時計＝各1回・記録は field.tw（再読み込みで出ない）・ゴールのあとは出ない
//  FXB-4：レアのマスがある育成だけ紋章（全景でも見える大きさ）・訪れたら弱く・無い育成では出ない・?tileTop=1011 のときだけ上面の試作
//  QA_E2E=1 のときだけ実行
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
let L = null;
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });
const OPEN = [];
const openPage = async (o = {}) => { const p = await L.open({ worldCh1: true, ...o }); OPEN.push(p); return p; };
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close().catch(() => {}); });
const idle = (pg) => pg.waitForFunction(() => !bBusy && !MMCHD.isLocked() && !document.querySelector('.wb-pop,.chf-enc2,.mmtalk,.chdz,.wbx-gold'), null, { timeout: 30000 }).then(() => pg.waitForTimeout(300));
async function toBoard(pg, rare) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate((rare) => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const f = S.m.raise.field; for (const k of Object.keys(f.tiles)) if (f.tiles[k].rare) delete f.tiles[k]; if (rare) f.tiles[rare] = { t: 'wild', rare: true }; save(); board(); }, rare);
  await pg.waitForSelector('#wbw #brollbtn'); await idle(pg);
}
const place = (pg, node, tile, extra = {}) => pg.evaluate(([node, tile, extra]) => { const r = S.m.raise, f = r.field, c = f.core; r.node = node; c.node = node; c.trail.push(node); c.moveLeft = 0; c.back = null; c.exclude = null; if (tile) { f.tiles[node] = tile; delete f.used[node]; } r.pend = tile || extra.resolve ? { stage: 'resolve' } : null; save(); board(); }, [node, tile, extra]);

for (const size of [H.SIZES.base, H.SIZES.se]) {
  test(`FXB-1（${size.join('×')}）：ライバル＝EV01 → リュウとレグナス → X の衝突（1回）→ バトルの案内`, { skip: SKIP, timeout: 120000 }, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await pg.evaluate(() => { window.__fx = []; new MutationObserver(() => { const r = document.querySelector('.wbx-r'); if (r) { const c = r.className; if (__fx[__fx.length - 1] !== c) __fx.push(c); } }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] }); });
    await toBoard(pg);
    await place(pg, 'RIVAL', null, { resolve: true });
    await pg.waitForSelector('.wbx-r .wbx-rbg');
    const a = await pg.evaluate(() => { const r = document.querySelector('.wbx-r'); return { bg: r.querySelector('.wbx-rbg').getAttribute('src'), ryu: r.querySelector('.wbx-ryu').getAttribute('src'), part: r.querySelector('.wbx-partner').getAttribute('src'), clash: r.querySelector('.wbx-clash').getAttribute('src'), tx: r.querySelector('.wbx-card').textContent }; });
    assert.match(a.bg, /fx_1011\/ev01_rival_title\.webp/); assert.match(a.ryu, /npc\/ryu\/ryu_official_fullbody\.webp/); assert.match(a.part, /2p5d\/regnas\.webp/); assert.match(a.clash, /ev06_rival_clash/);
    assert.match(a.tx, /リュウが立ちはだかった/);
    await pg.waitForSelector('.wbx-r.p3'); await idle(pg);
    const cls = await pg.evaluate(() => __fx.join('|'));
    assert.equal((cls.match(/p3/g) || []).length >= 1 && !/p3[^|]*\|.*wbx-r(?![^|]*p3)/.test(cls), true, `幕 → リュウ → X の順（${cls}）`);
    assert.equal(await pg.evaluate(() => document.querySelectorAll('.wbx-r').length), 0, '終わったら消える');
    const g = await pg.evaluate(() => ({ go: !!document.querySelector('.chbat [onclick="bBattleGo()"]'), skip: !!document.querySelector('.chbat [onclick="bBattleSkip()"]') }));
    assert.deepEqual(g, { go: true, skip: false }, 'ライバルは強制');
    assert.equal(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  });
}

test('FXB-2：野生（影・？？？）／レア（名前・★レア）→ やめておくが残る・150G 以上だけ金貨の演出', { skip: SKIP, timeout: 150000 }, async () => {
  const p = await openPage(); const pg = p.page;
  await toBoard(pg);
  await place(pg, 'ER02_03', { t: 'wild', rare: false });
  await pg.waitForSelector('.wbx-w');
  const w = await pg.evaluate(() => { const e = document.querySelector('.wbx-w'); return { sil: e.classList.contains('sil'), nm: e.querySelector('.wbx-nm').textContent, all: e.textContent, sheet: getComputedStyle(document.querySelector('.chsheet') || document.body).visibility }; });
  assert.equal(w.sil, true); assert.match(w.nm, /？？？/); assert.doesNotMatch(w.all, /Lv|レベル/); assert.equal(w.sheet, 'hidden', '演出の間は案内を隠す');
  await idle(pg);
  assert.equal(await pg.evaluate(() => !!document.querySelector('.chbat [onclick="bBattleSkip()"]')), true, '野生は「やめておく」が残る');
  await pg.evaluate(() => bBattleSkip()); await idle(pg);
  await place(pg, 'ER03_02', { t: 'wild', rare: true });
  await pg.waitForSelector('.wbx-w.rare');
  const r = await pg.evaluate(() => { const e = document.querySelector('.wbx-w'); return { nm: e.querySelector('.wbx-nm b').textContent, badge: !!e.querySelector('.wbx-nm em'), img: e.querySelector('.wbx-mon').getAttribute('src'), all: e.textContent }; });
  assert.notEqual(r.nm, '？？？'); assert.equal(r.badge, true); assert.match(r.img, /2p5d\//); assert.doesNotMatch(r.all, /Lv|レベル/);
  await idle(pg); await pg.evaluate(() => bBattleSkip()); await idle(pg);
  // G：50G では出ない・150G で1回
  await pg.evaluate(() => { window.__gb = 0; new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.classList && n.classList.contains('wbx-gold')) __gb++; }).observe(document.getElementById('wbw'), { subtree: true, childList: true }); });
  const g0 = await pg.evaluate(() => S.g);
  await place(pg, 'ER02_04', { t: 'treasure', gold: 50, tier: 'normal' }); await idle(pg);
  assert.equal(await pg.evaluate(() => __gb), 0, '50G は従来の小さな表示だけ');
  await place(pg, 'ER02_05', { t: 'treasure', gold: 150, tier: 'rare' }); await pg.waitForSelector('.wbx-gold');
  assert.match(await pg.evaluate(() => document.querySelector('.wbx-gold b').textContent), /\+150G/);
  await idle(pg);
  assert.deepEqual(await pg.evaluate(() => [__gb, S.g]), [1, g0 + 200], '金貨の演出は1回・所持金の加算は従来どおり1回ずつ');
});

test('FXB-3：残り10・5・1ターンの砂時計＝各1回・再読み込みで出ない・ゴールのあとは出ない', { skip: SKIP, timeout: 150000 }, async () => {
  const p = await openPage(); const pg = p.page;
  await toBoard(pg);
  await pg.evaluate(() => { window.__hg = []; new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.classList && n.classList.contains('wbx-hg')) __hg.push(n.getAttribute('aria-label')); }).observe(document.getElementById('wbw'), { subtree: true, childList: true }); });
  for (const left of [11, 10, 10, 5, 1]) {
    await pg.evaluate((l) => { S.m.raise.turnsUsed = 40 - l; S.m.raise.field.core.turn = 40 - l; save(); board(); }, left);
    await pg.waitForTimeout(1400);
  }
  await pg.waitForFunction(() => !document.querySelector('.wbx-hg'), null, { timeout: 8000 });
  assert.deepEqual(await pg.evaluate(() => __hg), ['残り10ターン', '残り5ターン', '残り1ターン']);
  assert.deepEqual(await pg.evaluate(() => JSON.parse(localStorage.getItem('mr4v6')).m.raise.field.tw), { 1: 1, 5: 1, 10: 1 }, 'セーブに記録');
  const r = await pg.evaluate(() => { const b = document.querySelector('.wbx-hg'); return b; });
  assert.equal(r, null);
  await pg.reload(); await pg.waitForFunction(() => typeof window.MMP8 === 'object' && typeof S === 'object'); await pg.waitForSelector('.p15start'); await pg.click('.p15start');
  await pg.waitForSelector('#wbw #brollbtn'); await pg.waitForTimeout(1500);
  assert.equal(await pg.evaluate(() => !!document.querySelector('.wbx-hg')), false, '再読み込みでは出ない');
});

test('FXB-4：レアの紋章（ある育成だけ・全景でも見える・訪れたら弱く）・?tileTop=1011 のときだけ上面の試作', { skip: SKIP, timeout: 150000 }, async () => {
  const p = await openPage({ intro: true }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const f = S.m.raise.field; for (const k of Object.keys(f.tiles)) if (f.tiles[k].rare) delete f.tiles[k]; f.tiles.ER03_02 = { t: 'wild', rare: true }; save(); board(); });
  await pg.waitForFunction(() => MMWB.state().intro, null, { timeout: 20000 }); await pg.waitForTimeout(300);   // 2026-10-12 開発21：絵がそろうまで中継カット → 全景
  const o = await pg.evaluate(() => { const e = document.querySelector('.rfw-mark'); const r = e && e.getBoundingClientRect(); return e ? { node: e.dataset.node, w: r.width, vis: getComputedStyle(e).display !== 'none', intro: MMWB.state().intro } : null; });
  assert.ok(o && o.intro && o.node === 'ER03_02' && o.vis && o.w >= 40, `全景で紋章が見える（${JSON.stringify(o)}）`);
  await pg.waitForFunction(() => !MMWB.state().intro, null, { timeout: 20000 }); await idle(pg);
  await place(pg, 'ER03_02', { t: 'wild', rare: true }); await idle(pg);
  await pg.evaluate(() => bBattleSkip()); await idle(pg);
  assert.equal(await pg.evaluate(() => document.querySelector('.rfw-mark').classList.contains('dim')), true, '訪れたら弱く');
  // レアの無い育成：紋章なし
  await pg.evaluate(() => { const f = S.m.raise.field; delete f.tiles.ER03_02; save(); MMWB.release(); board(); }); await idle(pg);
  assert.equal(await pg.evaluate(() => document.querySelectorAll('.rfw-mark').length), 0, 'レアが無い育成では出ない');
  // 上面の試作：既定は tiles_v2・フラグのときだけ tiles_top_1011
  await pg.evaluate(() => { const f = S.m.raise.field, id = MMRF_DATA.segments.S01[3][1]; f.tiles[id] = { t: 'stat', k: 'li' }; save(); MMWB.release(); board(); }); await idle(pg);
  const src0 = await pg.evaluate(() => document.querySelector(`.rfw-tile[data-node="${MMRF_DATA.segments.S01[3][1]}"] img`).getAttribute('src'));
  await pg.evaluate(() => { window.MM_TILETOP_1011 = true; MMWB.release(); board(); }); await idle(pg);
  const src1 = await pg.evaluate(() => document.querySelector(`.rfw-tile[data-node="${MMRF_DATA.segments.S01[3][1]}"] img`).getAttribute('src'));
  assert.match(src0, /tiles_v2\/tile_stat_life\.webp/); assert.match(src1, /tiles_top_1011\/tile_stat_life\.webp/);
});
