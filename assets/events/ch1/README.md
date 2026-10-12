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
- （旧）remember_dan・wind_cry など挿絵の無いイベントは従来どおり（フィナの吹き出し → 結果）。→ 2026-10-12 開発23 で下の12枚を追加＝24種すべてに挿絵

## 2026-10-12 開発23：追加の12枚（13〜24）

ユーザー納品の正式画像（1080×720 の WebP）を**そのまま**置いた（縮小・再圧縮なし。sha256 は納品の一覧と一致）。config の eventPool[].image に1行ずつ（題名 title は納品に無いので付けていない＝カードの見出しは従来どおり「出来事」など）。

| ファイル | イベント id | バイト | sha256 |
|---|---|---|---|
| 13_shade.webp | shade | 439276 | `ac2501fb4bcac9c8b19b9c285226017eac6a90b4a9d69138d66fa75b20ff3e20` |
| 14_break.webp | break | 442618 | `46728d79129853767ea3bb5dd0d8ede7c69d3d6a8a56af54bdae4545950a1899` |
| 15_spring.webp | spring | 483564 | `0ddb79cfe9b9385ac328c84879bc1b2de0348b4428e5dc4b1e42653beea95675` |
| 16_holy_spring.webp | holy_spring | 456280 | `f14aa6b4f6b7ca50db58c0e6dc2079a600de3f0814d97e496eedac753cce6d22` |
| 17_herb.webp | herb | 429214 | `af5948c362c8f508841d437ef35daa915df301a2daa1d702bf8376025b5ce8a0` |
| 18_trip.webp | trip | 435364 | `6934fc31104ca93f8600b6f82cb9fe9424b382e4014bed9bdf809ef71260ce43` |
| 19_coin.webp | coin | 406064 | `088ef2910b26c8eaa02951d03129569dc9dc4fcbbec068be2a5b5d1e07b75408` |
| 20_sage.webp | sage | 447644 | `95c7bd2d31c7c369c8c27b24ca482feed2630537acfa1a73d53d959d0c3d282d` |
| 21_charm.webp | charm | 371558 | `29aebe9e3c60083b2cc2e0c0c18c1c09aa05fa7067ab38ab95d325ef3e3eb3ed` |
| 22_legend_spring.webp | legend_spring | 406142 | `3eed147419e4124cead5aee89eaf8f62df798549d54dd209249cc46d402a6be5` |
| 23_remember_dan.webp | remember_dan | 417760 | `5556739e3b45cc34ecdd6c6d2815b262a761abbc9f4ddb011527e2f7c59df573` |
| 24_wind_cry.webp | wind_cry | 406672 | `dd36f4e9fd73280d35b1489108cdd4b4e7036594eaa4449e1c884579eec06ad5` |
