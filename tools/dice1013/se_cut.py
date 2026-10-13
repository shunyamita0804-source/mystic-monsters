"""2026-10-13 開発25 E：立体サイコロの SE を「投げる音 → 回る間は無音 → 着地の音」にした派生（原本は変えない）。
材料（どちらも repo の中・同じ時間軸 1.595秒）：
  A＝assets/audio/se/dice_1012/dice_magic_b4_long_tap.ogg（正式採用＝A1 投げる・B4 回る・着地「トンッ 0.88／ト 1.115／トン 1.275」・C1 止まる光）
  B＝prototype/dice_1012/se/dice_magic_b4_long.ogg（同じ合成の着地音なし版）
組み立て：
  0〜0.34秒＝A（投げる音 A1。B4 の入り始めは −8dB の小さな音）→ 0.34〜0.46秒で消す（A1 自身のフェードと同じ区間）
  0.86〜1.10秒＝A−B（＝着地の1音目「トンッ」だけ。回る音 B4 は入らない）
  1.10秒〜＝A（B4 はもう −51dB 以下＝着地の2・3音目と止まる光 C1）
  0.46〜0.86秒は完全な無音（回っている間）。音の時刻は元と同じ＝1.30秒の動き（トンッ 0.90・ト 1.14・トン 1.30）とのずれは元と同じ（約20ms 先）
出力：assets/audio/se/dice_1013/dice_cube_throw_land.ogg（OGG Vorbis q5・48kHz ステレオ）
使い方：python3 -I tools/dice1013/se_cut.py
"""
import os, subprocess, sys
import numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
A = os.path.join(ROOT, 'assets/audio/se/dice_1012/dice_magic_b4_long_tap.ogg')
B = os.path.join(ROOT, 'prototype/dice_1012/se/dice_magic_b4_long.ogg')
OUT = os.path.join(ROOT, 'assets/audio/se/dice_1013/dice_cube_throw_land.ogg')
SR = 48000

def load(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()

def ramp(t, a, b, up=True):
    x = np.clip((t - a) / (b - a), 0, 1); x = 0.5 - 0.5 * np.cos(np.pi * x)
    return x if up else 1 - x

def main():
    a, b = load(A), load(B); n = min(len(a), len(b)); a, b = a[:n], b[:n]
    t = np.arange(n) / SR
    g_throw = ramp(t, 0.34, 0.46, up=False)
    g_tap1 = ramp(t, 0.855, 0.87) * ramp(t, 1.085, 1.10, up=False)
    g_land = ramp(t, 1.095, 1.11)
    out = a * g_throw[:, None] + (a - b) * g_tap1[:, None] + a * g_land[:, None]
    out[(t > 0.46) & (t < 0.855)] = 0.0
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    p = subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'libvorbis', '-q:a', '5', '-map_metadata', '-1', OUT], input=out.astype(np.float32).tobytes(), check=True)
    print('wrote', OUT)

if __name__ == '__main__':
    sys.exit(main())
