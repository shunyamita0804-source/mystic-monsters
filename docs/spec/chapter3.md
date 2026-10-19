# Chapter 3「天空の浮島」

旧 CLAUDE.md §3 から移した節（文はそのまま・節の順も元のまま）。同じ事柄は日付の新しい記述が優先し、各節の「〇〇が優先」「以下は旧記録」などの注記に従う。本文の「§3「〇〇」」は旧 CLAUDE.md の節名＝移設先は docs/README.md の対応表で引く。

## この主題にかかわるほかの記録

- docs/history/spec-2026-10-15_19.md「次便一括（2026-10-19）」：Chapter 3 の道（描画の白い大理石）
- docs/history/spec-2026-10-15_19.md「本編試遊の緊急修正 v2（2026-10-18）」：Chapter 3 の道路素材は画像待ち
- docs/ch3_1018/DESIGN.md：設計・数値・シミュレーション

---

### Pre-Chapter3 修正5点＋Chapter 3「天空の浮島」（2026-10-18。いまの正式。指示＝ZIP Mismon_Claude_PreCh3_修正後一括完成GO・作業ブランチ claude/prech3-1018・基準 main de43edd）

- **リュウの初登場の声**：最初の一言から声（OPEN_TALK.ryu の1行目＝ryu_004「よう。」＋「……って、あれ？ フィナじゃないか！」＝行の頭と声が同じ・voiceWait 1500）。名前の行は従来どおり ryu_002
- **セリフ送りで声を止める（全 NPC 共通・js/npc/npc.js）**：タップで次の行へ送ったら、鳴っている声と読み込み待ちの声をすぐ止める（MMVOICE.stop＝待ちの声も取り消す）。声に合わせた自動の字幕送り（sync の autoJ）のときだけ声を続ける。旧：読み込み待ちの声（maxWaitMs 350 の間）は voiced が立たず、送ったあとに遅れて鳴り続けた
- **Chapter 1 の道路画質**：本編の Chapter 1 の既定＝道路の新素材 fix（js/qa/road-art-1017.js の MODE＝URL が無ければ 'fix'・`?qaRoadArt=old` で従来の hq1014）＋近くの高い解像度の層（road-1016.js・既定 32MB＝iPhone のメモリに余裕）。Chapter 2 の新素材は従来どおり URL のときだけ（urlMode）
- **分岐の広場**（roadfirst-world.js の plaza）：灰色の塗りの輪をやめ、道の帯と同じ縁石を円に沿って並べた円形の広場（道が入る所は縁石を切る・中は R の敷石・内側の陰・外側の薄い影）。分かれ目 半径 0.8×帯・行き止まり 0.7×帯
- **歩行の縦伸び**：歩行コマの縦横比を絵の実際の比で固定（world-board の img.wk に aspect-ratio・object-fit:contain、field-view の .chf-spr img も）。Chromium では DOM の比は元から正しい＝iPhone の Safari での見え方は実機確認待ち。歩行の絵は立った姿（座った立ち絵より細い）＝絵そのものは変えていない
- **Chapter 3（本編・通常プレイ）**：新しい Chapter 3 の出発で A／B／C を各 1/3 で抽選（m.raise.field.route）・40ターン・サイコロ 1〜6・空腹・食事・報酬は Chapter 1 と同じ・成長量は Chapter 3 の表。BGM＝CHAPTER_3（従来）・野外のバトル背景＝ch3_sky（従来）・到着＝雲海の上の会場の絵 → ロビー → 大会受付・出発準備のカード＝盤の全景（assets/fields/ch3/intro/ch3_overview.webp）。設計・数値・シミュレーションは docs/ch3_1018/DESIGN.md。Chapter 4・最終ルートは従来の旧ボード
- **QA**：`?qaTop=1`（Chapter 1／2／3 の A／B／C の入口）・`?ch3trial=A|B|C`・盤の左の「QA移動」（MMQAJ）・次の出目の固定は window.MM_QA_DIE（raising.js の roll が1回だけ使う）
- テスト：tests/ch3-world-1018.test.mjs（C3-01〜04）・実ブラウザ tests/qa-e2e-ch3-1018.test.mjs（C3B-1〜4）。harness は既定で旧 Chapter 3（MM_QA_OLD_CH3）＝open({ worldCh3:true })・open({ route3 })。qa-e2e-ch1-hq-1014・qa-e2e-road-1017 は従来の絵を ?qaRoadArt=old で確かめる形に。MM_BUILD／version.json／MMTUNE.BUILD＝2026-10-18-ch3
