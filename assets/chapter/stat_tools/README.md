# 能力UPの道具 6種（2026-10-04 追加アセット）

元：ZIP `mystic-monsters_ability-up_tools_6set_2026-10-04_v2.zip`（JPEG 1536×1536・市松模様が焼き込まれたもの）。元ファイルはユーザーが保管（リポジトリには置かない）。
全モンスター共通の素材。画像に数値・モンスターは入っていない（上がった能力名と値は js/chapter/field-view.js の resultFx が HTML で出す）。

| 能力 | キー | 道具 | 元ファイル | sha256（元 JPEG） | ゲーム |
|---|---|---|---|---|---|
| ライフ | li | ハードル | 01_life_hurdle.jpg | `dab2f941766ffcef7b9c58f5fc28d30359b50a7b951fe5c38fbeac5517e1e959` | li_hurdle.webp |
| ちから | po | 訓練用ウェイト | 02_power_weight.jpg | `10890c664f6182eff3de733a1a586ca3167ad5da09752ab0ebb7eafc42c195b5` | po_weight.webp |
| かしこさ | in | 魔導書 | 03_intelligence_magic_book.jpg | `d1f2f44148ef93a5117476164a1a52e4c55306968ffd85b32e99c29cad0ca610` | in_grimoire.webp |
| 命中 | hi | 訓練用ターゲット | 04_accuracy_target.jpg | `f10f4396430d58a81d5dd4ffd13958fbb658aff005338fb7af8f0ce944eff0da` | hi_target.webp |
| 回避 | ev | 回避訓練ボール | 05_evasion_training_balls.jpg | `16c894eefc404d0c3b1854c15c782280d7372ce0baec00b1a2983a73cd3f0659` | ev_balls.webp |
| 丈夫さ | de | 耐久訓練盾 | 06_toughness_training_shield.jpg | `94604bff0ab483b7a9c69ee50e6a9455a4ac92d6d122ae8922dfd39d12cb2787` | de_shield.webp |

- 透過 WebP（長い辺 384px・品質86・アルファ品質100）。絵は描き直していない・色は変えていない（CSS の filter も使わない）。
- 透過化：市松の2色（白 約254／灰 約228〜232）を、両方の色が近くにある無彩色の画素として見分け、画素ごとの背景色（最寄りの市松の色）との差から透明度を出し、背景を差し引いて色を戻した。マスの境目のにじみ（無彩色で2色の間の明るさ）も背景として消した。物の中の小さな明るい所（金属の光）は穴にしない。暗い背景・明るい背景・Chapter の道の上で目視確認。
- 限界：回避のボールの水色の光の帯・魔導書の緑の光は、白い市松と重なる部分が少し薄い。透過 PNG の元データが届けば差し替えるだけ。
- 使い方：能力マスに止まる → モンスターが反応 → **道具（約0.76秒）＋「ちから +6」（実際の能力名・上がった値）** → 既存の成長演出（frame_stat_up・ゲージ・粒子）。値は成長適性（A +7〜E +3）のまま＝上昇量が変わっても文字が合う。差し替えは config.resultFx.tools（無ければ field-view の RFX_DEF）。
