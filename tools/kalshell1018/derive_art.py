# カルシェル（2026-10-18 正式納品 Mismon_Kalshell_OfficialPackage_ForDev_20261018_Lite → Kalshell_DevAssets_Part01〜07）の絵と声の派生。
#   python3 -I -B tools/kalshell1018/derive_art.py <展開した納品物のフォルダ（00_docs〜07_audio）>
#   原本（PNG・MP3）は変えない・リポジトリに置かない（原本と派生の sha256 は tools/kalshell1018/derive_art.json と各 README.md）。
#   1. 正式 2.5D 立ち絵（01_art/01_透過微修正版/Kalshell_Official_2p5D_20261017.png・1254 RGBA）→ assets/monsters/2p5d/kalshell.webp
#      ＝アルファ 1 以上の外接矩形で余白だけを切る → 長辺 720（乗算済みアルファで縮小・品質 92・exact）＝tools/next1015/derive.py（フルーネ）と同じ
#   2. バトル待機絵（Kalshell_BattleIdle_Review_20261018.png）→ assets/battle/idle/idle_kalshell.webp（高さ 720・品質 90）。絵は左向き（README の「右向き」と違う＝arena の FACE 'L'）
#   3. 表情6種（02_reactions/Kalshell_Reaction_0N_*.png・1536 RGBA）→ assets/monsters/reactions_1012/kalshell/0N_kind.webp
#      ＝tools/reactions1012/build.py と同じ（余白＋4px を切る・倍率＝待機絵と体の面積（不透明度 >8）がそろう値・品質 90）。hRel＝高さ ÷ 720
#   4. 歩行 front／back 各8（03_walk/FRONT|BACK/*.png・1536 RGBA）→ assets/monsters/walk_25d/kalshell/kalshell_walk_{front,back}_0N.webp（384×384・品質 90・alpha 100）
#      ＝tools/walk25d/derive_flurene.py と同じ（縮小だけ）。h＝キャンバス ÷ 体の高さ・foot＝足の下の余白 ÷ キャンバス（front_01 で測る・他の4体と同じ基準）
#   5. 技カード10（04_skill_cards/DELIVERY_10CARDS/01_PNG/NN_Name.png・1664×936 RGB）→ assets/moves/cards_1014/kalshell/NN_id.webp（幅 640・品質 84）
#   6. 大会対戦表アイコン（06_icons/…/01_Kalshell_TournamentIcon_OFFICIAL_1254.png・RGB・灰色の背景のまま）→ assets/tournament/icons_1015/icon_kalshell.webp（256×256・品質 90）
#   7. VS イラスト（02_Kalshell_VSArt_OFFICIAL_1254.png・RGB・背景あり）→ assets/tournament/vs_1017/vs_kalshell.webp（512×512・品質 88）＝ラズックと同じ置き場（背景ありの絵は vs_monsters の透過 PNG と別）
#   8. 比較画面の肩上アップ【代替】：専用素材が無い。対戦表アイコンは灰色の背景が焼き込まれていて比較画面（透過が前提）には貼れないため、
#      ラズック（tools/razuck1017/derive_art.py）と同じく待機絵（右向き＝ほかの6枚と同じ向き・反転しない）から、顔を中心にした正方形（待機絵の高さの 62%）を切って 640×640 の透過を作る
#      （正式の肩上アップが届けば差し替え）。FACE_PT＝待機絵の派生（859×720）の目の中心（割合・目視）
#   9. ボイス2（07_audio/カルシェル公式ボイス.mp3・カルシェル悲しい.mp3）→ assets/audio/voice/monster_1017/kalshell_{normal,sad}.{ogg,m4a}
#      ＝tools/monvoice1017/derive.py と同じ（OGG q5＋M4A 128k・音は加工しない・gain＝normal −15／sad −18 LUFS 目安・sad は +3dB まで・ピーク −1 dBFS まで）
import sys, os, glob, hashlib, json, re, subprocess
import numpy as np
from PIL import Image

SRC = sys.argv[1]
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
def one(pat):
    r = glob.glob(os.path.join(SRC, '**', pat), recursive=True); assert len(r) == 1, (pat, r); return r[0]
def bbox(im, thr=8):
    a = np.asarray(im.getchannel('A')); ys, xs = np.nonzero(a > thr); return (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
def pm_resize(im, w, h): return im.convert('RGBa').resize((w, h), Image.LANCZOS).convert('RGBA')
log, orig = {}, {}
def out(rel, im, **kw):
    p = os.path.join(ROOT, rel); os.makedirs(os.path.dirname(p), exist_ok=True); im.save(p, 'WEBP', **kw); log[rel] = sha(p); return p
def rec(name, p): orig[name] = {'file': os.path.relpath(p, SRC), 'sha256': sha(p)}

# 1 正式 2.5D 立ち絵
p = one('Kalshell_Official_2p5D_20261017.png'); rec('2p5d', p); im = Image.open(p); assert im.mode == 'RGBA' and im.size == (1254, 1254)
b = bbox(im, 0); t = im.crop(b); s = 720 / max(t.size); w, h = round(t.width * s), round(t.height * s)
out('assets/monsters/2p5d/kalshell.webp', pm_resize(t, w, h), quality=92, method=6, exact=True); size2p5d = (w, h)
# 2 バトル待機絵
p = one('Kalshell_BattleIdle_Review_20261018.png'); rec('idle', p); idle = Image.open(p); assert idle.mode == 'RGBA' and idle.size == (1254, 1254)
bi = bbox(idle, 0); ti = idle.crop(bi); K = 720 / ti.height; wi = round(ti.width * K)
idle_out = pm_resize(ti, wi, 720); out('assets/battle/idle/idle_kalshell.webp', idle_out, quality=90, method=6, exact=True); sizeIdle = (wi, 720)
# 3 表情6種（倍率＝待機絵の派生と体の面積がそろう値）
ai = int((np.asarray(idle_out)[:, :, 3] > 8).sum())
KINDS = [('01_Happy', 'joy', '喜ぶ'), ('02_Surprise', 'surprise', '驚く'), ('03_Sad', 'sad', 'しょんぼり'), ('04_Eat', 'eat', '食べる'), ('05_Hit', 'hit', '被弾'), ('06_Dodge', 'dodge', '回避')]
rx = {}
for i, (tag, kind, label) in enumerate(KINDS, 1):
    p = one(f'Kalshell_Reaction_{tag}.png'); rec(f'reaction_{kind}', p); im = Image.open(p).convert('RGBA'); assert im.size == (1536, 1536)
    a = np.asarray(im)[:, :, 3]; ys, xs = np.nonzero(a > 0)
    box = (max(0, xs.min() - 4), max(0, ys.min() - 4), min(im.width, xs.max() + 5), min(im.height, ys.max() + 5))
    sc = (ai / int((a > 8).sum())) ** 0.5; c = im.crop(box); cw, ch = round(c.width * sc), round(c.height * sc)
    out(f'assets/monsters/reactions_1012/kalshell/{i:02d}_{kind}.webp', pm_resize(c, cw, ch), quality=90, method=6)
    rx[kind] = {'w': cw, 'h': ch, 'hRel': round(ch / 720, 3), 'label': label}
# 4 歩行 16
walk = {'front': [], 'back': []}
for dn, DN in (('front', 'FRONT'), ('back', 'BACK')):
    for i in range(1, 9):
        p = os.path.join(SRC, '03_walk', DN, f'{DN}_{i:02d}.png'); rec(f'walk_{dn}_{i:02d}', p); im = Image.open(p).convert('RGBA'); assert im.size == (1536, 1536)
        out(f'assets/monsters/walk_25d/kalshell/kalshell_walk_{dn}_{i:02d}.webp', im.resize((384, 384), Image.LANCZOS), quality=90, alpha_quality=100, method=6)
        a = np.asarray(im)[:, :, 3]; ys = np.nonzero((a > 8).any(axis=1))[0]; walk[dn].append({'top': int(ys.min()), 'bottom': int(ys.max()) + 1})
f1 = walk['front'][0]; walkSpec = {'h': round(1536 / (f1['bottom'] - f1['top']), 3), 'foot': round((1536 - f1['bottom']) / 1536, 3),
                                   'bodyHeight': [[v['bottom'] - v['top'] for v in walk[d]] for d in ('front', 'back')], 'bottom': [[v['bottom'] for v in walk[d]] for d in ('front', 'back')]}
# 5 技カード10
CARDS = [(1, 'Hasamu', 'hasamu'), (2, 'ShellTackle', 'shell_tackle'), (3, 'Awadama', 'awadama'), (4, 'KaraNiKomoru', 'kara_ni_komoru'), (5, 'CrashClaw', 'crash_claw'),
         (6, 'AquaBurst', 'aqua_burst'), (7, 'CoralSpear', 'coral_spear'), (8, 'ShioNoStep', 'shio_no_step'), (9, 'ShellBreaker', 'shell_breaker'), (10, 'TidalCrash', 'tidal_crash')]
for no, en, mid in CARDS:
    p = one(f'{no:02d}_{en}.png'); rec(f'card_{no:02d}', p); im = Image.open(p).convert('RGB'); assert im.size == (1664, 936)
    out(f'assets/moves/cards_1014/kalshell/{no:02d}_{mid}.webp', im.resize((640, round(im.height * 640 / im.width)), Image.LANCZOS), quality=84, method=6)
# 6 対戦表アイコン・7 VS
p = one('01_Kalshell_TournamentIcon_OFFICIAL_1254.png'); rec('icon', p); ic = Image.open(p).convert('RGB'); assert ic.size == (1254, 1254)
out('assets/tournament/icons_1015/icon_kalshell.webp', ic.resize((256, 256), Image.LANCZOS), quality=90, method=6)
patch = np.asarray(ic)[8:72, 8:72].reshape(-1, 3); iconBg = '#%02x%02x%02x' % tuple(int(v) for v in np.median(patch, axis=0))
p = one('02_Kalshell_VSArt_OFFICIAL_1254.png'); rec('vs', p); vs = Image.open(p).convert('RGB'); assert vs.size == (1254, 1254)
out('assets/tournament/vs_1017/vs_kalshell.webp', vs.resize((512, 512), Image.LANCZOS), quality=88, method=6)
# 8 比較画面の肩上アップ【代替】＝待機絵（右向き）の顔を中心にした正方形（高さの 62%）。顔＝正方形の (0.60, 0.50)（js/battle/compare.js の PORTRAIT の fx・fy と同じ値）
FACE_PT = (0.64, 0.535)
side = round(ti.height * 0.62); fxp, fyp = round(ti.width * FACE_PT[0]), round(ti.height * FACE_PT[1])
x0, y0 = max(0, fxp - round(side * 0.60)), max(0, fyp - round(side * 0.50))
sq = Image.new('RGBA', (side, side), (0, 0, 0, 0)); sq.paste(ti.crop((x0, y0, min(ti.width, x0 + side), min(ti.height, y0 + side))), (0, 0))
out('assets/monsters/compare_1015/kalshell.webp', pm_resize(sq, 640, 640), quality=88, method=6)
portraitBox = [x0, y0, side]
# 9 ボイス2
def loud(p):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', p, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1]), float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', r)[-1])
voice = []
VO = os.path.join(ROOT, 'assets', 'audio', 'voice', 'monster_1017')
for kind, pat in (('normal', '*公式*.mp3'), ('sad', '*悲しい*.mp3')):
    p = one(pat); rec(f'voice_{kind}', p); I, P = loud(p); target = -15.0 if kind == 'normal' else -18.0
    db = target - I
    if kind == 'sad': db = min(db, 3.0)
    db = min(db, -1.0 - P); g = round(10 ** (db / 20), 3)
    base = os.path.join(VO, f'kalshell_{kind}')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', p, '-c:a', 'libvorbis', '-q:a', '5', base + '.ogg'], check=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', p, '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', base + '.m4a'], check=True)
    for ext in ('.ogg', '.m4a'): log[os.path.relpath(base + ext, ROOT)] = sha(base + ext)
    voice.append({'id': f'cry_kalshell_{kind}', 'kind': kind, 'orig': os.path.basename(p), 'origSha': sha(p), 'I': I, 'peak': P, 'gain': g})
json.dump({'scale2p5d': round(s, 5), 'scaleIdle': round(K, 5), 'size2p5d': size2p5d, 'sizeIdle': sizeIdle, 'idleCrop': [int(v) for v in bi], 'portraitBox': portraitBox, 'reactions': rx, 'walk': walkSpec, 'iconBg': iconBg,
           'voice': voice, 'originals': orig, 'derived': log}, open(os.path.join(ROOT, 'tools', 'kalshell1018', 'derive_art.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', len(log), 'derived', json.dumps({'2p5d': size2p5d, 'idle': sizeIdle, 'walk': {'h': walkSpec['h'], 'foot': walkSpec['foot']}, 'iconBg': iconBg, 'rx': {k: v['hRel'] for k, v in rx.items()}, 'voice': [(v['id'], v['I'], v['peak'], v['gain']) for v in voice]}, ensure_ascii=False))
