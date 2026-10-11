// =========================================================
// 本編の Chapter 1「はじまりの草原」＝1枚の世界のボードの画面 `MMWB`（2026-10-11。ユーザー決定：本編の Chapter 1 をこのボードに置き換える）
//
//  描画：js/proto/roadfirst-world.js（MMRF_WORLD＝地面と道を canvas に1回だけ描き CSS 3D で傾ける・マスとモンスターは立てて置く）
//    と assets/proto/board_art_1010/ のボード素材（第1〜4便）。開始の俯瞰 → START へ寄る（この個体のこの Chapter で1回＝m.raise.field.introSeen）。
//  進行：js/chapter/world-driver.js（MMWD）が raising.js（MMP8）の Chapter 1 を受け持つ。この画面は MMP8.roll／step／chooseBranch／resolveLanding／rest を呼んで
//    結果を見せるだけ（出目・効果・ターンは見せる前に確定して保存＝再読み込みで振り直し・二重取りにならない）。
//  操作欄：Chapter 1 の正式の操作欄の画像（js/chapter/configs/ch1a.js の deck＝START・アイテム・休む・技設定・ステータス）。HUD は既存の .chh の部品。
//  バトル：野生・レア・ライバルは index.html の bBattleGo（本物の fight()）。大会：ゴール → 会場のロビー → フィナの会話（1回）→ 既存の大会受付（p9ReceptionHtml）。
//  index.html の board() から：MMWB.active(m) なら MMWB.board(msg)。大会・ほかの Chapter では MMWB.release()（canvas を手放す）。
// =========================================================
(function (root) {
  'use strict';
  const ART = './assets/proto/board_art_1010/', TV2 = './assets/fields/ch1a/tiles_v2/';
  const STEP_MS = 240;
  const STAT_FILE = { li: 'life', po: 'power', in: 'intelligence', hi: 'accuracy', ev: 'evasion', de: 'toughness' };
  const ART_TILE = { start: 'tile_start.webp', goal: 'tile_goal.webp', lower_walk_through_gate: 'tile_gate.webp', upper_walk_through_gate: 'tile_gate.webp',
    challenge_d6_5_6: 'tile_challenge.webp', fixed_reward_dead_end: 'tile_reward.webp', optional_random_unlock_dead_end: 'tile_den.webp' };
  const $ = (q) => (typeof document !== 'undefined' ? document.querySelector(q) : null);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
  const G = (n) => { try { return (0, eval)(n); } catch (e) { return undefined; } };   // index.html の let／const（S・LAB・P9_LOBBY_BG・bBusy）
  const gS = () => G('S');
  const doSave = () => { try { root.save(); } catch (e) {} };
  const P8 = () => root.MMP8, WD = () => root.MMWD, D = () => root.MMRF_DATA, C = () => root.MMRF_CORE;
  const cfg = () => (root.MMCH && root.MMCH.getConfig ? root.MMCH.getConfig(1) : null) || {};
  const calm = () => !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const feel = (n, d) => { try { if (root.MMFEEL) root.MMFEEL.emit(n, d); } catch (e) {} };
  const labOf = (k) => { const L = G('LAB'); return (L && L[k]) || k; };
  // bBusy は index.html の let（field-view.js と同じく、別のスクリプトからも同じ名前で読み書きできる）
  const busyGet = () => { try { return !!bBusy || !!(root.MMCHD && root.MMCHD.isLocked()); } catch (e) { return !!(root.MMCHD && root.MMCHD.isLocked()); } };
  const busySet = (v) => { try { bBusy = v; } catch (e) {} };
  const V = { el: null, world: null, key: null, intro: false };
  const onBoard = () => !!(V.el && V.el.isConnected);
  const fieldOf = (m) => WD().fieldOf(m);
  function monSrc(m) { const sp = root.MMP10M && root.MMP10M.byId ? root.MMP10M.byId(m.sp) : null; return sp && sp.image ? sp.image.src : './assets/monsters/solamo.png'; }

  // ---- マスの見た目（全地点）。役割の決まった地点は専用の絵、通常の地点は配置の中身（能力・イベント・休憩・野生・宝箱） ----
  function look(m) {
    const d = D(), f = fieldOf(m), fwdN = {}, inN = {};
    for (const e of d.edges) if (e[3] === 'forward') { fwdN[e[0]] = (fwdN[e[0]] || 0) + 1; inN[e[1]] = (inN[e[1]] || 0) + 1; }
    return (id) => {
      const n = d.nodes[id], role = n ? n[2] : '', out = { src: TV2 + 'tile_blank.webp', mark: '', used: false };
      if (ART_TILE[role]) out.src = ART + ART_TILE[role];
      else if (role === 'mandatory_rival') out.src = TV2 + 'tile_rival.webp';
      else if ((fwdN[id] || 0) > 1) out.src = TV2 + 'tile_branch.webp';
      else if ((inN[id] || 0) > 1) out.src = ART + 'tile_merge.webp';
      else if (role === 'ordinary_tile' && f) {
        const t = f.tiles[id];
        if (t) {
          out.used = f.used[id] != null;
          if (t.t === 'stat') out.src = TV2 + 'tile_stat_' + STAT_FILE[t.k] + '.webp';
          else if (t.t === 'event') out.src = TV2 + 'tile_event.webp';
          else if (t.t === 'rest') out.src = TV2 + 'tile_rest.webp';
          else if (t.t === 'wild') out.src = TV2 + (t.rare ? 'tile_rare_monster.webp' : 'tile_wild_monster.webp');
          else if (t.t === 'treasure') out.src = TV2 + (t.tier === 'rare' ? 'tile_treasure_2.webp' : 'tile_treasure_1.webp');
        }
      }
      if (f && (role === 'fixed_reward_dead_end' || role === 'optional_random_unlock_dead_end') && f.claimed[id] != null) out.used = true;
      return out;
    };
  }
  /** カメラ：今の地点と、この先の数地点（分かれ道では両方の道・行き止まりでは戻り道） */
  function info(m, node) {
    const f = fieldOf(m), st = f.core, d = D(), c = C(), at = node || st.node;
    const first = st.done || node ? null : c.options(d, st).map((e) => e.dst);
    let back = node ? null : st.back;
    if (!back && !node && c.DEAD_ROLES.includes(c.role(d, at))) { const ix = c.index(d); back = ix.spurs.find((k) => ix.endOf[k] === at) || null; }
    return { node: at, ahead: st.done ? [] : root.MMRF_WORLD.lookahead(d, at, back ? null : first, back, 6), look: look(m), denOpen: !!st.randOpen };
  }
  function viewRect() {
    const w = V.el && V.el.querySelector('.wbv'); if (!w) return null;
    const r = w.getBoundingClientRect(), h = V.el.querySelector('.chh'), dk = V.el.querySelector('#wb-ui .chsheet') || V.el.querySelector('#chdock');   // 分かれ道・バトルのシートが出ている間はシートの上まで（モンスターと道の先をシートより上に）
    const top = h ? h.getBoundingClientRect().bottom - r.top + 6 : 80, bottom = dk ? dk.getBoundingClientRect().top - r.top - 6 : r.height - 170;
    return { W: r.width, H: r.height, top, bottom, right: r.width };
  }

  // ---- 画面の部品 ----
  const COIN = '<img class="chh-ic" src="./assets/ui/gold/coin.png" alt="" aria-hidden="true" draggable="false">';
  function placeName(id) { const W = WD(), d = D(); return (W.PLACE && W.PLACE[id]) || (d.nodes[id] && d.nodes[id][2] === 'fixed_reward_dead_end' ? '宝の行き止まり' : ''); }
  function hudHtml(m) {
    const r = m.raise, fat = Math.round(r.fatigue || 0), lv = fat >= 80 ? 'hi' : fat >= 50 ? 'mid' : 'lo', S = gS() || {};
    const ph = P8().boardPhase(m), pl = placeName(r.node);
    return `<header class="chh wbh"><div class="chh-top"><div class="chh-l chh-prog"><div class="chh-cap"><small>Chapter <b>1</b> / ${root.MMP7 ? root.MMP7.CHAPTER_COUNT : 4}</small><b class="chh-nm">はじまりの草原</b><span class="chh-fd" id="chfd">${esc(pl)}</span></div></div>
      <button class="p9mbtn chh-menu" onclick="p9Menu()" aria-label="メニュー">☰</button></div>
      <div class="chh-r chh-chips"><div class="chh-turn chip">Turn <b id="chturn">${Math.min(r.turnsUsed + (ph === 'roll' ? 1 : 0), r.turnLimit)}</b><small> / ${r.turnLimit}</small></div>
      <div class="chh-fat chip f-${lv}" id="chfat"><span>疲れ</span><b>${fat}</b><i style="--f:${fat}%"></i></div>
      <div class="chh-gold chip" id="chgold">${COIN}<b>${S.g | 0}</b></div>
      <div class="chh-tix chip" id="chtix" title="特訓チケット"><span>特訓チケット</span><b>×${S.trainTix | 0}</b></div></div></header>`;
  }
  const CMDS = [
    { k: 'item', cls: 'chitem', pos: 'tl', on: 'MMWB.items()', label: 'アイテム' },
    { k: 'rest', cls: 'chrest', pos: 'tr', on: 'MMWB.rest()', label: '休む' },
    { k: 'skill', cls: 'chskill', pos: 'bl', on: "MMWB.open('w')", label: '技設定' },
    { k: 'status', cls: 'chstatus', pos: 'br', on: "MMWB.open('st')", label: 'ステータス' },
  ];
  function deckHtml(m, ph, msg) {
    const r = m.raise, Dk = cfg().deck || {}, canRoll = P8().canRoll(m), canRest = P8().canRest(m), tired = ph === 'roll' && !canRoll && (r.fatigue || 0) >= 100;
    let def = '';
    if (ph === 'roll') def = r.turnsUsed === 0 ? '<b>はじまりの草原</b>　大会会場を目指そう。START でサイコロ（1〜6）を振る。' : tired ? '疲れがたまって動けない…休もう。' : 'START でサイコロを振る。休むこともできる。';
    else if (ph === 'move' || ph === 'resolve') def = '移動中…';
    else if (ph === 'branch') def = `分かれ道だ。どちらへ進む？（のこり${r.pend.left}）`;
    const H = Dk.hit || {}, box = (k) => { const h = H[k] || { x: 0, y: 0, w: 0, h: 0 }; return `style="left:${(h.x * 100).toFixed(1)}%;top:${(h.y * 100).toFixed(1)}%;width:${(h.w * 100).toFixed(1)}%;height:${(h.h * 100).toFixed(1)}%"`; };
    const center = ph === 'roll'
      ? `<div class="chstopw chstopw-img${canRoll ? ' on' : ''}" ${box('center')}><button class="chstop chstop-img" id="brollbtn" data-nsfx="1" onclick="MMWB.roll()"${canRoll && !V.intro ? '' : ' disabled'} aria-label="START（サイコロを振る）"><b>START</b></button></div>`
      : `<div class="chstopw chstopw-img" ${box('center')}><button class="chstop chstop-img wait" disabled aria-label="移動中"><b>${(ph === 'move' || ph === 'resolve') && r.pend ? r.pend.roll : '…'}</b></button></div>`;
    const wing = (c) => { const on = (c.k === 'rest' ? canRest : ph === 'roll') && !V.intro; return `<button class="chwing chwing-img ${c.cls} chw-${c.pos}${c.k === 'rest' && tired ? ' must' : ''}" ${box(c.pos)} onclick="${c.on}"${on ? '' : ' disabled'}><b>${c.label}</b>${c.k === 'rest' ? `<small>疲れ −${root.MMRF_PLAY ? root.MMRF_PLAY.TUNING.restAmount : 30}</small>` : ''}</button>`; };
    return `<div class="chdeck chdeck-img" id="chdock"><p class="chmsg" id="bmsg">${msg || def}</p><div class="chcmd chcmd-img" style="--deckar:${Dk.aspect || 3.116}">${Dk.start ? `<img class="chdeck-bg" src="${esc(Dk.start)}" alt="" draggable="false">` : ''}${CMDS.map(wing).join('')}${center}</div></div>`;
  }
  function sheetHtml(m, ph) {
    const r = m.raise;
    if (ph === 'branch') {
      const f = fieldOf(m), d = D();
      return `<div class="chsheet chbr wbbr"><h3>分かれ道</h3>${WD().branchOptions(m).map((o) => {
        const end = o.seg && d.segments[o.seg] ? d.segments[o.seg][1] : null, got = o.spur && end && f.claimed[end] != null;
        const desc = o.spur ? (got ? '取得済み（行き止まり。帰りもサイコロ）' : '行き止まりの先に宝。帰りもサイコロで戻る') : '';
        return `<button class="chroute${o.spur ? ' spur' : ''}" data-id="${esc(o.id)}" onclick="MMWB.pick('${esc(o.id)}')"><b>${esc(o.name)}</b>${desc ? `<small>${esc(desc)}</small>` : ''}</button>`; }).join('')}</div>`;
    }
    if (ph === 'battle') {
      const fx = r.pend.fx || {}, bt = (cfg().battleTypes || {})[fx.battleType || 'wild'] || { label: 'モンスター' }, fb = root.MMRF_PLAY ? root.MMRF_PLAY.TUNING.wildFatigue : 5;
      return `<div class="chsheet chbat"><small class="chbat-kind">${esc(bt.label)}</small><h3>${esc(bt.encounter || bt.label)}</h3>${bt.note ? `<p class="p9s chbat-note">${esc(bt.note)}</p>` : ''}<p class="p9s">バトルの後は疲れ +${fb}。賞金・ランクアップはありません。</p><button class="p9btn" onclick="bBattleGo()">バトルする</button>${fx.battleType === 'rival' ? '' : '<button class="p9btn2" onclick="bBattleSkip()">やめておく</button>'}</div>`;
    }
    if (ph === 'timeup') return `<div class="chsheet"><h3>⌛ ターン終了</h3><p class="p9s">ゴールできなかったため、このChapterの公式大会には参加できません。Chapterは終了し、次のChapterへ進めます（育成失敗ではありません）。</p><button class="p9btn" onclick="p8EndChapter()">Chapterを終えてベースキャンプへ</button></div>`;
    return '';
  }

  // ---- board() から ----
  function css() {
    if ($('#wb-css')) return;
    const s = document.createElement('style'); s.id = 'wb-css';
    s.textContent = `#app>.chfw.wbw{background:#0b1636}
.wbw .wbv{position:absolute;inset:0;overflow:hidden;z-index:0}
.wbw .chf-ui{z-index:5}
.wbw.wb-intro .chf-ui>*{opacity:0;pointer-events:none;transition:opacity .35s}
.wbw .wbh .chh-fd:empty{display:none}
.wbw .wbbr .chroute.spur{border-style:dashed}
.wbw .wb-pop{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);width:min(86%,330px);box-sizing:border-box;padding:12px 14px;border-radius:16px;background:linear-gradient(180deg,rgba(20,36,82,.97),rgba(8,18,46,.97));border:1.5px solid #d9b465;color:#fff;text-align:center;box-shadow:0 8px 22px rgba(0,0,0,.5);pointer-events:auto;animation:wbpop .26s ease-out both;z-index:8}
.wbw .wb-pop.out{animation:wbpopout .2s ease-in forwards}
.wbw .wb-pop img.art{display:block;width:100%;aspect-ratio:3/2;object-fit:cover;border-radius:10px;margin:0 0 8px}
.wbw .wb-pop small{display:block;font-size:12px;color:#e8d29a;margin-bottom:3px}
.wbw .wb-pop b{display:block;font-size:17px;font-family:var(--mm-font-title,serif)}
.wbw .wb-pop p{margin:6px 0 0;font-size:13px;line-height:1.5}
.wbw .wb-pop .rows{margin-top:6px;display:flex;flex-wrap:wrap;gap:4px 10px;justify-content:center;font-weight:800;font-size:15px}
.wbw .wb-pop .rows span{white-space:nowrap}
.wbw .wb-pop .rows .dn{color:#ffb3bf}
.wbw .wb-arr{position:absolute;inset:0;z-index:4;background:#0b1636 center/cover no-repeat;opacity:0;transition:opacity .8s}
.wbw .wb-arr.on{opacity:1}
@keyframes wbpop{from{opacity:0;transform:translate(-50%,-46%) scale(.94)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
@keyframes wbpopout{to{opacity:0;transform:translate(-50%,-52%) scale(.97)}}
@media (prefers-reduced-motion:reduce){.wbw .wb-pop,.wbw .wb-pop.out{animation:none}}`;
    document.head.appendChild(s);
  }
  function release() { if (V.intro) busySet(false); if (V.world) { try { V.world.destroy(); } catch (e) {} } V.world = null; V.el = null; V.key = null; V.intro = false; }
  function ensureView(m) {
    const f = fieldOf(m), key = `${m.uid}:${f.layoutSeed}`, app = $('#app');
    if (V.el && V.key === key) { if (!V.el.isConnected) { app.innerHTML = ''; app.appendChild(V.el); } return false; }
    release(); css();
    app.innerHTML = '<div class="chfw wbw" id="wbw"><div class="wbv" id="wbv"></div><div class="chf-ui" id="wb-ui"></div></div>';
    V.el = $('#wbw'); V.key = key;
    if (root.MMRF_WORLD) V.world = root.MMRF_WORLD.create(V.el.querySelector('.wbv'), D(), root.MMRF_PLAY, { view: viewRect, monSrc: monSrc(m), art: { base: ART, road: 'strip' } });
    return true;
  }
  function paint(m, msg, node, instant) {
    const ui = $('#wb-ui'); if (!ui) return;
    const ph = P8().boardPhase(m);
    ui.innerHTML = ph === 'goal' ? '' : hudHtml(m) + sheetHtml(m, ph) + deckHtml(m, ph, msg);
    if (V.world) V.world.update(info(m, node), instant);
  }
  function board(msg) {
    const S = gS(), m = S && S.m; if (!active(m)) return false;
    const fresh = ensureView(m), r = m.raise, f = fieldOf(m), ph = P8().boardPhase(m);
    if (root.MMCHD && V.dice !== 6) { const dc = cfg().dice || {}; root.MMCHD.configure({ ...dc, sides: 6 }); V.dice = 6; root.MMCHD.preload(); }
    try { for (const e of [$('#app'), document.querySelector('main'), document.scrollingElement]) if (e && e.scrollTop) e.scrollTop = 0; } catch (e) {}
    if (ph === 'goal') { paint(m, msg, null, fresh); arrive(m, fresh); return true; }
    paint(m, msg, null, fresh);
    if (fresh && ph === 'roll' && r.turnsUsed === 0 && r.node === 'START' && !f.introSeen && V.world && !root.MM_QA_NO_INTRO) intro(m);
    if (ph === 'move') setTimeout(() => { if (onBoard()) walk(); }, 300);
    else if (ph === 'resolve') setTimeout(() => { if (onBoard()) resolve(); }, 300);
    return true;
  }
  function intro(m) {
    const f = fieldOf(m); f.introSeen = true; doSave();   // 先に「見た」を保存（途中で再読み込みしても二度出ない）
    V.intro = true; V.el.classList.add('wb-intro'); busySet(true); paint(m);
    V.world.intro(() => { V.intro = false; busySet(false); if (V.el) V.el.classList.remove('wb-intro'); feel('chapter.start'); if (onBoard() && active(m)) paint(m); });
  }

  // ---- 操作 ----
  function lock() { document.querySelectorAll('#wb-ui button').forEach((b) => { b.disabled = true; }); }
  function pressPoint(sel) { const host = V.el, b = host && host.querySelector(sel); if (!host || !b) return null; const hr = host.getBoundingClientRect(), r = b.getBoundingClientRect(); return { x: r.left + r.width / 2 - hr.left, y: r.top + r.height / 2 - hr.top }; }
  async function playDie(v, from) {
    if (!root.MMCHD || !V.el) return;
    const hr = V.el.getBoundingClientRect(), vr = viewRect() || { W: hr.width, top: 80, bottom: hr.height - 170 };
    try { await root.MMCHD.play(v, { host: V.el, from, land: { x: vr.W / 2, y: vr.top + (vr.bottom - vr.top) * 0.36 } }); } catch (e) {}
  }
  async function roll() {
    const S = gS(), m = S && S.m; if (!active(m) || busyGet() || V.intro || !P8().canRoll(m)) return;
    busySet(true); lock();
    try {
      const from = pressPoint('#brollbtn'), r = P8().roll(S, m); doSave();   // 出目・ターン・疲れは見せる前に確定して保存
      paint(m, 'サイコロを振った…'); lock();
      await playDie(r.value, from);
      const add = m.raise.pend ? m.raise.pend.fatigueAdded || 0 : 0;
      paint(m, `出目 <b>${r.value}</b>${add ? `　疲れ +${add}` : ''}`); lock();
    } finally { busySet(false); }
    walk();
  }
  async function walk() {
    const S = gS(), m = S && S.m; if (!active(m) || busyGet() || !m.raise.pend) return;
    busySet(true);
    try {
      while (m.raise.pend && m.raise.pend.stage === 'move') {
        if (!onBoard()) break;
        const before = m.raise.node, s = P8().step(S, m); doSave();
        if (m.raise.node !== before && V.world) { V.world.update(info(m, m.raise.node)); const c = $('#chfd'); if (c) c.textContent = placeName(m.raise.node); await wait(calm() ? 60 : STEP_MS); }
        if (s && s.stage === 'branch') break;
      }
    } finally { busySet(false); }
    if (!onBoard()) return;
    const st = m.raise.pend && m.raise.pend.stage;
    if (st === 'resolve') return resolve();
    board();
  }
  function pick(id) {
    const S = gS(), m = S && S.m; if (!active(m) || busyGet()) return;
    const r = P8().chooseBranch(S, m, id); doSave(); if (!r.ok) return board();
    feel('branch.select', { id });
    paint(m, '', m.raise.node); lock(); walk();
  }
  async function rest() {
    const S = gS(), m = S && S.m; if (!active(m) || busyGet() || V.intro || !P8().canRest(m)) return;
    busySet(true); lock(); let res;
    try { const b = m.raise.fatigue || 0; res = P8().rest(S, m); doSave(); if ((m.raise.fatigue || 0) < b) feel('rest.recover'); paint(m, `ひと休みした。　疲れ −${b - (m.raise.fatigue || 0)}`); lock(); await wait(calm() ? 200 : 700); }
    finally { busySet(false); }
    if (onBoard()) board(`ひと休みした。疲れ ${m.raise.fatigue || 0}` + (res && res.timeUp ? '　ターンを使い切った…' : ''));
  }
  function open(id) { const S = gS(), m = S && S.m; if (!active(m) || busyGet() || V.intro || P8().boardPhase(m) !== 'roll') return; try { root.hall(id); } catch (e) {} }
  function items() {
    const S = gS(), m = S && S.m; if (!active(m) || busyGet() || V.intro || P8().boardPhase(m) !== 'roll') return;
    const CH = root.MMCH, bag = (S.inv && S.inv.bag) || [], list = bag.map((it, i) => ({ it, i, eff: CH && CH.fatigueItemEffect(it.id) })).filter((x) => x.eff);
    const ui = $('#wb-ui'); if (!ui) return; itemsClose();
    const nm = (id) => { const d = root.MMP7 && root.MMP7.getItemDef(id); return d ? d.name : id; };
    ui.insertAdjacentHTML('beforeend', `<div class="chsheet chitems" id="chitems"><h3>アイテム</h3>${list.length ? list.map((x) => `<button class="p9btn2" onclick="MMWB.useItem(${x.i})">${root.MM_ITEM_ICON && root.MM_ITEM_ICON[x.it.id] ? `<img class="itic" src="${esc(root.MM_ITEM_ICON[x.it.id])}" alt="" decoding="async">` : ''}${esc(nm(x.it.id))}<small>${x.eff.full ? '疲れ 全回復' : `疲れ −${x.eff.amount}`}</small></button>`).join('') : '<p class="p9s">疲れを回復できるアイテムを持っていない。</p>'}<button class="p9btn2" onclick="MMWB.itemsClose()">閉じる</button></div>`);
  }
  function itemsClose() { const d = $('#chitems'); if (d) d.remove(); }
  function useItem(i) { const S = gS(), m = S && S.m; if (!active(m) || busyGet()) return; const r = root.MMCH.useFatigueItem(S, m, i); if (!r.ok) return itemsClose(); doSave(); board(`疲れ −${r.recovered}`); }

  // ---- 止まった地点の結果 ----
  function rowsHtml(fx) {
    const out = [];
    for (const g of fx.gains || []) if (g.amount) out.push(`<span class="${g.amount < 0 ? 'dn' : ''}">${esc(labOf(g.key))} ${g.amount > 0 ? '+' : ''}${g.amount}</span>`);
    if (fx.kind === 'stat' && fx.amount) out.push(`<span>${esc(labOf(fx.key))} +${fx.amount}</span>`);
    if (fx.gold) out.push(`<span>${COIN.replace('chh-ic', 'chh-ic wbc')}+${fx.gold}G</span>`);
    if (fx.fatigue) out.push(`<span class="${fx.fatigue > 0 ? 'dn' : ''}">疲れ ${fx.fatigue > 0 ? '+' : '−'}${Math.abs(fx.fatigue)}</span>`);
    return out.length ? `<div class="rows">${out.join('')}</div>` : '';
  }
  function plainOf(fx) {
    const t = [];
    for (const g of fx.gains || []) if (g.amount) t.push(`${labOf(g.key)} ${g.amount > 0 ? '+' : ''}${g.amount}`);
    if (fx.kind === 'stat' && fx.amount) t.push(`${labOf(fx.key)} +${fx.amount}`);
    if (fx.gold) t.push(`+${fx.gold}G`); if (fx.fatigue) t.push(`疲れ ${fx.fatigue > 0 ? '+' : '−'}${Math.abs(fx.fatigue)}`);
    return t.join('　');
  }
  function popup(html, ms) {
    return new Promise((done) => {
      const ui = $('#wb-ui'); if (!ui) return done();
      const d = document.createElement('div'); d.className = 'wb-pop'; d.setAttribute('role', 'status'); d.innerHTML = html; ui.appendChild(d);
      let closed = false; const close = () => { if (closed) return; closed = true; d.classList.add('out'); setTimeout(() => { d.remove(); done(); }, calm() ? 0 : 200); };
      d.addEventListener('click', close); setTimeout(close, calm() ? Math.min(ms, 900) : ms);
    });
  }
  const evDef = (id) => ((cfg().eventPool) || []).find((e) => e.id === id) || null;
  async function talkLines(lines) {
    if (!lines || !lines.length || root.MM_QA_NO_STORY || !root.MMNPC || !onBoard()) return;
    const L = lines.map((l) => (root.MMEVT ? root.MMEVT.lineOf(l) : { npc: 'fina', expression: l.expression || 'normal', text: l.text }));
    await root.MMNPC.talk(L, { kind: 'event', presentation: 'compact' });
  }
  async function choose(fx) {
    const E = root.MMEVT, first = (fx.options && fx.options[0] && fx.options[0].id) || null;
    if (!E || !root.MMNPC || root.MM_QA_NO_STORY) return E ? E.autoChoice(fx) : first;
    const id = await root.MMNPC.talk(E.choiceLines(fx), { kind: 'event', presentation: 'board' });
    return (fx.options || []).some((o) => o.id === id) ? id : first;
  }
  async function encounter(m, bt) {
    const ui = $('#wb-ui'), B = (cfg().battleTypes || {})[bt] || {}, text = B.encounter || '', rival = bt === 'rival', cue = rival ? 'rival.appear' : bt === 'rare' ? 'rare.alert' : 'wild.alert';
    if (!ui || calm() || !text) { feel(cue, { battleType: bt }); await wait(calm() ? 300 : 500); return; }
    await wait(380);
    let foe = null;
    if (!rival && root.MMP10M && root.MMCH && root.MMCH.foeSpecies && typeof root.battleFoeCount === 'function') { const sp = root.MMP10M.byId(root.MMCH.foeSpecies(m, root.battleFoeCount())); if (sp && sp.image) foe = { src: sp.image.src, name: sp.name }; }
    const A = cfg().assets || {}, fig = rival && B.encounterFigure ? A[B.encounterFigure] : null, part = rival && B.encounterPartner ? A[B.encounterPartner] : null;
    const sil = bt === 'wild' && !!foe, label = rival ? 'RIVAL' : 'ENCOUNTER';
    const motes = Array.from({ length: rival ? 14 : 10 }, (_, i) => `<i class="ce-mote" style="--x:${(10 + ((i * 41) % 80)).toFixed(0)}%;--dl:${(i * 0.09).toFixed(2)}s;--s:${(3 + (i % 3) * 2)}px"></i>`).join('');
    ui.insertAdjacentHTML('beforeend', `<div class="chf-enc chf-enc2 t-${esc(B.tone || bt)}${B.aura ? ' aura' : ''}${sil ? ' sil' : ''}" role="status" aria-label="${esc(text)}"><i class="ce-veil"></i>${rival ? `<div class="ce-top"><span>✦ ${label} ✦</span></div>` : ''}
      <div class="ce-stage">${B.aura ? '<i class="ce-halo"></i>' : ''}<i class="ce-circle"></i><i class="ce-circle in"></i>${motes}${foe ? `<img class="ce-mon" src="${esc(foe.src)}" alt="${sil ? '？？？' : esc(foe.name)}" draggable="false">` : ''}${sil ? `<i class="ce-sil" aria-hidden="true" style="-webkit-mask-image:url('${esc(foe.src)}');mask-image:url('${esc(foe.src)}')"></i>` : ''}${fig ? `<img class="ce-rival" src="${esc(fig)}" alt="${esc(B.name || 'ライバル')}" draggable="false">` : ''}${part ? `<img class="ce-partner" src="${esc(part)}" alt="" draggable="false">` : ''}</div>
      ${rival ? '' : `<div class="ce-band"><span>${label}</span></div>`}${B.badge ? `<em class="ce-badge">${esc(B.badge)}</em>` : ''}<b class="ce-tx">${esc(text)}</b></div>`);
    const el = ui.querySelector('.chf-enc2:last-child'); feel(cue, { battleType: bt });
    await wait(rival ? 1350 : 1500);
    if (el) { el.classList.add('out'); await wait(220); el.remove(); }
  }
  const DIE_TEXT = {
    Q: (e) => `運命のサイコロ：${e.die}（${e.die % 2 ? '奇数＝左の道' : '偶数＝右の道'}へ）`,
    CHALLENGE: (e) => `封印の遺跡門の挑戦：${e.die} → ${e.die >= 5 ? '成功！ 遺跡の道へ' : '失敗… 遠回りの道へ'}`,
  };
  async function resolve() {
    const S = gS(), m = S && S.m; if (!active(m) || busyGet() || !onBoard() || !m.raise.pend || m.raise.pend.stage !== 'resolve') return;
    busySet(true); lock();
    let tail = '';
    try {
      const r = P8().resolveLanding(S, m); doSave();
      let fx = r.fx || {};
      for (const e of fx.dice || []) {   // イベントのサイコロ（Q の左右・特殊挑戦）：出目はもう決まっている（見せるだけ）
        const tx = (DIE_TEXT[e.kind] || ((x) => `サイコロ：${x.die}`))(e);
        const b = $('#bmsg'); if (b) b.textContent = tx;
        await playDie(e.die, null); tail = tx;
      }
      if (fx.kind === 'choice') {
        feel('event', { ev: fx.ev });
        const id = await choose(fx);
        let r2 = P8().resolveChoice(S, m, id); if (!r2.ok) r2 = P8().resolveChoice(S, m, (fx.options[0] || {}).id); doSave();
        if (r2.ok) { Object.assign(r, r2); fx = r2.fx || {}; }
      }
      paint(m, tail); lock();
      if (fx.kind === 'stat') {
        await wait(calm() ? 0 : 160); feel('stat.up', { key: fx.key, amount: fx.amount });
        await popup(`<small>${esc(labOf(fx.key))}のマス</small><b>${esc(labOf(fx.key))} +${fx.amount}</b>`, 1300); tail = `${labOf(fx.key)} +${fx.amount}`;
      } else if (fx.kind === 'treasure') {
        feel(['normal', 'rare', 'special'].includes(fx.tier) ? `chest.open.${fx.tier}` : 'chest.open', { tier: fx.tier });
        await popup(`<small>${fx.tier === 'rare' ? '珍しい宝箱' : '宝箱'}を見つけた！</small>${rowsHtml(fx)}`, 1300); tail = plainOf(fx);
      } else if (fx.kind === 'reward') {
        feel('chest.open.special', { tier: 'special' });
        await popup(`<small>${fx.den ? '隠れ家' : '宝の行き止まり'}</small><b>${esc(fx.title || '')}</b>${rowsHtml(fx)}`, 1800); tail = `${fx.title || ''}　${plainOf(fx)}`.trim();
      } else if (fx.kind === 'event') {
        const e = evDef(fx.ev) || {};
        if (fx.recovery) feel('rest.recover'); else feel('event', { ev: fx.ev });
        await talkLines(fx.choice ? [] : fx.lines);
        await popup(`${e.image ? `<img class="art" src="${esc(e.image)}" alt="" decoding="async">` : ''}<b>${esc(fx.title || '')}</b>${fx.text ? `<p>${esc(fx.text)}</p>` : ''}${rowsHtml(fx)}`, e.image ? 2000 : 1500);
        tail = plainOf(fx) || fx.title || '';
      } else if (fx.kind === 'battle') await encounter(m, fx.battleType);
      else if (fx.note === 'claimed') tail = `${fx.title || '宝'}はもう手に入れている。`;
      if (r.goal) tail = `${tail}　大会会場に着いた！`.trim(); else if (r.timeUp) tail = `${tail}　ターンを使い切った…`.trim();
    } finally { busySet(false); }
    if (onBoard()) board(tail || undefined);
  }

  // ---- ゴール：会場のロビー → フィナの会話（この個体のこの Chapter で1回）→ 大会受付 ----
  function arrivalLines() {
    const S = gS() || {}, nm = root.MMP11P ? root.MMP11P.sanitize(S.playerName) : (S.playerName || 'アルト'), A = cfg().arrival || {};
    return (A.talk || []).map((l) => ({ ...l, text: String(l.text || '').split('{name}').join(nm) }));
  }
  function receptionHtml(m) { const lob = G('P9_LOBBY_BG') || ''; return `<div class="chrcv bg" id="chrcv" style="--lobby:url(${lob})">${root.p9ReceptionHtml ? root.p9ReceptionHtml(m) : ''}</div>`; }
  async function arrive(m, fresh) {
    const ui = $('#wb-ui'), f = fieldOf(m); if (!ui || !f) return;
    if (busyGet() && $('#wbarr')) return;
    const lob = (cfg().arrival && cfg().arrival.lobby && cfg().arrival.lobby.bg) || G('P9_LOBBY_BG') || '';
    let ov = $('#wbarr'); if (!ov) { V.el.insertAdjacentHTML('beforeend', `<div class="wb-arr" id="wbarr" style="background-image:url(${esc(lob)})"></div>`); ov = $('#wbarr'); }
    if (f.arrivalSeen) { ov.classList.add('on'); ov.style.transition = 'none'; ui.innerHTML = receptionHtml(m); return; }
    busySet(true);
    try {
      if (root.bgm) root.bgm('chapter');
      if (!fresh && !calm()) await wait(500);
      void ov.offsetWidth; ov.classList.add('on'); feel('tournament.arrive');
      await wait(calm() ? 0 : 950);
      if (root.MMNPC && !root.MM_QA_NO_ARRIVAL && arrivalLines().length) await root.MMNPC.talk(arrivalLines(), { kind: 'event', presentation: 'major', big: true });
      f.arrivalSeen = true; doSave();
    } finally { busySet(false); }
    const u2 = $('#wb-ui'); if (u2 && onBoard() && active(m) && P8().boardPhase(m) === 'goal') u2.innerHTML = receptionHtml(m);
  }

  const active = (m) => !!(WD() && WD().active(m));
  root.MMWB = Object.freeze({ STEP_MS, active, board, release, roll, pick, rest, open, items, itemsClose, useItem, state: () => ({ key: V.key, intro: V.intro, world: V.world ? V.world.state() : null }), world: () => V.world });
})(typeof window !== 'undefined' ? window : globalThis);
