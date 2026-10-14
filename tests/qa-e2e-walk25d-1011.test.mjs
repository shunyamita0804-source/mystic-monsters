// =========================================================
// 実ブラウザ：2.5D の歩行コマ（ガウルの front・back 各8コマ）と対戦表の横顔アイコン（5体）（2026-10-11）
//  WK-B1（390×844・375×667）：本編 Chapter 1 の盤（worldCh1:true）でガウル＝16コマを重ねて置き全部読める・止まると正面（front の1コマ目）・
//        足の位置と体の高さが静止の立ち絵とそろう・奥へ進む1歩は back・行き止まりから戻る1歩も back（2026-10-14 開発29：後ろから追うカメラ。旧は front）（左右反転なし＝ムーンウォークしない）・画面の外へ出ない
//  WK-B2：2026-10-14 ソラモ・ノビトン・ジオルの 2.5D 歩行（16コマ・止まると正面・足と体の高さ・奥へ back）
//  FC-B1（390×844・375×667）：対戦表（6体 E・8体 C）の顔＝faces_25d の横顔（読める・円の中）・読み込めないときは従来の丸い顔（faces）
//  QA_E2E=1 のときだけ実行
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
let L = null;
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });
const OPEN = [];
const openPage = async (o = {}) => { const p = await L.open(o); OPEN.push(p); return p; };
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close().catch(() => {}); });
const SHOT = path.join(os.tmpdir(), 'mm-walk25d-1011');
const idle = (pg) => pg.waitForFunction(() => !bBusy && !MMCHD.isLocked() && !document.querySelector('.wb-pop,.chf-enc2,.mmtalk,.chdz'), null, { timeout: 30000 }).then(() => pg.waitForTimeout(300));
async function toBoard(pg, sp) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate((sp) => { const m = mk(0); m.sp = sp; m.name = 'テスト'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); save(); board(); }, sp);
  await pg.waitForSelector('#wbw #brollbtn'); await idle(pg);
}
/** 見えている歩行のコマ（体の下端・高さ）と静止の立ち絵の箱 */
const measure = (pg) => pg.evaluate(() => {
  const el = document.querySelector('.rfw-mon'), st = el.querySelector('img.st').getBoundingClientRect(), on = el.querySelector('img.wk.on');
  if (!on) return { st: { b: st.bottom, h: st.height }, on: null, cls: el.className };
  const r = on.getBoundingClientRect(), foot = parseFloat(on.style.getPropertyValue('--wkf')) || 0;
  return { st: { b: st.bottom, h: st.height, l: st.left, r: st.right }, on: { b: r.bottom - foot * r.height, body: r.height * (463 / 512), set: on.dataset.s, i: +on.dataset.i, src: on.getAttribute('src'), l: r.left, r: r.right, t: r.top }, cls: el.className, W: innerWidth, H: innerHeight };
});

for (const size of [H.SIZES.base, H.SIZES.se]) {
  test(`WK-B1（${size.join('×')}）：ガウルの 2.5D 歩行（front・back 各8コマ）＝止まると正面・足と体の高さ・奥へ back／行き止まりから戻る間も back（後ろから追うカメラ）`, { skip: SKIP, timeout: 150000 }, async () => {
    const p = await openPage({ size, worldCh1: true }); const pg = p.page; mkdirSync(SHOT, { recursive: true });
    await toBoard(pg, 1);
    await pg.waitForFunction(() => [...document.querySelectorAll('.rfw-mon img.wk')].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 30000 });
    const imgs = await pg.evaluate(() => [...document.querySelectorAll('.rfw-mon img.wk')].map((i) => [i.dataset.s, i.getAttribute('src')]));
    assert.equal(imgs.length, 16);
    assert.deepEqual([...new Set(imgs.map((x) => x[0]))].sort(), ['back', 'front']);
    assert.ok(imgs.every(([, s]) => /assets\/monsters\/walk_25d\/gauru\/gauru_walk_(front|back)_0[1-8]\.webp$/.test(s)), '新しいパスの派生');
    // 止まっている姿＝front の1コマ目（足と体の高さが静止の立ち絵とそろう）
    await pg.evaluate(() => board()); await idle(pg);
    let m = await measure(pg);
    assert.ok(m.on && m.on.set === 'front' && m.on.i === 0 && /wk-idle/.test(m.cls), `止まると正面 ${JSON.stringify(m)}`);
    assert.ok(Math.abs(m.on.b - m.st.b) <= 3, `足の位置 ${m.on.b} / ${m.st.b}`);
    assert.ok(Math.abs(m.on.body / m.st.h - 1) <= 0.04, `体の高さ ${m.on.body} / ${m.st.h}`);
    assert.ok(Math.abs((m.on.l + m.on.r) / 2 - (m.st.l + m.st.r) / 2) <= 3, `横の位置（立ち絵の中心にそろう・旧 index.html の .wk のアニメーションで左右に流れない） ${(m.on.l + m.on.r) / 2} / ${(m.st.l + m.st.r) / 2}`);
    await pg.waitForTimeout(1500);
    const m2 = await measure(pg);
    assert.ok(Math.abs(m2.on.l - m.on.l) <= 1, `止まっている間に横へ動かない ${m.on.l} → ${m2.on.l}`);
    await pg.screenshot({ path: path.join(SHOT, `${size[0]}_idle.png`) });
    // 奥へ進む1歩（START からの道は奥＝画面の上へ）：back のコマ・左右反転なし。歩く間のコマを全部記録
    await pg.evaluate(() => { window.__seen = []; const el = document.querySelector('.rfw-mon'); new MutationObserver(() => { const on = el.querySelector('img.wk.on'); __seen.push([el.dataset.dir || '', on ? on.dataset.s : '', on ? +on.dataset.i : -1, el.classList.contains('wk-flip'), el.classList.contains('bob')]); }).observe(el, { attributes: true, subtree: true, attributeFilter: ['class', 'data-dir'] }); });
    await pg.evaluate(() => { window.__mr = Math.random; Math.random = () => (2 - 0.5) / 6; }); await pg.click('#brollbtn'); await pg.evaluate(() => { Math.random = window.__mr; });
    await pg.waitForFunction(() => document.querySelector('.rfw-mon').classList.contains('wk-on'), null, { timeout: 20000 });
    await pg.waitForTimeout(160);
    m = await measure(pg);
    await pg.screenshot({ path: path.join(SHOT, `${size[0]}_walk_back.png`) });
    assert.ok(m.on.l >= -2 && m.on.r <= m.W + 2 && m.on.t >= 0, `画面の外へ出ない ${JSON.stringify(m.on)}`);
    await idle(pg);
    const seen = await pg.evaluate(() => __seen);
    const walking = seen.filter((s) => s[0]);
    assert.ok(walking.length > 0 && walking.every((s) => s[0] === 'back' && s[1] === 'back' && !s[3] && !s[4]), `奥へは back・反転なし ${JSON.stringify(walking.slice(0, 6))}`);
    assert.ok(new Set(walking.map((s) => s[2])).size >= 3, 'コマが進む（ループ）');
    m = await measure(pg);
    assert.ok(m.on && m.on.set === 'front' && m.on.i === 0, '止まったら正面に戻る');
    // 手前へ戻る1歩：宝の行き止まりの寄り道（D_LLA）の奥から戻る＝D_LLA_10 → D_LLA_09 は画面の下へ。front のコマ・反転なし
    const ok = await pg.evaluate(() => {
      const N = MMRF_DATA.nodes, a = N.D_LLA_10, b = N.D_LLA_09; if (!a || !b || !(b[1] - a[1] > 10)) return null;
      const r = S.m.raise, c = r.field.core; r.node = 'D_LLA_10'; c.node = 'D_LLA_10'; c.trail.push('D_LLA_10'); c.moveLeft = 0; c.back = 'D_LLA'; c.exclude = null; r.pend = null; save(); board();
      return true;
    });
    assert.ok(ok, '手前へ戻る道（D_LLA_10 → 09）');
    await idle(pg);
    await pg.evaluate(() => { window.__seen = []; });
    await pg.evaluate(() => { window.__mr = Math.random; Math.random = () => (1 - 0.5) / 6; }); await pg.click('#brollbtn'); await pg.evaluate(() => { Math.random = window.__mr; });
    // 2026-10-14 開発29（6）：本編の Chapter 1 は後ろから追うカメラ＝行き止まりから戻る間もカメラが戻る向きへ回る＝戻る1歩も画面の上へ進む後ろ姿（back）。
    //   旧（北が上のカメラ）は D_LLA_10 → 09 が画面の下へ＝front だった。front のコマは止まっている姿（上）で使う
    await pg.waitForFunction(() => document.querySelector('.rfw-mon').dataset.dir === 'back', null, { timeout: 20000 });
    await pg.waitForTimeout(160);
    await pg.screenshot({ path: path.join(SHOT, `${size[0]}_walk_return.png`) });
    await idle(pg);
    const seen2 = (await pg.evaluate(() => __seen)).filter((s) => s[0]);
    assert.ok(seen2.length && seen2.every((s) => s[0] === 'back' && s[1] === 'back' && !s[3]), `戻る間も後ろ姿（back）・反転なし ${JSON.stringify(seen2.slice(0, 4))}`);
    const yw = await pg.evaluate(() => { const N = MMRF_DATA.nodes, a = N.D_LLA_10, b = N.D_LLA_09; return { yaw: MMWB.world().state().yaw, want: MMRF_WORLD.headingYaw(b[0] - a[0], b[1] - a[1]) }; });
    assert.ok(Math.abs(((yw.yaw - yw.want) % 360 + 540) % 360 - 180) < 45, `カメラは戻る向き ${JSON.stringify(yw)}`);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

for (const [sp, key] of [[0, 'solamo'], [2, 'nobiton'], [3, 'jiol']]) {
  test(`WK-B2（${key}）：2026-10-14 の 2.5D 歩行（front・back 各8コマ）＝止まると正面・足と体の高さ・奥へ back`, { skip: SKIP, timeout: 120000 }, async () => {
    const p = await openPage({ worldCh1: true }); const pg = p.page; mkdirSync(SHOT, { recursive: true });
    await toBoard(pg, sp);
    await pg.waitForFunction(() => [...document.querySelectorAll('.rfw-mon img.wk')].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 30000 });
    const src = await pg.evaluate(() => [...document.querySelectorAll('.rfw-mon img.wk')].map((i) => i.getAttribute('src')));
    assert.equal(src.length, 16, '読み込むのはこの種族の16コマだけ');
    assert.ok(src.every((s) => new RegExp(`assets/monsters/walk_25d/${key}/${key}_walk_(front|back)_0[1-8]\\.webp$`).test(s)), JSON.stringify(src.slice(0, 2)));
    await pg.evaluate(() => board()); await idle(pg);
    let m = await measure(pg);
    assert.ok(m.on && m.on.set === 'front' && m.on.i === 0 && /wk-idle/.test(m.cls), `止まると正面 ${JSON.stringify(m)}`);
    assert.ok(Math.abs(m.on.b - m.st.b) <= 3, `足の位置 ${m.on.b} / ${m.st.b}`);
    const body = m.on.body * (438 / 463);   // 3体の絵は体の高さ 438px（512px の中）
    assert.ok(Math.abs(body / m.st.h - 1) <= 0.05, `体の高さ ${body} / ${m.st.h}`);
    await pg.screenshot({ path: path.join(SHOT, `${key}_idle.png`) });
    await pg.evaluate(() => { window.__seen = []; const el = document.querySelector('.rfw-mon'); new MutationObserver(() => { const on = el.querySelector('img.wk.on'); __seen.push([el.dataset.dir || '', on ? on.dataset.s : '', el.classList.contains('wk-flip')]); }).observe(el, { subtree: true, attributes: true, attributeFilter: ['class'] }); });
    await pg.evaluate(() => { window.__mr = Math.random; Math.random = () => (2 - 0.5) / 6; }); await pg.click('#brollbtn'); await pg.evaluate(() => { Math.random = window.__mr; });
    await pg.waitForFunction(() => document.querySelector('.rfw-mon').classList.contains('wk-on'), null, { timeout: 20000 });
    await pg.waitForTimeout(200); await pg.screenshot({ path: path.join(SHOT, `${key}_walk_back.png`) });
    await idle(pg);
    const walking = (await pg.evaluate(() => __seen)).filter((x) => x[0]);
    assert.ok(walking.length > 0 && walking.every((x) => x[0] === 'back' && x[1] === 'back' && !x[2]), `奥へは back・反転なし ${JSON.stringify(walking.slice(0, 4))}`);
    m = await measure(pg); assert.ok(m.on && m.on.set === 'front' && m.on.i === 0, '止まったら正面に戻る');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

async function toTournament(pg, rank) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); board(); });
  await pg.waitForSelector('#chrcv .rcv-row', { timeout: 20000 });
  await pg.evaluate((rank) => { if (rank > 1) { S.m.raise.ch = 2; MMP7.recordRankClear(S, S.m, rank - 1); } const r = MMP8.startTournament(S, S.m, rank, 7); if (!r.ok) throw new Error('startTournament'); save(); board(); }, rank);
  await pg.waitForSelector('.tb1 .tbgo', { timeout: 15000 }); await pg.waitForTimeout(600);
}
for (const size of [H.SIZES.base, H.SIZES.se]) {
  test(`FC-B1（${size.join('×')}）：対戦表の顔＝2.5D の横顔（6体・8体）・読めないときは従来の丸い顔`, { skip: SKIP, timeout: 150000 }, async () => {
    mkdirSync(SHOT, { recursive: true });
    for (const [rank, n] of [[0, 6], [2, 8]]) {
      const p = await openPage({ size }); const pg = p.page;
      await toTournament(pg, rank);
      // 参加者の種族を5体に振り分けて、全員の横顔が出ることを見る（見た目の確認だけ。保存しない）
      await pg.evaluate(() => { S.m.raise.tour.league.entrants.forEach((x, i) => { if (!x.player) x.sp = (i - 1) % 5; }); board(); });
      await pg.waitForSelector('.tb1 .tbgo'); await pg.waitForTimeout(500);
      await pg.waitForFunction(() => [...document.querySelectorAll('.tb1 img.tbface')].every((i) => i.complete), null, { timeout: 20000 });
      const r = await pg.evaluate(() => ({ faces: [...document.querySelectorAll('.tb1 img.tbface')].map((i) => ({ src: i.getAttribute('src'), w: i.naturalWidth, f25: i.classList.contains('f25'), box: i.getBoundingClientRect().width })), rows: document.querySelectorAll('.tb1g .tbnm').length, sw: document.documentElement.scrollWidth <= innerWidth + 1 }));
      assert.equal(r.rows, n);
      assert.ok(r.faces.length >= n, `顔の数 ${r.faces.length}`);
      assert.ok(r.faces.every((f) => /faces_25d\/face_(soramo|gauru|nobiton|jiol|regnas)\.webp$/.test(f.src) && f.w === 256 && f.f25), JSON.stringify(r.faces.slice(0, 3)));
      assert.ok(r.faces.every((f) => f.box >= 16), `縮小しても読める大きさ ${Math.min(...r.faces.map((f) => f.box))}`);
      assert.ok(r.sw, 'はみ出さない');
      await pg.screenshot({ path: path.join(SHOT, `${size[0]}_bracket_${n}.png`) });
      assert.deepEqual(p.bad, []);
    }
  });
}

test('FC-B2：横顔が読み込めないときは従来の丸い顔（faces）へ', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({}); const pg = p.page;
  await pg.route(/faces_25d\//, (r) => r.fulfill({ status: 404, body: '' }));
  await toTournament(pg, 0);
  await pg.waitForFunction(() => [...document.querySelectorAll('.tb1 img.tbface')].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 20000 });
  const srcs = await pg.evaluate(() => [...document.querySelectorAll('.tb1 img.tbface')].map((i) => [i.getAttribute('src'), i.classList.contains('f25')]));
  assert.ok(srcs.length && srcs.every(([s, f]) => /assets\/tournament\/faces\/face_/.test(s) && !f), JSON.stringify(srcs));
});
