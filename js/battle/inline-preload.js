// =========================================================
// 2026-10-19：外へ出したバトルの絵（assets/inline/＝もと index.html の base64）の先読み `MMINL`
//
//  もとは data URI で index.html に入っていた＝バトルの <img> は差し込んだその場で読み終わり、最初のフレームから出ていた。
//  ファイルにした今も同じにするため：
//   1) バトルの直前の画面で「そのバトルに要る絵だけ」をファイルから読み（XMLHttpRequest）、中身を data URI（元と同じ MIME・同じバイト列）にして手元に持つ。
//   2) バトル画面に <img> が入った瞬間（MutationObserver＝描画の前）に、その src を手元の data URI に差し替える。
//      ＝外部化の前と同じ data URI の読み込みになり、最初のフレームから出る（ちらつかない）。中身・大きさ・位置は変わらない。
//  起動時には何も読まない。手元に無い絵（予想しなかった絵）は差し替えない＝ふつうにファイルから読む。
//
//  いつ・何を読むか（tools/inline-images/usage.mjs で実測した、バトルで要求される絵）：
//   ・Chapter の盤に入ったとき（board の後）＝バトル開始の瞬間に出る絵だけ（base）：
//       STOP の絵（STOPART）・背景 BTB[ランク]・登場のポーズ SPX[種族].intro（自分と相手の候補）・自分の技の小さな絵 SKART[装備]
//   ・大会の対戦表・比較画面（p8TourScr・p9CompareScr）・遭遇（bBattleGo）＝そのバトルの全部（full）：
//       base ＋ 決着のポーズ SPX.win／lose ＋ 相手の技の SKART ＋（旧のバトル画面・新しいコマの無い技だけ）技の4コマ SFR と効果 SFXL
//   ・「対戦開始」を押した時点で、バトル開始の瞬間に出る絵（base）が読み終わっていなければ、比較画面のまま最大 WAIT_MS 待ってからバトルへ
//     （決着のポーズ・技の4コマは最初の STOP よりあとに出る＝待たずにバトルの間も読み続ける）
//       （大会＝p9VsGo を包む・野生など＝js/battle/compare.js の重ね画面が beforePractice を待つ）。そろっていれば待たない。
//  相手の技＝fight()（Phase 6）が相手を作るときの表（OPP_BASE）と同じ値（fight() は読むだけ・変えない。tests/inline-images-1019.test.mjs の IN-05 で照合）。
//  旧カード（AS.mkt・soL…）と旧 NPC（NPI）は表示しないので読まない。手元の data URI はバトルのあとも持つ（多くて数十枚・元は 175枚ぶん全部を持っていた）。
// =========================================================
(function (root) {
  'use strict';
  const G = (name) => { try { return (0, eval)(name); } catch (e) { return undefined; } };   // index.html の上の階層の const（SKART・SFR など）
  const PREFIX = 'assets/inline/';
  const WAIT_MS = 3000;
  const data = new Map();     // URL → data URI（読み終わった絵）
  const pending = new Map();  // URL → Promise（読んでいる途中）
  const failed = new Set();   // 読めなかった URL（待たない・差し替えない）
  const log = [], swaps = [], waits = [];

  function load(u) {
    if (typeof u !== 'string' || !u.startsWith(PREFIX)) return Promise.resolve(null);
    if (data.has(u)) return Promise.resolve(data.get(u));
    if (pending.has(u)) return pending.get(u);
    if (typeof XMLHttpRequest !== 'function' || typeof FileReader !== 'function') return Promise.resolve(null);
    log.push(u);
    // XMLHttpRequest（音の読み込みと同じ。本体のスクリプトは fetch を使わない約束＝tests の QA-S2）→ Blob → data URI（Blob の種類＝配信の MIME）
    const p = new Promise((ok, ng) => { const x = new XMLHttpRequest(); x.open('GET', u); x.responseType = 'blob'; x.onload = () => (x.status >= 200 && x.status < 300 && x.response && /^image\//.test(x.response.type) ? ok(x.response) : ng(new Error(String(x.status)))); x.onerror = ng; x.send(); })
      .then((b) => new Promise((ok, ng) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.onerror = ng; fr.readAsDataURL(b); }))
      .then((d) => { if (typeof d !== 'string') throw new Error('not read'); data.set(u, d); pending.delete(u); return d; })
      .catch(() => { failed.add(u); pending.delete(u); return null; });
    pending.set(u, p);
    return p;
  }
  const isReady = (u) => data.has(u);
  const settled = (u) => data.has(u) || failed.has(u);
  /** urls を読み、すべて終わるか maxMs で resolve（true＝そろった） */
  function whenReady(urls, maxMs) {
    const L = urls || [];
    L.forEach(load);
    return new Promise((ok) => {
      const t0 = Date.now();
      const chk = () => { if (L.every(settled)) return ok(L.every(isReady)); if (Date.now() - t0 >= maxMs) return ok(false); setTimeout(chk, 30); };
      chk();
    });
  }

  // ---- 差し替え：<img> の src が手元にある絵なら data URI へ（描画の前）----
  function swap(im) {
    const s = im.getAttribute && im.getAttribute('src');
    if (!s || !s.startsWith(PREFIX)) return;
    const d = data.get(s);
    if (!d) return;
    im.setAttribute('src', d);
    if (swaps.length < 500) swaps.push(s);
  }
  function observe() {
    if (typeof MutationObserver !== 'function' || !root.document || !document.body) return false;
    new MutationObserver((ms) => {
      if (!data.size) return;
      for (const m of ms) {
        if (m.type === 'attributes') { if (m.target.tagName === 'IMG') swap(m.target); continue; }
        for (const n of m.addedNodes) {
          if (n.nodeType !== 1) continue;
          if (n.tagName === 'IMG') swap(n);
          else if (n.getElementsByTagName) { const L = n.getElementsByTagName('img'); for (let i = 0; i < L.length; i++) swap(L[i]); }
        }
      }
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
    return true;
  }

  // ---- そのバトルに要る絵 ----
  // fight() の相手の技（相手の種族 esp・ランク rkk。師匠戦 dj は入口が無い）＝fight() の base と同じ表
  const OPP_BASE = [
    [[5, [9, 8, 4, 3]], [4, [4, 5, 8, 2]], [2, [0, 2, 3, 6]], [0, [0, 1, 2, 3]]],
    [[5, [19, 18, 16, 13]], [4, [15, 17, 14, 13]], [2, [11, 13, 12, 10]], [0, [10, 11, 12, 13]]],
  ];
  const oppMoves = (esp, rank) => { const t = OPP_BASE[esp ? 1 : 0]; return (t.find((x) => rank >= x[0]) || t[t.length - 1])[1]; };
  const sprAct = (sp, acts, add) => { const SPX = G('SPX'); const X = SPX && SPX[sp]; if (!X) return; acts.forEach((a) => (X[a] || []).forEach((q) => add(q && q[0]))); };
  // 旧のバトル画面（?battleArt=old・設定の「旧」）か、新しいコマの無い技（受け継いだ技など）だけ、技の4コマと効果を読む
  function needFrames(k, sp) {
    const A = root.MM25D;
    if (!A) return true;
    if (A.offered && !A.on) return true;
    try { if (root.localStorage && localStorage.getItem('mmbattleui') === 'old') return true; } catch (e) { /* */ }
    return A.owner(k) !== sp;
  }
  /** そのバトルに要る絵の URL の一覧（m＝自分の個体・rank＝ランク・foe＝相手の種族（分からなければ -1）・full＝全部） */
  function kit(m, rank, foe, full) {
    const U = [], add = (u) => { if (typeof u === 'string' && u.startsWith(PREFIX) && !U.includes(u)) U.push(u); };
    const STOPART = G('STOPART'), BTB = G('BTB'), SKART = G('SKART'), SFR = G('SFR'), SFXL = G('SFXL'), SPX = G('SPX');
    if (!m) return U;
    const r = Math.max(0, Math.min(5, rank | 0));
    const foes = foe >= 0 && foe < (SPX ? SPX.length : 2) ? [foe] : [0, 1];
    add(typeof STOPART === 'string' ? (STOPART.match(/src="([^"]+)"/) || [])[1] : null);
    if (BTB && BTB[r]) add(BTB[r][0]);
    [m.sp, ...foes].forEach((sp) => sprAct(sp, ['intro'], add));
    const mine = (m.eq || []).filter((k) => k >= 0);
    mine.forEach((k) => add(SKART && SKART[k]));
    if (!full) return U;
    [m.sp, ...foes].forEach((sp) => sprAct(sp, ['win', 'lose'], add));
    const moves = mine.map((k) => [k, m.sp]);
    foes.forEach((esp) => oppMoves(esp, r).forEach((k) => { moves.push([k, esp]); add(SKART && SKART[k]); }));
    moves.forEach(([k, sp]) => {
      if (!needFrames(k, sp)) return;
      const F = SFR && SFR[k];
      ((F && F.f) || []).forEach((f) => add(f && f.u));
      add(SFXL && SFXL[k]);
    });
    return U;
  }
  function prepare(m, rank, foe, full) { const U = kit(m, rank, foe, full); U.forEach(load); return U; }

  // ---- 画面からの呼び出し（index.html の関数を外から包む＝中身は変えない）----
  const S_ = () => G('S');
  function tourUrls(full = true) {
    const S = S_(), m = S && S.m, t = m && m.raise && m.raise.tour;
    if (!t || t.status !== 'league') return [];
    let foe = -1;
    try { const pm = root.MMP8.tourNext(m), ev = pm && root.MMP8L.entrantView(t.league, pm.opp); if (ev && ev.sp >= 0) foe = ev.sp; } catch (e) { /* */ }
    return kit(m, t.rank, foe, full);
  }
  function practiceUrls(full = true) {
    const S = S_(), m = S && S.m;
    if (!m || !m.raise || !root.MMP8) return [];
    const bt = m.raise.pend && m.raise.pend.fx ? m.raise.pend.fx.battleType : null;
    let rk = 0, foe = -1;
    try { rk = bt === 'rival' && root.MMRIVAL ? root.MMRIVAL.rankFor(m) : root.MMP8.practiceRank(m); } catch (e) { /* */ }
    try { const SP = G('SP'); if (bt && bt !== 'rival' && root.MMCH && root.MMCH.foeSpecies && m.raise.field) foe = root.MMCH.foeSpecies(m, SP.length); } catch (e) { /* */ }
    return kit(m, rk, foe, full);
  }
  function gate(urls) {
    if (!urls.length || urls.every(settled)) return Promise.resolve(true);
    const t0 = Date.now();
    return whenReady(urls, WAIT_MS).then((r) => { waits.push({ ms: Date.now() - t0, ok: r, n: urls.length }); return r; });
  }
  /** js/battle/compare.js の重ね画面（野生・レア・ライバル）の「対戦開始」から呼ぶ */
  const beforePractice = () => { practiceUrls(true).forEach(load); return gate(practiceUrls(false)); };
  const tourKit = () => { tourUrls().forEach(load); };
  function afterBoard() {
    const S = S_(), m = S && S.m;
    if (!m || !m.raise || (m.raise.state !== 'board' && m.raise.state !== 'final')) return;
    if (m.raise.tour && m.raise.tour.status === 'league') return tourKit();
    let rk = 0;
    try { rk = root.MMP8.practiceRank(m); } catch (e) { /* */ }
    prepare(m, rk, -1, false);
  }
  let installed = false;
  function install() {
    if (installed) return; installed = true;
    observe();
    const wrap = (name, after, before) => { const f = root[name]; if (typeof f !== 'function' || f.__mminl) return; const w = function () { if (before) try { before(); } catch (e) { /* */ } const r = f.apply(this, arguments); if (after) try { after(); } catch (e) { /* */ } return r; }; w.__mminl = true; root[name] = w; };
    wrap('board', afterBoard);
    wrap('p8TourScr', tourKit);
    wrap('p9CompareScr', tourKit);
    wrap('bBattleGo', null, () => { practiceUrls().forEach(load); });
    // 大会の「対戦開始」（p9VsGo）：絵がそろうまで比較画面のまま待ってから元の処理（元の処理の「1回だけ」の印は元の処理が付ける）
    const vs = root.p9VsGo;
    if (typeof vs === 'function' && !vs.__mminl) {
      let busy = false;
      const w = function (b) {
        if (busy || (b && b.dataset && b.dataset.go)) return;
        tourUrls(true).forEach(load);
        const U = tourUrls(false);   // 待つのはバトル開始の瞬間に出る絵だけ（決着のポーズ・技の4コマはバトルの間も読み続ける）
        if (!U.length || U.every(settled)) return vs.apply(this, arguments);
        busy = true; const self = this, args = arguments;
        gate(U).then(() => { busy = false; vs.apply(self, args); });
      };
      w.__mminl = true; root.p9VsGo = w;
    }
    try { afterBoard(); } catch (e) { /* 再開したとき最初の盤はこの前に描かれている */ }
  }
  if (root.document) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
    else install();
  }

  root.MMINL = Object.freeze({
    PREFIX, OPP_BASE, WAIT_MS, oppMoves, kit, prepare, load, isReady, whenReady, gate, beforePractice, tourUrls, practiceUrls, install,
    loaded: () => [...data.keys()], log: () => log.slice(), swaps: () => swaps.slice(), waits: () => waits.slice(), failed: () => [...failed], count: () => data.size + pending.size,
  });
})(typeof window !== 'undefined' ? window : globalThis);
