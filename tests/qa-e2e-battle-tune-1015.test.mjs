// =========================================================
// 2026-10-15 夜（PHASE B）：技アニメの試遊修正・体格サイズの比較プレビュー（実ブラウザ・390×844）
//  BTB-1：ソラモビーム＝その場で撃つ（体の前の端が待機立ち絵の前の端を大きく越えない）・光線が相手まで届く
//  BTB-2：ファイアボール＝火球（切り出した効果）が口元から相手へ動く
//  BTB-3：体格サイズ＝通常は今までの倍率（SCALE）・?mmSize=1 のときだけ ジオル 100%／ソラモ 80%（足もとは床のまま）
//  BTB-4：はなビンタの絵文字は鼻でない・フルーネ技10 は相手の位置に着弾の絵（共通演出）
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
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close().catch(() => {}); });

/** QA の個体（me）と練習試合の相手（foe＝0 ソラモ／1 ガウル）でバトルを開き、自分の番を待つ */
async function battle(query, me, foe) {
  const p = await L.open({ size: H.SIZES.base, stage: true, query: '?mmQaTrial=1' + (query || '') }); OPEN.push(p); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(({ me, foe }) => {
    const m = MMQA.makeMon(me);
    if (me === 5) { const inf = MMQA.catalog().find((x) => x.sp === 5); IMG[5] = inf.img; MMARENA.IDLE[5] = 'idle_flurene'; }
    m.sk = [0]; m.eq = [0, 0, 0, 0, 0, 0]; m.speed = 10;
    m.raise = { battle: { kind: 'practice', rank: 0, done: false, qa: true, snap: { g: S.g, wins: S.wins, br: S.br, rk: m.rk, fa: m.fa, st: m.st } } }; S.m = m;
    battleDress({ rank: 0, label: 'QA', name: '相手' }); battleFoeOnce(foe); TB_SKIP_INTRO = true; fight(0); battleDressDom();
  }, { me, foe });
  await pg.waitForSelector('#bt #m0 .mon .mma-idle');
  await pg.waitForFunction(() => { const g = document.getElementById('go'); return g && !g.disabled && !g.classList.contains('bk'); }, null, { timeout: 30000 });
  // 固有スキルの寄り（ガウルの紅翼の猛攻＝ゴングの直後）が終わって戦場が等倍に戻るまで待つ
  await pg.waitForFunction(() => { const t = getComputedStyle(document.querySelector('#bt .vs')).transform; const m = /matrix\(([^,]+),/.exec(t); return t === 'none' || (m && Math.abs(+m[1] - 1) < 0.001); }, null, { timeout: 30000 });
  await pg.waitForTimeout(300);
  return p;
}
/** anim(k,0) を呼び、0.05秒ごとに p25f（技のコマ・効果）の矩形を記録する */
const TRACE = (k) => new Promise((res) => {
  const out = [], t0 = performance.now(), vs = document.querySelector('#bt .vs').getBoundingClientRect();
  const idle = document.querySelector('#bt #m0 .mma-idle').getBoundingClientRect(), tgt = document.querySelector('#bt #m1 .mma-idle').getBoundingClientRect();
  if (k < 0) MM25D.preview('flurene', -k, 0); else anim(k, 0);
  const iv = setInterval(() => {
    const els = [...document.querySelectorAll('#bt .p25f')].map((e) => { const r = e.getBoundingClientRect(), o = +getComputedStyle(e).opacity; return { cut: e.dataset.cut || '', l: r.left, r: r.right, t: r.top, b: r.bottom, cx: r.left + r.width / 2, o, crop: e.classList.contains('p25c'), src: (e.getAttribute('src') || '') }; }).filter((e) => e.o > 0.5);
    const tr = document.querySelector('#bt #m1 .mma-idle').getBoundingClientRect();
    out.push({ t: Math.round(performance.now() - t0), els, tcx: tr.left + tr.width / 2 });
    if (performance.now() - t0 > 3200) { clearInterval(iv); res({ out, idle: { l: idle.left, r: idle.right, w: idle.width, b: idle.bottom }, tgt: { l: tgt.left, r: tgt.right, cx: tgt.left + tgt.width / 2 }, vs: { l: vs.left } }); }
  }, 50);
});

test('BTB-1：ソラモビーム＝その場で撃つ・光線が相手まで', { skip: SKIP, timeout: 240000 }, async () => {
  const p = await battle('', 0, 1), pg = p.page;
  const r = await pg.evaluate(TRACE, 5);
  const body = r.out.flatMap((f) => f.els.filter((e) => /^SORAMO_BEAM_[124]$/.test(e.cut)));
  assert.ok(body.length > 5, `体のコマが見える（${body.length}）`);
  // 体の見えている前の端（コマの枠ではなく、枠の中の体の範囲）は推定できないので、枠の中心が待機立ち絵の中心から待機の幅の 0.35 以内
  const idleC = (r.idle.l + r.idle.r) / 2, far = Math.max(...body.map((e) => e.cx - idleC));
  assert.ok(far < r.idle.w * 0.35, `体が前へ出ない（中心のずれ ${far.toFixed(0)}px・待機の幅 ${r.idle.w.toFixed(0)}px）`);
  const beam = r.out.flatMap((f) => f.els.filter((e) => e.cut === 'SORAMO_BEAM_3'));
  assert.ok(beam.length >= 4, `光線が見える時間（${beam.length} 回）`);
  assert.ok(Math.max(...beam.map((e) => e.r)) >= r.tgt.cx - 4, `光線が相手の中心まで届く（${Math.max(...beam.map((e) => e.r)).toFixed(0)} ≥ ${r.tgt.cx.toFixed(0)}）`);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('BTB-2：ファイアボール＝火球が口元から相手へ動く', { skip: SKIP, timeout: 240000 }, async () => {
  const p = await battle('', 1, 0), pg = p.page;
  const r = await pg.evaluate(TRACE, 15);
  const fr = r.out.filter((f) => f.els.some((e) => e.crop && e.cut === 'G15_2_fx')), ball = fr.map((f) => f.els.find((e) => e.crop && e.cut === 'G15_2_fx').cx), tc = fr.length ? fr[fr.length - 1].tcx : 0;
  assert.ok(ball.length >= 3, `火球が見える（${ball.length}）`);
  assert.ok(ball[ball.length - 1] - ball[0] > 40, `相手のほうへ動く（${ball[0].toFixed(0)} → ${ball[ball.length - 1].toFixed(0)}）`);
  assert.ok(Math.abs(ball[ball.length - 1] - tc) < 60, `最後は相手の近く（${ball.map((x) => x.toFixed(0)).join(',')} / 相手 ${tc.toFixed(0)}）`);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('BTB-3：体格サイズ＝通常は今まで・?mmSize=1 のときだけ ジオル 100%／ソラモ 80%（足もとは床）', { skip: SKIP, timeout: 300000 }, async () => {
  const k = async (q) => { const p = await battle(q, 3, 0); const v = await p.page.evaluate(() => ['#m0', '#m1'].map((s) => { const mon = document.querySelector(`#bt ${s} .mon`), im = mon.querySelector('.mma-idle').getBoundingClientRect(), mr = mon.getBoundingClientRect(); return { k: +mon.style.getPropertyValue('--mma-k'), h: im.height, foot: Math.round(im.bottom - mr.bottom) }; })); assert.deepEqual(p.errors, []); return v; };
  const a = await k(''), b = await k('&mmSize=1');
  assert.ok(Math.abs(a[0].k - 0.91) < 1e-6 && Math.abs(a[1].k - 0.91) < 1e-6, `通常は今までの倍率（${a[0].k}・${a[1].k}）`);
  assert.ok(Math.abs(b[0].k - 0.91) < 1e-6, `ジオル（サイズ4）＝100%（${b[0].k}）`);
  assert.ok(Math.abs(b[1].k - 0.91 * 0.8) < 1e-6, `ソラモ（サイズ2）＝80%（${b[1].k}）`);
  assert.ok(Math.abs(b[1].h / a[1].h - 0.8) < 0.02, `ソラモの立ち絵の高さ 80%（${(b[1].h / a[1].h).toFixed(3)}）`);
  for (const x of [...a, ...b]) assert.equal(x.foot, 0, '足もと（立ち絵の下端）は床＝箱の下端のまま');
});

test('BTB-4：はなビンタの絵文字・フルーネ技10 の着弾', { skip: SKIP, timeout: 240000 }, async () => {
  const p = await battle('', 5, 1), pg = p.page;
  assert.notEqual(await pg.evaluate(() => SK[30][4]), '👃', 'はなビンタの絵文字は鼻でない');
  const r = await pg.evaluate(TRACE, -10);
  const hit = r.out.flatMap((f) => f.els.filter((e) => /bc0[67]_/.test(e.src)));
  assert.ok(hit.length >= 3, `共通演出の着弾が見える（${hit.length}）`);
  assert.ok(hit.every((e) => Math.abs(e.cx - r.tgt.cx) < 40), '着弾は相手の位置');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
