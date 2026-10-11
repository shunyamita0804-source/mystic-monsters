"""2026-10-11：2.5D の歩行コマ・対戦表の横顔アイコンの表示用の派生（原本は変えない・リポジトリに置かない）。
 加工は縮小と WebP への変換だけ（切り抜き・背景の除去・反転・色の変更はしない）。
 使い方：python3 -I tools/walk25d/derive.py <歩行のZIPを展開したフォルダ> <横顔のZIPを展開したフォルダ> <出力のリポジトリ>
"""
import sys, os, hashlib
from PIL import Image
walk, face, out = sys.argv[1:4]
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
rows = []
# 歩行：検収で問題の無かったセットだけ（ガウルの front・back）。ほかのセットは見切れ・隣のコマの欠片があり、原本の修正待ち
WALK = [('gauru', 'gauru')]
for src_key, dst_key in WALK:
    for dn in ('front', 'back'):
        d = os.path.join(out, 'assets/monsters/walk_25d', dst_key); os.makedirs(d, exist_ok=True)
        for i in range(1, 9):
            src = os.path.join(walk, src_key, f'{src_key}_walk_{dn}_{i:02d}.png')
            im = Image.open(src).convert('RGBA').resize((384, 384), Image.LANCZOS)
            dst = os.path.join(d, f'{dst_key}_walk_{dn}_{i:02d}.webp')
            im.save(dst, 'WEBP', quality=90, alpha_quality=100, method=6)
            rows.append((os.path.relpath(src, walk), os.path.relpath(dst, out), sha(src)))
# 横顔：ローマ字の5枚（日本語名の5枚は同じ絵＝sha256 が同じ。登録しない）。georu.png＝ジオル（ゲーム内のキーは jiol）
FACE = [('soramo.png', 'soramo'), ('gauru.png', 'gauru'), ('nobiton.png', 'nobiton'), ('georu.png', 'jiol'), ('regnas.png', 'regnas')]
d = os.path.join(out, 'assets/tournament/faces_25d'); os.makedirs(d, exist_ok=True)
for src_name, key in FACE:
    src = os.path.join(face, src_name)
    im = Image.open(src).convert('RGBA').resize((256, 256), Image.LANCZOS)
    dst = os.path.join(d, f'face_{key}.webp')
    im.save(dst, 'WEBP', quality=90, alpha_quality=100, method=6)
    rows.append((src_name, os.path.relpath(dst, out), sha(src)))
for r in rows: print('|', r[0], '|', r[1], '|', r[2], '|')
