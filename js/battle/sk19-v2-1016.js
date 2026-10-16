// =========================================================
// 2026-10-16：ガウル SK19「聖なる炎」承認演出 V2 の試験実装 `MMSK19V2`（作業ブランチだけ・main 未統合・iPhone 実機は未検証）
//  素材：assets/battle/gauru_sk19_v2_1016/（ユーザー承認の V2 PNG の表示用の派生・tools/sk19v2/derive.py・README.md に sha256）
//    飛行2枚（翼上げ fly_up・翼を横に fly_down）＝参照待機（cutout）と同じ 1254 のキャンバス。放射4枚＝胸で点火 → 拡大 → 放射 → 最大放射
//  時間：承認動画（5.79秒）の相対時刻（TL）を、既存の SK19 の時間枠（art25d の planOff＝共通演出を通るとき 2.5秒・通らないとき 1.44秒）に縮めて使う
//    ＝戦闘時間・act() の待ち・ダメージの時刻の契約は変えない。当たり（P.hit）＝炎の外縁が相手の中心に届く時刻（承認動画の 2.95秒の割合）に1回だけ
//    確認用：?sk19time=v2＝承認動画と同じ実時間（共通演出を通るときだけ・戦闘時間が延びる＝QA 専用）／?sk19=v1＝前回（2026-10-16 iPhone 06）の演出
//  置き方：正式の待機絵（.mma-idle の実際の矩形）に、飛行ポーズの目の位置を合わせる（顔が飛ばない・足もとは地面に一致）。大きさは参照待機の体の面積を
//    正式の待機絵とそろえる（共通スケールと同じ考え方）。相手側は scaleX(-1)（画像は作り直さない）。炎の中心＝胸（キャンバスの割合 CHEST）＝動かない
//  重ね方：背景 → 背面の放射（不透明度 0.70）→ ガウル本体（1ポーズずつ）→ 胸の光＋薄い前面の放射（0.16）→ 既存の自己強化（sp_buff）→ UI
//  変えないもの：技の性能（威力115・命中90・CR15・命中後の全能力小UP 1T）・判定・ダメージ計算・fight()・Phase 6・ほかの技・SE・体格・セーブ
// =========================================================
(function (root) {
  'use strict';
  const DIR = './assets/battle/gauru_sk19_v2_1016/';
  const A = Object.freeze({ up: DIR + 'fly_up.webp', down: DIR + 'fly_down.webp', f1: DIR + 'flame_01_ignite.webp', f2: DIR + 'flame_02_expand.webp', f3: DIR + 'flame_03_radiate.webp', f4: DIR + 'flame_04_peak.webp' });
  const BUFF = './assets/battle/gauru_moves_1012/sp_buff.webp';
  const TL = 5790;   // 承認動画の長さ（ms）
  /** 承認動画の相対時刻（ms・TL の中）。fadeIn／fadeOut＝飛行ポーズと正式の待機絵の入れ替え */
  const T = Object.freeze({ rise0: 420, rise1: 1000, flyIn0: 580, flyIn1: 700, flap0: 650, flap1: 4420, flap: 290, hit: 2950, buff0: 3460, buff1: 4900, fall0: 3860, fall1: 4640, flyOut0: 4500, flyOut1: 4640 });
  /** 放射4枚：[時刻, 半径（胸 → 相手の中心の距離に対する比）, 不透明度]。承認動画の「約2.85〜3.05秒に外縁が敵の位置に達する」＝2.88秒で比 1。E＝絵の中の炎の外縁（画像の幅に対する半径の割合） */
  const FLAME = Object.freeze([
    { k: 'f1', E: 0.402, kf: [[840, 0.04, 0], [950, 0.08, 1], [1440, 0.19, 1], [1560, 0.22, 0]] },
    { k: 'f2', E: 0.45, kf: [[1430, 0.17, 0], [1530, 0.23, 1], [1900, 0.44, 1], [2010, 0.48, 0]] },
    { k: 'f3', E: 0.45, kf: [[1940, 0.43, 0], [2020, 0.48, 1], [2520, 0.74, 1], [2620, 0.79, 0]] },
    { k: 'f4', E: 0.45, kf: [[2550, 0.73, 0], [2640, 0.79, 1], [2880, 1.0, 1], [2950, 1.03, 1], [3300, 1.12, 0.55], [3600, 1.22, 0]] },   // 外縁が相手の中心に届く＝2.88秒（当たり 2.95秒の直前＝ヒットストップで止まっても届いている）
  ]);
  const BACK = 0.70, FRONT = 0.16;
  // 参照待機（cutout）と飛行ポーズのキャンバス（1254）の割合。目＝飛行2枚で同じ位置（測った値）・胸＝炎の中心
  const EYE = [0.815, 0.513], CHEST = [0.74, 0.64], BODY_W = 0.985;
  // 正式の待機絵 assets/battle/idle/idle_gauru.webp（576×720）の目の位置（右向き）と体の面積の割合、参照待機の体の面積の割合（アルファ 128 以上）
  const IDLE_EYE = [0.75, 0.50], IDLE_AREA = 0.60149, REF_AREA = 0.45058;
  const RISE = 0.10;   // 浮上＝表示中の本体の幅の約10%

  const qs = (() => { try { return new URLSearchParams(root.location ? root.location.search : ''); } catch (e) { return null; } })();
  const failed = new Set();
  const on = () => !(qs && qs.get('sk19') === 'v1') && failed.size === 0;
  const realTime = () => !!(qs && qs.get('sk19time') === 'v2');
  const reduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  const G = (name) => { try { return (0, eval)(name); } catch (e) { return undefined; } };
  let warmed = false;
  /** 先に読む（読めない絵があれば V2 をやめて前回の演出へ＝on() が false） */
  function warm() {
    if (warmed || typeof Image === 'undefined') return; warmed = true;
    Object.values(A).forEach((u) => { const i = new Image(); i.decoding = 'async'; i.onerror = () => failed.add(u); i.src = u; });
  }
  /** art25d の planOff から：時間枠（dur）と当たり（hit）。dur は既存のまま（?sk19time=v2 のときだけ承認動画の実時間） */
  function plan(dur, viaStage, dmg) {
    const D = realTime() && viaStage ? Math.round(TL * 1.18) : dur;   // 1.18＝共通演出の「強技」の再生速さ（stage.js の TIER.strong.rate）
    return { dur: D, hit: dmg ? Math.round(D * T.hit / TL) : null };
  }
  const ease = { out: (x) => 1 - Math.pow(1 - x, 3), io: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2) };
  const clamp = (x) => Math.max(0, Math.min(1, x));
  /** 浮上の量（0〜1・承認動画の時刻） */
  function riseAt(t) {
    if (t <= T.rise0) return 0;
    if (t < T.rise1) return ease.out((t - T.rise0) / (T.rise1 - T.rise0));
    if (t <= T.fall0) return 1;
    if (t < T.fall1) return 1 - ease.io((t - T.fall0) / (T.fall1 - T.fall0));
    return 0;
  }
  /** その時刻に見せる飛行ポーズ（'up'／'down'）。羽ばたきの間隔は承認動画の 0.29秒を縮めた値（短くなりすぎない＝最小 160ms） */
  function poseAt(t, period) {
    if (t < T.flap0) return 'up';
    const n = Math.floor((Math.min(t, T.flap1) - T.flap0) / period);
    return n % 2 ? 'down' : 'up';
  }
  /** 飛行ポーズの見え方（0〜1） */
  const flyVis = (t) => (t < T.flyIn0 ? 0 : t < T.flyIn1 ? (t - T.flyIn0) / (T.flyIn1 - T.flyIn0) : t < T.flyOut0 ? 1 : t < T.flyOut1 ? 1 - (t - T.flyOut0) / (T.flyOut1 - T.flyOut0) : 0);

  const log = [];
  /**
   * 再生（art25d の animOff から。共通演出の時間枠 D の中）。g＝art25d の geom(s)。返り値 true＝引き受けた
   *  P＝{ dur, hit }（plan の値）
   */
  function play(k, s, g, P) {
    const { v, me, f, vr, L } = g, Tg = g.T, D = P.dur, r = D / TL, calm = reduced();
    const ii = me.querySelector('.mon .mma-idle'), ir = ii && ii.getBoundingClientRect();
    if (!ir || !ir.width) return false;
    const iw = ir.width, ih = ir.height, il = ir.left - vr.left, it = ir.top - vr.top;
    // 大きさ：参照待機の体の面積＝正式の待機絵の体の面積
    const Cs = Math.sqrt(IDLE_AREA * iw * ih / REF_AREA);
    // 位置：飛行ポーズの目＝正式の待機絵の目（相手側は左右反転）
    const eyeX = il + (f > 0 ? IDLE_EYE[0] : 1 - IDLE_EYE[0]) * iw, eyeY = it + IDLE_EYE[1] * ih;
    const left = eyeX - (f > 0 ? EYE[0] : 1 - EYE[0]) * Cs, top = eyeY - EYE[1] * Cs;
    const riseH = calm ? 0 : RISE * BODY_W * Cs;
    const cx = left + (f > 0 ? CHEST[0] : 1 - CHEST[0]) * Cs, cy = top + CHEST[1] * Cs - riseH;   // 炎の中心＝浮き上がったあとの胸（動かない）
    const Rhit = Math.hypot(Tg.x - cx, Tg.cy - cy);
    const period = Math.max(T.flap * r, 160) / r;   // 承認動画の時刻での間隔
    const imgs = [], put = (el, z) => { el.className = 'p25f sk19v2'; el.style.zIndex = z; v.appendChild(el); imgs.push(el); return el; };
    const N = Math.max(24, Math.min(160, Math.round(D / 16)));   // キーフレームの刻み（約16ms）
    const grid = Array.from({ length: N + 1 }, (_, i) => (i / N) * TL);
    // 本体（飛行2枚）：1時点で1枚だけ・浮上と降下
    ['up', 'down'].forEach((p) => {
      const im = document.createElement('img'); im.src = A[p]; im.alt = ''; im.decoding = 'sync'; im.dataset.cut = 'SK19V2_' + p;
      im.style.width = Cs + 'px'; im.style.height = Cs + 'px'; im.style.transformOrigin = '50% 50%'; put(im, 7);
      const kf = grid.map((t, i) => {
        const vis = flyVis(t) * (calm ? (p === 'up' ? 1 : 0) : poseAt(t, period) === p ? 1 : 0);
        return { offset: i / N, opacity: vis, transform: `translate(${left}px,${top - riseAt(t) * riseH}px) scaleX(${f})` };
      });
      im.animate(kf, { duration: D, fill: 'both' }).onfinish = () => im.remove();
    });
    // 正式の待機絵：浮上の始めは一緒に上がり、飛行ポーズへ入れ替わる。降下の終わりに戻る（相手側の向きは CSS のまま）
    me.animate(grid.map((t, i) => ({ offset: i / N, opacity: 1 - flyVis(t) })), { duration: D });
    if (!calm) me.animate(grid.map((t, i) => ({ offset: i / N, transform: `translateY(${-riseAt(t) * riseH}px)` })), { duration: D, composite: 'add' });
    const ms = me.parentNode; if (ms && ms.style) { ms.style.zIndex = 7; setTimeout(() => { ms.style.zIndex = ''; }, D + 100); }
    // 放射4枚：胸を中心に円く広がる（背面 0.70・前面 0.16）。相手の中心に外縁が届く時刻＝当たり
    FLAME.forEach((fl) => {
      const W = Rhit / fl.E;   // 半径の比 1＝外縁（絵の幅 × E）が相手の中心
      [[6, BACK, 'b'], [8, FRONT, 'f']].forEach(([z, op, side]) => {
        const im = document.createElement('img'); im.src = A[fl.k]; im.alt = ''; im.decoding = 'sync'; im.dataset.cut = 'SK19V2_' + fl.k + side;
        im.dataset.cx = Math.round(cx); im.dataset.cy = Math.round(cy); im.dataset.e = fl.E;
        im.style.width = W + 'px'; im.style.height = W + 'px'; im.style.transformOrigin = '50% 50%'; put(im, z);
        const kf = [{ offset: 0, opacity: 0, transform: `translate(${cx - W / 2}px,${cy - W / 2}px) scale(${fl.kf[0][1]})` }];
        fl.kf.forEach(([t, R, o]) => kf.push({ offset: clamp(t / TL), opacity: o * op, transform: `translate(${cx - W / 2}px,${cy - W / 2}px) scale(${R}) scaleX(${f})` }));
        kf[0].transform += ` scaleX(${f})`;
        kf.push({ offset: 1, opacity: 0, transform: kf[kf.length - 1].transform });
        im.animate(kf, { duration: D, fill: 'both' }).onfinish = () => im.remove();
      });
    });
    // 胸の光（点火 → 最大放射の間）
    const R0 = Math.max(18, iw * 0.34), glow = document.createElement('div');
    glow.style.cssText = `width:${R0}px;height:${R0}px;border-radius:50%;background:radial-gradient(circle,#fff 0 12%,rgba(255,236,170,.95) 30%,rgba(255,150,70,.55) 52%,transparent 70%);mix-blend-mode:screen`;
    glow.dataset.cut = 'SK19V2_glow'; put(glow, 8);
    const gT = `translate(${cx - R0 / 2}px,${cy - R0 / 2}px)`;
    glow.animate([{ offset: 0, opacity: 0, transform: gT + ' scale(.4)' }, { offset: 840 / TL, opacity: 0, transform: gT + ' scale(.4)' }, { offset: 1300 / TL, opacity: 0.95, transform: gT + ' scale(1)' }, { offset: 2950 / TL, opacity: 0.85, transform: gT + ' scale(1.15)' }, { offset: 3500 / TL, opacity: 0, transform: gT + ' scale(.8)' }, { offset: 1, opacity: 0, transform: gT + ' scale(.8)' }], { duration: D, fill: 'both' }).onfinish = () => glow.remove();
    // 既存の金色の自己強化（sp_buff）へつなぐ（本体の後ろ）
    const bw = iw * 1.25, bh = bw * 631 / 616, bx = il + iw / 2, by = it + ih * 0.5 - riseH * 0.5;
    const bf = document.createElement('img'); bf.src = BUFF; bf.alt = ''; bf.decoding = 'sync'; bf.dataset.cut = 'SK19V2_buff';
    bf.style.width = bw + 'px'; bf.style.height = bh + 'px'; bf.style.transformOrigin = '50% 50%'; put(bf, 6);   // 本体の後ろ（金の光がガウルを覆って見失わない）
    const bT = `translate(${bx - bw / 2}px,${by - bh / 2}px) scaleX(${f})`;
    bf.animate([{ offset: 0, opacity: 0, transform: bT + ' scale(.92)' }, { offset: T.buff0 / TL, opacity: 0, transform: bT + ' scale(.92)' }, { offset: (T.buff0 + 160) / TL, opacity: 1, transform: bT + ' scale(.96)' }, { offset: (T.buff1 - 160) / TL, opacity: 1, transform: bT + ' scale(1)' }, { offset: T.buff1 / TL, opacity: 0, transform: bT + ' scale(1)' }, { offset: 1, opacity: 0, transform: bT + ' scale(1)' }], { duration: D, fill: 'both' }).onfinish = () => bf.remove();
    setTimeout(() => imgs.forEach((im) => { if (im.parentNode) im.remove(); }), D + 400);
    // 当たり（既存の命中・ダメージのイベント＝P.hit に1回だけ）：被弾の揺れ・光。敵側の着弾の炎・ターゲットの印は出さない
    const rec = { k, s, D, hit: P.hit, fired: 0, Cs: Math.round(Cs), cx: Math.round(cx), cy: Math.round(cy), Rhit: Math.round(Rhit), tx: Math.round(Tg.x), ty: Math.round(Tg.cy), period: Math.round(period * r), t0: performance.now() };
    log.push(rec); if (log.length > 20) log.shift();
    if (P.hit != null) {
      const SK = G('SK'), col = (SK && SK[k] && SK[k][3]) || '#ffd36a';
      setTimeout(() => { rec.fired++; try { const knock = G('knock'), shake = G('shake'), flash = G('flash'); if (knock) knock('#m' + (1 - s), f); if (shake) shake(v); if (flash) flash(col); } catch (er) { /* 無視 */ } }, P.hit);
    }
    return true;
  }

  // ---- 2026-10-16 ユーザー決定（iPhone 12:50 の録画）：聖なる炎のあとの「能力が上がるエフェクト」（index.html の efBurst＝青い球の光と ▲・js/battle/fx.js の能力アップの正式素材）を出さない ----
  //  SK19 V2 を再生している間（その時間枠＋1.5秒・同じ側）だけ。能力が上がる処理・状態の札（drawSt）・文・SE（sfx）は従来どおり＝見た目だけ消す。ほかの技の能力アップの印は変えない
  const effLog = [];
  function activeOn(w) { const now = performance.now(); return log.some((r) => r.s === w && now >= r.t0 && now <= r.t0 + r.D + 1500); }
  function wrapEff() {
    const F = root.efBurst; if (typeof F !== 'function' || F.__sk19) return;
    const W = function (w, e) {
      if (on() && activeOn(w)) { effLog.push({ w, lv: e && e.lv, t: Math.round(performance.now()) }); if (effLog.length > 40) effLog.shift(); try { const sfx = G('sfx'); if (sfx) sfx(e && e.lv < 0 ? 10 : 11); } catch (er) { /* 無視 */ } return; }
      return F.apply(this, arguments);
    };
    W.__sk19 = true; root.efBurst = W;
  }
  if (root.document) { if (root.document.readyState !== 'loading') setTimeout(wrapEff, 0); else root.addEventListener('DOMContentLoaded', () => setTimeout(wrapEff, 0)); }

  root.MMSK19V2 = Object.freeze({ effLog: () => effLog.slice(), A, TL, T, FLAME, EYE, CHEST, IDLE_EYE, IDLE_AREA, REF_AREA, BACK, FRONT, RISE, on, realTime, plan, play, warm, failed, riseAt, poseAt, flyVis, log: () => log.slice() });
})(typeof window !== 'undefined' ? window : globalThis);
