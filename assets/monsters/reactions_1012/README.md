# 正式モンスター5体のリアクション 30枚（2026-10-12）

ソラモ・ガウル・ノビトン・ジオル・レグナス × 01 喜ぶ・02 驚く・03 しょんぼり・04 食べる・05 被弾・06 回避。データは `js/monsters/reaction-art.js`（MMRXART）と `js/monsters/reaction-art.data.js`（大きさ）。

## 使っている所

- **05 被弾・06 回避＝バトル**：攻撃を受けた側のダメージの数字（MISS を含む）が出た瞬間に、待機立ち絵（assets/battle/idle/）を被弾 0.56秒・回避 0.52秒だけ差し替えて戻す（js/battle/arena.js の `react`。視差を減らす設定では 0.42秒）。当たった／かわした は `MMBattle.resolveAction` の結果を読むだけ（呼ぶだけ・結果は変えない）。技のコマが出ているモンスター・絵が読めていないとき（読み込み中・404）は差し替えない＝待機立ち絵のまま。自分の番のミス（ルーレットの MISS・まひ／ねむりで動けない）では出ない。
- **01〜04＝イベント・育成・冒険用**：どの出来事に出すかは未決。今は確認ページ（prototype/reactions_1012/index.html）で見るだけ。本編へつなぐときは `MMRXART.info(種族, 'joy'|'surprise'|'sad'|'eat')`（{ src, w, h, hRel }）を使う。

## 作り方（tools/reactions1012/build.py）

- 原本（1254×1254 の透過 PNG）は描き直さない・色を変えない。余白を切り（不透明度 >0 の範囲＋4px）、縮小して透過 WebP（品質90）にしただけ。**原本はリポジトリに置かない**（下の表に sha256）。
- 縮小の倍率＝バトルの待機立ち絵と体の面積（不透明度 >8 の画素数）がそろう倍率。画面では待機立ち絵の高さ × **hRel** で出す（足もと・中央は待機立ち絵と同じ）。
- 向き：30枚とも右向き（待機立ち絵と同じ）。左右の反転は待機立ち絵と同じ規則（自分＝そのまま・相手＝反転）。
- 番号の意味はユーザー指定のとおり（01 喜ぶ〜06 回避）。ソラモの ZIP は日本語のファイル名（01_喜ぶ など）。

## 元ファイルと sha256

| 種族 | 番号 | 内容 | 元ファイル（ZIP の中） | 表示用 | 大きさ | 元の sha256 |
|---|---|---|---|---|---|---|
| ソラモ | 01 | 喜ぶ | Soramo_Reactions_6_20261012/Soramo_01_喜ぶ.png | soramo/01_joy.webp | 739×712 | c9473937243c409631073f317584465d354eec2f024b3c203bdf193eb6ccdab7 |
| ソラモ | 02 | 驚く | Soramo_Reactions_6_20261012/Soramo_02_驚く.png | soramo/02_surprise.webp | 743×720 | 4f982283d1b53b13e0861d55693ae13bf6ea381142f36e2edf803724ac4fde06 |
| ソラモ | 03 | しょんぼり | Soramo_Reactions_6_20261012/Soramo_03_しょんぼり.png | soramo/03_sad.webp | 716×587 | 4148206de0858ce7d0a4a9a045e015de48af358d39c7d595425a0c94c71fb454 |
| ソラモ | 04 | 食べる | Soramo_Reactions_6_20261012/Soramo_04_食べる.png | soramo/04_eat.webp | 725×613 | 7ad991255815a9488cd86d026f9db745af69c622b6f53f2da0d4a6d1d4fe929d |
| ソラモ | 05 | 被弾 | Soramo_Reactions_6_20261012/Soramo_05_被弾.png | soramo/05_hit.webp | 676×620 | dba3e80f0f62f9ea19cdebc8000b9867c760fefe9b0e338d4ec1294a34e44c3b |
| ソラモ | 06 | 回避 | Soramo_Reactions_6_20261012/Soramo_06_回避.png | soramo/06_dodge.webp | 732×561 | d941cf7449e3988f2ae0d8f9219ae88b802ed514b77fffd8e591fb448232f37f |
| ガウル | 01 | 喜ぶ | gauru_reaction_01_joy.png | gauru/01_joy.webp | 694×688 | 5429d9a32b8bb5bbf6a942864b842388f87b193b84209c3fb29291888d81a947 |
| ガウル | 02 | 驚く | gauru_reaction_02_surprise.png | gauru/02_surprise.webp | 720×712 | 05ad053cec91f6ce5ec7b9e4b1631338b0fb6c7fe8c827932176ce449691dd31 |
| ガウル | 03 | しょんぼり | gauru_reaction_03_sad.png | gauru/03_sad.webp | 761×623 | 488277a4c38820a2f3ccf7c91f501088a94b1fdfc9f81ff7ed156c887742f120 |
| ガウル | 04 | 食べる | gauru_reaction_04_eat.png | gauru/04_eat.webp | 696×681 | 91aaec2e8e61a77225d1beec7a8feca7f7fba536d140aba436b560b8b71ad9fb |
| ガウル | 05 | 被弾 | gauru_reaction_05_hit_eyes_closed.png | gauru/05_hit.webp | 727×695 | b3e889cebc4db1be2ac0a7aa052cc305b50957d72b1b590ed0b08b6b0f25dbfa |
| ガウル | 06 | 回避 | gauru_reaction_06_dodge_dynamic.png | gauru/06_dodge.webp | 726×709 | 9e109e34f65672b6f935c0c99254a36a2896e5dbe0753a50e11652504513b332 |
| ノビトン | 01 | 喜ぶ | nobiton_01_joy.png | nobiton/01_joy.webp | 832×781 | 934444b84379066c43e58f9a7460bbddb70c3cbec1fba95be5d9a72cbb27b323 |
| ノビトン | 02 | 驚く | nobiton_02_surprised.png | nobiton/02_surprise.webp | 821×785 | c4556c2a432f97f3e6a6f7d4b08c46322db6df8b613a2cac498cadca91fbb03f |
| ノビトン | 03 | しょんぼり | nobiton_03_sad.png | nobiton/03_sad.webp | 821×692 | d5f898331050251633ad2d47b61511bdf65161e49c602dfd27f4425e2c3bd240 |
| ノビトン | 04 | 食べる | nobiton_04_eating.png | nobiton/04_eat.webp | 794×749 | 06219bfb402648efc4a341981ffb6b1dbbc9021d0f899dfe12e6b7e53f242241 |
| ノビトン | 05 | 被弾 | nobiton_05_hit.png | nobiton/05_hit.webp | 808×691 | a03bbbb38fab3aafb57de2b74fa1a72396b64afec7bc75e77dc9d16c54243f11 |
| ノビトン | 06 | 回避 | nobiton_06_dodge.png | nobiton/06_dodge.webp | 863×655 | 907cfa2997ce9ad31294be28d93bbfb97e1b87917a8e62054ed61aced4d9ce3b |
| ジオル | 01 | 喜ぶ | jiol_01_happy.png | jiol/01_joy.webp | 676×657 | e4acfa39b79b3ee1bb68d6fe7d191936e5b61f169552938477a696f61e95dca8 |
| ジオル | 02 | 驚く | jiol_02_surprised.png | jiol/02_surprise.webp | 680×687 | b8e4325a6d1ad0a82baacd861ba7d41dde8233bfa858bac0f81994e41f621333 |
| ジオル | 03 | しょんぼり | jiol_03_sad.png | jiol/03_sad.webp | 649×719 | 5e335bd0d500259a7214a19a7eddc7bb9b202e8780a80bf68e7ffec8222e5f41 |
| ジオル | 04 | 食べる | jiol_04_eating.png | jiol/04_eat.webp | 656×661 | 52b233e27b7c22a5578ebb900e3fab83b4ae6a591dcad44c87f0b2ffc6711070 |
| ジオル | 05 | 被弾 | jiol_05_hit.png | jiol/05_hit.webp | 677×663 | 314c17a0f74e265818f4071356d49a22aecd91723505e8b5aafe5298ab30fbe7 |
| ジオル | 06 | 回避 | jiol_06_dodge.png | jiol/06_dodge.webp | 714×644 | 8ff3c64320871d974f9c6b2c2bc62ca1e537a20a968f694c7be6329b5723bc38 |
| レグナス | 01 | 喜ぶ | regnas_01_happy.png | regnas/01_joy.webp | 697×728 | ebb034e57530b6662a6ea87e0fcd8e284f476d0ac3f0f6166f5313a29c4414d7 |
| レグナス | 02 | 驚く | regnas_02_surprised.png | regnas/02_surprise.webp | 671×695 | 44832ec232c3dd7bd7f633e3b7e196bed335fbeffcb15dfe66ddc8711185ba02 |
| レグナス | 03 | しょんぼり | regnas_03_sad.png | regnas/03_sad.webp | 695×583 | 5a69738ce03d4f78e87d8a6cbaa0112f392d7065f599cd3530622c14b8d06bed |
| レグナス | 04 | 食べる | regnas_04_eating.png | regnas/04_eat.webp | 686×590 | 4fbbe28d0d17db285b2f91ea31df0d4ab848fe9d8a13a05cfefac0d35ce3d786 |
| レグナス | 05 | 被弾 | regnas_05_hit.png | regnas/05_hit.webp | 644×645 | b40d537d6fad4044dacb0eb8709974c2f7f9b3a5bad5ed4c9ef4b4214b9cf65d |
| レグナス | 06 | 回避 | regnas_06_dodge.png | regnas/06_dodge.webp | 681×633 | a948ff0099a16a9bb390700e25e6b9d3f180269da6d04c57f9782f925af5ea6c |
