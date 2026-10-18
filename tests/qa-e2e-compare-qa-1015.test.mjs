// =========================================================
// QA（実ブラウザ）：2026-10-15 新しいパラメーター比較画面・独立 VS の廃止・フルーネの技カード・QA 試遊モード
//  CQ-B1（375×667・390×844・430×932）：肩上アップ6枚×左右（読み込み・右は左右反転・顔が見える範囲・名前と表と「対戦開始」が重ならない・画面の中）
//  CQ-B2：大会（E）・野生・レア・ライバル＝比較 →「対戦開始」（連打）→ バトル1つ（VS の画面・fight() の導入なし）・実際の6能力・背景・曲
//  CQ-B3：QA 試遊モード（?mmQaTrial=1）：切り替えは牧場とベースキャンプだけ → ON → 6体×10技のカード（60）と詳細 → QA 試合（実戦の4体）・ジオルの技アニメ → OFF
//  CQ-B4：通常のセーブを守る：ON → QA 試合 → OFF・再読み込みで localStorage と S が完全に同じ・レグナス／フルーネは本番に出ない
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
const SHOT = path.join(os.tmpdir(), 'mm-compare-qa-1015'); mkdirSync(SHOT, { recursive: true });
const rect = (pg, s) => pg.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom }; }, s);
const scene = (pg) => pg.evaluate(() => (window.MMAUDIO && MMAUDIO.status && MMAUDIO.status().scene) || null);
const ST6 = (v) => ({ li: v, po: v - 20, in: v - 40, hi: v - 10, ev: v - 30, de: v + 5 });

for (const size of [H.SIZES.se, H.SIZES.base, H.SIZES.max]) {
  test(`CQ-B1（${size.join('×')}）：肩上アップ6枚×左右・右は反転・顔が見える・名前／表／「対戦開始」が重ならない`, { skip: SKIP }, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await H.newGame(pg, 'テスト');
    for (const [a, b] of [[0, 1], [2, 3], [4, 5], [1, 0], [3, 2], [5, 4]]) {
      await pg.evaluate(([a, b, me, op]) => { window.__ui = MMCMP.overlay({ bg: MMARENA.fieldSrc(1), sub: '野生のモンスター', me: { sp: a, name: 'テストテスト', stats: me, skill: MMCMP.skillName(a) }, op: { sp: b, name: 'テスト相手', stats: op, skill: MMCMP.skillName(b) } }); }, [a, b, ST6(180), ST6(90)]);
      await pg.waitForFunction(() => [...document.querySelectorAll('#cmp img.c2img')].length === 2 && [...document.querySelectorAll('#cmp img.c2img')].every((i) => i.complete && i.naturalWidth === 640), null, { timeout: 15000 });
      await pg.waitForTimeout(700);
      const r = await pg.evaluate(() => {
        const R = (e) => { const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }; };
        const c = document.querySelector('#cmp'), duo = R(c.querySelector('.c2duo')), names = R(c.querySelector('.c2names')), tbl = R(c.querySelector('.c2tbl')), go = R(c.querySelector('.c2go')), ttl = R(c.querySelector('.c2ttl'));
        const sides = [...c.querySelectorAll('.c2side')].map((sd) => { const im = sd.querySelector('img'), p = MMCMP.PORTRAIT[+im.dataset.sp], ir = R(im), op = sd.classList.contains('op');
          const fx = op ? ir.l + (1 - p.fx) * ir.w : ir.l + p.fx * ir.w, fy = ir.t + p.fy * ir.h;   // 顔の中心（右は反転）
          return { sp: +im.dataset.sp, op, flip: getComputedStyle(im).transform, fx, fy, side: R(sd), src: im.getAttribute('src') }; });
        return { W: innerWidth, H: innerHeight, sw: document.documentElement.scrollWidth, duo, names, tbl, go, ttl, sides,
          vals: [...c.querySelectorAll('.c2r')].map((e) => [...e.querySelectorAll('b')].map((b) => +b.textContent)), bars: [...c.querySelectorAll('.c2r .c2bar i')].map((i) => parseFloat(i.style.width)),
          plates: [...c.querySelectorAll('.c2n')].map((n) => n.querySelector('i').textContent + ':' + n.querySelector('b').textContent) };
      });
      assert.ok(r.sw <= r.W + 1, '横にはみ出さない');
      assert.ok(r.go.t >= r.tbl.b - 1 && r.go.b <= r.H + 1 && r.go.l >= 0 && r.go.r <= r.W, `「対戦開始」は表の下・画面の中 ${JSON.stringify([r.tbl, r.go])}`);
      assert.ok(r.go.h >= 48, '「対戦開始」は大きい');
      assert.ok(r.names.b <= r.tbl.t + 1, '名前の札と能力の表は重ならない');
      assert.deepEqual(r.plates, ['あなた:テストテスト', '相手:テスト相手']);
      assert.deepEqual(r.vals, [[180, 90], [160, 70], [140, 50], [170, 80], [150, 60], [185, 95]], '6能力の数値');
      assert.deepEqual(r.bars, [180, 90, 160, 70, 140, 50, 170, 80, 150, 60, 185, 95].map((v) => +(v / 999 * 100).toFixed(2)), 'ゲージ＝左右とも 999 の同じ尺度');
      for (const s of r.sides) {
        assert.match(s.src, new RegExp(`compare_1015/${['solamo', 'gauru', 'nobiton', 'jiol', 'regnas', 'flurene'][s.sp]}\\.webp$`));
        if (s.op) assert.match(s.flip, /^matrix\(-1, 0, 0, 1,/, '右（相手）は左右反転して中央を向く'); else assert.equal(s.flip, 'none');
        assert.ok(s.fx > s.side.l + 8 && s.fx < s.side.r - 8, `顔は自分の側に見える sp${s.sp} ${JSON.stringify(s)}`);
        assert.ok(s.fy > r.ttl.b - 10 && s.fy < r.names.t, `顔は題字の下・名前の札の上 sp${s.sp}`);
      }
      await pg.screenshot({ path: path.join(SHOT, `b1_${size[0]}_${a}${b}.png`) });
      await pg.evaluate(() => document.getElementById('cmp').remove());
    }
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('CQ-B2：大会（E・375×667／390×844）・野生・レア・ライバル＝比較 →「対戦開始」（連打）→ バトル1つ・VS の画面と fight() の導入なし・実際の6能力・背景・曲', { skip: SKIP }, async () => {
  for (const size of [H.SIZES.se, H.SIZES.base]) {
    const p = await openPage({ size }); const pg = p.page;
    await H.newGame(pg, 'テスト');
    await pg.evaluate(() => { const m = mk(1); m.name = 'ガウ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); MMP8.startTournament(S, S.m, 0, 7); save(); board(); });
    await pg.waitForSelector('.p9tour.tp2 .p9next .p9go'); await pg.waitForTimeout(300);
    await pg.click('.p9next .p9go'); await pg.waitForSelector('#app>.p9cmps.cmp2 .pcgo'); await pg.waitForTimeout(900);
    const c = await pg.evaluate(() => ({ sub: document.querySelector('.c2ttl small').textContent, bg: document.querySelector('.cmp2 .c2bg').style.backgroundImage, vals: [...document.querySelectorAll('.c2r')].map((e) => [...e.querySelectorAll('b')].map((b) => +b.textContent)), me: ['li', 'po', 'in', 'hi', 'ev', 'de'].map((k) => S.m[k]), opp: MMP8L.PROVISIONAL_OPPONENT_STAT[0], imgs: [...document.querySelectorAll('.cmp2 img.c2img')].map((i) => i.getAttribute('src')), tvs: !!document.getElementById('tvs'), sw: document.documentElement.scrollWidth, W: innerWidth }));
    assert.equal(c.sub, '公式ランクE大会'); assert.match(c.bg, /official_rank_1012\/rank_E\.webp/, '大会＝公式の会場');
    assert.deepEqual(c.vals, c.me.map((v) => [v, c.opp]), '実際の6能力（自分・ランク E の相手）');
    assert.match(c.imgs[0], /compare_1015\/gauru\.webp$/); assert.equal(c.tvs, false); assert.ok(c.sw <= c.W + 1);
    assert.equal(await scene(pg), 'TOURNAMENT_MATCHUP', '大会の比較の曲は従来どおり');
    await pg.screenshot({ path: path.join(SHOT, `b2_${size[0]}_tour.png`) });
    await pg.evaluate(() => { const b = document.querySelector('.pcgo'); b.click(); b.click(); b.click(); });
    await pg.waitForSelector('#bt'); await pg.waitForTimeout(700);
    assert.deepEqual(await pg.evaluate(() => ({ n: document.querySelectorAll('#bt').length, tvs: !!document.getElementById('tvs'), intro: !!document.querySelector('#bt .intro'), kind: S.m.raise.battle && S.m.raise.battle.kind })), { n: 1, tvs: false, intro: false, kind: 'league' }, '比較 → そのままバトル（VS の画面・fight() の導入なし・1試合だけ）');
    await pg.waitForFunction(() => MMAUDIO.status().scene === 'TOURNAMENT_BATTLE_LOW', null, { timeout: 15000 });
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
    await p.ctx.close();
  }
  const SC = { wild: 'WILD_BATTLE', rare: 'RARE_WILD_BATTLE', rival: 'RIVAL_BATTLE' }, SUB = { wild: '野生のモンスター', rare: 'レアモンスター', rival: 'ライバル戦' };
  for (const bt of ['wild', 'rare', 'rival']) {
    const p = await openPage({ size: H.SIZES.base, worldCh1: true, tourvs: true }); const pg = p.page;
    await H.newGame(pg, 'テスト');
    await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); S.m.raise.field.introSeen = true; save(); board(); });
    await pg.waitForSelector('#wbw #brollbtn', { timeout: 30000 }); await pg.waitForTimeout(1500);
    const sc0 = await scene(pg);
    await pg.evaluate((bt) => { const r = S.m.raise; r.pend = { roll: 1, left: 0, stage: 'battle', fx: { kind: 'battle', battleType: bt } }; save(); bBattleGo(); bBattleGo(); }, bt);
    await pg.waitForSelector('#cmp .c2go'); await pg.waitForTimeout(900);
    const c = await pg.evaluate((bt) => { const rk = bt === 'rival' ? MMRIVAL.rankFor(S.m) : MMP8.practiceRank(S.m); return { n: document.querySelectorAll('#cmp').length, sub: document.querySelector('#cmp .c2ttl small').textContent, bg: document.querySelector('#cmp .c2bg').style.backgroundImage, vals: [...document.querySelectorAll('#cmp .c2r')].map((e) => [...e.querySelectorAll('b')].map((b) => +b.textContent)), me: ['li', 'po', 'in', 'hi', 'ev', 'de'].map((k) => S.m[k]), opp: MMP8L.PROVISIONAL_OPPONENT_STAT[rk], op: document.querySelector('#cmp .c2side.op img').getAttribute('src'), names: [...document.querySelectorAll('#cmp .c2n b')].map((b) => b.textContent), bt: !!document.getElementById('bt') }; }, bt);
    assert.equal(c.n, 1, '比較の重ね画面は1つ（二重に呼んでも）'); assert.equal(c.sub, SUB[bt]); assert.match(c.bg, /field_1012\/ch1_meadow\.webp/, '野外の背景（実際のバトルと同じ）');
    assert.deepEqual(c.vals, c.me.map((v) => [v, c.opp]), '実際の6能力（相手＝fight() が作る相手と同じランクの値）'); assert.equal(c.bt, false, '押すまでバトルは始まらない');
    if (bt === 'rival') { assert.match(c.op, /compare_1015\/regnas\.webp$/); assert.equal(c.names[1], 'レグナス'); }
    assert.equal(await scene(pg), sc0, '比較の間はボードの曲のまま（無音で待たせない）');
    await pg.screenshot({ path: path.join(SHOT, `b2_390_${bt}.png`) });
    await pg.waitForTimeout(300);
    await pg.evaluate(() => { const b = document.querySelector('#cmp .c2go'); b.click(); b.click(); });
    await pg.waitForSelector('#bt'); await pg.waitForTimeout(700);
    assert.deepEqual(await pg.evaluate(() => ({ n: document.querySelectorAll('#bt').length, tvs: !!document.getElementById('tvs'), intro: !!document.querySelector('#bt .intro'), kind: S.m.raise.battle && S.m.raise.battle.kind })), { n: 1, tvs: false, intro: false, kind: 'practice' });
    await pg.waitForFunction(() => !document.getElementById('cmp'), null, { timeout: 5000 });
    await pg.waitForFunction((s) => MMAUDIO.status().scene === s, SC[bt], { timeout: 15000 });
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  }
});

const ranchSave = async (pg) => { await H.newGame(pg, 'テスト'); await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; const b = mk(1); b.name = 'ガウ'; MMP7.ensureProg(b); S.box = [b]; S.g = 1234; save(); farm(); }); };
const stored = (pg) => pg.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((k) => /^mr4/.test(k)).sort().map((k) => [k, localStorage.getItem(k)])));

test('CQ-B3：QA 試遊モード＝切り替えは牧場とベースキャンプだけ → ON → 6体×10技のカード（60）と詳細 → QA 試合（実戦の4体）・ジオルの技アニメ → OFF', { skip: SKIP }, async () => {
  // 普段の URL では出ない
  let p = await openPage({}); let pg = p.page; await ranchSave(pg); await pg.waitForTimeout(600);
  assert.equal(await pg.evaluate(() => !!document.getElementById('mmqa-sw') || MMQA.ENABLED), false, '?mmQaTrial=1 の無い URL では何も出さない');
  await p.ctx.close();
  p = await openPage({ query: '?mmQaTrial=1' }); pg = p.page; await ranchSave(pg);
  await pg.waitForSelector('#mmqa-sw'); assert.match(await pg.textContent('#mmqa-sw'), /QA：全モンスター・全技試遊OFF/);
  await pg.evaluate(() => hall('t')); await pg.waitForSelector('#app>.fm.bc'); await pg.waitForSelector('#mmqa-sw');
  await pg.evaluate(() => lobby()); await pg.waitForTimeout(500); assert.equal(await pg.$('#mmqa-sw'), null, '街には出さない');
  await pg.evaluate(() => farm()); await pg.waitForSelector('#mmqa-sw');
  await pg.click('#mmqa-sw'); await pg.waitForSelector('#mmqa .qcard');
  assert.match(await pg.textContent('#mmqa .qh'), /QA モード：全モンスター・全技試遊（ON）/);
  assert.equal(await pg.$('#mmqa-sw'), null, 'ON の間は切り替えのかわりに OFF のボタン');
  const tally = { battle: 0, preview: 0, static: 0 };
  for (let i = 0; i < 6; i++) {
    await pg.click(`#mmqa .qtab[data-i="${i}"]`);
    await pg.waitForFunction(() => { const im = [...document.querySelectorAll('#mmqa .qcard img')]; return im.length === 10 && im.every((x) => x.complete && x.naturalWidth > 0); }, null, { timeout: 30000 });
    const cards = await pg.evaluate(() => [...document.querySelectorAll('#mmqa .qcard')].map((c) => ({ st: c.dataset.status, t: c.querySelector('b').textContent, src: c.querySelector('img').getAttribute('src') })));
    assert.equal(cards.length, 10);
    for (let n = 0; n < 10; n++) {
      tally[cards[n].st]++;
      assert.match(cards[n].t, new RegExp('^' + String(n + 1).padStart(2, '0') + ' '));
      await pg.click(`#mmqa .qcard[data-n="${n}"]`); await pg.waitForSelector('#mmqa .qdet img.big');
      const d = await pg.evaluate(() => ({ h: document.querySelector('#mmqa .qdet h3').textContent, st: document.querySelector('#mmqa .qdet .qst').textContent, go: (document.querySelector('#mmqa .qdet .qgo') || {}).textContent || null }));
      assert.equal(d.h, cards[n].t);
      if (cards[n].st === 'battle') assert.equal(d.go, 'この技で QA 試合'); else if (cards[n].st === 'preview') assert.equal(d.go, '技アニメを再生（QA 画面）'); else { assert.equal(d.go, null); assert.match(d.st, /未実装／要仕様確認/); }
      if (i === 5 && n === 0) { await pg.waitForFunction(() => [...document.querySelectorAll('#mmqa .qpics img')].every((x) => x.complete && x.naturalWidth > 0)); assert.equal(await pg.evaluate(() => document.querySelectorAll('#mmqa .qpics img').length), 3, 'フルーネ＝正式立ち絵・待機絵・比較画面の絵'); }
      await pg.click('#mmqa .qdet .qno');
    }
  }
  assert.deepEqual(tally, { battle: 60, preview: 0, static: 0 }, '実戦 60（ソラモ・ガウル・ノビトン・レグナス・ジオル・フルーネ＝2026-10-18 REV3 でフルーネも正式10技＝SK 50〜59）');
  // QA 試合：4体（比較 → 対戦開始 → 6枠すべて選んだ技 → STOP で技が出る → QA 一覧へ）
  for (const [i, no, sp] of [[0, 10, 0], [1, 3, 1], [2, 7, 2], [4, 9, 4]]) {
    await pg.click(`#mmqa .qtab[data-i="${i}"]`); await pg.click(`#mmqa .qcard[data-n="${no - 1}"]`); await pg.click('#mmqa .qdet .qgo');
    await pg.waitForSelector('#cmp .c2go'); await pg.waitForTimeout(500); await pg.click('#cmp .c2go');
    await pg.waitForSelector('#bt'); await pg.waitForFunction(() => { const g = document.getElementById('go'); return g && !g.disabled; }, null, { timeout: 30000 });
    await pg.waitForTimeout(500);
    const b = await pg.evaluate(() => ({ sp: BPL[0].sp, eq: BPL[0].eq, names: [...document.querySelectorAll('#bt .mmr .pl .nm')].map((e) => e.textContent), foe: BPL[1].sp, foeLi: BPL[1].li, label: (document.querySelector('#bt .tm small') || {}).textContent }));
    const want = await pg.evaluate(([i, no]) => MMQA.catalog()[i].moves[no - 1], [i, no]);
    assert.equal(b.sp, sp); assert.deepEqual(b.eq.slice(0, 6), Array(6).fill(want.slot), '6枠すべて選んだ技'); assert.ok(b.names.length >= 4 && b.names.every((x) => x === want.name), `ルーレットの技＝${want.name} ${JSON.stringify(b.names)}`);
    assert.deepEqual([b.foe, b.foeLi, b.label], [0, 70, 'QA 試遊'], 'テスト相手＝ランク E の相手（ソラモ）');
    await pg.click('#go'); await pg.waitForTimeout(1800);
    await pg.screenshot({ path: path.join(SHOT, `b3_battle_${i}_${no}.png`) });
    await pg.evaluate(() => MMQA.endBattle()); await pg.waitForSelector('#mmqa .qcard', { state: 'visible', timeout: 60000 });
    assert.equal(await pg.evaluate(() => !!document.getElementById('bt')), false, 'QA 試合のあとは QA の一覧へ');
  }
  // 技アニメのプレビュー（判定・ダメージなし）＝2026-10-15 からフルーネ（ジオルは正式10技で実戦＝tests/qa-e2e-jiol-moves-1015.test.mjs）
  await pg.click('#mmqa .qtab[data-i="5"]'); await pg.click('#mmqa .qcard[data-n="5"]'); await pg.click('#mmqa .qdet .qgo');
  await pg.waitForSelector('#bt.mmqa-prev'); await pg.waitForSelector('#mmqa-bar button');
  await pg.waitForFunction(() => [...document.querySelectorAll('#bt img')].some((i) => /flurene_moves_1015\//.test(i.getAttribute('src') || '')), null, { timeout: 8000 });
  await pg.screenshot({ path: path.join(SHOT, 'b3_preview.png') });
  await pg.evaluate(() => MMQA.endBattle()); await pg.waitForSelector('#mmqa .qcard', { state: 'visible', timeout: 60000 });
  await pg.click('#mmqa .qoff'); await pg.waitForSelector('#app>.rn'); await pg.waitForSelector('#mmqa-sw');
  assert.equal(await pg.$('#mmqa'), null);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('CQ-B4：通常のセーブを守る＝ON → QA 試合 → OFF・再読み込みで localStorage と S が完全に同じ・レグナス／フルーネは本番に出ない', { skip: SKIP }, async () => {
  const p = await openPage({ query: '?mmQaTrial=1' }); const pg = p.page; await ranchSave(pg);
  await pg.waitForSelector('#mmqa-sw');
  const s0 = await stored(pg), S0 = await pg.evaluate(() => JSON.stringify(S));
  await pg.click('#mmqa-sw'); await pg.waitForSelector('#mmqa .qcard');
  // ON の間は通常のセーブのキーへ書けない（設定のキーは書ける）
  assert.deepEqual(await pg.evaluate(() => { save(); localStorage.setItem('mr4v6', 'x'); localStorage.setItem('mr4s3', 'x'); localStorage.removeItem('mr4v6'); localStorage.setItem('mmqa-probe', '1'); const ok = localStorage.getItem('mmqa-probe'); localStorage.removeItem('mmqa-probe'); return [localStorage.getItem('mr4s3'), ok]; }), [null, '1']);
  assert.deepEqual(await stored(pg), s0, 'ON の間は何も書き換わらない');
  // レグナス（貸与）で QA 試合 → 勝敗まで進めて戻る
  await pg.click('#mmqa .qtab[data-i="4"]'); await pg.click('#mmqa .qcard[data-n="0"]'); await pg.click('#mmqa .qdet .qgo');
  await pg.waitForSelector('#cmp .c2go'); await pg.waitForTimeout(500); await pg.click('#cmp .c2go');
  await pg.waitForSelector('#bt'); await pg.waitForFunction(() => { const g = document.getElementById('go'); return g && !g.disabled; }, null, { timeout: 30000 });
  for (let k = 0; k < 4; k++) { await pg.click('#go').catch(() => {}); await pg.waitForTimeout(2600); if (!(await pg.$('#bt'))) break; }
  await pg.evaluate(() => MMQA.endBattle()); await pg.waitForSelector('#mmqa .qcard', { state: 'visible', timeout: 90000 });
  assert.deepEqual(await stored(pg), s0, 'QA 試合のあとも何も書き換わらない');
  await pg.click('#mmqa .qoff'); await pg.waitForSelector('#app>.rn');
  assert.equal(await pg.evaluate(() => JSON.stringify(S)), S0, 'OFF で S が完全に元どおり');
  assert.deepEqual(await stored(pg), s0);
  const chk = await pg.evaluate(() => ({ sp: [S.m.sp, ...S.box.map((x) => x.sp)], ids: MMP10M.SPECIES.map((s) => s.id), reg: MMP10M.rivalMonster('regnas').playerAvailable, fl: MMP10M.pendingSpecies('flurene').unlocked, mk: MMP10M.MARKET_CATALOG.map((c) => c.key) }));
  assert.deepEqual(chk.sp, [0, 1]); assert.deepEqual(chk.ids, [0, 1, 2, 3]); assert.equal(chk.reg, false); assert.equal(chk.fl, false); assert.ok(!chk.mk.includes('regnas') && !chk.mk.includes('flurene'));
  // OFF のあとは通常どおり保存できる
  await pg.evaluate(() => { S.g = 1300; save(); });
  assert.equal(await pg.evaluate(() => JSON.parse(localStorage.getItem('mr4v6')).g), 1300, 'OFF のあとは通常のセーブ');
  await pg.evaluate(() => { S.g = 1234; save(); });
  // ON のまま再読み込み → 必ず OFF・セーブは ON の前のまま
  await pg.evaluate(() => farm()); await pg.waitForSelector('#mmqa-sw'); await pg.click('#mmqa-sw'); await pg.waitForSelector('#mmqa .qcard');
  await pg.evaluate(() => { S.g = 99999; S.box = []; save(); });
  await pg.reload(); await pg.waitForFunction(() => typeof S === 'object' && window.MMQA);
  assert.deepEqual(await stored(pg), s0, '再読み込みでも QA の変更は残らない');
  assert.deepEqual(await pg.evaluate(() => [MMQA.isOn(), S.g, S.box.length, !!document.getElementById('mmqa')]), [false, 1234, 1, false]);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
