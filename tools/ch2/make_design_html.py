#!/usr/bin/env python3
"""Chapter 2 A／B／C の「ルート設計図」（Chapter 1 B／C の設計書と同じ見せ方＝濃紺の地に色分けした道・地点の札・歩数）を1枚の HTML にする。
入力：js/proto/ch2-routes.js（build_ch2_routes.py の出力）・tools/ch2/out/summary.json・tools/ch2/out/sim_12000.json
出力：docs/ch2_abc_design_1015/route_design.html（Artifact としても公開する。外部の画像・スクリプトなし＝SVG を直書き）
実行：python3 -I tools/ch2/make_design_html.py"""
import json, html, base64, io
from collections import deque
from pathlib import Path
R = Path(__file__).resolve().parents[2]
src = (R / 'js/proto/ch2-routes.js').read_text(encoding='utf-8'); DATA = json.loads(src[src.index('const R = ') + 10: src.index(';\n  if (typeof module')])
SUMM = json.loads((R / 'tools/ch2/out/summary.json').read_text(encoding='utf-8'))
SIM = json.loads((R / 'tools/ch2/out/sim_12000.json').read_text(encoding='utf-8'))['out']
SIM50 = json.loads((R / 'tools/ch2/out/sim_12000_spur50.json').read_text(encoding='utf-8'))['out']   # 2026-10-15 追補2：寄り道 50%
# 2026-10-15 追補2：特殊挑戦の案（tools/ch2/out/challenge_variants.json＝sim.mjs で測った値。COMPARISON.md・DESIGN.md と同じ）
VAR = json.loads((R / 'tools/ch2/out/challenge_variants.json').read_text(encoding='utf-8'))
B_VARIANTS = [(('<b>' + a + '</b>') if '採用' in a else a, b, (f'{c:+.1f}' if c else '±0.0'), (f'{d:+.1f}' if d else '±0.0'), e) for a, b, c, d, e in VAR['B']]
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
    'late_west': '#5ad38a', 'glass_main': '#c5cde0', 'undersea_main': '#c5cde0',
}
EXPLORE = '#b8f06a'   # 探索路（2026-10-15 追補・論点 4）
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
    # 海底の盆地（海面より 36 低い）・島・塔（3ルート共通）
    A = D['art']
    for reg in A['regions']:
        parts.append('<polygon points="' + ' '.join(f'{x},{y}' for x, y in reg['poly']) + '" fill="rgba(230,214,160,.10)" stroke="rgba(230,214,160,.25)"/>')
    parts.append('<polygon points="' + ' '.join(f'{x},{y}' for x, y in A['basin']) + '" fill="rgba(90,170,255,.10)" stroke="rgba(120,190,255,.45)" stroke-width="3" stroke-dasharray="12 8"/>')
    for t in A['towers']:
        parts.append(f'<circle cx="{t["c"][0]}" cy="{t["c"][1]}" r="{t["r"]}" fill="rgba(230,214,160,.18)" stroke="#e6c35c" stroke-width="3"/>')
        parts.append(f'<text x="{t["c"][0]}" y="{t["c"][1] + 8}" class="zone" text-anchor="middle">{"螺旋塔" if t["kind"] == "spiral" else "潮の塔"}</text>')
    parts.append(f'<text x="190" y="400" class="zone">海底の盆地（海面 −{A["depth"]}）</text><text x="18" y="130" class="zone">海面（会場前）</text><text x="18" y="1000" class="zone">海面（港・大橋・小島）</text>')
    for sid, s in S.items():
        pts = [N[i][:2] for i in s[3]]
        d = 'M' + ' L'.join(f'{x:.0f},{y:.0f}' for x, y in pts)
        spur = s[2] in SPUR
        col = GOLD if spur else KIND_COLOR.get(s[2], GRAY)
        dash = ' stroke-dasharray="10 8"' if spur else ''
        parts.append(f'<path d="{d}" fill="none" stroke="{col}" stroke-width="{7 if not spur else 5}" stroke-linecap="round" stroke-linejoin="round"{dash} opacity=".95"/>')
        if sid in D.get('explore', {}): parts.append(f'<path d="{d}" fill="none" stroke="{EXPLORE}" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 7" opacity="1"/>')
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
    forks = {'A': '自由 → 運命 → ライバル → 自由3択（桟橋2本／海門の特殊挑戦／海神像）', 'B': '自由 → 自由 → 自由 → 封印の扉の特殊挑戦 → ライバル → 運命（潮流）', 'C': '海底の自由（ガラス回廊＝運命／西の遺跡＝特殊挑戦）→ ライバル → 自由2択'}[key]
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
    <div><dt>特殊挑戦 成功／失敗</dt><dd>{st['challenge']['success']}／{st['challenge']['fail']}歩</dd></div>
    <div><dt>螺旋塔の上り</dt><dd>{st['spiralSteps'][0]}歩（−{D['art']['depth']} → 0）</dd></div>
    <div><dt>探索路</dt><dd>{len(st['explore'])}区間・{st['exploreNodes']}地点</dd></div>
  </dl>
  <p class="desc small">探索路：{'・'.join(html.escape(x['name']) for x in D['explore'].values())}</p>
</section>'''

ch1 = SIM['Ch1-A（基準）']
rewards = DATA['A']['rewardTitles']
CN = {'gold150': '150G', 'all10': '全能力 +10', 'all15': '全能力 +15', 'food': '空腹 −50・100G', 'best30': '得意な能力 +30', 'gold200': '200G'}
reward_rows = ''.join(f'<tr><td>{REWARD_NO[k]}</td>' + ''.join(f'<td>{html.escape(DATA[r]["rewards"][k]["title"])}<br><b>{CN[DATA[r]["rewards"][k]["key"]]}</b></td>' for r in 'ABC') + '</tr>'
                      for k in ['L_CHEST', 'R_CHEST', 'L_ALTAR', 'L_LATE_ALTAR', 'REWARD5', 'R_SPECIAL', 'RANDOM_DEN'])
def img64(path, w=360):
    from PIL import Image
    p = R / path
    if not p.exists(): return ''
    im = Image.open(p).convert('RGB'); im.thumbnail((w, 2000)); b = io.BytesIO(); im.save(b, 'JPEG', quality=72)
    return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()
SH = 'docs/ch2_abc_design_1015/shots/'
PREV = [(SH + 'ch2proto_A_390x844_start.png', 'A：港（START）'), (SH + 'ch2proto_A_390x844_spiral1.png', 'A：螺旋塔の斜路（海底から上る）'), (SH + 'ch2proto_A_390x844_spiral2.png', 'A：斜路の途中（塔の東面を回る）'),
        (SH + 'ch2proto_A_390x844_top.png', 'A：頂上（海面の高さ）'), (SH + 'ch2proto_C_390x844_spiral1.png', 'C：海底の回廊から塔へ'), (SH + 'ch2proto_B_390x844_spiral2.png', 'B：螺旋塔の斜路'),
        (SH + 'ch2proto_B_390x844_undersea.png', 'B：海底（ガラス回廊・遺跡の柱・海中の光）'), (SH + 'ch2proto_C_390x844_undersea.png', 'C：海底の分かれ道（砂地の地面の上の回廊）')]
prev_html = ''.join(f'<figure><img src="{u}" alt="{html.escape(c)}" loading="lazy"><figcaption>{html.escape(c)}</figcaption></figure>' for u, c in ((img64(p), c) for p, c in PREV) if u)

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
.shots{{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:10px 0}}.shots figure{{margin:0}}.shots img{{width:100%;height:auto;display:block;border-radius:12px;border:1px solid var(--line)}}.shots figcaption{{font-size:.82rem;color:var(--mute);margin-top:4px}}
code{{font-size:.85em;word-break:break-all}}
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
    <span style="--c:#ffd27a">螺旋塔の斜路（上り）</span><span class="dash" style="--c:#b8f06a">探索路（論点 4）</span><span style="--c:#c5cde0">共通の本線（港・潮の塔・回廊の出口）</span><span class="dash" style="--c:#e6c35c">寄り道（行き止まり・宝）</span>
  </div>
</header>
{route_section('A')}
{route_section('B')}
{route_section('C')}
<section>
  <h2>2.5D の世界ボード（論点 3・プレビュー）</h2>
  <p class="desc">海底は海面より {DATA['A']['art']['depth']} 低い<b>盆地の板</b>、潮の塔の下り坂と螺旋塔の上り坂は<b>高さの変わる石の斜路</b>、塔は<b>海底から海面より上へそびえる多角柱</b>。マスもモンスターも斜路の高さで上がり、海底へ潜ると盆地の上の海面が薄くなり、画面に海中の光の筋が差す。<b>海底の道は高架橋にしない</b>：海底は砂地の地面（砂紋・藻場・岩の斑・光の網）で、ガラス回廊は地面に置いた透明な筒（両側の光る縁と骨組みの輪）、封印の扉・遺跡の門などの要の地点は沈没遺跡の広場（割れた敷石と崩れた柱）につながる。見た目は仮で未承認。絵は Chapter 1 の正式素材の代用（正式の Chapter 2 の素材は素材要求一覧）。カメラは本編の Chapter 1 と同じ（後ろから追う）。</p>
  <div class="shots">{prev_html}</div>
  <p class="note">プレビュー：ローカルの index.html に <code>?chapterBoard=roadfirst&amp;rfData=ch2&amp;ch2route=A</code>（B・C も）。HUD と操作欄は試作の画面（本編の HUD ではない）。main 未改変・公開なし・iPhone 実機は未確認。</p>
</section>
<section>
  <h2>固定報酬の7枠（論点 5：種類と数は Chapter 1 と同じ・建物と景観に合わせて割り当て直し・値は【仮】）</h2>
  <div class="wrap"><table><thead><tr><th>枠</th><th>A</th><th>B</th><th>C</th></tr></thead><tbody>{reward_rows}</tbody></table></div>
</section>
<section>
  <h2>比較（参考：Chapter 1 A＝到達 {ch1['goal']}%・上昇 {ch1['gain']}・報酬 {ch1['rewardRate']}%）</h2>
  <div class="wrap"><table><thead><tr><th></th><th>A</th><th>B</th><th>C</th></tr></thead><tbody>
  <tr><td>地点数</td><td>{SUMM['A']['nodes']}</td><td>{SUMM['B']['nodes']}</td><td>{SUMM['C']['nodes']}</td></tr>
  <tr><td>本線の歩数</td><td>{min(SUMM['A']['mainTotals'])}〜{max(SUMM['A']['mainTotals'])}</td><td>{min(SUMM['B']['mainTotals'])}〜{max(SUMM['B']['mainTotals'])}</td><td>{min(SUMM['C']['mainTotals'])}〜{max(SUMM['C']['mainTotals'])}</td></tr>
  <tr><td>40T 以内の GOAL 到達率</td><td>{SIM['Ch2-A']['goal']}%</td><td>{SIM['Ch2-B']['goal']}%</td><td>{SIM['Ch2-C']['goal']}%</td></tr>
  <tr><td>6能力の合計上昇</td><td>{SIM['Ch2-A']['gain']}</td><td>{SIM['Ch2-B']['gain']}</td><td>{SIM['Ch2-C']['gain']}</td></tr>
  <tr><td>固定報酬の取得率</td><td>{SIM['Ch2-A']['rewardRate']}%</td><td>{SIM['Ch2-B']['rewardRate']}%</td><td>{SIM['Ch2-C']['rewardRate']}%</td></tr>
  <tr><td>A との差（到達率・寄り道 25%）</td><td>—</td><td>{SIM['Ch2-B']['vsCh2A']['goalPP']:+}pt</td><td>{SIM['Ch2-C']['vsCh2A']['goalPP']:+}pt</td></tr>
  <tr><td>40T 以内の GOAL 到達率（寄り道 50%）</td><td>{SIM50['Ch2-A']['goal']}%</td><td>{SIM50['Ch2-B']['goal']}%</td><td>{SIM50['Ch2-C']['goal']}%</td></tr>
  <tr><td>A との差（到達率・寄り道 50%）</td><td>—</td><td>{SIM50['Ch2-B']['vsCh2A']['goalPP']:+}pt</td><td>{SIM50['Ch2-C']['vsCh2A']['goalPP']:+}pt</td></tr>
  <tr><td>特殊挑戦（成功／失敗の歩数）</td><td>{SUMM['A']['challenge']['success']}／{SUMM['A']['challenge']['fail']}</td><td>{SUMM['B']['challenge']['success']}／{SUMM['B']['challenge']['fail']}</td><td>{SUMM['C']['challenge']['success']}／{SUMM['C']['challenge']['fail']}</td></tr>
  </tbody></table></div>
  <p class="note">12000 seed × ソラモ・ガウル（24,000回）・寄り道 25% と 50%。試作の進行モデル（バトル・食事・Chapter 2 の上昇量は未反映）＝比較が目的で絶対値は参考。前回の報告（600 seed）の「寄り道 50% で B −6.2pt」は試行回数が少ないためのばらつきが大きかった（同じ前回の道を 12000 seed で測ると +0.9pt）。</p>
</section>
<section>
  <h2>B の特殊挑戦の案（成功／失敗の歩数・A との到達率の差）</h2>
  <div class="wrap"><table><thead><tr><th>成功／失敗</th><th>道</th><th>寄り道 25%</th><th>寄り道 50%</th><th>備考</th></tr></thead><tbody>{''.join(f'<tr><td>{a}</td><td>{b}</td><td>{c}pt</td><td>{d}pt</td><td>{e}</td></tr>' for a, b, c, d, e in B_VARIANTS)}</tbody></table></div>
  <p class="note">目標＝A との差 ±3pt（25%・50% の両方）。B の特殊挑戦は本線の上（必ず通る）なので、失敗の道を長くすると B だけ遅れる。採用案は海底の本線（潮の塔 → 回廊 → 封印の扉 → ライバル）を詰めて、その分を失敗の回り道に回した。C も 50% で +3.5pt と目標をわずかに超えていたので、C の失敗の回り道を 14 → 18 歩にして収めた。</p>
</section>
<section>
  <h2>論点 1〜5 の反映</h2>
  <ol>
    <li>ライバルの位置：現状維持（A 53〜74%・B 62〜73%・C 64〜78%）。</li>
    <li>B：特殊挑戦は成功 2 歩（神殿の中を抜ける近道）・失敗 14 歩（神殿の外回り）。海底の本線を詰めて、寄り道 25%・50% の両方で A との差 ±3pt 以内（+0.8／−1.8pt）。</li>
    <li>螺旋塔：12〜13 歩の上りを 2.5D の斜路で（上の画面）。</li>
    <li>地点数：探索路を足して A 298・B 280・C 304（本線は延ばさない・40ターン・D6 のまま。C は失敗の回り道を延ばした分 300 → 304）。</li>
    <li>報酬：7 枠の種類と数は同じ・建物に合わせて割り当て直し（値は仮）。</li>
  </ol>
</section>
<section>
  <h2>次に承認が要る論点</h2>
  <ol>
    <li>道路グラフの設計の承認（分かれ道・探索路・報酬の割り当て）。2.5D の見た目・本実装は別に承認。</li>
    <li>B の特殊挑戦の採用案（成功 2・失敗 14 歩）と、C の失敗の回り道の延長（14 → 18 歩）でよいか。</li>
    <li>海底の見せ方（砂地の地面・地面に置いたガラスの筒・沈没遺跡の広場・海中の光）の方向でよいか（素材は U-08・FX-04 を追加）。</li>
    <li>寄り道に入らないプレイ（0%）では C が A より −3.9pt（参考値・目標の対象外）。気にするか。</li>
  </ol>
  <p class="note">旧 Chapter 2 の途中の個体は<b>案1（その育成が終わるまで旧モードで継続・新しい育成から新 Chapter 2）</b>で決定（2026-10-15）。素材要求一覧（asset_requirements.tsv・54 行）：今回、沈没遺跡の広場（U-08）と海中の光の筋（FX-04）を追加。旧 Chapter 2 の背景 10 枚は使わない。</p>
</section>
</main>
'''
OUT.write_text(page, encoding='utf-8')
print('wrote', OUT, len(page.encode()), 'bytes')
