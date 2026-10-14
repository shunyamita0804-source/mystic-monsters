# Chapter 1 B／C の目印（2026-10-14）

ユーザー納品の透過 PNG（ZIP `Mismon_Chapter1_BC_Landmarks_TransparentPNG_20261014`・各 1024×1024・本物の透過）から作った表示用の派生。
`tools/landmarksbc1014/derive.py`＝余白を切る（透明度 7 以上の範囲＋6px）→ 長辺 512px 以下に縮小 → 透過 WebP（品質88）。**絵は描き直していない・色は変えていない。原本はリポジトリに置かない**（下の sha256 は原本）。
置き場所と大きさは `tools/roadfirst/routes/spec_B.json`・`spec_C.json` の landmarks（→ `js/proto/roadfirst-routes.js` の art.landmarks。地点 ID は A と同じ）。B は `b_*`、C は `c_*`。

| ファイル | 役割（地点） | 原本 | 原本の sha256 | 大きさ |
|---|---|---|---|---|
| b_l_chest.webp | 宝1（L_CHEST・150G） | B-1_八角東屋_透過PNG.png | `16bbb7b20f144592408c23d38c3c884cec26e1836018fe998800b4c2895408cb` | 291×512 |
| b_r_chest.webp | 宝2（R_CHEST・150G） | B-2_水車小屋_透過PNG.png | `148f551dc34da6ef0e367eca47c72b57f4e7eeee6642c68eb85d8cc5f7a8c585` | 348×512 |
| b_l_altar.webp | 宝3（L_ALTAR・全能力+10） | B-3_森の祭壇_透過PNG.png | `49159beb3594ee17c8f547d39c35b812c182a25e4d7fcb9871d51d858ebdf09f` | 325×512 |
| b_l_late_altar.webp | 宝4（L_LATE_ALTAR・全能力+15） | B-4_奥の祭壇_透過PNG.png | `22770a61f8486411fe777449f442d0899c3f009d6e1b9f9bf0d782b8f882ee2c` | 290×512 |
| b_reward5.webp | 宝5（REWARD5・空腹−50＋100G） | B-5_石像の報酬_透過PNG.png | `b699a7e36d4101fcd82ac37bcfa9b94cc783bb48c571cbd32aa60d3240a48fae` | 203×512 |
| b_r_special.webp | 宝6（R_SPECIAL・いちばん得意な能力+30） | B-6_虹の滝_透過PNG.png | `cb16bc0e23cb2867509e45b29e4a512773b62085b004b058e23bc6b57eeb4e75` | 309×512 |
| b_den_closed.webp | 隠れ家（RANDOM_DEN・閉） | B-7a_隠れ家_閉_透過PNG.png | `b828a678531fa270301eaa8bbb37872ecb973e56d6e77d60418c07befb2f99cf` | 361×512 |
| b_den_open.webp | 隠れ家（RANDOM_DEN・開） | B-7b_隠れ家_開_透過PNG.png | `ffd24343c9467cb13ace7d06428a02f7184ce5aa2ed57eb6ad56a12e3f509ea7` | 360×512 |
| b_challenge.webp | 特殊挑戦の門（CHALLENGE） | B-8_特殊挑戦の門_透過PNG.png | `fb4c75e1952758083c3a1d21bdd54214fe4a4330211ebbbd733e8bf7dc033a62` | 334×512 |
| b_statue.webp | 道中の石像（STATUE） | B-9_白鳥の石像_透過PNG.png | `f0bd1b9e2756964f8b0a6a00c5d005714784b2595991fa423f1ecb62073b8319` | 335×512 |
| c_l_chest.webp | 宝1（L_CHEST・150G） | C-1_崩れた見張り塔_透過PNG.png | `7b24dffc2b8825720eae172840c10512760511f6ddf911c7a529c095e6bff517` | 255×512 |
| c_r_chest.webp | 宝2（R_CHEST・150G） | C-2_宝物庫の入口_透過PNG.png | `7ad0ba845aca5d734a4e1bd24f61c830e799dd96df0bb0d0fc93af8cfeb0350c` | 417×512 |
| c_l_altar.webp | 宝3（L_ALTAR・全能力+10） | C-3_環状列石_透過PNG.png | `0fd86e0dc8d65daf8894b896e4cbeea7aed423871ed6d3b19248eda8469932c6` | 512×483 |
| c_l_late_altar.webp | 宝4（L_LATE_ALTAR・全能力+15） | C-4_列柱神殿_透過PNG.png | `631e1850ae92e57edf72c1a912efd7fb6b176a81388dc7585a6d2b54195ae93b` | 373×512 |
| c_reward5.webp | 宝5（REWARD5・空腹−50＋100G） | C-5_オベリスク_透過PNG.png | `e28d7af7afcf0d98ae0af6446f60ac7f6d4630340e15f1a27ffece24ca89a334` | 187×512 |
| c_r_special.webp | 宝6（R_SPECIAL・いちばん得意な能力+30） | C-6_螺旋階段の塔_透過PNG.png | `752c12b5d92f6e04a9bd0ecd8171e029e0b792a38abc7f01251e890231ad9759` | 219×512 |
| c_den_closed.webp | 隠れ家（RANDOM_DEN・閉） | C-7a_隠れ家_閉_透過PNG.png | `0fac2b4739e646cc0cecd38d485aa0256db5b0a8fec2ecfefbcc4fd60e692dc9` | 390×512 |
| c_den_open.webp | 隠れ家（RANDOM_DEN・開） | C-7b_隠れ家_開_透過PNG.png | `0654eb94f6faf93d7cf73f547f4402f8ddeaa749a018bbea59f9493b2131a959` | 389×512 |
| c_challenge.webp | 特殊挑戦の門（CHALLENGE） | C-8_神殿正面の門_透過PNG.png | `a30fc34524e90cd8ff563349050076b443f20cdc43b50f82edcbd790b66b0dc6` | 391×512 |
| c_statue.webp | 道中の石像（STATUE） | C-9_ゴーレム像_透過PNG.png | `10604d7658525dc82b865e9ef6c6850605138f3af1a43da1e776d0f4741279d8` | 329×512 |
