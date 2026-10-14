#!/usr/bin/env python3
"""2026-10-14 実機試遊⑤：立体サイコロの SE に「投げる音」を戻した派生（原本は変えない）。
材料（どちらも repo の中の正式採用の音）：
  T＝assets/audio/se/mystic_monsters_official/01_dice_large_full.ogg（正式 DICE_THROW＝2026-10-06 から立体サイコロの前まで盤のサイコロの投げ始めに1回鳴っていた音）。
    0〜0.50秒が投げる音（0.50〜0.55秒は無音・0.55秒から着地と転がる音）＝投げる音だけを使う（0.42〜0.50秒でやわらかく消す）
  L＝assets/audio/se/dice_1013/dice_cube_throw_land.ogg（現行 DICE_CUBE＝開発27（17）の着地の足音「トンッ 0.88／ト 1.115／トン 1.275」だけ。0〜0.85秒は無音）
組み立て：0〜0.50秒＝T の投げる音（音量は DICE_THROW の gain 0.95 と DICE_CUBE の gain 0.9 の比で合わせる）→ 0.50〜0.86秒は無音（回っている間）→ 0.86秒〜＝L（着地）。
  1本の完成した音（投げる＋着地）＝鳴らすのは1ロールに1回だけ（着地を別に重ねない）。時刻は 1.30秒の動き（投げ上げ 0.14秒・トンッ 0.90・ト 1.14・トン 1.30）のまま。
出力：assets/audio/se/dice_1014/dice_cube_throw_land2.ogg（OGG Vorbis q5・48kHz ステレオ）
使い方：python3 -I tools/dice1014/se_throw.py
"""
import os, subprocess
import numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
T = os.path.join(ROOT, 'assets/audio/se/mystic_monsters_official/01_dice_large_full.ogg')
L = os.path.join(ROOT, 'assets/audio/se/dice_1013/dice_cube_throw_land.ogg')
OUT = os.path.join(ROOT, 'assets/audio/se/dice_1014/dice_cube_throw_land2.ogg')
SR = 48000
def load(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()
t, l = load(T), load(L)
n = len(l); out = l.copy()
a, b = int(0.42 * SR), int(0.50 * SR)
seg = t[:b].copy() * (0.95 / 0.9)
x = np.ones(b); x[a:b] = 0.5 + 0.5 * np.cos(np.pi * (np.arange(b - a) / (b - a)))
seg *= x[:, None]
out[:b] += seg
out[b:int(0.86 * SR)] = l[b:int(0.86 * SR)]   # 回っている間は L のまま（L はこの区間が無音）
out = np.clip(out, -1, 1)
os.makedirs(os.path.dirname(OUT), exist_ok=True)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'libvorbis', '-q:a', '5', OUT], input=out.astype(np.float32).tobytes(), check=True)
print(OUT, n / SR)
