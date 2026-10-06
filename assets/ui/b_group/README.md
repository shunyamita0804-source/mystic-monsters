# 共通UI A群・B群（正式素材・2026-10-06）

ZIP `mismon_UI_A2／A3／B1／B2／B3／B4_prepared_2026-10-06`（A-13〜A-36・B-01〜B-51 の 75枚）。**A1（A-01〜A-12）と docs（ui_asset_inventory_unique.csv・ui_component_table.csv・README_summary.txt）の ZIP は受け取っていない**（このリポジトリにも無い）＝部品の対応はファイル名と絵で判断した。`__MACOSX`・`.DS_Store` は置いていない。

## 正本と書き出し

- 正本は PNG（ユーザーが保管）。**JPEG・WebP には変えない**：ゲームに置くのも可逆の PNG（RGBA）。CLAUDE.md §6（表示の大きさに合わせて縮小してから入れる）に合わせ、表示のおよそ2倍の大きさへ縮小しただけ（Lanczos・PNG の optimize）。2026-10-06 第1弾で WebP（品質88）にしていた 11点も、元の PNG から作り直して PNG に置き換えた（同じ画素の大きさ）。
- 受け取った PNG は RGB で、市松模様（18px の升目・明るさ 224／254）が画素として焼き込まれている。外周から続く「彩度の低い明るい画素」と、内側に閉じた市松模様の穴（2トーンが混ざった大きな領域＝A-27・A-34・B-07・B-35 で見つかった）だけを透明にし、縁を 8px（元の大きさで）内側へ寄せて 1.5px の半透明の縁取り。部品の内側の色・形は変えていない。濃紺とマゼンタの上で目視し、市松模様・白い縁が残らないものだけを採用。
- 能力バーの色（B-26〜B-31）は、見本のバー全体ではなく**色の付いたフィルの部分だけ**を切り出した（長さは値で CSS が決める）。

## 画面に使っているもの

| 部品 | 元ファイル | sha256（元） | 使う場所 |
|---|---|---|---|
| B-01 | B-01_facility_label_blank.png | 934483c995600c9dd6fc38597c37b64bc2e6f41dc7f0188bec56e19f5bf621b3 | 施設名ラベル：ステータス・牧場・アイテム屋・セーブ／ロード・ベースキャンプの名札（文字は HTML） |
| B-02 | B-02_player_card_frame_blank.png | f60e0061d962ee2a5a98716d729997a44cc87dfe51e337e9d5579fb3299a7778 | プロフィールのプレイヤーの札（丸の中に顔・右に名前） |
| B-03 | B-03_profile_row_blank.png | baf6889d6598f93b29da9440d9f56117bff3b1f68e7f0132f6df372f7cc93c2a | プロフィールの行（丸＝線画のアイコン・帯＝見出しと値・四角＝単位） |
| B-04 | B-04_save_slot_row_blank.png | d09b38fc42f9cb76fc57bc98ea2e138022128dfaf5fddaae53559b9a13d96318 | セーブ／ロードのスロット（右の四角＝そのスロットの連れている子の正式画像） |
| B-06 | B-06_load_button_disabled.png | 7aa50cf0ce9bb375d34076839117a1473e0aab8d61067c6d28d768ebf92b7a79 | セーブ／ロードの「ロード」（空きスロット＝押せない） |
| B-07 | B-07_autosave_panel_blank.png | ca12403a3f33891f38cb545ce7a19b7b4f058b4b92efe02c349b76bcbcfb1ca4 | オートセーブの行（四角＝連れている子・硬貨の下の枠＝所持金） |
| B-08 | B-08_backup_button_blank.png | 8627d4abf8fc429b6a3a93a081c844c2acf701a7816fad887b5e3c4a7634a98c | 「セーブコードで引っこし・バックアップ」の開閉ボタン |
| B-09 | B-09_chapter_ribbon_blank.png | 520a1480a07d0ec71761158530c08901a3dd81436707b6a992f91b7b26079e7e | Chapter のリボン：ベースキャンプの次の Chapter・Chapter 開始の演出の Chapter 名 |
| B-11 | B-11_page_dot_on_glow.png | 5855d881aacbed86e91e510cb3944aebe0e7a23ea992905675b37f186e7318ac | 市場のページドット（いま見ている子） |
| B-12 | B-12_page_dot_off.png | b0aee4bac5af39839f850b03fd757b1fc1620563696f6739a5bef8ce31ed0aa6 | 市場のページドット（ほかの子） |
| B-13 | B-13_facility_three_button_bar_blank.png | d3e4d9c655e69b37d730947251fbe0c8ab672bcc4688463c558b4027baa1bd1b | 研究所の下の3つ（図鑑・合体・配合表） |
| B-14 | B-14_ranch_list_panel_blank.png | a347d10094fc305ca45be13167a3fbc7c3ea902dd36d050488146e32ea808e99 | 牧場の一覧の枠（border-image の外枠だけ。中の罫線は使わない） |
| B-15 | B-15_ranch_four_action_bar_blank.png | 132c573608c996addb9c803a148b46e8671df311b49198ed5324134fd77bbfe4 | 牧場の下の4つ（見る・名前変更・預ける／受け取る・売る＝赤） |
| B-20 | B-20_board_progress_header_blank.png | 868629526b4c97ade1bd832ffb05afdde85c117b86e3d49b052f6d438faa30b9 | 冒険の進行ヘッダー（Chapter の HUD の上段：丸＝Chapter 番号・2本の帯＝Chapter 名と背景名・線＝進み具合（顔が動く）・四角＝メニュー） |
| B-22 | B-22_adventure_menu_popup_blank.png | 3acbe7cec80c6a71046b92912403195fb322754b063b88d0cee37141fda84ec5 | 冒険のメニュー（☰ で開く窓の枠。border-image の外枠と上の金の帯・右上の ✕。中のボタンは HTML） |
| B-23 | B-23_unique_skill_frame_blank.png | 4159e85c6380aabddb34317e7c7d3ba5ee0465af27300d20070bf5b2f7d37994 | ステータスの固有スキルの枠（border-image・点線は round で繰り返し） |
| B-26 | B-26_ability_bar_fill_lightblue.png | b7fa38f64e87d3879e90d2341a84f067afb499ef013bbb12f9ffc45c4ca7c4f5 | ステータスの能力バー「回避」の色（フィルの部分だけを切り出し・長さは値で変わる） |
| B-27 | B-27_ability_bar_fill_darkblue.png | d78ce67f6d48ee9d5931ec67e4b9752478d9c5a6f9a4fd5ba2c948f0edf9b984 | 能力バー「丈夫さ」の色 |
| B-28 | B-28_ability_bar_fill_pink.png | c6972d31959c89b697fff246498fac6f26dd50c135178cd01cb29a131902ff58 | 能力バー「命中」の色 |
| B-29 | B-29_ability_bar_fill_green.png | 20f67dfc5c8d674a950e82bddffeead9e5554f80e51e75bf87412935d21e4896 | 能力バー「かしこさ」の色 |
| B-30 | B-30_ability_bar_fill_red.png | 564a98fa7836ce37c5931f8def2c8533014b032b3dc972fc9a781212769c3577 | 能力バー「ちから」の色 |
| B-31 | B-31_ability_bar_fill_yellow.png | 3a24787ce0a09640d18f78bf96902b8e81b052ee0ec33288124d875ef2b307d2 | 能力バー「ライフ」の色 |
| B-34 | B-34_roulette_slot_blank.png | 80968568373a2705c4136c9ba6babea6646627f3992d6a0ca8bb620f5c4c6ee8 | ベースキャンプの下の5つ（特訓・アイテム・ステータス・技管理・街へ戻る／中断）の四角の枠（border-image。2026-10-06 試遊修正） |
| B-37 | B-37_skill_slot_locked_blank.png | 944584a8e5249a7c5171a1b8fdd49f0e1e7295a791b984db5479d906ffee7a7f | 技の一覧の未習得の技（技の絵の上に重ねる。旧 🔒 の代わり） |
| B-44 | B-44_nav_next_medallion.png | c249c2f00586fcdc97e78e8db7e60ec4163862c2b1c558c785ef734649e8bc2d | 市場の「次のモンスター」 |
| B-45 | B-45_nav_back_medallion.png | ae71094fad86c4325990fac54c586a3af69e57e7680b6fed4eca2fe904f5110f | 市場の「前のモンスター」 |
| B-49 | B-49_button_red_large_ornate.png | 67d368cf01af0830f45f037ffcc833be9f5765bdc3f334b7f121497d167612ae | 赤の正式ボタン：育成をやめる（危険の確認）・市場の「購入する」・大会の「この大会に参加する」・冒険のメニューの「育成放棄」 |
| B-50 | B-50_button_disabled_gray_ornate.png | da2ed227b7300618e967fe05aafe885299ee854062d3fbfe66f955ea8558d18d | 押せないときの正式ボタン（購入する・大会に参加する・危険の確認の無効） |
| B-51 | B-51_parchment_note_frame_blank.png | 47a2a9bff0185c263236caba848067b2ea2f6df10268bc4def61e5e56ca6d8d4 | お知らせの「準備中」のノート |
| A-17 | A-17_popup_frame_parchment_plain.png | f97dfd2e29fda582a94836b3f08050b98378bfa52106c5c6044cd00978af3978 | 新しいゲームの確認の羊皮紙（border-image） |
| A-19 | A-19_button_blue_ornate_gems.png | 1631ec0cb74f031c4b92ac3e8cfd50b49382a7a74e38bf94fc9c35067ec00564 | 青の正式ボタン：危険の確認の「やめない」・新しいゲームの「確認しました」・冒険のメニューのボタン |
| A-20 | A-20_button_red_small_plain.png | 4f7d471f11cd5dba9b8fa272d7498a786c431366ab06a3aabb9594b711fa2201 | セーブ／ロードの「セーブ」 |
| A-22 | A-22_button_blue_large_panel.png | 6c1d22396ab1aa7e4f4f12d049c738d84153d6f272c2d55252a53d5eaf13758b | セーブ／ロードの「ロード」 |

画像は縦横比のまま（背景 100% 100% と同じ aspect-ratio、または border-image＝角は縮尺そのまま）。文字・アイコン・押せる範囲は HTML の従来のボタン（処理・遷移・無効・選択の状態は変えていない）。正式画像の色は CSS で変えていない（filter なし）。

## 使っていないもの（理由）

- **光のにじみが残る（白〜黄色のギザギザの縁）**：A-21・A-32・A-34・A-35・B-05（光る版のボタン・バッジ）。B-11 も縁が少しギザギザ＝表示が 16px と小さいので使った
- **見本の中身が焼き込まれている**：B-16（特訓中のモンスター＝見本）・B-17（倉庫＝薬草のアイコン入り）・B-24（能力バランス＝見本の値）・B-36（技のスロット＝見本の技）・B-38（技のカード＝見本）・B-32（能力バーの空＝見本の長さ）・B-26〜B-31 のバー全体（フィルだけ使用）
- **今の画面に合う場所が無い・置き換えると既存の正式 UI を壊す**：B-19（Chapter 導入の枠＝今の導入は俯瞰図の上の文字だけ。リボン B-09 を使った）・B-21（Chapter の操作欄＝正式の deck 画像がある）・B-10（市場の台座＝背景に描かれている）・B-25・B-39（技管理の縦長パネル＝今の行の数・高さと合わない）・B-33（赤い芯の固有スキル枠＝B-23 を使用）・B-35（技のルーレットの空き枠：技管理の行は class .rw をバトルの技ルーレットと共通で使っていて、Phase 6 の保護（tests/phase7.test.mjs P7-32＝後から足す CSS で .rw に触れない）に当たる＝適用しない）・B-18（百合のアイコン＝該当するアイテムが無い）・A-13・A-15・A-16・A-29・B-40・B-41（タブ・硬貨のボタン・半円の見出し）・A-18・A-23・A-24・A-33（縦長のパネル）・A-25・A-26・A-27・B-47・B-48（細い帯）・A-28・A-31（同じ役のボタンは B-50・B-49 を使用）・A-30・A-36・B-42（丸い枠・バッジ＝牧場の一覧の小さな顔に重ねると画像が小さくなる）・B-46（紫の帯）・A-14（吹き出し付きの羊皮紙）・B-02 以外の札
- A-04・A-05（2026-10-05 の A群 ZIP の JPEG から作った WebP）はそのまま（今回の ZIP に元の PNG＝A1 が無い）

- 2026-10-06（試遊修正）：最終確認の窓の外枠に B-14・上の飾りに B-43、大会ランク選択の見出しに B-01 も使う（同じファイル）
