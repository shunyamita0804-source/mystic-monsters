# =========================================================
# 2026-10-21：ユーザー納品 G01（Chapter 4 の道一式 v2）・G02（Chapter 1 の崖のふち v2）を盤の素材にする（テストではない道具）
#  python3 -I tools/road1021/g01-art.py <G01_*.png・G02_*.png があるフォルダ>
#  → assets/fields/gl_1020/ch4_{road,curb,plaza,ground}.webp・assets/proto/board_art_1010/edge_cliff_g02.webp（新しい名前＝旧の edge_grass・edge_rock はそのまま。Chapter 4 の旧の絵は *_e04.webp に残す）
#  納品の絵は、継ぎ目を消すために絵の中央（x・y＝約 1006〜1042px）が十字にぼけていた（幅 約 36px）＝くり返すと 1 枚ごとにぼけた線が出る。
#  そのぼけた帯だけを、同じ絵のほかの場所から境目の合う帯を写して埋める（重なり 14px の中を、差のいちばん小さい道すじで切り替える＝image quilting）。
#  帯の外は納品のまま（縁＝くり返しの継ぎ目は変わらない）。色は変えない。縁石は帯の外の透明な行を切る
# =========================================================
import sys, os, glob, shutil
import numpy as np
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
GL = os.path.join(ROOT, 'assets', 'fields', 'gl_1020')
EDGE = os.path.join(ROOT, 'assets', 'proto', 'board_art_1010')
OV = 14


def blur_runs(a, axis):
    """ぼけた帯（細かさが中央値の 45% 未満の列・行が 4 本以上続く所）。中央付近（±12%）だけ"""
    L = a.mean(2) if a.ndim == 3 else a
    g = np.abs(np.diff(L, axis=1 - axis)).mean(axis=1 - axis)   # axis=1：列ごと
    n = g.shape[0]; low = g < np.median(g) * 0.45; out = []; i = 0
    while i < n:
        if low[i]:
            j = i
            while j + 1 < n and low[j + 1]: j += 1
            if j - i >= 4 and abs((i + j) / 2 - n / 2) < n * 0.12: out.append((i, j))
            i = j + 1
        else: i += 1
    return out


def min_cut(err):
    """err[h, w]：上から下への道すじ（各行で 1 列）の合計が最小の列の並び"""
    h, w = err.shape; E = err.copy(); back = np.zeros((h, w), int)
    for y in range(1, h):
        prev = E[y - 1]; cand = np.stack([np.r_[np.inf, prev[:-1]], prev, np.r_[prev[1:], np.inf]])
        k = cand.argmin(0); E[y] += cand[k, np.arange(w)]; back[y] = np.arange(w) + k - 1
    path = np.zeros(h, int); path[-1] = int(E[-1].argmin())
    for y in range(h - 1, 0, -1): path[y - 1] = back[y, path[y]]
    return path


def fill_cols(a, b0, b1):
    """列 b0..b1 のぼけた帯を、同じ絵のほかの列（くり返しの向きに回して）から写す。a：float の H×W×C"""
    H, W, C = a.shape; x0, x1 = b0 - OV, b1 + OV + 1; w = x1 - x0
    rgb = a[..., :3]; best = None
    for s in range(0, W, 3):
        if abs(((s + w / 2) - (b0 + b1) / 2 + W / 2) % W - W / 2) < w * 1.5: continue   # 帯の近くは取らない
        idx = (np.arange(w) + s) % W; src = rgb[:, idx]
        e = ((src[:, :OV] - rgb[:, x0:x0 + OV]) ** 2).sum() + ((src[:, -OV:] - rgb[:, x1 - OV:x1]) ** 2).sum()
        if best is None or e < best[0]: best = (e, s)
    idx = (np.arange(w) + best[1]) % W; P = a[:, idx].copy(); out = a.copy()
    eL = ((P[:, :OV, :3] - a[:, x0:x0 + OV, :3]) ** 2).sum(2); pL = min_cut(eL)
    eR = ((P[:, -OV:, :3] - a[:, x1 - OV:x1, :3]) ** 2).sum(2); pR = min_cut(eR)
    for y in range(H):
        l, r = x0 + pL[y], x1 - OV + pR[y]
        out[y, l:r + 1] = P[y, l - x0:r - x0 + 1]
    return out, best[1]


def repair(im):
    mode = im.mode; a = np.asarray(im.convert('RGBA' if mode == 'RGBA' else 'RGB')).astype(np.float64); log = []
    for (b0, b1) in blur_runs(a[..., :3], 1): a, s = fill_cols(a, b0, b1); log.append(f'x{b0}-{b1}<-{s}')
    for (b0, b1) in blur_runs(a[..., :3], 0):
        t, s = fill_cols(a.transpose(1, 0, 2), b0, b1); a = t.transpose(1, 0, 2); log.append(f'y{b0}-{b1}<-{s}')
    return Image.fromarray(np.clip(a + 0.5, 0, 255).astype(np.uint8), 'RGBA' if mode == 'RGBA' else 'RGB'), log


def keep_old(path, old):
    if os.path.exists(path) and not os.path.exists(old): shutil.copy2(path, old)


src = sys.argv[1]
JOBS = [('G01_1_ch4_road.png', GL, 'ch4_road', True), ('G01_4_ch4_ground.png', GL, 'ch4_ground', True), ('G01_2_ch4_curb.png', GL, 'ch4_curb', True),
        ('G01_3_ch4_plaza.png', GL, 'ch4_plaza', False), ('G02_ch1_cliff_edge.png', EDGE, 'edge_cliff_g02', True)]
for name, out_dir, base, fix in JOBS:
    f = glob.glob(os.path.join(src, '**', name), recursive=True)
    if not f: print('なし', name); continue
    im = Image.open(f[0]); log = []
    if fix: im, log = repair(im)
    if base == 'ch4_curb':   # 上の透明な行（縁石の外）を切る
        al = np.asarray(im)[..., 3].mean(1); rows = np.where(al > 200)[0]; im = im.crop((0, int(rows.min()), im.width, int(rows.max()) + 1))
    if base == 'ch4_plaza': im = im.resize((1024, 1024), Image.LANCZOS)
    dst = os.path.join(out_dir, base + '.webp')
    if out_dir == GL: keep_old(dst, os.path.join(out_dir, base + '_e04.webp'))
    im.save(dst, 'WEBP', quality=84 if base == 'ch4_plaza' else 82, method=6)
    print(f'{base}.webp  {im.width}x{im.height}  {os.path.getsize(dst) // 1024}KB  {" ".join(log)}')
