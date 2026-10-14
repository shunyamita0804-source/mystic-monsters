# 固有スキルの正式エフェクト5枚（2026-10-14 開発29（4））

ユーザー納品（ZIP「ミスモン_開発29_Claude投入用_全素材同梱_20261014」の `02_個性エフェクト正式素材/01_effect_png/`）。1枚のモンスターに1枚・1254×1254・RGBA（半透明の光）。
`original/` に**バイト単位でそのまま**置く（変えない・描き直さない）。ゲームで使うのは `tools/skillfx1014/derive.py` の派生（640×640・周りに透明の余白 各辺3%・WebP 品質90・アルファは二値化しない）。

- レグナスだけ：原本の右の端（x=1253）に薄い青の光が接している（最大 α 約63）＝そのままだと直線で切れて見える → 派生では右端の 48 画素だけ、アルファを端へ向かって 0 まで下げた（色・形は変えない）。
- 足もとの点（輪の中心）は絵ごとに違う（js/battle/rules.js の SKILL_FX の ax・ay）。立ち絵の下端の中央に合わせて、`.mw` の中の立ち絵の後ろに置く（顔・体を覆わない・カメラの寄りと一緒に動く）。相手側は左右反転。
- 「Geol」は納品のファイル名。ゲームの中の ID は既存の jiol（ジオル）。

| ID | 固有スキル | 原本 | 原本の sha256 | 派生 | 派生の sha256 |
|---|---|---|---|---|---|
| solamo | 逆境のひと踏ん張り | original/01_Solamo_personality_adjusted.png | 2ebe1ccb7e83c4bf7a24c0757387ce7d9ee8ba36fad6a6737d97c0d22cd53f9a | solamo.webp | 04fa213c1a0ae80bfffbc39da29e2c7d4aa27bd4925e131255d7aa4ea897138a |
| gauru | 紅翼の猛攻 | original/02_Gauru_personality_adjusted.png | ea26e4330c87d48b2b9cfddc75bfd46738f7718331da6c9488a677f3d20de657 | gauru.webp | 8ced5d4758dd2d14b744dbc05b828c9107e254bdaa378d04322595d9972a8145 |
| nobiton | ふしぎな嗅覚 | original/03_Nobiton_personality_adjusted.png | ce87ef55682a2ea37ecb9f14346c770e38b193b5de4f7ab15fbcec754ad75c91 | nobiton.webp | 531f87eff50b8679aa2ba365279b3c04c70eb0b878d4ce5c7ac4e8f6b2d8a900 |
| jiol | 大地の守り | original/04_Geol_personality_adjusted.png | b98f7547c693783bba9130f917df5990f604fd4b41d4ffb7108a6523452739c7 | jiol.webp | e6e98673a8ac3f3312bab5564434f30e336eb5bcf78db829755c05c925c31113 |
| regnas | 蒼銀の反撃 | original/05_Regnas_personality_adjusted.png | fe391addefa9b0a544e5915649caee6855fdf4aa2214f957cc2b5da39bfc06bc | regnas.webp | 57db61e4203a216a256a8584a04a57b5f61462f5579775f1da2ac7a925f4f04d |
