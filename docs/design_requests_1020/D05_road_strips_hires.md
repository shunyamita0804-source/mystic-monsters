# D05 道路の帯の高解像度版（4点）

## なぜ
- iPhone（画素比 3）で、カメラがいちばん近づいたとき、道の 1 単位は画面の約 14 画素になります。
- 今の帯の解像度は 1 単位あたり Chapter 1 約 17px、Chapter 2 約 11.5px、Chapter 4 の縁石 約 13.6px です。Chapter 2 は足りず、近くで少しぼけます。
- **今の絵と同じデザインで、解像度だけ 2 倍**にしたものが欲しいです（デザインは変えない）。

| # | 元の絵 | 今の大きさ | 欲しい大きさ |
|---|---|---|---|
| 1 | Chapter 2 白い道の帯 R01（ref_ch2_R01_road_strip.webp の原本） | 1392 × 522 | **2784 × 1044**（透過 PNG・横に継ぎ目なし） |
| 2 | Chapter 2 白い石畳（coastal_white_stone_road） | 803 × 756 | **1606 × 1512**（継ぎ目なし） |
| 3 | Chapter 4 縁石 STD_C4_ROAD_02 L／R | 1024 × 57 | **2048 × 114**（透過 PNG・横に継ぎ目なし） |
| 4 | Chapter 4 石畳 C4_ROAD_01 | 512 × 512 | **1024 × 1024**（継ぎ目なし） |

- 元の原本（画像 AI に渡した元の絵）が残っていれば、それを高解像度で書き出すのがいちばん確実です。
- 画像 AI で作り直す場合のプロンプト（例：Chapter 2 の帯）：

```
Upscale and redraw at 2x resolution, keeping the exact same design: seamless horizontal road strip for a seaside harbor board game, top-down orthographic, white marble paving slabs in the center, both edges with a raised curb of turquoise-blue mosaic and gold scrollwork with small gold seashells, transparent outside the curbs, 2784x1044 pixels, crisp details, tiles seamlessly left-to-right. No text, no checkerboard, no white halo.
```
