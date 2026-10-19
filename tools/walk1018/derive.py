# 2026-10-18 夜間 GO PHASE 2：ボード用の歩行 7体（ユーザー納品の白背景 JPEG シート 4列×5行＝各20コマ）→ 表示用の透過 WebP（assets/monsters/walk_1018/<種族>/）
#   python3 -I -B tools/walk1018/derive.py <JPEG の展開フォルダ> [<QA の出力フォルダ>]
#   ・行＝front（正面）・back（背面）・side（右横）・backd（右斜め後ろ）・frontd（右斜め前）。列＝1〜4（納品の並びのまま）。左向きは盤で左右反転
#   ・切り出し：白い背景（外周からつながる近白の画素だけ＝体の内側の白い胸毛・羽・装甲・花は残す）を透明に。縁の1〜2px は白との混ざり具合から alpha を決め、白を差し引いて色を戻す（白いフリンジを残さない）
#   ・原寸のまま（縮小・引き伸ばしなし。ソラモのセル 343×229 を正方形へ伸ばさない）。種族ごとに同じ倍率・同じ正方形のキャンバスに、足もと（不透明の下端）を同じ基線にそろえて置く。横はセルの中心に対する位置を保つ
#   ・原本の JPEG はリポジトリに置かない（README.md に原本と派生の sha256）。h＝正面2コマ目（足をそろえた姿）の体の高さに対するキャンバスの比・foot＝基線の下の余白の割合（js/qa/walk5-1016.js の SPEC7）
import sys, os, hashlib, json
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'monsters', 'walk_1018')
SRC = {   # ユーザー指示書（Mismon_Claude_夜間一括GO_…_20261018.txt）の対応
    'solamo': '6690B006-792F-4DE9-AEB8-9C21ACC88167.jpeg', 'gauru': '45370AA8-FA61-49B3-A687-A3EDB8759DEA.jpeg', 'nobiton': 'C17B97F5-A4DB-45F8-ABFF-B06C1240CCCD.jpeg',
    'jiol': '4A22D3A1-68AA-4A09-A66E-4DFD56737DFB.jpeg', 'regnas': 'A7C47D98-11B7-4EBD-8CEA-2841F8FFCEAB.jpeg', 'flurene': '61292816-367B-492B-9F0A-502F9E557AB7.jpeg', 'razuck': 'D2947742-BEE2-468D-8479-5C2F42E67848.jpeg' }
JA = { 'solamo': 'ソラモ', 'gauru': 'ガウル', 'nobiton': 'ノビトン', 'jiol': 'ジオル', 'regnas': 'レグナス', 'flurene': 'フルーネ', 'razuck': 'ラズック' }
DIRS = ['front', 'back', 'side', 'backd', 'frontd']
ROWS, COLS = 5, 4
WHITE_MIN, NEUTRAL_MAX = 232, 16        # 背景の候補＝全チャンネル 232 以上・彩度（max−min）16 以下
EDGE_LO, EDGE_HI = 196, 248             # 縁の alpha：min チャンネル 196 以下＝不透明・248 以上＝透明
MIN_ISLAND = 24                         # これより小さい孤立した画素のかたまりは JPEG のにじみとして捨てる
MARGIN_FOOT = 0.045                     # 基線の下の余白（キャンバスの割合）
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()

def flood_bg(cand):
    """外周からつながる候補画素＝背景（PIL の floodfill を外周の全画素から）"""
    H, W = cand.shape
    im = Image.fromarray(np.where(cand, 255, 0).astype(np.uint8), 'L').copy()   # fromarray の画像は読み取り専用＝floodfill が効かない
    seeds = [(x, 0) for x in range(0, W, 8)] + [(x, H - 1) for x in range(0, W, 8)] + [(0, y) for y in range(0, H, 8)] + [(W - 1, y) for y in range(0, H, 8)]
    for s in seeds:
        if im.getpixel(s) == 255: ImageDraw.floodfill(im, s, 128)
    return np.asarray(im) == 128

def label(fg):
    """前景のかたまり（4連結）に番号を付ける（PIL の floodfill を順に）。戻り＝(label 配列, [(id, 画素数)])"""
    H, W = fg.shape
    im = Image.fromarray(np.where(fg, 1, 0).astype(np.int32), 'I').copy()
    px = im.load()
    ids = []; nxt = 2
    ys, xs = np.nonzero(fg)
    for k in range(len(ys)):
        y, x = int(ys[k]), int(xs[k])
        if px[x, y] != 1: continue
        ImageDraw.floodfill(im, (x, y), nxt)
        px = im.load()
        ids.append([nxt, 0]); nxt += 1
    arr = np.asarray(im)
    cnt = np.bincount(arr.ravel(), minlength=nxt)
    ids = [(i, int(cnt[i])) for i, _ in ids]
    return arr, ids

def bands(proj, n, minlen):
    """投影（True＝何かある）を n 個の帯に分ける。帯と帯の間の空白の中央を境にする。見つからなければ None"""
    on = proj.astype(bool); runs = []; i = 0; L = len(on)
    while i < L:
        if on[i]:
            j = i
            while j < L and on[j]: j += 1
            runs.append([i, j]); i = j
        else: i += 1
    # 小さな隙間（minlen 未満）でつながる帯は1つにまとめる
    merged = []
    for r in runs:
        if merged and r[0] - merged[-1][1] < minlen: merged[-1][1] = r[1]
        else: merged.append(list(r))
    if len(merged) != n: return None
    edges = [0] + [(merged[i][1] + merged[i + 1][0]) // 2 for i in range(n - 1)] + [L]
    return list(zip(edges[:-1], edges[1:]))

def process(key, path, qa_dir):
    rgb = np.asarray(Image.open(path).convert('RGB')).astype(np.int16)
    H, W = rgb.shape[:2]
    mn, mx = rgb.min(axis=2), rgb.max(axis=2)
    cand = (mn >= WHITE_MIN) & ((mx - mn) <= NEUTRAL_MAX)
    bg = flood_bg(cand)
    fg = ~bg
    # 縁：背景に接する（4近傍）前景の画素は白との混ざりから alpha を決める（2px 目までは少し弱く）
    pad = np.pad(bg, 1, constant_values=True)
    adj1 = fg & (pad[:-2, 1:-1] | pad[2:, 1:-1] | pad[1:-1, :-2] | pad[1:-1, 2:])
    p2 = np.pad(adj1, 1); adj2 = fg & ~adj1 & (p2[:-2, 1:-1] | p2[2:, 1:-1] | p2[1:-1, :-2] | p2[1:-1, 2:])
    alpha = np.where(fg, 255.0, 0.0)
    w = np.clip((mn.astype(np.float32) - EDGE_LO) / (EDGE_HI - EDGE_LO), 0, 1)   # 白さ 0〜1
    a1 = (1 - w) * 255; alpha[adj1] = a1[adj1]
    a2 = (1 - 0.5 * w) * 255; alpha[adj2] = a2[adj2]
    # 白を差し引いて色を戻す（C = a*C' + (1-a)*255）
    out = rgb.astype(np.float32)
    soft = (alpha > 0) & (alpha < 255)
    af = alpha / 255.0
    for c in range(3):
        ch = out[..., c]
        ch2 = (ch - (1 - af) * 255) / np.maximum(af, 1e-3)
        ch[soft] = np.clip(ch2[soft], 0, 255)
    rgba = np.dstack([np.clip(out, 0, 255).astype(np.uint8), np.clip(alpha, 0, 255).astype(np.uint8)])
    # 2026-10-18：セルの切り分けは「前景のかたまり（連結領域）ごとに、重心が入る格子のセルへ割り当てる」＝尾・爪が隣のセルの領域へはみ出しても切らない
    #  （投影で帯を探す方法は、レグナスの尾が隣の列の領域に届いて帯がつながり、等分の格子で体を切っていた）
    fgm = alpha > 0
    lab, ids = label(fgm)
    cellw, cellh = W / COLS, H / ROWS
    comp = {}
    dropped_all = 0
    for i, s_ in ids:
        if s_ < MIN_ISLAND: dropped_all += s_; continue
        ys, xs = np.nonzero(lab == i)
        r, c = min(ROWS - 1, int(ys.mean() / cellh)), min(COLS - 1, int(xs.mean() / cellw))
        comp.setdefault((r, c), []).append((i, s_, int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))
    assert len(comp) == ROWS * COLS, (key, sorted(comp))
    cells = [(r, c, int(c * cellw), int(r * cellh), int((c + 1) * cellw), int((r + 1) * cellh)) for r in range(ROWS) for c in range(COLS)]
    frames = []
    for (r, c, x0, y0, x1, y1) in cells:
        cs = comp[(r, c)]
        big = max(s_ for _, s_, *_ in cs)
        bx0, by0 = min(t[2] for t in cs), min(t[3] for t in cs); bx1, by1 = max(t[4] for t in cs), max(t[5] for t in cs)
        sub = rgba[by0:by1, bx0:bx1].copy()
        m = np.zeros(sub.shape[:2], bool)
        for i, *_ in cs: m |= (lab[by0:by1, bx0:bx1] == i)
        sub[..., 3][~m] = 0
        # 1つの種族の中で桁違いに大きいかたまり＝隣の体とつながっている疑い（報告）
        frames.append({ 'r': r, 'c': c, 'cell': (x0, y0, x1, y1), 'img': sub, 'bbox': (bx0, by0, bx1, by1), 'cx': (bx0 + bx1) / 2 - (x0 + x1) / 2, 'dropped': 0, 'islands': len(cs), 'big': big })
    sizes = sorted(f['big'] for f in frames)
    if sizes[-1] > sizes[len(sizes) // 2] * 1.6: print('  !! 大きすぎるかたまり（隣とつながった疑い）', key, sizes[-1], sizes[len(sizes) // 2])
    frames[0]['dropped'] = dropped_all   # 捨てた孤立画素の合計（シート全体）
    # 種族ごとに同じキャンバス・同じ倍率・基線をそろえる
    maxw = max(f['img'].shape[1] for f in frames); maxh = max(f['img'].shape[0] for f in frames)
    side = int(np.ceil(max(maxw * 1.06, maxh / (1 - MARGIN_FOOT) * 1.02) / 8) * 8)
    base = int(round(side * (1 - MARGIN_FOOT)))
    # 横：セルの中心に対する位置を保つ（はみ出すなら中央に）
    offs = [f['cx'] for f in frames]
    use_cell = all(abs(o) + f['img'].shape[1] / 2 <= side / 2 - 2 for o, f in zip(offs, frames))
    os.makedirs(os.path.join(OUT, key), exist_ok=True)
    rows = []; log = []
    for f in frames:
        im = f['img']; h, w = im.shape[:2]
        canvas = np.zeros((side, side, 4), np.uint8)
        cx = side / 2 + (f['cx'] if use_cell else 0)
        x = int(round(cx - w / 2)); y = base - h
        x = max(0, min(side - w, x)); y = max(0, y)
        canvas[y:y + h, x:x + w] = im
        name = f'{DIRS[f["r"]]}_{f["c"] + 1}.webp'
        o = os.path.join(OUT, key, name)
        Image.fromarray(canvas, 'RGBA').save(o, 'WEBP', quality=92, method=6)
        rows.append((key, name, os.path.relpath(o, ROOT), sha(o), w, h, f['islands'], f['dropped']))
        log.append({ 'name': name, 'cell': f['cell'], 'bbox': f['bbox'], 'w': w, 'h': h, 'x': x, 'y': y, 'islands': f['islands'], 'dropped_px': f['dropped'] })
    # h・foot（正面 2コマ目＝足をそろえた姿）
    st = [f for f in frames if f['r'] == 0 and f['c'] == 1][0]
    spec = { 'h': round(side / st['img'].shape[0], 3), 'foot': round((side - base) / side, 3), 'side': side, 'cell_mode': 'cell-center' if use_cell else 'center' }
    # QA：縁の検査（alpha 1〜254 の画素の色が白に寄りすぎていないか＝defringe 後の平均）・一覧シート
    if qa_dir:
        os.makedirs(qa_dir, exist_ok=True)
        sheet = Image.new('RGBA', (side * COLS, side * ROWS), (70, 110, 70, 255))
        for f, lg in zip(frames, log):
            im = Image.open(os.path.join(OUT, key, lg['name'])).convert('RGBA')
            sheet.alpha_composite(im, (f['c'] * side, f['r'] * side))
        d = ImageDraw.Draw(sheet)
        for r in range(ROWS): d.line([(0, r * side + base), (side * COLS, r * side + base)], fill=(255, 80, 80, 160))
        sheet.save(os.path.join(qa_dir, f'{key}_sheet.png'))
    return spec, rows, log, { 'size': (W, H), 'side': side, 'base': base, 'cell_mode': spec['cell_mode'] }

def main():
    src_dir = sys.argv[1]; qa_dir = sys.argv[2] if len(sys.argv) > 2 else None
    specs, allrows, info = {}, [], {}
    for key, fn in SRC.items():
        p = os.path.join(src_dir, fn)
        spec, rows, log, meta = process(key, p, qa_dir)
        specs[key] = { 'h': spec['h'], 'foot': spec['foot'] }
        info[key] = { **meta, 'src': fn, 'src_sha256': sha(p), 'frames': log }
        allrows += rows
        print(key, meta['size'], 'side', meta['side'], spec, 'islands dropped px:', sum(r[7] for r in rows))
    json.dump(specs, open(os.path.join(ROOT, 'tools', 'walk1018', 'derive.json'), 'w'), indent=1)
    json.dump(info, open(os.path.join(ROOT, 'tools', 'walk1018', 'frames.json'), 'w'), indent=1, default=lambda o: int(o) if hasattr(o, '__int__') else str(o))
    with open(os.path.join(OUT, 'README.md'), 'w', encoding='utf-8') as f:
        f.write('# ボード用の歩行 7体×5方向×4コマ＝140コマ（2026-10-18 夜間 GO・ユーザー納品の白背景 JPEG シート 7枚から。本編の既定）\n\n')
        f.write('- 原本＝ユーザー指示 ZIP（Mismon_Claude_夜間一括GO_…_20261018）の JPEG 7枚（4列×5行の一覧シート・白背景・alpha なし）。原本はリポジトリに置かない\n')
        f.write('- 派生＝tools/walk1018/derive.py：白い背景（外周からつながる近白の画素）だけを透明に（体の内側の白い胸毛・羽・装甲・花は残す）・縁は白との混ざりから alpha を決めて白を差し引く・原寸のまま（縮小・引き伸ばしなし）・種族ごとに同じ正方形のキャンバスに足もとの基線をそろえて置く（横はセルの中心に対する位置を保つ）\n')
        f.write('- 行＝front・back・side（右横）・backd（右斜め後ろ）・frontd（右斜め前）。左向きは盤で左右反転（js/qa/walk5-1016.js）。旧 walk_1017（2026-10-17 納品の 512px コマ）はファイルだけ残す（?qaWalk=1017 で比較）\n')
        f.write('- h＝正面2コマ目（足をそろえた姿）の体の高さに対するキャンバスの比・foot＝基線の下の余白の割合（tools/walk1018/derive.json → SPEC7）。コマごとの切り出し位置・孤立画素の除去数は tools/walk1018/frames.json\n\n')
        f.write('| 種族 | 原本 | 原本 sha256 | シート | キャンバス | h | foot |\n|---|---|---|---|---|---|---|\n')
        for k, m in info.items(): f.write(f'| {k}（{JA[k]}） | {m["src"]} | {m["src_sha256"]} | {m["size"][0]}×{m["size"][1]} | {m["side"]}×{m["side"]} | {specs[k]["h"]} | {specs[k]["foot"]} |\n')
        f.write('\n| 種族 | 派生 | sha256 | 体の幅×高さ | かたまり | 捨てた画素 |\n|---|---|---|---|---|---|\n')
        for r in allrows: f.write(f'| {r[0]} | {r[2]} | {r[3]} | {r[4]}×{r[5]} | {r[6]} | {r[7]} |\n')
    print(json.dumps(specs), len(allrows))
if __name__ == '__main__': main()
