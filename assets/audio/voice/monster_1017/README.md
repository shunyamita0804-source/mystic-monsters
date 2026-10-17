# モンスターの鳴き声 14本（2026-10-17・7体×正式／悲しみ）

- 原本＝ZIP Mismon_MonsterVoice_7x2_20261017_Claude の audio/（MP3・48kHz・2ch・192kbps・1.032秒）。原本はリポジトリに置かない（sha256 は下の表・受領一覧と 14/14 一致）
- 派生＝OGG Vorbis q5（ゲーム）＋M4A AAC 128k（OGG を再生できない iPhone の古い版）。音の中身は変えない（無音の切り詰め・ノーマライズなし）＝音量は再生の gain だけ（tools/monvoice1017/derive.py）
- gain＝聴感の音量 normal −15 LUFS・sad −18 LUFS を目安（sad の持ち上げは +3dB まで）・ピーク −1 dBFS まで。iPhone の実機の聴取は未確認

| id | 種族 | 原本 | 原本 sha256 | I (LUFS) | peak (dBFS) | gain | ogg sha256 | m4a sha256 |
|---|---|---|---|---|---|---|---|---|
| cry_solamo_normal | ソラモ | voice_soramo_normal.mp3 | d8f8676e262805d750a4afbb746190e3763bd27b22c351b25b557482e0981324 | -14.2 | -0.3 | 0.912 | 78d05c0c4e28b57f… | 76dab1c29f667c35… |
| cry_solamo_sad | ソラモ | voice_soramo_sad.mp3 | b4b2381ad39017dc1a79b2fe9b5c1dbb2a6bda133ce898991bb804e413979e59 | -22.5 | -11.9 | 1.413 | 9f0bd1b1a273c9ae… | e78924351a474c86… |
| cry_gauru_normal | ガウル | voice_gauru_normal.mp3 | 56ff69b85b1c917080ff12c3a22233485f87648754db098b3a42ce59c984e8e6 | -7.0 | 0.9 | 0.398 | 9c0b3d00904fdc3f… | c419df26712a7b35… |
| cry_gauru_sad | ガウル | voice_gauru_sad.mp3 | 56c7eb07eaedae2df33a21fa35f6713b9da9e211eb31dd3caf36f1950cb23477 | -14.4 | -1.2 | 0.661 | 7eb2ef0ff2e08bd1… | 30898871651034fe… |
| cry_nobiton_normal | ノビトン | voice_nobiton_normal.mp3 | 54396d98c15d0615175299d8c18dafe99c4c372f0b3286de70a59ee5a326aa2c | -20.1 | -11.7 | 1.799 | 18076bb09595c5f9… | 9336bfbce7e9665f… |
| cry_nobiton_sad | ノビトン | voice_nobiton_sad.mp3 | 11a291cf67bccfbe2264233c960d30ebca21926ada17541c7a07e082f3c1474a | -11.3 | -3.2 | 0.462 | 32cd53e321884935… | 74598d472dd60df9… |
| cry_jiol_normal | ジオル | voice_jiol_normal.mp3 | c2066e9f9f9071be0a2e941c48b6e05ae6a064d763e0a18b40a0b37ea5c5f3b6 | -10.7 | -0.2 | 0.61 | 514183e2307d8bb8… | 03000f4e693d428a… |
| cry_jiol_sad | ジオル | voice_jiol_sad.mp3 | 6944c3307930498c45dd68cdbbf9132246a1ccbd417b9c96c106679198ef1f22 | -12.5 | 0.1 | 0.531 | 99996327abe8862d… | b3bea293a162a82b… |
| cry_regnas_normal | レグナス | voice_regnas_normal.mp3 | 0679d9e9b51e294fbe2ecd650058703ae479c1bdd200a2eb2d74455120c94b0d | -11.3 | 0.4 | 0.653 | 9bb6469f160fcda5… | 16e51984ec17f59c… |
| cry_regnas_sad | レグナス | voice_regnas_sad.mp3 | 0034882cfe1628d05a338b734578d7e6ee9ebc2aaf3c5aceed60d4ba1958dbea | -17.9 | -1.9 | 0.989 | 2e6024d373fc0256… | d6b5b7e28c1b3fb4… |
| cry_flurene_normal | フルーネ | voice_fulune_normal.mp3 | b98e8717988ac88d0a98e40215e8812662b51daf674bb70d6bbb7f7ad67f6bde | -15.6 | -0.9 | 0.989 | afdea48538c9ad02… | b5e6708667ca7628… |
| cry_flurene_sad | フルーネ | voice_fulune_sad.mp3 | ab1d2c5fbd757d41b62ae4df3282a9d24c14eea7d155d08586d4b68262688351 | -19.4 | -9.0 | 1.175 | 3e0745949a7d6314… | 7eba549be69e8213… |
| cry_razuck_normal | ラズック | voice_razuck_normal.mp3 | 12178d649d56da0416cb9328c10143b5b10f88d1456c4770c9dd811f18578d17 | -8.5 | -1.1 | 0.473 | 5635ef1c890fd747… | 0d59122fcb8a37b0… |
| cry_razuck_sad | ラズック | voice_razuck_sad.mp3 | 982f9fbc3a6a0efd56979500fbd7fa066282c696e094c7b1eeffb83a230d8f95 | -15.5 | -1.6 | 0.75 | fe73c57cb68d38fa… | 6ad5ee98b79fb1a7… |
