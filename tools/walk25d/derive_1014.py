"""2026-10-14：ソラモ・ノビトン・ジオルの 2.5D 歩行（front・back 各8コマ＝48枚）の表示用の派生（原本は変えない・リポジトリに置かない）。
 加工は縮小（512→384）と WebP への変換だけ（derive.py のガウルと同じ。切り抜き・背景の除去・反転・色の変更はしない）。
 使い方：python3 -I tools/walk25d/derive_1014.py <ZIP の walk_25d を展開したフォルダ> <出力のリポジトリ>
"""
import sys, os, hashlib
from PIL import Image
walk, out = sys.argv[1:3]
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
for key in ('solamo', 'nobiton', 'jiol'):
    d = os.path.join(out, 'assets/monsters/walk_25d', key); os.makedirs(d, exist_ok=True)
    for dn in ('front', 'back'):
        for i in range(1, 9):
            src = os.path.join(walk, key, f'{key}_walk_{dn}_{i:02d}.png')
            Image.open(src).convert('RGBA').resize((384, 384), Image.LANCZOS).save(os.path.join(d, f'{key}_walk_{dn}_{i:02d}.webp'), 'WEBP', quality=90, alpha_quality=100, method=6)
            print('|', f'{key}/{key}_walk_{dn}_{i:02d}.png', '|', f'{key}/{key}_walk_{dn}_{i:02d}.webp', '|', sha(src), '|')
