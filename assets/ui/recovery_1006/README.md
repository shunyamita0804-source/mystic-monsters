# 正式UI回収（2026-10-07）— 前回未送付の正式UI素材 ZIP 7つ

受け取った ZIP（Mismon_Claude_UI_Recovery_INDEX／PART1〜4_20261007）の SOURCE_ZIPS の中の元 ZIP から、透過 PNG（RGBA）だけを使った。
各素材は不要な余白を切り（周りに 6px を残す）、表示の約2倍の幅へ縮小した可逆の PNG（JPEG・WebP にしない＝b_group と同じ方針）。
**画像の色は変えていない**。見本の文字（アルト・1000・ソラモ 500G など）が焼き込まれた所だけ、その行の左右の画素から補間して空欄にした（下の「空欄化」）。文字・数値は HTML で重ねる。

| 置き場 | 元 ZIP | 元ファイル | 使う画面 |
|---|---|---|---|
| reg/title_banner.png | seijuushi_ui_png_transparent_20261006_102415 | 01_title_banner_seijuushi_touroku.png | 聖獣士登録の題字（.p11t） |
| reg/label_player_name.png | 同 | 02_label_player_name.png | 「プレイヤー名」（.p11lb） |
| reg/message_welcome.png | 同 | 03_message_plate_welcome.png | 案内文（.p11s。HTML と同じ文） |
| reg/name_field_blank.png | 同 | 04_name_input_field_alto.png（**空欄化**：「アルト」） | 名前の入力欄（.p11field） |
| reg/round_confirm.png | 同 | 05_round_confirm_button.png | 登録カードの赤い印（.p11seal。押せない飾り＝従来どおり） |
| reg/button_touroku.png | 同 | 06_main_button_touroku.png | 「登録する」（.p11go） |
| reg/footer_note.png | 同 | 07_footer_note_text.png | 下の注記（.p11cap2） |
| talk/dialogue_window_blank.png | mismon_talk_ui_assets_20261006_093729 | 01_dialogue_window.png（**空欄化**：見本のセリフ） | 共通会話のセリフ枠（.mmtalk-win・border-image） |
| talk/name_label_blank.png | 同 | 03_name_label_blank.png | 名前ラベル（.mmtalk-name・どの NPC も名前は HTML） |
| （置かない） | 同 | 04_button_yes.png・05_button_no.png | 同じ絵の空欄版 button_blank で「はい／いいえ」を含むすべての選択肢を描く（文字の入った絵は置かない） |
| talk/button_blank.png | 同 | 04_button_yes.png（**空欄化**：「はい」） | 会話の選択肢（.mmtalk-choice・border-image） |
| profile/back_town.png | MysticMonsters_ProfileUI_Assets | 01_back_button_machinimodoru.png | 「街にもどる」（.pfprof .dback） |
| profile/heading.png | 同 | 02_heading_profile.png | 見出し（.pfprof .dtitle） |
| profile/player_card_blank.png | 同 | 03_player_card_alto.png（**空欄化**：「アルト」） | プレイヤーの札（.pfhead） |
| profile/row_gold・row_rank・row_raise・row_wins.png | 同 | 04〜07_info_row_*.png（**空欄化**：値の枠の中の「1000」「−」「0」「0」） | 所持金・最高到達ランク・育成完了・大会の勝利の行（.pfrow） |
| town/nameplate_mistria.png | MysticMonsters_UI_PNG_20261006_095601 | 01_town-name_Mistria.png | 街の名札（.tcity） |
| town/menu_basecamp・menu_profile・menu_saveload.png | 同 | 02〜04_menu_*.png | 街の下のコマンド（.tbar） |
| basecamp/01_tokkun〜05_machie_modoru.png | mismon_basecamp_UI_20261006_100342 | 02_cutout_transparent_png/*_transparent.png | ベースキャンプの下の5つ（中断は正式の絵が無い＝従来の B-34） |
| market/header.png | mismon_market_ui_iphone_20261006_095842 | 01_market_header.png | 市場の上の札（左の四角＝戻る） |
| market/player_info_blank.png | 同 | 02_player_info.png（**空欄化**：「アルト」「1,000 G」） | プレイヤーの札（.p10who） |
| market/plate_center_blank.png | 同 | 03_monster_name_price.png（**空欄化**：名前・硬貨・価格・タップでくわしく） | 中央の名前と価格の札 |
| market/plate_side_blank.png | 同 | 05_name_tag_right.png（**空欄化**：名前・硬貨・価格） | 左右の名前と価格の札（入荷待ちは HTML の札） |
| market/arrow_left・arrow_right.png | 同 | 06_arrow_buttons.png（左右に分割） | 左右の矢印 |
| tournament/header.png | ミスモン_大会UI素材_透過PNG_20261006_102319 | 01_ヘッダー_公式大会_透過.png | 大会ランク選択の見出し（.rcv-ban） |
| tournament/rank_S〜E.png | 同 | 02a〜02f_ランクX_透過.png | ランクの帯（状態の札・参加者と試合数は HTML） |
| tournament/button_join.png | 同 | 03a_主操作ボタン_この大会に参加する_透過.png | 「この大会に参加する」 |
| tournament/button_decline.png | 同 | 03b_副操作ボタン_参加しない_透過.png | 「参加しない」 |
| tournament/confirm_dialog.png | 同 | 04_参加確認ダイアログ_はい_いいえ_透過.png | 参加の確認（はい／いいえの上に透明なボタン） |

使っていないもの（参考・確認用・別案）：00_overview・mockup・design_board・reference_source・_check の合成・basecamp の full_frame（背景つき）と preview、市場の 00_index と木の札（07〜09。紺の札を採用）、市場の 04_name_tag_left（入荷待ちの札。名前の空欄化で縁の飾りが崩れるため HTML の札）、大会の 00_参考・05_目次。

## 元ファイルの sha256

- mismon_talk_ui_assets_20261006_093729 3.zip：`e44b5dd7b6d2e9179a9b3d7174838676729049b7072ce71ceb1ea32fc7250c78`
- seijuushi_ui_png_transparent_20261006_102415(1).zip：`d6c209479cd9bb35a7fc1b512ac7bb9107423704f864693ec05266448c787318`
- MysticMonsters_ProfileUI_Assets.zip：`b870c7d6482d81430afd5b04954ac598d8f5b74aa19611c07e879834b2347b99`
- MysticMonsters_UI_PNG_20261006_095601(1).zip：`e30ea4c751a2c1151d514fa504cccfac39c9b2ee282631dcce7d5e0c6b69757a`
- mismon_basecamp_UI_20261006_100342(1).zip：`6c079d600c380d8c8177faa9f7f85a29d0dc7a4f1ca3922903f03067acdfecc0`
- ミスモン_大会UI素材_透過PNG_20261006_102319 2.zip：`0d72e9d4abb789793e419225cf74530d3ebbdebe0932059ceb83797f8617a22b`
- mismon_market_ui_iphone_20261006_095842(1).zip：`2fbaf829603c44f48c9a763a4f4c79ee508fa4daac0b3bbfb59be2c735248457`
  - mismon_talk_ui_assets/01_transparent_png_cutout/01_dialogue_window.png：`71122116829da622…`
  - mismon_talk_ui_assets/01_transparent_png_cutout/02_name_label_fina.png：`19a1c23c339112e0…`
  - mismon_talk_ui_assets/01_transparent_png_cutout/03_name_label_blank.png：`02523953cda7a963…`
  - mismon_talk_ui_assets/01_transparent_png_cutout/04_button_yes.png：`c57cd3d4adc54849…`
  - mismon_talk_ui_assets/01_transparent_png_cutout/05_button_no.png：`7d51da4a3df9d157…`
  - seijuushi_ui_png_transparent/01_title_banner_seijuushi_touroku.png：`221189fd70224011…`
  - seijuushi_ui_png_transparent/02_label_player_name.png：`d2b7e16528ec9ab3…`
  - seijuushi_ui_png_transparent/03_message_plate_welcome.png：`f5e813b235fcb27c…`
  - seijuushi_ui_png_transparent/04_name_input_field_alto.png：`17afe05aa736580b…`
  - seijuushi_ui_png_transparent/05_round_confirm_button.png：`a89209a1759eccb8…`
  - seijuushi_ui_png_transparent/06_main_button_touroku.png：`488dff732974a010…`
  - seijuushi_ui_png_transparent/07_footer_note_text.png：`0b4c210c74ca69c3…`
  - MysticMonsters_ProfileUI_Assets/01_back_button_machinimodoru.png：`f4f279b103124eca…`
  - MysticMonsters_ProfileUI_Assets/02_heading_profile.png：`dcf750ba69610471…`
  - MysticMonsters_ProfileUI_Assets/03_player_card_alto.png：`41f3f40f705bf984…`
  - MysticMonsters_ProfileUI_Assets/04_info_row_shojikin.png：`328517cb3c149a4d…`
  - MysticMonsters_ProfileUI_Assets/05_info_row_rank.png：`54c0649222f2d4f5…`
  - MysticMonsters_ProfileUI_Assets/06_info_row_ikusei.png：`1eecd0304f70081b…`
  - MysticMonsters_ProfileUI_Assets/07_info_row_taikai.png：`81d777057bba6ecf…`
  - MysticMonsters_UI_PNG/01_town-name_Mistria.png：`16e9007bc1e73961…`
  - MysticMonsters_UI_PNG/02_menu_BaseCamp.png：`241c5047f1a2fc01…`
  - MysticMonsters_UI_PNG/03_menu_Profile.png：`8ebee96b3c1cfba2…`
  - MysticMonsters_UI_PNG/04_menu_SaveLoad.png：`c6d5930be5938951…`
  - mismon_basecamp_UI/02_cutout_transparent_png/01_tokkun_transparent.png：`3b936d9db13acd07…`
  - mismon_basecamp_UI/02_cutout_transparent_png/02_item_transparent.png：`3e96e2ab7cf77fec…`
  - mismon_basecamp_UI/02_cutout_transparent_png/03_status_transparent.png：`57e6e9aab2a3c93d…`
  - mismon_basecamp_UI/02_cutout_transparent_png/04_wazakanri_transparent.png：`b15ed24fa7195521…`
  - mismon_basecamp_UI/02_cutout_transparent_png/05_machie_modoru_transparent.png：`7b3da994535fac10…`
  - ミスモン_大会UI素材_透過PNG/01_ヘッダー_公式大会_透過.png：`3655c88ee9966692…`
  - ミスモン_大会UI素材_透過PNG/02a_ランクS_透過.png：`15598d6d76545919…`
  - ミスモン_大会UI素材_透過PNG/02b_ランクA_透過.png：`a529c67b9899bcde…`
  - ミスモン_大会UI素材_透過PNG/02c_ランクB_透過.png：`463826f226824cd0…`
  - ミスモン_大会UI素材_透過PNG/02d_ランクC_透過.png：`c6359c3dfc9d4572…`
  - ミスモン_大会UI素材_透過PNG/02e_ランクD_透過.png：`e44297e4de79648e…`
  - ミスモン_大会UI素材_透過PNG/02f_ランクE_透過.png：`c04ca2f08b53c3c0…`
  - ミスモン_大会UI素材_透過PNG/03a_主操作ボタン_この大会に参加する_透過.png：`1fa9cc110f06d035…`
  - ミスモン_大会UI素材_透過PNG/03b_副操作ボタン_参加しない_透過.png：`cf2b41516b446580…`
  - ミスモン_大会UI素材_透過PNG/04_参加確認ダイアログ_はい_いいえ_透過.png：`79ccb419abf2928b…`
  - mismon_market_ui_iphone/01_market_header.png：`2566012dcd70df47…`
  - mismon_market_ui_iphone/02_player_info.png：`4f0baaef0d507295…`
  - mismon_market_ui_iphone/03_monster_name_price.png：`1159634aa86018af…`
  - mismon_market_ui_iphone/04_name_tag_left.png：`b90053eda2860f15…`
  - mismon_market_ui_iphone/05_name_tag_right.png：`51ca11ad1fa642c2…`
  - mismon_market_ui_iphone/06_arrow_buttons.png：`adb64f07d985fed3…`
