# 公式ランク戦の正式バトル背景 E〜S（2026-10-12 開発21）

ユーザーが再提示した採用済みの元デザイン（ZIP「ミスモン_開発21_試遊修正001-006_正式背景6枚_最終指示一式_20261012」の `正式ランク背景6枚/`）を、構図・色・旗・装飾・光・床の遠近を変えずに WebP（品質90・同じ大きさ）にしただけ。**原本の JPEG はリポジトリに置かない**（ユーザーが保管）。

使う所：公式ランク大会の対戦表（大会1）・対戦前比較（大会2）・VS（大会3）・実際のバトル（js/battle/arena.js の arenaSrc）・優勝の勝利演出（index.html の TB_ARENA）。
使わない所（従来の assets/tournament/venues/venue_E〜S のまま）：セドリックの会話の背景（cedricBg）・野生／レア／ライバルの練習試合のバトル（#bt の data-mmprac）。

照合（2026-10-12）：今まで別の箇所にあった assets/battle/arena/arena_E〜S とは同じ絵（平均の差 約0.6／255）だが、**arena_C と arena_D は中身が入れ替わっていた**（正式 D＝arena_C の絵・正式 C＝arena_D の絵）。arena_* はファイルだけ残し、ここを正とする。

| ランク | 原本 | 大きさ | 原本の sha256 | 原本 | WebP | WebP の sha256 | 意匠 |
|---|---|---|---|---|---|---|---|
| E | official_rank_E_original.jpeg | 868×1536 | `fb1d98e194a2da8805b92057e56a58eed72e27faf7f049eb7ca9c8dc2ab747c9` | 494 KB | 252 KB | `a9b028243e413a6bc6e5c3788975ea126efb33e9fbbe99b02f4d87707eece12e` | 明るい白〜アイボリーの石造闘技場・青い旗・青空 |
| D | official_rank_D_original.jpeg | 868×1536 | `8fd3da1598ab4707288d1b4864aa21688577f2fdf8c24a99d708cb642033b8a6` | 515 KB | 272 KB | `c25da23d8105b7e9130794a88fc15a5940f97bfb22ffcdb308d404ccd5d04e9b` | 明るい石造闘技場・緑の旗・花と緑の装飾 |
| C | official_rank_C_original.jpeg | 868×1536 | `aa67a7f2d2061798a6a8ea0c84c8a583ff36583b274ac5aa1a92fb56c1d8e568` | 583 KB | 321 KB | `a76debf78eb4efda5fb0f490727fe2652ee5175a4ad78848232ef53173570bb4` | 緑の旗・花・観客・紋章が豊富な石造闘技場 |
| B | official_rank_B_original.jpeg | 868×1536 | `46a71c106cba9c28d9f8e96b781c0b21bd05648d0a6bb3cd4086150547aeb853` | 603 KB | 337 KB | `4f1ccc00ccdfa4df5eeb0e5b120eb02c15bb8b8c97196253c343d6fd0f22077d` | 夕景・黄金の旗・炎と松明 |
| A | official_rank_A_original.jpeg | 868×1536 | `6364640d6b610dae6b5ac04e81ca0f4e4723d6ed9a8f562e2088a219b4ff4ae0` | 599 KB | 334 KB | `742394156c2d82486c7dfc1bc14f0b2449578325a53228b300767ecf5428ce58` | 夕景・赤い旗・深紅の幕・格式の高い観客席 |
| S | official_rank_S_original.jpeg | 869×1536 | `4540f4b3a2ab7ac7d59a31318266c673930d76d5a6d0c7e55d2a306859349353` | 670 KB | 389 KB | `d232fd31bd9790657b7a69247449e2cbaaae566cb7369fe7139443bb7c51822a` | 夜景と月・赤い旗・玉座と炎 |
