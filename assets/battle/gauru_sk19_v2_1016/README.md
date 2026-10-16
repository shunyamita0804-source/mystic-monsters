# ガウル SK19「聖なる炎」承認演出 V2（2026-10-16・試験実装・作業ブランチだけ）

- 受け取り：ZIP `Mismon_Claude_SK19_Only_TestHandoff_20261016` の `01_承認演出V2_PNG`（ユーザー承認の試写 V2 の素材）。試写動画（`02_試写動画_参照のみ`）はゲームに入れない
- 作り方：`python3 -I tools/sk19v2/derive.py <01_承認演出V2_PNG のフォルダ>`＝乗算済みアルファで縮小して WebP（品質 90・アルファ 100）にしただけ。色・形は変えない・描き直さない・原本 PNG はリポジトリに置かない
- 飛行2枚は参照待機（cutout）と同じ 1254 のキャンバス＝切り詰めない（位置合わせを保つ）。放射4枚は 1024 → 768
- 使う所：`js/battle/sk19-v2-1016.js`（`MMSK19V2`）。バトルの正式の待機絵は `assets/battle/idle/idle_gauru.webp` のまま（参照待機 cutout は使わない）
- 旧 B_05（減衰）・敵側の着弾 B_06／B_07・飛翔弾・照準 UI は不採用（受け取っていない）

| 原本 | 大きさ | 原本の sha256 | 派生 | 派生の sha256 |
|---|---|---|---|---|
| Gauru_flight_wings_up_preview.png | 1254×1254 | `c202da4a79a3d07f3d06289fb52c7d422be74c3d0a2de48b0fbcd41731800d8f` | fly_up.webp | `fe90ccc92c94d42d4217ef1fa48c49b42bcd184c8110d8317984f003f0d3884d` |
| Gauru_flight_wings_down_preview.png | 1254×1254 | `5cc1eddfc27b4839effc53e7ea5e01813b9265538662f63d9ee5052741537601` | fly_down.webp | `4470da0bae6aed1810dbc2f0043169798fa071c8bebb416a03674eacb37115c8` |
| B_01_gauru_holyflame_self_ignite.png | 1024×1024 | `0779a515bd6216f2c940265ee6a5f49d7e99c64b7cb33dcf8913ff534bf641e6` | flame_01_ignite.webp | `200a91f9329df53ef645c15ce5594d287f1a4222b0381e35a4252e514e9178ec` |
| B_02_gauru_holyflame_self_expand.png | 1024×1024 | `23704f9fe504b095e0c6772ccc247e332852d9872b3022faead9ea0eca6b3d4b` | flame_02_expand.webp | `a17bb7cfbb5b9a7fc78a09a5a839441f2ec020072e54b5e5fa9ac74e176824b8` |
| B_03_gauru_holyflame_self_radiate.png | 1024×1024 | `7db8bd853a1de1f04d2bfeda32c15ef0b023fb85459ba31ca9fc3596ebc0779c` | flame_03_radiate.webp | `9a1bbb6086445bf176c9778cd53f860777327ddc18c7103d5c7e3aed2b9b40c4` |
| B_04_gauru_holyflame_self_peak.png | 1024×1024 | `2a11219adaa33abce684a924c752c82219118a66e0ee4675f187287f55c79922` | flame_04_peak.webp | `16a48832f9916c45fd59eb2eb2cfea8c47ae783f4c295b65f07b2aaf9285abf3` |
| Gauru_official_art_transparent_preview_cutout.png | 1254×1254 | `7497f3e06c128e257b4f5d57b5478dc0ad2d46880a3e33e3dbe7b4c011079a5e` | （置かない・位置合わせの参照だけ） | — |

## 気づいた点（原本のまま・直していない）
- `Gauru_flight_wings_down_preview.png` の右端（列 1253）に不透明な画素が 20 行＝前へ出た翼の羽先がキャンバスの端でまっすぐ切れている（ゲームの表示で 2〜6px の短い縦の切れ目。相手側は左端）
- 正式の待機絵（idle_gauru）と飛行ポーズは別の絵（翼の高さ・尾・脚の構え）。目の位置を合わせたので顔は飛ばないが、翼と尾の形は入れ替わりの瞬間に変わる
- 白・黒・濃紺の3背景で輪郭の色のにじみ（フリンジ）は目立たない（報告書の edges 画像）
