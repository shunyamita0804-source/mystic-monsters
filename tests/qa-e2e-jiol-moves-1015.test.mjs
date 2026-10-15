// =========================================================
// QA（実ブラウザ）：2026-10-15 ジオルの正式10技を QA 試遊モード（?mmQaTrial=1）の実戦で使う
//  JB-1（390×844）：ジオルの10枚が「実戦可能」→ 1技ずつ QA 試合（比較 → 対戦開始 → ルーレット6枠すべてその技 → STOP）＝
//        その技の技アニメのコマ（96枚の該当分）が出る・本当に効く（ダメージ技＝相手のライフが減る・力をためる＝自分の攻撃力 中UP 2T）
//        → QA 一覧へ → OFF で通常のセーブは同じ
//  JB-2（375×667・430×932）：ジオインパクト（12コマ）を実戦で・画面の中・待機の立ち絵へ戻る
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
const SHOT = path.join(os.tmpdir(), 'mm-jiol-moves-1015'); mkdirSync(SHOT, { recursive: true });
const ranchSave = async (pg) => { await H.newGame(pg, 'テスト'); await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; S.g = 1234; save(); farm(); }); };
const qaOn = async (pg) => { await ranchSave(pg); await pg.waitForSelector('#mmqa-sw'); await pg.click('#mmqa-sw'); await pg.waitForSelector('#mmqa .qcard'); await pg.click('#mmqa .qtab[data-i="3"]'); await pg.waitForSelector('#mmqa .qcard[data-status="battle"]'); };
/** カードから QA 試合を始める（比較 → 対戦開始）→ 自分の番まで */
async function startMove(pg, no) {
  await pg.click(`#mmqa .qcard[data-n="${no - 1}"]`); await pg.click('#mmqa .qdet .qgo');
  await pg.waitForSelector('#cmp .c2go'); await pg.waitForTimeout(500); await pg.click('#cmp .c2go');
  await pg.waitForSelector('#bt');
}
const myTurn = (pg) => pg.waitForFunction(() => { const g = document.getElementById('go'); return g && !g.disabled && !g.classList.contains('bk'); }, null, { timeout: 40000 });
/** STOP を押して、その技のコマ・効き目を見る（ルーレットの MISS・回避で外れたら次の自分の番にもう一度＝最大6回） */
async function useMove(pg, no) {
  const pre = `j${String(no).padStart(2, '0')}_`;
  let seen = new Set(), ok = false, tries = 0, last = null;
  while (!ok && tries < 6 && await pg.evaluate(() => !!document.getElementById('bt') && !document.querySelector('#bt .ban.end, #bt.mma-end'))) {
    tries++; await myTurn(pg).catch(() => {}); await pg.waitForTimeout(300);
    const before = await pg.evaluate(() => { const s = MMRULES.current(); return s ? { dmg: s.totalDamage.A || 0, buf: (s.buffs.A || []).map((b) => [b.category, b.ratio, b.remainingTurns]) } : null; });
    await pg.evaluate(() => document.getElementById('go').click());
    const t0 = Date.now();
    while (Date.now() - t0 < 4200) { (await pg.evaluate((pre) => [...document.querySelectorAll('#bt img')].map((i) => (i.getAttribute('src') || '').split('/').pop()).filter((f) => f.startsWith(pre)), pre)).forEach((f) => seen.add(f)); await pg.waitForTimeout(60); }
    last = await pg.evaluate(() => { const s = MMRULES.current(); return s ? { dmg: s.totalDamage.A || 0, life: s.currentLife.B, buf: (s.buffs.A || []).map((b) => [b.category, b.ratio, b.remainingTurns]) } : null; });
    if (no === 3) ok = !!last && last.buf.some((b) => b[0] === 'attack' && b[1] === 0.2);
    else ok = !!last && !!before && last.dmg > before.dmg;
  }
  return { ok, seen: [...seen].sort(), tries, last };
}

test('JB-1（390×844）：ジオルの10技を QA の実戦で＝その技のコマが出て本当に効く・QA 一覧へ・OFF で通常のセーブは同じ', { skip: SKIP, timeout: 900000 }, async () => {
  const p = await openPage({ query: '?mmQaTrial=1', size: H.SIZES.base }); const pg = p.page; await qaOn(pg);
  const s0 = await pg.evaluate(() => localStorage.getItem('mr4v6'));
  const cards = await pg.evaluate(() => [...document.querySelectorAll('#mmqa .qcard')].map((c) => [c.dataset.status, c.querySelector('b').textContent]));
  assert.deepEqual(cards.map((c) => c[0]), Array(10).fill('battle'), 'ジオルの10枚＝実戦可能');
  const D = await pg.evaluate(() => MMJIMV_DATA);
  for (let no = 1; no <= 10; no++) {
    await startMove(pg, no); await myTurn(pg); await pg.waitForTimeout(400);
    const b = await pg.evaluate(() => ({ sp: BPL[0].sp, eq: BPL[0].eq.slice(0, 6), names: [...document.querySelectorAll('#bt .mmr .pl .nm')].map((e) => e.textContent) }));
    const want = await pg.evaluate((no) => MMQA.catalog()[3].moves[no - 1], no);
    assert.equal(b.sp, 3); assert.deepEqual(b.eq, Array(6).fill(39 + no), `${no}：6枠すべて SK ${39 + no}`); assert.equal(want.slot, 39 + no);
    assert.ok(b.names.length >= 4 && b.names.every((x) => x === want.name), `${no}：ルーレット＝${want.name}`);
    const r = await useMove(pg, no);
    const body = D[no].cuts.map((c) => c.f);
    assert.ok(r.ok, `${no}：本当に効いた（${JSON.stringify(r.last)}・${r.tries}回）`);
    for (const f of body) assert.ok(r.seen.includes(f), `${no}：本体 ${f}`);
    assert.ok(r.seen.filter((f) => /_fx/.test(f)).length >= 1, `${no}：効果の層も出る`);
    if (no === 9) await pg.screenshot({ path: path.join(SHOT, 'jb1_after9.png') });
    await pg.evaluate(() => MMQA.endBattle()); await pg.waitForSelector('#mmqa .qcard', { state: 'visible', timeout: 60000 });
    assert.equal(await pg.evaluate(() => !!document.getElementById('bt')), false);
  }
  await pg.click('#mmqa .qoff'); await pg.waitForSelector('#app>.rn');
  assert.equal(await pg.evaluate(() => localStorage.getItem('mr4v6')), s0, '通常のセーブは同じ');
  assert.deepEqual(await pg.evaluate(() => [S.m.sp, S.g, MMQA.isOn()]), [0, 1234, false]);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

for (const size of [H.SIZES.se, H.SIZES.max]) {
  test(`JB-2（${size.join('×')}）：ジオインパクト（12コマ）を実戦で・コマが画面の中・待機の立ち絵へ戻る`, { skip: SKIP, timeout: 300000 }, async () => {
    const p = await openPage({ query: '?mmQaTrial=1', size }); const pg = p.page; await qaOn(pg);
    await startMove(pg, 9); await myTurn(pg); await pg.waitForTimeout(400);
    // コマの位置を見張る（画面の外へ出ない＝左右）
    // 本体（絵の中の体の範囲 b＝データ。透明な余白は数えない）が画面の左右から 6% 以上はみ出さないか（自分側＝反転なし）。
    //  相手の固有スキルの演出（逆境のひと踏ん張りなど＝戦場を相手へ寄せるカメラ）が重なっている間は数えない（全種族共通の既存の動き）
    await pg.evaluate(() => { const B = {}; Object.values(MMJIMV_DATA).forEach((d) => d.cuts.forEach((c) => { B[c.f] = c; })); window.__jOut = []; window.__jCut = 0; window.__jT = setInterval(() => { if (MMRULES.cutActive()) { window.__jCut++; return; } document.querySelectorAll('#bt img.p25f').forEach((i) => { const f = (i.getAttribute('src') || '').split('/').pop(), c = B[f]; if (!c || +getComputedStyle(i).opacity < 0.5) return; const r = i.getBoundingClientRect(); if (!r.width) return; const k = r.width / c.pw, l = r.left + c.b[0] * k, rr = r.left + c.b[2] * k, m = (rr - l) * 0.06; if (l < -m || rr > innerWidth + m) window.__jOut.push(`${f} ${Math.round(l)}〜${Math.round(rr)}`); }); }, 30); });
    const r = await useMove(pg, 9);
    assert.ok(r.ok, JSON.stringify(r.last));
    assert.equal(r.seen.filter((f) => /^j09_\d\d\.webp$/.test(f)).length, 12, '本体12コマ');
    await pg.waitForFunction(() => !document.querySelector('#bt img.p25f'), null, { timeout: 8000 });
    const end = await pg.evaluate(() => { clearInterval(window.__jT); return { out: [...new Set(window.__jOut)], me: +getComputedStyle(document.getElementById('m0')).opacity, idle: /idle_jiol/.test((document.querySelector('#m0 .mma-idle') || {}).src || '') }; });
    assert.deepEqual(end.out, [], '本体のコマが画面の外へ大きく出ない'); assert.ok(end.me > 0.95 && end.idle, '待機の立ち絵へ戻る');
    await pg.screenshot({ path: path.join(SHOT, `jb2_${size.join('x')}.png`) });
    await pg.evaluate(() => MMQA.endBattle()); await pg.waitForSelector('#mmqa .qcard', { state: 'visible', timeout: 60000 });
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}
