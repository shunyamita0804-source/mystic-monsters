#!/usr/bin/env python3
"""2026-10-12 正式：Chapter 1 のマスの上面12種（ZIP「試遊修正_新マス12種_SE_チケット」の 02_ボード上面_原本JPEG）。
原本（JPEG・市松が焼き込み）は読むだけ。tools/fx1011/derive.py の cutout(disc)＝メダルの透過 → tools/fx1011/top_composite.py＝既存の円盤 tiles_v2/tile_blank の上面へ中央の紋章だけ。
使い方: python3 -I tools/fx1011/tops_1012.py <原本のフォルダ>   （リポジトリの直下で実行）
"""
import sys, os, hashlib, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image
import derive
SRC = sys.argv[1]
OUT = 'assets/fields/ch1a/tiles_top_1012'
TOPS = [('01_life.jpg', 'tile_stat_life'), ('02_power.jpg', 'tile_stat_power'), ('03_intelligence.jpg', 'tile_stat_intelligence'), ('04_accuracy.jpg', 'tile_stat_accuracy'),
        ('05_evasion.jpg', 'tile_stat_evasion'), ('06_toughness.jpg', 'tile_stat_toughness'), ('07_wild.jpg', 'tile_wild_monster'), ('08_treasure.jpg', 'tile_treasure'),
        ('09_meal.jpg', 'tile_meal'), ('10_rival.jpg', 'tile_rival'), ('11_event.jpg', 'tile_event'), ('12_rare.jpg', 'tile_rare_monster')]
os.makedirs(OUT + '/src', exist_ok=True)
rows = []
for f, name in TOPS:
    p = os.path.join(SRC, f)
    med = derive.fit(derive.trim(derive.cutout(Image.open(p), 'disc')), 512)
    sp = f'{OUT}/src/{name}.webp'; med.save(sp, 'WEBP', quality=88, method=6)
    # 彩度のしきい：ライバル（銀の剣）・回避（淡い水色の羽）は色が淡い＝しきいを下げる（ほかは試作と同じ 70）
    thr = {'tile_rival': '12', 'tile_stat_evasion': '20'}.get(name, '70')
    subprocess.run([sys.executable, '-I', 'tools/fx1011/top_composite.py', sp, f'{OUT}/{name}.webp', '0.62', thr], check=True)
    rows.append(f'| {f} | {name}.webp | {hashlib.sha256(open(p, "rb").read()).hexdigest()} |')
open(OUT + '/sha256.md', 'w').write('| 原本 | 派生 | sha256（原本） |\n|---|---|---|\n' + '\n'.join(rows) + '\n')
