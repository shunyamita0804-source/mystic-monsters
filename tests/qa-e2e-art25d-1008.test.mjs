// =========================================================
// 2026-10-08：2.5D バトル素材の比較試遊（実ブラウザ）
//  A25-B1：通常の URL＝今までの立ち絵・技の演出（新しい絵を1枚も読まない・切り替えの札なし）
//  A25-B2：?battleArt=2p5d（3サイズ）＝ソラモ・ガウルの立ち絵が 2.5D・技のコマが出て消える（DOM を残さない）・札で旧へ戻せる・相手は今まで
//  A25-B3（2026-10-09 完全版）：3サイズ × ソラモ／ガウル × 自分側／相手側で全10技の全コマを止めて確かめる
//    ＝各コマが順に出る・本体（顔・耳・翼・尾）が画面の中・HUD に入らない・相手側は左右反転
//  A25-B4：個別の再現テスト ①ガウルの顔が切れない ②ビーム・風・炎の先が相手へ届き画面の外で切れない ③必殺の爆発が消えない
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

async function toBattle(pg, sp) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate((sp) => { const m = mk(sp); m.name = 'テスト'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); board(); }, sp);
  await pg.waitForSelector('#chrcv .rcv-row', { timeout: 20000 });
  await pg.evaluate((sp) => { MMP8.startTournament(S, S.m, 0, 7); S.m.sk = sp ? [10, 11, 12, 13, 14, 15, 16, 17, 18, 19] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; S.m.eq = S.m.sk.slice(0, 6); save(); p8TourFight(); }, sp);
  await pg.waitForSelector('#bt #m0 .mon .mma-idle', { timeout: 20000 });
  await pg.waitForTimeout(300);
}
const idleSrc = (pg, s) => pg.evaluate((s) => { const i = document.querySelector(`#bt #m${s} .mon .mma-idle`); return i && i.getAttribute('src'); }, s);

test('A25-B1：通常の URL では今までの絵・演出（2.5D の素材を読まない・札なし）', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({ size: H.SIZES.base }); const pg = p.page;
  await toBattle(pg, 0);
  assert.match(await idleSrc(pg, 0), /assets\/battle\/idle\/idle_soramo\.webp$/);
  await pg.evaluate(() => anim(0, 0)); await pg.waitForTimeout(500);
  const r = await pg.evaluate(() => ({ p25: document.querySelectorAll('#bt .p25f, #bt .p25p').length, sw: !!document.querySelector('#bt .p25sw'), on: MM25D.on }));
  assert.deepEqual(r, { p25: 0, sw: false, on: false });
  assert.equal(L.requests ? L.requests.filter((u) => /2p5d/.test(u)).length : 0, 0, '2.5D の素材を読まない');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

for (const size of [H.SIZES.base, H.SIZES.se, [430, 932]]) {
  for (const sp of [0, 1]) {
    test(`A25-B2（${size.join('×')}・${sp ? 'ガウル' : 'ソラモ'}）：?battleArt=2p5d の立ち絵・技のコマ・切り替え`, { skip: SKIP, timeout: 120000 }, async () => {
      const p = await openPage({ size, query: '?battleArt=2p5d' }); const pg = p.page;
      await toBattle(pg, sp);
      const name = sp ? 'gauru' : 'soramo';
      assert.match(await idleSrc(pg, 0), new RegExp(`assets/battle/2p5d/${name}/idle\\.webp$`));
      const k = sp ? 11 : 0;
      await pg.evaluate((k) => anim(k, 0), k);
      await pg.waitForTimeout(450);
      const mid = await pg.evaluate(() => { const im = [...document.querySelectorAll('#bt .p25f')]; const bt = document.getElementById('bt').getBoundingClientRect();
        const vis = im.filter((i) => +getComputedStyle(i).opacity > 0.5); const r = vis[0] && vis[0].getBoundingClientRect();
        return { n: im.length, parts: document.querySelectorAll('#bt .p25p').length, vis: vis.length, ok: im.every((i) => i.complete && i.naturalWidth > 0), r: r && { l: r.left, r: r.right, t: r.top, b: r.bottom }, W: bt.width, sw: document.documentElement.scrollWidth, iw: innerWidth }; });
      assert.ok(mid.n >= 3 && mid.vis >= 1 && mid.ok, `コマが出ている ${JSON.stringify(mid)}`);
      assert.ok(mid.sw <= mid.iw + 1, '横にはみ出さない');
      if (!sp) assert.ok(mid.parts > 0, `コマの外へ続く光の粒が出る ${mid.parts}`);
      await pg.waitForTimeout(2300);
      assert.equal(await pg.evaluate(() => document.querySelectorAll('#bt .p25f, #bt .p25p').length), 0, '終わったら DOM を残さない（コマ・光の粒）');
      // 切り替えの札 → 旧の立ち絵 → もう一度 2.5D
      await pg.click('#bt .p25sw');
      assert.match(await idleSrc(pg, 0), new RegExp(`assets/battle/idle/idle_${name}\\.webp$`));
      await pg.evaluate((k) => anim(k, 0), k); await pg.waitForTimeout(400);
      assert.equal(await pg.evaluate(() => document.querySelectorAll('#bt .p25f').length), 0, '旧へ戻すと今までの演出');
      await pg.waitForTimeout(1800);
      await pg.click('#bt .p25sw');
      assert.match(await idleSrc(pg, 0), /2p5d/);
      assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
    });
  }
}

// ---- 2026-10-09 完全版：全コマを止めて測る ----
async function toBattleVs(pg, mySp, foeSp) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate((sp) => { const m = mk(sp); m.name = 'テスト'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); board(); }, mySp);
  await pg.waitForSelector('#chrcv .rcv-row', { timeout: 20000 });
  await pg.evaluate(([sp, foe]) => { MMP8.startTournament(S, S.m, 0, 7); S.m.sk = sp ? [10, 11, 12, 13, 14, 15, 16, 17, 18, 19] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; S.m.eq = S.m.sk.slice(0, 6); save();
    const o = window.battleFoeOnce; window.battleFoeOnce = () => o(foe); p8TourFight(); }, [mySp, foeSp]);
  await pg.waitForSelector('#bt #m0 .mon .mma-idle', { timeout: 20000 });
  await pg.waitForFunction(() => { const g = document.getElementById('go'); return g && !g.disabled && !document.getElementById('ban'); }, null, { timeout: 30000 });
  await pg.waitForTimeout(400);
  // バトルの進行（fight() のタイマー）を止める＝技の演出だけを確かめる（テストの中だけ）
  await pg.evaluate(() => { window.setTimeout = function () { return 0; }; window.setInterval = function () { return 0; }; });
}
// 技 k を側 s で出し、各コマの区間の中ほどで止めて測る
async function measureMove(pg, k, s) {
  const ok = await pg.evaluate(([k, s]) => { if (!MM25D.handles(k, s)) return false; anim(k, s); return true; }, [k, s]);
  assert.ok(ok, `技 ${k} を 2.5D で出せる（側 ${s}）`);
  await pg.waitForFunction(() => { const im = [...document.querySelectorAll('#bt .p25f')]; return im.length > 0 && im.every((i) => i.complete && i.naturalWidth > 0); }, null, { timeout: 8000 });
  const out = await pg.evaluate(([k, s]) => {
    const A = document.getAnimations().filter((a) => a.effect && a.effect.target && a.effect.target.classList && a.effect.target.classList.contains('p25f'));
    document.getAnimations().forEach((a) => { try { a.pause(); } catch (e) {} });
    const d = MM25D_DATA[k], D = A[0].effect.getTiming().duration, step = (D * 0.88) / d.cuts.length;
    const ims = [...document.querySelectorAll('#bt .p25f')];
    const hud = Math.max(...[...document.querySelectorAll('#bt .hpr')].map((e) => e.getBoundingClientRect().bottom));
    const tm = document.querySelector('#m' + (1 - s) + ' .mon').getBoundingClientRect(), tcx = tm.left + tm.width / 2;
    const res = [];
    for (let j = 0; j < d.cuts.length; j++) {
      A.forEach((a) => { a.currentTime = step * (j + 0.55); });
      const im = ims[j], c = d.cuts[j], r = im.getBoundingClientRect(), S = r.width / c.w, f = s ? -1 : 1;
      const bx0 = f > 0 ? r.left + (c.b[0] - c.x) * S : r.right - (c.b[2] - c.x) * S, bx1 = f > 0 ? r.left + (c.b[2] - c.x) * S : r.right - (c.b[0] - c.x) * S;
      const vis = ims.map((i) => +getComputedStyle(i).opacity);
      res.push({ j, src: c.src, dataCut: im.getAttribute('data-cut'), op: vis[j], others: Math.max(0, ...vis.filter((_, q) => q !== j)), loaded: im.complete && im.naturalWidth > 0,
        body: [bx0, r.top + (c.b[1] - c.y) * S, bx1, r.top + (c.b[3] - c.y) * S], img: [r.left, r.top, r.right, r.bottom], flip: new DOMMatrix(getComputedStyle(im).transform).a < 0, tcx });
    }
    const parts = [...document.querySelectorAll('#bt .p25p')], vr = document.querySelector('#bt .vs').getBoundingClientRect();
    const partsInfo = { n: parts.length, maxPerCut: 0, mask: getComputedStyle(ims[0]).maskImage || getComputedStyle(ims[0]).webkitMaskImage || 'none' };
    document.querySelectorAll('#bt .p25f, #bt .p25p, #bt .mmst').forEach((e) => e.remove()); document.getAnimations().forEach((a) => { try { a.cancel(); } catch (e) {} });
    return { n: d.cuts.length, hit: d.hit, res, hud, W: innerWidth, Hh: innerHeight, parts: partsInfo, ex: d.cuts.filter((c) => c.ex).length };
  }, [k, s]);
  return out;
}
const TOL = 2; // 揺れの演出（.vs の拡大）の分
const SIZES3 = [[375, 667], [390, 844], [430, 932]];
for (const size of SIZES3) {
  for (const sp of [0, 1]) {
    for (const side of [0, 1]) {
      test(`A25-B3（${size.join('×')}・${sp ? 'ガウル' : 'ソラモ'}・${side ? '相手側' : '自分側'}）：全10技の全コマ`, { skip: SKIP, timeout: 240000 }, async () => {
        const p = await openPage({ size, query: '?battleArt=2p5d', stage: true }); const pg = p.page;
        await toBattleVs(pg, side ? 1 - sp : sp, side ? sp : 1 - sp);
        let cuts = 0, parts = 0; const masks = [];
        for (let k = sp * 10; k < sp * 10 + 10; k++) {
          const m = await measureMove(pg, k, side);
          parts += m.parts.n; masks.push(m.parts.mask);
          assert.ok(m.parts.n <= m.n * 14, `技${k}：光の粒は1コマ14個まで ${m.parts.n}`);
          if (m.ex === 0) assert.equal(m.parts.n, 0);
          for (const c of m.res) {
            const at = `技${k} ${c.src}（${size.join('×')}・側${side}）`;
            assert.equal(c.dataCut, c.src, `${at}：順番どおり`);
            assert.ok(c.loaded, `${at}：読み込み済み`);
            assert.ok(c.op > 0.9 && c.others < 0.5, `${at}：このコマだけが見える op=${c.op} others=${c.others}`);
            assert.ok(c.body[0] >= -TOL && c.body[2] <= m.W + TOL, `${at}：本体が左右に切れない ${c.body.map(Math.round)} W=${m.W}`);
            assert.ok(c.body[1] >= m.hud - TOL, `${at}：本体が上の HUD に入らない top=${Math.round(c.body[1])} hud=${Math.round(m.hud)}`);
            assert.ok(c.body[3] <= m.Hh, `${at}：本体が下に切れない`);
            assert.equal(c.flip, side === 1, `${at}：向き（相手側は反転）`);
            cuts++;
          }
        }
        assert.equal(cuts, sp ? 48 : 49, '全コマを使う');
        assert.ok(parts > 0, `光の粒が出る ${parts}`); assert.ok(masks.every((m) => m === 'none'), '四角いマスクを使わない');
        assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
      });
    }
  }
}

test('A25-B4①：ガウルの顔（頭・嘴・頭頂の羽）が切れない（全技・両側・3サイズ）', { skip: SKIP, timeout: 300000 }, async () => {
  for (const size of SIZES3) for (const side of [0, 1]) {
    const p = await openPage({ size, query: '?battleArt=2p5d', stage: true }); const pg = p.page;
    await toBattleVs(pg, side ? 0 : 1, side ? 1 : 0);
    for (let k = 10; k < 20; k++) {
      const m = await measureMove(pg, k, side);
      for (const c of m.res) {
        // 顔は本体の上 35%。その範囲が画面の中・HUD の下にある
        const h = c.body[3] - c.body[1], faceB = c.body[1] + h * 0.35;
        assert.ok(c.body[1] >= m.hud - TOL && faceB <= m.Hh, `${c.src}（${size}・側${side}）：顔の高さ`);
        assert.ok(c.body[0] >= -TOL && c.body[2] <= m.W + TOL, `${c.src}（${size}・側${side}）：顔・翼が左右に切れない ${c.body.map(Math.round)}`);
      }
    }
    assert.deepEqual(p.errors, []); await p.ctx.close();
  }
});

test('A25-B4②：ビーム・風・炎の先が相手に届く（ソラモビーム・ウィンド・ファイアボール・フレアレイ。両側・3サイズ）', { skip: SKIP, timeout: 300000 }, async () => {
  const MOVES = [[0, 5], [1, 12], [1, 15], [1, 16]];
  for (const size of SIZES3) for (const side of [0, 1]) for (const sp of [0, 1]) {
    const list = MOVES.filter((x) => x[0] === sp); if (!list.length) continue;
    const p = await openPage({ size, query: '?battleArt=2p5d', stage: true }); const pg = p.page;
    await toBattleVs(pg, side ? 1 - sp : sp, side ? sp : 1 - sp);
    for (const [, k] of list) {
      const m = await measureMove(pg, k, side);
      const c = m.res[(m.hit || 1) - 1];
      const lead = side ? c.img[0] : c.img[2];
      assert.ok(side ? lead <= c.tcx : lead >= c.tcx, `技${k}（${size}・側${side}）：命中のコマの絵が相手の中心まで届く lead=${Math.round(lead)} tcx=${Math.round(c.tcx)}`);
      // 届いた先（相手の中心）が画面の中＝先端の手前で画面に切られない
      assert.ok(c.tcx > 0 && c.tcx < m.W, '相手の中心が画面の中');
      // 命中から後のコマもすべて見える
      for (const q of m.res.slice((m.hit || 1) - 1)) assert.ok(q.op > 0.9 && q.loaded, `${q.src}：命中の後のコマ`);
    }
    assert.deepEqual(p.errors, []); await p.ctx.close();
  }
});

test('A25-B4③：必殺の爆発が消えない（スタークラッシュ s08b・スターフォール s10b・フレアレイ g08b。両側）', { skip: SKIP, timeout: 300000 }, async () => {
  const MUST = { 4: ['s08_1', 's08_2', 's08_3', 's08_4', 's08b_1', 's08b_2', 's08b_3', 's08b_4'], 9: ['s10_1', 's10_2', 's10_3', 's10_4', 's10b_1', 's10b_2', 's10b_3', 's10b_4'], 16: ['g08_1', 'g08_2', 'g08_3', 'g08b_1', 'g08b_2', 'g08b_3'] };
  for (const size of SIZES3) for (const side of [0, 1]) for (const sp of [0, 1]) {
    const p = await openPage({ size, query: '?battleArt=2p5d', stage: true }); const pg = p.page;
    await toBattleVs(pg, side ? 1 - sp : sp, side ? sp : 1 - sp);
    for (const k of sp ? [16] : [4, 9]) {
      const m = await measureMove(pg, k, side);
      assert.deepEqual(m.res.map((c) => c.src), MUST[k], `技${k}：2枚のシートの全コマが順に出る`);
      for (const c of m.res) assert.ok(c.op > 0.9 && c.loaded, `${c.src}：見える`);
      if (k !== 16) {
        const ex = m.res.find((c) => c.src === (k === 4 ? 's08b_2' : 's10b_2'));
        const w = ex.img[2] - ex.img[0];
        assert.ok(w >= m.W * 0.4, `爆発のコマが大きく出る w=${Math.round(w)} W=${m.W}`);
        const cx = (ex.img[0] + ex.img[2]) / 2;
        assert.ok(cx > 0 && cx < m.W, '爆発の中心が画面の中');
      }
    }
    assert.deepEqual(p.errors, []); await p.ctx.close();
  }
});
