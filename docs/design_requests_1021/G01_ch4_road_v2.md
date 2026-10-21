# G01 Chapter 4「灼熱の火山」の道一式 v2（4 点・必須）

## なぜ
- iPhone 試遊で「道のクオリティが低い、画質が粗い」（Chapter 4）。
- 今の絵（E04）は解像度は足りていますが、**縁石が石畳とほぼ同じ暗い色**で道のふちが分からず、**地面は遠くで平らな茶色**、**石が大きく単調**です（ref_ch4_now_challenge.jpg・ref_ch4_now_start.jpg）。
- Chapter 1（ref_ch1_road_style.jpg）と同じくらいの細かさと立体感で、火山らしい道にしたいです。

## ゲームの中の大きさ（参考）
- 道の石畳の幅 22 単位＋両側の縁石 4.2 単位。石畳の絵は 1 枚を 44 単位四方で敷く（＝道の幅は絵の半分）。
- 地面の絵は 1 枚を 40 単位四方で敷く。円の広場は半径 15.5〜19 単位（マスは幅 11.5 単位）。
- iPhone でいちばん近づいたとき 1 単位＝画面の約 14 画素。

## 1. 石畳のタイル `G01_1_ch4_road.png`
- **2048 × 2048 px・透過なし・縦横とも継ぎ目なし**。
- 黒〜焦げ茶の玄武岩の石畳。石は今より小さく（1 枚の中に横 8〜10 個ほど）、形と明るさに変化。目地は細く暗く、ところどころに**かすかな橙の熾火（おきび）の光**。灰のほこり・小さな欠け。中央がやや明るく、全体の明るさは今より 1 段明るい（暗い地面の上で道が読めるように）。

```
Seamless square texture tile of a volcanic basalt cobblestone road for a top-down mobile JRPG board game, orthographic top view, 2048x2048 pixels, tiles seamlessly in both directions.
Small irregular dark basalt and charcoal-brown paving stones (about 8 to 10 stones across the tile), varied shapes and subtle tone variation, slightly beveled edges catching warm light, thin dark mortar joints with a few faint glowing orange ember cracks, light grey ash dust in the joints, small chips and wear.
Overall value one step brighter than pure black so the road reads clearly against dark volcanic ground. Painterly anime JRPG style matching a lush high-quality fantasy board game, crisp details, no large repeating features.
No text, no symbols, no objects, no checkerboard.
```

## 2. 縁石の帯 `G01_2_ch4_curb.png`
- **2048 × 160 px・透過 PNG・横に継ぎ目なし**（上下の端は道の外側＝縁石の外は透明）。
- 石畳より**はっきり明るい・高い**縁石：風化した灰色がかった玄武岩のブロック＋上面に細い真鍮（ブロンズ）の帯。ブロックの継ぎ目に小さな溶岩の光。縁石の外側に落ちる短い影も絵に含める（下の端の数画素）。

```
Seamless horizontal strip of a raised curb for a volcanic road, top-down orthographic view, 2048x160 pixels, transparent background outside the curb, tiles seamlessly left-to-right.
A row of weathered grey-brown basalt curb blocks, clearly lighter and taller-looking than the dark cobblestone road, a thin bronze metal band running along the top face, tiny glowing lava lines in some block joints, a short soft shadow along the outer edge.
Painterly anime JRPG style, crisp details. No text, no checkerboard, no white halo.
```

## 3. 円の広場 `G01_3_ch4_plaza.png`
- **1024 × 1024 px・透過 PNG**（円の外は透明）。円の直径＝絵の幅いっぱい。
- 1 の石畳と同じ石で同心円に敷いた床、ふちは 2 の縁石と同じ色の輪（360° 切れ目なし）。**中心は無地**（マスを置くため・紋章を入れない）。

```
Circular plaza of volcanic basalt paving stones in concentric rings, top-down orthographic view, 1024x1024 pixels, transparent outside the circle, the circle fills the whole image.
Same stones and colors as a dark basalt cobblestone road with faint ember-glowing joints, an unbroken raised outer ring of lighter weathered basalt curb blocks with a thin bronze band, plain center with no emblem.
Painterly anime JRPG style. No text, no symbols, no checkerboard.
```

## 4. 地面のタイル `G01_4_ch4_ground.png`
- **2048 × 2048 px・透過なし・縦横とも継ぎ目なし**。
- 火山の地面：黒い火山灰と焦げ茶の岩肌、ひび割れた冷えた溶岩の殻、軽石の小石、**かすかな赤い熾火の筋**。明暗の変化を大きめに（遠くで平らな一色にならない）。道より暗く、道より彩度が低い。

```
Seamless square ground texture of volcanic terrain for a top-down mobile JRPG board game, orthographic top view, 2048x2048 pixels, tiles seamlessly in both directions.
Black volcanic ash and dark brown rock, patches of cracked cooled lava crust, scattered pumice pebbles and small rocks, a few faint dim-red ember veins, noticeable large-scale variation in brightness and texture so it does not look flat from a distance.
Darker and less saturated than the cobblestone road. Painterly anime JRPG style, crisp details, no large distinctive features that would show tiling.
No text, no objects, no checkerboard.
```

## 入れ方（こちらの作業）
- assets/fields/gl_1020/ch4_road・ch4_curb・ch4_plaza・ch4_ground を差し替え（縮小・WebP のみ・色は変えない）。今の絵は残します（戻せるように）。
- 4 点そろわなくても、届いた絵から差し替えられます。
