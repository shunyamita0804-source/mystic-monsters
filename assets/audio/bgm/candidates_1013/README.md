# BGM の候補（2026-10-13 開発25 追加便）

ユーザー提供の MP3（Top画面BGM・闘技場BGM・レジェンド戦BGM）を OGG Vorbis q5 に変換しただけ。**試聴用の候補＝どの場面からも鳴らない**（js/audio/audio-registry.js の BGM_CANDIDATES は MMAUDIO に登録しない）。
採用する場所と鳴らし始め（タイトルの無音をやめるか・闘技場の曲を替えるか・三伝説との対戦の曲）はユーザーの判断待ち。採用が決まったら、その場面の BGM_REGISTRY の1行をこのファイルに書き換える。
試聴は prototype/audio_candidates_1013/index.html。元ファイル・sha256・音量は AUDIO_CREDITS.md の「開発25 追加便」。
