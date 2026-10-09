# 各コマの「本体」（顔・耳・尾・翼・脚を含むモンスターの体）の外接矩形を色から推定 → 確認用の重ね合わせ
import json,glob,os,sys,numpy as np,cv2
from PIL import Image,ImageDraw
raw=sys.argv[1]; out=sys.argv[2]
res={}
for f in sorted(glob.glob(raw+'/*.png')):
  n=os.path.basename(f)[:-4]; a=np.asarray(Image.open(f)).astype(np.uint8)
  rgb=a[...,:3]; al=a[...,3]
  hsv=cv2.cvtColor(rgb,cv2.COLOR_RGB2HSV_FULL).astype(int); h=hsv[...,0]*360/256; s=hsv[...,1]/255; v=hsv[...,2]/255
  op=al>240
  if n[0]=='s':
    m=op&(h>8)&(h<44)&(s>0.12)&(s<0.8)&(v>0.3)&(v<0.99)
  else:
    red=((h<14)|(h>340))&(s>0.55)&(v>0.35)
    cream=(h>15)&(h<45)&(s>0.1)&(s<0.5)&(v>0.6)&(v<0.99)
    talon=(v<0.45)&(s>0.2)&(h<40)
    m=op&(red|cream|talon)
  m=m.astype(np.uint8)
  m=cv2.morphologyEx(m,cv2.MORPH_OPEN,np.ones((5,5),np.uint8))
  m=cv2.morphologyEx(m,cv2.MORPH_CLOSE,np.ones((15,15),np.uint8))
  nl,lab,st,_=cv2.connectedComponentsWithStats(m,8)
  if nl<=1: res[n]=None; continue
  i=1+int(np.argmax(st[1:,4])); big=st[i,4]
  keep=[j for j in range(1,nl) if st[j,4]>big*0.08]
  mm=np.isin(lab,keep)
  ys,xs=np.where(mm)
  H,W=m.shape
  res[n]=[round(float(np.percentile(xs,0.5))/W,4),round(float(np.percentile(ys,0.5))/H,4),round(float(np.percentile(xs,99.5))/W,4),round(float(np.percentile(ys,99.7))/H,4)]
json.dump(res,open(out,'w'),indent=0)
print(len(res))
