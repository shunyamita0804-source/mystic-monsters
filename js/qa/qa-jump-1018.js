// =========================================================
// 2026-10-18 QA の「移動」パネル `MMQAJ`（試遊の URL＝?ch1trial／?ch2trial／?ch3trial のときだけ。通常の URL では何もしない）
//  盤の左の「QA」ボタン → 主な地点（分かれ道・門・橋・運命の分かれ道・封印の門・ライバル・結晶の浮島・GOAL・寄り道の入口）へその場で移る。
//  「〜の手前」＝そのマスの1つ前へ移り、次の出目を 1 に固定（START を押せば、そのマスに止まって出来事・バトルが起きる）。
//  野生・レア・出来事・宝箱・食事：今の配置で一番近い（START から近い順）まだ使っていないマスの手前へ。
//  次の出目の固定（1〜6・毎回／1回だけ）・空腹を 0・ターンを 0。試遊は保存しない（TEST_TOUR）＝セーブは変わらない。
// =========================================================
(function (root) {
  'use strict';
  let P = null; try { P = new URLSearchParams(root.location.search); } catch (e) {}
  const ON = !!(P && ['ch1trial', 'ch2trial', 'ch3trial'].some((k) => ['A', 'B', 'C'].includes(P.get(k))));
  const G = (n) => { try { return (0, eval)(n); } catch (e) { return undefined; } };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const WD = (m) => (m.raise.ch === 3 ? root.MMWD3 : m.raise.ch === 2 ? root.MMWD2 : root.MMWD);
  let KEEP = null;   // 毎回同じ出目
  const POINTS = [['START', 'スタート'], ['J0', '最初の分かれ道'], ['EL2', '左の橋の先'], ['ER2', '右の橋の先'], ['P', '合流'], ['LOWER_GATE', '下の門'],
    ['Q', '運命の分かれ道', 1], ['QL2', '左の道（運命）'], ['QR2', '右の道（運命）'], ['R', '合流（運命のあと）'], ['UPPER_GATE', '上の門'], ['RIVAL', 'ライバル', 1],
    ['H', '後半の分かれ道'], ['CHALLENGE', '封印の門（特殊挑戦）', 1], ['L_MERGE', '左の合流'], ['HR1', '右の尾根（隠れ家の入口）'], ['STATUE', '石像／結晶（レアの候補）'],
    ['FINAL', '最後の合流'], ['GOAL', 'ゴール', 1]];
  const SPURS = [['EL2', '寄り道：左の宝（D_LC）'], ['EL3', '寄り道：左の祭壇（D_LA）'], ['ER2', '寄り道：右の宝（D_RC）'], ['SUCCESS_L2', '寄り道：挑戦の先の祭壇（D_LLA）'], ['STATUE', '寄り道：石像の奥（D_R5）'], ['HR3', '寄り道：滝（D_RS）'], ['HR1', '寄り道：隠れ家（D_RAND）']];
  function reach(D, from) { const fwd = {}; for (const e of D.edges) if (e[3] === 'forward') (fwd[e[0]] = fwd[e[0]] || []).push(e[1]); const seen = new Set([from]), q = [from]; while (q.length) { const x = q.shift(); for (const y of fwd[x] || []) if (!seen.has(y)) { seen.add(y); q.push(y); } } return seen; }
  const prevOf = (D, id) => { const e = D.edges.find((x) => x[1] === id && x[3] === 'forward' && !/^D_/.test(x[2])); return e ? e[0] : null; };
  /** その地点へ移る（die＝次の出目） */
  function jump(id, die) {
    const S = G('S'), m = S && S.m; if (!m || !m.raise || !m.raise.field) return false;
    const W = WD(m), D = W.dataOf(m), f = m.raise.field, c = f.core; if (!D.nodes[id]) return false;
    Object.assign(c, { node: id, moveLeft: 0, back: null, exclude: null, qPar: null, qDie: null, chal: null, chalDie: null, done: false, timeUp: false, trail: [id] });
    const r = reach(D, id);
    if (!r.has('RIVAL') || id === 'RIVAL') { c.rival = id !== 'RIVAL' || c.rival; if (id !== 'RIVAL') f.rivalMet = true; }
    for (const gt of ['LOWER_GATE', 'UPPER_GATE']) if (D.nodes[gt] && !r.has(gt) && !c.gates.includes(gt)) c.gates.push(gt);
    Object.assign(m.raise, { node: id, pend: null, goal: false });
    root.MM_QA_DIE = Number.isInteger(die) ? die : KEEP;
    try { if (root.MMWB) root.MMWB.release(); } catch (e) {}
    G('board')(); return true;
  }
  /** 種類のマスの手前（START から近い順・まだ使っていない・寄り道の外） */
  function before(kind) {
    const S = G('S'), m = S && S.m; if (!m || !m.raise || !m.raise.field) return false;
    const W = WD(m), D = W.dataOf(m), f = m.raise.field;
    const order = []; { const fwd = {}; for (const e of D.edges) if (e[3] === 'forward') (fwd[e[0]] = fwd[e[0]] || []).push(e[1]); const seen = new Set(['START']), q = ['START']; while (q.length) { const x = q.shift(); order.push(x); for (const y of fwd[x] || []) if (!seen.has(y)) { seen.add(y); q.push(y); } } }
    const hit = order.find((id) => { const t = f.tiles[id], n = D.nodes[id]; if (!t || f.used[id] != null || (n[3] && /^D_/.test(n[3]))) return false;
      return kind === 'rare' ? t.t === 'wild' && t.rare : kind === 'wild' ? t.t === 'wild' && !t.rare : t.t === kind; });
    if (!hit) return null;
    const p = prevOf(D, hit); return p ? jump(p, 1) && hit : null;
  }
  function panel() {
    const old = document.getElementById('qaj'); if (old) { old.remove(); return; }
    const S = G('S'), m = S && S.m; if (!m || !m.raise || !m.raise.field) return;
    const D = WD(m).dataOf(m), has = (id) => !!D.nodes[id];
    const d = document.createElement('div'); d.id = 'qaj'; d.className = 'qaj';
    d.innerHTML = `<div class="qaj-w"><header>QA：移動（Chapter ${m.raise.ch}・ルート ${esc((m.raise.field.route) || 'A')}）<button type="button" data-x="close">✕</button></header>
      <section><h4>主な地点（「手前」＝1つ前へ・次の出目 1）</h4><div class="qaj-g">${POINTS.filter((p) => has(p[0])).map(([id, l, pre]) => `<button type="button" data-j="${id}">${esc(l)}</button>${pre ? `<button type="button" data-p="${id}" class="pre">${esc(l)}の手前</button>` : ''}`).join('')}</div></section>
      <section><h4>寄り道の入口</h4><div class="qaj-g">${SPURS.filter((p) => has(p[0])).map(([id, l]) => `<button type="button" data-j="${id}">${esc(l)}</button>`).join('')}</div></section>
      <section><h4>マスの手前（次の出目 1）</h4><div class="qaj-g">${[['wild', '野生バトル'], ['rare', 'レアバトル'], ['event', '出来事'], ['stat', '能力マス'], ['treasure', '宝箱'], ['rest', '食事']].map(([k, l]) => `<button type="button" data-k="${k}">${l}</button>`).join('')}</div></section>
      <section><h4>次の出目</h4><div class="qaj-g">${[0, 1, 2, 3, 4, 5, 6].map((n) => `<button type="button" data-d="${n}"${(KEEP || 0) === n ? ' class="on"' : ''}>${n ? n : 'ふつう'}</button>`).join('')}</div></section>
      <section><div class="qaj-g"><button type="button" data-x="fat">空腹を 0</button><button type="button" data-x="turn">ターンを 0</button></div><small>試遊は保存しません（セーブは変わりません）</small></section></div>`;
    d.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return; e.stopPropagation();
      const dt = b.dataset;
      if (dt.x === 'close') { d.remove(); return; }
      if (dt.j) { d.remove(); jump(dt.j); return; }
      if (dt.p) { const p = prevOf(D, dt.p); d.remove(); if (p) jump(p, 1); return; }
      if (dt.k) { d.remove(); if (!before(dt.k)) note('その種類のマスは残っていません'); return; }
      if (dt.d != null) { KEEP = +dt.d || null; root.MM_QA_DIE = KEEP; d.querySelectorAll('[data-d]').forEach((x) => x.classList.toggle('on', x === b)); return; }
      if (dt.x === 'fat') { m.raise.fatigue = 0; d.remove(); try { root.MMWB.release(); } catch (er) {} G('board')(); return; }
      if (dt.x === 'turn') { m.raise.turnsUsed = 0; m.raise.field.core.turn = 0; d.remove(); try { root.MMWB.release(); } catch (er) {} G('board')(); return; }
    });
    document.body.appendChild(d);
  }
  function note(t) { const n = document.createElement('div'); n.className = 'qaj-n'; n.textContent = t; document.body.appendChild(n); setTimeout(() => n.remove(), 1800); }
  function button() {
    if (document.getElementById('qajb')) return;
    const b = document.createElement('button'); b.type = 'button'; b.id = 'qajb'; b.className = 'qajb'; b.textContent = 'QA移動'; b.addEventListener('click', (e) => { e.stopPropagation(); panel(); });
    const s = document.createElement('style'); s.textContent = `.qajb{position:fixed;left:6px;top:calc(env(safe-area-inset-top,0px) + 132px);z-index:851;padding:5px 8px;border-radius:9px;border:1px solid #f3c55a;background:rgba(8,22,44,.82);color:#ffe7a8;font:700 11px/1 "Noto Sans JP",sans-serif}
.qaj{position:fixed;inset:0;z-index:2000;background:rgba(4,10,24,.55);display:flex;align-items:flex-start;justify-content:center;padding:calc(env(safe-area-inset-top,0px) + 10px) 8px 8px;overflow:auto}
.qaj-w{width:min(100%,420px);background:#0d1c3a;border:1px solid #f3c55a;border-radius:12px;color:#eef3ff;font:500 12px/1.4 "Noto Sans JP",sans-serif;padding:8px 10px 10px}
.qaj header{display:flex;justify-content:space-between;align-items:center;font-weight:800;color:#ffe7a8;margin-bottom:4px}.qaj header button{background:none;border:0;color:#fff;font-size:16px}
.qaj h4{margin:8px 0 4px;font-size:11px;color:#b8cbe8}.qaj-g{display:flex;flex-wrap:wrap;gap:4px}
.qaj-g button{padding:5px 7px;border-radius:7px;border:1px solid rgba(255,255,255,.35);background:#1b3260;color:#fff;font:600 11px/1.2 "Noto Sans JP",sans-serif}.qaj-g button.pre{background:#3a2a10;border-color:#d9a548}.qaj-g button.on{background:#f3c55a;color:#13233a}
.qaj small{display:block;margin-top:8px;opacity:.75}.qaj-n{position:fixed;left:50%;top:40%;transform:translateX(-50%);z-index:2100;background:#0d1c3a;color:#fff;border:1px solid #f3c55a;border-radius:9px;padding:8px 12px;font:600 12px "Noto Sans JP",sans-serif}`;
    document.head.appendChild(s); document.body.appendChild(b);
  }
  // 毎回同じ出目：使われたら入れ直す（raising.js は1回使うと消す）
  if (ON) setInterval(() => { if (KEEP && root.MM_QA_DIE == null) root.MM_QA_DIE = KEEP; const m = (G('S') || {}).m; const onB = !!(root.MMWB && m && root.MMWB.active && root.MMWB.active(m)); const b = document.getElementById('qajb'); if (onB && !b) button(); else if (!onB && b) b.remove(); }, 400);
  root.MMQAJ = Object.freeze({ on: ON, jump, before, panel, prevOf });
})(typeof window !== 'undefined' ? window : globalThis);
