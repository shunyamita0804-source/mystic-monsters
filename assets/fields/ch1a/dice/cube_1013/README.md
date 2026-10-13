# 立体サイコロの正式の面（2026-10-13 開発25 E）

Chapter 1 の世界のボードの立体サイコロ（js/chapter/dice-cube.js の skin 'official'）の6面。
正式サイコロの絵（assets/fields/ch1a/dice/dice_blank.webp・dice_stop_1・dice_stop_5＝Phase 12 の正式素材・360×384 の斜めから見た絵）の上面を、
tools/dice1013/faces.py で正面向きの正方形に直しただけ（新しい絵は描いていない）：

- 地（真珠色の大理石・金の角）＝dice_blank.webp（無地の正式の絵）の上面のひし形を4倍の解像度で正方形へ変形（QUAD）。6面とも同じ地。
- 目（金の宝玉）＝dice_stop_5 の中央の目1つを切り出し、標準の配置（3×3 の格子）に置いた（斜めの絵のままだと目が斜めに並ぶため）。
- 1 の面＝dice_stop_1 の紋章を円で切り抜き、正面向きに回した。
- 256×256・WebP。

| ファイル | 元 | sha256 |
|---|---|---|
| face_1.webp | dice_blank（地）＋dice_stop_1（紋章。2026-10-13 開発27（16）：紋章の外形を円に＝縦に約12%長かった） | 30f938aade639554a3fe82d18b4cae93d831bf53592f29eebbdc719f401415ec |
| face_2.webp | dice_blank（地）＋dice_stop_5 の目 | 4fc5c07bfe74d499079774e258abb243e7f7f419dcc25aa7b2f443e36b5bda1d |
| face_3.webp | dice_blank（地）＋dice_stop_5 の目 | f185394e0b843aa40503b61222586f6862026479e03cc58fc7bb95289bfdfcdc |
| face_4.webp | dice_blank（地）＋dice_stop_5 の目 | 6c3eaada13b00c01cd74c3b975dbb7a2682854c3618d7992f01e124d9dc1c485 |
| face_5.webp | dice_blank（地）＋dice_stop_5 の目 | a7ba508b379e08f5926fdf40126e1c685609c5c83e9487de502db8912bb1da30 |
| face_6.webp | dice_blank（地）＋dice_stop_5 の目 | 20b17fa949265e1a129f77a432fe771f93fe27783c6cc0fee595d9d4e9faf2f6 |

元の停止画像（dice_stop_1〜6・dice_blank）と投げる10コマ（assets/dice/std）は変えていない（Chapter 2・旧ボード・特訓のサイコロは従来どおり）。
