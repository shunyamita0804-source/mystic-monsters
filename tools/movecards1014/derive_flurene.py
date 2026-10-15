"""2026-10-15：フルーネの正式技カード10枚（背景あり PNG 1664×936・ZIP Mismon_Flurene_10SkillCards_20261015）→ 表示用 WebP。
使い方: python3 -I tools/movecards1014/derive_flurene.py <PNG のフォルダ> <出力 assets/moves/cards_1014>
変換は既存50枚と同じ（幅 640px へ縮小・縦横比のまま・LANCZOS → WebP 品質 84・method 6）。切り抜き・描き直し・色の加工なし。
原本の PNG はリポジトリに置かない（README.md に sha256）。ファイル名＝{カードの番号}_{技ID}.webp（技ID＝納品のファイル名のローマ字）。"""
import sys, os, re, glob, hashlib
from PIL import Image
src, out = sys.argv[1:3]
d = os.path.join(out, 'flurene'); os.makedirs(d, exist_ok=True)
for p in sorted(glob.glob(os.path.join(src, 'FLURENE_*.png'))):
    m = re.match(r'FLURENE_(\d\d)_(\w+)\.png$', os.path.basename(p))
    im = Image.open(p)
    if im.size != (1664, 936): raise SystemExit('大きさが違う: ' + p)
    im = im.convert('RGB'); w = 640; h = round(im.height * w / im.width)
    name = '%s_%s.webp' % (m.group(1), m.group(2))
    im.resize((w, h), Image.LANCZOS).save(os.path.join(d, name), 'WEBP', quality=84, method=6)
    print('\t'.join(['flurene', str(int(m.group(1))), os.path.basename(p), '1664x936', hashlib.sha256(open(p, 'rb').read()).hexdigest(), 'flurene/' + name]))
