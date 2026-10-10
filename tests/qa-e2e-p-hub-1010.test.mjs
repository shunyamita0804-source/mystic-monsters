// =========================================================
// 実ブラウザ：P ハブ背景共用の独立プレビュー（2026-10-10・試作。prototype/p_hub_1010/index.html）
//  PHB-1（390×844・375×667）：左（Scene09）→ P → Scene22 → C02_01、右（Scene20）→ P → Scene22 → C02_01 を1マスずつ。
//        各地点で、今の地点と次の地点の印が画面の中（案内・操作の帯に隠れない・端で切れない）・印どうしが重ならない・
//        背景の <img> は3画面で同じ要素・同じ src・画像の読み込みは1回・カメラが今の地点を追う・P で自動的に Scene22 の画面へ・
//        下門で門の出来事・C02_01 で止まる（このハブの外）・逆向きは動かない・表示を戻す・連打しても壊れない・横にはみ出さない・エラー0
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
const ROUTES = { left: ['Scene09', ['EL04_09', 'EL04_10', 'EL04_11', 'EL04_12', 'P', 'C01_01', 'C01_02', 'LOWER_GATE', 'C02_01']],
  right: ['Scene20', ['ER04_09', 'ER04_10', 'ER04_11', 'ER04_12', 'ER04_13', 'P', 'C01_01', 'C01_02', 'LOWER_GATE', 'C02_01']] };

const measure = () => {
  const R = (el) => el.getBoundingClientRect(), vp = R(document.getElementById('vp')), hd = R(document.querySelector('header')), ft = R(document.querySelector('footer'));
  const ms = [...document.querySelectorAll('.m')], cur = document.querySelector('.m.cur'), i = ms.indexOf(cur), nx = ms[i + 1];
  const inside = (r) => r.left >= vp.left - 0.5 && r.right <= vp.right + 0.5 && r.top >= vp.top - 0.5 && r.bottom <= vp.bottom + 0.5 && r.top >= hd.bottom - 0.5 && r.bottom <= ft.top + 0.5;
  let overlap = 0; const rs = ms.map(R);
  for (let a = 0; a < rs.length; a++) for (let b = a + 1; b < rs.length; b++) if (rs[a].left < rs[b].right && rs[b].left < rs[a].right && rs[a].top < rs[b].bottom && rs[b].top < rs[a].bottom) overlap++;
  const img = document.getElementById('bg');
  return { node: document.getElementById('cur').textContent, mode: PHUB.state().mode, n: ms.length, curIn: inside(R(cur)), nextIn: nx ? inside(R(nx)) : true, overlap,
    imgTag: img.dataset.tag || null, src: img.getAttribute('src'), cam: PHUB.camera(), size: Math.round(R(cur).width) };
};

for (const size of [[390, 844], [375, 667]]) {
  test(`PHB-1（${size.join('×')}）：左右の道 → P → 下門・背景1枚・印が隠れない・逆向きは動かない・エラー0`, { skip: SKIP, timeout: 180000 }, async () => {
    mkdirSync(SHOT, { recursive: true });
    const { chromium } = createRequire(import.meta.url)('playwright');
    const srv = await H.serve(), br = await chromium.launch();
    try {
      const ctx = await br.newContext({ viewport: { width: size[0], height: size[1] }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
      const pg = await ctx.newPage(), errs = [], bad = [], imgReq = [];
      pg.on('pageerror', (e) => errs.push(String(e.message))); pg.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
      pg.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
      pg.on('request', (r) => { if (/p_hub_qa_structure\.png/.test(r.url())) imgReq.push(r.url()); });
      await pg.goto(srv.url + URL_); await pg.waitForFunction(() => window.PHUB && PHUB.ready && PHUB.isLoaded());
      await pg.evaluate(() => { document.getElementById('bg').dataset.tag = 'one'; });
      for (const [side, [first, path_]] of Object.entries(ROUTES)) {
        await pg.click(`.modes button[data-mode="${first}"]`); await pg.waitForTimeout(520);
        const cams = [];
        for (let k = 0; k < path_.length; k++) {
          const v = await pg.evaluate(measure);
          assert.equal(v.node, path_[k], `${size}・${side}：${k}歩目`);
          assert.equal(v.mode, k >= path_.indexOf('P') + 1 ? 'Scene22' : first, `${side}・${v.node}：画面`);
          assert.ok(v.curIn, `${size}・${side}・${v.node}：今の地点が画面の中（帯に隠れない・切れない）`);
          assert.ok(v.nextIn, `${size}・${side}・${v.node}：次の地点も画面の中`);
          assert.equal(v.overlap, 0, `${size}・${side}・${v.node}：印どうしが重ならない`);
          assert.equal(v.imgTag, 'one', '背景の <img> は同じ要素'); assert.equal(v.src, 'assets/p_hub_qa_structure.png', '背景の src は同じ');
          assert.ok(v.size >= 30, '今の地点の印は 30px 以上'); cams.push(v.cam);
          if (k === 2 || v.node === 'P' || v.node === 'LOWER_GATE') await pg.screenshot({ path: path.join(SHOT, `${size.join('x')}_${side}_${k}_${v.node}.png`) });
          if (k === 2) { const r = await pg.evaluate(() => PHUB.reverse()); assert.ok(r.ok && !r.moved, '逆向きは原本で不可＝動かない'); assert.equal(await pg.textContent('#cur'), path_[k]); }
          if (k < path_.length - 1) { await pg.click('#next'); await pg.waitForTimeout(520); }
        }
        assert.ok(new Set(cams.map((c) => Math.round(c.tx) + ',' + Math.round(c.ty) + ',' + c.s.toFixed(3))).size >= 4, 'カメラが今の地点を追って動く');
        const s = await pg.evaluate(() => PHUB.state());
        const steps = s.logs.filter((r) => r.from); assert.equal(steps.length, path_.length - 1);
        assert.ok(steps.every((r) => r.ok && r.edge), `${side}：すべて原本の forward の接続`);
        assert.ok(steps.some((r) => r.gate && r.to === 'LOWER_GATE'), '下門で門の出来事'); assert.deepEqual(s.gates, ['LOWER_GATE']);
        assert.ok(s.logs.some((r) => r.info && /Scene22/.test(r.info)), 'P で Scene22 の画面へ（背景は同じ）');
        assert.equal(await pg.$eval('#next', (b) => b.disabled), true, 'C02_01 で止まる（この先は Scene23＝このハブの外）');
        await pg.click('#prev'); await pg.waitForTimeout(450); assert.equal(await pg.textContent('#cur'), 'LOWER_GATE', '表示を戻す');
        const at = await pg.evaluate(() => { PHUB.pick('Scene22'); return PHUB.reverse(); });
        assert.ok(at.ok && !at.moved && at.prevs.length === 2, 'P から左右の道へ戻る接続は無い（動かない）');
      }
      // 境界での連打：Scene09 の先頭から 12 回すばやく押しても、正しい道で C02_01 に着いて止まる
      await pg.click('.modes button[data-mode="Scene09"]');
      for (let k = 0; k < 12; k++) await pg.click('#next', { force: true });
      const z = await pg.evaluate(() => PHUB.state());
      assert.equal(z.node, 'C02_01'); assert.equal(z.mode, 'Scene22'); assert.ok(z.logs.filter((r) => r.from).every((r) => r.ok));
      assert.equal(imgReq.length, 1, '背景の画像の読み込みは1回（3画面で共用）');
      assert.ok(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '横にはみ出さない');
      assert.deepEqual(errs, []); assert.deepEqual(bad, []);
      await ctx.close();
    } finally { await br.close(); await srv.close(); }
  });
}

test('PHB-2（390×844）：背景が 404 でも止まらない（エラー0・案内・進めない）', { skip: SKIP, timeout: 60000 }, async () => {
  const { chromium } = createRequire(import.meta.url)('playwright');
  const srv = await H.serve(), br = await chromium.launch();
  try {
    const ctx = await br.newContext({ viewport: { width: 390, height: 844 } });
    const pg = await ctx.newPage(), errs = [];
    pg.on('pageerror', (e) => errs.push(String(e.message)));
    await pg.route(/p_hub_qa_structure\.png/, (r) => r.fulfill({ status: 404, body: 'x' }));
    await pg.goto(srv.url + URL_); await pg.waitForFunction(() => window.PHUB && PHUB.failed());
    assert.match(await pg.textContent('#veil'), /読み込めません/);
    assert.equal(await pg.$eval('#next', (b) => b.disabled), true);
    assert.deepEqual(errs, []);
    await ctx.close();
  } finally { await br.close(); await srv.close(); }
});
