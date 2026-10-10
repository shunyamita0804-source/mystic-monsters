"""P ハブの仮背景（QA 用の構図参考）に描かれた円の中心を測る（2026-10-10・独立プレビュー用）。

使い方：python3 -I prototype/p_hub_1010/tools/measure_qa_circles.py prototype/p_hub_1010/assets/p_hub_qa_structure.png
出力：青い円（QA 用の例示）の中心と P の金の円の中心（画像の画素）。scene_registry.json の xy.p_hub_qa_structure はこの値。
完成背景には使えない（完成背景は石畳の上で測り直す）。
"""
import sys
from PIL import Image


def main(path):
    im = Image.open(path).convert('RGB')
    w, h = im.size
    px = im.load()
    blue = []
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if b > 150 and r < 90 and g < 160 and b - r > 80:
                blue.append((x, y))
    clusters = []
    for x, y in blue:
        for c in clusters:
            if abs(c[0] / c[2] - x) < 25 and abs(c[1] / c[2] - y) < 25:
                c[0] += x; c[1] += y; c[2] += 1
                break
        else:
            clusters.append([x, y, 1])
    for c in sorted(clusters, key=lambda c: c[1] / c[2]):
        if c[2] > 30:
            print('blue', round(c[0] / c[2]), round(c[1] / c[2]))
    gold = [(x, y) for y in range(650, 830) for x in range(420, 600)
            if px[x, y][0] > 170 and 110 < px[x, y][1] < 160 and px[x, y][2] < 90]
    print('P', round(sum(a for a, _ in gold) / len(gold)), round(sum(b for _, b in gold) / len(gold)))


if __name__ == '__main__':
    main(sys.argv[1])
