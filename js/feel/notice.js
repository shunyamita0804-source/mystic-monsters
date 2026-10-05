// =========================================================
// システム通知の帯（window.MMNOTE。2026-10-05 PHASE B・正式デザイン system_notification_banner_reference を HTML/CSS で再構成＝1枚の画像ではない）
//  NPC の会話（MMNPC）とは別の層。顔・名前は出さない。所持金・アイテムの入手・機能の解放・旧いセーブの救済（補填）・大会の報酬など「処理の結果」を知らせる。
//  見た目：濃紺の横長の帯・金の額・左に丸い金の印（G の硬貨／アイテムの正式アイコン／解放の星）・太い1行目＋小さな2行目。
//  show({ icon, img, title, sub, ms })：1つずつ順に出す（前の帯が消えてから次）。帯をタップすると早く消える。消えたら resolve
//   icon：'gold'（G の硬貨）／'item'（img＝アイテムの正式アイコン。無ければ袋の印）／'unlock'（星）／'reward'（硬貨） ms：表示の長さ（既定 2600ms）
//  タイマーは表示中の1本だけ（常駐しない）。自動テストで止めたいときは MMNOTE.flush()
// =========================================================
(function (root) {
  'use strict';
  const Q = []; let cur = null;
  const MS = 2600;
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const LOG = [];
  function layer() {
    let l = document.querySelector('.mmnote-layer');
    if (!l) { l = document.createElement('div'); l.className = 'mmnote-layer'; l.setAttribute('aria-live', 'polite'); document.body.appendChild(l); }
    return l;
  }
  function next() {
    if (cur || !Q.length || typeof document === 'undefined' || !document.body) return;
    const n = Q.shift(), el = document.createElement('div');
    const ic = n.img ? `<i class="mmnote-ic img"><img src="${esc(n.img)}" alt="" decoding="async"></i>` : `<i class="mmnote-ic ${esc(n.icon || 'gold')}" aria-hidden="true"></i>`;
    el.className = 'mmnote'; el.setAttribute('role', 'status');
    el.innerHTML = `${ic}<div class="mmnote-tx"><b>${esc(n.title)}</b>${n.sub ? `<small>${esc(n.sub)}</small>` : ''}</div><i class="mmnote-cn l" aria-hidden="true"></i><i class="mmnote-cn r" aria-hidden="true"></i>`;
    layer().appendChild(el);
    let done = false; const shownAt = Date.now();
    const close = () => { if (done) return; done = true; clearTimeout(tm); el.classList.add('out'); setTimeout(() => { el.remove(); cur = null; n.resolve(); next(); }, 220); };
    const tm = setTimeout(close, n.ms > 0 ? n.ms : MS);
    el.addEventListener('click', (e) => { e.stopPropagation(); if (Date.now() - shownAt > 350) close(); });
    cur = { el, close };
  }
  /** 帯を出す（順番待ち）。消えたら resolve */
  function show(o = {}) {
    LOG.push({ icon: o.img ? 'img' : (o.icon || 'gold'), title: String(o.title || ''), sub: o.sub ? String(o.sub) : '' });
    return new Promise((resolve) => { Q.push({ ...o, resolve }); next(); });
  }
  /** 出ている帯・順番待ちをすぐに片付ける（画面を作り直すとき・自動テスト） */
  function flush() { const q = Q.splice(0); if (cur) cur.close(); for (const n of q) n.resolve(); }
  root.MMNOTE = Object.freeze({ show, flush, MS, log: () => LOG.slice(), busy: () => !!cur || Q.length > 0 });
})(typeof window !== 'undefined' ? window : globalThis);
