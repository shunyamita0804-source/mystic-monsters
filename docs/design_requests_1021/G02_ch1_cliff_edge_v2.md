# G02 Chapter 1 の崖のふちの帯 v2（1 点・任意）

## なぜ
- iPhone 試遊で「道の横の崖（赤枠）がギザギザしすぎでチープ」（ref_ch1_cliff_now.jpg）。
- **ギザギザの主な原因は描き方**（帯を短い四角に切って並べていた）で、コードで直します。この絵が無くても直ります。
- 今の帯の絵（ref_ch1_edge_rock_now.webp）は、**同じ形の四角い岩の柱が規則的に並ぶ**ため、曲がる所で不自然に見えやすいです。もう一段質を上げたいときの依頼です。

## 絵 `G02_ch1_cliff_edge.png`
- **2048 × 512 px・透過 PNG・横に継ぎ目なし**（左右の端がつながる）。
- 上の約 1/4＝草地の側（崖のふちの草と小花。上の端は**ふぞろいにやわらかく透明へ**＝地面の草になじむ）。
- 真ん中＝苔の生えた岩の崖の肩。岩の大きさと形は**ふぞろい**（同じ柱を並べない）。
- 下の約 1/2＝谷へ落ちる崖の面。下へ行くほど暗く、**下の端はふぞろいにやわらかく透明へ**（谷の森と霧になじむ）。
- 上下とも直線のふちや、とがった三角を作らない。曲がりに沿って曲げても自然に見える、輪郭の出入りが小さい形。

```
Seamless horizontal strip of a grassy cliff edge for a top-down mobile JRPG board game, viewed from above at a slight angle, 2048x512 pixels, transparent background, tiles seamlessly left-to-right.
Top quarter: lush grass and tiny wildflowers at the cliff lip, its upper edge fading softly and irregularly into transparency so it blends into a grass ground texture.
Middle: mossy natural rock shoulder of irregular, varied boulder sizes and shapes, no repeating pillars or regular columns.
Bottom half: the rocky cliff face dropping into a deep forested valley, getting darker toward the bottom, its lower edge fading softly and irregularly into transparency.
Smooth overall silhouette with only small variations so it can bend along curves naturally, no sharp spikes or straight cut edges. Painterly anime JRPG style matching a lush meadow board, crisp details.
No text, no checkerboard, no white halo.
```

## 入れ方（こちらの作業）
- assets/proto/board_art_1010/edge_rock.webp と同じ使い方（谷のふちに沿って曲げて敷く）。今の絵は残します。
