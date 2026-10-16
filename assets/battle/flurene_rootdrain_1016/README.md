# フルーネ技09「ルートドレイン」8コマ（2026-10-16・試験実装・QA 試遊だけ・作業ブランチだけ）

- 受け取り：ZIP `Mismon_Claude_Combined_iPhone6_Fulune_20261016` の `02_Fulune_RootDrain/原PNG/root_drain_01〜08.png`（1536×1536 の RGBA・本体2本の蔦腕と全部の効果が1枚の完成コンポジット）
- 作り方：`python3 -I tools/rootdrain1016/derive.py <原PNG のフォルダ>`＝8枚とも同じ範囲 [145, 245, 1400, 1315] を切り出し（足もと・位置がそろったまま）→ 0.42 倍に縮小（乗算済みアルファ）→ WebP（品質90・アルファ100）。色・形は変えない・描き直さない・原本はリポジトリに置かない
- 使う所：`js/battle/rootdrain-1016.js`（MMRD）。QA 試遊（?mmQaTrial=1）のときだけ SK 58 で実戦（js/battle/rules.js）・技アニメのプレビュー（MM25D.preview('flurene', 9)）
- 原本の sha256 は ZIP の QA_metrics.json と一致

| 原本 | 原本の sha256 | 派生 | 派生の sha256 |
|---|---|---|---|
| root_drain_01.png | `a5abf7c56b9f371d48a32112aa35caa0d7b6c871039e3706b00471ea9a62ee45` | rd_01.webp | `98d84605fa10773b6d141f2c65af63d1ff2e1b9dbebd3106e205466c6a55def6` |
| root_drain_02.png | `f81d15d9769c961ce63855e9f779bfb6814ead131056ee023ae6c6cef302ad9d` | rd_02.webp | `d2528f84db6c9b3f772c9f461471321f56b8c07cee281bea0a4927c4783ef83f` |
| root_drain_03.png | `d5a82e8167fd2cb4bd8d1a9b7b86b4dde5ad98bb1ae9e7495aecdb266087ac3e` | rd_03.webp | `71a3587079000c4d5b74346156dceab12d513b29eda5655a9a063a59e57df5fb` |
| root_drain_04.png | `fe9829936e84d48abe9ad5ded66bb2d30c7107c4580b5fc994891e8d52f92e1a` | rd_04.webp | `2a8607949085a6ff00af8059746f58e8b64463c389f6c1a4f126d1ff96bddbfc` |
| root_drain_05.png | `3b9216bea352ad1d4a0aa4b08526360f7df90f667b72524d354171e4af4ea65a` | rd_05.webp | `031a7df505c2047d93a50917ba05215d18d994acff3b836de61d0b9d26580ac7` |
| root_drain_06.png | `022ee5f4cfb2a7d138dea9a1f0b3309b83ce2af60b1b9750c6b4b46657ccf08e` | rd_06.webp | `9c784abcf08cacd35805d086cce5419ce495dbab556a129db393e7bdc8a2ba6f` |
| root_drain_07.png | `e6a599e18867de38779841a0c0815d68a6b1928b465724bd529795bf64fc8030` | rd_07.webp | `f5faec0efa5cdbd0b03edb13d1b0496fafb7c7019baf09db0f5bdb5dbba0c43c` |
| root_drain_08.png | `d7e41f41ffcd0a3ccfe0d3a87a92d72d578ddd8a603f88cd89b8ed366cd6a742` | rd_08.webp | `4098dd4f6b9d54c55ebd20c36da18f23647d3e6458b6614c9102c80acb241c71` |

## 気づいた点（原本のまま）
- 腕は相手まで届かない構図（素材のまま＝体ごと伸ばしたり広げたりしない）。相手への命中の接続は既存の当たりの演出（被弾の揺れ・光）だけ＝専用の着弾 FX が要るかはユーザーの判断
- 01〜04 は市松模様から近似で透過を戻した素材（納品の注記）。白・黒・濃紺で目立つ白縁・ゴミは見当たらない（報告書の画像）が、03 の細い軌跡・04 の衝撃波の画素の完全さは保証されていない
