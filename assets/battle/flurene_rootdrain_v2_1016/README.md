# フルーネ技09「ルートドレイン」補修版10コマ（2026-10-16・バトル最終統合）

- 原本＝ZIP Mismon_Battle_Final_Part02_RootDrain の RootDrain_v2_repaired（2560×1536 の全身コンポジット RGBA・10枚・ユーザー承認の最終候補）。原本はリポジトリに置かない
- 派生＝10枚同じ切り出し（全コマの和の範囲＋余白 12）を 0.42倍・WebP（品質90・アルファ100）。描き直し・色の加工なし。道具＝tools/final1016/derive.py
- 再生順（rd2_01〜10）：01 → 02 → 03 → 04 → 05_prebeat → 05 → 06_prebeat → 06 → 07 → 08（js/battle/rootdrain-1016.js の MMRD）
- 旧1536px・8コマ（assets/battle/flurene_rootdrain_1016）は失効した素材便＝削除した（本番に混ぜない）
- 置き方：08 の体の面積・重心・足もとを正式の待機絵に合わせる（2560 の全幅を画面に収める縮小はしない）。04〜06 の蔦の部分（派生の x ≥ 470）だけ横に伸縮して、2つの接触点の中ほど（派生の 761, 210）を相手の被弾点へ

| 順 | 原本 | 大きさ | sha256（原本） | 表示用 | 大きさ | sha256（表示用） |
|---|---|---|---|---|---|---|
| 01 | root_drain_01.png | 2560x1536 | c200bd48d0b52915955542a7e91bfe832c6a7221a079f0a51ce90c880b61fa96 | rd2_01.webp | 850x449 | e04ea1a0851daca55481cfa5356f6c556f0a104f615ec51699be0f20580bab6d |
| 02 | root_drain_02.png | 2560x1536 | b46f2bd418ccc972de9d0052398e5d2592a0d23bcb6bd447ca58ebc97c631016 | rd2_02.webp | 850x449 | e23df0151d7e035596f536e9c0d233a1242da860df6ea05ce5d28b5e7bf8a8ba |
| 03 | root_drain_03.png | 2560x1536 | bff4cbf3c091463b5b39db773bccac0bb76cb0ca6254176f86e7615bac600d49 | rd2_03.webp | 850x449 | 3b7b79bfadea7944e98825982c8f868a524beeb80a0a00d3b2302f09d6800a56 |
| 04 | root_drain_04.png | 2560x1536 | e7fa5520de0ebf41db5f0bdd8bf404d986ea616c107c37587a9745e197a51667 | rd2_04.webp | 850x449 | 3dd23ffe7c914ed52b9082dff6841e84f2507d1abeda727b73ad53b0e49dbff8 |
| 05_prebeat | root_drain_05_prebeat.png | 2560x1536 | deabb050b4795baf38b6bdaa476a1855d257e83f51c97019391f45a02f9d75c4 | rd2_05.webp | 850x449 | d712c44bde307608998110e64c3a10802481a988ddac1e7d013fa5a0b49c8e56 |
| 05 | root_drain_05.png | 2560x1536 | 9f48cdce9347aa2601fc7ccf7284ee25c8f54646d2bcbbd44f84defd9971a0cc | rd2_06.webp | 850x449 | 419676cec4e73c659558a2895ef2c2930387678d0e71575d0948c83c279205fd |
| 06_prebeat | root_drain_06_prebeat.png | 2560x1536 | ed2e29fe4cc004b5b07fb9c784112a0c6cf0ac94f83fa1460f28941d85b3a981 | rd2_07.webp | 850x449 | 4689e5eac16d60effa37a882765c12a9eb689366179631bde9c96eb8229c8f38 |
| 06 | root_drain_06.png | 2560x1536 | 58225d670fc87670fc90b3fc538425f870f539c714b03db65b4b7a168a9fac1c | rd2_08.webp | 850x449 | 1e67f2aac8a20bb60d3605626929b3c863feda5fd5463d1c62877a1c0c8dfacb |
| 07 | root_drain_07.png | 2560x1536 | 16554bebc7407c75a3fd71089275350fe55fbf96f7fe45d150822ca1c5aaf94e | rd2_09.webp | 850x449 | bc7458436ab44201f384f5fa740a92f574ace4a434a043ef1b9bc141c59b2de9 |
| 08 | root_drain_08.png | 2560x1536 | bf0de9c12c9f56a3271846a45dc0ed8d5cb5ab34f8acef377725ed35b88306a6 | rd2_10.webp | 850x449 | 9a38a095dea309a5c91fdfd4b93fae9eccbe25781c88472033973e3fb5322300 |
