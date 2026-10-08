// =========================================================
// 実ブラウザ：Chapter 1 Pattern A 正式ボード（2026-10-08）
//  BB-1＝背景をまたぐ移動（3サイズ）：マスの見た目の大きさは全背景で同じ・モンスターは画面の上でつながって動く（瞬間移動しない）・止まる位置＝マスの中心・ターンと効果は1回
//  BB-2＝再読み込み：背景・ノード・カメラ（モンスターの画面の位置）が戻る
//  BB-3＝分かれ道 A（同じ背景の左右）：モンスターは選択シートより上・左右の道の入口が見える・選んで進める
//  BB-4＝Scene14 → ゴール → 広場の全景（到着）→ ロビー → 大会受付
//  BB-5＝視差を減らす設定でも背景をまたいで進める
//  BB-6＝14枚の背景が 404 なく読める（?chdebug=1 の開発用の表示は URL を付けたときだけ）
//  QA_E2E=1 のときだけ実行（tests/e2e/harness.mjs）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
let L, opened = [];
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });
async function open(opt = {}) { for (const q of opened) await q.ctx.close().catch(() => {}); const p = await L.open(opt); opened = [p]; return p; }
const idle = (pg) => pg.waitForFunction(() => !bBusy && !MMCHD.isLocked() && !document.querySelector('.chpop'), null, { timeout: 30000 }).then(() => pg.waitForTimeout(700));
async function toField(pg) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); S.m.raise.field.introSeen = true; const g = MMCH.graphFor(S.m), A = S.m.raise.field.nodeAssignments; for (const id of g.order) if (g.nodes[id].kind === 'slot') A[id] = { t: 'normal' }; save(); board(); });
  await pg.waitForSelector('#chf .chf-bg'); await idle(pg);
}
async function rollAs(pg, v) { await pg.evaluate((v) => { window.__mr = Math.random; Math.random = () => ({ 1: 0.1, 2: 0.5, 3: 0.9 }[v]); }, v); await pg.click('#brollbtn'); await pg.evaluate(() => { Math.random = window.__mr; }); }
const place = (pg, node, extra = {}) => pg.evaluate(([node, extra]) => { const r = S.m.raise; r.node = node; r.pend = null; Object.assign(r.field, extra); save(); board(); }, [node, extra]);
const record = (pg) => pg.evaluate(() => { window.__tr = []; const f = () => { const w = document.querySelector('#bmonw .mon'), fv = document.querySelector('#chf'); if (w && fv) { const r = w.getBoundingClientRect(), q = fv.getBoundingClientRect(); window.__tr.push([performance.now(), r.left + r.width / 2 - q.left, r.bottom - q.top, [...document.querySelectorAll('#chfcam .chf-tile.fx')].map((t) => Math.round(t.getBoundingClientRect().width))]); } window.__raf = requestAnimationFrame(f); }; f(); });
const stopRec = (pg) => pg.evaluate(() => { cancelAnimationFrame(window.__raf); return window.__tr; });
/** 止まっているモンスターの足元と、そのマスの中心（画面の px） */
const stand = (pg) => pg.evaluate(() => { const w = document.querySelector('#bmonw'), id = w.dataset.node, t = document.querySelector(`#chfcam .chf-tile[data-id="${id}"]`), fv = document.querySelector('#chf').getBoundingClientRect(), r = w.getBoundingClientRect(); const tc = t ? (() => { const b = t.getBoundingClientRect(); return [b.left + b.width / 2 - fv.left, b.top + b.height * 0.42 - fv.top]; })() : null; return { id, scene: document.querySelector('#chfd').textContent, foot: [r.left + r.width / 2 - fv.left, r.top + r.height * 0.94 - fv.top], tile: tc, H: fv.height }; });

for (const size of [H.SIZES.base, H.SIZES.se, H.SIZES.max]) {
  test(`BB-1（${size.join('×')}）：背景をまたぐ移動：マスの見た目の大きさは全背景で同じ・モンスターは画面の上でつながって動く・止まる位置＝マスの中心・ターンと効果は1回`, { skip: SKIP }, async () => {
    const p = await open({ size }); const pg = p.page;
    await toField(pg);
    const tok = await pg.evaluate(() => { const F = MMCH.getConfig(1).tileUI.fixedSize, w = document.querySelector('#chf').clientWidth; return Math.round(Math.max(F.min, Math.min(F.max, w * F.vw))); });
    const widths = new Set();
    for (const [from, v, to, field] of [['p1_2', 3, 'p1_5', 2], ['p2_4', 3, 'p3_0', 4], ['p9_3', 2, 'p10_0', 9], ['p13_1', 3, 'p14_1', 14]]) {
      await place(pg, from, from.startsWith('p9') ? { branch: 'bridge' } : {}); await idle(pg);
      const used = await pg.evaluate(() => S.m.raise.turnsUsed);
      await record(pg); await rollAs(pg, v); await idle(pg); const tr = await stopRec(pg);
      const st = await pg.evaluate(() => ({ node: S.m.raise.node, field: MMCH.graphFor(S.m).nodes[S.m.raise.node].field, used: S.m.raise.turnsUsed, pend: S.m.raise.pend, cams: document.querySelectorAll('.chf-cam').length }));
      assert.deepEqual([st.node, st.field, st.used, st.pend, st.cams], [to, field, used + 1, null, 1], `${from} +${v} → ${to}（背景 ${field}）・ターンは1回・停止地点の処理は終わっている`);
      let worst = 0; for (let i = 1; i < tr.length; i++) { const dt = Math.max(16, tr[i][0] - tr[i - 1][0]), d = Math.hypot(tr[i][1] - tr[i - 1][1], tr[i][2] - tr[i - 1][2]); worst = Math.max(worst, d / dt); tr[i][3].forEach((w) => widths.add(w)); }
      assert.ok(worst < 1.4, `${from}：モンスターは画面の上で瞬間移動しない（最大 ${worst.toFixed(2)} px/ms）`);
      const s = await stand(pg); assert.ok(s.tile && Math.abs(s.foot[0] - s.tile[0]) < 4 && Math.abs(s.foot[1] - s.tile[1]) < 6, `${to}：止まる位置＝マスの中心（足元 ${s.foot.map(Math.round)}・マス ${s.tile && s.tile.map(Math.round)}）`);
      assert.ok(s.foot[1] > s.H * 0.35 && s.foot[1] < s.H * 0.95, `${to}：モンスターは画面の中央より少し下（${Math.round(s.foot[1])} / ${Math.round(s.H)}）`);
    }
    assert.deepEqual([...widths].filter((w) => Math.abs(w - tok) > 1), [], `マスの見た目の幅は全背景・手前／奥で同じ ${tok}px（${[...widths].join(',')}）`);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('BB-2：再読み込み：背景（Scene）・ノード・カメラ（モンスターの画面の位置）が戻る', { skip: SKIP }, async () => {
  const p = await open(); const pg = p.page;
  await toField(pg);
  await place(pg, 'p7_2', { branch: 'forest' }); await idle(pg);
  const a = await stand(pg);
  await pg.reload(); await pg.waitForFunction(() => typeof window.MMP8 === 'object' && typeof S === 'object'); await pg.waitForSelector('.p15start'); await pg.click('.p15start');
  await pg.waitForSelector('#chf .chf-bg'); await idle(pg);
  const b = await stand(pg);
  assert.deepEqual([b.id, b.scene], [a.id, a.scene], `同じノード・同じ背景（${a.scene}）`);
  assert.ok(Math.hypot(b.foot[0] - a.foot[0], b.foot[1] - a.foot[1]) < 3, `カメラ＝モンスターの画面の位置も同じ（${a.foot.map(Math.round)} → ${b.foot.map(Math.round)}）`);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

for (const size of [H.SIZES.base, H.SIZES.se]) {
  test(`BB-3（${size.join('×')}）：分かれ道 A（同じ背景の左右の道）：モンスターは選択シートより上・左右の道の入口が見える・選んで進める`, { skip: SKIP }, async () => {
    const p = await open({ size }); const pg = p.page;
    await toField(pg);
    await place(pg, 'p2_5'); await idle(pg); await rollAs(pg, 2); await idle(pg);
    const r = await pg.evaluate(() => { const sh = document.querySelector('#chf-ui .chbr').getBoundingClientRect(), m = document.querySelector('#bmonw .mon').getBoundingClientRect(), t = (id) => document.querySelector(`#chfcam .chf-tile[data-id="${id}"]`).getBoundingClientRect(), hud = document.querySelector('#chf-ui .chh').getBoundingClientRect(); return { phase: MMP8.boardPhase(S.m), sheet: sh.top, mon: m.bottom, l: t('p3l_0'), r: t('p3r_0'), hud: hud.bottom }; });
    assert.equal(r.phase, 'branch'); assert.ok(r.mon <= r.sheet + 2, `モンスターはシートより上（${Math.round(r.mon)} ≤ ${Math.round(r.sheet)}）`);
    for (const t of [r.l, r.r]) assert.ok(t.bottom < r.sheet && t.top > r.hud && t.left >= 0 && t.right <= size[0], '左右の道の入口のマスが見える');
    await pg.evaluate(() => chfPick(S.m.raise.pend.opts[0])); await idle(pg);
    assert.deepEqual(await pg.evaluate(() => [S.m.raise.node, S.m.raise.field.branch]), ['p3l_0', 'power']);
    await rollAs(pg, 1); await idle(pg); assert.equal(await pg.evaluate(() => S.m.raise.node), 'p3l_1', '選んだ道を進める');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('BB-4：Scene14（大会会場前の共通 Scene）→ ゴール → 広場の全景（到着）→ 会場の中のロビー → 大会受付（大会のルール・セドリックは従来どおり）', { skip: SKIP }, async () => {
  const p = await open({ arrival: true }); const pg = p.page;
  await toField(pg);
  await place(pg, 'p14_1'); await idle(pg); await rollAs(pg, 2);
  await pg.waitForSelector('#chfarr');
  assert.equal(await pg.evaluate(() => document.querySelector('#chfarr .chf-arrive-bg').getAttribute('src')), './assets/fields/ch1a/formal_1008/ch1a_scene_14.webp', '到着＝14 の広場の全景');
  await H.finishTalk(pg);
  await pg.waitForSelector('#chrcv', { timeout: 20000 });
  assert.deepEqual(await pg.evaluate(() => [S.m.raise.node, MMP8.boardPhase(S.m), !!S.m.raise.field.arrivalSeen]), ['p14_3', 'goal', true]);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('BB-5：視差を減らす設定（prefers-reduced-motion）でも背景をまたいで進める', { skip: SKIP }, async () => {
  const p = await open(); const pg = p.page; await pg.emulateMedia({ reducedMotion: 'reduce' });
  await toField(pg);
  await place(pg, 'p5_2'); await idle(pg); await rollAs(pg, 2); await idle(pg);
  assert.equal(await pg.evaluate(() => MMP8.boardPhase(S.m)), 'branch');
  await pg.evaluate(() => chfPick('p6_0')); await idle(pg);
  const s = await stand(pg); assert.equal(s.id, 'p6_0'); assert.ok(s.tile && Math.abs(s.foot[0] - s.tile[0]) < 4);
  assert.equal(await pg.evaluate(() => document.querySelectorAll('.chf-cam').length), 1);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('BB-6：14枚の背景が 404 なく読める。開発用の表示（道路中央ライン・範囲・カメラの注視点）は ?chdebug=1 のときだけ', { skip: SKIP }, async () => {
  const p = await open(); const pg = p.page;
  await toField(pg);
  assert.equal(await pg.evaluate(() => document.querySelectorAll('.chf-dbgsvg,.chf-dbgsc,.chf-dbgcam').length), 0, '本番の URL では出ない');
  const res = await pg.evaluate(() => Promise.all(MMCH.getConfig(1).fieldScenes.map((s) => fetch(s.bg).then((r) => [s.key, r.status]))));
  assert.deepEqual(res.filter((x) => x[1] !== 200), []);
  const q = await open({ query: '?chdebug=1' }); const pd = q.page;
  await toField(pd);
  const d = await pd.evaluate(() => ({ svg: !!document.querySelector('.chf-dbgsvg .ctr'), lines: document.querySelectorAll('.chf-dbgsvg line').length, cam: !!document.querySelector('#chfdbgcam'), sc: (document.querySelector('#chfdbgsc') || {}).textContent || '' }));
  assert.ok(d.svg && d.lines >= 4 && d.cam && /scene 01/.test(d.sc), JSON.stringify(d));
  assert.deepEqual(q.errors, []); assert.deepEqual(q.bad, []);
});
