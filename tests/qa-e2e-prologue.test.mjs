// =========================================================
// QA（実ブラウザ）：プロローグ（js/prologue/prologue.js。2026-10-05 正式の4枚・本文。1文字ずつのフェード）
//  ・新しいゲームの開始 → プロローグ（A→B→C→D→E の順に背景・ナレーション）→ 聖獣士登録（名前登録）
//  ・2026-10-06 正式：固定尺のオープニング（タップでは進まない）。Scene 1 と正式のプロローグ BGM が同時に始まり、Scene 2〜4 は BGM の 7.782・21.226・37.342秒。文字は画面に収まる（390×844・375×667）
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
    bg: bg ? (/prologue_(\d\d)_\w+\.webp/.exec(bg.style.backgroundImage) || [])[1] : null, units: us.length,
    text: u ? [...u.querySelectorAll('p')].map((p) => p.textContent).join('') : '', op: u ? +getComputedStyle(u).opacity : 0,
    top: rs.length ? Math.min(...rs.map((r) => r.top)) : null, bottom: rs.length ? Math.max(...rs.map((r) => r.bottom)) : null,
    left: rs.length ? Math.min(...rs.map((r) => r.left)) : null, right: rs.length ? Math.max(...rs.map((r) => r.right)) : null,
    W: innerWidth, H: innerHeight, sw: document.documentElement.scrollWidth,
  };
});

/** 背景・Scene・BGM の記録（Scene の切り替えの時刻と、そのときの PROLOGUE BGM の位置・Audio Manager の場面） */
const record = (pg) => pg.evaluate(() => {
  window.__ev = [];
  const log = (k) => window.__ev.push([k, performance.now(), window.MMAUDIO ? MMAUDIO.bgmTime('PROLOGUE') : null, window.MMAUDIO ? MMAUDIO.status().scene : null]);
  new MutationObserver(() => { const ov = document.querySelector('.mmpro'); if (!ov) return; const on = ov.querySelector('.mmpro-bg.on'), k = on ? (/prologue_(\d\d)/.exec(on.style.backgroundImage) || [])[1] : null; if (k && k !== window.__lastbg) { window.__lastbg = k; log('bg' + k); } })
    .observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style'] });
  window.__scTimer = setInterval(() => { const s = window.MMAUDIO && MMAUDIO.status(); if (s && s.scene !== window.__sc) { window.__sc = s.scene; log('scene:' + s.scene); } }, 20);
});

for (const size of [[390, 844], [375, 667]]) {
  T(`PRO-B1（${size.join('×')}）：2026-10-06 固定尺のオープニング：タイトル → Scene 1 と正式のプロローグ BGM が同時に始まる → Scene 2＝7.782秒・Scene 3＝21.226秒・Scene 4＝37.342秒（BGM の位置と一致）→ 自動で終わる → 聖獣士登録。画面を何度タップしても進み方は変わらない・「タップで先へ」は無い。本文はすべて順に・画面に収まる・中央よりやや上。「見た」を保存・再読み込みでは出ない`, async () => {
    const p = await openPage({ size, prologue: true }); const pg = p.page;
    mkdirSync(SHOT, { recursive: true });
    await record(pg);
    await pg.click('.p15start');
    await pg.waitForSelector('.mmpro', { timeout: 20000 });
    assert.equal(await pg.evaluate(() => !!document.querySelector('.mmpro-hint') || /タップで先へ/.test(document.querySelector('.mmpro').textContent)), false, '「タップで先へ」は DOM にも画面にも無い');
    const seen = [], shot = new Set(); let taps = 0;
    while (await pg.$('.mmpro')) {
      const s = await state(pg);
      if (s && s.text && s.units === 1 && !seen.some((x) => x.text === s.text)) {
        seen.push({ bg: s.bg, text: s.text });
        assert.ok(s.sw <= s.W + 1, '横にはみ出さない');
        if (s.op > 0.5) {
          assert.ok(s.top >= 40 && s.bottom <= s.H - 20 && s.left >= -1 && s.right <= s.W + 1, `${s.bg}「${s.text.slice(0, 12)}」の文字が画面に収まる ${JSON.stringify([s.top, s.bottom, s.left, s.right])}`);
          const cy = (s.top + s.bottom) / 2; assert.ok(cy > s.H * 0.3 && cy < s.H * 0.5, `中央よりやや上（${Math.round(cy)} / ${s.H}）`);
        }
        if (!shot.has(s.bg)) { shot.add(s.bg); await pg.screenshot({ path: path.join(SHOT, `${size[0]}_${s.bg}.png`) }); }
      }
      if (taps < 60) { await pg.mouse.click(size[0] / 2, size[1] * (taps % 2 ? 0.45 : 0.8)).catch(() => {}); taps++; }   // 画面の中央・下を何度もタップ（進み方は変わらない）
      await pg.waitForTimeout(250);
    }
    await pg.waitForSelector('#p11nm', { timeout: 20000 });
    const ev = await pg.evaluate(() => { clearInterval(window.__scTimer); return window.__ev; });
    const at = (k) => ev.find((e) => e[0] === k), b1 = at('bg01');
    assert.ok(b1, 'Scene 1');
    const pre = ev.filter((e) => e[1] < b1[1] && e[0] === 'scene:PROLOGUE');
    assert.equal(pre.length, 0, 'Scene 1 より前（背景の読み込み待ち）に PROLOGUE の BGM は始まらない');
    const pS = at('scene:PROLOGUE'); assert.ok(pS && pS[1] - b1[1] < 400, `PROLOGUE は Scene 1 と同時に始まる（${pS ? Math.round(pS[1] - b1[1]) : '-'}ms）`);
    for (const [k, want] of [['bg02', 7.782], ['bg03', 21.226], ['bg04', 37.342]]) {
      const e = at(k); assert.ok(e, k); const t = (e[1] - b1[1]) / 1000;
      assert.ok(Math.abs(t - want) < 0.35, `${k} は Scene 1 から ${want}秒（実測 ${t.toFixed(3)}秒・タップで早まらない）`);
      if (e[2] != null) assert.ok(Math.abs(e[2] - want) < 0.25, `${k} のとき BGM は ${want}秒の位置（実測 ${e[2].toFixed(3)}）`);
    }
    const order = seen.map((x) => x.bg).filter((b, i, a) => a[i - 1] !== b);
    assert.deepEqual(order, ['01', '02', '03', '04'], '背景は 1 共存 → 2 異変 → 3 三人のレジェンド → 4 ミストリア到着の順');
    const all = await pg.evaluate(() => MMPRO.SLIDES.flatMap((sl) => sl.pages.flatMap((pg) => MMPRO.units(pg).map((u) => u.join('')))));
    assert.deepEqual(seen.map((x) => x.text), all, '本文はすべて・順番どおり・変えずに出る');
    assert.equal(await pg.evaluate(() => MMAUDIO.status().scene), 'TITLE', 'プロローグのあとは PROLOGUE の BGM を残さない（聖獣士登録は開始画面の曲）');
    assert.equal(await pg.evaluate(() => MMAUDIO.status().slots.filter((x) => x.active).length), 1, 'BGM は1本だけ');
    assert.equal((await H.storedSave(pg)).npcFlags.prologue, 1, '最後まで見た＝見た記録を保存');
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
  await pg.waitForTimeout(900);
  const a = await pg.evaluate(() => ({ scene: MMAUDIO.status().scene, prologue: MMAUDIO.status().slots.filter((x) => x.active && /prologue_bgm/.test(x.src || '')).length, active: MMAUDIO.status().slots.filter((x) => x.active).length }));
  assert.deepEqual(a, { scene: 'TITLE', prologue: 0, active: 1 }, '2026-10-06：スキップのあと PROLOGUE の BGM は残らない・二重に鳴らない');
  assert.equal((await H.storedSave(pg)).npcFlags.prologue, 1, 'スキップを確定した＝見た記録');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
