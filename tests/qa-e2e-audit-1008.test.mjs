// =========================================================
// QA（実ブラウザ）：2026-10-08 深層監査（64c6f5a）の修正・第1便
//  AF-B1 H-05：登録・市場で記号の名前（< > " ' など）→ 正規化して保存 → 実際の fight() が止まらない（救済の画面なし）。
//        セーブコードの「"><img src=x onerror=…>」も読み込みで正規化 → バトルでスクリプトが動かない
//  AF-B2 H-06：技管理（hall('w')）の6枠の技名が見える（span.rn が行の中・濃紺の帯にならない）。4サイズ
//  AF-B3 M-03：決着（WIN!／LOSE）の画面で閉じて再読み込み → 試合の内容（残りライフ%・与えたダメージ・命中回数）が実際の値で記録される
//  AF-B4 M-01・M-02：大会の終わり＝最終順位 → 優勝のモンスターの勝利演出 → 初回報酬（帯）→ ランクアップ → セドリックの締め → 次の画面（ボタンはここで押せる）。
//        再読み込みしても帯・締めを流し直さない
//  AF-B5 TEST_MODE＝false（リリース）：街に「TEST 大会」が出ない・testTour() は何もしない
//  AF-B6 M-05：合体の子（実物の fuse()）も D の初回優勝で C 解放の昇格
//  Playwright / Chromium が無い環境では省略（skip）する。
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
const SHOTS = process.env.QA_SHOTS || '';
if (SHOTS) mkdirSync(SHOTS, { recursive: true });
let L = null;
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });
const OPEN = [];
const openPage = async (o) => { const p = await L.open(o); OPEN.push(p); p.dialogs = []; p.page.on('dialog', (d) => { p.dialogs.push(d.message()); d.dismiss().catch(() => {}); }); return p; };
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close().catch(() => {}); });
const shot = async (pg, name) => { if (SHOTS) await pg.screenshot({ path: path.join(SHOTS, name + '.png') }); };

const pressStop = async (pg) => { if (await pg.evaluate(() => { const g = document.getElementById('go'); return !!g && !g.disabled && !g.classList.contains('bk'); })) await pg.click('#go').catch(() => {}); };
/** 実際の fight() を決着（WIN!／LOSE＝もどるボタン）まで進める */
async function toDecision(pg) {
  await pg.waitForSelector('#bt', { timeout: 20000 });
  for (let i = 0; i < 600; i++) { if (await pg.evaluate(() => { const g = document.getElementById('go'); return !!g && g.classList.contains('bk'); })) return; await pressStop(pg); await pg.waitForTimeout(400); }
  throw new Error('決着しない');
}
/** 連れている子で Chapter 1 のゴール → ランク rank の大会を始める（画面は対戦表） */
const startTourJS = ({ rank, seed }) => { const m = S.m; MMP7.ensureProg(m); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true;
  if (!MMP8.startTournament(S, m, rank, seed).ok) throw new Error('tour'); save(); board(); };
/** 市場で中央のモンスターを名前を付けて購入（実物の購入シート＝mkgo） */
async function buy(pg, name) {
  await pg.evaluate(() => market()); await H.marketDetail(pg); await pg.waitForSelector('.p10buy:not([disabled])');
  await pg.click('.p10buy'); await pg.waitForSelector('#p10ov .p10ok');
  await pg.fill('#mnm', name);
  await pg.waitForFunction(() => { const b = document.querySelector('#p10ov .p10shb'); return b && b.dataset.tapt && performance.now() - Number(b.dataset.tapt) > 450; });
  await pg.click('#p10ov .p10ok'); await pg.waitForSelector('#app .map'); await pg.evaluate(() => MMNOTE.flush && MMNOTE.flush());
}

test('AF-B1：H-05 登録・市場の記号の名前 → 正規化 → 実際の fight() が止まらない。セーブコードの XSS の名前も読み込みで正規化＝バトルでスクリプトが動かない', { skip: SKIP, timeout: 300000 }, async () => {
  const p = await openPage({ size: H.SIZES.base }); const pg = p.page;
  await H.newGame(pg, '<b>ユウ</b>');
  assert.equal(await pg.evaluate(() => S.playerName), '＜b＞ユウ＜/b', 'プレイヤー名（8文字・記号は全角）');
  await buy(pg, '<!--');
  assert.equal(await pg.evaluate(() => S.m.name), '＜!--');
  await pg.evaluate(startTourJS, { rank: 0, seed: 7 }); await pg.waitForSelector('.tb1 .tbgo', { timeout: 20000 });
  await pg.evaluate(() => p8TourFight()); await pg.waitForSelector('#bt #go', { timeout: 20000 });
  await pg.waitForTimeout(800);
  const b = await pg.evaluate(() => ({ rescue: !!document.querySelector('#bt .rsq'), go: !!document.getElementById('go'), rl: !!document.getElementById('rl'), hud: [...document.querySelectorAll('#bt .hn1 b, #bt b')].map((e) => e.textContent).join('|') }));
  assert.equal(b.rescue, false, '「エラーでバトルが止まりました」は出ない'); assert.equal(b.go, true); assert.equal(b.rl, true, 'ルーレットが作られる');
  assert.ok(b.hud.includes('＜!--'), `HUD に名前が文字で出る：${b.hud}`);
  await toDecision(pg); await shot(pg, 'AF-B1-battle');
  await pg.click('#go'); await pg.waitForSelector('.tb1 .tbgo', { timeout: 20000 });
  assert.deepEqual(p.dialogs, []); assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  // セーブコード（共有ボタンで渡せる）に XSS の名前：街（育成前）で読み込む
  const town = await pg.evaluate(() => { const o = JSON.parse(JSON.stringify(S)); o.m.raise = MMP8.newRaise(); return o; });
  const q = await openPage({ size: H.SIZES.base, save: town }); const qg = q.page;
  await qg.click('[onclick*="startGame"]'); await qg.waitForSelector('#app .map', { timeout: 30000 });
  const code = await qg.evaluate(() => { const o = JSON.parse(JSON.stringify(S)); o.m.name = '"><img src=x onerror=alert(1)>'; o.box = [Object.assign(JSON.parse(JSON.stringify(o.m)), { uid: 'zz-1', name: "'><svg onload=alert(2)>" })]; return btoa(unescape(encodeURIComponent(JSON.stringify(o)))); });
  await qg.evaluate(() => savescr()); await qg.waitForSelector('#sc', { state: 'attached' });
  await qg.evaluate((c) => { document.getElementById('sc').value = c; imp(); }, code);
  await qg.waitForFunction(() => /ロードしました/.test((document.querySelector('#msg') || {}).textContent || ''));
  const nm = await qg.evaluate(() => [S.m.name, S.box[0].name, JSON.parse(localStorage.getItem('mr4v6')).m.name]);
  assert.deepEqual(nm, ['＂＞＜img s', '＇＞＜svg o', '＂＞＜img s'], '読み込みで正規化（保存も）');
  await qg.evaluate(startTourJS, { rank: 0, seed: 9 }); await qg.waitForSelector('.tb1 .tbgo', { timeout: 20000 });
  await qg.evaluate(() => p8TourFight()); await qg.waitForSelector('#bt #go', { timeout: 20000 }); await qg.waitForTimeout(1500);
  assert.equal(await qg.evaluate(() => !!document.querySelector('#bt .rsq')), false);
  assert.equal(await qg.evaluate(() => document.querySelectorAll('img[src="x"], svg[onload]').length), 0, '名前のタグは効かない');
  assert.deepEqual(q.dialogs, [], 'スクリプトは動かない');
  assert.deepEqual(q.errors, []); assert.deepEqual(q.bad, []);
});

test('AF-B2：H-06 技管理の6枠の技名が見える（4サイズ）。バトルのルーレットの技名（Phase 6）も従来どおり', { skip: SKIP, timeout: 300000 }, async () => {
  for (const [k, size] of Object.entries(H.SIZES)) {
    const p = await openPage({ size }); const pg = p.page;
    await H.newGame(pg, 'テスト'); await pg.evaluate(() => { S.m = mk(1); S.m.name = 'ガウ'; MMP7.ensureProg(S.m); save(); hall('w'); });
    await pg.waitForSelector('#app .rw .rn');
    const r = await pg.evaluate(() => [...document.querySelectorAll('#app .rw')].slice(0, 6).map((w) => { const n = w.querySelector('.rn'), a = n.getBoundingClientRect(), b = w.getBoundingClientRect(), cs = getComputedStyle(n);
      const st = w.querySelector('.rst').getBoundingClientRect(), mv = w.querySelector('.wmv').getBoundingClientRect();
      return { t: n.textContent, h: Math.round(a.height), inside: a.top >= b.top - 1 && a.bottom <= b.bottom + 1, minH: cs.minHeight, bg: cs.backgroundImage, crit: st.right <= mv.left + 1 }; }));
    await shot(pg, `AF-B2-skills-${k}`);
    assert.equal(r.length, 6, k);
    for (const x of r) { assert.ok(x.h < 40 && x.inside, `${k}：技名が行の中（${JSON.stringify(x)}）`); assert.equal(x.bg, 'none', `${k}：濃紺の帯にならない`); assert.ok(x.crit, `${k}：クリ率が ▲▼ に隠れない`); }
    assert.deepEqual(r.slice(0, 4).map((x) => x.t), ['つつく', 'ウィンド', 'スパイラルダイブ', 'ソニックムーブ'], `${k}：技名`);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
    await p.ctx.close();
  }
});

test('AF-B3：M-03 決着の画面で閉じて再読み込み → 試合の内容は実際の値（シード値の仮の値ではない）', { skip: SKIP, timeout: 300000 }, async () => {
  const p = await openPage({ size: H.SIZES.se }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { S.m = mk(0); S.m.name = 'ソラ'; save(); });
  await pg.evaluate(startTourJS, { rank: 0, seed: 21 }); await pg.waitForSelector('.tb1 .tbgo', { timeout: 20000 });
  await pg.evaluate(() => p8TourFight()); await toDecision(pg);
  const at = await pg.evaluate(() => ({ live: MMRULES.battleStats(), saved: JSON.parse(localStorage.getItem('mr4v6')).m.raise.battle }));
  assert.ok(at.saved && at.saved.done && at.saved.stats, '決着の時点で保存に試合の内容がある');
  assert.deepEqual(at.saved.stats.me, at.live.me); assert.deepEqual(at.saved.stats.opp, at.live.opp);
  // 「もどる」を押さずに閉じる → 再読み込み → つづきから
  await pg.reload(); await pg.waitForFunction(() => typeof S === 'object' && typeof MMP8 === 'object');
  await pg.click('[onclick*="startGame"]'); await pg.waitForFunction(() => S.m && S.m.raise && !S.m.raise.battle && S.m.raise.tour && S.m.raise.tour.league.round === 1, null, { timeout: 30000 });
  const st = await pg.evaluate(() => { const lg = S.m.raise.tour.league, mt = lg.rounds[0].find((x) => x.a === 0 || x.b === 0); return { st: mt.st, opp: mt.a === 0 ? mt.b : mt.a }; });
  assert.ok(st.st, '試合の内容が記録された');
  const pick = (x) => ({ life: Math.round(x.life), dmg: Math.round(x.dmg), hits: Math.round(x.hits) });
  assert.deepEqual(st.st[0], pick(at.live.me), '自分＝実際の値'); assert.deepEqual(st.st[st.opp], pick(at.live.opp), '相手＝実際の値');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('AF-B4：M-01・M-02 大会の終わりの正式の順（最終順位 → 優勝の勝利演出 → 初回報酬 → ランクアップ → セドリックの締め → 次）・再読み込みで流し直さない', { skip: SKIP, timeout: 300000 }, async () => {
  const p = await openPage({ size: H.SIZES.base, npc: true, tourfx: true }); const pg = p.page;
  await H.newGame(pg, 'テスト'); await H.finishTalk(pg);
  // Chapter 2 のゴールで D 大会 → API で5試合とも勝って決着（初回優勝・C 解放）→ 結果の画面
  await pg.evaluate(() => {
    const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; Object.assign(m.raise, { state: 'farm', ch: 2, log: [{ ch: 1, reachedGoal: true }] }); MMP8.depart(S, m, () => 0.3);
    Object.assign(m.raise, { node: MMP8.boardOf(m).goal, goal: true, pend: null }); if (m.raise.field) m.raise.field.arrivalSeen = true;
    if (!MMP8.startTournament(S, m, 1, 31).ok) throw new Error('D');
    while (m.raise.tour.status === 'league') { MMP8.beginBattle(S, m, { kind: 'league', rank: 1 }); S.wins = (S.wins || 0) + 1; MMP8.markBattleDone(S); MMP8.finishBattle(S, m); }
    window.__endLog = []; const t0 = performance.now();
    new MutationObserver(() => { const el = document.querySelector('.p9tour.p9end'); if (!el) return; for (const c of el.classList) if (/^e-/.test(c) && !__endLog.some((x) => x[0] === c)) __endLog.push([c, Math.round(performance.now() - t0)]); })
      .observe(document.getElementById('app'), { subtree: true, attributes: true, attributeFilter: ['class'], childList: true });
    save(); board();
  });
  await pg.waitForSelector('.p9tour.p9end', { timeout: 20000 });
  const first = await pg.evaluate(() => ({ dis: [...document.querySelectorAll('.p9endbtn')].map((b) => b.disabled), win: getComputedStyle(document.querySelector('.p9win')).display, ced: document.querySelectorAll('.p9ced').length }));
  assert.ok(first.dis.every(Boolean), '始まった直後は「次の画面」を押せない（L-02）'); assert.equal(first.win, 'none', '最終順位の前に「優勝！」を出さない'); assert.equal(first.ced, 0, 'セドリックの静的な一言は出さない（締めの会話と二重にしない）');
  await pg.waitForSelector('.mmtalk', { timeout: 20000 }); await shot(pg, 'AF-B4-cedric');
  assert.match(await pg.evaluate(() => document.querySelector('.mmtalk').textContent), /勝負あり！/);
  assert.ok(await pg.evaluate(() => [...document.querySelectorAll('.p9endbtn')].every((b) => b.disabled)), '締めの間も押せない');
  await H.finishTalk(pg);
  await pg.waitForFunction(() => [...document.querySelectorAll('.p9endbtn')].every((b) => !b.disabled), null, { timeout: 10000 });
  const log = await pg.evaluate(() => __endLog);
  const order = log.map((x) => x[0]).filter((x) => /^e-/.test(x));
  assert.deepEqual(order, ['e-final', 'e-champion', 'e-firstReward', 'e-rankUp', 'e-cedricEnd', 'e-next'], `順：${JSON.stringify(log)}`);
  assert.deepEqual(await pg.evaluate(() => MMNOTE.log().map((n) => n.title).filter((x) => /賞金/.test(x))), ['賞金 200G を手に入れた！'], '初回報酬の帯（1回）');
  const t = Object.fromEntries(log.map((x) => [x[0], x[1]]));
  assert.ok(t['e-final'] < t['e-champion'] && t['e-champion'] < t['e-firstReward'] && t['e-firstReward'] < t['e-rankUp'] && t['e-rankUp'] <= t['e-cedricEnd'] && t['e-cedricEnd'] < t['e-next'], JSON.stringify(log));
  assert.ok(t['e-champion'] - t['e-final'] >= 800, '最終順位を見せてから優勝'); assert.ok(t['e-firstReward'] - t['e-champion'] >= 1700, '勝利演出を見せてから報酬');
  assert.ok(t['e-rankUp'] - t['e-firstReward'] >= 2500, '報酬の帯を見せてからランクアップ');
  const saved = await pg.evaluate(() => JSON.parse(localStorage.getItem('mr4v6')).m.raise.tour.result);
  assert.deepEqual(saved.endSeen, ['final', 'champion', 'firstReward', 'rankUp', 'cedricEnd', 'next'], '始めた段階を保存'); assert.deepEqual(saved.reward.rankUp, { from: 1, to: 2, unlocked: 2 });
  await shot(pg, 'AF-B4-result');
  // 再読み込み → 結果の画面：帯・締めを流し直さない・最初から全部見えてボタンも押せる
  await pg.reload(); await pg.waitForFunction(() => typeof S === 'object' && typeof MMP8 === 'object');
    await pg.click('[onclick*="startGame"]'); await pg.waitForSelector('.p9tour.p9end', { timeout: 30000 }); await pg.waitForTimeout(3500);
  const re = await pg.evaluate(() => ({ cls: [...document.querySelector('.p9tour').classList].filter((c) => /^e-/.test(c)), dis: [...document.querySelectorAll('.p9endbtn')].map((b) => b.disabled), notes: MMNOTE.log().map((n) => n.title).filter((x) => /賞金/.test(x)), talk: !!document.querySelector('.mmtalk'), win: getComputedStyle(document.querySelector('.p9win')).display }));
  assert.deepEqual(re.cls, ['e-final', 'e-champion', 'e-firstReward', 'e-rankUp', 'e-cedricEnd', 'e-next']); assert.ok(re.dis.every((d) => !d), 'ボタンは押せる');
  assert.deepEqual(re.notes, [], '賞金の帯を流し直さない'); assert.equal(re.talk, false, 'セドリックの締めを流し直さない'); assert.notEqual(re.win, 'none');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('AF-B5：TEST_MODE＝false（リリース）：街に「TEST 大会」が出ない・testTour() は何もしない', { skip: SKIP, timeout: 200000 }, async () => {
  const p = await openPage({ size: H.SIZES.base }); const pg = p.page;
  let swapped = 0;
  await pg.route(/\/index\.html(\?.*)?$/, async (r) => { const res = await r.fetch(); let body = await res.text(); if (body.includes('\nconst TEST_MODE=true;')) { body = body.replace('\nconst TEST_MODE=true;', '\nconst TEST_MODE=false;'); swapped++; } await r.fulfill({ response: res, body }); });
  await pg.reload(); await pg.waitForFunction(() => typeof S === 'object' && typeof MMP8 === 'object');
  assert.equal(swapped, 1); assert.equal(await pg.evaluate(() => TEST_MODE), false);
  await H.newGame(pg, 'テスト'); await pg.evaluate(() => { S.m = mk(0); save(); lobby(); }); await pg.waitForSelector('#app .map');
  assert.equal(await pg.evaluate(() => document.querySelectorAll('.ttest').length), 0, '入口が出ない');
  const before = await pg.evaluate(() => JSON.stringify(S));
  await pg.evaluate(() => testTour()); await pg.waitForTimeout(300);
  assert.equal(await pg.evaluate(() => TEST_TOUR), null); assert.equal(await pg.evaluate(() => JSON.stringify(S)), before, 'testTour() は何もしない');
  assert.ok(await pg.evaluate(() => !!document.querySelector('#app .map')), '街のまま');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('AF-B6：M-05 合体の子（実物の fuse()）も正式なランク解放＝D の初回優勝で C 解放の昇格', { skip: SKIP, timeout: 200000 }, async () => {
  const p = await openPage({ size: H.SIZES.base }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  const r = await pg.evaluate(() => {
    const a = mk(0), b = mk(1); a.name = 'ソラ'; b.name = 'ガウ'; a.rk = 4; b.rk = 3; [a, b].forEach((x) => { MMP7.ensureProg(x); x.raise.state = 'done'; });
    S.m = a; S.box = [b]; S.g = 1000; sel = [0, 1]; save();
    return fuse().then(() => S.m);
  });
  const c = await pg.evaluate(() => ({ rk: S.m.rk, clr: S.m.prog.rankClr.filter(Boolean).length, el: MMP8.eligibleRanks(S.m, 2), name: S.m.name }));
  assert.equal(c.rk, 4, '旧 rk は継ぐ（互換）'); assert.equal(c.clr, 0, 'クリア実績は空'); assert.deepEqual(c.el, [0, 1], 'Chapter 2 で選べるのは D まで（継いだ rk では増えない）');
  const end = await pg.evaluate(() => { const m = S.m; Object.assign(m.raise, { state: 'farm', ch: 2, log: [{ ch: 1, reachedGoal: true }] }); MMP8.depart(S, m, () => 0.3);
    Object.assign(m.raise, { node: MMP8.boardOf(m).goal, goal: true, pend: null });
    if (!MMP8.startTournament(S, m, 1, 5).ok) throw new Error('D');
    while (m.raise.tour.status === 'league') { MMP8.beginBattle(S, m, { kind: 'league', rank: 1 }); S.wins = (S.wins || 0) + 1; MMP8.markBattleDone(S); MMP8.finishBattle(S, m); }
    return { up: m.raise.tour.result.reward.rankUp, el: MMP8.eligibleRanks(m, 3) }; });
  assert.deepEqual(end.up, { from: 1, to: 2, unlocked: 2 }, '合体の子でも D 優勝 → C 解放の昇格'); assert.deepEqual(end.el, [0, 1, 2]);
  void r;
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
