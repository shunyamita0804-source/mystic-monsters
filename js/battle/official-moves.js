// 正式技（2026-10-06）：ソラモ・ガウルの技（SK の 0〜19）を正式技へ入れ替える。
//
// Phase 6（fight()・battle-bridge.js・adapter.js・技ルーレット・.bt 系 CSS・SK／EFF の定義の行）は変えない。
// レグナス（js/battle/rival-partner.js）と同じく、index.html の SK・EFF・SKART・SFR・SKM を起動時に書き換えるだけ（実行時）。
//  ・技の番号（0〜19）＝習得の枠（初期・ちから／かしこさ／命中／回避／丈夫さ特訓）はそのまま＝セーブ（m.sk・m.eq）の番号は変わらない。
//    中身（名前・威力・命中・クリティカル・効果）だけ正式技にする。正式の値は js/phase10/monsters.js の OFFICIAL_MOVES の1か所。
//  ・旧技の絵（ルーレットの小さな絵 SKART・バトルの4コマ SFR・合成音と予備の動き SKM）は、近い動きの旧技の絵へ付け替える（VISUAL）。
//    補助の技（ほしのまもり・ソニックムーブ）は相手へ突進しない＝js/battle/stage.js の補助の演出が担当する。
//  ・威力 → SK[1]＝威力/100（act() が ×100 する）。補助技の命中は表に無い＝100【暫定・要確認】（レグナスの補助技と同じ）。
//  ・このゲームに「ガッツ」は無い（技のデータ・表示に使わない）。
(function () {
  'use strict';
  const G = (name) => { try { return (0, eval)(name); } catch (e) { return undefined; } }; // index.html の上の階層の const（SK・EFF など）
  // 見た目の付け替え：新しい中身の番号 → 絵を借りる旧技の番号（同じ番号なら今のまま）
  //  ソラモ：4 とっしん → スタークラッシュ（突進のまま）・7 ドリルアタック → ほしのまもり（星の絵＝8）
  //  ガウル：10 ひっかき → スパイラルダイブ（旧ドリルアタック＝14 の回転の絵）・14 → 紅翼スラッシュ（旧ウイングアタック＝16）・
  //          16 → フレアレイ（旧ファイアビーム＝18）・17 スカイラッシュ（旧バードアタックのまま）・18 → フェザーストーム（旧ウィンド＝12 の風の絵）
  const VISUAL = { 7: 8, 10: 14, 14: 16, 16: 18, 18: 12 };
  const STAT = { atk: 'atk', de: 'de', hi: 'hi', ev: 'ev' };
  const LV = { small: 1, medium: 2, large: 3 };
  const SUPPORT_ACC = 100;
  // 初期技の並び（2026-10-06 正式の習得ルート）：ソラモ＝たいあたり・ひっかき・しっぽアタック・吠える／ガウル＝つつく・ウィンド・スパイラルダイブ・ソニックムーブ。
  //  番号（習得の枠）はそのまま＝並び（新しく迎えた子の m.sk・m.eq の順）だけ。既存のセーブの並びは変えない
  const INITIAL = { 0: [0, 1, 2, 3], 1: [11, 12, 10, 13] };
  let installed = false, orig = null;

  /** 正式技の tier（演出の長さ）：support（補助）・basic（威力 85 以下）・strong（90〜115）・finisher（120 以上） */
  function tierOf(mv) {
    if (!mv || !(mv.power > 0)) return 'support';
    return mv.power >= 120 ? 'finisher' : mv.power >= 90 ? 'strong' : 'basic';
  }

  function effOf(mv) {
    return (mv.effects || []).filter((e) => STAT[e.stat]).map((e) => ({ tg: e.target === 'self' ? 0 : 1, st: STAT[e.stat], lv: (e.dir === 'down' ? -1 : 1) * (LV[e.size] || 1), t: e.turns }));
  }

  function install() {
    if (installed) return true;
    const M = window.MMP10M, SK = G('SK'), EFF = G('EFF'), SKART = G('SKART'), SFR = G('SFR'), SKM = G('SKM');
    if (!M || !M.movesOf || !Array.isArray(SK) || !EFF || !Array.isArray(SKART)) return false;
    orig = { sk: SK.slice(0, 20).map((a) => a.slice()), art: SKART.slice(0, 20), sfr: SFR ? Object.assign({}, SFR) : null, skm: Array.isArray(SKM) ? SKM.slice(0, 20) : null };
    ['solamo', 'gauru'].forEach((key) => M.movesOf(key).forEach((mv) => {
      const k = mv.slot; if (!Number.isInteger(k) || k < 0 || k > 19) return;
      const v = VISUAL[k] != null ? VISUAL[k] : k, o = orig.sk[v], sup = !(mv.power > 0);
      // 旧 SK の並び：[名前, 威力比率, ルーレットの重み（旧）, 色, 絵文字, 分類, 説明, "p"|"i", 命中率, クリ率]
      SK[k] = [mv.name, sup ? 0 : mv.power / 100, sup ? 2 : mv.power >= 120 ? 1.6 : 2.5, o[3], o[4], sup ? 'd' : 'a', mv.desc || '',
        mv.type === 'power' ? 'p' : 'i', sup ? SUPPORT_ACC : mv.accuracy, sup ? 0 : (mv.critical || 0) / 100];
      const ef = effOf(mv);
      if (ef.length) EFF[k] = ef; else delete EFF[k];
      SKART[k] = orig.art[v];
      if (SFR && orig.sfr && orig.sfr[v]) SFR[k] = orig.sfr[v];
      if (SKM && orig.skm && orig.skm[v]) SKM[k] = orig.skm[v];
    }));
    const SP = G('SP');
    if (Array.isArray(SP)) Object.keys(INITIAL).forEach((sp) => { const a = SP[sp] && SP[sp][6]; if (Array.isArray(a)) a.splice(0, a.length, ...INITIAL[sp]); });
    installed = true;
    return true;
  }

  /** 技の番号 → { mv（正式技）, tier, owner } または null */
  function info(k) {
    const M = window.MMP10M;
    const mv = M && M.moveBySlot ? M.moveBySlot(k) : null;
    return mv ? { mv, tier: tierOf(mv), owner: mv.owner } : null;
  }

  window.MMMOVES = Object.freeze({ install, info, tierOf, VISUAL, INITIAL, get installed() { return installed; }, _orig: () => orig });
})();
