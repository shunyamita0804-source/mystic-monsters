// =========================================================
// QA（実ブラウザ）：2026-10-15 フルーネの歩行 16コマ・技アニメ 77枚（QA 試遊モード ?mmQaTrial=1 だけ）
//  FA-B1（375×667・390×844・430×932）：歩行を確認＝front・back のコマが 12fps で実際に切り替わる・止めると front の1コマ目・
//        体の高さと足が静止の立ち絵とそろう（跳ねない）・画面の中・白背景の原歩行シートは使わない
//  FA-B2（390×844）：技アニメ No.01〜10＝本体（と効果）のコマが順に出て、終わると待機の立ち絵へ戻る（コマは残らない・本体が2つ重ならない）・
//        10 は「FX追加待ち」・09 は 2026-10-16 から「ルートドレイン」8コマ（QA の実戦 SK 58・プレビューでも同じ8コマ）・相手の HP は変わらない・OFF で貸した絵（IMG[5]・MMARENA.IDLE[5]）が消えて通常のセーブは同じ
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
const SHOT = path.join(os.tmpdir(), 'mm-flurene-anim-1015'); mkdirSync(SHOT, { recursive: true });
const ranchSave = async (pg) => { await H.newGame(pg, 'テスト'); await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; S.g = 1234; save(); farm(); }); };
const qaOn = async (pg) => { await ranchSave(pg); await pg.waitForSelector('#mmqa-sw'); await pg.click('#mmqa-sw'); await pg.waitForSelector('#mmqa .qcard'); await pg.click('#mmqa .qtab[data-i="5"]'); await pg.waitForSelector('#mmqa .qwk'); };
const wst = (pg) => pg.evaluate(() => { const w = document.querySelector('#mmqa .qwalk'); return { dir: w.dataset.dir, i: +w.dataset.i, play: w.dataset.play }; });

for (const size of [H.SIZES.se, H.SIZES.base, H.SIZES.max]) {
  test(`FA-B1（${size.join('×')}）：歩行 front・back が実際に切り替わる・止めると front の1コマ目・足と高さが立ち絵とそろう`, { skip: SKIP }, async () => {
    const p = await openPage({ query: '?mmQaTrial=1', size }); const pg = p.page; await qaOn(pg);
    await pg.click('#mmqa .qwk'); await pg.waitForSelector('#mmqa .qwalk');
    await pg.waitForFunction(() => [...document.querySelectorAll('#mmqa .qwf')].every((i) => i.complete && i.naturalWidth === 384), null, { timeout: 20000 });
    for (const dn of ['front', 'back']) {
      await pg.click(`#mmqa .qwbtn [data-a="${dn}"]`);
      const seen = new Set(); const t0 = Date.now();
      while (Date.now() - t0 < 1400) {
        const r = await pg.evaluate((dn) => { const on = [...document.querySelectorAll('#mmqa .qwf.on')]; return { n: on.length, dir: on[0] && on[0].dataset.dir, i: on[0] && +on[0].dataset.i, src: on[0] && on[0].getAttribute('src') }; }, dn);
        assert.equal(r.n, 1, '見えるコマは1枚'); assert.equal(r.dir, dn); assert.match(r.src, new RegExp(`walk_25d/flurene/flurene_walk_${dn}_0\\d\\.webp$`), '派生の透過 WebP（原歩行シートではない）');
        seen.add(r.i); await pg.waitForTimeout(40);
      }
      assert.equal(seen.size, 8, `${dn}：8コマすべてが順に出る（12fps × 1.4秒）`);
      await pg.screenshot({ path: path.join(SHOT, `b1_${size.join('x')}_${dn}.png`) });
    }
    // 止める → front の1コマ目
    await pg.click('#mmqa .qwbtn [data-a="play"]'); await pg.waitForTimeout(250);
    assert.deepEqual(await wst(pg), { dir: 'front', i: 0, play: '0' }, '止めると前（front）の1コマ目＝本編の盤の停止の姿');
    const a = await wst(pg); await pg.waitForTimeout(400); assert.deepEqual(await wst(pg), a, '止まっている間はコマが変わらない');
    // コマ送り
    await pg.click('#mmqa .qwbtn [data-a="next"]'); assert.equal((await wst(pg)).i, 1); await pg.click('#mmqa .qwbtn [data-a="prev"]'); await pg.click('#mmqa .qwbtn [data-a="prev"]'); assert.equal((await wst(pg)).i, 7);
    // 立ち絵と重ねる：体の高さ・足（不透明な画素の下端）がそろう＝止まる・歩くで跳ねない
    await pg.click('#mmqa .qwbtn [data-a="stand"]'); await pg.click('#mmqa .qwbtn [data-a="bg"]'); await pg.waitForTimeout(200);
    const g = await pg.evaluate(async () => {
      const st = document.querySelector('#mmqa .qws'), box = document.querySelector('#mmqa .qwbox').getBoundingClientRect();
      const meas = async (im) => { const r = im.getBoundingClientRect(), c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const x = c.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let top = c.height, bot = 0; for (let y = 0; y < c.height; y++) for (let k = 0; k < c.width; k++) if (d[(y * c.width + k) * 4 + 3] > 16) { if (y < top) top = y; if (y > bot) bot = y; } const s = r.height / c.height; return { top: r.top + top * s, bot: r.top + (bot + 1) * s }; };
      const fr = await Promise.all([...document.querySelectorAll('#mmqa .qwf')].map(meas)), sm = await meas(st);
      const w = document.querySelector('#mmqa .qwalk').getBoundingClientRect();
      return { fr, sm, inView: w.left >= 0 && w.right <= innerWidth + 0.5 && document.querySelector('#mmqa .qwst').getBoundingClientRect().bottom <= innerHeight, scroll: document.documentElement.scrollWidth <= innerWidth };
    });
    const hs = g.fr.map((r) => r.bot - r.top), sh = g.sm.bot - g.sm.top;
    for (const [k, r] of g.fr.entries()) { assert.ok(Math.abs(r.bot - g.sm.bot) <= 2.5, `コマ ${k}：足（下端）が立ち絵と ${(r.bot - g.sm.bot).toFixed(1)}px`); }
    assert.ok(Math.max(...hs) / sh < 1.03 && Math.min(...hs) / sh > 0.93, `体の高さ＝立ち絵の ${(Math.min(...hs) / sh).toFixed(3)}〜${(Math.max(...hs) / sh).toFixed(3)}`);
    assert.ok(g.inView && g.scroll, '画面の中・横にはみ出さない');
    await pg.screenshot({ path: path.join(SHOT, `b1_${size.join('x')}_stand_light.png`) });
    await pg.click('#mmqa .qwbtn [data-a="close"]'); assert.equal(await pg.$('#mmqa .qwalk'), null);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('FA-B2（390×844）：技アニメ No.01〜10＝コマが順に出て待機の立ち絵へ戻る・09＝ルートドレイン補修版10コマ・10＝専用の根と命中・HP は変わらない・OFF で元どおり', { skip: SKIP }, async () => {
  const p = await openPage({ query: '?mmQaTrial=1', size: H.SIZES.base }); const pg = p.page; await qaOn(pg);
  const s0 = await pg.evaluate(() => localStorage.getItem('mr4v6')), img0 = await pg.evaluate(() => IMG.length);
  const cards = await pg.evaluate(() => [...document.querySelectorAll('#mmqa .qcard')].map((c) => ({ st: c.dataset.status, fx: (c.querySelector('.qfx') || {}).textContent || '' })));
  assert.deepEqual(cards.map((c) => c.st), ['preview', 'preview', 'preview', 'preview', 'preview', 'preview', 'preview', 'preview', 'battle', 'preview'], '09 ルートドレインだけ QA の実戦（SK 58）');
  assert.deepEqual(cards.map((c) => /FX追加待ち/.test(c.fx)), [false, false, false, false, false, false, false, false, false, false], '2026-10-16：10 は専用の根と命中7枚が届いた');
  assert.equal(cards[8].fx, 'ルートドレイン 10コマ（補修版）'); assert.equal(cards[9].fx, '本体 5・効果 7'); assert.equal(cards[4].fx, '本体 5・効果 5');
  await pg.click('#mmqa .qcard[data-n="0"]'); await pg.click('#mmqa .qdet .qgo');
  await pg.waitForSelector('#bt.mmqa-prev'); await pg.waitForSelector('#mmqa-bar button');
  await pg.waitForFunction(() => /idle_flurene/.test((document.querySelector('#m0 .mma-idle') || {}).src || ''), null, { timeout: 15000 });
  assert.deepEqual(await pg.evaluate(() => [BPL[0].sp, IMG[5], MMARENA.IDLE[5]]), [5, './assets/monsters/2p5d/flurene.webp', 'idle_flurene'], 'QA の間だけフルーネの絵を貸す');
  const D = await pg.evaluate(() => MMFLMV_DATA);
  await pg.waitForTimeout(3600);   // 最初の自動再生（No.01）が終わるまで
  const hp0 = await pg.evaluate(() => [BPL[0].hp, BPL[1].hp]);
  for (let no = 1; no <= 10; no++) {
    const RD = no === 9, d = D[no], want = RD ? new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => 'RD:rd2_' + String(n).padStart(2, '0') + '.webp')) : new Set(d.cuts.flatMap((c) => [c.f, c.fx]).concat(d.fx.map((c) => c.f)).concat(no === 10 ? [1, 2, 3, 4, 5, 6, 7].map((n) => `f10_d0${n}_fx.webp`) : []).filter(Boolean));
    await pg.evaluate((no) => { window.__flSeen = new Set(); window.__flMax = 0; window.__flBody = 0;
      window.__flT = setInterval(() => { const im = [...document.querySelectorAll('#bt img.p25f')]; im.concat([...document.querySelectorAll('#bt .p25c > img')], [...document.querySelectorAll('#bt .mmrd img')]).forEach((i) => { const m = (i.getAttribute('src') || '').match(/flurene_moves_1015\/(.+)$/), r = (i.getAttribute('src') || '').match(/flurene_rootdrain_v2_1016\/(.+)$/), o = i.parentNode.classList.contains('p25c') ? i.parentNode : i.closest('.mmrd') || i; if (m && +getComputedStyle(o).opacity > 0.05) window.__flSeen.add(m[1]); if (r && +getComputedStyle(o).opacity > 0.05) window.__flSeen.add('RD:' + r[1]); });   // 2026-10-15 夜：相手へ飛ばす効果は切り出しの箱（.p25c）の中
        const vb = im.filter((i) => /_b\d\d\.webp$/.test(i.getAttribute('src') || '') && +getComputedStyle(i).opacity > 0.98).length; window.__flBody = Math.max(window.__flBody, vb); }, 16);
      const b = [...document.querySelectorAll('#mmqa-bar button')].find((e) => e.textContent.startsWith(String(no).padStart(2, '0'))); b.click(); }, no);
    if (no === 6) { await pg.waitForTimeout(820); await pg.screenshot({ path: path.join(SHOT, 'b2_06_mid.png') }); }
    await pg.waitForFunction(() => !document.querySelector('#bt img.p25f, #bt .mmrd'), null, { timeout: 8000 });
    await pg.waitForTimeout(250);
    const r = await pg.evaluate(() => { clearInterval(window.__flT); return { seen: [...window.__flSeen], body: window.__flBody, me: +getComputedStyle(document.getElementById('m0')).opacity, idle: /idle_flurene/.test((document.querySelector('#m0 .mma-idle') || {}).src || '') }; });
    assert.deepEqual(r.seen.filter((f) => !want.has(f)), [], `${no}：ほかの技の絵を出さない`);
    if (RD) { assert.deepEqual(r.seen.sort(), [...want].sort(), '09：ルートドレインの補修版10コマすべて'); }
    else {
      for (const c of d.cuts) assert.ok(r.seen.includes(c.f), `${no}：本体 ${c.f} が見えた`);
      assert.ok(r.seen.filter((f) => /_fx/.test(f)).length >= Math.max(0, d.effects - 1), `${no}：効果 ${d.effects} 枚のうち見えた ${r.seen.filter((f) => /_fx/.test(f)).length}`);
    }
    assert.ok(r.body <= 2, `${no}：本体の不透明なコマは切り替えの重なり（最大2）だけ＝${r.body}`);
    assert.ok(r.me > 0.95 && r.idle, `${no}：終わると待機の立ち絵へ戻る`);
  }
  assert.deepEqual(await pg.evaluate(() => [BPL[0].hp, BPL[1].hp]), hp0, '判定・ダメージなし（HP は変わらない）');
  const bt = await pg.textContent('#mmqa-bar'); assert.match(bt, /09(?!\*)[\s\S]*10(?!\*)/); assert.ok(!/FX追加待ち/.test(bt), '2026-10-16：FX追加待ちの技は無い');
  await pg.evaluate(() => MMQA.endBattle()); await pg.waitForSelector('#mmqa .qcard', { state: 'visible', timeout: 60000 });
  assert.deepEqual(await pg.evaluate(() => [IMG.length, IMG[5], MMARENA.IDLE[5]]), [img0, undefined, undefined], 'QA 試合のあとは貸した絵を戻す');
  await pg.click('#mmqa .qoff'); await pg.waitForSelector('#app>.rn');
  assert.equal(await pg.evaluate(() => localStorage.getItem('mr4v6')), s0, '通常のセーブは同じ');
  await pg.reload(); await pg.waitForFunction(() => typeof S === 'object' && window.MMQA);
  assert.deepEqual(await pg.evaluate(() => [MMQA.isOn(), S.g, S.m.sp, localStorage.getItem('mr4v6') === null]), [false, 1234, 0, false]);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
