// =========================================================
// 本編の Chapter 2「潮風の海岸」＝1枚の世界のボード（A／B／C）の進行 `MMWD2`（2026-10-16・試遊ブランチ。main 統合・公開はユーザーの iPhone 確認と最終承認のあと）
//
//  道：js/proto/ch2-routes.js（MMRF_CH2＝A 298・B 284・C 304 地点。tools/ch2/build_ch2_routes.py が作る・この便では変えない）。進み方は Chapter 1 と同じ MMRF_CORE
//    （サイコロ 1〜6・40ターン・自由な分かれ道は選ぶ・運命の分かれ道は奇数＝左／偶数＝右・特殊挑戦は 5／6・寄り道は行き止まり＝帰りもサイコロ）。
//  本体は js/chapter/world-driver.js の make（Chapter 1 と同じ処理）。Chapter 2 で違うのは道のデータ・道と場所の名前（道のデータの names／places／rewardTitles＝仮案）・
//    固定報酬の中身（道のデータの rewards＝【仮】）・出来事の表（js/chapter/configs/ch2a.js の eventPool＝既存の Chapter 2 の出来事）・確認用の URL（?ch2route=A|B|C）。
//  ルート：新しい Chapter 2 の出発で A／B／C を各 1/3 で抽選して m.raise.field.route に保存（再開・読み込みでは決め直さない）。
//  旧 Chapter 2 のセーブ（案1・2026-10-15 ユーザー了承）：その個体の m.raise.field が旧 Chapter 2 の盤（chapterId 2 で world が無い）なら、
//    その育成の終わりまで従来のエンジン（js/chapter/engine.js＋configs/ch2a.js＋field-view）のまま＝handles(2, m) が false（raising.js の driverFor が個体ごとに選ぶ）。
//    出発の時点で盤が無い個体だけ新しい盤。新しいセーブ項目は足さない（v6・mr4v6 のまま）。
//  時間切れ（40ターン）：従来どおり（大会なしで Chapter 終了＝onTimeUp の救済は未決・実装しない）。
//  自動テスト：window.MM_QA_OLD_CH2 のときは登録しない（旧 Chapter 2 を前提にした実ブラウザテスト用。tests/e2e/harness.mjs の既定。open({ worldCh2:true }) で新しい盤）
// =========================================================
(function (root) {
  'use strict';
  if (!root.MMWD_MAKE) return;
  const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  const routeKey = (v) => (v === 'B' || v === 'C' ? v : 'A');
  /** その個体が旧 Chapter 2 の盤（従来のエンジンの配置）を持っているか */
  const oldField = (m) => !!(m && isObj(m.raise) && isObj(m.raise.field) && m.raise.field.chapterId === 2 && m.raise.field.world !== 1);
  //  2026-10-18 v2：旧い盤でも1ターンも使っていない（出発した直後・止まっている途中の状態も大会も無い）個体は、失う進み具合が無い＝新しい盤の START から（ルートはここで抽選）。
  //  1ターンでも使っていれば、その育成の終わりまで旧い盤のまま（巻き戻さない・消さない）
  const unstarted = (m) => { const r = m.raise; return (r.turnsUsed || 0) === 0 && !r.pend && !r.tour && !r.goal && !r.battle; };
  const oldBoard = (m) => oldField(m) && !unstarted(m);
  // 2026-10-18 v2（iPhone 本編試遊・ユーザー指示「QA と通常本編は同一の正式ボード」）：通常のプレイの Chapter 2 も新しい盤（A／B／C）。
  //  旧：2026-10-17 は QA の URL（?ch2trial・?qaCh2）か window.MM_CH2_NEW のときだけ＝本編の Chapter 2 は旧い1本道のまま入っていた。
  //  旧 Chapter 2 の盤の途中のセーブ（oldBoard）だけは、その育成の終わりまで従来のエンジン（巻き戻し・消去をしない＝案1）。qaOn は QA の表示の確認用に残す
  const qaOn = () => { if (root.MM_CH2_NEW) return true; try { return /[?&](ch2trial|qaCh2)=/.test(root.location ? root.location.search : ''); } catch (e) { return false; } };
  const dataOf = (k) => (root.MMRF_CH2 && root.MMRF_CH2[routeKey(k)]) || null;
  const pool = () => { try { const c = root.MMCH && root.MMCH.getConfig(2); if (c && Array.isArray(c.eventPool)) return c.eventPool; } catch (e) {} return null; };
  // フィナの一言：チュートリアル（このセーブで1回＝Chapter 1 で見ていれば出ない）だけを Chapter 1 と共通に使う。Chapter 1 の景色の一言（ch1_*・w_*）は出さない（Chapter 2 の一言は未承認＝作らない）
  const story = () => (root.MMWD && root.MMWD.STORY ? root.MMWD.STORY.filter((e) => e.scope === 'save') : []);
  const L = (expression, text) => ({ expression, text });
  const linesBy = () => { const out = {}; for (const k of ['A', 'B', 'C']) { const d = dataOf(k), pl = (d && d.places && d.places.CHALLENGE) || '封印の門';
    out[k] = { tut_challenge_w: [L('guide', `この先には${pl}があるよ。サイコロで5か6が出れば、近道へ進めるんだ。`), L('normal', '失敗しても、遠回りの道で先へ進めるから安心してね。')] }; } return out; };
  const W = root.MMWD_MAKE({
    ch: 2, dataOf, pool, story: story(), storyLinesBy: linesBy(), forceVar: 'MM_CH2ROUTE', forceParam: 'ch2route', qaOld: 'MM_QA_OLD_CH2',
    ensureRoute: (f) => (isObj(f) && f.chapterId === 2 && f.world !== 1 ? (['A', 'B', 'C'].includes(root.MM_CH2ROUTE) ? root.MM_CH2ROUTE : ['A', 'B', 'C'][Math.min(2, Math.floor(Math.random() * 3))]) : routeKey(f && f.route)),   // 旧い盤から移る個体（unstarted）はここで抽選   // 配置が壊れていたら同じルートの最初から（ルートが分からなければ A）
    handles: (key, m) => key === 2 && !root.MM_QA_OLD_CH2 && !oldBoard(m),
    routeName: (seg, k, d) => (d && d.names && d.names[seg]) || (/^D_/.test(seg) ? '寄り道' : 'このまま進む'),
    placeOf: (id, k, d) => (d && d.places && d.places[id]) || (root.MMWD && root.MMWD.PLACE && root.MMWD.PLACE[id]) || null,
    rewardTitle: (id, k, def, d) => (d && d.rewardTitles && d.rewardTitles[id]) || def,
  });
  root.MMWD2 = Object.freeze(Object.assign({}, W, { oldBoard, qaOn }));
})(typeof window !== 'undefined' ? window : globalThis);
