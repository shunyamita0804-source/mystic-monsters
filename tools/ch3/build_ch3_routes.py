#!/usr/bin/env python3
"""Chapter 3「天空の浮島」A／B／C の道路グラフ（2026-10-18）js/proto/ch3-routes.js（MMRF_CH3）を作る。手で js を書き換えない。
作り方（RoadFirst の文法）：Chapter 1 の A（MMRF_DATA）と同じ 42区間の部品（歩数・種類・通行条件・寄り道の戻り・地点 ID）をそのまま使う＝
  固定マス（運命の分かれ道・封印の門・ライバル・寄り道の報酬・隠れ家・合流）の種類と数・40ターンの公平性は Chapter 1 と同じ。
  形は Chapter 1 の3つの道の形（A＝縦の菱形・C＝渦巻き・B＝Z字）を、空の世界に合わせてなめらかにゆがめた別の形（地点は1つずつ写すだけ＝順番・つながりは同じ）。
    Ch3 A「白亜の大橋」  ← Ch1 A の形を S字にゆらす（左右に振れながら上へ登る）
    Ch3 B「雲海の螺旋」  ← Ch1 C の渦巻きを中心のまわりにねじる（外から内へ巻いて中央の天空闘技場へ）
    Ch3 C「風の浮島めぐり」← Ch1 B の Z字を波打たせる（左右へ渡りながら上へ）
  空の世界の作り：世界の全体が雲海（cloud）。浮島（islands＝地点のまわりの丸い陸）だけが草地。浮島の外を通る道はすべて白い空の橋（bridges）。
検査：299地点・370接続・42区間・Chapter 1 と部品が同じ・全地点から GOAL・ライバルと H を必ず通る・ライバルの比率 50〜70%（A の形は Chapter 1 A と同じ 63〜79%）・
  区間の平均の間隔 15〜28・世界の内側・隣り合わない地点が 12 単位以上離れている・道どうしが交わらない。
実行：python3 -I tools/ch3/build_ch3_routes.py（リポジトリ直下）"""
import json, math, itertools
from collections import deque
from pathlib import Path
R = Path(__file__).resolve().parents[2]
def load_js(rel, a, b):
    s = (R / rel).read_text(encoding='utf-8'); return json.loads(s[s.index(a) + len(a): s.index(b)])
A = load_js('js/proto/roadfirst-data.js', 'const D = ', ';\n  if (typeof module')
BC = load_js('js/proto/roadfirst-routes.js', 'const R = ', ';\n  if (typeof module')
SRC = {'A': A, 'B': BC['C'], 'C': BC['B']}   # Ch3 の道 → 形の元（Chapter 1 の道）
SPUR = {'reward_spur', 'optional_random_spur'}
W, H = 1024, 1536

def warp_A(x, y):   # S字：左右に振れながら上へ
    return (512 + (x - 512) * 0.95 + 36 * math.sin(math.pi * (y - 60) / 700), 62 + (y - 60) * 0.99)
def warp_B(x, y):   # 渦巻きをねじる（中心ほど強く回す・向きは変えない＝左右は保つ）
    cx, cy = 512, 790; dx, dy = x - cx, y - cy; r = math.hypot(dx, dy); a = math.atan2(dy, dx) + 0.30 * max(0, 1 - r / 820)
    k = 0.93; return (cx + r * math.cos(a) * k, cy + r * math.sin(a) * 0.97)
def warp_C(x, y):   # Z字を波打たせる
    return (512 + (x - 512) * 0.9 + 34 * math.sin(math.pi * y / 520), y + 26 * math.sin(2 * math.pi * x / 900))
WARP = {'A': warp_A, 'B': warp_B, 'C': warp_C}

NAME = {'A': '白亜の大橋', 'B': '雲海の螺旋', 'C': '風の浮島めぐり'}
CONCEPT = {'A': '風の発着場から白い空の橋を渡り、左右に振れながら天空闘技場へ登る王道',
           'B': '雲海の外まわりから渦を巻いて内へ。中央の天空闘技場を目指す螺旋の道',
           'C': '浮島から浮島へ、左右へ大きく渡りながら上へ登る風の道'}
# 道の名前（分かれ道の選択シート）・場所の名前・宝の名前（仮案＝ユーザーの承認前）
NAMES = {'EL01': '左の白い橋', 'ER01': '右の白い橋', 'LATE_SAFE': '雲海の尾根橋', 'LATE_L1': '風の神殿の門へ', 'LATE_R1': '結晶の浮島へ',
         'D_LC': '寄り道（東屋の浮島）', 'D_LA': '寄り道（古い列柱）', 'D_RC': '寄り道（青い結晶）', 'D_LLA': '寄り道（雲の祠）', 'D_R5': '寄り道（見張りの像）', 'D_RS': '寄り道（虹の滝）', 'D_RAND': '寄り道（隠れ家）'}
PLACES = {'START': '風の発着場', 'J0': '最初の分かれ橋', 'P': '雲の広場', 'LOWER_GATE': '下の空門', 'Q': '運命の浮島', 'R': '合流の浮島', 'UPPER_GATE': '上の空門',
          'RIVAL': 'ライバルの待つ浮島', 'H': '最後の分かれ橋', 'CHALLENGE': '風の神殿の門', 'STATUE': '結晶の浮島', 'FINAL': '闘技場の前の浮島', 'GOAL': '天空闘技場'}
TITLES = {'L_CHEST': '東屋の浮島の宝', 'R_CHEST': '青い結晶の宝', 'L_ALTAR': '古い列柱の宝', 'L_LATE_ALTAR': '雲の祠の宝', 'REWARD5': '見張りの像の宝', 'R_SPECIAL': '虹の滝の宝', 'RANDOM_DEN': '雲の隠れ家'}
SKY = './assets/fields/ch3/sky_1016/'
LM = [  # 目印（空の正式素材＝ARCH／ENV。足りない所は Chapter 1 の正式の目印を代用）
  # 2026-10-20 追加指示（Chapter 3 の門の確認）：橋のアーチの口は絵の幅の約 55%（左の柱 0.12〜0.22・右の柱 0.77〜0.89）。旧 START 幅 40＝口 22 単位＜道幅 23（縁石の外まで）＝柱が縁石にかかっていた・
  #  START の門は円の広場（半径 18.4）の中に立っていた（along 9）。START は広場の出口（along 20）・幅 46＝口 25 単位、下の門も幅 46（旧 44＝口 24）
  {'node': 'START', 'file': SKY + 'C3_ARCH_white_bridge_arch_pier.webp', 'w': 46, 'along': 20, 'z': -30},
  {'node': 'LOWER_GATE', 'file': SKY + 'C3_ARCH_white_bridge_arch_pier.webp', 'w': 46, 'along': 3, 'z': -30},
  {'node': 'UPPER_GATE', 'file': SKY + 'C3_ARCH_white_bridge_arch_pier.webp', 'w': 48, 'along': 3, 'z': -30},
  {'node': 'CHALLENGE', 'file': SKY + 'C3_ARCH_ruined_colonnade.webp', 'w': 46, 'along': 14, 'z': -30},
  {'node': 'STATUE', 'file': SKY + 'C3_ENV_crystal_cluster_blue.webp', 'w': 30, 'off': [-34, -18], 'z': -30},
  {'node': 'L_CHEST', 'file': SKY + 'C3_ARCH_sky_pavilion.webp', 'w': 42, 'along': 20, 'z': -30},
  {'node': 'R_CHEST', 'file': SKY + 'C3_ENV_crystal_cluster_blue.webp', 'w': 34, 'along': 18, 'z': -30},
  {'node': 'L_ALTAR', 'file': SKY + 'C3_ARCH_ruined_colonnade.webp', 'w': 42, 'along': 20, 'z': -30},
  {'node': 'L_LATE_ALTAR', 'file': 'lm_cliff_shrine.webp', 'w': 40, 'along': 20, 'z': -30},
  {'node': 'REWARD5', 'file': 'lm_watch_statue.webp', 'w': 42, 'along': 20, 'z': -30},
  {'node': 'R_SPECIAL', 'file': 'lm_rainbow_falls.webp', 'w': 44, 'along': 22, 'z': -30},
  {'node': 'RANDOM_DEN', 'file': 'lm_den_closed.webp', 'open': 'lm_den_open.webp', 'w': 42, 'along': 20, 'z': -30}]
# 浮島の大きさ（地点の役割 → 半径・単位）
ISLE_R = {'start': 64, 'goal': 98, 'final_merge': 44, 'free_fork': 50, 'late_free_fork': 50, 'early_merge': 52, 'parity_forced_fork': 46, 'parity_rejoin': 46,
          'lower_walk_through_gate': 34, 'upper_walk_through_gate': 34, 'mandatory_rival': 48, 'challenge_d6_5_6': 52, 'rare_zone_candidate': 50,
          'fixed_reward_dead_end': 46, 'optional_random_unlock_dead_end': 44, 'challenge_failure_route': 32, 'challenge_success_route': 32, 'route_anchor': 36}
CALM = {'A': ['S01', 'EL01', 'ER01'], 'B': ['S01', 'EL01', 'ER01'], 'C': ['S01', 'Q_L1', 'Q_R1', 'Q_L2', 'Q_R2']}   # 元の形と同じ（落ち着いた区間）

def blob(cx, cy, r, seed):
    pts = []; n = 22
    for i in range(n):
        a = 2 * math.pi * i / n; w = 1 + 0.12 * math.sin(3 * a + seed) + 0.07 * math.sin(5 * a + seed * 1.7) + 0.04 * math.sin(9 * a + seed * 0.3)
        pts.append([round(cx + math.cos(a) * r * w, 1), round(cy + math.sin(a) * r * w * 0.92, 1)])
    return pts

def dist_seg(p, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]; L = dx * dx + dy * dy or 1
    t = max(0, min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L)); return math.dist(p, (a[0] + dx * t, a[1] + dy * t))
def seg_hit(p1, p2, q1, q2):
    def o(a, b, c): return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
    d1, d2, d3, d4 = o(q1, q2, p1), o(q1, q2, p2), o(p1, p2, q1), o(p1, p2, q2)
    return (d1 > 0) != (d2 > 0) and (d3 > 0) != (d4 > 0)

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
    S = D['segments']; L = {k: len(v[3]) - 1 for k, v in S.items()}; nxt = {}
    for k, v in S.items():
        if v[2] not in SPUR: nxt.setdefault(v[0], []).append(k)
    out = []
    def walk(node, path):
        if node == 'GOAL': out.append(path); return
        for k in nxt.get(node, []): walk(S[k][1], path + [k])
    walk('START', [])
    return [(sum(L[k] for k in p), next(sum(L[k] for k in p[:i + 1]) for i, k in enumerate(p) if S[k][1] == 'RIVAL')) for p in out]

def build(key):
    S0, wp = SRC[key], WARP[key]
    nodes = {k: [round(wp(v[0], v[1])[0], 2), round(wp(v[0], v[1])[1], 2), v[2], v[3]] for k, v in S0['nodes'].items()}
    D = {k: S0[k] for k in ('version', 'size', 'fixed_rules', 'draft_rules', 'branch_permissions', 'random_gate')}
    D.update(source=f'tools/ch3/build_ch3_routes.py（Chapter 1 の部品・{key}）', chapter=3, route=key, name=NAME[key], concept=CONCEPT[key],
             nodes=nodes, segments=S0['segments'], edges=S0['edges'], names=NAMES, places=PLACES, rewardTitles=TITLES, calm=CALM[key])
    # 浮島：役割のある地点（端の地点）のまわり＋長い橋の真ん中の小島
    isles = []
    for k, v in nodes.items():
        if v[3] is None: isles.append({'at': k, 'poly': blob(v[0], v[1] - (14 if k == 'GOAL' else 0), ISLE_R.get(v[2], 36), len(isles) * 1.37)})
    for sid, s in D['segments'].items():
        ids = s[3]
        if len(ids) - 1 >= 10 and s[2] not in SPUR:
            mid = ids[len(ids) // 2]; v = nodes[mid]; isles.append({'at': mid, 'poly': blob(v[0], v[1], 30, len(isles) * 1.37)})
    D['art'] = {'sky': True, 'title': {'small': 'CHAPTER 3', 'name': '天空の浮島'},
                'terrain': [{'id': 'sky', 'kind': 'cloud', 'edge': 'cloud', 'poly': [[-40, -40], [W + 40, -40], [W + 40, H + 40], [-40, H + 40]], 'arms': [], 'bridges': list(D['segments']), 'water': []}],
                'islands': [i['poly'] for i in isles], 'isleAt': [i['at'] for i in isles], 'peaks': [], 'landmarks': LM}
    check(key, D)
    return D

def check(key, D):
    N, S = D['nodes'], D['segments']
    assert len(N) == 299 and len(D['edges']) == 370 and len(S) == 42
    assert reach(D, 'START') == set(N)
    for k in N: assert 'GOAL' in reach(D, k), k
    assert 'GOAL' not in reach(D, 'START', 'RIVAL') and 'GOAL' not in reach(D, 'START', 'H')
    lo, hi = (0.6, 0.8) if key == 'A' else (0.5, 0.7)   # A の形＝Chapter 1 A（ユーザー承認済みの 63〜79%）のまま・B／C は 50〜70%
    for tot, rv in main_routes(D): assert lo <= rv / tot <= hi, (key, tot, rv)
    for k, v in N.items(): assert 30 <= v[0] <= 994 and 50 <= v[1] <= 1510, (key, k, v)
    for sid, s in S.items():
        P = [N[i][:2] for i in s[3]]; L = sum(math.dist(P[i], P[i + 1]) for i in range(len(P) - 1)) / (len(P) - 1)
        assert 14 <= L <= 29, (key, sid, round(L, 1))
    adj = set()
    for e in D['edges']: adj.add((e[0], e[1])); adj.add((e[1], e[0]))
    near = [(a, b) for a, b in itertools.combinations(N, 2) if (a, b) not in adj and math.dist(N[a][:2], N[b][:2]) < 12]
    assert not near, (key, near[:6])
    ends = {k: {v[0], v[1]} for k, v in S.items()}
    for a, b in itertools.combinations(S, 2):
        if ends[a] & ends[b]: continue
        A_, B_ = S[a][3], S[b][3]
        for i in range(len(A_) - 1):
            for j in range(len(B_) - 1):
                assert not seg_hit(N[A_[i]][:2], N[A_[i + 1]][:2], N[B_[j]][:2], N[B_[j + 1]][:2]), (key, '交差', a, b)

def main():
    out = {k: build(k) for k in ('A', 'B', 'C')}
    js = ('// Chapter 3「天空の浮島」A／B／C の道路グラフ（2026-10-18）。tools/ch3/build_ch3_routes.py が作る。手で書き換えない。\n'
          '// 形式は MMRF_DATA（js/proto/roadfirst-data.js）と同じ（MMRF_CORE がそのまま進行）＋chapter・route・name・concept・names・places・rewardTitles・calm・art（sky＝空の世界）。\n'
          '(function (root) { const R = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n'
          "  if (typeof module === 'object' && module.exports) module.exports = R; else root.MMRF_CH3 = R; })(typeof window !== 'undefined' ? window : globalThis);\n")
    (R / 'js/proto/ch3-routes.js').write_text(js, encoding='utf-8')
    for k, D in out.items():
        rs = sorted(set(main_routes(D))); xs = [v[0] for v in D['nodes'].values()]; ys = [v[1] for v in D['nodes'].values()]
        print(k, D['name'], '本線（総歩数, ライバル）', rs[:3], '…', len(rs), '本', 'x', round(min(xs)), round(max(xs)), 'y', round(min(ys)), round(max(ys)), '浮島', len(D['art']['islands']))
    print('bytes', len(js.encode()))
if __name__ == '__main__':
    main()
