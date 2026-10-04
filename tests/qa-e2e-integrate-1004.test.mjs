// =========================================================
// 実ブラウザ：2026-10-04（追加素材の局所統合）
//  IN-B1 ヴァルガス・セドリックの立ち絵が右で切れない（390×844・375×667）。ほかの NPC の大きさは変えない
//  IN-B2 開始の音 TITLE_START：最初のタップで正式の音（ファイル）が鳴る・合成音に落ちない・約0.5秒で次の画面・プロローグは従来どおり始まる
//  IN-B3 大会ランク選択：Chapter 2（フィールド）・Chapter 3（旧ボード）も Chapter 1 と同じ部品。未解放は押せない・クリア済は再挑戦できる（2サイズ）
//  QA_E2E=1 のときだけ実行（tests/e2e/harness.mjs）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
let L;
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });
const SIZES = [[390, 844], [375, 667]];

test('IN-B1：会話の立ち絵（全身の上 3/4）：ヴァルガス・セドリックは画面の中に収まる（右の肩が切れない）。ほかの NPC の高さ・位置は従来のまま', { skip: SKIP }, async () => {
  for (const size of SIZES) {
    const p = await L.open({ size }); const pg = p.page; await H.newGame(pg, 'テスト');
    const R = {};
    for (const id of ['vargas', 'cedric', 'karen', 'dan', 'nick', 'elliot', 'genshin', 'shop']) {
      await pg.evaluate((id) => { MMNPC.talk([{ npc: id, text: 'テスト' }], { big: true }); }, id);
      await pg.waitForFunction(() => { const i = document.querySelector('.mmtalk-fig img'); return i && i.complete && i.naturalWidth > 0; });
      await pg.waitForTimeout(500);
      R[id] = await pg.evaluate(() => { const i = document.querySelector('.mmtalk-fig img').getBoundingClientRect(), w = document.querySelector('.mmtalk-win').getBoundingClientRect(); return { l: i.left, r: i.right, h: i.height, b: i.bottom, wt: w.top, W: innerWidth }; });
      await pg.evaluate(() => MMNPC.close()); await pg.waitForTimeout(150);
    }
    for (const id of ['vargas', 'cedric']) { const x = R[id]; assert.ok(x.l >= -0.5 && x.r <= x.W + 0.5, `${size[0]}：${id} は画面に収まる（${Math.round(x.l)}〜${Math.round(x.r)}）`); assert.ok(x.b > x.wt, `${id}：立ち絵の下端は会話窓の後ろ（浮かない）`); }
    const base = R.karen.h; for (const id of ['dan', 'nick', 'elliot', 'genshin', 'shop']) assert.equal(Math.round(R[id].h), Math.round(base), `${id} の高さは従来のまま`);
    for (const id of ['vargas', 'cedric']) assert.ok(R[id].h >= base * 0.82, `${id}：高さは大きく変えない（${Math.round(R[id].h)} / ${Math.round(base)}）`);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []); await p.ctx.close();
  }
});

test('IN-B2：開始の音（正式素材）：最初のタップで TITLE_START のファイル（約2.5秒）が鳴り始め、合成音には落ちない。約0.5秒で次の画面へ（音は止めない）。プロローグの最初の文は従来どおり出る', { skip: SKIP }, async () => {
  for (const size of SIZES) {
    const p = await L.open({ size, prologue: true }); const pg = p.page;
    await pg.evaluate(() => { window.__st = []; const o = AudioBufferSourceNode.prototype.start; AudioBufferSourceNode.prototype.start = function (...a) { window.__st.push({ t: performance.now(), d: this.buffer ? this.buffer.duration : 0 }); return o.apply(this, a); }; window.__ff = 0; const f = window.fanfare; window.fanfare = function () { window.__ff++; return f.apply(this, arguments); }; });
    await pg.waitForSelector('.p15start'); const t0 = await pg.evaluate(() => performance.now());
    await pg.click('.p15start');
    await pg.waitForFunction(() => document.querySelector('.mmpro,.p11reg,.p11cover'), null, { timeout: 10000 });
    const r = await pg.evaluate((t0) => ({ next: performance.now() - t0, se: window.__st.filter((x) => x.d > 1.5).map((x) => x.t - t0), ff: window.__ff, log: MMAUDIO.seLog(), st: MMAUDIO.status().se.TITLE_START }), t0);
    assert.equal(r.se.length, 1, '正式の音（ファイル）が1回鳴った'); assert.ok(r.se[0] < 400, `タップのすぐあと（${Math.round(r.se[0])}ms）`);
    assert.equal(r.ff, 0, '合成のファンファーレは鳴らない'); assert.deepEqual(r.log, ['TITLE_START']); assert.equal(r.st, 'ready');
    assert.ok(r.next >= 480 && r.next < 1500, `約0.5秒で次の画面（${Math.round(r.next)}ms。3秒の余韻を待たない）`);
    await pg.waitForSelector('.mmpro-u', { timeout: 10000 }); await pg.waitForTimeout(400);
    assert.match(await pg.evaluate(() => document.querySelector('.mmpro-u').textContent), /この世界には、人と共に生きる不思議な生命/, 'プロローグは従来どおり');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []); await p.ctx.close();
  }
});

test('IN-B3：大会ランク選択（Chapter 2・3）：Chapter 1 と同じ部品・会場のロビーの背景。未解放は押せない・クリア済（再挑戦）は選んで参加できる・画面に収まる（2サイズ）', { skip: SKIP }, async () => {
  for (const size of SIZES) for (const [ch, clr, pick, want] of [[2, 'ED', 0, 'S:lock A:lock B:lock C:next D:clear E:clear'], [3, 'EDC', 1, 'S:lock A:lock B:next C:clear D:clear E:clear']]) {
    const p = await L.open({ size }); const pg = p.page; await H.newGame(pg, 'ユウ');
    await pg.evaluate(([ch, clr]) => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); m.prog.rankClr = [...'EDCBAS'].map((x) => clr.includes(x)); m.raise.ch = ch; m.raise.field = null; save();
      MMP8.ensureBoardPosition(S, m); if (chfActive(m)) { const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); } else { const t = bTrackFor(m); Object.assign(m.raise, { node: t.goal || 'G', goal: true, pend: null }); } save(); board(); }, [ch, clr]);
    await pg.waitForSelector('.rcv-row', { timeout: 15000 }); await pg.waitForTimeout(500);
    const r = await pg.evaluate(() => ({ st: [...document.querySelectorAll('.rcv-row')].map((x) => `${RN[+x.dataset.rank]}:${x.dataset.state}`).join(' '), bg: getComputedStyle(document.querySelector('#chrcv,.p9rcvw')).backgroundImage, old: document.querySelectorAll('.p9rank,.p9rlock,.p9sheet,#brollbtn').length,
      lockBtn: [...document.querySelectorAll('.rcv-row.st-lock')].every((x) => x.tagName === 'DIV'), inView: [...document.querySelectorAll('.rcv-row,#p9join,.rcv-dec')].every((e) => { const b = e.getBoundingClientRect(); return b.top >= -1 && b.bottom <= innerHeight + 1 && b.left >= -1 && b.right <= innerWidth + 1; }), sw: document.documentElement.scrollWidth }));
    assert.equal(r.st, want, `Chapter ${ch}`); assert.match(r.bg, /lobby_main\.webp/, '会場のロビーの背景'); assert.equal(r.old, 0, '旧カード・サイコロは無い'); assert.ok(r.lockBtn, '未解放は押せない'); assert.ok(r.inView, '画面に収まる'); assert.equal(r.sw, size[0]);
    await pg.click('.rcv-row.st-lock[data-rank="5"]', { force: true }); assert.equal(await pg.evaluate(() => document.querySelector('#p9join').disabled), true, '未解放を押しても選べない');
    await pg.click(`.rcv-row.ok[data-rank="${pick}"]`); await pg.waitForTimeout(450);
    assert.equal(await pg.evaluate((k) => document.querySelector(`.rcv-row[data-rank="${k}"]`).classList.contains('sel'), pick), true, '選択中の枠');
    await pg.click('#p9join'); await pg.waitForFunction((k) => S.m.raise.tour && S.m.raise.tour.rank === k, pick, { timeout: 15000 });
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []); await p.ctx.close();
  }
});
