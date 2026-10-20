# =========================================================
# 2026-10-20 第5便：ユーザー納品の F01〜F06 をゲームの素材にする（テストではない道具）
#  python3 -I tools/fullplay1020/r5-art.py <納品の ZIP を展開したフォルダ（下のフォルダも探す。revised/ の修正版を優先）>
#  → assets/fields/front_1020/（F03 の門）・assets/fields/ch2/tunnel_1020/（F01）・assets/fields/gl_1020/（F02）・
#    assets/chapter/rival_1020/（F04）・assets/chapter/fork_1020/（F05）・assets/chapter/rare_1020/（F06）。すべて WebP
#  加工は「切る・縮める・継ぎ目をなじませる・縁の 1〜2 画素の紫（背景抜きの残り）を透明にする」だけ。色は変えない
#   ・背景（F04・F06）：上下の単色の余白（納品の注記＝上下約 278px）を切り落とす
#   ・くり返しの絵（F01 のガラス・F02 の床と道）：端の帯で反対側の端と重ねて継ぎ目を無くす（幅を少し詰める）。ガラス回廊の床は格子が
#     つながっているので幅は詰めず、端の明るさの差だけを端から内へ薄めて消す
#   ・縁石（F02）：絵の中の短い縁石を切り出し、端を重ねて継ぎ目を無くしたものを並べて横に続く帯にする
#   ・選択の印（F05）：3つを1つずつに分ける
# =========================================================
import sys, os, glob
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
SRC = sys.argv[1]
A = lambda *p: os.path.join(ROOT, 'assets', *p)


def find(name):
    fs = sorted(glob.glob(os.path.join(SRC, '**', name), recursive=True), key=lambda f: ('revised' not in f, f))
    if not fs: raise SystemExit('見つからない：' + name)
    return fs[0]


def save(im, path, q=86):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path, 'WEBP', quality=q, method=6)
    print(f'{os.path.relpath(path, ROOT)}  {im.width}x{im.height}  {os.path.getsize(path) // 1024}KB')


def defringe(im, n=2):
    """透明との境の画素のうち、紫（R・B が G より大きく強い＝背景のマゼンタの残り）を透明にする。n 回くり返す（1 回＝1 画素）"""
    a = np.array(im.convert('RGBA')); out = 0
    for _ in range(n):
        al = a[..., 3]; t = al < 16
        nb = np.zeros_like(t)
        nb[1:] |= t[:-1]; nb[:-1] |= t[1:]; nb[:, 1:] |= t[:, :-1]; nb[:, :-1] |= t[:, 1:]
        r, g, b = (a[..., i].astype(int) for i in range(3))
        mag = (r > g + 30) & (b > g + 30) & (al > 0) & nb
        a[..., 3] = np.where(mag, 0, al); out += int(mag.sum())
    print(f'  縁の紫 {out} 画素を透明に')
    return Image.fromarray(a)


def crop_alpha(im, pad=4, bottom=True):
    a = np.array(im.split()[3]); ys, xs = np.where(a > 8)
    return im.crop((max(0, xs.min() - pad), max(0, ys.min() - pad), min(im.width, xs.max() + pad + 1), ys.max() + 1 if bottom else min(im.height, ys.max() + pad + 1)))


def fit_w(im, w):
    return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)


def crossfade(a, b, axis):
    """端の帯 b 画素で、反対側の端と重ねる（その分だけ詰める）＝継ぎ目なし。a は float の配列"""
    if axis == 1: a = a.transpose(1, 0, 2)
    H = a.shape[0]; t = np.linspace(0, 1, b)[:, None, None]
    out = a[:H - b].copy(); out[:b] = a[H - b:] * (1 - t) + a[:b] * t
    return out.transpose(1, 0, 2) if axis == 1 else out


def heal_edges(a, b):
    """幅は変えず、上下・左右の端の明るさの差を端から内へ薄めて消す（格子がつながっている絵用）"""
    a = a.copy(); H, W = a.shape[:2]
    from PIL import ImageFilter
    def smooth(v):  # 端の列の色を少しぼかす（細かい模様は動かさず、明るさの差だけ）
        im = Image.fromarray(np.clip(v, 0, 255).astype(np.uint8)[:, None, :].repeat(3, 1)); im = im.filter(ImageFilter.GaussianBlur(12)); return np.array(im)[:, 1, :].astype(float)
    d = smooth(a[:, 0, :3]) - smooth(a[:, -1, :3]); r = np.linspace(1, 0, b)[None, :, None] * 0.5
    a[:, :b, :3] -= d[:, None, :] * r; a[:, W - b:, :3] += d[:, None, :] * r[:, ::-1]
    d = smooth(a[0, :, :3]) - smooth(a[-1, :, :3]); r = np.linspace(1, 0, b)[:, None, None] * 0.5
    a[:b, :, :3] -= d[None, :, :] * r; a[H - b:, :, :3] += d[None, :, :] * r[::-1]
    return a


def img(a, mode):
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), mode)


# ---- F03 正面向きの門（Chapter 2 の残り 4 つ）：front_1020 と同じ（幅 1280・柱の足もと＝絵の下の端） ----
for k in ['descent_gate', 'ascent_gate', 'sealed_sea_gate', 'arena_gate']:
    im = defringe(Image.open(find(f'F03_ch2_{k}_front.png')).convert('RGBA'))
    save(fit_w(crop_alpha(im), 1280), A('fields', 'front_1020', f'ch2_{k}_front.webp'), 88)

# ---- F01 ガラスのトンネル：骨組み・入口（修正版）・ガラスの面 ----
T = A('fields', 'ch2', 'tunnel_1020')
save(fit_w(crop_alpha(defringe(Image.open(find('F01_glass_tunnel_rib_front.png')).convert('RGBA'))), 1024), os.path.join(T, 'rib_front.webp'), 88)
save(fit_w(crop_alpha(defringe(Image.open(find('F01_glass_tunnel_portal_front.png')).convert('RGBA'))), 1280), os.path.join(T, 'portal_front.webp'), 88)
p = np.array(Image.open(find('F01_glass_tunnel_panel.png')).convert('RGBA')).astype(float)
p = p[:, 128:1952]                                   # 左右の補った余白（明るい単色の帯）を切る
p = crossfade(crossfade(p, 160, 1), 96, 0)
save(img(p, 'RGBA').resize((1024, 512), Image.LANCZOS), os.path.join(T, 'glass_panel.webp'), 86)

# ---- F02 海底の道・縁石・広場（gl_1020＝WebGL の盤の素材と同じ所） ----
G = A('fields', 'gl_1020')
f = np.array(Image.open(find('F02_glass_corridor_floor.png')).convert('RGB')).astype(float)
save(img(heal_edges(f, 192), 'RGB'), os.path.join(G, 'ch2_glass_floor.webp'), 84)
r = np.array(Image.open(find('F02_sunken_road.png')).convert('RGB')).astype(float)
r = crossfade(crossfade(r, 200, 1), 200, 0)
save(img(r, 'RGB').resize((2048, 2048), Image.LANCZOS), os.path.join(G, 'ch2_sunken_road.webp'), 84)
for k, name in [('F02_glass_corridor_curb.png', 'ch2_glass_curb.webp'), ('F02_sunken_curb.png', 'ch2_sunken_curb.webp')]:
    c = np.array(Image.open(find(k)).convert('RGBA'))
    op = c[..., 3] > 200; cols = np.where(op.sum(0) > 40)[0]; rows = np.where(op[:, cols].mean(1) > 0.9)[0]
    seg = c[rows.min():rows.max() + 1, cols.min() + 2:cols.max() - 1].astype(float)
    seg = crossfade(seg, min(64, seg.shape[1] // 6), 1)
    n = max(1, round(2048 / seg.shape[1])); strip = np.concatenate([seg] * n, 1)
    save(img(strip, 'RGBA').resize((2048, round(strip.shape[0] * 2048 / strip.shape[1])), Image.LANCZOS), os.path.join(G, name), 86)
pl = defringe(Image.open(find('F02_sunken_plaza.png')).convert('RGBA'))
save(pl.resize((1024, 1024), Image.LANCZOS), os.path.join(G, 'ch2_sunken_plaza.webp'), 84)

# ---- F04 ライバル登場 ----
RV = A('chapter', 'rival_1020')


def bg(name):
    """上下の単色の余白を切る（行の色のばらつきが小さい行＝余白）"""
    a = np.array(Image.open(find(name)).convert('RGB')).astype(float); sd = a.std(1).mean(1)
    ys = np.where(sd > 3)[0]; a = a[ys.min() + 6: ys.max() - 5]
    return img(a, 'RGB')


save(fit_w(bg('F04_rival_bg.png'), 1080), os.path.join(RV, 'rival_bg.webp'), 82)
save(Image.open(find('F04_rival_aura.png')).convert('RGBA').resize((1024, 1024), Image.LANCZOS), os.path.join(RV, 'rival_aura.webp'), 84)
save(fit_w(crop_alpha(Image.open(find('F04_rival_nameplate.png')).convert('RGBA'), 2, False), 1024), os.path.join(RV, 'rival_nameplate.webp'), 88)
save(Image.open(find('F04_rival_slash.png')).convert('RGBA').resize((1024, 512), Image.LANCZOS), os.path.join(RV, 'rival_slash.webp'), 84)

# ---- F05 分かれ道の矢印・選択の印 ----
FK = A('chapter', 'fork_1020')
for c in ['gold', 'blue', 'green']:
    save(fit_w(crop_alpha(Image.open(find(f'F05_road_arrow_{c}.png')).convert('RGBA'), 8, False), 256), os.path.join(FK, f'arrow_{c}.webp'), 90)
b = Image.open(find('F05_choice_badges.png')).convert('RGBA'); w3 = b.width // 3
for i, c in enumerate(['gold', 'blue', 'green']):
    save(fit_w(crop_alpha(b.crop((i * w3, 0, (i + 1) * w3, b.height)), 2, False), 128), os.path.join(FK, f'badge_{c}.webp'), 90)

# ---- F06 レアの遭遇 ----
RA = A('chapter', 'rare_1020')
for ch in [1, 2, 3, 4]: save(fit_w(bg(f'F06_rare_bg_ch{ch}.png'), 1080), os.path.join(RA, f'rare_bg_ch{ch}.webp'), 82)
save(Image.open(find('F06_rare_aura.png')).convert('RGBA').resize((1024, 1024), Image.LANCZOS), os.path.join(RA, 'rare_aura.webp'), 84)
save(fit_w(crop_alpha(Image.open(find('F06_rare_card_frame.png')).convert('RGBA'), 2, False), 1080), os.path.join(RA, 'rare_card_frame.webp'), 88)
