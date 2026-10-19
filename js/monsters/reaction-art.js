// =========================================================
// 正式モンスター5体のリアクション画像（2026-10-12）`MMRXART`
//  ソラモ・ガウル・ノビトン・ジオル・レグナス × 6種＝30枚（assets/monsters/reactions_1012/。表示用の透過 WebP）。
//   01 joy 喜ぶ・02 surprise 驚く・03 sad しょんぼり・04 eat 食べる（イベント・育成・冒険用。どの出来事に出すかは未決＝今は確認ページだけ）
//   05 hit 被弾・06 dodge 回避（バトル：js/battle/arena.js の react が攻撃を受けた側の待機立ち絵を一瞬だけ差し替える）
//  大きさ：hRel＝バトルの待機立ち絵（assets/battle/idle/・高さ720）に対する高さ（体の面積がそろう倍率。tools/reactions1012/build.py）。
//  向き：30枚とも右向き（待機立ち絵と同じ）＝左右の反転は待機立ち絵と同じ規則（MMARENA.flipOf）。
//  ゲームの処理（バトルの計算・セーブ・イベントの中身）には触れない。表示だけ。
// =========================================================
(function (root) {
  'use strict';
  const DIR = './assets/monsters/reactions_1012/';
  const SPECIES = Object.freeze(['soramo', 'gauru', 'nobiton', 'jiol', 'regnas', null, 'razuck', 'kalshell', 'myurol']);   // 種族の番号 0〜4（IMG・SP と同じ）・2026-10-17：6＝ラズック（登録のみ・表情6種は制作候補＝QA の試合だけで出る）・2026-10-18：7＝カルシェル（登録のみ・正式採用の表情6種＝QA の試合だけで出る）
  const KINDS = Object.freeze(['joy', 'surprise', 'sad', 'eat', 'hit', 'dodge']);
  const LABEL = Object.freeze({ joy: '喜ぶ', surprise: '驚く', sad: 'しょんぼり', eat: '食べる', hit: '被弾', dodge: '回避' });
  const NAME = Object.freeze({ soramo: 'ソラモ', gauru: 'ガウル', nobiton: 'ノビトン', jiol: 'ジオル', regnas: 'レグナス', razuck: 'ラズック', kalshell: 'カルシェル', myurol: 'ミュロル' });
  // ラズックの表情6種（2026-10-17・tools/razuck1017/derive_art.py が測った大きさ＝待機絵と同じ倍率）。置き場所も別（reactions_1017_razuck）
  const DATA = Object.assign({}, root.MMRXART_DATA || {}, { razuck: {"joy": {"w": 742, "h": 831, "hRel": 1.154}, "surprise": {"w": 768, "h": 842, "hRel": 1.169}, "sad": {"w": 684, "h": 818, "hRel": 1.136}, "eat": {"w": 745, "h": 836, "hRel": 1.161}, "hit": {"w": 832, "h": 832, "hRel": 1.156}, "dodge": {"w": 805, "h": 652, "hRel": 0.906}} });
  // 2026-10-18 カルシェルの表情6種（正式採用・tools/kalshell1018/derive_art.py が測った大きさ＝待機絵と体の面積がそろう倍率）。置き場所は reactions_1012/kalshell/（既定の DIR）。
  //  05 被弾・06 回避は待機絵と同じ右向き（バトルで使う）。01〜04 は向きが混在（01 は左向き）＝バトルでは使わない（QA の確認だけ）
  DATA.kalshell = {"joy": {"w": 830, "h": 782, "hRel": 1.086}, "surprise": {"w": 885, "h": 860, "hRel": 1.194}, "sad": {"w": 882, "h": 873, "hRel": 1.212}, "eat": {"w": 822, "h": 822, "hRel": 1.142}, "hit": {"w": 979, "h": 972, "hRel": 1.35}, "dodge": {"w": 991, "h": 996, "hRel": 1.383}};
  // 2026-10-19 ミュロルの表情6種（正式採用・tools/myurol1019/derive_art.py が測った大きさ＝待機絵と体の面積がそろう倍率）。置き場所は reactions_1012/myurol/（既定の DIR）。
  //  水しぶき・光の粒が絵の端まで届く表情（原本 1536 の端に接する）は hRel が大きい（被弾 1.41・回避 1.50）＝QA で見え方の確認が要る
  DATA.myurol = {"joy": {"w": 896, "h": 872, "hRel": 1.211}, "surprise": {"w": 864, "h": 874, "hRel": 1.214}, "sad": {"w": 1044, "h": 1041, "hRel": 1.446}, "eat": {"w": 903, "h": 835, "hRel": 1.16}, "hit": {"w": 1032, "h": 1017, "hRel": 1.413}, "dodge": {"w": 1086, "h": 1081, "hRel": 1.501}};
  const DIRS = { razuck: './assets/monsters/reactions_1017_razuck/' };
  const keyOf = (sp) => (typeof sp === 'number' ? SPECIES[sp] || null : sp && SPECIES.includes(sp) ? sp : null);
  /** 画像の場所（種族は番号 0〜4 か キー）。無ければ null */
  function src(sp, kind) {
    const k = keyOf(sp), i = KINDS.indexOf(kind);
    return k && i >= 0 && DATA[k] && DATA[k][kind] ? (DIRS[k] ? `${DIRS[k]}${String(i + 1).padStart(2, '0')}_${kind}.webp` : `${DIR}${k}/${String(i + 1).padStart(2, '0')}_${kind}.webp`) : null;
  }
  /** { src, w, h, hRel }。無ければ null */
  function info(sp, kind) {
    const k = keyOf(sp), d = k && DATA[k] && DATA[k][kind];
    return d ? { src: src(k, kind), w: d.w, h: d.h, hRel: d.hRel } : null;
  }
  root.MMRXART = Object.freeze({ DIR, SPECIES, KINDS, LABEL, NAME, src, info, keyOf, all: () => SPECIES.filter(Boolean).flatMap((s) => KINDS.map((k) => info(s, k)).filter(Boolean)) });
})(typeof window !== 'undefined' ? window : globalThis);
