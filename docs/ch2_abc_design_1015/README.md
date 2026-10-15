# Chapter 2「潮風の海岸」A／B／C 設計案（2026-10-15 追補・未承認）

依頼 ZIP「Mismon_Ch2_ABC_Claude_Design_Request_20261015」とユーザー回答（論点 1〜5）への回答。読む順：

1. `DESIGN.md` — 設計書（結論・論点 1〜5 の反映・世界とグラフ・2.5D の表現・技術方針・旧セーブ保護・次の承認論点）
2. `route_design.html` — ルート設計図（濃紺の盤・色分けした道・探索路・海底の盆地と螺旋塔・プレビューの画面）
3. `COMPARISON.md` — 3ルート比較表（グラフ・探索路・報酬の割り当て・シミュレーション・感度・推定条件）
4. `asset_requirements.tsv` — 素材要求一覧（添付 03 の形式・52行。プレビューの代用は備考に）
5. `route_A/B/C_overlay.jpg`・`route_A/B/C_schema.png`・`routes_all_overlay.jpg` — 地理図と路線図
6. `shots/` — 2.5D 世界ボードのプレビュー（375×667・390×844・430×932 × A／B／C・螺旋塔の上り）

作り直し方（リポジトリ直下）：
- 道のデータ：`python3 -I tools/ch2/build_ch2_routes.py`（正本＝tools/ch2/routes/spec_A/B/C.json → js/proto/ch2-routes.js・tools/ch2/out/summary.json）
- 設計図：`python3 -I tools/ch2/draw_routes.py`・`python3 -I tools/ch2/make_design_html.py`
- シミュレーション：`node tools/ch2/sim.mjs 600 > tools/ch2/out/sim_600.json`（感度は `… 600 0` → sim_600_spur0.json・`… 600 0.5` → sim_600_spur50.json）→ 比較表 `python3 -I tools/ch2/report.py`
- プレビューの画面：`QA_E2E=1 RF_SHOT_DIR=docs/ch2_abc_design_1015/shots node --test --test-concurrency=1 tests/qa-e2e-ch2-proto-1015.test.mjs`

プレビューの起動：index.html に `?chapterBoard=roadfirst&rfData=ch2&ch2route=A|B|C`（2.5D の世界ビュー＋絵。`&rfView=plan`＝図面）。通常の URL では何も出ない・通常のセーブには書かない。**main 未改変・公開なし・正式アートなし（Chapter 1 の素材の代用）・iPhone 実機は未確認。**
