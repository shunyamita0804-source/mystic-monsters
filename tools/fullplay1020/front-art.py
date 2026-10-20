# =========================================================
# 2026-10-20 第4便：ユーザー納品の正面向きの門（E01）・道標（E02）をゲームの素材にする（テストではない道具）
#  python3 -I tools/fullplay1020/front-art.py <E01 の PNG のフォルダ> <E02 の PNG のフォルダ>（E01 を - にすると道標だけ）
#  → assets/fields/front_1020/*.webp（透明な余白を切る・柱の足もと＝絵の下の端・幅 1280／道標 512 に縮小・WebP q88）
#  道標は、絵の本体（いちばん大きいかたまり）から離れた小さな点（背景抜きの残り）を消す。色は変えない
#  最後に、各絵の縦横比（高さ ÷ 幅）と、門の口の幅（下から 5% の高さ・絵の幅に対する比）を出す（js/proto/roadfirst-world.js の FRONT に写す）
# =========================================================
import sys, os, glob
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
OUT = os.path.join(ROOT, 'assets', 'fields', 'front_1020')
os.makedirs(OUT, exist_ok=True)


def main_blob(im):
    """いちばん大きい不透明のかたまり（8 近傍）だけを残す。小さな点を消す（縮小した判定 → 元の大きさへ広げてから掛ける）"""
    a = np.array(im.split()[3]); H, W = a.shape; k = 4
    small = Image.fromarray(((a[::k, ::k] > 24) * 255).astype(np.uint8))
    s = np.array(small); seen = np.zeros_like(s, dtype=bool); best = None
    for y in range(s.shape[0]):
        for x in range(s.shape[1]):
            if s[y, x] and not seen[y, x]:
                m = Image.fromarray(s).copy(); ImageDraw.floodfill(m, (x, y), 128); comp = np.array(m) == 128
                seen |= comp; n = comp.sum()
                if best is None or n > best[0]: best = (n, comp)
    keep = Image.fromarray((best[1] * 255).astype(np.uint8)).resize((W, H), Image.NEAREST)
    keep = np.array(keep.filter(__import__('PIL.ImageFilter', fromlist=['MaxFilter']).MaxFilter(9))) > 0
    r = np.array(im); r[..., 3] = np.where(keep, r[..., 3], 0); return Image.fromarray(r)


def crop(im):
    a = np.array(im.split()[3]); ys, xs = np.where(a > 8)
    return im.crop((max(0, xs.min() - 4), max(0, ys.min() - 4), min(im.width, xs.max() + 5), ys.max() + 1))


def opening(im):
    a = np.array(im.split()[3]); H, W = a.shape; row = a[int(H * 0.95)]; c = W // 2; l = r = c
    if row[c] >= 24: return 0
    while l > 0 and row[l] < 24: l -= 1
    while r < W - 1 and row[r] < 24: r += 1
    return (r - l) / W


def run(src, prefix, width, blob):
    for f in sorted(glob.glob(os.path.join(src, prefix + '*.png'))):
        im = Image.open(f).convert('RGBA')
        if blob: im = main_blob(im)
        im = crop(im); h = round(im.height * width / im.width)
        im = im.resize((width, h), Image.LANCZOS)
        name = os.path.basename(f)[4:].replace('.png', '.webp')   # E01_ch1_seal_gate_front.png → ch1_seal_gate_front.webp
        im.save(os.path.join(OUT, name), 'WEBP', quality=88, method=6)
        print(f'{name}  {width}x{h}  ah {h / width:.3f}  open {opening(im):.3f}  {os.path.getsize(os.path.join(OUT, name)) // 1024}KB')


if sys.argv[1] != "-": run(sys.argv[1], "E01_", 1280, False)
run(sys.argv[2], 'E02_', 512, True)
