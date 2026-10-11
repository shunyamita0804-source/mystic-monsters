"""操作欄の正式画像（deck_start.webp）の「休む」の下に焼き込まれた「疲れ -30」だけを空欄にした派生を作る（2026-10-12・P2）。
  python3 -I tools/p2/blank_deck_rest.py
  入力：assets/fields/ch1a/ui/deck_start.webp（原本は書き換えない）
  出力：assets/fields/ch1a/ui/deck_start_hunger.webp（WebP 品質92）。文字の範囲（字と影）を、左右の外の地の色で行ごとに横へつないで埋める。
  空欄には HTML で「空腹 −10」を重ねる（js/chapter/world-board.js・field-view.js の .chwlbl）"""
import os
import numpy as np
from PIL import Image
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
SRC = os.path.join(ROOT, 'assets/fields/ch1a/ui/deck_start.webp')
DST = os.path.join(ROOT, 'assets/fields/ch1a/ui/deck_start_hunger.webp')
X0, Y0, X1, Y1 = 860, 119, 970, 147          # 「疲れ -30」の範囲（1100×353 の画素）
im = Image.open(SRC).convert('RGBA'); assert im.size == (1100, 353), im.size
a = np.asarray(im).astype(np.float64)
# 行ごとに、範囲の左右の外の地の色（数画素の平均）から横へなめらかにつなぐ（上の飾りの星の先が下へ流れ込まない）
L = a[Y0:Y1, X0 - 4:X0, :3].mean(1); R = a[Y0:Y1, X1:X1 + 4, :3].mean(1)
t = np.linspace(0, 1, X1 - X0)[None, :, None]
a[Y0:Y1, X0:X1, :3] = L[:, None, :] * (1 - t) + R[:, None, :] * t
out = Image.fromarray(np.clip(np.round(a), 0, 255).astype(np.uint8), 'RGBA')
out.save(DST, 'WEBP', quality=92, alpha_quality=100, method=6)
print(DST, os.path.getsize(DST))
