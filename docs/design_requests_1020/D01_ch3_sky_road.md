# D01 Chapter 3「天空の浮島」の道路一式（6点）

## 使い方（ゲームの中）
- 道は雲海の上にかかる**白亜の空の橋**、浮島の上では**白い石畳の道**です。全部の道が「雲の上の橋」として描かれます。
- 道の帯は、道筋に沿って横向きにくり返して貼ります。帯の上下の端が縁石で、真ん中が歩く面です。
- 今は描画で作った暫定の帯です（ref_ch3_now_START.jpg）。色が明るい雲・草と溶けて、厚みもありません。

## 1. C3-R1 道の帯（縁石つき）
- 大きさ：**横 3072 × 縦 512 px**（透過 PNG）。横方向に継ぎ目なしでくり返せること。
- 中身：縦の 18% ずつが上下の縁石（金の線の入った白亜の縁石。外側に**暗い側面＝厚み**が見える）、真ん中 64% が白い大理石の石板（少し暖かい白・灰色の目地・大理石の筋）。縁石の外側は透明。
- 真上から見た絵。光は左上から。

```
Seamless horizontal road strip texture for a mobile JRPG board game, top-down orthographic view, 3072x512 pixels, transparent background outside the road.
A floating sky-island bridge road made of white marble slabs with subtle warm tint and grey grout lines, faint marble veins.
Top and bottom edges: raised white limestone curbs with a thin inlaid gold trim line, the outer face of each curb shows a darker shaded side to convey thickness and height above the clouds.
Soft ambient occlusion where slabs meet the curbs. Light from the upper left. Clean painterly anime-style game art, crisp details, high contrast against white clouds and bright green grass.
Must tile seamlessly left-to-right. No text, no arrows, no characters, no checkerboard, no white halo.
```

## 2. C3-R2 道の床のタイル
- 大きさ：**1536 × 1536 px**（透過なし）。縦横とも継ぎ目なし。中身は R1 の真ん中の石板と同じ。円の広場の床と、道の中央に使う。

```
Seamless square tile texture, top-down orthographic, 1536x1536 pixels. White marble paving slabs in a staggered brick pattern with grey grout, subtle warm tint and marble veins, matching a floating sky temple road. Even lighting, painterly anime JRPG style, crisp, tiles seamlessly in both directions. No text, no objects.
```

## 3. C3-B1 空の橋の側面（厚み）の帯
- 大きさ：**横 2048 × 縦 384 px**（透過 PNG）。横に継ぎ目なし。道の外側に下へ垂れる橋の側面（白い石の梁・アーチの装飾・下側は雲に溶けるように薄く）。

```
Seamless horizontal strip, 2048x384 pixels, transparent background. The side face of a floating white stone sky bridge seen from slightly above: carved white limestone beam with small arches and gold accents along the top edge, fading softly into transparency at the bottom as if dissolving into clouds. Painterly anime JRPG style, light from upper left, tiles seamlessly left-to-right. No text.
```

## 4. C3-B2 欄干の帯
- 大きさ：**横 2048 × 縦 256 px**（透過 PNG）。横に継ぎ目なし。低い白い欄干（柱と手すり・金の飾り）。真上より少し斜めから見た形で、道の両脇に沿って置く。

## 5・6. C3-G1／G2 浮島の地面のタイル
- 大きさ：**各 1536 × 1536 px**（透過なし）。縦横とも継ぎ目なし。
  - G1＝明るい草地（小さな白い花）
  - G2＝草と白い石の混ざった地面（遺跡の近く）
- 既にある Chapter 1 の草地（明るすぎない緑）より少し青みのある、空気の澄んだ色。

```
Seamless square ground texture, top-down orthographic, 1536x1536 pixels. Lush bright green grass of a floating sky island with tiny white flowers and a slightly bluish airy tint (G1) / grass mixed with scattered white stone fragments and old ruin pebbles (G2). Painterly anime JRPG game art, even lighting, seamless in both directions. No objects larger than pebbles, no text.
```
