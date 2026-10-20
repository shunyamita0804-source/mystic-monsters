# D06 能力マスの挿絵（Chapter 2〜4 × 6能力＝18枚）

## 使い方
- マスに止まって能力が上がるとき、カードの背景に出る挿絵です（ref_ch1_stat_li.webp＝Chapter 1 のライフ）。
- 今は Chapter 1 の草原の6枚を、全 Chapter で使っています（火山でも草原が出る）。
- 大きさ：**1080 × 720 px**（透過なし）。モンスターは描かない（ゲームが右下に出す）。右下の 35% は少し空けておく。

| 能力 | 絵の主題（Chapter 1 と同じ意味で、舞台だけ変える） |
|---|---|
| ライフ（li） | 体を休めて元気になる場所（泉・日だまり） |
| ちから（po） | 力を試す場所（岩・丸太・重い物） |
| かしこさ（in） | 学ぶ場所（古い石碑・本・星図） |
| 命中（hi） | 狙いを定める場所（的・遠くの目印） |
| 回避（ev） | 身をかわす場所（風・飛び石・狭い足場） |
| 丈夫さ（de） | 耐える場所（固い岩壁・盾・嵐） |

- Chapter 2「潮風の海岸」：白い港町・砂浜・青い海・灯台。
- Chapter 3「天空の浮島」：雲海・浮島・白亜の遺跡・青い結晶。
- Chapter 4「灼熱の火山」：黒い岩・溶岩の光・火山の村・夕暮れから夜の空。

```
Background illustration for a mobile JRPG event card, 1080x720 pixels, no characters, painterly anime style. Scene: [Chapter setting] place themed on [stat theme], e.g. "a volcanic training ground with heavy basalt boulders and glowing lava cracks at dusk" for STRENGTH in the volcano chapter. Keep the lower-right 35% of the image calm and slightly empty (a creature will be overlaid there). No text, no UI.
```

# D07 出来事の挿絵（後日の制作の一覧）

- 大きさ：1080 × 720 px・WebP 可・透過なし。
- 背景の鍵 `ch{N}:{出来事の ID}` で引きます（js/chapter/event-themes.js）。
- 枚数：Chapter 2 で 10 枚、Chapter 3 で 24 枚、Chapter 4 で 24 枚。
- Chapter 2 の 10 枚の出来事 ID：shade・break・spring・holy_spring・herb・trip・coin・sage・charm・legend_spring
- Chapter 3・4 の出来事 ID は js/chapter/configs/ch1a.js の eventPool と同じ ID です。
- 出来事の文（仮案）は js/chapter/event-themes.js にあります。

# D08 円の広場の床と縁（任意・Chapter 1〜4 × 1枚）

- 今は道の帯の縁石を円に沿って並べて、広場を作っています。継ぎ目は目立たなくしてありますが、1枚の絵ならもっとくっきりします。
- 大きさ：**1024 × 1024 px**（透過 PNG）。真上から見た円形の広場。外周に、その Chapter の道と同じ縁石を 360° 切れ目なく描く。床は道と同じ石。円の外は透明。
- 道が入る所の縁石は、ゲームが切るので描いたままで可。

```
Top-down orthographic circular plaza for a mobile JRPG board game, 1024x1024 pixels, transparent outside the circle. The floor uses [the chapter's road paving], the rim is a continuous 360-degree raised curb matching [the chapter's road curb] with even width, crisp edges, soft ambient occlusion inside the curb, no text, no emblem in the center (a game tile sits there).
```
