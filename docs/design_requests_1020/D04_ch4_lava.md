# D04 Chapter 4 の溶岩（3点）

## 使い方
- 盤の東側を、火口から麓へ流れる**溶岩の川**（幅は道の約 1.5 倍）と、火口の中の**溶岩の湖**があります。
- 今はコードで描いています（芯の明るい流れ・冷えた岩の板・焦げた岸）。iPhone 試遊で「一本線を取って貼ったようでチープ」と指摘され、描画は直しました。本物の質感にするには絵が要ります。

## 1. 溶岩の川の帯
- 大きさ：**横 3072 × 縦 512 px**（透過 PNG）。横方向（流れる向き）に継ぎ目なし。
- 中身：真ん中が明るい黄〜橙に光る流れ、両側へ赤く暗くなる。表面に冷えて黒くなった岩の板が浮き、割れ目から光が漏れる。上下の端は焦げた黒い岩の岸で、外側は透明。

```
Seamless horizontal texture strip of a flowing lava river for a top-down mobile JRPG board, orthographic top view, 3072x512 pixels, transparent background beyond the banks.
Glowing molten core in bright yellow-orange along the center, deepening to red and dark crimson toward the edges, floating crusts of cooled black basalt with glowing cracks, subtle flow streaks along the direction of flow.
Both banks: charred black volcanic rock with small rubble, slight orange heat glow on the rocks nearest the lava.
Painterly anime JRPG style, rich but not oversaturated, tiles seamlessly left-to-right. No text, no objects, no checkerboard.
```

## 2. 溶岩の湖のタイル
- 大きさ：**1536 × 1536 px**（透過なし）。縦横とも継ぎ目なし。川の帯と同じ色・質感で、流れの向きが無い（渦・泡・冷えた岩の島）。

## 3. 溶岩の岸の帯
- 大きさ：**横 2048 × 縦 256 px**（透過 PNG）。横に継ぎ目なし。湖や川のふちに沿って置く、焦げた岩の岸と熱で赤くなった地面（片側＝溶岩の側は透明）。
