// =========================================================
// ソラモ・ガウルの 2.5D バトル素材の比較試遊（2026-10-08・正式採用ではない）`MM25D`
//  2026-10-12：ソラモの技（SK の 0〜9）だけは正式の46コマ（js/battle/soramo-moves-data.js）を通常のバトルで見せる（animOff。待機の立ち絵は変えない）
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
  const owner = (k) => (k >= 0 && k <= 9 ? 0 : k >= 10 && k <= 19 ? 1 : k >= 30 && k <= 39 ? 2 : k >= 20 && k <= 29 ? 4 : k >= 40 && k <= 49 ? 3 : k >= 60 && k <= 69 ? 6 : k >= 50 && k <= 59 ? 5 : -1);   // 2026-10-17：60〜69＝ラズック（js/battle/rules.js。未解禁＝QA 試遊の個体だけ）   // 30〜39＝ノビトン（js/battle/rules.js が実行時に足す技）・20〜29＝レグナス（js/battle/rival-partner.js。IMG の 4）
  const DATA = () => root.MM25D_DATA || {};
  // 2026-10-12 正式：ソラモの技（SK の 0〜9）は修正納品の46コマ（assets/battle/soramo_moves_1012/・js/battle/soramo-moves-data.js）を通常のバトルで見せる。
  //   待機の立ち絵は変えない（2.5D の待機絵は従来どおり ?battleArt=2p5d のときだけ）。?battleArt=old で「旧」を選んでいる間だけ今までの演出（見比べ用）
  const OA = './assets/battle/soramo_moves_1012/';
  const OFF = () => root.MMSOMV_DATA || {};
  const offOn = () => !(offered && !on);
  // 2026-10-12：ガウルの技（SK の 10〜19）も最終調整版の95枚（assets/battle/gauru_moves_1012/・js/battle/gauru-moves-data.js）。本体と効果は別の層（同じ切り出し＝相対位置はそのまま）
  const GOFF = () => root.MMGAMV_DATA || {};
  const NOFF = () => root.MMNOMV_DATA || {};   // 2026-10-12：ノビトンの技（SK 30〜39）＝透過PNG 全59枚（assets/battle/nobiton_moves_1012/）
  // 2026-10-12：レグナスの技（SK 20〜29＝正式No 1〜10）＝正式補正版 透過PNG 全48枚（assets/battle/regnas_moves_1012/・js/battle/regnas-moves-data.js）。
  //   1枚に本体と効果が描かれている（別の層は無い）。ライバル戦で使うのは初期の4技（20〜23）だけ。従来の静止ポーズの演出（MMRP.anim）は、読み込めないときの代わり
  const ROFF = () => root.MMREMV_DATA || {};
  // 2026-10-12：ジオルの技＝正式採用用・透過補正版 全96枚（assets/battle/jiol_moves_1012/・js/battle/jiol-moves-data.js）。
  //   2026-10-15 から SK 40〜49 の正式技（下の SRC_OF の 3）。開発用のプレビュー（MM25D.preview('jiol', 番号, 側)）も従来どおり
  const JOFF = () => root.MMJIMV_DATA || {};
  // 2026-10-15：フルーネの技＝本体 42＋効果 35（assets/battle/flurene_moves_1015/・js/battle/flurene-moves-data.js）。SK の番号・性能は無い＝バトルでは使わない・QA 試遊のプレビュー（MM25D.preview('flurene', No, 側)）だけ
  const FLOFF = () => root.MMFLMV_DATA || {};
  // 2026-10-15：ジオルの正式技（SK 40〜49＝40＋No−1・js/battle/rules.js）＝通常のバトルでも同じ 96枚（データは No. で引く＝SK の番号に読み替える）
  let JK = null;
  const JSK = () => { const D = JOFF(); if (!JK || JK.src !== D) { JK = { src: D, map: {} }; Object.keys(D).forEach((no) => { JK.map[39 + +no] = D[no]; }); } return JK.map; };
  // 2026-10-17：ラズックの技（SK 60〜69＝60＋No−1）＝統合便の 81枚（assets/battle/razuck_moves_1017/・js/battle/razuck-moves-data.js）。データは No. で引く
  const ZOFF = () => root.MMRZMV_DATA || {};
  let ZK = null;
  const ZSK = () => { const D = ZOFF(); if (!ZK || ZK.src !== D) { ZK = { src: D, map: {} }; Object.keys(D).forEach((no) => { ZK.map[59 + +no] = D[no]; }); } return ZK.map; };
  // 2026-10-18 REV3 F0-4：フルーネの正式10技（SK 50〜59＝50＋No−1）＝同じ 77枚（データは No. で引く）。No.9 ルートドレインは従来どおり MMRD（補修版10コマ）
  let FK = null;
  const FSK = () => { const D = FLOFF(); if (!FK || FK.src !== D) { FK = { src: D, map: {} }; Object.keys(D).forEach((no) => { FK.map[49 + +no] = D[no]; }); } return FK.map; };
  const SRC_OF = { 0: OFF, 1: GOFF, 2: NOFF, 3: JSK, 4: ROFF, 5: FSK, 6: ZSK };
  /** 読み込めなかったコマがある技（その技だけ従来の演出へ戻す）。キー＝dir＋ファイル名 */
  const failed = new Set();
  const usable = (d) => !!d && !d.cuts.concat(d.fx || []).some((c) => (c.u ? [c.u] : [c.f, c.fx].filter(Boolean).map((f) => (d.dir || OA) + f)).some((u) => failed.has(u)));
  // 2026-10-15 夜：技アニメの試遊修正（js/battle/move-tune-1015.js の MMTUNE.patch＝表示のときだけ上書きした写し。データは変えない）
  const tuned = (d) => (d && root.MMTUNE ? root.MMTUNE.patch(d, d.dir || OA) : d);
  const offData = (k, s) => { if (!offOn()) return null; const o = owner(k), src = SRC_OF[o]; if (!src || spOf(s) !== o) return null; const d = tuned(src()[k] || null); return usable(d) ? d : null; };
  const OFF_DUR = { 48: 2700, 4: 2300, 8: 2300, 9: 2700, 17: 2300, 18: 2300, 19: 2500, 34: 2300, 35: 2300, 37: 2300, 39: 2700, 28: 2700, 29: 2700 };   // 6コマ以上の大技は少し長く（共通演出を通るとき）

  function spOf(s) { const pl = G('BPL'); return pl && pl[s] ? pl[s].sp : null; }
  /** この技をこの側が使うとき新しいコマで見せるか */
  // 2026-10-16：フルーネ技09「ルートドレイン」（QA 試遊だけの SK 58・js/battle/rootdrain-1016.js）
  const rdOn = (k, s) => !!(root.MMRD && offOn() && root.MMRD.handles(k, spOf(s)));
  function handles(k, s) {
    if (rdOn(k, s)) return true;
    if (offData(k, s)) return true;
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
  function timing(k, s) { if (rdOn(k, s)) { const SK = G('SK'), q = root.MMRD.plan(true, !!(SK && SK[k] && SK[k][1] > 0)); return { hit: q.hit, dur: q.dur }; } if (!handles(k, s)) return null; const od = offData(k, s), p = od ? planOff(k, true, od) : plan(k, true); return { hit: p.hit, dur: p.dur }; }
  /** 正式のソラモの技：区切り（steps）ごとの時間。重ねる層は同じ区切りに出す */
  function planOff(k, viaStage, dd, dmgOver) {
    const d = dd || OFF()[k] || GOFF()[k] || NOFF()[k] || ROFF()[k], n = d.steps;
    let dur = OFF_DUR[k] || Math.max(1500, Math.min(2700, 380 + n * 300));
    if (!viaStage) dur = 1440;
    const body = dur * 0.88, step = body / n;
    const win = Array.from({ length: n }, (_, i) => [i * step, (i + 1) * step]);
    const SK = G('SK'), dmg = dmgOver != null ? !!dmgOver : !!(SK && SK[k] && SK[k][1] > 0);
    const hit = d.hit && dmg ? win[d.hit - 1][0] + Math.min(120, step * 0.3) : null;
    // 2026-10-16：ガウル SK19「聖なる炎」承認演出 V2（js/battle/sk19-v2-1016.js）＝時間枠は同じ・当たり＝炎の外縁が相手の中心に届く時刻
    if (v2of(d)) { const q = root.MMSK19V2.plan(dur, viaStage, dmg); return { dur: q.dur, body: q.dur * 0.88, step, win, hit: q.hit }; }
    return { dur, body, step, win, hit };
  }
  const v2of = (d) => !!(d && d.tune && d.tune.v2 && root.MMSK19V2 && root.MMSK19V2.on());

  function style() {
    if (document.getElementById('mm25d-style')) return;
    const st = document.createElement('style'); st.id = 'mm25d-style';
    st.textContent = [
      '#bt .p25f{position:absolute;left:0;top:0;max-width:none;pointer-events:none;z-index:7;will-change:transform,opacity}',
      // 2026-10-09：コマの外へ続く光の粒（切れた辺の色。星・火の粉・風の筋・羽根・砂）
      '#bt .p25p{position:absolute;left:0;top:0;pointer-events:none;z-index:8;will-change:transform,opacity;border-radius:50%;background:radial-gradient(circle,#fff 0 16%,var(--a) 38%,var(--b) 60%,transparent 71%)}',
      '#bt .p25p.star{border-radius:0;clip-path:polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%);background:radial-gradient(circle,#fff 0 22%,var(--a) 52%,var(--b))}',
      '#bt .p25p.streak{border-radius:99px;background:linear-gradient(90deg,transparent,var(--b) 40%,var(--a) 78%,#fff)}',
      '#bt .p25p.ember{background:radial-gradient(circle,#fff4c4 0 14%,var(--a) 34%,var(--b) 58%,transparent 71%)}',
      '#bt .p25p.feather{border-radius:50% 50% 50% 50%/80% 80% 22% 22%;background:linear-gradient(90deg,var(--b),var(--a))}',
      '#bt .p25p.dust{background:radial-gradient(circle,var(--a) 0 28%,var(--b) 52%,transparent 71%)}',
      '#bt .mon .mma-idle.p25{height:calc(118% * var(--p25h,1))}',
      '#bt .p25sw{position:absolute;left:8px;z-index:30;pointer-events:auto;font:800 11px/1 "Noto Sans JP",sans-serif;color:#f3ecd9;background:rgba(8,14,34,.82);border:1.5px solid rgba(214,178,98,.9);border-radius:999px;padding:6px 10px;letter-spacing:.04em}',
      '#bt .p25sw b{color:#ffd76a}',
    ].join('\n');
    document.head.appendChild(st);
  }

  // ---- コマの外へ続く光の粒（2026-10-09）----
  // 元のシートで光・炎・風がコマの端で切れている辺（data の ex）から、同じ色の粒を外へ流して消す＝絵の続きをなじませる（新しい絵は描かない）。
  // 乱数はバトルの乱数（Math.random）を使わない＝技・コマごとに決まった小さな乱数
  const STY = { 0: 'dust', 1: 'spark', 2: 'spark', 3: 'spark', 4: 'star', 5: 'spark', 6: 'dust', 7: 'star', 8: 'star', 9: 'star',
    10: 'streak', 11: 'streak', 12: 'streak', 13: 'streak', 14: 'streak', 15: 'ember', 16: 'ember', 17: 'streak', 18: 'feather', 19: 'ember' };
  const PMAX = 14;   // 1コマの粒の上限
  function prng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function pick(p, r) { let x = r(), a = 0; for (let i = 0; i < p.length; i++) { a += p[i]; if (x <= a) return (i + r()) / p.length; } return r(); }
  /** コマ j の粒（.vs に置く要素の配列）。q＝置き方、win＝そのコマの時間 [始め, 終わり]（ms）、D＝全体の長さ */
  function particles(v, k, j, s, q, win, D, unit) {
    const c = q.c, ex = c.ex; if (!ex) return [];
    const f = s ? -1 : 1, S = q.S, PW = c.pw * S, PH = c.ph * S, r = prng(k * 977 + j * 131 + s * 17 + 1);
    const p = { x: (q.p0.x + q.p1.x) / 2, y: (q.p0.y + q.p1.y) / 2 }, sty = STY[k] || 'spark';
    const out = []; let left = PMAX;
    for (const e of ['T', 'L', 'R', 'B']) {
      const E = ex[e]; if (!E || left <= 0) continue;
      const n = Math.min(left, Math.round(2 + 9 * Math.min(1, E.n))); left -= n;
      for (let i = 0; i < n; i++) {
        const u = pick(E.p, r);
        let x, y, dx, dy;
        if (e === 'T') { x = u * PW; y = PH * 0.1; dx = (r() - 0.5) * 0.9; dy = -1; }
        else if (e === 'B') { x = u * PW; y = PH * 0.9; dx = (r() < 0.5 ? -1 : 1); dy = 0.25; }
        else if (e === 'L') { x = PW * 0.1; y = u * PH; dx = -1; dy = (r() - 0.5) * 0.9; }
        else { x = PW * 0.9; y = u * PH; dx = 1; dy = (r() - 0.5) * 0.9; }
        if (f < 0) { x = PW - x; dx = -dx; }
        const L = Math.hypot(dx, dy); dx /= L; dy /= L;
        const dist = Math.min(PW, PH) * (0.12 + r() * 0.22) * (e === 'B' ? 0.6 : 1);
        const sz = unit * (0.7 + r() * 0.7), long = sty === 'streak', fe = sty === 'feather';
        const w = long ? sz * 3.4 : fe ? sz * 1.6 : sz, h = long ? sz * 0.42 : fe ? sz * 0.55 : sz;
        const el = document.createElement('i'); el.className = 'p25p ' + sty;
        el.style.width = w + 'px'; el.style.height = h + 'px';
        el.style.setProperty('--a', E.c[0]); el.style.setProperty('--b', E.c[1]);
        const x0 = p.x + x - w / 2, y0 = p.y + y - h / 2, x1 = x0 + dx * dist, y1 = y0 + dy * dist;
        const ang = long ? Math.atan2(dy, dx) * 180 / Math.PI : sty === 'star' || fe ? r() * 360 : 0, spin = sty === 'star' ? 90 : fe ? (r() - 0.5) * 240 : 0;
        const T = (X, Y, sc, a) => `translate(${X}px,${Y}px) rotate(${a}deg) scale(${sc})`;
        const st = win[0] + r() * (win[1] - win[0]) * 0.7, dur = 420 + r() * 300;
        const o0 = Math.max(0, st / D), o1 = Math.min(1, (st + dur) / D), em = 0.0005;
        const kf = [{ opacity: 0, transform: T(x0, y0, 0.4, ang), offset: 0 }];
        if (o0 > em) kf.push({ opacity: 0, transform: T(x0, y0, 0.4, ang), offset: o0 });
        kf.push({ opacity: 1, transform: T(x0 + (x1 - x0) * 0.2, y0 + (y1 - y0) * 0.2, 1, ang + spin * 0.2), offset: Math.min(o1 - em, o0 + (o1 - o0) * 0.2) });
        kf.push({ opacity: 0, transform: T(x1, y1, 0.7, ang + spin), offset: o1 });
        if (o1 < 1) kf.push({ opacity: 0, transform: T(x1, y1, 0.7, ang + spin), offset: 1 });
        v.appendChild(el); out.push(el);
        el.animate(kf, { duration: D, fill: 'both' }).onfinish = () => el.remove();
      }
    }
    return out;
  }

  /** 2026-10-15 夜：コマごとの倍率（体の面積を待機立ち絵とそろえる）。測った面積が無い・?mmScale=old のときは null（従来） */
  function areaScales(d, s, idleW, idleH) {
    const A = root.MMAREA; if (!A) return null;
    try { if (/[?&]mmScale=old(&|$)/.test(root.location.search)) return null; } catch (e) { /* 下へ */ }
    const sp = spOf(s), I = root.MMARENA && root.MMARENA.IDLE, ia = I && I[sp] != null ? A['idle/' + I[sp] + '.webp'] : null;
    if (!ia) return null;
    const m = /([^/]+)\/$/.exec(d.dir || OA), dir = m ? m[1] : 'soramo_moves_1012';
    const raw = d.cuts.map((c) => { const a = A[dir + '/' + c.f]; return a ? Math.sqrt((ia * idleW * idleH) / (a * c.pw * c.ph)) * (c.cs || 1) : null; });
    if (raw.some((x) => x == null)) return null;
    const mm = med(raw);
    return raw.map((x, i) => (d.cuts[i].cs ? x : Math.max(mm * 0.72, Math.min(mm * 1.5, x))));   // 効果が体の層に描き込まれたコマなどの外れ値を抑える（倍率を明示したコマは除く）
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
  function layout(k, s, L, dd) {
    const d = dd || DATA()[k], f = s ? -1 : 1, calm = reduced();
    const { Ag, Tg, idleW, idleH, xmin, xmax, ytop, tFront } = L;
    const bw = d.cuts.map((c) => c.b[2] - c.b[0]), bh = d.cuts.map((c) => c.b[3] - c.b[1]);
    // 本体の高さ（中央値）と面積（中央値）の2つの見積もりの平均。高さだけだと伏せた姿勢・飛ぶ姿勢で、面積だけだと横に長い姿勢で大きさがずれる
    const area = med(d.cuts.map((c, i) => bw[i] * bh[i]));
    let S = (idleH * 0.95 / med(bh) + Math.sqrt((idleW * idleH) / area)) / 2 * (d.tune && d.tune.sc || 1);
    // 2026-10-15 夜（共通スケール）：コマごとに「見えている体の面積」（js/battle/move-area-1015.js＝アルファの画素数）を待機立ち絵とそろえる。
    //  姿勢（しゃがむ・伸びる・翼を広げる）で枠の大きさが変わっても体の大きさは同じ＝技の途中で急に大きく／小さくならない。?mmScale=old で従来の見積もり
    const Sc = areaScales(d, s, idleW, idleH);
    let K = d.cuts.map((c, i) => (Sc ? Sc[i] * (d.tune && d.tune.sc || 1) / S : (c.cs || 1)));
    d.cuts.forEach((c, i) => { S = Math.min(S, (xmax - xmin) * 0.96 / (bw[i] * K[i]), (Ag.y + idleH * 0.06 - ytop) / (bh[i] * K[i])); });
    // その場・踏み込み・戻るのコマの本体が、自分側の画面の端から相手の手前までに収まる大きさ（翼を広げたガウルが相手の顔に重ならない）。
    // 縮めすぎると立ち絵との大きさの差が目立つ＝最大 22% まで（それ以上は相手の体の手前の端に少し重なってよい）
    const room = f > 0 ? tFront - xmin : xmax - tFront;
    if (room > 0) {
      let S2 = S;
      d.cuts.forEach((c, i) => { if (c.m === 'self' || c.m === 'back' || c.m === 'lunge') S2 = Math.min(S2, room / (bw[i] * K[i] * 1.06)); });
      S = Math.max(S * 0.78, S2);
    }
    const ground = {}; d.cuts.forEach((c, i) => { const key = c.src.replace(/_\d+$/, ''); ground[key] = Math.max(ground[key] || 0, c.b[3] * K[i]); });
    const reach = Math.abs(Tg.x - Ag.x);
    const fx = (c, x) => (f > 0 ? x : c.pw - x);   // 相手側は左右反転（コマの中の x）
    const S0 = S;
    return d.cuts.map((c, ci) => {
      const S = S0 * K[ci];   // コマごとの倍率（面積をそろえた分）
      const g = ground[c.src.replace(/_\d+$/, '')] / K[ci];
      const bL = Math.min(fx(c, c.b[0]), fx(c, c.b[2])), bR = Math.max(fx(c, c.b[0]), fx(c, c.b[2]));
      const bcx = (bL + bR) / 2;
      // 本体の中心の x（画面）：モードごとの始め → 終わり
      const at = (r) => Ag.x + f * reach * r;
      let R = calm ? [[0, 0]] : { self: [0, 0.02], lunge: [0.12, 0.24], move: [0.1, 0.42], contact: [0.46, 0.54], back: [0.3, 0.04] }[c.m] || [0, 0.02];
      if (!calm && c.r) R = c.r; else if (!calm && d.stay && c.m !== 'move' && c.m !== 'contact') R = [0, 0];   // 2026-10-15：射撃の技はその場（前へ出ない）
      const ends = (calm ? [0, 0] : R).map((r) => {
        let px = at(r) - bcx * S, py = Ag.y - g * S + (c.lift || 0) * idleH;   // コマ（元の枠）の左上（lift＝その場で浮く・負＝上）
        // 本体を画面の左右・HUD の下・地面の上に収める（3% の余白）
        const m = (bR - bL) * S * 0.03;
        const l = px + bL * S - m, rr = px + bR * S + m;
        if (l < xmin) px += xmin - l; else if (rr > xmax) px -= rr - xmax;
        const top = py + c.b[1] * S - (c.b[3] - c.b[1]) * S * 0.03;
        if (top < ytop) py += ytop - top;
        // 2026-10-15：射撃の技（stay）のその場のコマは、体の前の端を待機立ち絵の前の端の少し先までに（体が相手へ迫って体当たりに見えない）
        if (d.stay && !c.r && c.m !== 'move' && c.m !== 'contact') {
          const lim = Ag.x + f * idleW * 0.5;
          if (f > 0) { const over = px + bR * S - lim; if (over > 0) px -= Math.min(over, Math.max(0, px + bL * S - m - xmin)); }
          else { const over = lim - (px + bL * S); if (over > 0) px += Math.min(over, Math.max(0, xmax - (px + bR * S) - m)); }
        }
        // その場のコマは相手の体に重ねない（当たるコマ・移動のコマは重なってよい）
        if (c.m === 'self' || c.m === 'back' || c.m === 'lunge') {
          if (f > 0) { const over = px + bR * S - tFront; if (over > 0) px -= Math.max(0, Math.min(over, px + bL * S - m - xmin)); }
          else { const over = tFront - (px + bL * S); if (over > 0) px += Math.max(0, Math.min(over, xmax - (px + bR * S) - m)); }
        }
        return { x: px, y: py };
      });
      const mid = !calm && c.arc ? { x: (ends[0].x + ends[1].x) / 2, y: Math.max(ytop - c.b[1] * S, (ends[0].y + ends[1].y) / 2 - c.arc * idleH) } : null;   // 跳ぶ（放物線の頂点）
      return { c, S, p0: ends[0], p1: ends[1], mid };
    });
  }

  /** 技のコマを順に見せる。引き受けたら true */
  function anim(k, s) {
    if (!handles(k, s)) return false;
    if (rdOn(k, s)) { const g = geom(s), SK = G('SK'); if (!g) return false; style(); const P = root.MMRD.plan(viaStage(), !!(SK && SK[k] && SK[k][1] > 0)); try { if (root.MMTUNE) root.MMTUNE.onAnimStart(k, s, P); } catch (er) { /* 無視 */ } return root.MMRD.play(k, s, g, P); }
    if (offData(k, s)) return animOff(k, s);
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
      if (!reduced()) particles(v, k, j, s, q, P.win[j], D, Math.max(6, Math.min(16, idleH * 0.06))).forEach((el) => imgs.push(el));
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

  // ---- 正式のソラモの技（2026-10-12）----
  /** 攻撃側・相手・画面の位置（anim と同じ測り方） */
  /** ヒットストップ（バトル画面の中の動きを ms だけ止める。stage.js の hitStop と同じ方式＝共通演出を通らないプレビューでも効く） */
  function hitStop(ms) {
    if (!ms || !document.getAnimations || reduced()) return;
    const bt = document.getElementById('bt'); if (!bt) return;
    const list = document.getAnimations().filter((a) => { const t = a.effect && a.effect.target; return t && bt.contains(t) && a.playState === 'running'; });
    list.forEach((a) => { try { a.pause(); } catch (e) { /* 無視 */ } });
    setTimeout(() => list.forEach((a) => { try { if (a.playState === 'paused') a.play(); } catch (e) { /* 無視 */ } }), ms);
  }
  function geom(s) {
    const v = $('.vs'), bt = document.getElementById('bt'), me = document.getElementById('m' + s), op = document.getElementById('m' + (1 - s));
    if (!v || !v.appendChild || !me || !op || !bt) return null;
    const mon = $('.mon', me), tmon = $('.mon', op); if (!mon || !tmon) return null;
    const f = s ? -1 : 1, vr = v.getBoundingClientRect(), br = bt.getBoundingClientRect(), ar = mon.getBoundingClientRect(), tr = tmon.getBoundingClientRect();
    const ii = mon.querySelector('.mma-idle'), ti = tmon.querySelector('.mma-idle');
    const ir = ii && ii.getBoundingClientRect().height ? ii.getBoundingClientRect() : null;
    const idleH = ir ? ir.height : ar.height * 1.18, idleW = ir ? ir.width : idleH * 1.1;
    const trr = ti && ti.getBoundingClientRect().width ? ti.getBoundingClientRect() : tr;
    const hp = bt.querySelector('.hpr'), hb = hp ? hp.getBoundingClientRect().bottom : br.top + br.height * 0.12;
    const L = { Ag: { x: ar.left + ar.width / 2 - vr.left, y: ar.bottom - vr.top }, Tg: { x: tr.left + tr.width / 2 - vr.left, y: tr.bottom - vr.top }, idleW, idleH,
      xmin: br.left - vr.left + 10, xmax: br.right - vr.left - 10, ytop: hb - vr.top + 4, tFront: (f > 0 ? trr.left + trr.width * 0.18 : trr.right - trr.width * 0.18) - vr.left };
    const T = { x: trr.left + trr.width / 2 - vr.left, cy: trr.top + trr.height * 0.55 - vr.top, top: trr.top - vr.top, w: trr.width, h: trr.height };
    return { v, bt, me, f, vr, tr, L, T };
  }
  // 効果だけの層の置き方（絵の中の合わせる点 ax・ay＝割合、幅＝待機の立ち絵の幅に対する倍率）。相手が左（相手側の技）なら左右反転
  const FXP = { sky: { ax: 0.5, ay: 0.98, w: 2.5 }, barrage: { ax: 0.82, ay: 0.86, w: 2.3 }, impact: { ax: 0.74, ay: 0.82, w: 2.1 } };
  function animOff(k, s, dd, opt) {
    const g = geom(s); if (!g) return false;
    style();
    const { v, me, f, L, T } = g, d = dd || offData(k, s), base = d.dir || OA, P = planOff(k, opt && opt.via != null ? opt.via : viaStage(), d, opt ? opt.dmg : null), D = P.dur, X = 60, e = 0.001, imgs = [];
    if (v2of(d) && root.MMSK19V2.play(k, s, g, P)) { try { if (root.MMTUNE) root.MMTUNE.onAnimStart(k, s, P); } catch (er) { /* 無視 */ } return true; }
    const lay = layout(k, s, L, { cuts: d.cuts });
    const at = (i) => lay.find((q) => q.c.t[0] <= i && q.c.t[1] >= i);
    const put = (im, z) => { im.className = 'p25f'; im.alt = ''; im.decoding = 'sync'; if (z) im.style.zIndex = z; v.appendChild(im); imgs.push(im); return im; };
    // 窓 [w0, w1] の間だけ見せる（前後は X だけ重ねて切り替える）
    const kfWin = (w0, w1, a, b, first, last, mid) => {
      const t0 = Math.max(0, w0 - (first ? 0 : X)) / D, t1 = Math.min(D, w1 + (last ? 0 : X)) / D;
      const k2 = [{ opacity: 0, transform: a, offset: 0 }];
      if (t0 > e) k2.push({ opacity: 0, transform: a, offset: t0 - e });
      k2.push({ opacity: 1, transform: a, offset: Math.min(t0 + (first ? 0.02 : X / D), t1 - 2 * e) });
      if (mid) { const o1 = k2[k2.length - 1].offset, o2 = Math.max(t0 + 2 * e, t1 - (last ? 0.04 : X / D)); k2[k2.length - 1].easing = 'ease-out'; k2.push({ opacity: 1, transform: mid, offset: (o1 + o2) / 2, easing: 'ease-in' }); }
      k2.push({ opacity: 1, transform: b, offset: Math.max(t0 + 2 * e, t1 - (last ? 0.04 : X / D)) });
      k2.push({ opacity: 0, transform: b, offset: Math.min(1, t1) });
      if (t1 < 1) k2.push({ opacity: 0, transform: b, offset: 1 });
      return k2;
    };
    const tune = d.tune || {};
    try { if (root.MMTUNE) root.MMTUNE.onAnimStart(k, s, P); } catch (er) { /* 無視 */ }
    lay.forEach((q) => {
      const c = q.c, S = q.S, Tf = (p) => `translate(${p.x}px,${p.y}px) scaleX(${f})` + (c.rot ? ` rotate(${c.rot}deg)` : '');
      const w0 = P.win[c.t[0]][0], w1 = P.win[c.t[1]][1];
      // 本体（と、同じ切り出しの効果の層＝ガウル。本体の上に同じ動きで重ねる）
      [[c.f, 0], [c.fx, 8]].forEach(([src, z]) => { if (!src) return;
        const im = document.createElement('img'); im.src = base + src; im.dataset.cut = z ? c.src + '_fx' : c.src;
        im.style.width = c.w * S + 'px'; im.style.height = c.h * S + 'px'; im.style.transformOrigin = '50% 50%'; put(im, z);
        im.animate(kfWin(w0, w1, Tf(q.p0), Tf(q.p1), c.t[0] === 0, c.t[1] === d.steps - 1, q.mid ? Tf(q.mid) : null), { duration: D, fill: 'both' }).onfinish = () => im.remove(); });
    });
    const S0 = lay.length ? lay[0].S : 1;
    // 2026-10-15：効果の層の一部だけを切り出して動かす（体と同じ画面に描かれた火球・光線・花粉）。fb＝絵の中の範囲（画素）
    const crop = (c, fb, Sc) => {
      const box = document.createElement('div'); box.className = 'p25f p25c'; box.dataset.cut = c.src;
      const w = (fb[2] - fb[0]) * Sc, h = (fb[3] - fb[1]) * Sc;
      box.style.width = w + 'px'; box.style.height = h + 'px'; box.style.overflow = 'hidden';
      const im = document.createElement('img'); im.src = c.u || base + c.f; im.alt = ''; im.decoding = 'sync';
      im.style.cssText = `position:absolute;left:${-fb[0] * Sc}px;top:${-fb[1] * Sc}px;width:${c.pw * Sc}px;height:${c.ph * Sc}px;max-width:none`;
      box.appendChild(im); v.appendChild(box); imgs.push(box); return { box, w, h };
    };
    const cutPos = (src, x, y) => { const q = lay.find((z) => z.c.src === src) || lay[0]; const fx2 = f > 0 ? x : q.c.pw - x; return { x: q.p0.x + fx2 * q.S, y: q.p0.y + y * q.S, q }; };
    // 2026-10-16（iPhone 01・02・04・05）：そのコマの口先（MMTUNE.MOUTH＝絵の中の画素）を画面の位置へ。本体の img と同じ式（左上 p・反転 scaleX(f)・回転 rot・中心が原点）
    const mouthPt = (q, end) => {
      const M = root.MMTUNE && root.MMTUNE.mouthOf ? root.MMTUNE.mouthOf(base, q.c.f) : null; if (!M) return null;
      const p = end ? q.p1 : q.p0, W = q.c.w * q.S, H = q.c.h * q.S, lx = (M[0] - q.c.w / 2) * q.S, ly = (M[1] - q.c.h / 2) * q.S;
      const r = (q.c.rot || 0) * Math.PI / 180, rx = lx * Math.cos(r) - ly * Math.sin(r), ry = lx * Math.sin(r) + ly * Math.cos(r);
      return { x: p.x + W / 2 + f * rx, y: p.y + H / 2 + ry };
    };
    // 光線は区切りごとにその区切りのコマの口先から出し直す（口先の分かるコマだけ。2つ目からは伸びきった長さで続ける＝途切れない）
    const fxList = [];
    (d.fx || []).forEach((c) => {
      if ((c.at === 'beam' || c.at === 'stretch') && c.t[1] > c.t[0]) {
        const ok = []; for (let i = c.t[0]; i <= c.t[1]; i++) { const q = at(i); ok.push(!!(q && mouthPt(q))); }
        if (ok.every(Boolean)) { for (let i = c.t[0]; i <= c.t[1]; i++) fxList.push(Object.assign({}, c, { t: [i, i], seg: i - c.t[0], segLast: i === c.t[1] })); return; }
      }
      fxList.push(c);
    });
    // 溜め（フルーネの必殺など・素材の無い光の溜めを CSS で）
    if (tune.charge) {
      const ch = tune.charge, w0 = P.win[ch.t[0]][0], w1 = P.win[ch.t[1]][1], R = L.idleW * 1.25, cx = L.Ag.x, cy = L.Ag.y - L.idleH * 0.5;
      const a = document.createElement('div'); a.className = 'p25f'; a.style.cssText = `width:${R}px;height:${R}px;border-radius:50%;background:radial-gradient(circle,#fff 0 10%,${ch.c1} 32%,${ch.c2} 52%,transparent 70%);mix-blend-mode:screen`;
      v.appendChild(a); imgs.push(a);
      const T0 = `translate(${cx - R / 2}px,${cy - R / 2}px)`;
      a.animate([{ opacity: 0, transform: T0 + ' scale(.3)', offset: 0 }, { opacity: 0, transform: T0 + ' scale(.3)', offset: w0 / D }, { opacity: 0.95, transform: T0 + ' scale(1.1)', offset: (w0 + (w1 - w0) * 0.8) / D }, { opacity: 0, transform: T0 + ' scale(.6)', offset: Math.min(1, (w1 + 120) / D) }, { opacity: 0, offset: 1 }], { duration: D, fill: 'both' });
    }
    fxList.forEach((c) => {
      const w0 = P.win[c.t[0]][0], w1 = P.win[c.t[1]][1], last = c.t[1] === d.steps - 1;
      if (c.at === 'launch') {   // 2026-10-15：効果を相手の胸まで飛ばす（ファイアボール・フルーネの花粉・聖なる炎の放射）。from＝'self'：自分の胸から
        const fb = c.fb || [0, 0, c.pw, c.ph], Sc = (c.ref ? (lay.find((z) => z.c.src === c.ref) || lay[0]).S : S0) * (c.ws || 1), g2 = c.grow || [0.9, 1.1];
        const { box, w, h } = crop(c, fb, Sc);
        const qm = c.fromMouth && c.ref ? at(c.t[0]) : null, mp = qm ? mouthPt(qm) : null;   // fromMouth＝その区切りのコマの口先で生まれる（ファイアボール）
        const st = mp || (c.from === 'self' || !c.ref ? { x: L.Ag.x + f * L.idleW * 0.08, y: L.Ag.y - L.idleH * 0.5 } : cutPos(c.ref, (fb[0] + fb[2]) / 2, (fb[1] + fb[3]) / 2));
        box.dataset.mx = Math.round(st.x); box.dataset.my = Math.round(st.y); if (mp) box.dataset.mf = qm.c.f;
        const ex = T.x, ey = T.cy;
        box.style.transformOrigin = '50% 50%';
        box.animate(kfWin(w0, w1, `translate(${st.x - w / 2}px,${st.y - h / 2}px) scaleX(${f}) scale(${g2[0]})`, `translate(${ex - w / 2}px,${ey - h / 2}px) scaleX(${f}) scale(${g2[1]})`, false, last), { duration: D, fill: 'both' }).onfinish = () => box.remove();
        return;
      }
      if (c.at === 'stretch') {   // 2026-10-15：口から相手の胸の少し先まで伸びる光線（フレアレイ）。mouth＝その区切りの体の範囲に対する口の位置（右向き）
        const fb = c.fb || [0, 0, c.pw, c.ph], q = lay.find((z) => z.c.src === c.ref) || lay[0], b = q.c.b, bw = b[2] - b[0], bh = b[3] - b[1], mo = c.mouth || [0.92, 0.4];
        const qs = at(c.t[0]) || q, m0 = mouthPt(qs), m1 = mouthPt(qs, true);   // 2026-10-16：その区切りのコマの口先（無いコマは従来の割合）
        const mxl = b[0] + bw * mo[0], mx = f > 0 ? mxl : q.c.pw - mxl;
        const st0 = m0 || { x: q.p0.x + mx * q.S, y: q.p0.y + (b[1] + bh * mo[1]) * q.S }, st1 = m1 || st0;
        const { box, w, h } = crop(c, fb, q.S), th = Math.max(1, Math.min(3, (L.idleH * 0.2) / h));
        const pose = (pt) => { const ex = T.x + f * T.w * 0.25, ey = pt.y * 0.4 + T.cy * 0.6, len = Math.max(Math.hypot(ex - pt.x, ey - pt.y), L.idleW * 1.1), ang = Math.atan2(ey - pt.y, ex - pt.x) * 180 / Math.PI;
          return { len, b0: `translate(${pt.x}px,${pt.y - h / 2}px) rotate(${ang}deg)` + (f > 0 ? '' : ' scaleY(-1)') }; };   // 絵の左端＝口。角度で相手へ向ける（相手側は上下だけ返す）
        const A0 = pose(st0), A1 = pose(st1);
        box.style.transformOrigin = '0 50%'; box.dataset.mx = Math.round(st0.x); box.dataset.my = Math.round(st0.y); if (m0) box.dataset.mf = qs.c.f;
        box.animate(kfWin(w0, w1, A0.b0 + ` scale(${c.seg ? A0.len / w : 0.12},${th})`, A1.b0 + ` scale(${A1.len / w},${th})`, false, last), { duration: D, fill: 'both' }).onfinish = () => box.remove();
        return;
      }
      if (c.at === 'mouth') {   // 2026-10-16（iPhone 6件 A4）：体と同じ画面に描かれた溜めの光を切り出して、その区切りのコマの口先で育てる（動かない）
        const q = at(c.t[0]), mp = q && mouthPt(q), mp1 = q && mouthPt(q, true); if (!mp) return;
        const fb = c.fb || [0, 0, c.pw, c.ph], Sc = (c.ref ? (lay.find((z) => z.c.src === c.ref) || lay[0]).S : S0) * (c.ws || 1), g2 = c.grow || [0.5, 1];
        const { box, w, h } = crop(c, fb, Sc); box.style.transformOrigin = '50% 50%';
        box.dataset.mx = Math.round(mp.x); box.dataset.my = Math.round(mp.y); box.dataset.mf = q.c.f;
        box.animate(kfWin(w0, w1, `translate(${mp.x - w / 2}px,${mp.y - h / 2}px) scaleX(${f}) scale(${g2[0]})`, `translate(${mp1.x - w / 2}px,${mp1.y - h / 2}px) scaleX(${f}) scale(${g2[1]})`, false, last), { duration: D, fill: 'both' }).onfinish = () => box.remove();
        return;
      }
      const im = document.createElement('img'); im.src = c.u || base + c.f; im.dataset.cut = c.src; put(im, 8);
      if (c.at === 'aura') {   // 2026-10-15：自分の胸から広がる放射（聖なる炎）
        // 2026-10-16（iPhone 06）：onBody＝その区切りのコマの体の範囲の中心（浮いた姿のガウルの体の中心から放射する＝相手へは飛ばさない）
        const qb = c.onBody ? at(c.t[0]) : null, bb = qb && qb.c.b, bx = bb ? (f > 0 ? (bb[0] + bb[2]) / 2 : qb.c.pw - (bb[0] + bb[2]) / 2) : 0;
        const W = L.idleW * 1.7 * (c.ws || 1), H = W * c.ph / c.pw, cx = bb ? qb.p0.x + bx * qb.S : L.Ag.x, cy = bb ? qb.p0.y + (bb[1] + bb[3]) / 2 * qb.S : L.Ag.y - L.idleH * 0.55;
        im.dataset.cx = Math.round(cx); im.dataset.cy = Math.round(cy);
        im.style.width = W + 'px'; im.style.height = H + 'px'; im.style.transformOrigin = '50% 50%';
        const g3 = c.grow || [0.25, 1.15];
        im.animate(kfWin(w0, w1, `translate(${cx - W / 2}px,${cy - H / 2}px) scale(${g3[0]})`, `translate(${cx - W / 2}px,${cy - H / 2}px) scale(${g3[1]})`, false, last), { duration: D, fill: 'both' }).onfinish = () => im.remove();
        return;
      }
      if (c.at === 'fly') {   // ノビトン：自分の口・鼻の先から相手の体へ飛ぶ効果（はなみず・ノーズウェーブ・ピンポイント突き・ダウナーミスト）
        const W = c.pw * S0 * 0.7, H = c.ph * S0 * 0.7;
        const sx = L.Ag.x + f * L.idleW * 0.45, sy = L.Ag.y - L.idleH * 0.55, ex = T.x, ey = T.cy;
        im.style.width = W + 'px'; im.style.height = H + 'px'; im.style.transformOrigin = '50% 50%';
        im.animate(kfWin(w0, w1, `translate(${sx - W / 2}px,${sy - H / 2}px) scaleX(${f}) scale(0.8)`, `translate(${ex - W / 2}px,${ey - H / 2}px) scaleX(${f}) scale(1)`, false, last), { duration: D, fill: 'both' }).onfinish = () => im.remove();
        return;
      }
      if (c.at === 'root' || c.at === 'hitc') {
        // 2026-10-16（バトル最終統合）フルーネ技10：根＝絵の根元（下 7%）を相手の足もとへ・高さ＝相手の体の約1.35倍。命中＝絵の中心を相手の被弾点へ・幅＝相手の体の約1.7倍
        const isRoot = c.at === 'root', W = isRoot ? T.h * 1.35 / 0.85 : Math.min(Math.max(T.w, T.h) * 1.25, (f > 0 ? L.xmax - T.x : T.x - L.xmin) * 2.15), H = W * c.ph / c.pw;   // 命中の光は画面の端で切れない大きさまで
        const cx = T.x, cy = isRoot ? L.Tg.y - H * 0.43 : T.cy;   // 根：絵の下 7%（中心から 0.43）が足もと
        im.style.width = W + 'px'; im.style.height = H + 'px'; im.style.transformOrigin = isRoot ? '50% 93%' : '50% 50%';
        im.dataset.cx = Math.round(cx); im.dataset.cy = Math.round(cy); if (isRoot) im.dataset.foot = Math.round(L.Tg.y);
        const a = `translate(${cx - W / 2}px,${cy - H / 2}px) scaleX(${f}) scale(${isRoot ? '1,0.9' : '0.9'})`, z = `translate(${cx - W / 2}px,${cy - H / 2}px) scaleX(${f}) scale(1)`;
        im.animate(kfWin(w0, w1, a, z, false, last), { duration: D, fill: 'both' }).onfinish = () => im.remove();
        return;
      }
      if (c.at === 'tgt' || c.at === 'self') {
        // ガウル：着弾の効果＝相手の体の中ほど／特殊エフェクト（バフのキラキラ・炎のオーラ）＝自分の上。大きさは本体のコマと同じ倍率（元の絶対の大きさ）
        const W = c.pw * S0 * (c.ws || 1), H = c.ph * S0 * (c.ws || 1);
        const cx = c.at === 'tgt' ? T.x : L.Ag.x, cy = c.at === 'tgt' ? T.cy : L.Ag.y - L.idleH * 0.5;
        im.style.width = W + 'px'; im.style.height = H + 'px'; im.style.transformOrigin = '50% 50%';
        const a = `translate(${cx - W / 2}px,${cy - H / 2}px) scaleX(${f}) scale(0.92)`, z = `translate(${cx - W / 2}px,${cy - H / 2}px) scaleX(${f}) scale(1)`;
        im.animate(kfWin(w0, w1, a, z, false, last), { duration: D, fill: 'both' }).onfinish = () => im.remove();
        return;
      }
      if (c.at === 'ray') {
        // ジオル：胸の結晶から相手の体の中ほどへ伸ばす光線（クリスタルレイ・クリスタルノヴァ）。絵の左端＝出る所。相手側は左右反転
        const sx = L.Ag.x + f * L.idleW * 0.18, sy = L.Ag.y - L.idleH * 0.48, ex = T.x + f * T.w * (c.over || 0), ey = T.cy;   // over＝相手の先まで（クリスタルレイ）
        const len = Math.max(Math.hypot(ex - sx, ey - sy), L.idleW * 1.1), th = Math.atan2(ey - sy, ex - sx) * 180 / Math.PI;
        const W = len, H = Math.max(24, Math.min(L.idleH * 0.6, W * c.ph / c.pw));
        im.style.width = W + 'px'; im.style.height = H + 'px'; im.style.transformOrigin = '0% 50%';
        const ang = f > 0 ? th : th + 180, b0 = `translate(${sx}px,${sy - H / 2}px) rotate(${ang}deg) scaleX(${f})`;
        im.animate(kfWin(w0, w1, b0 + ' scale(0.2,1)', b0 + ' scale(1,1)', false, last), { duration: D, fill: 'both' }).onfinish = () => im.remove();
        return;
      }
      if (c.at === 'sprbeam') {
        // 2026-10-16（バトル最終統合）：専用の光線の絵（スターダストレイ A_01／A_02）。絵の発光点（ox・oy＝割合）をそのコマの口先へ・光の先（tip）を相手の奥へ。
        //  縦横比はそのまま（太さを変えない）。seg＝前の区切りから続く（伸びきった長さで出す）・fadeR＝右端の平らな切り口を溶かす割合
        const q = at(c.t[0]); if (!q) return;
        const m0 = mouthPt(q), m1 = mouthPt(q, true) || m0; if (!m0) return;
        const ex = T.x + f * T.w * 0.3, ey = m0.y * 0.4 + T.cy * 0.6;
        const L0 = Math.max(Math.hypot(ex - m0.x, ey - m0.y), L.idleW * 1.1), W = L0 / ((c.tip || 0.95) - c.ox), H = W * c.ph / c.pw;
        im.style.width = W + 'px'; im.style.height = H + 'px'; im.style.transformOrigin = `${c.ox * 100}% ${c.oy * 100}%`;
        if (c.fadeR) { const g = `linear-gradient(to right,#000 ${(1 - c.fadeR) * 100}%,transparent 100%)`; im.style.webkitMaskImage = g; im.style.maskImage = g; }
        im.dataset.mx = Math.round(m0.x); im.dataset.my = Math.round(m0.y); im.dataset.mf = q.c.f; im.dataset.ox = c.ox; im.dataset.oy = c.oy;
        const pose = (pt) => { const ang = Math.atan2(ey - pt.y, ex - pt.x) * 180 / Math.PI;
          return `translate(${pt.x - W * c.ox}px,${pt.y - H * c.oy}px) rotate(${f > 0 ? ang : ang + 180}deg) scaleX(${f})`; };
        im.animate(kfWin(w0, w1, pose(m0) + (c.seg ? ' scale(1)' : ' scale(0.12,0.7)'), pose(m1) + ' scale(1)', false, last), { duration: D, fill: 'both' }).onfinish = () => im.remove();
        return;
      }
      if (c.at === 'beam') {
        // 発射の姿（同じ区切りの本体のコマ）の口から相手の体の中ほどへ伸ばす。絵の左の光の玉が口・右の星が相手
        const q = at(c.t[0]), b = q.c.b, S = q.S, bw = b[2] - b[0], bh = b[3] - b[1];
        const mx = f > 0 ? b[2] - bw * 0.08 : q.c.pw - (b[2] - bw * 0.08), my = b[1] + bh * 0.4;
        // 2026-10-16（iPhone 01・02）：根元＝そのコマの口先（MMTUNE.MOUTH）。表に無いコマは従来の見積もり（体の範囲の前・上 40%）
        const m0 = mouthPt(q) || { x: q.p0.x + mx * S, y: q.p0.y + my * S }, m1 = mouthPt(q, true) || m0;
        // 相手が近くても短くしすぎない（待機の立ち絵の幅の 1.1倍以上）・口の高さと相手の中ほどの間へ・相手の中心の少し先まで
        const L0 = Math.max(Math.hypot(T.x + f * T.w * 0.2 - m0.x, m0.y * 0.45 + T.cy * 0.55 - m0.y), L.idleW * 1.1);
        const W = L0 / 0.92, H = Math.max(26, Math.min(L.idleH * 0.42, Math.max(L.idleH * 0.3, W * c.ph / c.pw))) * (c.thick || 1);   // thick＝極太（スターダストレイ）
        const pose = (pt) => { const ex = T.x + f * T.w * 0.2, ey = pt.y * 0.45 + T.cy * 0.55, ang = Math.atan2(ey - pt.y, ex - pt.x) * 180 / Math.PI;
          return `translate(${pt.x - W * 0.04}px,${pt.y - H / 2}px) rotate(${ang}deg)`; };   // 絵の左の光の玉（幅の 4%）＝口・右の星が相手
        im.style.width = W + 'px'; im.style.height = H + 'px'; im.style.transformOrigin = '4% 50%'; im.dataset.mx = Math.round(m0.x); im.dataset.my = Math.round(m0.y); if (mouthPt(q)) im.dataset.mf = q.c.f;
        im.animate(kfWin(w0, w1, pose(m0) + (c.seg ? ' scaleX(1)' : ' scaleX(0.15)'), pose(m1) + ' scaleX(1)', false, last), { duration: D, fill: 'both' }).onfinish = () => im.remove();
        return;
      }
      // 星群（空の門 → 降り注ぐ星 → 着弾の光）：相手の位置に合わせ、画面の左右の中に収める（端の淡い光を切らない）
      const p = FXP[c.at] || FXP.impact, ax = f > 0 ? p.ax : 1 - p.ax;
      let W = L.idleW * p.w;
      // 合わせる点から左右の端までが画面の中に入る幅
      const lim = Math.min((T.x - (L.xmin - 10)) / ax, ((L.xmax + 10) - T.x) / (1 - ax));
      W = Math.max(L.idleW * 1.1, Math.min(W, lim));
      const H = W * c.ph / c.pw, ay = c.at === 'sky' ? T.top + T.h * 0.5 : c.at === 'barrage' ? T.cy : T.cy + T.h * 0.2;   // 空の門＝星の足が相手の体の中ほどへ届く
      let x = T.x - W * ax, y = ay - H * p.ay; if (y < L.ytop - H * 0.15) y = L.ytop - H * 0.15;
      im.style.width = W + 'px'; im.style.height = H + 'px'; im.style.transformOrigin = '50% 50%';
      const a = `translate(${x}px,${y}px) scaleX(${f}) scale(0.94)`, z = `translate(${x}px,${y}px) scaleX(${f}) scale(1)`;
      im.animate(kfWin(w0, w1, a, z, false, last), { duration: D, fill: 'both' }).onfinish = () => im.remove();
    });
    setTimeout(() => imgs.forEach((im) => { if (im.parentNode) im.remove(); }), D + 400);
    const end = P.body / D;
    me.animate([{ opacity: 0, offset: 0 }, { opacity: 0, offset: Math.min(0.99, end - 0.02) }, { opacity: 1, offset: Math.min(1, end + 0.08) }, { opacity: 1, offset: 1 }], { duration: D });
    const ms = me.parentNode; if (ms && ms.style) { ms.style.zIndex = 7; setTimeout(() => { ms.style.zIndex = ''; }, D + 100); }
    // 2026-10-15：区切りの始めの揺れ・止め（shakeAt）と SE（sfxAt＝映像の決めの瞬間に合わせる）
    (tune.shakeAt || []).forEach((i) => { if (!P.win[i]) return; setTimeout(() => { try { const shake = G('shake'); if (shake && !reduced()) shake(v); hitStop(tune.hs || 90); } catch (er) { /* 無視 */ } }, P.win[i][0] + 30); });
    (tune.sfxAt || []).forEach(([i, se]) => { if (!P.win[i]) return; setTimeout(() => { try { if (root.MMAUDIO && root.MMAUDIO.se) root.MMAUDIO.se(se); } catch (er) { /* 無視 */ } }, P.win[i][0] + 40); });
    if (P.hit != null) {
      const SK = G('SK'), col = (SK && SK[k] && SK[k][3]) || '#ffd36a';
      if (tune.hs && !(tune.shakeAt || []).length) setTimeout(() => hitStop(tune.hs), P.hit);
      setTimeout(() => {
        try { const burst = G('burst'), knock = G('knock'), shake = G('shake'), flash = G('flash');
          if (burst) burst(v, T.x, T.cy, col, 14); if (knock) knock('#m' + (1 - s), f); if (shake) shake(v); if (flash) flash(col); } catch (er) { /* 無視 */ }
      }, P.hit);
    }
    return true;
  }
  /** 技のコマを先に読む。読めなかったコマがあれば、その技は従来の演出へ戻す（failed） */
  function warm(d) { if (d.tune && d.tune.v2 && root.MMSK19V2) root.MMSK19V2.warm(); d.cuts.concat(d.fx || []).forEach((c) => (c.u ? [c.u] : [c.f, c.fx].filter(Boolean).map((f) => (d.dir || OA) + f)).forEach((u) => { const i = new Image(); i.decoding = 'async'; i.onerror = () => failed.add(u); i.src = u; })); }
  function preloadOff(pl) { if (!pl) return; if (root.MMRD) [0, 1].forEach((s) => { if (pl[s] && (pl[s].eq || []).some((k) => root.MMRD.handles(k, pl[s].sp))) root.MMRD.warm(); }); [0, 1].forEach((s) => (pl[s] && pl[s].eq || []).forEach((k) => { const d = offData(k, s); if (d) warm(d); })); }
  /** 開発用のプレビュー（バトル画面が出ている間だけ）：kind＝'jiol'（正式No 1〜10）／'regnas'（正式No 1〜10）／'flurene'（登録の No 1〜10）。性能・番号の決まっていない技も、データのコマを順に見せるだけ（判定・ダメージ・セーブは触らない） */
  function preview(kind, no, s, opt) {
    if (kind === 'flurene' && no === 9 && root.MMRD) { const g = geom(s || 0); if (!g) return false; style(); return root.MMRD.play(-1, s || 0, g, root.MMRD.plan(true, true)); }   // 2026-10-16：09＝ルートドレイン（旧「生命のしずく」の雨の演出には戻さない）
    const d = tuned(kind === 'jiol' ? JOFF()[no] : kind === 'regnas' ? ROFF()[20 + no - 1] : kind === 'flurene' ? FLOFF()[no] : kind === 'razuck' ? ZOFF()[no] : null);
    if (!d || !usable(d)) return false;
    return animOff(-1, s || 0, d, Object.assign({ via: false, dmg: !!d.hit }, opt || {}));
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
    preloadOff(G('BPL'));
    if (on) { const pl = G('BPL'); if (pl) [0, 1].forEach((s) => (pl[s] && pl[s].eq || []).forEach((k) => { if (!handles(k, s)) return; DATA()[k].cuts.forEach((c) => { const i = new Image(); i.decoding = 'async'; i.src = A + c.f; }); })); }
  }
  if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
    const mo = new MutationObserver(() => { const bt = document.getElementById('bt'); if (bt && !bt.__p25) { bt.__p25 = true; setTimeout(() => setupBattle(bt), 30); } });
    const start = () => mo.observe(document.body, { childList: true, subtree: true });
    if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  }

  /** 2026-10-18 REV3 A6：QA の画面に出す「この技が実際に使うデータ」（通常の画面には出さない）。mode＝MMRD（ルートドレインの補修版）／コマ（2.5D）／従来の絵（控え） */
  function info(k, s) {
    try {
      if (rdOn(k, s)) { const F = root.MMRD.FRAMES || []; return { mode: 'MMRD（ルートドレイン補修版10コマ）', set: 'rootdrain-1016', first: F[0] || null, cuts: F.length, fx: 0, tune: null, fallback: false }; }
      const o = owner(k), d = offData(k, s);
      if (d) return { mode: 'コマ（2.5D の技アニメ）', set: ({ 0: 'soramo', 1: 'gauru', 2: 'nobiton', 3: 'jiol', 4: 'regnas', 5: 'flurene', 6: 'razuck' })[o] || '', first: (d.dir || OA) + d.cuts[0].f, cuts: d.cuts.length, fx: (d.fx || []).length, tune: d.tune ? d.tune.id : null, fallback: false };
      return { mode: '従来の絵（SKART・控え）', set: null, first: null, cuts: 0, fx: 0, tune: null, fallback: true, why: !offOn() ? 'battleArt=old' : SRC_OF[o] ? '読めないコマ／攻撃側の種族が違う' : 'コマのデータなし' };
    } catch (e) { return { mode: '（不明）', fallback: true }; }
  }
  root.MM25D = Object.freeze({ info, anim, handles, timing, layout, idleSrc, idleScale, set, syncIdle, get on() { return on; }, get offered() { return offered; }, owner, plan, planOff, offData, preview, warm, failed, IDLE, OFF_ASSET: OA });
})(typeof window !== 'undefined' ? window : globalThis);
