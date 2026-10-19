# Chapter 4 巨大火山（2026-10-19 追加指令・C4_VOLCANO_TILES_4of4_FINAL.zip）→ 表示用の派生（assets/fields/ch4/art_1019/volcano_*.webp）
#   使い方：python3 -I -B tools/ch4art1019/derive_volcano.py <ZIP を展開したフォルダ>
#   原本の4枚（1536×1536 RGBA）は変えない・リポジトリに置かない。真のマスターは 2880×2880＝配置原点 TL(0,0)・TR(1344,0)・BL(0,1344)・BR(1344,1344)。
#   192px の重なりは二重に合成しない＝指示どおりの範囲だけを写す（半開区間・x,y の順）：
#     TL local[0:1440,0:1440]→out[0:1440,0:1440]・TR local[96:1536,0:1440]→out[1440:2880,0:1440]
#     BL local[0:1440,96:1536]→out[0:1440,1440:2880]・BR local[96:1536,96:1536]→out[1440:2880,1440:2880]
#   つなぎ目の検査：4つの重なりの帯が全 RGBA で一致・各タイル＝復元したマスターのその位置の切り出し（不一致 0）。描き直し・色の加工なし（縮小と WebP だけ）。
import sys, os, json, hashlib
from PIL import Image, ImageChops

SRC = sys.argv[1]
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'fields', 'ch4', 'art_1019')
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
EXPECT = {'TL': '779d7395f1078f7a35205e4dfd7de423608bdb1d4acfb7bb3ab5090048c34a98', 'TR': '67c82f4d92d46fea2a39a3bc936cc625bd510ac55abec2172d0306aff05ec478',
          'BL': '2f6a5f3f35c46fe77dc55ffc2f3f85132e0e3389cf9f0f15c57ced497b0f68e2', 'BR': 'c5ff542a570953eca13d7c0137c13f8943bc303cd8bff06dc5b6f5f38aa9d1f2'}
ORIGIN = {'TL': (0, 0), 'TR': (1344, 0), 'BL': (0, 1344), 'BR': (1344, 1344)}
CLIP = {'TL': ((0, 0, 1440, 1440), (0, 0)), 'TR': ((96, 0, 1536, 1440), (1440, 0)), 'BL': ((0, 96, 1440, 1536), (0, 1440)), 'BR': ((96, 96, 1536, 1536), (1440, 1440))}
T, orig = {}, {}
for n in ORIGIN:
    p = os.path.join(SRC, f'C4_VOLCANO_{n}_v2.png'); h = sha(p); assert h == EXPECT[n], (n, h)
    im = Image.open(p); assert im.size == (1536, 1536) and im.mode == 'RGBA', (n, im.size, im.mode)
    T[n] = im; orig[f'C4_VOLCANO_{n}_v2.png'] = {'sha256': h, 'size': [1536, 1536], 'origin': list(ORIGIN[n])}
same = lambda a, b: ImageChops.difference(a, b).getbbox() is None
seams = {
    'TL|TR': same(T['TL'].crop((1344, 0, 1536, 1536)), T['TR'].crop((0, 0, 192, 1536))),
    'BL|BR': same(T['BL'].crop((1344, 0, 1536, 1536)), T['BR'].crop((0, 0, 192, 1536))),
    'TL/BL': same(T['TL'].crop((0, 1344, 1536, 1536)), T['BL'].crop((0, 0, 1536, 192))),
    'TR/BR': same(T['TR'].crop((0, 1344, 1536, 1536)), T['BR'].crop((0, 0, 1536, 192))),
}
assert all(seams.values()), seams
M = Image.new('RGBA', (2880, 2880), (0, 0, 0, 0))
for n, (box, at) in CLIP.items(): M.paste(T[n].crop(box), at)   # paste＝置き換え（重なりは写していないので二重の合成は起きない）
back = {n: same(M.crop((x, y, x + 1536, y + 1536)), T[n]) for n, (x, y) in ORIGIN.items()}
assert all(back.values()), back
raw = hashlib.sha256(M.tobytes()).hexdigest()
bbox = M.getbbox()   # 透明な余白（上 20・下 15）
# 表示用：盤の奥に立てる山（長辺 1440・余白を切る）と、題字・出発準備のカードに重ねる小さい版（長辺 720）
def pm(im, w, h): return im.convert('RGBa').resize((w, h), Image.LANCZOS).convert('RGBA')
der = {}
C = M.crop(bbox)
for name, L in (('volcano_1440.webp', 1440), ('volcano_720.webp', 720)):
    k = L / max(C.size); im = pm(C, round(C.size[0] * k), round(C.size[1] * k))
    p = os.path.join(OUT, name); im.save(p, 'WEBP', quality=86, method=6, exact=True); der[name] = {'sha256': sha(p), 'size': list(im.size)}
json.dump({'originals': orig, 'seams_equal': seams, 'tiles_equal_master_crop': back, 'master': {'size': [2880, 2880], 'rgba_sha256': raw, 'alpha_bbox': list(bbox)}, 'derived': der},
          open(os.path.join(os.path.dirname(__file__), 'derive_volcano.json'), 'w'), ensure_ascii=False, indent=1)
print(json.dumps({'seams': seams, 'back': back, 'raw': raw, 'bbox': bbox, 'derived': der}, ensure_ascii=False))
