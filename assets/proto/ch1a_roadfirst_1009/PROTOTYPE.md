# Chapter 1 Pattern A 道路先行ブロックアウトの試作（2026-10-09）

正式の Chapter 1 ではありません。URL に `?chapterBoard=roadfirst` を付けたときだけ動きます。通常の URL では何も出ません（今の Chapter 1・セーブ・大会・バトルはそのまま）。

## 試し方（iPhone 縦画面）

- 公開版：`https://shunyamita0804-source.github.io/mystic-monsters/?chapterBoard=roadfirst`
- 開いた画面の上に試作が重なります。「サイコロを振る」→ 1地点ずつ移動 → 分かれ道ではボタンで道を選ぶ → GOAL で「大会の入口へ」。
- 右上：「全体」（全図 ⇄ 寄る）・「最初から」・「閉じる」（下の通常のゲームに戻る）。
- 途中で閉じても、同じ URL で開けば続きから（試作の状態は `localStorage` の `mmrf_proto_v1`。ゲームのセーブ `mr4v6` とは別）。
- 「大会の入口へ」は既存の TEST 大会の入口（今のセーブを控えて Chapter 1 の大会受付へ・終わると元のセーブへ戻す）。聖獣士登録の前は入れない（文で案内）。
- 開発用の URL：`&rfSeed=数`（乱数の種）・`&rfStop=pass`（途中で止まらない比較用）・`&rfRand=open` ／ `closed`（D_RAND の開閉を固定）。

## ファイル

| ファイル | 役割 |
|---|---|
| このフォルダの 00〜10・README_FIRST.md | 受け取ったキット（MysticMonsters_Ch1A_Claude_Prototype_Kit_20261009.zip）の原本。05（iPhone の切り出し画像）は試作に使わないので置いていない |
| 01_road_geometry.svg | 試作の背景として表示（ブロックアウト＝正式の背景ではない） |
| tools/roadfirst/build_data.py | 09（論理の正本）と 02（暫定の描画座標）から js/proto/roadfirst-data.js を作る |
| js/proto/roadfirst-core.js | 進行のロジック（MMRF_CORE。画面なしで Node でも動く） |
| js/proto/roadfirst-view.js | 画面（MMRF。?chapterBoard=roadfirst のときだけ） |
| tools/roadfirst/sim.mjs | 40ターンのシミュレーション（`node tools/roadfirst/sim.mjs 5000`） |
| tests/roadfirst-1009.test.mjs・tests/qa-e2e-roadfirst-1009.test.mjs | テスト（RF-01〜07・RF-B1〜B3） |

## ルール（キットの fixed_rules どおり）

- 移動のサイコロ 1〜6・40ターン（1回振る＝1ターン。分岐で選ぶのはターンを使わない）。
- J0・H は自由に選ぶ。報酬の枝の入口（EL2・EL3・ER2・SUCCESS_L2・STATUE・HR3・HR1）でも「宝の道へ」か「このまま進む」を選ぶ。
- Q：イベントのサイコロ（移動とは別・ターンを使わない）奇数＝左（Q_L）／偶数＝右（Q_R）。Q→R の中央の直進は無い。
- CHALLENGE：イベントのサイコロ 5・6＝成功の道／1〜4＝失敗の道（L_MERGE で通常の道に戻る・ペナルティなし）。
- 報酬の枝は行き止まり。着いたら残りの目は捨てる（自動では戻らない）→ 次のターンから帰り道をサイコロで歩く。同じ報酬は1回の育成で1回だけ。
- D_RAND：開始時に開閉を決めて保存。閉じていても GOAL へ届く。
- 門（下・上）は通り抜け（止まらない）。道の上にあるので飛ばせない。

## 【仮】の設定（未承認・js/proto/roadfirst-core.js の先頭にまとめた）

- D_RAND が開いている確率：50%（キットでは UNDECIDED）。
- 途中で止まるか（stopRule）：既定 `stop`＝Q・RIVAL・CHALLENGE・報酬の行き止まりで止まり、残りの目は使わない（キットの draft_rules。既存の Chapter 1 のライバル＝強制停止と同じ）。比較用に `&rfStop=pass`＝通りながら出来事を起こして残りの目で進む。どちらにしても RIVAL・門・Q・CHALLENGE は飛ばせない（テスト RF-06）。

## まだ無いもの（データに無い・作っていない）

- 能力マス・イベントマス・疲れ・成長・所持金・アイテム（299地点はすべて通常マス＋分岐・門などの役割だけ）。「同じ能力マスの成長は初回だけ」は能力マスが無いので未反映。
- RIVAL のバトル（出来事の文だけ）・報酬の中身（「手に入れた」の印だけ）・D_RAND の隠れ家の中身。
- ダブルダイス（2個振り）。
- 正式の背景・3D の支え・299地点の美術との位置合わせ（座標は 02 の暫定の描画座標）。

## 実測（2026-10-09）

- キットの検証 08_validate_roadfirst.py の再実行：17/17 PASS・48/48 PASS（shapely・networkx を入れた別の環境で）。
- ゲームの進行で：RF-01〜07（Node）・RF-B1〜B3（実ブラウザ・390×844／375×667／430×932）。
- 40ターンのシミュレーション：`node tools/roadfirst/sim.mjs 5000` の結果は CLAUDE.md の「Chapter 1 Pattern A 道路先行の試作」。
