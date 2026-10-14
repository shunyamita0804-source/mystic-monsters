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
