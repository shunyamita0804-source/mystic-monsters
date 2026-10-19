#!/usr/bin/env python3
"""Chapter 4 の寄り道の長さの調整（2026-10-18・設計の調整用の道具）。
  python3 -I tools/ch4/autotune.py <入力の spec フォルダ> <出力の spec フォルダ> <目標表 JSON>
  目標表＝{ "A": { "D_LA": 12, ... }, ... }（寄り道ごとの目標の歩数）。
  各寄り道について、始点（親の地点）→ 終点（報酬の建物）をつづら折り（進む向きに直角のジグザグ）にした候補を
  歩数（目標 → 1 ずつ減らす）× 向き（左右）× 曲がりの数（1〜5）で作り、build_ch4_routes.py の検査（間隔・距離・交差・溶岩・役割・到達性）を
  通った最初の候補を採る。終点・始点・本線は動かさない。どの候補も通らなければ元のまま（結果の表に記録）。"""
import json, math, sys, importlib.util
from pathlib import Path
HERE = Path(__file__).resolve().parent
spec_ = importlib.util.spec_from_file_location('b4', HERE / 'build_ch4_routes.py'); B = importlib.util.module_from_spec(spec_); spec_.loader.exec_module(B)
src, dst, table = Path(sys.argv[1]), Path(sys.argv[2]), json.loads(Path(sys.argv[3]).read_text(encoding='utf-8'))
dst.mkdir(parents=True, exist_ok=True)
SP = 19.0
def zig(a, b, n_steps, side, bends):
    L0 = math.dist(a, b); want = n_steps * SP
    ux, uy = (b[0] - a[0]) / L0, (b[1] - a[1]) / L0; px, py = -uy * side, ux * side
    def pts_of(h): return [a] + [(a[0] + ux * L0 * (i + 1) / (bends + 1) + px * h * (1 if i % 2 == 0 else -1), a[1] + uy * L0 * (i + 1) / (bends + 1) + py * h * (1 if i % 2 == 0 else -1)) for i in range(bends)] + [b]
    def length(h): p = pts_of(h); return sum(math.dist(p[i], p[i + 1]) for i in range(len(p) - 1))
    if length(0) >= want: return None
    lo, hi = 0.0, 400.0
    for _ in range(50):
        mid = (lo + hi) / 2
        if length(mid) < want: lo = mid
        else: hi = mid
    return [[round(x, 1), round(y, 1)] for x, y in pts_of(hi)[1:-1]]
def ok(spec):
    try: B.build(spec); return True, ''
    except AssertionError as e: return False, str(e)[:160]
report = {}
for r in 'ABC':
    d = json.loads((src / f'spec_{r}.json').read_text(encoding='utf-8')); d.setdefault('key', r)
    good, why = ok(d); assert good, f'{r}：元の spec が検査を通らない {why}'
    rep = {}
    for sid, target in (table.get(r) or {}).items():
        s = d['segs'][sid]; a, b = d['anchors'][s[0]][:2], d['anchors'][s[1]][:2]
        before = len(B.build(d)[0]['segments'][sid][3]) - 1
        done = None
        for n in range(target, before, -1):
            for bends in (3, 2, 4, 1, 5):
                for side in (1, -1):
                    via = zig(a, b, n, side, bends)
                    if via is None: continue
                    trial = json.loads(json.dumps(d)); trial['segs'][sid] = [s[0], s[1], s[2], via, n]
                    g, _ = ok(trial)
                    if g: done = (n, side, bends, via); break
                if done: break
            if done: break
        if done: d['segs'][sid] = [s[0], s[1], s[2], done[3], done[0]]; rep[sid] = {'before': before, 'after': done[0], 'target': target, 'side': done[1], 'bends': done[2]}
        else: rep[sid] = {'before': before, 'after': before, 'target': target, 'note': '候補が検査を通らない＝元のまま'}
        print(r, sid, rep[sid], flush=True)
    report[r] = rep
    (dst / f'spec_{r}.json').write_text(json.dumps(d, ensure_ascii=False, indent=1), encoding='utf-8')
(dst / 'autotune_report.json').write_text(json.dumps(report, ensure_ascii=False, indent=1), encoding='utf-8')
print('ok', dst)
