# Chapter 1 のイベント挿絵 12枚（2026-10-04 第二段階・追加アセット）

元：ZIP `mystic-monsters_phase2_event-npc-assets_44images.zip` の Chapter 1 イベント（JPEG）。1080×720 の WebP（品質 86）に縮小。色・構図は変えていない。

止まったイベントマスで、盤面を暗くして横長の挿絵を大きく出す（js/chapter/field-view.js の evCardOpen。config の eventPool[].image）。

| ファイル | イベント id | 元ファイル | sha256（元 JPEG） | 大きさ |
|---|---|---|---|---|
| 01_tailwind.webp | tailwind | 01_草原の追い風.jpg | `268d5b88f3d45d5a…` | 247KB |
| 02_spring_water.webp | spring_water | 02_澄んだ湧き水.jpg | `079222c0f6b508c8…` | 310KB |
| 03_old_grounds.webp | old_grounds | 03_古い訓練跡.jpg | `254ae6afade2ffd2…` | 272KB |
| 04_stone_tablet.webp | stone_tablet | 04_風化した石碑.jpg | `f503ddbc85891ac5…` | 267KB |
| 05_small_shrine.webp | small_shrine | 05_小さな祠.jpg | `e972766f59072e39…` | 285KB |
| 06_break_with_fina.webp | break_with_fina | 06_フィナとの休憩.jpg | `52354856a8b5daab…` | 243KB |
| 07_sudden_rain.webp | sudden_rain | 07_突然の通り雨.jpg | `526145228cd2ab32…` | 271KB |
| 08_beast_tracks.webp | beast_tracks | 08_獣の足跡.jpg | `ddd0649ae6a94850…` | 293KB |
| 09_distant_cry.webp | distant_cry | 09_風に乗る鳴き声.jpg | `b710c89fa36c0ddc…` | 247KB |
| 10_wild_flowers.webp | wild_flowers | 10_野花の群生.jpg | `f99c1924db58a97c…` | 280KB |
| 11_traveler_trace.webp | traveler_trace | 11_古い旅人の痕跡.jpg | `059dd26b5b5d0e72…` | 288KB |
| 12_small_animal.webp | small_animal | 12_小さな生き物に導かれる.jpg | `b010c70daa67c8a9…` | 293KB |

- 1枚＝1イベント（使い回さない）。id の対応はユーザー指定。
- remember_dan・wind_cry など挿絵の無いイベントは従来どおり（フィナの吹き出し → 結果）。
