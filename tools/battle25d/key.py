# 緑背景のコマを透過にする（試作）
import json,sys,os,numpy as np
from PIL import Image
from collections import deque
BG=np.array([3.,247.,18.])
def box1(m,ky,kx):
  c=np.cumsum(np.cumsum(np.pad(m.astype(float),((ky+1,ky),(kx+1,kx))),0),1)
  return (c[2*ky+1:,2*kx+1:]-c[:-2*ky-1,2*kx+1:]-c[2*ky+1:,:-2*kx-1]+c[:-2*ky-1,:-2*kx-1])
def label_mask(a):
  """見出し（番号の札＋説明文の帯）の領域。上の帯の濃紺／黒の帯を横に閉じてつなぎ、左上から続く成分の各行を左端から消す"""
  H,W,_=a.shape; hb=int(H*0.24)
  t=a[:hb]; dark=(t.max(2)<125)&(t[...,2]>=t[...,0]-12)&~((t[...,1]>t[...,0]+50)&(t[...,1]>t[...,2]+50))
  cl=box1(dark,1,14)>0              # dilate
  cl=box1(~cl,1,14)==0               # erode -> closing
  seen=np.zeros_like(cl); q=deque()
  for y in range(hb):
    for x in range(int(W*0.06),int(W*0.22)):
      if cl[y,x] and y<H*0.16: seen[y,x]=True; q.append((y,x))
  while q:
    y,x=q.popleft()
    for ny,nx in((y+1,x),(y-1,x),(y,x+1),(y,x-1)):
      if 0<=ny<hb and 0<=nx<W and cl[ny,nx] and not seen[ny,nx]: seen[ny,nx]=True; q.append((ny,nx))
  m=np.ones((H,W))
  rows=np.where(seen.any(1))[0]
  if len(rows)==0: return m
  # only rows where the band is wide (the label body), plus margin
  wide=[y for y in rows if seen[y].sum()>W*0.12]
  if not wide: return m
  y0,y1=max(0,min(wide)-8),min(H,max(wide)+14)
  xr=int(np.percentile([np.where(seen[y])[0].max() for y in wide],70))
  yy,xx=np.mgrid[0:H,0:W]
  # 見出しの外側へ 22px かけてなめらかに戻す（見出しの下・右の縁が直線で切れて見えないように）
  dy=(yy-y1)/22.; dx=(xx-(xr+10))/22.
  f=np.clip(np.maximum(dy,dx),0,1)
  f[yy<y0-1]=1
  return f
def key(a,t0=35.,t1=150.):
  r,g,b=a[...,0],a[...,1],a[...,2]
  gs=g-np.maximum(r,b)
  al=1-np.clip((gs-t0)/(t1-t0),0,1)
  # unmix the green background: F=(C-(1-a)B)/a
  A=np.maximum(al,1e-3)[...,None]
  F=(a-(1-A)*BG)/A
  F=np.clip(F,0,255)
  # despill remaining green cast
  mx=np.maximum(F[...,0],F[...,2])
  F[...,1]=np.minimum(F[...,1],mx+8)
  return F,al
def cut(sheet,box,inset=7,fade=22):
  im=np.asarray(Image.open(sheet).convert('RGB')).astype(float)
  x0,y0,x1,y1=box; a=im[y0+inset:y1-inset,x0+inset:x1-inset]
  H,W,_=a.shape
  F,al=key(a)
  al*=label_mask(a)
  # 見出しの下線などのかけら：左上に残った小さな塊を消す
  hb,wb=int(H*0.2),int(W*0.36)
  m=al[:hb,:wb]>0.2
  seen=np.zeros_like(m)
  for y0 in range(hb):
    for x0 in range(wb):
      if m[y0,x0] and not seen[y0,x0]:
        q=deque([(y0,x0)]); seen[y0,x0]=True; pts=[]; edge=False
        while q:
          y,x=q.popleft(); pts.append((y,x))
          if y==hb-1 or x==wb-1: edge=True
          for ny,nx in((y+1,x),(y-1,x),(y,x+1),(y,x-1),(y+1,x+1),(y-1,x-1),(y+1,x-1),(y-1,x+1)):
            if 0<=ny<hb and 0<=nx<wb and m[ny,nx] and not seen[ny,nx]: seen[ny,nx]=True; q.append((ny,nx))
        if not edge and len(pts)<H*W*0.004:
          ys,xs=zip(*pts)
          if max(ys)-min(ys)<12:                     # 細い横線だけ（星などは残す）
            for y,x in pts: al[y,x]=0
  yy,xx=np.mgrid[0:H,0:W]; d=np.minimum(np.minimum(xx,W-1-xx),np.minimum(yy,H-1-yy))
  al*=np.clip(d/fade,0,1)
  out=np.dstack([F,al*255]).astype(np.uint8)
  return Image.fromarray(out,'RGBA')
if __name__=='__main__':
  P=json.load(open(sys.argv[1])); od=sys.argv[2]; os.makedirs(od,exist_ok=True)
  for k,(f,ps) in P.items():
    for i,b in enumerate(ps): cut(f,b).save(f'{od}/{k}_{i+1}.png')
    print(k)
