#!/bin/sh
# Chapter 4 の 40ターン反復シミュレーションを全条件で回す（2026-10-18）。
#   sh tools/ch4/run_all.sh <出力フォルダ> [ch4-routes.js（既定＝js/proto/ch4-routes.js）] [seed 数＝12000]
#   条件＝食事あり（CH4_FOOD=10）／食事なし（0）× 寄り道 0・0.25・0.5 ＝ 6 ファイル。各ファイルに Ch1-A（基準）・Ch2-A（参考）・Ch4-A／B／C（各 seed 数 × ソラモ・ガウル）
#   seed＝(i+SEED0)*7919+13（i＝1〜N・SEED0＝0）＝決定的。同じ入力なら同じ結果。
set -e
OUT=${1:?出力フォルダ}
ROUTES=${2:-}
N=${3:-12000}
mkdir -p "$OUT"
for f in 10 0; do
  for s in 0 0.25 0.5; do
    if [ -n "$ROUTES" ]; then CH4_ROUTES="$ROUTES" CH4_FOOD=$f node tools/ch4/sim.mjs "$N" "$s" > "$OUT/sim_food${f}_spur${s}.json"
    else CH4_FOOD=$f node tools/ch4/sim.mjs "$N" "$s" > "$OUT/sim_food${f}_spur${s}.json"; fi
    echo "done food=$f spur=$s"
  done
done
