# D02 分岐の見た目16点（Chapter 1〜4 × 4種）

**既に画像 AI で完成していると伺っています。リポジトリには届いていないので、まず完成品の再送をお願いします。** 無い場合だけ、下のプロンプトで作ってください。

仕様の元：docs/next_1019/BRANCH_UI.md。受け取ったら、js/chapter/world-board.js の `BRANCH_SKIN` にパスを書くだけで、本編と QA の両方に出ます。

## 4種（各 Chapter に1点ずつ）

| 鍵 | 名前 | 置く所 | 大きさ・形 |
|---|---|---|---|
| junction | 分岐の印 | 道が分かれる円の広場の奥（道の外） | 透過 PNG・ほぼ正方形・512×512 程度。地面に立つ小さな石柱・紋章 |
| merge | 合流の印 | 道が合わさる円の広場の奥 | 同上 |
| post | 道標（方向の看板） | 分かれ道の奥（マスの奥・先へ進む道どうしのあいだ） | 透過 PNG・縦長・384×768 程度。**看板の板は無地**（文字と矢印はゲームが描く）。根元が絵の下端 |
| board | 選択の看板（画面の UI） | 分かれ道の選択肢の下地 | 横長 約 7:1（1400×200 程度）・角丸・中央は暗めの無地（文字が乗る） |

## Chapter ごとの素材感
- Chapter 1「はじまりの草原」：苔むした灰色の石と木。
- Chapter 2「潮風の海岸」：白い石＋青いモザイク＋金の飾り（港の雰囲気）。
- Chapter 3「天空の浮島」：白亜の石＋金＋青い結晶。
- Chapter 4「灼熱の火山」：黒い玄武岩＋錆びた鉄＋溶岩の赤い光（ref_ch4_signpost.webp が既にある道標＝これに合わせる）。

## プロンプト（例：Chapter 2 の道標）
```
Game asset for a mobile JRPG board game: a standing wooden-and-stone direction signpost for a seaside harbor town, white stone base with blue mosaic tiles and gold trim, a blank empty sign board (no text, no arrows), seen from a slightly elevated front three-quarter view, 384x768 pixels, transparent background, the bottom of the post touches the bottom edge of the image, soft contact shadow only directly under the base, painterly anime style, crisp edges. No checkerboard, no white outline, no characters.
```
（Chapter と種類を入れ替えて16点。分岐の印・合流の印は「a small stone marker pillar with an emblem of two diverging paths／two joining paths」）
