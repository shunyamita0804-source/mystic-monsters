"""盤の道の地点の並べ方（2026-10-20 通し試遊の品質改善・Chapter 2／4 の道路グラフの生成で共通）。
fillet＝経由点の角を円弧で丸める・resample_clear＝広場の中心から隣の地点を離して等間隔に並べる・plaza_ends＝円の広場になる地点。
歩数・つながりは変えない（地点の座標だけ）。"""
import math
# 2026-10-20 通し試遊の品質改善（IMG_5998・6001「曲がり角で道が途切れる・細い線が並ぶ」）：経由点の角を半径 FILLET の円弧で丸めてから地点を並べる
#  （折れ線の角に地点を置くと、道の帯が角で裂けて扇形の細い線になっていた）。円弧の長さは隣の辺の 45% まで（短い辺では小さい半径）
FILLET = 26.0
def fillet(line, R=FILLET):
    if len(line) < 3: return list(line)
    out = [line[0]]
    for i in range(1, len(line) - 1):
        a, b, c = line[i - 1], line[i], line[i + 1]
        u = (a[0] - b[0], a[1] - b[1]); v = (c[0] - b[0], c[1] - b[1]); lu, lv = math.hypot(*u), math.hypot(*v)
        if lu < 1e-6 or lv < 1e-6: continue
        cosA = max(-1.0, min(1.0, (u[0] * v[0] + u[1] * v[1]) / (lu * lv))); A = math.acos(cosA)   # 角の内角（π＝まっすぐ）
        if math.pi - A < math.radians(4): out.append(b); continue
        t = min(R / math.tan(A / 2), 0.45 * lu, 0.45 * lv); r = t * math.tan(A / 2)
        p0 = (b[0] + u[0] / lu * t, b[1] + u[1] / lu * t); p1 = (b[0] + v[0] / lv * t, b[1] + v[1] / lv * t)
        bis = (u[0] / lu + v[0] / lv, u[1] / lu + v[1] / lv); lb = math.hypot(*bis); dc = r / math.sin(A / 2)
        cx, cy = b[0] + bis[0] / lb * dc, b[1] + bis[1] / lb * dc
        a0, a1 = math.atan2(p0[1] - cy, p0[0] - cx), math.atan2(p1[1] - cy, p1[0] - cx)
        d = (a1 - a0 + math.pi) % (2 * math.pi) - math.pi
        k = max(2, math.ceil(abs(d) * r / 3))
        out += [(cx + r * math.cos(a0 + d * j / k), cy + r * math.sin(a0 + d * j / k)) for j in range(k + 1)]
    out.append(line[-1]); return out
# 2026-10-20（IMG_5997・5999・6004「円形の広場にマスが並ぶ」）：分かれ目・合流・START・行き止まりの円の広場の中心から、隣の地点を CLEAR 単位以上離す
#  （広場には中心の1マスだけ。隣のマスは道の上）。道の中の間隔は MIN_GAP 以上を保つ（足りなければ離す距離を縮める）。歩数・つながりは変えない。
#  離す距離（CLEAR）は章ごと（広場の大きさが違う）
MIN_GAP = 17.0
def resample_clear(p, n, c0, c1):
    cum = [0.0]
    for i in range(len(p) - 1): cum.append(cum[-1] + math.dist(p[i], p[i + 1]))
    L = cum[-1]
    ts = [L * k / n for k in range(n + 1)]
    if n >= 3 and (c0 or c1):
        for _ in range(40):
            t1, tn = max(ts[1], c0), min(ts[n - 1], L - c1)
            if (tn - t1) / (n - 2) >= MIN_GAP or (c0 <= L / n and c1 <= L / n): break
            c0, c1 = c0 * 0.94, c1 * 0.94
        t1, tn = max(L / n, c0), min(L * (n - 1) / n, L - c1)
        if tn - t1 >= (n - 2) * MIN_GAP: ts = [0.0] + [t1 + (tn - t1) * (k - 1) / (n - 2) for k in range(1, n)] + [L]
    out, seg = [], 0
    for t in ts:
        while seg < len(p) - 2 and cum[seg + 1] < t: seg += 1
        u = (t - cum[seg]) / max(1e-9, cum[seg + 1] - cum[seg])
        out.append((p[seg][0] + (p[seg + 1][0] - p[seg][0]) * u, p[seg][1] + (p[seg + 1][1] - p[seg][1]) * u))
    out[0], out[-1] = p[0], p[-1]; return out
def plaza_ends(spec):
    deg = {}
    for s in spec['segs'].values():
        for k in (s[0], s[1]): deg[k] = deg.get(k, 0) + 1
    anc = spec['anchors']
    return {k for k, d in deg.items() if d >= 3 or (k in anc and (anc[k][2] in ('start',) or 'dead_end' in anc[k][2]))}


def layout_points(lines, ns, ends_of, clear, min_d=13.0):
    """区間ごとの地点の座標（角を丸め・広場から離す）。別の区間の地点どうしが min_d 未満に近づいた区間は、従来の並べ方（等間隔・丸めない）に戻す。
    lines＝{区間: 折れ線}・ns＝{区間: 歩数}・ends_of＝{区間: (始点を離すか, 終点を離すか)}"""
    plain = set()
    for _ in range(8):
        P = {sid: (resample_clear(lines[sid], ns[sid], 0, 0) if sid in plain else resample_clear(fillet(lines[sid]), ns[sid], clear if e0 else 0, clear if e1 else 0)) for sid, (e0, e1) in ends_of.items()}
        items = [(sid, p) for sid, pts in P.items() for p in pts[1:-1]]
        bad = set()
        for a in range(len(items)):
            sa, pa = items[a]
            for b in range(a + 1, len(items)):
                sb, pb = items[b]
                if sa != sb and abs(pa[0] - pb[0]) < min_d and abs(pa[1] - pb[1]) < min_d and math.dist(pa, pb) < min_d: bad.add(sa); bad.add(sb)
        if not (bad - plain): return P, plain
        plain |= bad
    return P, plain
