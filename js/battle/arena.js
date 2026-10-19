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
//   ・2026-10-13 開発24（試遊・既定 ON。#bt.mma-v24）：①モンスターを従来の約91%（体格ごとに SCALE）・足もと（下端）をそのまま床へ・戦場を少し下げる
//     ②ルーレットを縦に約3割詰める（正式の板から空欄の帯を抜いた派生 assets/battle/roulette/compact_1013/・技の絵だけ・中央の板だけ技名を小さく。威力・命中率・クリ率は出さない＝計算は変えない）
//     ③技が発動している間（技名の帯 .skb3 が出てから .bui.anim が外れるまで）は名前・HP・状態・ルーレット・STOP・説明の文字を opacity／visibility だけで隠す（座標は壊さない）
//     ④「相手がルーレットを回している…」は出さない（敵の抽選・進行は従来どおり）。⑤観客の声（js/battle/crowd.js）を結果に合わせて1行動1回。
//     設定の「バトル画面：旧」（localStorage mmbattleui＝'old'）で従来の見た目に戻せる
// =========================================================
(function (root) {
  'use strict';
  const A = './assets/battle/';
  const IDLE = { 0: 'idle_soramo', 1: 'idle_gauru', 2: 'idle_nobiton', 3: 'idle_jiol', 4: 'idle_regnas' };
  const FACE = { 0: 'R', 1: 'R', 2: 'R', 3: 'R', 4: 'R' };   // 待機立ち絵の元の向き（5体とも右向き）
  // ---- 2026-10-15 N12：大会の対戦表の顔＝正式のイラスト6枚（assets/tournament/icons_1015/・薄い灰色の背景つきの正方形・左向き）----
  //  番号：0〜3＝SPECIES・4＝レグナス（バトルの絵の番号）・5＝フルーネ（MMP10M.PENDING_SPECIES の予約番号＝登録のみ・大会には出ない）。
  //  読めないときは従来の 2.5D の横顔（faces_25d）→ 丸い顔（faces）の順（index.html の tbIcon・tbIconFb）。bg＝その絵の背景の色（丸い枠の地に敷く）
  const TOUR_ICON = Object.freeze({ 0: 'solamo', 1: 'gauru', 2: 'nobiton', 3: 'jiol', 4: 'regnas', 5: 'flurene', 6: 'razuck', 7: 'kalshell', 8: 'myurol' });   // 2026-10-17：6＝ラズック（登録のみ・制作候補の絵＝QA だけ）・2026-10-18：7＝カルシェル・2026-10-19：8＝ミュロル（正式採用の絵・登録のみ＝大会には出ない）
  const TOUR_ICON_BG = Object.freeze({ 0: '#d4d7dc', 1: '#cccfd5', 2: '#cfd3db', 3: '#d2d2d1', 4: '#c7c9d1', 5: '#cecfd0', 6: '#cdd1dd', 7: '#e1e1e1', 8: '#858893' });
  const tourIconSrc = (sp) => (TOUR_ICON[sp] ? `./assets/tournament/icons_1015/icon_${TOUR_ICON[sp]}.webp` : null);
  const RANKS = 'EDCBAS';
  /** ルーレットの見た目（中央を 0 とした |d| ごとの値。間は直線補間） */
  const R = Object.freeze({
    slots: 7, lag: 1.5, accelMs: 350, stopMs: 500, overshootPx: 6, lockMs: 280, spacing: 0.235,   // 2026-10-07 ADDENDUM2：起動の加速 約0.35秒・STOP 後の慣性の減速 約0.5秒・行き過ぎ 約6px（そこから中央へ吸着）。巡航の速さは fight() の光の速さ（BASE_STEP_MS 85ms／枠＝約11.8候補／秒・Phase 6）に合わせる＝STOP の時刻と結果の関係を変えない   // spacing＝板の間隔（ルーレットの幅に対する割合）
    scale: [1.15, 0.92, 0.78, 0.64], rot: [0, 10, 19, 26], drop: [0, 0.10, 0.27, 0.46], dim: [1, 0.96, 0.82, 0.62], // drop＝下げる量（板の高さに対する割合）
  });
  // ---- 2026-10-13 開発24：新しいバトル画面（既定 ON）----
  const UI_KEY = 'mmbattleui';
  const v24 = () => { try { return !(root.localStorage && root.localStorage.getItem(UI_KEY) === 'old'); } catch (e) { return true; } };
  const setUi = (mode) => { try { if (root.localStorage) root.localStorage.setItem(UI_KEY, mode === 'old' ? 'old' : 'new'); } catch (e) {} return v24() ? 'new' : 'old'; };
  /** モンスターの大きさ（従来の待機立ち絵に対する比）。ソラモ＝四足・ガウル＝腕2足2翼2・ノビトン＝横に長い・ジオル・レグナス */
  const SCALE = Object.freeze({ 0: 0.91, 1: 0.92, 2: 0.88, 3: 0.91, 4: 0.91, 6: 0.91, 7: 0.91, 8: 0.91 });   // 6＝ラズック（QA だけ・体格の正式倍率は未決）・7＝カルシェル（QA だけ・サイズ 3）・8＝ミュロル（QA だけ・サイズ 2）
  /** 2026-10-15 夜：体格サイズ 1〜5 の比較プレビュー（js/battle/move-tune-1015.js の MMTUNE.sizeK＝URL に ?mmSize=1 のときだけ。通常は 1＝今までの大きさ）。
   *  待機立ち絵・被弾／回避・勝利の絵は同じ --mma-k を使い、技のコマ（art25d）は待機立ち絵の矩形から作る＝技の途中で大きさが変わらない */
  const kOf = (sp) => (SCALE[sp] || 0.91) * (root.MMTUNE && root.MMTUNE.sizeK ? root.MMTUNE.sizeK(sp) : 1);
  /** ルーレットの板の形（%）：icon＝技の絵の窓（ふつうの板 n／選ばれた板 s）・nm＝技名の帯（中央の板だけ）。v24＝compact_1013 の派生（tools/roulette1013/compact.py で測った値） */
  const CARD_SP = 0.27;   // 2026-10-15 追加A：横長の技カードの並びの間隔（画面の幅に対する比。旧 R.spacing 0.235）
  const GEO = Object.freeze({
    old: { ar: '229/360', fr: '400/560', n: [13.5, 12.5, 13.5, 51], s: [18.5, 13, 18.5, 34.5], nm: [69, 14, 55.8, 7.2], hk: 360 / 229, pad: 28, frTop: 1 },
    v24: { ar: '229/256', fr: '400/396', n: [12.5, 13.5, 16.4, 62.9], s: [20.5, 14.5, 21.6, 45.4], nm: [71.3, 11.5, 71.3, 11.5], hk: 256 / 229, pad: 12, frTop: 2 },
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
      '#bt .mon.mma-on>img:not(.mma-idle):not(.mma-rx):not(.mma-win){opacity:0}',   // 2026-10-13 開発28 B：技のあとに fight() が静止の絵へ戻す瞬間（mma-on）も正式の勝利の絵（mma-win）は消さない＝WIN のあと主役が約1秒消えていた
      '#bt .mon .mma-idle{position:absolute;left:50%;bottom:0;height:118%;width:auto;max-width:none;transform:translateX(-50%);pointer-events:none;filter:drop-shadow(0 8px 6px rgba(0,0,0,.45))}',
      '#bt .mon .mma-idle.fl{transform:translateX(-50%) scaleX(-1)}',
      '#bt .mon:not(.mma-on) .mma-idle{display:none}',
      // 被弾／回避のリアクション：待機立ち絵と同じ置き方（足もと・中央・反転）。高さ＝待機立ち絵 × --rh（体の大きさがそろう倍率）
      '#bt .mon .mma-rx{position:absolute;left:50%;bottom:0;height:calc(118% * var(--rh,1));width:auto;max-width:none;transform:translateX(-50%);pointer-events:none;filter:drop-shadow(0 8px 6px rgba(0,0,0,.45))}',
      '#bt .mon .mma-rx.fl{transform:translateX(-50%) scaleX(-1)}',
      '#bt .mon :is(.mma-idle,.mma-rx,.mma-win,.mma-fin){margin-left:var(--mma-dx,0px)}',   // 2026-10-19：画面の端で体が切れないように横へずらす量（keepIn が測って入れる。例：カルシェルの待機・被弾・回避が左の端で切れていた）
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
      '#bt .mmr .pl{position:absolute;left:50%;top:6%;width:var(--mmr-pw);aspect-ratio:var(--mmr-ar,229/360);margin-left:calc(var(--mmr-pw)/-2);transform-origin:50% 60%;will-change:transform,opacity}',
      '#bt .mmr .pl img.bgp{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}',
      '#bt .mmr .pl .sel{opacity:0}',
      '#bt .mmr .pl .ic{position:absolute;left:13.5%;right:12.5%;top:13.5%;height:51%;border-radius:6%;overflow:hidden;background:#0d1a38}',
      '#bt .mmr .pl .ic img{width:100%;height:100%;object-fit:cover;display:block}',
      // 2026-10-15 N09：正式の技カード（16:9）は窓の内側いっぱいの幅で、切らず・伸ばさずに見せる（contain・上下の余りは窓の紺）。
      //  旧：class 名「card」が index.html の汎用 .card（余白 12px・明るい地・枠）に当たり、絵が細い縦長の白い枠の中に小さく出ていた。MISS の板は変えない
      '#bt .mmr .pl .ic.mvc{padding:0;border:0;border-radius:6%;box-shadow:none;background:#0b1430}',
      '#bt .mmr .pl .ic.mvc img{object-fit:contain;object-position:50% 50%}',
      '#bt .mmr .pl .nm{position:absolute;left:8%;right:8%;top:69%;height:14%;display:flex;align-items:center;justify-content:center;text-align:center;color:#f3ecd9;font:800 clamp(9px,2.6vw,12px)/1.1 "Noto Sans JP",sans-serif;text-shadow:0 1px 2px #000;letter-spacing:.02em}',
      '#bt .mmr .pl.ms .ic,#bt .mmr .pl.ms .nm{display:none}',
      '#bt .mmr .pl .st{position:absolute;left:19%;right:15%;top:65%;height:20%;display:flex;flex-direction:column;justify-content:space-around;opacity:0;color:#f3ecd9;font:700 clamp(6px,1.85vw,9px)/1.05 "Noto Sans JP",sans-serif}',
      '#bt .mmr .pl .st div{display:flex;justify-content:space-between}#bt .mmr .pl .st b{color:#ffe7a8;font-size:1.12em}',
      '#bt .mmr .fr{position:absolute;left:50%;top:var(--mmr-ft,1%);width:calc(var(--mmr-pw)*1.3);margin-left:calc(var(--mmr-pw)*-0.65);aspect-ratio:var(--mmr-far,400/560);z-index:60;pointer-events:none}',
      '#bt .mmr.lock .pl.c{animation:mmrlock .3s ease-out}@keyframes mmrlock{40%{filter:brightness(1.35)}}',
      // 2026-10-15 追加A：横長の技カード（新しい画面）。濃紺の地＋細い金の二重の縁・絵は 16:9 の窓いっぱい（contain＝正式カードと同じ比率なので余りなし）・下に技名の帯
      '#bt .mmr.cards .pl.cd{width:var(--mmr-cw);height:var(--mmr-ch);aspect-ratio:auto;margin-left:calc(var(--mmr-cw)/-2);top:9%}',
      '#bt .mmr.cards .pl.ms{width:var(--mmr-mw);aspect-ratio:259/326;margin-left:calc(var(--mmr-mw)/-2);top:9%}',
      '#bt .mmr.cards .pl .cf{position:absolute;inset:0;display:flex;flex-direction:column;gap:2px;padding:4px;box-sizing:border-box;border-radius:7px;background:linear-gradient(#1d2f5c,#0b1430);box-shadow:inset 0 0 0 1.5px #c9a35a,inset 0 0 0 3px #0b1430,inset 0 0 0 4px rgba(232,198,110,.42),0 3px 8px rgba(0,0,0,.55)}',
      '#bt .mmr.cards .pl .cf .ic{position:relative;left:auto;right:auto;top:auto;height:auto;width:100%;aspect-ratio:16/9;flex:none;border-radius:4px;background:#0b1430;overflow:hidden}',
      '#bt .mmr.cards .pl .cf .ic img{width:100%;height:100%;object-fit:contain;object-position:50% 50%;display:block}',
      '#bt .mmr.cards .pl .cf .ic img{opacity:0;transition:opacity .12s ease-out}#bt .mmr.cards .pl .cf .ic img.on{opacity:1}',   // 追加A：読み込めてから見せる（読み込み中は濃紺の枠と技名の帯だけ＝空白の白・旧い絵・途中まで描いた絵を出さない）
      '#bt .mmr.cards .pl .cf .nm{position:relative;left:auto;right:auto;top:auto;height:auto;flex:1 1 auto;min-height:0;display:flex;align-items:center;justify-content:center;padding:0 3px;border-radius:3px;background:rgba(0,0,0,.42);white-space:nowrap;overflow:hidden;color:#fff3d6;font-weight:800;letter-spacing:.02em;line-height:1}',
      '#bt .mmr.cards .pl.cd.c .cf{box-shadow:inset 0 0 0 2px #ffe08a,inset 0 0 0 3.5px #0b1430,inset 0 0 0 4.5px rgba(255,224,138,.6),0 0 12px rgba(255,214,120,.7),0 3px 8px rgba(0,0,0,.55)}',
      '#bt .mmr.cards .fr{display:none}#bt .mmr.cards.msc .fr{display:block}',
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
      // 2026-10-13 開発27（22）：左右とも上から「名前 → ライフのバー → 残りの数 → 状態異常・能力の上げ下げの札」の4段。札の段は高さ固定（札が出ても・増えても名前とライフは動かない）・はみ出す分は札を小さく／隠す（バーに重ねない）
      '#bt .hpn .hn1{order:0;flex:1 1 100%;max-width:100%}#bt .hpn.s1 .hn1{text-align:right}#bt .hpn #b0,#bt .hpn #b1{order:2}#bt .hpn .mmchips,#bt .hpn.s1 .mmchips{order:3;flex:0 0 100%;max-width:100%;height:18px;margin-top:1px;justify-content:flex-start}#bt .hpn.s1 .mmchips{justify-content:flex-end}',
      '#bt .hpn .mmchips .stb,#bt .hpn .mmchips .mmail span{height:15px!important;font-size:8px!important;line-height:13px!important;padding:0 3px 0 2px!important;letter-spacing:-.02em}#bt .hpn .mmchips .sts,#bt .hpn .mmchips .mmail{gap:2px!important}#bt .hpn .mmchips{gap:2px}',
      '#bt .hpn.s1 .hn1{display:flex;justify-content:flex-end}',
      // 2026-10-14 実機試遊㉕：同じ種族・同じ名前どうしでも左右が分かるよう、名前の前に小さな札（あなた／相手）。数値・顔・待機の絵は変えない
      '#bt .hpn .hn1::before{display:inline-block;vertical-align:1px;margin-right:4px;padding:0 5px;border-radius:7px;font:800 9px/14px "Noto Sans JP",sans-serif;letter-spacing:.04em;text-shadow:none;color:#fff}',
      '#bt .hpn.s0 .hn1::before{content:"あなた";background:#2b62c4;border:1px solid #9cc4ff}#bt .hpn.s1 .hn1::before{content:"相手";background:#a8342a;border:1px solid #ffb0a2;align-self:center}',
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
      '@keyframes mmawin{from{opacity:.45;transform:translateX(-50%) translateY(8%) scale(.92)}to{opacity:1;transform:translateX(-50%)}}',   // 2026-10-19 夜間 D29-B2：0 から始めると決着の瞬間に主役が1フレーム消える＝半透明から
      // ---- 2026-10-13 開発24（#bt.mma-v24）----
      // ① 大きさ：待機立ち絵・被弾／回避・勝利の絵を同じ倍率（--mma-k）で。足もと（bottom:0）は動かさない＝床に立ったまま。技のコマ（art25d）は待機立ち絵の大きさから作るので同じだけ小さくなる
      '#bt.mma-v24 .mon .mma-idle{height:calc(118% * var(--mma-k,1))}',
      '#bt.mma-v24 .mon .mma-idle.p25{height:calc(118% * var(--p25h,1) * var(--mma-k,1))}',
      '#bt.mma-v24 .mon .mma-rx{height:calc(118% * var(--rh,1) * var(--mma-k,1))}',
      '#bt.mma-v24 .mon .mma-win{height:calc(132% * var(--mma-k,1))}',
      // 接地の影は従来の .mon::after（index.html）をそのまま使う（二重にしない）
      // 戦場の位置：ルーレットが低くなった分だけ少し下げる（上に大きな空きを作らない）。公式ランク戦の正式背景は床が低い＝少し多め
      '#bt.mma-v24 .vs{translate:0 min(10.5dvh,90px)}',
      // 2026-10-13 開発25 B：公式ランク戦（正式の会場＝床の始まりが絵の約56%・円形の床の奥の縁が約60%）は足もとを円形の床の上（絵の約64%）へ。旧 10.5dvh では奥の縁（壁の前）に立って浮いて見えた
      '#bt.mma-v24:not([data-mmprac="1"]) .vs{translate:0 min(16dvh,160px)}',
      // 2026-10-14 実機試遊⑱：まだ浮いて見えた（足もと＝絵の約64%＝円形の床の奥の縁）→ 円形の床の中央（絵の約67〜69%＝「あなたのターン」・技カードの上の中央の印の手前）まで下げる。
      //  ルーレットの板（アーチ）にはかからない（375×667 で足もと 411px・板 422px）。2体とも同じ位置・同じ規則（待機・攻撃・被弾・決着の絵は .vs の中＝一緒に動く）
      '#bt.mma-v24:not([data-mmprac="1"]) .vs{translate:0 min(21.5dvh,210px)}',
      // 低い画面（375×667 など）は足もとの下に説明の文字があり足もとを下げきれない＝背景を下を軸に少しだけ大きく（床の円が上がって足もとに来る。絵は描き直さない・左右が少し切れる）
      '@media (max-height:720px){#bt.mma-v24:not([data-mmprac="1"]) .mma-bg.ofc{transform:scale(1.27)}}',   // 2026-10-14 実機試遊⑱：1.19 → 1.27（足もとが円形の床の中央に来る）
      // 2026-10-13 開発25 C：勝ち／負けの画面（mma-end）。帯は画面の下 40%（モンスターの足もとより下・技UIの箱 z6 より奥＝もどるを暗くしない）・文字・一言・もどるを帯の中に
      '#bt.mma-v24 .mma-endband{position:absolute;left:0;right:0;bottom:0;height:40%;z-index:5;pointer-events:none;opacity:0;animation:mmaend .5s ease-out .15s forwards}',
      '#bt.mma-v24.mma-res-win .mma-endband{background:linear-gradient(rgba(40,26,4,0),rgba(40,26,4,.55) 22%,rgba(22,14,4,.86) 60%,rgba(14,9,3,.94))}',
      '#bt.mma-v24.mma-res-lose .mma-endband{background:linear-gradient(rgba(8,14,34,0),rgba(8,14,34,.6) 22%,rgba(6,10,26,.88) 60%,rgba(4,7,18,.95))}',
      '#bt.mma-v24 .mma-endln{position:absolute;left:12%;right:12%;top:20%;height:1.5px;background:linear-gradient(90deg,rgba(232,198,110,0),#e8c66e 30%,#f6e3a6 50%,#e8c66e 70%,rgba(232,198,110,0))}',
      '#bt.mma-v24.mma-res-lose .mma-endln{background:linear-gradient(90deg,rgba(150,170,210,0),#8fa3cc 30%,#c4d0ea 50%,#8fa3cc 70%,rgba(150,170,210,0))}',
      '#bt.mma-v24 .mma-endsub{position:absolute;left:0;right:0;top:52%;text-align:center;font:700 15px/1.3 "Noto Sans JP",sans-serif;letter-spacing:.12em;color:#f6e7bf;text-shadow:0 1px 3px rgba(0,0,0,.8)}',
      '#bt.mma-v24.mma-res-lose .mma-endsub{color:#c9d3ea}',
      '@keyframes mmaend{to{opacity:1}}',
      '#bt.mma-v24.mma-end #msg{visibility:hidden!important}',
      // 決着のポーズ（fight() が .mon の .spa に差し込む img.spi）も足もと＝箱の下にそろえる（旧：top:0 が当たって箱の上に寄り、浮いて見えた）
      '#bt.mma-v24 .spa>img.spi{position:absolute!important;left:50%;top:auto!important;bottom:0!important}',
      // 勝ち負けの文字：帯の上の線の少し上（モンスターの足もとより下）
      '#bt.mma-v24.mma-end>#ban{top:auto!important;bottom:calc(40% * .6);font-size:clamp(3.2rem,15vw,4.4rem);letter-spacing:.04em;line-height:1}',
      '#bt.mma-v24.mma-res-lose>#ban{color:#e4ebf8;text-shadow:0 0 14px rgba(110,140,200,.75),0 0 30px rgba(60,90,160,.5),3px 3px 0 #0a1230}',
      '#bt.mma-v24.mma-res-win>#ban{color:#fff6d6;text-shadow:0 0 16px rgba(255,200,90,.85),0 0 36px rgba(255,170,40,.55),3px 3px 0 #3a2404}',
      // もどる：光る丸ではなく帯に収まる横長のボタン（押す所・処理は #go のまま）
      '#bt.mma-v24.mma-end .gow{z-index:12}',
      '#bt.mma-v24.mma-end button.go.bk{width:min(56vw,220px)!important;height:50px!important;aspect-ratio:auto;border-radius:999px!important;top:auto;bottom:calc(env(safe-area-inset-bottom,0px) + 10%);transform:translateX(-50%);animation:none;background:linear-gradient(#24387f,#0f1c4d);border:2px solid #e0b861;box-shadow:0 4px 14px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.18)}',
      '#bt.mma-v24.mma-res-lose button.go.bk{border-color:#a9b8d8}',
      '#bt.mma-v24.mma-end button.go.bk:active{transform:translateX(-50%) scale(.96)}',
      '#bt.mma-v24.mma-end button.go.bk .gtx{font:800 17px/1 "Noto Sans JP",sans-serif;letter-spacing:.2em;color:#fff3d0;-webkit-text-fill-color:#fff3d0;text-shadow:0 1px 2px rgba(0,0,0,.6)}',
      '@media (prefers-reduced-motion:reduce){#bt.mma-v24 .mma-endband{animation:none;opacity:1}}',
      // 2026-10-13 開発27（23）：勝ち／負けの画面を横帯に統一（全バトル共通・判定は変えない）。勝ち＝金〜暖色の横帯に大きく WIN／負け＝落ち着いた寒色の横帯に LOSE。
      //  旧描画層：勝ったとき fight() が差し込む決着のポーズ（.sp／.spa の img.spi＝旧 2D）が正式の勝利の絵の後ろに残っていた → 正式の勝利の絵（mma-win）がある間は旧のポーズの層を出さない（1体だけ）
      '#bt .mon.mma-won>:not(.mma-win){visibility:hidden!important;opacity:0!important}',
      // 2026-10-14 開発29（9）：決着のあとは旧のポーズ（.sp／.spa＝SPX）・旧の静止の絵・倒れる動き（.dead）を出さない。正式の待機立ち絵（mma-fin）だけ（勝利の絵がある側はそれだけ）
      '#bt.mma-fin .mon>:not(.mma-win):not(.mma-fin){visibility:hidden!important;opacity:0!important}',
      '#bt.mma-fin .mon.mma-won>.mma-fin{visibility:hidden!important;opacity:0!important}',
      // 2026-10-14 開発29（8）：決着の曲（WIN 4秒／LOSE 5秒）の間は「もどる」を見せない・押せない（index.html の rjLock が #bt に data-rjlock を付ける）
      '#bt[data-rjlock] .gow,#bt[data-rjlock] #go{opacity:0!important;pointer-events:none!important}',
      // 2026-10-14 実機試遊⑥：LOSE（5.00秒）は曲の終わり（4.6秒）までに「もどる」を出してすぐ押せる＝曲のあとの長い無音を待たせない（やわらかく 0.3秒で出す）
      '#bt[data-rj] .gow,#bt[data-rj] #go{transition:opacity .3s ease-out}',
      '#bt.mma-fin .mon:not(.mma-won)>.mma-fin{opacity:1!important;visibility:visible!important}',
      '#bt .mon .mma-fin{position:absolute;left:50%;bottom:0;height:calc(118% * var(--mma-k,1) * var(--rh,1));width:auto;max-width:none;transform:translateX(-50%);pointer-events:none;filter:drop-shadow(0 8px 6px rgba(0,0,0,.45))}',
      '#bt .mon .mma-fin.fl{transform:translateX(-50%) scaleX(-1)}',
      '#bt.mma-fin .mw.dead,#bt.mma-fin .dead .mon{animation:none!important;transform:none!important;opacity:1!important;filter:none!important;transition:none!important}',
      '#bt.mma-v24 .mma-endband{top:auto;bottom:calc(40% * .6 - 4.6%);height:clamp(92px,15%,130px);transform-origin:50% 50%;animation:mmaendb .42s cubic-bezier(.2,1.1,.4,1) .1s both}',
      '#bt.mma-v24.mma-res-win .mma-endband{background:linear-gradient(90deg,rgba(120,56,0,0),rgba(176,96,12,.78) 14%,rgba(232,156,40,.9) 38%,rgba(250,196,84,.94) 50%,rgba(232,156,40,.9) 62%,rgba(176,96,12,.78) 86%,rgba(120,56,0,0))}',
      '#bt.mma-v24.mma-res-lose .mma-endband{background:linear-gradient(90deg,rgba(10,22,58,0),rgba(22,44,96,.82) 14%,rgba(42,74,140,.9) 40%,rgba(58,92,162,.92) 50%,rgba(42,74,140,.9) 60%,rgba(22,44,96,.82) 86%,rgba(10,22,58,0))}',
      '#bt.mma-v24 .mma-endln{top:0;left:6%;right:6%}#bt.mma-v24 .mma-endband::after{content:"";position:absolute;left:6%;right:6%;bottom:0;height:1.5px;background:inherit;background:linear-gradient(90deg,rgba(232,198,110,0),#e8c66e 30%,#f6e3a6 50%,#e8c66e 70%,rgba(232,198,110,0))}',
      '#bt.mma-v24.mma-res-lose .mma-endband::after{background:linear-gradient(90deg,rgba(150,170,210,0),#8fa3cc 30%,#c4d0ea 50%,#8fa3cc 70%,rgba(150,170,210,0))}',
      '#bt.mma-v24 .mma-endsub{top:calc(100% + 8px)}',
      '#bt.mma-v24.mma-end>#ban{font-size:clamp(3.6rem,17vw,5rem)}',
      '#bt.mma-v24.mma-res-win>#ban{color:#fffaf0;text-shadow:0 2px 0 #7a3a00,0 0 18px rgba(255,236,170,.9),3px 4px 0 #4a2200}',
      '@keyframes mmaendb{from{opacity:0;transform:scaleY(.2)}to{opacity:1;transform:none}}',
      // 2026-10-16（iPhone 6件 A6・ユーザー要望）：WIN の帯＝青・LOSE の帯＝赤（文字の WIN!／LOSE は残す＝色だけで勝敗を伝えない）。文字は白＋濃い縁取りで読みやすく。時刻・曲・もどる・結果は変えない
      '#bt.mma-v24.mma-res-win .mma-endband{background:linear-gradient(90deg,rgba(6,30,96,0),rgba(14,58,170,.82) 14%,rgba(28,96,224,.92) 38%,rgba(52,128,246,.95) 50%,rgba(28,96,224,.92) 62%,rgba(14,58,170,.82) 86%,rgba(6,30,96,0))}',
      '#bt.mma-v24.mma-res-win .mma-endband::after{background:linear-gradient(90deg,rgba(170,220,255,0),#a9d8ff 30%,#e6f4ff 50%,#a9d8ff 70%,rgba(170,220,255,0))}',
      '#bt.mma-v24.mma-res-win>#ban{color:#ffffff!important;text-shadow:0 2px 0 #0a2a7a,0 0 16px rgba(150,205,255,.9),3px 4px 0 #061a52!important}',
      '#bt.mma-v24.mma-res-lose .mma-endband{background:linear-gradient(90deg,rgba(90,6,12,0),rgba(150,16,28,.84) 14%,rgba(200,30,44,.92) 40%,rgba(222,48,58,.95) 50%,rgba(200,30,44,.92) 60%,rgba(150,16,28,.84) 86%,rgba(90,6,12,0))}',
      '#bt.mma-v24.mma-res-lose .mma-endband::after{background:linear-gradient(90deg,rgba(255,190,190,0),#ffc2c2 30%,#ffe9e9 50%,#ffc2c2 70%,rgba(255,190,190,0))}',
      '#bt.mma-v24.mma-res-lose>#ban{color:#ffffff!important;text-shadow:0 2px 0 #5a0008,0 0 14px rgba(255,170,170,.75),3px 4px 0 #3a0006!important}',
      '@media (prefers-reduced-motion:reduce){#bt.mma-v24 .mma-endband{animation:none;opacity:1}}',
      '#bt.mma-v24[data-mmprac="1"] .vs{translate:0 min(9.5dvh,82px)}',
      // ② ルーレット：アーチ・レールの位置を低い板に合わせる
      '#bt.mma-v24 .mmr .arch{top:56%}#bt.mma-v24 .mmr .rail{top:83%}',
      '#bt.mma-v24 .mmr .pl .nm{font-size:clamp(9px,2.5vw,11px);font-weight:700;color:#fff3d6;letter-spacing:.03em}',
      // ③ 技の発動中（#bt.mma-cine）：名前・HP・状態・TURN・降参・ルーレット・STOP・説明を見えなくする（opacity／visibility だけ＝レイアウトは変えない）。技名・モンスター・技の絵・被弾／回避・ダメージの数字は残る
      '#bt.mma-v24 .hpr,#bt.mma-v24 .tm,#bt.mma-v24 button.sur,#bt.mma-v24 .bui{transition:opacity .18s ease-out}',
      '#bt.mma-v24.mma-cine .hpr,#bt.mma-v24.mma-cine .tm,#bt.mma-v24.mma-cine button.sur,#bt.mma-v24.mma-cine .bui{opacity:0!important;visibility:hidden;pointer-events:none!important;transition:opacity .12s ease-in,visibility 0s linear .12s}',
      // 技名：上に控えめに（白〜淡い金）
      '#bt.mma-v24 .skb3{top:calc(env(safe-area-inset-top,0px) + 8.5%);font-size:1.5rem;font-style:normal;font-weight:800;letter-spacing:.06em;color:#fff7e2;text-shadow:0 0 10px rgba(255,214,140,.7),0 0 2px #000,0 2px 4px rgba(0,0,0,.85)}',
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
      if (bt.classList.contains('mma-v24') && (SCALE[sp] || IDLE[sp])) mon.style.setProperty('--mma-k', String(kOf(sp)));   // 2026-10-13：体格ごとの大きさ
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
    const NEW = bt.classList.contains('mma-v24'), Gm = NEW ? GEO.v24 : GEO.old, PL = NEW ? `${A}roulette/compact_1013/` : `${A}roulette/`, SFX = NEW ? '_c' : '';   // 2026-10-13：低い板（派生）
    // 2026-10-15 追加A（N09 の最新版）：新しい画面の技の板＝横長の技カード（CARD）。正式の技カード（16:9）を板の幅いっぱいに切らず・伸ばさず、
    //  下に技名の専用の帯。旧い板の絵（plate_normal／selected）の縦長の小窓に入れる二重の額縁はやめた。MISS の板は絵柄そのまま（高さだけ揃える＝No.26）。
    //  並びの間隔だけカードの幅に合わせて少し広げる（CARD_SP。見た目だけ＝抽選・停止・結果・タイミングは変えない）
    const CARD = NEW, cw = Math.round(Math.min(W * 0.27, 132)), hb = Math.round(Math.max(15, cw * 0.155)), ch = Math.round(8 + (cw - 8) * 9 / 16 + 2 + hb);
    const box = document.createElement('div'); box.className = 'mmr' + (CARD ? ' cards' : ''); box.setAttribute('aria-hidden', 'true');
    box.style.setProperty('--mmr-pw', pw + 'px'); box.style.setProperty('--mmr-h', (CARD ? Math.round(ch * 1.22 + 16) : Math.round(pw * Gm.hk * 1.16 + Gm.pad)) + 'px');
    if (CARD) { box.style.setProperty('--mmr-cw', cw + 'px'); box.style.setProperty('--mmr-ch', ch + 'px'); box.style.setProperty('--mmr-mw', Math.round(ch * 259 / 326) + 'px'); box.style.setProperty('--mmr-hb', hb + 'px'); }
    box.style.setProperty('--mmr-ar', Gm.ar); box.style.setProperty('--mmr-far', Gm.fr); box.style.setProperty('--mmr-ft', Gm.frTop + '%');
    box.innerHTML = `<img class="arch" src="${A}roulette/arch.webp" alt=""><img class="rail" src="${A}roulette/rail_base.png" alt=""><div class="trk"></div><img class="fr" src="${PL}center_frame${SFX}.webp" alt="">`;
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
    // 2026-10-14 実機試遊⑰：ルーレットの技の絵＝正式の技カード（MMMVCARD＝SK の番号 → カード）。fight() の行は旧の技絵（SKART）と技名だけを持つので、
    //  今ルーレットを回している側（見出し「〇〇のルーレット」）の装備の中から同じ技名の SK を探してカードに替える（無ければ従来の絵）。抽選・結果・6枠は変えない
    const cardOf = (nm, fb) => {
      try {
        const C = root.MMMVCARD, SK = G('SK'), P = G('BPL'); if (!C || !SK || !P || !nm) return fb;
        const rh = (rl.querySelector('.rh') || {}).textContent || '';
        const sides = P.filter(Boolean), cur = sides.filter((p) => p.name && rh.indexOf(p.name + 'のルーレット') === 0);
        for (const p of (cur.length ? cur : sides)) for (const k of (p.eq || [])) if (k >= 0 && SK[k] && SK[k][0] === nm) { const c = C.bySlot(k); if (c) return c.src; }
      } catch (e) {}
      return fb;
    };
    const read = (row) => {
      const ms = row.classList.contains('ms'), img = row.querySelector('img.rt'), nm = (row.querySelector('.rn') || {}).textContent || '';
      const vals = [...row.querySelectorAll('.rst b')].map((b) => b.textContent);
      const fb = img ? img.getAttribute('src') : '';
      return { ms, src: ms ? fb : cardOf(nm, fb), nm, vals, card: !ms && cardOf(nm, null) != null };
    };
    function build() {
      const rows = [...rl.querySelectorAll('.rw')];
      S.len = rows.length || 7;
      trk.innerHTML = rows.map((row) => {
        const d = read(row);
        if (CARD && !d.ms) return `<div class="pl cd"><div class="cf"><div class="ic${d.card ? ' mvc' : ''}"${d.src ? ` data-src="${d.src}"` : ''}></div><div class="nm"></div></div></div>`;
        return `<div class="pl${d.ms ? ' ms' : ''}"><img class="bgp nor" src="${PL}${d.ms ? 'plate_miss' : 'plate_normal'}${SFX}.webp" alt="">${d.ms ? '' : `<img class="bgp sel" src="${PL}plate_selected${SFX}.webp" alt="">`}`
          + (d.ms ? '' : `<div class="ic${d.card ? ' mvc' : ''}">${d.src ? `<img src="${d.src}" alt="" decoding="async">` : ''}</div><div class="nm"></div>${NEW ? '' : '<div class="st"><div>威力<b></b></div><div>命中率<b></b></div><div>クリ率<b></b></div></div>'}`) + '</div>';   // 2026-10-13：新しい画面は威力・命中率・クリ率を出さない（計算・技のデータは変えない）
      }).join('');
      S.plates = [...trk.children];
      // 追加A：技カードの絵＝先に読んでデコード済みの Image そのものを差し込む（毎ターン作り直しても読み直さない＝ちらつかない）。まだの絵は新しく読み、読めてから出す（.on）
      if (CARD) for (const ic of trk.querySelectorAll('.pl.cd .ic[data-src]')) {
        const src = ic.dataset.src, c = CARD_IMG.get(src); let im;
        if (!ic.classList.contains('mvc')) { im = new Image(); im.className = 'on'; im.alt = ''; im.src = src; }   // 正式カードの無い技（従来の絵）
        else if (c && c.dataset.ok === '1' && c.naturalWidth && !c.isConnected) { im = c; im.classList.add('on'); }
        else { im = new Image(); im.alt = ''; im.decoding = 'async'; im.onload = () => im.classList.add('on'); im.src = src; }
        ic.appendChild(im);
      }
      rows.forEach((row, i) => {
        const d = read(row), el = S.plates[i]; if (d.ms) return;
        const nm = el.querySelector('.nm'); nm.textContent = d.nm;
        if (CARD) nm.style.fontSize = Math.max(8, Math.min(12.5, (cw - 16) / Math.max(4, [...d.nm].length))).toFixed(1) + 'px';   // 長い技名も1行で欠けない（フェザーストーム・ドラゴンクラッシュなど）
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
        rouletteHit(rows[hit]);   // 2026-10-13：止まった枠が MISS なら、その番の MISS の数字で観客の落胆（1回）
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
        const x = d * (CARD ? CARD_SP : R.spacing) * W * (1 - 0.08 * Math.min(a, 3));
        el.style.transform = `translate3d(${x.toFixed(1)}px,${drop.toFixed(1)}px,0) rotateY(${(-rot).toFixed(1)}deg) scale(${sc.toFixed(3)})`;
        el.style.zIndex = String(50 - Math.round(a * 10));
        el.style.opacity = String(a > 3.2 ? Math.max(0, 1 - (a - 3.2) * 3) : 1);
        el.style.filter = dim < 0.999 ? `brightness(${dim.toFixed(2)})` : '';
        const sel = el.querySelector('.sel'), st = el.querySelector('.st'), nm = el.querySelector('.nm'), k = Math.max(0, 1 - a * 2.2);
        if (sel) sel.style.opacity = k.toFixed(2);
        if (st) st.style.opacity = k > 0.6 ? ((k - 0.6) / 0.4).toFixed(2) : '0';
        // 中央（選択中の板）へ近づくほど、技の絵・名前を選択中の板の窓の位置へ（間は補間）
        const ic = el.querySelector('.ic'), f = (u, v) => (u + (v - u) * k).toFixed(2) + '%';
        if (ic && !CARD) { ic.style.left = f(Gm.n[0], Gm.s[0]); ic.style.right = f(Gm.n[1], Gm.s[1]); ic.style.top = f(Gm.n[2], Gm.s[2]); ic.style.height = f(Gm.n[3], Gm.s[3]); }
        if (nm && !CARD) { nm.style.top = f(Gm.nm[0], Gm.nm[2]); nm.style.height = f(Gm.nm[1], Gm.nm[3]); }
        if (nm && NEW) nm.style.opacity = (CARD ? Math.max(0, Math.min(1, 1 - (a - 2.4) * 2)) : k > 0.5 ? (k - 0.5) / 0.5 : 0).toFixed(2);   // 2026-10-13：技名は中央の板だけ。追加A（技カード）：左右のカードも帯に技名（空の帯を見せない・遠い端だけ消す）
        if (CARD && a < 0.5) box.classList.toggle('msc', el.classList.contains('ms'));   // 中央が MISS の板のときだけ従来の中央の枠（.fr）
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
        const os = R.overshootPx / Math.max(1, (CARD ? CARD_SP : R.spacing) * W);   // 慣性で減速 → ごく小さな行き過ぎ（px を候補の単位へ）→ 吸着
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
  const HIDE_MSG = /^(タイミングよくボタンを押せ！|相手がルーレットを回している…|勝利！(（判定勝ち）)?)\s*$/;   // 2026-10-13 開発24：相手の番の説明も出さない（敵の抽選・進行は従来どおり）
  const VICTORY = ['solamo', 'gauru', 'nobiton', 'jiol', 'regnas'];
  function setupText(bt) {
    const msg = $('#msg', bt);
    const sync = () => {
      if (msg) msg.classList.toggle('mm-q', HIDE_MSG.test(msg.textContent || ''));
      const ban = bt.querySelector(':scope>#ban');
      const turn = !!(ban && ban.classList.contains('sm'));
      if (turn) { const t = (ban.textContent || '').trim(); if (t === 'あなたのターン') turnSide = 0; else if (t === '相手のターン') turnSide = 1; }
      bt.classList.toggle('mm-turn', turn);
      if (turn && !ban.classList.contains('mm-low') && msg) {   // ターンの表示＝下の説明の位置（帯は無い）
        const r = msg.getBoundingClientRect(), b = bt.getBoundingClientRect();
        if (r.height || r.top) { ban.style.top = (r.top - b.top + Math.max(r.height, 20) / 2) + 'px'; ban.classList.add('mm-low'); }
      }
      if (ban && /^WIN!/.test(ban.textContent || '')) won(bt);
      if (ban && /^(WIN!|LOSE)/.test(ban.textContent || '')) fin(bt);
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(bt, { childList: true });
    if (msg) mo.observe(msg, { childList: true, characterData: true, subtree: true });
  }
  // 2026-10-13 開発28 B（監査）：WIN のあと fight() が決着のポーズを描き直す（#m0 .mon の子を入れ替える）と、足した勝利の絵も一緒に消え、次の帯の描き直しまで約0.6〜1.2秒 主役が空白だった
  //  → 勝利の絵はバトルごとに1枚だけ作って持ち、消されたら同じ絵（読み込み済み）をすぐ戻す（登場の動きはくり返さない）。fight()・判定・結果は変えない
  const WIN_IMG = new WeakMap();   // #bt → { im, loaded, failed, mo }
  const WIN_PRE = new Map();   // 勝利の絵の先読み（src → デコード済みの Image）
  function winPreload() { try { const pl = G('BPL'), sp = pl && pl[0] ? pl[0].sp : null; if (!VICTORY[sp]) return; const src = `./assets/tournament/victory/${VICTORY[sp]}_victory.webp`; if (WIN_PRE.has(src)) return; const im = new Image(); im.decoding = 'async'; im.onload = () => { if (im.decode) im.decode().catch(() => {}); }; im.src = src; WIN_PRE.set(src, im); } catch (e) {} }
  function won(bt) {
    const pl = G('BPL'), sp = pl && pl[0] ? pl[0].sp : null;
    if (!VICTORY[sp] || !$('#m0 .mon', bt)) return;
    let w = WIN_IMG.get(bt);
    if (!w) {
      // 2026-10-19 夜間 D29-B2：バトルの開始で先に読んだ勝利の絵（winPreload）があればそれを使う＝WIN! の瞬間から勝利の絵（読み込みの間に待機立ち絵が見えない）
      const src = `./assets/tournament/victory/${VICTORY[sp]}_victory.webp`, pre = WIN_PRE.get(src);
      const im = pre && pre.complete && pre.naturalWidth ? pre : new Image(); im.className = 'mma-win'; im.alt = ''; im.decoding = 'async';
      w = { im, loaded: im === pre, failed: false, mo: null }; WIN_IMG.set(bt, w); if (im === pre) WIN_PRE.delete(src);
      im.onload = () => { w.loaded = true; const m = $('#m0 .mon', bt); if (m && im.parentNode === m) m.classList.add('mma-won'); };
      im.onerror = () => { w.failed = true; im.remove(); };
      if (im !== pre) im.src = src;
      const side = $('#m0', bt);
      if (side) { w.mo = new MutationObserver(() => { if (!bt.isConnected) { w.mo.disconnect(); return; } placeWin(bt, w, true); }); w.mo.observe(side, { childList: true, subtree: true }); }
    }
    placeWin(bt, w, false);
  }
  function placeWin(bt, w, re) {
    if (w.failed) return;
    const mon = $('#m0 .mon', bt); if (!mon || mon.querySelector('.mma-win')) return;
    if (re) w.im.style.animation = 'none';
    mon.appendChild(w.im); if (w.loaded) mon.classList.add('mma-won');
  }
  // 2026-10-14 開発29（9）：決着（WIN!／LOSE）で fight() が差し込む旧 2D の決着のポーズ（poseSeq＝SPX の WINS／LOSES を 0.65秒ごとに .mon の中身へ入れ替える。
  //   ソラモ・ガウル）と、旧の倒れる動き（.dead＝回転・灰色。ノビトン・ジオル・レグナス）が、正式の勝利の絵が無い側（負けた側・相手が勝った側）に出ていた
  //   → 決着のあとは両側とも旧のポーズ・倒れる動きを出さず、正式の待機立ち絵（assets/battle/idle/。同じ大きさ・向き）を1枚だけ立てる。プレイヤーが勝った側は従来どおり正式の勝利の絵（mma-win）。
  //   fight()・判定・結果・WIN／LOSE の帯と音は変えない。旧の絵（SPX）は技の演出でも使うので消さない（表示の経路だけ止める）
  //  2026-10-15 N02：負けた側は「負けた」と分かる姿＝既存の正式 2.5D のリアクション「しょんぼり」（assets/monsters/reactions_1012/・MMRXART の sad。
  //   バトルの開始時に先に読む＝rxPreload）。敗北の専用の絵は未提供＝DEFEAT_ART（種族の番号 → 絵のパス）を空のまま用意し、届いたら1行で差し替える。
  //   読めていない（読み込み中・404）ときは従来どおり待機立ち絵。勝った側（プレイヤー）は正式の勝利の絵・相手が勝ったときの相手は待機立ち絵（従来どおり）
  const DEFEAT_ART = Object.freeze({});   // 専用の敗北の絵（追加制作待ち）：{ [sp]: { src, hRel } }
  function loseArt(s, sp) {
    const d = DEFEAT_ART[sp]; if (d) return { src: d.src, hRel: d.hRel || 1, kind: 'defeat' };
    const X = root.MMRXART, inf = X && X.info(sp, 'sad'), im = rxImg[`${s}:sad`];
    return inf && im && im.dataset.src === inf.src && im.dataset.ok === '1' && im.naturalWidth ? { src: inf.src, hRel: inf.hRel, kind: 'sad' } : null;
  }
  const FIN_IMG = new WeakMap();   // #bt → [side0, side1]
  const finLog = [];
  function fin(bt) {
    const ban = bt.querySelector(':scope>#ban'), win = !!ban && /^WIN!/.test(ban.textContent || '');
    if (!bt.classList.contains('mma-fin')) { bt.classList.add('mma-fin'); finLog.push({ at: Date.now(), win }); }
    const pl = G('BPL'); if (!pl) return;
    let arr = FIN_IMG.get(bt);
    if (!arr) {
      const loser = win ? 1 : 0;
      arr = [0, 1].map((s) => {
        const sp = pl[s] && pl[s].sp, la = s === loser ? loseArt(s, sp) : null, src = la ? la.src : idleSrc(sp); if (!src) return null;
        // 2026-10-19 夜間 D29-B2：決着の瞬間に絵が1フレーム消えていた＝新しく作った <img> は読み込みが終わるまで幅 0（CSS は旧の絵をもう隠している）。
        //  先に読んでデコード済みの要素を使う＝しょんぼりは rxImg の要素そのもの・待機立ち絵はその側に出ている読み込み済みの待機絵の写し。無ければ従来どおり新しく作る
        const pre = la && la.kind === 'sad' ? rxImg[`${s}:sad`] : null, idleEl = !la ? $(`#m${s} .mon img.mma-idle`, bt) : null;
        const im = pre ? pre : idleEl && idleEl.complete && idleEl.naturalWidth && idleEl.getAttribute('src') === src ? idleEl.cloneNode(false) : new Image();
        if (pre) delete rxImg[`${s}:sad`];
        im.removeAttribute('style'); im.className = 'mma-fin' + (la ? ' mma-lose' : '') + (flipOf(s, sp) ? ' fl' : ''); im.alt = ''; im.decoding = 'sync'; if (im.getAttribute('src') !== src) im.src = src;
        if (la) { im.style.setProperty('--rh', String(la.hRel)); im.dataset.kind = la.kind; }
        if (s === loser && finLog.length) finLog[finLog.length - 1].lose = la ? { side: s, kind: la.kind } : { side: s, kind: 'idle' };
        const mon = $(`#m${s} .mon`, bt); if (mon && bt.classList.contains('mma-v24') && (SCALE[sp] || IDLE[sp])) mon.style.setProperty('--mma-k', String(kOf(sp)));
        const side = $(`#m${s}`, bt);
        if (side) { const mo = new MutationObserver(() => { if (!bt.isConnected) { mo.disconnect(); return; } placeFin(bt, s, im); }); mo.observe(side, { childList: true, subtree: true }); }
        return im;
      });
      FIN_IMG.set(bt, arr);
    }
    arr.forEach((im, s) => im && placeFin(bt, s, im));
  }
  function placeFin(bt, s, im) {
    const mon = $(`#m${s} .mon`, bt); if (!mon || im.parentNode === mon) return;
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
  // 追加A（2026-10-15）：ルーレットの技カード（正式 16:9）を先に読んでデコードしておく（VS の間＝warmCards・バトルの開始＝setup）。
  //  読み終わった絵はルーレットを作った瞬間から見せ、まだのものは読めた時点でふわっと出す（.on）。抽選・STOP・結果には触れない
  const CARD_IMG = new Map();
  function warmCards(eqs) {
    const C = root.MMMVCARD; if (!C) return;
    for (const k of (eqs || [])) {
      const c = k >= 0 ? C.bySlot(k) : null; if (!c || CARD_IMG.has(c.src)) continue;
      const im = new Image(); im.alt = ''; im.decoding = 'sync'; im.dataset.ok = '';
      im.onload = () => { const ok = () => { im.dataset.ok = '1'; }; if (im.decode) im.decode().then(ok, ok); else ok(); };
      im.src = c.src; CARD_IMG.set(c.src, im);
    }
  }
  const cardReady = (src) => { const im = CARD_IMG.get(src); return !!(im && im.dataset.ok === '1' && im.naturalWidth); };
  let lastAct = null;
  /** 両側の被弾・回避の絵を先に読んでデコードしておく（側ごとに別の要素＝同じ種族どうしでも重ならない）。読み終わっていない絵には差し替えない */
  const rxImg = {};
  function rxPreload() {
    const pl = G('BPL'), X = root.MMRXART; if (!pl || !X) return;
    [0, 1].forEach((s) => ['hit', 'dodge', 'sad'].forEach((k) => {   // 2026-10-15 N02：sad＝決着で負けた側の姿（fin）
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
        if (side >= 0 && rMiss && n.classList.contains('ms') && rMiss.side === side && now() - rMiss.t < 3000) {   // ルーレットの MISS（自分の番の MISS の数字）＝落胆。動けない行動は rules.js が数字ごと飲み込む＝鳴らさない
          rMiss = null; const nn = n; setTimeout(() => { if (nn.isConnected) crowd('miss'); }, 0); continue;
        }
        if (side < 0 || !lastAct || lastAct.target !== side || now() - lastAct.t > 4000) continue;   // 自分の番のミス（ルーレットの MISS・動けない）は攻撃を受けた側ではない＝出さない
        const act = lastAct; lastAct = null;   // 1回の行動につき1回だけ
        if (root.MMRULES && root.MMRULES.swallow && root.MMRULES.swallow(n)) continue;   // まひ・ねむりで動けない行動の MISS（js/battle/rules.js）
        if (!n.isConnected) continue;   // 2026-10-13：ほかの見張り（fx.js）が先に飲み込んだ MISS（動けない行動）も同じく扱う
        const ms = n.classList.contains('ms');
        if (ms === !act.hit) { try { react(side, ms ? 'dodge' : 'hit'); } catch (e) { /* 見た目だけ */ } crowd(ms ? 'evade' : 'hit'); }
      }
    }).observe(bt, { childList: true, subtree: true });
  }
  // ---- 2026-10-13 開発24：観客の声・技の発動中の表示 ----
  let turnSide = -1, rMiss = null;
  const crowdLog = [];
  function crowd(kind) { try { const ok = root.MMCROWD ? root.MMCROWD.react(kind, document.getElementById('bt')) : false; crowdLog.push({ kind, ok, side: turnSide }); if (crowdLog.length > 40) crowdLog.shift(); } catch (e) { /* 音だけ */ } }
  /** ルーレットが止まった（fight() の #rl の .hit）：MISS の枠なら、その番の MISS の数字を待つ */
  function rouletteHit(row) { rMiss = row && row.classList.contains('ms') && turnSide >= 0 ? { side: turnSide, t: now() } : null; }
  /** 技の発動中：技名の帯（skb＝技が出たときだけ。動けない行動では出ない）が出てから、fight() が .bui.anim を外すまで。決着・中断でも必ず戻す */
  function setupCine(bt) {
    const bui = $('.bui', bt); if (!bui || !bt.classList.contains('mma-v24')) return;
    let on = false, t = 0;
    const off = () => { clearTimeout(t); if (on) { on = false; bt.classList.remove('mma-cine'); } };
    const start = () => { if (on || !bui.classList.contains('anim')) return; on = true; bt.classList.add('mma-cine'); clearTimeout(t); t = setTimeout(off, 4200); };   // 万一 .anim が外れなくても約4秒で戻す
    new MutationObserver(() => { if (!bui.classList.contains('anim')) off(); }).observe(bui, { attributes: true, attributeFilter: ['class'] });
    new MutationObserver((ms) => {
      for (const m of ms) for (const n of m.addedNodes) {
        if (!n || n.nodeType !== 1) continue;
        if (n.classList && n.classList.contains('skb3')) start();
        if (n.id === 'ban' && /^(K\.O\.!|TIME UP|降参|WIN!|LOSE)/.test((n.textContent || '').trim())) off();
      }
    }).observe(bt, { childList: true });
    const go = $('#go', bt); if (go) new MutationObserver(() => { if (go.classList.contains('bk')) off(); }).observe(go, { attributes: true, attributeFilter: ['class'] });
  }
  /** 2026-10-19（次便一括・第1工程）：自分・相手の立ち絵（待機・被弾／回避・勝利・決着）が画面の左右の端からはみ出したら、はみ出した分だけ内側へずらす（--mma-dx）。
   *  絵の大きさ・足もと・向きは変えない（横の位置だけ）。絵が読めた瞬間・差し替えた直後・画面の大きさが変わったときに測り直す */
  const EDGE_PAD = 4;
  function keepIn(bt) {
    bt = bt || document.getElementById('bt'); if (!bt) return;
    const W = (root.innerWidth || bt.clientWidth || 0);
    bt.querySelectorAll('.mon :is(.mma-idle,.mma-rx,.mma-win,.mma-fin)').forEach((im) => {
      if (!im.naturalWidth || !im.isConnected) return;
      im.style.setProperty('--mma-dx', '0px'); const r = im.getBoundingClientRect(); if (!r.width) return;
      const dx = r.width > W - 2 * EDGE_PAD ? 0 : r.left < EDGE_PAD ? EDGE_PAD - r.left : r.right > W - EDGE_PAD ? W - EDGE_PAD - r.right : 0;
      im.style.setProperty('--mma-dx', Math.round(dx) + 'px'); if (dx) keepLog.push({ c: im.className, dx: Math.round(dx) });
    });
    if (keepLog.length > 40) keepLog.splice(0, keepLog.length - 40);
  }
  const keepLog = [];
  const keepSoon = (bt) => { try { (root.requestAnimationFrame || setTimeout)(() => keepIn(bt)); } catch (e) {} };
  function setup(bt) {
    if (!bt.__keepIn) { bt.__keepIn = true; bt.addEventListener('load', (e) => { if (e.target && e.target.tagName === 'IMG') keepSoon(bt); }, true); try { new MutationObserver(() => keepSoon(bt)).observe(bt, { subtree: true, childList: true, attributeFilter: ['class'] }); } catch (e) {} }
    style();
    turnSide = -1; rMiss = null;
    if (v24()) bt.classList.add('mma-v24');
    try { if (root.MMCROWD) root.MMCROWD.prefetch(bt); } catch (e) { /* 音だけ */ }
    try { setupCine(bt); } catch (e) { /* 見た目だけ */ }
    try { lastAct = null; rxWrap(); rxPreload(); winPreload(); rxWatch(bt); } catch (e) { /* 見た目だけ */ }
    try { const pl = G('BPL'); if (pl) [0, 1].forEach((i) => pl[i] && warmCards(pl[i].eq)); } catch (e) { /* 見た目だけ */ }
    try { setupChips(bt); } catch (e) { /* 見た目だけ */ }
    try { setupText(bt); } catch (e) { /* 見た目だけ */ }
    try { setupBg(bt); } catch (e) { /* 見た目だけ */ }
    try { setupIdle(bt); } catch (e) { /* 見た目だけ */ }
    try { setupRoulette(bt); } catch (e) { /* 見た目だけ */ }
    try { setupEnd(bt); } catch (e) { /* 見た目だけ */ }
  }
  // ---- 2026-10-13 開発25 C：勝ち／負けの画面（新しいバトル画面だけ）。決着で「もどる」になったら #bt に mma-end と mma-res-win／lose。
  //  勝ち負けの文字（#ban＝fight() のまま）はモンスターの下へ、その下に結果の一言（#msg の文＝勝利！／敗北…／判定勝ちなど）と「もどる」（#go のまま・押す処理は従来どおり）を
  //  落ち着いた結果の帯（勝ち＝明るい金・負け＝静かな紺）にまとめる。正式の勝利の絵・リアクションはそのまま主役。戻り先・報酬・大会の進行は変えない
  function setupEnd(bt) {
    if (!bt.classList.contains('mma-v24')) return;
    const go = $('#go', bt); if (!go) return;
    let done = false;
    const sync = () => {
      if (done || !go.classList.contains('bk') || !bt.isConnected) return;
      done = true;
      const ban = bt.querySelector(':scope>#ban'), msg = $('#msg', bt), t = ((ban && ban.textContent) || '').trim();
      const win = /^WIN/.test(t) || (!/^LOSE/.test(t) && /勝/.test((msg && msg.textContent) || ''));
      bt.classList.add('mma-end', win ? 'mma-res-win' : 'mma-res-lose');
      const band = document.createElement('div'); band.className = 'mma-endband'; band.setAttribute('aria-hidden', 'true');
      band.innerHTML = `<i class="mma-endln"></i><span class="mma-endsub"></span>`;
      const subEl = band.querySelector('.mma-endsub');
      // 一言は #msg の文（大会では賞金・ランクアップの部分を rules.js があとから消す＝変わるたびに写す）。「勝利！」だけのときは出さない（開発24 の HIDE_MSG と同じ）
      const copy = () => { const tx = ((msg && msg.textContent) || '').trim(); subEl.textContent = HIDE_MSG.test(tx) ? '' : tx; rec.sub = subEl.textContent; };
      const rec = { win, ban: t, sub: '' }; copy(); endLog.push(rec);
      if (msg) new MutationObserver(copy).observe(msg, { childList: true, characterData: true, subtree: true });
      bt.appendChild(band);
    };
    new MutationObserver(sync).observe(go, { attributes: true, attributeFilter: ['class'] });
    sync();
  }
  const endLog = [];
  function watch() {
    if (typeof MutationObserver === 'undefined' || !document.body) return;
    new MutationObserver((muts) => { for (const mu of muts) for (const n of mu.addedNodes) if (n && n.id === 'bt') setup(n); }).observe(document.body, { childList: true });
  }
  if (typeof document !== 'undefined') { if (document.body) watch(); else document.addEventListener('DOMContentLoaded', watch); }
  try { root.addEventListener('resize', () => keepSoon()); } catch (e) {}
  root.MMARENA = Object.freeze({ keepIn, keepLog: () => keepLog.slice(), R, IDLE, FACE, SCALE, GEO, UI_KEY, v24, setUi, crowdLog: () => crowdLog.slice(), endLog: () => endLog.slice(), finLog: () => finLog.slice(), rankOf, arenaSrc, fieldSrc, FIELD_BG, idleSrc, flipOf, setup, react, warmCards, cardReady, RX_MS, rxLog: () => rxLog.slice(), DEFEAT_ART, TOUR_ICON, TOUR_ICON_BG, tourIconSrc, tourIconBg: (sp) => TOUR_ICON_BG[sp] || null, faceSrc: (sp) => (IDLE[sp] ? `./assets/tournament/faces_25d/face_${IDLE[sp].slice(5)}.webp` : null),
    // 2026-10-11：対戦表の顔＝2.5D の横顔（faces_25d）。読めなかったときは従来の丸い顔（faces）へ（index.html の tbIcon の onerror）
    faceOldSrc: (sp) => (IDLE[sp] ? `./assets/tournament/faces/face_${IDLE[sp].slice(5)}.webp` : null) });
})(typeof window !== 'undefined' ? window : globalThis);
