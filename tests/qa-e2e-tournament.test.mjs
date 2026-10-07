// =========================================================
// QA（実ブラウザ）：第二段階 PHASE D（2026-10-04）：公式大会の流れ＝ランク選択 → 大会進行（現在の成績・次の対戦相手）→ パラメーター比較（ゲージ）→ 対戦開始（2度押し）→ fight()
//  TN-B1：390×844・375×667。横にはみ出さない・比較の画面はページが伸びない
//  Playwright / Chromium が無い環境では省略（skip）する。
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
const openPage = async (o) => { const p = await L.open(o); OPEN.push(p); return p; };
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close().catch(() => {}); });
const SHOT = path.join(os.tmpdir(), 'mm-tournament');
const fit = (pg) => pg.evaluate(() => ({ sw: document.documentElement.scrollWidth, W: innerWidth, sh: document.scrollingElement.scrollHeight, H: innerHeight }));

for (const size of [H.SIZES.base, H.SIZES.se]) {
  test(`TN-B1（${size.join('×')}）：ゴール → 受付（E・D が参加可能）→ 大会進行（第1戦が「次の試合」・次の対戦相手）→ 対戦開始 → パラメーター比較（6能力の数値と棒）→ 順位表にもどる → 対戦開始（2度押し）→ fight()`, { skip: SKIP }, async () => {
    const p = await openPage({ size }); const pg = p.page; mkdirSync(SHOT, { recursive: true });
    await H.newGame(pg, 'テスト');
    await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); board(); });
    await pg.waitForSelector('#chrcv .rcv-row', { timeout: 20000 });
    assert.deepEqual(await pg.evaluate(() => [...document.querySelectorAll('.rcv-row')].map((r) => [r.dataset.rank, r.classList.contains('ok')])), [['5', false], ['4', false], ['3', false], ['2', false], ['1', true], ['0', true]], 'Chapter 1：E・D が参加可能、C〜S は参加不可');
    await pg.evaluate(() => { MMP8.startTournament(S, S.m, 0, 7); save(); board(); });
    await pg.waitForSelector('.p9tour.tp2 .p9next .p9go', { timeout: 15000 }); await pg.waitForTimeout(400);
    const t1 = await pg.evaluate(() => ({ rows: document.querySelectorAll('.tb1g .tbnm').length, no: !!document.querySelector('.tbsub'), me: document.querySelector('.tb1g .tbnm.me b').textContent, op: !!document.querySelector('.tb1g .tbnm.nx b').textContent, ced: !!document.querySelector('.p9ced'), next: document.querySelectorAll('.tb1g .tbc.c-next').length }));
    assert.deepEqual(t1, { rows: 6, no: false, me: 'ソラ', op: true, ced: false, next: 2 }, '2026-10-07 ADDENDUM2：大会1 対戦表（試合数・セドリックなし）');
    let f = await fit(pg); assert.ok(f.sw <= f.W + 1, `大会進行：横にはみ出さない ${JSON.stringify(f)}`);
    await pg.screenshot({ path: path.join(SHOT, `${size[0]}_progress.png`) });
    await pg.click('.p9next .p9go'); await pg.waitForSelector('.p9cmps .pcgo'); await pg.waitForTimeout(600);
    const c = await pg.evaluate(() => ({ g: [...document.querySelectorAll('.pcgs .pcg')].map((r) => [r.querySelector('.pcl').textContent, ...[...r.querySelectorAll('.pcb i')].map((x) => parseFloat(x.style.width))]), digits: /\d/.test(document.querySelector('.pcgs').textContent), hd: !!document.querySelector('.pchd'), names: [...document.querySelectorAll('.pcs b')].map((b) => b.textContent), imgs: [...document.querySelectorAll('.pcs .tbmon img')].map((i) => i.getAttribute('src')), battle: S.m.raise.battle }));
    // 2026-10-07 刷新：能力は数値と棒（左右で比べる＝棒は2体のうち大きいほう（最低100）の 1.08倍を満タンにした長さ）・左右に待機の立ち絵
    const opp = await pg.evaluate(() => MMP8L.PROVISIONAL_OPPONENT_STAT[0]), mx = Math.max(100, opp, 100) * 1.08, pc = (v) => Math.round(v / mx * 100);
    assert.deepEqual(c.g, [['ライフ', pc(100), pc(opp)], ['ちから', pc(100), pc(opp)], ['かしこさ', pc(100), pc(opp)], ['命中', pc(100), pc(opp)], ['回避', pc(100), pc(opp)], ['丈夫さ', pc(100), pc(opp)]], '棒の長さ');
    assert.equal(c.digits, true, '数値を出す'); assert.equal(c.hd, false, '試合数は出さない'); assert.equal(c.names[0], 'ソラ'); assert.match(c.imgs[0], /assets\/battle\/idle\/idle_soramo\.webp$/); assert.equal(c.battle, null);
    f = await fit(pg); assert.ok(f.sw <= f.W + 1 && f.sh <= f.H + 1, `比較：はみ出さない・ページは伸びない ${JSON.stringify(f)}`);
    await pg.screenshot({ path: path.join(SHOT, `${size[0]}_compare.png`) });
    await pg.click('.pcback'); await pg.waitForSelector('.p9tour.tp2 .p9next .p9go'); await pg.waitForTimeout(400);
    await pg.click('.p9next .p9go'); await pg.waitForSelector('.p9cmps .pcgo'); await pg.waitForTimeout(500);
    await pg.click('.pcgo'); await pg.waitForTimeout(120); assert.equal(await pg.evaluate(() => S.m.raise.battle), null, '1回目では始まらない（2度押し）');
    await pg.waitForTimeout(500); await pg.click('.pcgo');
    await pg.waitForSelector('#bt', { timeout: 15000 }); await pg.waitForTimeout(500);
    assert.deepEqual(await pg.evaluate(() => ({ kind: S.m.raise.battle && S.m.raise.battle.kind, intro: !!document.querySelector('#bt .intro'), labels: [...document.querySelectorAll('#bt .intro .inm small')].map((s) => s.textContent) })), { kind: 'league', intro: true, labels: ['YOUR MONSTER', 'CHALLENGER'] }, 'fight() の導入（VS）が自動で始まる');
    await pg.screenshot({ path: path.join(SHOT, `${size[0]}_vs.png`) });
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}
