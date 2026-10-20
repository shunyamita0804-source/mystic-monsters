# =========================================================
# 2026-10-20 第4便：ユーザー納品の地面（E03）・道と広場（E04）を WebGL の盤（js/proto/board-gl.js）の素材にする（テストではない道具）
#  python3 -I tools/fullplay1020/gl-art.py <E03・E04 の PNG があるフォルダ（下のフォルダも探す）>
#  → assets/fields/gl_1020/*.webp（2048px のまま・WebP q82）
#  縁石（curb_strip）は、絵の中の縁石の帯（不透明な行）だけを切り出す（納品の Chapter 1〜3 の縁石は、帯の外に市松模様が焼き込まれていた＝帯の外は使わない）。色は変えない
# =========================================================
import sys, os, glob
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
OUT = os.path.join(ROOT, 'assets', 'fields', 'gl_1020')
os.makedirs(OUT, exist_ok=True)
NAME = {'grass': 'ground', 'sand': 'ground', 'volcanic_ground': 'ground', 'sky_grass': 'ground', 'seabed': 'seabed', 'cloud_sea': 'cloud',
        'road_surface': 'road', 'curb_strip': 'curb', 'plaza': 'plaza'}

for f in sorted(glob.glob(os.path.join(sys.argv[1], '**', 'E0[34]_*.png'), recursive=True)):
    b = os.path.basename(f)[4:-4]            # ch1_grass など
    ch, kind = b[:3], b[4:]
    im = Image.open(f).convert('RGBA' if kind in ('curb_strip', 'plaza') else 'RGB')
    if kind == 'curb_strip':
        a = np.array(im); rows = np.where(a[..., 3].mean(1) > 200)[0]
        im = im.crop((0, int(rows.min()), im.width, int(rows.max()) + 1))
    name = f'{ch}_{NAME[kind]}.webp'
    im.save(os.path.join(OUT, name), 'WEBP', quality=82, method=6)
    print(f'{name}  {im.width}x{im.height}  {os.path.getsize(os.path.join(OUT, name)) // 1024}KB')
