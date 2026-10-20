// =========================================================
// 本編の Chapter 1「はじまりの草原」＝1枚の世界のボード（299地点）の進行 `MMWD`（2026-10-11。ユーザー決定：本編の Chapter 1 をこのボードに置き換える）
//
//  道と進み方：js/proto/roadfirst-data.js（MMRF_DATA＝299ノード／370接続／42区間の原本）と js/proto/roadfirst-core.js（MMRF_CORE）のルールそのまま
//    （サイコロ 1〜6・40ターン・J0／H は自由に選ぶ・Q はイベントのサイコロ（奇数＝左／偶数＝右）・CHALLENGE は 5／6 で成功・報酬の枝は行き止まり＝帰りもサイコロ・
//     隠れ家（D_RAND）の開閉は出発時に決める・Q／ライバル／特殊挑戦／行き止まりで止まり残りの目は捨てる）。
//  マスの中身：js/proto/roadfirst-play.js（MMRF_PLAY）の配置（layout）と数値（TUNING＝疲れの増え方・マスの割合・報酬の中身。【暫定】ユーザー決定＝試作の値のまま）。
//  本編との違い（試作と違う所）：能力・所持金・疲れは本物（m の能力・S.g・m.raise.fatigue）。野生・レア・ライバルは本物のバトル（index.html の bBattleGo → fight()）。
//  セーブ：version 6・mr4v6 のまま。配置と進み方は m.raise.field（v6 の任意項目）＝{ world:1, chapterId:1, patternId:'W', layoutSeed, core, tiles, used, claimed, rivalMet, introSeen, arrivalSeen }。
//    旧い Chapter 1（14枚の背景のボード）の途中のセーブは、能力・所持金・疲れはそのままで Chapter 1 の最初から（大会の途中なら大会を続ける）。
//  raising.js（MMP8）には registerChapterOverride で受け持つ（make(cfg) で Chapter 1〜4＝world-driver-ch2.js・ch3.js・ch4.js。2026-10-19 から Chapter 4 も新しい盤）。
//  自動テスト：window.MM_QA_OLD_CH1 のときは登録しない（旧い Chapter 1 を前提にした実ブラウザテスト用。tests/e2e/harness.mjs の既定）
// =========================================================
(function (root) {
  'use strict';
  // 2026-10-16：Chapter 2「潮風の海岸」も同じ1枚の世界のボード（js/chapter/world-driver-ch2.js）＝本体を make(cfg) にまとめて Chapter ごとの違い（道のデータ・名前・一言・確認用の URL）だけ cfg で渡す。
  //   Chapter 1 は cfg なし＝従来とまったく同じ（root.MMWD）。make は root.MMWD_MAKE
  function make(cfg) {
  cfg = cfg || {};
  const CH = cfg.ch || 1, TURN_LIMIT = 40, DICE = 6;
  const STAT_KEYS = ['li', 'po', 'in', 'hi', 'ev', 'de'], STAT_MAX = 999;
  const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  const C = () => root.MMRF_CORE, P = () => root.MMRF_PLAY;
  // 2026-10-14 Chapter 1 B／C 独立ルート：A＝js/proto/roadfirst-data.js（MMRF_DATA・変えない）、B／C＝js/proto/roadfirst-routes.js（MMRF_ROUTES。A と同じ 42区間の部品をつなぎ直した別の道）。
  //   新しい育成の出発で A／B／C を各 1/3 で抽選して配置 m.raise.field.route に保存（v6 の任意項目）＝再開・読み込みでは決め直さない。route が無い・知らない値＝A（旧セーブはすべて A のまま続く）。
  //   テスト・確認用：URL の ?ch1route=A|B|C（index.html が window.MM_CH1ROUTE に入れる）または MMWD.setRoute で次の出発のルートを固定。本番の選択の画面は無い
  const ROUTES = Object.freeze(['A', 'B', 'C']);
  const routeKey = (v) => (v === 'B' || v === 'C' ? v : 'A');
  // 2026-10-20 追加指示（円の広場の中に隣のマスを並べない・Chapter 2／4 と同じ美術規則）：Chapter 1 は原本の座標（MMRF_DATA）を変えず、
  //  表示用の配置（js/proto/board-display.js の MMRF_DISP＝広場の中心から隣の地点を離した写し。座標だけ・ID と歩数とつながりは原本のまま）を返す
  const SEP_OPT = Object.freeze({ sep: 27 });   // 道の幅 23＋4
  const disp = (d) => (d && root.MMRF_DISP ? root.MMRF_DISP.clearPlazas(d, SEP_OPT) : d);   // 2026-10-20 第5便：近すぎる別の道どうしを離す（sep）
  const dataOf = cfg.dataOf || ((k) => disp(k === 'B' || k === 'C' ? (root.MMRF_ROUTES && root.MMRF_ROUTES[k]) || null : root.MMRF_DATA));
  const BASE = () => dataOf('A') || disp(root.MMRF_DATA);   // ルートのデータが読めないときの控え（Chapter 1＝MMRF_DATA）
  const routeOf = (m) => { const f = fieldOf(m); return routeKey(f && f.route); };
  /** その個体のルートの道のデータ（m が無い・B/C のデータが読めない＝A） */
  const D = (m) => (m && dataOf(routeOf(m))) || BASE();
  const T = () => P().TUNING;

  /** 分かれ道の道の名前（プレイヤー向け。区間 ID → 名前。68 Scene の景観の表から） */
  const ROUTE_NAME = Object.freeze({
    EL01: '左の道（崩落の谷の左岸）', ER01: '右の道（滝沿いの右岸）',
    LATE_SAFE: '中央の安全な尾根', LATE_L1: '封印の遺跡門への道（特殊挑戦）', LATE_R1: 'ライオン石像への尾根道',
    D_LC: '寄り道：苔むした小塔', D_LA: '寄り道：森の祭壇', D_RC: '寄り道：岩棚の見張り台', D_LLA: '寄り道：谷の端の小祠', D_R5: '寄り道：石像の奥', D_RS: '寄り道：虹の滝', D_RAND: '寄り道：閉ざされた古道',
  });
  // B／C の道の名前（2026-10-14・仮案＝ユーザーの承認前。A と同じ区間 ID）。左右（EL／Q_L／LATE_L＝進む向きの左）は3ルートで同じ向き
  const ROUTE_NAME_BY = Object.freeze({
    B: Object.freeze({ EL01: '左の道（湖の北岸の花道）', ER01: '右の道（湖の南岸の水辺道）',
      LATE_SAFE: '花畑の中央道', LATE_L1: '封印の遺跡門への道（特殊挑戦）', LATE_R1: '白鳥の石像の丘道',
      D_LC: '寄り道：八角の東屋', D_LA: '寄り道：湖畔の祭壇', D_RC: '寄り道：水車小屋', D_LLA: '寄り道：泉のほとりの祠', D_R5: '寄り道：水瓶の女神像', D_RS: '寄り道：花の丘の段々の滝', D_RAND: '寄り道：滝の裏の隠れ家' }),
    C: Object.freeze({ EL01: '左の道（岩丘の尾根道）', ER01: '右の道（外周の崖ぞいの道）',
      LATE_SAFE: '遺跡の中庭を抜ける近道', LATE_L1: '神殿の門への道（特殊挑戦）', LATE_R1: 'ゴーレム像の列柱の道',
      D_LC: '寄り道：崩れた見張り塔', D_LA: '寄り道：環状列石', D_RC: '寄り道：岩壁の宝物庫', D_LLA: '寄り道：崖の上の列柱神殿', D_R5: '寄り道：古代のオベリスク', D_RS: '寄り道：螺旋階段の塔', D_RAND: '寄り道：岩の裂け目の隠れ家' }),
  });
  const SPUR = (seg) => /^D_/.test(seg);
  const PLACE = Object.freeze({ START: 'スタート', J0: '分かれ道', P: '合流', LOWER_GATE: '下の門', Q: '運命の分かれ道', R: '合流', UPPER_GATE: '上の門', RIVAL: 'ライバルの広場', H: '後半の分かれ道', CHALLENGE: '封印の遺跡門', FINAL: '最後の合流', GOAL: '大会会場', STATUE: 'ライオン石像' });
  const PLACE_BY = Object.freeze({ B: Object.freeze({ STATUE: '白鳥の石像' }), C: Object.freeze({ CHALLENGE: '神殿の門', STATUE: 'ゴーレム像' }) });
  /** 固定報酬の表示名（中身・価値・取得の機会は A と同じ＝js/proto/roadfirst-play.js の TUNING.rewards。名前だけルートの景色に合わせる） */
  const REWARD_TITLE_BY = Object.freeze({
    B: Object.freeze({ L_CHEST: '八角の東屋', R_CHEST: '水車小屋', L_ALTAR: '湖畔の祭壇', L_LATE_ALTAR: '泉のほとりの祠', REWARD5: '水瓶の女神像', R_SPECIAL: '花の丘の段々の滝', RANDOM_DEN: '滝の裏の隠れ家' }),
    C: Object.freeze({ L_CHEST: '崩れた見張り塔', R_CHEST: '岩壁の宝物庫', L_ALTAR: '環状列石', L_LATE_ALTAR: '崖の上の列柱神殿', REWARD5: '古代のオベリスク', R_SPECIAL: '螺旋階段の塔', RANDOM_DEN: '岩の裂け目の隠れ家' }),
  });
  function routeName(seg, key) { if (cfg.routeName) return cfg.routeName(seg, routeKey(key), dataOf(routeKey(key))); const B = ROUTE_NAME_BY[routeKey(key)]; return (B && B[seg]) || ROUTE_NAME[seg] || (SPUR(seg) ? '寄り道' : 'このまま進む'); }
  function placeOf(id, key) { if (cfg.placeOf) return cfg.placeOf(id, routeKey(key), dataOf(routeKey(key))); const B = PLACE_BY[routeKey(key)]; return (B && B[id]) || PLACE[id] || null; }
  const rewardTitle = (id, key, def) => { if (cfg.rewardTitle) return cfg.rewardTitle(id, routeKey(key), def, dataOf(routeKey(key))); const B = REWARD_TITLE_BY[routeKey(key)]; return (B && B[id]) || def; };

  // ---- マップ（raising.js の boardOf・ゴールの判定用。行き止まりからは戻れるので、戻りの接続も conn に入れる＝行き止まりはゴールではない） ----
  const TRACK = {};   // ルートごとに1回だけ作る
  function track(key) {
    const k = routeKey(key), d = dataOf(k) || BASE(); if (TRACK[k] && TRACK[k].d === d) return TRACK[k].t;
    const nodes = {}, conn = {};
    for (const [id, n] of Object.entries(d.nodes)) { nodes[id] = { type: n[2], x: n[0], y: n[1] }; conn[id] = []; }
    for (const e of d.edges) if (!conn[e[0]].includes(e[1])) conn[e[0]].push(e[1]);
    const t = Object.freeze({ nodes, conn, start: 'START', goal: 'GOAL', world: true, route: k });
    TRACK[k] = { d, t }; return t;
  }

  // ---- 配置（m.raise.field） ----
  const fieldOf = (m) => (m && isObj(m.raise) && isObj(m.raise.field) && m.raise.field.world === 1 ? m.raise.field : null);
  function valid(f) {
    if (!isObj(f) || f.world !== 1 || f.chapterId !== CH || !Number.isInteger(f.layoutSeed)) return false;
    const d = dataOf(routeKey(f.route));   // B／C のデータが読めないときは地点を確かめない（その育成の配置を消さない）
    const c = f.core; if (!isObj(c) || (d && !d.nodes[c.node]) || !Array.isArray(c.trail) || !Number.isInteger(c.turn) || !Number.isInteger(c.moveLeft) || c.moveLeft < 0) return false;
    return isObj(f.tiles) && isObj(f.used) && isObj(f.claimed);
  }
  // 景観のパターン（A＝従来・B＝花と清流・C＝岩丘と遺跡）＝配置の任意項目 visualPattern。2026-10-14 からは新しい育成ではルートと同じ値（B のルート＝B の景観）。
  //   無い・知らない値＝A。旧セーブで景観 B／C のまま A の道を進んでいる個体は、その育成の終わりまで「B／C の景観＋A の道」（route が無い＝A）
  const VISUALS = ROUTES;
  const visualKey = (v) => (VISUALS.includes(v) ? v : 'A');
  const visualOf = (m) => { if (cfg.visual) return cfg.visual; const f = fieldOf(m); return visualKey(f && f.visualPattern); };   // 2026-10-18 Chapter 3＝空の景観 'S'（js/proto/roadfirst-world.js の VISUAL.S）
  let pendingRoute = null;
  /** 次の出発のルートを固定（テスト・確認用。null＝本番の抽選）。1回の出発で使ったら戻す */
  function setRoute(v) { pendingRoute = ROUTES.includes(v) ? v : null; return pendingRoute; }
  const forcedRoute = () => { if (pendingRoute) return pendingRoute; let q = null; try { q = root[cfg.forceVar || 'MM_CH1ROUTE'] || new URLSearchParams(root.location.search).get(cfg.forceParam || 'ch1route'); } catch (e) {} return ROUTES.includes(q) ? q : null; };
  /** ルートの抽選：A／B／C を各 1/3（配置の seed とは別の1回。保存して再開では決め直さない） */
  //  2026-10-19：Chapter ごとの抽選の決まり（cfg.drawRoute）。Chapter 4＝0〜999 の整数で A 334・B 333・C 333（js/chapter/world-driver-ch4.js）
  const drawRoute = cfg.drawRoute || ((rnd) => ROUTES[Math.min(2, Math.floor(rnd() * 3))]);
  function newField(rnd = Math.random, seed, route) {
    const k = ROUTES.includes(route) ? route : drawRoute(rnd), d = dataOf(k) || BASE(), rk = d === BASE() ? 'A' : k;
    const s = Number.isInteger(seed) ? seed >>> 0 : ((Math.floor(rnd() * 0x7fffffff) >>> 0) || 1);
    const core = C().create(d, { seed: s, turnLimit: TURN_LIMIT });
    return { world: 1, chapterId: CH, patternId: 'W', layoutSeed: s, core, tiles: P().layout(d, s, { route: rk, bias: true, pool: cfg.pool ? cfg.pool() : undefined, ch: CH }), used: {}, claimed: {}, rivalMet: false, introSeen: false, arrivalSeen: false, route: rk, visualPattern: rk };
  }
  const clampFat = (v) => Math.max(0, Math.min(T().fatigueMax, Math.round(Number(v) || 0)));
  const carry = (f) => (root.MMCH && root.MMCH.carryFatigue ? root.MMCH.carryFatigue(f) : Math.max(0, (Number(f) || 0) - 50));
  const addFat = (m, n) => { const b = clampFat(m.raise.fatigue); m.raise.fatigue = clampFat(b + n); return m.raise.fatigue - b; };
  const addStat = (m, k, n) => { const b = Number(m[k]) || 0; m[k] = Math.max(0, Math.min(STAT_MAX, b + n)); return m[k] - b; };
  const growthGain = (m, k) => { const M = root.MMP10M; if (!M || !M.growthGain) throw new Error('MMWD：成長適性（js/phase10/monsters.js）が読み込まれていません'); return M.growthGain(m, k); };
  const gradeOf = (m, k) => (root.MMP10M && root.MMP10M.growthOf ? root.MMP10M.growthOf(m, k) : 'C');

  /** 効果（MMRF_PLAY の効果の形）を本物の個体・所持金・疲れへ。戻り値＝表示用のまとめ */
  function apply(S, m, eff) {
    const out = { gains: [], gold: 0, fatigue: 0 };
    for (const e of eff || []) {
      if (e.gold) { S.g = (S.g || 0) + e.gold; out.gold += e.gold; }
      if (e.fat) out.fatigue += addFat(m, e.fat);
      if (e.full) out.fatigue += addFat(m, -m.raise.fatigue);
      if (e.stat) out.gains.push({ key: e.stat, amount: addStat(m, e.stat, e.amt) });
      if (e.statAll) STAT_KEYS.forEach((k) => out.gains.push({ key: k, amount: addStat(m, k, e.statAll) }));
      if (e.best) { const order = ['A', 'B', 'C', 'D', 'E']; const k = STAT_KEYS.slice().sort((a, b) => order.indexOf(gradeOf(m, a)) - order.indexOf(gradeOf(m, b)))[0]; out.gains.push({ key: k, amount: addStat(m, k, e.best) }); }
    }
    return out;
  }
  const poolOf = () => (cfg.pool && cfg.pool()) || P().pool() || [];   // 出来事の表（Chapter 2 は cfg.pool＝Chapter 2 の出来事）
  const evById = (id) => poolOf().find((e) => e.id === id) || null;

  // ---- 移動（raising.js の step／chooseBranch から） ----
  const KEEP_EV = ['eventDie', 'gate', 'rival', 'reward', 'den', 'goal', 'timeup', 'stop', 'blocked'];
  function after(S, m, ev) {
    const r = m.raise, p = r.pend, c = fieldOf(m).core;
    r.node = c.node; p.left = c.moveLeft;
    const keep = ev.filter((e) => KEEP_EV.includes(e.type)); if (keep.length) p.evs = [...(p.evs || []), ...keep].slice(-12);
    const ch = ev.find((e) => e.type === 'choice');
    if (ch) { const op = C().options(D(m), c); p.stage = 'branch'; p.opts = op.map((e) => e.dst); p.segs = op.map((e) => e.seg); return { stage: 'branch', opts: p.opts, ev }; }
    if (c.moveLeft <= 0 || c.done) { p.left = 0; p.stage = 'resolve'; } else p.stage = 'move';
    return { stage: p.stage, node: c.node, ev };
  }
  function step(S, m) {
    const f = fieldOf(m), p = m.raise.pend; if (!f || !p) return { stage: p ? p.stage : null };
    if (f.core.moveLeft <= 0 || f.core.done) { p.left = 0; p.stage = 'resolve'; return { stage: 'resolve' }; }
    return after(S, m, C().stepOnce(D(m), f.core, {}));
  }
  function chooseBranch(S, m, id) {
    const f = fieldOf(m), p = m.raise.pend; if (!f || !p || p.stage !== 'branch') return { ok: false };
    const i = (p.opts || []).indexOf(id), seg = Array.isArray(p.segs) ? p.segs[i] : null; if (i < 0 || !seg) return { ok: false };
    delete p.opts; delete p.segs;
    const ev = C().stepOnce(D(m), f.core, { choose: seg });
    if (!ev.some((e) => e.type === 'step')) { const o = after(S, m, ev); return { ok: false, ...o }; }
    return { ok: true, ...after(S, m, ev) };
  }
  /** 分かれ道の選択肢（画面用）：[{ id＝次の地点, seg, name, spur }] */
  function branchOptions(m) {
    const p = m && m.raise && m.raise.pend; if (!p || p.stage !== 'branch' || !Array.isArray(p.opts)) return [];
    const k = routeOf(m); return p.opts.map((id, i) => { const seg = (p.segs || [])[i]; return { id, seg, name: routeName(seg, k), spur: SPUR(seg) }; });
  }

  // ---- 止まった地点の中身（raising.js の resolveLanding から。1回だけ） ----
  function dieAt(m, id) { const p = m.raise.pend; return ((p && p.evs) || []).filter((e) => e.type === 'eventDie' && e.at === id).map((e) => ({ kind: e.kind, die: e.die, result: e.result })); }
  function resolve(S, m, id) {
    const f = fieldOf(m), d = D(m), k = routeOf(m), role = d.nodes[id] ? d.nodes[id][2] : '', dice = dieAt(m, id);
    const base = { place: placeOf(id, k), dice };
    if (role === 'goal') return { kind: 'none', note: 'goal', ...base };
    if (role === 'mandatory_rival') { if (f.rivalMet) return { kind: 'none', note: 'rival_done', ...base }; f.rivalMet = true; return { kind: 'battle', battleType: 'rival', ...base }; }
    if (role === 'fixed_reward_dead_end' || role === 'optional_random_unlock_dead_end') {
      const R = (d.rewards && d.rewards[id]) || T().rewards[id]; if (!R) return { kind: 'none', note: 'normal', ...base };
      const title = rewardTitle(id, k, R.title);
      if (f.claimed[id] != null) return { kind: 'none', note: 'claimed', title, ...base };
      f.claimed[id] = f.core.turn;
      return { kind: 'reward', id, den: role !== 'fixed_reward_dead_end', title, ...apply(S, m, R.eff), ...base };
    }
    const tile = f.tiles[id];
    if (role !== 'ordinary_tile' || !tile || f.used[id] != null) return { kind: 'none', note: role === 'ordinary_tile' ? 'normal' : role, ...base };
    if (tile.t === 'wild') { f.used[id] = f.core.turn; return { kind: 'battle', battleType: tile.rare ? 'rare' : 'wild', ...base }; }
    if (tile.t === 'stat') { f.used[id] = f.core.turn; const amount = addStat(m, tile.k, growthGain(m, tile.k)); return { kind: 'stat', key: tile.k, amount, grade: gradeOf(m, tile.k), ...base }; }
    if (tile.t === 'treasure') { f.used[id] = f.core.turn; return { kind: 'treasure', tier: tile.tier, ...apply(S, m, [{ gold: tile.gold }]), ...base }; }
    if (tile.t === 'rest') {   // 2026-10-12 正式：食事・焚き火のマス（TOP09）＝みんなで食事して空腹 −50（そのマスで1回だけ＝使った印）。旧：回復の出来事（eventPool）
      f.used[id] = f.core.turn;
      return { kind: 'meal', title: 'みんなでごはん', recovery: true, ...apply(S, m, [{ fat: -(T().mealAmount || 50) }]), ...base };
    }
    if (tile.t === 'event' || tile.t === 'rest') {
      const e = evById(tile.e); if (!e) { f.used[id] = f.core.turn; return { kind: 'none', note: 'event_missing', ...base }; }
      const info = { ev: e.id, title: e.title || (tile.t === 'rest' ? '休憩' : '出来事'), text: e.text || '', lines: (e.lines || []).slice(), image: e.image || null, recovery: tile.t === 'rest' || !!e.recovery };
      if (Array.isArray(e.choices) && e.choices.length) return { kind: 'choice', ...info, options: e.choices.map((c) => ({ id: c.id, label: c.label, desc: c.desc || '' })), ...base };   // 選ぶまで使った印を付けない（再読み込みでも同じ選択肢）
      f.used[id] = f.core.turn;
      return { kind: 'event', ...info, ...apply(S, m, P().eventEff(e.handler, e.params, tile.k)), ...base };
    }
    f.used[id] = f.core.turn; return { kind: 'none', note: 'normal', ...base };
  }
  function resolveChoice(S, m, optId) {
    const f = fieldOf(m), id = m.raise.node, tile = f && f.tiles[id]; if (!tile || f.used[id] != null || !(tile.t === 'event' || tile.t === 'rest')) return null;
    const e = evById(tile.e), c = e && Array.isArray(e.choices) ? e.choices.find((x) => x.id === optId) : null; if (!c) return null;
    f.used[id] = f.core.turn;
    return { kind: 'event', ev: e.id, title: e.title || '出来事', text: c.text || e.text || '', lines: (c.lines || []).slice(), image: e.image || null, choice: c.id, ...apply(S, m, P().eventEff(c.handler, c.params, tile.k)) };
  }

  // ---- フィナの節目の一言・チュートリアル（2026-10-11 次の作業。旧ボードの config.story と同じ形・本文は【暫定】） ----
  //  trigger：'start'＝Chapter に入った最初／'land'＝止まったあと／'branch'＝分かれ道で選ぶ前／'die'＝運命のサイコロ・特殊挑戦のサイコロを見せる前。
  //  when：kind／battleType／recovery／hasEvent／goal＝止まった地点の結果、pass＝今回の移動で通った地点（地点 ID か区間 ID）、notNode＝止まった地点がこれなら出さない、
  //        spurOpt＝分かれ道に寄り道がある、optSeg＝分かれ道の選択肢にこの区間がある、dieKind＝見せるサイコロの種類、fatigueMin、species。
  //  scope 'save'＝このセーブで1回（S.npcFlags.story。旧ボードのチュートリアルと同じ id は共通＝もう見た人には出さない）／既定＝この個体のこの Chapter で1回（m.raise.field.storySeen）。
  //  presentation 'talk'＝ボードの大きな会話窓／既定＝小さな会話窓。同時に満たしたら priority の高いものを1つだけ。
  const L = (expression, text, speaker) => (speaker ? { speaker, expression: expression || 'normal', text } : { expression, text });
  const STORY = cfg.story || Object.freeze([
    { id: 'tut_turns_w', trigger: 'start', scope: 'save', priority: 70, presentation: 'talk', lines: [L('guide', `出発の前に、ひとつだけ。この旅は${TURN_LIMIT}ターンだよ。サイコロ（1〜${DICE}）を1回振るか、「休む」を1回使うと、1ターン進むよ。`), L('normal', `${TURN_LIMIT}ターンのうちに大会会場に着けば、公式大会に挑戦できるんだ。`), L('smile', '間に合わなくても失敗じゃないよ。育った能力は、そのまま次へ持っていけるからね。')] },
    { id: 'tut_stat', trigger: 'land', scope: 'save', priority: 50, presentation: 'talk', when: { kind: 'stat' }, lines: [L('guide', '能力マスだよ。止まると、この子の得意に合わせて能力が伸びるんだ。'), L('smile', '伸び方は子ごとに違うから、ステータスで確かめてみてね。')] },
    { id: 'tut_event', trigger: 'land', scope: 'save', priority: 50, presentation: 'talk', when: { hasEvent: true }, lines: [L('guide', 'イベントマスは、止まるたびに違う出来事が起きるよ。'), L('happy', '何が起きるかは、その時のお楽しみ！')] },
    { id: 'tut_rest', trigger: 'land', scope: 'save', priority: 50, presentation: 'talk', when: { recovery: true }, lines: [L('guide', '食事のマスだね。みんなでごはんにすると、空腹がぐっとおさまるよ。'), L('normal', '空腹が100になるとサイコロが振れなくなるから、アイテムで食べさせるか、操作欄の「休む」を使ってね。')] },
    { id: 'tut_treasure', trigger: 'land', scope: 'save', priority: 50, presentation: 'talk', when: { kind: 'treasure' }, lines: [L('happy', '宝箱だ！ 中身はその時によって違うよ。'), L('guide', '珍しい宝箱ほど、いいものが入ってるみたい。')] },
    { id: 'tut_wild', trigger: 'land', scope: 'save', priority: 50, presentation: 'talk', when: { kind: 'battle', battleType: 'wild' }, lines: [L('surprised', '野生のモンスターだ！ 出会ったら、バトルで切り抜けよう。'), L('guide', '勝っても賞金は無いけど、いい練習になる。バトルのあとは少しお腹がすくから気をつけてね。')] },
    { id: 'tut_rival', trigger: 'land', scope: 'save', priority: 50, presentation: 'talk', when: { kind: 'battle', battleType: 'rival' }, lines: [L('surprised', 'あっ、リュウ！ やっぱり先に来てたんだね。'), L('normal', 'おっ、もう追いついてきたのか。ちょうどいい、俺の相棒の力を見せてやるよ！', 'ryu'), L('guide', '街で会ったときより強くなってるはず。でも、私たちだって負けないよ！')] },
    { id: 'tut_reward_w', trigger: 'land', scope: 'save', priority: 50, presentation: 'talk', when: { kind: 'reward' }, lines: [L('happy', '宝の行き止まりだ！ ここの宝は、一度だけもらえるんだ。'), L('guide', 'ここから先は行き止まり。帰りもサイコロで戻ろうね。')] },
    { id: 'tut_goal', trigger: 'land', scope: 'save', priority: 60, presentation: 'talk', when: { goal: true }, lines: [L('happy', 'ゴールだ！ ここから公式大会に挑戦できるよ。'), L('guide', '大会はランクE〜S。今のこの子に合うランクを選ぼう。参加しない選択もできるよ。')] },
    { id: 'tut_branch', trigger: 'branch', scope: 'save', priority: 50, presentation: 'talk', lines: [L('guide', '分かれ道だよ。どっちの道を通るかは、自分で決められるんだ。'), L('smile', '道によって出来事や相手が少し変わるみたい。好きなほうを選んでね。')] },
    { id: 'tut_challenge_w', trigger: 'branch', scope: 'save', priority: 48, presentation: 'talk', when: { optSeg: 'LATE_L1' }, lines: [L('guide', '左の先には封印の遺跡門があるよ。サイコロで5か6が出れば、門が開いて遺跡の道へ進めるんだ。'), L('normal', '失敗しても、遠回りの道で先へ進めるから安心してね。')] },
    { id: 'tut_spur_w', trigger: 'branch', scope: 'save', priority: 45, presentation: 'talk', when: { spurOpt: true }, lines: [L('guide', '「寄り道」の先は行き止まりだけど、宝が待ってるんだ。'), L('normal', '行き止まりからは、帰りもサイコロで戻るよ。のこりのターンと相談して決めてね。')] },
    { id: 'tut_qdie_w', trigger: 'die', scope: 'save', priority: 50, presentation: 'talk', when: { dieKind: 'Q' }, lines: [L('guide', 'ここは運命の分かれ道。どっちへ進むかは、サイコロの目で決まるんだ。'), L('normal', '奇数なら左の道、偶数なら右の道だよ。')] },
    { id: 'ch1_start', trigger: 'start', lines: [L('happy', 'いよいよ出発だね！ 大会会場まで、一緒にがんばろう。')] },
    { id: 'ch1_first_wild', trigger: 'land', priority: 30, when: { kind: 'battle', battleType: 'wild' }, lines: [L('surprised', '野生のモンスターだ！ 気をつけて！')] },
    { id: 'ch1_first_rare', trigger: 'land', priority: 31, when: { kind: 'battle', battleType: 'rare' }, lines: [{ ...L('surprised', 'あの子、見たことない色…！ めずらしいモンスターかも！'), voice: 'fina_wonder' }] },   // 2026-10-13：「なんだろう？」
    { id: 'w_left', trigger: 'land', priority: 12, when: { pass: ['EL01'] }, lines: [L('surprised', '崩れた谷が見えるね…。足元に気をつけて進もう。')] },
    { id: 'w_right', trigger: 'land', priority: 12, when: { pass: ['ER01'] }, lines: [L('happy', '滝の音が聞こえる！ 水しぶきが気持ちいいね。')] },
    { id: 'w_merge', trigger: 'land', priority: 11, when: { pass: ['P', 'C01'] }, lines: [L('smile', '道がひとつに戻ったね。この先に大きな門があるよ。')] },
    { id: 'w_rival_before', trigger: 'land', priority: 20, when: { pass: ['C03', 'UPPER_GATE', 'C04'], notNode: ['RIVAL'] }, lines: [L('serious', 'この先に誰かいる…。もしかして、リュウ？')] },
    { id: 'w_safe', trigger: 'land', priority: 12, when: { pass: ['LATE_SAFE'] }, lines: [L('smile', '雲の上の尾根道だね。ここなら安心して進めそう。')] },
    { id: 'w_statue', trigger: 'land', priority: 13, when: { pass: ['STATUE'] }, lines: [L('surprised', '大きなライオンの石像…！ なんだか見守ってくれてるみたい。')] },
    { id: 'w_castle', trigger: 'land', priority: 14, when: { pass: ['LATE_L_DONE', 'LATE_R_DONE', 'FINAL', 'S_END'], notNode: ['GOAL'] }, lines: [L('happy', '大会会場が見えてきた！ あと少しだよ。')] },
    { id: 'ch1_tired', trigger: 'land', priority: 5, when: { fatigueMin: 80 }, lines: [L('worried', 'だいぶお腹がすいてきたみたい。何か食べさせるか、休もうね。')] },
  ]);
  // 2026-10-14 B／C：景色を言う一言だけルートごとに文を差し替える（id・条件・優先度は A と同じ＝見た記録も共通。文は仮案＝ユーザーの承認前）
  const STORY_LINES_BY = cfg.storyLinesBy || Object.freeze({
    B: Object.freeze({
      ch1_start: [L('happy', '川の音がするね！ 今日は川に沿って、草原を行ったり来たりするみたい。大会会場まで、一緒にがんばろう。')],
      tut_challenge_w: [L('guide', 'この先には封印の遺跡門があるよ。サイコロで5か6が出れば、門が開いて奥の道へ進めるんだ。'), L('normal', '失敗しても、遠回りの道で先へ進めるから安心してね。')],
      w_left: [L('happy', '湖の北側は花がいっぱい！ 小島にも何かありそう。')],
      w_right: [L('smile', '水辺の道だね。足元がぬれないように気をつけよう。')],
      w_merge: [L('smile', '道がひとつに戻ったね。この先に門があるよ。')],
      w_rival_before: [L('serious', '門の向こうに誰かいる…。もしかして、リュウ？')],
      w_safe: [L('smile', '花畑のまん中の道だね。ここなら安心して進めそう。')],
      w_statue: [L('surprised', '丘の上に白鳥の石像…！ 川を見守ってるみたい。')],
      w_castle: [L('happy', '大会会場が見えてきた！ 川の上流の丘だね。あと少しだよ。')],
    }),
    C: Object.freeze({
      ch1_start: [L('happy', '大きな岩の丘がぐるっと続いてる…。外側から回って、まん中の会場を目指すんだね。一緒にがんばろう。')],
      tut_challenge_w: [L('guide', 'この先には遺跡の神殿の門があるよ。サイコロで5か6が出れば、門が開いて奥の道へ進めるんだ。'), L('normal', '失敗しても、遠回りの道で先へ進めるから安心してね。')],
      w_left: [L('smile', '岩の尾根道だね。見晴らしがいいよ。')],
      w_right: [L('surprised', '崖ぞいの道…。端に寄りすぎないでね。')],
      w_merge: [L('smile', '道がひとつに戻ったね。この先に遺跡の門があるよ。')],
      w_rival_before: [L('serious', '遺跡の門の向こうに誰かいる…。もしかして、リュウ？')],
      w_safe: [L('smile', '遺跡の中庭を抜ける近道だね。')],
      w_statue: [L('surprised', '大きなゴーレムの像…！ 遺跡の番人みたい。')],
      w_castle: [L('happy', '渦のまん中に会場が見えた！ あとひと回りだよ。')],
    }),
  });
  const SEG_OF = {};
  /** 地点 → 区間（区間の途中の地点だけ。分かれ道・合流などの端の地点は区間に入れない＝pass では地点 ID で書く）。ルートごと */
  function segOf(id, key) {
    const k = routeKey(key), d = dataOf(k) || BASE();
    if (!SEG_OF[k] || SEG_OF[k].d !== d) { const map = {}; for (const [sk, s] of Object.entries(d.segments)) { const pts = s[3] || []; for (let i = 1; i < pts.length - 1; i++) map[pts[i]] = sk; } SEG_OF[k] = { d, map }; }
    return SEG_OF[k].map[id] || null;
  }
  const STORY_CONDS = {
    kind: (w, c) => !!c.fx && c.fx.kind === w,
    battleType: (w, c) => !!c.fx && c.fx.battleType === w,
    recovery: (w, c) => (!!c.fx && c.fx.kind === 'event' && !!c.fx.recovery) === !!w,
    hasEvent: (w, c) => (!!c.fx && c.fx.kind === 'event' && !c.fx.recovery) === !!w,
    goal: (w, c) => !!c.goal === !!w,
    pass: (w, c) => c.path.some((id) => w.includes(id) || w.includes(segOf(id, c.route))),
    notNode: (w, c) => !w.includes(c.node),
    spurOpt: (w, c) => (c.segs || []).some((s) => SPUR(s)) === !!w,
    optSeg: (w, c) => (c.segs || []).includes(w),
    dieKind: (w, c) => (c.dice || []).some((e) => e.kind === w),
    fatigueMin: (w, c) => c.fatigue >= w,
    species: (w, c) => w.includes(c.species),
  };
  /** 今の状態で出す節目の一言（優先度の高い順・見たものは除く）。ctx＝{ fx, goal, path（今回の移動で通った地点）, segs, dice, species, flags（S.npcFlags） } */
  function storyEvents(m, trigger, ctx = {}) {
    const f = fieldOf(m); if (!f) return [];
    const seen = Array.isArray(f.storySeen) ? f.storySeen : [], saveSeen = ctx.flags && Array.isArray(ctx.flags.story) ? ctx.flags.story : [];
    const route = routeOf(m), LB = STORY_LINES_BY[route] || {};
    const node = m.raise.node, c = { ...ctx, node, route, path: [...(Array.isArray(ctx.path) ? ctx.path : []), node], fatigue: clampFat(m.raise.fatigue) };
    const out = [];
    for (const e of STORY) {
      if (e.trigger !== trigger) continue;
      if (e.scope === 'save' ? (!ctx.flags || saveSeen.includes(e.id)) : seen.includes(e.id)) continue;
      if (Object.entries(e.when || {}).every(([k, v]) => STORY_CONDS[k] && STORY_CONDS[k](v, c))) out.push(LB[e.id] ? Object.assign({}, e, { lines: LB[e.id] }) : e);
    }
    return out.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }
  function markStory(m, id, flags) {
    const e = STORY.find((x) => x.id === id); if (!e) return;
    if (e.scope === 'save') { if (!isObj(flags)) return; if (!Array.isArray(flags.story)) flags.story = []; if (!flags.story.includes(id)) flags.story.push(id); return; }
    const f = fieldOf(m); if (!f) return; if (!Array.isArray(f.storySeen)) f.storySeen = []; if (!f.storySeen.includes(id)) f.storySeen.push(id);
  }

  // ---- raising.js（MMP8）へのつなぎ ----
  const DRIVER = Object.freeze({
    world: true,
    handles: cfg.handles || ((key) => key === CH),
    turnLimit: () => TURN_LIMIT,
    diceSides: () => DICE,
    onDepart(S, m, key, rnd = Math.random, fresh) { m.raise.fatigue = fresh ? 0 : carry(m.raise.fatigue); m.raise.field = newField(rnd, undefined, forcedRoute()); pendingRoute = null; return { patternId: 'W' }; },   // ルートは出発の1回だけ抽選（固定は1回で戻す）
    onDepartOther(S, m, key, fresh) { m.raise.fatigue = fresh ? 0 : carry(m.raise.fatigue); m.raise.field = null; },
    trackFor: (m) => track(m ? routeOf(m) : 'A'),
    /** ボードを開くとき：配置が無い・壊れている・旧い Chapter 1 の配置なら、Chapter 1 の最初から（大会の途中ならゴールで大会を続ける）。途中の状態の食い違いを直す */
    ensure(S, m, rnd = Math.random) {
      const r = m.raise, f = r.field;
      if (valid(f)) {
        let changed = false; const c = f.core;
        if (r.node !== c.node) { r.node = c.node; changed = true; }
        if (!r.pend && c.moveLeft > 0) { c.discarded += c.moveLeft; c.moveLeft = 0; changed = true; }   // 移動の途中の記録が無い＝残りの目は捨てる
        if (r.pend && (r.pend.stage === 'move' || r.pend.stage === 'branch') && c.moveLeft <= 0) { r.pend.left = 0; r.pend.stage = 'resolve'; delete r.pend.opts; delete r.pend.segs; changed = true; }
        if (r.pend && r.pend.stage === 'branch' && !Array.isArray(r.pend.segs)) { const op = C().options(D(m), c); r.pend.opts = op.map((e) => e.dst); r.pend.segs = op.map((e) => e.seg); changed = true; }
        if (c.turn !== r.turnsUsed) { c.turn = r.turnsUsed; changed = true; }
        return { changed };
      }
      r.field = newField(rnd, undefined, cfg.ensureRoute ? cfg.ensureRoute(f) : 'A');   // 配置が無い・壊れている・旧い Chapter 1 の配置＝A の最初から（ここでは抽選しない＝旧セーブは A）
      if (r.tour) Object.assign(r, { node: 'GOAL', pend: null, goal: true, turnLimit: TURN_LIMIT });
      else Object.assign(r, { node: 'START', turnsUsed: 0, pend: null, goal: false, turnLimit: TURN_LIMIT });
      if (r.tour) { r.field.core.node = 'GOAL'; r.field.core.done = true; }
      return { changed: true };
    },
    canRoll: (m) => { const f = fieldOf(m); return !!f && clampFat(m.raise.fatigue) < T().fatigueMax && !f.core.done && f.core.moveLeft === 0; },
    onRoll(S, m, v) {
      const f = fieldOf(m), c = f.core; c.turn = m.raise.turnsUsed - 1;
      C().roll(D(m), c, v);
      const add = addFat(m, T().fatigueByDie[v] || 0);
      return { fatigueAdded: add, evs: [] };
    },
    canRest: (m) => !!fieldOf(m) && !fieldOf(m).core.done,
    onRest(S, m) { const f = fieldOf(m); f.core.turn = m.raise.turnsUsed; return { recovered: -addFat(m, -T().restAmount) }; },
    onTurnsExhausted: () => ({ toGoal: false }),   // 40ターンで着けなければ大会なし（これまでの Chapter 1 と同じ）
    step, chooseBranch, resolve, resolveChoice,
    onBattleFinished(S, m) { return { fatigueAdded: addFat(m, T().wildFatigue) }; },
    onClose(S, m) { m.raise.field = null; },
    sanitize(m) { const r = m && m.raise; if (!isObj(r)) return m; r.fatigue = clampFat(r.fatigue); if (r.ch === CH && r.field != null && !valid(r.field)) r.field = null; return m; },
  });
  let attached = false;
  function attach(P8 = root.MMP8) { if (!P8 || !P8.registerChapterOverride || root[cfg.qaOld || 'MM_QA_OLD_CH1']) return false; P8.registerChapterOverride(DRIVER); attached = true; return true; }
  function detach(P8 = root.MMP8) { if (P8 && P8.removeChapterOverride) P8.removeChapterOverride(DRIVER); attached = false; }
  /** この個体の今の Chapter がこのボードか（画面の切り替え用） */
  const active = (m) => attached && !!m && isObj(m.raise) && m.raise.ch === CH && !!root.MMP7 && root.MMP7.inChapter(m) && !!fieldOf(m);

  const API = Object.freeze({ pool: () => poolOf(), CH, TURN_LIMIT, DICE, ROUTES, ROUTE_NAME, ROUTE_NAME_BY, PLACE, PLACE_BY, REWARD_TITLE_BY, STORY, STORY_LINES_BY, DRIVER, VISUALS, storyEvents, markStory, segOf, attach, detach, active, fieldOf, valid, newField, track, routeName, placeOf, rewardTitle, branchOptions,
    routeOf, routeKey, dataOf: (m) => D(m), routeData: dataOf, drawRoute, setRoute, forcedRoute, visualOf, isAttached: () => attached });
  if (cfg.attach !== false) attach();
  return API;
  }
  root.MMWD_MAKE = make;
  root.MMWD = make();
})(typeof window !== 'undefined' ? window : globalThis);
