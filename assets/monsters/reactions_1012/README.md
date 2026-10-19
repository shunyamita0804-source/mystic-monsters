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

## カルシェル（2026-10-18・登録のみ・未解禁＝QA 試遊だけ）

- 正式納品 Kalshell_DevAssets_Part01〜07（Mismon_Kalshell_OfficialPackage_ForDev_20261018・ユーザー承認済み）。原本（PNG／MP3）はリポジトリに置かない＝表示用の派生だけ。道具＝tools/kalshell1018/derive_art.py（PIL＋numpy・数値は tools/kalshell1018/derive_art.json）
- 待機絵と体の面積がそろう倍率で縮小（hRel＝高さ ÷ 720）。被弾・回避の hRel（1.35・1.383）はほかの種族より大きい＝QA で見え方の確認が要る。01 喜ぶだけ左向き（バトルでは使わない）。

| 種類 | 原本 | sha256（原本） | 派生 | sha256（派生） |
|---|---|---|---|---|
| 喜ぶ | 02_reactions/Kalshell_Reaction_01_Happy.png | e3fc6a7d8df1dafb183c3868138ab80ba8e73bd6a22939d1e832001153292c17 | kalshell/01_joy.webp（830×782・hRel 1.086） | 134e6de0da4a9f83ae12602453ca6cd9bf5ae45fdb1669867b210ad2ea7ade8f |
| 驚く | 02_reactions/Kalshell_Reaction_02_Surprise.png | 4c8b27140dbd12f5c9ee122bab8ca0a438116719086e56751222b1008962f0c0 | kalshell/02_surprise.webp（885×860・hRel 1.194） | 4467172627bb990238884dac5735fa6df4c0c0f86e6e36a559b295ea3a499558 |
| しょんぼり | 02_reactions/Kalshell_Reaction_03_Sad.png | 54dd69ec4d60b52066358bde04f09b9d03902ae1c32ad26be36154e08c211b05 | kalshell/03_sad.webp（882×873・hRel 1.212） | 81dfdc510dea6f76072e7bc4b3b9f29dea4147d4cefaec0347cb06238ecafac4 |
| 食べる | 02_reactions/Kalshell_Reaction_04_Eat.png | 65c6975b616d1e64a0299656c2367c5ef4cb2d184b0d5dda238318724dc362e6 | kalshell/04_eat.webp（822×822・hRel 1.142） | b7f0f55b35238c3cd202d087ec3302d6974ef92cd741557e642b81ac37efdd1d |
| 被弾 | 02_reactions/Kalshell_Reaction_05_Hit.png | 2cdc267b7b04722d872a1c356810e30db23e92b112926021f229e967d9d900da | kalshell/05_hit.webp（979×972・hRel 1.35） | f18c1204efec8c3a6aa24189682be7c7d1286635a5d97b303289feb81858cc09 |
| 回避 | 02_reactions/Kalshell_Reaction_06_Dodge.png | cd507c69eb4608d30b7025f4a582d99dd0aa233f6ab4079538f13f294fcf8b0d | kalshell/06_dodge.webp（991×996・hRel 1.383） | 7969a4e557f29a64685e19d1f472814dc8a5aa0995a0e9fea54d0d7c2c9cc6af |

## ミュロル（2026-10-19・登録のみ・未解禁＝QA 試遊だけ）

- 正式納品「ミュロル 開発本体向け 正式素材仕様一式」PART01〜07（2026-10-19・ユーザー承認済みの仕様マスター＋採用状態一覧）。原本（PNG／MP3）はリポジトリに置かない＝表示用の派生だけ。道具＝tools/myurol1019/derive_art.py（PIL＋numpy・数値は tools/myurol1019/derive_art.json）
- 待機絵と体の面積がそろう倍率で縮小（hRel＝高さ ÷ 720）。被弾・回避・しょんぼりの hRel（1.413・1.501・1.446）はほかの種族より大きい＝水しぶき・光の粒が原本の 1536 の端まで届いている（端で切れている）。QA で見え方の確認が要る。
- 05 被弾・06 回避は待機絵と同じ右向き（バトルで使う）。原本の README（2026-10-18）の注記：1254px で生成したものを 1536px へ拡大した納品・輪郭の周りに半透明の発光や小さな飛沫。

| 種類 | 原本 | sha256（原本） | 派生 | sha256（派生） |
|---|---|---|---|---|
| 喜ぶ | 02_reactions/01_喜ぶ.png | b5b3c8f18b67f584807fec1f6f4ecf9b16a5a4c0f9122b7e3f55117d667e735a | myurol/01_joy.webp（896×872・hRel 1.211・原本の端に接する 左上右下＝[1, 0, 1, 0]） | 9d0380d0c5044596ef68885346fa8ac4291c4121936e96a027bb413a41566ca3 |
| 驚く | 02_reactions/02_驚く.png | 87fd0f4e77e38b45efaae45596f829b219ce1ecb3ad613d319c300f03da439a1 | myurol/02_surprise.webp（864×874・hRel 1.214・原本の端に接する 左上右下＝[0, 0, 0, 0]） | af519057bdac96850e2a228001dc2606b09b3aa498e745b625c0de3fcaeec063 |
| しょんぼり | 02_reactions/03_しょんぼり.png | 53885d61564485748e5c33e2205c853a57072be6b5012eba9f0a5d4666971ef1 | myurol/03_sad.webp（1044×1041・hRel 1.446・原本の端に接する 左上右下＝[1, 0, 0, 1]） | 7c58c35dfedc274bd86e74f3a37b0794a634b4e29d913a9bf6245bcc96a8701c |
| 食べる | 02_reactions/04_食べる.png | 6b8d8102b02b09eb705ebfdf103458c08656ee48cda085aeb9f93babc8dedb09 | myurol/04_eat.webp（903×835・hRel 1.16・原本の端に接する 左上右下＝[1, 0, 1, 0]） | f5aff88ac5b43f05c7e1d91361db13237696979b1fabe9b0945fda74981b455a |
| 被弾 | 02_reactions/05_被弾.png | b172bc9a3cdaf5ac2df155796a9ed106cd0dfacd60d6aac604aa4525df4530b1 | myurol/05_hit.webp（1032×1017・hRel 1.413・原本の端に接する 左上右下＝[1, 0, 1, 1]） | 1573f7365723a8232c66f1a1554b44d29566890cb45ab381361b1d4c755375e4 |
| 回避 | 02_reactions/06_回避.png | be2c67e60bfc626dfa61564f26ebd2df523c9f016e10fd717f0c3bb161cba0cd | myurol/06_dodge.webp（1086×1081・hRel 1.501・原本の端に接する 左上右下＝[1, 0, 0, 1]） | 9ff7c54ed4e9ee042d17b486e8663b9888d03828b8532606a5cb37c677687887 |
