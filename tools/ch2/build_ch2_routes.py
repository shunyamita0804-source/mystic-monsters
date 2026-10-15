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
      行き止まりから戻れる・地点の間隔 15〜28・隣り合わない地点どうしが 12単位以上離れている・ライバルの位置が本線の 50〜70%。
実行：python3 -I tools/ch2/build_ch2_routes.py（リポジトリ直下）。Chapter 1 のデータ（roadfirst-data.js・roadfirst-routes.js）は読まない・変えない。"""
import json, math, itertools
from collections import deque
from pathlib import Path
R = Path(__file__).resolve().parents[2]
SRC = R / 'tools/ch2/routes'
OUT_JS = R / 'js/proto/ch2-routes.js'
OUT_SUM = R / 'tools/ch2/out/summary.json'

COND = {'parity_left': 'Q_odd_only', 'parity_right': 'Q_even_only', 'challenge_fail': 'CHALLENGE_1_4', 'challenge_success': 'CHALLENGE_5_6', 'optional_random_spur': 'unlock_random_event'}
SPUR = {'reward_spur', 'optional_random_spur'}
STEP = 24.0   # 1歩のおおよその長さ（単位）。Chapter 1 A の実測は 15〜28（平均 約21）。Chapter 2 は少し広め（40ターンで 95〜125歩の本線にするため）
REWARD_IDS = ['L_CHEST', 'R_CHEST', 'L_ALTAR', 'L_LATE_ALTAR', 'REWARD5', 'R_SPECIAL']

# Chapter 1 の原本と同じ固定の規則（MMRF_CORE が読む）
FIXED = {
  'version': 'ch2-design-20261015', 'size': [1024, 1536],
  'fixed_rules': {'normal_movement_die': [1, 2, 3, 4, 5, 6], 'training_turn_limit': 40, 'double_dice_consumable': 'two D6 rolled and summed for exactly one move',
                  'reward_once_per_training': True, 'repeat_ability_tile_once_per_training': True, 'no_auto_return': True, 'odd_left_even_right': True,
                  'challenge_success_faces': [5, 6], 'challenge_failure_faces': [1, 2, 3, 4]},
  'draft_rules': {'mainline_direction': 'START_to_GOAL', 'reward_spurs': 'bidirectional forced to return', 'optional_random_unlock': 'branch gate determined at training start and persisted',
                  'pass_through_event': 'stop_at_Q_RIVAL_CHALLENGE_and_reward_endpoint; discard_unused_movement_draft', 'event_dice': 'separate from movement die; no extra turn draft',
                  'hidden_road': 'none; all design roads are intended to be physically drawn'},
  'random_gate': {'id': 'RANDOM_DEN', 'entry_segment': 'D_RAND', 'eligible_to_close': True, 'mainline_affected': False, 'draw_gate_in_art': True, 'opening_probability': 'UNDECIDED'},
}
# 共通の世界（A／B／C で同じ建物・地形。道だけがルートごと）：海面の陸地（港町・小島）・海底の範囲・ガラス回廊・大会会場の島。設計案＝座標は添付の参照画像から読んだ暫定
WORLD_ART = {
  'title': {'small': 'CHAPTER 2', 'name': '潮風の海岸'},
  'sea': '#2d8fc4',
  'regions': [
    {'id': 'town', 'kind': 'land', 'poly': [[0, 1300], [330, 1300], [520, 1380], [560, 1536], [0, 1536]]},
    {'id': 'descent_isle', 'kind': 'land', 'poly': [[340, 905], [460, 905], [470, 1000], [350, 1000]]},
    {'id': 'arch_isle', 'kind': 'land', 'poly': [[380, 1000], [500, 1000], [500, 1080], [380, 1080]]},
    {'id': 'lighthouse_isle', 'kind': 'land', 'poly': [[60, 1020], [170, 1020], [170, 1110], [60, 1110]]},
    {'id': 'temple_isle', 'kind': 'land', 'poly': [[680, 900], [850, 900], [850, 1050], [680, 1050]]},
    {'id': 'shell_isle', 'kind': 'land', 'poly': [[780, 1140], [880, 1140], [880, 1220], [780, 1220]]},
    {'id': 'seabed', 'kind': 'seabed', 'poly': [[120, 300], [900, 300], [900, 930], [120, 930]]},
    {'id': 'glass_dome', 'kind': 'glass', 'poly': [[250, 900], [770, 900], [800, 760], [700, 640], [320, 640], [220, 760]]},
    {'id': 'tower', 'kind': 'tower', 'poly': [[470, 230], [560, 230], [600, 590], [430, 590]]},
    {'id': 'arena_isle', 'kind': 'arena', 'poly': [[296, 60], [735, 60], [735, 150], [296, 150]]},
    {'id': 'west_tower_isle', 'kind': 'land', 'poly': [[110, 150], [200, 150], [200, 230], [110, 230]]},
    {'id': 'statue_isle', 'kind': 'land', 'poly': [[720, 190], [880, 190], [880, 280], [720, 280]]},
    {'id': 'east_isle', 'kind': 'land', 'poly': [[620, 260], [700, 260], [700, 320], [620, 320]]},
  ],
}

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

def build(spec):
    anc, segs = spec['anchors'], spec['segs']
    step = float(spec.get('step', STEP))   # ルートごとの1歩の長さ（B は少し広い 27＝本線を 40ターンで歩ける長さに収めるため。15〜28 の範囲）
    nodes, segments, edges, pts = {}, {}, [], {}
    for sid, s in segs.items():
        a, b, kind, via = s[0], s[1], s[2], s[3]
        line = [tuple(anc[a][:2])] + [tuple(v) for v in via] + [tuple(anc[b][:2])]
        L = plen(line)
        n = s[4] if len(s) > 4 else max(2, round(L / step), math.ceil(L / 28))
        sp = L / n
        assert 15 <= sp <= 28, f'{spec["key"]} 間隔 {sid} {sp:.1f}（歩数 {n}・長さ {L:.0f}）'
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
    D = dict(FIXED)
    D.update(source=f'tools/ch2/routes/spec_{spec["key"]}.json（Chapter 2 A／B／C 設計案・2026-10-15・未承認）', chapter=2, route=spec['key'], name=spec['name'], concept=spec['concept'],
             nodes=nodes, segments=segments, edges=edges, names=spec['names'], places=spec['places'], rewardTitles=spec['rewardTitles'], zones=spec['zones'],
             art=dict(WORLD_ART, spurs=[k for k, s in segs.items() if s[2] in SPUR]))
    stats = check(spec, D, pts)
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

def check(spec, D, pts):
    key, N = spec['key'], D['nodes']
    n_nodes, n_edges, n_segs = len(N), len(D['edges']), len(D['segments'])
    assert 210 <= n_nodes <= 330, f'{key}：地点数 {n_nodes}（目標 280〜320・許容 210〜330＝未達は設計書に明記）'
    roles = {}
    for v in N.values(): roles[v[2]] = roles.get(v[2], 0) + 1
    for role, cnt in [('start', 1), ('goal', 1), ('parity_forced_fork', 1), ('challenge_d6_5_6', 1), ('mandatory_rival', 1), ('optional_random_unlock_dead_end', 1), ('fixed_reward_dead_end', 6), ('lower_walk_through_gate', 1)]:
        assert roles.get(role, 0) == cnt, f'{key}：役割 {role} は {cnt} 個のはず（{roles.get(role, 0)}）'
    assert sorted(k for k, v in N.items() if v[2] == 'fixed_reward_dead_end') == sorted(REWARD_IDS), f'{key}：固定報酬の ID'
    assert reach(D, 'START') == set(N), f'{key}：START から行けない地点 {set(N) - reach(D, "START")}'
    for k in N: assert 'GOAL' in reach(D, k), f'{key}：{k} から GOAL へ行けない'
    assert 'GOAL' not in reach(D, 'START', 'RIVAL'), f'{key}：ライバルを通らずに GOAL へ行ける'
    assert 'GOAL' not in reach(D, 'START', 'LOWER_GATE'), f'{key}：潮の塔（海底へ下りる）を通らずに GOAL へ行ける'
    for sid, s in D['segments'].items():
        if s[2] in SPUR: assert s[0] in reach(D, s[1]), f'{key} {sid}：行き止まりから戻れない'
    # Q から出る道は偶奇の条件だけ・CHALLENGE から出る道は成功／失敗だけ
    for e in D['edges']:
        if e[0] == 'Q' and e[3] == 'forward': assert e[4] in ('Q_odd_only', 'Q_even_only'), f'{key}：Q から条件なしの道'
        if e[0] == 'CHALLENGE' and e[3] == 'forward': assert e[4] in ('CHALLENGE_5_6', 'CHALLENGE_1_4'), f'{key}：CHALLENGE から条件なしの道'
    # 隣り合わない地点どうしの距離（マスが重ならない）
    adj = set()
    for e in D['edges']: adj.add((e[0], e[1])); adj.add((e[1], e[0]))
    ids = list(N); mind, mpair, near = 1e9, None, []
    for a, b in itertools.combinations(ids, 2):
        if (a, b) in adj: continue
        d = math.dist(N[a][:2], N[b][:2])
        if d < mind: mind, mpair = d, (a, b)
        if d < 12: near.append((a, b, round(d, 1)))
    assert not near, f'{key}：地点が近すぎる {near}'
    for k, v in N.items(): assert 20 <= v[0] <= 1004 and 40 <= v[1] <= 1520, (key, k, v)
    mr = main_routes(D)
    bad = [m for m in mr if not (0.45 <= m['rivalRatio'] <= 0.80)]   # 設計目標は 50〜70%。最短の「安全な道」だけ超える（Chapter 1 A も 63〜79%）＝設計書に明記・承認論点
    assert not bad, f'{key}：ライバルの位置 ' + '；'.join(f'{m["rival"]}/{m["total"]}（{m["rivalRatio"]}）{m["segs"]}' for m in bad)
    zones = spec['zones']; zs = set(itertools.chain.from_iterable(zones.values()))
    assert zs == set(D['segments']), f'{key}：zones に無い区間 {set(D["segments"]) ^ zs}'
    byzone = {z: sum(len(D['segments'][s][3]) - 1 for s in ss) for z, ss in zones.items()}
    ord_ = sum(1 for v in N.values() if v[2] == 'ordinary_tile')
    return {'route': key, 'name': spec['name'], 'nodes': n_nodes, 'edges': n_edges, 'segments': n_segs, 'ordinary': ord_, 'spurs': len(D['art']['spurs']),
            'freeForks': sum(1 for v in N.values() if v[2] in ('free_fork', 'late_free_fork')), 'mainRoutes': mr,
            'mainTotals': sorted(set(m['total'] for m in mr)), 'rivalSteps': sorted(set(m['rival'] for m in mr)), 'rivalRatio': [min(m['rivalRatio'] for m in mr), max(m['rivalRatio'] for m in mr)],
            'stepsByZone': byzone, 'minNodeDist': round(mind, 1), 'roles': roles}

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
        print(r, st['name'], 'nodes', st['nodes'], 'edges', st['edges'], 'segments', st['segments'], 'ordinary', st['ordinary'], 'spurs', st['spurs'], 'minDist', st['minNodeDist'])
        print('   本線の総歩数', st['mainTotals'], 'ライバル', st['rivalSteps'], '比率', st['rivalRatio'], 'zones', st['stepsByZone'])
    print('bytes', len(js.encode()))

if __name__ == '__main__':
    main()
