# Chapter 1 のマスの上面・正式12種（2026-10-12）

ZIP「ミスモン_試遊修正_新マス12種_SE_チケット_Claude納品_20261012」の `02_ボード上面_原本JPEG`（TOP01〜TOP12・JPEG＝市松模様が焼き込み）の表示用の派生。原本はリポジトリに置かない（`sha256.md`）。
作り方は `tools/fx1011/tops_1012.py`＝試作（tiles_top_1011）と同じ：derive.py の cutout(disc)＝メダルの透過（`src/`）→ top_composite.py＝既存の薄い立体円盤 `tiles_v2/tile_blank.webp` の上面の内側へ中央の紋章だけ（側面・縁・厚み・影・外形は円盤のまま＝二重の金縁にしない）。ライバル・回避は色が淡いので彩度のしきいだけ下げた（12・20。ほかは 70）。

| TOP | 原本 | 派生 | 使う所（js/chapter/world-board.js の look） |
|---|---|---|---|
| 01 | 01_life.jpg | tile_stat_life | 能力マス ライフ |
| 02 | 02_power.jpg | tile_stat_power | ちから |
| 03 | 03_intelligence.jpg | tile_stat_intelligence | かしこさ |
| 04 | 04_accuracy.jpg | tile_stat_accuracy | 命中 |
| 05 | 05_evasion.jpg | tile_stat_evasion | 回避 |
| 06 | 06_toughness.jpg | tile_stat_toughness | 丈夫さ |
| 07 | 07_wild.jpg | tile_wild_monster | 野生 |
| 08 | 08_treasure.jpg | tile_treasure | 通常の宝箱（tier normal）。**珍しい宝箱（tier rare）は従来の tiles_v2/tile_treasure_2 のまま**＝段階の違いを消さない |
| 09 | 09_meal.jpg | tile_meal | 食事・焚き火のマス（空腹 −50） |
| 10 | 10_rival.jpg | tile_rival | ライバル（RIVAL） |
| 11 | 11_event.jpg | tile_event | 出来事 |
| 12 | 12_rare.jpg | tile_rare_monster | レアモンスター（上に EV04 の紫の紋章を別の層で浮かべる） |
