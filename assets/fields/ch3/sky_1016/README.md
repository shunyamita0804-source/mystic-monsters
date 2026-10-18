# Chapter 3「天空の浮島」先行素材 18点（2026-10-16・QA の受領＝配置先は未決）

ユーザー納品の ZIP `Ch3_Sky_UI_18_Final_20261016_110815.zip`（PNG 18点）の表示用の派生。**原本はリポジトリに置かない**（ユーザーが保管）。
加工は WebP（品質90・アルファ100）への変換だけ。寸法は原本のまま（縮小なし）。外周までの余白が 12px 未満の辺だけ透明の余白を足した（1点：欄干＝上 1px → 12px）。描き直し・色の変更なし。
作り方：`python3 -I tools/ch3sky1016/derive.py <原本のフォルダ> assets/fields/ch3/sky_1016`（検査の結果は derive.json）。

**Chapter 3 のボード（道・マス・A／B／C・START／GOAL・固定マス・レア）は未設計＝この素材はどこにも配置していない。** 確認は `prototype/ch3_sky_1016/index.html`（独立のプレビュー・本編からつながない）。

合計：原本 PNG 9.18MB → 派生 WebP 1.49MB（18点）・欠品 0・余分 0

| ファイル | 寸法 | 区分 | 用途の候補（未決） | 余白 左/上/右/下 | 半透明 | 原本 sha256 | 派生 sha256 |
|---|---|---|---|---|---|---|---|
| C3_ARCH_ruined_colonnade.png | 768×768 | ARCH | 浮島の上の遺跡の目印（行き止まり・宝の候補） | 12.2/2.7/11.8/2.9% | 2.9% | 7a7b1bf1a610c59ecd54a38fba94772606a34c9403c512d3a9983bc957b430ee | 62c9e225f5f700510aa0abe8cc0e5b5eca490cade0e5753ea1c5ce8290eee63c |
| C3_ARCH_sky_pavilion.png | 768×768 | ARCH | 浮島の東屋（目印の候補） | 14.7/2.3/15.0/4.0% | 1.9% | 06e5c4815c874572c00a0a280cf337fc057b8d38c7010b8406a049f79a4fcb6b | 07d88c6e953b2db700cb3398d8b530593c126ed3aa7c0b6736da4f5cdc50329a |
| C3_ARCH_white_bridge_arch_pier.png | 512×768 | ARCH | 空の橋の橋脚（橋の床は無い） | 7.8/8.5/7.4/7.0% | 1.7% | 7404a853ebeec664573ef9e29f0b11c25d36d4c037ba249901e787ffd8802ae3 | 22f9cb9c6d5b5b3d524c427087d126d705eb0732fe03bf257957dc7c8e8c33f8 |
| C3_ARCH_white_column_single.png | 384×768 | ARCH | 一本柱（散らす景物） | 34.6/5.1/34.9/4.9% | 1.1% | a6b8e6ad521c027e5df97d8da1675914132b277cdd5687d35344e3d2aaf93baa | 339d5527820cecf74c08dd11f8a56d018431c2129f8d75b8b9168a9b376a53d6 |
| C3_ARCH_white_railing_segment.png | 1024×256 | ARCH | 欄干の1区間（独立の飾り。反復の帯としては未検証） | 1.9/0.4/2.0/14.8% → 透明の余白 0/11/0/0px | 5.6% | 953a13a2435ace16d7cd8e1fdafa20c4c64da335ee03a95f66fdfb1d50cf9672 | 3c30ee38245f59e8d077aadd40954b083d9316a2799dd1c185bbd4ba60b7d95b |
| C3_ENV_cloud_bank_mid.png | 1024×512 | ENV | 中景の雲の帯 | 4.1/8.0/4.1/6.1% | 11.6% | 246ed46e6c35eb8995dc5d3f4c73f98d2e2bef313c222f15b62c0ae3684cca16 | 9c6704d8effefe1a6a463b0659dc67970ee3eca36b8da7549d4672562cb5e228 |
| C3_ENV_cloud_puff_small.png | 512×512 | ENV | 小さな雲 | 6.1/13.1/5.5/12.3% | 13.6% | 8d7b760be5798a3e0e4d9075314b2bc6d5134d178a9a3c35b09ed9b8eade4cc2 | aef60fe09536e46f274b7046f09eb55b7eb301de453f0ea1adcd36b1b630fff1 |
| C3_ENV_cloud_wisp_front.png | 1024×512 | ENV | 手前の霞（前景） | 2.0/33.6/1.8/36.5% | 11.7% | 84987e929095177580855d22f540ce55be557c141f54ded1f635cfe3ef8ae99e | 81ef098860b1e844fae5f6f531808635ce251a64dd4b817721cbfc2494ea124c |
| C3_ENV_crystal_cluster_blue.png | 512×512 | ENV | 青い結晶（散らす景物） | 22.7/5.7/22.9/5.3% | 1.2% | f8cd0471f665ca092eae0235fd4d8a7031be5c49afdbcf262f5c7712d7d1eb81 | 74c4fecd1ddcbd33d69637e3cdfee92d0152e730f444a529c52c2357ddb8c426 |
| C3_ENV_floating_island_medium.png | 768×768 | ENV | 中くらいの浮島（遠景・目印の土台） | 4.2/7.9/4.7/6.6% | 2.8% | ffc3eb911f2670b0e35d2241a9f0b3a0f2e1c4d0a71e8fd7ca436835b1e4f06d | c46d35473952e84915a0a5d4f27bbb3b8ecd65df063f6f43d0209ac0688b9e4d |
| C3_ENV_floating_island_small_green.png | 512×512 | ENV | 小さな浮島（緑） | 10.2/4.9/10.5/6.8% | 2.2% | 9b7b513db290c793e6e1bbd8b693633e558c70a2582ce7af83e338d25e5a57ef | 526b2379ca97f421be06aac7450d83834bf6cc499bc74967ccf7590f7041f966 |
| C3_ENV_floating_island_small_rock.png | 512×512 | ENV | 小さな浮島（岩） | 23.6/3.9/23.8/4.7% | 1.4% | f4ca06210ab6150aa6dc2f84c37245cea1bde0fb42955f7d82ba5d364554e6ed | 7bdde57794d310c92bb828f3e9c018d727cbf7135a8a6c599e16ac6a7fa9aa1c |
| C3_ENV_island_cliff_edge_piece.png | 1024×512 | ENV | 浮島の崖の縁の1片（独立の飾り。反復の帯としては未検証） | 15.8/3.9/16.0/3.7% | 2.0% | 74f6c63c74efa0b78d0fa29230cfc3180d2ede0ca916d006dc708dbb01ddb197 | 443d8a6cdba2b1cceb795e16d46aadab3b92b2928e49a88b9637b4b115982212 |
| C3_ENV_sky_flowering_tree.png | 512×768 | ENV | 花の木（散らす景物） | 3.1/4.7/3.3/5.1% | 10.3% | b7a19db392f1409265c5ec7ab84a95d607892eb72671a6dbadd589cb2f39208a | 85831fefef399d9ca7165937547daecdc454e6d18f1e8a9c3fc47f3ee1214193 |
| C3_ENV_white_flower_patch.png | 384×384 | ENV | 白い花の茂み（散らす景物） | 5.7/5.2/4.4/5.2% | 8.3% | 52de41167c584f4b6251a09b83eebdf31c1b71afd8f0a3043d9489bd57a8b2d3 | e550c1e79b5666003490f2dd5a88556a853d81165dc970a287e608f93adab49e |
| C3_FX_sky_waterfall_column.png | 512×1024 | FX | 浮島から落ちる滝（静止画。動きは別の設計） | 34.4/2.0/33.6/1.5% | 16.0% | c0ff84e451a8ae8f399f3e25eecd757e76ec2a102ed2733b7704e3f3dd2bf3c1 | 60887864bfb8a4f40753655ccae92ce92520a1e0d335f2fe48a3eafa57601f8f |
| C3_UI_sky_medallion.png | 1024×1024 | UI | Chapter 3 の題字・導入の紋章（Ch2 の chapter2_sea_medallion と同じ役） | 6.7/3.0/7.2/6.1% | 3.0% | 206d8317f5a5deff7a3b4ba085de21c72a2c5212390270881ea40ba1fdfa1b0e | 2e38057745cddc33ca16a6ea9445b74241d237a7fa77da849d911f61dfb37922 |
| C3_UI_sky_nameplate.png | 1536×512 | UI | 題字の下の細い線の飾り（Ch2 の sea_zone_nameplate と同じ役。文字を入れる板ではない） | 3.1/32.8/3.1/40.8% | 1.4% | bb5e5c0a1c113f6980e542e7d38ae1f78fcd3a24fbfcdc6879f3ca64770e4735 | 1cdfc3e45da335b5f30c9d0550037d0f3023833229b72f2e07fd5df3245f9eac |

## 検査の結果

- 18点・名前と寸法は制作指示の18項目と一致・すべて RGBA・外周に画素なし・同じ画像の重複なし（derive.json）。
- 余白 8% 未満の辺がある：欄干（上 0.4%・左右 2%）・霞（左右 2%）・雲の帯（左右 4%）・メダリオン（上 3%）など。外周には触れていないので原本は不合格にしない。縮小の確認は QA ページの「5. 縮小したときの縁」。
- 欄干・崖の縁は独立の飾り。反復（つなげて並べる）の帯としては検証していない＝道・橋の床・曲線・分岐には使えない（下の「不足」）。

