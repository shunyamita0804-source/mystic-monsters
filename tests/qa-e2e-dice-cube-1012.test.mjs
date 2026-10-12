// =========================================================
// 実ブラウザ：サイコロ演出の比較デモ（2026-10-12 開発23 B・PR #20 の比較試作。prototype/dice_1012/index.html）
//  DCB-1（375×667・390×844・430×932）：
//        最初のタップの前は SE を読み込まない・鳴らさない → START（最初のタップ）で B4 版の SE を1回。
//        新：出目 1〜6 を固定して1個ずつ → 止まった瞬間に正面の面＝出目・札の出目＝出目・止まるまで 0.8〜1.1秒。
//        2個：[a, b] の正面の面がそれぞれ a・b・札は合計・SE は1回だけ。
//        SE「なし」→ 鳴らさない。「旧B2・不採用候補」→ 旧 B2 版を鳴らす。旧の演出 → 正式 SE（01_dice_large_full）。
//        横はみ出しなし・JS エラーなし・404 なし
//  DCB-2（390×844）：連続10回（出目ランダム・2個）＝10回とも出目が札と一致・SE 10回・止まったあとは何も残らない
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
// 止まった瞬間（onLock）に、各サイコロの正面（カメラに一番向いている面）の目を読む
const frontAtLock = (pg, vals) => pg.evaluate(async (vals) => {
  const host = document.getElementById('host'); let front = null;
  const read = () => [...document.querySelectorAll('.d3-mv')].map((el) => {
    const M = new DOMMatrix(getComputedStyle(el.querySelector('.d3-cube')).transform);
    let best = null, bz = -2;
    for (const f of el.querySelectorAll('.d3-f')) { const n = M.multiply(new DOMMatrix(getComputedStyle(f).transform)).transformPoint({ x: 0, y: 0, z: 1, w: 0 }); if (n.z > bz) { bz = n.z; best = +f.dataset.v; } }
    return { v: +el.dataset.v, front: best, z: +bz.toFixed(3) };
  });
  const t0 = performance.now(); let lockMs = null;
  await MMDICE3D.play(vals.length === 2 ? vals : vals[0], { host, from: { x: innerWidth / 2, y: innerHeight - 80 }, land: { x: innerWidth / 2, y: innerHeight * 0.45 }, top: 200, onLock: () => { lockMs = performance.now() - t0; front = read(); } });
  return { front, lockMs, left: document.querySelectorAll('.d3z').length };
}, vals);

for (const size of [[375, 667], [390, 844], [430, 932]]) {
  test(`DCB-1（${size.join('×')}）：最初のタップから B4 版の SE・出目 1〜6 の正面・2個・SE なし／旧B2／旧の演出`, { skip: SKIP, timeout: 240000 }, async () => {
    const E = await launch(size), { pg } = E;
    try {
      // 最初のタップの前：音は読まない・鳴らさない
      await pg.waitForTimeout(400);
      assert.equal(E.srv.requests.filter((u) => /\.(ogg|m4a)$/.test(u)).length, 0, '最初のタップの前に SE を読み込まない');
      assert.equal(await pg.evaluate(() => (window.MM_SE_LOG || []).length), 0);
      assert.equal(await pg.textContent('#se .on'), 'B4（新）', '既定は B4 版');
      // 新・1個・出目 1〜6（UI から＝SE も鳴る）
      for (let v = 1; v <= 6; v++) {
        await pick(pg, 'val', v);
        const info = await roll(pg);
        assert.match(info, new RegExp(`出目 ${v}　止まるまで 0\\.(8|9)\\d秒|出目 ${v}　止まるまで 1\\.0\\d秒`), info);
      }
      const log = await pg.evaluate(() => window.MM_SE_LOG);
      assert.equal(log.length, 6, '1回の出目で SE は1回');
      assert.ok(log.every((x) => x.k === 'b4' && /dice_magic_b4\.(ogg|m4a)$/.test(x.u) && Math.abs(x.dur - 1.23) < 0.05), JSON.stringify(log[0]));
      // 正面の面（止まった瞬間）＝出目
      for (let v = 1; v <= 6; v++) {
        const r = await frontAtLock(pg, [v]);
        assert.deepEqual(r.front.map((x) => x.front), [v], `出目 ${v} ${JSON.stringify(r)}`);
        assert.ok(r.front[0].z > 0.95, '正面を向いて止まる');
        assert.ok(r.lockMs > 800 && r.lockMs < 1150, `止まるまで ${r.lockMs}`);
        assert.equal(r.left, 0, '終わったら何も残らない');
      }
      // 2個
      for (const pair of [[1, 6], [5, 3], [2, 2], [4, 6]]) {
        const r = await frontAtLock(pg, pair);
        assert.deepEqual(r.front.map((x) => x.front), pair, JSON.stringify(r));
      }
      await pick(pg, 'count', 2); await pick(pg, 'val', 4);
      const n0 = await pg.evaluate(() => window.MM_SE_LOG.length);
      assert.match(await roll(pg), /出目 4 \+ 4 = 8/);
      assert.equal(await pg.evaluate(() => window.MM_SE_LOG.length), n0 + 1, '2個でも SE は1回');
      // SE なし
      await pick(pg, 'se', 'off'); await pick(pg, 'count', 1);
      await roll(pg);
      assert.equal(await pg.evaluate(() => window.MM_SE_LOG.length), n0 + 1, 'SE なし＝鳴らさない');
      // 旧B2（不採用候補）
      await pick(pg, 'se', 'b2'); await roll(pg);
      const b2 = await pg.evaluate(() => window.MM_SE_LOG.at(-1));
      assert.ok(b2.k === 'b2' && /dice_magic_b2_old\.(ogg|m4a)$/.test(b2.u), JSON.stringify(b2));
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

test('DCB-2（390×844）：連続10回（2個・ランダム）＝札の合計が出目どおり・SE 10回・何も残らない', { skip: SKIP, timeout: 240000 }, async () => {
  const E = await launch([390, 844]), { pg } = E;
  try {
    // 出目はページが決める（Math.random）。札と照らすため、play に渡った値を覚える
    await pg.evaluate(() => { const p = MMDICE3D.play; window.__vals = []; window.MMDICE3D = { ...MMDICE3D, play: (v, o) => { window.__vals.push([].concat(v)); return p(v, o); } }; });
    await pick(pg, 'count', 2); await pick(pg, 'rep', 10);
    await pg.click('#start');
    await pg.waitForFunction(() => window.__vals.length === 10 && !document.querySelector('.d3z') && !document.querySelector('#start').disabled, null, { timeout: 60000 });
    const r = await pg.evaluate(() => ({ vals: window.__vals, info: document.querySelector('#info').textContent, se: window.MM_SE_LOG.length }));
    const [a, b] = r.vals.at(-1);
    assert.ok(r.info.includes(`${a} + ${b} = ${a + b}`), `${r.info} ${JSON.stringify(r.vals.at(-1))}`);
    assert.ok(r.vals.every((p) => p.length === 2 && p.every((v) => v >= 1 && v <= 6)));
    assert.equal(r.se, 10, 'SE は1回の出目で1回＝10回');
    assert.deepEqual(E.errors, []); assert.deepEqual(E.bad, []);
  } finally { await E.close(); }
});
