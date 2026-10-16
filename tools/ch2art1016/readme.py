#!/usr/bin/env python3
"""assets/fields/ch2/art_1016/README.md を derive.json から作る（使う場所の表つき）。 python3 -I tools/ch2art1016/readme.py"""
import json, os
D = 'assets/fields/ch2/art_1016'
USE = {
 'open_sea_water': '外海の地面（区画の canvas）・盆地の上の海面・世界の外の海（apron）・正門前の海',
 'shallow_turquoise_water': '島のまわりの浅瀬（外へ薄く）', 'coastal_sand_base': '島の白砂・港町の地面', 'G02b_coastal_grass_tile': '島の内側の草地',
 'coastal_white_stone_road': '陸の上の道・会場の島の敷石・分かれ目の円（陸）', 'sea_bridge_deck': '海の上の道（海上橋の石板）・分かれ目の円（海）＝**反復接合は未合格（継ぎ目が見える）**',
 'undersea_sand_base': '海底の地面（盆地の板）', 'glass_corridor_floor': 'ガラス回廊の床', 'U01_glass_corridor_roof_strip': 'ガラス回廊の天井（床の上に透けて重ねる帯）',
 'sunken_temple_road': '海底の遺跡の通路', 'sunken_ruins_ground': '沈没遺跡の広場のまわりの地面', 'U08_ruins_plaza_base': '沈没遺跡の広場（art.ruins の1つ目）',
 'U08_ruins_plaza_cracked_a': '沈没遺跡の広場（2つ目）', 'U08_ruins_plaza_cracked_b': '沈没遺跡の広場（3つ目）', 'E03_shore_foam_edge_tile': '島の波打ち際の帯',
 'E04_seabed_cliff_edge_tile': '海底のふち（盆地の壁の根もと）', 'R08_seabed_basin_wall_tile': '盆地の壁（CSS 3D の板）', 'R07_ramp_sidewall_tile': '斜路の側壁',
 'R01_white_bridge_walkstrip': '斜路の道（潮の塔の下り坂・螺旋塔の上り坂）', 'R05_spiral_tower_wall_tile': '螺旋塔・潮の塔の壁', 'R05_spiral_tower_door': '螺旋塔の扉（根もと）',
 'R05_spiral_tower_beacon': '螺旋塔の頂上の灯', 'FX04_underwater_light_screen_strip': '海中の光の筋（海底にいる間だけ画面に重ねる）',
 'ocean_arena': '大会会場（GOAL の後ろ）', 'arena_approach_gate': '会場への門（GOAL の手前の道の脇）・到着の正門前', 'chapter2_sea_medallion': '出発の中継カット（題字の上の紋章）',
 'L01_harbor_town_cluster': '港町の家並み（START の島）', 'harbor_start_gate': 'START の門', 'undersea_descent_gate': '潮の塔（海底へ下りる門・LOWER_GATE）',
 'undersea_ascent_gate': '螺旋塔の上り坂の入口（A＝UPPER_GATE・B／C＝上り坂の始まり）', 'rival_pass_gate': 'ライバルの広場（RIVAL）', 'glass_corridor_arch': 'ガラス回廊の入口（運命の分かれ道 Q）',
 'L07_winged_sea_god_statue': '海神像（STATUE）', 'L11_sunken_ship_den_closed': '沈没船の隠れ家（閉）', 'L11_sunken_ship_den_open': '沈没船の隠れ家（開＝その回に開いたとき）',
 'coastal_rock_shells': '海神像の恵み（REWARD5）・陸の景物', 'L10_coral_treasure_landmark': '珊瑚の秘宝（R_SPECIAL）',
 'L09_western_sealed_sea_gate': 'A の特殊挑戦（西の海門）', 'U03_sunken_temple_gate': 'B・C の特殊挑戦（封印の扉・封印の間）',
 'coastal_lighthouse': 'A・B の L_CHEST（灯台の灯守の箱）', 'L04_shell_shrine': 'A の R_CHEST・C の L_CHEST（貝殻の祠）', 'L05_temple_island_altar': 'A の L_ALTAR・B の R_CHEST（神殿島の祭壇）',
 'L08_western_white_tower': 'A の L_LATE_ALTAR・B の L_ALTAR（西の白塔）', 'U05_sealed_chamber_altar': 'B・C の L_LATE_ALTAR（封印の間の祭壇）', 'undersea_treasure_vault': 'C の R_CHEST（宝物庫）',
 'trial_monolith': 'C の L_ALTAR（西の遺跡の修行の祭壇＝代わりの絵。専用の U-06 は無い）',
 'E02_small_coastal_palm': '陸の景物', 'E02_white_coastal_flower_patch': '陸の景物', 'E02_small_rocky_islet': '海の景物（まばら）', 'E02_tidal_sea_stack': '海の景物（まばら）',
 'coral_cluster': '海底の景物', 'seagrass_cluster': '海底の景物', 'E01_small_blue_coral': '海底の景物・遺跡のまわり', 'E01_undersea_mossy_rock': '海底の景物', 'undersea_blue_crystal': '海底の景物',
 'sunken_columns': '海底の景物・遺跡のまわり', 'hidden_sea_cave': '**未使用**（置き場所が設計に無い）', 'L02_white_bridge_arch_pier': '**未使用**（橋脚の向きと位置が設計に無い）',
 'sea_bridge_railing_left': '**未使用**（右の欄干が未着＝片側だけ出さない）',
}
d = json.load(open(os.path.join(D, 'derive.json'), encoding='utf-8'))
L = ['# Chapter 2「潮風の海岸」正式美術（2026-10-16）の表示用派生', '',
 'ユーザー納品 ZIP「Mismon_Claude_Ch2_Assets_20261016_Part01〜04」の PNG（照合台帳＝InstructionQA の「全68点_画像仕様と採用版.tsv」）から作った表示用の WebP。**原本 PNG はリポジトリに置かない**（ユーザーが保管）。',
 '名前は納品のまま（拡張子だけ .webp）。作り方：`python3 -I tools/ch2art1016/derive.py <原本PNGのフォルダ> <台帳.tsv> assets/fields/ch2/art_1016`（同じ原本からは同じファイル）。この表は `python3 -I tools/ch2art1016/readme.py`。',
 '', '- 不透明の周期テクスチャ（RGB 13点）：絵はそのまま・等倍の縮小だけ（1024 → 512。周期のまま）。継ぎ目のつなぎ直し・描き足しはしない',
 '- 帯・壁・FX・遺跡の広場：大きさもそのまま（WebP にするだけ）',
 '- 透過の景物（RGBA）：透明の余白を切る（足もと＝下端は切らない）→ 長い辺 640px（会場 960・港町 720・紋章 512・256 の小物はそのまま）。乗算済みのアルファで縮小（白・黒のふちを出さない）。アルファは原本どおり（市松・白の擬似透過は無い＝原本のアルファの最小 0 を確認）',
 '- 変換の前後：派生を同じ大きさの原本と比べた PSNR（RGB はアルファで重み付け）とアルファの最大差（0＝一致）は derive.json',
 '', f"## 照合：{len(d['assets'])} / 68 点（SHA-256・寸法・モードが台帳と一致）", '',
 '**届かなかった 8 点**（Part04 の ZIP が途中で切れていた＝8,720,779 バイトで終わり、中央ディレクトリが無い。27 番目の coral_shoal_edge.png の途中で切れた）：', '']
for m in d['missing']: L.append(f"- {m['name']}（{m.get('size','')} {m.get('mode','')}）")
L += ['', '## 対応表', '', '| 原本 | 原本 SHA-256 | 派生 | 大きさ | バイト | PSNR／アルファ差 | 使う所 |', '|---|---|---|---|---|---|---|']
for a in d['assets']:
    k = a['name'][:-4]; q = a.get('psnr', a.get('psnr_rgb')); ad = a.get('alpha_maxdiff', '')
    L.append(f"| {a['name']} | {a['sha256']} | {a['out']} | {a['out_size']} | {a['out_bytes']} | {q}{'／' + str(ad) if ad != '' else ''} | {USE.get(k, '**未使用**')} |")
L += ['', '## 海上橋の石板（sea_bridge_deck.png）の反復接合', '',
 '`python3 -I tools/ch2art1016/deck_seam.py <原本> <出力>`：継ぎ目（端どうしの色の差 ÷ 絵の中の隣どうしの差）＝**左右 3.67・上下 2.34（1.0 前後で見えにくい）＝継ぎ目が見える**。ゲームでは原本の派生のまま敷いている（見た目を別の素材へ変えていない）。最小誤差の切れ目でつないだ候補は数値は 0.97／1.05 だが石の目地が段違いに切れる＝**不採用**。Chapter 2 の最終美術合格は保留（この 1 点の作り直しが必要）。']
open(os.path.join(D, 'README.md'), 'w', encoding='utf-8').write('\n'.join(L) + '\n')
print('ok', len(d['assets']))
