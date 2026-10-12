# 横型ルーレットの低い板（2026-10-13 開発24・派生）

正式素材（assets/battle/roulette/ の plate_normal・plate_selected・plate_miss・center_frame）から、技名・数値の空欄の帯（と区切り線）の行だけを抜いて背を低くした派生画像。枠・飾り・技の絵の窓・「MISS」の文字は元の絵のまま（描き直し・色の加工なし）。元の4枚は変えていない。
作り方：`python3 tools/roulette1013/compact.py`（残す行の範囲は同じファイルの CUTS）。新しいバトル画面（js/battle/arena.js の #bt.mma-v24）で使い、ルーレットの縦の大きさは従来の約2/3。

| 派生 | 元 | 残した行（元の y） | 大きさ | sha256 |
|---|---|---|---|---|
| plate_normal_c.webp | plate_normal.webp | 42〜256・318〜360 | 229×256 | d4e85a69e351f36411cc7dfa30bd2867c8c6559c2b170f29ebf814dda26c1b19 |
| plate_selected_c.webp | plate_selected.webp | 0〜248・300〜340・380〜440 | 311×348 | 1df42acf7861899aacbcf237bb3946ce29ff71964151e9b51effdf6d392605a5 |
| plate_miss_c.webp | plate_miss.webp | 0〜236・250〜302・322〜360 | 259×326 | 3dac9a863ac8f81594a968ea50e63a5d135eb67ac0f99a721cf8165f816524bd |
| center_frame_c.webp | center_frame.webp | 0〜198・362〜560 | 400×396 | 4b2a2b454ce24a3ab53c5826f214deef05b1ee3475e3ff46ff2891ddea463935 |
