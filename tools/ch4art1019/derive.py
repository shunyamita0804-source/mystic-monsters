# Chapter 4「灼熱の火山」正式素材（2026-10-19 納品 Mismon_Ch4_FINAL_20261019 PART01／PART02 と修正差分）→ 表示用の派生（assets/fields/ch4/art_1019/）
#   使い方：python3 -I -B tools/ch4art1019/derive.py <PART01 を展開したフォルダ> <PART02 を展開したフォルダ> <修正差分を展開したフォルダ>
#   原本の PNG は変えない・リポジトリに置かない（原本と派生の sha256 は derive.json と README.md）。絵は描き直さない（余白の切り詰め・縮小・WebP だけ）
#   C4_UI_01_EVENT_BASE_v2（市松の焼き込み・不透明）は使わない＝修正差分の v3_ALPHA を使う。橋の床は v2 と v3_CANDIDATE の両方を作って盤の上で比べる（README に採否）
import sys, os, glob, json, hashlib
from PIL import Image

SRC = sys.argv[1:4]
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'fields', 'ch4', 'art_1019')
os.makedirs(OUT, exist_ok=True)
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
def find(name):
    r = [p for s in SRC for p in glob.glob(os.path.join(s, '**', name), recursive=True)]
    assert len(r) == 1, (name, r); return r[0]
def pm(im, w, h): return im.convert('RGBa').resize((w, h), Image.LANCZOS).convert('RGBA')
orig, der = {}, {}
def put(of, im, q=86, lossless=False):
    p = os.path.join(OUT, of); im.save(p, 'WEBP', quality=q, method=6, exact=True, lossless=lossless); der[of] = {'sha256': sha(p), 'size': list(im.size)}
# (原本の名前, 派生の名前, 方法, 引数)：tile＝くり返しの地面（不透明・正方形のまま縮小）／crop＝透明な余白を切って長辺 n／fit＝縮小だけ
JOBS = [
    ('C4_TERR_01_BASE_v2.png', 'ground_basalt.webp', 'tile', 512),
    ('C4_ROAD_01_ALT_BASALT_v2.png', 'road_basalt.webp', 'tile', 512),
    ('C4_ROAD_03_CENTER_BLEND_v2.png', 'plaza_disc.webp', 'crop', 512),
    ('C4_ROAD_03_T_FILL_v3.png', 'road_t_fill.webp', 'crop', 512),
    ('C4_ROAD_03_Y_FILL_v3.png', 'road_y_fill.webp', 'crop', 512),
    ('STD_C4_ROAD_02_L_1536x1024.png', 'curb_l.webp', 'crop', 1024),
    ('STD_C4_ROAD_02_R_1536x1024.png', 'curb_r.webp', 'crop', 1024),
    ('C4_ROAD_04_BRIDGE_DECK_v2.png', 'bridge_deck_v2.webp', 'crop', 768),
    ('C4_ROAD_04_BRIDGE_DECK_v3_CANDIDATE.png', 'bridge_deck_v3.webp', 'crop', 768),
    ('C4_ROAD_05_RAIL_L_1536x1024.png', 'rail_l.webp', 'crop', 1024),
    ('C4_ROAD_05_RAIL_R_1536x1024.png', 'rail_r.webp', 'crop', 1024),
    ('STD_C4_TERR_03_2048x1536.png', 'rock_cliff.webp', 'crop', 768),
    ('STD_C4_TERR_04_1536x1024.png', 'lava_ridge.webp', 'crop', 768),
    ('STD_C4_BG_01_DUSK_2048x3072.png', 'sky_dusk.webp', 'fit', 960),
    ('STD_C4_BG_02_NIGHT_2048x3072.png', 'sky_night.webp', 'fit', 960),
    ('C4_ARCH_03_GOAL_GATE_v2.png', 'goal_gate.webp', 'crop', 720),
    ('C4_UI_01_EVENT_BASE_v3_ALPHA.png', 'event_base.webp', 'crop', 384),
    ('STD_C4_UI_02_1024x1024.png', 'signpost.webp', 'crop', 384),
    ('C4_FX_01_SMOKE_BACK.png', 'smoke_back.webp', 'crop', 512),
]
for src, of, how, n in JOBS:
    p = find(src); orig[src] = {'file': os.path.relpath(p, os.path.commonpath(SRC)), 'sha256': sha(p)}
    im = Image.open(p)
    if how == 'tile':
        put(of, im.convert('RGB').resize((n, n), Image.LANCZOS), 88)
    elif how == 'fit':
        s = n / max(im.size); put(of, im.convert('RGB').resize((round(im.width * s), round(im.height * s)), Image.LANCZOS), 84)
    else:
        im = im.convert('RGBA'); bb = im.getchannel('A').point(lambda v: 255 if v > 2 else 0).getbbox(); t = im.crop(bb)
        s = min(1, n / max(t.size)); put(of, pm(t, max(1, round(t.width * s)), max(1, round(t.height * s))), 90)
        der[of]['crop'] = list(bb)
assert not any('EVENT_BASE_v2' in k for k in orig)   # 市松の焼き込みの v2 は使わない
json.dump({'originals': orig, 'derived': der}, open(os.path.join(ROOT, 'tools', 'ch4art1019', 'derive.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', len(der), sum(os.path.getsize(os.path.join(OUT, k)) for k in der) // 1024, 'KB')
