# ジオルの技アニメ 96枚（2026-10-12 正式採用用・透過補正版 1of9〜9of9）→ 表示用の WebP と js/battle/jiol-moves-data.js（手で書き換えない）
#   使い方：python3 -I tools/jiol1012/build.py <展開したフォルダ（01_パンチ … 10_クリスタルノヴァ）> [確認用の一覧 JPEG]
#   ・原本の PNG（1872×1248・RGBA）は変えない・緑を抜き直さない・リポジトリに置かない（sha256 は assets/battle/jiol_moves_1012/sha256.txt）
#   ・「キャラNコマ目」と「エフェクトNコマ目」は同じキャンバスの別の層＝同じ技・同じコマ番号を同じ時刻に重ねる。
#     本体の上に重ねる効果（土埃・軌道・溜めの光）＝技ごとに全コマ共通の範囲で切る（原本の位置合わせ・接地のまま）
#     着弾の効果（tgt）＝相手の体へ・光線（ray）＝自分の胸から相手へ伸ばす・自分への効果（self）＝自分の上 → その層だけ自分の範囲で切る
#   ・透明な余白を切る（不透明度 4 以下を外す・周り 2%）→ 0.35倍 → WebP（品質 86・透明あり）
#   ・技の番号＝正式の技表（js/phase10/monsters.js の OFFICIAL_MOVES.jiol.list）の番号 1〜10。**SK の番号は無い**（ジオルの技の性能・番号は未決＝バトルでは使わない）
import sys, os, re, json, hashlib, glob
import numpy as np
from PIL import Image, ImageDraw

SRC = sys.argv[1]
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'battle', 'jiol_moves_1012')
SC = 0.35
# (正式No, 技名, フォルダ, 本体の位置のモード（コマごと）, 当たる区切り（1から・補助技は None）, 別に置く効果 {コマ番号: at})
MOVES = [
  (1, 'パンチ', '01_パンチ', ['self', 'lunge', 'contact', 'back'], 3, {3: 'tgt', 4: 'tgt'}),
  (2, 'キック', '02_キック', ['self', 'lunge', 'contact', 'back'], 3, {3: 'tgt', 4: 'tgt'}),
  (3, '力をためる', '03_力をためる', ['self', 'self', 'self', 'self'], None, {}),
  (4, 'のしかかり', '04_のしかかり', ['self', 'move', 'contact', 'back'], 3, {3: 'tgt', 4: 'tgt'}),
  (5, 'グランドハンマー', '05_グランドハンマー', ['self', 'self', 'lunge', 'lunge'], 3, {3: 'tgt', 4: 'tgt'}),
  (6, 'クリスタルレイ', '06_クリスタルレイ', ['self', 'self', 'self', 'self'], 3, {3: 'ray', 4: 'tgt'}),
  (7, 'グランドスパイク', '07_グランドスパイク', ['self', 'self', 'lunge', 'back'], 3, {3: 'tgt', 4: 'tgt'}),
  (8, 'ロックアッパー', '08_ロックアッパー', ['self', 'lunge', 'contact', 'back'], 3, {3: 'tgt', 4: 'tgt'}),
  (9, 'ジオインパクト', '09_ジオインパクト', ['self', 'self', 'self', 'lunge', 'move', 'contact', 'contact', 'contact', 'back', 'back', 'back', 'back'], 6,
   {6: 'tgt', 7: 'tgt', 8: 'tgt', 9: 'tgt', 10: 'tgt', 11: 'self', 12: 'self'}),
  (10, 'クリスタルノヴァ', '10_クリスタルノヴァ', ['self', 'self', 'self', 'self'], 3, {4: 'tgt'}),   # 2・3 は本体の層にも光線が描かれている＝同じ切り出しで重ねる（光線が二重にならない）
]
def bbox(al, thr=4):
    ys, xs = np.nonzero(al > thr); return (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1) if len(xs) else None
def body_box(al):
    ys, xs = np.nonzero(al > 200)
    q = lambda v, p: int(np.percentile(v, p))
    return [q(xs, 0.4), q(ys, 0.4), q(xs, 99.6) + 1, q(ys, 99.6) + 1]
def save(im, of):
    # REUSE=1：すでにある WebP はそのまま使う（作り直す技のファイルだけ消してから実行）
    if os.environ.get('REUSE') == '1' and os.path.exists(os.path.join(OUT, of)): return Image.open(os.path.join(OUT, of))
    out = im.resize((max(1, round(im.size[0] * SC)), max(1, round(im.size[1] * SC))), Image.LANCZOS)
    out.save(os.path.join(OUT, of), 'WEBP', quality=86, method=6); return out
LAYER = re.compile(r'_(キャラ|エフェクト)(\d+)コマ目_')

os.makedirs(OUT, exist_ok=True)
data, sheet, shas, used = {}, [], [], set()
for no, name, folder, modes, hit, sep in MOVES:
    fs = glob.glob(os.path.join(SRC, folder, '*.png')); ch, ef = {}, {}
    for f in fs:
        m = LAYER.search(os.path.basename(f)); assert m, f
        (ch if m.group(1) == 'キャラ' else ef)[int(m.group(2))] = f
    n = len(modes); assert sorted(ch) == list(range(1, n + 1)) and sorted(ef) == list(range(1, n + 1)), (folder, sorted(ch), sorted(ef))
    C = {i: Image.open(ch[i]).convert('RGBA') for i in ch}; E = {i: Image.open(ef[i]).convert('RGBA') for i in ef}
    W, H = C[1].size; mg = int(W * 0.02)
    boxes = [bbox(np.asarray(C[i])[..., 3]) for i in C] + [bbox(np.asarray(E[i])[..., 3]) for i in E if i not in sep]
    boxes = [b for b in boxes if b]
    x0, y0 = max(0, min(b[0] for b in boxes) - mg), max(0, min(b[1] for b in boxes) - mg)
    x1, y1 = min(W, max(b[2] for b in boxes) + mg), min(H, max(b[3] for b in boxes) + mg)
    cuts, fx = [], []
    for i in range(1, n + 1):
        for p in (ch[i], ef[i]): used.add(p); shas.append((os.path.relpath(p, SRC), hashlib.sha256(open(p, 'rb').read()).hexdigest()))
        of = f'j{no:02d}_{i:02d}.webp'; out = save(C[i].crop((x0, y0, x1, y1)), of)
        bb = [round(v * SC) for v in body_box(np.asarray(C[i])[y0:y1, x0:x1, 3])]
        ent = {'f': of, 'src': f'J{no}_{i}', 'name': os.path.basename(ch[i]), 'pw': out.size[0], 'ph': out.size[1], 'x': 0, 'y': 0, 'w': out.size[0], 'h': out.size[1], 'b': bb, 'm': modes[i - 1], 't': [i - 1, i - 1]}
        sheet.append((out, bb, of))
        ofx = f'j{no:02d}_{i:02d}_fx.webp'
        if i in sep:   # 別に置く層（自分の範囲で切る）
            eb = bbox(np.asarray(E[i])[..., 3])
            eo = save(E[i].crop((max(0, eb[0] - mg), max(0, eb[1] - mg), min(W, eb[2] + mg), min(H, eb[3] + mg))), ofx)
            fx.append({'f': ofx, 'src': f'J{no}_{i}_fx', 'name': os.path.basename(ef[i]), 'at': sep[i], 'pw': eo.size[0], 'ph': eo.size[1], 't': [i - 1, i - 1]})
        else:          # 本体の上に同じ切り出しで重ねる
            eo = save(E[i].crop((x0, y0, x1, y1)), ofx); ent['fx'] = ofx; ent['fxName'] = os.path.basename(ef[i])
        sheet.append((eo, None, ofx))
        cuts.append(ent)
    data[no] = {'no': no, 'name': name, 'folder': folder, 'steps': n, 'hit': hit, 'dir': './assets/battle/jiol_moves_1012/', 'cuts': cuts, 'fx': fx}
allp = set(glob.glob(os.path.join(SRC, '*', '*.png')))
assert used == allp and len(used) == 96, sorted(os.path.basename(x) for x in allp - used)
js = ('// ジオルの技アニメ（2026-10-12 正式採用用・透過補正版 全96枚）のデータ（tools/jiol1012/build.py が作る。手で書き換えない）\n'
      '// 正式の技の番号（1〜10。SK の番号は未決＝バトルでは使わない・開発用のプレビュー MM25D.preview だけ）→\n'
      '//   { no, name, folder, steps, hit, dir, cuts:[本体 { f, fx＝同じ切り出しの効果の層, m, b, t }], fx:[別に置く層 { f, at＝tgt／ray／self, t }] }\n'
      'window.MMJIMV_DATA = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
open(os.path.join(ROOT, 'js', 'battle', 'jiol-moves-data.js'), 'w', encoding='utf-8').write(js)
open(os.path.join(OUT, 'sha256.txt'), 'w').write(''.join(f'{h}  {f}\n' for f, h in sorted(shas)))
if len(sys.argv) > 2:
    T = 170; cols = 8; rows = (len(sheet) + cols - 1) // cols
    S = Image.new('RGB', (T * cols, T * rows), (30, 34, 50)); dr = ImageDraw.Draw(S)
    for n2, (im, bb, of) in enumerate(sheet):
        f = min((T - 16) / im.size[0], (T - 16) / im.size[1]); t = im.resize((max(1, int(im.size[0] * f)), max(1, int(im.size[1] * f))))
        x, y = (n2 % cols) * T + 4, (n2 // cols) * T + 12; S.paste(t, (x, y), t); dr.text((x, y - 11), of, fill=(255, 255, 200))
        if bb: dr.rectangle([x + bb[0] * f, y + bb[1] * f, x + bb[2] * f, y + bb[3] * f], outline=(255, 60, 60))
    S.save(sys.argv[2], quality=82)
print('ok', len(shas), '枚')
