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
//   ・被弾／回避のリアクション（2026-10-12）：攻撃を受けた側のダメージの数字（pop の span.dmg）が出た瞬間に、待機立ち絵を一瞬だけ
//     正式のリアクション（js/monsters/reaction-art.js の hit／dodge）へ差し替えて戻す。当たった／かわした は act() が呼ぶ MMBattle.resolveAction の
//     結果を読むだけ（呼ぶだけ・結果は変えない）。待機立ち絵が出ていない間（技のコマ）・絵が読めていないときは差し替えない＝二重に出ない
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
  // 2026-10-12 開発21（E-4）：公式ランク戦＝正式のバトル背景（assets/battle/official_rank_1012/rank_E〜S）。練習試合（野生・レア・ライバル＝#bt の data-mmprac）は従来の venue_E〜S（変えない）
  const arenaSrc = (r, practice) => (r && RANKS.includes(r) ? (practice ? `./assets/tournament/venues/venue_${r}.webp` : `./assets/battle/official_rank_1012/rank_${r}.webp`) : null);   // 2026-10-07 追補便：正式の大会会場 venue_E〜S（旧 arena_E〜S はファイルだけ残す）
  const idleSrc = (sp) => (IDLE[sp] ? `${A}idle/${IDLE[sp]}.webp` : null);
  /** 立ち絵を左右反転するか（プレイヤー＝右向き・相手＝左向き） */
  const flipOf = (side, sp) => (FACE[sp] === 'L') === (side === 0);

  function style() {
    if (document.getElementById('mma-style')) return;
    const st = document.createElement('style'); st.id = 'mma-style';
    st.textContent = [
      '#bt .mma-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 30%;z-index:0}',
      // 2026-10-12 開発21（E-5）：正式背景は床の始まりが画像の約55%（従来の会場より下）＝モンスターが壁の前に浮いて見えた → 下を軸に 1.12倍にして床をモンスターの足もとへ（絵は描き直さない・空が少し切れるだけ）
      '#bt .mma-bg.ofc{transform-origin:50% 100%;transform:scale(1.12)}',
      '#bt .mma-bg.fld{object-position:center 58%}',
      '#bt .bgs.mma-on::after{background:linear-gradient(rgba(6,10,26,.15),transparent 18%,transparent 52%,rgba(6,10,26,.55) 74%,rgba(4,7,18,.9))}',
      '#bt .mon.mma-on>img:not(.mma-idle):not(.mma-rx){opacity:0}',
      '#bt .mon .mma-idle{position:absolute;left:50%;bottom:0;height:118%;width:auto;max-width:none;transform:translateX(-50%);pointer-events:none;filter:drop-shadow(0 8px 6px rgba(0,0,0,.45))}',
      '#bt .mon .mma-idle.fl{transform:translateX(-50%) scaleX(-1)}',
      '#bt .mon:not(.mma-on) .mma-idle{display:none}',
      // 被弾／回避のリアクション：待機立ち絵と同じ置き方（足もと・中央・反転）。高さ＝待機立ち絵 × --rh（体の大きさがそろう倍率）
      '#bt .mon .mma-rx{position:absolute;left:50%;bottom:0;height:calc(118% * var(--rh,1));width:auto;max-width:none;transform:translateX(-50%);pointer-events:none;filter:drop-shadow(0 8px 6px rgba(0,0,0,.45))}',
      '#bt .mon .mma-rx.fl{transform:translateX(-50%) scaleX(-1)}',
      '#bt .mon.mma-rxon>.mma-idle{visibility:hidden}',
      '#bt .mon:not(.mma-on) .mma-rx{display:none}',
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
      // ---- 2026-10-12 試遊：HUD（05）・説明の帯（06）・ターンの表示（07）・勝利（08）。fight()・.bt 系 CSS は変えない（ここから上書き） ----
      // 05：左右の濃紺の箱をやめる＝名前（横に状態異常の札）→ その下にライフ（既存の正式の光沢のバー B-29 緑・少ないときは B-30 赤）→ 残りの数
      '#bt .bgs.mma-on::after{background:linear-gradient(rgba(6,10,26,.5),rgba(6,10,26,.18) 14%,transparent 24%,transparent 52%,rgba(6,10,26,.55) 74%,rgba(4,7,18,.9))}',
      '#bt .hpr .hpn{background:none!important;border:0!important;box-shadow:none!important;border-radius:0!important;padding:0 2px!important;animation:none!important}',
      '#bt .hpn .hpb{display:flex;flex-wrap:wrap;align-items:center;column-gap:5px;row-gap:1px}',
      '#bt .hpn .hn1{order:0;flex:0 1 auto;min-width:0;max-width:100%;font-size:.9rem;color:#fff;text-shadow:0 1px 2px #000,0 0 6px rgba(0,0,0,.85)}',
      '#bt .hpn .hpb{flex-wrap:wrap!important}#bt .hpn .hn1{flex:0 1 auto;min-width:2.5em;height:20px;line-height:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '#bt .hpn .mmchips{order:1;flex:0 0 auto;max-width:74%;min-width:0;height:20px;display:flex;flex-wrap:nowrap;align-items:center;gap:3px;overflow:hidden}',
      '#bt .hpn.s1 .mmchips{order:-1;justify-content:flex-end}#bt .hpn.s1 .hn1{order:0}',
      '#bt .hpn .mmchips .sts,#bt .hpn .mmchips .mmail{display:flex!important;flex-wrap:nowrap!important;flex:none;gap:3px;margin:0!important;min-height:0}',
      '#bt .hpn .mmchips .sts:empty,#bt .hpn .mmchips .mmail:empty{display:none!important}',
      '#bt .hpn .mmchips .stb,#bt .hpn .mmchips .mmail span{display:inline-flex!important;flex-direction:row!important;flex-wrap:nowrap!important;align-items:center!important;width:auto!important;min-width:0!important;height:16px!important;box-sizing:border-box;flex:none;padding:0 4px 0 3px!important;gap:1px!important;font:800 9px/14px "Noto Sans JP",sans-serif!important;border-width:1px!important;white-space:nowrap;animation:none!important}',
      '#bt .hpn .mmchips .stb i{font-size:9px!important}#bt .hpn .mmchips .stb b,#bt .hpn .mmchips .mmail span b{display:inline-block!important;min-width:0!important;width:auto!important;height:auto!important;margin-left:1px!important;padding:0 2px;line-height:12px!important;font-size:8px!important;border-radius:6px!important}',
      '#bt .hpn .mmail{order:1;margin:0}#bt .hpn #b0,#bt .hpn #b1{order:2;flex:1 0 100%}#bt .hpn .sts{order:3;flex:1 0 100%}',
      '#bt .hpn.s1 .hpb{justify-content:flex-end}#bt .hpn.s1 small{text-align:right}',
      '#bt .hpn .eg2{height:14px;margin:2px 0 1px;border:1.5px solid rgba(255,236,190,.9);border-radius:8px;background:rgba(8,14,30,.72);box-shadow:0 1px 4px rgba(0,0,0,.6)}',
      '#bt .hpn .eg2 i{background:url(./assets/ui/b_group/b29_ability_bar_fill_green.png) left center/100% 100% no-repeat!important;box-shadow:none!important}',
      '#bt .hpn .eg2.lo i{background-image:url(./assets/ui/b_group/b30_ability_bar_fill_red.png)!important}',
      '#bt .hpn small{text-shadow:0 1px 2px #000,0 0 5px rgba(0,0,0,.9)}',
      // 06・07：下の黒い説明の帯をやめる（文字だけ・同じ位置）。「タイミングよくボタンを押せ！」は出さない。「あなたのターン」「相手のターン」はこの位置（モンスターに重ねない）
      '#bt .bui #msg{background:none!important;border:0!important;box-shadow:none!important;min-height:1.6em;color:#fff;text-shadow:0 1px 3px #000,0 0 8px rgba(0,0,0,.9)}',
      '#bt .bui #msg::before,#bt .bui #msg::after{display:none!important}',
      '#bt .bui #msg.mm-q,#bt.mm-turn .bui #msg{visibility:hidden}',
      '#bt .ban.sm.mm-low{font-size:2rem;line-height:1.2;margin-top:-1.2rem}',
      '#bt .vs{translate:0 min(8.5dvh,72px)}',
      // 08：勝ったときは正式の勝利画像（assets/tournament/victory/）。「WIN!」の演出は残し、下の「勝利！」の文字は出さない
      '#bt .mon.mma-won>img:not(.mma-win){opacity:0!important}',
      '#bt .mon .mma-win{position:absolute;left:50%;bottom:-2%;height:132%;width:auto;max-width:none;transform:translateX(-50%);pointer-events:none;filter:drop-shadow(0 8px 6px rgba(0,0,0,.45));animation:mmawin .5s cubic-bezier(.2,1.4,.4,1) both}',
      '@keyframes mmawin{from{opacity:0;transform:translateX(-50%) translateY(8%) scale(.92)}to{opacity:1;transform:translateX(-50%)}}',
    ].join('\n');
    document.head.appendChild(st);
  }

  // ---- 背景 ----
  // 2026-10-12 試遊：野生・レア・ライバル（Chapter の道中のバトル）は Chapter ごとの野外の背景（会場 venue ではない）。
  const FIELD_BG = { 1: './assets/battle/field_1012/ch1_meadow.webp', 2: './assets/battle/field_1012/ch2_coast.webp', 3: './assets/battle/field_1012/ch3_sky.webp', 4: './assets/battle/field_1012/ch4_volcano.webp' };   // 2026-10-12 開発23：正式の野外のバトル背景（864×1536）
  const fieldSrc = (ch) => FIELD_BG[Number(ch)] || null;
  function setupBg(bt) {
    const prac = !!(bt.dataset && bt.dataset.mmprac === '1'), fld = prac ? fieldSrc(bt.dataset.mmch) : null, src = fld || arenaSrc(rankOf(bt), prac), bgs = $('.bgs', bt);
    if (!src || !bgs || $('.mma-bg', bgs)) return;
    const im = new Image(); im.className = 'mma-bg' + (prac ? (fld ? ' fld' : '') : ' ofc'); im.alt = ''; im.decoding = 'async'; im.src = src;   // ofc＝公式ランク戦の正式背景
    bgs.appendChild(im); bgs.classList.add('mma-on');
  }

  // ---- 待機立ち絵 ----
  function setupIdle(bt) {
    const pl = G('BPL'), IMG = G('IMG');
    if (!pl) return;
    [0, 1].forEach((s) => {
      const mon = $(`#m${s} .mon`, bt), sp = pl[s] && pl[s].sp, src = idleSrc(sp);
      if (!mon || !src) return;
      const still = () => { const im = mon.querySelector(':scope>img:not(.mma-idle):not(.mma-rx):not(.b2)'); return !!(im && IMG && im.getAttribute('src') === IMG[sp]); };
      const sync = () => {
        let idle = mon.querySelector('.mma-idle');
        if (still()) {
          if (!idle) { idle = new Image(); idle.className = 'mma-idle' + (flipOf(s, sp) ? ' fl' : ''); idle.alt = ''; idle.src = src; mon.appendChild(idle); if (root.MM25D) MM25D.syncIdle(bt); }   // 2026-10-08：比較試遊（?battleArt=2p5d）のときはソラモ・ガウルを 2.5D の立ち絵に（js/battle/art25d.js）
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

  // ---- 2026-10-12 試遊：説明の帯・ターンの表示・勝利の画像（fight() の画面を外から見て直す） ----
  const HIDE_MSG = /^(タイミングよくボタンを押せ！|勝利！(（判定勝ち）)?)\s*$/;
  const VICTORY = ['solamo', 'gauru', 'nobiton', 'jiol', 'regnas'];
  function setupText(bt) {
    const msg = $('#msg', bt);
    const sync = () => {
      if (msg) msg.classList.toggle('mm-q', HIDE_MSG.test(msg.textContent || ''));
      const ban = bt.querySelector(':scope>#ban');
      const turn = !!(ban && ban.classList.contains('sm'));
      bt.classList.toggle('mm-turn', turn);
      if (turn && !ban.classList.contains('mm-low') && msg) {   // ターンの表示＝下の説明の位置（帯は無い）
        const r = msg.getBoundingClientRect(), b = bt.getBoundingClientRect();
        if (r.height || r.top) { ban.style.top = (r.top - b.top + Math.max(r.height, 20) / 2) + 'px'; ban.classList.add('mm-low'); }
      }
      if (ban && /^WIN!/.test(ban.textContent || '')) won(bt);
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(bt, { childList: true });
    if (msg) mo.observe(msg, { childList: true, characterData: true, subtree: true });
  }
  function won(bt) {
    const pl = G('BPL'), sp = pl && pl[0] ? pl[0].sp : null, mon = $('#m0 .mon', bt);
    if (!mon || !VICTORY[sp] || mon.querySelector('.mma-win')) return;
    const im = new Image(); im.className = 'mma-win'; im.alt = ''; im.decoding = 'async'; im.src = `./assets/tournament/victory/${VICTORY[sp]}_victory.webp`;
    im.onload = () => mon.classList.add('mma-won'); im.onerror = () => im.remove();
    mon.appendChild(im);
  }
  // 2026-10-12 試遊：状態異常（#mmail）・能力の上げ下げ（#st0／#st1）の札は名前の横に小さく1行（左＝名前の右・右＝名前の左）。行の高さは固定＝札が出てもライフのバーは動かない
  function setupChips(bt) {
    [0, 1].forEach((i) => {
      const hb = bt.querySelector('#hp' + i + ' .hpb'), st = bt.querySelector('#st' + i); if (!hb || !st || hb.querySelector('.mmchips')) return;
      const w = document.createElement('div'); w.className = 'mmchips'; w.id = 'mmchips' + i;
      const nm = hb.querySelector('.hn1'); hb.insertBefore(w, nm ? nm.nextSibling : hb.firstChild); w.appendChild(st);
    });
  }
  // ---- 被弾／回避のリアクション（2026-10-12）----
  const RX_MS = { hit: 560, dodge: 520 }, RX_CALM_MS = 420;
  const rxLog = [];   // 確認用（最大30件）：{ side, kind, sp }
  let lastAct = null;
  /** 両側の被弾・回避の絵を先に読んでデコードしておく（側ごとに別の要素＝同じ種族どうしでも重ならない）。読み終わっていない絵には差し替えない */
  const rxImg = {};
  function rxPreload() {
    const pl = G('BPL'), X = root.MMRXART; if (!pl || !X) return;
    [0, 1].forEach((s) => ['hit', 'dodge'].forEach((k) => {
      const i = pl[s] && X.info(pl[s].sp, k), key = `${s}:${k}`;
      if (!i || (rxImg[key] && rxImg[key].dataset.src === i.src)) return;
      const im = new Image(); im.alt = ''; im.decoding = 'sync'; im.dataset.src = i.src; im.dataset.ok = '';
      im.onload = () => { const ok = () => { im.dataset.ok = '1'; }; if (im.decode) im.decode().then(ok, ok); else ok(); };
      im.src = i.src; rxImg[key] = im;
    }));
  }
  /** 攻撃を受けた側（side）の待機立ち絵を一瞬だけ kind（'hit'｜'dodge'）へ。差し替えたら true */
  function react(side, kind) {
    const bt = document.getElementById('bt'), pl = G('BPL'), X = root.MMRXART;
    if (!bt || !pl || !X || !pl[side]) return false;
    const mon = $(`#m${side} .mon`, bt), sp = pl[side].sp, inf = X.info(sp, kind);
    if (!mon || !inf || !mon.classList.contains('mma-on') || !mon.querySelector('.mma-idle')) return false;   // 技のコマが出ている間は差し替えない
    const im = rxImg[`${side}:${kind}`];
    if (!im || im.dataset.src !== inf.src || im.dataset.ok !== '1' || !im.naturalWidth) return false;   // 読めていない（読み込み中・404）＝待機立ち絵のまま
    const old = mon.querySelector(':scope>.mma-rx'); if (old && old !== im) old.remove();
    im.className = 'mma-rx' + (flipOf(side, sp) ? ' fl' : ''); im.dataset.kind = kind; im.style.setProperty('--rh', String(inf.hRel));
    if (im.parentNode !== mon) mon.appendChild(im);   // デコード済みの絵をそのまま置く＝差し替えた最初のフレームから描ける（空白が出ない）
    mon.classList.add('mma-rxon');
    clearTimeout(mon.__rxT);
    mon.__rxT = setTimeout(() => { mon.classList.remove('mma-rxon'); im.remove(); }, reduced() ? RX_CALM_MS : RX_MS[kind]);
    rxLog.push({ side, kind, sp }); if (rxLog.length > 30) rxLog.shift();
    return true;
  }
  /** act() の結果（当たった／かわした・攻撃を受けた側）を覚える。resolveAction は呼ぶだけ */
  function rxWrap() {
    const B = root.MMBattle;
    if (!B || B.__rx || typeof B.resolveAction !== 'function') return;
    const W = Object.assign({}, B); W.__rx = true;
    W.resolveAction = function (o) { const r = B.resolveAction(o); try { if (r && o && (o.attackerSide === 'A' || o.attackerSide === 'B')) lastAct = o.move && o.move.power > 0 ? { target: o.attackerSide === 'A' ? 1 : 0, hit: !!r.hit, t: now() } : null; /* 補助技（威力なし）は数字が出ない＝覚えない */ } catch (e) { /* 見た目だけ */ } return r; };
    root.MMBattle = Object.freeze(W);
  }
  /** ダメージの数字（#f0／#f1 の span.dmg）が出た瞬間：受けた側が当たった＝被弾・MISS＝回避 */
  function rxWatch(bt) {
    new MutationObserver((muts) => {
      for (const mu of muts) for (const n of mu.addedNodes) {
        if (!n || n.tagName !== 'SPAN' || !n.classList.contains('dmg') || n.classList.contains('ef')) continue;
        const p = n.parentNode, side = p && /^f[01]$/.test(p.id || '') ? +p.id.slice(1) : -1;
        if (side < 0 || !lastAct || lastAct.target !== side || now() - lastAct.t > 4000) continue;   // 自分の番のミス（ルーレットの MISS・動けない）は攻撃を受けた側ではない＝出さない
        const act = lastAct; lastAct = null;   // 1回の行動につき1回だけ
        if (root.MMRULES && root.MMRULES.swallow && root.MMRULES.swallow(n)) continue;   // まひ・ねむりで動けない行動の MISS（js/battle/rules.js）
        const ms = n.classList.contains('ms');
        if (ms === !act.hit) { try { react(side, ms ? 'dodge' : 'hit'); } catch (e) { /* 見た目だけ */ } }
      }
    }).observe(bt, { childList: true, subtree: true });
  }
  function setup(bt) {
    style();
    try { lastAct = null; rxWrap(); rxPreload(); rxWatch(bt); } catch (e) { /* 見た目だけ */ }
    try { setupChips(bt); } catch (e) { /* 見た目だけ */ }
    try { setupText(bt); } catch (e) { /* 見た目だけ */ }
    try { setupBg(bt); } catch (e) { /* 見た目だけ */ }
    try { setupIdle(bt); } catch (e) { /* 見た目だけ */ }
    try { setupRoulette(bt); } catch (e) { /* 見た目だけ */ }
  }
  function watch() {
    if (typeof MutationObserver === 'undefined' || !document.body) return;
    new MutationObserver((muts) => { for (const mu of muts) for (const n of mu.addedNodes) if (n && n.id === 'bt') setup(n); }).observe(document.body, { childList: true });
  }
  if (typeof document !== 'undefined') { if (document.body) watch(); else document.addEventListener('DOMContentLoaded', watch); }
  root.MMARENA = Object.freeze({ R, IDLE, FACE, rankOf, arenaSrc, fieldSrc, FIELD_BG, idleSrc, flipOf, setup, react, RX_MS, rxLog: () => rxLog.slice(), faceSrc: (sp) => (IDLE[sp] ? `./assets/tournament/faces_25d/face_${IDLE[sp].slice(5)}.webp` : null),
    // 2026-10-11：対戦表の顔＝2.5D の横顔（faces_25d）。読めなかったときは従来の丸い顔（faces）へ（index.html の tbIcon の onerror）
    faceOldSrc: (sp) => (IDLE[sp] ? `./assets/tournament/faces/face_${IDLE[sp].slice(5)}.webp` : null) });
})(typeof window !== 'undefined' ? window : globalThis);
