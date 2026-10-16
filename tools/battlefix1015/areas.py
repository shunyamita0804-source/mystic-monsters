# 2026-10-15 夜（STEP1 共通スケール）：技のコマと待機立ち絵の「見えている体の面積」（アルファ 128 以上の画素数 ÷ 絵の面積）を測って
#  js/battle/move-area-1015.js（MMAREA）に書く。技のコマの大きさ＝待機立ち絵と体の面積がそろう倍率（姿勢＝しゃがむ・伸びるに左右されにくい）。
#  使い方：python3 -I tools/battlefix1015/areas.py
import os, json, glob
import numpy as np
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
out = {}
dirs = ['soramo_moves_1012', 'gauru_moves_1012', 'nobiton_moves_1012', 'jiol_moves_1012', 'regnas_moves_1012', 'flurene_moves_1015', 'idle']
for d in dirs:
    for p in sorted(glob.glob(os.path.join(ROOT, 'assets', 'battle', d, '*.webp'))):
        n = os.path.basename(p)
        if '_fx' in n or n.startswith('sp_') or '_ex' in n: continue
        a = np.array(Image.open(p).convert('RGBA'))[:, :, 3]
        out[d + '/' + n] = round(float((a >= 128).mean()), 5)
js = ('// 自動生成（tools/battlefix1015/areas.py）。技のコマ・待機立ち絵の「見えている体の面積」の割合（アルファ 128 以上の画素 ÷ 絵の全体）。手で書き換えない\n'
      '(function (root) { root.MMAREA = Object.freeze(' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + '); })(typeof window !== \'undefined\' ? window : globalThis);\n')
open(os.path.join(ROOT, 'js', 'battle', 'move-area-1015.js'), 'w').write(js)
print(len(out), 'entries')
