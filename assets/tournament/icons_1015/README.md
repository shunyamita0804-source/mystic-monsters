# 大会の対戦表の顔＝正式のイラスト6枚（2026-10-15 N12）

ユーザー承認のイラスト（ZIP「ミスモン_次回Claude便_12項目_フルーネ登録_大会アイコン6種_20261015」の 02_大会対戦表イラスト6枚）。
各 1254×1254 の RGB PNG・薄い灰色の背景・左向き。**背景は消していない・描き直していない・色を変えていない**。原本はリポジトリに置かない。
表示用の派生＝正方形のまま 256×256 へ縮小した WebP（品質 90・tools/next1015/derive.py）。

| 派生 | 種族（番号） | 原本 | 原本の sha256 | 派生の sha256 |
|---|---|---|---|---|
| icon_solamo.webp | ソラモ（0） | 01_Soramo_TournamentIcon.png | cc8b25e4c2b4b940e4f333db97696fc52f57a2fe5f079293abc17fc54750955d | bafc6156c86867c3f8f6be147babe44181ffd724da91301facc59fc62b2910a0 |
| icon_gauru.webp | ガウル（1） | 02_Gauru_TournamentIcon.png | c0cafb34b77b5117fde9681caf3779d8c4c96b89883c3a8fc9300dbe206d3c62 | 73bf98bf7e6b6137183ba9a3036bc647f6be2c2cdda132c8c70b60cd2bf534f8 |
| icon_nobiton.webp | ノビトン（2） | 03_Nobiton_TournamentIcon.png | 18e19d740a5297038fa782de99b4fd0ad9287871467bb4dee6db03401a1978ac | aeda1ada59f89bccf9cabfc7da50359ebe6a69dcd8992f9baeec25607396fab0 |
| icon_jiol.webp | ジオル（3） | 04_Gioru_TournamentIcon.png（元のファイル名のまま） | 492bdd87d5a9bf6dfcff8c9b12f5ceb5ee5ef1feb5e3de0ac6448aa2d3cdfc57 | 7e3ea0f70befc2e398ba7b4e30e94bcdae76036592a3ef002bde31c212f435e7 |
| icon_regnas.webp | レグナス（4＝ライバルの相棒のバトルの番号） | 05_Regnas_TournamentIcon.png | 95d466b6ff85493f39435e0cece9b7b18f66ddbec1fd3d735d5ea1d0e1206048 | 72304c650c6f3b39b7b0c691a6828023eec3c56ebcbcb8460f6ef2a8d6e09afb |
| icon_flurene.webp | **フルーネ**（5＝予約番号・登録のみ） | 06_Flurene_TournamentIcon.png（元 ZIP の誤記「06_Leona」を 2026-10-15 ユーザーが訂正） | 1e568abe37d4b1b654d40b8187259320beb86c2266015545a93024f32a45b0d1 | ab2256f3a6b3f4b67d16ab9ef4da1e54ed8421a0ec1ebca556b699b206a18171 |

- **6枚目はフルーネ**（レオナではない）。レオナ（NPC・三伝説）の画像・登録は変えていない。
- 使っている所：js/battle/arena.js の `TOUR_ICON`／`tourIconSrc`／`TOUR_ICON_BG`（絵の背景の灰色）→ index.html の `tbIcon`（対戦表の参加者・上の列・ほかの試合の観戦の帯）。
  **ユーザー指示（2026-10-15）：丸くしないで四角形のまま**＝どの枠（対戦表・ほかの試合の観戦の帯）も角の小さい四角（5px）で、絵は枠いっぱい（正方形どうし＝切れない・伸ばさない）。
- 読めないとき：従来の 2.5D の横顔（assets/tournament/faces_25d/）→ 丸い顔（assets/tournament/faces/）→ 正式の立ち絵、の順（index.html の `tbIconFb`）。旧い画像はファイルを残す。
- フルーネは大会の参加者に入らない（参加者の種族は従来どおり）。番号 5 の顔は、将来フルーネが正式に大会に出るときのための登録だけ（テストはモック）。
- 表に無い種族の顔は、6枚のどれかに置き換えない（`tourIconSrc` が null＝従来の表示）。

## カルシェル（2026-10-18・登録のみ・未解禁＝QA 試遊だけ）

- 正式納品 Kalshell_DevAssets_Part01〜07（Mismon_Kalshell_OfficialPackage_ForDev_20261018・ユーザー承認済み）。原本（PNG／MP3）はリポジトリに置かない＝表示用の派生だけ。道具＝tools/kalshell1018/derive_art.py（PIL＋numpy・数値は tools/kalshell1018/derive_art.json）
- 256×256・灰色の背景のまま（#e1e1e1＝js/battle/arena.js の `TOUR_ICON_BG`）。番号 7 は大会の参加者に入らない（登録だけ）。

| 原本 | sha256（原本） | 派生 | sha256（派生） |
|---|---|---|---|
| 06_icons/Mismon_Kalshell_Official_Icon_VS_20261018/01_Kalshell_TournamentIcon_OFFICIAL_1254.png | 75a1d893db4ad4f148e9a74fd0b0855d878f20fa6d998bd69841d9d4eb2ebbc2 | assets/tournament/icons_1015/icon_kalshell.webp | 77d0dc7a1579f15de1145c7aa4e057c4ad229ec98ccb880823160ea80a3384b8 |
