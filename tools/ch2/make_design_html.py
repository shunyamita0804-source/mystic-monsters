#!/usr/bin/env python3
"""Chapter 2 A／B／C の「ルート設計図」（Chapter 1 B／C の設計書と同じ見せ方＝濃紺の地に色分けした道・地点の札・歩数）を1枚の HTML にする。
入力：js/proto/ch2-routes.js（build_ch2_routes.py の出力）・tools/ch2/out/summary.json・tools/ch2/out/sim_600.json
出力：docs/ch2_abc_design_1015/route_design.html（Artifact としても公開する。外部の画像・スクリプトなし＝SVG を直書き）
実行：python3 -I tools/ch2/make_design_html.py"""
import json, html
from collections import deque
from pathlib import Path
R = Path(__file__).resolve().parents[2]
src = (R / 'js/proto/ch2-routes.js').read_text(encoding='utf-8'); DATA = json.loads(src[src.index('const R = ') + 10: src.index(';\n  if (typeof module')])
SUMM = json.loads((R / 'tools/ch2/out/summary.json').read_text(encoding='utf-8'))
SIM = json.loads((R / 'tools/ch2/out/sim_600.json').read_text(encoding='utf-8'))['out']
OUT = R / 'docs/ch2_abc_design_1015/route_design.html'

# 道の色（Chapter 1 の設計書と同じ区分）
KIND_COLOR = {
    'main_left': '#f2a541', 'island_left': '#f2a541', 'ruins_west': '#f2a541',
    'main_right': '#5aa9ff', 'island_right': '#5aa9ff',
    'parity_left': '#b48cff', 'parity_right': '#ff7fb0',
    'late_safe': '#5ad38a',
    'late_challenge_entry': '#ff6a5a', 'challenge_fail': '#ff6a5a', 'challenge_success': '#ff6a5a', 'late_challenge_return': '#ff6a5a',
    'late_right': '#4fd8d0',
    'spiral_ascent': '#ffd27a',
}
SPUR = ('reward_spur', 'optional_random_spur')
GRAY = '#c5cde0'; GOLD = '#e6c35c'
REWARD_NO = {'L_CHEST': '宝1', 'R_CHEST': '宝2', 'L_ALTAR': '宝3', 'L_LATE_ALTAR': '宝4', 'REWARD5': '宝5', 'R_SPECIAL': '宝6', 'RANDOM_DEN': '隠れ家'}
ROUTE_COLOR = {'A': '#8fd3ff', 'B': '#7de3b3', 'C': '#f2b36a'}

def steps_from_start(D):
    fwd = {}
    for e in D['edges']:
        if e[3] == 'forward': fwd.setdefault(e[0], []).append(e[1])
    dist = {'START': 0}; q = deque(['START'])
    while q:
        x = q.popleft()
        for y in fwd.get(x, []):
            if y not in dist: dist[y] = dist[x] + 1; q.append(y)
    return dist

def label_of(D, id_, role, dist):
    places = D.get('places', {})
    if role == 'start': return 'スタート'
    if role == 'goal': return f'大会会場・{dist.get(id_, "?")}歩'
    if role in ('fixed_reward_dead_end', 'optional_random_unlock_dead_end'): return REWARD_NO.get(id_, id_)
    if role == 'mandatory_rival': return f'ライバル・{dist.get(id_, "?")}歩'
    if role in ('free_fork', 'late_free_fork'): return f'分かれ道（自由）・{dist.get(id_, "?")}歩'
    if role == 'parity_forced_fork': return f'運命の分かれ道（奇偶）・{dist.get(id_, "?")}歩'
    if role == 'challenge_d6_5_6': return f'{places.get(id_, "特殊挑戦")}・{dist.get(id_, "?")}歩'
    if role == 'lower_walk_through_gate': return f'潮の塔（海底へ）・{dist.get(id_, "?")}歩'
    if role == 'upper_walk_through_gate': return '遺跡の門'
    if role in ('early_merge', 'parity_rejoin'): return '合流'
    if role == 'final_merge': return '最終合流'
    if role == 'rare_zone_candidate': return '海神像'
    return None

def svg_of(key, D):
    N, S = D['nodes'], D['segments']
    dist = steps_from_start(D)
    parts = []
    # 海面／海底の帯（区域の目安。3ルート共通）
    parts.append('<rect x="0" y="340" width="1024" height="590" rx="18" fill="rgba(90,170,255,.07)"/>')
    parts.append('<text x="18" y="366" class="zone">海底（ガラス回廊・沈没遺跡）</text><text x="18" y="130" class="zone">海面（会場前）</text><text x="18" y="1000" class="zone">海面（港・大橋・小島）</text>')
    for sid, s in S.items():
        pts = [N[i][:2] for i in s[3]]
        d = 'M' + ' L'.join(f'{x:.0f},{y:.0f}' for x, y in pts)
        spur = s[2] in SPUR
        col = GOLD if spur else KIND_COLOR.get(s[2], GRAY)
        dash = ' stroke-dasharray="10 8"' if spur else ''
        parts.append(f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{7 if not spur else 5}" stroke-linecap="round" stroke-linejoin="round"{dash} opacity=".95"/>')
        for x, y in pts[1:-1]:
            parts.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="3.2" fill="rgba(255,255,255,.85)"/>')
    # 札（地点）
    for id_, n in N.items():
        role = n[2]
        if role == 'ordinary_tile': continue
        x, y = n[0], n[1]
        lab = label_of(D, id_, role, dist)
        big = role in ('start', 'goal', 'mandatory_rival', 'free_fork', 'late_free_fork', 'parity_forced_fork', 'challenge_d6_5_6', 'lower_walk_through_gate')
        parts.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{8 if big else 6}" fill="#0f1a33" stroke="#fff" stroke-width="2.2"/>')
        if lab:
            cls = 'lab gold' if role in ('fixed_reward_dead_end', 'optional_random_unlock_dead_end') else 'lab'
            anchor = 'end' if x > 700 else 'start'
            dx = -12 if anchor == 'end' else 12
            parts.append(f'<text x="{x + dx:.0f}" y="{y + 5:.0f}" class="{cls}" text-anchor="{anchor}">{html.escape(lab)}</text>')
    return f'<svg viewBox="-20 60 1064 1480" role="img" aria-label="ルート {key} の設計図">' + ''.join(parts) + '</svg>'

def route_section(key):
    D = DATA[key]; st = SUMM[key]; sim = SIM[f'Ch2-{key}']
    forks = {'A': '自由 → 運命 → ライバル → 自由3択（桟橋／海門の特殊挑戦／海神像）', 'B': '自由 → 自由 → 封印の扉の特殊挑戦 → ライバル → 運命（潮流）', 'C': '海底の自由（ガラス回廊＝運命／西の遺跡＝特殊挑戦）→ ライバル → 自由2択'}[key]
    return f'''
<section class="route" id="route-{key}">
  <h2><span class="rk" style="color:{ROUTE_COLOR[key]}">{key}</span> ルート設計図</h2>
  <div class="board">{svg_of(key, D)}</div>
  <h3 style="color:{ROUTE_COLOR[key]}">{key} {html.escape(D['name'])}</h3>
  <p class="desc">{html.escape(D['concept'])}</p>
  <p class="desc small">分かれ道の順：{forks}</p>
  <dl class="nums">
    <div><dt>地点</dt><dd>{st['nodes']}</dd></div>
    <div><dt>本線</dt><dd>{min(st['mainTotals'])}〜{max(st['mainTotals'])}歩</dd></div>
    <div><dt>ライバル</dt><dd>{'／'.join(str(x) for x in st['rivalSteps'])}歩（{st['rivalRatio'][0]*100:.0f}〜{st['rivalRatio'][1]*100:.0f}%）</dd></div>
    <div><dt>40T 到達率</dt><dd>{sim['goal']}%</dd></div>
    <div><dt>能力の合計上昇</dt><dd>{sim['gain']}</dd></div>
    <div><dt>固定報酬の取得率</dt><dd>{sim['rewardRate']}%</dd></div>
  </dl>
</section>'''

ch1 = SIM['Ch1-A（基準）']
rewards = DATA['A']['rewardTitles']
reward_rows = ''.join(f'<tr><td>{REWARD_NO[k]}</td><td>{html.escape(DATA["A"]["rewardTitles"][k])}</td><td>{html.escape(DATA["B"]["rewardTitles"][k])}</td><td>{html.escape(DATA["C"]["rewardTitles"][k])}</td><td>{eff}</td></tr>'
                      for k, eff in [('L_CHEST', '150G'), ('R_CHEST', '150G'), ('L_ALTAR', '全能力 +10'), ('L_LATE_ALTAR', '全能力 +15'), ('REWARD5', '空腹 −50・100G'), ('R_SPECIAL', '得意な能力 +30'), ('RANDOM_DEN', '200G（出発時に開閉 50%）')])

page = f'''<title>Chapter2 A/B/C ルート設計図</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@600;800&family=Noto+Sans+JP:wght@400;700&display=swap">
<style>
/* 濃紺の盤の上に色分けした道＝Chapter 1 B／C の設計書と同じ見せ方。単一の暗いテーマ（意図して固定） */
:root{{--bg:#0b1636;--panel:#0f1d3f;--fg:#e9eefb;--mute:#aab6d3;--gold:#e6c35c;--line:#243463;--display:"Shippori Mincho",serif;--body:"Noto Sans JP",system-ui,sans-serif;color-scheme:dark}}
body{{background:var(--bg);color:var(--fg);font-family:var(--body);line-height:1.65;padding-block:20px 48px;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}}
main{{max-width:760px;margin:0 auto;display:grid;gap:28px}}
h1{{font-family:var(--display);font-weight:800;font-size:1.7rem;line-height:1.3;margin:0;text-wrap:balance}}
h2{{font-family:var(--display);font-weight:800;font-size:1.5rem;margin:0 0 10px;padding-bottom:8px;border-bottom:3px solid var(--gold);display:flex;gap:12px;align-items:baseline}}
h2 .rk{{font-size:1.1rem;font-family:var(--body);font-weight:700}}
h3{{font-family:var(--display);font-weight:800;font-size:1.25rem;margin:14px 0 4px}}
.tag{{display:inline-block;border:1px solid #d9534f;color:#ff9a94;border-radius:999px;padding:2px 12px;font-size:.85rem;margin-right:8px}}
.lead{{color:var(--mute);margin:8px 0 0}}
.board{{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:10px;overflow-x:auto}}
.board svg{{width:100%;height:auto;display:block;max-width:100%}}
.board text.lab{{font-family:var(--body);font-size:26px;font-weight:700;fill:#fff;paint-order:stroke;stroke:#0b1636;stroke-width:6px;stroke-linejoin:round}}
.board text.lab.gold{{fill:var(--gold)}}
.board text.zone{{font-family:var(--body);font-size:22px;fill:rgba(170,190,230,.55)}}
.desc{{margin:4px 0;color:var(--fg)}}.desc.small{{color:var(--mute);font-size:.95rem}}
.nums{{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px 14px;margin:10px 0 0}}
.nums div{{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:8px 12px;min-width:0}}
.nums dt{{font-size:.78rem;color:var(--mute);letter-spacing:.06em}}.nums dd{{margin:0;font-weight:700;font-variant-numeric:tabular-nums}}
.legend{{display:flex;flex-wrap:wrap;gap:8px 18px;font-size:.95rem;color:var(--mute)}}
.legend span::before{{content:"";display:inline-block;width:28px;height:5px;border-radius:3px;margin-right:8px;vertical-align:middle;background:var(--c)}}
.legend span.dash::before{{background:repeating-linear-gradient(90deg,var(--c) 0 8px,transparent 8px 13px)}}
table{{border-collapse:collapse;width:100%;font-size:.92rem}}th,td{{border-bottom:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}}th{{color:var(--mute);font-weight:700}}
.wrap{{overflow-x:auto}}
ol{{padding-left:1.3em;margin:6px 0}}li{{margin:4px 0}}
.note{{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:12px 16px;color:var(--mute);font-size:.95rem}}
@media (prefers-reduced-motion:no-preference){{a:focus-visible{{outline:2px solid var(--gold);outline-offset:2px}}}}
a{{color:#8fd3ff}}
</style>
<main>
<header>
  <span class="tag">設計案・未承認</span><span class="tag" style="border-color:var(--line);color:var(--mute)">2026-10-15</span>
  <h1>Chapter 2「潮風の海岸」A／B／C ルート設計図</h1>
  <p class="lead">1枚の世界（1024×1536＝添付の世界観参照と同じ座標）。港町・白い大橋・小島・潮の塔・ガラス回廊・沈没遺跡・螺旋塔・会場の位置は3ルート共通で、<b>道だけがルートごとに違う別のグラフ</b>。3本とも「港 → 海上 → 潮の塔で海底へ → ガラス回廊／沈没遺跡 → 螺旋塔の門前でライバル → 海面へ → 大会会場」を必ず通る。サイコロ 1〜6・40ターン。</p>
  <div class="legend" style="margin-top:12px">
    <span style="--c:#f2a541">左の道（浜・小島伝い・西の遺跡）</span><span style="--c:#5aa9ff">右の道（白い大橋・神殿島）</span>
    <span style="--c:#b48cff">奇数の道（Q_L）</span><span style="--c:#ff7fb0">偶数の道（Q_R）</span>
    <span style="--c:#5ad38a">後半・安全（桟橋）</span><span style="--c:#ff6a5a">特殊挑戦（海門／封印の扉／封印の間）</span><span style="--c:#4fd8d0">後半・海神像の島</span>
    <span style="--c:#ffd27a">螺旋塔の斜路（上り）</span><span style="--c:#c5cde0">共通の本線（港・潮の塔・回廊の出口）</span><span class="dash" style="--c:#e6c35c">寄り道（行き止まり・宝）</span>
  </div>
</header>
{route_section('A')}
{route_section('B')}
{route_section('C')}
<section>
  <h2>固定報酬の7枠（効果は Chapter 1 と同じ・名前だけ景色に合わせた仮案）</h2>
  <div class="wrap"><table><thead><tr><th>枠</th><th>A</th><th>B</th><th>C</th><th>効果（TUNING.rewards【暫定】）</th></tr></thead><tbody>{reward_rows}</tbody></table></div>
</section>
<section>
  <h2>比較（参考：Chapter 1 A＝到達 {ch1['goal']}%・上昇 {ch1['gain']}・報酬 {ch1['rewardRate']}%）</h2>
  <div class="wrap"><table><thead><tr><th></th><th>A</th><th>B</th><th>C</th></tr></thead><tbody>
  <tr><td>地点数</td><td>{SUMM['A']['nodes']}</td><td>{SUMM['B']['nodes']}</td><td>{SUMM['C']['nodes']}</td></tr>
  <tr><td>本線の歩数</td><td>{min(SUMM['A']['mainTotals'])}〜{max(SUMM['A']['mainTotals'])}</td><td>{min(SUMM['B']['mainTotals'])}〜{max(SUMM['B']['mainTotals'])}</td><td>{min(SUMM['C']['mainTotals'])}〜{max(SUMM['C']['mainTotals'])}</td></tr>
  <tr><td>40T 以内の GOAL 到達率</td><td>{SIM['Ch2-A']['goal']}%</td><td>{SIM['Ch2-B']['goal']}%</td><td>{SIM['Ch2-C']['goal']}%</td></tr>
  <tr><td>6能力の合計上昇</td><td>{SIM['Ch2-A']['gain']}</td><td>{SIM['Ch2-B']['gain']}</td><td>{SIM['Ch2-C']['gain']}</td></tr>
  <tr><td>固定報酬の取得率</td><td>{SIM['Ch2-A']['rewardRate']}%</td><td>{SIM['Ch2-B']['rewardRate']}%</td><td>{SIM['Ch2-C']['rewardRate']}%</td></tr>
  </tbody></table></div>
  <p class="note">600 seed × ソラモ・ガウル。試作の進行モデル（バトル・食事・Chapter 2 の上昇量は未反映）＝比較が目的で絶対値は参考。詳細は docs/ch2_abc_design_1015/COMPARISON.md。</p>
</section>
<section>
  <h2>承認が要る論点</h2>
  <ol>
    <li>ライバルの位置：本線の 53〜78%（最短の安全な道だけ 70% を超える。Chapter 1 A は 63〜79%）。</li>
    <li>B の到達率が A より約 −5pt（目標 ±3pt）。B の最初の小さな輪を外すか、歩幅をさらに広げるか。</li>
    <li>螺旋塔の上り＝斜路 12〜13 歩（高さはカメラで表せない＝塔の絵で見せる）。</li>
    <li>地点数 216〜256（目標 280〜320 に未達。40ターン・D6 で歩ける本線にしたため）。寄り道を足すか、45ターンにするか。</li>
    <li>固定報酬の絵と中身の対応（上の表）。</li>
  </ol>
  <p class="note">新しい画像：最小 24 種（最優先 8）。添付の旧 Chapter 2 の背景 10 枚は使わない（俯瞰図だけ出発準備のカードと中継カットに流用）。Chapter 1 のマス・サイコロ・UI・HUD はそのまま。</p>
</section>
</main>
'''
OUT.write_text(page, encoding='utf-8')
print('wrote', OUT, len(page.encode()), 'bytes')
