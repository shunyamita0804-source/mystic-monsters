// =========================================================
// 2026-10-17 QA トップ・初見プレイの隔離・新歩行（実ブラウザ・QA_E2E=1 のときだけ）
//  QT-B1 ?qaTop=1＝版・7体×10技＝70枠の状態・Chapter 1／2 の A／B／C の入口（カメラ・道路・歩行・seed・子を選ぶと URL に入る）
//  QT-B2 ?ch1trial=B&qaWalk=1017&qaMon=1&qaSeed=42＝ガウルで Chapter 1 の B・新歩行（8方向・20コマだけ読む）・同じ seed なら同じ配置・セーブを書き換えない
//  QT-B3 新しい Chapter 2 の盤は通常の出発でも QA でも同じ（2026-10-18 v2）
//  QT-B4 ?qaFresh=1＝本当のセーブ（mr4v6）を読まない・書かない／別の名前で保存され再読み込みで続きから／?qaFresh=reset で最初から
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
let L = null;
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });
const OPEN = [];
const openPage = async (o) => { const p = await L.open(o); OPEN.push(p); return p; };
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close().catch(() => {}); });
const shot = (pg, n) => (process.env.MM_SHOT ? pg.screenshot({ path: `${process.env.MM_SHOT}/${n}.png` }) : null);

for (const size of [H.SIZES.base, H.SIZES.se]) {
  test(`QT-B1（${size.join('×')}）：QA トップ＝版・70枠・Chapter の入口`, { skip: SKIP, timeout: 120000 }, async () => {
    const p = await openPage({ query: '?qaTop=1', size }); const pg = p.page;
    await pg.waitForSelector('#mmqat .qtm');
    await pg.waitForFunction(() => /ブランチ/.test(document.querySelector('#mmqat .qtv').textContent));
    const r = await pg.evaluate(() => ({ build: document.querySelector('#mmqat .qtv b').textContent, mb: MM_BUILD, rows: document.querySelectorAll('#mmqat .qtm tr').length, cells: document.querySelectorAll('#mmqat .qtm td').length,
      b: document.querySelectorAll('#mmqat .qtm td.battle').length, pv: document.querySelectorAll('#mmqat .qtm td.preview').length, links: [...document.querySelectorAll('#mmqat a.qtb[data-k]')].map((a) => a.getAttribute('href')), wide: document.documentElement.scrollWidth <= innerWidth }));
    assert.equal(r.build, r.mb); assert.equal(r.rows, 9); assert.equal(r.cells, 90); assert.ok(r.b >= 79, `実戦 ${r.b}`); assert.equal(r.b + r.pv + (90 - r.b - r.pv), 90);   // 2026-10-18 カルシェル（8体目）・2026-10-19 ミュロル（9体目）
    assert.equal(r.links.length, 9); assert.ok(r.links[0].includes('ch1trial=A') && r.links[5].includes('ch2trial=C') && r.links[8].includes('ch3trial=C'));   // 2026-10-18：Chapter 3 の A／B／C を追加 assert.ok(r.wide);
    await pg.click('#mmqat .qts[data-k="cam"] button[data-v="old"]'); await pg.click('#mmqat .qts[data-k="walk"] button[data-v="old"]'); await pg.click('#mmqat .qts[data-k="mon"] button[data-v="3"]');   // 2026-10-18 REV3：C案・新歩行が正式の既定＝比較は「従来」
    await pg.fill('#mmqat .qtseed', '42'); await pg.press('#mmqat .qtseed', 'Tab');
    const h = await pg.getAttribute('#mmqat a.qtb[data-k="ch1"][data-r="B"]', 'href');
    for (const k of ['ch1trial=B', 'qaCam=old', 'qaWalk=old', 'qaMon=3', 'qaSeed=42']) assert.ok(h.includes(k), `${k} ${h}`);
    await shot(pg, `qt_top_${size.join('x')}`);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('QT-B2：新歩行 7体（?qaWalk=1017）＝ガウルで Chapter 1 の B・8方向・同じ seed＝同じ配置・セーブを書き換えない', { skip: SKIP, timeout: 180000 }, async () => {
  const tiles = [];
  for (let k = 0; k < 2; k++) {
    const p = await openPage({ worldCh1: true, query: '?qaWalk=1017&qaMon=1&qaSeed=42' }); const pg = p.page;
    await H.newGame(pg, 'テスト'); const s0 = await pg.evaluate(() => localStorage.getItem('mr4v6'));
    await pg.evaluate(() => MMQAB.startCh1('B'));
    await pg.waitForFunction(() => window.MMWB && MMWB.world() && MMWB.world().isReady && MMWB.world().isReady() && document.querySelector('.rfw-mon[data-qawalk="1017"]'), null, { timeout: 60000 });
    const r = await pg.evaluate(() => ({ sp: S.m.sp, route: S.m.raise.field.route, tiles: JSON.stringify(S.m.raise.field.tiles), imgs: [...document.querySelectorAll('.rfw-mon img.wk')].map((i) => i.getAttribute('src')) }));
    assert.equal(r.sp, 1); assert.equal(r.route, 'B'); assert.equal(r.imgs.length, 20, '盤に出ている種族の20コマだけ');
    assert.ok(r.imgs.every((s) => s.includes('walk_1017/gauru/')), r.imgs[0]);   // ?qaWalk=1017＝前の素材の比較
    tiles.push(r.tiles);
    if (k === 0) { await pg.waitForTimeout(1500); await shot(pg, 'qt_walk1017'); }
    assert.equal(await pg.evaluate(() => localStorage.getItem('mr4v6')), s0, '試遊は保存しない');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
    await p.ctx.close(); OPEN.splice(OPEN.indexOf(p), 1);
  }
  assert.equal(tiles[0], tiles[1], '同じ seed＝同じ配置');
});

test('QT-B3（2026-10-18 v2）：通常の出発も QA も新しい Chapter 2 の盤（QA と通常本編は同一の正式ボード）', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({ worldCh2: true }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  const r = await pg.evaluate(() => {
    const go = (qa) => { window.MM_CH2_NEW = qa; const m = mk(0); m.name = 'テスト'; MMP7.ensureProg(m); S.m = m; MMP8.depart(S, m, () => 0.37); m.raise.field = null; Object.assign(m.raise, { state: 'farm', ch: 2, log: [{ ch: 1, reachedGoal: true, turnsUsed: 30 }], pend: null }); const d = MMP8.depart(S, m, () => 0.37); return { ok: d.ok, key: d.key, world: m.raise.field && m.raise.field.world, chapterId: m.raise.field && m.raise.field.chapterId }; };
    return { normal: go(false), qa: go(true) };
  });
  assert.equal(r.normal.key, 2); assert.equal(r.normal.world, 1, '通常＝新しい盤 ' + JSON.stringify(r));
  assert.equal(r.qa.world, 1, 'QA＝新しい盤');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('QT-B4：初見プレイ（?qaFresh=1）＝本当のセーブを触らない・続きから・reset', { skip: SKIP, timeout: 180000 }, async () => {
  const p = await openPage({}); const pg = p.page;
  await H.newGame(pg, 'ほんもの'); await pg.evaluate(() => { S.g = 777; save(); });
  const real = await pg.evaluate(() => localStorage.getItem('mr4v6'));
  assert.match(real, /ほんもの/);
  const fresh = new URL(pg.url()); fresh.search = '?qaFresh=1';
  await pg.goto(fresh.href); await pg.waitForFunction(() => window.MMQAF && MMQAF.on);
  const t = await pg.evaluate(() => ({ name: S.playerName || '', g: S.g, pend: !!S.playerNamePending }));
  assert.notEqual(t.name, 'ほんもの', '本当のセーブを読まない'); assert.notEqual(t.g, 777);
  await H.newGame(pg, 'しょけん'); await pg.evaluate(() => { S.g = 123; save(); });
  const k = await pg.evaluate(() => ({ real: localStorage['mr4v6'], keys: Object.keys(localStorage).filter((x) => /qaF:/.test(x)) }));
  assert.equal(k.real, real, '本当のセーブは書き換わらない'); assert.ok(k.keys.includes('qaF:mr4v6'), JSON.stringify(k.keys));
  await pg.reload(); await pg.waitForFunction(() => window.MMQAF && MMQAF.on);
  assert.deepEqual(await pg.evaluate(() => [S.playerName, S.g]), ['しょけん', 123], '再読み込みで続きから');
  const rs = new URL(pg.url()); rs.search = '?qaFresh=reset'; await pg.goto(rs.href); await pg.waitForFunction(() => window.MMQAF && MMQAF.on);
  assert.notEqual(await pg.evaluate(() => S.playerName || ''), 'しょけん', 'reset で最初から');
  const plain = new URL(pg.url()); plain.search = ''; await pg.goto(plain.href); await pg.waitForFunction(() => typeof S === 'object');
  assert.deepEqual(await pg.evaluate(() => [S.playerName, S.g]), ['ほんもの', 777], '通常の URL は本当のセーブ');
  assert.deepEqual(p.errors, []);
});
