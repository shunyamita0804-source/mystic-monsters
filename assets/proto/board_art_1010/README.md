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

## 第2便（2026-10-11・ZIP MysticMonsters_Ch1A_Batch2_10plus5_20261011）

| ファイル | 元 | 使い方 |
|---|---|---|
| tile_start.webp | 01_Batch2_Main_10/G1_start.png | START のマス（tiles_v2 と同じ 320px 幅に） |
| tile_reward.webp | G6_fixed_reward.png | 宝の行き止まり6か所のマス |
| lm_start_gate.webp | E01_start_gate.png | START のすぐ奥（道をまたぐ。モンスターは門の前に立つ） |
| lm_watchpost.webp | E10_watchpost.png | R_CHEST の行き止まりの奥 |
| prop_conifer／prop_shrub／prop_pillar／prop_flowers.webp | F1b／F1c／F2b／F2c | 道の外に散らす（割合は ART.props） |
| strip_road_stone.webp | 02_Extra/C2_road_stone_straight_extra.jpeg | 白い背景を抜き、左右の端がいちばん近い2列で切ってくり返せるように。道筋に沿って細い切れ端で並べる（縁石つきの道）。&rfRoad=pattern で前の敷石の模様だけに戻せる |
| ground_water／ground_valley.webp | A4_water.png／A5_valley_floor.png | 継ぎ目を消してくり返せるように（元は端の差が隣の画素の約3倍）。**まだ画面には出していない**（水辺・谷の範囲を決めてから） |
| edge_grass／edge_rock.webp | 02_Extra/B1・B2 | 白い背景を抜いて 1024px に。**まだ画面には出していない**（崖のふちは谷の範囲と一緒に） |

使わないもの：C1 土の直線・C3 木の直線（道は石・橋も石に決定）。透過 PNG の絵の部分のアルファ 251〜253 は 255 に、8 以下は 0 にした。
世界の外（端へ寄ったとき）も草地の絵が続く（平面の中の背景 .rfw-apron）。

## 地形（2026-10-11・谷と水辺）

- 範囲（設計）：68 Scene の表の景観の説明から決めた（js/proto/roadfirst-world.js の TERRAIN）。**崩落の谷**＝J0〜P の輪の内側＋左の古石橋 EL02・右の滝の前の石橋 ER02 の下を横切る谷の腕。**中央の崖**＝Q〜R の輪の内側＋左右の石橋 Q_L2・Q_R2 の下の腕。右側の腕には水（滝の側）。後半（H〜FINAL）の山・雲海はまだ。
- 道の中心から 18単位は陸（石橋の区間だけは谷の上を渡る＝下へ落ちる影）。景物は谷に置かない。
- 描き方：谷底（ground_valley）を小さめにくり返し・全体を少し暗く・ふちの内側に崖の影 → 谷の輪郭（marching squares でつないだ線）に崖の帯（edge_grass＝崩落の谷・edge_rock＝中央の崖）を谷の側へ少しずらして並べる。edge_grass／edge_rock は透明な上下を切り、左右の端がいちばん近い2列で切った（くり返し用）。
- 区画は数フレームに分けて描く（1回の長い処理で止めない）。描き終えるまで開始の俯瞰を止めておく（最大3秒）。
