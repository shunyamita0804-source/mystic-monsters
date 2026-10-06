// =========================================================
// 実ブラウザ：正式 SE 15種の鳴る所（2026-10-06）
//  SE-B1 サイコロ＝1回の出目で DICE_THROW だけ1回（LAND・ROLL・STOP を重ねない）・能力マス＝TRAINING_ITEM_SPAWN → TRAINING_SUCCESS（STAT_UP なし）
//  SE-B2 宝箱＝段階ごとに1つだけ（normal TIER_1・rare TIER_2・special TIER_3。CHEST_OPEN と重ねない）
//  SE-B3 遭遇＝野生 WILD_ALERT・レア RARE_ALERT・ライバル RIVAL_APPEAR（別々の音）
//  SE-B4 市場＝購入できなかったときは MARKET_PURCHASE を鳴らさない・成立したら1回
//  SE-B5 正式音源のファイルがすべて 200 で読める
//  MMAUDIO.seLog()＝頼まれた SE の名前（登録・ミュート・silent に関係なく）
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
const idle = (pg) => pg.waitForFunction(() => !bBusy && !MMCHD.isLocked() && !document.querySelector('.chpop,.chdz,.chf-fina'), null, { timeout: 30000 }).then(() => pg.waitForTimeout(200));
async function toField(pg) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { finaFlags().story = ['tut_turns']; const m = mk(0); m.sp = 0; m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); save(); board(); });
  await pg.waitForSelector('#chf .chf-bg'); await idle(pg);
}
const place = (pg, node) => pg.evaluate((node) => { const r = S.m.raise, g = MMCH.graphFor(S.m); r.node = node; r.pend = null; r.field.fieldId = g.nodes[node].field; save(); board(); }, node).then(() => pg.waitForTimeout(300));
async function rollAs(pg, v) { await pg.evaluate((v) => { window.__mr = Math.random; Math.random = () => ({ 1: 0.1, 2: 0.5, 3: 0.9 }[v]); }, v); await pg.click('#brollbtn'); await pg.evaluate(() => { Math.random = window.__mr; }); }
const mark = (pg) => pg.evaluate(() => MMAUDIO.seLog().length);
const since = (pg, n) => pg.evaluate((n) => MMAUDIO.seLog().slice(n), n);
const count = (log, k) => log.filter((x) => x === k).length;

test('SE-B1：サイコロは1回の出目で DICE_THROW を1回だけ・能力マスは道具の音 → 能力UPの音（STAT_UP と重ねない）', { skip: SKIP }, async () => {
  const p = await open(); const pg = p.page; await toField(pg);
  await place(pg, 'p1_1'); await idle(pg);
  const n = await mark(pg); await rollAs(pg, 1); await idle(pg);
  const log = await since(pg, n);
  assert.equal(count(log, 'DICE_THROW'), 1, `サイコロの音は1回（${log.join(' ')}）`);
  const reg = await pg.evaluate(() => MMAUDIO.registryOf('se'));
  for (const k of ['DICE_LAND', 'DICE_ROLL', 'DICE_STOP']) assert.ok(count(log, k) === 0 || reg[k].silent, `${k} は鳴らない（silent）`);   /* 着地・停止の出来事は残る（演出の合図）が音は DICE_THROW の完成 SE だけ */
  assert.equal(count(log, 'STAT_UP'), 0, 'STAT_UP と重ねない');
  const sounding = log.filter((k) => reg[k] && !reg[k].silent && /^DICE_/.test(k)); assert.deepEqual(sounding, ['DICE_THROW'], '実際に鳴るサイコロの音は1つ');
  const a = log.indexOf('TRAINING_ITEM_SPAWN'), b = log.indexOf('TRAINING_SUCCESS');
  assert.ok(a >= 0 && b > a && count(log, 'TRAINING_SUCCESS') === 1, `道具 → 能力UP の順に1回ずつ（${log.join(' ')}）`);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('SE-B2：宝箱は段階ごとに1つの音（normal＝TIER_1・rare＝TIER_2・special＝TIER_3）・CHEST_OPEN と重ねない・TIER_4 は鳴らない', { skip: SKIP }, async () => {
  const p = await open(); const pg = p.page; await toField(pg);
  for (const [tier, key] of [['normal', 'TREASURE_TIER_1'], ['rare', 'TREASURE_TIER_2'], ['special', 'TREASURE_TIER_3']]) {
    await pg.evaluate((tier) => { const A = S.m.raise.field.nodeAssignments; A.p2_0.tier = tier; S.m.raise.field.openedTreasures = []; save(); }, tier);
    await place(pg, 'p1_6'); await idle(pg);
    const n = await mark(pg); await rollAs(pg, 1); await idle(pg);
    const log = await since(pg, n), tiers = log.filter((x) => /^TREASURE_TIER_|^CHEST_OPEN$/.test(x));
    assert.deepEqual(tiers, [key], `${tier}（${log.join(' ')}）`);
  }
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('SE-B3：遭遇の音は野生・レア・ライバルで別々（1つずつ）', { skip: SKIP }, async () => {
  const p = await open(); const pg = p.page; await toField(pg);
  const got = {};
  for (const kind of ['wild', 'rare', 'rival']) {
    const [from, to] = await pg.evaluate((kind) => {
      const g = MMCH.graphFor(S.m);
      if (kind === 'rival') { const id = g.order.find((x) => g.nodes[x].kind === 'rival'); return [g.order[g.order.indexOf(id) - 1], id]; }
      S.m.raise.field.nodeAssignments.p4_2.bt = kind; save(); return ['p4_1', 'p4_2'];
    }, kind);
    await place(pg, from); await idle(pg);
    const n = await mark(pg); await rollAs(pg, 1);
    await pg.waitForSelector('.chbat', { timeout: 20000 }); await pg.waitForTimeout(200);
    assert.equal(await pg.evaluate(() => S.m.raise.node), to);
    got[kind] = (await since(pg, n)).filter((x) => /^(WILD_ALERT|RARE_ALERT|RIVAL_APPEAR)$/.test(x));
    await pg.evaluate(() => { S.m.raise.pend = null; save(); });
  }
  assert.deepEqual(got, { wild: ['WILD_ALERT'], rare: ['RARE_ALERT'], rival: ['RIVAL_APPEAR'] });
  assert.deepEqual(p.errors, []);
});

test('SE-B4：市場：購入できなかったときは購入の音を鳴らさない・成立したら1回', { skip: SKIP }, async () => {
  const p = await open(); const pg = p.page; await H.newGame(pg, 'テスト');
  const r = await pg.evaluate(() => {
    const m = mk(0); m.name = 'ソラ'; S.m = m; S.box = []; S.g = 0; save();
    let n = MMAUDIO.seLog().length; adopt(0, 'ア'); const fail = MMAUDIO.seLog().slice(n), failed = S.box.length === 0 && S.g === 0;
    S.g = 1000; save(); n = MMAUDIO.seLog().length; adopt(0, 'イ'); const ok = MMAUDIO.seLog().slice(n);
    return { failed, fail: fail.filter((x) => x === 'MARKET_PURCHASE').length, ok: ok.filter((x) => x === 'MARKET_PURCHASE').length, g: S.g };
  });
  assert.ok(r.failed, '所持金 0G では買えない'); assert.equal(r.fail, 0, '失敗では鳴らさない');
  assert.equal(r.g, 500, '購入が成立した'); assert.equal(r.ok, 1, '成立で1回');
  await H.finishTalk(pg).catch(() => {});
  assert.deepEqual(p.errors, []);
});

test('SE-B5：正式音源（管理局の BGM と SE 15種・開始の音）がすべて 200 で読める（プロローグの BGM は 2026-10-06 に削除）', { skip: SKIP }, async () => {
  const p = await open(); const pg = p.page;
  const res = await pg.evaluate(async () => {
    const srcs = new Set(), add = (v) => { for (const s of (v && v.srcs) || []) if (/mystic_monsters_official/.test(s)) srcs.add(s); };
    for (const v of Object.values(MMAUDIO.registryOf('bgm'))) add(v); for (const v of Object.values(MMAUDIO.registryOf('se'))) add(v);
    const out = []; for (const s of srcs) { const r = await fetch(s); out.push([s, r.status, (await r.arrayBuffer()).byteLength]); } return out;
  });
  assert.equal(res.length, 17, `正式音源 17 ファイル（BGM 1＝管理局・SE 15・開始の音 1。2026-10-06：プロローグの BGM は削除）：${res.length}`);
  assert.ok(!res.some(([s]) => /prologue_bgm/.test(s)), 'プロローグの BGM は登録しない');
  for (const [s, st, n] of res) { assert.equal(st, 200, s); assert.ok(n > 1000, s); }
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
