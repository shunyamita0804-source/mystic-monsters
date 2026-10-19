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
  const num = (k, d, lo, hi) => { const x = P && P.get(k) != null ? Number(P.get(k)) : NaN; return Number.isFinite(x) && x >= lo && x <= hi ? x : d; };
  // 2026-10-17：?qaWalk=1017（または new7）＝7体の新歩行（2026-10-17 正式納品・5方向×4コマ＝assets/monsters/walk_1017/・tools/walk1017/derive.py）。
  //  10-16 のソラモ試作（?qaWalk=soramo5）とは別の素材。読み込むのは盤に出ている種族の20コマだけ
  // 2026-10-18 REV3 F0-1：新歩行（7体×20＝140枚）は正式採用＝通常プレイの既定。?qaWalk=old＝従来の 8コマの歩行（QA の比較だけ）・?qaWalk=soramo5＝10-16 のソラモ試作
  const LEGACY = q === 'old' || q === 'legacy';
  const NEW7 = !LEGACY && q !== 'soramo5' && q !== '5dir';
  const ACTIVE = !LEGACY;
  // 2026-10-18 夜間 GO PHASE 2：本編の既定＝ユーザー納品の白背景シート 7枚から切り出した 1018 の素材（assets/monsters/walk_1018/・tools/walk1018/derive.py）。?qaWalk=1017＝前の 10-17 の素材（比較だけ・ファイルは残す）
  const SET = q === '1017' || q === 'new7' ? '1017' : '1018';
  const BASE7 = SET === '1017' ? './assets/monsters/walk_1017/' : './assets/monsters/walk_1018/';
  const SPEC1017 = Object.freeze({"solamo": {"h": 1.258, "foot": 0.104}, "gauru": {"h": 1.32, "foot": 0.104}, "nobiton": {"h": 1.274, "foot": 0.104}, "jiol": {"h": 1.255, "foot": 0.102}, "regnas": {"h": 1.255, "foot": 0.102}, "flurene": {"h": 1.255, "foot": 0.102}, "razuck": {"h": 1.258, "foot": 0.102}});   // tools/walk1017/derive.json
  const SPEC1018 = Object.freeze({"solamo": {"h": 1.358, "foot": 0.045}, "gauru": {"h": 1.312, "foot": 0.046}, "nobiton": {"h": 1.376, "foot": 0.046}, "jiol": {"h": 1.296, "foot": 0.044}, "regnas": {"h": 1.21, "foot": 0.046}, "flurene": {"h": 1.242, "foot": 0.046}, "razuck": {"h": 1.209, "foot": 0.045}, "myurol": {"h": 1.149, "foot": 0.045}});   // tools/walk1018/derive.json（h＝正面2コマ目の体の高さに対するキャンバスの比・foot＝基線の下の余白）。2026-10-19：myurol＝ミュロル（tools/myurol1019/derive_art.py・登録のみ＝本編の盤には出ない・QA の新歩行の確認だけ）
  const SPEC7 = SET === '1017' ? SPEC1017 : SPEC1018;
  const FPS = num('qaWalkFps', 8, 2, 24), TURN_MS = num('qaWalkTurn', 70, 0, 400);
  const BASE = './assets/qa/soramo_5dir_1016/';
  const KEYS = ['front', 'back', 'side', 'backd', 'frontd'];
  // 体の高さ・足の下の余白は従来の 2.5D 歩行（walk_25d/solamo＝h 1.169・foot 0.066）と画面で同じ大きさになる値（切り出しの窓 344 のうち体 約294・足の下 26）
  const H = 1.17, FOOT = 26 / 344;
  // 8つの向き（-3〜4。0＝上＝奥へ）→ 使う絵と左右反転
  const SECT = { 0: ['back', false], 1: ['backd', false], 2: ['side', false], 3: ['frontd', false], 4: ['front', false], '-1': ['backd', true], '-2': ['side', true], '-3': ['frontd', true] };
  const norm = (s) => { s = ((s % 8) + 8) % 8; return s > 4 ? s - 8 : s; };
  function sets(key) {
    const o = {};
    if (NEW7) { const sp = SPEC7[key || 'solamo']; if (!sp) return o; for (const k of KEYS) o[k] = { frames: [1, 2, 3, 4].map((i) => `${BASE7}${key || 'solamo'}/${k}_${i}.webp`), fps: FPS, idle: 1, h: sp.h, foot: sp.foot, face: k === 'front' || k === 'back' ? 'none' : 'right' }; return o; }
    for (const k of KEYS) o[k] = { frames: [1, 2, 3, 4].map((i) => `${BASE}soramo_${k}_${i}.webp`), fps: FPS, idle: 0, h: H, foot: FOOT, face: k === 'front' || k === 'back' ? 'none' : 'right' };
    return o;
  }
  /** この種族を 8方向にするか（新歩行＝7体・ソラモの試作＝ソラモだけ） */
  const has = (key) => ACTIVE && (NEW7 ? !!SPEC7[key] : key === 'solamo');
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
  root.MMQAW = Object.freeze({ rotOf, active: ACTIVE, new7: NEW7, legacy: LEGACY, set: SET, has, SPEC7, BASE7, species: 'solamo', FPS, TURN_MS, KEYS, BASE, H, FOOT, sets, pick8, look, turnPath, norm });
})(typeof window !== 'undefined' ? window : globalThis);
