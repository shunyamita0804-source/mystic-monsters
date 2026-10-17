// =========================================================
// Chapter 2「潮風の海岸」A／B／C の試遊の入口 `MMCH2T`（2026-10-16・試遊ブランチだけ。main 統合・公開はユーザーの iPhone 確認と最終承認のあと）
//
//  URL に ?ch2trial=A|B|C を付けたときだけ動く（通常の URL では何もしない）：起動のあと、今のセーブ（S）を丸ごと控えて、
//    連れている子の写し（いなければソラモ）で Chapter 2 のベースキャンプから本物の出発 → 1枚の世界のボード（本編の MMWD2・MMWB）。
//  保存しない：既存の TEST 大会と同じ仕組み（TEST_TOUR がある間 save() は何もしない）。試遊のあいだの再読み込み・大会の終わり・メニューの「試遊をやめて街へ戻る」で
//    控えたセーブへ戻る（通常の進行・所持金・記録・セーブ v6／mr4v6 は変わらない）。
//  画面の右下（操作欄の上）に小さな札：ルートの切り替え（A／B／C＝その URL で読み込み直す）と版（MM_BUILD・元のコミット）＝古いキャッシュとの取り違えを防ぐ。
//  index.html の TEST_MODE が false（正式リリース）なら何もしない。
// =========================================================
(function (root) {
  'use strict';
  const SRC = 'ef677b0';   // この版の元になったコミット（画面の版表示用。コミットのたびに更新）
  let q = null; try { q = new URLSearchParams(root.location.search).get('ch2trial'); } catch (e) {}
  const ROUTE = ['A', 'B', 'C'].includes(q) ? q : null;
  const G = (n) => { try { return (0, eval)(n); } catch (e) { return undefined; } };   // index.html の let／const（S・TEST_TOUR・TEST_MODE・MM_BUILD）
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function start(route) {
    route = ['A', 'B', 'C'].includes(route) ? route : 'A';
    if (G('TEST_MODE') === false || G('TEST_TOUR') || !root.MMP8 || !root.MMWD2 || !root.MMWD2.isAttached()) return false;
    const S0 = G('S'); if (!S0) return false;
    const snap = JSON.stringify(S0);
    (0, eval)('TEST_TOUR = { snap: ' + JSON.stringify(snap) + ', ch2: ' + JSON.stringify(route) + ' }');
    try {
      const S = G('S');
      if (S.playerNamePending) { S.playerNamePending = false; if (!S.playerName) S.playerName = 'テスト'; }   // ページの中だけ（保存しない＝終われば控えたセーブへ戻る）
      let qm = null; try { const v = new URLSearchParams(root.location.search).get('qaMon'); qm = /^[0-4]$/.test(v || '') ? +v : null; } catch (e) {}   // 2026-10-17：?qaMon（QA トップ）
      const mk = G('mk'), base = qm != null ? Object.assign(mk(qm), { name: 'テスト' }) : S.m ? JSON.parse(JSON.stringify(S.m)) : Object.assign(mk(0), { name: 'テスト' });
      delete base.raise; root.MMP7.ensureProg(base); S.m = base; if (!(Array.isArray(S.inv.bag) && S.inv.bag.length)) { const SP = G('SUPPORT'); if (SP && SP.item) root.MMP7.bagAdd(S, SP.item, 10); }   // 持ち物が無ければ新人支援と同じジャガイモ×10（ページの中だけ）
      const c = root.MMP8.canDepart(S, base); if (!c.ok) throw new Error(c.reason || 'canDepart');
      Object.assign(base.raise, { state: 'farm', ch: 2, log: [{ ch: 1, reachedGoal: true, turnsUsed: 30 }], field: null, fatigue: 0 });
      try { if (root.MMRF_SEA && root.MMRF_SEA.warm) root.MMRF_SEA.warm(); } catch (e) {}   // 正式美術を先に読む（出発の p7Depart と同じ）
      root.MMWD2.setRoute(route);
      const r = root.MMP8.depart(S, base, root.MMQAB && root.MMQAB.seedRng ? root.MMQAB.seedRng() : Math.random); if (!r.ok || r.key !== 2) throw new Error(r.reason || 'depart');   // 2026-10-17：?qaSeed
      document.querySelectorAll('.tveil,.mmtitle').forEach((e) => e.remove());
      G('board')();
      badge(route);
      return true;
    } catch (e) { const end = G('testTourEnd'); if (end) end('Chapter 2 の試遊を始められませんでした（' + esc(e && e.message) + '）'); return false; }
  }
  function badge(route) {
    if (document.getElementById('ch2tv')) return;
    const b = document.createElement('div'); b.id = 'ch2tv'; b.className = 'ch2tv';
    const url = (k) => { const u = new URL(root.location.href); u.searchParams.set('ch2trial', k); u.searchParams.delete('ch2route'); return u.pathname + u.search; };
    b.innerHTML = `<span>Ch2 試遊</span>${['A', 'B', 'C'].map((k) => `<a href="${esc(url(k))}"${k === route ? ' class="on" aria-current="true"' : ''}>${k}</a>`).join('')}<small>版 ${esc(G('MM_BUILD') || '')}・${SRC}</small>`;
    const s = document.createElement('style'); s.textContent = `.ch2tv{position:fixed;right:6px;top:calc(env(safe-area-inset-top,0px) + 104px);z-index:850;display:flex;align-items:center;gap:4px;padding:3px 6px;border-radius:9px;background:rgba(8,22,44,.72);color:#e8f2ff;font:600 10px/1.2 "Noto Sans JP",sans-serif;pointer-events:none}
.ch2tv a{pointer-events:auto;display:inline-block;min-width:20px;padding:2px 4px;border-radius:6px;border:1px solid rgba(255,255,255,.45);color:#fff;text-align:center;text-decoration:none}.ch2tv a.on{background:#f3c55a;color:#13233a;border-color:#f3c55a}
.ch2tv small{opacity:.85;font-weight:500}`;
    document.head.appendChild(s); document.body.appendChild(b);
  }
  root.MMCH2T = Object.freeze({ route: ROUTE, SRC, start, badge });
  if (ROUTE) root.addEventListener('load', () => setTimeout(() => start(ROUTE), 350));
})(typeof window !== 'undefined' ? window : globalThis);
