# 透過にしたコマ（raw）の「切れた辺」をなじませる（2026-10-09）
#  - 絵がコマの端まで描かれている辺（本体を除いた光・炎・風が端にかかる辺）だけ、外へ向かって不規則な波の形で薄くする（四角い縁を見せない）
#  - モンスターの本体（外接矩形を少し広げた角の丸い形）は薄くしない
#  - 切れた辺ごとに、光の色（明るい色・濃い色）と光がある位置を記録（ex.json）＝画面で光の粒を足すため
# 使い方：python3 -I soften.py <raw> <out> <cuts2.json> <body_auto.json>
import json,sys,os,glob,zlib,numpy as np,cv2
from PIL import Image
raw,out,cfgf,bodyf=sys.argv[1:5]; os.makedirs(out,exist_ok=True)
C=json.load(open(cfgf)); B=json.load(open(bodyf)); B.update(C.get('_body',{}))
TH=0.08
def ss(t): t=np.clip(t,0,1); return t*t*(3-2*t)
def wave(n,L,rng,amp):
  x=np.arange(L)/max(L,1); y=np.zeros(L)
  for k,a in ((2,1),(5,.55),(11,.3),(23,.15)):
    y+=a*np.sin(2*np.pi*(k*x+rng.random()))
  return y/2.0*amp
def hexc(c): return '#%02x%02x%02x'%tuple(int(v) for v in c)
EX={}
META=json.load(open(raw+'/meta.json')) if os.path.exists(raw+'/meta.json') else {}
for f in sorted(glob.glob(raw+'/*.png')):
  n=os.path.basename(f)[:-4]; im=np.asarray(Image.open(f)).astype(float)
  H,W=im.shape[:2]; al=im[...,3]/255
  rng=np.random.default_rng(zlib.crc32(n.encode()))
  b=B[n]; x0,y0,x1,y1=b[0]*W,b[1]*H,b[2]*W,b[3]*H; mx,my=(x1-x0)*0.04,(y1-y0)*0.04
  x0-=mx;x1+=mx;y0-=my;y1+=my
  yy,xx=np.mgrid[0:H,0:W].astype(float)
  cx,cy,hx,hy=(x0+x1)/2,(y0+y1)/2,(x1-x0)/2,(y1-y0)/2
  r=(np.abs((xx-cx)/hx)**4+np.abs((yy-cy)/hy)**4)**0.25   # 角の丸い四角（1 が縁）
  body=ss((1.06-r)/0.16)
  w=float(np.clip(0.3*min(W,H),50,160))
  dist={'T':yy,'B':H-1-yy,'L':xx,'R':W-1-xx}
  fac=np.ones((H,W)); ex={}; dmin=np.full((H,W),1e9)
  for e,d in dist.items():
    strip=(d>=14)&(d<20)
    cov=float(al[strip].mean())
    if cov<TH: continue
    L=W if e in 'TB' else H
    wv=wave(n+e,L,rng,0.45*w)
    wv2=wv[None,:] if e in 'TB' else wv[:,None]
    fe=ss((d-0.08*w+wv2)/w)
    fac*=fe; dmin=np.minimum(dmin,d+wv2*0.5)
    # 光の色と位置（切れる手前の帯・本体の外・不透明な所）
    band=(d>=w*0.15)&(d<w*0.9)&(body<0.3)&(al>0.55)
    px=im[band][:,:3]
    if len(px)<50: continue
    lum=px.mean(1); sat=px.max(1)-px.min(1)
    c1=np.median(px[lum>=np.percentile(lum,80)],0); c2=np.median(px[sat>=np.percentile(sat,70)],0)
    pos=(xx if e in 'TB' else yy)[band]/(W if e in 'TB' else H)
    hist,_=np.histogram(pos,bins=10,range=(0,1),weights=al[band])
    ex[e]={'cov':round(cov,2),'c':[hexc(c1),hexc(c2)],'p':[round(float(v),2) for v in hist/hist.sum()]}
  # 見出しの帯を消した角（key2.py が四角く消した所）も、境目を不規則な波でなだらかに
  for band,ly0,ly1,lxr in (META.get(n) or {}).get('labels',[]):
    ly1e=min(H,ly1+14) if band=='top' else ly1; ly0e=ly0 if band=='top' else max(0,ly0-10)
    wx=wave(n+'lx',W,rng,0.35*w)[None,:]; wy=wave(n+'ly',H,rng,0.35*w)[:,None]
    dy=(yy-ly1e) if band=='top' else (ly0e-yy)
    dl=np.maximum(xx-lxr+wy,dy+wx)
    fac*=ss((dl+0.1*w)/(0.7*w)); dmin=np.minimum(dmin,np.maximum(dl,0)+0.3*w)
  # 本体も、切れた辺のすぐそば（0.4w）だけは薄くする＝コマの枠で切れた翼・尾の先が直線に見えない
  a2=al*np.maximum(fac,body*ss(dmin/(0.4*w)))
  o=im.copy(); o[...,3]=np.round(a2*255)
  Image.fromarray(o.astype(np.uint8),'RGBA').save(f'{out}/{n}.png')
  if ex: EX[n]=ex
  print(n,''.join(ex.keys()) or '-')
json.dump(EX,open(out+'/ex.json','w'),ensure_ascii=False,indent=0)
