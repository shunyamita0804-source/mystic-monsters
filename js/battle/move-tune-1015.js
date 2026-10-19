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
//    表示の倍率＝正式の SIZE_K（2026-10-19：比較の切り替えは撤去）。
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
  //  2026-10-18 REV3 F0-3（正式）：ラズック1・ソラモ2・ノビトン2・ガウル3・フルーネ3・レグナス3・ジオル4（5＝厄災級だけ＝今は誰もいない）
  const SIZE = Object.freeze({ 0: 2, 1: 3, 2: 2, 3: 4, 4: 3, 5: 3, 6: 1, 7: 3, 8: 2 });   // 2026-10-18：7＝カルシェル（正式仕様＝サイズ 3・登録のみ）・2026-10-19：8＝ミュロル（正式仕様＝サイズ 2・登録のみ）
  /** 表示の倍率＝正式（2026-10-18 REV3 F0-3 で決定・2026-10-19 次便で一本化）。サイズ3＝今までの大きさ（100）。
   *  390×844・375×667・393×852 の公式戦・練習試合で HP の帯・技名・画面の左右の枠に重ならない範囲（実測は tools/rev3_1018/size_fit.mjs）。
   *  2026-10-19：旧い比較案（従来の一律・暫定 70/80/90/100/115%・案A・案B・?mmSize・?mmSizeAs・MM_QA_SIZE・MM_SIZE_PREVIEW）は撤去 */
  const SIZE_K = Object.freeze({ 1: 0.70, 2: 0.84, 3: 1.00, 4: 1.14, 5: 1.30 });
  /** 見えている体の高さ（待機立ち絵の不透明な部分の高さ ÷ 絵の高さ × arena.js の SCALE）＝tools で測った値。種族の絵の高さの差を打ち消して、目標の比にそろえる */
  const VIS_H = Object.freeze({ 0: 0.900, 1: 0.909, 2: 0.869, 3: 0.902, 4: 0.902, 5: 0.900, 6: 0.900, 7: 0.900, 8: 0.906 });   // 7＝カルシェル（待機絵は余白を切った派生＝体の高さ ÷ 絵の高さ 1.0 × SCALE 0.91 ≒ 0.90）・8＝ミュロル（0.996 × 0.91）
  const VIS_H3 = (VIS_H[1] + VIS_H[4] + VIS_H[5]) / 3;   // サイズ3（ガウル・レグナス・フルーネ）の平均＝100
  /** いつも正式（互換のため関数は残す） */
  const sizeMode = () => 'F';
  const sizeOf = (sp) => SIZE[sp] || 3;
  /** 待機立ち絵などに掛ける倍率（見えている体の高さの差を打ち消して、正式の比にそろえる） */
  const sizeK = (sp) => VIS_H3 * SIZE_K[sizeOf(sp)] / (VIS_H[sp] || VIS_H3);

  // ---- 体の目印（待機立ち絵に対する割合・右向き）。口＝光線・弾の出る所、頭＝頭突き、拳＝叩きつけ、胸＝着弾の中心 ----
  const ANCHOR = Object.freeze({
    0: { mouth: [0.68, 0.48], head: [0.66, 0.36], fist: [0.80, 0.92], chest: [0.60, 0.62] },
    1: { mouth: [0.84, 0.55], head: [0.78, 0.49], fist: [0.76, 0.80], chest: [0.62, 0.64] },
    2: { mouth: [0.86, 0.88], head: [0.70, 0.18], fist: [0.30, 0.42], chest: [0.46, 0.64] },
    3: { mouth: [0.72, 0.30], head: [0.73, 0.28], fist: [0.76, 0.70], chest: [0.60, 0.46] },
    4: { mouth: [0.88, 0.30], head: [0.80, 0.26], fist: [0.78, 0.86], chest: [0.60, 0.55] },
    5: { mouth: [0.56, 0.40], head: [0.55, 0.24], fist: [0.20, 0.55], chest: [0.55, 0.56] },
  });

  // ---- 口先（発射点）：技のコマの絵の中の画素（右向き・コマの元の枠）。2026-10-16 iPhone 01・02・04・05 ----
  //  体の範囲（b）の割合や胸・前端を口の代わりにしない＝コマごとに絵を拡大して測った口の開いている所の前（開いた上下の嘴・口の間）。
  //  光線（beam・stretch）は区切りごとにその区切りのコマの口先から出し直す（姿勢が変わっても根元が口から離れない）。火球（launch）は口先で生まれて相手へ飛ぶ。
  //  反転（相手側）・回転・体格サイズは art25d の mouthPt がコマの置き方と同じ式で画面の位置へ直す。表に無いコマ＝従来の置き方
  const MOUTH = Object.freeze({
    'soramo_moves_1012/05_02.webp': [436, 252],   // ソラモビーム：発射の姿（舌の前の端＋口の開き）
    'soramo_moves_1012/08_04.webp': [315, 214],   // スターダストレイ：本命の発射
    'soramo_moves_1012/08_05.webp': [266, 203],   // スターダストレイ：撃ち続ける姿
    'gauru_moves_1012/15_02.webp': [567, 207],    // ファイアボール：嘴を開いて吐く
    'gauru_moves_1012/16_02.webp': [510, 221],    // フレアレイ：発射
    'gauru_moves_1012/16_03.webp': [500, 215],    // フレアレイ：撃ち続ける姿
    // 2026-10-16（iPhone 6件 A4）：フレアレイの溜めの姿（嘴を閉じた先）＝溜めの光をここへ（素材の溜めの光は肩の位置に描かれている）
    'gauru_moves_1012/16_01.webp': [532, 226],
    // 2026-10-18 REV3 A4：ジオインパクトの吹き飛ばしの姿の前の拳（衝撃波の根元）
    'jiol_moves_1012/j09_08.webp': [470, 290],
  });
  const qs = (() => { try { return new URLSearchParams(root.location ? root.location.search : ''); } catch (e) { return null; } })();
  const mouthOf = (dir, f) => { const m = /([^/]+)\/$/.exec(dir || ''); return MOUTH[(m ? m[1] : 'soramo_moves_1012') + '/' + f] || null; };

  const C = './assets/battle/common/';
  // ---- 技ごとの修正（21件）----
  const MOVES = {
    // 01 ソラモビーム：その場で口から撃つ（前へ出ない）・光線を次の区切り（反動の姿）まで残す
    //    2026-10-16 iPhone 01：光線の根元＝そのコマの口先（上の MOUTH）。口を閉じた反動の姿（05_04）では光線を出さない＝発射の姿（05_02）の区切りだけ
    'soramo_moves_1012/05_01.webp': { id: '01', stay: true, fxSet: { SORAMO_BEAM_3: { t: [1, 1] } } },
    // 02 スターダストレイ：2026-10-16（バトル最終統合）ユーザー承認の専用の青紫・星屑の光線2枚（Part01 の A_01 extend・A_02 peak）。
    //    旧：ソラモビームの光線（05_03）の1.9倍の流用・?sk08=blue の CSS の試作＝やめた。発光点（絵の x 215/2048・y 280/512）をそのコマの口先（MOUTH）へ
    //    区切り3（08_04＝本命の発射）＝extend が口から相手へ伸びる・区切り4（08_05＝撃ち続ける）＝peak（右端の平らな切り口は相手の奥で溶かす）
    'soramo_moves_1012/08_01.webp': { id: '02', stay: true, addFx: [
      { src: 'SDR_A01', f: '08_a01_fx.webp', at: 'sprbeam', t: [3, 3], pw: 1024, ph: 256, ox: 215 / 2048, oy: 280 / 512, tip: 0.955 },
      { src: 'SDR_A02', f: '08_a02_fx.webp', at: 'sprbeam', t: [4, 4], pw: 1024, ph: 256, ox: 215 / 2048, oy: 280 / 512, tip: 0.86, fadeR: 0.12, seg: 1 },
    ] },
    // 03 スターフォール：四角い切れ目は素材の修正（tools/battlefix1015/apply.py：絵の端で切れている光を端へ向けて透明に）
    // 04 ファイアボール：口元の火球を相手まで飛ばす（体当たりにしない）→ 着弾の爆発
    'gauru_moves_1012/15_01.webp': { id: '04', stay: true, detach: [{ cut: 'G15_2', at: 'launch', fb: [118, 134, 467, 320], t: [1, 1], fromMouth: true, grow: [0.3, 1.0] }] },   // 2026-10-16 iPhone 04：嘴の口先で小さく生まれて相手の胸へ
    // 05 フレアレイ：口から相手まで伸びる光線
    // 2026-10-18 REV3 A1：iPhone 実機で「古い黄色い細いレーザー」（16_02_fx）＝最終余白調整版（1012）の効果の層そのものが黄色の細線だった。
    //    ユーザー採用の見た目＝技カード 08_flare_ray・2.5D 完全版（2p5d/gauru/16_02〜06＝納品シート g08／g08b）の「嘴から放射される赤い炎の光線」。
    //    → 黄色の細線（G16_2_fx）は出さない。光線＝2.5D 完全版の g08_3（16_03）・g08b_2（16_05）から嘴の先より右を切り出した層（tools/rev3_1018/derive_flare.py・絵は描き直していない）を、
    //      区切りごとの嘴の口先（MOUTH）から相手の奥まで伸ばす（sprbeam＝縦横比のまま）。区切り1＝発射（16_beam_a）・区切り2＝撃ち続ける（16_beam_b・seg）
    'gauru_moves_1012/16_01.webp': { id: '05', stay: true, detach: [{ cut: 'G16_2', at: 'stretch', fb: [119, 175, 497, 233], t: [1, 2] },
      { cut: 'G16_1', at: 'mouth', fb: [205, 98, 385, 288], t: [0, 0], grow: [0.45, 0.9] }],   // 2026-10-16（iPhone 6件 A4）：溜めの光（素材では肩の位置）を嘴の先へ＝溜め → 発射が同じ点
      drop: ['G16_2_fx'],
      addFx: [
        { src: 'G16_beamA', f: '16_beam_a.webp', at: 'sprbeam', t: [1, 1], pw: 272, ph: 296, ox: 0.02, oy: 0.53, tip: 0.9 },
        { src: 'G16_beamB', f: '16_beam_b.webp', at: 'sprbeam', t: [2, 2], pw: 294, ph: 306, ox: 0.02, oy: 0.52, tip: 0.92, fadeR: 0.08, seg: 1 },
      ] },
    // 2026-10-18 REV3 A2：ソニックムーブ（SK13・技04）の最後に出ていた黄色と青のキラキラ（sp_buff＝バフの特殊エフェクト）を出さない。
    //    命中の見せ場（13_02〜13_04 の本体と効果）・回避アップの判定・能力の印（fight() の efBurst）は変えない
    'gauru_moves_1012/13_01.webp': { id: 'A2', drop: ['G13_buff'] },
    // 06 フェザーストーム：最後の渦巻き（18_05_fx）を出さない。羽根の嵐（18_04_fx）を余韻まで
    'gauru_moves_1012/18_01.webp': { id: '06', drop: ['G18_5_fx'], fxSet: { G18_4_fx: { t: [3, 4] } } },
    // 07 聖なる炎：相手へ動かない。その場で少し上昇 → 中心から赤・青・白の放射が広がる → 相手へ届いて命中 → 着地
    //    既存の素材（sp_aura1・sp_aura2＝赤・青・白の放射、sp_buff＝金の加護）だけで組み直し。【暫定】専用の放射の弾・着弾は発注（報告書）
    //    2026-10-16 V2（ユーザー承認の試写）：v2＝js/battle/sk19-v2-1016.js の専用の時間軸（飛行2枚・胸中心の放射4枚）。下の cuts・fx は ?sk19=v1・V2 の絵が読めないときの代わり
    'gauru_moves_1012/19_01.webp': {
      id: '07', hit: 5, v2: true,
      cuts: [
        { src: 'G19_1', f: '19_01.webp', fx: '19_01_fx.webp', m: 'self', t: [0, 0], lift: -0.03 },
        { src: 'G19_2', f: '19_02.webp', fx: '19_02_fx.webp', m: 'self', t: [1, 1], lift: -0.12 },
        { src: 'G19_4', f: '19_04.webp', fx: '19_04_fx.webp', m: 'self', t: [2, 3], lift: -0.15 },
        { src: 'G19_5', f: '19_05.webp', m: 'self', t: [4, 4], lift: -0.07 },
        { src: 'G19_6', f: '19_06.webp', m: 'self', t: [5, 5] },
      ],
      fx: [
        // 2026-10-16 iPhone 06：三色の炎の輪は浮いたガウルの体の中心から外へ広がるだけ（相手へ飛ばさない）。相手の当たりは別の表現（共通演出の正式素材 bc06）
        { src: 'G19_aura1', f: 'sp_aura1.webp', at: 'aura', onBody: true, t: [2, 2] },
        { src: 'G19_aura2', f: 'sp_aura2.webp', at: 'aura', onBody: true, t: [3, 3], ws: 1.05, grow: [0.55, 1.12] },
        { src: 'G19_hit', u: C + 'bc06_hit.webp', at: 'tgt', t: [4, 4], pw: 512, ph: 512, ws: 0.9 },
        { src: 'G19_buff', f: 'sp_buff.webp', at: 'self', t: [5, 5] },
      ],
      shakeAt: [4],
    },
    // 08 はなビンタ：命中のときの「本物の鼻」＝ダメージの数字の横の絵文字 👃（iPhone では写実的な鼻）→ js/battle/rules.js の絵文字を 💫 に（ここでは何もしない）
    // 10 ずつき：鼻で押すのではなく、頭を前に出して当てる＝当たる姿を前へ傾けて、頭の高さで相手に当てる（専用の頭突きの姿は発注）
    //    2026-10-16（バトル最終統合）：ユーザー承認の専用の本体2枚（Part01 の B_01 溜め・B_02 額から踏み込む突進＝鼻は顔の前から下へ1本）に差し替え。
    //    溜め（B01）→ 額を低く前へ出して相手へ（B02・move）→ 当たり（B02・contact＝短いヒットストップと揺れ）→ 戻る（B01・back）→ 待機。2枚とも足もとは同じ（原本 y 1140）
    'nobiton_moves_1012/31_01.webp': { id: '10', hs: 110, shakeAt: [2], fxSet: { N31_3_fx1: { ws: 0.55 } }, cuts: [
      { src: 'N31_1', f: '31_b01.webp', name: 'B_01_nobiton_headbutt_windup.png', m: 'self', t: [0, 0], pw: 603, ph: 451, x: 0, y: 0, w: 603, h: 451, b: [9, 9, 569, 442] },
      { src: 'N31_2', f: '31_b02.webp', name: 'B_02_nobiton_headbutt_contact.png', m: 'move', t: [1, 1], pw: 603, ph: 451, x: 0, y: 0, w: 603, h: 451, b: [35, 182, 594, 442] },
      { src: 'N31_3', f: '31_b02.webp', name: 'B_02_nobiton_headbutt_contact.png', m: 'contact', t: [2, 2], pw: 603, ph: 451, x: 0, y: 0, w: 603, h: 451, b: [35, 182, 594, 442] },
      { src: 'N31_4', f: '31_b01.webp', name: 'B_01_nobiton_headbutt_windup.png', m: 'back', t: [3, 3], pw: 603, ph: 451, x: 0, y: 0, w: 603, h: 451, b: [9, 9, 569, 442] },
    ] },
    // 11 ひとやすみ：輪郭の松葉模様は素材の修正（apply.py）
    // 12〜14 ジオルの市松は素材の修正（apply.py）。13 のしかかり：跳んで相手の上へ着地 → 揺れ
    'jiol_moves_1012/j04_01.webp': { id: '13', cutSet: { J4_2: { m: 'move', r: [0.05, 0.62], arc: 0.6 }, J4_3: { m: 'contact', r: [0.72, 0.72] } }, shakeAt: [2] },
    // 14 グランドハンマー：跳ぶ → 相手の近くへ着地 → 拳を叩きつける
    'jiol_moves_1012/j05_01.webp': { id: '14', cutSet: { J5_2: { m: 'move', r: [0.0, 0.42], arc: 0.45 }, J5_3: { m: 'contact', r: [0.46, 0.46] }, J5_4: { m: 'contact', r: [0.46, 0.46] } }, shakeAt: [2, 3] },
    // 15 クリスタルレイ：その場で撃つ・光線を相手の先まで長く・着弾まで残す
    'jiol_moves_1012/j06_01.webp': { id: '15', stay: true, fxSet: { J6_3_fx: { t: [2, 3], over: 0.4 } } },
    // 16 ロックアッパー
    // 2026-10-18 REV3 A3：3コマ目 j08_03（拳を突き上げる）は体の面積が他のコマの約半分＝共通スケールの上限で縮み、小さい旧ジオルに見えた
    //  → 当たりのコマは同じ技の打ち上げの姿（j08_02）を相手の手前で見せる。岩柱（j08_03_fx）は相手の足もとのまま
    // 2026-10-18 REV3 A4 ジオインパクト：円錐の衝撃波（j09_08_fx＝左に土煙の尾・右が尖った先）を相手の中心に置いていた＝尾がジオルの背中に重なり「背中から出る」ように見えた
    //  → 尾の端をジオルの前の拳に・尖った先を相手の奥へ（sprbeam・縦横比のまま）
    'jiol_moves_1012/j09_01.webp': { id: 'A4', drop: ['J9_8_fx'],
      addFx: [{ src: 'J9_8_cone', f: 'j09_08_fx.webp', at: 'sprbeam', t: [7, 7], pw: 608, ph: 312, ox: 0.03, oy: 0.5, tip: 0.97 }] },
    'jiol_moves_1012/j08_01.webp': { id: 'A3', cutSet: { J8_3: { f: 'j08_02.webp', b: [110, 26, 471, 402] } } },
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
    // 21 フルーネ技10 ルートテンペスト：2026-10-16（バトル最終統合）ユーザー承認の専用の根4枚＋命中3枚（Part01 の D_01〜D_07）。旧：共通演出 bc06／bc07 の流用だけ＝やめた。
    //    根（D01 出現 → D02 伸長 → D03 打撃 → D04 引き）は相手の足もとから（at 'root'＝絵の根元＝下 7% を相手の足もとへ・相手の前に重ねる）。
    //    命中（D05 開く → D06 最大 → D07 消える）は相手の被弾点（at 'tgt'＝絵の中心）。当たり＝D03 の打撃と D05 の開き（1回）。技09 とは別の層・別の当たり
    'flurene_moves_1015/f10_b01.webp': {
      id: '21', steps: 7, hit: 4, hs: 140,
      cuts: [
        { src: 'F10_1', t: [0, 0] }, { src: 'F10_2', t: [1, 1] }, { src: 'F10_3', t: [2, 2] }, { src: 'F10_4', t: [3, 4] }, { src: 'F10_5', t: [5, 6] },
      ],
      addFx: [
        { src: 'F10_D01', f: 'f10_d01_fx.webp', at: 'root', t: [1, 1], pw: 512, ph: 512 },
        { src: 'F10_D02', f: 'f10_d02_fx.webp', at: 'root', t: [2, 2], pw: 512, ph: 512 },
        { src: 'F10_D03', f: 'f10_d03_fx.webp', at: 'root', t: [3, 3], pw: 512, ph: 512 },
        { src: 'F10_D04', f: 'f10_d04_fx.webp', at: 'root', t: [4, 4], pw: 512, ph: 512 },
        { src: 'F10_D05', f: 'f10_d05_fx.webp', at: 'hitc', t: [3, 3], pw: 512, ph: 512 },
        { src: 'F10_D06', f: 'f10_d06_fx.webp', at: 'hitc', t: [4, 4], pw: 512, ph: 512 },
        { src: 'F10_D07', f: 'f10_d07_fx.webp', at: 'hitc', t: [5, 5], pw: 512, ph: 512 },
      ],
      shakeAt: [3],
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
    if (t.steps) out.steps = t.steps;
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

  // ---- 当たりの絵文字（2026-10-16 iPhone 03）----
  //  fight()（Phase 6）は当たりのたびにその技の絵文字（SK[k][4]）を相手の上に出す（index.html の pop(…, sk[4], "sk")）。
  //  スターフォールの 🌠 は iPhone では四角い額の絵（写真のような絵文字）になり、着弾の上に四角い星が出ていた。
  //  技のコマで見せている間（MM25D が受け持つ技）だけ、その技の絵文字の札を消す（fight()・技のデータ・ほかの技の絵文字は変えない）
  const EMOJI_OFF = Object.freeze({ 9: 'スターフォールの 🌠（iPhone で四角い額の絵）' });
  const emojiLog = [];
  function watchEmoji() {
    if (!root.MutationObserver || !root.document || !root.document.body) return;
    new MutationObserver((list) => {
      if (!lastAnim || !EMOJI_OFF[lastAnim.k] || performance.now() - lastAnim.t > 6000) return;
      list.forEach((mu) => mu.addedNodes.forEach((n) => {
        if (n.nodeType !== 1 || n.tagName !== 'SPAN' || n.className !== 'sk' || !n.parentNode || !/^f[01]$/.test(n.parentNode.id || '')) return;
        const SK = G('SK'), M = root.MM25D, k = lastAnim.k;
        if (!SK || !SK[k] || n.textContent !== SK[k][4] || !M || !M.handles || !M.handles(k, lastAnim.s)) return;
        n.remove(); emojiLog.push({ k, text: SK[k][4] }); if (emojiLog.length > 40) emojiLog.shift();
      }));
    }).observe(root.document.body, { childList: true, subtree: true });
  }
  if (root.document) { if (root.document.readyState !== 'loading') setTimeout(watchEmoji, 0); else root.addEventListener('DOMContentLoaded', () => setTimeout(watchEmoji, 0)); }

  // 2026-10-16：読み込んだ技アニメの JS の版（iPhone の QA 画面に出す＝配信のキャッシュで古い JS が混ざったかを見分ける）
  const BUILD = '2026-10-19-next';
  root.MMTUNE = Object.freeze({ BUILD, VIS_H, VIS_H3, sizeMode, sizeOf, SIZE, SIZE_K, SIZE_NAME, ANCHOR, MOVES, MOUTH, mouthOf, EMOJI_OFF, emojiLog: () => emojiLog.slice(), sizeK, patch, keyOf, onAnimStart, sfxLog: () => sfxLog.slice(), wrapSe });
})(typeof window !== 'undefined' ? window : globalThis);
