// =========================================================
// 実ブラウザ：P ハブ背景共用の独立プレビュー（2026-10-10・試作。prototype/p_hub_1010/index.html）
//  PHB-1（390×844・375×667。既定の配置 core_zones＝P 中核の候補画像を P に近い3地点ずつに使う）：
//        左（Scene09）→ P → Scene22 → C02_01、右（Scene20）→ P → Scene22 → C02_01 を1マスずつ。
//        各地点で、今の地点と（同じ区域の）次の地点の印が画面の中（案内・操作の帯・区域の札に隠れない・端で切れない）・印どうしが重ならない・
//        見えている背景（区域）が正しい・候補画像の <img> は3 Scene で同じ要素・画像の読み込みは背景ごとに1回・
//        区域が変わるところは短いフェード（途中の不透明度が 0〜1 の間 → 新しい区域だけが見える）・P で Scene22 の画面へ・
//        門の出来事は原本の LOWER_GATE だけ・C02_01 で止まる・逆向きは動かない・表示戻す・連打・横はみ出しなし・エラー0
//  PHB-3（390×844）：?layout=structure（前便の構図参考図だけ）と ?xy=zip（ZIP の仮座標）も表示・進行できる
//  PHB-2（390×844）：背景が 404 でも JS エラーなし・読み込めない案内・進めない
//  QA_E2E=1 のときだけ実行。スクリーンショットは PHB_SHOT_DIR（既定は OS の一時フォルダ）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
const SHOT = process.env.PHB_SHOT_DIR || path.join(os.tmpdir(), 'mm-p-hub-1010');
const URL_ = 'prototype/p_hub_1010/index.html';
const CORE = 'p_core_candidate', DIA = 'p_hub_qa_structure';
// [地点, 画面, 背景]
const ROUTES = {
  left: [['EL04_09', 'Scene09', DIA], ['EL04_10', 'Scene09', DIA], ['EL04_11', 'Scene09', CORE], ['EL04_12', 'Scene09', CORE], ['P', 'Scene09', CORE],
    ['C01_01', 'Scene22', CORE], ['C01_02', 'Scene22', CORE], ['LOWER_GATE', 'Scene22', DIA], ['C02_01', 'Scene22', DIA]],
  right: [['ER04_09', 'Scene20', DIA], ['ER04_10', 'Scene20', DIA], ['ER04_11', 'Scene20', DIA], ['ER04_12', 'Scene20', CORE], ['ER04_13', 'Scene20', CORE], ['P', 'Scene20', CORE],
    ['C01_01', 'Scene22', CORE], ['C01_02', 'Scene22', CORE], ['LOWER_GATE', 'Scene22', DIA], ['C02_01', 'Scene22', DIA]],
};

const measure = () => {
  const R = (el) => el.getBoundingClientRect(), vp = R(document.getElementById('vp')), hd = R(document.querySelector('header')), ft = R(document.querySelector('footer'));
  const zl = R(document.getElementById('zone')), on = [...document.querySelectorAll('.layer.on')];
  const ms = on.length === 1 ? [...on[0].querySelectorAll('.m')] : [], cur = ms.find((m) => m.classList.contains('cur')), i = ms.indexOf(cur), nx = ms[i + 1];
  const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  const inside = (r) => r.left >= vp.left - 0.5 && r.right <= vp.right + 0.5 && r.top >= vp.top - 0.5 && r.bottom <= vp.bottom + 0.5 && r.top >= hd.bottom - 0.5 && r.bottom <= ft.top + 0.5;
  let overlap = 0; const rs = ms.map(R);
  for (let a = 0; a < rs.length; a++) for (let b = a + 1; b < rs.length; b++) if (hit(rs[a], rs[b])) overlap++;
  const img = on[0] && on[0].querySelector('img');
  return { node: document.getElementById('cur').textContent, mode: PHUB.state().mode, layers: on.length, asset: on[0] && on[0].dataset.asset,
    gap: on[0] ? (() => { const r = R(on[0].querySelector('img')); return Math.max(0, r.left - vp.left, vp.right - r.right, r.top - vp.top, vp.bottom - r.bottom); })() : 99,
    curIn: !!cur && inside(R(cur)), underZone: !!cur && hit(R(cur), zl), nextIn: nx ? inside(R(nx)) : true, overlap, tag: img && img.dataset.tag, size: cur ? Math.round(R(cur).width) : 0, cam: PHUB.camera() };
};

async function launch(size) {
  const { chromium } = createRequire(import.meta.url)('playwright');
  const srv = await H.serve(), br = await chromium.launch();
  const ctx = await br.newContext({ viewport: { width: size[0], height: size[1] }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const pg = await ctx.newPage(), errs = [], bad = [], req = [];
  pg.on('pageerror', (e) => errs.push(String(e.message))); pg.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  pg.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
  pg.on('request', (r) => { const m = /assets\/(p_[a-z_]+)\.png/.exec(r.url()); if (m) req.push(m[1]); });
  return { srv, br, ctx, pg, errs, bad, req };
}

for (const size of [[390, 844], [375, 667]]) {
  test(`PHB-1（${size.join('×')}）：P 中核の候補画像を区域で使う・左右の道 → P → 下門・フェード・印が隠れない・逆向きは動かない・エラー0`, { skip: SKIP, timeout: 240000 }, async () => {
    mkdirSync(SHOT, { recursive: true });
    const E = await launch(size), { pg } = E;
    try {
      await pg.goto(E.srv.url + URL_); await pg.waitForFunction(() => window.PHUB && PHUB.ready && PHUB.isLoaded());
      assert.equal(await pg.evaluate(() => PHUB.layout()), 'core_zones');
      await pg.evaluate(() => document.querySelectorAll('.layer img').forEach((im) => { im.dataset.tag = im.closest('.layer').dataset.asset; }));
      for (const [side, path_] of Object.entries(ROUTES)) {
        await pg.click(`.modes button[data-mode="${path_[0][1]}"]`); await pg.waitForTimeout(520);
        const cams = [];
        for (let k = 0; k < path_.length; k++) {
          const [node, mode, asset] = path_[k], v = await pg.evaluate(measure);
          const at = `${size}・${side}・${node}`;
          assert.equal(v.node, node, `${at}：地点`); assert.equal(v.mode, mode, `${at}：画面`);
          assert.equal(v.layers, 1, `${at}：見えている背景は1枚`); assert.equal(v.asset, asset, `${at}：区域の背景`); assert.equal(v.tag, asset, `${at}：背景の要素は同じ（src を差し替えない）`);
          assert.ok(v.curIn, `${at}：今の地点が画面の中（帯に隠れない・切れない）`); assert.ok(!v.underZone, `${at}：区域の札に隠れない`);
          assert.ok(v.nextIn, `${at}：同じ区域の次の地点も画面の中`); assert.equal(v.overlap, 0, `${at}：印どうしが重ならない`); assert.ok(v.size >= 30, '今の地点の印は 30px 以上');
          assert.ok(v.gap <= 1, `${at}：絵の外（暗い余白）が見えない（${v.gap.toFixed(1)}px）`);
          cams.push(v.cam);
          await pg.screenshot({ path: path.join(SHOT, `${size.join('x')}_${side}_${String(k).padStart(2, '0')}_${node}.png`) });
          if (k === 3) { const r = await pg.evaluate(() => PHUB.reverse()); assert.ok(r.ok && !r.moved, '逆向きは原本で不可＝動かない'); assert.equal(await pg.textContent('#cur'), node); }
          if (k < path_.length - 1) {
            await pg.click('#next');
            if (path_[k + 1][2] !== asset) {   // 区域が変わる：短いフェードの途中を確かめる
              await pg.waitForTimeout(110);
              const f = await pg.evaluate(([a, b]) => ({ a: +getComputedStyle(document.querySelector(`.layer[data-asset="${a}"]`)).opacity, b: +getComputedStyle(document.querySelector(`.layer[data-asset="${b}"]`)).opacity }), [asset, path_[k + 1][2]]);
              assert.ok(f.a > 0.02 && f.a < 0.98 && f.b > 0.02 && f.b < 0.98, `${at}：区域の切り替えはフェード（途中 ${f.a.toFixed(2)}／${f.b.toFixed(2)}）`);
              await pg.waitForTimeout(420);
            } else await pg.waitForTimeout(520);
          }
        }
        assert.ok(new Set(cams.map((c) => Math.round(c.tx) + ',' + Math.round(c.ty) + ',' + c.s.toFixed(3))).size >= 5, 'カメラが今の地点を追って動く');
        const s = await pg.evaluate(() => PHUB.state()), steps = s.logs.filter((r) => r.from);
        assert.equal(steps.length, path_.length - 1); assert.ok(steps.every((r) => r.ok && r.edge), `${side}：すべて原本の forward の接続`);
        assert.deepEqual(steps.filter((r) => r.gate).map((r) => r.to), ['LOWER_GATE'], '門の出来事は原本の LOWER_GATE だけ（候補画像の門では起きない）');
        assert.equal(s.logs.filter((r) => r.info && /区域/.test(r.info)).length, 2, '区域の切り替えは2回（近づく → P 中核 → 門）');
        assert.ok(s.logs.some((r) => r.info && /Scene22/.test(r.info)), 'P で Scene22 の画面へ');
        assert.equal(await pg.$eval('#next', (b) => b.disabled), true, 'C02_01 で止まる（この先は Scene23＝このハブの外）');
        await pg.click('#prev'); await pg.waitForTimeout(520); assert.equal(await pg.textContent('#cur'), 'LOWER_GATE', '表示を戻す');
        const at = await pg.evaluate(() => { PHUB.pick('Scene22'); return PHUB.reverse(); });
        assert.ok(at.ok && !at.moved && at.prevs.length === 2, 'P から左右の道へ戻る接続は無い（動かない）');
      }
      await pg.click('.modes button[data-mode="Scene09"]');
      for (let k = 0; k < 12; k++) await pg.click('#next', { force: true });
      await pg.waitForTimeout(520);
      const z = await pg.evaluate(() => PHUB.state()), v = await pg.evaluate(measure);
      assert.equal(z.node, 'C02_01'); assert.equal(z.mode, 'Scene22'); assert.ok(z.logs.filter((r) => r.from).every((r) => r.ok));
      assert.equal(v.layers, 1, '連打のあとも見えている背景は1枚'); assert.equal(v.asset, DIA);
      assert.deepEqual(E.req.sort(), [CORE, DIA].sort(), '画像の読み込みは背景ごとに1回');
      assert.ok(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '横にはみ出さない');
      assert.deepEqual(E.errs, []); assert.deepEqual(E.bad, []);
    } finally { await E.br.close(); await E.srv.close(); }
  });
}

test('PHB-3（390×844）：前便の配置（構図参考図だけ）と ZIP の仮座標も表示・進行できる', { skip: SKIP, timeout: 120000 }, async () => {
  const E = await launch([390, 844]), { pg } = E;
  try {
    for (const [q, layout, zip] of [['?layout=structure', 'structure', false], ['?xy=zip', 'core_zones', true]]) {
      await pg.goto(E.srv.url + URL_ + q); await pg.waitForFunction(() => window.PHUB && PHUB.ready && PHUB.isLoaded());
      assert.equal(await pg.evaluate(() => PHUB.layout()), layout); assert.equal(await pg.evaluate(() => PHUB.zip()), zip);
      for (const m of ['Scene09', 'Scene20', 'Scene22']) {
        await pg.evaluate((x) => PHUB.pick(x), m);
        if (zip) { for (let g = 0; g < 4 && (await pg.evaluate(() => PHUB.state().asset)) !== 'p_core_candidate'; g++) await pg.evaluate(() => PHUB.step()); await pg.waitForTimeout(520); await pg.screenshot({ path: path.join(SHOT, `390x844_zipxy_${m}.png`) }); }
        for (let k = 0; k < 6; k++) await pg.evaluate(() => PHUB.step());
        await pg.waitForTimeout(520);
        const s = await pg.evaluate(() => PHUB.state()), v = await pg.evaluate(measure);
        assert.ok(s.logs.filter((r) => r.from).every((r) => r.ok), `${q}・${m}：原本の接続`); assert.ok(v.curIn && v.layers === 1, `${q}・${m}：今の地点が画面の中`);
      }
    }
    assert.deepEqual(E.errs, []); assert.deepEqual(E.bad, []);
  } finally { await E.br.close(); await E.srv.close(); }
});

test('PHB-2（390×844）：背景が 404 でも止まらない（エラー0・案内・進めない）', { skip: SKIP, timeout: 60000 }, async () => {
  const E = await launch([390, 844]), { pg } = E;
  try {
    await pg.route(/p_core_candidate\.png/, (r) => r.fulfill({ status: 404, body: 'x' }));
    await pg.goto(E.srv.url + URL_); await pg.waitForFunction(() => window.PHUB && PHUB.failed());
    assert.match(await pg.textContent('#veil'), /読み込めません/);
    assert.equal(await pg.$eval('#next', (b) => b.disabled), true);
    assert.deepEqual(E.errs.filter((x) => !/404/.test(x)), []);
  } finally { await E.br.close(); await E.srv.close(); }
});
