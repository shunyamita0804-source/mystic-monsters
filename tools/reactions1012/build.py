#!/usr/bin/env python3
"""正式モンスター5体のリアクション 30枚（2026-10-12）→ 表示用の透過 WebP とデータ js/monsters/reaction-art.js。

使い方：python3 -I tools/reactions1012/build.py <ソラモ> <ガウル> <ノビトン> <ジオル> <レグナス>（各 ZIP を展開したフォルダ）
 ・原本（1254×1254 の透過 PNG）は描き直さない・色を変えない。余白を切って（不透明度 >0 の範囲＋4px）縮小し WebP（品質90）にするだけ。
 ・縮小の倍率＝バトルの待機立ち絵（assets/battle/idle/。高さ720）と体の面積（不透明度 >8 の画素数）がそろう倍率。
   画面では待機立ち絵の高さ × hRel で出す（js/battle/arena.js の react）。原本はリポジトリに置かない（README に sha256）。
"""
import sys, os, glob, hashlib, json
import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'monsters', 'reactions_1012')
SPECIES = ['soramo', 'gauru', 'nobiton', 'jiol', 'regnas']          # 種族の番号 0〜4（IMG・SP と同じ）
PREFIX = {'soramo': 'Soramo_0', 'gauru': 'gauru_reaction_0', 'nobiton': 'nobiton_0', 'jiol': 'jiol_0', 'regnas': 'regnas_0'}
KINDS = ['joy', 'surprise', 'sad', 'eat', 'hit', 'dodge']           # 01〜06（番号順＝ユーザー指定の意味）
LABEL = {'joy': '喜ぶ', 'surprise': '驚く', 'sad': 'しょんぼり', 'eat': '食べる', 'hit': '被弾', 'dodge': '回避'}

def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()

def main(dirs):
    assert len(dirs) == 5, '5体のフォルダ'
    data, rows = {}, []
    for sp, d in zip(SPECIES, dirs):
        idle = np.array(Image.open(os.path.join(ROOT, 'assets', 'battle', 'idle', f'idle_{sp}.webp')).convert('RGBA'))[:, :, 3]
        ai, ih = int((idle > 8).sum()), idle.shape[0]
        os.makedirs(os.path.join(OUT, sp), exist_ok=True)
        data[sp] = {}
        for i, k in enumerate(KINDS, 1):
            src = [f for f in glob.glob(os.path.join(d, '**', PREFIX[sp] + str(i) + '*.png'), recursive=True)]
            assert len(src) == 1, (sp, k, src)
            im = Image.open(src[0]).convert('RGBA'); a = np.array(im)[:, :, 3]
            ys, xs = np.nonzero(a > 0)
            box = (max(0, xs.min() - 4), max(0, ys.min() - 4), min(im.width, xs.max() + 5), min(im.height, ys.max() + 5))
            s = (ai / int((a > 8).sum())) ** 0.5
            c = im.crop(box); w, h = round(c.width * s), round(c.height * s)
            c = c.resize((w, h), Image.LANCZOS)
            name = f'{i:02d}_{k}.webp'
            c.save(os.path.join(OUT, sp, name), 'WEBP', quality=90, method=6)
            data[sp][k] = {'w': w, 'h': h, 'hRel': round(h / ih, 3)}
            rows.append((sp, f'{i:02d}', LABEL[k], os.path.relpath(src[0], d), sha(src[0]), f'{sp}/{name}', f'{w}×{h}'))
    js = os.path.join(ROOT, 'js', 'monsters', 'reaction-art.data.js')
    with open(js, 'w') as f:
        f.write('// tools/reactions1012/build.py が作る（手で直さない）。種族キー → 6種 → 表示用の WebP の大きさと、待機立ち絵（高さ720）に対する高さ hRel\n')
        f.write('window.MMRXART_DATA = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
    with open(os.path.join(OUT, 'sha256_originals.tsv'), 'w') as f:
        f.write('species\tno\tkind\toriginal\tsha256\tderived\tsize\n')
        for r in rows: f.write('\t'.join(r) + '\n')
    print('ok', len(rows))

if __name__ == '__main__':
    main(sys.argv[1:])
