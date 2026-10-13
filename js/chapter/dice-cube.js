// =========================================================
// 立体サイコロ（2026-10-12 開発23 B）`MMDICE3D`
//  **正式採用（2026-10-12 ユーザー決定）＝Chapter 1 の世界のボード（js/chapter/world-board.js の playDie）**：tempo 'long'（1.30秒で止まる・トンッ、ト、トン）・
//   SE は出来事 'dice.cube'（opts.throwEvent）→ DICE_CUBE（assets/audio/se/dice_1012/dice_magic_b4_long_tap.ogg）。Chapter 2 以降・旧ボード・特訓は従来の MMCHD のまま。
//  比較デモ prototype/dice_1012/index.html も同じファイルを使う（既定の throwEvent 'dice.throw'）。
//
//  見せ方（約1.0秒で出目が決まる＋0.6秒見せる。opts.tempo:'long' は約1.3秒で決まる比較版）：START の位置から軽く浮く → 前へ弧を描きながら大きく（×1.35）→ X・Y 軸で回って面が次々に見える
//   → 落ちて小さく弾む → 最後の約0.25秒で出目の面へ減速して止まる → 止まった瞬間に光と粒（dice.stop）→ 出目の札 → 消える。
//  描き方：CSS 3D の立方体（6面＝HTML の目。画像を使わない・新しい依存なし）。動きは Web Animations だけ（iOS の Safari では合成スレッドで進む）。
//  出目：play に渡した値（1〜6）の面が必ず正面に来る（回る量だけ決めて、止まる向きは値から決める＝再抽選なし・止まったあとは何も変えない）。
//  2個（ダブルダイス）：play([a, b]) で2個を同時に（少しずらして）投げる。長さは1個と同じ。札は「a + b = 合計」。
//  視差を減らす設定：回さない（出目の面のまま現れて光る・約0.8秒）。
//  2026-10-13 開発25 E：opts.skin 'official'＝正式サイコロ（Phase 12 の assets/fields/ch1a/dice/dice_stop_1〜6・dice_blank）の絵の6面
//   （assets/fields/ch1a/dice/cube_1013/face_1〜6.webp＝tools/dice1013/faces.py の派生。真珠の地・四隅の金の飾り・橙に光る目・1は金の紋章）。本編の Chapter 1 だけ。
//   既定（skin なし）は従来の青い立方体（比較デモ）。動き・時間・出目・SE の出し方は変えない
// =========================================================
(function (root) {
  'use strict';
  const T = { lift: 140, air: 640, land: 820, lock: 930, hold: 620, fade: 180, calmLock: 260, calmHold: 520 };
  // 2026-10-12 比較：回る時間を長くした版（tempo:'long'）。投げ始め（lift）・着地から止まるまで（land→lock 0.11秒）・光・札・消えるまでは同じ。
  // 空中で回る時間だけ +0.37秒（air・land・lock）・回る量も1周ずつ多く（空中の回る速さは同じくらい＝面が次々に見える）
  const TEMPO = Object.freeze({ short: Object.freeze({ ...T, peak: 397, turns: 2, airShare: 0.55 }), long: Object.freeze({ ...T, air: 1010, land: 1190, lock: 1300, peak: 560, turns: 3, airShare: 0.6,
    // 2026-10-12 第4便：着地を「トンッ、ト、トン」に（参考動画）。止まる時刻の 0.40秒前に強く着地（大きく弾む・1面ぶん転がる）→ 0.16秒前に小さく着地 → 止まる時刻にトンと止まる
    bounce: Object.freeze({ i1: 400, i2: 160, h1: 0.42, h2: 0.13, tumble: 90, dx1: 0.10, dx2: 0.03 }) }) });
  const BASE = { 1: [0, 0], 6: [0, 180], 3: [0, -90], 4: [0, 90], 5: [-90, 0], 2: [90, 0] };   // 正面に出す向き [rotateX, rotateY]（向かい合う面の和は 7）
  const PIPS = { 1: [5], 2: [3, 7], 3: [3, 5, 7], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] };   // 3×3 の升目の番号（1〜9）
  const FACE = [[1, 'translateZ(var(--h))'], [6, 'rotateY(180deg) translateZ(var(--h))'], [3, 'rotateY(90deg) translateZ(var(--h))'], [4, 'rotateY(-90deg) translateZ(var(--h))'], [5, 'rotateX(90deg) translateZ(var(--h))'], [2, 'rotateX(-90deg) translateZ(var(--h))']];
  let locked = false, last = null;
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const feel = (n, d) => { try { if (root.MMFEEL) root.MMFEEL.emit(n, d); } catch (e) { /* 音は飾り */ } };
  const calmNow = () => !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);

  function style() {
    if (document.getElementById('mmdice3d-style')) return;
    const s = document.createElement('style'); s.id = 'mmdice3d-style';
    s.textContent = [
      '.d3z{position:absolute;inset:0;z-index:30;pointer-events:none;overflow:hidden}',
      '.d3-mv{position:absolute;left:0;top:0;width:0;height:0;will-change:transform}',
      '.d3-sc{position:absolute;left:0;top:0;will-change:transform}',
      '.d3-pv{position:absolute;left:calc(var(--s)/-2);top:calc(var(--s)/-2);width:var(--s);height:var(--s);perspective:calc(var(--s)*6)}',
      '.d3-tilt{position:absolute;inset:0;transform-style:preserve-3d;transform:rotateX(-17deg) rotateY(21deg)}',
      '.d3-cube{position:absolute;inset:0;transform-style:preserve-3d;will-change:transform;--h:calc(var(--s)/2)}',
      // 面：深い青のガラスのような地・白い目・縁の光（参考動画の「青い立体のサイコロ」の雰囲気。絵は写していない）
      '.d3-f{position:absolute;inset:0;border-radius:18%;backface-visibility:hidden;-webkit-backface-visibility:hidden;display:grid;grid-template:repeat(3,1fr)/repeat(3,1fr);padding:15%;box-sizing:border-box;',
      ' background:radial-gradient(circle at 30% 24%,rgba(255,255,255,.55),rgba(255,255,255,0) 42%),linear-gradient(150deg,#5a86ff 0%,#2a4fd6 46%,#1a2f97 100%);',
      ' box-shadow:inset 0 0 0 2px rgba(210,228,255,.75),inset 0 0 calc(var(--s)*.18) rgba(8,20,80,.6)}',
      '.d3-f i{width:76%;height:76%;margin:auto;border-radius:50%;background:radial-gradient(circle at 38% 34%,#fff 0 45%,#dfe9ff 70%,#b9cbff 100%);box-shadow:0 0 calc(var(--s)*.05) rgba(255,255,255,.85),inset 0 -1px 2px rgba(40,70,170,.5)}',
      '.d3-f[data-v="1"] i{width:96%;height:96%}',
      '.d3-sh{position:absolute;left:0;top:0;width:calc(var(--s)*.9);height:calc(var(--s)*.2);margin:calc(var(--s)*.42) 0 0 calc(var(--s)*-.45);border-radius:50%;background:radial-gradient(rgba(0,0,30,.5),rgba(0,0,30,0) 70%);opacity:0}',
      '.d3-glow{position:absolute;left:calc(var(--s)*-1.1);top:calc(var(--s)*-1.1);width:calc(var(--s)*2.2);height:calc(var(--s)*2.2);border-radius:50%;background:radial-gradient(rgba(235,245,255,.95),rgba(140,180,255,.55) 32%,rgba(90,130,255,0) 66%);opacity:0;mix-blend-mode:screen}',
      '.d3-sp{position:absolute;left:0;top:0;width:calc(var(--s)*.3);height:calc(var(--s)*.3);margin:calc(var(--s)*-.15) 0 0 calc(var(--s)*-.15);opacity:0;',
      ' background:conic-gradient(from 0deg,transparent 0 40deg,#fff 45deg,transparent 50deg 130deg,#fff 135deg,transparent 140deg 220deg,#fff 225deg,transparent 230deg 310deg,#fff 315deg,transparent 320deg);',
      ' -webkit-mask:radial-gradient(circle,#000 0 18%,rgba(0,0,0,.6) 30%,transparent 62%);mask:radial-gradient(circle,#000 0 18%,rgba(0,0,0,.6) 30%,transparent 62%);filter:drop-shadow(0 0 4px #9cc3ff)}',
      '.d3-res{position:absolute;transform:translate(-50%,0);font:900 22px/1 "Noto Sans JP",sans-serif;color:#fff6d8;padding:6px 14px 7px;border-radius:999px;background:linear-gradient(#22357d,#0f1c4d);border:2px solid #e0b861;box-shadow:0 4px 12px rgba(0,0,0,.45);opacity:0;white-space:nowrap}',
      '.d3-res b{font-size:28px;color:#ffe08a}',
      // 2026-10-13 開発25 E：正式サイコロの面（絵＝6面とも同じ縁と地。目は絵の中）。縁の丸み・光は絵に合わせて控えめ
      '.d3z.off .d3-f{border-radius:9%;padding:0;background:var(--fi) center/100% 100% no-repeat;box-shadow:inset 0 0 0 1px rgba(255,236,190,.55),inset 0 0 calc(var(--s)*.12) rgba(120,80,20,.28)}',
      '.d3z.off .d3-f i{display:none}',
      '.d3z.off .d3-glow{background:radial-gradient(rgba(255,250,232,.95),rgba(255,214,130,.55) 32%,rgba(255,190,90,0) 66%)}',
      '.d3z.off .d3-sp{filter:drop-shadow(0 0 4px #ffd27a)}',
    ].join('');
    document.head.appendChild(s);
  }
  const SKIN = Object.freeze({ official: './assets/fields/ch1a/dice/cube_1013/face_' });
  function cubeHtml(skin) {
    const base = SKIN[skin];
    return FACE.map(([v, tf]) => `<div class="d3-f" data-v="${v}" style="transform:${tf}${base ? `;--fi:url(${base}${v}.webp)` : ''}">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((c) => (PIPS[v].includes(c) ? `<i style="grid-area:${Math.ceil(c / 3)}/${((c - 1) % 3) + 1}"></i>` : '')).join('')}</div>`).join('');
  }
  /**
   * 着地を「トンッ、ト、トン」にする動き（TEMPO.long.bounce）。止まる時刻 L・出目の向き（fx・fy）は同じ＝出目は変わらない。
   *  投げ上げ → 弧 → I1（L−0.40秒）で強く着地（つぶれる・1面ぶん手前の向き）→ 大きく弾みながら1面転がる → I2（L−0.16秒）で小さく着地 → ごく小さく弾む → L でトンと止まる（光・札は従来どおり L）
   */
  function bounceDie(o, k) {
    const { A, at, cube, el, sc, sh, bx, by, fx, fy, L, P } = k, B = P.bounce, s = o.size, d = o.dir < 0 ? -1 : 1;
    const I1 = L - B.i1, I2 = L - B.i2, m1 = (I1 + I2) / 2, m2 = (I2 + L) / 2, pk = P.peak * o.sp;
    const dx1 = d * s * B.dx1, dx2 = d * s * B.dx2, x0 = o.land.x - dx1 - dx2, y = o.land.y, tx = d * B.tumble;
    // 弾む高さ：上の帯（HUD）にかからない範囲まで（着地点の上の余白が狭い画面では低く）。2回目は1回目の約3分の1
    const h1 = Math.max(s * 0.06, Math.min(s * B.h1, y - o.top - s * 1.1)), h2 = Math.min(s * B.h2, h1 * 0.34);
    const peak = { x: (o.from.x + x0) / 2 + d * 18 + (o.spread || 0), y: Math.max(o.top + s * 0.75, Math.min(o.from.y, y) - s * 0.95) };
    // 向き：空中で回る → I1 で「出目の1面手前」→ 大きな弾みの間に1面転がる → I2 でほぼ出目（12°だけ残す）→ L で出目
    A(cube, [
      { transform: `rotateX(${bx - 40}deg) rotateY(${by + 30}deg)`, offset: 0, easing: 'cubic-bezier(.25,.1,.25,1)' },
      { transform: `rotateX(${(fx - tx) * 0.5}deg) rotateY(${fy * 0.45}deg)`, offset: at(pk), easing: 'cubic-bezier(.3,.2,.55,1)' },
      { transform: `rotateX(${fx - tx}deg) rotateY(${fy}deg)`, offset: at(I1), easing: 'cubic-bezier(.25,.6,.4,1)' },
      { transform: `rotateX(${fx - tx * 0.13}deg) rotateY(${fy}deg)`, offset: at(I2), easing: 'cubic-bezier(.25,.6,.4,1)' },
      { transform: `rotateX(${fx}deg) rotateY(${fy}deg)`, offset: at(L) },
      { transform: `rotateX(${fx}deg) rotateY(${fy}deg)`, offset: 1 },
    ]);
    // 位置：START から浮く → 弧 → 落ちて I1（トンッ）→ 大きく弾む → I2（ト）→ 小さく弾む → L（トン）
    const up = 'cubic-bezier(.2,.7,.4,1)', down = 'cubic-bezier(.6,0,.9,.45)';
    A(el, [
      { transform: `translate(${o.from.x}px,${o.from.y}px)`, offset: 0 },
      { transform: `translate(${o.from.x}px,${o.from.y - s * 0.35}px)`, offset: at(P.lift), easing: 'cubic-bezier(.2,.7,.3,1)' },
      { transform: `translate(${peak.x}px,${peak.y}px)`, offset: at(pk), easing: 'cubic-bezier(.5,0,.95,.6)' },
      { transform: `translate(${x0}px,${y}px)`, offset: at(I1), easing: up },
      { transform: `translate(${x0 + dx1 / 2}px,${y - h1}px)`, offset: at(m1), easing: down },
      { transform: `translate(${x0 + dx1}px,${y}px)`, offset: at(I2), easing: up },
      { transform: `translate(${x0 + dx1 + dx2 / 2}px,${y - h2}px)`, offset: at(m2), easing: down },
      { transform: `translate(${o.land.x}px,${y}px)`, offset: at(L) },
      { transform: `translate(${o.land.x}px,${y}px)`, offset: 1 },
    ]);
    // 大きさ：前へ出て大きく → 着地のたびにつぶれる（強・中・弱）→ 1
    A(sc, [
      { opacity: 0, transform: 'scale(.42)', offset: 0 },
      { opacity: 1, transform: 'scale(.62)', offset: at(P.lift) },
      { opacity: 1, transform: 'scale(1.35)', offset: at(pk) },
      { opacity: 1, transform: 'scale(1.06)', offset: at(I1 - 30) },
      { opacity: 1, transform: 'scale(1.15,.85)', offset: at(I1 + 20) },
      { opacity: 1, transform: 'scale(1.03)', offset: at(m1) },
      { opacity: 1, transform: 'scale(1.08,.92)', offset: at(I2 + 15) },
      { opacity: 1, transform: 'scale(1)', offset: at(m2) },
      { opacity: 1, transform: 'scale(1.05,.95)', offset: at(L + 10) },
      { opacity: 1, transform: 'scale(1)', offset: at(L + 90) },
      { opacity: 1, transform: 'scale(1)', offset: 1 },
    ]);
    // 影：着地で濃く・弾むと薄く小さく
    const S = (op, x, sc2, t) => ({ opacity: op, transform: `translate(${x}px,${y}px) scale(${sc2})`, offset: at(t) });
    A(sh, [{ opacity: 0, transform: `translate(${x0}px,${y}px) scale(.4)`, offset: 0 }, S(0.15, x0, 0.6, pk), S(0.72, x0, 1, I1), S(0.42, x0 + dx1 / 2, 0.8, m1), S(0.7, x0 + dx1, 1, I2), S(0.58, x0 + dx1 + dx2 / 2, 0.93, m2), S(0.7, o.land.x, 1, L), { opacity: 0.6, transform: `translate(${o.land.x}px,${y}px) scale(1)`, offset: 1 }]);
    o.impacts = [I1, I2, L];
  }
  /** 1個分の動き（Web Animations）を作る。止まる向き＝出目の面 */
  function die(ov, o) {
    const el = document.createElement('div'); el.className = 'd3-mv'; el.dataset.v = String(o.v);
    const sh = document.createElement('div'); sh.className = 'd3-sh'; sh.style.setProperty('--s', `${o.size}px`); ov.appendChild(sh);   // 影は地面（着地点）に置く＝サイコロの動きとは別
    el.innerHTML = `<div class="d3-sc" style="--s:${o.size}px"><i class="d3-glow"></i><div class="d3-pv"><div class="d3-tilt"><div class="d3-cube">${cubeHtml(o.skin)}</div></div></div></div>`;
    ov.appendChild(el);
    const sc = el.querySelector('.d3-sc'), cube = el.querySelector('.d3-cube'), glow = el.querySelector('.d3-glow');
    const [bx, by] = BASE[o.v], D = o.D, L = o.lock, at = (ms) => Math.min(1, ms / D), P = o.P || TEMPO.short;
    const anims = [];
    // ease は区切りごとの緩急（keyframe の easing）。アニメーション全体の easing にすると時間軸そのものが歪む（止まる時刻・光の時刻がずれる）ので使わない
    const A = (target, kf, ease) => { if (ease) kf.forEach((k) => { if (!k.easing) k.easing = ease; }); const a = target.animate(kf, { duration: D, fill: 'forwards' }); anims.push(a); return a; };
    // 2026-10-13 開発27（14）：回っている間は斜め（.d3-tilt の -17°／21°）、止まる約0.4秒前から真正面（横の傾き 0・前へ 6°）へ戻して止める＝出目の数字がまっすぐ読める。出目・止まる時刻は変えない
    const tilt = el.querySelector('.d3-tilt'), FRONT = 'rotateX(-6deg) rotateY(0deg)';
    if (o.calm) tilt.style.transform = FRONT;
    else A(tilt, [{ transform: 'rotateX(-17deg) rotateY(21deg)', offset: 0 }, { transform: 'rotateX(-17deg) rotateY(21deg)', offset: at(Math.max(0, L - 420)), easing: 'cubic-bezier(.3,.6,.35,1)' }, { transform: FRONT, offset: at(L) }, { transform: FRONT, offset: 1 }]);
    if (o.calm) {
      el.style.transform = `translate(${o.land.x}px,${o.land.y}px)`;
      cube.style.transform = `rotateX(${bx}deg) rotateY(${by}deg)`;
      A(sc, [{ opacity: 0, transform: 'scale(.9)', offset: 0 }, { opacity: 1, transform: 'scale(1)', offset: at(L) }, { opacity: 1, transform: 'scale(1)', offset: 1 }]);
    } else {
      // 回る量：X・Y を何周か（ばらつきは周回の数だけ）→ 最後は出目の向き。止まる直前の約0.25秒で強く減速
      const nx = o.dir * (P.turns + (o.k % 2)), ny = -o.dir * (P.turns + ((o.k + 1) % 2)), fx = bx + 360 * nx, fy = by + 360 * ny;
      if (P.bounce) bounceDie(o, { A, at, cube, el, sc, sh, bx, by, fx, fy, L, P }); else {
      A(cube, [
        { transform: `rotateX(${bx - 40}deg) rotateY(${by + 30}deg)`, offset: 0 },
        { transform: `rotateX(${fx * P.airShare}deg) rotateY(${fy * (P.airShare - 0.05)}deg)`, offset: at(P.air * o.sp) },
        { transform: `rotateX(${fx * 0.93 + bx * 0.07}deg) rotateY(${fy * 0.92 + by * 0.08}deg)`, offset: at(P.land * o.sp) },
        { transform: `rotateX(${fx}deg) rotateY(${fy}deg)`, offset: at(L) },
        { transform: `rotateX(${fx}deg) rotateY(${fy}deg)`, offset: 1 },
      ], 'cubic-bezier(.25,.1,.25,1)');
      // 位置：START から少し浮く → 弧を描いて前（画面の中ほどの上）へ → 落ちて着地点 → 小さく弾む
      const peak = { x: (o.from.x + o.land.x) / 2 + o.dir * 18 + (o.spread || 0), y: Math.max(o.top + o.size * 0.75, Math.min(o.from.y, o.land.y) - o.size * 0.95) };   // 上の帯（HUD）に隠れない高さまで
      A(el, [
        { transform: `translate(${o.from.x}px,${o.from.y}px)`, offset: 0 },
        { transform: `translate(${o.from.x}px,${o.from.y - o.size * 0.35}px)`, offset: at(P.lift), easing: 'cubic-bezier(.2,.7,.3,1)' },
        { transform: `translate(${peak.x}px,${peak.y}px)`, offset: at(P.peak * o.sp), easing: 'cubic-bezier(.3,0,.7,1)' },
        { transform: `translate(${o.land.x}px,${o.land.y}px)`, offset: at(P.land * o.sp), easing: 'cubic-bezier(.4,0,1,1)' },
        { transform: `translate(${o.land.x}px,${o.land.y - o.size * 0.16}px)`, offset: at(P.land * o.sp + (L - P.land * o.sp) * 0.45), easing: 'cubic-bezier(.2,.8,.4,1)' },
        { transform: `translate(${o.land.x}px,${o.land.y}px)`, offset: at(L) },
        { transform: `translate(${o.land.x}px,${o.land.y}px)`, offset: 1 },
      ]);
      // 大きさ：小さく現れる → 前へ出て大きく（×1.35）→ 着地で少しつぶれる → 1
      A(sc, [
        { opacity: 0, transform: 'scale(.42)', offset: 0 },
        { opacity: 1, transform: 'scale(.62)', offset: at(P.lift) },
        { opacity: 1, transform: 'scale(1.35)', offset: at(P.peak * o.sp) },
        { opacity: 1, transform: 'scale(1.06)', offset: at(P.land * o.sp - 20) },
        { opacity: 1, transform: 'scale(1.1,.9)', offset: at(P.land * o.sp + 30) },
        { opacity: 1, transform: 'scale(1)', offset: at(L) },
        { opacity: 1, transform: 'scale(1)', offset: 1 },
      ]);
      A(sh, [{ opacity: 0, transform: `translate(${o.land.x}px,${o.land.y}px) scale(.4)`, offset: 0 }, { opacity: 0.15, transform: `translate(${o.land.x}px,${o.land.y}px) scale(.6)`, offset: at(P.peak * o.sp) },
        { opacity: 0.7, transform: `translate(${o.land.x}px,${o.land.y}px) scale(1)`, offset: at(P.land * o.sp) }, { opacity: 0.6, transform: `translate(${o.land.x}px,${o.land.y}px) scale(1)`, offset: 1 }]);
      }
    }
    // 止まった瞬間の光（強く光ってすぐ弱く）と粒（8つが外へ）
    A(glow, [{ opacity: 0, transform: 'scale(.5)', offset: 0 }, { opacity: 0, transform: 'scale(.5)', offset: Math.max(0, at(L - 20) - 0.001) }, { opacity: 1, transform: 'scale(1.05)', offset: at(L + 60) }, { opacity: 0.5, transform: 'scale(1.15)', offset: at(L + 380) }, { opacity: 0.4, transform: 'scale(1.15)', offset: 1 }], 'ease-out');
    if (!o.calm) for (let i = 0; i < 10; i++) {
      const p = document.createElement('i'); p.className = 'd3-sp'; sc.appendChild(p);
      const ang = (i / 10) * Math.PI * 2 + o.k, r = o.size * (0.85 + (i % 3) * 0.22), x = Math.cos(ang) * r, y = Math.sin(ang) * r * 0.8, d0 = L + (i % 4) * 25;
      A(p, [{ opacity: 0, transform: 'translate(0,0) scale(.3) rotate(0deg)', offset: 0 }, { opacity: 0, transform: 'translate(0,0) scale(.3) rotate(0deg)', offset: Math.max(0, at(d0) - 0.001) },
        { opacity: 1, transform: `translate(${x * 0.55}px,${y * 0.55}px) scale(1.1) rotate(30deg)`, offset: at(d0 + 140) }, { opacity: 0, transform: `translate(${x}px,${y}px) scale(.5) rotate(70deg)`, offset: at(d0 + 520) }, { opacity: 0, transform: `translate(${x}px,${y}px) scale(.5) rotate(70deg)`, offset: 1 }], 'ease-out');
    }
    return { el, anims };
  }

  /**
   * 投げて止める。values＝出目（1〜6）か [出目, 出目]（2個）。opts＝{ host, from:{x,y}, land:{x,y}, size, top, tempo:'short'|'long', calm, throwEvent, onLock }
   * 戻り値の Promise は消えたあとに解決。出目の面は止まった瞬間（lock）に正面・そのあと何も変えない
   */
  async function play(values, opts = {}) {
    const vs = (Array.isArray(values) ? values : [values]).map(Number);
    if (!vs.length || vs.length > 2 || vs.some((v) => !Number.isInteger(v) || v < 1 || v > 6)) return false;
    if (typeof document === 'undefined' || !document.body) return true;
    style(); locked = true;
    const host = opts.host || document.body, calm = opts.calm != null ? !!opts.calm : calmNow();
    const hw = host.clientWidth || 390, hh = host.clientHeight || 700;
    const size = opts.size || Math.round(Math.max(72, Math.min(104, hw * 0.24))), top = opts.top != null ? opts.top : 90;
    const from = opts.from || { x: hw / 2, y: hh * 0.9 }, land = opts.land || { x: hw / 2, y: hh * 0.5 };
    const P = TEMPO[opts.tempo] || TEMPO.short;
    const two = vs.length === 2, L = calm ? T.calmLock : P.lock + (two ? 60 : 0), D = L + (calm ? T.calmHold : T.hold) + T.fade;
    const skin = SKIN[opts.skin] ? opts.skin : '';
    const ov = document.createElement('div'); ov.className = 'd3z' + (skin ? ' off' : ''); ov.dataset.result = vs.join(','); if (skin) ov.dataset.skin = skin;
    host.appendChild(ov);
    const t0 = now(); last = { start: t0, lock: null, end: null, values: vs.slice() };
    const dice = vs.map((v, i) => die(ov, {
      v, skin, top, k: i + Math.floor(Math.random() * 4), dir: two ? (i ? 1 : -1) : (Math.random() < 0.5 ? -1 : 1), spread: two ? (i ? 1 : -1) * size * 0.5 : 0, size: two ? Math.round(size * 0.86) : size, calm, D, P, lock: L - (two && i === 0 ? 50 : 0), sp: two && i === 0 ? 0.94 : 1,
      from: { x: from.x + (two ? (i ? 16 : -16) : 0), y: from.y }, land: { x: land.x + (two ? (i ? 1 : -1) * size * 0.62 : 0), y: land.y },
    }));
    // 出目の札（止まったあと）
    const res = document.createElement('div'); res.className = 'd3-res'; res.style.left = `${land.x}px`; res.style.top = `${land.y + size * 0.78}px`;
    res.innerHTML = two ? `${vs[0]} + ${vs[1]} = <b>${vs[0] + vs[1]}</b>` : `<b>${vs[0]}</b>`; ov.appendChild(res);
    const ra = res.animate([{ opacity: 0, transform: 'translate(-50%,6px) scale(.8)', offset: 0 }, { opacity: 0, transform: 'translate(-50%,6px) scale(.8)', offset: Math.max(0, (L + 60) / D - 0.001), easing: 'cubic-bezier(.3,1.5,.5,1)' }, { opacity: 1, transform: 'translate(-50%,0) scale(1)', offset: Math.min(1, (L + 220) / D) }, { opacity: 1, transform: 'translate(-50%,0) scale(1)', offset: 1 }], { duration: D, fill: 'forwards' });
    // 全体を最後に薄くする（動きの時間軸と同じ）
    const fa = ov.animate([{ opacity: 1, offset: 0 }, { opacity: 1, offset: (D - T.fade) / D }, { opacity: 0, offset: 1 }], { duration: D, fill: 'forwards' });
    feel(opts.throwEvent || 'dice.throw', { values: vs.slice() });   // 投げ始めに SE を1回（本編は 'dice.cube'＝DICE_CUBE）
    try {
      await wait(L);
      last.lock = now() - t0; ov.dataset.final = vs.join(',');
      feel('dice.stop', { values: vs.slice() });
      if (typeof opts.onLock === 'function') { try { opts.onLock(vs.slice()); } catch (e) { /* 呼び出し側の失敗で止めない */ } }
      await Promise.race([fa.finished.catch(() => {}), wait(D - L + 400)]);
    } finally {
      dice.forEach((d) => d.anims.forEach((a) => { try { a.cancel(); } catch (e) {} }));
      try { ra.cancel(); fa.cancel(); } catch (e) {}
      ov.remove(); locked = false; if (last) last.end = now() - t0;
    }
    return true;
  }
    /** 正式サイコロの6面を先に読む（出発のとき・本編の Chapter 1）。読めないときは play が絵の無い面になる＝出目の札は出る */
  function warm(skin) { const b = SKIN[skin || 'official']; if (!b || typeof Image === 'undefined') return; for (let v = 1; v <= 6; v++) { const im = new Image(); im.decoding = 'async'; im.src = `${b}${v}.webp`; } }
  root.MMDICE3D = Object.freeze({ play, warm, isLocked: () => locked, lastTiming: () => (last ? { ...last } : null), T, TEMPO, BASE, PIPS, SKIN });
})(typeof window !== 'undefined' ? window : globalThis);
