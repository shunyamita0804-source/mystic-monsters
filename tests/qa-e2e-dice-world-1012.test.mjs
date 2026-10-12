// =========================================================
// 実ブラウザ：立体サイコロの本編組み込み（2026-10-12 開発23 B 正式採用。Chapter 1 の世界のボード＝js/chapter/world-board.js の playDie → MMDICE3D）
//  DW-1（375×667・390×844・430×932）：START で出目 1〜6 を順に＝止まった瞬間の正面の目＝出目（ov.dataset.final・セーブの出目と同じ）・
//        1回の START で SE は DICE_CUBE が1回だけ（旧 DICE_THROW は鳴らない＝二重にならない）・旧サイコロ（.chdz）は出ない・
//        回っている間は START・コマンドを押せない・ターンは1回ずつ・サイコロは画面の中で上の帯（HUD）より下・終わったら DOM も動きも残らない・横はみ出しなし
//  DW-2：視差を減らす設定＝回さない（出目の面のまま現れる）・出目と SE は同じ
//  QA_E2E=1 のときだけ実行
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
let L = null;
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });
const OPEN = [];
const openPage = async (o = {}) => { const p = await L.open({ worldCh1: true, ...o }); OPEN.push(p); return p; };
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close().catch(() => {}); });
const idle = (pg) => pg.waitForFunction(() => !bBusy && !MMDICE3D.isLocked() && !MMCHD.isLocked() && !document.querySelector('.wb-pop,.chf-enc2,.mmtalk,.chdz,.d3z'), null, { timeout: 30000 }).then(() => pg.waitForTimeout(300));
async function toBoard(pg) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); save(); board(); });
  await pg.waitForSelector('#wbw #brollbtn'); await idle(pg);
}
const place = (pg, node) => pg.evaluate((node) => { const r = S.m.raise, c = r.field.core; r.node = node; c.node = node; c.trail.push(node); c.moveLeft = 0; c.back = null; c.exclude = null; r.pend = null; save(); board(); }, node);

/** START を押して（出目 v に固定）、止まるまで毎フレーム見張る */
const rollWatch = (pg, v) => pg.evaluate(async (v) => {
  const se0 = MMAUDIO.seLog().length, hud = document.querySelector('#wbw .chh').getBoundingClientRect().bottom;
  const W = { frames: 0, left: 1e9, right: -1e9, top: 1e9, bottom: -1e9, faces: new Set(), front: null, final: null, result: null, old: false, startOn: false, cmdOn: false };
  const read = (el) => { const M = new DOMMatrix(getComputedStyle(el.querySelector('.d3-cube')).transform); let best = null, bz = -2;
    for (const f of el.querySelectorAll('.d3-f')) { const n = M.multiply(new DOMMatrix(getComputedStyle(f).transform)).transformPoint({ x: 0, y: 0, z: 1, w: 0 }); if (n.z > bz) { bz = n.z; best = +f.dataset.v; } } return best; };
  let run = true;
  const tick = () => {
    if (!run) return;
    if (document.querySelector('.chdz')) W.old = true;
    const ov = document.querySelector('.d3z');
    if (ov) {
      W.frames++; W.result = ov.dataset.result;
      const st = document.getElementById('brollbtn'); if (st && !st.disabled) W.startOn = true;
      if ([...document.querySelectorAll('#wb-ui button')].some((b) => !b.disabled && b.offsetParent)) W.cmdOn = true;
      document.querySelectorAll('.d3-pv').forEach((p) => { const r = p.getBoundingClientRect(); if (!r.width) return; W.left = Math.min(W.left, r.left); W.right = Math.max(W.right, r.right); W.top = Math.min(W.top, r.top); W.bottom = Math.max(W.bottom, r.bottom); });
      const mv = ov.querySelector('.d3-mv'); if (mv) { const f = read(mv); if (ov.dataset.final && W.front == null) { W.front = f; W.final = ov.dataset.final; } else if (!ov.dataset.final) W.faces.add(f); }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  const mr = Math.random; Math.random = () => (v - 0.5) / 6;
  document.getElementById('brollbtn').click();
  Math.random = mr;
  const used = S.m.raise.turnsUsed, saved = JSON.parse(localStorage.getItem('mr4v6')).m.raise;
  await new Promise((ok) => { const t0 = performance.now(); const w = () => (!document.querySelector('.d3z') && W.frames) || performance.now() - t0 > 8000 ? ok() : setTimeout(w, 50); w(); });
  run = false;
  return { ...W, faces: W.faces.size, se: MMAUDIO.seLog().slice(se0), hud, vw: innerWidth, vh: innerHeight, used, savedNode: saved.node,
    left0: document.querySelectorAll('.d3z,.d3-sh').length, anims: document.getAnimations().filter((a) => a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.d3z')).length };
}, v);

for (const size of [H.SIZES.se, H.SIZES.base, [430, 932]]) {
  test(`DW-1（${size.join('×')}）：本編の START で出目 1〜6＝止まった面・SE は DICE_CUBE の1回・旧サイコロなし・回る間は押せない・画面の中`, { skip: SKIP, timeout: 240000 }, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await toBoard(pg);
    for (let v = 1; v <= 6; v++) {
      await place(pg, 'START'); await idle(pg);
      const u0 = await pg.evaluate(() => S.m.raise.turnsUsed);
      const r = await rollWatch(pg, v);
      assert.equal(r.result, String(v), `出目 ${v} を渡した`);
      assert.equal(r.final, String(v)); assert.equal(r.front, v, `止まった瞬間の正面の目＝出目（${v}）`);
      assert.ok(r.faces >= 3, `回る間に面が次々に見える（${r.faces}種類）`);
      assert.equal(r.used, u0 + 1, 'ターンは1回（見せる前に確定）');
      assert.deepEqual(r.se.filter((n) => /^DICE/.test(n)), ['DICE_CUBE', 'DICE_STOP'], `SE は DICE_CUBE が1回だけ（DICE_STOP は silent）：${r.se}`);
      assert.equal(r.old, false, '旧サイコロ（.chdz）は出ない');
      assert.equal(r.startOn, false, '回る間は START を押せない'); assert.equal(r.cmdOn, false, '回る間はコマンドを押せない');
      assert.ok(r.left >= -2 && r.right <= r.vw + 2 && r.top >= r.hud - 2 && r.bottom <= r.vh + 2, `画面の中・HUD より下（${JSON.stringify({ l: r.left, r: r.right, t: r.top, b: r.bottom, hud: r.hud })}）`);
      assert.equal(r.left0, 0, '終わったら DOM が残らない'); assert.equal(r.anims, 0, '動きも残らない');
      await idle(pg);
      assert.notEqual(await pg.evaluate(() => S.m.raise.node), 'START', '出目のぶん進んだ');
    }
    assert.equal(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, '横にはみ出さない');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('DW-2：視差を減らす設定＝回さない・出目の面のまま・SE は同じ1回', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage(); const pg = p.page;
  await pg.emulateMedia({ reducedMotion: 'reduce' });
  await toBoard(pg);
  for (const v of [2, 5]) {
    await place(pg, 'START'); await idle(pg);
    const r = await rollWatch(pg, v);
    assert.equal(r.front, v); assert.equal(r.faces <= 1, true, `回さない（${r.faces}）`);
    assert.deepEqual(r.se.filter((n) => /^DICE/.test(n)), ['DICE_CUBE', 'DICE_STOP']);
    await idle(pg);
  }
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
