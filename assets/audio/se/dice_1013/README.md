# 立体サイコロの SE（2026-10-13 開発25 E）

- dice_cube_throw_land.ogg＝SE_REGISTRY の DICE_CUBE（Chapter 1 の世界のボードの立体サイコロ MMDICE3D だけ）。
- 投げる音（0〜0.46秒）→ 回っている間は無音（0.46〜0.855秒）→ 着地「トンッ、ト、トン」（0.855秒〜）。1回の START で1回だけ鳴る。
- 既存の2本（assets/audio/se/dice_1012/dice_magic_b4_long_tap.ogg と prototype/dice_1012/se/dice_magic_b4_long.ogg）から tools/dice1013/se_cut.py で作った派生。新しい音源は足していない。出典は AUDIO_CREDITS.md。
- sha256：3b31b4e75b1a6a53ca0f0d0c8123017131216e18222087e93767b65ea2d4b710
