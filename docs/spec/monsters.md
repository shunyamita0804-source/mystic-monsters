# モンスター（原種・能力と色・2.5D の絵・歩行・リアクション・未解禁の種族）

旧 CLAUDE.md §3 から移した節（文はそのまま・節の順も元のまま）。同じ事柄は日付の新しい記述が優先し、各節の「〇〇が優先」「以下は旧記録」などの注記に従う。本文の「§3「〇〇」」は旧 CLAUDE.md の節名＝移設先は docs/README.md の対応表で引く。

## この主題にかかわるほかの記録

- docs/history/spec-2026-10-15_19.md「次回便12項目（2026-10-15）」：フルーネの登録（N11）
- docs/history/spec-2026-10-15_19.md「次便一括（2026-10-19）」：体格サイズ1〜5の倍率（SIZE_K）
- docs/history/spec-2026-10-15_19.md「夜間 GO（2026-10-18〜19）」：歩行 7体（walk_1018）
- docs/history/spec-2026-10-15_19.md「2026-10-18 REV3」：新歩行・体格の正式分類・フルーネ正式10技
- docs/history/spec-2026-10-15_19.md「2026-10-17 統合便 v2」：新歩行 140・鳴き声 14本・ラズック
- docs/history/spec-2026-10-15_19.md「本編試遊の緊急修正 v2（2026-10-18）」：鳴き声の出しどころ
- docs/history/spec-2026-10-13_14.md「開発27：iPhone 試遊の修正 30項目（2026-10-13）」：横の1歩の立ち絵（13）
- docs/spec/battle.md：技・技アニメ・固有スキル
- docs/proposals/battle-branch-1015_1016.md：体格サイズの比較案（ブランチだけ）

---

### モンスター（原種4体）

| species ID | 内部番号 | 名前 | 種族 | ライフ | ちから | かしこさ | 命中 | 回避 | 丈夫さ | 素早さ |
|---|---|---|---|---|---|---|---|---|---|---|
| solamo | 0 | ソラモ | 獣種 | 100 | 100 | 100 | 100 | 100 | 100 | 5 |
| gauru | 1 | ガウル | 鳥種 | 80 | 110 | 110 | 90 | 90 | 60 | 7 |
| nobiton | 2 | ノビトン | 獣種 | 140 | 80 | 120 | 100 | 70 | 110 | 2 |
| jiol | 3 | ジオル | 岩石種 | 120 | 150 | 80 | 70 | 30 | 160 | 1 |

- **2026-10-14 ユーザー承認**：ノビトン・ジオルの初期6能力を上の値に（js/phase10/monsters.js の SPECIES.base の1か所。新しく生まれる個体だけ＝今の個体・旧セーブは変えない。旧値 ノビトン 120/80/80/80/50/100・ジオル 90/120/40/50/30/150）。素早さ・成長適性・技・固有スキルは変えていない。**レグナス（ライバル専用）の種族分類＝牙獣種（がじゅうしゅ）**（旧「竜種（地上竜）」。RIVAL_MONSTERS の kind・style だけ。能力・技名（竜眼ロックなど）・固有スキルは変えていない）

- species ID（solamo・gauru・nobiton・jiol）は表示名と別の安定したIDとして使う。
- 素早さは 1〜10 で、10 が最速。
- 正式画像は assets/monsters/2p5d/ の 2.5D 版を使う（2026-10-11。旧 2D の assets/monsters/*.png はファイルだけ残す）。CSS の filter・hue-rotate などで色を変えない。
- **成長適性（2026-10-02 正式）**：各モンスターの6能力それぞれに A〜E（A が最も伸びやすい）。能力マスの上昇量は **Chapter ごとの表（2026-10-14 ユーザー指示「Chapter 1 は能力マスを増やし1回の上昇を下げる・Chapter 2〜4 はおおよその想定で穏やかに上げる」）＝Chapter 1 A17 B15 C14 D10 E8（2026-10-15 追加B。旧 A20 B18 C16 D12 E9）／Chapter 2 A25 B23 C20 D16 E12／Chapter 3 A29 B27 C23 D18 E14／Chapter 4 A33 B30 C26 D20 E15（js/phase10/monsters.js の GROWTH_GAIN_BY_CH。growthGain(m, key) は m.raise.ch の表）**。旧：A +25・B +21・C +18・D +14・E +11（2026-10-08・全 Chapter 共通＝GROWTH_GAIN は Chapter の分からない所の控えとして残す）（表の場所は js/phase10/monsters.js の1か所。SPECIES[].growth、個体ごとの m.growth（合体個体など将来用）があれば優先）。ソラモ＝C/C/C/C/C/C、ガウル＝ライフ D・ちから B・かしこさ B・命中 C・回避 B・丈夫さ E。ノビトン＝ライフ B・ちから D・かしこさ D・命中 D・回避 E・丈夫さ C、ジオル＝ライフ C・ちから A・かしこさ E・命中 D・回避 E・丈夫さ A（2026-10-02 正式。4原種とも登録済み）。適性はモンスターごとのデータ（SPECIES[].growth）で、種族名の分岐は書かない。将来ステータス画面で表示するときも MMP10M.growthOf を読む。新しい種族で未登録なら【暫定】C（GROWTH_UNREGISTERED）。

### 能力と色

- 6能力：ライフ・ちから・かしこさ・命中・回避・丈夫さ（内部キー li・po・in・hi・ev・de）。素早さは6能力とは別に扱う。
- 能力の色（2026-10-06 正式＝index.html の STAT_COLOR）：ライフ #F2C14E・ちから #D9534F・かしこさ #5CB85C・命中 #F06292・回避 #7FD4E8・丈夫さ #4C7BD9。
- 特訓場の色：ちから＝橙〜赤、かしこさ＝緑、命中＝ピンク、回避＝青、丈夫さ＝紫

### 2.5D の歩行コマ・対戦表の横顔（2026-10-11。基準 12edeaa への差分）

- 納品：ZIP MysticMonsters_WalkSprites_5Monsters_80PNG（5体 × front／back 各8コマ・512×512 の透過 PNG）と 大会対戦表用_2.5D横顔アイコン5体（ローマ字5枚＋同じ絵の日本語名5枚）。**原本は変えない・リポジトリに置かない**＝表示用の派生（縮小と WebP への変換だけ。tools/walk25d/derive.py）
- **歩行**：検収で問題の無かった**ガウルの front・back だけ**を組み込んだ（assets/monsters/walk_25d/gauru/・384×384・js/chapter/configs/ch1a.js の monsterSprites.gauru.dirs＝front（手前へ・止まっている姿は1コマ目）・back（奥へ）・h 1.106・foot 0.049・反転なし）。旧 Chapter 1（field-view）は従来の walk（6コマ）。**ソラモ（耳・体が縦に切れる＋隣のコマの欠片）・レグナス back（1枚に2体の半分）・ノビトン・ジオル（隣のコマの欠片・端で切れる・ジオルは足元に半透明の影）は組み込まず従来どおり**（原本の修正待ち。ファイル名と症状は assets/monsters/walk_25d/README.md）。横向きの絵は無い＝作らない（横の1歩は直前の縦のセット）
- **対戦表の顔**：assets/tournament/faces_25d/face_{soramo,gauru,nobiton,jiol,regnas}.webp（256×256。georu.png＝ジオル＝jiol）。js/battle/arena.js の MMARENA.faceSrc（種族 0〜4 だけ）・index.html の tbIcon（円の中に contain・0.9倍・読めないときは onerror で従来の丸い顔 assets/tournament/faces/＝ファイルは残す）。大会2・VS・バトルは変えていない
- **盤の歩行コマの不具合を2つ直した（PR #4 から）**：①index.html の旧 `.wk`（牧場の歩く子の `animation:wk`＝left を10秒で左右に動かす）が盤の歩行コマ（class wk）にも当たり、歩行の絵が左右に流れていた → 盤の側で `animation:none`　②歩行コマの高さ・足を箱の高さに合わせていたため、横に広い立ち絵（ガウル・ソラモ）では立ち絵より下・大きく出た → 立ち絵が実際に見えている高さ（--sth＝立ち絵 ÷ 箱）に合わせる。あわせて、読み込み前のコマでは静止の立ち絵を消さない（:has）・止まっている姿のコマは読み終わったら出す（front がある種族で止まると消えていた）
- テスト：tests/walk25d-1011.test.mjs（WK-01〜03）・実ブラウザ tests/qa-e2e-walk25d-1011.test.mjs（WK-B1＝2サイズ：16コマ・止まると正面・足と高さと横の位置・奥へ back／手前へ front（宝の行き止まりの D_LLA から戻る）・反転なし・画面の中、WK-B2＝ソラモは従来、FC-B1＝2サイズ×6体／8体の対戦表、FC-B2＝読めないときは従来の顔）。WC-08 をガウルの front・back に書き直し

### 2.5D の正式立ち絵（2026-10-11。いまの正式。基準 c9c0ee3 への差分）

- ユーザー決定（ChatGPT からの正式決定）：モンスター5体（ソラモ・ガウル・ノビトン・ジオル・レグナス）の正式イラストを 2.5D 版にする（ZIP MysticMonsters_2.5D_5Monsters_TransparentPNG_v2_Fixed）。**原本は編集・上書き・トリミングしない**＝表示用の派生（余白の切り詰め＋長辺 720px の透過 WebP）を assets/monsters/2p5d/ に別ファイルで置く
- 切り替えは js/phase10/monsters.js の image の1か所（SPECIES[].image・silhouette・RIVAL_MONSTERS[].image）と ch1a／ch2a の rival_regnas。市場・牧場・ステータス・ベースキャンプ・研究所・出発準備・特訓・育成完了・セーブスロット・大会結果の肖像・購入の知らせ・Chapter の盤上・遭遇の演出がまとめて 2.5D になる
- 変えていない：バトル待機の立ち絵（assets/battle/idle/。arena.js は静止の絵が IMG[sp] のときに重ねる＝IMG が 2.5D でも従来どおり出る）・バトルの技のコマ（旧 2D・Phase 6）・VS の勝負絵・優勝の絵・対戦表の顔アイコン（新しい顔アイコンが届くまで変えない）・歩行のコマ
- テスト：tests/phase10.test.mjs の M3-2（派生の大きさ・透過・README の sha256・旧ファイルが残る）・QA-C1・RP-01・PB-09、実ブラウザの市場・ライバル・技術の各テスト

### 2.5D の歩行 48コマ（2026-10-14。いまの正式＝素材の技術検収済み・iPhone 実機は未確認。基準 2d8cf01 への差分）

- ZIP「次回Claude便_2体初期能力_レグナス牙獣種_2p5d歩行48コマ_20261014」のソラモ・ノビトン・ジオルの front・back 各8コマ（作り直された版）を表示用の派生（384×384 の WebP・tools/walk25d/derive_1014.py・assets/monsters/walk_25d/README.md に sha256）にして、js/chapter/configs/ch1a.js の monsterSprites[種族].dirs（fps 12・h 1.169・foot 0.066・face none）へ。本編の Chapter 1（A／B／C 共通）で 4体とも 2.5D の front・back（ガウルは 2026-10-11 のまま）
- 横の1歩は歩行の絵を使わず、2.5D の立ち絵を進む向きへ（standFace：ソラモ left・ノビトン right・ジオル right）。旧 2D の横向き（nobiton_walk）は本編の盤では使わない。旧 Chapter 1（field-view）は従来の walk のまま
- 読み込むのは盤に出ている種族の16コマだけ（48枚の一括の先読みはしない）。レグナスの歩行・戦闘・大会・Chapter 2 は変えていない
- テスト：WK-01・WC-08（書き直し）・実ブラウザ WK-B2（3体）。MM_BUILD／version.json＝2026-10-14-walk48

### フルーネの技アニメ・歩行（2026-10-15。基準 a1e0776 への差分。ZIP「Mismon_Flurene_Walk_And_Claude_Instructions_20261015」＋「Mismon_Flurene_SkillAnim_Part1of5〜5of5」。**実機の合否はユーザーの確認待ち＝Chapter 2 の設計はユーザーの OK まで着手しない**）

- **技アニメ 77枚**（assets/battle/flurene_moves_1015/f{No}_b{n}.webp・f{No}_fx{n}.webp・tools/flurene1015/build.py・原本 1536×1536 の PNG は置かない＝manifest の sha256 と照合して sha256.txt）：01〜04・06〜08＝本体4・効果4／05＝本体5・効果5／09 生命のしずく＝本体4・効果2（光のつゆ＝B02・降り注ぎ光＝B03）／10 ルートテンペスト＝本体5・効果0。**無い効果は作らない＝QA に「FX追加待ち」**。本体と効果は同じキャンバスの別の層（ジオルと同じ）：本体の上の効果＝同じ切り出し、相手へ当てる効果＝02 種（fly）・着弾（tgt）／06 光線（ray）／07 しばりづる（tgt）。透明な余白を切って 0.4倍・WebP（引き伸ばし・描き直しなし）。データ js/battle/flurene-moves-data.js（MMFLMV_DATA・技の番号は登録の No.＝**SK の番号・性能は持たない**）。js/battle/art25d.js の preview('flurene', No) だけ（通常のバトルの技＝SRC_OF には入れない）
- **歩行 16コマ**（assets/monsters/walk_25d/flurene/・384×384 の WebP・tools/walk25d/derive_flurene.py）：原本は ChatGPT が透過化した**加工済み・実機未検収**。js/chapter/configs/ch1a.js の monsterSprites.flurene.dirs（front・back・12fps・idle 0・h 1.125・foot 0.047＝他の4体と同じ基準で測った値）。本編の盤は番号 → キー（MMP10M.keyOf）でしか引かない＝5 は引けない（未解禁のまま）。気づいた点は README（16枚とも葉の縁に白っぽい細い縁取り・back_05 の右端にまっすぐ切れた所の可能性・back_03／front_01 の端）
- **QA 試遊モードへのつなぎ（既存の js/qa/trial.js に最小限）**：フルーネの10技＝「技アニメのプレビュー」（カードに「本体 N・効果 M」・09／10 は「FX追加待ち」）→ バトル画面でコマだけを再生（判定・ダメージなし・ルーレットと STOP は隠す・QA の個体だけ素早さ 10＝相手は動かない）。プレビューの間だけページの中の IMG[5]・MMARENA.IDLE[5] にフルーネの絵を貸し、終わり・OFF で消す。「歩行を確認」＝front／back・歩く／止める（止めると front の1コマ目＝本編の盤の停止の姿）・コマ送り・背景 濃／淡・立ち絵と重ねる。保存しない（従来の QA の守りのまま）
- 気づいた点（原本のまま・直していない）：効果のうち 05 FX01・06 FX01／FX04・08 FX02／FX03 などは不透明な白〜クリーム色の面（光の加算ではない）＝本体の上に白い塊のように重なって見える
- テスト：tests/flurene-anim-1015.test.mjs（FA-01〜04）・実ブラウザ tests/qa-e2e-flurene-anim-1015.test.mjs（FA-B1 3サイズ＝歩行・FA-B2＝10技）。CQ-04・CQ-B3（プレビュー 20）・FL-02（名前で参照するファイル）・qa-static-guards（読み込むスクリプト）・tools/public-check.mjs（77枚・16コマ・プレビュー）を書き直し。MM_BUILD／version.json＝2026-10-15-flanim

### ミュロル（2026-10-19。登録のみ・未解禁＝入手条件なし。正式納品「ミュロル 開発本体向け 正式素材仕様一式」PART01〜07＝ユーザー承認済みの仕様マスター＋採用状態一覧 2026-10-19）

- **登録**（js/phase10/monsters.js の `PENDING_SPECIES`）：番号 8（予約）・key myurol・名前 ミュロル・**種族表示名は未確定**（kind null・候補 `kindCandidate`＝「水棲種【要確認／仮置き】」＝確定表示しない）・体格サイズ 2・初期能力 ライフ 110／ちから 70／かしこさ 105／命中 100／回避 95／丈夫さ 80（合計 560）・成長適性 C/E/C/B/C/E・素早さ 6・`unlocked:false`・`obtain:null`・`profileImage:null`（プロフィール画像は納品に無い＝全モンスター一括制作の予定）。仕様マスターの「出現想定：Chapter2 野生モンスター」「強さ目安：ラズック前後」は想定だけ＝出現させていない。byId／byKey／keyOf では引けない＝市場・牧場・図鑑・合体・野生・ライバル・大会・本編の盤・fight() の相手の表に出ない。
- **固有スキル「しめったはだ」**（UNIQUE_SKILLS.unique_myurol・implemented:true）：相手の攻撃でダメージを受けた（当たってダメージ 1 以上・倒れていない）たびに 20% の独立の抽選で、攻撃した相手のちから（効果の区分 atk＝攻撃系）を小ダウン（−10%・2ターン）。重ならない・再発動は残りターンの更新（refreshSameEffects）・回数の上限なし・強い下げ（中・大）が既にあれば上書きしない（従来の規則）。js/battle/rules.js の resolveWith（かたい貝殻のあと・大地の守りの前）の dampSkin＝battle-bridge の createEffect／applyEffectToSession を呼ぶだけ（Phase 6 は変えない）。付いた効果は r.effectsApplied に足す＝fight() の「〇〇の攻撃力が下がった！」と能力の札。小さな札「しめったはだ」。**注意：攻撃系（atk）はちから・かしこさの両方の計算に効く**（フルーネ「はなのかおり」と同じ扱い＝ちからだけを下げる区分は今のエンジンに無い）。
- **正式10技**（OFFICIAL_MOVES.myurol の1か所・SK＝80＋No−1＝js/battle/rules.js の installMyurol が実行時に SK・EFF・SPECIAL_MOVES に足す・index.html の SK の定義の行は変えない）：1 しっぽうち（ちから 65・100・5%・初期）／2 みずでっぽう（かしこさ 70・95・5%・初期）／3 タックル（ちから 80・90・10%・初期・旧名「ぷにタックル」は使わない）／4 あわのまもり（補助・命中 100・自分の丈夫さ 小UP 2T・初期）／5 テールスイング（ちから 100・85・15%・ちから特訓）／6 アクアバブル（かしこさ 100・90・10%・かしこさ特訓）／7 バブルスナイプ（かしこさ 90・100・10%・命中特訓＝必中ではない）／8 すいすいステップ（補助・自分の回避 小UP 2T・回避特訓）／9 スパイラルテール（ちから 115・85・15%・丈夫さ①）／10 マリンストリーム（かしこさ 125・85・20%・丈夫さ②・必殺技）。習得の表 MMP7.registerMoveset(8)。補助技（No.4・8）は相手にダメージも効果も無い。
- **技アニメ**（tools/myurol1019/build_moves.py → js/battle/myurol-moves-data.js・assets/battle/myurol_moves_1019/）：manifest.json からコマの絵を読む（2026-10-19 にファイル名が変わった）。原本 150枚（10技×本体・技エフェクト・命中エフェクト）→ 派生 90枚（空の層は作らない・同じ技の同じポーズは1枚）。区切りの長さ＝manifest の duration_ms の比（js/battle/art25d.js の planOff の d.ms・全体の長さはほかの種族と同じ規則）・本体の横の位置＝body_preview_stage_dx_pixels ÷ 820（c.r）・技エフェクト＝本体と同じ切り出し・命中エフェクト＝相手の位置（tgt）。**No.10 マリンストリーム（津波 V2）**＝津波と命中は本体の動きに付けない＝manifest の fx_stage_rect／hit_fx_stage_rect（舞台 1280×720）を art25d の stageMap で画面へ（大きさは本体と同じ倍率・自分の足もと〜相手の中心は画面の自分〜相手へ・津波は本体の後ろ z 6・命中は前 z 8・相手側の攻撃は舞台ごと左右反転）。旧い口先の水流の版は取り込まない。読むのは装備した技のコマだけ（従来の先読み）。
- **素材（派生だけ・原本 PNG／MP3 は置かない）**：2.5D 立ち絵（720×646）・バトル待機絵（928×720・右向き）・表情6種（reactions_1012/myurol・MMRXART の番号 8）・歩行 5方向×4コマ（walk_1018/myurol・ほかの7体と同じ置き方・キャンバス 440・h 1.149・foot 0.045＝js/qa/walk5-1016.js の SPEC1018。本編の盤は keyOf(8)＝null で出ない）・技カード10枚（640×360）・対戦表の顔（256×256・灰色の背景 #858893）・VS の勝負絵（vs_1017・512×512・背景つき）・比較画面の絵（**代替**＝専用の肩上アップは未納・待機絵の顔の周りを切った正方形 640×640）・鳴き声 normal／sad（OGG＋M4A・gain 1.758／1.413）。PREVIEW・GIF・MP4・JPG・一覧シートは取り込まない。
- **原本の選び方**：01_art の2枚（FormalArt_Approved・BattleIdle_Candidate）と 02_reactions の「正式」の2枚は、01_art にだけアルファ 1 の見えない画素（約2.2万）がある以外は画素が同じ＝「正式」の名前の 02_reactions の2枚を使った。各フォルダの README（2026-10-18〜19）は「承認待ち」と書いているが、新しい採用状態一覧（2026-10-19）は検収合格＝新しいほうに従った。
- **QA 試遊（?mmQaTrial=1）**：9体目のタブ・10技とも「実戦可能」（SK 80〜89）・絵の比較パネル（2.5D・待機・比較・対戦表の顔・VS・表情6）・新歩行の確認（8方向）・鳴き声の試聴・常設バトル QA のステージ。QA の間だけ IMG[8]・MMARENA.IDLE[8] に待機絵を貸す。QA トップ（?qaTop=1）は 9体×10技＝90枠。普段の URL では何も変わらない。
- **未決**：種族表示名（水棲種は仮置き）・プロフィール画像（全モンスター一括制作の予定）・入手方法・出現場所（Chapter 2 野生は想定だけ）・専用の肩上アップ（今は代替）・表情の大きさ（被弾・回避・しょんぼりの hRel 1.41〜1.50＝水しぶきが原本の端まで届く）・体格の見え方（サイズ 2 の倍率 0.84・VIS_H 0.906 は測った値の見積もり）・iPhone 実機は未確認。
- テスト：tests/myurol-1019.test.mjs（MY-01〜05）・tests/qa-e2e-myurol-1019.test.mjs（MY-B1〜B3）。9体・SK 90・鳴き声 18本・歩行 160行に合わせて battle-tune-1015・compare-qa-1015・flurene-1015・jiol-moves-1015・kalshell-1018・movecards-1014・phase10・qa-static-guards・reactions-1012・voice-paid-1017・walk-1018・qa-e2e-kalshell-1018・qa-e2e-razuck-1017・qa-e2e-cry-1017・qa-e2e-qatop-1017・tools/public-check.mjs を書き直し。

### カルシェル（2026-10-18。登録のみ・未解禁＝入手条件なし。正式納品 Kalshell_DevAssets_Part01〜07＝Mismon_Kalshell_OfficialPackage_ForDev_20261018・ユーザー承認済みの仕様マスター）

- **登録**（js/phase10/monsters.js の `PENDING_SPECIES`）：番号 7（予約）・key kalshell・名前 カルシェル・**種族表示名は未確定**（kind null・候補 `kindCandidate`＝「甲殻種【要確認／仮置き】」＝確定表示しない）・体格サイズ 3・初期能力 ライフ 105／ちから 90／かしこさ 70／命中 100／回避 65／丈夫さ 130（合計 560）・成長適性 C/C/D/C/D/A・素早さ 4・`unlocked:false`・`obtain:null`・`profileImage:null`（プロフィール画像は納品に無い＝捏造しない）。byId／byKey／keyOf では引けない＝市場・牧場・図鑑・合体・野生・ライバル・大会・本編の盤・fight() の相手の表に出ない。
- **固有スキル「かたい貝殻」**（UNIQUE_SKILLS.unique_kalshell・implemented:true）：攻撃を受けるたび（威力のある技が当たってダメージがあるとき）20% の確率でそのダメージを 25% 軽減（四捨五入）。被弾ごとに独立の抽選・回数の上限なし。js/battle/rules.js の resolveWith（攻撃側の上乗せ＝ソラモ ×1.25 のあと・ジオル「大地の守り」の判定の前）。表示は小さな札「かたい貝殻 −25%」だけ（発動のシネマティックカメラは出さない）。セーブしない。
- **正式10技**（OFFICIAL_MOVES.kalshell の1か所・SK＝70＋No−1＝js/battle/rules.js の installKalshell が実行時に SK・EFF・SPECIAL_MOVES に足す・index.html の SK の定義の行は変えない）：1 はさむ（ちから 70・95・5%・初期）／2 シェルタックル（ちから 80・85・10%・初期）／3 あわだま（かしこさ 60・95・5%・相手の命中 小DOWN 1T・初期）／4 からにこもる（補助・命中 100・自分の丈夫さ 小UP 2T・初期）／5 クラッシュクロー（ちから 105・85・15%・ちから特訓）／6 アクアバースト（かしこさ 95・90・10%・かしこさ特訓）／7 コーラルスピア（ちから 95・100・10%・命中特訓＝必中ではない）／8 しおのステップ（補助・自分の回避 小UP 2T・回避特訓）／9 シェルブレイカー（ちから 120・80・15%・丈夫さ①・必殺技）／10 タイダルクラッシュ（ちから 125・85・20%・丈夫さ②・必殺技）。習得の表 MMP7.registerMoveset(7)。
- **素材（派生だけ・原本 PNG／MP3 は置かない）**：2.5D 立ち絵（720×680）・バトル待機絵（859×720・右向き）・表情6種（reactions_1012/kalshell・MMRXART の番号 7）・歩行 front／back 各8コマ（384×384・ch1a.js の monsterSprites.kalshell.dirs＝h 1.395・foot 0.144）・技カード10枚（640×360）・対戦表の顔（256×256・灰色の背景 #e1e1e1）・VS の勝負絵（vs_1017・512×512・背景つき＝vs_monsters とは分ける）・比較画面の絵（**代替**＝専用の肩上アップは未納・待機絵の顔を中心に切った正方形 640×640）・鳴き声 normal／sad（OGG＋M4A・gain 1.189／1.109）・技アニメ 84枚（本体 49・効果 35＝空の効果 14枚は作らない）。PREVIEW・GIF・MP4・コンタクトシートは取り込まない。
- **QA 試遊（?mmQaTrial=1）**：8体目のタブ・10技とも「実戦可能」（SK 70〜79）・絵の比較パネル（2.5D・待機・比較・対戦表の顔・VS・表情6）・歩行の確認・鳴き声の試聴・常設バトル QA のステージ。QA の間だけ IMG[7]・MMARENA.IDLE[7] に待機絵を貸す。QA トップ（?qaTop=1）は 8体×10技＝80枠。普段の URL では何も変わらない。
- **未決**：種族表示名（甲殻種は仮置き）・プロフィール画像（全モンスター一括制作の予定）・入手方法・出現場所（ユーザーが後日決める）・専用の肩上アップ（今は代替）・被弾／回避の表情の大きさ（hRel 1.35／1.383＝ほかより大きい・QA で確認）・iPhone 実機は未確認。
- テスト：tests/kalshell-1018.test.mjs（KS-01〜05）。8体・SK 80・鳴き声 16本に合わせて compare-qa-1015・flurene-1015・jiol-moves-1015・phase10・reactions-1012・voice-paid-1017・qa-static-guards・qa-e2e-razuck-1017・tools/public-check.mjs を書き直し。

### リアクション 30枚（2026-10-12。いまの正式。基準 9883a7e への差分）

- 納品：ZIP 5つ（ソラモ・ガウル・ノビトン・ジオル・レグナス × 6種・各 1254×1254 の透過 PNG）。番号の意味はユーザー指定＝01 喜ぶ・02 驚く・03 しょんぼり・04 食べる・05 被弾・06 回避。**原本は描き直さない・色を変えない・リポジトリに置かない**＝余白を切って縮小した透過 WebP（assets/monsters/reactions_1012/{種族}/0N_{種類}.webp・合計 約3.6MB）。縮小の倍率＝バトルの待機立ち絵と体の面積がそろう倍率（tools/reactions1012/build.py。README に sha256）。30枚とも右向き（待機立ち絵と同じ）
- **被弾・回避（バトル）**：js/battle/arena.js の react。攻撃を受けた側のダメージの数字（pop の span.dmg。MISS を含む）が出た瞬間に、待機立ち絵を被弾 0.56秒・回避 0.52秒（視差を減らす設定 0.42秒）だけ差し替えて戻す。当たった／かわした は act() が呼ぶ MMBattle.resolveAction の結果を読むだけ（呼ぶだけ・結果は変えない・威力のある技だけ）。置き方・反転は待機立ち絵と同じ（高さ＝待機立ち絵 × hRel）。差し替えの間は待機立ち絵を隠す（2枚が同時に見えない）・技のコマが出ているモンスター（.mma-on でない）には出さない・先に読んでデコード済みの絵だけ使う（読めない・404＝待機立ち絵のまま）・自分の番のミス（ルーレットの MISS・まひ／ねむりで動けない）では出ない。fight()・Phase 6・バトルの計算・行動順は変えていない
- **01〜04（イベント・育成・冒険用）**：どの出来事に出すかは未決＝確認ページ prototype/reactions_1012/index.html だけ（30枚・相手側の反転・背景の色・「被弾／回避を試す」）。本編へつなぐときは MMRXART.info(種族, 'joy'|'surprise'|'sad'|'eat')
- テスト：tests/reactions-1012.test.mjs（RA-01〜03）・実ブラウザ tests/qa-e2e-reactions-1012.test.mjs（RX-B1＝3サイズの公式ランク戦・RX-B2＝相手側の反転と回避（テストの中だけ命中の乱数を外れ側へ）・RX-B3＝404・RX-B4＝確認ページ 3サイズ）
