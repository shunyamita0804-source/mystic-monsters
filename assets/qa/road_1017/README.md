# 道路画質（P0）の QA 素材（2026-10-17・作業ブランチ claude/qa-road-1017 だけ・**正式採用ではない**）

画像AI担当の改修素材（ZIP `Mismon_Ch1Ch2_20261017_Part1_Final`）12枚から作った表示用の派生。**原本 PNG はリポジトリに置かない**（ユーザーが保管）。
作り方：`python3 -I -B tools/road1017/derive.py <原本PNGのフォルダ> assets/qa/road_1017 [<確認画像の出力>]`（同じ原本からは同じファイル）。
ゲームで使うのは URL に `?qaRoadArt=raw|fix` を付けたときだけ（js/qa/road-art-1017.js）。通常の URL・セーブ・盤の中身は変えない。

- **raw**＝原本そのまま（縮小が要る物だけ等倍の縮小）。継ぎ目・周期は原本のまま。
- **fix**＝継ぎ目だけ直した派生：全体の明るさの傾き（平面）を引く → 端の重なりの帯（168px）で誤差が最小になる切れ目を探して左右・上下をつなぐ（切れ目の左右 2px だけを切れ目に垂直な向きに混ぜる＝全面のぼかしはしない・タイル中心の画素は原本のまま）。
  石畳・橋床は切れ目が暗い目地を通るよう明るさの重みを足し（lam）、R1・白石畳・草地はくり返しの周期を石の並びの位相がそろう所に選ぶ（search）。周期が短くなる＝1枚が小さくなるが、1画素あたりの世界の大きさは raw と同じ（石・草の大きさは変わらない）。
- 継ぎ目の数値＝端の列・行の差の平均 ÷ 中の隣どうしの差の平均（左右, 上下）。1 前後で見えにくい。
- px／単位＝絵の細かさ（世界の1単位あたりの画素）。いちばん寄ったカメラ（倍率 5.6）× 画素比 3 ≈ 16.8 が要る（従来の素材は 2.8〜7.1）。

## 原本12枚と派生

| 原本 | 原本 SHA-256 | 原本 | 派生 raw（大きさ・継ぎ目・px/単位） | 派生 fix（大きさ・継ぎ目） | 原本の継ぎ目 |
|---|---|---|---|---|---|
| Ch1_01_grass_A1_bright.png | 5210e541b7be11cf9c18a3f91b355979173a532becde9fd8a41501097f1971ca | 1536×1536 RGB | ch1_ground_a1_raw.webp 1536×1536 [2.42, 3.14] 12.0 | ch1_ground_a1_fix.webp 1189×1178 [1.02, 0.91] | [2.37, 3.1] |
| Ch1_02_grass_A2_flower.png | 255a30fb91d3a737db6ee4cecd1f5e1709ac7dd8acf53a290a68bf3b8a015cd6 | 1536×1536 RGB | ch1_ground_a2_raw.webp 1536×1536 [1.88, 2.29] 12.0 | ch1_ground_a2_fix.webp 1009×1302 [0.95, 0.97] | [1.85, 2.25] |
| Ch1_03_grass_A3_dry.png | 6a478b50db1b57493c54b79e78d3478612515de14a404774b74762011743f5b1 | 1536×1536 RGB | ch1_ground_a3_raw.webp 1536×1536 [1.93, 2.59] 12.0 | ch1_ground_a3_fix.webp 1009×1368 [1.0, 1.13] | [1.91, 2.58] |
| Ch1_04_stone_road_R1_standard.png | c8a1c784454d822e6f4b3d02195f31e28a093ec4078cdd5847a4ec11ef59924c | 1536×1536 RGB | ch1_road_r1_raw.webp 1024×1024 [2.52, 4.32] 17.809 | ch1_road_r1_fix.webp 831×800 [0.89, 0.94] | [3.31, 5.77] |
| Ch1_05_stone_road_R2_premium.png | d99dfb77e988a69ed8821b66ca7ee6001af89197ee63acd58da12d2e4fb534cd | 1536×1536 RGB | ch1_road_r2_raw.webp 1024×1024 [1.45, 2.46] 17.809 | ch1_road_r2_fix.webp 912×912 [1.1, 0.92] | [1.69, 2.83] |
| Ch2_open_sea_water.png | 5bd0ae3aace2066d996fa112b8d54018920fc210d0e72ca2cb7a2365a80562e5 | 1536×1536 RGB | ch2_open_sea_water_raw.webp 1536×1536 [2.33, 2.04] 13.964 | ch2_open_sea_water_fix.webp 1368×1368 [1.17, 1.18] | [2.19, 1.96] |
| Ch2_sea_bridge_deck.png | 0b43f792cb1ce7be81fbcd781e9a846f60fdebba4e10e425b7a7da7b98a6f7dc | 1536×1536 RGB | ch2_sea_bridge_deck_raw.webp 1280×1280 [1.44, 1.2] 17.778 | ch2_sea_bridge_deck_fix.webp 1140×1140 [1.31, 0.7] | [1.49, 1.28] |
| Ch2_coastal_white_stone_road.png | e0e4d6fdd7a7729bd624b8d803e17009c29ad8990ac27876a0b62569375861de | 1536×1536 RGB | ch2_coastal_white_stone_road_raw.webp 1024×1024 [1.7, 2.62] 18.286 | ch2_coastal_white_stone_road_fix.webp 803×756 [1.17, 0.91] | [1.92, 3.09] |
| Ch2_R01_white_bridge_walkstrip.png | 4bbd9819b581b714ff2d1880585700d1fa2857d5b0577e575a28fdb6d4f28f00 | 1552×656 RGBA | ch2_R01_white_bridge_walkstrip_raw.webp 1552×522 [2.13, 4.08] 11.5 | ch2_R01_white_bridge_walkstrip_fix.webp 1392×522 [0.92, 4.05] | — |
| Ch2_sea_bridge_railing_left.png | 4f7eda206efe9c0c37ed51f4e75e348bfe0b9628da3d3fdda74a7ebdc231252f | 1552×656 RGBA | ch2_sea_bridge_railing_left.webp 529×192  24.0 | — | — |
| Ch2_sea_bridge_railing_right.png | e431031776e83a71b9a6e213a8ce1d1a8d37173fda8868935ca12d3716c218fc | 1552×656 RGBA | ch2_sea_bridge_railing_right.webp 556×192  24.0 | — | — |
| Ch2_L02_white_bridge_arch_pier.png | 876bd40eed23261dfb27f282377f71279bf2795d0e7ecae83188490acfd8ed19 | 1024×1024 RGBA | ch2_L02_white_bridge_arch_pier.webp 640×415   | — | — |

## 道の帯（Chapter 1）

既存の帯（assets/proto/board_art_1010/strip_road_stone.webp・高さ 256）の縁石＋新しい R1／R2 の敷石。高さ 384px（23単位＝16.7px／単位・従来 128px）。縁石は元の帯が 256px のため 1.5倍に引き伸ばし（縁石だけは元の細かさ止まり）。長さは R の1枚の整数倍。

- ch1_strip_r1_raw.webp：2880×384・a52f0f724d54090783002a6db79a3bd4db2d4d58d6d6e6636f3d233d42c6890e
- ch1_strip_r1_fix.webp：3116×384・3ad31d7861a6701cd986eccdedbbbafe902cc6aec564c830567eb3f8f1947d2c
- ch1_strip_r2_raw.webp：2880×384・bfa71b9c01a3b62c29473a6709d482b481051135bb0a78101e53325b6bf9262a
- ch1_strip_r2_fix.webp：2565×384・5d12806c47be4ae2d75003153410e5a07e5f82f3b7f69ee79f8e86e26a523f3a

## 派生の SHA-256

- ch1_ground_a1_raw.webp：8db4039629e34e5e8f143cc5ab826c7ae9806d13680a0b1d5455d84a9d1a5700
- ch1_ground_a1_fix.webp：f03e442d3a0b69cea9ccc91b606ce6a892facd4d4311e7e17eaaede21160bf0c
- ch1_ground_a2_raw.webp：324678b36ad69a892f7247c9a4f02149aff278923d32a3dc849028d48a1de946
- ch1_ground_a2_fix.webp：7f2f1b724525ef4dcf2c2ec45175e514bfa8a4708d9ff8ca43687bebffeac007
- ch1_ground_a3_raw.webp：c83f0c766286360533262408e03f93afbd9a43d50ec7d902529763d9f584ef24
- ch1_ground_a3_fix.webp：9a251bdb6d54e49e824f96180e4f89fe6d68d3439ab8a4f64714ae778a6092df
- ch1_road_r1_raw.webp：0b0cdbe1b2e3d65bd9e49df625ebb3c111421ab9738dcddd60c0001c000a4cf9
- ch1_road_r1_fix.webp：1046fde326285d24c8c5da277772781d0876e5da9dda597e743a10c67e08f23e
- ch1_road_r2_raw.webp：8623fb354a796eee0cf607325dccc8847f0793907fccf1b686e6ef1af989fbc2
- ch1_road_r2_fix.webp：80346bcb19b6d7cb3bc58973b580f0d1d82a0d6cf64297d1ba9cca0f1a88c8ee
- ch2_open_sea_water_raw.webp：b84a0c5a4000d078b8a38f0103534c05e4aa0b7d3b77e24fcfd5645909f22dea
- ch2_open_sea_water_fix.webp：2e992fa75e13719efc96d0b11e927ef91a92ac4daccc53363097c571963fad89
- ch2_sea_bridge_deck_raw.webp：29ef1a729e02576c8602f87d1252a1622a53fc97650f7f634a89de4859a5fdfc
- ch2_sea_bridge_deck_fix.webp：60a3daf9f82357a9bcf81449230c5e8da5adeffbcd84ec20c8c6a32e41c2f6a5
- ch2_coastal_white_stone_road_raw.webp：4dccddda47924b76ba1ae31b69751890eeaac60c2540e58b3414e4846122f39b
- ch2_coastal_white_stone_road_fix.webp：a396c7f7d70e0ecf1065c8c404dca2b07cfba820b5fb8230661bf6d72f794eb5
- ch2_R01_white_bridge_walkstrip_raw.webp：cf4228591fae90b36bcc462b8f82b41ce67ab2bae7badb5de79cd51e244c250a
- ch2_R01_white_bridge_walkstrip_fix.webp：30e1bbce662e141a9d997bbe3ae5a20da1c4c6449c4cdbc3d4d38bd49e465016
- ch2_sea_bridge_railing_left.webp：1cfb880f669bc4204ed90a7f88cd05c787228edfbd0a434effb2cd1f6e1b01f2
- ch2_sea_bridge_railing_right.webp：7293d2b72b6ecac7b61d3e4679507143a1b8c2eeee9d59f8fe9cd0d4db84bcae
- ch2_L02_white_bridge_arch_pier.webp：0e2cd05f750e31b8f568d2e06910a8537636973f9b5fbc9acdca1d6d3e06c70b
- ch1_strip_r1_raw.webp：a52f0f724d54090783002a6db79a3bd4db2d4d58d6d6e6636f3d233d42c6890e
- ch1_strip_r1_fix.webp：3ad31d7861a6701cd986eccdedbbbafe902cc6aec564c830567eb3f8f1947d2c
- ch1_strip_r2_raw.webp：bfa71b9c01a3b62c29473a6709d482b481051135bb0a78101e53325b6bf9262a
- ch1_strip_r2_fix.webp：5d12806c47be4ae2d75003153410e5a07e5f82f3b7f69ee79f8e86e26a523f3a

## 受け取った確認用の画像（Part2_Checks・11枚＝ゲームには入れない・リポジトリに置かない）

- check_3x3_Ch1_01_grass_A1.png：1536×1536 RGBA・0eee1e2d41d382093608d061d4e01f6a43b5591fb325bc848e92c0d79aca25d6
- check_3x3_Ch1_02_grass_A2.png：1536×1536 RGBA・54666269947a485e91ebec34246cb3b6d14848cec63d828c5317fb57fca03b23
- check_3x3_Ch1_03_grass_A3.png：1536×1536 RGBA・c96c79d1ce91c9765719eaf860ec5bec2d0800402cdb99973536ff83d67296f5
- check_3x3_Ch1_04_stone_R1.png：1536×1536 RGBA・7b5cb00fc4de39ff24f7f01eb18e9e67444785d49eba1ba57fad710f556ca147
- check_3x3_Ch1_05_stone_R2_cdea4209.png：1536×1536 RGBA・9e2d0f3e449b6a51107ccc7f2e6420f31ad7485772710e5d2386781da4587c39
- check_3x3_Ch2_coastal_white_stone_road.png：1536×1536 RGBA・0dd3b31290a137ff15488514a9bfa61b10b89aaa5712c9f895df82064d2d9fb5
- check_3x3_Ch2_open_sea_water.png：1536×1536 RGBA・a58bfb41c29f48e5e9671f0cc82803a75863a5fd90696d4f515dcdc01f793937
- check_3x3_Ch2_sea_bridge_deck_f657d3e0.png：1536×1536 RGBA・ce4e029ad9c18bc7ab377ea41e8fac928789fd529670eb4de4e554bb8ff5971f
- check_bridge_assembly.png：1552×1024 RGBA・96754ed7db10c5e03e6e0e544472496c07cd89936d2fbff2696ae65be55b5f7f
- check_row3_Ch2_railing_left.png：1552×656 RGBA・a47a25fcef9b84223df126e8c3bd1f9cad4f04b004e413cd066660e200b6f6de
- check_row3_Ch2_walkstrip.png：1552×656 RGBA・1a4d16c00977fe78e4c9a2edaa7b0669e19ed4e648f2e51a33c09f4b9d22d817
