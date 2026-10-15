# ライバルのマスの影（2026-10-15 N08）

Chapter 1 の世界のボードで、ライバルの地点（RIVAL・A／B／C 共通）のマスの奥に立てる「待ち構えている」影。
**新しい絵は描いていない**：正式の立ち絵（リュウ＝assets/npc/ryu/ryu_official_fullbody.webp・相棒レグナス＝assets/monsters/2p5d/regnas.webp）の**輪郭（アルファ）だけ**を使い、
色は濃い紺紫（26,16,52）＋外側に淡い紫の光（市場の入荷待ちの影絵 assets/monsters/2p5d/nobiton_silhouette.webp と同じ考え方＝絵の中身・色は写さない）。
レグナスは輪郭だけ左右を反転してリュウの方を向かせた。

| ファイル | 大きさ | sha256 | 作り方 |
|---|---|---|---|
| rival_silhouette.webp | 373×360 | fe3fb89da5d2355b532c7d82d4d3cfd433a795babf268e00c9ebfdfd1d56df46 | tools/next1015/rival_mark.py（WebP 品質 88・透過） |

- 使っている所：js/chapter/world-board.js の rivalMark（MMRF_WORLD の marker・マスより奥 z −40・揺らさない）。会ったあと（m.raise.field.rivalMet）は外す。
- マスは 1.25 倍（RIVAL_TILE_K）。道・地点・判定・カメラ・固定戦闘のタイミングは変えていない。
