// =========================================================
// 2026-10-12 開発21 ⑤（実ブラウザ）：公式ランク戦の正式背景 E〜S・対戦前比較・VS・接地・状態異常の札
//  BE-1（E〜S の6ランク・3サイズを順に）：対戦表・対戦前比較・VS・実際のバトルの背景＝そのランクの正式背景（assets/battle/official_rank_1012/rank_X）・
//         読み込める・バトルではモンスターの足もとが床の輪（2026-10-13 開発25 B：絵の高さの約58〜72%。床の始まりは約55%）・HUD とモンスターが画面の中
//  BE-2（3サイズ）：対戦前比較＝立ち絵・名前の札・固有スキル・6能力の表・ボタンが重ならない・「対戦開始」は下から離れた
//  BE-3：VS の斜めの光は左上 → 右下（素材を左右反転）・モンスターの向きは従来どおり（自分＝右向き・相手＝反転）
//  BE-4：野生・ライバルの練習試合は Chapter の野外の背景（2026-10-12 試遊。Chapter 1＝はじまりの草原。無い Chapter は venue）・足もとが床・正式背景の拡大はしない
//  BE-5（3サイズ）：状態異常の札（まひ・ねむり）が HP の枠の中に見える（画面の中・ほかの物に隠れない）→ 治ると消える。性能は変えない
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
const openPage = async (o = {}) => { const p = await L.open(o); OPEN.push(p); return p; };
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close().catch(() => {}); });
const shot = (pg, n) => (process.env.MM_SHOT ? pg.screenshot({ path: `${process.env.MM_SHOT}/${n}.png` }) : null);
const SIZES = [[375, 667], [390, 844], [430, 932]];
const RN = ['E', 'D', 'C', 'B', 'A', 'S'];

async function toTour(pg, rank) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'テスト'; Object.assign(m, { li: 999, po: 999, in: 999, hi: 999, ev: 999, de: 999 }); MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); board(); });
  await pg.waitForSelector('#chrcv .rcv-row', { timeout: 20000 });
  await pg.evaluate((rank) => { if (rank > 1) { S.m.raise.ch = 4; MMP7.recordRankClear(S, S.m, rank - 1); } const r = MMP8.startTournament(S, S.m, rank, 7); if (!r.ok) throw new Error('startTournament'); save(); board(); }, rank);
  await pg.waitForSelector('.tb1 .tbgo', { timeout: 15000 });
}
const bgOf = (pg, q) => pg.evaluate((q) => { const e = document.querySelector(q); if (!e) return null; const s = e.tagName === 'IMG' ? e.getAttribute('src') : getComputedStyle(e).backgroundImage; return s; }, q);
const loaded = (pg, url) => pg.evaluate((u) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i.naturalWidth > 0); i.onerror = () => ok(false); i.src = u; }), url);

for (let rank = 0; rank < 6; rank++) {
  const size = SIZES[rank % 3];
  test(`BE-1（ランク${RN[rank]}・${size.join('×')}）：対戦表・比較・バトルの背景＝正式背景 rank_${RN[rank]}・足もとが床（2026-10-15：独立した VS の画面は出さない）`, { skip: SKIP, timeout: 150000 }, async () => {
    const p = await openPage({ size, tourvs: true, stage: true }); const pg = p.page;
    await toTour(pg, rank);
    const want = `assets/battle/official_rank_1012/rank_${RN[rank]}.webp`;
    assert.ok(await loaded(pg, './' + want), '正式背景が読める');
    assert.match(await bgOf(pg, '.tb1 .tbbgw'), new RegExp(want), '対戦表（2026-10-13 開発27（27）：引いた構図の絵は .tbbgw）');
    await pg.click('.tb1 .tbgo'); await pg.waitForSelector('.p9cmps .pcgo'); await pg.waitForTimeout(500);
    assert.match(await bgOf(pg, '.p9cmps .c2bg'), new RegExp(want), '対戦前比較（2026-10-15：新しいパラメーター比較）'); await shot(pg, `be1_cmp_${RN[rank]}_${size.join('x')}`);
    await pg.click('.pcgo');   // 2026-10-13 開発27（29）：1回の押下
    await pg.waitForSelector('#bt', { timeout: 10000 }); assert.equal(await pg.$('#tvs'), null, '2026-10-15：比較 → そのままバトル（VS の画面は出さない）');
    await pg.waitForSelector('#bt .mma-bg', { timeout: 20000 }); await pg.waitForSelector('#bt #m0 .mma-idle', { timeout: 20000 }); await pg.waitForTimeout(4200);
    const b = await pg.evaluate(() => { const bg = document.querySelector('#bt .mma-bg'), r = bg.getBoundingClientRect(), m = [0, 1].map((i) => document.querySelector(`#bt #m${i} .mma-idle`).getBoundingClientRect()), hp = [0, 1].map((i) => document.getElementById('hp' + i).getBoundingClientRect());
      return { src: bg.getAttribute('src'), ofc: bg.classList.contains('ofc'), floor: r.top + r.height * 0.555, top: r.top, h: r.height, feet: m.map((x) => x.bottom), mon: m.map((x) => [x.left, x.right, x.top]), hp: hp.map((x) => [x.left, x.right, x.top, x.bottom]), W: innerWidth, H: innerHeight, prac: document.getElementById('bt').dataset.mmprac || '' }; });
    assert.equal(b.src, './' + want, 'バトル'); assert.equal(b.ofc, true); assert.equal(b.prac, '');
    // 2026-10-13 開発25 B：足もとは床の始まり（絵の約55%）より手前の「床の輪」（絵の高さの約 58〜72%）に立つ
    for (const f of b.feet) { const k = (f - b.top) / b.h; assert.ok(k >= 0.58 && k <= 0.72, `足もとが床の輪（足 ${f.toFixed(0)}・絵の ${(k * 100).toFixed(1)}%・床の始まり ${b.floor.toFixed(0)}）`); }
    for (const [l, r, t] of b.mon) assert.ok(l >= -40 && r <= b.W + 40 && t >= 0, `モンスターは画面の中 ${JSON.stringify(b.mon)}`);
    for (const [l, r, t, bo] of b.hp) assert.ok(l >= 0 && r <= b.W + 1 && t >= 0 && bo <= b.H, 'HUD は画面の中');
    await shot(pg, `be1_bt_${RN[rank]}_${size.join('x')}`);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

for (const size of SIZES) {
  test(`BE-2（${size.join('×')}・2026-10-15 書き直し）：対戦前比較（新しいパラメーター比較）＝肩上アップ・名前の札・6能力・「対戦開始」が重ならない・画面の中`, { skip: SKIP, timeout: 120000 }, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await toTour(pg, 0);
    await pg.click('.tb1 .tbgo'); await pg.waitForSelector('.p9cmps .pcgo'); await pg.waitForTimeout(800);
    const r = await pg.evaluate(() => { const R = (e) => { const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom }; }, all = (q) => [...document.querySelectorAll(q)].map(R);
      return { duo: R(document.querySelector('.cmp2 .c2duo')), np: all('.cmp2 .c2n'), st: R(document.querySelector('.cmp2 .c2tbl')), go: R(document.querySelector('.pcgo')), H: innerHeight, W: innerWidth, sk: [...document.querySelectorAll('.cmp2 .c2n small')].map((e) => e.textContent) }; });
    const over = (a, b) => a.l < b.r - 1 && b.l < a.r - 1 && a.t < b.b - 1 && b.t < a.b - 1;
    assert.ok(!over(r.np[0], r.np[1]), '左右の名前の札は重ならない'); for (const n of r.np) assert.ok(n.b <= r.st.t + 1, '名前の札は表の上');
    assert.ok(r.st.b <= r.go.t, '表とボタンは重ならない'); assert.ok(r.go.b <= r.H - 8 && r.go.l >= 0 && r.go.r <= r.W, `「対戦開始」は画面の中 ${JSON.stringify(r.go)}`);
    assert.ok(r.sk.every((t) => /^スキル/.test(t) && t.length <= 14), '固有スキルは名前だけ（説明の長文は出さない）');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('BE-3（2026-10-15 書き直し）：独立した VS の画面は出さない＝比較の右（相手）は肩上アップを左右反転して中央を向く・左（自分）はそのまま', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({ tourvs: true }); const pg = p.page;
  await toTour(pg, 0);
  await pg.click('.tb1 .tbgo'); await pg.waitForSelector('.p9cmps .pcgo'); await pg.waitForTimeout(800);
  const v = await pg.evaluate(() => ({ me: getComputedStyle(document.querySelector('.cmp2 .c2side.me img')).transform, op: getComputedStyle(document.querySelector('.cmp2 .c2side.op img')).transform, vs: document.querySelector('.cmp2 .c2vs').textContent }));
  assert.equal(v.me, 'none'); assert.match(v.op, /^matrix\(-1, 0, 0, 1,/); assert.equal(v.vs, 'VS', '画面の中の小さな VS の飾り');
  await pg.click('.pcgo'); await pg.waitForSelector('#bt', { timeout: 10000 }); await pg.waitForTimeout(800);
  assert.equal(await pg.evaluate(() => document.querySelectorAll('#tvs, #bt .intro').length), 0);
  assert.deepEqual(p.errors, []);
});

test('BE-4：野生・ライバルの練習試合は Chapter の野外の背景・正式背景の拡大はしない', { skip: SKIP, timeout: 150000 }, async () => {
  for (const kind of ['wild', 'rival']) {
    const p = await openPage({ stage: true }); const pg = p.page;
    await H.newGame(pg, 'テスト');
    await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); save(); board(); });
    await pg.waitForSelector('#chf .chf-bg'); await pg.waitForTimeout(1200);
    await pg.evaluate((kind) => { const g = MMCH.graphFor(S.m), a = S.m.raise.field.nodeAssignments; const id = g.order.find((x) => a[x] && a[x].t === 'battle' && a[x].bt === kind) || (kind === 'rival' ? 'p5_0' : null); const r = S.m.raise; r.node = id; r.pend = { roll: 1, left: 0, stage: 'resolve' }; save(); board(); }, kind);
    await pg.waitForSelector('.chbat', { timeout: 20000 }); await pg.evaluate(() => bBattleGo());
    await pg.waitForSelector('#bt .mma-bg', { timeout: 20000 }); await pg.waitForTimeout(4000);
    const b = await pg.evaluate(() => { const bg = document.querySelector('#bt .mma-bg'); return { src: bg.getAttribute('src'), ofc: bg.classList.contains('ofc'), tf: getComputedStyle(bg).transform, feet: document.querySelector('#bt #m0 .mma-idle').getBoundingClientRect().bottom, H: innerHeight, r: bg.getBoundingClientRect() }; });
    assert.match(b.src, /assets\/battle\/field_1012\/ch1_meadow\.webp$/, `${kind}：Chapter 1 の野外（2026-10-12 開発23：正式の野外のバトル背景）`); assert.equal(b.ofc, false); assert.equal(b.tf, 'none');
    const floor = b.r.top + b.r.height * 0.45; assert.ok(b.feet >= floor - b.H * 0.03, `${kind}：足もとが床（足 ${b.feet}・床の始まり ${floor}）`);
    await shot(pg, `be4_${kind}`);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
    await p.ctx.close();
  }
});

for (const size of SIZES) {
  test(`BE-5（${size.join('×')}）：状態異常の札（まひ・ねむり）が HP の枠の中に見える → 治ると消える`, { skip: SKIP, timeout: 150000 }, async () => {
    const p = await openPage({ size, stage: true }); const pg = p.page;
    await toTour(pg, 0);
    await pg.evaluate(() => { S.m.eq = [3, 7, 3, 7, 3, 7]; save(); p8TourFight(); });   // 威力のない補助技だけ＝バトルが終わらない（tests/qa-e2e-rules-1006 と同じ）
    await pg.waitForSelector('#bt', { timeout: 15000 });
    const pressStop = async () => { if (await pg.evaluate(() => { const g = document.getElementById('go'); return !!g && !g.disabled && !g.classList.contains('bk'); })) await pg.click('#go').catch(() => {}); };
    for (let i = 0; i < 60 && !(await pg.evaluate(() => !!MMRULES.current())); i++) { await pressStop(); await pg.waitForTimeout(400); }
    // 発生（状態異常をかける＝技の判定と同じ処理 applyAilment）
    await pg.evaluate(() => { const st = MMRULES.stateOf(MMRULES.current()); MMRULES.applyAilment(st, 'A', 'paralysis'); MMRULES.applyAilment(st, 'B', 'sleep'); MMRULES.drawAil(); });
    await pg.waitForTimeout(300);
    const look = () => pg.evaluate(() => [0, 1].map((i) => { const b = document.querySelector(`#mmail${i} span`); if (!b) return null; const r = b.getBoundingClientRect(), hp = document.getElementById('hp' + i).getBoundingClientRect(), c = getComputedStyle(b);
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { tx: b.textContent, w: r.width, h: r.height, inHp: r.left >= hp.left - 1 && r.right <= hp.right + 1 && r.top >= hp.top - 1 && r.bottom <= hp.bottom + 1, inView: r.top >= 0 && r.bottom <= innerHeight, op: +c.opacity, vis: c.visibility, front: !!top && (top === b || b.contains(top)) }; }));
    const vis0 = await look();
    assert.match(vis0[0].tx, /^まひ3$/); assert.match(vis0[1].tx, /^ねむり2$/);
    // 2026-10-13 開発24：技の発動中は HUD（札を含む）を隠す仕様＝見え方は発動していない間に確かめる（その間に1回分減ることがある）
    await pg.waitForFunction(() => !document.getElementById('bt').classList.contains('mma-cine'), null, { timeout: 8000 }); await pg.waitForTimeout(250);
    const vis = (await look()).filter(Boolean);
    assert.ok(vis.length >= 1 && vis.every((v) => /^(まひ[1-3]|ねむり[12])$/.test(v.tx)), JSON.stringify(vis));
    for (const v of vis) assert.ok(v.w > 20 && v.h >= 12 && v.inHp && v.inView && v.op === 1 && v.vis === 'visible' && v.front, `札が見える ${JSON.stringify(v)}`);
    await shot(pg, `be5_${size.join('x')}`);
    // 継続 → 解除（バトルを進めて、ねむりは2回の機会で起きる＝札が消える。まひは回数が減る）
    let seen = []; for (let i = 0; i < 80; i++) { await pressStop(); await pg.waitForTimeout(350); const t = await pg.evaluate(() => [0, 1].map((k) => (document.getElementById('mmail' + k) || {}).textContent || '')); if (seen[seen.length - 1] !== t.join('|')) seen.push(t.join('|')); if (!t[1] && /まひ[12]/.test(t[0])) break; }
    assert.ok(seen.some((x) => /^まひ[12]\|/.test(x)), `まひの回数が減って表示が続く ${JSON.stringify(seen)}`);
    assert.ok(seen.some((x) => /\|$/.test(x) && !/ねむり/.test(x)), `ねむりが治ると札が消える ${JSON.stringify(seen)}`);
    await pg.evaluate(() => { MMRULES.cureAll(MMRULES.stateOf(MMRULES.current()), 'A'); MMRULES.drawAil(); });
    assert.deepEqual(await pg.evaluate(() => [0, 1].map((i) => document.getElementById('mmail' + i).children.length)), [0, 0], '治ると札が消える');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}
