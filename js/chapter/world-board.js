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
//  2026-10-11（次の作業）：フィナの節目の一言・チュートリアル（MMWD.storyEvents）・冒険リアクション（js/chapter/reactions.js の MMREACT＝通常の地点に止まったとき）・
//    歩行アニメ（ch1a.js の monsterSprites。2026-10-11 から向きの切り替え＝back・front・side のセット・pickDir）・能力マスの特訓の動き（field-view の TRAIN_ACT と道具の絵）。
//    自動テストでは一言・リアクションを出さない（MM_QA_NO_STORY）。
// =========================================================
(function (root) {
  'use strict';
  const ART = './assets/proto/board_art_1010/', TV2 = './assets/fields/ch1a/tiles_v2/';
  const STEP_MS = 240;
  // 2026-10-11 画像演出（ZIP MysticMonsters_Ch1_21Images_FX_Handoff_20261011 の派生＝assets/chapter/fx_1011/。tools/fx1011/derive.py）
  const FX = './assets/chapter/fx_1011/', FXF = { rivalBg: FX + 'ev01_rival_title.webp', rare: FX + 'ev04_rare_marker.webp', gold: FX + 'ev05_gold_burst.webp', clash: FX + 'ev06_rival_clash.webp',
    hg: { 10: FX + 'ev07_hourglass_10.webp', 5: FX + 'ev08_hourglass_5.webp', 1: FX + 'ev09_hourglass_1.webp' } };
  const GOLD_BIG = 150;            // これ以上の G を得たときだけ金貨の演出（100G 以下は従来の小さな表示）
  const TURN_WARN = [10, 5, 1];    // 残りターンの砂時計（各1回・記録は m.raise.field.tw）
  // 2026-10-12 正式：マスの上面12種（assets/fields/ch1a/tiles_top_1012/＝既存の円盤 tiles_v2/tile_blank の上面へ正式の紋章。珍しい宝箱・分かれ道・合流・専用マスは従来）
  const TOP = './assets/fields/ch1a/tiles_top_1012/';
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
  const diceBusy = () => !!((root.MMDICE3D && root.MMDICE3D.isLocked()) || (root.MMCHD && root.MMCHD.isLocked()));
  const busyGet = () => { try { return !!bBusy || diceBusy(); } catch (e) { return diceBusy(); } };
  const busySet = (v) => { try { bBusy = v; } catch (e) {} };
  const V = { el: null, world: null, key: null, intro: false, path: [] };
  const onBoard = () => !!(V.el && V.el.isConnected);
  const fieldOf = (m) => WD().fieldOf(m);
  function monSrc(m) { const sp = root.MMP10M && root.MMP10M.byId ? root.MMP10M.byId(m.sp) : null; return sp && sp.image ? sp.image.src : './assets/monsters/2p5d/solamo.webp'; }

  // ---- マスの見た目（全地点）。役割の決まった地点は専用の絵、通常の地点は配置の中身（能力・イベント・休憩・野生・宝箱） ----
  function look(m) {
    const d = D(), f = fieldOf(m), fwdN = {}, inN = {};
    for (const e of d.edges) if (e[3] === 'forward') { fwdN[e[0]] = (fwdN[e[0]] || 0) + 1; inN[e[1]] = (inN[e[1]] || 0) + 1; }
    return (id) => {
      const n = d.nodes[id], role = n ? n[2] : '', out = { src: TV2 + 'tile_blank.webp', mark: '', used: false };
      if (ART_TILE[role]) out.src = ART + ART_TILE[role];
      else if (role === 'mandatory_rival') out.src = TOP + 'tile_rival.webp';
      else if ((fwdN[id] || 0) > 1) out.src = TV2 + 'tile_branch.webp';
      else if ((inN[id] || 0) > 1) out.src = ART + 'tile_merge.webp';
      else if (role === 'ordinary_tile' && f) {
        const t = f.tiles[id];
        if (t) {
          out.used = f.used[id] != null;
          if (t.t === 'stat') out.src = TOP + 'tile_stat_' + STAT_FILE[t.k] + '.webp';
          else if (t.t === 'event') out.src = TOP + 'tile_event.webp';
          else if (t.t === 'rest') out.src = TOP + 'tile_meal.webp';   // 食事・焚き火（空腹 −50）
          else if (t.t === 'wild') out.src = TOP + (t.rare ? 'tile_rare_monster.webp' : 'tile_wild_monster.webp');
          else if (t.t === 'treasure') out.src = t.tier === 'rare' ? TV2 + 'tile_treasure_2.webp' : TOP + 'tile_treasure.webp';   // 珍しい宝箱は従来の絵（段階の違いを消さない）
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
    // 2026-10-14 開発29（6）：歩いている途中（node を渡す）も、行き止まりから戻る区間の上なら戻る向きで先を見る（旧：途中は前向き＝行き止まりの側を向いてカメラが一瞬逆へ回っていた）
    let back = node ? (st.back && d.segments[st.back] && d.segments[st.back][3].includes(node) ? st.back : null) : st.back;
    if (!back && !node && c.DEAD_ROLES.includes(c.role(d, at))) { const ix = c.index(d); back = ix.spurs.find((k) => ix.endOf[k] === at) || null; }
    const la = (n, per) => (st.done ? [] : root.MMRF_WORLD.lookahead(d, at, back ? null : first, back, n, per));
    const ahead = la(CAM.fit, CAM.fitPer), near = la(CAM.ahead, CAM.per);   // カメラが入れる地点（先の4・分かれ道の手前は各2）／明るく残す地点（先の5・各3）
    // 道筋＝直前の数地点・今の地点・先の地点（ここ以外のマスは薄く、地面は薄い幕＝選ばなかった道・遠くの道と見分ける）。表示だけ（ルート・セーブは変えない）
    const tr = (st.trail || []).slice(0, node ? Math.max(0, (st.trail || []).lastIndexOf(at)) : undefined).slice(-CAM.behind);
    return { node: at, ahead, focus: [...new Set(tr.concat([at], near))], look: look(m), denOpen: !!st.randOpen };
  }
  // 2026-10-12 試遊修正：カメラを近く（今の道で先の4地点・分かれ道の手前は両方の道を2地点ずつが入る倍率。明るく残す道筋は先の5地点・各3）・モンスター＝マスの幅の 1.2倍・道筋の強調
  // 2026-10-14 Chapter 1 A／B／C 高品質化：盤の絵＝正式13点の派生（MMRF_WORLD の SKIN 'hq1014'）。URL に ?boardSkin=1010（または window.MM_BOARD_SKIN='1010'）で従来の絵＝見比べ・戻すとき
  const skinKey = () => { let q = null; try { q = new URLSearchParams(root.location.search).get('boardSkin') || root.MM_BOARD_SKIN || null; } catch (e) {} return q === '1010' || q === 'old' ? null : 'hq1014'; };
  const CAM = { fit: 4, fitPer: 2, ahead: 5, per: 3, behind: 3, sMin: 2.2, sMax: 5.6, tilePx: [22, 84], monRatio: 1.2, zoomTau: 320 };
  function viewRect() {
    const w = V.el && V.el.querySelector('.wbv'); if (!w) return null;
    const r = w.getBoundingClientRect(), h = V.el.querySelector('.chh'), dk = V.el.querySelector('#wb-ui .chsheet') || V.el.querySelector('#chdock');   // 分かれ道・バトルのシートが出ている間はシートの上まで（モンスターと道の先をシートより上に）
    const top = h ? h.getBoundingClientRect().bottom - r.top + 6 : 80, bottom = dk ? dk.getBoundingClientRect().top - r.top - 6 : r.height - 170;
    return { W: r.width, H: r.height, top, bottom, right: r.width };
  }

  // ---- 画面の部品 ----
  const COIN = '<img class="chh-ic" src="./assets/ui/gold/coin.png" alt="" aria-hidden="true" draggable="false">';
  function placeName(id) { const W = WD(), d = D(); return (W.PLACE && W.PLACE[id]) || (d.nodes[id] && d.nodes[id][2] === 'fixed_reward_dead_end' ? '宝の行き止まり' : ''); }
  // 2026-10-12 開発21（試遊 No.003・004＝D-4）：進行ラインの位置＝GOAL までの最短の地点数（接続を GOAL から逆にたどる・条件は見ない＝道として通れる最短。1回だけ計算）。
  //  P＝(D0 − Dcur) ÷ D0（D0＝START から、Dcur＝今の地点から）を 0〜1 に収める。寄り道・行き止まりで GOAL から遠ざかれば戻る。経過ターンでも最高到達でもない＝「ゴールへの進み具合の目安」
  let DIST = null;
  function goalDist() {
    if (DIST) return DIST; const d = D(), rev = {}; for (const e of d.edges) (rev[e[1]] = rev[e[1]] || []).push(e[0]);
    const out = { GOAL: 0 }, q = ['GOAL']; while (q.length) { const n = q.shift(); for (const p of rev[n] || []) if (out[p] == null) { out[p] = out[n] + 1; q.push(p); } }
    return (DIST = out);
  }
  function progressAt(node) { const g = goalDist(), d0 = g.START || 0, dc = g[node]; if (node === 'GOAL') return 1; if (!d0 || dc == null) return 0; return Math.max(0, Math.min(1, (d0 - dc) / d0)); }
  function faceSrc(m) { const f = root.MMARENA && root.MMARENA.faceSrc ? root.MMARENA.faceSrc(m.sp) : null; return f || monSrc(m); }
  /** 歩いている間は線の上の丸顔だけ動かす（HUD を描き直さない） */
  function progSet(node) { const pc = Math.round(progressAt(node) * 1000) / 10, f = $('#chface'), b = document.querySelector('.wbh .chh-fill'), l = document.querySelector('.wbh .chh-line');
    if (f) f.style.left = pc + '%'; if (b) b.style.width = pc + '%'; if (l) l.setAttribute('aria-label', `ゴールまでの進み具合 ${Math.round(pc)}%`); }
  // 特訓チケットの小さな印（2026-10-12 D-5・仮の線画＝正式の絵ではない。正式アイコンが届いたら差し替える）
  const TIX = '<img class="chh-tk" src="./assets/ui/ticket/training_ticket.png" alt="" aria-hidden="true" decoding="async">';   // 2026-10-12：特訓チケットの正式画像（拳＋月桂樹・assets/ui/ticket/。旧：仮の線画）
  function hudHtml(m) {
    const r = m.raise, fat = Math.round(r.fatigue || 0), lv = fat > 80 ? 'hi' : fat >= 50 ? 'mid' : 'lo', S = gS() || {};   // 2026-10-12 D-2：81 以上で赤（80 までは通常）
    const ph = P8().boardPhase(m), pl = placeName(r.node), pc = Math.round(progressAt(r.node) * 1000) / 10, fs = faceSrc(m);
    return `<header class="chh wbh"><div class="chh-top"><div class="chh-l chh-prog"><div class="chh-cap"><small>Chapter <b>1</b> / ${root.MMP7 ? root.MMP7.CHAPTER_COUNT : 4}</small><b class="chh-nm">はじまりの草原</b><span class="chh-fd" id="chfd">${esc(pl)}</span></div>
      <div class="chh-line" role="img" aria-label="ゴールまでの進み具合 ${Math.round(pc)}%"><span class="chh-se">START</span><div class="chh-track"><i class="chh-fill" style="width:${pc}%"></i><span class="chh-face" id="chface" style="left:${pc}%">${fs ? `<img src="${esc(fs)}" alt="" decoding="async">` : ''}</span></div><span class="chh-se g">GOAL</span></div></div>
      <button class="p9mbtn chh-menu" onclick="p9Menu()" aria-label="メニュー">☰</button></div>
      <div class="chh-r chh-chips"><div class="chh-turn chip">Turn <b id="chturn">${Math.min(r.turnsUsed + (ph === 'roll' ? 1 : 0), r.turnLimit)}</b><small> / ${r.turnLimit}</small></div>
      <div class="chh-fat chip f-${lv}" id="chfat"><span>空腹</span><b>${fat}</b><i style="--f:${fat}%"></i></div>
      <div class="chh-gold chip" id="chgold">${COIN}<b>${S.g | 0}</b></div>
      <div class="chh-tix chip" id="chtix" title="特訓チケット" aria-label="特訓チケット ${S.trainTix | 0}枚">${TIX}<span>特訓</span><b>×${S.trainTix | 0}</b></div></div></header>`;
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
    if (ph === 'roll') def = r.turnsUsed === 0 ? '<b>はじまりの草原</b>　大会会場を目指そう。START でサイコロ（1〜6）を振る。' : tired ? 'お腹がすいて動けない…食べさせるか、休もう。' : 'START でサイコロを振る。休むこともできる。';
    else if (ph === 'move' || ph === 'resolve') def = '移動中…';
    else if (ph === 'branch') def = `分かれ道だ。どちらへ進む？（のこり${r.pend.left}）`;
    const H = Dk.hit || {}, box = (k) => { const h = H[k] || { x: 0, y: 0, w: 0, h: 0 }; return `style="left:${(h.x * 100).toFixed(1)}%;top:${(h.y * 100).toFixed(1)}%;width:${(h.w * 100).toFixed(1)}%;height:${(h.h * 100).toFixed(1)}%"`; };
    const center = ph === 'roll'
      ? `<div class="chstopw chstopw-img${canRoll ? ' on' : ''}" ${box('center')}><button class="chstop chstop-img" id="brollbtn" data-nsfx="1" onclick="MMWB.roll()"${canRoll && !V.intro && !V.cover ? '' : ' disabled'} aria-label="START（サイコロを振る）"><b>START</b></button></div>`
      : `<div class="chstopw chstopw-img" ${box('center')}><button class="chstop chstop-img wait" disabled aria-label="移動中"><b>${(ph === 'move' || ph === 'resolve') && r.pend ? r.pend.roll : '…'}</b></button></div>`;
    const wing = (c) => { const on = (c.k === 'rest' ? canRest : ph === 'roll') && !V.intro && !V.cover; return `<button class="chwing chwing-img ${c.cls} chw-${c.pos}${c.k === 'rest' && tired ? ' must' : ''}" ${box(c.pos)} onclick="${c.on}"${on ? '' : ' disabled'}><b>${c.label}</b>${c.k === 'rest' ? `<i class="chwlbl">空腹 −${root.MMRF_PLAY ? root.MMRF_PLAY.TUNING.restAmount : 10}</i>` : ''}</button>`; };
    // 2026-10-12 D-6：案内欄にフィナの小さな丸顔・2行まで読める（欄を上へ少し広げる）
    return `<div class="chdeck chdeck-img" id="chdock"><div class="wbmsg"><img class="wbmsg-f" src="./assets/npc/fina/closeup/smile.webp" alt="" aria-hidden="true" decoding="async" draggable="false"><p class="chmsg" id="bmsg">${msg || def}</p></div><div class="chcmd chcmd-img" style="--deckar:${Dk.aspect || 3.116}">${Dk.start ? `<img class="chdeck-bg" src="${esc(Dk.start)}" alt="" draggable="false">` : ''}${CMDS.map(wing).join('')}${center}</div></div>`;
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
      if (V.rivalAuto && (r.pend.fx || {}).battleType === 'rival') return '';   // 2026-10-13 開発27（21）：ライバルは演出からそのままバトルへ（案内のシートを出さない。途中で閉じて読み込み直したときだけ従来のシート）
      const fx = r.pend.fx || {}, bt = (cfg().battleTypes || {})[fx.battleType || 'wild'] || { label: 'モンスター' }, fb = root.MMRF_PLAY ? root.MMRF_PLAY.TUNING.wildFatigue : 5;
      return `<div class="chsheet chbat"><small class="chbat-kind">${esc(bt.label)}</small><h3>${esc(bt.encounter || bt.label)}</h3>${bt.note ? `<p class="p9s chbat-note">${esc(bt.note)}</p>` : ''}<p class="p9s">バトルの後は空腹 +${fb}。賞金・ランクアップはありません。</p><button class="p9btn" onclick="bBattleGo()">バトルする</button></div>`;   // 2026-10-12 試遊：遭遇はすべて強制バトル（「やめておく」は出さない）
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
.wbw .wbh .chh-line .chh-se{display:block;position:absolute;top:12px;font:800 8px/1 "Noto Sans JP",sans-serif;letter-spacing:.06em;color:#dfe6f8;text-shadow:0 1px 2px rgba(0,0,0,.8)}
.wbw .wbh .chh-line .chh-se:first-child{left:-2px}.wbw .wbh .chh-line .chh-se.g{right:-4px;color:#f3d98e}
.wbw .wbh .chh .chip,.wbw .wbh.chh .chip{height:27px;background:rgba(4,10,30,.9);border-color:rgba(240,232,212,.7)}
.wbw .wbh .chh-turn{font-size:11.5px;font-weight:700;color:#f0dda8}
.wbw .wbh .chh-turn b,.wbw .wbh .chh-fat b,.wbw .wbh .chh-gold b{font-size:15.5px;color:#fff}
.wbw .wbh .chh-turn small{font-size:11px;color:#dfe6f8}
.wbw .wbh .chh-fat span{font-size:11.5px;font-weight:700;color:#dfe6f8}
.wbw .wbh .chh-fat.f-hi b{color:#ff5c4d}
.wbw .wbh .chh-tix{gap:3px}.wbw .wbh .chh-tix .chh-tk{width:26px;height:18px;flex:none;object-fit:contain}
.wbw .wbh .chh-tix span{font-size:10.5px;font-weight:700;color:#dfe6f8;letter-spacing:0}
.wbw .wbh .chh-tix b{font-size:14px}
#app>.chfw.wbw{--chdeck:calc(clamp(136px,20.6dvh,180px) + 26px + env(safe-area-inset-bottom,0px))}
.wbw .wbmsg{display:flex;align-items:center;gap:7px;margin:0 6px 2px;min-height:38px;padding:3px 10px 3px 4px;border-radius:12px;background:rgba(4,10,30,.62);border:1px solid rgba(217,180,101,.4)}
.wbw .wbmsg:has(.chmsg:empty){display:none}
.wbw .wbmsg .wbmsg-f{flex:none;width:32px;height:32px;border-radius:50%;object-fit:cover;object-position:50% 12%;background:#1d3266;border:1.5px solid #e6bf62}
.wbw .wbmsg .chmsg{flex:1;min-width:0;padding:0;text-align:left;font-size:12.5px;line-height:1.4;-webkit-line-clamp:2}
#app>.chfw.wbw:has(.chbat) .wbmsg{visibility:hidden}
.wbw .wbbr .chroute.spur{border-style:dashed}
.wbw .wb-pop{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);width:min(86%,330px);box-sizing:border-box;padding:12px 14px;border-radius:16px;background:linear-gradient(180deg,rgba(20,36,82,.97),rgba(8,18,46,.97));border:1.5px solid #d9b465;color:#fff;text-align:center;box-shadow:0 8px 22px rgba(0,0,0,.5);pointer-events:auto;animation:wbpop .26s ease-out both;z-index:8}
.wbw .wb-pop.out{animation:wbpopout .2s ease-in forwards}
.wbw .wbcard-dim{position:absolute;inset:0;z-index:9;background:rgba(4,10,28,.58);animation:wbcfade .22s ease-out both;pointer-events:auto}
.wbw .wbcard{position:absolute;left:50%;top:calc(env(safe-area-inset-top,0px) + 92px);transform:translateX(-50%);width:min(92%,384px);z-index:10;color:#fff;text-align:center;animation:wbcin .3s cubic-bezier(.2,.8,.3,1) both;pointer-events:auto}
.wbw .wbcard.out,.wbw .wbcard-dim.out{animation:wbcout .22s ease-in forwards}
@keyframes wbcin{from{opacity:0;transform:translate(-50%,10px) scale(.96)}}@keyframes wbcout{to{opacity:0}}@keyframes wbcfade{from{opacity:0}}
.wbw .wbcard figure{position:relative;margin:0;width:100%;aspect-ratio:3/2;border-radius:14px;overflow:hidden;border:2px solid #d9b465;box-shadow:0 10px 26px rgba(0,0,0,.55),inset 0 0 0 1px rgba(255,240,200,.35);background:#20385e}
.wbw .wbcard figure .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.wbw .wbcard figure.ph .bg{object-position:50% 62%}
.wbw .wbcard figure.ph::after{content:"";position:absolute;inset:0;z-index:1;background:radial-gradient(ellipse 60% 55% at 50% 66%,rgba(255,244,200,.38),transparent 70%),linear-gradient(rgba(8,16,40,.08),rgba(8,16,40,.34))}
.wbw .wbcard figure .mon{position:absolute;left:50%;bottom:5%;height:68%;width:auto;max-width:70%;object-fit:contain;translate:-50% 0;z-index:3;filter:drop-shadow(0 6px 5px rgba(0,0,0,.45))}
.wbw .wbcard figure .tool{position:absolute;z-index:4;height:34%;width:auto;filter:drop-shadow(0 3px 3px rgba(0,0,0,.4))}
.wbw .wbcard figure .tool.back{z-index:2}
.wbw .wbcard .cap{margin:-14px auto 0;position:relative;z-index:4;display:inline-block;max-width:92%;padding:5px 18px 6px;border-radius:999px;background:linear-gradient(#1c3373,#0d1a45);border:1.5px solid #e0b861;font:800 15px/1.3 var(--mm-font-title,serif);box-shadow:0 4px 10px rgba(0,0,0,.45)}
.wbw .wbcard .res{margin:8px auto 0;padding:9px 12px 10px;border-radius:12px;background:linear-gradient(180deg,rgba(20,36,82,.96),rgba(8,18,46,.96));border:1.5px solid #d9b465;box-shadow:0 6px 16px rgba(0,0,0,.45)}
.wbw .wbcard .res:empty{display:none}
.wbw .wbcard .res p{margin:0 0 4px;font-size:13px;line-height:1.5}
.wbw .wbcard .res .rows{display:flex;flex-wrap:wrap;gap:4px 10px;justify-content:center;font-weight:800;font-size:15px}
.wbw .wbcard .res .rows .dn{color:#ffb0a0}
.wbw .wbcard .sbar{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:6px 8px;text-align:left}
.wbw .wbcard .sbar .nm{font:800 15px/1 var(--mm-font-title,serif);color:var(--c,#ffe08a);text-shadow:0 1px 2px #000}
.wbw .wbcard .sbar .tr{position:relative;height:16px;border-radius:9px;border:1.5px solid rgba(255,236,190,.9);background:rgba(4,10,26,.8);overflow:hidden;box-shadow:inset 0 1px 3px rgba(0,0,0,.6)}
.wbw .wbcard .sbar .tr i{position:absolute;left:0;top:0;bottom:0}
.wbw .wbcard .sbar .tr i.old{background:rgba(255,255,255,.2);z-index:1}
.wbw .wbcard .sbar .tr i.new{z-index:2;width:var(--w0,0%);background:var(--fill) left center/100% 100% no-repeat;transition:width 1s cubic-bezier(.25,.8,.3,1)}
.wbw .wbcard .sbar.on .tr i.new{width:var(--w1,0%)}
.wbw .wbcard .sbar .v{font:800 16px/1 var(--mm-font-body,sans-serif);min-width:3.2em;text-align:right}
.wbw .wbcard .sbar .up{grid-column:1/-1;text-align:center;font:900 20px/1.1 var(--mm-font-title,serif);color:var(--c,#ffe08a);text-shadow:0 2px 4px #000,0 0 10px rgba(255,230,150,.5);opacity:0;transform:scale(.6);transition:opacity .25s,transform .35s cubic-bezier(.3,1.6,.5,1)}
.wbw .wbcard .sbar.on .up{opacity:1;transform:none}
html:has(#wb-ui .wbcard) .mmtalk .mmtalk-fig{display:none}   /* 挿絵カードの間はフィナの立ち絵を出さない（挿絵を隠さない・名前の札と会話の窓は出す） */
@media (prefers-reduced-motion:reduce){.wbw .wbcard,.wbw .wbcard-dim{animation:none}.wbw .wbcard .sbar .tr i{transition:none}}
.wbw .wb-pop img.art{display:block;width:100%;aspect-ratio:3/2;object-fit:cover;border-radius:10px;margin:0 0 8px}
.wbw .wb-pop .wbmeal{position:relative;width:100%;aspect-ratio:3/2;border-radius:10px;overflow:hidden;margin:0 0 8px}.wbw .wb-pop .wbmeal .bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.wbw .wb-pop .wbmeal .mon{position:absolute;right:4%;bottom:3%;height:52%;width:auto;filter:drop-shadow(0 4px 4px rgba(0,0,0,.35));animation:wbmeal 1.1s ease-in-out infinite alternate}@keyframes wbmeal{to{transform:translateY(-3%)}}
@media (prefers-reduced-motion:reduce){.wbw .wb-pop .wbmeal .mon{animation:none}}
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
.wbv .rfw-mon .mon{display:block;position:relative;width:100%!important;height:auto!important}   /* 2026-10-12 試遊：index.html の共通の .mon{width:96px;height:96px} が効いて、絵が箱より大きく右下へずれていた（マスの上に立たない） */
.wbv .rfw-mon .mon>img{display:block;width:100%;height:auto;filter:drop-shadow(0 3px 2px rgba(0,0,0,.45))}
:is(#rfp,.wbv) .rfw-mon .mon>img.wk{position:absolute;left:50%;bottom:calc((1 - var(--sth,1)) * 100%);width:auto;height:calc(100% * var(--wkh,1) * var(--sth,1));max-width:none;translate:-50% calc(var(--wkf,0) * 100%);opacity:0;animation:none}
:is(#rfp,.wbv) .rfw-mon:is(.wk-on,.wk-idle) .mon:has(>img.wk.on)>img.st{opacity:0}
:is(#rfp,.wbv) .rfw-mon:is(.wk-on,.wk-idle) .mon>img.wk.on{opacity:1}
.wbv .rfw-mon.wk-flip .mon>img.wk{scale:-1 1}
.wbv .rfw-mon.bob .mon{animation:wbbob .32s ease-in-out infinite}
.wbv .rfw-mon.st-flip .mon img.st{scale:-1 1}   /* 2026-10-13 開発27（13）：横の1歩（横向きの歩行の絵が無い種族）は静止の立ち絵を進む向きへ */
.wbw .chf-tact,.wbw .chf-tact-tx{z-index:9}
@keyframes wbbob{50%{translate:0 -6%}}
.wbw .wbx{z-index:22}
.wbw #wb-ui:has(.wbx) .chsheet{visibility:hidden}
/* 2026-10-13 開発27（18）：イベントのサイコロの案内（「サイコロを振る」）と、サイコロの後ろの帯（盤の上・サイコロ（z30）より奥・HUD と操作欄より下） */
.wbw .wbdask{text-align:center}.wbw .wbdask h3{margin:0 0 4px}.wbw .wbdask .p9s{margin:0 0 10px;line-height:1.55}
.wbw .wbdask .wbdgo{display:block;width:min(100%,260px);margin:0 auto;padding:11px 0;border-radius:999px;border:1.5px solid #e8c66e;background:linear-gradient(#b8283a,#6e0f1e);color:#fff;font:800 16px/1.2 var(--mm-font-head);letter-spacing:.06em;box-shadow:0 3px 10px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.25)}
.wbv .wbdband{position:absolute;left:0;right:0;z-index:29;height:clamp(120px,24dvh,190px);transform:translateY(-50%);pointer-events:none;background:linear-gradient(180deg,rgba(8,16,44,0),rgba(8,16,44,.78) 18%,rgba(12,26,66,.86) 50%,rgba(8,16,44,.78) 82%,rgba(8,16,44,0));animation:wbdbIn .26s ease-out both}
.wbv .wbdband::before,.wbv .wbdband::after{content:"";position:absolute;left:0;right:0;height:1.5px;background:linear-gradient(90deg,rgba(232,198,110,0),#e8c66e 20%,#fff1c4 50%,#e8c66e 80%,rgba(232,198,110,0))}
.wbv .wbdband::before{top:16%}.wbv .wbdband::after{bottom:16%}
.wbv .wbdband.out{opacity:0;transition:opacity .24s}
@keyframes wbdbIn{from{opacity:0;transform:translateY(-50%) scaleY(.4)}to{opacity:1;transform:translateY(-50%)}}
.wbw .wbx-veil{position:absolute;inset:0;background:radial-gradient(ellipse 85% 60% at 50% 44%,rgba(6,12,30,.25) 20%,rgba(4,8,22,.78) 72%,rgba(3,6,16,.9));animation:cefade .3s ease-out both}
.wbw .wbx-w.rare .wbx-veil{background:radial-gradient(ellipse 85% 60% at 50% 44%,rgba(40,8,60,.3) 20%,rgba(18,4,30,.8) 72%,rgba(10,2,18,.92))}
.wbw .wbx-stage{position:absolute;left:50%;top:42%;width:min(74vw,310px);height:min(74vw,310px);transform:translate(-50%,-50%)}
.wbw .wbx-glow{position:absolute;left:50%;bottom:4%;width:92%;height:26%;transform:translateX(-50%);border-radius:50%;background:radial-gradient(closest-side,rgba(255,228,150,.55),rgba(255,200,110,.18) 60%,rgba(0,0,0,0));animation:wbxglow .6s ease-out both}
.wbw .wbx-w.rare .wbx-glow{background:radial-gradient(closest-side,rgba(214,150,255,.7),rgba(150,70,230,.25) 60%,rgba(0,0,0,0));box-shadow:0 0 30px 8px rgba(170,90,255,.25)}
.wbw .wbx-mon{position:absolute;left:50%;bottom:12%;height:76%;width:auto;max-width:100%;object-fit:contain;transform:translateX(-50%);filter:drop-shadow(0 8px 12px rgba(0,0,0,.6));animation:wbxmon .55s .05s cubic-bezier(.2,.8,.3,1) both}
.wbw .wbx-w.sil .wbx-mon{visibility:hidden}
.wbw .wbx-sil{position:absolute;left:0;right:0;bottom:12%;height:76%;background:#05070d;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-position:center bottom;mask-position:center bottom;-webkit-mask-size:contain;mask-size:contain;filter:drop-shadow(0 0 10px rgba(255,236,190,.55));animation:wbxmon .55s .05s cubic-bezier(.2,.8,.3,1) both}
.wbw .wbx-card{position:absolute;left:50%;bottom:calc(var(--chdeck,150px) + 18px);transform:translateX(-50%);width:min(88vw,360px);padding:9px 14px 11px;border-radius:12px;background:linear-gradient(180deg,rgba(14,26,62,.96),rgba(8,16,40,.96));border:1.5px solid #d9b45c;box-shadow:inset 0 0 0 3px rgba(9,18,44,.95),inset 0 0 0 4px rgba(217,180,92,.55),0 8px 22px rgba(0,0,0,.5);color:#fff;text-align:center;animation:wbxcard .4s .12s cubic-bezier(.2,.8,.3,1) both}
.wbw .wbx-card small{display:block;font:700 12.5px/1.4 "Noto Sans JP",sans-serif;color:#f1d68e;letter-spacing:.04em}
.wbw .wbx-nm{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:3px}
.wbw .wbx-nm b{font:700 20px/1.25 "Shippori Mincho",serif;letter-spacing:.06em}
.wbw .wbx-nm em{font:700 11.5px/1 "Noto Sans JP",sans-serif;font-style:normal;padding:3px 8px;border-radius:99px;color:#fff3c8;background:linear-gradient(180deg,#8a3ccf,#5a1e98);border:1px solid #e3c06a}
.wbw .wbx-r{background:#05060f}
.wbw .wbx-rbg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;animation:wbxrbg .35s ease-out both;transition:opacity .4s,transform .9s ease-out}
.wbw .wbx-r.p2 .wbx-rbg{opacity:.42;transform:scale(1.08)}
.wbw .wbx-rstage{position:absolute;left:50%;bottom:calc(var(--chdeck,150px) + 70px);width:min(92vw,380px);height:min(64dvh,520px);transform:translateX(-50%);opacity:0;transition:opacity .35s}
.wbw .wbx-r.p2 .wbx-rstage{opacity:1}
.wbw .wbx-ryu{position:absolute;left:4%;bottom:0;height:100%;width:auto;max-width:62%;object-fit:contain;object-position:bottom;filter:drop-shadow(0 0 14px rgba(255,90,70,.45)) drop-shadow(0 10px 14px rgba(0,0,0,.6));translate:0 8%;transition:translate .6s cubic-bezier(.2,.8,.3,1)}
.wbw .wbx-partner{position:absolute;right:0;bottom:6%;height:58%;width:auto;max-width:56%;object-fit:contain;object-position:bottom;filter:drop-shadow(0 0 12px rgba(120,190,255,.5));translate:10% 0;transition:translate .7s .1s cubic-bezier(.2,.8,.3,1)}
.wbw .wbx-r.p2 .wbx-ryu,.wbw .wbx-r.p2 .wbx-partner{translate:0 0}
.wbw .wbx-card.r{opacity:0;animation:none;transition:opacity .3s .2s;border-color:#e0705a;box-shadow:inset 0 0 0 3px rgba(30,6,10,.95),inset 0 0 0 4px rgba(224,112,90,.55),0 8px 22px rgba(0,0,0,.5);background:linear-gradient(180deg,rgba(54,10,16,.96),rgba(26,6,12,.96))}
.wbw .wbx-card.r small{letter-spacing:.42em;color:#ffc9a8}
.wbw .wbx-r.p2 .wbx-card.r{opacity:1}
.wbw .wbx-clash{position:absolute;left:50%;top:44%;width:min(118vw,520px);transform:translate(-50%,-50%) scale(.55);opacity:0;pointer-events:none}
.wbw .wbx-r.p3 .wbx-clash{animation:wbxclash .34s ease-out both}
.wbw .wbx-r.p3 .wbx-rstage{animation:wbxshake .3s linear both}
.wbw .wbx-gold{position:absolute;inset:0;z-index:23;pointer-events:none;display:flex;align-items:center;justify-content:center;flex-direction:column;transition:opacity .22s}
.wbw .wbx-gold.out,.wbw .wbx-hg.out{opacity:0}
.wbw .wbx-gb{width:min(92vw,380px);height:auto;animation:wbxgb 1.1s cubic-bezier(.2,.8,.3,1) both}
.wbw .wbx-gold b{position:absolute;top:calc(50% + min(26vw,110px));display:flex;align-items:center;gap:6px;padding:6px 16px;border-radius:99px;font:800 26px/1 "Noto Sans JP",sans-serif;color:#fff2b8;text-shadow:0 2px 0 #7a4a00,0 0 12px rgba(255,200,80,.9);background:rgba(20,14,4,.55);border:1.5px solid #e8c062;animation:wbxcard .4s .15s cubic-bezier(.2,.8,.3,1) both}
.wbw .wbx-gold b img{width:26px;height:26px}
.wbw .wbx-hg{position:absolute;left:50%;top:calc(env(safe-area-inset-top,0px) + 96px);transform:translateX(-50%);z-index:20;pointer-events:none;display:flex;align-items:center;gap:2px;padding:0 14px 0 0;border-radius:99px;background:linear-gradient(90deg,rgba(8,16,40,.0),rgba(8,16,40,.86) 22%,rgba(8,16,40,.86) 80%,rgba(8,16,40,0));transition:opacity .25s;animation:wbxhg .45s cubic-bezier(.2,.8,.3,1) both}
.wbw .wbx-hg img{width:96px;height:auto;margin:-14px -10px}
.wbw .wbx-hg b{font:700 15px/1 "Noto Sans JP",sans-serif;color:#f4e2b2;white-space:nowrap}
.wbw .wbx-hg b em{font-style:normal;font-size:22px;color:#ffe08a}
.wbw .wbx-hg.mid img{width:120px}
.wbw .wbx-hg.mid b em{color:#ffb35c}
.wbw .wbx-hg.hi img{width:136px}
.wbw .wbx-hg.hi b{font-size:17px}
.wbw .wbx-hg.hi b em{color:#ff6b5c;font-size:26px}
.wbw .wbx-hg.hi{animation:wbxhg .45s cubic-bezier(.2,.8,.3,1) both,wbxpulse .7s .45s ease-in-out 2}
:is(#rfp,.wbv) .rfw-mark{animation:rfwmk 2.4s ease-in-out infinite}
@keyframes rfwmk{50%{translate:0 -7%;filter:drop-shadow(0 0 13px rgba(190,110,255,.95))}}   /* 2026-10-12：紫の光がゆっくり脈打つ（点滅にしない） */
:is(#rfp,.wbv) .rfw-mark.dim{animation:none}
@keyframes wbxglow{from{opacity:0;transform:translateX(-50%) scale(.6)}}
@keyframes wbxmon{from{opacity:0;translate:0 10%;scale:.86}}
@keyframes wbxcard{from{opacity:0;translate:0 12px}}
@keyframes wbxrbg{from{opacity:0;transform:scale(1.04)}}
@keyframes wbxclash{0%{opacity:0;transform:translate(-50%,-50%) scale(.5)}35%{opacity:1;transform:translate(-50%,-50%) scale(1.04)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.16)}}
@keyframes wbxshake{25%{translate:-6px 2px}50%{translate:5px -2px}75%{translate:-3px 1px}}
@keyframes wbxgb{0%{opacity:0;transform:scale(.4)}40%{opacity:1;transform:scale(1.04)}100%{opacity:.85;transform:scale(1.12)}}
@keyframes wbxhg{from{opacity:0;translate:0 -10px}}
@keyframes wbxpulse{50%{scale:1.06}}
.wbw .wbrelay{position:absolute;inset:0;z-index:9;background:#0b1636;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;transition:opacity .56s ease;pointer-events:auto}
.wbw .wbrelay.out{opacity:0;pointer-events:none}
.wbw .wbrelay .wbr-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.wbw .wbrelay .wbr-t{position:absolute;left:12px;right:12px;top:50%;transform:translateY(calc(-50% - 4dvh));text-align:center;color:#fff6dc;pointer-events:none;padding:18px 0 16px;background:radial-gradient(ellipse 70% 60% at 50% 50%,rgba(6,12,30,.66),rgba(6,12,30,0) 76%);transition:opacity .36s ease}
.wbw .wbrelay .wbr-t i{display:inline-block;font-style:normal;opacity:0;transform:translateX(-14px);filter:blur(2px)}
.wbw .wbrelay.ton .wbr-t i{opacity:1;transform:none;filter:none;transition:opacity .42s ease var(--d),transform .42s cubic-bezier(.2,.8,.3,1) var(--d),filter .42s ease var(--d)}
.wbw .wbrelay.tout .wbr-t{opacity:0}
.wbw .wbrelay .wbr-t small{display:flex;align-items:center;justify-content:center;gap:10px;font:800 16.5px/1.2 "Shippori Mincho",serif;letter-spacing:.3em;color:#ffe9a8;text-shadow:0 1px 0 rgba(40,24,0,.95),0 0 4px rgba(0,0,0,.9),0 0 12px rgba(0,0,0,.75)}
.wbw .wbrelay .wbr-t b{display:block;margin-top:8px;font:800 clamp(30px,9.6vw,42px)/1.15 "Shippori Mincho",serif;letter-spacing:.06em;color:#fff4d6;text-shadow:0 1px 0 #b98a2e,0 2px 0 #7a5414,0 0 10px rgba(255,214,120,.55),0 3px 14px rgba(0,0,0,.75)}
.wbw .wbrelay .wbr-ln{display:inline-block;width:min(16vw,64px);height:1.5px;background:linear-gradient(90deg,rgba(232,198,110,0),#e8c66e);position:relative}
.wbw .wbrelay .wbr-ln.r{background:linear-gradient(90deg,#e8c66e,rgba(232,198,110,0))}
.wbw .wbrelay .wbr-orn{display:flex;align-items:center;justify-content:center;gap:8px;margin-top:6px;font-size:18px;line-height:1;color:#e8c66e;text-shadow:0 0 6px rgba(255,214,120,.6),0 1px 2px rgba(0,0,0,.7);opacity:0;transition:opacity .6s ease .9s}
.wbw .wbrelay.ton .wbr-orn{opacity:1}
.wbw .wbrelay .wbr-orn .wbr-ln{width:min(26vw,104px)}
.wbw .wbrelay .wbr-load{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 28px);transform:translateX(-50%);display:flex;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;background:rgba(8,15,34,.72);border:1px solid rgba(217,180,101,.6);color:#f3e7c4;font-size:12.5px;font-weight:700}
.wbw .wbrelay .wbr-load i{width:12px;height:12px;border-radius:50%;border:2px solid rgba(243,231,196,.35);border-top-color:#e8c66e;animation:wbrspin .9s linear infinite}
.wbw .wbrelay .wbr-err{display:none;position:relative;flex-direction:column;align-items:center;gap:8px;padding:14px 16px;margin:0 16px;border-radius:14px;background:rgba(8,15,34,.9);border:1.5px solid #d9b465;color:#fff;text-align:center}
.wbw .wbrelay .wbr-err p{margin:0 0 4px;font-size:13.5px}
.wbw .wbrelay.slow .wbr-err{display:flex}
@keyframes wbrspin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.wbw .wbrelay{transition-duration:.2s}.wbw .wbrelay .wbr-load i{animation:none}}
@media (prefers-reduced-motion:reduce){.wbw .wbrelay .wbr-t i,.wbw .wbrelay .wbr-orn{opacity:1!important;transform:none!important;filter:none!important;transition:none!important}}
@media (prefers-reduced-motion:reduce){.wbw .wb-pop,.wbw .wb-pop.out,.wbv .rfw-mon .mon,.wbw .wbx *,.wbw .wbx-gold *,.wbw .wbx-hg,:is(#rfp,.wbv) .rfw-mark{animation:none!important}}`
    + (root.MMREACT ? Object.entries(root.MMREACT.MOTIONS).map(([k, v]) => `.wbv .rfw-mon.mrx-${k} .mon,.wbw .wbcard figure.mrx-${k} .mon{animation:mrx-${k} ${v.ms}ms cubic-bezier(.4,0,.3,1)}`).join('') : '');
    document.head.appendChild(s);
  }
  function release() { sprStop(); if (V.intro || V.cover) busySet(false); if (V.cover) { V.cover.remove(); V.cover = null; } if (V.world) { try { V.world.destroy(); } catch (e) {} } V.world = null; V.el = null; V.key = null; V.intro = false; }
  function ensureView(m) {
    const f = fieldOf(m), vis = root.MMWD && root.MMWD.visualOf ? root.MMWD.visualOf(m) : 'A', key = `${m.uid}:${f.layoutSeed}:${vis}`, app = $('#app');   // 2026-10-14 Chapter 1 B／C：景観のパターンも鍵に
    if (V.el && V.key === key) { if (!V.el.isConnected) { app.innerHTML = ''; app.appendChild(V.el); } return false; }
    release(); css();
    app.innerHTML = '<div class="chfw wbw" id="wbw"><div class="wbv" id="wbv"></div><div class="chf-ui" id="wb-ui"></div></div>';
    V.el = $('#wbw'); V.key = key;
    if (root.MMRF_WORLD) V.world = root.MMRF_WORLD.create(V.el.querySelector('.wbv'), D(), root.MMRF_PLAY, { view: viewRect, monSrc: monSrc(m), art: { base: ART, road: 'strip' },
      focus: true, veil: false, xray: true, hideLm: ['START', 'LOWER_GATE', 'UPPER_GATE'], ahead: CAM.ahead,   // 2026-10-13 開発27（11・15）：開始地点の門・中央の門2か所（下門・上門）の飾りの絵は出さない（マス・道・判定はそのまま）
      sMin: CAM.sMin, sMax: CAM.sMax, tilePx: CAM.tilePx, monRatio: CAM.monRatio, zoomTau: CAM.zoomTau, heading: true, visual: vis, skin: skinKey() });   // visual＝景観のパターン（A／B／C。配置の中の visualPattern）   // 2026-10-14 開発29（6）：後ろから追うカメラ（進む向きが画面の上）
    V.el.querySelectorAll('.rfw-title').forEach((e) => e.remove());   // 2026-10-13 開発25 H：全景の地図の上に大きな題字を出さない（題字は中継カットの間だけ＝cover）。HUD の Chapter 表示は別（残す）
    sprSetup(m);
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
    if (fresh && root.MMDICE3D && root.MMDICE3D.warm) root.MMDICE3D.warm('official');   // 2026-10-13 開発25 E：正式サイコロの6面を先に読む
    if (!root.MMDICE3D && root.MMCHD && V.dice !== 6) { const dc = cfg().dice || {}; root.MMCHD.configure({ ...dc, sides: 6 }); V.dice = 6; root.MMCHD.preload(); }
    try { for (const e of [$('#app'), document.querySelector('main'), document.scrollingElement]) if (e && e.scrollTop) e.scrollTop = 0; } catch (e) {}
    if (ph === 'goal') { paint(m, msg, null, fresh); arrive(m, fresh); return true; }
    paint(m, msg, null, fresh);
    rareMark(m); fxPreload();
    if (ph === 'roll') setTimeout(() => turnWarn(m), 600);
    const wantIntro = fresh && ph === 'roll' && r.turnsUsed === 0 && r.node === 'START' && !f.introSeen && V.world && !root.MM_QA_NO_INTRO;
    if (fresh && V.world && V.world.ready) cover(m, wantIntro);   // 2026-10-12 開発21：描き終わるまで盤を見せない（出発の全景は中継カットから）
    else if (wantIntro) intro(m);
    else if (ph === 'roll' && r.turnsUsed === 0 && !V.intro && !V.cover) setTimeout(() => { if (onBoard() && active(m) && P8().boardPhase(m) === 'roll' && !busyGet()) storyAt(m, 'start').then((shown) => { if (shown && onBoard()) paint(m); }); }, 350);
    if (ph === 'branch') setTimeout(() => { if (onBoard() && active(m) && P8().boardPhase(m) === 'branch' && !busyGet()) storyAt(m, 'branch', { segs: (m.raise.pend && m.raise.pend.segs) || [] }); }, 350);
    if (ph === 'move') setTimeout(() => { if (onBoard()) walk(); }, 300);
    else if (ph === 'resolve') setTimeout(() => { if (onBoard()) resolve(); }, 300);
    return true;
  }
  // ---- 2026-10-12 開発21（試遊 No.002・006：C-3〜6）：盤の絵がそろうまで中継カットで覆う ----
  //  出発（開始の俯瞰がある回）＝既存の「はじまりの草原」の全景（ch1_intro_overview.webp・出発準備のカードと同じ絵）＋題字＋小さな「読み込み中…」。
  //  途中から再開した回＝暗い幕と「読み込み中…」だけ。描き終わったら（絵の読み込み・全区画・景物とマスのデコード＝MMRF_WORLD の ready）2フレーム待って
  //  実際の盤の全景へクロスフェード → 全景を短く見せる → START へ寄る（intro）。9秒たっても終わらなければ「もう一度読み込む」「タイトルへ戻る」（出発は保存済み＝つづきから同じ所）。
  //  覆っている間は操作できない（START・コマンドは押せない＝二重に出発・二重に進まない）
  const RELAY = { src: './assets/fields/ch1a/intro/ch1_intro_overview.webp', min: 700, slow: 9000, fade: 560 };
  // 2026-10-13 開発25 G／H：題字（CHAPTER 1／はじまりの草原）は中継カットの画面の中央に、左から1文字ずつすべるように出す（TITLE）。
  //  順＝導入の絵と題字 → 題字を消す（outMs）→ 地図の全景（クロスフェード）→ START へ寄る。地図の上には題字を残さない（全景の題字 .rfw-title は ensureView で外す）
  //  視差を減らす設定では動かさない（はじめから全部出す）。題字が出そろうまで（min）は覆いを外さない
  const TITLE = Object.freeze({ lead: 260, gap: 55, nameGap: 95, inMs: 420, hold: 650, outMs: 360, waitMs: 1500 });
  const TITLE_CH = 'CHAPTER 1', TITLE_NAME = 'はじまりの草原';
  const titleDone = () => TITLE.lead + TITLE_CH.length * TITLE.gap + 140 + TITLE_NAME.length * TITLE.nameGap + TITLE.inMs + TITLE.hold;
  function titleHtml() {
    const ch = (t, gap, base) => [...t].map((c, i) => `<i style="--d:${base + i * gap}ms">${c === ' ' ? '&nbsp;' : c}</i>`).join('');
    const a = ch(TITLE_CH, TITLE.gap, TITLE.lead), b = ch(TITLE_NAME, TITLE.nameGap, TITLE.lead + TITLE_CH.length * TITLE.gap + 140);
    return `<div class="wbr-t" aria-label="CHAPTER 1 はじまりの草原"><small aria-hidden="true"><span class="wbr-ln"></span>${a}<span class="wbr-ln r"></span></small><b aria-hidden="true">${b}</b><span class="wbr-orn" aria-hidden="true"><span class="wbr-ln"></span>⚜<span class="wbr-ln r"></span></span></div>`;
  }
  function cover(m, withIntro) {
    if (V.cover) V.cover.remove();
    const el = document.createElement('div'); el.className = 'wbrelay' + (withIntro ? ' art' : ''); el.setAttribute('role', 'status');
    el.innerHTML = (withIntro ? `<img class="wbr-img" src="${RELAY.src}" alt="" draggable="false" decoding="async">${titleHtml()}` : '')
      + '<div class="wbr-load"><i aria-hidden="true"></i><span>読み込み中…</span></div><div class="wbr-err"><p>読み込みに時間がかかっています。</p><button class="p9btn" data-act="retry">もう一度読み込む</button><button class="p9btn2" data-act="back">タイトルへ戻る</button></div>';
    V.el.appendChild(el); V.cover = el; busySet(true); paint(m);   // 覆っている間は START・コマンドを押せない形で描き直す
    const calm = !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
    // 題字は導入の絵が見えてから出す（濃紺の幕の上に題字だけが先に出ない）。絵が読めない・遅いときは TITLE.waitMs で出す。題字の尺はそこから数える
    let tStart = Date.now();
    const titleIn = !withIntro ? Promise.resolve() : new Promise((done) => {
      const img = el.querySelector('.wbr-img'); let fin = false;
      const on = () => { if (fin) return; fin = true; clearTimeout(tm); root.requestAnimationFrame(() => { tStart = Date.now(); el.classList.add('ton'); done(); }); };
      const tm = setTimeout(on, TITLE.waitMs);
      if (!img || (img.complete && img.naturalWidth)) on();
      else { img.addEventListener('load', () => { (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(on); }, { once: true }); img.addEventListener('error', on, { once: true }); }
    });
    const minMs = withIntro ? (calm ? RELAY.min : Math.max(RELAY.min, titleDone())) : 0;
    const world = V.world, slow = setTimeout(() => { if (V.cover === el) el.classList.add('slow'); }, RELAY.slow);
    el.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('button[data-act]'); if (!b || V.cover !== el) return;
      clearTimeout(slow); V.cover = null; busySet(false);
      if (b.dataset.act === 'retry') { release(); board(); } else { try { root.p8Suspend(); } catch (x) {} } });
    Promise.all([world.ready(), titleIn]).then(([ok]) => {
      if (!ok || V.cover !== el || V.world !== world) return;
      setTimeout(() => {
        if (V.cover !== el) return;
        const go = () => root.requestAnimationFrame(() => root.requestAnimationFrame(() => {
          if (V.cover !== el) return; clearTimeout(slow); V.cover = null;
          if (withIntro) intro(m); else { busySet(false); const S = gS(), mm = S && S.m; if (active(mm) && onBoard()) board(); }   // 覆いのあと＝途中の移動・分かれ道・出発の一言をここから（board() の続きの処理）
          el.classList.add('out'); setTimeout(() => el.remove(), RELAY.fade + 60);
        }));
        if (withIntro) { el.classList.add('tout'); setTimeout(go, TITLE.outMs); } else go();   // 題字を先に消してから地図へ（地図の上に題字を残さない。視差を減らす設定でも消える（透明になる）のを待つ＝動きはない）
      }, Math.max(0, minMs - (Date.now() - tStart)));
    });
  }
  function intro(m) {
    const f = fieldOf(m); f.introSeen = true; doSave();   // 先に「見た」を保存（途中で再読み込みしても二度出ない）
    V.intro = true; V.el.classList.add('wb-intro'); busySet(true); paint(m);
    V.world.intro(() => { V.intro = false; busySet(false); if (V.el) V.el.classList.remove('wb-intro'); feel('chapter.start'); if (onBoard() && active(m)) { paint(m); storyAt(m, 'start').then((shown) => { if (shown && onBoard()) paint(m); }); } });
  }

  // ---- 歩行アニメ（ch1a.js の monsterSprites＝その場歩行の絵。全コマを重ねて置き、見せるコマだけ切り替える＝src を差し替えない）。
  //  2026-10-11 向きの切り替え：種族ごとに back（奥へ）・front（手前へ）・side（横へ）の3つのセット（monsterSprites[種族].dirs）。
  //  1歩の向きは画面の上の向き（盤の傾き 40° で縦は cos40° に縮む）から決める＝横の動き（縦が横の 0.35 倍未満・続けて横なら 0.45 倍）は side、
  //  上へは back・下へは front。セットの絵が右向き（face 'right'）・左向き（'left'）なら進む向きで左右反転（3/4 の絵は1組で左右を兼ねる）。
  //  無いセットは代わり（back・front が無ければ side、side が無ければ直前の縦のセット、どれも無ければ静止の絵で小さく弾む＝.bob）。
  //  止まったら front の絵があればその idle のコマ、無ければ静止の立ち絵（2.5D の正式画像）。----
  const TILT_COS = Math.cos(40 * Math.PI / 180), DIRS = ['back', 'front', 'side'];
  const SPR = { sets: {}, stand: 'none', cur: null, flip: false, lat: false, raf: 0, phase: 0, last: 0, frame: '', on: false };
  const monEl = () => (V.el ? V.el.querySelector('.rfw-mon') : null);
  /** 種族の歩行セット：dirs の { use:'walk', …上書き } を解決する。dirs が無い古い config は walk を back として使う */
  function dirSets(spr) {
    const out = {}; if (!spr) return out;
    const ok = (w) => w && Array.isArray(w.frames) && w.frames.length;
    const dirs = spr.dirs || (ok(spr.walk) ? { back: { use: 'walk' } } : {});
    for (const k of DIRS) {
      const e = dirs[k]; if (!e) continue;
      const base = typeof e.use === 'string' ? spr[e.use] : null, w = base ? Object.assign({}, base, e) : e;
      if (ok(w)) out[k] = { frames: w.frames, fps: w.fps || 12, idle: w.idle || 0, h: w.h || 0.9, foot: w.foot || 0, face: w.face || 'none' };
    }
    return out;
  }
  /** 1歩の向き → 使うセットと左右反転（純粋な関数。dx・dy は世界の座標の差。prev は直前の結果） */
  function pickDir(dx, dy, sets, prev, stand) {
    prev = prev || {}; sets = sets || {};
    const sy = dy * TILT_COS, ax = Math.abs(dx), ay = Math.abs(sy);
    if (!ax && !ay) return { set: prev.set || null, flip: !!prev.flip, lat: !!prev.lat };
    const lat = ay < ax * (prev.lat ? 0.45 : 0.35);
    let set;
    if (lat && sets.side) set = 'side';
    else if (lat) set = null;   // 2026-10-13 開発27（13）：横向きの歩行の絵が無い種族の横の1歩は、静止の立ち絵（2.5D）を進む向きに向けて小さく弾む（旧：直前の後ろ姿のまま横へ進み、道と向きが合わなかった）
    else if (sy < 0) set = sets.back ? 'back' : sets.side ? 'side' : null;
    else set = sets.front ? 'front' : sets.side ? 'side' : null;
    const face = set ? sets[set].face : (stand || 'none');   // 静止の立ち絵の向き（monsterSprites[種族].standFace）
    let flip = false;
    if (face === 'right' || face === 'left') flip = (ax < 0.15 * Math.hypot(dx, sy) && prev.set === set) ? !!prev.flip : (face === 'right' ? dx < 0 : dx > 0);
    return { set, flip, lat };
  }
  function sprSetup(m) {
    sprStop(); SPR.sets = {}; SPR.cur = null; SPR.flip = false; SPR.lat = false; SPR.frame = '';
    const el = monEl(); if (!el) return;
    const st = el.querySelector('img'); if (!st) return;
    st.classList.add('st');
    const box = document.createElement('span'); box.className = 'mon'; el.insertBefore(box, st); box.appendChild(st);
    const P = root.MMP10M, key = P && P.keyOf ? P.keyOf(m.sp) : null, spr = key && cfg().monsterSprites ? cfg().monsterSprites[key] : null;
    SPR.sets = dirSets(spr); SPR.stand = (spr && spr.standFace) || 'none';
    // 2026-10-11：歩行のコマの高さ・足は「静止の立ち絵が実際に見えている高さ」に合わせる（横に広い立ち絵＝ガウルは箱より低く、上に寄せて置かれる）。--sth＝立ち絵の高さ ÷ 箱の高さ
    const fit = () => { const bh = box.offsetHeight, sh = st.offsetHeight; if (bh > 0 && sh > 0) box.style.setProperty('--sth', String(Math.min(1, sh / bh))); };
    if (st.complete) fit(); else st.addEventListener('load', fit, { once: true });
    requestAnimationFrame(fit);
    box.insertAdjacentHTML('beforeend', Object.entries(SPR.sets).map(([k, w]) => w.frames.map((src, i) =>
      `<img class="wk" data-s="${k}" data-i="${i}" style="--wkh:${w.h};--wkf:${w.foot}" src="${esc(src)}" alt="" draggable="false" decoding="async">`).join('')).join(''));
    sprIdle();
  }
  function sprShow(k, i) {
    const el = monEl(), id = k + ':' + i; if (!el || id === SPR.frame) return;
    const next = el.querySelector(`img.wk[data-s="${k}"][data-i="${i}"]`); if (!next || !next.complete) return;   // 読み込み前のコマには切り替えない
    const cur = el.querySelector('img.wk.on'); if (cur) cur.classList.remove('on');
    next.classList.add('on'); SPR.frame = id;
  }
  function sprTick(now) {
    const w = SPR.on && SPR.sets[SPR.cur]; if (!w) { SPR.raf = 0; return; }
    const dt = Math.min(100, now - (SPR.last || now)); SPR.last = now;
    SPR.phase += (dt / 1000) * w.fps; sprShow(SPR.cur, Math.floor(SPR.phase) % w.frames.length);
    SPR.raf = requestAnimationFrame(sprTick);
  }
  /** 止まっている姿：front の idle のコマ（あれば）・無ければ静止の立ち絵 */
  function sprIdle() {
    const el = monEl(); if (!el) return;
    const f = SPR.sets.front; el.classList.toggle('wk-idle', !!f);
    if (!f) return;
    sprShow('front', f.idle);
    // 2026-10-11：読み込み前のコマには切り替えない（sprShow）＝読み終わったら、まだ止まっていればそのコマを出す（それまでは静止の立ち絵のまま＝:has で消さない）
    const img = el.querySelector(`img.wk[data-s="front"][data-i="${f.idle}"]`);
    if (img && !img.complete) img.addEventListener('load', () => { const e2 = monEl(); if (e2 && e2.classList.contains('wk-idle') && !SPR.on) sprShow('front', f.idle); }, { once: true });
  }
  /** 1歩ごと：from → to の向きで見た目を決める（位置は MMRF_WORLD が動かす） */
  function sprWalk(from, to) {
    const el = monEl(), d = D(), a = d.nodes[from], b = d.nodes[to]; if (!el || !a || !b || calm()) return;
    // 2026-10-14 開発29（6）：カメラが進む向きへ回っている＝画面の上での向きで選ぶ（世界の差をカメラの回転 yaw で回す）＝前へ進む1歩は後ろ姿の歩行（back）
    const yw = V.world && V.world.yawGoal ? V.world.yawGoal() * Math.PI / 180 : 0, ddx = b[0] - a[0], ddy = b[1] - a[1];
    const r = pickDir(ddx * Math.cos(yw) - ddy * Math.sin(yw), ddx * Math.sin(yw) + ddy * Math.cos(yw), SPR.sets, { set: SPR.cur, flip: SPR.flip, lat: SPR.lat }, SPR.stand), w = r.set ? SPR.sets[r.set] : null;
    if (r.set !== SPR.cur) SPR.phase = 0;
    SPR.cur = r.set; SPR.flip = r.flip; SPR.lat = r.lat;
    el.classList.remove('wk-idle'); el.classList.toggle('wk-on', !!w); el.classList.toggle('bob', !w); el.classList.toggle('wk-flip', !!w && r.flip); el.classList.toggle('st-flip', !w && r.flip);
    el.dataset.dir = r.set || '';
    if (w) { sprShow(r.set, Math.floor(SPR.phase) % w.frames.length); if (!SPR.on) { SPR.on = true; SPR.last = 0; if (!SPR.raf) SPR.raf = requestAnimationFrame(sprTick); } }
    else SPR.on = false;
  }
  function sprStop() {
    SPR.on = false; if (SPR.raf && root.cancelAnimationFrame) cancelAnimationFrame(SPR.raf); SPR.raf = 0; SPR.phase = 0; SPR.last = 0; SPR.cur = null; SPR.flip = false; SPR.lat = false;
    const el = monEl(); if (el) { el.classList.remove('wk-on', 'bob', 'wk-flip', 'st-flip'); el.dataset.dir = ''; }
    sprIdle();
  }


  // ---- フィナの節目の一言・チュートリアル（MMWD.storyEvents）。見たら記録してから出す（途中で閉じても二度出ない） ----
  async function storyAt(m, trigger, ctx = {}) {
    if (root.MM_QA_NO_STORY || !root.MMNPC || !onBoard() || !WD().storyEvents) return false;
    const S = gS(); if (!S) return false;
    const flags = (S.npcFlags = isObjv(S.npcFlags) ? S.npcFlags : {});
    const P = root.MMP10M, ev = WD().storyEvents(m, trigger, { ...ctx, flags, path: V.path, species: P && P.keyOf ? P.keyOf(m.sp) : null })[0];
    if (!ev) return false;
    WD().markStory(m, ev.id, flags); doSave();
    const was = busyGet(); busySet(true);
    try {
      const lines = (ev.lines || []).map((l) => ({ npc: l.speaker || 'fina', expression: l.expression || 'normal', text: l.text, ...(l.voice ? { voice: l.voice } : {}) }));   // 2026-10-13：行の声
      await root.MMNPC.talk(lines, { kind: 'fina', presentation: ev.presentation === 'talk' ? 'board' : 'compact' });
    } catch (e) {} finally { if (!was) busySet(false); }
    return true;
  }
  const isObjv = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

  // ---- 冒険リアクション（js/chapter/reactions.js）：通常の地点に止まったとき、確率でモンスターのしぐさ → フィナの解釈と選択肢 → 小さな結果 ----
  async function reactionAt(m) {
    const R = root.MMREACT; if (!R || !root.MMNPC || root.MM_QA_NO_STORY || !onBoard()) return '';
    const ev = R.pick(m); if (!ev) return '';
    R.mark(m, ev.id); doSave();
    const el = monEl(); await wait(calm() ? 0 : 200);
    const ms = R.play(el, ev.motion); await wait(calm() ? 0 : Math.min(ms, 900));
    // 2026-10-12 試遊：挿絵カード（共通の挿絵が届くまでは仮の背景）にモンスターを大きく → 同じ動き → 会話と選択肢 → 結果もカードの中
    const card = cardOpen({ art: CARD_ART.react, ph: PH.react, mon: monSrc(m), title: ev.title || '' });
    if (card && !calm()) R.play(card.querySelector('figure'), ev.motion);
    let id = null;
    try { id = await root.MMNPC.talk([{ npc: 'fina', expression: ev.expression, text: ev.line, choices: ev.choices.map((c, i) => ({ id: String(i), label: c.label })) }], { kind: 'fina', presentation: 'compact' }); } catch (e) {}
    const res = R.apply(gS(), m, ev, id == null ? 0 : +id); doSave();
    const nm = (k) => { const d = root.MMP7 && root.MMP7.getItemDef(k); return d ? d.name : k; };
    if (res.kind === 'fatigue' && res.fatigue < 0) feel('rest.recover');
    R.play(el, res.kind === 'none' ? (ev.sp === 3 ? 'stoneReaction' : 'happy') : 'happy');
    const eff = res.kind === 'stat' ? `${labOf(res.key)} +${res.amount}` : res.kind === 'fatigue' ? `空腹 ${res.fatigue < 0 ? '−' : '+'}${Math.abs(res.fatigue)}` : res.kind === 'item' ? `${nm(res.item)} を見つけた！${res.to === 'vault' ? '（バッグがいっぱいなので保管庫へ）' : ''}` : '';
    paint(m); lock();
    if (card && card.isConnected) {
      cardRes(card, `${res.text ? `<p>${esc(res.text)}</p>` : ''}${eff ? `<div class="rows"><span>${esc(eff)}</span></div>` : ''}`);
      await cardHold(card, 300, 1500); await cardClose(card);
    } else await popup(eff ? `<small>${esc(res.text || ev.title)}</small><b>${esc(eff)}</b>` : `<small>${esc(ev.title)}</small><b>${esc(res.text || '')}</b>`, 1300);
    return eff ? `${res.text || ev.title}　${eff}` : (res.text || ev.title || '');
  }

  // ---- 能力マスの特訓の動き（field-view の TRAIN_ACT・道具の絵）：道具をモンスターのそばに置く → モンスターが短く特訓 → 実際に上がった値 ----
  function trainAct(key, caption) {
    const CV = root.MMCHV, A = CV && CV.TRAIN_ACT ? CV.TRAIN_ACT[key] : null, src = CV && CV.resultFxSrc ? CV.resultFxSrc('tool', key) : null;
    const el = monEl(), box = el && el.querySelector('.mon'), ui = $('#wb-ui');
    if (!A || !src || !box || !ui || !box.animate || calm()) return wait(0);
    feel('train.item', { key });
    const hr = ui.getBoundingClientRect(), r = el.getBoundingClientRect(), mh = r.height || r.width, col = (G('STAT_COLOR') || {})[key] || '#ffe08a';
    const T = A.tool, cx = r.left + r.width / 2 - hr.left, by = r.bottom - hr.top;
    const tool = document.createElement('i'); tool.className = `chf-tact k-${key}`;
    tool.style.cssText = `left:${(cx + T.dx * mh).toFixed(1)}px;top:${(by + T.dy * mh).toFixed(1)}px;width:${(mh * T.s).toFixed(1)}px;--c:${col}`;
    tool.innerHTML = `<img src="${esc(src)}" alt="" draggable="false" decoding="async">`; ui.appendChild(tool);
    const tx = document.createElement('b'); tx.className = 'chf-tact-tx'; tx.style.setProperty('--c', col); tx.textContent = caption || '';
    tx.style.left = `${cx.toFixed(0)}px`; tx.style.top = `${Math.max(70, r.top - hr.top - 6).toFixed(0)}px`; if (caption) ui.appendChild(tx);
    const am = box.animate(A.mon, { duration: A.ms, easing: 'ease-in-out' }), at = tool.animate(A.tk, { duration: A.ms, easing: 'ease-in-out', fill: 'forwards' });
    return new Promise((ok) => {
      let done = false; const end = () => { if (done) return; done = true; try { am.cancel(); at.cancel(); } catch (e) {} tool.remove(); tx.classList.add('out'); setTimeout(() => { tx.remove(); ok(); }, 160); };
      am.finished.then(end, end); setTimeout(end, A.ms + 400);
    });
  }

  // ---- 操作 ----
  function lock() { document.querySelectorAll('#wb-ui button').forEach((b) => { b.disabled = true; }); }
  function pressPoint(sel) { const host = V.el, b = host && host.querySelector(sel); if (!host || !b) return null; const hr = host.getBoundingClientRect(), r = b.getBoundingClientRect(); return { x: r.left + r.width / 2 - hr.left, y: r.top + r.height / 2 - hr.top }; }
  // 2026-10-12 開発23 B 正式採用：立体サイコロ MMDICE3D（1.30秒で止まる・トンッ、ト、トン・SE は DICE_CUBE の1本）。出目は渡した値（見せるだけ）。読めないときだけ従来の MMCHD
  async function playDie(v, from) {
    if (!V.el || (!root.MMDICE3D && !root.MMCHD)) return;
    const hr = V.el.getBoundingClientRect(), vr = viewRect() || { W: hr.width, top: 80, bottom: hr.height - 170 };
    const land = { x: vr.W / 2, y: vr.top + (vr.bottom - vr.top) * 0.36 };
    try {
      if (root.MMDICE3D) await root.MMDICE3D.play(v, { host: V.el, from: from || undefined, land, top: vr.top, tempo: 'long', throwEvent: 'dice.cube', skin: 'official' });   // 2026-10-13 開発25 E：正式サイコロの絵（skin 'official'）
      else await root.MMCHD.play(v, { host: V.el, from, land });
    } catch (e) {}
  }
  async function roll() {
    const S = gS(), m = S && S.m; if (!active(m) || busyGet() || V.intro || !P8().canRoll(m)) return;
    busySet(true); lock();
    try {
      V.path = [];
      const from = pressPoint('#brollbtn'), r = P8().roll(S, m); doSave();   // 出目・ターン・疲れは見せる前に確定して保存
      paint(m, 'サイコロを振った…'); lock();
      await playDie(r.value, from);
      const add = m.raise.pend ? m.raise.pend.fatigueAdded || 0 : 0;
      paint(m, `出目 <b>${r.value}</b>${add ? `　空腹 +${add}` : ''}`); lock();
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
        if (m.raise.node !== before) V.path.push(m.raise.node);
        if (m.raise.node !== before && V.world) { V.world.update(info(m, m.raise.node)); sprWalk(before, m.raise.node); progSet(m.raise.node); const c = $('#chfd'); if (c) c.textContent = placeName(m.raise.node); await wait(calm() ? 60 : STEP_MS); }
        if (s && s.stage === 'branch') break;
      }
    } finally { sprStop(); busySet(false); }
    if (!onBoard()) return;
    const st = m.raise.pend && m.raise.pend.stage;
    if (st === 'resolve') return resolve();
    board();
  }
  function pick(id) {
    const S = gS(), m = S && S.m; if (!active(m) || busyGet()) return;
    const before = m.raise.node, r = P8().chooseBranch(S, m, id); doSave(); if (!r.ok) return board();
    if (m.raise.node !== before) { V.path.push(m.raise.node); sprWalk(before, m.raise.node); }
    feel('branch.select', { id });
    paint(m, '', m.raise.node); lock(); walk();
  }
  async function rest() {
    const S = gS(), m = S && S.m; if (!active(m) || busyGet() || V.intro || !P8().canRest(m)) return;
    busySet(true); lock(); let res;
    try { const b = m.raise.fatigue || 0; res = P8().rest(S, m); doSave(); if ((m.raise.fatigue || 0) < b) feel('rest.recover'); paint(m, `ひと休みした。　空腹 −${b - (m.raise.fatigue || 0)}`); lock(); await wait(calm() ? 200 : 700); }
    finally { busySet(false); }
    if (onBoard()) board(`ひと休みした。空腹 ${m.raise.fatigue || 0}` + (res && res.timeUp ? '　ターンを使い切った…' : ''));
  }
  function open(id) { const S = gS(), m = S && S.m; if (!active(m) || busyGet() || V.intro || P8().boardPhase(m) !== 'roll') return; try { root.hall(id); } catch (e) {} }
  function items() {
    const S = gS(), m = S && S.m; if (!active(m) || busyGet() || V.intro || P8().boardPhase(m) !== 'roll') return;
    const CH = root.MMCH, bag = (S.inv && S.inv.bag) || [], list = bag.map((it, i) => ({ it, i, eff: CH && CH.fatigueItemEffect(it.id) })).filter((x) => x.eff);
    const ui = $('#wb-ui'); if (!ui) return; itemsClose();
    const nm = (id) => { const d = root.MMP7 && root.MMP7.getItemDef(id); return d ? d.name : id; };
    const st = CH.itemUseState(m), why = st.ok ? '' : `<p class="chit-why">${esc(CH.ITEM_WHY[st.reason] || '')}</p>`;   // 2026-10-12 P2：1ターンに1個・空腹 0 では食べない（バッグの中だけ）
    ui.insertAdjacentHTML('beforeend', `<div class="chsheet chitems" id="chitems"><h3>アイテム</h3>${list.length ? why + list.map((x) => `<button class="p9btn2" onclick="MMWB.useItem(${x.i})"${st.ok ? '' : ' disabled'}>${root.MM_ITEM_ICON && root.MM_ITEM_ICON[x.it.id] ? `<img class="itic" src="${esc(root.MM_ITEM_ICON[x.it.id])}" alt="" decoding="async">` : ''}${esc(nm(x.it.id))}${(x.it.n | 0) > 1 ? ` <b class="itn">×${x.it.n | 0}</b>` : ''}<small>${CH.itemEffectText(x.eff)}</small></button>`).join('') : '<p class="p9s">バッグに食べられる物がない。</p>'}<button class="p9btn2" onclick="MMWB.itemsClose()">閉じる</button></div>`);
  }
  function itemsClose() { const d = $('#chitems'); if (d) d.remove(); }
  function useItem(i) { const S = gS(), m = S && S.m; if (!active(m) || busyGet()) return; const r = root.MMCH.useFatigueItem(S, m, i); if (!r.ok) { itemsClose(); return board(root.MMCH.ITEM_WHY[r.reason] || ''); } doSave(); board(`空腹 −${r.recovered}`); }

  // ---- 止まった地点の結果 ----
  // ---- 2026-10-12 試遊：能力アップ・出来事・冒険リアクションの挿絵カード（盤の上に会話の窓・選択肢だけが出る見え方をやめる）。
  //  2026-10-12 開発23：CARD_ART＝正式の挿絵（モンスターを大きく中央に重ねる）。PH は挿絵が無いときの仮の背景（Chapter 1 の正式背景）
  const CARD_ART = {
    // 2026-10-12 開発23：正式画像（ユーザー納品の24枚のうち8枚）。li・po・in・hi・ev・de＝ライフ・ちから・かしこさ・命中・回避・丈夫さ
    stat: Object.fromEntries(['li', 'po', 'in', 'hi', 'ev', 'de'].map((k) => [k, `./assets/chapter/stat_art_1012/stat_${k}.webp`])),
    react: './assets/chapter/event_art_1012/reaction.webp',   // 冒険リアクションの共通の挿絵
    event: './assets/chapter/event_art_1012/event.webp',      // 挿絵の無い出来事の共通の挿絵
  };
  const PH = { stat: './assets/fields/ch1a/formal_1008/ch1a_scene_01.webp', react: './assets/fields/ch1a/formal_1008/ch1a_scene_02.webp', event: './assets/fields/ch1a/formal_1008/ch1a_scene_03.webp' };
  const BAR_FILL = { li: 'b31_ability_bar_fill_yellow', po: 'b30_ability_bar_fill_red', in: 'b29_ability_bar_fill_green', hi: 'b28_ability_bar_fill_pink', ev: 'b26_ability_bar_fill_lightblue', de: 'b27_ability_bar_fill_darkblue' };
  const evCardOpt = (m, fx, e) => ({ art: e.image || CARD_ART.event, ph: PH.event, mon: e.image ? '' : monSrc(m), title: fx.title || e.title || '' });
  /** 挿絵カード：{ art（挿絵）, ph（挿絵が無いときの仮の背景）, mon（モンスターを大きく中央に）, title } → カードの要素（.res に結果を入れる） */
  function cardOpen(o) {
    const ui = $('#wb-ui'); if (!ui) return null;
    cardClose(null, true);
    const dim = document.createElement('div'); dim.className = 'wbcard-dim'; ui.appendChild(dim);
    const d = document.createElement('div'); d.className = 'wbcard'; d.setAttribute('role', 'status');
    const bg = o.art || o.ph || '';
    d.innerHTML = `<figure class="${o.art ? 'art' : 'ph'}">${bg ? `<img class="bg" src="${esc(bg)}" alt="" decoding="async">` : ''}${o.mon ? `<img class="mon" src="${esc(o.mon)}" alt="" draggable="false" decoding="async">` : ''}</figure>${o.title ? `<div class="cap">${esc(o.title)}</div>` : ''}<div class="res"></div>`;
    ui.appendChild(d); d._dim = dim;
    return d;
  }
  function cardRes(d, html) { const r = d && d.querySelector('.res'); if (r) r.innerHTML = html || ''; }
  function cardClose(d, now) {
    const all = d ? [d, d._dim] : [...document.querySelectorAll('#wb-ui .wbcard,#wb-ui .wbcard-dim')];
    if (now || calm()) { all.forEach((x) => x && x.remove()); return wait(0); }
    all.forEach((x) => x && x.classList.add('out'));
    return wait(220).then(() => all.forEach((x) => x && x.remove()));
  }
  /** タップで先へ（最短 min ms は見せる・最長 max ms で自動） */
  function cardHold(d, min, max) {
    return new Promise((ok) => {
      if (!d) return ok(); const t0 = Date.now(); let done = false;
      const fin = () => { if (done) return; done = true; ok(); };
      const tap = () => { if (Date.now() - t0 >= min) fin(); };
      d.addEventListener('click', tap); if (d._dim) d._dim.addEventListener('click', tap);
      setTimeout(fin, calm() ? Math.min(max, 900) : max);
    });
  }
  /** 能力アップ：挿絵（無ければ仮の背景）にモンスターを大きく → 道具と特訓の動き（field-view の TRAIN_ACT）→ 能力のバーが前の値から伸びる（999 が最大・正式のバーの色）→「かしこさ +18」 */
  async function statCard(m, key, amount) {
    const CV = root.MMCHV, A = CV && CV.TRAIN_ACT ? CV.TRAIN_ACT[key] : null, tsrc = CV && CV.resultFxSrc ? CV.resultFxSrc('tool', key) : null;
    const col = (G('STAT_COLOR') || {})[key] || '#ffe08a', lab = labOf(key), to = Number(m[key]) || 0, from = Math.max(0, to - (amount || 0));
    const d = cardOpen({ art: CARD_ART.stat[key], ph: PH.stat, mon: monSrc(m), title: `${lab}のマス` }); if (!d) return;
    feel('train.item', { key });
    const fig = d.querySelector('figure'), mon = fig.querySelector('.mon');
    let tool = null;
    if (tsrc && A) {
      tool = document.createElement('img'); tool.className = 'tool chf-tact' + (A.tool.back ? ' back' : ''); tool.src = tsrc; tool.alt = ''; tool.decoding = 'async';
      tool.style.left = `${(50 + A.tool.dx * 40).toFixed(1)}%`; tool.style.bottom = `${Math.max(4, 5 - A.tool.dy * 36).toFixed(1)}%`; tool.style.translate = '-50% 0'; fig.appendChild(tool);
    }
    const pct = (v) => `${Math.max(0, Math.min(100, (v / 999) * 100)).toFixed(1)}%`;
    cardRes(d, `<div class="sbar" data-k="${esc(key)}" style="--c:${col};--fill:url(./assets/ui/b_group/${BAR_FILL[key] || 'b29_ability_bar_fill_green'}.png);--w0:${pct(from)};--w1:${pct(to)}"><span class="nm">${esc(lab)}</span><span class="tr"><i class="old" style="width:${pct(from)}"></i><i class="new"></i></span><b class="v">${from}</b><span class="up">${esc(lab)} +${amount}</span></div>`);
    const bar = d.querySelector('.sbar'), num = d.querySelector('.sbar .v');
    if (!calm() && A && mon && mon.animate) { try { mon.animate(A.mon, { duration: A.ms, easing: 'ease-in-out' }); if (tool && tool.animate) tool.animate(A.tk, { duration: A.ms, easing: 'ease-in-out', fill: 'forwards' }); } catch (e) { /* 動きは飾り */ } }
    await wait(calm() ? 0 : Math.min(700, A ? A.ms * 0.55 : 500));
    void bar.offsetWidth; bar.classList.add('on'); feel('stat.up', { key, amount });
    if (calm()) num.textContent = String(to);
    else {
      const t0 = performance.now();
      await new Promise((ok) => { const step = (t) => { const k = Math.min(1, (t - t0) / 950), e = 1 - Math.pow(1 - k, 3); num.textContent = String(Math.round(from + (to - from) * e)); if (k < 1) requestAnimationFrame(step); else ok(); }; requestAnimationFrame(step); setTimeout(ok, 1400); });
      num.textContent = String(to);
    }
    await cardHold(d, 300, 1100);
    await cardClose(d);
  }

  function rowsHtml(fx) {
    const out = [];
    for (const g of fx.gains || []) if (g.amount) out.push(`<span class="${g.amount < 0 ? 'dn' : ''}">${esc(labOf(g.key))} ${g.amount > 0 ? '+' : ''}${g.amount}</span>`);
    if (fx.kind === 'stat' && fx.amount) out.push(`<span>${esc(labOf(fx.key))} +${fx.amount}</span>`);
    if (fx.gold) out.push(`<span>${COIN.replace('chh-ic', 'chh-ic wbc')}+${fx.gold}G</span>`);
    if (fx.fatigue) out.push(`<span class="${fx.fatigue > 0 ? 'dn' : ''}">空腹 ${fx.fatigue > 0 ? '+' : '−'}${Math.abs(fx.fatigue)}</span>`);
    return out.length ? `<div class="rows">${out.join('')}</div>` : '';
  }
  function plainOf(fx) {
    const t = [];
    for (const g of fx.gains || []) if (g.amount) t.push(`${labOf(g.key)} ${g.amount > 0 ? '+' : ''}${g.amount}`);
    if (fx.kind === 'stat' && fx.amount) t.push(`${labOf(fx.key)} +${fx.amount}`);
    if (fx.gold) t.push(`+${fx.gold}G`); if (fx.fatigue) t.push(`空腹 ${fx.fatigue > 0 ? '+' : '−'}${Math.abs(fx.fatigue)}`);
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
    if (rival) return rivalCut(ui, B, text, cue);
    // 2026-10-11 野生・レアの遭遇（EV03 の構図＝大きな相手＋下の札。参考画像の仮の名前・Lv は使わない＝実際の種族から作る。Lv は無い）
    let foe = null;
    if (root.MMP10M && root.MMCH && root.MMCH.foeSpecies && typeof root.battleFoeCount === 'function') { const sp = root.MMP10M.byId(root.MMCH.foeSpecies(m, root.battleFoeCount())); if (sp && sp.image) foe = { src: sp.image.src, name: sp.name }; }
    const sil = bt === 'wild' && !!foe, rare = bt === 'rare';
    ui.insertAdjacentHTML('beforeend', `<div class="chf-enc chf-enc2 wbx wbx-w${rare ? ' rare' : ''}${sil ? ' sil' : ''}" role="status" aria-label="${esc(text)}"><i class="wbx-veil"></i>
      <div class="wbx-stage"><i class="wbx-glow"></i>${foe ? `<img class="wbx-mon" src="${esc(foe.src)}" alt="${sil ? '？？？' : esc(foe.name)}" draggable="false">` : ''}${sil ? `<i class="wbx-sil" aria-hidden="true" style="-webkit-mask-image:url('${esc(foe.src)}');mask-image:url('${esc(foe.src)}')"></i>` : ''}</div>
      <div class="wbx-card"><small>${esc(text)}</small><div class="wbx-nm"><b>${sil || !foe ? '？？？' : esc(foe.name)}</b>${rare ? '<em>★ レア</em>' : ''}</div></div></div>`);
    const el = ui.querySelector('.wbx-w:last-child'); feel(cue, { battleType: bt });
    await wait(1650);
    if (el) { el.classList.add('out'); await wait(240); el.remove(); }
  }
  /** ライバル（リュウ）：EV01 の「RIVAL」の幕 → 正式のリュウ（＋相棒のレグナス）→ 最後の約0.3秒に赤と青の X（EV06＝既存 bc05 の派生）を1回 */
  async function rivalCut(ui, B, text, cue) {
    const A = cfg().assets || {}, fig = B.encounterFigure ? A[B.encounterFigure] : null, part = B.encounterPartner ? A[B.encounterPartner] : null;
    ui.insertAdjacentHTML('beforeend', `<div class="chf-enc chf-enc2 wbx wbx-r" role="status" aria-label="${esc(text)}"><img class="wbx-rbg" src="${esc(FXF.rivalBg)}" alt="" draggable="false">
      <div class="wbx-rstage">${part ? `<img class="wbx-partner" src="${esc(part)}" alt="" draggable="false">` : ''}${fig ? `<img class="wbx-ryu" src="${esc(fig)}" alt="${esc(B.name || 'リュウ')}" draggable="false">` : ''}</div>
      <div class="wbx-card r"><small>RIVAL</small><div class="wbx-nm"><b>${esc(text)}</b></div></div><img class="wbx-clash" src="${esc(FXF.clash)}" alt="" draggable="false"></div>`);
    const el = ui.querySelector('.wbx-r:last-child');
    await wait(900); if (el) el.classList.add('p2'); feel(cue, { battleType: 'rival' });   // 2026-10-13 開発27（19）：ライバルの登場の SE（RIVAL_APPEAR・従来の正式素材）は、リュウとレグナスが現れた瞬間に1回（旧：その前の幕の出始め）   /* 2026-10-13 開発27（20）：登場の「よっ！」（ryu.appear）は鳴らさない（不採用）。声のファイル・登録は残す */   // 2026-10-13 開発25 追加便：リュウの姿が出た瞬間に「よっ！」（遭遇1回に1回）
    await wait(1250); if (el) el.classList.add('p3');      // X の衝突（0.32秒）
    await wait(380);
    if (el) { el.classList.add('out'); await wait(240); el.remove(); }
  }
  /** 高額の G（GOLD_BIG 以上）：金貨の飛散（EV05）＋「+NG」（正式の G のアイコン）。1回の取得で1回・所持金の処理はしない（もう加算済み） */
  async function goldBurst(amount) {
    const ui = $('#wb-ui'); if (!ui || !(amount >= GOLD_BIG) || calm()) return;
    const coin = G('GCOIN_SRC') || './assets/ui/gold/coin.png';
    ui.insertAdjacentHTML('beforeend', `<div class="wbx-gold" role="status" aria-label="${amount}G"><img class="wbx-gb" src="${esc(FXF.gold)}" alt="" draggable="false"><b><img src="${esc(coin)}" alt="" draggable="false">+${amount}G</b></div>`);
    const el = ui.querySelector('.wbx-gold:last-child'); feel('gold.get', { amount });
    await wait(1250); if (el) { el.classList.add('out'); await wait(220); el.remove(); }
  }
  /** 残り10・5・1ターンの砂時計（上の HUD の下・操作の邪魔をしない＝押せない層）。会話・演出・バトル中は待ってから。各1回（m.raise.field.tw に記録＝再読み込みで出ない） */
  function turnWarn(m, tries = 0) {
    const f = fieldOf(m), r = m.raise; if (!f || !onBoard() || !active(m) || P8().boardPhase(m) !== 'roll' || r.goal) return;
    const left = (r.turnLimit || 40) - (r.turnsUsed || 0); if (!TURN_WARN.includes(left)) return;
    f.tw = isObjv(f.tw) ? f.tw : {}; if (f.tw[left]) return;
    if (busyGet() || V.intro || document.querySelector('.mmtalk,.wb-pop,.chf-enc2,.wbx-gold,.wbx-hg')) { if (tries < 30) setTimeout(() => turnWarn(m, tries + 1), 400); return; }
    f.tw[left] = 1; doSave();                                    // 先に記録（途中で閉じても二度出ない）
    const ui = $('#wb-ui'); if (!ui || calm() && left !== 1) return;
    const lv = left === 1 ? 'hi' : left === 5 ? 'mid' : 'lo';
    ui.insertAdjacentHTML('beforeend', `<div class="wbx-hg ${lv}" role="status" aria-label="残り${left}ターン"><img src="${esc(FXF.hg[left])}" alt="" draggable="false"><b>残り <em>${left}</em> ターン</b></div>`);
    const el = ui.querySelector('.wbx-hg:last-child'); feel('turn.warn', { left });
    setTimeout(() => { if (el) { el.classList.add('out'); setTimeout(() => el.remove(), 260); } }, left === 1 ? 2400 : left === 5 ? 2000 : 1600);
  }
  /** レアのマス（この育成で出たときだけ）：その地点の上に紫の紋章（全景でも見える大きさ）。訪れたら弱くする */
  function rareMark(m) {
    const f = fieldOf(m); if (!f || !V.world || !V.world.marker) return;
    const id = Object.keys(f.tiles || {}).find((k) => f.tiles[k] && f.tiles[k].rare); if (!id) return;
    V.world.marker(id, FXF.rare, { w: 40, min: 46, max: 110, ah: 1.55 });
    V.world.markerDim(id, f.used[id] != null);
  }
  function fxPreload() {
    if (V.pre) return; V.pre = true;
    const go = () => { for (const u of [FXF.rivalBg, FXF.clash, FXF.gold, FXF.hg[10], FXF.hg[5], FXF.hg[1]]) { const im = new root.Image(); im.decoding = 'async'; im.src = u; } };
    if (root.requestIdleCallback) root.requestIdleCallback(go, { timeout: 4000 }); else setTimeout(go, 1500);
  }
  /** 2026-10-13 開発24：フィナの声（js/npc/voice-cues.js の CUES）。自動テストの一言なし（MM_QA_NO_STORY）では鳴らさない */
  const vcue = (name) => { try { if (!root.MM_QA_NO_STORY && root.MMVOICE) root.MMVOICE.cue(name); } catch (e) {} };
  const DIE_TEXT = {
    Q: (e) => `運命のサイコロ：${e.die}（${e.die % 2 ? '奇数＝左の道' : '偶数＝右の道'}へ）`,
    CHALLENGE: (e) => `封印の遺跡門の挑戦：${e.die} → ${e.die >= 5 ? '成功！ 遺跡の道へ' : '失敗… 遠回りの道へ'}`,
  };
  /** 2026-10-13 開発27（18）：イベントのサイコロ（Q の左右・特殊挑戦）は、案内を出してプレイヤーが「サイコロを振る」を押してから1回だけ振る。
   *  出目・判定（奇数／偶数・5／6 で成功）は resolveLanding で決まって保存済み＝ここは見せ方だけ。自動テストの一言なし（MM_QA_NO_STORY）では待たない */
  const DIE_ASK = {
    Q: { h: '運命のサイコロ', p: 'サイコロを振って進む道を決めよう。奇数なら左の道、偶数なら右の道へ。' },
    CHALLENGE: { h: '封印の遺跡門の挑戦', p: 'サイコロを振って、5か6が出れば成功！ 遺跡の道へ進める。それ以外は遠回りの道へ。' },
  };
  function dieAsk(e) {
    const ui = $('#wb-ui'), A = DIE_ASK[e.kind] || { h: 'イベントのサイコロ', p: 'サイコロを振ろう。' };
    if (!ui || root.MM_QA_NO_STORY) return Promise.resolve();
    const b0 = $('#bmsg'); if (b0) b0.textContent = A.h;
    return new Promise((done) => {
      ui.insertAdjacentHTML('beforeend', `<div class="chsheet wbdask" role="dialog" aria-label="${esc(A.h)}"><h3>🎲 ${esc(A.h)}</h3><p class="p9s">${esc(A.p)}</p><button type="button" class="p9btn wbdgo">サイコロを振る</button></div>`);
      const el = ui.querySelector('.wbdask:last-child'), b = el && el.querySelector('.wbdgo'), t0 = Date.now();
      if (!b) { if (el) el.remove(); return done(); }
      const go = (ev) => { if (ev) ev.stopPropagation(); if (b.disabled || Date.now() - t0 < 350) return; b.disabled = true; el.remove(); done(); };   // 1回だけ（連打・表示直後の押下は無視）
      b.addEventListener('click', go);
    });
  }
  async function dieBand(e, play) {
    const host = V.el; if (!host || calm()) return play();
    const vr = viewRect(), y = vr ? vr.top + (vr.bottom - vr.top) * 0.36 : host.getBoundingClientRect().height * 0.4;
    host.insertAdjacentHTML('beforeend', `<div class="wbdband" aria-hidden="true" style="top:${Math.round(y)}px"><i></i></div>`);
    const el = host.querySelector('.wbdband:last-child');
    try { await play(); } finally { if (el) { el.classList.add('out'); setTimeout(() => el.remove(), 260); } }
  }
  async function resolve() {
    const S = gS(), m = S && S.m; if (!active(m) || busyGet() || !onBoard() || !m.raise.pend || m.raise.pend.stage !== 'resolve') return;
    busySet(true); lock();
    let tail = '', card = null, rivalGo = false;
    try {
      const r = P8().resolveLanding(S, m); doSave();
      let fx = r.fx || {};
      if (fx.kind === 'battle' && fx.battleType === 'rival') V.rivalAuto = true;
      if ((fx.dice || []).length) await storyAt(m, 'die', { dice: fx.dice });
      for (const e of fx.dice || []) {   // イベントのサイコロ（Q の左右・特殊挑戦）：出目はもう決まっている（見せるだけ）
        const tx = (DIE_TEXT[e.kind] || ((x) => `サイコロ：${x.die}`))(e);
        const b = $('#bmsg'); if (b) b.textContent = tx;
        await dieAsk(e); await dieBand(e, () => playDie(e.die, null)); tail = tx;   // 2026-10-13 開発27（18）：案内 → プレイヤーが「サイコロを振る」→ 1回だけ振る（出目はもう決まっている＝見せるだけ）。後ろに帯
        if (e.kind === 'CHALLENGE') vcue(e.die >= 5 ? 'fina.challengeOk' : 'fina.challengeNg');   // 2026-10-13：フィナの声（やったね／うーん）
      }
      if (fx.kind === 'choice') {
        feel('event', { ev: fx.ev });
        card = cardOpen(evCardOpt(m, fx, evDef(fx.ev) || {}));   // 2026-10-12 試遊：2択も挿絵を出したまま選ぶ
        const id = await choose(fx);
        let r2 = P8().resolveChoice(S, m, id); if (!r2.ok) r2 = P8().resolveChoice(S, m, (fx.options[0] || {}).id); doSave();
        if (r2.ok) { Object.assign(r, r2); fx = r2.fx || {}; }
      }
      paint(m, tail); lock();
      if (fx.kind === 'stat') {
        await wait(calm() ? 0 : 160); await statCard(m, fx.key, fx.amount); tail = `${labOf(fx.key)} +${fx.amount}`;   // 2026-10-12 試遊：挿絵カード＋能力のバー（旧 trainAct＋小さな窓）
      } else if (fx.kind === 'treasure') {
        feel(['normal', 'rare', 'special'].includes(fx.tier) ? `chest.open.${fx.tier}` : 'chest.open', { tier: fx.tier });
        vcue('fina.discover');   // 2026-10-13：「見て見て」（同じ声は少しのあいだ繰り返さない）
        await goldBurst(fx.gold);
        await popup(`<small>${fx.tier === 'rare' ? '珍しい宝箱' : '宝箱'}を見つけた！</small>${rowsHtml(fx)}`, 1300); tail = plainOf(fx);
      } else if (fx.kind === 'reward') {
        feel('chest.open.special', { tier: 'special' });
        vcue('fina.discover');
        await goldBurst(fx.gold);
        await popup(`<small>${fx.den ? '隠れ家' : '宝の行き止まり'}</small><b>${esc(fx.title || '')}</b>${rowsHtml(fx)}`, 1800); tail = `${fx.title || ''}　${plainOf(fx)}`.trim();
      } else if (fx.kind === 'meal') {
        // 2026-10-12 正式：食事・焚き火のマス＝フィナが野外の岩に座る景色（assets/chapter/meal_1012）に、連れている子の正式画像。プレイヤーは台詞で参加を示す（顔の素材は無い＝描かない）
        feel('rest.recover');
        const nm = root.S && root.S.playerName ? root.S.playerName : '';
        await talkLines([{ expression: 'smile', text: 'ちょうどいい場所だね。ここでひと休みして、みんなでごはんにしよう！' }, { expression: 'happy', text: `${nm ? nm + 'さん' : 'みんな'}も、${m.name || 'この子'}も、たくさん食べてね。` }]);
        await popup(`<div class="wbmeal"><img class="bg" src="./assets/chapter/meal_1012/meal_fina.webp" alt="" decoding="async"><img class="mon" src="${esc(monSrc(m))}" alt="" decoding="async"></div><b>${esc(fx.title || '')}</b>${rowsHtml(fx)}`, 2400);
        tail = plainOf(fx) || fx.title || '';
      } else if (fx.kind === 'event') {
        const e = evDef(fx.ev) || {};
        if (fx.recovery) feel('rest.recover'); else if (!card) feel('event', { ev: fx.ev });
        // 2026-10-12 試遊：出来事は挿絵カード（挿絵が無ければ仮の背景にモンスターを大きく）を出したまま会話 → 結果もカードの中
        if (!card) card = cardOpen(evCardOpt(m, fx, e));
        await talkLines(fx.choice ? [] : fx.lines);
        await goldBurst(fx.gold);
        const body = `${fx.text ? `<p>${esc(fx.text)}</p>` : ''}${rowsHtml(fx)}`;
        cardRes(card, body); await cardHold(card, 300, body ? 1900 : 900); await cardClose(card); card = null;
        tail = plainOf(fx) || fx.title || '';
      } else if (fx.kind === 'battle') { if (fx.battleType === 'rival') V.rivalAuto = rivalGo = true; await encounter(m, fx.battleType); }   // 2026-10-13 開発27（21）：ライバルは演出のあとバトルの案内（説明・「バトルする」）を出さずにそのままバトルへ
      else if (fx.note === 'claimed') tail = `${fx.title || '宝'}はもう手に入れている。`;
      const told = await storyAt(m, 'land', { fx, goal: !!r.goal });
      if (!told && fx.kind === 'none' && fx.note === 'normal' && !r.goal && !r.timeUp) tail = (await reactionAt(m)) || tail;
      if (r.goal) tail = `${tail}　大会会場に着いた！`.trim(); else if (r.timeUp) tail = `${tail}　ターンを使い切った…`.trim();
    } finally { if (card) cardClose(card, true); busySet(false); }
    if (rivalGo && onBoard() && P8().boardPhase(m) === 'battle' && typeof root.bBattleGo === 'function') { root.bBattleGo(); V.rivalAuto = false; if (!root.document.getElementById('bt')) board(tail || undefined); return; }
    V.rivalAuto = false;   // 強制戦闘・戻り先・バトルの種類・報酬なしは従来の bBattleGo のまま
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
  root.MMWB = Object.freeze({ STEP_MS, skinKey, pickDir, dirSets, progressAt, active, board, release, roll, pick, rest, open, items, itemsClose, useItem, state: () => ({ key: V.key, intro: V.intro, world: V.world ? V.world.state() : null }), world: () => V.world });
})(typeof window !== 'undefined' ? window : globalThis);
