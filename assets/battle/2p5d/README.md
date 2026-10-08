# ソラモ・ガウルの 2.5D バトル素材（比較試遊・2026-10-08。正式採用ではない）

URL に `?battleArt=2p5d` を付けたときだけ使う（js/battle/art25d.js）。通常の URL では使わない＝今までの立ち絵（assets/battle/idle/）・技の演出のまま。

- `soramo/idle.webp`・`gauru/idle.webp`：待機の立ち絵（受け取った JPEG の白〜薄灰の背景を透過・高さ 720・WebP 品質90）。元の向き＝右向き（相手側では左右反転）
- `soramo/NN_C.webp`・`gauru/NN_C.webp`：技 NN（SK の番号）の C 番目のコマ。技シートの緑の背景を色の分離で透過（縁の緑かぶりを戻す）・見出しと説明文の帯を消す・コマの外枠をぼかす・ソラモ 0.62倍／ガウル 0.92倍に縮小・余白を切る（WebP 品質86）
- 切り出しの道具：tools/battle25d/（panels_final.json＝コマの枠・cuts.json＝コマの使い方と使わない理由・key.py／idle.py／build.py／metrics.py）

## コマの使い方（使った数／全体）

木人（訓練用の丸太）・破片・衝撃が本体に重なるコマは、木人を消すと本体の一部も欠けるため使わない（前のコマが続く・当たる瞬間は今までの共通の効果＝光の輪・ノックバック・揺れ）。

| 技の番号 | 技 | 使ったコマ | 使わなかったコマと理由 |
|---|---|---|---|
| 0 | たいあたり | 3/4 | 3：木人と本体・衝撃が重なる |
| 1 | ひっかき | 3/4 | 3：木人と前足・衝撃が重なる（向きも逆） |
| 2 | しっぽアタック | 3/4 | 3：しっぽの先が木人に重なる |
| 3 | 吠える | 4/4 | ― |
| 4 | スタークラッシュ | 5/6 | 5：木の破片が全体に散る |
| 5 | ソラモビーム | 4/4 | ― |
| 6 | すなかけ | 4/4 | ― |
| 7 | ほしのまもり | 4/4 | ― |
| 8 | スターダストレイ | 6/6 | ― |
| 9 | スターフォール | 5/8 | 5：木人と大きな星が本体の下に重なる・6：爆発と木の破片だけ（本体なし）・7：木の破片が本体の周りに散る |
| 10 | スパイラルダイブ | 3/4 | 4：爪と木人・爆発が重なる |
| 11 | つつく | 3/4 | 3：くちばしと木人・衝撃が重なる |
| 12 | ウィンド | 4/4 | ― |
| 13 | ソニックムーブ | 4/4 | ― |
| 14 | 紅翼スラッシュ | 3/4 | 4：斬撃と木人が本体に重なる |
| 15 | ファイアボール | 4/4 | ― |
| 16 | フレアレイ | 4/4 | ― |
| 17 | スカイラッシュ | 3/6 | 3：爪と木人・衝撃が重なる・4：木人が本体の間に入る・5：爪と木人・衝撃が重なる |
| 18 | フェザーストーム | 2/6 | 3：木人が羽の嵐に入る・4：木人と破片が全体に散る・5：木人と破片が全体に散る・6：木人と砂煙が全体に散る |
| 19 | 聖なる炎 | 6/6 | ― |

## 元ファイル（ZIP ミスモン_試遊用_ソラモ_前半／後半・ミスモン_試遊用_ガウル）と sha256

| 元ファイル | sha256 |
|---|---|
| a/soramo/idle_2p5d_reference.jpeg | f27c0aa98e9c3e6c148424c735358c57ab19f9fc387b241a6a048e8b79b95bac |
| c/gauru/idle_2p5d_reference.jpeg | 1d9c40f3c7c0a71108d7cd7e58010300f49b47af5c3f114fb0b4d310c965ad77 |
| a/soramo/skill_sheets/01_taiatari.png | 945cedf0a0130c8fad9819ceac0933c1e357a0fb7e9a47acc095217b543e71b4 |
| a/soramo/skill_sheets/02_hikkaki.png | 260b713b43130f070201b4fdf48561e38a67c0d826322edc95bc90f4ef6bc8b7 |
| a/soramo/skill_sheets/03_shippo_attack.png | 62dee436658845d46c0ea85ba8dcb84ba857c8323a8b2ea39fa51bb4be954bbf |
| a/soramo/skill_sheets/04_hoeru.png | 66da23958d7dc277331fe379c45c0ad5b25f7b87572e854558b6f95b244c075a |
| a/soramo/skill_sheets/05_soramo_beam.png | a6b9b228eb6fe8441cb256d77d436a386300c813b755e0c0695ed4fecc9ef954 |
| b/soramo/skill_sheets/06_hoshi_no_mamori.png | 403147c6aa87db05ea5f40e6868f7abb913d2586c6562eb4f56ddd9709c0b6c4 |
| b/soramo/skill_sheets/07_sunakake.png | 822ef555121c4e27db8d33335bb8062424d19b9c2ba83f056846730d777c3ca3 |
| b/soramo/skill_sheets/08_star_crush.png | a24912ad44ef8d40ea7761382d855ece5880efe26c75aba8f851dc85572d477a |
| b/soramo/skill_sheets/09_stardust_ray.png | 6b15027a08c5b3db81e106811b4991ab4add1a265f4ecdaa1289b94a14dd41e0 |
| b/soramo/skill_sheets/10_starfall.png | 8e3b6bfba644fef5022df86804c2f30b11bf262aa06f182271cd3c0dc76709d0 |
| c/gauru/skill_sheets/01_つつく.png | baf45d35f0c36191654201ee9cc0ec09f8b78cce653cd142074ee98d9575d1c2 |
| c/gauru/skill_sheets/02_スパイラルダイブ.png | 49703144348720234dcfe63c4236f5465f7c069fd1dd6b387af26fb16f3fa55b |
| c/gauru/skill_sheets/03_ソニックムーブ.png | 7afb321f4ec8ec303c0a855c199ca273f8ebc407458aef22371ecbf2a3333030 |
| c/gauru/skill_sheets/04_紅翼スラッシュ.png | 7011c202bbcdc6c368dd1eba81a873fd0f614be126a175b77281173fc1ddd063 |
| c/gauru/skill_sheets/05_ファイアボール.png | bac5b809f18311350dd08c985a5bc3109de316283b4e551863676be686adf633 |
| c/gauru/skill_sheets/06_フレアレイ.png | 07a6fde9ec5b92c15b3530318c536f3ae69a810a302db390efca9cdb08080951 |
| c/gauru/skill_sheets/07_ウィンド.png | 6fdf7a80466257e511aafd78f4428d5e8c8810f8fcf7a8446687721e95f16260 |
| c/gauru/skill_sheets/08_スカイラッシュ.png | fa5f6ba07bda7fa4c86f08695e4434e619b66e1cdb3a9dbe0cdbac94e49abc47 |
| c/gauru/skill_sheets/09_フェザーストーム.png | 9818fdd531ca48ab1347268bb769d6a54162b6f2a221368c8f97e09b1f511b6d |
| c/gauru/skill_sheets/10_聖なる炎.png | 99755e34e4548777fc0be2620907c13cccd7feab0f2fbb02ba312eb715373ee8 |
