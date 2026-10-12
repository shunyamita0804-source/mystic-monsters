// =========================================================
// 2026-10-12 Chapter 1 の世界のボード：試遊修正（実ブラウザ。本編＝worldCh1:true）
//  BV-B1（375×667・390×844・430×932）：代表の地点（START・長い道・分かれ道の手前・選んだあと・寄り道の戻り・行き止まり・後半の長い道・合流の先）で
//         モンスターの幅＝マスの幅の 1.1〜1.3倍／カメラが入れる先の地点（4・分かれ道の手前は各2）がすべて HUD と操作欄の間／モンスターも同じ間
//         分かれ道の手前＝両方の道は明るい（far でない）・選んだあと＝反対側の道のマスは薄い（far）・道筋の薄い幕がある
//  BV-B2（390×844）：START から 6 で歩く間、倍率は1フレームで急に変わらない・モンスターは画面の中
//  BV-B3：開始の俯瞰の間は幕もマスの薄さも出さない（全体が見える）→ 追従に入ると道筋の強調
//  Playwright / Chromium が無い環境では省略（skip）する。
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
const idle = (pg) => pg.waitForFunction(() => !bBusy && !MMCHD.isLocked() && !document.querySelector('.wb-pop,.chf-enc2,.mmtalk,.chdz'), null, { timeout: 30000 }).then(() => pg.waitForTimeout(300));
async function toBoard(pg) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); save(); board(); });
  await pg.waitForSelector('#wbw #brollbtn'); await idle(pg);
}
/** 地点へ置いて（trail＝その区間をたどってきた）カメラが落ち着くまで待ち、測る */
const measure = (pg, seg, i, back) => pg.evaluate(async ([seg, i, back]) => {
  const D = MMRF_DATA, node = i == null ? seg : D.segments[seg][3][i];
  const r = S.m.raise, c = r.field.core; r.node = node; c.node = node; c.moveLeft = 0; c.exclude = null; r.pend = null; c.back = back ? seg : null;
  c.trail = i == null ? [node] : D.segments[seg][3].slice(0, i + 1);
  save(); board(); await new Promise((ok) => setTimeout(ok, 2200));
  const st = MMWB.state().world, h = document.querySelector('.chh').getBoundingClientRect(), d = document.querySelector('#chdock').getBoundingClientRect();
  const rect = (id) => { const e = document.querySelector(`.wbv .rfw-tile[data-node="${id}"]`); return e && e.style.display !== 'none' ? e.getBoundingClientRect() : null; };
  const inView = (q) => !!q && q.left + q.width / 2 >= 0 && q.left + q.width / 2 <= innerWidth && q.top + q.height * 0.4 >= h.bottom && q.top + q.height * 0.4 <= d.top;
  const cur = rect(node), mon = document.querySelector('.wbv .rfw-mon').getBoundingClientRect();
  const fit = st.ahead, fitVis = fit.filter((id) => inView(rect(id))).length;
  const far = (id) => { const e = document.querySelector(`.wbv .rfw-tile[data-node="${id}"]`); return !!e && e.classList.contains('far'); };
  return { node, s: st.cam.s, ratio: mon.width / cur.width, fit: fit.length, fitVis, monIn: mon.top >= h.bottom - 2 && mon.bottom <= d.top + 2 && mon.left >= -1 && mon.right <= innerWidth + 1,
    focus: st.focus.length, veil: !!document.querySelector('.wbv .rfw-veil'), farOf: Object.fromEntries(['EL01_01', 'ER01_01', 'ER01_04', 'EL01_02'].map((id) => [id, far(id)])), curFar: far(node) };
}, [seg, i, back]);

for (const size of [[375, 667], [390, 844], [430, 932]]) {
  test(`BV-B1（${size.join('×')}）：モンスター＝マスの 1.2倍前後・先の地点が見える・選ばなかった道は薄い`, { skip: SKIP, timeout: 240000 }, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await toBoard(pg);
    const pts = [['START'], ['S01', 4], ['J0'], ['EL01', 4], ['EL3'], ['D_LA', 8, true], ['R_SPECIAL'], ['P'], ['Q'], ['H'], ['LATE_SAFE', 8], ['FINAL']];
    const out = [];
    for (const [seg, i, back] of pts) out.push(await measure(pg, seg, i, back));
    for (const r of out) {
      assert.ok(r.ratio >= 1.1 && r.ratio <= 1.3, `${r.node}：モンスターの幅 ÷ マスの幅 = ${r.ratio.toFixed(2)}`);
      assert.equal(r.fitVis, r.fit, `${r.node}：カメラが入れる先の地点 ${r.fitVis}/${r.fit}`);
      assert.ok(r.fit >= Math.min(4, r.fit), r.node); assert.ok(r.monIn, `${r.node}：モンスターは HUD と操作欄の間`);
      assert.equal(r.curFar, false, `${r.node}：今の地点は明るい`); assert.ok(r.veil && r.focus >= 4, `${r.node}：道筋の幕`);
    }
    const byNode = Object.fromEntries(out.map((r) => [r.node, r]));
    assert.deepEqual([byNode.J0.farOf.EL01_01, byNode.J0.farOf.ER01_01], [false, false], '分かれ道の手前＝両方の道は明るい');
    assert.equal(byNode.EL01_04.farOf.ER01_04, true, '選んだあと＝反対側の道は薄い');
    assert.equal(byNode.EL01_04.farOf.EL01_02, false, '来た道の直前は明るい');
    const ss = out.map((r) => r.s); assert.ok(Math.min(...ss) >= 2.2 && Math.max(...ss) <= 5.6, `倍率 ${ss.map((x) => x.toFixed(2))}`);
    assert.ok(out.filter((r) => r.s >= 4).length >= 6, '多くの地点で近いカメラ（4以上）');
    assert.equal(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('BV-B2：歩く間に倍率が急に変わらない・モンスターは画面の中', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({ size: H.SIZES.base }); const pg = p.page;
  await toBoard(pg);
  await pg.evaluate(() => { window.__cs = []; const f = () => { const w = MMWB.state().world; if (w) { const m = document.querySelector('.wbv .rfw-mon').getBoundingClientRect(); window.__cs.push([w.cam.s, m.left, m.right, m.top, m.bottom]); } if (window.__cs.length < 900) requestAnimationFrame(f); }; requestAnimationFrame(f); });
  await pg.evaluate(() => { window.__mr = Math.random; Math.random = () => (6 - 0.5) / 6; }); await pg.click('#brollbtn'); await pg.evaluate(() => { Math.random = window.__mr; });
  await idle(pg); await pg.waitForTimeout(800);
  const cs = await pg.evaluate(() => window.__cs);
  let jump = 0; for (let k = 1; k < cs.length; k++) jump = Math.max(jump, Math.abs(Math.log(cs[k][0] / cs[k - 1][0])));
  assert.ok(cs.length > 60, `${cs.length} フレーム`);
  assert.ok(jump < 0.06, `1フレームの倍率の変化（log）= ${jump.toFixed(3)}`);
  const W = 390; assert.ok(cs.every((c) => c[1] > -40 && c[2] < W + 40), 'モンスターは画面の外へ出ない');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('BV-B3：開始の俯瞰の間は幕・薄いマスを出さない → 追従で道筋の強調', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({ size: H.SIZES.base, intro: true }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); save(); board(); });
  await pg.waitForSelector('.wbv .rfw.intro', { timeout: 20000 }); await pg.waitForTimeout(400);
  const a = await pg.evaluate(() => ({ veil: getComputedStyle(document.querySelector('.wbv .rfw-veil')).opacity, far: [...document.querySelectorAll('.wbv .rfw-tile.far')].map((e) => getComputedStyle(e).opacity) }));
  assert.equal(a.veil, '0', '俯瞰の間は幕なし'); assert.ok(a.far.length > 0 && a.far.every((o) => o === '1'), '俯瞰の間は全部のマスが見える');
  await pg.waitForSelector('.wbv .rfw:not(.intro)', { timeout: 20000 }); await pg.waitForTimeout(900);
  const b = await pg.evaluate(() => ({ veil: +getComputedStyle(document.querySelector('.wbv .rfw-veil')).opacity, far: getComputedStyle(document.querySelector('.wbv .rfw-tile.far')).opacity }));
  assert.ok(b.veil > 0.9, '追従では幕'); assert.ok(+b.far < 0.5, '道筋の外のマスは薄い');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
