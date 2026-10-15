#!/usr/bin/env python3
"""Chapter 2 A／B／C 設計案の比較表（Markdown）を tools/ch2/out/summary.json（build_ch2_routes.py）と tools/ch2/out/sim_*.json（sim.mjs）から作る。
出力：docs/ch2_abc_design_1015/COMPARISON.md。実行：python3 -I tools/ch2/report.py [sim の JSON=tools/ch2/out/sim_12000.json]"""
import json, sys
from pathlib import Path
R = Path(__file__).resolve().parents[2]
summ = json.loads((R / 'tools/ch2/out/summary.json').read_text(encoding='utf-8'))
simp = Path(sys.argv[1]) if len(sys.argv) > 1 else R / 'tools/ch2/out/sim_12000.json'
sim = json.loads(simp.read_text(encoding='utf-8'))
src = (R / 'js/proto/ch2-routes.js').read_text(encoding='utf-8'); D = json.loads(src[src.index('const R = ') + 10: src.index(';\n  if (typeof module')])
L = []
L.append('# Chapter 2 A／B／C 比較表（設計案・未承認・2026-10-15 追補＝ユーザー承認の論点 1〜5 を反映）\n')
L.append('数値は tools/ch2/build_ch2_routes.py（グラフの検査）と tools/ch2/sim.mjs（小規模シミュレーション）の出力。推定条件と未測定項目は末尾。\n')
L.append('## 1. グラフ（構造）\n')
L.append('| 項目 | A 港と大橋の王道 | B 島めぐりの浅瀬 | C 沈没遺跡の回廊 | 参考：Chapter 1 A |')
L.append('|---|---|---|---|---|')
def row(name, f, ch1=''):
    L.append(f'| {name} | ' + ' | '.join(str(f(summ[k], D[k])) for k in 'ABC') + f' | {ch1} |')
row('地点数', lambda s, d: s['nodes'], '299')
row('有向接続', lambda s, d: s['edges'], '370')
row('区間', lambda s, d: s['segments'], '42')
row('通常の地点（マスの候補）', lambda s, d: s['ordinary'], '261')
row('プレイヤーが選ぶ分かれ目（寄り道の入口を含む）', lambda s, d: s['freeForks'], '7（J0・H＋寄り道の入口 5）')
row('運命の分かれ道（Q）／特殊挑戦／隠れ家', lambda s, d: '1／1／1', '1／1／1')
row('固定報酬（行き止まり）', lambda s, d: '6', '6')
row('本線の総歩数（最短〜最長）', lambda s, d: f"{min(s['mainTotals'])}〜{max(s['mainTotals'])}", '97〜122')
row('ライバルまでの歩数（最短〜最長）', lambda s, d: f"{min(s['rivalSteps'])}〜{max(s['rivalSteps'])}", '76〜77')
row('ライバルの位置（本線に対する比率）', lambda s, d: f"{s['rivalRatio'][0]*100:.0f}〜{s['rivalRatio'][1]*100:.0f}%", '63〜79%')
row('区域ごとの歩数（海面序盤／下降／海底／上昇／海面会場前）', lambda s, d: '／'.join(str(s['stepsByZone'][z]) for z in ('surface_early', 'descent', 'undersea', 'ascent', 'surface_late')), '—')
row('隣り合わない地点の最小距離（単位・高さを含む）', lambda s, d: s['minNodeDist'], '—')
row('特殊挑戦の成功／失敗の道（歩）', lambda s, d: f"{s['challenge']['success']}／{s['challenge']['fail']}", '6／20')
row('螺旋塔の上昇（歩）', lambda s, d: '／'.join(str(x) for x in s['spiralSteps']), '—')
row('探索路（区間数／地点）', lambda s, d: f"{len(s['explore'])}／{s['exploreNodes']}", '—')
L.append('')
L.append('### 本線の内訳（区間：歩数）\n')
for k in 'ABC':
    L.append(f'**{k}「{D[k]["name"]}」**：{D[k]["concept"]}\n')
    Lk = {sid: len(v[3]) - 1 for sid, v in D[k]['segments'].items()}
    ms = sorted(summ[k]['mainRoutes'], key=lambda m: m['total'])
    L.append(f'本線の組み合わせ {len(ms)} 通り（探索路を含む）。短い順に3つと長い順に2つ：\n')
    for m in ms[:3] + ms[-2:]:
        L.append(f'- {m["total"]}歩（ライバル {m["rival"]}＝{m["rivalRatio"]*100:.0f}%）：' + ' → '.join(f'{s}:{Lk[s]}' for s in m['segs']))
    L.append('')
L.append('### 探索路（2026-10-15 追補・論点 4：本線は延ばさず、意味のある寄り道・探索路で 280〜320 地点）\n')
SL = {'li': 'ライフ', 'po': 'ちから', 'in': 'かしこさ', 'hi': '命中', 'ev': '回避', 'de': '丈夫さ'}
L.append('| ルート | 区間 | 名前 | 種類 | 伸びやすい能力 | 歩数 | 説明 |')
L.append('|---|---|---|---|---|---|---|')
for k in 'ABC':
    for sid, x in D[k]['explore'].items():
        L.append(f"| {k} | {sid} | {x['name']} | {'並ぶ道（ほぼ同じ長さ）' if x['kind'] == 'lane' else '寄り道の輪（少し長い）'} | {'・'.join(SL[a] for a in x['lean'])} | {len(D[k]['segments'][sid][3]) - 1} | {x['note']} |")
L.append('')
L.append('### 固定報酬 7 枠の割り当て（論点 5：種類と数は Chapter 1 と同じ・建物と景観に合わせて割り当て直し。値は【仮】＝正式承認ではない）\n')
CN = {'gold150': '150G', 'all10': '全能力 +10', 'all15': '全能力 +15', 'food': '空腹 −50・100G', 'best30': '得意な能力 +30', 'gold200': '200G'}
L.append('| 枠 | A | B | C | Chapter 1（参考） |')
L.append('|---|---|---|---|---|')
CH1 = {'L_CHEST': '150G', 'R_CHEST': '150G', 'L_ALTAR': '全能力 +10', 'L_LATE_ALTAR': '全能力 +15', 'REWARD5': '空腹 −50・100G', 'R_SPECIAL': '得意な能力 +30', 'RANDOM_DEN': '200G'}
for rid in ['L_CHEST', 'R_CHEST', 'L_ALTAR', 'L_LATE_ALTAR', 'REWARD5', 'R_SPECIAL', 'RANDOM_DEN']:
    L.append(f'| {rid} | ' + ' | '.join(f"{D[k]['rewards'][rid]['title']}＝{CN[D[k]['rewards'][rid]['key']]}" for k in 'ABC') + f' | {CH1[rid]} |')
L.append('')
L.append('## 2. シミュレーション（同じ seed・同じ方針）\n')
o = sim['out']
L.append(f'条件：seed {sim["N"]}×モンスター {"・".join(sim["monsters"])}・寄り道に入る割合 {sim["SPUR"]}・空腹 {sim["REST_AT"]} 以上で休む。詳細は末尾。\n')
L.append('| 指標 | Ch1-A（基準） | Ch2-A | Ch2-B | Ch2-C |')
L.append('|---|---|---|---|---|')
keys = [('nodes', '地点数'), ('goal', '40T 以内の GOAL 到達率（%）'), ('avgTurns', '到達したときの平均ターン'), ('p10', 'ターン p10'), ('p50', 'ターン p50'), ('p90', 'ターン p90'),
        ('gain', '6能力の合計上昇の平均（能力マス＋出来事）'), ('gainP10', '上昇 p10'), ('gainP90', '上昇 p90'), ('statStops', '能力マスに止まった回数'), ('rewards', '固定報酬の取得数（7か所中）'),
        ('rewardRate', '固定報酬の取得率（%）'), ('spurOpp', '寄り道の入口を通った回数（機会）'), ('rests', '休んだ回数'), ('fatEnd', '終了時の空腹'), ('timeUpAt', '時間切れの場所（上位3）')]
for key, name in keys:
    L.append(f'| {name} | ' + ' | '.join(str(o[c].get(key, '')) for c in ['Ch1-A（基準）', 'Ch2-A', 'Ch2-B', 'Ch2-C']) + ' |')
L.append('')
L.append('### 固定報酬ごとの取得率（%）\n')
rew = ['L_CHEST', 'R_CHEST', 'L_ALTAR', 'L_LATE_ALTAR', 'REWARD5', 'R_SPECIAL', 'RANDOM_DEN']
L.append('| 報酬の枠（効果は Chapter 1 と同じ） | Ch1-A | Ch2-A | Ch2-B | Ch2-C |')
L.append('|---|---|---|---|---|')
for r in rew:
    L.append(f'| {r} | ' + ' | '.join(str(o[c]['rewardEach'].get(r, '')) for c in ['Ch1-A（基準）', 'Ch2-A', 'Ch2-B', 'Ch2-C']) + ' |')
L.append('')
L.append('### 差（設計目標：A と比べて GOAL 到達率 ±3pt・平均総能力上昇 ±10%・固定報酬の取得率 ±5pt）\n')
L.append('| | GOAL 到達率の差（pt） | 平均総能力上昇の差（%） | 固定報酬の取得率の差（pt） |')
L.append('|---|---|---|---|')
for c in ['Ch2-A', 'Ch2-B', 'Ch2-C']:
    v = o[c]['vsCh1']; L.append(f'| {c} − Ch1-A | {v["goalPP"]} | {v["gainPct"]} | {v["rewardPP"]} |')
for c in ['Ch2-B', 'Ch2-C']:
    v = o[c]['vsCh2A']; L.append(f'| {c} − Ch2-A | {v["goalPP"]} | {v["gainPct"]} | {v["rewardPP"]} |')
L.append('')
import os
sens = []
for f, lab in [('sim_12000_spur0.json', '寄り道に入らない（0）'), ('sim_12000.json', '標準（0.25）'), ('sim_12000_spur50.json', '寄り道が多い（0.5）')]:
    fp = R / 'tools/ch2/out' / f
    if fp.exists(): sens.append((lab, json.loads(fp.read_text(encoding='utf-8'))['out']))
if sens:
    L.append('### 感度（寄り道に入る割合を変えたとき・12000 seed×2体＝24,000回）\n')
    L.append('| 寄り道の割合 | Ch1-A 到達 | Ch2-A 到達 | Ch2-B 到達（A との差） | Ch2-C 到達（A との差） |')
    L.append('|---|---|---|---|---|')
    for lab, o2 in sens:
        a = o2['Ch2-A']['goal']; L.append(f"| {lab} | {o2['Ch1-A（基準）']['goal']} | {a} | {o2['Ch2-B']['goal']}（{o2['Ch2-B']['goal'] - a:+.1f}） | {o2['Ch2-C']['goal']}（{o2['Ch2-C']['goal'] - a:+.1f}） |")
    L.append('')
VAR = json.loads((R / 'tools/ch2/out/challenge_variants.json').read_text(encoding='utf-8'))
L.append('### 特殊挑戦の案（2026-10-15 追補2：成功／失敗の歩数と A との到達率の差）\n')
L.append(VAR['note'] + '\n')
for k in ('B', 'C'):
    L.append(f'| {k}：成功／失敗 | 道 | 寄り道 25%（pt） | 寄り道 50%（pt） | 備考 |')
    L.append('|---|---|---|---|---|')
    for a, b, c, d, e in VAR[k]: L.append(f'| {a} | {b} | {c:+.1f} | {d:+.1f} | {e} |')
    L.append('')
L.append('''## 3. 推定の条件・簡略化・未測定（都合のいい数字にしないための明記）

- 進行モデルは試作の MMRF_PLAY.simulate（MMRF_CORE の移動＋マスの中身）。本編の MMP8 ではない。
- バトルは起きない（野生のマス＝空腹 +5 だけ）。ライバル戦の勝敗・負けたときの流れは入っていない。
- 食事アイテムは使わない。「休む」は空腹が基準以上のとき（−10・1ターン）。本編の「みんなでごはん」（食事マス −50）は配置の割合どおり起きる。
- マスの配置の割合（能力 53%・出来事 15%・食事 6%・野生 8%・宝 6%）と上昇量は **Chapter 1 の TUNING と GROWTH_GAIN**（Chapter の区別なし）。Chapter 2 の正式な上昇量（A25…E12）は未反映＝公平性の比較が目的で、絶対値は参考。
- 2026-10-15 追補：Chapter 2 の道のデータが持つ「落ち着いた区間（calm）」「能力の道の偏り（statLanes・重み 3）」「レアの候補（rareZones）」「報酬の割り当て（rewards）」を試作の進行（MMRF_PLAY）が読む（Chapter 1 のデータには無い＝従来どおり）。
- 自由な分かれ道は乱数で選ぶ（プレイヤーの判断ではない）。寄り道は SPUR の割合で入る（未取得のときだけ）。運命のサイコロ・特殊挑戦は本物のルール（奇偶・5/6）。隠れ家の開閉は 50%【仮】。
- 未測定：バトルの勝率・食事アイテムの効果・Chapter 2 の正式な上昇量での値・実機の操作時間・画面上の見やすさ。
''')
(R / 'docs/ch2_abc_design_1015/COMPARISON.md').write_text('\n'.join(L), encoding='utf-8')
print('wrote COMPARISON.md')
