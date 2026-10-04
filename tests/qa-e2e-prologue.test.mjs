// =========================================================
// QA（実ブラウザ）：プロローグ A〜E（js/prologue/prologue.js。2026-10-03 に A・B の正式画像を受け取り5枚そろった）
//  ・新しいゲームの開始 → プロローグ（A→B→C→D→E の順に背景・ナレーション）→ 聖獣士登録（名前登録）
//  ・2026-10-04 PHASE H：1文ずつ（長い文は2行を1セット）完成した状態・左から右へ短く入って中央よりやや上で静止・フェードで次へ。タップで次の文。文字は画面に収まる（390×844・375×667）
//  ・スキップは2度押し。見たあとは再読み込みしても出ない
//  Playwright / Chromium が無い環境では省略（skip）する。
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
let L = null;
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });
const OPEN = [];
const openPage = async (o) => { const p = await L.open(o); OPEN.push(p); return p; };
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close().catch(() => {}); });
const T = (name, fn) => test(name, { skip: SKIP }, fn);
const SHOT = path.join(os.tmpdir(), 'mm-prologue');

/** 今の文の様子（背景・文章・位置）。2026-10-04 PHASE H：1文（長い文は2行を1セット）だけを表示（.mmpro-u） */
const state = (pg) => pg.evaluate(() => {
  const ov = document.querySelector('.mmpro'); if (!ov) return null;
  const bg = ov.querySelector('.mmpro-bg.on'), us = [...ov.querySelectorAll('.mmpro-u')], u = us[0];
  const rs = u ? [...u.querySelectorAll('p')].map((p) => p.getBoundingClientRect()) : [];
  return {
    bg: bg ? (/prologue_(\w)\.webp/.exec(bg.style.backgroundImage) || [])[1] : null, units: us.length,
    text: u ? [...u.querySelectorAll('p')].map((p) => p.textContent).join('') : '', op: u ? +getComputedStyle(u).opacity : 0,
    top: rs.length ? Math.min(...rs.map((r) => r.top)) : null, bottom: rs.length ? Math.max(...rs.map((r) => r.bottom)) : null,
    left: rs.length ? Math.min(...rs.map((r) => r.left)) : null, right: rs.length ? Math.max(...rs.map((r) => r.right)) : null,
    W: innerWidth, H: innerHeight, sw: document.documentElement.scrollWidth,
  };
});

for (const size of [[390, 844], [375, 667]]) {
  T(`PRO-B1（${size.join('×')}）：新しいゲーム → プロローグ A→B→C→D→E（1文ずつ・完成した状態・中央よりやや上・画面に収まる・タップで次の文）→ 聖獣士登録。本文はすべてそのまま出る。再読み込みでは出ない`, async () => {
    const p = await openPage({ size, prologue: true }); const pg = p.page;
    mkdirSync(SHOT, { recursive: true });
    await pg.click('.p15start');
    await pg.waitForSelector('.mmpro .mmpro-u', { timeout: 20000 });
    const seen = [], shot = new Set();
    for (let i = 0; i < 60; i++) {
      await pg.waitForFunction(() => { const u = document.querySelector('.mmpro .mmpro-u'); return !document.querySelector('.mmpro') || (u && +getComputedStyle(u).opacity > 0.99); }, null, { timeout: 15000 });
      const s = await state(pg); if (!s) break;
      assert.equal(s.units, 1, '同時に出る文は1つだけ（重ならない・積み上げない）');
      seen.push({ bg: s.bg, text: s.text });
      assert.ok(s.sw <= s.W + 1, '横にはみ出さない');
      assert.ok(s.top >= 40 && s.bottom <= s.H - 20 && s.left >= -1 && s.right <= s.W + 1, `${s.bg}「${s.text.slice(0, 12)}」の文字が画面に収まる ${JSON.stringify([s.top, s.bottom, s.left, s.right])}`);
      const cy = (s.top + s.bottom) / 2; assert.ok(cy > s.H * 0.3 && cy < s.H * 0.5, `中央よりやや上（${Math.round(cy)} / ${s.H}）`);
      if (!shot.has(s.bg)) { shot.add(s.bg); await pg.screenshot({ path: path.join(SHOT, `${size[0]}_${s.bg}.png`) }); }
      await pg.waitForTimeout(480);
      await pg.mouse.click(size[0] / 2, size[1] * 0.8);   // 次の文へ
      await pg.waitForFunction((t) => { const ov = document.querySelector('.mmpro'); if (!ov) return true; const u = ov.querySelector('.mmpro-u'); return !!u && u.textContent !== t; }, s.text, { timeout: 15000 });
    }
    const order = seen.map((x) => x.bg).filter((b, i, a) => a[i - 1] !== b);
    assert.deepEqual(order, ['a', 'b', 'c', 'd', 'e'], '背景は A→B→C→D→E の順');
    const all = await pg.evaluate(() => MMPRO.SLIDES.flatMap((sl) => sl.pages.flatMap((pg) => MMPRO.units(pg).map((u) => u.join('')))));
    assert.deepEqual(seen.map((x) => x.text), all, '本文はすべて・順番どおり・変えずに出る（1文または2行の1セットずつ）');
    assert.ok(all.every((t) => t.length > 0));
    await pg.waitForSelector('#p11nm', { timeout: 20000 });
    assert.equal(await pg.evaluate(() => !!document.querySelector('.mmpro')), false, 'プロローグは閉じている');
    assert.equal((await H.storedSave(pg)).npcFlags.prologue, 1, '見た記録を保存');
    await pg.reload(); await pg.waitForFunction(() => typeof window.MMP8 === 'object');
    await pg.click('.p15start');
    await pg.waitForSelector('#p11nm', { timeout: 20000 });
    assert.equal(await pg.evaluate(() => !!document.querySelector('.mmpro')), false, '再読み込みでは出ない');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

T('PRO-B2：スキップは2度押し（1回目は「もう一度でスキップ」）→ 聖獣士登録', async () => {
  const p = await openPage({ prologue: true }); const pg = p.page;
  await pg.click('.p15start');
  await pg.waitForSelector('.mmpro .mmpro-skip');
  await pg.waitForTimeout(400);
  await pg.click('.mmpro-skip');
  assert.equal(await pg.textContent('.mmpro-skip'), 'もう一度でスキップ');
  assert.ok(await pg.$('.mmpro'), '1回目では閉じない');
  await pg.waitForTimeout(450);
  await pg.click('.mmpro-skip');
  await pg.waitForSelector('#p11nm', { timeout: 20000 });
  assert.equal(await pg.evaluate(() => !!document.querySelector('.mmpro')), false);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
