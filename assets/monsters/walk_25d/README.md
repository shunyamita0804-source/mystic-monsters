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
