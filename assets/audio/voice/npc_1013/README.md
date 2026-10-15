# NPC のボイス（2026-10-13〜14 の試遊素材）＝2026-10-15 に削除

2026-10-15 N04（ユーザー指示）：無料で作った NPC の声は商用のゲームに使えない認識のため、ここにあった音声 54本（OGG 27・M4A 27）を
リポジトリの今の木から削除した（GitHub Pages の配信から外す）。ゲームでも一切鳴らさない（js/audio/audio-manager.js の VOICE_BLOCKED）。

- 新しい声（有料プランで作り直し）の差し替え台帳・削除したファイルの sha256：docs/voice-replacement-ledger.md
- 声の id・台詞・出しどころは js/audio/audio-registry.js の VOICE_REGISTRY（src は空）と js/npc/voice-cues.js のまま
- 旧ファイルは git の履歴（2026-10-13〜14 のコミット）には残る（履歴の書き換えはしていない）
