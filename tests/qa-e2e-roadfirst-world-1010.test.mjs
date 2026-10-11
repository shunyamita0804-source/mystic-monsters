// =========================================================
// 実ブラウザ：1枚の世界ビュー（2026-10-10・絵なしの技術検証・?chapterBoard=roadfirst&rfView=world）
//  RWB-1 390×844・375×667：開始の俯瞰（傾き0・題字・HUD を隠す・操作できない）→ START へ寄って傾ける → 実際の MMRF.roll／choose で
//        START → J0 → 右の道 → ER2 → R_CHEST の枝の行き止まり → 戻る。止まるたびに「先の地点（6マス先・分かれ目は3マスずつ）」と
//        モンスターが空いている所（上の帯・右の道具・下の操作に重ならない）・横にはみ出さない・JS の例外 0
//  RWB-2 再読み込みで同じ地点・俯瞰は出ない・連打しても1ターン・「最初から」でまた俯瞰
//  RWB-3 重さ：CPU を4倍遅くして移動中のフレームの間隔を測る（iPhone 実機ではない＝目安）
//  RWB-4 フラグなし（?chapterBoard=roadfirst だけ）は世界ビューを作らない
//  RWB-5 ボード素材の試し貼り（&rfArt=1010）：絵がすべて読める（404 なし）・道は直線の石の道を並べる・START／固定報酬の専用マス・目印・谷のふちの線・区画を描き終える・JS の例外 0
//  QA_E2E=1 のときだけ。スクリーンショットは RF_SHOT_DIR があるときだけ
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
let L, opened = [];
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });
async function open(opt = {}) { for (const q of opened) await q.ctx.close().catch(() => {}); const p = await L.open(opt); opened = [p]; return p; }
const SHOT = process.env.RF_SHOT_DIR || null;
const shot = (pg, name) => (SHOT ? pg.screenshot({ path: `${SHOT}/${name}.png` }) : null);
const URL_W = '?chapterBoard=roadfirst&rfView=world' + (process.env.RF_URL_EXTRA || '') + '&rfRand=closed&rfSeed=';   // RF_URL_EXTRA＝'&rfArt=1010' で絵を貼った状態でも同じ確かめ
const overlap = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

async function boot(pg, seed) { await pg.goto(L.url + 'index.html' + URL_W + seed); await pg.waitForSelector('#rfp .rfw'); }
const idle = (pg) => pg.waitForFunction(() => !MMRF.busy() && !MMRF.world().intro, null, { timeout: 15000 });
/** 止まった地点で：先の地点とモンスターが空いている所に入っているか（カメラが落ち着いてから測る） */
async function measure(pg) {
  await pg.waitForTimeout(900);
  return pg.evaluate(() => {
    const bx = (e) => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom]; };
    const w = MMRF.world(), D = MMRF_DATA, v = w.view;
    const pts = w.ahead.map((id) => { const n = D.nodes[id], q = MMRF.worldProject(n[0], n[1]); return { id, x: q.x, y: q.y }; });
    return { node: MMRF.state().node, s: w.cam.s, tilt: w.cam.tilt, view: v, pts, ahead: w.ahead.length,
      mon: bx(document.querySelector('#rfp .rfw-mon img')), top: bx(document.querySelector('#rfp .rf-top')), tools: bx(document.querySelector('#rfp .rf-tools')),
      bot: bx(document.querySelector('#rfp .rf-bot')), sw: document.documentElement.scrollWidth, iw: innerWidth };
  });
}
function check(m, label) {
  assert.ok(Math.abs(m.tilt - 40) < 0.5, `${label}：傾き ${m.tilt}`);
  for (const p of m.pts) {
    assert.ok(p.x >= 0 && p.x <= m.view.right + 1 && p.y >= m.view.top - 1 && p.y <= m.view.bottom + 1, `${label}：先の地点 ${p.id} (${p.x | 0},${p.y | 0}) は空いている所 ${JSON.stringify(m.view)}`);
  }
  for (const [k, b] of [['上の帯', m.top], ['右の道具', m.tools], ['下の操作', m.bot]]) assert.ok(!overlap(m.mon, b), `${label}：モンスターが ${k} に重ならない ${m.mon} / ${b}`);
  assert.ok(m.sw <= m.iw, `${label}：横にはみ出さない`);
}
/** 出目を選んで target にちょうど止まる（実際の MMRF.roll・choose）。route＝通る地点の並び */
async function walkTo(pg, target, route, pickSeg) {
  for (let i = 0; i < 60; i++) {
    await idle(pg);
    const r = await pg.evaluate(({ target, route, pickSeg }) => {
      const s = MMRF.state(), D = MMRF_DATA;
      if (s.node === target && !s.moveLeft) return { done: true };
      if (s.play.notice && s.play.notice.kind === 'choice') { MMRF.choice(0); return {}; }
      if (MMRF_CORE.needsChoice(D, s)) { const op = MMRF_CORE.options(D, s).map((e) => e.seg); MMRF.choose(op.find((x) => pickSeg.includes(x)) || op[0]); return {}; }
      if (s.play.fat >= 100) { MMRF.rest(); return {}; }
      const a = route.indexOf(s.node), b = route.indexOf(target); if (a < 0 || b <= a) return { err: `${target} へ行けない（${s.node}）` };
      MMRF.roll(Math.min(6, b - a)); return {};
    }, { target, route, pickSeg });
    if (r.err) throw new Error(r.err);
    if (r.done) return;
  }
  throw new Error('着かない');
}

for (const size of [[390, 844], [375, 667]]) {
  test(`RWB-1：${size.join('×')}：俯瞰 → START へ寄る → 追従（6マス先が空いている所）・行き止まりへ往復`, { skip: SKIP, timeout: 300000 }, async () => {
    const p = await open({ size }); const pg = p.page, errs = []; pg.on('pageerror', (e) => errs.push(String(e)));
    const tag = size.join('x');
    await boot(pg, 31);
    await pg.waitForTimeout(400);
    const ov = await pg.evaluate(() => ({ w: MMRF.world(), busy: MMRF.busy(), hud: getComputedStyle(document.querySelector('#rfp .rf-top')).opacity, title: getComputedStyle(document.querySelector('#rfp .rfw-title')).opacity }));
    assert.equal(ov.w.intro, true, '開始の俯瞰'); assert.equal(ov.w.cam.tilt, 0, '俯瞰は傾けない'); assert.ok(ov.busy, '俯瞰の間は操作できない');
    assert.equal(Number(ov.title), 1, '題字'); assert.ok(Number(ov.hud) < 0.5, 'HUD を隠す');
    await shot(pg, `RWB-1_${tag}_0_overview`);
    assert.equal(await pg.evaluate(() => { MMRF.roll(3); return MMRF.state().turn; }), 0, '俯瞰の間はサイコロが振れない');
    await idle(pg);
    let m = await measure(pg); assert.equal(m.node, 'START'); assert.equal(m.ahead, 6, 'START では6マス先'); check(m, `${tag} START`); await shot(pg, `RWB-1_${tag}_1_start`);
    const D = await pg.evaluate(() => ({ S01: MMRF_DATA.segments.S01[3], ER01: MMRF_DATA.segments.ER01[3], ER02: MMRF_DATA.segments.ER02[3], D_RC: MMRF_DATA.segments.D_RC[3] }));
    const route = [...new Set([...D.S01, ...D.ER01, ...D.ER02, ...D.D_RC])];
    for (const t of ['S01_04', 'J0']) { await walkTo(pg, t, route, ['ER01', 'D_RC']); m = await measure(pg); check(m, `${tag} ${t}`); }
    assert.equal(m.ahead, 6, 'J0 では左右3マスずつ'); await shot(pg, `RWB-1_${tag}_2_J0`);
    for (const t of ['ER01_04', 'ER1', 'ER2', 'D_RC_02', 'R_CHEST']) { await walkTo(pg, t, route, ['ER01', 'D_RC']); m = await measure(pg); check(m, `${tag} ${t}`); }
    assert.ok(m.ahead >= 4 && m.pts.every((q) => q.id.startsWith('D_RC_') || q.id === 'ER2'), `行き止まりでは戻り道を見せる ${m.pts.map((q) => q.id)}`);
    await shot(pg, `RWB-1_${tag}_3_R_CHEST`);
    // 行き止まりから戻る：先の地点は枝を逆に
    await idle(pg); await pg.evaluate(() => { const s = MMRF.state(); if (s.play.notice) MMRF.ok(); });
    await pg.evaluate(() => MMRF.roll(2)); await idle(pg); await pg.evaluate(() => { const s = MMRF.state(); if (s.play.notice && s.play.notice.kind === 'choice') MMRF.choice(0); });
    m = await measure(pg); check(m, `${tag} 戻り道 ${m.node}`);
    assert.ok(m.pts.every((q) => q.id.startsWith('D_RC_') || q.id === 'ER2'), `戻り道の先は枝の中 ${m.pts.map((q) => q.id)}`);
    assert.deepEqual(errs, [], 'JS の例外 0');
  });
}

test('RWB-2：再読み込みで同じ地点・俯瞰は出ない・連打しても1ターン・最初からでまた俯瞰', { skip: SKIP, timeout: 200000 }, async () => {
  const p = await open({ size: [390, 844] }); const pg = p.page;
  await boot(pg, 44); await idle(pg);
  await pg.evaluate(() => MMRF.roll(4)); await idle(pg);
  const s0 = await pg.evaluate(() => MMRF.state());
  await boot(pg, 44); await pg.waitForTimeout(300);
  const w = await pg.evaluate(() => ({ w: MMRF.world(), s: MMRF.state() }));
  assert.equal(w.w.intro, false, '再読み込みでは俯瞰を出さない'); assert.equal(w.s.node, s0.node); assert.equal(w.s.turn, s0.turn);
  await idle(pg); await pg.evaluate(() => { const s = MMRF.state(); if (s.play.notice) MMRF.ok(); });
  const t0 = await pg.evaluate(() => MMRF.state().turn);
  await pg.evaluate(() => { const b = document.querySelector('#rfp .rf-go'); for (let i = 0; i < 5; i++) b.click(); });
  await idle(pg); await pg.waitForTimeout(200);
  assert.equal(await pg.evaluate(() => MMRF.state().turn), t0 + 1, '連打しても1ターン');
  await pg.evaluate(() => MMRF.reset({ seed: 9, randOpen: false }));
  assert.equal(await pg.evaluate(() => MMRF.world().intro), true, '最初からでまた俯瞰');
});

test('RWB-3：重さ（CPU 4倍遅く・移動中のフレームの間隔。iPhone 実機ではない目安）', { skip: SKIP, timeout: 200000 }, async () => {
  const p = await open({ size: [390, 844] }); const pg = p.page;
  await boot(pg, 12); await idle(pg);
  const cdp = await pg.context().newCDPSession(pg); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await pg.evaluate(() => MMRF.worldFrames(true));
  for (let i = 0; i < 4; i++) { await pg.evaluate(() => { const s = MMRF.state(); if (s.play.notice && s.play.notice.kind === 'choice') MMRF.choice(0); else if (s.play.notice) MMRF.ok(); });
    const need = await pg.evaluate(() => MMRF_CORE.needsChoice(MMRF_DATA, MMRF.state())); if (need) await pg.evaluate(() => MMRF.choose(MMRF_CORE.options(MMRF_DATA, MMRF.state())[0].seg)); else await pg.evaluate(() => MMRF.roll(3));
    await idle(pg); }
  const f = (await pg.evaluate(() => MMRF.worldFrames(true))).filter((x) => x > 0).sort((a, b) => a - b);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  const q = (r) => f[Math.min(f.length - 1, Math.floor(r * f.length))];
  console.log(`RWB-3 frames=${f.length} median=${q(0.5).toFixed(1)}ms p95=${q(0.95).toFixed(1)}ms max=${f[f.length - 1].toFixed(1)}ms`);
  assert.ok(f.length > 60, 'フレームを測れた');
  assert.ok(q(0.5) < 40, `中央値 ${q(0.5).toFixed(1)}ms（CPU 4倍遅くても 25fps 以上）`);
});

test('RWB-4：フラグなしは世界ビューを作らない', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await open({ size: [390, 844] }); const pg = p.page;
  await pg.goto(L.url + 'index.html?chapterBoard=roadfirst&rfSeed=3'); await pg.waitForSelector('#rfp .rf-go');
  assert.equal(await pg.evaluate(() => !!document.querySelector('#rfp .rfw')), false);
  assert.equal(await pg.evaluate(() => MMRF.world()), null);
});

test('RWB-5：ボード素材の試し貼り（&rfArt=1010）＝絵がすべて読める・直線の石の道・専用マス・目印', { skip: SKIP, timeout: 200000 }, async () => {
  const p = await open({ size: [390, 844] }); const pg = p.page, errs = [], bad = [];
  pg.on('pageerror', (e) => errs.push(String(e)));
  pg.on('response', (r) => { if (r.url().includes('board_art_1010') && r.status() >= 400) bad.push(r.url()); });
  await pg.goto(L.url + 'index.html?chapterBoard=roadfirst&rfView=world&rfArt=1010&rfRand=closed&rfSeed=31'); await pg.waitForSelector('#rfp .rfw'); await idle(pg);
  await pg.waitForFunction(() => document.querySelector('#rfp .rfw.art'), null, { timeout: 10000 });
  const r = await pg.evaluate(async () => {
    const imgs = [...document.querySelectorAll('#rfp .rfw-prop')]; await Promise.all(imgs.map((i) => i.decode().catch(() => null)));
    return { w: MMRF.world(), props: imgs.length, broken: imgs.filter((i) => !i.naturalWidth).map((i) => i.src), lm: document.querySelectorAll('#rfp .rfw-lm').length,
      start: document.querySelector('#rfp .rfw-tile[data-node="START"] img').getAttribute('src'), reward: document.querySelector('#rfp .rfw-tile[data-node="R_CHEST"] img').getAttribute('src') };
  });
  assert.equal(r.w.art, true, '地面と道の絵'); assert.deepEqual(r.broken, [], '景物の絵が読める'); assert.deepEqual(bad, [], '404 なし');
  assert.equal(r.lm, 2, 'START の門・R_CHEST の見張り台'); assert.ok(r.props > 100);
  await pg.waitForFunction(() => MMRF.world().painted, null, { timeout: 20000 });
  const w2 = await pg.evaluate(() => MMRF.world()); assert.ok(w2.rims && w2.rims.length >= 3 && w2.rims.every((n) => n > 50), `谷のふちの線 ${w2.rims}`);
  assert.match(r.start, /tile_start\.webp$/); assert.match(r.reward, /tile_reward\.webp$/);
  assert.deepEqual(errs, [], 'JS の例外 0');
});
