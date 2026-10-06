# 共通UI B群（正式素材の一部・2026-10-06）

ZIP `mismon_UI_A2／A3／B1／B2／B3_prepared_2026-10-06`（75枚・すべて RGB の PNG＝市松模様が画素として焼き込まれている）。

外周から続く「彩度の低い明るい画素」（市松模様と、それに溶けた外側の淡い光）だけを透明にし、縁を 8px（元の大きさで。表示ではおよそ 1px）内側へ寄せ、1.5px の半透明の縁取り。部品の内側は触っていない。暗い背景・マゼンタの上で目視し、市松模様・白い縁が残っていないものだけを採用。縮小して WebP（品質 88）。

## 採用して画面に使っているもの

| ファイル | 元ファイル | sha256（元） | 使う場所 |
|---|---|---|---|
| b02_player_card_frame_blank.webp | B-02_player_card_frame_blank.png | f60e0061d962ee2a5a98716d729997a44cc87dfe51e337e9d5579fb3299a7778 | プロフィールのプレイヤーの札（丸の中に顔・右に名前） |
| b04_save_slot_row_blank.webp | B-04_save_slot_row_blank.png | d09b38fc42f9cb76fc57bc98ea2e138022128dfaf5fddaae53559b9a13d96318 | セーブ／ロードのスロット（右の四角＝そのスロットの連れている子の正式画像） |
| b06_load_button_disabled.webp | B-06_load_button_disabled.png | 7aa50cf0ce9bb375d34076839117a1473e0aab8d61067c6d28d768ebf92b7a79 | セーブ／ロードの「ロード」（空きスロット＝押せない） |
| b13_facility_three_button_bar_blank.webp | B-13_facility_three_button_bar_blank.png | d3e4d9c655e69b37d730947251fbe0c8ab672bcc4688463c558b4027baa1bd1b | 研究所の下の3つ（図鑑・合体・配合表） |
| b14_ranch_list_panel_blank.webp | B-14_ranch_list_panel_blank.png | a347d10094fc305ca45be13167a3fbc7c3ea902dd36d050488146e32ea808e99 | 牧場の一覧の枠（border-image の外枠だけ。中の罫線は使わない） |
| b15_ranch_four_action_bar_blank.webp | B-15_ranch_four_action_bar_blank.png | 132c573608c996addb9c803a148b46e8671df311b49198ed5324134fd77bbfe4 | 牧場の下の4つ（見る・名前変更・預ける／受け取る・売る＝赤） |
| b23_unique_skill_frame_blank.webp | B-23_unique_skill_frame_blank.png | 4159e85c6380aabddb34317e7c7d3ba5ee0465af27300d20070bf5b2f7d37994 | ステータスの固有スキルの枠（border-image・点線は round で繰り返し） |
| b44_nav_next_medallion.webp | B-44_nav_next_medallion.png | c249c2f00586fcdc97e78e8db7e60ec4163862c2b1c558c785ef734649e8bc2d | 市場の「次のモンスター」 |
| b45_nav_back_medallion.webp | B-45_nav_back_medallion.png | ae71094fad86c4325990fac54c586a3af69e57e7680b6fed4eca2fe904f5110f | 市場の「前のモンスター」 |

A 群（assets/ui/a_group/）：a20_button_red_small_plain（A-20・セーブ 4f7d471f11cd5dba9b8fa272d7498a786c431366ab06a3aabb9594b711fa2201）・a22_button_blue_large_panel（A-22・ロード 6c1d22396ab1aa7e4f4f12d049c738d84153d6f272c2d55252a53d5eaf13758b）。

画像は縦横比のまま（背景 100% 100% と同じ aspect-ratio、または border-image）。文字・アイコンは HTML、押せる範囲は従来のボタン（処理・遷移は変えていない）。

## 使っていないもの

- **透過できない（光の白・市松模様が残る）**：A-14（縁の点）・A-19・A-21・A-32・A-34・A-35・B-05・B-08（下の縁の白いギザギザ）・B-11・B-16（点）・B-18・B-20（点）・B-35・B-37（周りの市松模様）・B-42・A-27／B-07（中の丸・四角に市松模様）
- **見本の中身が焼き込まれている（動く値に使えない）**：B-17・B-24・B-26〜B-31（能力バーの長さが固定）・B-32（同）・B-36・B-38
- **きれいに切れるが、使う場所の判断が要る・空いた枠に入れるアイコンが無い**：B-03（プロフィールの行：左の丸・右の四角に入れるアイコンが無い＝空の枠が並ぶので見送り）、A-13・A-15〜A-18・A-22〜A-26・A-28〜A-31・A-33・A-36・B-01・B-09・B-10・B-12・B-13 以外の帯・B-14 の中の罫線・B-19・B-21（Chapter の操作欄は正式の deck 画像）・B-22・B-25・B-33・B-34・B-39〜B-41・B-43・B-46〜B-51
