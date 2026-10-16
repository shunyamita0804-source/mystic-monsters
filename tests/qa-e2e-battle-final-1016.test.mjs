// 2026-10-16（バトル最終統合）実ブラウザ：
//  BF-B1 ?mmQaTrial=1 の開始画面に『QA を開く』→ QA の画面 → バトル技ステージ（6体・各10技・1技ずつ／全10技・側・相手・体格・背景・速さ・結果）→ 戻る＝通常のセーブは変わらない・片付く
//  BF-B2 Chapter 2 試作の A／B／C の切り替え（?chapterBoard=roadfirst&rfData=ch2 → A＋帯に A／B／C・各 URL）
//  BF-B3 技カード3枚の差し替え（ガウル 06＝SK 15・ノビトン 02＝SK 31・フルーネ 09＝QA の SK 58）
//  BF-B4 ルートドレイン補修版10コマ：2つの接触点の中ほどが相手の被弾点に届く（味方・敵の両側）・旧8コマは読まない
//  BF-B5 ずつき＝新しい本体2枚（31_b01・31_b02）だけ・旧 31_01〜04 は読まない
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
let L;
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });
const OPEN = [];
const openPage = async (o) => { const p = await L.open(o); OPEN.push(p); return p; };
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close().catch(() => {}); });

/** QA の試合の画面（index.html の fight()）を直接作る（qa-e2e-battle-tune-1015 と同じ） */
async function battle(me, foe, o = {}) {
  const p = await openPage(Object.assign({ size: H.SIZES.base, stage: true, query: '?mmQaTrial=1' }, o)), pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(({ me, foe }) => { if (me === 5 || foe === 5) { const inf = MMQA.catalog().find((x) => x.sp === 5); IMG[5] = inf.img; MMARENA.IDLE[5] = 'idle_flurene'; }
    const m = MMQA.makeMon(me); m.sk = [0]; m.eq = [0]; m.speed = 10; m.raise = { battle: { kind: 'practice', rank: 0, done: false, qa: true, snap: { g: S.g, wins: S.wins, br: S.br, rk: m.rk, fa: m.fa, st: m.st } } }; S.m = m; battleDress({ rank: 0, label: 'QA', name: '相手' }); battleFoeOnce(foe === 5 ? 0 : foe); TB_SKIP_INTRO = true; fight(0); battleDressDom(); }, { me, foe });
  await pg.waitForFunction(() => { const g = document.getElementById('go'); return g && !g.disabled && !g.classList.contains('bk'); }, null, { timeout: 30000 });
  if (foe === 5) await pg.evaluate(() => { BPL[1].sp = 5; document.querySelector('#bt #m1 .mma-idle').src = './assets/battle/idle/idle_flurene.webp'; });
  await pg.waitForTimeout(900);
  return p;
}

test('BF-B1：?mmQaTrial=1 → 開始画面の『QA を開く』→ バトル技ステージ（1技・全10技・敵側・体格案A・背景・速さ・回避・MISS）→ 戻る＝セーブは変わらない・片付く', { skip: SKIP, timeout: 600000 }, async () => {
  const p = await openPage({ size: H.SIZES.base, stage: true, query: '?mmQaTrial=1' }), pg = p.page;
  await H.newGame(pg, 'テスト');
  const before = await pg.evaluate(() => localStorage.getItem('mr4v6'));
  await pg.evaluate(() => title());
  await pg.waitForSelector('#mmqa-entry');
  await pg.click('#mmqa-entry');
  await pg.waitForSelector('#mmqa .qstg');
  assert.equal(await pg.evaluate(() => MMQA.isOn()), true, 'QA を開くと ON（通常のセーブへは書かない）');
  await pg.click('#mmqa .qstg');
  await pg.waitForSelector('#mmqas select[data-k="mon"]', { timeout: 30000 });
  const ui = await pg.evaluate(() => ({ mons: [...document.querySelectorAll('#mmqas select[data-k="mon"] option')].map((o) => o.textContent), moves: document.querySelectorAll('#mmqas select[data-k="no"] option').length,
    keys: [...document.querySelectorAll('#mmqas select')].map((s) => s.dataset.k), btns: [...document.querySelectorAll('#mmqas .qsb button')].map((b) => b.dataset.a),
    fit: (() => { const r = document.getElementById('mmqas').getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 0.5 && r.bottom <= innerHeight + 0.5; })(), hScroll: document.documentElement.scrollWidth > innerWidth }));
  assert.deepEqual(ui.mons, ['ソラモ', 'ガウル', 'ノビトン', 'ジオル', 'レグナス', 'フルーネ'], 'マスターデータの6体');
  assert.equal(ui.moves, 10);
  assert.deepEqual(ui.keys, ['mon', 'no', 'side', 'target', 'size', 'bg', 'speed', 'result', 'loop']);
  assert.deepEqual(ui.btns, ['prev', 'play', 'next', 'pause', 'step', 'auto', 'close']);
  assert.ok(ui.fit && !ui.hScroll, '390×844 で操作欄が画面の中・横にはみ出さない');
  // 1技（実戦の描画）・敵側・体格 案A・紺
  const r1 = await pg.evaluate(async () => { MMQAS.change('mon', '2'); MMQAS.change('no', '2'); MMQAS.change('side', '1'); MMQAS.change('size', 'A'); MMQAS.change('bg', 'navy'); return await MMQAS.play(); });
  assert.equal(r1.kind, 'anim'); assert.equal(r1.slot, 31); assert.equal(r1.side, 1); assert.equal(r1.size, 'A');
  // 回避・MISS・速さ 0.5
  const r2 = await pg.evaluate(async () => { MMQAS.change('result', 'evade'); MMQAS.change('speed', '0.5'); return await MMQAS.play(); });
  assert.equal(r2.kind, 'anim'); assert.ok(r2.ms > r1.ms * 1.5, `0.5倍は長い（${r1.ms} → ${r2.ms}ms）`);
  const r3 = await pg.evaluate(async () => { MMQAS.change('result', 'miss'); MMQAS.change('speed', '1'); return await MMQAS.play(); });
  assert.equal(r3.kind, 'miss');
  // フルーネの全10技（09＝実戦の描画・ほか＝技アニメのプレビュー）
  await pg.evaluate(() => { MMQAS.change('result', 'hit'); MMQAS.change('side', '0'); MMQAS.change('size', 'old'); MMQAS.change('mon', '5'); MMQAS.act('auto'); });
  await pg.waitForFunction(() => !MMQAS.state().auto, null, { timeout: 120000 });
  const log = await pg.evaluate(() => MMQAS.log().slice(-10).map((r) => [r.no, r.kind, r.err || null]));
  assert.deepEqual(log.map((x) => x[0]), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(log.map((x) => x[1]), ['preview', 'preview', 'preview', 'preview', 'preview', 'preview', 'preview', 'preview', 'anim', 'preview']);
  assert.ok(log.every((x) => !x[2]));
  // 一時停止・コマ送り
  const ps = await pg.evaluate(async () => { MMQAS.change('no', '10'); const pr = MMQAS.play(); await new Promise((r) => setTimeout(r, 800)); MMQAS.act('pause'); const a = MMQAS.state().paused; MMQAS.act('step'); const b = MMQAS.state().paused; MMQAS.act('pause'); await pr; return [a, b]; });
  assert.deepEqual(ps, [true, true], '一時停止とコマ送り（止めたまま）');
  await pg.evaluate(() => MMQAS.act('close'));
  await pg.waitForSelector('#mmqa .qstg', { timeout: 30000 });
  const st = await pg.evaluate(() => ({ left: document.querySelectorAll('.p25f,.mmrd,#mmqas,#mmqas-miss').length, bt: !!document.getElementById('bt'), qa: !!window.__mmqaST, size: window.MM_QA_SIZE || null }));
  assert.deepEqual(st, { left: 0, bt: false, qa: false, size: null }, '技の絵・操作欄・仮想の時計・体格の切り替えが残らない');
  assert.equal(await pg.evaluate(() => localStorage.getItem('mr4v6')), before, '通常のセーブは変わらない');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('BF-B2：Chapter 2 試作の A／B／C（?chapterBoard=roadfirst&rfData=ch2 → A と切り替えの帯・各 URL）', { skip: SKIP, timeout: 300000 }, async () => {
  for (const r of [null, 'A', 'B', 'C']) {
    const p = await openPage({ size: H.SIZES.base, query: '?chapterBoard=roadfirst&rfData=ch2' + (r ? '&ch2route=' + r : '') }), pg = p.page;
    await pg.waitForFunction(() => window.MMRF && document.getElementById('rfp'), null, { timeout: 30000 }).catch(async () => { await pg.evaluate(() => MMRF.start()); });
    if (!(await pg.evaluate(() => !!document.getElementById('rfp')))) await pg.evaluate(() => MMRF.start());
    await pg.waitForSelector('#rfp .rf-c2sel a', { timeout: 30000 });
    const s = await pg.evaluate(() => ({ ch2: MMRF.CH2, links: [...document.querySelectorAll('#rfp .rf-c2sel a')].map((a) => [a.textContent, a.getAttribute('href'), a.classList.contains('on')]) }));
    assert.equal(s.ch2, r || 'A');
    assert.deepEqual(s.links.map((x) => x[0]), ['A', 'B', 'C']);
    assert.deepEqual(s.links.map((x) => x[1]), ['A', 'B', 'C'].map((q) => '?chapterBoard=roadfirst&rfData=ch2&ch2route=' + q));
    assert.deepEqual(s.links.map((x) => x[2]), ['A', 'B', 'C'].map((q) => q === (r || 'A')));
    assert.deepEqual(p.errors, []);
    await p.ctx.close(); OPEN.splice(OPEN.indexOf(p), 1);
  }
});

test('BF-B3：技カード3枚の差し替え（ガウル 06＝SK 15・ノビトン 02＝SK 31・フルーネ 09＝QA の SK 58）', { skip: SKIP, timeout: 240000 }, async () => {
  const p = await openPage({ size: H.SIZES.base, query: '?mmQaTrial=1' }), pg = p.page;
  await H.newGame(pg, 'テスト');
  const r = await pg.evaluate(() => ({ g: MMMVCARD.bySlot(15), n: MMMVCARD.bySlot(31), f: MMMVCARD.bySlot(58), qa: MMQA.catalog().find((x) => x.sp === 5).moves.find((m) => m.no === 9) }));
  assert.equal(r.g.src, './assets/moves/cards_1014/gauru/06_fireball.webp'); assert.equal(r.g.name, 'ファイアボール');
  assert.equal(r.n.src, './assets/moves/cards_1014/nobiton/02_zutsuki.webp'); assert.equal(r.n.name, 'ずつき');
  assert.equal(r.f.src, './assets/moves/cards_1014/flurene/09_root_drain.webp'); assert.equal(r.f.name, 'ルートドレイン');
  assert.equal(r.qa.src, './assets/moves/cards_1014/flurene/09_root_drain.webp'); assert.equal(r.qa.slot, 58);
  const ok = await pg.evaluate((u) => Promise.all(u.map((s) => new Promise((res) => { const i = new Image(); i.onload = () => res([i.naturalWidth, i.naturalHeight]); i.onerror = () => res(null); i.src = s; }))), [r.g.src, r.n.src, r.f.src]);
  assert.deepEqual(ok, [[640, 360], [640, 360], [640, 360]]);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

for (const side of [0, 1]) {
  test(`BF-B4（側${side}）：ルートドレイン補修版10コマ＝接触点の中ほどが相手の被弾点に届く・旧8コマは読まない`, { skip: SKIP, timeout: 300000 }, async () => {
    const p = await battle(side ? 0 : 5, side ? 5 : 0), pg = p.page;
    const urls = [];
    pg.on('request', (q) => urls.push(q.url()));
    const r = await pg.evaluate((s) => new Promise((ok) => { anim(58, s); setTimeout(() => { const L = MMRD.log(); ok({ rec: L[L.length - 1], left: document.querySelectorAll('#bt .mmrd').length }); }, 4000); }), side);
    assert.ok(r.rec && r.rec.target, 'ルートドレインの記録');
    assert.ok(Math.abs(r.rec.contact.x - r.rec.target.x) < 3, `接触点 ${r.rec.contact.x} と被弾点 ${r.rec.target.x}`);
    assert.ok(r.rec.contact.y > r.rec.target.top && r.rec.contact.y < r.rec.target.bottom, `接触点の高さ ${r.rec.contact.y} は相手の体の中（${r.rec.target.top}〜${r.rec.target.bottom}）`);
    assert.ok(r.rec.ext >= 0.55 && r.rec.ext <= 2.4, `蔦の伸縮 ${r.rec.ext}`);
    assert.equal(r.left, 0, 'コマが残らない');
    assert.ok(!urls.some((u) => /flurene_rootdrain_1016\//.test(u)), '旧8コマ（flurene_rootdrain_1016）は読まない');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('BF-B5：ずつき＝新しい本体2枚（31_b01 溜め → 31_b02 突進・接触 → 31_b01 戻る）だけ・旧の本体は出さない', { skip: SKIP, timeout: 240000 }, async () => {
  const p = await battle(2, 0), pg = p.page;
  const seen = await pg.evaluate(() => new Promise((ok) => { anim(31, 0); const s = []; const iv = setInterval(() => { document.querySelectorAll('#bt img.p25f').forEach((e) => { if (+getComputedStyle(e).opacity > 0.5) { const f = (e.getAttribute('src') || '').split('/').pop(); if (s[s.length - 1] !== f) s.push(f); } }); }, 30); setTimeout(() => { clearInterval(iv); ok(s); }, 3200); }));
  const bodies = seen.filter((f) => /^31_/.test(f) && !/_fx/.test(f));
  assert.ok(bodies.includes('31_b01.webp') && bodies.includes('31_b02.webp'), JSON.stringify(seen));
  assert.ok(!bodies.some((f) => /^31_0[1-4]\.webp$/.test(f)), '旧の本体（31_01〜04）は出さない');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
