# カルシェルの技アニメ（2026-10-18 正式納品 05_skill_animations：本体 49＋効果 49・各 1536×1536 RGBA・右向き）→ 表示用の WebP と js/battle/kalshell-moves-data.js（手で書き換えない）
#   使い方：python3 -I -B tools/kalshell1018/build_moves.py <05_skill_animations のフォルダ（01_Hasamu … 10_TidalCrash）>
#   ・原本の PNG は変えない・リポジトリに置かない（sha256 は assets/battle/kalshell_moves_1018/sha256.txt）。preview／qa（MP4・contact）は取り込まない
#   ・作り方は tools/razuck1017/build.py と同じ：本体（body/）と効果（fx/）は同じキャンバスの別の層。manifest の effect・preview_dx_px を参考に区切り（step）を作る：
#     1つの区切り＝本体1枚＋（あれば）同じ切り出しの効果1枚（体のまわりに出る効果＝あわだまの泡・からにこもるの盾・しおのステップの水しぶき・技の溜め）。
#     相手へ届ける効果（当たりの衝撃＝tgt・飛ばす水や槍＝launch）は、その層だけ自分の範囲で切る（相手の体の位置へ置く＝js/battle/art25d.js の layout）
#   ・透明な余白を切る（不透明度 4 以下を外す・周り 2%）→ 0.45倍 → WebP（品質 86・透明あり）。空の効果（fx が全部透明）は使わない
#   ・技の番号＝正式素材仕様マスターの No. 1〜10。SK の番号＝70＋No−1（js/battle/rules.js の installKalshell）
import sys, os, json, hashlib, glob
import numpy as np
from PIL import Image

SRC = sys.argv[1]
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'battle', 'kalshell_moves_1018')
SC = 0.45
# (No, 技名, フォルダ, 区切り [(本体の番号, 同じ切り出しの効果の番号 or None, 位置のモード)], 当たる区切り（1から・補助技は None）, 別に置く効果 [(効果の番号, at, 区切り（0から）)])
#  位置のモード：self＝その場・lunge＝踏み込み・move＝移動・contact＝相手に届く・back＝戻る。manifest の effect：hit＝当たり・bubble／shield／trail／coral／jet／rock／wave
MOVES = [
  (1, 'はさむ', '01_Hasamu', [(1, None, 'self'), (2, None, 'lunge'), (3, None, 'contact'), (4, None, 'back')], 3, [(3, 'tgt', 2)]),
  (2, 'シェルタックル', '02_ShellTackle', [(1, None, 'self'), (2, None, 'lunge'), (3, None, 'contact'), (4, None, 'back')], 3, [(3, 'tgt', 2), (4, 'tgt', 3)]),
  # 03：泡は口元で育ち（fx 1・2＝同じ切り出し）→ 相手へ飛ぶ（fx 3＝launch）→ 相手の体ではじける（fx 4＝tgt）。当たり＝4つ目の区切り
  (3, 'あわだま', '03_Awadama', [(1, 1, 'self'), (2, 2, 'self'), (3, None, 'self'), (4, None, 'self')], 4, [(3, 'launch', 2), (4, 'tgt', 3)]),
  (4, 'からにこもる', '04_KaraNiKomoru', [(1, None, 'self'), (2, 2, 'self'), (3, 3, 'self'), (4, 4, 'self')], None, []),
  (5, 'クラッシュクロー', '05_CrashClaw', [(1, None, 'self'), (2, None, 'self'), (3, None, 'lunge'), (4, None, 'contact'), (5, None, 'back')], 4, [(4, 'tgt', 3), (5, 'tgt', 4)]),
  # 06：水を集める（fx 1〜3＝同じ切り出し）→ 水流を放つ（fx 4＝launch）→ 相手の体で砕ける（fx 5＝tgt）。当たり＝5つ目
  (6, 'アクアバースト', '06_AquaBurst', [(1, 1, 'self'), (2, 2, 'self'), (3, 3, 'self'), (4, None, 'self'), (5, None, 'self')], 5, [(4, 'launch', 3), (5, 'tgt', 4)]),
  # 07：珊瑚の槍を作る（fx 2・3）→ 突き出す（fx 4＝launch）→ 相手に刺さる（fx 5＝tgt）。当たり＝5つ目
  (7, 'コーラルスピア', '07_CoralSpear', [(1, None, 'self'), (2, 2, 'self'), (3, 3, 'self'), (4, None, 'lunge'), (5, None, 'self')], 5, [(4, 'launch', 3), (5, 'tgt', 4)]),
  (8, 'しおのステップ', '08_ShioNoStep', [(1, None, 'self'), (2, 2, 'self'), (3, 3, 'self'), (4, 4, 'self')], None, []),
  # 09：踏み込みの水しぶき（fx 3＝同じ切り出し）→ 叩きつけの岩（fx 4・5＝相手の体）→ 当たりの光（fx 6）。当たり＝4つ目
  (9, 'シェルブレイカー', '09_ShellBreaker', [(1, None, 'self'), (2, None, 'self'), (3, 3, 'move'), (4, None, 'contact'), (5, None, 'contact'), (6, None, 'back')], 4, [(4, 'tgt', 3), (5, 'tgt', 4), (6, 'tgt', 5)]),
  # 10：水しぶき（fx 2）→ 波を起こす（fx 3・4＝同じ切り出し）→ 大波が相手へ（fx 5＝launch）→ 相手をのみこむ（fx 6・7＝tgt）→ 当たりの光（fx 8）。当たり＝6つ目
  (10, 'タイダルクラッシュ', '10_TidalCrash', [(1, None, 'self'), (2, 2, 'self'), (3, 3, 'self'), (4, 4, 'move'), (5, None, 'contact'), (6, None, 'contact'), (7, None, 'contact'), (8, None, 'back')], 6,
   [(5, 'launch', 4), (6, 'tgt', 5), (7, 'tgt', 6), (8, 'tgt', 7)]),
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
    nonEmpty = sorted(j for j in F if bbox(np.asarray(F[j])[..., 3]))
    assert sorted({s[1] for s in steps if s[1]} | sepIds) == nonEmpty, (folder, 'fx', nonEmpty)   # 空でない効果は全部使う・空の効果は使わない
    W, H = B[1].size; mg = int(W * 0.02)
    boxes = [bbox(np.asarray(B[i])[..., 3]) for i in B] + [bbox(np.asarray(F[i])[..., 3]) for i in F if i not in sepIds]
    boxes = [b for b in boxes if b]
    x0, y0 = max(0, min(b[0] for b in boxes) - mg), max(0, min(b[1] for b in boxes) - mg)
    x1, y1 = min(W, max(b[2] for b in boxes) + mg), min(H, max(b[3] for b in boxes) + mg)
    saved = {}
    def body_file(i):
        of = f'k{no:02d}_{i:02d}.webp'
        if of not in saved: saved[of] = save(B[i].crop((x0, y0, x1, y1)), of); outs.append(of)
        return of, saved[of]
    def fx_file(j):
        of = f'k{no:02d}_fx{j:02d}.webp'
        if of not in saved: saved[of] = save(F[j].crop((x0, y0, x1, y1)), of); outs.append(of)
        return of
    cuts = []
    for si, (bi, fj, mode) in enumerate(steps):
        of, out = body_file(bi)
        bb = [round(v * SC) for v in body_box(np.asarray(B[bi])[y0:y1, x0:x1, 3])]
        ent = {'f': of, 'src': f'K{no}_{si + 1}', 'name': os.path.basename(bf[bi - 1]), 'pw': out.size[0], 'ph': out.size[1], 'x': 0, 'y': 0, 'w': out.size[0], 'h': out.size[1], 'b': bb, 'm': mode, 't': [si, si]}
        if fj: ent['fx'] = fx_file(fj); ent['fxName'] = os.path.basename(ff[fj - 1])
        cuts.append(ent)
    fx = []
    for fj, at, si in sep:
        eb = bbox(np.asarray(F[fj])[..., 3])
        of = f'k{no:02d}_fx{fj:02d}_t.webp'
        eo = save(F[fj].crop((max(0, eb[0] - mg), max(0, eb[1] - mg), min(W, eb[2] + mg), min(H, eb[3] + mg))), of); outs.append(of)
        e = {'f': of, 'src': f'K{no}_fx{fj}', 'name': os.path.basename(ff[fj - 1]), 'at': at, 'pw': eo.size[0], 'ph': eo.size[1], 't': [si, si]}
        if at == 'launch': e['from'] = 'self'
        fx.append(e)
    data[no] = {'no': no, 'name': name, 'folder': folder, 'steps': len(steps), 'hit': hit, 'dir': './assets/battle/kalshell_moves_1018/', 'cuts': cuts, 'fx': fx,
                'bodies': len(B), 'effects': len(nonEmpty), 'effectFiles': len(F)}
allp = set(glob.glob(os.path.join(SRC, '*', 'body', '*.png')) + glob.glob(os.path.join(SRC, '*', 'fx', '*.png')))
assert used == allp and len(used) == 98 and sum(d['bodies'] for d in data.values()) == 49 and sum(d['effectFiles'] for d in data.values()) == 49, (len(used))
assert sum(d['effects'] for d in data.values()) == 35, [d['effects'] for d in data.values()]   # 空でない効果＝35（01_QA_REPORT.txt の「非空」の合計）
js = ('// カルシェルの技アニメ（2026-10-18 正式納品・本体 49＋効果 49（空でない効果 35）＝98枚）のデータ（tools/kalshell1018/build_moves.py が作る。手で書き換えない）\n'
      '// 正式の技の番号（1〜10＝正式素材仕様マスターの No.）→ SK の番号は 70＋No−1（js/battle/rules.js）。カルシェルは未解禁（入手方法は未決）＝QA 試遊（?mmQaTrial=1）の個体だけが使う\n'
      '//   { no, name, folder, steps, hit, dir, cuts:[区切り { f＝本体, fx＝同じ切り出しの効果, m, b, t }], fx:[別に置く層 { f, at＝launch／tgt, t }], bodies, effects }\n'
      'window.MMKSMV_DATA = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
open(os.path.join(ROOT, 'js', 'battle', 'kalshell-moves-data.js'), 'w', encoding='utf-8').write(js)
with open(os.path.join(OUT, 'sha256.txt'), 'w', encoding='utf-8') as fo:
    fo.write('# 原本（2026-10-18 カルシェル正式納品 05_skill_animations の PNG・リポジトリには置かない）\n')
    for p, h in sorted(shas): fo.write(f'{h}  {p}\n')
    fo.write('# 派生（このフォルダの WebP）\n')
    for of in sorted(set(outs)): fo.write(f'{sha(os.path.join(OUT, of))}  {of}\n')
print('ok', len(used), 'files', len(set(outs)), json.dumps({k: (v['steps'], v['hit'], len(v['fx'])) for k, v in data.items()}))
