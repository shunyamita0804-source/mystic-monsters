#!/usr/bin/env python3
"""2026-10-14 Chapter 1 A/B/C 高品質化：正式13点（ユーザー納品の PNG・1024×1024）から表示用の派生 WebP を作る。

  python3 -I tools/boardhq1014/derive.py <原本PNGのフォルダ> <出力 assets/fields/ch1a/board_hq_1014> [<確認画像の出力フォルダ>]

  原本は読むだけ（編集・上書きしない・リポジトリに置かない）。
  ・地面のくり返し7点（草 A1〜A3・石道 R1／R2・湿地 W1／W2）：
      1) 全体の明るさの傾き（平面）を引く＝くり返したときの縞を防ぐ（平均の色は変えない）
      2) 端の重なりの帯（B 画素）で「誤差が最小になる切れ目」を探して左右・上下をつなぐ（image quilting の最小誤差境界。
         切れ目の両側は同じ絵の別の場所＝ぼかして重ねないので二重像にならない。切れ目はくり返しの向きに周期的）
      3) 3×3 に並べてから縮小して中央を切る（縮小でも周期のまま）
  ・道の帯（strip）：既存の strip_road_stone.webp の縁石（上 0〜47・下 199〜255 行）はそのまま、間の敷石だけを R1／R2 に入れ替える。
      長さは R のくり返しの整数倍（帯の長さの向きに周期）。道の曲がり・分かれ目の描き方（stripAlong）は変えない
  ・景物6点（木 T1／T2・岩柱 RP1／RP2・花 F1／F2）：透明の余白を切る → 乗算済みのアルファで縮小（白・黒のふちを出さない）
"""
import hashlib
import json
import os
import sys

import numpy as np
from PIL import Image

SRC = {
    'A1': '01_草地ベース_A1_明るい草原.png', 'A2': '02_草地ベース_A2_花や草が少し多い草原.png', 'A3': '03_草地ベース_A3_少し乾いた草原.png',
    'R1': '04_石道ベース_R1_標準石畳.png', 'R2': '05_石道ベース_R2_少し上質な石畳.png',
    'W1': '06_湿地池ベース_W1_明るめの湿地.png', 'W2': '07_湿地池ベース_W2_少し深い湿地.png',
    'T1': '08_広葉樹_T1_標準大樹.png', 'T2': '09_広葉樹_T2_少し丸みのある樹木.png',
    'RP1': '10_岩柱_RP1_標準岩柱.png', 'RP2': '11_岩柱_RP2_少し大きめの岩柱.png',
    'F1': '12_花群_F1_白黄の小花群.png', 'F2': '13_花群_F2_青白黄の花群.png',
}
BAND = 112          # 重なりの帯（原本 1024 の画素）
FEATHER = 2         # 切れ目のぼかし（画素・切れ目に垂直な向きだけ）
TEX = {             # 出力名・出力の大きさ（px）
    'A1': ('ground_a1.webp', 512), 'A2': ('ground_a2.webp', 512), 'A3': ('ground_a3.webp', 512),
    'W1': ('water_w1.webp', 320), 'W2': ('water_w2.webp', 320),
    'R1': ('road_r1.webp', 256), 'R2': ('road_r2.webp', 256),
}
STRIP = {'R1': 'strip_r1.webp', 'R2': 'strip_r2.webp'}
STRIP_H = 128       # 帯の高さ（px）。canvas では 23単位 × 2px＝46px に描く＝縮小は前もって良い方法で
STRIP_TILE = 640    # 元の帯（高さ 256）に対する R のくり返し1枚の大きさ（px）＝石の大きさを既存の帯にそろえる
CURB = (47, 199)    # 既存の帯（高さ 256）の縁石の内側の行（この間を入れ替える）
PROPS = {           # 出力名・長い辺（px）
    'T1': ('tree_t1.webp', 400), 'T2': ('tree_t2.webp', 400),
    'RP1': ('rockpillar_rp1.webp', 448), 'RP2': ('rockpillar_rp2.webp', 448),
    'F1': ('flowers_f1.webp', 352), 'F2': ('flowers_f2.webp', 352),
}


def sha(p):
    with open(p, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


def detrend(a):
    """各色の平面（a + b x + c y）を引いて平均へ戻す＝くり返したときの明暗の縞を防ぐ"""
    h, w, _ = a.shape
    yy, xx = np.mgrid[0:h, 0:w]
    X = np.stack([np.ones(h * w), (xx.ravel() - w / 2) / w, (yy.ravel() - h / 2) / h], 1)
    out = a.copy()
    for ch in range(3):
        coef, *_ = np.linalg.lstsq(X, a[:, :, ch].ravel(), rcond=None)
        out[:, :, ch] -= (X[:, 1:] @ coef[1:]).reshape(h, w)
    return out


def cut_path(err, margin):
    """err（行 L × 帯 B）を上から下へ通る最小誤差の切れ目（各行の列 c・|Δc|≤1・最初と最後の行で同じ列＝周期）"""
    L, B = err.shape
    lo, hi = margin, B - margin
    cols = np.arange(B)
    best = (np.inf, None)
    starts = np.arange(lo, hi)
    S = len(starts)
    big = 1e18
    cost = np.full((S, B), big)
    cost[np.arange(S), starts] = err[0, starts]
    back = np.zeros((L, S, B), dtype=np.int8)
    for r in range(1, L):
        left = np.concatenate([np.full((S, 1), big), cost[:, :-1]], 1)
        right = np.concatenate([cost[:, 1:], np.full((S, 1), big)], 1)
        st = np.stack([left, cost, right], 0)
        k = st.argmin(0)
        cost = st.min(0) + err[r][None, :]
        cost[:, :lo] = big
        cost[:, hi:] = big
        back[r] = (k - 1).astype(np.int8)
    for i, s in enumerate(starts):
        if cost[i, s] < best[0]:
            best = (cost[i, s], i)
    i = best[1]
    path = np.zeros(L, dtype=int)
    c = starts[i]
    for r in range(L - 1, -1, -1):
        path[r] = c
        if r:
            c = c + back[r, i, c]
    return path


def periodic_x(a, band):
    """左右を最小誤差の切れ目でつなぐ（幅 N → N−band）"""
    h, n, _ = a.shape
    m = n - band
    A, Bs = a[:, :band], a[:, m:n]          # A＝左の帯（右へ続く）・Bs＝右の帯（左の端の先＝くり返しで左へ続く）
    err = ((A - Bs) ** 2).sum(2)
    path = cut_path(err, 6)
    j = np.arange(band)[None, :]
    mask = (j >= path[:, None]).astype(float)   # 1＝A（切れ目より右）・0＝Bs
    if FEATHER:
        k = 2 * FEATHER + 1
        pad = np.pad(mask, ((0, 0), (FEATHER, FEATHER)), mode='edge')
        mask = sum(pad[:, i:i + band] for i in range(k)) / k
    out = a[:, :m].copy()
    out[:, :band] = A * mask[:, :, None] + Bs * (1 - mask[:, :, None])
    return out


def periodic(a, band):
    a = periodic_x(a, band)
    a = periodic_x(a.transpose(1, 0, 2), band).transpose(1, 0, 2)
    return a


def resize_periodic(a, size):
    """周期の絵を周期のまま縮小（3×3 に並べて縮小 → 中央）"""
    t = np.tile(a, (3, 3, 1))
    im = Image.fromarray(np.clip(t, 0, 255).astype(np.uint8)).resize((size * 3, size * 3), Image.LANCZOS)
    return im.crop((size, size, size * 2, size * 2))


def seam_score(im):
    a = np.asarray(im.convert('RGB')).astype(float)
    inner = (np.abs(np.diff(a, axis=1)).mean() + np.abs(np.diff(a, axis=0)).mean()) / 2
    edge = (np.abs(a[:, 0] - a[:, -1]).mean() + np.abs(a[0] - a[-1]).mean()) / 2
    return round(float(edge), 2), round(float(inner), 2)


def texture(src, size):
    a = np.asarray(Image.open(src).convert('RGB')).astype(float)
    a = periodic(detrend(a), BAND)
    return resize_periodic(a, size), a


def strip(old_strip, rtex):
    """既存の帯の縁石＋R の敷石（rtex＝周期の R・原本の解像度）"""
    old = Image.open(old_strip).convert('RGBA')
    n = rtex.shape[0]
    reps = 3
    L = STRIP_TILE * reps                      # 長さ（高さ 256 のときの px）
    # 縁石：元の帯は両端の約 70px が二重像（前のつなぎ目のぼかし）＝端の 80px を捨てて最小誤差の切れ目でつなぎ直し、長さを合わせる
    oa = np.asarray(old).astype(float)[:, 80:old.width - 80]
    oa = periodic_x(oa, 120)
    t3 = Image.fromarray(np.tile(oa, (1, 3, 1)).clip(0, 255).astype(np.uint8), 'RGBA').convert('RGBa').resize((L * 3, 256), Image.LANCZOS).convert('RGBA')
    cur = t3.crop((L, 0, L * 2, 256))
    tile = Image.fromarray(np.clip(rtex, 0, 255).astype(np.uint8)).resize((STRIP_TILE, STRIP_TILE), Image.LANCZOS)
    pave = Image.new('RGBA', (L, 256))
    for i in range(reps):
        pave.paste(tile.crop((0, (STRIP_TILE - 256) // 2, STRIP_TILE, (STRIP_TILE - 256) // 2 + 256)), (i * STRIP_TILE, 0))
    # 縁石の範囲（上と下）だけ既存の帯を重ねる（内側のふち 3px はぼかす＝縁石の影と草の芽はそのまま残る）
    y = np.arange(256).astype(float)
    wt = np.clip((CURB[0] + 1 - y) / 4 + 0.5, 0, 1)        # 上の縁石（1）→ 敷石（0）を 4px で
    wb = np.clip((y - (CURB[1] - 1)) / 4 + 0.5, 0, 1)      # 敷石（0）→ 下の縁石（1）
    w = np.maximum(wt, wb)[:, None]
    ca = np.asarray(cur).astype(float)
    pa = np.asarray(pave).astype(float)
    rgb = ca[:, :, :3] * w[:, :, None] + pa[:, :, :3] * (1 - w[:, :, None])
    alpha = ca[:, :, 3] * w + 255 * (1 - w)
    out = Image.fromarray(np.dstack([rgb, alpha]).clip(0, 255).astype(np.uint8), 'RGBA')
    # 長さの向きに周期のまま縮小（3 本つないで縮小 → 中央）
    ow = round(L * STRIP_H / 256)
    t = Image.new('RGBA', (L * 3, 256))
    for i in range(3):
        t.paste(out, (i * L, 0))
    t = t.convert('RGBa').resize((ow * 3, STRIP_H), Image.LANCZOS).convert('RGBA')
    return t.crop((ow, 0, ow * 2, STRIP_H))


def prop(src, longest):
    im = Image.open(src).convert('RGBA')
    bb = im.getchannel('A').point(lambda v: 255 if v > 8 else 0).getbbox()
    pad = 6
    bb = (max(0, bb[0] - pad), max(0, bb[1] - pad), min(im.width, bb[2] + pad), min(im.height, bb[3]))   # 下は余白なし＝足もと＝絵の下端
    im = im.crop(bb)
    s = longest / max(im.size)
    im = im.convert('RGBa').resize((round(im.width * s), round(im.height * s)), Image.LANCZOS).convert('RGBA')
    return im


def fringe(im):
    """半透明のふち（0<α<160）の色：白っぽい（全色≥225）・黒っぽい（全色≤28）の割合"""
    a = np.asarray(im).astype(int)
    m = (a[:, :, 3] > 0) & (a[:, :, 3] < 160)
    if not m.any():
        return 0.0, 0.0
    c = a[m][:, :3]
    return round(float(((c >= 225).all(1)).mean()), 4), round(float(((c <= 28).all(1)).mean()), 4)


def main():
    src, dst = sys.argv[1], sys.argv[2]
    chk = sys.argv[3] if len(sys.argv) > 3 else None
    os.makedirs(dst, exist_ok=True)
    if chk:
        os.makedirs(chk, exist_ok=True)
    report = {}
    old_strip = os.path.join(os.path.dirname(__file__), '..', '..', 'assets', 'proto', 'board_art_1010', 'strip_road_stone.webp')
    for key, (name, size) in TEX.items():
        p = os.path.join(src, SRC[key])
        out, full = texture(p, size)
        op = os.path.join(dst, name)
        out.save(op, 'WEBP', quality=86, method=6)
        report[key] = {'src': SRC[key], 'src_sha256': sha(p), 'out': name, 'size': list(out.size), 'out_sha256': sha(op), 'bytes': os.path.getsize(op),
                       'seam_before': seam_score(Image.open(p).resize((size, size), Image.LANCZOS)), 'seam_after': seam_score(Image.open(op))}
        if key in STRIP:
            sp = os.path.join(dst, STRIP[key])
            strip(old_strip, full).save(sp, 'WEBP', quality=86, method=6, alpha_quality=100)
            report[key + '_strip'] = {'src': SRC[key] + ' ＋ assets/proto/board_art_1010/strip_road_stone.webp（縁石）', 'out': STRIP[key],
                                      'size': list(Image.open(sp).size), 'out_sha256': sha(sp), 'bytes': os.path.getsize(sp)}
        if chk:   # 2×2・4×4 のくり返し（前＝原本を縮小しただけ／後＝派生）
            for nn in (2, 4):
                cell = 1024 // nn
                before = Image.open(p).convert('RGB').resize((cell, cell), Image.LANCZOS)
                after = Image.open(op).convert('RGB').resize((cell, cell), Image.LANCZOS)
                sheet = Image.new('RGB', (2048 + 16, 1024), (255, 255, 255))
                for i in range(nn):
                    for j in range(nn):
                        sheet.paste(before, (i * cell, j * cell))
                        sheet.paste(after, (1024 + 16 + i * cell, j * cell))
                sheet.save(os.path.join(chk, f'tile{nn}x{nn}_{key}.png'))
    for key, (name, longest) in PROPS.items():
        p = os.path.join(src, SRC[key])
        out = prop(p, longest)
        op = os.path.join(dst, name)
        out.save(op, 'WEBP', quality=88, method=6, alpha_quality=100)
        report[key] = {'src': SRC[key], 'src_sha256': sha(p), 'out': name, 'size': list(out.size), 'out_sha256': sha(op), 'bytes': os.path.getsize(op),
                       'fringe_white_black': fringe(Image.open(op))}
    print(json.dumps(report, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
