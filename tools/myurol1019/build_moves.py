# ミュロルの技アニメ（2026-10-19 正式納品 PART04〜07 の 05_skill_animations：10技×（本体・技エフェクト・命中エフェクト）＝150枚・各 1536×1536 RGBA・右向き）
#   → 表示用の WebP（assets/battle/myurol_moves_1019/）と js/battle/myurol-moves-data.js（手で書き換えない）
#   使い方：python3 -I -B tools/myurol1019/build_moves.py <05_skill_animations のフォルダ> [<さらに 05_skill_animations のフォルダ> …]（分割 ZIP の各フォルダ）
#   ・コマの絵の場所は必ず各技の manifest.json から読む（ファイル名は 2026-10-19 に変わった＝旧い 01.png を前提にしない）。原本の PNG は変えない・リポジトリに置かない（sha256 は sha256.txt）
#   ・01〜09（manifest：layer_rule＝body and fx share 1536 canvas; hit_fx placed at target world position）：
#       区切り（step）＝manifest の1コマ。本体（body）と技エフェクト（fx）は同じキャンバス＝同じ切り出し（cuts[].fx・本体の上に同じ動きで重ねる）。
#       命中エフェクト（hit_fx）は相手の体の位置へ（fx[].at＝'tgt'・その層だけ自分の範囲で切る）。空の層（完全な透明）は作らない。
#       区切りの長さ＝manifest の duration_ms の比（ms）。本体の横の位置＝manifest の body_preview_stage_dx_pixels（プレビューの舞台 1280×720 で
#       自分の足もと x＝66＋750×315／1536≒220 から相手 1040 までの 820px に対する割合 r＝dx／820 → js/battle/art25d.js の layout の c.r）。dx 0＝その場（self）
#   ・10 マリンストリーム（TSUNAMI_V2・stage_reference_size 1280×720）：本体は 01〜09 と同じ（その場）。津波の fx と命中の hit_fx は本体の動きに付けない＝
#       manifest の fx_stage_rect／hit_fx_stage_rect（舞台の座標・各 PNG のキャンバス全体がその矩形に入る）をそのまま舞台の座標で持つ（fx[].at＝'stage'・sr＝切り出した絵の舞台の矩形）。
#       描く順＝fx（本体の後ろ）→ 本体 → hit_fx。相手側の攻撃は舞台全体を左右反転（js/battle/art25d.js の stageMap）
#   ・透明な余白を切る（不透明度 4 以下を外す・周り 2%）→ 0.45倍 → WebP（品質 86・透明あり）＝カルシェル（tools/kalshell1018/build_moves.py）と同じ
#   ・技の番号＝正式素材仕様マスターの No. 1〜10。SK の番号＝80＋No−1（js/battle/rules.js の installMyurol）
import sys, os, json, hashlib, glob
import numpy as np
from PIL import Image

SRCS = sys.argv[1:]
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT = os.path.join(ROOT, 'assets', 'battle', 'myurol_moves_1019')
DIRREL = './assets/battle/myurol_moves_1019/'
SC = 0.45
REACH = 820.0   # プレビューの舞台：自分の足もと x 220 → 相手 1040

def bbox(al, thr=4):
    ys, xs = np.nonzero(al > thr); return (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1) if len(xs) else None
def body_box(al):
    ys, xs = np.nonzero(al > 200)
    q = lambda v, p: int(np.percentile(v, p))
    return [q(xs, 0.4), q(ys, 0.4), q(xs, 99.6) + 1, q(ys, 99.6) + 1]
def save(im, of):
    out = im.resize((max(1, round(im.size[0] * SC)), max(1, round(im.size[1] * SC))), Image.LANCZOS)
    out.save(os.path.join(OUT, of), 'WEBP', quality=86, method=6); return out
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()

mans = {}
for S in SRCS:
    for m in glob.glob(os.path.join(S, '*', 'manifest.json')):
        folder = os.path.basename(os.path.dirname(m)); no = int(folder.split('_')[0]); assert no not in mans, folder; mans[no] = (m, folder)
assert sorted(mans) == list(range(1, 11)), sorted(mans)
os.makedirs(OUT, exist_ok=True)
for f in glob.glob(os.path.join(OUT, '*.webp')): os.remove(f)
data, shas, outs, used = {}, [], [], 0
for no in range(1, 11):
    mp, folder = mans[no]; base = os.path.dirname(mp); j = json.load(open(mp, encoding='utf-8'))
    fr = j['frames']; assert len(fr) == j['frame_count'], folder
    name = j['skill']; stage = 'fx_stage_rect' in fr[0]
    L = {}
    for i, f in enumerate(fr):
        for layer in ('body', 'fx', 'hit_fx'):
            p = os.path.join(base, f[layer]); assert os.path.exists(p), p
            im = Image.open(p); assert im.size == (1536, 1536) and im.mode == 'RGBA', (p, im.size, im.mode)
            L[(i, layer)] = (p, im.convert('RGBA')); shas.append((os.path.relpath(p, os.path.dirname(os.path.dirname(base))), sha(p))); used += 1
    n = len(fr)
    al = {k: np.asarray(v[1])[..., 3] for k, v in L.items()}
    nonEmpty = {k: bbox(a) for k, a in al.items()}
    hitSteps = [i for i in range(n) if nonEmpty[(i, 'hit_fx')]]
    hit = hitSteps[0] + 1 if hitSteps else None
    W = H = 1536; mg = int(W * 0.02)
    # 本体と同じ切り出しの範囲（本体＋（01〜09 は）技エフェクト）
    boxes = [nonEmpty[(i, 'body')] for i in range(n)] + ([] if stage else [nonEmpty[(i, 'fx')] for i in range(n) if nonEmpty[(i, 'fx')]])
    x0, y0 = max(0, min(b[0] for b in boxes) - mg), max(0, min(b[1] for b in boxes) - mg)
    x1, y1 = min(W, max(b[2] for b in boxes) + mg), min(H, max(b[3] for b in boxes) + mg)
    saved, bodyOf = {}, {}
    def body_file(i):
        h = sha(L[(i, 'body')][0])
        if h in bodyOf: return bodyOf[h]   # 同じ技の中で同じ原本（同じポーズ）は1枚にまとめる
        of = f'm{no:02d}_{i + 1:02d}.webp'; saved[of] = save(L[(i, 'body')][1].crop((x0, y0, x1, y1)), of); outs.append(of); bodyOf[h] = (of, saved[of]); return bodyOf[h]
    cuts, fx, ms = [], [], []
    for i, f in enumerate(fr):
        of, out = body_file(i)
        bb = [round(v * SC) for v in body_box(al[(i, 'body')][y0:y1, x0:x1])]
        dx = 0 if stage else (f.get('body_preview_stage_dx_pixels') or 0)
        mode = 'self' if not dx else ('contact' if hit == i + 1 else 'move')
        ent = {'f': of, 'src': f'Y{no}_{i + 1}', 'name': os.path.basename(f['body']), 'pw': out.size[0], 'ph': out.size[1], 'x': 0, 'y': 0, 'w': out.size[0], 'h': out.size[1], 'b': bb, 'm': mode, 't': [i, i]}
        if dx: r = round(dx / REACH, 3); ent['r'] = [r, r]; ent['dx'] = dx
        if f.get('body_pose_key'): ent['pose'] = f['body_pose_key']
        if not stage and nonEmpty[(i, 'fx')]:
            ofx = f'm{no:02d}_fx{i + 1:02d}.webp'; save(L[(i, 'fx')][1].crop((x0, y0, x1, y1)), ofx); outs.append(ofx); ent['fx'] = ofx; ent['fxName'] = os.path.basename(f['fx'])
        cuts.append(ent); ms.append(int(f['duration_ms']))
        if stage:
            for layer, key, at in (('fx', 'fx_stage_rect', 'fx'), ('hit_fx', 'hit_fx_stage_rect', 'hit')):
                eb = nonEmpty[(i, layer)]; rect = f.get(key)
                assert bool(eb) == bool(rect), (folder, i, layer, eb, rect)   # 絵がある層＝舞台の矩形がある
                if not eb: continue
                cb = (max(0, eb[0] - mg), max(0, eb[1] - mg), min(W, eb[2] + mg), min(H, eb[3] + mg))
                ofs = f'm{no:02d}_{"fx" if layer == "fx" else "hit"}{i + 1:02d}_s.webp'; eo = save(L[(i, layer)][1].crop(cb), ofs); outs.append(ofs)
                kx, ky = rect[2] / W, rect[3] / H
                sr = [round(rect[0] + cb[0] * kx, 2), round(rect[1] + cb[1] * ky, 2), round((cb[2] - cb[0]) * kx, 2), round((cb[3] - cb[1]) * ky, 2)]
                fx.append({'f': ofs, 'src': f'Y{no}_{layer}{i + 1}', 'name': os.path.basename(f[layer]), 'at': 'stage', 'layer': at, 'pw': eo.size[0], 'ph': eo.size[1], 'sr': sr, 'rect': rect, 't': [i, i]})
        elif nonEmpty[(i, 'hit_fx')]:
            eb = nonEmpty[(i, 'hit_fx')]; cb = (max(0, eb[0] - mg), max(0, eb[1] - mg), min(W, eb[2] + mg), min(H, eb[3] + mg))
            ofh = f'm{no:02d}_hit{i + 1:02d}_t.webp'; eo = save(L[(i, 'hit_fx')][1].crop(cb), ofh); outs.append(ofh)
            fx.append({'f': ofh, 'src': f'Y{no}_hit{i + 1}', 'name': os.path.basename(f['hit_fx']), 'at': 'tgt', 'pw': eo.size[0], 'ph': eo.size[1], 't': [i, i]})
    d = {'no': no, 'name': name, 'folder': folder, 'kind': j.get('kind') or ('stage' if stage else None), 'steps': n, 'hit': hit, 'ms': ms, 'dir': DIRREL, 'cuts': cuts, 'fx': fx,
         'bodies': n, 'effects': sum(1 for i in range(n) if nonEmpty[(i, 'fx')]), 'hitEffects': len(hitSteps), 'files': 3 * n}
    if stage:
        BR = fr[0]['body_stage_rect']; assert all(f['body_stage_rect'] == BR for f in fr), '本体の舞台の矩形は全コマ同じ'
        feet = [750, 1360]
        d['stage'] = {'size': j['stage_reference_size'], 'bodyRect': BR, 'feet': [round(BR[0] + feet[0] * BR[2] / W, 2), round(BR[1] + feet[1] * BR[3] / H, 2)], 'target': j['target_stage_center'],
                      'order': ['fx', 'body', 'hit_fx'], 'sc': SC, 'revision': j.get('revision')}
    data[no] = d
assert used == 150 and sum(d['bodies'] for d in data.values()) == 50, used
js = ('// ミュロルの技アニメ（2026-10-19 正式納品・10技×本体／技エフェクト／命中エフェクト＝150枚）のデータ（tools/myurol1019/build_moves.py が manifest.json から作る。手で書き換えない）\n'
      '// 正式の技の番号（1〜10＝正式素材仕様マスターの No.）→ SK の番号は 80＋No−1（js/battle/rules.js）。ミュロルは未解禁（入手方法は未決）＝QA 試遊（?mmQaTrial=1）の個体だけが使う\n'
      '//   { no, name, steps, hit, ms＝区切りの長さ（manifest の duration_ms）, cuts:[区切り { f＝本体, fx＝同じ切り出しの技エフェクト, m, r, b, t }], fx:[別に置く層 { f, at＝tgt／stage, sr＝舞台の矩形, layer, t }], stage＝No.10 の舞台 }\n'
      'window.MMMYMV_DATA = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
open(os.path.join(ROOT, 'js', 'battle', 'myurol-moves-data.js'), 'w', encoding='utf-8').write(js)
with open(os.path.join(OUT, 'sha256.txt'), 'w', encoding='utf-8') as fo:
    fo.write('# 原本（2026-10-19 ミュロル正式納品 PART04〜07 の 05_skill_animations の PNG 150枚・リポジトリには置かない）\n')
    for p, h in sorted(shas): fo.write(f'{h}  {p}\n')
    fo.write('# 派生（このフォルダの WebP）\n')
    for of in sorted(set(outs)): fo.write(f'{sha(os.path.join(OUT, of))}  {of}\n')
print('ok', used, 'files', len(set(outs)), json.dumps({k: (v['steps'], v['hit'], len(v['cuts']), sum(1 for c in v['cuts'] if c.get('fx')), len(v['fx']), len({c['f'] for c in v['cuts']})) for k, v in data.items()}))
