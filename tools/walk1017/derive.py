# 2026-10-17 ボード用 新歩行 7体×5方向×4コマ＝140コマ（ZIP Mismon_BoardWalk_20261017_A／B／C の frames/<種族>/00〜19.png・512×512 RGBA）→ 表示用の WebP 384×384
#   python3 -I -B tools/walk1017/derive.py <A の展開> <B の展開> <C の展開>
#   ・原本の PNG・一覧シートはリポジトリに置かない（README.md に原本と派生の sha256）。縮小（LANCZOS）と WebP 化だけ（描き直し・切り出しの窓の変更なし＝足もとの位置は全コマ同じ）
#   ・行（00〜19 の 4 つずつ）＝front・back・side（右横）・backd（右斜め後ろ）・frontd（右斜め前）。列＝右足・戻す・左足・戻す。左向きは左右反転（盤の側）
#   ・h＝静止の立ち絵の見えている高さに対する絵の箱の高さ（正面の2コマ目＝足をそろえた姿の体の高さで割る）・foot＝足の下の透明な余白の割合 → tools/walk1017/derive.json（js/qa/walk5-1016.js の NEW7）
import sys, os, glob, hashlib, json
import numpy as np
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'monsters', 'walk_1017')
NAMES = {'Soramo': 'solamo', 'Gauru': 'gauru', 'Nobiton': 'nobiton', 'Jiol': 'jiol', 'Regnas': 'regnas', 'Fulune': 'flurene', 'Razuck': 'razuck'}
DIRS = ['front', 'back', 'side', 'backd', 'frontd']
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
rows, spec = [], {}
srcs = {}
for base in sys.argv[1:4]:
    for d in sorted(glob.glob(os.path.join(base, 'frames', '*'))):
        n = os.path.basename(d)
        if n in NAMES: srcs[n] = d
assert sorted(srcs) == sorted(NAMES), srcs
for n, key in NAMES.items():
    fs = [os.path.join(srcs[n], f'{i:02d}.png') for i in range(20)]
    assert all(os.path.isfile(f) for f in fs), n
    os.makedirs(os.path.join(OUT, key), exist_ok=True)
    for i, f in enumerate(fs):
        im = Image.open(f); assert im.size == (512, 512) and im.mode == 'RGBA', (f, im.size, im.mode)
        o = os.path.join(OUT, key, f'{DIRS[i // 4]}_{i % 4 + 1}.webp')
        im.resize((384, 384), Image.LANCZOS).save(o, 'WEBP', quality=88, method=6)
        rows.append((key, os.path.relpath(f, os.path.dirname(srcs[n])), sha(f), os.path.relpath(o, ROOT), sha(o)))
    a = np.asarray(Image.open(fs[1]))[..., 3]; ys = np.nonzero((a > 8).any(axis=1))[0]
    top, bot = int(ys.min()), int(ys.max()) + 1
    spec[key] = {'h': round(512 / (bot - top), 3), 'foot': round((512 - bot) / 512, 3)}
json.dump(spec, open(os.path.join(ROOT, 'tools', 'walk1017', 'derive.json'), 'w'), indent=1)
with open(os.path.join(OUT, 'README.md'), 'w', encoding='utf-8') as f:
    f.write('# ボード用 新歩行 7体×5方向×4コマ（2026-10-17・QA の比較だけ＝URL の ?qaWalk=1017）\n\n')
    f.write('- 原本＝ZIP Mismon_BoardWalk_20261017_A_Soramo_Gauru_Nobiton／B_Jiol_Regnas_Fulune／C_Razuck の frames/<種族>/00〜19.png（512×512 RGBA）。一覧シート・GIF は使わない（同時に読み込まない）・リポジトリに置かない\n')
    f.write('- 派生＝384×384 の WebP（品質 88）。縮小だけ（切り出しの窓は原本のまま＝全コマ足もとが同じ）。行＝front・back・side（右横）・backd（右斜め後ろ）・frontd（右斜め前）。左向きは盤で左右反転\n')
    f.write('- 旧 8コマの歩行（assets/monsters/walk_25d/・walk_1015 など）はそのまま＝通常の URL では従来の歩行。iPhone の実機は未確認\n\n')
    f.write('| 種族 | h | foot |\n|---|---|---|\n' + ''.join(f'| {k} | {v["h"]} | {v["foot"]} |\n' for k, v in spec.items()) + '\n')
    f.write('| 種族 | 原本 | 原本 sha256 | 派生 | 派生 sha256 |\n|---|---|---|---|---|\n' + ''.join(f'| {r[0]} | {r[1]} | {r[2]} | {r[3]} | {r[4]} |\n' for r in rows))
print(json.dumps(spec), len(rows))
