"""2026-10-13 開発25 E：正式サイコロ（assets/fields/ch1a/dice/dice_stop_1〜6・dice_blank＝Phase 12 の正式素材）の
上の面（ひし形）を正方形へ戻して、立体サイコロ（js/chapter/dice-cube.js）の6面のテクスチャを作る（派生。原本は変えない）。
・地と四隅の金の飾り＝dice_blank の上の面
・目＝dice_stop_5 の上の面の真ん中の目を1粒取り出し（正式の絵の目）、普通のサイコロの並び（2〜6）に置く（正式の絵では目が斜めの並び＝立方体の面ではそのまま使えない）
・1＝dice_stop_1 の上の面の紋章（金色の部分）。向きは元の絵と同じ（上の頂点＝上）に戻す
出力：assets/fields/ch1a/dice/cube_1013/face_1〜6.webp（256×256）
使い方：python3 -I tools/dice1013/faces.py
"""
import os, sys
import numpy as np
from PIL import Image, ImageFilter
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'assets/fields/ch1a/dice')
OUT = os.path.join(SRC, 'cube_1013')
N, SS = 256, 4
TOP, LEFT, CENTER, RIGHT = (180, 9), (10, 81), (180, 149), (350, 81)   # 上の面のひし形（360×384 の絵の画素・目で測った値）

def unwarp(path):
    im = Image.open(path).convert('RGBA')
    big = im.resize((im.width * SS, im.height * SS), Image.LANCZOS)
    q = [c * SS for p in (TOP, LEFT, CENTER, RIGHT) for c in p]
    return big.transform((N * SS, N * SS), Image.QUAD, q, Image.BICUBIC).resize((N, N), Image.LANCZOS)

def pip_layer(face, rad):
    a = np.asarray(face).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    gold = ((r - b) > 55) & (r > 120)                 # 金・橙（真珠の地は青みが残る白）
    yy, xx = np.mgrid[0:N, 0:N]; c = (N - 1) / 2
    inner = ((xx - c) ** 2 + (yy - c) ** 2) <= rad ** 2   # 四隅の飾りを除く
    m = Image.fromarray(((gold & inner) * 255).astype(np.uint8))
    m = m.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.2))
    lay = face.copy(); lay.putalpha(m)
    return lay

POS = {2: [(0, 0), (2, 2)], 3: [(0, 0), (1, 1), (2, 2)], 4: [(0, 0), (2, 0), (0, 2), (2, 2)], 5: [(0, 0), (2, 0), (1, 1), (0, 2), (2, 2)], 6: [(0, 0), (0, 1), (0, 2), (2, 0), (2, 1), (2, 2)]}
GRID = (76, 128, 180)   # 3×3 の升目の中心（256 の面）
PIP_D = 58

def pip_sprite():
    f = unwarp(os.path.join(SRC, 'dice_stop_5.webp'))
    lay = pip_layer(f, 50).rotate(-45, resample=Image.BICUBIC)
    lay = lay.crop(lay.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox())
    return lay.resize((PIP_D, PIP_D), Image.LANCZOS)

def main():
    os.makedirs(OUT, exist_ok=True)
    base = unwarp(os.path.join(SRC, 'dice_blank.webp'))
    pip = pip_sprite()
    for v in range(1, 7):
        out = base.copy()
        if v == 1:
            lay = pip_layer(unwarp(os.path.join(SRC, 'dice_stop_1.webp')), 122).rotate(-45, resample=Image.BICUBIC)
            out.alpha_composite(lay)
        else:
            for gx, gy in POS[v]:
                out.alpha_composite(pip, (GRID[gx] - PIP_D // 2, GRID[gy] - PIP_D // 2))
        out.save(os.path.join(OUT, f'face_{v}.webp'), quality=90, method=6)
        print('face', v)

if __name__ == '__main__':
    sys.exit(main())
