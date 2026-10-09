# ソラモ・ガウルの 2.5D バトル素材（比較試遊。正式採用ではない）

URL に `?battleArt=2p5d` を付けたときだけ使う（js/battle/art25d.js）。`?battleArt=old` は旧の絵から始めて切り替えの札だけ出す。通常の URL では使わない＝今までの立ち絵（assets/battle/idle/）・技の演出のまま。

- `soramo/idle.webp`・`gauru/idle.webp`：待機の立ち絵（2026-10-08。ユーザー確認済み＝**2026-10-09 の完全版でも変えていない**）
- `soramo/NN_CC.webp`・`gauru/NN_CC.webp`（2026-10-09 完全版）：技 NN（SK の番号）の CC 番目のコマ。旧版（2026-10-08 の NN_C.webp 77枚）は削除

## 2026-10-09 完全版（ZIP MysticMonsters_Soramo_Skills_01-05_Part1・_06-10_Part2・MysticMonsters_Gauru_Skills_Complete）

- 全23シート・**97コマをすべて使う（除外 0）**。完全版のシートには木人（訓練用の丸太）が無い＝旧版のように本体と重なるコマを捨てる必要が無くなった。`_1` → `_2` の2枚のシート（スタークラッシュ・スターフォール・フレアレイ）は1つの技として順につなぐ（命中・大爆発・余韻まで）
- 切り出し（tools/battle25d/）：grid.json＝コマの枠（シートの線から手で決めた矩形）、key2.py＝緑の分離（α＝緑の強さから求め、半透明の所は元の色を逆算＝光・毛先・羽先・粒子を残す。緑が勝つ半透明の画素は α を下げて緑かぶりを消す）・見出しと説明文の帯を消す（同じシートの帯の和集合を、外へ 30px でなだらかに戻す）・コマの外枠を 12px でぼかす、body.py＝コマごとの本体（顔・耳・尾・翼・脚）の外接矩形を色から推定（body_auto.json。手の補正は cuts2.json の _body）、build2.py＝0.7倍に縮小・余白を切って WebP 品質86 と js/battle/art25d-data.js を作る。cuts2.json＝コマの動き（その場・少し踏み込む・相手へ向かう・相手の位置・戻る）と命中のコマ
- 見せ方（js/battle/art25d.js）：技ごとに1つの倍率（立ち絵の高さと面積に合わせる）＝コマで急に大きさが変わらない。各コマの本体を画面の中（左右 10px）・上の HUD の下に収める（ずらすのはコマの位置だけ・大きさは技の中で同じ）。その場・踏み込み・戻るのコマは自分側の画面の端から相手の手前までに収まるよう、技の倍率を最大 22% まで下げる（翼を広げたガウルが相手の顔に重ならない。当たるコマ・移動のコマは重なってよい）。相手側は左右反転。シートの撮った位置のずれは使わず、足元（シートごとの地面）・向き・相手との距離をコマの動きの種類から決める。ビーム・風・炎・爆発はコマの絵ごと出す（本体と同じ1枚の中に描かれている＝FX だけを切り離した素材は無い）。絵の縁は 4% でぼかす。技の長さは 1.5〜2.7秒（コマ数で決める。バトルの共通演出 stage.js の当たりの時刻はこの命中のコマに合わせる）
- 確かめ方：tests/qa-e2e-art25d-1008.test.mjs（A25-B3＝3サイズ × 2体 × 自分側／相手側で全コマ、A25-B4＝ガウルの顔・ビーム／風／炎の先・必殺の爆発）、tools/battle25d/qa25.mjs（コマごとのスクリーンショット）
- 限界：見出しの帯の下に隠れていた絵は元から無い（作り直していない）＝画面いっぱいの光のコマ（スタークラッシュ・スターフォール・スターダストレイなど）は角の1か所が暗く溶ける。素材は合計 約7.4MB（その試合に装備している技だけ先読み）

## 技ごとの採用（元シート → コマ → 出力）

| 番号 | 技 | 元シート | 採用 | コマ → 出力ファイル（動き） | 命中のコマ |
|---|---|---|---|---|---|
| 0 | たいあたり | 01_たいあたり.png | 4/4 | s01_1 → 00_01.webp（その場）<br>s01_2 → 00_02.webp（相手へ向かう）<br>s01_3 → 00_03.webp（相手の位置）<br>s01_4 → 00_04.webp（戻る） | s01_3 |
| 1 | ひっかき | 02_ひっかき.png | 4/4 | s02_1 → 01_01.webp（その場）<br>s02_2 → 01_02.webp（相手へ向かう）<br>s02_3 → 01_03.webp（相手の位置）<br>s02_4 → 01_04.webp（戻る） | s02_3 |
| 2 | しっぽアタック | 03_しっぽアタック.png | 4/4 | s03_1 → 02_01.webp（その場）<br>s03_2 → 02_02.webp（少し踏み込む）<br>s03_3 → 02_03.webp（少し踏み込む）<br>s03_4 → 02_04.webp（その場） | s03_3 |
| 3 | 吠える | 04_吠える.png | 4/4 | s04_1 → 03_01.webp（その場）<br>s04_2 → 03_02.webp（その場）<br>s04_3 → 03_03.webp（その場）<br>s04_4 → 03_04.webp（その場） | s04_3 |
| 4 | スタークラッシュ | 08_スタークラッシュ_1.png → 08_スタークラッシュ_2.png | 8/8 | s08_1 → 04_01.webp（その場）<br>s08_2 → 04_02.webp（その場）<br>s08_3 → 04_03.webp（相手へ向かう）<br>s08_4 → 04_04.webp（相手へ向かう）<br>s08b_1 → 04_05.webp（相手の位置）<br>s08b_2 → 04_06.webp（相手の位置）<br>s08b_3 → 04_07.webp（相手の位置）<br>s08b_4 → 04_08.webp（戻る） | s08b_1 |
| 5 | ソラモビーム | 07_ソラモビーム.png | 3/3 | s07_1 → 05_01.webp（その場）<br>s07_2 → 05_02.webp（その場）<br>s07_3 → 05_03.webp（その場） | s07_2 |
| 6 | すなかけ | 06_すなかけ.png | 4/4 | s06_1 → 06_01.webp（その場）<br>s06_2 → 06_02.webp（その場）<br>s06_3 → 06_03.webp（その場）<br>s06_4 → 06_04.webp（その場） | s06_3 |
| 7 | ほしのまもり | 05_ほしのまもり.png | 4/4 | s05_1 → 07_01.webp（その場）<br>s05_2 → 07_02.webp（その場）<br>s05_3 → 07_03.webp（その場）<br>s05_4 → 07_04.webp（その場） | ―（補助技） |
| 8 | スターダストレイ | 09_スターダストレイ.png | 6/6 | s09_1 → 08_01.webp（その場）<br>s09_2 → 08_02.webp（その場）<br>s09_3 → 08_03.webp（その場）<br>s09_4 → 08_04.webp（その場）<br>s09_5 → 08_05.webp（その場）<br>s09_6 → 08_06.webp（その場） | s09_4 |
| 9 | スターフォール | 10_スターフォール_1.png → 10_スターフォール_2.png | 8/8 | s10_1 → 09_01.webp（その場）<br>s10_2 → 09_02.webp（その場）<br>s10_3 → 09_03.webp（その場）<br>s10_4 → 09_04.webp（その場）<br>s10b_1 → 09_05.webp（その場）<br>s10b_2 → 09_06.webp（少し踏み込む）<br>s10b_3 → 09_07.webp（その場）<br>s10b_4 → 09_08.webp（その場） | s10b_2 |
| 10 | スパイラルダイブ | 07_スパイラルダイブ.png | 4/4 | g07_1 → 10_01.webp（その場）<br>g07_2 → 10_02.webp（相手へ向かう）<br>g07_3 → 10_03.webp（相手へ向かう）<br>g07_4 → 10_04.webp（相手の位置） | g07_4 |
| 11 | つつく | 01_つつく.png | 4/4 | g01_1 → 11_01.webp（その場）<br>g01_2 → 11_02.webp（相手へ向かう）<br>g01_3 → 11_03.webp（相手の位置）<br>g01_4 → 11_04.webp（戻る） | g01_3 |
| 12 | ウィンド | 02_ウィンド.png | 4/4 | g02_1 → 12_01.webp（その場）<br>g02_2 → 12_02.webp（その場）<br>g02_3 → 12_03.webp（その場）<br>g02_4 → 12_04.webp（その場） | g02_3 |
| 13 | ソニックムーブ | 03_ソニックムーブ.png | 4/4 | g03_1 → 13_01.webp（その場）<br>g03_2 → 13_02.webp（少し踏み込む）<br>g03_3 → 13_03.webp（少し踏み込む）<br>g03_4 → 13_04.webp（その場） | ―（補助技） |
| 14 | 紅翼スラッシュ | 04_紅翼スラッシュ.png | 4/4 | g04_1 → 14_01.webp（その場）<br>g04_2 → 14_02.webp（少し踏み込む）<br>g04_3 → 14_03.webp（相手の位置）<br>g04_4 → 14_04.webp（戻る） | g04_3 |
| 15 | ファイアボール | 05_ファイアボール.png | 4/4 | g05_1 → 15_01.webp（その場）<br>g05_2 → 15_02.webp（その場）<br>g05_3 → 15_03.webp（その場）<br>g05_4 → 15_04.webp（その場） | g05_3 |
| 16 | フレアレイ | 08_フレアレイ_1.png → 08_フレアレイ_2.png | 6/6 | g08_1 → 16_01.webp（その場）<br>g08_2 → 16_02.webp（その場）<br>g08_3 → 16_03.webp（その場）<br>g08b_1 → 16_04.webp（その場）<br>g08b_2 → 16_05.webp（その場）<br>g08b_3 → 16_06.webp（その場） | g08_2 |
| 17 | スカイラッシュ | 06_スカイラッシュ.png | 6/6 | g06_1 → 17_01.webp（その場）<br>g06_2 → 17_02.webp（その場）<br>g06_3 → 17_03.webp（相手の位置）<br>g06_4 → 17_04.webp（相手の位置）<br>g06_5 → 17_05.webp（相手の位置）<br>g06_6 → 17_06.webp（戻る） | g06_3 |
| 18 | フェザーストーム | 09_フェザーストーム.png | 6/6 | g09_1 → 18_01.webp（その場）<br>g09_2 → 18_02.webp（その場）<br>g09_3 → 18_03.webp（その場）<br>g09_4 → 18_04.webp（その場）<br>g09_5 → 18_05.webp（その場）<br>g09_6 → 18_06.webp（その場） | g09_3 |
| 19 | 聖なる炎 | 10_聖なる炎.png | 6/6 | g10_1 → 19_01.webp（その場）<br>g10_2 → 19_02.webp（その場）<br>g10_3 → 19_03.webp（その場）<br>g10_4 → 19_04.webp（その場）<br>g10_5 → 19_05.webp（その場）<br>g10_6 → 19_06.webp（その場） | g10_3 |

| 元ファイル | sha256 |
|---|---|
| Soramo_Skills_01-05_Part1：README_FIRST.txt | fcb3b603b1d76b1e10315e4c561c585d02c670d303a2d3978de264165f266906 |
| Soramo_Skills_01-05_Part1：soramo/01_たいあたり.png | 4bcc2c0b38ee2fada936acb38b632ee9e2dfe9bac5de173219130614006ccff8 |
| Soramo_Skills_01-05_Part1：soramo/02_ひっかき.png | d7377d3a3d39e86c56b942e5e7f2a5df8afa7ee104fd4155a2f19859babe203d |
| Soramo_Skills_01-05_Part1：soramo/03_しっぽアタック.png | 474172eef3cb2c7c9455945f0f3d111a41d72e1fce0b566b0cdeac0b17bbd41b |
| Soramo_Skills_01-05_Part1：soramo/04_吠える.png | 221ccb022d3ad81df69822edbbc7237af87b6a11728d4203213742a2ee825348 |
| Soramo_Skills_01-05_Part1：soramo/05_ほしのまもり.png | 9b0336b24d1eb835002ccf302b10510003250d05a51db99f677865b186b3e734 |
| Soramo_Skills_06-10_Part2：README_FIRST.txt | a60c11819649a6b5302c59ced6d16ba3dce4b071a99e931e14f5ab0eb65df7b7 |
| Soramo_Skills_06-10_Part2：soramo/06_すなかけ.png | cfce8ce9469d0a76862166cce1a570191b29166c2a8a89e80384d1693159a17c |
| Soramo_Skills_06-10_Part2：soramo/07_ソラモビーム.png | 5ad31c9078e249a8ed9cfdd8ae545301b00bb3a383037f8cd49683af2c51ae77 |
| Soramo_Skills_06-10_Part2：soramo/08_スタークラッシュ_1.png | b9f321bd424bbb96bb0d4cdd9c7b9952fc0d30b06c267509c9cf1ec78930ed40 |
| Soramo_Skills_06-10_Part2：soramo/08_スタークラッシュ_2.png | bd3262e38f47002d5ac04eecd654f3f90ea093119b245fbbfd4d987ed909ba45 |
| Soramo_Skills_06-10_Part2：soramo/09_スターダストレイ.png | 7c21f05c01b0c6a4881b61d26e2e49ce578bbe31dae496b760ce9d87d7a51a20 |
| Soramo_Skills_06-10_Part2：soramo/10_スターフォール_1.png | 2f8e500bb04f050654ab9c6eca430ea5a8a65b9eec41488db407a2d46bfda244 |
| Soramo_Skills_06-10_Part2：soramo/10_スターフォール_2.png | 1523604ab5a1d35cc4c8580f49907f78cfea5f9f5633c2aafbfc25c8d7af6da5 |
| Gauru_Skills_Complete：README_FIRST.txt | caabb87dafc810e8d3c7cd030d6cf5afd79f22e8e5c3e7e73822512bd9da5ead |
| Gauru_Skills_Complete：gauru/01_つつく.png | b20cabed0c287b73d6d1db5357f445073f4b083ffd13c4118a91f2553eaeee6c |
| Gauru_Skills_Complete：gauru/02_ウィンド.png | 34b980cb566314cb83a55313dac7bbe0f20febb23a3ab90753951a2e0a513ae6 |
| Gauru_Skills_Complete：gauru/03_ソニックムーブ.png | 4e1a47e8ec85bebbe5e9b027b31825a3d3982e366160b2239c33c80cbe78dc4c |
| Gauru_Skills_Complete：gauru/04_紅翼スラッシュ.png | f49593125afbf53b76dee410579b2d22cc9b5b1d50eb740c9b704d29b8115e16 |
| Gauru_Skills_Complete：gauru/05_ファイアボール.png | 94b64af9aaf7bb495af3e62521f203c0108598f5c686c8aa839c050b92667300 |
| Gauru_Skills_Complete：gauru/06_スカイラッシュ.png | 221ed8ac255c771c2cbfddab3956fe97a4596a3a1a44ce02438fe953c9337ba6 |
| Gauru_Skills_Complete：gauru/07_スパイラルダイブ.png | ff802cff1da1a5d078eac7b0f2cb7a6e7618e13f79487254a2c2e172caf6ba49 |
| Gauru_Skills_Complete：gauru/08_フレアレイ_1.png | 9af3780183b7839ba7fd47d265be6e246a59553218a490c8b7d1f6d707fcbfc1 |
| Gauru_Skills_Complete：gauru/08_フレアレイ_2.png | 04dfe7e17a01304639600bdd32a870ac9adaede8e5a525551ef3bfba606b8454 |
| Gauru_Skills_Complete：gauru/09_フェザーストーム.png | e16d2af30d47bdabe8352ca9b7e0993fcbc392901b047fc20b2c4139d78e9572 |
| Gauru_Skills_Complete：gauru/10_聖なる炎.png | e5c282e8e94f90920621d267f769af85ece19a5ef26f715b7d19daf3942435f0 |
