// =========================================================
// 実ブラウザ：P2 空腹と食事（2026-10-12。値・価格・入荷は P2 試遊用の暫定値）
//  P2B-1（390×844・375×667）：新しいゲーム → 登録で新人支援（1000G＋ジャガイモ×10・薬草なし）→ アイテム屋の購入＝6種（未入荷は 🔒 と条件）・
//        画像は読み込める（404 なし）・はみ出さない → ジャガイモを買う（保管庫・所持金）
//  P2B-2（390×844・375×667）：1枚の世界のボード（worldCh1）で空腹 100 → アイテム → 食べる（90・START を押せる）→ もう一度開くと押せない・理由 →
//        再読み込みしても押せない → 休む（空腹 −10・1ターン）→ 食べられる。HUD は「空腹」・操作欄は派生の画像と「空腹 −10」（休むの枠の中）
//  P2B-3：食事6種の画像を 64px で暗い地・明るい地に並べて読める（naturalWidth・透過）。スクリーンショットはリポジトリの外
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
const openPage = async (o = {}) => { const p = await L.open(o); OPEN.push(p); return p; };
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close().catch(() => {}); });
const SHOT = path.join(os.tmpdir(), 'mm-p2-1012');
const idle = (pg) => pg.waitForFunction(() => !bBusy && !MMCHD.isLocked() && !document.querySelector('.wb-pop,.chf-enc2,.mmtalk,.chdz'), null, { timeout: 30000 }).then(() => pg.waitForTimeout(300));

for (const size of [H.SIZES.base, H.SIZES.se]) {
  test(`P2B-1（${size.join('×')}）：新人支援＝ジャガイモ×10 → アイテム屋の購入＝6種（未入荷は🔒）→ 買う`, { skip: SKIP, timeout: 120000 }, async () => {
    const p = await openPage({ size }); const pg = p.page; mkdirSync(SHOT, { recursive: true });
    await H.newGame(pg, 'テスト');
    const a = await pg.evaluate(() => ({ g: S.g, bag: S.inv.bag, vault: S.inv.vault, sup: S.npcFlags && S.npcFlags.support }));
    assert.deepEqual([a.bag, a.sup], [[{ id: 'potato', n: 10 }], 1], '新人支援＝ジャガイモ10個（1枠）・薬草なし');
    await pg.evaluate(() => { const m = mk(0); MMP7.ensureProg(m); S.m = MMP8.initIndividual(S, m); S.g = 300; save(); shopScr('', false, 'buy'); });
    await pg.waitForSelector('.ds.shop .dcard .t');
    await pg.waitForFunction(() => [...document.querySelectorAll('.ds.shop .dcard .t img.itic')].every((i) => i.complete && i.naturalWidth > 0));
    const rows = await pg.evaluate(() => [...document.querySelectorAll('.ds.shop .dcard .t')].map((b) => ({ t: b.textContent.replace(/\s+/g, ''), dis: b.disabled, lock: b.classList.contains('shlock'), img: b.querySelector('img.itic') && b.querySelector('img.itic').getAttribute('src') })));
    assert.equal(rows.length, 6);
    assert.deepEqual(rows.map((r) => r.lock), [false, false, false, true, true, true]);
    assert.match(rows[0].t, /ジャガイモ空腹−1020G/); assert.match(rows[3].t, /骨付き肉空腹−40🔒ランクE大会で優勝すると入荷/); assert.match(rows[5].t, /ランクB大会で優勝すると入荷/);
    assert.deepEqual(rows.map((r) => r.img), ['01', '02', '03', '07', '11', '22'].map((n) => `./assets/items/body_1012/${n}.webp`));
    assert.ok(rows.slice(3).every((r) => r.dis), '未入荷は押せない');
    assert.ok(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'はみ出さない');
    await pg.screenshot({ path: path.join(SHOT, `${size[0]}_shop.png`) });
    await pg.click('.ds.shop .dcard .t:nth-of-type(1)');
    await pg.waitForFunction(() => S.inv.vault.some((it) => it.id === 'potato'));
    assert.deepEqual(await pg.evaluate(() => [S.g, S.inv.vault, JSON.parse(localStorage.getItem('mr4v6')).g]), [280, [{ id: 'potato' }], 280]);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });

  test(`P2B-2（${size.join('×')}）：空腹 100 → 食べる → 1ターン1個（再読み込みでも）→ 休む −10 → 食べられる・HUD と操作欄の言葉`, { skip: SKIP, timeout: 150000 }, async () => {
    const p = await openPage({ size, worldCh1: true }); const pg = p.page; mkdirSync(SHOT, { recursive: true });
    await H.newGame(pg, 'テスト');
    await pg.evaluate(() => { const m = mk(1); MMP7.ensureProg(m); S.m = m; S.inv.bag = [{ id: 'potato', n: 3 }, { id: 'herb' }]; save(); MMP8.depart(S, m, () => 0.37); S.m.raise.fatigue = 100; save(); board(); });
    await pg.waitForSelector('#wbw #brollbtn'); await idle(pg);
    const hud = await pg.evaluate(() => ({ lab: document.querySelector('#chfat span').textContent, deck: document.querySelector('.chdeck-bg').getAttribute('src'), start: document.getElementById('brollbtn').disabled }));
    assert.deepEqual(hud, { lab: '空腹', deck: './assets/fields/ch1a/ui/deck_start_hunger.webp', start: true });
    const lb = await pg.evaluate(() => { const l = document.querySelector('.chwing .chwlbl'), w = l.closest('.chwing'), r = l.getBoundingClientRect(), b = w.getBoundingClientRect(), cs = getComputedStyle(l); return { t: l.textContent, inside: r.left >= b.left && r.right <= b.right && r.top >= b.top && r.bottom <= b.bottom, fs: parseFloat(cs.fontSize), vis: cs.visibility, color: cs.color }; });
    assert.equal(lb.t, '空腹 −10'); assert.ok(lb.inside, '休むの枠の中'); assert.ok(lb.fs >= 6 && lb.vis === 'visible', JSON.stringify(lb));
    await pg.evaluate(() => MMWB.items()); await pg.waitForSelector('#chitems');
    const it = await pg.evaluate(() => [...document.querySelectorAll('#chitems button[onclick^="MMWB.useItem"]')].map((b) => ({ t: b.textContent.replace(/\s+/g, ''), dis: b.disabled })));
    assert.deepEqual(it.map((x) => x.dis), [false, false]); assert.match(it[0].t, /ジャガイモ×3空腹−10/); assert.match(it[1].t, /薬草空腹−30/);
    await pg.screenshot({ path: path.join(SHOT, `${size[0]}_items.png`) });
    await pg.click('#chitems button[onclick^="MMWB.useItem"]');
    await pg.waitForFunction(() => S.m.raise.fatigue === 90); await idle(pg);
    assert.deepEqual(await pg.evaluate(() => [document.getElementById('brollbtn').disabled, S.m.raise.turnsUsed, S.inv.bag]), [false, 0, [{ id: 'potato', n: 2 }, { id: 'herb' }]], '食べて 90＝振れる・ターンは使わない');
    const chk = async () => { await pg.evaluate(() => MMWB.items()); await pg.waitForSelector('#chitems'); const r = await pg.evaluate(() => ({ why: (document.querySelector('#chitems .chit-why') || {}).textContent || '', dis: [...document.querySelectorAll('#chitems button[onclick^="MMWB.useItem"]')].every((b) => b.disabled) })); await pg.evaluate(() => MMWB.itemsClose()); return r; };
    assert.deepEqual(await chk(), { why: 'このターンはもう食べた。（1ターンに1個まで）', dis: true });
    await pg.reload(); await pg.waitForFunction(() => typeof window.MMP8 === 'object' && typeof S === 'object'); await pg.waitForSelector('.p15start'); await pg.click('.p15start');
    await pg.waitForSelector('#wbw #brollbtn'); await idle(pg);
    assert.deepEqual(await chk(), { why: 'このターンはもう食べた。（1ターンに1個まで）', dis: true }, '再読み込みしても同じターンは食べられない');
    await pg.evaluate(() => MMWB.rest()); await pg.waitForFunction(() => S.m.raise.turnsUsed === 1); await idle(pg);
    assert.equal(await pg.evaluate(() => S.m.raise.fatigue), 80, '休む＝空腹 −10');
    assert.deepEqual(await chk(), { why: '', dis: false }, '次のターンは食べられる');
    assert.ok(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await pg.screenshot({ path: path.join(SHOT, `${size[0]}_board.png`) });
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('P2B-3：食事6種の画像（64px）を暗い地・明るい地で表示できる（読み込み・透過）', { skip: SKIP, timeout: 60000 }, async () => {
  const p = await openPage({}); const pg = p.page; mkdirSync(SHOT, { recursive: true });
  await pg.evaluate(() => { const d = document.createElement('div'); d.id = 'p2v'; d.style.cssText = 'position:fixed;inset:0;z-index:99999;display:grid;grid-template-columns:repeat(6,64px);gap:6px;padding:10px;background:#777;align-content:start';
    for (const bg of ['#0b1636', '#efe6d2', '#ffffff']) for (const f of MMFOOD.FOODS) { const c = document.createElement('div'); c.style.cssText = `width:64px;height:64px;background:${bg}`; const i = new Image(); i.src = f.img; i.style.cssText = 'width:64px;height:64px;object-fit:contain'; c.appendChild(i); d.appendChild(c); }
    document.body.appendChild(d); });
  await pg.waitForFunction(() => [...document.querySelectorAll('#p2v img')].every((i) => i.complete && i.naturalWidth === 256));
  const corner = await pg.evaluate(async () => { const out = []; for (const f of MMFOOD.FOODS) { const i = new Image(); i.src = f.img; await i.decode(); const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); x.drawImage(i, 0, 0); out.push(x.getImageData(0, 0, 1, 1).data[3]); } return out; });
  assert.deepEqual(corner, [0, 0, 0, 0, 0, 0], '四隅は透明');
  await pg.locator('#p2v').screenshot({ path: path.join(SHOT, 'foods_64.png') });
  assert.deepEqual(p.bad, []);
});
