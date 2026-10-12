# ソラモの技アニメ（2026-10-12 修正納品・46コマ）

納品：ZIP「ソラモ技アニメ完成版1〜4」（SORAMO_RETOUCHED_20261012/ の 46枚の RGBA 透過 PNG）。**この4ZIPを正とする**（納品の検収一覧 46コマ_検収一覧.csv の「修正_SHA256」と 46枚とも一致）。
原本の PNG はリポジトリに置かない（ユーザーが保管）。緑の除去はやり直していない（納品のまま）。

- 表示用の派生（tools/soramo1012/build.py）：透明な余白を切る（不透明度 4 以下・周り 2% の余白）→ 1536px の絵は 0.4 倍・1024px の絵（スターフォール）は 0.6 倍 → WebP（品質 86）。データ js/battle/soramo-moves-data.js（MMSOMV_DATA）
- 技の番号＝js/phase10/monsters.js の OFFICIAL_MOVES.solamo.list[].slot（バトルの SK の 0〜9）。技の性能・習得・抽選は変えていない
- 見せ方（js/battle/art25d.js の animOff）：**通常のバトル**（公式ランク戦・野生・レア・ライバル）でソラモが自分の技（0〜9）を使うとき。静止の姿を隠す → コマを区切りごとに（技ごとに1つの倍率・足もとを待機の位置に・相手側は左右反転）→ 当たる区切りで今までの共通の効果（光・ノックバック・揺れ）→ 待機の姿へ戻る。待機の立ち絵（assets/battle/idle/）は変えない。`?battleArt=old` で「旧」を選んでいる間だけ今までの演出（見比べ用）
- 時間：共通演出（js/battle/stage.js）を通るとき 4コマ 約1.6秒・スタークラッシュ／スターダストレイ 2.3秒・スターフォール 2.7秒。通らないとき（視差を減らす設定など）は fight() の次のターンに収まる 1.44秒
- ソラモビームの F003（BEAM_LAYER_ONLY）は単独の絵にしない＝F002（発射の姿）と同じ区切りに、口から相手の体の中ほどの少し先まで伸ばして重ねる（短くしすぎない）
- スターフォールの F04〜F06 は星群だけの層＝F03（空を見上げる姿）を最後まで残したまま、相手の上へ「空の門 → 降り注ぐ星 → 着弾の光」を順に重ねる。端に淡い光がある F06 は左右が画面の中に入る大きさにする（切らない）
- 確認：tools/soramo1012/qa.mjs（区切りごとに止めて画面を撮る）・tests/soramo-moves-1012.test.mjs・tests/qa-e2e-soramo-moves-1012.test.mjs
- 2026-10-09 の比較試遊のソラモのコマ（assets/battle/2p5d/soramo/NN_CC.webp）はファイルだけ残す（ソラモの技にはもう使わない）

## 対応表（技 → 納品のファイル → 表示用のファイル → 役割 → 区切り → 納品の sha256）

| 番号 | 技 | 納品 | 表示用 | 役割 | 区切り | sha256 |
|---|---|---|---|---|---|---|
| 0 | たいあたり | SORAMO_TAIATARI_F001.png | 00_01.webp（614×425） | 本体・self | 1 | `4bed1027e27e348a019d9e76e621350a8f0b4f2e36d640e99a9f6f4eabede3a5` |
| 0 | たいあたり | SORAMO_TAIATARI_F002.png | 00_02.webp（614×342） | 本体・move | 2 | `e0eeb0ad1ffed853869a3eddf4849473b5d63894b27226986f681196655307a0` |
| 0 | たいあたり | SORAMO_TAIATARI_F003.png | 00_03.webp（614×444） | 本体・contact | 3 | `50c83289cbbe069fc102df13b9c8bc1a9dce5046ed4c4ea1edecd2d26407152f` |
| 0 | たいあたり | SORAMO_TAIATARI_F004.png | 00_04.webp（603×366） | 本体・back | 4 | `5e645ce5f380ddecf96ed59b5c8554b4b64fd77afd071521dea1daf714e6cefa` |
| 1 | ひっかき | SORAMO_HIKKAKI_F01.png | 01_01.webp（551×498） | 本体・self | 1 | `b6bf7e65daace988e21f582c7a37a34ea91bca9d975b6a404d727fdc40e7700c` |
| 1 | ひっかき | SORAMO_HIKKAKI_F02.png | 01_02.webp（497×522） | 本体・lunge | 2 | `8f25fb84874c79700981ca4ff8ce6f70f8a57ef25566f43a58db602caee483ab` |
| 1 | ひっかき | SORAMO_HIKKAKI_F03.png | 01_03.webp（532×404） | 本体・contact | 3 | `787157211a24dc54ffd6aeb77330d7223680208f66f9d12843a49742534665bd` |
| 1 | ひっかき | SORAMO_HIKKAKI_F04.png | 01_04.webp（549×504） | 本体・back | 4 | `9ac0fb5cfbc2457fa7bcd1530f1fcd20f4a1651bfec21388305a3a735182990f` |
| 2 | しっぽアタック | SORAMO_SHIPPO_ATTACK_F01.png | 02_01.webp（563×449） | 本体・self | 1 | `b0354472f8836a2c12ccd727a22e781aa6a9a8ed22d849019b553c3b89bbff38` |
| 2 | しっぽアタック | SORAMO_SHIPPO_ATTACK_F02.png | 02_02.webp（568×519） | 本体・lunge | 2 | `6c4a4e34a77ec7cde428ecf4ecd742c217ef0780d6a9f018438b576aea8277e9` |
| 2 | しっぽアタック | SORAMO_SHIPPO_ATTACK_F03.png | 02_03.webp（562×389） | 本体・lunge | 3 | `83a81bae0a657337fe8f6122028b20a6f2a04f285d40dd127375af7225411c3f` |
| 2 | しっぽアタック | SORAMO_SHIPPO_ATTACK_F04.png | 02_04.webp（554×468） | 本体・self | 4 | `6c1d16cae2647b318752b14ce565ca99973c3ff7cb4083d8ab2349aafe2781eb` |
| 3 | ほえる | SORAMO_HOERU_F01.png | 03_01.webp（586×487） | 本体・self | 1 | `2962e419c63f1d27690b06f542dd6576cf3cad57347b273dfddf52bdde14b7c9` |
| 3 | ほえる | SORAMO_HOERU_F02.png | 03_02.webp（516×464） | 本体・self | 2 | `05aa1408a81e8de484169d0049fc1fa75e5cfe815670df928660b1aa05d75765` |
| 3 | ほえる | SORAMO_HOERU_F03.png | 03_03.webp（614×411） | 本体・self | 3 | `6e37df7ae4d52b963254578cffa5a776d527fd4ca09a6bf38b64665c5e8ce3c6` |
| 3 | ほえる | SORAMO_HOERU_F04.png | 03_04.webp（551×496） | 本体・self | 4 | `afef39136f7b5b7731c9c66c3045da34fa9ab2d5314f56a28eb0d0a3543303aa` |
| 4 | スタークラッシュ | SORAMO_STAR_CRUSH_F001_jump.png | 04_01.webp（554×574） | 本体・self | 1 | `5dda56e15078ead15f51722c820adc6d1d0a9651efd074d03fc1c07d9079d342` |
| 4 | スタークラッシュ | SORAMO_STAR_CRUSH_F002_gather.png | 04_02.webp（402×417） | 本体・self | 2 | `123f57d85dedb9522c94498df55191b6545129f84f2df05dcb98b198b2b94422` |
| 4 | スタークラッシュ | SORAMO_STAR_CRUSH_F003_dive.png | 04_03.webp（537×473） | 本体・move | 3 | `f79de52f4a8fb2df0cea94a32cc2290fcbf63c88f5a013c2f920571cb3746b06` |
| 4 | スタークラッシュ | SORAMO_STAR_CRUSH_F004_slam.png | 04_04.webp（612×499） | 本体・contact | 4 | `4d6a6b6e2ee844a095e4bcb49fdce1e1523818d1231905a6cf79b599f59cd04a` |
| 4 | スタークラッシュ | SORAMO_STAR_CRUSH_F005_burst.png | 04_05.webp（614×423） | 本体・contact | 5 | `c1c65ae7abb20072c6dcd07cc187e19b2db775789cdeaf50a6da2f6dcbd18fe2` |
| 4 | スタークラッシュ | SORAMO_STAR_CRUSH_F006_land.png | 04_06.webp（584×525） | 本体・back | 6 | `6e768656aee61464cad7348f8b5bcf512f157fffa9969a4759ca3cc454415fcd` |
| 5 | ソラモビーム | SORAMO_SORAMO_BEAM_F001_TAME.png | 05_01.webp（529×416） | 本体・self | 1 | `7f9d856b0760aaac3c8b58761f20a2c6de292cdd75062a100c0eb2063df3ec15` |
| 5 | ソラモビーム | SORAMO_SORAMO_BEAM_F002_HASTUHA_no_beam.png | 05_02.webp（537×415） | 本体・self | 2 | `99bd6c43310dd97c0288c8a46e4c422cf9ac5770198002922ceaaf265dec32e5` |
| 5 | ソラモビーム | SORAMO_SORAMO_BEAM_F004_END.png | 05_04.webp（553×472） | 本体・self | 3 | `140e78cbda6898433e7bc7310bdb2d7ac659f0b81d73457740f1d96ce00c3cf6` |
| 5 | ソラモビーム | SORAMO_SORAMO_BEAM_F003_BEAM_LAYER_ONLY_overlay.png | 05_03.webp（567×209） | 効果だけの層（ビーム＝F002 の口から相手へ伸ばす） | 2 | `a6bb04bb16c8fbf63a32c5ede2dc8efa29030cacc599eda49fc08853e296dffd` |
| 6 | すなかけ | SORAMO_SUNAKAKE_F01.png | 06_01.webp（559×426） | 本体・self | 1 | `acb4d205315d008c14f27b3f7b531b1027f4e69e465b282103822e0c0fccbaa3` |
| 6 | すなかけ | SORAMO_SUNAKAKE_F02.png | 06_02.webp（598×441） | 本体・self | 2 | `707bf4f3ecd9e1c94ea2b4d4b82394569f71fb1124375257349e1f9952ce5d2e` |
| 6 | すなかけ | SORAMO_SUNAKAKE_F03.png | 06_03.webp（432×416） | 本体・self | 3 | `e7502a0b27317dc88b332c827f1eebcdadd4c2185e9cce1c27ace227b7b516a3` |
| 6 | すなかけ | SORAMO_SUNAKAKE_F04.png | 06_04.webp（494×503） | 本体・self | 4 | `f482fee1b923252e6b6437a2648c4ed2f3f55fdb0a0d35198e60106eb4b63526` |
| 7 | ほしのまもり | SORAMO_HOSHI_NO_MAMORI_F01.png | 07_01.webp（465×523） | 本体・self | 1 | `79a0fb6b374f4e203f0de444e2ae5e6d6dfe7cf95b6c64b73e8d9f835ba74617` |
| 7 | ほしのまもり | SORAMO_HOSHI_NO_MAMORI_F02.png | 07_02.webp（558×456） | 本体・self | 2 | `bb6e6a19e5ef52fb30adad370952d476f2a62b8c6423c361145d242b2cc73ee7` |
| 7 | ほしのまもり | SORAMO_HOSHI_NO_MAMORI_F03.png | 07_03.webp（570×528） | 本体・self | 3 | `8a1bf7c3739c7157df84de606da943d1ce8cf1c979238b5dbcc7d24f09b87559` |
| 7 | ほしのまもり | SORAMO_HOSHI_NO_MAMORI_F04.png | 07_04.webp（457×430） | 本体・self | 4 | `61d7be3daea192bb33592bd01cf3b021089f385a1322a4d03476c806d2a6ab36` |
| 8 | スターダストレイ | SORAMO_STARDUST_RAY_F001_start.png | 08_01.webp（383×376） | 本体・self | 1 | `3f9915d680c67d71d5432a852426a8d436c27595795ec7d390d087ce4d1463ad` |
| 8 | スターダストレイ | SORAMO_STARDUST_RAY_F002_swirl.png | 08_02.webp（435×376） | 本体・self | 2 | `d20917dfc882d58c033e49d40a59ef1efc43aa7f27ece36b2a87ca3112f16418` |
| 8 | スターダストレイ | SORAMO_STARDUST_RAY_F003_bolts.png | 08_03.webp（368×335） | 本体・self | 3 | `221fc1f84e55c9e25474aef80b3261880323fa477d44d85b64fb18720d94a2a7` |
| 8 | スターダストレイ | SORAMO_STARDUST_RAY_F004_hit.png | 08_04.webp（400×331） | 本体・self | 4 | `e29417b63c2933538ca92a27356dca453c0ba31e44b718ee45c4a7f2a20503d6` |
| 8 | スターダストレイ | SORAMO_STARDUST_RAY_F005_burst.png | 08_05.webp（368×320） | 本体・self | 5 | `b5693b6f12d67080cdfc4076b70792448c09354e8b9ce4e157ff6181d00a153b` |
| 8 | スターダストレイ | SORAMO_STARDUST_RAY_F006_reset.png | 08_06.webp（335×292） | 本体・self | 6 | `203c3db6646951b15b6ab650d397f75d233d20bc81e55d59fe490d813917dc47` |
| 9 | スターフォール | SORAMO_STARFALL_F01_calling.png | 09_01.webp（605×542） | 本体・self | 1 | `16700cfd0bcfe605818b59cd03dd9f55398dd628ebe5f9f89091d8c66f8fbcb8` |
| 9 | スターフォール | SORAMO_STARFALL_F02_gathering.png | 09_02.webp（610×562） | 本体・self | 2 | `93b2ff823a0e2a64ea232b6a473147b05af77588f0c492ba483361528e270d9d` |
| 9 | スターフォール | SORAMO_STARFALL_F03_casting_up.png | 09_03.webp（614×559） | 本体・self | 3〜6 | `6c82cdf0879b9f615b4984012e850e10f900c1cc221184a99556a3235cc88235` |
| 9 | スターフォール | SORAMO_STARFALL_F04_star_gate.png | 09_04.webp（614×610） | 効果だけの層（空の門＝相手の上） | 4 | `1948d5c5802afac432906d548c2150d25294121ff65a098f05f297e9119e6a13` |
| 9 | スターフォール | SORAMO_STARFALL_F05_star_barrage.png | 09_05.webp（614×614） | 効果だけの層（降り注ぐ星＝相手へ） | 5 | `3aa41c5056aefb86aaee45160fd3025d2847100d6be9b349ab84516553743de1` |
| 9 | スターフォール | SORAMO_STARFALL_F06_impact_burst.png | 09_06.webp（614×614） | 効果だけの層（着弾の光＝相手の足もと） | 6 | `4af0f0f4c3e30aa12bcf5c6887f022bcce128ae73d951fab758c8264c5c35002` |

## 気づいた点（直していない）

- スターダストレイ F002 は再構成版（F001 の本体＋金色の光）＝区切り1〜3で本体の大きさ・向きはそろっている（tools/soramo1012/qa.mjs の画面で確認）。動きの最終判断は実機
- スターフォール F05 の左下に小さな緑の彗星がある（星群の色の一部か、緑の残りかは要確認）
- 補助技（ほえる・すなかけ・ほしのまもり）は当たる瞬間の効果を出さない（今までどおり）
