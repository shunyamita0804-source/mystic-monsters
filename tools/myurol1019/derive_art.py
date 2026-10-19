# ミュロル（2026-10-19 正式納品 Mismon_Myurol 開発本体向け 正式素材仕様一式＝PART01〜07・ユーザー承認済み）の絵・声・歩行の派生。
#   python3 -I -B tools/myurol1019/derive_art.py <PART01 のフォルダ（00_docs・01_art・02_reactions・06_icons・07_audio）> <PART02 の 04_skill_cards> <PART03 の 03_walk>
#   原本（PNG・MP3）は変えない・リポジトリに置かない（原本と派生の sha256 は tools/myurol1019/derive_art.json と各 README.md の「ミュロル」の節）。
#   作り方はカルシェル（tools/kalshell1018/derive_art.py）と同じ：
#   1. 正式 2.5D 立ち絵 → assets/monsters/2p5d/myurol.webp（アルファ 1 以上の外接矩形で余白だけを切る → 長辺 720・乗算済みアルファで縮小・品質 92・exact）
#   2. 正式バトル待機絵 → assets/battle/idle/idle_myurol.webp（高さ 720・品質 90・右向き＝ほかの種族と同じ）
#      ・原本の選び方：01_art の2枚（FormalArt_Approved・BattleIdle_Candidate）と 02_reactions の「正式」の2枚は、アルファ 1 の見えない画素（約2.2万）が 01_art にだけある以外は画素が同じ。
#        採用状態一覧（2026-10-19）の「正式」の名前の付いた 02_reactions の2枚を使う（01_art の待機絵の名前は Candidate＝採用一覧より古い）
#   3. 表情6種（02_reactions/0N_*.png・1536 RGBA）→ assets/monsters/reactions_1012/myurol/0N_kind.webp（余白＋4px を切る・倍率＝待機絵と体の面積（不透明度 >8）がそろう値・品質 90）
#   4. 技カード10（04_skill_cards/NN_技名.png・1664×936 RGB）→ assets/moves/cards_1014/myurol/NN_id.webp（幅 640・品質 84）
#   5. 大会対戦表アイコン（06_icons/Myurol_TournamentIcon_1254.png・RGB・灰色の背景のまま）→ assets/tournament/icons_1015/icon_myurol.webp（256×256・品質 90）
#   6. VS イラスト（06_icons/Myurol_VS_1254.png・RGB・背景あり）→ assets/tournament/vs_1017/vs_myurol.webp（512×512・品質 88）
#   7. 比較画面の肩上アップ【代替】：専用素材が無い＝正式の待機絵（右向き）から顔を中心にした正方形（待機絵の高さの 80%＝頭が大きく 62% では顔だけになる）を切って 640×640 の透過（カルシェルと同じ作り方）
#   8. ボイス2（07_audio：通常＝A_tiny_fantasy_aquat_#3-…mp3・悲しい＝The_same_tiny_fantas_#1-…mp3＝仕様マスター §5 の対応）→ assets/audio/voice/monster_1017/myurol_{normal,sad}.{ogg,m4a}
#      （OGG q5＋M4A 128k・音は加工しない・gain＝normal −15／sad −18 LUFS 目安・sad は +3dB まで・ピーク −1 dBFS まで）
#   9. 歩行 5方向×4コマ（03_walk/00〜19.png・512×512 RGBA。00〜03 正面・04〜07 背面・08〜11 右横・12〜15 右斜め後ろ・16〜19 右斜め前）
#      → assets/monsters/walk_1018/myurol/{front,back,side,backd,frontd}_{1..4}.webp。ほかの7体（tools/walk1018/derive.py）と同じ置き方：
#      原寸のまま（縮小・引き伸ばしなし）・種族で同じ正方形のキャンバス・足もと（不透明の下端）を同じ基線（下 4.5%）・横はコマの中心に対する位置を保つ・品質 92。
#      h＝正面2コマ目（01.png）の体の高さに対するキャンバスの比・foot＝基線の下の余白（tools/walk1018/derive.json の myurol → js/qa/walk5-1016.js の SPEC1018）
#      ※ tools/walk1018/derive.py をやり直すと derive.json・frames.json・README.md が7体だけで書き直される＝そのあとこの道具をもう一度実行する
import sys, os, glob, hashlib, json, re, subprocess
import numpy as np
from PIL import Image

P1, PCARD, PWALK = sys.argv[1], sys.argv[2], sys.argv[3]
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
def bbox(im, thr=8):
    a = np.asarray(im.getchannel('A')); ys, xs = np.nonzero(a > thr); return (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
def pm_resize(im, w, h): return im.convert('RGBa').resize((w, h), Image.LANCZOS).convert('RGBA')
log, orig = {}, {}
def out(rel, im, **kw):
    p = os.path.join(ROOT, rel); os.makedirs(os.path.dirname(p), exist_ok=True); im.save(p, 'WEBP', **kw); log[rel] = sha(p); return p
def rec(name, p, base): orig[name] = {'file': os.path.relpath(p, base), 'sha256': sha(p)}

# 1 正式 2.5D 立ち絵（02_reactions の「正式」）・01_art の同じ絵との比較
p = os.path.join(P1, '02_reactions', 'ミュロル_正式2.5D立ち絵.png'); rec('2p5d', p, P1); im = Image.open(p); assert im.mode == 'RGBA' and im.size == (1254, 1254)
def same_but_alpha1(a, b):
    x = np.asarray(Image.open(a).convert('RGBA')).astype(int); y = np.asarray(Image.open(b).convert('RGBA')).astype(int)
    ax, ay = x[..., 3], y[..., 3]; both = (ax > 0) & (ay > 0)
    return {'other': os.path.relpath(a, P1), 'otherSha256': sha(a), 'onlyInOther': int(((ax > 0) & (ay == 0)).sum()), 'onlyInOtherMaxAlpha': int(ax[(ax > 0) & (ay == 0)].max()) if ((ax > 0) & (ay == 0)).any() else 0,
            'onlyInUsed': int(((ay > 0) & (ax == 0)).sum()), 'diffWhereBoth': int(np.abs(x - y)[both].max()) if both.any() else 0}
cmpArt = {'2p5d': same_but_alpha1(os.path.join(P1, '01_art', 'Mismon_Myurol_FormalArt_Approved_20261018.png'), p)}
b = bbox(im, 0); t = im.crop(b); s = 720 / max(t.size); w, h = round(t.width * s), round(t.height * s)
out('assets/monsters/2p5d/myurol.webp', pm_resize(t, w, h), quality=92, method=6, exact=True); size2p5d = (w, h)
# 2 正式バトル待機絵
p = os.path.join(P1, '02_reactions', 'ミュロル_正式バトル待機絵.png'); rec('idle', p, P1); idle = Image.open(p); assert idle.mode == 'RGBA' and idle.size == (1254, 1254)
cmpArt['idle'] = same_but_alpha1(os.path.join(P1, '01_art', 'Mismon_Myurol_BattleIdle_Candidate_20261018.png'), p)
bi = bbox(idle, 0); ti = idle.crop(bi); K = 720 / ti.height; wi = round(ti.width * K)
idle_out = pm_resize(ti, wi, 720); out('assets/battle/idle/idle_myurol.webp', idle_out, quality=90, method=6, exact=True); sizeIdle = (wi, 720)
# 3 表情6種
ai = int((np.asarray(idle_out)[:, :, 3] > 8).sum())
KINDS = [('01_喜ぶ', 'joy', '喜ぶ'), ('02_驚く', 'surprise', '驚く'), ('03_しょんぼり', 'sad', 'しょんぼり'), ('04_食べる', 'eat', '食べる'), ('05_被弾', 'hit', '被弾'), ('06_回避', 'dodge', '回避')]
rx = {}
for i, (tag, kind, label) in enumerate(KINDS, 1):
    p = os.path.join(P1, '02_reactions', tag + '.png'); rec(f'reaction_{kind}', p, P1); im = Image.open(p).convert('RGBA'); assert im.size == (1536, 1536)
    a = np.asarray(im)[:, :, 3]; ys, xs = np.nonzero(a > 0)
    box = (max(0, xs.min() - 4), max(0, ys.min() - 4), min(im.width, xs.max() + 5), min(im.height, ys.max() + 5))
    sc = (ai / int((a > 8).sum())) ** 0.5; c = im.crop(box); cw, ch = round(c.width * sc), round(c.height * sc)
    out(f'assets/monsters/reactions_1012/myurol/{i:02d}_{kind}.webp', pm_resize(c, cw, ch), quality=90, method=6)
    edge = [int(v) for v in (xs.min() == 0, ys.min() == 0, xs.max() == im.width - 1, ys.max() == im.height - 1)]
    rx[kind] = {'w': cw, 'h': ch, 'hRel': round(ch / 720, 3), 'label': label, 'touchesEdge': edge}
# 4 技カード10
CARDS = [(1, 'しっぽうち', 'shippo_uchi'), (2, 'みずでっぽう', 'mizudeppo'), (3, 'タックル', 'tackle'), (4, 'あわのまもり', 'awa_no_mamori'), (5, 'テールスイング', 'tail_swing'),
         (6, 'アクアバブル', 'aqua_bubble'), (7, 'バブルスナイプ', 'bubble_snipe'), (8, 'すいすいステップ', 'suisui_step'), (9, 'スパイラルテール', 'spiral_tail'), (10, 'マリンストリーム', 'marine_stream')]
for no, ja, mid in CARDS:
    p = os.path.join(PCARD, f'{no:02d}_{ja}.png'); rec(f'card_{no:02d}', p, os.path.dirname(PCARD)); im = Image.open(p).convert('RGB'); assert im.size == (1664, 936)
    out(f'assets/moves/cards_1014/myurol/{no:02d}_{mid}.webp', im.resize((640, round(im.height * 640 / im.width)), Image.LANCZOS), quality=84, method=6)
# 5 対戦表アイコン・6 VS
p = os.path.join(P1, '06_icons', 'Myurol_TournamentIcon_1254.png'); rec('icon', p, P1); ic = Image.open(p).convert('RGB'); assert ic.size == (1254, 1254)
out('assets/tournament/icons_1015/icon_myurol.webp', ic.resize((256, 256), Image.LANCZOS), quality=90, method=6)
patch = np.asarray(ic)[8:72, 8:72].reshape(-1, 3); iconBg = '#%02x%02x%02x' % tuple(int(v) for v in np.median(patch, axis=0))
p = os.path.join(P1, '06_icons', 'Myurol_VS_1254.png'); rec('vs', p, P1); vs = Image.open(p).convert('RGB'); assert vs.size == (1254, 1254)
out('assets/tournament/vs_1017/vs_myurol.webp', vs.resize((512, 512), Image.LANCZOS), quality=88, method=6)
# 7 比較画面の肩上アップ【代替】＝待機絵（右向き）の顔を中心にした正方形（高さの 80%）。右と上は待機絵の端で止まる＝顔の位置は derive_art.json の portraitFace（js/battle/compare.js の PORTRAIT[8] の fx・fy）
FACE_PT = (0.80, 0.33)   # 待機絵の切り出し（余白を切った 978×759）の中の顔の中心（割合・目視＝両目の間）
side = round(ti.height * 0.80); fxp, fyp = round(ti.width * FACE_PT[0]), round(ti.height * FACE_PT[1])
x0, y0 = max(0, min(ti.width - side, fxp - round(side * 0.60))), max(0, fyp - round(side * 0.50))
sq = Image.new('RGBA', (side, side), (0, 0, 0, 0)); sq.paste(ti.crop((x0, y0, min(ti.width, x0 + side), min(ti.height, y0 + side))), (0, 0))
out('assets/monsters/compare_1015/myurol.webp', pm_resize(sq, 640, 640), quality=88, method=6)
portraitBox = [x0, y0, side]
fcx, fcy = (fxp - x0) / side, (fyp - y0) / side
# 8 ボイス2
def loud(p):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', p, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1]), float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', r)[-1])
def dur(p):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p], capture_output=True, text=True).stdout
    return round(float(r.strip()), 3)
voice = []
VO = os.path.join(ROOT, 'assets', 'audio', 'voice', 'monster_1017')
for kind, fn in (('normal', 'A_tiny_fantasy_aquat_#3-1792332367994.mp3'), ('sad', 'The_same_tiny_fantas_#1-1792332426355.mp3')):
    p = os.path.join(P1, '07_audio', fn); rec(f'voice_{kind}', p, P1); I, P = loud(p); target = -15.0 if kind == 'normal' else -18.0
    db = target - I
    if kind == 'sad': db = min(db, 3.0)
    db = min(db, -1.0 - P); g = round(10 ** (db / 20), 3)
    base = os.path.join(VO, f'myurol_{kind}')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', p, '-c:a', 'libvorbis', '-q:a', '5', base + '.ogg'], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', p, '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', base + '.m4a'], check=True)
    for ext in ('.ogg', '.m4a'): log[os.path.relpath(base + ext, ROOT)] = sha(base + ext)
    voice.append({'id': f'cry_myurol_{kind}', 'kind': kind, 'orig': fn, 'origSha': sha(p), 'I': I, 'peak': P, 'gain': g, 'sec': dur(p)})
# 9 歩行 5方向×4コマ（walk_1018 と同じ置き方）
DIRS = ['front', 'back', 'side', 'backd', 'frontd']
MARGIN_FOOT = 0.045
frames = []
for n in range(20):
    p = os.path.join(PWALK, f'{n:02d}.png'); rec(f'walk_{n:02d}', p, os.path.dirname(PWALK)); im = Image.open(p).convert('RGBA'); assert im.size == (512, 512)
    a = np.asarray(im)[:, :, 3]; ys, xs = np.nonzero(a > 0)
    bb = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    frames.append({'n': n, 'name': f'{DIRS[n // 4]}_{n % 4 + 1}.webp', 'img': np.asarray(im)[bb[1]:bb[3], bb[0]:bb[2]].copy(), 'bbox': bb, 'cx': (bb[0] + bb[2]) / 2 - 256, 'src': f'{n:02d}.png', 'srcSha': sha(p)})
maxw = max(f['img'].shape[1] for f in frames); maxh = max(f['img'].shape[0] for f in frames)
wside = int(np.ceil(max(maxw * 1.06, maxh / (1 - MARGIN_FOOT) * 1.02) / 8) * 8)
wbase = int(round(wside * (1 - MARGIN_FOOT)))
use_cell = all(abs(f['cx']) + f['img'].shape[1] / 2 <= wside / 2 - 2 for f in frames)
wlog = []
for f in frames:
    im = f['img']; hh, ww = im.shape[:2]
    canvas = np.zeros((wside, wside, 4), np.uint8)
    cx = wside / 2 + (f['cx'] if use_cell else 0)
    x = max(0, min(wside - ww, int(round(cx - ww / 2)))); y = max(0, wbase - hh)
    canvas[y:y + hh, x:x + ww] = im
    rel = f'assets/monsters/walk_1018/myurol/{f["name"]}'
    out(rel, Image.fromarray(canvas, 'RGBA'), quality=92, method=6)
    wlog.append({'name': f['name'], 'src': f['src'], 'src_sha256': f['srcSha'], 'bbox': f['bbox'], 'w': ww, 'h': hh, 'x': x, 'y': y, 'derived_sha256': log[rel]})
st = [f for f in frames if f['n'] == 1][0]   # 正面2コマ目（01.png）
walkSpec = {'h': round(wside / st['img'].shape[0], 3), 'foot': round((wside - wbase) / wside, 3)}
# tools/walk1018/derive.json・frames.json に myurol を足す（ほかの7体の値は変えない）
WJ = os.path.join(ROOT, 'tools', 'walk1018', 'derive.json'); wj = json.load(open(WJ)); wj['myurol'] = walkSpec; json.dump(wj, open(WJ, 'w'), indent=1)
WF = os.path.join(ROOT, 'tools', 'walk1018', 'frames.json'); wf = json.load(open(WF))
wf['myurol'] = {'size': [512, 512], 'side': wside, 'base': wbase, 'cell_mode': 'cell-center' if use_cell else 'center', 'src': '03_walk/00〜19.png（512×512 RGBA の20枚）', 'tool': 'tools/myurol1019/derive_art.py', 'frames': wlog}
json.dump(wf, open(WF, 'w'), indent=1)

json.dump({'scale2p5d': round(s, 5), 'scaleIdle': round(K, 5), 'size2p5d': size2p5d, 'sizeIdle': sizeIdle, 'idleCrop': [int(v) for v in bi], 'portraitBox': portraitBox, 'portraitFace': [round(fcx, 3), round(fcy, 3)],
           'reactions': rx, 'walk': dict(walkSpec, side=wside, base=wbase, cellMode='cell-center' if use_cell else 'center'), 'iconBg': iconBg, 'voice': voice, 'artCompare': cmpArt, 'originals': orig, 'derived': log},
          open(os.path.join(ROOT, 'tools', 'myurol1019', 'derive_art.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', len(log), 'derived', json.dumps({'2p5d': size2p5d, 'idle': sizeIdle, 'walk': walkSpec, 'wside': wside, 'iconBg': iconBg, 'face': [round(fcx, 3), round(fcy, 3)], 'rx': {k: (v['hRel'], v['touchesEdge']) for k, v in rx.items()}, 'voice': [(v['id'], v['I'], v['peak'], v['gain'], v['sec']) for v in voice], 'cmp': cmpArt}, ensure_ascii=False))
