# 2026-10-16：ガウル SK19「聖なる炎」承認演出 V2 の表示用の派生（ZIP Mismon_Claude_SK19_Only_TestHandoff_20261016 の 01_承認演出V2_PNG）。
#  原本は加工しない・リポジトリに置かない（sha256 は README.md）。縮小と WebP への変換だけ（色・形は変えない・描き直さない）。
#  飛行2枚は参照待機（cutout）と同じ 1254 のキャンバス＝位置合わせを保つため、切り詰めずに全体を同じ倍率で縮める。
#  使い方：python3 -I tools/sk19v2/derive.py <01_承認演出V2_PNG のフォルダ>
import sys, os, hashlib, json
import numpy as np
from PIL import Image
SRC = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, 'assets', 'battle', 'gauru_sk19_v2_1016')
os.makedirs(OUT, exist_ok=True)
JOBS = [
    ('Gauru_flight_wings_up_preview.png', 'fly_up.webp', 640),
    ('Gauru_flight_wings_down_preview.png', 'fly_down.webp', 640),
    ('B_01_gauru_holyflame_self_ignite.png', 'flame_01_ignite.webp', 768),
    ('B_02_gauru_holyflame_self_expand.png', 'flame_02_expand.webp', 768),
    ('B_03_gauru_holyflame_self_radiate.png', 'flame_03_radiate.webp', 768),
    ('B_04_gauru_holyflame_self_peak.png', 'flame_04_peak.webp', 768),
]
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
rows = []
for src, dst, size in JOBS:
    p = os.path.join(SRC, src)
    im = Image.open(p).convert('RGBA')
    # 乗算済みアルファで縮める（透明な画素の色が縁ににじまない）
    a = np.asarray(im, dtype=np.float32) / 255
    pm = np.dstack([a[..., :3] * a[..., 3:4], a[..., 3:4]])
    r = Image.fromarray((pm * 255 + 0.5).astype(np.uint8), 'RGBA').resize((size, size), Image.LANCZOS)
    b = np.asarray(r, dtype=np.float32) / 255
    al = b[..., 3:4]
    rgb = np.where(al > 0, b[..., :3] / np.maximum(al, 1e-6), 0)
    out = Image.fromarray((np.dstack([np.clip(rgb, 0, 1), al]) * 255 + 0.5).astype(np.uint8), 'RGBA')
    q = os.path.join(OUT, dst)
    out.save(q, 'WEBP', quality=90, alpha_quality=100, method=6)
    frac = float((np.asarray(out)[..., 3] >= 128).mean())
    rows.append({'src': src, 'src_size': list(im.size), 'src_sha256': sha(p), 'dst': dst, 'dst_size': [size, size], 'dst_sha256': sha(q), 'alpha128': round(frac, 5)})
    print(dst, size, os.path.getsize(q), round(frac, 5))
ref = os.path.join(SRC, 'Gauru_official_art_transparent_preview_cutout.png')
rows.append({'src': os.path.basename(ref), 'src_size': [1254, 1254], 'src_sha256': sha(ref), 'dst': None, 'note': '位置合わせの参照だけ（ゲームでは正式の待機絵 assets/battle/idle/idle_gauru.webp を使う）',
             'alpha128': round(float((np.asarray(Image.open(ref))[..., 3] >= 128).mean()), 5)})
json.dump(rows, open(os.path.join(OUT, 'derive.json'), 'w'), ensure_ascii=False, indent=1)
