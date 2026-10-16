# 2026-10-16 QA：ソラモ 5方向×4コマの試作シート（v5・2048×2560・512 のセル）から表示用の派生を作る（試作の受領＝本番の承認ではない）
#   python3 -I tools/qa1016/derive_soramo5.py <原本 PNG> <出力フォルダ>
#   加工：どのコマも同じ窓（セルの x 84〜428・y 92〜436＝344×344）で切り出して WebP（品質90・アルファ100）にするだけ。縮小・描き直し・反転・色の変更なし。
#   同じ窓＝セルの中の位置（足もとの高さ・左右の位置）をそのまま保つ（コマごとに切り詰めない＝足の位置が跳ねない）
import sys, hashlib, json, os
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
ROWS = ['front', 'back', 'side', 'backd', 'frontd']   # 行1 正面・行2 背面・行3 右横・行4 斜め後ろ右・行5 斜め前右
BOX = (84, 92, 428, 436)
os.makedirs(out, exist_ok=True)
im = Image.open(src); assert im.size == (2048, 2560) and im.mode == 'RGBA', (im.size, im.mode)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
rec = {'source': os.path.basename(src), 'source_sha256': sha(src), 'box': BOX, 'frames': []}
for r, key in enumerate(ROWS):
    for c in range(4):
        cell = im.crop((c * 512, r * 512, c * 512 + 512, r * 512 + 512))
        a = cell.split()[-1]
        bb = a.getbbox()
        assert bb[0] >= BOX[0] and bb[1] >= BOX[1] and bb[2] <= BOX[2] and bb[3] <= BOX[3], ('窓からはみ出す', key, c, bb)
        f = cell.crop(BOX)
        p = os.path.join(out, f'soramo_{key}_{c + 1}.webp')
        f.save(p, 'WEBP', quality=90, alpha_quality=100, method=6)
        rec['frames'].append({'file': os.path.basename(p), 'row': r + 1, 'col': c + 1, 'cell_bbox': bb, 'sha256': sha(p)})
json.dump(rec, open(os.path.join(out, 'derive.json'), 'w'), ensure_ascii=False, indent=1)
print('ok', len(rec['frames']))
