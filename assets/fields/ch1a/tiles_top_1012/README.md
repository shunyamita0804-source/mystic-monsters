# Chapter 1 のマスの上面・正式12種（2026-10-12）

ZIP「ミスモン_試遊修正_新マス12種_SE_チケット_Claude納品_20261012」の `02_ボード上面_原本JPEG`（TOP01〜TOP12・JPEG＝市松模様が焼き込み）の表示用の派生。原本はリポジトリに置かない（`sha256.md`）。
作り方は `tools/fx1011/tops_1012.py`＝試作（tiles_top_1011）と同じ：derive.py の cutout(disc)＝メダルの透過（`src/`）→ top_composite.py＝既存の薄い立体円盤 `tiles_v2/tile_blank.webp` の上面の内側へ中央の紋章だけ（側面・縁・厚み・影・外形は円盤のまま＝二重の金縁にしない）。ライバル・回避は色が淡いので彩度のしきいだけ下げた（12・20。ほかは 70）。

| TOP | 原本 | 派生 | 使う所（js/chapter/world-board.js の look） |
|---|---|---|---|
| 01 | 01_life.jpg | tile_stat_life | 能力マス ライフ |
| 02 | 02_power.jpg | tile_stat_power | ちから |
| 03 | 03_intelligence.jpg | tile_stat_intelligence | かしこさ |
| 04 | 04_accuracy.jpg | tile_stat_accuracy | 命中 |
| 05 | 05_evasion.jpg | tile_stat_evasion | 回避 |
| 06 | 06_toughness.jpg | tile_stat_toughness | 丈夫さ |
| 07 | 07_wild.jpg | tile_wild_monster | 野生 |
| 08 | 08_treasure.jpg | tile_treasure | 通常の宝箱（tier normal）。**珍しい宝箱（tier rare）は従来の tiles_v2/tile_treasure_2 のまま**＝段階の違いを消さない |
| 09 | 09_meal.jpg | tile_meal | 食事・焚き火のマス（空腹 −50） |
| 10 | 10_rival.jpg | tile_rival | ライバル（RIVAL） |
| 11 | 11_event.jpg | tile_event | 出来事 |
| 12 | 12_rare.jpg | tile_rare_monster | レアモンスター（上に EV04 の紫の紋章を別の層で浮かべる） |

## 2026-10-14 開発29（5）：紋章を金の輪の近くまで大きく

iPhone の試遊「円形マスの中央の紋章が小さい」→ 12種とも、紋章の層だけを大きくして作り直した（`tools/fx1011/tops_1014.py`＝`src/` から `top_composite.py` の5番目の引数 FIT 0.90）。
- 紋章の「中身」の外側（不透明さで重みを付けた半径の 92% 点）が、上面の内側の金の輪（tile_blank の CX 160・CY 107・RX 116・RY 74）の 0.90 に届く大きさ。外側のうすい飾り線・光は輪の 0.94〜1.0 で薄くして消す（輪から外へ描かない）。
- 旧（0.86 倍の箱）からの倍率：ライフ 1.04・ちから 1.036・かしこさ 1.049・命中 1.028・回避 1.029・丈夫さ 1.205・野生 1.031・宝箱 1.006・食事 1.032・ライバル 1.013・出来事 1.034・レア 1.001（もともと輪の近くまで描かれている紋章はほぼそのまま）。
- 円盤（側面・縁・金の輪・厚み・影・外形・画像の大きさ 320×246）・盤の上のマスの大きさは変えていない。紋章の形・色も変えていない（拡大して重ねただけ）。
- 専用マス（board_art_1010 の start・goal・gate・challenge・reward・den・merge）と tiles_v2 の分かれ道・珍しい宝箱は、もとから輪いっぱいに描かれている＝変えていない。

## 2026-10-14 実機試遊⑳：紋章を金の外枠の直前まで

iPhone の試遊「マスの中のアイコンを金縁ギリギリまで」→ 12種とも、同じ作り方で FIT 0.90 → **FIT 0.97**（`tools/fx1011/tops_1014.py` の FIT＝`top_composite.py` の5番目の引数）。
- 紋章の中身の外側が上面の内側の金の輪の 0.97 に届く大きさ。外側のうすい飾り線・光は従来どおり輪の 0.94〜1.0 で薄くして消す＝金の輪の外へは描かない（縁が欠けない・隣のマスへはみ出さない）。
- 円盤（側面・縁・金の輪・厚み・影・外形・320×246）・盤の上のマスの大きさは変えていない。紋章の形・色も変えていない（拡大して重ねただけ）。専用マス・分かれ道・珍しい宝箱は従来どおり。
- scipy の無い環境では `top_composite.py` が PIL のぼかし（σ1.2 相当）で同じ処理をする（作り直しの手順は同じ）。
