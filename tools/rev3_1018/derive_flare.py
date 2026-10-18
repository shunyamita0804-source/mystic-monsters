# 2026-10-18 REV3 A1：ガウル SK16 フレアレイの「赤い炎の光線」の層を、採用済みの 2.5D 完全版のコマ（assets/battle/2p5d/gauru/16_03・16_05＝
#  ユーザー納品のシート 08_フレアレイ_1／_2 の g08_3・g08b_2）から切り出す。絵は描き直さない・色は変えない＝嘴の先から右の部分を切り出し、
#  左端（嘴の先）だけ 22px で透明へ溶かす（顔・羽根を光線の層に入れない）。出力は assets/battle/gauru_moves_1012/16_beam_a.webp／16_beam_b.webp
#  使い方：python3 -I -B tools/rev3_1018/derive_flare.py（リポジトリ直下で）
import hashlib, json, sys
from PIL import Image
SRC = 'assets/battle/2p5d/gauru/'
OUT = 'assets/battle/gauru_moves_1012/'
# name: (元のコマ, 嘴の先の x, 上, 下)
CUTS = {'16_beam_a': ('16_03.webp', 226, 20, 316), '16_beam_b': ('16_05.webp', 182, 10, 316)}
FADE = 22
meta = {}
for name, (f, mx, y0, y1) in CUTS.items():
    im = Image.open(SRC + f).convert('RGBA')
    c = im.crop((mx, y0, im.width, y1))
    px = c.load()
    for x in range(min(FADE, c.width)):
        k = x / FADE
        for y in range(c.height):
            r, g, b, a = px[x, y]
            px[x, y] = (r, g, b, int(a * k))
    c.save(OUT + name + '.webp', 'WEBP', quality=88, method=6)
    meta[name] = {'from': SRC + f, 'src_sha256': hashlib.sha256(open(SRC + f, 'rb').read()).hexdigest(),
                  'out_sha256': hashlib.sha256(open(OUT + name + '.webp', 'rb').read()).hexdigest(),
                  'crop': [mx, y0, im.width, y1], 'size': list(c.size)}
json.dump(meta, open('tools/rev3_1018/derive_flare.json', 'w'), ensure_ascii=False, indent=1)
print(json.dumps(meta, ensure_ascii=False, indent=1))
