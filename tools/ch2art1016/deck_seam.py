#!/usr/bin/env python3
"""2026-10-16 海上橋の石板（sea_bridge_deck.png）の反復接合の検査（ゲームの外の確認道具。テストではない）

  python3 -I tools/ch2art1016/deck_seam.py <原本 sea_bridge_deck.png> <出力フォルダ>

  1) 原本を 3×3 に並べ、継ぎ目の位置に赤い印（目視用）
  2) ゲームと同じ大きさ（くり返し1枚＝72単位×地面の canvas 2px／単位＝144px）で 4×4 に並べ、画面の拡大（約 3 倍）に近づけた絵
  3) 数値：継ぎ目（左右・上下の端どうし）の色の差 ÷ 絵の中の隣どうしの差（1.0 前後＝継ぎ目が見えにくい・2 以上＝見える）
  4) 修正候補（採用していない）：Chapter 1 の地面と同じ「最小誤差の切れ目」で左右・上下をつないだ版（石の目地が切れ目で途切れる所がある＝目視の判断が要る）
"""
import importlib.util
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('hq', os.path.join(HERE, '..', 'boardhq1014', 'derive.py'))
hq = importlib.util.module_from_spec(spec); spec.loader.exec_module(hq)


def ratio(a):
    inner_x = np.abs(np.diff(a, axis=1)).mean(); inner_y = np.abs(np.diff(a, axis=0)).mean()
    return round(float(np.abs(a[:, -1] - a[:, 0]).mean() / inner_x), 2), round(float(np.abs(a[-1] - a[0]).mean() / inner_y), 2)


def main(src, out):
    os.makedirs(out, exist_ok=True)
    im = Image.open(src).convert('RGB'); a = np.asarray(im).astype(float); n = im.width
    t = Image.fromarray(np.tile(a, (3, 3, 1)).astype(np.uint8)); d = ImageDraw.Draw(t)
    for k in (n, 2 * n):
        for j in range(0, 3 * n, 24): d.line([(k, j), (k, j + 10)], fill=(255, 0, 0), width=3); d.line([(j, k), (j + 10, k)], fill=(255, 0, 0), width=3)
    t.resize((1536, 1536), Image.LANCZOS).save(os.path.join(out, 'deck_3x3_native_marked.png'))
    g = im.resize((144, 144), Image.LANCZOS)
    tile = Image.fromarray(np.tile(np.asarray(g), (4, 4, 1))).resize((576 * 3 // 2, 576 * 3 // 2), Image.BICUBIC)
    tile.save(os.path.join(out, 'deck_4x4_game_scale.png'))
    fixed = hq.periodic(hq.detrend(a), hq.BAND)
    fim = Image.fromarray(np.clip(fixed, 0, 255).astype(np.uint8))
    Image.fromarray(np.tile(np.asarray(fim), (3, 3, 1))).resize((1536, 1536), Image.LANCZOS).save(os.path.join(out, 'deck_3x3_candidate_quilted.png'))
    rep = {'original_seam_ratio_x_y': ratio(a), 'candidate_seam_ratio_x_y': ratio(fixed), 'candidate_adopted': False,
           'note': '1.0 前後＝継ぎ目が見えにくい・2 以上＝継ぎ目が見える。候補は採用していない（ゲームは原本の派生のまま）'}
    json.dump(rep, open(os.path.join(out, 'deck_seam.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(rep)


if __name__ == '__main__':
    main(*sys.argv[1:3])
