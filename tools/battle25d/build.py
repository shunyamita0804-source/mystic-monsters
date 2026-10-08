# 透過にしたコマ（raw）に clip／erase／flip を当て、余白を切って WebP にする。manifest を出す
import json,sys,os,hashlib,numpy as np
from PIL import Image
raw,out,cfgf=sys.argv[1],sys.argv[2],sys.argv[3]
os.makedirs(out+'/soramo',exist_ok=True); os.makedirs(out+'/gauru',exist_ok=True)
C=json.load(open(cfgf)); C.pop('_note',None)
SCALE={'s':0.62,'g':0.92}
man={}
for key,mv in C.items():
  sp='soramo' if key[0]=='s' else 'gauru'; sc=SCALE[key[0]]
  cuts=[]
  for i,q in enumerate(mv['cuts']):
    if 'skip' in q: cuts.append({'skip':q['skip']}); continue
    im=Image.open(f'{raw}/{key}_{i+1}.png'); a=np.asarray(im).astype(float); H,W,_=a.shape
    al=a[...,3]/255.
    xx=np.arange(W)/W
    if 'clip' in q:
      l,r=q['clip']; fd=0.045
      al*=np.clip((xx-l)/fd,0,1)[None,:] if l>0 else 1
      al*=np.clip((r-xx)/fd,0,1)[None,:]
    for (x0,y0,x1,y1) in q.get('erase',[]):
      yy=np.arange(H)/H; fd=0.05
      fx=np.clip(np.maximum((x0-xx)/fd,(xx-x1)/fd),0,1)[None,:]; fy=np.clip(np.maximum((y0-yy)/fd,(yy-y1)/fd),0,1)[:,None]
      al*=np.maximum(fx,fy)
    a[...,3]=al*255
    img=Image.fromarray(a.astype(np.uint8),'RGBA')
    if q.get('flip'): img=img.transpose(Image.FLIP_LEFT_RIGHT)
    img=img.resize((round(W*sc),round(H*sc)),Image.LANCZOS)
    pw,ph=img.size
    bb=img.getchannel('A').point(lambda v:255 if v>6 else 0).getbbox()
    img=img.crop(bb)
    fn=f'{sp}/{mv["slot"]:02d}_{i+1}.webp'
    img.save(f'{out}/{fn}','WEBP',quality=86,method=6)
    cuts.append({'f':fn,'m':q['m'],'x':bb[0],'y':bb[1],'w':img.width,'h':img.height})
  man[mv['slot']]={'key':key,'name':mv['name'],'pw':pw,'ph':ph,'cuts':cuts}
json.dump(man,open(f'{out}/manifest.json','w'),ensure_ascii=False,indent=0)
tot=sum(os.path.getsize(os.path.join(dp,f)) for dp,_,fs in os.walk(out) for f in fs if f.endswith('.webp'))
print('files',sum(1 for v in man.values() for c in v['cuts'] if 'f' in c),'bytes',tot)
