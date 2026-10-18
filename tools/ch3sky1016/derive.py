# 2026-10-16 QA（D）：Chapter 3 天空の先行素材 18点の受領検査と表示用の派生（試作・Chapter 3 のボードは未設計＝配置しない）
#   python3 -I tools/ch3sky1016/derive.py <原本 PNG のフォルダ> <出力フォルダ>
#   検査：点数・名前・寸法（制作指示の18項目）・RGBA・外周に画素が触れていないか・余白の割合・不透明／半透明の割合・同じ画像の重複・sha256
#   派生：WebP（品質90・アルファ100）。寸法は原本のまま（縮小しない）。外周までの余白が 12px 未満の辺だけ、12px まで透明の余白を足す（縮小・補間で端が切れない・絵は変えない＝原本は不変）
import sys, os, json, hashlib
from PIL import Image
SRC, OUT = sys.argv[1], sys.argv[2]
SPEC = {   # 制作指示の18項目（名前・寸法・区分）
 'C3_UI_sky_medallion.png': ((1024, 1024), 'UI'), 'C3_UI_sky_nameplate.png': ((1536, 512), 'UI'),
 'C3_ARCH_ruined_colonnade.png': ((768, 768), 'ARCH'), 'C3_ARCH_sky_pavilion.png': ((768, 768), 'ARCH'), 'C3_ARCH_white_bridge_arch_pier.png': ((512, 768), 'ARCH'),
 'C3_ARCH_white_column_single.png': ((384, 768), 'ARCH'), 'C3_ARCH_white_railing_segment.png': ((1024, 256), 'ARCH'),
 'C3_ENV_cloud_bank_mid.png': ((1024, 512), 'ENV'), 'C3_ENV_cloud_puff_small.png': ((512, 512), 'ENV'), 'C3_ENV_cloud_wisp_front.png': ((1024, 512), 'ENV'),
 'C3_ENV_crystal_cluster_blue.png': ((512, 512), 'ENV'), 'C3_ENV_floating_island_medium.png': ((768, 768), 'ENV'), 'C3_ENV_floating_island_small_green.png': ((512, 512), 'ENV'),
 'C3_ENV_floating_island_small_rock.png': ((512, 512), 'ENV'), 'C3_ENV_island_cliff_edge_piece.png': ((1024, 512), 'ENV'), 'C3_ENV_sky_flowering_tree.png': ((512, 768), 'ENV'),
 'C3_ENV_white_flower_patch.png': ((384, 384), 'ENV'), 'C3_FX_sky_waterfall_column.png': ((512, 1024), 'FX'),
}
PAD_MIN_PX = 12
os.makedirs(OUT, exist_ok=True)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
files = sorted(f for f in os.listdir(SRC) if f.lower().endswith('.png'))
rep = {'count': len(files), 'missing': sorted(set(SPEC) - set(files)), 'extra': sorted(set(files) - set(SPEC)), 'items': []}
pix = {}
for f in files:
    p = os.path.join(SRC, f); im = Image.open(p); im.load()
    w, h = im.size; a = im.split()[-1] if im.mode == 'RGBA' else None
    bb = a.getbbox() if a else (0, 0, w, h)
    hist = a.histogram() if a else [0] * 256
    tot = w * h
    pad = {'l': bb[0] / w, 't': bb[1] / h, 'r': (w - bb[2]) / w, 'b': (h - bb[3]) / h}
    edge = bool(a) and any(a.getpixel((x, 0)) or a.getpixel((x, h - 1)) for x in range(w)) or bool(a) and any(a.getpixel((0, y)) or a.getpixel((w - 1, y)) for y in range(h))
    ph = hashlib.sha256(im.tobytes()).hexdigest(); dup = pix.get(ph); pix[ph] = f
    spec = SPEC.get(f)
    it = {'file': f, 'size': [w, h], 'mode': im.mode, 'spec_ok': bool(spec and spec[0] == (w, h)), 'kind': spec[1] if spec else '?', 'sha256': sha(p), 'bytes': os.path.getsize(p),
          'bbox': bb, 'pad': {k: round(v, 3) for k, v in pad.items()}, 'edge_touch': edge, 'alpha0': round(hist[0] / tot, 3), 'alpha255': round(hist[255] / tot, 3),
          'semi': round(sum(hist[1:255]) / tot, 3), 'dup_of': dup}
    # 派生：外周までの余白が 12px 未満の辺だけ透明の余白を足す
    gap = {'l': bb[0], 't': bb[1], 'r': w - bb[2], 'b': h - bb[3]}
    L, T, R, B = (max(0, PAD_MIN_PX - gap[k]) for k in 'ltrb')
    if any((L, T, R, B)):
        c = Image.new('RGBA', (w + L + R, h + T + B), (0, 0, 0, 0)); c.paste(im, (L, T)); im2 = c; it['padded'] = [L, T, R, B]
    else: im2 = im
    q = os.path.join(OUT, f[:-4] + '.webp'); im2.save(q, 'WEBP', quality=90, alpha_quality=100, method=6)
    it.update({'derived': os.path.basename(q), 'derived_size': list(im2.size), 'derived_bytes': os.path.getsize(q), 'derived_sha256': sha(q)})
    rep['items'].append(it)
rep['total_png_bytes'] = sum(i['bytes'] for i in rep['items']); rep['total_webp_bytes'] = sum(i['derived_bytes'] for i in rep['items'])
json.dump(rep, open(os.path.join(OUT, 'derive.json'), 'w'), ensure_ascii=False, indent=1)
print(json.dumps({k: rep[k] for k in ('count', 'missing', 'extra', 'total_png_bytes', 'total_webp_bytes')}, ensure_ascii=False))
for i in rep['items']: print(i['file'], i['size'], i['mode'], 'spec' if i['spec_ok'] else 'SPEC-NG', 'edge' if i['edge_touch'] else '', i['pad'], 'semi', i['semi'], 'dup' if i['dup_of'] else '', i.get('padded', ''), i['derived_bytes'])
