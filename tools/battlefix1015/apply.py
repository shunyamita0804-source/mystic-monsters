# 2026-10-15 夜の一括依頼（技アニメ21件・D）：技アニメの派生 WebP の修正をまとめて行う（何度実行しても同じ結果＝元は git の 2026-10-15 時点の内容）。
#  1. 市松の取り残し：体のコマ＝成分を消す（手足の間の穴）／効果のコマ＝明るさの差だけを均す（白い光はそのまま）
#  2. ノビトンのひとやすみ 33_02・33_03＝輪郭の「松葉模様」（光の縁＋市松）を均してなめらかな光の縁に
#  3. ソラモのスターフォール 09_04〜09_06＝絵の端で切れている光を、端へ向けて少しずつ透明に（四角く切れて見えない）
#  4. レグナスの竜眼ロック 22_03・22_04＝照準の緑（背景抜きの緑が残った色）を、同じ技の照準の水色へ置き換える
#  使い方：python3 -I tools/battlefix1015/apply.py [--check]（--check＝変更せずに対象と sha256 を表示）
import sys, os, json, hashlib, subprocess
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
B = os.path.join(ROOT, 'assets', 'battle')
CHK = os.path.join(ROOT, 'tools', 'battlefix1015', 'checker.py')
# 体のコマ（成分を消す）・効果のコマ（均す）。tools/battlefix1015/checker.py scan の結果から、体は 0.45 以上・効果は 0.36 以上を目で確かめて選んだ
BODY = ['nobiton_moves_1012/31_02', 'nobiton_moves_1012/35_03', 'nobiton_moves_1012/35_04', 'nobiton_moves_1012/37_02', 'nobiton_moves_1012/37_03', 'nobiton_moves_1012/37_04',
        'jiol_moves_1012/j02_04', 'jiol_moves_1012/j03_02', 'jiol_moves_1012/j03_03', 'jiol_moves_1012/j03_04', 'jiol_moves_1012/j04_01', 'jiol_moves_1012/j04_03', 'jiol_moves_1012/j04_04',
        'jiol_moves_1012/j05_02', 'jiol_moves_1012/j05_04', 'jiol_moves_1012/j06_02', 'jiol_moves_1012/j06_03', 'jiol_moves_1012/j06_04']
FX = ['nobiton_moves_1012/31_03_fx1', 'nobiton_moves_1012/34_05_fx1', 'nobiton_moves_1012/35_05_fx1', 'nobiton_moves_1012/37_05_fx1', 'nobiton_moves_1012/38_02_fx1', 'nobiton_moves_1012/38_03_fx1',
      'nobiton_moves_1012/39_03_fx1', 'jiol_moves_1012/j01_03_fx', 'jiol_moves_1012/j02_03_fx', 'jiol_moves_1012/j03_01_fx', 'jiol_moves_1012/j03_02_fx', 'jiol_moves_1012/j03_03_fx',
      'jiol_moves_1012/j03_04_fx', 'jiol_moves_1012/j04_01_fx', 'jiol_moves_1012/j04_02_fx', 'jiol_moves_1012/j05_03_fx', 'jiol_moves_1012/j05_04_fx']
HALO = ['nobiton_moves_1012/33_02', 'nobiton_moves_1012/33_03']
EDGE = ['soramo_moves_1012/09_04', 'soramo_moves_1012/09_05', 'soramo_moves_1012/09_06']
GREEN = ['regnas_moves_1012/22_03', 'regnas_moves_1012/22_04']

def sha(p): return hashlib.sha256(open(p, 'rb').read()).hexdigest()
def orig(rel):
    """git の基準（2026-10-15 夜の作業の前＝コミット bf310c4）の内容を一時ファイルへ＝何度実行しても同じ"""
    out = os.path.join('/tmp', 'bf1015_' + rel.replace('/', '_') + '.webp')
    data = subprocess.check_output(['git', '-C', ROOT, 'show', 'bf310c4:assets/battle/' + rel + '.webp'])
    open(out, 'wb').write(data); return out

def feather(src, dst, frac=0.07):
    a = np.array(Image.open(src).convert('RGBA')).astype(np.float32); h, w = a.shape[:2]
    m = max(8, int(min(h, w) * frac))
    yy = np.minimum(np.arange(h), np.arange(h)[::-1])[:, None]; xx = np.minimum(np.arange(w), np.arange(w)[::-1])[None, :]
    k = np.clip(np.minimum(yy, xx) / m, 0, 1); k = k * k * (3 - 2 * k)   # なめらかに 0 → 1
    a[:, :, 3] *= k
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(dst, 'WEBP', lossless=True, quality=100, method=6)

def green(src, dst):
    a = np.array(Image.open(src).convert('RGBA')).astype(np.float32)
    r, g, b, al = a[:, :, 0], a[:, :, 1], a[:, :, 2], a[:, :, 3]
    m = (g > 120) & (g > r * 1.35) & (g > b * 1.35) & (al > 8)   # 緑が強い画素（体の青・白・水色は当たらない）
    lum = (0.3 * r + 0.59 * g + 0.11 * b)[m]
    t = np.array([79, 224, 255], np.float32) / 255.0   # 照準の水色（22_04 の輪と同じ）
    sc = np.clip(lum / 200.0, 0.35, 1.15)
    for c in range(3): a[:, :, c][m] = np.clip(t[c] * 255 * sc, 0, 255)
    a[:, :, 3][m] *= 0.75   # 塗りつぶしの円を少し透かす
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(dst, 'WEBP', lossless=True, quality=100, method=6)
    return int(m.sum())

def run(check=False):
    rows = []
    def go(rel, how, fn):
        dst = os.path.join(B, rel + '.webp'); src = orig(rel); before = sha(src)
        if not check: fn(src, dst)
        rows.append({'file': 'assets/battle/' + rel + '.webp', 'how': how, 'before': before, 'after': sha(dst) if not check else None})
    py = [sys.executable, '-I', CHK]
    for rel in BODY: go(rel, '市松の穴を消す', lambda s, d: subprocess.check_call(py + ['fix', s, d], stdout=subprocess.DEVNULL))
    for rel in FX: go(rel, '市松を均す（効果）', lambda s, d: subprocess.check_call(py + ['--smooth=8', '--smoothall=1', 'fix', s, d], stdout=subprocess.DEVNULL))
    for rel in HALO: go(rel, '輪郭の松葉模様を均す', lambda s, d: subprocess.check_call(py + ['--tol=40', '--lmin=175', '--smooth=10', '--smoothall=1', 'fix', s, d], stdout=subprocess.DEVNULL))
    for rel in EDGE: go(rel, '端を透明へぼかす', feather)
    for rel in GREEN: go(rel, '照準の緑を水色へ', green)
    return rows

if __name__ == '__main__':
    rows = run('--check' in sys.argv)
    json.dump(rows, open(os.path.join(ROOT, 'tools', 'battlefix1015', 'applied.json'), 'w'), ensure_ascii=False, indent=1)
    print(len(rows), 'files')
