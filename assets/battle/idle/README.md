# バトルの待機立ち絵（2026-10-07 正式）

透過 PNG を余白を切って高さ 720 の透過 WebP（品質90）に。向き：ソラモ・ノビトン・ジオル・レグナス＝右向き、ガウル＝左向き（js/battle/arena.js の FACE）。

元ファイル（ZIP Mismon_Claude_DIFF_20261007_PART1／PART2）と sha256：

| 元ファイル | sha256 |
|---|---|
| c/PART1_BattleTournament/battle/idle/idle_01_soramo.png | 63127bfc6aaf7aa267d3ee6e25cdd02599c714bb3a553fb0fc9de989fc7f7d94 |
| c/PART1_BattleTournament/battle/idle/idle_02_gauru.png | 7c4810c1f66818ca20dc92879642ac84d488d73689ed86098a505978cf5256f3 |
| c/PART1_BattleTournament/battle/idle/idle_03_nobiton.png | ce3b9fe6100b0533f2c39fdd039495f9dd5192e1a6f44366b91f2fe319c97c1d |
| c/PART1_BattleTournament/battle/idle/idle_04_jiol.png | 6addf16ca18eae916fbd5f786177749c1169a9422bf12b3bdc427756b9b24e8f |
| c/PART1_BattleTournament/battle/idle/idle_05_regnas.png | 1e3f2a41e28120e35a6b0e1bfbeade468d617814e694a35f43212490b31cac97 |

## フルーネ（2026-10-15 N11・登録のみ・バトルには出さない）

| 元ファイル | sha256 | 派生 | 派生の sha256 |
|---|---|---|---|
| flurene_battle_idle.png（ZIP「次回Claude便_12項目」の 01_フルーネ正式登録・1254×1254 RGBA） | d5a237c1410511b18a0ad869bc36f8ef07fe79b1b8537d9eea15d103f962798f | idle_flurene.webp（730×720） | 87c5b202b32778efb42f8d2bff4c94205da8110eef0dbb1a22debb22e05064b3 |

- 作り方：tools/next1015/derive.py。アルファが 1 以上の画素の外接矩形で余白だけを切る（原本の左右の端に根が接している＝横は切らない）→ 高さ 720px（乗算済みアルファで縮小）→ 透過 WebP（品質 90・exact）。原本は上書きしていない・リポジトリに置かない。
- アルファ：本体の不透明度は原本のまま 251〜253（わずかに透ける）。
- js/battle/arena.js の `IDLE` には入れていない（番号 5 はバトルに出ない）。参照は js/phase10/monsters.js の `PENDING_SPECIES`（`battleIdle`）だけ。
