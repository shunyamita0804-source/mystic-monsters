# 立体サイコロの SE（2026-10-13 開発25 E）

- dice_cube_throw_land.ogg＝SE_REGISTRY の DICE_CUBE（Chapter 1 の世界のボードの立体サイコロ MMDICE3D だけ）。
- 2026-10-13 開発27（17）：着地の足音「トンッ、ト、トン」（0.855秒〜）だけ（魔法的な「ヒュイン」＝投げる風・止まる光は外した）。1回の START で1回だけ鳴る。
- 旧（開発25 E）：投げる音（0〜0.46秒）→ 回っている間は無音（0.46〜0.855秒）→ 着地（0.855秒〜・止まる光つき）。
- 既存の2本（assets/audio/se/dice_1012/dice_magic_b4_long_tap.ogg と prototype/dice_1012/se/dice_magic_b4_long.ogg）から tools/dice1013/se_cut.py で作った派生。新しい音源は足していない。出典は AUDIO_CREDITS.md。
- sha256：89b4e05fa5389f2a72c111c3f2ecceb8c80ed92b1937b3900fd5606dc256e5cb（開発27。旧 3b31b4e7…）
