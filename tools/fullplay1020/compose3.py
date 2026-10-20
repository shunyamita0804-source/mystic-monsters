"""2026-10-20 追加指示：同じ画角の3枚（main 1e96028／full1 132aebe／full2＝今回）を横に並べた比較画像（capture.mjs の出力 → JPEG）。
使い方：python3 -I tools/fullplay1020/compose3.py <main の撮影> <full1 の撮影> <今回の撮影> <出力フォルダ>
各列は 390×844 の撮影を幅 280 に縮める・上に版の札。撮影が無い版は灰色の札（「撮影なし」）。"""
import sys, os
from PIL import Image, ImageDraw, ImageFont
A, B, C, OUT = sys.argv[1:5]
os.makedirs(OUT, exist_ok=True)
LAB = ['before: main 1e96028', 'full1 (132aebe)', 'after: full2 (今回)']
W = 280
def font(sz):
    for f in ['/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc', '/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc', '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc']:
        if os.path.exists(f): return ImageFont.truetype(f, sz)
    return ImageFont.load_default()
F = font(15)
names = sorted(set(os.listdir(A)) | set(os.listdir(B)) | set(os.listdir(C)))
for n in names:
    if not n.endswith('.png'): continue
    cols = []
    for d in (A, B, C):
        p = os.path.join(d, n)
        if os.path.exists(p):
            im = Image.open(p).convert('RGB'); im = im.resize((W, round(im.height * W / im.width)), Image.LANCZOS)
        else:
            im = Image.new('RGB', (W, round(844 * W / 390)), (90, 90, 90)); ImageDraw.Draw(im).text((20, 200), '撮影なし', fill=(255, 255, 255), font=F)
        cols.append(im)
    H = max(c.height for c in cols)
    out = Image.new('RGB', (W * 3 + 8, H + 24), (255, 255, 255)); d = ImageDraw.Draw(out)
    for i, c in enumerate(cols):
        out.paste(c, (i * (W + 4), 24)); d.text((i * (W + 4) + 4, 3), LAB[i], fill=(0, 0, 0), font=F)
    out.save(os.path.join(OUT, 'cmp3_' + n[:-4] + '.jpg'), quality=78, optimize=True)
print(len(names), 'images')
