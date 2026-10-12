# 立体サイコロの SE（2026-10-12 開発23 B 正式採用）

| ファイル | 出来事（js/audio/audio-registry.js） | 使う所 |
|---|---|---|
| dice_magic_b4_long_tap.ogg（1.595秒・約 -17.6 LUFS） | DICE_CUBE（gain 0.9） | Chapter 1 の世界のボードの立体サイコロ（js/chapter/dice-cube.js の MMDICE3D・tempo 'long'。js/chapter/world-board.js の playDie が throwEvent 'dice.cube' で鳴らす） |

- 中身：比較デモ prototype/dice_1012/se/dice_magic_b4_long_tap.ogg と同じファイル（sha256 1872dcff07de6d1e81e99bed7cbc57400932173dca518dca89116bd76151da39）。
- 流れ：風（A1）→ 回る（B4・0.77倍速）→ 着地の足音「トンッ（0.88秒）、ト（1.115秒）、トン（1.275秒）」→ 止まる光（C1・山は約1.3秒＝サイコロが止まる時刻）。
- 原音：A1 "Magical Whoosh"（u_hyed0v3ux9）・B4 "Slow Whoosh"（StudioKolomna）・C1 "Magic Spell 02"（Universfield）＝Pixabay Content License。足音＝正式 SE 05_small_monster_entry_steps_4step.ogg の切り出し。出典 URL は AUDIO_CREDITS.md。
- 原音の MP3 は置かない（Pixabay の原音単体の再配布の禁止）。M4A は置かない（assets/audio は OGG だけ・同じ音の別形式を置かない）。
