# 2026-10-16：フルーネ技09「ルートドレイン」8コマ（ZIP Mismon_Claude_Combined_iPhone6_Fulune_20261016 の 02_Fulune_RootDrain/原PNG）の表示用の派生。
#  原本は加工しない・リポジトリに置かない（sha256 は README.md）。8枚とも同じ切り出し（全コマの和の範囲＋余白）＝足もとと位置がそろったまま。縮小と WebP だけ
#  使い方：python3 -I tools/rootdrain1016/derive.py <原PNG のフォルダ>
import sys, os, hashlib, json
import numpy as np
from PIL import Image
SRC = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'assets', 'battle', 'flurene_rootdrain_1016')
os.makedirs(OUT, exist_ok=True)
K = 0.42   # 縮小（ほかのフルーネの技アニメ＝0.4 倍に合わせる）
ims = [Image.open(os.path.join(SRC, f'root_drain_{i:02d}.png')).convert('RGBA') for i in range(1, 9)]
box = [9999, 9999, 0, 0]
for im in ims:
    a = np.asarray(im)[..., 3]; ys, xs = np.nonzero(a > 4)
    box = [min(box[0], xs.min()), min(box[1], ys.min()), max(box[2], xs.max() + 1), max(box[3], ys.max() + 1)]
pad = 12; box = [max(0, box[0] - pad), max(0, box[1] - pad), min(1536, box[2] + pad), min(1536, box[3] + pad)]
W, H = round((box[2] - box[0]) * K), round((box[3] - box[1]) * K)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
rows = []
for i, im in enumerate(ims, 1):
    c = im.crop(tuple(box))
    a = np.asarray(c, dtype=np.float32) / 255
    pm = np.dstack([a[..., :3] * a[..., 3:4], a[..., 3:4]])
    r = Image.fromarray((pm * 255 + 0.5).astype(np.uint8), 'RGBA').resize((W, H), Image.LANCZOS)
    b = np.asarray(r, dtype=np.float32) / 255; al = b[..., 3:4]
    rgb = np.where(al > 0, b[..., :3] / np.maximum(al, 1e-6), 0)
    out = Image.fromarray((np.dstack([np.clip(rgb, 0, 1), al]) * 255 + 0.5).astype(np.uint8), 'RGBA')
    q = os.path.join(OUT, f'rd_{i:02d}.webp'); out.save(q, 'WEBP', quality=90, alpha_quality=100, method=6)
    A = np.asarray(out)[..., 3]; ys, xs = np.nonzero(A >= 128)
    rows.append({'src': f'root_drain_{i:02d}.png', 'src_sha256': sha(os.path.join(SRC, f'root_drain_{i:02d}.png')), 'dst': f'rd_{i:02d}.webp', 'dst_sha256': sha(q),
                 'size': [W, H], 'alpha128': round(float((A >= 128).mean()), 5), 'bbox': [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())],
                 'cx': round(float(xs.mean()) / W, 4), 'bottom': round(float(ys.max() + 1) / H, 4)})
    print(rows[-1]['dst'], W, H, os.path.getsize(q))
json.dump({'crop': [int(v) for v in box], 'scale': K, 'frames': rows}, open(os.path.join(OUT, 'derive.json'), 'w'), ensure_ascii=False, indent=1)
