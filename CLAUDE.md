# CLAUDE.md — ミスティックモンスターズ 開発の引き継ぎ書

Claude Code は作業の前に毎回このファイルを読むこと。ここに書かれていないこと・確信がないことは推測で決めず、「未決」または「要確認」として報告する。

詳しい仕様・経緯・未決事項は docs/ にある（下の「8. 詳しい仕様の目次」）。このファイルには毎回必要な約束だけを置く。新しく決まった仕様は docs/spec/ の主題のファイルに書き、このファイルにはファイル構成の1行と目次だけを足す。

## 1. ゲーム概要

- 正式名称：ミスティックモンスターズ（英字：Mystic Monsters、ロゴ表記：MYSTIC MONSTERS）
- 略称：ミスモン
- 旧名「モンスターマスター」「ミスティックモンスター」は使わない。
- **世界設定（2026-10-03 正式）**：人と共に生きる不思議な生命＝「聖獣」。聖獣を育て共に戦い大会へ挑む者の正式名称＝「聖獣士」（ユーザー向けの文では旧「ブリーダー」より優先。内部の変数名は変えない）。聖獣士の登録・管理・支援を行う公的機関＝聖獣士管理局。**年代（2026-10-05 正式・いまのプロローグ）**：約百年前に異常な聖獣が現れた（異変）。十年前、ミストリアの三人の聖獣士（三人のレジェンド＝アストラッド＋ゼルヴァーン・レオナ＋グリフェル・ラグナス＋ドラグノル（2026-10-07 正式。旧名「バルド」は使わない））が脅威を退けた。三人はいまも存命（死亡・失踪・引退の設定は無い）。闘技場に記念画・終盤に挑戦できる設計。※旧記録の「五年前の第二次魔物災害」「約百年前の第一次大災厄と英雄」は旧プロローグ A〜E の設定で、いまは使わない。舞台＝アステリア地方の大都市ミストリア。
- 王道JRPG風のモンスター育成ゲーム。HTML/CSS/JavaScript（ビルドなし）で、GitHub Pages で公開・試遊している。
- 主な確認環境：スマートフォン縦画面（390×844）。iPhone で試遊している。
- 公開URL：https://shunyamita0804-source.github.io/mystic-monsters/（確認済み）
- ゲームの流れ（2026-10-05 正式）：開始画面（タイトル曲）→ プロローグ（固定尺の自動再生＋スキップ）→ 「ミストリア到着」のカット → ミストリアでフィナに声をかけられる → 聖獣士管理局 → セルジュの聖獣士登録（名前）・新人支援 → フィナの説明 → 町で世界地図（出身地）→ 街でリュウの初対面（3択。2026-10-12 並び直し＝§3「序盤イベントの並び直し」）→ 街（市場を案内）→ 市場でモンスターを購入 → ファームで育成（Chapter 1〜4 のボード・大会・特訓。**Chapter 1 は 2026-10-11 から1枚の世界のボード＝§3「本編 Chapter 1＝1枚の世界のボード」**）→ 育成完了 → 牧場（預ける・受け取る・様子を見る・売却）

## 2. ファイル構成

各ファイルの役割の1行。日付・便名・経緯・詳しい中身は docs/spec/files-detail.md（旧 §2 の表）と docs/spec/ の主題のファイル。

| ファイル | 役割 |
|---|---|
| index.html | 画面・CSS・ゲーム本体（旧Artifact版から続く部分を含む）。埋め込みだった base64 画像は assets/inline/ のファイル（index.html に base64 の画像は無い） |
| js/battle-bridge.js、js/integration/adapter.js、js/systems/ | バトルエンジン（Phase 6 保護対象） |
| legacy/index.original.html | 旧版の原本（保護対象・変更禁止） |
| js/phase7/progression.js | 育成の共通処理（特訓・アイテム・バッグ・ランク記録）`MMP7` |
| js/phase8/league.js | 大会の総当たりリーグ `MMP8L` |
| js/phase8/raising.js | 育成進行・Chapter・大会・セーブv6・育成完了回数・最終ルートの代替処理 `MMP8` |
| js/phase8/rival.js | ライバル「リュウ」の強さ `MMRIVAL` |
| js/phase9/chapters.js、js/phase9/board-art.js | 旧ボード（ノード・分岐・マス）と描画 `MMP9C` |
| js/phase10/monsters.js | 正式モンスターデータ・成長適性と上昇量・正式技・固有スキル・未解禁の種族（PENDING_SPECIES）・市場・売却・牧場の上限 `MMP10M` |
| js/phase11/player.js | プレイヤー名と名前の正規化 `MMP11P` |
| js/phase12/scenes.js、js/phase12/dice.js | 背景・サイコロ演出 |
| js/phase13/field.js | 旧 Chapter 1 のフィールド表示（今は表示されない） |
| js/chapter/engine.js | 旧 Chapter フィールドの共通エンジン `MMCH` |
| js/chapter/configs/ch1a.js | Chapter 1 の config（旧14枚のボード・出来事 eventPool・歩行コマの登録 monsterSprites） |
| js/chapter/configs/ch2a.js | 旧 Chapter 2 の盤の config（旧盤の互換・歩行コマ） |
| js/chapter/events.js | Chapter のイベント基盤 `MMEVT` |
| js/chapter/field-view.js | 旧 Chapter フィールドの画面 `MMCHV` |
| js/chapter/intro.js | Chapter 開始の演出 `MMCHI` |
| js/chapter/reactions.js | 冒険リアクション `MMREACT` |
| js/chapter/dice-renderer.js | 従来のサイコロ `MMCHD` |
| js/chapter/dice-cube.js | 立体サイコロ `MMDICE3D` |
| js/chapter/world-driver.js | 1枚の世界の盤の進行（Chapter 1）`MMWD`・ほかの章の盤の元（make） |
| js/chapter/world-board.js | 1枚の世界の盤の画面（全 Chapter 共通）`MMWB` |
| js/chapter/world-driver-ch2.js、world-driver-ch3.js、world-driver-ch4.js | Chapter 2／3／4 の盤の進行 `MMWD2`・`MMWD3`・`MMWD4` |
| js/chapter/ch2-trial.js、ch3-trial.js、ch4-trial.js | Chapter 2〜4 の試遊の入口（?ch2trial など・保存しない） |
| js/proto/roadfirst-data.js・roadfirst-core.js・roadfirst-play.js | Chapter 1 A の道路グラフ `MMRF_DATA`・進行 `MMRF_CORE`・マスの中身と数値 TUNING `MMRF_PLAY` |
| js/proto/roadfirst-world.js・roadfirst-view.js・roadfirst-zones.js | 1枚の世界の描画 `MMRF_WORLD`・試作の画面 `MMRF`・区域 `MMRF_ZONES` |
| js/proto/roadfirst-routes.js | Chapter 1 B／C の道 `MMRF_ROUTES`（生成物＝手で書き換えない） |
| js/proto/ch2-routes.js、js/proto/ch2-world.js | Chapter 2 の道 `MMRF_CH2`（生成物）・海の描画 `MMRF_SEA` |
| js/proto/ch3-routes.js | Chapter 3 の道 `MMRF_CH3`（生成物） |
| js/proto/ch4-routes.js、js/proto/ch4-world.js | Chapter 4 の道 `MMRF_CH4`（生成物）・火山の描画 `MMRF_VOLC` |
| js/items/food.js | 食事6種 `MMFOOD` |
| js/npc/npc.js | 共通NPC表示・共通会話 `MMNPC` |
| js/npc/npc-events.js | 施設の NPC イベント `MMNPCE` |
| js/npc/voice-cues.js | NPC のボイスの出しどころ `MMVOICE` |
| js/audio/audio-manager.js | Audio Manager `MMAUDIO` |
| js/audio/audio-registry.js | BGM・SE・ボイスの登録（曲・音の差し替えはこのファイルの1行） |
| js/feel/game-feel.js | Game Feel の共通基盤 `MMFEEL` |
| js/feel/notice.js | システム通知の帯 `MMNOTE` |
| js/fx/sequence.js | 連続コマの演出の再生器 `MMSEQ`（どこからも呼んでいない） |
| js/prologue/prologue.js | プロローグ `MMPRO` |
| js/opening/worldmap.js | 世界地図 `MMMAP` |
| js/battle/fx.js | バトル共通演出の正式素材 `MMBFX` |
| js/battle/fit.js | バトル画面の表示だけの補正 `MMBF` |
| js/battle/arena.js | 正式バトル画面 `MMARENA` |
| js/battle/stage.js | バトルの共通演出 `MMSTAGE` |
| js/battle/rules.js | バトルの正式ルールの差分（状態異常・固有スキル・追加の技）`MMRULES` |
| js/battle/official-moves.js | ソラモ・ガウルの正式技の入れ替え・特訓の習得 `MMMOVES` |
| js/battle/rival-partner.js | ライバルの相棒レグナスのバトル `MMRP` |
| js/battle/compare.js | パラメーター比較画面 `MMCMP` |
| js/battle/crowd.js | 観客の声 `MMCROWD` |
| js/battle/movedex.js | 技辞典 `MMMOVEDEX` |
| js/battle/move-cards.js | 技カード `MMMVCARD` |
| js/battle/art25d.js、js/battle/art25d-data.js | 技アニメの再生 `MM25D` |
| js/battle/inline-preload.js | assets/inline/ のバトルの絵をバトルの直前に読み、描画の前に data URI へ差し替える `MMINL` |
| js/battle/*-moves-data.js | 種族ごとの技アニメのデータ（生成物） |
| js/battle/move-tune-1015.js、js/battle/move-area-1015.js | 技アニメの表示の調整 `MMTUNE`・体の面積（生成物） |
| js/battle/rootdrain-1016.js | フルーネ技09 ルートドレインの演出 `MMRD` |
| js/battle/sk19-v2-1016.js | ガウル SK19 の演出 V2 `MMSK19V2` |
| js/monsters/reaction-art.js、js/monsters/reaction-art.data.js | モンスターのリアクションの絵 `MMRXART` |
| js/qa/trial.js | QA 試遊モード `MMQA`（?mmQaTrial=1 のときだけ） |
| js/qa/battle-stage.js | 常設バトル QA のステージ `MMQAS` |
| js/qa/qa-top-1017.js | QA トップ（?qaTop=1） |
| js/qa/fresh-1017.js | 初見プレイの隔離セーブ（?qaFresh=1） |
| js/qa/qa-jump-1018.js | QA 移動 `MMQAJ` |
| js/qa/walk5-1016.js | 盤の歩行コマ（5方向）`MMQAW` |
| js/qa/road-art-1017.js、js/qa/road-1016.js、js/qa/qa-board-1016.js | 道路の絵・近くの高解像度の層・QA の盤の入口 |
| assets/monsters/2p5d/ | 2.5D の正式立ち絵 |
| assets/monsters/ | 旧 2D の正式画像・旧歩行（参照しない＝ファイルだけ残す） |
| assets/monsters/walk_1018/、walk_1017/、walk_25d/ | 盤の歩行コマ（本編の既定は walk_1018） |
| assets/monsters/reactions_1012/ | モンスターのリアクションの絵 |
| assets/monsters/compare_1015/ | パラメーター比較の肩上アップ |
| assets/monsters/regnas/ | レグナスの立ち絵・技の演出素材 |
| assets/battle/idle/、arena/、roulette/ | バトルの待機立ち絵・会場・ルーレットの部品 |
| assets/battle/official_rank_1012/ | 公式ランク戦の正式バトル背景 E〜S |
| assets/battle/field_1012/ | 野外のバトル背景（Chapter 1〜4） |
| assets/battle/common/ | バトル共通演出の正式素材 |
| assets/battle/*_moves_*/、assets/battle/2p5d/ | 技アニメのコマ |
| assets/battle/skill_fx_1014/ | 固有スキルの足元エフェクト |
| assets/moves/ | 技アニメーションの正式資料（技辞典） |
| assets/moves/cards_1014/ | 技カード |
| assets/tournament/ | 大会の素材（ロビー・大会UI・VS・顔・セドリック・会場・ランク演出・勝利演出） |
| assets/proto/board_art_1010/ | 1枚の世界の盤の素材 |
| assets/fields/ch1a/ | Chapter 1 の素材（旧ボードの背景・マス・サイコロ・目印・高品質の地面） |
| assets/fields/ch2/、assets/fields/ch2a/ | Chapter 2 の正式美術（新しい盤）・旧盤の素材 |
| assets/fields/ch3/、assets/fields/ch4/ | Chapter 3・4 の素材 |
| assets/chapter/ | 盤の演出素材（能力UPの道具・結果演出・挿絵・FX・ライバルの影） |
| assets/events/ch1/ | Chapter 1 の出来事の挿絵 |
| assets/chests/ | 宝箱の正式素材 |
| assets/items/、assets/item_ui/ | アイテムの絵・アイテム管理のアイコン |
| assets/npc/ | NPC の立ち絵・表情 |
| assets/legends/ | 三人のレジェンドと相棒 |
| assets/prologue/ | プロローグの背景 |
| assets/worldmap/ | 世界地図 |
| assets/title/、town/、ranch/、farm/、basecamp/、bureau/、shop/、lab/ | 開始画面・施設の背景 |
| assets/ui/ | 共通 UI の部品 |
| assets/design_pack_2026-10-03/ | デザイン素材一括の管理表 |
| assets/fx/ | 野生聖獣・合体の演出素材（保存のみ） |
| assets/audio/ | 音源（出どころ・ライセンスは AUDIO_CREDITS.md） |
| assets/scenes/、assets/fields/、assets/dice/ | 背景・フィールド・サイコロの素材 |
| assets/embedded/ | index.html の base64 から外部化した既存画像（元データとバイト単位で同一） |
| assets/inline/ | index.html の base64 画像 175件を外へ出したもの（元データとバイト単位で同一・Phase 6 の絵を含む・manifest.json・README.md） |
| tools/inline-images/ | base64 画像の外部化と確認の道具（extract・restore・usage・battle-timing・screen-check） |
| tools/ | 素材の派生・道の生成・シミュレーション（各フォルダの README・コメント） |
| tests/*.test.mjs | 自動テスト |
| tools/public-check.mjs | push 後の公開URLの確認（§7） |
| version.json | 公開の版（index.html の MM_BUILD と同じ値にする） |
| prototype/ | 確認用ページ（本編からつながない） |
| AUDIO_CREDITS.md | 音源の作者・配布元・ライセンス・使用したファイル（素材を足したら更新する） |
| credits.html | 公開クレジット |
| KNOWN_ISSUES.md | 既知課題と判断事項の記録 |
| QA_AUDIT.md、AUDIT_*.md、REPORT_*.md、INTEGRATION_STATUS.md | 過去の監査・報告 |
| docs/ | 仕様・経緯・提案・未決事項（「8. 詳しい仕様の目次」） |

### セーブデータ

- セーブ version 6、localStorage キー `mr4v6`。旧 v5（キー `mr4`）からは読み込み時に自動移行し、バックアップを残す。
- セーブversion・localStorageキー・checkpoint形式は変更禁止。既存セーブとの互換を必ず保つ。
- 持ち物の形・v6 に後から加えた任意項目：docs/spec/save.md

### テスト

- 実行方法：リポジトリ直下で `node --test tests/*.test.mjs`（Node 22 で確認。約7秒。実ブラウザテストは skip になる）
- 実ブラウザテストも含める場合：`QA_E2E=1 node --test --test-concurrency=1 tests/*.test.mjs`（Playwright＋Chromium を使う。約20〜30分。並列だと約7.9MBの index.html の読み込みが重なり不安定になるため、必ず1ファイルずつ）。共通部品は tests/e2e/harness.mjs
- 既知の失敗テスト：なし（M3-3 はテストの古い期待値が原因だったため、テスト側を修正。assets/monsters/soramo/・gauru/ のフォルダは旧PHASE 1 土台の data/assets.json が登録しているプロフィールカード画像で、ユーザー判断により残す。ゲームは使わない）
- 画面・操作にかかわる変更をしたら：ふだんのテストと、変更に関係する実ブラウザテスト（該当ファイルだけ、QA_E2E=1）が通ったら、すぐ main へ push する。全件の実ブラウザテストは push の後に実行し、問題が出たらすぐ直して再 push する（試遊をすぐできるようにするため）
- **テスト運用（2026-10-01 正式）**：ふだんの開発は「実装 → 関連テスト → commit → push → public-check」。51ファイルの全件実ブラウザテストを push の前提にしない（大きな節目では push の後に全件を回す）。既知の不安定なテストが落ちたら、変更との関係を確かめ、明らかに不安定なものだけ1回再実行して合格なら既知として報告する（何度も再実行しない）。小さな修正では公開版の手動操作確認は不要で public-check を基本にする。
- 便ごとのテスト件数・追加したテストの記録：docs/history/test-log.md

### ホーム画面アイコン

- main の index.html の head 内、Google Fonts の stylesheet 行の直後に、ホーム画面アイコンの2行がある（確認済み）：
  - `<link rel="apple-touch-icon" sizes="180x180" href="./apple-touch-icon-v2.PNG?v=soramo-20260928">`
  - `<link rel="icon" type="image/png" sizes="32x32" href="./favicon.png?v=soramo-20260928">`
- 引き継ぎ時点のZIPの index.html にはこの2行が含まれていない。ZIPなどの index.html で上書きするときは、必ずこの2行を残すこと。

### 技術上のルール（全体QAで追加。仕様ではなく壊れにくくするための約束）

- 育成開始（未育成→Chapter 1）の確認は、共通会話の選択肢（始める／まだやめておく）で行う（2度押しにしない）。選択肢も連打では確定しない（下の MMNPC の項）。
- 2度押しの確認（arm()・p9arm()・reset()）は、1回目から0.4秒未満の2回目の押下を無視する（ダブルタップで確定させない）。arm()・p9arm() の3秒の自動取り消しはそのまま。
- 押すと取り返しのつかないボタンが画面の切り替え直後に指の下に出る場所（市場の購入シート・特訓の選択・ボードのメニューの背景・最初からやり直す）は、表示後0.35秒の押下を無視する（tapHold／tapAt・tapSoon）。
- プレイヤーが入力した名前（モンスター名・合体後の名前・プレイヤー名）を innerHTML に入れるときは、必ず p11Esc を通す（fight() の中は Phase 6 のため未対応）。
- **名前の入口では必ず正規化する（2026-10-08 監査 H-05）**：js/phase11/player.js の MMP11P.cleanName／sanitize（プレイヤー名）／monsterName（モンスター名。空なら種族名）＝HTML の記号 < > & " ' ` \ を全角へ・制御文字と見えない方向制御文字を除く・前後の空白を取る・8文字（コードポイント）。入口＝登録（confirmName・opConfirm）・市場（mkgo・adopt）・牧場の名前変更（rnRename）・合体（fuse）・セーブの読み込み（起動・スロット・セーブコード＝MMP8.migrateSave の補正 normalizeSave）。fight() の HUD は名前をそのまま innerHTML に入れるため、新しい名前の入口を足すときもここを通す。
- セーブの互換処理（ハヤテ→ガウル はガウル＝sp 1 だけ、旧技IDの fx1）は index.html の legacyFix にまとめ、MMP8.addSaveNormalizer で起動・スロット・セーブコードの全経路に通している。
- MMP8.loadFromStorage は、移行処理が例外を出しても起動を止めない（読めないセーブと同じく原文を退避して新規）。読み込み時は、不正な途中状態（pend／trainRun／battle）と不正な要素（box・bag・vault・log）だけを安全な値へ戻す。正常なセーブは変えない。
- 画面全体を固定（2026-09-30）：ページ（html・body）は上下にスクロールしない（overflow:hidden・overscroll-behavior:none）。ゲームの枠 main は 100dvh（古いブラウザは 100vh）の縦並びで、スクロールは枠の中だけ：
  - #app（main の余白 16px を内側に持つ。下へ続く画面＝セーブなど）。既存の画面が描いた後に呼ぶ window.scrollTo(0,0) は、#app も一番上へ戻す（lobby の直前の小さな処理）。
  - 1画面の器（#app>.ds・.mk2・.p9tour・.p9vs・.p9farm（.fm 以外）・.rn）は枠いっぱいの高さに固定し、器の背景は動かさない。一覧 .dbody がある .ds は .dbody だけ、牧場（.rn）は選んだ機能の中身 .wpanel だけがスクロールする（高さ740px以下では牧場の背景が少し低くなってよい）。
  - 街：1画面で固定（#app:has(>.map.town) は overflow:hidden。スクロールしない）。案内文（#msg）とヴァルガスの一言は .tlow に入れ、知らせることがあるとき（lobby(msg)・モンスターがいないとき・闘技場を押したとき＝.tlow.on）だけ背景の上（下のバーのすぐ上）に重ねる。
  - 特訓ボードの「振った後も見ていた位置のまま」は gameScroller()（今スクロールしている所）で保つ。
  - 新しい画面を足すときは、枠（100dvh）に収めるか、器／一覧の中でスクロールさせる。ページ自体を伸ばさない（tests/qa-e2e-page-fixed.test.mjs：4サイズでページの高さ＝画面の高さ・スクロールしても背景が動かない・一覧だけが動く・タッチでも同じ）。
- 新しい画面・ボタンを足したら、tests/qa-static-guards.test.mjs（読み込むJSの一覧・旧名称・CLAUDE.md の数値）と tests/qa-e2e-tech*.test.mjs（タイマー・リスナー・DOM の増加、404、4サイズの横はみ出し）が通ることを確認する。

### 検索・調査のルール（開発負荷の監査で追加。base64 の巨大行で会話の文脈を埋めないため）

- index.html と legacy/index.original.html には、base64 画像の巨大な行がある（index.html は1883〜2129行目付近の7行に集中。1行最大約2.6MB。index.html 全体は約7.9MB（7,874,018バイト）で、そのうち base64 画像が176件・約7.5MB。2026-09-29 の Stage 3 で未使用の10件を削除した後の実測）。そのまま検索・表示すると数MBの出力になる（例：index.html を「hp」で rg すると約7.5MB）。
- （2026-10-19：index.html の base64 画像 175件は assets/inline/ のファイルへ出した＝index.html は約1MB で巨大な行は無い。上の行の行番号・大きさは外部化の前の記録。legacy/index.original.html には今も巨大な行がある）
- 通常の全文検索では legacy/ を対象にしない。リポジトリ直下の .ignore に `legacy/` を書いてあり、rg（Claude の Grep を含む）は自動で除外する。Git の追跡・GitHub Pages・テスト（sha256 照合）には影響しない。
- legacy/ が必要な調査では、パスを明示して対象にする（例：`rg -M 500 -n 語 legacy/index.original.html`。ディレクトリ全体を検索するなら `rg --no-ignore`）。
- index.html はゲーム本体なので検索対象から外さない。ただし rg／grep の結果に巨大な行をそのまま出さない：
  - rg は最大行長を制限する（例：`rg -M 500`。長すぎる行は `[Omitted long matching line]` と表示される）。grep を使うときは `| cut -c1-300` などで切る。
  - 画像・base64 の中身を見る必要がないときは、コードの部分だけを対象にする（行長の制限、または base64 の行を避けた行範囲の指定）。
  - index.html を Read するときは、行範囲（offset／limit）を指定し、base64 の行を含む範囲を丸ごと読まない。
- git diff／git log -p／git show で大きな変更を確認するときは、先に `--stat`／`--numstat` で規模を確かめる。画像や base64 の行を変えたコミットは diff が数MBになる（例：6ec343d は約9.5MB）ので、全文を表示しない（必要ならファイルを絞り、`| cut -c1-300` などで切る）。

### 保護対象（Phase 6）

- Phase 6 保護対象（変更禁止）：
  - 対象：fight()、battle-bridge.js、adapter.js、legacy、技ルーレット、.bt 系 CSS、Battle Engine、バトル技データ、素早さ分離処理
  - ハッシュ：fight() d46e27f6…、battle-bridge.js bff08e0f、adapter.js f99617ac、legacy 90eeba79
  - 照合は tests/phase7.test.mjs で行う。

## 6. 開発ルール

- 指示されていない実装はしない。
- 価格・報酬・イベント内容などを推測で変えない。
- 仕様は別チャット（技制作・モンスターデザイン・NPC/世界観・ボード設計）で決めて同期される。同期された仕様も、コードへの反映は対応するPhaseで行う。
- 決める必要がある箇所で作業を止めない。未決事項としてまとめて報告する。
- 進行不能・データ消失・セーブ破損は最優先で直す。
- 細かい見た目の改善より、最後まで遊べる状態を優先する。
- デザイン画像が届いたら、今のゲームとの違いを報告する。
- 旧仕様を勝手に復活させない。
- 新しい画像は assets/ にファイルとして置く（base64 で埋め込まない）。
- 正式画像の色を CSS の filter などで変えない。
- Phase 6 保護対象、セーブ version 6・キー mr4v6・checkpoint形式は変更しない。
- 新しいZIPや素材を受け取ったら、実ファイルを確認してから作業する。コミット番号だけで判断しない。古い版へ戻さない。
- 今後の実装はすべて Claude Code で行う（開発チャットでは実装しない）。
- 追加する画像は、ゲーム内の表示サイズに合わせて縮小・圧縮してから入れる（元画像はユーザーが別に保管する）。

## 7. main への反映ルール

- 反映前に main の最新を確認する（pull してから作業する）。
- 既存ファイルを勝手に消さない。
- index.html のホーム画面アイコン設定を消さない（引き継ぎZIPの index.html には含まれていないため、上書きするときは main 側の設定を残す）。
- `node --test tests/*.test.mjs` を実行し、1件でも失敗があれば反映しない（既知の失敗は現在なし）。
- 反映後、公開URLで動作を確認する（390×844 相当のスマートフォン表示を基準に）。main へ push したら、同じ作業の中で続けて `node tools/public-check.mjs` を実行し、結果（OK／NG・404やエラーの有無）を報告する。公開の反映（最大15分）を待ってから、通しの流れ・牧場・ファーム・育成開始の選択肢・4サイズの横はみ出しを確認する。NG が出たらすぐ直して再 push する。クラウド環境では `NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt` を付けて実行する。スクリーンショットはリポジトリの外に保存される。
- 引き継ぎZIPを初めて反映するとき：ZIPのコミット番号は GitHub の履歴と一致しないため、ファイルの中身で差分を確認する。main にだけあるファイル（アイコン・設定ファイルなど）は残す。

## 8. 詳しい仕様の目次

- 仕様は docs/spec/（主題ごと）と docs/history/（日付つきの便の記録）の両方にある。**同じ事柄は日付の新しい記述が優先**し、各節の「〇〇が優先」「以下は旧記録」の注記に従う。作業の前に主題の語で docs/ を検索する（例：`rg -n 語 docs/spec docs/history`）。
- 本文の「§3「〇〇」」「§5」などは旧 CLAUDE.md の節名。移設先は docs/README.md の対応表で引く。

| 作業 | 読むファイル |
|---|---|
| 新しいセッションの最初（現在地・判断待ち・戻し方） | docs/history/handoff.md の先頭 |
| モンスター・能力と色・成長適性・2.5D の絵・歩行・リアクション・未解禁の種族 | docs/spec/monsters.md |
| 盤の共通の規則（ターン・サイコロ・疲れ・旧 Chapter フィールド・立体サイコロ） | docs/spec/board.md |
| Chapter 1「はじまりの草原」 | docs/spec/chapter1.md |
| Chapter 2「潮風の海岸」 | docs/spec/chapter2.md（記録の目次）→ docs/history/・docs/proposals/ |
| Chapter 3「天空の浮島」 | docs/spec/chapter3.md |
| Chapter 4「灼熱の火山」 | docs/spec/chapter4.md |
| バトル・技・状態異常・固有スキル・技アニメ・比較画面・QA 試遊モード | docs/spec/battle.md |
| 大会（ランク・解放・総当たり・大会の画面・セドリック・LEGEND） | docs/spec/tournament.md |
| 特訓 | docs/spec/training.md |
| 経済・市場・売却・牧場の上限 | docs/spec/market.md |
| アイテム・空腹と食事・バッグ | docs/spec/items.md |
| NPC | docs/spec/npc.md |
| 街・ベースキャンプ（旧ファーム）・施設 | docs/spec/facilities.md |
| 音（BGM・SE・ボイス） | docs/spec/audio.md |
| UI（共通部品・会話窓・フォント・開始画面） | docs/spec/ui.md |
| プロローグ・序盤の導線 | docs/spec/opening.md |
| セーブの持ち物の形・v6 の任意項目 | docs/spec/save.md |
| ファイルの詳しい記録（旧 §2 の表） | docs/spec/files-detail.md |
| 日付つきの便・PHASE の記録 | docs/history/spec-2026-10-02_06.md・spec-2026-10-07_11.md・spec-2026-10-12.md・spec-2026-10-13_14.md・spec-2026-10-15_19.md |
| テスト件数の記録 | docs/history/test-log.md |
| Phase の経緯 | docs/history/phases.md |
| ブランチだけ・未承認・試作 | docs/proposals/ |
| 未決事項・将来仕様（推測で埋めない） | docs/open-issues.md |
| 旧 CLAUDE.md の節名 → 移設先・そのほかの docs | docs/README.md |
