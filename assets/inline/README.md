# assets/inline/

index.html に base64（data URI）で埋め込まれていた画像 175件を、中身を変えずにファイルへ出したもの（2026-10-19・作業ブランチ claude/inline-images）。

- 作り方：`node tools/inline-images/extract.mjs`（index.html の data URI を、同じ場所でこのフォルダの相対パスの文字列に置き換える＝コード・構造は変えない）。
- 対応表：manifest.json（ファイル・元の MIME・バイト数・sha256・index.html の使う場所）。ファイル名は使う場所（定数名と番号・用途）から付けた。拡張子は中身の形式（元の MIME と同じ）。
- 元に戻す確認：`node tools/inline-images/restore.mjs`＝パスを data URI に戻すと、外部化の前の index.html と1バイトも違わない（先読みの script の1行を除く）。
- 先読み：js/battle/inline-preload.js（`MMINL`）。**起動時には読まない**。バトルの直前の画面で、そのバトルに要る絵だけを読んで Image を持ったままにする（文書の画像の一覧と HTTP キャッシュに入る）。
  - Chapter の盤に入ったとき＝バトル開始の瞬間に出る絵（STOP の絵・背景 BTB[ランク]・登場のポーズ・自分の技の小さな絵）
  - 大会の対戦表・比較画面・遭遇（bBattleGo）＝そのバトルの全部（決着のポーズ・相手の技の小さな絵・旧のバトル画面のときだけ技の4コマと効果）
  - 「対戦開始」を押した時点で読み終わっていなければ、比較画面のまま最大3秒待ってからバトルへ（大会＝p9VsGo を包む・野生など＝js/battle/compare.js の重ね画面）。そろっていれば待たない。
  - 旧カード（lab_card）・旧 NPC（npc_old）は表示しないので読まない。
  - どの画面でどの絵が要るかの実測：`node tools/inline-images/usage.mjs`。表示時間の比較：`QA_CACHE_CONTROL=max-age=600 ORIG=<外部化の前の index.html> node tools/inline-images/battle-timing.mjs`。画面の確認：`node tools/inline-images/screen-check.mjs <出力先>`。
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
