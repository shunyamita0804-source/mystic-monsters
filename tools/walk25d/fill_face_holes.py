# 2026-10-12 試遊：対戦表・市場の入手演出の顔（faces_25d）の目が透けていた＝透過処理で抜けた「囲まれた小さな穴」だけを白で埋める（外につながる透明・大きなすき間は埋めない）
#   使い方：python3 -I tools/walk25d/fill_face_holes.py <穴の最大の画素数（600）> <WebP …>（上書き）
import sys, numpy as np
from PIL import Image
def fill(p, out, thr=200):
    im = Image.open(p).convert('RGBA'); A = np.asarray(im).copy(); a = A[..., 3]
    t = a < thr
    r = np.zeros_like(t); r[0, :] = t[0, :]; r[-1, :] = t[-1, :]; r[:, 0] = t[:, 0]; r[:, -1] = t[:, -1]
    while True:
        d = r.copy(); d[1:] |= r[:-1]; d[:-1] |= r[1:]; d[:, 1:] |= r[:, :-1]; d[:, :-1] |= r[:, 1:]; d &= t
        if (d == r).all(): break
        r = d
    cand = t & ~r
    # 囲まれた透明の部分を1つずつ（小さい穴＝目の白目などだけ。大きいすき間＝本来の背景は埋めない）
    hole = np.zeros_like(cand); h, w = cand.shape; seen = np.zeros_like(cand); n = 0
    from collections import deque
    for y0, x0 in zip(*np.nonzero(cand)):
        if seen[y0, x0]: continue
        q = deque([(y0, x0)]); seen[y0, x0] = True; comp = []
        while q:
            y, x = q.popleft(); comp.append((y, x))
            for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
                yy, xx = y+dy, x+dx
                if 0 <= yy < h and 0 <= xx < w and cand[yy, xx] and not seen[yy, xx]: seen[yy, xx] = True; q.append((yy, xx))
        if len(comp) <= int(sys.argv[1]):
            for y, x in comp: hole[y, x] = True
            n += len(comp)
    # 穴は白で埋める（目の白目など＝透過処理で抜けた白）。半透明の縁は白と重ねる
    al = a[hole].astype(float)[:, None] / 255
    A[hole, :3] = (A[hole, :3] * al + 255 * (1 - al)).astype(np.uint8); A[hole, 3] = 255
    Image.fromarray(A).save(out, 'WEBP', quality=90, alpha_quality=100, method=6)
    return n
for p in sys.argv[2:]:
    print(p, fill(p, p))
