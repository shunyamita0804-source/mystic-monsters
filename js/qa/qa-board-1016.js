// =========================================================
// 2026-10-16 夜間 QA（B カメラ・C 歩行の向き・A 道路）の入口と版の札 `MMQAB`（作業ブランチ claude/qa-bca-1016 だけ・試作＝未承認）
//
//  ・?ch1trial=A|B|C＝Chapter 1 の試遊（Chapter 2 の ?ch2trial と同じ仕組み）：起動のあと今のセーブ（S）を丸ごと控え、連れている子の写し（いなければソラモ）で
//    Chapter 1 の本物の出発 → 1枚の世界のボード。試遊の間は保存しない（TEST_TOUR がある間 save() は何もしない）。再読み込み・メニューの「試遊をやめて街へ戻る」で控えたセーブへ戻る。
//  ・どれかの QA の URL（ch1trial・ch2trial・qaCam・qaWalk・qaRoad）のとき、画面の左上（HUD の下）に小さな札：版（MM_BUILD）・今の QA の方式・
//    カメラの方式の切り替え（その URL で読み込み直す）。古いキャッシュとの取り違えを防ぐ。
//  ・通常の URL では何もしない。index.html の TEST_MODE が false（正式リリース）なら試遊は始めない（札だけ）。
// =========================================================
(function (root) {
  'use strict';
  let P = null; try { P = new URLSearchParams(root.location.search); } catch (e) {}
  const get = (k) => (P ? P.get(k) : null);
  const R1 = ['A', 'B', 'C'].includes(get('ch1trial')) ? get('ch1trial') : null;
  const QA = !!(R1 || get('ch2trial') || get('qaCam') || get('qaWalk') || get('qaRoad') || get('qaRoadArt'));
  const G = (n) => { try { return (0, eval)(n); } catch (e) { return undefined; } };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  /** 2026-10-17：?qaSeed＝出発の乱数を固定（同じ seed＝同じ配置。QA トップ）。無ければ Math.random */
  function seedRng() { const n = /^\d{1,9}$/.test(get('qaSeed') || '') ? +get('qaSeed') : null; if (n == null) return Math.random; let a = n >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function startCh1(route) {
    route = ['A', 'B', 'C'].includes(route) ? route : 'A';
    if (G('TEST_MODE') === false || G('TEST_TOUR') || !root.MMP8 || !root.MMWD || !root.MMWD.isAttached()) return false;
    const S0 = G('S'); if (!S0) return false;
    (0, eval)('TEST_TOUR = { snap: ' + JSON.stringify(JSON.stringify(S0)) + ', ch2: ' + JSON.stringify('ch1-' + route) + ' }');   // ch2＝メニューの「試遊をやめて街へ戻る」の文（既存の判定をそのまま使う）
    try {
      const S = G('S');
      if (S.playerNamePending) { S.playerNamePending = false; if (!S.playerName) S.playerName = 'テスト'; }   // ページの中だけ（保存しない）
      // 歩行の比較（?qaWalk=soramo5）はソラモだけ＝連れている子がソラモ以外ならソラモで始める（ページの中だけ・保存しない）
      // 2026-10-17：?qaMon＝0〜4（QA トップで選んだ子）・新歩行（?qaWalk=1017）は7体とも＝ソラモに固定しない
      const mk = G('mk'), so = !!(root.MMQAW && root.MMQAW.active && !root.MMQAW.new7), qm = /^[0-4]$/.test(get('qaMon') || '') ? +get('qaMon') : null;
      const base = qm != null ? Object.assign(mk(qm), { name: 'テスト' }) : S.m && !(so && S.m.sp !== 0) ? JSON.parse(JSON.stringify(S.m)) : Object.assign(mk(0), { name: so ? 'ソラモ' : 'テスト' });
      delete base.raise; root.MMP7.ensureProg(base); S.m = base; if (!(Array.isArray(S.inv.bag) && S.inv.bag.length)) { const SP = G('SUPPORT'); if (SP && SP.item) root.MMP7.bagAdd(S, SP.item, 10); }
      const c = root.MMP8.canDepart(S, base); if (!c.ok) throw new Error(c.reason || 'canDepart');
      root.MMWD.setRoute(route);
      const r = root.MMP8.depart(S, base, seedRng()); if (!r.ok || r.key !== 1) throw new Error(r.reason || 'depart');
      document.querySelectorAll('.tveil,.mmtitle').forEach((e) => e.remove());
      G('board')();
      return true;
    } catch (e) { const end = G('testTourEnd'); if (end) end('Chapter 1 の試遊を始められませんでした（' + esc(e && e.message) + '）'); return false; }
  }
  const CAMS = [['', 'C案（正式）'], ['old', '従来'], ['fixed', '固定'], ['ccut', 'C案切替']];   // 2026-10-18 REV3：C案が正式の既定
  function badge() {
    if (!QA || document.getElementById('qabv')) return;
    const url = (k, v) => { const u = new URL(root.location.href); if (v) u.searchParams.set(k, v); else u.searchParams.delete(k); return u.pathname + u.search; };
    const cam = get('qaCam') || '', walk = get('qaWalk') || '', road = get('qaRoad') || '';
    const b = document.createElement('div'); b.id = 'qabv'; b.className = 'qabv';
    b.innerHTML = `<b>QA</b><small>版 ${esc(G('MM_BUILD') || '')}</small><span class="qabv-r">カメラ ${CAMS.map(([v, n]) => `<a href="${esc(url('qaCam', v))}"${v === cam ? ' class="on" aria-current="true"' : ''}>${n}</a>`).join('')}</span>`
      + `<span class="qabv-r">歩行 ${esc(walk || '新（正式）')}・道路 ${esc(road || '従来')}</span>`;
    const s = document.createElement('style'); s.textContent = `.qabv{position:fixed;left:6px;top:calc(env(safe-area-inset-top,0px) + 132px);z-index:850;display:flex;flex-direction:column;gap:2px;padding:3px 6px;border-radius:9px;background:rgba(8,22,44,.72);color:#e8f2ff;font:600 10px/1.25 "Noto Sans JP",sans-serif;pointer-events:none;max-width:62vw}
.qabv b{color:#f3c55a}.qabv small{font-weight:500;opacity:.9}.qabv a{pointer-events:auto;display:inline-block;margin-left:3px;padding:1px 4px;border-radius:6px;border:1px solid rgba(255,255,255,.45);color:#fff;text-decoration:none}.qabv a.on{background:#f3c55a;color:#13233a;border-color:#f3c55a}`;
    document.head.appendChild(s); document.body.appendChild(b);
  }
  root.MMQAB = Object.freeze({ ch1: R1, qa: QA, startCh1, badge, seedRng });
  if (QA) root.addEventListener('load', () => setTimeout(() => { if (R1) startCh1(R1); badge(); }, 380));
})(typeof window !== 'undefined' ? window : globalThis);
