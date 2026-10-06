# 大会1：対戦表（正式素材・2026-10-06）

元 ZIP：ミスモン_大会UI_1-2_2026-10-06.zip の `01_大会対戦表/新しいフォルダー/`（RGBA の PNG）。
透明の余白を切り落とし、表示の約2倍へ縮小しただけ（可逆の PNG のまま・色は変えていない）。
文字・名前・勝敗・アイコンは HTML（index.html の `tourBoardScr`）で重ねる。

| ファイル | 元ファイル | 元の sha256 | 使う場所 |
|---|---|---|---|
| title_plate.png | file_1791249577431.png | `ae5257c7249033c5cafe7bc908e8179d3c02c1c703ff8b5f2c47877ffae7cd04` | 上の大きな札（公式ランクX大会） |
| sub_plate.png | file_1791249580428.png | `e85c849792f458b8578f13f318a6efcca11d81c42bb9f22c0a185ad02b4fa55d` | 小さな札（第N試合 / 全M試合） |
| grid6.png | file_1791249584090.png | `4ed130f8f9a2a18a204cdfda4b30d306f7beb9d2d9db486bd0bcb66e902fcd1f` | 対戦表（E・D＝6体） |
| grid8.png | file_1791250496958.png | `a3029f65a016d04756f73189e926d9d2519e3500859fc18fd7a12df68afa1b5b` | 対戦表（C〜S＝8体） |
| legend.png | file_1791249587771.png | `964d0a75ae50e31bfe827c3adbf84c95b6584e3412d7274cc59782369a4869ad` | 凡例（勝ち・負け・未対戦・次の試合） |
| mark_win.png / mark_loss.png / mark_pending.png / mark_next.png | file_1791249587771.png | `964d0a75ae50e31bfe827c3adbf84c95b6584e3412d7274cc59782369a4869ad` | 対戦表のマスの印＝凡例の4つの印を切り出したもの（勝ち・次の試合は円で切り抜き、負け・未対戦は紺の地の明るさで透過） |
| btn_battle.png | file_1791249590458.png | `1343f71fce0f52c68371cd71d41af1be420e4c22ff62b50a1257d5c2a228631d` | 「対戦する」（大会2へ） |
| tag_you.png / tag_next.png | file_1791249595706.png | `92569e77cec52b92969a1b68a9cfeef7263cac9d9eb6ef0c6a52353c82bdaa36` | 「あなた」「次の相手」の札（2つ並びを分けた） |

使っていない：`file_1791249598954.png`（戻る／相手確認）＝大会の途中は街へ戻れない・相手の確認は大会2で行うため、押した先の機能が無い。
モンスターの専用アイコンは未着＝正式画像を丸い枠で切り抜いて表示（index.html の `TOUR_ICON_POS`。専用アイコンが届いたらそこを差し替える）。
