#!/usr/bin/env python3
"""Chapter 2「潮風の海岸」A／B／C 連続世界ボードの道路グラフ（2026-10-15・設計案＝未承認・試作用）を作る。
正本：tools/ch2/routes/spec_A.json・spec_B.json・spec_C.json
  anchors＝{地点 ID: [x, y, 役割]}（世界座標 1024×1536＝Chapter 1 と同じ単位。x は添付の世界観参照 864px を 1024 に引き伸ばした座標）
  segs＝{区間 ID: [始点, 終点, 種類, 経由点[]（, 歩数）]}。歩数を書かなければ道の長さ ÷ 19（15〜28単位の間隔）。
  種類から通行条件が決まる：parity_left＝Q_odd_only・parity_right＝Q_even_only・challenge_fail＝CHALLENGE_1_4・challenge_success＝CHALLENGE_5_6・
  optional_random_spur＝unlock_random_event・それ以外＝always。reward_spur／optional_random_spur は戻りの接続（reverse）を持つ＝行き止まり。
出力：js/proto/ch2-routes.js（MMRF_CH2＝{ A, B, C }。形式は MMRF_DATA＝js/proto/roadfirst-data.js と同じ＋route・name・concept・names・places・rewardTitles・zones・art）
      tools/ch2/out/summary.json（設計書・比較表用の数値）
検査：280〜320地点・START から全地点・全地点から GOAL・RIVAL を通らずに GOAL へ行けない・Q／CHALLENGE／隠れ家は各1・固定報酬 6＋隠れ家 1・
      行き止まりから戻れる・地点の間隔 15〜28・隣り合わない地点どうしが 12単位以上離れている（高さも含めた距離）・道が交わらない（高さが 20 以上違えば橋＝可）・
      ライバルの位置が本線の 45〜80%（設計目標 50〜70%）・特殊挑戦は成功の道が失敗の道より短い（Chapter 1 と同じ規則）・海底の地点は海底の盆地の中・
      固定報酬 7 枠の中身の種類と数が Chapter 1 と同じ（2026-10-15 追補：ユーザー承認の論点 5＝割り当てだけ建物・景観に合わせる）。
2026-10-15 追補（ユーザー承認の論点 1〜5）：高さ（art.elev＝海面 0・海底 −depth・下降／上昇の区間は道の長さで補間）・海底の盆地（art.basin）・螺旋塔と潮の塔（art.towers）・
      能力の道の偏り（statLanes）・探索路（explore）・報酬の割り当て（rewards）を出力に足す。
実行：python3 -I tools/ch2/build_ch2_routes.py（リポジトリ直下）。Chapter 1 のデータ（roadfirst-data.js・roadfirst-routes.js）は読まない・変えない。"""
import json, math, itertools, os
from collections import deque
from pathlib import Path
R = Path(__file__).resolve().parents[2]
SRC = Path(os.environ.get('CH2_SRC') or R / 'tools/ch2/routes')          # 案の比較だけ別の置き場（CH2_SRC・CH2_OUT・CH2_SUM）
OUT_JS = Path(os.environ.get('CH2_OUT') or R / 'js/proto/ch2-routes.js')
OUT_SUM = Path(os.environ.get('CH2_SUM') or R / 'tools/ch2/out/summary.json')

COND = {'parity_left': 'Q_odd_only', 'parity_right': 'Q_even_only', 'challenge_fail': 'CHALLENGE_1_4', 'challenge_success': 'CHALLENGE_5_6', 'optional_random_spur': 'unlock_random_event'}
SPUR = {'reward_spur', 'optional_random_spur'}
LOOSE = bool(os.environ.get('CH2_LOOSE'))   # 案の比較だけ：歩数だけ書き換えた仮の案（間隔・距離・交差の検査を外す）。正式の出力には使わない
STEP = 24.0   # 1歩のおおよその長さ（単位）。Chapter 1 A の実測は 15〜28（平均 約21）。Chapter 2 は少し広め（40ターンで 95〜125歩の本線にするため）
REWARD_IDS = ['L_CHEST', 'R_CHEST', 'L_ALTAR', 'L_LATE_ALTAR', 'REWARD5', 'R_SPECIAL']

# Chapter 1 の原本と同じ固定の規則（MMRF_CORE が読む）
FIXED = {
  'version': 'ch2-design-20261015b', 'size': [1024, 1536],
  'fixed_rules': {'normal_movement_die': [1, 2, 3, 4, 5, 6], 'training_turn_limit': 40, 'double_dice_consumable': 'two D6 rolled and summed for exactly one move',
                  'reward_once_per_training': True, 'repeat_ability_tile_once_per_training': True, 'no_auto_return': True, 'odd_left_even_right': True,
                  'challenge_success_faces': [5, 6], 'challenge_failure_faces': [1, 2, 3, 4]},
  'draft_rules': {'mainline_direction': 'START_to_GOAL', 'reward_spurs': 'bidirectional forced to return', 'optional_random_unlock': 'branch gate determined at training start and persisted',
                  'pass_through_event': 'stop_at_Q_RIVAL_CHALLENGE_and_reward_endpoint; discard_unused_movement_draft', 'event_dice': 'separate from movement die; no extra turn draft',
                  'hidden_road': 'none; all design roads are intended to be physically drawn'},
  'random_gate': {'id': 'RANDOM_DEN', 'entry_segment': 'D_RAND', 'eligible_to_close': True, 'mainline_affected': False, 'draw_gate_in_art': True, 'opening_probability': 'UNDECIDED'},
}
# 共通の世界（A／B／C で同じ建物・地形。道だけがルートごと）：海面の陸地（港町・小島）・海底の盆地（basin）・螺旋塔と潮の塔（towers）・大会会場の島。
#  座標は添付の参照画像から読んだ暫定（世界の単位＝Chapter 1 と同じ 1024×1536）。2026-10-15 追補：海底は盆地（海面 0 から depth だけ低い）・道の高さは art.elev
DEPTH = 36   # 海底の深さ（単位）。2.5D の盤では海面の板より depth だけ低い板に海底を描く
WORLD_ART = {
  'title': {'small': 'CHAPTER 2', 'name': '潮風の海岸'},
  'sea': '#2d8fc4',
  'depth': DEPTH,
  # 海底の盆地（ガラス回廊・沈没遺跡のある海の底）。海底の道はすべてこの中・海面の桟橋はこの上を渡ってよい（高さが違う）
  'basin': [[178, 902], [262, 916], [342, 912], [452, 902], [560, 906], [664, 896], [766, 888], [866, 872], [896, 782], [902, 640], [898, 500],
            [890, 420], [846, 362], [748, 346], [646, 352], [596, 344], [500, 352], [420, 360], [330, 352], [242, 356], [180, 384], [160, 480], [158, 620], [164, 760]],
  # 螺旋塔（海底から海面より上へ）・潮の塔（海面から海底へ下りる）。c＝中心・r＝塔の半径・top＝海面からの高さ（単位）
  'towers': [{'id': 'spiral', 'kind': 'spiral', 'c': [478, 452], 'r': 56, 'top': 46}, {'id': 'tide', 'kind': 'tide', 'c': [356, 922], 'r': 16, 'top': 34}],
  'regions': [
    {'id': 'town', 'kind': 'land', 'poly': [[0, 1300], [330, 1300], [520, 1380], [560, 1536], [0, 1536]]},
    {'id': 'descent_isle', 'kind': 'land', 'poly': [[330, 924], [462, 912], [474, 1000], [344, 1004]]},
    {'id': 'arch_isle', 'kind': 'land', 'poly': [[380, 1004], [500, 1000], [504, 1080], [380, 1080]]},
    {'id': 'lighthouse_isle', 'kind': 'land', 'poly': [[56, 1018], [172, 1018], [176, 1112], [58, 1112]]},
    {'id': 'temple_isle', 'kind': 'land', 'poly': [[680, 914], [852, 908], [852, 1050], [680, 1050]]},
    {'id': 'shell_isle', 'kind': 'land', 'poly': [[780, 1140], [880, 1140], [880, 1220], [780, 1220]]},
    {'id': 'arena_isle', 'kind': 'arena', 'poly': [[296, 60], [735, 60], [735, 150], [296, 150]]},
    {'id': 'west_tower_isle', 'kind': 'land', 'poly': [[110, 150], [200, 150], [200, 230], [110, 230]]},
    {'id': 'statue_isle', 'kind': 'land', 'poly': [[720, 190], [880, 190], [880, 280], [720, 280]]},
    {'id': 'east_isle', 'kind': 'land', 'poly': [[620, 260], [700, 260], [700, 320], [620, 320]]},
  ],
}
# 固定報酬の中身（Chapter 1 の TUNING.rewards と同じ 7 種類・同じ数）。2026-10-15 追補（論点 5）：種類と数は変えず、どの建物・景観に置くかだけルートごとに割り当て直す。
#  値は【仮】（Chapter 1 の試作の値のまま。正式承認ではない）
CONTENTS = {'gold150': [{'gold': 150}], 'all10': [{'statAll': 10}], 'all15': [{'statAll': 15}], 'food': [{'fat': -50}, {'gold': 100}], 'best30': [{'best': 30}], 'gold200': [{'gold': 200}]}
STANDARD = sorted(['gold150', 'gold150', 'all10', 'all15', 'food', 'best30', 'gold200'])
# 目印（固定報酬の建物・特殊挑戦の門・海神像など）。Chapter 2 の正式の絵はまだ無い＝Chapter 1 の正式の目印（assets/proto/board_art_1010/lm_*）を「代用」する。
#  どの絵を代用するかは報酬の名前（建物）から決める＝docs の素材要求一覧の「代用」と同じ対応
LM_BY_WORD = [('灯台', 'lm_moss_tower.webp', 38), ('白塔', 'lm_moss_tower.webp', 38), ('祠', 'lm_cliff_shrine.webp', 40), ('宝物庫', 'lm_watchpost.webp', 40), ('海神像', 'lm_watch_statue.webp', 42),
              ('珊瑚', 'lm_rainbow_falls.webp', 44), ('祭壇', 'lm_forest_altar.webp', 46)]
def landmarks_of(spec):
    out = [{'node': 'START', 'file': 'lm_start_gate.webp', 'w': 40, 'along': 7, 'z': -30, 'standin': '港の門'},
           {'node': 'CHALLENGE', 'file': 'lm_seal_gate.webp', 'w': 46, 'along': 14, 'z': -30, 'standin': spec['places'].get('CHALLENGE', '特殊挑戦の門')},
           {'node': 'STATUE', 'file': 'lm_lion.webp', 'w': 38, 'off': [-36, -21], 'z': -30, 'standin': '海神像（レアの候補の島）'},
           {'node': 'RANDOM_DEN', 'file': 'lm_den_closed.webp', 'open': 'lm_den_open.webp', 'w': 42, 'along': 20, 'z': -30, 'standin': spec['rewardTitles'].get('RANDOM_DEN', '隠れ家')}]
    for k in REWARD_IDS:
        t = spec['rewardTitles'][k]; f = next(((fn, w) for word, fn, w in LM_BY_WORD if word in t), ('lm_forest_altar.webp', 44))
        out.append({'node': k, 'file': f[0], 'w': f[1], 'along': 20, 'z': -30, 'standin': t})
    return [L for L in out if L['node'] in spec['anchors']]

ZONE_H = {'surface_early': 0, 'surface_late': 0, 'undersea': -DEPTH}

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

def elevations(spec, D, pts):
    """地点の高さ：海面の区間 0・海底の区間 −DEPTH・下降（descent）は盆地のふちを越えた所から下り始めて終点で −DEPTH・上昇（ascent）は始点 −DEPTH から盆地のふちを越える所で 0"""
    basin, H = WORLD_ART['basin'], {}
    for sid, s in D['segments'].items():
        z = seg_zone(spec, sid); ids = s[3]
        if z in ZONE_H:
            for i in ids: H.setdefault(i, ZONE_H[z])
    for sid, s in D['segments'].items():
        z = seg_zone(spec, sid)
        if z not in ('descent', 'ascent'): continue
        ids, P = s[3], pts[sid]
        cum = [0.0]
        for i in range(len(P) - 1): cum.append(cum[-1] + math.dist(P[i], P[i + 1]))
        L = cum[-1]
        # ふちを越える所（道の長さの位置）：細かく調べる
        fine = [(P[0][0], P[0][1], 0.0)]
        for i in range(len(P) - 1):
            for k in range(1, 21): u = k / 20; fine.append((P[i][0] + (P[i + 1][0] - P[i][0]) * u, P[i][1] + (P[i + 1][1] - P[i][1]) * u, cum[i] + (cum[i + 1] - cum[i]) * u))
        inside = [in_poly(basin, x, y) for x, y, _ in fine]
        if z == 'descent':
            k = next((j for j, v in enumerate(inside) if v), len(fine) - 1); d0 = fine[k][2]
            for i, id_ in enumerate(ids):
                if id_ in H and i in (0, len(ids) - 1): continue
                t = 0 if cum[i] <= d0 else (cum[i] - d0) / max(1e-9, L - d0); H[id_] = round(-DEPTH * min(1, t), 2)
        else:
            k = max((j for j, v in enumerate(inside) if v), default=0); d1 = fine[min(k + 1, len(fine) - 1)][2]
            for i, id_ in enumerate(ids):
                if id_ in H and i in (0, len(ids) - 1): continue
                t = 1 if cum[i] >= d1 else cum[i] / max(1e-9, d1); H[id_] = round(-DEPTH * (1 - t), 2)
    return H

def build(spec):
    anc, segs = spec['anchors'], spec['segs']
    step = float(spec.get('step', STEP))   # ルートごとの1歩の長さ（15〜28 の範囲）
    nodes, segments, edges, pts = {}, {}, [], {}
    for sid, s in segs.items():
        a, b, kind, via = s[0], s[1], s[2], s[3]
        line = [tuple(anc[a][:2])] + [tuple(v) for v in via] + [tuple(anc[b][:2])]
        L = plen(line)
        n = s[4] if len(s) > 4 else max(2, round(L / step), math.ceil(L / 28))
        sp = L / n
        assert LOOSE or 15 <= sp <= 28, f'{spec["key"]} 間隔 {sid} {sp:.1f}（歩数 {n}・長さ {L:.0f}）'
        p = resample(line, n); pts[sid] = p
        ids = [a] + [f'{sid}_{i:02d}' for i in range(1, n)] + [b]
        for i, id_ in enumerate(ids):
            if id_ in nodes: continue
            anchor = id_ in anc
            nodes[id_] = [round(p[i][0], 2), round(p[i][1], 2), anc[id_][2] if anchor else 'ordinary_tile', None if anchor else sid]
        segments[sid] = [a, b, kind, ids]
        cond = COND.get(kind, 'always')
        for i in range(n): edges.append([ids[i], ids[i + 1], sid, 'forward', cond])
        if kind in SPUR:
            for i in range(n, 0, -1): edges.append([ids[i], ids[i - 1], sid, 'reverse', cond])
    for k, v in anc.items():
        assert k in nodes, f'{spec["key"]}：どの区間にもつながっていない地点 {k}'
        nodes[k][0], nodes[k][1] = round(v[0], 2), round(v[1], 2)
    for sid in segments: pts[sid] = [tuple(nodes[i][:2]) for i in segments[sid][3]]
    D = dict(FIXED)
    D.update(source=f'tools/ch2/routes/spec_{spec["key"]}.json（Chapter 2 A／B／C 設計案・2026-10-15・未承認）', chapter=2, route=spec['key'], name=spec['name'], concept=spec['concept'],
             nodes=nodes, segments=segments, edges=edges, names=spec['names'], places=spec['places'], rewardTitles=spec['rewardTitles'], zones=spec['zones'])
    elev = elevations(spec, D, pts)
    rw = spec.get('rewards') or {}
    assert sorted(rw.values()) == STANDARD, f'{spec["key"]}：固定報酬の中身は Chapter 1 と同じ 7 種類・同じ数（{sorted(rw.values())}）'
    D['rewards'] = {k: {'title': spec['rewardTitles'][k], 'key': c, 'eff': CONTENTS[c]} for k, c in rw.items()}
    D['statLanes'] = spec.get('lanes') or {}
    D['explore'] = spec.get('explore') or {}
    D['calm'] = spec.get('calm') or []
    # レアの候補（区間 → その区間の通常の地点）。MMRF_PLAY.layout が D.rareZones を読む
    D['rareZones'] = {z: [i for sid in segs_ for i in segments[sid][3][1:-1]] for z, segs_ in (spec.get('rareZones') or {}).items()}
    D['art'] = dict(WORLD_ART, spurs=[k for k, s in segs.items() if s[2] in SPUR], elev={k: v for k, v in elev.items() if v}, sea3d=True,
                    zoneOf={sid: seg_zone(spec, sid) for sid in segments}, landmarks=landmarks_of(spec), peaks=[],
                    # 2026-10-15 追補2：沈没遺跡の広場（海底の要の地点＝封印の扉・遺跡の門・回廊の出口）。2.5D の試作は海底の地面に割れた敷石の円を描く
                    ruins=[{'at': k, 'r': 34 if k == 'CHALLENGE' else 26} for k in ('CHALLENGE', 'RIVAL', 'R') if k in anc and elev.get(k, 0) <= -DEPTH + 0.1])
    stats = check(spec, D, pts, elev)
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
    if (d1 > 0) != (d2 > 0) and (d3 > 0) != (d4 > 0):
        t = d1 / (d1 - d2); return t
    return None

def check(spec, D, pts, elev):
    key, N = spec['key'], D['nodes']
    n_nodes, n_edges, n_segs = len(N), len(D['edges']), len(D['segments'])
    assert 280 <= n_nodes <= 320 or os.environ.get('CH2_DEV'), f'{key}：地点数 {n_nodes}（目標 280〜320）'   # CH2_DEV＝設計の途中の確かめだけ
    roles = {}
    for v in N.values(): roles[v[2]] = roles.get(v[2], 0) + 1
    for role, cnt in [('start', 1), ('goal', 1), ('parity_forced_fork', 1), ('challenge_d6_5_6', 1), ('mandatory_rival', 1), ('optional_random_unlock_dead_end', 1), ('fixed_reward_dead_end', 6), ('lower_walk_through_gate', 1)]:
        assert roles.get(role, 0) == cnt, f'{key}：役割 {role} は {cnt} 個のはず（{roles.get(role, 0)}）'
    assert sorted(k for k, v in N.items() if v[2] == 'fixed_reward_dead_end') == sorted(REWARD_IDS), f'{key}：固定報酬の ID'
    assert sorted(D['rewards']) == sorted(REWARD_IDS + ['RANDOM_DEN']), f'{key}：報酬の割り当ての ID'
    assert reach(D, 'START') == set(N), f'{key}：START から行けない地点 {set(N) - reach(D, "START")}'
    for k in N: assert 'GOAL' in reach(D, k), f'{key}：{k} から GOAL へ行けない'
    assert 'GOAL' not in reach(D, 'START', 'RIVAL'), f'{key}：ライバルを通らずに GOAL へ行ける'
    assert 'GOAL' not in reach(D, 'START', 'LOWER_GATE'), f'{key}：潮の塔（海底へ下りる）を通らずに GOAL へ行ける'
    for sid, s in D['segments'].items():
        if s[2] in SPUR: assert s[0] in reach(D, s[1]), f'{key} {sid}：行き止まりから戻れない'
    for e in D['edges']:
        if e[0] == 'Q' and e[3] == 'forward': assert e[4] in ('Q_odd_only', 'Q_even_only'), f'{key}：Q から条件なしの道'
        if e[0] == 'CHALLENGE' and e[3] == 'forward': assert e[4] in ('CHALLENGE_5_6', 'CHALLENGE_1_4'), f'{key}：CHALLENGE から条件なしの道'
    hh = lambda i: elev.get(i, 0)
    # 隣り合わない地点どうしの距離（高さも含める＝螺旋の上と下は重なってよい）
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
    # 道が交わらない・近すぎない（端を共有しない区間どうし。高さが 20 以上違えば橋＝可）
    S = D['segments']; ends = {k: {v[0], v[1]} for k, v in S.items()}
    bad = []
    for a, b in itertools.combinations(S, 2):
        if ends[a] & ends[b]: continue
        A, B = S[a][3], S[b][3]
        for i in range(len(A) - 1):
            for j in range(len(B) - 1):
                p1, p2, q1, q2 = N[A[i]][:2], N[A[i + 1]][:2], N[B[j]][:2], N[B[j + 1]][:2]
                dh = abs((hh(A[i]) + hh(A[i + 1])) / 2 - (hh(B[j]) + hh(B[j + 1])) / 2)
                if dh >= 20: continue
                t = seg_hit(p1, p2, q1, q2)
                d = min(dist_seg(p1, q1, q2), dist_seg(p2, q1, q2), dist_seg(q1, p1, p2), dist_seg(q2, p1, p2))
                if t is not None or d < 20: bad.append((a, b, round(d, 1))); break
            else: continue
            break
    assert LOOSE or not bad, f'{key}：道が交わる・近すぎる {bad}'
    # 海底の地点は盆地の中（ふちから 14 以上内側）
    basin = WORLD_ART['basin']
    for sid, s in S.items():
        if seg_zone(spec, sid) != 'undersea': continue
        for i in s[3]:
            x, y = N[i][:2]; assert LOOSE or in_poly(basin, x, y) and dist_poly_edge(basin, (x, y)) >= 14, f'{key}：海底の地点 {i} が盆地の外かふちに近い（{x},{y}）'
    # 塔のまわり：道は塔の中を通らない
    for T in WORLD_ART['towers']:
        for k, v in N.items(): assert LOOSE or math.dist(v[:2], T['c']) >= T['r'] + 12, f'{key}：地点 {k} が塔 {T["id"]} の中'
    mr = main_routes(D)
    bad = [m for m in mr if not (0.45 <= m['rivalRatio'] <= 0.80)]
    assert not bad, f'{key}：ライバルの位置 ' + '；'.join(f'{m["rival"]}/{m["total"]}（{m["rivalRatio"]}）{m["segs"]}' for m in bad)
    # 特殊挑戦：成功の道（CHALLENGE → L_MERGE）が失敗の道より短い（Chapter 1 と同じ規則＝成功は近道・失敗は回り道）
    def path_len(start, cond):
        best = None
        def go(node, acc, seen):
            nonlocal best
            if node == 'L_MERGE': best = acc if best is None else min(best, acc); return
            for sid, s in S.items():
                if s[0] == node and s[2] not in SPUR and sid not in seen and (node != 'CHALLENGE' or COND.get(s[2]) == cond): go(s[1], acc + len(s[3]) - 1, seen | {sid})
        go(start, 0, frozenset()); return best
    ok_, ng_ = path_len('CHALLENGE', 'CHALLENGE_5_6'), path_len('CHALLENGE', 'CHALLENGE_1_4')
    assert ok_ is not None and ng_ is not None and ok_ < ng_, f'{key}：特殊挑戦の成功 {ok_} 歩は失敗 {ng_} 歩より短いこと'
    spiral = [sid for sid in S if seg_zone(spec, sid) == 'ascent']
    sp_steps = [len(S[s][3]) - 1 for s in spiral]
    assert spiral and all(12 <= x <= 13 for x in sp_steps), f'{key}：螺旋塔の上昇は 12〜13 歩（{sp_steps}）'
    zones = spec['zones']; zs = set(itertools.chain.from_iterable(zones.values()))
    assert zs == set(S), f'{key}：zones に無い区間 {set(S) ^ zs}'
    byzone = {z: sum(len(S[s][3]) - 1 for s in ss) for z, ss in zones.items()}
    ord_ = sum(1 for v in N.values() if v[2] == 'ordinary_tile')
    return {'route': key, 'name': spec['name'], 'nodes': n_nodes, 'edges': n_edges, 'segments': n_segs, 'ordinary': ord_, 'spurs': len(D['art']['spurs']),
            'freeForks': sum(1 for k in N if sum(1 for e in D['edges'] if e[0] == k and e[3] == 'forward' and e[4] == 'always') > 1),
            'mainRoutes': mr, 'mainTotals': sorted(set(m['total'] for m in mr)), 'rivalSteps': sorted(set(m['rival'] for m in mr)),
            'rivalRatio': [min(m['rivalRatio'] for m in mr), max(m['rivalRatio'] for m in mr)], 'challenge': {'success': ok_, 'fail': ng_}, 'spiralSteps': sp_steps,
            'stepsByZone': byzone, 'minNodeDist': round(mind, 1), 'roles': roles, 'explore': spec.get('explore') or {},
            'exploreNodes': sum(len(S[k][3]) - 1 for k in (spec.get('explore') or {}) if k in S)}

def main():
    OUT_SUM.parent.mkdir(parents=True, exist_ok=True)
    out, summ = {}, {}
    for r in ('A', 'B', 'C'):
        spec = json.loads((SRC / f'spec_{r}.json').read_text(encoding='utf-8'))
        D, st = build(spec); out[r] = D; summ[r] = st
    js = ('// Chapter 2「潮風の海岸」A／B／C 連続世界ボードの道路グラフ（2026-10-15・設計案＝未承認・試作用）。tools/ch2/build_ch2_routes.py が tools/ch2/routes/spec_A/B/C.json から作る。手で書き換えない。\n'
          '// 形式は MMRF_DATA（js/proto/roadfirst-data.js＝Chapter 1 A）と同じ（MMRF_CORE がそのまま進行できる）＋chapter・route・name・concept・names・places・rewardTitles・zones・art。\n'
          '// 本編（MMWD／MMWB・raising.js・セーブ v6）からは参照しない。?chapterBoard=roadfirst&rfData=ch2&ch2route=A|B|C の試作（js/proto/roadfirst-view.js）だけが読む。\n'
          '(function (root) { const R = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n'
          "  if (typeof module === 'object' && module.exports) module.exports = R; else root.MMRF_CH2 = R; })(typeof window !== 'undefined' ? window : globalThis);\n")
    OUT_JS.write_text(js, encoding='utf-8')
    OUT_SUM.write_text(json.dumps(summ, ensure_ascii=False, indent=1), encoding='utf-8')
    for r, st in summ.items():
        print(r, st['name'], 'nodes', st['nodes'], 'edges', st['edges'], 'segments', st['segments'], 'ordinary', st['ordinary'], 'spurs', st['spurs'], 'minDist', st['minNodeDist'], 'challenge', st['challenge'], 'spiral', st['spiralSteps'], 'explore+', st['exploreNodes'])
        print('   本線の総歩数', st['mainTotals'], 'ライバル', st['rivalSteps'], '比率', st['rivalRatio'], 'zones', st['stepsByZone'])
    print('bytes', len(js.encode()))

if __name__ == '__main__':
    main()
