// =========================================================
// 2026-10-16 夜間 QA（B）：C案カメラ（?qaCam=c|ccut|fixed）の実ブラウザ確認（作業ブランチ claude/qa-bca-1016 だけ・試作）
//  QC-B1 Chapter 1 A × 3サイズ（375×667・390×844・393×852）：C案は歩いている間に向き（yaw の目標）を変えない・止まったときに先の地点が画面の空いている所に入る・
//        従来より回っている時間が短い・試遊はセーブを書き換えない・エラー／404 なし
//  QC-B2 フラグなし：2026-10-18 REV3 から C案カメラ・新歩行が正式の既定（従来は ?qaCam=old）・通常の URL では QA の札は出ない
//  QC-B3 Chapter 2 B・C（390×844）：C案でも止まったときに先の地点が見える・エラーなし
//  QC-B4 ?qaCam=fixed（旧の比較）を付けても C案のまま（2026-10-19 第2工程で比較の切り替えを撤去）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';

const skip = H.skipReason();
const SIZES = [[375, 667], [390, 844], [393, 852]];
const DICE = [3, 4, 2, 5, 3, 4];

async function settle(pg) {
  for (let i = 0; i < 200; i++) {
    if (await pg.$('.mmtalk:not(.mmtalk-out)')) { await H.finishTalk(pg); continue; }
    const st = await pg.evaluate(() => ({ busy: !!bBusy, fx: !!document.querySelector('.wbrelay,.wb-pop,.chf-enc2,.d3z,#bt,#tvs'), ph: MMP8.boardPhase(S.m) }));
    if (st.ph === 'branch' && !st.busy) { await pg.evaluate(() => { const b = document.querySelector('.wbbr .chroute'); if (b) b.click(); }); await pg.waitForTimeout(300); continue; }
    if (!st.busy && !st.fx) break;
    await pg.waitForTimeout(250);
  }
  await pg.waitForTimeout(900);
}
async function openTrial(L, ch, route, mode, size) {
  const q = (ch === 1 ? `?ch1trial=${route}` : `?ch2trial=${route}`) + (mode ? `&qaCam=${mode}` : '');
  const p = await L.open({ worldCh1: true, worldCh2: true, route, route2: route, query: q, size });
  await p.page.waitForFunction((ch) => window.MMWB && MMWB.world() && MMWB.world().isReady() && S.m && S.m.raise && S.m.raise.ch === ch, ch, { timeout: 90000 });
  await p.page.evaluate(() => { S.m.raise.field.tiles = {}; board(); });   // 出来事・バトルを出さない（ページの中だけ）
  await settle(p.page);
  return p;
}
/** 決まった出目で歩き、歩いている間の yaw の目標と、止まったときの先の地点の見え方を記録 */
async function walk(pg, n) {
  await pg.evaluate(() => { MMWB.world().qa(true); window.__yg = []; clearInterval(window.__ygT); window.__ygT = setInterval(() => { const W = MMWB.world(); window.__yg.push({ mv: !!(S.m.raise.pend && S.m.raise.pend.stage === 'move'), g: W.yawGoal(), node: S.m.raise.node }); }, 40); });
  const stops = [];
  for (let i = 0; i < n; i++) {
    if (await pg.evaluate(() => MMP8.boardPhase(S.m)) !== 'roll') break;
    await pg.evaluate((v) => { const mr = Math.random; Math.random = () => (v - 0.5) / 6; document.getElementById('brollbtn').click(); Math.random = mr; }, DICE[i % DICE.length]);
    await pg.waitForTimeout(400); await settle(pg);
    stops.push(await pg.evaluate(() => { const W = MMWB.world(), s = W.state(), v = s.view, nodes = (S.m.raise.ch === 2 ? MMWD2 : MMWD).dataOf(S.m).nodes;
      const ah = (s.ahead || []).slice(0, 4).map((id) => { const q = (W.at && W.at(id)) || nodes[id]; return W.project(q[0], q[1]); });   // 2026-10-20 第5便：マスを描く位置（表示の配置）
      return { node: S.m.raise.node, n: ah.length, inView: ah.filter((q) => q.x > 0 && q.x < v.W && q.y > v.top && q.y < v.bottom).length }; }));
  }
  const yg = await pg.evaluate(() => { clearInterval(window.__ygT); return window.__yg; });
  return { stops, yg, qa: await pg.evaluate(() => MMWB.world().qa()) };
}

test('QC-B1：C案（Chapter 1 A・3サイズ）＝歩く間は向きを変えない・止まったら先が見える・従来より回る時間が短い・セーブを書き換えない', { skip, timeout: 1800000 }, async () => {
  const L = await H.launch();
  try {
    for (const size of SIZES) {
      const tag = size.join('x');
      const p = await openTrial(L, 1, 'A', 'c', size), pg = p.page;
      const save0 = await pg.evaluate(() => localStorage.getItem('mr4v6'));
      assert.equal(await pg.evaluate(() => MMWB.world().qa().camMode), 'c', tag);
      assert.ok(await pg.$('#qabv'), `${tag}：QA の札（版の表示）`);
      const r = await walk(pg, DICE.length);
      assert.ok(r.stops.length >= 4, `${tag}：歩けた ${r.stops.length}`);
      for (const s of r.stops) assert.equal(s.inView, s.n, `${tag}：${s.node} で先の地点が画面の空いている所に入る ${JSON.stringify(s)}`);
      // 歩いている間（同じ一続きの move の中）に yaw の目標が変わらない（分かれ道を選んだ直後の1回は止まった扱い＝除く）
      let changes = 0; for (let i = 1; i < r.yg.length; i++) if (r.yg[i].mv && r.yg[i - 1].mv && Math.abs(r.yg[i].g - r.yg[i - 1].g) > 0.01 && r.yg[i].node !== r.yg[i - 1].node) changes++;
      assert.ok(changes <= 1, `${tag}：歩いている間に向きの目標が変わった ${changes}`);
      assert.ok(r.qa.ms < 4000, `${tag}：回っている時間 ${r.qa.ms}ms`);
      assert.equal(await pg.evaluate(() => localStorage.getItem('mr4v6')), save0, `${tag}：試遊はセーブを書き換えない`);
      assert.deepEqual(p.errors, [], tag); assert.deepEqual(p.bad, [], tag);
      await p.ctx.close();
    }
    // 2026-10-19 第2工程：従来のカメラ（?qaCam=old）との比較は撤去＝URL を付けても C案のまま（本編と QA は同じカメラ）
    const p = await openTrial(L, 1, 'A', 'old', [390, 844]);
    assert.equal(await p.page.evaluate(() => MMWB.world().qa().camMode), 'c', '?qaCam=old でも C案（旧カメラへ戻れない）'); await p.ctx.close();
  } finally { await L.close(); }
});

test('QC-B2：フラグなし＝C案（2026-10-18 REV3 で正式）・新歩行・通常の URL では QA の札なし', { skip, timeout: 600000 }, async () => {
  const L = await H.launch();
  try {
    const p = await L.open({ worldCh1: true, worldCh2: true, route2: 'A', query: '?ch2trial=A' }), pg = p.page;
    await pg.waitForFunction(() => window.MMWB && MMWB.world() && MMWB.world().isReady(), null, { timeout: 90000 });
    const o = await pg.evaluate(() => { const W = MMWB.world(); return { heading: W.opts.heading, yawTau: W.opts.yawTau, camMode: W.opts.camMode, qa: W.qa().camMode, badge: !!document.getElementById('qabv'), walk: !!(window.MMQAW && MMQAW.active) }; });
    assert.deepEqual(o, { heading: true, yawTau: 600, camMode: 'c', qa: 'c', badge: true, walk: true }, JSON.stringify(o));   // ch2trial は QA の札を出す（版の確認用）・2026-10-18 REV3：C案カメラと新歩行が既定
    await p.ctx.close();
    const p2 = await L.open({ worldCh1: true }), pg2 = p2.page;
    assert.equal(await pg2.evaluate(() => !!document.getElementById('qabv') || !!(window.MMQAB && MMQAB.qa)), false, '通常の URL では QA の札も試遊も出ない');
    await p2.ctx.close();
  } finally { await L.close(); }
});

test('QC-B3：Chapter 2 B・C（390×844）でも C案で止まったときに先の地点が見える', { skip, timeout: 1200000 }, async () => {
  const L = await H.launch();
  try {
    for (const route of ['B', 'C']) {
      const p = await openTrial(L, 2, route, 'c', [390, 844]), r = await walk(p.page, 5);
      for (const s of r.stops) assert.equal(s.inView, s.n, `Ch2 ${route}：${s.node} ${JSON.stringify(s)}`);
      assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
      await p.ctx.close();
    }
  } finally { await L.close(); }
});

test('QC-B4：?qaCam=fixed（旧の比較）を付けても C案のまま＝向きは C案の規則で回る（2026-10-19 第2工程）', { skip, timeout: 600000 }, async () => {
  const L = await H.launch();
  try {
    const p = await openTrial(L, 1, 'A', 'fixed', [390, 844]); await walk(p.page, 4);
    assert.deepEqual(await p.page.evaluate(() => [MMWB.world().opts.heading, MMWB.world().qa().camMode]), [true, 'c']);
    await p.ctx.close();
  } finally { await L.close(); }
});
