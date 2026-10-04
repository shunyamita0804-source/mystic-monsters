# Chapter 1 の小型立体マス（2026-10-06・次期総合改修）

ZIP `claude_next_fix_assets_v2.zip` の `05_board_core/board_6_ability_tiles_sheet.jpg`（能力6種のシート）と
`06_board_extra/*.png`（白紙・野生・レア・ライバル・宝箱1〜4・休む・イベント・分かれ道）から作った透過 WebP（幅 320px・品質 90）。
元ファイルはユーザーが保管（リポジトリには置かない）。

## 透過化の手順と限界
- 元画像には市松模様（白と灰色の格子）が焼き込まれていた。そのまま貼らず、縁からつながる無彩色の格子だけを取り除いた
  （石の円盤・金の縁・紋様の色は変えていない。円盤の外形は凸包で閉じ、内側の明るい石の面は残す）。
- 縁に1〜2px の薄いにじみが残る所がある（暗い背景・明るい背景の両方で目視確認済み）。
- 能力6種はシートから位置で切り出した（色＝ライフ 黄・ちから 赤・かしこさ 緑・命中 ピンク・回避 水色・丈夫さ 青）。

## 対応（js/chapter/configs/ch1a.js の tileUI.discs）
| ファイル | マス |
|---|---|
| tile_stat_life〜tile_stat_toughness | 能力マス6種 |
| tile_blank | 通常マス・合流（合流の専用の絵は無い＝要素材） |
| tile_branch | 分かれ道 |
| tile_event | イベント |
| tile_rest | 休む（回復の出来事） |
| tile_wild_monster | 野生 |
| tile_rare_monster | レアモンスター |
| tile_rival | ライバル |
| tile_treasure_1 / 2 / 3 | 宝箱の段階 normal / rare / special（既存の段階のまま。中身は変えていない） |
| tile_treasure_4 | 予約（使っていない。報酬・段階は新しく作らない） |

スタート・ゴールは従来の素材（tiles/）のまま。

## 元ファイルの sha256
```
beb6c5939283a7c7f1ec507bd3b9af45f962e2aeadc392fd3aab2cdf17738e7a  05_board_core/board_6_ability_tiles_sheet.jpg
bc5de877db15503b69f3276f912b5e833df35dd8df756c21b39838854dcc0046  06_board_extra/tile_blank.png
91e33df81ae2581de47d3c7a3844ca0d4f6beb18beb34e50b8d327535f06f77d  06_board_extra/tile_branch.png
e83e82bbfe1faab1e5c993d454c3b50affd06dfc28e4ba3faa89ef6bc2243039  06_board_extra/tile_event.png
318e5aca53d12a28a2179f1c46ac872e4f3e487c2994a9c282a88f7d13facfe9  06_board_extra/tile_rare_monster.png
713e5f2a6f4be3eda1d02ba9c68b6b2848859dd6381454f4d68d726603f44720  06_board_extra/tile_rest.png
465c52d558d5590ebc7856feecb23ffae3dbb8051fb7ebe0852b133b8c4bd050  06_board_extra/tile_rival.png
42cf7935d3c07debc5f068b57a14f89044a6533c35f8e077b97049685dcf4899  06_board_extra/tile_treasure_1.png
8fa222339cf9b1acb1231bc9bc1e6c00f86601d6c32b205d59065ee711e66ccc  06_board_extra/tile_treasure_2.png
4d53ec54066811d3f73b8f92ca7bdc68ae61e94b21933c2e6df107ec71f5e687  06_board_extra/tile_treasure_3.png
9ca78edcac040d2b869177fc7eea589406ac3daaec5358d3b7c06bf9a6daf7ef  06_board_extra/tile_treasure_4.png
5065866cb5029c16eed768dad64e3e336cc5bfae5f4af58529d721dd36e41730  06_board_extra/tile_wild_monster.png
```
