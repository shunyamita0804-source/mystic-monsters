// ライバル（リュウ）の相棒レグナスのバトル（2026-10-05 正式技10個・固有スキル「蒼銀の反撃」・技の演出）。
//
// Phase 6（fight()・battle-bridge.js・adapter.js・技ルーレット・.bt 系 CSS）は変えない。ここは外から差し込むだけ：
//  1) 技データ：SK・EFF・SKART の空いた番号 20〜29 に正式技10個を足す（SK・EFF の定義の行は変えない＝実行時に追加）。
//     正式の値は js/phase10/monsters.js の RIVAL_MONSTERS（レグナス）の moves の1か所。
//  2) 相手の差し替え：ライバルのバトル（index.html の bBattleGo が arm() を呼ぶ）だけ、fight() が相手を作った直後
//     （BPL が今回の対戦に変わった最初の乱数の呼び出し＝バトル画面を描く前）に、相手の名前・絵・技をレグナスにする。
//     強さ（6能力）は従来どおり MMRIVAL.rankFor のランクの値のまま（難易度は変えない）。技は最小構成＝初期の4技だけ。
//     SP（プレイヤー・野生の種族の表）には入れない＝図鑑・市場・合体・野生の相手に出ない。絵は IMG の空いた番号 4 だけ。
//  3) 固有スキル「蒼銀の反撃」：MMBattle.resolveAction を包む（中身は呼ぶだけ）。レグナスが相手の攻撃（威力のある技）を
//     回避したら、次にレグナスが与えるダメージを一度だけ 1.20 倍。重複しない・与えたら消える・セーブしない・次のバトルへ
//     持ち越さない（状態はそのバトルのセッションに結びつけた WeakMap だけ）。
//  4) 技の演出：index.html の anim()（Phase 6 の外）から anim(k, s) を呼ぶ。静止ポーズ＋FX 画像＋コードの動き
//     （Web Animations。動画・連番は使わない）。1〜4 短い・5〜8 中・9〜10 豪華（fight() の技の後の待ち 1.5秒に収める）。
//     視差を減らす設定では動きを止め、ポーズと FX のフェードだけ。
(function () {
  'use strict';
  const BASE = './assets/monsters/regnas/moves/';
  const POSE = {
    slash: 'poses/01_slash_pose', tail: 'poses/02_tail_attack_pose', charge: 'poses/03_low_charge_pose', breath: 'poses/04_breath_pose',
    eye: 'poses/05_dragon_eye_lock_pose', step: 'poses/06_afterimage_step_pose', ranA: 'poses/07_soujin_ranbu_pose_a', ranB: 'poses/08_soujin_ranbu_pose_b',
    cycS: 'poses/09_tail_cyclone_pose_start', cycM: 'poses/10_tail_cyclone_pose_spin', cycF: 'poses/11_tail_cyclone_pose_finish',
  };
  // ポーズの絵の向き（L＝左向き・R＝右向き）。相手の方を向くように左右を反転する
  const FACE = { slash: 'L', tail: 'L', charge: 'L', breath: 'L', eye: 'L', step: 'R', ranA: 'R', ranB: 'R', cycS: 'R', cycM: 'R', cycF: 'R' };
  // FX（12_claw_slash_large・11_claw_slash_medium は市松模様が画素として焼き込まれていて安全に透過できない＝使わない。README.md）
  const FX = {
    tailS: 'fx/01_tail_slash_small', tailL: 'fx/02_tail_slash_large', tailSpin: 'fx/03_tail_slash_spin', impact: 'fx/04_collision_impact',
    speed: 'fx/05_forward_speed', shock: 'fx/06_ground_shockwave', breath: 'fx/07_soukou_breath', eye: 'fx/08_dragon_eye_lock',
    cyclone: 'fx/09_tail_cyclone', clawS: 'fx/10_claw_slash_small',
  };
  const src = (p) => BASE + p + '.webp';
  const FIRST_ID = 20;        // SK の空いた番号（既存は 0〜19）
  const SPRITE = 4;           // IMG の空いた番号（既存の種族は 0〜3。SP には入れない）
  const SKILL_MULT = 1.2;     // 正式値の控え（monsters.js の uniqueSkill.params.damageMultiplier を優先）
  const ICON = ['clawS', 'tailS', 'eye', null, 'impact', 'breath', 'speed', 'clawS', 'tailL', 'cyclone'];
  const EMOJI = ['✨', '🌀', '👁️', '💨', '💥', '💠', '🎯', '✨', '⚔️', '🌪️'];

  const data = () => (window.MMP10M && MMP10M.rivalMonster ? MMP10M.rivalMonster('regnas') : null);
  const G = (name) => { try { return (0, eval)(name); } catch (e) { return undefined; } }; // index.html の上の階層の const／let（SK・BPL など）
  const reduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

  /** 正式技10個の番号（SK の番号）：No.1 → 20 … No.10 → 29 */
  const idOf = (no) => FIRST_ID + no - 1;

  /** 丈夫さ特訓での習得（9・10）：1回目は未習得の2つからランダムに1つ、2回目は残りの1つ。データの規則だけ（プレイヤーは使えない） */
  function learnByToughness(learned, rng) {
    const r = typeof rng === 'function' ? rng : Math.random;
    const left = [9, 10].filter((n) => !(learned || []).includes(n));
    if (!left.length) return null;
    return left.length === 1 ? left[0] : left[Math.floor(r() * left.length) % left.length];
  }

  let installed = false;
  function install() {
    if (installed) return true;
    const d = data(), SK = G('SK'), EFF = G('EFF'), SKART = G('SKART'), IMG = G('IMG');
    if (!d || !d.moves || !Array.isArray(SK) || !EFF || !Array.isArray(SKART) || !Array.isArray(IMG)) return false;
    d.moves.list.forEach((mv, i) => {
      const k = idOf(mv.no), sup = mv.type === 'support';
      // 旧 SK の並び：[名前, 威力比率, ルーレットの重み, 色, 絵文字, 分類, 説明, "p"|"i", 命中率, クリ率]
      const desc = sup ? `自分の${mv.effect.stat === 'hi' ? '命中' : '回避'}が少し上がる（${mv.effect.turns}ターン）。`
        : `${mv.type === 'wisdom' ? 'かしこさ' : 'ちから'}の技。威力${mv.power}・命中${mv.accuracy}%・クリティカル${mv.critical}%。`;
      SK[k] = [mv.name, sup ? 0 : mv.power / 100, mv.finisher ? 1 : sup ? 2 : 2.5, mv.finisher ? '#8fd0ff' : '#5ab4ff', EMOJI[i], sup ? 'd' : 'a', desc,
        mv.type === 'power' ? 'p' : 'i', sup ? 100 : mv.accuracy, sup ? 0 : mv.critical / 100];
      if (sup) EFF[k] = [{ tg: 0, st: mv.effect.stat, lv: 1, t: mv.effect.turns }];
      SKART[k] = src(ICON[i] ? FX[ICON[i]] : POSE.step);
    });
    const SPM = G('SPECIAL_MOVES');
    if (SPM && SPM.add) d.moves.list.filter((m) => m.finisher).forEach((m) => SPM.add(idOf(m.no)));
    IMG[SPRITE] = d.image.src;
    try { if (window.MMP7 && MMP7.registerMoveset) { const L = d.moves.learnset, ids = (a) => a.map(idOf); MMP7.registerMoveset('regnas', { initial: ids(L.initial), po: ids(L.po), in: ids(L.in), hi: ids(L.hi), ev: ids(L.ev), de: ids(L.de) }); } } catch (e) { /* 二重登録などは無視 */ }
    installed = true;
    return true;
  }

  // ---- 相手の差し替え・固有スキル（ライバルのバトルだけ） ----
  const MARK = new WeakSet();     // レグナスの対戦（fight() の pl 配列）
  const SKILL = new WeakMap();    // バトルのセッション → { armed }（セーブしない・バトルが終われば消える）
  let orig = null;                // 包む前の MMBattle

  function swap(pl) {
    const d = data(), e = pl && pl[1];
    if (!d || !e) return;
    e.name = d.name; e.sp = SPRITE; e.h = 0; e.s2 = null;
    e.eq = [...d.moves.rivalLoadout.map(idOf), -1, -1].slice(0, 6);
    MARK.add(pl);
  }

  function onAction(opts, r) {
    const pl = G('BPL');
    if (!pl || !MARK.has(pl) || !r || !opts || !opts.session) return;
    if (r.__rpDone) return;   // 2026-10-08 監査 M-13：js/battle/rules.js が固有スキルの判定の前に済ませた（外側の包みでもう一度足さない）
    try { Object.defineProperty(r, '__rpDone', { value: true, enumerable: false }); } catch (e) {}
    if (r.rules && r.rules.blocked) return;   // まひ・ねむりで動けなかった行動は「回避」ではない（js/battle/rules.js）
    const s = opts.session;
    let st = SKILL.get(s);
    if (!st) { st = { armed: false }; SKILL.set(s, st); }
    const d = data(), mult = (d && d.uniqueSkill.params.damageMultiplier) || SKILL_MULT;
    if (r.actor === 'A' && r.target === 'B' && !r.hit && opts.move && opts.move.power > 0) { st.armed = true; return; } // 回避＝構える（重複しない）
    if (r.actor === 'B' && r.hit && r.damage > 0 && st.armed) {
      st.armed = false;
      const total = Math.round(r.damage * mult), extra = total - r.damage;
      const after = Math.max(0, r.targetLifeAfter - extra), actual = r.targetLifeAfter - after;
      s.currentLife.A = after;
      if (s.totalDamage) s.totalDamage.B += actual;
      r.damage = total; r.targetLifeAfter = after; r.ko = after <= 0; r.counter = true;
      setTimeout(() => badge(), 720); // fight() がダメージを出す時刻（act の 0.72秒後）にそろえる
    }
  }

  function wrapBattle() {
    const B = window.MMBattle;
    if (!B || B.__rp) return;
    orig = B;
    const W = Object.assign({}, B);
    W.__rp = true;
    W.resolveAction = function (opts) { const r = B.resolveAction(opts); try { onAction(opts, r); } catch (e) { /* 演出の失敗でバトルを止めない */ } return r; };
    window.MMBattle = Object.freeze(W);
  }
  function unwrapBattle() { if (orig && window.MMBattle && window.MMBattle.__rp) window.MMBattle = orig; orig = null; }

  let afterWrapped = false;
  function wrapAfter() {
    if (afterWrapped || typeof window.after !== 'function') return;
    const A = window.after;
    window.after = function () { unwrapBattle(); return A.apply(this, arguments); };
    afterWrapped = true;
  }

  /** ライバルのバトルの直前に呼ぶ（index.html の bBattleGo）。fight() が相手を作ったら差し替える */
  function arm() {
    if (!install()) return false;
    wrapBattle(); wrapAfter(); preload();
    const prev = G('BPL'), rnd = Math.random;
    let done = false;
    const off = () => { if (!done) { done = true; if (Math.random === hook) Math.random = rnd; } };
    const hook = function () {
      if (!done) { const pl = G('BPL'); if (pl && pl !== prev && pl[1]) { off(); swap(pl); } }
      return rnd.apply(this, arguments);
    };
    Math.random = hook;
    setTimeout(off, 3000); // 何かの理由で fight() が始まらなかったとき
    return true;
  }

  let loaded = false;
  function preload() {
    if (loaded) return; loaded = true;
    [...Object.values(POSE), ...Object.values(FX)].forEach((p) => { const i = new Image(); i.decoding = 'async'; i.src = src(p); });
  }

  // ---- 演出 ----
  function style() {
    if (document.getElementById('rp-style')) return;
    const st = document.createElement('style'); st.id = 'rp-style';
    st.textContent = '#bt .rp-l{position:absolute;inset:0;pointer-events:none;z-index:8;overflow:hidden}'
      + '#bt .rp-l img{position:absolute;left:0;top:0;max-width:none;will-change:transform,opacity}'
      + '#bt .rp-l .rp-fl{position:absolute;inset:0;background:radial-gradient(circle at var(--x) var(--y),rgba(200,235,255,.85),rgba(120,190,255,.25) 40%,transparent 70%)}'
      + '#bt .mw.rp-on>.mon{opacity:0!important}'
      + '#bt .rp-sk{position:absolute;z-index:12;pointer-events:none;padding:5px 12px;border-radius:999px;font:900 15px "Noto Sans JP",sans-serif;color:#fff;letter-spacing:.06em;'
      + 'background:linear-gradient(180deg,#2f6fd8,#163a8a);border:2px solid #cfe6ff;box-shadow:0 0 14px #7cc4ff;text-shadow:0 1px 2px #0a1d4a;white-space:nowrap;transform:translate(-50%,-50%)}';
    document.head.appendChild(st);
  }

  function badge() {
    const bt = document.getElementById('bt'), m = document.getElementById('m1');
    if (!bt || !m) return;
    style();
    const br = bt.getBoundingClientRect(), r = m.getBoundingClientRect();
    const d = document.createElement('div'); d.className = 'rp-sk'; d.textContent = '蒼銀の反撃！';
    d.style.left = (r.left - br.left + r.width / 2) + 'px'; d.style.top = (r.top - br.top - 6) + 'px';
    bt.appendChild(d);
    const a = d.animate ? d.animate([{ opacity: 0, transform: 'translate(-50%,-30%) scale(.8)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)', offset: .2 }, { opacity: 1, offset: .75 }, { opacity: 0, transform: 'translate(-50%,-80%)' }], { duration: 1100, easing: 'ease-out' }) : null;
    setTimeout(() => d.remove(), 1150);
    return a;
  }

  const EASE = { out: 'cubic-bezier(.2,.8,.3,1)', in: 'cubic-bezier(.6,0,.9,.4)', snap: 'cubic-bezier(.3,1.4,.5,1)' };

  /** レグナスの技なら演出して true（anim() はそこで終わる）。ほかの技は false */
  function anim(k, s) {
    const no = k - FIRST_ID + 1;
    if (!(no >= 1 && no <= 10) || !installed) return false;
    const bt = document.getElementById('bt'), me = document.getElementById('m' + s), op = document.getElementById('m' + (1 - s));
    if (!bt || !me || !op || !bt.appendChild) return false;
    style();
    const br = bt.getBoundingClientRect();
    const box = (el) => { const i = el.querySelector('.mon img') || el.querySelector('.mon') || el; const r = i.getBoundingClientRect(); return { x: r.left - br.left + r.width / 2, y: r.top - br.top + r.height / 2, w: r.width, h: r.height }; };
    const A = box(me), T = box(op);
    const dir = T.x < A.x ? -1 : 1, dist = T.x - A.x;
    const L = document.createElement('div'); L.className = 'rp-l'; bt.appendChild(L);
    const calm = reduced();
    const H = Math.max(60, A.h * 1.08);
    let end = 0;

    // 置いた画像（中心 x,y・高さ h）。keyframes は { dx, dy, s, r, o } の並び（dx・dy は px）
    const put = (path, x, y, h, kf, dur, delay, flip, ease) => {
      const im = document.createElement('img'); im.alt = ''; im.src = src(path); im.decoding = 'async';
      im.style.height = h + 'px'; im.style.opacity = '0';
      L.appendChild(im);
      const fx = flip ? -1 : 1;
      const t = (f) => `translate(${x}px,${y}px) translate(-50%,-50%) translate(${f.dx || 0}px,${f.dy || 0}px) rotate(${f.r || 0}deg) scale(${(f.s ?? 1) * fx},${f.s ?? 1})${f.sy ? ` scaleY(${f.sy})` : ''}`;
      const frames = (calm ? kf.map((f) => ({ ...f, dx: 0, dy: 0, r: 0, s: 1, sy: 1 })) : kf).map((f) => ({ transform: t(f), opacity: f.o ?? 1, offset: f.at, filter: f.glow ? `brightness(${f.glow})` : 'none' }));
      im.style.transform = t(kf[0]);
      if (im.animate) im.animate(frames, { duration: dur, delay: delay || 0, easing: ease || 'linear', fill: 'both' });
      end = Math.max(end, (delay || 0) + dur);
      return im;
    };
    const flipFor = (key) => (FACE[key] === 'R') === (dir < 0);
    // ポーズ（レグナスの場所）。motion＝dx（相手の方向が正）
    const pose = (key, kf, dur, delay, ease) => put(POSE[key], A.x, A.y + A.h * 0.02, H, kf.map((f) => ({ ...f, dx: (f.dx || 0) * dir })), dur, delay, flipFor(key), ease);
    const fxAt = (key, x, y, h, kf, dur, delay, flip, ease) => put(FX[key], x, y, h, kf, dur, delay, flip, ease);
    const flash = (x, y, delay, dur) => {
      if (calm) return; const f = document.createElement('div'); f.className = 'rp-fl'; f.style.setProperty('--x', x + 'px'); f.style.setProperty('--y', y + 'px'); f.style.opacity = '0'; L.appendChild(f);
      if (f.animate) f.animate([{ opacity: 0 }, { opacity: .9, offset: .25 }, { opacity: 0 }], { duration: dur || 260, delay, fill: 'both' });
    };
    const shake = (el, delay, amp) => { if (calm || !el.animate) return; const a = (amp || 8) * dir; setTimeout(() => el.animate([{ transform: 'none' }, { transform: `translateX(${a}px)` }, { transform: `translateX(${-a * .6}px)` }, { transform: `translateX(${a * .3}px)` }, { transform: 'none' }], { duration: 300, easing: 'ease-out' }), delay); };
    const afterimage = (key, kf, dur, delay, n) => { for (let i = 1; i <= n; i++) pose(key, kf.map((f) => ({ ...f, o: (f.o ?? 1) * (0.42 / i), dx: (f.dx || 0) - i * 14 * (f.trail ?? 1) })), dur, delay + i * 40, 'linear'); };
    const near = dist * 0.62; // 相手の手前（px・相手の方向が正）

    me.classList.add('rp-on');
    switch (no) {
      case 1: // きりさく：slash_pose＋claw_slash_small（短い）
        pose('slash', [{ o: 1, at: 0 }, { dx: -10, at: .18 }, { dx: Math.abs(near) * .42, at: .42 }, { dx: Math.abs(near) * .42, at: .62 }, { dx: 0, at: 1 }], 760, 0, EASE.out);
        fxAt('clawS', T.x, T.y, T.h * 1.1, [{ o: 0, s: .55, r: -12, at: 0 }, { o: 1, s: 1.05, r: 0, at: .35 }, { o: 0, s: 1.15, r: 6, at: 1 }], 380, 300, dir > 0, EASE.out);
        shake(op, 330, 7); break;
      case 2: // しっぽアタック：tail_attack_pose＋tail_slash_small（短い）
        pose('tail', [{ o: 1, at: 0 }, { dx: -8, r: -3 * dir, at: .2 }, { dx: Math.abs(near) * .38, r: 4 * dir, at: .45 }, { dx: Math.abs(near) * .38, at: .62 }, { dx: 0, r: 0, at: 1 }], 780, 0, EASE.out);
        fxAt('tailS', T.x, T.y + T.h * .05, T.h * 1.2, [{ o: 0, s: .7, r: -30, at: 0 }, { o: 1, s: 1, r: 0, at: .4 }, { o: 0, s: 1.08, r: 14, at: 1 }], 400, 310, dir > 0, EASE.out);
        shake(op, 340, 7); break;
      case 3: // 竜眼ロック：dragon_eye_lock_pose＋dragon_eye_lock（控えめ・自分の強化）
        pose('eye', [{ o: 1, at: 0 }, { dy: -4, at: .3 }, { dy: -4, at: .8 }, { dy: 0, at: 1 }], 820, 0, 'ease-in-out');
        fxAt('eye', A.x, A.y - A.h * .18, A.h * .62, [{ o: 0, s: .82, at: 0 }, { o: .85, s: 1, at: .4 }, { o: .85, s: 1.02, at: .7 }, { o: 0, s: 1.06, at: 1 }], 720, 80, false, 'ease-out'); break;
      case 4: // 残影ステップ：afterimage_step_pose＋コードの残像（自分の強化）
        { const kf = [{ o: 1, at: 0 }, { dx: -26, at: .3, trail: 1 }, { dx: 18, at: .62, trail: -1 }, { dx: 0, at: 1 }];
          pose('step', kf, 800, 0, 'ease-in-out'); if (!calm) afterimage('step', kf, 800, 0, 3); } break;
      case 5: // ドラゴンクラッシュ：low_charge_pose＋forward_speed＋collision_impact＋ground_shockwave（中）
        pose('charge', [{ o: 1, at: 0 }, { dx: -12, sy: .94, at: .2 }, { dx: Math.abs(near), at: .44 }, { dx: Math.abs(near), at: .66 }, { dx: 0, at: 1 }], 1080, 0, EASE.in);
        fxAt('speed', A.x + near * .5, A.y, A.h * .9, [{ o: 0, s: .7, at: 0 }, { o: .9, s: 1, at: .4 }, { o: 0, s: 1.1, at: 1 }], 330, 200, dir > 0, 'ease-out');
        fxAt('impact', T.x, T.y, T.h * 1.25, [{ o: 0, s: .5, at: 0 }, { o: 1, s: 1.05, at: .3 }, { o: 0, s: 1.2, at: 1 }], 420, 460, false, EASE.out);
        fxAt('shock', T.x, T.y + T.h * .42, T.w * 1.6, [{ o: 0, s: .6, at: 0 }, { o: .95, s: 1, at: .35 }, { o: 0, s: 1.2, at: 1 }], 480, 480, false, 'ease-out');
        flash(T.x, T.y, 460, 280); shake(op, 470, 11); shake(L, 470, 5); break;
      case 6: // 蒼光ブレス：breath_pose＋soukou_breath（中）
        { pose('breath', [{ o: 1, at: 0 }, { dy: -8, dx: -6, at: .3 }, { dy: -8, dx: -6, at: .78 }, { dy: 0, dx: 0, at: 1 }], 1060, 0, 'ease-in-out');
          const mx = A.x + dist * .5, len = Math.abs(dist) * 1.05;
          const b = fxAt('breath', mx, A.y - A.h * .12 + (T.y - A.y) * .5, len / 3, [{ o: 0, s: .4, at: 0 }, { o: 1, s: 1, at: .35 }, { o: 1, s: 1, at: .7 }, { o: 0, s: 1.04, at: 1 }], 560, 280, dir > 0, 'ease-out');
          b.style.transformOrigin = dir < 0 ? '100% 50%' : '0% 50%';
          flash(T.x, T.y, 560, 300); shake(op, 600, 9); } break;
      case 7: // スナイプファング：low_charge_pose＋forward_speed＋collision_impact（ドラゴンクラッシュより速く鋭く・地面の衝撃波なし）
        pose('charge', [{ o: 1, at: 0 }, { dx: -8, sy: .95, at: .14 }, { dx: Math.abs(near) * 1.05, at: .3 }, { dx: Math.abs(near) * 1.05, at: .55 }, { dx: 0, at: 1 }], 920, 0, EASE.in);
        fxAt('speed', A.x + near * .55, A.y, A.h * .7, [{ o: 0, s: .8, at: 0 }, { o: 1, s: 1, at: .3 }, { o: 0, s: 1.15, at: 1 }], 220, 130, dir > 0, 'ease-out');
        fxAt('impact', T.x, T.y, T.h * .95, [{ o: 0, s: .6, r: 20, at: 0 }, { o: 1, s: 1, r: 0, at: .25 }, { o: 0, s: 1.1, at: 1 }], 320, 290, false, EASE.out);
        flash(T.x, T.y, 290, 200); shake(op, 300, 9); break;
      case 8: // 幻影クロー：slash_pose＋爪の斬撃（claw_slash_medium は使えない＝claw_slash_small を2つ重ねる）＋残像（中）
        { const kf = [{ o: 1, at: 0 }, { dx: -10, at: .16 }, { dx: Math.abs(near) * .55, at: .38, trail: 1 }, { dx: Math.abs(near) * .55, at: .64 }, { dx: 0, at: 1 }];
          pose('slash', kf, 1000, 0, EASE.out); if (!calm) afterimage('slash', kf, 1000, 0, 2);
          fxAt('clawS', T.x - 8, T.y - 6, T.h * 1.2, [{ o: 0, s: .55, r: -16, at: 0 }, { o: 1, s: 1.1, r: -4, at: .35 }, { o: 0, s: 1.2, at: 1 }], 380, 330, dir > 0, EASE.out);
          fxAt('clawS', T.x + 10, T.y + 8, T.h * 1.25, [{ o: 0, s: .55, r: 70, at: 0 }, { o: 1, s: 1.12, r: 84, at: .35 }, { o: 0, s: 1.2, r: 88, at: 1 }], 380, 470, dir < 0, EASE.out);
          flash(T.x, T.y, 470, 220); shake(op, 340, 7); shake(op, 490, 8); } break;
      case 9: // 蒼刃乱舞：soujin_ranbu_pose_a／b＋slash_pose＋爪の斬撃（claw_slash_large は使えない＝claw_slash_small を大きく）＋tail_slash_large（見た目の連撃・ダメージは1回）
        { const n = Math.abs(near);
          pose('ranA', [{ o: 1, at: 0 }, { dx: -14, at: .5 }, { dx: n * .7, at: 1 }], 330, 0, EASE.in);
          pose('ranB', [{ o: 0, dx: n * .7, at: 0 }, { o: 1, dx: n * .8, at: .1 }, { o: 1, dx: n * .76, at: .9 }, { o: 0, dx: n * .76, at: 1 }], 290, 330, 'linear');
          pose('slash', [{ o: 0, dx: n * .76, at: 0 }, { o: 1, dx: n * .82, at: .1 }, { o: 1, dx: n * .8, at: .9 }, { o: 0, dx: n * .8, at: 1 }], 290, 620, 'linear');
          pose('ranB', [{ o: 0, dx: n * .8, at: 0 }, { o: 1, dx: n * .78, at: .15 }, { dx: n * .5, at: .5 }, { dx: 0, at: 1 }], 480, 910, EASE.out);
          fxAt('clawS', T.x, T.y, T.h * 1.45, [{ o: 0, s: .5, r: -20, at: 0 }, { o: 1, s: 1.1, at: .3 }, { o: 0, s: 1.25, at: 1 }], 330, 380, dir > 0, EASE.out);
          fxAt('tailL', T.x, T.y, T.h * 1.5, [{ o: 0, s: .6, r: -40, at: 0 }, { o: 1, s: 1.05, r: -6, at: .35 }, { o: 0, s: 1.15, r: 10, at: 1 }], 360, 600, dir > 0, EASE.out);
          fxAt('clawS', T.x, T.y, T.h * 1.5, [{ o: 0, s: .5, r: 80, at: 0 }, { o: 1, s: 1.12, r: 92, at: .3 }, { o: 0, s: 1.25, at: 1 }], 330, 800, dir < 0, EASE.out);
          fxAt('tailL', T.x, T.y, T.h * 1.6, [{ o: 0, s: .6, r: 40, at: 0 }, { o: 1, s: 1.1, r: 6, at: .35 }, { o: 0, s: 1.2, at: 1 }], 380, 960, dir < 0, EASE.out);
          [400, 620, 820, 980].forEach((t, i) => { flash(T.x, T.y, t, 200); shake(op, t + 20, 7 + i * 2); });
          shake(L, 990, 6); } break;
      case 10: // テイルサイクロン：tail_cyclone の開始／回転／終わりのポーズ＋tail_cyclone＋tail_slash_spin（地上の竜＝飛ばない）
        pose('cycS', [{ o: 1, at: 0 }, { dx: -6, sy: .95, at: .7 }, { o: 1, dx: -6, at: .95 }, { o: 0, at: 1 }], 300, 0, 'ease-in');
        pose('cycM', [{ o: 0, at: 0 }, { o: 1, at: .06 }, { dx: 10, at: .3 }, { dx: -6, at: .55 }, { dx: 8, at: .8 }, { o: 1, at: .95 }, { o: 0, at: 1 }], 700, 300, 'linear');
        pose('cycF', [{ o: 0, at: 0 }, { o: 1, dx: 6, at: .12 }, { dx: 0, at: 1 }], 400, 1000, EASE.out);
        fxAt('cyclone', A.x, A.y, A.h * 1.35, [{ o: 0, s: .5, r: 0, at: 0 }, { o: .95, s: 1, r: 220, at: .3 }, { dx: dist * .55, o: .95, s: 1.1, r: 560, at: .7 }, { dx: dist, o: 0, s: 1.2, r: 760, at: 1 }], 880, 320, false, 'ease-in-out');
        fxAt('tailSpin', T.x, T.y, T.h * 1.5, [{ o: 0, s: .5, r: 0, at: 0 }, { o: 1, s: 1.05, r: 140, at: .35 }, { o: 0, s: 1.2, r: 300, at: 1 }], 480, 820, false, EASE.out);
        [860, 1020].forEach((t, i) => { flash(T.x, T.y, t, 240); shake(op, t + 20, 9 + i * 3); });
        shake(L, 1030, 6); break;
    }
    const total = Math.min(1480, Math.max(end, 600));
    setTimeout(() => { L.remove(); me.classList.remove('rp-on'); }, total + 20);
    return true;
  }

  window.MMRP = Object.freeze({ install, arm, anim, counter: onAction, idOf, learnByToughness, FIRST_ID, SPRITE, POSE, FX, _onAction: onAction, _swap: swap, _mark: MARK, _skill: SKILL });
})();
