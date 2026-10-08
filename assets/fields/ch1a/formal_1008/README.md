# Chapter 1 Pattern A 正式ボードの背景（2026-10-08）

ユーザー提供の ZIP `Mismon_Chapter1A_Claude_Package_20261008.zip`（中の `Mismon_Chapter1A_Claude_Assets_20261008/`）。

- `original/`＝受け取った JPEG（無加工・バイト単位で同一）。`00_chapter1A_master.jpeg` は Chapter 1 A 全体の美術マスター（世界観・ランドマーク・ルートの方向・白亜の大会会場の基準）で、**ゲームには表示しない**。
- `ch1a_scene_01〜13.webp`＝道中の背景（652×1536 → 762×1795。旧 Chapter 1 の背景と同じ幅 762px にそろえた＝モンスター・マス・カメラの画面上の大きさが従来と同じ。WebP 品質86）。
- `ch1a_scene_14.webp`＝大会会場到着前の **共通 Scene**（1024×2063 → 762×1535。Chapter 1〜4 で同じ構図・時間帯や天気の差分を予定。今回は Chapter 1 の昼の版だけ）。
- 画像は色・内容を変えていない（縮小・拡大と WebP への変換だけ）。マス・宝箱・イベント・モンスター・UI は焼き込まない（ゲームの側で重ねる）。
- 使い方は `js/chapter/configs/ch1a.js` の `SCENES`（道路中央ライン・マスの列・enter／playable／handoff・視線誘導）と `PIECES`（どのマスをどの背景に置くか）。

| 背景 | 表示名【暫定】 | 元ファイル | sha256（元 JPEG） |
|---|---|---|---|
| 00（美術マスター・不使用） | ― | 00_chapter1A_master.jpeg | `3946f8c9f84f131420b157fd8ecf95ea3798d1d90506ad16cff42a05cdf8647f` |
| 01（ch1a_scene_01.webp） | 旅立ちの石畳 | 01_scene01.jpeg | `a41f016345ebd2d1b216aa09b8078a19881025bcad675460cf8b61047c8faf6d` |
| 02（ch1a_scene_02.webp） | 柵のある丘道 | 02_scene02.jpeg | `7d6794424dddd37ffaa5cc4ccf1d8c96c6274564156253810c29181ded398e2f` |
| 03（ch1a_scene_03.webp） | 大樹の木陰道 | 03_scene03.jpeg | `8c0b4293959be7a5b3e7a0e7e6d5ee05f3270a15353b6e4f944a9c6cf5dd0940` |
| 04（ch1a_scene_04.webp） | 清流沿いの道 | 04_scene04.jpeg | `2ce7836f8b820588a045494f0d5900a122c234c0dc8cfdda25d6bc57ed0bf552` |
| 05（ch1a_scene_05.webp） | 滝の見える道 | 05_scene05.jpeg | `f144790b9b379b5f41a1caa4425705255d107410b2cd3ff195134cfe770d239d` |
| 06（ch1a_scene_06.webp） | 古い柱の遺跡 | 06_scene06.jpeg | `eeb04e9d03445b5455bfaedef86858a71ab07b99c1b97139c3039b88aa3aeae2` |
| 07（ch1a_scene_07.webp） | 遺跡のアーチ | 07_scene07.jpeg | `bc6ae7294285ffb91bb723de201816b6d23f7c0a153c832a73f472bad308533a` |
| 08（ch1a_scene_08.webp） | 石の円環 | 08_scene08.jpeg | `609d9f06ea910198c5a4313b5fa9b713df573a5e5a178a09d551e6cc8e02ae75` |
| 09（ch1a_scene_09.webp） | 苔むした大階段 | 09_scene09.jpeg | `328929ac6325a2d6f8bd601c6e75487bf3e6d62966d0ba62db9ca065f1d28ac4` |
| 10（ch1a_scene_10.webp） | 渦紋の立石 | 10_scene10.jpeg | `589561b557f84e8e77a4c0925e20fde48e0653de2de0c80c17717564d1f615a9` |
| 11（ch1a_scene_11.webp） | 崖ぞいの欄干道 | 11_scene11.jpeg | `39a3ec7199bd754d9a078b3bd444a0282280dc3d914e282d6484495db6db3aac` |
| 12（ch1a_scene_12.webp） | 会場を望む丘 | 12_scene12.jpeg | `3a3e7e86d53c03e5bf0f98cd24a2eaa403391eb961728f42daafdd25106d507c` |
| 13（ch1a_scene_13.webp） | 会場への坂道 | 13_scene13.jpeg | `33ad82423d79640f77eb065fe231db08367e1f9643f91401838c3484dc5127cf` |
| 14（ch1a_scene_14.webp） | 大会会場前の広場 | 14_scene14_common_arena_approach.jpeg | `3f124863b07b30ea37ecbf0aa0e3b1ab53a854a010449145252d9ee34fc51fb6` |
