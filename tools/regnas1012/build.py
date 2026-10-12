# レグナスの技アニメ 48枚（2026-10-12 正式補正版 透過PNG 1of7〜7of7）→ 表示用の WebP と js/battle/regnas-moves-data.js（手で書き換えない）
#   使い方：python3 -I tools/regnas1012/build.py <展開したフォルダ（01_しっぽアタック … 10_残影ステップ）> [確認用の一覧 JPEG]
#   ・原本の PNG（2514×1898・RGBA）は変えない・リポジトリに置かない（sha256 は assets/battle/regnas_moves_1012/sha256.txt）
#   ・1枚の中に本体と効果が描かれている（別の層は無い）＝技ごとに全コマ共通の範囲で切る（コマの間の位置・大きさ・接地は原本のまま）
#   ・b＝本体の外接矩形＝その技の1コマ目（効果の無い構え）の不透明度 200 を超える範囲。全コマ同じ値（効果でコマごとに位置がずれない）
#   ・透明な余白を切る（不透明度 4 以下を外す・周り 2%）→ 0.35倍 → WebP（品質 86・透明あり）
#   ・技の番号＝SK の 20＋（正式No−1）（js/battle/rival-partner.js）。納品のフォルダの番号は正式No と違う（下の表＝依頼書のとおり）
import sys, os, json, hashlib, glob
import numpy as np
from PIL import Image, ImageDraw

SRC = sys.argv[1]
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'battle', 'regnas_moves_1012')
SC = 0.35
# (正式No, 正式の技名, 納品のフォルダ, 本体の位置のモード（コマごと）, 当たる区切り（1から・補助技は None）)
MOVES = [
  (1, 'きりさく', '02_きりさく', ['self', 'lunge', 'contact', 'back'], 3),
  (2, 'しっぽアタック', '01_しっぽアタック', ['self', 'self', 'lunge', 'back'], 3),
  (3, '竜眼ロック', '09_竜眼ロック', ['self', 'self', 'self', 'self'], None),
  (4, '残影ステップ', '10_残影ステップ', ['self', 'self', 'self', 'self'], None),
  (5, 'ドラゴンクラッシュ', '06_ドラゴンクラッシュ', ['self', 'move', 'contact', 'back'], 3),
  (6, '蒼光ブレス', '08_蒼光ブレス', ['self', 'lunge', 'lunge', 'back'], 2),
  (7, 'スナイプファング', '07_スナイプファング', ['self', 'move', 'contact', 'back'], 3),
  (8, '幻影クロー', '03_幻影クロー', ['self', 'move', 'contact', 'back'], 3),
  (9, '蒼刃乱舞', '04_蒼刃乱舞', ['self', 'move', 'contact', 'contact', 'contact', 'contact', 'contact', 'back'], 3),
  (10, 'テイルサイクロン', '05_テイルサイクロン', ['self', 'lunge', 'move', 'move', 'contact', 'contact', 'contact', 'back'], 5),
]
def bbox(al, thr):
    ys, xs = np.nonzero(al > thr); return (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
def body_box(al):
    ys, xs = np.nonzero(al > 200)
    q = lambda v, p: int(np.percentile(v, p))
    return [q(xs, 0.4), q(ys, 0.4), q(xs, 99.6) + 1, q(ys, 99.6) + 1]

os.makedirs(OUT, exist_ok=True)
data, sheet, shas, used = {}, [], [], set()
for no, name, folder, modes, hit in MOVES:
    k = 20 + no - 1
    fs = sorted(glob.glob(os.path.join(SRC, folder, '*.png')))
    assert len(fs) == len(modes), (folder, len(fs))
    ims = [Image.open(f).convert('RGBA') for f in fs]
    W, H = ims[0].size; mg = int(W * 0.02)
    bs = [bbox(np.asarray(im)[..., 3], 4) for im in ims]
    x0, y0 = max(0, min(b[0] for b in bs) - mg), max(0, min(b[1] for b in bs) - mg)
    x1, y1 = min(W, max(b[2] for b in bs) + mg), min(H, max(b[3] for b in bs) + mg)
    bb = body_box(np.asarray(ims[0])[y0:y1, x0:x1, 3])
    b = [round(v * SC) for v in bb]
    cuts = []
    for i, (f, im) in enumerate(zip(fs, ims)):
        used.add(f); shas.append((os.path.relpath(f, SRC), hashlib.sha256(open(f, 'rb').read()).hexdigest()))
        c = im.crop((x0, y0, x1, y1)); out = c.resize((round(c.size[0] * SC), round(c.size[1] * SC)), Image.LANCZOS)
        of = f'{k}_{i + 1:02d}.webp'; out.save(os.path.join(OUT, of), 'WEBP', quality=86, method=6)
        cuts.append({'f': of, 'src': f'R{k}_{i + 1}', 'name': os.path.basename(f), 'pw': out.size[0], 'ph': out.size[1], 'x': 0, 'y': 0, 'w': out.size[0], 'h': out.size[1], 'b': b, 'm': modes[i], 't': [i, i]})
        sheet.append((out, b, of))
    data[k] = {'no': no, 'name': name, 'folder': folder, 'steps': len(modes), 'hit': hit, 'dir': './assets/battle/regnas_moves_1012/', 'cuts': cuts, 'fx': []}
allp = set(glob.glob(os.path.join(SRC, '*', '*.png')))
assert used == allp and len(used) == 48, sorted(os.path.basename(x) for x in allp - used)
js = ('// レグナスの技アニメ（2026-10-12 正式補正版 透過PNG 全48枚）のデータ（tools/regnas1012/build.py が作る。手で書き換えない）\n'
      '// 技の番号（SK 20〜29＝正式No 1〜10）→ { no, name, folder（納品のフォルダ名）, steps, hit, dir, cuts:[コマ { f, m＝位置のモード, b＝本体（1コマ目）, t }], fx:[] }\n'
      'window.MMREMV_DATA = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
open(os.path.join(ROOT, 'js', 'battle', 'regnas-moves-data.js'), 'w', encoding='utf-8').write(js)
open(os.path.join(OUT, 'sha256.txt'), 'w').write(''.join(f'{h}  {f}\n' for f, h in sorted(shas)))
if len(sys.argv) > 2:
    T = 200; cols = 8; rows = (len(sheet) + cols - 1) // cols
    S = Image.new('RGB', (T * cols, T * rows), (30, 34, 50)); dr = ImageDraw.Draw(S)
    for n, (im, bb, of) in enumerate(sheet):
        f = min((T - 16) / im.size[0], (T - 16) / im.size[1]); t = im.resize((max(1, int(im.size[0] * f)), max(1, int(im.size[1] * f))))
        x, y = (n % cols) * T + 4, (n // cols) * T + 12; S.paste(t, (x, y), t); dr.text((x, y - 11), of, fill=(255, 255, 200))
        if bb: dr.rectangle([x + bb[0] * f, y + bb[1] * f, x + bb[2] * f, y + bb[3] * f], outline=(255, 60, 60))
    S.save(sys.argv[2], quality=82)
print('ok', len(shas), '枚')
