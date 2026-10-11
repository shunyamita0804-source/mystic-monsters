# マスの上面の試作（2026-10-11・検収前）

ZIP `MysticMonsters_Ch1_21Images_FX_Handoff_20261011` の TOP01（ライフ）・TOP07（野生）の2種だけ。**既定の画面では使わない**（既存の tiles_v2 のまま）。
URL に `?tileTop=1011` を付けたとき（または window.MM_TILETOP_1011＝true）だけ、Chapter 1 の1枚の世界のボードのライフ・野生のマスがこの絵になる（js/chapter/world-board.js の topPreview）。

- `src/top01_life_yellow.webp`・`src/top07_wild_claws.webp`：メダル全体の透過の派生（tools/fx1011/derive.py の disc＝外形の内側は不透明）
  - TOP01：file_1790817684777(6).jpeg（sha256 fdaa8040e95362211b9ab2a0697a057faea4eed90b95859397ab9f933c7a1aca）
  - TOP07：file_1790827328362(3).jpeg（sha256 33bd1f1fbd2f700fdc2777500bd08193ce96ccb653f8620fd710ad8cfa0add2c）
- `tile_stat_life.webp`・`tile_wild_monster.webp`（320×246＝tiles_v2 と同じ大きさ）：tools/fx1011/top_composite.py
  - 既存の薄い立体円盤 tiles_v2/tile_blank.webp の画素をそのまま使い（側面・縁・厚み・影・外形の透明度は変えない）、上面の内側の金の輪（中心 160,107・横 116・縦 74）の中へ、
    メダルの**中央の紋章だけ**（中央の円＝半径 62%・彩度の高い光る部分。石の面・外周の金の縁・ルーン文字の輪は使わない＝二重の金縁にしない）を上面の傾き（縦を 74/116 に）で重ね、ごく薄い影を下へ 2px
- 残りの10種（TOP02〜06・08〜12）は承認のあとで同じ道具で作る（原本はユーザーが保管）。宝箱の段階の違い（tile_treasure_1〜3）・start／goal／分かれ道／合流／門／隠れ家の絵は変えない
