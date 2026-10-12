// =========================================================
// 2026-10-13 開発24（実ブラウザ・QA_E2E=1 のときだけ）：新しいバトル画面・技の発動中の表示・観客の声・NPC のボイス・最新の版への読み込み直し
//  D24-B1（375×667・390×844・430×932）：公式ランク戦＝新しい画面（既定）。ルーレットは従来より縦に約3割低い・威力／命中率／クリ率は出さない・中央の板だけ技名・
//         STOP の押せる所は従来の大きさで画面の中・モンスター（足もと）・HUD は画面の中・横はみ出しなし・相手の番の説明は出さない
//  D24-B2：技の発動中（技名の帯が出てから）は名前・HP・ルーレット・STOP・説明が見えない（opacity 0・visibility hidden・座標はそのまま）、
//         ダメージの数字・技名・モンスターは見える。技が終われば戻る（最後に残らない）。決着（WIN!／LOSE）では消えたまま残らない
//  D24-B3：観客の声＝命中＝歓声・ルーレットの MISS＝落胆・技をかわされた＝ブーイングが別々に・1行動1回・相手の攻撃にも。実際に再生を始めた（AudioContext running・OGG の1本だけ）
//  D24-B4：野生・ライバルの練習試合（野外）は観客の声なし・1秒の版／控えめ／なしの切り替え・音量
//  D24-B5：施設のボイス（市場＝カレン・牧場＝ニック・ベースキャンプ＝ダン・アイテム屋＝ベルナ）は訪問1回に1回・研究所は鳴らない・OFF／ミュートで鳴らない・
//         会話の行の声（フィナ）は会話を閉じたら止まる・ボイスの音源が 404 でも会話・進行は止まらない
//  D24-B6：「バトル画面：旧」で従来の見た目（数値の板）に戻る・設定はセーブ（mr4v6）を変えない・再読み込みでも保たれる
//  D24-B7：version.json の版が違えば1回だけ読み込み直す（同じ版へは繰り返さない）・同じなら何もしない
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
const shot = (pg, n) => (process.env.MM_SHOT ? pg.screenshot({ path: `${process.env.MM_SHOT}/${n}.png` }) : null);

async function tour(pg, o = {}) { await H.newGame(pg, 'テスト'); await tourSetup(pg, o); }
async function tourSetup(pg, { sp = 0, foe = 1, stats = { li: 400, po: 300, in: 300, hi: 300, ev: 200, de: 300 } } = {}) {
  await pg.evaluate(({ sp, stats }) => { const m = mk(sp); m.name = 'テスト'; Object.assign(m, stats); MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); board(); }, { sp, stats });
  await pg.waitForSelector('#chrcv .rcv-row', { timeout: 20000 });
  await pg.mouse.click(4, 4);   // 最初の操作（音の解除）
  await pg.evaluate((foe) => { MMP8.startTournament(S, S.m, 0, 7); save(); const o = window.battleFoeOnce; window.battleFoeOnce = () => o(foe); p8TourFight(); }, foe);
  await pg.waitForSelector('#bt #m0 .mon .mma-idle', { timeout: 20000 });
}
async function field(pg, kind) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); save(); board(); });
  await pg.waitForSelector('#chf .chf-bg'); await pg.waitForTimeout(800); await pg.mouse.click(4, 300);
  await pg.evaluate((kind) => { const g = MMCH.graphFor(S.m), a = S.m.raise.field.nodeAssignments; const id = g.order.find((x) => a[x] && a[x].t === 'battle' && a[x].bt === kind) || (kind === 'rival' ? 'p5_0' : null); const r = S.m.raise; r.node = id; r.pend = { roll: 1, left: 0, stage: 'resolve' }; save(); board(); }, kind);
  await pg.waitForSelector('.chbat', { timeout: 20000 }); await pg.evaluate(() => bBattleGo());
  await pg.waitForSelector('#bt #m0 .mon .mma-idle', { timeout: 20000 });
}
/** 記録：ダメージの数字・ルーレットの止まった枠・技の発動中の表示の出入り */
const RECORD = () => {
  const R = window.__d24 = { pops: [], hits: [], cine: [], bad: [] };
  const bt = document.getElementById('bt');
  new MutationObserver((ms) => ms.forEach((m) => {
    m.addedNodes.forEach((n) => {
      if (n.nodeType !== 1) return;
      if (n.tagName === 'SPAN' && n.classList.contains('dmg') && !n.classList.contains('ef') && /^f[01]$/.test((n.parentNode || {}).id || '')) {
        const vis = (() => { const r = n.getBoundingClientRect(); return r.width > 0 && getComputedStyle(n).visibility !== 'hidden'; })();
        R.pops.push({ side: +n.parentNode.id.slice(1), ms: n.classList.contains('ms'), t: performance.now(), cine: bt.classList.contains('mma-cine'), vis });
      }
      if (n.classList && n.classList.contains('skb3')) requestAnimationFrame(() => setTimeout(() => {
        if (!bt.isConnected) return;
        const cs = (s) => { const e = bt.querySelector(s); return e ? { op: getComputedStyle(e).opacity, vis: getComputedStyle(e).visibility, h: e.getBoundingClientRect().height } : null; };
        R.cine.push({ t: performance.now(), on: bt.classList.contains('mma-cine'), hpr: cs('.hpr'), bui: cs('.bui'), tm: cs('.tm'), sur: cs('button.sur'), skb: getComputedStyle(n).visibility, mon0: getComputedStyle(bt.querySelector('#m0')).visibility });
      }, 200));
    });
  })).observe(bt, { childList: true, subtree: true });
  const rl = document.getElementById('rl');
  new MutationObserver(() => { const h = rl.querySelector('.rw.hit'); if (h && !h.__seen) { h.__seen = 1; R.hits.push({ ms: h.classList.contains('ms'), t: performance.now() }); } }).observe(rl, { subtree: true, attributes: true, attributeFilter: ['class'] });
};
/** 最後まで戦う。wantMiss(turn)＝自分の番に MISS の枠で止めるか */
async function fightToEnd(pg, wantMiss = () => false, maxMs = 240000) {
  const t0 = Date.now(); let turn = 0;
  while (Date.now() - t0 < maxMs) {
    const s = await pg.evaluate(() => { const g = document.getElementById('go'); return { bt: !!document.getElementById('bt'), back: !!g && g.classList.contains('bk'), can: !!g && !g.disabled && !g.classList.contains('bk') }; });
    if (!s.bt) return;
    if (s.back) return;
    if (s.can) { const w = wantMiss(turn++); await pg.waitForFunction((w) => { const on = document.querySelector('#rl .rw.on'); return on && on.classList.contains('ms') === w; }, w, { timeout: 4000, polling: 5 }).catch(() => {}); await pg.click('#go').catch(() => {}); }
    await pg.waitForTimeout(120);
  }
  throw new Error('バトルが終わらない');
}

const SIZES = [H.SIZES.se, H.SIZES.base, H.SIZES.max];
for (const size of SIZES) {
  test(`D24-B1（${size.join('×')}）：公式ランク戦の新しい画面＝低いルーレット・数値なし・STOP は従来の大きさ・画面の中・相手の番の説明なし`, { skip: SKIP, timeout: 180000 }, async () => {
    const p = await openPage({ size, stage: true }); const pg = p.page;
    await tour(pg);
    await pg.waitForFunction(() => { const g = document.getElementById('go'); return g && !g.disabled; }, null, { timeout: 30000 });
    await pg.waitForTimeout(500);
    const r = await pg.evaluate(() => {
      const bt = document.getElementById('bt'), R = (s) => { const e = bt.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return { t: b.top, b: b.bottom, l: b.left, r: b.right, w: b.width, h: b.height }; };
      const go = bt.querySelector('#go'), gb = go.getBoundingClientRect(), hitEl = document.elementFromPoint(gb.left + gb.width / 2, gb.top + gb.height / 2);
      const pw = parseFloat(getComputedStyle(bt.querySelector('.mmr')).getPropertyValue('--mmr-pw'));
      return { v24: bt.classList.contains('mma-v24'), mmr: R('.mmr'), go: R('#go'), stop: R('.mma-stop'), i0: R('#m0 .mma-idle'), i1: R('#m1 .mma-idle'), hpr: R('.hpr'), tm: R('.tm'), pw, W: Math.min(bt.clientWidth, 480),
        st: bt.querySelectorAll('.mmr .pl .st').length, plates: [...bt.querySelectorAll('.mmr .pl img.bgp')].map((i) => i.getAttribute('src')),
        nmVis: [...bt.querySelectorAll('.mmr .pl:not(.ms) .nm')].map((n) => +getComputedStyle(n).opacity), goHit: hitEl === go || go.contains(hitEl),
        k: [getComputedStyle(bt.querySelector('#m0 .mon')).getPropertyValue('--mma-k'), getComputedStyle(bt.querySelector('#m1 .mon')).getPropertyValue('--mma-k')].map(Number),
        sw: document.documentElement.scrollWidth, iw: innerWidth, ih: innerHeight };
    });
    assert.ok(r.v24, '新しい画面が既定');
    const oldH = r.pw * (360 / 229) * 1.16 + 28; const cut = 1 - r.mmr.h / oldH;
    assert.ok(cut >= 0.25 && cut <= 0.38, `ルーレットの縦は従来より約3割低い（${Math.round(cut * 100)}%）`);
    assert.equal(r.st, 0, '威力・命中率・クリ率は出さない'); assert.ok(r.plates.every((s) => /compact_1013\/plate_(normal|selected|miss)_c\.webp$/.test(s)), '低い板（派生）');
    assert.ok(r.nmVis.filter((o) => o > 0.5).length <= 1, '技名は中央の板だけ（回っている間は0〜1枚）');
    const sw = Math.round(Math.min(r.W * 0.62, 270)); assert.ok(Math.abs(r.go.w - sw) <= 1 && r.go.h >= sw * 268 / 720 - 2, `STOP の押せる所は従来の大きさ ${r.go.w}×${r.go.h}`);
    assert.ok(r.goHit, 'STOP の真ん中を押すと #go'); assert.ok(r.go.b <= r.ih && r.stop.b <= r.ih + 1, 'STOP は画面の中');
    assert.deepEqual(r.k, [0.91, 0.92], '大きさ（ソラモ 0.91・ガウル 0.92）');
    for (const k of ['i0', 'i1']) assert.ok(r[k].t >= r.hpr.b - 4 && r[k].b <= r.mmr.t + 2 && r[k].l >= -2 && r[k].r <= r.iw + 2, `${k} は HUD の下・ルーレットの上・画面の中 ${JSON.stringify(r[k])}`);
    assert.ok(Math.abs(r.i0.b - r.i1.b) < 3, '左右の足もとがそろう');
    assert.ok(r.i0.t - r.hpr.b < r.ih * 0.25, `上に大きな空きを作らない（${Math.round(r.i0.t - r.hpr.b)}px）`);
    assert.ok(r.sw <= r.iw + 1, '横はみ出しなし');
    // STOP で止まったら：中央の板＝止まった行（技名はその板だけ）
    await pg.click('#go');
    const lk = await pg.waitForFunction(() => { const S = window.MMARENA_LAST, rl = document.getElementById('rl'); const hit = rl && rl.querySelector('.rw.hit'); if (!S || !hit || S.mode !== 'locked') return null;
      const c = document.querySelector('.mmr .pl.c'), on = [...document.querySelectorAll('.mmr .pl:not(.ms) .nm')].filter((n) => +getComputedStyle(n).opacity > 0.5);
      return { hit: hit.classList.contains('ms') ? 'MISS' : (hit.querySelector('.rn') || {}).textContent, plate: c ? (c.classList.contains('ms') ? 'MISS' : (c.querySelector('.nm') || {}).textContent) : null, names: on.map((n) => n.textContent) }; }, null, { timeout: 8000 }).then((h) => h.jsonValue());
    assert.equal(lk.plate, lk.hit, '止まった板＝fight() の結果'); assert.deepEqual(lk.names, lk.hit === 'MISS' ? [] : [lk.hit], '技名は止まった板だけ');
    // 相手の番：「相手がルーレットを回している…」は見えない
    const enemy = await pg.waitForFunction(() => { const m = document.querySelector('#bt #msg'); return m && /相手がルーレットを回している/.test(m.textContent) ? { vis: getComputedStyle(m).visibility } : null; }, null, { timeout: 15000, polling: 20 }).then((h) => h.jsonValue()).catch(() => null);
    if (enemy) assert.equal(enemy.vis, 'hidden', '相手の番の説明は出さない');
    await shot(pg, `d24b1_${size[0]}`);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('D24-B2：技の発動中は名前・HP・ルーレット・STOP・説明が見えない（座標はそのまま）・ダメージの数字と技名とモンスターは見える・終われば戻る', { skip: SKIP, timeout: 300000 }, async () => {
  const p = await openPage({ size: H.SIZES.base, stage: true }); const pg = p.page;
  await tour(pg, { stats: { li: 700, po: 60, in: 60, hi: 300, ev: 100, de: 400 } });   // 長めの試合（技が何回も出る）
  await pg.evaluate(RECORD);
  await fightToEnd(pg);
  const R = await pg.evaluate(() => window.__d24);
  assert.ok(R.cine.length >= 3, `技が何回か出た（${R.cine.length}）`);
  for (const c of R.cine) {
    assert.ok(c.on, '技名の帯が出ている間は #bt.mma-cine');
    for (const k of ['hpr', 'bui', 'tm', 'sur']) if (c[k]) { assert.equal(c[k].op, '0', `${k} は透明`); assert.equal(c[k].vis, 'hidden', `${k} は visibility hidden（押せない）`); }
    assert.ok(c.hpr.h > 10 && c.bui.h > 30, 'display:none ではない（大きさ・座標はそのまま）');
    assert.equal(c.skb, 'visible', '技名は見える'); assert.equal(c.mon0, 'visible', 'モンスターは見える');
  }
  const dmg = R.pops.filter((x) => x.cine); assert.ok(dmg.length >= 1 && dmg.every((x) => x.vis), 'ダメージの数字は発動中も見える');
  const end = await pg.evaluate(() => { const bt = document.getElementById('bt'); return { cine: bt.classList.contains('mma-cine'), hpr: getComputedStyle(bt.querySelector('.hpr')).visibility, bui: getComputedStyle(bt.querySelector('.bui')).visibility, ban: (bt.querySelector('#ban') || {}).textContent }; });
  assert.deepEqual([end.cine, end.hpr, end.bui], [false, 'visible', 'visible'], `決着の画面では戻っている（${end.ban}）`);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('D24-B3：観客の声＝命中・ルーレットの MISS・かわされた が別々に1行動1回・相手の攻撃にも・実際に再生を始めた', { skip: SKIP, timeout: 300000 }, async () => {
  const p = await openPage({ size: H.SIZES.base, stage: true }); const pg = p.page;
  await tour(pg, { stats: { li: 900, po: 200, in: 200, hi: 300, ev: 300, de: 600 } });
  await pg.evaluate(RECORD);
  // テストの中だけ：自分の攻撃の命中の乱数を1回おきに外れ側へ（bridge の乱数の差し込み口。計算は変えない）＝かわされる場面を必ず作る
  await pg.evaluate(() => { const B = window.MMBattle; let n = 0; window.MMBattle = Object.freeze(Object.assign({}, B, { resolveAction(o) { if (o && o.attackerSide === 'A' && (n++ % 2 === 0)) o = Object.assign({}, o, { rng: Object.assign({}, o.rng || {}, { hitRng: () => 0.999 }) }); return B.resolveAction(o); } })); });
  await fightToEnd(pg, (t) => t % 3 === 1);
  const r = await pg.evaluate(() => ({ R: window.__d24, crowd: MMCROWD.log(), play: MMAUDIO.playLog().filter((x) => /^CROWD/.test(x.name)), ctx: MMAUDIO.status().context, rx: MMARENA.rxLog() }));
  const kinds = r.crowd.map((x) => x.kind);
  for (const k of ['hit', 'miss', 'evade']) assert.ok(kinds.includes(k), `${k} が鳴った ${JSON.stringify(kinds)}`);
  assert.ok(r.crowd.every((x) => x.result === 'se'), '公式大会では全部鳴らす');
  // 1行動1回：MISS の数字（ルーレット）＝落胆の数、ダメージの数字（命中）＝歓声の数、MISS の数字（かわされた）＝ブーイングの数
  const missHits = r.R.hits.filter((h) => h.ms).length;
  assert.equal(kinds.filter((k) => k === 'miss').length, missHits, `ルーレットの MISS の回数（${missHits}）と落胆の回数が同じ`);
  assert.equal(kinds.filter((k) => k === 'hit').length + kinds.filter((k) => k === 'evade').length, r.rx.length, '命中＋かわされた＝被弾／回避のリアクションの回数（同じ出来事）');
  assert.equal(kinds.filter((k) => k === 'evade').length, r.rx.filter((x) => x.kind === 'dodge').length, 'かわされた＝回避（06）と同時');
  assert.ok(r.rx.some((x) => x.side === 0), '相手の攻撃（自分が受けた）にも');
  // 実際に再生を始めた（seLog だけで判断しない）：名前ごとの数・AudioContext running・OGG の1本だけ
  assert.equal(r.play.length, r.crowd.length, '頼んだ数だけ再生を始めた（二重に鳴らない）'); assert.ok(r.play.every((x) => x.ctx === 'running' && /crowd_1013\/.*\.ogg$/.test(x.src)), JSON.stringify(r.play.slice(0, 3)));
  const G = { CROWD_HIT: 0.55, CROWD_MISS: 0.55, CROWD_EVADE: 0.2 }; assert.ok(r.play.every((x) => Math.abs(x.gain - G[x.name]) < 0.001), '初期の音量（短い版・標準）');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('D24-B4：練習試合（野外）は観客なし・1秒／控えめ／なし の切り替え', { skip: SKIP, timeout: 300000 }, async () => {
  for (const kind of ['wild', 'rival']) {
    const p = await openPage({ size: H.SIZES.base, stage: true }); const pg = p.page;
    await field(pg, kind);
    await fightToEnd(pg);
    const r = await pg.evaluate(() => ({ crowd: MMCROWD.log(), play: MMAUDIO.playLog().filter((x) => /^CROWD/.test(x.name)), prac: document.getElementById('bt').dataset.mmprac }));
    assert.equal(r.prac, '1'); assert.ok(r.crowd.length > 0 && r.crowd.every((x) => x.result === 'no-audience'), `${kind}：観客なし`); assert.equal(r.play.length, 0);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
    await p.ctx.close();
  }
  const p = await openPage({ size: H.SIZES.base, stage: true }); const pg = p.page;
  await tour(pg, { stats: { li: 900, po: 200, in: 200, hi: 300, ev: 300, de: 600 } });
  await pg.evaluate(() => MMCROWD.set({ mode: 'long', level: 'soft' }));
  await fightToEnd(pg, (t) => t % 2 === 1);
  const r = await pg.evaluate(() => MMAUDIO.playLog().filter((x) => /^CROWD/.test(x.name)));
  assert.ok(r.length > 0 && r.every((x) => /_LONG$/.test(x.name) && /1000ms\.ogg$/.test(x.src)), '1秒の版');
  const G = { CROWD_HIT_LONG: 0.6, CROWD_MISS_LONG: 0.53, CROWD_EVADE_LONG: 0.15 }; assert.ok(r.every((x) => Math.abs(x.gain - G[x.name] * 0.6) < 0.001), '控えめ＝×0.6');
  await pg.evaluate(() => MMCROWD.set({ mode: 'off' }));
  const n = r.length; await pg.click('#go').catch(() => {});
  assert.equal(await pg.evaluate(() => JSON.parse(localStorage.getItem('mmcrowd')).mode), 'off');
  assert.ok((await pg.evaluate(() => MMAUDIO.playLog().filter((x) => /^CROWD/.test(x.name)).length)) === n);
});

test('D24-B5：施設のボイスは訪問1回に1回・研究所は鳴らない・OFF／ミュートで鳴らない・会話を閉じたら止まる・音源 404 でも進行は止まらない', { skip: SKIP, timeout: 180000 }, async () => {
  const p = await openPage({ size: H.SIZES.base }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'テスト'; MMP7.ensureProg(m); S.m = m; save(); lobby(); });
  await pg.mouse.click(4, 300); await pg.waitForFunction(() => MMAUDIO.voiceStatus().dan_hello === 'ready', null, { timeout: 15000 });
  const visit = async (fn) => { const before = await pg.evaluate(() => MMAUDIO.playLog().filter((x) => x.kind === 'voice').length); await pg.evaluate(fn); await pg.waitForTimeout(600); return pg.evaluate((b) => MMAUDIO.playLog().filter((x) => x.kind === 'voice').slice(b).map((x) => x.name), before); };
  assert.deepEqual(await visit(() => market()), ['karen_welcome'], '市場＝カレン');
  assert.deepEqual(await visit(() => market()), [], '市場の中で描き直しても繰り返さない');
  assert.deepEqual(await visit(() => lobby()), []);
  assert.deepEqual(await visit(() => farm()), ['nick_hello'], '牧場＝ニック'); assert.deepEqual(await visit(() => farm('', 'e')), [], 'タブを替えても繰り返さない');
  assert.deepEqual(await visit(() => lobby()), []);
  assert.deepEqual(await visit(() => hall('t')), ['dan_hello'], 'ベースキャンプ＝ダン'); assert.deepEqual(await visit(() => hall('st')), []); assert.deepEqual(await visit(() => hall('t')), [], 'ステータスから戻っても繰り返さない');
  assert.deepEqual(await visit(() => shopScr()), ['berna_welcome'], 'アイテム屋＝ベルナ'); assert.deepEqual(await visit(() => shopScr('', false, 'buy')), []);
  assert.deepEqual(await visit(() => museum()), [], '研究所（エリオット）は既定 OFF');
  const pl = await pg.evaluate(() => MMAUDIO.playLog().filter((x) => x.kind === 'voice'));
  assert.ok(pl.every((x) => x.ctx === 'running' && /voice\/npc_1013\/\w+\.ogg$/.test(x.src)), '実際に再生を始めた（OGG の1本）');
  // OFF・ミュート
  await pg.evaluate(() => { lobby(); MMAUDIO.setVoice({ on: false }); });
  assert.deepEqual(await visit(() => market()), [], 'ボイス OFF'); assert.equal(await pg.evaluate(() => MMAUDIO.voiceLog().slice(-1)[0].result), 'off');
  await pg.evaluate(() => { lobby(); MMAUDIO.setVoice({ on: true, vol: 0.5 }); sndToggle(); });
  assert.deepEqual(await visit(() => market()), [], '全体のミュート'); assert.equal(await pg.evaluate(() => MMAUDIO.voiceLog().slice(-1)[0].result), 'muted');
  await pg.evaluate(() => { sndToggle(); lobby(); });
  assert.equal(await pg.evaluate(() => localStorage.getItem('mmvoice')), '{"on":true,"vol":0.5}');
  // 会話の行の声：閉じたら止まる
  await pg.evaluate(() => { MMNPC.talk([{ npc: 'fina', expression: 'troubled', voice: 'fina_hey', text: 'もう、リュウったら……。' }, { text: '次の行' }]); });
  await pg.waitForFunction(() => MMAUDIO.voiceNow() === 'fina_hey', null, { timeout: 3000 });
  await pg.evaluate(() => MMNPC.close()); assert.equal(await pg.evaluate(() => MMAUDIO.voiceNow()), null, '会話を閉じたら声も止まる');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  await p.ctx.close();
  // 404：声が無くても会話・施設の画面は進む
  const q = await openPage({ size: H.SIZES.base }); const qg = q.page;
  await qg.route('**/voice/npc_1013/**', (r) => r.fulfill({ status: 404, body: '' }));
  await H.newGame(qg, 'テスト');
  await qg.evaluate(() => { const m = mk(0); m.name = 'テスト'; MMP7.ensureProg(m); S.m = m; save(); lobby(); });
  await qg.mouse.click(4, 300); await qg.waitForTimeout(800);
  await qg.evaluate(() => market()); await qg.waitForSelector('.p10mk', { timeout: 10000 });
  const t = qg.evaluate(() => MMNPC.talk([{ npc: 'fina', voice: 'fina_yes', text: 'うん。' }]));
  await qg.waitForSelector('.mmtalk', { timeout: 3000 }); await H.finishTalk(qg); await t;
  assert.deepEqual(q.errors, []); assert.ok(q.bad.every((b) => /voice\/npc_1013/.test(b)), `404 は声だけ ${q.bad}`);
  assert.equal(await qg.evaluate(() => MMAUDIO.playLog().filter((x) => x.kind === 'voice').length), 0);
});

test('D24-B6：「バトル画面：旧」で従来の見た目に戻る・設定はセーブを変えない・再読み込みでも保たれる', { skip: SKIP, timeout: 180000 }, async () => {
  const p = await openPage({ size: H.SIZES.base, stage: true }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  const save0 = await pg.evaluate(() => localStorage.getItem('mr4v6'));
  await pg.evaluate(() => confScr());
  await pg.click('.tseg button:text("旧")'); await pg.click('.tseg button:text("1秒")'); await pg.click('.tseg button:text("控えめ")');
  assert.equal(await pg.evaluate(() => localStorage.getItem('mr4v6')), save0, '設定を変えてもセーブはそのまま');
  await pg.reload(); await pg.waitForFunction(() => typeof S === 'object' && window.MMARENA, null, { timeout: 60000 });
  assert.deepEqual(await pg.evaluate(() => [MMARENA.v24(), MMCROWD.settings()]), [false, { mode: 'long', level: 'soft' }], '再読み込みでも保たれる');
  await pg.click('[onclick*="startGame"]'); await pg.waitForTimeout(800); await H.finishTalk(pg);   // つづきから
  await tourSetup(pg);
  await pg.waitForSelector('#bt .mmr .pl img.bgp', { timeout: 20000 });
  const r = await pg.evaluate(() => { const bt = document.getElementById('bt'); return { v24: bt.classList.contains('mma-v24'), st: bt.querySelectorAll('.mmr .pl .st').length, plate: bt.querySelector('.mmr .pl img.bgp').getAttribute('src'), k: getComputedStyle(bt.querySelector('#m0 .mon')).getPropertyValue('--mma-k') }; });
  assert.deepEqual([r.v24, r.k], [false, ''], '旧＝従来の見た目'); assert.ok(r.st > 0, '旧＝数値の板'); assert.match(r.plate, /roulette\/plate_(normal|miss)\.webp$/);
  await pg.click('#go'); await pg.waitForTimeout(2500);
  assert.equal(await pg.evaluate(() => document.getElementById('bt').classList.contains('mma-cine')), false, '旧＝技の発動中も隠さない');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('D24-B7：version.json の版が違えば1回だけ読み込み直す・同じ版へは繰り返さない・同じなら何もしない', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({ size: H.SIZES.base }); const pg = p.page;
  let loads = 0; pg.on('load', () => { loads++; });
  await pg.waitForTimeout(2500);
  assert.equal(loads, 0, '同じ版なら読み込み直さない');
  await pg.route('**/version.json*', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"build":"9999-newer"}' }));
  await pg.reload(); loads = 0;
  await pg.waitForTimeout(6000);
  assert.equal(loads, 1, '違う版＝1回だけ読み込み直す（同じ版へは15分に1回まで＝繰り返さない）');
  assert.match(await pg.evaluate(() => sessionStorage.getItem('mmbuildReload')), /9999-newer/);
  assert.deepEqual(p.errors, []);
});
