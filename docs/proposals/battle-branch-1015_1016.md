# バトルのブランチだけの修正（claude/claude-md-handoff-check-fcl9lb の記録）

旧 CLAUDE.md §3 にあった、ブランチだけ・未承認・試作の節（文はそのまま）。状態は各節の見出しの注記のとおり（移設した時点＝2026-10-19 の記録のまま。その後 main に入ったものがあるかは docs/history/ と git の履歴で確かめる）。

### iPhone 実機8本の限定修正（2026-10-16。**ブランチ claude/claude-md-handoff-check-fcl9lb だけ＝main 未統合・未公開・全件 iPhone実機再検収待ち**）

- 報告：docs/battle_fix_1016/REPORT.md（状態の表・原因・前後の画像）。技名・番号・性能・固有スキル・ルーレット・セーブ・BGM／SE の音源・fight() は変えていない
- **口先（発射点）**：js/battle/move-tune-1015.js の `MMTUNE.MOUTH`（コマの絵の画素・右向き・手で測った値）→ js/battle/art25d.js の `mouthPt`（本体の img と同じ式＝反転・回転・体格に追従）。光線（beam・stretch）は区切りごとにそのコマの口先から出し直す（2本目は伸びきった長さで続ける）・火球（launch の fromMouth）は口先で小さく生まれる。対象＝ソラモビーム（05_02 だけ＝t[1,1]）・スターダストレイ（08_04・08_05。光線の絵は 05_03 の流用＝暫定）・ファイアボール（15_02）・フレアレイ（16_02・16_03）。表に無いコマは従来の見積もり。効果の要素に data-mx／my／mf（口先の位置とコマ）
- **当たりの絵文字**：スターフォールの 🌠（iPhone で四角い額の絵）だけ、技のコマで見せている間は fight() が出す札（span.sk）を出た直後に消す（`MMTUNE.EMOJI_OFF`・MutationObserver）。ほかの絵文字は変えていない（候補は報告書）
- **聖なる炎**：三色の炎の輪は浮いたガウルの体の中心から広がるだけ（aura の onBody）＝相手へ飛ばさない。相手の当たりは共通演出 bc06。最後の青い球と ▲＝fight() の能力アップの印（efBurst）＝報告のみ
- **蒼刃乱舞 28_07**：体の右の縦長の青い柱だけ透明に（tools/battlefix1015/apply.py の PILLAR。applied.json は 43件）。前脚の先が少し欠ける＝正式な修正コマを推奨
- **体格（項目08）**：動画はプレビュー ON と判断（高さ比 1.22 ≒ ?mmSize=1 の 1.25。通常は 1.02）。候補A（ジオル 106%／ソラモ 74%）・候補B（112%／68%）は提案だけ＝未実装
- テスト：BT-07・BTB-5〜7（tests/battle-tune-1015・qa-e2e-battle-tune-1015）

### iPhone 再試遊6件＋フルーネ09 ルートドレイン（2026-10-16。**ブランチ claude/claude-md-handoff-check-fcl9lb だけ＝main 未統合・未公開・iPhone実機再検収待ち**）

- 依頼：ZIP Mismon_Claude_Combined_iPhone6_Fulune_20261016。報告：docs/ip6_fulune_1016/REPORT.md
- 録画4本（12:06〜12:08）は c1035f7 より前の版の動き＝配信（raw.githack）のキャッシュで古い JS が混ざった可能性。QA 画面の見出しに「版：画面／技アニメ」を出す（MMTUNE.BUILD と MM_BUILD＝2026-10-16-ip6）
- SK16 の溜めの光（16_01_fx の光の玉）を嘴の先へ（art25d の at:'mouth'・口先の表 16_01）。SK08 の青い専用光線の試作＝js/battle/sk08-blue-1016.js（CSS だけ・?sk08=blue のときだけ）
- 体格サイズ 比較案 A／B：?mmSize=A｜B（MMTUNE.SIZE_PLAN・VIS_H＝見えている体の高さで割る）・?mmSizeAs＝比較用の読み替え。正式倍率ではない
- WIN の帯＝青・LOSE の帯＝赤（arena.js の CSS だけ）
- フルーネ技09 ルートドレイン：js/battle/rootdrain-1016.js（MMRD・8コマ・08 を正式待機絵に合わせる）・rules.js（QA 試遊のときだけ SK 58・与えたダメージの 50% を四捨五入で吸収・最大ライフまで・MISS／0 は吸収なし）。monsters.js：01 威力60・02 威力65・09 ルートドレイン 110／90／10%／吸収50%・10 威力120（ユーザー決定の項目だけ）。固有スキル「生命の芽吹き」は変えていない（資料との食い違いはユーザー判断待ち）
- SK19 V2：聖なる炎のあとの能力アップの印（青い球＋▲）を出さない（ユーザー決定）
- テスト：BTB-5・BTB-10〜12・D27-22・FL-01／02・CQ-03

### SK19 承認演出 V2（2026-10-16。**ブランチ claude/claude-md-handoff-check-fcl9lb だけ＝main 未統合・未公開・iPhone実機再検収待ち**）

- 依頼：ZIP Mismon_Claude_SK19_Only_TestHandoff_20261016（SK19 だけ・ほかの技・SE・計算・体格・セーブは変えない）。報告：docs/sk19_v2_1016/REPORT.md
- js/battle/sk19-v2-1016.js（MMSK19V2）＝承認動画（5.79秒）の相対時刻を既存の SK19 の時間枠（art25d の planOff＝2.5秒）に縮めて再生。浮上 → 飛行2枚を交互（1時点で1枚）→ 胸で点火・拡大・放射・最大放射（背面 0.70・前面 0.16）→ 2.88 外縁が相手の中心 → 2.95 当たり（既存の命中・ダメージのイベント1回）→ 既存の sp_buff → 降下 → 正式の待機絵
- 置き方：正式のバトル待機絵（idle_gauru）の目の位置に飛行ポーズの目を合わせる・大きさは参照待機の体の面積をそろえる。相手側は scaleX(-1)。敵側の着弾の炎・burst は出さない
- 確認用：?sk19time=v2（試写と同じ実時間・戦闘が延びる）／?sk19=v1（前回の演出）。V2 の絵が読めないときは前回の演出へ
- 気づいた点：正式の待機絵と V2 の飛行ポーズは別の絵（翼・尾の形が入れ替わりで変わる）・wings_down の右端で羽先が切れている（20行）
- テスト：BT-08・BTB-8（自分側・相手側）・BTB-9（決着のあとも残らない）

### バトル技アニメ 試遊修正21件・体格サイズ1〜5（2026-10-15 夜の一括依頼 PHASE B。**ブランチ claude/claude-md-handoff-check-fcl9lb だけ＝main 未統合・未公開・iPhone 実機は未確認**）

- 報告：docs/battle_fix_1015/REPORT.md（21件の原因・修正・状態の表・発注一覧・連続写真 film/・素材の比較 assets_check/・体格の比較 size_compare.jpg）
- **共通スケール**（js/battle/art25d.js の layout・areaScales）：技のコマの大きさ＝コマごとに「見えている体の面積」（js/battle/move-area-1015.js＝`python3 -I tools/battlefix1015/areas.py` が作る・手で書き換えない）を待機立ち絵とそろえる＝技の途中で体の大きさが変わらない。`?mmScale=old` で従来の見積もり
- **技ごとの修正**（js/battle/move-tune-1015.js の `MMTUNE.MOVES`・データ *-moves-data.js は変えない＝表示のときだけ `MMTUNE.patch` の写し）：stay（その場で撃つ）・detach＋launch／stretch（体の層に描かれた火球・光線・花粉を切り出して相手へ飛ばす／伸ばす）・arc（跳ぶ）・lift（浮く）・rot・aura・charge・shakeAt・sfxAt・hs（ヒットストップ）。15件（01・02・04〜07・10・13〜16・18〜21）
- **素材の修正**（42 ファイル）：`python3 -I tools/battlefix1015/apply.py`（基準コミット bf310c4 の内容から作り直す＝何度実行しても同じ・修正前後の sha256 は tools/battlefix1015/applied.json）＝ジオル・ノビトンの市松の取り残し（体＝穴を消す・効果＝明るさの差を均す）・ひとやすみ 33_02／33_03 の松葉模様・スターフォール 09_04〜06 の切れた端・竜眼ロック 22_03／22_04 の緑。検出は tools/battlefix1015/checker.py
- **体格サイズ**（`MMTUNE.SIZE`＝ソラモ2・ノビトン2・ガウル3・フルーネ3・レグナス3・ジオル4・5 は予約・ラズック1 は未登録）：倍率 70/80/90/100/115% は【暫定】＝**URL に `?mmSize=1` のときだけ**（js/battle/arena.js の kOf → --mma-k）。通常は今までの大きさ。セーブに項目なし
- はなビンタの 👃（iPhone で写実的な鼻）→ 💫（js/battle/rules.js の NOBI_EMOJI）
- 技の SE：合成音（skSfx）の当たりをコマの当たりに合わせて遅らせる（MMTUNE の skSfx の包み・コマで見せる技だけ）・蒼刃乱舞の決めの斬撃に BATTLE_CRIT。**技の SE は全部が合成音＝新しい音源は未採用（ライセンス確認待ち）**
- 暫定・素材待ち：02 スターダストレイの専用光線・07 聖なる炎の三色の弾と着弾・09 ずつきの技カード・10 頭突きの姿・20／21 フルーネの専用 FX（未完成）・市松を均した 37 枚の正しい透過の再納品
- テスト：tests/battle-tune-1015.test.mjs（BT-01〜06）・実ブラウザ tests/qa-e2e-battle-tune-1015.test.mjs（BTB-1〜4）
