# 2026-10-16（バトル最終統合）：ユーザー承認の新素材（ZIP Mismon_Battle_Final_Part01_Art・Part02_RootDrain）の表示用の派生。
#  原本 PNG は加工しない・リポジトリに置かない（sha256 は各フォルダの README.md・tools/final1016/derive.json）。縮小と WebP だけ（描き直し・色の加工なし）。
#  使い方：python3 -I tools/final1016/derive.py <Part01 の P01_ArtCards> <Part02 の RootDrain_v2_repaired>
#   ・SK08 スターダストレイ 光線2枚（2048×512）→ soramo_moves_1012/08_a01_fx.webp・08_a02_fx.webp（1024×256・全キャンバス＝発光点 x 215/2048・y 280/512 を保つ）
#   ・SK31 ずつき 本体2枚（1254×1254）→ nobiton_moves_1012/31_b01.webp・31_b02.webp（2枚同じ切り出し＝足もと y 1140 がそろう）
#   ・フルーネ技10 根4＋命中3（1024×1024）→ flurene_moves_1015/f10_d01_fx〜d07_fx.webp（512×512・全キャンバス＝根の根元・命中の中心を保つ）
#   ・フルーネ技09 ルートドレイン補修版10枚（2560×1536）→ flurene_rootdrain_v2_1016/rd2_01〜10.webp（10枚同じ切り出し）
#   ・技カード3枚（1664×936）→ cards_1014/gauru/06_fireball.webp・nobiton/02_zutsuki.webp・flurene/09_root_drain.webp（幅 640・品質84＝既存50枚と同じ）
import sys, os, json, hashlib
import numpy as np
from PIL import Image
P1, P2 = sys.argv[1:3]
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
B = os.path.join(ROOT, 'assets', 'battle')
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
log = []

def pm_resize(im, size):
    a = np.asarray(im.convert('RGBA'), dtype=np.float32) / 255
    pm = np.dstack([a[..., :3] * a[..., 3:4], a[..., 3:4]])
    r = Image.fromarray((pm * 255 + 0.5).astype(np.uint8), 'RGBA').resize(size, Image.LANCZOS)
    b = np.asarray(r, dtype=np.float32) / 255; al = b[..., 3:4]
    rgb = np.where(al > 0, b[..., :3] / np.maximum(al, 1e-6), 0)
    return Image.fromarray((np.dstack([np.clip(rgb, 0, 1), al]) * 255 + 0.5).astype(np.uint8), 'RGBA')

def save(im, dst, src, extra=None, q=90):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if im.mode == 'RGBA': im.save(dst, 'WEBP', quality=q, alpha_quality=100, method=6)
    else: im.save(dst, 'WEBP', quality=q, method=6)
    r = {'src': os.path.basename(src), 'src_size': list(Image.open(src).size), 'src_sha256': sha(src), 'dst': os.path.relpath(dst, ROOT), 'size': list(im.size), 'dst_sha256': sha(dst)}
    if extra: r.update(extra)
    log.append(r); print(r['dst'], r['size'], os.path.getsize(dst))

def union_box(paths, pad, W, H):
    box = [10**9, 10**9, 0, 0]
    for p in paths:
        a = np.asarray(Image.open(p).convert('RGBA'))[..., 3]; ys, xs = np.nonzero(a > 4)
        box = [min(box[0], xs.min()), min(box[1], ys.min()), max(box[2], xs.max() + 1), max(box[3], ys.max() + 1)]
    return [int(max(0, box[0] - pad)), int(max(0, box[1] - pad)), int(min(W, box[2] + pad)), int(min(H, box[3] + pad))]

ART = os.path.join(P1, 'Art_3skills_11PNG')
# SK08
for i, n in enumerate(['A_01_soramo_stardust_beam_extend.png', 'A_02_soramo_stardust_beam_peak.png'], 1):
    p = os.path.join(ART, 'A_Soramo_SK08', n)
    save(pm_resize(Image.open(p), (1024, 256)), os.path.join(B, 'soramo_moves_1012', f'08_a{i:02d}_fx.webp'), p, {'origin': [215 / 2048, 280 / 512]})
# SK31
ps = [os.path.join(ART, 'B_Nobiton_SK31', n) for n in ['B_01_nobiton_headbutt_windup.png', 'B_02_nobiton_headbutt_contact.png']]
bx = union_box(ps, 16, 1254, 1254); K = 0.56
for i, p in enumerate(ps, 1):
    c = Image.open(p).convert('RGBA').crop(tuple(bx)); sz = (round(c.width * K), round(c.height * K))
    out = pm_resize(c, sz); A = np.asarray(out)[..., 3]; ys, xs = np.nonzero(A >= 128)
    save(out, os.path.join(B, 'nobiton_moves_1012', f'31_b{i:02d}.webp'), p, {'crop': bx, 'scale': K, 'b': [int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1]})
# フルーネ技10
for i, n in enumerate(['D_01_flurene_roottem_root_rise.png', 'D_02_flurene_roottem_root_full.png', 'D_03_flurene_roottem_root_strike.png', 'D_04_flurene_roottem_root_retract.png',
                       'D_05_flurene_roottem_hit_open.png', 'D_06_flurene_roottem_hit_peak.png', 'D_07_flurene_roottem_hit_fade.png'], 1):
    p = os.path.join(ART, 'C_Flurene_No10', n)
    save(pm_resize(Image.open(p), (512, 512)), os.path.join(B, 'flurene_moves_1015', f'f10_d{i:02d}_fx.webp'), p)
# ルートドレイン補修版10枚
ORDER = ['01', '02', '03', '04', '05_prebeat', '05', '06_prebeat', '06', '07', '08']
ps = [os.path.join(P2, f'root_drain_{o}.png') for o in ORDER]
bx = union_box(ps, 12, 2560, 1536); K = 0.42
for i, p in enumerate(ps, 1):
    c = Image.open(p).convert('RGBA').crop(tuple(bx)); sz = (round(c.width * K), round(c.height * K))
    out = pm_resize(c, sz); A = np.asarray(out)[..., 3]; ys, xs = np.nonzero(A >= 128)
    save(out, os.path.join(B, 'flurene_rootdrain_v2_1016', f'rd2_{i:02d}.webp'), p,
         {'order': ORDER[i - 1], 'crop': bx, 'scale': K, 'alpha128': round(float((A >= 128).mean()), 5), 'bbox': [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())],
          'cx': round(float(xs.mean()) / sz[0], 4), 'bottom': round(float(ys.max() + 1) / sz[1], 4)})
# 技カード3枚
CD = os.path.join(P1, 'Cards_3approved'); MC = os.path.join(ROOT, 'assets', 'moves', 'cards_1014')
for n, dst in [('01_Gauru_06_Fireball_Card_Mouth.png', 'gauru/06_fireball.webp'), ('02_Nobiton_02_Headbutt_Card_Forehead.png', 'nobiton/02_zutsuki.webp'), ('03_Fulune_09_RootDrain_Card_Absorb.png', 'flurene/09_root_drain.webp')]:
    p = os.path.join(CD, n); im = Image.open(p)
    if im.size != (1664, 936): raise SystemExit('大きさが違う: ' + p)
    im = im.convert('RGB'); w = 640; h = round(im.height * w / im.width)
    save(im.resize((w, h), Image.LANCZOS), os.path.join(MC, dst), p, q=84)
json.dump(log, open(os.path.join(ROOT, 'tools', 'final1016', 'derive.json'), 'w'), ensure_ascii=False, indent=1)
