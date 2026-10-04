# アイテム屋の店主（名前は未確定）：表情4種（2026-10-04 第二段階・追加アセット）

元：ZIP `mystic-monsters_phase2_event-npc-assets_44images.zip` の `08_アイテム屋/`（JPEG・市松模様が焼き込まれたもの）。元ファイルはユーザーが保管（リポジトリには置かない）。

| 表情キー | 元ファイル | sha256（元 JPEG） | closeup | full | face |
|---|---|---|---|---|---|
| normal | 01_通常.jpg | `8aca7676285f8e24…` | closeup/01_normal.webp（109KB） | full/01_normal.webp（157KB） | face/01_normal.webp（25KB） |
| smile | 02_優しい笑顔.jpg | `0a385ed73b2fbe2c…` | closeup/02_smile.webp（110KB） | full/02_smile.webp（155KB） | face/02_smile.webp（26KB） |
| worry | 03_心配.jpg | `85c321d92067b146…` | closeup/03_worry.webp（108KB） | full/03_worry.webp（151KB） | face/03_worry.webp（26KB） |
| recommend | 04_満足・おすすめ.jpg | `b8fd13cb4e83700a…` | closeup/04_recommend.webp（104KB） | full/04_recommend.webp（151KB） | face/04_recommend.webp（24KB） |

- closeup＝頭から腰まで（573×760＝従来の半身と同じ大きさ・会話の立ち絵）。full＝全身（人物の範囲で切り出し・縦 960px）。face＝頭の上から肩まで（256×256・小さな顔の吹き出し）。
- 透過 WebP（品質 90・アルファ品質 100）。色は変えていない（CSS の filter も使わない）。
- 透明化の方法：画像の縁からつながる「明るい無彩色」（市松の2色とそのにじみ）だけを背景にする（格子は当てはめない）。人物に囲まれたすき間は、市松の2色が「マスの大きさの正方形」として並ぶ塊だけ。髪のすき間に閉じ込められた平らな市松の欠片は頭の範囲だけ。白髪・白いシャツ・手袋・眼鏡は陰影があるので残る。輪郭は外周 2px の帯だけ、最寄りの背景色と人物の色から透明度を求め、背景の色を差し引いて戻す（白いハローを残さない）。暗い背景・明るい背景の両方で目視確認。
- 表情の切り替えはデータ（js/npc/npc.js の EXPR・EXPR_ALIAS、セリフ側の expression）。旧表情名（normal・smile・guide など）は EXPR_ALIAS で新しい4種へ読み替える。従来の closeup/・face.webp はファイルだけ残す。
- 既知：full の下半身（袖とポーチの間）に白い小さな欠片が残る（絵の中の白い布と背景が同じ値でつながっている）。ゲームでは商品の窓の後ろに隠れる。気になる場合は透過の元データ（要素材修正）。
