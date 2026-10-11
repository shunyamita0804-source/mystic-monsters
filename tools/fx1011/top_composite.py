#!/usr/bin/env python3
"""マスの上面の試作（2026-10-11）：既存の薄い立体円盤（tiles_v2/tile_blank.webp）の上面へ、メダルの中央の紋章だけを上面の傾きで重ねる。
円盤の側面・縁・厚み・影は既存のまま（tile_blank の画素をそのまま使う）。メダルの外周の金の縁・ルーン文字の輪は使わない（二重の金縁にしない）。
使い方: python3 -I tools/fx1011/top_composite.py <メダルの透過派生> <出力> [紋章の半径の割合 0.62] [彩度のしきい 70]
"""
import sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

BASE = 'assets/fields/ch1a/tiles_v2/tile_blank.webp'
CX, CY, RX, RY = 160, 107, 116, 74     # tile_blank の上面の内側の金の輪（画素で測った値）

def emblem(med, rr, sthr):
    m = med.convert('RGBA'); w, h = m.size; cx, cy = w / 2, h / 2; R = min(w, h) / 2
    a = np.asarray(m).astype(np.float32)
    yy, xx = np.mgrid[0:h, 0:w]; d = np.hypot(xx - cx, yy - cy) / (R * rr)
    rgb = a[..., :3]; mx, mn = rgb.max(2), rgb.min(2); sat = mx - mn
    # 紋章＝色の濃い（彩度の高い）光る部分。石の面（淡い茶色）は使わない
    k = np.clip((sat - sthr) / 40, 0, 1) * np.clip((mx - 90) / 60, 0, 1)
    k = ndi.gaussian_filter(k, 1.2)
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
    ew, eh = int(RX * 2 * 0.86), int(RY * 2 * 0.86)          # 上面の傾き＝縦を RY/RX に縮める
    e = e.resize((ew, eh), Image.LANCZOS)
    # 地面に置いた紋章が浮かないよう、ごく薄い影（下へ 2px）を先に置く
    sh = Image.new('RGBA', e.size, (40, 24, 8, 0)); sa = e.getchannel('A').point(lambda v: int(v * 0.35)).filter(ImageFilter.GaussianBlur(2))
    sh.putalpha(sa)
    pos = (CX - ew // 2, CY - eh // 2)
    comp = base.copy(); comp.alpha_composite(sh, (pos[0], pos[1] + 2)); comp.alpha_composite(e, pos)
    comp.putalpha(base.getchannel('A'))                      # 外形・透明度は円盤のまま（はみ出さない）
    comp.save(out, 'WEBP', quality=90, method=6)
    print(out, comp.size)

if __name__ == '__main__':
    main()
