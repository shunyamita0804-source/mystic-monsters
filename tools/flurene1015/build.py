# フルーネの技アニメ 77枚（2026-10-15・ZIP Mismon_Flurene_SkillAnim_Part1of5〜5of5＝本体 42＋効果 35）→ 表示用の WebP と js/battle/flurene-moves-data.js（手で書き換えない）
#   使い方：python3 -I tools/flurene1015/build.py <5便を展開したフォルダ（01_つるうち … 10_ルートテンペスト を含む）> <01_Manifest_77frames.csv> [確認用の一覧 JPEG]
#   ・原本の PNG（1536×1536・RGBA）は変えない・リポジトリに置かない（manifest の sha256 と照合・assets/battle/flurene_moves_1015/sha256.txt）
#   ・「B」（本体）と「FX」（効果）は同じキャンバスの別の層（ジオルと同じ作り）。
#     本体の上に重ねる効果＝技ごとに全コマ共通の範囲で切る（原本の位置合わせ・足もとのまま）
#     相手に当てる効果（tgt＝相手の体へ・fly＝自分から相手へ飛ぶ・ray＝自分から相手へ伸びる光線）→ その層だけ自分の範囲で切る
#   ・FX は B と同じ番号のコマに重ねる。ただし 09 生命のしずくは FX が2枚だけ（FX01 光のつゆ＝B02 集め・FX02 降り注ぎ光＝B03 降り注ぎ）、10 ルートテンペストは FX なし
#     （無い FX は作らない・登録しない）
#   ・透明な余白を切る（不透明度 4 以下を外す・周り 2%）→ 0.4倍 → WebP（品質 86・透明あり）。引き伸ばしはしない
#   ・技の番号＝登録の技表（js/phase10/monsters.js の PENDING_SPECIES のフルーネ）の No. 1〜10。**SK の番号は無い**（性能は未承認＝バトルでは使わない・QA 試遊のプレビュー MM25D.preview('flurene', No) だけ）
import sys, os, re, json, hashlib, glob, csv
import numpy as np
from PIL import Image, ImageDraw

SRC, MAN = sys.argv[1], sys.argv[2]
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'battle', 'flurene_moves_1015')
SC = 0.4
# (No, 技名, フォルダ, 本体の位置のモード（コマごと）, 当たる区切り（1から・相手に当てない技は None）, 別に置く効果 {B の番号: at}, FX の番号 → B の番号)
MOVES = [
  (1, 'つるうち', '01_つるうち', ['self', 'self', 'lunge', 'back'], 3, {}, None),
  (2, 'たねとばし', '02_たねとばし', ['self', 'self', 'self', 'self'], 3, {3: 'fly', 4: 'tgt'}, None),
  (3, 'はなのかおり', '03_はなのかおり', ['self', 'self', 'self', 'self'], None, {}, None),
  (4, 'ねっこのまもり', '04_ねっこのまもり', ['self', 'self', 'self', 'self'], None, {}, None),
  (5, 'こんさいプレス', '05_こんさいプレス', ['self', 'self', 'self', 'lunge', 'back'], 4, {}, None),
  (6, 'ブルームレイ', '06_ブルームレイ', ['self', 'self', 'self', 'self'], 3, {3: 'ray'}, None),
  (7, 'しばりづる', '07_しばりづる', ['self', 'self', 'self', 'self'], 3, {3: 'tgt', 4: 'tgt'}, None),
  (8, 'はなかげのまい', '08_はなかげのまい', ['self', 'self', 'self', 'self'], None, {}, None),
  (9, '生命のしずく', '09_生命のしずく', ['self', 'self', 'self', 'self'], None, {}, {1: 2, 2: 3}),
  (10, 'ルートテンペスト', '10_ルートテンペスト', ['self', 'self', 'self', 'self', 'self'], 5, {}, {}),
]
want = {r['filename']: r['sha256'] for r in csv.DictReader(open(MAN, encoding='utf-8-sig'))}
assert len(want) == 77
def bbox(al, thr=4):
    ys, xs = np.nonzero(al > thr); return (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1) if len(xs) else None
def body_box(al):
    ys, xs = np.nonzero(al > 200); q = lambda v, p: int(np.percentile(v, p))
    return [q(xs, 0.4), q(ys, 0.4), q(xs, 99.6) + 1, q(ys, 99.6) + 1]
def save(im, of):
    out = im.resize((max(1, round(im.size[0] * SC)), max(1, round(im.size[1] * SC))), Image.LANCZOS)
    out.save(os.path.join(OUT, of), 'WEBP', quality=86, method=6); return out
LAYER = re.compile(r'_(B|FX)(\d\d)')
os.makedirs(OUT, exist_ok=True)
data, sheet, shas, used = {}, [], [], set()
for no, name, folder, modes, hit, sep, fxmap in MOVES:
    B, F = {}, {}
    for f in glob.glob(os.path.join(SRC, folder, '*.png')):
        m = LAYER.search(os.path.basename(f)); assert m, f
        (B if m.group(1) == 'B' else F)[int(m.group(2))] = f
    n = len(modes); assert sorted(B) == list(range(1, n + 1)), (folder, sorted(B))
    fm = fxmap if fxmap is not None else {i: i for i in F}
    assert sorted(F) == sorted(fm), (folder, sorted(F), fm)
    at_b = {fm[i]: i for i in fm}   # B の番号 → FX の番号
    C = {i: Image.open(B[i]).convert('RGBA') for i in B}; E = {i: Image.open(F[i]).convert('RGBA') for i in F}
    for p in list(B.values()) + list(F.values()):
        rel = os.path.relpath(p, SRC); h = hashlib.sha256(open(p, 'rb').read()).hexdigest()
        assert want.get(rel) == h, ('manifest', rel); used.add(rel); shas.append((rel, h))
    W, H = C[1].size; mg = int(W * 0.02)
    boxes = [bbox(np.asarray(C[i])[..., 3]) for i in C] + [bbox(np.asarray(E[j])[..., 3]) for j in E if fm[j] not in sep]
    boxes = [b for b in boxes if b]
    x0, y0 = max(0, min(b[0] for b in boxes) - mg), max(0, min(b[1] for b in boxes) - mg)
    x1, y1 = min(W, max(b[2] for b in boxes) + mg), min(H, max(b[3] for b in boxes) + mg)
    cuts, fx = [], []
    for i in range(1, n + 1):
        of = f'f{no:02d}_b{i:02d}.webp'; out = save(C[i].crop((x0, y0, x1, y1)), of)
        bb = [round(v * SC) for v in body_box(np.asarray(C[i])[y0:y1, x0:x1, 3])]
        ent = {'f': of, 'src': f'F{no}_{i}', 'name': os.path.basename(B[i]), 'pw': out.size[0], 'ph': out.size[1], 'x': 0, 'y': 0, 'w': out.size[0], 'h': out.size[1], 'b': bb, 'm': modes[i - 1], 't': [i - 1, i - 1]}
        sheet.append((out, bb, of))
        if i in at_b:
            j = at_b[i]; ofx = f'f{no:02d}_fx{j:02d}.webp'
            if i in sep:   # 相手に当てる層（自分の範囲で切る）
                eb = bbox(np.asarray(E[j])[..., 3])
                eo = save(E[j].crop((max(0, eb[0] - mg), max(0, eb[1] - mg), min(W, eb[2] + mg), min(H, eb[3] + mg))), ofx)
                fx.append({'f': ofx, 'src': f'F{no}_{i}_fx', 'name': os.path.basename(F[j]), 'at': sep[i], 'pw': eo.size[0], 'ph': eo.size[1], 't': [i - 1, i - 1]})
            else:          # 本体の上に同じ切り出しで重ねる
                eo = save(E[j].crop((x0, y0, x1, y1)), ofx); ent['fx'] = ofx; ent['fxName'] = os.path.basename(F[j])
            sheet.append((eo, None, ofx))
        cuts.append(ent)
    data[no] = {'no': no, 'name': name, 'folder': folder, 'steps': n, 'hit': hit, 'bodies': len(B), 'effects': len(F), 'dir': './assets/battle/flurene_moves_1015/', 'cuts': cuts, 'fx': fx}
assert used == set(want) and len(used) == 77, sorted(set(want) - used)
js = ('// フルーネの技アニメ（2026-10-15・本体 42＋効果 35＝77枚）のデータ（tools/flurene1015/build.py が作る。手で書き換えない）\n'
      '// 登録の技の No.（1〜10。SK の番号は無い＝性能は未承認・バトルでは使わない・QA 試遊のプレビュー MM25D.preview(\'flurene\', No) だけ）→\n'
      '//   { no, name, folder, steps, hit, bodies, effects, dir, cuts:[本体 { f, fx＝同じ切り出しの効果の層, m, b, t }], fx:[相手に当てる層 { f, at＝tgt／fly／ray, t }] }\n'
      '//   09 生命のしずくの効果は2枚だけ・10 ルートテンペストの効果は0枚（届いていない＝作っていない）\n'
      'window.MMFLMV_DATA = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
open(os.path.join(ROOT, 'js', 'battle', 'flurene-moves-data.js'), 'w', encoding='utf-8').write(js)
open(os.path.join(OUT, 'sha256.txt'), 'w').write(''.join(f'{h}  {f}\n' for f, h in sorted(shas)))
if len(sys.argv) > 3:
    T = 170; cols = 8; rows = (len(sheet) + cols - 1) // cols
    S = Image.new('RGB', (T * cols, T * rows), (30, 34, 50)); dr = ImageDraw.Draw(S)
    for n2, (im, bb, of) in enumerate(sheet):
        f = min((T - 16) / im.size[0], (T - 16) / im.size[1]); t = im.resize((max(1, int(im.size[0] * f)), max(1, int(im.size[1] * f))))
        x, y = (n2 % cols) * T + 4, (n2 // cols) * T + 12; S.paste(t, (x, y), t); dr.text((x, y - 11), of, fill=(255, 255, 200))
        if bb: dr.rectangle([x + bb[0] * f, y + bb[1] * f, x + bb[2] * f, y + bb[3] * f], outline=(255, 60, 60))
    S.save(sys.argv[3], quality=82)
print('ok', len(shas), '枚')
