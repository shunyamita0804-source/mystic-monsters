// =========================================================
// 2026-10-16：ソラモ SK08「スターダストレイ」の青い専用光線の試作 `MMSK08B`（作業ブランチだけ・ユーザー承認前＝正式採用ではない）
//  ユーザーの追加決定「スターダストレイは青色光線」。ソラモビーム（SK05）の黄色い光線の絵（05_03）の使い回しをやめる候補。
//  新しい画像は作らない（画像 AI に頼まない）＝CSS のグラデーション・形だけで描く。URL に ?sk08=blue のときだけ（js/battle/move-tune-1015.js が切り替える）
//  ソラモビームとの違い：
//   溜め＝口先に青い光の輪が縮んで集まる＋星の粒が吸い込まれる（SK05 は溜めの光の玉）
//   光線＝深い青の外側の光・水色の中・白い芯の3層＋星（4つの角の光）が口から相手へ流れ続ける・太さがゆっくり脈打つ・先に星の花が開く
//   余韻＝光線が細くなって消え、星屑（小さな粒）が光線の線の上に残ってゆっくり散る
//  位置：art25d の口先（MMTUNE.MOUTH）を区切りごとに使う（反転・回転・体格サイズは art25d の mouthPt が計算済み）
//  変えないもの：技の性能・判定・ダメージ・SE・fight()・Phase 6・ほかの技
// =========================================================
(function (root) {
  'use strict';
  const C = Object.freeze({ deep: '#1d3fe0', blue: '#3a7bff', cyan: '#62e3ff', white: '#ffffff' });
  let styled = false;
  function style() {
    if (styled || !root.document) return; styled = true;
    const st = document.createElement('style'); st.id = 'mmsk08b-style';
    st.textContent = [
      '#bt .sk08b{position:absolute;left:0;top:0;pointer-events:none;will-change:transform,opacity}',
      `#bt .sk08b.beam{border-radius:999px;background:linear-gradient(to bottom,transparent 0,rgba(29,63,224,.0) 4%,rgba(29,63,224,.55) 18%,rgba(58,123,255,.85) 32%,${C.cyan} 43%,#fff 50%,${C.cyan} 57%,rgba(58,123,255,.85) 68%,rgba(29,63,224,.55) 82%,transparent 96%);`
        + '-webkit-mask-image:linear-gradient(90deg,#000 0,#000 86%,transparent 100%);mask-image:linear-gradient(90deg,#000 0,#000 86%,transparent 100%);filter:drop-shadow(0 0 6px rgba(70,140,255,.9)) drop-shadow(0 0 14px rgba(40,90,255,.6))}',
      `#bt .sk08b.star{clip-path:polygon(50% 0,58% 42%,100% 50%,58% 58%,50% 100%,42% 58%,0 50%,42% 42%);background:radial-gradient(circle,#fff 0 30%,${C.cyan} 60%,${C.blue})}`,
      `#bt .sk08b.ring{border-radius:50%;border:2px solid ${C.cyan};box-shadow:0 0 10px ${C.blue},inset 0 0 8px ${C.cyan}}`,
      `#bt .sk08b.orb{border-radius:50%;background:radial-gradient(circle,#fff 0 18%,${C.cyan} 38%,rgba(58,123,255,.75) 58%,transparent 72%);mix-blend-mode:screen}`,
      `#bt .sk08b.dust{border-radius:50%;background:radial-gradient(circle,#fff 0 25%,${C.cyan} 55%,transparent 72%)}`,
    ].join('\n');
    document.head.appendChild(st);
  }
  /** 窓 [a,b]（ms）の間だけ見せるキーフレーム（その外は透明）。frames＝窓の中の [割合 0〜1, 変形, 不透明度] */
  function win(D, a, b, frames) {
    const e = 0.0005, o = (t) => Math.max(0, Math.min(1, t / D)), A = o(a), B = o(b);
    const k = [{ offset: 0, opacity: 0, transform: frames[0][1] }];
    if (A > e) k.push({ offset: A - e, opacity: 0, transform: frames[0][1] });
    frames.forEach(([p, tf, op]) => k.push({ offset: Math.max(A, Math.min(B, A + (B - A) * p)), opacity: op, transform: tf }));
    if (B < 1 - e) k.push({ offset: Math.min(1, B + e), opacity: 0, transform: frames[frames.length - 1][1] });
    k.push({ offset: 1, opacity: 0, transform: frames[frames.length - 1][1] });
    for (let i = 1; i < k.length; i++) if (k[i].offset < k[i - 1].offset) k[i].offset = k[i - 1].offset;
    return k;
  }
  function el(v, cls, w, h, z) { const d = document.createElement('i'); d.className = 'p25f sk08b ' + cls; d.style.width = w + 'px'; d.style.height = h + 'px'; d.style.zIndex = z || 8; v.appendChild(d); return d; }
  /** 溜め：口先 m に青い輪が縮み、星の粒が吸い込まれ、光の玉が育つ */
  function charge(v, o) {
    style();
    const { m, R, D, w0, w1 } = o, out = [];
    for (let i = 0; i < 2; i++) {
      const r = el(v, 'ring', R * 2, R * 2); out.push(r);
      const T = (s) => `translate(${m.x - R}px,${m.y - R}px) scale(${s})`;
      const a = w0 + (w1 - w0) * i * 0.35;
      r.animate(win(D, a, w1, [[0, T(1.25), 0], [0.2, T(1.05), 0.9], [1, T(0.12), 0.2]]), { duration: D, fill: 'both' });
    }
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 + 0.4, s = R * 0.22, d = R * (1.1 + (i % 3) * 0.18), p = el(v, 'star', s, s); out.push(p);
      const T = (x, y, sc, rot) => `translate(${x - s / 2}px,${y - s / 2}px) rotate(${rot}deg) scale(${sc})`;
      const a = w0 + (w1 - w0) * (i % 4) * 0.12;
      p.animate(win(D, a, w1, [[0, T(m.x + Math.cos(ang) * d, m.y + Math.sin(ang) * d, 0.6, 0), 0], [0.25, T(m.x + Math.cos(ang) * d * 0.8, m.y + Math.sin(ang) * d * 0.8, 1, 30), 1], [1, T(m.x, m.y, 0.3, 120), 0.6]]), { duration: D, fill: 'both' });
    }
    const ob = el(v, 'orb', R * 1.4, R * 1.4); out.push(ob);
    const T = (s) => `translate(${m.x - R * 0.7}px,${m.y - R * 0.7}px) scale(${s})`;
    ob.animate(win(D, w0, w1 + 60, [[0, T(0.15), 0], [0.4, T(0.5), 0.8], [1, T(1), 1]]), { duration: D, fill: 'both' });
    ob.dataset.mx = Math.round(m.x); ob.dataset.my = Math.round(m.y); ob.dataset.cut = 'SDR_BLUE_charge';
    return out;
  }
  /**
   * 光線：口先 m0（区切りの始め）→ m1（終わり）から相手の点 t まで。seg＞0＝前の区切りの続き（最初から伸びきっている）。
   *  after＝[a,b]（余韻の窓。最後の区切りだけ）
   */
  function beam(v, o) {
    style();
    const { m0, m1, t, H, D, w0, w1, seg, after, f } = o, out = [];
    const pose = (m) => { const len = Math.hypot(t.x - m.x, t.y - m.y), ang = Math.atan2(t.y - m.y, t.x - m.x) * 180 / Math.PI; return { len, tf: (sx, sy) => `translate(${m.x}px,${m.y - H / 2}px) rotate(${ang}deg) scale(${sx},${sy})` }; };
    const P0 = pose(m0), P1 = pose(m1), L = Math.max(P0.len, P1.len) * 1.06;
    const b = el(v, 'beam', L, H, 8); out.push(b);
    b.style.transformOrigin = `0 50%`; b.dataset.mx = Math.round(m0.x); b.dataset.my = Math.round(m0.y); b.dataset.cut = 'SDR_BLUE_beam';
    const sx = (P) => P.len * 1.06 / L;
    b.animate(win(D, w0, w1, [[0, P0.tf(seg ? sx(P0) : 0.05, 0.6), 1], [0.18, P0.tf(sx(P0), 1.15), 1], [0.5, P0.tf(sx(P0), 0.9), 1], [1, P1.tf(sx(P1), 1.05), 1]]), { duration: D, fill: 'both' });
    // 星が口から相手へ流れ続ける（区切りの間に3つずつ）
    for (let i = 0; i < 4; i++) {
      const s = H * 0.9, p = el(v, 'star', s, s, 9); out.push(p);
      const a = w0 + (w1 - w0) * (0.1 + i * 0.2), dur = Math.max(140, (w1 - w0) * 0.45);
      const T = (m, k, rot) => `translate(${m.x + (t.x - m.x) * k - s / 2}px,${m.y + (t.y - m.y) * k - s / 2}px) rotate(${rot}deg)`;
      p.animate(win(D, a, Math.min(w1, a + dur), [[0, T(m0, 0.05, 0), 1], [1, T(m1, 0.95, 160), 0.9]]), { duration: D, fill: 'both' });
    }
    // 先の星の花（相手の点で開く）
    const fs = H * 2.6, fl = el(v, 'star', fs, fs, 9); out.push(fl);
    const FT = (sc, rot) => `translate(${t.x - fs / 2}px,${t.y - fs / 2}px) rotate(${rot}deg) scale(${sc})`;
    fl.animate(win(D, w0 + (w1 - w0) * 0.15, w1, [[0, FT(0.2, 0), 0.4], [0.3, FT(1.1, 25), 1], [1, FT(0.9, 70), 0.9]]), { duration: D, fill: 'both' });
    // 口の光（根元）
    const mo = el(v, 'orb', H * 2.2, H * 2.2, 9); out.push(mo);
    const MT = (m, sc) => `translate(${m.x - H * 1.1}px,${m.y - H * 1.1}px) scale(${sc})`;
    mo.animate(win(D, w0, w1, [[0, MT(m0, seg ? 1 : 0.5), 1], [1, MT(m1, 1), 1]]), { duration: D, fill: 'both' });
    if (after) {
      // 余韻：光線が細くなって消える・星屑が線の上に残って散る
      const a0 = after[0], a1 = after[1];
      const b2 = el(v, 'beam', L, H, 8); out.push(b2); b2.style.transformOrigin = '0 50%'; b2.dataset.cut = 'SDR_BLUE_after';
      b2.animate(win(D, a0, a1, [[0, P1.tf(sx(P1), 0.9), 0.9], [0.45, P1.tf(sx(P1), 0.18), 0.6], [1, P1.tf(sx(P1), 0.04), 0]]), { duration: D, fill: 'both' });
      for (let i = 0; i < 12; i++) {
        const k = (i + 0.5) / 12, s = H * (0.25 + (i % 3) * 0.12), p = el(v, 'dust', s, s, 9); out.push(p);
        const x = m1.x + (t.x - m1.x) * k, y = m1.y + (t.y - m1.y) * k, dy = (i % 2 ? -1 : 1) * H * (0.6 + (i % 4) * 0.25), dx = f * H * 0.4;
        const T = (X, Y, sc) => `translate(${X - s / 2}px,${Y - s / 2}px) scale(${sc})`;
        p.animate(win(D, a0 + (a1 - a0) * (i % 4) * 0.08, a1, [[0, T(x, y, 0.6), 1], [1, T(x + dx, y + dy, 0.2), 0]]), { duration: D, fill: 'both' });
      }
    }
    return out;
  }
  const qs = (() => { try { return new URLSearchParams(root.location ? root.location.search : ''); } catch (e) { return null; } })();
  root.MMSK08B = Object.freeze({ on: !!(qs && qs.get('sk08') === 'blue'), C, charge, beam });
})(typeof window !== 'undefined' ? window : globalThis);
