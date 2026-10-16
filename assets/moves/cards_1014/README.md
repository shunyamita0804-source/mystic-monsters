# 正式5体×10技＝50技カード（開発30・2026-10-14）

ユーザーが正式採用した技カード（「背景あり」の PNG・ZIP part02〜part10）の表示用の派生。技管理（バトルのルーレットの6枠・技の一覧・技の詳細）で使う（js/battle/move-cards.js の `MMMVCARD`）。

- 変換：幅 640px に縮小（縦横比のまま・LANCZOS）→ WebP 品質 84（method 6）。切り抜き・描き直し・色の加工なし。道具＝tools/movecards1014/derive.py
- 原本の PNG（2560×1440 または 1360×768）はリポジトリに置かない（ユーザーが保管）。part11（レグナスの背景なし）は今回使っていない。
- ファイル名＝{カードの番号}_{技ID}.webp。カードの番号は納品の画像の番号（技の No.・SK の番号とは一致しない）。技ID はコードの正式 ID（対応表の「star_crush」はコードの `star_crash` に合わせた）。
- ノビトン 05：「まきつく」（技ID makitsuku）。2026-10-14 に正式の技データを旧「ハンマーノーズ」（hammer_nose）から「まきつく」に直し、表示用のファイルを 05_hammer_nose.webp → 05_makitsuku.webp に名前だけ変えた（中身は同じ）。
- ノビトン 07：素材名 pinpoint_tsuki は旧呼称（データは shibire_tsuki＝しびれ突き）。

| 種族 | 番号 | 原本 | 大きさ | sha256（原本） | 表示用 |
|---|---|---|---|---|---|
| ソラモ | 1 | SORAMO_01_taiatari.png | 2560x1440 | fca34c48aeb023e4486798629d0114147eedb2c635afd77481deabb8613cca68 | solamo/01_taiatari.webp |
| ソラモ | 2 | SORAMO_02_hikkaki.png | 2560x1440 | 2919acc9fcf290a6909ce446a8ed73b28669243aaf765f4cd9794f5a93637bb2 | solamo/02_hikkaki.webp |
| ソラモ | 3 | SORAMO_03_shippo_attack.png | 2560x1440 | 4005719ce4fc689955ed1a0273d05609b505544654da1a0ac360d1e293980543 | solamo/03_shippo_attack.webp |
| ソラモ | 4 | SORAMO_04_hoeru.png | 2560x1440 | eb5069a481c728e43ac6d745eb94901cc7af4ecb0c9cb04917571c55a94fd76b | solamo/04_hoeru.webp |
| ソラモ | 5 | SORAMO_05_star_crush.png | 2560x1440 | 1b647ad8ebaf5d9554ef74623320770634b236da045de8083ecb4ea50578ea79 | solamo/05_star_crash.webp |
| ソラモ | 6 | SORAMO_06_soramo_beam.png | 2560x1440 | d3f0ea9b69300e43c89a1c04e7399aa9f2b277af872a0c17107b378059321afa | solamo/06_soramo_beam.webp |
| ソラモ | 7 | SORAMO_07_sunakake.png | 2560x1440 | 629c6e6f1b08981f7cc4b616fccb6c6358ac5c39a9b72edaf575d74882ccc398 | solamo/07_sunakake.webp |
| ソラモ | 8 | SORAMO_08_hoshi_no_mamori.png | 2560x1440 | 5447772ba5ebe74554051cf23befd7d8557162d763bddfed4427ceb3c534a79d | solamo/08_hoshi_no_mamori.webp |
| ソラモ | 9 | SORAMO_09_stardust_ray.png | 2560x1440 | 96a46db978d79e7020d81c787849e09d969fc0ed1311700a5f6f2c42e85c982d | solamo/09_stardust_ray.webp |
| ソラモ | 10 | SORAMO_10_starfall.png | 2560x1440 | 7fa7c36d78b11ecfbf4314519b911c9b412282b86d1fa32de8b06c59d1c2a0a0 | solamo/10_star_fall.webp |
| ガウル | 1 | GAURU_01_tsutsuku.png | 2560x1440 | 3fc3f8832704ea9f79428d103ce56f2718108a5a6b0bb1c1566cef48b687e122 | gauru/01_tsutsuku.webp |
| ガウル | 2 | GAURU_02_wind.png | 2560x1440 | 98ad69fe054fe7fab5f787a01285c0d52fa0a27159d0ebf61aff6280c4084d73 | gauru/02_wind.webp |
| ガウル | 3 | GAURU_03_spiral_dive.png | 2560x1440 | 1ce52d14080097ce554b5dbc4496b2c4a6ca51e83e13fb2f1172f498447366b5 | gauru/03_spiral_dive.webp |
| ガウル | 4 | GAURU_04_sonic_move.png | 2560x1440 | 47a925a4c50633c0e37a07b2ce8026833967c1ab8a21d93433cf47c76f9ca7a1 | gauru/04_sonic_move.webp |
| ガウル | 5 | GAURU_05_kouyoku_slash.png | 2560x1440 | 0ba4c877573ec5945d2f5035cd97e50acdae9a9e5ba8f20958d9931631d8952a | gauru/05_kouyoku_slash.webp |
| ガウル | 6 | 01_Gauru_06_Fireball_Card_Mouth.png（2026-10-16 差し替え・口から発射） | 1664x936 | 33c0d944c2b43701f18bc26918c49e719fa7f227a5cb55f97c91056e02f0fa16 | gauru/06_fireball.webp |
| ガウル | 7 | GAURU_07_sky_rush.png | 2560x1440 | 6dec98d7cc0789f2dd4ef721c4bb24f289f5bc64141456230a15f9884350856e | gauru/07_sky_rush.webp |
| ガウル | 8 | GAURU_08_flare_ray.png | 2560x1440 | 3a93810634d00e8f539a2733192577b9146439949155a04f4b2dccef6e013d47 | gauru/08_flare_ray.webp |
| ガウル | 9 | GAURU_09_feather_storm.png | 2560x1440 | fc9c196f81a024cb1a4230ead43d8d499529677d040faecc4f466890ba1d4c23 | gauru/09_feather_storm.webp |
| ガウル | 10 | GAURU_10_sacred_flame.png | 2560x1440 | 62a00c018acd09e94422af08994eb2865f9fc5651b9e8f330da9dc094cee0146 | gauru/10_seinaru_honoo.webp |
| ノビトン | 1 | NOBITON_01_hana_binta.png | 2560x1440 | 05bfcc967dc1fd78a946f62bab7a9c4fbf7cb399840b9f84b509d2eac59cc3c4 | nobiton/01_hana_binta.webp |
| ノビトン | 2 | 02_Nobiton_02_Headbutt_Card_Forehead.png（2026-10-16 差し替え・額で当てる） | 1664x936 | 4faf599bea769c7655218b4baf23cb63bf2b38076e934f3f4c1c21771efcd661 | nobiton/02_zutsuki.webp |
| ノビトン | 3 | NOBITON_03_hana_mizu.png | 2560x1440 | 3768c37dbf4af5fa05918d7ec2ee99a163b1608fa7b8110d8a7f6264fb36132f | nobiton/03_hanamizu.webp |
| ノビトン | 4 | NOBITON_04_hitoyasumi.png | 2560x1440 | 0fd3ce91944b4f8e763095cfecfd7e289ae86aff7f7d88bb9483a4cd6438fa29 | nobiton/04_hitoyasumi.webp |
| ノビトン | 5 | NOBITON_05_makitsuku.png | 2560x1440 | da9978cd3befff4d24cc28b2bd3230e8c4fad0fe959931eae4c526e2a81a3d77 | nobiton/05_makitsuku.webp |
| ノビトン | 6 | NOBITON_06_nose_wave.png | 2560x1440 | 6252c915d16599c500bb85fad89127c91334b027945f97d448e21b7d0f966b75 | nobiton/06_nose_wave.webp |
| ノビトン | 7 | NOBITON_07_pinpoint_tsuki.png | 2560x1440 | 1761ed97b0e9743fb646b8d59db2329ad554dcbc8f26a0b00e545da0c8120862 | nobiton/07_shibire_tsuki.webp |
| ノビトン | 8 | NOBITON_08_mirage_nose.png | 2560x1440 | 4b0bd9e133e9fd3486f3381aa4bfdd07dbdc06289417a9f13771e461e4d2fc5e | nobiton/08_mirage_nose.webp |
| ノビトン | 9 | NOBITON_09_downer_mist.png | 2560x1440 | 1f657ee609177b32d3e5e08a1fde7a0e8a1224633acba183fafbb24b61b111a7 | nobiton/09_downer_mist.webp |
| ノビトン | 10 | NOBITON_10_gigant_nose.png | 2560x1440 | 4dfce7994024045261f8b0a219e1701afb4852e7279177103fe87472ad6cf264 | nobiton/10_gigant_nose.webp |
| ジオル | 1 | JIOL_01_punch.png | 2560x1440 | ce91dbbfc0792518eaaa58547d4964aa7917990f096bc7123f14ad7ed606b3cd | jiol/01_punch.webp |
| ジオル | 2 | JIOL_02_kick.png | 2560x1440 | 33c8595ddda2cfff6ba091af765c1d751761143c1caf1f0e6420215f8154e6fc | jiol/02_kick.webp |
| ジオル | 3 | JIOL_03_charge_power.png | 2560x1440 | 980843f07ef16414b0b6fd15c396d8ed739738a0d70682424cd1f2fcf5629d73 | jiol/03_chikara_wo_tameru.webp |
| ジオル | 4 | JIOL_04_body_press.png | 2560x1440 | f353b1f29f67cc47d39483b68c3b66ece554d660ec349b596420e39d31762d5e | jiol/04_noshikakari.webp |
| ジオル | 5 | JIOL_05_ground_hammer.png | 1360x768 | 81df174aec7377b6370543af3ce1220639f7d7b0b67db35f75820cd6fb2d7745 | jiol/05_ground_hammer.webp |
| ジオル | 6 | JIOL_06_crystal_ray.png | 2560x1440 | 028b9c55d1a8bc26096516e30c88bf22b16538a3697f0eced64671d1aeb37e2d | jiol/06_crystal_ray.webp |
| ジオル | 7 | JIOL_07_ground_spike.png | 2560x1440 | c467415acd07e829d1ac2612346f104044c1b9ab84bb3864636804132de200dc | jiol/07_ground_spike.webp |
| ジオル | 8 | JIOL_08_rock_upper.png | 2560x1440 | 75d75fa9d80cf41ebd4afc081c487c3baeef8ea04d05e88367c3e741adba5bfc | jiol/08_rock_upper.webp |
| ジオル | 9 | JIOL_09_geo_impact.png | 1360x768 | 5c3fdf4e1d41e5f5b5ff9822efe4c257a0c867edb54ce2ca7ef548e316f60695 | jiol/09_geo_impact.webp |
| ジオル | 10 | JIOL_10_crystal_nova.png | 2560x1440 | b1456b1cafe3604befdc8647939187950f0616cd832691dca26fcf717740ca28 | jiol/10_crystal_nova.webp |
| レグナス | 1 | REGNAS_01_kirisaku.png | 1360x768 | 3dbb97f8597aef6bf8dc06db2ee1ecd8fb8a301737d67a3ae00c0fbb87cea878 | regnas/01_kirisaku.webp |
| レグナス | 2 | REGNAS_02_tail_attack.png | 1360x768 | 6c2c26023f63e1389638b57344697613ac84c429b426d67a2719ff194d0e757c | regnas/02_shippo_attack.webp |
| レグナス | 3 | REGNAS_03_dragon_eye_lock.png | 1360x768 | ba8eb147ed3c6f3a95003f84bd15ea3e2381d43b28fb78b223a4b3cba6b8d3aa | regnas/03_ryugan_lock.webp |
| レグナス | 4 | REGNAS_04_afterimage_step.png | 1360x768 | 4412c121248fcefb44b38713cc1954b6ac8e51bb712b621596c19c1b384ed28d | regnas/04_zanei_step.webp |
| レグナス | 5 | REGNAS_05_dragon_crash.png | 1360x768 | a6e7e471ad122232b43dfa91d2f10072f74b07fe0c2f63d842d92ced653c9bcd | regnas/05_dragon_crash.webp |
| レグナス | 6 | REGNAS_06_blue_breath.png | 1360x768 | 25f20264189458217c92864a22f92b61338aaabddf3fdce974eccd9f8afd0801 | regnas/06_soukou_breath.webp |
| レグナス | 7 | REGNAS_07_snipe_fang.png | 1360x768 | dc2afbb348487c5e55214fc8796e5abe8c1d42aa0d6bfe5d2cc2a66a4610bcb0 | regnas/07_snipe_fang.webp |
| レグナス | 8 | REGNAS_08_phantom_claw.png | 1360x768 | 0477b292752dcab1a9c213dedf20ffa0b4c71e7ed306647f4be22ff47371aa9d | regnas/08_genei_claw.webp |
| レグナス | 9 | REGNAS_09_blue_blade_flurry.png | 1360x768 | 70d38c8d761fbeb77d6bb6a2bcdf6480a75418e0ba27d0e5c2d61071a3f7b0aa | regnas/09_soujin_ranbu.webp |
| レグナス | 10 | REGNAS_10_tail_cyclone.png | 1360x768 | 7a77ca2fd55a40d1bb848b1b6cfcd6e1ccf2a4e1061b985937bb9cfce91ada5c | regnas/10_tail_cyclone.webp |

## フルーネ（2026-10-15 追加・ZIP Mismon_Flurene_10SkillCards_20261015）

- 原本＝背景あり PNG 1664×936（RGB・文字・枠・UI なし）。変換は上と同じ（幅 640px・WebP 品質84）。道具＝tools/movecards1014/derive_flurene.py
- 技ID＝納品のファイル名のローマ字（js/battle/move-cards.js の CARDS の1か所。js/phase10/monsters.js の登録（PENDING_SPECIES）には ID を足していない＝カードの番号＝技の No. で引く）。フルーネは未解禁＝SK の番号なし＝技管理・ルーレットには出ない（QA 試遊モードでだけ見られる）

| 種族 | 番号 | 原本 | 大きさ | sha256（原本） | 表示用 |
|---|---|---|---|---|---|
| フルーネ | 1 | FLURENE_01_tsuruuchi.png | 1664x936 | 68408c307d1b59c64bc09ac839420150c87c0b0d8a6869d8284aac30ee4f7cda | flurene/01_tsuruuchi.webp |
| フルーネ | 2 | FLURENE_02_tane_tobashi.png | 1664x936 | 151e7165eb2a4b7424d10c1f0ffbe1817f002615457f46012545a120fff1a16d | flurene/02_tane_tobashi.webp |
| フルーネ | 3 | FLURENE_03_hana_no_kaori.png | 1664x936 | 5b40a3ccf5cdd6de6b3661b83c56256c3f958131e9be2916fcdcd385667cfa20 | flurene/03_hana_no_kaori.webp |
| フルーネ | 4 | FLURENE_04_nekko_no_mamori.png | 1664x936 | 4672b581e64f9f1a2445e62109c381bd63d9b699a9469131d3943157dee2cc92 | flurene/04_nekko_no_mamori.webp |
| フルーネ | 5 | FLURENE_05_konsai_press.png | 1664x936 | 123435f7a4fab06b2d09cc45cb98b92f23ba15b6b6034efea92b0f95f8aaafff | flurene/05_konsai_press.webp |
| フルーネ | 6 | FLURENE_06_bloom_ray.png | 1664x936 | 5e25993812837f9608488cdd698d6f372d939aee635b838000c0c352dc5058aa | flurene/06_bloom_ray.webp |
| フルーネ | 7 | FLURENE_07_shibari_zuru.png | 1664x936 | a7cf03f5bf598ee03b5efaa6026739c2280128d0e272b8a70c1b214e351aa0a1 | flurene/07_shibari_zuru.webp |
| フルーネ | 8 | FLURENE_08_hanakage_no_mai.png | 1664x936 | 6ef92c09fc8d99b8012dd93ff17d9b94505bfbfcbe2a42f4d76a0e6a6fca4b6e | flurene/08_hanakage_no_mai.webp |
| フルーネ | 9 | 03_Fulune_09_RootDrain_Card_Absorb.png（2026-10-16 差し替え・旧「生命のしずく」のカードは削除） | 1664x936 | 325edfd8ae91c68e4f6749b706fc75cbc05af3cea1738307d5ca733a23325c9a | flurene/09_root_drain.webp |
| フルーネ | 10 | FLURENE_10_root_tempest.png | 1664x936 | 63659d7d7a92f49edc887ce9b63d5a1196b834253298721ed73e14b28851fe69 | flurene/10_root_tempest.webp |

## 2026-10-16 の差し替え3枚（ZIP Mismon_Battle_Final_Part01_Art の Cards_3approved・ユーザー正式承認）

- 画像だけを差し替えた（技の性能・SK の番号・技アニメ・SE・カードの UI は変えていない）。変換は既存と同じ（幅 640px・WebP 品質84）。道具＝tools/final1016/derive.py
- ガウル カード06 ファイアボール＝SK 15／ノビトン カード02 ずつき＝SK 31／フルーネ カード09 ルートドレイン（技ID root_drain・QA 試遊だけの SK 58）。カードの番号と SK の番号は別
- 旧カード3枚（GAURU_06_fireball・NOBITON_02_zutsuki・FLURENE_09_inochi_no_shizuku）の原本の sha256 は git の履歴の README に残る

