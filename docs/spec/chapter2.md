# Chapter 2「潮風の海岸」

旧 CLAUDE.md §3 から移した節（文はそのまま・節の順も元のまま）。同じ事柄は日付の新しい記述が優先し、各節の「〇〇が優先」「以下は旧記録」などの注記に従う。本文の「§3「〇〇」」は旧 CLAUDE.md の節名＝移設先は docs/README.md の対応表で引く。

## 盤の描画の修正（2026-10-19 P0・iPhone 試遊「最初だけ道がぼける」「道とマスがくっついていない」）

- 原因：海の世界の平面（preserve-3d）に、iPhone（Safari）では親（.rfw）の perspective が効かず、奥ほど地面と道がマス・モンスターより遠くへずれていた（手前だけ合う）。また近くの細かい層と遠くの層が同じ高さで、Safari では見る向きによって前後が入れ替わり、ぼけた遠くの層が上に出ていた。
- 修正：海の世界だけ、遠近を平面の transform の perspective() に入れる（js/proto/roadfirst-world.js の planeTf・同じ行列＝Chromium の描画は変わらない）。近くの層の区画は地面より 0.05 単位上（js/qa/road-1016.js の LIFT・海面 0.3 より下）。Chapter 1・3・4（平らな平面）は従来どおり。
- 検証用の Chromium では iPhone の症状は再現しない（描き方が違う）。iPhone での確認が必要。

## この主題にかかわるほかの記録

- docs/history/spec-2026-10-15_19.md「本編試遊の緊急修正 v2（2026-10-18）」：本編の Chapter 2＝新しい A／B／C の盤・旧盤の個体の扱い・道路
- docs/history/spec-2026-10-15_19.md「2026-10-17 統合便 v2」：新しい盤の線引き（当時）・道路のぼけ
- docs/proposals/chapter2-art-1016.md：正式美術・本編の盤（作業ブランチ当時の記録）
- docs/proposals/chapter2-abc-design-1015.md：A／B／C の設計案・限定試作・追補（到達率の基準・旧セーブの判定）
- docs/history/handoff.md：2026-10-16 時点の「次の作業＝Chapter 2」の整理
- docs/spec/board.md：旧 Chapter 2（ch2a.js）の記録
- docs/ch2_abc_design_1015/・docs/ch2_art_1016/：設計書・報告

（Chapter 2 の正式仕様の節は旧 CLAUDE.md §3 では便の記録と提案の中にだけあった＝上の各ファイルを読む。）
