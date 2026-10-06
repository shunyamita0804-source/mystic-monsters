# 大会2：対戦前比較（正式素材・2026-10-06）

元 ZIP：ミスモン_大会UI_1-2_2026-10-06.zip の `02_対戦前比較/mismon_ui_assets_rgba/`。透明の余白を切り落とし、表示の約2倍へ縮小しただけ（可逆の PNG）。
名前・能力のバー・固有スキル・試合数・モンスターの絵は HTML（index.html の `p9CompareScr`）。

| ファイル | 元ファイル | 元の sha256 | 使う場所 |
|---|---|---|---|
| badge_you.png | 02_badge_you.png | `a637c88cc3c31e8867c910ef8c914a668a3fa69e8f230a9ae5c94b9082a7bcf9` | 「あなた」 |
| badge_opponent.png | 03_badge_opponent.png | `f004db00708599a9592fb2db18f6abcfa04ff633f6f72c2687fa3f9f5a55fe43` | 「対戦相手」 |
| card_left.png | 04_card_frame_left.png | `44811dd5054dc4272bc787cb46daad42ffe74725a95cf201cbf82125752922e0` | 自分のカードの枠（中に正式画像） |
| card_right.png | 05_card_frame_right.png | `72c11b1af88a89d6fd0d790bf6e0543f1ee54532a5c97034c0297959053d303e` | 相手のカードの枠 |
| vs_emblem.png | 06_vs_emblem.png | `7b946bcc27c95d71174cb6a504446bc3d90e85514fd89e03899a783894e35830` | 中央の VS |
| stats_panel.png | 07_stats_panel.png | `787b36b199c83c106bc3ca3a27105bd5da7ebcca3afbf3ae12611dc86b90119e` | 能力比較の枠（見本のバーの上に HTML のバーを重ねる＝画像は変えない） |
| skill_left.png | 08_skill_plate_left.png | `6e5974fbf86aa77a304a1a84a0ca8d704b278968f660e91e01a72d398e3a643c` | 自分の固有スキル |
| skill_right.png | 09_skill_plate_right.png | `3a4cfaa4791e9f12f1b51a3c1e1feda898fcbb8d89740dd71441994c637c1151` | 相手の固有スキル |
| btn_start.png | 10_button_start.png | `b5a3536cc0c4b1e924f87adc9e5969b2f5d2b0895a07f90f5e3664a3ab7b5c6d` | 「対戦開始」（大会3へ） |
| btn_back.png | 11_button_back.png | `3a303bda78f1c01bf72c96999bd8f165c2f1129b777ecfd464897f93ef36e488` | 「対戦表にもどる」 |

使っていない：`01_header.png`＝「公式ランクE大会」の文字が焼き込まれている（E 以外で使えない・README の「上は試合の進行・大会名を重複表示しない」とも合わない）。上の札は大会1の `ui1/sub_plate.png` に「第N試合 / 全M試合」を HTML で出す。
能力の枠の見本のバー：各バーの内側（画像の 912×540 の範囲で 左 x 86〜346・右 x 564〜825、行の上端 y 94・159・225・292・359・426、高さ 14）に HTML のバー（紺の地＋能力の色・999 を最大）を重ねて隠す。
