# カレン（市場）：表情4種（2026-10-04 第二段階・追加アセット）

元：ZIP `mystic-monsters_phase2_event-npc-assets_44images.zip` の `01_カレン/`（JPEG・市松模様が焼き込まれたもの）。元ファイルはユーザーが保管（リポジトリには置かない）。

| 表情キー | 元ファイル | sha256（元 JPEG） | closeup | full | face |
|---|---|---|---|---|---|
| guide | 01_通常・案内.jpg | `9523ed95b4c606de…` | closeup/01_guide.webp（86KB） | full/01_guide.webp（96KB） | face/01_guide.webp（21KB） |
| welcome | 02_歓迎・笑顔.jpg | `f8b720b742e4d088…` | closeup/02_welcome.webp（86KB） | full/02_welcome.webp（98KB） | face/02_welcome.webp（20KB） |
| think | 03_考える・少し真剣.jpg | `bdf161f7cc4b851a…` | closeup/03_think.webp（85KB） | full/03_think.webp（98KB） | face/03_think.webp（20KB） |
| sold | 04_嬉しい・購入成立.jpg | `b6ecb2c3a30315c7…` | closeup/04_sold.webp（87KB） | full/04_sold.webp（100KB） | face/04_sold.webp（21KB） |

- closeup＝頭から腰まで（573×760＝従来の半身と同じ大きさ・会話の立ち絵）。full＝全身（人物の範囲で切り出し・縦 960px）。face＝頭の上から肩まで（256×256・小さな顔の吹き出し）。
- 透過 WebP（品質 90・アルファ品質 100）。色は変えていない（CSS の filter も使わない）。
- 透明化の方法：画像の縁からつながる「明るい無彩色」（市松の2色とそのにじみ）だけを背景にする（格子は当てはめない）。人物に囲まれたすき間は、市松の2色が「マスの大きさの正方形」として並ぶ塊だけ。髪のすき間に閉じ込められた平らな市松の欠片は頭の範囲だけ。白髪・白いシャツ・手袋・眼鏡は陰影があるので残る。輪郭は外周 2px の帯だけ、最寄りの背景色と人物の色から透明度を求め、背景の色を差し引いて戻す（白いハローを残さない）。暗い背景・明るい背景の両方で目視確認。
- 表情の切り替えはデータ（js/npc/npc.js の EXPR・EXPR_ALIAS、セリフ側の expression）。旧表情名（normal・smile・guide など）は EXPR_ALIAS で新しい4種へ読み替える。従来の closeup/・face.webp はファイルだけ残す。
