#!/usr/bin/env python3
"""2026-10-15 N11・N12：フルーネの正式画像2点と大会対戦表アイコン6枚の表示用の派生を作る。

使い方（原本はリポジトリに置かない＝ZIP を展開した場所を渡す）：
  python3 -I tools/next1015/derive.py <ZIP を展開したフォルダ> <リポジトリの直下>

- 原本は読むだけ（上書き・加工しない）。sha256 を照合してから作る。
- フルーネ（RGBA）：アルファが 1 以上の画素の外接矩形で余白だけを切る（本体・根・葉・花は1画素も切らない）→
  立ち絵＝長辺 720px（assets/monsters/2p5d/ と同じ）・バトル待機＝高さ 720px（assets/battle/idle/ と同じ）の透過 WebP。
- 対戦表アイコン（RGB・薄い灰色の背景）：背景は消さない・描き直さない。正方形のまま 256×256 へ縮小した WebP（品質 90）。
"""
import hashlib, os, sys
from PIL import Image

SHA = {
    'flurene_official_2p5d_standing.png': 'ec08627d77135ddfa11c2f03277a95194b06cc51de62a5f73ba30a4362784411',
    'flurene_battle_idle.png': 'd5a237c1410511b18a0ad869bc36f8ef07fe79b1b8537d9eea15d103f962798f',
    '01_Soramo_TournamentIcon.png': 'cc8b25e4c2b4b940e4f333db97696fc52f57a2fe5f079293abc17fc54750955d',
    '02_Gauru_TournamentIcon.png': 'c0cafb34b77b5117fde9681caf3779d8c4c96b89883c3a8fc9300dbe206d3c62',
    '03_Nobiton_TournamentIcon.png': '18e19d740a5297038fa782de99b4fd0ad9287871467bb4dee6db03401a1978ac',
    '04_Gioru_TournamentIcon.png': '492bdd87d5a9bf6dfcff8c9b12f5ceb5ee5ef1feb5e3de0ac6448aa2d3cdfc57',
    '05_Regnas_TournamentIcon.png': '95d466b6ff85493f39435e0cece9b7b18f66ddbec1fd3d735d5ea1d0e1206048',
    '06_Flurene_TournamentIcon.png': '1e568abe37d4b1b654d40b8187259320beb86c2266015545a93024f32a45b0d1',
}
ICONS = [('01_Soramo_TournamentIcon.png', 'solamo'), ('02_Gauru_TournamentIcon.png', 'gauru'), ('03_Nobiton_TournamentIcon.png', 'nobiton'),
         ('04_Gioru_TournamentIcon.png', 'jiol'), ('05_Regnas_TournamentIcon.png', 'regnas'), ('06_Flurene_TournamentIcon.png', 'flurene')]


def find(src, name):
    for d, _, fs in os.walk(src):
        if name in fs:
            return os.path.join(d, name)
    raise SystemExit('見つからない：' + name)


def check(p, name):
    h = hashlib.sha256(open(p, 'rb').read()).hexdigest()
    if h != SHA[name]:
        raise SystemExit(f'sha256 が違う：{name} {h}')


def trim_alpha(im):
    a = im.getchannel('A')
    box = a.point(lambda v: 255 if v >= 1 else 0).getbbox()
    return im.crop(box), box


def resize(im, w, h):
    # 乗算済みアルファで縮小（透明な縁の色が混ざらない）
    pm = im.convert('RGBa').resize((w, h), Image.LANCZOS)
    return pm.convert('RGBA')


def main(src, repo):
    out = []
    p = find(src, 'flurene_official_2p5d_standing.png'); check(p, 'flurene_official_2p5d_standing.png')
    im = Image.open(p); assert im.mode == 'RGBA' and im.size == (1254, 1254)
    t, box = trim_alpha(im); s = 720 / max(t.size); w, h = round(t.width * s), round(t.height * s)
    d = resize(t, w, h); f = os.path.join(repo, 'assets/monsters/2p5d/flurene.webp'); d.save(f, 'WEBP', quality=92, method=6, exact=True)
    out.append(('flurene.webp', box, (w, h)))
    p = find(src, 'flurene_battle_idle.png'); check(p, 'flurene_battle_idle.png')
    im = Image.open(p); assert im.mode == 'RGBA' and im.size == (1254, 1254)
    t, box = trim_alpha(im); s = 720 / t.height; w, h = round(t.width * s), 720
    d = resize(t, w, h); f = os.path.join(repo, 'assets/battle/idle/idle_flurene.webp'); d.save(f, 'WEBP', quality=90, method=6, exact=True)
    out.append(('idle_flurene.webp', box, (w, h)))
    od = os.path.join(repo, 'assets/tournament/icons_1015'); os.makedirs(od, exist_ok=True)
    for name, key in ICONS:
        p = find(src, name); check(p, name)
        im = Image.open(p); assert im.mode == 'RGB' and im.size == (1254, 1254)
        d = im.resize((256, 256), Image.LANCZOS); d.save(os.path.join(od, f'icon_{key}.webp'), 'WEBP', quality=90, method=6)
        out.append((f'icon_{key}.webp', None, (256, 256)))
    for o in out:
        print(*o)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
