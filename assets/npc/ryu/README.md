# リュウ（ライバル）の正式立ち絵

| ファイル | 中身 | 元 |
|---|---|---|
| full_normal.webp | 太ももまでの透過 WebP（628×960・品質90） | ZIP mystic-monsters_npc_official_standing_9images_2026-10-04 の 09_ryu.jpeg（880×1168・市松模様の背景が焼き込まれた JPEG） |

- 元ファイルの sha256：`b369b6113bcd0ac3d334cd36bdb68f4eb0926e5e4c95377912f858a4314bb555`
- 使う場所（2026-10-05 PHASE B）：Chapter のライバル遭遇の画面だけ（js/chapter/configs/ch1a.js の battleTypes.rival.encounterFigure → js/chapter/field-view.js の .ce-rival）。会話の NPC（MMNPC）には登録していない。
- 透過化：画像の縁からつながる無彩色の明るい画素（色の差 16 以下・最小の値 196 以上）と、絵の内側に閉じ込められた市松模様の領域（100 画素より大きいもの）だけを背景として消し、縁の4画素は白から引き戻して白いハローを残さない。絵そのもの（色・形）は変えていない。
- 竜（リュウの相棒）の正式素材は、リポジトリにも受け取ったどの ZIP にも無い（2026-10-05 確認）。届いたら config の encounterPartner に1行足すだけで、遭遇の画面の右手前（.ce-partner）に出る。
