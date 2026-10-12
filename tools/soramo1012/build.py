# ソラモの技アニメ 46コマ（2026-10-12 修正納品）→ 表示用の WebP と js/battle/soramo-moves-data.js（手で書き換えない）
#   使い方：python3 -I tools/soramo1012/build.py <46枚の PNG のフォルダ> [確認用の一覧 JPEG]
#   ・原本の PNG は変えない・リポジトリに置かない（sha256 は assets/battle/soramo_moves_1012/README.md）。緑の除去はやり直さない（納品は RGBA 透過）
#   ・透明な余白を切る（不透明度 4 以下を外す・周り 2% の余白）→ 1536px の絵は 0.4 倍・1024px の絵は 0.6 倍（技の中で同じ倍率＝コマの大きさがそろう）→ WebP（品質 86・透明あり）
#   ・b＝本体の外接矩形（光・砂・星などを除いた毛の色の画素の範囲。大きさと足元の合わせに使う）
import sys, os, json, hashlib
import numpy as np
from PIL import Image, ImageDraw

SRC = sys.argv[1]
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'battle', 'soramo_moves_1012')
# 技の番号（SK＝js/phase10/monsters.js の OFFICIAL_MOVES.solamo.list[].slot）→ 納品のファイル名の技・コマ・位置のモード・当たるコマ・重ねる効果の層
MOVES = [
  (0, 'TAIATARI', 'たいあたり', ['F001', 'F002', 'F003', 'F004'], ['self', 'move', 'contact', 'back'], 3, {}),
  (1, 'HIKKAKI', 'ひっかき', ['F01', 'F02', 'F03', 'F04'], ['self', 'lunge', 'contact', 'back'], 3, {}),
  (2, 'SHIPPO_ATTACK', 'しっぽアタック', ['F01', 'F02', 'F03', 'F04'], ['self', 'lunge', 'lunge', 'self'], 3, {}),
  (3, 'HOERU', 'ほえる', ['F01', 'F02', 'F03', 'F04'], ['self'] * 4, 3, {}),
  (4, 'STAR_CRUSH', 'スタークラッシュ', ['F001_jump', 'F002_gather', 'F003_dive', 'F004_slam', 'F005_burst', 'F006_land'], ['self', 'self', 'move', 'contact', 'contact', 'back'], 4, {}),
  # ソラモビーム：F003 はビームだけの層＝F002（発射の姿）と同じ時間に、口から相手へ伸ばして重ねる
  (5, 'SORAMO_BEAM', 'ソラモビーム', ['F001_TAME', 'F002_HASTUHA_no_beam', 'F003_BEAM_LAYER_ONLY_overlay', 'F004_END'], ['self', 'self', 'fx:beam', 'self'], 2, {'with': {2: 1}}),
  (6, 'SUNAKAKE', 'すなかけ', ['F01', 'F02', 'F03', 'F04'], ['self'] * 4, 3, {}),
  (7, 'HOSHI_NO_MAMORI', 'ほしのまもり', ['F01', 'F02', 'F03', 'F04'], ['self'] * 4, None, {}),
  (8, 'STARDUST_RAY', 'スターダストレイ', ['F001_start', 'F002_swirl', 'F003_bolts', 'F004_hit', 'F005_burst', 'F006_reset'], ['self'] * 6, 4, {}),
  # スターフォール：F01〜F03 は空を見上げるソラモ、F04〜F06 は星群だけの層＝F03 の姿を残したまま、相手の上へ順に重ねる
  (9, 'STARFALL', 'スターフォール', ['F01_calling', 'F02_gathering', 'F03_casting_up', 'F04_star_gate', 'F05_star_barrage', 'F06_impact_burst'], ['self', 'self', 'self', 'fx:sky', 'fx:barrage', 'fx:impact'], 6, {'hold': 2}),
]

def body_box(a):
    """本体の範囲：不透明で、毛の色（橙〜茶・クリーム）の画素。黄色い光（青が少ない明るい黄）・白い光・青い光は外す。外れ値を除いた範囲（0.4〜99.6%）"""
    r, g, b, al = [a[..., i].astype(float) for i in range(4)]
    R = np.maximum(r, 1)
    fur = (al > 200) & (r >= g) & (g >= b * 0.9) & (r - b > 28) & ~((g / R > 0.86) & (b / R < 0.62)) & ~((r > 245) & (g > 238) & (b > 225))
    ys, xs = np.nonzero(fur)
    if len(xs) < 50: return None
    q = lambda v, p: int(np.percentile(v, p))
    return [q(xs, 0.4), q(ys, 0.4), q(xs, 99.6) + 1, q(ys, 99.6) + 1]

os.makedirs(OUT, exist_ok=True)
data, sheet, shas = {}, [], []
for k, key, name, frames, modes, hit, opt in MOVES:
    cuts, fx = [], []
    for i, (fr, m) in enumerate(zip(frames, modes)):
        fn = f'SORAMO_{key}_{fr}.png'
        p = os.path.join(SRC, fn)
        shas.append((fn, hashlib.sha256(open(p, 'rb').read()).hexdigest()))
        im = Image.open(p).convert('RGBA')
        sc = 0.4 if im.size[0] >= 1400 else 0.6
        A = np.asarray(im)
        al = A[..., 3]
        ys, xs = np.nonzero(al > 4)
        mg = int(im.size[0] * 0.02)
        x0, y0, x1, y1 = max(0, xs.min() - mg), max(0, ys.min() - mg), min(im.size[0], xs.max() + 1 + mg), min(im.size[1], ys.max() + 1 + mg)
        crop = im.crop((x0, y0, x1, y1))
        out = crop.resize((max(1, round(crop.size[0] * sc)), max(1, round(crop.size[1] * sc))), Image.LANCZOS)
        of = f'{k:02d}_{i + 1:02d}.webp'
        out.save(os.path.join(OUT, of), 'WEBP', quality=86, method=6)
        pw, ph = out.size
        ent = {'f': of, 'src': f'{key}_{i + 1}', 'name': fn, 'pw': pw, 'ph': ph, 'x': 0, 'y': 0, 'w': pw, 'h': ph}
        if m.startswith('fx:'):
            ent['at'] = m[3:]
            fx.append(ent)
            sheet.append((out, None, of))
        else:
            bb = body_box(A[y0:y1, x0:x1])
            ent['b'] = [round(v * sc) for v in bb]
            ent['m'] = m
            cuts.append(ent)
            sheet.append((out, ent['b'], of))
    # 時間の区切り（steps＝コマの数。重ねる層は同じ区切りに出す）
    steps, step_of = 0, {}
    for i, m in enumerate(modes):
        if m.startswith('fx:') and i in opt.get('with', {}): step_of[i] = step_of[opt['with'][i]]
        else: step_of[i] = steps; steps += 1
    ci = fi = 0
    for i, m in enumerate(modes):
        if m.startswith('fx:'): fx[fi]['t'] = [step_of[i], step_of[i]]; fi += 1
        else: cuts[ci]['t'] = [step_of[i], step_of[i]]; ci += 1
    if 'hold' in opt:   # 本体のコマ hold を最後の区切りまで残す（スターフォール＝見上げたまま）
        cuts[opt['hold']]['t'] = [cuts[opt['hold']]['t'][0], steps - 1]
    data[k] = {'name': name, 'steps': steps, 'hit': hit, 'cuts': cuts, 'fx': fx}

js = ('// ソラモの技アニメ（2026-10-12 修正納品の46コマ）のデータ（tools/soramo1012/build.py が作る。手で書き換えない）\n'
      '// 技の番号 → { name, steps（時間の区切りの数）, hit（当たる区切り・1から）, cuts:[本体のコマ { f, src, name＝納品のファイル, m＝位置のモード, pw/ph, x/y/w/h, b＝本体の外接矩形, t＝出す区切り [始め, 終わり] }], fx:[効果だけの層 { f, at＝beam／sky／barrage／impact, t }] }\n'
      'window.MMSOMV_DATA = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
open(os.path.join(ROOT, 'js', 'battle', 'soramo-moves-data.js'), 'w', encoding='utf-8').write(js)
open(os.path.join(OUT, 'sha256.txt'), 'w').write(''.join(f'{h}  {f}\n' for f, h in shas))
if len(sys.argv) > 2:   # 確認用：本体の範囲を赤い枠で
    T = 200; cols = 8; rows = (len(sheet) + cols - 1) // cols
    S = Image.new('RGB', (T * cols, T * rows), (30, 34, 50)); dr = ImageDraw.Draw(S)
    for n, (im, bb, of) in enumerate(sheet):
        f = min((T - 16) / im.size[0], (T - 16) / im.size[1]); t = im.resize((int(im.size[0] * f), int(im.size[1] * f)))
        x, y = (n % cols) * T + 4, (n // cols) * T + 12; S.paste(t, (x, y), t); dr.text((x, y - 11), of, fill=(255, 255, 200))
        if bb: dr.rectangle([x + bb[0] * f, y + bb[1] * f, x + bb[2] * f, y + bb[3] * f], outline=(255, 60, 60))
    S.save(sys.argv[2], quality=82)
print('ok', sum(len(v['cuts']) + len(v['fx']) for v in data.values()), 'コマ')
