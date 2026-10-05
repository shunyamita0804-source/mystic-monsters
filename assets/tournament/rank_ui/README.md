# 大会ランク選択の正式素材（2026-10-05 FINAL）

ZIP `tournament_ui_assets_FINAL_2026-10-05`（README：JPEG 由来を背景除去した RGBA PNG・1536×652）。ゲームでは **縮小（1024×435）と WebP 化だけ**。絵・文字・色は変えていない。

- `rank_available_E〜S.webp`＝参加可能（赤＋金・緑の「参加可能」）／`rank_unavailable_E〜S.webp`＝参加不可（青＋鎖＋南京錠・赤の「参加不可」）
- 画像に描かれた「参加者 6名・対戦 5試合（E・D）／8名・7試合（C〜S）」は正式デザインの文字（ゲームの規則 MMP8L.LEAGUE_SIZE と一致）
- 使う場所：index.html の `P9_RANK_IMG`・`p9RankRow`（押せる行＝参加可能の画像の button／押せない行＝参加不可の画像の div）。クリア済・挑戦目標の札と選択中の光は HTML／CSS
- 行の箱は画像の帯の部分（y 84〜326）＝縦横比 1024/242。画像は上下へはみ出して置く

| ファイル | 元ファイル | 元の sha256 |
|---|---|---|
| rank_available_E.webp | 01_rank_available_E.png | 84e17ea6154723ba0dc15f6f444a99ba8054ab1b97780af51602443b66f89823 |
| rank_available_D.webp | 02_rank_available_D.png | be2478a8e7669f06bdebb41bc3fad864116ab56fb23dbc326c2e1e0a9ce42b77 |
| rank_available_C.webp | 03_rank_available_C.png | 0591582a97cae4ebf3b0c7995ebf3932ba3adf3644ebc2a5d9c6c3620708b566 |
| rank_available_B.webp | 04_rank_available_B.png | ddea6a217435a85fe7596f62af5f5ec5310622dc05737fcb44648fbe7e9e81e6 |
| rank_available_A.webp | 05_rank_available_A.png | bd9664aeb57d136e4555a52f2778bdf17d0904735f32638683d181be10daa463 |
| rank_available_S.webp | 06_rank_available_S.png | 99ac391e16594ebe35f8ccbb65183966bb3bdd01fd556d0b44e9859388a845d6 |
| rank_unavailable_E.webp | 07_rank_unavailable_E.png | efebf83c3466b3d0d735633e01b7d045815d891d6660cfb957cf73dea4c588e0 |
| rank_unavailable_D.webp | 08_rank_unavailable_D.png | bb852bb774765e229df9377d7f6fca156165a24c092e32eebffb22e155e49371 |
| rank_unavailable_C.webp | 09_rank_unavailable_C.png | 46b8bd6968f1765bacd55afe284f3cf26238197714fff2ae41234e18eb70f100 |
| rank_unavailable_B.webp | 10_rank_unavailable_B.png | 71493546919d2982f1adf2fc1016db289ecab78eb21a039506f19414fa1a4c0b |
| rank_unavailable_A.webp | 11_rank_unavailable_A.png | 292fdf0e49508ea22613d49f55c219408730df4ada76b43c822b24d94ec3651c |
| rank_unavailable_S.webp | 12_rank_unavailable_S.png | 9b709d0fcae7b9e8c268613f18f54b66ae0a8589ba8ea834a1f01834c6fee260 |
