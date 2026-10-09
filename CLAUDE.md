# CLAUDE.md — ミスティックモンスターズ 開発の引き継ぎ書

Claude Code は作業の前に毎回このファイルを読むこと。ここに書かれていないこと・確信がないことは推測で決めず、「未決」または「要確認」として報告する。

## 1. ゲーム概要

- 正式名称：ミスティックモンスターズ（英字：Mystic Monsters、ロゴ表記：MYSTIC MONSTERS）
- 略称：ミスモン
- 旧名「モンスターマスター」「ミスティックモンスター」は使わない。
- **世界設定（2026-10-03 正式）**：人と共に生きる不思議な生命＝「聖獣」。聖獣を育て共に戦い大会へ挑む者の正式名称＝「聖獣士」（ユーザー向けの文では旧「ブリーダー」より優先。内部の変数名は変えない）。聖獣士の登録・管理・支援を行う公的機関＝聖獣士管理局。**年代（2026-10-05 正式・いまのプロローグ）**：約百年前に異常な聖獣が現れた（異変）。十年前、ミストリアの三人の聖獣士（三人のレジェンド＝アストラッド＋ゼルヴァーン・レオナ＋グリフェル・ラグナス＋ドラグノル（2026-10-07 正式。旧名「バルド」は使わない））が脅威を退けた。三人はいまも存命（死亡・失踪・引退の設定は無い）。闘技場に記念画・終盤に挑戦できる設計。※旧記録の「五年前の第二次魔物災害」「約百年前の第一次大災厄と英雄」は旧プロローグ A〜E の設定で、いまは使わない。舞台＝アステリア地方の大都市ミストリア。
- 王道JRPG風のモンスター育成ゲーム。HTML/CSS/JavaScript（ビルドなし）で、GitHub Pages で公開・試遊している。
- 主な確認環境：スマートフォン縦画面（390×844）。iPhone で試遊している。
- 公開URL：https://shunyamita0804-source.github.io/mystic-monsters/（確認済み）
- ゲームの流れ（2026-10-05 正式）：開始画面（タイトル曲）→ プロローグ（固定尺の自動再生＋スキップ）→ ミストリアでフィナに声をかけられる → 聖獣士管理局 → セルジュの聖獣士登録（名前）→ 世界地図（出身地）→ 街でリュウの初対面（2026-10-07）→ 街（市場を案内）→ 市場でモンスターを購入 → ファームで育成（Chapter 1〜4 のボード・大会・特訓）→ 育成完了 → 牧場（預ける・受け取る・様子を見る・売却）

## 2. ファイル構成

| ファイル | 役割 |
|---|---|
| index.html | 画面・CSS・ゲーム本体（旧Artifact版から続く部分を含む）。旧来の画像が base64 で多数埋め込まれ、非常に長い行がある。grep の出力やエディタでの扱いに注意 |
| js/battle-bridge.js、js/integration/adapter.js、js/systems/ | バトルエンジン（Phase 6 保護対象） |
| legacy/index.original.html | 旧版の原本（保護対象・変更禁止） |
| js/phase7/progression.js | 育成の共通処理（特訓・アイテム・ランク記録など）。`MMP7` |
| js/phase8/league.js | 大会の総当たりリーグ。`MMP8L` |
| js/phase8/raising.js | 育成進行・Chapter・大会・セーブv6・育成完了回数・最終ルートの代替処理。`MMP8` |
| js/phase9/chapters.js、js/phase9/board-art.js | Chapter 1〜4 の正式マップ（ノード・分岐・マス）と描画。`MMP9C` |
| js/phase10/monsters.js | 正式モンスターデータ（成長適性 A〜E と上昇量の表 GROWTH_GAIN を含む）・市場・購入救済・売却。`MMP10M` |
| js/phase11/player.js | プレイヤー名。`MMP11P` |
| js/phase12/scenes.js、js/phase12/dice.js | 背景・サイコロ演出 |
| js/phase13/field.js | 旧 Chapter 1 のフィールド表示（試作。Chapter 1 は js/chapter/ が担当するため、今は表示されない） |
| js/chapter/engine.js | Chapterフィールドの共通エンジン `MMCH`（**2026-10-08：1本の道（同じノードID）を複数の背景にまたがせられる＝path.key（区間の名前）・path.idOffset（最初のノードの番号）。next は区間の key。従来の config は変わらない**。config の登録・ノードの組み立て・配置の生成と検証・疲れ・能力マス・イベント・宝箱・バトル）。MMP8.registerChapterDriver で raising.js へつなぐ。Chapter ごとの分岐（if chapter===N）は書かない |
| js/chapter/configs/ch1a.js | Chapter 1「はじまりの草原」Pattern A の config（データだけ）。**2026-10-08（正式ボード）：完成背景14枚（assets/fields/ch1a/formal_1008/）を SCENES（背景ごとの道路中央ライン road・マスの列 rows・enter／playable／handoff・視線誘導 cue・camera）、ゲームの中身は PIECES（どのマスをどの背景のどこに置くか。84マス・ノードID・種類・つながり・分岐は 2026-10-06 のまま＝tests/board-1008.test.mjs の BD-01 で監視）。1回の旅で 01→14 を全部通る（森／大橋は 07・08 の左右の道）。§3「Chapter 1 Pattern A 正式ボード」。以下は従来の記録：****2026-10-06（次期総合改修・2）：小型の立体マス（tileUI.discs＝assets/fields/ch1a/tiles_v2/）・分岐3か所（A＝03 の中の左右 p3l_／p3r_→合流 p3m_、C＝05 の分かれ道 森／大橋、B＝11 の中の左右 p11l_／p11r_→合流 p11m_）・公式マス84・1回の旅64歩・45ターン（rules.turnLimit 45）・能力マスの上昇量 rules.growthGain＝A5 B4 C3 D2 E2（§3「次期総合改修・2」）。BACKGROUNDS は seq（マスの種類）と span（手前・奥の y）で書き、座標は道の中央線から作る。以下は従来の記録：****2026-10-04（第二段階）：正式仕様の 30ターン（rules.turnLimit 30）＝効果の無い通常マス6つを外して公式マス 54（通常13・能力18・野生6・イベント6・宝4・休む3・ライバル1・分岐／合流2・ゴール1。森 46歩・大橋 46歩）。10,000回のシミュレーション（`node tests/chapter-turns.mjs 10000`）：30ターン以内の到達 森 99.8%／大橋 99.3%（休む方針 cautious）・平均 24.4／24.9 ターン。eventPool に短いランダムイベント 14 種（フィナの会話 lines＋小さな効果。**2026-10-04 追加アセット：そのうち 12 種に正式の挿絵（image・title）と正式の会話・効果。2択は old_grounds（少し鍛える＝ちから+5・疲れ+5／動きを確かめる＝命中+5）と sudden_rain（雨宿り＝疲れ−10／このまま進む＝丈夫さ+5・疲れ+5）。small_shrine は2択をやめて疲れ−10。到達率（10,000回）森 99.7%／大橋 99.3%**）、story にチュートリアル 8 件（scope 'save'＝このセーブで1回）。battleTypes.rival＝リュウ。**以下は従来の記録：**2026-10-02 の60マス再設計：正式背景14枚（final/field/ch1_bg_01〜14）を 共通 01〜05 → 05 の最後のマス＝分かれ道 p5_3 → 森の道 06〜07／大橋の道 08〜09 → 10 の最初のマス＝合流 p10_0 → 終盤 11〜14（ライバル p14_0＝強制停止・ゴール p14_2＝大会会場の門前）。BACKGROUNDS＝背景ごとの route・image・表示名【暫定】・地形・道の中央線 road [y, x, 半幅]（目視）・nodes＝[x, y, マスの種類, {s,f}?]（背景ごとに個数が違う。公式マス60＋スタート）。ノードID は p1_〜p14_（旧 w1_〜w14_ の途中セーブは開始地点から）。layoutRules.fixed＝マスの種類は config のとおり（seed で決めるのは中身だけ）・expect＝内訳の検査。マスUI＝tileUI（正式素材＋共通の台座 pedestal・遠近の大きさ／潰れ size・分かれ道の左右の門 gates）。背景の切り替え＝backgroundTransition crossfade。ゴールのあとは arrival（ch1_bg_15_event・フィナの会話 → 大会受付）。1〜3・40ターン・カメラ near 1.45／far 2.15（anchorY 0.72）・操作欄 deck（START だけ）・歩行アニメ monsterSprites（4原種）。新しい Chapter／パターンは configs/ にファイルを足して MMCH.registerConfig する |
| js/chapter/events.js | **Chapter のイベント基盤 `MMEVT`（2026-10-04 第二段階）**：イベントのデータ形式（EVENT_FIELDS）と検査（validatePool）、直列のイベントキュー run(fn)（フィナの会話・能力の演出・遭遇・画面の切り替えが重ならない）、2択の会話の行（choiceLines）、自動テストの自動選択（autoChoice。MM_QA_NO_STORY のとき最初の候補・MM_QA_CHOICE で指定）。イベントそのものはデータ（config.eventPool＝止まったマスのランダムイベント、config.story＝節目・条件・チュートリアル、MMNPCE＝施設）。engine：同じ Chapter で同じイベントを重複して割り当てない（pickDistinct）、2択は resolve が `{ kind:'choice', options }` を返し（使った印を付けない・stage は resolve のまま＝再読み込みでも同じ選択肢）、MMP8.resolveChoice → MMCH.resolveChoice で選んだ効果を1回。story の scope 'save'（記録は S.npcFlags.story）、trigger 'branch'、条件 kind／hasEvent／recovery／goal |
| js/npc/npc-events.js | **施設の NPC イベント `MMNPCE`（2026-10-04 第二段階）**：初回訪問の会話 FIRST（市場＝フィナ ↔ カレン、牧場＝ニック、研究所＝エリオット、闘技場＝ヴァルガス、ファーム＝ダン。ユーザー指定の台本を口調に合わせて整えた）、再訪の一言 REVISIT（進行状態 ctx＝hasMon・box・full・gold・raiseDone・rank・fatigue・tickets・items・state・canDepart・gateBlocked・canFuse。条件の一言が優先、ふつうの一言は chance（市場 0.6）、直前と同じ id は避ける）、帰還イベント RETURN（Chapter 1〜4 で違う文面＋結果の1行＋次の Chapter があれば噂 1回）。index.html 側＝npcFirst（S.npcFlags.first）・npcLine／karenRevisit（直前の id はページの中の NPC_LAST。セーブには入れない）・farmReturn（m.raise.evSeen）。自動テストは MM_QA_NO_NPC（harness の open({ npc:true }) で出す） |
| js/phase8/rival.js | **ライバル「リュウ」`MMRIVAL`（2026-10-04）**：正式名リュウ・相棒は未確定（partner null）。強さ＝今の個体の6能力の平均 × factor（＋bias）に最も近いランク（fight() の表 E 70〜S 300）を Chapter ごとの floor／ceil で挟む（CONFIG の1か所）。bBattleGo はライバルのマスだけ MMRIVAL.rankFor(m) を fight() に渡す。fight()（Phase 6）は相手の能力・名前をランクから作るため、6段階に丸められ、バトル中の相手の名前は従来のまま（未決・報告） |
| js/chapter/configs/ch2a.js | Chapter 2「潮風の海岸」Pattern A の config（2026-10-01 夜から正式背景：field/ch2_field_01〜09 → arena/ch2_arena_approach の10枚を この順に1回ずつ通る1本道。海上 01〜05 → 海中 06〜08 → 海上 09 → 会場前。背景ごとに目視で読んだ道の中央線と半幅 [y, x, 半幅]（BG）の上に NODES（5〜9【暫定】）のマス。サイコロ 1〜3。06〜07 で左右の分岐（A 68歩・B 70歩 → 合流 m7_0。branches・paths[].branch）。カメラは約10%寄せる。強敵 s4_4（海上の大橋）・ライバル sa_2（強制停止）・ゴール sa_4。俯瞰図は intro/ch2_intro_overview_v2.webp（演出専用。config.intro.via で海上・海中を経由）。目印・サイコロ・操作欄は ch1a の素材を共用。旧 road/ 10枚・旧俯瞰図はファイルだけ残す） |
| assets/fields/ch2a/ | Chapter 2 の素材：正式（2026-10-01 夜）＝field/ch2_field_01〜09.webp・arena/ch2_arena_approach.webp（864×1536・WebP 品質86）と intro/ch2_intro_overview_v2.webp（導入演出専用）。旧構成の road/ 10枚・intro/ch2_intro_overview.webp は参照しない。README.md に順・表示名・元ファイル |
| js/chapter/dice-renderer.js | サイコロ `MMCHD`（**2026-10-04 G5：面は最初に全部置いてデコードし、表示だけで切り替える（src を差し替えない）。出目の面は止まる約0.28秒前に見せ、止まったあとは何も変えない。止まった姿は約1秒（resultMs 720）。§3 の「実機試遊の改善」**。**2026-10-03 夜（実機で「止まったあとも面が変わる」）＝状態を ROLL → LAND → BOUNCE → SETTLE → LOCK に分け（.chdz の data-phase）、コマ・面の切り替えは setTimeout ではなく動きの時刻（Web Animations の currentTime・rAF）で進める。最後の約0.3秒は出目の面に固定したまま滑り、動きが完全に終わった時点で LOCK。LOCK のあとは絵・向き・面・出目を一切変えない（止まった絵をそのまま出目の面＝chdz-stop on locked。差し替え・弾みなし）**。**2026-10-03（試遊で「軽すぎる」）＝物理的な見せ方 physical**：config.dice.throwFrames（既存の正式10コマ assets/dice/std/01〜10。描き直していない）があれば、START の手ごたえ（field-view の pressKick：沈む → 小さく戻る、約0.2秒）→ 投げる（01〜07・弧を描いて着地点へ）→ 着地の衝撃（08・09。dice.land）→ 小さく跳ねる（10）→ 停止面（dice_stop_N）で短く転がって減速（最後の約0.3秒は出目の面のまま滑る・傾きは 0° へ）→ **完全に止まった絵が描かれたフレームで dice.stop**（停止の音の差し込み口 DICE_STOP。今は無音）→ 出目（dice.result）→ 約0.52秒 → 消える → 移動。出現〜完全停止 約1.66秒（C.ms＝airMs 560＋impactMs 200＋bounceMs 260＋rollMs 640）・全体 約2.4秒。10コマの先読みが終わっていないとき・視差を減らす設定では従来の見せ方（legacyMs 980）。以下は従来の記録：出目 rollDice と演出 play を分ける。回転中の面（2026-10-01 夜）：停止画像 dice_stop_1〜6 を回転に合わせて切り替え（spinFaces。先読みが終わった面だけ）、着地の少し前から出目の面に落ち着く＝無地の宝石に見せない。2026-10-01 正式＝1タップ：`play(v)` は START の位置から出現 → 飛び上がって速く回る → 落ちながら減速 → 着地・小さく跳ねる（ms 980）→ 最後の約0.18秒で正式の角度（0°）へ収束 → 停止面（resultMs 420）→ 消える、まで自動（合計約1.7秒。実測は `lastTiming()`）。旧 `manualStop:true`（STOP で止める）は API だけ残し、通常の Chapter では使わない。停止画像は resultSprites に登録するだけ） |
| js/chapter/intro.js | Chapter開始の演出 `MMCHI`（**2026-10-06：スキップ不可（タップで飛ばさない）**。2026-10-03：画面が出てすぐズームしない＝全景を止めて 0.7秒 →「Chapter 1」0.45秒 →「はじまりの草原」0.4秒 → 出そろった瞬間に開始の音（opts.onTitle → field-view が chapter.start＝CHAPTER_START。飛ばしたときは最後に1回）→ 読める間と余韻 1.35秒 → タイトルが消える 0.35秒 → 開始地点へズーム 1.25秒 → 操作できる（全体 約4.7秒）。以下は従来の記録：旅路全体の俯瞰図 → Chapter 名 → スタート地点へズーム／パン → 実プレイ画面へクロスフェード。config.intro。「育成個体 × Chapter の初回」に1回＝判定は field-view が `m.raise.field.introSeen`（その Chapter の配置と一緒に作られ・消える）で行う（2026-10-01。MMCHI.shown／mark は演出モジュール内の記憶で、判定には使わない）・タップで短縮・自動テストは MM_QA_NO_INTRO） |
| js/chapter/field-view.js | Chapterフィールドの画面（`MMCHV`・chf*。**2026-10-08（正式ボード）：マスは全背景共通の大きさ（tileUI.fixedSize の token・CSS の --inv でカメラの拡大を打ち消す .chf-tile.fx）、背景の受け渡し＝handoff まで道路中央ラインに沿って歩く → 次の背景のデコードを待つ → クロスフェード → enter から入口のマスへ（matchCut＝前の背景と同じ画面の位置・大きさから始めて戻す）、視線誘導 cueStart／cueEnd、分かれ道 A・B はモンスターを選択シートより上に（camLoose）、開発用の表示（?chdebug=1：道路中央ライン・道の端・範囲・マスの ID と番号・今の背景・カメラの注視点）**。2026-10-02 の60マス再設計：背景の切り替えは config.backgroundTransition.type 'crossfade' なら歩き続けたまま前の背景を透明にして次の背景へ溶かす（crossField。暗転なし。Chapter 2 は従来の暗転）、マスUIは共通の台座（tileBox＝奥ほど小さく平たい楕円・通常マスは台座だけ）、道の先が別の背景へ続く分かれ道では左右の門（branchGates）と選択シート（モンスターはシートの上に見える）、選んだ道の最初のマスまで歩いてから停止処理（chfContinue(true)）。2026-10-02：ゴールで config.arrival があれば chfArrive＝到着イベント専用の背景へクロスフェード（HUD・操作欄・マスの UI を消す）→ フィナの会話（{name}＝プレイヤー名。この個体のこの Chapter で1回＝m.raise.field.arrivalSeen。自動テストは MM_QA_NO_ARRIVAL）→ 大会受付（index.html の p9ReceptionHtml）。2026-10-01：操作欄は config.deck の画像（START だけ。STOP は廃止）、1タップの流れ chfRoll（START → 出目を保存 → サイコロ出現・自動停止 → 移動 → START）、サイコロは START を押すまで出さない、モンスターの x は道の安全域に収める（roadX → MMCH.clampToRoad）、フィナの吹き出し .chf-fina。層分け・視差・rAF のカメラ追従・道の曲線に沿った歩き・止まる位置と目印の分離・停止の演出・背景の切り替え・HUD・下の操作欄＝中央 STOP＋左右の弧。歩行アニメの差し込み口 registerMonsterAnimator） |
| js/chapter/reactions.js | **冒険リアクションイベント `MMREACT`（2026-10-07）**：共通モーション15種（MOTIONS）＋データ100件（EVENTS＝ソラモ・ガウル・ノビトン・ジオル・レグナス 各20）。モンスターは喋らない → フィナが解釈 → 選択肢 → 小さな結果（疲れ −5〜+1・能力 +1・薬草（1 Chapter に1回）・演出だけ）。通常マスに止まったとき確率 0.4・同じ Chapter で重複なし・2ターン続けない。記録は m.raise.field.rx／rxTurn／rxItem（配置と一緒に消える）。field-view の reactionAt が表示。自動テストは MM_QA_NO_STORY で出さない |
| js/battle/fx.js | **バトル共通演出の正式素材 `MMBFX`（2026-10-03）**：fight()・Battle Engine・battle-bridge・adapter・.bt 系 CSS（Phase 6）は変えず、バトル画面の既存の表示を外から見て正式素材を短く重ねる（視覚レイヤー）。ダメージ表示（pop の span.dmg を #f0／#f1 で）＝通常ヒット #6・クリティカル（.crt）#7・ミス／回避（.ms）#9、能力アップ／ダウン（index.html の efBurst＝fight() の外の補助関数に1行 `MMBFX.stat(w,e.lv)`。lv ±1〜3＝lvOf の小・中・大）＝#15〜#17／#18〜#20、決着の帯（#ban の WIN!／LOSE。降参も LOSE）＝勝利 #28・敗北 #29。重ね方：モンスターの効果の層の先頭（z7。ダメージの数字 z9・技の演出 z8 より下）、決着は #bt の中で帯（z12）の後ろ（z11）。同じ場所の前の演出は消してから出し、時間が来たら必ず消す（0.46〜1.8秒）。素材 assets/battle/common/（README.md に #1〜#30 の対応表） |
| js/battle/rival-partner.js | **ライバルの相棒レグナスのバトル `MMRP`（2026-10-05 夜・2）**：正式技10個（SK・EFF・SKART の空いた番号 20〜29 に実行時に追加＝定義の行は変えない）・ライバル戦の相手の差し替え（bBattleGo が arm()＝fight() が相手を作った直後の最初の乱数で名前・絵 IMG[4]・技＝初期の4技。強さはランクの値のまま）・固有スキル「蒼銀の反撃」（MMBattle.resolveAction を包む・セッションごとの WeakMap・セーブしない）・技の演出（anim() の先頭から anim(k,s)。ポーズ＋FX＋Web Animations）。fight()・Phase 6 は変えない。§3「正式素材の統合（2026-10-05 夜・2）」 |
| js/battle/fit.js | バトル画面の表示だけの補正 `MMBF`（#bt が出たら、HUD と技UIの間に収まる「切れない最大の大きさ」を計算して .mw／.mon にインラインの寸法を入れる。fight()・.bt 系 CSS は変えない） |
| js/battle/official-moves.js | **正式技 `MMMOVES`（2026-10-06）**：ソラモ・ガウルの技（SK の 0〜19）を起動時に正式技へ入れ替える（SK・EFF の定義の行は変えない＝レグナスと同じ実行時の方式）。番号＝習得の枠はそのまま＝セーブ互換。旧技の絵（SKART・SFR・SKM）は近い動きの旧技から借りる（VISUAL）。正式の値は js/phase10/monsters.js の OFFICIAL_MOVES の1か所。§3「本体修正＋大会UI統合（2026-10-06・4）」 |
| js/battle/stage.js | **バトルの共通演出 `MMSTAGE`（2026-10-06）**：anim()（Phase 6 の外）の先頭から run(k,s,animRaw)。構え → 溜め → 今までの技の絵（tier で速さ）→ ヒットストップ → 被弾（ノックバック・マスクの白い光・揺れ）→ ダメージ表示 → 余韻 → ルーレット。act() のタイマー（720／1500／1900ms）だけをその1回ずらす。fight() は変えない。自動テストは MM_QA_NO_STAGE（harness の open({ stage:true }) で使う） |
| js/battle/arena.js | **正式バトル画面 `MMARENA`（2026-10-07）**：#bt が出たら外から重ねる（fit.js・fx.js と同じ方式。fight()・Phase 6・.bt 系 CSS は変えない＝CSS はこのファイルから入れる）。ランク別の会場（assets/battle/arena/arena_E〜S。上の帯の「ランクX大会」から読む）・待機立ち絵（assets/battle/idle/。静止の絵のあいだだけ。プレイヤー右向き・相手左向き）・HUD の濃紺＋金・**擬似3D 半楕円の横型ルーレット**（旧ルーレット #rl を見えなくして同じ7候補＝6技＋MISS を映す。R＝中央 1.15倍・±1 0.92倍／10°・±2 0.78倍／19°・端 0.64倍／26°・端ほど暗く下へ・アーチ／枠／STOP は固定・加速 → 巡航 → STOP → 慣性で減速 → 小さな行き過ぎ 0.06 → 吸着 → 強調。STOP は旧 #go を透明にして正式の絵の上に重ねる＝結果は fight() のまま）・攻撃中は引っ込める。§3「今回差分の最終統合（2026-10-07）」 |
| js/battle/art25d.js、js/battle/art25d-data.js、assets/battle/2p5d/、tools/battle25d/ | **ソラモ・ガウルの 2.5D バトル素材の比較試遊 `MM25D`（2026-10-08・正式採用ではない。**2026-10-09 技アニメを完全版へ差し替え＝ソラモ10技12シート・ガウル10技11シートの全97コマ（除外0・_1→_2 は1つの技）・技ごとに1つの倍率・各コマの本体を画面の中と HUD の下へ・相手側は反転。待機の立ち絵は変えていない。tests の A25-B3／B4。assets/battle/2p5d/README.md に元シート → コマ → 出力の表。**2026-10-09 四角い枠をなくした＝切れた辺だけ不規則な波で薄くする（tools/battle25d/soften.py）＋その辺の外へ同じ色の光の粒（星・火の粉・光の筋・羽根・砂。data の ex）。新しい絵は描いていない**）**：URL に `?battleArt=2p5d` を付けたときだけ、バトル画面のソラモ・ガウルの待機の立ち絵と技の演出（技シートから切り出したコマ）を新しい素材にする。`?battleArt=old` は旧の絵から始めて切り替えの札だけ出す。通常の URL では何もしない（旧素材・旧演出はそのまま・消していない）。差し込み口＝index.html の animRaw の先頭（MM25D.anim）・arena.js の待機立ち絵（MM25D.syncIdle）・stage.js の rawTiming／補助技（MM25D.timing／handles）。技の性能・判定・fight()・Phase 6・セーブは変えない。コマの使い方と使わなかった理由は assets/battle/2p5d/README.md。テスト tests/art25d-1008.test.mjs・tests/qa-e2e-art25d-1008.test.mjs。やめるときは index.html の2行（script）と animRaw の先頭の1文を消すだけ |
| js/battle/movedex.js | **技辞典 `MMMOVEDEX`（2026-10-06）**：技アニメーションの正式資料（assets/moves/）と技の性能を見る画面。技管理の技の詳細・技の一覧・研究所の図鑑の詳細から開く。表示だけ |
| js/battle/rules.js | **バトルの正式ルールの差分 `MMRULES`（2026-10-06・5）**：状態異常（まひ・ねむり）・固有スキル（ソラモ・ガウル・ノビトン・ジオル）・ノビトンの正式技（SK の空いた番号 30〜39 に実行時に追加）・純補助技の命中 100%・大会の1試合ごとの旧表示（賞金・ランクアップ）を消す・試合の内容（battleStats＝順位の計算用）。MMBattle.resolveAction を包む（セッションごとの WeakMap・セーブしない）・ban／anim／skb／skSfx／sfx（fight() の外の関数）を包む・#msg を見張る。fight()・Phase 6 は変えない。§3「大会・状態異常・固有スキル・技習得ルート（2026-10-06・5）」 |
| assets/moves/ | **技アニメーションの正式資料（2026-10-06）**：ソラモ・ノビトン・ジオル・ガウル・レグナス 各10枚（緑の背景・1技1枚・複数カット。WebP 品質84・元の大きさ）。技辞典で見る。バトル中には出さない（文字と緑の背景が焼き込まれている）。README.md に元ファイル・sha256 |
| assets/tournament/ui1・ui2・vs/ | **大会UI 1〜3 の正式素材（2026-10-06）**：ui1＝対戦表（題字の札・小さな札・grid6／grid8・凡例・凡例から切り出した印4つ・「対戦する」・あなた／次の相手の札）、ui2＝対戦前比較（札・左右のカード・VS・能力の枠・固有スキル・ボタン2つ。01_header は文字の焼き込みで不使用）、vs＝VS 演出（背景 WebP・ロゴ・斜線・名前の札・飾り）。可逆の PNG を表示の約2倍に。各 README.md |
| docs/ui-pending.md | **素材待ちの UI と差し替え口（2026-10-06）**：聖獣士登録・受け取り通知・市場・街・会話・プロフィールなど、新しいデザイン素材が届いたら CSS のどこを差し替えるか |
| assets/fields/ch1a/formal_1008/ | **Chapter 1 Pattern A の正式背景（2026-10-08）**：ch1a_scene_01〜13.webp（道中）・ch1a_scene_14.webp（大会会場到着前の共通 Scene。Chapter 1〜4 で同じ構図・時間帯の差分の予定）。762px 幅（旧背景と同じ幅）・WebP 品質86。original/＝受け取った JPEG（無加工）と 00_chapter1A_master.jpeg（美術マスター＝ゲームに出さない）。README.md に表示名【暫定】・sha256 |
| assets/fields/ch1a/ | Chapter 1 Pattern A の素材（2026-10-08 から背景は formal_1008/。final/field/ 14枚・final/event/ch1_bg_15_event はファイルだけ残す）：正式マスUI（2026-10-02）＝tiles/（17枚＋**共通の土台 pedestal_common.webp（2026-10-03。円形の石＋細い金縁＋草。マスの絵の下に敷く）**。透過 WebP。分かれ道・合流のマスと左右の門（ZIP の 02_branching）を含む。tiles/README.md）、正式（2026-10-02）＝final/field/ch1_bg_01〜14.webp（762×1536・WebP 品質86。進行する背景）・final/event/ch1_bg_15_event.webp（大会会場への到着イベント専用。マスなし）と intro/ch1_intro_overview.webp（final/README.md）。その前の正式（2026-10-01 夜）＝field/ch1_field_01〜10.webp（ファイルだけ残す）。それ以前の構成（road/＝背景15枚、intro/＝俯瞰図 pattern1〜3、dice/dice_stop_1〜6.webp＋dice_blank.webp、ui/＝操作欄（deck_start.webp を使う。deck_stop.webp はファイルだけ残し使わない）。road/README.md）。旧：背景13枚（journey/。README.md に旅の順と元ファイルの対応）・止まる地点の絵・環境素材・サイコロ（dice/dice_rolling.webp と暫定の停止面 dice_stop_1〜3.svg）。旧背景 bg_01〜03.webp は互換のため残すが参照しない（README.md） |
| js/npc/npc.js | 共通NPC表示・共通会話。`MMNPC`（2026-10-02：talk の opts.presentation＝compact／standard／major、opts.kind＝npc／fina／event。**2026-10-04 G2：presentation 'board'・opts.big（大型の窓）・イベントの表示モード html[data-mmev]／[data-mmhide]（evOn／evOff）**） |
| assets/npc/{karen,dan,nick,elliot,vargas,cedric,genshin,shop}/expr/ | **主要 NPC の表情差分（2026-10-04 第二段階・追加アセット。ZIP mystic-monsters_phase2_event-npc-assets_44images）**：8人 × 4表情＝32枚。各表情に closeup（573×760＝従来の半身と同じ大きさ）・full（全身・縦 960）・face（256×256）の透過 WebP。市松の焼き込みは縁からつながる無彩色だけを除去（白髪・手袋・眼鏡は残す）・輪郭は背景色を差し引いて白いハローを残さない。表情キー：カレン guide・welcome・think・sold／ダン normal・cheer・caution・proud／ニック normal・gentle・serious・impressed／エリオット normal・smile・analyze・discover／ヴァルガス normal・grin・stern・acknowledge／セドリック host・kickoff・tense・victory／ゲンシン guide・fired・strict・approve／アイテム屋（名前なし）normal・smile・worry・recommend。登録は js/npc/npc.js の EXPR（旧表情名は EXPR_ALIAS で読み替え＝セリフのデータは変えずに使える）、`MMNPC.srcOf(id, 表情, view)`・`MMNPC.warm(id)`（施設に入ったときにその NPC だけ先読み）。各フォルダの README.md に元ファイル・sha256。従来の closeup/・face.webp はファイルだけ残す。アイテム屋の full の下半身に白い小さな欠片（商品の窓の後ろ＝要素材修正の候補） |
| assets/events/ch1/ | **Chapter 1 のイベント挿絵 12枚（2026-10-04 第二段階・追加アセット）**：01_tailwind〜12_small_animal（1080×720・WebP 品質86）。既存のイベント id へ1枚ずつ（config の eventPool[].image・title）。止まると field-view の evCardOpen＝盤面を暗く → 横長の挿絵（3:2・切らない）→ イベント名 → フィナの会話（共通会話の compact＝挿絵を隠さない）→（2択）→ 挿絵が消える → 能力UP・疲れの演出。挿絵の無いイベント（remember_dan・wind_cry など）は従来のフィナの吹き出し。先読みは evArtPreload（その配置の挿絵を1枚ずつ）。README.md に対応表・sha256 |
| js/audio/audio-manager.js | Audio Manager `MMAUDIO`（2026-10-02 夜に Audio 基盤を正式改修）：BGM は場面（SCENES：TITLE・TOWN・MARKET・RANCH・LABORATORY・FARM・TRAINING・CHAPTER_1〜4・WILD_BATTLE・RARE_WILD_BATTLE・RIVAL_BATTLE・TOURNAMENT_ENTRY（到着・受付・ランク選択）・TOURNAMENT_LOBBY_LOW／HIGH・TOURNAMENT_MATCHUP（対戦相手の発表・能力比較）・TOURNAMENT_BATTLE_LOW／HIGH・SPECIAL_BATTLE・RESULT。旧名 FACILITY・BATTLE・TOURNAMENT・SPECIAL は SCENE_ALIAS で読み替え）、SE は出来事の名前（SE：UI_CONFIRM…REWARD）で鳴らす。Web Audio API：AudioContext は1つだけ（`MMAUDIO.context()`。index.html の合成音 AU.ctx も同じもの＝auBus）、Master／BGM／SE／legacy の GainNode、ファイル BGM は `<audio>` 2本（slot）→ MediaElementAudioSourceNode（要素ごとに1回だけ接続）→ GainNode でクロスフェード（iPhone Safari は `<audio>.volume` を変えられないため音量・ミュート・フェードは GainNode だけで行う）、ファイル SE は XMLHttpRequest → decodeAudioData → AudioBuffer（末尾の無音は読み込み時に切る。ファイルは加工しない）。再生できない形式（canPlayType）・404・decode 失敗・play() の拒否は合成音（legacy）へ落とし、ゲームを止めない（同じエラーは1回だけ記録・console には出さない）。最初の操作で unlock（resume・iPhone 用に空の `<audio>` を一度鳴らす・保留した BGM の再開）、裏に回ったら suspend＋BGM を止め、戻ったら resume。ミュートは Master の GainNode（ファイル BGM・合成 BGM・ファイル SE・合成 SE のすべて）。ミュート中の合成 BGM は止め、解除でその場面だけ1回鳴らし直す。音量（BGM／SE）は localStorage mmaudio、ミュートは既存の mr4a |
| js/audio/audio-registry.js | **Audio Registry（2026-10-02 夜）**（**2026-10-05 夜：TITLE・PROLOGUE は正式 BGM（mystic_monsters_official）、正式 SE 15種の新しい鍵 MONSTER_ENTRY・TRAINING_ITEM_SPAWN・TRAINING_SUCCESS・MARKET_PURCHASE・RARE_ALERT・TREASURE_TIER_1〜4・REST_RECOVER・EVENT_TRIGGER・BRANCH_SELECT。§3「正式音源とプロローグの固定同期」**）：BGM_REGISTRY（場面 → { src, gain, loop, fallback }）・SE_REGISTRY（出来事 → { src, gain }）。曲・SE の差し替えは**このファイルの1行を変えるだけ**（画面・イベントのコードに音源のパスは無い。tests の AUDIO-9 で監視）。`fallback`＝専用曲が無い場面が代わりに使う場面（RARE_WILD_BATTLE・RIVAL_BATTLE → WILD_BATTLE、TOURNAMENT_BATTLE_HIGH → LOW、TOURNAMENT_ENTRY・TOURNAMENT_LOBBY_HIGH・RESULT → LOBBY_LOW）。`silent: true`＝鳴らさない（合成音にも落とさない。合う音が無い所の置き場。2026-10-03 第5弾の時点で BGM の silent は無し、SE は DICE_THROW・STEP・TOURNAMENT_ARRIVAL・MATCHUP など）。`loopStart`／`loopEnd`／`loopXfade`（秒）＝曲の終わりがフェードアウトする素材を、ファイルを加工せずに loopEnd の手前で loopStart へクロスフェードで戻す（2本の `<audio>` を使う。timeupdate と渡す直前の1回の setTimeout だけで、常駐のタイマーは無い。次の1本を鳴らせないときは元の1本を loopStart へ戻す。最後まで来たら ended で loopStart へ）。SE の `maxMs`／`fadeMs`＝長い余韻の素材を再生の長さだけ短くする（GainNode で下げて止める。ファイルは変えない）。**第5弾（2026-10-03）の仮採用**＝HydroGene 16-bit（CC0。assets/audio/bgm/hydrogene_16bit_rpg/）：TOWN＝Lively City・FARM＝Peaceful Village・TRAINING＝Military Base・CHAPTER_1＝Spirits Forest（full の1本。27.344〜81.98秒をループ＝2周目から前奏なし）・CHAPTER_2＝Unknown Island・CHAPTER_3＝Traveling the Sky・CHAPTER_4＝Volcanic Crater・TOURNAMENT_ENTRY＝Royal Castle（0〜64.28秒・0.08秒のクロスフェード）。大会の LOBBY_LOW／HIGH・TOURNAMENT_MATCHUP・RESULT は fallback で ENTRY と同じファイル＝受付 → 順位表 → 対戦前 → 結果で鳴らし直さない（playFile の「同じ曲なら鳴らし直さない」）。実戦は fight() の bgm("battle") で止めて FIGHT! のあと大会の戦闘曲、バトル後の順位表・結果で Royal Castle（頭から）。勝ち／負けで結果の曲は分けない。登録の無い場面（SPECIAL_BATTLE は fallback）は index.html の合成音（LEGACY_BGM）。`gain`＝素材の元音量の補正（BGM 約 -18 LUFS・SE 約 -16 LUFS を目安）。読み込むと MMAUDIO.registerAll で登録される |
| js/feel/game-feel.js | Game Feel の共通基盤 `MMFEEL`（2026-10-02）：出来事の重さ LEVEL（0 UI〜5 大会・Chapterクリア）、motion tokens（MOTION：押下・遷移・LEVEL ごとの間 beat と余韻 hold・カウントアップ。CSS には --mm-* 変数）、押下の手ごたえ（.mm-press＝scale だけ）、画面を移るボタン（onclick が market／farm／museum／hall／lobby など＝NAV_FN、または data-nav）は押下を約0.11秒見せてから移り、待っている間・移った直後0.26秒のタップは無視（二重遷移の防止。スクリプトからのクリックはすぐ移る）、入りかた（html[data-mmtr]＝facility／back／special）、出来事 emit（名前 → MMAUDIO の SE＋将来のハプティクス registerHaptics） |
| js/feel/notice.js | **システム通知の帯 `MMNOTE`（2026-10-05 PHASE B・正式デザイン system_notification_banner を HTML/CSS で）**：NPC の会話（MMNPC）とは別の層・顔と名前なし。show({ icon:gold／reward／unlock／item, img, title, sub, ms })＝1つずつ順に・タップで早く消える・log()／flush()（テスト）。新人支援の 1000G・薬草×1（index.html の talkSeq＝会話の行と { note } を順に）、世界地図の解放、古いセーブの救済（補填）、大会の初回優勝の報酬・バッグの拡張 |
| assets/monsters/ | 4原種の正式画像。solamo_walk_back/＝ソラモの後ろ向き歩行 8コマ（2026-10-02。透過 WebP 303×320。README.md）。gauru_walk/（6コマ）・nobiton_walk/（8コマ）・jiol_walk/（8コマ）＝歩行（2026-10-02。可逆 WebP。残りカスの修正は各 README.md） |
| assets/audio/ | 正式な音源（第1弾 2026-10-02 夜・第2〜5弾 2026-10-03。すべて「試遊候補」）：bgm/pgs_fantasy_rpg/（PGS の6曲。CC BY 4.0・JP Soundworks の表記が必須・暫定の試遊用で新しく採用しない）、bgm/alkakrab_fantasy_rpg_vol3/（alkakrab「Free 25 Fantasy RPG Game Tracks Vol.3」の2曲＝ライバル戦・大会 B〜S。商用可。街・旧ファームの2曲は第4弾で NG・削除）、se/interface_sfx_pack_1/・se/ivokard/（CC0）、se/alkakrab_fantasy_rpg_vol3/（Fx 1〜3＝対戦相手の発表・Chapter 開始・野生の遭遇）。bgm/hydrogene_16bit_rpg/（HydroGene「High Quality 16-bit RPG Music」の8曲＝街・ファーム・特訓・Chapter 1〜4・大会の受付〜結果。CC0。第5弾の仮採用・ファイルは無加工）。**se/mystic_monsters_official/title_start.ogg＝開始の音の正式素材（2026-10-04・ユーザー提供の MP3 を OGG Vorbis に変換しただけ。MP3 は置かない）**。OGG だけ（同じ曲の別形式は置かない）。採用した音源だけを置く（ZIP・WAV・未採用の曲は入れない）。出どころ・ライセンス・元ファイル名・gain は **AUDIO_CREDITS.md**、置き方と明日の差し替え手順は assets/audio/README.md |
| assets/design_pack_2026-10-03/ | **デザイン素材一括（ZIP mystic-monsters-design-pack-2026-10-03 part1〜3・75枚）の取り扱い**：PACK_README.md・manifest.json（原文）と README.md（グループごとの中身・置き場・採用／保留）、**ASSET_TABLE.md／asset_table.csv＝75枚すべての管理表**（通し番号・元ZIP・元フォルダ・元ファイル名・題名・想定用途・正式／参考・実装状況・派生・透過・保存パス・sha256。tests/design-pack-1003.test.mjs の DP-06 で manifest と照合）。参考専用・UI参考（02 会話UI・03 初回の街案内／参考のフィナ・04 遭遇／大会／Chapter の UI）はリポジトリに置かない |
| assets/chests/ | 宝箱の正式素材 4種類（2026-10-03。各＝本体＋開封4枚。original/＝元 JPEG・chest_0N_*.webp＝透過の派生。README.md）。Chapter 1 の宝箱：normal＝chest_01・special＝chest_04（tileUI.chests の frames＝開封アニメーション）。4種類はすべて正式素材で、それぞれ別のランク・別の用途（正式の対応表はユーザーから後日）＝chest_02・03 は保存のみ（統合しない・用途を推測で固定しない）。rare は対応表が届くまで宝箱の絵なし |
| assets/tournament/rank_ui/ | **大会ランク選択の正式画像（2026-10-05 夜・2）**：rank_available_E〜S（参加可能）・rank_unavailable_E〜S（参加不可＝鎖と錠）。index.html の P9_RANK_IMG・p9RankRow。README.md に元ファイル・sha256 |
| assets/town/nameplate/ | **街の名札「ミストリア」の正式画像（2026-10-05 夜・2）**：mistria_nameplate.webp。index.html の TOWN_NAMEPLATE・lobby の .tcity。README.md |
| assets/ui/a_group/ | **共通UI A群の一部（2026-10-05 夜・2）**：a04_main_button_red（ベースキャンプの「出発する」）・a05_currency_panel（ベースキャンプ・アイテム屋の所持金）。ほかの部品は素材待ち（市松模様の焼き込み・元 PNG は 403）。README.md |
| assets/ui/a_group/、assets/ui/b_group/ | **共通UI A群・B群の正式部品（2026-10-06 第1弾・第2弾。正本は PNG＝可逆の PNG のまま表示の約2倍へ縮小。JPEG・WebP にしない。A-04・A-05 だけ 10-05 の WebP）**：施設名ラベル B-01・プレイヤーの札 B-02・プロフィール行 B-03・セーブのスロット B-04／A-20／A-22／B-06・オートセーブ B-07・バックアップ B-08・Chapter のリボン B-09・市場のドット B-11／B-12・研究所の3つ B-13・牧場 B-14／B-15・冒険の進行ヘッダー B-20・冒険のメニュー B-22・固有スキル B-23・能力バーの色 B-26〜B-31・未習得の技 B-37・ステータスの丸 B-43・市場の矢印 B-44／B-45・赤 B-49・押せない B-50・お知らせ B-51・羊皮紙 A-17・青 A-19。README.md（b_group）に元ファイル・sha256・使っていない部品と理由 |
| assets/monsters/regnas/moves/ | **レグナスの技の演出素材（2026-10-05 夜・2）**：poses/ 11枚・fx/ 10枚（11_claw_slash_medium・12_claw_slash_large は市松模様が焼き込まれていて使わない）。README.md に技との対応・sha256 |
| assets/basecamp/ | **ベースキャンプ（旧ファーム）の正式背景マスター basecamp_main.webp（2026-10-04 PHASE H2。768×1360・UI・NPC・モンスターなし。ZIP mystic-monsters_new_designs_2026-10-04_v2 の 06。README.md）**。index.html の BC_BG |
| assets/bureau/ | **聖獣士管理局の正式背景マスター bureau_main.webp（2026-10-04 PHASE H4。864×1536・UI・セルジュなし。同じ ZIP の 05。README.md）**。index.html の BUREAU_BG（管理局・聖獣士登録の共通背景） |
| assets/shop/ | アイテム屋の正式背景・正式NPC（2026-10-03。original/＝元 JPEG、shop_bg.webp・shop_npc.webp。README.md）。index.html の shopScr（p7Shell の o＝SHOP_LOOK）。NPC の名前は未確定＝名前・セリフは出さない |
| assets/items/、assets/item_ui/ | **2026-10-05 PHASE B**：items/herb.webp＝薬草の正式アイコン（index.html の ITEM_ICON・itemIc。Chapter のアイテムは window.MM_ITEM_ICON）、item_ui/＝アイテム管理・アイテム補給所の購入／売却／アイテム図鑑の正式アイコン（ITEM_MGMT_ICON・SHOP_ICON）。各 README.md に元ファイル・sha256 |
| assets/fx/ | sacred_beast/＝野生聖獣の遭遇の正式8コマ（保存＋再生器の準備）、fusion/＝合体エフェクト（保存のみ。ZIP の 05／06 のフォルダ分けに食い違い＝要確認。README.md） |
| assets/chapter/ | **2026-10-04 PHASE I（追加素材の局所統合）**：stat_tools/＝能力UPの道具6種（li ハードル・po ウェイト・in 魔導書・hi ターゲット・ev 回避訓練ボール・de 訓練盾。全モンスター共通）、result_fx/＝Chapter の短い結果演出3種（rest＝休むマス＝疲れの回復・event_result＝出来事の結果・wild_victory＝道中の野生バトルの勝利だけ）。市松の焼き込みを取り除いた透過 WebP（元 JPEG はユーザーが保管）。画像に数値・結果は無い（文字は js/chapter/field-view.js の resultFx が実際の値から作る）。各 README.md に元ファイル・sha256・透過化の手順と限界 |
| assets/tournament/ | **lobby/＝大会会場の中（ロビー）の背景 lobby_main.webp（2026-10-04 G4。デザイン参考「大会会場イベント画面」の背景の右側。README.md）**、reward_unlock/＝大会の報酬・解放演出4種（保存のみ・透過元 PNG 待ち）、rank_emblems/＝ランクエンブレム6種シート＋位置で切り出した slices/emblem_slot1〜6（E〜S の割り当ては保留）。README.md |
| js/prologue/prologue.js | **プロローグ `MMPRO`（2026-10-05 PHASE B：正式 v6 の時刻表 CUES＝Scene 0／5.559／15.161／26.673秒・本文の終わり 36.276秒・終わり 38.714秒。時計は1回の目覚めで最大 STALL_MS 1.5秒しか進めない・pagehide／freeze で止まる・Scene 1 の前はスキップを押せない＝§3「PHASE B」）。2026-10-05 正式4枚。2026-10-05 夜：正式 BGM と同期する固定尺の自動再生＋スキップのみ＝タップで進まない・ヒントなし。schedule()／sceneStarts()＝Scene 0／7.782／21.226／37.342秒。§3「正式音源とプロローグの固定同期」）。以下は旧記録：プロローグ A〜E（2026-10-03）**（**2026-10-04 G1：各行は全文で下から入って上へ流れる（タイプ表示なし）・見た記録は最後まで見た／スキップ確定のときだけ・背景は最大6秒待つ。§3 の「実機試遊の改善」**）：新しいゲームの最初に1回（聖獣士登録＝名前登録の前。p11NameScr。見た記録は S.npcFlags.prologue）。背景を大きく → ナレーション（HTML。画像に焼き込まない）が下から1行ずつ浮かび上がる → 次の背景へクロスフェード → E のあと本編。タップ＝今のページを全部出す → 次へ（0.45秒未満の連打は無視）。スキップは2度押し。背景5枚（assets/prologue/prologue_a〜e.webp）がそろうまで出さない（MMPRO.ready。2026-10-03 に A・B を受け取り5枚そろった＝新しいゲームで出る）。〔旧 A〜E の役割。年代はいまは使わない〕A＝世界と聖獣・約百年前の第一次大災厄と英雄・聖獣士の制度（いまの聖獣士管理局へ）／B＝五年前の第二次魔物災害に三人のレジェンドとそれぞれの聖獣が共に立ち向かう（三人＋三体はすべて味方・いまも存命）／C＝五年後の現在・平和と繁栄・ミストリアの全盛／D＝各地の聖獣士がミストリアへ・主人公もその一人／E＝ミストリア到着。自動テストは MM_QA_NO_PROLOGUE（harness の open({ prologue: true }) で出す） |
| js/opening/worldmap.js | **世界地図 `MMMAP`（2026-10-05）**：正式の世界地図（assets/worldmap/world_map.webp。1448×1086。地方名・ミストリアは絵の文字）の上に地点の印を HTML で重ねる（光る地方・光点・リング・ラベル。**画像に焼き込まない**）。open()＝序盤の会話の地図（focus(key)＝カメラ。会話窓の上に収まるよう端で止める）、viewer()＝聖獣士管理局の常設「世界地図」（ドラッグ・＋／−・×）。SPOTS：world・ferna（フェルナ地方＝フィナの出身）・asteria・liberna（リベルナ＝主人公の出身・アステリア地方西部の地方都市。絵に描かれていない＝**位置は【暫定】**）・mistoria（現在地） |
| assets/worldmap/ | 世界地図の正式画像 world_map.webp（2026-10-05。ZIP next-phase-assets の world map を WebP 品質86 に） |
| assets/prologue/ | **2026-10-07 正式6枚＝v2/prologue_01_peace・02_calamity・03_culture・04_legends・05_tournament・06_departure.webp（v2/README.md）**。旧 4 枚（prologue_01_coexistence 〜 04_arrival_mistoria）・旧 A〜E はファイルだけ残す（参照しない） |
| assets/legends/ | **三人のレジェンドと相棒（2026-10-07 正式）**：astrad・leona・ragnas の full／closeup、zelvarn・griffel・dragnol の monster。データは js/prologue/prologue.js の LEGENDS（アストラッド＋ゼルヴァーン・レオナ＋グリフェル・ラグナス＋ドラグノル）。今は表示する場面なし（将来のレジェンド挑戦）。README.md |
| assets/tournament/victory・vs_monsters・rankup_final/、assets/ui/market_wood・worldmap_icon/、assets/npc/ryu/expr/、assets/audio/bgm/licensed_20261008/ | **2026-10-08 正式素材の統合・次便**：勝利演出5体・VS 専用勝負絵5体・ランク昇格 Final・市場の木製UI・世界地図の解放アイコン・リュウの表情5種・街の BGM。各 README.md（§3「正式素材の統合・次便」） |
| assets/battle/arena・idle・roulette/、assets/tournament/faces/ | **2026-10-07**：会場の背景 E〜S・待機立ち絵5体・横型ルーレットの部品（arch・center_frame・stop・plate_normal／selected／miss）・大会の顔アイコン5体（対戦表）。各 README.md |
| assets/ui/cmd/、assets/ui/market/ | **2026-10-07**：研究所（図鑑・合体・配合表）・聖獣士管理局（聖獣士証・功績一覧・世界地図）・牧場（見る・名前変更・預ける／受け取る・売る）のコマンドの正式画像（data-cmd で CSS の背景）、市場の左右の矢印・会話欄。README.md |
| assets/tournament/cedric・venues・rank_start・rank_up/ | **大会〜バトル追補便（2026-10-07）**：セドリックの開会（opening＝standing_UI の上部）・締め（booth）・大会会場 venue_E〜S・ランク開始 A1〜A6（E）・ランクアップ B1〜B7（E → D）。README_followup_20261007.md |
| assets/ui/recovery_1006/ | **正式UI回収（2026-10-07。前回未送付の正式UI素材 ZIP 7つ）**：reg（聖獣士登録）・talk（共通会話のセリフ枠・名前ラベル・選択肢）・profile・town（名札・下のコマンド）・basecamp（下の5つ）・market（上の札・プレイヤーの札・名前と価格の札・矢印）・tournament（大会ランク選択 102319＝見出し・ランクの帯 E〜S・参加する／参加しない・参加の確認）。透過 PNG を表示の約2倍に縮小。見本の文字の焼き込みは空欄化して HTML で重ねる。README.md に対応表・空欄化・sha256 |
| assets/ui/skill/ | **技一覧の未習得パネル（2026-10-07 夜）**：locked_skill_panel.png（ZIP mystic_monsters_locked_skill の透過版を切り抜いて縮小）。技一覧の未習得の技の絵の代わり。README.md |
| assets/audio/bgm/licensed_20261007/ | **正式採用の BGM 14曲（2026-10-07 夜）**：ユーザー提供の MP3／WAV を OGG Vorbis q5 に変換しただけ（ユーザー指示）。プロローグ6場面・セドリック・対戦表・対戦前比較・ライバル・闘技場・野生・レア・公式ランク戦。作者・出典・gain・ループは AUDIO_CREDITS.md |
| assets/lab/ | 研究所の正式背景 lab_main.webp（2026-10-03。巨大な図鑑・青く光る装置） |
| js/fx/sequence.js | 連続コマの演出の再生器 `MMSEQ`（2026-10-03。sacredBeast＝野生聖獣の遭遇8コマ。どこからも呼んでいない＝聖獣のシステムが無い。将来は MMSEQ.play('sacredBeast')） |
| assets/title/ | 開始画面の正式画像（README.md に出どころ） |
| assets/town/ | 街の背景（**2026-10-03 から正式ミストリア mistria_main.webp**（768×1360。ZIP mm_quality_up_supplement の mistria_town_master）。以下は従来の記録：正式 town_main.jpg。元データは original/、差し替え前の旧背景は previous/。差し替えるときは建物ラベルの位置 TOWN_LABELS も合わせる。README.md） |
| assets/ranch/ | 牧場（ぽかぽか牧場）の背景（正式 ranch_main.jpg。元データは original/。旧背景は assets/embedded/farmimg_ranch.jpg（FARMIMG、表示には使わない）。README.md） |
| assets/farm/ | ファームの背景（**正式 2026-10-03＝farm_prep_main.jpg**（冒険準備の拠点・ZIP mismon_claude_assets_2026-10-03 の farm_reference。元データ original/farm_adventure_prep_reference_864x1536.jpg）。旧正式 farm_main.jpg はファイルだけ残す。以下は従来の記録：正式 farm_main.jpg。元データは original/。README.md）。ファーム画面とファームの各画面（ステータス・技管理・特訓メニュー・出発準備・アイテム屋）のぼかし背景に使う。旧背景 TRIMG2（assets/embedded/trimg2_farm_bg.jpg。旧ロゴ入り）と Chapter間ファームの旧背景 MMP12S.FARM_INTERVAL は互換のため残すが、表示には使わない |
| assets/monsters/regnas/ | **レグナス（リュウの正式相棒・2026-10-05 夜）**：regnas_official.webp（市松模様を取り除いた透過 WebP 663×900）・original/（ユーザーの正式 JPEG）。ライバルの遭遇の画面だけ（.ce-partner）。データは js/phase10/monsters.js の RIVAL_MONSTERS（プレイヤー用ではない）。README.md |
| assets/npc/ryu/ | **2026-10-05 夜：正式の全身 ryu_official_fullbody.webp（白背景を透過・406×960）に差し替え・旧 full_normal.webp は削除。以下は旧記録：**リュウ（ライバル）の正式立ち絵 full_normal.webp（2026-10-05 PHASE B）：ZIP npc_official_standing の 09_ryu.jpeg（市松模様の焼き込み）から市松模様だけを取り除いた透過 WebP。ライバル遭遇の画面だけ（ch1a の battleTypes.rival.encounterFigure → field-view の .ce-rival）。会話の NPC には登録していない。**竜（リュウの相棒）の正式素材はリポジトリ・受け取ったどの ZIP にも無い**＝encounterPartner は null（作らない）。README.md |
| assets/npc/fina/ | フィナの正式素材（README.md に元画像との対応）。**2026-10-03：全身 fullbody/ 10ポーズ**（smile・happy・surprised・troubled・worried・serious・guide・normal・wave・greet。JPEG の市松模様を取り除いた透過 WebP。重要な会話＝major で使う）。同じ補足パックの半身16枚は既存の closeup・wave_blink・wave と同じ絵（新しい取り込みなし） |
| assets/npc/karen/ | カレン（市場担当）の正式素材。アップ画像6表情のみ（README.md に元画像との対応） |
| assets/npc/dan/ | ダン（ファーム担当）の正式素材。アップ画像6表情と、小さい顔用の face.webp（README.md に元画像との対応） |
| assets/npc/nick/ | ニック（牧場の管理者）の正式素材。アップ画像6表情と、小さい顔用の face.webp（描き込まれた市松模様の背景を透明化。README.md に元画像との対応） |
| assets/npc/cedric/ | セドリック（公式ランク大会の進行役）の正式素材。アップ画像6表情（closeup/normal・smile・guide・happy・surprised・serious）と、小さい顔用の face.webp（描き込まれた市松模様の背景を透明化。README.md に元画像との対応） |
| assets/npc/elliot/ | エリオット（研究所の研究者）の正式素材。アップ画像6表情（closeup/normal・smile・guide・thinking・curious・serious）と、小さい顔用の face.webp（無地の灰色の背景を透明化。README.md に元画像との対応） |
| assets/npc/vargas/ | ヴァルガス（闘技場の管理者）の正式素材。アップ画像6表情（closeup/normal・guide・stern・approval・surprised・respect）と、小さい顔用の face.webp（描き込まれた市松模様の背景を透明化。README.md に元画像との対応） |
| assets/npc/genshin/ | ゲンシン（特訓の指導役。5種類すべて担当）の正式素材。アップ画像6表情（closeup/normal・smile・guide・serious・strict・praise）と、小さい顔用の face.webp（描き込まれた市松模様の背景を透明化。README.md に元画像との対応） |
| assets/battle/common/ | バトル共通演出の正式素材（ZIP mystic_monsters_battle_common_30.zip。2026-10-03）：original/＝30枚の元ファイル（JPEG・バイト単位で同一・名前だけ bcNN_時刻.jpeg。#1〜#30＝ユーザーの対応表の番号）、bcNN_用途.webp＝ゲームで使う11枚（市松模様を取り除いた透過 WebP。ユーザー承認）。未使用の19枚（#1〜#5・#8・#10〜#14・#21〜#27・#30）は保存だけ（別の用途へ転用しない）。README.md に対応表・透過化の手順・限界 |
| assets/scenes/、assets/fields/、assets/dice/ | 背景・フィールド・サイコロの素材 |
| assets/embedded/ | index.html の base64 から安全に外部化した既存画像の置き場（元データとバイト単位で同一。無加工）。ファイル名は「定数名_番号またはキー_用途」。第1段階：FT（ft_*）・TABS（tabs_*）、第2段階：FARMIMG・TRIMG2・NPI.b。Phase 6 の画像（SFR・BTB・SFXL・STOPART・SKART・AS.spr）は外部化しない |
| prototype/camera-follow.html | 【試作】Chapterボードの「モンスター移動＋カメラ追従」の検証ページ（2026-10-01 夜。ゲーム本体とは完全に独立した1ページ・正式実装ではない。背景は2枚＝背景A assets/fields/proto/cam_test_road_a.webp → 背景B cam_test_road_b.webp（ユーザー提供の別々の画像。各6マス＝通し12マス。A の6マス目から B の1マス目へ、B を A の道の先から広げてフェードで切り替え、カメラ追従は連続）。旧 cam_test_road.webp はファイルだけ残す。公開URLの …/prototype/camera-follow.html で試せる。消しても本体に影響なし） |
| tests/*.test.mjs | 自動テスト |
| tools/public-check.mjs | push 後の公開URLの確認（§7） |
| AUDIO_CREDITS.md | 音源の作者・配布元・ライセンス・商用利用条件・クレジット要否・使用したファイル（場面・gain）。素材を足したら更新する |
| AUDIT_2026-10-03.md | 未回収項目・演出・音響の総監査（2026-10-03）：マスの大きさ・画面の切り替え・イベント／演出素材の A〜F 分類・BGM の場面一覧・操作ごとの SE（1〜4）・不足 SE |
| AUDIT_2026-10-02.md | 軽量化・データ整理の監査（2026-10-02。未使用素材・重複・画像最適化・未使用コード・CLAUDE.md の食い違い・テスト・音・.git・.gitignore） |
| KNOWN_ISSUES.md | 既知課題と判断事項の記録 |
| INTEGRATION_STATUS.md | 統合当初の記録（古い内容を含む） |

### セーブデータ

- セーブ version 6、localStorage キー `mr4v6`。旧 v5（キー `mr4`）からは読み込み時に自動移行し、バックアップを残す。
- セーブversion・localStorageキー・checkpoint形式は変更禁止。既存セーブとの互換を必ず保つ。
- v6 に後から加えた任意項目（**2026-10-04 PHASE H：`S.fuseCnt`＝合体回数（聖獣士証）。それ以前の合体は数えられない**）：`S.raiseRec`（育成完了回数）、`S.npcFlags`（フィナの会話の表示済み記録）、個体の `m.raise.startStats`／`m.raise.endStats`（売却額の計算用）、`m.raise.field.introSeen`（その Chapter の導入演出を見たか。配置と一緒に消える）、`m.raise.field.arrivalSeen`（大会会場への到着の会話を見たか。2026-10-02。配置と一緒に消える）。**2026-10-04（第二段階）**：`S.npcFlags.story`（セーブ単位のチュートリアルの見た記録＝config.story の scope 'save'）、`S.npcFlags.first`（施設の初回訪問 { market, ranch, lab, arena, farm }。2026-10-04 追加アセットで train（特訓＝ゲンシン）・shop（アイテム屋）も）、`m.raise.evSeen`（帰還イベント 'retN'・噂 'rumor'。育成のあいだ残る）、`m.raise.pend.fx.kind === 'choice'`（2択の出来事を選ぶ前の途中状態。stage は 'resolve' のまま）。 **2026-10-05（次期総合改修）**：`S.npcFlags.op`（序盤の導線 'guide'＝フィナの声かけ済み・管理局へ案内中／'map'＝登録済み・出身地と世界地図の会話の前／'done'＝完了）、`S.npcFlags.worldMap`（世界地図の会話を見た＝管理局の地図に出身地の印）、`S.npcFlags.moment`（短いイベントの見た記録 { partner, sp0〜sp3, move, tour, tourEnd }）。**2026-10-06**：`S.npcFlags.support`（新人支援 1000G＋薬草を受け取った＝1回だけ）。薬草はバッグ（S.inv.bag の { id:'herb' }。いっぱいなら保管庫）。登録の判定は従来どおり `S.playerNamePending`（新しいゲームだけにある）＝登録済みの古いセーブは序盤の導線を出さない。 **2026-10-04（PHASE D）**：`S.npcFlags.chapter5`（S ランク優勝＝Chapter 5 の解放フラグ。画面は未実装）。

### テスト

- 実行方法：リポジトリ直下で `node --test tests/*.test.mjs`（Node 22 で確認。約7秒。実ブラウザテストは skip になる）
- 実ブラウザテストも含める場合：`QA_E2E=1 node --test --test-concurrency=1 tests/*.test.mjs`（Playwright＋Chromium を使う。約20〜30分。並列だと約7.9MBの index.html の読み込みが重なり不安定になるため、必ず1ファイルずつ）。共通部品は tests/e2e/harness.mjs
- Stage 3（2026-09-29）の後：ふだんの実行は763件（合格589・skip 174・失敗0）。2026-09-30 の牧場の「様子を見る」で2件、継続用救済の整合修正で3件、画面全体の固定（tests/qa-e2e-page-fixed.test.mjs）で8件を追加し776件（合格594・skip 182・失敗0）、実ブラウザテスト込みの全件は785件。実ブラウザテストも含めた全件（46ファイルを1つずつ）は773件。失敗0が基準（2026-09-30：qa-fix-g3 の QA-G3-B9 の不安定さを解消し、2周とも 773/773。KNOWN_ISSUES.md の Stage 3）
- 2026-09-30 の Chapterフィールド（Chapter 1）の後：ふだんの実行は806件（合格615・skip 191・失敗0）。実ブラウザテスト（28ファイルを1つずつ）は305件で失敗0（新しい tests/qa-e2e-chapter1.test.mjs を含む。旧 Chapter 1 ボード前提の育成・セーブのテストは Chapterフィールドに合わせて書き直し、旧ボードの確認は Chapter 2 で行う）。1000回の進行シミュレーションは `node tests/chapter-sim.mjs 1000`
- 2026-09-30 の Chapter 移動体験の改修（カメラ・歩き・目印・STOP・バトルの表示）の後：ふだんの実行は821件（合格620・skip 201・失敗0）。実ブラウザテストも含めた全件（49ファイルを1つずつ）は831件で失敗0（tests/qa-e2e-chapter1.test.mjs は CH1-B1〜B17 の19件。tests/chapter-engine.test.mjs に CH1-25〜27・DICE-06・BF-01）
- 2026-09-30 の Chapter 1 の13枚の旅と見せ方・操作の改修（大会・VS・バトル前・街・セーブ・市場を含む）の後：ふだんの実行は832件（合格620・skip 212・失敗0）。実ブラウザテストも含めた全件（50ファイルを1つずつ）は842件で失敗0（新しい tests/qa-e2e-journey.test.mjs は JR-1〜8 の11件）
- 2026-09-30 の次期Chapter（リアル巨大ボード方式）の内部基盤の後：ふだんの実行は848件（合格636・skip 212・失敗0。新しい tests/chapter-next.test.mjs は NX-01〜16 の16件＝合成 config で 6面・100〜200マス・強制停止・30ターン・seed・セーブ互換）
- 2026-10-01 の Chapter 2「潮風の海岸」と HUD の修正の後：ふだんの実行は 862件（合格640・skip 222・失敗0。tests/chapter-engine.test.mjs に CH2-01〜02）。実ブラウザテストに tests/qa-e2e-chapter2.test.mjs（CH2-B1〜B3）と qa-e2e-chapter1 の CH1-B19（HUD の固定位置）を追加。Chapter 2 のシミュレーションは `node tests/chapter-sim.mjs 1000 cautious 2`
- 2026-10-01 の Chapter 1 リアル巨大ボード方式（背景15枚・俯瞰図・START／STOP・6面）の後：ふだんの実行は852件（合格636・skip 216・失敗0）。同日のサイコロ1タップ化・道の安全域・周回の廃止の後：ふだんの実行は853件（合格637・skip 216・失敗0。tests/chapter-engine.test.mjs に CH1-28）。Chapter 1 の実ブラウザテストは1タップと新しいノードIDに合わせて書き直し（CH1-B15＝1タップの流れと連打、CH1-B18＝複数の背景での道の安全域、JR-10＝自動停止）。Chapter 1 の実ブラウザテスト（qa-e2e-chapter1・journey・raising・raising-late・save・save-reload）は新構成のノードIDと START→STOP に合わせて書き直し、tests/qa-e2e-journey.test.mjs に JR-9〜12（俯瞰図・自動停止・ターン切れ・フィナの吹き出し）を追加。距離の比較は `node tests/chapter-balance.mjs 600`
- 既知の失敗テスト：なし（M3-3 はテストの古い期待値が原因だったため、テスト側を修正。assets/monsters/soramo/・gauru/ のフォルダは旧PHASE 1 土台の data/assets.json が登録しているプロフィールカード画像で、ユーザー判断により残す。ゲームは使わない）
- 画面・操作にかかわる変更をしたら：ふだんのテストと、変更に関係する実ブラウザテスト（該当ファイルだけ、QA_E2E=1）が通ったら、すぐ main へ push する。全件の実ブラウザテストは push の後に実行し、問題が出たらすぐ直して再 push する（試遊をすぐできるようにするため）
- 2026-10-01 夜の Chapter 2 正式背景の後：ふだんの実行は 863件（合格641・skip 222・失敗0。tests/chapter-engine.test.mjs に CH2-03＝旧 Chapter 2 の途中のセーブ）。実ブラウザの tests/qa-e2e-chapter2.test.mjs（CH2-B1〜B3）は新しいノードID（s1_〜sa_）・背景の順（海上 → 海中 → 海上）・390×844 と 375×667 に合わせて書き直し
- 2026-10-01 夜の Chapter 2 進行の再設計（サイコロ 1〜3・約70歩・分岐）の後：ふだんの実行は 865件（合格642・skip 223・失敗0。tests/chapter-engine.test.mjs の CH2-01・02 を書き直し、CH2-04＝分岐の選択・合流・分岐中のセーブ）。実ブラウザ tests/qa-e2e-chapter2.test.mjs に CH2-B4（分岐の見え方・再読み込み・合流。2サイズ×A／B）
- 2026-10-01 夜の Chapter 1・2 の統一（1〜3・40ターン）と Chapter の解放条件の後：ふだんの実行は 868件（合格645・skip 223・失敗0。tests/qa-raising-logic.test.mjs に QA-RL39〜41＝Chapter 3・4 の条件と育成完了）。Chapter 3・4 へ進む前提の古いテストは、出発のときだけ条件を満たした実績にして規則を確かめる形に直した。実ブラウザ tests/qa-e2e-chapter2.test.mjs に CH2-B5（解放条件の画面・2サイズ）
- 2026-10-02 の Chapter 1 正式背景14枚・60マス・大会到着・マスUIの仮表示の後：ふだんの実行は 873件（合格647・skip 226・失敗0。tests/chapter-engine.test.mjs の CH-ENGINE-01 を14枚・背景ごとのマス数・合計60・座標データ・到着イベントに書き直し、CH1-29＝到着と大会受付の作り、CH1-30＝マスUIの仮表示と差し替えの構造）。実ブラウザの Chapter 1 テスト（qa-e2e-chapter1・journey・raising・save・save-reload）を w1_〜w14_ と大会受付に合わせて書き直し、tests/qa-e2e-journey.test.mjs に JR-13（到着の背景・フィナの会話・再読み込み）・JR-14（マスUIの仮表示と素材の差し替え）。harness は到着の会話を出さない（MM_QA_NO_ARRIVAL。open({ arrival: true }) で出す）
- 2026-10-02 の正式マスUI・成長適性・レア野生の後：ふだんの実行は 874件（合格648・skip 226・失敗0。tests/chapter-engine.test.mjs の CH1-08・09 を成長適性に書き直し、CH1-30＝正式マスUI。CH1-31 は下の修正で書き直し）。Chapter 1 の実ブラウザテスト（qa-e2e-chapter1 の CH1-B1・B11、qa-e2e-journey の JR-14）を正式マスUIに合わせて書き直し。旧ボードの能力マスのテスト（qa-raising-logic の QA-RL5）は適性の値に合わせた。テストの読み込みに js/phase10/monsters.js を足した（ゲームと同じ）
- 2026-10-02 の正式仕様の修正（バトルのマス＝野生・レアモンスター・ライバル、レアモンスターマス 10%、ノビトン・ジオルの成長適性、宝箱の素材）の後：ふだんの実行は 875件（合格649・skip 226・失敗0。CH1-08・09＝4原種の適性、CH1-31＝レアモンスターマス（配置のとき10%・保存・旧抽選なし）、CH1-32＝古いセーブの強敵の互換、CH1-30＝宝箱の素材、CH1-12〜16 は強敵なしに書き直し）。実ブラウザ：qa-e2e-chapter1 の CH1-B6（レアモンスターマスのバトル）、qa-e2e-journey の JR-14（宝箱が現れて開く・rare は宝箱の絵なし）
- 2026-10-02 の通常マスの通過専用・Chapter開始の演出の後：ふだんの実行は 880件（合格652・skip 228・失敗0。tests/chapter-engine.test.mjs に CH1-34＝空白で止まらない、CH1-35＝イントロの流れ・時間・config。1地点ずつの進み方を確かめるテストは fillSlots で全部の地点を効果マスにしてから）。実ブラウザ：qa-e2e-journey の JR-9（イントロの流れ・UI を出さない・飛ばす・連打・再読み込みで出さない）を書き直し、JR-16（空白で止まらない）を追加。Chapter 1 の実ブラウザテストのうち1地点ずつの位置を見るもの（qa-e2e-chapter1 の start・qa-e2e-journey の toField）は通常マスを効果マスで埋めてから、保存・再読み込みの確かめ（qa-e2e-raising・qa-e2e-save-reload）は harness の open({ legacyStep: true })＝そのページだけ passNormal を切る
- 2026-10-02 のガウル・ノビトン・ジオルの歩行と演出（カットイン・能力の枠・残りターンの警告）の後：ふだんの実行は 881件（合格653・skip 228・失敗0。tests/chapter-engine.test.mjs に CH1-36）
- 2026-10-02 のソラモの歩行アニメの後：ふだんの実行は 877件（合格650・skip 227・失敗0。tests/chapter-engine.test.mjs に CH1-33＝歩行の素材と config）。実ブラウザ tests/qa-e2e-journey.test.mjs に JR-15（止まっている間 01・移動の間だけループ・3マス連続・背景の切り替え・見えるコマは1枚）
- 2026-10-02 の商用品質化・第1次（Audio Manager・Game Feel・会話の見せ方・Chapter の演出・道に刻まれたマス・Chapter のイベント）の後：ふだんの実行は 898件（合格663・skip 235・失敗0。新しい tests/game-feel.test.mjs＝GF-01〜09）。実ブラウザに tests/qa-e2e-feel.test.mjs（FE-1〜7）。harness は Chapter のイベント（フィナの節目の一言）を出さない（MM_QA_NO_STORY。open({ story: true }) で出す）。画面を移るボタンの押下の待ちも既定では切る（MM_QA_NAV_INSTANT。open({ navDelay: true }) で有効＝FE-1）
- 2026-10-02 の Chapter 1 の60マス再設計（分岐・合流・通常マスも止まれる・歩きながらのクロスフェード・共通の台座）の後：ふだんの実行は 882件（合格654・skip 228・失敗0。tests/chapter-engine.test.mjs の CH-ENGINE-01・CH1-01〜04・12〜13・30・32・34・配置の制約・シミュレーションを書き直し、CH1-37＝60マスの内訳）。実ブラウザ：qa-e2e-chapter1 の CH1-B4（分かれ道）・CH1-B12（クロスフェード）、qa-e2e-journey の JR-14〜16 を書き直し。シミュレーションは `node tests/chapter-sim.mjs 3000 cautious 1 forest`（5番目の引数＝分岐の道）
- 2026-10-02 夜の Audio 基盤の正式改修・第1弾の正式 BGM／SE の後：ふだんの実行は 914件（合格679・skip 235・失敗0。新しい tests/audio-manager.test.mjs＝AUDIO-1〜16（偽の Web Audio・`<audio>`・XHR で、BGM の増殖なし・A→B→C・合成音との二重再生なし・fallback・ミュートの全経路・unmute・mmaudio 互換・旧 sfx(n)・未登録・AudioContext の suspend／resume・Web Audio 無し・registry のファイルの実在・重複形式なし）。tests/game-feel.test.mjs の GF-01〜04 を新しい場面名・registry・audioSceneFor に書き直し）。実ブラウザ：tests/qa-e2e-feel.test.mjs の FE-7（市場＝MARKET・registry の登録あり）。FE-2 は出来事の並びから step（1マスごとの足音）を除いて比べる。harness は、再読み込みで途中だった BGM のダウンロードの中断（net::ERR_ABORTED・media）を失敗に数えない
- 2026-10-03 の Audio 改善・第2弾（iPhone 試遊の結果）の後：ふだんの実行は 917件（合格682・skip 235・失敗0。tests/audio-manager.test.mjs に AUDIO-17＝silent、AUDIO-18＝最初のタップの SE の予約、AUDIO-19＝開始の1音・名前登録まで TITLE・VS／能力比較の MATCHUP・実戦の曲は FIGHT! のあと・ゴールは TOURNAMENT_ENTRY・STOP は ROULETTE_STOP・START と VS へのボタンは決定音なし）。実ブラウザ：qa-e2e-feel の FE-7（Chapter 1 は silent）
- 2026-10-03 の Audio 改善・第3弾（alkakrab Vol.3 の採用・ループ区間・SE の maxMs）の後：ふだんの実行は 920件（合格685・skip 235・失敗0。tests/audio-manager.test.mjs に AUDIO-20＝ループ区間のクロスフェード・ended・鳴らせないときに戻す・場面の切り替え、AUDIO-21＝SE の maxMs、AUDIO-22＝registry のループ区間と第3弾のファイル）
- 2026-10-03 の試遊フィードバック反映（NG の音の無音化・サイコロの物理的な見せ方・Chapter 開始のタイミング・遭遇の演出・操作欄・大会の対戦前の統合・ファームの新しい背景）の後：ふだんの実行は 921件（合格686・skip 235・失敗0。tests/audio-manager.test.mjs に AUDIO-23＝第4弾の NG の音は silent・NG のファイルを使い回さない・大会開始の演出で音を鳴らさない・dice.stop は停止のフレーム。AUDIO-22・GF-03・CH1-35（イントロの時間）・CH1-36（遭遇）・DICE の時間（chapter-engine）・T4-2・T4-3・G2-1（ファーム）を新しい仕様に書き直し）。実ブラウザ：qa-e2e-chapter1 の CH1-B15（完全停止 → 出目＝dice.throw → land → stop → result）、qa-e2e-journey の JR-8（VS から直接 fight()）・自動停止の時間、qa-e2e-feel の FE-2・FE-4（遭遇：絵と文が同じフレーム・読める間）、qa-e2e-tech-screens（Battle 開始前の導入は大会では出ない）
- 2026-10-03 の品質向上（街・立ち絵・研究所・牧場・HUD・土台・サイコロの LOCK・対戦前の統合・はじめから・プロローグ・聖獣士）の後：ふだんの実行は 943件（合格708・skip 235・失敗0。新しい tests/quality-1003.test.mjs＝QU-01〜07、chapter-engine に CH1-38（進行ライン）・DICE-07（LOCK））。harness はプロローグを出さない（MM_QA_NO_PROLOGUE。open({ prologue: true }) で出す）。A・B の受け取り後：946件（合格708・skip 238）、実ブラウザ tests/qa-e2e-prologue.test.mjs（PRO-B1＝A→E の順・全文 → 次へ・文字が画面に収まる 390×844／375×667・再読み込みで出ない、PRO-B2＝スキップの2度押し）
- 2026-10-03 の総監査（マスの共通の基準・画面の切り替え・UI の SE 2つ・フィナの wave）の後：ふだんの実行は 934件（合格699・skip 235・失敗0。tests/audio-manager.test.mjs に AUDIO-25。CH1-30・GF-05・FA-1・M4-4 を書き直し）。実ブラウザ：qa-e2e-feel の FE-1（フェードアウト → 切り替え）
- 2026-10-03 のターン数の監査・75枚の素材管理表の後：ふだんの実行は 933件（合格698・skip 235・失敗0。tests/design-pack-1003.test.mjs に DP-06＝管理表と manifest の照合）。ターン上限の比較は `node tests/chapter-turns.mjs [回数] [ターン数の並び]`（テストではない道具）
- 2026-10-03 のデザイン素材一括（宝箱4種・会話UI・RIVAL の一瞬・レアの後光・アイテム屋）の後：ふだんの実行は 932件（合格697・skip 235・失敗0。新しい tests/design-pack-1003.test.mjs＝DP-01〜05：元ファイルの sha256・宝箱の派生と割り当て・アイテム屋・会話UI／RIVAL／レア・保存のみの素材。CH1-30・KR-5・DAN-7 を新しい素材・見た目に書き直し。qa-static-guards の読み込むスクリプトに js/fx/sequence.js）
- 2026-10-03 第5弾の BGM 仮採用（HydroGene 8曲）の後：ふだんの実行は 927件（合格692・skip 235・失敗0。tests/audio-manager.test.mjs に AUDIO-24＝割り当て・変えない曲・Royal Castle の連続再生（play() 1回）・実戦 → 結果で1本。AUDIO-22・23・GF-03・FE-7 を新しい割り当てに書き直し。NG の曲そのもの（Tranquil Radiance・Lost River・Event Music 3／4・Town-Village Theme 1・Dungeon-Exploration Music 1）は使わない）
- 2026-10-03 のバトル共通演出の正式素材（js/battle/fx.js）の後：ふだんの実行は 925件（合格690・skip 235・失敗0。新しい tests/battle-fx.test.mjs＝BFX-01〜04：30枚の保存・11枚の対応・重ならない／DOM を残さない・Phase 6 に触れない。同日の undefined の修正で BFX-05 を足して 926件・合格691）。tests/qa-static-guards.test.mjs の読み込むスクリプトに js/battle/fx.js
- 2026-10-04（第二段階 PHASE F：全画面監査・先読み・最終テスト・報告）の後：ふだんの実行は 994件（合格731・skip 263・失敗0）。実ブラウザテストも含めた全件（69ファイルを1つずつ・`QA_E2E=1`）は 1004件で失敗0（town-commands の TW-B1〜B4＝街の札5つ、qa-fix-g4 の B1・B3＝研究所の合体・大会進行に合わせて書き直した）。報告は REPORT_2026-10-04.md
- 2026-10-04（第二段階・追加アセット：Chapter 1 のイベント挿絵 12枚・主要 NPC の表情 32枚）の後：ふだんの実行は 1009件（合格739・skip 270・失敗0。新しい tests/event-npc-assets-1004.test.mjs＝AS-01〜08。旧い表情名・画像の場所を確かめていた NPC のテスト（karen-market・dan-farm・nick-ranch・elliot-lab・vargas-arena・cedric-tour・genshin-training・qa-fix-g5・npc-talk・design-pack-1003・phase9）と events-1004・feel-1004 を新しい表情・イベントに書き直し）。実ブラウザに tests/qa-e2e-event-npc.test.mjs（EN-B1＝挿絵カード 390×844・375×667、EN-B2＝108枚の読み込みと透過、EN-B3／B3b＝場面ごとの表情、EN-B4＝表情を変えても立ち絵が動かない）。qa-e2e-events の EV-B1・B2 は挿絵の流れに書き直し
- 2026-10-04（第二段階 PHASE E：能力UPの成長演出・疲れの増減・休憩の帯・宝箱の光）の後：ふだんの実行は 994件（合格731・skip 263・失敗0。新しい tests/feel-1004.test.mjs＝FE2-01〜04。GF-09 を成長の行に書き直し）。実ブラウザに tests/qa-e2e-grow.test.mjs（GR-B1〜B3）
- 2026-10-04（第二段階 PHASE D：公式大会＝大会進行・パラメーター比較・VS の色・S クリアの導線）の後：ふだんの実行は 987件（合格727・skip 260・失敗0。新しい tests/tournament-1004.test.mjs＝TN-01〜05。QU-05・S6-8・P7-38 の呼び出し元・QA-G6-6 の afterBattle・cedric-tour・phase8 を新しい流れに書き直し）。実ブラウザに tests/qa-e2e-tournament.test.mjs（TN-B1＝390×844・375×667）。qa-e2e-journey JR-8・qa-e2e-raising-late・qa-e2e-chapter1・qa-e2e-tech-screens QA-TS7 はパラメーター比較（.p9cmps .pcgo）を経由する形に
- 2026-10-04（第二段階 PHASE C：研究所＝図鑑・合体・配合表・出発準備）の後：ふだんの実行は 980件（合格722・skip 258・失敗0。新しい tests/lab-prep-1004.test.mjs＝LP-01〜06）。実ブラウザに tests/qa-e2e-lab-prep.test.mjs（LP-B1〜B2＝390×844・375×667）。合体の実ブラウザテスト（qa-e2e-ranch-fusion-fuse）は museum('fuse') から
- 2026-10-04（第二段階 PHASE A・B：30ターン・サイコロの LOCK・SE の監査・イベント基盤・NPC イベント・リュウ）の後：ふだんの実行は 970件（合格716・skip 254・失敗0。新しい tests/events-1004.test.mjs＝EV-01〜08）。実ブラウザに tests/qa-e2e-dice-lock.test.mjs（DL-B1〜B3）・tests/qa-e2e-events.test.mjs（EV-B1〜B5）。harness は施設の初回訪問・帰還イベントを出さない（MM_QA_NO_NPC。open({ npc:true }) で出す）。2択の出来事は MM_QA_NO_STORY のとき最初の候補を自動で選ぶ（シミュレーション tests/chapter-sim・turns・balance はランダムに選ぶ）
- 2026-10-04 PHASE G（実機試遊の改善）の後：ふだんの実行は 1028件（合格739・skip 289・失敗0）。実ブラウザテストも含めた全件（72ファイルを1つずつ・`QA_E2E=1`）は 1038件で失敗0（2周目で失敗した QA-NG2 はテストの古い期待値＝直して単独・ファイル全体で合格）。新しい tests/qa-e2e-polish-g.test.mjs＝G-A〜M（§3 の「実機試遊の改善」）
- 2026-10-04 PHASE H（ベースキャンプ・牧場20体・聖獣士管理局・NPC の立ち絵の規格・サイコロの停止の根本対策・プロローグの文章・大会ランクの状態）の後：ふだんの実行は 1049件（合格746・skip 303・失敗0）。実ブラウザテストも含めた全件（74ファイルを1つずつ・`QA_E2E=1`）は 1055件で失敗0。新しい tests/phase-h-1004.test.mjs（PH-01〜07）・tests/qa-e2e-phase-h.test.mjs（H-A〜E）、tests/qa-e2e-dice-lock.test.mjs に DL-B1（2サイズ×出目1〜3・画素の比較）・DL-B4（メインスレッドの停止）
- 2026-10-04 PHASE I（追加素材の局所統合：能力UPの道具・結果演出・ランク選択の青＋金・開始の音・立ち絵の切れ）の後：ふだんの実行は 1060件（合格750・skip 310・失敗0）。実ブラウザテストも含めた全件（77ファイルを1つずつ・`QA_E2E=1`）は 1066件で失敗0。新しい tests/rank-ui-1004.test.mjs（RK-01〜03）・tests/qa-e2e-result-fx.test.mjs（RF-B1〜B3）・tests/qa-e2e-integrate-1004.test.mjs（IN-B1〜B3）、tests/audio-manager.test.mjs に AUDIO-26
- 2026-10-05（次期総合改修：正式プロローグ4枚・序盤の導線・世界地図・正式ステータス画面・サイコロの完全停止・操作欄・短いイベント）の後：ふだんの実行は 1074件（合格756・skip 318・失敗0）。実ブラウザテストも含めた全件（79ファイルを1つずつ・`QA_E2E=1`）は 1080件で、失敗3件はいずれもテスト側（配置の seed しだいで止まる先が野生のバトルになる CH2-B5・見た記録に tut_turns が入る EV-B1／B3）＝直してファイルごとに再実行し合格（qa-e2e-chapter2 5/5・qa-e2e-events 5/5）。新しい tests/next-1005.test.mjs（NX5-01〜06）・tests/qa-e2e-next-1005.test.mjs（OP-B1＝序盤の導線 2サイズ、OP-B2＝登録済みの古いセーブ、ST-B1＝ステータス 2サイズ、DK-B1＝操作欄 2サイズ、MO-B1＝短いイベント）。harness は序盤の導線を出さない（MM_QA_NO_OPENING。open({ opening:true }) で出す）。tools/public-check.mjs は新しい序盤（プロローグ4枚 → フィナの2択 → 管理局 → セルジュ → 登録 → 世界地図 → 街）を通す
- 2026-10-05 夜（正式 BGM・正式 SE 15種・プロローグの固定同期）の後：ふだんの実行は 757件合格・失敗0（tests/audio-manager.test.mjs に AUDIO-27）。実ブラウザ：tests/qa-e2e-prologue.test.mjs の PRO-B1（2サイズ・タップしても時刻が変わらない・Scene と BGM の位置）・PRO-B2（スキップ後に BGM が残らない）、tests/qa-e2e-next-1005.test.mjs の PRO-B4（裏に回って戻る）、新しい tests/qa-e2e-se-1006.test.mjs（SE-B1〜B5：サイコロ1回・道具 → 能力UP・宝箱の段階・遭遇3種・購入の失敗／成立・正式音源の読み込み）
- 2026-10-06（追加修正・2：マスの並び・ベースキャンプ・会話の読む間・禁則・新人支援・0G・世界地図・街の名札・TEST 大会）の後：ふだんの実行は 764件合格・失敗0（tests/next-1006.test.mjs）。実ブラウザテストの全件（82ファイルを1つずつ）は1回目で 1106件中 25件が古い期待値（初期 300G・補填・ダンの常設・会話の読む間）＝テスト側を新しい仕様に直し、該当の14ファイルを再実行して合格。harness の finishTalk／chooseTalk は回数を多めに（240）
- 2026-10-05 PHASE B（タイトル BGM の廃止・プロローグ v6・凍結で見た扱いにしない・新しいゲームの確認・会話の改行ずれ・正式の会話窓・システム通知の帯・薬草のアイコン・名札・管理局の BGM・リュウ・大会ランクの正式 UI・アイテム管理・補給所）の後：ふだんの実行は 774件合格・失敗0（新しい tests/phase-b-1005.test.mjs）。実ブラウザ：tests/qa-e2e-phase-b.test.mjs（PB-B1〜B6）・qa-e2e-prologue の PRO-B5／B6。実ブラウザテストの全件（84ファイルを1つずつ・c991c41）は 1127件中 1124件合格・3件失敗＝① IN-B2（開始の音がタップから 430ms＝開始画面の BGM が無くなり音の読み込みがタップの後になった）→ 開始画面で TITLE_START のファイルを先に読む（MMAUDIO.prefetchSe）② QA-G3-B2（「最初からやり直す」のあとの開始に新しいゲームの確認が入った＝古い期待値）③ TL-B1（Playwright の click の待ちで 2回目のタップが 0.3秒を超えた＝タップの間隔をページの中で測る）。直して該当の3ファイルを再実行して合格
- 2026-10-05 夜（実機試遊の修正＋リュウ／レグナス）の後：ふだんの実行は 1140件（合格784・skip 356・失敗0。tests/trial-1005.test.mjs・AUDIO-28・PB-11 を追加）。実ブラウザテストの全件（86ファイルを1つずつ・3cddbc7）は 1150件中 1147件合格・3件はテストの古い期待値（ベースキャンプの名前の帯＝QA-G4-B2／B4、管理局の聖獣士証が最初から開いている＝TW-B2）→ テストを新しい仕様に直し、5fb57b3 で全件をもう一度回した＝1150件中 1149件合格・1件（PB-B5＝アイテム管理の薬草のアイコンを画面が出た瞬間に「読み込み済み」と確かめていた＝タイミング）→ 読み込みを待つ形に直し、そのファイルを2回再実行して合格。実ブラウザ tests/qa-e2e-trial-1005.test.mjs（TB-1〜8）
- 2026-10-06・4（本体修正＋大会UI統合＋技アニメ＋バトル演出）の後：ふだんの実行は 1189件（合格803・skip 386・失敗0。新しい tests/battle-1006.test.mjs＝MV-01〜05、tests/tournament-1004.test.mjs の TN-02・TN-03 を大会1・2 に書き直し＋TN-03b）。実ブラウザ tests/qa-e2e-1006b.test.mjs（TB-B1＝大会1→2→3→バトル 4サイズ、TB-B2＝8体、ST-B1＝バトルの演出の時間、MD-B1＝技辞典）。harness は MM_QA_NO_STAGE（バトルの共通演出）・MM_QA_NO_TOURVS（大会3）を既定で切る（open({ stage:true })・open({ tourvs:true })）
- 2026-10-06・5（大会・状態異常・固有スキル・技習得ルートの正式仕様の差分）の後：ふだんの実行は 1200件（合格811・skip 389・失敗0。新しい tests/battle-rules-1006.test.mjs＝BR-01〜08、phase8 の S5-2〜4・S6-6・phase9 の T3-6・qa-raising-logic の QA-RL26／27／40・phase10・phase-b-1005 の PB-06・battle-1006 を新しい仕様に書き直し）。実ブラウザ tests/qa-e2e-rules-1006.test.mjs（RB-B1＝1試合目の勝利で賞金・ランクアップを出さない、RB-B2＝ねむり、RB-B3＝まひ）
- 2026-10-07（今回差分の最終統合）の後：ふだんの実行は 1205件（合格816・skip 389・失敗0。新しい tests/diff-1007.test.mjs＝RX-01〜02・DF-01〜03。プロローグ6枚・大会2 の刷新・リュウ／セドリック・コマンド画像の data-cmd に合わせて NX5-01・QU-01・PB-02・TN-03／03b・PH-01／03／05・T4-2・NICK-6・TR-02・UB-03・F2-1・QA-C14・CED-4・CH1-29・S6-8・BR-07・QA-G4-2 を書き直し）
- 2026-10-07 夜（BGM 14曲・セドリックの会場背景・UI 再回収）の後：ふだんの実行は 1206件（合格817・skip 389・失敗0。tests/audio-manager.test.mjs に AUDIO-30、AUDIO-22／24・GF-03・PB-01 を新しい BGM に書き直し）
- 2026-10-08（監査後の仕様確定差分）の後：ふだんの実行は 1237件（合格836・skip 401・失敗0。新しい tests/spec-fix-1008.test.mjs＝SF-01〜08）。実ブラウザ tests/qa-e2e-spec-1008.test.mjs（SF-B1・SF-B2）
- 2026-10-08（深層監査の修正・第1便）の後：ふだんの実行は 1252件（合格845・skip 407・失敗0。新しい tests/audit-fix-1008.test.mjs＝AF-01〜07）。実ブラウザ tests/qa-e2e-audit-1008.test.mjs（AF-B1〜B6）。stale だった TB-4・QA-G4-B3・JR-6・JR-7・CH1-B14（バトルの案内の見出し＝遭遇の文）・QA-RL4（参加者の札の文字・試合数の見出しが無い対戦表）・CH2-B3（見出し）・JR-14／QA-G3-B6（成長量 A25〜E11）・QA-G2-B3（未習得の技のパネル）を今の画面・仕様に合わせて書き直した。名前の正規化で QA-G4-B1〜B5・QA-NG5・QA-BY13 の期待値を、大会の終わりの順で CED-B1（初めての大会の一言を先に送る・締めの会話の間は結果の画面が隠れる）を合わせた。CH1-B17 の不安定（VS のカットインの枠が画面の外から滑り込む途中で測っていた＝375×667 で 3回に1回）は、両方の枠が画面に入りきって動きが止まってから測る形にした（直したあと 8回連続で合格）
- 2026-10-08（正式素材の統合・次便）の後：ふだんの実行に tests/assets-1008.test.mjs（AS8-01〜07）・AUDIO-34。実ブラウザ tests/qa-e2e-assets-1008.test.mjs（AS8-B1〜B6）。文字列で確かめていた TN-03b・TF-02・SF-05 相当（RANK_UP_ART）・PH-05・TR-08・AUDIO-24 を書き直した
- 2026-10-08（深層監査の修正・第2便）の後：ふだんの実行は 1268件（合格849・skip 419・失敗0。AUDIO-32〜33・BR-09 を追加）。実ブラウザ tests/qa-e2e-prod-1008.test.mjs（PR-B1＝本番の設定で大会を最後まで・PR-B2＝野生の練習試合と降参・PR-B3／B4＝メニューと8体の対戦表 4サイズ・PR-B5＝壊れた大会データ・mr4ng）。文字列で確かめていた T2-2・T4-2・PH-01・QU-05／06・TD-2・S3-6・QA-G4-2 と、仮の大会データ（{ round: 2 }）を使っていた T1-9 を書き直した
- 2026-10-08（Chapter 1 Pattern A 正式ボード）の後：ふだんの実行に tests/board-1008.test.mjs（BD-01〜07。BD-01＝ゲームの中身のグラフが 2026-10-06 と同じ＝sha256）。実ブラウザ tests/qa-e2e-board-1008.test.mjs（BB-1＝背景をまたぐ移動 3サイズ・BB-2＝再読み込み・BB-3＝分かれ道 A 2サイズ・BB-4＝Scene14 → 到着 → 受付・BB-5＝視差を減らす設定・BB-6＝背景の 404・開発用の表示）。CH-ENGINE-01・CH1-12〜13・CH1-25〜28・CH1-30・N6-01・GF-08 を新しい背景・Scene 番号に書き直した
- 2026-10-07 深夜（正式UI回収）の後：ふだんの実行は 1208件（合格819・skip 389・失敗0。新しい tests/ui-recovery-1007.test.mjs）
- **テスト運用（2026-10-01 正式）**：ふだんの開発は「実装 → 関連テスト → commit → push → public-check」。51ファイルの全件実ブラウザテストを push の前提にしない（大きな節目では push の後に全件を回す）。既知の不安定なテストが落ちたら、変更との関係を確かめ、明らかに不安定なものだけ1回再実行して合格なら既知として報告する（何度も再実行しない）。小さな修正では公開版の手動操作確認は不要で public-check を基本にする。

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
- 通常の全文検索では legacy/ を対象にしない。リポジトリ直下の .ignore に `legacy/` を書いてあり、rg（Claude の Grep を含む）は自動で除外する。Git の追跡・GitHub Pages・テスト（sha256 照合）には影響しない。
- legacy/ が必要な調査では、パスを明示して対象にする（例：`rg -M 500 -n 語 legacy/index.original.html`。ディレクトリ全体を検索するなら `rg --no-ignore`）。
- index.html はゲーム本体なので検索対象から外さない。ただし rg／grep の結果に巨大な行をそのまま出さない：
  - rg は最大行長を制限する（例：`rg -M 500`。長すぎる行は `[Omitted long matching line]` と表示される）。grep を使うときは `| cut -c1-300` などで切る。
  - 画像・base64 の中身を見る必要がないときは、コードの部分だけを対象にする（行長の制限、または base64 の行を避けた行範囲の指定）。
  - index.html を Read するときは、行範囲（offset／limit）を指定し、base64 の行を含む範囲を丸ごと読まない。
- git diff／git log -p／git show で大きな変更を確認するときは、先に `--stat`／`--numstat` で規模を確かめる。画像や base64 の行を変えたコミットは diff が数MBになる（例：6ec343d は約9.5MB）ので、全文を表示しない（必要ならファイルを絞り、`| cut -c1-300` などで切る）。

## 3. 確定済みの正式仕様

### モンスター（原種4体）

| species ID | 内部番号 | 名前 | 種族 | ライフ | ちから | かしこさ | 命中 | 回避 | 丈夫さ | 素早さ |
|---|---|---|---|---|---|---|---|---|---|---|
| solamo | 0 | ソラモ | 獣種 | 100 | 100 | 100 | 100 | 100 | 100 | 5 |
| gauru | 1 | ガウル | 鳥種 | 80 | 110 | 110 | 90 | 90 | 60 | 7 |
| nobiton | 2 | ノビトン | 獣種 | 120 | 80 | 80 | 80 | 50 | 100 | 2 |
| jiol | 3 | ジオル | 岩石種 | 90 | 120 | 40 | 50 | 30 | 150 | 1 |

- species ID（solamo・gauru・nobiton・jiol）は表示名と別の安定したIDとして使う。
- 素早さは 1〜10 で、10 が最速。
- 正式画像は assets/monsters/ を使う。CSS の filter・hue-rotate などで色を変えない。
- **成長適性（2026-10-02 正式）**：各モンスターの6能力それぞれに A〜E（A が最も伸びやすい）。能力マスの上昇量は **A +25・B +21・C +18・D +14・E +11（2026-10-08 正式・全 Chapter 共通の1つの表。§3「監査後の仕様確定差分」。旧：A+7〜E+3 と Chapter 1 だけの A5〜E2 の二重）**（表は js/phase10/monsters.js の GROWTH_GAIN の1か所。SPECIES[].growth、個体ごとの m.growth（合体個体など将来用）があれば優先）。ソラモ＝C/C/C/C/C/C、ガウル＝ライフ D・ちから B・かしこさ B・命中 C・回避 B・丈夫さ E。ノビトン＝ライフ B・ちから D・かしこさ D・命中 D・回避 E・丈夫さ C、ジオル＝ライフ C・ちから A・かしこさ E・命中 D・回避 E・丈夫さ A（2026-10-02 正式。4原種とも登録済み）。適性はモンスターごとのデータ（SPECIES[].growth）で、種族名の分岐は書かない。将来ステータス画面で表示するときも MMP10M.growthOf を読む。新しい種族で未登録なら【暫定】C（GROWTH_UNREGISTERED）。

### 能力と色

- 6能力：ライフ・ちから・かしこさ・命中・回避・丈夫さ（内部キー li・po・in・hi・ev・de）。素早さは6能力とは別に扱う。
- 能力の色（2026-10-06 正式＝index.html の STAT_COLOR）：ライフ #F2C14E・ちから #D9534F・かしこさ #5CB85C・命中 #F06292・回避 #7FD4E8・丈夫さ #4C7BD9。
- 特訓場の色：ちから＝橙〜赤、かしこさ＝緑、命中＝ピンク、回避＝青、丈夫さ＝紫

### 育成ボード

- ノード式・サイコロ式・ターン制を維持する（自由移動のRPGにはしない）。
- **ターン数（いまの正式）：Chapter 1＝45ターン・公式マス84・1回の旅64歩（2026-10-06。§3「次期総合改修・2」。能力マスの上昇量は 2026-10-08 から全 Chapter 共通の GROWTH_GAIN＝A25 B21 C18 D14 E11）。Chapter 2（40）・Chapter 3・4（旧ボード 20）は変えていない＝未決。** 以下は旧記録（履歴）：〔旧〕ターン数の正式仕様（ユーザー確認 2026-10-03）＝Chapter 1〜4 すべて 30ターン。2026-10-04：Chapter 1 は 30 にした（ch1a.js rules.turnLimit 30・公式マス 60 → 54。途中のセーブの m.raise.turnLimit はその値のまま）。Chapter 2（40）・Chapter 3・4（旧ボード 20）は未調整＝ユーザー判断（Chapter 2 は 30 では約0%が届かない）。以下は 2026-10-03 の監査の記録：
  - 定義の場所：Chapter 1＝js/chapter/configs/ch1a.js の rules.turnLimit（40）、Chapter 2＝js/chapter/configs/ch2a.js の rules.turnLimit（40）、Chapter 3・4（旧ボード）＝js/phase8/raising.js の DEFAULT_TURN_LIMIT（20。CHAPTER_RULES の4つがこれを参照）。js/chapter/engine.js の既定値 30 は config に書いていないときだけ。
  - 出発のとき m.raise.turnLimit に確定してセーブする（途中のセーブはその値のまま。HUD・残りターン・ターン切れは m.raise.turnLimit を読む。Chapter の終了・育成完了で null）。旧配置の途中セーブを開始地点からやり直すとき（engine の sanitize）だけ config の値を入れ直す。
  - 30ターンにしたときの到達率（2026-10-03 監査・`node tests/chapter-turns.mjs 2000`。実物の進行をメモリ上の設定だけ変えて回した）：Chapter 1 森＝94.0%（休む方針 cautious）／95.6%（forced）、大橋＝80.0%／85.2%（40ターンなら全部 100%）。Chapter 2＝A・B とも約 0%（約70歩の道に 30ターンでは届かない。40ターンでも A 86.8%・B 74.6%）。Chapter 3・4（旧ボード）＝100%（20ターンでも 99.8%・平均 15.3）。
  - ＝Chapter 3・4 は 30 にしても安全。Chapter 1 は大橋の道で約2割、Chapter 2 はほぼ全員が大会に着けなくなるため、30 にするにはマス数・道の長さ（ボードの調整）の判断が要る（未決）。
- サイコロは 1〜3（旧記録：通常Chapterは 20 ターン）。
  - 分岐ルート用の 1〜6 サイコロは正式仕様にあるが、振る場面は未実装。
- 出目の数だけ1地点ずつ進む。通過地点では効果を出さず、最終停止地点だけ効果を出す。ゴールに着いたら残りの移動は消える。
- Chapter 1〜4 の内部テーマは meadow・coast・sky・volcano。Chapter 1 の大会は挑戦上限 D。
- 最終ルート：Chapter 4 終了時に A ランク以上をクリアしていれば進む。マップが未登録のため、現在はChapter間ファームから「育成を完了して街へ戻る」代替処理で完了する。マップを登録すれば通常の進行になる。
- 育成を始めると、育成完了か育成放棄まで街へ戻れない（中断・再開はできる）。
- Chapterボード上に NPC（フィナを含む）を置かない。
- **Chapterフィールド（2026-09-30。Chapter 1 から）**：Chapter 1 は js/chapter/ のエンジン＋config（Pattern A「大橋と清流の草原」）で動く。Chapter 2 は 2026-10-01 から同じエンジン（ch2a.js「潮風の海岸」Pattern A「海岸地方」）。Chapter 3〜4 は従来のボード（20ターン）のまま。
  - **Chapter 1 Pattern A の60マス再設計（2026-10-02。正式。下の「正式背景・60マス…」の 1本道・背景ごとのマス数・通常マスの通過専用は旧構成の記録）**：
    - 構成：共通区間（01〜05）→ 05 の最後のマス＝分かれ道（p5_3）→ 森の道（06 大樹の森・07 深い森の小道）／大橋の道（08 水道橋の見える道・09 天空の大橋）→ 10 風の丘の最初のマス＝合流（p10_0）→ 終盤（11〜13）→ 14 大会会場の門前（通常 → 通常 → ゴール p14_2。**2026-10-04 G3：ライバル（強制停止）は道中の p5_0 へ移した**。旧：p14_0）→ 到着イベント（2026-10-04 G4：門前 → 会場の中のロビー → フィナ）→ ランク選択。背景は今ある正式背景14枚だけ（分岐用の新しい背景は使わない）。1回の旅で通る背景は12枚。
    - **公式マス60（スタートを含まない。森・大橋の両方を合わせた全体）**：通常19・能力18（ライフ・ちから・かしこさ・命中・回避・丈夫さ 各3）・野生6・イベント6・宝4・休む3・ライバル1・分岐／合流2・ゴール1。区間：共通23（分かれ道を含む）・森8・大橋10・合流後19（合流・ライバル・ゴールを含む）。1回の旅：森 50歩・大橋 52歩。森＝能力4・イベント・休む・宝、大橋＝野生2・能力2・イベント・宝。
    - 背景ごとの公式マス数（固定の「1枚 N マス」は無い）：01 4（＋スタート）・02 5・03 5・04 5・05 4・06 4・07 4・08 4・09 6・10 5・11 4・12 4・13 3・14 3。座標は道の中央線の上（画像を見て置いた値。等間隔ではない）。
    - 配置は固定（ランダムに並べ替えない。config の BACKGROUNDS[].nodes の種類のとおり。layoutRules.fixed）：同じ能力が続かない・野生が隣り合わない・序盤10マスに野生なし・休むは序盤に固まらない・イベントは全体に散らす・ライバルはゴールの2つ手前。Chapter開始時に seed で決めるのは中身だけ（イベントの内容＝eventPool の回復以外、休む＝回復のイベント、宝箱の段階、野生がレアモンスターマスになるか＝10%）。内訳は MMCH.tileCensus／censusErrors（layoutRules.expect）で確かめる。
    - **通常マスは止まれる公式のマス**（旧 rules.passNormal＝通過専用は廃止）：出目に数え、止まると何も起きずにターンが終わる。歩きの見た目の経由点（paths[].pts の道の中央線の点）はマスではなく、出目に数えない。分かれ道・合流も止まれる（何も起きない）。分かれ道にちょうど止まったら、次のターンの最初の1歩で道を選ぶ。
    - 分かれ道の見せ方：左右の門（正式素材 tiles/branch_gate_left・right。森＝左・大橋＝右）を道の上に立て、下の選択シート（森の道／大橋の道。説明は【暫定】）。モンスターはシートより上に見えるようカメラを合わせる。選ぶと選んだ道の背景へ歩きながら切り替わる。分かれ道・合流のマスは正式素材（tile_branch・tile_merge）。
    - **背景の切り替え＝歩きながらのクロスフェード**（config.backgroundTransition { type:'crossfade', ms 460, outMs 260, out 80, back 90, enterMs 540 }）：前の背景の最後のマスから止まらずに歩き続け、次の背景を下に作って、前の背景を約0.46秒で透明にしながら（歩いて入る 0.54秒の間に終わる）次の背景の入口のマスへ歩いて入る（画面上のモンスターの位置を合わせてからカメラは追従で自然に戻る）。暗転しない・境目はマスではない・歩行アニメは途切れない。
    - **2026-10-03 品質向上（HUD・土台）**：HUD を全面刷新＝上に細い進行ライン（START → GOAL。育成中の子の小さな顔が今の位置に。進み具合は MMCH.progressOf＝進んだ地点 ÷（進んだ地点＋ゴールまでの残り）。ターン数ではなく道の上の位置。分かれ道のあとは選んだ道、選ぶ前は短いほう。森 50歩・大橋 52歩）、その下に小さなチップ（Turn・疲れ・所持金＝硬貨の印・特訓チケット＝**正式アイコンが無いので文字**）。共通の土台＝tileUI.base（正式素材 tiles/pedestal_common.webp をマスの絵の下に敷く。幅＝マスの 1.25倍・マスの絵は上面の中心に 0.9倍。土台はマスの絵の代わりにしない）。土台を敷いたので size.fitScale を 0.72 → 0.66（区分の比率はそのまま。土台を含めた幅＝見えている道幅の 通常 45%・能力 48%・宝／イベント 51%・バトル等 54%）。
    - **マスの大きさの統一・見え方（2026-10-03 夜・試遊で「大きさがバラバラ・薄い」。いまの正式）**：tileUI.size.uniform { w 193, pow 0.9, roadMax 0.62, opacity 1 }＝外側の土台の大きさは**マスの種類・背景の道幅に関係なく奥行きだけ**で決める（w × 奥行き^pow。種類の違いは中の紋様・色だけ）。道の絵が細い所だけ、見えている道幅 × 0.62 を上限（土台を含めて道幅の 78% 以下。60マス中 4つだけ少し小さくなる＝p2_4・p6_3・p7_3・p13_2）。奥のマスも薄くしない（opacity 1。旧 farOpacity 0.62）。紋様の輪郭と金の発光（.chf-tile.pb.u の drop-shadow。絵の色は変えない）。使ったマスは .used 0.68。下の roadFit・fitScale・区分の比率は旧方式（uniform が無い config だけ）。
    - **マスの大きさ（2026-10-03・試遊で最優先）**：tileUI.size.roadFit＝その地点で見えている道幅（絵の道幅と、その奥行きのカメラで画面に入る幅＝背景の幅 ÷ ズーム の小さいほう。field-view の seenRoadW）に対する割合：通常マス 0.55・能力 0.58・宝／イベント／休憩 0.62・バトル（野生・レア・ライバル）／分かれ道／合流／ゴール 0.66。旧（基準 186px × 奥行き^0.82）は見えている道幅の約37〜41%（狭い所で最大89%）だった。縦の潰れ（flat）・奥ほど控えめ（farOpacity）・配置・マス数・ルートは変えていない。390×844 で手前の能力マス 約226px・バトル 約257px（画面の幅）。**2026-10-03 総監査で共通の基準 size.fitScale 0.72 を追加**（区分の比率はそのまま・全体を 0.72 倍＝実際は道幅の 通常 40%・能力 42%・宝／イベント 45%・バトル等 48%。390×844 で p3_1 226→163px・p9_1 264→190px）。下の「台座」の大きさの記述は旧方式。
  - **地面に埋め込んだ台座（tileUI.pedestal。CSS だけ・マスの絵は作り直していない）**：地面 → 薄く短い接地影 → 薄い石の台座（厚み）→ 金属の縁 → 正式のマスの絵。通常マスは絵の無い台座の石の面だけ（少し小さく控えめ）。遠近：大きさ＝基準 190px × 奥行き^0.7、縦の潰れ＝奥（d 0.4）0.30 〜 手前（d 1.12）0.52 で補間（奥ほど小さく平たい楕円・手前ほど大きく円に近い）。ノードごとの上書きは nodes の4番目 { s, f }。
    - シミュレーション（各3000回・休む方針 cautious。ターン上限 40・疲れ・能力の値は変えていない）：森＝到達 100%・平均 26.9・中央値 27・p90 30・最遅 35、大橋＝到達 100%・平均 28.6・中央値 29・p90 31・最遅 38。止まる回数（森／大橋）：能力 7.9／6.9・イベント 4.0／3.5（うち休む 1.5／1.0）・バトル 3.0／4.0・宝 1.5／1.5・通常 8.3／9.8。
  - **Chapter 1 Pattern A の正式背景・60マス・大会到着・正式マスUI（2026-10-02。正式。下の「Chapter 1 の新しい正式背景（2026-10-01 夜）」の背景10枚・ノードID f1_〜f10_ は旧構成の記録）**：
    - 背景14枚（assets/fields/ch1a/final/field/ch1_bg_01〜14。762×1536）を 01→14 の順に1回ずつ通る1本道。表示名は【暫定】（final/README.md）。ノードID は w1_〜w14_（旧構成と重ならない ID にし、古い途中セーブは既存の安全処理で Chapter 1 の開始地点（0ターン）から＝能力・所持金・疲れは保つ）。
    - **総マス数 60（59歩）**：最初の指定は「01〜14 で合計90マス」だったが、40ターン・サイコロ1〜3 では 90マスに届かない（休まなくても到達 約3%、疲れ込みでほぼ0%）ため、ユーザー判断（2026-10-02・案B → 追加指示で 60）。背景ごとのマス数＝01 5・02 5・03 5・04 5・05 3・06 3・07 3・08 4・09 6・10 5・11 5・12 4・13 4・14 3（各画像の使う範囲の道の長さ（奥行き補正込み）に比例。同じ数にはしない）。
    - マスの座標はデータ（config の BACKGROUNDS[].nodes＝[x, y]。エンジンの path.nodePts）。各背景の道の中央線（目視の [y, x, 半幅]）の上に、手前 y 0.87 から「道が細くなりすぎる手前」まで奥行き補正で等間隔（奥ほど間隔が狭い）。背景の最奥（遠景の道）まではマスを置かない。背景ごとのカメラは BACKGROUNDS[].camera で上書きできる（今は全部 near 1.45・far 2.15）。
    - シミュレーション 1000回（`node tests/chapter-sim.mjs 1000`）：cautious＝到達 99.9%・平均 32.3・中央値 32、forced＝到達 100%・平均 31.7。
    - **マスUI（config.tileUI。2026-10-02 正式素材）**：各マスの座標（ノードの止まる位置）の地面に、マス種別ごとの正式素材（assets/fields/ch1a/tiles/。ZIP mystic-monsters-board-ui-assets-complete-2026-10-02 の JPEG に焼き込まれた市松模様を取り除いて透過 WebP にしたもの。tiles/README.md）を置く（field-view の tilesHtml）。能力6種（stat_life〜stat_toughness）・野生 wild（赤い爪）・レアモンスター rare（深紅。ZIP の board_node_strong_enemy＝tiles/tile_rare_monster.webp）・ライバル rival（紫の交差した剣）・宝 treasure・休憩 rest（回復イベント）・？イベント event・ゴール goal。**強敵マスは正式のマスではない（2026-10-02）**：Chapter 1 の固定の強敵（旧 w9_3）は外し、ほかと同じ候補マスにした。宝箱は止まったときマスの脇に現れて開く（tileUI.chests：normal＝通常の宝箱 chest_normal_closed／open、special＝虹色の宝箱 chest_rainbow_closed／open。rare は従来の表示＝マスUIだけで、この2つを流用しない。中身・報酬は変えていない）。通常マス・スタートは正式素材が未着のため何も置かない。60個の座標・背景ごとのマス数は変えず、sprites に種別ごとの画像を書くだけで差し替わる（探す順＝種別名 → まとめた種類（stat・event・battle）→ normal）。大きさ＝基準 230px × 奥行き^0.65（size.depthPow。手前 約250px・奥 約130px＝背景の画素。縦は 0.46 に潰して地面に置いた見え方）。止まったマスが光り（.hit）、使ったマス（能力・イベント・宝箱）は少し暗く（.used）。位置確認の仮表示（マゼンタの点線と「仮 #番号」）は ?chdebug=1 のときだけ。tileUI.replacesLandmarks：同じ意味の旧目印（道端の石碑・イベントの物・道端の宝箱＝nodeLook）は出さない（素材ファイルは残す）。
    - **大会会場への到着（config.arrival）**：14 の最後のマス（ゴール w14_2）に着くと通常のフィールド進行は終わり、到着イベント専用の背景（final/event/ch1_bg_15_event＝公式大会会場・正門前。マス・サイコロ・操作欄なし）へクロスフェード → フィナの会話3行（「やっと着いたね、{name}さん！」「ここが公式大会の会場だよ。」「さあ、早速受付に行こう！」。{name}＝プレイヤー名、初期名アルト。この個体のこの Chapter で1回＝m.raise.field.arrivalSeen。再読み込みでは受付から）→ 大会受付。
    - **大会受付（index.html の p9ReceptionHtml。config.arrival のある Chapter だけ。Chapter 2 以降は従来の p8GoalHtml）**：参考画像（ZIP の tournament_rank_select_reference.jpg）の方向性で HTML/CSS で作った画面。上部「公式大会」の幕、上から S→E のランク（参考画像のとおり。参加できる下位ランクが下の「参加する」ボタンの近く）。参加できるランク（既存の MMP8.eligibleRanks＝解放条件は変えていない）は「参加可能」の札（人数・試合数・初回賞金）、それ以外は鎖と錠の「参加不可」（押せない）。ランクを選ぶ（フィナは見立てを話すだけ＝FINA_RANK_TALK）→「この大会に参加する」（選ぶまで押せない。選んだ直後0.35秒は無視）→ 既存の startTournament → 開始演出 → 大会本編（セドリックの進行）。下に「大会に参加しない」（既存の辞退＝2度押し）。
    - **【旧・廃止】通常マスは通過専用（2026-10-02 ユーザー判断。rules.passNormal。同日の60マス再設計で廃止＝通常マスも止まれる）**：60地点のうち、配置で効果が割り当たらなかった候補ノード（平均29か所＝効果の無い通常マス。正式アイコンが無く道の上に見えていた）は止まれない。出目は効果マス（能力・イベント・休憩・野生・レア・宝）とライバル・ゴールだけを数え、歩く途中で通常マスを通過する。ターンは必ず効果マス・ライバル・ゴールのどれかで終わる（何も無い道の上で止まって1ターン終わらない）。60地点の座標・つながり・マスの中身・数は変えていない。コード：engine の isWaypoint（DRIVER.isWaypoint）→ raising.js の step／chooseBranch は通過専用の地点では出目を減らさない。Chapter 2 は従来どおり。通常マスに止まっている古い途中セーブは、その場から次のターンで止まれるマスまで進む。シミュレーション（各3000回・休む方針 cautious）：到達 100%・平均 15.9・中央値 16・p90 18・最遅 24 ターン（旧：平均 32.2・中央値 32）。止まる回数（能力 6.5・イベント 3.7・バトル 2.9・宝 1.7）は旧と同じで、ターン数だけが約半分になる。ターン上限（40）は変えていない（30・35・40 のどれでも到達 100%）。
    - **Chapter開始の演出（2026-10-02 正式。js/chapter/intro.js）**：全景（俯瞰図）を止めて見せる（0.45秒）→「Chapter 1」がフェードイン（0.4秒）→「はじまりの草原」（0.35秒）→ 見せる（0.85秒）→ 消える（0.35秒）→ 全景の中を旅の開始地点（全景の下端の小道＝FIELD 1 の柵のある小道）へカメラが移動（1.25秒。最後の0.45秒で FIELD 1 へクロスフェード）→ ソラモ・マス・Chapter UI が現れる（0.3秒）→ START。全体 約3.9秒（実測：出発から START が押せるまで 約4.1秒）。イントロ中は Turn・疲れ・所持金・操作欄・マス・ソラモを出さない（#chfw.chf-intro）。画面タップで飛ばす（何回押しても1回だけ。飛ばすと最後の状態へすぐ移り、0.35秒は操作を受け付けない＝飛ばしたタップが下の START に届かない）。出すのは新しく Chapter に入ったときだけ（m.raise.field.introSeen。途中のセーブを読み込んでも出さない）。設定は config.intro＝{ label, name, overviews, camera:{ from, to, via }, patterns:{ [patternId]:{ overview, camera } }, timing }（camera の x・y は全景に対する割合、zoom は画面いっぱいに対する倍率。探す順＝patterns[patternId] → camera → 旧形式 goalFocus・startFocus・zoom・via＝Chapter 2）。Pattern B／C は patterns に足すだけ、Chapter 2〜4 も同じ仕組み（コードに Chapter 専用の値なし）。
    - **ソラモの歩行アニメ（2026-10-02）**：config.monsterSprites[種族キー].walk＝{ frames（01→08）, fps 12, idle 0（停止の絵＝01）, h 0.9（モンスターの箱に対する高さ）, noFlip }。field-view は全コマを重ねて置き（img.on だけ見せる。src は差し替えない）、移動の間（monsterAnimator の walk）だけ 01→08→01… をループ（12fps × 歩く速さ 55〜100%＝歩き出し・止まる前は少しゆっくり。1マス 約0.4〜0.5秒で 5〜6コマ）、着いたら 01。3マス連続・背景の切り替えをまたいでもループは途切れない。絵はその場歩行で、位置は moveAlong が動かす。後ろ姿なので左右反転・前傾はしない（noFlip）、CSS の上下動も止める（.chf-mon.spr.walk）。素材の無い種族（ガウルなど）は従来の画像＋CSS の上下動。カメラは anchorY 0.66→0.72（ソラモを画面の中央下へ、進む先の道を広く見せる）。背景をまたいで止まるとき停止の姿勢に戻らなかった不具合も直した（walkTo）。
    - **ガウル・ノビトン・ジオルの歩行と Chapter の演出（2026-10-02）**：歩行は config.monsterSprites の gauru（6コマ・9fps・後ろ姿）・nobiton（8コマ・12fps・横向き）・jiol（8コマ・12fps）。1周の時間は種族でそろえ、移動の時間は変えない（ソラモは変更なし）。演出（assets/fields/ch1a/effects/。README.md）：野生バトル突入のカットイン（野生のマスに止まったとき約0.6秒・レア／ライバルには出さない＝config.battleTypes.wild.cutin。encounter の待ち時間の中で出すので進行の時間は変わらない）、能力マスの結果の枠（config.effects.statUp。能力名・数値は HTML）、残りターンの警告（config.effects.turnWarning＝{ asset, at:[残りターン] }。発火ターンは未決＝at は空＝出さない）。使っていない UI 素材と理由は KNOWN_ISSUES.md。
    - **背景の切り替えの暗転（2026-10-02 の最終プレイ監査で修正）**：切り替えの途中で暗転（.chf-veil）が buildScene に消されていたため、真っ暗から新しい背景へ一瞬で切り替わり（その間に歩行のコマが 01 に戻り、大きさが 126→135→126px と跳ねるのが見えていた）。buildScene(m, fieldId, keepVeil) で切り替え中は暗転を残し、新しい背景の上で約0.28秒かけて明ける（元の設計どおり。switchField の veil2）。
    - 大会開始の演出（p9TourIntro。E〜S 共通）：ランクのロゴを大きく（光の輪・月桂樹・金の「RANK」の帯・「公式ランクE大会」）→ セドリックの一言 → 順位表。フィナは受付まで、大会本編はセドリック。
  - **Chapter 1 の新しい正式背景（2026-10-01 夜。下の「リアル巨大ボード方式」の背景15枚・分岐・ノードIDは旧構成の記録）**：背景10枚（assets/fields/ch1a/field/）＝01 旅立ちの草原 → 02 花の丘 → 03 森と清流 → 04 渓谷の小道 → 05 森の遺跡 → 06 天空の大橋（強敵 f6_3）→ 07 風の高原 → 08 古代遺跡の道（S字）→ 09 大会地方 → 10 大会会場（ライバル f10_3＝強制停止・ゴール f10_5）。表示名は【暫定】。01→10 の順にだけ1回ずつ通る1本道（橋／森の分岐は廃止＝ユーザー判断）。ノードID は f1_〜f10_（各背景 0〜5）。道の安全域は背景ごとの [y, x, 半幅]（曲がった細い道のため幅も点ごと。engine の roadAt は半幅を書いた点があればそれを補間、無ければ Chapter 2 と同じ消失点のモデル）。マスは各背景の手前 y 0.87 から道が細くなる手前（背景ごとの far）まで奥行きで等間隔。NODES＝各6【暫定】＝59歩（ノード60）。シミュレーション 1000回：到達 100%・平均 18.8〜18.9・中央値 19（`node tests/chapter-balance.mjs 1000`：各5＝49歩 平均15.5、各7＝69歩 平均22.2・到達99.6%）。導入演出は正式俯瞰図（会場＝上の右寄り → スタート＝下の草原へ）。古い Chapter 1 の途中のセーブは、配置が新しい構成に無いため既存の安全処理で Chapter 1 の開始地点（0ターン）からやり直しになる。
  - **Chapter 1・2 の通常 Chapter 仕様の統一（2026-10-01 夜・3回目。試遊用の値）**：Chapter 1・2 ともサイコロ 1〜3（rules.diceSides 3）・40ターン（rules.turnLimit 40）。4〜6 の停止画像・1〜6 の共通の仕組みは残す（回転中に見せる面も 1〜3 だけ）。Chapter 1 のカメラも約10%寄せた（fieldScenes[].zoom near 1.32→1.45・far 1.95→2.15）。Chapter 1 の背景・道・マス数（59歩）・イベント・強敵・ライバル・ゴールは変えていない。1000回（休む方針 cautious）：Chapter 1＝到達 100%・平均 32.3・中央値 32、Chapter 2 A（68歩）＝到達 88.0%・平均 37.0・中央値 37、Chapter 2 B（70歩）＝到達 75.8%・平均 37.7・中央値 38（平均・中央値は到達した回だけ）。ターン数・マス数の最終判断はユーザーの試遊後。
  - **Chapter 2 の進行の再設計（2026-10-01 夜・2回目。下の「Chapter 2 の正式背景」のマス数・サイコロ・ノードIDの一部は前の記録）**：サイコロ 1〜3（rules.diceSides 3。Chapter 1 は 1〜6 のまま。4〜6 の停止画像・共通の仕組みは残す）。マス数＝01 8・02 8・03 6・04 9・05 7・06〜07 分岐・08 7・09 8・会場前 5【暫定】。カメラは Chapter 1 より約10%寄せる（fieldScenes[].zoom near 1.45・far 2.15【暫定】）。強敵 s4_4（海上の大橋の真ん中のまま）・ライバル sa_2（強制停止）・ゴール sa_4。
    - **分岐（Chapter 共通の仕組み）**：config.paths の `branch`（道の名前）と `next`（複数＝分かれ道）、config.branches＝[{ at, options:[{ id, to, label, desc, lean }] }]。追加の画像なしで、同じ背景の太い道の上にノードを左右（道の中央 ± 0.42×半幅）に置き分ける。Chapter 2：06 の共通 s6_0〜2（s6_2＝分かれ道）→ A＝左の回廊 a6_（3）→ a7_（4）／B＝右の回廊 b6_（4）→ b7_（5）→ 07 の奥の合流 m7_0 → 08。A 68歩・B 70歩。分かれ道・合流は何も起きない地点（noSlot）。ラベル・desc・lean（報酬の傾向）は【暫定】（lean は空）。
    - 見せ方：分かれ道に着くと選択シート（プレイヤーが選ぶ。出目では決めない）と、それぞれの道の入口（最初の1地点）だけに光の印（.chf-brhint）。選ぶ前はどちらの道の目印も出さない（.chf-obj.brhide＝field-view の branchHidden）。選ぶと選んだ道の物だけが現れ、選ばなかった道の物は消える（.gone）。分岐の道の目印はいつも外側（paths[].landmark.fixedSide）。
    - セーブ：今の地点（m.raise.node）・選んだ道（既存の m.raise.field.branch）・分かれ道の待ち（pend.stage 'branch'・opts・left）は既存の項目のまま（形式は変えていない）。
    - シミュレーション（1000回・ターン上限を一時的に 60 にして計測。ゲームは 30 のまま）：A＝平均 37.6・中央値 38、B＝平均 38.8・中央値 39。30ターン以内の到達は ほぼ0%（A 0.2%・B 0%）、35ターン以内 A 21.5%・B 11.8%、40ターン以内 A 88.2%・B 75.2%。ターン上限・総マス数の最終判断はユーザー側（未決）。
  - **Chapter 2 の正式背景（2026-10-01 夜。下の「Chapter 2「潮風の海岸」（2026-10-01）」は旧構成の記録）**：背景10枚＝01 海辺の遊歩道 → 02 白砂の浜道 → 03 岬の古道 → 04 海上の大橋（強敵 s4_3）→ 05 珊瑚の遺跡 → 06 海底回廊の入口 → 07 海底の回廊 → 08 沈んだ神殿 → 09 夕凪の海道 → 10 大会会場への道（assets/fields/ch2a/arena/。ライバル sa_3＝強制停止・ゴール sa_5）。表示名は【暫定】。1本道・この順にだけ1回ずつ。ノードID は s1_〜s9_・sa_。海中（06〜08）は描かれた回廊・通路の床の上だけを歩く。NODES（05・07＝5、04・09＝7、ほか6【暫定】）＝59歩（ノード60）。シミュレーション 1000回（`node tests/chapter-sim.mjs 1000 cautious 2`）：到達 100%・平均 18.9・中央値 19。導入演出は俯瞰図 intro/ch2_intro_overview_v2.webp で会場 → 海上 → 海中（config.intro.via＝途中で見せる地点。intro.js の任意項目）→ スタート。旧 Chapter 2 の途中のセーブは既存の安全処理で Chapter 2 の開始地点（0ターン）から（能力・所持金・疲れは保つ）。
  - **Chapter 2「潮風の海岸」（2026-10-01）**：背景10枚（assets/fields/ch2a/road/）＝海岸地方を長く旅して大会会場へ。段階（config.STAGES）＝序盤 e1〜e3 → 中盤 m1〜m3 → 終盤 l1〜l3 → 会場前 z1 の順にだけ、各背景を1回ずつ通る（スライドショー・ランダムの並べ替えなし。各段階の3枚は景観のバリエーション）。1本道（分岐なし）。NODES＝序盤7・中盤7・終盤7・会場前6【暫定】＝68歩（ノード69）。骨格：スタート e1_0・強敵 l2_3（岬の大橋）・ライバル z1_3（強制停止）・ゴール z1_5（大会門）→ 既存の公式大会。ルール・サイコロ・操作欄・道の安全域・導入演出（育成個体 × Chapter の初回に1回）は Chapter 1 と同じ仕組み。シミュレーション（`node tests/chapter-sim.mjs 1000 cautious 2`）：到達 99.9%・平均 22.0 ターン・中央値 22。俯瞰図は正式素材 assets/fields/ch2a/intro/ch2_intro_overview.webp（演出専用。背景の順には入れない。会場＝右上 → スタート＝左下の大橋へズーム／パン）。表示名（白浜の海岸道…）は【暫定】。
  - **リアル巨大ボード方式（2026-10-01。正式。下の「13枚の旅」「操作欄の STOP」の記述は旧構成の記録）**：
    - 背景15枚（assets/fields/ch1a/road/）＝世界の中の巨大な古代街道。01〜04 共通 → 04 の奥の端で分岐 → 橋ルート 05A〜09A（短め・強敵 08A）／森ルート 05B〜09B（長め）→ 10 大会会場への道（合流・ライバル＝強制停止・大会門）。
    - **周回なし（2026-10-01 改修）**：背景はどれも1回だけ通る（鏡像・仮の背景は作らない）。1枚の中に複数のマス（config の NODES＝背景1枚あたりのマス数：共通 6・橋 6・森 8・会場 6【暫定】）を、道の中央線の上に手前（y 0.87）から奥（y 0.36）へ奥行き補正で等間隔に置く（engine の alongPersp。奥ほど画面上の間隔が縮む）。絵に描かれた輪（y≈0.84・0.60）と1対1ではない。
    - **道の中央線と安全域（fieldScenes[].road）**：背景ごとに { center:[[y, x]…]（画素計測＋目視の中央線。y 0.65 より手前は石畳が画面幅いっぱい＝0.5）, vanish 0.245（消失点）, slope 0.95, maxHalf 0.5, safe 0.7（半幅のうち使う割合。橋の上は 0.6） }。`MMCH.roadAt(scene, y)`＝{ x, half, left, right, safeLeft, safeRight }、`MMCH.clampToRoad(scene, x, y, bodyHalf)`。止まる位置（node.mx。nodeOverrides.monster を含む）は buildGraph で安全域に収め、画面側（field-view の setMonPos → roadX）は歩きの途中も体の半幅（config.monster.w 150 × 奥行き）ぶん内側に収める。road の無い背景（旧 Chapter・合成 config）は制限なし。
    - 【暫定候補・正式確定ではない】総マス数＝橋ルート 59歩／森ルート 69歩（ノード100）。ルートの長さは config（NODES）だけで変えられる。tests/chapter-balance.mjs の比較（2026-10-01、各1000回）：橋（急ぐ）＝到達100%・平均19.0・中央値19（p10〜p90 16〜22）、森（寄り道）＝到達100%・平均22.3・中央値22（19〜25）、自由＝99.9%・平均20.7。最終距離はシミュレーションと実際の試遊感を見てから決める（候補 G〜K は chapter-balance.mjs の CANDIDATES）。
    - ルール：サイコロ 1〜6（rules.diceSides）・30ターン・会場に着いた時点で移動終了→大会（残りターンは消える）・30ターンで着けなければ大会なし・ランクは上がらない・能力と持ち物は保持してファームへ→次の Chapter（rules.onTimeUp:'end'＝既存の timeup 経路）。通過は効果なし、停止だけ効果。例外は config の強制停止（forceStopKinds:['rival']）だけ。
    - ノードID（path id＋番号）：共通 f1_0〜5（01。スタート f1_0）・g1_（02）・g2_（03）・f2_（04。分岐 f2_5）、橋 a0〜5（05A）・a2_〜a5_（強敵 a4_3）、森 b0〜7（05B）・b2_〜b5_（各8）、会場 f3_0〜5（合流 f3_0・ライバル f3_3・ゴール f3_5）。
    - 見せ方：低いカメラ（fieldScenes[].zoom near 1.32・far 1.95。近景の石板2〜3枚だけが見える）、モンスターは輪の上、目印（石碑・祠・宝箱）は石板の脇（nodeLook gap 205〜215・tuft 無し）。街道の背景に環境素材は重ねない（landmarks／foreground は空）。
    - Chapter開始の演出（js/chapter/intro.js・config.intro）：出発直後に俯瞰図（intro/ch1_intro_overview_pattern1〜3.webp＝Pattern A／B／C。演出専用。プレイの背景の流用ではない）を全画面 → 「CHAPTER 1／はじまりの草原」→ 会場のほうから startFocus へズーム／パン（zoom 1.0→2.3・2.2秒）→ クロスフェードで 01 の実プレイ画面 → START。**表示の単位（2026-10-01 正式）＝育成個体 × Chapter の初回に1回**：同じ育成の再読み込み・再開では出さず、育成放棄のあとの別の個体や、次の Chapter（2〜4 にも同じ構造）では出す。判定は `m.raise.field.introSeen`（出発のたびに作り直され、Chapter の終了・育成放棄で消える配置の中。演出を始める前に true にして保存。セーブ v6 の任意項目）。ゲーム全体・sessionStorage の「見た」では判定しない。タップで短縮。視差効果を減らす設定では短く。
    - **サイコロは START の1タップ（2026-10-01 正式。STOP の操作は廃止）**（config.deck＝ui/deck_start.webp＋押せる領域 hit。deck_stop.webp はファイルだけ残し、使わない）：START を押すまでサイコロは画面に出さない（操作欄の上で浮く絵も無し）。START＝出目・ターン・疲れを確定して保存 → サイコロ（無地 dice_blank）が START の位置から出現して回り、自動で減速して着地（約0.98秒）→ 停止面 dice_stop_1〜6 を約0.42秒 → 消える（合計約1.7秒）→ 1地点ずつ移動 → 停止処理 → START に戻る。止まるタイミングは確率を変えない（出目は START の時点で保存済み。再読み込みでは残りの移動だけ）。演出・移動・停止処理の間は START も4コマンドも押せない（bBusy＋MMCHD.isLocked＋disabled。連打しても1ターン）。4コマンドは画像の上の透明なボタン（文字は読み上げ・テスト用に残す）。**4コマンドは操作ロックと見た目を分ける（2026-10-01）**：disabled でも暗くしない（.chwing.chwing-img:disabled は背景なし・opacity 1・filter なし）。中央の START の wait の見た目はそのまま。
    - フィナのリアクション：停止地点の結果 → MMCH.companionReaction → フィナの小さな吹き出し（.chf-fina。顔・名前・一言、約1.6秒）。本文は config.companion.reactions（未決＝空＝何も出ない）。
    - **HUD の固定位置（2026-10-01）**：HUD・操作欄はフィールドの器 .chfw（#app の中の position:relative）の中の absolute で、カメラ（.chf-cam の transform）とは独立。#app のスクロール量が残ると HUD が上へ押し出されるため、フィールドの間は #app を overflow:hidden（#app:has(>.chfw)）にし、chfBoard のたびに #app・main・ページのスクロール量を 0 に戻す（unscroll）。器の登場アニメは不透明度だけ（translateY で #app がはみ出さない）。
    - 同行者はプレイヤー・フィナ・育成中のモンスター（ダンは同行しない）。
  - **13枚の正式背景による旅（2026-09-30。旧構成の記録）**：背景1枚＝旅の一区間（FIELD）。旅の順は 01 旅立ちの草原 → 02 大橋の見える草原 → 03 清流のほとり → 04 小さな石橋 → 05 分かれ道の丘（分岐）→ 大橋ルート：06 橋のたもとの集落 → 07 大橋を望む道 → 08 大橋（強敵）／森の小道：09 古い石柱の道 → 10 森の小道 → 11 森の出口 → 合流：12 大会へ続く丘 → 13 大会会場の高原（ライバル・大会門）。config は fieldScenes（13）と paths（背景ごとの道：f1_・g1_・g2_・g3_・f2_（分岐 f2_3）／a・a2_・a3_（強敵 a3_2）／b・b2_・b3_／g4_（合流）・f3_（ライバル f3_4・ゴール f3_5））。歩数は大橋 44・森 48（1000回のシミュレーションで平均 24.5 ターン・到達 99%）。
  - 1枚の道に 3〜6 地点（1地点＝旅の一区間。1地点進むだけでも画面上で長い距離を歩き、3地点なら背景をまたぐ）。1地点 0.32〜0.62秒（config.motion：stepMs 430・baseLen 150）。道は各画像に描かれた土の道をそのまま使う（丸いマス・線・レールは描かない）。
  - 止まる地点の目印：石碑（stat）とイベントの物は着いたときに初めて現れる（config.landmarkVisibility：stat/event＝'arrive'、treasure＝'always'）。通常時の画面は背景とモンスターだけ。バトルは目印なし。各背景の環境素材は手前の草の帯（視差の前景）と手前を横切る草だけ。
  - サイコロの停止面：出目 1／2／3 と止まった面を必ず一致させる（config.dice.resultSprites＝dice_stop_1〜3.svg【暫定。正式画像が届いたら差し替えるだけ】。止まる瞬間に回転中の絵からクロスフェード。数字の輪は停止面が無いときだけ）。出目の文字は右上の小さな表示（.chroll「出目 3」）で短く出て消える。下の案内文には出目を出さない。
  - HUD：Chapter・Chapter名・背景名／Turn・疲れ・**所持金**（.chh-gold）／メニュー。
  - 操作欄：中央の円形 STOP を中心に、放射状の4コマンド（左上 アイテム chfItems・右上 休む chfRest・左下 技設定 chfOpen('w')＝既存の技管理 hall('w')・右下 ステータス chfOpen('st')＝既存の hall('st')。カプセル形・STOP とはわずかに離す）。移動・演出中はすべて押せない。
  - 3つのFIELD（旧：旅立ちの草原・大橋と清流・大会へ続く高原）の構成は 13枚の旅に置き換えた。止まる地点の目印だけを出し、ノードの丸・線・番号は出さない（?chdebug=1 のときだけ点と道筋を出す）。
  - **見せ方（2026-09-30 改修。「すごろくの駒」ではなく「モンスターと一緒に旅する」画面）**：
    - 画面：上〜中央＝フィールド（80〜82%）、下＝操作欄（18〜20%。`--chdeck`＝clamp(128px,19dvh,166px)）。操作欄は中央の大きな円形 STOP（#brollbtn。サイコロを止める＝振る）を、左の弧「アイテム」（.chitem）と右の弧「休む　疲れ −30」（.chrest）が包む。サイコロ（.chdf）はターンの始めに STOP の上で浮いて回る。案内文（#bmsg）は操作欄の上の行。
    - カメラ（field-view.js の DEF.camera。config.camera で上書き）：モンスターを画面の中央より少し下（anchorY 0.64）に置き、進む向きの先を多く見せる（lookAhead＝画面幅の 11%）。移動が始まると 110ms 遅れて追いかけ（followDelay・followTau 150ms）、止まるとゆっくり止まる（settleTau 240ms）。ズームは移動中 0.98・着地 1.02・分岐 0.93・停止地点の物へ寄るとき 1.03（大きくズームしない）。カメラの状態はセーブしない（再読み込み後は今の地点からその場で合わせる）。
    - 層（.chf-cam の中）：遠景の帯（背景の上部の写しを少し遅く。fieldScenes[].farBand）→ 背景 → 奥の環境（haze 0.15 以上）→ 道（背景の上の目印・モンスター：足元の y で前後）→ 手前の環境（草・岩）→ 効果。視差は config.parallax（far 0.94・back 0.97・road 1・front 1.14）。手前を横切る草は config.foreground[field]（数地点に1つ）。
    - 歩き：道は config.paths[].pts を Catmull-Rom で滑らかにした曲線（curve:'linear' で折れ線）。ノードは曲線の上に置き、隣の地点へは MMCH.routeBetween の点列で歩く（直線で飛ばない）。別の道へ移るときは config.edges['from>to'] の中間点。出目が決まると約0.1秒の構え → 加速 → 1地点 200〜350ms（画面上の距離と地形 config.motion.terrain：坂は遅め・橋は一定）→ 最後の30%で減速 → 着地（0.17秒）。見た目（上下動・前傾・向き・影）は monsterAnimator（既定は CSS のクラス ready／walk／land／idle／rest）。正式な歩行アニメが届いたら MMCHV.registerMonsterAnimator({ set(el, state, info) }) で差し替える（移動・カメラの処理は変えない）。
    - 止まる位置と目印の位置は別：モンスターは道の上の点（node.mx／my）に止まり、目印は道の脇（config.nodeLook の gap＝道からの距離、side＝側。道ごとの置き方は paths[].landmark、地点ごとの上書きは config.nodeOverrides[id]＝{ monster, landmark:{x,y,scale,depth,anchor,opacity}, camera, terrain, side }）。目印は少し埋め（sink）、足元を草（.chf-tuft＝grass_front の一部）で隠し、接地影を持つ。普段は光らず、止まったときだけ0.65秒光る（後ろの光と drop-shadow。絵の色は変えない）。
    - 能力＝道端の古代石碑（nodes/stat_*）。イベント＝内容に応じた自然物（eventPool[].asset：木陰＝木、小休憩＝岩、珍しい草＝花、つまずく＝岩。泉・祠は tier の祠を小さく置く＝【暫定・素材待ち】）。宝箱＝草むらの脇（開けるときカメラが少し寄る）。バトル＝目印を置かない（着いたら草むらが揺れて「！」→ 案内。config.battleMarkers:true で旧来の石碑を常設）。ライバル本人＋モンスターは battleTypes.rival.figure（asset key）で置ける構造（素材は未着）。wild／rival の asset key は分けたまま。
    - 背景に描かれている物（大橋・大会門・木立・遺跡）には素材を重ねない（FIELD 2 の forest_path_b、FIELD 3 の大木・石柱は外した）。手前の草・岩の帯だけ視差の前景として残す。
    - 背景の切り替え：フィールドの端から進む向きへ歩き続け、カメラが前へ寄りながら短い暗転（.chf-veil）→ 次のフィールドの入口の少し手前から歩いて入る（向きを保つ）。分岐：カメラが少し引いて2つの道の入口を見せてから選択肢、選ぶと選んだ道へ少し寄ってから歩く。
    - 操作のロック：サイコロ・移動・着地・結果・イベント・バトルへの切り替えの間は STOP・アイテム・休む・分岐を受け付けない（bBusy＋MMCHD.isLocked）。
    - Pattern B／C・Chapter 2〜4 は config（paths・edges・nodeOverrides・landmarks・foreground・camera・parallax・motion・fieldScenes[].farBand）を足すだけ。画面側に Pattern 専用の座標・分岐は書かない（tests/chapter-engine.test.mjs CH1-27 で監視）。
  - 30ターン・サイコロ1〜3。FIELD 2 で大きな分岐（大橋ルート＝短い・バトル多め／森の小道＝長い・能力・イベント・宝箱多め）。合流してゴール → 公式大会 → ファーム。30ターン切れは大会なしで Chapter 終了（失敗ではない）。
  - 配置は固定の骨組み＋ランダム割り当て。Chapter 開始時に seed で決めてセーブ（m.raise.field：chapterId・patternId・fieldId・layoutSeed・nodeAssignments・consumedEvents・openedTreasures・clearedStats・branch）。再読込・バトルから戻っても引き直さない。
  - 疲れ（m.raise.fatigue、0〜100）：出目確定時に 1→+3・2→+5・3→+7、ボードのバトル +5、大会は0。100 でサイコロ不可 → 休む（−30・1ターン・移動なし・ライフ回復なし）。次の Chapter へは max(0, 疲れ−50)（**2026-10-08 正式として再確認：大会のあと・Chapter の終わりで疲れを0にしない。「大会後疲れ0」は正式仕様ではない**）。
  - **能力マス（2026-10-02 正式。旧「+10〜15・疲れの帯で失敗／大成功」は廃止）**：止まったら、そのモンスターの該当能力の成長適性 A〜E の値だけ上がる（2026-10-08 から A +25・B +21・C +18・D +14・E +11。全 Chapter 共通）。ランダム幅・失敗・大成功なし、疲れの影響なし（疲れのシステム自体は存続）。イベントによる能力変化（賢者 +20・薬草 +6 など）は適性の影響を受けない（イベントの数値のまま）。コードは js/chapter/engine.js の statGain → js/phase10/monsters.js の growthGain。旧ボード（Chapter 3〜4）の能力マス・ライフマス（旧【暫定】+5〜7）も同じ成長適性（js/phase8/raising.js の statSquare）。
  - **バトルのマス（2026-10-02 正式）**：野生モンスターマス（wild）・レアモンスターマス（rare）・ライバルマス（rival）の3種類だけ。「強敵マス」は使わない（strong は Chapter 2 の固定の骨格 s4_4 にだけ旧来のまま残る＝Chapter 2 は今回の対象外【要確認】）。
  - **ライバル＝リュウ（2026-10-04 正式名）**：各 Chapter に登場する同一人物。遭遇の文「リュウが立ちはだかった！」・バトルの案内に「リュウの相棒は、今のこの子と同じくらいの強さみたい。」（battleTypes.rival）。強さは js/phase8/rival.js（MMRIVAL。今の個体の平均能力に近いランク。Chapter ごとに下限が上がる）。相棒モンスター・バトル中の名前（fight() が作る）は未決。
  - **イベントマスの出来事（2026-10-04 第二段階）**：eventPool に 14 種の短いランダムイベント（草原の追い風・澄んだ湧き水・石碑・フィナとの休憩・突然の雨・獣の足跡・遠くの鳴き声・野花・旅人の痕跡・小動物・ダンの言葉・風の鳴き声・古い訓練跡（2択）・小さな祠（2択））を追加（旧 6 種は残す）。効果は疲れ回復・能力 +5・少し疲れて能力 +5（stat_tired）・会話だけ（none）。止まると フィナの吹き出し（lines）→ 結果の枠。2択は会話窓の最後に選択肢（選ぶまで結果は決まらない）。同じ Chapter で同じイベントは重複しない。チュートリアル（初めての能力・イベント・休憩・宝箱・野生・分かれ道・ライバル・ゴール）はフィナの小さな会話窓で、このセーブで1回（S.npcFlags.story）。
  - **レアモンスターマス（2026-10-02 正式）**：レアモンスターマスそのものの出現率が 10%。Chapter 開始時に配置を作るとき（generateLayout）、バトルの候補マスごとに layoutRules.rareBattleRate（Chapter 1＝0.1）で rare／wild を決め、配置（m.raise.field.nodeAssignments の bt）と一緒に保存する。ロード後も同じ（引き直さない）。60マス中ちょうど何個という固定数ではない。盤面には深紅のマス（tile_rare_monster）で見える。止まってからの抽選（旧 rules.rareWildRate・pend.fx.rare・isRareEncounter）は廃止。レアの敵データ・報酬・遭遇演出は未登録＝【暫定】バトルの中身は野生と同じ（練習試合の強さ）。古い途中セーブの strong（旧 w9_3）・pend.fx.rare は読み込み時に野生として扱う（engine の sanitize）。
  - イベント・宝箱は config のデータ（handler 名＋params）。疲れ回復イベントは1〜3個（−10／−20／−30／全回復）。能力・所持金のイベントの値と宝箱の中身（50G／150G）は【暫定】。回復アイテム（小−10・中−30・大＝全回復）は API（MMCH.registerFatigueItem）だけで、品名・入手は未決。
  - 平均到達ターンの確認：`node tests/chapter-sim.mjs 1000`。
- **次期Chapter「リアル巨大ボード方式」の内部基盤（2026-09-30。見た目・新背景・新UIは未着＝config と画像を差し替えるだけで移行できる土台。現行 Chapter 1 の挙動・乱数列・セーブ形式は変えていない）**：
  - サイコロの面の数：config の `rules.diceSides`（既定 3。次期は 6）。`MMP7.rollDie(sides, rng)`（1〜sides を等確率）を `MMP8.roll` が `MMP8.diceSides(m)`（ドライバの `diceSides`）で呼ぶ。`MMP7.rollDice`（1〜3）は特訓ボード・旧ボード（Chapter 2〜4）のまま。演出は `MMCHD.configure({ sides })`（field-view が rules.diceSides から渡す）。停止面（config.dice.resultSprites）が無い出目は数字の輪で出す（`MMCHD.missingSprites()` で確認。正式な dice_stop_4〜6 が届いたら resultSprites に足すだけ）。
  - 疲れ：出目 1〜3 は正式値（+3／+5／+7）。4〜6 は表の最大の出目の値（+7）【暫定・未決。config の `rules.fatigueRules.roll` に 4〜6 を書けば置き換わる】。
  - ターン：`rules.turnLimit`（出発時に `m.raise.turnLimit` へ確定）。状態は `MMCH.turnInfo(m)`＝{ used, limit, left, current, isLast, exhausted }。最後のターンは移動・停止イベント（バトルを含む）まで終えてから終了する。終了後の行き先は `rules.onTimeUp`：'end'（既定・現行＝大会なしで Chapter 終了）／'tournament'（次期＝ゴール扱いで既存の大会へ。休んで終えたときも同じ。ドライバの `onTurnsExhausted` → `MMP8.finishTurn`／`rest`）。
  - 長距離ルート：総マス数・背景の枚数は config（paths・fieldScenes）から決まる（135・13 などの固定なし）。`MMCH.routeLengths(g)`・`sceneNodes(g, fieldId)`・`nextFields(g, fieldId)`（次に入る背景。連番の前提なし）・`sceneOrder(cfg, g)`。fieldScenes[] は担当ノード（paths[].field）・bg・w／h・depth・zoom・farBand に加えて `camera`（背景ごとのカメラの上書き）を持てる。
  - 通過と停止：出目の途中で通った地点は何も起こさない（能力・イベント・宝箱・バトルは停止地点＝`MMCH.resolve` だけ）。通過はドライバの `onPass`（`MMCH.registerPassHandler(type, fn)` で種類ごとに登録したときだけ何かする。既定は無し）。
  - 強制停止：ノードの `forceStop`（path の `forceStop:[index…]`、`nodeOverrides[id].forceStop:true`、config の `forceStopKinds:['rival', …]`）。マップ（`MMCH.trackOf`）の `node.stop:true` になり、`MMP8.step`／`chooseBranch` は出目が残っていてもそこで止めて残りを消す（ライバル専用の if は書かない）。現行 Chapter 1 は強制停止なし（ライバル f3_4 の扱いは未決）。
  - 固定＋可変：骨格（start・branch・merge・strong・rival・special・goal＝paths[].fixed）と候補ノード（slot）は今までどおり。可変の内容は `layoutRules.counts` に書いた種類だけを seed で割り当てる（書かない種類は乱数を消費しない）。`special`＝Chapter固有の固定イベント（`config.specials[nodeId]`＝{ handler, params, text, once }）。マス種別の正式名は `MMCH.NODE_TYPES`（stat_life…stat_toughness・event・rest・treasure・wild・strong・rival・special）。内部の割り当て（t／k／bt）は変えず、`nodeTypeName(a)`／`assignOfType(name)` で相互変換する。
  - seed／セーブ：Chapter 開始時の配置（layoutSeed＋nodeAssignments）を `m.raise.field` に保存し、ロード後も引き直さない（従来どおり。version 6・mr4v6・pend の形は不変。新しい項目は足していない）。
  - 同行者：Chapter へ行くのはプレイヤー・フィナ・育成中のモンスター（ダンは同行しない）。停止地点の結果 → フィナの一言は `MMCH.companionReaction(m, fx)`（`config.companion.reactions[key]`。key は `MMCH.REACTION_KEYS`＝gold・stat_up・stat_great・stat_fail・treasure・wild・strong・rival・tired・recovered・goal_near・time_last）。本文は未登録（null＝何も出さない）。画面は `MMCHV.registerReactionRenderer(fn)` で表示を差し込む（既定は表示しない。会話UIは未決）。
  - 合成 config の作り方は tests/chapter-next.test.mjs の `makeNextConfig`（Chapter 番号 2〜4 を借りる）。

### 商用品質化・第1次（2026-10-02。Game Feel・音・会話の見せ方）

- **出来事の重さ（MMFEEL.LEVEL）**：0 軽いUI操作・1 通常操作（通常マス）・2 小イベント・3 成長／報酬（能力UP・宝箱・G）・4 遭遇（野生・レア・ライバル）・5 大会・Chapterクリア・重要解放。間（beat）と余韻（hold）は LEVEL ごとの値（js/feel/game-feel.js の MOTION の1か所）。意味のない一律の待ちは入れない。
- **押下と画面遷移**：ボタンは触れた瞬間に scale 0.97 だけ沈む（色・位置は変えない）。画面を移るボタンは押下を約0.11秒見せてから移り、連打しても1回だけ。**2026-10-03 総監査（「切り替えが速すぎる」）**：押下 0.11秒 → 今の画面のフェードアウト 0.17秒（html[data-mmout]・その間は押せない＝MOTION.nav.out）→ 切り替え → フェードイン（施設へ 0.32秒・戻る 0.24秒・通常 0.24秒）。実測 街→施設 約0.65秒・施設→街 約0.55秒。共通の処理だけ（画面ごとのコードなし）。onclick が関数呼び出しで始まらない戻るボタンは data-nav="back" を付ける（牧場）。**2026-10-09（街・ベースキャンプのチカチカ）**：入りかたの印 data-mmtr を約0.9秒後に外すと #app>* のアニメーションが既定の scr に変わって最初から流れ直し、入り終わった画面がもう一度フェードインしていた → 外す前に今の画面へ .mm-in（animation なし）を付ける（js/feel/game-feel.js の settle）。切り替えのフェードの間（data-mmout・data-mmtr）と街・ベースキャンプのページの地は濃紺 #0b1636（明るい羊皮紙色が透けて白く光っていた）。ベースキャンプの背景・ボタンの絵は街で先読み（townPreload の BC_PRE）。テスト：qa-e2e-feel の FE-8。
- **会話の見せ方**：NPC会話・フィナの案内／リアクション・システム通知・重要イベント会話を分ける。短い一言は compact（暗幕なし・小さな窓）、通常は standard、重要（育成完了・大会会場への到着）は major。システム通知（処理結果）は顔・名前の無い通知（街の .dlg.sys。以前はモンスターの絵が付き、「育成を放棄しました」をモンスターが話しているように見えた）。Chapter 中のフィナは節目だけ（config.story）で、通常マスでは話さない。
- **ダン**：ファームの育成担当で、Chapter には同行しない（送り出す側）。育成開始の掛け合い DAN_TALK.handoff＝フィナ「ダン、この子と一緒に行ってくるね！」→ダン「ああ。準備はできてるな。気をつけて行ってこい。」（2026-10-02 ユーザー指示）。
- **Chapter の演出（2026-10-03 更新）**：遭遇＝移動が止まる → 静止（0.38秒以上）→ 草むらが揺れる（0.3秒。ライバルは揺れない）→「！」（0.26秒）→ 遭遇の演出（野生＝カットイン＋「野生のモンスターが現れた！」、レア＝深紅の帯＋「レアモンスターが現れた！」、ライバル＝紫の帯＋「ライバルが立ちはだかった！」【文面は暫定。config.battleTypes[].encounter・tone】。絵と文は同じフレームで出し、その瞬間に wild.alert）→ 1.25秒見せる → バトルの案内。操作欄（2026-10-03）＝左右の余白を詰めて操作欄の画像を少し大きく（--chcmd 128px・390×844 で約124px）、操作欄の枠は 6px だけ高く（--chdeck clamp(128px,19.7dvh,172px)。390×844 でフィールド 684→678px＝案内文の行が切れないように）。START の光（chstopglow）はゆっくり控えめに。以下は 2026-10-02 の記録：サイコロ＝START の位置から投げる（DICE_THROW）→ 回る → 着地（DICE_LAND）→ 跳ねる → 出目の面が弾んで金の光の輪（約0.52秒見せる＝出目が分かる間）→ 移動。能力UP＝間 → マスが光る → モンスターが小さく跳ねて足元に光の輪 → 能力UPの枠（数値は +0 からカウントアップ）→ 余韻。宝箱＝間 → 現れる → 揺れて開く → 報酬 →「+NG」が HUD の所持金へ飛び、HUD の数字が前の額から増える。イベント＝間 → 出来事 → 結果（所持金・疲れは HUD まで動かす）。野生／ライバル＝止まって静止 → 草むらが揺れる → 「！」→ カットイン（野生だけ）→ バトルの案内。通常マス・分かれ道・合流＝足元が軽く光るだけ。
- **遭遇とフィナの一言（2026-10-03 夜・試遊）**：予兆（草むら .chf-rustle・「！」）は遭遇の演出（.chf-enc）を出す前に必ず消す（確定の表示に予兆の絵を残さない）。フィナの吹き出し（.chf-fina）には右下に「タップで進む ▼」（点滅）。会話欄のタップで進む。この会話の間だけ START（操作欄の中央）の上に透明な「会話を進める」ボタン（.chf-fina-st）を重ね、START でも進む（サイコロは振らない）。出てから0.3秒の押下は無視。読める長さ（最長4.2秒）が過ぎたら自動でも進む → バトルの案内。実ブラウザ tests/qa-e2e-encounter.test.mjs（ENC-B1＝2サイズ×START／会話欄、ENC-B2＝マスの大きさ）。
- **Chapter のイベント（config.story。MMCH.storyEvents／markStory）**：trigger（start＝Chapter に入った最初／land＝止まったあと）、when（field＝今回の移動で通った背景・今いる背景、node、branch、fx・battleType・tier＝止まったマスの結果、species、fatigueMin、raiseMin、chance）、lines（speaker・expression・text）、presentation（bubble＝フィナの小さな吹き出し／talk＝小さな会話窓）、once（既定＝この個体のこの Chapter で1回＝m.raise.field.storySeen。配置と一緒に消える任意項目）、priority（同時に満たしたら高いほうを1つ）。Chapter 1 は12件（出発・初めての野生／レア・分かれ道の手前・森・大橋・大橋のガウル・合流・城が見える・ライバル前・珍しい出来事・疲れ）。本文は【暫定】。
- **BGM**（2026-10-02 夜の Audio 基盤改修で更新）：画面のコードは `bgm("画面の鍵")`（title・town・market・ranch・lab・farm・farmmenu・train・chapter・battle・tour・result・dojo）を呼び、index.html の `audioSceneFor` が場面へ読み替える：chapter＝CHAPTER_N、battle＝戦闘の種類（野生 WILD_BATTLE・レア RARE_WILD_BATTLE・ライバル RIVAL_BATTLE・大会 E〜C TOURNAMENT_BATTLE_LOW・B〜S TOURNAMENT_BATTLE_HIGH。fight() の `bgm("battle")` もここで決まる）、tour＝大会の受付・順位表（ランク帯で LOBBY_LOW／HIGH）、result＝大会の結果、farmmenu＝ファームの各画面（Chapter 中にボードから開いたときは曲を変えない）。牧場＝RANCH、研究所＝LABORATORY、ファーム（育成開始前・Chapter間・育成完了・出発準備・アイテム屋）＝FARM、特訓＝TRAINING。曲は js/audio/audio-registry.js。合成音の `sfx(n)` は `SFX_EVENT`（番号 → 出来事。バトル中は意味が違う：7＝ROULETTE_TICK、3＝最初が BATTLE_START・次が VICTORY）で MMAUDIO.se へ届き、正式な SE が無ければ元の番号の合成音（sfxSynth）。fight()（Phase 6）は変えていない。
- **SE（2026-10-03 品質向上）**：ボタンの data-se でそのボタンの SE（牧場のタブ＝UI_TAB）。施設の未開放（闘技場・聖獣士管理局・研究所の準備中）＝UI_ERROR。大会の初回優勝の報酬＝REWARD・バッグの拡張＝UNLOCK（結果の画面で1回）。UI_CONFIRM は共通のクリック（index.html）と画面の切り替え（MMFEEL）に差し込み口があり、正式素材が来たら registry の1行で鳴る（今は無音）。CHAPTER_CLEAR は大会会場への到着が無音の指示のため未接続。
- **UI の SE（2026-10-03 総監査）**：登録済みで呼ばれていなかった UI_CANCEL（戻る音 back_style_4_002）を「街へ戻る」（MMFEEL の back）に、UI_SELECT（cursor_style_2）を市場の選択の切り替え（p10Step の始まりで1回）につないだ。決定音 UI_CONFIRM は無音のまま（代わりを選ばない）。UI_TAB・UI_ERROR・UNLOCK・REWARD・CHAPTER_CLEAR は登録済みだが未接続（AUDIT_2026-10-03.md）。
- **NG の音（2026-10-03・第4弾の試遊）**：開始画面のタップ（TITLE_START）・通常のコマンドのタップ（UI_CONFIRM）・サイコロの開始と停止（DICE_THROW・DICE_LAND・DICE_ROLL・DICE_STOP）・マスの停止（TILE_STOP）・大会会場への到着（TOURNAMENT_ARRIVAL）・大会の対戦前の画面（MATCHUP・TOURNAMENT_MATCHUP）・受付／順位表／結果の曲（TOURNAMENT_ENTRY・LOBBY_LOW／HIGH・RESULT）・街の曲（TOWN）・旧ファームの曲（FARM）は `silent`（合成音にも落とさない）。**NG の音を別の場面へ使い回さない・似た音を判断で選ばない・素材が無ければ無音**（ユーザー指示）。大会開始の演出（p9TourIntro）の合成の風切り音も鳴らさない。OK のまま：Chapter 開始の音（CHAPTER_START＝alkakrab Fx 2。鳴る時刻だけ変えた＝タイトルが読めるようになった瞬間）・市場などの曲。サイコロの停止の音は、入れるなら registry の DICE_STOP の1行（dice.stop＝見た目の上で完全に止まったフレーム）。
- **音の流れ（2026-10-03・iPhone 試遊の結果で調整。上の第4弾で一部は無音）**：開始画面は最初のタップまで音を出せない（ブラウザの制約）→「タップしてはじめる」は TITLE_START の1音だけ（ファイルが鳴らないときだけ合成のファンファーレ）、TITLE の曲は名前登録の画面まで続ける。最初のタップでは AudioContext の resume が少し遅れるため、MMAUDIO は resume を頼んだ直後の SE を予約して鳴らす（合成音へ二重に落ちない）。Chapter：START は決定音を鳴らさない（data-nsfx。投げる音 DICE_THROW だけ）、足音 STEP は止まるマスでは鳴らさない（止まった音と重ねない）。大会：ゴール（到着・受付・ランク選択）＝TOURNAMENT_ENTRY（到着の音は出来事 tournament.arrive → TOURNAMENT_ARRIVAL）→ 順位表＝TOURNAMENT_LOBBY_LOW／HIGH → VS（対戦相手の発表）＝TOURNAMENT_MATCHUP＋発表の音 MATCHUP（出来事 battle.matchup。VS へ進むボタンは決定音を鳴らさない）→ 能力比較（p9PreBattle）＝同じ TOURNAMENT_MATCHUP（音を重ねない）→ fight() の最初の `bgm("battle")` では曲を始めずにそれまでの曲を止め（battleBgmArm）、導入の演出 →「FIGHT!」の sfx(3)＝BATTLE_START の0.45秒後に実戦の曲（battleBgmGo。保険7秒）。野生・レア・ライバルの練習試合も同じ流れ。技ルーレットの STOP（fight() の sfx(9)）は ROULETTE_STOP。音を戻した合図は UI_CONFIRM（sfx(3) はバトル中は開始・勝利の意味になるため）。fight()（Phase 6）は変えていない。
- **マス（Chapter 1）**：分厚い石の台座はやめ、「道に刻まれた魔法の印」＝ごく薄い接地影＋細い金属の縁＋既存のマスの絵（側面の厚みなし）。奥ほど小さく平たく控えめ（size.depthPow 0.82・flat 0.5〜0.28・farOpacity 0.62）。今いるマスだけ縁が少し明るい（.cur）。通常マスは絵の無い薄い縁と刻み線だけ。

### 実機試遊の改善（2026-10-04 PHASE G。iPhone の試遊で見つかった違和感の修正。いまの正式）

- **開始ボタン**：画面全体へ広がる黄色い光（旧 .tflash）は廃止。画像に描かれたボタン（カプセルの部分）と同じ絵の層 .tpress を重ねておき、押した瞬間にその層だけが沈む（下地 .tsock の影が縁にのぞく）→ 短い光が1回横切る → 約0.28秒で暗転（.tveil）→ 約0.5秒で次の画面。開始の決定音 TITLE_START は（2026-10-04 PHASE I で正式素材を接続＝§3「追加素材の局所統合」。以下は当時の記録）素材待ち（silent のまま。NG の音は使わない）。
- **プロローグ**（文章の見せ方は 2026-10-04 PHASE H で変更＝§3「正式デザインの統合」）：「見た」の記録（S.npcFlags.prologue）は最後まで見た・スキップを2度押しで確定したときだけ（途中でアプリを閉じたら、次に開いたときもプロローグから）。背景の読み込みは最大6秒待って始める（読み込みが遅くても飛ばさない＝MMPRO.readyOrTimeout）。文章は1文字ずつ・押し上げの表示をやめ、各行は最初から全文で画面の下の外に置き、1行ずつ下からゆっくり入って上へ送る（新しい行は画面の高さの 66% に落ち着き、前の行は上へ。ページの最初の行はおよそ中央より少し上まで。上下の端はマスクで溶かす。MMPRO.POS）。BGM は場面 PROLOGUE（registry は silent＝開始画面の曲を短くフェードアウトして分ける。専用曲は素材待ち）。
- **残留 UI の原因**：p8Resume・p11NameScr が旧い見出し h1（金枠の「ミスティックモンスターズ」）を表示に戻し、プロローグの背景の読み込みを待つ間（#app が空）に見えていた。p11NameScr は h1 を隠し、待つ間は黒い幕（.p11cover）で覆う。プロローグの幕（.mmpro）は最初から不透明。
- **聖獣士登録**（デザイン参考 A の構成。参考画像の肖像・紋章は使わない）：画面全体の .p11reg（背景＝正式のプロローグ E を暗く）・題字の札「聖獣士登録」・濃紺の額＋羊皮紙の登録カード・名札「プレイヤー名」・光る名前欄（入力は 1.2rem＝iPhone で拡大しない）・主ボタン「登録する」（p11NameGo。決定は1回だけ・決定でキーボードを閉じる）。
- **イベントの表示モード**（js/npc/npc.js の evOn／evOff）：共通会話の間は html[data-mmev]（下の画面 #app は押せない＝pointer-events まで止める）。施設の初回イベント・街の案内・育成完了・帰還・到着・ボードのイベント（compact 以外）は data-mmhide＝下の画面の常設 NPC・吹き出し・会話欄（.nst・.fmdan・.shopnpc・.kbub・.fbub・.gssay・.vgsay・.elsay・.p9ced・#p10kbar・.tlow・.chf-fina）を隠す（同じ人物が2人に見えない）。会話が終わったら操作はすぐ戻し、隠した物は約0.09秒の間のあと短いフェードで戻す（タイマーは使わない＝CSS アニメーションの遅延と animationend）。表情の立ち絵は会話の最初に先読み。
- **街の案内のフィナ**：手を振り続けるアニメ（wave のループ）はやめ、行ごとの表情だけ。
- **大型の会話窓**：施設の初回イベント（npcFirst）・街の案内（finaTalk intro）・育成完了・帰還（farmReturn）・大会会場への到着は opts.big（.mmtalk-big＝金の二重の額・金の額の名前札・18px の文字・金の送りマーク）。Chapter ボードのチュートリアル（config.story の 'talk'）と挿絵の無い2択は presentation 'board'（下の操作欄の上の大きな窓・操作欄は見えるが押せない）。挿絵のある出来事は従来どおり compact（挿絵を隠さない）。
- **ゲンシン**：特訓開始は汎用の一言（GENSHIN_TALK.go）の下に、選んだ特訓の一言（GENSHIN_TALK.start[K]）を添える。
- **Chapter 開始のモンスター**：開始の演出のあと、約0.3秒の間をおいて画面の下から開始地点まで歩いて入る（field-view の monEnter・MMCHV.MON_ENTER。全種族共通・CSS の個別の translate だけ・入り終わるまで START は押せない）。
- **遭遇の演出**（デザイン参考 D・E の構図。参考画像の人物・モンスターは使わない）：予兆の草むら（旧 .chf-rustle＝手前の草の帯を切り出した細い帯。画像の読み込みが遅いと文の直前に右下へ現れ、壊れた UI の断片に見えていた）は出さない。止まる → 静止 →「！」→ .chf-enc2（野生＝周りを少し暗く・金と翠の魔法陣・正式のモンスター・ENCOUNTER の帯・文。赤い刃の交差のカットイン fx_battle_encounter は使わない／レア＝後光・「★ レア」／ライバル＝赤と金・「✦ RIVAL ✦」の帯・道の先の赤い魔法陣。リュウの正式な立ち絵は無い＝人物は描かない）。野生・レアの相手の種族は MMCH.foeSpecies（配置の seed・マス・Chapter から決まる。セーブに項目を足さない）で、バトルにも同じ種族を渡す（index.html の battleFoeOnce：fight() は変えず、その最初の乱数 R(SP.length) の1回だけその種族の値を返す。今のバトルの相手の表 SP はソラモ・ガウルの2種）。
- **ライバル（リュウ）の位置**：大会の直前（旧 p14_0）→ 道中の p5_0（05 の最初のマス・46歩のうち19歩目・分かれ道の2つ手前。森も大橋も通る。野生 → イベント → ライバル → 分かれ道 → さらに冒険 → 大会）。マスの種類を入れ替えただけ（数・道の長さは同じ）。10,000回（`node tests/chapter-turns.mjs 10000`）：30ターン以内の到達 森 99.7%／大橋 99.3%（cautious）・99.9%／99.6%（forced）、平均 24.5／25.0。フィナの「この先に誰かいる…」（ch1_rival_before）は 04 で。
- **音の差し込み口**（すべて素材待ち＝silent。今ある音源はすべて別の場面に割り当て済みで、合う未使用の音が無い。NG の音・似た音を判断で選ばない）：TITLE_START（開始の決定音。2026-10-04 PHASE I で正式素材を接続）・PROLOGUE（プロローグの曲）・STEP（1マスごとの足音。止まるマスでは鳴らさない＝既存）・RIVAL_APPEAR（ライバルの登場。MMFEEL の rival.appear。野生は WILD_ALERT のまま）。
- **大会会場への到着**（config.arrival.lobby）：ゴール → 門前（ch1_bg_15_event・約1.3秒）→ 会場の中のロビー（assets/tournament/lobby/lobby_main.webp＝デザイン参考「大会会場イベント画面」の背景。フィナと会話窓が描き込まれていない右側を切り出し。README.md）へクロスフェード → フィナの到着の会話（正式素材の全身 happy／smile／guide・大型の窓。「やっと着いたね、{name}さん！」「ようこそ、大会会場へ！」「さあ、参加する大会を選ぼう。」【暫定】）→ ランク選択（ロビーの上）→ 大会。門の前でランクを選ばせない。再読み込みはロビーのランク選択から。闘技場のステージ（バトルの画面）は変えていない。
- **大会の画面**：上部の見出し p9TourHead は特訓チケット（p8Hud）を出さない。旧い茶色の板・旗の飾り・試合の点・Chapter 名（下の帯と二重）は出さず、濃紺の細いバー（大会名・人数・左にメニュー ☰）。
- **サイコロ（止まったあとに面が変わって見える）の根本原因と対策**：止まった瞬間に表示中の <img> の src を出目の面へ差し替えていた（iPhone の Safari はデコード前の画像だと前の絵を残し、あとで切り替える）。先読みが終わっていない初回は従来の見せ方になり、止まってから新しい画像を重ねてクロスフェードしていた。転がる間の面はタイマーで、遅れて発火すると止まったあとに面が変わった。→ 面（出目の面 .chdz-img・転がる間の各面 .chdz-rf）は最初に全部置いて要素ごとにデコードしてから投げる（待つ間はサイコロを見せない・最大2.5秒）。切り替えは表示（visibility）だけで src は変えない。傾きは面をまとめた箱 .chdz-rot。出目の面は止まる約0.28秒前（まだ滑っている間）に見せ、止まったあとは何も変えない。止まった姿は約1秒（resultMs 520 → 720）。
- テスト：tests/qa-e2e-polish-g.test.mjs（G-A〜M。A＝プロローグの途中終了、B＝タイプ表示なし、C＝旧い見出しが1フレームも出ない、D＝街の案内で通常のフィナを出さない、E／F＝施設の初回イベントの常設 NPC、G＝下からの登場、H＝草の断片が出ない・遭遇の相手＝バトルの相手、I＝ライバルの位置、J＝ゴール → ロビー → ランク選択、K＝特訓チケットなし、L＝サイコロの絵が遅れて届く初回でも止まってから何も変わらない、M＝イベント中に下の START が反応しない）

### 正式デザインの統合・施設の作り直し（2026-10-04 PHASE H。いまの正式）

- **ベースキャンプ（旧ファーム）**：ユーザー向けの名前は「ベースキャンプ」（内部の関数名 fmScr・hall・p9FarmScr・CSS の fm* はそのまま。fight() の中の「ファーム」の文言は Phase 6 のため残る）。デザイン基準 03＝背景 BC_BG（assets/basecamp/）・上＝名札「ベースキャンプ」・所持金・メニュー（bcMenu：ステータス・技管理・中断／街へ戻る・育成放棄）・音／中央＝ダン（立ち絵の規格 stand・状態に合う表情）＋育成中の個体（msv・名前と種族の小さな札）＋ダンの一言（頭の上）／その上に次の Chapter（番号・名前）と独立した「冒険」（＝従来の出発準備 prepScr。最終ルート未登録・解放条件に届かない＝「育成を完了して街へ戻る」の2度押し、育成完了＝街へ戻る）／下＝1列5つ（特訓＝チケットの小さな札・アイテム＝ベルナの補給所 shopScr・ステータス・技管理・街へ戻る。**育成中（Chapter間）は街へ戻れない正式仕様のため5つ目は「中断」**）。旧い情報欄（大会ランク・育成準備中・Chapter N 終了）と「育成を始める」は使わない。ファームの各画面のぼかし背景は FARM_BG のまま。
- **アイテム補給所とベルナ**：アイテム屋のおばあちゃん（id 'shop'）の正式名＝ベルナ（ZIP mystic-monsters_npc_official_standing の README）。画面の札は「アイテム補給所」。ベースキャンプの中だけ（街に独立したアイテム屋は作らない）。
- **牧場（2026-10-06 から8体まで。PHASE H3 では20体）**：デザイン基準 01。上＝街へ戻る・牧場・所持金、ニックの小さな顔＋一言（通知のときは通知だけ）、「牧場のモンスター N / 20」、連れている子（1行）、2列の一覧（小さなアイコン・名前・育成完了／未育成の札。一覧だけがスクロール）、下＝見る（6能力の詳細）・名前変更（8文字まで・p11Esc）・受け取る（連れている子を選ぶと「預ける」。20体で押せない）・売る（従来の売却の確認・2度押し）。合体は研究所（牧場に置かない）。
- **聖獣士管理局**：街の札「聖獣士管理局」（townGuild → bureauScr）。デザイン基準 02＝背景 BUREAU_BG（assets/bureau/）・聖獣士証（プレイヤー名・大会到達ランク S.br・育成完了数・合体回数 S.fuseCnt・発見モンスター数＝図鑑と同じ・大会優勝記録 S.wins。**すべて今のセーブから。参考画像の見本の値は使わない**）・功績（BUREAU_ACH＝既存データの判定と表示だけ。報酬・解放は無い＝TODO）・下に「聖獣士証」「功績一覧」。登録済みの画面に「聖獣士登録」「聖獣士証を発行」は出さない。聖獣士登録（p11NameScr）の背景も BUREAU_BG（入力・決定・保存は従来どおり）。
- **NPC の立ち絵の規格**：フィナの半身（closeup）が基準（顔の大きさ・頭の上の位置・3/4身・下は会話窓で隠す）。主要 NPC 8人は全身（expr/full＝stand）を CSS（aspect-ratio＝--nk・object-fit:cover・上寄せ）で上から決まった割合（MMNPC.STAND の fr）だけ見せる（画像は加工しない）。会話（MMNPC.talk の closeup の行）と施設の立ち絵（npcStand → .nstf[data-npc]）・ベースキャンプのダン。表情を変えても器の大きさは同じ。390×844 ではヴァルガス・セドリックの肩の端が画面の右で少し切れる。
- **セルジュ（聖獣士管理局の NPC）・リュウ**：受け取った絵は白背景（セルジュ）・市松模様の焼き込み（リュウを含む NPC 9人の ZIP）の JPEG＝**正式の透過素材待ち**。リポジトリに置かず表示しない。セルジュは差し込み口だけ（SERGE・bureauNpc＝MMNPC に 'serge' を登録すれば管理局に立つ）。リュウの遭遇は従来どおり人物なし。
- **サイコロの停止（2026-10-04 PHASE H。iPhone で「止まったあとも面が変わる」が PHASE G のあとも残っていた）**：原因＝位置・傾きの動き（Web Animations）は合成スレッドで進むのに、面の切り替え（class・src）はメインスレッドの setTimeout／rAF だった。iOS の Safari ではメインスレッドが遅れると「動きは止まって見えるのに、あとから面が変わる」。さらに停止時の finish() による描き直しもあった。対策（js/chapter/dice-renderer.js の physicalWA／legacyWA）＝投げる10コマ・転がる面・出目の面・光の <img> をすべて最初に置いてデコードし、見た目の切り替えを opacity の階段アニメーション（step-end）として動きと同じ時間軸で一度に作る。停止 S（出現から約1.36秒）以降の keyframe はすべて同じ値・アニメーションは消えるまで終わらせない・src／class／style は投げてから消えるまで触らない。出目の面は S の約0.16秒前（まだ滑って傾きが戻る間）に固定。テスト：tests/qa-e2e-dice-lock.test.mjs の DL-B1（390×844・375×667 × 出目1・2・3：停止〜消える前の画素・計算値・DOM が不変・src の変更0）・DL-B4（メインスレッドを0.6秒止めても再開した最初のフレームで出目の面）。iPhone 実機の最終確認はユーザー。
- **プロローグの文章（2026-10-04 PHASE H 正式。PHASE G の「下から上へ流れる」は廃止）**：1文（空行と「。」で区切る。3行以上の長い文だけ2行を1セット＝MMPRO.units）を完成した状態で、左から右へ短く（34px・0.76秒）入れて画面の中央よりやや上（中心 42%＝MMPRO.POS.y）で静止 → 読む時間（行ごとの lineDelay＋1.1秒）→ フェードで消えて次の文。同時に出る文は1つだけ。タップ＝入っている途中ならすぐ静止、静止していれば次の文。本文は変えていない。テスト：PRO-B1・G-B（390×844・375×667）。
- **大会ランク選択の状態（2026-10-04 PHASE H 正式）**：固定表示にしない。各ランクの状態はその個体の進行（m.prog.rankClr・MMP8.eligibleRanks）で決まる（index.html の p9RankState）：未解放＝濃紺・鎖・錠・「参加不可」（押せない）／参加可能＝（旧：ワインレッド＋金。2026-10-04 PHASE I で青＋金＝下の「追加素材の局所統合」）・「参加可能」／挑戦目標＝参加できるうちまだクリアしていない最も高いランク（参加可能＋金の光と「挑戦目標」の札）／クリア済＝金のチェック・「クリア済」（再挑戦できる。この Chapter の上限より上のクリア済は押せない）。各行に「参加者 N体 / N−1試合」（E・D 6体・5試合／C〜S 8体・7試合）。解放の規則は従来どおり（ユーザー確認 2026-10-04：Chapter 1 から E・D が参加可能、クリアしたランクの1つ上が解放＝RANK_FLOOR D・RANK_UNLOCK_STEP 1）。F・FREE 大会・賞金・推奨戦力は出さない。宝石の色 E 緑・D 青・C 水色・B 紫・A 赤・S 紅。Chapter 1 の大会受付（p9ReceptionHtml）が正式の画面。Chapter 2 以降のゴール（p8GoalHtml）は従来のカードに状態の札（挑戦目標・クリア済）を付けただけ。テスト：PH-07（状態の規則）・H-E（390×844・375×667）。
- **NPC 9人の ZIP の名前の食い違い（要確認）**：ZIP の 02_dan と 03_nick は、リポジトリの正式素材（assets/npc/dan・nick）とベースキャンプの参考画像のダンに対して名前が逆。リポジトリの素材を変えていない。

### 追加素材の局所統合（2026-10-04 PHASE I。いまの正式）

- **能力UPの道具**（assets/chapter/stat_tools/）：能力マスに止まる → モンスターが反応 → **能力に対応する道具（約0.76秒）＋「ちから +6」（実際の能力名・上がった値＝成長適性のまま）** → 既存の成長演出（frame_stat_up・ゲージ・粒子）。対応＝ライフ ハードル・ちから ウェイト・かしこさ 魔導書・命中 ターゲット・回避 回避訓練ボール・丈夫さ 訓練盾。全モンスター・全 Chapter 共通（field-view の RFX_DEF。config.resultFx で上書きできる）。
- **Chapter の短い結果演出**（assets/chapter/result_fx/。field-view の resultFx。タップで飛ばせる・視差を減らす設定では出さない）：休むマス＝焚き火＋「疲れ −N」（疲れの回復。ライフは変わらない。約0.9秒）／休むマス以外の効果のある出来事＝共通の紋章＋実際の効果（「回避 +5」「+50G」「疲れ −15」。会話だけの出来事では出さない。約0.7秒）→ 既存の結果の窓／**道中の野生（wild）バトルに勝ってフィールドへ戻った直後だけ**＝勝利の紋章＋「野生モンスターに勝利！」（約1秒・その間は操作しない）。レア・ライバル・負け・途中終了・大会・Chapter クリアでは出さない（index.html の bBattleGo が globalThis.MM_LAST_BT に種類を覚え、p8AfterBattle が MMCHV.queueWin。セーブしない）。
- **大会ランク選択（正式デザイン＝青＋金）**：ユーザーの正式デザイン画像を基準に HTML/CSS で再構成（画像は背景に使わない・状態を焼き込まない）。**Chapter 1〜4 で同じ部品**（index.html の p9RankRow・p9RankListHtml・p9ReceptionHtml）：Chapter 1＝到着 → ロビーの上、Chapter 2（フィールド）＝ゴールで #chrcv.bg（会場のロビーの背景 P9_LOBBY_BG）、Chapter 3・4（旧ボード）＝ゴールで .p9rcvw（同じ背景）。p8GoalHtml は大会のある Chapter では p9ReceptionHtml を返す（旧カード p9rank・p9rlock・p8TourStart は画面に出さない。関数は残す）。状態：未解放＝灰色がかった濃紺（黒い塗りつぶしではない）＋鎖と錠・押せない div／参加可能＝青＋金／挑戦目標＝参加可能＋金の光と「挑戦目標」の札／クリア済＝金のチェック（この Chapter で選べれば再挑戦できる）／選択中＝明るい金の枠と光。各行に「参加者 N体 / N−1試合」（E・D 6体・5試合／C〜S 8体・7試合）。賞金・推奨戦力・F・FREE・旧 Chapter 見出しは出さない。解放の規則は従来どおり（RANK_FLOOR D・RANK_UNLOCK_STEP 1＝E・D は最初から／E だけのクリアでは C は開かない／D→C→B→A→S。tests/rank-ui-1004.test.mjs）。報酬・解放演出4種とランクエンブレム6種は使わない（透過素材・E〜S の対応表待ち）。
- **開始の音 TITLE_START（正式素材）**：assets/audio/se/mystic_monsters_official/title_start.ogg（gain 0.8）。タップの瞬間に鳴らす（最初のタップ＝unlock と同時にデコードが始まるので、MMAUDIO.se(name, { wait:900 })＝デコードが終わりしだい鳴らし、合成のファンファーレには落とさない）→ ボタンが沈む → 約0.5秒で次の画面（約3秒の余韻を待たない・音は止めない）。PROLOGUE・STEP・RIVAL_APPEAR は無音のまま（素材待ち）。
- **ヴァルガス・セドリックの立ち絵**：全身の横幅が広く（--nk .987／.9）390px で右の肩が切れていた → この2人だけ、会話の立ち絵の箱の幅を画面に収まる幅（画面 −14px）までにし、左端を 8px 外へ寄せる（高さ・頭の上の位置はほかの NPC と同じ。object-fit:cover で少し小さく映り下へ少し長く見える。CSS のみ・画像は加工しない・ほかの NPC は変えない。390×844 で右端 450→384px）。
- 受け取っていない（今回のアップロードに無い）：フィナの表情8枚の ZIP（fina_8expressions_unlabeled）・未反映デザイン4点の ZIP（pending_designs_4set＝大会ロビー背景・ベルナのアイテム補給所・功績一覧・聖獣士証）。過去の ZIP では代用しない＝未着として残す。

### 次期総合改修（2026-10-05。いまの正式）

- **プロローグ（js/prologue/prologue.js）**：正式4枚＝1 共存（遥か昔から、人と聖獣は…）→ 2 約百年前の異変 → 3 十年前・三人のレジェンド → 4 ミストリア到着（それから十年。…）。本文はユーザー指定のとおり（MMPRO.SLIDES）。三人のレジェンドと聖獣＝レオナ＋グリフェル・アストラッド＋ゼルヴァーン・バルド＋ドラグノル（MMPRO.LEGENDS。本文には名前を出さない・いまも存命・将来の闘技場で戦える余地）。主人公はまだ聖獣を持っていない。**文字の出し方＝1文字ずつ**（各文字 span.mpc：opacity 0→1・下から 3px・ぼかし 1.5px → 0、開始の間隔 48ms、各 160ms で重なる。段落ごとのフェードはしない）。段落（空行で区切る）が1つずつ、中心＝画面の 42%（中央よりやや上）。〔2026-10-05 夜に廃止：タップ＝全文／次へ〕いまはタップしても何も変わらない（固定尺。§3「正式音源とプロローグの固定同期」）。スキップ（2度押し）・見た記録（最後まで／スキップ確定のとき）は従来どおり。
- **序盤の導線（index.html の opPrologue・opTownTalk・opBureau・opConfirm・opAfterReg・OPEN_TALK）**：開始 → プロローグ → 街（**登録前は自由に動けない**：聖獣士管理局の札だけ光る＋「タップ」の印、ほかの札・下のバー・お知らせは押せない）→ フィナの声かけ（「あの……もしかして、今日ミストリアで聖獣士登録をする予定の方ですか？」はい／ちがいます。**どちらも管理局へ**）→ プレイヤーが管理局の札を押す → セルジュ（聖獣士管理局の職員。**正式の立ち絵が無いので名前だけ**＝js/npc/npc.js に画像なしで登録。仮の人物・「受付」は作らない）の正式登録 → 聖獣士登録（名前の入力＝従来の p11NameScr）→ セルジュの確認（この名前で登録する／書き直す）→ 登録（MMP11P.confirmName＝保存先は従来どおり S.playerName）→ 登録完了 → **フィナが初めて名前を呼ぶ**（登録前の会話に名前は出さない）→ 出身の会話と世界地図（フィナ＝フェルナ地方、主人公＝アステリア地方西部のリベルナ。2択はどちらも同じ続き。地図は 世界 → フェルナ → アステリア → リベルナ（出身地）→ ミストリア（現在地））→ 世界地図の解放（セルジュ）→ 街（市場の札を案内）。途中の再読み込み：'map' なら登録後の会話から。自動テストは MM_QA_NO_OPENING（harness の既定。open({ opening:true }) で出す）＝従来の名前登録 → 街の案内。
- **聖獣士管理局の「世界地図」**：登録後の管理局の下の3つ目のボタン（羅針盤の印・bureauMap → MMMAP.viewer）。出身地の印は序盤の地図の会話を見たあと（S.npcFlags.worldMap）。
- **正式ステータス画面（index.html の stScr。hall('st')）**：デザイン参考を HTML/CSS で動的に再構成（1枚絵を貼らない）。上＝戻る・「ステータス／STATUS」・所持金、モンスターの札＝正式画像・名前（p11Esc）・英字名（MMP10M。ジオルは未確定＝出さない）・種類・種族名（名前と違うとき）・固有スキル（UNIQUE_SKILL＝ソラモ 逆境のひと踏ん張り・ガウル 紅翼の猛攻・ノビトン ふしぎな嗅覚・ジオル 大地の守り。**効果の文はソラモだけ参考画像の文【暫定】・ほかは名前だけ＝正式の効果データが無い。バトル（Phase 6）には入れていない**）、能力バランス＝左にレーダー（stRadar・999 を最大）・右に6能力の数値と棒（999 まで・正式色 STAT_COLOR）・素早さ（1〜10 の目盛り）。下＝ベースキャンプのコマンド（bcCmds。Chapter 中は出さない）。**Lv・経験値・個体ランクは出さない**。
- **30ターンの説明**：Chapter 1 の出発（config.story の tut_turns・このセーブで1回）でフィナが「30ターン・サイコロ1回か休む1回で1ターン・30ターンのうちに会場へ着けば公式大会・間に合わなくても失敗ではない（能力は次へ）」（コードの turnLimit 30・onTimeUp 'end'・休む＝1ターンと一致）。
- **操作欄**：--chdeck を clamp(136px,20.6dvh,180px)＋safe-area に（旧 clamp(128px,19.7dvh,172px)）・下の余白 10px＋safe-area。390×844 で START の下の余白 6px → 14px、375×667 で 5px → 13px。
- **サイコロの完全停止（finalStopState）**：最後の区間の緩急を SNAP（cubic-bezier(.3,.55,.6,.9)。漸近しない＝最後の数フレームで 1px 未満・1度未満のずれが続かない）・止まる位置を整数の画素に丸める・止まったフレーム（dice.stop）で全アニメーションを pause して data-final＝出目（freezeFinal）。停止から消えるまで transform・回転・拡大・面・src は変わらない（DL-B1 で出目 1・2・3）。
- **能力UPの道具の視認性**：デザインは同じ6種のまま再透過（物の内側は不透明・外の光だけ半透明）＋CSS の濃紺の台と縁取り・光（assets/chapter/stat_tools/README.md）。
- **短いイベント（MMNPCE.moment・index.html の npcMoment。S.npcFlags.moment。最初の1回だけ・compact の吹き出し1〜3・新しい画像なし）**：partner（最初の相棒を迎えた直後・フィナ）／sp＋種族（その種族の初めての育成・ダン。育成開始の掛け合いに添える）／move（特訓で初めて技を覚えた・ゲンシン＋フィナ）／tour（初めての公式大会の最初・フィナ＝総当たり・1位で優勝）／tourEnd（初めての大会の結果・優勝 tourWon／優勝できなかった tourLost）。重複で入れなかったもの：育成完了（既存）・初めてのレア遭遇（config.story）・牧場がいっぱい（REVISIT）・機能の解放（世界地図の解放の会話）。素材・仕組み待ち：固有スキルの発動（バトル＝Phase 6）・重要なアイテム（未実装）。
- **確認だけ（変えていない）**：大会会場のロビーの背景（462×1000＝画面 390×844 と同じ縦横比・拡大はアニメの 1.04→1 だけ＝修正不要。解像度は素材待ち）、アイテム補給所（名札ベルナ・旧い台詞なし）、施設のイベント中の常設 NPC（data-mmhide で隠す）。街の UI を変えるときの場所＝index.html の TOWN_CMDS・townPins・townBar・lobby()・TOWN_BG と CSS の .map.town・.tpin・.tbar。ベースキャンプ＝fmScr・bcCmds・bcMenu・BC_BG と CSS の .fm.fm2.bc・.bcbar・.bcgo。

### 次期総合改修・2（2026-10-06。いまの正式）

- **回帰の修正**：①街の下のコマンドが押せない＝原因は「序盤の導線が使える（opOn）」だけで下のバー・お知らせを止めていたこと（端末では常に真）。登録待ち（S.playerNamePending）のときだけ止める opLock に直した（pointer-events の上書きはしない）。②プロローグを途中で閉じても「見た」にならない＝原因は裏に回ってもタイマーで自動送りが進み、最後まで行って記録していたこと。裏にいる間は待つ（prologue.js の gate）。③施設のイベント中に下の UI が見える＝会話に opts.scene（背景）を渡すと html[data-mmscene] で #app を隠し、会話窓の下に施設の背景だけを敷く（js/npc/npc.js。npcFirst・帰還・街の案内・育成完了・序盤のフィナ）。終われば戻る。
- **正式差分**：ステータス画面に素早さを出さない。固有スキル4種の効果の文（index.html の UNIQUE_SKILL。表示だけ・バトルには入れていない）。**牧場は8体まで（MMP10M.RANCH_LIMIT 8・連れている1＝所持9体）**。牧場の下のコマンドは 見る・名前変更・預ける（牧場の子を選んだときは受け取る）・売る。能力の正式色＝ライフ #F2C14E・ちから #D9534F・かしこさ #5CB85C・命中 #F06292・回避 #7FD4E8・丈夫さ #4C7BD9（STAT_COLOR）。
- **新しい UI**：施設共通の下のコマンド（研究所 図鑑・合体・配合表／牧場／ベースキャンプ 特訓・アイテム・ステータス・技管理・街へ戻る（育成中は中断）。特訓チケットの札は出さない）。ベースキャンプの主ボタン「出発する」（赤＋金・下に行き先）。危険の確認（dangerModalHtml：最終確認／「{name}の育成をやめますか？」「この操作は取り消せません。」／やめない・育成をやめる）。市場の詳細（正式画像・名前・種類・固有スキル・6能力の棒＝値/999・素早さ 10目盛り・価格・購入する）。重要な会話の大きな窓（2択は横並び・3つ以上は縦）。セルジュの立ち絵（assets/npc/serge/full_normal.webp＝参考画像を透過）。
- **Chapter 1 のボード（2026-10-06）**：小型の立体マス（assets/fields/ch1a/tiles_v2/・tileUI.discs。宝箱1〜3＝normal／rare／special、4 は予約）。**分岐3か所**：A＝03 の中の左右（ちから・丈夫さ／かしこさ・命中）、C＝05 の分かれ道（森＝安全／大橋＝挑戦。背景が分かれる）、B＝11 の中の左右（ライフ・丈夫さ／回避・命中）。左右の道は ch2a と同じ「同じ背景の上でマスの置き方だけで分ける」（path id p3l_・p3r_・合流 p3m_、p11l_・p11r_・p11m_）。**公式マス84・1回の旅は64歩（どの道でも同じ）・45ターン**（rules.turnLimit 45）。**能力マスの上昇量は Chapter 1 だけ config の表 rules.growthGain＝A5 B4 C3 D2 E2**（engine の statGain。Chapter 2〜4 は GROWTH_GAIN のまま＝要確認）。比較は `node tests/chapter1-board-sim.mjs 1000 40,45,50 cur,g4,g3`（1000回・ソラモ）：45ターンで到達 100%・平均 35・中央値 35・p90 38・最長 43、能力マスに止まる 11.7回、6能力の合計の伸び（イベント込み）＝cur 79.0／g4 67.3／g3 55.6（旧 Chapter 1（30ターン・54マス）は 7.2回・51.6）。g3 を採用（旧と同程度＝インフレしない）。ルートごとの差：森 56.5〜62.5・大橋 50.2〜55.2（大橋はバトル・宝箱が多い）。
- **能力UPのアクション**（field-view の trainAct・TRAIN_ACT）：能力ごとの道具の絵をモンスターのそばに置き、モンスターが 1.0〜1.2秒の特訓の動き（跳び越える・持ち上げる・読む・飛びかかる・かわす・構える）。形・位置だけ（色は変えない）。そのあと従来の成長演出。
- **音**（2026-10-05 夜に正式 SE を接続＝§3「正式音源とプロローグの固定同期」。以下は当時の記録）：足音 STEP・サイコロ DICE_THROW／LAND／ROLL／STOP・決定 UI_CONFIRM（出発する・購入する）。購入の専用の音は無い。合う音がリポジトリに無いので追加していない。

### 正式音源とプロローグの固定同期（2026-10-05 夜。いまの正式）

- **2026-10-05 PHASE B で変更（下の記述より優先）**：開始画面の BGM は廃止（TITLE は silent・旧タイトル曲のファイルは削除）。PROLOGUE は正式 v6（38.714秒）に差し替え＝時刻は Scene 2＝5.559・Scene 3＝15.161・Scene 4＝26.673・本文の終わり 36.276秒（下の 54.2秒・7.782／21.226／37.342 は旧記録）。聖獣士管理局は正式 BGM（BUREAU）。§3「PHASE B」

- **BGM（js/audio/audio-registry.js）**：TITLE＝assets/audio/bgm/mystic_monsters_official/mystic_monsters_title_theme_official.ogg（38.919秒・gain 0.56・ループ。旧 PGS Event Music 1 を置き換え）。PROLOGUE＝同じフォルダの mystic_monsters_prologue_bgm_official.ogg（54.2秒・gain 0.56・**loop:false**・プロローグ専用）。開始の決定音 TITLE_START は従来の title_start.ogg のまま。ファイルは ZIP の OGG を無加工（WAV は置かない）。作者表記＝Mystic Monsters official（ユーザー提供のゲーム所有素材。AUDIO_CREDITS.md）。
- **プロローグの固定同期（js/prologue/prologue.js・index.html の proPlay／proBgmStart）**：開始画面 → タイトル曲を自然にフェードアウト → 背景を読み込む（最大6秒。この間は BGM を鳴らさない）→ Scene 1 の背景が出る瞬間に PROLOGUE を頭から鳴らす（MMAUDIO.bgmTime で実際に鳴り始めた位置を時計の起点にする）→ Scene 2＝7.782秒・Scene 3＝21.226秒・Scene 4＝37.342秒・最後の文＝約50.786秒（MMPRO.schedule()／sceneStarts()）→ 終わり（52.186秒）→ フェード → 聖獣士の導線。**タップでは進まない（全文表示・次へ・「タップで先へ」のヒントは廃止）。操作はスキップ（2度押し・3秒で取り消し）だけ**。見た記録は最後まで見た／スキップ確定のときだけ（従来どおり）。
- **裏に回ったとき**：プロローグの時計は visibilitychange で止まり、戻ると続きから。BGM は Audio Manager の既存の onVisibility（止める・戻す）だけ（重複の仕組みは作らない）。戻ったあと、映像の時計と BGM の位置が 0.15秒以上ずれていれば MMAUDIO.seekBgm で BGM を合わせる。終わった非ループの曲は戻っても鳴らし直さない。
- **正式 SE 15種（assets/audio/se/mystic_monsters_official/01〜15。音量は registry の gain だけ）**：サイコロ＝DICE_THROW（1回の出目で1回。LAND・ROLL・STOP は silent のまま＝4重にしない）、能力UPの道具が現れる＝TRAINING_ITEM_SPAWN（field-view の trainAct・MMFEEL train.item）、能力UP＝TRAINING_SUCCESS（MMFEEL stat.up。旧 STAT_UP と二重にしない）、市場の購入成立＝MARKET_PURCHASE（index.html の adopt の保存のあと。失敗では鳴らない）、Chapter 開始でモンスターが歩いて入る＝MONSTER_ENTRY（field-view の monEnter・1回）、遭遇＝野生 WILD_ALERT・レア RARE_ALERT・ライバル RIVAL_APPEAR（別々の音）、宝箱＝normal TREASURE_TIER_1・rare TIER_2・special TIER_3（1段階1音。TIER_4 は登録のみ・未接続＝第4段階の宝箱は無い）、休む／休むマス＝REST_RECOVER（休むマスでは EVENT_TRIGGER を鳴らさない）、イベントマスの出来事が始まる＝EVENT_TRIGGER、分かれ道で道を選ぶ＝BRANCH_SELECT。足音 STEP（1マスごと）は silent のまま（4歩の音は1マスごとに使わない）。旧ボード・特訓のサイコロ（sfx(7)）も DICE_THROW を1回。

### 追加修正（2026-10-06・2。いまの正式）

- **Chapter 1 のマスの並び（js/chapter/configs/ch1a.js の ysOf）**：マスの間隔は「画面の上で隣のマスまでの距離 ÷ マスの大きさ（奥行き DEPTH^0.9）」がどこでもそろうように計算（旧：1/(y − HOR) の等間隔＝奥ほど詰まり、奥の2〜3個が重なって見えた）。奥のマスが丘の頂上・道の先へ出ていた背景の奥の端を手前へ（06 0.585・07 0.58・10 0.53・12 0.57）、14 は手前 0.9 → 門の石段の前 0.675（ゴール）。左右の道の幅 LANE_K 0.42 → 0.36（奥の左右のマスが道の端の草に寄らない）。分岐 B の左右の道は [0.79, 0.52]。マスの数（84）・種類・道の長さ（64歩）・45ターンは変えていない。確認＝背景の上にマスを描いた重ね合わせ（全14枚）と実画面（390×844 の全84マス）・tests/next-1006.test.mjs N6-01
- **ベースキャンプ**：通常の画面にダンの常設の立ち絵・一言を出さない（モンスターを中央に大きく＝主役。ダンはイベントの会話だけ＝初回訪問・帰還・育成開始の掛け合い）。通知（msg）は顔・名前なしの帯（.bcsys・押すと消える）。「出発する」は下のバーから 40px 上（高さ700px以下は 26px）
- **イベントの会話**：育成開始の確認（フィナ ↔ ダン）・セルジュの登録／確認／登録完了／支援／世界地図の解放・フィナが名前を呼ぶ会話にも施設の背景（opts.scene）＝後ろの通常のコマンド・パネルを出さない
- **会話の進み方**：共通会話は「表示中にタップ＝全文」「全文のあとにタップ＝次」。タップで全文を出した直後0.3秒は次へ進まない（READ_GUARD_MS＝ダブルタップで読む前に進まない）。自動では進まない（Chapter のフィナの吹き出しも、自動テスト以外はタップで進む）。プロローグは固定の自動再生のまま
- **会話窓と禁則**：会話窓を少し上へ（下の余白 clamp(24px,4.2dvh,40px)＋safe-area）。会話・案内・吹き出しは line-break:strict・text-wrap:pretty。プロローグは句読点・閉じ括弧・小さい仮名・長音・…・―を前の文字に、開き括弧を次の文字に付けたまとまり（MMPRO.kinsoku・span.mpw）で折り返し、段落の最後の1文字だけで改行しない。本文は変えていない
- **新人支援（index.html の grantSupport・OPEN_TALK.support）**：聖獣士登録の完了（セルジュ）のすぐあと → セルジュが新人聖獣士支援制度を説明 → 「1000G を受け取った！」（システム通知＝顔・名前なし）→ 「薬草 を1つ受け取った！」→ 薬草＝疲れを30回復 → （フィナが名前を呼ぶ → 出身地と世界地図 → 世界地図の解放 → フィナが市場へ案内）。受け取りの記録（S.npcFlags.support）・所持金・薬草は会話の前に確定して保存＝再読み込み・再訪・再起動で二重に受け取らない。自動テストの近道（MM_QA_NO_OPENING の名前登録）でも登録の確定で受け取る（会話なし）。登録済みの古いセーブには出さない
- **薬草（MMP7.registerItem herb＋MMCH.registerFatigueItem herb { amount:30 }）**：Chapter の「アイテム」（サイコロを振る前・ターンは使わない）で使うと疲れ −30。売り物ではない（価格なし）。**正式アイコンは未着**（添付・リポジトリに無い）＝名前の文字だけ
- **世界地図（序盤の会話）**：世界の全体が見える倍率のまま（SPOTS の z 1。旧 2.0〜3.0）。案内している地点だけ光る（地方＝少し強くしたやわらかい光が脈打つ・町＝光点とリング）。順は従来どおり フェルナ → アステリア → リベルナ（出身地）→ ミストリア（現在地）
- **街の名札「ミストリア」**：ミストリア専用の名札の素材は添付・リポジトリに無い＝正式の施設の名札（.fmplq）をそのまま小さく左上（お知らせの右・闘技場の札にかからない）。街の背景・下のバー・札は変えていない
- **TEST 大会（試遊用。index.html の TEST_MODE・testTour・testTourEnd）**：TEST_MODE＝true のとき街の右上（設定の下）に小さな「TEST 大会」。押すと今のセーブ（S）を丸ごと控え、連れている子の写し（いなければソラモ）で Chapter 1 の大会受付へ直接。TEST 大会の間は保存しない（save() は何もしない）。大会の終わり・辞退・中断・放棄・メニューの「TEST 大会をやめて街へ戻る」で控えたセーブへ戻して街へ（正式の Chapter の進行・大会ランクの解放・所持金・記録は変わらない。途中で再読み込みしても始める前のセーブ）。**正式リリースでは TEST_MODE を false にするだけで入口ごと出ない**（tests/next-1006.test.mjs N6-03）
- テスト：tests/next-1006.test.mjs（N6-01〜07）・tests/qa-e2e-next-1006.test.mjs（EC-B1＝1000G→500G・補填の通知なし、HB-B1＝薬草、TT-B1＝TEST 大会、TL-B1＝読む間）、qa-e2e-next-1005 の OP-B1（支援の会話・世界地図の全体）・OP-B3（支援は1回だけ）

### PHASE B（2026-10-05。いまの正式。基準 92628b1 への差分）

- **開始画面は無音**：js/audio/audio-registry.js の TITLE＝{ silent:true }（旧タイトル曲 mystic_monsters_title_theme_official.ogg は削除＝読み込みも再生もしない）。流れ＝無音の開始画面 → 開始の音 TITLE_START（正式 SE のまま）→ Scene 1 が出る瞬間にプロローグ BGM。自動テストの既定の名前登録の画面も無音（TITLE）。
- **プロローグ BGM＝正式 v6（38.714秒・gain 0.64・loop:false）**：同じファイル名なので registry は `?v=v6`（端末のキャッシュの旧 54.2秒を使わない）。js/prologue/prologue.js の CUES＝{ scenes:[0,5559,15161,26673], lastText:36276, end:38714 }。schedule は Scene の切り替え・本文の終わりを固定し、Scene の中で文字の速さ（chGap 48ms）・消える時間（outMs 480・gap 120）は一定のまま、残りを段落の読む時間に文字数の比で配る（本文は変えていない・最初の段落は 0.3秒後から）。タップでは進まない・スキップ（2度押し）だけ・裏に回ると映像と BGM が止まり、戻ると BGM を映像に合わせる（従来どおり）。
- **データを消したあとの起動でプロローグが飛ばされる（iOS）の原因と対策**：時計（表に出ている間だけ進む）が、visibilitychange の来ないまま JS が止まった時間（画面ロック・通知センター・アプリの切り替え・読み込み直後の重い処理）を戻ったときにまとめて足し、一気に最後まで進んで「最後まで見た」として記録していた。→ 時計は1回の目覚めごとに最大 STALL_MS（1.5秒）しか進めない（止まっていた分は数えず、BGM は syncAudio で映像に合わせ直す）・pagehide／freeze でも止める・Scene 1 の時計が動き出すまでスキップを押せない（disabled）。「見た」（S.npcFlags.prologue）は最後まで見た／スキップを2度押しで確定したときだけ（途中の終了・強制終了・裏に回った・Scene 1 の前では記録しない）。MMPRO.clock()（テスト用）。
- **新しいゲームの確認**（正式デザイン new_game_confirmation_modal を HTML/CSS で）：「最初からやり直す」のあとの開始画面（P_NEWGAME）で開始ボタンを押すと、中央の確認（濃紺＋金の額・羊皮紙の本文「新しいゲームを始めますか？／現在のセーブデータは上書きされます。／続きから始める場合は、戻るを選んでください。」・「確認しました」・「戻る」）。全面の幕が後ろの操作（開始ボタンを含む）を受け止め、開始ボタンも disabled。出た直後0.35秒は無視（tapHold）。確認しました＝従来の startGame（開始の音 → 新しいゲーム）／戻る＝P_NEWGAME を解いて「つづきから」の開始画面。index.html の ngAsk・ngOk・ngBack。
- **会話の文字送りの改行ずれ**（共通の会話 MMNPC＝フィナ・セルジュ・ダン・市場・研究所・闘技場・NPC イベント・Chapter のイベントなどすべて）：原因＝表示中の文字だけを textContent に入れていたため、文字が増えるたびに折り返しが組み直されていた。→ 行が変わったら全文を先に組む（禁則のまとまり span.mtw＝折り返さない・1文字ずつ span.mtc。まだの文字は opacity 0 で場所を取る）→ 出た文字から .on。選択肢のある行は選択肢の場所も先に取る（.mmtalk-choices.pre）＝全文のあとに選択肢が出ても本文・窓が動かない。禁則（MMNPC.kinsokuGroups）：。、，．・：；？！…‥―ー〜・小さい仮名・閉じ括弧は前の文字に、開き括弧は次の文字に、各行の最後の1文字だけで改行しない。タップ（表示中＝全文／全文のあと＝次）・0.3秒の読む間・自動で進まない、は従来どおり。プロローグには入れていない。閉じたら文字の要素を片付ける（DOM を残さない）。
- **正式の会話窓**（event_dialogue_window）：濃紺の地・金の太い額＋内側の細い金線・四隅の金の飾り（.mmtalk-orn）・下の中央の小さな菱形・六角の名札（濃紺＋金縁）・白い文字・金の▼。イベント（kind 'event'）・施設の背景つき（opts.scene）・大型（opts.big）・board の会話は同じ窓（js/npc/npc.js の big）。後ろは施設の背景と必要な NPC・窓だけ（従来の data-mmscene）。
- **システム通知の帯**（js/feel/notice.js の MMNOTE。上の §2）：新人支援は「セルジュの会話 → 帯『1000G を受け取った！』 → 会話 → 帯『薬草 を1つ受け取った！』（薬草の正式アイコン）→ 会話」（受け取りの確定・保存は従来どおり会話の前）。世界地図の解放（帯 → セルジュ）。古いセーブの救済（補填して購入）＝帯（街の通知は出さない）。大会の初回優勝の賞金・バッグの拡張＝帯（結果の画面の報酬欄はそのまま）。通常の新しいゲームの購入には補填の知らせは出ない（従来どおり）。
- **薬草の正式アイコン**（assets/items/herb.webp）：出発準備のバッグ・保管庫、アイテム管理、アイテム補給所の売却・図鑑、Chapter のアイテム、帯。効果（疲れ −30・Chapter のアイテムで使う・ターンは使わない・使ったら消えて保存）は変えていない。
- **街の名札「ミストリア」**（mistoria_city_nameplate）：上の中央（お知らせと設定の間）の濃紺＋金の額・上の小さな紋章・城の印（.tcity。押せない）。旧 .fmplq の流用はやめた。施設の札は名札の下より上に置かない（button.tpin の top に max(…, safe-area＋114px)）・低い／狭い画面では闘技場の札を少し左へ（牧場の札と重ならない）。4サイズで重ならない（PB-B6）。
- **聖獣士管理局の BGM**（BUREAU＝mystic_monsters_bureau_bgm_official.ogg・v6・46秒・gain 0.46＝約 -20 LUFS・45.7秒の手前で頭へ 0.25秒のクロスフェード）：bureauScr・序盤の管理局（opBureau・opAfterReg）・聖獣士登録（p11NameScr の序盤の導線）で bgm("bureau")。会話では止めない・管理局の中で画面を変えても鳴らし直さない・街へ出ると TOWN。v1〜v5 は使わない。
- **ライバル遭遇の「竜」が出ない**：原因＝ライバルの遭遇の演出（field-view の encounterShow）は人物も相棒も描かない作り（foe＝null・battleTypes.rival.figure＝null）で、**竜（リュウの相棒）の正式素材がリポジトリ・受け取ったどの ZIP（11個）・チャットの画像にも無い**（MMRIVAL の partner も null）。素材の未接続・パス・z-index・読み込みの問題ではない。→ リュウ本人は正式立ち絵（assets/npc/ryu/）を遭遇の画面に出す（config の encounterFigure・赤い魔法陣の上・RIVAL の帯の下・画面の中・先読み）。竜は新しく作らない＝config の encounterPartner（null）に正式素材を1行書けば .ce-partner に出る。文面・進行は変えていない。
- **大会ランク選択の正式 UI**（rank_selection_final ほか。画面を1枚の画像にしない）：行ごとに状態から描く（p9RankRow・p9RankState・MMP8.eligibleRanks・MMP8L.LEAGUE_SIZE は従来どおり）。参加可能（open・next・clear）＝赤〜ワインレッドの地＋金の縁、中央のエンブレム（ランクごとの色 P9_RCV_EMB：E 青・D 若草・C 緑・B 金・A 赤・S 深紅＋月桂樹＋金の文字）、緑の札「参加可能」（クリア済は「クリア済」・挑戦目標の札は従来どおり）、「参加者 N体 / N−1試合」。未解放（lock）＝青〜濃紺の地＋交差した2本の鎖（.rcv-chain.a／.b）＋エンブレムの下の南京錠（.rcv-lock）＋赤い札「参加不可」・押せない div。**解除の演出**：前にこの個体の受付で見た「選べる最高のランク」（S.npcFlags.rankSeen[uid]・v6 の任意項目）より上が新しく選べるようになった行だけ、青の地（.rcv-unveil）＋鎖＋錠から鎖が外れて錠が落ち、赤の参加可能へ（約1.7秒・1回）。初めての受付は演出しない（E・D は最初から）。解放の規則（E・D は最初から・D→C→B→A→S・E のクリアは D に関係しない・E/D 6体5試合・C〜S 8体7試合）は変えていない。既存のランクエンブレム6種のシート（assets/tournament/rank_emblems）は E〜S の対応が無く絵柄も見本と違うため使っていない（従来どおり保留）＝エンブレムは従来の HTML/CSS の部品（.rcv-em）を見本の色に。
- **TEST 大会**：受付は同じ正式 UI（p9ReceptionHtml）。TEST 大会の間は save() が何もしない＝rankSeen・解放・結果・所持金・進行は書き換わらない（従来どおり。PB-B4）。
- **アイテム管理**（ベースキャンプの左上の独立した導線・正式アイコン）：index.html の itemScr＝所持アイテム（バッグ・保管庫の数）・バッグのスロット（タップ＝保管庫へ）・保管庫（バッグへ）。処理は MMP7.moveBagToVault／moveVaultToBag（従来）。購入・売却・新しい効果・装備は無い。Chapter 中は開けない（canAccessVault）。
- **アイテム補給所**（item_shop_screen）：入口＝ベルナの一言＋3つの導線（購入／売却／アイテム図鑑・正式アイコン）。shopScr(msg, bought, tab)：'buy'＝従来の商品一覧（MMP7.shopBuy・商品は未登録＝「商品は準備中です」）、'sell'＝保管庫のアイテム（MMP7.shopSell・売値の無い薬草は「売れない」）、'book'＝アイテム図鑑（MMP7.listItemDefs＝登録済みのアイテムを見るだけ・効果・価格／非売品・所持数）。商品・価格・所持数・購入／売却の処理は変えていない。ベースキャンプの下のバーの「アイテム」は従来どおりアイテム補給所へ。
- **やらなかったこと**：サイコロの正式差し替え・施設名＋アイコンの入場演出（不採用）は入れていない。
- テスト：tests/phase-b-1005.test.mjs（PB-01〜10）・tests/qa-e2e-phase-b.test.mjs（PB-B1〜B6）・tests/qa-e2e-prologue.test.mjs の PRO-B5（まっさらな保存領域 → 必ずプロローグ・途中で再読み込み → 見た記録なし → 次の起動もプロローグ・最後まで見たら記録）・PRO-B6（45秒の凍結で一気に進まない・pagehide で止まる）

### 実機試遊の修正＋リュウ／レグナス（2026-10-05 夜。いまの正式。基準 b80d787 への差分）

- **Chapter のフィールド BGM の途切れ**：コードの上では同じ場面の再指定（board() のたびの bgm("chapter")）は何もしない・頭出しもしていなかった（MMAUDIO.scene の「同じ場面は何もしない」）。途切れの原因の候補（iPhone の実機では未確認）＝①iPhone の Safari は `<audio>` → MediaElementSource → GainNode の音を、メインスレッドが忙しい画面（Chapter のフィールド＝カメラ追従・歩行の rAF）で取りこぼしやすい ②Chapter 1 のループ区間の手前で2本目の `<audio>` に同じファイルを読み直していた（約3秒前の load・余裕 0.2秒）③タップのたびに navigator.audioSession.type を設定し直していた。→ registry の `buffer: true`（CHAPTER_1〜4）＝ファイルを一度デコードして AudioBufferSourceNode で鳴らす（音声スレッド・ループ区間はサンプル単位・2本目の `<audio>` を使わない）。デコードが終わるまでは従来の `<audio>`、終わったら同じ位置から切り替える。バトルなどで離れて同じ曲に戻ったら続きの位置から（15分以内。新しく Chapter に出発したとき＝p7Depart は MMAUDIO.resetBgmPos で頭から）。デコードした曲は1曲だけ持つ（iPhone のメモリ）。次の Chapter の曲はベースキャンプで先にデコード（MMAUDIO.prefetchBgm）。audioSession は変わるときだけ設定。曲・音量・ループ区間は変えていない。js/audio/audio-manager.js の bufPlay／bufSwap／bufStop、status().buffer
- **名前を決めたあとの一瞬の再表示**：原因＝確認の会話の間も #app は名前の入力画面のままで、会話が閉じるフェード（約0.22秒）の間に下の入力画面が見えていた（確認 → 登録完了・登録完了 → 新人支援の2回）。→ 確認を始める前に名前の画面を片付けて管理局の背景だけ（opShell）にし、確認と登録完了を1つの会話（branches.ok）でつなぐ（選んだ時点で登録・保存）。「書き直す」のときだけ名前の画面へ（入力した名前のまま）
- **新人支援の帯の SE**（MMNOTE.show の se＝帯が出た瞬間に1回・帯は1つずつ＝重ならない）：1000G＝GOLD_GET（既存の所持金の入手の音＝Ivokard bell.ogg。硬貨の「チャリン」専用の音ではない）・薬草＝REWARD・世界地図の解放＝UNLOCK（REWARD と UNLOCK は同じファイル＝ObsydianX confirm_style_6_002）。新しい音源は足していない
- **聖獣士管理局の通常の画面**：背景＋セルジュ＋下のコマンドだけ（どのコマンドも選ばれていない・パネルは開いていない）。押したコマンドだけ開く＝bureauScr('card')（聖獣士証＋功績）／('ach')（功績一覧）／世界地図。セルジュの立ち絵は高さで決める（.bu .bunpc に height。それまでは元の画素の大きさで巨大に出ていた）。序盤の導線は従来どおり街で終わる
- **世界地図**：リベルナを光らせる・点滅させるのは序盤の案内（MMMAP.open）だけ。管理局の地図（viewer）は印と名前だけ（.wm-pin.still＝光の輪なし・発光なし）
- **アイテム屋**（ユーザー向けの名前は「アイテム屋」に統一。旧「アイテム補給所」はユーザー向けの表示から削除）：施設の画面 shopShell＝上に戻る・名札「アイテム屋」（Shippori Mincho）・所持金、正式背景＋ベルナ（全身の表情差分を大きく）、下に購入／売却／アイテム図鑑の3つの導線（正式アイコン）。購入／売却／図鑑の中身は窓（.dbody）でベルナは少し小さく後ろへ。商品・価格・購入／売却の処理は変えていない。ベースキャンプの「アイテム管理」（itemScr）は別の画面のまま
- **ベースキャンプ**：「出発する」は下のバーから 72px（高さ700px以下は 50px）。モンスターの場所（.bcfield）も同じだけ上へ。モンスターの下の名前・種類の帯（.bcname）は出さない
- **Chapter へ入るときの「スパッ」**：正体＝フィールドの器の登場アニメ（chfwin＝不透明度 0→1・0.3秒）の間に、後ろのページの明るい地色が透けて白っぽい画面が約0.1〜0.2秒見えていた。→ フィールドの器の後ろ（#app・ページ）を器と同じ濃紺に（#app:has(>.chfw)・html:has(#app>.chfw)）。Chapter 開始の演出（MMCHI）はそのまま
- **Chapter の HUD の特訓チケット**：既存のチップ（#chtix＝S.trainTix。新しいセーブ項目なし）を所持金の右に1行で（幅の狭い画面で2行目へ折り返していた＝.chh-chips を nowrap・狭い画面は余白と文字を少し詰める）
- **リュウ／レグナス**：リュウの正式立ち絵＝assets/npc/ryu/ryu_official_fullbody.webp（ZIP の白背景 JPEG を透過・original/ に元の JPEG）。旧 full_normal.webp は削除。正式の相棒レグナス＝assets/monsters/regnas/regnas_official.webp（市松模様の焼き込みを透過・original/ に元の JPEG）。データは js/phase10/monsters.js の RIVAL_MONSTERS（プレイヤー用の SPECIES とは別＝市場・図鑑・合体・初期選択・特殊復元・牧場には出ない。正式技10個・入手方法は未決＝moves null）、MMRIVAL.CONFIG.partner 'regnas'。遭遇の画面は左にリュウ（全身）・右にレグナス（ch1a の encounterPartner 'rival_regnas'）。バトルの強さ・fight() は変えていない
- **購入の知らせ「〇〇をつれて帰った！」が街に残り続ける**：原因＝通常の購入は街の案内欄（.tlow の #msg）に出していて、タップするまで消えなかった（救済のときだけ帯だった）。→ 購入の知らせはすべてシステム通知の帯（MMNOTE・モンスターの正式画像・約2.6秒で自動で消える・タップで早く消える）。街の案内欄には出さない＝街の再描画・施設の行き来・再読み込みでは出ない・セーブに入れない。購入処理・所持金・牧場への追加は変えていない（index.html の adopt）
- **Lv の表記を出さない（ミスティックモンスターズにレベル・経験値・レベルアップは無い）**：ゲーム全体で表示していたのはバトルの2か所だけ＝①バトル開始の演出（intro。fight() の外）の「Lv.N」→ 削除 ②バトルの HUD（自分・相手の名前の横。fight() の中＝Phase 6・変更禁止）→ fight() とバトル画面の保護対象の CSS（.bt 系）は変えず、別の CSS 1行（`#bt .hn1>span{display:none}`）で表示だけ消した。内部に残るもの＝index.html の `lvv()`（6能力の合計 ÷ 50。fight() の中の HUD の表示用にだけ呼ばれる・能力・勝敗の計算には使っていない）。fight() を次に変えてよいときに、HUD の `<span>Lv.…</span>` と lvv を消せる。能力値・新しいランクの数値は足していない
- テストの注意（購入の帯）：購入のあと約2.6秒は帯（MMNOTE）が画面の上にあり、その上を押すと帯が閉じるだけ（下のボタンは押されない）。購入のすぐあとに街・牧場などを操作する実ブラウザテストは `MMNOTE.flush()` で帯を片付けてから（qa-e2e-tech-screens・qa-e2e-ranch-fusion／-fuse）
- やらなかったこと（次回の正式素材待ち）：大会ランク選択の画像素材化・ミストリアの名札の差し替え・マスを線でつなぐ・3D サイコロ・新しいプロフィール UI
- テスト：tests/trial-1005.test.mjs（TR-01〜08）・audio-manager の AUDIO-28・phase-b-1005 の PB-11、実ブラウザ tests/qa-e2e-trial-1005.test.mjs（TB-1〜8）

### 正式素材の統合（2026-10-05 夜・2。いまの正式。基準 54a4f3b への差分）

- **レグナスの正式技10個**（js/phase10/monsters.js の RIVAL_MONSTERS の moves＝1か所。竜眼ロックは「竜」）：1 きりさく（ちから 80・90%・10%）2 しっぽアタック（ちから 90・75%・10%）3 竜眼ロック（自分の命中 小＝+10%・2ターン）4 残影ステップ（自分の回避 小・2ターン）5 ドラゴンクラッシュ（ちから 110・80%・15%）6 蒼光ブレス（かしこさ 105・85%・10%）7 スナイプファング（ちから 95・100%・10%。必中ではない）8 幻影クロー（ちから 90・85%・35%）9 蒼刃乱舞（ちから必殺 130・90%・25%）10 テイルサイクロン（ちから必殺 125・95%・20%）。補助技は重ねがけしない（stackable false＝使い直すと残りターンを更新）。補助技の命中は 100（表に値が無い＝【暫定】・ほかの補助技と同じく回避の計算は通る）。習得（データだけ・プレイヤーは使えない）：1〜4 初期・5 ちから特訓・6 かしこさ特訓・7 命中特訓・8 回避特訓・9／10 丈夫さ特訓（1回目は未習得の2つからランダム・2回目は残り＝MMRP.learnByToughness）。MMP7.registerMoveset('regnas')。市場・初期選択・牧場・特殊復元・合体・図鑑には出さない（SP に入れない。絵は IMG[4] だけ）。
- **ライバル戦**（js/battle/rival-partner.js）：相手の名前・絵・技だけレグナスに（技は最小構成＝初期の4技。必殺技は入れていない）。強さは従来どおり MMRIVAL.rankFor のランクの値（難易度は変えない）。野生・レア・大会は従来どおり。
- **蒼銀の反撃**：レグナスが相手の攻撃（威力のある技）を回避 → 次にレグナスが与えるダメージだけ ×1.20（四捨五入）を1回。重複しない・補助技やレグナスの空振りでは消えない・与えたら消える・バトルのセッションに結びつけた WeakMap だけ（セーブしない・次のバトルへ持ち越さない・最初は構えていない）。発動時に「蒼銀の反撃！」の札（0.72秒＝fight() がダメージを出す時刻）。実装は MMBattle.resolveAction を包む（中身はそのまま呼ぶ。ライバル戦の間だけ・after() で元へ戻す）。**Phase 6 の変更なし**（fight()・battle-bridge・adapter・ルーレット・.bt 系 CSS のハッシュは不変）。
- **技の演出**：anim() の先頭（Phase 6 の外）で k≥20 を MMRP.anim へ。静止ポーズ＋FX＋Web Animations（溜め・踏み込み・残像・閃光・揺れ・ノックバック）。長さ：1〜4 約0.8秒・5〜8 約1.0秒・9〜10 約1.4秒（fight() の技の後の待ち 1.5秒に収まる）。視差を減らす設定では動き・閃光・揺れなし（ポーズと FX のフェードだけ）。蒼刃乱舞の連撃は見た目だけ（ダメージは1回）。テイルサイクロンは地上で回る（飛ばない）。
- **大会ランク選択**：行の見た目は正式画像（参加可能＝rank_available_X の button／参加不可＝rank_unavailable_X の div）。状態・規則（E・D は最初から・D→C→B→A→S・E のクリアは D に関係しない・E/D 6体5試合・C〜S 8体7試合・F なし）は従来どおり。クリア済＝札（.rcv-clr）、挑戦目標＝札と光、選択中＝光（drop-shadow。色は変えない）。解除の演出＝参加不可の画像を上に重ねて少し落としながら消す（rankSeen の規則は従来どおり）。6段は 360〜414 の4サイズで画面に収まる（高さが足りなければ一覧だけスクロール）。旧 CSS の鎖・錠・エンブレム（.rcv-plate・.rcv-em・.rcv-chain・.rcv-lock）は使わない。
- **街の名札**：正式画像（縦横比のまま・幅 min(画面−136px, 136px)・箱は絵の部分（686×280）だけ）。お知らせ・設定の丸ボタンと重ならない（4サイズ）。背景・施設の札の位置は変えていない。
- **共通UI A群**：安全に透過できた2点だけ適用（A-04 赤の主ボタン＝ベースキャンプの「出発する」、A-05 所持金のパネル＝ベースキャンプ・アイテム屋）。ほかは素材待ち（assets/ui/a_group/README.md）。元の PNG の URL は 403。
- テスト：tests/rival-partner-1005.test.mjs（RP-01〜06）、実ブラウザ tests/qa-e2e-rival-1005.test.mjs（RV-B1／B1b／B2）・tests/qa-e2e-ui-1005.test.mjs（UI-B1〜B3）。RK-03・PB-10・TN-01・N6-07・TR-08・JR-6・PB-B4 を新しい素材に合わせて書き直し

### 共通UI の正式素材（2026-10-06 第1弾。基準 a4fb03a への差分。**下の「重大修正と共通UI 第2弾」が優先**＝WebP は PNG に置き換え・「使っていない」の一部は第2弾で採用）

- 受け取った ZIP mismon_UI_A2／A3／B1／B2／B3_prepared（A-13〜A-36・B-01〜B-51 の75枚）は**すべて RGB＝市松模様が画素として焼き込まれている**。外周から続く彩度の低い明るい画素（市松模様と外側の淡い光）だけを透明にし、縁を元の 8px（表示で約1px）内側へ。目視で市松模様・白い縁が残らないものだけを採用（assets/ui/b_group/README.md）。
- **ユーザーの選択＝「対応が明確な画面に適用」**：セーブ／ロード（スロット B-04・右の四角＝そのスロットの連れている子の正式画像・セーブ A-20・ロード A-22・空きスロットのロード B-06）、プロフィール（プレイヤーの札 B-02＝丸の中に顔・右に名前。行は従来のまま）、牧場（下の4つ B-15＝見る・名前変更・預ける／受け取る・売る（赤）・一覧の枠 B-14＝border-image の外枠だけ）、ステータス（固有スキルの枠 B-23＝border-image・点線は round）、研究所（下の3つ B-13）、市場（左右の矢印 B-45／B-44）。画像は縦横比のまま（背景 100% 100%＋同じ aspect-ratio、または border-image）・文字とアイコンは HTML・押せる範囲は従来のボタン・処理と遷移は変えていない。プロフィールは低い画面で器の中だけスクロール。
- **使っていない**：透過できない（光の白・中の市松模様）＝A-14・A-19・A-21・A-27・A-32・A-34・A-35・B-05・B-07・B-08・B-11・B-16・B-18・B-20・B-35・B-37・B-42／見本の中身が焼き込まれている＝B-17・B-24・B-26〜B-32（能力バーの長さが固定）・B-36・B-38／空いた枠に入れるアイコンが無い＝B-03（プロフィールの行）／使う場所の判断が要る＝そのほか（Chapter の操作欄 B-21 は正式の deck 画像のまま）。
- テスト：tests/ui-b-1006.test.mjs（UB-01〜02）・実ブラウザ tests/qa-e2e-ui-b-1006.test.mjs（UB-B1＝4サイズ×6画面・UB-B2＝画像の上のボタンが押せる）。セーブ画面の「ロード」の saturate の filter（色を変える）は消した（画像の色を変えない）

### 重大修正と共通UI 第2弾（2026-10-06・2。いまの正式。基準 83a3bcb への差分）

- **ダブルタップでズームしない**：index.html の `<style>` の先頭で `html,body,*{touch-action:manipulation}`（ダブルタップのズームだけ止める。タップ・スクロール・横スワイプ・ピンチは従来どおり）。viewport の maximum-scale・user-scalable は変えていない（ピンチで拡大できる）。iPhone 実機の最終確認はユーザー
- **プロローグ BGM を削除**（プツプツ鳴るため）：js/audio/audio-registry.js の PROLOGUE＝{ silent:true }・ファイル mystic_monsters_prologue_bgm_official.ogg は削除・index.html の proPlay は BGM を鳴らさない（proBgmStart は残るが呼ばない）。プロローグの時刻表（MMPRO.CUES）・本文・スキップ（2度押し）・見た記録・裏に回ったときの止まり方は変えていない。開始画面は従来どおり無音・開始の音 TITLE_START はそのまま
- **iOS で外部の音（アラームなど）のあとに音が出ない**：js/audio/audio-manager.js の context().onstatechange が 'interrupted'（iOS）と、裏に回していないのに 'suspended' になったことを記録（st.interrupted）→ 次のタップ（unlock）で resume、効かなければ約0.12秒後に suspend → resume（reviveContext）。表へ戻ったとき（visibilitychange）・pageshow・focus では wake()＝AudioContext を resume し、今の場面の BGM の `<audio>` が止まっていればその1本だけ鳴らし直す（終わった非ループの曲は鳴らさない・2本目を作らない＝BGM の二重再生なし）。AudioContext は作り直さない（`<audio>` は MediaElementSource に1回しかつなげない）。ミュート・音量（localStorage mmaudio・mr4a）は触らない。status().interrupted・MMAUDIO.wake。テスト AUDIO-29。iPhone 実機の最終確認はユーザー
- **リュウの相棒は全経路でレグナス**：監査＝フィールドのバトルの入口は bBattleGo だけ（ライバルのマスは MMRP.arm()＝fight() が相手を作った直後に名前・絵・技をレグナスへ）・バトル中の再読み込み → 中断扱い → もう一度選ぶと arm し直す・勝ち負けの文に相手の名前は無い・Chapter 3／4 にライバルは無い。**Chapter 2 のライバル（sa_2）の遭遇の画面に人物・相棒が無かった** → js/chapter/configs/ch2a.js の battleTypes.rival を Chapter 1 と同じに（ライバルのリュウ・encounterFigure rival_ryu・encounterPartner rival_regnas・「リュウが立ちはだかった！」）。通常のガウル（市場・図鑑・自分の子）は変えていない。テスト RV-B3（遭遇〜導入〜実戦で相手側にガウルが出ない・自分のガウルはそのまま）・RV-B4（途中で再読み込み → 再戦もレグナス）・RV-B5（Chapter 2）
- **共通UI 第2弾**（index.html の CSS「2026-10-06 共通UI 第2弾」の1か所・素材は assets/ui/。README.md）：施設名ラベル B-01（ステータス・牧場・アイテム屋・セーブ／ロード・ベースキャンプの名札。ベースキャンプの名札の羅針盤の印は出さない）、Chapter のリボン B-09（ベースキャンプの次の Chapter・Chapter 開始の演出の Chapter 名）、プロフィール行 B-03（丸＝線画のアイコン PROFILE_IC・帯＝見出しと値・四角＝単位。設定の行は従来のまま）、オートセーブ B-07（四角＝連れている子の正式画像・下の枠＝所持金 .svgold）、バックアップ B-08、市場のドット B-12（ほか）／B-11（いま）、ステータスの能力バーの色 B-26〜B-31（フィルの部分だけ。ライフ 黄・ちから 赤・かしこさ 緑・命中 ピンク・回避 水色・丈夫さ 青。長さは値）・能力の丸 B-43、技の一覧の未習得 B-37（🔒 の代わり）、赤の正式ボタン B-49（危険の確認の「育成をやめる」・市場の「購入する」・大会の「この大会に参加する」・冒険のメニューの「育成放棄」）・押せない B-50・青 A-19（危険の確認の「やめない」・新しいゲームの「確認しました」・冒険のメニューのボタン）、新しいゲームの確認の羊皮紙 A-17、お知らせのノート B-51、Chapter の HUD の上段＝冒険の進行ヘッダー B-20（丸＝Chapter 番号・2本の帯＝Chapter 名と背景名・線＝進み具合（育成中の子の顔が動く）・四角＝☰。START／GOAL の文字は出さない。DOM と id は従来のまま）、冒険のメニュー（☰）の枠 B-22（上の金の帯＝「メニュー」・右上の ✕ の上に透明な閉じるボタン）。処理・押せる範囲・無効／選択の状態は変えていない
- **使っていない部品**（理由は assets/ui/b_group/README.md）：光のにじみ（A-21・A-32・A-34・A-35・B-05）、見本入り（B-16・B-17・B-24・B-32・B-36・B-38）、技のルーレットの空き枠 B-35（技管理の行の class がバトルの技ルーレットと同じ＝Phase 6 の保護 P7-32 に当たる）、今の画面に合う場所が無い（B-10・B-18・B-19・B-21・B-25・B-33・B-34・B-39〜B-42・B-46〜B-48・A-13〜A-16・A-18・A-23〜A-31・A-33・A-36）。**A1（A-01〜A-12）と docs の ZIP は受け取っていない**
- 牧場の .rn（画面の器）と技管理のルーレットの名前の span（.rn）が同じ class 名。**2026-10-08（監査 H-06）：牧場の器の規則を #app>.rn に限定して解消**（技名が濃紺の帯に隠れていた）
- テスト：tests/ui-b-1006.test.mjs（UB-01＝PNG・RGBA・表示の約2倍まで・使う部品だけ置く、UB-02、UB-03＝第2弾の縦横比・色の対応・filter なし・処理は従来のボタン）、実ブラウザ tests/qa-e2e-ui-b-1006.test.mjs

### UI 試遊修正（2026-10-06・3。いまの正式。基準 d9fccc6 への差分）

- **Chapter 開始の演出はスキップ不可**（js/chapter/intro.js）：タップしても飛ばさない（タップは演出の幕が受け止めて下の画面へ届かせない）・「タップでとばす」は出さない・最後まで自動で再生してから通常の進行へ。MMCHI.skip() はコードからだけ（テスト・画面の片付け）。ほかの会話・演出は変えていない
- **野生の遭遇＝黒いシルエット・画面の中央付近**（js/chapter/field-view.js の encounterShow・CSS .chf-enc2.sil）：相手（バトルの相手と同じ種族）の絵の形を mask にした黒い面（.ce-sil。画像の色は変えない）。img は見せない（alt「？？？」）。演出全体の中心を 56% → 47%（--ce-y）。レア・ライバルは従来どおり
- **会話の折り返し**：原因＝`text-wrap:pretty` が iPhone の Safari で段落全体を均すため、会話窓の幅を使い切らずに早く改行されていた → 会話・案内・吹き出しは `text-wrap:wrap`（line-break:strict は残す）。本文は MMNPC.phraseGroups（js/npc/npc.js）＝Intl.Segmenter の語に、続く漢字・カタカナ・ひらがな（助詞・活用）を付けたまとまり（最大10字）で折り返す（語の途中・助詞の前・句読点の前で切らない・「お／ご」は次の語・開き括弧は次・閉じ括弧は前・最後の1文字だけの行を作らない・とても長い語は従来の kinsokuGroups）。Segmenter が無い環境は従来どおり。プロローグは従来の禁則のまま
- **街の会話**（フィナの案内・短いイベント）：会話窓と立ち絵を下のバーの上へ（html:has(#app>.map.town):not([data-mmscene]) の .mmtalk-stage の下の余白＝バーの高さ＋14px）
- **大会ランク選択（S〜E）を1画面に**（index.html の CSS「大会ランク選択（S〜E）をスクロールなしの1画面に」）：上の旧い赤い幕 → 正式の施設名ラベル B-01「公式大会」、行の高さ＝（画面の高さ − 上・注記・下の配分 --rcv-res）÷ 6（正式画像の縦横比のまま）、下のフィナと2つのボタンを詰めた。360×800・375×667・390×844・414×896 で6段とも画面の中（一覧のはみ出しは数 px＝行の絵の下の飾り）。「この大会に参加する」の押せないときの絵が切れていた（古い一括指定が大きさを auto に戻していた）＝B-50 の大きさ・位置を指定（市場の購入・最終確認も同じ）
- **ベースキャンプの下の5つ**（特訓・アイテム・ステータス・技管理・街へ戻る／中断）：正式の四角の枠 B-34（assets/ui/b_group/b34_roulette_slot_blank.png・border-image）・5つとも同じ幅。アイコン・文字・行き先は従来どおり
- **最終確認（危険の確認）の窓**：外枠＝正式の枠 B-14（border-image の外枠）、上の中央の旧い赤い飾り → 正式の丸い枠 B-43＋金の菱形。ボタン（A-19・B-49・B-50）・文面・処理は従来どおり
- テスト：tests/next-1006.test.mjs の N6-05（text-wrap:wrap）・N6-08（会話のまとまり）、qa-e2e-journey の JR-9（タップで飛ばさない）、ui-b-1006（B-34・押せないボタンの大きさ）

### 本体修正＋大会UI統合＋技アニメ＋バトル演出（2026-10-06・4。いまの正式。基準 3ad6d77 への差分）

- **このゲームに「ガッツ」は無い**：技のデータ・技の表示・内部のデータに使わない（tests/battle-1006.test.mjs の MV-05 で監視）。
- **大会の正式の流れ＝大会1 → 大会2 → 大会3 → バトル**（index.html の p8TourScr・p9CompareScr・tourVsShow。素材 assets/tournament/ui1・ui2・vs）：
  - 大会1 対戦表（`.p9tour.tb1`）：題字の札「公式ランクX大会」・小さな札「第N試合 / 全M試合」・対戦表（6体＝grid6／8体＝grid8。左に参加者の丸と名前の札・上に丸・マスに勝ち／負け／未対戦／次の試合の印＝MMP8L.resultCell）・次の相手の行と丸が光る・凡例・「あなた」「次の相手」の札と名前・セドリックの一言（高さ760px以下は出さない）・「対戦する」→ 大会2。旧「現在の成績」の一覧（README で不採用）・順位表・対戦表の表は出さない（順位表は結果の画面に残る）。大会開始の演出の直後は対戦表の参加者が順に入る（P9_ENTER）。メニュー（☰）は左上。
  - 大会2 対戦前比較（`.p9cmps.tb2`）：上＝「第N試合 / 全M試合」（大会名は重ねない＝01_header は文字の焼き込みのため不使用）・あなた／対戦相手の札・左右のカード（中に正式画像・下に名前。相手は短い名前）・VS・能力の比較（能力の枠の見本のバーの上に HTML のバー＝999 を最大・数字なし。位置は TB_STAT）・固有スキル（MMP10M.skillText）・「対戦開始」（2度押し）・「対戦表にもどる」。セドリックは出さない（正式デザインどおり）。
  - 大会3 VS 演出（`#tvs`）：背景・斜めの光・相手（右上）／自分（左下）の正式画像・名前の札と飾り・VS のロゴが落ちて光と揺れ（約2.5秒・タップで早送り・視差を減らす設定では止めて0.9秒）→ p8TourFight。fight() の導入（CHALLENGER／VS）はこの試合だけ出さない（intro を外から包む TB_SKIP_INTRO）。fight()・intro() の中身は変えない。
  - モンスターの専用アイコンは未着＝正式画像を丸く切り抜く（TOUR_ICON_POS）。大会の処理・人数（E/D 6体5試合・C〜S 8体7試合）・解放・賞金は変えていない。
- **正式技（js/phase10/monsters.js の OFFICIAL_MOVES・movesOf・moveBySlot）**：ソラモ・ガウル・ノビトンの正式10技（威力・命中・CR・効果）、ジオルは名前だけ（数値は未同期＝null）、レグナスは既存の数値（技辞典の画像は id で引く）。旧名（とっしん・ドリルアタック・超スターダストレイ・くっつく・ピンポイント突き・ウイングアタック・バードアタック・ファイアビーム・ガウルのひっかき）は正式技に無い。
  - バトルで使うのはソラモ・ガウル（js/battle/official-moves.js が SK の 0〜19 を入れ替え）。**習得の枠（番号）は従来のまま**：ソラモ＝初期 0 たいあたり・1 ひっかき・2 しっぽアタック・3 吠える／4 ちから特訓 スタークラッシュ／5 かしこさ ソラモビーム／6 命中 すなかけ／7 回避 ほしのまもり／8・9 丈夫さ スターダストレイ・スターフォール。ガウル＝初期 10 スパイラルダイブ・11 つつく・12 ウィンド・13 ソニックムーブ／14 ちから 紅翼スラッシュ／15 かしこさ ファイアボール／16 命中 フレアレイ／17 回避 スカイラッシュ／18・19 丈夫さ フェザーストーム・聖なる炎（どの枠に入れるかは仕様に無い＝要確認）。
  - 補助技の命中は表に無い＝100【暫定・要確認】（吠える の旧 60 も 100 に）。効果はエンジンの区分へ（ちから・かしこさ＝攻撃力 atk・丈夫さ＝防御 de・命中 hi・回避 ev）。聖なる炎＝当てたあと自分の攻撃力・命中・回避・丈夫さ（小・1ターン。ライフ・素早さは上げない）。
  - ノビトンの状態異常（まひ・ねむり）・回復（ひとやすみ）・特殊（ダウナーミストの計算の能力）は今のバトルエンジン（Phase 6）に無い＝データだけ（ノビトンはまだバトルに出ない）。固有スキル（逆境のひと踏ん張り・紅翼の猛攻・ふしぎな嗅覚）はバトルに未実装のまま（データ implemented:false）。
  - 旧技の絵の付け替え（VISUAL）：ソラモ 7 ほしのまもり＝星の絵（8）、ガウル 10 スパイラルダイブ＝旧ドリルアタックの回転（14）・14 紅翼スラッシュ＝旧ウイングアタック（16）・16 フレアレイ＝旧ファイアビーム（18）・18 フェザーストーム＝旧ウィンドの風（12）。正式技の小さな絵は素材待ち。
- **技アニメーションの正式資料**（assets/moves/・50枚）＝技辞典（js/battle/movedex.js）。バトル中に画像そのものは出さない（カットの説明文・緑の背景が焼き込まれている）。ノビトンの 07 は旧「ピンポイント突き」の4カットを正式に流用（画像のタイトルは旧表記・正式名は しびれ突き）。
- **バトルの共通演出（js/battle/stage.js）**：tier（正式技の威力。補助＝威力なし・基本＝85以下・強技＝90〜115・必殺級＝120以上）ごとに 構え 0.17〜0.21秒 → 溜め（強技 0.23秒・必殺級 0.52秒＝背景を暗く・光の輪・粒）→ 今までの技の絵（基本 ×1.4・強技 ×1.18・必殺級 ×1.0 の速さ）→ ヒットストップ（0.07／0.1／0.14秒・クリティカルは +0.05秒＝バトル画面の動きを止める）→ ノックバック・被弾の光（相手の絵の形のマスクに白＝色の加工なし）・HP の枠と背景の揺れ → ダメージの表示（当たったあと約0.07秒）・HP バーは さらに 0.12秒遅れて減る → 余韻（0.24〜0.42秒）→ 次のターン。攻撃の長さ＝基本 約1.24秒・強技 約1.69秒・必殺級 約2.23秒（＋余韻）。攻撃中は背景を攻撃側へ少し寄せ、ルーレットは引っ込めたまま（既存の .bui.anim）。外れたときは相手がかわす動き（被弾の演出なし）。補助技（ほしのまもり＝光の盾と粒／ソニックムーブ＝高速の左右移動と残像）・聖なる炎（炎の溜め → 攻撃 → 加護の光が残る）・フェザーストーム（羽根の渦）は専用のテンポ。判定（命中・ダメージ・効果）は act() が先に確定していて変えない。
- **UI の修正**：フィナの2択「はい／いいえ」（旧 はい／ちがいます）・セルジュの名前の確認「はい／いいえ」（旧 この名前で登録する／書き直す）・プロフィールの上の「ミスティックモンスターズ」の見出しを出さない・市場の購入確認「やめる」＝A-19 青・「連れて帰る」＝B-49 赤・技管理の詳細で補助技は「✨ 補助」。新しいデザイン素材が要る UI（聖獣士登録・受け取り通知・市場の上部と札とセリフ枠・街の名札と下のコマンド・会話の名札と枠・プロフィールの戻る）は作り変えず、差し替え口を docs/ui-pending.md にまとめた。
- テスト：tests/battle-1006.test.mjs（MV-01〜05）・tests/qa-e2e-1006b.test.mjs（TB-B1〜B2・ST-B1・MD-B1）

### 実機試遊・軽微 UI／遷移修正便（2026-10-07 夜。いまの正式。基準 c72e69c への差分）

- **「最初からやり直す」の印**：押したあとアプリを閉じても、次の起動は新しいゲームの開始画面のまま（localStorage の小さな印 `mr4ng`。セーブ・キー mr4v6・version 6 は変えない）。開始画面で印を P_NEWGAME に合わせ、新しいゲームを始めた／つづきからに戻ったあとの保存で消す（index.html の ngMark・title・save）。新しいゲーム＝従来どおりプロローグから
- **チラつき対策**：プロローグ → フィナの声かけ、街 → リュウの出会いは、会話が出るまで黒い幕（#opcur・z 899＝会話 900 の下。opCurtain／opCurtainOff）。共通会話に opts.onClose（閉じ始め＝フェードの前に次の画面を下に描く）＝リュウのあとの街・セドリックの開会 → 対戦表で前の画面が見えない
- **プロローグの曲**：Scene 2〜6 の曲は切り替えの 0.5秒前（PRO_AUDIO_LEAD）から約0.7秒のクロスフェード（MMPRO.play の opts.onSceneAudio／audioLeadMs）・次の曲は1つ前の Scene のあいだに先読み（link prefetch）。時刻表 CUES は変えない
- **確認の簡素化**：新しいゲームの確認＝「新しいゲームを始めますか？」はい／いいえ（縦・はいが上・会話の選択肢と同じ絵）。共通の小さな確認 ynAsk(q, sub, yes)。冒険のメニューの「大会をやめて街へ戻る」（TEST 大会の間だけ）は ynAsk。終わりの知らせから TEST の文字を外した（街の入口の「TEST 大会」は試遊用の入口のまま）。会話の2択は縦（大きな窓も）。13字以上の選択肢は文字を少し小さくして1行（.long）。市場の「購入する」・「やめる／連れて帰る」は控えめな赤／青のボタン（文言・処理は従来どおり）
- **聖獣士登録の赤い丸**（.p11seal）は機能のない飾り＝削除。新人支援の 1000G＋薬草は1つの短い帯（MMNOTE の rows。中身は同じ）。世界地図の解放は短い知らせ（印は聖獣士管理局の正式のコマンドの絵 bureau_map.png。専用の地図アイコンは素材待ち）
- **大会**：ランク選択 S〜E を1画面（--rcv-res 348px／高さ720px以下 356px）。ランク開始・ランクアップのカットは次のカットを上に重ねてから前を外す（暗くならない）。セドリックの開会の絵を少し小さく上寄せ。対戦表は画面の中央寄り・次の相手の行全体を金で控えめに（.rnx。自分の行は青のまま）・ほかの参加者どうしの新しい結果だけライフのバーが減る → ○／×（MMP8L.matchStats の残りライフ。計算は変えない・ページの中の記録だけ TB_SEEN）。対戦前比較はモンスターを大きく（重ならない）・「対戦開始」は少し上。VS はモンスターを中央から離し VS の意匠を上に。バトルはモンスターを少し下（#bt .vs の translate）・FIGHT! などの大きな帯はモンスターの下・降参の確認は TURN の札と重ならない（fight()・.bt 系 CSS は変えない＝外から重ねる）
- **冒険のメニュー**：ステータス・わざ・中断・育成放棄は同じ形・大きさ（育成放棄だけ赤）。**アイテム屋**：入口のベルナを少し小さく下へ
- テスト：tests/playtest-1007.test.mjs（PT-01〜06）・実ブラウザ tests/qa-e2e-playtest-1007.test.mjs（PT-B1〜B5）
- 見送り（新しい素材・音源が要る）：フィナの世界地図イベント専用 BGM・リュウの表情差分・市場の名札と左右の矢印の新デザイン・世界地図解放の専用アイコン。気づいた点：大会の NPC の名前に「ハヤテ」（旧種族名と同じ文字）が使われている（変えていない・要確認）

### 大会〜バトル追補便（2026-10-07 深夜・2。いまの正式。基準 d4f67d5 への差分）

- 素材：assets/tournament/cedric・venues・rank_start・rank_up（README_followup_20261007.md）
- **セドリックの大会イベント**：開会（p9TourOpen）＝正式素材 standing_UI_rankX の上部（cedric/opening_X。焼き込みのセリフ窓は切り落とし、セリフは共通会話の窓）・締め（cedricEnd）＝booth_rankX（実況席）。どちらも背景にセドリックが描かれている＝会話の立ち絵は重ねない（MMNPC.talk の opts.noFig → .mmtalk-nofig）。文面は従来どおり
- **会場**：venue_E〜S を大会1 対戦表（.tbbg）・大会2 対戦前比較（.pcbg）・大会3 VS（.tvsbg）・バトル（js/battle/arena.js の arenaSrc）に。セドリックの会話以外で会場を使う cedricBg も venue。旧 arena_E〜S・vs_background はファイルだけ残す
- **画面のデザイン基準（screens/01〜04）**：対戦表＝見出しを細い紺の札・「対戦する」を赤い丸ボタン（文字は HTML）、比較＝見出しを丸い紺の札・「対戦開始」を金の平たいボタン・「対戦表にもどる」を紺の小さな丸ボタン（文字は HTML）、VS・バトル＝会場の差し替えのみ（構成・VS の流れ・反転はモンスターの絵だけ＝従来どおり。正式勝負絵はリポジトリに無い＝待機の立ち絵のまま）。処理・2度押し・fight() は変えていない
- **ランク開始演出**：E＝正式カット A1〜A6 を順にクロスフェード（p9Frames・約4秒・タップで飛ばせる・視差を減らす設定では最後のカットだけ）。D〜S は正式カットが無い（絵に E が焼き込まれている）＝従来の演出で背景だけ A1
- **ランクアップ演出**：大会の終わりの rankUp（順は final → champion → firstReward → rankUp → cedricEnd → next のまま）で、E → D（reward.rankUp の from 0・to 1）のときだけ B1〜B7（約5.5秒）。優勝と初回報酬を約2.6秒見せてから。ほかのランクの正式カットは未着＝演出なし。自動テストは MM_QA_NO_TOURFX（harness の既定。open({ tourfx:true }) で出す）
- 変えていない：ルーレットの速さ・BGM／SE の割り当て・大会の進行・順位・報酬・状態異常・fight()

### 正式UI回収（2026-10-07 深夜。いまの正式。基準 6c44fa4 への差分）

- 前回の梱包漏れで未送付だった正式UI素材 ZIP 7つ（聖獣士登録 102415・共通会話 093729・プロフィール・街 095601・ベースキャンプ 100342・市場 095842・大会 102319）を assets/ui/recovery_1006/ に取り込み、画面の見た目だけ差し替えた（index.html の CSS「2026-10-07 正式UI回収」の1か所。文字・数値・押す範囲・処理は従来の HTML のまま。色を変える効果は使わない）。見本の文字（アルト・1000・ソラモ 500G など）が焼き込まれた部品は、その行の左右の画素から補間して空欄にし、HTML の文字を重ねる（README.md）
- 聖獣士登録：題字・「プレイヤー名」・案内文・名前欄（空欄化）・赤い印（従来の飾り .p11seal）・「登録する」・注記を正式画像に
- 共通会話（すべての NPC・フィナ・イベント）：セリフ枠＝正式画像の border-image（四隅の飾りは縮尺のまま）・名前ラベル＝空欄の札（クリーム色。名前は HTML＝フィナ以外の NPC にフィナの名前を焼き込まない）・選択肢＝空欄化した「はい」ボタンの border-image（どの文言にも使う）。セドリックの大会イベントの完成デザインは未着＝従来どおり
- プロフィール：「街にもどる」・見出し・プレイヤーの札（空欄化）・4行（所持金・最高到達ランク・育成完了・大会の勝利。見出しと単位は絵の文字・数値は HTML）。**正式の行は4つ＝仮の「獲得トロフィー 準備中」は出さない**
- 街：名札「ミストリア」を 095601 の正式画像に（旧 2026-10-05 の名札はファイルだけ残す）・下の3つ（ベースキャンプ・プロフィール・セーブ／ロード）を正式の札の絵に（押せないときは半透明）
- ベースキャンプ（とステータス画面の下のバー）：特訓・アイテム・ステータス・技管理・街へ戻るを正式の5つのボタンに。**中断は正式の絵が無い＝従来の B-34 の枠**
- 市場：上の札（左の四角＝戻る。右の紋章は飾り）・プレイヤーの札（空欄化。名前・所持金は HTML。ランクの値は絵に置き場が無いので出さない）・中央／左右の名前と価格の札（紺の版・空欄化）・左右の矢印を正式画像に。木の札（別案）は使わない
- 大会ランク選択（102319＝正式版）：見出し「公式大会」・ランクの帯 E〜S（**鎖・錠は無い**）＋状態の札（参加可能＝緑・参加不可＝赤）と「参加者 N名／対戦 N−1試合」（HTML）・「この大会に参加する」・「参加しない」を正式画像に。解除の演出は札の入れ替え（参加不可 → 参加可能）。**参加の確認ダイアログ（はい／いいえ）を追加**（p9RcvConfirm：はい＝従来の開始・いいえ＝閉じるだけ・出た直後0.35秒は無視）。自動テストは MM_QA_NO_TOURCONF（harness の既定。open({ tourconf:true }) で出す）。解放の規則・人数・大会の処理は変えていない。F ランクなし。旧 rank_ui（2026-10-05）はファイルだけ残す
- テスト：tests/ui-recovery-1007.test.mjs（UR-01〜02）、RK-03・PB-10・TN-01・N6-07・QA-G3-7・TW（プロフィール）・qa-e2e-newgame-market・qa-e2e-ui-1005 の UI-B3（参加の確認）を書き直し

### BGM 正式採用・セドリックの会場・UI 再回収（2026-10-07 夜。いまの正式。基準 d77e8b0 への差分）

- **BGM 14用途**（js/audio/audio-registry.js の LIC＝assets/audio/bgm/licensed_20261007/。ユーザー提供の MP3 13曲・WAV 1曲を OGG Vorbis q5 に変換＝ユーザー指示 2026-10-07。曲の切り出しはしない）：プロローグ＝Scene ごとに1曲（PROLOGUE_1〜6・各曲の頭から・loop なし。js/prologue/prologue.js の opts.onScene → index.html の proPlay が MMAUDIO.scene('PROLOGUE_N', { fade:'quick' })。時刻表・本文・スキップは従来どおり。旧1曲の PROLOGUE は silent のまま）／セドリックの大会前の導入＝CEDRIC（p9TourOpen の bgm("cedric")。会話のあと対戦表の曲へ）／大会1 対戦表＝TOURNAMENT_LOBBY_LOW（HIGH は fallback）＝17秒から（MMAUDIO の新しい start＝メディアフラグメント #t=17・ループも 17〜135.2秒）／大会2 対戦前比較＝TOURNAMENT_MATCHUP の短いジングル（loop なし。p9CompareScr を bgm("matchup") に）／ライバル戦 RIVAL_BATTLE／野生 WILD_BATTLE／レア RARE_WILD_BATTLE（専用曲）／公式ランク戦 TOURNAMENT_BATTLE_LOW（HIGH・SPECIAL_BATTLE は fallback）／闘技場 ARENA（**闘技場の画面は未実装＝登録だけ・どこからも鳴らさない**）。受付と大会の結果は従来の Royal Castle。置き換えた旧い戦闘曲4つ（PGS Battle Music 1／2・alkakrab Battle of the Skies／Clash of Arcane Titans）はファイルを外した（AUDIO_CREDITS.md に記録）。不採用：「いざ出発！」「冒険への誘い」。音量は gain（BGM 約 -18 LUFS・セドリックの会話の場面 約 -20 LUFS）。iOS の復帰・ミュート・音量の処理は変えていない。
- **セドリックの会話の背景**：大会前の導入・大会後の締めとも、そのランクの会場（MMARENA.arenaSrc＝assets/battle/arena/arena_E〜S。index.html の cedricBg）。会話の窓・構造は共通。対戦表・比較画面にセドリックは出さない（従来どおり）。
- **UI 再回収**：技一覧の未習得＝正式の未習得パネル（assets/ui/skill/）。研究所（図鑑・合体・配合表）・聖獣士管理局（聖獣士証・功績一覧・世界地図）のコマンドを大きく・少し上へ、牧場のコマンドを下から離す、市場の会話欄を高く（下から 34px）。PART0 のコマンド画像・市場の矢印と会話欄は前回取り込んだものと同一（sha256 一致）＝差し替えなし。冒険のメニュー（☰）と最終確認は前回の簡素化のまま。
- **やらなかったこと・残り**：ルーレットの巡航速度（引き継ぎ書どおり変えない）、闘技場の画面（未実装＝ARENA の曲は登録だけ）、VS の「正式勝負絵」（受け取った素材に無い＝待機立ち絵のまま）、牧場の「黄色い菱形」（コマンドの菱形は前回外した。施設名ラベル B-01 の絵の中の飾りは画像の一部）、旧正式 UI の ZIP 6つ（seijuushi_ui・095601・talk_ui・basecamp_UI・market_ui・大会UI 102319）は今回も無い。

### 監査後の仕様確定差分（2026-10-08。いまの正式。基準 64c6f5a への差分。深層監査の「仕様判断が必要だった項目」だけ）

- **S ランクへの正式導線**：Chapter 4 で A ランク大会に優勝したあと、結果の画面の「最終公式大会へ挑戦する」（参加の確認 はい／いいえ）→ 同じ育成中の個体のまま S ランク大会（8体・7試合。人数・順位・報酬は通常の大会と同じ）。**Chapter 5 は作らない**＝同じ Chapter 4 のゴールで2つ目の大会（js/phase8/raising.js の FINAL_TOUR・canStartFinalTournament・startFinalTournament。index.html の p9FinalTour・p9FinalSkip（挑戦せずに終えるときは確認））。記録：m.raise.tour を S の大会に置き換え（tour.final・tour.prev＝A の結果。v6 の任意項目）、Chapter の記録（log）は tour＝A・finalTour＝S。S の大会のあとは従来どおり Chapter 終了（A 以上クリア → 最終ルートの前のベースキャンプ → 最終ルート未登録なら育成完了）。旧：Ch1 D → Ch2 C → Ch3 B → Ch4 A で終わり、通常プレイで S に届かなかった
- **LEGEND（三伝説への挑戦）の解禁**：S ランク大会で**優勝**したあと（S に到達・参加しただけでは解禁しない）→ イベントを1つ挟んで → 解禁。状態はセーブ全体の `S.npcFlags.legend`（v6 の任意項目：1＝S 優勝済み・イベント待ち、2＝解禁済み。MMP8.legendStage／completeLegendUnlock／legendUnlocked）。イベント＝大会の終わりの段階 legendUnlock（セドリックの締めのあと）の**最小限のシステム通知「三伝説への挑戦が解禁された！」（本格的なイベント演出・台詞は後工程）**。途中で閉じて残っていたらベースキャンプで1回。旧「Chapter 5 は準備中」の表示と `S.npcFlags.chapter5` は廃止（旧フラグは「イベント待ち」として読み替え）。三伝説との本戦・LEGEND 昇格・アストラッド頂上戦・厄災最終戦・エンディングは未実装（作っていない）
- **疲れの Chapter 間の引き継ぎ**：大会のあと・Chapter の終わりで0にしない。次の Chapter の開始で max(0, 疲れ−50)（実装は従来どおり＝変更なし。js/chapter/engine.js の carry 50）
- **能力マスの成長量**：全 Chapter 共通の1つの表 **A+25・B+21・C+18・D+14・E+11**（js/phase10/monsters.js の GROWTH_GAIN。Chapter 1 だけの表 rules.growthGain は廃止）。基準＝「適性 A の能力が、1体の育成を最後まで（Chapter 1〜4＋S の最終公式大会）終えたとき、開始 100 前後なら 250 前後」。旧表の比率（7:6:5:4:3）のまま約3.5倍。シミュレーション（各3000回・全大会に優勝・最後まで育てた約2100回）：育成全体の伸び＝A 平均 +151（p10 +88〜p90 +217）・B +139・C +117・D +97・E +81（能力マス以外＝イベント・大会の優勝ボーナスで各 約+30、1つの能力の能力マスに止まるのは育成全体で約5回）。道具：scratchpad の full.mjs 相当を tests/spec-fix-1008.test.mjs の SF-04（300回）で監視
- **同じ強さのバフ／デバフの掛け直し**：同じ能力・同じ向き・同じ強さはスタックせず、残りターンを正式値へ更新（例：小・2ターンを次のラウンドに掛け直すと残り2へ）。強い方で上書き・弱いのは上書きしない・上げと下げは別、は従来どおり。battle-bridge（Phase 6）は変えず、js/battle/rules.js の refreshSameEffects（resolveWith の後処理）
- **大会での降参**：降参した試合は順位の「残りライフ割合」を 0% で記録（勝敗は敗北・与えたダメージと命中回数は実際の値）。js/battle/rules.js の battleStats（fight() の ban('降参') を見て記録。1回も行動していない降参でも 0%）
- **素早さと先攻**：素早さ（1〜10・10 が最速）が高い方が必ず先攻、同じ値だけ 50%／50%。野生・レア・ライバル・大会のすべてのバトル。Phase 6（battle-bridge の確率の表・index.html の素早さ分離処理 p10LegacyBattle）は変えず、js/battle/rules.js の MMBattle.createBattleSession の包み（withSpeed：プレイヤーは S.m の speed、相手は種族の正式値（レグナス 8）を入れ、差があれば速い側が必ず先攻になる乱数を渡す）
- **E・D の初期解放とランクアップ**：E・D は最初から解放＝E の優勝で昇格は無い。昇格＝D優勝→C解放・C→B・B→A・A→S（reward.rankUp＝{ from：優勝前に選べた上限, to：新しい上限 }。旧：個体の旧フィールド m.rk で判定＝E の優勝で何も起きず、D の初回優勝で E→D の B1〜B7 が流れていた・合体の子は昇格が出なかった）。**E→D 用の B1〜B7 は流さない・D→C などに流用しない**（index.html の RANK_UP_ART＝{}。D→C 以降の正式カットは未着＝解放だけ・演出なし）。素材ファイルは残す
- テスト：tests/spec-fix-1008.test.mjs（SF-01〜08）・実ブラウザ tests/qa-e2e-spec-1008.test.mjs（SF-B1＝A 優勝 → 最終公式大会を実際の fight() で7試合 → S 優勝 → 解禁・保存、SF-B2＝降参で残りライフ0%）。CH-ENGINE-01・CH1-08／09・S4-2・T1-7・QA-RL5／6／12・BR-07・TN-05・TF-02 を新しい仕様に書き直し

### 深層監査の修正・第1便（2026-10-08。いまの正式。基準 1956bb1 への差分）

- **H-05 名前の無害化**：原因＝fight()（Phase 6）がバトルの HUD に名前をそのまま innerHTML で入れる（`<b>${pl[s].name}</b>`）。市場で「<!--」などと名付けるとバトルの DOM がコメントに飲まれて #go・#rl が作られずバトル不能（その個体は大会で詰む）、セーブコードの名前「"><img src=x onerror=…>」はバトル開始でスクリプトが動いていた。→ fight() は変えず、名前の全入口で正規化（§2 の技術上のルール）。古いセーブ・スロット・セーブコードは読み込みで正規化して保存（正常な名前は変えない）
- **H-06 技管理の技名**：原因＝技名の span.rn（Phase 6 のルーレットと同じ class）に牧場の器の汎用ルール `.rn{min-height:100dvh;background:…}` が当たっていた。→ 牧場の規則を `#app>.rn` に限定（Phase 6 の .rw .rn は不変）。あわせて ▲▼ の下に隠れていたクリ率（.drl .rw .rst の右の余白 26→52px）と、狭い画面で2文字に切れていた技名（2行まで）も直した
- **M-03 決着時の試合の内容**：原因＝試合の内容（残りライフ%・与えたダメージ・命中回数）を「もどる」の after() でだけ入れていたため、決着（WIN!／LOSE）の画面で閉じると仮のシード値で順位が計算された。→ fight() が決着で呼ぶ adv()（Phase 6 の外）で大会の試合なら MMRULES.battleStats() を m.raise.battle.stats に入れる＝直後の fight() の save() で保存（after() でも従来どおり上書き）
- **M-02 結果の画面の再読み込み**：原因＝演出済みの判定がページの中の WeakSet だけだった。→ MMP8.runTourEnd(result, { persist }) が始めた段階を result.endSeen（v6 の任意項目）に入れて保存。再読み込みでは始めた段階を流し直さず、まだの段階だけ続きから（賞金の帯・ランクアップ・セドリックの締めは二度出ない。データは従来どおり決着の1回）。MMP8.tourEndSeen
- **M-01 大会の終わりの正式の順**：全試合の終了 → 最終順位（final）→ 優勝ならモンスターの勝利演出（champion＝正式画像が跳ねて光る・CSS だけ。専用の素材・音は未着）→ 初回報酬（firstReward＝帯を見せる）→ ランクアップ／解放（rankUp）→ セドリックの締め（cedricEnd）→ 次の画面（next）。結果の画面は段階ごとに見せる（.p9tour.p9end の e-段階名。「優勝！」・報酬欄は該当の段階から）。「次の画面」のボタン（Chapter を終える・最終公式大会）は next まで押せない（L-02）。結果の画面の静的なセドリックの一言（p9Ced）は、締めの会話を出さないとき（自動テストの MM_QA_NO_NPC）だけ。締めの文のランクアップの有無は結果のデータから。試合単位の報酬・ランクアップは従来どおり出さない。間は本番だけ（MM_QA_NO_TOURFX・視差を減らす設定では待たない）
- **TEST_MODE のリリース手順（L-37）**：index.html の `const TEST_MODE=true;` を false にするだけ（入口 .ttest と testTour() の処理の2か所だけが参照）。テスト N6-03 は値を固定しない（AF-06・実ブラウザ AF-B5＝false で入口が出ず testTour() は何もしない）。**正式リリースまでは true のまま（試遊用）**
- **M-05（合体の子の昇格）**：1956bb1 の判定（優勝前後の maxChallengeRank）で解消済みを確認（AF-07・実ブラウザ AF-B6＝実物の fuse() の子が D の初回優勝で C 解放）。追加修正なし
- **プロローグの尺の延長（2026-10-08 追加指示。旧 38.4秒の固定より優先）**：6枚の構成・本文・画像は同じまま、各 Scene をあと1〜3秒長くした（js/prologue/prologue.js の CUES の1か所）。
  - 旧：Scene 開始 0／6.3／12.6／18.9／25.6／32.0秒・本文の終わり 38.4・終わり 39.4秒（各 6.3〜6.7秒）
  - 新：Scene 開始 0／7.8／16.1／24.4／34.1／42.5秒・本文の終わり 50.9・終わり 51.9秒（各 7.8（+1.5）・8.3（+2.0）・8.3（+2.0）・9.7（+3.0。文が最も長い三人のレジェンド）・8.4（+2.0）・8.4（+2.0）秒）。本文の終わりと背景が消えるまでの差（1秒）は従来どおり
  - Scene の中の文字の速さ・消える時間は同じ（延びた分は読む時間と余韻）。Scene ごとの曲（PROLOGUE_1〜6）は時刻表から決まる（切り替えの 0.5秒前からクロスフェード＝新しい時刻に自動で追従）。曲はどれも 33秒以上＝途中で切れない
  - スキップのつながり（監査 L-22）：js/audio/audio-manager.js の playFile が、フェードアウト中の1本（Scene 1・3・5 の曲）を次の曲に奪っていた＝スキップした直後に曲がフェードせずに切れていた → フェード中でない1本を使う（両方フェード中なら先にフェードを始めたほう）。テスト AUDIO-31
  - テスト：PB-02（各 Scene が +1〜3秒）・PT-05・PRO-B4・実ブラウザ AF-B7（背景・曲の切り替えの実測・最後まで約52秒）・PRO-B1（CUES どおり）
- テスト：tests/audit-fix-1008.test.mjs（AF-01〜07）・実ブラウザ tests/qa-e2e-audit-1008.test.mjs（AF-B1〜B6）

### 正式素材の統合・次便（2026-10-08。いまの正式。基準 ec22fe2 への差分）

- **セドリックの大会前後**：正式素材（standing_UI・booth の12枚）は 10-07 の追補便で取り込み済み（今回の ZIP と sha256 が同じ）で、ランク別に使っていた（旧いアップ画像・顔は参照していない）。実機で「アップだけ」に見えた原因＝大会前の導入の絵（standing_UI の上部＝opening_X）を画面の高さに合わせて広げていたこと。→ **ユーザー指示（2026-10-08）：大会前の導入も締めも実況席 booth_X（E〜S。ユーザーが同じ6枚を送り直して指定）**。画面の幅に合わせて上に置く（cover で拡大しない）・絵の下の余りは会話窓の後ろで濃紺へ溶かす（画像は加工しない）。standing_UI（opening_X）はファイルだけ残す（焼き込みのセリフ窓はランクごとに文が違い、A の絵は「公式ランクE大会」と誤っている）
- **街の BGM**＝「冒険への誘い」（assets/audio/bgm/licensed_20261008/town_bouken_e_no_izanai.ogg。MP3 を OGG Vorbis q5 に変換しただけ・182.7秒のうち 179秒からは無音＝registry の TOWN に loopEnd 178.6・頭へ 1.2秒のクロスフェード・gain 0.7）。旧 HydroGene「Lively City」は外した。作者・出典は ZIP に無い＝AUDIO_CREDITS.md で要確認。市場・牧場・研究所の曲は変えていない
- **リュウの表情5種**（assets/npc/ryu/expr/＝normal・surprise・confident・serious・soft_smile。573×760 の可逆 WebP）：MMNPC の ryu の closeup。stand を持たない（stand があると全身を切って見せるため）。全身（fullbody・遭遇の画面）は従来の正式の全身。街の初対面の会話（OPEN_TALK.ryu）＝驚き → 自信 → 柔らかい笑み → 真剣 → 自信（台詞は変えていない）
- **市場の木製UI**（assets/ui/market_wood/＝中央の札・左右の札・左右のナビ）：木の札は平たいので名前と価格を1行に、「タップでくわしく」は中央の札のすぐ下（札を 15px 上げた）。カルーセル（中央100%・左右70%・ループ・スワイプ・矢印・ドット）と処理は変えていない。旧 recovery_1006/market の札・矢印はファイルだけ残す
- **VS の専用勝負絵**（assets/tournament/vs_monsters/＝5体・512×512 の透過 WebP・5体とも右向き）：大会3（tourVsShow）の tbVs。向きは待機立ち絵と同じ規則（自分＝右向き・相手＝モンスターの絵だけ反転。背景・文字・UI は反転しない）。大会2（比較）・バトル画面は従来の待機立ち絵。バトル側の導入（intro）は従来どおり出さない
- **ランク昇格 Final**（assets/tournament/rankup_final/＝段階ごとに letter・frame・fx・plaque）：RANK_UP_ART＝{1:E_to_D, 2:D_to_C, 3:C_to_B, 4:B_to_A, 5:A_to_S}（昇格で新しく選べるランク → 段階）・p9RankUpFinal（光 → 枠 → 文字 → 解放の札「ランクX大会 解放！」＝HTML。約3.4秒・タップで飛ばせる・視差を減らす設定では動かさない）。旧 B1〜B7 は使わない。昇格の規則・大会の終わりの順・報酬は変えていない（E・D は最初から解放＝**E_to_D は定義だけ**で今の規則では流れない）
- **モンスターの勝利演出**（assets/tournament/victory/＝5体。最初の ZIP の5枚は RGB で市松模様が焼き込まれていた＝ユーザーが透過の切り抜き missmon_victory_png を添付し直した）：大会の終わりの champion の段階（優勝のとき）に index.html の p9VictoryShow＝そのランクの会場（venue_X）の上に、育てたモンスターの勝利画像（VICTORY_IMG＝m.sp で出し分け）を短いフェード・ごく軽い拡大・短い光で約2.2秒（タップで先へ・視差を減らす設定では動かさない・自動テスト MM_QA_NO_TOURFX では出さない）。旧 CSS の仮演出（結果の画面の .p9wmon が跳ねる）は残るが、その上に正式の演出が重なる。終わりの順（最終順位 → 勝利演出 → 初回報酬 → ランクアップ → セドリックの締め → 次の画面）は変えていない
- **世界地図の解放アイコン**（assets/ui/worldmap_icon/worldmap_unlock.png。添付し直した透過 PNG の余白を切り詰めて 256px）：世界地図の解放の知らせ（MMNOTE）。旧：管理局のコマンドの絵で代用
- **お金（ゴールド）のアイコン**（assets/ui/gold/coin.png＝ユーザー提供の透過 PNG を 128px に）：index.html の GCOIN・P10_COIN・field-view の COIN_SVG。市場の価格・Chapter の HUD・プロフィール・牧場・ファームの各画面・出発準備・ステータス・大会の初回賞金・セーブスロット・通知の帯の「G」をこの1つに統一。札の絵に旧い硬貨が描かれている所（A-05＝ベースキャンプ・アイテム屋の所持金、市場のプレイヤーの札、B-07＝オートセーブ）は硬貨の上に重ねる（札は加工しない）。文章の中の「🪙」の絵文字はそのまま
- テスト：tests/assets-1008.test.mjs（AS8-01〜05・08）・AUDIO-34、実ブラウザ tests/qa-e2e-assets-1008.test.mjs（AS8-B1＝E と B のセドリック（booth）・B2＝VS・B3＝RankUp Final・B4＝リュウ・B5＝市場・B6＝街の BGM・B7＝D 優勝の終わりの順と勝利演出・B8＝世界地図のアイコン）。AS8-06〜07＝勝利演出・地図アイコン

### 深層監査の修正・第2便（2026-10-08。いまの正式。基準 1bfd8b2 への差分）

- **M-06・M-07 バトルの相手**（index.html の battleDress・battleDressDom。fight() は変えない＝MMRP.arm と同じ「BPL が新しくなって最初の乱数」で相手を整える）：相手の色相回転（ソラモの相手をランク×60°）と A／S の第2種族の重ね絵（s2）をやめた＝正式画像の色のまま（ライバルと同じ）。相手の名前＝大会は対戦表の参加者名（旧「ランクXの対戦相手」）、野生・レアは種族名。練習試合の帯・上の札は「野生のモンスター」「レアモンスター」「ライバル戦」（PRACTICE_LABEL【暫定の文面】。旧「ランクX大会」）。**会場の絵は従来どおり練習試合のランクの venue**（#bt の data-mmrank → js/battle/arena.js の rankOf。野生専用の背景は素材が無い）
- **M-08 帯の2行折れ**：index.html の ban()（fight() の外）が、5文字以上の日本語の帯（「ランクE大会」など）を1行に収まる大きさにする（white-space:nowrap・文字の大きさ＝画面の幅 ÷ 文字数・最大 4.8rem）。「FIGHT!」などの英字はそのまま
- **M-09 メニュー**：見出し「メニュー」と ✕ を枠の中の通常の流れへ（✕ は見える丸ボタン）。ベースキャンプのメニュー（bcMenu）も冒険中のメニュー（p9Menu）と同じ部品（.p8menu の青いボタン・育成放棄だけ赤）。名前は「技管理」にそろえた（冒険中の旧「わざ」）。操作欄（deck の画像）の「技設定」は正式素材の絵のまま
- **M-10 8体の対戦表**：名前の列を広げ（2.7fr・表は最大 420px）、長い名前は小さめの文字で2行まで（8文字が省略されない。390×844 で列 約58px）
- **M-11 ジングル**：対戦前比較のジングル（loop なし）が鳴り終わったあと、タップ（MMAUDIO.unlock）で頭から鳴らし直さない（wake と同じ除外）
- **M-12 プロローグ Scene 5**：曲の頭の無音 0.88秒を飛ばして 0.38秒から（registry の PROLOGUE_5 の start。先に鳴らす 0.5秒と合わせて切り替えの瞬間に音が出る）。iOS の先読み・PROLOGUE_1 の先読みは実機確認待ち
- **M-13 蒼銀の反撃と固有スキルの順**：レグナスの上乗せダメージを js/battle/rules.js の resolveWith の中（固有スキルの判定の前）で入れる（MMRP.counter）。上乗せで初めて20%以下になったソラモはその行動の直後に構え、ジオルの耐えも上乗せのあとに判定。外側の包み（ライバル戦の wrapBattle）は同じ結果に二度足さない
- **M-15 壊れたセーブ**：読み込みの検査に大会の途中状態（validTour：ランク・status・参加者・日程・round）を足した＝読めなければ大会の前（受付）へ。開始画面からの再開（startGame）で例外が出ても暗転（.tveil）を必ず外し、街（セーブ画面へ行ける）へ出す（resumeFailed）。種族・6能力の型の検査は値を推測で決められないので足していない（L-17）
- **L-13**：開始画面の「つづきからにもどる」で印 mr4ng を消す（保存が起きなくても次の起動は「つづきから」）
- **M-17 本番設定の通し**：qa-e2e-prod-1008 の PR-B1（harness が既定で止めている会話・参加の確認・ランク開始・VS・バトルの共通演出・到着を有効にして D の大会を5試合＝相手の名前・色・帯・会場・正式ルーレットの止まった板＝発動した技・終わりの正式の順・C の解放）
- テスト：AUDIO-32（M-11）・AUDIO-33（M-12）・BR-09（M-13）・実ブラウザ PR-B1〜B5
- **2026-10-09 試遊（曲の鳴り始め）**：プロローグの次の曲は切り替えの 1.0秒前から（PRO_AUDIO_LEAD 500→1000）・PROLOGUE_2 は 0.6秒から（頭の小さな盛り上がりを詰める）・PROLOGUE_6 は 0.3秒から。セドリックの大会前の曲（CEDRIC）は頭の無音 1.3秒を飛ばし（start／loopStart 1.3）、ランク開始の演出と同時に鳴らす（p9TourOpen の先頭）。対戦表（TOURNAMENT_LOBBY_LOW）は 17〜31秒の落ち着いた部分から（17秒のまま＝ユーザー確認）。開始位置（registry の start）はメディアフラグメント #t= だけだった＝iPhone の Safari などで無視されると頭から鳴る → audio-manager の playFile が loadedmetadata で手前にいれば開始位置へ合わせる（1回）。テスト AUDIO-35・AUDIO-36

### Chapter 1 Pattern A 正式ボード（2026-10-08。いまの正式。基準 0015830 への差分）

- **背景**：完成背景 14枚（ZIP Mismon_Chapter1A_Claude_Package_20261008。assets/fields/ch1a/formal_1008/）。01〜13＝道中、14＝大会会場到着前の **共通 Scene**（Chapter 1〜4 で同じ構図・時間帯や天気の差分の予定。今回は Chapter 1 の昼だけ）。00＝美術マスター（ゲームに出さない）。1回の旅で 01→14 を全部・順に通る（旧：12枚。森／大橋で背景が分かれていた）。
- **ゲームの中身は変えていない**：84マス・ノードID（p1_〜p14_・p3l_／p3r_／p3m_・p11l_／p11r_／p11m_）・マスの種類と並び・つながり・分岐3か所・64歩・45ターン・疲れ・能力・宝箱・イベント・バトル・大会への入り方・セーブ（tests/board-1008.test.mjs の BD-01＝グラフの sha256）。途中のセーブは同じノードから続く。
- **背景への置き方（js/chapter/configs/ch1a.js の PIECES）**：01 p1_0〜3（スタート）／02 p1_4〜6／03 p2_／04 分岐 A（p3_0 → 左右 p3l_・p3r_ → 合流 p3m_0）／05 p4_／06 p5_（ライバル p5_0・分かれ道 C p5_3）／07 森 p6_（左）・大橋 p8_（右）／08 森 p7_・大橋 p9_／09 p10_0〜2（合流 p10_0）／10 p10_3〜5／11 分岐 B（p11_0 → p11l_・p11r_ → p11m_0）／12 p12_／13 p13_／14 p14_（ゴール p14_3＝広場の中央・会場の石段の前）。森／大橋は 07・08 の同じ道の左右（A・B と同じ置き方。分かれ道 C の左右の門・名前・説明は従来どおり）。1本の道が2つの背景にまたがる所（p1_・p10_）は区間（engine の path.key・idOffset）＝ノードID は同じ。
- **道路中央ライン（SCENES[].road）**：背景ごとに [y, x, 半幅]。画像の道の両端を画素で測って中央を取り、なめらかにした値（09 の階段は目視）。マス＝中央ラインの上（左右の道は ± 0.36 × 半幅）、止まる位置＝マスの中心、歩く道筋も中央ライン（左右の道は同じ割合）。個別の left／top は書かない。
- **背景ごとの区間**：rows（列の数）・near 0.86・step（列の間隔：3〜4列 0.08・5列 0.075・6列 0.07・7列 0.065・14 は 0.07）→ playable＝[0.86, 奥の列]、enter＝0.92（前の背景から入ってくる出発点）、handoff＝奥の列 − 0.06（次の背景へ渡す地点）、exit＝カメラが見てよい奥の端（0＝画像の上端まで）。画像の奥まで使い切らない。
- **マスの見た目の大きさ＝一定**（tileUI.fixedSize＝画面の幅 × 0.18 を 58〜78px。390px で 70px）：マスの箱をこの大きさにし、カメラの拡大（奥へ進むと寄る・分岐で引く）を CSS の --inv（camApply が毎フレーム 1/S）で打ち消す（.chf-tile.fx の transform だけ＝レイアウトの再計算なし）。分岐の道・橋の上・背景の切り替えの前後も同じ。
- **カメラ**：基本の倍率を近く 1.45／遠く 2.15 → 1.15／1.55（道の先と景色が見える）。そのほか（anchorY 0.72・先読み・遅れて追う・止まって落ち着く）は従来どおり。会場が近い 12・13・14 は anchorY 0.75〜0.78（会場が見える）。見せ場の視線誘導（cue。04 清流・05 滝・07 アーチ・09 大階段・12 会場・14 広場）＝次の背景へ入ってくる間だけ少しそちらを見て、止まると戻る（操作を止めない）。分かれ道 A・B は少し引いてモンスターを選択シートより上に、左右の道の入口と先の数マスを同時に見せる（シートに隠れる高さだけ画像の下端より下まで動ける＝camLoose）。C は従来の左右の門。
- **背景の切り替え**：最後のマス → 道路中央ラインに沿って handoff まで歩く（同時に次の背景の画像をデコード・最大 0.45秒）→ 次の背景を下に作る → 前の背景を 0.46秒で透明に → enter から入口のマスへ歩いて入る。モンスターは前の背景と同じ画面の位置・大きさから始めて、歩く間に本来の位置・大きさへ戻す（matchCut。individual transform の translate・scale だけ）。切り替えは見せ方だけ（ターン・効果・セーブは従来の MMP8 のまま。二重に起きない）。
- **Scene14 → 大会**：ゴール（p14_3）→ 同じ 14 の広場の全景へ引いて「公式大会会場・正門前」（config.arrival.bg＝ch1a_scene_14。旧 ch1_bg_15_event はファイルだけ残す）→ 会場の中のロビー → フィナの会話 → 大会受付（従来どおり）。
- **開発用の表示**：URL に ?chdebug=1（または window.MM_CHDEBUG）のときだけ＝道路中央ライン・道の端・enter／playable／handoff／exit の線・マスの中心と ID・番号・今の背景の札・カメラの注視点。本番の URL では出ない。
- **story の背景番号**（config.story の when.field）は同じ場所を指すように読み替えた（分かれ道の手前 5→6・森 6→7・大橋 9→8・合流 10→9・ライバルの手前 4→5）。本文は変えていない。
- 背景の表示名（旅立ちの石畳…大会会場前の広場）は【暫定】。

### Chapter 1 Pattern A 道路先行の試作（2026-10-09。**試作・正式ではない**。基準 ad77ece への差分）

- **URL に `?chapterBoard=roadfirst` を付けたときだけ**動く（通常の URL では何も出ない＝今の Chapter 1（2026-10-08 の正式ボード）・セーブ・大会・バトルはそのまま。テスト RF-B1）。受け取ったキット MysticMonsters_Ch1A_Claude_Prototype_Kit_20261009.zip を assets/proto/ch1a_roadfirst_1009/ に置いた（使い方・ルール・仮の設定・まだ無いものは同じフォルダの PROTOTYPE.md）
- データ：09_original_source_graph.json（論理の正本＝299ノード／370有向接続／42区間・削らない・作り直さない）＋ 02_walkable_geometry.json の centerline_xy（暫定の描画座標＝美術と合わせたものではない）→ tools/roadfirst/build_data.py → js/proto/roadfirst-data.js（MMRF_DATA）。進行 js/proto/roadfirst-core.js（MMRF_CORE。画面なしで Node でも動く）・画面 js/proto/roadfirst-view.js（MMRF）。背景は 01_road_geometry.svg（ブロックアウト）
- ルール：サイコロ 1〜6・40ターン・J0／H は自由・Q はイベントのサイコロ（奇数＝左／偶数＝右・Q→R の直進なし）・CHALLENGE は 5／6 成功・報酬の枝6つ＋D_RAND は行き止まり（自動で戻らない＝帰りもサイコロ・同じ報酬は1回）・門は通り抜け。**【仮】**：D_RAND が開く確率 50%・途中で止まるか（既定 stop＝Q・RIVAL・CHALLENGE・行き止まりで止まり残りの目は捨てる＝キットの draft_rules／比較用 &rfStop=pass）
- 状態はゲームのセーブ（mr4v6）と別の鍵 mmrf_proto_v1（壊れていれば新しく始める）。GOAL の「大会の入口へ」＝既存の TEST 大会の入口（testTour＝セーブを控えて Chapter 1 の大会受付へ・終われば戻す）
- まだ無いもの：能力マス・イベントマス・疲れ・成長・所持金（データに無い）・RIVAL のバトル（出来事の文だけ）・報酬の中身・ダブルダイス・正式の背景
- 40ターンのシミュレーション（`node tools/roadfirst/sim.mjs 5000`・各5000回・stop）：寄り道なし（左右ランダム）GOAL 97.1%・平均 32.9／H＝安全な道 100%・29.3／H＝特殊挑戦 95.1%・34.6／H＝石像 96.2%・35.0。報酬を1つ往復：D_LC 85.2%・D_RC 82.7%・D_LA 35.5%・D_R5 45.7%・D_RS 25.9%・D_LLA 71.6%（挑戦の成功が 1/3＝着けたのは 32.5%）。2つ以上の往復は GOAL 0〜14%（40ターンでは足りない）。比較 pass＝寄り道なし 98.8%
- テスト：tests/roadfirst-1009.test.mjs（RF-01＝データが原本と同じ・全ノードの座標／RF-02＝START→GOAL・必通／RF-03＝Q・CHALLENGE／RF-04＝48 の組み合わせを実際の進行で／RF-05＝報酬の往復・1回だけ・D_RAND／RF-06＝大きな出目で飛ばせない／RF-07＝時間切れ・別の鍵）・実ブラウザ tests/qa-e2e-roadfirst-1009.test.mjs（RF-B1〜B3）。キットの検証 08_validate_roadfirst.py の再実行は 17/17・48/48（shapely・networkx が要る＝ふだんのテストには入れていない）
- **育成の中身（2026-10-09・第2段。試作・正式ではない）**：js/proto/roadfirst-play.js（MMRF_PLAY。index.html で roadfirst-core と roadfirst-view の間に読み込む＝?chapterBoard=roadfirst のときだけ画面に出る）。止まったマスだけに中身（能力6種・イベント・休憩・野生・宝箱・6つの固定報酬＋隠れ家）・疲れ（0〜100）・休む（−30・1ターン）・試作G。配置とイベントの中身は seed から開始時に1回・保存（再読み込みで引き直さない）。能力マスはそのノードで1回だけ・上昇量は正式マスター MMP10M.GROWTH_GAIN × growthOf・999 上限・レベルなし。モンスターは S.m の読み取り専用の写し（いなければデモ個体）。**正式の所持金・持ち物・セーブ（mr4v6）・Chapter 1〜4・大会・バトル・fight() には触れない**。効果は先に確定して保存 → 見た目 → 結果（OK を押すまで振れない・再読み込みで二重にならない）。保存は同じ鍵 mmrf_proto_v1 の v 2（v 1 は移行・読めない保存は消さずに案内）。ダブルダイスは &rfItemLab=1 のときだけ。**RIVAL・野生の実戦は未実装**（試作の画面から正式セーブを変えずに fight() へ行って戻る安全な入口が無い）。**【試作用・要承認】の数値はすべて TUNING の1か所**（マスの割合・疲れの表 +2〜+7・レア 10%／野生マス・報酬の中身・試作G・ダブルダイス）＝正式仕様ではない。D_RAND 50%・止まって残りの目を捨てるルールも【試作用】のまま（&rfStop=pass の比較も残す）。表と 5000回のシミュレーション（`node tools/roadfirst/sim-play.mjs 5000 --md`：寄り道なし GOAL 92.8%・H 安全 100%・長い報酬の枝は報酬＋GOAL 9〜33%）は assets/proto/ch1a_roadfirst_1009/PROTOTYPE.md。テスト：tests/roadfirst-play-1009.test.mjs（PL-01〜10）・実ブラウザ tests/qa-e2e-roadfirst-play-1009.test.mjs（RP-B1〜B6）
- 正式版に統合する前の課題（第2段の時点）：疲れの表・マスの割合・報酬の中身・D_RAND の率・停止ルールの承認／40ターンで寄り道と GOAL が両立しにくい（道を削らない直し方の判断）／RIVAL・野生の実戦の入口（正式セーブを守る作り）／育成の結果を正式セーブへ反映するか／正式の背景とマスの絵／フィナの会話窓

### 今回差分の最終統合（2026-10-07。いまの正式。基準 829c772 への差分）

- **新プロローグ6枚**（js/prologue/prologue.js の SLIDES・assets/prologue/v2/）：1 平和「はるか昔、人と聖獣は／この大陸で共に暮らしていた。」→ 2 厄災 → 3 文化 → 4 三人のレジェンド → 5 大会 → 6 旅立ち「今、レジェンドランクを目指すあなたもまた、／聖獣都市ミストリアへ旅立つ。」。中央に1文字ずつ・テキスト枠なし・BGM なし（従来どおり）。時刻表 CUES＝〔2026-10-08 に延長＝Scene 0／7.8／16.1／24.4／34.1／42.5秒・本文の終わり 50.9・終わり 51.9秒。§3「深層監査の修正・第1便」。以下は旧値〕Scene 0／6.3／12.6／18.9／25.6／32.0秒・本文の終わり 38.4・終わり 39.4秒（固定尺・タップで進まない・スキップは2度押し）。**レジェンド＝アストラッド＋ゼルヴァーン（青・剣）・レオナ＋グリフェル（緑・レイピア）・ラグナス＋ドラグノル（赤・ランス）**。旧名「バルド」は使わない。ラグナス（人）とレグナス（リュウの相棒のモンスター）は別。
- **LEGEND ランク（差し込み口だけ）**：js/phase8/raising.js の LEGEND（{ id:'LEGEND', after:'S', holders＝三人 }）・legendChallengeOpen(m)（その個体の S 優勝）。**解禁＝S ランク大会の優勝 → イベント → 解禁（2026-10-08 正式。§3「監査後の仕様確定差分」）**。E〜S の通常大会（ランク選択・人数・対戦表）に7つ目の枠は足さない。挑戦の画面・相手の能力・報酬は未決（作っていない）。
- **大会UI**：大会1 対戦表＝参加者の顔アイコン（assets/tournament/faces/。tbIcon）。大会2 対戦前比較（p9CompareScr を作り直し・.tb3）＝大会名・第N試合・左右に待機の立ち絵（相手はこちら向き＝tbIdle）と名前・固有スキルの説明（tbSkillDesc）・6能力の数値と棒（左右で比べる）・対戦開始（2度押し）／対戦表にもどる。セドリックは出さない。大会3 VS＝「マッチアップ」の札＋待機の立ち絵。バトルの相手の種族は p8TourFight が battleFoeOnce(対戦相手の sp) で渡す（強さはランクの値のまま）。
- **バトル画面**（js/battle/arena.js）：§2 の表。
- **試遊修正**：ベースキャンプの次の Chapter の札を上部へ（.bcch.bctop）・会話中は「出発する」を隠す・研究所／牧場／聖獣士管理局のコマンドを正式画像に（data-cmd）・市場の矢印と会話欄・遭遇のバトルの案内の見出し（種類＋遭遇の文）・Chapter 開始の演出の Chapter 名はリボンを使わない・冒険のメニューと最終確認の簡素化・技一覧の未習得は「？？？」。
- **リュウの初対面**（index.html の opRyu・OPEN_TALK.ryu）：聖獣士登録 → 新人支援 → 出身地と世界地図のあと、街でリュウ（フィナと同じ町の出身）が話しかける →「先に S ランクをクリアして、レジェンドに挑む」「先に『はじまりの草原』へ行ってる」→ 市場の案内。記録 S.npcFlags.ryuMet（0＝これから・1＝見た。新しいゲームの序盤だけ。古いセーブには出さない）。リュウは MMNPC に登録（立ち絵＝正式の全身）。Chapter 1 のライバル戦の会話（tut_rival・ch1_rival_before）はその続き。旧「同じように旅してるリュウ」の一言は削除。
- **セドリックの大会前導入・大会後の締め**（index.html の CEDRIC_EV・p9TourOpen・cedricEnd の差し込み）：ランク選択 → ランクのエンブレム → セドリック（「さあ、いよいよ公式ランクX大会の開幕です！」→ 初めての参加なら歓迎（S.npcFlags.cedricWelcome）→ 参加者の一言 →「それでは、参加者をご紹介しましょう！」）→ 対戦表。締め＝MMP8.runTourEnd の cedricEnd（最終順位 → 優勝 → 初回報酬 → ランクアップのあと）＝優勝＋ランクアップ／再優勝／優勝できなかった、で文を変える。その後に初めての大会の結果の短いイベント（npcMoment）。E の文面は指定どおり・D〜S の参加者の一言は【暫定】。自動テストは MM_QA_NO_NPC で出さない。
- **冒険リアクションイベント100件**：§2 の js/chapter/reactions.js。原案の「宝箱率補助」「イベント補助」「分岐補助」「ライフ気分」は対応する仕組みが無いので演出だけ（新しい仕組みは作っていない）。レグナスの20件はプレイヤーが育てられないので今は出ない。
- テスト：tests/diff-1007.test.mjs（RX-01〜02・DF-01〜03）
- **ADDENDUM／ADDENDUM2（同日・追加差分。上の記述より優先）**：
  - 大会1 対戦表＝最終モック（index.html の tbBoardGrid・.tb1g.tbv2）：題字は「公式ランクX大会」だけ・左に参加者・右に対戦マトリクス（行と列は同じ順）・勝ち＝赤○（.tbo）・負け＝青×（.tbx）・未対戦は空欄・自分自身は斜線（.c-self）・プレイヤーの行は青く光る（.rme）・次の相手との交点が金に光る（.c-next.hot）・「対戦する」。試合数の見出し・凡例・「あなた／次の相手」の札・セドリックの一言・【暫定】の注記は出さない（ui1 の grid6／grid8・legend・tag・mark の画像は使わなくなった＝ファイルは残す）。
  - 大会2 対戦前比較：試合数の見出しを出さない。VS（大会3）は従来どおり約2.5秒・タップで早送り・反転は相手のモンスターの絵だけ・バトル側の導入（intro）は出さない。
  - バトルの HUD（js/battle/arena.js）：顔アイコンを出さない（.pti を隠す。旧 setupHudFace は削除）・ライフゲージ 9px → 12px（約1.3倍）・左右の HUD は同じ幅（flex 1・最大 50%＝長い名前でも広がらない）。
  - ルーレット：R.accelMs 350（起動の加速）・R.stopMs 500（STOP 後の慣性の減速）・R.overshootPx 6（行き過ぎ → 中央へ吸着）。巡航の速さは fight() の光（BASE_STEP_MS 85ms／枠＝約11.8候補／秒・Phase 6）に合わせたまま＝STOP の時刻と結果の関係を変えない（ADDENDUM2 の目安 4.5〜5.5候補／秒にするには fight() の変更が要る＝未決・報告）。レールの土台 assets/battle/roulette/rail_base.png（正式補助素材・透過 RGBA）をプレートの下に。battle_roulette_base_REFERENCE_ONLY.png（市松模様の焼き込み）はリポジトリに置かない。
  - 旧正式UI素材7系統（ADDENDUM §6）：リポジトリにあるのは VS 素材（assets/tournament/vs）・大会ランク選択（assets/tournament/rank_ui＝2026-10-05 FINAL）・街の名札（assets/town/nameplate）・共通UI A群／B群（assets/ui/a_group・b_group）。seijuushi_ui_png_transparent_20261006_102415・MysticMonsters_UI_PNG_20261006_095601・mismon_talk_ui_assets_20261006_093729・mismon_basecamp_UI_20261006_100342・mismon_market_ui_iphone_20261006_095842・ミスモン_大会UI素材_透過PNG_20261006_102319 の ZIP そのものは受け取っていない＝該当の画面は従来のまま（素材待ち・捏造しない）。

### 大会・状態異常・固有スキル・技習得ルート（2026-10-06・5。いまの正式。基準 1c1e2b8 への差分）

- **状態異常（js/battle/rules.js の AILMENTS）**：まひ＝3回の行動の機会のあいだ、毎回25%で行動に失敗（失敗してもターンを使う）・3回の機会のあとに治る。ねむり＝最大2回の行動の機会を失う（攻撃も補助もできない）・ダメージを受けるとすぐ起きる。違う状態異常は同時にかかる。同じ状態異常をもう一度受けたら残りを最初の値に戻す（足さない）。行動の機会＝fight() の「あなたのターン」「相手のターン」の帯（ban）。そこで動けないかを決める（ねむり → まひ。ねむりで動けない機会も、まひの回数は1回ずつ減る【解釈】）。動けない番：自分の番はルーレットが約1秒で自動で止まる・技の演出（anim・skb・skSfx）を出さない・resolveAction は何もしない結果（ダメージ・命中回数・効果なし）・MISS の数字と音を出さない（fx.js の MMRULES.swallow）・文は「〇〇はからだがしびれて動けない！」「〇〇はぐっすり眠っている…」。状態異常の札は HP の枠の中の別の箱（#mmail0／1。fight() が描き直す #st の外）。セッションごとの WeakMap（セーブしない・次のバトルへ持ち越さない）。
- **ノビトンの技（SK の 30〜39 に実行時に追加。正式データ js/phase10/monsters.js の OFFICIAL_MOVES のまま＝データの差分なし）**：はなみず＝相手の丈夫さ 小DOWN 1T／ひとやすみ＝攻撃ではない・自分の状態異常をすべて治す・能力の上げ下げは残す・最大ライフの20%回復（最大値まで）／しびれ突き＝30%でまひ／ダウナーミスト＝相手の攻撃系 中DOWN 2T＋丈夫さ 中DOWN 2T＋20%でねむり（計算の能力はかしこさ【暫定・要確認】）。状態異常の成功率は命中とは別の判定（命中して相手が倒れていないとき）。技の小さな絵は旧技から借りている。**ノビトンはまだ市場で買えない＝今のゲームのバトルには出ない**（エンジンには入れてある）。
- **純補助技（威力なし）は基本命中 100%**＝必ず決まる（ほしのまもり・吠える・ソニックムーブ・竜眼ロック・残影ステップ・ひとやすみ・すなかけ）。エンジンの命中率は 95% が上限のため、resolveAction に渡す命中の乱数を 0 にする（相手の回避で外れない）。
- **能力の上げ下げ**：エンジン（battle-bridge の applyEffect）が元から正式どおり（小10 中20 大30・同じ能力の同じ向きは足さない・強い方で上書き・同じ強さは残りを更新・弱いのは上書きしない・上げと下げは別の箱）＝変更なし（BR-03 で確認）。
- **聖なる炎（115/90/15）**：命中後に自分の 攻撃系（ちから・かしこさ）・命中・回避・丈夫さ 小UP 1T（ライフ・素早さは上げない）＝既存の EFF[19] のまま（かしこさは攻撃系に含まれる。BR-04 で確認）。
- **固有スキル（4種ともバトルで発動。値は js/phase10/monsters.js の UNIQUE_SKILLS の params）**：ソラモ 逆境のひと踏ん張り＝ライフが20%以下になったら次に与えるダメージを1度だけ ×1.25（1バトル1回・重ならない）／ガウル 紅翼の猛攻＝最初の3ターン（session.turn 1〜3）ちから・かしこさ +5%／ノビトン ふしぎな嗅覚＝相手が状態異常の間 ちから・かしこさ・丈夫さ +5%（治れば元に戻る）／ジオル 大地の守り＝倒れるダメージを受けたとき10%で1度だけライフ1で耐える（1バトル1回。耐えたときその技の追加効果は付かない）。能力の倍率はその行動の計算に使う能力の写しだけ（元の能力値・セーブは変えない）。種族は BPL[side].sp（0 ソラモ・1 ガウル・2 ノビトン・3 ジオル・4 レグナス）。レグナス 蒼銀の反撃は従来どおり rival-partner.js（動けなかった行動は「回避」に数えない）。発動の札は .mmsk（0.72秒＝ダメージの時刻）。
- **技の習得ルート**：ソラモは従来の枠どおり（初期 0〜3・ちから 4・かしこさ 5・命中 6・回避 7・丈夫さ 8→9）。ガウルの初期技の並び＝つつく・ウィンド・スパイラルダイブ・ソニックムーブ（SP[1][6]＝[11,12,10,13] を js/battle/official-moves.js の INITIAL で実行時に並べ替え＝新しく迎えた子の m.sk・m.eq の順だけ。既存のセーブの並び・番号は変えない）。特訓の枠（ちから 14・かしこさ 15・命中 16・回避 17・丈夫さ 18→19）は従来どおり。
- **大会の1試合目に「賞金」「ランクアップ」が出ていた原因**：fight()（Phase 6）の決着の文（`賞金 ${PZ[rkk]}G を獲得！`・`ランク${RN[m.rk]}にランクアップ！`）。データは finishBattle が戻していたが、文はバトルの結果の画面に出ていた。→ MMP8 の戦闘（大会・練習試合）の間だけ、#msg のその部分を描画の前に消す（MutationObserver。fight() は変えない）。
- **大会の終わりの順（js/phase8/raising.js の TOUR_END_STEPS・tourEndSteps・runTourEnd・registerTourEndHook）**：全試合の終了 → 最終順位の確定（final）→ 優勝の表示（champion）→ 初回クリアの報酬（firstReward＝従来の REWARD・UNLOCK の音と帯）→ 必要ならランクアップ（rankUp＝初回優勝でその個体のクリア最高ランクが上がったとき。reward.rankUp＝{ from, to, unlocked }）→ セドリックの締め（cedricEnd）→ 次の画面（next）。ランクアップの演出・セドリックの締めの正式 UI は素材待ち＝差し込み口だけ（何も出さない）。結果の画面（p9TourResult）を最初に出したとき1回 runTourEnd。
- **再優勝**：報酬なし（賞金・チケット・ステータスボーナス・ランクアップの記録なし。旧：再優勝でもステータスボーナスが付いていた）。大会優勝の回数（S.wins）は従来どおり数える（記録）。所持金の仕様（新人支援 1000G）は変えていない（10000G はデザイン確認用の表示）。
- **順位の計算に使う試合の内容**：プレイヤーの試合＝バトルの実際の値（MMRULES.battleStats＝残りライフ%・与えたダメージ・命中回数）を after() で m.raise.battle.stats に入れ、MMP8L.recordPlayerResult が試合（mt.st。v6 の任意項目）に記録。NPC 同士の試合・記録の無い試合（古いセーブ・途中の再読み込み）は大会のシード値と試合から決まる値【暫定】（matchStats。再読み込みで変わらない）。
- 大会2 にセドリックは出さない（従来どおり）。今後の流れ（ランク選択 → 参加確認 → ランク開始演出 → セドリック開幕 → 大会1 → 大会2 → 大会3 → バトル／終わり：優勝 → 報酬 → ランクアップ演出 → セドリック締め）は構造のメモ（デザインは変えていない）。
- テスト：tests/battle-rules-1006.test.mjs（BR-01〜08）・実ブラウザ tests/qa-e2e-rules-1006.test.mjs（RB-B1〜B3）

### 大会

- ランクは E〜S。各Chapterのゴールで1回挑戦できる（辞退も可）。
- **Chapter の解放条件（2026-10-01 夜・正式）**：Chapter 1・2 は条件なし、Chapter 3＝公式Cランク大会クリア以上、Chapter 4＝公式Bランク大会クリア以上。判定はその個体の大会クリア実績（m.prog.rankClr＝MMP8.highestCleared。表示用のランクや S.rankRec ではない）。コードは js/phase8/raising.js の CHAPTER_RANK_GATE・chapterGate、canDepart は条件不足で { ok:false, reason:'rank_gate', key, need, have }。
  - 条件に届かない個体は Chapter間ファームから先へ出発できず、「その個体の今回の育成はここまで」（失敗ではない）：ファームの通知（名前・顔なし）に「Chapter N 解放条件／公式Xランク大会クリア／このモンスターの育成はここまでです」、進行ボタンが「育成を完了して街へ戻る」（2度押し。出発準備にも同じボタン）→ 既存の育成完了（MMP8.finishWithoutFinal。記録は { ch, skipped:true, reason:'rank_gate', need }。育成完了回数＋1・完了時の能力 endStats）→ 育成完了画面 → 牧場へ。個体・能力・技・名前・所持金・アイテム・大会の実績はそのまま（セーブ形式は変えていない）。
  - ターン切れ（大会なし）でも Chapter は終わり、次の Chapter の前のファームへ（従来どおり）。そこで次の Chapter の条件に届かなければ上の流れ。
  - 注意：Chapter 2 で挑戦できる上限は「クリア最高＋1（D までは最初から）」なので、Chapter 1 で D をクリアしていない個体は Chapter 2 で C に挑戦できず、Chapter 3 へは進めない（既存の大会の規則のまま）。
- **S への導線（2026-10-08 正式）**：Chapter 4 で A ランク大会に優勝したあと、同じ育成中の個体のまま「最終公式大会」＝S ランク大会（8体7試合）へ（§3「監査後の仕様確定差分」）。**昇格＝D優勝→C解放・C→B・B→A・A→S（E・D は最初から解放＝E→D の昇格は無い）**。
- 挑戦上限は「その個体のクリア最高ランクの1つ上」（2026-10-01 正式。旧：＋2）。ただし D までは最初から選べる（Chapter 1 の時点で D まで。未クリア・E クリアでも D まで）。下位ランクは引き続き選べる。コードは js/phase8/raising.js の RANK_UNLOCK_STEP（1）・RANK_FLOOR（D）。
- 総当たりリーグで、参加数は E・D が 6 体、C〜S が 8 体。1位で優勝。順位（2026-10-06・5 正式・同率1位なし）＝勝ち数 → 残りライフの合計（各試合の終わりの % の合計）→ 大会中の総ダメージ → 命中の総回数 → 従来の対戦成績 → 抽選値（js/phase8/league.js の standings・TIEBREAK）。
- 初回優勝の賞金は個体ごと・ランクごとに1回：E 100／D 200／C 350／B 550／A 800／S 1200G。初回優勝の特訓チケット（2026-10-06・5 正式）：E1 D1 C1 B2 A2 S2。再優勝（クリア済みのランク）は報酬なし（賞金・チケット・ステータスボーナス・ランクアップなし）。1試合ごとには報酬・ランクアップを出さない（決着の1回だけ）
  - 上位ランクで優勝すると下位ランクもクリア扱いになるが、飛ばした下位ランクの賞金は出ない。
- 対戦相手の能力値（E 70〜S 300）は暫定値。
- 試合の途中で中断した場合は、その試合をやり直す（結果・賞金は付かない）。
- 見せ方（2026-09-30）：
  - ランク選択（p8GoalHtml）：E〜S の6つを並べ、挑戦できるランク（MMP8.eligibleRanks＝既存の解放条件）だけ押せるカード（button.p9rank）、それ以外は鎖と錠で封印した小さな札（div.p9rlock「ランクC／封印中」。押せない。.p9rlocks に横並び）。挑戦できるカードは2列（.p9ranks）で、375×667 でも辞退ボタンまでスクロールなしで収まる。案内はフィナ（p9Fina）。ランクを1回タップするとフィナの見立て（FINA_RANK_TALK：6能力の平均 ÷ そのランクの相手の能力（MMP8L.PROVISIONAL_OPPONENT_STAT）が 1.25 以上＝余裕、0.9 以上＝互角、それ未満＝厳しい。勝敗は保証しない）、2回目で参加（従来の2度押し）。セドリックはここには出さない。
  - 開始演出（p9TourIntro）：参加を確定して保存したあと、暗転 → ランクのエンブレム → セドリックの一言 → 順位表（タップで飛ばせる。約3.3秒。視差効果を減らす設定では省略）。順位表では参加者が右から順に入って並ぶ（.p9st.p9enter）。
  - 順位表：次の対戦相手の行だけ白〜金の柔らかい発光（.p9r.nxt・「次の相手」の札）。対戦順は従来の大会ロジック。
  - VS 画面（p9VsScr）：中央に VS → 自分が左から・相手が右から入る → 短いインパクト → 能力の比較（CSS のアニメ .p9vs-anim。処理は変えない）。
  - **マスごとの反応（2026-10-04 第二段階 PHASE E。field-view）**：能力マス＝成長演出（間 → マスが光る → モンスターが小さく跳ねて足元に光の輪 → 正式素材の枠 frame_stat_up の中に「能力のアイコン（正式マスUI tile_stat_*）が浮く → 『ライフ +5』が +0 から上がる → 正式色のゲージが上がる前の値から後の値へ伸びる（999 を最大とした絶対の目盛り＝100 で約10%）→ 粒子」→ 短い余韻。全体 約1.1秒（0.6〜1.3秒。タップで短縮）。能力が動く出来事（stat・multi）も同じ行（複数の能力は縦に並べて重ねない）。色は index.html の STAT_COLOR（ライフ #f2c94c・ちから #e5533c・かしこさ #4fbf6a・命中 #f08cb4・回避 #5cc8e8・丈夫さ #4a74e0。field-view の STAT_COLOR_DEF は同じ値の控え）。宝箱＝揺れて開く＋開封の光の粒（.chf-csparks）→ 報酬 → 所持金へ。イベント＝フィナの会話（lines）→ 結果。休憩（回復イベント・休むコマンド）＝青いやわらかい帯（.chf-restveil 約0.95秒）＋疲れの回復。野生＝遭遇の演出（カットイン）、ライバル＝リュウの帯（従来どおり）。**疲れの見せ方**：増減（+3／+5／+7・−30・−N）をチップの脇に短く浮かべる（.chf-fatfly 0.9秒。サイコロのあと・休む・回復イベント・少し疲れる出来事）。チップの段階（f-lo／mid／hi）と目盛りも合わせる（fatLevel）。視差効果を減らす設定（V.calm・prefers-reduced-motion）では粒子・帯・浮く表示を出さない。バトル（§19・20）：技・STOP のボタンは MMFEEL の押下反応（button 全般の .mm-press）が効いており、fight()・.bt 系 CSS は変えていない
  - **公式大会の画面（2026-10-04 第二段階 PHASE D。デザイン参考 01〜05）**：①ランク選択＝従来の受付 p9ReceptionHtml（S→E・参加可能／参加不可の鎖と錠・フィナの見立て。変えていない）→ ②大会進行 p8TourScr（.tp2）＝上に「CHAPTER N・公式大会・第N戦」の帯、「現在の成績」（第1〜N戦＝勝利（王冠）／敗北（×）／次の試合（剣）／未定）、「次の対戦相手」（自分 VS 相手。相手のモンスターは「？？？」）、セドリックの一言、「⚔️ 対戦開始」（1タップ）→ ③パラメーター比較 p9CompareScr（.p9cmps）＝大会の背景（fight() と同じ BTB）の上に両者の正式画像と6能力のゲージ（999 を最大とした絶対の目盛り・正式色 STAT_COLOR。数字・戦力・勝率・有利は出さない）、「⚔️ 対戦開始」（2度押し p9VsGo）・「順位表にもどる」→ ④ VS＝fight() の導入 intro()（CHALLENGER／YOUR MONSTER・VS・約3.1秒・タップで飛ばせる。Phase 6 のまま。色だけ金の VS・札）→ ⑤ BATTLE START＝fight() の帯（大会名 → FIGHT!）→ 実戦。順位表・対戦表は大会進行の下に残す（スクロール）。大会の処理（MMP8L・startTournament・tourNext・settle・賞金・人数 E・D 6／C〜S 8・解放 D→C→B→A→S）は変えていない。S ランク優勝＝S.npcFlags.chapter5 を 1 にして結果画面に「S ランク制覇！ 新たな道が開かれた…（Chapter 5 は準備中）」の札（Chapter 5 の画面・ボードは作らない）。旧 p9Cmp（数字の比較）は関数だけ残す
  - **対戦前の画面を1つに（2026-10-03 品質向上。上の PHASE D で大会進行 → パラメーター比較の2画面に）**：大会＝順位表の「次の相手」に両者の顔・小さな能力比較（p9Cmp）・「⚔️ 対戦開始」（2度押し p9VsGo）→ fight()（導入の対面＋VS は fight() 側＝Phase 6 のまま）。練習試合（野生・レア・ライバル）は Battle 開始前の導入（p9PreBattle）を出さず fight() の導入だけ。p9VsScr・p9PreBattle の関数は残す（どこからも呼ばない）。以下の「VS」「Battle 開始前の導入」は旧構成の記録。
  - **大会の対戦前の統合（2026-10-03。試遊で「画面が多く遅い・音が NG」）**：1試合ごとの流れ＝順位表（次の相手・順位表・対戦表・試合数＝残す）→「対戦へ」→ VS（相手の発表＋6能力の比較＋相手の種族。バトルの背景 BTB の上・1枚）→「対戦開始」（2度押しのまま）→ fight()。旧：VS のあとに Battle 開始前の導入（両者・個性スキル「未登録」・6能力をもう一度）があった＝両者の顔と VS が3回・比較が2回・タップ4回 → 今は画面2枚・タップ3回。音：VS の発表の音（MATCHUP）・受付／順位表／結果の曲は無音（上の NG の音）。
  - Battle 開始前の導入（p9PreBattle。**2026-10-03 から練習試合の「バトルする」の直後だけ**。旧：対戦開始と練習試合の直後）：バトルの背景（fight() と同じ BTB）の上に両者・個性スキルの枠（正式データ未登録＝「―（未登録）」）・主要パラメーター（自分の6能力と MMP8L.PROVISIONAL_OPPONENT_STAT）→「BATTLE START」。beginBattle と fight() は START のあとだけ動く（二重発動なし）。練習試合の相手の姿は fight() が決めるため「？」。

### 特訓

- **名称（正式）：旧名称「修行」は廃止。プレイヤー向け正式名称は「特訓」**（特訓チケット・特訓マップ・特訓開始・特訓NPC、能力別は「ちから特訓・かしこさ特訓・命中特訓・回避特訓・丈夫さ特訓」、施設は「ちから特訓場」など）。内部コード名（training・trainRun・trainTix・trStart・p7TrainMenu・TRAIN_KINDS・icon.farm.training など）・データキー・セーブ・コードコメントは、互換性のため旧名称のまま残してよい。
  - 旧名称が残る場所：fight() の中の旧「師匠との修行」戦の見出し（Phase 6 保護対象。今は入口がなく表示されない）、到達しない旧コード（_hall の旧「師匠に勝つと…」の一覧）、コードコメント、テスト名・テストのコメント、QA_AUDIT.md などの過去の記録。
- 5種類：ちから・かしこさ・命中・回避・丈夫さ
- Chapter間ファームから特訓チケットで挑戦する。特訓ボードは15マスの一本道（15マス目がゴール）、サイコロ 1〜3、ターン制限なし、止まったマスだけ効果。
- **上昇（正式）**：専用能力マスに止まると、対応能力 +2〜3 とライフ +2〜3 を同時に上げる（5種類とも同じ仕組み。丈夫さ特訓の2回目も同じ）。独立したライフマスは廃止（旧ライフマスの 4・9・14マス目は通常マス＝何も起きない）。専用能力マスは 2・7・11マス目、それ以外の1〜14マス目は通常マス。コードは js/phase7/progression.js の TRAIN_TEMPLATE・TRAIN_GAIN・advanceTraining（戻り値の gain＝対応能力、lifeGain＝ライフ）。
  - 画面の説明：特訓メニューのカードは「専用マスに止まると、〇〇とライフが少し伸びる」、ボードの凡例は「（能力のアイコン）=〇〇＋ライフ　・=何も起きない」、止まったときの表示は「〇〇がN上がった！ライフがN上がった！」。
- 丈夫さの特訓はランク C 以上のクリアで解放。種類ごとの回数上限は js/phase7/progression.js の定義に従う。
- 種族ごとの特訓技（技セット）が未登録のため、現在の特訓は能力上昇だけ。
- 特訓の正式NPCはゲンシン（下の NPC の項）。5種類すべてを1人で担当する（特訓ごとに別のNPCはいない）。

### バトル

- ターン制。縦型の技ルーレット（技6枠＋固定MISS 1枠）を STOP で止め、止まった技が発動する。初期は4技＋空き2枠。
- KO するか、規定ラウンド（15）の終了時にライフが多い方が勝ち。降参ボタンあり。
- Phase 6 保護対象（変更禁止）：
  - 対象：fight()、battle-bridge.js、adapter.js、legacy、技ルーレット、.bt 系 CSS、Battle Engine、バトル技データ、素早さ分離処理
  - ハッシュ：fight() d46e27f6…、battle-bridge.js bff08e0f、adapter.js f99617ac、legacy 90eeba79
  - 照合は tests/phase7.test.mjs で行う。

### 技データ

- 現在のゲームは、index.html の旧来の技表（数値ID）を使っている。技の分類は「ちから」と「かしこさ」。
- 正式技データ（4原種の正式技・正式技ID・正式な威力）は、技制作チャットからの同期待ち。同期されるまでコードへ入れない。**2026-10-06：ソラモ・ガウル・ノビトンの正式10技（数値つき）とジオルの技名が同期された＝§3「本体修正＋大会UI統合（2026-10-06・4）」。ソラモ・ガウルはバトルの SK（0〜19）を実行時に入れ替える**

### 経済・市場・売却

- **所持金（2026-10-06 正式）**：新しいゲームは 0G（MMP10M.ECONOMY.initialGold 0）→ 聖獣士登録の直後に新人支援 1000G＋薬草×1 → 市場で 500G の1体 → 500G 残る。旧（2026-10-05 まで）：初期所持金 300G＋市場で補填。市場価格 500G（ソラモ・ガウル）。下の初回購入救済・継続用救済は古いセーブの詰み防止として残す（通常の新規プレイでは所持金が足りるので発動せず、補填の通知も出ない）。
- 初回購入救済：手持ち・牧場とも0体で所持金500G未満のとき、購入時に500Gまで補填する。
- 継続用救済（2026-10-04：研究所の合体UI＝museum('fuse') ができたので、index.html が MMP10M.setFusionAccess(() => true) を登録＝「合体（2体以上・200G）ができるなら救済なし」の従来の条件に戻った）：次の条件をすべて満たすときだけ、購入を確定した時点で不足分を補い、500Gで購入する（購入後0G）。確定前の補填金は他に使えない。
  - 未育成・育成中の個体がいない
  - 所持金が500G未満
  - 合体（2体以上・200G）もできない。ただし合体は「プレイヤーが画面から合体を使えるとき」だけ数える（2026-09-30）。研究所の合体UIが未実装の今は使えない扱いで、育成完了2体以上・200〜499G でも救済が出る。判定は js/phase10/monsters.js の fusionAvailable（既定は false）。研究所の合体UIを作ったら、その側で MMP10M.setFusionAccess(() => true)（または開ける条件を返す関数）を登録すれば、従来の条件に戻る。セーブには持たない
- 合体費用 200G。**牧場は最大8体（2026-10-06 正式。MMP10M.RANCH_LIMIT 8）・所持上限は牧場8＋連れている1＝9体（OWN_LIMIT）**（以下は旧記録：2026-10-04 PHASE H3 は牧場20体＝牧場20＋連れている1＝21体（OWN_LIMIT）**（旧：手持ち＋牧場で8体・牧場7体）。
- 市場：左右の矢印で切り替えるループ型カルーセル。画面は3状態：カレンの会話中（操作UIを隠す）／通常の閲覧（モンスターと名前・価格の名札・矢印・ドットだけ）／詳細（中央のモンスターをタップ→下からのシートに能力7項目と購入ボタン。×・背景のタップで閉じる）。縦スクロールなしで購入ボタンまで届く。
  - モンスターと市場の背景は、画面の高さの8%だけ上げている（P15_LIFT。背景も同じだけ上げるので台座の位置はずれない）。
  - 画面下が切れない作り：市場の枠の高さは実際に見えている高さ（100dvh。iPhone の Safari では 100vh がツールバーの下まで含む）。案内欄は枠の下端から safe-area（ホームインジケータ）分だけ上。詳細シートの最大の高さも dvh と safe-area で計算。合格条件は「案内欄の枠全体」「詳細シートの最下端（購入ボタン下の説明文まで）」が画面内に完全に収まること。
  - 市場の枠の中身はスクロールさせない（overflow:clip。古いブラウザ向けに切り替えのたびに scrollTop を0へ）。閉じた詳細シートは visibility:hidden（フォーカスが入らない）。以前、枠の中身が386pxずれて案内欄が画面の途中に出て矢印をふさぐ不具合があった。
  - 案内欄の表示・非表示は class（.wait）で切り替える。汎用の class 名（.pop など）は既存のCSSとぶつかるので、市場では p10 などの接頭辞をつける。
  - 自動テストで購入ボタンを押すときは、先に H.marketDetail(page) で詳細を開く。
  - 中央100%・左右は約70%。横スワイプ・ドット・キー操作も可。
  - 切り替えは約0.3秒で、切り替え中は操作と購入を受け付けない。中央の個体と購入対象を照合する。
- ノビトンは「入荷待ち」。入荷条件は育成完了5回で、条件と回数の表示まで実装している。販売は未開始。
- ジオルは市場に出さない。
- 売却（牧場）：
  - 未育成は 50G。
  - 育成完了は「100G＋育成中に増えた6能力の合計（上限150G）＋その個体の最高到達公式ランク加算」で、最大400G。ランク加算は E25・D50・C75・B100・A125・S150G、未到達は0G。
  - 育成中の個体がいる間と、最後の1体は売却できない。確定は2度押し。
- 育成完了回数：育成完了1回につき1回だけ数える（購入・合体・再読込では増えない）。記録のない旧セーブは0回から数え始める。
- アイテム屋：商品は未登録。アイテム売却は未実装。

### NPC

- 市場の正式NPCはカレン。旧仕様の市場NPC「リナ」は今後使用しない（index.html の旧データ NP.m に名前とセリフが残っているが、どこからも表示されない。互換データのため削除は保留）。牧場（ぽかぽか牧場）の正式NPCはニック。旧データ NP.f（名前「ダン」）・NPI.f は旧仕様の互換データとして残すが、どこからも表示しない（ファームNPCのダンとは別人）。ファームの旧NPC「コウ」は、正式ファームNPC「ダン」に表示を置き換えた（旧データ NP.b・NPI.b・assets/embedded/npi_b_kou.png は互換のため残す。どこからも表示しない）。
- フィナ以外の施設NPCはアップ画像（closeup）のみで運用する（全身を前提にしない）。
- **2026-10-03 品質向上（NPC の見せ方）**：「小さな顔＋文章」をやめ、正式の半身（closeup）を大きく立たせる（共通の .nst＝立ち絵＋ネイビーの会話窓・名前の札。立ち絵は窓の後ろへ溶かし顔を隠さない）：街のフィナ（guide）・ヴァルガス（VARGAS_STAND＝stern）・牧場のニック（NICK_STAND＝smile）・研究所の入口のエリオット（ELLIOT_STAND＝guide）・Chapter のフィナの吹き出し（半身を吹き出しの上に）。共通会話 MMNPC の半身は min(52dvh,470px)、重要な会話（major）は同じ表情の全身（フィナの全身10ポーズ）＋控えめな光。アイテム屋の店主は腰から上を大きく（全身の絵を大きく置き、下は商品の窓の後ろ）。ダンは従来どおりファームの立ち姿。カレン・セドリック・ゲンシンの顔の吹き出しは今回変えていない（短い一言・大会の進行）。短いシステム通知は顔なし。
- **NPC会話の基本構造：「フィナ ↔ NPC」**。フィナはプレイヤーの代理・分身に近い立場で、プレイヤーの疑問・判断・驚きはフィナが代弁する。NPCがプレイヤーへ直接語りかける会話にはしない（例外が必要なら仕様側へ確認）。今後の新しいNPC・会話もこの形を基本にする。
- ニック（ID nick）：牧場の管理者（牧場＝所有モンスターを管理する施設：所有個体を見る・育成済み個体の管理・預ける／受け取る・様子を見る・売却・将来の名前変更。合体は研究所へ移す（下の研究所）。ファーム＝育成中の個体と過ごす場所とは別）。
  - 人物像：落ち着いた大人・少し男前・余裕がある・人当たりが柔らかい・頼れる・モンスターの扱いに慣れている（渋すぎない・無口すぎない・軽薄でない・威圧的でない）。
  - 口調：「やぁ」「どうする？」「〜だな」「〜しておくよ」「任せておけ」「心配するな」。俺様・荒っぽい・若者言葉・チャラい・「〜だぜ」の多用は避ける。
  - ダンとの違い：ダンは口数少なめ・実務的・やや寡黙（「ああ。任せてくれ。」）。ニックはもう少し柔らかく、大人の余裕と親しみやすさ（「やぁ」「任せておけ。」）。同じ口調にしない。
  - 表情 normal・smile・guide・troubled・happy・serious（表情名は絵の内容から決めたもの＝要確認）。セリフは index.html の NICK_TALK。小さい顔は NICK_FACE（assets/npc/nick/face.webp）。
  - 登場場所：牧場の吹き出し（顔・名前・一言。NICK_TALK.ranch からランダム）。会話ウィンドウは開かない（フィナ ↔ ニックの掛け合いは今は無し）。
  - 牧場の背景は正式背景（index.html の RANCH_BG＝assets/ranch/ranch_main.jpg。元データは assets/ranch/original/。README.md）。旧仕様の人物・旧い吹き出し・旧ロゴは描かれていない。画面の吹き出し（.fbub）は左上の空（left 3%・top 3%・幅52%）に出し、牧舎を隠さない。しっぽは無い。旧背景（FARMIMG＝assets/embedded/farmimg_ranch.jpg。旧人物・旧い吹き出し・旧ロゴ入り）は互換のため残すが、表示には使わない。
  - システム通知（「預けました。」「売却しました。」「受け取りました。」など farm(msg) の msg）は、名前・顔なしの通知（.fbub.sys）。ニックの顔・名前はニックの一言だけ。
  - **2026-10-03 品質向上**：正式背景の右にニックの半身（会話窓つき。通知のときは立ち絵だけ）、左に選んでいる子（様子を見るの詳細の子・連れている子・牧場の最初の子の順）を大きく。ほかの子は背景を歩く。4コマンド・中身の処理は従来どおり。タブの音は UI_TAB。
  - 牧場の正式UI（2026-09-30）：上の見出し（h1）は出さず、上部に「◀ 街にもどる」（button.back）・「牧場」の札・所持金（.fhud）。その下に正式背景（.fscene。背景は加工しない）とニックの一言（控えめ：幅 min(60%,228px)・11.5px・半透明。名前の札を1行目、一言を2行目から＝一言が途中で不自然に折り返さない）。その下に4コマンドを2×2（.ftiles.rncmd：上段 預ける・受け取る(N)、下段 様子を見る＝button.ftile、売る＝button.fsell。遷移は farm('','a')・farm('','b')・farm('','e')・farm('','d')）、その下に選んだ機能の中身（.wpanel。処理は従来どおり）。街・ファームと同じ濃紺＋金・金色の線画アイコン（RN_IC）。選択中は金縁を明るく＋下辺に細い金の発光1本（短い下線は使わない）。売る（と売却の確定ボタン）は暗い赤茶の差し色。旧い画像つきタイル（FT）は表示に使わない（データは残す）。
  - 様子を見る（2026-09-30。ft=='e'・rnLookPanel／rnLook・アイコンは目の線画 RN_IC.look）：牧場の個体（S.box）を見るだけの画面。一覧＝画像・名前・種族（「ガウル（鳥種）」）・大会ランク（MMP8.rankLabel）、受け取るボタンは無い。押すと詳細＝正式画像・名前・種族・大会ランク・6能力（ライフ・ちから・かしこさ・命中・回避・丈夫さ）と「◀ 一覧にもどる」だけ。受け取る・売る・合体・育成・名前変更・アイテムなどの操作と、新しいデータ（なつき度など）は無い。セーブもしない。0体のときは「牧場にはまだモンスターがいません。」。
  - 合体は牧場から外した（2026-09-30。牧場のコマンド・導線だけを削除）。合体の処理（fuse・selm・選択画面 farm('','c')・継承・誕生・セーブ互換・費用200G）はそのまま残し、研究所から呼べるようにしている。farm('','c') は内部の画面として残る（街から牧場へ入るときは c を開かない）。研究所の合体UIは未実装のため、今はゲームの画面から合体できない（KNOWN_ISSUES.md）。
- ダン（Dan・ID dan）：ファーム担当（Chapter間ファームの案内・管理）。男性・20代後半〜30代前半。落ち着いていて実務的・面倒見がよい・必要なことを簡潔に話す（冷たい・無口すぎる・威圧的にはしない）。口調は「〜だ／〜しよう／〜してくれ」。フィナとは仕事で何度か顔を合わせている程度（初対面でも親友でもない）。
  - 表情 normal・smile・guide・serious・troubled・happy（表情名は絵の内容から決めたもの＝要確認）。セリフは index.html の DAN_TALK。小さい顔は DAN_FACE（assets/npc/dan/face.webp）。
  - 登場場所：ファーム（育成開始前・Chapter間・育成完了。下の「ファーム」）の立ち姿（アップ画像 smile）と吹き出し（名前・顔・一言）、育成開始の掛け合い（下のフィナの項）。ファーム・牧場・Chapterボードで会話ウィンドウは開かない。
  - **システム通知と NPC の発言を分ける**：画面に渡す msg（「並び順を変更しました。」・Chapterの結果・「保管庫に入れました。」など）はシステム通知で、NPCの顔・名前を付けない（ステータス・わざ・特訓・出発準備・ショップのメッセージ欄は文字だけ。ファーム（Chapter間を含む）は名前・顔なしの通知 .kbub.ksys）。顔を出すのは NPC が実際に話している一言（bcomm）だけ。
  - 一言（bcomm）は DAN_TALK.farm／chapter／interval。モンスターの様子についての短い言葉で、プレイヤーへの呼びかけにしない。
- セドリック（ID cedric）：大会の正式NPC。公式ランク大会（E〜S）の進行・実況・案内を担当する公式スタッフ（試合開始・結果の演出も）。
  - 闘技場NPC「ヴァルガス」（闘技場の管理者・実力を見る・厳格・上級者向け施設）とは別人物・別役割。混同しない（ヴァルガスは下の項）。
  - 人物像：爽やか・知的・公式感がある・進行が上手い・聞き取りやすく明瞭・普段は丁寧・試合のときだけ少し熱量が上がる。軽薄・チャラい・現代スポーツ実況風にはしない（王道ファンタジー大会の公式進行役）。
  - 口調：敬語が基本（「それでは、始めましょう。」「次の対戦はこちらです。」「いい試合になりそうですね。」「準備はよろしいですか？」）。試合の場面だけ少し上げる（「両者、準備はよろしいですね！」「それでは、試合開始です！」「勝負あり！」「見事な戦いでした！」）。絶叫（「うおお」「激アツ」など）・若者言葉・芝居がかった司会口調は使わない。
  - ダン（寡黙・実務的）、ニック（柔らかい大人の余裕・親しみやすい）とは口調を分ける（セドリックは爽やか・明瞭な進行役）。
  - 会話は「フィナ ↔ セドリック」が基本（フィナとの掛け合いは今は無し）。ただし大会進行の短いアナウンスは、会話ではなくアナウンスとして、セドリックが直接画面に出てよい。
  - 表情 normal・smile・guide・happy・surprised・serious（表情名は絵の内容から決めた仮名＝要確認）。セリフは index.html の CEDRIC_TALK。小さい顔は CEDRIC_FACE（assets/npc/cedric/face.webp）。吹き出しは p9Ced（.p9ced：顔・名前「セドリック」・一言のクリーム色の吹き出し）。
  - 表示場所（会話ウィンドウは開かない）：大会開始の演出（p9TourIntro：暗転 → ランクのエンブレム「公式ランクE大会」→ セドリックの一言 open「公式ランク{R}大会を開始します。参加者を紹介しましょう。」→ 順位表。E〜S 共通）、順位表の次の相手の上（最初の試合の前は first「それでは、始めましょう。最初の対戦はこちらです。」、そのあとは next「次の対戦はこちらです。」「いい試合になりそうですね。」を試合数で交互）、VS画面（vs「両者、準備はよろしいですね！」）、結果画面（優勝は won「勝負あり！ 見事な戦いでした！」、それ以外は lost「大会はここまでです。見事な戦いでした。」）。
  - システム表示（参加条件・ランクの説明・報酬・「第N試合：勝ち！」などの試合結果の文・中断の案内・【暫定】の注記）はセドリックの発言にしない（顔・名前なしの .p9msg・.p9s などのまま）。
  - Phase 6（fight() など）には入れない。表示は Phase 6 の前後の大会画面（p8GoalHtml・p8TourScr・p9VsScr・p9TourResult）からだけ行う。大会の参加条件・報酬・人数・進行は変えていない。
- エリオット（ID elliot）：研究所の正式NPC。研究所の案内・研究・解析を担当する研究者（将来の図鑑・記録閲覧・特殊復元・キーアイテム解析・古い石板や資料の研究を扱う予定。合体も研究所で扱う（正式。研究所の合体UIは未実装））。
  - 人物像：穏やか・知的・物腰が柔らかい・説明が上手い・研究者らしい・モンスターへの興味が深い・興味深いものを見ると少し熱が入る。上から目線・堅苦しすぎ・オタクっぽすぎ・コミカルすぎにはしない（「難しいことを分かりやすく説明してくれる研究者」）。
  - 口調：柔らかい敬語（「こんにちは。何を調べてみましょうか。」「興味深いですね。」「こちらの記録も確認してみましょう。」）。「〜なのだ」「〜であるぞ」の博士口調・偉そうな言い方・専門用語の連発・現代研究者風は使わない。フィナとの例：フィナ「何かわかった？」→エリオット「ええ。少しずつですが、手がかりは見えてきました。」。
  - 会話は「フィナ ↔ エリオット」が基本（重要な判断は フィナがプレイヤーへ確認 → 選択肢 → フィナがエリオットと続ける）。研究所画面の軽い一言は、テンポを優先して会話ウィンドウにせず吹き出しで出す。フィナとの掛け合いは今は無し。
  - 表情 normal・smile・guide・thinking・curious・serious（画像内容から決めた仮名＝要確認）。セリフは index.html の ELLIOT_TALK。小さい顔は ELLIOT_FACE（assets/npc/elliot/face.webp）。吹き出しは elSay（.elsay：顔・名前「エリオット」・一言のクリーム色の吹き出し）。
  - 表示場所（会話ウィンドウは開かない）：研究所の図鑑一覧 museum()（lab からランダム：「こんにちは。何を調べてみましょうか。」「図鑑の記録も、少しずつ埋まってきましたね。」「気になる子がいたら、記録を見てみましょう。」）、図鑑の詳細 musd(i)（book からランダム：「こちらの記録も確認してみましょう。」「興味深い子ですね。記録を見てみましょう。」）。特殊復元・キーアイテム解析の画面はまだゲームに無いので、そこには出していない。
  - システム表示（図鑑の見出し「出会えるモンスターの記録」・ノビトンの「近日公開」・図鑑登録・復元の成否・条件不足・保存・エラー・ロック）はエリオットの発言にしない（顔・名前なし）。
- ヴァルガス（ID vargas）：闘技場の正式NPC。闘技場の管理者。闘技場は公式ランク大会とは別の施設（育成済み・実力のあるモンスター向けの上級者向け施設。開放条件・報酬・バトル構成は未決）。
  - 大会NPCセドリックとの違い：セドリックは公式ランク大会（E〜S）の進行役（爽やか・明瞭・丁寧）。ヴァルガスは闘技場の管理者（厳格・寡黙）。混同しない。
  - 人物像：厳格・寡黙・実力主義・無駄口が少ない・理不尽ではない・強者にはきちんと敬意を払う・威圧感はあるが悪人ではない・闘技場責任者らしい格式・軍人っぽさはあるが単なる兵士ではない・感情を大きく出さない（「強ければ認める」）。
  - 口調：短く、重く、明瞭（「ここは闘技場だ。」「挑む覚悟はできているか。」「実力を示せ。」「悪くない。」「準備ができたら声をかけろ。」）。長い説明・チャラい言い方・怒鳴り・「〜だぜ」・古風すぎる武人語・悪役っぽさは避ける。
  - 会話は「フィナ ↔ ヴァルガス」が基本（重要な判断は フィナがプレイヤーへ確認 → 選択肢 → フィナがヴァルガスと続ける）。軽い一言・施設の短い案内は会話ウィンドウにせず吹き出しで出す。フィナとの掛け合いは今は無し。
  - 表情 normal・guide・stern・approval・surprised・respect（画像内容から決めた仮名＝要確認）。セリフは index.html の VARGAS_TALK。小さい顔は VARGAS_FACE（assets/npc/vargas/face.webp）。吹き出しは vgSay（.vgsay：顔・名前「ヴァルガス」・一言のクリーム色の吹き出し。押すたびに1つだけ）。
  - 表示場所：街の闘技場ボタン（ロック中）を押したとき、案内欄の下（VARGAS_TALK.locked からランダム：「ここは闘技場だ。今はまだ、その時ではない。」「準備が整ってから来い。」「挑む覚悟ができたら、また来い。」）。開放条件は未決なので、条件を断言する言葉は使わない。
  - システム表示（「闘技場は、まだ利用できません。」・ロック・条件不足・未開放・エラー・保存）はヴァルガスの発言にしない（顔・名前なし）。
  - Phase 6（fight() など）には入れない。
- ゲンシン（ID genshin）：特訓の正式NPC。5種類すべての特訓（ちから・かしこさ・命中・回避・丈夫さ）を1人で担当する総合的な指導役。
  - 人物像：厳しいが理不尽ではない・実力がある・教えるのが上手い・努力をきちんと評価する・モンスターの成長をよく見ている・芯があり頼れる・言葉数はやや少なめ・「鍛えつける」より「伸ばす」タイプ。熱血すぎ・怒鳴る・怖い師匠にはしない。
  - ヴァルガスとの違い：ヴァルガスは闘技場の管理者（厳格・寡黙・実力主義・強さを試す）。ゲンシンは指導者（努力を見る・成長を促す・必要なときだけ厳しい・特訓で伸ばす）。似せすぎない。
  - 口調：短く、落ち着いて、芯がある（「準備はいいか。」「焦るな。ひとつずつだ。」「悪くない。その調子だ。」「今の感覚を忘れるな。」）。怒鳴り・「根性だ！」のような熱血・「〜だぜ」・古風すぎる武人語・長い説教・大げさな褒め方は使わない。
  - 会話は「フィナ ↔ ゲンシン」が基本（重要な判断は フィナがプレイヤーへ確認 → 選択肢 → フィナがゲンシンと続ける）。特訓中の短い励まし・評価は、ゲンシンが直接一言で話してよい（会話ウィンドウにしない）。フィナとの掛け合いは今は無し。
  - 表情 normal・smile・guide・serious・strict・praise（画像内容から決めた仮名＝要確認）。セリフは index.html の GENSHIN_TALK。小さい顔は GENSHIN_FACE（assets/npc/genshin/face.webp）。吹き出しは gsSay（.gssay：顔・名前「ゲンシン」・一言のクリーム色の吹き出し）。
  - 表示場所：特訓メニュー（p7TrainMenu の上。menu からランダム：「準備はいいか。」「焦るな。ひとつずつだ。」「今のお前たちなら、まだ伸びる。」）、特訓ボードの開始（出目を振る前。特訓の種類ごとの start：ちから「力だけを追うな。動きを見ろ。」・かしこさ「焦るな。よく見て、考えてから動け。」・命中「狙いを定めろ。急ぐ必要はない。」・回避「無理に急ぐ必要はない。動きを見ろ。」・丈夫さ「今の力を、確かめてこい。」）、特訓ボードのゴール（done からランダム：「悪くない。その調子だ。」「今の感覚を忘れるな。」「今日はここまでだ。よくやった。」）。ボードの吹き出しは特訓場の背景の上に重ねる（.gssay.over。ボードの位置は動かさない）。特訓の途中（出目を振った後）は出さない。
  - システム表示（特訓チケットを1枚使った・〇〇がN上がった・ライフがN上がった・技を覚えた・ゴールの処理・クリア回数・挑戦できない理由・条件不足・保存・エラー）はゲンシンの発言にしない（顔・名前なし）。特訓のロジック（js/phase7/progression.js）・Phase 6 には入れない。
- カレン：市場担当。表情 normal・smile・guide・troubled・happy・serious（表情名は絵の内容から決めたもの＝要確認）。セリフは index.html の KAREN_TALK。
  - 口調：カレンは「〜わよ」「〜だわ」を使わず、「〜よ／〜ね／〜の／〜てね」を基本とする、明るく自然で親しみやすい女性口調（例：「ソラモね。バランスのいい子よ。」「この子は、まだ市場には来ていないの。」「気になったら、詳しく見てみてね。」）。
  - 市場での使い分け：重要な場面はアップ画像、通常操作中は小さい顔＋短い一言。
    - 入店（初回だけ・S.npcFlags.karenIntro）：会話ウィンドウ＋アップ画像で2行（smile「いらっしゃい。気になる子を見ていってね。」→ guide「気になる子をタップすると、詳しく見られるよ。」）。
    - 2回目以降の来店：会話ウィンドウ＋アップ画像（smile）で1行だけ（説明はくり返さない）。KAREN_AGAIN の3つ（「いらっしゃい。またモンスターを見に来たの？」「新しい子が欲しくなったの？」「今日はどの子を見ていく？」）から毎回1つを選ぶ（karenAgain）。
    - 通常閲覧：画面下の案内欄（#p10kbar：小さい顔のボタン＋一言）。選択を切り替えるたびに一言が変わる（KAREN_PICK：ソラモ・ガウル／未解放／所持金不足／満員）。会話ウィンドウは開かない。顔のボタンは選択中の子について一言（販売中なら「タップして詳しく」）。案内欄は初回のあいさつの後だけ出す。
    - 購入確認：確認シートの上にカレンのアップ画像、シートの中に名前と「この子を迎えるのね？」（押す回数は増えない）。
    - 購入成功：会話ウィンドウ＋アップ画像（happy）のあと街へ。購入と保存は会話の前。
    - 購入の判定・購入ボタンの状態は変えない。
  - カレンの会話中は、市場の操作UI（詳細・矢印・ドット・名札・カレンのボタン）とモンスター（.p10sl）を隠す（.p10mk.talk、karenSay）＝「NPC会話フェーズ」と「商品選択フェーズ」を分ける（2026-09-30）。会話が終わるとカレンはフェードで退場（共通会話の .mmtalk-out）し、少し遅れてモンスターが現れて選べる。
  - 自動テストでは harness がカレンの会話を出さない（window.MM_QA_NO_KAREN）。カレンのテストは open({ karen: true })。
- **施設の NPC イベント（2026-10-04 第二段階。js/npc/npc-events.js）**：各施設の初回訪問はフィナ ↔ NPC の会話（市場・牧場・研究所・闘技場・ファーム。100%・1回。S.npcFlags.first）。再訪は進行状態に合う一言（牧場・研究所・ファームは立ち絵の会話窓の文、市場は小さな窓・確率 0.6、闘技場は押したときの一言）。Chapter を終えてファームへ戻ると帰還イベント（フィナ ↔ ダン。Chapter ごとに文面が違う・大会の結果で1行・次の Chapter があれば「珍しいモンスターを見た者がいるらしい」の噂を1回。m.raise.evSeen）。カレンの旧「2回目以降の一言 KAREN_AGAIN」は MMNPCE が無いときの保険として残す。
- **NPC の表情差分と特訓・アイテム屋の会話（2026-10-04 第二段階・追加アセット）**：場面ごとの表情＝カレン（通常の案内 01・初回／来店 02・所持金不足など 03・購入成立 04）、ダン（ファーム 01・出発の後押し 02・疲れ／解放条件 03・帰還／育成完了 04）、ニック（初回 02・売却 03・成長を認める 04）、エリオット（合体・配合表 03・発見 04）、ヴァルガス（初回 02・ロック中 01／03・ランクを認める 04）、セドリック（E〜D の進行 01・C 以上 03・パラメーター比較／VS 02・優勝 04）、ゲンシン（特訓メニュー 01・チケットなし 03・特訓開始 02「よし。始めるぞ。焦るな。一つずつ確実に進めろ。」・終わり 04「よくやった。今の感覚を、忘れないことだ。」。ゲンシンはダンとは別人）、アイテム屋の店主（名前は出さない。初回＝フィナ ↔ 店主 02、再訪は条件のときだけ＝疲れが高い 03・バッグがほぼ空 01、購入 04「はい、これで大丈夫。気をつけて行ってらっしゃい。」）。特訓の初回＝フィナ ↔ ゲンシン（S.npcFlags.first.train）。フィナの画像は従来の正式素材のまま
- フィナ：ゲーム全体でプレイヤーを案内する主要NPC。
  - Chapterボードには置かない。登場させるのは指定された場所だけで、勝手に増やさない。
  - 現在の登場場所：
    - 名前登録の直後に1度だけのあいさつ（2026-10-03：1行目「はじめまして。私はフィナです！」だけ正式アニメ wave で手を振る）
    - 育成開始（未育成→Chapter 1）の出発ボタン：フィナがプレイヤーへ確認「この子の育成を始める？」→ 選択肢「始める／まだやめておく」（初回だけ前に「途中で街へ戻れない」説明の1行）。選択肢が確認を兼ねるので、2度押しの確認はしない（MMNPC が無い環境だけ従来の2度押し）。
      - 「まだやめておく」（または選ばずに閉じた）：会話を終えるだけで何も始めない。掛け合いも出さない。
      - 「始める」：同じ会話ウィンドウでフィナ→ダンの掛け合い（DAN_TALK.handoff：フィナ「ダン、この子のことお願いしてもいい？」→ダン「ああ。こっちは任せてくれ。」）→ 会話のあと従来の出発処理（MMP8.depart・保存・ボードへ。処理そのものは変えていない）。
    - 育成完了画面
  - セリフは index.html の `FINA_TALK` にまとめている。
- フィナの素材：assets/npc/fina/
  - 上半身（closeup）の表情：normal・smile・happy・surprised・troubled・worried・serious・guide
  - アニメーション：wave・wave_blink（各6コマ）
  - 全身（fullbody）は正式素材が未着で、JPEG素材は使わない。
  - 20枚とも、会話での表示の最大高さ（380px）の2倍、高さ760pxに縮小済み。2026-09-30 に、NPC の画像はすべて（フィナ20枚・ほかのNPCのアップ画像と face）画素を1つも変えずに可逆WebP（.webp、透過あり）へ変換した（NPC全体で約32.9MB→約20.2MB）。ファイル名は拡張子だけ変更。
  - 開始画面の一枚絵の中のフィナを、NPC素材に流用しない。
- 共通会話 `MMNPC`（js/npc/npc.js）：
  - NPC画像・名前・本文を表示する。本文は1文字ずつ表示（`TYPE_MS` = 32ms の1か所で管理）。
  - 表示中にタップすると全文表示、全文表示後のタップで次、最後のタップで終了。▼は全文表示後だけ出す。終了時は約0.22秒のフェードで退場（class mmtalk-out）し、talk() の Promise は DOM が消えてから解決する。途中で閉じる（MMNPC.close()・次の会話を開く）ときはフェードせず即座に消す。テストで会話の終わりを待つときは H.finishTalk（消えるまで待つ）か `.mmtalk:not(.mmtalk-out)`。
  - 選択肢：行に choices（[{ id, label }]）を書くと、全文表示のあと ▼ の代わりに選択肢のボタンを出し、選ぶまで進まない（本文のタップでは進まない。出てから0.35秒の押下と、直前のタップから0.4秒未満の押下＝連打は無視）。選んだ id の続き（MMNPC.talk の opts.branches[id]）を同じ会話ウィンドウで続け、Promise は選んだ id で解決（選ばずに終われば null）。重要な意思決定は「フィナがプレイヤーへ確認 → 選択肢 → フィナが NPC との会話を続ける」で表す。
  - 行ごとに話者（npc）・表情・closeup／fullbody・アニメーション・左右（side：left／right、話者ごとに引き継ぐ）を指定できる。話者を切り替えると名前・立ち絵・表情が切り替わる（NPC同士の会話）。2人の同時表示は今後の拡張。
  - 見た目（正式・2026-10-03 にデザイン素材 02_npc_message_ui を HTML/CSS で再構築）：会話ウィンドウは深いネイビーの半透明・アイボリーの文字・アイボリーの細い罫線（外 1px＋内側にもう1本）・金は左上と右下の小さな角飾り（1px）だけ（大きな金枠は使わない）。名前欄はネイビーにアイボリーの細い罫線・アイボリーの文字。選択肢も同じ。送りマーク ▼ はアイボリー。CSS は index.html の「共通NPC会話」のブロックだけ（旧：深い青・白文字・金枠）。
  - NPC会話は今後この形式に統一する方針。既存NPCのセリフ内容・名前・役割はいきなり変えない。

### 街（コマンド式・正式ホーム画面）

- **2026-10-03 品質向上（街＝ミストリア）**：背景は正式ミストリア（TOWN_BG＝assets/town/mistria_main.webp・TOWN_IMG 768×1360・闘技場の上端 y=26）。**施設は背景の上の押せる札（.tpin・TOWN_CMDS の7番目＝画像の画素の位置）＝市場・牧場・研究所・闘技場（ロック）・聖獣士管理局（ロック。中の背景・NPC・機能は素材・仕様が無いので作らない）・アイテム屋（連れているモンスターがいるとき。townShop→従来の shopScr、戻るは街へ）**。下のバーは1段＝ファーム・プロフィール・セーブ／ロード（押せない建物ラベルと施設コマンドの二重表示はやめた）。札の位置のうち市場・アイテム屋・聖獣士管理局は絵から読んだ【要確認】。フィナの案内・ヴァルガスの一言は半身の立ち絵（.nst）＋ネイビーの会話窓（タップで閉じる）。システム通知もネイビーの窓（顔なし）。施設の背景・立ち絵は街を出したときに先読み（townPreload。2026-10-04 PHASE F：ファームの背景 FARM_BG とダン DAN_FIG も）。下の旧記述（2段のバー・建物ラベル TOWN_LABELS・town_main.jpg）は旧構成の記録。
- 街は自由移動マップではなく、施設を選ぶ拠点画面（背景＋施設コマンド）。連れているモンスターの立ち絵は街の背景の上に出さない（施設・建物ラベル・コマンドを優先。将来必要なら改めて検討）。
- 正式な街画面（2026-09-29、見本のA案を採用。同日、施設コマンドを画面下へ移し、上部の「街」の札・プレイヤー情報を撤去。最終調整で下のコマンドを2段にし、上の左右にお知らせ・設定を追加）：画面の高さ（100dvh）から下のコマンドの分を引いた街の枠（390×844 基準）に街の背景を敷き、建物ラベルを重ねる。デザインは深い濃紺・細い金の二重線・白文字（見出しは Shippori Mincho）。街では上の見出し（h1）を CSS で隠す（main:has(>#app>.map.town) h1）。
  - 背景：index.html の TOWN_BG（assets/town/town_main.jpg、正式・1152×2048）の1か所から参照し、「下寄せ」で敷く（.tbg。画像の下端＝コマンドの上端。市場・牧場・研究所・闘技場・川・橋・街並みを残し、切るのは上＝空から）。倍率は幅いっぱいが基本で、闘技場の上部（画像の y=240）が画面の上端（4px）より上へ切れるときだけ縮める。390×844・360×800・430×932 は上の空が少し切れる（0〜10px）だけで左右もほぼ全部入る。375×667 は左右に約19pxの濃紺と細い金の線が出る（闘技場の上部を残すため）。元データは assets/town/original/、差し替え前の旧背景は assets/town/previous/（README.md）。
  - 上部の「街」の札・プレイヤー情報（顔・名前・ランク・所持金）は置かない（2026-09-29 に撤去）。プレイヤー情報はプロフィール画面（下）にまとめる。上の左に「お知らせ」（ベル）、右に「設定」（歯車）の小さな丸ボタン（46px、濃紺・金枠・金色アイコン。.tround）。
  - お知らせ（newsScr）：正式なお知らせ機能は未決のため、「お知らせは準備中です。」の画面だけ（配信・データ・セーブは無し）。
  - 設定（confScr）：既存の設定は音（BGM・効果音のオン／オフ＝sndToggle、localStorage の mr4a）だけなので、それを置く（新しい設定・セーブ項目は無し）。街と設定の画面では右上の音のボタン（#snd）を CSS で隠す（ボタンと処理は残し、ほかの画面ではこれまでどおり右上に出る）。
  - 背景上の建物ラベル（地図上の案内。押せない）：闘技場・研究所・牧場・市場の4つ（TOWN_LABELS に背景画像上の画素で位置を書く。文字 13.5px、コマンドより控えめ）。ファームは街の建物ではないので付けない。
  - 施設コマンド（実際に押す操作UI）は画面下に固定（nav.tcmds.tbar、position:fixed。街の枠の外）の2段（TOWN_CMDS）。1段目：市場 market()・牧場 farm()・研究所 museum()・闘技場 townArena()（未開放：錠の印）を4等分（アイコン丸50px・施設名16px。390pxで92×84px）。2段目：ファーム hall()（連れているモンスターがいないときは押せない。表示名「ファーム」、行き先は同じ）55%・プロフィール profileScr() 22.5%（アイコンの下に施設名）・セーブ・ロード savescr() 22.5%（アイコンの横に「セーブ／ロード」の2行。button.svb も兼ねる）（2026-09-30。390pxで206×58px・82×58px・82×58px）。40列のグリッドで 10・10・10・10／22・9・9。「街」のコマンドは作らない。高さの低い画面（720px以下）は1段目68px・2段目48px。バーの高さは2段＋余白（通常161px）＋ safe-area。濃紺・上端に金の二重線・影で背景と区切る。街は1画面で固定（2026-09-30）。案内欄・ヴァルガスの一言はバーのすぐ上に重ねて出す。旧：右下に縦に5つ、下部に横一列5つ・6つは廃止。
  - バーの位置に transform を使わない（left:0・right:0・margin:auto）。画面の登場アニメ（#app>* の scr）が transform を上書きし、街へ戻った直後の約0.3秒だけボタンが右へずれて押し間違える不具合があった（64b2faf で修正。tests/town-commands.test.mjs の TW-2・TW-B5 で再発を防ぐ）。
  - プロフィール（profileScr。暫定の器）：「◀ 街にもどる」・見出し「プロフィール／プレイヤーの記録」・札の中に顔（仮の金色の人の形。正式な顔の素材は後日）・プレイヤー名 .p115pn、行（PROFILE_ROWS：所持金・最高到達ランク（S.br。未クリアは「ー」）・育成完了（N回）・大会の勝利（N勝）・獲得トロフィー。育成完了・大会の勝利は、街の下の欄（bprof）から 2026-09-30 に移した）。獲得トロフィーは正式なデータが無いので「準備中」の枠だけ。大会戦績・育成記録・実績などは PROFILE_ROWS に［見出し, 値を返す関数］で足す。セーブには何も足していない。
  - アイコンは統一した金色の線画（TOWN_SVG の #tic-market・#tic-ranch・#tic-lab・#tic-arena・#tic-farm・#tic-profile・#tic-news・#tic-conf）。TOWN_CMDS の3番目に画像ファイルのパスを書けば画像で表示する（townIcon）。
- 街のフィナの台詞（2026-09-30）：名前登録の直後の案内「ようこそ、〇〇さん！ まずは市場でモンスターを選ぼう。」はフィナの台詞（finaMsg：案内欄にフィナの顔と名前の札 span.dnm を付ける。名前の札に b は使わない＝#msg の b はプレイヤー名の HTML 判定用）。街でのプレイヤーへの案内役はフィナ。ロード・購入などのシステム通知は顔・名前なしのまま。
- **「最初からやり直す」（2026-10-03 品質向上）**：2度押しのあとタイトル画面へ（タイトルの曲と画面が一致）。押しただけではセーブを消さない＝タイトルで実際に始めたとき（startGame）に従来の初期化（p10NewSave・save）→ 名前登録（プロローグ）。タイトルの「つづきからにもどる」で取り消せる（P_NEWGAME。セーブしない）。
- セーブ・ロード画面（2026-09-30）：1画面（.svs。スクロールなし）に「◀ 街にもどる」・見出し・案内・3スロット（名前・情報・セーブ／ロード）・オートセーブ・折りたたみ「セーブコードで引っこし・バックアップ」・小さな「最初からやり直す」。機能・onclick・2度押しは従来どおり（slotSave／slotLoad／exp／imp／shareCode／pasteCode／reset）。
- 街の画面の下の欄（スクロールで見ていた部分）は 2026-09-30 に廃止（街は1画面で固定）：セーブ・ロードは下のバーへ、大会・育成完了の回数（bprof）はプロフィールへ、案内欄（#msg）とヴァルガスの一言は知らせるときだけ背景の上へ。連れているモンスターのカード（mcard）は街には出さない（ファーム・ステータスで見られる）。bprof() の定義は残す（どこからも表示しない）。旧い上部の帯（大会優勝○回・所持金）は出さない。
- **研究所（2026-10-04 第二段階 PHASE C。デザイン参考 06）**：主要機能＝図鑑・合体・配合表（特殊復元は主要メニューに置かない。旧「研究・記録・復元」の札も「図鑑・合体・配合表」へ）。入口 museum()＝正式背景・エリオットの半身と会話窓（進行状態に合う一言）・下に3つのボタン（labNav。選んでいる機能は UI_TAB の音）。図鑑 museum('book')＝labBook：濃紺＋金の2列のカード（No.・名前・正式画像 p10Img）＋ノビトンは近日公開（解放条件は従来どおり＝発見 2/3）。詳細 musd＝正式画像・種族・素早さ・説明（SP[i][3]）・6能力のゲージ（999 を最大とした絶対の目盛り・正式色 STAT_COLOR）＋成長適性 A〜E（MMP10M.growthOf）・初期の技（SK）。旧い base64 のプロフィールカード（AS.soL など）は出さない（データは互換のため残す）。合体 museum('fuse')＝labFuse（牧場から移動。selm・fuse・cname・200G は従来どおり。farm('','c') は研究所へ送る）。研究所の合体UIができたので index.html が MMP10M.setFusionAccess(() => true) を登録＝継続用救済は「合体できないとき」だけ（CLAUDE.md の約束どおり）。配合表 museum('table')＝labTable：既存の規則だけ（親1 × 親2 → 子の種族は MMP7.resolveFusionSpecies＝親1の種族【暫定・合体専用種は未登録】、能力 60%、名前、技の継承、ランク、200G）。以下は従来の記録：
- **研究所（2026-10-03 品質向上）**：入口 museum()＝正式背景（assets/lab/lab_main.webp）を画面いっぱいに・エリオットの半身と会話窓・下に機能のカード（図鑑＝museum('book')＝従来の一覧（背景だけ研究所の正式背景）／特殊復元・合体＝研究所の正式な機能だが画面は未実装＝「準備中」のシステム表示だけ。合体の処理は呼ばない）。図鑑の詳細 musd の戻るは図鑑へ。
- 研究所：旧「博物館」。今は従来の図鑑（一覧→詳細）をそのまま引き継いでいる。合体・復元・研究・記録・キーアイテム解析は今後（未実装）。関数名 museum()／musd() は互換のため旧名のまま（内部名・旧名の参照は互換用に残してよい）。
  - 研究所の正式NPCはエリオット（下の NPC の項）。図鑑一覧と図鑑の詳細に、顔・名前つきの一言を出す。
  - 正式仕様（2026-09-30）：牧場＝預ける・受け取る・様子を見る・売る、研究所＝図鑑・特殊復元・合体。合体は牧場から外した（処理は残す）。研究所の合体UIは未実装（今はゲームの画面から合体できない）。
  - 研究所の背景・図鑑の画像（base64 の AS.mkt・AS.soL・AS.soR・AS.gaL・AS.gaR など）は、正式な研究所デザインが届いたときにまとめて処理する（それまで外部化・削除・置換はしない）。
- 闘技場：開放条件は未実装・未決。ロック表示で、押すと「闘技場は、まだ利用できません。」と案内するだけ（案内欄 #msg＝システム表示）。その下に闘技場の管理者ヴァルガスの一言を添える（vgSay。画面遷移・セーブ・バトルはしない）。闘技場の画面・開放条件・報酬・バトル構成・ランクは未決で、勝手に決めない。
- ファーム：連れているモンスターがいるときだけ押せる。育成中は街へ来られない（従来どおり）。

### ファーム（正式デザイン・2026-09-30 → 2026-10-03 冒険準備の拠点。**2026-10-04 PHASE H でベースキャンプに作り直した＝下の画面の記述は旧構成の記録。いまは §3「正式デザインの統合」**）

- **出発準備 prepScr（2026-10-04 第二段階 PHASE C。デザイン参考 07）**：ファームの地図（FARM_BG）の上に、上＝育成中モンスター（正式画像 msv）と名前・種族の札＋次の Chapter の札、中＝バッグ（MMP7.bagCap＝5。S ランク解放で 6）のスロット（空き＝空枠・タップで保管庫のシート／所持＝名前・タップで保管庫へ）＋保管庫ボタン（シート＝保管庫の一覧「バッグへ」）、その下＝次の Chapter のカード（CHAPTER N・名前・正式の俯瞰図 PP_ART＝Chapter 1・2。無い Chapter は絵なし）、下＝「出発する」（p7Depart＝フィナの確認の正式フロー）。解放条件に届かない・最終ルート未登録のときはカードに案内＋「育成を完了して街へ戻る」（pfixFinishNoFinal・2度押し）。処理（moveBagToVault／moveVaultToBag・canDepart）は従来どおり。旧「1.（空き）」のリスト・茶色のカードは廃止。アイテムの正式アイコンは無い（スロットには名前）。

- **2026-10-03（正式参照画像 farm_prep_main.jpg）**：絵を画面の幅いっぱい・上寄せの「地図」（.fmmap。864×1536 の比率のまま）に置き、絵の光る目印の上に4コマンドを立てる（FM_SPOT＝絵に対する %：訓練場＝特訓 hall('s')・屋台＝アイテム shopScr()・牛舎＝ステータス hall('st')・石柱＝技管理 hall('w')。対応はユーザー確認済み）。上の門＝進行ボタン（.fmgate の .fmgo）、下の小道の上＝丸ボタン（街へ戻る／中断）。ダンと育成中の個体は真ん中の草地（ダンの下端はぼかして草に溶かす＝mask-image）、ダンの吹き出しはダンの頭の上（左）。情報パネルは画面の下に固定（.fmbot）。地図の下に余った所は同じ絵を暗くして敷く（.fmblur。CSS の filter は使わない）。絵の「Farm」の札・太陽は絵のまま（上の「ファーム」の札は出さない）。コマンド・遷移先・進行ボタン・ダン・情報パネル・通知・育成放棄は従来のまま（配置だけ。新しい機能なし）。下は 2026-09-30 の記録（配置以外は今も同じ）。

- 育成開始前・Chapter間・育成完了のファームは同じ1画面（index.html の fmScr()。入口は hall('t')、Chapter間の p9FarmScr() は互換のため fmScr() を呼ぶだけ）。Chapter中は従来どおりボードへ（ステータス・技管理だけ開ける）。
- 390×844 などで、背景・ダン・育成中の個体・情報パネル・4コマンド・進行ボタンまでスクロールなしで収める（100dvh。高さ700px以下はキャラクターと余白を縮める）。
- 背景：正式背景 FARM_BG（assets/farm/farm_main.jpg）を全面に（横の位置 58%）。ファームの各画面（dscr・p7Shell）のぼかし背景も FARM_BG。
- 上部：施設名「ファーム」の札だけ（所持金は出さない）。Chapter間だけ右上に「育成放棄」（p8AbandonAsk。2段階確認＋3秒は従来どおり）。
- 中段：ダン（正式アップ画像 DAN_FIG＝closeup/smile。下端は情報パネルの後ろ）が育成中の個体（msv＝正式画像。種族は固定しない）に寄り添う。個体の方を大きく見せる。ダンの吹き出し（.kbub.kdan：顔・名前・一言＝DAN_TALK の bcomm()）。通知 msg は名前・顔なしの .kbub.ksys（ダンの顔を押すとダンの一言に戻る）。
- 情報パネル：左＝名前・種族、中＝大会ランク（MMP8.rankLabel）・特訓チケット、右＝育成状態・Chapter。6能力・所持金は出さない。育成状態はセーブから判断（育成準備中／Chapter N 終了／最終ルート前／育成完了。新しいデータは持たない）。
- 4コマンド（2×2）：特訓 hall('s')・ステータス hall('st')・技管理 hall('w')・アイテム shopScr()。「ボード」コマンドは置かない（Chapterへの進行は進行ボタン）。
- 最下部の進行ボタン（1つ）：育成開始前＝「育成を始める」（出発準備 prepScr へ。出発準備の出発ボタン「CHAPTER 1「はじまりの草原」へ出発（育成開始）」からフィナの確認「始める／まだやめておく」の正式フロー）、Chapter間＝「Chapter N へ進む」（prepScr）、次が最終ルート＝「最終ルートへ進む」（prepScr。未登録なら進行ボタン自体が従来の「育成を完了して街へ戻る」＝pfixFinishNoFinal の2度押し）、育成完了＝「街へ戻る」。
- 丸ボタン：育成開始前＝「街へ戻る」（lobby）、Chapter間＝「中断」（p8Suspend）、育成完了は無し。仮の「ファームメニュー」は置かない。
- 見た目の微調整（2026-09-30）：ダンは控えめ（高さ min(66%,276px)・左へ寄せて少し下げる）、育成中の個体が主役（やや中央・高さ min(70%,320px)。背後にごく淡い光）。個体には呼吸のような軽い待機アニメ（上下4pxほど・3.6秒。prefers-reduced-motion では止める。画像の色は変えない）。ダンの吹き出しは補助の一言（幅 min(50%,190px)・11px・背景は半透明・名前と一言を同じ行の流れに）。色の役割：通常機能（特訓・ステータス・技管理・アイテム・中断・街へ戻る）＝濃紺＋金、メイン進行（育成を始める・Chapter N へ進む・育成を完了して街へ戻る・街へ戻る（育成完了））＝深紅（ワインレッド・赤漆）＋金の二重縁＋上半分の艶、育成放棄＝小さく暗い赤茶（光らせない）。
- 牧場・市場の中身は変えていない。

### フォント

- 本文・UI・数値：Noto Sans JP。主要タイトル・見出し：Shippori Mincho。どちらも Google Fonts で読み込む。

### 開始画面

- 正式画像 assets/title/title_main.jpg（無加工）を、縦横比を保ったまま全体表示する。
- 画像に描かれた「タップしてはじめる」の位置に、透明な開始ボタンを重ねている。
- 開始処理・初回／続きの表示・セーブは従来どおり。

## 4. Phase の経緯と現在地

- 完了済み（記録にある基準コミット）：

| Phase | 内容 | 基準コミット |
|---|---|---|
| 6 | バトル統合・保護対象の確定 | — |
| 7.1 | 練習試合のランクアップ修正・旧v4セーブ救済 | — |
| 8 | 育成進行・セーブv6・20ターン制・リーグ大会 | — |
| 9 | 正式Chapter 1〜4・大会UI・VS画面・Chapter間ファーム | 498544d |
| 10 | 正式モンスターデータ・正式画像・市場UI | 0a17a5a |
| 11 | 正式名称の統一・プレイヤー名 | e70807b |
| 11.5 | 正式フォント・街のプレイヤー名表示 | 15539ba |
| 12 | Chapter間ファーム・特訓場5種の正式背景・正式サイコロ | ac311d2 |

- Phase 13〜15 の区切りと内容：要確認（コード上に phase13・p15 の記述がある）。
- 通し試遊の修正版（3302ae3）で、新規開始から Chapter 1〜4・大会・特訓・中断再開・育成完了・2体目購入・合体までを通しで確認済み。
- Claudeチャットでの作業（コミット番号は、ZIPから作ったローカル履歴のもの。GitHub の履歴とは一致しない）：

| コミット | 内容 |
|---|---|
| dba545f | 最終ルート未登録時の安全な育成完了、育成完了回数（ノビトン入荷条件） |
| dfef7f0 | 継続用購入救済 |
| cdd8255 | 牧場のモンスター売却 |
| 4f417b5 | 開始画面を正式画像に更新 |
| 3a3068d | 市場の左右矢印ループ型カルーセル |
| 6481f48 | 共通NPC表示・共通会話（MMNPC） |
| e3d5465 | フィナの正式素材の登録（背景透明化はユーザー承認済み） |
| 36d0bb4 | フィナの登場（名前登録後・育成開始・育成完了の3か所） |

- 現在：デザイン改修フェーズ。開始画面・市場カルーセル・共通会話・フィナの導入まで完了。正式市場背景は別AIで制作中。
- 全体QA（2026-09-29）：QA_AUDIT.md に監査結果・修正内容・保留事項・今後の推奨をまとめた。
- Stage 3（2026-09-29、安全軽量化・テスト正常化）：古いテスト3件の更新・MS-B6 の安定化・未使用の埋め込み画像10件の削除。QA_AUDIT.md の「14」
- 次の予定：未指示（要確認）。技術面の推奨は QA_AUDIT.md の「10. 今後の修正の推奨」

## 5. 未決事項（推測で埋めない）

- 最終ルートの正式マップ・イベント：未決
- アイテムの品ぞろえ・効果・価格・アイテム売却：未決
- 正式技データ：2026-10-06 にソラモ・ガウル・ノビトン（数値つき）とジオル（名前だけ）を同期。残り＝ジオルの威力・命中・効果、各技の習得の枠（初期・特訓のどれで覚えるか。今は従来の枠に入れた）、補助技の命中（今は 100）、ダウナーミスト（特殊）の計算の能力：未決（状態異常・回復・固有スキルは 2026-10-06・5 にバトルへ組み込んだ＝js/battle/rules.js。ダウナーミストの計算はかしこさ【暫定】）
- ノビトンの正式技データ・入荷イベントの内容・販売価格：未決
- ジオルの入手方法：未決
- レアルート／超レアルートの詳細：未決
- 能力選択イベント（3つから1つ選ぶ）の上昇量・出現率：未決
- 特訓チケット地点の出現条件：未決
- 分岐ルート用 1〜6 サイコロを振る場面：未決（未実装）
- Chapter 1 Pattern A（2026-10-02）：通常マスの専用素材（今は CSS の台座の石の面だけ）・スタートの素材（何も置かない）・分かれ道の道の名前と説明（森の道／大橋の道【暫定】）・森／大橋の報酬の差（lean は空）・森／大橋の背景が各2枚であること（分岐用の新しい背景は無い）・レアモンスターの敵データ・報酬・遭遇演出（未登録）・宝箱 rare 段階の専用素材（今は従来の表示）・Chapter 2 の固定の強敵（s4_4）の扱い【要確認】・演出候補（03_board_effects）・ランク条件ゲート A／B（未決）・背景の表示名・到着の会話の文面・受付でのフィナの一言（FINA_RANK_TALK）・Chapter 2 以降にも到着イベント／新しい受付／マスUIを使うか・俯瞰図（旧10枚の旅の絵のまま）の差し替え：未決
- **追加アセット（2026-10-04）で残したもの**：（2026-10-04 PHASE H：店主の名前はベルナに確定）・アイテム屋の full の下半身の白い小さな欠片（透過の元データ＝要素材修正）・挿絵の無いイベント（remember_dan・wind_cry・旧 8 種）の挿絵
- **PHASE I（2026-10-04 追加素材の局所統合）で残したもの**：フィナの表情8枚（ZIP 未着＝fina_01〜08 の割り当ては届いてから）・未反映デザイン4点（ZIP 未着＝大会ロビー背景の差し替え・ベルナのアイテム補給所・功績一覧・聖獣士証の正式デザイン）・道具／結果演出の透過 PNG 元データ（今は自動の透過化。光の部分が少し薄い）・報酬／解放演出とランクエンブレム（透過素材と E〜S の対応表）
- **PHASE G（2026-10-04 実機試遊の改善）で残したもの**：（2026-10-05 夜：PROLOGUE は正式 BGM・RIVAL_APPEAR は正式 SE を接続。STEP は silent のまま）音の素材（開始の決定音 TITLE_START＝2026-10-04 PHASE I で正式素材を接続・プロローグの曲 PROLOGUE・1マスごとの足音 STEP・ライバルの登場 RIVAL_APPEAR。差し込み口だけ＝silent）、リュウの正式な立ち絵（遭遇の演出は人物なし）、大会会場の中の背景の正式素材（今は参考画像の右側を切り出した 462×1000＝画面いっぱいでは少しやわらかい。人物・会話窓の無い縦長の背景が届けば assets/tournament/lobby/lobby_main.webp を差し替えるだけ）、到着の会話の文面【暫定】、聖獣士登録の背景（今は正式のプロローグ E）
- **第二段階（2026-10-04）で残したもの**：Chapter 2・3・4 のターン数（Chapter 1 は 30 にした）、リュウの相棒モンスターとバトル中の相手の名前・細かい個性差（fight() が相手を作る＝Phase 6）、イベント・チュートリアル・NPC の文面（すべて【暫定】）、2択の出来事を増やすか（今は2つ）
- **Chapter 1〜4 を正式仕様の 30ターンへそろえる方法**（2026-10-03 監査：Chapter 3・4 は安全、Chapter 1 は大橋の道で到達 約80%、Chapter 2 は約0%。マス数・道の長さを変えるか、Chapter 3・4 だけ先に 30 にするか＝ユーザー判断）・Chapter 1・2 のターン数（今は試遊用の 40）・マス数・カメラ・Chapter 1 の分岐・分岐 A／B の報酬差（lean）と表示名：未決（ユーザーの試遊後に判断）。Chapter の解放条件に届かなかったときの演出・フィナの会話・育成終了の流れの今後の変更：未決（今は既存の育成完了につなぐ最小のUI）
- リアル巨大ボード方式（Chapter 1 に 2026-10-01 適用）：背景1枚あたりのマス数（NODES）＝総マス数の最終確定（今は【暫定】橋59／森69。tests/chapter-balance.mjs の比較結果で判断）・出目 4〜6 の疲れ（今は +7）・配置の数（counts）・フィナのリアクションの本文・フィナの会話UI・ダンの出発時の掛け合いの文面（DAN_TALK.handoff「ダン、この子のことお願いしてもいい？／ああ。こっちは任せてくれ。」がダンへ預けて旅立つように読める。最小修正案：フィナ「ダン、この子と一緒に行ってくるね。」→ダン「ああ。気をつけてな。ファームで待ってる。」＝仕様側の判断待ち）・同じ背景を周回で続けて通る見え方（試遊で確認）：未決
- Chapterフィールドの素材待ち：泉・祠（イベント）の自然物、ライバル本人の立ち姿、ソラモ以外の歩行アニメ・ソラモの待機（idle）／走り（run）・横向き（ソラモの後ろ向き歩行は 2026-10-02 に登録済み）、Pattern B／C の config（俯瞰図 pattern2・3 は登録済み）。いずれも config／registerMonsterAnimator で差し替えるだけ（2026-09-30）
- 個性スキル（Battle 開始前の導入で表示する「個性スキル」の正式データ）：未登録・未決。今は「―（未登録）」の枠だけ（p9TraitOf で返す。Battle Engine の処理とは分ける）
- フィナの大会の見立て（FINA_RANK_TALK：余裕／互角／厳しい の文面）とセドリックの大会開始の一言（CEDRIC_TALK.open）：暫定の文面＝要確認
- Chapter 2〜4 のフィールド表示・各Chapterのマップパターン（全12マップ予定）の残り：未決
- 合体仕様の今後の改修（合体時の色の変化の扱いを含む）：未決
- 牧場でのフィナ ↔ ニックの掛け合い（初回入場など）：未実装・未決
- 大会でのフィナ ↔ セドリックの掛け合い（初めての大会など）：未実装・未決。セドリックの表情名（仮名）の最終確認：要確認
- 闘技場の中身（開放条件・報酬・バトル構成・ランク）と、闘技場でのフィナ ↔ ヴァルガスの掛け合い：未決。ヴァルガスの表情名（仮名）の最終確認：要確認
- フィナの全身（fullbody）正式素材：未着
- フィナの表情名・アニメーション名と並び順：素材の内容から決めたもので、最終確認は要確認
- 正式市場背景・装飾：制作中
- 継続用救済と売却の組み合わせ（救済の条件に売却を含めるか）：未決
- 所持上限8体のとき、市場で売却を案内するか：未決
- 大会の各試合の勝利画面に旧表示「賞金○G」が出る件：既知課題（実際の賞金は決着時に1回だけで、データは正常）
- 大会の対戦相手の能力値：暫定値
- 闘技場の開放条件・内容：未決（街ではロック表示だけ）
- 研究所の新機能（合体UI・復元・研究・記録・キーアイテム解析）：未実装（合体を研究所で扱うことは正式。画面・操作は未決）
- 特訓でのフィナ ↔ ゲンシンの掛け合い：未実装・未決。ゲンシンの表情名（仮名）の最終確認：要確認。特訓メニュー・特訓ボードの名札の小さい画像（TABS[2]）に旧名称「修行」の文字が描き込まれている：画像の差し替えは素材待ち
- 研究所でのフィナ ↔ エリオットの掛け合い：未実装・未決。エリオットの表情名（仮名）の最終確認：要確認。研究所の正式背景：制作予定
- 牧場の「名前変更」：未実装（今は市場の購入時に名付けるだけ）
- 全体QAで見つかった仕様判断待ちの項目（旧仕様の文言・合体の確認方法・読めないセーブの通知・大会データが壊れたときの扱いなど）：QA_AUDIT.md の「11」
- プロフィールの項目（獲得トロフィーの正式データ・大会戦績・育成記録・実績）とプレイヤーの顔の正式素材：未決（今は「準備中」の枠と仮の顔）
- お知らせの正式な機能（内容・配信・既読）と、設定に置くほかの項目：未決（今はお知らせ「準備中」、設定は音のオン／オフだけ）
- 未提供の画像・アニメーション（歩行アニメなど）、旧名称が残る背景画像の差し替え：素材待ち
- 音（2026-10-02 夜・第1弾）：各場面の曲と各 SE の最終選定（曲名・解析で選んだ【暫定】。試聴後に registry で差し替え）、TRAINING・CHAPTER_2〜4・SPECIAL_BATTLE の曲（明日の「28 High Quality 16-bit RPG Music」「Fantasy RPG Music Pack Vol.3」で選定）、レア野生・ライバル・上位大会の専用曲（今は fallback で共通）、BATTLE_MISS／BLOCK／BUFF／DEBUFF／HEAL／ROULETTE_TICK／BATTLE_INTRO／SWOOSH の正式 SE（今は合成音）、RPG Essentials Free（WAV・ライセンス記載なし）の扱い、iPhone Safari で OGG（Vorbis）が再生できない版への別形式（m4a）の用意（registry の src を配列にする仕組みは済み）、音量スライダー（API の setVolume だけ・UI は未決）、PGS の「DO NOT REPOST」と公開リポジトリの扱い：未決
- 音（2026-10-03・第2弾）：iPhone 試遊で NG になり silent にした音（BGM：TOWN・FARM・CHAPTER_1。SE：DICE_THROW・STEP・WILD_ALERT・CHAPTER_START・TOURNAMENT_ARRIVAL）の選び直し（追加パック待ち）、新しく選んだ SE（TITLE_START・UI_CONFIRM・STAT_UP・ROULETTE_STOP・DICE_LAND・MATCHUP・BATTLE_START）の試聴、TOURNAMENT_ENTRY／MATCHUP に専用曲を使うか、fight() の導入の合成音（SWOOSH・BATTLE_INTRO）を残すか、PGS 曲の正式リリース前の置き換え：未決
- 音（2026-10-03・第3弾）：街 Tranquil Radiance・旧ファーム Lost River・ライバル戦 Battle of the Skies・大会 B〜S Clash of Arcane Titans・Chapter 開始 Fx 2・野生の遭遇 Fx 3（2秒）・対戦相手の発表 Fx 1（2.6秒）の試聴とループのつなぎ目の確認、Chapter 1 の曲（alkakrab の Epic Quest・Forest of Mysteries は解析で戦闘曲並みに忙しいため見送り。HydroGene の Long Journey などは要試聴）、大会の受付・順位表・結果の曲（今は PGS Event Music 4。HydroGene の Royal Castle が候補）、HydroGene パックを使うか：未決
- 2026-10-03 第4弾（試遊フィードバック）：旧 ZIP mismon_claude_assets_2026-10-03 は**使わない**（ファイル名と絵の対応が誤り。ユーザー指示。そこから取り込んだ素材は無い）。正式は修正版 mismon_claude_assets_CORRECTED_2026-10-03：board_ui_official/ は 2026-10-02 に組み込み済みの正式パックと同一（SHA256SUMS 一致・元画像と assets/fields/ch1a/tiles・effects の24枚を目視照合して一致）、farm_reference は assets/farm/original と同一。board_node_strong_enemy はマニフェストでは「強敵マスの想定」だが、ゲームでは 2026-10-02 のユーザー判断どおりレアモンスターマス（2026-10-03 再確認済み）。**reference_only/current_tiles_contact_sheet.jpeg の中身がファームの参照画像と同じ（マスの一覧ではない）＝正しい一覧の送付待ち（ユーザー）**。届いたら今のマスと照合する。frame_great_success・effect_treasure_open・chapter_rank_gate A／B は未採用のまま。無音にした音の代わりの素材、サイコロの停止の音（DICE_STOP）、遭遇の文面（【暫定】）、ライバルの遭遇の専用素材：未決

- デザイン素材一括（2026-10-03・assets/design_pack_2026-10-03/README.md）：宝箱4種類（chest_01〜04＝別ランク・別用途）の正式の対応表（ユーザーから後日）、合体10コマの正しい組み合わせと順（ZIP の 05 の 01〜07 は UI 参考の絵・06 の7枚が合体装置の絵＝フォルダ分けの食い違い）と研究所の合体UI、野生聖獣のシステム（出現条件・率・報酬）、大会の報酬・解放演出4種とランクエンブレム6種の透過元 PNG とエンブレムの E〜S の割り当て、アイテム屋の NPC の名前とセリフ、ライバル登場の会話（A2）と会話のあとバトルへ自動で進むか（A3。ライバルの人物・会話のデータが無い）、大会の MATCH UP／BATTLE PREVIEW／BATTLE START の画面（2026-10-03 に「画面が多く遅い」で VS へ統合したため、画面を増やすか要確認）、能力UP（6能力の一覧）・アイテム獲得・報酬（通常／上位／特別）の新しい見せ方（アイテムの仕組みが未実装）、初回の街案内（仕様が無い）、Chapter 2 のライバル・レアの見せ方（今回は Chapter 1 の config だけ）：未決
- バトル共通演出（2026-10-03）：#8（クリティカル第二候補）・保留の19枚の用途、白・灰色の素材（#6 の煙・#9・#29）の透過 PNG 元データ（今は自動の除去で一部が薄い・粗い）、能力アップ／ダウン以外（回復・防御・状態異常・属性・拘束など）は今のバトルに対応する出来事が無い＝未実装。能力アップ／ダウンの印（index.html の efBurst）に「undefined」が出ていた既存の不具合は 2026-10-03 に修正（fight() は { lv } だけを渡し、どの能力かは分からない＝能力のアイコンは分かるときだけ出し、▲／▼ はそのまま。fight() は変えていない。tests/battle-fx.test.mjs の BFX-05）

- **2026-10-03 品質向上で残したもの（素材・仕様待ち）**：聖獣士管理局の中（背景・NPC・機能）、特訓チケットの正式アイコン（HUD は文字）、街の札の位置（市場・アイテム屋・聖獣士管理局は絵から読んだ＝要確認）、ワールドマップ（world_map_master。使う場面が無いのでリポジトリに置いていない）、カレン・セドリック・ゲンシンの立ち絵化（今回は顔の吹き出しのまま）、バトル画面の情報の階層（.bt 系 CSS・fight() は Phase 6 のため変えていない＝js/battle/fit.js の大きさの補正だけ）、CHAPTER_CLEAR の SE（到着は無音の指示）、決定音（UI_CONFIRM）の正式素材：未決

- **大会・状態異常・固有スキル（2026-10-06・5）で残したもの**：ダウナーミストの計算の能力（今はかしこさ【暫定】）、ねむりで動けない機会もまひの回数に数えるか（今は数える）、ジオルが耐えたときの追加効果（今は付かない）、ランクアップの演出・セドリックの締めの正式 UI（差し込み口だけ）、ノビトン・ジオルの技の小さな絵、NPC 同士の試合の内容（残りライフ・ダメージ・命中回数）の正式な決め方（今はシード値からの【暫定】）、iPhone 実機での確認（状態異常の文・札・自動で止まるルーレット・1試合目の結果の文）
- **本体修正＋大会UI統合（2026-10-06・4）で残したもの**：大会1の「戻る」「相手確認」（押した先の機能が無い＝未使用）、大会2の 01_header（「公式ランクE大会」の焼き込み＝不使用）、モンスターの専用アイコン（今は正式画像の切り抜き）、正式技の小さな絵（ルーレット・技管理。今は旧技の絵を借りている）、技アニメーションの各カットをバトルの演出に使うこと（緑の背景・説明文の焼き込みがあり、透過した素材が要る）、ガウル・ソラモの固有スキルのバトルへの組み込み、新しいデザインが要る UI（docs/ui-pending.md）、iPhone 実機での確認（大会1〜3の見え方・演出の重さ・バトルのテンポ）。ユーザーの依頼文の「10000Gを受け取った」は今の仕様（1000G）のまま（金額は変えていない＝要確認）
- **共通UI（2026-10-06）で残したもの**：透過できない部品・見本入りの部品の正しい透過素材（元の PNG）、B-03 の丸・四角に入れるアイコン、そのほかの部品の使う場所（ユーザー判断）、GitHub Pages の build が待ち行列のまま止まっている件（2026-10-05 の a4fb03a 以降の公開が反映されていない）
- **正式素材の統合（2026-10-05 夜・2）で残したもの**：Chapter の BGM の途切れの iPhone 実機での確認（未確認）・1000G 受け取りの「チャリン」専用 SE（素材待ち。今は GOLD_GET）・レグナスの爪斬撃 中／大（11・12。市松模様の焼き込み＝透過の正しい素材待ち）・共通UI A群の残り（元 PNG 403・市松模様の焼き込み・光る版の白い縁）・補助技（竜眼ロック・残影ステップ）の命中（表に無い＝100）・ライバル戦でレグナスに必殺技を持たせるか（今は初期の4技）・ライバル戦の HUD の名前（今は「レグナス」）
- **実機試遊の修正（2026-10-05 夜）で残したもの**：硬貨の「チャリン」専用の SE（今は既存の GOLD_GET＝鈴の音）・Chapter の BGM の途切れが iPhone の実機で直ったかの確認・レグナスの正式技10個・入手方法・固有スキルのバトルへの組み込み（Phase 6）・大会ランク選択とミストリアの名札の正式素材（次回）
- **PHASE B（2026-10-05）で残したもの**：〔2026-10-05 夜に解決：正式の相棒レグナス〕竜（リュウの相棒）の正式素材、ランクエンブレム6種のシートの E〜S の対応（見本の絵柄と違う＝使っていない）、アイテム図鑑の「見つけた」記録（今は登録済みのアイテムを全部見せる）、プロローグの段落の読む時間（v6 に合わせて約 12字/秒。実機で読みにくければ要相談）、リュウの立ち絵は市松模様を自動で取り除いた透過（正式の透過素材が届けば差し替えるだけ）
- **追加修正（2026-10-06・2）で残したもの**：薬草の正式アイコン（添付・リポジトリに無い＝名前の文字だけ）、ミストリア専用の名札のデザイン（無い＝正式の施設の名札を流用）、プロローグ BGM の作り直し・約38.7秒版・聖獣士管理局の BGM・アイテム屋の改修・ベースキャンプの「アイテム管理」アイコン（次のフェーズ）、TEST 大会は正式リリースで TEST_MODE を false に
- **正式音源（2026-10-05 夜）で残したもの**：TREASURE_TIER_4（登録のみ・第4段階の宝箱は無い＝未接続）、1マスごとの足音 STEP（silent のまま）、決定音 UI_CONFIRM（silent のまま）、サイコロの SE（2.05秒）は旧ボード・特訓の短いサイコロ演出（約1秒）より長い（1回だけ鳴る）

## 5.5 将来仕様（2026-10-03 記録のみ。**コードには入れない**・金額や率は未決）

- **初回経済**：最初はフィナから支援金 500G（初めの1体は支援制度で迎える）。G は貴重で、主な収入は大会。ボード（Chapter）で得る G は少なめ、アイテムは高め。通常の宝箱から強いアイテムは出ない。大会の再戦（クリア済みランク）に賞金なし。インフレを抑える。破産したときの救済あり。金額はすべて未決（今の初期所持金 300G・初回購入救済・継続用救済は変えない）。
- **合体・長期育成**：育成 → 合体 → 次世代 → 上位大会、のくり返しが軸。育成できる種族は 20〜30。敵専用の伝説・ボスは育成できない。同じ種族どうし＝その種族の強い個体。違う種族どうし＝多くは別の種族、ときどき親の種族、新しい種族の候補が無いこともある。合体の前に候補と確率を見せる（例：??? 55%／ソラモ 30%／ガウル 15%。未発見の種族は ???）。アイテムで確率を動かせる。種族の数は管理する（新しい種族が無限に増えない）。
- **能力・大会の難易度**：1〜2体で上位ランクへ簡単には届かない。目安（必須ではない）：最初は E、慣れて D、何度かの育成・合体で C、C クリア〜B が見えるのは育成・合体 7〜8回ごろ、そのあと B → A → S。印象に残る強いライバルは C から。B／A／S は能力の配分・技・個性スキル・相性・合体で決まる。継承率・敵の能力は未決（例の「8%」などを実装しない。今の能力計算は変えない）。

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
