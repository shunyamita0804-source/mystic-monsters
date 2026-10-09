#!/usr/bin/env python3
"""Chapter 1 Pattern A 道路先行ブロックアウト（2026-10-09 キット）から試作のデータ js/proto/roadfirst-data.js を作る。
元：assets/proto/ch1a_roadfirst_1009/09_original_source_graph.json（論理の正本・299ノード／370有向接続／42区間）と
    02_walkable_geometry.json（42区間の暫定の描画座標＝centerline_xy。phase18_node_ids と1対1）。
ノードの描画座標は 02 の centerline_xy（同じ区間の同じ順のノード ID）。区間の境目のノード（アンカー）は両方の区間に出るので、同じ座標であることを確かめる。
実行：python3 -I tools/roadfirst/build_data.py（リポジトリ直下から）。手で js/proto/roadfirst-data.js を書き換えない。"""
import json, sys
from pathlib import Path
R = Path(__file__).resolve().parents[2]
K = R / 'assets/proto/ch1a_roadfirst_1009'
G = json.loads((K / '09_original_source_graph.json').read_text(encoding='utf-8'))
V = json.loads((K / '02_walkable_geometry.json').read_text(encoding='utf-8'))
pos = {}
for s in V['segment_surfaces']:
    ids, xy = s['phase18_node_ids'], s['centerline_xy']
    assert len(ids) == len(xy), s['segment_id']
    for i, p in zip(ids, xy):
        p = [round(p[0], 2), round(p[1], 2)]
        if i in pos: assert abs(pos[i][0] - p[0]) < 0.01 and abs(pos[i][1] - p[1]) < 0.01, (i, pos[i], p)
        pos[i] = p
nodes = {n['id']: n for n in G['nodes']}
assert set(pos) == set(nodes) and len(nodes) == 299, (len(pos), len(nodes))
seg = {s['id']: s for s in G['segments']}
assert len(seg) == 42 and len(G['edges']) == 370
out = {
    'version': G['version'], 'source': 'assets/proto/ch1a_roadfirst_1009 (09_original_source_graph.json + 02_walkable_geometry.json)',
    'size': [G['coordinate_system']['width'], G['coordinate_system']['height']],
    'fixed_rules': G['fixed_rules'], 'draft_rules': G['draft_rules'], 'branch_permissions': G['branch_permissions'], 'random_gate': G['random_gate'],
    # ノード：id → [x, y, role, segment]（座標は 02 の暫定の描画座標）
    'nodes': {i: [pos[i][0], pos[i][1], nodes[i]['role'], nodes[i].get('segment')] for i in nodes},
    # 区間：id → [from, to, kind, node_ids]
    'segments': {i: [s['from_anchor'], s['to_anchor'], s['kind'], s['node_ids']] for i, s in seg.items()},
    # 有向接続：[source, target, segment_id, direction, condition]（原本の順）
    'edges': [[e['source'], e['target'], e['segment_id'], e['direction'], e['condition']] for e in G['edges']],
}
js = ('// Chapter 1 Pattern A 道路先行ブロックアウト試作のデータ（2026-10-09 キット）。tools/roadfirst/build_data.py が作る。手で書き換えない。\n'
      '// 座標は暫定の描画座標（02_walkable_geometry.json の centerline_xy）＝最終の美術・背景と合わせたものではない。\n'
      '(function (root) { const D = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n'
      "  if (typeof module === 'object' && module.exports) module.exports = D; else root.MMRF_DATA = D; })(typeof window !== 'undefined' ? window : globalThis);\n")
(R / 'js/proto/roadfirst-data.js').write_text(js, encoding='utf-8')
print('nodes', len(out['nodes']), 'edges', len(out['edges']), 'segments', len(out['segments']), 'bytes', len(js.encode()))
