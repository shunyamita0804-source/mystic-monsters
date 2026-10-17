#!/usr/bin/env python3
"""2026-10-17 道路画質 QA：tools/road1017/compare.mjs の撮影から比較の1枚を作る（テストではない道具）。

  python3 -I -B tools/road1017/sheets.py <compare.mjs の出力フォルダ> <出力フォルダ>
  各ケース・各停止：横に 従来／旧素材＋近くの層／新素材 raw／新素材 fix（／白い橋帯）を並べた全体（半分の大きさ）と、
  画面の下半分の道の等倍の切り抜き（画素比 3 のまま＝iPhone の画面の画素と同じ細かさ）
"""
import json
import os
import sys

from PIL import Image, ImageDraw, ImageFont

try:
    FONT = ImageFont.truetype('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc', 18)
except OSError:
    FONT = None

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
res = json.load(open(os.path.join(src, 'result.json'), encoding='utf-8'))
ORDER = ['old', 'fix_nobig', 'fix_nolayer', 'old_hi', 'raw', 'fix', 'fix_r01']
LABEL = {'old': '従来', 'fix_nobig': 'fix（3D の中・箱の修正なし）', 'fix_nolayer': 'fix（層分けなし）', 'old_hi': '旧素材+近くの層（層分け）', 'raw': '新素材 raw', 'fix': '新素材 fix', 'fix_r01': 'fix+白い橋帯R01+門'}
cases = {}
for r in res:
    if 'stops' not in r:
        continue
    base, tag = r['name'].split('_', 1)
    cases.setdefault(base, {})[tag] = r
for base, tags in cases.items():
    ts = [t for t in ORDER if t in tags]
    n = min(len(tags[t]['stops']) for t in ts)
    for i in range(n):
        ims = [Image.open(os.path.join(src, f'{base}_{t}_{i}.png')).convert('RGB') for t in ts]
        W, H = ims[0].size
        sw, sh = W // 2, H // 2
        full = Image.new('RGB', (len(ims) * (sw + 12), sh + 40), (20, 22, 30))
        d = ImageDraw.Draw(full)
        for j, (t, im) in enumerate(zip(ts, ims)):
            full.paste(im.resize((sw, sh), Image.LANCZOS), (j * (sw + 12), 40))
            s = tags[t]['stops'][i]
            d.text((j * (sw + 12) + 6, 6), f"{LABEL[t]}  s={s['s']}", fill=(255, 230, 160), font=FONT)
            d.text((j * (sw + 12) + 6, 22), f"node {s['node']}", fill=(200, 200, 210), font=FONT)
        full.save(os.path.join(out, f'{base}_{i}_full.jpg'), quality=86)
        cw, ch = 520, 560   # 等倍の切り抜き（モンスターの少し上〜画面の下の道）
        x0, y0 = W // 2 - cw // 2, int(H * 0.47)
        zoom = Image.new('RGB', (len(ims) * (cw + 12), ch + 30), (20, 22, 30))
        d = ImageDraw.Draw(zoom)
        for j, (t, im) in enumerate(zip(ts, ims)):
            zoom.paste(im.crop((x0, y0, x0 + cw, y0 + ch)), (j * (cw + 12), 30))
            d.text((j * (cw + 12) + 6, 8), LABEL[t], fill=(255, 230, 160), font=FONT)
        zoom.save(os.path.join(out, f'{base}_{i}_zoom.jpg'), quality=90)
print('ok', list(cases))
