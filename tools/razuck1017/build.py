# ラズックの技アニメ 81枚（2026-10-17 統合便 G／H／I：本体 51＋効果 30・各 1536×1536 RGBA）→ 表示用の WebP と js/battle/razuck-moves-data.js（手で書き換えない）
#   使い方：python3 -I -B tools/razuck1017/build.py <展開したフォルダ（Razuck_01_Kamitsuki_20261016 … Razuck_10_RazuckRush_20261017）>
#   ・原本の PNG は変えない・リポジトリに置かない（sha256 は assets/battle/razuck_moves_1017/sha256.txt）
#   ・本体（body/）と効果（fx/）は同じキャンバスの別の層。各技の README の「どのコマに重ねるか」に従って区切り（step）を作る：
#     1つの区切り＝本体1枚＋（あれば）同じ切り出しの効果1枚。1枚の本体に効果が2つ重なる所（02 の攻撃）は同じ本体で区切りを2つにする
#   ・相手へ届ける効果（光弾＝launch・命中の光＝tgt）は、その層だけ自分の範囲で切る（相手の体の位置へ置く）
#   ・透明な余白を切る（不透明度 4 以下を外す・周り 2%）→ 0.45倍 → WebP（品質 86・透明あり）
#   ・技の番号＝正式の性能表（Mismon_Razuck_FinalSkillData_20261017）の No. 1〜10。SK の番号＝60＋No−1（js/battle/rules.js）
import sys, os, json, hashlib, glob
import numpy as np
from PIL import Image

SRC = sys.argv[1]
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'battle', 'razuck_moves_1017')
SC = 0.45
# (No, 技名, フォルダ, 区切り [(本体の番号, 同じ切り出しの効果の番号 or None, 位置のモード)], 当たる区切り（1から・補助技は None）, 別に置く効果 [(効果の番号, at, 区切り（0から）)])
#  位置のモード：self＝その場・lunge＝踏み込み・move＝移動・contact＝相手に届く・back＝戻る（js/battle/art25d.js の layout）
MOVES = [
  (1, 'かみつき', 'Razuck_01_Kamitsuki_20261016', [(1, None, 'self'), (2, None, 'lunge'), (3, None, 'contact'), (4, None, 'back')], 3, []),
  # 02：「攻撃の2コマ目に2段階のFXを短時間で重ねる」＝本体 02 を2つの区切りに（初動の斬撃線 → 軌跡）
  (2, 'ひっかき', 'Razuck_02_Hikkaki_20261016', [(1, None, 'self'), (2, 1, 'lunge'), (2, 2, 'contact'), (3, None, 'contact'), (4, None, 'back')], 3, []),
  (3, 'すばやい一撃', 'Razuck_03_SubayaiIchigeki_20261016', [(1, None, 'self'), (2, 1, 'move'), (3, 2, 'contact'), (4, None, 'back')], 3, []),
  # 04：補助（自分の回避 中UP）。fx_02（残像）は本来「背面」＝重ね順はこの仕組みでは前面（QA で確認）
  (4, 'ちょこまか', 'Razuck_04_Chokomaka_20261017', [(1, 1, 'self'), (2, None, 'self'), (3, 2, 'self'), (4, 3, 'self')], None, []),
  (5, 'ガジガジラッシュ', 'Razuck_05_GajigajiRush_20261017_v2', [(1, None, 'lunge'), (2, 1, 'contact'), (3, None, 'contact'), (4, 2, 'contact'), (5, 3, 'contact'), (6, None, 'back')], 2, []),
  # 06：光弾（fx_03）は自分の胸から相手へ飛ばす・命中の光（fx_04）は相手の体へ
  (6, 'トリックショット', 'Razuck_06_TrickShot_20261017', [(1, 1, 'self'), (2, 2, 'self'), (3, None, 'self'), (4, None, 'self')], 4, [(3, 'launch', 2), (4, 'tgt', 3)]),
  (7, 'かく乱ステップ', 'Razuck_07_KakuranStep_20261017', [(1, 1, 'self'), (2, 2, 'self'), (3, 3, 'self'), (4, None, 'self')], None, []),
  # 08：影（fx_01・fx_02）は本来「背面」・噛みつきの衝撃（fx_03）は相手の被弾点へ
  (8, 'シャドーバイト', 'Razuck_08_ShadowBite_20261017', [(1, None, 'self'), (2, 1, 'move'), (3, 2, 'lunge'), (4, None, 'contact'), (5, None, 'back')], 4, [(3, 'tgt', 3)]),
  # 09：初動の風（fx_01）→ 軌道の光跡（fx_03）→ 残像（fx_02）→ 命中（fx_04 は相手の被弾点へ）
  (9, 'ミラージュダッシュ', 'Razuck_09_MirageDash_20261017', [(1, None, 'self'), (2, 1, 'move'), (3, 3, 'move'), (4, 2, 'contact'), (5, None, 'contact'), (6, None, 'back')], 4, [(4, 'tgt', 3)]),
  # 10：FX01＝01–02・FX02＝03・FX03＝04 と 05（05 の上下反転は使わない＝同じ向き）・FX04＝06–07・FX05＝08・FX06＝09。当たり＝09 の両腕フィニッシュ
  (10, 'ラズックラッシュ', 'Razuck_10_RazuckRush_20261017', [(1, 1, 'self'), (2, 1, 'self'), (3, 2, 'move'), (4, 3, 'contact'), (5, 3, 'contact'), (6, 4, 'contact'), (7, 4, 'contact'), (8, 5, 'contact'), (9, 6, 'contact'), (10, None, 'back')], 9, []),
]

def bbox(al, thr=4):
    ys, xs = np.nonzero(al > thr); return (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1) if len(xs) else None
def body_box(al):
    ys, xs = np.nonzero(al > 200)
    q = lambda v, p: int(np.percentile(v, p))
    return [q(xs, 0.4), q(ys, 0.4), q(xs, 99.6) + 1, q(ys, 99.6) + 1]
def save(im, of):
    out = im.resize((max(1, round(im.size[0] * SC)), max(1, round(im.size[1] * SC))), Image.LANCZOS)
    out.save(os.path.join(OUT, of), 'WEBP', quality=86, method=6); return out
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()

os.makedirs(OUT, exist_ok=True)
data, shas, used, outs = {}, [], set(), []
for no, name, folder, steps, hit, sep in MOVES:
    bf = sorted(glob.glob(os.path.join(SRC, folder, 'body', '*.png'))); ff = sorted(glob.glob(os.path.join(SRC, folder, 'fx', '*.png')))
    B = {i + 1: Image.open(p).convert('RGBA') for i, p in enumerate(bf)}; F = {i + 1: Image.open(p).convert('RGBA') for i, p in enumerate(ff)}
    for p in bf + ff: used.add(p); shas.append((os.path.relpath(p, SRC), sha(p)))
    assert sorted({s[0] for s in steps}) == list(B), (folder, 'body', len(B))
    sepIds = {s[0] for s in sep}
    assert sorted({s[1] for s in steps if s[1]} | sepIds) == list(F), (folder, 'fx', len(F))
    W, H = B[1].size; mg = int(W * 0.02)
    boxes = [bbox(np.asarray(B[i])[..., 3]) for i in B] + [bbox(np.asarray(F[i])[..., 3]) for i in F if i not in sepIds]
    boxes = [b for b in boxes if b]
    x0, y0 = max(0, min(b[0] for b in boxes) - mg), max(0, min(b[1] for b in boxes) - mg)
    x1, y1 = min(W, max(b[2] for b in boxes) + mg), min(H, max(b[3] for b in boxes) + mg)
    saved = {}
    def body_file(i):
        of = f'z{no:02d}_{i:02d}.webp'
        if of not in saved: saved[of] = save(B[i].crop((x0, y0, x1, y1)), of); outs.append(of)
        return of, saved[of]
    def fx_file(j):
        of = f'z{no:02d}_fx{j:02d}.webp'
        if of not in saved: saved[of] = save(F[j].crop((x0, y0, x1, y1)), of); outs.append(of)
        return of
    cuts = []
    for si, (bi, fj, mode) in enumerate(steps):
        of, out = body_file(bi)
        bb = [round(v * SC) for v in body_box(np.asarray(B[bi])[y0:y1, x0:x1, 3])]
        ent = {'f': of, 'src': f'Z{no}_{si + 1}', 'name': os.path.basename(bf[bi - 1]), 'pw': out.size[0], 'ph': out.size[1], 'x': 0, 'y': 0, 'w': out.size[0], 'h': out.size[1], 'b': bb, 'm': mode, 't': [si, si]}
        if fj: ent['fx'] = fx_file(fj); ent['fxName'] = os.path.basename(ff[fj - 1])
        cuts.append(ent)
    fx = []
    for fj, at, si in sep:
        eb = bbox(np.asarray(F[fj])[..., 3])
        of = f'z{no:02d}_fx{fj:02d}_t.webp'
        eo = save(F[fj].crop((max(0, eb[0] - mg), max(0, eb[1] - mg), min(W, eb[2] + mg), min(H, eb[3] + mg))), of); outs.append(of)
        e = {'f': of, 'src': f'Z{no}_fx{fj}', 'name': os.path.basename(ff[fj - 1]), 'at': at, 'pw': eo.size[0], 'ph': eo.size[1], 't': [si, si]}
        if at == 'launch': e['from'] = 'self'
        fx.append(e)
    data[no] = {'no': no, 'name': name, 'folder': folder, 'steps': len(steps), 'hit': hit, 'dir': './assets/battle/razuck_moves_1017/', 'cuts': cuts, 'fx': fx,
                'bodies': len(B), 'effects': len(F)}
allp = set(glob.glob(os.path.join(SRC, '*', 'body', '*.png')) + glob.glob(os.path.join(SRC, '*', 'fx', '*.png')))
assert used == allp and len(used) == 81 and sum(d['bodies'] for d in data.values()) == 51 and sum(d['effects'] for d in data.values()) == 30, (len(used))
js = ('// ラズックの技アニメ（2026-10-17 統合便・本体 51＋効果 30＝81枚）のデータ（tools/razuck1017/build.py が作る。手で書き換えない）\n'
      '// 正式の技の番号（1〜10＝正式10技性能表の No.）→ SK の番号は 60＋No−1（js/battle/rules.js）。ラズックは未解禁＝QA 試遊（?mmQaTrial=1）の個体だけが使う\n'
      '//   { no, name, folder, steps, hit, dir, cuts:[区切り { f＝本体, fx＝同じ切り出しの効果, m, b, t }], fx:[別に置く層 { f, at＝launch／tgt, t }], bodies, effects }\n'
      'window.MMRZMV_DATA = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
open(os.path.join(ROOT, 'js', 'battle', 'razuck-moves-data.js'), 'w', encoding='utf-8').write(js)
with open(os.path.join(OUT, 'sha256.txt'), 'w', encoding='utf-8') as fo:
    fo.write('# 原本（2026-10-17 統合便 G／H／I の PNG・リポジトリには置かない）\n')
    for p, h in sorted(shas): fo.write(f'{h}  {p}\n')
    fo.write('# 派生（この フォルダの WebP）\n')
    for of in sorted(set(outs)): fo.write(f'{sha(os.path.join(OUT, of))}  {of}\n')
print('ok', len(used), 'files', len(set(outs)))
