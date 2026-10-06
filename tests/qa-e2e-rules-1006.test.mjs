// =========================================================
// QA（実ブラウザ）：2026-10-06・5 大会・状態異常・固有スキルの正式仕様の差分（js/battle/rules.js）
//  RB-B1：大会の1試合目に勝っても「賞金」「ランクアップ」を出さない（バトルの結果の文・帯）。所持金・チケット・クリア実績も変わらない。試合の内容（順位の計算用）を記録
//  RB-B2：ねむりの相手は動けない（「ぐっすり眠っている…」・ダメージなし・MISS を出さない）・状態異常の札・ダメージで起きる
//  RB-B3：まひで動けない自分の番はルーレットがすぐ止まり「からだがしびれて動けない！」
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

async function toTournament(pg, rank = 0, sp = 0, tune = {}) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate(({ sp, tune }) => { const m = mk(sp); m.name = 'ソラ'; Object.assign(m, tune); MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); board(); }, { sp, tune });
  await pg.waitForSelector('#chrcv .rcv-row', { timeout: 20000 });
  await pg.evaluate((rank) => { const r = MMP8.startTournament(S, S.m, rank, 7); if (!r.ok) throw new Error('startTournament'); save(); board(); }, rank);
  await pg.waitForSelector('.tb1 .tbgo', { timeout: 15000 }); await pg.waitForTimeout(400);
}
const pressStop = async (pg) => { if (await pg.evaluate(() => { const g = document.getElementById('go'); return !!g && !g.disabled && !g.classList.contains('bk'); })) await pg.click('#go').catch(() => {}); };

test('RB-B1：大会の1試合目に勝っても「賞金」「ランクアップ」を出さない・所持金／チケット／実績は変わらない・試合の内容を記録', { skip: SKIP, timeout: 150000 }, async () => {
  const p = await openPage({ size: H.SIZES.base }); const pg = p.page;
  await toTournament(pg, 0, 0, { po: 999, in: 999, hi: 999, li: 999 });
  const before = await pg.evaluate(() => ({ g: S.g, tix: S.trainTix || 0, clr: [...S.m.prog.rankClr], rk: S.m.rk }));
  await pg.evaluate(() => { window.__msgs = []; p8TourFight(); });
  await pg.waitForSelector('#bt', { timeout: 15000 });
  await pg.evaluate(() => { const el = document.getElementById('msg'); new MutationObserver(() => window.__msgs.push(el.textContent)).observe(el, { childList: true, characterData: true, subtree: true }); });
  for (let i = 0; i < 120; i++) { if (await pg.evaluate(() => { const g = document.getElementById('go'); return !!g && g.classList.contains('bk'); })) break; await pressStop(pg); await pg.waitForTimeout(500); }
  await pg.waitForTimeout(300);
  const end = await pg.evaluate(() => ({ msg: document.getElementById('msg').textContent, ban: (document.getElementById('ban') || {}).textContent, all: window.__msgs.join('|') }));
  assert.match(end.msg, /^勝利！/, `勝った ${end.msg}`);
  assert.doesNotMatch(end.msg, /賞金|ランクアップ/, '1試合の結果の文に賞金・ランクアップを出さない');
  assert.doesNotMatch(end.all.split('|').filter((t) => /^勝利/.test(t)).join('|'), /賞金|ランクアップ/, '一瞬も出さない（書き換えは描画の前）');
  await pg.click('#go');
  await pg.waitForSelector('.tb1 .tbgo', { timeout: 15000 }); await pg.waitForTimeout(800);
  const after = await pg.evaluate(() => { const lg = S.m.raise.tour.league; const mt = lg.rounds[0].find((x) => x.a === 0 || x.b === 0);
    return { g: S.g, tix: S.trainTix || 0, clr: [...S.m.prog.rankClr], rk: S.m.rk, round: lg.round, status: S.m.raise.tour.status, st: mt.st ? mt.st[0] : null, note: [...document.querySelectorAll('.mmnote')].map((n) => n.textContent).join('|'), tmsg: (document.querySelector('.p9tmsg') || {}).textContent || '' }; });
  assert.deepEqual([after.g, after.tix, after.clr, after.rk], [before.g, before.tix, before.clr, before.rk], '1試合では報酬・ランクアップなし');
  assert.deepEqual([after.round, after.status], [1, 'league']);
  assert.doesNotMatch(after.note + after.tmsg, /賞金|ランクアップ/);
  assert.ok(after.st && after.st.life > 0 && after.st.dmg > 0 && after.st.hits > 0, `試合の内容（残りライフ%・ダメージ・命中回数）${JSON.stringify(after.st)}`);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

async function longBattle(pg) {
  await toTournament(pg, 0, 0, { li: 999, po: 1, in: 1, hi: 999, de: 999 });
  await pg.evaluate(() => { S.m.eq = [3, 7, 3, 7, 3, 7]; save(); p8TourFight(); });   // 威力のない補助技だけ＝バトルが終わらない
  await pg.waitForSelector('#bt', { timeout: 15000 });
  for (let i = 0; i < 60; i++) { if (await pg.evaluate(() => !!MMRULES.current())) break; await pressStop(pg); await pg.waitForTimeout(400); }
  assert.ok(await pg.evaluate(() => !!MMRULES.current()), 'バトルが始まった');
}

test('RB-B2：ねむりの相手は動けない（ぐっすり眠っている…・ダメージなし・MISS を出さない）・状態異常の札', { skip: SKIP, timeout: 150000 }, async () => {
  const p = await openPage({ size: H.SIZES.base }); const pg = p.page;
  await longBattle(pg);
  await pg.evaluate(() => { const s = MMRULES.current(); const st = MMRULES.stateOf(s); MMRULES.applyAilment(st, 'B', 'sleep'); MMRULES.drawAil(); window.__lifeA = s.currentLife.A; window.__msgs = []; window.__miss = 0;
    const el = document.getElementById('msg'); new MutationObserver(() => window.__msgs.push(el.textContent)).observe(el, { childList: true, characterData: true, subtree: true });
    new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1 && n.classList.contains('ms') && n.parentNode && n.parentNode.id === 'f0') window.__miss++; }))).observe(document.getElementById('bt'), { childList: true, subtree: true }); });
  assert.match(await pg.evaluate(() => document.getElementById('mmail1').textContent), /ねむり2/, '札');
  let r = null;
  for (let i = 0; i < 80 && !r; i++) { await pressStop(pg); await pg.waitForTimeout(400); r = await pg.evaluate(() => window.__msgs.find((t) => /ぐっすり眠っている/.test(t)) || null); }
  assert.ok(r, '相手の番は「ぐっすり眠っている…」');
  await pg.waitForTimeout(1500);
  const s = await pg.evaluate(() => ({ life: MMRULES.current().currentLife.A, before: window.__lifeA, miss: window.__miss, sleep: MMRULES.stateOf(MMRULES.current()).ail.B.sleep, msgs: window.__msgs.filter((t) => /「/.test(t) && /^ランク/.test(t)) }));
  assert.equal(s.life, s.before, '眠っている相手はダメージを与えない');
  assert.equal(s.miss, 0, '動けない行動の MISS は出さない');
  assert.equal(s.sleep, 1, '1回の機会を失った');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('RB-B3：まひで動けない自分の番はルーレットがすぐ止まり「からだがしびれて動けない！」', { skip: SKIP, timeout: 150000 }, async () => {
  const p = await openPage({ size: H.SIZES.base }); const pg = p.page;
  await longBattle(pg);
  await pg.evaluate(() => { const st = MMRULES.stateOf(MMRULES.current()); MMRULES.applyAilment(st, 'A', 'paralysis'); MMRULES.drawAil(); window.__msgs = []; const R = Math.random; window.__rand = R;
    Math.random = function () { return new Error().stack.includes('opportunity') ? 0 : R.apply(this, arguments); };   // 必ず失敗の側（25% 未満）
    const el = document.getElementById('msg'); new MutationObserver(() => window.__msgs.push(el.textContent)).observe(el, { childList: true, characterData: true, subtree: true }); });
  assert.match(await pg.evaluate(() => document.getElementById('mmail0').textContent), /まひ3/);
  let r = null;
  for (let i = 0; i < 60 && !r; i++) { await pg.waitForTimeout(400); r = await pg.evaluate(() => window.__msgs.find((t) => /からだがしびれて動けない/.test(t)) || null); }   // STOP を押さなくても止まる
  assert.ok(r, '自分の番は動けない');
  assert.equal(await pg.evaluate(() => MMRULES.stateOf(MMRULES.current()).ail.A.paralysis), 2, '1回の機会を使った');
  await pg.evaluate(() => { Math.random = window.__rand; });
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
