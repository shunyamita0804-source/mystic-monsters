# 大会の対戦表の顔アイコン・2.5D の横顔（2026-10-11）

ZIP 大会対戦表用_2.5D横顔アイコン5体（512×512 の透過 PNG）の表示用の派生。加工は縮小（256×256）と WebP（品質90・アルファ100）への変換だけ（tools/walk25d/derive.py）。
日本語名の5枚（ソラモ.png など）はローマ字の5枚と同じ絵（sha256 が同じ）＝登録しない。georu.png＝ジオル（ゲームのキーは jiol）。

- 使う所：大会1 の対戦表（index.html の tbIcon → js/battle/arena.js の MMARENA.faceSrc）。円の中に contain・0.9倍（横顔の角が円で切れない）。
- 読み込めないときは従来の丸い顔（assets/tournament/faces/。2026-10-07）へ（img の onerror）。従来のファイルは残す。
- 種族の番号（0 ソラモ・1 ガウル・2 ノビトン・3 ジオル・4 レグナス）だけに当てる。ほかの参加者は従来の表示。

| 元ファイル | 派生 | sha256（元） |
|---|---|---|
| soramo.png | assets/tournament/faces_25d/face_soramo.webp | 557d3c29641594c331d15f4cbbb89d3fc572963bd45c431b586b02e477f7dbcf |
| gauru.png | assets/tournament/faces_25d/face_gauru.webp | 8e28a6e7c9054f96d1b6b1ae949737041cf12454dabf9bcd462103119454149f |
| nobiton.png | assets/tournament/faces_25d/face_nobiton.webp | 0045386a2ea0563105089c74990fc7e1411410770d6348e6b2ed543b12743f25 |
| georu.png | assets/tournament/faces_25d/face_jiol.webp | ab0a7f86f336c062ca0d5d59e004b67f5d45cb4b37a5a7ba85da15403e0d572f |
| regnas.png | assets/tournament/faces_25d/face_regnas.webp | 0ab0bbd62c00e067434eb76d8f4fb7cc9d0f4cc357e5faa2fe3c27176f467f92 |
