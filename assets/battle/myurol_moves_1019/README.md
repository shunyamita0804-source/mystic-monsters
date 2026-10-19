# ミュロルの技アニメ（2026-10-19・登録のみ・未解禁＝QA 試遊だけ）

- 正式納品 PART04〜07 の 05_skill_animations（10技×本体／技エフェクト／命中エフェクト＝原本 PNG 150枚・各 1536×1536 RGBA・右向き）。コマの絵の場所は各技の manifest.json から読んだ（2026-10-19 にファイル名が変わった＝旧い 01.png を前提にしない）。原本はリポジトリに置かない。
- 派生 90枚＝本体 47（同じ技の中で同じ原本のポーズは1枚にまとめた）・本体と同じ切り出しの技エフェクト 25・相手の位置に置く命中エフェクト 9・No.10 の舞台の座標の層 9（津波 7・命中 2）。空の層（完全な透明）は作らない。透明な余白を切って 0.45倍・WebP 品質86。描き直し・色の加工なし。
- 道具＝tools/myurol1019/build_moves.py・データ＝js/battle/myurol-moves-data.js（`MMMYMV_DATA`・技の番号は No.・区切りの長さ ms＝manifest の duration_ms・本体の横の位置 r＝body_preview_stage_dx_pixels ÷ 820）。SK＝80＋No−1（js/battle/art25d.js の `YSK`）。補助技（No.4・8）は当たる区切りなし。
- No.10 マリンストリーム（TSUNAMI_V2_20261019）：津波と命中は本体の動きに付けない＝manifest の fx_stage_rect／hit_fx_stage_rect（舞台 1280×720）を js/battle/art25d.js の `stageMap` で画面へ（大きさは本体と同じ倍率・自分の足もと〜相手の中心は画面の自分〜相手へ・相手側の攻撃は舞台ごと左右反転）。描く順＝津波 → 本体 → 命中。旧い口先の水流の版は取り込まない。
- 原本の注記（manifest）：03 の元 MP4 は不完全（検収画像から再作成）・旧納品で途中切れだった本体3枚は同じポーズの原本で復旧・02 の破損した技エフェクト1枚は新しい透過画像で補完・10 は「first-pass technical QA, game-device unverified」。
- 原本と派生の sha256 は同じフォルダの **sha256.txt**（原本 150行＋派生 90行）。
