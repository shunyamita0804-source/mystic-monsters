// =========================================================
// 2026-10-20 第5便（実ブラウザ・QA_E2E=1 のときだけ）
//  R5-E1（Chapter 1〜4 × A／B／C）：盤の配置（MMWB.world().layout()）＝道をまたがない建物が描いた道・マスにかからない・マスどうしが重ならない・別の道どうしが交わらない
//  R5-E2：分かれ道で各道の上に色の矢印（F05）・選択肢のボタンに同じ色の印・選んだら消す
//  R5-E3：ライバル登場＝F04 の背景・リュウは床の上（足＝画面の約 75%）・声の字幕は幕の中（フィナの一言のあとに声の会話を出さない）
//  R5-E4：レアの遭遇＝Chapter の全画面の背景・カードは「野外で、特別なモンスターを見つけた！」と「名前（レアモンスター）」だけ
//  R5-E5：Chapter 2 の海底の道・広場・トンネル（F01・F02）の素材が WebGL の盤に読めている
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
let L = null;
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });
const OPEN = [];
const openPage = async (o) => { const p = await L.open({ worldCh1: true, worldCh2: true, worldCh3: true, worldCh4: true, ...o }); OPEN.push(p); return p; };
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close().catch(() => {}); });
const idle = (pg) => pg.waitForFunction(() => !bBusy && !MMDICE3D.isLocked() && !document.querySelector('.wb-pop,.chf-enc2,.mmtalk,.chdz,.wbrelay'), null, { timeout: 60000 }).then(() => pg.waitForTimeout(300));
const ready = (pg) => pg.waitForSelector('#wbw #brollbtn', { timeout: 90000 }).then(() => idle(pg));
const place = (pg, node, tile) => pg.evaluate(([node, tile]) => { const r = S.m.raise, f = r.field, c = f.core; r.node = node; c.node = node; c.trail.push(node); c.moveLeft = 0; c.back = null; c.exclude = null; if (tile) { f.tiles[node] = tile; delete f.used[node]; } r.pend = { stage: 'resolve' }; save(); board(); }, [node, tile]);

//  盤の配置の検査（ページの中で）：数を返す
const AUDIT = () => {
  const v = MMWB.world().layout(), rw = v.roadW, tw = v.tileW, R = Object.fromEntries(Object.entries(v.plan.r).filter(([, x]) => x > 0)), T = Object.fromEntries(v.tiles.map((t) => [t.id, t]));
  const dseg = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1e-9, t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)); return Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dy * t); };
  const dline = (p, P) => { let m = 1e9; for (let i = 0; i < P.length - 1; i++) m = Math.min(m, dseg(p, P[i], P[i + 1])); return m; };
  const cr = (o, p, q) => (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]);
  let touch = 0, props = [], cross = 0;
  for (const ln of v.lines) for (let i = 0; i < ln.ids.length - 1; i++) { const a = T[ln.ids[i]], b = T[ln.ids[i + 1]]; if (R[a.id] || R[b.id]) continue; if (Math.hypot(a.x - b.x, a.y - b.y) - tw / 2 * ((a.k || 1) + (b.k || 1)) < 1) touch++; }
  for (const p of v.props) { if (/rfw-front|rfw-goal|rfw-bpost|rfw-bmark|rfw-mark/.test(p.cls) || !p.arch) continue; const r = p.w * 0.34, dl = Math.min(...v.lines.map((l) => dline([p.x, p.y], l.P))), dt = Math.min(...v.tiles.map((t) => Math.hypot(p.x - t.x, p.y - t.y)));
    if (Math.max(rw / 2 + r - dl, tw / 2 + r - dt) > 0.5) props.push(p.file); }
  for (let i = 0; i < v.lines.length; i++) for (let j = i + 1; j < v.lines.length; j++) { const A = v.lines[i], B = v.lines[j], sh = [A.ids[0], A.ids.at(-1)].filter((e) => B.ids[0] === e || B.ids.at(-1) === e).map((e) => T[e]);
    for (let q = 0; q < A.P.length - 1; q++) for (let r = 0; r < B.P.length - 1; r++) { const a = A.P[q], b = A.P[q + 1], c = B.P[r], d = B.P[r + 1];
      if (cr(c, d, a) * cr(c, d, b) < 0 && cr(a, b, c) * cr(a, b, d) < 0 && !sh.some((s) => Math.hypot(a[0] - s.x, a[1] - s.y) < (R[s.id] || 0) + rw)) cross++; } }
  return { touch, props, cross, tiles: v.tiles.length };
};
for (const ch of [1, 2, 3, 4]) {
  test(`R5-E1（Chapter ${ch} A／B／C）：建物は道・マスにかからない・マスは重ならない・道は交わらない`, { skip: SKIP, timeout: 400000 }, async () => {
    for (const r of ['A', 'B', 'C']) {
      const p = await openPage({ size: H.SIZES.base, query: `?ch${ch}trial=${r}&qaSeed=1` }); const pg = p.page; await ready(pg);
      const a = await pg.evaluate(AUDIT);
      assert.equal(a.touch, 0, `${ch}${r}：重なるマス`); assert.deepEqual(a.props, [], `${ch}${r}：道・マスにかかる建物`); assert.equal(a.cross, 0, `${ch}${r}：交わる道`);
      assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
      await p.ctx.close();
    }
  });
}

test('R5-E2：分かれ道の矢印と選択の色の印・選んだら消す', { skip: SKIP, timeout: 180000 }, async () => {
  const p = await openPage({ size: H.SIZES.base, query: '?ch1trial=A&qaSeed=1' }); const pg = p.page; await ready(pg);
  await pg.evaluate(() => MMQAJ.jump('S01_07')); await idle(pg);
  await pg.evaluate(() => { window.__mr = Math.random; Math.random = () => (2 - 0.5) / 6; }); await pg.click('#brollbtn'); await pg.evaluate(() => { Math.random = window.__mr; });
  await pg.waitForSelector('.wbbr .chroute', { timeout: 30000 }); await pg.waitForTimeout(900);
  const a = await pg.evaluate(() => ({ n: document.querySelectorAll('.wbbr .chroute').length, ar: [...document.querySelectorAll('.rfw-arrow')].map((e) => ({ src: e.getAttribute('src').split('/').pop(), ok: e.complete && e.naturalWidth > 0, z: getComputedStyle(e.parentElement).zIndex })),
    bd: [...document.querySelectorAll('.wbbr .chroute .wbfk')].map((e) => getComputedStyle(e).backgroundImage.split('/').pop().replace(/["')]/g, '')), rot: [...document.querySelectorAll('.wbfk>i')].every((e) => /rotate/.test(e.style.transform)) }));
  assert.ok(a.n >= 2); assert.equal(a.ar.length, a.n, '道ごとに矢印'); assert.ok(a.ar.every((x) => x.ok), '矢印の絵が読めている');
  assert.deepEqual(a.ar.map((x) => x.src), ['arrow_gold.webp', 'arrow_blue.webp', 'arrow_green.webp'].slice(0, a.n));
  assert.deepEqual(a.bd, ['badge_gold.webp', 'badge_blue.webp', 'badge_green.webp'].slice(0, a.n), 'ボタンに同じ色の印'); assert.ok(a.rot, '印の中の矢印は画面の向き');
  assert.equal(a.ar[0].z, '2', '平面は WebGL の地面の上');
  await pg.click('.wbbr .chroute'); await idle(pg);
  assert.equal(await pg.evaluate(() => document.querySelectorAll('.rfw-arrow').length), 0, '選んだら消す');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('R5-E3：ライバル登場＝F04・リュウは床の上・声の字幕は幕の中（そのあとの声の会話なし）', { skip: SKIP, timeout: 240000 }, async () => {
  const p = await openPage({ size: H.SIZES.base, query: '?ch1trial=A&qaSeed=1' }); const pg = p.page; await ready(pg);
  await pg.evaluate(() => { window.MM_QA_NO_STORY = false; window.MM_QA_NO_NPC = false; window.__ryuTalk = 0; const t = MMNPC.talk; MMNPC.talk = function (L, o) { if (Array.isArray(L) && L.some((l) => l && l.npc === 'ryu')) window.__ryuTalk++; return t.apply(this, arguments); }; });
  await place(pg, 'RIVAL', null);
  await pg.waitForSelector('.wbx-r.p2', { timeout: 20000 }); await pg.waitForTimeout(900);
  const a = await pg.evaluate(() => { const r = document.querySelector('.wbx-r'), ry = r.querySelector('.wbx-ryu').getBoundingClientRect(), sub = r.querySelector('.wbx-rsub');
    return { bg: r.querySelector('.wbx-rbg').getAttribute('src'), foot: ry.bottom / innerHeight, top: ry.top, sub: sub.textContent, on: sub.classList.contains('on'), plate: getComputedStyle(r.querySelector('.wbx-card.r')).backgroundImage, line: MMAUDIO.voiceLine('ryu_008') }; });
  assert.match(a.bg, /rival_1020\/rival_bg\.webp/); assert.match(a.plate, /rival_nameplate\.webp/);
  assert.ok(a.foot > 0.68 && a.foot < 0.82, `リュウの足は床の上（${a.foot.toFixed(2)}）`); assert.ok(a.top > 40, 'リュウは上に寄りすぎない');
  assert.ok(a.on && a.sub.includes(a.line), `字幕＝声の書き起こし（${a.sub}）`);
  const seen = []; const t0 = Date.now();
  while (Date.now() - t0 < 60000 && !(await pg.$('#bt'))) { if (await pg.$('.wbx-r')) await pg.click('.wbx-r', { force: true }).catch(() => {}); const s = await pg.evaluate(() => (document.querySelector('.mmtalk:not(.mmtalk-out)') && MMNPC.state() ? MMNPC.state().npc : null)); if (s) { seen.push(s); await pg.click('.mmtalk:not(.mmtalk-out)', { force: true }).catch(() => {}); } await pg.waitForTimeout(300); }
  assert.ok(await pg.$('#bt'), 'そのままバトル'); assert.equal(await pg.evaluate(() => window.__ryuTalk), 0, '幕のあとにリュウの声の会話を出さない（声は幕の中）');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('R5-E4：レアの遭遇＝Chapter の全画面の背景・カードの文', { skip: SKIP, timeout: 240000 }, async () => {
  for (const ch of [1, 3]) {
    const p = await openPage({ size: H.SIZES.base, query: `?ch${ch}trial=A&qaSeed=1` }); const pg = p.page; await ready(pg);
    await place(pg, 'S01_04', { t: 'wild', rare: true });
    await pg.waitForSelector('.wbx-rare', { timeout: 20000, state: 'attached' }); await pg.waitForTimeout(700);
    const a = await pg.evaluate(() => { const e = document.querySelector('.wbx-rare'); return { bg: e.querySelector('.wbx-rabg').getAttribute('src'), sm: e.querySelector('.wbx-racard small').textContent, b: e.querySelector('.wbx-racard b').textContent, all: e.textContent, frame: getComputedStyle(e.querySelector('.wbx-racard')).backgroundImage, mon: e.querySelector('.wbx-mon').getAttribute('src') }; });
    assert.match(a.bg, new RegExp(`rare_1020/rare_bg_ch${ch}\\.webp`)); assert.match(a.frame, /rare_card_frame\.webp/);
    assert.equal(a.sm, '野外で、特別なモンスターを見つけた！'); assert.match(a.b, /^.+（レアモンスター）$/); assert.doesNotMatch(a.all, /★|Lv|調べる|逃げる/);
    await pg.waitForSelector('#bt', { timeout: 30000 });
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
    await p.ctx.close();
  }
});

test('R5-E5：Chapter 2 の海底の道・広場・トンネルの素材（WebGL）', { skip: SKIP, timeout: 180000 }, async () => {
  const p = await openPage({ size: H.SIZES.base, query: '?ch2trial=A&qaSeed=1' }); const pg = p.page; await ready(pg);
  await pg.waitForFunction(() => MMWB.world().gl() && !MMWB.world().gl().pending, null, { timeout: 120000 });
  const st = await pg.evaluate(() => MMWB.world().gl());
  for (const k of ['glassFloor', 'glassCurb', 'sunkenRoad', 'sunkenCurb', 'sunkenPlaza', 'tunnelGlass', 'tunnelRib']) assert.equal(st.tex[k], true, k);
  const g = await pg.evaluate(() => [...document.querySelectorAll('.rfw img.rfw-front')].map((i) => i.getAttribute('src').split('/').pop()));
  for (const f of ['ch2_descent_gate_front.webp', 'portal_front.webp']) assert.ok(g.includes(f), `正面の門 ${f}`);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
