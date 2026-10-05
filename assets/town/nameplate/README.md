# 街の名札「ミストリア」（正式素材 2026-10-05）

ZIP `tournament_ui_assets_FINAL_2026-10-05` の `13_mistria_nameplate.png`（RGBA）を **縮小（720×357）と WebP 化だけ**。絵・文字は変えていない。

- 使う場所：index.html の `TOWN_NAMEPLATE`・`lobby()` の `.tcity`（押せない・縦横比のまま・幅は min(画面−136px, 168px)）
- 画像の上の透明な余白（24/357）だけ上へずらして置く（施設の札・お知らせ／設定の丸ボタンと重ならない。tests/qa-e2e-ui-1005.test.mjs UI-B1）

元の sha256：ef1da2b253c4f5698d9954d46293bdad380db38c9e386adbfcc367818d0b2a88
