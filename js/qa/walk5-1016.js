// =========================================================
// 2026-10-16 夜間 QA（C 歩行の向き）：ソラモ 5方向×4コマの試作 `MMQAW`（作業ブランチ claude/qa-bca-1016 だけ・試作の受領＝本番の承認ではない）
//
//  URL に ?qaWalk=soramo5 を付けたときだけ、本編の盤（js/chapter/world-board.js）でソラモの歩行を 8方向（5方向＋左右反転）にする。ほかの種族・通常の URL は従来のまま。
//  素材：assets/qa/soramo_5dir_1016/（ユーザー納品の v5 シートを同じ窓で切り出しただけ＝tools/qa1016/derive_soramo5.py・README.md）。
//    行1 正面（front）・行2 背面（back）・行3 右横（side）・行4 斜め後ろ右（backd）・行5 斜め前右（frontd）。左向きは左右反転。
//  向きの選び方（pick8）：画面の上での進む向き θ（0°＝上＝奥へ・時計回り）を 45° ごとの8つに分け、境目の近く（±10°）では直前の向きを保つ（ちらつかない）。
//  向きを変えるとき（turnPath）：近いほうの回り方で間の向きを1コマずつ通る（例：正面 → 斜め前 → 横 → 斜め後ろ → 背面）。間の向きは turnMs ずつ。
//    歩く位相（何コマ目か）は向きを変えても続ける（足のリズムが切れない）・足もとの位置は全コマ同じ（切り出しの窓が同じ）。クロスフェード・伸縮・回転はしない。
//  ?qaWalkFps＝コマの速さ（既定 8＝4コマで 0.5秒の1周。正式の 8コマ 12fps は 0.67秒）・?qaWalkTurn＝間の向きの時間（ms・既定 70）。
// =========================================================
(function (root) {
  'use strict';
  let P = null; try { P = new URLSearchParams(root.location.search); } catch (e) {}
  const q = P ? P.get('qaWalk') : null;
  const num = (k, d, lo, hi) => { const x = P ? Number(P.get(k)) : NaN; return Number.isFinite(x) && x >= lo && x <= hi ? x : d; };
  const ACTIVE = q === 'soramo5' || q === '5dir';
  const FPS = num('qaWalkFps', 8, 2, 24), TURN_MS = num('qaWalkTurn', 70, 0, 400);
  const BASE = './assets/qa/soramo_5dir_1016/';
  const KEYS = ['front', 'back', 'side', 'backd', 'frontd'];
  // 体の高さ・足の下の余白は従来の 2.5D 歩行（walk_25d/solamo＝h 1.169・foot 0.066）と画面で同じ大きさになる値（切り出しの窓 344 のうち体 約294・足の下 26）
  const H = 1.17, FOOT = 26 / 344;
  // 8つの向き（-3〜4。0＝上＝奥へ）→ 使う絵と左右反転
  const SECT = { 0: ['back', false], 1: ['backd', false], 2: ['side', false], 3: ['frontd', false], 4: ['front', false], '-1': ['backd', true], '-2': ['side', true], '-3': ['frontd', true] };
  const norm = (s) => { s = ((s % 8) + 8) % 8; return s > 4 ? s - 8 : s; };
  function sets() {
    const o = {};
    for (const k of KEYS) o[k] = { frames: [1, 2, 3, 4].map((i) => `${BASE}soramo_${k}_${i}.webp`), fps: FPS, idle: 0, h: H, foot: FOOT, face: k === 'front' || k === 'back' ? 'none' : 'right' };
    return o;
  }
  /** 画面の上での向き（dx 右が正・sy 下が正）→ { sector, set, flip }。prev＝直前の sector（境目の近くでは保つ） */
  function pick8(dx, sy, prev) {
    if (!dx && !sy) return prev == null ? null : look(prev);
    const th = Math.atan2(dx, -sy) * 180 / Math.PI;   // 0＝上・90＝右・±180＝下
    let s = norm(Math.round(th / 45));
    if (prev != null && prev !== s) { let d = th - prev * 45; d = ((d + 540) % 360) - 180; if (Math.abs(d) < 22.5 + 10) s = prev; }
    return look(s);
  }
  const look = (s) => { s = norm(s); return { sector: s, set: SECT[s][0], flip: SECT[s][1] }; };
  /** from → to の間の向き（両端を含まない）。近いほうへ回る（ちょうど反対なら時計回り） */
  function turnPath(from, to) {
    if (from == null || to == null) return [];
    let d = norm(to - from); if (d === -4) d = 4;
    const out = []; for (let i = 1; i < Math.abs(d); i++) out.push(norm(from + Math.sign(d) * i));
    return out;
  }
  root.MMQAW = Object.freeze({ active: ACTIVE, species: 'solamo', FPS, TURN_MS, KEYS, BASE, H, FOOT, sets, pick8, look, turnPath, norm });
})(typeof window !== 'undefined' ? window : globalThis);
