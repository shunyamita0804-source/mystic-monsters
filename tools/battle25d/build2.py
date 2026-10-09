# 透過にしたコマ（raw）→ ゲーム用 WebP（縮小・余白を切る）と art25d-data.js
import json,sys,os,glob,numpy as np
from PIL import Image
raw,out,cfgf,bodyf,datajs=sys.argv[1:6]
# 2026-10-09：raw は soften.py の出力（縁をなじませたコマ）。そこにある ex.json（切れた辺の光の色・位置）を各コマの ex に入れる
EX=json.load(open(raw+'/ex.json')) if os.path.exists(raw+'/ex.json') else {}
SC=0.7
C=json.load(open(cfgf)); BO=C.pop('_body',{}); C.pop('_note',None)
B=json.load(open(bodyf)); B.update(BO)
D={}; tot=0
for k,v in sorted(C.items(),key=lambda t:int(t[0])):
  k=int(k); sp='soramo' if k<10 else 'gauru'
  os.makedirs(f'{out}/{sp}',exist_ok=True)
  files=[f for s in v['sheets'] for f in sorted(glob.glob(f'{raw}/{s}_*.png'),key=lambda p:int(p.rsplit('_',1)[1][:-4]))]
  cuts=[]
  for i,(f,m) in enumerate(zip(files,v['m'])):
    name=os.path.basename(f)[:-4]
    im=Image.open(f); W,H=im.size; pw,ph=round(W*SC),round(H*SC)
    im=im.resize((pw,ph),Image.LANCZOS)
    bb=im.getchannel('A').point(lambda a:255 if a>6 else 0).getbbox()
    c=im.crop(bb); fn=f'{sp}/{k:02d}_{i+1:02d}.webp'
    c.save(f'{out}/{fn}','WEBP',quality=86,method=6); tot+=os.path.getsize(f'{out}/{fn}')
    b=B[name]
    cuts.append({'f':fn,'src':name,'m':m,'pw':pw,'ph':ph,'x':bb[0],'y':bb[1],'w':c.width,'h':c.height,
                 'b':[round(b[0]*pw),round(b[1]*ph),round(b[2]*pw),round(b[3]*ph)]})
    ex=EX.get(name)
    if ex: cuts[-1]['ex']={e:{'c':v['c'],'n':round(v['cov'],2),'p':v['p']} for e,v in ex.items()}
  D[k]={'name':v['name'],'sheets':v['sheets'],'hit':v['hit'],'cuts':cuts}
js=('// 2.5D バトル素材の比較試遊のデータ（tools/battle25d/ の build2.py が作る。手で書き換えない）\n'
    '// 技の番号 → { name, sheets（元のシート）, hit（当たるコマ・1から）, cuts:[{ f＝絵, src＝切り出しの名前, m＝位置のモード, pw/ph＝元のコマの大きさ（縮小後）, x/y/w/h＝コマの中の絵の位置, b＝本体（顔・耳・尾・翼・脚）の外接矩形, ex＝切れた辺（T・B・L・R）ごとの光の色 c・量 n・位置の分布 p（10等分） }] }\n'
    'window.MM25D_DATA = '+json.dumps(D,ensure_ascii=False,separators=(',',':'))+';\n')
open(datajs,'w').write(js)
print('cuts',sum(len(v['cuts']) for v in D.values()),'bytes',tot)
