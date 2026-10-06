// =========================================================
// QA（実ブラウザ）：2026-10-06 本体修正＋大会UI統合＋技アニメ実装＋バトル演出強化
//  TB-B1（4サイズ）：大会1 対戦表 → 大会2 対戦前比較 → 大会3 VS 演出 → バトル（fight() の導入は出さない）。はみ出さない・ページが伸びない
//  TB-B2：8体（ランクC）の対戦表
//  ST-B1：バトルの共通演出＝ダメージの表示は当たったあと（0.72秒より遅い）・次のターンまで余韻・攻撃中はルーレットを引っ込める
//  MD-B1：技管理の技の詳細 →「技の演出を見る」→ 技辞典（正式の資料）
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

async function toTournament(pg, rank = 0, sp = 0) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate((sp) => { const m = mk(sp); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); board(); }, sp);
  await pg.waitForSelector('#chrcv .rcv-row', { timeout: 20000 });
  await pg.evaluate((rank) => { if (rank > 1) { S.m.raise.ch = 2; MMP7.recordRankClear(S, S.m, rank - 1); } const r = MMP8.startTournament(S, S.m, rank, 7); if (!r.ok) throw new Error('startTournament'); save(); board(); }, rank);
  await pg.waitForSelector('.tb1 .tbgo', { timeout: 15000 }); await pg.waitForTimeout(600);
}

for (const size of [H.SIZES.base, H.SIZES.se, H.SIZES.android, [414, 896]]) {
  test(`TB-B1（${size.join('×')}）：大会1 → 大会2 → 大会3 → バトル`, { skip: SKIP, timeout: 120000 }, async () => {
    const p = await openPage({ size, tourvs: true }); const pg = p.page;
    await toTournament(pg, 0);
    const b1 = await pg.evaluate(() => { const a = document.querySelector('#app>.p9tour.tb1'); const r = (s) => [...document.querySelectorAll(s)];
      return { sw: document.documentElement.scrollWidth, W: innerWidth, sh: a.scrollHeight, ch: a.clientHeight, rows: r('.tb1g .tbnm').length, heads: r('.tb1g .tbic.hd').length,
        next: r('.tb1g .tbc.c-next').length, pend: r('.tb1g .tbc.c-pending').length, nx: r('.tb1g .tbnm.nx').length, me: r('.tb1g .tbnm.me').length, sub: document.querySelector('.tbsub b').textContent,
        myName: document.querySelector('.tbnx .tp2p.me .tp2nm b').textContent, imgs: r('.tb1 img').every((i) => i.complete && i.naturalWidth > 0) }; });
    assert.deepEqual([b1.rows, b1.heads, b1.next, b1.pend, b1.nx, b1.me], [6, 6, 2, 28, 1, 1], `6体の対戦表：次の試合2マス・未対戦28マス・次の相手が光る ${JSON.stringify(b1)}`);
    assert.equal(b1.sub, '第1試合 / 全5試合'); assert.equal(b1.myName, 'ソラ'); assert.ok(b1.imgs, '素材が読み込まれている');
    assert.ok(b1.sw <= b1.W + 1 && b1.sh <= b1.ch + 1, `大会1：はみ出さない・スクロールしない ${JSON.stringify(b1)}`);
    await pg.click('.tb1 .tbgo'); await pg.waitForSelector('.tb2 .pcgo'); await pg.waitForTimeout(600);
    const b2 = await pg.evaluate(() => { const a = document.querySelector('.p9cmps'), last = a.querySelector('.pcacts').getBoundingClientRect();
      return { sw: document.documentElement.scrollWidth, W: innerWidth, bottom: last.bottom, H: innerHeight, bars: [...document.querySelectorAll('.tb2 .pcg')].map((g) => [g.querySelector('.pcl').textContent, ...[...g.querySelectorAll('.pcb i')].map((i) => parseFloat(i.style.width))]),
        names: [...document.querySelectorAll('.tb2 .pcs b')].map((b) => b.textContent), skills: [...document.querySelectorAll('.tb2 .tbskp b')].map((b) => b.textContent), hd: document.querySelector('.tb2 .pchd').textContent,
        btns: document.querySelectorAll('.p9cmps button').length }; });
    assert.equal(b2.hd, '第1試合 / 全5試合'); assert.equal(b2.names[0], 'ソラ'); assert.equal(b2.skills[0], '逆境のひと踏ん張り'); assert.equal(b2.btns, 2);
    assert.deepEqual(b2.bars.map((r) => r[0]), ['ライフ', 'ちから', 'かしこさ', '命中', '回避', '丈夫さ']); assert.equal(b2.bars[0][1], Math.round(100 / 999 * 100));
    assert.ok(b2.sw <= b2.W + 1 && b2.bottom <= b2.H + 1, `大会2：はみ出さない ${JSON.stringify(b2)}`);
    await pg.click('.pcback'); await pg.waitForSelector('.tb1 .tbgo'); await pg.waitForTimeout(500);
    await pg.click('.tb1 .tbgo'); await pg.waitForSelector('.tb2 .pcgo'); await pg.waitForTimeout(500);
    await pg.click('.pcgo'); await pg.waitForTimeout(150); assert.equal(await pg.evaluate(() => !!document.getElementById('tvs')), false, '1回目では始まらない（2度押し）');
    await pg.waitForTimeout(450); await pg.click('.pcgo');
    await pg.waitForSelector('#tvs'); await pg.waitForTimeout(1100);
    const b3 = await pg.evaluate(() => ({ names: [...document.querySelectorAll('#tvs .tvsnp b')].map((b) => b.textContent), logo: !!document.querySelector('#tvs .tvslogo'), battle: S.m.raise.battle }));
    assert.equal(b3.names[1], 'ソラ'); assert.ok(b3.logo); assert.equal(b3.battle, null, '大会3の間はまだバトルを始めない');
    await pg.waitForSelector('#bt', { timeout: 8000 }); await pg.waitForTimeout(700);
    assert.deepEqual(await pg.evaluate(() => ({ kind: S.m.raise.battle && S.m.raise.battle.kind, intro: !!document.querySelector('#bt .intro'), tvs: !!document.getElementById('tvs') })), { kind: 'league', intro: false, tvs: false }, 'fight() の導入（CHALLENGER／VS）は出さない・大会3は片付く');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('TB-B2：8体（ランクC）の対戦表＝8行・次の試合2マス・未対戦54マス', { skip: SKIP, timeout: 90000 }, async () => {
  const p = await openPage({ size: H.SIZES.base }); const pg = p.page;
  await toTournament(pg, 2);
  const r = await pg.evaluate(() => ({ rows: document.querySelectorAll('.tb1g.n8 .tbnm').length, next: document.querySelectorAll('.tb1g .tbc.c-next').length, pend: document.querySelectorAll('.tb1g .tbc.c-pending').length, sub: document.querySelector('.tbsub b').textContent }));
  assert.deepEqual(r, { rows: 8, next: 2, pend: 54, sub: '第1試合 / 全7試合' });
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('ST-B1：バトルの共通演出：ダメージの表示は 0.72秒より遅く（当たったあと）・次のターンの帯まで余韻・攻撃中はルーレットを引っ込める', { skip: SKIP, timeout: 150000 }, async () => {
  const p = await openPage({ size: H.SIZES.base, stage: true }); const pg = p.page;
  await toTournament(pg, 0, 1);
  await pg.evaluate(() => { S.m.eq = [14, 15, 16, 17, 18, 19]; S.m.sk = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19]; save(); p8TourFight(); });
  await pg.waitForSelector('#bt', { timeout: 15000 });
  await pg.evaluate(() => { window.__ev = []; const o = window.anim; window.anim = function (k, s) { window.__ev.push(['anim', performance.now(), k, s, !!document.querySelector('.bui.anim')]); return o.apply(this, arguments); };
    new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType !== 1) return; if (n.classList.contains('dmg')) window.__ev.push(['pop', performance.now(), n.textContent]); if (n.id === 'ban') window.__ev.push(['ban', performance.now(), n.textContent, !!document.querySelector('.bui.anim')]); }))).observe(document.getElementById('bt'), { childList: true, subtree: true }); });
  let got = null;
  for (let i = 0; i < 60 && !got; i++) {
    if (await pg.evaluate(() => { const g = document.getElementById('go'); return !!g && !g.disabled; })) await pg.click('#go').catch(() => {});
    await pg.waitForTimeout(500);
    got = await pg.evaluate(() => { const E = window.__ev; for (let j = 0; j < E.length; j++) { if (E[j][0] !== 'anim' || E[j][3] !== 0) continue; const pop = E.slice(j + 1).find((e) => e[0] === 'pop'), ban = E.slice(j + 1).find((e) => e[0] === 'ban' && /ターン/.test(e[2])); if (pop && ban) return { k: E[j][2], dmg: pop[1] - E[j][1], next: ban[1] - E[j][1] }; } return null; });
    if (!(await pg.$('#bt'))) break;
  }
  assert.ok(got, 'プレイヤーの技が1回出た');
  assert.ok(got.dmg > 900, `ダメージの表示は当たったあと（強技・必殺級）：${JSON.stringify(got)}`);
  assert.ok(got.next > 1700, `次のターンの帯まで余韻（従来の 1.5秒より長い＝強技 約2.0秒・必殺級 約2.6秒）：${JSON.stringify(got)}`);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('MD-B1：技管理の技の詳細 →「技の演出を見る」→ 技辞典（ほしのまもりの正式の資料）→ 一覧で切り替え → 閉じる', { skip: SKIP, timeout: 90000 }, async () => {
  const p = await openPage({ size: H.SIZES.base }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.sk = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; S.m = m; save(); hall('w'); });
  await pg.waitForTimeout(400); await pg.evaluate(() => skd(7)); await pg.waitForSelector('#dsh .dmvdex');
  assert.match(await pg.textContent('#dsh .dcat'), /補助/);
  await pg.click('#dsh .dmvdex'); await pg.waitForSelector('#mvdx .mvfig img');
  await pg.waitForFunction(() => { const i = document.querySelector('#mvdx .mvfig img'); return i && i.complete && i.naturalWidth > 0; });
  assert.match(await pg.getAttribute('#mvdx .mvfig img', 'src'), /assets\/moves\/solamo\/05_hoshi_no_mamori\.webp$/);
  assert.match(await pg.textContent('#mvdx .mvinfo'), /ほしのまもり/);
  await pg.click('#mvdx .mvl button[data-i="9"]');
  assert.match(await pg.getAttribute('#mvdx .mvfig img', 'src'), /10_star_fall\.webp$/); assert.match(await pg.textContent('#mvdx .mvinfo'), /威力140/);
  await pg.click('#mvdx .mvx'); assert.equal(await pg.$('#mvdx'), null);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
