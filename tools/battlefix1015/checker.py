# 2026-10-15 夜の一括依頼（技アニメ21件・D）：技アニメの透過 WebP に焼き込まれた「市松模様」（背景抜きの取り残し）を見つけて取り除く道具。
#  市松＝ほぼ無彩色・明るい（L≥205）2つの明るさ（約 228〜236 と 248〜255）が b 画素の四角で交互に並ぶ領域。
#  判定：無彩色で明るい画素のつながり（連結成分）ごとに、横・縦の自己相関で「ずらし s で負・2s で正」（＝四角の交互）を調べる。白い光（グロー）は
#  なめらかに明るさが変わるので相関が正のまま＝消さない。消すのは判定に通った成分だけ（アルファを 0・縁は1画素だけ半分に）。色・形はそれ以外さわらない。
#  使い方：python3 -I tools/battlefix1015/checker.py scan <ファイル…>  ／ fix <入力> <出力>
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

OPT = {'tol': 16, 'lmin': 205, 'edge': 0}   # tol＝無彩色とみなす色の幅・lmin＝明るさの下限・edge＝透明な所から何画素以内だけを見るか（0＝どこでも。輪郭の「縁取りの市松」用）
def masks(a):
    r, g, b, al = [a[:, :, i].astype(np.int32) for i in range(4)]
    mx = np.maximum(np.maximum(r, g), b); mn = np.minimum(np.minimum(r, g), b)
    L = (r + g + b) / 3.0
    neu = (mx - mn <= OPT['tol']) & (L >= OPT['lmin']) & (al >= 96)
    if OPT['edge']: neu &= ndi.binary_dilation(al < 16, iterations=OPT['edge'])
    return neu, L

def periodic(L, m, ys, xs):
    """成分の範囲で、横・縦の自己相関が s で負・2s で正になるか（s＝2〜10）"""
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    sub = np.where(m[y0:y1, x0:x1], L[y0:y1, x0:x1], np.nan)
    best = 0.0
    for ax in (0, 1):
        for s in range(2, 11):
            def corr(k):
                if ax == 1: A, B = sub[:, :-k], sub[:, k:]
                else: A, B = sub[:-k, :], sub[k:, :]
                ok = ~np.isnan(A) & ~np.isnan(B)
                if ok.sum() < 40: return None
                a_, b_ = A[ok] - A[ok].mean(), B[ok] - B[ok].mean()
                d = np.sqrt((a_ * a_).sum() * (b_ * b_).sum())
                return (a_ * b_).sum() / d if d > 0 else None
            c1, c2 = corr(s), corr(2 * s)
            if c1 is None or c2 is None: continue
            score = min(-c1, c2)
            best = max(best, score)
    return best

def find(a, min_area=24, thr=0.25):
    neu, L = masks(a)
    lab, n = ndi.label(ndi.binary_closing(neu, iterations=1))
    hits = []
    for i in range(1, n + 1):
        ys, xs = np.where(lab == i)
        if len(ys) < min_area: continue
        sc = periodic(L, neu & (lab == i), ys, xs)
        lo = ((L[ys, xs] >= OPT['lmin'] + 8) & (L[ys, xs] <= 240)).mean(); hi = (L[ys, xs] >= 244).mean()
        if sc >= thr and lo >= 0.15 and hi >= 0.15:
            hits.append({'area': int(len(ys)), 'score': round(float(sc), 2), 'box': [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())], 'id': i})
    return hits, lab

def fix(src, dst, glow=None):
    im = Image.open(src).convert('RGBA'); a = np.array(im)
    hits, lab = find(a)
    if not hits: return []
    kill = np.isin(lab, [h['id'] for h in hits])
    kill = ndi.binary_dilation(kill, iterations=1) & masks(a)[0] | kill
    if OPT.get('smooth'):   # 効果の絵（白い光）：消さずに、市松の四角の明るさの差だけをぼかして均す（アルファ・色味はそのまま）
        sig = OPT['smooth'] / 2.0
        reg = ndi.binary_dilation(kill, iterations=2)
        if OPT.get('smoothall'): reg |= ndi.binary_dilation(masks(a)[0], iterations=1)   # 判定に通った成分のある絵は、明るく色の薄い所をすべて均す（白い光の地に広く焼き込まれた市松）
        w = ndi.gaussian_filter(reg.astype(np.float32), sig)
        for c in range(3):
            ch = a[:, :, c].astype(np.float32)
            bl = ndi.gaussian_filter(ch * reg, sig) / np.maximum(w, 1e-6)
            a[:, :, c] = np.where(reg, np.clip(bl, 0, 255), ch).astype(np.uint8)
        Image.fromarray(a).save(dst, 'WEBP', lossless=True, quality=100, method=6)
        return hits
    edge = ndi.binary_dilation(kill, iterations=1) & ~kill
    al = a[:, :, 3].astype(np.float32)
    al[kill] = 0; al[edge] *= 0.55
    a[:, :, 3] = np.clip(al, 0, 255).astype(np.uint8)
    a[kill, :3] = 0
    if glow:   # 縁取りの市松を消した所に、なめらかな光の縁（体の形をぼかしたもの）を後ろに敷く＝新しい絵は描かない
        body = a[:, :, 3] >= 200
        soft = ndi.gaussian_filter(ndi.binary_dilation(body, iterations=3).astype(np.float32), 4.0)
        ga = np.clip(soft * 1.6, 0, 1) * glow[3]
        base = np.zeros_like(a, dtype=np.float32); base[:, :, 0], base[:, :, 1], base[:, :, 2] = glow[0], glow[1], glow[2]; base[:, :, 3] = ga * 255
        fa = a[:, :, 3:4].astype(np.float32) / 255; ba = base[:, :, 3:4] / 255
        oa = fa + ba * (1 - fa)
        rgb = (a[:, :, :3].astype(np.float32) * fa + base[:, :, :3] * ba * (1 - fa)) / np.maximum(oa, 1e-6)
        a = np.concatenate([np.clip(rgb, 0, 255), np.clip(oa * 255, 0, 255)], axis=2).astype(np.uint8)
    Image.fromarray(a).save(dst, 'WEBP', lossless=True, quality=100, method=6)
    return hits

def ring(src, dst, width=14, tol=34, lmin=180, glow=(255, 246, 214, 0.5)):
    """輪郭に沿った帯の市松（ノビトンのひとやすみの「松葉模様」）：外側の透明な所から width 画素以内の、明るく色の薄い画素をすべて消す
    （体の黄色・赤・橙は色が濃いので残る）。外に取り残された小さな点も消し、体の形をぼかした光の縁を後ろに敷く"""
    im = Image.open(src).convert('RGBA'); a = np.array(im)
    r, g, b, al = [a[:, :, i].astype(np.int32) for i in range(4)]
    mx = np.maximum(np.maximum(r, g), b); mn = np.minimum(np.minimum(r, g), b); L = (r + g + b) / 3.0
    outside = ndi.binary_fill_holes(al >= 16); outside = ~outside
    band = ndi.binary_dilation(outside, iterations=width)
    kill = band & (mx - mn <= tol) & (L >= lmin)
    keep = (al >= 16) & ~kill
    lab, n = ndi.label(keep); sizes = ndi.sum(keep, lab, range(1, n + 1))
    big = np.argmax(sizes) + 1 if n else 0
    for i, sz in enumerate(sizes, 1):
        if i != big and sz < 60: kill |= lab == i
    edge = ndi.binary_dilation(kill, iterations=1) & ~kill
    alf = a[:, :, 3].astype(np.float32); alf[kill] = 0; alf[edge] *= 0.6
    a[:, :, 3] = np.clip(alf, 0, 255).astype(np.uint8); a[kill, :3] = 0
    Image.fromarray(a).save(dst, 'WEBP', lossless=True, quality=100, method=6)
    if glow:
        OPT_SAVE = dict(OPT)
        body = a[:, :, 3] >= 200
        soft = ndi.gaussian_filter(ndi.binary_dilation(body, iterations=3).astype(np.float32), 4.0)
        ga = np.clip(soft * 1.6, 0, 1) * glow[3]
        fa = a[:, :, 3:4].astype(np.float32) / 255; ba = ga[:, :, None]
        oa = fa + ba * (1 - fa)
        col = np.array(glow[:3], dtype=np.float32)[None, None, :]
        rgb = (a[:, :, :3].astype(np.float32) * fa + col * ba * (1 - fa)) / np.maximum(oa, 1e-6)
        a = np.concatenate([np.clip(rgb, 0, 255), np.clip(oa * 255, 0, 255)], axis=2).astype(np.uint8)
        Image.fromarray(a).save(dst, 'WEBP', lossless=True, quality=100, method=6)
    return int(kill.sum())

def rebody(src, dst, sat=0.28, close=9, grow=2, glow=(255, 246, 214, 0.55), blur=5.0):
    """光の縁と市松が混ざった輪郭（ひとやすみ 33_02・33_03）：色の濃い画素（体・鼻・模様）から体の形を作り直し（穴埋め＝お腹のクリーム色も体）、
    体の外の画素をすべて消して、体の形をぼかした柔らかい光（霧）を後ろに敷く。体の中の色・形は変えない"""
    im = Image.open(src).convert('RGBA'); a = np.array(im)
    r, g, b, al = [a[:, :, i].astype(np.float32) for i in range(4)]
    mx = np.maximum(np.maximum(r, g), b); mn = np.minimum(np.minimum(r, g), b)
    core = (al >= 200) & ((mx - mn) / np.maximum(mx, 1) >= sat)
    st = np.ones((3, 3), bool)
    body = ndi.binary_closing(core, structure=st, iterations=close)
    body = ndi.binary_fill_holes(body)
    lab, n = ndi.label(body); sizes = ndi.sum(body, lab, range(1, n + 1))
    if n: body = lab == (np.argmax(sizes) + 1)
    body = ndi.binary_dilation(body, iterations=grow) & (al >= 16)
    if OPT.get('thin'):   # 体の外周の「細い帯」（光の縁＋市松）だけを外す：色の薄い所のうち、半径 thin の開きで消える細い部分で、外から近い所
        low = (al >= 16) & ((mx - mn) / np.maximum(mx, 1) < OPT.get('thinsat', 42) / 100)
        thick = ndi.binary_opening(low, structure=st, iterations=OPT['thin'])
        near = ndi.binary_dilation(~ndi.binary_fill_holes(al >= 16), iterations=OPT.get('thinnear', 22))
        body &= ~(low & ~thick & near)
        lab, n = ndi.label(body); sizes = ndi.sum(body, lab, range(1, n + 1))
        if n: body = lab == (np.argmax(sizes) + 1)
    out = a.copy(); fa = np.where(body, al / 255.0, 0.0)
    soft = ndi.gaussian_filter(ndi.binary_dilation(body, iterations=4).astype(np.float32), blur)
    ga = np.clip(soft * 1.5, 0, 1) * glow[3]
    oa = fa + ga * (1 - fa)
    col = np.array(glow[:3], dtype=np.float32)[None, None, :]
    rgb = (a[:, :, :3].astype(np.float32) * fa[:, :, None] + col * (ga * (1 - fa))[:, :, None]) / np.maximum(oa, 1e-6)[:, :, None]
    out = np.concatenate([np.clip(rgb, 0, 255), np.clip(oa[:, :, None] * 255, 0, 255)], axis=2).astype(np.uint8)
    Image.fromarray(out).save(dst, 'WEBP', lossless=True, quality=100, method=6)
    return int((al >= 16).sum() - body.sum())

if __name__ == '__main__':
    args = sys.argv[1:]
    glow = None
    while args and args[0].startswith('--'):
        k, v = args.pop(0)[2:].split('=')
        if k == 'glow': glow = [float(x) for x in v.split(',')]
        else: OPT[k] = int(v)
    sys.argv = [sys.argv[0]] + args
    cmd = sys.argv[1]
    if cmd == 'scan':
        for f in sys.argv[2:]:
            h, _ = find(np.array(Image.open(f).convert('RGBA')))
            if h: print(json.dumps({'file': f, 'hits': [{k: v for k, v in x.items() if k != 'id'} for x in h]}, ensure_ascii=False))
    elif cmd == 'rebody':
        print(rebody(sys.argv[2], sys.argv[3], sat=float(OPT.get("sat", 28)) / 100, close=int(OPT.get("close", 9))))
    elif cmd == 'ring':
        print(ring(sys.argv[2], sys.argv[3], glow=glow or (255, 246, 214, 0.5)))
    elif cmd == 'fix':
        print(json.dumps([{k: v for k, v in x.items() if k != 'id'} for x in fix(sys.argv[2], sys.argv[3], glow)], ensure_ascii=False))
