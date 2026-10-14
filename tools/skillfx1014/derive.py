#!/usr/bin/env python3
"""2026-10-14 開発29（4）：固有スキルの正式エフェクト5枚（ユーザー納品の透過 PNG 1254×1254・RGBA）の表示用の派生。
原本は assets/battle/skill_fx_1014/original/ にバイト単位でそのまま置く（変えない）。派生＝縮小（640×640）＋周りに透明の余白（各辺 3%）＋WebP（可逆ではない・品質 90・アルファはそのまま）。
アルファを 0／255 に二値化しない（半透明の光はそのまま）。レグナスだけ、右の端（x=1253）に薄い青の光が接して直線で切れて見える＝右端の 48 画素だけアルファを端へ向かって 0 まで下げる（絵は描き直さない・色は変えない）。
使い方: python3 -I tools/skillfx1014/derive.py   （リポジトリの直下で実行）
"""
import hashlib, os
import numpy as np
from PIL import Image
D = 'assets/battle/skill_fx_1014'
FILES = [('solamo', '01_Solamo_personality_adjusted.png'), ('gauru', '02_Gauru_personality_adjusted.png'), ('nobiton', '03_Nobiton_personality_adjusted.png'),
         ('jiol', '04_Geol_personality_adjusted.png'), ('regnas', '05_Regnas_personality_adjusted.png')]
OUT, PAD = 640, 0.03
for key, f in FILES:
    src = f'{D}/original/{f}'
    im = Image.open(src).convert('RGBA'); w, h = im.size
    if key == 'regnas':
        a = np.asarray(im).copy(); n = 48
        ramp = np.clip((w - 1 - np.arange(w)) / n, 0, 1)[None, :]
        a[..., 3] = (a[..., 3].astype(np.float32) * ramp).astype(np.uint8); im = Image.fromarray(a, 'RGBA')
    inner = round(OUT * (1 - 2 * PAD)); off = round(OUT * PAD)
    can = Image.new('RGBA', (OUT, OUT), (0, 0, 0, 0)); can.alpha_composite(im.resize((inner, inner), Image.LANCZOS), (off, off))
    p = f'{D}/{key}.webp'; can.save(p, 'WEBP', quality=90, method=6, exact=True)
    print(key, f, hashlib.sha256(open(src, 'rb').read()).hexdigest(), hashlib.sha256(open(p, 'rb').read()).hexdigest(), os.path.getsize(p))
