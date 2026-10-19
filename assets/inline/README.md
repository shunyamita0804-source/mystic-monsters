# assets/inline/

index.html に base64（data URI）で埋め込まれていた画像 175件を、中身を変えずにファイルへ出したもの（2026-10-19・作業ブランチ claude/inline-images）。

- 作り方：`node tools/inline-images/extract.mjs`（index.html の data URI を、同じ場所でこのフォルダの相対パスの文字列に置き換える＝コード・構造は変えない）。
- 対応表：manifest.json（ファイル・元の MIME・バイト数・sha256・index.html の使う場所）。ファイル名は使う場所（定数名と番号・用途）から付けた。拡張子は中身の形式（元の MIME と同じ）。
- 元に戻す確認：`node tools/inline-images/restore.mjs`＝パスを data URI に戻すと、外部化の前の index.html と1バイトも違わない（起動後の先読みの2行を除く）。
- 起動後の先読み：index.html の `inlineWarm`（const BTD の次の行）。表示するバトルの絵（STOPART・BTB・SKART・SPX・SFR・SFXL）を空いた時間に読み、Image を持ったままにする。旧カード（lab_card）・旧 NPC（npc_old）は表示しないので読まない。
- fight() 本体などハッシュで照合している範囲には画像が無かった（fight() は SKART・SFR・BTB・SPX・STOPART を名前で参照するだけ）＝ハッシュは不変。

| フォルダ | 件数 | 合計 | 中身 |
|---|---|---|---|
| skill_icon/ | 20 | 352 KB | SKART＝技の小さな絵（ルーレット・技管理） |
| skill_fx/ | 20 | 461 KB | SFXL＝技の効果の層 |
| lab_card/ | 5 | 894 KB | AS.mkt・soL・soR・gaL・gaR＝研究所の図鑑の旧カード（今は表示しない・互換データ） |
| sprite/ | 40 | 597 KB | AS.spr（＝SPX）＝旧 2D のポーズ（待機・歩き・走り・登場・勝ち・負け） |
| skill_frames/ | 76 | 1902 KB | SFR＝技の4コマ |
| npc_old/ | 2 | 81 KB | NPI.m・NPI.f＝旧仕様の NPC（表示しない・互換データ） |
| battle/ | 1 | 44 KB | STOPART＝バトルの STOP ボタンの絵 |
| battle_bg/ | 11 | 1128 KB | BTB＝バトルの背景（ランク E〜S・特訓5種） |
| 合計 | 175 | 5.33 MB | |
