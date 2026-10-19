// =========================================================
// 2026-10-16（バトル最終統合）：常設バトル QA のステージ `MMQAS`（?mmQaTrial=1 の QA 試遊モードの中の1画面・js/qa/trial.js から開く）
//  ・全モンスター（MMQA.catalog()＝マスターデータの登録から作る一覧。新しい種族が登録されれば自動で増える）の技を、
//    1つずつ選んで即再生／選んだ1体の全10技を連続自動再生。実戦と同じ描画（index.html の anim(k, s)＝共通演出 MMSTAGE・技アニメ MM25D・
//    ルートドレイン MMRD・聖なる炎 V2）。SK の番号の無い技（フルーネの未承認の技）は MM25D.preview のコマだけ
//  ・操作：モンスター・技・攻撃側（味方＝左／敵＝右）・相手・体格（正式）・背景（会場／黒／白／紺）・速さ（1／0.5／0.25）・
//    ループ・結果（命中／回避／MISS＝見せ方だけ。判定・HP・状態異常は動かさない）・一時停止・コマ送り・前の技／次の技
//  ・保存しない：QA 試遊モード（MMQA）が ON の間だけ開ける＝通常のセーブへの書き込みは止まっている。出るときは試合を降参で終えて QA の一覧へ（既存の流れ）。
//    仮想の時計（速さ・一時停止）・タイマー・アニメーション・技の絵の層は出るときに片付ける
// =========================================================
(function (root) {
  'use strict';
  const doc = root.document;
  const G = (n) => { try { return (0, eval)(n); } catch (e) { return undefined; } };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const SIZES = Object.freeze([['F', '正式']]);   // 2026-10-19：体格は正式（サイズ1〜5・MMTUNE.SIZE_K）だけ＝比較案は撤去
  const BGS = Object.freeze([['arena', '会場'], ['black', '黒'], ['white', '白'], ['navy', '紺']]);
  const SPEEDS = Object.freeze([1, 0.5, 0.25]);
  const RESULTS = Object.freeze([['hit', '命中'], ['evade', '回避'], ['miss', 'MISS']]);
  const ST = { open: false, mon: 0, no: 1, side: 0, target: 0, size: 'F', bg: 'arena', speed: 1, loop: false, result: 'hit', auto: false, busy: false, seq: 0, log: [] };

  // ---- 仮想の時計（速さ・一時停止・コマ送り）。開いている間だけ window.setTimeout／clearTimeout を差し替える ----
  const VC = { on: false, rate: 1, paused: false, vt: 0, last: 0, q: [], id: 1e9, raf: 0, st: null, ct: null };
  function vcStart() {
    if (VC.on) return; VC.on = true; VC.vt = 0; VC.q = []; VC.last = performance.now();
    VC.st = root.setTimeout; VC.ct = root.clearTimeout;
    const vst = function (fn, ms) { const a = Array.prototype.slice.call(arguments, 2), id = ++VC.id; VC.q.push({ id, due: VC.vt + Math.max(0, +ms || 0), fn, a }); return id; };
    const vct = function (id) { const i = VC.q.findIndex((t) => t.id === id); if (i >= 0) VC.q.splice(i, 1); else VC.ct.call(root, id); };
    root.__mmqaST = vst; root.setTimeout = vst; root.clearTimeout = vct;
    const tick = (now) => { if (!VC.on) return; const dt = Math.min(100, now - VC.last); VC.last = now; if (!VC.paused) advance(dt * VC.rate); syncAnims(); VC.raf = root.requestAnimationFrame(tick); };
    VC.raf = root.requestAnimationFrame(tick);
  }
  function advance(ms) {
    VC.vt += ms;
    for (let guard = 0; guard < 500; guard++) {
      let k = -1; VC.q.forEach((t, i) => { if (t.due <= VC.vt && (k < 0 || t.due < VC.q[k].due)) k = i; });
      if (k < 0) break;
      const t = VC.q.splice(k, 1)[0];
      try { typeof t.fn === 'function' ? t.fn.apply(root, t.a) : (0, eval)(String(t.fn)); } catch (e) { /* 無視 */ }
    }
  }
  function syncAnims() {
    if (!doc.getAnimations) return;
    doc.getAnimations().forEach((a) => {
      try {
        if (VC.paused) { if (a.playState === 'running') { a.pause(); a.__mmqaP = 1; } }
        else { if (a.__mmqaP && a.playState === 'paused') { a.__mmqaP = 0; a.play(); } if (a.playbackRate !== VC.rate) a.playbackRate = VC.rate; }
      } catch (e) { /* 無視 */ }
    });
  }
  function step(ms) {   // 一時停止中のコマ送り（約 1/30 秒）
    if (!VC.on) return;
    VC.paused = true; syncAnims();
    doc.getAnimations().forEach((a) => { try { if (a.playState === 'paused' && a.currentTime != null) a.currentTime = a.currentTime + ms; } catch (e) { /* 無視 */ } });
    advance(ms); syncAnims();
  }
  function vcStop() {
    if (!VC.on) return; VC.on = false; root.cancelAnimationFrame(VC.raf);
    root.setTimeout = VC.st; root.clearTimeout = VC.ct; delete root.__mmqaST;
    const q = VC.q; VC.q = [];
    doc.getAnimations && doc.getAnimations().forEach((a) => { try { a.playbackRate = 1; if (a.__mmqaP && a.playState === 'paused') a.play(); } catch (e) { /* 無視 */ } });
    q.forEach((t) => { try { VC.st.call(root, t.fn, 0); } catch (e) { /* 無視 */ } });   // 残ったタイマーは本物の時計で即時（片付け・元へ戻す処理を落とさない）
  }

  // ---- データ ----
  const cat = () => (root.MMQA ? root.MMQA.catalog() : []);
  const monOf = (i) => cat()[i] || null;
  const moveOf = (i, no) => { const x = monOf(i); return x && x.moves.find((m) => m.no === no); };
  const playable = (mv) => mv && (mv.status === 'battle' || mv.status === 'preview');
  const statusTxt = (mv) => !mv ? '' : mv.status === 'battle' ? '実戦の描画' : mv.status === 'preview' ? (mv.anim && mv.anim.wait ? '技アニメのプレビュー（FX追加待ち）' : '技アニメのプレビュー（性能は未承認）') : '未実装／素材待ち（静止カードだけ）';

  // ---- 画面 ----
  function css() {
    if (doc.getElementById('mmqas-css')) return;
    const s = doc.createElement('style'); s.id = 'mmqas-css';
    s.textContent = [
      '#mmqas{position:fixed;z-index:70;left:0;right:0;bottom:0;padding:6px 6px calc(env(safe-area-inset-bottom,0px) + 6px);background:rgba(8,14,38,.94);border-top:3px solid #ffde59;color:#fff3d6;font:700 11px/1.2 "Noto Sans JP",sans-serif}',
      '#mmqas .qsh{display:flex;align-items:center;gap:6px;margin-bottom:5px}',
      '#mmqas .qsh img{width:68px;aspect-ratio:16/9;object-fit:contain;background:#000;border-radius:5px;flex:none}',
      '#mmqas .qsh .qinfo{color:#bfe3ff;font-size:9px;line-height:1.3;word-break:break-all}',
      '#mmqas .qsh b{font:900 14px/1.2 "Noto Sans JP",sans-serif;color:#fff}#mmqas .qsh small{display:block;font-size:10px;color:#ffd27a;margin-top:2px}',
      '#mmqas .qsg{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}',
      '#mmqas label{display:flex;flex-direction:column;gap:1px;min-width:0;font-size:9.5px;color:#cfd8ff}',
      '#mmqas select{width:100%;min-height:30px;padding:2px 4px;border:1.5px solid #d8b25a;border-radius:7px;background:#13224f;color:#fff3d6;font:700 11.5px/1.1 "Noto Sans JP",sans-serif}',
      '#mmqas .qsb{display:grid;grid-template-columns:repeat(6,1fr);gap:4px;margin-top:5px}',
      '#mmqas .qsb button{min-height:40px;padding:2px;border:1.5px solid #d8b25a;border-radius:9px;background:#1d2f66;color:#fff3d6;font:800 11.5px/1.15 "Noto Sans JP",sans-serif;cursor:pointer}',
      '#mmqas .qsb button.go{background:linear-gradient(180deg,#fbe39a,#c58d2a);color:#3b2406;border-color:#fff0c0}',
      '#mmqas .qsb button.on{background:#c27a12;color:#fff}',
      '#mmqas .qsb button.x{background:#8c0d24;color:#fff;border-color:#fff}',
      '#mmqas-miss{position:fixed;z-index:69;left:0;right:0;top:34%;text-align:center;font:900 44px/1 "Noto Sans JP",sans-serif;color:#cfd8ff;text-shadow:0 2px 0 #0b1636,0 0 12px #000;pointer-events:none}',
      '#bt.mmqas-bgk,#bt.mmqas-bgw,#bt.mmqas-bgn{background:none!important}',
      '#bt.mmqas-bgk .mma-bg,#bt.mmqas-bgw .mma-bg,#bt.mmqas-bgn .mma-bg,#bt.mmqas-bgk .bgs,#bt.mmqas-bgw .bgs,#bt.mmqas-bgn .bgs{visibility:hidden!important}',
      '#bt.mmqas-bgk{background:#000!important}#bt.mmqas-bgw{background:#fff!important}#bt.mmqas-bgn{background:#1b2a4e!important}',
      '#bt.mmqas .bui,#bt.mmqas .mmr,#bt.mmqas .gow,#bt.mmqas #go,#bt.mmqas #sur{visibility:hidden!important}',
    ].join('\n');
    doc.head.appendChild(s);
  }
  const opt = (list, v) => list.map(([k, t]) => `<option value="${esc(k)}"${String(k) === String(v) ? ' selected' : ''}>${esc(t)}</option>`).join('');
  function panel() {
    let p = doc.getElementById('mmqas'); if (!p) { p = doc.createElement('div'); p.id = 'mmqas'; p.setAttribute('role', 'region'); p.setAttribute('aria-label', 'バトル技 QA'); doc.body.appendChild(p); }
    const C = cat(), x = C[ST.mon], mv = moveOf(ST.mon, ST.no);
    const sel = (n, label, inner) => `<label>${label}<select data-k="${n}">${inner}</select></label>`;
    p.innerHTML = `<div class="qsh"><img src="${esc(mv && mv.src)}" alt=""><div><b>${esc(x ? x.name : '')} ${mv ? String(mv.no).padStart(2, '0') + ' ' + esc(mv.name) : ''}</b><small>${esc(statusTxt(mv))}${mv && mv.slot != null ? '・SK ' + mv.slot : ''}${ST.auto ? '・全10技 連続再生中' : ''}</small><small class="qinfo" id="mmqas-info"></small></div></div>`
      + '<div class="qsg">'
      + sel('mon', 'モンスター', opt(C.map((c, i) => [i, c.name]), ST.mon))
      + sel('no', '技', opt((x ? x.moves : []).map((m) => [m.no, String(m.no).padStart(2, '0') + ' ' + m.name + (playable(m) ? '' : '（静止）')]), ST.no))
      + sel('side', '攻撃側', opt([[0, '味方（左）'], [1, '敵（右）']], ST.side))
      + sel('target', '相手', opt(C.map((c, i) => [i, c.name]), ST.target))
      + sel('size', '体格', opt(SIZES, ST.size))
      + sel('bg', '背景', opt(BGS, ST.bg))
      + sel('speed', '速さ', opt(SPEEDS.map((v) => [v, v === 1 ? '1倍' : v + '倍']), ST.speed))
      + sel('result', '結果', opt(RESULTS, ST.result))
      + sel('loop', 'ループ', opt([[0, 'OFF'], [1, 'ON']], ST.loop ? 1 : 0))
      + '</div><div class="qsb">'
      + '<button type="button" data-a="prev" data-nsfx="1">◀ 前</button>'
      + '<button type="button" class="go" data-a="play" data-nsfx="1">▶ 再生</button>'
      + '<button type="button" data-a="next" data-nsfx="1">次 ▶</button>'
      + `<button type="button" data-a="pause" data-nsfx="1" class="${VC.paused ? 'on' : ''}">${VC.paused ? '▶ 再開' : '⏸ 停止'}</button>`
      + '<button type="button" data-a="step" data-nsfx="1">コマ送り</button>'
      + `<button type="button" data-a="auto" data-nsfx="1" class="${ST.auto ? 'on' : ''}">全10技</button>`
      + '</div><div class="qsb" style="grid-template-columns:1fr"><button type="button" class="x" data-a="close" data-nsfx="1">QA 一覧へ戻る（保存しない）</button></div>';
    showInfo(mv);
    p.querySelectorAll('select').forEach((s) => { s.onchange = () => change(s.dataset.k, s.value); });
    p.querySelectorAll('.qsb button').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); act(b.dataset.a); }; });
  }
  // 2026-10-18 REV3 A6：今の技が実際に使うデータ（MM25D.info）・最初のコマのファイルと sha256（先頭12＝読み込んだファイルそのもの）・モード・控えに落ちたか。QA の画面だけ
  const SHA = {};
  function showInfo(mv) {
    const el = doc.getElementById('mmqas-info'); if (!el) return;
    const I = mv && mv.slot != null && root.MM25D && root.MM25D.info ? root.MM25D.info(mv.slot, ST.side) : null;
    if (!I) { el.textContent = 'データ：（技の番号なし）'; return; }
    const f = I.first || '', put = () => { el.textContent = `データ：${I.mode}${I.set ? '・' + I.set : ''}${I.tune ? '・修正 ' + I.tune : ''}${I.fallback ? '・控え（' + (I.why || '') + '）' : ''}${f ? '／' + f.replace(/^\.\/assets\/battle\//, '') + '（' + (SHA[f] || '…') + '）' : ''}・本体 ${I.cuts}・効果 ${I.fx}`; el.dataset.mode = I.mode; el.dataset.first = f; el.dataset.sha = SHA[f] || ''; };
    put();
    if (f && !SHA[f] && root.XMLHttpRequest && root.crypto && root.crypto.subtle) {   // 読み込んだファイルそのものの sha256（XHR＝本体のスクリプトは fetch を使わない約束）
      const x = new root.XMLHttpRequest(); x.open('GET', f); x.responseType = 'arraybuffer';
      x.onload = () => { if (x.status !== 200 || !x.response) return; root.crypto.subtle.digest('SHA-256', x.response).then((h) => { SHA[f] = [...new Uint8Array(h)].map((v) => v.toString(16).padStart(2, '0')).join('').slice(0, 12); if (doc.getElementById('mmqas-info') === el) put(); }).catch(() => {}); };
      x.send();
    }
  }
  function change(k, v) {
    if (k === 'mon') { ST.mon = +v; ST.no = 1; ST.auto = false; }
    else if (k === 'no') { ST.no = +v; ST.auto = false; }
    else if (k === 'side' || k === 'target') ST[k] = +v;
    else if (k === 'speed') { ST.speed = +v; VC.rate = ST.speed; }
    else if (k === 'loop') ST.loop = v === '1';
    else if (k === 'size') { ST.size = 'F'; }
    else ST[k] = v;
    dress(); panel();
  }
  function act(a) {
    if (a === 'close') return close();
    if (a === 'pause') { VC.paused = !VC.paused; syncAnims(); return panel(); }
    if (a === 'step') { step(33); return panel(); }
    if (a === 'prev' || a === 'next') { const x = monOf(ST.mon); if (!x) return; const n = x.moves.length; let i = x.moves.findIndex((m) => m.no === ST.no); i = (i + (a === 'next' ? 1 : n - 1)) % n; ST.no = x.moves[i].no; ST.auto = false; panel(); return play(); }
    if (a === 'auto') { ST.auto = !ST.auto; if (ST.auto) { const x = monOf(ST.mon); ST.no = x && x.moves[0] ? x.moves[0].no : 1; panel(); autoRun(); } else panel(); return; }
    if (a === 'play') { ST.auto = false; panel(); return play(); }
  }

  // ---- バトル画面の側・相手・体格・背景 ----
  const IDLE = (sp) => { const A = root.MMARENA; return A && A.IDLE && A.IDLE[sp] ? './assets/battle/idle/' + A.IDLE[sp] + '.webp' : null; };
  function dress() {
    const bt = doc.getElementById('bt'), BPL = G('BPL'); if (!bt || !BPL) return false;
    const C = cat(), atk = C[ST.mon], tgt = C[ST.target]; if (!atk || !tgt) return false;
    if (atk.sp >= 5 || tgt.sp >= 5) root.MMQA._lend();   // 5＝フルーネ・6＝ラズック（登録のみ＝QA の間だけ絵を貸す）
    const sides = ST.side ? [tgt.sp, atk.sp] : [atk.sp, tgt.sp];
    sides.forEach((sp, s) => {
      if (BPL[s]) BPL[s].sp = sp;
      const im = bt.querySelector(`#m${s} .mma-idle`), u = IDLE(sp); if (im && u && !im.src.endsWith(u.slice(1))) im.src = u;
      const mon = bt.querySelector(`#m${s} .mon`), A = root.MMARENA, T = root.MMTUNE;
      if (mon && A && bt.classList.contains('mma-v24')) mon.style.setProperty('--mma-k', String((A.SCALE[sp] || 0.91) * (T && T.sizeK ? T.sizeK(sp) : 1)));
      const nm = bt.querySelectorAll('.hn1 b')[s], cc = C.find((c) => c.sp === sp); if (nm && cc) nm.textContent = cc.name;   // HUD の名前だけ（HP・状態は動かさない）
    });
    bt.classList.add('mmqas'); bt.classList.toggle('mmqas-bgk', ST.bg === 'black'); bt.classList.toggle('mmqas-bgw', ST.bg === 'white'); bt.classList.toggle('mmqas-bgn', ST.bg === 'navy');
    try { if (root.MM25D && root.MM25D.preloadOff) root.MM25D.preloadOff(BPL); } catch (e) { /* 無視 */ }
    return true;
  }
  const idle = () => !(root.MMSTAGE && root.MMSTAGE.busy > 0) && !doc.querySelector('#bt .p25f, #bt .mmrd');
  function waitIdle(seq) { return new Promise((ok) => { const t0 = performance.now(); const w = () => { if (seq !== ST.seq || !ST.open) return ok(false); if (!VC.paused && idle() && performance.now() - t0 > 250) return ok(true); root.requestAnimationFrame(w); }; root.requestAnimationFrame(w); }); }
  function missPop() {
    const d = doc.createElement('div'); d.id = 'mmqas-miss'; d.textContent = 'MISS'; doc.body.appendChild(d);
    d.animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)', offset: 0.2 }, { opacity: 1, offset: 0.75 }, { opacity: 0 }], { duration: 900 });
    root.setTimeout(() => d.remove(), 900);
  }
  /** 1つの技を再生（実戦と同じ描画）。返り値＝再生の記録 */
  async function play() {
    if (!ST.open) return null;
    const seq = ++ST.seq, x = monOf(ST.mon), mv = moveOf(ST.mon, ST.no);
    VC.paused = false; syncAnims();
    if (!dress() || !mv) return null;
    const rec = { mon: x.key, no: mv.no, name: mv.name, slot: mv.slot, side: ST.side, target: monOf(ST.target).key, size: ST.size, bg: ST.bg, speed: ST.speed, result: ST.result, kind: null, t: performance.now() };
    await new Promise((ok) => root.requestAnimationFrame(() => root.requestAnimationFrame(ok)));
    if (seq !== ST.seq) return null;
    if (!playable(mv)) rec.kind = 'static';
    else if (ST.result === 'miss') { rec.kind = 'miss'; missPop(); }
    else {
      try { if (root.MMSTAGE && root.MMSTAGE.qaForce) root.MMSTAGE.qaForce(ST.result === 'evade' ? { hit: false, damage: 0 } : { hit: true, damage: 1 }); } catch (e) { /* 無視 */ }
      if (mv.slot != null && G('SK') && G('SK')[mv.slot]) { rec.kind = 'anim'; try { G('anim')(mv.slot, ST.side); } catch (e) { rec.err = String(e); } }
      else { rec.kind = 'preview'; try { root.MM25D.preview(x.key, mv.no, ST.side, { via: true }); } catch (e) { rec.err = String(e); } }
    }
    ST.log.push(rec); if (ST.log.length > 80) ST.log.shift();
    await waitIdle(seq);
    rec.ms = Math.round(performance.now() - rec.t);
    if (seq === ST.seq && ST.loop && !ST.auto && ST.open) { await new Promise((ok) => root.setTimeout(ok, 500)); if (seq === ST.seq && ST.open && ST.loop && !ST.auto) play(); }
    return rec;
  }
  async function autoRun() {
    const x = monOf(ST.mon); if (!x) return;
    do {
      for (const mv of x.moves) {
        if (!ST.auto || !ST.open) return;
        ST.no = mv.no; panel();
        const r = await play(); if (!r) return;
        await new Promise((ok) => root.setTimeout(ok, 600));
      }
    } while (ST.auto && ST.loop && ST.open);
    ST.auto = false; if (ST.open) panel();
  }

  // ---- 開く・閉じる ----
  /** QA 試遊モード（MMQA）が ON の間だけ。mon・no は最初に選ぶ技 */
  function open(mon, no) {
    const Q = root.MMQA; if (!Q || !Q.isOn() || ST.open) return false;
    const C = cat(); ST.mon = mon != null ? Math.max(0, Math.min(C.length - 1, mon | 0)) : ST.mon; ST.no = no || 1; ST.target = ST.mon === 0 ? 1 : 0;
    const m = Q.makeMon(C[ST.mon].sp === 5 ? 0 : C[ST.mon].sp); if (!m) return false;
    m.sk = [0]; m.eq = [0, 0, 0, 0, 0, 0]; m.speed = 10;   // ルーレット・STOP は隠す（技は使わない）。先にこちらの番＝相手は動かない
    if (!Q._start(m, true)) return false;
    ST.size = 'F';
    ST.open = true; ST.auto = false; css(); vcStart(); VC.rate = ST.speed; VC.paused = false;
    const ready = () => { const b = doc.getElementById('bt'), g = doc.getElementById('go'); if (!ST.open) return; if (!b || !g || g.disabled) return void root.requestAnimationFrame(ready); dress(); panel(); };
    ready();
    return true;
  }
  function close() {
    if (!ST.open) return false;
    ST.open = false; ST.auto = false; ST.seq++;
    const p = doc.getElementById('mmqas'); if (p) p.remove();
    const mp = doc.getElementById('mmqas-miss'); if (mp) mp.remove();
    VC.paused = false; vcStop();
    doc.querySelectorAll('#bt .p25f, #bt .mmrd').forEach((e) => e.remove());
    const bt = doc.getElementById('bt'); if (bt) bt.classList.remove('mmqas', 'mmqas-bgk', 'mmqas-bgw', 'mmqas-bgn');
    try { root.MMQA.endBattle(); } catch (e) { /* 無視 */ }
    return true;
  }
  root.MMQAS = Object.freeze({ open, close, play, act, change, state: () => Object.assign({}, ST, { log: undefined, paused: VC.paused, vc: VC.on }), log: () => ST.log.slice(), SIZES, BGS, SPEEDS, RESULTS });
})(typeof window !== 'undefined' ? window : globalThis);
