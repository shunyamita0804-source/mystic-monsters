# Chapter 4「灼熱の火山」正式素材の表示用派生（2026-10-19）

納品：Mismon_Ch4_FINAL_20261019（PART01 RoadBridge・PART02 TerrainBG_UI_FX）と修正差分（UI透過・橋候補）。原本 PNG はリポジトリに置かない（ユーザーが保管）。
作り方：`python3 -I -B tools/ch4art1019/derive.py <PART01> <PART02> <修正差分>`（透明な余白を切る・縮小・WebP だけ。描き直し・色の加工なし）。

## 採否
- C4_UI_01_EVENT_BASE_v2：市松模様が焼き込まれた不透明の絵＝**使わない**。修正差分の v3_ALPHA を使う。
- 橋の床：v2 と v3_CANDIDATE を B の盤（Q_R1）の上で同じカメラで並べて比べた。見え方の差はわずかで、v3 は道の石材（C4_ROAD_01）に色と大きさを寄せた候補＝道からのつながりが自然な **v3 を採用**（js/proto/ch4-world.js の DECK）。比較の画像は docs/next_1019/ch4_bridge_deck_v2_v3.jpg（左 v2・右 v3）。
- STD_C4_ROAD_06（立体の石板）・C4_ROAD_03_EDGE_BLEND（細い石の切れ端）：真上から描く道の canvas に合う使い道が無い＝派生を作っていない。
- T／Y の分かれ目の絵：形が固定（T・Y）で、盤の実際の分かれ目の角度と合わない＝派生は作ったが盤では使わない（広場の円で代用）。

## 未着（ブロッカー）
- 巨大火山の4分割原画（TL／TR／BL／BR）：リポジトリ・今回の ZIP のどこにも無い。山体（円錐の陰影・等高線の段・火口）と溶岩（湖・川）は描画で代わりに作っている（旧い火山・旧盤の絵では埋めていない）。
- 溶岩の絵：届いていない＝描画の塗り（芯の明るい橙 → 暗い赤・冷えた表面の筋）。
- Chapter 4 専用の目印（C4_LM_START_GATE〜C4_LM_DEN・docs/ch4/DESIGN.md §8）：Chapter 1 の目印のうち火山に合うもの（門・像・祭壇・隠れ家）と、上の岩の崖・溶岩の尾根で代わりに置く。

## 対応表（原本 → 派生・sha256）

| 派生 | 使う所 | 大きさ | 派生 sha256 |
|---|---|---|---|
| ground_basalt.webp | 地面（くり返し・120単位） | 512×512 | `006ced170699df0a03576fadba856e9136f499eeba539605652c04b46167396e` |
| road_basalt.webp | 道の石畳（くり返し・40単位） | 512×512 | `c9787596b8f216fea65e4e6fca71aeaf886760b0cc6687ea8ca5a756b2a9cea7` |
| plaza_disc.webp | 分かれ目・合流・行き止まりの広場（直径50単位） | 512×479 | `e6b7584542673877b143707384d597dfdb5398036b899ad9a6c7d3b5b49de243` |
| road_t_fill.webp | 未使用（T字の形が固定＝実際の分かれ目の角度と合わない。広場の円で代用） | 512×512 | `95b8a614ec622228845ad2949980ed1ed671a2128e3a7df2e1116b97f8c0d604` |
| road_y_fill.webp | 未使用（Y字の形が固定＝同上） | 502×512 | `3e2df9929419d2e5aed6ae819db27ea1198e93a94eb4aeff7824b6017a71e94e` |
| curb_l.webp | 道の左の縁石（曲線に沿った帯） | 1024×57 | `95d6413de25881fbb7db99b768c08823512363486e5fd806d24d080f8611268f` |
| curb_r.webp | 道の右の縁石 | 1024×54 | `8fda579b02c45f7fba9cf48cfbd7f3db192a5085ef9e325a551d119970ae727f` |
| bridge_deck_v2.webp | 比較用（盤の上で v3 と比べた＝不採用。ファイルは比較の記録として残す） | 411×768 | `200c6c38a6b6dffc2db5312f63b7d88d34c9c667fe9f302acab6a40ac1ea741a` |
| bridge_deck_v3.webp | 採用：溶岩の上の橋の床（B の Q_R1・Q_R5） | 417×768 | `8c90e2056585675aa4475b52cfc0121bd221f86704262bd8c9e526e0ce962c3f` |
| rail_l.webp | 橋の左の欄干 | 1024×163 | `1ce86cf484f8e5981be90121380532ccc050869458e71ade5fcf4134ae1680c5` |
| rail_r.webp | 橋の右の欄干 | 1024×156 | `5fbcf5a24acae74f003eec577a132bd2b2c6910d586a310a0545a9e7f4dc10d4` |
| rock_cliff.webp | 斜面の岩の崖（景物）・黒曜の宝物庫の目印の代わり | 768×459 | `a11ed5aed0bb2313c9e806146fb6b8e3e275cab3600c7b7933bab884f62b3dda` |
| lava_ridge.webp | 溶岩の尾根（景物）・溶岩の泉の秘宝の目印の代わり | 768×363 | `ddbab34319b7103a9c8c27726288c165db5c54770ad467336e3478064437de2c` |
| sky_dusk.webp | 盤の後ろの空（夕暮れ＝麓）・Chapter の題字の中継 | 640×960 | `3fb5371cea768957873a4eea86d562dbaac4574a44bf7d79fdc831e004f6d070` |
| sky_night.webp | 盤の後ろの空（夜＝火口縁）・会場の正門前 | 640×960 | `35bc08ac082152b3f544f64ffa71cc7e773f1154f33e1f45db1ccdb89fe92f5f` |
| goal_gate.webp | 火口縁の闘技場の門（GOAL）・正門前 | 491×720 | `f59e22f50915f76dccc080f1043349e9127f514db70c01e509561be1cd6a4265` |
| event_base.webp | 固定の出来事の地点の台座（v3_ALPHA。v2 は市松の焼き込み＝使わない） | 384×368 | `0d615e26602818e3f448ead09f170cf1704061fcd04610633aabf7ac1673cc11` |
| signpost.webp | 自由な分かれ道（J0・H）の道しるべ | 189×384 | `f381a6461f006cfaafaa848b1c6bf40c58c89b6572d18d78fd4a1326836d1788` |
| smoke_back.webp | 噴煙（噴気の棚・火口のふち） | 464×512 | `400bd1c93537bd7e41876bdf22e1b5ccdddb137592bf9dbfeff0b60649a88923` |

| 原本 | sha256 |
|---|---|
| C4_TERR_01_BASE_v2.png | `18036bd8af278c3efac6c719b04661f98599cd65cf1891d3d46762dbd6921e83` |
| C4_ROAD_01_ALT_BASALT_v2.png | `f4dce9db97cedca2d15651c8a325f5bc09e60f20c1dd8ec6bda2e75ec97b23f1` |
| C4_ROAD_03_CENTER_BLEND_v2.png | `b0ed089eb5ab3bf21f33b3645d55b53640c84fbe1d62c0edcdfafd7bf760f2af` |
| C4_ROAD_03_T_FILL_v3.png | `6b61ffd5665189448182dcddd90190facfbbd8a0569b73a2e8898bed81fd991c` |
| C4_ROAD_03_Y_FILL_v3.png | `2238959c30c044bd856a487f8e8f5ac3f758262f6c8c50ea0e546102f2bac156` |
| STD_C4_ROAD_02_L_1536x1024.png | `9e94d74428b347594b433199beef7304843625246fb1277fcbdbaf9025498685` |
| STD_C4_ROAD_02_R_1536x1024.png | `d0d86cae3b96b490a2983e92a7d70db377d7b218fb90fa60c6d78a5473a79f6c` |
| C4_ROAD_04_BRIDGE_DECK_v2.png | `cdf2a3f1d98d3c7202c64bc594e9e63870b8c4b583ffdd514145870ada749e3f` |
| C4_ROAD_04_BRIDGE_DECK_v3_CANDIDATE.png | `ed81c4e85c9318d00380e98c2ad4307706985c24fd1c1779161814e6812f4395` |
| C4_ROAD_05_RAIL_L_1536x1024.png | `ed89cf491144d7a35d815427537d7880b298d71c5888bd3e31506b58bac734f2` |
| C4_ROAD_05_RAIL_R_1536x1024.png | `c30bb5f29c0d56e698e6eecdc1a595875e19275fdad4fa2068201cb1895f9998` |
| STD_C4_TERR_03_2048x1536.png | `a7569f4a567dd6bdf53a003b5f9c8ce3cbcb333b80269c57e243861befbbf5a8` |
| STD_C4_TERR_04_1536x1024.png | `ba5e98bfccd25273cf5ab713f8e7688113d479a02962eafb995c71b7a4ffdd38` |
| STD_C4_BG_01_DUSK_2048x3072.png | `f4bce2433303db2c36d110eb76fe90744d6d6712124d9b409febda727ac4f2db` |
| STD_C4_BG_02_NIGHT_2048x3072.png | `bb96e9286a2a4becc02bd4ab701f148b9abd9c9dd825ca27e6d7c348700beca8` |
| C4_ARCH_03_GOAL_GATE_v2.png | `29e777e0c0f01d26bcb75937de8c681dbdd4f2bff16f7503fd3cf1d32154dbbb` |
| C4_UI_01_EVENT_BASE_v3_ALPHA.png | `7cb3ef46e1d7963ef733a6f1a315613e05cacd5dff4a5837bae834895992d823` |
| STD_C4_UI_02_1024x1024.png | `b8176c6d30994a70db73ffa0af6344de3a28d7aa3d953a9d6e029810f8a97cb2` |
| C4_FX_01_SMOKE_BACK.png | `31b642d75c9126eaab02601aea0bfc59e024fb7084a7e26304080323416b302d` |

## intro/ch4_overview.webp
出発準備の Chapter 4 のカードの全景＝盤の描画（A の道・地面と道の区画）を 512×768 に縮めたもの（新しい絵は描いていない）。
