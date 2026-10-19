# CLAUDE.md へ貼る文（2026-10-18 PHASE 2.5 カルシェル）

親のセッションが CLAUDE.md の §2（ファイル構成の表）と §3（正式仕様）に貼る。worker は CLAUDE.md を変えていない。

## §2 の表に足す行

| ファイル | 役割 |
|---|---|
| js/battle/kalshell-moves-data.js、assets/battle/kalshell_moves_1018/、tools/kalshell1018/（derive_art.py・build_moves.py・derive_art.json）、assets/monsters/2p5d/kalshell.webp、assets/battle/idle/idle_kalshell.webp、assets/monsters/reactions_1012/kalshell/、assets/monsters/walk_25d/kalshell/、assets/moves/cards_1014/kalshell/、assets/tournament/icons_1015/icon_kalshell.webp、assets/tournament/vs_1017/vs_kalshell.webp、assets/monsters/compare_1015/kalshell.webp、assets/audio/voice/monster_1017/kalshell_* | **2026-10-18 カルシェル（登録のみ・未解禁＝入手条件なし）**：js/phase10/monsters.js の `PENDING_SPECIES`（番号 7・SK 70〜79）・固有スキル「かたい貝殻」（js/battle/rules.js）・技アニメ 84枚（`MMKSMV_DATA`）・派生 41点。QA 試遊（?mmQaTrial=1）の8体目だけ。各 README に原本と派生の sha256。§3「カルシェル（2026-10-18）」 |

## §3 に足す節

### カルシェル（2026-10-18。登録のみ・未解禁＝入手条件なし。正式納品 Kalshell_DevAssets_Part01〜07＝Mismon_Kalshell_OfficialPackage_ForDev_20261018・ユーザー承認済みの仕様マスター）

- **登録**（js/phase10/monsters.js の `PENDING_SPECIES`）：番号 7（予約）・key kalshell・名前 カルシェル・**種族表示名は未確定**（kind null・候補 `kindCandidate`＝「甲殻種【要確認／仮置き】」＝確定表示しない）・体格サイズ 3・初期能力 ライフ 105／ちから 90／かしこさ 70／命中 100／回避 65／丈夫さ 130（合計 560）・成長適性 C/C/D/C/D/A・素早さ 4・`unlocked:false`・`obtain:null`・`profileImage:null`（プロフィール画像は納品に無い＝捏造しない）。byId／byKey／keyOf では引けない＝市場・牧場・図鑑・合体・野生・ライバル・大会・本編の盤・fight() の相手の表に出ない。
- **固有スキル「かたい貝殻」**（UNIQUE_SKILLS.unique_kalshell・implemented:true）：攻撃を受けるたび（威力のある技が当たってダメージがあるとき）20% の確率でそのダメージを 25% 軽減（四捨五入）。被弾ごとに独立の抽選・回数の上限なし。js/battle/rules.js の resolveWith（攻撃側の上乗せ＝ソラモ ×1.25 のあと・ジオル「大地の守り」の判定の前）。表示は小さな札「かたい貝殻 −25%」だけ（発動のシネマティックカメラは出さない）。セーブしない。
- **正式10技**（OFFICIAL_MOVES.kalshell の1か所・SK＝70＋No−1＝js/battle/rules.js の installKalshell が実行時に SK・EFF・SPECIAL_MOVES に足す・index.html の SK の定義の行は変えない）：1 はさむ（ちから 70・95・5%・初期）／2 シェルタックル（ちから 80・85・10%・初期）／3 あわだま（かしこさ 60・95・5%・相手の命中 小DOWN 1T・初期）／4 からにこもる（補助・命中 100・自分の丈夫さ 小UP 2T・初期）／5 クラッシュクロー（ちから 105・85・15%・ちから特訓）／6 アクアバースト（かしこさ 95・90・10%・かしこさ特訓）／7 コーラルスピア（ちから 95・100・10%・命中特訓＝必中ではない）／8 しおのステップ（補助・自分の回避 小UP 2T・回避特訓）／9 シェルブレイカー（ちから 120・80・15%・丈夫さ①・必殺技）／10 タイダルクラッシュ（ちから 125・85・20%・丈夫さ②・必殺技）。習得の表 MMP7.registerMoveset(7)。
- **素材（派生だけ・原本 PNG／MP3 は置かない）**：2.5D 立ち絵（720×680）・バトル待機絵（859×720・右向き）・表情6種（reactions_1012/kalshell・MMRXART の番号 7）・歩行 front／back 各8コマ（384×384・ch1a.js の monsterSprites.kalshell.dirs＝h 1.395・foot 0.144）・技カード10枚（640×360）・対戦表の顔（256×256・灰色の背景 #e1e1e1）・VS の勝負絵（vs_1017・512×512・背景つき＝vs_monsters とは分ける）・比較画面の絵（**代替**＝専用の肩上アップは未納・待機絵の顔を中心に切った正方形 640×640）・鳴き声 normal／sad（OGG＋M4A・gain 1.189／1.109）・技アニメ 84枚（本体 49・効果 35＝空の効果 14枚は作らない）。PREVIEW・GIF・MP4・コンタクトシートは取り込まない。
- **QA 試遊（?mmQaTrial=1）**：8体目のタブ・10技とも「実戦可能」（SK 70〜79）・絵の比較パネル（2.5D・待機・比較・対戦表の顔・VS・表情6）・歩行の確認・鳴き声の試聴・常設バトル QA のステージ。QA の間だけ IMG[7]・MMARENA.IDLE[7] に待機絵を貸す。QA トップ（?qaTop=1）は 8体×10技＝80枠。普段の URL では何も変わらない。
- **未決**：種族表示名（甲殻種は仮置き）・プロフィール画像（全モンスター一括制作の予定）・入手方法・出現場所（ユーザーが後日決める）・専用の肩上アップ（今は代替）・被弾／回避の表情の大きさ（hRel 1.35／1.383＝ほかより大きい・QA で確認）・iPhone 実機は未確認。
- テスト：tests/kalshell-1018.test.mjs（KS-01〜05）。8体・SK 80・鳴き声 16本に合わせて compare-qa-1015・flurene-1015・jiol-moves-1015・phase10・reactions-1012・voice-paid-1017・qa-static-guards・qa-e2e-razuck-1017・tools/public-check.mjs を書き直し。
