#!/usr/bin/env python3
"""Chapter 4「灼熱の火山」A／B／C の設計図（PNG）を描く（2026-10-18・設計案）。
入力：js/proto/ch4-routes.js（build_ch4_routes.py の出力）。正式の全体絵・巨大火山 TL/TR/BL/BR は未着＝背景は等高線・溶岩・区域を模式的に描いた仮の世界（世界座標 1024×1536）。
出力（既定 docs/ch4/）：route_A.png・route_B.png・route_C.png（区域の色・役割の印・区間 ID）、routes_ABC.png（3本を並べた一覧）、
      risk_ABC.png（分岐・固定マス・リスクのマップ＝運命の分かれ道・特殊挑戦・ライバル・固定報酬・隠れ家・溶岩に近い区間・橋）、sky_ABC.png（夕暮れ → 夜の空の色と高さの推移）。
実行：python3 -I tools/ch4/draw_routes.py [出力フォルダ]。描画だけ（ゲームのファイルは変えない）。"""
import json, sys, math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
R = Path(__file__).resolve().parents[2]
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else R / 'docs/ch4'; OUT.mkdir(parents=True, exist_ok=True)
src = (R / 'js/proto/ch4-routes.js').read_text(encoding='utf-8')
DATA = json.loads(src[src.index('const R = ') + 10: src.index(';\n  if (typeof module')])
W, H = 1024, 1536
def font(sz):
    for p in ('/usr/share/fonts/opentype/ipafont-gothic/ipagp.ttf', '/usr/share/fonts/truetype/fonts-japanese-gothic.ttf'):
        try: return ImageFont.truetype(p, sz)
        except Exception: pass
    return ImageFont.load_default()
FONT, FONT_S, FONT_B = font(20), font(15), font(30)
ZONE_COLOR = {'foot_dusk': (255, 196, 90), 'slope_twilight': (200, 140, 255), 'gorge_twilight': (255, 130, 90), 'rim_night': (120, 190, 255)}
ROUTE_COLOR = {'A': (255, 210, 40), 'B': (90, 255, 140), 'C': (255, 110, 200)}
ROLE_MARK = {'start': ('S', (40, 200, 90)), 'goal': ('G', (230, 60, 60)), 'free_fork': ('分', (255, 255, 255)), 'late_free_fork': ('分', (255, 255, 255)), 'parity_forced_fork': ('Q', (255, 255, 120)),
             'challenge_d6_5_6': ('挑', (255, 150, 60)), 'mandatory_rival': ('R', (230, 40, 90)), 'fixed_reward_dead_end': ('宝', (255, 220, 90)), 'optional_random_unlock_dead_end': ('隠', (200, 160, 255)),
             'lower_walk_through_gate': ('門', (160, 220, 255)), 'upper_walk_through_gate': ('門', (160, 220, 255)), 'early_merge': ('合', (220, 220, 220)), 'parity_rejoin': ('合', (220, 220, 220)), 'final_merge': ('合', (220, 220, 220)),
             'rare_zone_candidate': ('像', (255, 120, 220))}

def sky_color(h):
    """高さ → 空の色（夕暮れ 0〜40・薄暮 40〜84・夜 84〜）。設計資料用の目安（実装はしない）"""
    stops = [(0, (255, 150, 70)), (40, (190, 90, 120)), (84, (60, 50, 110)), (112, (14, 20, 48))]
    for (h0, c0), (h1, c1) in zip(stops, stops[1:]):
        if h <= h1:
            t = max(0, min(1, (h - h0) / (h1 - h0))); return tuple(round(c0[i] + (c1[i] - c0[i]) * t) for i in range(3))
    return stops[-1][1]

def base(D, dark=True):
    """仮の世界：等高線（火山の斜面）・火口・溶岩湖・溶岩流・区域。正式の絵は未着"""
    im = Image.new('RGB', (W, H), (74, 54, 44) if dark else (240, 232, 220)); g = ImageDraw.Draw(im, 'RGBA')
    art = D['art']; cx, cy = art['summit']
    for c in sorted(art['contours'], key=lambda c: -c['rx']):
        k = c['elev'] / 112
        col = (round(74 + 60 * k), round(54 + 30 * k), round(44 + 16 * k), 255)
        g.ellipse([cx - c['rx'], cy - c['ry'], cx + c['rx'], cy + c['ry']], fill=col, outline=(120, 90, 70, 180))
        g.text((cx + c['rx'] - 70, cy - 10), f'h{c["elev"]}', fill=(230, 210, 180), font=FONT_S)
    cr = art['crater']; g.ellipse([cr['c'][0] - cr['rx'], cr['c'][1] - cr['ry'], cr['c'][0] + cr['rx'], cr['c'][1] + cr['ry']], fill=(50, 32, 30, 255), outline=(150, 100, 80, 255), width=3)
    for L in art['lava']:
        g.polygon([tuple(p) for p in L['poly']], fill=(255, 110, 20, 230), outline=(255, 220, 120, 255))
        p0 = L['poly'][0]; g.text((p0[0] + 6, p0[1] + 4), L['id'], fill=(255, 240, 200), font=FONT_S, stroke_width=2, stroke_fill=(90, 30, 0))
    for reg in art['regions']:
        col = {'village': (190, 170, 120), 'ash': (160, 150, 140), 'obsidian': (70, 60, 80), 'fumarole': (200, 170, 110), 'temple': (170, 110, 90), 'tower': (140, 120, 100), 'arena': (230, 200, 120)}.get(reg['kind'], (120, 120, 120))
        g.polygon([tuple(p) for p in reg['poly']], fill=col + (110,), outline=col + (220,))
        x = sum(p[0] for p in reg['poly']) / len(reg['poly']); y = sum(p[1] for p in reg['poly']) / len(reg['poly'])
        g.text((x - 40, y - 8), reg['id'], fill=(255, 255, 255), font=FONT_S, stroke_width=2, stroke_fill=(0, 0, 0))
    return im

def seg_zone(D, sid): return D['art']['zoneOf'].get(sid, 'foot_dusk')

def draw_route(im, D, color=None, label=True, width=7, risk=False):
    g = ImageDraw.Draw(im, 'RGBA')
    N, S = D['nodes'], D['segments']
    lava = D['art']['lava']
    def near_lava(pts):
        for L in lava:
            for p in pts:
                if min(math.dist(p, L['poly'][i]) for i in range(len(L['poly']))) < 60: return True
        return False
    for sid, s in S.items():
        pts = [tuple(N[i][:2]) for i in s[3]]
        c = color or ZONE_COLOR[seg_zone(D, sid)]
        spur = s[2] in ('reward_spur', 'optional_random_spur'); bridge = 'bridge' in s[2]
        cond = next((e[4] for e in D['edges'] if e[2] == sid), 'always')
        if risk:
            c = (255, 90, 60) if (bridge or near_lava(pts)) else (160, 160, 160)
            if cond != 'always': c = (255, 230, 80) if cond.startswith('Q_') else (255, 150, 60)
        g.line(pts, fill=(0, 0, 0, 160), width=width + 4)
        if spur:
            for i in range(len(pts) - 1):
                if i % 2 == 0: g.line([pts[i], pts[i + 1]], fill=c + (255,), width=width)
        else: g.line(pts, fill=c + (255,), width=width)
        if cond != 'always': g.line(pts, fill=(255, 255, 255, 200), width=2)
        if sid in (D.get('explore') or {}): g.line(pts, fill=(60, 220, 110, 255), width=3)
        if bridge:
            for p in pts[1:-1]: g.rectangle([p[0] - 5, p[1] - 5, p[0] + 5, p[1] + 5], fill=(255, 255, 255, 255), outline=(0, 0, 0, 255))
        else:
            for p in pts[1:-1]: g.ellipse([p[0] - 3, p[1] - 3, p[0] + 3, p[1] + 3], fill=(255, 255, 255, 220))
        if label:
            mid = pts[len(pts) // 2]; g.text((mid[0] + 6, mid[1] - 18), f'{sid}:{len(pts) - 1}', fill=(255, 255, 255), font=FONT_S, stroke_width=2, stroke_fill=(0, 0, 0))
    for id_, n in N.items():
        if n[2] == 'ordinary_tile': continue
        m = ROLE_MARK.get(n[2]); x, y = n[0], n[1]
        if m:
            g.ellipse([x - 13, y - 13, x + 13, y + 13], fill=m[1] + (255,), outline=(0, 0, 0, 255), width=2)
            g.text((x - 7 if len(m[0]) == 1 else x - 9, y - 10), m[0], fill=(0, 0, 0), font=FONT)
        else: g.ellipse([x - 7, y - 7, x + 7, y + 7], fill=(255, 255, 255, 255), outline=(0, 0, 0, 255), width=2)
        if label and n[2] != 'route_anchor': g.text((x + 15, y - 8), f'{id_} h{round(D["art"]["elev"].get(id_, 0))}', fill=(255, 255, 255), font=FONT_S, stroke_width=2, stroke_fill=(0, 0, 0))

def legend(im, title, sub, mode):
    g = ImageDraw.Draw(im, 'RGBA'); g.rectangle([0, 0, W, 86], fill=(0, 0, 0, 170))
    g.text((14, 8), title, fill=(255, 255, 255), font=FONT_B); g.text((14, 48), sub, fill=(255, 240, 200), font=FONT_S)
    y = 92
    if mode == 'zone':
        for k, lab in [('foot_dusk', '麓（夕暮れ）'), ('slope_twilight', '斜面（薄暮）'), ('gorge_twilight', '渓谷（薄暮）'), ('rim_night', '火口縁（夜）')]:
            g.rectangle([14, y, 44, y + 14], fill=ZONE_COLOR[k] + (255,)); g.text((50, y - 3), lab, fill=(255, 255, 255), font=FONT_S, stroke_width=2, stroke_fill=(0, 0, 0)); y += 20
        g.text((14, y - 1), '破線＝寄り道（行き止まり・帰りもサイコロ）  中に白線＝条件つき（Q の奇偶／挑戦の成否／隠れ家）  中に緑線＝探索路  四角の点＝溶岩の上の橋  区間 ID:歩数', fill=(255, 255, 255), font=FONT_S, stroke_width=2, stroke_fill=(0, 0, 0))
    elif mode == 'risk':
        for col, lab in [((255, 90, 60), '溶岩のきわ・溶岩の上の橋（危険地帯）'), ((255, 230, 80), '運命の分かれ道（奇数＝左／偶数＝右）'), ((255, 150, 60), '特殊挑戦の成功／失敗の道'), ((160, 160, 160), 'ふつうの道')]:
            g.rectangle([14, y, 44, y + 14], fill=col + (255,)); g.text((50, y - 3), lab, fill=(255, 255, 255), font=FONT_S, stroke_width=2, stroke_fill=(0, 0, 0)); y += 20
    else:
        for k in 'ABC':
            g.rectangle([14, y, 44, y + 14], fill=ROUTE_COLOR[k] + (255,)); g.text((50, y - 3), f'ルート {k}：{DATA[k]["name"]}', fill=(255, 255, 255), font=FONT_S, stroke_width=2, stroke_fill=(0, 0, 0)); y += 20

def sky_strip(D):
    """本線（最短）に沿った高さと空の色の推移（設計資料）"""
    S, N = D['segments'], D['nodes']; elev = D['art']['elev']
    spur = lambda k: S[k][2] in ('reward_spur', 'optional_random_spur')
    nxt = {}
    for k, v in S.items():
        if not spur(k): nxt.setdefault(v[0], []).append(k)
    best = None
    def walk(node, path, steps):
        nonlocal best
        if node == 'GOAL':
            if best is None or steps < best[1]: best = (path, steps)
            return
        for k in nxt.get(node, []): walk(S[k][1], path + [k], steps + len(S[k][3]) - 1)
    walk('START', [], 0)
    ids = []
    for k in best[0]: ids += S[k][3][:-1]
    ids.append('GOAL')
    im = Image.new('RGB', (len(ids) * 8 + 40, 140), (20, 20, 30)); g = ImageDraw.Draw(im)
    for i, nid in enumerate(ids):
        h = elev.get(nid, 0); c = sky_color(h)
        g.rectangle([20 + i * 8, 20, 28 + i * 8, 80], fill=c)
        g.rectangle([20 + i * 8, 120 - h * 0.35, 28 + i * 8, 120], fill=(120, 90, 70))
        if N[nid][2] != 'ordinary_tile': g.text((20 + i * 8, 84), nid[:6], fill=(255, 255, 255), font=font(10))
    g.text((20, 2), f'{D["route"]}「{D["name"]}」最短の本線 {best[1]} 歩：上＝空の色（夕暮れ → 薄暮 → 夜）・下＝高さ', fill=(255, 255, 255), font=FONT_S)
    return im

for k, D in DATA.items():
    im = base(D); draw_route(im, D)
    legend(im, f'Chapter 4 ルート {k}「{D["name"]}」設計案（未承認・正式全体絵は未着）', f'{len(D["nodes"])}地点・{len(D["edges"])}接続・{len(D["segments"])}区間。等高線・溶岩・区域は仮の世界座標（予約枠）', 'zone')
    im.save(OUT / f'route_{k}.png', optimize=True)
sheet = Image.new('RGB', (3 * 512 + 40, 768 + 60), (20, 20, 30)); gs = ImageDraw.Draw(sheet); gs.text((14, 10), 'Chapter 4 A／B／C 一覧（設計案・未承認）', fill=(255, 255, 255), font=FONT)
for i, (k, D) in enumerate(DATA.items()):
    im = base(D); draw_route(im, D, label=False, width=9)
    g = ImageDraw.Draw(im, 'RGBA'); g.rectangle([0, 0, W, 60], fill=(0, 0, 0, 170)); g.text((14, 10), f'{k}「{D["name"]}」', fill=(255, 255, 255), font=FONT_B)
    sheet.paste(im.resize((512, 768), Image.LANCZOS), (10 + i * 522, 50))
sheet.save(OUT / 'routes_ABC.png', optimize=True)
risk = Image.new('RGB', (3 * 512 + 40, 768 + 160), (20, 20, 30)); gr = ImageDraw.Draw(risk)
gr.text((14, 10), 'Chapter 4 分岐・固定マス・リスクのマップ（設計案）', fill=(255, 255, 255), font=FONT)
for i, (k, D) in enumerate(DATA.items()):
    im = base(D); draw_route(im, D, label=False, width=9, risk=True)
    g = ImageDraw.Draw(im, 'RGBA'); g.rectangle([0, 0, W, 60], fill=(0, 0, 0, 170)); g.text((14, 10), f'{k}「{D["name"]}」', fill=(255, 255, 255), font=FONT_B)
    risk.paste(im.resize((512, 768), Image.LANCZOS), (10 + i * 522, 50))
y = 830
for col, lab in [((255, 90, 60), '溶岩のきわ（60 単位以内）・溶岩の上の橋'), ((255, 230, 80), '運命の分かれ道の道（奇数＝左／偶数＝右）'), ((255, 150, 60), '特殊挑戦の成功／失敗の道'), ((160, 160, 160), 'ふつうの道　破線＝寄り道　S 麓・G 闘技場・Q 運命・挑 特殊挑戦・R ライバル・宝 固定報酬・隠 隠れ家・像 レアの候補・門 黒曜の門／渓谷の門／火口壁の門')]:
    gr.rectangle([14, y, 44, y + 14], fill=col); gr.text((50, y - 3), lab, fill=(255, 255, 255), font=FONT_S); y += 22
risk.save(OUT / 'risk_ABC.png', optimize=True)
strips = [sky_strip(D) for D in DATA.values()]
sky = Image.new('RGB', (max(s.width for s in strips), sum(s.height for s in strips) + 10), (20, 20, 30))
y = 0
for s in strips: sky.paste(s, (0, y)); y += s.height
sky.save(OUT / 'sky_ABC.png', optimize=True)
print('wrote', sorted(p.name for p in OUT.glob('*.png')))
