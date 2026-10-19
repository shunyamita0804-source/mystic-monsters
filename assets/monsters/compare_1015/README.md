# パラメーター比較画面の肩上アップ6枚（2026-10-15）

ZIP「Mismon_CompareScreen_And_QA_Instructions_20261015」の 02_ComparePortraits（ユーザー承認済み・1254×1254 の RGBA 透過 PNG）の表示用の派生。
新しいパラメーター比較画面（index.html の p9CompareScr・cmpScr）の左右の主役の絵。左＝自分（そのまま・6枚とも右向き）、右＝相手（画面の CSS で左右反転して中央を向かせる＝ファイルは反転しない）。

- 変換：640×640 へ縮小（乗算済みアルファで LANCZOS＝透過の縁に白／黒のにじみを出さない）→ WebP 品質 90。切り抜き・描き直し・色の加工なし。道具＝tools/compare1015/derive.py
- 原本はリポジトリに置かない（ユーザーが保管）。原本の sha256 は納品の 04_Assets_Manifest.txt と一致。
- 01_CompareLayout_Reference.png（レイアウトの見本）はゲームに貼らない＝リポジトリに置かない。

| 種族（番号） | 原本 | 大きさ | sha256（原本） | 表示用 | sha256（表示用） |
|---|---|---|---|---|---|
| ソラモ（0） | 01_Solamo.png | 1254x1254 | fdc7a21b6cdb9438c75f6f7d4f7fda76c6b130492ead9bd6f26c8fb78f869f76 | solamo.webp | 6bb245a8fcb3b93dd4b32219b881d832be80afe4c869ca47706c2e9b3ed8483d |
| ガウル（1） | 02_Gauru.png | 1254x1254 | 3cfa3894b589492d05fccc421392ff936faf55c0390a74a78e60260a80d56d39 | gauru.webp | e1e5d2e6b18e10717cec319e3be9c06556be6dbef8fa1d74b84ead0b10a4bb11 |
| ノビトン（2） | 03_Nobiton.png | 1254x1254 | 852234ecf910718627fa6c5929f575692a4366641c094ecc963ce6d6e732ac51 | nobiton.webp | 23465af8c1e53a4c221015efd4ca3b496a3c3632fe8186a636863424e8007301 |
| ジオル（3） | 04_Jiol.png | 1254x1254 | d86d34dd047010744848e55976b781122b157e8bced41771668c0df5d6c0eed3 | jiol.webp | 4266a8c453e55b6f1b4a705312683db12fc6eb19c9eba47c61907846d7c7a0f1 |
| レグナス（4・ライバル専用） | 05_Regnas.png | 1254x1254 | b8ad1a9764a14d6f7d04ef61f0fa6162a4ab1108a79a1592f296a3819d4e0882 | regnas.webp | ce766d68883eaf48f5314fb8f7852f4adb015bed2ffa2df9971c036f16b504a5 |
| フルーネ（予約 5・未解禁） | 06_Flurene.png | 1254x1254 | 76baf7789377e1bfccf0e7a281f020c74bf0b7adf95e33daa11903004789b3bf | flurene.webp | 1e9c6cd44fb2fc6f30788cacfe3c1537a2194b1d6584d0fe9f3b7c6f2bd3008e |

## カルシェル（2026-10-18・登録のみ・未解禁＝QA 試遊だけ）

- 正式納品 Kalshell_DevAssets_Part01〜07（Mismon_Kalshell_OfficialPackage_ForDev_20261018・ユーザー承認済み）。原本（PNG／MP3）はリポジトリに置かない＝表示用の派生だけ。道具＝tools/kalshell1018/derive_art.py（PIL＋numpy・数値は tools/kalshell1018/derive_art.json）
- **代替（仮案）**：専用の肩上アップは納品に無い。対戦表の顔は灰色の背景つきで透過の比較画面に合わないため、**正式の待機絵（右向き）の顔を中心に切った正方形**（待機絵の画素 x 341・y 195・一辺 539・高さの 62%）を 640×640 にした（反転していない）。正式の肩上アップが届いたら差し替える。js/battle/compare.js の `PORTRAIT[7]`。

| 種族（番号） | 元 | sha256（元） | 表示用 | sha256（表示用） |
|---|---|---|---|---|
| カルシェル（予約 7・未解禁）・代替 | 01_art/01_透過微修正版/Kalshell_BattleIdle_Review_20261018.png（待機絵） | f61973da4e0083e5c0ce983ad3c5f49f9ec07a9d92cd34001daedd76fdc1b8bb | kalshell.webp | b2a8bf7064b9439e1d5106730f06861d20dc24c7512b79f70e27a493911c1017 |

## ミュロル（2026-10-19・登録のみ・未解禁＝QA 試遊だけ）

- 正式納品「ミュロル 開発本体向け 正式素材仕様一式」PART01〜07（2026-10-19・ユーザー承認済みの仕様マスター＋採用状態一覧）。原本（PNG／MP3）はリポジトリに置かない＝表示用の派生だけ。道具＝tools/myurol1019/derive_art.py（PIL＋numpy・数値は tools/myurol1019/derive_art.json）
- **代替（仮案）**：専用の肩上アップは納品に無い。対戦表の顔は灰色の背景つきで透過の比較画面に合わないため、**正式の待機絵（右向き）の顔の周りを切った正方形**（余白を切った待機絵の画素 x 371・y 0・一辺 607・高さの 80%＝頭が大きく 62% では顔だけになる）を 640×640 にした（反転していない）。顔の中心＝正方形の (0.677, 0.412)＝js/battle/compare.js の `PORTRAIT[8]`。正式の肩上アップが届いたら差し替える。

| 種族（番号） | 元 | sha256（元） | 表示用 | sha256（表示用） |
|---|---|---|---|---|
| ミュロル（予約 8・未解禁）・代替 | 02_reactions/ミュロル_正式バトル待機絵.png（待機絵） | 004836874e1125d8603ce67723e0b7ed19a4900281e592c7b51576597d3b9a11 | myurol.webp | 835d0017d499ef0695e760f74c88df24b717d362a448b558ce24368fd17468ea |
