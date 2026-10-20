// =========================================================
// 実ブラウザ：2026-10-19 追加指令（巨大火山・旧混入の監査・Chapter ごとの分岐の見た目）
//  AB-1（390×844・375×667）：Chapter 4 の自由な分かれ道（J0）＝選ぶ看板（.wbbr・data-ch 4）は下の操作欄と重ならず画面の中・道標（正式の signpost）は
//        モンスターに重ならない・目印はすべて Chapter 4 の素材（Chapter 1 の白い門などは出ない）・選んだら歩いて盤へ戻る
//  AB-2：Chapter 4 の題字の中継に巨大火山（volcano_1440）が読めて出る
//  AB-3：Chapter 2 の目印はすべて Chapter 2 の正式美術（art_1016・art_1020・第3便のシンボル建物 symbols_1020/ch2_）
//  QA_E2E=1 のときだけ実行
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
let L = null;
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });
const OPEN = [];
const openPage = async (o) => { const p = await L.open(o); OPEN.push(p); return p; };
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close().catch(() => {}); });
const idle = (pg) => pg.waitForFunction(() => window.MMWB && MMWB.world() && MMWB.world().isReady() && !MMWB.state().intro && !document.querySelector('.wbrelay,.wb-pop,.mmtalk,.d3z') && !bBusy, null, { timeout: 90000 }).then(() => pg.waitForTimeout(800));

for (const size of [H.SIZES.base, H.SIZES.se]) {
  test(`AB-1（${size.join('×')}）：Chapter 4 の分かれ道＝選ぶ看板・道標・目印`, { skip: SKIP, timeout: 180000 }, async () => {
    const p = await openPage({ worldCh4: true, size, query: '?ch4trial=A' }); const pg = p.page; await idle(pg);
    await pg.evaluate(() => { const D = MMWD4.dataOf(S.m); MMQAJ.jump(MMQAJ.prevOf(D, 'J0'), 3); });
    await idle(pg);
    await pg.click('#brollbtn'); await pg.waitForSelector('.wbbr .chroute', { timeout: 30000 }); await pg.waitForTimeout(1200);
    const m = await pg.evaluate(() => { const R = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom]; };
      return { sheet: R(document.querySelector('.wbbr')), btns: [...document.querySelectorAll('.wbbr .chroute')].map(R), deck: R(document.querySelector('#chdock')),
        mon: R(document.querySelector('.rfw-mon .mon')), posts: [...document.querySelectorAll('.rfw-bpost')].map((e) => ({ r: R(e), src: e.getAttribute('src'), ok: e.complete && e.naturalWidth > 0 })),
        lms: [...document.querySelectorAll('.rfw-lm')].map((e) => e.getAttribute('src')), ch: document.querySelector('.wbbr').dataset.ch, bskin: document.querySelector('.wbbr').dataset.bskin || null, W: innerWidth, H: innerHeight }; });
    assert.equal(m.ch, '4'); assert.equal(m.bskin, null, '選ぶ看板の絵は未採用＝今の見た目');
    assert.ok(m.btns.length === 2 && m.btns.every((b) => b[0] >= 0 && b[2] <= m.W && b[1] >= 0), `看板は画面の中 ${JSON.stringify(m.btns)}`);
    assert.ok(m.sheet[3] <= m.deck[1] + 1, `看板は下の操作欄（START・サイコロ）と重ならない ${m.sheet[3]} / ${m.deck[1]}`);
    assert.equal(m.posts.length, 2, '道標＝自由な分かれ道 J0・H'); assert.ok(m.posts.every((x) => x.ok && /front_1020\/ch4_signpost_front\.webp$/.test(x.src)));   // 2026-10-20 第4便：正面向きの道標（E02）
    const vis = m.posts.filter((x) => x.r[2] - x.r[0] > 1);
    assert.ok(vis.length >= 1 && vis.every((x) => x.r[2] <= m.mon[0] || x.r[0] >= m.mon[2] || x.r[3] <= m.mon[1] || x.r[1] >= m.mon[3]), `道標はモンスターに重ならない ${JSON.stringify(vis)} / ${JSON.stringify(m.mon)}`);
    assert.ok(m.lms.length >= 8 && m.lms.every((s) => /ch4\/art_1019\/|front_1020\/ch4_|symbols_1020\//.test(s) && !/board_art_1010|lm_/.test(s)), `目印は Chapter 4 の素材だけ ${JSON.stringify(m.lms)}`);
    await pg.click('.wbbr .chroute'); await pg.waitForFunction(() => !document.querySelector('.wbbr') && document.querySelector('.rfw-mon.wk-on'), null, { timeout: 15000 });
    await idle(pg);
    assert.equal(await pg.evaluate(() => MMWB.world().qa().camMode), 'c', '選んだあとは C案カメラのまま');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('AB-2：Chapter 4 の題字の中継に巨大火山', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({ worldCh4: true, size: H.SIZES.base, query: '?ch4trial=B', intro: true }); const pg = p.page;
  await pg.waitForSelector('.wbrelay .wbr-fg', { timeout: 60000 });
  await pg.waitForFunction(() => { const i = document.querySelector('.wbrelay .wbr-fg'); return i && i.complete && i.naturalWidth > 0; }, null, { timeout: 30000 });
  const r = await pg.evaluate(() => { const i = document.querySelector('.wbrelay .wbr-fg'), b = i.getBoundingClientRect(); return { src: i.getAttribute('src'), w: b.width, bottom: b.bottom, H: innerHeight }; });
  assert.match(r.src, /ch4\/art_1019\/volcano_1440\.webp$/); assert.ok(r.w > 300 && r.bottom >= r.H * 0.9, JSON.stringify(r));
  await idle(pg);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('AB-3：Chapter 2 の目印は Chapter 2 の正式美術だけ', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({ worldCh2: true, size: H.SIZES.base, query: '?ch2trial=A' }); const pg = p.page; await idle(pg);
  const lms = await pg.evaluate(() => [...document.querySelectorAll('.rfw-lm')].map((e) => e.getAttribute('src')));
  assert.ok(lms.length >= 8 && lms.every((s) => /ch2\/art_10(16|20)\/|ch2\/tunnel_1020\/|symbols_1020\/ch2_|front_1020\/ch2_/.test(s)), JSON.stringify(lms));   // 2026-10-20 第3便：Chapter 2 のシンボル建物（螺旋の塔・水晶の神殿）も可・第5便：ガラス回廊の入口（F01）
  //  2026-10-20 第4便：道標（正面向き・E02）は陸の上の自由な分かれ道だけ（A は J0。H はまわりが海）。分岐の印・合流の印は未採用
  assert.deepEqual(await pg.evaluate(() => [...document.querySelectorAll('.rfw-bpost')].map((e) => e.getAttribute('src').split('/').pop())), ['ch2_signpost_front.webp']);
  assert.equal(await pg.evaluate(() => document.querySelectorAll('.rfw-bmark').length), 0, '分岐の印・合流の印は未採用');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
