"""アイテム38種（本体透過 PNG・2026-10-12 納品）の表示用の派生を作る。原本は読むだけ（書き換えない）。
  python3 -I tools/items/clean_body_png.py <PNG_本体透過 のフォルダ> [出力フォルダ（既定 assets/items/body_1012）] [--png <確認用の 1024px PNG の出力先>]
処理（画素の色は変えない。白っぽい所の「不透明さ」だけを下げる＝消すか薄くする）
  1) 本体の外の半透明の白いもや：本体（不透明の所を穴埋めしたもの）の外で、半透明・白〜クリーム色（明るく彩度が低い）の画素を薄くする。
     本体の中の半透明（ダイスの面など）・色のついた光（金・青・緑）は触らない
  2) 品目ごとの追加（OPS）：外側とつながった不透明の白い地（flood）・地に残った白い点や灰色の汚れ（zone）
     （本体の白い所＝ダイスの面・白い袋・羽根・指輪の銀・魚の腹は指定しない）
  3) 小さな孤立したかけら（不透明 12px² 未満相当）を消す
  4) 256×256（LANCZOS）・WebP 品質90・アルファ品質100
"""
import sys, os, hashlib
import numpy as np
from PIL import Image
from scipy import ndimage

# 品目ごとの追加の処理（座標は 0〜1）
#  flood：外側の透明から、白〜クリーム色（min(RGB) >= lo・彩度 <= sat）の画素だけをたどって消す（boxes の中だけ）
#  main ：地を消したあとに浮いて残ったかけら（光の地に描かれていた模様の切れ端）を消す＝いちばん大きな不透明の塊（本体）の近く（約 10px）だけ残す
#  zone ：protect（守る帯＝線分 [x0,y0,x1,y1] から半径 r）の外にある、白〜灰色の画素を消す（地に残った白い点・灰色の汚れ）
OPS = {
    '05': [dict(kind='flood', boxes=[(0.49, 0.27, 0.77, 0.455), (0.63, 0.27, 0.77, 0.535)], lo=120, sat=125)],  # 右上の四角い地（煙の背景）
    '08': [dict(kind='flood', boxes=[(0.0, 0.62, 1.0, 1.0)], lo=150, sat=70)],         # ダイスの下の白い影
    '33': [dict(kind='flood', boxes=[(0.0, 0.74, 1.0, 1.0)], lo=140, sat=110)],         # ダイスの下の白い残り
    '20': [dict(kind='flood', boxes=[(0.0, 0.55, 1.0, 1.0)], lo=165, sat=70)],         # 羽根の下の白いもや
    '22': [dict(kind='zone', protect=(0.557, 0.27, 0.44, 0.85, 0.15), lo=105, sat=55)],  # 光の雲のすき間の白い点・灰色の汚れ（稲妻は守る）
    '32': [dict(kind='flood', boxes=[(0.0, 0.0, 1.0, 1.0)], lo=150, sat=100), dict(kind='main')],          # 角笛の後ろの丸いクリーム色の地
    '34': [dict(kind='flood', boxes=[(0.0, 0.0, 1.0, 1.0)], lo=150, sat=100), dict(kind='main')],          # 羅針盤の後ろのクリーム色の地
    '21': [dict(kind='flood', boxes=[(0.0, 0.0, 1.0, 1.0)], lo=150, sat=100), dict(kind='main')],          # 鍵の後ろのクリーム色の地
    '37': [dict(kind='flood', boxes=[(0.0, 0.0, 1.0, 1.0)], lo=150, sat=95)],          # 羽根の後ろのクリーム色の地（風の筋は残す。main をかけると羽根の内側まで消える）
}
SEMI_A = 235      # これ未満を半透明として扱う
PALE_LO = 150     # これより暗いもやは触らない（min(RGB)。灰色のもやは本体＝透明な玉・羽根と見分けられないので残す）
SAT_MAX = 70      # これより彩度の高い色（max-min）は触らない
SEMI_K = 0.9      # 半透明の白いもやを消す強さ（1＝全部）

def ramp(x, lo, hi):
    return np.clip((x - lo) / max(1e-6, hi - lo), 0, 1)

def boxmask(H, W, boxes):
    m = np.zeros((H, W), bool)
    for x0, y0, x1, y1 in boxes: m[int(y0 * H):int(y1 * H), int(x0 * W):int(x1 * W)] = True
    return m

def clean(im, no):
    a8 = np.asarray(im.convert('RGBA')).astype(np.float64)
    A = a8[..., 3]
    H, W = A.shape
    mn, mx = a8[..., :3].min(-1), a8[..., :3].max(-1)
    sat = mx - mn
    outside = A <= 8
    # 本体（不透明の所を穴埋めしたもの）。半透明のもやはこの外だけ消す（本体の中の半透明＝ダイスの面などは残す）
    core = ndimage.binary_fill_holes(ndimage.binary_closing(A >= SEMI_A, iterations=3))
    core = ndimage.binary_dilation(core, iterations=2)
    pale = ramp(mn, PALE_LO, PALE_LO + 50) * (1 - ramp(sat, SAT_MAX - 30, SAT_MAX))
    w = SEMI_K * pale * (A < SEMI_A) * (~core)
    for op in OPS.get(no, []):
        if op['kind'] == 'main': continue
        lo, sm = op['lo'], op['sat']
        cand = (mn >= lo) & (sat <= sm) & (A > 0)
        if op['kind'] == 'flood':
            cand &= boxmask(H, W, op['boxes'])
            seed = ndimage.binary_dilation(outside, iterations=2) & cand
            lab, _ = ndimage.label(cand)
            keep = np.unique(lab[seed]); keep = keep[keep > 0]
            reg = np.isin(lab, keep)
        else:
            x0, y0, x1, y1, r = op['protect']
            yy, xx = np.mgrid[0:H, 0:W] / np.array([H, W])[:, None, None]
            dx, dy = x1 - x0, y1 - y0
            t = np.clip(((xx - x0) * dx + (yy - y0) * dy) / (dx * dx + dy * dy), 0, 1)
            d = np.hypot(xx - (x0 + t * dx), yy - (y0 + t * dy))
            reg = cand & (d > r)
        soft = np.clip(ndimage.gaussian_filter(reg.astype(np.float64), 1.5) * 1.6, 0, 1)
        wo = soft * ramp(mn, lo - 25, lo + 20) * (1 - ramp(sat, sm - 20, sm + 10))
        w = np.maximum(w, wo)
    a = A * (1 - np.clip(w, 0, 1))
    for op in OPS.get(no, []):
        if op['kind'] != 'main': continue
        solid = ndimage.binary_closing(a > 200, iterations=4)
        lab, n = ndimage.label(solid)
        if n:
            sizes = ndimage.sum(solid, lab, range(1, n + 1))
            body = ndimage.binary_fill_holes(lab == (np.argmax(sizes) + 1))
            keep = ndimage.binary_dilation(body, iterations=int(10 * H / 1024))
            a = a * np.clip(ndimage.gaussian_filter(keep.astype(np.float64), 2.0) * 1.3, 0, 1)
    # 小さな孤立したかけら
    vis = a > 30
    lab, n = ndimage.label(vis)
    if n > 1:
        sizes = ndimage.sum(vis, lab, range(1, n + 1))
        tiny = np.isin(lab, np.nonzero(sizes < 12 * (H / 256) ** 2)[0] + 1)
        a = np.where(tiny, 0, a)
    a = np.where(a < 3, 0, a)
    out = np.dstack([a8[..., :3], np.round(a)]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')

def main():
    args = sys.argv[1:]
    png_out = None
    if '--png' in args:
        i = args.index('--png'); png_out = args[i + 1]; del args[i:i + 2]
    src = args[0]
    out = args[1] if len(args) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'items', 'body_1012')
    os.makedirs(out, exist_ok=True)
    if png_out: os.makedirs(png_out, exist_ok=True)
    files = sorted(f for f in os.listdir(src) if f.lower().endswith('.png'))
    assert len(files) == 38, len(files)
    for f in files:
        no = f[:2]
        p = os.path.join(src, f)
        sha = hashlib.sha256(open(p, 'rb').read()).hexdigest()
        im = Image.open(p); assert im.size == (1024, 1024) and im.mode == 'RGBA', (f, im.size, im.mode)
        c = clean(im, no)
        if png_out: c.save(os.path.join(png_out, f))
        s = c.resize((256, 256), Image.LANCZOS)
        dst = os.path.join(out, no + '.webp')
        s.save(dst, 'WEBP', quality=90, alpha_quality=100, method=6)
        print(no, f[3:-4], os.path.getsize(dst), sha)

if __name__ == '__main__':
    main()
