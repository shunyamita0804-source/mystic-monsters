# ガウルの技アニメ 95枚（2026-10-12 最終余白調整版 1of2・2of2）→ 表示用の WebP と js/battle/gauru-moves-data.js（手で書き換えない）
#   使い方：python3 -I tools/gauru1012/build.py <GAURU_技アニメ_OK のフォルダ> [確認用の一覧 JPEG]
#   ・原本の PNG（1152×1152・RGBA）は変えない・リポジトリに置かない（sha256 は assets/battle/gauru_moves_1012/sha256.txt）
#   ・本体（キャラNコマ目）と効果（エフェクトNコマ目）は同じキャンバスの別の層＝同じ切り出し範囲で切る（重ねたときの相対位置がそのまま）
#     着弾の効果（tgt）だけは相手の体の中ほどに置く＝その層だけ自分の範囲で切る
#   ・透明な余白を切る（不透明度 4 以下を外す・周り 2% の余白）→ 0.6 倍（ソラモの 1024px の絵と同じ倍率＝元の絶対の大きさ。README の「描画幅×1.125」と同じ）→ WebP（品質 86・透明あり）
#   ・b＝本体の外接矩形（不透明度 200 を超える画素の範囲。外れ値を除く 0.4〜99.6%）
#   ・特殊エフェクト3枚（20_特殊エフェクト）：バフのキラキラ＝補助・自分を強くする所（ソニックムーブ・聖なる炎の最後）、赤青白の炎のオーラ 2コマ＝聖なる炎の「聖炎を呼び起こす」から最後（自分の上）
import sys, os, json, hashlib, re, glob
import numpy as np
from PIL import Image, ImageDraw

SRC = sys.argv[1]
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'battle', 'gauru_moves_1012')
SC = 0.6
# 技の番号（SK＝js/phase10/monsters.js の OFFICIAL_MOVES.gauru.list[].slot）← 納品のフォルダ・名前・本体の位置のモード・当たる区切り（1から）・着弾の効果の区切り・特殊エフェクト
MOVES = [
  (11, '01_つつく', 'つつく', ['self', 'move', 'contact', 'back'], 3, [], []),
  (10, '02_スパイラルダイブ', 'スパイラルダイブ', ['self', 'move', 'move', 'contact'], 4, [], []),
  (13, '03_ソニックムーブ', 'ソニックムーブ', ['self', 'lunge', 'lunge', 'self'], None, [], [('buff', 4, 4)]),
  (14, '04_紅翼スラッシュ', '紅翼スラッシュ', ['self', 'self', 'contact', 'back'], 3, [], []),
  (15, '05_ファイアボール', 'ファイアボール', ['self', 'self', 'self', 'self'], 3, [3, 4], []),
  (17, '06_スカイラッシュ', 'スカイラッシュ', ['self', 'move', 'move', 'contact', 'contact', 'back'], 4, [], []),
  (16, '07_フレアレイ', 'フレアレイ', ['self', 'self', 'self', 'self'], 3, [3, 4], []),
  (18, '08_フェザーストーム', 'フェザーストーム', ['self', 'self', 'self', 'self', 'self', 'self'], 4, [4, 5], []),
  (12, '09_ウィンド', 'ウィンド', ['self', 'self', 'self', 'self'], 3, [], []),
  (19, '10_聖なる炎', '聖なる炎', ['self', 'self', 'move', 'contact', 'back', 'back'], 4, [], [('aura1', 5, 5), ('aura2', 6, 6), ('buff', 6, 6)]),
]
SPECIAL = {'aura1': 'オーラ_赤青白炎_放射_1コマ目.png', 'aura2': 'オーラ_赤青白炎_放射_2コマ目.png', 'buff': 'バフ_パラメータ上昇_キラキラ_光のみ_改訂.png'}

def bbox(al, thr=4):
    ys, xs = np.nonzero(al > thr)
    return (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1) if len(xs) else None
def body_box(a):
    ys, xs = np.nonzero(a[..., 3] > 200)
    q = lambda v, p: int(np.percentile(v, p))
    return [q(xs, 0.4), q(ys, 0.4), q(xs, 99.6) + 1, q(ys, 99.6) + 1]
def save(im, of):
    out = im.resize((max(1, round(im.size[0] * SC)), max(1, round(im.size[1] * SC))), Image.LANCZOS)
    out.save(os.path.join(OUT, of), 'WEBP', quality=86, method=6)
    return out
def num(fn):
    m = re.search(r'(キャラ|エフェクト)(\d)', fn); return (m.group(1), int(m.group(2)))

os.makedirs(OUT, exist_ok=True)
data, sheet, shas = {}, [], []
def sha(p): shas.append((os.path.relpath(p, SRC), hashlib.sha256(open(p, 'rb').read()).hexdigest()))
for k, folder, name, modes, hit, tgt, extra in MOVES:
    fs = sorted(glob.glob(os.path.join(SRC, folder, '*.png')))
    ch = {num(os.path.basename(f))[1]: f for f in fs if 'キャラ' in os.path.basename(f)}
    ef = {num(os.path.basename(f))[1]: f for f in fs if 'エフェクト' in os.path.basename(f)}
    assert sorted(ch) == list(range(1, len(modes) + 1)), (folder, sorted(ch))
    cuts, fx = [], []
    for i in range(1, len(modes) + 1):
        sha(ch[i]); B = Image.open(ch[i]).convert('RGBA'); A = np.asarray(B)
        E = None
        if i in ef: sha(ef[i]); E = Image.open(ef[i]).convert('RGBA')
        boxes = [bbox(A[..., 3])]
        if E is not None and i not in tgt: boxes.append(bbox(np.asarray(E)[..., 3]))
        boxes = [b for b in boxes if b]
        mg = int(B.size[0] * 0.02)
        x0 = max(0, min(b[0] for b in boxes) - mg); y0 = max(0, min(b[1] for b in boxes) - mg)
        x1 = min(B.size[0], max(b[2] for b in boxes) + mg); y1 = min(B.size[1], max(b[3] for b in boxes) + mg)
        of = f'{k:02d}_{i:02d}.webp'; out = save(B.crop((x0, y0, x1, y1)), of)
        pw, ph = out.size
        bb = body_box(A[y0:y1, x0:x1])
        ent = {'f': of, 'src': f'G{k}_{i}', 'name': os.path.basename(ch[i]), 'pw': pw, 'ph': ph, 'x': 0, 'y': 0, 'w': pw, 'h': ph,
               'b': [round(v * SC) for v in bb], 'm': modes[i - 1], 't': [i - 1, i - 1]}
        sheet.append((out, ent['b'], of))
        if E is not None:
            if i in tgt:   # 着弾の効果＝相手の体の中ほど（自分の範囲で切る）
                eb = bbox(np.asarray(E)[..., 3]); e0, e1 = max(0, eb[0] - mg), max(0, eb[1] - mg)
                eo = save(E.crop((e0, e1, min(E.size[0], eb[2] + mg), min(E.size[1], eb[3] + mg))), f'{k:02d}_{i:02d}_fx.webp')
                fx.append({'f': f'{k:02d}_{i:02d}_fx.webp', 'src': f'G{k}_{i}_fx', 'name': os.path.basename(ef[i]), 'at': 'tgt', 'pw': eo.size[0], 'ph': eo.size[1], 't': [i - 1, i - 1]})
                sheet.append((eo, None, f'{k:02d}_{i:02d}_fx.webp'))
            else:          # 本体の上に同じ切り出しで重ねる
                eo = save(E.crop((x0, y0, x1, y1)), f'{k:02d}_{i:02d}_fx.webp')
                ent['fx'] = f'{k:02d}_{i:02d}_fx.webp'; ent['fxName'] = os.path.basename(ef[i])
                sheet.append((eo, None, ent['fx']))
        cuts.append(ent)
    for key, a, b in extra:   # 特殊エフェクト（自分の上）
        p = os.path.join(SRC, '20_特殊エフェクト', SPECIAL[key]); E = Image.open(p).convert('RGBA')
        eb = bbox(np.asarray(E)[..., 3]); mg = int(E.size[0] * 0.02)
        of = f'sp_{key}.webp'
        if not os.path.exists(os.path.join(OUT, of)): sha(p); eo = save(E.crop((max(0, eb[0] - mg), max(0, eb[1] - mg), min(E.size[0], eb[2] + mg), min(E.size[1], eb[3] + mg))), of); sheet.append((eo, None, of))
        eo = Image.open(os.path.join(OUT, of))
        fx.append({'f': of, 'src': f'G{k}_{key}', 'name': SPECIAL[key], 'at': 'self', 'pw': eo.size[0], 'ph': eo.size[1], 't': [a - 1, b - 1]})
    data[k] = {'name': name, 'steps': len(modes), 'hit': hit, 'dir': './assets/battle/gauru_moves_1012/', 'cuts': cuts, 'fx': fx}

js = ('// ガウルの技アニメ（2026-10-12 最終余白調整版の95枚）のデータ（tools/gauru1012/build.py が作る。手で書き換えない）\n'
      '// 技の番号 → { name, steps, hit（当たる区切り・1から）, dir, cuts:[本体のコマ { f, fx＝同じ切り出しの効果の層, m＝位置のモード, pw/ph, b＝本体の外接矩形, t }], fx:[別に置く層 { f, at＝tgt（相手の体）／self（自分の上）, t }] }\n'
      'window.MMGAMV_DATA = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
open(os.path.join(ROOT, 'js', 'battle', 'gauru-moves-data.js'), 'w', encoding='utf-8').write(js)
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
