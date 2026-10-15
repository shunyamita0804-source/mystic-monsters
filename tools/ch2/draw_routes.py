#!/usr/bin/env python3
"""Chapter 2 A／B／C の設計図（鳥瞰模式図）を描く（2026-10-15・設計案）。
入力：js/proto/ch2-routes.js（build_ch2_routes.py の出力）と、あれば世界観参照（--bg 画像。添付の 02_Chapter2_World_Overview.jpg＝リポジトリの
      assets/fields/ch2a/intro/ch2_intro_overview_v2.webp と同じ絵）。
出力：docs/ch2_abc_design_1015/route_{A,B,C}_overlay.jpg（世界観参照の上に道を重ねた図・JPEG 品質86）・route_{A,B,C}_schema.png（白地の路線図＝地理と区別）・routes_all_overlay.jpg（3本を重ねた図）
実行：python3 -I tools/ch2/draw_routes.py [--bg 画像]。描画だけ（ゲームのファイルは変えない）。"""
import json, sys, math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
R = Path(__file__).resolve().parents[2]
OUT = R / 'docs/ch2_abc_design_1015'; OUT.mkdir(parents=True, exist_ok=True)
src = (R / 'js/proto/ch2-routes.js').read_text(encoding='utf-8')
DATA = json.loads(src[src.index('const R = ') + 10: src.index(';\n  if (typeof module')])
BG = None
if '--bg' in sys.argv: BG = Path(sys.argv[sys.argv.index('--bg') + 1])
if BG is None:
    cand = R / 'assets/fields/ch2a/intro/ch2_intro_overview_v2.webp'
    if cand.exists(): BG = cand
W, H = 1024, 1536
try: FONT = ImageFont.truetype('/usr/share/fonts/opentype/ipafont-gothic/ipagp.ttf', 20); FONT_S = ImageFont.truetype('/usr/share/fonts/opentype/ipafont-gothic/ipagp.ttf', 15); FONT_B = ImageFont.truetype('/usr/share/fonts/opentype/ipafont-gothic/ipagp.ttf', 30)
except Exception: FONT = FONT_S = FONT_B = ImageFont.load_default()
ZONE_COLOR = {'surface_early': (255, 214, 60), 'descent': (255, 120, 40), 'undersea': (120, 230, 255), 'ascent': (255, 120, 40), 'surface_late': (255, 214, 60)}
ROUTE_COLOR = {'A': (255, 210, 40), 'B': (90, 255, 140), 'C': (255, 110, 200)}
ROLE_MARK = {'start': ('S', (40, 200, 90)), 'goal': ('G', (230, 60, 60)), 'free_fork': ('分', (255, 255, 255)), 'late_free_fork': ('分', (255, 255, 255)), 'parity_forced_fork': ('Q', (255, 255, 120)),
             'challenge_d6_5_6': ('挑', (255, 150, 60)), 'mandatory_rival': ('R', (230, 40, 90)), 'fixed_reward_dead_end': ('宝', (255, 220, 90)), 'optional_random_unlock_dead_end': ('隠', (200, 160, 255)),
             'lower_walk_through_gate': ('下', (160, 220, 255)), 'upper_walk_through_gate': ('門', (160, 220, 255)), 'early_merge': ('合', (220, 220, 220)), 'parity_rejoin': ('合', (220, 220, 220)), 'final_merge': ('合', (220, 220, 220))}

def base(bg):
    if bg and Path(bg).exists():
        im = Image.open(bg).convert('RGB').resize((W, H), Image.LANCZOS)
        im = Image.blend(im, Image.new('RGB', (W, H), (10, 30, 60)), 0.28)   # 道が読めるように少し暗く
        return im
    return Image.new('RGB', (W, H), (18, 60, 110))

def schema_base(D):
    im = Image.new('RGB', (W, H), (245, 248, 250)); g = ImageDraw.Draw(im)
    if D['art'].get('basin'):   # 2026-10-15 追補：海底の盆地（海面より depth 低い）と塔
        g.polygon([tuple(p) for p in D['art']['basin']], fill=(200, 226, 244), outline=(90, 140, 190))
        g.text((D['art']['basin'][0][0] + 12, D['art']['basin'][0][1] - 40), f'海底の盆地（海面 −{D["art"]["depth"]}）', fill=(70, 110, 150), font=FONT_S)
    for t in D['art'].get('towers', []):
        c, r = t['c'], t['r']; g.ellipse([c[0] - r, c[1] - r, c[0] + r, c[1] + r], fill=(205, 200, 188), outline=(120, 110, 90), width=3)
        g.text((c[0] - 30, c[1] - 8), '螺旋塔' if t['kind'] == 'spiral' else '潮の塔', fill=(80, 70, 50), font=FONT_S)
    for reg in D['art']['regions']:
        col = {'land': (232, 224, 190), 'seabed': (200, 228, 245), 'glass': (215, 245, 255), 'tower': (235, 235, 240), 'arena': (250, 236, 200)}.get(reg['kind'], (240, 240, 240))
        g.polygon([tuple(p) for p in reg['poly']], fill=col, outline=(180, 180, 190))
        x = sum(p[0] for p in reg['poly']) / len(reg['poly']); y = sum(p[1] for p in reg['poly']) / len(reg['poly'])
        g.text((x - 20, y - 8), reg['id'], fill=(120, 120, 130), font=FONT_S)
    return im

def seg_zone(D, sid):
    for z, ss in D['zones'].items():
        if sid in ss: return z
    return 'surface_early'

def draw_route(im, D, color=None, label=True, width=7):
    g = ImageDraw.Draw(im, 'RGBA')
    N, S = D['nodes'], D['segments']
    for sid, s in S.items():
        pts = [tuple(N[i][:2]) for i in s[3]]
        c = color or ZONE_COLOR[seg_zone(D, sid)]
        spur = s[2] in ('reward_spur', 'optional_random_spur')
        cond = next((e[4] for e in D['edges'] if e[2] == sid), 'always')
        g.line(pts, fill=(0, 0, 0, 160), width=width + 4)
        if spur:   # 寄り道＝破線
            for i in range(len(pts) - 1):
                if i % 2 == 0: g.line([pts[i], pts[i + 1]], fill=c + (255,), width=width)
        else: g.line(pts, fill=c + (255,), width=width)
        if cond != 'always':   # 条件つきの道＝中に細い白線
            g.line(pts, fill=(255, 255, 255, 200), width=2)
        if sid in (D.get('explore') or {}):   # 探索路（2026-10-15 追補）＝中に緑の線
            g.line(pts, fill=(60, 200, 90, 255), width=3)
        for p in pts[1:-1]: g.ellipse([p[0] - 3, p[1] - 3, p[0] + 3, p[1] + 3], fill=(255, 255, 255, 220))
        if label:
            mid = pts[len(pts) // 2]; g.text((mid[0] + 6, mid[1] - 18), sid, fill=(255, 255, 255), font=FONT_S, stroke_width=2, stroke_fill=(0, 0, 0))
    for id_, n in N.items():
        if n[2] == 'ordinary_tile': continue
        m = ROLE_MARK.get(n[2]); x, y = n[0], n[1]
        if m:
            g.ellipse([x - 13, y - 13, x + 13, y + 13], fill=m[1] + (255,), outline=(0, 0, 0, 255), width=2)
            g.text((x - 7 if len(m[0]) == 1 else x - 9, y - 10), m[0], fill=(0, 0, 0), font=FONT)
        else: g.ellipse([x - 7, y - 7, x + 7, y + 7], fill=(255, 255, 255, 255), outline=(0, 0, 0, 255), width=2)
        if label and n[2] != 'route_anchor': g.text((x + 15, y - 8), id_, fill=(255, 255, 255), font=FONT_S, stroke_width=2, stroke_fill=(0, 0, 0))

def legend(im, title, sub, color_mode):
    g = ImageDraw.Draw(im, 'RGBA'); g.rectangle([0, 0, W, 86], fill=(0, 0, 0, 170))
    g.text((14, 8), title, fill=(255, 255, 255), font=FONT_B); g.text((14, 48), sub, fill=(255, 240, 200), font=FONT_S)
    y = 92
    if color_mode == 'zone':
        for k, lab in [('surface_early', '海面（序盤）'), ('descent', '下降／上昇（潮の塔・螺旋塔）'), ('undersea', '海底（ガラス回廊・遺跡）'), ('surface_late', '海面（会場前）')]:
            g.rectangle([14, y, 44, y + 14], fill=ZONE_COLOR[k] + (255,)); g.text((50, y - 3), lab, fill=(255, 255, 255), font=FONT_S, stroke_width=2, stroke_fill=(0, 0, 0)); y += 20
        g.text((14, y - 1), '破線＝寄り道（行き止まり・帰りもサイコロ）  中に白線＝条件つきの道（Q の奇偶／挑戦の成否／隠れ家）  中に緑線＝探索路', fill=(255, 255, 255), font=FONT_S, stroke_width=2, stroke_fill=(0, 0, 0))
    else:
        for k in 'ABC':
            g.rectangle([14, y, 44, y + 14], fill=ROUTE_COLOR[k] + (255,)); g.text((50, y - 3), f'ルート {k}：{DATA[k]["name"]}', fill=(255, 255, 255), font=FONT_S, stroke_width=2, stroke_fill=(0, 0, 0)); y += 20

for k, D in DATA.items():
    im = base(BG); draw_route(im, D)
    legend(im, f'Chapter 2 ルート {k}「{D["name"]}」設計案（未承認）', f'{len(D["nodes"])}地点・{len(D["edges"])}接続・{len(D["segments"])}区間。世界観参照（添付 02）に重ねた地理図。座標は暫定', 'zone')
    im.save(OUT / f'route_{k}_overlay.jpg', quality=86, optimize=True)
    im2 = schema_base(D); draw_route(im2, D)
    legend(im2, f'Chapter 2 ルート {k} 路線図（グラフ）', '地理と区別するための模式図。島・海底の盆地・螺旋塔・潮の塔・会場島は3ルート共通（座標は暫定）', 'zone')
    im2.save(OUT / f'route_{k}_schema.png', optimize=True)
im = base(BG)
for k, D in DATA.items(): draw_route(im, D, color=ROUTE_COLOR[k], label=False, width=5)
legend(im, 'Chapter 2 A／B／C を1枚の世界に重ねた図（設計案・未承認）', '建物・島・海底・塔・会場の位置は3ルート共通。道（橋・桟橋・回廊・遺跡の通路）だけがルートごとに違う', 'route')
im.save(OUT / 'routes_all_overlay.jpg', quality=86, optimize=True)
print('wrote', sorted(p.name for p in list(OUT.glob('route*.png')) + list(OUT.glob('route*.jpg'))))
