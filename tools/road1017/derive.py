#!/usr/bin/env python3
"""2026-10-17 道路画質（P0）の QA：Chapter 1・2 の道路・地面・海上橋の改修素材12枚（ZIP Mismon_Ch1Ch2_20261017_Part1_Final）の表示用の派生。

  python3 -I tools/road1017/derive.py <原本PNGのフォルダ> <出力 assets/qa/road_1017> [<確認画像の出力フォルダ>]

  原本は読むだけ（編集・上書きしない・リポジトリに置かない）。同じ原本からは同じファイルになる。
  2系統を作る（URL の ?qaRoadArt=raw|fix で切り替え・js/qa/road-art-1017.js）：
    raw ＝原本そのまま（縮小が要る物だけ等倍の縮小＝細かさの上限は js の描き方で決まる）。継ぎ目・周期は原本のまま
    fix ＝継ぎ目だけを直した派生：全体の明るさの傾き（平面）を引く → 端の重なりの帯で誤差が最小になる切れ目を探して左右・上下をつなぐ
          （切れ目の左右 2px だけ、切れ目に垂直な向きにだけ混ぜる＝全面のぼかしはしない・タイル中心の画素はそのまま）
          → 周期のまま縮小（3×3 に並べて縮小 → 中央）。方法は tools/boardhq1014/derive.py と同じ（帯の幅だけ 1536 に合わせて 168px）
  道の帯（Chapter 1）：既存の帯の縁石＋新しい R の敷石・高さ 384px（従来 128px＝3倍の細かさ。縁石は元の帯が 256px＝1.5倍に引き伸ばし）
  R01（Chapter 2 の白い橋帯）：帯の見える所（行 188〜440＝253px）を中央にして、従来の js が前提にする「高さの 62/128 が帯」の比に切る
  欄干・アーチ（透過）：透明の余白を切る（足もと＝下端は切らない）→ 乗算済みのアルファで縮小。透過は原本のまま（作り直さない）
"""
import hashlib
import json
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'boardhq1014'))
import derive as hq  # noqa: E402  （detrend・periodic_x・periodic・resize_periodic・cut_path）

BAND = 168
# 継ぎ目の直し方（素材ごと）：lam＝目地を通る重み（石・板の絵だけ）・search＝くり返しの周期を探す幅（px・0＝探さない）。3×3 を見比べて選んだ値
FIXCFG = {'ch1_ground_a1': (0, 360), 'ch1_ground_a2': (0, 360), 'ch1_ground_a3': (0, 360), 'ch1_road_r1': (3.0, 360), 'ch1_road_r2': (3.0, 0),
          'ch2_open_sea_water': (0, 0), 'ch2_sea_bridge_deck': (3.0, 0), 'ch2_coastal_white_stone_road': (3.0, 360), 'ch2_R01_white_bridge_walkstrip': (3.0, 0)}
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
OLD_STRIP = os.path.join(ROOT, 'assets', 'proto', 'board_art_1010', 'strip_road_stone.webp')
STRIP_H = 384
STRIP_TILE = 640    # 高さ 256 の帯に対する R のくり返し1枚（px）＝従来の石の大きさ（R の1枚＝57.5単位）
CURB = (47, 199)

# 原本 → (出力名, 種類, 出力の大きさ（px・None＝原本のまま）, 世界の単位（くり返し1枚・帯は幅）)
PLAN = {
    'Ch1_01_grass_A1_bright.png': ('ch1_ground_a1', 'tex', None, 128),
    'Ch1_02_grass_A2_flower.png': ('ch1_ground_a2', 'tex', None, 128),
    'Ch1_03_grass_A3_dry.png': ('ch1_ground_a3', 'tex', None, 128),
    'Ch1_04_stone_road_R1_standard.png': ('ch1_road_r1', 'tex', 1024, 57.5),
    'Ch1_05_stone_road_R2_premium.png': ('ch1_road_r2', 'tex', 1024, 57.5),
    'Ch2_open_sea_water.png': ('ch2_open_sea_water', 'tex', None, 110),
    'Ch2_sea_bridge_deck.png': ('ch2_sea_bridge_deck', 'tex', 1280, 72),
    'Ch2_coastal_white_stone_road.png': ('ch2_coastal_white_stone_road', 'tex', 1024, 56),
    'Ch2_R01_white_bridge_walkstrip.png': ('ch2_R01_white_bridge_walkstrip', 'walk', None, 22),
    'Ch2_sea_bridge_railing_left.png': ('ch2_sea_bridge_railing_left', 'rail', 192, 8),
    'Ch2_sea_bridge_railing_right.png': ('ch2_sea_bridge_railing_right', 'rail', 192, 8),
    'Ch2_L02_white_bridge_arch_pier.png': ('ch2_L02_white_bridge_arch_pier', 'prop', 640, None),
}


def periodic_x(a, band, lam, SEARCH=0):
    """左右を最小誤差の切れ目でつなぐ（幅 N → N−band）。tools/boardhq1014/derive.py の periodic_x に「目地を通る」重み lam を足した：
    切れ目の費用＝両側の色の差（平均で割る）＋ lam ×両側の明るさ（平均で割る）＝石畳・橋床では切れ目が暗い目地を通り、石の真ん中を切らない"""
    h, n, _ = a.shape
    m = n - band
    if SEARCH:   # くり返しの周期（出力の幅 m）を、左の帯と m からの帯がいちばん似る所に選ぶ＝石・板の並びの位相がそろい、切れ目で石が溶けない
        sub = a[::4, :band:2, :3]
        m = min(range(n - band - SEARCH, n - band + 1), key=lambda q: float(((sub - a[::4, q:q + band:2, :3]) ** 2).mean()))
    A, Bs = a[:, :band], a[:, m:m + band]
    err = ((A - Bs) ** 2).sum(2)
    err = err / max(1e-6, err.mean())
    if lam:
        lum = (A[..., :3].mean(2) + Bs[..., :3].mean(2)) / 2
        err = err + lam * lum / max(1e-6, lum.mean())
    path = hq.cut_path(err, 6)
    j = np.arange(band)[None, :]
    mask = (j >= path[:, None]).astype(float)
    F = hq.FEATHER
    if F:
        k = 2 * F + 1
        pad = np.pad(mask, ((0, 0), (F, F)), mode='edge')
        mask = sum(pad[:, i:i + band] for i in range(k)) / k
    out = a[:, :m].copy()
    out[:, :band] = A * mask[:, :, None] + Bs * (1 - mask[:, :, None])
    return out


def periodic(a, band, lam, search):
    a = periodic_x(a, band, lam, search)
    return periodic_x(a.transpose(1, 0, 2), band, lam, search).transpose(1, 0, 2)


def resize_periodic2(a, f):
    """周期の絵を周期のまま f 倍に（縦横で大きさが違ってもよい・3×3 に並べて縮小 → 中央）＝原本の1画素あたりの世界の大きさを保つ"""
    h, w = a.shape[:2]
    W, H = max(1, round(w * f)), max(1, round(h * f))
    if W == w and H == h:
        return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    t = np.tile(a, (3, 3, 1))
    im = Image.fromarray(np.clip(t, 0, 255).astype(np.uint8)).resize((W * 3, H * 3), Image.LANCZOS)
    return im.crop((W, H, W * 2, H * 2))


def sha(p):
    with open(p, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


def seam(a):
    """端の列・行の差の平均 ÷ 中の隣どうしの差の平均（左右, 上下）。1 前後で継ぎ目が見えにくい"""
    a = np.asarray(a).astype(float)[..., :3]
    lr = np.abs(a[:, 0] - a[:, -1]).mean() / np.abs(np.diff(a, axis=1)).mean()
    tb = np.abs(a[0] - a[-1]).mean() / np.abs(np.diff(a, axis=0)).mean()
    return [round(float(lr), 2), round(float(tb), 2)]


def sharp(a):
    """細かさの目安：隣どうしの差の平均（大きいほど細かい描き込みが残っている）"""
    a = np.asarray(a).astype(float)[..., :3]
    return round(float((np.abs(np.diff(a, axis=1)).mean() + np.abs(np.diff(a, axis=0)).mean()) / 2), 2)


def resize_rgb(a, size):
    im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
    return im if not size or im.width == size else im.resize((size, size), Image.LANCZOS)


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


def strip_hi(rtex, H):
    """既存の帯の縁石（上 0〜47・下 199〜255 行）＋R の敷石を、高さ H で組む（tools/boardhq1014/derive.py の strip と同じ組み方・高さだけ違う）。
    長さは R の1枚の整数倍（＝帯の端と端で敷石がつながる）。縁石は同じ長さへ周期のまま伸縮"""
    k = H / 256
    T = round(STRIP_TILE * k)                  # 原本 1536px の R ＝ T px（周期を直した R は縦横が違う＝同じ倍率で）
    q = T / 1536
    TW, TH = round(rtex.shape[1] * q), round(rtex.shape[0] * q)
    reps = max(1, round(STRIP_TILE * 3 * k / TW))
    L = TW * reps
    old = Image.open(OLD_STRIP).convert('RGBA')
    oa = np.asarray(old).astype(float)[:, 80:old.width - 80]
    oa = hq.periodic_x(oa, 120)
    t3 = Image.fromarray(np.tile(oa, (1, 3, 1)).clip(0, 255).astype(np.uint8), 'RGBA').convert('RGBa').resize((L * 3, H), Image.LANCZOS).convert('RGBA')
    cur = np.asarray(t3.crop((L, 0, L * 2, H))).astype(float)
    tile = Image.fromarray(np.clip(rtex, 0, 255).astype(np.uint8)).resize((TW, TH), Image.LANCZOS)
    pave = Image.new('RGBA', (L, H))
    for i in range(reps):
        pave.paste(tile.crop((0, (TH - H) // 2, TW, (TH - H) // 2 + H)), (i * TW, 0))
    pa = np.asarray(pave).astype(float)
    y = np.arange(H).astype(float) / k
    wt = np.clip((CURB[0] + 1 - y) / 4 + 0.5, 0, 1)
    wb = np.clip((y - (CURB[1] - 1)) / 4 + 0.5, 0, 1)
    w = np.maximum(wt, wb)[:, None]
    rgb = cur[:, :, :3] * w[:, :, None] + pa[:, :, :3] * (1 - w[:, :, None])
    alpha = cur[:, :, 3] * w + 255 * (1 - w)
    return Image.fromarray(np.dstack([rgb, alpha]).clip(0, 255).astype(np.uint8), 'RGBA')


def walk_crop(im):
    """R01：帯（不透明の行）を中央にして、高さの 62/128 が帯になるように切る"""
    a = np.asarray(im)[..., 3]
    rows = np.nonzero((a > 200).mean(1) > 0.95)[0]
    r0, r1 = int(rows.min()), int(rows.max()) + 1
    c, band = (r0 + r1) / 2, r1 - r0
    hh = round(band * 128 / 62 / 2)
    top = int(round(c - hh))
    pad = Image.new('RGBA', (im.width, hh * 2))
    pad.paste(im.crop((0, max(0, top), im.width, min(im.height, top + hh * 2))), (0, max(0, -top)))
    return pad, band


def save(im, path, lossless=False):
    if im.mode == 'RGBA':
        im.save(path, 'WEBP', quality=92, alpha_quality=100, method=6, exact=False)
    else:
        im.save(path, 'WEBP', quality=92, method=6)


def main(src, out, chk=None):
    os.makedirs(out, exist_ok=True)
    if chk:
        os.makedirs(chk, exist_ok=True)
    rec, rtex = {}, {}
    for name, (base, kind, size, unit) in PLAN.items():
        p = os.path.join(src, name)
        im = Image.open(p)
        im.load()
        r = {'src': name, 'src_sha256': sha(p), 'src_size': list(im.size), 'src_mode': im.mode, 'kind': kind, 'unit': unit}
        if kind == 'tex':
            a = np.asarray(im.convert('RGB')).astype(float)
            raw = resize_rgb(a, size)
            fa = periodic(hq.detrend(a), BAND, *FIXCFG[base])
            f = (size / a.shape[1]) if size else 1.0
            fix = resize_periodic2(fa, f)                       # 原本の1画素あたりの世界の大きさを raw と同じに（＝石・草の大きさが変わらない）
            ppu = a.shape[1] * f / unit
            for tag, img in (('raw', raw), ('fix', fix)):
                op = os.path.join(out, f'{base}_{tag}.webp')
                save(img, op)
                g = Image.open(op).convert('RGB')
                r[tag] = {'out': os.path.basename(op), 'size': list(g.size), 'bytes': os.path.getsize(op), 'sha256': sha(op), 'seam': seam(g), 'sharp': sharp(g),
                          'px_per_unit': round(ppu, 3)}
            r['src_seam'] = seam(a)
            r['src_sharp'] = sharp(a)
            if base.startswith('ch1_road_'):
                rtex[base[-2:]] = {'raw': a, 'fix': fa}
            if chk:   # 同じ世界の広さ（raw の1枚の 2.5 倍四方）に raw と fix を敷き詰めて並べる（左＝raw・右＝fix）
                A = round(raw.width * 2.5)
                sheet = Image.new('RGB', (A * 2 + 40, A), (40, 40, 48))
                for jx, img in enumerate((raw, fix)):
                    t = img.convert('RGB')
                    for yy in range(0, A, t.height):
                        for xx in range(0, A, t.width):
                            sheet.paste(t.crop((0, 0, min(t.width, A - xx), min(t.height, A - yy))), (jx * (A + 40) + xx, yy))
                sheet.resize((1600, round(1600 * A / (A * 2 + 40))), Image.LANCZOS).save(os.path.join(chk, f'tile_{base}.jpg'), quality=88)
        elif kind == 'walk':
            c, band = walk_crop(im.convert('RGBA'))
            r['band_px'] = band
            for tag in ('raw', 'fix'):
                img = c if tag == 'raw' else Image.fromarray(periodic_x(np.asarray(c).astype(float), 160, *FIXCFG[base]).clip(0, 255).astype(np.uint8), 'RGBA')
                op = os.path.join(out, f'{base}_{tag}.webp')
                save(img, op)
                g = Image.open(op)
                bandrows = np.asarray(g)[..., 3].mean(1) > 200
                r[tag] = {'out': os.path.basename(op), 'size': list(g.size), 'bytes': os.path.getsize(op), 'sha256': sha(op),
                          'seam': seam(np.asarray(g.convert('RGB'))[bandrows]), 'px_per_unit': round(band / unit, 2)}
        else:
            t = trim(im.convert('RGBA'))
            if kind == 'rail':
                k = size / t.height
            else:
                k = min(1.0, size / max(t.size))
            d = premul_resize(t, (max(1, round(t.width * k)), max(1, round(t.height * k)))) if k != 1 else t
            op = os.path.join(out, f'{base}.webp')
            save(d, op)
            g = Image.open(op)
            r['raw'] = {'out': os.path.basename(op), 'size': list(g.size), 'bytes': os.path.getsize(op), 'sha256': sha(op),
                        'px_per_unit': round(g.height / unit, 2) if unit else None}
        rec[base] = r
    for k_, v in rtex.items():
        for tag in ('raw', 'fix'):
            img = strip_hi(v[tag], STRIP_H)
            op = os.path.join(out, f'ch1_strip_{k_}_{tag}.webp')
            save(img, op)
            g = Image.open(op)
            rec.setdefault(f'ch1_strip_{k_}', {'src': f'ch1_road_{k_}＋{os.path.relpath(OLD_STRIP, ROOT)} の縁石', 'kind': 'strip', 'unit': 23})[tag] = {
                'out': os.path.basename(op), 'size': list(g.size), 'bytes': os.path.getsize(op), 'sha256': sha(op), 'px_per_unit': round(STRIP_H / 23, 2)}
    json.dump(rec, open(os.path.join(out, 'derive.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    for k_, v in rec.items():
        print(k_, {t: (v[t]['size'], v[t].get('seam'), v[t].get('px_per_unit')) for t in ('raw', 'fix') if t in v}, 'src_seam', v.get('src_seam'))


if __name__ == '__main__':
    main(*sys.argv[1:4])
