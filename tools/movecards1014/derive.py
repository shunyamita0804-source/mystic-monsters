"""開発30：正式5体×10技の技カード（背景あり PNG）→ 表示用 WebP。
使い方: python3 -I tools/movecards1014/derive.py <対応表.tsv> <PNG を探すフォルダ> <出力 assets/moves/cards_1014>
変換：幅 640px へ縮小（縦横比のまま・LANCZOS）→ WebP 品質 84（method 6）。切り抜き・描き直し・色の加工なし。
原本の PNG はリポジトリに置かない（README.md に sha256）。"""
import sys, os, csv, hashlib, glob
from PIL import Image
tsv, src, out = sys.argv[1:4]
files = {os.path.basename(p): p for p in glob.glob(os.path.join(src, '**', '*.png'), recursive=True) if os.path.basename(os.path.dirname(p)).startswith('part') and '背景あり' in os.path.dirname(p)}
# 対応表の ID の綴りがコードと違うもの（コード側＝js/phase10/monsters.js の OFFICIAL_MOVES を正とする）
ID_FIX = {('solamo', 'star_crush'): 'star_crash'}
rows = list(csv.DictReader(open(tsv, encoding='utf-8-sig'), delimiter='\t'))
log = []
for r in rows:
    p = files[r['source_png_filename']]
    if not os.path.basename(os.path.dirname(p)).startswith('part'):
        raise SystemExit('背景ありのフォルダ以外: ' + p)
    im = Image.open(p).convert('RGB')
    w = 640; h = round(im.height * w / im.width)
    d = os.path.join(out, r['species_key']); os.makedirs(d, exist_ok=True)
    mid = ID_FIX.get((r['species_key'], r['official_move_id_current']), r['official_move_id_current'])
    name = '%02d_%s.webp' % (int(r['source_card_order_1to10']), mid)
    im.resize((w, h), Image.LANCZOS).save(os.path.join(d, name), 'WEBP', quality=84, method=6)
    sha = hashlib.sha256(open(p, 'rb').read()).hexdigest()
    log.append((r['species_key'], r['source_card_order_1to10'], r['source_png_filename'], '%dx%d' % Image.open(p).size, sha, r['species_key'] + '/' + name))
for l in log: print('\t'.join(l))
