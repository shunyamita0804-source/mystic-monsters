# NPC のボイス（2026-10-13 開発24・試遊採用）

フィナ8種（こんにちは・やったね・うーん・見て見て・もう・えへへ・うん・なんだろう？）と施設の挨拶4種（ダン＝ベースキャンプ・ニック＝牧場・ベルナ＝アイテム屋・カレン＝市場）。エリオット（研究所）は研究所の再訪のときに ON（2026-10-13 開発25）。
登録は js/audio/audio-registry.js の VOICE_REGISTRY、出しどころは js/npc/voice-cues.js（CUES）と会話の行の voice。設定の「ボイス」で ON/OFF・音量（セーブとは別の localStorage mmvoice）。
元ファイル・sha256・音量は AUDIO_CREDITS.md の「開発24：NPC のボイス」。音声の生成元の利用規約は未確認（公開前の確認事項）。

## 2026-10-13 開発25 追加便（ユーザー承認待ち）

- フィナ「こんにちは」を新しい声（fina_hello_new）へ差し替え（registry の fina_hello の参照先だけ。旧 fina_hello.ogg／m4a はファイルだけ残す）。
- セドリック（cedric_opening）・セルジュ（serge_welcome）・ゲンシン（genshin_ack）・ヴァルガス（vargas_ack）・リュウ3種（ryu_hello・ryu_chuckle・ryu_praise）＝既存の場面に1回ずつ（js/npc/voice-cues.js）。
- レオナ・ラグナス（leona_*・ragnas_*）＝登録のみ（enabled:false。三伝説の再会・対戦の場面が未実装）。アストラッドは新しい声の2本（astrad_greet「待っていた」・astrad_prebattle「全力でこい！」）を登録済み＝登録のみ（enabled:false。2026-10-13 開発26）。旧音源は取り込まない。エリオットは開発24 の elliot_hello_OPTIONAL と同じ元音源＝二重に登録しない。
- 元ファイル・sha256・音量は AUDIO_CREDITS.md の「開発25 追加便」。
