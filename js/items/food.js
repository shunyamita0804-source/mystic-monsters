// =========================================================
// P2 の食事6種 `MMFOOD`（2026-10-12。**値・価格・入荷の条件はすべて P2 試遊用の暫定値**＝正式の確定ではない）
//  ・番号・安定ID・正式名（38種の正式名）・空腹の減る量（hunger）・価格（price）・入荷（unlock＝最高優勝ランク。null＝最初から）の1か所
//  ・内部の値は従来の「疲れ」（m.raise.fatigue）をそのまま使う（セーブ互換）。画面の言葉は「空腹」
//  ・画像は PR #7（items-38-body-1012）の assets/items/body_1012/ の「番号.webp」と同じファイル（内容・sha256 が同じ＝両方を main へ入れても重複しない）
//  ・18 ベルナの特製弁当は38種の正式な品目だが P2 の対象外（効果・価格・入荷は決定待ち＝ここに入れない）
//  ・売値は決まっていない＝sellPrice は null（売れない）。05・28 ほか残り32種は入れない
//  ・入荷＝プレイヤー全体の最高優勝ランク（MMP7.bestWinRank＝バッグの枠と同じ。上位の優勝で下位も優勝扱い）
// =========================================================
(function (root) {
  'use strict';
  const fz = Object.freeze, IMG = './assets/items/body_1012/';
  const RANK = fz({ E: 0, D: 1, C: 2, B: 3, A: 4, S: 5 }), RANK_NAME = 'EDCBAS';
  // [番号, 安定ID, 正式名, 空腹の減る量, 価格, 入荷（ランク名・null＝最初から）]
  const ROWS = [
    ['01', 'potato', 'ジャガイモ', 10, 20, null],
    ['02', 'sweet_fruit', 'あまい果実', 18, 40, null],
    ['03', 'fresh_fish', '新鮮な魚', 28, 70, null],
    ['07', 'bone_meat', '骨付き肉', 40, 120, 'E'],
    ['11', 'nutrition_soup', '栄養スープ', 55, 220, 'D'],
    ['22', 'energy_charge', 'エネルギーチャージ', 80, 500, 'B'],
  ];
  const FOODS = fz(ROWS.map(([no, id, name, hunger, price, unlock]) => fz({ no, id, name, hunger, price, unlock, img: IMG + no + '.webp', provisional: true })));
  const BY_ID = fz(Object.fromEntries(FOODS.map((f) => [f.id, f])));
  /** 新人支援（2026-10-12 P2：1000G＋ジャガイモ10個。旧：薬草1個） */
  const SUPPORT = fz({ gold: 1000, item: 'potato', n: 10 });
  const byId = (id) => BY_ID[id] || null;
  const isFood = (id) => !!BY_ID[id];
  /** 入荷しているか（最初からの品は常に true。そのほかは最高優勝ランクが条件以上） */
  function isUnlocked(S, id) {
    const f = byId(id); if (!f) return false; if (!f.unlock) return true;
    let best = -1; try { best = root.MMP7 && root.MMP7.bestWinRank ? root.MMP7.bestWinRank(S) : -1; } catch (e) { best = -1; }
    return best >= RANK[f.unlock];
  }
  const unlockText = (id) => { const f = byId(id); return f && f.unlock ? `ランク${f.unlock}大会で優勝すると入荷` : ''; };
  const icons = () => Object.fromEntries(FOODS.map((f) => [f.id, f.img]));
  /** MMP7（アイテムの定義・アイテム屋の並び・入荷）と MMCH（Chapter で食べる＝疲れの値を減らす）へ登録。何度呼んでも同じ */
  function install(P7 = root.MMP7, CH = root.MMCH) {
    if (!P7) return false;
    for (const f of FOODS) P7.registerItem({ id: f.id, name: f.name, price: f.price, sellPrice: null });
    P7.setShopCatalog(FOODS.map((f) => f.id));
    if (P7.setShopGate) P7.setShopGate((S, id) => isUnlocked(S, id));
    if (CH && CH.registerFatigueItem) for (const f of FOODS) CH.registerFatigueItem(f.id, { amount: f.hunger, food: true });
    return true;
  }
  root.MMFOOD = fz({ FOODS, SUPPORT, RANK, RANK_NAME, byId, isFood, isUnlocked, unlockText, icons, install });
})(typeof window !== 'undefined' ? window : globalThis);
