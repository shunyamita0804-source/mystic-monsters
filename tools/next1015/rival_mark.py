#!/usr/bin/env python3
"""2026-10-15 N08：ライバルのマスの奥に立てる影（リュウ＋相棒レグナス）。
正式の立ち絵（assets/npc/ryu/ryu_official_fullbody.webp・assets/monsters/2p5d/regnas.webp）の**輪郭（アルファ）だけ**を使い、
色は濃い紺紫（市場の入荷待ちの影絵 nobiton_silhouette.webp と同じ考え方＝絵の中身・色は写さない）＋外側に淡い紫の光。新しい絵は描いていない。
  python3 -I tools/next1015/rival_mark.py <リポジトリの直下>
"""
import os, sys
from PIL import Image, ImageFilter

def main(repo):
    ryu = Image.open(os.path.join(repo, 'assets/npc/ryu/ryu_official_fullbody.webp')).convert('RGBA')
    reg = Image.open(os.path.join(repo, 'assets/monsters/2p5d/regnas.webp')).convert('RGBA')
    W, H = 640, 600
    a = Image.new('L', (W, H), 0)
    rh = 560; rw = round(ryu.width * rh / ryu.height)
    ra = ryu.getchannel('A').resize((rw, rh), Image.LANCZOS)
    a.paste(ra, (W - rw - 40, H - rh - 14), ra)
    gh = 330; gw = round(reg.width * gh / reg.height)
    ga = reg.getchannel('A').resize((gw, gh), Image.LANCZOS)
    ga = ga.transpose(Image.FLIP_LEFT_RIGHT)   # レグナスはリュウの方を向いて手前に（左右の反転は輪郭だけ）
    a.paste(ga, (24, H - gh - 4), Image.composite(ga, Image.new('L', ga.size, 0), ga))
    glow = a.filter(ImageFilter.GaussianBlur(9)).point(lambda v: min(255, int(v * 1.6)))
    out = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    g = Image.new('RGBA', (W, H), (168, 104, 255, 0)); g.putalpha(glow.point(lambda v: int(v * 0.55)))
    out = Image.alpha_composite(out, g)
    body = Image.new('RGBA', (W, H), (26, 16, 52, 0)); body.putalpha(a)
    out = Image.alpha_composite(out, body)
    box = out.getchannel('A').point(lambda v: 255 if v >= 2 else 0).getbbox()
    out = out.crop(box)
    s = 360 / out.height
    out = out.convert('RGBa').resize((round(out.width * s), 360), Image.LANCZOS).convert('RGBA')
    f = os.path.join(repo, 'assets/chapter/rival_mark_1015/rival_silhouette.webp')
    out.save(f, 'WEBP', quality=88, method=6, exact=True)
    print(f, out.size)

if __name__ == '__main__':
    main(sys.argv[1])
