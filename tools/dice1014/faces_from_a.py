#!/usr/bin/env python3
"""2026-10-14 開発29（2）：立体サイコロの6面を、ユーザー指定の正式デザイン画像 A（01_サイコロ正式デザイン_原本.jpg・1024×1024）から作る（派生。原本は変えない）。
A は斜め上から見た1枚の絵（天面＝紋章・左の面＝2・右の面＝3 の3面が見える）。回る立方体の6面にそのまま貼れるのは見えている3面だけなので：
・2 の面・3 の面＝A の左の面・右の面を、面の4つの角（目で測った値）から正方形へ戻しただけ（目・金の角の飾り・真珠の地・縁の光は A のまま）
・地（4・5・6・1 の面の下地）＝2 の面から2つの目を消したもの。目のあった所へ、同じ面の目の無い所（対称の位置）の真珠の地を丸く写す（新しい絵は描かない）
・目（4・5・6）＝A の 2 の面の目（正面に近いほう）を丸く切り出し、普通のサイコロの並びに置く（A には 4〜6 の面が無い＝並びだけ作る。目の絵は A のもの）
・1 の面＝A の天面の紋章（金の輪の円盤）を切り出し、上から見たときの縦のつぶれ（A の絵は横 320：縦 186）だけを戻して円にし、地の中央へ
使い方: python3 -I tools/dice1014/faces_from_a.py <A の画像>   （リポジトリの直下で実行）
出力: assets/fields/ch1a/dice/cube_1014/face_1〜6.webp（320×320）
"""
import sys, os, hashlib
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
SRC = sys.argv[1]
OUT = 'assets/fields/ch1a/dice/cube_1014'
N, SS = 320, 2
# A の立方体の頂点（画素・目で測った値）：T＝奥の上・L1／R1＝左右の上・C＝手前の上（3面の交わる角）・L2／R2＝左右の下・B＝手前の下
T, L1, C, R1 = (510, 28), (116, 200), (505, 328), (902, 198)
L2, B, R2 = (134, 678), (506, 845), (882, 680)
A = Image.open(SRC).convert('RGB')

def unwarp(q):   # q＝左上・左下・右下・右上（PIL の QUAD）
    big = A.transform((N * SS, N * SS), Image.QUAD, [c for p in q for c in p], Image.BICUBIC)
    return big.resize((N, N), Image.LANCZOS)

def disc(r, feather):
    m = Image.new('L', (N * 4, N * 4), 0); ImageDraw.Draw(m).ellipse([N * 2 - r * 4, N * 2 - r * 4, N * 2 + r * 4, N * 2 + r * 4], fill=255)
    return m.resize((N, N), Image.LANCZOS).filter(ImageFilter.GaussianBlur(feather))

def move_patch(img, src_c, dst_c, r, feather=3):
    """img の src_c を中心とする半径 r の丸を dst_c へ写す（縁はぼかして溶かす）"""
    sx, sy = src_c; dx, dy = dst_c
    patch = img.crop((sx - N // 2, sy - N // 2, sx + N // 2, sy + N // 2))
    mask = disc(r, feather)
    out = img.copy(); out.paste(patch, (dx - N // 2, dy - N // 2), mask)
    return out

def clean_border(img, w=16):
    """A の白い背景が面の縁（丸い角の外側）に少し入る＝縁から w 画素の中の「白い背景」だけを内側の色で埋める（OpenCV の inpaint）"""
    import cv2
    a = np.asarray(img.convert('RGB')).astype(np.int16)
    mn, mx = a.min(2), a.max(2)
    bg = (mn > 232) & ((mx - mn) < 20)
    yy, xx = np.mgrid[0:N, 0:N]; near = np.minimum(np.minimum(xx, N - 1 - xx), np.minimum(yy, N - 1 - yy)) < w
    m = ((bg & near) * 255).astype(np.uint8)
    m = cv2.dilate(m, np.ones((3, 3), np.uint8))
    out = cv2.inpaint(np.asarray(img.convert('RGB'))[:, :, ::-1].copy(), m, 5, cv2.INPAINT_TELEA)[:, :, ::-1]
    return Image.fromarray(out, 'RGB')

def fill_pips(img, centers, r):
    import cv2
    a = np.asarray(img.convert('RGB'))[:, :, ::-1].copy()
    m = np.zeros(a.shape[:2], np.uint8)
    for cx, cy in centers: cv2.circle(m, (cx, cy), r, 255, -1)
    out = cv2.inpaint(a, m, 9, cv2.INPAINT_TELEA).astype(np.float32)
    out = np.clip(out, 0, 255).astype(np.uint8)[:, :, ::-1]
    return Image.fromarray(out, 'RGB')

def main():
    os.makedirs(OUT, exist_ok=True)
    f2 = clean_border(unwarp([L1, L2, B, C]))   # 左の面（2）
    f3 = clean_border(unwarp([C, B, R2, R1]))   # 右の面（3）
    k = N / 512
    # 2 の面の目（中心・半径。320 の面の画素）
    P1, P2, PR = (97, 122), (201, 211), 48   # 目の輪の外側まで（2 の面・320 の画素で測った値）
    # 地：目を消す（目の輪の外側までを、まわりの真珠の地から埋める＝OpenCV の inpaint（Telea）。埋めた所は少しなめらか＝目を置く面（4・5・6）では目の下にほぼ隠れる）
    base = fill_pips(f2, [P1, P2], PR + 6)
    # 目の絵（2 の面の右下の目＝正面に近い）
    pip = f2.crop((P2[0] - PR - 2, P2[1] - PR - 2, P2[0] + PR + 2, P2[1] + PR + 2)).convert('RGBA')
    pm = Image.new('L', pip.size, 0); ImageDraw.Draw(pm).ellipse([3, 3, pip.width - 3, pip.height - 3], fill=255)
    pip.putalpha(pm.filter(ImageFilter.GaussianBlur(1.6)))
    D = round(N * 0.245); pipS = pip.resize((D, D), Image.LANCZOS)
    POS = {4: [(.31, .31), (.69, .31), (.31, .69), (.69, .69)], 5: [(.3, .3), (.7, .3), (.5, .5), (.3, .7), (.7, .7)],
           6: [(.31, .25), (.69, .25), (.31, .5), (.69, .5), (.31, .75), (.69, .75)]}
    faces = {2: f2.convert('RGBA'), 3: f3.convert('RGBA')}
    for v, ps in POS.items():
        o = base.convert('RGBA')
        for x, y in ps: o.alpha_composite(pipS, (round(x * N - D / 2), round(y * N - D / 2)))
        faces[v] = o
    # 1：天面の紋章（金の輪の円盤＝A の 344〜668 × 92〜280）。縦のつぶれを戻して円に
    box = (342, 90, 670, 282)
    em = A.crop(box); W, H = em.size
    em = em.resize((W, W), Image.LANCZOS).convert('RGBA')
    m = Image.new('L', (W, W), 0); ImageDraw.Draw(m).ellipse([4, 4, W - 4, W - 4], fill=255)
    em.putalpha(m.filter(ImageFilter.GaussianBlur(2)))
    E = round(N * 0.66); em = em.resize((E, E), Image.LANCZOS)
    o = base.convert('RGBA'); o.alpha_composite(em, ((N - E) // 2, (N - E) // 2)); faces[1] = o
    rows = []
    for v in range(1, 7):
        p = f'{OUT}/face_{v}.webp'; faces[v].convert('RGB').save(p, 'WEBP', quality=90, method=6)
        rows.append((v, hashlib.sha256(open(p, 'rb').read()).hexdigest()))
    print('A sha256', hashlib.sha256(open(SRC, 'rb').read()).hexdigest())
    for v, h in rows: print(f'face_{v}.webp {h}')

if __name__ == '__main__':
    main()
