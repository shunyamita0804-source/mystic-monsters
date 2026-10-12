# ノビトンの技アニメ 59枚（2026-10-12・透過PNG 全59枚 1of3〜3of3）→ 表示用の WebP と js/battle/nobiton-moves-data.js（手で書き換えない）
#   使い方：python3 -I tools/nobiton1012/build.py <ノビトン技素材_全10技 のフォルダ> [確認用の一覧 JPEG]
#   ・原本の PNG（1536×1536・RGBA）は変えない・リポジトリに置かない（sha256 は assets/battle/nobiton_moves_1012/sha256.txt）
#   ・1枚ずつ独立した構図（本体 A・効果 B／C は同じ位置合わせではない）＝本体のコマは位置のモードで動かし、効果は at（tgt＝相手の体／self＝自分の上／fly＝自分から相手へ）で置く
#   ・透明な余白を切る（不透明度 4 以下を外す・周り 2%）→ 0.4倍（ソラモの 1536px の絵と同じ倍率）→ WebP（品質 86）
#   ・技の番号＝SK の 30＋（番号−1）（js/battle/rules.js の NOBI_FIRST）。名前は正式の技表（OFFICIAL_MOVES.nobiton）のまま＝フォルダ名（05 まきつく・07 ピンポイント突き）とは食い違う（報告）
import sys, os, json, hashlib, glob
import numpy as np
from PIL import Image, ImageDraw

SRC = sys.argv[1]
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'battle', 'nobiton_moves_1012')
SC = 0.4
# (番号, フォルダ, 区切り [[本体のファイルの頭（None＝前の本体のまま）, モード, [(効果のファイルの頭, at)…]], …], 当たる区切り（1から）)
MOVES = [
  (1, '01_はなビンタ', [['01_', 'self', []], ['02_', 'self', []], ['03_', 'lunge', []], ['04_', 'back', []]], 3),
  (2, '02_ずつき', [['01_', 'self', []], ['02_', 'move', []], ['03A', 'contact', [('03B', 'tgt')]], ['04_', 'back', []]], 3),
  (3, '03_はなみず', [['01_', 'self', []], ['02_', 'self', []], ['03A', 'self', [('03B', 'fly')]], [None, 'self', [('03C', 'tgt')]], ['04_', 'self', []]], 4),
  (4, '04_ひとやすみ', [['01_', 'self', []], ['02_', 'self', []], ['03_', 'self', []], ['04_', 'self', []]], None),
  (5, '05_まきつく', [['01_', 'self', []], ['02_', 'lunge', []], ['03_', 'lunge', []], ['04_', 'lunge', []], [None, 'lunge', [('05_', 'tgt')]], ['06_', 'back', []]], 5),
  (6, '06_ノーズウェーブ', [['01_', 'self', []], ['02_', 'self', []], ['03_', 'self', []], ['04_', 'self', []], [None, 'self', [('05_', 'fly')]], ['06_', 'self', []]], 5),
  (7, '07_ピンポイント突き', [['01_', 'self', []], ['02_', 'self', []], ['03A', 'lunge', [('03B', 'fly')]], ['04_', 'back', []]], 3),
  (8, '08_ミラージュノーズ', [['01_', 'self', []], ['02_', 'move', []], ['03_', 'move', []], ['04_', 'contact', []], [None, 'contact', [('05_', 'tgt')]], ['06_', 'back', []]], 5),
  (9, '09_ダウナーミスト', [['01A', 'self', []], ['02A', 'self', [('02B', 'fly')]], ['03A', 'self', [('03B', 'tgt')]], [None, 'self', [('03C', 'tgt')]], ['04A', 'self', []]], 3),
  (10, '10_ギガントノーズ', [['01A', 'self', []], ['02A', 'self', [('02B', 'self')]], ['03A', 'move', [('03B', 'self')]], ['04A', 'contact', [('04B', 'tgt')]], [None, 'contact', [('04C', 'tgt')]], ['05A', 'back', []], ['06A', 'back', []]], 4),
]
def find(folder, head):
    fs = [f for f in glob.glob(os.path.join(SRC, folder, '*.png')) if os.path.basename(f).split('_', 2)[2].startswith(head)]
    assert len(fs) == 1, (folder, head, fs); return fs[0]
def body_box(a):
    ys, xs = np.nonzero(a[..., 3] > 200)
    q = lambda v, p: int(np.percentile(v, p))
    return [q(xs, 0.4), q(ys, 0.4), q(xs, 99.6) + 1, q(ys, 99.6) + 1]
def cut(p, of):
    im = Image.open(p).convert('RGBA'); A = np.asarray(im)
    ys, xs = np.nonzero(A[..., 3] > 4); mg = int(im.size[0] * 0.02)
    x0, y0, x1, y1 = max(0, xs.min() - mg), max(0, ys.min() - mg), min(im.size[0], xs.max() + 1 + mg), min(im.size[1], ys.max() + 1 + mg)
    c = im.crop((x0, y0, x1, y1)); out = c.resize((max(1, round(c.size[0] * SC)), max(1, round(c.size[1] * SC))), Image.LANCZOS)
    out.save(os.path.join(OUT, of), 'WEBP', quality=86, method=6)
    return out, A[y0:y1, x0:x1]

os.makedirs(OUT, exist_ok=True)
data, sheet, shas, used = {}, [], [], set()
for no, folder, steps, hit in MOVES:
    k = 30 + no - 1; cuts, fx = [], []
    for i, (bh, mode, fxs) in enumerate(steps):
        if bh is None:
            cuts[-1]['t'][1] = i   # 前の本体をこの区切りまで残す
        else:
            p = find(folder, bh); used.add(p); shas.append((os.path.relpath(p, SRC), hashlib.sha256(open(p, 'rb').read()).hexdigest()))
            of = f'{k:02d}_{i + 1:02d}.webp'; out, A = cut(p, of)
            bb = [round(v * SC) for v in body_box(A)]
            cuts.append({'f': of, 'src': f'N{k}_{i + 1}', 'name': os.path.basename(p), 'pw': out.size[0], 'ph': out.size[1], 'x': 0, 'y': 0, 'w': out.size[0], 'h': out.size[1], 'b': bb, 'm': mode, 't': [i, i]})
            sheet.append((out, bb, of))
        for j, (fh, at) in enumerate(fxs):
            p = find(folder, fh); used.add(p); shas.append((os.path.relpath(p, SRC), hashlib.sha256(open(p, 'rb').read()).hexdigest()))
            of = f'{k:02d}_{i + 1:02d}_fx{j + 1}.webp'; out, _ = cut(p, of)
            fx.append({'f': of, 'src': f'N{k}_{i + 1}_fx{j + 1}', 'name': os.path.basename(p), 'at': at, 'pw': out.size[0], 'ph': out.size[1], 't': [i, i]})
            sheet.append((out, None, of))
    data[k] = {'no': no, 'folder': folder, 'steps': len(steps), 'hit': hit, 'dir': './assets/battle/nobiton_moves_1012/', 'cuts': cuts, 'fx': fx}
allp = set(glob.glob(os.path.join(SRC, '*', '*.png')))
assert used == allp, sorted(os.path.basename(x) for x in allp - used)
js = ('// ノビトンの技アニメ（2026-10-12 透過PNG 全59枚）のデータ（tools/nobiton1012/build.py が作る。手で書き換えない）\n'
      '// 技の番号（SK 30〜39）→ { no, folder（納品のフォルダ名）, steps, hit, dir, cuts:[本体のコマ { f, m, b, t }], fx:[効果 { f, at＝tgt／self／fly, t }] }\n'
      'window.MMNOMV_DATA = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
open(os.path.join(ROOT, 'js', 'battle', 'nobiton-moves-data.js'), 'w', encoding='utf-8').write(js)
open(os.path.join(OUT, 'sha256.txt'), 'w').write(''.join(f'{h}  {f}\n' for f, h in shas))
if len(sys.argv) > 2:
    T = 170; cols = 8; rows = (len(sheet) + cols - 1) // cols
    S = Image.new('RGB', (T * cols, T * rows), (30, 34, 50)); dr = ImageDraw.Draw(S)
    for n, (im, bb, of) in enumerate(sheet):
        f = min((T - 16) / im.size[0], (T - 16) / im.size[1]); t = im.resize((max(1, int(im.size[0] * f)), max(1, int(im.size[1] * f))))
        x, y = (n % cols) * T + 4, (n // cols) * T + 12; S.paste(t, (x, y), t); dr.text((x, y - 11), of, fill=(255, 255, 200))
        if bb: dr.rectangle([x + bb[0] * f, y + bb[1] * f, x + bb[2] * f, y + bb[3] * f], outline=(255, 60, 60))
    S.save(sys.argv[2], quality=82)
print('ok', len(shas), '枚')
