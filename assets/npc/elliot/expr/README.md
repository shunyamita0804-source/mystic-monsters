# エリオット（研究所）：表情4種（2026-10-04 第二段階・追加アセット）

元：ZIP `mystic-monsters_phase2_event-npc-assets_44images.zip` の `04_エリオット/`（JPEG・市松模様が焼き込まれたもの）。元ファイルはユーザーが保管（リポジトリには置かない）。

| 表情キー | 元ファイル | sha256（元 JPEG） | closeup | full | face |
|---|---|---|---|---|---|
| normal | 01_通常.jpg | `6772754f35f155f6…` | closeup/01_normal.webp（81KB） | full/01_normal.webp（115KB） | face/01_normal.webp（24KB） |
| smile | 02_小さな笑顔.jpg | `4a4359fb9d85f0b6…` | closeup/02_smile.webp（82KB） | full/02_smile.webp（117KB） | face/02_smile.webp（25KB） |
| analyze | 03_思考・分析.jpg | `8eff98abd7fb7e62…` | closeup/03_analyze.webp（81KB） | full/03_analyze.webp（115KB） | face/03_analyze.webp（24KB） |
| discover | 04_発見・控えめな驚き.jpg | `9c777be7461a3dc7…` | closeup/04_discover.webp（82KB） | full/04_discover.webp（112KB） | face/04_discover.webp（24KB） |

- closeup＝頭から腰まで（573×760＝従来の半身と同じ大きさ・会話の立ち絵）。full＝全身（人物の範囲で切り出し・縦 960px）。face＝頭の上から肩まで（256×256・小さな顔の吹き出し）。
- 透過 WebP（品質 90・アルファ品質 100）。色は変えていない（CSS の filter も使わない）。
- 透明化の方法：画像の縁からつながる「明るい無彩色」（市松の2色とそのにじみ）だけを背景にする（格子は当てはめない）。人物に囲まれたすき間は、市松の2色が「マスの大きさの正方形」として並ぶ塊だけ。髪のすき間に閉じ込められた平らな市松の欠片は頭の範囲だけ。白髪・白いシャツ・手袋・眼鏡は陰影があるので残る。輪郭は外周 2px の帯だけ、最寄りの背景色と人物の色から透明度を求め、背景の色を差し引いて戻す（白いハローを残さない）。暗い背景・明るい背景の両方で目視確認。
- 表情の切り替えはデータ（js/npc/npc.js の EXPR・EXPR_ALIAS、セリフ側の expression）。旧表情名（normal・smile・guide など）は EXPR_ALIAS で新しい4種へ読み替える。従来の closeup/・face.webp はファイルだけ残す。
