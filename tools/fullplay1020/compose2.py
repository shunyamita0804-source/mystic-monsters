"""2026-10-20 道路美術 P0：同じ画角の2枚（修正前＝full2／修正後）を横に並べた比較画像（capture.mjs の出力 → JPEG）。
使い方：python3 -I tools/fullplay1020/compose2.py <修正前の撮影> <修正後の撮影> <出力フォルダ> [左の札] [右の札] [幅=280]
撮影が無い方は灰色の札（「撮影なし」）。"""
import sys, os
from PIL import Image, ImageDraw, ImageFont
A, B, OUT = sys.argv[1:4]
LA = sys.argv[4] if len(sys.argv) > 4 else 'before: full2 (37683b9)'
LB = sys.argv[5] if len(sys.argv) > 5 else 'after: road1 (今回)'
W = int(sys.argv[6]) if len(sys.argv) > 6 else 280
os.makedirs(OUT, exist_ok=True)
def font(sz):
    for f in ['/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', '/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc', '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc']:
        if os.path.exists(f): return ImageFont.truetype(f, sz)
    return ImageFont.load_default()
F = font(15)
names = sorted(n for n in set(os.listdir(A)) | set(os.listdir(B)) if n.endswith('.png'))
for n in names:
    cols = []
    for d in (A, B):
        p = os.path.join(d, n)
        if os.path.exists(p):
            im = Image.open(p).convert('RGB'); im = im.resize((W, round(im.height * W / im.width)), Image.LANCZOS)
        else:
            im = Image.new('RGB', (W, round(844 * W / 390)), (90, 90, 90)); ImageDraw.Draw(im).text((20, 200), '撮影なし', fill=(255, 255, 255), font=F)
        cols.append(im)
    H = max(c.height for c in cols)
    out = Image.new('RGB', (W * 2 + 4, H + 24), (255, 255, 255)); d = ImageDraw.Draw(out)
    for i, c in enumerate(cols):
        out.paste(c, (i * (W + 4), 24)); d.text((i * (W + 4) + 4, 3), (LA, LB)[i], fill=(0, 0, 0), font=F)
    out.save(os.path.join(OUT, 'cmp_' + n[:-4] + '.jpg'), quality=78, optimize=True)
print(len(names), 'images')
