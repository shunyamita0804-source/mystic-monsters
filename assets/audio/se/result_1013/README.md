# バトルの決着の短い曲（2026-10-13 開発28）

勝ち負けの帯（fight() の WIN!／LOSE）と同時に1回だけ鳴らす短い曲。野生・レア・ライバル・公式大会・修行で共通（index.html の resultJingle・sfxEventOf。そのとき戦闘の BGM は短く止める）。
同じ音の OGG と M4A（iPhone 用）は、そのブラウザで再生できる1つだけを使う（二重に鳴らさない）。登録は js/audio/audio-registry.js の BATTLE_WIN／BATTLE_LOSE。

| 用途 | ファイル | 元 | 長さ | 音量 | sha256 |
|---|---|---|---|---|---|
| 勝ち（BATTLE_WIN・gain 0.5） | win_fanfare12_4s.ogg | red bears「ファンファーレ12」の先頭 4.00秒（ユーザー提供の完成ファイル。ZIP「開発27_claude_final」の音源/WIN_ファンファーレ12_正式4秒.ogg をそのまま） | 4.000秒 | -9.1 LUFS・ピーク -2.4 dBFS | 64ca7502674a4d97247b3a5edeac20654e6725e2daf8ae646245931311035cb9 |
| 〃 | win_fanfare12_4s.m4a | 同（…_正式4秒.m4a をそのまま） | 4.000秒 | -9.5 LUFS・ピーク -2.5 dBFS | f9b9de572eb5c9909b7c1b194f9ae5f09965c4284ba1c2d328c1260c792271f0 |
| 負け・降参（BATTLE_LOSE・gain 0.63） | lose_gameover2_5s.ogg | ポケットサウンド「【効果音】ゲームオーバー＃２」（gameover2.mp3・8.80秒・sha256 7028d3577d00d4e429e22e99a5a8e6504887d12895a054582d8c769271f9d761）の先頭 5.00秒。末尾 60ms だけコサインのフェード（クリック防止。それ以外は加工なし）。48kHz・Vorbis q5 | 5.000秒 | -11.1 LUFS・ピーク -0.3 dBFS | ed6fc5cf0db3bccb22c1bae8a113134cd3655c4c9b13bec466a9c15fb497bd64 |
| 〃 | lose_gameover2_5s.m4a | 同（AAC 128k） | 5.000秒 | -11.1 LUFS・ピーク -0.4 dBFS | 8e503e7df7f09aaac87fdd3e29ca117b3943cbf9cb3427875e73fbd2d47c21e9 |

## 出典・利用条件

- WIN：red bears（https://www.nakano-sound.com/free/fn.html ／ 規約 https://www.nakano-sound.com/free/kiyaku.html）。商用 OK・改変 OK・クレジット任意。音源そのものの二次配布と素材への直接リンクは禁止（このフォルダはゲームに組み込むためのもの＝素材集として配らない）。
- LOSE：ポケットサウンド（https://pocket-se.info/archives/754/ ／ 規約 https://pocket-se.info/rules/ ／ FAQ https://pocket-se.info/faq/）。商用・ゲームでの利用 OK・加工 OK。無料で使う条件＝作品でのクレジット表記またはポケットサウンドへのリンク（**効果音：ポケットサウンド — https://pocket-se.info/** を公開ページ・README・AUDIO_CREDITS.md に記載）。直リンク・音素材そのものの二次配布・転売は禁止。FAQ：ゲームというメインコンテンツがあるフォルダ内の素材は二次配布に当たらない（RPG ツクールの例）＝ゲームに必要な5秒の切り出しだけを置き、元のフル尺（8.8秒）は置かない。
- 元のフル尺・原本はリポジトリに置かない（ユーザーが保管）。
