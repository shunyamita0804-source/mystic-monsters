# ラズックの絵の派生（2026-10-17 統合便）：原本は変えない・リポジトリに置かない（各 README.md に原本と派生の sha256）
#   python3 -I -B tools/razuck1017/derive_art.py <FinalSkillData の展開> <Icons の展開> <表情6種の展開> <技カードの展開>
#   1. バトル待機：Razuck_BattleIdle_FinalAlpha_Reference.png（透過・参考画像）→ assets/battle/idle/idle_razuck.webp（透明な余白を切る・高さ 720）
#      ＝正式の 2.5D 立ち絵・待機絵がリポジトリに無いため、QA の確認用（PENDING_SPECIES の art:'reference'）
#   2. 比較画面の肩上アップ：同じ待機絵の上の部分 → assets/monsters/compare_1015/razuck.webp（640×640・透過）
#   3. 対戦表の顔：Razuck_CompareIcon_20261017.png（RGB・淡い灰色の背景のまま）→ assets/tournament/icons_1015/icon_razuck.webp（256×256）
#   4. VS：Razuck_VSIllustration_20261017.png（RGB・白い背景のまま・左向き）→ assets/tournament/vs_1017/vs_razuck.webp（512×512）＝QA の比較だけ
#   5. 表情6種（1536×1536 RGBA）→ assets/monsters/reactions_1017_razuck/0N_*.webp（待機絵と同じ倍率＝体の大きさがそろう）＋ hRel を README と js に
#   6. 技カード10枚（1664×936 RGB）→ assets/moves/cards_1014/razuck/NN_id.webp（幅 640・品質 84）＝ユーザーの美術承認前＝QA だけ
import sys, os, glob, hashlib, json
import numpy as np
from PIL import Image

DATA, ICONS, EXPR, CARDS = sys.argv[1:5]
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
def one(base, pat):
    r = glob.glob(os.path.join(base, '**', pat), recursive=True); assert len(r) == 1, (pat, r); return r[0]
def bbox(im, thr=8):
    a = np.asarray(im.getchannel('A')); ys, xs = np.nonzero(a > thr); return (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
log = {}
def out(rel, im, **kw):
    p = os.path.join(ROOT, rel); os.makedirs(os.path.dirname(p), exist_ok=True); im.save(p, 'WEBP', **kw); log[rel] = sha(p); return p

# 1 待機
src_idle = one(DATA, 'Razuck_BattleIdle_FinalAlpha_Reference.png'); idle = Image.open(src_idle).convert('RGBA')
b = bbox(idle); pad = 6; b = (max(0, b[0] - pad), max(0, b[1] - pad), min(idle.width, b[2] + pad), min(idle.height, b[3] + pad))
crop = idle.crop(b); K = 720 / crop.height
idle_out = crop.resize((round(crop.width * K), 720), Image.LANCZOS)
out('assets/battle/idle/idle_razuck.webp', idle_out, quality=90, method=6)
# 2 比較の肩上アップ（上 62% の正方形・顔が中心）
side = round(crop.height * 0.62); cx = crop.width // 2
sq = Image.new('RGBA', (side, side), (0, 0, 0, 0)); sq.paste(crop.crop((max(0, cx - side // 2), 0, min(crop.width, cx + side // 2), side)), (max(0, side // 2 - cx), 0))
out('assets/monsters/compare_1015/razuck.webp', sq.resize((640, 640), Image.LANCZOS), quality=88, method=6)
# 3 対戦表の顔・4 VS（背景つき RGB のまま）
src_icon = one(ICONS, 'Razuck_CompareIcon_20261017.png'); src_vs = one(ICONS, 'Razuck_VSIllustration_20261017.png')
out('assets/tournament/icons_1015/icon_razuck.webp', Image.open(src_icon).convert('RGB').resize((256, 256), Image.LANCZOS), quality=88, method=6)
out('assets/tournament/vs_1017/vs_razuck.webp', Image.open(src_vs).convert('RGB').resize((512, 512), Image.LANCZOS), quality=88, method=6)
# 5 表情（待機絵と同じ倍率 K）
KINDS = [('01_Happy', '01_joy'), ('02_Surprised', '02_surprise'), ('03_Sad', '03_sad'), ('04_Eat', '04_eat'), ('05_Hit', '05_hit'), ('06_Dodge', '06_dodge')]
rx, srcs = {}, {}
for tag, name in KINDS:
    p = one(EXPR, f'Razuck_Reaction_{tag}.png'); srcs[name] = p; im = Image.open(p).convert('RGBA'); bb = bbox(im)
    bb = (max(0, bb[0] - pad), max(0, bb[1] - pad), min(im.width, bb[2] + pad), min(im.height, bb[3] + pad)); c = im.crop(bb)
    o = c.resize((round(c.width * K), round(c.height * K)), Image.LANCZOS)
    out(f'assets/monsters/reactions_1017_razuck/{name}.webp', o, quality=88, method=6)
    rx[name.split('_', 1)[1]] = {'w': o.width, 'h': o.height, 'hRel': round(o.height / 720, 3), 'bottomPad': int(im.height - bbox(im)[3])}
# 6 技カード
cards = sorted(glob.glob(os.path.join(CARDS, '**', 'PNG', '*.png'), recursive=True)); assert len(cards) == 10, cards
for p in cards:
    im = Image.open(p).convert('RGB'); w = 640
    out(f'assets/moves/cards_1014/razuck/{os.path.basename(p)[:-4]}.webp', im.resize((w, round(im.height * w / im.width)), Image.LANCZOS), quality=84, method=6)
orig = {'idle': (os.path.basename(src_idle), sha(src_idle)), 'icon': (os.path.basename(src_icon), sha(src_icon)), 'vs': (os.path.basename(src_vs), sha(src_vs))}
orig.update({k: (os.path.basename(v), sha(v)) for k, v in srcs.items()}); orig.update({os.path.basename(p): (os.path.basename(p), sha(p)) for p in cards})
json.dump({'scale': round(K, 5), 'idleCrop': [int(v) for v in b], 'reactions': rx, 'originals': orig, 'derived': log}, open(os.path.join(ROOT, 'tools', 'razuck1017', 'derive_art.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', len(log), 'K', round(K, 4), json.dumps(rx, ensure_ascii=False))
