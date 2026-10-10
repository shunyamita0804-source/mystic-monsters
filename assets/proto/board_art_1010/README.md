# Chapter 1 A ボード素材・第1便の試し貼り（2026-10-10・試作。正式ではない）

URL に `?chapterBoard=roadfirst&rfView=world&rfArt=1010` を付けたときだけ使う（js/proto/roadfirst-world.js の `ART`）。
元の ZIP：MysticMonsters_Ch1A_Assets_25images_PrimaryA1-A4_20261010.zip（ChatGPT 制作・ユーザー提供）。元画像は変えていない。

| ファイル | 元 | 加工 |
|---|---|---|
| ground_grass.webp | 01_primary_17_assets/A1_grassland.jpeg | 継ぎ目を中央へずらして元の絵と重ね、上下左右がつながるように（512px） |
| road_flagstone.webp | 02_A1-A4_previous_second_choice/A3_stone_old.jpeg（旧の石畳＝第二候補のほうを採用） | 同上（384px）。道の帯の中に敷く |
| prop_tree.webp | 01_primary_17_assets/F1_tree.jpeg | 縁から続く白い背景を透明に（白のにじみを引いて戻す） |
| prop_rock.webp | 01_primary_17_assets/F2_rock.jpeg | 同上 |
| goal_arena.webp | 03_previous_alternates_4/E1_tournament_alt01.jpeg（白い旗の別版を採用） | 同上（640px） |

作り方：scratchpad の prep.py 相当（PIL のみ）。木と岩は道の外に決まった乱数で散らす（`scatter`）。大会会場は GOAL の後ろ。

## 追加で受け取ったもの（2026-10-10・単体の画像5枚）

| ファイル | 元 | 使い道 |
|---|---|---|
| cliff_grass_chunk.webp | 草の生えた岩の塊（透過 PNG） | 崩落の谷・橋のかかる所の崖のふち（谷底 A5 が届いてから）。まだ画面には出していない |
| rock_pillar.webp | 岩の柱の崖（透過 PNG） | 石像の尾根・門のまわりの大きな岩。まだ画面には出していない |

透過は本物だが、絵の部分のアルファが 251〜253（わずかに透ける）＝240 以上を 255 にした。
カーブした道3枚（土・石畳・木の橋）は使わない：道の形はプログラムが描くので、決まった曲がりの部品ははまらない。木の橋は「橋は木の板にするか」の参考にする。
