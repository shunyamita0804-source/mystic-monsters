// =========================================================
// QA（実ブラウザ）：2026-10-05 正式素材（大会ランク選択の画像・街の名札・共通UI A群の一部）
//  UI-B1：街の名札（正式画像）がお知らせ・設定の丸ボタンと重ならない・縦横比のまま・横にはみ出さない（360／375／390／414）
//  UI-B2：ベースキャンプの「出発する」（A-04）・所持金（A-05）＝正式画像が読める・縦横比のまま・文字は HTML で収まる
//  UI-B3：大会ランク選択＝行ごとに参加可能／参加不可の正式画像。解除の演出（参加不可の画像が消える）→ 選べる。参加不可は選べない
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
const T = (name, fn) => test(name, { skip: SKIP }, fn);
const SIZES = [[360, 800], [375, 667], [390, 844], [414, 896]];
const loaded = (pg, sel) => pg.waitForFunction((sel) => [...document.querySelectorAll(sel)].every((i) => i.complete && i.naturalWidth > 0), sel, { timeout: 10000 });

for (const size of SIZES) {
  T(`UI-B1（${size.join('×')}）：街の名札は正式画像・丸ボタンと重ならない・縦横比のまま`, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await H.newGame(pg, 'ユウ');
    await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; S.m = m; save(); lobby(); });
    await pg.waitForSelector('.map.town .tcity-img'); await loaded(pg, '.tcity-img'); await pg.waitForTimeout(400);
    const r = await pg.evaluate(() => {
      const c = document.querySelector('.tcity').getBoundingClientRect(), w = c.width, h = c.height;
      const ct = { l: c.left, r: c.right, t: c.top, b: c.bottom };   // 箱＝絵の部分（透明な余白を除いた 686×280）
      const hit = [...document.querySelectorAll('.map.town .tround, .map.town .tpin span')].filter((e) => { const o = e.getBoundingClientRect(); return !(o.right <= ct.l || o.left >= ct.r || o.bottom <= ct.t || o.top >= ct.b); }).length;
      const im = document.querySelector('.tcity-img');
      return { hit, ratio: w / h, nat: 400 / 204, src: im.getAttribute('src'), top: ct.t, sw: document.documentElement.scrollWidth, text: !!document.querySelector('.tcity b') };
    });
    assert.equal(r.hit, 0, 'お知らせ・設定・施設の札と重ならない'); assert.ok(Math.abs(r.ratio - r.nat) < 0.02, '縦横比のまま'); assert.match(r.src, /assets\/ui\/recovery_1006\/town\/nameplate_mistria\.png$/);   // 2026-10-07 正式UI回収（ZIP 095601）
    assert.ok(r.top >= 0); assert.equal(r.sw, size[0]); assert.equal(r.text, false, 'コードで作った名札は出さない');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });

  T(`UI-B2（${size.join('×')}）：ベースキャンプの「出発する」（A-04）・所持金（A-05）は正式画像・縦横比のまま・文字が収まる`, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await H.newGame(pg, 'ユウ');
    await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; S.g = 99999; save(); hall('t'); });
    await pg.waitForSelector('.bcgo .fmgo.bcdep'); await pg.waitForTimeout(500);
    const r = await pg.evaluate(() => {
      const one = (sel) => { const e = document.querySelector(sel), b = e.getBoundingClientRect(), cs = getComputedStyle(e); return { ratio: b.width / b.height, bg: cs.backgroundImage, fit: [...e.children].every((c) => c.scrollWidth <= c.clientWidth + 1 || getComputedStyle(c).display === 'none'), inView: b.left >= 0 && b.right <= innerWidth && b.top >= 0 && b.bottom <= innerHeight, sw: e.scrollWidth <= e.clientWidth + 1 }; };
      return { go: one('.bcgo .fmgo.bcdep'), gold: one('.bcgold'), sw: document.documentElement.scrollWidth };
    });
    assert.match(r.go.bg, /a04_main_button_red\.webp/); assert.ok(Math.abs(r.go.ratio - 720 / 194) < 0.05, `出発するは縦横比のまま（${r.go.ratio}）`); assert.ok(r.go.inView && r.go.fit);
    assert.match(r.gold.bg, /a05_currency_panel\.webp/); assert.ok(Math.abs(r.gold.ratio - 540 / 169) < 0.05, `所持金は縦横比のまま（${r.gold.ratio}）`); assert.ok(r.gold.inView && r.gold.sw, '99999 G が収まる');
    assert.equal(r.sw, size[0]);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

T('UI-B3：大会ランク選択（2026-10-07 正式UI回収＝ZIP 102319）＝行ごとにランクの帯＋状態の札（参加可能 E・D／参加不可 C〜S）。新しく選べるようになった行は札が参加不可 → 参加可能。参加不可は選べない。参加は確認ダイアログ（いいえ＝閉じるだけ／はい＝開始）', async () => {
  const p = await openPage({ size: [390, 844], tourconf: true }); const pg = p.page;
  await H.newGame(pg, 'ユウ');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; S.npcFlags = S.npcFlags || {}; S.npcFlags.rankSeen = { [m.uid]: 0 }; save(); board(); });   // 前に見た最高＝E → D が新しく選べる
  await pg.waitForSelector('.rcv-row'); await loaded(pg, '.rcv-img');
  const r = await pg.evaluate(() => [...document.querySelectorAll('.rcv-row')].map((x) => ({ k: +x.dataset.rank, tag: x.tagName, src: [...x.querySelectorAll('.rcv-img')].map((i) => i.getAttribute('src').replace(/^.*\//, '')), now: x.querySelector('.rcv-now').textContent, un: x.classList.contains('unlocking') })));
  assert.deepEqual(r.map((x) => x.k), [5, 4, 3, 2, 1, 0]);
  for (const x of r.filter((x) => x.k >= 2)) assert.deepEqual([x.tag, x.src, x.now], ['DIV', [`rank_${'EDCBAS'[x.k]}.png`], '参加不可']);
  assert.deepEqual(r.find((x) => x.k === 1), { k: 1, tag: 'BUTTON', src: ['rank_D.png'], now: '参加可能', un: true }, 'D は解除の演出');
  assert.deepEqual(r.find((x) => x.k === 0), { k: 0, tag: 'BUTTON', src: ['rank_E.png'], now: '参加可能', un: false });
  await pg.waitForTimeout(1900);
  assert.deepEqual(await pg.evaluate(() => [+getComputedStyle(document.querySelector('.rcv-row[data-rank="1"] .rcv-was')).opacity, +getComputedStyle(document.querySelector('.rcv-row[data-rank="1"] .rcv-now')).opacity]), [0, 1], '参加不可の札が消えて参加可能');
  await pg.click('.rcv-row.lk[data-rank="2"]', { force: true }); assert.equal(await pg.evaluate(() => document.querySelectorAll('.rcv-row.sel').length), 0, '参加不可は選べない');
  await pg.click('.rcv-row[data-rank="1"]'); await pg.waitForTimeout(450);
  assert.equal(await pg.evaluate(() => document.querySelector('#p9join').disabled), false);
  await pg.click('#p9join'); await pg.waitForSelector('#p9conf .p9conf-no'); await pg.waitForTimeout(420);
  await pg.click('#p9conf .p9conf-no'); await pg.waitForTimeout(200);
  assert.deepEqual(await pg.evaluate(() => [!!document.getElementById('p9conf'), !!S.m.raise.tour]), [false, false], 'いいえ＝閉じるだけ');
  await pg.waitForTimeout(400); await pg.click('#p9join'); await pg.waitForSelector('#p9conf .p9conf-yes'); await pg.waitForTimeout(420);
  await pg.click('#p9conf .p9conf-yes'); await pg.waitForTimeout(300);
  assert.deepEqual(await pg.evaluate(() => [!!document.getElementById('p9conf'), S.m.raise.tour && S.m.raise.tour.rank]), [false, 1], 'はい＝ランクDで開始');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
