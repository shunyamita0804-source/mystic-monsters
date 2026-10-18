// =========================================================
// 2026-10-12 レグナス（48枚）・ジオル（96枚）の正式の技アニメ（実ブラウザ・通常の URL）
//  RJB-1（375×667・390×844・430×932）：ライバル戦（共通演出あり）＝相手のレグナスが実際に使った技（初期の4技 20〜23）とコマが一致・左右反転・
//          待機の姿に戻る・コマは残らない・HP の枠より上に本体が出ない。続けて初期の4技を順に再生（全コマ・二重の待機絵なし）
//  RJB-2（3サイズ）：開発用のプレビュー（MM25D.preview）でレグナス 10技・ジオル 10技の全コマを順に＝データのコマと一致・待機に戻る・残らない・404 なし
//  RJB-3：コマが読めないとき（404）はその技だけ従来の演出（MMRP.anim の静止ポーズ）へ戻る
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
const openPage = async (o) => { const p = await L.open(o); OPEN.push(p); return p; };
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close().catch(() => {}); });
const SIZES = [H.SIZES.se, H.SIZES.base, H.SIZES.max];

async function toRival(pg) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; Object.assign(m, { li: 999, de: 400 }); MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); save(); board(); });
  await pg.waitForSelector('#chf .chf-bg');
  await pg.waitForFunction(() => !bBusy && !MMCHD.isLocked() && !document.querySelector('.chpop,.chdz,.chf-enc,.chf-fina,.mmtalk'), null, { timeout: 20000 });
  await pg.evaluate(() => { const r = S.m.raise; r.node = 'p5_0'; r.pend = { roll: 1, left: 0, stage: 'resolve' }; save(); board(); });
  await pg.waitForSelector('.chbat', { timeout: 20000 });
  await pg.evaluate(RECORD);
  await pg.evaluate(() => bBattleGo());
  await pg.waitForSelector('#bt #m1 .mon .mma-idle', { timeout: 20000 });
  assert.equal(await pg.evaluate(() => BPL[1].sp), 4, '相手はレグナス');
}
/** 技の演出の記録：animRaw(k, s) の呼び出しと、そのあと出たコマ（data-cut）・向き・本体の上端 */
const RECORD = () => {
  window.__mv = [];
  const o = window.animRaw; window.animRaw = function (k, s) { window.__mv.push({ k, s, cuts: [], flip: [], t: performance.now() }); return o.apply(this, arguments); };
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => {
    if (n.nodeType !== 1 || !n.classList.contains('p25f')) return; const r = window.__mv[window.__mv.length - 1]; if (!r) return;
    r.cuts.push(n.dataset.cut); requestAnimationFrame(() => r.flip.push(/scaleX\(-1\)|matrix\(-/.test(n.style.transform + ' ' + getComputedStyle(n).transform)));
  }))).observe(document.body, { childList: true, subtree: true });
};
const filesOf = (d) => d.cuts.map((c) => c.src).concat(d.cuts.filter((c) => c.fx).map((c) => c.src + '_fx'), (d.fx || []).map((c) => c.src));
/** 1つの技を再生して：出たコマ・途中で攻撃側の待機絵が隠れている・終わったら戻る・残らない */
async function playOne(pg, js, side) {
  // 自分の番（STOP を押すまで相手は動かない）で再生する＝実戦の技の演出と重ならない
  await pg.waitForFunction(() => { const g = document.getElementById('go'); return g && !g.disabled && !g.classList.contains('bk') && !document.querySelector('.p25f,#bt .rp-l'); }, null, { timeout: 30000 });
  return pg.evaluate(async ({ js, side }) => {
    const cut = []; const mo = new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1 && n.classList.contains('p25f')) cut.push(n.dataset.cut); })));
    mo.observe(document.body, { childList: true, subtree: true });
    const ok = (0, eval)(js);
    await new Promise((r) => setTimeout(r, 450));
    const me = document.getElementById('m' + side), op = getComputedStyle(me).opacity;
    // 見えているコマ（不透明）の左右が画面の中か
    const W = innerWidth, vis = [...document.querySelectorAll('.p25f')].filter((i) => +getComputedStyle(i).opacity > 0.5).map((i) => i.getBoundingClientRect());
    const onScreen = vis.every((r) => r.right > 0 && r.left < W);
    await new Promise((r) => setTimeout(r, 3400));
    mo.disconnect();
    return { ok, cut, midOpacity: +op, endOpacity: +getComputedStyle(me).opacity, left: document.querySelectorAll('.p25f').length, onScreen, nvis: vis.length };
  }, { js, side });
}

for (const size of SIZES) {
  test(`RJB-1（${size.join('×')}）：ライバル戦のレグナス＝実戦で使った技のコマ・反転・待機に戻る／初期の4技を順に`, { skip: SKIP, timeout: 300000 }, async () => {
    const p = await openPage({ size, stage: true }); const pg = p.page;
    await toRival(pg);
    assert.deepEqual(await pg.evaluate(() => BPL[1].eq), [20, 21, 22, 23, -1, -1], '初期の4技のまま');
    // 実戦：レグナスが2回技を使うまで（または決着まで）
    const t0 = Date.now();
    while (Date.now() - t0 < 200000) {
      const s = await pg.evaluate(() => { const g = document.getElementById('go'); return { n: window.__mv.filter((r) => r.s === 1).length, bt: !!document.getElementById('bt'), back: !!g && g.classList.contains('bk'), can: !!g && !g.disabled }; });
      if (!s.bt || s.n >= 2) break;
      if (s.back) break;
      if (s.can) await pg.click('#go').catch(() => {});
      await pg.waitForTimeout(300);
    }
    await pg.waitForTimeout(3500);
    const { mv, D } = await pg.evaluate(() => ({ mv: window.__mv, D: MMREMV_DATA }));
    const used = mv.filter((r) => r.s === 1 && r.k >= 20 && r.k <= 23);
    assert.ok(used.length >= 1, `レグナスの技 ${JSON.stringify(mv.map((r) => [r.k, r.s]))}`);
    for (const r of used) {
      assert.deepEqual([...r.cuts].sort(), filesOf(D[r.k]).sort(), `技 ${r.k}（${D[r.k].name}）のコマ`);
      assert.ok(r.flip.length && r.flip.every(Boolean), `技 ${r.k}：相手側は左右反転`);
    }
    if (await pg.evaluate(() => !!document.getElementById('bt'))) {
      // 初期の4技を順に（相手側）
      for (const k of [20, 21, 22, 23]) {
        const r = await playOne(pg, `animRaw(${k}, 1)`, 1);
        const D2 = await pg.evaluate((k) => MMREMV_DATA[k], k);
        assert.deepEqual([...r.cut].sort(), filesOf(D2).sort(), `技 ${k}`);
        assert.ok(r.midOpacity < 0.1, `技 ${k}：再生中は待機の絵を隠す（二重に見えない） ${r.midOpacity}`);
        assert.ok(r.endOpacity > 0.95, `技 ${k}：終わったら待機の絵に戻る`); assert.equal(r.left, 0, `技 ${k}：コマは残らない`); assert.ok(r.onScreen && r.nvis >= 1, `技 ${k}：画面の中`);
      }
      await pg.screenshot({ path: `/tmp/rjb1-${size.join('x')}.png` }).catch(() => {});
    }
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

for (const size of SIZES) {
  test(`RJB-2（${size.join('×')}）：開発用のプレビューでレグナス 10技・ジオル 10技の全コマ`, { skip: SKIP, timeout: 300000 }, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await toRival(pg);
    for (const [kind, side] of [['regnas', 1], ['jiol', 0]]) {
      for (let no = 1; no <= 10; no++) {
        const r = await playOne(pg, `MM25D.preview('${kind}', ${no}, ${side})`, side);
        // 2026-10-18 REV3：表示は MMTUNE.patch の写し（A4 ジオインパクト＝円錐の衝撃波 J9_8_cone・A3 ロックアッパー＝j08_02）
        const d = await pg.evaluate(({ kind, no }) => { const d0 = kind === 'jiol' ? MMJIMV_DATA[no] : MMREMV_DATA[20 + no - 1]; return window.MMTUNE ? MMTUNE.patch(d0, d0.dir) : d0; }, { kind, no });
        assert.equal(r.ok, true, `${kind} ${no}`);
        assert.deepEqual([...r.cut].sort(), filesOf(d).sort(), `${kind} ${no}（${d.name}）の全コマ`);
        assert.ok(r.endOpacity > 0.95, `${kind} ${no}：待機に戻る`); assert.equal(r.left, 0, `${kind} ${no}：残らない`); assert.ok(r.onScreen, `${kind} ${no}：画面の中`);
      }
    }
    // 視差を減らす設定でも再生して片付く
    await pg.emulateMedia({ reducedMotion: 'reduce' });
    const r = await playOne(pg, `MM25D.preview('jiol', 9, 0)`, 0); assert.equal(r.left, 0); assert.ok(r.endOpacity > 0.95);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('RJB-3：レグナスのコマが読めないときはその技だけ従来の演出（静止ポーズ）', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({ size: H.SIZES.base }); const pg = p.page;
  await pg.route(/regnas_moves_1012\/21_/, (r) => r.fulfill({ status: 404, body: '' }));
  await toRival(pg);
  await pg.waitForFunction(() => MM25D.failed.size > 0, null, { timeout: 15000 });
  const r = await pg.evaluate(() => ({ h21: MM25D.handles(21, 1), h20: MM25D.handles(20, 1) }));
  assert.equal(r.h21, false); assert.equal(r.h20, true);
  assert.ok(await pg.evaluate(() => { animRaw(21, 1); return document.querySelectorAll('#bt .rp-l img').length >= 1 && !document.querySelector('.p25f'); }), '従来の演出');
  await pg.waitForFunction(() => !document.querySelector('#bt .rp-l'), null, { timeout: 2500 });
  assert.deepEqual(p.errors, []);
});
