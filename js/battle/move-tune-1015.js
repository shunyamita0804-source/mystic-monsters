// =========================================================
// 2026-10-15 夜の一括依頼（PHASE B）：技アニメの試遊修正21件・体格サイズ1〜5（暫定プレビュー）・技の SE の鳴る時刻 `MMTUNE`
//  ・共通の座標系：技のコマは js/battle/art25d.js の layout が「待機立ち絵の実際の大きさ（.mma-idle の矩形）」から大きさと足もとを決める。
//    体格サイズ（下の SIZE）を変えると待機立ち絵の大きさ（arena.js の --mma-k）が変わり、技のコマ・発射の起点（口・胸）・着弾の位置（相手の胸）も
//    同じ矩形から計算し直される＝21件の座標を個別に直したあとでサイズを変えても、やり直しにならない。
//  ・技ごとの修正（MOVES）：データ（*-moves-data.js）は変えず、表示のときだけ上書きする（patch）。キー＝その技の最初のコマのファイル（フォルダ/ファイル名）。
//      stay＝その場のコマ（self・lunge・back）を前へ出さない（射撃の技）／hit＝当たる区切りの番号（1 から）／sc＝技全体の大きさの倍率
//      cutSet[src]＝コマごとの上書き（m＝動き・r＝[始め, 終わり] 相手までの距離の割合・arc＝跳ぶ高さ（待機の高さに対する比）・lift＝浮く量・cs＝そのコマだけの大きさの倍率・rot＝傾き）
//      detach＝体と同じ画面に描かれた効果の層（c.fx）を体から外して、別の動き（launch＝相手へ飛ぶ／stretch＝口から相手へ伸びる）で見せる。fb＝絵の中の効果の範囲（画素）
//      fxSet[src]＝効果の層の上書き（t＝見せる区切り・over＝光線が相手の先まで届く量 など）／drop＝出さない効果／addFx＝足す効果（既存の素材だけ）／cuts・fx＝並びを丸ごと差し替え
//      sfxAt＝その区切りの始めに鳴らす SE（映像に合わせる）／shakeAt＝その区切りの始めに画面を揺らす・止める
//  ・体格サイズ（A1〜A6）：分類は種族ごとに固定（能力・判定・技の性能・行動順には関係しない＝見た目だけ）。
//    表示の倍率は【暫定・未承認】＝URL に ?mmSize=1（または window.MM_SIZE_PREVIEW = true）のときだけ効く。通常の URL では今までの大きさのまま。
//  ・技の SE：技の SE（index.html の skSfx＝合成音）は一定の時刻（約0.55〜0.9秒）に当たりの音を鳴らすが、技のコマの当たり（1.5〜2.7秒＋構え・溜め）とずれていた
//    → コマで見せる技だけ、当たりの音がコマの当たりと同じ時刻になるように鳴らし始めを遅らせる（音そのものは変えない）。
//  変えないもの：fight()・battle-bridge・adapter・Battle Engine・技の性能・ルーレット・.bt 系 CSS（Phase 6）・セーブ。
// =========================================================
(function (root) {
  'use strict';
  const G = (name) => { try { return (0, eval)(name); } catch (e) { return undefined; } };

  // ---- 体格サイズ（A2・A3）----
  const SIZE_NAME = Object.freeze({ 1: '極小型', 2: '小型', 3: '中型', 4: '大型', 5: '規格外' });
  /** 種族（バトルの番号）→ 体格サイズ。ラズック（1）は未登録＝ここには入れない（マスターデータ案は報告書）。5 は予約（今は誰もいない） */
  const SIZE = Object.freeze({ 0: 2, 1: 3, 2: 2, 3: 4, 4: 3, 5: 3 });
  /** 表示の倍率（今の一律の表示＝100%）。【暫定・プレビュー専用】ユーザーの iPhone 確認のあとで決める */
  const SIZE_K = Object.freeze({ 1: 0.70, 2: 0.80, 3: 0.90, 4: 1.00, 5: 1.15 });
  /** 見かけの大きさの微調整（翼・角・葉が外へ大きく出る絵は、同じ倍率だと大きく見える）【暫定】 */
  const FINE = Object.freeze({ 1: 0.97, 4: 0.97, 5: 0.95 });
  const sizePreview = () => {
    if (root.MM_SIZE_PREVIEW != null) return !!root.MM_SIZE_PREVIEW;
    try { return /[?&]mmSize=1(&|$)/.test(root.location.search); } catch (e) { return false; }
  };
  const sizeOf = (sp) => SIZE[sp] || 3;
  /** 待機立ち絵などに掛ける倍率（プレビューのときだけ。それ以外は 1＝今まで） */
  const sizeK = (sp) => (sizePreview() && SIZE[sp] ? SIZE_K[SIZE[sp]] * (FINE[sp] || 1) : 1);

  // ---- 体の目印（待機立ち絵に対する割合・右向き）。口＝光線・弾の出る所、頭＝頭突き、拳＝叩きつけ、胸＝着弾の中心 ----
  const ANCHOR = Object.freeze({
    0: { mouth: [0.68, 0.48], head: [0.66, 0.36], fist: [0.80, 0.92], chest: [0.60, 0.62] },
    1: { mouth: [0.84, 0.55], head: [0.78, 0.49], fist: [0.76, 0.80], chest: [0.62, 0.64] },
    2: { mouth: [0.86, 0.88], head: [0.70, 0.18], fist: [0.30, 0.42], chest: [0.46, 0.64] },
    3: { mouth: [0.72, 0.30], head: [0.73, 0.28], fist: [0.76, 0.70], chest: [0.60, 0.46] },
    4: { mouth: [0.88, 0.30], head: [0.80, 0.26], fist: [0.78, 0.86], chest: [0.60, 0.55] },
    5: { mouth: [0.56, 0.40], head: [0.55, 0.24], fist: [0.20, 0.55], chest: [0.55, 0.56] },
  });

  const C = './assets/battle/common/';
  // ---- 技ごとの修正（21件）----
  const MOVES = {
    // 01 ソラモビーム：その場で口から撃つ（前へ出ない）・光線を次の区切り（反動の姿）まで残す
    'soramo_moves_1012/05_01.webp': { id: '01', stay: true, fxSet: { SORAMO_BEAM_3: { t: [1, 2] } } },
    // 02 スターダストレイ：技カード・資料（assets/moves/solamo/09_stardust_ray）は「口から極太の光線」。コマに光線が無い＝同じソラモの光線（05_03）を太く・長く
    //    【暫定】専用の光線（青白い星の光）は発注（報告書）
    'soramo_moves_1012/08_01.webp': { id: '02', stay: true, addFx: [{ src: 'SDR_BEAM', f: '05_03.webp', at: 'beam', t: [3, 4], pw: 567, ph: 209, thick: 1.9 }] },
    // 03 スターフォール：四角い切れ目は素材の修正（tools/battlefix1015/apply.py：絵の端で切れている光を端へ向けて透明に）
    // 04 ファイアボール：口元の火球を相手まで飛ばす（体当たりにしない）→ 着弾の爆発
    'gauru_moves_1012/15_01.webp': { id: '04', stay: true, detach: [{ cut: 'G15_2', at: 'launch', fb: [118, 134, 467, 320], t: [1, 1] }] },
    // 05 フレアレイ：口から相手まで伸びる光線
    'gauru_moves_1012/16_01.webp': { id: '05', stay: true, detach: [{ cut: 'G16_2', at: 'stretch', fb: [119, 175, 497, 233], t: [1, 2], mouth: [0.95, 0.34] }] },
    // 06 フェザーストーム：最後の渦巻き（18_05_fx）を出さない。羽根の嵐（18_04_fx）を余韻まで
    'gauru_moves_1012/18_01.webp': { id: '06', drop: ['G18_5_fx'], fxSet: { G18_4_fx: { t: [3, 4] } } },
    // 07 聖なる炎：相手へ動かない。その場で少し上昇 → 中心から赤・青・白の放射が広がる → 相手へ届いて命中 → 着地
    //    既存の素材（sp_aura1・sp_aura2＝赤・青・白の放射、sp_buff＝金の加護）だけで組み直し。【暫定】専用の放射の弾・着弾は発注（報告書）
    'gauru_moves_1012/19_01.webp': {
      id: '07', hit: 5,
      cuts: [
        { src: 'G19_1', f: '19_01.webp', fx: '19_01_fx.webp', m: 'self', t: [0, 0], lift: -0.03 },
        { src: 'G19_2', f: '19_02.webp', fx: '19_02_fx.webp', m: 'self', t: [1, 1], lift: -0.12 },
        { src: 'G19_4', f: '19_04.webp', fx: '19_04_fx.webp', m: 'self', t: [2, 3], lift: -0.15 },
        { src: 'G19_5', f: '19_05.webp', m: 'self', t: [4, 4], lift: -0.07 },
        { src: 'G19_6', f: '19_06.webp', m: 'self', t: [5, 5] },
      ],
      fx: [
        { src: 'G19_aura1', f: 'sp_aura1.webp', at: 'aura', t: [2, 2] },
        { src: 'G19_aura2', f: 'sp_aura2.webp', at: 'launch', from: 'self', t: [3, 3], grow: [0.45, 1.05] },
        { src: 'G19_hit', f: 'sp_aura1.webp', at: 'tgt', t: [4, 4], ws: 0.75 },
        { src: 'G19_buff', f: 'sp_buff.webp', at: 'self', t: [5, 5] },
      ],
      shakeAt: [4],
    },
    // 08 はなビンタ：命中のときの「本物の鼻」＝ダメージの数字の横の絵文字 👃（iPhone では写実的な鼻）→ js/battle/rules.js の絵文字を 💫 に（ここでは何もしない）
    // 10 ずつき：鼻で押すのではなく、頭を前に出して当てる＝当たる姿を前へ傾けて、頭の高さで相手に当てる（専用の頭突きの姿は発注）
    'nobiton_moves_1012/31_01.webp': { id: '10', cutSet: { N31_3: { r: [0.26, 0.34], rot: 14, lift: 0.04 } } },
    // 11 ひとやすみ：輪郭の松葉模様は素材の修正（apply.py）
    // 12〜14 ジオルの市松は素材の修正（apply.py）。13 のしかかり：跳んで相手の上へ着地 → 揺れ
    'jiol_moves_1012/j04_01.webp': { id: '13', cutSet: { J4_2: { m: 'move', r: [0.05, 0.62], arc: 0.6 }, J4_3: { m: 'contact', r: [0.72, 0.72] } }, shakeAt: [2] },
    // 14 グランドハンマー：跳ぶ → 相手の近くへ着地 → 拳を叩きつける
    'jiol_moves_1012/j05_01.webp': { id: '14', cutSet: { J5_2: { m: 'move', r: [0.0, 0.42], arc: 0.45 }, J5_3: { m: 'contact', r: [0.46, 0.46] }, J5_4: { m: 'contact', r: [0.46, 0.46] } }, shakeAt: [2, 3] },
    // 15 クリスタルレイ：その場で撃つ・光線を相手の先まで長く・着弾まで残す
    'jiol_moves_1012/j06_01.webp': { id: '15', stay: true, fxSet: { J6_3_fx: { t: [2, 3], over: 0.4 } } },
    // 16 ロックアッパー：突き上げの姿（j08_03）は元の絵で体が小さく描かれている＝そのコマだけ体の大きさをそろえる
    'jiol_moves_1012/j08_01.webp': { id: '16' },   // 共通スケール（体の面積をそろえる＝art25d.js の areaScales）で j08_03 は自動で約1.4倍＝個別の値は要らない
    // 17 竜眼ロック：照準の緑は素材の修正（apply.py）
    // 18 蒼刃乱舞：最後の決めの斬撃（7 枚目）に合わせて斬撃の音と揺れ
    'regnas_moves_1012/28_01.webp': { id: '18', sfxAt: [[6, 'BATTLE_CRIT']], shakeAt: [6] },
    // 19 フルーネ技03：花粉の雲・風の筋を相手まで飛ばす → 相手の位置で舞う葉（当たり）
    'flurene_moves_1015/f03_b01.webp': {
      id: '19', hit: 4,
      detach: [
        { cut: 'F3_2', at: 'launch', fb: [23, 159, 579, 456], t: [1, 2], grow: [0.55, 0.85] },
        { cut: 'F3_3', at: 'launch', fb: [14, 129, 584, 476], t: [2, 3], grow: [0.6, 0.9] },
        { cut: 'F3_4', at: 'tgt', t: [3, 3] },
      ],
    },
    // 20 フルーネ技09（必殺）：溜め → 解放（しずくが相手へ）→ 主攻撃（光の雨が相手へ）→ 大きな着弾 → ヒットストップ → 余韻
    //    着弾は共通演出の正式素材（bc07＝クリティカル）。【未完成】専用の溜め・着弾の絵は発注（報告書）
    'flurene_moves_1015/f09_b01.webp': {
      id: '20', hit: 4, hs: 160,
      charge: { t: [0, 0], c1: '#c8ffb0', c2: '#fff6c8' },
      detach: [
        { cut: 'F9_2', at: 'launch', fb: [138, 66, 472, 362], t: [1, 2], grow: [0.6, 1.0] },
        { cut: 'F9_3', at: 'tgt', t: [2, 3], ws: 1.2 },
      ],
      addFx: [{ src: 'F9_impact', u: C + 'bc07_critical.webp', at: 'tgt', t: [3, 3], pw: 512, ph: 512, ws: 1.25 }],
      shakeAt: [3],
    },
    // 21 フルーネ技10：相手の位置で見える着弾（共通演出の正式素材 bc06＋bc07）・被弾・ヒットストップ。【未完成】根の専用の絵は発注
    'flurene_moves_1015/f10_b01.webp': {
      id: '21', hit: 5, hs: 140,
      addFx: [
        { src: 'F10_hit', u: C + 'bc06_hit.webp', at: 'tgt', t: [3, 3], pw: 512, ph: 512, ws: 0.95 },
        { src: 'F10_crit', u: C + 'bc07_critical.webp', at: 'tgt', t: [4, 4], pw: 512, ph: 512, ws: 1.3 },
      ],
      shakeAt: [3, 4],
    },
  };
  // 共通演出の正式素材の大きさ（画素）＝読み込み前でも置き方が決まる
  const keyOf = (d, dir) => { const c = d && d.cuts && d.cuts[0]; if (!c) return null; const m = /([^/]+)\/$/.exec(dir || ''); return (m ? m[1] : 'soramo_moves_1012') + '/' + c.f; };
  const cache = new WeakMap();
  /** 表示のときだけ技のデータを上書きした写しを返す（元のデータは変えない）。修正の無い技はそのまま */
  function patch(d, dir) {
    if (!d || !d.cuts) return d;
    if (cache.has(d)) return cache.get(d);
    const t = MOVES[keyOf(d, dir)];
    if (!t) { cache.set(d, d); return d; }
    const byCut = {}; d.cuts.forEach((c) => { byCut[c.src] = c; });
    let cuts = (t.cuts ? t.cuts.map((c) => Object.assign({}, byCut[c.src] || {}, c)) : d.cuts.map((c) => Object.assign({}, c)));
    const byFile = {}; (d.fx || []).forEach((c) => { byFile[c.f] = c; });
    let fx = (t.fx ? t.fx.map((c) => Object.assign({ pw: (byFile[c.f] || {}).pw, ph: (byFile[c.f] || {}).ph }, c)) : (d.fx || []).map((c) => Object.assign({}, c)));
    cuts.forEach((c) => { if (t.cutSet && t.cutSet[c.src]) Object.assign(c, t.cutSet[c.src]); });
    // 体と同じ画面に描かれた効果を外へ出す（同じ大きさ＝コマの元の枠 pw・ph）
    (t.detach || []).forEach((x) => {
      const c = cuts.find((q) => q.src === x.cut); if (!c || !c.fx) return;
      fx.push(Object.assign({ src: c.src + '_fx', f: c.fx, pw: c.pw, ph: c.ph, ref: c.src, t: c.t.slice() }, x));
      delete c.fx;
    });
    if (t.drop) fx = fx.filter((c) => !t.drop.includes(c.src));
    fx.forEach((c) => { if (t.fxSet && t.fxSet[c.src]) Object.assign(c, t.fxSet[c.src]); });
    (t.addFx || []).forEach((c) => fx.push(Object.assign({}, c)));
    // 元の枠（pw・ph）・本体の範囲（b）が無い差し替えのコマは、同じ技のほかのコマから借りる（大きさの見積もりに使う）
    cuts.forEach((c) => { if (!c.b) { const o = byCut[c.src] || d.cuts[0]; c.b = o.b; c.pw = c.pw || o.pw; c.ph = c.ph || o.ph; } });
    const out = Object.assign({}, d, { cuts, fx, tune: t });
    if (t.hit != null) out.hit = t.hit;
    if (t.stay) out.stay = true;
    cache.set(d, out);
    return out;
  }

  // ---- 技の SE の鳴る時刻（C1）----
  // skSfx の合成音の「当たり」の時刻（秒）＝index.html の skSfx の中の hit(…) の最初の値。技の種類（SKM[k][0]）ごと
  const SYNTH_HIT = { go: 0.65, claw: 0.65, slash: 0.72, tail: 0.72, rush: 0.6, drill: 0.73, peck: 0.55, ball: 0.88 };
  let pend = null;      // anim(k,s) の直後に呼ばれた skSfx(k) を、コマの当たりまで待たせる
  let lastAnim = null;  // 直前の anim(k, s)
  /** art25d の animOff が始まったとき（P＝その技の時間）。待っている SE があれば当たりに合わせて鳴らす */
  function onAnimStart(k, s, P) {
    if (!pend || pend.k !== k) return;
    const p = pend; pend = null; clearTimeout(p.timer);
    const SKM = G('SKM'), m = (SKM && SKM[k] && SKM[k][0]) || 'go', lead = (SYNTH_HIT[m] != null ? SYNTH_HIT[m] : 0.62) * 1000;
    const at = P && P.hit != null ? Math.max(0, P.hit - lead) : 0;
    p.log.wait = Math.round(performance.now() - p.t0 + at);
    setTimeout(() => { try { p.fn(); } catch (e) { /* 無視 */ } }, at);
  }
  const sfxLog = [];
  function wrapSe() {
    const A = root.anim, F = root.skSfx;
    if (typeof A === 'function' && !A.__mmtune) {
      const W = function (k, s) { lastAnim = { k, s, t: performance.now() }; return A.apply(this, arguments); };
      W.__mmtune = true; root.anim = W;
    }
    if (typeof F === 'function' && !F.__mmtune) {
      const W = function (k) {
        const self = this, args = arguments, M = root.MM25D;
        const fresh = lastAnim && lastAnim.k === k && performance.now() - lastAnim.t < 80;
        if (!fresh || !M || !M.handles || !M.handles(k, lastAnim.s)) return F.apply(self, args);
        if (pend) { clearTimeout(pend.timer); try { pend.fn(); } catch (e) { /* 無視 */ } }
        const log = { k, s: lastAnim.s, wait: null }; sfxLog.push(log); if (sfxLog.length > 40) sfxLog.shift();
        pend = { k, t0: performance.now(), log, fn: () => F.apply(self, args) };
        pend.timer = setTimeout(() => { if (pend && pend.log === log) { const p = pend; pend = null; log.wait = 'timeout'; try { p.fn(); } catch (e) { /* 無視 */ } } }, 2600);   // コマが始まらなかった（読めない・止まった）ときは鳴らす
        return undefined;
      };
      W.__mmtune = true; root.skSfx = W;
    }
  }
  if (root.document) { if (root.document.readyState !== 'loading') setTimeout(wrapSe, 0); else root.addEventListener('DOMContentLoaded', () => setTimeout(wrapSe, 0)); }

  root.MMTUNE = Object.freeze({ SIZE, SIZE_K, SIZE_NAME, FINE, ANCHOR, MOVES, sizePreview, sizeOf, sizeK, patch, keyOf, onAnimStart, sfxLog: () => sfxLog.slice(), wrapSe });
})(typeof window !== 'undefined' ? window : globalThis);
