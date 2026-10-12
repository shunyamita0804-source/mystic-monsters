// =========================================================
// 実ブラウザ：サイコロ演出の比較デモ（2026-10-12 開発23 B・PR #20 の比較試作。prototype/dice_1012/index.html）
//  DCB-1（375×667・390×844・430×932）：
//        最初のタップの前は SE を読み込まない・鳴らさない → START（最初のタップ）で SE を1回。既定は 1.30秒版（2026-10-12 第3便）＝B4 の長い版。
//        1.30秒版・0.93秒版それぞれ：出目 1〜6 を固定 → 止まった瞬間に正面の面＝出目・止まる時刻・回る間に面が4種類以上見える・
//        サイコロが画面の中で上の帯より下（見切れなし）・終わったら DOM も動きも残らない。2個：[a, b] の正面がそれぞれ a・b・札は合計・SE は1回だけ。
//        SE「なし」→ 鳴らさない。「旧B2・不採用候補」→ 0.93秒版でだけ選べる。旧の演出 → 正式 SE（01_dice_large_full）。
//        横はみ出しなし・JS エラーなし・404 なし
//  DCB-2（3サイズ × 1個／2個）：1.30秒版で連続10回（出目ランダム）＝10回とも出目が札と一致・SE 10回・止まったあとは何も残らない
//  QA_E2E=1 のときだけ実行
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
const URL_ = 'prototype/dice_1012/index.html';

async function launch(size) {
  const { chromium } = createRequire(import.meta.url)('playwright');
  const srv = await H.serve(), br = await chromium.launch();
  const pg = await br.newPage({ viewport: { width: size[0], height: size[1] } });
  const errors = [], bad = [];
  pg.on('pageerror', (e) => errors.push(String(e)));
  pg.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
  await pg.goto(srv.url + URL_); await pg.waitForFunction(() => window.MMDICE3D && window.MMCHD);
  return { pg, srv, errors, bad, close: async () => { await br.close(); await srv.close(); } };
}
const pick = (pg, seg, v) => pg.click(`#${seg} button[data-v="${v}"]`);
const roll = async (pg) => {
  await pg.click('#start');
  await pg.waitForFunction(() => !document.querySelector('.d3z,.chdz') && !document.querySelector('#start').disabled && /出目/.test(document.querySelector('#info').textContent), null, { timeout: 30000 });
  return pg.textContent('#info');
};
// 止まった瞬間（onLock）に、各サイコロの正面（カメラに一番向いている面）の目を読む。投げている間は毎フレーム、サイコロが画面の中・上の帯より下かを測る
const frontAtLock = (pg, vals, tempo) => pg.evaluate(async ({ vals, tempo }) => {
  const host = document.getElementById('host'), topBar = document.querySelector('.top').getBoundingClientRect().bottom; let front = null, run = true;
  const read = () => [...document.querySelectorAll('.d3-mv')].map((el) => {
    const M = new DOMMatrix(getComputedStyle(el.querySelector('.d3-cube')).transform);
    let best = null, bz = -2;
    for (const f of el.querySelectorAll('.d3-f')) { const n = M.multiply(new DOMMatrix(getComputedStyle(f).transform)).transformPoint({ x: 0, y: 0, z: 1, w: 0 }); if (n.z > bz) { bz = n.z; best = +f.dataset.v; } }
    return { v: +el.dataset.v, front: best, z: +bz.toFixed(3) };
  });
  const clip = { left: 1e9, right: -1e9, top: 1e9, bottom: -1e9, frames: 0, faces: new Set() };
  const tick = () => { if (!run) return; document.querySelectorAll('.d3-pv').forEach((p) => { const r = p.getBoundingClientRect(); if (!r.width) return; clip.left = Math.min(clip.left, r.left); clip.right = Math.max(clip.right, r.right); clip.top = Math.min(clip.top, r.top); clip.bottom = Math.max(clip.bottom, r.bottom); });
    const f = read()[0]; if (f && !front) clip.faces.add(f.front); clip.frames++; requestAnimationFrame(tick); };
  const t0 = performance.now(); let lockMs = null;
  requestAnimationFrame(tick);
  // 置き方はデモ（index.html の geo）と同じ：START から投げ・上の帯と下の操作欄の間の 42% に着地
  const hr = host.getBoundingClientRect(), sb = document.getElementById('start').getBoundingClientRect(), bottom = hr.height - 150;
  await MMDICE3D.play(vals.length === 2 ? vals : vals[0], { host, tempo, from: { x: sb.left + sb.width / 2 - hr.left, y: sb.top + sb.height / 2 - hr.top }, land: { x: hr.width / 2, y: topBar - hr.top + (bottom - (topBar - hr.top)) * 0.42 }, top: topBar - hr.top, onLock: () => { lockMs = performance.now() - t0; front = read(); } });
  run = false;
  return { front, lockMs, totalMs: performance.now() - t0, left: document.querySelectorAll('.d3z').length, anims: document.getAnimations().length,
    clip: { ...clip, faces: clip.faces.size }, vw: innerWidth, vh: innerHeight, topBar };
}, { vals, tempo });
const inside = (r) => r.clip.left >= -2 && r.clip.right <= r.vw + 2 && r.clip.top >= r.topBar - 2 && r.clip.bottom <= r.vh + 2;

for (const size of [[375, 667], [390, 844], [430, 932]]) {
  test(`DCB-1（${size.join('×')}）：1.30秒版（既定）と 0.93秒版・最初のタップから SE・出目 1〜6 の正面・2個・見切れなし・残像なし・SE なし／旧B2／旧の演出`, { skip: SKIP, timeout: 300000 }, async () => {
    const E = await launch(size), { pg } = E;
    try {
      // 最初のタップの前：音は読まない・鳴らさない
      await pg.waitForTimeout(400);
      assert.equal(E.srv.requests.filter((u) => /\.(ogg|m4a)$/.test(u)).length, 0, '最初のタップの前に SE を読み込まない');
      assert.equal(await pg.evaluate(() => (window.MM_SE_LOG || []).length), 0);
      assert.equal(await pg.textContent('#se .on'), 'B4（新）', '既定は B4 版');
      assert.equal(await pg.textContent('#tempo .on'), '1.30秒（新）', '既定は 1.30秒版');
      assert.ok(await pg.evaluate(() => document.querySelector('#se button[data-v="b2"]').disabled), '1.30秒版では旧B2 は選べない');
      // 1.30秒版・1個・出目 1〜6（UI から＝SE も鳴る）
      for (let v = 1; v <= 6; v++) {
        await pick(pg, 'val', v);
        const info = await roll(pg);
        assert.match(info, new RegExp(`出目 ${v}　止まるまで 1\\.(2[5-9]|3\\d|4[0-4])秒・全体 2\\.(0[5-9]|1\\d|2\\d)秒`), info);
      }
      const log = await pg.evaluate(() => window.MM_SE_LOG);
      assert.equal(log.length, 6, '1回の出目で SE は1回');
      assert.ok(log.every((x) => x.k === 'b4l' && /dice_magic_b4_long\.(ogg|m4a)$/.test(x.u) && Math.abs(x.dur - 1.595) < 0.05), JSON.stringify(log[0]));
      // 正面の面（止まった瞬間）＝出目・見切れなし・面が次々に見える・残像なし（1.30秒版と 0.93秒版）
      for (const [tempo, lo, hi] of [['long', 1250, 1450], ['short', 880, 1080]]) {
        for (let v = 1; v <= 6; v++) {
          const r = await frontAtLock(pg, [v], tempo);
          assert.deepEqual(r.front.map((x) => x.front), [v], `${tempo} 出目 ${v} ${JSON.stringify(r)}`);
          assert.ok(r.front[0].z > 0.95, '正面を向いて止まる');
          assert.ok(r.lockMs > lo && r.lockMs < hi, `${tempo} 止まるまで ${r.lockMs}`);
          assert.ok(inside(r), `${tempo} 画面の中・上の帯より下 ${JSON.stringify(r.clip)} ${r.topBar}`);
          assert.ok(r.clip.faces >= 4, `${tempo} 回る間に面が ${r.clip.faces} 種類見える`);
          assert.equal(r.left, 0, '終わったら何も残らない'); assert.equal(r.anims, 0, '動きも残らない');
        }
        // 2個
        for (const pair of [[1, 6], [5, 3], [2, 2], [4, 6], [3, 1], [6, 5]]) {
          const r = await frontAtLock(pg, pair, tempo);
          assert.deepEqual(r.front.map((x) => x.front), pair, JSON.stringify(r));
          assert.ok(inside(r), `${tempo} 2個 画面の中 ${JSON.stringify(r.clip)}`);
          assert.ok(r.lockMs > lo && r.lockMs < hi + 80, `${tempo} 2個 止まるまで ${r.lockMs}`);
          assert.equal(r.left, 0); assert.equal(r.anims, 0);
        }
      }
      await pick(pg, 'count', 2); await pick(pg, 'val', 4);
      const n0 = await pg.evaluate(() => window.MM_SE_LOG.length);
      assert.match(await roll(pg), /出目 4 \+ 4 = 8　止まるまで 1\.(2[5-9]|3\d|4\d)秒/);
      assert.equal(await pg.evaluate(() => window.MM_SE_LOG.length), n0 + 1, '2個でも SE は1回');
      // 0.93秒版（UI）＝前の B4 の音
      await pick(pg, 'tempo', 'short'); await pick(pg, 'count', 1);
      assert.match(await roll(pg), /出目 4　止まるまで 0\.9\d秒/);
      assert.equal(await pg.evaluate(() => window.MM_SE_LOG.at(-1).k), 'b4');
      // SE なし
      await pick(pg, 'se', 'off'); const n1 = await pg.evaluate(() => window.MM_SE_LOG.length);
      await roll(pg);
      assert.equal(await pg.evaluate(() => window.MM_SE_LOG.length), n1, 'SE なし＝鳴らさない');
      // 旧B2（不採用候補）＝0.93秒版でだけ選べる
      await pick(pg, 'se', 'b2'); await roll(pg);
      const b2 = await pg.evaluate(() => window.MM_SE_LOG.at(-1));
      assert.ok(b2.k === 'b2' && /dice_magic_b2_old\.(ogg|m4a)$/.test(b2.u), JSON.stringify(b2));
      await pick(pg, 'tempo', 'long');
      assert.equal(await pg.textContent('#se .on'), 'B4（新）', '1.30秒版へ戻すと B4 に戻る');
      // 旧の演出（今のゲーム）＝正式 SE
      await pick(pg, 'mode', 'old'); await pick(pg, 'val', 3);
      assert.match(await roll(pg), /出目 3　止まるまで 1\.\d\d秒/);
      const old = await pg.evaluate(() => window.MM_SE_LOG.at(-1));
      assert.ok(old.k === 'old' && /01_dice_large_full\.ogg$/.test(old.u), JSON.stringify(old));
      assert.ok(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '横はみ出しなし');
      assert.deepEqual(E.errors, []); assert.deepEqual(E.bad, []);
    } finally { await E.close(); }
  });
}

for (const size of [[375, 667], [390, 844], [430, 932]]) {
  for (const count of [1, 2]) {
    test(`DCB-2（${size.join('×')}・${count}個）：1.30秒版で連続10回（ランダム）＝札が出目どおり・SE 10回・何も残らない`, { skip: SKIP, timeout: 240000 }, async () => {
      const E = await launch(size), { pg } = E;
      try {
        // 出目はページが決める（Math.random）。札と照らすため、play に渡った値と tempo を覚える
        await pg.evaluate(() => { const p = MMDICE3D.play; window.__vals = []; window.MMDICE3D = { ...MMDICE3D, play: (v, o) => { window.__vals.push({ v: [].concat(v), tempo: o.tempo }); return p(v, o); } }; });
        await pick(pg, 'count', count); await pick(pg, 'rep', 10);
        await pg.click('#start');
        await pg.waitForFunction(() => window.__vals.length === 10 && !document.querySelector('.d3z') && !document.querySelector('#start').disabled, null, { timeout: 90000 });
        const r = await pg.evaluate(() => ({ vals: window.__vals, info: document.querySelector('#info').textContent, se: window.MM_SE_LOG, anims: document.getAnimations().length }));
        const last = r.vals.at(-1).v;
        assert.ok(r.info.includes(count === 2 ? `${last[0]} + ${last[1]} = ${last[0] + last[1]}` : `出目 ${last[0]}`), `${r.info} ${JSON.stringify(last)}`);
        assert.ok(r.vals.every((p) => p.tempo === 'long' && p.v.length === count && p.v.every((v) => v >= 1 && v <= 6)));
        assert.equal(r.se.length, 10, 'SE は1回の出目で1回＝10回'); assert.ok(r.se.every((x) => x.k === 'b4l'));
        assert.equal(r.anims, 0, '動き・残像が残らない');
        assert.deepEqual(E.errors, []); assert.deepEqual(E.bad, []);
      } finally { await E.close(); }
    });
  }
}
