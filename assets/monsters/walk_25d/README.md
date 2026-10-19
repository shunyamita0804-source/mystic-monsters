# 2.5D の歩行コマ（2026-10-11）

ZIP MysticMonsters_WalkSprites_5Monsters_80PNG（5体 × front／back 各8コマ・512×512 の透過 PNG）の表示用の派生。
加工は縮小（384×384）と WebP（品質90・アルファ100）への変換だけ。切り抜き・背景の除去・反転・色の変更はしていない（tools/walk25d/derive.py）。
原本はリポジトリに置かない（ユーザーが保管）。

- front＝正面（手前へ＝画面の下へ進むとき・止まっている姿）、back＝後ろ姿（奥へ＝画面の上へ進むとき）。js/chapter/configs/ch1a.js の monsterSprites[種族].dirs。
- 体の高さはどのコマも 463px・下の余白 25px（512px の中）＝h 1.106・foot 0.049。

## 組み込んだセット

ガウル（gauru）の front・back だけ。

## 組み込んでいないセット（原本の修正待ち）

検収で次の問題が見つかったため、派生を作らず従来の表示のまま（原本は変えていない）。

| セット | 問題 |
|---|---|
| soramo front／back（16枚） | 体の右（front）・左右の耳が縦にまっすぐ切れている（コマの切り出しの幅が足りない）。front 02〜07・back 02／03／05／07 は左端に隣のコマの耳の欠片 |
| regnas back 02〜08 | 1枚に体の半分と隣のコマの半分が入っている（切り出しの位置がずれている）。01 も尾が右端で切れている |
| nobiton front 03〜07・back 02 | 左端に隣のコマの欠片（尾・腕）。front 05 などは右の腕が右端でまっすぐ切れている |
| gioru front 02／03／07・back 02 | 左右の端に隣のコマの結晶の欠片・腕の結晶が端でまっすぐ切れている。どのコマも足元に薄い半透明の影（楕円）が残る |
| regnas front | 問題は小さい（06 に小さな欠片）。レグナスはプレイヤーが育てない（盤を歩かない）ので組み込んでいない |

## 元ファイルと sha256

| 元ファイル | 派生 | sha256（元） |
|---|---|---|
| gauru/gauru_walk_front_01.png | assets/monsters/walk_25d/gauru/gauru_walk_front_01.webp | 788bedfa66188890560d05230554a6d9e19b8f17b5569a41f22073b6d25c1304 |
| gauru/gauru_walk_front_02.png | assets/monsters/walk_25d/gauru/gauru_walk_front_02.webp | 56e59de8753b91a21f2086902b097134e7f18509fe6f3e1b8b92e0e984df5c5a |
| gauru/gauru_walk_front_03.png | assets/monsters/walk_25d/gauru/gauru_walk_front_03.webp | d083091a26a529fe482dba0e9716acb0773a955caedf7971d9ae3f70badcb7db |
| gauru/gauru_walk_front_04.png | assets/monsters/walk_25d/gauru/gauru_walk_front_04.webp | 95fb431cd525770d4325d1dba4a4b0941cf9d0c8d6aebb918392925f7698d3e7 |
| gauru/gauru_walk_front_05.png | assets/monsters/walk_25d/gauru/gauru_walk_front_05.webp | e699b35a5b085fd5589e5ae62605d20c9b4c005190627dc4b632c5d4d8a0e8c0 |
| gauru/gauru_walk_front_06.png | assets/monsters/walk_25d/gauru/gauru_walk_front_06.webp | 01fac2b0dc177fea47fac2d671921cc4484a754ec8719fe9da019cb5ce315040 |
| gauru/gauru_walk_front_07.png | assets/monsters/walk_25d/gauru/gauru_walk_front_07.webp | db7b7a4576bb332b473a08e644672a86e88c6f0cce5e863e29123802285f76fa |
| gauru/gauru_walk_front_08.png | assets/monsters/walk_25d/gauru/gauru_walk_front_08.webp | 53200d571958d3c94daaf20da3605ee52510e137068abdebdd21e66e652f8e97 |
| gauru/gauru_walk_back_01.png | assets/monsters/walk_25d/gauru/gauru_walk_back_01.webp | 8ef2d8aebb4a69649c3062fdf6ad5843afbdf1bf7f8e37232d532bbc41b45420 |
| gauru/gauru_walk_back_02.png | assets/monsters/walk_25d/gauru/gauru_walk_back_02.webp | 91a24dd147cfb0479df61b18710a95c71a205f0cc8d943f8e83e1602803d6b63 |
| gauru/gauru_walk_back_03.png | assets/monsters/walk_25d/gauru/gauru_walk_back_03.webp | 30b7e85b8d412b5b9fbdccd0b363ccb079dedb701287086e1b912f7a6e0e9df8 |
| gauru/gauru_walk_back_04.png | assets/monsters/walk_25d/gauru/gauru_walk_back_04.webp | 2a57f5333b58edffc3f5409f299d2b4ab57111e502b27d7cc781a40dd9a791de |
| gauru/gauru_walk_back_05.png | assets/monsters/walk_25d/gauru/gauru_walk_back_05.webp | 9c725a83a1f7bf1fed59755564ef1f619116da761ab59c4361545d1df4d41670 |
| gauru/gauru_walk_back_06.png | assets/monsters/walk_25d/gauru/gauru_walk_back_06.webp | e9ead3862e5fe00cfd661395759d70d5b221dce908941f12dad96aa44eb076d4 |
| gauru/gauru_walk_back_07.png | assets/monsters/walk_25d/gauru/gauru_walk_back_07.webp | 8d127a12b4ba2b35d8fd44b400079c1928f65c347fd084ed871b96260c11a491 |
| gauru/gauru_walk_back_08.png | assets/monsters/walk_25d/gauru/gauru_walk_back_08.webp | a611a64aa1366695cafeac2fd7f8536c7c43f9ec010e76736f0f611b7e1aec54 |

## 2026-10-14 追加：ソラモ・ノビトン・ジオルの front・back（48枚）

ZIP「次回Claude便_2体初期能力_レグナス牙獣種_2p5d歩行48コマ_20261014」の walk_25d/{solamo,nobiton,jiol}（各 512×512 の透過 PNG・作り直された版＝上の「組み込んでいないセット」の問題は見当たらない。目視で欠けた・隣のコマの欠片のあるコマは無し）。
加工はガウルと同じ（384×384・WebP 品質90・tools/walk25d/derive_1014.py）。原本はリポジトリに置かない。ZIP の 03_MANIFEST_SHA256.json には48枚が載っていない＝照合はできていない（下の sha256 は受け取ったファイルから計算）。

- 3体とも体の高さ 438px（上 40px・下の余白 34px）＝h 1.169・foot 0.066。fps 12。
- 横の1歩は歩行の絵を使わず、2.5D の立ち絵を進む向きへ（standFace：ソラモ left・ノビトン right・ジオル right）。旧 2D の横向き（nobiton_walk）は本編の盤では使わない（旧 Chapter 1 の field-view は従来の walk のまま）。

| 元ファイル | 派生 | sha256（元） |
|---|---|---|
| solamo/solamo_walk_front_01.png | assets/monsters/walk_25d/solamo/solamo_walk_front_01.webp | ea159924235dd0ffe5287086f9883d89d5d5d049de124c6149c7300426b2981b | |
| solamo/solamo_walk_front_02.png | assets/monsters/walk_25d/solamo/solamo_walk_front_02.webp | a9ec55d839e21c01718bf2ea167f8fc86b0932ab95b64e92cc6fdf265fa0c117 | |
| solamo/solamo_walk_front_03.png | assets/monsters/walk_25d/solamo/solamo_walk_front_03.webp | e88f8866b5ccff2728ec70b4635487e358681aed273934ec8c97c6a109420e10 | |
| solamo/solamo_walk_front_04.png | assets/monsters/walk_25d/solamo/solamo_walk_front_04.webp | 98574ad341730b7f1999912977600ebcc061d9000fa8952d331a15e4e849c5a2 | |
| solamo/solamo_walk_front_05.png | assets/monsters/walk_25d/solamo/solamo_walk_front_05.webp | 9f19ee8ef35854003a83fa7bb4666d3dc9adcbd56f4409d0ee5c162a154bb4c2 | |
| solamo/solamo_walk_front_06.png | assets/monsters/walk_25d/solamo/solamo_walk_front_06.webp | 01a0c10f2bd54b30915b4091e3aa2111d5c27c4d9a81b91298125937fd38a718 | |
| solamo/solamo_walk_front_07.png | assets/monsters/walk_25d/solamo/solamo_walk_front_07.webp | 9f9c623216f0480e69713e68fcc635a1e461bd7b2fd53042d80a124a2b8b233b | |
| solamo/solamo_walk_front_08.png | assets/monsters/walk_25d/solamo/solamo_walk_front_08.webp | 1c6a2f0c988ef71f897ba8164f7f775a808b51f6623a98138a59ddc6785ac0ee | |
| solamo/solamo_walk_back_01.png | assets/monsters/walk_25d/solamo/solamo_walk_back_01.webp | 5432c0d0f7cd6a0a9fa0125aae06db3b6b4202ec2f3a2c9cf212a21fe4153601 | |
| solamo/solamo_walk_back_02.png | assets/monsters/walk_25d/solamo/solamo_walk_back_02.webp | b9221216aebf65b742c94fb89cafadc25d3c3117fba5f8c606c91ae54d7176c7 | |
| solamo/solamo_walk_back_03.png | assets/monsters/walk_25d/solamo/solamo_walk_back_03.webp | 2c26cef789ffaa4a034e0ab89240e35f2f585ee3f92ba985461b7c952b238906 | |
| solamo/solamo_walk_back_04.png | assets/monsters/walk_25d/solamo/solamo_walk_back_04.webp | 3b21c6cfd59c6d286a2aa734395f3f4671a7334c810ac160f1e7b3cd55efad8d | |
| solamo/solamo_walk_back_05.png | assets/monsters/walk_25d/solamo/solamo_walk_back_05.webp | 507a1d3253b76d84d568dc69812e0a4df2813fc52ac37de6672c29f105ecb699 | |
| solamo/solamo_walk_back_06.png | assets/monsters/walk_25d/solamo/solamo_walk_back_06.webp | 4d9c5c0a8e452c421a6ae2cae41c33cfbc9e0e6bd812a443d55e2dd40db31d9d | |
| solamo/solamo_walk_back_07.png | assets/monsters/walk_25d/solamo/solamo_walk_back_07.webp | ce508edbdca290930a943722186a8320a10688607001a1c9b06fd47d059ebedb | |
| solamo/solamo_walk_back_08.png | assets/monsters/walk_25d/solamo/solamo_walk_back_08.webp | 5366caa549b4c15f012182ece90492fecac79dea724f8a7db5f38d190ba252be | |
| nobiton/nobiton_walk_front_01.png | assets/monsters/walk_25d/nobiton/nobiton_walk_front_01.webp | ea23a66094ae1e585a7d70da314531125803eefbaf29098e0ab18da5a75598a8 | |
| nobiton/nobiton_walk_front_02.png | assets/monsters/walk_25d/nobiton/nobiton_walk_front_02.webp | 898d6b31422d93b2256a25ef85e92cb8fb34aac476d3529b3d21aac672a3614f | |
| nobiton/nobiton_walk_front_03.png | assets/monsters/walk_25d/nobiton/nobiton_walk_front_03.webp | a4f3c6d6ea4431746837b98fe978439e5b56c9a03427dae31f601835cefba345 | |
| nobiton/nobiton_walk_front_04.png | assets/monsters/walk_25d/nobiton/nobiton_walk_front_04.webp | c5849b505ea0e8144f105a735db719b9f559841cb21ee7d97013bf06cc21d25b | |
| nobiton/nobiton_walk_front_05.png | assets/monsters/walk_25d/nobiton/nobiton_walk_front_05.webp | ab5357ec3eb4177b9b25fdf6b04f4d22fc33083fc090a7f39169050737032af9 | |
| nobiton/nobiton_walk_front_06.png | assets/monsters/walk_25d/nobiton/nobiton_walk_front_06.webp | 5ad7c5da9011b2817be505c038c5bcf868bff7070cec6438ff88e1323f16b6d4 | |
| nobiton/nobiton_walk_front_07.png | assets/monsters/walk_25d/nobiton/nobiton_walk_front_07.webp | 6561008d675cfc9a05592678a3a4aedd9a020309e623bc31ae9500570006dfee | |
| nobiton/nobiton_walk_front_08.png | assets/monsters/walk_25d/nobiton/nobiton_walk_front_08.webp | 7a181c6b1e3f0b88902fbd7e07abb6de910e0129d06ddcd84be7a60208e073f3 | |
| nobiton/nobiton_walk_back_01.png | assets/monsters/walk_25d/nobiton/nobiton_walk_back_01.webp | 3d225905f834f9d07523c87a5389bd243319b0597333c7a2b100efa79eefe8d9 | |
| nobiton/nobiton_walk_back_02.png | assets/monsters/walk_25d/nobiton/nobiton_walk_back_02.webp | 90e4662b9ad29233710a3f4794c7f91f9af27f4236554d4e49cf39d563132ffe | |
| nobiton/nobiton_walk_back_03.png | assets/monsters/walk_25d/nobiton/nobiton_walk_back_03.webp | 0ab8d54518ef5c4409d1b1cf0ebee9a9dbd42dd9f93a567b2946f43cdce2a3d5 | |
| nobiton/nobiton_walk_back_04.png | assets/monsters/walk_25d/nobiton/nobiton_walk_back_04.webp | d9991c4e2e672724f46cf5b6a41a43b8ab41068b5ddf15d6a3686075ba7b4f5b | |
| nobiton/nobiton_walk_back_05.png | assets/monsters/walk_25d/nobiton/nobiton_walk_back_05.webp | f7fe45209453da02a63fe3cd2ef94492dec17a5d5a1d81abe996f2acdd319f69 | |
| nobiton/nobiton_walk_back_06.png | assets/monsters/walk_25d/nobiton/nobiton_walk_back_06.webp | 7a41e615830b939fdfe1f712ec6a62deb05f2e26ef8b892dd9e0ee12bd2e43d7 | |
| nobiton/nobiton_walk_back_07.png | assets/monsters/walk_25d/nobiton/nobiton_walk_back_07.webp | e9c4539035f84a61be85ee62ead612d7ce2a0192ba79527a6942a9dad1f9f803 | |
| nobiton/nobiton_walk_back_08.png | assets/monsters/walk_25d/nobiton/nobiton_walk_back_08.webp | d13a2797e35d41449d97d6c3f74da8e58a4202c7b8dd7ccb1111b80b5ba68467 | |
| jiol/jiol_walk_front_01.png | assets/monsters/walk_25d/jiol/jiol_walk_front_01.webp | 3e804d1ea3dafc2b6a269e0ee65582b15dca472050a5821e07c2460754d4df8a | |
| jiol/jiol_walk_front_02.png | assets/monsters/walk_25d/jiol/jiol_walk_front_02.webp | 5be34399509c37bf2c49842806d995de8722e6bc19e3986cde0d0ee804b3edb0 | |
| jiol/jiol_walk_front_03.png | assets/monsters/walk_25d/jiol/jiol_walk_front_03.webp | 75e744f05538daa7315a09d909a9044198a16e970712ab8fae2b1efeb71171bf | |
| jiol/jiol_walk_front_04.png | assets/monsters/walk_25d/jiol/jiol_walk_front_04.webp | 8f3c461236a050cbac05c301a930cf24606def5ddbada55f805ad9a101e22416 | |
| jiol/jiol_walk_front_05.png | assets/monsters/walk_25d/jiol/jiol_walk_front_05.webp | 6132a8af9ba073db2d7a2b64672ca7215495b741a9726d5f0242f28cecdd6694 | |
| jiol/jiol_walk_front_06.png | assets/monsters/walk_25d/jiol/jiol_walk_front_06.webp | 5ac8ac9b7d8da512019ca0476317e8bd6b3fdad24065a7ebf7b8ed44eaaece31 | |
| jiol/jiol_walk_front_07.png | assets/monsters/walk_25d/jiol/jiol_walk_front_07.webp | 07ceccb3024967ebbc44f6adc84ac9ab04ac5eca10412b23a84f315d9430de07 | |
| jiol/jiol_walk_front_08.png | assets/monsters/walk_25d/jiol/jiol_walk_front_08.webp | 43fcb3734c510b95a021bc120b8c9faf70de56a5dbbb60e5c5cf870630806a3e | |
| jiol/jiol_walk_back_01.png | assets/monsters/walk_25d/jiol/jiol_walk_back_01.webp | 45db20f6a575d17c30c326cb98436e865fbc6ac68d689d14bbd713bbb841dabf | |
| jiol/jiol_walk_back_02.png | assets/monsters/walk_25d/jiol/jiol_walk_back_02.webp | 78ee87ac3d486f727bda5e71da2dac879bce67bcdb28c04ea38f71716cda908f | |
| jiol/jiol_walk_back_03.png | assets/monsters/walk_25d/jiol/jiol_walk_back_03.webp | 8341802e94b737d700b746186dd514c4d55344bc9e302c908eae13b2fb9bef38 | |
| jiol/jiol_walk_back_04.png | assets/monsters/walk_25d/jiol/jiol_walk_back_04.webp | 0a75f8c825d4d1b3b7b68bf829965e9033a159a82fb13889089e4e73cc2b60a6 | |
| jiol/jiol_walk_back_05.png | assets/monsters/walk_25d/jiol/jiol_walk_back_05.webp | 3ff2d4e0d42e0636f62d9df19df49c92b5e54c38adfc163e106072eed4498818 | |
| jiol/jiol_walk_back_06.png | assets/monsters/walk_25d/jiol/jiol_walk_back_06.webp | a40b3e30731691980b8408b14be593e5fc5f8f1f66a72f14e6243ad0b126b335 | |
| jiol/jiol_walk_back_07.png | assets/monsters/walk_25d/jiol/jiol_walk_back_07.webp | 435c0baf902d31b970e0a8666b222050e192234bd1738f318295f91b5f174ab5 | |
| jiol/jiol_walk_back_08.png | assets/monsters/walk_25d/jiol/jiol_walk_back_08.webp | 36853e9c3322471c6a1552a790330165524c3247f7cbc984efa4490f1ce998c3 | |

## 2026-10-15：フルーネの front・back 各8コマ（ZIP Mismon_Flurene_Walk_And_Claude_Instructions_20261015 の walk/）

- 原本は 512×512 の透過 PNG（歩行元の JPEG から ChatGPT が透過化＝**加工済み・ユーザー実機未検収**）。派生は縮小（384×384）と WebP（品質90・透明100）だけ（tools/walk25d/derive_flurene.py）。描き直し・切り抜き・色の変更はしていない
- js/chapter/configs/ch1a.js の monsterSprites.flurene.dirs（fps 12・idle 0・h 1.125・foot 0.047＝足の位置と体の高さを他の4体と同じ基準で測った値）。**フルーネは未解禁＝本編の盤には出ない**（確認は QA 試遊モードの「歩行を確認」だけ）
- 気づいた点（原本のまま・直していない）：
  - 16枚とも葉の縁に白っぽい細い縁取り（半透明で明るい画素が各 約4,700〜6,000）＝濃い背景で目立つ（元の白背景の残り）
  - back_05 の右端（x 458）に不透明な画素が縦に 57 並ぶ＝まっすぐ切れた所がある可能性（元のシートで隣のコマと接していた）
  - back_03（左右 8・13）・front_01（左右 18・23）も端の列に不透明な画素＝見切れの可能性（指示書の注意のとおり・正式合格としない）

| 原本 | 派生 | 原本の sha256 | 派生の sha256 |
|---|---|---|---|
| walk/front_01.png | flurene/flurene_walk_front_01.webp | 8b8dbe1fffb33bd43741928c2493c8ef2367ee6ac5c759245d51384d159cc1d1 | 64831c5689e78ef7183a2488c55308ea50ec7bcd54065c697a27e047c1832c0f |
| walk/front_02.png | flurene/flurene_walk_front_02.webp | 041d93a33f4bf00b59b9e10c24426a5465d0d06d413c18b044c3c55f8d4ff0e8 | abfb9776953c3bc80752fb6427d5c3407660daf849ec4e338b6e1d32952ecd13 |
| walk/front_03.png | flurene/flurene_walk_front_03.webp | 4b8382f5b2a4b0ab1229b08d3cd28e06491e9b7bd04daa4009a4e7f51e35adad | 9f098bcd3be32659d2d6fdcccf8d5913640201eb0dcc04ba4bdab227ca9132f1 |
| walk/front_04.png | flurene/flurene_walk_front_04.webp | e082b725f510ab6f875859ddf824262da882d3840d476723faeef9e73d002075 | a6c1bf281188fa87494855e28956c518c702cd799f47ee4237f19485e1367f6b |
| walk/front_05.png | flurene/flurene_walk_front_05.webp | 3fa3e9f1b3aa2fed97f9ba040ba0ae0240be56d1f1afbe6d3fd27e851f75a7a4 | 77400358de9e15c2a17d3e08e2194bed70b40b85652cdbfe11e3b84da658841e |
| walk/front_06.png | flurene/flurene_walk_front_06.webp | 0e81bdfa59a0cdb256eb94ecb4cf3937eae4bc53b648654f379c31be143eef56 | 64a2180d2efb1d8365402d0feaceb5b8019df2c68406dedcf2cb0eeed5181e3d |
| walk/front_07.png | flurene/flurene_walk_front_07.webp | 8ab93c1e193ef99df31112c85caeb03e6a5a1d22202e154e9c5d3f9c27858157 | 2154e762725be1ca6367b646fb0948a579d3e1b918bea752dca5301273b1b02c |
| walk/front_08.png | flurene/flurene_walk_front_08.webp | fef00883c77af35447d9f645481a6e038df180896aa9125a6671d83f12e6ac9d | ff8c0f72581d4adc2f6bb9ca9c88033872beddd1394c49ba450b6a18c59c10d8 |
| walk/back_01.png | flurene/flurene_walk_back_01.webp | 1ac27a85d60781c45934ca9ccfb73777e7f949b3ae77f5a780423e2bd14e098a | dc90924b972f5907259bf1e1387b09ffca810803a1c94784e580a3f578a33e14 |
| walk/back_02.png | flurene/flurene_walk_back_02.webp | cdf5da287893c3d59c3722b98be2252347452f1c512e70ac812f64ada20ac1f4 | 1e81fd28c990f98aa4df64eead6252fffe5fe0f31ca94f6982ec0c9a9411ec28 |
| walk/back_03.png | flurene/flurene_walk_back_03.webp | 73b5543afebf1bc11a78e679feea08e2ecc26a7ad800d80051a6d4a732a75a28 | 1c508c4f7a4bce0398eda8ea51b337b16e34ccc278d5d8e5447af8a8c11c0eda |
| walk/back_04.png | flurene/flurene_walk_back_04.webp | e0e055c41cf9aa974bfbc027737c80b34672532c5c35894105533113d830b740 | 254422d4525057d0fcdcac829db4c19b51c7b864ae0e4dce571b064467556a48 |
| walk/back_05.png | flurene/flurene_walk_back_05.webp | b810595a84fe5e58fbfdf9055616a325d3e6c30323ec8ad296febf471745723e | 176db628c6adbb2cbb4c585452a8263bae7217d8013aa0ccbd7931d1ced1fb87 |
| walk/back_06.png | flurene/flurene_walk_back_06.webp | 465a6da1bb6b37082557888ee95dc0e3f2bdb49d3ef8bd3035e53c9a9c8700ff | 77c0112dd308fbc69a572f21014561609bfc681cdca9b8f4f00f1a679af7b775 |
| walk/back_07.png | flurene/flurene_walk_back_07.webp | 61949935f4c7231e55c7fd1f35d7f05785a26a30b845d227b93b9bff8f9878af | f3ca63a05b2afac2ceb14bee27090532456c9d3f8eaa1fcd912fa4c375c64f9d |
| walk/back_08.png | flurene/flurene_walk_back_08.webp | 41ab479e9542516f5398a6a568cb76472eec88b535578c138d11db092c9fccd4 | 37387717f8c929bec4df6d3af6daa048db51aab96f61af7cd5bf7aed18d4adf1 |

## カルシェル（2026-10-18・登録のみ・未解禁＝QA 試遊だけ）

- 正式納品 Kalshell_DevAssets_Part01〜07（Mismon_Kalshell_OfficialPackage_ForDev_20261018・ユーザー承認済み）。原本（PNG／MP3）はリポジトリに置かない＝表示用の派生だけ。道具＝tools/kalshell1018/derive_art.py（PIL＋numpy・数値は tools/kalshell1018/derive_art.json）
- 1536×1536 → 384×384 に縮小しただけ（切り出し・描き直しなし）。js/chapter/configs/ch1a.js の `monsterSprites.kalshell.dirs`（front・back・12fps・idle 0・h 1.395・foot 0.144）。本編の盤は番号 → キー（keyOf(7)＝null）で引けない＝出ない。

| 原本 | sha256（原本） | 派生 | sha256（派生） |
|---|---|---|---|
| 03_walk/FRONT/FRONT_01.png | 31babb4261fd1a2e361b04cadfb98f3a67d180222a2d295d1a734e89617e7a10 | assets/monsters/walk_25d/kalshell/kalshell_walk_front_01.webp | c51d5108613c6edd78edee5aee3c03fff1ee816e8d6c924d26861e7ccc81abb0 |
| 03_walk/FRONT/FRONT_02.png | 5420e0f4d4de3c3e58d60e6b002eabfd95551c0fb096836cfb7bfa68da20fd73 | assets/monsters/walk_25d/kalshell/kalshell_walk_front_02.webp | a276d51c584f5eb1e969a24dd20e24906e4599bd5c4b69cbdf697d3a6655a91e |
| 03_walk/FRONT/FRONT_03.png | e3ee892f3eca7d398734749ae18f28d0a9504422cdf65b512ec56880d950e7f6 | assets/monsters/walk_25d/kalshell/kalshell_walk_front_03.webp | c95a06863b9a87899d6696b31674cda030d1cf76a1c24cec2a3d0693ae151a32 |
| 03_walk/FRONT/FRONT_04.png | 65035dc33ed922d12f5f34cb681833201708fdf0ed9b10bff4508058c18ee821 | assets/monsters/walk_25d/kalshell/kalshell_walk_front_04.webp | 69db4b65c24548a2979a642660c802e7378f00db6c50ea633b2c703b54ec69fd |
| 03_walk/FRONT/FRONT_05.png | ead6d6e413a4338db82cf9ff379f5718c489c346ef59f687dc3e3ecd11e15aa9 | assets/monsters/walk_25d/kalshell/kalshell_walk_front_05.webp | 3eddd692b286516f9a6e5bb470cc7b4e6ac1a814d3bb0b46c34bee0f9632438e |
| 03_walk/FRONT/FRONT_06.png | bb2314f2bf113ec2a091785254b0b99dbfc8804a2ed1ecf1e53268977d5fb933 | assets/monsters/walk_25d/kalshell/kalshell_walk_front_06.webp | d5671b0079912a857a7dfc0bc7cba47e4e32341b16dba484073d046ac6b8d826 |
| 03_walk/FRONT/FRONT_07.png | 738f8e290d61962836f82c5fb14cb4b12d1ae9b300bb3b747d3f25e7dc436cee | assets/monsters/walk_25d/kalshell/kalshell_walk_front_07.webp | 35da85ea557d2a76a5535e53aaf2e12ea38dc591674fdc9896de085cd37d2000 |
| 03_walk/FRONT/FRONT_08.png | edc2a0bc50fe8bba80a8b31d327be44bd9ea2e8ae980b0f7d51c11f64acb1db4 | assets/monsters/walk_25d/kalshell/kalshell_walk_front_08.webp | 541269bcdc37c044c94764a765afb8e81b98a29dc85a6b27fe1c0c60db4039ec |
| 03_walk/BACK/BACK_01.png | ce054eecf73132025d6e7c760307648786807a1b9dda385219bcc492e90209f0 | assets/monsters/walk_25d/kalshell/kalshell_walk_back_01.webp | 289a27ffa7ec9e3962d0c8b24b52e1cf56671854ef2858c128dbb11239be0d03 |
| 03_walk/BACK/BACK_02.png | a8fe88f5b6ee66ba09cf7cc28709e0fcf75fe9755314fc09fb6856a96f47394c | assets/monsters/walk_25d/kalshell/kalshell_walk_back_02.webp | dab2e1bfcd359fed8732527269143953120d4876fb47d81d58fb1f433b091d49 |
| 03_walk/BACK/BACK_03.png | 6d7da3603383b0494f663f6320a5f59215a778c1f70a026fcd39d7a857a482d5 | assets/monsters/walk_25d/kalshell/kalshell_walk_back_03.webp | facc275c68a08f5f17b09e07d9444db50a44eb0b983c7a034cc6592ba3771559 |
| 03_walk/BACK/BACK_04.png | 406cdb076ae9c070c794044cc4af7a8218cb5b7d43e35e20553533bc81caf9cb | assets/monsters/walk_25d/kalshell/kalshell_walk_back_04.webp | 8ceaa7c6433110a5871a42b70d49ee33b78d872f18bb4534fa70b32c30eac312 |
| 03_walk/BACK/BACK_05.png | 70072f0105fc9a4c769bf6f53cbc022601fe9641c4b62c0e6c9dce7877fc881e | assets/monsters/walk_25d/kalshell/kalshell_walk_back_05.webp | 41fde3aab8697b65865d06870e45811744ad4e13db6cff7ca79c6f3a6b7fe4f9 |
| 03_walk/BACK/BACK_06.png | 93cb9b3af2904dc761b7831f00c5e79e25a6eee3e7899956be53d8d772cc0ab3 | assets/monsters/walk_25d/kalshell/kalshell_walk_back_06.webp | 5d8e1299eb58d87ee80c02ac5d19f3e6715e8b14fe3eb95e43f82b42ec7c96d5 |
| 03_walk/BACK/BACK_07.png | 5b8d7f5bcb7384a7ae196092ec58bdb2611f55b8e1e6ea06abfeaeddea810409 | assets/monsters/walk_25d/kalshell/kalshell_walk_back_07.webp | d2097735c272ae54dcbaac5cbcd5fb63a31fe766c6cdc08b33d966e29d8f535e |
| 03_walk/BACK/BACK_08.png | 56f2dcde43b84c32675b83331752ea2125cea4afb9912d4c71e941347dbb6507 | assets/monsters/walk_25d/kalshell/kalshell_walk_back_08.webp | 19510ffa0997e8da39e2a0e487695b8a1bb0bb9c4e467777cbe1da1293a1c1ba |
