// バトルの共通演出エンジン（2026-10-06）。「ルーレットが主役」ではなく「モンスター同士の戦いが主役」に見せる。
//
// Phase 6（fight()・battle-bridge.js・adapter.js・技ルーレット・.bt 系 CSS）は変えない。index.html の anim()（Phase 6 の外）の先頭から
// MMSTAGE.run(k, s, animRaw) を呼ぶだけ。すべての技に共通の段階を挟む：
//   1 構え → 2 溜め（強技・必殺級）→ 3 攻撃動作（今までの技の絵＝SFR の4コマ／レグナスのポーズ。速さは tier で変える）
//   → 4 ヒットストップ（当たった瞬間にバトル画面の動きを短く止める）→ 5 被弾リアクション（ノックバック・被弾の光・画面の揺れ）
//   → 6 ダメージ表示（当たったあと少し遅れて。HP バーはさらに少し遅れて減る）→ 7 余韻 → 8 ルーレットへ戻る。
// 時間の合わせ方：act()（fight() の中）はダメージの表示を 0.72秒後・次のターンを 1.5秒後（スカイラッシュは 1.9秒後）に置く。
//   run() はその直後に置かれるタイマー（720・1500・1900ms）だけを、この技の当たる時刻・終わる時刻へずらす（その1回だけ・判定は変えない）。
//   ダメージ・命中・クリティカル・効果は act() が先に確定している（MMBattle.resolveAction）＝演出は結果を変えない。
// tier（目安）：基本技 約0.9〜1.3秒・強技 約1.3〜1.7秒・必殺級 約1.9〜2.7秒（＋余韻）。補助技・回復技は別のテンポ。
// 視差を減らす設定（prefers-reduced-motion）では使わない（従来の演出のまま）。自動テストは MM_QA_NO_STAGE のとき使わない（harness の open({ stage:true }) で使う）。
// 色を変える指定（CSS の色の加工）は使わない：被弾の光はモンスターの絵の形のマスクに白を重ねる。
(function () {
  'use strict';
  const ST = window.setTimeout.bind(window);
  const G = (name) => { try { return (0, eval)(name); } catch (e) { return undefined; } };
  const reduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  const EASE = { out: 'cubic-bezier(.2,.8,.3,1)', in: 'cubic-bezier(.6,0,.9,.4)', back: 'cubic-bezier(.3,1.5,.5,1)', io: 'cubic-bezier(.45,0,.55,1)' };

  // tier ごとの段階（ms）。rate＝今までの技の絵の再生速度。hs＝ヒットストップ。hold＝余韻。zoom＝背景の寄り
  const TIER = {
    basic: { windup: 170, charge: 0, rate: 1.4, hs: 70, hold: 240, zoom: 1.025, shake: 5, knock: 14 },
    strong: { windup: 190, charge: 230, rate: 1.18, hs: 100, hold: 300, zoom: 1.04, shake: 8, knock: 20 },
    finisher: { windup: 210, charge: 520, rate: 1.0, hs: 140, hold: 420, zoom: 1.065, shake: 12, knock: 28 },
    support: { windup: 160, charge: 0, rate: 1.1, hs: 0, hold: 260, zoom: 1.02, shake: 0, knock: 0 },
  };
  // レグナスの技（rival-partner.js の anim）の最初に当たる時刻（ms・速さ 1.0 のとき）。補助技は null
  const RP_HIT = { 1: 330, 2: 340, 3: null, 4: null, 5: 470, 6: 600, 7: 300, 8: 340, 9: 400, 10: 860 };
  const RP_DUR = { 1: 760, 2: 780, 3: 820, 4: 800, 5: 1080, 6: 1060, 7: 920, 8: 1000, 9: 1390, 10: 1400 };
  // 正式技の個別の演出（技の番号）。self＝自分の強化の補助技は今までの技の絵を使わない（相手へ突進しない）
  const SPECIAL = { 7: 'guard', 13: 'sonic', 19: 'holy', 18: 'storm' };

  let busy = 0, styled = false, cur = null;
  // act() が run() の直後に呼ぶ MMBattle.resolveAction の結果（命中・クリティカル）を読む（中身は呼ぶだけ・結果は変えない）
  function ensureWrap() {
    const B = window.MMBattle;
    if (!B || B.__st || typeof B.resolveAction !== 'function') return;
    const W = Object.assign({}, B);
    W.__st = true;
    W.resolveAction = function (o) { const r = B.resolveAction(o); if (cur && !cur.r) cur.r = r; return r; };
    window.MMBattle = Object.freeze(W);
  }
  function style() {
    if (styled || document.getElementById('mmst-style')) { styled = true; return; }
    const st = document.createElement('style'); st.id = 'mmst-style';
    st.textContent = '#bt .mmst{position:absolute;inset:0;pointer-events:none;z-index:8;overflow:hidden}'
      + '#bt .mmst i{position:absolute;display:block;border-radius:50%;left:0;top:0;will-change:transform,opacity}'
      + '#bt .mmst .aura{background:radial-gradient(circle,var(--c2) 0,var(--c) 38%,transparent 70%);mix-blend-mode:screen}'
      + '#bt .mmst .ring{border:3px solid var(--c2);box-shadow:0 0 14px var(--c),inset 0 0 10px var(--c)}'
      + '#bt .mmst .dot{width:8px;height:8px;background:var(--c2);box-shadow:0 0 8px var(--c)}'
      + '#bt .mmst .flash{border-radius:0;background:#fff;-webkit-mask-size:contain;mask-size:contain;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:center;mask-position:center}'
      + '#bt .mmst .ghost{border-radius:0;background-size:contain;background-repeat:no-repeat;background-position:center}'
      + '#bt .mmst .dim{inset:0;border-radius:0;width:auto;height:auto;right:0;bottom:0;background:radial-gradient(ellipse at var(--x) var(--y),transparent 0,rgba(4,6,20,.18) 30%,rgba(4,6,20,.62) 75%)}'
      + '#bt .mmst .feather{width:10px;height:22px;border-radius:50% 50% 50% 50%/70% 70% 30% 30%;background:linear-gradient(#fff3c0,#ff8a2e 60%,#d2381c)}'
      + '#bt .eg2>i{transition-delay:.12s}'
      + '#bt .bui.anim .cap{opacity:.55;transition:opacity .2s}';
    document.head.appendChild(st);
    styled = true;
  }

  function tierFor(k) {
    try { if (window.MMMOVES) { const i = MMMOVES.info(k); if (i) return i.tier; } } catch (e) { /* 下へ */ }
    const SK = G('SK'), sk = SK && SK[k];
    if (!sk) return 'basic';
    const p = Math.round((sk[1] || 0) * 100);
    return p <= 0 ? 'support' : p >= 120 ? 'finisher' : p >= 90 ? 'strong' : 'basic';
  }

  /** 今までの技の絵が当たる時刻と長さ（ms・速さ 1.0） */
  function rawTiming(k, s) {
    if (window.MM25D) { const t = MM25D.timing(k, s); if (t) return t; }   // 2026-10-08：比較試遊の 2.5D のコマ（js/battle/art25d.js）
    if (k >= 20 && k <= 29) { const no = k - 19; return { hit: RP_HIT[no], dur: RP_DUR[no] || 1000 }; }
    const SFR = G('SFR'), F = SFR && SFR[k];
    if (F && Array.isArray(F.f)) {
      const Wn = [[0, 0.24], [0.24, 0.44], [0.44, 0.68], [0.68, 0.86]];
      const hi = F.f.findIndex((q) => q.m === 'contact' || q.m === 'target' || q.m === 'full');
      return { hit: Math.round(1500 * (hi >= 0 ? Wn[hi][0] + 0.03 : 0.47)), dur: 1500 };
    }
    return { hit: 650, dur: 1350 };
  }

  // act() の直後に置かれるタイマー（ダメージの表示 720ms・次のターン 1500／1900ms）を、この1回だけずらす
  let pend = null;
  const nativeST = window.setTimeout;
  function patchedST(fn, ms) {
    const rest = Array.prototype.slice.call(arguments, 2);
    if (pend && performance.now() <= pend.until) {
      if (ms === 720) ms = pend.dmg;
      else if (ms === 1500 || ms === 1900) { ms = Math.max(ms, pend.total); pend = null; restore(); }
    } else if (pend) { pend = null; restore(); }
    return nativeST.apply(window, [fn, ms].concat(rest));
  }
  function restore() { if (window.setTimeout === patchedST) window.setTimeout = nativeST; }
  function retime(dmg, total) { pend = { dmg: Math.round(dmg), total: Math.round(total), until: performance.now() + 80 }; window.setTimeout = patchedST; ST(() => { if (pend) { pend = null; restore(); } }, 120); }

  // 今までの技の絵を速さ rate で再生する（その場で作られたタイマーとアニメーションだけ）
  function playRaw(raw, k, s, rate) {
    if (rate === 1 || !document.getAnimations) { raw(k, s); return; }
    const before = new Set(document.getAnimations());
    const prev = window.setTimeout;
    window.setTimeout = function (fn, ms) { const rest = Array.prototype.slice.call(arguments, 2); return nativeST.apply(window, [fn, Math.round((+ms || 0) / rate)].concat(rest)); };
    try { raw(k, s); } finally { window.setTimeout = prev; }
    document.getAnimations().forEach((a) => { if (!before.has(a)) { try { a.playbackRate = rate; } catch (e) { /* 無視 */ } } });
  }

  function hitStop(ms) {
    if (!ms || !document.getAnimations) return;
    const bt = document.getElementById('bt'); if (!bt) return;
    const list = document.getAnimations().filter((a) => { const t = a.effect && a.effect.target; return t && bt.contains(t) && a.playState === 'running'; });
    list.forEach((a) => { try { a.pause(); } catch (e) { /* 無視 */ } });
    ST(() => list.forEach((a) => { try { if (a.playState === 'paused') a.play(); } catch (e) { /* 無視 */ } }), ms);
  }

  function boxOf(el, br) { const i = el.querySelector('.mon img') || el.querySelector('.mon') || el; const r = i.getBoundingClientRect(); return { x: r.left - br.left + r.width / 2, y: r.top - br.top + r.height / 2, w: r.width, h: r.height, img: i.tagName === 'IMG' ? i : el.querySelector('img') }; }

  function layer(bt) { const L = document.createElement('div'); L.className = 'mmst'; bt.appendChild(L); return L; }
  function dot(L, cls, x, y, w, h, css) { const d = document.createElement('i'); d.className = cls; d.style.width = w + 'px'; d.style.height = h + 'px'; d.style.transform = `translate(${x - w / 2}px,${y - h / 2}px)`; if (css) Object.assign(d.style, css); L.appendChild(d); return d; }
  const anim = (el, kf, o) => (el && el.animate ? el.animate(kf, o) : null);

  /** 被弾の光：相手の絵の形のマスクに白を重ねる（絵の色は変えない） */
  function hitFlash(L, T, delay) {
    const im = T.img; if (!im || !im.src) return;
    const d = dot(L, 'flash', T.x, T.y, T.w, T.h);
    d.style.webkitMaskImage = d.style.maskImage = `url("${im.src}")`;
    d.style.opacity = '0';
    if (im.style && im.style.transform) d.style.transform += ' ' + im.style.transform.replace(/translate[^)]*\)/g, '');
    anim(d, [{ opacity: 0 }, { opacity: 0.85, offset: 0.2 }, { opacity: 0 }], { duration: 220, delay, fill: 'both' });
  }

  function charge(L, A, c, c2, dur, big) {
    const a = dot(L, 'aura', A.x, A.y, A.w * (big ? 1.7 : 1.3), A.w * (big ? 1.7 : 1.3), { '--c': c, '--c2': c2, opacity: 0 });
    anim(a, [{ opacity: 0, transform: a.style.transform + ' scale(.4)' }, { opacity: 0.9, transform: a.style.transform + ' scale(1)', offset: 0.6 }, { opacity: 0.0, transform: a.style.transform + ' scale(1.15)' }], { duration: dur + 160, easing: EASE.out, fill: 'both' });
    const r = dot(L, 'ring', A.x, A.y, A.w * 1.1, A.w * 1.1, { '--c': c, '--c2': c2, opacity: 0 });
    anim(r, [{ opacity: 0, transform: r.style.transform + ' scale(1.5)' }, { opacity: 1, transform: r.style.transform + ' scale(.8)', offset: 0.75 }, { opacity: 0, transform: r.style.transform + ' scale(.45)' }], { duration: dur, easing: EASE.in, fill: 'both' });
    const n = big ? 14 : 8;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2, rr = A.w * (0.9 + (i % 3) * 0.18);
      const p = dot(L, 'dot', A.x + Math.cos(ang) * rr, A.y + Math.sin(ang) * rr, 8, 8, { '--c': c, '--c2': c2, opacity: 0 });
      anim(p, [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0, transform: `translate(${A.x - 4}px,${A.y - 4}px) scale(.4)` }], { duration: dur * 0.85, delay: (i % 4) * dur * 0.04, easing: EASE.in, fill: 'both' });
    }
  }

  // 自分の強化の補助技（今までの技の絵を使わない）
  function supportSelf(kind, L, A, me, c, c2) {
    const mon = me.querySelector('.mon');
    if (kind === 'guard') { // ほしのまもり：星の光で包む → 盾の輪 → 光の粒
      anim(mon, [{ transform: 'none' }, { transform: 'translateY(-6px) scale(1.04)', offset: 0.35 }, { transform: 'translateY(-6px) scale(1.04)', offset: 0.7 }, { transform: 'none' }], { duration: 1050, easing: EASE.io });
      charge(L, A, c, c2, 520, false);
      const sh = dot(L, 'ring', A.x, A.y, A.w * 1.25, A.w * 1.25, { '--c': '#7cc8ff', '--c2': '#fff6c8', opacity: 0, borderWidth: '4px' });
      anim(sh, [{ opacity: 0, transform: sh.style.transform + ' scale(.6)' }, { opacity: 1, transform: sh.style.transform + ' scale(1.05)', offset: 0.4 }, { opacity: 0.8, transform: sh.style.transform + ' scale(1)', offset: 0.75 }, { opacity: 0, transform: sh.style.transform + ' scale(1.2)' }], { duration: 760, delay: 420, fill: 'both', easing: EASE.out });
      for (let i = 0; i < 10; i++) { const ang = (i / 10) * Math.PI * 2; const p = dot(L, 'dot', A.x, A.y, 7, 7, { '--c': '#ffe36a', '--c2': '#fff', opacity: 0 }); anim(p, [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0, transform: `translate(${A.x + Math.cos(ang) * A.w * 0.8}px,${A.y + Math.sin(ang) * A.w * 0.8}px)` }], { duration: 700, delay: 520 + i * 20, fill: 'both', easing: EASE.out }); }
      return 1150;
    }
    if (kind === 'sonic') { // ソニックムーブ：高速で左右に動く → 残像 → 自分の強化
      const im = A.img, f = me.id === 'm1' ? -1 : 1;
      const kf = [{ transform: 'none' }, { transform: `translateX(${-26 * f}px)`, offset: 0.18 }, { transform: `translateX(${30 * f}px)`, offset: 0.38 }, { transform: `translateX(${-18 * f}px)`, offset: 0.58 }, { transform: `translateX(${12 * f}px)`, offset: 0.76 }, { transform: 'none' }];
      anim(mon, kf, { duration: 900, easing: 'linear' });
      if (im && im.src) for (let g = 1; g <= 3; g++) {
        const d = dot(L, 'ghost', A.x, A.y, A.w, A.h, { backgroundImage: `url("${im.src}")`, opacity: 0 });
        if (im.style && im.style.transform) d.style.transform += ' ' + im.style.transform.replace(/translate[^)]*\)/g, '');
        const base = d.style.transform;
        anim(d, kf.map((q) => ({ transform: base + ' ' + (q.transform === 'none' ? '' : q.transform), opacity: 0.38 / g, offset: q.offset })), { duration: 900, delay: g * 55, fill: 'both' });
      }
      ST(() => charge(L, A, c, c2, 300, false), 640);
      return 1050;
    }
    return 0;
  }

  /** anim(k, s) の先頭から呼ぶ。演出を引き受けたら true（raw は後で呼ぶ）。引き受けないときは false（従来どおり） */
  function run(k, s, raw) {
    if (reduced() || window.MM_QA_NO_STAGE || typeof raw !== 'function') return false;
    const bt = document.getElementById('bt'), me = document.getElementById('m' + s), op = document.getElementById('m' + (1 - s));
    if (!bt || !me || !op || !bt.getBoundingClientRect) return false;
    let rawCalled = false;
    const callRaw = (rate) => { if (rawCalled) return; rawCalled = true; try { playRaw(raw, k, s, rate); } catch (e) { try { raw(k, s); } catch (e2) { /* 無視 */ } } };
    try {
      style();
      const tier = tierFor(k), T0 = TIER[tier] || TIER.basic, SK = G('SK'), sk = (SK && SK[k]) || [];
      const c = sk[3] || '#ffd36a', c2 = '#fffbe6';
      const br = bt.getBoundingClientRect(), A = boxOf(me, br), T = boxOf(op, br), f = T.x < A.x ? -1 : 1;
      const L = layer(bt), mon = me.querySelector('.mon'), tmon = op.querySelector('.mon'), bgs = bt.querySelector('.bgs');
      busy++;
      ensureWrap();
      const me2 = cur = {};
      const p25 = !!(window.MM25D && MM25D.handles(k, s)), kind = p25 && (SPECIAL[k] === 'guard' || SPECIAL[k] === 'sonic') ? null : SPECIAL[k];   // 比較試遊の 2.5D：補助技もコマで見せる
      // 1 構え：少し沈んで後ろへ（攻撃側を少し大きく）
      const wind = anim(mon, [{ transform: 'none' }, { transform: `translateX(${-8 * f}px) scale(1.05,.94)`, offset: 0.6 }, { transform: `translateX(${-6 * f}px) scale(1.04,.96)` }], { duration: T0.windup, easing: EASE.out, fill: 'forwards' });
      // 背景を攻撃側へ軽く寄せる
      if (bgs) { bgs.style.transformOrigin = `${(A.x / br.width) * 100}% ${(A.y / br.height) * 100}%`; anim(bgs, [{ transform: 'none' }, { transform: `scale(${T0.zoom})`, offset: 0.35 }, { transform: `scale(${T0.zoom})`, offset: 0.75 }, { transform: 'none' }], { duration: T0.windup + T0.charge + 1300, easing: EASE.io }); }
      // 2 溜め（強技・必殺級）
      if (T0.charge) {
        if (tier === 'finisher') { const d = dot(L, 'dim', 0, 0, 0, 0); d.style.transform = 'none'; d.style.setProperty('--x', A.x + 'px'); d.style.setProperty('--y', A.y + 'px'); d.style.width = '100%'; d.style.height = '100%'; anim(d, [{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: T0.windup + T0.charge + 900, fill: 'both' }); }
        ST(() => charge(L, A, kind === 'holy' ? '#ff8a2e' : c, c2, T0.charge, tier === 'finisher'), T0.windup - 40);
      }
      const pre = T0.windup + T0.charge;
      // 補助技（自分の強化）は専用の演出
      if (kind === 'guard' || kind === 'sonic') {
        const len = kind === 'guard' ? 1150 : 1050;
        ST(() => { if (wind) wind.cancel(); supportSelf(kind, L, A, me, c, c2); }, T0.windup);
        rawCalled = true;
        const total = Math.max(1500, pre + len + T0.hold);
        retime(pre + Math.round(len * 0.62), total);
        ST(() => { L.remove(); busy--; if (cur === me2) cur = null; }, total + 50);
        return true;
      }
      const rt = rawTiming(k, s), rate = T0.rate, hit = rt.hit != null ? pre + rt.hit / rate : null, dur = pre + rt.dur / rate;
      // 3 攻撃動作：構えを戻してから今までの技の絵
      ST(() => { if (wind) wind.cancel(); anim(mon, [{ transform: `translateX(${-6 * f}px) scale(1.04,.96)` }, { transform: 'none' }], { duration: 90, fill: 'none' }); callRaw(rate); if (kind === 'storm') storm(L, T, dur - pre); }, pre);
      if (hit != null) {
        // 4 ヒットストップ → 5 被弾リアクション
        ST(() => {
          const r = me2.r;
          if (r && !r.hit) { anim(tmon, [{ transform: 'none' }, { transform: `translate(${16 * f}px,-10px)`, offset: 0.35 }, { transform: 'none' }], { duration: 380, easing: EASE.out }); return; } // 外れ＝かわす
          if (tier === 'support' || (r && !(r.damage > 0))) return;
          const crt = !!(r && r.critical), hs = T0.hs + (crt ? 50 : 0);
          hitStop(hs);
          hitFlash(L, T, 0);
          anim(tmon, [{ transform: 'none' }, { transform: `translateX(${T0.knock * f}px) rotate(${4 * f}deg)`, offset: 0.25 }, { transform: `translateX(${T0.knock * 0.4 * f}px)`, offset: 0.6 }, { transform: 'none' }], { duration: 420 + hs, delay: hs, easing: EASE.out });
          if (T0.shake) { const a = T0.shake * (crt ? 1.4 : 1), sx = [a, -a * 0.7, a * 0.45, -a * 0.2, 0]; anim(bt.querySelector('.hpr'), sx.map((x) => ({ transform: `translate(${x}px,${-x * 0.3}px)` })), { duration: 300, delay: hs }); if (bgs) anim(bgs, sx.map((x) => ({ translate: `${x * 1.2}px ${x * 0.5}px` })), { duration: 320, delay: hs, composite: 'add' }); }
          if (kind === 'holy') ST(() => blessing(L, A), T0.hs + 380);
        }, hit + 16);
      }
      // 6 ダメージ表示（当たったあと少し遅れて）・7 余韻 → 8 ルーレットへ
      const dmgAt = hit != null ? hit + T0.hs + 70 : pre + Math.round((rt.dur / rate) * 0.55);
      const total = Math.max(1500, Math.round(dur + T0.hold + (kind === 'holy' ? 260 : 0)));
      retime(dmgAt, total);
      ST(() => { L.remove(); busy--; if (cur === me2) cur = null; }, total + 50);
      return true;
    } catch (e) {
      busy = Math.max(0, busy - 1);
      if (!rawCalled) callRaw(1);
      return true;
    }
  }

  // 聖なる炎：攻撃のあと自分に加護（金と炎の光）が残る
  function blessing(L, A) {
    const a = dot(L, 'aura', A.x, A.y, A.w * 1.5, A.w * 1.5, { '--c': 'rgba(255,170,60,.75)', '--c2': '#fff3c0', opacity: 0 });
    anim(a, [{ opacity: 0, transform: a.style.transform + ' scale(.6)' }, { opacity: 0.85, transform: a.style.transform + ' scale(1)', offset: 0.35 }, { opacity: 0.55, offset: 0.7 }, { opacity: 0, transform: a.style.transform + ' scale(1.1)' }], { duration: 900, fill: 'both', easing: EASE.out });
    for (let i = 0; i < 8; i++) { const x = A.x + (i - 3.5) * A.w * 0.12; const p = dot(L, 'dot', x, A.y + A.h * 0.35, 7, 7, { '--c': '#ff9a3c', '--c2': '#fff6c8', opacity: 0 }); anim(p, [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0, transform: `translate(${x - 3}px,${A.y - A.h * 0.55}px)` }], { duration: 800, delay: i * 45, fill: 'both', easing: EASE.out }); }
  }
  // フェザーストーム：燃える羽根が相手の周りを渦巻く
  function storm(L, T, len) {
    for (let i = 0; i < 16; i++) {
      const p = dot(L, 'feather', T.x, T.y, 10, 22, { opacity: 0 }); const r0 = T.w * (0.75 + (i % 4) * 0.1), a0 = (i / 16) * Math.PI * 2;
      const kf = []; for (let j = 0; j <= 6; j++) { const a = a0 + j * 0.9, r = r0 * (1 - j * 0.1); kf.push({ transform: `translate(${T.x - 5 + Math.cos(a) * r}px,${T.y - 11 + Math.sin(a) * r * 0.6}px) rotate(${a * 57}deg)`, opacity: j === 0 || j === 6 ? 0 : 1 }); }
      anim(p, kf, { duration: Math.max(600, len * 0.75), delay: len * 0.12 + i * 18, fill: 'both', easing: 'linear' });
    }
  }

  window.MMSTAGE = Object.freeze({ run, tierFor, rawTiming, TIER, SPECIAL, get busy() { return busy; } });
})();
