// =========================================================
// 2026-10-12 開発21 ④（実ブラウザ・本編の Chapter 1）：冒険の HUD
//  HD-1（375×667・390×844・430×932）：Turn・空腹・所持金・特訓チケット（小さな印＋「特訓」＋所持数）が画面の幅に収まる・数字が大きい／
//         案内欄にフィナの丸顔・2行の文が切れない・START とコマンドに重ならない・safe-area の上
//  HD-2：空腹 80＝通常の色・81＝赤・80 に戻れば通常の色
//  HD-3：進行ライン＝START・GOAL の文字と育成中の子の丸い顔。位置＝GOAL までの最短の地点数（START 0・先へ進むと増える・行き止まりの寄り道では減る・GOAL 1）。歩く間も動く
//  Playwright / Chromium が無い環境では省略（skip）する。
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
const idle = (pg) => pg.waitForFunction(() => !bBusy && !MMCHD.isLocked() && !document.querySelector('.wbrelay,.wb-pop,.chf-enc2,.mmtalk,.chdz'), null, { timeout: 30000 }).then(() => pg.waitForTimeout(300));
async function toBoard(pg, tix = 0) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate((t) => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; S.trainTix = t; save(); MMP8.depart(S, m, () => 0.37); save(); board(); }, tix);
  await pg.waitForSelector('#wbw #brollbtn'); await idle(pg);
}
const rect = (pg, q) => pg.evaluate((q) => { const e = document.querySelector(q); if (!e) return null; const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom, w: b.width, h: b.height }; }, q);

for (const size of [[375, 667], [390, 844], [430, 932]]) {
  test(`HD-1（${size.join('×')}）：Turn・空腹・チケットが読める・フィナの丸顔つき2行の案内欄が切れない`, { skip: SKIP, timeout: 120000 }, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await toBoard(pg, 3);
    const r = await pg.evaluate(() => { const fs = (q) => parseFloat(getComputedStyle(document.querySelector(q)).fontSize); const m = document.querySelector('#bmsg'), f = document.querySelector('.wbmsg-f');
      return { chips: [...document.querySelectorAll('.wbh .chip')].map((e) => e.getBoundingClientRect().right), W: innerWidth, turn: fs('#chturn'), fat: fs('#chfat b'), tix: document.querySelector('#chtix').innerText.replace(/\s/g, ''), tk: !!document.querySelector('#chtix .chh-tk'),   /* 2026-10-12 夜・2：正式画像（img）。旧：仮の線画（svg） */
        clip: m.scrollHeight - m.clientHeight, lines: Math.round(m.clientHeight / parseFloat(getComputedStyle(m).lineHeight)), face: !!f && f.complete && f.naturalWidth > 0 }; });
    assert.ok(r.chips.every((x) => x <= r.W - 4), `チップは画面の中 ${JSON.stringify(r)}`); assert.ok(r.turn >= 15 && r.fat >= 15, '数字は大きく');
    assert.equal(r.tix, '特訓×3'); assert.ok(r.tk, '小さな印'); assert.ok(r.face, 'フィナの丸顔');
    assert.ok(r.clip <= 1 && r.lines === 2, `2行が切れない ${JSON.stringify(r)}`);
    const msg = await rect(pg, '.wbmsg'), st = await rect(pg, '#brollbtn'), dock = await rect(pg, '#chdock'), cmd = await rect(pg, '.chcmd');
    assert.ok(msg.b <= cmd.t + 1 && msg.b <= st.t + 1, `START・コマンドに重ならない ${JSON.stringify({ msg, st, cmd })}`); assert.ok(msg.t >= dock.t - 1, '案内欄は操作欄の中');
    assert.ok(st.b <= size[1] && cmd.b <= size[1], 'safe-area の上');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('HD-2：空腹 80＝通常の色・81＝赤・80 に戻れば通常の色', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({}); const pg = p.page;
  await toBoard(pg);
  const col = (v) => pg.evaluate((v) => { S.m.raise.fatigue = v; save(); board(); return getComputedStyle(document.querySelector('#chfat b')).color; }, v);
  const c80 = await col(80), c81 = await col(81), c80b = await col(80), c100 = await col(100);
  assert.equal(c81, 'rgb(255, 92, 77)'); assert.equal(c100, 'rgb(255, 92, 77)'); assert.notEqual(c80, c81); assert.equal(c80, c80b, '80 に戻れば通常');
  assert.equal(c80, 'rgb(255, 255, 255)');
  assert.deepEqual(p.errors, []);
});

test('HD-3：進行ライン＝START/GOAL と丸い顔。位置は GOAL までの最短の地点数（寄り道では戻る）・歩く間も動く', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({}); const pg = p.page;
  await toBoard(pg);
  const head = await pg.evaluate(() => ({ se: [...document.querySelectorAll('.wbh .chh-se')].map((e) => [e.textContent, getComputedStyle(e).display]), face: (document.querySelector('#chface img') || {}).getAttribute && document.querySelector('#chface img').getAttribute('src') }));
  assert.deepEqual(head.se, [['START', 'block'], ['GOAL', 'block']]); assert.match(head.face, /faces_25d\/face_soramo\.webp$/);
  const P = await pg.evaluate(() => { const d = MMRF_DATA, sp = Object.keys(d.segments).find((k) => d.segments[k][2] === 'reward_spur'), seg = d.segments[sp][3];
    return { start: MMWB.progressAt('START'), goal: MMWB.progressAt('GOAL'), j0: MMWB.progressAt('J0'), q: MMWB.progressAt('Q'), root: MMWB.progressAt(d.segments[sp][0]), deep: MMWB.progressAt(seg[seg.length - 1]), unknown: MMWB.progressAt('???') }; });
  assert.equal(P.start, 0); assert.equal(P.goal, 1); assert.ok(P.j0 > 0 && P.q > P.j0 && P.q < 1, JSON.stringify(P));
  assert.ok(P.deep < P.root, `行き止まりの奥ほど GOAL から遠い＝戻る ${JSON.stringify(P)}`); assert.equal(P.unknown, 0, '知らない地点は 0（安全）');
  // 歩く間も動く
  const left0 = await pg.evaluate(() => parseFloat(document.getElementById('chface').style.left));
  await pg.evaluate(() => { window.__lf = []; const f = () => { const e = document.getElementById('chface'); if (e) window.__lf.push(parseFloat(e.style.left)); if (window.__lf.length < 600) requestAnimationFrame(f); }; requestAnimationFrame(f); });
  await pg.evaluate(() => { window.__mr = Math.random; Math.random = () => (3 - 0.5) / 6; }); await pg.click('#brollbtn'); await pg.evaluate(() => { Math.random = window.__mr; });
  await idle(pg);
  const lf = await pg.evaluate(() => window.__lf), left1 = await pg.evaluate(() => parseFloat(document.getElementById('chface').style.left));
  assert.ok(left1 > left0, `進んだら右へ ${left0} → ${left1}`); assert.ok(new Set(lf).size >= 3, '歩く間に何度か動く');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
