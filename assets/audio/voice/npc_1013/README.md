# NPC のボイス（2026-10-13 開発24・試遊採用）

フィナ8種（こんにちは・やったね・うーん・見て見て・もう・えへへ・うん・なんだろう？）と施設の挨拶4種（ダン＝ベースキャンプ・ニック＝牧場・ベルナ＝アイテム屋・カレン＝市場）。エリオット（研究所）は同梱だけ・既定 OFF。
登録は js/audio/audio-registry.js の VOICE_REGISTRY、出しどころは js/npc/voice-cues.js（CUES）と会話の行の voice。設定の「ボイス」で ON/OFF・音量（セーブとは別の localStorage mmvoice）。
元ファイル・sha256・音量は AUDIO_CREDITS.md の「開発24：NPC のボイス」。音声の生成元の利用規約は未確認（公開前の確認事項）。
