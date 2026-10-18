#!/usr/bin/env python3
"""Chapter 3 の3つの道の設計図（PNG）。python3 -I tools/ch3/draw_routes.py <出力フォルダ>"""
import json, sys
from pathlib import Path
from PIL import Image, ImageDraw
R = Path(__file__).resolve().parents[2]
s = (R / 'js/proto/ch3-routes.js').read_text(encoding='utf-8'); D3 = json.loads(s[s.index('const R = ') + 10: s.index(';\n  if (typeof module')])
out = Path(sys.argv[1] if len(sys.argv) > 1 else 'ch3-design'); out.mkdir(parents=True, exist_ok=True)
K = 0.5
COL = {'parity_left': (60, 120, 230), 'parity_right': (230, 90, 60), 'reward_spur': (200, 160, 30), 'optional_random_spur': (150, 90, 200), 'challenge_success': (40, 170, 90), 'challenge_fail': (120, 120, 120)}
sheet = Image.new('RGB', (int(1024 * K) * 3 + 40, int(1536 * K) + 40), (255, 255, 255))
for i, (k, D) in enumerate(D3.items()):
    im = Image.new('RGB', (int(1024 * K), int(1536 * K)), (200, 222, 240)); g = ImageDraw.Draw(im)
    for P in D['art']['islands']: g.polygon([(x * K, y * K) for x, y in P], fill=(150, 200, 110), outline=(110, 150, 80))
    for sid, sg in D['segments'].items():
        pts = [(D['nodes'][n][0] * K, D['nodes'][n][1] * K) for n in sg[3]]; g.line(pts, fill=COL.get(sg[2], (240, 240, 240)), width=4)
    for nid, v in D['nodes'].items():
        x, y = v[0] * K, v[1] * K
        if v[3] is None: g.ellipse((x - 4, y - 4, x + 4, y + 4), fill=(20, 30, 60)); g.text((x + 5, y - 6), nid, fill=(10, 10, 10))
        else: g.ellipse((x - 1.5, y - 1.5, x + 1.5, y + 1.5), fill=(60, 60, 60))
    g.text((8, 8), f"Ch3 {k} {D['name']}", fill=(0, 0, 0)); im.save(out / f'route_{k}.png'); sheet.paste(im, (10 + i * (int(1024 * K) + 10), 20))
sheet.save(out / 'routes_ABC.png'); print('ok', out)
