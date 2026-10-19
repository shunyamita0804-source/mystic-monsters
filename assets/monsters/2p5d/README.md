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
| flurene.webp | フルーネ（予約番号 5・**登録のみ・未解禁**＝どの画面にも出さない） | flurene_official_2p5d_standing.png（2026-10-15 ZIP「次回Claude便_12項目」の 01_フルーネ正式登録） | ec08627d77135ddfa11c2f03277a95194b06cc51de62a5f73ba30a4362784411 | 705×720 |

- v2_Fixed は、最初の版（ソラモ・ガウル・ジオルの体のすき間に背景の消し残り）を直したもの。直した3体は透明度だけが変わっていて、見えている部分の色は1画素も変わっていない（2026-10-11 確認）。ノビトン・レグナスは最初の版と同じファイル。
- 原本の端に絵が接している所がある（ソラモ＝右端・ガウル＝上・左・右端）。表示用の派生は余白を切り詰めただけなので、そのまま端に接する。
- ジオルの左足の外側に薄い灰色のにじみ（約700画素）が残る（原本のまま。表示の大きさでは目立たない）。

## 使っている所

js/phase10/monsters.js の `SPECIES[].image`（4原種）と `RIVAL_MONSTERS[].image`（レグナス）。index.html の `IMG`（バトルの静止の絵）・`p10Img`／`msv`（市場・牧場・ステータス・研究所・ベースキャンプ・出発準備・特訓・育成完了・セーブスロット・大会結果の肖像・購入の知らせ）・Chapter の盤上の立ち姿と遭遇の演出はここから取る。ライバルの遭遇の相棒は js/chapter/configs/ch1a.js・ch2a.js の `rival_regnas`。

## 2.5D にまだなっていない所（別素材・制作待ち）

バトル待機の立ち絵（assets/battle/idle/・実装済み）・VS の勝負絵（assets/tournament/vs_monsters/）・優勝の絵（assets/tournament/victory/）・対戦表の顔アイコン（assets/tournament/faces/）・Chapter 1 の歩行（assets/monsters/*_walk*/）・バトルの技のコマ（index.html の旧 2D の埋め込み・保護対象）。

旧 2D の正式画像（assets/monsters/solamo.png・gauru.png・nobiton.png・jiol.png・nobiton_silhouette.png、assets/monsters/regnas/regnas_official.webp）はファイルだけ残す（参照しない）。

## フルーネ（2026-10-15 N11・登録のみ）

- 作り方：tools/next1015/derive.py。原本（1254×1254 の RGBA）の**アルファが 1 以上の画素の外接矩形**で余白だけを切る（ほかの4体の「8 以下を余白」より厳しく＝本体・根・葉・花・薄い縁を1画素も切らない。原本の左端に根が接している）→ 長辺 720px へ等倍率で縮小（乗算済みアルファ）→ 透過 WebP（品質 92・exact）。色・形・向きは変えていない。
- 派生の sha256：786bf4312183089396f313ad6120ec33553cff095947c777ab963d3f22fe8661
- アルファ：原本の本体の不透明度は 251〜253（完全な 255 は約0.2%）＝わずかに透ける絵。派生もそのまま（不透明にしていない）。原本の周りに見えないほど薄い画素（アルファ 1）が約2.9万画素ある。
- 使っている所：js/phase10/monsters.js の `PENDING_SPECIES`（`image`）。市場・牧場・図鑑・合体・野生・大会・バトルのどこからも参照していない（未解禁）。

## カルシェル（2026-10-18・登録のみ・未解禁＝QA 試遊だけ）

- 正式納品 Kalshell_DevAssets_Part01〜07（Mismon_Kalshell_OfficialPackage_ForDev_20261018・ユーザー承認済み）。原本（PNG／MP3）はリポジトリに置かない＝表示用の派生だけ。道具＝tools/kalshell1018/derive_art.py（PIL＋numpy・数値は tools/kalshell1018/derive_art.json）
- 余白を切って長辺 720px（720×680）・透過 WebP。色・形は変えていない。参照は js/phase10/monsters.js の `PENDING_SPECIES`（`image`）だけ（市場・図鑑・牧場などには出ない）。

| 原本 | sha256（原本） | 派生 | sha256（派生） |
|---|---|---|---|
| 01_art/01_透過微修正版/Kalshell_Official_2p5D_20261017.png | 8995fb1eb46d7e9fbc4625f580b4e1b63ba46ef66ebb563169f8b733763b48ae | assets/monsters/2p5d/kalshell.webp | ece6d856bc69fd13f16eab411b7f08005b9c984f506dba48346473fe25322af7 |

## ミュロル（2026-10-19・登録のみ・未解禁＝QA 試遊だけ）

- 正式納品「ミュロル 開発本体向け 正式素材仕様一式」PART01〜07（2026-10-19・ユーザー承認済みの仕様マスター＋採用状態一覧）。原本（PNG／MP3）はリポジトリに置かない＝表示用の派生だけ。道具＝tools/myurol1019/derive_art.py（PIL＋numpy・数値は tools/myurol1019/derive_art.json）
- 余白を切って長辺 720px（720×646）・透過 WebP。色・形は変えていない。参照は js/phase10/monsters.js の `PENDING_SPECIES`（`image`）だけ（市場・図鑑・牧場などには出ない）。
- 原本の選び方：PART01 の 01_art（FormalArt_Approved・BattleIdle_Candidate）と 02_reactions の「正式」の2枚は、01_art にだけアルファ 1 の見えない画素（2.5D 22664・待機 21876）がある以外は画素が同じ。採用状態一覧（2026-10-19）の「正式」の名前の 02_reactions の2枚を使った（01_art の sha256：5ef1907390ba2dcabb56bf3f9664f6656d6cd53bf64bc6b7fd7670c5fd7337bd・194088c0b1d87347e99dd3acf3ad4642260f87792949a03e358f63d036f366a8）。各フォルダの README（02_reactions・06_icons・04_skill_cards・03_walk）は「承認待ち」と書いているが、新しい採用状態一覧（2026-10-19）は検収合格＝新しいほうに従った。

| 原本 | sha256（原本） | 派生 | sha256（派生） |
|---|---|---|---|
| 02_reactions/ミュロル_正式2.5D立ち絵.png | cd2d4583e5781f8efebf9bf4529f9c53034a0d972b9b8255af5c6d48b5621b17 | assets/monsters/2p5d/myurol.webp | ee0a3e747fd0eb9364db122490fb1375ed3a5a3a18382b4b0e0d9e016ef7dc7a |
