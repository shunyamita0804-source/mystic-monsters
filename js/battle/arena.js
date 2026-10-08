// =========================================================
// 正式バトル画面（2026-10-07）`MMARENA`：ランク別の会場の背景・待機立ち絵・HUD の見た目・擬似3D 半楕円の横型技ルーレット。
//  fight()・battle-bridge・adapter・Battle Engine・旧ルーレットの処理（spin／drawList）・index.html の .bt 系 CSS（Phase 6）は変えない。
//  #bt が出たら外から重ねるだけ（fit.js・fx.js と同じ方式）：
//   ・背景：上の帯の「ランクX大会」（fight() の lb）から E〜S を読み、assets/battle/arena/ のそのランクの絵（arena_ ＋ランク）を .bgs の上に敷く（修行・読めないときは従来のまま）
//   ・立ち絵：.mon に静止の絵（IMG[sp]）があるあいだだけ、待機立ち絵（assets/battle/idle/）を重ねる。技のコマ（SFR・poseSeq）が出ている間は従来の絵。
//     向き：プレイヤー（左）は右向き・相手（右）は左向き（FACE＝素材の元の向き）
//   ・ルーレット：fight() が作る旧ルーレット（#rl の行・.on／.hit）を見て、同じ7候補（6技＋MISS）を半楕円の横型ルーレットに映す。
//     旧ルーレットは見えなくするだけ（処理・結果・重み・STOP の判定は従来どおり）。STOP は旧ボタン（#go）を透明にして正式の STOP の絵の上に重ねる＝押す所・押せない状態は従来のまま。
//     動き：起動 → 短い加速 → 一定の速さで巡航（旧ルーレットの光の移動を連続の位置に直して LAG 枚ぶん後ろを映す）→ STOP（結果は fight() が確定）→
//     慣性で減速 → ごく小さな行き過ぎ → 中央へ吸着 → 中央の板を一瞬強調。結果の技は旧ルーレットと同じ（見た目だけ）
// =========================================================
(function (root) {
  'use strict';
  const A = './assets/battle/';
  const IDLE = { 0: 'idle_soramo', 1: 'idle_gauru', 2: 'idle_nobiton', 3: 'idle_jiol', 4: 'idle_regnas' };
  const FACE = { 0: 'R', 1: 'R', 2: 'R', 3: 'R', 4: 'R' };   // 待機立ち絵の元の向き（5体とも右向き）
  const RANKS = 'EDCBAS';
  /** ルーレットの見た目（中央を 0 とした |d| ごとの値。間は直線補間） */
  const R = Object.freeze({
    slots: 7, lag: 1.5, accelMs: 350, stopMs: 500, overshootPx: 6, lockMs: 280, spacing: 0.235,   // 2026-10-07 ADDENDUM2：起動の加速 約0.35秒・STOP 後の慣性の減速 約0.5秒・行き過ぎ 約6px（そこから中央へ吸着）。巡航の速さは fight() の光の速さ（BASE_STEP_MS 85ms／枠＝約11.8候補／秒・Phase 6）に合わせる＝STOP の時刻と結果の関係を変えない   // spacing＝板の間隔（ルーレットの幅に対する割合）
    scale: [1.15, 0.92, 0.78, 0.64], rot: [0, 10, 19, 26], drop: [0, 0.10, 0.27, 0.46], dim: [1, 0.96, 0.82, 0.62], // drop＝下げる量（板の高さに対する割合）
  });
  const $ = (s, el) => (el || document).querySelector(s);
  const lerpTab = (tab, x) => { const i = Math.min(tab.length - 2, Math.floor(x)); const t = Math.min(1, x - i); return tab[i] + (tab[i + 1] - tab[i]) * t; };
  const now = () => performance.now();
  const reduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  const G = (name) => { try { return (0, eval)(name); } catch (e) { return undefined; } };

  /** 上の帯の文字（「ランクX大会」）から会場のランク（E〜S）。読めなければ null */
  function rankOf(bt) { if (bt && bt.dataset && /^[EDCBAS]$/.test(bt.dataset.mmrank || '')) return bt.dataset.mmrank;   // 2026-10-08 監査 M-06：練習試合は帯を「野生のモンスター」などにするので、会場のランクは index.html の battleDressDom が入れる
    const t = (($('.tm small', bt) || {}).textContent || ''); const m = /ランク([EDCBAS])大会/.exec(t); return m ? m[1] : null; }
  const arenaSrc = (r) => (r && RANKS.includes(r) ? `./assets/tournament/venues/venue_${r}.webp` : null);   // 2026-10-07 追補便：正式の大会会場 venue_E〜S（旧 arena_E〜S はファイルだけ残す）
  const idleSrc = (sp) => (IDLE[sp] ? `${A}idle/${IDLE[sp]}.webp` : null);
  /** 立ち絵を左右反転するか（プレイヤー＝右向き・相手＝左向き） */
  const flipOf = (side, sp) => (FACE[sp] === 'L') === (side === 0);

  function style() {
    if (document.getElementById('mma-style')) return;
    const st = document.createElement('style'); st.id = 'mma-style';
    st.textContent = [
      '#bt .mma-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 30%;z-index:0}',
      '#bt .bgs.mma-on::after{background:linear-gradient(rgba(6,10,26,.15),transparent 18%,transparent 52%,rgba(6,10,26,.55) 74%,rgba(4,7,18,.9))}',
      '#bt .mon.mma-on>img:not(.mma-idle){opacity:0}',
      '#bt .mon .mma-idle{position:absolute;left:50%;bottom:0;height:118%;width:auto;max-width:none;transform:translateX(-50%);pointer-events:none;filter:drop-shadow(0 8px 6px rgba(0,0,0,.45))}',
      '#bt .mon .mma-idle.fl{transform:translateX(-50%) scaleX(-1)}',
      '#bt .mon:not(.mma-on) .mma-idle{display:none}',
      // HUD（名前・HP）：濃紺＋細い金の縁
      '#bt .hpn{background:linear-gradient(rgba(10,18,44,.92),rgba(6,12,32,.9));border:1.5px solid rgba(214,178,98,.85);border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,.45)}',
      // ADDENDUM2：HUD に顔アイコンを常設しない・ライフゲージを約1.3倍の太さ・長い名前でも HUD の幅を広げない
      '#bt .hpn .pti{display:none}',
      '#bt .hpr .hpn{flex:1 1 0;min-width:0;max-width:50%;padding:6px 10px}',
      '#bt .hpn .bar{height:12px}',
      // ルーレット
      '#bt .mmr{position:relative;width:100%;height:var(--mmr-h);flex:none;pointer-events:none;overflow:hidden;-webkit-mask:linear-gradient(90deg,transparent,#000 9%,#000 91%,transparent);mask:linear-gradient(90deg,transparent,#000 9%,#000 91%,transparent)}',
      '#bt .mmr .arch{position:absolute;left:50%;width:118%;top:63%;transform:translateX(-50%);opacity:.95}',
      '#bt .mmr .rail{position:absolute;left:50%;width:108%;top:80%;transform:translateX(-50%);opacity:.9;pointer-events:none}',   // ADDENDUM2：レールの土台（透過 RGBA の正式補助素材）
      '#bt .mmr .trk{position:absolute;inset:0;perspective:700px}',
      '#bt .mmr .pl{position:absolute;left:50%;top:6%;width:var(--mmr-pw);aspect-ratio:229/360;margin-left:calc(var(--mmr-pw)/-2);transform-origin:50% 60%;will-change:transform,opacity}',
      '#bt .mmr .pl img.bgp{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}',
      '#bt .mmr .pl .sel{opacity:0}',
      '#bt .mmr .pl .ic{position:absolute;left:13.5%;right:12.5%;top:13.5%;height:51%;border-radius:6%;overflow:hidden;background:#0d1a38}',
      '#bt .mmr .pl .ic img{width:100%;height:100%;object-fit:cover;display:block}',
      '#bt .mmr .pl .nm{position:absolute;left:8%;right:8%;top:69%;height:14%;display:flex;align-items:center;justify-content:center;text-align:center;color:#f3ecd9;font:800 clamp(9px,2.6vw,12px)/1.1 "Noto Sans JP",sans-serif;text-shadow:0 1px 2px #000;letter-spacing:.02em}',
      '#bt .mmr .pl.ms .ic,#bt .mmr .pl.ms .nm{display:none}',
      '#bt .mmr .pl .st{position:absolute;left:19%;right:15%;top:65%;height:20%;display:flex;flex-direction:column;justify-content:space-around;opacity:0;color:#f3ecd9;font:700 clamp(6px,1.85vw,9px)/1.05 "Noto Sans JP",sans-serif}',
      '#bt .mmr .pl .st div{display:flex;justify-content:space-between}#bt .mmr .pl .st b{color:#ffe7a8;font-size:1.12em}',
      '#bt .mmr .fr{position:absolute;left:50%;top:1%;width:calc(var(--mmr-pw)*1.3);margin-left:calc(var(--mmr-pw)*-0.65);aspect-ratio:400/560;z-index:60;pointer-events:none}',
      '#bt .mmr.lock .pl.c{animation:mmrlock .3s ease-out}@keyframes mmrlock{40%{filter:brightness(1.35)}}',
      '#bt .bui.mmr-on .mmr{transition:opacity .25s,transform .25s}#bt .bui.anim .mmr{opacity:.35;transform:translateY(14px)}',
      '#bt .gow .mma-stop{position:absolute;left:50%;bottom:6px;width:var(--mms-w);transform:translateX(-50%);pointer-events:none;z-index:1;transition:opacity .2s}',
      '#bt .gow .mma-stop.off{opacity:.45}',
    ].join('\n');
    document.head.appendChild(st);
  }

  // ---- 背景 ----
  function setupBg(bt) {
    const src = arenaSrc(rankOf(bt)), bgs = $('.bgs', bt);
    if (!src || !bgs || $('.mma-bg', bgs)) return;
    const im = new Image(); im.className = 'mma-bg'; im.alt = ''; im.decoding = 'async'; im.src = src;
    bgs.appendChild(im); bgs.classList.add('mma-on');
  }

  // ---- 待機立ち絵 ----
  function setupIdle(bt) {
    const pl = G('BPL'), IMG = G('IMG');
    if (!pl) return;
    [0, 1].forEach((s) => {
      const mon = $(`#m${s} .mon`, bt), sp = pl[s] && pl[s].sp, src = idleSrc(sp);
      if (!mon || !src) return;
      const still = () => { const im = mon.querySelector(':scope>img:not(.mma-idle):not(.b2)'); return !!(im && IMG && im.getAttribute('src') === IMG[sp]); };
      const sync = () => {
        let idle = mon.querySelector('.mma-idle');
        if (still()) {
          if (!idle) { idle = new Image(); idle.className = 'mma-idle' + (flipOf(s, sp) ? ' fl' : ''); idle.alt = ''; idle.src = src; mon.appendChild(idle); }
          mon.classList.add('mma-on');
        } else mon.classList.remove('mma-on');
      };
      sync();
      new MutationObserver(sync).observe(mon, { childList: true });
    });
  }

  // ---- ルーレット ----
  function setupRoulette(bt) {
    const rl = $('#rl', bt), bui = $('.bui', bt), gow = $('.gow', bt), go = $('#go', bt);
    if (!rl || !bui || !gow || !go || $('.mmr', bui)) return;
    style();
    const W = Math.min(bt.clientWidth || innerWidth, 480);
    const pw = Math.round(Math.min(W * 0.2, 104));
    const box = document.createElement('div'); box.className = 'mmr'; box.setAttribute('aria-hidden', 'true');
    box.style.setProperty('--mmr-pw', pw + 'px'); box.style.setProperty('--mmr-h', Math.round(pw * 360 / 229 * 1.16 + 28) + 'px');
    box.innerHTML = `<img class="arch" src="${A}roulette/arch.webp" alt=""><img class="rail" src="${A}roulette/rail_base.png" alt=""><div class="trk"></div><img class="fr" src="${A}roulette/center_frame.webp" alt="">`;
    rl.style.display = 'none';
    bui.insertBefore(box, rl);
    bui.classList.add('mmr-on');
    // STOP：旧ボタンを透明にして、正式の絵の上に重ねる（押す所・押せない状態は従来のまま）
    const sw = Math.round(Math.min(W * 0.62, 270));
    gow.style.setProperty('--mms-w', sw + 'px');
    [...gow.children].forEach((c) => { if (c !== go) c.style.visibility = 'hidden'; });
    const stopImg = new Image(); stopImg.className = 'mma-stop'; stopImg.alt = ''; stopImg.src = `${A}roulette/stop.webp`; gow.appendChild(stopImg);
    const sh = Math.round(sw * 268 / 720);
    const goSync = () => {
      const back = go.classList.contains('bk');
      if (back) { go.style.opacity = ''; go.style.width = ''; go.style.height = ''; go.style.borderRadius = ''; go.style.marginBottom = ''; stopImg.style.display = 'none'; box.style.visibility = 'hidden'; return; }
      go.style.opacity = '0'; go.style.width = sw + 'px'; go.style.height = sh + 'px'; go.style.borderRadius = '999px'; go.style.marginBottom = '6px';
      stopImg.style.display = ''; stopImg.classList.toggle('off', !!go.disabled);
    };
    goSync();
    new MutationObserver(goSync).observe(go, { attributes: true, attributeFilter: ['class', 'disabled'] });
    const trk = $('.trk', box);
    const S = { plates: [], n: 0, cur: -1, tn: 0, dt: 120, p: 0, vis: 0, mode: 'idle', stop: null, len: 7 };
    const read = (row) => {
      const ms = row.classList.contains('ms'), img = row.querySelector('img.rt'), nm = (row.querySelector('.rn') || {}).textContent || '';
      const vals = [...row.querySelectorAll('.rst b')].map((b) => b.textContent);
      return { ms, src: img ? img.getAttribute('src') : '', nm, vals };
    };
    function build() {
      const rows = [...rl.querySelectorAll('.rw')];
      S.len = rows.length || 7;
      trk.innerHTML = rows.map((row) => {
        const d = read(row);
        return `<div class="pl${d.ms ? ' ms' : ''}"><img class="bgp nor" src="${A}roulette/${d.ms ? 'plate_miss' : 'plate_normal'}.webp" alt="">${d.ms ? '' : `<img class="bgp sel" src="${A}roulette/plate_selected.webp" alt="">`}`
          + (d.ms ? '' : `<div class="ic">${d.src ? `<img src="${d.src}" alt="">` : ''}</div><div class="nm"></div><div class="st"><div>威力<b></b></div><div>命中率<b></b></div><div>クリ率<b></b></div></div>`) + '</div>';
      }).join('');
      S.plates = [...trk.children];
      rows.forEach((row, i) => {
        const d = read(row), el = S.plates[i]; if (d.ms) return;
        el.querySelector('.nm').textContent = d.nm;
        el.querySelectorAll('.st b').forEach((b, j) => { b.textContent = d.vals[j] || ''; });
      });
      const on = rows.findIndex((r) => r.classList.contains('on'));
      S.cur = on >= 0 ? on : 0; S.n = S.cur; S.tn = now(); S.mode = 'spin'; S.stop = null;
      S.p = S.vis = S.n - R.lag; S.v0 = 0; S.start = now();
      box.classList.remove('lock');
    }
    function onRows() {
      const rows = [...rl.querySelectorAll('.rw')];
      const hit = rows.findIndex((r) => r.classList.contains('hit')), on = rows.findIndex((r) => r.classList.contains('on'));
      if (on >= 0 && on !== S.cur && S.mode === 'spin') {
        let step = (on - S.cur + S.len) % S.len; if (step === 0) step = S.len;
        const t = now(); S.dt = Math.max(40, Math.min(400, (t - S.tn) / Math.max(1, step))); S.tn = t; S.n += step; S.cur = on;
      }
      if (hit >= 0 && S.mode === 'spin') {
        if (hit !== S.cur) { let step = (hit - S.cur + S.len) % S.len; S.n += step; S.cur = hit; }
        let dist = S.n - S.vis; while (dist < 0.4) { S.n += S.len; dist += S.len; }
        S.mode = 'stop'; S.stop = { from: S.vis, to: S.n, t0: now(), ms: reduced() ? 160 : R.stopMs };
      }
    }
    new MutationObserver((ms) => {
      if (ms.some((m) => m.type === 'childList' && m.target === rl)) build();
      onRows();
    }).observe(rl, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    if (rl.querySelector('.rw')) build();
    function layout(pos) {
      const L = S.len, H = (S.plates[0] && S.plates[0].offsetHeight) || pw * 360 / 229;
      S.plates.forEach((el, i) => {
        let d = ((i - pos) % L + L) % L; if (d > L / 2) d -= L;
        const a = Math.abs(d), sc = lerpTab(R.scale, a), rot = Math.sign(d) * lerpTab(R.rot, a), drop = lerpTab(R.drop, a) * H, dim = lerpTab(R.dim, a);
        const x = d * R.spacing * W * (1 - 0.08 * Math.min(a, 3));
        el.style.transform = `translate3d(${x.toFixed(1)}px,${drop.toFixed(1)}px,0) rotateY(${(-rot).toFixed(1)}deg) scale(${sc.toFixed(3)})`;
        el.style.zIndex = String(50 - Math.round(a * 10));
        el.style.opacity = String(a > 3.2 ? Math.max(0, 1 - (a - 3.2) * 3) : 1);
        el.style.filter = dim < 0.999 ? `brightness(${dim.toFixed(2)})` : '';
        const sel = el.querySelector('.sel'), st = el.querySelector('.st'), nm = el.querySelector('.nm'), k = Math.max(0, 1 - a * 2.2);
        if (sel) sel.style.opacity = k.toFixed(2);
        if (st) st.style.opacity = k > 0.6 ? ((k - 0.6) / 0.4).toFixed(2) : '0';
        // 中央（選択中の板）へ近づくほど、技の絵・名前を選択中の板の窓の位置へ（間は補間）
        const ic = el.querySelector('.ic'), f = (u, v) => (u + (v - u) * k).toFixed(2) + '%';
        if (ic) { ic.style.left = f(13.5, 18.5); ic.style.right = f(12.5, 13); ic.style.top = f(13.5, 18.5); ic.style.height = f(51, 34.5); }
        if (nm) { nm.style.top = f(69, 55.8); nm.style.height = f(14, 7.2); }
        el.classList.toggle('c', a < 0.5);
      });
    }
    const easeOut = (t) => 1 - Math.pow(1 - t, 3);
    function frame() {
      if (!document.body.contains(box)) return;
      const t = now();
      if (S.mode === 'spin') {
        const target = S.n + Math.min(1, (t - S.tn) / S.dt) - R.lag;
        const ramp = Math.min(1, (t - S.start) / R.accelMs);   // 起動：なめらかな加速
        S.vis += (target - S.vis) * Math.min(1, 0.35 * (0.3 + 0.7 * ramp));
      } else if (S.mode === 'stop' && S.stop) {
        const q = Math.min(1, (t - S.stop.t0) / S.stop.ms), d = S.stop.to - S.stop.from;
        const os = R.overshootPx / Math.max(1, R.spacing * W);   // 慣性で減速 → ごく小さな行き過ぎ（px を候補の単位へ）→ 吸着
        const v = q < 0.82 ? easeOut(q / 0.82) * (1 + os / Math.max(0.5, d)) : 1 + (os / Math.max(0.5, d)) * (1 - easeOut((q - 0.82) / 0.18));
        S.vis = S.stop.from + d * v;
        if (q >= 1) { S.vis = S.stop.to; S.mode = 'locked'; box.classList.add('lock'); }
      }
      layout(S.vis);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    root.MMARENA_LAST = S;   // テスト用（今のルーレットの状態）
  }

  function setup(bt) {
    style();
    try { setupBg(bt); } catch (e) { /* 見た目だけ */ }
    try { setupIdle(bt); } catch (e) { /* 見た目だけ */ }
    try { setupRoulette(bt); } catch (e) { /* 見た目だけ */ }
  }
  function watch() {
    if (typeof MutationObserver === 'undefined' || !document.body) return;
    new MutationObserver((muts) => { for (const mu of muts) for (const n of mu.addedNodes) if (n && n.id === 'bt') setup(n); }).observe(document.body, { childList: true });
  }
  if (typeof document !== 'undefined') { if (document.body) watch(); else document.addEventListener('DOMContentLoaded', watch); }
  root.MMARENA = Object.freeze({ R, IDLE, FACE, rankOf, arenaSrc, idleSrc, flipOf, setup, faceSrc: (sp) => (IDLE[sp] ? `./assets/tournament/faces/face_${IDLE[sp].slice(5)}.webp` : null) });
})(typeof window !== 'undefined' ? window : globalThis);
