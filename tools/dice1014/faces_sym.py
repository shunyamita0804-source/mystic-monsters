#!/usr/bin/env python3
"""2026-10-14 実機試遊③（立体サイコロの立方体が歪んで見える）：開発29（2）の6面（assets/fields/ch1a/dice/cube_1014/）を左右・上下対称にそろえた派生を作る。
原因：A は斜めから見た絵を透視の補正で正方形へ戻したもの＝2・3 の面の目の大きさが面の中でそろっていない（3 の面＝66／73／76px）、角の金の飾りも面ごとに形が違う
（2・3・1 の面）。立方体に組むと角ごとに飾りの形・目の大きさが違い、回る間に「ねじれ」「台形」に見えた。
作り方（新しい絵は描かない＝cube_1014 の画素を並べ直すだけ）：
・地＝2 の面の左下の 1/4（目の無い所）を左右・上下に折り返して4つの角をそろえる（角の飾り・真珠の地・縁の光は cube_1014 の画素）
・目＝4 の面の目（cube_1014 の中でいちばん形のそろった目・65px）を丸く切り出して 0.9 倍（6 の面で目が触れない）、普通のサイコロの升目（中心から ±64px）に置く（1〜6 とも同じ大きさ）
・1 の面＝cube_1014 の 1 の面の中央の紋章（金の輪の円盤）を丸く切り出し、地の中央へ
使い方: python3 -I tools/dice1014/faces_sym.py   （リポジトリの直下で実行）
出力: assets/fields/ch1a/dice/cube_1014s/face_1〜6.webp（320×320・WebP 品質90）
"""
import os
from PIL import Image, ImageDraw, ImageFilter, ImageOps
SRC = 'assets/fields/ch1a/dice/cube_1014'
OUT = 'assets/fields/ch1a/dice/cube_1014s'
N = 320; H = N // 2
f = lambda i: Image.open(f'{SRC}/face_{i}.webp').convert('RGB')

def disc(size, r, feather):
    m = Image.new('L', (size * 4, size * 4), 0); c = size * 2
    ImageDraw.Draw(m).ellipse([c - r * 4, c - r * 4, c + r * 4, c + r * 4], fill=255)
    return m.resize((size, size), Image.LANCZOS).filter(ImageFilter.GaussianBlur(feather))

# 地：2 の面の左下の 1/4（目の無い所・角の飾りが中くらい＝いちばん手前の大きな飾りではない）を左右・上下に折り返す
q = f(2).crop((0, H, H, N))   # 左下
q.paste(q.crop((0, 24, H, 48)), (0, 0)); q.paste(q.crop((H - 48, 0, H - 24, H)), (H - 24, 0))   # 上の帯（面の中央の横の帯になる所）に左上の目の縁が少し入る＝すぐ下の真珠の地で埋める・右の帯（縦の中央の帯）には右下の目の縁＝同じく左隣の地で埋める（折り返したときに金の欠片が出ない）
base = Image.new('RGB', (N, N))
base.paste(ImageOps.flip(q), (0, 0)); base.paste(ImageOps.flip(ImageOps.mirror(q)), (H, 0))
base.paste(q, (0, H)); base.paste(ImageOps.mirror(q), (H, H))
# 目：4 の面の左上の目（中心 96,104）
PR = 40
pip = f(4).crop((96 - PR, 104 - PR, 96 + PR, 104 + PR)).resize((72, 72), Image.LANCZOS); PR = 36; pmask = disc(PR * 2, 32.5, 1.4)   # 6 の面で目が触れないよう 0.9 倍（59px）
G = 64; C = H
POS = {1: [], 2: [(-1, -1), (1, 1)], 3: [(-1, -1), (0, 0), (1, 1)], 4: [(-1, -1), (1, -1), (-1, 1), (1, 1)],
       5: [(-1, -1), (1, -1), (0, 0), (-1, 1), (1, 1)], 6: [(-1, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (1, 1)]}
os.makedirs(OUT, exist_ok=True)
for v in range(1, 7):
    im = base.copy()
    for (gx, gy) in POS[v]:
        im.paste(pip, (C + gx * G - PR, C + gy * G - PR), pmask)
    if v == 1:
        ER = 112
        em = f(1).crop((C - ER, C - ER, C + ER, C + ER)); im.paste(em, (C - ER, C - ER), disc(ER * 2, 104, 2.2))
    im.save(f'{OUT}/face_{v}.webp', 'WEBP', quality=90, method=6)
print('ok')
