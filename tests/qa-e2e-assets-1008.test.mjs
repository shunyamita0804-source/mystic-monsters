// =========================================================
// 2026-10-08 次便：正式素材の統合（実ブラウザのスポット確認）
//  AS8-B1：セドリックの大会前の導入＝E と B で正式の実況席 booth_X（ランク別・画面の幅に合わせる）→ 対戦表
//  AS8-B2：大会3 VS＝専用勝負絵（相手は反転）→ バトル（VS は1回だけ）
//  AS8-B3：ランク昇格 Final＝D→C の4枚が読み込まれて重なり、自動で閉じる
//  AS8-B4：リュウの表情（街の初対面の会話）
//  AS8-B5：市場の木製UI＋カルーセル（矢印・ドット）
//  AS8-B6：街の BGM＝「冒険への誘い」
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

async function toReception(pg, sp = 0, clear = 0) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate(([sp, clear]) => { const m = mk(sp); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); for (let r = 0; r < clear; r++) MMP7.recordRankClear(S, m, r); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); board(); }, [sp, clear]);
  await pg.waitForSelector('button.rcv-row', { timeout: 20000 }); await pg.waitForTimeout(600);
}
const sceneSrc = (pg) => pg.evaluate(() => { const b = document.querySelector('.mmtalk-scenebg'); return b ? b.style.backgroundImage : ''; });

for (const [rank, clear] of [[0, 0], [3, 3]]) {
  test(`AS8-B1：セドリックの大会前の導入（ランク${'EDCBAS'[rank]}）＝正式の booth_${'EDCBAS'[rank]}・画面の幅に合わせる → 対戦表`, { skip: SKIP, timeout: 120000 }, async () => {
    const p = await openPage({ size: H.SIZES.base, npc: true, tourconf: true, tourfx: true }); const pg = p.page;
    await toReception(pg, 0, 0);
    if (!clear) { await pg.click(`button.rcv-row[data-rank="${rank}"]`); await pg.waitForTimeout(500); await pg.click('#p9join'); await pg.waitForSelector('#p9conf .p9conf-yes'); await pg.waitForTimeout(450); await pg.click('#p9conf .p9conf-yes'); }
    else await pg.evaluate((k) => { for (let r = 0; r < k; r++) MMP7.recordRankClear(S, S.m, r); S.m.raise.ch = 3; if (!MMP8.startTournament(S, S.m, k, 7).ok) throw new Error('start'); save(); p9TourOpen(k); }, rank);   // ほかのランク：受付は Chapter の上限があるので、開始と導入を直接
    await pg.waitForSelector('.mmtalk-scene', { timeout: 30000 });
    assert.match(await sceneSrc(pg), new RegExp(`cedric/booth_${'EDCBAS'[rank]}\\.webp`));
    const r = await pg.evaluate(() => { const b = document.querySelector('.mmtalk-scenebg'), cs = getComputedStyle(b); return { size: cs.backgroundSize, nofig: document.querySelector('.mmtalk').classList.contains('mmtalk-nofig'), fig: !!document.querySelector('.mmtalk-fig img[src*="cedric"]:not([hidden])') && getComputedStyle(document.querySelector('.mmtalk-fig')).display !== 'none' }; });
    assert.equal(r.nofig, true, '立ち絵（旧アップ）は重ねない'); assert.equal(r.fig, false);
    assert.match(r.size, /^(100%|390px)( auto)?$/, `絵の幅＝画面の幅（cover で拡大しない）：${r.size}`);
    await H.finishTalk(pg);
    await pg.waitForSelector('.tb1 .tbgo', { timeout: 20000 });
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('AS8-B2：大会3 VS＝専用勝負絵（自分は右向き・相手は反転）→ バトル。VS は1回だけ', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({ size: H.SIZES.base, tourvs: true }); const pg = p.page;
  await toReception(pg, 1);
  await pg.evaluate(() => { MMP8.startTournament(S, S.m, 0, 7); save(); board(); });
  await pg.waitForSelector('.tb1 .tbgo'); await pg.click('.tb1 .tbgo');
  await pg.waitForSelector('.p9cmps .pcgo'); await pg.waitForTimeout(500); await pg.click('.pcgo'); await pg.waitForTimeout(600); await pg.click('.pcgo');
  await pg.waitForSelector('#tvs .tvsm.me img'); await pg.waitForTimeout(600);
  const v = await pg.evaluate(() => { const g = (s) => document.querySelector(s); const op = g('#tvs .tvsm.op img'), me = g('#tvs .tvsm.me img'); const o = MMP8L.entrantView(S.m.raise.tour.league, MMP8.tourNext(S.m).opp);
    return { me: me.getAttribute('src'), meFl: me.classList.contains('fl'), meOk: me.complete && me.naturalWidth > 0, op: op.getAttribute('src'), opFl: op.classList.contains('fl'), opOk: op.complete && op.naturalWidth > 0, want: ['solamo', 'gauru', 'nobiton', 'jiol', 'regnas'][o.sp], bgFl: getComputedStyle(g('#tvs .tvsbg')).transform };
  });
  assert.equal(v.me, './assets/tournament/vs_monsters/gauru_vs.webp'); assert.equal(v.meFl, false, '自分は右向き（反転しない）');
  assert.equal(v.op, `./assets/tournament/vs_monsters/${v.want}_vs.webp`); assert.equal(v.opFl, true, '相手は反転（モンスターの絵だけ）');
  assert.ok(v.meOk && v.opOk, '読み込まれた'); assert.ok(v.bgFl === 'none' || !/-1/.test(v.bgFl), '背景は反転しない');
  await pg.waitForSelector('#bt', { timeout: 15000 }); await pg.waitForTimeout(1500);
  assert.equal(await pg.evaluate(() => document.querySelectorAll('#tvs').length + document.querySelectorAll('.intro, #intro').length), 0, 'バトル側で VS を重ねて出さない');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('AS8-B3：ランク昇格 Final（D→C）＝光・枠・文字・解放の札が読み込まれて重なり、自動で閉じる。A→S の4枚も読める', { skip: SKIP, timeout: 60000 }, async () => {
  const p = await openPage({ size: H.SIZES.se }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { window.__ru = p9RankUpFinal(RANK_UP_ART[2], 2); });
  await pg.waitForSelector('.p9ruf.go', { timeout: 5000 }); await pg.waitForTimeout(2200);
  const r = await pg.evaluate(() => ({ imgs: [...document.querySelectorAll('.p9ruf img')].map((i) => [i.getAttribute('src').split('/').slice(-2).join('/'), i.naturalWidth > 0, +getComputedStyle(i).opacity > 0.9]), txt: document.querySelector('.p9ruf .rufpl b').textContent }));
  assert.deepEqual(r.imgs.map((x) => x[0]), ['D_to_C/fx.webp', 'D_to_C/frame.webp', 'D_to_C/letter.webp', 'D_to_C/plaque.webp']);
  assert.ok(r.imgs.every((x) => x[1] && x[2]), JSON.stringify(r.imgs)); assert.equal(r.txt, 'ランクC大会 解放！');
  await pg.evaluate(() => window.__ru); assert.equal(await pg.evaluate(() => !!document.querySelector('.p9ruf')), false, '自動で閉じる');
  const all = await pg.evaluate(async () => { const out = []; for (const to of [1, 2, 3, 4, 5]) for (const k of ['letter', 'frame', 'fx', 'plaque']) { const i = new Image(); i.src = RANK_UP_SRC(RANK_UP_ART[to], k); await i.decode().catch(() => {}); out.push(i.naturalWidth > 0); } return out; });
  assert.ok(all.every(Boolean), '5段階×4枚すべて読める');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('AS8-B4：リュウの表情（街の初対面の会話）＝驚き → 自信 …（正式の表情差分）', { skip: SKIP, timeout: 60000 }, async () => {
  const p = await openPage({ size: H.SIZES.base }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { window.__t = MMNPC.talk(OPEN_TALK.ryu('テスト'), { kind: 'event', big: true }); });
  await pg.waitForSelector('.mmtalk .mmtalk-fig img'); await pg.waitForTimeout(400);
  const a = await pg.evaluate(() => { const i = document.querySelector('.mmtalk .mmtalk-fig img'); return [i.getAttribute('src'), i.naturalWidth > 0]; });
  assert.match(a[0], /assets\/npc\/ryu\/expr\/surprise\.webp$/); assert.equal(a[1], true);
  // 2行目（フィナ）→ 3行目（リュウ＝自信）
  const srcs = new Set([a[0].split('/').pop()]);
  for (let i = 0; i < 60 && srcs.size < 3; i++) { await pg.click('.mmtalk:not(.mmtalk-out)', { force: true }).catch(() => {}); await pg.waitForTimeout(120); const s = await pg.evaluate(() => { const st = MMNPC.state(), i = document.querySelector('.mmtalk .mmtalk-fig img'); return st && st.npc === 'ryu' && i ? [st.expr, i.getAttribute('src')] : null; }); if (s) { assert.ok(s[1].endsWith(`/expr/${s[0]}.webp`), JSON.stringify(s)); srcs.add(s[1].split('/').pop()); } }
  assert.ok(srcs.has('surprise.webp') && srcs.has('confident.webp'), [...srcs].join(','));
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('AS8-B5：市場の木製UI（中央・左右の札・左右のナビ）＋カルーセル（矢印・ドット）', { skip: SKIP, timeout: 60000 }, async () => {
  for (const size of [H.SIZES.base, H.SIZES.se]) {
    const p = await openPage({ size }); const pg = p.page;
    await H.newGame(pg, 'テスト'); await pg.evaluate(() => market());
    await pg.waitForFunction(() => !!document.querySelector('#p10car .p10sl.on') && typeof P10_ANIM !== 'undefined' && !P10_ANIM); await pg.waitForTimeout(500);
    const r = await pg.evaluate(() => { const bg = (s) => getComputedStyle(document.querySelector(s)).backgroundImage; const pl = document.querySelector('#p10car .p10sl.on .p10plate').getBoundingClientRect();
      return { c: bg('#p10car .p10sl.on .p10plate'), s: bg('#p10car .p10sl:not(.on) .p10plate'), l: bg('.p10arw:not(.next)'), r: bg('.p10arw.next'), plate: [pl.left >= 0, pl.right <= innerWidth], dots: document.querySelectorAll('.p10dots > *').length, name: document.querySelector('#p10car .p10sl.on .p10plate b').textContent }; });
    assert.match(r.c, /market_wood\/plate_center\.png/); assert.match(r.s, /market_wood\/plate_side\.png/); assert.match(r.l, /market_wood\/arrow_left\.png/); assert.match(r.r, /market_wood\/arrow_right\.png/);
    assert.deepEqual(r.plate, [true, true]); assert.ok(r.dots >= 3);
    await pg.click('.p10arw.next'); await pg.waitForFunction((n) => !P10_ANIM && document.querySelector('#p10car .p10sl.on .p10plate b').textContent !== n, r.name);
    await pg.click('.p10arw:not(.next)'); await pg.waitForFunction((n) => !P10_ANIM && document.querySelector('#p10car .p10sl.on .p10plate b').textContent === n, r.name);
    await pg.click('.p10arw:not(.next)'); await pg.waitForFunction((n) => !P10_ANIM && document.querySelector('#p10car .p10sl.on .p10plate b').textContent !== n, r.name);   // ループ（最初から前へ）
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  }
});

test('AS8-B6：街の BGM＝「冒険への誘い」（ループ区間つき）', { skip: SKIP, timeout: 60000 }, async () => {
  const p = await openPage({ size: H.SIZES.base }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.waitForSelector('#app .map.town'); await pg.mouse.click(5, 300); await pg.waitForTimeout(800);
  const st = await pg.evaluate(() => MMAUDIO.status());
  assert.equal(st.scene, 'TOWN');
  const sl = st.slots.find((s) => s.active) || st.slots.find((s) => s.scene === 'TOWN');
  assert.ok(sl && /licensed_20261008\/town_bouken_e_no_izanai\.ogg/.test(sl.src), JSON.stringify(st.slots));
  assert.deepEqual(sl.loop, [0, 178.6]);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('AS8-B7：D 優勝の結果＝最終順位 → モンスターの勝利演出（正式の勝利画像・種族で出し分け）→ 初回報酬 → ランクアップ（Final D→C）→ セドリックの締め（booth_D）→ 次の画面', { skip: SKIP, timeout: 180000 }, async () => {
  const p = await openPage({ size: H.SIZES.base, npc: true, tourfx: true }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => {
    const T = []; window.__T = T; const t0 = performance.now(); const seen = new Set();
    new MutationObserver(() => { for (const [k, sel] of [['victory', '.p9vic'], ['reward', '.mmnote'], ['rankup', '.p9ruf'], ['cedric', '.mmtalk-scene']]) { const el = document.querySelector(sel); if (el && !seen.has(k)) { seen.add(k); T.push([k, Math.round(performance.now() - t0), k === 'victory' ? el.querySelector('.vicmon').getAttribute('src') : k === 'cedric' ? el.querySelector('.mmtalk-scenebg').style.backgroundImage : '']); } } }).observe(document.body, { childList: true, subtree: true });
    const m = mk(1); m.name = 'ガウ'; Object.assign(m, { li: 999, po: 999, in: 999, hi: 999, ev: 999, de: 999 }); MMP7.ensureProg(m); S.m = m; MMP8.depart(S, m, () => 0.3);
    const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true;
    if (!MMP8.startTournament(S, m, 1, 11).ok) throw new Error('D');
    while (m.raise.tour.status === 'league') { MMP8.beginBattle(S, m, { kind: 'league', rank: 1 }); S.wins = (S.wins || 0) + 1; MMP8.markBattleDone(S); MMP8.finishBattle(S, m); }
    save(); board();
  });
  for (let i = 0; i < 200; i++) { if (await pg.$('.mmtalk-scene')) break; await pg.waitForTimeout(100); }
  await pg.waitForTimeout(800); await H.finishTalk(pg);
  await pg.waitForFunction(() => MMP8.tourEndSeen(S.m.raise.tour.result, 'next'), null, { timeout: 20000 });
  const r = await pg.evaluate(() => ({ T: window.__T, won: S.m.raise.tour.result.won, seen: S.m.raise.tour.result.endSeen }));
  assert.equal(r.won, true);
  assert.deepEqual(r.seen, ['final', 'champion', 'firstReward', 'rankUp', 'cedricEnd', 'next']);
  const order = r.T.map((x) => x[0]);
  assert.deepEqual(order.filter((k) => ['victory', 'rankup', 'cedric'].includes(k)), ['victory', 'rankup', 'cedric'], JSON.stringify(r.T));
  assert.ok(order.indexOf('reward') > order.indexOf('victory') && order.indexOf('reward') < order.indexOf('rankup'), '初回報酬は勝利演出のあと・ランクアップの前：' + JSON.stringify(r.T));
  assert.match(r.T.find((x) => x[0] === 'victory')[2], /victory\/gauru_victory\.webp$/, 'ガウルの勝利画像');
  assert.match(r.T.find((x) => x[0] === 'cedric')[2], /cedric\/booth_D\.webp/);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('AS8-B8：世界地図の解放の知らせ＝正式の透過アイコン（読み込まれる・市松模様の四角ではない）', { skip: SKIP, timeout: 60000 }, async () => {
  const p = await openPage({ size: H.SIZES.base }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { MMNOTE.show({ img: './assets/ui/worldmap_icon/worldmap_unlock.png', cmd: true, small: true, title: '世界地図が使えるようになった' }); });
  await pg.waitForSelector('.mmnote .mmnote-ic img'); await pg.waitForTimeout(400);
  const r = await pg.evaluate(() => { const i = document.querySelector('.mmnote .mmnote-ic img'); const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return { ok: i.naturalWidth > 0, corner: x.getImageData(1, 1, 1, 1).data[3] }; });
  assert.equal(r.ok, true); assert.equal(r.corner, 0, '角は透明');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
