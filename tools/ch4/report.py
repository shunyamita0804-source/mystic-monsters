#!/usr/bin/env python3
"""Chapter 4 のシミュレーション結果の表（2026-10-18）。
  python3 -I tools/ch4/report.py
入力：tools/ch4/out/v4_final/sim_food{10,0}_spur{0,0.25,0.5}.json（調整後）・tools/ch4/out/v1_before/…（調整前）・tools/ch4/out/summary.json（グラフ）
出力：docs/ch4/sim_results.csv（全条件 × 全盤の主な数値）・docs/ch4/sim_results.json（同じ内容）・docs/ch4/RESULTS.md（表）"""
import json, csv
from pathlib import Path
R = Path(__file__).resolve().parents[2]
OUT = R / 'docs/ch4'
CONDS = [(f, s) for f in ('10', '0') for s in ('0', '0.25', '0.5')]
BOARDS = ['Ch1-A（基準）', 'Ch2-A（参考）', 'Ch4-A', 'Ch4-B', 'Ch4-C']
REW = ['L_CHEST', 'R_CHEST', 'L_ALTAR', 'L_LATE_ALTAR', 'REWARD5', 'R_SPECIAL', 'RANDOM_DEN']
def load(ver):
    return {(f, s): json.loads((R / f'tools/ch4/out/{ver}/sim_food{f}_spur{s}.json').read_text(encoding='utf-8')) for f, s in CONDS}
after, before = load('v4_final'), load('v1_before')
summ = json.loads((R / 'tools/ch4/out/summary.json').read_text(encoding='utf-8'))
rows = []
for ver, data in (('after', after), ('before', before)):
    for (f, s), d in data.items():
        for b in BOARDS:
            v = d['out'][b]
            rows.append({'version': ver, 'food': 'あり' if f == '10' else 'なし', 'spur': float(s), 'board': b, 'runs': v['runs'], 'seedRule': d['seedRule'], 'goal_pct': v['goal'], 'avg_turns_at_goal': v['avgTurns'],
                         'p10': v['p10'], 'p50': v['p50'], 'p90': v['p90'], 'gain': v['gain'], 'stat_stops': v['statStops'], 'reward_rate_pct': v['rewardRate'], 'rewards_per_run': v['rewards'],
                         **{f'reward_{k}_pct': v['rewardEach'][k] for k in REW}, 'rival_pct': v['rivalRate'], 'rare_none_pct': v['rare']['none'], 'rare_one_pct': v['rare']['one'], 'rare_more_pct': v['rare']['more'],
                         'rare_fought_pct': v['rare']['fought'], 'challenge_entered_pct': v['challenge']['entered'], 'challenge_success_pct': v['challenge']['success'], 'q_odd_pct': v['parity']['odd'], 'q_even_pct': v['parity']['even'],
                         'stuck': v['stuck'], 'guard_out': v['guardOut'], 'ate': v['ate'], 'rests': v['rests'], 'time_up_at': v['timeUpAt'],
                         'short_at_timeup_p50': (v['shortAtTimeUp'] or {}).get('p50'), 'within6_pct': (v['shortAtTimeUp'] or {}).get('within6')})
with open(OUT / 'sim_results.csv', 'w', encoding='utf-8', newline='') as fh:
    w = csv.DictWriter(fh, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
(OUT / 'sim_results.json').write_text(json.dumps(rows, ensure_ascii=False, indent=1), encoding='utf-8')
L = ['# Chapter 4 シミュレーション結果（tools/ch4/report.py が作る・手で書き換えない）\n',
     '各条件＝seed 12,000 × ソラモ・ガウル＝24,000 回（seed＝(i)*7919+13・i＝1〜12,000）。実行：`sh tools/ch4/run_all.sh tools/ch4/out/v4_final "" 12000`。進行モデル＝試作の MMRF_PLAY（バトルなし・Chapter 1 の上昇量）。\n']
def tbl(data, title, key, fmt=lambda v: v):
    L.append(f'### {title}\n'); L.append('| 条件 | ' + ' | '.join(BOARDS) + ' |'); L.append('|---|' + '---|' * len(BOARDS))
    for (f, s) in CONDS:
        L.append(f'| 食事{"あり" if f == "10" else "なし"}・寄り道 {int(float(s) * 100)}% | ' + ' | '.join(str(fmt(data[(f, s)]['out'][b][key])) for b in BOARDS) + ' |')
    L.append('')
L.append('## 1. 調整後（採用＝v4）\n')
tbl(after, '40ターン以内の GOAL 到達率（%）', 'goal')
tbl(after, '到達したときの平均ターン', 'avgTurns')
tbl(after, '6能力の合計上昇（平均）', 'gain')
tbl(after, '能力マスに止まった回数（平均）', 'statStops')
tbl(after, '固定報酬 6＋隠れ家の取得率（7 枠に対する %）', 'rewardRate')
tbl(after, 'ライバルに会った割合（%・時間切れの回を含む）', 'rivalRate')
L.append('### 固定報酬の枠ごとの取得率（食事あり・寄り道 25%・%）\n')
L.append('| 盤 | ' + ' | '.join(REW) + ' |'); L.append('|---|' + '---|' * len(REW))
for b in BOARDS: L.append(f'| {b} | ' + ' | '.join(str(after[("10", "0.25")]["out"][b]["rewardEach"][k]) for k in REW) + ' |')
L.append('')
L.append('### 検査の値（食事あり・寄り道 25%）\n')
L.append('| 盤 | 進めなくなった回 | ループ上限に達した回 | レア 0／1／2以上（%） | レアと戦えた（%） | 特殊挑戦に入った（%）／成功（%） | 運命 奇／偶（%） | 時間切れの地点（上位） | 時間切れの残り歩数の中央値 |')
L.append('|---|---|---|---|---|---|---|---|---|')
for b in BOARDS:
    v = after[('10', '0.25')]['out'][b]
    L.append(f'| {b} | {v["stuck"]} | {v["guardOut"]} | {v["rare"]["none"]}／{v["rare"]["one"]}／{v["rare"]["more"]} | {v["rare"]["fought"]} | {v["challenge"]["entered"]}／{v["challenge"]["success"]} | {v["parity"]["odd"]}／{v["parity"]["even"]} | {v["timeUpAt"]} | {(v["shortAtTimeUp"] or {}).get("p50")} |')
L.append('')
L.append('## 2. 調整の前後（同じ seed 群・食事あり／なし × 寄り道 0／25／50%）\n')
L.append('| 条件 | 盤 | 到達率 前 → 後（pt） | 平均ターン 前 → 後 | 能力上昇 前 → 後 | 報酬取得率 前 → 後 |'); L.append('|---|---|---|---|---|---|')
for (f, s) in CONDS:
    for b in ('Ch4-A', 'Ch4-B', 'Ch4-C'):
        x, y = before[(f, s)]['out'][b], after[(f, s)]['out'][b]
        L.append(f'| 食事{"あり" if f == "10" else "なし"}・{int(float(s) * 100)}% | {b} | {x["goal"]} → {y["goal"]}（{y["goal"] - x["goal"]:+.1f}） | {x["avgTurns"]} → {y["avgTurns"]} | {x["gain"]} → {y["gain"]} | {x["rewardRate"]} → {y["rewardRate"]} |')
L.append('')
L.append('## 3. グラフ（調整後）\n')
L.append('| 項目 | A | B | C |'); L.append('|---|---|---|---|')
for name, f in [('地点', lambda s: s['nodes']), ('有向接続', lambda s: s['edges']), ('区間', lambda s: s['segments']), ('通常の地点', lambda s: s['ordinary']),
                ('本線の総歩数（最短〜最長）', lambda s: f'{min(s["mainTotals"])}〜{max(s["mainTotals"])}'), ('ライバルまでの歩数', lambda s: f'{min(s["rivalSteps"])}〜{max(s["rivalSteps"])}'),
                ('ライバルの位置（本線に対する比率）', lambda s: f'{s["rivalRatio"][0] * 100:.0f}〜{s["rivalRatio"][1] * 100:.0f}%'), ('特殊挑戦 成功／失敗（歩）', lambda s: f'{s["challenge"]["success"]}／{s["challenge"]["fail"]}'),
                ('寄り道の歩数（D_LC／D_LA／D_RC／D_LLA／D_R5／D_RS／D_RAND）', lambda s: '／'.join(str(s['segSteps'][k]) for k in ('D_LC', 'D_LA', 'D_RC', 'D_LLA', 'D_R5', 'D_RS', 'D_RAND'))),
                ('溶岩の上の橋の区間', lambda s: '・'.join(s['bridges']) or 'なし'), ('レアの候補の地点数（Z1／Z2）', lambda s: '／'.join(str(v) for v in s['rareCandidates'].values())),
                ('区域ごとの歩数', lambda s: '・'.join(f'{k} {v}' for k, v in s['stepsByZone'].items())), ('隣り合わない地点の最小距離', lambda s: s['minNodeDist'])]:
    L.append(f'| {name} | ' + ' | '.join(str(f(summ[k])) for k in 'ABC') + ' |')
(OUT / 'RESULTS.md').write_text('\n'.join(L) + '\n', encoding='utf-8')
print('wrote', OUT / 'RESULTS.md', OUT / 'sim_results.csv', len(rows))
