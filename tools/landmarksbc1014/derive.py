#!/usr/bin/env python3
"""2026-10-14 Chapter 1 B／C の目印 20点（ユーザー納品の透過 PNG・1024×1024）→ 表示用の派生（余白を切る → 長辺 512px 以下 → 透過 WebP）。
原本はリポジトリに置かない（README.md に原本の名前と sha256）。絵は描き直さない・色を変えない。
実行：python3 -I tools/landmarksbc1014/derive.py <原本のフォルダ>（リポジトリ直下から）"""
import sys, hashlib
from pathlib import Path
from PIL import Image
R = Path(__file__).resolve().parents[2]
SRC = Path(sys.argv[1])
OUT = R / 'assets/fields/ch1a/landmarks_bc_1014'
OUT.mkdir(parents=True, exist_ok=True)
# 納品の番号 → 役割（A の目印と同じ地点）
MAP = {'1': 'l_chest', '2': 'r_chest', '3': 'l_altar', '4': 'l_late_altar', '5': 'reward5', '6': 'r_special', '7a': 'den_closed', '7b': 'den_open', '8': 'challenge', '9': 'statue'}
rows = []
for f in sorted(SRC.glob('*.png')):
    head = f.name.split('_')[0]            # 例 B-7a
    route, no = head.split('-')
    name = f'{route.lower()}_{MAP[no]}.webp'
    raw = f.read_bytes(); im = Image.open(f).convert('RGBA')
    bb = im.getchannel('A').point(lambda v: 255 if v > 6 else 0).getbbox()
    pad = 6; bb = (max(0, bb[0] - pad), max(0, bb[1] - pad), min(im.width, bb[2] + pad), min(im.height, bb[3] + pad))
    im = im.crop(bb)
    k = min(1, 512 / max(im.size)); im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS) if k < 1 else im
    im.save(OUT / name, 'WEBP', quality=88, method=6, exact=False)
    rows.append((name, f.name, hashlib.sha256(raw).hexdigest(), im.size, (OUT / name).stat().st_size))
for r in rows: print(*r)
