// =========================================================
// ソラモ・ガウルの 2.5D バトル素材の比較試遊（2026-10-08・正式採用ではない）`MM25D`
//
//  URL に ?battleArt=2p5d を付けたときだけ、バトル画面のソラモ・ガウルの「待機の立ち絵」と「技の演出（コマ）」を新しい 2.5D 素材にする。
//  通常の URL（?battleArt なし）では何もしない＝今までの絵・演出のまま（旧素材は消していない・上書きしていない）。
//  ?battleArt=old（または 2p5d）のときは、バトル画面の左上に小さな切り替えの札（2.5D ⇄ 旧）を出す＝同じバトルの中で見比べられる。
//
//  変えないもの：fight()・battle-bridge・adapter・Battle Engine・技ルーレット・.bt 系 CSS（Phase 6）・技の性能・当たり判定・ダメージ・
//    ノビトン／ジオル／レグナス・バトル以外の画面・セーブ。演出の時間は js/battle/stage.js の「今までの技の絵」の枠（rawTiming）に入るだけ。
//  差し込み口：index.html の animRaw の先頭（MM25D.anim）・js/battle/arena.js の待機立ち絵（MM25D.idleSrc）・stage.js の rawTiming／補助技の分岐（MM25D.handles／timing）。
//  素材：assets/battle/2p5d/（README.md）。コマの並び・使わなかったコマと理由は js/battle/art25d-data.js（MM25D_DATA）。
//  技の番号（SK の 0〜19）：ソラモ 0〜9・ガウル 10〜19（js/battle/official-moves.js）。持ち主と攻撃側の種族が同じときだけ新しいコマ（合体の子が別の種族の技を使うときは今まで）。
// =========================================================
(function (root) {
  'use strict';
  const A = './assets/battle/2p5d/';
  const G = (name) => { try { return (0, eval)(name); } catch (e) { return undefined; } };
  const $ = (s, el) => (el || document).querySelector(s);
  const reduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  const param = (() => { try { return new URLSearchParams(root.location ? root.location.search : '').get('battleArt'); } catch (e) { return null; } })();
  const offered = param === '2p5d' || param === 'old';   // 比較の札を出すのは URL で比較を選んだときだけ
  let on = param === '2p5d';
  const SPK = { 0: 'soramo', 1: 'gauru' };
  /** 待機の立ち絵（新）と、今の立ち絵に対する高さの倍率（足元の位置はそのまま） */
  const IDLE = { 0: { src: A + 'soramo/idle.webp', h: 0.84 }, 1: { src: A + 'gauru/idle.webp', h: 0.9 } };
  const owner = (k) => (k >= 0 && k <= 9 ? 0 : k >= 10 && k <= 19 ? 1 : -1);
  const DATA = () => root.MM25D_DATA || {};

  function spOf(s) { const pl = G('BPL'); return pl && pl[s] ? pl[s].sp : null; }
  /** この技をこの側が使うとき新しいコマで見せるか */
  function handles(k, s) {
    if (!on) return false;
    const d = DATA()[k];
    return !!(d && d.cuts && d.cuts.some((c) => c.f) && owner(k) === spOf(s));
  }
  /** 待機の立ち絵の絵（新しい素材がある種族だけ。無ければ null＝今まで） */
  function idleSrc(sp) { return on && IDLE[sp] ? IDLE[sp].src : null; }
  function idleScale(sp) { return on && IDLE[sp] ? IDLE[sp].h : 1; }

  // ---- 時間（ms・速さ 1.0）----
  // 2026-10-09 完全版：シートの全コマを順に見せる。コマ数に合わせて長さを決める（4コマ 約1.6秒・6コマ 約2.2秒・8コマ 約2.7秒）。
  // stage.js（共通演出）を通らないとき（視差を減らす設定・自動テストの既定）は fight() の次のターン（1.5秒）に収める
  function plan(k, viaStage) {
    const d = DATA()[k], n = d.cuts.length;
    let dur = Math.max(1500, Math.min(2700, 380 + n * 300));
    if (!viaStage) dur = 1440;
    const body = dur * 0.88, step = body / n;
    const win = d.cuts.map((c, i) => [i * step, (i + 1) * step]);
    const SK = G('SK'), dmg = !!(SK && SK[k] && SK[k][1] > 0);   // 補助技（威力なし）は当たる瞬間の効果を出さない
    const hit = d.hit && dmg ? win[d.hit - 1][0] + 40 : null;
    return { dur, body, step, win, hit };
  }
  const viaStage = () => !!(root.MMSTAGE && root.MMSTAGE.busy > 0);
  function timing(k, s) { if (!handles(k, s)) return null; const p = plan(k, true); return { hit: p.hit, dur: p.dur }; }

  function style() {
    if (document.getElementById('mm25d-style')) return;
    const st = document.createElement('style'); st.id = 'mm25d-style';
    st.textContent = [
      '#bt .p25f{position:absolute;left:0;top:0;max-width:none;pointer-events:none;z-index:7;will-change:transform,opacity;-webkit-mask-image:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent),linear-gradient(transparent,#000 4%,#000 96%,transparent);-webkit-mask-composite:source-in;mask-image:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent),linear-gradient(transparent,#000 4%,#000 96%,transparent);mask-composite:intersect}',
      '#bt .mon .mma-idle.p25{height:calc(118% * var(--p25h,1))}',
      '#bt .p25sw{position:absolute;left:8px;z-index:30;pointer-events:auto;font:800 11px/1 "Noto Sans JP",sans-serif;color:#f3ecd9;background:rgba(8,14,34,.82);border:1.5px solid rgba(214,178,98,.9);border-radius:999px;padding:6px 10px;letter-spacing:.04em}',
      '#bt .p25sw b{color:#ffd76a}',
    ].join('\n');
    document.head.appendChild(st);
  }

  const med = (a) => { const b = a.slice().sort((x, y) => x - y); return b[Math.floor(b.length / 2)] || 1; };
  /**
   * 1つの技の置き方（画面の画素）。2026-10-09 完全版：
   *  ・大きさ＝技ごとに1つ（コマの間で大きさを変えない）。本体（顔・耳・尾・翼・脚）の高さ・面積の中央値が待機の立ち絵と同じくらい、
   *    かつ全部のコマの本体が画面の幅・HUD から地面までに収まる大きさ
   *  ・縦＝そのシートの地面（本体の下端の最大）を待機の足元に合わせる＝飛ぶコマはそのぶん上に
   *  ・横＝モード（self／lunge／move／contact／back）で攻撃側から相手へ。そのあと本体が画面の外・HUD に出ないように、
   *    その場のコマ（self・lunge・back）は相手の体に重ならないように、コマごとに位置だけを寄せる
   */
  function layout(k, s, L) {
    const d = DATA()[k], f = s ? -1 : 1, calm = reduced();
    const { Ag, Tg, idleW, idleH, xmin, xmax, ytop, tFront } = L;
    const bw = d.cuts.map((c) => c.b[2] - c.b[0]), bh = d.cuts.map((c) => c.b[3] - c.b[1]);
    // 本体の高さ（中央値）と面積（中央値）の2つの見積もりの平均。高さだけだと伏せた姿勢・飛ぶ姿勢で、面積だけだと横に長い姿勢で大きさがずれる
    const area = med(d.cuts.map((c, i) => bw[i] * bh[i]));
    let S = (idleH * 0.95 / med(bh) + Math.sqrt((idleW * idleH) / area)) / 2;
    d.cuts.forEach((c, i) => { S = Math.min(S, (xmax - xmin) * 0.96 / bw[i], (Ag.y + idleH * 0.06 - ytop) / bh[i]); });
    // その場・踏み込み・戻るのコマの本体が、自分側の画面の端から相手の手前までに収まる大きさ（翼を広げたガウルが相手の顔に重ならない）。
    // 縮めすぎると立ち絵との大きさの差が目立つ＝最大 22% まで（それ以上は相手の体の手前の端に少し重なってよい）
    const room = f > 0 ? tFront - xmin : xmax - tFront;
    if (room > 0) {
      let S2 = S;
      d.cuts.forEach((c, i) => { if (c.m === 'self' || c.m === 'back' || c.m === 'lunge') S2 = Math.min(S2, room / (bw[i] * 1.06)); });
      S = Math.max(S * 0.78, S2);
    }
    const ground = {}; d.cuts.forEach((c) => { const key = c.src.replace(/_\d+$/, ''); ground[key] = Math.max(ground[key] || 0, c.b[3]); });
    const reach = Math.abs(Tg.x - Ag.x);
    const fx = (c, x) => (f > 0 ? x : c.pw - x);   // 相手側は左右反転（コマの中の x）
    return d.cuts.map((c) => {
      const g = ground[c.src.replace(/_\d+$/, '')];
      const bL = Math.min(fx(c, c.b[0]), fx(c, c.b[2])), bR = Math.max(fx(c, c.b[0]), fx(c, c.b[2]));
      const bcx = (bL + bR) / 2;
      // 本体の中心の x（画面）：モードごとの始め → 終わり
      const at = (r) => Ag.x + f * reach * r;
      const R = calm ? [[0, 0]] : { self: [0, 0.02], lunge: [0.12, 0.24], move: [0.1, 0.42], contact: [0.46, 0.54], back: [0.3, 0.04] }[c.m] || [0, 0.02];
      const ends = (calm ? [0, 0] : R).map((r) => {
        let px = at(r) - bcx * S, py = Ag.y - g * S;   // コマ（元の枠）の左上
        // 本体を画面の左右・HUD の下・地面の上に収める（3% の余白）
        const m = (bR - bL) * S * 0.03;
        const l = px + bL * S - m, rr = px + bR * S + m;
        if (l < xmin) px += xmin - l; else if (rr > xmax) px -= rr - xmax;
        const top = py + c.b[1] * S - (c.b[3] - c.b[1]) * S * 0.03;
        if (top < ytop) py += ytop - top;
        // その場のコマは相手の体に重ねない（当たるコマ・移動のコマは重なってよい）
        if (c.m === 'self' || c.m === 'back' || c.m === 'lunge') {
          if (f > 0) { const over = px + bR * S - tFront; if (over > 0) px -= Math.max(0, Math.min(over, px + bL * S - m - xmin)); }
          else { const over = tFront - (px + bL * S); if (over > 0) px += Math.max(0, Math.min(over, xmax - (px + bR * S) - m)); }
        }
        return { x: px, y: py };
      });
      return { c, S, p0: ends[0], p1: ends[1] };
    });
  }

  /** 技のコマを順に見せる。引き受けたら true */
  function anim(k, s) {
    if (!handles(k, s)) return false;
    const v = $('.vs'), bt = document.getElementById('bt'), me = document.getElementById('m' + s), op = document.getElementById('m' + (1 - s));
    if (!v || !v.appendChild || !me || !op || !bt) return false;
    const mon = $('.mon', me), tmon = $('.mon', op);
    if (!mon || !tmon) return false;
    style();
    const d = DATA()[k], P = plan(k, viaStage()), f = s ? -1 : 1;
    const vr = v.getBoundingClientRect(), br = bt.getBoundingClientRect(), ar = mon.getBoundingClientRect(), tr = tmon.getBoundingClientRect();
    const sp = spOf(s), ii = mon.querySelector('.mma-idle'), ti = tmon.querySelector('.mma-idle');
    const ir = ii && ii.getBoundingClientRect().height ? ii.getBoundingClientRect() : null;
    const idleH = ir ? ir.height : ar.height * 1.18 * (IDLE[sp] ? IDLE[sp].h : 1), idleW = ir ? ir.width : idleH * 1.1;
    const trr = ti && ti.getBoundingClientRect().width ? ti.getBoundingClientRect() : tr;
    const hp = bt.querySelector('.hpr'), hb = hp ? hp.getBoundingClientRect().bottom : br.top + br.height * 0.12;
    const L = {
      Ag: { x: ar.left + ar.width / 2 - vr.left, y: ar.bottom - vr.top },
      Tg: { x: tr.left + tr.width / 2 - vr.left, y: tr.bottom - vr.top },
      idleW, idleH,
      xmin: br.left - vr.left + 10, xmax: br.right - vr.left - 10, ytop: hb - vr.top + 4,
      tFront: (f > 0 ? trr.left + trr.width * 0.18 : trr.right - trr.width * 0.18) - vr.left,
    };
    const lay = layout(k, s, L);
    const D = P.dur, X = 60;   // X＝コマの切り替えの重なり（ms）
    const imgs = [];
    lay.forEach((q, j) => {
      const c = q.c, S = q.S, im = document.createElement('img');
      im.className = 'p25f'; im.alt = ''; im.decoding = 'sync'; im.src = A + c.f; im.dataset.cut = c.src;
      const W = c.w * S, H = c.h * S, ix = (f > 0 ? c.x : c.pw - c.x - c.w) * S, iy = c.y * S;
      im.style.width = W + 'px'; im.style.height = H + 'px'; im.style.transformOrigin = '50% 50%';
      v.appendChild(im); imgs.push(im);
      const T = (p) => `translate(${p.x + ix}px,${p.y + iy}px) scaleX(${f})`;
      const [w0, w1] = P.win[j], last = j === lay.length - 1;
      const t0 = Math.max(0, w0 - (j ? X : 0)) / D, t1 = Math.min(D, w1 + (last ? 0 : X)) / D, e = 0.001;
      const kf = [{ opacity: 0, transform: T(q.p0), offset: 0 }];
      if (t0 > e) kf.push({ opacity: 0, transform: T(q.p0), offset: t0 - e });
      kf.push({ opacity: 1, transform: T(q.p0), offset: Math.min(t0 + (j ? X / D : 0.02), t1 - 2 * e) });
      kf.push({ opacity: 1, transform: T(q.p1), offset: Math.max(t0 + 2 * e, t1 - (last ? 0.04 : X / D)) });
      kf.push({ opacity: 0, transform: T(q.p1), offset: Math.min(1, t1) });
      if (t1 < 1) kf.push({ opacity: 0, transform: T(q.p1), offset: 1 });
      im.animate(kf, { duration: D, fill: 'both' }).onfinish = () => im.remove();
    });
    setTimeout(() => imgs.forEach((im) => { if (im.parentNode) im.remove(); }), D + 400);   // 途中でバトルが終わっても DOM を残さない
    // 攻撃側の待機の絵は、コマを出している間は隠す → 最後に戻る（復帰）
    const end = P.body / D;
    me.animate([{ opacity: 0, offset: 0 }, { opacity: 0, offset: Math.min(0.99, end - 0.02) }, { opacity: 1, offset: Math.min(1, end + 0.08) }, { opacity: 1, offset: 1 }], { duration: D });
    const ms = me.parentNode; if (ms && ms.style) { ms.style.zIndex = 7; setTimeout(() => { ms.style.zIndex = ''; }, D + 100); }
    // 当たる瞬間：今までの演出と同じ共通の効果（光の輪・相手のノックバック・揺れ・画面の光）。補助技は出さない
    if (P.hit != null) {
      const SK = G('SK'), col = (SK && SK[k] && SK[k][3]) || '#ffd36a';
      setTimeout(() => {
        try { const burst = G('burst'), knock = G('knock'), shake = G('shake'), flash = G('flash');
          const tx = tr.left + tr.width / 2 - vr.left, ty = tr.top + tr.height / 2 - vr.top;
          if (burst) burst(v, tx, ty, col, 14); if (knock) knock('#m' + (1 - s), f); if (shake) shake(v); if (flash) flash(col); } catch (e) { /* 無視 */ }
      }, P.hit);
    }
    return true;
  }

  // ---- 立ち絵の切り替え・比較の札 ----
  function syncIdle(bt) {
    bt = bt || document.getElementById('bt'); if (!bt) return;
    [0, 1].forEach((s) => {
      const im = bt.querySelector(`#m${s} .mon .mma-idle`), sp = spOf(s);
      if (!im || sp == null) return;
      const M = root.MMARENA, src = (IDLE[sp] && on) ? IDLE[sp].src : (M && M.IDLE && M.IDLE[sp] ? `./assets/battle/idle/${M.IDLE[sp]}.webp` : null);
      if (src && im.getAttribute('src') !== src) im.src = src;
      im.classList.toggle('p25', !!(on && IDLE[sp]));
      im.style.setProperty('--p25h', String(idleScale(sp)));
    });
    const sw = bt.querySelector('.p25sw'); if (sw) sw.innerHTML = on ? '絵：<b>2.5D</b>（試遊）⇄ 旧' : '絵：<b>旧</b> ⇄ 2.5D（試遊）';
  }
  function set(v) { on = !!v; syncIdle(); return on; }
  function setupBattle(bt) {
    style();
    if (offered && !bt.querySelector('.p25sw')) {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'p25sw'; b.setAttribute('aria-label', 'バトルの絵を切り替える（比較試遊）');
      const hp = bt.querySelector('.hpr'); b.style.top = ((hp ? hp.getBoundingClientRect().bottom - bt.getBoundingClientRect().top : 60) + 6) + 'px';
      b.addEventListener('click', (e) => { e.stopPropagation(); set(!on); });
      bt.appendChild(b);
    }
    syncIdle(bt);
    // 使う技のコマを先に読む（このバトルの2体の装備技だけ）
    if (on) { const pl = G('BPL'); if (pl) [0, 1].forEach((s) => (pl[s] && pl[s].eq || []).forEach((k) => { if (!handles(k, s)) return; DATA()[k].cuts.forEach((c) => { const i = new Image(); i.decoding = 'async'; i.src = A + c.f; }); })); }
  }
  if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
    const mo = new MutationObserver(() => { const bt = document.getElementById('bt'); if (bt && !bt.__p25) { bt.__p25 = true; setTimeout(() => setupBattle(bt), 30); } });
    const start = () => mo.observe(document.body, { childList: true, subtree: true });
    if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  }

  root.MM25D = Object.freeze({ anim, handles, timing, layout, idleSrc, idleScale, set, syncIdle, get on() { return on; }, get offered() { return offered; }, owner, plan, IDLE });
})(typeof window !== 'undefined' ? window : globalThis);
