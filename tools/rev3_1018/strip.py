# 撮った画面を横に並べた1枚にする（証拠用）。python3 -I -B strip.py 出力 [--crop=y0,y1] 画像…
import sys
from PIL import Image
args = sys.argv[1:]; out = args.pop(0)
crop = None
if args and args[0].startswith('--crop='):
    crop = tuple(map(int, args.pop(0)[7:].split(',')))
ims = []
for f in args:
    im = Image.open(f).convert('RGB')
    if crop: im = im.crop((0, crop[0], im.width, crop[1]))
    ims.append(im)
h = max(i.height for i in ims); W = sum(i.width for i in ims) + 6 * (len(ims) - 1)
o = Image.new('RGB', (W, h), (10, 10, 10)); x = 0
for i in ims: o.paste(i, (x, 0)); x += i.width + 6
s = 1800 / o.width
if s < 1: o = o.resize((int(o.width * s), int(o.height * s)))
o.save(out, quality=85)
