// =========================================================
// Chapter 1 Pattern A 道路先行ブロックアウトの試作 — 画面 `MMRF`（2026-10-09・試作。正式の Chapter 1 ではない）
//
//  URL に ?chapterBoard=roadfirst を付けたときだけ動く（通常の URL では何もしない＝今の Chapter 1・セーブ・大会・バトルはそのまま）。
//  画面：道路の図面（assets/proto/ch1a_roadfirst_1009/01_road_geometry.svg＝ブロックアウト。正式の背景ではない）の上に 299 地点・歩いた跡・モンスター。
//    上下にカメラが追う（約6地点が見える倍率＝設計座標の約3倍。「全体」で全図）。下に サイコロ（1〜6）・分岐の選択・出来事の文。
//  進行：js/proto/roadfirst-core.js（MMRF_CORE）。状態はゲームのセーブ（mr4v6）と別の鍵 mmrf_proto_v1（読めなければ新しく始める＝ゲームのセーブには触れない）。
//  GOAL：「大会の入口へ」＝既存の TEST 大会の入口（index.html の testTour＝今のセーブを控えて Chapter 1 の大会受付へ・終われば元のセーブへ戻す）。
//  開発用の URL：&rfSeed=数（乱数の種）・&rfStop=pass（途中で止まらない比較用）・&rfRand=open|closed（D_RAND の開閉を固定）
//  2026-10-09 育成の試作：止まったマスの中身（能力6種・イベント・休憩・野生・宝箱・固定報酬）・疲れ・休む・試作G は js/proto/roadfirst-play.js（MMRF_PLAY）。
//    状態は同じ鍵 mmrf_proto_v1 の v 2（v 1＝移動だけの保存は v 2 へ移行。読めない保存は消さずに「新しく始める」を押したときだけ mmrf_proto_v1_broken へ控えて置き換える）。
//    &rfItemLab=1（&rfDD=個数）＝ダブルダイス【仮】の実験。正式の所持金・持ち物・セーブ（mr4v6）には触れない
// =========================================================
(function (root) {
  'use strict';
  const Q = (() => { try { return new URLSearchParams(root.location ? root.location.search : ''); } catch (e) { return new URLSearchParams(''); } })();
  const ON = Q.get('chapterBoard') === 'roadfirst';
  const KEY = 'mmrf_proto_v1';
  const BG = './assets/proto/ch1a_roadfirst_1009/01_road_geometry.svg';
  const ZOOM = 3, ZOOM_ALL = 0.36;
  const NAME = {
    EL01: '左の道', ER01: '右の道', LATE_SAFE: '安全な道', LATE_L1: '特殊挑戦の道', LATE_R1: '石像方面の道',
    D_LC: '宝の道（L_CHEST）', D_LA: '宝の道（L_ALTAR）', D_RC: '宝の道（R_CHEST）', D_LLA: '宝の道（L_LATE_ALTAR）', D_R5: '宝の道（REWARD5）', D_RS: '宝の道（R_SPECIAL）', D_RAND: '隠し道（D_RAND）',
  };
  const PLACE = { START: 'スタート', J0: '分かれ道 J0', P: '合流 P', LOWER_GATE: '下の門', Q: '分かれ道 Q', R: '合流 R', UPPER_GATE: '上の門', RIVAL: 'ライバル', H: '分かれ道 H', CHALLENGE: '特殊挑戦', FINAL: '合流 FINAL', GOAL: 'ゴール（大会会場）', STATUE: '石像', RANDOM_DEN: '隠れ家' };
  const REWARD_IDS = ['L_CHEST', 'R_CHEST', 'L_ALTAR', 'L_LATE_ALTAR', 'REWARD5', 'R_SPECIAL'];
  const G = (n) => { try { return (0, eval)(n); } catch (e) { return undefined; } };   // index.html の let／const（S・testTour）を読む
  let D, C, P, st, el, busy = false, zoomAll = false, fast = false, broken = null, panel = false;
  let vis = null;   // 動いている途中の見た目の位置 { node, n＝歩いた跡の数 }（進行の計算は先に終わる＝画面だけ1地点ずつ追いかける）
  const wait = (ms) => new Promise((r) => setTimeout(r, fast ? 0 : ms));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function opts() {
    const o = {}; const s = Number(Q.get('rfSeed')); if (Number.isFinite(s) && Q.get('rfSeed') !== null) o.seed = s;
    if (Q.get('rfStop') === 'pass') o.stopRule = 'pass';
    const r = Q.get('rfRand'); if (r === 'open') o.randOpen = true; else if (r === 'closed') o.randOpen = false;
    return o;
  }
  const LAB = Q.get('rfItemLab') === '1';
  const labDD = () => { const n = Number(Q.get('rfDD')); return Number.isInteger(n) && n >= 0 && n <= 9 ? n : undefined; };
  /** 連れている子の読み取り専用の写し（正式セーブの S.m は書き換えない） */
  function monCopy() { try { const S = G('S'), m = S && S.m; return m ? JSON.parse(JSON.stringify(m)) : null; } catch (e) { return null; } }
  function fresh(o) { return P.attach(D, C.create(D, Object.assign(opts(), o || {})), { monster: monCopy(), lab: LAB, dd: labDD() }); }
  /** 保存を読む：v 2 はそのまま・v 1（移動だけ）は育成の状態を付けて移行・読めなければ { broken } */
  function load() {
    let t = null; try { t = localStorage.getItem(KEY); } catch (e) { return null; }
    if (!t) return null;
    try { const s = P.upgrade(D, JSON.parse(t), { monster: monCopy(), lab: LAB, dd: labDD() }); if (s) return s; } catch (e) {}
    return { broken: t };
  }
  function persist() { if (broken) return; try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function monSrc() {
    try { const S = G('S'), m = S && S.m; const s = m && root.MMP10M && root.MMP10M.byId(m.sp); if (s && s.image) return s.image.src; } catch (e) {}
    return './assets/monsters/solamo.png';
  }
  const placeOf = (id) => PLACE[id] || (D.nodes[id] && D.nodes[id][3] ? `${D.nodes[id][3]}` : id);

  function css() {
    if (document.getElementById('rfp-css')) return;
    const s = document.createElement('style'); s.id = 'rfp-css';
    s.textContent = `#rfp{position:fixed;inset:0;z-index:20000;background:#ecf2f3;overflow:hidden;font-family:"Noto Sans JP",sans-serif;color:#13233a;touch-action:manipulation;user-select:none;-webkit-user-select:none}
#rfp .rf-vp{position:absolute;inset:0;overflow:hidden}
#rfp .rf-cam{position:absolute;left:0;top:0;width:1024px;height:1536px;transform-origin:0 0;transition:transform .26s ease-out;will-change:transform}
#rfp.fast .rf-cam,#rfp.fast .rf-mon{transition:none}
#rfp .rf-cam>img{position:absolute;left:0;top:0;width:1024px;height:1536px;pointer-events:none}
#rfp .rf-cam>svg{position:absolute;left:0;top:0;width:1024px;height:1536px;overflow:visible;pointer-events:none}
#rfp .rf-mon{position:absolute;left:0;top:0;width:22px;height:22px;margin:-19px 0 0 -11px;transition:transform .2s linear;pointer-events:none;z-index:3}
#rfp .rf-mon img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 1px 1px rgba(0,0,0,.45))}
#rfp .rf-top{position:absolute;left:8px;right:8px;top:calc(env(safe-area-inset-top,0px) + 8px);background:rgba(19,35,58,.9);color:#fff;border-radius:12px;padding:7px 10px;font-size:12px;line-height:1.45;z-index:5}
#rfp .rf-top b{font-size:13px}#rfp .rf-top .rf-warn{color:#ffd27a;font-size:10.5px}
#rfp .rf-top .rf-row{display:flex;gap:10px;flex-wrap:wrap}
#rfp .rf-tools{position:absolute;right:8px;top:calc(env(safe-area-inset-top,0px) + 92px);display:flex;flex-direction:column;gap:6px;z-index:5}
#rfp .rf-tools button{font:inherit;font-size:11.5px;padding:6px 8px;border-radius:9px;border:1px solid #13233a;background:rgba(255,255,255,.92);color:#13233a}
#rfp .rf-bot{position:absolute;left:8px;right:8px;bottom:calc(env(safe-area-inset-bottom,0px) + 10px);z-index:5;display:flex;flex-direction:column;gap:8px}
#rfp .rf-msg{background:rgba(255,255,255,.95);border:1px solid #9fb2c4;border-radius:12px;padding:8px 10px;font-size:13px;min-height:2.9em;line-height:1.5}
#rfp .rf-ch{display:flex;gap:6px;flex-wrap:wrap}
#rfp .rf-ch button,#rfp .rf-go{flex:1 1 40%;font:inherit;font-size:15px;font-weight:700;padding:12px 8px;border-radius:12px;border:2px solid #13233a;background:#fff8e6;color:#13233a}
#rfp .rf-go{background:#13233a;color:#fff;font-size:17px}
#rfp .rf-go:disabled{opacity:.45}
#rfp .rf-die{position:absolute;left:50%;top:42%;transform:translate(-50%,-50%);font-size:64px;font-weight:900;color:#13233a;background:rgba(255,255,255,.9);border:3px solid #13233a;border-radius:18px;width:96px;height:96px;display:flex;align-items:center;justify-content:center;z-index:6;pointer-events:none;opacity:0;transition:opacity .15s}
#rfp .rf-die.on{opacity:1}#rfp .rf-die small{position:absolute;bottom:-26px;font-size:12px;white-space:nowrap;color:#13233a;background:rgba(255,255,255,.9);padding:1px 6px;border-radius:6px}
#rfp .rf-play{display:flex;gap:8px;align-items:center;flex-wrap:nowrap;margin-top:2px}
#rfp .rf-fat{display:inline-flex;align-items:center;gap:4px;white-space:nowrap}#rfp .rf-fat i{display:inline-block;width:54px;height:7px;border-radius:4px;background:rgba(255,255,255,.25);overflow:hidden}#rfp .rf-fat i b{display:block;height:100%;background:#7fd48a}
#rfp .rf-fat.mid i b{background:#f2c14e}#rfp .rf-fat.hi i b{background:#e0526b}#rfp .rf-fat.hi{color:#ffb3bf;font-weight:700}
#rfp .rf-gold,#rfp .rf-gain{white-space:nowrap}#rfp .rf-gain{color:#bfe6ff}
#rfp .rf-btns{display:flex;gap:8px}#rfp .rf-btns .rf-go{flex:2 1 0}
#rfp .rf-rest{flex:1 1 0;font:inherit;font-size:13px;font-weight:700;padding:10px 6px;border-radius:12px;border:2px solid #2b6d78;background:#e6f6f7;color:#13434b;line-height:1.25}
#rfp .rf-rest:disabled{opacity:.4}
#rfp .rf-dd{font:inherit;font-size:12.5px;font-weight:700;padding:7px 8px;border-radius:10px;border:2px dashed #8a5a00;background:#fff4d6;color:#5b3b00}#rfp .rf-dd.on{background:#ffd27a;border-style:solid}#rfp .rf-dd:disabled{opacity:.4}
#rfp .rf-msg.nt{border:2px solid #13233a;background:#fffdf5}
#rfp .rf-msg .nt-h{font-weight:800;font-size:13.5px;display:flex;align-items:center;gap:6px}#rfp .rf-msg .nt-h .sw{width:12px;height:12px;border-radius:50%;border:1.5px solid #13233a;flex:none}
#rfp .rf-msg .nt-b{display:flex;gap:8px;align-items:flex-start;margin-top:2px}#rfp .rf-msg .nt-b img{width:66px;height:44px;object-fit:cover;border-radius:6px;flex:none;border:1px solid #9fb2c4}
#rfp .rf-msg .nt-d{margin-top:3px;font-size:12.5px;line-height:1.45}#rfp .rf-msg .nt-d .sw{display:inline-block;width:10px;height:10px;border-radius:50%;border:1px solid #13233a;margin-right:3px;vertical-align:-1px}#rfp .rf-msg .nt-d span{display:inline-block;margin-right:8px;white-space:nowrap}#rfp .rf-msg .nt-d .up{font-weight:800}
#rfp .rf-msg .proto{color:#8a5a00;font-size:10.5px}
#rfp .rf-fly{position:absolute;left:0;top:0;z-index:4;font-weight:900;font-size:9px;white-space:nowrap;pointer-events:none;-webkit-text-stroke:.6px #13233a;text-shadow:0 0 2px #fff;animation:rffly 1.1s ease-out forwards}
@keyframes rffly{0%{opacity:0;translate:-50% 0}15%{opacity:1}100%{opacity:0;translate:-50% -16px}}
#rfp .rf-panel{position:absolute;left:8px;right:76px;top:calc(env(safe-area-inset-top,0px) + 120px);max-height:calc(100% - 330px);overflow:auto;z-index:7;background:rgba(255,255,255,.97);border:2px solid #13233a;border-radius:12px;padding:8px 10px;font-size:12.5px;display:none}
#rfp .rf-panel.on{display:block}#rfp .rf-panel h4{margin:2px 0 4px;font-size:13px}
#rfp .rf-panel table{width:100%;border-collapse:collapse}#rfp .rf-panel td{padding:2px 3px;border-bottom:1px solid #e3e9ee;white-space:nowrap}#rfp .rf-panel td.n{text-align:right;font-variant-numeric:tabular-nums}
#rfp .rf-panel .sw{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:4px;vertical-align:-1px;border:1px solid #13233a}
#rfp .rf-panel ul{margin:2px 0 0;padding-left:16px}#rfp .rf-panel li{margin:1px 0}
#rfp .rf-panel .proto{color:#8a5a00;font-size:10.5px}
#rfp .rf-legend{display:flex;flex-wrap:wrap;gap:4px 8px;margin:4px 0;font-size:11.5px}#rfp .rf-legend span{white-space:nowrap}`;
    document.head.appendChild(s);
  }

  function svgLayer() {
    const seg = D.segments; let lines = '';
    for (const k of Object.keys(seg)) { const pts = seg[k][3].map((id) => D.nodes[id].slice(0, 2).join(',')).join(' '); lines += `<polyline points="${pts}" fill="none" stroke="rgba(19,35,58,.0)" stroke-width="1"/>`; }
    return `<svg viewBox="0 0 1024 1536" aria-hidden="true">${lines}<polyline class="rf-trail" fill="none" stroke="#e0526b" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round" opacity=".85" points=""/><g class="rf-dots">${dotsHtml()}</g><g class="rf-hint"></g></svg>`;
  }
  // 2026-10-09 育成の試作：マスの印（能力＝正式の6色＋頭文字／イベント？・休憩・野生！・レア★・宝箱）。使ったマスは薄く
  const TILE_LOOK = { event: ['#8e5cc7', '?'], rest: ['#2f9aa0', '休'], wild: ['#7a2b2b', '!'], treasure: ['#d9a520', '宝'] };
  const STAT_GLYPH = { li: 'ラ', po: 'ち', in: 'か', hi: '命', ev: '回', de: '丈' };
  function dotsHtml() {
    let dots = '';
    for (const [id, n] of Object.entries(D.nodes)) {
      const look = st && st.play ? P.tileLook(st, id) : null;
      if (look) {
        const [fill, g] = look.t === 'stat' ? [look.color, STAT_GLYPH[look.k]] : look.t === 'wild' && look.rare ? ['#c0143c', '★'] : TILE_LOOK[look.t];
        dots += `<g class="rf-tile${look.used ? ' used' : ''}" data-id="${id}" data-t="${look.t}${look.k ? '_' + look.k : ''}" opacity="${look.used ? 0.32 : 1}"><circle cx="${n[0]}" cy="${n[1]}" r="5.6" fill="${fill}" stroke="#13233a" stroke-width="1.1"/><text x="${n[0]}" y="${n[1] + 2.2}" font-size="6" font-weight="700" text-anchor="middle" fill="#fff" stroke="#13233a" stroke-width=".35">${g}</text></g>`;
        continue;
      }
      const big = n[2] !== 'ordinary_tile', R = big ? 5 : 3;
      dots += `<circle data-id="${id}" cx="${n[0]}" cy="${n[1]}" r="${R}" fill="${big ? '#fff' : '#fffef6'}" stroke="#13233a" stroke-width="${big ? 1.6 : 1}"/>`;
    }
    return dots;
  }
  function mount() {
    css();
    el = document.createElement('div'); el.id = 'rfp'; el.setAttribute('role', 'application');
    el.innerHTML = `<div class="rf-vp"><div class="rf-cam"><img src="${BG}" alt="" draggable="false">${svgLayer()}<div class="rf-mon"><img src="${monSrc()}" alt="モンスター" draggable="false"></div></div></div>
<div class="rf-top"><div><b>Chapter 1 Pattern A 道路先行の試作</b> <span class="rf-warn">（試作・正式ではない／図面はブロックアウト）</span></div><div class="rf-row"><span class="rf-turn"></span><span class="rf-at"></span></div><div class="rf-row"><span class="rf-rw"></span><span class="rf-rand"></span><span class="rf-rule"></span></div><div class="rf-play"><span class="rf-fat"></span><span class="rf-gold"></span><span class="rf-gain"></span></div></div>
<div class="rf-tools"><button type="button" data-a="stats">能力</button><button type="button" data-a="zoom">全体</button><button type="button" data-a="reset">最初から</button><button type="button" data-a="close">閉じる</button></div>
<div class="rf-panel" role="dialog" aria-label="能力と記録"></div>
<div class="rf-die"><span></span><small></small></div>
<div class="rf-bot"><div class="rf-msg"></div><div class="rf-ch"></div>${LAB ? '<button type="button" class="rf-dd" data-a="dd"></button>' : ''}<div class="rf-btns"><button type="button" class="rf-rest" data-a="rest">休む<br><small>疲れ−${P.TUNING.restAmount}・1ターン</small></button><button type="button" class="rf-go">サイコロを振る</button></div></div>`;
    document.body.appendChild(el);
    el.addEventListener('click', onClick);
    root.addEventListener('resize', () => cam());
    render(); cam(true);
    if (broken) say('保存されていた試作の状態を読めませんでした（形式が違う・壊れている）。元の保存は消していません。「最初から」を押すと控え（mmrf_proto_v1_broken）を残して新しく始めます。');
    else if (st.play.notice) showNotice();
    else say(st.play.migrated && st.turn ? '続きから再開しました（前の試作の保存に、育成の中身を付けて移行しました）。' : st.turn ? '続きから再開しました。' : `START から大会会場（GOAL）を目指します。サイコロは 1〜6・40ターン。止まったマスで能力が伸びる（${st.play.mon.demo ? 'デモ個体' : esc(st.play.mon.name)}）。`);
  }
  function onClick(e) {
    const b = e.target.closest('button'); if (!b) return;
    if (b.classList.contains('rf-go')) return st.done ? goal() : mainAction();
    if (b.dataset.nc !== undefined) return pickChoice(Number(b.dataset.nc));
    if (b.dataset.seg) return pick(b.dataset.seg);
    const a = b.dataset.a;
    if (a === 'zoom') { zoomAll = !zoomAll; b.textContent = zoomAll ? '寄る' : '全体'; cam(); }
    if (a === 'reset') { if (busy) return; doReset(); say('最初からやり直しました。'); }
    if (a === 'close') close();
    if (a === 'rest') doRest();
    if (a === 'stats') { panel = !panel; render(); }
    if (a === 'dd') { if (busy || !st.play || st.play.items.dd <= 0) return; st.play.ddArmed = !st.play.ddArmed; persist(); render(); }
  }
  function close() { if (el) { el.remove(); el = null; } }
  function say(t) { if (el) { const m = el.querySelector('.rf-msg'); m.classList.remove('nt'); m.innerHTML = t; } }
  function cam(instant) {
    if (!el) return;
    const vp = el.querySelector('.rf-vp'), W = vp.clientWidth, H = vp.clientHeight, n = D.nodes[vis ? vis.node : st.node];
    let s = zoomAll ? Math.min(W / 1024, H / 1536) : ZOOM, x, y;
    if (zoomAll) { x = (W - 1024 * s) / 2; y = (H - 1536 * s) / 2; }
    else { x = W / 2 - n[0] * s; y = H * 0.56 - n[1] * s; }
    const c = el.querySelector('.rf-cam'); if (instant) { c.style.transition = 'none'; requestAnimationFrame(() => { c.style.transition = ''; }); }
    c.style.transform = `translate(${x}px,${y}px) scale(${s})`;
  }
  function render() {
    if (!el) return;
    const n = D.nodes[vis ? vis.node : st.node]; el.querySelector('.rf-mon').style.transform = `translate(${n[0]}px,${n[1]}px)`;
    el.querySelector('.rf-trail').setAttribute('points', (vis ? st.trail.slice(0, vis.n) : st.trail).map((id) => D.nodes[id].slice(0, 2).join(',')).join(' '));
    const got = REWARD_IDS.filter((k) => st.rewards[k]).length;
    el.querySelector('.rf-turn').textContent = `Turn ${st.turn}/${st.limit}（残り ${Math.max(0, st.limit - st.turn)}）`;
    el.querySelector('.rf-at').textContent = `現在地 ${placeOf(st.node)}（${st.node}）`;
    el.querySelector('.rf-rw').textContent = `報酬 ${got}/6`;
    el.querySelector('.rf-rand').textContent = `D_RAND ${st.randOpen ? '開' : '閉'}【仮 ${Math.round(st.randP * 100)}%】`;
    el.querySelector('.rf-rule').textContent = st.stopRule === 'stop' ? '停止ルール：止まる【仮】' : '停止ルール：通過【比較】';
    const go = el.querySelector('.rf-go'), ch = el.querySelector('.rf-ch');
    const need = C.needsChoice(D, st), p = st.play, nt = p.notice, tired = p.fat >= P.TUNING.fatigueMax;
    // 育成の試作：疲れ・試作G・能力の伸び（合計）
    const fe = el.querySelector('.rf-fat'); fe.className = 'rf-fat' + (p.fat >= 80 ? ' hi' : p.fat >= 50 ? ' mid' : '');
    fe.innerHTML = `疲れ ${p.fat}/100 <i><b style="width:${p.fat}%"></b></i>`;
    el.querySelector('.rf-gold').textContent = `試作G ${p.gold}`;
    const gain = P.STAT_KEYS.reduce((a, k) => a + p.stats[k] - p.mon.base[k], 0);
    el.querySelector('.rf-gain').textContent = `能力 ${gain >= 0 ? '+' : ''}${gain}`;
    if (!vis) { const g = el.querySelector('.rf-dots'); const h = dotsHtml(); if (g.__h !== h) { g.innerHTML = h; g.__h = h; } }
    if (panel) renderPanel(); el.querySelector('.rf-panel').classList.toggle('on', panel);
    const tb = el.querySelector('.rf-top').getBoundingClientRect().bottom + 6; el.querySelector('.rf-tools').style.top = tb + 'px'; el.querySelector('.rf-panel').style.top = tb + 'px';
    const rb = el.querySelector('.rf-rest'); rb.disabled = busy || !!broken || !P.canRest(D, st, C);
    const dd = el.querySelector('.rf-dd'); if (dd) { dd.textContent = `ダブルダイス【仮】 残り ${p.items.dd}個${p.ddArmed ? '（次の1回に使う）' : '（押すと次の1回に使う）'}`; dd.classList.toggle('on', !!p.ddArmed); dd.disabled = busy || p.items.dd <= 0 || !!nt || st.done || st.timeUp; }
    go.textContent = st.done ? '大会の入口へ' : st.timeUp ? '時間切れ（最初から で再挑戦）' : nt && nt.kind !== 'choice' ? 'OK（次へ）' : tired ? '休む（疲れ100）' : p.ddArmed ? 'ダブルダイスで振る' : 'サイコロを振る';
    go.disabled = busy || need || !!broken || (nt && nt.kind === 'choice') || (st.timeUp && !st.done);
    if (nt && nt.kind === 'choice') { ch.innerHTML = nt.choices.map((c, i) => `<button type="button" data-nc="${i}" data-seg="nc${i}">${esc(c.label)}${c.desc ? `<br><small>${esc(c.desc)}</small>` : ''}</button>`).join(''); return; }
    ch.innerHTML = need ? C.options(D, st).map((e) => `<button type="button" data-seg="${e.seg}">${esc(NAME[e.seg] || (st.exclude ? 'このまま進む' : e.seg))}${st.rewards[D.segments[e.seg][1]] ? '（取得済み）' : ''}</button>`).join('') : '';
    if (need) { const op = C.options(D, st); const main = op.filter((e) => !C.index(D).spurs.includes(e.seg)); ch.querySelectorAll('button').forEach((b) => { const sp = C.index(D).spurs.includes(b.dataset.seg); if (!sp && main.length === 1 && !NAME[b.dataset.seg]) b.textContent = 'このまま進む'; }); }
  }
  async function showDie(v, label) { const d = el.querySelector('.rf-die'); d.querySelector('span').textContent = v; d.querySelector('small').textContent = label || ''; d.classList.add('on'); await wait(650); d.classList.remove('on'); }
  async function play(ev) {
    const steps = ev.filter((x) => x.type === 'step').length; vis = { node: st.trail[st.trail.length - 1 - steps], n: st.trail.length - steps };
    try { for (const x of ev) {
      if (!el) return;
      if (x.type === 'step') { vis = { node: x.to, n: vis.n + 1 }; render(); cam(); await wait(210); }
      else if (x.type === 'gate') say(`${placeOf(x.at)}をくぐった（通り抜けの門）。`);
      else if (x.type === 'eventDie') { await showDie(x.die, x.kind === 'Q' ? 'イベントのサイコロ' : '挑戦のサイコロ'); say(x.kind === 'Q' ? `分かれ道 Q：イベントのサイコロ ${x.die}（${x.result === 'odd' ? '奇数 → 左の道' : '偶数 → 右の道'}）。中央の道（Q→R）は通れない。` : `特殊挑戦：サイコロ ${x.die} → ${x.result === 'success' ? '成功（5・6）！上の道へ' : '失敗（1〜4）。下の道へ（通常の道に戻れる・ペナルティなし）'}`); await wait(500); }
      else if (x.type === 'rival') { say('ライバル（リュウ）が立ちはだかった！（必ず通る地点。試作ではバトルなし）'); await wait(500); }
      else if (x.type === 'reward') { say(x.first ? `報酬の行き止まり（${x.at}）に着いた。帰りもサイコロで歩いて戻る。` : `${x.at}：もう取った報酬（1回の育成で1回だけ）。`); await wait(400); }
      else if (x.type === 'den') { say(`隠れ家（${x.at}）に着いた。`); await wait(400); }
      else if (x.type === 'stop') { if (x.why !== 'dead_end') say(`${el.querySelector('.rf-msg').innerHTML}<br>ここで止まる（残りの目 ${x.discarded} は使わない【仮ルール】）。`); else say(`${el.querySelector('.rf-msg').innerHTML}<br>行き止まり（残りの目 ${x.discarded} は使わない）。`); }
      else if (x.type === 'goal') say(`大会会場（GOAL）に着いた！ ${st.turn} ターン。「大会の入口へ」で既存の大会受付へ（TEST 大会＝セーブは変わらない）。`);
      else if (x.type === 'timeup') say(`40ターンが終わった（${placeOf(x.at)}）。大会には間に合わなかった。`);
      else if (x.type === 'choice') say(`${placeOf(x.at)}：道を選んでください（残りの目 ${st.moveLeft}）。`);
    } } finally { vis = null; }
  }
  // 育成の試作：効果は先に状態へ確定して保存（P.land）→ 歩く見た目 → 結果の表示。表示を出し直しても二重にならない
  async function turn(die, o) {
    if (busy || broken || st.done || st.timeUp || C.needsChoice(D, st)) return;
    if (st.play.notice) { if (st.play.notice.kind === 'choice') return; P.ack(st); persist(); }   // API の roll は「OK」を押してから振るのと同じ
    if (!P.canRoll(D, st, C)) { render(); return; }
    busy = true; render();
    const v = P.roll(D, st, C, die, o && o.double ? { double: true, dice: o.dice } : {}); if (v == null) { busy = false; render(); return; }
    const lr = st.play.lastRoll;
    persist(); await showDie(v, lr.dice.length > 1 ? `ダブルダイス【仮】 ${lr.dice.join('＋')}（Turn ${st.turn}）` : `移動のサイコロ（Turn ${st.turn}・疲れ+${lr.fat}）`);
    const ev = C.advance(D, st, o || {}); P.land(D, st, C); persist();
    await play(ev);
    busy = false; persist(); render(); cam(); afterMove();
  }
  async function pick(seg, o) {
    if (busy || !C.needsChoice(D, st)) return;
    busy = true; render(); say(`${esc(NAME[seg] || 'このまま進む')}へ進む。`);
    const ev = C.advance(D, st, Object.assign({}, o || {}, { choose: seg })); P.land(D, st, C); persist();
    await play(ev);
    busy = false; persist(); render(); cam(); afterMove();
  }
  function afterMove() { if (st.play.notice && st.play.notice.t === st.turn) { showNotice(); fly(); } }
  function mainAction() {
    const nt = st.play.notice;
    if (nt && nt.kind !== 'choice') { P.ack(st); persist(); render(); say(st.play.fat >= P.TUNING.fatigueMax ? '疲れが100。サイコロは振れないので「休む」で回復しよう。' : 'サイコロを振ってください。'); return; }
    if (st.play.fat >= P.TUNING.fatigueMax) return doRest();
    return turn();
  }
  function doRest() {
    if (busy || broken || !P.canRest(D, st, C)) return;
    P.rest(D, st, C); persist(); render(); showNotice();
  }
  function pickChoice(i) { if (busy || !st.play.notice || st.play.notice.kind !== 'choice') return; P.choose(D, st, i); persist(); render(); showNotice(); fly(); }
  function doReset(o) {
    if (broken) { try { localStorage.setItem(KEY + '_broken', broken); } catch (e) {} broken = null; }
    st = fresh(o); persist(); render(); cam(true);
  }
  const fmtD = (x) => {
    if (x.k) return `<span class="up"><i class="sw" style="background:${P.STAT_COLOR[x.k]}"></i>${P.STAT_LABEL[x.k]}${x.grade ? `（適性${x.grade}）` : ''} ${x.d >= 0 ? '+' : ''}${x.d} → ${x.to}</span>`;
    if (x.fat !== undefined) return `<span>疲れ ${x.fat >= 0 ? '+' : ''}${x.fat} → ${x.to}</span>`;
    if (x.gold) return `<span>試作G +${x.gold}</span>`;
    return '';
  };
  function showNotice() {
    const n = st.play.notice; if (!n || !el) return;
    const sw = n.kind === 'stat' ? `<i class="sw" style="background:${P.STAT_COLOR[n.k]}"></i>` : '';
    const proto = ['reward', 'den', 'treasure', 'wild'].includes(n.kind) || (n.d || []).some((x) => x.gold) ? '<div class="proto">【試作用】中身・数値は仮（ゲームの所持金・持ち物には入らない）</div>' : '';
    const m = el.querySelector('.rf-msg'); m.classList.add('nt');
    m.innerHTML = `<div class="nt-h">${sw}${esc(n.title || '')}</div><div class="nt-b">${n.img ? `<img src="${esc(n.img)}" alt="">` : ''}<div>${esc(n.text || '')}${n.lines && n.lines.length && n.kind === 'choice' ? `<br><small>フィナ「${esc(n.lines[n.lines.length - 1])}」</small>` : ''}${n.d && n.d.length ? `<div class="nt-d">${n.d.map(fmtD).join('')}</div>` : ''}${proto}</div></div>`;
  }
  function fly() {
    const n = st.play.notice; if (!el || !n || !n.d) return;
    const x = n.d.find((y) => y.k && y.d); if (!x) return;
    const at = D.nodes[st.node], f = document.createElement('div'); f.className = 'rf-fly'; f.style.color = P.STAT_COLOR[x.k];
    f.style.transform = `translate(${at[0]}px,${at[1] - 26}px)`; f.textContent = `${P.STAT_LABEL[x.k]} +${x.d}`;
    el.querySelector('.rf-cam').appendChild(f); setTimeout(() => f.remove(), 1200);
  }
  function renderPanel() {
    const p = st.play, pn = el.querySelector('.rf-panel');
    const rows = P.STAT_KEYS.map((k) => `<tr><td><i class="sw" style="background:${P.STAT_COLOR[k]}"></i>${P.STAT_LABEL[k]}</td><td>適性${p.mon.growth[k]}</td><td class="n">${p.mon.base[k]} → <b>${p.stats[k]}</b></td><td class="n">${p.stats[k] - p.mon.base[k] >= 0 ? '+' : ''}${p.stats[k] - p.mon.base[k]}</td></tr>`).join('');
    const got = Object.keys(p.claimed).map((k) => `<li>${esc((P.TUNING.rewards[k] || {}).title || k)}（${k}・Turn ${p.claimed[k]}）</li>`).join('') || '<li>まだ無い</li>';
    const hist = p.hist.slice(-8).reverse().map((h) => `<li>T${h.t} ${esc(h.title)}${(h.d || []).map((x) => x.k ? ` ${P.STAT_LABEL[x.k]}${x.d >= 0 ? '+' : ''}${x.d}` : x.fat !== undefined && x.fat ? ` 疲れ${x.fat >= 0 ? '+' : ''}${x.fat}` : x.gold ? ` 試作G+${x.gold}` : '').join('')}</li>`).join('') || '<li>まだ無い</li>';
    const legend = P.STAT_KEYS.map((k) => `<span><i class="sw" style="background:${P.STAT_COLOR[k]}"></i>${P.STAT_LABEL[k]}</span>`).join('') + '<span><i class="sw" style="background:#8e5cc7"></i>？イベント</span><span><i class="sw" style="background:#2f9aa0"></i>休憩</span><span><i class="sw" style="background:#7a2b2b"></i>！野生</span><span><i class="sw" style="background:#c0143c"></i>★レア</span><span><i class="sw" style="background:#d9a520"></i>宝箱</span>';
    pn.innerHTML = `<h4>${p.mon.demo ? 'デモ個体（連れている子がいない）' : esc(p.mon.name)}の能力（試作の写し・正式のセーブは変わらない）</h4><table>${rows}</table>
<div class="rf-legend">${legend}</div><h4>固定報酬 ${Object.keys(p.claimed).filter((k) => k !== 'RANDOM_DEN').length}/6・試作G ${p.gold}・休んだ ${p.rests}回</h4><ul>${got}</ul><h4>最近の出来事</h4><ul>${hist}</ul>
<div class="proto">【試作用・要承認】マスの割合・疲れ（出目ごと +2〜+7）・報酬の中身・試作G は仮の値。正式の所持金・持ち物・セーブには入らない。</div>`;
  }
  function goal() {
    if (!st.done) return;
    const t = G('testTour'), S = G('S');
    if (typeof t === 'function' && S && !S.playerNamePending && G('TEST_MODE') !== false) { close(); try { t(); } catch (e) {} return; }
    say('大会の入口（既存の TEST 大会の受付）へは、聖獣士登録のあとで進めます。通常の URL で登録してから試してください。');
  }

  function start() {
    D = root.MMRF_DATA; C = root.MMRF_CORE; P = root.MMRF_PLAY; if (!D || !C || !P) return;
    const l = load();
    if (l && l.broken) { broken = l.broken; st = fresh(); } else { st = l || fresh(); persist(); }
    if (!document.getElementById('rfp')) mount();
  }
  const api = {
    on: ON, KEY, start, close,
    state: () => (st ? JSON.parse(JSON.stringify(st)) : null),
    reset: (o) => doReset(o),
    roll: (die, o) => turn(die, o), choose: (seg, o) => pick(seg, o), goal,
    rest: () => doRest(), ok: () => mainAction(), choice: (i) => pickChoice(i),
    set fast(v) { fast = !!v; if (el) el.classList.toggle('fast', fast); }, get fast() { return fast; },
    busy: () => busy,
  };
  root.MMRF = api;
  if (ON && typeof document !== 'undefined') {
    const go = () => setTimeout(start, 0);
    if (document.readyState === 'complete') go(); else root.addEventListener('load', go);
  }
})(typeof window !== 'undefined' ? window : globalThis);
