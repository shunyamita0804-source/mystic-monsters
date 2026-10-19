// 2026-10-15：新しいパラメーター比較画面 `MMCMP`（ZIP「Mismon_CompareScreen_And_QA_Instructions_20261015」の A）。
//  見本＝01_CompareLayout_Reference.png（構図・色調・情報量の基準。画像としては貼らない）＝HTML/CSS で組み、実際のバトルのデータを出す。
//  上＝題字の札「パラメーター比較」と試合の種類／中＝左（自分）・右（相手）の肩上アップ（assets/monsters/compare_1015・右は CSS で左右反転して中央を向かせる）と小さな VS／
//  名前の札（あなた・相手）と固有スキルの名前だけ（説明の長文は出さない）／6能力の表（数値・正式6色のゲージ＝左右同じ尺度 999）／いちばん下に「対戦開始」。
//  使う所：公式ランク大会の対戦前（index.html の p9CompareScr）・野生／レア／ライバル（bBattleGo の重ね画面）。独立した VS の画面は出さない。
//  戦闘の計算・大会の進行・BGM の選曲は変えない（このファイルは見た目だけ）。
(function (root) {
  'use strict';
  const PORT = './assets/monsters/compare_1015/';
  // 種族の番号 → 肩上アップ（fx・fy＝顔の中心の位置＝絵の幅・高さに対する割合、k＝絵の高さ＝中の段の高さ × k）。6枚とも右向きの絵
  const PORTRAIT = Object.freeze({
    0: Object.freeze({ f: 'solamo', fx: 0.61, fy: 0.57, k: 1.08 }),
    1: Object.freeze({ f: 'gauru', fx: 0.70, fy: 0.44, k: 1.05 }),
    2: Object.freeze({ f: 'nobiton', fx: 0.58, fy: 0.30, k: 1.04 }),
    3: Object.freeze({ f: 'jiol', fx: 0.78, fy: 0.46, k: 1.04 }),
    4: Object.freeze({ f: 'regnas', fx: 0.68, fy: 0.40, k: 1.05 }),
    5: Object.freeze({ f: 'flurene', fx: 0.64, fy: 0.46, k: 1.04 }),
    6: Object.freeze({ f: 'razuck', fx: 0.70, fy: 0.36, k: 1.04 }),   // 2026-10-17：バトル待機の参考画像の上の部分（tools/razuck1017/derive_art.py）＝QA だけ
    7: Object.freeze({ f: 'kalshell', fx: 0.60, fy: 0.50, k: 1.04 }),
    8: Object.freeze({ f: 'myurol', fx: 0.677, fy: 0.412, k: 1.04 }),   // 2026-10-19：ミュロル＝専用の肩上アップは未納＝正式の待機絵（右向き）の顔の周りを切った代替（tools/myurol1019/derive_art.py・顔の位置＝derive_art.json の portraitFace）＝QA だけ   // 2026-10-18：カルシェル＝専用の肩上アップは未納＝正式の待機絵（右向き）の顔を中心に切った代替（tools/kalshell1018/derive_art.py）＝QA だけ
  });
  const KS = ['li', 'po', 'in', 'hi', 'ev', 'de'];
  const LAB = { li: 'ライフ', po: 'ちから', in: 'かしこさ', hi: '命中', ev: '回避', de: '丈夫さ' };
  const COLOR = { li: '#F2C14E', po: '#D9534F', in: '#5CB85C', hi: '#F06292', ev: '#7FD4E8', de: '#4C7BD9' };   // 正式6色（index.html の STAT_COLOR と同じ）
  const MAX = 999;   // 左右同じ尺度（2026-10-13 開発25 A：999 を 100%）
  // 能力の印（線画・金色）
  const IC = {
    li: '<path d="M12 20.5s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 7.5 2.5c0 5.4-7.5 10-7.5 10z"/>',
    po: '<path d="M7 11V7.5a1.5 1.5 0 0 1 3 0V10m0-3a1.5 1.5 0 0 1 3 0v3m0-2.2a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v3.5c0 3.8-2.6 6.5-6.5 6.5S7 17.5 7 14v-3a1.5 1.5 0 0 1 0 0z"/>',
    in: '<path d="M5 19c4-1 8.5-4.5 11-9.5L19 4c-3.5.8-7 3.2-9.5 6.6L5 19zm3.5-5.5 3 3"/>',
    hi: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/>',
    ev: '<path d="M12 3 5 6v5.5c0 4.2 3 7.7 7 9.5 4-1.8 7-5.3 7-9.5V6l-7-3z"/>',
    de: '<path d="m12 3 2.6 5.6 6 .7-4.4 4.1 1.2 6L12 16.4 6.6 19.4l1.2-6L3.4 9.3l6-.7L12 3z"/>',
  };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const w = (v) => +(Math.max(0, Math.min(MAX, +v || 0)) / MAX * 100).toFixed(2);
  const portraitOf = (sp) => PORTRAIT[sp] || null;
  /** 肩上アップの絵のパス（無い種族は null） */
  const src = (sp) => { const p = portraitOf(sp); return p ? PORT + p.f + '.webp' : null; };

  /** 固有スキルの名前だけ（説明の長文は出さない）。4＝ライバルの相棒・5＝登録のみの種族は MMP10M の別の表 */
  function skillName(sp) {
    const M = root.MMP10M; if (!M) return '';
    try {
      const k = M.skillText(sp); if (k) return k.name;
      const p = portraitOf(sp), r = sp === 4 && p && M.rivalMonster ? M.rivalMonster(p.f) : sp >= 5 && M.pendingSpecies ? M.pendingSpecies(sp) : null;   // 5〜＝登録のみの種族（フルーネ・ラズック・カルシェル・ミュロル）
      return r && r.uniqueSkill ? r.uniqueSkill.name : '';
    } catch (e) { return ''; }
  }

  function style() {
    if (document.getElementById('mmcmp-css')) return;
    const s = document.createElement('style'); s.id = 'mmcmp-css';
    s.textContent = [
      '.cmp2{position:relative;width:100%;height:100dvh;max-width:480px;margin:0 auto;overflow:hidden;display:flex;flex-direction:column;color:#fff3d6;background:#0b1636;font-family:"Noto Sans JP",sans-serif;padding-bottom:env(safe-area-inset-bottom,0)}',
      '#app>.cmp2.p9cmps{margin:-16px;width:auto;max-width:none;padding:0 0 env(safe-area-inset-bottom,0);gap:0;align-items:stretch;min-height:0}',   // 大会（#app の中）＝#app の余白 16px を打ち消して画面いっぱい
      '#cmp.cmpov{position:fixed;inset:0;z-index:880;background:#0b1636;display:flex;justify-content:center;opacity:0;transition:opacity .22s ease-out}#cmp.cmpov.in{opacity:1}#cmp.cmpov.out{opacity:0;transition:opacity .2s ease-in;pointer-events:none}',
      '.cmp2 .c2bg{position:absolute;inset:0;background:#0b1636 center/cover no-repeat}',
      '.cmp2 .c2bg::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,14,40,.18) 0%,rgba(8,14,40,0) 30%,rgba(8,14,40,.35) 55%,rgba(6,10,30,.88) 72%,rgba(6,10,30,.94) 100%)}',
      '.cmp2 .c2ttl{position:relative;z-index:4;margin:calc(env(safe-area-inset-top,0px) + 10px) auto 0;padding:8px 22px 9px;min-width:min(62%,calc(100% - 112px));max-width:calc(100% - 104px);box-sizing:border-box;text-align:center;background:linear-gradient(180deg,#1b2a5c,#0d1840);border:1.5px solid #d8b25a;border-radius:12px;box-shadow:inset 0 0 0 3px rgba(11,22,54,.9),inset 0 0 0 4px rgba(216,178,90,.55),0 4px 14px rgba(0,0,0,.45)}',
      '.cmp2 .c2ttl b{display:block;white-space:nowrap;font:700 clamp(18px,5.3vw,24px)/1.15 "Shippori Mincho",serif;letter-spacing:.12em;color:#fff3d6;text-shadow:0 1px 0 #000,0 0 10px rgba(255,214,120,.35)}',
      '.cmp2 .c2ttl small{display:block;margin-top:2px;font:600 11px/1.2 "Noto Sans JP",sans-serif;letter-spacing:.08em;color:#e8cf8c}',
      '.cmp2 .c2duo{position:relative;z-index:2;flex:1 1 auto;min-height:150px;margin-top:-6px}',
      '.cmp2 .c2side{position:absolute;top:0;bottom:0;width:calc(50% + 16px);overflow:hidden}',
      '.cmp2 .c2side.me{left:0;-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 30px),transparent);mask-image:linear-gradient(90deg,#000 calc(100% - 30px),transparent)}',
      '.cmp2 .c2side.op{right:0;-webkit-mask-image:linear-gradient(270deg,#000 calc(100% - 30px),transparent);mask-image:linear-gradient(270deg,#000 calc(100% - 30px),transparent)}',
      '.cmp2 .c2side img{position:absolute;max-width:none;display:block;pointer-events:none;user-select:none;-webkit-user-drag:none}',
      '.cmp2 .c2side.op img{transform:scaleX(-1)}',
      '.cmp2 .c2side img.alt{object-fit:contain}',
      '.cmp2 .c2glow{position:absolute;left:50%;top:6%;bottom:2%;width:3px;margin-left:-1.5px;background:linear-gradient(180deg,transparent,rgba(255,220,140,.75) 40%,rgba(255,240,200,.95) 70%,transparent);transform:skewX(-12deg);filter:drop-shadow(0 0 8px rgba(255,200,90,.9));z-index:3}',
      '.cmp2 .c2names{position:relative;z-index:5;display:grid;grid-template-columns:1fr 44px 1fr;align-items:center;gap:0 4px;padding:0 10px;margin-top:-26px}',
      '.cmp2 .c2n{position:relative;min-height:44px;padding:4px 10px 5px;border:1.5px solid #d8b25a;border-radius:10px;text-align:center;box-shadow:inset 0 0 0 2px rgba(0,0,0,.35),0 3px 10px rgba(0,0,0,.45)}',
      '.cmp2 .c2n.me{background:linear-gradient(180deg,#1d2f66,#0e1a44)}.cmp2 .c2n.op{background:linear-gradient(180deg,#5a1622,#320a12)}',
      '.cmp2 .c2n i{position:absolute;top:-9px;left:50%;transform:translateX(-50%);padding:1px 8px;border-radius:8px;font:700 9.5px/1.4 "Noto Sans JP",sans-serif;font-style:normal;letter-spacing:.06em;white-space:nowrap}',
      '.cmp2 .c2n.me i{background:#2f6fe0;color:#fff}.cmp2 .c2n.op i{background:#c23a3a;color:#fff}',
      '.cmp2 .c2n b{display:block;margin-top:3px;font:700 clamp(15px,4.4vw,19px)/1.15 "Shippori Mincho",serif;letter-spacing:.06em;color:#fff3d6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.cmp2 .c2n small{display:block;margin-top:1px;font:600 9.5px/1.25 "Noto Sans JP",sans-serif;color:#e8cf8c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.cmp2 .c2vs{justify-self:center;font:900 italic 30px/1 "Shippori Mincho",serif;color:#ffd77a;letter-spacing:-.02em;text-shadow:0 0 1px #6b3d00,0 2px 0 #8a5300,0 0 12px rgba(255,190,70,.85)}',
      '.cmp2 .c2tbl{position:relative;z-index:5;margin:8px 10px 0;padding:6px 8px;border:1.5px solid #d8b25a;border-radius:12px;background:linear-gradient(180deg,rgba(14,24,58,.94),rgba(8,14,38,.96));box-shadow:inset 0 0 0 3px rgba(0,0,0,.35),0 4px 14px rgba(0,0,0,.5)}',
      '.cmp2 .c2r{display:grid;grid-template-columns:2.4em 1fr minmax(84px,30%) 1fr 2.4em;align-items:center;gap:0 6px;height:var(--c2rh,31px)}',
      '.cmp2 .c2r+.c2r{border-top:1px solid rgba(216,178,90,.16)}',
      '.cmp2 .c2r>b{font:700 clamp(14px,4.2vw,18px)/1 "Shippori Mincho",serif;color:#fff3d6;font-variant-numeric:tabular-nums}',
      '.cmp2 .c2r>b.l{text-align:right}.cmp2 .c2r>b.r{text-align:left}',
      '.cmp2 .c2bar{position:relative;height:11px;border-radius:7px;background:#081028;box-shadow:inset 0 1px 2px rgba(0,0,0,.8),0 0 0 1px rgba(216,178,90,.25)}',
      '.cmp2 .c2bar i{position:absolute;top:1px;bottom:1px;border-radius:6px;background:linear-gradient(180deg,rgba(255,255,255,.35),rgba(255,255,255,0) 55%),var(--c)}',
      '.cmp2 .c2bar i{left:1px}',
      '.cmp2 .c2lab{display:flex;align-items:center;justify-content:center;gap:5px;height:calc(var(--c2rh,31px) - 6px);border-radius:7px;background:linear-gradient(180deg,#1a2858,#0f1a40);border:1px solid rgba(216,178,90,.45);font:700 12px/1 "Noto Sans JP",sans-serif;color:#fff3d6;white-space:nowrap}',
      '.cmp2 .c2lab svg{width:15px;height:15px;flex:none;fill:none;stroke:#e8c46a;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
      '.cmp2 .c2acts{position:relative;z-index:5;padding:10px 16px calc(12px + env(safe-area-inset-bottom,0px))}',
      '.cmp2 .c2go{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;height:clamp(52px,7.6dvh,62px);border:2px solid #fff0c0;border-radius:14px;background:linear-gradient(180deg,#fbe39a 0%,#e4b54f 48%,#c58d2a 100%);box-shadow:inset 0 0 0 3px rgba(150,95,20,.55),inset 0 2px 0 rgba(255,255,255,.7),0 5px 16px rgba(0,0,0,.55),0 0 18px rgba(255,200,90,.35);color:#3b2406;font:800 clamp(19px,5.6vw,24px)/1 "Shippori Mincho",serif;letter-spacing:.24em;cursor:pointer}',
      '.cmp2 .c2go::before,.cmp2 .c2go::after{content:"⚔";font-size:.8em;letter-spacing:0;opacity:.85}',
      '.cmp2 .c2go:disabled,.cmp2 .c2go[data-go]{filter:none;opacity:.85}',
      '@media (max-height:720px){.cmp2 .c2ttl{padding:6px 28px 6px;margin-top:calc(env(safe-area-inset-top,0px) + 6px)}.cmp2 .c2ttl b{font-size:19px}.cmp2 .c2names{margin-top:-20px}.cmp2 .c2n{min-height:40px}.cmp2 .c2r{--c2rh:27px}.cmp2 .c2tbl{margin-top:6px;padding:4px 8px}.cmp2 .c2acts{padding-top:8px}.cmp2 .c2go{height:50px}}',
      '@media (prefers-reduced-motion:no-preference){.cmp2 .c2side.me img{animation:c2inl .42s cubic-bezier(.2,.8,.3,1) both}.cmp2 .c2side.op img{animation:c2inr .42s cubic-bezier(.2,.8,.3,1) both}.cmp2 .c2vs{animation:c2vs .5s .28s cubic-bezier(.2,1.6,.4,1) both}}',
      '@keyframes c2inl{from{translate:-26px 0;opacity:0}to{translate:0 0;opacity:1}}@keyframes c2inr{from{translate:26px 0;opacity:0}to{translate:0 0;opacity:1}}@keyframes c2vs{from{scale:1.8;opacity:0}to{scale:1;opacity:1}}',
    ].join('\n');
    document.head.appendChild(s);
  }

  /**
   * 比較画面の HTML。o＝{ me:{ sp, name, stats:{li..de}, skill }, op:{…}, bg, sub, cls, go:{ onclick } , idle:{ me, op } }
   * stats は戦闘に入る実際の値を渡す（このファイルは計算しない）。skill は固有スキルの名前だけ（無ければ出さない）。
   */
  function html(o) {
    style();
    const side = (x, s) => {
      const p = src(x.sp), alt = !p && o.alt && o.alt[s];
      return `<div class="c2side ${s}" data-sp="${esc(x.sp)}">${p ? `<img class="c2img" src="${p}" alt="" decoding="async" data-sp="${esc(x.sp)}">` : alt ? `<img class="c2img alt" src="${esc(alt)}" alt="">` : ''}</div>`;
    };
    const plate = (x, s) => `<div class="c2n ${s}"><i>${s === 'me' ? 'あなた' : '相手'}</i><b>${esc(x.name)}</b>${x.skill ? `<small>スキル　${esc(x.skill)}</small>` : ''}</div>`;
    const rows = KS.map((k) => { const a = Math.max(0, (o.me.stats || {})[k] | 0), b = Math.max(0, (o.op.stats || {})[k] | 0);
      return `<div class="c2r" data-k="${k}"><b class="l">${a}</b><div class="c2bar l" style="--c:${COLOR[k]}"><i style="width:${w(a)}%"></i></div><span class="c2lab"><svg viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg>${LAB[k]}</span><div class="c2bar r" style="--c:${COLOR[k]}"><i style="width:${w(b)}%"></i></div><b class="r">${b}</b></div>`; }).join('');
    return `<div class="cmp2 ${o.cls || ''}"><div class="c2bg"${o.bg ? ` style="background-image:url(${esc(o.bg)})"` : ''}></div>`
      + `<header class="c2ttl"><b>パラメーター比較</b>${o.sub ? `<small>${esc(o.sub)}</small>` : ''}</header>`
      + `<div class="c2duo">${side(o.me, 'me')}${side(o.op, 'op')}<i class="c2glow"></i></div>`
      + `<div class="c2names">${plate(o.me, 'me')}<b class="c2vs" aria-label="VS">VS</b>${plate(o.op, 'op')}</div>`
      + `<div class="c2tbl" aria-label="能力の比較">${rows}</div>`
      + `<div class="c2acts"><button class="c2go ${(o.go && o.go.cls) || ''}" data-nsfx="1" ${o.go && o.go.onclick ? `onclick="${o.go.onclick}"` : ''} aria-label="対戦開始">対戦開始</button></div></div>`;
  }

  /** 肩上アップの大きさ・位置（中の段の大きさを測って決める）。顔の中心＝左は画面の 27%・右は 73%・中の段の 46% の高さ。絵は中の段の下まで届かせる */
  function fit(rootEl) {
    const el = rootEl && rootEl.querySelector ? rootEl : document;
    el.querySelectorAll('.cmp2').forEach((c) => {
      const duo = c.querySelector('.c2duo'); if (!duo) return;
      const W = duo.clientWidth, Hd = duo.clientHeight; if (!W || !Hd) return;
      c.querySelectorAll('.c2side').forEach((sd) => {
        const img = sd.querySelector('img.c2img'); if (!img) return;
        const me = sd.classList.contains('me'), sw = sd.clientWidth;
        if (img.classList.contains('alt')) { img.style.width = sw + 'px'; img.style.height = Hd + 'px'; img.style.left = '0px'; img.style.top = '0px'; return; }
        const p = portraitOf(+img.dataset.sp); if (!p) return;
        const H = Math.round(Math.min(Hd * p.k, W * 1.02));
        const fx = me ? p.fx : 1 - p.fx, tx = me ? W * 0.27 : W * 0.73;
        let left = tx - fx * H; if (!me) left -= (W - sw);   // 右の枠は画面の右端から sw の幅＝枠の左端は W − sw
        let top = Math.max(Hd * 0.46 - p.fy * H, Hd - H); top = Math.min(top, Hd * 0.1);
        img.style.width = H + 'px'; img.style.height = H + 'px'; img.style.left = Math.round(left) + 'px'; img.style.top = Math.round(top) + 'px';
      });
    });
  }
  let rzBound = false;
  function bindResize() { if (rzBound || typeof window === 'undefined') return; rzBound = true; window.addEventListener('resize', () => fit(document)); }

  /** 重ね画面（野生・レア・ライバル）：表示して「対戦開始」で resolve（押したら1回だけ）。返り値の close() で片付ける */
  function overlay(o) {
    style(); bindResize();
    const old = document.getElementById('cmp'); if (old) old.remove();
    const d = document.createElement('div'); d.id = 'cmp'; d.className = 'cmpov';
    d.innerHTML = html(Object.assign({}, o, { go: { cls: 'cmpgo' } }));
    document.body.appendChild(d);
    fit(d); d.querySelectorAll('img.c2img').forEach((i) => { if (!i.complete) i.addEventListener('load', () => fit(d), { once: true }); });
    requestAnimationFrame(() => d.classList.add('in'));
    let pressed = false;
    const p = new Promise((res) => {
      const b = d.querySelector('.c2go'), t0 = Date.now();
      b.addEventListener('click', () => { if (pressed || Date.now() - t0 < 350) return; pressed = true; b.dataset.go = '1'; res(d); });
    });
    return { el: d, pressed: p, close: (ms) => { if (!d.isConnected) return; d.classList.add('out'); setTimeout(() => d.remove(), ms == null ? 220 : ms); } };
  }

  root.MMCMP = Object.freeze({ PORTRAIT, MAX, KS, src, html, fit, overlay, style, bindResize, skillName, width: w });
})(typeof window !== 'undefined' ? window : globalThis);
