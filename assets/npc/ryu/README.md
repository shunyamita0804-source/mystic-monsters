# リュウ（ライバル）の正式立ち絵

| ファイル | 中身 | 元 |
|---|---|---|
| ryu_official_fullbody.webp | 全身の透過 WebP（406×960・品質90） | original/ryu_official_fullbody_2026-10-05.jpg（1229×1536・白背景の JPEG。ZIP mystic_monsters_claude_trial_fixes_assets_2026-10-05） |

- 元ファイルの sha256：`b9bca1841042ace8f4519fb8e6ec8c415c80a3c333a7ea869a335306100020f0`（ZIP の README と一致）
- **2026-10-05 から正式の基準はこの絵**。旧 full_normal.webp（ZIP mystic-monsters_npc_official_standing_9images_2026-10-04 の 09_ryu＝別のポーズ）は削除した（使わない）。
- 透過化：画像の縁からつながる白い背景（色の差 14 以下・最小の値 226 以上）だけを消し、縁の2画素は白から引き戻して白いハローを残さない。絵そのもの（顔・髪・服・色・ポーズ）は変えていない。余白を切り詰め、高さ 960 に縮小。
- 使う場所：Chapter のライバル遭遇の画面（js/chapter/configs/ch1a.js の battleTypes.rival.encounterFigure → js/chapter/field-view.js の .ce-rival）。相棒レグナス（assets/monsters/regnas/）と並べる。会話の NPC（MMNPC）には登録していない。

## 表情差分（2026-10-08 正式）

ZIP Mismon_NextBatch_PART2_Market_Ryu_WorldMap_TownBGM_20261008 の ryu_expressions/Ryu_ExpressionSet（880×1168 の透過 PNG・腰から上）を、ほかの NPC の会話の立ち絵（closeup）と同じ 573×760 に縮小した可逆 WebP（色・絵は変えていない）。js/npc/npc.js の ryu の closeup に登録。全身（fullbody・stand・遭遇の画面）は従来の ryu_official_fullbody.webp のまま。

| ファイル | 元 | sha256（先頭16桁） | 使う所 |
|---|---|---|---|
| expr/normal.webp | ryu_01_normal.png | 1b1627f44b68aab5 | 既定 |
| expr/surprise.webp | ryu_02_surprise.png | 630a2f3c114fd556 | 街の初対面「あれ？ フィナじゃないか！」 |
| expr/confident.webp | ryu_03_confident.png | 336a9d402413dfb3 | 「決まってるだろ。聖獣士になりに来たんだよ。」「オレは先に『はじまりの草原』へ行ってる。」 |
| expr/serious.webp | ryu_04_serious.png | 7bd0f4c45093fbfe | 「先に言っとくぜ。…レジェンドに挑んでやる。」 |
| expr/soft_smile.webp | ryu_05_soft_smile.png | c60b040d070dcea4 | 「へえ、新人か。よろしくな。」 |
