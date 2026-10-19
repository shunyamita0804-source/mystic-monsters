// =========================================================
// 2026-10-14 Chapter 1 A／B／C 高品質化（実ブラウザ・本編の Chapter 1＝worldCh1:true）
//  HQ-B1（375×667・390×844・430×932）：実際の出発（A）→ 盤は skin 'hq1014'・地面／道／帯／水は新しい絵・景物の読み替えが読めている・404 なし
//          → 撤去した ?boardSkin=1010 の変数（MM_BOARD_SKIN）を入れて作り直しても hq1014 のまま・マスの位置（transform）・景物の数は同じ
//  HQ-B2：新しい絵がすべて 404 → 従来の絵へ戻る（盤は描き終わる・景物は従来の絵）
//  HQ-B3：B／C の絵（A2／T2／F2・A3／R2／RP2）＋くり返しのつなぎ目をブラウザで測る（地面7点）
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
// 2026-10-19 第2工程：道路・盤の絵の比較の URL（?qaRoadArt・?boardSkin）は撤去＝本編と同じ（盤 hq1014＋道路の新素材 fix）で確かめる
const openPage = async (o = {}) => { const p = await L.open({ worldCh1: true, ...o }); OPEN.push(p); return p; };
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close().catch(() => {}); });
const idle = (pg) => pg.waitForFunction(() => !bBusy && !MMCHD.isLocked() && !document.querySelector('.wbrelay,.wb-pop,.chf-enc2,.mmtalk,.chdz') && !MMWB.state().intro, null, { timeout: 40000 }).then(() => pg.waitForTimeout(300));
const depart = async (pg, v) => {
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); prepScr(); });
  await pg.waitForSelector('.pp .ppgobtn'); await pg.waitForTimeout(300);
  await H.startRaising(pg); await idle(pg);   // 2026-10-14 後半：景色の選択ボタンは撤去＝ルート（と景観）は openPage({ route }) で固定
  if (v) assert.equal(await pg.evaluate(() => S.m.raise.field.visualPattern), v);
  await pg.evaluate(() => MMWB.world().ready());
};
const look = (pg) => pg.evaluate(() => {
  const st = MMWB.world().state(), wrap = document.querySelector('#wbw .rfw');
  const sub = [...document.querySelectorAll('#wbw img.rfw-prop[data-k]')];
  return { skin: st.skin, art: st.artSkin, vis: wrap.dataset.visual, dskin: wrap.dataset.skin || null, painted: st.painted,
    nsub: sub.length, subOk: sub.every((i) => i.complete && i.naturalWidth > 0), subSrc: [...new Set(sub.map((i) => i.getAttribute('src').split('/').slice(-2).join('/')))].sort(),
    props: document.querySelectorAll('#wbw .rfw-prop:not(.rfw-mark)').length, tiles: [...document.querySelectorAll('#wbw .rfw-tile')].map((t) => t.dataset.node + '@' + t.style.transform).join('|'),
    apron: (document.querySelector('#wbw .rfw-apron') || {}).style ? document.querySelector('#wbw .rfw-apron').style.backgroundImage : null };
});
const rebuild = (pg, skin, vis) => pg.evaluate(async ([skin, vis]) => { window.MM_BOARD_SKIN = skin; if (vis) S.m.raise.field.visualPattern = vis; MMWB.release(); board(); await new Promise((r) => setTimeout(r, 50)); await MMWB.world().ready(); }, [skin, vis]).then(() => idle(pg));

for (const size of [[375, 667], [390, 844], [430, 932]]) {
  test(`HQ-B1（${size.join('×')}）：A は新しい絵・作り直しても同じ絵とマスの位置（従来の絵の切り替えは撤去）・404 なし`, { skip: SKIP, timeout: 150000 }, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await depart(pg, 'A');
    const n = await look(pg);
    assert.deepEqual([n.skin, n.dskin, n.vis, n.painted], ['hq1014', 'hq1014', 'A', true], JSON.stringify(n));
    assert.deepEqual(n.art, { ground: true, road: true, strip: true, water: true }, '地面・道・帯・水は新しい絵');
    assert.ok(n.nsub > 20 && n.subOk, `景物の読み替え（木・岩柱・小花）が読めている ${n.nsub}`);
    assert.deepEqual(n.subSrc, ['board_hq_1014/flowers_f1.webp', 'board_hq_1014/rockpillar_rp1.webp', 'board_hq_1014/tree_t1.webp'], 'A＝T1・RP1・F1');
    assert.match(n.apron, /(board_hq_1014\/ground_a1|road_1017\/ch1_ground_a1_fix)\.webp/, '草地の外の帯も A1（2026-10-18 から道路・地面は新素材 fix＝A1 の補修版）');
    await rebuild(pg, '1010');
    const o = await look(pg);
    assert.deepEqual([o.skin, o.dskin, o.nsub, o.art], [n.skin, n.dskin, n.nsub, n.art], '撤去した ?boardSkin=1010 の変数では従来の絵に戻らない（2026-10-19）');
    assert.equal(o.props, n.props, '景物の数は同じ'); assert.equal(o.tiles, n.tiles, 'マス（299地点）の位置は同じ');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('HQ-B2：新しい絵が読めない（404）→ 従来の絵へ戻る', { skip: SKIP, timeout: 150000 }, async () => {
  const p = await openPage({ size: [390, 844] }); const pg = p.page;
  await pg.route('**/assets/fields/ch1a/board_hq_1014/**', (r) => r.fulfill({ status: 404, body: '' }));
  await depart(pg, 'A');
  await pg.waitForFunction(() => [...document.querySelectorAll('#wbw img.rfw-prop[data-k]')].every((i) => /board_art_1010/.test(i.getAttribute('src')) && i.complete && i.naturalWidth > 0), null, { timeout: 15000 });
  const n = await look(pg);
  assert.deepEqual([n.skin, n.painted, n.art.water], ['hq1014', true, false], JSON.stringify(n));   // 地面・道・帯は道路の新素材 fix（road_1017＝別の場所の絵）で描く＝hq1014 の 404 の影響は水と景物だけ
  assert.ok(n.subSrc.every((s) => s.startsWith('board_art_1010/')), JSON.stringify(n.subSrc));
  assert.match(n.apron, /(board_art_1010\/ground_grass|road_1017\/ch1_ground_a1_fix)\.webp/);
  assert.deepEqual(p.errors, []);
  assert.ok(p.bad.every((b) => /board_hq_1014/.test(b)), '404 は新しい絵だけ');
});

test('HQ-B3：B／C の絵・地面7点のくり返しのつなぎ目', { skip: SKIP, timeout: 150000 }, async () => {
  const p = await openPage({ size: [390, 844], route: 'B' }); const pg = p.page;
  await depart(pg, 'B');
  const b = await look(pg);
  assert.deepEqual([b.vis, b.art.ground], ['B', true]);
  assert.deepEqual(b.subSrc, ['board_hq_1014/flowers_f2.webp', 'board_hq_1014/rockpillar_rp1.webp', 'board_hq_1014/tree_t2.webp'], 'B＝T2・F2（岩は RP1）');
  assert.match(b.apron, /ground_a2(_fix)?\.webp/);
  await rebuild(pg, null, 'C');
  const c = await look(pg);
  assert.deepEqual([c.vis, c.art.strip], ['C', true]);
  assert.deepEqual(c.subSrc, ['board_hq_1014/flowers_f1.webp', 'board_hq_1014/rockpillar_rp1.webp', 'board_hq_1014/rockpillar_rp2.webp', 'board_hq_1014/tree_t1.webp'], 'C＝RP2（遺跡の岩柱は RP1）');
  assert.match(c.apron, /ground_a3(_fix)?\.webp/);
  const seam = await pg.evaluate(async () => {
    const out = {};
    for (const f of ['ground_a1', 'ground_a2', 'ground_a3', 'road_r1', 'road_r2', 'water_w1', 'water_w2']) {
      const im = new Image(); im.src = `./assets/fields/ch1a/board_hq_1014/${f}.webp`; await im.decode();
      const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data, W = c.width, H = c.height, px = (x, y, k) => d[(y * W + x) * 4 + k];
      let e = 0, ne = 0, i = 0, ni = 0;
      for (let y = 0; y < H; y++) for (let k = 0; k < 3; k++) { e += Math.abs(px(0, y, k) - px(W - 1, y, k)); ne++; i += Math.abs(px(W / 2, y, k) - px(W / 2 - 1, y, k)); ni++; }
      for (let x = 0; x < W; x++) for (let k = 0; k < 3; k++) { e += Math.abs(px(x, 0, k) - px(x, H - 1, k)); ne++; i += Math.abs(px(x, H / 2, k) - px(x, H / 2 - 1, k)); ni++; }
      out[f] = +((e / ne) / (i / ni)).toFixed(2);
    }
    return out;
  });
  for (const [f, r] of Object.entries(seam)) assert.ok(r < 1.3, `${f}：端の差 ÷ 中の差 ${r}`);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
