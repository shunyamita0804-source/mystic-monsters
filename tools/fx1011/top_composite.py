#!/usr/bin/env python3
"""マスの上面の試作（2026-10-11）：既存の薄い立体円盤（tiles_v2/tile_blank.webp）の上面へ、メダルの中央の紋章だけを上面の傾きで重ねる。
円盤の側面・縁・厚み・影は既存のまま（tile_blank の画素をそのまま使う）。メダルの外周の金の縁・ルーン文字の輪は使わない（二重の金縁にしない）。
使い方: python3 -I tools/fx1011/top_composite.py <メダルの透過派生> <出力> [紋章の半径の割合 0.62] [彩度のしきい 70] [金の輪に届く割合（省略＝従来の 0.86 倍の箱）]
"""
import sys
import numpy as np
from PIL import Image, ImageFilter
try:
    from scipy import ndimage as ndi
except ImportError:   # 2026-10-14：scipy の無い環境では PIL のぼかしで同じ処理（ガウスのぼかし σ1.2）
    ndi = None
def gblur(k, sigma):
    if ndi is not None: return ndi.gaussian_filter(k, sigma)
    im = Image.fromarray(np.clip(k * 255, 0, 255).astype(np.uint8), 'L').filter(ImageFilter.GaussianBlur(sigma))
    return np.asarray(im).astype(np.float32) / 255

BASE = 'assets/fields/ch1a/tiles_v2/tile_blank.webp'
CX, CY, RX, RY = 160, 107, 116, 74     # tile_blank の上面の内側の金の輪（画素で測った値）

def emblem(med, rr, sthr):
    m = med.convert('RGBA'); w, h = m.size; cx, cy = w / 2, h / 2; R = min(w, h) / 2
    a = np.asarray(m).astype(np.float32)
    yy, xx = np.mgrid[0:h, 0:w]; d = np.hypot(xx - cx, yy - cy) / (R * rr)
    rgb = a[..., :3]; mx, mn = rgb.max(2), rgb.min(2); sat = mx - mn
    # 紋章＝色の濃い（彩度の高い）光る部分。石の面（淡い茶色）は使わない
    k = np.clip((sat - sthr) / 40, 0, 1) * np.clip((mx - 90) / 60, 0, 1)
    k = gblur(k, 1.2)
    k *= np.clip((1 - d) / 0.12, 0, 1)                      # 中央の円の外は使わない（外周の金の縁・ルーン）
    k *= a[..., 3] / 255
    out = np.dstack([rgb, k * 255]).astype(np.uint8)
    s = int(R * rr * 2); box = (int(cx - R * rr), int(cy - R * rr), int(cx - R * rr) + s, int(cy - R * rr) + s)
    return Image.fromarray(out, 'RGBA').crop(box)

def main():
    src, out = sys.argv[1], sys.argv[2]
    rr = float(sys.argv[3]) if len(sys.argv) > 3 else 0.62
    sthr = float(sys.argv[4]) if len(sys.argv) > 4 else 70
    base = Image.open(BASE).convert('RGBA')
    e = emblem(Image.open(src), rr, sthr)
    fit = float(sys.argv[5]) if len(sys.argv) > 5 else 0
    k = 0.86
    if fit > 0:   # 2026-10-14 開発29（5）：紋章の見えている部分（不透明 ≥ 25%）の外側が、上面の内側の金の輪の fit（割合）にちょうど届く大きさへ
        a = np.asarray(e.getchannel('A')).astype(np.float32); h2, w2 = a.shape
        yy, xx = np.mgrid[0:h2, 0:w2]; r = np.hypot((xx + 0.5) / w2 * 2 - 1, (yy + 0.5) / h2 * 2 - 1)
        # 紋章の「中身」の外側＝不透明さで重みを付けた半径の 92% 点（外側のうすい飾り線・光に引っぱられない）
        wgt = (a / 255) ** 2; o = np.argsort(r.ravel()); cw = np.cumsum(wgt.ravel()[o]); cw /= max(cw[-1], 1e-6)
        rm = float(r.ravel()[o][np.searchsorted(cw, 0.92)])
        k = fit / rm
    ew, eh = int(RX * 2 * k), int(RY * 2 * k)          # 上面の傾き＝縦を RY/RX に縮める
    e = e.resize((ew, eh), Image.LANCZOS)
    if fit > 0:   # 金の輪から外へは描かない（輪の 0.94〜1.0 で薄くして消す＝枠から汚くはみ出さない）。円盤の位置で測る
        ea = np.asarray(e).astype(np.float32); yy, xx = np.mgrid[0:eh, 0:ew]
        rr2 = np.hypot((xx + 0.5 - ew / 2) / RX, (yy + 0.5 - eh / 2) / RY)
        ea[..., 3] *= np.clip((1.0 - rr2) / 0.06, 0, 1); e = Image.fromarray(ea.astype(np.uint8), 'RGBA')
    # 地面に置いた紋章が浮かないよう、ごく薄い影（下へ 2px）を先に置く
    sh = Image.new('RGBA', e.size, (40, 24, 8, 0)); sa = e.getchannel('A').point(lambda v: int(v * 0.35)).filter(ImageFilter.GaussianBlur(2))
    sh.putalpha(sa)
    pos = (CX - ew // 2, CY - eh // 2)
    comp = base.copy(); comp.alpha_composite(sh, (pos[0], pos[1] + 2)); comp.alpha_composite(e, pos)
    comp.putalpha(base.getchannel('A'))                      # 外形・透明度は円盤のまま（はみ出さない）
    comp.save(out, 'WEBP', quality=90, method=6)
    print(out, comp.size, 'scale', round(k, 3))

if __name__ == '__main__':
    main()
