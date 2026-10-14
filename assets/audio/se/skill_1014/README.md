# 固有スキルの発動の音（2026-10-14 ユーザー正式決定・実機試遊⑫）

| ファイル | 長さ | sha256 |
|---|---|---|
| skill_activate_shot_light_energy_3p5s.ogg | 3.500秒 | ea917590bebd0cbc4a8102ed6640d49dea611f97eff06bbde0d4664e89ac97d2 |
| skill_activate_shot_light_energy_3p5s.m4a | 3.500秒 | b78af09cec677ae01c610ae81592c8f67152ce700a708e9505ec35908f04f0d9 |

- 出どころ：Mixkit「Shot light energy flowing」（音源 ID 2589）の先頭 0.000〜3.500秒（末尾 60ms のフェードだけ）。ユーザーが切り出した完成ファイル（ZIP「ミスモン_47項目_実機動画7本_最高品質化…_20261014」の 03_SE）をそのまま置いた＝こちらでは加工していない（上の sha256 は納品と同じ）。ダウンロード原音（7.413秒の WAV）は置かない。
- ライセンス：Mixkit Sound Effects Free License（https://mixkit.co/license/modal/sfxFree/）。ゲームの中での使用は可・音素材だけを単体で配布しない（ユーザー確認済み 2026-10-14）。
- 使う所：js/audio/audio-registry.js の SKILL_ACTIVATE だけ（固有スキルの発動のカメラ＝js/battle/rules.js の skillCut で1回）。[OGG, M4A] の対＝そのブラウザで再生できる1つだけ。gain 0.55（-12.2 LUFS → 約 -17.4 LUFS・ピーク約 -5.2 dBFS）。
- 旧の暫定（宝箱の第4段階 12_treasure_open_tier4.ogg）はこの場面だけ置き換えた＝TREASURE_TIER_4 の登録はそのまま。
