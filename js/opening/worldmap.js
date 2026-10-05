// =========================================================
// 世界地図（window.MMMAP。2026-10-05）：正式の世界地図（assets/worldmap/world_map.webp。地方名・ミストリアの名前は絵に描かれている）の上に、
//  地名の印（光点・リング・ラベル）を HTML で重ねる（地図の画像には焼き込まない）。
//  open()＝序盤の会話で使う地図（カメラを focus(key) で動かす。閉じるまで操作は会話だけ）、viewer()＝聖獣士管理局の「世界地図」（ドラッグ・拡大縮小・閉じる）。
//  位置は地図の画像に対する割合（x, y）。フェルナ地方・アステリア地方・ミストリアは絵から読んだ位置、リベルナ（アステリア地方西部の地方都市）は絵に描かれていない＝【暫定】の位置
// =========================================================
(function (root) {
  'use strict';
  const fz = Object.freeze;
  const MAP = fz({ src: './assets/worldmap/world_map.webp', w: 1448, h: 1086 });
  //  2026-10-06：序盤の会話の地図は世界の全体が見える倍率のまま（z 1＝画面の幅いっぱい。旧 2.0〜3.0 は寄りすぎて世界のどこか分からなかった）。案内している地点だけを光（地方）・光点とリング（町）でやわらかく脈打たせる
  /** 地点：kind＝region（地方をやわらかく光らせる。名前は絵の文字）／city（光点・リング・ラベル）／here（現在地＝リングと「現在地」の札。名前は絵の文字） */
  const SPOTS = fz({
    world: fz({ x: 0.5, y: 0.5, z: 1 }),
    ferna: fz({ x: 0.19, y: 0.27, z: 1, kind: 'region', rx: 0.17, ry: 0.2, label: 'フェルナ地方' }),
    asteria: fz({ x: 0.77, y: 0.25, z: 1, kind: 'region', rx: 0.2, ry: 0.2, label: 'アステリア地方' }),
    liberna: fz({ x: 0.665, y: 0.3, z: 1, kind: 'city', label: 'リベルナ', note: '出身地' }),   // 【暫定】アステリア地方の西部（絵に町の名前は無い＝ここだけ UI のラベル）
    mistoria: fz({ x: 0.832, y: 0.252, z: 1, kind: 'here', label: 'ミストリア', note: '現在地' }),
  });
  const calm = () => !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
  let cur = null;
  function markerHtml(key, sp, hidden) {
    const st = `left:${(sp.x * 100).toFixed(2)}%;top:${(sp.y * 100).toFixed(2)}%`;
    if (sp.kind === 'region') return `<i class="wm-reg${hidden ? '' : ' on'}" data-spot="${key}" style="${st};width:${(sp.rx * 200).toFixed(1)}%;height:${(sp.ry * 200 * MAP.w / MAP.h).toFixed(1)}%" aria-hidden="true"></i>`;
    return `<span class="wm-pin k-${sp.kind}${hidden ? '' : ' on'}" data-spot="${key}" style="${st}"><i class="wm-ring"></i><i class="wm-dot"></i>${sp.kind === 'city' ? `<b class="wm-lb">${sp.label}</b>` : ''}${sp.note ? `<em class="wm-note">${sp.note}</em>` : ''}</span>`;
  }
  function build(cls, inner) {
    const ov = document.createElement('div'); ov.className = `wmap ${cls}`; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', '世界地図');
    ov.innerHTML = `<div class="wm-view"><div class="wm-cam"><img class="wm-img" src="${MAP.src}" alt="世界地図" draggable="false" decoding="async">${Object.entries(SPOTS).filter(([, s]) => s.kind).map(([k, s]) => markerHtml(k, s, true)).join('')}</div></div>${inner || ''}`;
    document.body.appendChild(ov); return ov;
  }
  /** カメラ：地図の点 (x, y) を画面の (cx, cy) に、倍率 z（画面の幅いっぱい＝1）で */
  function place(ov, x, y, z, instant) {
    const v = ov.querySelector('.wm-view'), cam = ov.querySelector('.wm-cam'); if (!v || !cam) return;
    const W = v.clientWidth || 390, H = v.clientHeight || 844, k = (W / MAP.w) * z, guide = ov.classList.contains('guide');
    // 見せる範囲：序盤の会話では下の会話窓の上（約 210px を除く）、管理局の地図では上の見出しの下。地図がその範囲より大きければ外の暗い所を見せない（端で止める）・小さければ真ん中に
    const top = guide ? 0 : 58, avail = Math.max(120, (guide ? H - 210 : H) - top), mw = MAP.w * k, mh = MAP.h * k;
    let tx = W / 2 - x * mw, ty = top + avail / 2 - y * mh;
    tx = mw <= W ? (W - mw) / 2 : Math.min(0, Math.max(W - mw, tx));
    ty = mh <= avail ? top + (avail - mh) / 2 : Math.min(top, Math.max(top + avail - mh, ty));
    cam.style.transition = instant || calm() ? 'none' : '';
    cam.style.width = MAP.w + 'px'; cam.style.height = MAP.h + 'px';
    cam.style.transform = `translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) scale(${k.toFixed(4)})`; cam.style.setProperty('--inv', (1 / k).toFixed(4));
    ov.__cam = { x, y, z };
  }
  /** 序盤の会話で使う地図を開く（世界の全体から）。返り値：{ focus(key, keep), show(key), close() } */
  function open() {
    if (cur) cur.close();
    const ov = build('guide'); place(ov, 0.5, 0.5, 1, true);
    requestAnimationFrame(() => ov.classList.add('in'));
    const api = {
      el: ov,
      /** 地点へ寄る（keep＝前の印を消さない）。地方は光、町は光点とリングとラベル */
      focus(key, keep) { const sp = SPOTS[key]; if (!sp || !ov.isConnected) return; if (!keep) ov.querySelectorAll('.wm-reg.on,.wm-pin.on').forEach((e) => e.classList.remove('on')); const m = ov.querySelector(`[data-spot="${key}"]`); if (m) m.classList.add('on'); place(ov, sp.x, sp.y, sp.z); ov.dataset.focus = key; },
      show(key) { const m = ov.querySelector(`[data-spot="${key}"]`); if (m) m.classList.add('on'); },
      world() { ov.querySelectorAll('.wm-reg.on,.wm-pin.on').forEach((e) => e.classList.remove('on')); place(ov, 0.5, 0.5, 1); ov.dataset.focus = 'world'; },
      close() { if (cur === api) cur = null; if (!ov.isConnected) return Promise.resolve(); ov.classList.remove('in'); return new Promise((r) => setTimeout(() => { ov.remove(); r(); }, calm() ? 0 : 320)); },
    };
    cur = api; return api;
  }
  /**
   * 聖獣士管理局の「世界地図」：全体を見て、ドラッグで動かす・＋／−で拡大縮小・× で閉じる。出身地（リベルナ）と現在地（ミストリア）の印。
   *  opts.origin＝出身地の印を出すか（序盤の会話を終えていれば true）
   */
  function viewer(opts = {}) {
    if (cur) cur.close();
    const ov = build('view', `<header class="wm-hd"><b>世界地図</b><button class="wm-x" type="button" aria-label="閉じる">×</button></header><div class="wm-zoom"><button type="button" class="wm-zi" aria-label="拡大">＋</button><button type="button" class="wm-zo" aria-label="縮小">−</button></div>`);
    ov.querySelectorAll('.wm-pin[data-spot="mistoria"]' + (opts.origin ? ',.wm-pin[data-spot="liberna"]' : '')).forEach((e) => e.classList.add('on'));
    // 2026-10-05 試遊：出身地（リベルナ）を光らせる・点滅させるのは序盤の案内（open）だけ。通常の地図では印と名前だけ（光の輪・発光なし）
    ov.querySelectorAll('.wm-pin[data-spot="liberna"]').forEach((e) => e.classList.add('still'));
    let st = { x: 0.5, y: 0.5, z: 1 };
    const apply = (instant) => { st.z = Math.max(1, Math.min(3.2, st.z)); st.x = Math.max(0, Math.min(1, st.x)); st.y = Math.max(0, Math.min(1, st.y)); place(ov, st.x, st.y, st.z, instant); };
    apply(true); requestAnimationFrame(() => ov.classList.add('in'));
    let drag = null;
    const view = ov.querySelector('.wm-view');
    view.addEventListener('pointerdown', (e) => { drag = { px: e.clientX, py: e.clientY, x: st.x, y: st.y }; try { view.setPointerCapture(e.pointerId); } catch (er) {} });
    view.addEventListener('pointermove', (e) => { if (!drag) return; const W = view.clientWidth || 390, k = (W / MAP.w) * st.z; st.x = drag.x - (e.clientX - drag.px) / (MAP.w * k); st.y = drag.y - (e.clientY - drag.py) / (MAP.h * k); apply(true); });
    const up = () => { drag = null; }; view.addEventListener('pointerup', up); view.addEventListener('pointercancel', up);
    ov.querySelector('.wm-zi').addEventListener('click', (e) => { e.stopPropagation(); st.z += 0.6; apply(); });
    ov.querySelector('.wm-zo').addEventListener('click', (e) => { e.stopPropagation(); st.z -= 0.6; apply(); });
    return new Promise((res) => {
      const close = () => { if (cur && cur.el === ov) cur = null; ov.classList.remove('in'); setTimeout(() => { ov.remove(); res(); }, calm() ? 0 : 300); };
      ov.querySelector('.wm-x').addEventListener('click', (e) => { e.stopPropagation(); close(); });
      cur = { el: ov, close };
    });
  }
  const isOpen = () => !!(cur && cur.el && cur.el.isConnected);
  root.MMMAP = fz({ MAP, SPOTS, open, viewer, isOpen });
})(typeof window !== 'undefined' ? window : globalThis);
