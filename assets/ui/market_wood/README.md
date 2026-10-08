# 市場の木製UI（2026-10-08 正式）

ZIP Mismon_NextBatch_PART2_Market_Ryu_WorldMap_TownBGM_20261008 の market_ui/Mismon_Market_UI_Wood_20261008（透過 PNG）から、透明な余白（アルファ 8 以下）を切り詰め、表示の約2倍に縮小した PNG。色・絵は変えていない。index.html の CSS「2026-10-08 正式：市場の木製UI」で使う（カルーセル・処理は従来どおり）。旧 assets/ui/recovery_1006/market/ の札・矢印はファイルだけ残す。

| ファイル | 元 | 元の大きさ → 切り詰め → 置いた大きさ | sha256（先頭16桁） | 使う所 |
|---|---|---|---|---|
| plate_center.png | 01_central_nameplate_wood.png | 2160×1072 → 1674×375 → 400×90 | b53f262bbc5606ac | 中央の名札（名前・価格） |
| plate_side.png | 02_sub_nameplate_wood.png | 2160×1072 → 1433×302 → 320×67 | 9a0b723733f661e2 | 左右の名札 |
| arrow_left.png | 03_nav_button_left.png | 1536×1536 → 714×734 → 112×115 | f1efdf47b0d8544c | 左のナビ |
| arrow_right.png | 04_nav_button_right.png | 1536×1536 → 710×719 → 112×113 | cbcdab5491814734 | 右のナビ |
