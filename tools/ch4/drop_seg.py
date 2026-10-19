#!/usr/bin/env python3
"""spec から探索路の区間を取り除く（調整用）。python3 -I tools/ch4/drop_seg.py <spec フォルダ> <ルート> <区間 ID>…"""
import json, sys
from pathlib import Path
root, r, ids = Path(sys.argv[1]), sys.argv[2], sys.argv[3:]
p = root / f'spec_{r}.json'; d = json.loads(p.read_text(encoding='utf-8'))
for sid in ids:
    d['segs'].pop(sid, None)
    for z in d['zones'].values():
        if sid in z: z.remove(sid)
    for k in ('names', 'explore', 'lanes'): (d.get(k) or {}).pop(sid, None)
p.write_text(json.dumps(d, ensure_ascii=False, indent=1), encoding='utf-8'); print('dropped', ids)
