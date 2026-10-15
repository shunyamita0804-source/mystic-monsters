# Chapter 2「潮風の海岸」A／B／C 設計案（2026-10-15・未承認）

依頼 ZIP「Mismon_Ch2_ABC_Claude_Design_Request_20261015」への回答。読む順：

1. `DESIGN.md` — 設計書（結論・世界・3ルートのグラフ・技術方針・旧セーブ保護・承認論点・次の工程）
2. `routes_all_overlay.jpg`・`route_A/B/C_overlay.jpg` — 世界観参照の上に重ねた地理図（`route_*_schema.png` は白地の路線図）
3. `COMPARISON.md` — 3ルート比較表（グラフの数値・シミュレーション・推定条件と未測定）
4. `asset_requirements.tsv` — 画像 AI へ依頼する素材要求一覧（添付 03 の形式）
5. `shots/` — 限定試作の画面（375×667・390×844・430×932 × A／B／C）

作り直し方（リポジトリ直下）：
- 道のデータ：`python3 -I tools/ch2/build_ch2_routes.py`（正本＝tools/ch2/routes/spec_A/B/C.json → js/proto/ch2-routes.js・tools/ch2/out/summary.json）
- 設計図：`python3 -I tools/ch2/draw_routes.py`
- シミュレーション：`node tools/ch2/sim.mjs 600 > tools/ch2/out/sim_600.json` → 比較表 `python3 -I tools/ch2/report.py`
- 試作の画面：`QA_E2E=1 RF_SHOT_DIR=docs/ch2_abc_design_1015/shots node --test --test-concurrency=1 tests/qa-e2e-ch2-proto-1015.test.mjs`

試作の起動：index.html に `?chapterBoard=roadfirst&rfData=ch2&ch2route=A|B|C&rfView=world`（通常の URL では何も出ない・通常のセーブには書かない）。**main 未改変・公開なし・正式アートなし・iPhone 実機は未確認。**
