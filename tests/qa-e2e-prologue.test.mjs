// =========================================================
// QA（実ブラウザ）：プロローグ（js/prologue/prologue.js。2026-10-05 正式の4枚・本文。1文字ずつのフェード）
//  ・新しいゲームの開始 → プロローグ（A→B→C→D→E の順に背景・ナレーション）→ 聖獣士登録（名前登録）
//  ・2026-10-06 正式：固定尺のオープニング（タップでは進まない）。Scene 1 と正式のプロローグ BGM が同時に始まり、Scene 2〜4 は BGM の 5.559・15.161・26.673秒（2026-10-05 PHASE B：正式 v6・38.714秒）。文字は画面に収まる（390×844・375×667）
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
  T(`PRO-B1（${size.join('×')}）：2026-10-06 固定尺のオープニング：タイトル → Scene 1 と正式のプロローグ BGM が同時に始まる → Scene 2＝5.559秒・Scene 3＝15.161秒・Scene 4＝26.673秒（BGM の位置と一致）・本文は 36.276秒で終わる・開始画面は無音→ 自動で終わる → 聖獣士登録。画面を何度タップしても進み方は変わらない・「タップで先へ」は無い。本文はすべて順に・画面に収まる・中央よりやや上。「見た」を保存・再読み込みでは出ない`, async () => {
    const p = await openPage({ size, prologue: true }); const pg = p.page;
    mkdirSync(SHOT, { recursive: true });
    await record(pg);
    await pg.waitForTimeout(600);
    const t0 = await pg.evaluate(() => ({ scene: MMAUDIO.status().scene, active: MMAUDIO.status().slots.filter((x) => x.active).length, src: MMAUDIO.registryOf('bgm').TITLE }));
    assert.deepEqual([t0.scene, t0.active, t0.src.silent, t0.src.srcs.length], ['TITLE', 0, true, 0], '開始画面は無音（TITLE は silent・ファイルの BGM は鳴っていない）');
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
    assert.ok(ev.every((e) => e[2] == null), '2026-10-06 重大修正：プロローグの間 PROLOGUE の BGM は鳴らない（位置が無い）');
    const cues = await pg.evaluate(() => [...MMPRO.CUES.scenes]);   // 2026-10-07：6枚（時刻は MMPRO.CUES）
    for (const [k, want] of cues.slice(1).map((ms, i) => [`bg0${i + 2}`, ms / 1000])) {
      const e = at(k); assert.ok(e, k); const t = (e[1] - b1[1]) / 1000;
      assert.ok(Math.abs(t - want) < 0.35, `${k} は Scene 1 から ${want}秒（実測 ${t.toFixed(3)}秒・タップで早まらない）`);
    }
    const order = seen.map((x) => x.bg).filter((b, i, a) => a[i - 1] !== b);
    assert.deepEqual(order, ['01', '02', '03', '04', '05', '06'], '背景は 1 平和 → 2 厄災 → 3 文化 → 4 三人のレジェンド → 5 大会 → 6 旅立ちの順（2026-10-07）');
    const all = await pg.evaluate(() => MMPRO.SLIDES.flatMap((sl) => sl.pages.flatMap((pg) => MMPRO.units(pg).map((u) => u.join('')))));
    assert.deepEqual(seen.map((x) => x.text), all, '本文はすべて・順番どおり・変えずに出る');
    assert.equal(await pg.evaluate(() => MMAUDIO.status().scene), 'TITLE', 'プロローグのあとは PROLOGUE の BGM を残さない（自動テストの既定の名前登録の画面＝開始画面と同じ無音）');
    assert.equal(await pg.evaluate(() => MMAUDIO.status().slots.filter((x) => x.active).length), 0, 'ファイルの BGM は鳴っていない');
    const last = ev.filter((e) => /^bg/.test(e[0])).pop(), pr = await pg.evaluate(() => [...new Set(performance.getEntriesByType('resource').map((r) => r.name).filter((n) => /mystic_monsters_official\/.*\.ogg/.test(n)))]);
    assert.ok(pr.every((n) => !/title_theme|prologue_bgm/.test(n)), `旧タイトル曲・プロローグ BGM（2026-10-06 削除）は読み込まない（${pr.join(' ')}）`);
    assert.ok(last && last[0] === 'bg06');
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
  assert.deepEqual(a, { scene: 'TITLE', prologue: 0, active: 0 }, '2026-10-06：スキップのあと PROLOGUE の BGM は残らない・二重に鳴らない（2026-10-05 PHASE B：開始画面・名前登録は無音）');
  assert.equal((await H.storedSave(pg)).npcFlags.prologue, 1, 'スキップを確定した＝見た記録');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

// ---- 2026-10-05 PHASE B：データを消したあとの起動でプロローグが飛ばされる（iOS）＝「見た」の条件 ----
const proStart = (pg) => pg.waitForFunction(() => MMPRO.clock() != null, null, { timeout: 30000 });
T('PRO-B5：まっさらな保存領域（データを全部消したあとの起動）→ 開始 → 必ずプロローグ。Scene 1 が始まるまでスキップは押せない。途中で強制終了（再読み込み）→「見た」にならず、次の起動でもプロローグから。最後まで見たら「見た」', async () => {
  const p = await openPage({ prologue: true, opening: true }); const pg = p.page;
  assert.deepEqual(await pg.evaluate(() => { const t = localStorage.getItem(MMP8.SAVE_KEY), v = t && JSON.parse(t); return [!v || !(v.npcFlags || {}).prologue, !!(v && v.playerNamePending), localStorage.getItem(MMP8.LEGACY_KEY)]; }), [true, true, null], 'まっさらな保存領域（起動で作られた新しいゲームのセーブだけ・見た記録なし）');
  await pg.evaluate(() => { const mo = new MutationObserver(() => { const b = document.querySelector('.mmpro .mmpro-skip'); if (b && window.__skip0 == null) { window.__skip0 = [b.disabled, MMPRO.clock()]; mo.disconnect(); } }); mo.observe(document.body, { childList: true, subtree: true }); });
  await pg.click('.p15start');
  await pg.waitForSelector('.mmpro', { timeout: 20000 });
  { const s0 = await pg.evaluate(() => window.__skip0); assert.ok(s0[1] == null ? s0[0] === true : s0[1] < 1000, `Scene 1 の時計が動く前はスキップを押せない（2026-10-06：BGM を待たないので時計はすぐ動く）${JSON.stringify(s0)}`); }
  await proStart(pg); await pg.waitForTimeout(2500);
  assert.equal(await pg.evaluate(() => document.querySelector('.mmpro-skip').disabled), false);
  // 途中で強制終了 → 「見た」にならない
  await pg.reload(); await pg.waitForFunction(() => typeof window.MMP8 === 'object' && typeof S === 'object');
  const sv = await H.storedSave(pg); assert.ok(!sv || !(sv.npcFlags || {}).prologue, '途中で終わった＝見た記録なし');
  await pg.click('.p15start');
  await pg.waitForSelector('.mmpro', { timeout: 20000 }); await proStart(pg);
  // 最後まで（時計を進めるのではなく、実際に 38.714秒 見る）
  await pg.waitForSelector('.mmpro', { state: 'detached', timeout: 70000 });
  assert.equal((await H.storedSave(pg)).npcFlags.prologue, 1, '最後まで見た＝見た記録');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

T('PRO-B6：JS が止まって（visibilitychange なしの凍結・重い処理）戻っても、止まっていた時間で一気に最後まで進まない（「見た」にならない）。裏に回った状態でも進まない', async () => {
  const p = await openPage({ prologue: true, opening: true }); const pg = p.page;
  await pg.click('.p15start'); await pg.waitForSelector('.mmpro', { timeout: 20000 }); await proStart(pg);
  await pg.waitForTimeout(1000);
  const c0 = await pg.evaluate(() => MMPRO.clock());
  await pg.evaluate(() => { const e = performance.now() + 45000; while (performance.now() < e) {} });   // 45秒、メインスレッドが止まる（曲の長さより長い）
  await pg.waitForTimeout(400);
  const c1 = await pg.evaluate(() => MMPRO.clock());
  assert.ok(c1 - c0 < MMPRO_STALL + 1500, `止まっていた 45秒は数えない（${Math.round(c0)} → ${Math.round(c1)}ms）`);
  assert.ok(await pg.$('.mmpro'), 'プロローグは続いている');
  // pagehide（アプリの切り替え・強制終了の前）でも止まる
  await pg.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
  const h0 = await pg.evaluate(() => MMPRO.clock()); await pg.waitForTimeout(2000); const h1 = await pg.evaluate(() => MMPRO.clock());
  assert.ok(h1 - h0 < 50, `pagehide の間は進まない（${Math.round(h0)} → ${Math.round(h1)}）`);
  await pg.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  await pg.waitForTimeout(800); assert.ok((await pg.evaluate(() => MMPRO.clock())) > h1, '戻れば続きから');
  const sv = await H.storedSave(pg); assert.ok(!sv || !(sv.npcFlags || {}).prologue, 'まだ見た記録なし');
  assert.deepEqual(p.errors, []);
});
const MMPRO_STALL = 1500;
