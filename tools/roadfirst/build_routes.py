#!/usr/bin/env python3
"""Chapter 1 の B／C 独立ルート（2026-10-14）のデータ js/proto/roadfirst-routes.js（MMRF_ROUTES）を作る。
正本：tools/roadfirst/routes/spec_B.json・spec_C.json（端の地点の座標 anchors・区間 segs＝{区間: [始点, 終点, 歩数, 経由点]}・
      景観の区域 terrain・岩峰 peaks・目印 landmarks・名前 name・景観 visual）。
作り方：A（js/proto/roadfirst-data.js＝MMRF_DATA）と同じ 42区間の部品（長さ・種類・通行条件・寄り道の戻り）をそのまま使い、つなぎ方と形だけ変える。
  途中の地点は道筋（始点 → 経由点 → 終点）に沿って等間隔に置き、ID は A と同じ規則 {区間}_{番号2桁}。種類・条件・役割は A の同じ区間・地点からコピー。
  区間・地点の並びは A と同じ順（配置の乱数を使う順をそろえる）。A のデータは読むだけで変えない。
検査：299地点・370接続・42区間、A と部品が同じ、全地点が GOAL へ行ける、ライバルと H を必ず通る、ライバルの比率 50〜70%、
      地点の間隔 15〜28 単位、世界の範囲の内側、岩峰が道から離れている。
実行：python3 -I tools/roadfirst/build_routes.py（リポジトリ直下から）。手で js/proto/roadfirst-routes.js を書き換えない。"""
import json, math
from collections import deque
from pathlib import Path
R = Path(__file__).resolve().parents[2]
src = (R / 'js/proto/roadfirst-data.js').read_text(encoding='utf-8')
A = json.loads(src[src.index('const D = ') + 10: src.index(';\n  if (typeof module')])
ORDER = list(A['segments'])
KIND = {k: v[2] for k, v in A['segments'].items()}
COND = {e[2]: e[4] for e in A['edges'] if e[3] == 'forward'}
SPUR = {k for k, v in A['segments'].items() if v[2] in ('reward_spur', 'optional_random_spur')}
CONN = {'S01', 'C01', 'C02', 'C03', 'C04', 'C05', 'S_END'}
ROLE = {k: v[2] for k, v in A['nodes'].items() if v[3] is None}

def plen(p): return sum(math.dist(p[i], p[i + 1]) for i in range(len(p) - 1))
def resample(p, n):
    cum = [0.0]
    for i in range(len(p) - 1): cum.append(cum[-1] + math.dist(p[i], p[i + 1]))
    L, out, seg = cum[-1], [p[0]], 0
    for k in range(1, n):
        t = L * k / n
        while cum[seg + 1] < t: seg += 1
        u = (t - cum[seg]) / max(1e-9, cum[seg + 1] - cum[seg])
        out.append((p[seg][0] + (p[seg + 1][0] - p[seg][0]) * u, p[seg][1] + (p[seg + 1][1] - p[seg][1]) * u))
    out.append(p[-1]); return out
def dist_line(line, x, y):
    m = 1e9
    for i in range(len(line) - 1):
        a, b = line[i], line[i + 1]; dx, dy = b[0] - a[0], b[1] - a[1]; L = dx * dx + dy * dy or 1
        t = max(0, min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L)); m = min(m, math.hypot(a[0] + dx * t - x, a[1] + dy * t - y))
    return m

def build(spec):
    anc, segs = spec['anchors'], spec['segs']
    assert set(segs) == set(ORDER), set(segs) ^ set(ORDER)
    assert set(anc) == set(ROLE), set(anc) ^ set(ROLE)
    nodes, segments, edges, pts = {}, {}, [], {}
    for sid in ORDER:
        a, b, n, via = segs[sid]
        if sid not in CONN:   # 部品は A と同じ（始点・終点・歩数）
            s = A['segments'][sid]; assert (a, b, n) == (s[0], s[1], len(s[3]) - 1), (sid, a, b, n)
        p = resample([tuple(anc[a])] + [tuple(v) for v in via] + [tuple(anc[b])], n); pts[sid] = p
        sp = plen([tuple(anc[a])] + [tuple(v) for v in via] + [tuple(anc[b])]) / n
        assert 15 <= sp <= 28, f'間隔 {sid} {sp:.1f}'
        ids = [a] + [f'{sid}_{i:02d}' for i in range(1, n)] + [b]
        for i, id_ in enumerate(ids):
            if id_ in nodes: continue
            anchor = id_ in anc
            nodes[id_] = [round(p[i][0], 2), round(p[i][1], 2), ROLE[id_] if anchor else 'ordinary_tile', None if anchor else sid]
        segments[sid] = [a, b, KIND[sid], ids]
        cond = COND[sid]
        for i in range(n): edges.append([ids[i], ids[i + 1], sid, 'forward', cond])
        if sid in SPUR:
            for i in range(n, 0, -1): edges.append([ids[i], ids[i - 1], sid, 'reverse', cond])
    for k, v in anc.items(): nodes[k][0], nodes[k][1] = round(v[0], 2), round(v[1], 2)
    D = {k: A[k] for k in ('version', 'size', 'fixed_rules', 'draft_rules', 'branch_permissions', 'random_gate')}
    D.update(source=f'tools/roadfirst/routes/spec_{spec["key"]}.json（A の 42区間の部品をつなぎ直した独立ルート）', route=spec['key'], name=spec['name'], visual=spec['visual'],
             nodes=nodes, segments=segments, edges=edges, art={'terrain': spec['terrain'], 'peaks': spec['peaks'], 'landmarks': spec['landmarks']})
    check(D, pts)
    return D

def reach(D, start, block=None):
    fwd = {}
    for e in D['edges']: fwd.setdefault(e[0], []).append(e[1])
    seen, q = {start}, deque([start])
    while q:
        x = q.popleft()
        for y in fwd.get(x, []):
            if y not in seen and y != block: seen.add(y); q.append(y)
    return seen

def main_routes(D):
    S, L = D['segments'], {k: len(v[3]) - 1 for k, v in D['segments'].items()}
    nxt = {}
    for k, v in S.items():
        if v[2] not in ('reward_spur', 'optional_random_spur'): nxt.setdefault(v[0], []).append(k)
    out = []
    def walk(node, path):
        if node == 'GOAL': out.append(path); return
        for k in nxt.get(node, []): walk(S[k][1], path + [k])
    walk('START', [])
    return [(sum(L[k] for k in p), next(sum(L[k] for k in p[:i + 1]) for i, k in enumerate(p) if S[k][1] == 'RIVAL'),
             next(sum(L[k] for k in p[:i + 1]) for i, k in enumerate(p) if S[k][1] == 'H')) for p in out]

def check(D, pts):
    N = D['nodes']
    assert len(N) == 299 and len(D['edges']) == 370 and len(D['segments']) == 42, (len(N), len(D['edges']), len(D['segments']))
    roles = sorted(v[2] for v in N.values()); assert roles == sorted(v[2] for v in A['nodes'].values())
    ae = sorted((e[2], e[3], e[4]) for e in A['edges'] if e[2] not in CONN); be = sorted((e[2], e[3], e[4]) for e in D['edges'] if e[2] not in CONN); assert ae == be
    assert reach(D, 'START') == set(N), 'START から行けない地点'
    for k in N: assert 'GOAL' in reach(D, k), f'{k} から GOAL へ行けない'
    assert 'GOAL' not in reach(D, 'START', 'RIVAL') and 'GOAL' not in reach(D, 'START', 'H'), 'ライバル／H を通らずに GOAL'
    for tot, rv, h in main_routes(D): assert 0.5 <= rv / tot <= 0.7, (tot, rv)
    for k, v in N.items(): assert 30 <= v[0] <= 994 and 50 <= v[1] <= 1510, (k, v)
    lines = list(pts.values())
    for x, y, w in D['art']['peaks']: assert min(dist_line(l, x, y) for l in lines) > 40 + w / 2, ('岩峰が道に近い', x, y)

out = {r: build(json.loads((R / f'tools/roadfirst/routes/spec_{r}.json').read_text(encoding='utf-8'))) for r in ('B', 'C')}
js = ('// Chapter 1 の B／C 独立ルート（2026-10-14）。tools/roadfirst/build_routes.py が tools/roadfirst/routes/spec_B.json・spec_C.json から作る。手で書き換えない。\n'
      '// 形式は MMRF_DATA（js/proto/roadfirst-data.js＝A）と同じ＋route・name・visual・art（景観の区域・岩峰・目印）。A のデータは変えていない。\n'
      '(function (root) { const R = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n'
      "  if (typeof module === 'object' && module.exports) module.exports = R; else root.MMRF_ROUTES = R; })(typeof window !== 'undefined' ? window : globalThis);\n")
(R / 'js/proto/roadfirst-routes.js').write_text(js, encoding='utf-8')
for r, D in out.items():
    rs = sorted(set(main_routes(D)))
    print(r, 'nodes', len(D['nodes']), 'edges', len(D['edges']), 'segments', len(D['segments']), '本線（総歩数, ライバル, H）', rs)
print('bytes', len(js.encode()))
