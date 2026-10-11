# 2.5D 正式モンスター画像（表示用・2026-10-11）

モンスター5体の正式イラストを 2.5D 版へ切り替えた（ChatGPT からの正式決定・ユーザー提供の ZIP `MysticMonsters_2.5D_5Monsters_TransparentPNG_v2_Fixed.zip`）。
**原本（1254×1254 RGBA の透過 PNG）はリポジトリに置かない**（ユーザーが保管。CLAUDE.md §6「元画像はユーザーが別に保管する」）。原本は編集・上書きしていない。

ここにあるのは表示専用の派生画像：原本の透明な余白だけを切り詰め（アルファ 8 以下を余白とみなす）、長辺 720px へ等倍率で縮小した透過 WebP（品質 92）。色・形・ポーズは変えていない。

| ファイル | 種族（番号） | 原本 | 原本の sha256 | 大きさ |
|---|---|---|---|---|
| solamo.webp | ソラモ（0） | 01_soramo_2.5D.png | 74c159104acc1ac1be54c83c3be25105efbab161a82e5a11a76101fe9d43cd62 | 720×688 |
| gauru.webp | ガウル（1） | 02_gauru_2.5D.png | 4218e977288779b97edf5e6b08c6952c9bb6568f2c92fc8fa34ccbf2923cc0d1 | 720×663 |
| nobiton.webp | ノビトン（2） | 03_nobiton_2.5D.png | bb00f0e6ce979d02287747ab4dd246c25b2cf8bc837e77ffec074a51354500fb | 720×657 |
| jiol.webp | ジオル（3） | 04_giol_2.5D.png | 3b02fb21b8bd154f8dda1f30bb671a54f4f993df95bc2591e90134674f5ad21c | 720×667 |
| regnas.webp | レグナス（4・リュウの相棒） | 05_regnas_2.5D.png | a169fd3410e8fcc8bc3e76cc092d22fa1598ec031b07a8ec256262c5df646e35 | 720×699 |
| nobiton_silhouette.webp | ノビトン（市場の入荷待ち） | nobiton.webp の輪郭（アルファ）だけ・色は従来の影絵と同じ (24,18,16) | — | 720×657 |

- v2_Fixed は、最初の版（ソラモ・ガウル・ジオルの体のすき間に背景の消し残り）を直したもの。直した3体は透明度だけが変わっていて、見えている部分の色は1画素も変わっていない（2026-10-11 確認）。ノビトン・レグナスは最初の版と同じファイル。
- 原本の端に絵が接している所がある（ソラモ＝右端・ガウル＝上・左・右端）。表示用の派生は余白を切り詰めただけなので、そのまま端に接する。
- ジオルの左足の外側に薄い灰色のにじみ（約700画素）が残る（原本のまま。表示の大きさでは目立たない）。

## 使っている所

js/phase10/monsters.js の `SPECIES[].image`（4原種）と `RIVAL_MONSTERS[].image`（レグナス）。index.html の `IMG`（バトルの静止の絵）・`p10Img`／`msv`（市場・牧場・ステータス・研究所・ベースキャンプ・出発準備・特訓・育成完了・セーブスロット・大会結果の肖像・購入の知らせ）・Chapter の盤上の立ち姿と遭遇の演出はここから取る。ライバルの遭遇の相棒は js/chapter/configs/ch1a.js・ch2a.js の `rival_regnas`。

## 2.5D にまだなっていない所（別素材・制作待ち）

バトル待機の立ち絵（assets/battle/idle/・実装済み）・VS の勝負絵（assets/tournament/vs_monsters/）・優勝の絵（assets/tournament/victory/）・対戦表の顔アイコン（assets/tournament/faces/）・Chapter 1 の歩行（assets/monsters/*_walk*/）・バトルの技のコマ（index.html の旧 2D の埋め込み・保護対象）。

旧 2D の正式画像（assets/monsters/solamo.png・gauru.png・nobiton.png・jiol.png・nobiton_silhouette.png、assets/monsters/regnas/regnas_official.webp）はファイルだけ残す（参照しない）。
