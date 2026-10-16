// =========================================================
// 2026-10-16：フルーネ技09「ルートドレイン」8コマの試験実装 `MMRD`（作業ブランチだけ・QA 試遊のときだけ・未解禁のまま）
//  素材：assets/battle/flurene_rootdrain_1016/rd_01〜08.webp（ZIP Mismon_Claude_Combined_iPhone6_Fulune_20261016 の完成コンポジット8枚の表示用の派生・tools/rootdrain1016/derive.py）
//   ＝本体（2本の蔦腕）と全部の効果が1枚に描かれている＝本体・腕・攻撃の効果を上から二重に足さない。8枚は同じ切り出し＝同じ足もと
//  流れ：01 予備動作 → 02 振りかぶり → 03 蔦腕の突き出し → 04 命中（当たり＝既存のダメージのイベント1回）→ 05・06 紫の吸収の脈動 → 07 回復の光（吸収した HP を1回だけ）→ 08 待機へ
//   素材の試案の表示時間 [180,170,100,170,200,200,300,410]ms の比のまま、既存の大技の時間枠（共通演出を通るとき 2.3秒・通らないとき 1.44秒）に合わせる
//  置き方：08（待機の姿）を正式のバトル待機絵（idle_flurene＝.mma-idle の実際の矩形）に合わせる＝体の面積・足もと・重心が同じ大きさ・位置（08 → 待機で顔・根・体格が飛ばない）。
//   全コマ同じ倍率・同じ位置（伸ばさない・相手まで届くように広げない）。相手側は scaleX(-1)
//  性能・吸収の計算は js/battle/rules.js（与えたダメージの 50% を回復・命中してダメージがあるときだけ・最大ライフまで）。この絵は見た目だけ
// =========================================================
(function (root) {
  'use strict';
  const DIR = './assets/battle/flurene_rootdrain_1016/';
  const FRAMES = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8].map((i) => DIR + 'rd_' + String(i).padStart(2, '0') + '.webp'));
  const MS = Object.freeze([180, 170, 100, 170, 200, 200, 300, 410]);   // 素材の試案（比として使う）
  const HIT = 3, HEAL = 6;   // 04＝命中・07＝回復（0 から数える）
  // 派生の大きさ（tools/rootdrain1016/derive.json）と、08 の不透明な部分の面積・重心・足もと（割合）
  const FW = 527, FH = 449, A08 = 0.41878, CX08 = 0.4389, BOT08 = 0.9822;
  // 正式のバトル待機絵 assets/battle/idle/idle_flurene.webp（730×720）の不透明な部分の面積・重心・足もと（割合）
  const IDLE_AREA = 0.50615, IDLE_CX = 0.5050, IDLE_BOT = 0.99583;
  const SK_NO = 58;   // QA 試遊だけで入れる SK の番号（50＋No−1。js/battle/rules.js）
  const FLURENE = 5;
  const failed = new Set();
  let warmed = false;
  function warm() { if (warmed || typeof Image === 'undefined') return; warmed = true; FRAMES.forEach((u) => { const i = new Image(); i.decoding = 'async'; i.onerror = () => failed.add(u); i.src = u; }); }
  const handles = (k, sp) => k === SK_NO && sp === FLURENE && failed.size === 0;
  /** 時間（ms・速さ 1.0）：dur＝時間枠、win＝8コマの窓、hit＝04 の始め＋少し、heal＝07 の始め */
  function plan(viaStage, dmg) {
    const dur = viaStage ? 2300 : 1440, body = dur * 0.94, tot = MS.reduce((a, b) => a + b, 0);
    let t = 0; const win = MS.map((m) => { const w = [t, t + m * body / tot]; t = w[1]; return w; });
    return { dur, body, win, hit: dmg ? Math.round(win[HIT][0] + 30) : null, heal: Math.round(win[HEAL][0] + 110) };
  }
  const log = [];
  /** g＝art25d の geom(s)・P＝plan の値。返り値 true＝引き受けた */
  function play(k, s, g, P) {
    const { v, me, f, vr } = g, D = P.dur;
    const ii = me.querySelector('.mon .mma-idle'), ir = ii && ii.getBoundingClientRect();
    if (!ir || !ir.width) return false;
    const iw = ir.width, ih = ir.height, il = ir.left - vr.left, it = ir.top - vr.top;
    const sc = Math.sqrt(IDLE_AREA * iw * ih / (A08 * FW * FH)), W = FW * sc, H = FH * sc;   // 08 の体の面積＝待機絵の体の面積
    const cxIdle = il + (f > 0 ? IDLE_CX : 1 - IDLE_CX) * iw, foot = it + IDLE_BOT * ih;
    const left = cxIdle - (f > 0 ? CX08 : 1 - CX08) * W, top = foot - BOT08 * H;
    const imgs = [];
    FRAMES.forEach((u, i) => {
      const im = document.createElement('img'); im.src = u; im.alt = ''; im.decoding = 'sync'; im.className = 'p25f mmrd'; im.dataset.cut = 'RD_' + (i + 1);
      im.style.width = W + 'px'; im.style.height = H + 'px'; im.style.transformOrigin = '50% 50%'; im.style.zIndex = 7; v.appendChild(im); imgs.push(im);
      const w = P.win[i], e = 0.0005, o = (x) => Math.max(0, Math.min(1, x / D)), tf = `translate(${left}px,${top}px) scaleX(${f})`;
      const a = o(w[0]), b = o(w[1]), X = 26 / D;   // 前後のコマとわずかに重ねる（ちらつかない）
      const kf = [{ offset: 0, opacity: 0, transform: tf }];
      if (a - X > e) kf.push({ offset: a - X, opacity: 0, transform: tf });
      kf.push({ offset: Math.max(a, e), opacity: 1, transform: tf });
      kf.push({ offset: Math.min(1, Math.max(b, a + 2 * e)), opacity: 1, transform: tf });
      if (i < FRAMES.length - 1) { kf.push({ offset: Math.min(1, b + X), opacity: 0, transform: tf }); if (b + X < 1) kf.push({ offset: 1, opacity: 0, transform: tf }); }
      else { kf.push({ offset: 1, opacity: 0, transform: tf }); }   // 08 → 正式の待機絵（me）へ入れ替え
      for (let j = 1; j < kf.length; j++) if (kf[j].offset < kf[j - 1].offset) kf[j].offset = kf[j - 1].offset;
      im.animate(kf, { duration: D, fill: 'both' }).onfinish = () => im.remove();
    });
    const end = P.win[7][1] / D;
    me.animate([{ opacity: 0, offset: 0 }, { opacity: 0, offset: Math.max(0, Math.min(0.99, end - 0.03)) }, { opacity: 1, offset: Math.min(1, end) }, { opacity: 1, offset: 1 }], { duration: D });
    const ms = me.parentNode; if (ms && ms.style) { ms.style.zIndex = 7; setTimeout(() => { ms.style.zIndex = ''; }, D + 100); }
    setTimeout(() => imgs.forEach((im) => { if (im.parentNode) im.remove(); }), D + 400);
    const rec = { k, s, D, hit: P.hit, heal: P.heal, sc: +sc.toFixed(3), t0: performance.now(), healShown: 0 };
    log.push(rec); if (log.length > 20) log.shift();
    // 回復の表示は 07 の始め（js/battle/rules.js が吸収の量を決めて待たせている）
    setTimeout(() => { try { if (root.MMRULES && root.MMRULES.flushDrain) rec.healShown = root.MMRULES.flushDrain(s) ? 1 : 0; } catch (er) { /* 無視 */ } }, P.heal);
    if (P.hit != null) setTimeout(() => { try { const knock = (0, eval)('knock'), shake = (0, eval)('shake'); if (knock) knock('#m' + (1 - s), f); if (shake) shake(v); } catch (er) { /* 無視 */ } }, P.hit);
    return true;
  }
  root.MMRD = Object.freeze({ FRAMES, MS, HIT, HEAL, SK_NO, FLURENE, handles, plan, play, warm, failed, log: () => log.slice() });
})(typeof window !== 'undefined' ? window : globalThis);
