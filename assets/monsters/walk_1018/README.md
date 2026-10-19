# ボード用の歩行 7体×5方向×4コマ＝140コマ（2026-10-18 夜間 GO・ユーザー納品の白背景 JPEG シート 7枚から。本編の既定）

- 原本＝ユーザー指示 ZIP（Mismon_Claude_夜間一括GO_…_20261018）の JPEG 7枚（4列×5行の一覧シート・白背景・alpha なし）。原本はリポジトリに置かない
- 派生＝tools/walk1018/derive.py：白い背景（外周からつながる近白の画素）だけを透明に（体の内側の白い胸毛・羽・装甲・花は残す）・縁は白との混ざりから alpha を決めて白を差し引く・原寸のまま（縮小・引き伸ばしなし）・種族ごとに同じ正方形のキャンバスに足もとの基線をそろえて置く（横はセルの中心に対する位置を保つ）
- 行＝front・back・side（右横）・backd（右斜め後ろ）・frontd（右斜め前）。左向きは盤で左右反転（js/qa/walk5-1016.js）。旧 walk_1017（2026-10-17 納品の 512px コマ）はファイルだけ残す（?qaWalk=1017 で比較）
- h＝正面2コマ目（足をそろえた姿）の体の高さに対するキャンバスの比・foot＝基線の下の余白の割合（tools/walk1018/derive.json → SPEC7）。コマごとの切り出し位置・孤立画素の除去数は tools/walk1018/frames.json

| 種族 | 原本 | 原本 sha256 | シート | キャンバス | h | foot |
|---|---|---|---|---|---|---|
| solamo（ソラモ） | 6690B006-792F-4DE9-AEB8-9C21ACC88167.jpeg | 572e77f02cd0f963e10f4986ce36431617d645fd5e3cde80d42f5621c31ae2ba | 1374×1145 | 288×288 | 1.358 | 0.045 |
| gauru（ガウル） | 45370AA8-FA61-49B3-A687-A3EDB8759DEA.jpeg | 13258350ad3f8e56e3f93b547f0bf5d277ba7425aa5008f83e40bc21bb97e058 | 1121×1403 | 328×328 | 1.312 | 0.046 |
| nobiton（ノビトン） | C17B97F5-A4DB-45F8-ABFF-B06C1240CCCD.jpeg | ffdf9602f95ea04fc4eb3efb1b38fafb71442c7705e201eaca416232e82842cf | 1122×1402 | 304×304 | 1.376 | 0.046 |
| jiol（ジオル） | 4A22D3A1-68AA-4A09-A66E-4DFD56737DFB.jpeg | 4b072b062709f0bc390ecc1822112968144bfa9950f446b3b5288d6f19df386e | 1121×1403 | 320×320 | 1.296 | 0.044 |
| regnas（レグナス） | A7C47D98-11B7-4EBD-8CEA-2841F8FFCEAB.jpeg | 55179ff00b7b548996d7f95e45366f4a9bde64585debcc697482c81e8967ed12 | 1121×1403 | 328×328 | 1.21 | 0.046 |
| flurene（フルーネ） | 61292816-367B-492B-9F0A-502F9E557AB7.jpeg | 90a6f5bf9151ed50a742faaa97b7955fe0b40330b536ef1b58929f2e44f03397 | 1122×1402 | 328×328 | 1.242 | 0.046 |
| razuck（ラズック） | D2947742-BEE2-468D-8479-5C2F42E67848.jpeg | 1d82cee783e70e342b22a51673c1ca6b31a6caa44784366a789932b7c6560dbb | 1121×1403 | 312×312 | 1.209 | 0.045 |

| 種族 | 派生 | sha256 | 体の幅×高さ | かたまり | 捨てた画素 |
|---|---|---|---|---|---|
| solamo | assets/monsters/walk_1018/solamo/front_1.webp | 4cc15d3f9368d9bd1d5169742dd220e97aeed9111fddc8ae7834d7efe8cf44e9 | 219×211 | 1 | 1 |
| solamo | assets/monsters/walk_1018/solamo/front_2.webp | 4a0d21bb430253d96b6a26973f3986dc72d7411c824802342108aa475d76be12 | 219×212 | 1 | 0 |
| solamo | assets/monsters/walk_1018/solamo/front_3.webp | 11e6dab6b6c0ffac31fcb0fdec1f596e7e8dc04cf46f0cc234f69da35f8edfcb | 221×212 | 1 | 0 |
| solamo | assets/monsters/walk_1018/solamo/front_4.webp | 52dd3b70a7275e8d1b982f1e181e979aa7f87f3354535bd917d47d16267da132 | 222×209 | 1 | 0 |
| solamo | assets/monsters/walk_1018/solamo/back_1.webp | 52f3dda068f6df24050f3aa811adbb8ac100bbfba01a91147a39bb8fb79ddaf3 | 220×206 | 1 | 0 |
| solamo | assets/monsters/walk_1018/solamo/back_2.webp | 95578377d96958a76ff4842ba20a956b6426d082fdfc739dc3cb3c5f77f47252 | 219×213 | 1 | 0 |
| solamo | assets/monsters/walk_1018/solamo/back_3.webp | 6f141b52a241de5645b882965a81aab4a4caf96d1326832fc6126662e7c2e08f | 221×215 | 1 | 0 |
| solamo | assets/monsters/walk_1018/solamo/back_4.webp | 9558acd8b8989884666212317879f87e6938a3246917bac3f3288d03725171ef | 222×211 | 1 | 0 |
| solamo | assets/monsters/walk_1018/solamo/side_1.webp | 12370661b2317383688df52122662a8f3dca8f383ec2265c80cf64aeb161e72c | 236×203 | 1 | 0 |
| solamo | assets/monsters/walk_1018/solamo/side_2.webp | 88881f739a6e948fdc8fe1fd4c56b00fb20b71880f3646a6fb09d5f9546842f1 | 243×205 | 1 | 0 |
| solamo | assets/monsters/walk_1018/solamo/side_3.webp | e580df30a435bab309003454460ddf62e33a224b899af1513d08099cfb5074d8 | 238×202 | 1 | 0 |
| solamo | assets/monsters/walk_1018/solamo/side_4.webp | fd0d7a758701056e3353eeb9dab35ac6165bc22859cdb48f16774352d81ffa3c | 240×203 | 1 | 0 |
| solamo | assets/monsters/walk_1018/solamo/backd_1.webp | faf66c68a263b34caf1bc64528f778194e7ea1b46489fd57741b79ac73359cfa | 231×207 | 1 | 0 |
| solamo | assets/monsters/walk_1018/solamo/backd_2.webp | e86bc3a84ab10f6edb9b68703e20a27e0efda59e7c4a45bc9438e78d64237ab9 | 243×204 | 1 | 0 |
| solamo | assets/monsters/walk_1018/solamo/backd_3.webp | 23a86da8062e380b66b3a56cab5a7ce130575854bea008c27226dc8f0ac2e530 | 251×205 | 1 | 0 |
| solamo | assets/monsters/walk_1018/solamo/backd_4.webp | a81c66b3f026c750d2736f3df7083865d97d835ec2a5ecb4eba7070498f363c5 | 247×201 | 1 | 0 |
| solamo | assets/monsters/walk_1018/solamo/frontd_1.webp | 6c881581e6091d471572e29ac9fe17af95cdc20fc9a4a0eb4696aad4c613e47b | 251×216 | 1 | 0 |
| solamo | assets/monsters/walk_1018/solamo/frontd_2.webp | 5e243130d765ad69353472302a66cd6a3dd83936a93ae553cedde6f5b812e5bb | 263×215 | 1 | 0 |
| solamo | assets/monsters/walk_1018/solamo/frontd_3.webp | b5e9d6c01f2b9cc41ed9d208f1e736231f7cc239d31b643047421ead130b690e | 271×214 | 1 | 0 |
| solamo | assets/monsters/walk_1018/solamo/frontd_4.webp | 94f2b564946df72dd742ba969989c502909bbd56a23319643f31959f1ed64b7e | 266×215 | 1 | 0 |
| gauru | assets/monsters/walk_1018/gauru/front_1.webp | 9983cf3aaf15755ffe14f12906a4f016e6e9a7b5d72045037f9a2c8ea0c334b0 | 268×250 | 1 | 6 |
| gauru | assets/monsters/walk_1018/gauru/front_2.webp | 3a066890a7c44b0932c00edee57f6e483b8d0248f5850d544fa767373ad8b73b | 260×250 | 1 | 0 |
| gauru | assets/monsters/walk_1018/gauru/front_3.webp | 08a6ac76807b53b0395eef2efbf9f8263d742d32cff20ea5ecf8e4edf8b9c0d4 | 266×252 | 1 | 0 |
| gauru | assets/monsters/walk_1018/gauru/front_4.webp | e9178c8e40a555a20a74ac5b452e0b10627f42838975c88eeff5eb82ba9259c4 | 265×248 | 1 | 0 |
| gauru | assets/monsters/walk_1018/gauru/back_1.webp | 8a19421b10213d654c2e7f981fc93309c0628791111ff9dfeb099e1745275ada | 265×255 | 1 | 0 |
| gauru | assets/monsters/walk_1018/gauru/back_2.webp | 9eeebba75e653ffcb9a9e2e6bc67470e75ce537eeb08db39b3af0343cf97604b | 268×252 | 1 | 0 |
| gauru | assets/monsters/walk_1018/gauru/back_3.webp | 1b01f16156b7ee413a859f97879b8839a8b8cec0f627298ea854984ac857d94e | 265×253 | 1 | 0 |
| gauru | assets/monsters/walk_1018/gauru/back_4.webp | 684258ca3a52a586e30796347e45e9cd3318015d3e93703afb9f3fcdaffa3843 | 262×254 | 1 | 0 |
| gauru | assets/monsters/walk_1018/gauru/side_1.webp | be203ff5751cdbc3965463e83aa7db7d90d242f02ddfa260e449a41568000f22 | 262×228 | 1 | 0 |
| gauru | assets/monsters/walk_1018/gauru/side_2.webp | ad748b2b29450b78f2ee931643226d405070b82e01f10ddb9256094efc30dd40 | 245×231 | 1 | 0 |
| gauru | assets/monsters/walk_1018/gauru/side_3.webp | 653f0dd0a89825c3275065dc175cc0f520bb1bb2eb00ff9615b862fb360cf38e | 264×229 | 1 | 0 |
| gauru | assets/monsters/walk_1018/gauru/side_4.webp | 85da13a3c65ef9bacfc4293c6f3abf425e039a3d40562556f9da14e1a8a06460 | 252×231 | 1 | 0 |
| gauru | assets/monsters/walk_1018/gauru/backd_1.webp | 4045b69f6a3e3df144a4d63e02fe96476cbc88796c8e3d37afb4a7c7885238c3 | 252×253 | 1 | 0 |
| gauru | assets/monsters/walk_1018/gauru/backd_2.webp | e2835f551ec506f7fe69a5dbb970cc499aa6559ffcef26999f2e6463486044bc | 257×256 | 1 | 0 |
| gauru | assets/monsters/walk_1018/gauru/backd_3.webp | 2f74563492fa137d6f6b3ac50f1a6bea430d3dd7cdb796469825294a0555dd27 | 252×262 | 1 | 0 |
| gauru | assets/monsters/walk_1018/gauru/backd_4.webp | 842102695f35c78a5504b8a1af32fb02711252112d461e5489a4825c7880e0dd | 245×252 | 1 | 0 |
| gauru | assets/monsters/walk_1018/gauru/frontd_1.webp | 8ffcc90c985ed302847caeceaca73f67ae0dc544a58166ac7e8d21eadd1d1d1b | 258×303 | 1 | 0 |
| gauru | assets/monsters/walk_1018/gauru/frontd_2.webp | 9e5ff64fe1dfbaed1bf3a5bd90fb4d00f7587edf183344fd99acf1b1476c7926 | 261×292 | 1 | 0 |
| gauru | assets/monsters/walk_1018/gauru/frontd_3.webp | 10908f1e9e38c62490cb3e0c116379a36825a59cd4be21228b62c4182c37a0cd | 259×303 | 1 | 0 |
| gauru | assets/monsters/walk_1018/gauru/frontd_4.webp | 902824e160fb0651f56e5cb4ca1c5cc86982f92cb5527c56e606359c9ac3458b | 255×306 | 1 | 0 |
| nobiton | assets/monsters/walk_1018/nobiton/front_1.webp | 289ec2867c728ced0d658a994e26098b1930364ba79a359cdbc531f0f03c5b5a | 202×223 | 1 | 2 |
| nobiton | assets/monsters/walk_1018/nobiton/front_2.webp | 31d14a9093da8a44b094e4ec2f76c32e356503dc84397b7bdaef430a5778e170 | 198×221 | 1 | 0 |
| nobiton | assets/monsters/walk_1018/nobiton/front_3.webp | c722133414f313fb206423cebb30830e371f561391d7bbe5d0137144adb49603 | 200×231 | 1 | 0 |
| nobiton | assets/monsters/walk_1018/nobiton/front_4.webp | 9a509d9f122c4a7311a103e2914d9a6db2a1cab744990480ab2efbd9dda75a6e | 201×221 | 1 | 0 |
| nobiton | assets/monsters/walk_1018/nobiton/back_1.webp | 015595af60e9f5b9325927458b5c1a98f92a506e79867e146df801ccdaa0b62d | 207×246 | 1 | 0 |
| nobiton | assets/monsters/walk_1018/nobiton/back_2.webp | 0441e184de196bdcd0fa88880968cb2220d8df657ec0058981d17aa893a86259 | 206×233 | 1 | 0 |
| nobiton | assets/monsters/walk_1018/nobiton/back_3.webp | eb2a505146b7df60d375ab4245f1bbcf6c0ad8cf784e14ab97c43e97429813d5 | 209×234 | 1 | 0 |
| nobiton | assets/monsters/walk_1018/nobiton/back_4.webp | e81763a25ba47a5a60ae25ff84e7d5b901fc47f9c4697b51990c3ebb38e656e1 | 210×229 | 1 | 0 |
| nobiton | assets/monsters/walk_1018/nobiton/side_1.webp | a1ddf1307c374e025c4f5053e483df51036f9a91c4799fddf5550aee53f2200c | 280×219 | 1 | 0 |
| nobiton | assets/monsters/walk_1018/nobiton/side_2.webp | c30f1794f9d339b48a4320e4096522386df15b1ea70a4bcc4ed968daea3cdef5 | 257×219 | 1 | 0 |
| nobiton | assets/monsters/walk_1018/nobiton/side_3.webp | 0433a550b594c1a3cf9b1e662a3f1c6741b89b2ebe22aee398dfb429f3b2875f | 267×218 | 1 | 0 |
| nobiton | assets/monsters/walk_1018/nobiton/side_4.webp | 7d6441dd632693960d1b1197b03fe80513daa284de9ef9082a5a3ef8192b4057 | 250×216 | 1 | 0 |
| nobiton | assets/monsters/walk_1018/nobiton/backd_1.webp | b53c2a22490e74d7400c64ee1518cf010b4e334ca945c50dc849ba66ac93da55 | 259×252 | 1 | 0 |
| nobiton | assets/monsters/walk_1018/nobiton/backd_2.webp | bbc145030892a987b7125885b65af54b96dc5325ea926d2a276c8783cef7ec76 | 243×232 | 1 | 0 |
| nobiton | assets/monsters/walk_1018/nobiton/backd_3.webp | b8bd1f836e2755963b0852f1d85c495fdc61053c71b7495cb62ee7aa64950a1b | 262×247 | 1 | 0 |
| nobiton | assets/monsters/walk_1018/nobiton/backd_4.webp | 039e101947bd70131354bb90feecbaed6cdcc67409bc133573e3322e2987e8e8 | 244×244 | 1 | 0 |
| nobiton | assets/monsters/walk_1018/nobiton/frontd_1.webp | 32d070aa4892d0d5b0d33e778c03e35e43e992e8ed1d536c42bdf1c92587932a | 258×235 | 1 | 0 |
| nobiton | assets/monsters/walk_1018/nobiton/frontd_2.webp | c86a6d57c75114fda8f73e1f175f2aec088e8acf8289454b24816e8acb7e4a56 | 259×231 | 1 | 0 |
| nobiton | assets/monsters/walk_1018/nobiton/frontd_3.webp | 5253b56c2f85893adf3a695b9f243744686d332d9d5db2033e967c85c217efb8 | 264×237 | 1 | 0 |
| nobiton | assets/monsters/walk_1018/nobiton/frontd_4.webp | adec889f9c1d1d13368fb986822621d08580663f09c8573fef3cf09b02c736a9 | 257×235 | 1 | 0 |
| jiol | assets/monsters/walk_1018/jiol/front_1.webp | b3c2afd3800ac48cd74004c3c2a03238ed47143c618d0eef42ab2985919a8b2f | 222×252 | 1 | 3 |
| jiol | assets/monsters/walk_1018/jiol/front_2.webp | d57ee4df6c72ea0229431c82e077233a78eb5f68a71329fd3caa07c216944c8c | 228×247 | 1 | 0 |
| jiol | assets/monsters/walk_1018/jiol/front_3.webp | 362a388ac1cd5e4926229659b495ffbbdb2a721595835d4b772a4afcc8bf6902 | 231×256 | 1 | 0 |
| jiol | assets/monsters/walk_1018/jiol/front_4.webp | b490cb5baa56a0a6a90807dc9673069c422ec1f13053afe56171dfee14ddef38 | 228×252 | 1 | 0 |
| jiol | assets/monsters/walk_1018/jiol/back_1.webp | 6868ae7b026d90a3c5a146b43b688ffa571787b432ed16b90f8b1e95e5f4ee26 | 231×245 | 1 | 0 |
| jiol | assets/monsters/walk_1018/jiol/back_2.webp | cf676b5070a0297377eec1f024900abf7f8722c7a34dd0a39994209d331a0284 | 227×250 | 1 | 0 |
| jiol | assets/monsters/walk_1018/jiol/back_3.webp | c7a610870c13ebebd71fa51e86934d29b481f048416a33035c278e89d19655cb | 232×255 | 1 | 0 |
| jiol | assets/monsters/walk_1018/jiol/back_4.webp | 0592b62346b9b0a5d0da6a1557e76fe81853637774cacc198392589981dfbea7 | 231×252 | 1 | 0 |
| jiol | assets/monsters/walk_1018/jiol/side_1.webp | 6cdfb41b58ea5d85832208d7381236a146a1c8c67384913a41f0432a930df902 | 227×248 | 1 | 0 |
| jiol | assets/monsters/walk_1018/jiol/side_2.webp | 282d442aaa19572260e4f020d1b900e4c96dbb40804dc82bf823ebcd6982178f | 192×253 | 1 | 0 |
| jiol | assets/monsters/walk_1018/jiol/side_3.webp | a6dfd1886e47a2c8ad8338065e503bea08be0899fc8150831751eb80c7e08d12 | 232×253 | 1 | 0 |
| jiol | assets/monsters/walk_1018/jiol/side_4.webp | 611ad389715286aa04d61e2567187255b2e255c6c1dd2faf55af74a6d1f49742 | 197×251 | 1 | 0 |
| jiol | assets/monsters/walk_1018/jiol/backd_1.webp | 0bee7a48113747d6c85522bbda1d55518cd3ea7eded619103eb2df91b31b9c12 | 229×264 | 1 | 0 |
| jiol | assets/monsters/walk_1018/jiol/backd_2.webp | 4bb777a9e3bd69f7e470418f435f8c56ad769767feeb0e0bb61574f7ec781c71 | 227×258 | 1 | 0 |
| jiol | assets/monsters/walk_1018/jiol/backd_3.webp | 0b4a03ecd6c60d66222cde9c3cde7f9b01a44e79dfb1df4b222ef021d2de4d73 | 232×260 | 1 | 0 |
| jiol | assets/monsters/walk_1018/jiol/backd_4.webp | 34f73054db81d1e75721b0a0f4bb97296e67aca7683020d443ea5eb0b0f4e4d8 | 225×258 | 1 | 0 |
| jiol | assets/monsters/walk_1018/jiol/frontd_1.webp | fc426fceaa750dc688ad0595d9394ab13ec20aa53965bf9760494f30be0c2505 | 243×290 | 1 | 0 |
| jiol | assets/monsters/walk_1018/jiol/frontd_2.webp | 191aeded124ca53dc0f86d27db53ee099451504a40f0fdf08a0b0b417a2d6444 | 237×297 | 1 | 0 |
| jiol | assets/monsters/walk_1018/jiol/frontd_3.webp | b61b1e237d45cd58d21f5e53bbacc0db3082ff9d91fb5aac1741cf0b3da55d71 | 227×291 | 1 | 0 |
| jiol | assets/monsters/walk_1018/jiol/frontd_4.webp | 7cef99116459c07b5e40377b4b35ecf2eb09e7b94d908f25dc54836b93aafa54 | 235×290 | 1 | 0 |
| regnas | assets/monsters/walk_1018/regnas/front_1.webp | 3756ea7799fc28c071ffef09dfb633915fe45e73af14ee8c38fa38c4cf156af0 | 206×270 | 1 | 2 |
| regnas | assets/monsters/walk_1018/regnas/front_2.webp | c6aeb5112b23db3a6418e268994bc5757d5fe50a5fdf901483f201cf91766e64 | 202×271 | 1 | 0 |
| regnas | assets/monsters/walk_1018/regnas/front_3.webp | de85aeed3ce344ea3c78b5ab8c0a50a30f1c0b3f5411450ddd8dbc5ee5b3287b | 211×273 | 1 | 0 |
| regnas | assets/monsters/walk_1018/regnas/front_4.webp | 9a5416f56a6436a0139197a66ffc8ae5426db2f3adf71a83bc22adb52b853ed5 | 187×271 | 1 | 0 |
| regnas | assets/monsters/walk_1018/regnas/back_1.webp | 233c0369c2f99c898229ec3c0faf04f2ad9d71f0d6f9e4405acc132f875f8a4d | 198×297 | 1 | 0 |
| regnas | assets/monsters/walk_1018/regnas/back_2.webp | a0ca7ae60a28c555574937ac4b18ff94ec8cc088b3906e57b3321128acca2eba | 203×298 | 1 | 0 |
| regnas | assets/monsters/walk_1018/regnas/back_3.webp | 40a898ca08b147f4eae210ce38371fc6281a9f9ba2322865afa8fd7aca098e65 | 208×305 | 1 | 0 |
| regnas | assets/monsters/walk_1018/regnas/back_4.webp | 5e8d583c252c3efc6ff87450ce834b9e79f9cdb9a7c26119f5c55b475ce59bac | 203×290 | 1 | 0 |
| regnas | assets/monsters/walk_1018/regnas/side_1.webp | 819e0c07206ca2ddf94e1c7b6b29dc3f41ea6ee0d9c9812d677ab7e01b591ddd | 294×222 | 1 | 0 |
| regnas | assets/monsters/walk_1018/regnas/side_2.webp | 1ec976e80e3ee22b665aa9e41eead10dcbc21019c5b42fc385520b794ca99d13 | 281×223 | 1 | 0 |
| regnas | assets/monsters/walk_1018/regnas/side_3.webp | 3bde40e4248f1b3ef40a04fd1b26dbcbb2404d34d9ae125e5d19a4965746a8a4 | 285×222 | 1 | 0 |
| regnas | assets/monsters/walk_1018/regnas/side_4.webp | ee8d49669cde314a9433e72f9e06ed7fe9071e334412de8075a046b0d8e46d1f | 260×220 | 1 | 0 |
| regnas | assets/monsters/walk_1018/regnas/backd_1.webp | 910d5defa646225af58c56f1907852e49a4aed2ddd11de0faaf651d3bb3ee53c | 244×266 | 1 | 0 |
| regnas | assets/monsters/walk_1018/regnas/backd_2.webp | cdce344f0a8a43f104607ad9b1637246a318adf5e0266b075a7bdbefe5bc76af | 238×260 | 1 | 0 |
| regnas | assets/monsters/walk_1018/regnas/backd_3.webp | 321f4299815b2a4181efbd374f750d14b06707c21f271dfde48ae64b48fffd25 | 246×269 | 1 | 0 |
| regnas | assets/monsters/walk_1018/regnas/backd_4.webp | ac82cb0a47cdf2f4b056d616b838ff72390730749bb5ae9b89a991ef89dcfeff | 233×264 | 1 | 0 |
| regnas | assets/monsters/walk_1018/regnas/frontd_1.webp | 3e45c840b83dd69f1f802a66432031a7cf7164aca21db8f5147b2eacc258b8fd | 252×270 | 1 | 0 |
| regnas | assets/monsters/walk_1018/regnas/frontd_2.webp | e734732a31dbc048317465409d9c0062e5019ff6de95516efa346ec1bde32382 | 246×262 | 1 | 0 |
| regnas | assets/monsters/walk_1018/regnas/frontd_3.webp | 1f082b1ea9c932e831ff60efb092bf0c584f528e5e8661ee64544b77408dfaa1 | 246×265 | 1 | 0 |
| regnas | assets/monsters/walk_1018/regnas/frontd_4.webp | 7db79203360fb34aeafb523bffebca0103f216e4b5d41fe7c77a247495a9a3f6 | 248×267 | 1 | 0 |
| flurene | assets/monsters/walk_1018/flurene/front_1.webp | 8f961189c367273cb0c714ee2c18889d2e58695a3698d120aee6110162aded28 | 260×263 | 1 | 1 |
| flurene | assets/monsters/walk_1018/flurene/front_2.webp | ff6918a82d27cfbb9ae6883096775acf74470aa47580fe9ae1722d9597a83998 | 243×264 | 1 | 0 |
| flurene | assets/monsters/walk_1018/flurene/front_3.webp | f8857ab817305834858c3a99927c589698874e4e3572e32a9f6d7683563cb83f | 252×264 | 1 | 0 |
| flurene | assets/monsters/walk_1018/flurene/front_4.webp | 81d1574333f3d65d1b2f3a451e73ef85d480743676a8a7e0c770c03d20f653e3 | 249×256 | 1 | 0 |
| flurene | assets/monsters/walk_1018/flurene/back_1.webp | 36872f2285eec6bacc3990f1b4040cf0f55e2b0776e61c988c2103ed712b73e1 | 264×251 | 1 | 0 |
| flurene | assets/monsters/walk_1018/flurene/back_2.webp | 159c2b633366b5e082f4627f242b8aaecfc9850b1589ea9f662516c8e072fff1 | 248×247 | 1 | 0 |
| flurene | assets/monsters/walk_1018/flurene/back_3.webp | 47521f176ca3e76e0cce72e0b6a1686c1364c36da4e257b8556c6a68153e6b9e | 259×255 | 1 | 0 |
| flurene | assets/monsters/walk_1018/flurene/back_4.webp | 744f82a22f59a824cfba5c9e2cc55011c807f02b9437d1aceb876bcf343c1777 | 250×246 | 1 | 0 |
| flurene | assets/monsters/walk_1018/flurene/side_1.webp | 6941681821bcc9ad85f8f59a50259a5470730c6544e6aa1fd3aeb90a674c7a21 | 273×260 | 1 | 0 |
| flurene | assets/monsters/walk_1018/flurene/side_2.webp | 11dcc6ccb1154eb0db75e530f5a54e79e8344a97d747356505bc9ea1791c6502 | 237×259 | 1 | 0 |
| flurene | assets/monsters/walk_1018/flurene/side_3.webp | 3f83ddb46f46f181c75887b050cf24790749e0207908c484ad305aa347f09261 | 264×261 | 1 | 0 |
| flurene | assets/monsters/walk_1018/flurene/side_4.webp | 0b62b9c96cc80912b45ba7c045728d4743585a18f5914591971c8df03220113e | 236×260 | 1 | 0 |
| flurene | assets/monsters/walk_1018/flurene/backd_1.webp | 42e3b301c48d9afe1cb1cfdf6e7ee9bccd1d1f3d73a9ee256dfc135540bdda6f | 248×261 | 1 | 0 |
| flurene | assets/monsters/walk_1018/flurene/backd_2.webp | 30c8c28845e6a929dc6b94061328b5a7c1ce8d1f10708d499ffc9719f5c8975e | 237×261 | 1 | 0 |
| flurene | assets/monsters/walk_1018/flurene/backd_3.webp | 74c498d38ac21d42fde47e4d1a270ac4f5a9dbda28cd2b53182057924c7d36fd | 239×258 | 1 | 0 |
| flurene | assets/monsters/walk_1018/flurene/backd_4.webp | 58cff2265e78f33a98b1d28fe0be8bd5aa3e7477b07f7c65f11ed87ff2972fee | 234×260 | 1 | 0 |
| flurene | assets/monsters/walk_1018/flurene/frontd_1.webp | 00fd949e2d4f6ffb5f32c8e4da1b9f63c1231a1ca6f8de4773b165504b063b53 | 273×291 | 1 | 0 |
| flurene | assets/monsters/walk_1018/flurene/frontd_2.webp | 1cb106a9d96be5a8852eba2a550fedf5780f4dcb7e32f8fe29edaeae04f135b0 | 259×297 | 1 | 0 |
| flurene | assets/monsters/walk_1018/flurene/frontd_3.webp | 0de721e714d50f22c4ce3432328b0d1db53386ee3d800c150a0304f585e25e6b | 262×301 | 1 | 0 |
| flurene | assets/monsters/walk_1018/flurene/frontd_4.webp | e453f8413e9ac4300ba67784dc379a30238a077a2a0ea962d2a402b07326b29b | 244×289 | 1 | 0 |
| razuck | assets/monsters/walk_1018/razuck/front_1.webp | f5a9865bb3578ee90cff571a9d1af6d88d16208e33c547a488d657ac4200430e | 227×256 | 1 | 1 |
| razuck | assets/monsters/walk_1018/razuck/front_2.webp | a369c887f7f7767c617870fefa76e04914a3103c5369d1cc0a6f8830ff82590f | 164×258 | 1 | 0 |
| razuck | assets/monsters/walk_1018/razuck/front_3.webp | e352006b3e97075cafbca0471085284e15d557d96085874bcba6b007388ef40f | 221×258 | 1 | 0 |
| razuck | assets/monsters/walk_1018/razuck/front_4.webp | cc73af7f4ca7a421da84fd44162cf984460414058be11c05ee078fe5d3ed6772 | 166×259 | 1 | 0 |
| razuck | assets/monsters/walk_1018/razuck/back_1.webp | 88b071b0b4e864803d2e7853469d15e907f36bf70851ac84d3314be8a82c56b1 | 225×259 | 1 | 0 |
| razuck | assets/monsters/walk_1018/razuck/back_2.webp | be79f615399c3c43f4a2d6f6999ac507bc3a7b47e72ac69a285148688de99d72 | 198×258 | 1 | 0 |
| razuck | assets/monsters/walk_1018/razuck/back_3.webp | 27a8189136063b7187817c412f6e47d8bd2ca39a0d2ec02c93b628087ad3a389 | 218×258 | 1 | 0 |
| razuck | assets/monsters/walk_1018/razuck/back_4.webp | 5f57c67a84aea3c37c6217c7e8a7e9eab934f4af92c938e41a3b72f5d9664a97 | 214×258 | 1 | 0 |
| razuck | assets/monsters/walk_1018/razuck/side_1.webp | 6e97586aa21a85060d9a2cb6b27e7eb061a0d708ec07e45388a481507a5c75ca | 253×249 | 1 | 0 |
| razuck | assets/monsters/walk_1018/razuck/side_2.webp | b9a2255768a7e919283888fae44adfb96fec88616ad822d539a35576cbd8ab71 | 232×255 | 1 | 0 |
| razuck | assets/monsters/walk_1018/razuck/side_3.webp | 738d9c04f6e1108e87c9713a232cbdf8aa3ab5c3614e64c69f2f8c4952bdb2fa | 238×252 | 1 | 0 |
| razuck | assets/monsters/walk_1018/razuck/side_4.webp | a07310d0b38ac19fbbd64dd6e35a08a4713b382c61b2508de563e6fc108c6d7a | 222×257 | 1 | 0 |
| razuck | assets/monsters/walk_1018/razuck/backd_1.webp | cf60db7d701a43e364581f7b26ad4ce8abbfdd3cce9bb6852e89e553676d1b75 | 242×263 | 1 | 0 |
| razuck | assets/monsters/walk_1018/razuck/backd_2.webp | 4a9ef784e4b0e56ec6f21de05b736626770e0c69032d2ca0e57ffe452428ea76 | 223×266 | 1 | 0 |
| razuck | assets/monsters/walk_1018/razuck/backd_3.webp | cf76b2feed9616377558dee9bf7ef4688b7486274ec83fe90f468facb1fad8a9 | 233×264 | 1 | 0 |
| razuck | assets/monsters/walk_1018/razuck/backd_4.webp | 528f1d1fcef8c2bfe957eaa01ff27296331751e14360990ced202fce253bc5c1 | 243×264 | 1 | 0 |
| razuck | assets/monsters/walk_1018/razuck/frontd_1.webp | c3f064f7260ff7a9245010d595ef8b141b0460d8e98d5d846ba8a43cefa16c4f | 254×281 | 1 | 0 |
| razuck | assets/monsters/walk_1018/razuck/frontd_2.webp | ca4a7aad0de08f34e9e5cb1889c76bbf3e8f52377e5b01d120b341c5811ee760 | 233×285 | 1 | 0 |
| razuck | assets/monsters/walk_1018/razuck/frontd_3.webp | 1fb3f438be088c6bb34f638be8194d467946d2e27e3b16ffbde06be1fff3aa3a | 245×284 | 1 | 0 |
| razuck | assets/monsters/walk_1018/razuck/frontd_4.webp | a6ba647358c62d20fb647c698fbceff7f975db44a4073c3c1306a66abf1f4204 | 243×287 | 1 | 0 |

## ミュロル（2026-10-19・登録のみ・未解禁＝QA 試遊だけ）

- 正式納品「ミュロル 開発本体向け 正式素材仕様一式」PART01〜07（2026-10-19・ユーザー承認済みの仕様マスター＋採用状態一覧）。原本（PNG／MP3）はリポジトリに置かない＝表示用の派生だけ。道具＝tools/myurol1019/derive_art.py（PIL＋numpy・数値は tools/myurol1019/derive_art.json）
- 原本＝PART03 の 03_walk/00〜19.png（512×512 RGBA の透過 PNG 20枚。ほかの7体の白背景 JPEG シートとは違う＝背景の切り抜きはしない）。00〜03 正面・04〜07 背面・08〜11 右横・12〜15 右斜め後ろ・16〜19 右斜め前（左は盤で反転）。一覧シート・プレビュー（JPG・GIF）は取り込まない。
- ほかの7体と同じ置き方：原寸のまま（縮小・引き伸ばしなし）・同じ正方形のキャンバス 440×440・足もとを基線（下 4.5%）にそろえる・横はコマの中心に対する位置を保つ（cell-center）。h 1.149・foot 0.045（tools/walk1018/derive.json → js/qa/walk5-1016.js の SPEC1018）。本編の盤は番号 → キー（keyOf(8)＝null）で引けない＝出ない。QA の「新歩行（8方向）」で確認。
- tools/walk1018/derive.py をやり直すと derive.json・frames.json・この README が7体だけで書き直される＝そのあと tools/myurol1019/derive_art.py をもう一度実行する。

| 原本 | sha256（原本） | 派生 | sha256（派生） | 体の幅×高さ |
|---|---|---|---|---|
| 03_walk/00.png | 29e7974c87250885d62418e69d7eea7d2ca9cdc7a34b2f3867dce3f615bf76f5 | assets/monsters/walk_1018/myurol/front_1.webp | ee44d862676a4f5f80895e25762f13a093e06720e39c4f6abf3bfc67123e6ccc | 408×383 |
| 03_walk/01.png | aef6b51bbd462f1f0289d0d7ac393a81b4685787f8644c8470945eaaabe01a87 | assets/monsters/walk_1018/myurol/front_2.webp | 119644971981780286cea486243e85baa239928d9b5729d0a7f3a1dde4a7d776 | 378×383 |
| 03_walk/02.png | eb23d1359f184f8b74310ed80899d5f607edd2cd4a1de980343ac280d956a8ca | assets/monsters/walk_1018/myurol/front_3.webp | 19f936d355bfc207cb3bc4e8a2938f50f2c46a7b1ab8531f5d4010b0562e3e89 | 396×377 |
| 03_walk/03.png | 217003640acf4436e602ce801f74e40f0f0b83314c3d7a6f27f0bc4f41021585 | assets/monsters/walk_1018/myurol/front_4.webp | 3b9db321da509cbc72e812099aa04970b08ec8e94ffaec6e95c5a192e922d652 | 382×381 |
| 03_walk/04.png | abcf9ef58c3b181cb54dddabaa08eac4731d97293d790ba9891a79747018cbcc | assets/monsters/walk_1018/myurol/back_1.webp | 218e4524bef743d8fbbdbed2cd1b1011f1d7e2de43b8af64928389d824c61c8f | 408×335 |
| 03_walk/05.png | 845c0e20d87627f0e67414954559c1c1cd07c2644ff658f8884b870c9978cb8f | assets/monsters/walk_1018/myurol/back_2.webp | 9c783ac5e3cbd428b8d5b0e3949fdc3786c0a8b77143380bc6d762214096a3a1 | 320×321 |
| 03_walk/06.png | 8f32d38365b24726f4882510b21786bfb9f95578cb383e5b90e7ae1e96f1c766 | assets/monsters/walk_1018/myurol/back_3.webp | 1dbbcc257a6e0e869e30e883ad61896413c725123ce7f4204271db2257c5905e | 401×334 |
| 03_walk/07.png | 2cd6a013f35bf253c6af6196433c409d35c6b689f10d9707a1702f893f9f77a0 | assets/monsters/walk_1018/myurol/back_4.webp | 248eb5b9f982e2b8c12a6af19e3ece7651a164de5e8b18f9e5c2c1794a3ef20a | 346×330 |
| 03_walk/08.png | d70889d16ad6f7ca6f295a135278553bb2378f17bf44a868a0049ac0e66d737e | assets/monsters/walk_1018/myurol/side_1.webp | 2662d4ede6b3b26c7b971a9696cbb622d4100cc918ad2f0a9d458b1d6f4a035e | 404×303 |
| 03_walk/09.png | 9e2120d72c833ef0e1cd36099cd01b57805af3ac7de3a5ca4ca5891acda3a7d7 | assets/monsters/walk_1018/myurol/side_2.webp | d353fdca375d42b0c13bb31bc8e12dcc8f15cbcacff119e0633a2f6f1a3f4bf9 | 393×309 |
| 03_walk/10.png | 81059b788eee2b03c511c7e6b6ea138de7d502d077fd760a878960215b585a4f | assets/monsters/walk_1018/myurol/side_3.webp | 4a995410c023dad6b458f57d79be64a4ce1c993eb483486f6c7b1c5889f5cb8b | 408×296 |
| 03_walk/11.png | 0979c7a6fcf4a341ef383ad4e21949d86912cfb694f48ca7927c9a3e14830625 | assets/monsters/walk_1018/myurol/side_4.webp | 0a19e457b8aaf99edfe7ff4a3853002f2a831004a4daa268b0721ce48fbe74e3 | 394×311 |
| 03_walk/12.png | 9cb99e061f81bbf38565993e0b44ccbad71ca67b3e770bcc946a2cc63e954a7b | assets/monsters/walk_1018/myurol/backd_1.webp | b1dee9a05511a73cf8314868d2fb8a3694a48c171cccc8bf6edab03547b2ad91 | 395×343 |
| 03_walk/13.png | 69f5fa517bd9123eef5c04b3466940a4e42818bbef404e18485a1da832e37fe3 | assets/monsters/walk_1018/myurol/backd_2.webp | 72c96e7ec4c1799ef6fa6c23f2c62d194f2acb8d481fab668d5eb3cb42446c8e | 395×343 |
| 03_walk/14.png | c530f51382812acbe24f24ed5ec7c20e7d7afad3a730dc81218912dfef9ac574 | assets/monsters/walk_1018/myurol/backd_3.webp | 5c1066bebf9fbeb505368b984416da77f46f7a2ab487b14810a98a8abf449773 | 408×337 |
| 03_walk/15.png | cdac0194c3237d1d11507462e86a145d6abfcddb85b13961f67a9246bb5683a2 | assets/monsters/walk_1018/myurol/backd_4.webp | c86bff99e34117d8939e3c15ab90892a8f0fddf165f211ed62ed1598dee215b5 | 403×339 |
| 03_walk/16.png | 7a02bf269c1778d66943cece6fa504377133a95b4a1a208f375654a772791351 | assets/monsters/walk_1018/myurol/frontd_1.webp | 979f02fa2c5c19eaaa067b0e7a0b1a6ef5a71cf3a0633b1f5e2ab40f29031d58 | 403×345 |
| 03_walk/17.png | cd12b13401bcf876c8842cc9b691a99dde2af6fe41920fce8c09087480707de7 | assets/monsters/walk_1018/myurol/frontd_2.webp | 442b30f96c8276a1a8c6e6df2f2b259f7e84b602fb60fb95a9ffda48dbdde187 | 389×348 |
| 03_walk/18.png | 9dd26e3e74124f56c1d86a4697f6a9ebe9e00793c870fbe1ff9cf5ebd9591fa6 | assets/monsters/walk_1018/myurol/frontd_3.webp | 9d2b40f3e3292001285f6bdc428c02b8c30b872c511096c8128c495fc3dfd7b3 | 408×333 |
| 03_walk/19.png | f271ad1e7fe7bf0240fdd89f9ad435cc1e7e8efee4ea0b468f2f3975bf2453bd | assets/monsters/walk_1018/myurol/frontd_4.webp | a309373b69498a13c18b8852b255610b0e53f249af3a91c9dce93fed9c015338 | 390×350 |
