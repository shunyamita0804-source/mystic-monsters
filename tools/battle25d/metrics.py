# 各技の「本体」の大きさと足元（コマの中の位置）を色から推定する（試作の目安。ゲーム側で微調整）
import json,sys,numpy as np,colorsys
from PIL import Image
out=sys.argv[1]; man=json.load(open(out+'/manifest.json'))
def body_mask(a,sp):
  rgb=a[...,:3]/255.; al=a[...,3]/255.
  mx=rgb.max(2); mn=rgb.min(2); sat=(mx-mn)/np.maximum(mx,1e-3)
  r,g,b=rgb[...,0],rgb[...,1],rgb[...,2]
  # hue (deg)
  d=np.maximum(mx-mn,1e-3); h=np.where(mx==r,((g-b)/d)%6,np.where(mx==g,(b-r)/d+2,(r-g)/d+4))*60
  if sp=='soramo': m=(al>0.9)&(h>8)&(h<38)&(sat>0.12)&(sat<0.75)&(mx>0.35)
  else: m=(al>0.9)&(((h<12)|(h>345))&(sat>0.55)&(mx>0.45))
  return m
for slot,v in man.items():
  sp='soramo' if v['key'][0]=='s' else 'gauru'
  q=next(c for c in v['cuts'] if 'f' in c)
  a=np.asarray(Image.open(out+'/'+q['f']).convert('RGBA')).astype(float)
  m=body_mask(a,sp)
  ys,xs=np.where(m)
  if len(ys)<50: print(slot,'no body'); continue
  y0,y1=np.percentile(ys,[1,99.5]); x0,x1=np.percentile(xs,[1,99])
  v['body']={'h':round((y1-y0)/v['ph'],3),'gx':round((q['x']+(x0+x1)/2)/v['pw'],3),'gy':round((q['y']+y1)/v['ph'],3)}
  print(slot,v['name'],v['body'])
json.dump(man,open(out+'/manifest.json','w'),ensure_ascii=False,indent=0)
