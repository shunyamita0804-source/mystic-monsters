#!/usr/bin/env python3
"""Standalone QA for the road-first SVG/JSON blockout. Requires shapely and networkx.
Run: python 08_validate_roadfirst.py (from any working directory).
Does not prove scenery/physical 3D support or actual gameplay quality.
"""
from pathlib import Path
import csv, json, itertools, collections, hashlib, xml.etree.ElementTree as ET
from shapely.geometry import shape, Point, LineString
import networkx as nx

P=Path(__file__).resolve().parent
G=json.loads((P/'09_original_source_graph.json').read_text(encoding='utf-8'))
V=json.loads((P/'02_walkable_geometry.json').read_text(encoding='utf-8'))
S={s['id']:s for s in G['segments']}
F={s['segment_id']:s for s in V['segment_surfaces']}
A={a['anchor_id']:tuple(a['xy']) for a in V['anchors']}
with (P/'03_anchor_and_segment_map.csv').open(encoding='utf-8-sig',newline='') as f: R=list(csv.DictReader(f))
with (P/'06_48_states_original_graph_check.csv').open(encoding='utf-8-sig',newline='') as f: C=list(csv.DictReader(f))
R_IDS=[x['segment_id'] for x in R]
REWARDS={'D_LC','D_RC','D_LA','D_LLA','D_R5','D_RS'}
MUST=['LOWER_GATE','Q','R','UPPER_GATE','RIVAL','H','FINAL']
checks={}
checks['299 nodes / 370 edges / 42 intervals']=len(G['nodes'])==299 and len(G['edges'])==370 and len(S)==42
checks['42 exact unique segment IDs']=set(S)==set(F)==set(R_IDS) and len(F)==len(R_IDS)==42
checks['original node interval IDs conserved']=all(F[sid]['phase18_node_ids']==s['node_ids'] for sid,s in S.items())
checks['editable SVG has all 42 floor groups']=all(f'floor_{sid}' in (P/'01_road_geometry.svg').read_text(encoding='utf-8') for sid in S)
polys={sid:shape(f['walkable_polygon']) for sid,f in F.items()}
lines={sid:LineString(f['centerline_xy']) for sid,f in F.items()}
checks['42 valid nonzero floor polygons']=all(p.is_valid and p.area>0 for p in polys.values())
checks['centers align source anchors']=all(tuple(f['centerline_xy'][0])==A[f['from_anchor']] and tuple(f['centerline_xy'][-1])==A[f['to_anchor']] for f in F.values())
checks['source endpoints retained']=all(F[sid]['from_anchor']==s['from_anchor'] and F[sid]['to_anchor']==s['to_anchor'] for sid,s in S.items())
checks['floors contain anchor endpoints']=all(polys[sid].covers(Point(A[f['from_anchor']])) and polys[sid].covers(Point(A[f['to_anchor']])) for sid,f in F.items())
overlap=[]; crossings=[]
for s,t in itertools.combinations(S,2):
   a=S[s]; b=S[t]
   common={a['from_anchor'],a['to_anchor']} & {b['from_anchor'],b['to_anchor']}
   if common: continue
   if polys[s].intersection(polys[t]).area>=.05: overlap.append([s,t])
   if not lines[s].intersection(lines[t]).is_empty: crossings.append([s,t])
checks['no unregistered floor shortcuts']=not overlap
checks['no unregistered centerline intersections']=not crossings
checks['both gates covered by continuous floor']=all(all(polys[sid].covers(Point(A[gate])) for sid in [a,b]) for gate,a,b in [('LOWER_GATE','C01','C02'),('UPPER_GATE','C03','C04')])
checks['6 independent reward dead ends']=all(sum(1 for f in F.values() if endpoint in (f['from_anchor'],f['to_anchor']))==1 for sid in REWARDS for endpoint in [F[sid]['to_anchor']])
rev=collections.Counter(e['segment_id'] for e in G['edges'] if e['direction']=='reverse')
checks['reward and optional spur return paths']=all(rev[sid]==S[sid]['intervals'] for sid in REWARDS|{'D_RAND'})
checks['Q direct R shortcut absent']=not any(s['from_anchor']=='Q' and s['to_anchor']=='R' for s in S.values())
case_pass=[]
for early,parity,late,challenge,randopen in itertools.product(['L','R'],['odd','even'],['safe','left','right'],['success','fail'],[False,True]):
   opts={'J0':{'L':'EL01','R':'ER01'}[early],'Q':{'odd':'Q_L1','even':'Q_R1'}[parity], 'H':{'safe':'LATE_SAFE','left':'LATE_L1','right':'LATE_R1'}[late], 'CHALLENGE':{'success':'LATE_L_SUCCESS1','fail':'LATE_L_FAIL'}[challenge]}
   net=nx.DiGraph()
   net.add_nodes_from([n['id'] for n in G['nodes']]+list(A))
   for e in G['edges']:
      c=e['condition']
      if c=='Q_odd_only' and parity!='odd':continue
      if c=='Q_even_only' and parity!='even':continue
      if c=='CHALLENGE_5_6' and challenge!='success':continue
      if c=='CHALLENGE_1_4' and challenge!='fail':continue
      if c=='unlock_random_event' and not randopen:continue
      if e['source'] in opts and e['segment_id'] in {'EL01','ER01','Q_L1','Q_R1','LATE_SAFE','LATE_L1','LATE_R1','LATE_L_SUCCESS1','LATE_L_FAIL'} and e['segment_id']!=opts[e['source']]:continue
      net.add_edge(e['source'],e['target'])
   reached=nx.has_path(net,'START','GOAL')
   forced=all(not nx.has_path(nx.restricted_view(net,[v],[]),'START','GOAL') for v in MUST) if reached else False
   case_pass.append(reached and forced)
checks['48 branch states reachable with mandatory gates']=len(case_pass)==48 and all(case_pass)
checks['48 state CSV length']=len(C)==48
checks['uncertainty correctly marked']=all(f['art_alignment']=='NOT_CHECKED_NO_MASTER_APPROVED' for f in F.values())
summary={'passed':sum(checks.values()),'total':len(checks),'checks':checks,'unregistered_overlap_pairs':overlap,'unregistered_centerline_pairs':crossings,'conditional_cases':len(case_pass),'conditional_cases_pass':sum(case_pass),'master_art_status':'NOT_TESTED','physical_3d_support':'NOT_TESTED'}
(P/'10_standalone_test_log.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
for name,ok in checks.items():print(('PASS' if ok else 'FAIL'),name)
print('RESULT',summary['passed'],'/',summary['total'],'48_states',sum(case_pass),'/',len(case_pass))
if not all(checks.values()):raise SystemExit(1)
