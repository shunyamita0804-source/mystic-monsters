// =========================================================
// 実ブラウザ：2026-10-04（追加アセット）能力UPの道具6種・Chapter の短い結果演出3種（js/chapter/field-view.js の resultFx）
//  RF-B1 能力マス×6能力＝道具の絵（能力ごと）→ 実際の能力名・上がった値（コードの値）→ 既存の成長演出（390×844・375×667）
//  RF-B2 休むマス＝焚き火（疲れの回復・ライフではない）／ほかの出来事＝共通の結果（実際の値）
//  RF-B3 道中の野生バトルの勝利だけ勝利の演出（レア・ライバル・大会の結果では出ない）
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
const idle = (pg) => pg.waitForFunction(() => !bBusy && !MMCHD.isLocked() && !document.querySelector('.chpop,.chdz,.chf-fina,.chf-rfx'), null, { timeout: 30000 }).then(() => pg.waitForTimeout(200));
async function toField(pg, sp = 0) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate((sp) => { const m = mk(sp); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); save(); board(); }, sp);
  await pg.waitForSelector('#chf .chf-bg'); await idle(pg);
}
const place = (pg, node) => pg.evaluate((node) => { const r = S.m.raise, g = MMCH.graphFor(S.m); r.node = node; r.pend = null; r.field.fieldId = g.nodes[node].field; save(); board(); }, node);
async function rollAs(pg, v) { await pg.evaluate((v) => { window.__mr = Math.random; Math.random = () => ({ 1: 0.1, 2: 0.5, 3: 0.9 }[v]); }, v); await pg.click('#brollbtn'); await pg.evaluate(() => { Math.random = window.__mr; }); }
/** 結果演出（.chf-rfx）と結果の窓（.chpop）が出た順・中身を記録 */
const watch = (pg) => pg.evaluate(() => { window.__r = []; const o = new MutationObserver(() => { for (const e of document.querySelectorAll('#chf-ui .chf-rfx,#chf-ui .chpop')) if (!e.__seen) { e.__seen = 1; const im = e.querySelector('.rfx-im'), b = e.getBoundingClientRect(); window.__r.push({ cls: e.className, key: e.dataset.key || '', src: im ? im.getAttribute('src') : '', tx: (e.querySelector('.rfx-tx') || {}).textContent || '', t: performance.now(), in: b.left >= -1 && b.right <= innerWidth + 1 && b.top >= -1 && b.bottom <= innerHeight + 1 }); } }); o.observe(document.querySelector('#chf-ui'), { childList: true, subtree: true }); window.__ro = o; });
const LAB = { li: 'ライフ', po: 'ちから', in: 'かしこさ', hi: '命中', ev: '回避', de: '丈夫さ' };
const TOOL = { li: 'li_hurdle', po: 'po_weight', in: 'in_grimoire', hi: 'hi_target', ev: 'ev_balls', de: 'de_shield' };

for (const size of [[390, 844], [375, 667]]) {
  test(`RF-B1（${size.join('×')}）：能力マス 6能力：能力に対応する道具 → 「能力名 +実際の値」→ 既存の成長演出（ガウル＝適性で値が違う）。画像に数値は無い`, { skip: SKIP }, async () => {
    const p = await open({ size }); const pg = p.page; await toField(pg, 1);   // ガウル：ライフ D(+4)・ちから B(+6)・かしこさ B・命中 C(+5)・回避 B・丈夫さ E(+3)
    for (const k of Object.keys(LAB)) {
      await pg.evaluate((k) => { const f = S.m.raise.field; f.nodeAssignments.p1_1 = { t: 'stat', k }; f.clearedStats = []; save(); }, k);
      await place(pg, 'p1_0'); await idle(pg);
      const v0 = await pg.evaluate((k) => S.m[k], k); await watch(pg);
      await rollAs(pg, 1); await idle(pg);
      const v1 = await pg.evaluate((k) => S.m[k], k), R = await pg.evaluate(() => window.__r), gain = v1 - v0;
      assert.ok(gain > 0, `${k} が上がった`);
      const tool = R.findIndex((x) => /k-tool/.test(x.cls)), pop = R.findIndex((x) => /chpop/.test(x.cls));
      assert.ok(tool >= 0 && pop > tool, `${k}：道具 → 成長演出の順（${tool} / ${pop}）`);
      const T = R[tool]; assert.equal(T.key, k); assert.ok(T.src.endsWith(`assets/chapter/stat_tools/${TOOL[k]}.webp`), `${k} の道具 ${T.src}`);
      assert.equal(T.tx, `${LAB[k]} +${gain}`, '実際の能力名と値'); assert.ok(T.in, '画面に収まる');
      assert.ok(R[pop].t - T.t < 1100, '短い（約0.8秒）');
    }
    assert.equal(await pg.evaluate(() => document.querySelectorAll('.chf-rfx').length), 0, '演出は残らない');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('RF-B2（390×844）：休むマス＝焚き火と「疲れ −N」（ライフは変わらない）／ほかの出来事＝共通の結果の紋章と実際の値（G・能力・疲れ）', { skip: SKIP }, async () => {
  const p = await open(); const pg = p.page; await toField(pg);
  // 休むマス（回復の出来事 'break'＝疲れ −20）
  await pg.evaluate(() => { const f = S.m.raise.field; f.nodeAssignments.p1_1 = { t: 'event', recovery: true, tier: 'normal', ev: 'break' }; f.consumedEvents = []; S.m.raise.fatigue = 60; save(); });
  await place(pg, 'p1_0'); await idle(pg);
  const li0 = await pg.evaluate(() => S.m.li); await watch(pg); await rollAs(pg, 1); await idle(pg);
  let R = await pg.evaluate(() => window.__r); const rest = R.find((x) => /k-rest/.test(x.cls));
  assert.ok(rest, '休むマスの演出'); assert.ok(rest.src.endsWith('assets/chapter/result_fx/rest.webp')); assert.equal(rest.tx, '疲れ −20'); assert.ok(!/ライフ/.test(rest.tx));
  assert.equal(await pg.evaluate(() => S.m.li), li0, 'ライフは回復しない（変わらない）'); assert.ok(!R.some((x) => /k-event/.test(x.cls)), '休むマスに共通の結果は重ねない');
  // ほかの出来事：お金（coin＝+50G）・能力（tailwind＝回避 +5）・疲れ（spring_water＝疲れ −15・ただの出来事のマス）
  for (const [ev, re] of [['coin', /^\+50G$/], ['tailwind', /^回避 \+5$/], ['spring_water', /^疲れ −15$/]]) {
    await pg.evaluate((ev) => { const f = S.m.raise.field; f.nodeAssignments.p1_1 = { t: 'event', tier: 'normal', ev }; f.consumedEvents = []; S.m.raise.fatigue = 40; save(); }, ev);
    await place(pg, 'p1_0'); await idle(pg); await watch(pg); await rollAs(pg, 1);
    await pg.waitForFunction(() => document.querySelector('.mmtalk,.chf-fina,.chf-rfx'), null, { timeout: 15000 }).catch(() => {});
    for (let i = 0; i < 12 && await pg.evaluate(() => !!document.querySelector('.mmtalk:not(.mmtalk-out)')); i++) { await H.finishTalk(pg).catch(() => {}); }
    await idle(pg);
    R = await pg.evaluate(() => window.__r); const e = R.find((x) => /k-event/.test(x.cls));
    assert.ok(e, `${ev}：共通の結果`); assert.ok(e.src.endsWith('assets/chapter/result_fx/event_result.webp')); assert.match(e.tx, re, `${ev}：実際の値（${e.tx}）`);
    assert.ok(!R.some((x) => /k-rest/.test(x.cls)), `${ev}：休むマスの演出は出ない`);
  }
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('RF-B3（390×844）：道中の野生バトルの勝利だけ勝利の演出。負け・レア・ライバル・大会の試合では出ない', { skip: SKIP }, async () => {
  const p = await open(); const pg = p.page; await toField(pg);
  const run = async (bt, f) => { await place(pg, 'p1_0'); await idle(pg); await watch(pg); await pg.evaluate(([bt, f]) => { globalThis.MM_LAST_BT = bt; p8AfterBattle(f); }, [bt, f]); await pg.waitForTimeout(250); await idle(pg); return (await pg.evaluate(() => window.__r)).filter((x) => /k-win/.test(x.cls)); };
  let W = await run('wild', { kind: 'practice', won: true });
  assert.equal(W.length, 1, '野生の勝利で1回'); assert.ok(W[0].src.endsWith('assets/chapter/result_fx/wild_victory.webp')); assert.ok(W[0].in);
  assert.equal((await run('wild', { kind: 'practice', won: false })).length, 0, '負けでは出ない');
  assert.equal((await run('rare', { kind: 'practice', won: true })).length, 0, 'レアでは出ない');
  assert.equal((await run('rival', { kind: 'practice', won: true })).length, 0, 'ライバルでは出ない');
  assert.equal((await run('wild', { kind: 'practice', won: true, interrupted: true })).length, 0, '途中終了では出ない');
  assert.equal(await pg.evaluate(() => globalThis.MM_LAST_BT), null, '一度使ったら消える');
  // 大会の試合（league）は p8AfterBattle で queueWin を呼ばない（コード上の確認）
  assert.ok(await pg.evaluate(() => !/queueWin[^]*kind=="league"/.test('') && p8AfterBattle.toString().indexOf('queueWin') > p8AfterBattle.toString().indexOf('f.kind=="league"')), '大会の分岐の後ろ');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
