// =========================================================
// 2026-10-15 夜（PHASE B）：技アニメの試遊修正・体格サイズの比較プレビュー（実ブラウザ・390×844）
//  BTB-1：ソラモビーム＝その場で撃つ（体の前の端が待機立ち絵の前の端を大きく越えない）・光線が相手まで届く
//  BTB-2：ファイアボール＝火球（切り出した効果）が口元から相手へ動く
//  BTB-3：体格サイズ＝通常は今までの倍率（SCALE）・?mmSize=1 のときだけ ジオル 100%／ソラモ 80%（足もとは床のまま）
//  BTB-4：はなビンタの絵文字は鼻でない・フルーネ技10 は相手の位置に着弾の絵（共通演出）
//  2026-10-16 iPhone 8本の修正：
//  BTB-5：ソラモビーム・スターダストレイ・ファイアボール・フレアレイ＝光線の根元／火球の生まれる所＝同じ区切りの体のコマの口先（MMTUNE.MOUTH）。
//         左右（自分側・相手側）・体格プレビュー（?mmSize=1）でも 2px 以内。光線は区切りごとに出し直す（スターダストレイ・フレアレイは2本）
//  BTB-6：スターフォールの当たりの絵文字 🌠（iPhone で四角い額の絵）を技のコマの間だけ出さない（ほかの技の絵文字は出る）
//  BTB-7：聖なる炎（前回の演出＝?sk19=v1）＝三色の炎の輪は自分の体の中心から広がるだけ（相手へ飛ばない）・相手の当たりは別の表現（bc06）
//  BTB-8（2026-10-16 SK19 承認演出 V2）：自分側・相手側＝1時点で1枚の飛行ポーズ・胸の中心は動かない・炎の外縁が相手の中心に届く時刻＝当たり（1回）・終わったら残らない
//  BTB-9（SK19 V2）：実戦（STOP）で SK19 が出た番に相手が倒れる＝決着のあとも炎・ポーズ・タイマーが残らない
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

/** anim(k,s) を呼び、口先つきの効果（data-mf）の「見え始めの姿」を、同じ区切りの体のコマの見え始めの姿と比べる（キーフレームから計算） */
const MOUTHCHK = ({ k, s }) => new Promise((res) => {
  const vs = document.querySelector('#bt .vs'), old = new Set(vs.querySelectorAll('.p25f'));
  anim(k, s);
  const t0 = performance.now();
  const wait = () => { if (![...vs.querySelectorAll('.p25f[data-mf]')].some((e) => !old.has(e)) && performance.now() - t0 < 4000) return setTimeout(wait, 30); setTimeout(go, 60); };
  setTimeout(wait, 30);
  const go = () => {
    const D = [window.MMSOMV_DATA, window.MMGAMV_DATA].flatMap((x) => Object.values(x || {})).flatMap((d) => d.cuts);
    const els = [...vs.querySelectorAll('.p25f')].filter((e) => !old.has(e));
    const first = (e) => { const a = e.getAnimations()[0]; const kf = a.effect.getKeyframes(); const x = kf.find((q) => +q.opacity === 1) || kf[0]; const m = /translate\(([-\d.e]+)px,\s*([-\d.e]+)px\)/.exec(x.transform); return { x: +m[1], y: +m[2], tr: x.transform, off: x.computedOffset }; };
    const f = s ? -1 : 1, out = [];
    els.filter((e) => e.dataset.mf).forEach((e) => {
      const p = first(e), w = parseFloat(e.style.width), h = parseFloat(e.style.height), o = e.style.transformOrigin;
      const root = o.startsWith('4%') ? { x: p.x + w * 0.04, y: p.y + h / 2, kind: 'beam' } : o.startsWith('0') ? { x: p.x, y: p.y + h / 2, kind: 'stretch' } : { x: p.x + w / 2, y: p.y + h / 2, kind: 'launch' };
      const c = D.find((q) => q.f === e.dataset.mf), M = MMTUNE.MOUTH[Object.keys(MMTUNE.MOUTH).find((key) => key.endsWith('/' + e.dataset.mf))];
      const body = els.find((b) => b.tagName === 'IMG' && (b.getAttribute('src') || '').endsWith('/' + e.dataset.mf));
      const bp = first(body), S = parseFloat(body.style.width) / c.w, mx = f > 0 ? M[0] : c.w - M[0];
      out.push({ cut: e.dataset.cut, mf: e.dataset.mf, kind: root.kind, root: [root.x, root.y], mouth: [bp.x + mx * S, bp.y + M[1] * S], off: p.off, flip: /scaleX\(-1\)/.test(bp.tr) });
    });
    res(out);
  };
});

test('BTB-5：光線の根元・火球の生まれる所＝そのコマの口先（左右・体格プレビュー）', { skip: SKIP, timeout: 600000 }, async () => {
  const cases = [['', 0, 0, 0, 5, 1], ['', 0, 0, 1, 5, 1], ['', 0, 0, 0, 8, 2], ['', 0, 0, 1, 8, 2], ['', 1, 0, 0, 15, 1], ['', 1, 1, 1, 15, 1], ['', 1, 0, 0, 16, 3], ['', 1, 1, 1, 16, 3], ['&mmSize=1', 0, 0, 0, 8, 2], ['&mmSize=1', 1, 0, 0, 16, 3]];   // 2026-10-16（iPhone 6件 A4）：フレアレイは溜めの光（16_01 の口先）＋光線2本
  for (const [q, me, foe, s, k, n] of cases) {
    const p = await battle(q, me, foe);
    const r = await p.page.evaluate(MOUTHCHK, { k, s });
    const tag = `k${k} 側${s}${q}`;
    assert.equal(r.length, n, `${tag}：口先つきの効果 ${n} 本（${JSON.stringify(r.map((x) => x.mf))}）`);
    for (const x of r) {
      const d = Math.hypot(x.root[0] - x.mouth[0], x.root[1] - x.mouth[1]);
      assert.ok(d < 2, `${tag} ${x.kind} ${x.mf}：根元 ${x.root.map((v) => v.toFixed(1))} と口先 ${x.mouth.map((v) => v.toFixed(1))} の差 ${d.toFixed(2)}px`);
      assert.equal(x.flip, s === 1, `${tag}：体の向き`);
    }
    if (n >= 2) assert.ok(new Set(r.map((x) => x.mf)).size >= 2, `${tag}：区切りごとに別のコマの口先`);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
    await p.ctx.close(); OPEN.splice(OPEN.indexOf(p), 1);
  }
});

test('BTB-6：スターフォールの 🌠 を当たりに出さない（ほかの技は出る）', { skip: SKIP, timeout: 240000 }, async () => {
  const p = await battle('', 0, 1), pg = p.page;
  const r = await pg.evaluate(() => new Promise((ok) => {
    anim(9, 0); pop(1, SK[9][4], 'sk');
    setTimeout(() => {
      const star = [...document.querySelectorAll('#f1 span.sk')].map((e) => e.textContent);
      anim(5, 0); pop(1, SK[5][4], 'sk');
      setTimeout(() => ok({ star, other: [...document.querySelectorAll('#f1 span.sk')].map((e) => e.textContent), log: MMTUNE.emojiLog(), e9: SK[9][4], e5: SK[5][4] }), 50);
    }, 50);
  }));
  assert.equal(r.e9, '🌠', '技のデータの絵文字は変えない');
  assert.deepEqual(r.star, [], `スターフォールの絵文字の札は出ない（${r.star}）`);
  assert.ok(r.other.includes(r.e5), `ソラモビームの絵文字は出る（${r.other}）`);
  assert.ok(r.log.some((x) => x.k === 9), '消した記録');
  assert.deepEqual(p.errors, []);
});

test('BTB-7：聖なる炎（前回の演出＝?sk19=v1）＝炎の輪は自分の体から広がるだけ・相手の当たりは別の表現', { skip: SKIP, timeout: 240000 }, async () => {
  const p = await battle('&sk19=v1', 1, 0), pg = p.page;
  const r = await pg.evaluate(TRACE, 19);
  const ring = r.out.flatMap((f) => f.els.filter((e) => /^G19_aura/.test(e.cut)));
  assert.ok(ring.length >= 4, `炎の輪が見える（${ring.length}）`);
  const mid = (r.idle.r + r.tgt.l) / 2;
  assert.ok(ring.every((e) => e.cx < mid), `炎の輪の中心は自分側（最大 ${Math.max(...ring.map((e) => e.cx)).toFixed(0)} < ${mid.toFixed(0)}）`);
  assert.ok(Math.max(...ring.map((e) => e.cx)) - Math.min(...ring.map((e) => e.cx)) < 30, '炎の輪は相手へ動かない');
  assert.ok(!r.out.some((f) => f.els.some((e) => e.crop && /^G19/.test(e.cut))), '切り出して飛ばす効果は無い');
  const hit = r.out.flatMap((f) => f.els.filter((e) => /bc06_hit/.test(e.src)));
  assert.ok(hit.length >= 2 && hit.every((e) => Math.abs(e.cx - r.tgt.cx) < 40), `相手の当たりは相手の位置（${hit.length}）`);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

/** SK19 V2 を side の側で再生し、0.04秒ごとに飛行ポーズ・炎・相手の位置を記録する（knock の回数も数える） */
const TRACE19 = (side) => new Promise((res) => {
  const out = [], t0 = performance.now(), vs = document.querySelector('#bt .vs').getBoundingClientRect();
  const tgt = document.querySelector(`#bt #m${1 - side} .mma-idle`).getBoundingClientRect(), me = document.getElementById('m' + side);
  anim(19, side);
  const iv = setInterval(() => {
    const v = document.querySelector('#bt .vs').getBoundingClientRect();   // 揺れ（shake）で .vs ごと動く＝.vs に対する位置で比べる
    const els = [...document.querySelectorAll('#bt .sk19v2')].map((e) => { const r = e.getBoundingClientRect(), o = +getComputedStyle(e).opacity; return { cut: e.dataset.cut, o, w: r.width, cx: r.left + r.width / 2 - v.left + vs.left, cy: r.top + r.height / 2 - v.top + vs.top, dcx: e.dataset.cx != null ? +e.dataset.cx + vs.left : null, dcy: e.dataset.cy != null ? +e.dataset.cy + vs.top : null, E: +e.dataset.e || null }; });
    const m = /matrix\(([^,]+),/.exec(getComputedStyle(document.querySelector('#bt .vs')).transform);
    out.push({ t: Math.round(performance.now() - t0), els, meO: +getComputedStyle(me).opacity, zoom: m ? +m[1] : 1 });
    if (performance.now() - t0 > 4200) {
      clearInterval(iv);
      const lg = MMSK19V2.log().slice(-1)[0];
      res({ out, log: lg, tgt: { cx: tgt.left + tgt.width / 2, cy: tgt.top + tgt.height * 0.55 }, left: [...document.querySelectorAll('#bt .sk19v2')].length, meAnims: me.getAnimations().length, meO: +getComputedStyle(me).opacity, meT: getComputedStyle(me).transform });
    }
  }, 40);
});
for (const [name, me, foe, side] of [['自分側', 1, 0, 0], ['相手側', 0, 1, 1]]) {
  test(`BTB-8：SK19 V2（${name}）＝飛行ポーズは1枚ずつ・胸の中心は動かない・炎が相手の中心に届く時刻に当たり1回・残らない`, { skip: SKIP, timeout: 240000 }, async () => {
    const p = await battle('', me, foe), pg = p.page;
    const r = await pg.evaluate(TRACE19, side);
    // 飛行ポーズ：見える時間がある・1時点で1枚だけ（入れ替えの途中も合計の不透明度は 1 を超えない）
    const poses = r.out.map((f) => f.els.filter((e) => /^SK19V2_(up|down)$/.test(e.cut)));
    assert.ok(poses.filter((ps) => ps.some((e) => e.o > 0.9)).length > 10, '飛行ポーズが見える');
    assert.ok(poses.every((ps) => ps.reduce((a, e) => a + e.o, 0) <= 1.05), '1時点で1枚（翼・脚が重ならない）');
    assert.ok(new Set(poses.flatMap((ps) => ps.filter((e) => e.o > 0.9).map((e) => e.cut))).size === 2, '翼上げ・翼を横の2枚を切り替える');
    // 炎の中心＝胸＝動かない・自分側
    // 当たりの寄り（既存の被弾の演出が戦場 .vs を少し拡大する）の間は除いて比べる
    const fl = r.out.filter((f) => Math.abs(f.zoom - 1) < 0.001).flatMap((f) => f.els.filter((e) => /^SK19V2_f\d[bf]$/.test(e.cut) && e.o > 0.02));
    assert.ok(fl.length > 20, '炎が見える');
    const cxs = fl.map((e) => e.cx), cys = fl.map((e) => e.cy);
    assert.ok(Math.max(...cxs) - Math.min(...cxs) < 2 && Math.max(...cys) - Math.min(...cys) < 2, `炎の中心は動かない（x ${Math.min(...cxs).toFixed(1)}〜${Math.max(...cxs).toFixed(1)}）`);
    const cx = cxs[0], cy = cys[0], D = Math.hypot(r.tgt.cx - cx, r.tgt.cy - cy);
    assert.ok(side === 0 ? cx < r.tgt.cx - 60 : cx > r.tgt.cx + 60, '炎の中心は自分の胸（相手の側ではない）');
    // 外縁が相手の中心に届く最初の時刻 ≒ 当たり（共通演出の構え 0.42秒＋当たり ÷ 1.18）
    const edge = (f) => Math.max(0, ...f.els.filter((e) => /^SK19V2_f\d[bf]$/.test(e.cut) && e.o > 0.02).map((e) => e.w * e.E));
    const reach = r.out.find((f) => edge(f) >= D * 0.97);
    assert.ok(reach, `炎が相手の中心に届く（最大 ${Math.max(...r.out.map(edge)).toFixed(0)} ／ 距離 ${D.toFixed(0)}）`);
    const hitAt = 420 + r.log.hit / 1.18;
    assert.ok(Math.abs(reach.t - hitAt) < 160, `届く時刻 ${reach.t}ms ≒ 当たり ${hitAt.toFixed(0)}ms（${JSON.stringify(r.log)} 距離 ${D.toFixed(0)} 中心 ${cx.toFixed(0)},${cy.toFixed(0)} 相手 ${r.tgt.cx.toFixed(0)},${r.tgt.cy.toFixed(0)} 外縁 ${r.out.map((f) => f.t + ':' + edge(f).toFixed(0)).join(' ')}）`);
    assert.equal(r.log.fired, 1, '当たりの演出は1回');
    // 終わり：炎・ポーズ・胸の光・加護が残らない・待機絵が元へ
    assert.equal(r.left, 0, '残らない'); assert.equal(r.meO, 1); assert.equal(r.meAnims, 0); assert.ok(r.meT === 'none' || /matrix\(1, 0, 0, 1, 0, 0\)/.test(r.meT), `待機絵の位置が戻る（${r.meT}）`);
    assert.ok(r.out.some((f) => f.els.some((e) => e.cut === 'SK19V2_buff' && e.o > 0.9)), '金色の自己強化へつながる');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('BTB-9：SK19 V2 の実戦（STOP）で相手が倒れる＝決着のあとも残らない', { skip: SKIP, timeout: 300000 }, async () => {
  const p = await battle('', 1, 0), pg = p.page;
  await pg.evaluate(() => { const pl = BPL; pl[0].eq = pl[0].eq.map(() => 19); });
  let used = false;
  for (let i = 0; i < 6 && !used; i++) {
    const n0 = await pg.evaluate(() => MMSK19V2.log().length);
    await pg.evaluate(() => { BPL[1].h = 1; document.getElementById('go').click(); });
    await pg.waitForTimeout(400);
    await pg.evaluate(() => { const g = document.getElementById('go'); if (g && !g.disabled) g.click(); });
    await pg.waitForTimeout(6000);
    used = (await pg.evaluate(() => MMSK19V2.log().length)) > n0;
  }
  assert.ok(used, 'SK19 が出た');
  await pg.waitForTimeout(2500);
  const r = await pg.evaluate(() => ({ left: document.querySelectorAll('.sk19v2').length, ban: (document.getElementById('ban') || {}).textContent || '', me: +getComputedStyle(document.getElementById('m0')).opacity }));
  assert.equal(r.left, 0, '炎・ポーズが残らない');
  assert.equal(r.me, 1, '自分の待機絵が見える');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('BTB-10：SK19 V2 の実戦＝聖なる炎のあとの能力アップの印（青い球＋▲）を出さない・能力アップの処理と状態の札は従来どおり', { skip: SKIP, timeout: 300000 }, async () => {
  const p = await battle('', 1, 0), pg = p.page;
  await pg.evaluate(() => {
    BPL[0].eq = BPL[0].eq.map(() => 19); BPL[1].h = Math.max(BPL[1].h, 500);
    window.__efb = []; new MutationObserver((l) => l.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1 && n.classList.contains('efb')) window.__efb.push({ t: performance.now(), p: n.parentNode && n.parentNode.id }); }))).observe(document.getElementById('bt'), { childList: true, subtree: true });
  });
  let used = false;
  for (let i = 0; i < 8 && !used; i++) {
    await pg.evaluate(() => { const g = document.getElementById('go'); if (g) g.click(); });
    await pg.waitForTimeout(400);
    await pg.evaluate(() => { const g = document.getElementById('go'); if (g && !g.disabled) g.click(); });
    for (let w = 0; w < 30; w++) { await pg.waitForTimeout(500); if (await pg.evaluate(() => { const g = document.getElementById('go'); return g && !g.disabled && !g.classList.contains('bk'); })) break; }
    used = (await pg.evaluate(() => MMSK19V2.effLog().length)) > 0;   // SK19 が当たって能力アップの処理（efBurst）が呼ばれた
  }
  assert.ok(used, 'SK19 が当たって能力アップの処理が呼ばれた');
  // 聖なる炎の時間枠（＋1.5秒）の中で、ガウルの側（#f0）に出た印を数える（相手の番の技の印は数えない）
  const r = await pg.evaluate(() => { const L = MMSK19V2.log().filter((x) => x.s === 0); return { efb: window.__efb.filter((e) => e.p === 'f0' && L.some((x) => e.t >= x.t0 && e.t <= x.t0 + x.D + 1500)).length, all: window.__efb.length, eff: MMSK19V2.effLog().length }; });
  assert.equal(r.efb, 0, `聖なる炎の能力アップの印（.efb）は出ない（全体 ${r.all}）`);
  assert.ok(r.eff >= 1, `能力アップの処理は行われた（印だけ消した：${r.eff}）`);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

// 2026-10-16（iPhone 6件 A2・A4）
test('BTB-11：フレアレイの溜めの光は嘴の先（16_01 の口先）・スターダストレイの青い光線の試作（?sk08=blue）は口先から相手へ', { skip: SKIP, timeout: 300000 }, async () => {
  let p = await battle('', 1, 0), pg = p.page;
  const a = await pg.evaluate(() => new Promise((ok) => { anim(16, 0); const seen = []; const iv = setInterval(() => { document.querySelectorAll('#bt .p25c[data-mf="16_01.webp"]').forEach((e) => { if (+getComputedStyle(e).opacity > 0.3) seen.push({ mx: +e.dataset.mx, my: +e.dataset.my, cut: e.dataset.cut }); }); }, 40); setTimeout(() => { clearInterval(iv); ok(seen); }, 2600); }));
  assert.ok(a.length >= 2, `溜めの光が嘴の先に出る（${a.length}）`);
  assert.ok(a.every((e) => e.cut === 'G16_1_fx'), '溜めの光＝素材の 16_01_fx を切り出したもの');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  await p.ctx.close(); OPEN.length = 0;
  p = await battle('&sk08=blue', 0, 1); pg = p.page;
  const b = await pg.evaluate(() => new Promise((ok) => { anim(8, 0); const seen = {}; const iv = setInterval(() => { document.querySelectorAll('#bt .sk08b').forEach((e) => { if (+getComputedStyle(e).opacity > 0.3) { const k = e.dataset.cut || e.className; (seen[k] = seen[k] || []).push({ mx: e.dataset.mx != null ? +e.dataset.mx : null, mf: e.dataset.mf || null }); } }); }, 40); setTimeout(() => { clearInterval(iv); ok({ seen, old: !!document.querySelector('#bt img[src*="05_03"]') }); }, 3200); }));
  assert.ok(b.seen.SDR_BLUE_charge && b.seen.SDR_BLUE_charge.length, '口先の溜め');
  assert.ok(b.seen.SDR_BLUE_beam && b.seen.SDR_BLUE_beam.length >= 3, '青い光線');
  assert.ok(new Set(b.seen.SDR_BLUE_beam.map((e) => e.mf)).size >= 2, '光線は区切りごとのコマ（08_04・08_05）の口先から');
  assert.ok(b.seen.SDR_BLUE_after, '余韻（光線が細くなって消える）');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
