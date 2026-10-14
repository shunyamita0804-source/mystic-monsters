#!/usr/bin/env python3
"""2026-10-14 開発29（5）：Chapter 1 のマスの上面12種の紋章を、円盤の上面の内側の金の輪にちょうど届く大きさへ（iPhone の試遊「紋章が小さい」）。
円盤（tiles_v2/tile_blank の側面・縁・厚み・影・外形）は変えない。紋章の層だけ大きくする。元はリポジトリの src/（2026-10-12 の tops_1012.py が原本から作ったメダルの透過派生）。
紋章の見えている部分（不透明 ≥ 25%）の外側＝金の輪の FIT。もとの紋章の形・色は変えない（拡大して重ねるだけ）。
使い方: python3 -I tools/fx1011/tops_1014.py   （リポジトリの直下で実行）
"""
import sys, os, subprocess
OUT = 'assets/fields/ch1a/tiles_top_1012'
FIT = '0.90'
NAMES = ['tile_stat_life', 'tile_stat_power', 'tile_stat_intelligence', 'tile_stat_accuracy', 'tile_stat_evasion', 'tile_stat_toughness',
         'tile_wild_monster', 'tile_treasure', 'tile_meal', 'tile_rival', 'tile_event', 'tile_rare_monster']
for name in NAMES:
    thr = {'tile_rival': '12', 'tile_stat_evasion': '20'}.get(name, '70')   # tops_1012.py と同じしきい
    subprocess.run([sys.executable, '-I', 'tools/fx1011/top_composite.py', f'{OUT}/src/{name}.webp', f'{OUT}/{name}.webp', '0.62', thr, FIT], check=True)
