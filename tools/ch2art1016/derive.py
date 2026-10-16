#!/usr/bin/env python3
"""2026-10-16 Chapter 2「潮風の海岸」正式美術（ユーザー納品 ZIP Mismon_Claude_Ch2_Assets_20261016_Part01〜04）の表示用の派生 WebP を作る。

  python3 -I tools/ch2art1016/derive.py <原本PNGのフォルダ> <照合台帳 全68点_画像仕様と採用版.tsv> <出力 assets/fields/ch2/art_1016>

  原本は読むだけ（編集・上書きしない・リポジトリに置かない）。名前は変えない（拡張子だけ .webp）。
  ・不透明の周期テクスチャ（RGB）：絵はそのまま、等倍の縮小だけ（周期のまま＝縮小で継ぎ目は増えも減りもしない）。描き足し・つなぎ直しはしない
  ・帯（R01・E03・E04・U01）・壁（R05・R07・R08）・FX04：大きさもそのまま（WebP にするだけ）
  ・透過の景物（RGBA）：透明の余白を切る（足もと＝絵の下端は切らない）→ 長い辺を指定の大きさへ（乗算済みのアルファで縮小＝白・黒のふちを出さない）
  照合：台帳の SHA-256・寸法・モード。一致しない／無いファイルは作らずに一覧に出す（欠品）。
  変換の前後の比較：派生を同じ大きさの原本（同じ縮小）と比べた PSNR（RGB はアルファで重み付け）と、アルファの最大差を derive.json に残す
"""
import csv
import hashlib
import json
import os
import sys

import numpy as np
from PIL import Image

# 名前 → (種類, 出力の長い辺 px（None＝そのまま）)
TEX = 'tex'; KEEP = 'keep'; PROP = 'prop'
PLAN = {
    'open_sea_water.png': (TEX, 512), 'shallow_turquoise_water.png': (TEX, 512), 'coastal_sand_base.png': (TEX, 512),
    'G02b_coastal_grass_tile.png': (TEX, 512), 'undersea_sand_base.png': (TEX, 512), 'glass_corridor_floor.png': (TEX, 512),
    'sea_bridge_deck.png': (TEX, 512), 'coastal_white_stone_road.png': (TEX, 512), 'sunken_ruins_ground.png': (TEX, 512),
    'sunken_temple_road.png': (TEX, 512),
    'R01_white_bridge_walkstrip.png': (KEEP, None), 'E03_shore_foam_edge_tile.png': (KEEP, None), 'E04_seabed_cliff_edge_tile.png': (KEEP, None),
    'U01_glass_corridor_roof_strip.png': (KEEP, None), 'R05_spiral_tower_wall_tile.png': (KEEP, None), 'R07_ramp_sidewall_tile.png': (KEEP, None),
    'R08_seabed_basin_wall_tile.png': (KEEP, None), 'FX04_underwater_light_screen_strip.png': (KEEP, None),
    'U08_ruins_plaza_base.png': (KEEP, None), 'U08_ruins_plaza_cracked_a.png': (KEEP, None), 'U08_ruins_plaza_cracked_b.png': (KEEP, None),
    'ocean_arena.png': (PROP, 960), 'L01_harbor_town_cluster.png': (PROP, 720), 'chapter2_sea_medallion.png': (PROP, 512),
}
DEFAULT_PROP = 640     # そのほかの透過の景物（1536 の建物・景物は 640・256 の小物はそのまま）


def sha(p):
    with open(p, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


def premul_resize(im, size):
    a = np.asarray(im.convert('RGBA')).astype(np.float64) / 255
    rgb = a[..., :3] * a[..., 3:4]
    pm = Image.fromarray((np.concatenate([rgb, a[..., 3:4]], 2) * 255 + 0.5).astype(np.uint8), 'RGBA').resize(size, Image.LANCZOS)
    b = np.asarray(pm).astype(np.float64) / 255
    al = b[..., 3:4]
    out = np.where(al > 1e-4, b[..., :3] / np.maximum(al, 1e-4), 0).clip(0, 1)
    return Image.fromarray((np.concatenate([out, al], 2) * 255 + 0.5).astype(np.uint8), 'RGBA')


def trim(im):
    a = np.asarray(im)[..., 3]
    ys, xs = np.nonzero(a > 8)
    x0, x1, y0 = max(0, xs.min() - 2), min(im.width, xs.max() + 3), max(0, ys.min() - 2)
    return im.crop((x0, y0, x1, im.height if ys.max() > im.height - 4 else min(im.height, ys.max() + 3)))


def psnr(a, b, w=None):
    d = (a.astype(np.float64) - b.astype(np.float64)) ** 2
    if w is not None:
        d = d * w[..., None]; n = max(1.0, w.sum() * d.shape[-1])
        mse = d.sum() / n
    else:
        mse = d.mean()
    return 99.0 if mse <= 1e-9 else round(10 * np.log10(255 ** 2 / mse), 2)


def main(src, ledger, out):
    rows = list(csv.DictReader(open(ledger, encoding='utf-8-sig'), delimiter='\t'))
    os.makedirs(out, exist_ok=True)
    rec, missing = [], []
    for r in rows:
        name = r['ファイル名']; p = os.path.join(src, name)
        if not os.path.exists(p):
            missing.append({'name': name, 'size': r['仕様寸法'], 'mode': r['画像モード'], 'why': 'ファイルが無い（Part04 の ZIP が途中で切れていた）'}); continue
        h = sha(p); im = Image.open(p); im.load()
        if h != r['SHA256'] or f'{im.width}x{im.height}' != r['仕様寸法'] or im.mode != r['画像モード']:
            missing.append({'name': name, 'why': '台帳と一致しない', 'sha': h}); continue
        kind, size = PLAN.get(name, (PROP, None if im.width <= 256 else DEFAULT_PROP))
        o = os.path.join(out, os.path.splitext(name)[0] + '.webp')
        if im.mode == 'RGB':
            w = size or im.width; hh = round(im.height * w / im.width)
            d = im.resize((w, hh), Image.LANCZOS) if w != im.width else im
            d.save(o, 'WEBP', quality=90, method=6)
            ref = np.asarray(d); got = np.asarray(Image.open(o).convert('RGB'))
            cmp = {'psnr': psnr(ref, got)}
        else:
            base = trim(im) if kind == PROP else im
            if size and max(base.size) > size:
                k = size / max(base.size); d = premul_resize(base, (max(1, round(base.width * k)), max(1, round(base.height * k))))
            else:
                d = base
            d.save(o, 'WEBP', quality=90, alpha_quality=100, method=6, exact=False)
            ref = np.asarray(d); got = np.asarray(Image.open(o).convert('RGBA'))
            w = ref[..., 3].astype(np.float64) / 255
            cmp = {'psnr_rgb': psnr(ref[..., :3], got[..., :3], w), 'alpha_maxdiff': int(np.abs(ref[..., 3].astype(int) - got[..., 3].astype(int)).max()),
                   'alpha_transparent_px': int((got[..., 3] == 0).sum())}
        g = Image.open(o)
        rec.append({'name': name, 'sha256': h, 'mode': im.mode, 'size': f'{im.width}x{im.height}', 'out': os.path.basename(o),
                    'out_size': f'{g.width}x{g.height}', 'out_bytes': os.path.getsize(o), 'out_sha256': sha(o), 'trimmed': kind == PROP, **cmp})
    json.dump({'assets': rec, 'missing': missing}, open(os.path.join(out, 'derive.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(rec), 'derived;', len(missing), 'missing')
    for m in missing: print(' MISSING', m['name'], m['why'])


if __name__ == '__main__':
    main(*sys.argv[1:4])
