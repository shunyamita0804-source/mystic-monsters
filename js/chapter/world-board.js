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
  // マスの上面の試作（TOP01 ライフ・TOP07 野生の2種だけ。検収前＝URL に ?tileTop=1011 を付けたときだけ。既定は従来の tiles_v2）
  const topPreview = () => { try { return !!root.MM_TILETOP_1011 || new URLSearchParams(root.location ? root.location.search : '').get('tileTop') === '1011'; } catch (e) { return false; } };
  const TOP_NEW = { stat_li: './assets/fields/ch1a/tiles_top_1011/tile_stat_life.webp', wild: './assets/fields/ch1a/tiles_top_1011/tile_wild_monster.webp' };
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
      else if (role === 'mandatory_rival') out.src = TV2 + 'tile_rival.webp';
      else if ((fwdN[id] || 0) > 1) out.src = TV2 + 'tile_branch.webp';
      else if ((inN[id] || 0) > 1) out.src = ART + 'tile_merge.webp';
      else if (role === 'ordinary_tile' && f) {
        const t = f.tiles[id];
        if (t) {
          out.used = f.used[id] != null;
          if (t.t === 'stat') out.src = (topPreview() && TOP_NEW['stat_' + t.k]) || TV2 + 'tile_stat_' + STAT_FILE[t.k] + '.webp';
          else if (t.t === 'event') out.src = TV2 + 'tile_event.webp';
          else if (t.t === 'rest') out.src = TV2 + 'tile_rest.webp';
          else if (t.t === 'wild') out.src = t.rare ? TV2 + 'tile_rare_monster.webp' : (topPreview() && TOP_NEW.wild) || TV2 + 'tile_wild_monster.webp';
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
    const la = (n, per) => (st.done ? [] : root.MMRF_WORLD.lookahead(d, at, back ? null : first, back, n, per));
    const ahead = la(CAM.fit, CAM.fitPer), near = la(CAM.ahead, CAM.per);   // カメラが入れる地点（先の4・分かれ道の手前は各2）／明るく残す地点（先の5・各3）
    // 道筋＝直前の数地点・今の地点・先の地点（ここ以外のマスは薄く、地面は薄い幕＝選ばなかった道・遠くの道と見分ける）。表示だけ（ルート・セーブは変えない）
    const tr = (st.trail || []).slice(0, node ? Math.max(0, (st.trail || []).lastIndexOf(at)) : undefined).slice(-CAM.behind);
    return { node: at, ahead, focus: [...new Set(tr.concat([at], near))], look: look(m), denOpen: !!st.randOpen };
  }
  // 2026-10-12 試遊修正：カメラを近く（今の道で先の4地点・分かれ道の手前は両方の道を2地点ずつが入る倍率。明るく残す道筋は先の5地点・各3）・モンスター＝マスの幅の 1.2倍・道筋の強調
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
  function hudHtml(m) {
    const r = m.raise, fat = Math.round(r.fatigue || 0), lv = fat >= 80 ? 'hi' : fat >= 50 ? 'mid' : 'lo', S = gS() || {};
    const ph = P8().boardPhase(m), pl = placeName(r.node);
    return `<header class="chh wbh"><div class="chh-top"><div class="chh-l chh-prog"><div class="chh-cap"><small>Chapter <b>1</b> / ${root.MMP7 ? root.MMP7.CHAPTER_COUNT : 4}</small><b class="chh-nm">はじまりの草原</b><span class="chh-fd" id="chfd">${esc(pl)}</span></div></div>
      <button class="p9mbtn chh-menu" onclick="p9Menu()" aria-label="メニュー">☰</button></div>
      <div class="chh-r chh-chips"><div class="chh-turn chip">Turn <b id="chturn">${Math.min(r.turnsUsed + (ph === 'roll' ? 1 : 0), r.turnLimit)}</b><small> / ${r.turnLimit}</small></div>
      <div class="chh-fat chip f-${lv}" id="chfat"><span>空腹</span><b>${fat}</b><i style="--f:${fat}%"></i></div>
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
    if (ph === 'roll') def = r.turnsUsed === 0 ? '<b>はじまりの草原</b>　大会会場を目指そう。START でサイコロ（1〜6）を振る。' : tired ? 'お腹がすいて動けない…食べさせるか、休もう。' : 'START でサイコロを振る。休むこともできる。';
    else if (ph === 'move' || ph === 'resolve') def = '移動中…';
    else if (ph === 'branch') def = `分かれ道だ。どちらへ進む？（のこり${r.pend.left}）`;
    const H = Dk.hit || {}, box = (k) => { const h = H[k] || { x: 0, y: 0, w: 0, h: 0 }; return `style="left:${(h.x * 100).toFixed(1)}%;top:${(h.y * 100).toFixed(1)}%;width:${(h.w * 100).toFixed(1)}%;height:${(h.h * 100).toFixed(1)}%"`; };
    const center = ph === 'roll'
      ? `<div class="chstopw chstopw-img${canRoll ? ' on' : ''}" ${box('center')}><button class="chstop chstop-img" id="brollbtn" data-nsfx="1" onclick="MMWB.roll()"${canRoll && !V.intro && !V.cover ? '' : ' disabled'} aria-label="START（サイコロを振る）"><b>START</b></button></div>`
      : `<div class="chstopw chstopw-img" ${box('center')}><button class="chstop chstop-img wait" disabled aria-label="移動中"><b>${(ph === 'move' || ph === 'resolve') && r.pend ? r.pend.roll : '…'}</b></button></div>`;
    const wing = (c) => { const on = (c.k === 'rest' ? canRest : ph === 'roll') && !V.intro && !V.cover; return `<button class="chwing chwing-img ${c.cls} chw-${c.pos}${c.k === 'rest' && tired ? ' must' : ''}" ${box(c.pos)} onclick="${c.on}"${on ? '' : ' disabled'}><b>${c.label}</b>${c.k === 'rest' ? `<i class="chwlbl">空腹 −${root.MMRF_PLAY ? root.MMRF_PLAY.TUNING.restAmount : 10}</i>` : ''}</button>`; };
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
      return `<div class="chsheet chbat"><small class="chbat-kind">${esc(bt.label)}</small><h3>${esc(bt.encounter || bt.label)}</h3>${bt.note ? `<p class="p9s chbat-note">${esc(bt.note)}</p>` : ''}<p class="p9s">バトルの後は空腹 +${fb}。賞金・ランクアップはありません。</p><button class="p9btn" onclick="bBattleGo()">バトルする</button>${fx.battleType === 'rival' ? '' : '<button class="p9btn2" onclick="bBattleSkip()">やめておく</button>'}</div>`;
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
.wbv .rfw-mon .mon{display:block;position:relative}
.wbv .rfw-mon .mon>img{display:block;width:100%;height:auto;filter:drop-shadow(0 3px 2px rgba(0,0,0,.45))}
:is(#rfp,.wbv) .rfw-mon .mon>img.wk{position:absolute;left:50%;bottom:calc((1 - var(--sth,1)) * 100%);width:auto;height:calc(100% * var(--wkh,1) * var(--sth,1));max-width:none;translate:-50% calc(var(--wkf,0) * 100%);opacity:0;animation:none}
:is(#rfp,.wbv) .rfw-mon:is(.wk-on,.wk-idle) .mon:has(>img.wk.on)>img.st{opacity:0}
:is(#rfp,.wbv) .rfw-mon:is(.wk-on,.wk-idle) .mon>img.wk.on{opacity:1}
.wbv .rfw-mon.wk-flip .mon>img.wk{scale:-1 1}
.wbv .rfw-mon.bob .mon{animation:wbbob .32s ease-in-out infinite}
.wbw .chf-tact,.wbw .chf-tact-tx{z-index:9}
@keyframes wbbob{50%{translate:0 -6%}}
.wbw .wbx{z-index:22}
.wbw #wb-ui:has(.wbx) .chsheet{visibility:hidden}
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
@keyframes rfwmk{50%{translate:0 -7%}}
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
.wbw .wbrelay .wbr-t{position:absolute;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 18px);text-align:center;color:#fff;font:800 26px/1.2 "Shippori Mincho",serif;text-shadow:0 2px 10px rgba(2,6,24,.9)}
.wbw .wbrelay .wbr-t small{display:block;font:700 12px/1.6 "Noto Sans JP",sans-serif;letter-spacing:.25em}
.wbw .wbrelay .wbr-load{position:absolute;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 28px);transform:translateX(-50%);display:flex;align-items:center;gap:8px;padding:6px 14px;border-radius:999px;background:rgba(8,15,34,.72);border:1px solid rgba(217,180,101,.6);color:#f3e7c4;font-size:12.5px;font-weight:700}
.wbw .wbrelay .wbr-load i{width:12px;height:12px;border-radius:50%;border:2px solid rgba(243,231,196,.35);border-top-color:#e8c66e;animation:wbrspin .9s linear infinite}
.wbw .wbrelay .wbr-err{display:none;position:relative;flex-direction:column;align-items:center;gap:8px;padding:14px 16px;margin:0 16px;border-radius:14px;background:rgba(8,15,34,.9);border:1.5px solid #d9b465;color:#fff;text-align:center}
.wbw .wbrelay .wbr-err p{margin:0 0 4px;font-size:13.5px}
.wbw .wbrelay.slow .wbr-err{display:flex}
@keyframes wbrspin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.wbw .wbrelay{transition-duration:.2s}.wbw .wbrelay .wbr-load i{animation:none}}
@media (prefers-reduced-motion:reduce){.wbw .wb-pop,.wbw .wb-pop.out,.wbv .rfw-mon .mon,.wbw .wbx *,.wbw .wbx-gold *,.wbw .wbx-hg,:is(#rfp,.wbv) .rfw-mark{animation:none!important}}`
    + (root.MMREACT ? Object.entries(root.MMREACT.MOTIONS).map(([k, v]) => `.wbv .rfw-mon.mrx-${k} .mon{animation:mrx-${k} ${v.ms}ms cubic-bezier(.4,0,.3,1)}`).join('') : '');
    document.head.appendChild(s);
  }
  function release() { sprStop(); if (V.intro || V.cover) busySet(false); if (V.cover) { V.cover.remove(); V.cover = null; } if (V.world) { try { V.world.destroy(); } catch (e) {} } V.world = null; V.el = null; V.key = null; V.intro = false; }
  function ensureView(m) {
    const f = fieldOf(m), key = `${m.uid}:${f.layoutSeed}`, app = $('#app');
    if (V.el && V.key === key) { if (!V.el.isConnected) { app.innerHTML = ''; app.appendChild(V.el); } return false; }
    release(); css();
    app.innerHTML = '<div class="chfw wbw" id="wbw"><div class="wbv" id="wbv"></div><div class="chf-ui" id="wb-ui"></div></div>';
    V.el = $('#wbw'); V.key = key;
    if (root.MMRF_WORLD) V.world = root.MMRF_WORLD.create(V.el.querySelector('.wbv'), D(), root.MMRF_PLAY, { view: viewRect, monSrc: monSrc(m), art: { base: ART, road: 'strip' },
      focus: true, ahead: CAM.ahead, sMin: CAM.sMin, sMax: CAM.sMax, tilePx: CAM.tilePx, monRatio: CAM.monRatio, zoomTau: CAM.zoomTau });
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
    if (root.MMCHD && V.dice !== 6) { const dc = cfg().dice || {}; root.MMCHD.configure({ ...dc, sides: 6 }); V.dice = 6; root.MMCHD.preload(); }
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
  function cover(m, withIntro) {
    if (V.cover) V.cover.remove();
    const el = document.createElement('div'); el.className = 'wbrelay' + (withIntro ? ' art' : ''); el.setAttribute('role', 'status');
    el.innerHTML = (withIntro ? `<img class="wbr-img" src="${RELAY.src}" alt="" draggable="false" decoding="async"><div class="wbr-t"><small>CHAPTER 1</small><b>はじまりの草原</b></div>` : '')
      + '<div class="wbr-load"><i aria-hidden="true"></i><span>読み込み中…</span></div><div class="wbr-err"><p>読み込みに時間がかかっています。</p><button class="p9btn" data-act="retry">もう一度読み込む</button><button class="p9btn2" data-act="back">タイトルへ戻る</button></div>';
    V.el.appendChild(el); V.cover = el; busySet(true); paint(m);   // 覆っている間は START・コマンドを押せない形で描き直す
    const t0 = Date.now(), world = V.world, slow = setTimeout(() => { if (V.cover === el) el.classList.add('slow'); }, RELAY.slow);
    el.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('button[data-act]'); if (!b || V.cover !== el) return;
      clearTimeout(slow); V.cover = null; busySet(false);
      if (b.dataset.act === 'retry') { release(); board(); } else { try { root.p8Suspend(); } catch (x) {} } });
    world.ready().then((ok) => {
      if (!ok || V.cover !== el || V.world !== world) return;
      setTimeout(() => root.requestAnimationFrame(() => root.requestAnimationFrame(() => {
        if (V.cover !== el) return; clearTimeout(slow); V.cover = null;
        if (withIntro) intro(m); else { busySet(false); const S = gS(), mm = S && S.m; if (active(mm) && onBoard()) board(); }   // 覆いのあと＝途中の移動・分かれ道・出発の一言をここから（board() の続きの処理）
        el.classList.add('out'); setTimeout(() => el.remove(), RELAY.fade + 60);
      })), withIntro ? Math.max(0, RELAY.min - (Date.now() - t0)) : 0);
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
  const SPR = { sets: {}, cur: null, flip: false, lat: false, raf: 0, phase: 0, last: 0, frame: '', on: false };
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
  function pickDir(dx, dy, sets, prev) {
    prev = prev || {}; sets = sets || {};
    const sy = dy * TILT_COS, ax = Math.abs(dx), ay = Math.abs(sy);
    if (!ax && !ay) return { set: prev.set || null, flip: !!prev.flip, lat: !!prev.lat };
    const lat = ay < ax * (prev.lat ? 0.45 : 0.35);
    let set;
    if (lat && sets.side) set = 'side';
    else if (lat && prev.set && prev.set !== 'side' && sets[prev.set]) set = prev.set;   // 横の1歩は直前の縦のセットのまま（ちらつかない）
    else if (sy < 0) set = sets.back ? 'back' : sets.side ? 'side' : null;
    else set = sets.front ? 'front' : sets.side ? 'side' : null;
    const face = set ? sets[set].face : 'none';
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
    SPR.sets = dirSets(spr);
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
    const r = pickDir(b[0] - a[0], b[1] - a[1], SPR.sets, { set: SPR.cur, flip: SPR.flip, lat: SPR.lat }), w = r.set ? SPR.sets[r.set] : null;
    if (r.set !== SPR.cur) SPR.phase = 0;
    SPR.cur = r.set; SPR.flip = r.flip; SPR.lat = r.lat;
    el.classList.remove('wk-idle'); el.classList.toggle('wk-on', !!w); el.classList.toggle('bob', !w); el.classList.toggle('wk-flip', !!w && r.flip);
    el.dataset.dir = r.set || '';
    if (w) { sprShow(r.set, Math.floor(SPR.phase) % w.frames.length); if (!SPR.on) { SPR.on = true; SPR.last = 0; if (!SPR.raf) SPR.raf = requestAnimationFrame(sprTick); } }
    else SPR.on = false;
  }
  function sprStop() {
    SPR.on = false; if (SPR.raf && root.cancelAnimationFrame) cancelAnimationFrame(SPR.raf); SPR.raf = 0; SPR.phase = 0; SPR.last = 0; SPR.cur = null; SPR.flip = false; SPR.lat = false;
    const el = monEl(); if (el) { el.classList.remove('wk-on', 'bob', 'wk-flip'); el.dataset.dir = ''; }
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
      const lines = (ev.lines || []).map((l) => ({ npc: l.speaker || 'fina', expression: l.expression || 'normal', text: l.text }));
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
    let id = null;
    try { id = await root.MMNPC.talk([{ npc: 'fina', expression: ev.expression, text: ev.line, choices: ev.choices.map((c, i) => ({ id: String(i), label: c.label })) }], { kind: 'fina', presentation: 'compact' }); } catch (e) {}
    const res = R.apply(gS(), m, ev, id == null ? 0 : +id); doSave();
    const nm = (k) => { const d = root.MMP7 && root.MMP7.getItemDef(k); return d ? d.name : k; };
    if (res.kind === 'fatigue' && res.fatigue < 0) feel('rest.recover');
    R.play(el, res.kind === 'none' ? (ev.sp === 3 ? 'stoneReaction' : 'happy') : 'happy');
    const eff = res.kind === 'stat' ? `${labOf(res.key)} +${res.amount}` : res.kind === 'fatigue' ? `空腹 ${res.fatigue < 0 ? '−' : '+'}${Math.abs(res.fatigue)}` : res.kind === 'item' ? `${nm(res.item)} を見つけた！${res.to === 'vault' ? '（バッグがいっぱいなので保管庫へ）' : ''}` : '';
    paint(m); lock();
    await popup(eff ? `<small>${esc(res.text || ev.title)}</small><b>${esc(eff)}</b>` : `<small>${esc(ev.title)}</small><b>${esc(res.text || '')}</b>`, 1300);
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
  async function playDie(v, from) {
    if (!root.MMCHD || !V.el) return;
    const hr = V.el.getBoundingClientRect(), vr = viewRect() || { W: hr.width, top: 80, bottom: hr.height - 170 };
    try { await root.MMCHD.play(v, { host: V.el, from, land: { x: vr.W / 2, y: vr.top + (vr.bottom - vr.top) * 0.36 } }); } catch (e) {}
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
        if (m.raise.node !== before && V.world) { sprWalk(before, m.raise.node); V.world.update(info(m, m.raise.node)); const c = $('#chfd'); if (c) c.textContent = placeName(m.raise.node); await wait(calm() ? 60 : STEP_MS); }
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
    const el = ui.querySelector('.wbx-r:last-child'); feel(cue, { battleType: 'rival' });
    await wait(900); if (el) el.classList.add('p2');
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
      if ((fx.dice || []).length) await storyAt(m, 'die', { dice: fx.dice });
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
        await wait(calm() ? 0 : 160); await trainAct(fx.key, `${labOf(fx.key)} +${fx.amount}`); feel('stat.up', { key: fx.key, amount: fx.amount });
        await popup(`<small>${esc(labOf(fx.key))}のマス</small><b>${esc(labOf(fx.key))} +${fx.amount}</b>`, 1300); tail = `${labOf(fx.key)} +${fx.amount}`;
      } else if (fx.kind === 'treasure') {
        feel(['normal', 'rare', 'special'].includes(fx.tier) ? `chest.open.${fx.tier}` : 'chest.open', { tier: fx.tier });
        await goldBurst(fx.gold);
        await popup(`<small>${fx.tier === 'rare' ? '珍しい宝箱' : '宝箱'}を見つけた！</small>${rowsHtml(fx)}`, 1300); tail = plainOf(fx);
      } else if (fx.kind === 'reward') {
        feel('chest.open.special', { tier: 'special' });
        await goldBurst(fx.gold);
        await popup(`<small>${fx.den ? '隠れ家' : '宝の行き止まり'}</small><b>${esc(fx.title || '')}</b>${rowsHtml(fx)}`, 1800); tail = `${fx.title || ''}　${plainOf(fx)}`.trim();
      } else if (fx.kind === 'event') {
        const e = evDef(fx.ev) || {};
        if (fx.recovery) feel('rest.recover'); else feel('event', { ev: fx.ev });
        await talkLines(fx.choice ? [] : fx.lines);
        await goldBurst(fx.gold);
        await popup(`${e.image ? `<img class="art" src="${esc(e.image)}" alt="" decoding="async">` : ''}<b>${esc(fx.title || '')}</b>${fx.text ? `<p>${esc(fx.text)}</p>` : ''}${rowsHtml(fx)}`, e.image ? 2000 : 1500);
        tail = plainOf(fx) || fx.title || '';
      } else if (fx.kind === 'battle') await encounter(m, fx.battleType);
      else if (fx.note === 'claimed') tail = `${fx.title || '宝'}はもう手に入れている。`;
      const told = await storyAt(m, 'land', { fx, goal: !!r.goal });
      if (!told && fx.kind === 'none' && fx.note === 'normal' && !r.goal && !r.timeUp) tail = (await reactionAt(m)) || tail;
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
  root.MMWB = Object.freeze({ STEP_MS, pickDir, dirSets, active, board, release, roll, pick, rest, open, items, itemsClose, useItem, state: () => ({ key: V.key, intro: V.intro, world: V.world ? V.world.state() : null }), world: () => V.world });
})(typeof window !== 'undefined' ? window : globalThis);
