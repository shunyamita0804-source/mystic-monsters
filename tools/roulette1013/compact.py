# 2026-10-13 開発24（A）：横型ルーレットを縦に詰めるための派生画像を作る（正式素材 assets/battle/roulette/ の4枚は変えない）。
#  正式の板の絵から「技名・数値の欄（空の帯）」の行だけを抜き、上下の枠・飾り・技の絵の窓はそのまま残す（描き直し・色の加工はしない）。
#  使い方：python3 tools/roulette1013/compact.py（リポジトリ直下で）
from PIL import Image
import hashlib, os

SRC = 'assets/battle/roulette/'
OUT = 'assets/battle/roulette/compact_1013/'
# 残す行の範囲（元の画像の y。[start, end)）
CUTS = {
    'plate_normal.webp':   ('plate_normal_c.webp',   [(42, 256), (318, 360)]),          # 窓 → 下の枠（技名の空欄 256〜306 と区切り線を抜く）
    'plate_selected.webp': ('plate_selected_c.webp', [(0, 248), (300, 340), (380, 440)]),  # 窓 → 技名の帯（40行）→ 下の枠
    'plate_miss.webp':     ('plate_miss_c.webp',     [(0, 236), (250, 302), (322, 360)]),  # 窓 → 「MISS」の文字 → 下の枠（間の空きと区切り線を抜く）
    'center_frame.webp':   ('center_frame_c.webp',   [(0, 198), (362, 560)]),          # 細い枠の上下（まっすぐな縦線の途中を抜く）
}

def build():
    os.makedirs(OUT, exist_ok=True)
    rows = []
    for src, (dst, keep) in CUTS.items():
        im = Image.open(SRC + src).convert('RGBA')
        h = sum(b - a for a, b in keep)
        out = Image.new('RGBA', (im.width, h), (0, 0, 0, 0))
        y = 0
        for a, b in keep:
            out.paste(im.crop((0, a, im.width, b)), (0, y)); y += b - a
        out.save(OUT + dst, 'WEBP', quality=92, method=6)   # 元の4枚と同じ非可逆の WebP（品質92）
        sha = hashlib.sha256(open(OUT + dst, 'rb').read()).hexdigest()
        rows.append((dst, src, keep, out.size, sha))
        print(dst, out.size)
    return rows

if __name__ == '__main__':
    build()
