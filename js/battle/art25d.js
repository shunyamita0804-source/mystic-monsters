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
  /** 技のコマの大きさの補正（本体の高さの推定は枠で切れた羽・しっぽで小さく出やすい＝今までの立ち絵と同じくらいに見える値） */
  const ZOOM = { 0: 0.92, 1: 0.68 };
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
  function plan(k) {
    const d = DATA()[k], n = d.cuts.length;
    const dur = n <= 4 ? 1500 : n <= 6 ? 1750 : 1950;
    const body = dur * 0.84, step = body / n;
    const win = d.cuts.map((c, i) => [i * step, (i + 1) * step]);
    const SK = G('SK'), dmg = !!(SK && SK[k] && SK[k][1] > 0);   // 補助技（威力なし）は当たる瞬間の効果を出さない
    const hit = d.hit && dmg ? win[d.hit - 1][0] + 30 : null;
    return { dur, body, step, win, hit };
  }
  function timing(k, s) { if (!handles(k, s)) return null; const p = plan(k); return { hit: p.hit, dur: p.dur }; }

  function style() {
    if (document.getElementById('mm25d-style')) return;
    const st = document.createElement('style'); st.id = 'mm25d-style';
    st.textContent = [
      '#bt .p25f{position:absolute;left:0;top:0;max-width:none;pointer-events:none;z-index:7;will-change:transform,opacity}',
      '#bt .mon .mma-idle.p25{height:calc(118% * var(--p25h,1))}',
      '#bt .p25sw{position:absolute;left:8px;z-index:30;pointer-events:auto;font:800 11px/1 "Noto Sans JP",sans-serif;color:#f3ecd9;background:rgba(8,14,34,.82);border:1.5px solid rgba(214,178,98,.9);border-radius:999px;padding:6px 10px;letter-spacing:.04em}',
      '#bt .p25sw b{color:#ffd76a}',
    ].join('\n');
    document.head.appendChild(st);
  }

  /** 技のコマを順に見せる。引き受けたら true */
  function anim(k, s) {
    if (!handles(k, s)) return false;
    const v = $('.vs'), me = document.getElementById('m' + s), op = document.getElementById('m' + (1 - s));
    if (!v || !v.appendChild || !me || !op) return false;
    const mon = $('.mon', me), tmon = $('.mon', op);
    if (!mon || !tmon) return false;
    style();
    const d = DATA()[k], P = plan(k), f = s ? -1 : 1, calm = reduced();
    const vr = v.getBoundingClientRect(), ar = mon.getBoundingClientRect(), tr = tmon.getBoundingClientRect();
    const sp = spOf(s), idleH = ar.height * 1.18 * (IDLE[sp] ? IDLE[sp].h : 1);
    const Ag = { x: ar.left + ar.width / 2 - vr.left, y: ar.bottom - vr.top };   // 攻撃側の足元
    const Tg = { x: tr.left + tr.width / 2 - vr.left, y: tr.bottom - vr.top };   // 相手の足元
    const S = idleH * (ZOOM[sp] || 1) / (d.body.h * d.ph);                                         // コマの1画素 → 画面の画素
    const foot = { x: d.body.gx * d.pw, y: d.body.gy * d.ph };                    // コマ（元の枠）の中の足元
    const reach = Math.abs(Tg.x - Ag.x);
    // モードごとの足元の位置（窓の始め → 終わり）
    const posOf = (m) => {
      if (calm) return [Ag, Ag];
      if (m === 'move') return [{ x: Ag.x + f * reach * 0.08, y: Ag.y }, { x: Ag.x + f * reach * 0.42, y: Ag.y }];
      if (m === 'contact') return [{ x: Ag.x + f * reach * 0.45, y: Ag.y }, { x: Ag.x + f * reach * 0.52, y: Ag.y }];
      if (m === 'past') return [{ x: Ag.x + f * reach * 0.62, y: Ag.y }, { x: Ag.x + f * reach * 0.7, y: Ag.y }];
      return [Ag, { x: Ag.x + f * 6, y: Ag.y }];
    };
    // 使わないコマの窓は、直前に使ったコマがそのまま続く（動きは次の位置へ）
    const shown = [];
    d.cuts.forEach((c, i) => {
      if (c.f) shown.push({ c, i, w0: P.win[i][0], w1: P.win[i][1], m: c.m });
      else if (shown.length) { const L = shown[shown.length - 1]; L.w1 = P.win[i][1]; if (L.m === 'move') L.m2 = 'contact'; }
    });
    const D = P.dur, X = 70;   // X＝コマの切り替えの重なり（ms）
    shown.forEach((q, j) => {
      const c = q.c, im = document.createElement('img');
      im.className = 'p25f'; im.alt = ''; im.decoding = 'sync'; im.src = A + c.f;
      const W = c.w * S, H = c.h * S, ox = (foot.x - c.x) * S, oy = (foot.y - c.y) * S;   // 画像の中の足元
      im.style.width = W + 'px'; im.style.height = H + 'px'; im.style.transformOrigin = `${ox}px ${oy}px`;
      v.appendChild(im);
      // 画面の左右からはみ出さないように（コマの構図で本体が枠の端に描かれているもの）横だけずらす
      const fit = (p) => { const l = f > 0 ? p.x - ox : p.x - (W - ox), r = l + W, VW = vr.width; let dx = 0; if (W <= VW) { if (l < 0) dx = -l; else if (r > VW) dx = VW - r; } return dx ? { x: p.x + dx, y: p.y } : p; };
      const [p0] = posOf(q.m).map(fit), [, p1] = posOf(q.m2 || q.m).map(fit);
      const T = (p, z) => `translate(${p.x - ox}px,${p.y - oy}px) scale(${f * z},${z})`;
      const t0 = Math.max(0, q.w0 - (j ? X : 0)) / D, t1 = Math.min(D, q.w1 + (j < shown.length - 1 ? X : 0)) / D, e = 0.001;
      const kf = [{ opacity: 0, transform: T(p0, 1), offset: 0 }];
      if (t0 > e) kf.push({ opacity: 0, transform: T(p0, 1), offset: t0 - e });
      kf.push({ opacity: 1, transform: T(p0, 1), offset: Math.min(t0 + (j ? X / D : 0.02), t1 - 2 * e) });
      kf.push({ opacity: 1, transform: T(p1, 1), offset: Math.max(t0 + 2 * e, t1 - (j < shown.length - 1 ? X / D : 0.03)) });
      kf.push({ opacity: 0, transform: T(p1, 1), offset: Math.min(1, t1) });
      if (t1 < 1) kf.push({ opacity: 0, transform: T(p1, 1), offset: 1 });
      const a = im.animate(kf, { duration: D, fill: 'both' });
      a.onfinish = () => im.remove();
      setTimeout(() => { if (im.parentNode) im.remove(); }, D + 400);   // 念のため（途中でバトルが終わっても DOM を残さない）
    });
    // 攻撃側の待機の絵は、コマを出している間は隠す → 最後に戻る（復帰）
    const end = shown.length ? shown[shown.length - 1].w1 / D : 0.84;
    me.animate([{ opacity: 0, offset: 0 }, { opacity: 0, offset: Math.min(0.99, end) }, { opacity: 1, offset: Math.min(1, end + 0.12) }, { opacity: 1, offset: 1 }], { duration: D });
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
    if (on) { const pl = G('BPL'); if (pl) [0, 1].forEach((s) => (pl[s] && pl[s].eq || []).forEach((k) => { if (!handles(k, s)) return; DATA()[k].cuts.forEach((c) => { if (c.f) { const i = new Image(); i.decoding = 'async'; i.src = A + c.f; } }); })); }
  }
  if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
    const mo = new MutationObserver(() => { const bt = document.getElementById('bt'); if (bt && !bt.__p25) { bt.__p25 = true; setTimeout(() => setupBattle(bt), 30); } });
    const start = () => mo.observe(document.body, { childList: true, subtree: true });
    if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  }

  root.MM25D = Object.freeze({ anim, handles, timing, idleSrc, idleScale, set, syncIdle, get on() { return on; }, get offered() { return offered; }, owner, plan, IDLE });
})(typeof window !== 'undefined' ? window : globalThis);
