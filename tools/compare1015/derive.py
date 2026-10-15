"""2026-10-15：新しいパラメーター比較画面の肩上アップ6枚（ユーザー承認済み・1254×1254 の透過 PNG）→ 表示用 WebP。
使い方: python3 -I tools/compare1015/derive.py <02_ComparePortraits のフォルダ> <出力 assets/monsters/compare_1015>
変換：640×640 へ縮小（LANCZOS・乗算済みアルファで縮小＝縁に白／黒のにじみを出さない）→ WebP 品質 90（method 6・アルファあり）。
切り抜き・描き直し・色の加工・左右反転なし（右側の反転は画面の CSS で行う）。原本はリポジトリに置かない（README.md に sha256）。"""
import sys, os, hashlib
from PIL import Image
src, out = sys.argv[1:3]
os.makedirs(out, exist_ok=True)
MAP = [('01_Solamo.png', 'solamo'), ('02_Gauru.png', 'gauru'), ('03_Nobiton.png', 'nobiton'), ('04_Jiol.png', 'jiol'), ('05_Regnas.png', 'regnas'), ('06_Flurene.png', 'flurene')]
for f, key in MAP:
    p = os.path.join(src, f); im = Image.open(p)
    if im.size != (1254, 1254) or im.mode != 'RGBA': raise SystemExit('形式が違う: ' + p)
    pm = im.convert('RGBa').resize((640, 640), Image.LANCZOS).convert('RGBA')
    pm.save(os.path.join(out, key + '.webp'), 'WEBP', quality=90, method=6, exact=False)
    o = os.path.join(out, key + '.webp')
    print('\t'.join([key, f, '1254x1254', hashlib.sha256(open(p, 'rb').read()).hexdigest(), key + '.webp', hashlib.sha256(open(o, 'rb').read()).hexdigest()]))
