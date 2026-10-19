// =========================================================
// 盤の歩行 `MMQAW`（5方向×4コマ・左は反転＝8方向）。2026-10-16 のソラモ試作から始まり、2026-10-18 夜間 GO で本編の正式（walk_1018・7体）。
//
//  2026-10-19 次便 第2工程：比較の URL（?qaWalk=old／1017／new7／soramo5・?qaWalkFps・?qaWalkTurn）は撤去＝いつも正式の walk_1018。
//   旧い素材（walk_1017・assets/qa/soramo_5dir_1016・旧 8コマ）はコードから読まない（ファイルは記録のため残す）。
//  素材：assets/monsters/walk_1018/<種族>/{front,back,side,backd,frontd}_1〜4.webp（tools/walk1018/derive.py・README.md）。
//  向きの選び方（pick8）：画面の上での進む向き θ（0°＝上＝奥へ・時計回り）を 45° ごとの8つに分け、境目の近く（±10°）では直前の向きを保つ（ちらつかない）。
//  向きを変えるとき（turnPath）：近いほうの回り方で間の向きを1コマずつ通る。歩く位相は向きを変えても続ける・足もとの位置は全コマ同じ。
//  コマの縦横比は絵の実際の比のまま（world-board.js の img.wk の aspect-ratio）＝縦に伸ばさない。
// =========================================================
(function (root) {
  'use strict';
  const ACTIVE = true, NEW7 = true, LEGACY = false, SET = '1018';
  const BASE7 = './assets/monsters/walk_1018/';
  const SPEC1018 = Object.freeze({"solamo": {"h": 1.358, "foot": 0.045}, "gauru": {"h": 1.312, "foot": 0.046}, "nobiton": {"h": 1.376, "foot": 0.046}, "jiol": {"h": 1.296, "foot": 0.044}, "regnas": {"h": 1.21, "foot": 0.046}, "flurene": {"h": 1.242, "foot": 0.046}, "razuck": {"h": 1.209, "foot": 0.045}, "myurol": {"h": 1.149, "foot": 0.045}});   // tools/walk1018/derive.json（h＝正面2コマ目の体の高さに対するキャンバスの比・foot＝基線の下の余白）。2026-10-19：myurol＝ミュロル（tools/myurol1019/derive_art.py・登録のみ＝本編の盤には出ない・QA の新歩行の確認だけ）
  const SPEC7 = SPEC1018;
  const FPS = 8, TURN_MS = 70;
  const KEYS = ['front', 'back', 'side', 'backd', 'frontd'];
  // 8つの向き（-3〜4。0＝上＝奥へ）→ 使う絵と左右反転
  const SECT = { 0: ['back', false], 1: ['backd', false], 2: ['side', false], 3: ['frontd', false], 4: ['front', false], '-1': ['backd', true], '-2': ['side', true], '-3': ['frontd', true] };
  const norm = (s) => { s = ((s % 8) + 8) % 8; return s > 4 ? s - 8 : s; };
  function sets(key) {
    const o = {}, sp = SPEC7[key || 'solamo']; if (!sp) return o;
    for (const k of KEYS) o[k] = { frames: [1, 2, 3, 4].map((i) => `${BASE7}${key || 'solamo'}/${k}_${i}.webp`), fps: FPS, idle: 1, h: sp.h, foot: sp.foot, face: k === 'front' || k === 'back' ? 'none' : 'right' };
    return o;
  }
  /** この種族を 8方向にするか（walk_1018 に絵がある種族） */
  const has = (key) => !!SPEC7[key];
  /** 画面の上での向き（dx 右が正・sy 下が正）→ { sector, set, flip }。prev＝直前の sector（境目の近くでは保つ） */
  function pick8(dx, sy, prev) {
    if (!dx && !sy) return prev == null ? null : look(prev);
    const th = Math.atan2(dx, -sy) * 180 / Math.PI;   // 0＝上・90＝右・±180＝下
    let s = norm(Math.round(th / 45));
    if (prev != null && prev !== s) { let d = th - prev * 45; d = ((d + 540) % 360) - 180; if (Math.abs(d) < 22.5 + 10) s = prev; }
    return look(s);
  }
  const look = (s) => { s = norm(s); return { sector: s, set: SECT[s][0], flip: SECT[s][1] }; };
  /** from → to の間の向き（両端を含まない）。近いほうへ回る。ちょうど反対（180°）のときは rot の向き（1＝時計回り・-1＝反時計回り・既定は時計回り）。
   *  盤では「前回の 180° と逆の回り方」を渡す＝出発で左回りに後ろを向いたら、止まって正面へ向き直るときは右回り＝来た道を戻るように回る（毎回1回転しない） */
  function turnPath(from, to, rot) {
    if (from == null || to == null) return [];
    let d = norm(to - from); if (d === 4 || d === -4) d = rot === -1 ? -4 : 4;
    const out = []; for (let i = 1; i < Math.abs(d); i++) out.push(norm(from + Math.sign(d) * i));
    return out;
  }
  /** その回り方（1＝時計回り・-1＝反時計回り・0＝回らない） */
  const rotOf = (path, from) => (path.length ? Math.sign(norm(path[0] - from)) : 0);
  root.MMQAW = Object.freeze({ rotOf, active: ACTIVE, new7: NEW7, legacy: LEGACY, set: SET, has, SPEC7, BASE7, species: 'solamo', FPS, TURN_MS, KEYS, sets, pick8, look, turnPath, norm });
})(typeof window !== 'undefined' ? window : globalThis);
