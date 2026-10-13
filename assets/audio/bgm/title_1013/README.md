# 開始画面（TITLE）の正式 BGM（2026-10-13・ZIP「missmon_title_7sec_addon_claude」）

ユーザー確認済みの確定音源「Top画面BGM(1).mp3」を、**原曲の 7.000秒地点から最後まで**（冒頭 7秒は流さない）に切り出した正式ファイル。ZIP に同梱された OGG と iPhone 用 M4A を**そのまま**置いた（再エンコード・加工なし。ファイル名だけ ASCII に）。

| ファイル | 元の名前（ZIP） | sha256 | 長さ | 形式 |
|---|---|---|---:|---|
| title_official_from7s.ogg | 音源/TITLE_正式BGM_7秒開始.ogg | 4c2f24c5909da09ea55e9647a0606f2ab094ed8313ddedd87aaf262699e24be4 | 223.949秒 | Ogg Vorbis 44.1kHz ステレオ 約177kbps |
| title_official_from7s.m4a | 音源/TITLE_正式BGM_7秒開始.m4a | 3d8e5dd52cba278a9a189e66522b1b38c672014dbc1cd78a9ba68a4c55d81a53 | 223.948秒 | AAC 44.1kHz ステレオ 約163kbps |

- 元曲との照合：候補 assets/audio/bgm/candidates_1013/title_candidate.ogg（同じ曲の全尺 230.949秒）の 7.000秒地点と、この OGG の先頭 10秒の相関 0.998（8kHz モノの相互相関）。長さの差 7.000秒。
- 音量：-7.0 LUFS（統合）・ピーク +1.3 dBTP（元のまま）→ registry の gain 0.29 で約 -17.8 LUFS（BGM の目安 -18）。
- 末尾：約219秒から減衰し、221.8秒〜223.9秒は無音（-45dB 以下）。**ファイルは加工せず**、registry の loopEnd 220.8・loopXfade 1.2 で頭（0秒＝原曲の 7.000秒）へクロスフェードで戻す（無音を聞かせない）。7秒の開始位置は不変。
- 使い方：js/audio/audio-registry.js の BGM_REGISTRY.TITLE（src は [OGG, M4A]＝そのブラウザで再生できる1つだけを使う。iPhone Safari で Ogg Vorbis が再生できない版は M4A）。
- 権利：音源の商用利用の条件はユーザーが確認済み。作者・出典・ライセンス文は納品物に無い＝記載しない（AUDIO_CREDITS.md）。
