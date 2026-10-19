# CLAUDE.md へ貼る文（2026-10-19 ミュロル）

親のセッションが CLAUDE.md の §2（ファイル構成の表）と §3（正式仕様）に貼る。worker は CLAUDE.md を変えていない。

## §2 の表に足す行

| ファイル | 役割 |
|---|---|
| js/battle/myurol-moves-data.js、assets/battle/myurol_moves_1019/、tools/myurol1019/（derive_art.py・build_moves.py・derive_art.json）、assets/monsters/2p5d/myurol.webp、assets/battle/idle/idle_myurol.webp、assets/monsters/reactions_1012/myurol/、assets/monsters/walk_1018/myurol/、assets/moves/cards_1014/myurol/、assets/tournament/icons_1015/icon_myurol.webp、assets/tournament/vs_1017/vs_myurol.webp、assets/monsters/compare_1015/myurol.webp、assets/audio/voice/monster_1017/myurol_* | **2026-10-19 ミュロル（登録のみ・未解禁＝入手条件なし）**：js/phase10/monsters.js の `PENDING_SPECIES`（番号 8・SK 80〜89）・固有スキル「しめったはだ」（js/battle/rules.js）・技アニメ 90枚（`MMMYMV_DATA`・No.10 は舞台の座標）・派生 45点（歩行 20 を含む）。QA 試遊（?mmQaTrial=1）の9体目だけ。各 README に原本と派生の sha256。§3「ミュロル（2026-10-19）」 |

## §3 に足す節

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

## 食い違い・要確認（報告）

1. 各フォルダの README（02_reactions・06_icons・04_skill_cards・03_walk）は「承認待ち／採用は未決」、採用状態一覧（2026-10-19）は「検収合格」＝新しい採用状態一覧に従った。
2. 01_art の待機絵は「Candidate」の名前・02_reactions と 04_skill_cards の参照は「正式」の名前。画素はアルファ 1 の見えない画素以外同じ。
3. 固有スキルの「ちから」の下げ：エンジンの効果の区分は attack（ちから・かしこさの両方）だけ＝かしこさ技の計算にも −10% が効く（既存のフルーネ「はなのかおり」と同じ解釈）。ちからだけに効かせるならエンジンの区分を足す判断が要る。
4. 鳴き声の2本はファイルの大きさが同じ（25,389 バイト・約1.03秒・48kHz）だが中身は別（sha256 が違う）。通常／悲しいの対応は仕様マスター §5 の記載に従った（ファイル名の「#3」「#1」は使っていない）。
5. 表情6種は 1254px から 1536px へ拡大した納品（原本の README）・水しぶき・光の粒が端まで届いて切れている＝hRel が大きい。
6. 本体の絵（待機・技アニメ・歩行）の不透明度は 250〜254（わずかに透ける）＝原本のまま（ほかの登録のみの種族と同じ）。
7. No.10 の manifest は「first-pass technical QA, game-device unverified」。舞台 → 画面の写し方（大きさは本体と同じ倍率・横は自分〜相手へ合わせる）は実装の解釈。津波の最高点は HUD の上まで届く（隠れるのは一瞬）。
8. 技アニメの区切りの長さは manifest の比で配った（全体はほかの種族と同じ 1.44〜2.7秒）＝manifest の合計（0.64〜1.99秒）そのものではない。
