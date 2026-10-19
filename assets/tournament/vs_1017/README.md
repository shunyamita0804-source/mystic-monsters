

# VS の勝負絵（制作候補・QA 用）

vs_razuck.webp（2026-10-17 ラズック）と同じ置き場所。背景つきの正方形の絵（透過の切り抜きではない）なので assets/tournament/vs_monsters/（5体の透過の切り抜き）とは分けて置く。

## カルシェル（2026-10-18・登録のみ・未解禁＝QA 試遊だけ）

- 正式納品 Kalshell_DevAssets_Part01〜07（Mismon_Kalshell_OfficialPackage_ForDev_20261018・ユーザー承認済み）。原本（PNG／MP3）はリポジトリに置かない＝表示用の派生だけ。道具＝tools/kalshell1018/derive_art.py（PIL＋numpy・数値は tools/kalshell1018/derive_art.json）
- 512×512 に縮小・WebP。参照は js/phase10/monsters.js の `PENDING_SPECIES`（`vsArt`）と QA の絵の比較パネルだけ（独立した VS の画面は通常の流れに無い）。

| 原本 | sha256（原本） | 派生 | sha256（派生） |
|---|---|---|---|
| 06_icons/Mismon_Kalshell_Official_Icon_VS_20261018/02_Kalshell_VSArt_OFFICIAL_1254.png | 2f63605934c98ce3e3d502b98ff04cc01a6e7a8cd16e6df6a04fff879d83cd1b | assets/tournament/vs_1017/vs_kalshell.webp | e154eab18734d019958d0e199421ebe948d06f087ab8c25a77769924df8813d4 |
