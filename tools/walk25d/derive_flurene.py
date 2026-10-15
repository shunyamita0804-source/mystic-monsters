"""2026-10-15：フルーネの 2.5D 歩行（front・back 各8コマ＝16枚。ZIP Mismon_Flurene_Walk_And_Claude_Instructions_20261015 の walk/）の表示用の派生（原本は変えない・リポジトリに置かない）。
 加工は縮小（512→384）と WebP への変換だけ（derive_1014.py と同じ。切り抜き・背景の除去・反転・色の変更・描き直しはしない）。
 原本は「加工済み・ユーザー実機未検収」（歩行元の JPEG から透過化したもの）。back_03・back_05・front_01 は元のシートの隣のコマと接していて見切れの可能性がある＝正式合格としない。
 使い方：python3 -I tools/walk25d/derive_flurene.py <ZIP の walk フォルダ> <出力のリポジトリ>
"""
import sys, os, hashlib
from PIL import Image
walk, out = sys.argv[1:3]
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
d = os.path.join(out, 'assets/monsters/walk_25d', 'flurene'); os.makedirs(d, exist_ok=True)
for dn in ('front', 'back'):
    for i in range(1, 9):
        src = os.path.join(walk, f'{dn}_{i:02d}.png'); of = f'flurene_walk_{dn}_{i:02d}.webp'
        Image.open(src).convert('RGBA').resize((384, 384), Image.LANCZOS).save(os.path.join(d, of), 'WEBP', quality=90, alpha_quality=100, method=6)
        print('|', f'walk/{dn}_{i:02d}.png', '|', f'flurene/{of}', '|', sha(src), '|', sha(os.path.join(d, of)), '|')
