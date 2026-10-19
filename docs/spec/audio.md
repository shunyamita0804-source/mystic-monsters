# 音（BGM・SE・ボイス）

旧 CLAUDE.md §3 から移した節（文はそのまま・節の順も元のまま）。同じ事柄は日付の新しい記述が優先し、各節の「〇〇が優先」「以下は旧記録」などの注記に従う。本文の「§3「〇〇」」は旧 CLAUDE.md の節名＝移設先は docs/README.md の対応表で引く。

## この主題にかかわるほかの記録

- docs/history/spec-2026-10-02_06.md「商用品質化・第1次（2026-10-02）」：BGM・SE の流れ
- docs/history/spec-2026-10-02_06.md「PHASE B（2026-10-05）」：開始画面は無音・プロローグ BGM v6・管理局の BGM
- docs/history/spec-2026-10-02_06.md「実機試遊の修正＋リュウ／レグナス（2026-10-05 夜）」：Chapter の BGM の途切れ・帯の SE
- docs/history/spec-2026-10-07_11.md「実機試遊・軽微 UI／遷移修正便（2026-10-07 夜）」：プロローグの曲のクロスフェード
- docs/history/spec-2026-10-07_11.md「深層監査の修正・第1便（2026-10-08）」：プロローグの尺
- docs/history/spec-2026-10-07_11.md「正式素材の統合・次便（2026-10-08）」：街の BGM
- docs/history/spec-2026-10-07_11.md「深層監査の修正・第2便（2026-10-08）」：ジングル・プロローグ Scene 5
- docs/history/spec-2026-10-12.md「新マス12種・食事のマス・正式 SE・特訓チケット・ノビトン（2026-10-12 夜・2）」：正式 SE 3種
- docs/history/spec-2026-10-13_14.md「開発25：大会UI・正式サイコロ・施設のボイス・Chapter 1 の題字（2026-10-13）」：施設のボイス
- docs/history/spec-2026-10-13_14.md「開発24：バトル画面・観客の声・NPC のボイス（2026-10-13）」：観客の声・NPC のボイス
- docs/history/spec-2026-10-13_14.md「開発28：PHASE A（2026-10-13）」：開始画面の BGM・決着の曲・観客の声
- docs/history/spec-2026-10-13_14.md「開発29（2026-10-14）」：観客の声の音量
- docs/history/spec-2026-10-13_14.md「実機試遊47項目（2026-10-14）」：サイコロの音・固有スキルの SE・音量の監査
- docs/history/spec-2026-10-15_19.md「夜間 GO（2026-10-18〜19）」：LOSE の曲・悲しい声・サイコロの SE
- docs/history/spec-2026-10-15_19.md「2026-10-18 REV3」：声の再設計・発火台帳
- docs/history/spec-2026-10-15_19.md「2026-10-17 統合便 v2」：NPC の有料ボイス 60本・鳴き声 14本
- AUDIO_CREDITS.md：音源の作者・ライセンス

---

### 正式音源とプロローグの固定同期（2026-10-05 夜。いまの正式）

- **2026-10-05 PHASE B で変更（下の記述より優先）**：開始画面の BGM は廃止（TITLE は silent・旧タイトル曲のファイルは削除）。PROLOGUE は正式 v6（38.714秒）に差し替え＝時刻は Scene 2＝5.559・Scene 3＝15.161・Scene 4＝26.673・本文の終わり 36.276秒（下の 54.2秒・7.782／21.226／37.342 は旧記録）。聖獣士管理局は正式 BGM（BUREAU）。§3「PHASE B」

- **BGM（js/audio/audio-registry.js）**：TITLE＝assets/audio/bgm/mystic_monsters_official/mystic_monsters_title_theme_official.ogg（38.919秒・gain 0.56・ループ。旧 PGS Event Music 1 を置き換え）。PROLOGUE＝同じフォルダの mystic_monsters_prologue_bgm_official.ogg（54.2秒・gain 0.56・**loop:false**・プロローグ専用）。開始の決定音 TITLE_START は従来の title_start.ogg のまま。ファイルは ZIP の OGG を無加工（WAV は置かない）。作者表記＝Mystic Monsters official（ユーザー提供のゲーム所有素材。AUDIO_CREDITS.md）。
- **プロローグの固定同期（js/prologue/prologue.js・index.html の proPlay／proBgmStart）**：開始画面 → タイトル曲を自然にフェードアウト → 背景を読み込む（最大6秒。この間は BGM を鳴らさない）→ Scene 1 の背景が出る瞬間に PROLOGUE を頭から鳴らす（MMAUDIO.bgmTime で実際に鳴り始めた位置を時計の起点にする）→ Scene 2＝7.782秒・Scene 3＝21.226秒・Scene 4＝37.342秒・最後の文＝約50.786秒（MMPRO.schedule()／sceneStarts()）→ 終わり（52.186秒）→ フェード → 聖獣士の導線。**タップでは進まない（全文表示・次へ・「タップで先へ」のヒントは廃止）。操作はスキップ（2度押し・3秒で取り消し）だけ**。見た記録は最後まで見た／スキップ確定のときだけ（従来どおり）。
- **裏に回ったとき**：プロローグの時計は visibilitychange で止まり、戻ると続きから。BGM は Audio Manager の既存の onVisibility（止める・戻す）だけ（重複の仕組みは作らない）。戻ったあと、映像の時計と BGM の位置が 0.15秒以上ずれていれば MMAUDIO.seekBgm で BGM を合わせる。終わった非ループの曲は戻っても鳴らし直さない。
- **正式 SE 15種（assets/audio/se/mystic_monsters_official/01〜15。音量は registry の gain だけ）**：サイコロ＝DICE_THROW（1回の出目で1回。LAND・ROLL・STOP は silent のまま＝4重にしない）、能力UPの道具が現れる＝TRAINING_ITEM_SPAWN（field-view の trainAct・MMFEEL train.item）、能力UP＝TRAINING_SUCCESS（MMFEEL stat.up。旧 STAT_UP と二重にしない）、市場の購入成立＝MARKET_PURCHASE（index.html の adopt の保存のあと。失敗では鳴らない）、Chapter 開始でモンスターが歩いて入る＝MONSTER_ENTRY（field-view の monEnter・1回）、遭遇＝野生 WILD_ALERT・レア RARE_ALERT・ライバル RIVAL_APPEAR（別々の音）、宝箱＝normal TREASURE_TIER_1・rare TIER_2・special TIER_3（1段階1音。TIER_4 は登録のみ・未接続＝第4段階の宝箱は無い）、休む／休むマス＝REST_RECOVER（休むマスでは EVENT_TRIGGER を鳴らさない）、イベントマスの出来事が始まる＝EVENT_TRIGGER、分かれ道で道を選ぶ＝BRANCH_SELECT。足音 STEP（1マスごと）は silent のまま（4歩の音は1マスごとに使わない）。旧ボード・特訓のサイコロ（sfx(7)）も DICE_THROW を1回。

### BGM 正式採用・セドリックの会場・UI 再回収（2026-10-07 夜。いまの正式。基準 d77e8b0 への差分）

- **BGM 14用途**（js/audio/audio-registry.js の LIC＝assets/audio/bgm/licensed_20261007/。ユーザー提供の MP3 13曲・WAV 1曲を OGG Vorbis q5 に変換＝ユーザー指示 2026-10-07。曲の切り出しはしない）：プロローグ＝Scene ごとに1曲（PROLOGUE_1〜6・各曲の頭から・loop なし。js/prologue/prologue.js の opts.onScene → index.html の proPlay が MMAUDIO.scene('PROLOGUE_N', { fade:'quick' })。時刻表・本文・スキップは従来どおり。旧1曲の PROLOGUE は silent のまま）／セドリックの大会前の導入＝CEDRIC（p9TourOpen の bgm("cedric")。会話のあと対戦表の曲へ）／大会1 対戦表＝TOURNAMENT_LOBBY_LOW（HIGH は fallback）＝17秒から（MMAUDIO の新しい start＝メディアフラグメント #t=17・ループも 17〜135.2秒）／大会2 対戦前比較＝TOURNAMENT_MATCHUP の短いジングル（loop なし。p9CompareScr を bgm("matchup") に）／ライバル戦 RIVAL_BATTLE／野生 WILD_BATTLE／レア RARE_WILD_BATTLE（専用曲）／公式ランク戦 TOURNAMENT_BATTLE_LOW（HIGH・SPECIAL_BATTLE は fallback）／闘技場 ARENA（**闘技場の画面は未実装＝登録だけ・どこからも鳴らさない**）。受付と大会の結果は従来の Royal Castle。置き換えた旧い戦闘曲4つ（PGS Battle Music 1／2・alkakrab Battle of the Skies／Clash of Arcane Titans）はファイルを外した（AUDIO_CREDITS.md に記録）。不採用：「いざ出発！」「冒険への誘い」。音量は gain（BGM 約 -18 LUFS・セドリックの会話の場面 約 -20 LUFS）。iOS の復帰・ミュート・音量の処理は変えていない。
- **セドリックの会話の背景**：大会前の導入・大会後の締めとも、そのランクの会場（MMARENA.arenaSrc＝assets/battle/arena/arena_E〜S。index.html の cedricBg）。会話の窓・構造は共通。対戦表・比較画面にセドリックは出さない（従来どおり）。
- **UI 再回収**：技一覧の未習得＝正式の未習得パネル（assets/ui/skill/）。研究所（図鑑・合体・配合表）・聖獣士管理局（聖獣士証・功績一覧・世界地図）のコマンドを大きく・少し上へ、牧場のコマンドを下から離す、市場の会話欄を高く（下から 34px）。PART0 のコマンド画像・市場の矢印と会話欄は前回取り込んだものと同一（sha256 一致）＝差し替えなし。冒険のメニュー（☰）と最終確認は前回の簡素化のまま。
- **やらなかったこと・残り**：ルーレットの巡航速度（引き継ぎ書どおり変えない）、闘技場の画面（未実装＝ARENA の曲は登録だけ）、VS の「正式勝負絵」（受け取った素材に無い＝待機立ち絵のまま）、牧場の「黄色い菱形」（コマンドの菱形は前回外した。施設名ラベル B-01 の絵の中の飾りは画像の一部）、旧正式 UI の ZIP 6つ（seijuushi_ui・095601・talk_ui・basecamp_UI・market_ui・大会UI 102319）は今回も無い。

### 公式ランク戦の BGM（2026-10-12。基準 90b0e1f への差分）

- **TOURNAMENT_BATTLE_LOW（E〜S の公式ランク戦の実戦の間だけ。HIGH は fallback で同じ曲）**＝ユーザー納品「公式ランク.mp3」（291.32秒）を OGG Vorbis q5 に変換しただけの assets/audio/bgm/licensed_20261012/official_rank_battle.ogg（-17.0 LUFS・gain 0.89・頭の無音なし・289.8秒から終わりのフェード＝loopEnd 289.6・頭へ 0.6秒のクロスフェード）。原本 MP3 は置かない（sha256 は AUDIO_CREDITS.md）。**曲名・作曲者・ライセンスは要確認**（納品物に記載なし）
- 変えていない：対戦表（TOURNAMENT_LOBBY_LOW／HIGH）・対戦前比較（TOURNAMENT_MATCHUP）・セドリック（CEDRIC）・結果（RESULT）・野生・レア・ライバル。**SPECIAL_BATTLE（入口なし）は旧「戦いの旅路を征く」を直接指す**（差し替えに巻き込まない。旧ファイルは残す）
- テスト：AUDIO-37・GF-03・実ブラウザ tests/qa-e2e-bgm-1012.test.mjs（BG-B1＝E の5試合：対戦表 → 実戦 → 対戦表 → … → 結果で常に1本、BG-B2＝S）

### NPC のボイス全停止（2026-10-15 N04。**2026-10-17 に解除＝下の「統合便 v2」が優先**。ユーザー指示＝無料で作った NPC の声は商用不可の認識・週末に有料プランで作り直す）

> 移設の注記：この節の見出しの「統合便 v2」（2026-10-17 統合便 v2）は docs/history/spec-2026-10-15_19.md にある。

- **ゲームで NPC の声は一切鳴らさない**：js/audio/audio-manager.js の `VOICE_BLOCKED = true`（MMAUDIO.voice・voiceLoad・voicePrefetch は何もしない・voice() の結果は 'blocked'・設定がオンでも無音・voiceGain 0）。会話・字幕・合図（js/npc/voice-cues.js の CUES・LINE_VOICE・MMVOICE の呼び出し）と時刻・並びは従来どおり＝声を待たない
- **声のファイル 27種（54ファイル＝assets/audio/voice/npc_1013/ の OGG・M4A）はリポジトリから削除**＝GitHub Pages で配信されない（公開 URL は 404）。git の履歴（72fbfbc〜2f0c748）には残る＝履歴の書き換え・強制 push はしていない（ユーザーの判断待ち）。CDN（max-age=600）と端末のキャッシュは時間で消える
- VOICE_REGISTRY（js/audio/audio-registry.js）は 26 の ID・話者・台詞だけ残し src は空＝週末の差し替えの受け皿。差し替え台帳＝docs/voice-replacement-ledger.md（ID・場面・削除したファイルの sha256・手順）。新しい声は**ライセンスと納品日を確認してから別の作業で**有効化する（VOICE_BLOCKED を false・src を新しいフォルダへ・tests/voice-stop-1015.test.mjs を更新）
- 設定画面の「ボイス」は「準備中（新しい声の収録待ち）」。BGM・サイコロ・バトルの SE・固有スキルの SE（Mixkit）・観客の声は変えていない
- テスト：tests/voice-stop-1015.test.mjs（VS-01〜05）・声のテスト（dev24・voice15・dev25・dev27）を「頼むが鳴らない」に書き直し・tools/public-check.mjs に旧い声の URL の 404

### 開発25 追加便：NPC のボイス 12本・BGM の候補 3曲（2026-10-13。いまの正式＝PR #24 で main に統合・公開済み（72fbfbc・2026-10-13-voice15）。基準 a681c37 への差分）

- 素材：ZIP「全NPCボイス15本_BGM3本」（voice 15・bgm 3。sha256 は納品の一覧と全部一致）。MP3 → OGG Vorbis q4／AAC 128k（ボイス）・OGG q5（BGM）に変換しただけ（元の MP3 は置かない）。AUDIO_CREDITS.md の「開発25 追加便」
- **フィナ「こんにちは」**：registry の fina_hello の参照先だけ新しい音（fina_hello_new・gain 0.88）へ。場面（序盤の声かけ・旧フィナの紹介）は変えない。ほかのフィナ7種は不変。旧 fina_hello.ogg／m4a はファイルだけ残す（AUDIO-15 の KEEP）
- **既存の場面に1回ずつ**（js/npc/voice-cues.js の CUES・LINE_VOICE）：セドリック「さあ！いよいよ開幕です！」＝公式大会の開幕の会話の1行目（CEDRIC_EV.open・BGM CEDRIC のまま・対戦表は顔なしのまま）／セルジュ「ようこそ」＝聖獣士登録の受付の1行目（OPEN_TALK.serge）と聖獣士管理局の再訪の入口（facVoice("bureau")・登録の前＝S.playerNamePending の間は鳴らさない）／ゲンシン「うむ」＝特訓のゴール（trScr の done・0.35秒あと）／ヴァルガス「うむ」＝闘技場（ロック中）でランクを認める一言（a_rank）のときだけ・30秒は繰り返さない／リュウ「よっ！」＝道中のライバルの遭遇でリュウの姿が出た瞬間（world-board の rivalCut・field-view の encounterShow）／リュウ「やるじゃん」「へへっ」＝ライバル戦の決着（fight() が呼ぶ ban の WIN!／LOSE を読むだけ・BATTLE_DRESS のラベルがライバル戦のときだけ・0.55秒あと）。fight()・Phase 6・勝敗の判定は変えていない
- **登録のみ**（enabled:false・CUES の on:false＝読み込みもしない）：レオナ2種・ラグナス（人）2種＝三伝説の再会・対戦の場面が未実装。**アストラッド**：新しい「待っていた」（astrad_greet）・「全力でこい！」（astrad_prebattle）は 2026-10-13 開発26 で受領済み＝登録のみ（enabled:false・場面なし）。旧音源の2本（「来たか」「お前の力、見せてみろ！」）は使用禁止＝取り込まない。エリオット「やあ」は開発24 の elliot_hello_OPTIONAL と同じ元音源＝二重に登録しない
- **BGM の候補**（assets/audio/bgm/candidates_1013/・registry の BGM_CANDIDATES＝MMAUDIO に登録しない＝どの場面からも鳴らない）：Top画面・闘技場・レジェンド戦。TITLE の無音・ARENA・公式戦／野生／レア／ライバルの曲は変えていない。試聴は prototype/audio_candidates_1013/（本編からつながない）。採用する場所と鳴らし始めはユーザーの判断待ち
- MM_BUILD／version.json＝2026-10-13-voice15
- テスト：tests/voice15-1013.test.mjs（VC-01〜05）・実ブラウザ tests/qa-e2e-voice15-1013.test.mjs（VB-1＝3サイズ・VB-2〜6）。DV-01／05・AUDIO-15・PH-05・VAR-4 を書き直し（声の一覧・管理局の入口・候補の曲・音声のファイル名・ヴァルガスの一言の後ろに声）
