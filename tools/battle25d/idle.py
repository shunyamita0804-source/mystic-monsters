# 待機絵（白〜薄灰の背景の JPEG）の背景を透過にする
import sys,numpy as np
from PIL import Image
from collections import deque
def run(src,dst,th=26,soft=(12,40),pockets=True,grow=34):
  a=np.asarray(Image.open(src).convert('RGB')).astype(float); H,W,_=a.shape
  # 背景の色：四辺の画素から2次の面で近似（白〜灰のグラデーション）
  ys,xs=np.mgrid[0:H,0:W]
  bm=np.zeros((H,W),bool); bm[:8]=bm[-8:]=True; bm[:,:8]=bm[:,-8:]=True
  X=np.stack([np.ones(bm.sum()),xs[bm]/W,ys[bm]/H,(xs[bm]/W)**2,(ys[bm]/H)**2,xs[bm]*ys[bm]/W/H],1)
  Bg=np.zeros_like(a)
  for c in range(3):
    co,*_=np.linalg.lstsq(X,a[...,c][bm],rcond=None)
    Bg[...,c]=co[0]+co[1]*xs/W+co[2]*ys/H+co[3]*(xs/W)**2+co[4]*(ys/H)**2+co[5]*xs*ys/W/H
  d=np.sqrt(((a-Bg)**2).sum(2))
  mx=a.max(2); mn=a.min(2); sat=(mx-mn)/np.maximum(mx,1)
  # 影：背景より暗いが無彩色（足元の影）。影も背景として扱い、半透明にしない
  # 局所の分散：背景はなめらか・白い毛には細かい筋がある（白い毛を背景として消さない）
  g=a.mean(2); k=3
  gp=np.pad(g,((k+1,k),(k+1,k)),mode='edge'); c1=np.cumsum(np.cumsum(gp,0),1); c2=np.cumsum(np.cumsum(gp*gp,0),1)
  bx=lambda c:(c[2*k+1:,2*k+1:]-c[:-2*k-1,2*k+1:]-c[2*k+1:,:-2*k-1]+c[:-2*k-1,:-2*k-1])/((2*k+1)**2)
  sd=np.sqrt(np.maximum(bx(c2)-bx(c1)**2,0))
  low=ys>H*0.6
  shadowish=(sat<0.1)&(g<Bg.mean(2))&(d<(np.where(low,120,70)))&(sd<6)
  cand=((d<th)&(sd<3.2))|shadowish
  seen=np.zeros((H,W),bool); q=deque()
  for y in range(H):
    for x in (0,W-1):
      if cand[y,x]: seen[y,x]=True; q.append((y,x))
  for x in range(W):
    for y in (0,H-1):
      if cand[y,x] and not seen[y,x]: seen[y,x]=True; q.append((y,x))
  while q:
    y,x=q.popleft()
    for ny,nx in((y+1,x),(y-1,x),(y,x+1),(y,x-1)):
      if 0<=ny<H and 0<=nx<W and cand[ny,nx] and not seen[ny,nx]: seen[ny,nx]=True; q.append((ny,nx))
  # 足元の閉じた影（爪の間など）：下 35% の背景に近い無彩色の塊（150画素以上）も背景
  y0=0; sub=cand&~seen; lab=np.zeros(sub.shape,bool); vis=np.zeros(sub.shape,bool)
  hh,ww=sub.shape
  for yy in range(hh):
    for xx in range(ww):
      if sub[yy,xx] and not vis[yy,xx]:
        q=deque([(yy,xx)]); vis[yy,xx]=True; pts=[]
        while q:
          y,x=q.popleft(); pts.append((y,x))
          for ny,nx in((y+1,x),(y-1,x),(y,x+1),(y,x-1)):
            if 0<=ny<hh and 0<=nx<ww and sub[ny,nx] and not vis[ny,nx]: vis[ny,nx]=True; q.append((ny,nx))
        low=y0+pts[0][0]>H*0.65
        if len(pts)>=(150 if low else 600) and (pockets or low):
          for y,x in pts: seen[y0+y,x]=True
  # 縁の取り残し（背景色に近い 1〜3px の輪）を背景へ
  for _ in range(3):
    nb=np.zeros((H,W),bool)
    for dy,dx in((1,0),(-1,0),(0,1),(0,-1)): nb|=np.roll(seen,(dy,dx),(0,1))
    seen|=nb&(d<grow)
  # 縁：背景に接した前景の画素だけ、背景との距離で少しだけ半透明に（白い毛を消さない）
  al=np.where(seen,0.,1.)
  edge=np.zeros((H,W),bool)
  for dy,dx in((1,0),(-1,0),(0,1),(0,-1)):
    edge|=np.roll(seen,(dy,dx),(0,1))
  edge&=~seen
  e=np.clip((d-soft[0])/(soft[1]-soft[0]),0.3,0.5)
  al[edge]=e[edge]
  ring2=np.zeros((H,W),bool)
  for dy,dx in((1,0),(-1,0),(0,1),(0,-1)): ring2|=np.roll(edge,(dy,dx),(0,1))
  ring2&=~seen&~edge
  al[ring2]=0.88
  # 縁の色を背景から戻す
  A=np.maximum(al,1e-3)[...,None]
  F=np.clip((a-(1-A)*Bg)/A,0,255)
  out=np.dstack([F,al*255]).astype(np.uint8)
  im=Image.fromarray(out,'RGBA'); im=im.crop(im.getbbox())
  im.save(dst); print(dst,im.size)
run(sys.argv[1],sys.argv[2],pockets=sys.argv[3]=='1',grow=float(sys.argv[4]))
