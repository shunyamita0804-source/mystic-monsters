# Chapter 2「潮風の海岸」正式美術（2026-10-16）の表示用派生

ユーザー納品 ZIP「Mismon_Claude_Ch2_Assets_20261016_Part01〜04」の PNG（照合台帳＝InstructionQA の「全68点_画像仕様と採用版.tsv」）から作った表示用の WebP。**原本 PNG はリポジトリに置かない**（ユーザーが保管）。
名前は納品のまま（拡張子だけ .webp）。作り方：`python3 -I tools/ch2art1016/derive.py <原本PNGのフォルダ> <台帳.tsv> assets/fields/ch2/art_1016`（同じ原本からは同じファイル）。この表は `python3 -I tools/ch2art1016/readme.py`。

- 不透明の周期テクスチャ（RGB 13点）：絵はそのまま・等倍の縮小だけ（1024 → 512。周期のまま）。継ぎ目のつなぎ直し・描き足しはしない
- 帯・壁・FX・遺跡の広場：大きさもそのまま（WebP にするだけ）
- 透過の景物（RGBA）：透明の余白を切る（足もと＝下端は切らない）→ 長い辺 640px（会場 960・港町 720・紋章 512・256 の小物はそのまま）。乗算済みのアルファで縮小（白・黒のふちを出さない）。アルファは原本どおり（市松・白の擬似透過は無い＝原本のアルファの最小 0 を確認）
- 変換の前後：派生を同じ大きさの原本と比べた PSNR（RGB はアルファで重み付け）とアルファの最大差（0＝一致）は derive.json

## 照合：60 / 68 点（SHA-256・寸法・モードが台帳と一致）

**届かなかった 8 点**（Part04 の ZIP が途中で切れていた＝8,720,779 バイトで終わり、中央ディレクトリが無い。27 番目の coral_shoal_edge.png の途中で切れた）：

- coral_shoal_edge.png（1536x700 RGBA）
- sea_bridge_railing_right.png（1536x512 RGBA）
- sea_junction_tower.png（1536x1536 RGBA）
- sea_zone_nameplate.png（1536x512 RGBA）
- shore_foam_edge.png（1536x512 RGBA）
- undersea_bubble_light_fx.png（1536x1024 RGBA）
- undersea_cliff_edge.png（1536x700 RGBA）
- white_coastal_cliff_edge.png（1536x700 RGBA）

## 対応表

| 原本 | 原本 SHA-256 | 派生 | 大きさ | バイト | PSNR／アルファ差 | 使う所 |
|---|---|---|---|---|---|---|
| E01_small_blue_coral.png | eddd66f47a2e39af83e3ec01794f2992980bc4db0f6a1715a421bfd7fb62624a | E01_small_blue_coral.webp | 120x111 | 9034 | 28.97／0 | 海底の景物・遺跡のまわり |
| E01_undersea_mossy_rock.png | 927e694cb47c3df4f8847999c79ec4efbe074efa557494c5b3ee0e3d1f87ec2b | E01_undersea_mossy_rock.webp | 172x163 | 13058 | 32.23／0 | 海底の景物 |
| E02_small_coastal_palm.png | 8b01eaba777b3c0e0c8a8da865450a2305f9933f54f15e542403598ddad6e973 | E02_small_coastal_palm.webp | 124x177 | 10904 | 31.96／0 | 陸の景物 |
| E02_small_rocky_islet.png | 96eae8d963fd348327fc96a633202c36cbbfba92f3285ed3c54df963a5c4fe88 | E02_small_rocky_islet.webp | 230x161 | 17474 | 30.75／0 | 海の景物（まばら） |
| E02_tidal_sea_stack.png | cd8b22f9503a928fa6e7a8255738ff065048f59210819c25bfdf7992b87ee2fd | E02_tidal_sea_stack.webp | 77x209 | 8782 | 33.43／0 | 海の景物（まばら） |
| E02_white_coastal_flower_patch.png | 3016fd1a06b7d7b95b4e09daaa71d904e549909f2470952d75d1839724b87c9b | E02_white_coastal_flower_patch.webp | 190x183 | 19328 | 30.69／0 | 陸の景物 |
| E03_shore_foam_edge_tile.png | b802658907e679012b784fd3271f1e23d5cefc7ab244c711169645e3ed36db82 | E03_shore_foam_edge_tile.webp | 512x64 | 14590 | 34.53／0 | 島の波打ち際の帯 |
| E04_seabed_cliff_edge_tile.png | 3b645caebef058454b678b75ca426030ccc5576964070fc143174c1f906a8439 | E04_seabed_cliff_edge_tile.webp | 512x64 | 15222 | 34.57／0 | 海底のふち（盆地の壁の根もと） |
| FX04_underwater_light_screen_strip.png | 76a2ad2c54053bd9d6724eabd36334517576188a35a6e67391587762476d9587 | FX04_underwater_light_screen_strip.webp | 512x1536 | 48194 | 41.39／0 | 海中の光の筋（海底にいる間だけ画面に重ねる） |
| G02b_coastal_grass_tile.png | 3df39129166bc58dd7121024d5345697c3d00a412ca16e045427bad88a132173 | G02b_coastal_grass_tile.webp | 512x512 | 115998 | 36.74 | 島の内側の草地 |
| L01_harbor_town_cluster.png | d0e5f628194bb16744b9e9883007b137f015f1aa5383a502178d6d7741a9b5e7 | L01_harbor_town_cluster.webp | 720x606 | 122086 | 31.58／0 | 港町の家並み（START の島） |
| L02_white_bridge_arch_pier.png | 11cc3246befae853a90c694df7ab5c3f156eb51c8211c9f4e8f7dfc1eff3d26b | L02_white_bridge_arch_pier.webp | 454x286 | 31386 | 32.25／0 | **未使用**（橋脚の向きと位置が設計に無い） |
| L04_shell_shrine.png | 28727e2be94c7eca196e8a441b09a3e21574bac10f5f0faf02ab0a620791bbc9 | L04_shell_shrine.webp | 299x480 | 41750 | 35.1／0 | A の R_CHEST・C の L_CHEST（貝殻の祠） |
| L05_temple_island_altar.png | 92be8fa9cce784ab0e8460a63dbef80dcb1ed8a59824f4277c86d3ed36fd6cfa | L05_temple_island_altar.webp | 603x572 | 87400 | 33.49／0 | A の L_ALTAR・B の R_CHEST（神殿島の祭壇） |
| L07_winged_sea_god_statue.png | 7e9834c06ded2e667ba0374fd26073e14e791ec9414633bf119422e8d5766d92 | L07_winged_sea_god_statue.webp | 206x640 | 51178 | 34.82／0 | 海神像（STATUE） |
| L08_western_white_tower.png | 8a0a840d8b1ca5591fab60f242ddc4d26b88154f5dcfe05dc13c368540e179a1 | L08_western_white_tower.webp | 333x640 | 58552 | 32.98／0 | A の L_LATE_ALTAR・B の L_ALTAR（西の白塔） |
| L09_western_sealed_sea_gate.png | 4aaec7022c7fd5aed0e246320bb1d2682b1ed588e64ca97fe3d5150a17e69ccc | L09_western_sealed_sea_gate.webp | 437x307 | 44010 | 35.91／0 | A の特殊挑戦（西の海門） |
| L10_coral_treasure_landmark.png | 999b532ceaa2c6179779b1dab921d48f30ed276a8fa4e6c44bdd31cb97a267cc | L10_coral_treasure_landmark.webp | 304x441 | 47344 | 30.18／0 | 珊瑚の秘宝（R_SPECIAL） |
| L11_sunken_ship_den_closed.png | 614f68dafbc47bb7f6c594ab93f076ff2821514eec67e9cf8063f2eafea5b23a | L11_sunken_ship_den_closed.webp | 423x418 | 60766 | 29.68／0 | 沈没船の隠れ家（閉） |
| L11_sunken_ship_den_open.png | 9b1ab7d12339afb90a96235621fbc1322e090b4bb44593d133f88e75a0fed567 | L11_sunken_ship_den_open.webp | 423x418 | 60882 | 30.96／0 | 沈没船の隠れ家（開＝その回に開いたとき） |
| R01_white_bridge_walkstrip.png | 72de388be49c14bc5e6bffa813ac3bf496e0202a2f0822f8f38d45ef4dcf08e6 | R01_white_bridge_walkstrip.webp | 960x128 | 25302 | 33.63／0 | 斜路の道（潮の塔の下り坂・螺旋塔の上り坂） |
| R05_spiral_tower_beacon.png | 573212a58104551d85664c269ce5657749f0b8c3eb3e8d417b0d39632e21ab9d | R05_spiral_tower_beacon.webp | 150x431 | 25838 | 31.07／0 | 螺旋塔の頂上の灯 |
| R05_spiral_tower_door.png | 67a907da4c8748995b080043a6e8c49413815707157d8875908d40053aa107a8 | R05_spiral_tower_door.webp | 238x295 | 20132 | 35.01／0 | 螺旋塔の扉（根もと） |
| R05_spiral_tower_wall_tile.png | f88c1860af714288547ce661dff0f0b7f510c8c05aa7116552144ea852f7f311 | R05_spiral_tower_wall_tile.webp | 512x512 | 107900 | 37.44 | 螺旋塔・潮の塔の壁 |
| R07_ramp_sidewall_tile.png | 598efa6a3a37ef5f11f3b99f7366ea109fe50a5419bca487fc5d48dcb8b768de | R07_ramp_sidewall_tile.webp | 512x512 | 86740 | 38.66 | 斜路の側壁 |
| R08_seabed_basin_wall_tile.png | 1a141cfcf42e9a0a998fee1be3cbf9af63a4821205acc4511f7bef11b83269c0 | R08_seabed_basin_wall_tile.webp | 512x256 | 50768 | 36.32 | 盆地の壁（CSS 3D の板） |
| U01_glass_corridor_roof_strip.png | eff09ae52d7569f6b9bae4df212bb531af31eac54d41119aeca5bf4bb1a1d545 | U01_glass_corridor_roof_strip.webp | 960x256 | 16292 | 40.25／0 | ガラス回廊の天井（床の上に透けて重ねる帯） |
| U03_sunken_temple_gate.png | f253d8dd20b32d7d138fb482932b2d526a2d2b5943a2c051ed2cb9505ce333dd | U03_sunken_temple_gate.webp | 405x563 | 61988 | 31.81／0 | B・C の特殊挑戦（封印の扉・封印の間） |
| U05_sealed_chamber_altar.png | 531d43c5bde3aba010f1feeef340f8b775947b96cb1efc42703731dbc72f5c37 | U05_sealed_chamber_altar.webp | 464x422 | 59690 | 34.12／0 | B・C の L_LATE_ALTAR（封印の間の祭壇） |
| U08_ruins_plaza_base.png | 982b7954db455f6de539f7a2291eeec7f345771abeb97bfacf241825d0664736 | U08_ruins_plaza_base.webp | 768x768 | 202908 | 37.01／0 | 沈没遺跡の広場（art.ruins の1つ目） |
| U08_ruins_plaza_cracked_a.png | 41ee17fe76538eef211dbdff5b9d1b2cdbfadfd6fd3d5411478e0604b8a4e362 | U08_ruins_plaza_cracked_a.webp | 768x768 | 206126 | 37.28／0 | 沈没遺跡の広場（2つ目） |
| U08_ruins_plaza_cracked_b.png | 7ce81304eb7edd634f1656791fce7bcefdb28fef456e1934ef56579ba2cca2a9 | U08_ruins_plaza_cracked_b.webp | 768x768 | 212436 | 36.54／0 | 沈没遺跡の広場（3つ目） |
| arena_approach_gate.png | 6e50517ec0087788282527224bc3d9d1da5dce4fd94f321fe6d03710e722fc1d | arena_approach_gate.webp | 626x640 | 105074 | 32.63／0 | 会場への門（GOAL の手前の道の脇）・到着の正門前 |
| chapter2_sea_medallion.png | bdf082f469ff3aaf56deb2b573d4cad43bb4e9356b71245c4045ce865480c794 | chapter2_sea_medallion.webp | 504x512 | 105174 | 35.37／0 | 出発の中継カット（題字の上の紋章） |
| coastal_lighthouse.png | 153d9534234ce27503a55f76805cc283348534d884a3315e6b9f7d2c75841e3b | coastal_lighthouse.webp | 251x640 | 40546 | 33.37／0 | A・B の L_CHEST（灯台の灯守の箱） |
| coastal_rock_shells.png | 08d6866284fbf28cb84ff59ed9789da8757d7aa81849d214512e8a189d715da7 | coastal_rock_shells.webp | 640x385 | 85612 | 34.12／0 | 海神像の恵み（REWARD5）・陸の景物 |
| coastal_sand_base.png | 0dab4009d214c881ca6e3270e013f5c18940b26aaf188054a571ce67608a6f54 | coastal_sand_base.webp | 512x512 | 86068 | 37.36 | 島の白砂・港町の地面 |
| coastal_white_stone_road.png | e8ef7798078e1cee02e0740672a3be1c90226ebdbb531fb5cd47281f61a701e6 | coastal_white_stone_road.webp | 512x512 | 77846 | 39.68 | 陸の上の道・会場の島の敷石・分かれ目の円（陸） |
| coral_cluster.png | 3e57bbbcfbfc6967f086ed6672a7278ee54d45e0d3a23779fdbde14a1fda14c3 | coral_cluster.webp | 514x640 | 125224 | 33.17／0 | 海底の景物 |
| glass_corridor_arch.png | 05ff13c7dfb127fb10244a15157bce4cb02c81b05578168804f4941fc9f13476 | glass_corridor_arch.webp | 640x386 | 59590 | 36.3／0 | ガラス回廊の入口（運命の分かれ道 Q） |
| glass_corridor_floor.png | 9f6ea2c3a3755e626e5b05cbcc3bc35db36e5d2af2f8001f21047c348dffbd04 | glass_corridor_floor.webp | 512x512 | 58002 | 38.77 | ガラス回廊の床 |
| harbor_start_gate.png | a2e61a387e715bb6a15114ba2bbdadd89a36f4632171848bb81f06a472c5d63d | harbor_start_gate.webp | 640x555 | 90510 | 31.28／0 | START の門 |
| hidden_sea_cave.png | 356621a2b919d53fc983307f25da7a16395f25ccad48b109a6d56d97ea985cd8 | hidden_sea_cave.webp | 640x395 | 80746 | 35.84／0 | **未使用**（置き場所が設計に無い） |
| ocean_arena.png | f722d2c0d76deebce2b40392fa3c3d5aa5308b4932f38cf65552e5d796530156 | ocean_arena.webp | 960x949 | 215100 | 31.83／0 | 大会会場（GOAL の後ろ） |
| open_sea_water.png | 4d7f326c3b68fda4bad46cf62a94d0cca29e9d045e09b6fd0346725ebb5ae934 | open_sea_water.webp | 512x512 | 87944 | 37.21 | 外海の地面（区画の canvas）・盆地の上の海面・世界の外の海（apron）・正門前の海 |
| rival_pass_gate.png | 68a297fe247bb4e940d19d1aa92994002ebe6a3a5a7cd5eba0d8b84dd1b05d67 | rival_pass_gate.webp | 381x640 | 43742 | 34.56／0 | ライバルの広場（RIVAL） |
| sea_bridge_deck.png | ce8906595edc21fc5b2eee6fe32c96dc14b19333e3a1331fec30d7440bb1afc9 | sea_bridge_deck.webp | 512x512 | 100950 | 36.69 | 海の上の道（海上橋の石板）・分かれ目の円（海）＝**反復接合は未合格（継ぎ目が見える）** |
| sea_bridge_railing_left.png | 459d965af565129d94778e542e94787288ebe64cc6076a6515bcbbb53cf601b4 | sea_bridge_railing_left.webp | 640x177 | 36238 | 32.3／0 | **未使用**（右の欄干が未着＝片側だけ出さない） |
| seagrass_cluster.png | cd75ffc214e526eee3ee5746a469d9e21202331741ca629f3c6e2acbfad7faf7 | seagrass_cluster.webp | 576x640 | 87092 | 34.52／0 | 海底の景物 |
| shallow_turquoise_water.png | 2710280eef48005c243c602c294790e3fc763c62e7a4e3a8f0a60dbec0178ad7 | shallow_turquoise_water.webp | 512x512 | 79092 | 36.9 | 島のまわりの浅瀬（外へ薄く） |
| sunken_columns.png | 90410d5a8ee2c9d95af979ca84b0caf1624f798b4cb61af8996793b19cf354b7 | sunken_columns.webp | 411x640 | 77758 | 33.67／0 | 海底の景物・遺跡のまわり |
| sunken_ruins_ground.png | b1dd82935d3da0a6ef3dc91cef3a310a1dc44a8c92d8afb8e1b705f7b909c147 | sunken_ruins_ground.webp | 512x512 | 125852 | 34.64 | 沈没遺跡の広場のまわりの地面 |
| sunken_temple.png | 5fde79d4aea2515cf86d4573404bcd02305e55fcde7469deb21099cc67869545 | sunken_temple.webp | 604x640 | 136496 | 30.73／0 | **未使用** |
| sunken_temple_road.png | 9f27635da4e86670f58dab2bb5ad8b98334662bc88758126ecb876d18953e25b | sunken_temple_road.webp | 512x512 | 112400 | 38.06 | 海底の遺跡の通路 |
| trial_monolith.png | 5a82ea3af168bf43c652ea279b9bc61badb91f79e4c7c92077005a7d5e5141a3 | trial_monolith.webp | 511x640 | 103382 | 34.49／0 | C の L_ALTAR（西の遺跡の修行の祭壇＝代わりの絵。専用の U-06 は無い） |
| undersea_ascent_gate.png | 027b6ff2904c52622fe81fe1c5e2b763aa8cc0fc5d70b4a495dd2191e8d373bb | undersea_ascent_gate.webp | 324x640 | 70088 | 32.28／0 | 螺旋塔の上り坂の入口（A＝UPPER_GATE・B／C＝上り坂の始まり） |
| undersea_blue_crystal.png | fb6b17a8526598a427bee5952fa19ae93314357849bf3c9fd6d0f76af6a3489a | undersea_blue_crystal.webp | 640x633 | 97938 | 35.77／0 | 海底の景物 |
| undersea_descent_gate.png | da0c73aef548a51450164b6abfc72c2621ffe45d1ed03b4fa936d5383fb5c140 | undersea_descent_gate.webp | 397x640 | 71518 | 32.92／0 | 潮の塔（海底へ下りる門・LOWER_GATE） |
| undersea_sand_base.png | 20a84ff81fa56997fcdc7c13baeadb3f9aa4adb0e464f43bbc2495322bbb85f1 | undersea_sand_base.webp | 512x512 | 103512 | 35.68 | 海底の地面（盆地の板） |
| undersea_treasure_vault.png | 13f210e8c96f5554b6d22697c03b9bbb40eaebd8c4e5f1d048f5e40adaf8ec61 | undersea_treasure_vault.webp | 372x640 | 64540 | 34.59／0 | C の R_CHEST（宝物庫） |

## 海上橋の石板（sea_bridge_deck.png）の反復接合

`python3 -I tools/ch2art1016/deck_seam.py <原本> <出力>`：継ぎ目（端どうしの色の差 ÷ 絵の中の隣どうしの差）＝**左右 3.67・上下 2.34（1.0 前後で見えにくい）＝継ぎ目が見える**。ゲームでは原本の派生のまま敷いている（見た目を別の素材へ変えていない）。最小誤差の切れ目でつないだ候補は数値は 0.97／1.05 だが石の目地が段違いに切れる＝**不採用**。Chapter 2 の最終美術合格は保留（この 1 点の作り直しが必要）。
