# 技シートのコマ → 透過 PNG（緑の分離・見出しの帯の除去・枠際のぼかし）
import json,sys,os,numpy as np,cv2
from PIL import Image
G=json.load(open(sys.argv[1])); od=sys.argv[2]; os.makedirs(od,exist_ok=True)
def bg_of(a):
  m=(a[...,1]>200)&(a[...,0]<80)&(a[...,2]<80)
  return np.median(a[m],axis=0)
def label_rect(a):
  H,W,_=a.shape
  g=a[...,1]-np.maximum(a[...,0],a[...,2])
  dark=((a.max(2)<105)&(g<40)).astype(np.uint8)
  dark=cv2.morphologyEx(dark,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_RECT,(31,5)))
  rects=[]
  for band in ('top','bot'):
    ys=range(0,int(H*0.26)) if band=='top' else range(int(H*0.72),H)
    good=[]
    for y in ys:
      r=dark[y]; xs=np.where(r[:int(W*0.16)])[0]
      if not len(xs): continue
      x=xs[0]; e=x
      while e<W-1 and r[e+1]: e+=1
      if e-x>W*0.2: good.append((y,e))
    if len(good)<8: continue
    gy=[y for y,_ in good]
    # 縁に近い連続した行のまとまり
    gy.sort(); grp=[[gy[0]]]
    for y in gy[1:]:
      if y-grp[-1][-1]<=6: grp[-1].append(y)
      else: grp.append([y])
    grp=[q for q in grp if len(q)>=8]
    if not grp: continue
    q=grp[0] if band=='top' else grp[-1]
    ends=[e for y,e in good if q[0]<=y<=q[-1]]
    xr=int(np.percentile(ends,85))
    rects.append((band,max(0,q[0]-10),min(H,q[-1]+12),min(W,xr+14)))
  return rects
def key(a,BG,k=1.0):
  """緑の地からの分離。alpha は緑の強さから・前景は混色を戻す。
  半透明の光（炎・星の光）は、戻した色の緑が赤／青の k 倍を超えない所まで alpha を下げて色を戻す（緑かぶりのオリーブ色を残さない）。
  不透明な画素（体・毛・羽）は変えない"""
  gs=a[...,1]-np.maximum(a[...,0],a[...,2])
  t1=BG[1]-max(BG[0],BG[2])
  al=1-np.clip(gs/t1,0,1)
  mrb=np.maximum(a[...,0]-BG[0],a[...,2]-BG[2])
  # F_g <= k*F_rb  <=>  Bg - (Bg-Cg)/al <= k*(mrb/al + BGrb)  -> al <= (Bg-Cg + k*mrb)/(Bg - k*BGrb)
  lim=(BG[1]-a[...,1]+k*np.maximum(mrb,0))/(BG[1]-k*max(BG[0],BG[2]))
  semi=al<0.985
  al=np.where(semi,np.minimum(al,np.clip(lim,0,1)),al)
  A=np.maximum(al,1e-3)[...,None]
  F=np.clip((a-(1-A)*BG)/A,0,255)
  mx=np.maximum(F[...,0],F[...,2]); F[...,1]=np.minimum(F[...,1],np.maximum(mx*k,0)+4)
  return F,al

def trim(a):
  """縁から 40px 以内の枠線（濃紺・黒のほぼ全幅の行／列）を切り落とす"""
  H,W,_=a.shape
  g=a[...,1]-np.maximum(a[...,0],a[...,2])
  bd=((a.max(2)<185)&(g<30)&(a[...,2]>=a[...,0]-25))|(a.max(2)<60)
  t=b=l=r=0
  rf=bd.mean(1); cf=bd.mean(0)
  for y in range(40):
    if rf[y]>0.85: t=y+1
    if rf[H-1-y]>0.85: b=y+1
  for x in range(40):
    if cf[x]>0.85: l=x+1
    if cf[W-1-x]>0.85: r=x+1
  return t,b,l,r
meta={}
for k,ps in G.items():
  sheet=np.asarray(Image.open(k).convert('RGB')).astype(float); BG=bg_of(sheet)
  base=('s' if 'soramo' in k else 'g')+os.path.basename(k)[:2]+('b' if k.endswith('_2.png') else '')
  crops=[]
  for i,(x0,y0,x1,y1) in enumerate(ps):
    ins=3; a=sheet[y0+ins:y1-ins+1,x0+ins:x1-ins+1]
    t,b,l,r=trim(a); t+=3;b+=3;l+=3;r+=3
    a=a[t:a.shape[0]-b,l:a.shape[1]-r]
    crops.append((a,[x0+ins+l,y0+ins+t,x1-ins+1-r,y1-ins+1-b],label_rect(a)))
  # 同じシートの見出しは同じ大きさ＝帯ごとに和集合（縁からの位置）
  U={}
  for a,_,rs in crops:
    H,W,_=a.shape
    for band,ly0,ly1,lxr in rs:
      d0=(ly1 if band=='top' else H-ly0)
      u=U.get(band,(0,0)); U[band]=(max(u[0],d0),max(u[1],lxr))
  for i,(a,box,_) in enumerate(crops):
    H,W,_=a.shape
    F,al=key(a,BG,0.82 if 'gauru' in k else 1.0)
    rs=[(bd,0,dd+6,lx+8) if bd=='top' else (bd,H-dd-6,H,lx+8) for bd,(dd,lx) in U.items()]
    yy,xx=np.mgrid[0:H,0:W]
    # 見出しの帯：帯の矩形（番号の札の下の金縁まで＝縦に +14px）を消し、外側へ柔らかく戻す（右・内側へ 30px）。
    # 帯の下に隠れていた絵は元から無い＝作らない（埋め直しはしない：上下に引き伸ばした縞になるため）
    for band,ly0,ly1,lxr in rs:
      fd=30.
      if band=='top': ly1=min(H,ly1+14)
      else: ly0=max(0,ly0-10)
      dx=(xx-lxr)/fd
      dy=((ly0-yy) if band=='bot' else (yy-ly1))/fd
      f=np.clip(np.maximum(dx,dy),0,1); f=f*f*(3-2*f); al*=f
    e=np.minimum(np.minimum(xx,W-1-xx),np.minimum(yy,H-1-yy)); al*=np.clip(e/12.,0,1)
    name=f'{base}_{i+1}'
    Image.fromarray(np.dstack([F,al*255]).astype(np.uint8),'RGBA').save(f'{od}/{name}.png')
    meta[name]={'sheet':k,'panel':box,'labels':rs}
    print(name,W,H,rs)
json.dump(meta,open(od+'/meta.json','w'),ensure_ascii=False,indent=0)
