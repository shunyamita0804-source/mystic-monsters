// =========================================================
// 2026-10-16（バトル最終統合）：フルーネ技09「ルートドレイン」補修版10コマ `MMRD`（QA 試遊のときだけ・未解禁のまま）
//  素材：assets/battle/flurene_rootdrain_v2_1016/rd2_01〜10.webp（ZIP Mismon_Battle_Final_Part02_RootDrain の RootDrain_v2_repaired 10枚＝2560×1536 の全身コンポジットの
//   表示用の派生・tools/final1016/derive.py・10枚同じ切り出し＝同じ足もと）。旧1536px・8コマ（flurene_rootdrain_1016）は失効＝削除した（使わない）
//  順：01 → 02 → 03 → 04（両蔦腕が相手に届き金白の2点が接触＝当たり1回）→ 05_prebeat → 05（1回目のドクン）→ 06_prebeat → 06（2回目のドクン）
//   → 07（暖黄・シアン・白の回復＝吸収した HP を1回だけ）→ 08（待機へ）
//  置き方：08（待機の姿）の体の面積・重心・足もとを正式のバトル待機絵（.mma-idle の実際の矩形）に合わせる＝全10枚同じ倍率・同じ位置（2560 の全幅を画面に収める縮小はしない）。
//   蔦が相手まで伸びるコマ（04〜06）だけ、体の右（x ≥ XB）の蔦の部分を横にだけ伸縮して、2つの接触点の中ほどを相手の被弾点へ合わせる（同じ画像の左右2つの切り出し＝腕を足さない）。
//   相手側は scaleX(-1)（全体の器を反転＝伸ばす向きも反転）
//  性能・吸収の計算は js/battle/rules.js（与えたダメージの 50%・命中してダメージがあるときだけ・最大ライフまで）。この絵は見た目だけ
// =========================================================
(function (root) {
  'use strict';
  const DIR = './assets/battle/flurene_rootdrain_v2_1016/';
  const ORDER = Object.freeze(['01', '02', '03', '04', '05_prebeat', '05', '06_prebeat', '06', '07', '08']);
  const FRAMES = Object.freeze(ORDER.map((o, i) => DIR + 'rd2_' + String(i + 1).padStart(2, '0') + '.webp'));
  // 各コマの時間（ms・共通演出を通るときの長さ）。04 は当たりを見せる止め、2回の脈動は prebeat（溜め）→ 拍、07 の回復は長め
  const MS = Object.freeze([230, 210, 150, 330, 170, 270, 170, 270, 470, 330]);
  const HIT = 3, BEATS = Object.freeze([5, 7]), HEAL = 8, LAST = 9;
  // 派生の大きさ（tools/final1016/derive.json）と、08（最後のコマ）の不透明な部分の面積・重心・足もと（割合）
  const FW = 850, FH = 449, A08 = 0.25979, CX08 = 231.5 / 850, BOT08 = 0.9822;
  // 蔦の伸縮：体の右の境（派生の画素）と、04 の2つの金白の接触点の中ほど（派生の画素）
  const XB = 470, CONTACT = Object.freeze([761, 210]), STRETCH = Object.freeze([3, 4, 5, 6, 7]);
  // 正式のバトル待機絵 assets/battle/idle/idle_flurene.webp（730×720）の不透明な部分の面積・重心・足もと（割合）
  const IDLE_AREA = 0.50615, IDLE_CX = 0.5050, IDLE_BOT = 0.99583;
  const SK_NO = 58;   // QA 試遊だけで入れる SK の番号（50＋No−1。js/battle/rules.js）
  const FLURENE = 5;
  const failed = new Set();
  let warmed = false;
  function warm() { if (warmed || typeof Image === 'undefined') return; warmed = true; FRAMES.forEach((u) => { const i = new Image(); i.decoding = 'async'; i.onerror = () => failed.add(u); i.src = u; }); }
  const handles = (k, sp) => k === SK_NO && sp === FLURENE && failed.size === 0;
  /** 時間（ms）：dur＝時間枠、win＝10コマの窓、hit＝04 の始め＋少し、beats＝2回の脈動、heal＝07 の始め。共通演出を通らないときは 1.44秒に縮める */
  function plan(viaStage, dmg) {
    const tot = MS.reduce((a, b) => a + b, 0), dur = viaStage ? Math.round(tot / 0.94) : 1440, body = dur * 0.94;
    let t = 0; const win = MS.map((m) => { const w = [t, t + m * body / tot]; t = w[1]; return w; });
    return { dur, body, win, hit: dmg ? Math.round(win[HIT][0] + 40) : null, beats: BEATS.map((i) => Math.round(win[i][0] + 30)), heal: Math.round(win[HEAL][0] + 110) };
  }
  const log = [];
  /** g＝art25d の geom(s)・P＝plan の値。返り値 true＝引き受けた */
  function play(k, s, g, P) {
    const { v, me, f, vr, T } = g, D = P.dur;
    const ii = me.querySelector('.mon .mma-idle'), ir = ii && ii.getBoundingClientRect();
    if (!ir || !ir.width) return false;
    const iw = ir.width, ih = ir.height, il = ir.left - vr.left, it = ir.top - vr.top;
    const sc = Math.sqrt(IDLE_AREA * iw * ih / (A08 * FW * FH)), W = FW * sc, H = FH * sc;   // 08 の体の面積＝待機絵の体の面積
    const cxIdle = il + (f > 0 ? IDLE_CX : 1 - IDLE_CX) * iw, foot = it + IDLE_BOT * ih;
    const left = cxIdle - (f > 0 ? CX08 : 1 - CX08) * W, top = foot - BOT08 * H;
    const sx = (xu) => (f > 0 ? left + xu * sc : left + W - xu * sc);   // 器の中の x（派生の画素）→ 画面の x
    // 被弾点：相手の体の中心より少し手前（2つの接触点の光が体に重なる）。蔦の部分だけ横に伸縮（極端な伸縮はしない）
    const tx = T ? T.x - f * T.w * 0.12 : sx(CONTACT[0]);
    const ext = Math.max(0.55, Math.min(2.4, Math.abs(tx - sx(XB)) / ((CONTACT[0] - XB) * sc)));
    const imgs = [];
    const mk = (u, i) => {
      const box = document.createElement('div'); box.className = 'p25f mmrd'; box.dataset.cut = 'RD2_' + (i + 1); box.dataset.order = ORDER[i];
      box.style.cssText = `width:${W}px;height:${H}px;overflow:visible;transform-origin:50% 50%;z-index:7`;
      const slice = (x0, x1, e) => {
        const d = document.createElement('div');
        d.style.cssText = `position:absolute;top:0;left:${x0 * sc}px;width:${(x1 - x0) * sc}px;height:${H}px;overflow:hidden;transform-origin:0 50%` + (e !== 1 ? `;transform:scaleX(${e})` : '');
        const im = document.createElement('img'); im.src = u; im.alt = ''; im.decoding = 'sync';
        im.style.cssText = `position:absolute;top:0;left:${-x0 * sc}px;width:${W}px;height:${H}px;max-width:none`;
        d.appendChild(im); box.appendChild(d); return d;
      };
      if (STRETCH.includes(i)) { slice(0, XB, 1); const e = slice(XB, FW, ext); e.dataset.ext = ext.toFixed(3); }
      else slice(0, FW, 1);
      v.appendChild(box); imgs.push(box); return box;
    };
    FRAMES.forEach((u, i) => {
      const box = mk(u, i);
      const w = P.win[i], e = 0.0005, o = (x) => Math.max(0, Math.min(1, x / D)), tf = `translate(${left}px,${top}px) scaleX(${f})`;
      const a = o(w[0]), b = o(w[1]), X = 26 / D;   // 前後のコマとわずかに重ねる（ちらつかない）
      const kf = [{ offset: 0, opacity: 0, transform: tf }];
      if (a - X > e) kf.push({ offset: a - X, opacity: 0, transform: tf });
      kf.push({ offset: Math.max(a, e), opacity: 1, transform: tf });
      kf.push({ offset: Math.min(1, Math.max(b, a + 2 * e)), opacity: 1, transform: tf });
      if (i < LAST) { kf.push({ offset: Math.min(1, b + X), opacity: 0, transform: tf }); if (b + X < 1) kf.push({ offset: 1, opacity: 0, transform: tf }); }
      else { kf.push({ offset: 1, opacity: 0, transform: tf }); }   // 08 → 正式の待機絵（me）へ入れ替え
      for (let j = 1; j < kf.length; j++) if (kf[j].offset < kf[j - 1].offset) kf[j].offset = kf[j - 1].offset;
      box.animate(kf, { duration: D, fill: 'both' }).onfinish = () => box.remove();
    });
    const end = P.win[LAST][1] / D;
    me.animate([{ opacity: 0, offset: 0 }, { opacity: 0, offset: Math.max(0, Math.min(0.99, end - 0.03)) }, { opacity: 1, offset: Math.min(1, end) }, { opacity: 1, offset: 1 }], { duration: D });
    const ms = me.parentNode; if (ms && ms.style) { ms.style.zIndex = 7; setTimeout(() => { ms.style.zIndex = ''; }, D + 100); }
    setTimeout(() => imgs.forEach((im) => { if (im.parentNode) im.remove(); }), D + 400);
    const rec = { k, s, D, hit: P.hit, beats: P.beats, heal: P.heal, sc: +sc.toFixed(3), ext: +ext.toFixed(3), contact: { x: Math.round(sx(XB) + (sx(CONTACT[0]) - sx(XB)) * ext), y: Math.round(top + CONTACT[1] * sc) }, target: T ? { x: Math.round(tx), y: Math.round(T.cy), top: Math.round(T.top), bottom: Math.round(T.top + T.h) } : null, t0: performance.now(), healShown: 0 };
    log.push(rec); if (log.length > 20) log.shift();
    const G = (n) => { try { return (0, eval)(n); } catch (e) { return null; } };
    // 回復の表示は 07 の始め（js/battle/rules.js が吸収の量を決めて待たせている）
    setTimeout(() => { try { if (root.MMRULES && root.MMRULES.flushDrain) rec.healShown = root.MMRULES.flushDrain(s) ? 1 : 0; } catch (er) { /* 無視 */ } }, P.heal);
    if (P.hit != null) {
      setTimeout(() => { try { const knock = G('knock'), shake = G('shake'); if (knock) knock('#m' + (1 - s), f); if (shake) shake(v); } catch (er) { /* 無視 */ } }, P.hit);
      // 2回の脈動（ドクン）：吸われる相手が小さく震える（色は変えない）
      P.beats.forEach((t) => setTimeout(() => { try { const op = document.querySelector('#m' + (1 - s) + ' .mon'); if (op && op.animate) op.animate([{ transform: 'none' }, { transform: `translateX(${-4 * f}px) scale(.985)` }, { transform: 'none' }], { duration: 180 }); } catch (er) { /* 無視 */ } }, t));
    }
    return true;
  }
  root.MMRD = Object.freeze({ FRAMES, ORDER, MS, HIT, BEATS, HEAL, XB, CONTACT, SK_NO, FLURENE, handles, plan, play, warm, failed, log: () => log.slice() });
})(typeof window !== 'undefined' ? window : globalThis);
