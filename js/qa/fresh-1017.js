// =========================================================
// 2026-10-17 初見プレイの確認 `MMQAF`（URL に ?qaFresh=1 のときだけ・QA 用）
//  ゲームのセーブ（localStorage の mr4…＝mr4v6・旧 mr4・スロット mr4s1〜3・mr4ng・mr4a）を、このページの間だけ別の名前（qaF: を前に付けた鍵）へ読み替える
//  ＝本当のセーブ（mr4v6）を読まない・書かない・消さない。別の名前の中では普段どおりに保存されるので、再読み込み（アプリの再起動）で続きから確かめられる。
//  ?qaFresh=reset で別の名前の中だけを消して最初から。セーブの version・鍵の名前・形式は変えない（読み替えるのはこのページの Storage の呼び出しだけ）。
//  通常の URL では何もしない。index.html の最初のスクリプト（セーブを読む前）
// =========================================================
(function (root) {
  'use strict';
  let q = null; try { q = new URLSearchParams(root.location.search).get('qaFresh'); } catch (e) {}
  const ON = q === '1' || q === 'reset';
  const PFX = 'qaF:', HIT = (k) => typeof k === 'string' && /^mr4/.test(k);
  if (ON && root.Storage && root.localStorage) {
    const P = root.Storage.prototype, g = P.getItem, s = P.setItem, r = P.removeItem;
    if (q === 'reset') { try { const ks = []; for (let i = 0; i < root.localStorage.length; i++) { const k = root.localStorage.key(i); if (k && k.indexOf(PFX) === 0) ks.push(k); } ks.forEach((k) => r.call(root.localStorage, k)); } catch (e) {} }
    P.getItem = function (k) { return g.call(this, this === root.localStorage && HIT(k) ? PFX + k : k); };
    P.setItem = function (k, v) { return s.call(this, this === root.localStorage && HIT(k) ? PFX + k : k, v); };
    P.removeItem = function (k) { return r.call(this, this === root.localStorage && HIT(k) ? PFX + k : k); };
  }
  root.MMQAF = Object.freeze({ on: ON, prefix: PFX });
})(typeof window !== 'undefined' ? window : globalThis);
