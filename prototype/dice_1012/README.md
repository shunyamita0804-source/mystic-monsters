# サイコロ演出の比較試作（2026-10-12 開発23 B）

**正式採用ではない。** ゲーム本体（index.html）のサイコロは従来の `js/chapter/dice-renderer.js`（MMCHD）と正式 SE `01_dice_large_full.ogg` のまま。このフォルダと `js/chapter/dice-cube.js` は比較のためだけにある（index.html から読み込まない＝tests/dice-cube-1012.test.mjs の DC-03 で監視）。

## 開き方

公開URL（main に入れた場合）：`…/mystic-monsters/prototype/dice_1012/index.html`。ブランチのままならローカルで `index.html` を開く（リポジトリ直下を簡単な HTTP サーバーで配る）。

- 演出：旧（今のゲーム）／新（立体サイコロ）
- 個数：1／2（ダブルダイス。旧は1個だけ）
- SE：B4（新）／旧B2・不採用候補／なし（最初のタップで音が出るようになる＝iPhone の制約）
- 出目：ランダム／1〜6 を固定、連続：1回／10回、動き：通常／視差を減らす

## 新しい見せ方（js/chapter/dice-cube.js の MMDICE3D）

- CSS 3D の立方体（6面＝HTML の目。画像・物理エンジン・新しい依存なし）。動きは Web Animations だけ。
- START の位置から浮く → 前へ弧を描きながら大きく → X・Y 軸で2〜3周回る（面が次々に見える）→ 落ちて小さく弾む → 最後の約0.25秒で強く減速して出目の面で止まる → 止まった瞬間に光と粒・出目の札 → 消える。
- **出目は渡された値だけ**：止まる向き＝出目の向き（BASE）＋360°の倍数。乱数は回る周回の数と向き（見た目）だけ＝再抽選なし・止まったあとは何も変えない（DC-01・DC-02）。
- ダブルダイス：2個を同時に（左右に少しずらして逆回りに）投げる。長さは1個とほぼ同じ（＋0.06秒）。札は「a + b = 合計」。
- 視差を減らす設定：回さない（出目の面のまま現れて光る）。
- 実測（Chromium・375×667／390×844／430×932）：止まるまで 新 0.94秒（2個 0.99秒）・全体 約1.8秒／旧 1.41秒・全体 約2.6秒。
- 参考動画（ユーザー提供の画面録画）は「立体感・空中で回る・止まった瞬間に決まる」の参考だけ。UI・絵・色は写していない。

## SE（se/。OGG と、OGG が鳴らない古い Safari 向けの M4A）

デモの「SE」で切り替える：**B4（新）**＝既定／**旧B2・不採用候補**＝前の比較版（比べるためだけ）／なし。投げた瞬間（dice.throw）に1回鳴らす（2個でも1回）。最初のタップの前は読み込まない。

### dice_magic_b4（今回の候補・2026-10-12 第2便）＝A1 → B4 → C1（控えめ）

iPhone での確認（ユーザー）：立体の回転・2個・10回連続は OK、B2 だけ回転に対して速すぎる、C1 の控えめ版が理想 → 回転の音を B2 から B4（Slow Whoosh）へ。サイコロの動き・速さ・秒数は変えていない（音の側で合わせた）。

| 部分 | 原音 | 使った区間 | 置く時刻（出力） | 音量 | フェード |
|---|---|---|---|---|---|
| A1 投げる | Magical Whoosh | 0.16〜0.62秒 | 0.00秒 | 0 dB | 入り 0.03秒・出 0.12秒 |
| B4 回る | Slow Whoosh | **0.40〜1.20秒**（原音のふくらみの頂点 0.85秒を含む） | 0.12秒（頂点は約0.57秒＝空中） | **−8 dB** | 入り 0.10秒・出 0.25秒（0.67〜0.92秒で消える＝C1 と重ならない） |
| C1 決まる | Magic Spell 02 | 0.14〜0.62秒 | 0.75秒（**音量の山 0.935秒＝止まる時刻 0.93秒**） | **+4 dB**（前の「C1控えめ」と同じ） | 入り 0.012秒・出 0.20秒 |

- 全体 **1.23秒**・-16.4 LUFS・ピーク -4.4 dBFS（最後に軽いリミッター）。B4 の山（100ms の RMS 約 -22 dB）は C1 の山（約 -18 dB）より約4〜5 dB 下。
- B4 はピッチを上げず、原音の区間を切り出して置く時刻とフェードだけで合わせた。
- C1 の始まりを 0.07 → 0.14秒にした（前の版は C1 の山が 1.07秒に来ていた＝止まる時刻より遅い。山を 0.93秒に合わせると立ち上がりが着地より前になるので、ごく小さな前ぶれの部分を省いた）。
- 作り方（原音はリポジトリに置かない＝ZIP の 原音_内部制作資料/）：
  ```
  ffmpeg -i A1.mp3 -i B4.mp3 -i C1.mp3 -filter_complex "
   [0:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0.16:0.62,asetpts=PTS-STARTPTS,afade=t=in:d=0.03,afade=t=out:st=0.34:d=0.12[a];
   [1:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0.40:1.20,asetpts=PTS-STARTPTS,afade=t=in:d=0.10,afade=t=out:st=0.55:d=0.25,volume=-8dB,adelay=120|120[b];
   [2:a]aresample=48000,aformat=channel_layouts=stereo,atrim=0.14:0.62,asetpts=PTS-STARTPTS,afade=t=in:d=0.012,afade=t=out:st=0.28:d=0.20,volume=4dB,adelay=750|750[c];
   [a][b][c]amix=inputs=3:normalize=0:duration=longest,atrim=0:1.30,alimiter=limit=0.89:level=false[o]" -map "[o]" b4.wav
  → OGG Vorbis q5・AAC 128k（M4A）
  ```

### dice_magic_b2_old（旧回転音・不採用候補）

前の比較版の「C1控えめ」（A1＋B2 Spin Whoosh 1 の 2.10〜2.75秒・−7 dB＋C1 の 0.07〜0.55秒・+4 dB・1.38秒）。比べるためだけに残す。前の「標準」（C1 +8 dB）は外した。

### 出典・ライセンス（ユーザーの確認記録 2026-10-12）

| 部分 | 作品 / 作者 | 出典（Pixabay Content License） |
|---|---|---|
| A1 | Magical Whoosh / u_hyed0v3ux9 | https://pixabay.com/sound-effects/film-special-effects-magical-whoosh-148459/ |
| B4 | Slow Whoosh / StudioKolomna | https://pixabay.com/sound-effects/film-special-effects-slow-whoosh-118247/ |
| C1 | Magic Spell 02 / Universfield | https://pixabay.com/sound-effects/film-special-effects-magic-spell-02-250240/ |
| （旧B2） | Spin Whoosh 1 / floraphonic | https://pixabay.com/sound-effects/film-special-effects-spin-whoosh-1-186596/ |

ライセンスの要約 https://pixabay.com/service/license-summary/ ・規約 https://pixabay.com/service/terms/ 。ゲームの演出に組み込む加工・合成は可・クレジットは任意（記録は残す）・**原音そのままの単体の再配布は不可**＝原音の MP3 はリポジトリ・公開サイトに置かない。AUDIO_CREDITS.md にも記録。

## 採用するときの差し替え（まだしない）

1. index.html で `js/chapter/dice-cube.js` を dice-renderer.js の後に読み込み、Chapter の盤（world-board.js・field-view.js）の `MMCHD.play(v, { host, from, land })` を `MMDICE3D.play(…)` に（同じ形）。ダブルダイスは `play([a, b])`。
2. SE は js/audio/audio-registry.js の DICE_THROW の1行を新しいファイルへ（assets/audio/se/ へ移す・AUDIO_CREDITS.md の「比較試作」の行を正式の行へ）。
3. 出目・移動・40ターン・アイテム・セーブ（v6・mr4v6）・バトル・大会は変えない。

## 未確認

- iPhone の Safari の実機：立体の回転・2個・10回連続はユーザーが確認済み（2026-10-12）。B4 版の SE の聞こえ方・鳴り始めは未確認（ユーザーの再確認待ち）。
