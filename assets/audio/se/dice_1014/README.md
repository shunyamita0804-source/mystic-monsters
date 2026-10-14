# 立体サイコロの音・投げる音つき（2026-10-14 実機試遊⑤）

| ファイル | 長さ | sha256 |
|---|---|---|
| dice_cube_throw_land2.ogg | 1.595秒 | d7bc60c14e735c5fc3d5edb65846038d35241267d62b55ac924bb6b2d2aff45b |

- iPhone の試遊「着地のトントンだけで、投げる音が無くなった」→ 以前の盤のサイコロで投げ始めに鳴っていた正式 SE の投げる音を、1回だけ戻した1本（`tools/dice1014/se_throw.py`）。新しい音源は使っていない。
  - 0〜0.50秒＝正式 DICE_THROW（assets/audio/se/mystic_monsters_official/01_dice_large_full.ogg）の投げる音だけ（0.42〜0.50秒でやわらかく消す。音量は DICE_THROW の gain 0.95 と DICE_CUBE の gain 0.9 の比）
  - 0.50〜0.86秒＝無音（回っている間）
  - 0.86秒〜＝現行の着地の足音（assets/audio/se/dice_1013/dice_cube_throw_land.ogg＝開発27（17）の「トンッ、ト、トン」）
- 1ロールに1回だけ鳴らす完成した1本（着地を別に重ねない）。時刻は立体サイコロの 1.30秒の動き（投げ上げ・トンッ 0.90・ト 1.14・トン 1.30）のまま。
- 使う所：js/audio/audio-registry.js の DICE_CUBE（gain 0.9）。Chapter 2・旧ボード・特訓のサイコロは従来の DICE_THROW のまま。
- 材料の2つ（01_dice_large_full.ogg・dice_1013/dice_cube_throw_land.ogg）は変えていない。dice_1013 の版はファイルだけ残す。
