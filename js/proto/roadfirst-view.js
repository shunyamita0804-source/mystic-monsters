// =========================================================
// Chapter 1 Pattern A 道路先行ブロックアウトの試作 — 画面 `MMRF`（2026-10-09・試作。正式の Chapter 1 ではない）
//
//  URL に ?chapterBoard=roadfirst を付けたときだけ動く（通常の URL では何もしない＝今の Chapter 1・セーブ・大会・バトルはそのまま）。
//  画面：道路の図面（assets/proto/ch1a_roadfirst_1009/01_road_geometry.svg＝ブロックアウト。正式の背景ではない）の上に 299 地点・歩いた跡・モンスター。
//    上下にカメラが追う（約6地点が見える倍率＝設計座標の約3倍。「全体」で全図）。下に サイコロ（1〜6）・分岐の選択・出来事の文。
//  進行：js/proto/roadfirst-core.js（MMRF_CORE）。状態はゲームのセーブ（mr4v6）と別の鍵 mmrf_proto_v1（読めなければ新しく始める＝ゲームのセーブには触れない）。
//  GOAL：「大会の入口へ」＝既存の TEST 大会の入口（index.html の testTour＝今のセーブを控えて Chapter 1 の大会受付へ・終われば元のセーブへ戻す）。
//  開発用の URL：&rfSeed=数（乱数の種）・&rfStop=pass（途中で止まらない比較用）・&rfRand=open|closed（D_RAND の開閉を固定）
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
  let D, C, st, el, busy = false, zoomAll = false, fast = false;
  let vis = null;   // 動いている途中の見た目の位置 { node, n＝歩いた跡の数 }（進行の計算は先に終わる＝画面だけ1地点ずつ追いかける）
  const wait = (ms) => new Promise((r) => setTimeout(r, fast ? 0 : ms));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function opts() {
    const o = {}; const s = Number(Q.get('rfSeed')); if (Number.isFinite(s) && Q.get('rfSeed') !== null) o.seed = s;
    if (Q.get('rfStop') === 'pass') o.stopRule = 'pass';
    const r = Q.get('rfRand'); if (r === 'open') o.randOpen = true; else if (r === 'closed') o.randOpen = false;
    return o;
  }
  function load() { try { const t = localStorage.getItem(KEY); if (!t) return null; const s = JSON.parse(t); return s && s.v === 1 && D.nodes[s.node] ? s : null; } catch (e) { return null; } }
  function persist() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
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
#rfp .rf-die.on{opacity:1}#rfp .rf-die small{position:absolute;bottom:-26px;font-size:12px;white-space:nowrap;color:#13233a;background:rgba(255,255,255,.9);padding:1px 6px;border-radius:6px}`;
    document.head.appendChild(s);
  }

  function svgLayer() {
    const seg = D.segments; let lines = '';
    for (const k of Object.keys(seg)) { const pts = seg[k][3].map((id) => D.nodes[id].slice(0, 2).join(',')).join(' '); lines += `<polyline points="${pts}" fill="none" stroke="rgba(19,35,58,.0)" stroke-width="1"/>`; }
    let dots = '';
    for (const [id, n] of Object.entries(D.nodes)) {
      const big = n[2] !== 'ordinary_tile', R = big ? 5 : 3;
      dots += `<circle data-id="${id}" cx="${n[0]}" cy="${n[1]}" r="${R}" fill="${big ? '#fff' : '#fffef6'}" stroke="#13233a" stroke-width="${big ? 1.6 : 1}"/>`;
    }
    return `<svg viewBox="0 0 1024 1536" aria-hidden="true">${lines}<polyline class="rf-trail" fill="none" stroke="#e0526b" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round" opacity=".85" points=""/>${dots}<g class="rf-hint"></g></svg>`;
  }
  function mount() {
    css();
    el = document.createElement('div'); el.id = 'rfp'; el.setAttribute('role', 'application');
    el.innerHTML = `<div class="rf-vp"><div class="rf-cam"><img src="${BG}" alt="" draggable="false">${svgLayer()}<div class="rf-mon"><img src="${monSrc()}" alt="モンスター" draggable="false"></div></div></div>
<div class="rf-top"><div><b>Chapter 1 Pattern A 道路先行の試作</b> <span class="rf-warn">（試作・正式ではない／図面はブロックアウト）</span></div><div class="rf-row"><span class="rf-turn"></span><span class="rf-at"></span></div><div class="rf-row"><span class="rf-rw"></span><span class="rf-rand"></span><span class="rf-rule"></span></div></div>
<div class="rf-tools"><button type="button" data-a="zoom">全体</button><button type="button" data-a="reset">最初から</button><button type="button" data-a="close">閉じる</button></div>
<div class="rf-die"><span></span><small></small></div>
<div class="rf-bot"><div class="rf-msg"></div><div class="rf-ch"></div><button type="button" class="rf-go">サイコロを振る</button></div>`;
    document.body.appendChild(el);
    el.addEventListener('click', onClick);
    root.addEventListener('resize', () => cam());
    render(); cam(true);
    say(st.turn ? '続きから再開しました。' : 'START から大会会場（GOAL）を目指します。サイコロは 1〜6・40ターン。');
  }
  function onClick(e) {
    const b = e.target.closest('button'); if (!b) return;
    if (b.classList.contains('rf-go')) return st.done ? goal() : turn();
    if (b.dataset.seg) return pick(b.dataset.seg);
    const a = b.dataset.a;
    if (a === 'zoom') { zoomAll = !zoomAll; b.textContent = zoomAll ? '寄る' : '全体'; cam(); }
    if (a === 'reset') { if (busy) return; st = C.create(D, opts()); persist(); render(); cam(true); say('最初からやり直しました。'); }
    if (a === 'close') close();
  }
  function close() { if (el) { el.remove(); el = null; } }
  function say(t) { if (el) el.querySelector('.rf-msg').innerHTML = t; }
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
    const need = C.needsChoice(D, st);
    go.textContent = st.done ? '大会の入口へ' : st.timeUp ? '時間切れ（最初から で再挑戦）' : 'サイコロを振る';
    go.disabled = busy || need || (st.timeUp && !st.done);
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
      else if (x.type === 'reward') { say(x.first ? `報酬を手に入れた（${x.at}・中身は未定【試作】）。帰りもサイコロで歩いて戻る。` : `${x.at}：もう取った報酬（1回の育成で1回だけ）。`); await wait(400); }
      else if (x.type === 'den') { say(`隠れ家（${x.at}）に着いた（中身は未定【試作】）。`); await wait(400); }
      else if (x.type === 'stop') { if (x.why !== 'dead_end') say(`${el.querySelector('.rf-msg').innerHTML}<br>ここで止まる（残りの目 ${x.discarded} は使わない【仮ルール】）。`); else say(`${el.querySelector('.rf-msg').innerHTML}<br>行き止まり（残りの目 ${x.discarded} は使わない）。`); }
      else if (x.type === 'goal') say(`大会会場（GOAL）に着いた！ ${st.turn} ターン。「大会の入口へ」で既存の大会受付へ（TEST 大会＝セーブは変わらない）。`);
      else if (x.type === 'timeup') say(`40ターンが終わった（${placeOf(x.at)}）。大会には間に合わなかった。`);
      else if (x.type === 'choice') say(`${placeOf(x.at)}：道を選んでください（残りの目 ${st.moveLeft}）。`);
    } } finally { vis = null; }
  }
  async function turn(die, o) {
    if (busy || st.done || st.timeUp || C.needsChoice(D, st)) return;
    busy = true; render();
    const v = C.roll(D, st, die); if (v == null) { busy = false; return; }
    persist(); await showDie(v, `移動のサイコロ（Turn ${st.turn}）`);
    await play(C.advance(D, st, o || {}));
    busy = false; persist(); render(); cam();
  }
  async function pick(seg, o) {
    if (busy || !C.needsChoice(D, st)) return;
    busy = true; render(); say(`${esc(NAME[seg] || 'このまま進む')}へ進む。`);
    await play(C.advance(D, st, Object.assign({}, o || {}, { choose: seg })));
    busy = false; persist(); render(); cam();
  }
  function goal() {
    if (!st.done) return;
    const t = G('testTour'), S = G('S');
    if (typeof t === 'function' && S && !S.playerNamePending && G('TEST_MODE') !== false) { close(); try { t(); } catch (e) {} return; }
    say('大会の入口（既存の TEST 大会の受付）へは、聖獣士登録のあとで進めます。通常の URL で登録してから試してください。');
  }

  function start() {
    D = root.MMRF_DATA; C = root.MMRF_CORE; if (!D || !C) return;
    st = load() || C.create(D, opts()); persist();
    if (!document.getElementById('rfp')) mount();
  }
  const api = {
    on: ON, KEY, start, close,
    state: () => (st ? JSON.parse(JSON.stringify(st)) : null),
    reset: (o) => { st = C.create(D, Object.assign(opts(), o || {})); persist(); render(); cam(true); },
    roll: (die, o) => turn(die, o), choose: (seg, o) => pick(seg, o), goal,
    set fast(v) { fast = !!v; if (el) el.classList.toggle('fast', fast); }, get fast() { return fast; },
    busy: () => busy,
  };
  root.MMRF = api;
  if (ON && typeof document !== 'undefined') {
    const go = () => setTimeout(start, 0);
    if (document.readyState === 'complete') go(); else root.addEventListener('load', go);
  }
})(typeof window !== 'undefined' ? window : globalThis);
