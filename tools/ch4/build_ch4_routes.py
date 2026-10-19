#!/usr/bin/env python3
"""Chapter 4「灼熱の火山」A／B／C 連続世界ボードの道路グラフ（2026-10-18・設計案＝未承認・本編には出さない）を作る。
正本：tools/ch4/routes/spec_A.json・spec_B.json・spec_C.json
  anchors＝{地点 ID: [x, y, 役割, 高さ]}（世界座標 1024×1536＝Chapter 1〜3 と同じ単位。正式全体絵は未着＝仮の世界座標）
  segs＝{区間 ID: [始点, 終点, 種類, 経由点[]（, 歩数）]}。歩数を書かなければ道の長さ ÷ step（15〜28単位の間隔）。
  種類から通行条件が決まる：parity_left＝Q_odd_only・parity_right＝Q_even_only・challenge_fail＝CHALLENGE_1_4・challenge_success＝CHALLENGE_5_6・
  optional_random_spur＝unlock_random_event・それ以外＝always。reward_spur／optional_random_spur は戻りの接続（reverse）を持つ＝行き止まり。
  種類に bridge を含む区間（lava_bridge・challenge_bridge…）だけ溶岩の上を渡れる。
出力：js/proto/ch4-routes.js（MMRF_CH4＝{ A, B, C }。形式は MMRF_DATA＝js/proto/roadfirst-data.js と同じ＋chapter・route・name・concept・names・places・rewardTitles・zones・art・rewards・statLanes・explore・calm・rareZones）
      tools/ch4/out/summary.json（設計書用の数値）・docs/ch4/graph_A/B/C.json（機械可読のグラフ＝地点・接続・区間・役割・高さ・区域）
検査：280〜320地点・START から全地点・全地点から GOAL・RIVAL と LOWER_GATE を通らずに GOAL へ行けない・Q／CHALLENGE／隠れ家は各1・固定報酬 6＋隠れ家 1・
      行き止まりから戻れる・地点の間隔 15〜28・隣り合わない地点どうしが 12単位以上（高さを含む）・道が交わらない／近すぎない（20）・
      溶岩（溶岩湖・溶岩流）の中に地点が無い（橋の区間だけ渡れる）・ライバルの位置が本線の 45〜80%（設計目標 50〜70%）・特殊挑戦は成功の道が失敗の道より短い・
      START が最も低く GOAL が最も高い・固定報酬 7 枠の中身の種類と数が Chapter 1 と同じ。
実行：python3 -I tools/ch4/build_ch4_routes.py（リポジトリ直下）。Chapter 1〜3 のデータは読まない・変えない。index.html は ch4-routes.js を読み込まない。"""
import json, math, itertools, os
from collections import deque
from pathlib import Path
R = Path(__file__).resolve().parents[2]
SRC = Path(os.environ.get('CH4_SRC') or R / 'tools/ch4/routes')
OUT_JS = Path(os.environ.get('CH4_OUT') or R / 'js/proto/ch4-routes.js')
OUT_SUM = Path(os.environ.get('CH4_SUM') or R / 'tools/ch4/out/summary.json')
OUT_GRAPH = Path(os.environ.get('CH4_GRAPH') or R / 'docs/ch4')

COND = {'parity_left': 'Q_odd_only', 'parity_right': 'Q_even_only', 'challenge_fail': 'CHALLENGE_1_4', 'challenge_success': 'CHALLENGE_5_6', 'optional_random_spur': 'unlock_random_event'}
SPUR = {'reward_spur', 'optional_random_spur'}
def cond_of(kind):
    """区間の種類 → 通行条件（parity_left_bridge のように種類に接尾語が付いても同じ条件）"""
    for k, c in COND.items():
        if kind == k or kind.startswith(k + '_'): return c
    return 'always'
LOOSE = bool(os.environ.get('CH4_LOOSE'))   # 案の比較だけ：間隔・距離・交差の検査を外す
STEP = 24.0
REWARD_IDS = ['L_CHEST', 'R_CHEST', 'L_ALTAR', 'L_LATE_ALTAR', 'REWARD5', 'R_SPECIAL']

FIXED = {
  'version': 'ch4-design-20261018', 'size': [1024, 1536],
  'fixed_rules': {'normal_movement_die': [1, 2, 3, 4, 5, 6], 'training_turn_limit': 40, 'double_dice_consumable': 'two D6 rolled and summed for exactly one move',
                  'reward_once_per_training': True, 'repeat_ability_tile_once_per_training': True, 'no_auto_return': True, 'odd_left_even_right': True,
                  'challenge_success_faces': [5, 6], 'challenge_failure_faces': [1, 2, 3, 4]},
  'draft_rules': {'mainline_direction': 'START_to_GOAL', 'reward_spurs': 'bidirectional forced to return', 'optional_random_unlock': 'branch gate determined at training start and persisted',
                  'pass_through_event': 'stop_at_Q_RIVAL_CHALLENGE_and_reward_endpoint; discard_unused_movement_draft', 'event_dice': 'separate from movement die; no extra turn draft',
                  'hidden_road': 'none; all design roads are intended to be physically drawn'},
  'random_gate': {'id': 'RANDOM_DEN', 'entry_segment': 'D_RAND', 'eligible_to_close': True, 'mainline_affected': False, 'draw_gate_in_art': True, 'opening_probability': 'UNDECIDED'},
}
# 共通の世界（A／B／C で同じ火山・溶岩・建物。道だけがルートごと）。正式全体絵・巨大火山 TL/TR/BL/BR は未着＝座標はすべて【仮】（予約枠＝docs/ch4/DESIGN.md §8）。
#  高さ（elev）：麓 0 → 火口縁 約 112。空の色は本線の進捗（高さ）と連動＝夕暮れ（0〜40）→ 薄暮（40〜80）→ 夜（80〜）。描画の実装はしない（設計資料）
WORLD_ART = {
  'title': {'small': 'CHAPTER 4', 'name': '灼熱の火山'},
  'ground': '#5a4034', 'volcano3d': True,
  'summit': [512, 185], 'crater': {'c': [512, 185], 'rx': 236, 'ry': 120},                      # 火口（外輪の内側）
  'lava': [   # 溶岩（地点を置けない・橋の区間だけ渡れる）。溶岩湖＝火口の中・東の溶岩流＝火口の東の割れ目から麓へ（幅 36）
    {'id': 'lava_lake', 'kind': 'lake', 'poly': [[round(512 + 150 * math.cos(2 * math.pi * i / 24), 1), round(180 + 76 * math.sin(2 * math.pi * i / 24), 1)] for i in range(24)]},
    {'id': 'lava_river_E', 'kind': 'river', 'poly': [[742, 330], [778, 330], [808, 520], [828, 720], [848, 900], [868, 1100], [883, 1300], [888, 1420], [852, 1420], [847, 1300], [832, 1100], [812, 900], [792, 720], [772, 520]]},
  ],
  'regions': [
    {'id': 'foothill_village', 'kind': 'village', 'poly': [[380, 1420], [644, 1420], [660, 1536], [364, 1536]]},
    {'id': 'ash_plain_W', 'kind': 'ash', 'poly': [[20, 1120], [330, 1150], [340, 1300], [20, 1340]]},
    {'id': 'obsidian_field_E', 'kind': 'obsidian', 'poly': [[700, 1100], [960, 1080], [1004, 1260], [720, 1300]]},
    {'id': 'fumarole_shelf_E', 'kind': 'fumarole', 'poly': [[640, 380], [900, 360], [920, 520], [660, 560]]},
    {'id': 'fire_temple_W', 'kind': 'temple', 'poly': [[150, 330], [380, 320], [380, 470], [150, 480]]},
    {'id': 'watchtower_W', 'kind': 'tower', 'poly': [[80, 960], [220, 950], [230, 1060], [90, 1070]]},
    {'id': 'rim_arena', 'kind': 'arena', 'poly': [[400, 280], [624, 280], [624, 360], [400, 360]]},
  ],
  'contours': [{'elev': h, 'rx': 520 - h * 3.3, 'ry': 660 - h * 4.6} for h in (20, 40, 60, 80, 100)],   # 等高線（描画の目安・中心 summit）
}
CONTENTS = {'gold150': [{'gold': 150}], 'all10': [{'statAll': 10}], 'all15': [{'statAll': 15}], 'food': [{'fat': -50}, {'gold': 100}], 'best30': [{'best': 30}], 'gold200': [{'gold': 200}]}
STANDARD = sorted(['gold150', 'gold150', 'all10', 'all15', 'food', 'best30', 'gold200'])
# 目印（固定報酬の建物・門・像）。Chapter 4 の正式の絵は無い＝予約枠 ID だけ（絵が届くまで Chapter 1 の正式の目印を代用する想定）
LM_BY_WORD = [('見張り', 'lm_moss_tower.webp', 38), ('塔', 'lm_moss_tower.webp', 38), ('祠', 'lm_cliff_shrine.webp', 40), ('宝物庫', 'lm_watchpost.webp', 40), ('像', 'lm_watch_statue.webp', 42),
              ('泉', 'lm_rainbow_falls.webp', 44), ('祭壇', 'lm_forest_altar.webp', 46)]
def landmarks_of(spec):
    out = [{'node': 'START', 'file': 'lm_start_gate.webp', 'w': 40, 'along': 7, 'z': -30, 'slot': 'C4_LM_START_GATE', 'standin': '麓の門'},
           {'node': 'LOWER_GATE', 'file': 'lm_seal_gate.webp', 'w': 44, 'along': 3, 'z': -30, 'slot': 'C4_LM_OBSIDIAN_GATE', 'standin': spec['places'].get('LOWER_GATE', '黒曜の門')},
           {'node': 'CHALLENGE', 'file': 'lm_seal_gate.webp', 'w': 46, 'along': 14, 'z': -30, 'slot': 'C4_LM_CHALLENGE', 'standin': spec['places'].get('CHALLENGE', '特殊挑戦')},
           {'node': 'STATUE', 'file': 'lm_lion.webp', 'w': 38, 'off': [-36, -21], 'z': -30, 'slot': 'C4_LM_STATUE', 'standin': spec['places'].get('STATUE', '火の像')},
           {'node': 'RANDOM_DEN', 'file': 'lm_den_closed.webp', 'open': 'lm_den_open.webp', 'w': 42, 'along': 20, 'z': -30, 'slot': 'C4_LM_DEN', 'standin': spec['rewardTitles'].get('RANDOM_DEN', '隠れ家')},
           {'node': 'GOAL', 'file': 'lm_arena.webp', 'w': 120, 'along': 0, 'z': -30, 'slot': 'C4_ARENA', 'standin': '火口縁の闘技場'}]
    for k in REWARD_IDS:
        t = spec['rewardTitles'][k]; f = next(((fn, w) for word, fn, w in LM_BY_WORD if word in t), ('lm_forest_altar.webp', 44))
        out.append({'node': k, 'file': f[0], 'w': f[1], 'along': 20, 'z': -30, 'slot': f'C4_LM_{k}', 'standin': t})
    return [L for L in out if L['node'] in spec['anchors']]

# 2026-10-20 通し試遊の品質改善：角を丸める・広場の中心から隣の地点を離す（tools/common/board_layout.py・Chapter 2 と同じ）。
#  CLEAR＝広場の絵（js/proto/ch4-world.js の PLAZA_D 50＝半径 25）の中心から隣の地点まで（旧：約 21＝隣のマスが広場の中に並んでいた）
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'common'))
from board_layout import layout_points, plaza_ends
CLEAR = 34.0
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
def in_poly(poly, x, y):
    c = False
    for i in range(len(poly)):
        a, b = poly[i], poly[i - 1]
        if (a[1] > y) != (b[1] > y) and x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]: c = not c
    return c
def dist_seg(p, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]; L = dx * dx + dy * dy or 1
    t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L)); return math.dist(p, (a[0] + dx * t, a[1] + dy * t))
def dist_poly_edge(poly, p): return min(dist_seg(p, poly[i - 1], poly[i]) for i in range(len(poly)))
def seg_zone(spec, sid):
    for z, ss in spec['zones'].items():
        if sid in ss: return z
    raise AssertionError(f'{spec["key"]}：zones に無い区間 {sid}')
def is_bridge(kind): return 'bridge' in kind

def elevations(anc, segments, nodes):
    """地点の高さ：役割のある地点は anchors の4番目・区間の途中は両端の高さを道の長さで補間"""
    H = {k: float(v[3]) if len(v) > 3 else 0.0 for k, v in anc.items()}
    for sid, s in segments.items():
        ids = s[3]; P = [nodes[i][:2] for i in ids]
        cum = [0.0]
        for i in range(len(P) - 1): cum.append(cum[-1] + math.dist(P[i], P[i + 1]))
        L = cum[-1] or 1; h0, h1 = H[ids[0]], H[ids[-1]]
        for i, id_ in enumerate(ids[1:-1], 1): H[id_] = round(h0 + (h1 - h0) * cum[i] / L, 2)
    return H

def build(spec):
    anc, segs = spec['anchors'], spec['segs']
    step = float(spec.get('step', STEP))
    nodes, segments, edges = {}, {}, []
    ends = plaza_ends(spec)
    lines, ns = {}, {}
    for sid, s in segs.items():
        a, b = s[0], s[1]
        lines[sid] = [tuple(anc[a][:2])] + [tuple(v) for v in s[3]] + [tuple(anc[b][:2])]
        L = plen(lines[sid])
        ns[sid] = s[4] if len(s) > 4 else max(2, round(L / step), math.ceil(L / 28))
        assert LOOSE or 15 <= L / ns[sid] <= 28, f'{spec["key"]} 間隔 {sid} {L / ns[sid]:.1f}（歩数 {ns[sid]}・長さ {L:.0f}）'
    # 2026-10-20：歩数は従来どおり（丸める前の長さ）。地点どうしが近づきすぎる区間だけ従来の並べ方（tools/common/board_layout.py の layout_points）
    PTS, _plain = layout_points(lines, ns, {sid: (s[0] in ends, s[1] in ends) for sid, s in segs.items()}, CLEAR)
    for sid, s in segs.items():
        a, b, kind, via = s[0], s[1], s[2], s[3]
        n = ns[sid]; p = PTS[sid]
        ids = [a] + [f'{sid}_{i:02d}' for i in range(1, n)] + [b]
        for i, id_ in enumerate(ids):
            if id_ in nodes: continue
            anchor = id_ in anc
            nodes[id_] = [round(p[i][0], 2), round(p[i][1], 2), anc[id_][2] if anchor else 'ordinary_tile', None if anchor else sid]
        segments[sid] = [a, b, kind, ids]
        cond = cond_of(kind)
        for i in range(n): edges.append([ids[i], ids[i + 1], sid, 'forward', cond])
        if kind in SPUR:
            for i in range(n, 0, -1): edges.append([ids[i], ids[i - 1], sid, 'reverse', cond])
    for k, v in anc.items():
        assert k in nodes, f'{spec["key"]}：どの区間にもつながっていない地点 {k}'
        nodes[k][0], nodes[k][1] = round(v[0], 2), round(v[1], 2)
    D = dict(FIXED)
    D.update(source=f'tools/ch4/routes/spec_{spec["key"]}.json（Chapter 4 A／B／C 設計案・2026-10-18・未承認）', chapter=4, route=spec['key'], name=spec['name'], concept=spec['concept'],
             nodes=nodes, segments=segments, edges=edges, names=spec['names'], places=spec['places'], rewardTitles=spec['rewardTitles'], zones=spec['zones'])
    elev = elevations(anc, segments, nodes)
    rw = spec.get('rewards') or {}
    assert sorted(rw.values()) == STANDARD, f'{spec["key"]}：固定報酬の中身は Chapter 1 と同じ 7 種類・同じ数（{sorted(rw.values())}）'
    D['rewards'] = {k: {'title': spec['rewardTitles'][k], 'key': c, 'eff': CONTENTS[c]} for k, c in rw.items()}
    D['statLanes'] = spec.get('lanes') or {}
    D['explore'] = spec.get('explore') or {}
    D['calm'] = spec.get('calm') or []
    D['rareZones'] = {z: [i for sid in segs_ for i in segments[sid][3][1:-1]] for z, segs_ in (spec.get('rareZones') or {}).items()}
    D['art'] = dict(WORLD_ART, spurs=[k for k, s in segs.items() if s[2] in SPUR], elev={k: v for k, v in elev.items() if v}, bridges=[k for k, s in segs.items() if is_bridge(s[2])],
                    zoneOf={sid: seg_zone(spec, sid) for sid in segments}, landmarks=landmarks_of(spec), peaks=[], skyPhase=spec.get('skyPhase') or {})
    stats = check(spec, D, elev)
    return D, stats

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
    S = D['segments']; L = {k: len(v[3]) - 1 for k, v in S.items()}
    nxt = {}
    for k, v in S.items():
        if v[2] not in SPUR: nxt.setdefault(v[0], []).append(k)
    out = []
    def walk(node, path):
        if node == 'GOAL': out.append(path); return
        for k in nxt.get(node, []): walk(S[k][1], path + [k])
    walk('START', [])
    res = []
    for p in out:
        tot = sum(L[k] for k in p)
        rv = next(sum(L[k] for k in p[:i + 1]) for i, k in enumerate(p) if S[k][1] == 'RIVAL')
        res.append({'segs': p, 'total': tot, 'rival': rv, 'rivalRatio': round(rv / tot, 3)})
    return res
def seg_hit(p1, p2, q1, q2):
    def o(a, b, c): return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
    d1, d2, d3, d4 = o(q1, q2, p1), o(q1, q2, p2), o(p1, p2, q1), o(p1, p2, q2)
    return (d1 > 0) != (d2 > 0) and (d3 > 0) != (d4 > 0)

def check(spec, D, elev):
    key, N, S = spec['key'], D['nodes'], D['segments']
    n_nodes, n_edges, n_segs = len(N), len(D['edges']), len(S)
    assert 280 <= n_nodes <= 320 or os.environ.get('CH4_DEV'), f'{key}：地点数 {n_nodes}（目標 280〜320）'
    roles = {}
    for v in N.values(): roles[v[2]] = roles.get(v[2], 0) + 1
    for role, cnt in [('start', 1), ('goal', 1), ('parity_forced_fork', 1), ('challenge_d6_5_6', 1), ('mandatory_rival', 1), ('optional_random_unlock_dead_end', 1), ('fixed_reward_dead_end', 6), ('lower_walk_through_gate', 1), ('rare_zone_candidate', 1)]:
        assert roles.get(role, 0) == cnt, f'{key}：役割 {role} は {cnt} 個のはず（{roles.get(role, 0)}）'
    assert sorted(k for k, v in N.items() if v[2] == 'fixed_reward_dead_end') == sorted(REWARD_IDS), f'{key}：固定報酬の ID'
    assert sorted(D['rewards']) == sorted(REWARD_IDS + ['RANDOM_DEN']), f'{key}：報酬の割り当ての ID'
    assert reach(D, 'START') == set(N), f'{key}：START から行けない地点 {set(N) - reach(D, "START")}'
    for k in N: assert 'GOAL' in reach(D, k), f'{key}：{k} から GOAL へ行けない'
    assert 'GOAL' not in reach(D, 'START', 'RIVAL'), f'{key}：ライバルを通らずに GOAL へ行ける'
    assert 'GOAL' not in reach(D, 'START', 'LOWER_GATE'), f'{key}：門（LOWER_GATE）を通らずに GOAL へ行ける'
    for sid, s in S.items():
        if s[2] in SPUR: assert s[0] in reach(D, s[1]), f'{key} {sid}：行き止まりから戻れない'
    for e in D['edges']:
        if e[0] == 'Q' and e[3] == 'forward': assert e[4] in ('Q_odd_only', 'Q_even_only'), f'{key}：Q から条件なしの道'
        if e[0] == 'CHALLENGE' and e[3] == 'forward': assert e[4] in ('CHALLENGE_5_6', 'CHALLENGE_1_4'), f'{key}：CHALLENGE から条件なしの道'
    hh = lambda i: elev.get(i, 0)
    adj = set()
    for e in D['edges']: adj.add((e[0], e[1])); adj.add((e[1], e[0]))
    ids = list(N); mind, near = 1e9, []
    for a, b in itertools.combinations(ids, 2):
        if (a, b) in adj: continue
        d = math.dist(N[a][:2] + [hh(a)], N[b][:2] + [hh(b)])
        mind = min(mind, d)
        if d < 12: near.append((a, b, round(d, 1)))
    assert LOOSE or not near, f'{key}：地点が近すぎる {near[:8]}'
    for k, v in N.items(): assert 20 <= v[0] <= 1004 and 40 <= v[1] <= 1520, (key, k, v)
    ends = {k: {v[0], v[1]} for k, v in S.items()}
    bad = []
    for a, b in itertools.combinations(S, 2):
        shared = ends[a] & ends[b]
        A, B = S[a][3], S[b][3]
        for i in range(len(A) - 1):
            for j in range(len(B) - 1):
                if shared and ({A[i], A[i + 1]} & shared or {B[j], B[j + 1]} & shared): continue   # 同じ地点から出る2本：共有の地点につながる1歩は除いて、中ほどが交わらない・近すぎないこと
                p1, p2, q1, q2 = N[A[i]][:2], N[A[i + 1]][:2], N[B[j]][:2], N[B[j + 1]][:2]
                d = min(dist_seg(p1, q1, q2), dist_seg(p2, q1, q2), dist_seg(q1, p1, p2), dist_seg(q2, p1, p2))
                if seg_hit(p1, p2, q1, q2) or d < (20 if not shared else 12): bad.append((a, b, round(d, 1))); break
            else: continue
            break
    assert LOOSE or not bad, f'{key}：道が交わる・近すぎる {bad}'
    # 溶岩：橋の区間以外の地点は溶岩の中に置かない・ふちから 10 以上離す。橋の区間は両端が溶岩の外
    lava_bad = []
    for sid, s in S.items():
        br = is_bridge(s[2])
        for i, nid in enumerate(s[3]):
            x, y = N[nid][:2]
            for L_ in WORLD_ART['lava']:
                inside = in_poly(L_['poly'], x, y); dd = dist_poly_edge(L_['poly'], (x, y))
                if br and i not in (0, len(s[3]) - 1): continue
                if inside or dd < 10: lava_bad.append((sid, nid, L_['id'], round(dd, 1)))
    assert LOOSE or not lava_bad, f'{key}：溶岩の中・ふちに近い地点 {lava_bad[:8]}'
    # 高さ：START が最低・GOAL が最高
    assert hh('GOAL') == max(elev.values()) and hh('START') == min(elev.values()), f'{key}：高さ START {hh("START")} GOAL {hh("GOAL")} 範囲 {min(elev.values())}〜{max(elev.values())}'
    mr = main_routes(D)
    bad = [m for m in mr if not (0.45 <= m['rivalRatio'] <= 0.80)]
    assert not bad, f'{key}：ライバルの位置 ' + '；'.join(f'{m["rival"]}/{m["total"]}（{m["rivalRatio"]}）{m["segs"]}' for m in bad)
    def path_len(start, cond):
        best = None
        def go(node, acc, seen):
            nonlocal best
            if node == 'L_MERGE': best = acc if best is None else min(best, acc); return
            for sid, s in S.items():
                if s[0] == node and s[2] not in SPUR and sid not in seen and (node != 'CHALLENGE' or cond_of(s[2]) == cond): go(s[1], acc + len(s[3]) - 1, seen | {sid})
        go(start, 0, frozenset()); return best
    ok_, ng_ = path_len('CHALLENGE', 'CHALLENGE_5_6'), path_len('CHALLENGE', 'CHALLENGE_1_4')
    assert ok_ is not None and ng_ is not None and ok_ < ng_, f'{key}：特殊挑戦の成功 {ok_} 歩は失敗 {ng_} 歩より短いこと'
    zones = spec['zones']; zs = set(itertools.chain.from_iterable(zones.values()))
    assert zs == set(S), f'{key}：zones に無い区間 {set(S) ^ zs}'
    byzone = {z: sum(len(S[s][3]) - 1 for s in ss) for z, ss in zones.items()}
    ord_ = sum(1 for v in N.values() if v[2] == 'ordinary_tile')
    return {'route': key, 'name': spec['name'], 'nodes': n_nodes, 'edges': n_edges, 'segments': n_segs, 'ordinary': ord_, 'spurs': len(D['art']['spurs']), 'bridges': D['art']['bridges'],
            'freeForks': sum(1 for k in N if sum(1 for e in D['edges'] if e[0] == k and e[3] == 'forward' and e[4] == 'always') > 1),
            'mainRoutes': mr, 'mainTotals': sorted(set(m['total'] for m in mr)), 'rivalSteps': sorted(set(m['rival'] for m in mr)),
            'rivalRatio': [min(m['rivalRatio'] for m in mr), max(m['rivalRatio'] for m in mr)], 'challenge': {'success': ok_, 'fail': ng_},
            'stepsByZone': byzone, 'minNodeDist': round(mind, 1), 'roles': roles, 'explore': spec.get('explore') or {},
            'exploreNodes': sum(len(S[k][3]) - 1 for k in (spec.get('explore') or {}) if k in S), 'elevRange': [min(elev.values()), max(elev.values())],
            'segSteps': {k: len(v[3]) - 1 for k, v in S.items()}, 'rareCandidates': {z: len(v) for z, v in D['rareZones'].items()}}

def main():
    OUT_SUM.parent.mkdir(parents=True, exist_ok=True); OUT_GRAPH.mkdir(parents=True, exist_ok=True)
    out, summ = {}, {}
    for r in ('A', 'B', 'C'):
        spec = json.loads((SRC / f'spec_{r}.json').read_text(encoding='utf-8'))
        D, st = build(spec); out[r] = D; summ[r] = st
        g = {'chapter': 4, 'route': r, 'name': D['name'], 'concept': D['concept'], 'size': D['size'], 'nodes': {k: {'x': v[0], 'y': v[1], 'role': v[2], 'segment': v[3], 'elev': D['art']['elev'].get(k, 0)} for k, v in D['nodes'].items()},
             'segments': {k: {'from': v[0], 'to': v[1], 'kind': v[2], 'steps': len(v[3]) - 1, 'nodes': v[3], 'zone': D['art']['zoneOf'][k], 'condition': cond_of(v[2]), 'spur': v[2] in SPUR, 'bridge': is_bridge(v[2])} for k, v in D['segments'].items()},
             'edges': [{'from': e[0], 'to': e[1], 'segment': e[2], 'dir': e[3], 'condition': e[4]} for e in D['edges']],
             'fixed': {'START': 'START', 'GOAL': 'GOAL', 'Q': 'Q', 'CHALLENGE': 'CHALLENGE', 'RIVAL': 'RIVAL', 'LOWER_GATE': 'LOWER_GATE', 'rewards': REWARD_IDS, 'den': 'RANDOM_DEN', 'rare': 'STATUE'},
             'rewards': D['rewards'], 'statLanes': D['statLanes'], 'calm': D['calm'], 'rareZones': D['rareZones'], 'mainRoutes': st['mainRoutes'], 'skyPhase': D['art']['skyPhase']}
        (OUT_GRAPH / f'graph_{r}.json').write_text(json.dumps(g, ensure_ascii=False, indent=1), encoding='utf-8')
    js = ('// Chapter 4「灼熱の火山」A／B／C 連続世界ボードの道路グラフ（2026-10-18・設計案＝未承認・本編には出さない）。tools/ch4/build_ch4_routes.py が tools/ch4/routes/spec_A/B/C.json から作る。手で書き換えない。\n'
          '// 形式は MMRF_DATA（js/proto/roadfirst-data.js＝Chapter 1 A）と同じ（MMRF_CORE がそのまま進行できる）＋chapter・route・name・concept・names・places・rewardTitles・zones・art・rewards・statLanes・explore・calm・rareZones。\n'
          '// index.html・本編（MMWD／MMWB・raising.js・セーブ v6）からは参照しない。tools/ch4/sim.mjs（シミュレーション）と tests/ch4-routes-1018.test.mjs だけが読む。\n'
          '(function (root) { const R = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n'
          "  if (typeof module === 'object' && module.exports) module.exports = R; else root.MMRF_CH4 = R; })(typeof window !== 'undefined' ? window : globalThis);\n")
    OUT_JS.write_text(js, encoding='utf-8')
    OUT_SUM.write_text(json.dumps(summ, ensure_ascii=False, indent=1), encoding='utf-8')
    for r, st in summ.items():
        print(r, st['name'], 'nodes', st['nodes'], 'edges', st['edges'], 'segments', st['segments'], 'ordinary', st['ordinary'], 'spurs', st['spurs'], 'minDist', st['minNodeDist'], 'challenge', st['challenge'], 'explore+', st['exploreNodes'], 'elev', st['elevRange'])
        print('   本線の総歩数', st['mainTotals'], 'ライバル', st['rivalSteps'], '比率', st['rivalRatio'], 'zones', st['stepsByZone'])
        print('   区間の歩数', st['segSteps'])
    print('bytes', len(js.encode()))

if __name__ == '__main__':
    main()
