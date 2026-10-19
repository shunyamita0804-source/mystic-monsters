# バトルの待機立ち絵（2026-10-07 正式）

透過 PNG を余白を切って高さ 720 の透過 WebP（品質90）に。向き：ソラモ・ノビトン・ジオル・レグナス＝右向き、ガウル＝左向き（js/battle/arena.js の FACE）。

元ファイル（ZIP Mismon_Claude_DIFF_20261007_PART1／PART2）と sha256：

| 元ファイル | sha256 |
|---|---|
| c/PART1_BattleTournament/battle/idle/idle_01_soramo.png | 63127bfc6aaf7aa267d3ee6e25cdd02599c714bb3a553fb0fc9de989fc7f7d94 |
| c/PART1_BattleTournament/battle/idle/idle_02_gauru.png | 7c4810c1f66818ca20dc92879642ac84d488d73689ed86098a505978cf5256f3 |
| c/PART1_BattleTournament/battle/idle/idle_03_nobiton.png | ce3b9fe6100b0533f2c39fdd039495f9dd5192e1a6f44366b91f2fe319c97c1d |
| c/PART1_BattleTournament/battle/idle/idle_04_jiol.png | 6addf16ca18eae916fbd5f786177749c1169a9422bf12b3bdc427756b9b24e8f |
| c/PART1_BattleTournament/battle/idle/idle_05_regnas.png | 1e3f2a41e28120e35a6b0e1bfbeade468d617814e694a35f43212490b31cac97 |

## フルーネ（2026-10-15 N11・登録のみ・バトルには出さない）

| 元ファイル | sha256 | 派生 | 派生の sha256 |
|---|---|---|---|
| flurene_battle_idle.png（ZIP「次回Claude便_12項目」の 01_フルーネ正式登録・1254×1254 RGBA） | d5a237c1410511b18a0ad869bc36f8ef07fe79b1b8537d9eea15d103f962798f | idle_flurene.webp（730×720） | 87c5b202b32778efb42f8d2bff4c94205da8110eef0dbb1a22debb22e05064b3 |

- 作り方：tools/next1015/derive.py。アルファが 1 以上の画素の外接矩形で余白だけを切る（原本の左右の端に根が接している＝横は切らない）→ 高さ 720px（乗算済みアルファで縮小）→ 透過 WebP（品質 90・exact）。原本は上書きしていない・リポジトリに置かない。
- アルファ：本体の不透明度は原本のまま 251〜253（わずかに透ける）。
- js/battle/arena.js の `IDLE` には入れていない（番号 5 はバトルに出ない）。参照は js/phase10/monsters.js の `PENDING_SPECIES`（`battleIdle`）だけ。

## カルシェル（2026-10-18・登録のみ・未解禁＝QA 試遊だけ）

- 正式納品 Kalshell_DevAssets_Part01〜07（Mismon_Kalshell_OfficialPackage_ForDev_20261018・ユーザー承認済み）。原本（PNG／MP3）はリポジトリに置かない＝表示用の派生だけ。道具＝tools/kalshell1018/derive_art.py（PIL＋numpy・数値は tools/kalshell1018/derive_art.json）
- 余白を切って高さ 720px（859×720）・透過 WebP・**右向き**（ほかの5体と同じ）。js/battle/arena.js の `IDLE` には入れない（QA 試遊の間だけ js/qa/trial.js が貸す）。

| 原本 | sha256（原本） | 派生 | sha256（派生） |
|---|---|---|---|
| 01_art/01_透過微修正版/Kalshell_BattleIdle_Review_20261018.png | f61973da4e0083e5c0ce983ad3c5f49f9ec07a9d92cd34001daedd76fdc1b8bb | assets/battle/idle/idle_kalshell.webp | 6b45adc0c89b0a3d54f08706eac78c44fd4fdac4fbecfaac86b1e3380be4c56f |

## ミュロル（2026-10-19・登録のみ・未解禁＝QA 試遊だけ）

- 正式納品「ミュロル 開発本体向け 正式素材仕様一式」PART01〜07（2026-10-19・ユーザー承認済みの仕様マスター＋採用状態一覧）。原本（PNG／MP3）はリポジトリに置かない＝表示用の派生だけ。道具＝tools/myurol1019/derive_art.py（PIL＋numpy・数値は tools/myurol1019/derive_art.json）
- 余白を切って高さ 720px（928×720）・透過 WebP・**右向き**（ほかの種族と同じ）。js/battle/arena.js の `IDLE` には入れない（QA 試遊の間だけ js/qa/trial.js が貸す）。
- アルファ：本体の不透明度は原本のまま 250〜254（わずかに透ける）。
- 原本の選び方：PART01 の 01_art（FormalArt_Approved・BattleIdle_Candidate）と 02_reactions の「正式」の2枚は、01_art にだけアルファ 1 の見えない画素（2.5D 22664・待機 21876）がある以外は画素が同じ。採用状態一覧（2026-10-19）の「正式」の名前の 02_reactions の2枚を使った（01_art の sha256：5ef1907390ba2dcabb56bf3f9664f6656d6cd53bf64bc6b7fd7670c5fd7337bd・194088c0b1d87347e99dd3acf3ad4642260f87792949a03e358f63d036f366a8）。各フォルダの README（02_reactions・06_icons・04_skill_cards・03_walk）は「承認待ち」と書いているが、新しい採用状態一覧（2026-10-19）は検収合格＝新しいほうに従った。

| 原本 | sha256（原本） | 派生 | sha256（派生） |
|---|---|---|---|
| 02_reactions/ミュロル_正式バトル待機絵.png | 004836874e1125d8603ce67723e0b7ed19a4900281e592c7b51576597d3b9a11 | assets/battle/idle/idle_myurol.webp | d1c4eb312391a11fc9ff6b7cc56ce89f36e132b44801c8ace080a996f76dbe39 |
