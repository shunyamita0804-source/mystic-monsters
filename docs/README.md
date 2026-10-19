# docs の目次・旧 CLAUDE.md の節の移設先

2026-10-19 に CLAUDE.md を「毎回読む最小限の引き継ぎ書」にし、ほかを docs/ へ移した（文は要約・言い換えをせずそのまま）。本文の「§3「〇〇」」「§5」などは旧 CLAUDE.md の節名＝下の表で移設先を引く。

## 旧 CLAUDE.md の節 → 移設先

| 旧 CLAUDE.md の節 | 移設先 |
|---|---|
| ## 1. ゲーム概要 | CLAUDE.md（そのまま） |
| ## 2. ファイル構成（表） | CLAUDE.md（1ファイル1行）・元の表は docs/spec/files-detail.md |
| ### セーブデータ | CLAUDE.md（約束の2行）・持ち物の形と任意項目は docs/spec/save.md |
| ### テスト | CLAUDE.md（実行方法・運用）・件数の記録は docs/history/test-log.md |
| ### ホーム画面アイコン・技術上のルール・検索・調査のルール | CLAUDE.md（そのまま） |
| ## 3. 確定済みの正式仕様 | 下の表（節ごと） |

## 3. 確定済みの正式仕様

| 旧 CLAUDE.md §3 の節 | 移設先 |
|---|---|
| ### モンスター（原種4体） | docs/spec/monsters.md |
| ### 能力と色 | docs/spec/monsters.md |
| ### 育成ボード | docs/spec/board.md |
| ### 商用品質化・第1次（2026-10-02。Game Feel・音・会話の見せ方） | docs/history/spec-2026-10-02_06.md |
| ### 実機試遊の改善（2026-10-04 PHASE G。iPhone の試遊で見つかった違和感の修正。いまの正式） | docs/history/spec-2026-10-02_06.md |
| ### 正式デザインの統合・施設の作り直し（2026-10-04 PHASE H。いまの正式） | docs/history/spec-2026-10-02_06.md |
| ### 追加素材の局所統合（2026-10-04 PHASE I。いまの正式） | docs/history/spec-2026-10-02_06.md |
| ### 次期総合改修（2026-10-05。いまの正式） | docs/history/spec-2026-10-02_06.md |
| ### 次期総合改修・2（2026-10-06。いまの正式） | docs/history/spec-2026-10-02_06.md |
| ### 正式音源とプロローグの固定同期（2026-10-05 夜。いまの正式） | docs/spec/audio.md |
| ### 追加修正（2026-10-06・2。いまの正式） | docs/history/spec-2026-10-02_06.md |
| ### PHASE B（2026-10-05。いまの正式。基準 92628b1 への差分） | docs/history/spec-2026-10-02_06.md |
| ### 実機試遊の修正＋リュウ／レグナス（2026-10-05 夜。いまの正式。基準 b80d787 への差分） | docs/history/spec-2026-10-02_06.md |
| ### 正式素材の統合（2026-10-05 夜・2。いまの正式。基準 54a4f3b への差分） | docs/history/spec-2026-10-02_06.md |
| ### 共通UI の正式素材（2026-10-06 第1弾。基準 a4fb03a への差分。**下の「重大修正と共通UI 第2弾」が優先**＝WebP は PNG に置き換え・「使っていない」の一部は第2弾で採用） | docs/spec/ui.md |
| ### 重大修正と共通UI 第2弾（2026-10-06・2。いまの正式。基準 83a3bcb への差分） | docs/spec/ui.md |
| ### UI 試遊修正（2026-10-06・3。いまの正式。基準 d9fccc6 への差分） | docs/spec/ui.md |
| ### 本体修正＋大会UI統合＋技アニメ＋バトル演出（2026-10-06・4。いまの正式。基準 3ad6d77 への差分） | docs/spec/battle.md |
| ### 実機試遊・軽微 UI／遷移修正便（2026-10-07 夜。いまの正式。基準 c72e69c への差分） | docs/history/spec-2026-10-07_11.md |
| ### 大会〜バトル追補便（2026-10-07 深夜・2。いまの正式。基準 d4f67d5 への差分） | docs/spec/tournament.md |
| ### 正式UI回収（2026-10-07 深夜。いまの正式。基準 6c44fa4 への差分） | docs/spec/ui.md |
| ### BGM 正式採用・セドリックの会場・UI 再回収（2026-10-07 夜。いまの正式。基準 d77e8b0 への差分） | docs/spec/audio.md |
| ### 監査後の仕様確定差分（2026-10-08。いまの正式。基準 64c6f5a への差分。深層監査の「仕様判断が必要だった項目」だけ） | docs/spec/tournament.md |
| ### 深層監査の修正・第1便（2026-10-08。いまの正式。基準 1956bb1 への差分） | docs/history/spec-2026-10-07_11.md |
| ### 正式素材の統合・次便（2026-10-08。いまの正式。基準 ec22fe2 への差分） | docs/history/spec-2026-10-07_11.md |
| ### 深層監査の修正・第2便（2026-10-08。いまの正式。基準 1bfd8b2 への差分） | docs/history/spec-2026-10-07_11.md |
| ### 2.5D の歩行コマ・対戦表の横顔（2026-10-11。基準 12edeaa への差分） | docs/spec/monsters.md |
| ### Chapter 1 の画像演出・レア10%（2026-10-11。いまの正式。基準 2fd08d1 への差分） | docs/spec/chapter1.md |
| ### 2.5D の正式立ち絵（2026-10-11。いまの正式。基準 c9c0ee3 への差分） | docs/spec/monsters.md |
| ### P2 空腹と食事（2026-10-12。基準 35ec5b8 への差分。**値・価格・入荷は P2 試遊用の暫定値**） | docs/spec/items.md |
| ### 序盤イベントの並び直し・リュウの3択（2026-10-12 開発21 ①。いまの正式。基準 9703292 への差分。**リュウの台詞は試遊用の仮案（F 案）＝最終確定ではない**） | docs/spec/opening.md |
| ### 市場の入手演出・「出発する」の位置・バッグの鍵（2026-10-12 開発21 ②。いまの正式。基準 0cf5164 への差分） | docs/history/spec-2026-10-12.md |
| ### 出発の全景導入（2026-10-12 開発21 ③。いまの正式。基準 3323b2a への差分） | docs/spec/chapter1.md |
| ### 冒険の HUD（2026-10-12 開発21 ④。いまの正式。基準 533745f への差分） | docs/spec/chapter1.md |
| ### 公式ランク戦の正式バトル背景・対戦前比較・VS・接地（2026-10-12 開発21 ⑤。いまの正式。基準 3133dde への差分） | docs/spec/battle.md |
| ### 試遊修正一括（2026-10-12 夜。いまの正式。基準 bdae69e への差分） | docs/history/spec-2026-10-12.md |
| ### 試遊修正・7点（2026-10-12 夜・3。いまの正式。基準 d2a155c への差分） | docs/history/spec-2026-10-12.md |
| ### 新マス12種・食事のマス・正式 SE・特訓チケット・ノビトン（2026-10-12 夜・2。ZIP「試遊修正_新マス12種_SE_チケット」＋ノビトン 59枚） | docs/history/spec-2026-10-12.md |
| ### 公式ランク戦の BGM（2026-10-12。基準 90b0e1f への差分） | docs/spec/audio.md |
| ### Chapter 1 の世界のボード：試遊修正（2026-10-12。基準 90b0e1f への差分。表示だけ） | docs/spec/chapter1.md |
| ### 正式画像24枚（2026-10-12 開発23 A。基準 cae79b2 への差分。仮の絵の差し替えだけ） | docs/spec/chapter1.md |
| ### レグナス・ジオルの技アニメ（2026-10-12。基準 23aaea7 への差分。技の性能・解禁・ライバルの技構成は変えていない） | docs/spec/battle.md |
| ### 立体サイコロ（2026-10-12 開発23 B。いまの正式。基準 d4df85f への差分） | docs/spec/board.md |
| ### 開発25：大会UI・正式サイコロ・施設のボイス・Chapter 1 の題字（2026-10-13。いまの正式＝2026-10-13 ユーザー承認で main へ統合・公開（MM_BUILD 2026-10-13-dev25）。基準 18bf404 への差分） | docs/history/spec-2026-10-13_14.md |
| ### Chapter 1 進入時のクラッシュ対策（2026-10-14。基準 dfd5993 への差分。iPhone 実機の合格はユーザーの確認待ち） | docs/spec/chapter1.md |
| ### 2.5D の歩行 48コマ（2026-10-14。いまの正式＝素材の技術検収済み・iPhone 実機は未確認。基準 2d8cf01 への差分） | docs/spec/monsters.md |
| ### Chapter 1 B／C 独立ルート（2026-10-14 後半。いまの正式。基準 5b59931 への差分。下の「景色のパターン」の選択ボタンは撤去＝この節が優先） | docs/spec/chapter1.md |
| ### Chapter 1 A／B／C 設計の正式決定（2026-10-14・ユーザーの15項目の回答 aaaaaaabaaaabab。B／C の本実装の開始の許可ではない） | docs/spec/chapter1.md |
| ### Chapter 1 A／B／C 高品質化（2026-10-14。いまの正式＝ユーザーが比較画像を見て画質を正式承認・PR #33 で main に統合。基準 5230195 への差分。**絵だけ**） | docs/spec/chapter1.md |
| ### Chapter 1 B／C：景色のパターン（2026-10-14。いまの正式。基準 9ca90aa への差分。**見た目だけ**） | docs/spec/chapter1.md |
| ### 実機試遊47項目（2026-10-14。いまの正式。基準 1a7f9b0 への差分。ZIP「ミスモン_47項目_実機動画7本_最高品質化_Claude今夜一括修正_20261014」） | docs/history/spec-2026-10-13_14.md |
| ### 次回便12項目（2026-10-15。いまの正式。ZIP「ミスモン_次回Claude便_12項目_フルーネ登録_大会アイコン6種_20261015」。N04 は下の節） | docs/history/spec-2026-10-15_19.md |
| ### 新しいパラメーター比較・QA 試遊モード（2026-10-15。いまの正式。ZIP「Mismon_CompareScreen_And_QA_Instructions_20261015」A・C と「Mismon_Flurene_10SkillCards_20261015」B） | docs/spec/battle.md |
| ### ジオルの正式10技（2026-10-15。ユーザー正式承認。ZIP「Mismon_Jiol_10Moves_Battle_Addendum_20261015」の 02_Jiol_Approved_Moves.tsv。基準＝フルーネの技アニメ・歩行の統合後） | docs/spec/battle.md |
| ### フルーネの技アニメ・歩行（2026-10-15。基準 a1e0776 への差分。ZIP「Mismon_Flurene_Walk_And_Claude_Instructions_20261015」＋「Mismon_Flurene_SkillAnim_Part1of5〜5of5」。**実機の合否はユーザーの確認待ち＝Chapter 2 の設計はユーザーの OK まで着手しない**） | docs/spec/monsters.md |
| ### Chapter 2 正式美術・本編の盤（2026-10-16。**ブランチ claude/ch2-art-1016 だけ＝main 未統合・未公開・iPhone 実機の確認待ち**。依頼 ZIP「Mismon_Claude_Ch2_InstructionQA_20261016」＋素材 Part01〜04。基準 main 3d9a205） | docs/proposals/chapter2-art-1016.md |
| ### Chapter 2 A／B／C 設計案・限定試作（2026-10-15。**未承認＝本番に入れない**。依頼 ZIP「Mismon_Ch2_ABC_Claude_Design_Request_20261015」。基準 main a28837e） | docs/proposals/chapter2-abc-design-1015.md |
| ### 次便一括（2026-10-19。いまの正式。指示＝ユーザー承認の「01_Claudeへ送る全文_20261019」・作業ブランチ claude/next-1019・基準 main c34bc0b） | docs/history/spec-2026-10-15_19.md |
| ### Chapter 4「灼熱の火山」本編（2026-10-19。いまの正式。下の「Chapter 4 設計案」の道路グラフをそのまま本編にした） | docs/spec/chapter4.md |
| ### ミュロル（2026-10-19。登録のみ・未解禁＝入手条件なし。正式納品「ミュロル 開発本体向け 正式素材仕様一式」PART01〜07＝ユーザー承認済みの仕様マスター＋採用状態一覧 2026-10-19） | docs/spec/monsters.md |
| ### 夜間 GO（2026-10-18〜19。いまの正式。指示＝ZIP Mismon_Claude_夜間一括GO_全体不具合_歩行7体正式反映_Ch4ABC設計Sim_20261018・作業ブランチ claude/night-1018・基準 main bb7e625） | docs/history/spec-2026-10-15_19.md |
| ### カルシェル（2026-10-18。登録のみ・未解禁＝入手条件なし。正式納品 Kalshell_DevAssets_Part01〜07＝Mismon_Kalshell_OfficialPackage_ForDev_20261018・ユーザー承認済みの仕様マスター） | docs/spec/monsters.md |
| ### Chapter 4 設計案（2026-10-18。**2026-10-19 に本編へ＝上の「Chapter 4「灼熱の火山」本編」が優先**。当時は未承認・本編に出さない。正式全体絵・巨大火山 TL/TR/BL/BR はリポジトリに無い＝座標はすべて仮） | docs/spec/chapter4.md |
| ### 本編試遊の緊急修正 v2（2026-10-18。いまの正式。指示＝ZIP Mismon_Claude_本編試遊不具合のみ緊急修正_v2_Ch3道路とQA本編統一・作業ブランチ claude/fix-1018v2・基準 main 48081ad） | docs/history/spec-2026-10-15_19.md |
| ### Pre-Chapter3 修正5点＋Chapter 3「天空の浮島」（2026-10-18。いまの正式。指示＝ZIP Mismon_Claude_PreCh3_修正後一括完成GO・作業ブランチ claude/prech3-1018・基準 main de43edd） | docs/spec/chapter3.md |
| ### バトル最終統合（2026-10-16。いまの正式＝ユーザー許可でバトルの範囲だけ PR → main 統合 → 公開。iPhone 実機の合格はユーザーの検収待ち） | docs/spec/battle.md |
| ### iPhone 実機8本の限定修正（2026-10-16。**ブランチ claude/claude-md-handoff-check-fcl9lb だけ＝main 未統合・未公開・全件 iPhone実機再検収待ち**） | docs/proposals/battle-branch-1015_1016.md |
| ### iPhone 再試遊6件＋フルーネ09 ルートドレイン（2026-10-16。**ブランチ claude/claude-md-handoff-check-fcl9lb だけ＝main 未統合・未公開・iPhone実機再検収待ち**） | docs/proposals/battle-branch-1015_1016.md |
| ### SK19 承認演出 V2（2026-10-16。**ブランチ claude/claude-md-handoff-check-fcl9lb だけ＝main 未統合・未公開・iPhone実機再検収待ち**） | docs/proposals/battle-branch-1015_1016.md |
| ### バトル技アニメ 試遊修正21件・体格サイズ1〜5（2026-10-15 夜の一括依頼 PHASE B。**ブランチ claude/claude-md-handoff-check-fcl9lb だけ＝main 未統合・未公開・iPhone 実機は未確認**） | docs/proposals/battle-branch-1015_1016.md |
| ### 2026-10-18 REV3（iPhone 実機 QA の修正・正式採用の本編反映。いまの正式。指示＝ZIP Mismon_Claude_PreCh3_…_REV3_20261018 の 01・作業ブランチ claude/rev3-1018・基準 main 2108dca） | docs/history/spec-2026-10-15_19.md |
| ### 2026-10-17 統合便 v2（道路・音声・歩行・ラズック・QA・初見プレイ。いまの正式。作業ブランチ claude/all4-1017・指示＝ZIP Mismon_Claude_All4Phases_PublicGO_VoicePlacement_20261017_v2） | docs/history/spec-2026-10-15_19.md |
| ### NPC のボイス全停止（2026-10-15 N04。**2026-10-17 に解除＝下の「統合便 v2」が優先**。ユーザー指示＝無料で作った NPC の声は商用不可の認識・週末に有料プランで作り直す） | docs/spec/audio.md |
| ### 開発30：正式5体×10技＝50技カード・技管理の横長6枠（2026-10-14。基準 995b778 への差分） | docs/spec/battle.md |
| ### 開発29：iPhone 実機の指摘の最小差分＋正式5体個性エフェクト＋公開クレジット（2026-10-14。いまの正式。基準 ce556dc への差分） | docs/history/spec-2026-10-13_14.md |
| ### 開発28：PHASE A（2026-10-13。いまの正式。基準 cb31f33 への差分。ZIP「開発27_claude_final」の 01 の A1〜A7。iPhone 実機の確認は未＝ユーザーの試遊待ち） | docs/history/spec-2026-10-13_14.md |
| ### 開発27：iPhone 試遊の修正 30項目（2026-10-13。いまの正式＝ユーザー承認で main に統合・公開（MM_BUILD 2026-10-13-dev27）。基準 72fbfbc への差分） | docs/history/spec-2026-10-13_14.md |
| ### 開発25 追加便：NPC のボイス 12本・BGM の候補 3曲（2026-10-13。いまの正式＝PR #24 で main に統合・公開済み（72fbfbc・2026-10-13-voice15）。基準 a681c37 への差分） | docs/spec/audio.md |
| ### 開発24：バトル画面・観客の声・NPC のボイス（2026-10-13。いまの正式＝試遊採用・既定 ON。基準 d356155 への差分） | docs/history/spec-2026-10-13_14.md |
| ### リアクション 30枚（2026-10-12。いまの正式。基準 9883a7e への差分） | docs/spec/monsters.md |
| ### ソラモの技アニメ（2026-10-12。基準 90b0e1f への差分） | docs/spec/battle.md |
| ### バッグ（2026-10-11 正式。基準 12edeaa への差分） | docs/spec/items.md |
| ### 本編 Chapter 1＝1枚の世界のボード（2026-10-11。いまの正式。基準 a6731b3 への差分） | docs/spec/chapter1.md |
| ### Chapter 1 Pattern A 正式ボード（2026-10-08。いまの正式。基準 0015830 への差分） | docs/spec/chapter1.md |
| ### Chapter 1 Pattern A 道路先行の試作（2026-10-09。**試作・正式ではない**。基準 ad77ece への差分） | docs/proposals/chapter1-prototypes.md |
| ### P ハブ背景共用の実装前検証（2026-10-10。**試作・正式ではない**。ローカルのブランチ proto/p-hub-1010 だけ＝push・main・公開なし） | docs/proposals/chapter1-prototypes.md |
| ### 今回差分の最終統合（2026-10-07。いまの正式。基準 829c772 への差分） | docs/history/spec-2026-10-07_11.md |
| ### 大会・状態異常・固有スキル・技習得ルート（2026-10-06・5。いまの正式。基準 1c1e2b8 への差分） | docs/spec/battle.md |
| ### 大会 | docs/spec/tournament.md |
| ### 特訓 | docs/spec/training.md |
| ### バトル | docs/spec/battle.md（Phase 6 保護対象の4行は CLAUDE.md） |
| ### 技データ | docs/spec/battle.md |
| ### 経済・市場・売却 | docs/spec/market.md |
| ### NPC | docs/spec/npc.md |
| ### 街（コマンド式・正式ホーム画面） | docs/spec/facilities.md |
| ### ファーム（正式デザイン・2026-09-30 → 2026-10-03 冒険準備の拠点。**2026-10-04 PHASE H でベースキャンプに作り直した＝下の画面の記述は旧構成の記録。いまは §3「正式デザインの統合」**） | docs/spec/facilities.md |
| ### フォント | docs/spec/ui.md |
| ### 開始画面 | docs/spec/ui.md |

| そのほかの旧 CLAUDE.md の節 | 移設先 |
|---|---|
| ## 4. Phase の経緯と現在地 | docs/history/phases.md・docs/history/handoff.md |
| ## 5. 未決事項／## 5.5 将来仕様 | docs/open-issues.md |
| ## 6. 開発ルール／## 7. main への反映ルール | CLAUDE.md（そのまま） |

## このほかの docs

- docs/<作業>_<日付>/（例：docs/next_1019/・docs/rev3_1018/）：各便の報告書・台帳
- docs/decisions.md・docs/ui-parts.md・docs/ui-pending.md・docs/items-38-status-1012.md・docs/voice-replacement-ledger.md・docs/HANDOFF_20261017.md：個別の記録

（旧 CLAUDE.md の節の見出しの1行目は、この表のほか移設先のファイルにも同じ文で残っている。）
