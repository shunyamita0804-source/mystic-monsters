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

## 第2便の作り直し（2026-10-11・ZIP MysticMonsters_Ch1A_Part1_10PNG／Part2_5PNG。15枚・README なし）

前便と同じ15の役割の別の絵（高解像度・本物の透過・帯と水は元から左右がつながっている）。画面で前便と並べて比べ、5枚だけ差し替えた（scratchpad の prep3.py 相当）。

| ファイル | 元 | 加工 | 差し替えた理由 |
|---|---|---|---|
| ground_water.webp | A4_water.png | 512px に縮小だけ（元から上下左右がつながっている） | 継ぎ目を消す加工が要らない |
| ground_valley.webp | A5_valley.png | 継ぎ目を消して 512px | 霧と崖で深い谷に見える（前便は湖のように見えた） |
| strip_road_stone.webp | P2_road_stone.png | 上下の透明だけ切って高さ 256px（左右は元からつながる） | 白い背景を抜く加工が要らない＝縁がきれい |
| edge_grass.webp | S1_cliff_grass.png | 同上・高さ 260px | 同上 |
| edge_rock.webp | S2_cliff_rock.png | 同上・高さ 240px | 同上 |

前便のままにしたもの：G1／G6（新しい絵は厚い石の台＝ほかの 82 マス（tiles_v2 の薄い円盤）とそろわない）、E01（王家の門は GOAL の大会会場と対になる）、E10（岩棚の見張り台＝Scene21 の「岩棚の小さな見張り台」に近い）、景物4種（前便で割合を決めて並べ済み。新しい低木は花が咲いていて花の景物と区別しにくい）、P1 土・P3 木（道と橋は石）。差し替えなかった絵は置いていない。

## 第3便（2026-10-11・ZIP mystic_monsters_board_16_assets。16枚・すべて本物の透過・欠けなし）

透明な余白を切って縮小（建物 448〜512px・マス 320px）。アルファ 8 以下＝0・240 以上＝255（scratchpad の prep4.py 相当）。

| ファイル | 元 | 置く所（js/proto/roadfirst-world.js の ART.landmarks／roadfirst-view.js の ART_TILE） |
|---|---|---|
| lm_lower_gate／lm_upper_gate.webp | E02／E03 | 下門 LOWER_GATE・上門 UPPER_GATE（地点のすぐ奥で道をまたぐ） |
| lm_seal_gate.webp | E04 | 特殊挑戦 CHALLENGE の奥 |
| lm_lion.webp | E05 | 石像 STATUE（3本の道の分かれ目の奥の空き地＝off） |
| lm_moss_tower／lm_forest_altar／lm_cliff_shrine／lm_watch_statue／lm_rainbow_falls.webp | E08／E09／E11／E12／E13 | 宝の行き止まり L_CHEST／L_ALTAR／L_LATE_ALTAR／REWARD5／R_SPECIAL の奥（R_CHEST は第2便の E10） |
| lm_den_closed／lm_den_open.webp | E14a／E14b | 隠れ家 RANDOM_DEN の奥。その回の開閉（st.randOpen）で入れ替える。2枚は同じ範囲で切り抜いた（位置がずれない） |
| tile_goal／tile_merge／tile_gate／tile_challenge／tile_den.webp | G2／G3／G4／G5／G7 | GOAL／合流（2本以上が入ってくる地点＝P・R・FINAL・L_MERGE など）／下門・上門／特殊挑戦／隠れ家のマス（仮の文字「G・合・門・挑・隠」の代わり） |

E14a と E14b は門以外の細部も少し描き直されている（画素の約1割が違う）。開閉は旅の初めに決まり、旅の途中で入れ替わらないので見た目の問題は無い。

## 第4便（2026-10-11・ZIP mystic_ch1a_board_batch4_10images。10枚・後半の山の区域）

| ファイル | 元 | 加工 | 使い方（js/proto/roadfirst-world.js） |
|---|---|---|---|
| ground_cloud.webp | A6_cloudsea.png | 継ぎ目を消して 512px | 雲海＝後半の左右の輪の内側（TERRAIN の sky_l・sky_r）。真ん中の LATE_SAFE は雲海の上の尾根 |
| edge_cloud.webp | B4_cloud_edge.png | 左右がつながる位置で切り、切れ目の先を頭に重ねて端をつなぐ・高さ 240px | 雲海のふち（岩の断崖 → 雲） |
| edge_shore.webp | B2_shore.png | 同上・高さ 220px | 谷の中の川の岸（谷の暗さの下） |
| edge_forest.webp | B3_forest_edge.png | 同上・高さ 220px | 森のふち（影が森の外へ向く）＋森の中の樹冠（この帯を段に重ねたくり返し＝canopyTile） |
| prop_waterfall／prop_stream_rocks／prop_lilies／prop_reeds.webp | F4a〜F4d | 透明な余白を切って縮小 | 川の景物（waterProps：川の始まりに滝・川筋に渓流の岩と睡蓮を交互・岸に葦・石橋のまわりは空ける） |
| prop_mossy_rock.webp | F4e | 同上 | 道の外に散らす景物に追加（割合 0.04） |
| prop_peak.webp | F5 | 同上 | 山の岩峰 8つ（ART.peaks・道から 50単位以上離れた所） |

森（forest_s・forest_se・forest_w・forest_sw）＝START の両側の針葉樹林・左の祭壇のまわり・左下の岩棚の森。形は決まった揺らぎで自然な輪郭に（wobble）。雲海と森の中の目印（ライオン石像・森の祭壇など）のまわりは円く抜いて岩棚・空き地にする。

## 2026-10-12 照合：ZIP「Claude納品_Ch1_EG新素材16枚」（1024×1024 の RGBA 透過 PNG）

16枚とも第3便（mystic_monsters_board_16_assets）と**同じ絵**（透明な余白を切って今のファイルの大きさにそろえると、不透明な画素の色の差は平均 5.5〜6.8／255＝WebP の圧縮と縮小の差。透明の差は 1.4〜2.3）。今のファイルを差し替える必要は無い（描き直し・位置の変更なし）。本編の Chapter 1（js/chapter/world-board.js の ART_TILE・look()、js/proto/roadfirst-world.js の ART.landmarks）で正しい地点に出ていることを確認した。

| 納品 | 今のファイル | 置く所 | 種類 |
|---|---|---|---|
| E02_lower_gate | lm_lower_gate.webp | LOWER_GATE のすぐ奥（道をまたぐ。along 3） | 目印（マスの上に重ねない＝奥へずらす） |
| E03_upper_gate | lm_upper_gate.webp | UPPER_GATE のすぐ奥 | 目印 |
| E04_seal_gate | lm_seal_gate.webp | CHALLENGE の奥（along 14） | 目印 |
| E05_lion_statue | lm_lion.webp | STATUE の分かれ目の奥の空き地（off） | 目印 |
| E08_moss_tower | lm_moss_tower.webp | L_CHEST の奥 | 目印 |
| E09_forest_altar | lm_forest_altar.webp | L_ALTAR の奥 | 目印 |
| E11_cliff_shrine | lm_cliff_shrine.webp | L_LATE_ALTAR の奥 | 目印 |
| E12_watch_post | lm_watch_statue.webp | REWARD5 の奥（第3便では「watch_statue」の名前で保存。絵は同じ） | 目印 |
| E13_rainbow_falls | lm_rainbow_falls.webp | R_SPECIAL の奥 | 目印 |
| E14a_den_closed／E14b_den_open | lm_den_closed／lm_den_open.webp | RANDOM_DEN の奥（その回の開閉で入れ替え） | 目印 |
| G2_goal | tile_goal.webp | GOAL のマス | マス |
| G3_merge | tile_merge.webp | 2本以上が入ってくる地点のマス | マス |
| G4_gate | tile_gate.webp | LOWER_GATE・UPPER_GATE のマス | マス |
| G5_challenge | tile_challenge.webp | CHALLENGE のマス | マス |
| G7_den | tile_den.webp | RANDOM_DEN のマス | マス |

能力6種・イベント・休憩・野生・レア・宝箱・ライバル・分かれ道・通常のマスの新しい上面（共通17種）は**この16枚に含まれない**＝本編は tiles_v2 のまま。新しい上面の試作は TOP01（ライフ）・TOP07（野生）の2種だけ（assets/fields/ch1a/tiles_top_1011/・?tileTop=1011・検収前）＝未着：ちから・かしこさ・命中・回避・丈夫さ・イベント・休憩・レア・宝箱 1／2・ライバル・分かれ道・通常（白紙）・START・宝の行き止まり。

## 2026-10-14 Chapter 1 B／C（景観のパターン。js/proto/roadfirst-world.js の VISUAL）

新しい絵は無い（このフォルダの既存の素材だけ）。A＝従来のまま。B「花と清流の草原」＝prop_flowers・prop_shrub・prop_tree を多く、prop_reeds を草地にも少し、川の景物（prop_lilies・prop_stream_rocks・prop_reeds）を密に。
C「岩丘と遺跡の草原」＝prop_rock・prop_mossy_rock・prop_pillar を多く、**rock_pillar.webp（遺跡の柱）と cliff_grass_chunk.webp（岩棚）をここで初めて画面に出す**（道の外に散らす景物）、prop_peak の岩峰を道から離れた所に7つ足す（決まった乱数）。
道・地点・マス・固定の報酬・目印・大会会場・谷・雲海・森の範囲は3つとも同じ。
