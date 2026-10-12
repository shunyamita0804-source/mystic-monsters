// =========================================================
// 2026-10-12 公式ランク戦の BGM（実ブラウザ）
//  BG-B1：ランク E の大会＝対戦表（TOURNAMENT_LOBBY_LOW）→ 比較 → 実戦（「FIGHT!」のあと TOURNAMENT_BATTLE_LOW＝licensed_20261012/official_rank_battle.ogg）
//         → 決着 → 対戦表へ戻る（対戦表の曲）→ 次の試合も同じ新しい曲 → 全5試合のあと結果（RESULT＝Royal Castle）。どの時点でも鳴っている <audio> は1本だけ
//  BG-B2：ランク S の大会の実戦＝TOURNAMENT_BATTLE_HIGH（fallback で同じ新しい曲）
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
const openPage = async (o) => { const p = await L.open(o); OPEN.push(p); return p; };
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close().catch(() => {}); });

async function toTournament(pg, rank) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; Object.assign(m, { li: 999, po: 999, in: 999, hi: 999, ev: 999, de: 999 }); MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); board(); });
  await pg.waitForSelector('#chrcv .rcv-row', { timeout: 20000 });
  await pg.evaluate((rank) => { if (rank > 1) { S.m.raise.ch = 4; MMP7.recordRankClear(S, S.m, rank - 1); } const r = MMP8.startTournament(S, S.m, rank, 7); if (!r.ok) throw new Error('startTournament ' + JSON.stringify(r)); save(); board(); }, rank);
  await pg.waitForSelector('.tb1 .tbgo', { timeout: 15000 });
}
/** 鳴っている BGM（<audio> の場面と src・同時に鳴っている本数） */
const bgm = (pg) => pg.evaluate(() => { const s = MMAUDIO.status(), act = s.slots.filter((x) => x.active && !x.paused); return { scene: s.scene, n: act.length, src: act.map((x) => x.src).join(','), source: s.source }; });
async function waitBgm(pg, re, ms = 12000) {
  const t0 = Date.now(); let b;
  while (Date.now() - t0 < ms) { b = await bgm(pg); if (re.test(b.src) && b.n === 1) return b; await pg.waitForTimeout(200); }
  return b;
}
/** 今の試合を勝って対戦表（または結果）へ戻る。戦闘中の曲を返す */
async function winFight(pg) {
  await pg.click('.tb1 .tbgo'); await pg.waitForSelector('.p9cmps .pcgo'); await pg.waitForTimeout(450);
  await pg.click('.pcgo'); await pg.waitForTimeout(450); await pg.click('.pcgo');
  await pg.waitForSelector('#bt', { timeout: 10000 });
  const inBattle = await waitBgm(pg, /official_rank_battle/);
  for (let i = 0; i < 200; i++) {
    const s = await pg.evaluate(() => { const g = document.getElementById('go'); return { bt: !!document.getElementById('bt'), back: !!g && g.classList.contains('bk'), can: !!g && !g.disabled }; });
    if (!s.bt) break;
    if (s.back) { await pg.click('#go'); await pg.waitForTimeout(600); continue; }
    if (s.can) await pg.click('#go').catch(() => {});
    await pg.waitForTimeout(350);
  }
  return inBattle;
}

test('BG-B1：ランク E＝対戦表 → 実戦は新しい公式ランク戦の曲 → 対戦表 → 次の試合 → 結果（いつも1本）', { skip: SKIP, timeout: 600000 }, async () => {
  const p = await openPage({ size: H.SIZES.base }); const pg = p.page;
  await toTournament(pg, 0);
  const lobby = await waitBgm(pg, /08_tournament_table/);
  assert.equal(lobby.n, 1, `対戦表の曲 ${JSON.stringify(lobby)}`); assert.match(lobby.src, /08_tournament_table/);
  for (let k = 0; k < 5; k++) {
    const b = await winFight(pg);
    assert.equal(b.scene, 'TOURNAMENT_BATTLE_LOW', `第${k + 1}試合の場面`); assert.equal(b.n, 1, '1本だけ'); assert.match(b.src, /licensed_20261012\/official_rank_battle\.ogg/, `第${k + 1}試合`);
    const done = await pg.evaluate(() => S.m.raise.tour && S.m.raise.tour.status);
    if (done !== 'league') break;
    await pg.waitForSelector('.tb1 .tbgo', { timeout: 15000 });
    const back = await waitBgm(pg, /08_tournament_table/);
    assert.equal(back.n, 1); assert.match(back.src, /08_tournament_table/, `第${k + 1}試合のあとは対戦表の曲`);
  }
  await pg.waitForSelector('.p9tour.p9end', { timeout: 20000 });
  const res = await waitBgm(pg, /03_royal_castle/);
  assert.equal(res.n, 1, `結果 ${JSON.stringify(res)}`); assert.match(res.src, /03_royal_castle/, '結果は従来の Royal Castle');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('BG-B2：ランク S の実戦＝TOURNAMENT_BATTLE_HIGH（同じ新しい曲・1本）', { skip: SKIP, timeout: 300000 }, async () => {
  const p = await openPage({ size: H.SIZES.base }); const pg = p.page;
  await toTournament(pg, 5);
  const b = await winFight(pg);
  assert.equal(b.scene, 'TOURNAMENT_BATTLE_HIGH'); assert.equal(b.n, 1); assert.match(b.src, /licensed_20261012\/official_rank_battle\.ogg/);
  await pg.waitForSelector('.tb1 .tbgo', { timeout: 15000 });
  const back = await waitBgm(pg, /08_tournament_table/); assert.equal(back.n, 1); assert.match(back.src, /08_tournament_table/);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
