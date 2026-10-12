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
  const SPECIES = Object.freeze(['soramo', 'gauru', 'nobiton', 'jiol', 'regnas']);   // 種族の番号 0〜4（IMG・SP と同じ）
  const KINDS = Object.freeze(['joy', 'surprise', 'sad', 'eat', 'hit', 'dodge']);
  const LABEL = Object.freeze({ joy: '喜ぶ', surprise: '驚く', sad: 'しょんぼり', eat: '食べる', hit: '被弾', dodge: '回避' });
  const NAME = Object.freeze({ soramo: 'ソラモ', gauru: 'ガウル', nobiton: 'ノビトン', jiol: 'ジオル', regnas: 'レグナス' });
  const DATA = root.MMRXART_DATA || {};
  const keyOf = (sp) => (typeof sp === 'number' ? SPECIES[sp] : SPECIES.includes(sp) ? sp : null);
  /** 画像の場所（種族は番号 0〜4 か キー）。無ければ null */
  function src(sp, kind) {
    const k = keyOf(sp), i = KINDS.indexOf(kind);
    return k && i >= 0 && DATA[k] && DATA[k][kind] ? `${DIR}${k}/${String(i + 1).padStart(2, '0')}_${kind}.webp` : null;
  }
  /** { src, w, h, hRel }。無ければ null */
  function info(sp, kind) {
    const k = keyOf(sp), d = k && DATA[k] && DATA[k][kind];
    return d ? { src: src(k, kind), w: d.w, h: d.h, hRel: d.hRel } : null;
  }
  root.MMRXART = Object.freeze({ DIR, SPECIES, KINDS, LABEL, NAME, src, info, keyOf, all: () => SPECIES.flatMap((s) => KINDS.map((k) => info(s, k)).filter(Boolean)) });
})(typeof window !== 'undefined' ? window : globalThis);
