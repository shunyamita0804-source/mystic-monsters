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
//  raising.js（MMP8）には registerChapterOverride で Chapter 1 だけを受け持つ（Chapter 2 はこれまでのエンジン、3・4 は旧ボード）。
//  自動テスト：window.MM_QA_OLD_CH1 のときは登録しない（旧い Chapter 1 を前提にした実ブラウザテスト用。tests/e2e/harness.mjs の既定）
// =========================================================
(function (root) {
  'use strict';
  const CH = 1, TURN_LIMIT = 40, DICE = 6;
  const STAT_KEYS = ['li', 'po', 'in', 'hi', 'ev', 'de'], STAT_MAX = 999;
  const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
  const D = () => root.MMRF_DATA, C = () => root.MMRF_CORE, P = () => root.MMRF_PLAY;
  const T = () => P().TUNING;

  /** 分かれ道の道の名前（プレイヤー向け。区間 ID → 名前。68 Scene の景観の表から） */
  const ROUTE_NAME = Object.freeze({
    EL01: '左の道（崩落の谷の左岸）', ER01: '右の道（滝沿いの右岸）',
    LATE_SAFE: '中央の安全な尾根', LATE_L1: '封印の遺跡門への道（特殊挑戦）', LATE_R1: 'ライオン石像への尾根道',
    D_LC: '寄り道：苔むした小塔', D_LA: '寄り道：森の祭壇', D_RC: '寄り道：岩棚の見張り台', D_LLA: '寄り道：谷の端の小祠', D_R5: '寄り道：石像の奥', D_RS: '寄り道：虹の滝', D_RAND: '寄り道：閉ざされた古道',
  });
  const SPUR = (seg) => /^D_/.test(seg);
  const PLACE = Object.freeze({ START: 'スタート', J0: '分かれ道', P: '合流', LOWER_GATE: '下の門', Q: '運命の分かれ道', R: '合流', UPPER_GATE: '上の門', RIVAL: 'ライバルの広場', H: '後半の分かれ道', CHALLENGE: '封印の遺跡門', FINAL: '最後の合流', GOAL: '大会会場', STATUE: 'ライオン石像' });
  function routeName(seg) { return ROUTE_NAME[seg] || (SPUR(seg) ? '寄り道' : 'このまま進む'); }

  // ---- マップ（raising.js の boardOf・ゴールの判定用。行き止まりからは戻れるので、戻りの接続も conn に入れる＝行き止まりはゴールではない） ----
  let TRACK = null;
  function track() {
    if (TRACK) return TRACK;
    const d = D(), nodes = {}, conn = {};
    for (const [id, n] of Object.entries(d.nodes)) { nodes[id] = { type: n[2], x: n[0], y: n[1] }; conn[id] = []; }
    for (const e of d.edges) if (!conn[e[0]].includes(e[1])) conn[e[0]].push(e[1]);
    TRACK = Object.freeze({ nodes, conn, start: 'START', goal: 'GOAL', world: true });
    return TRACK;
  }

  // ---- 配置（m.raise.field） ----
  const fieldOf = (m) => (m && isObj(m.raise) && isObj(m.raise.field) && m.raise.field.world === 1 ? m.raise.field : null);
  function valid(f) {
    const d = D(); if (!isObj(f) || f.world !== 1 || f.chapterId !== CH || !Number.isInteger(f.layoutSeed)) return false;
    const c = f.core; if (!isObj(c) || !d.nodes[c.node] || !Array.isArray(c.trail) || !Number.isInteger(c.turn) || !Number.isInteger(c.moveLeft) || c.moveLeft < 0) return false;
    return isObj(f.tiles) && isObj(f.used) && isObj(f.claimed);
  }
  function newField(rnd = Math.random, seed) {
    const s = Number.isInteger(seed) ? seed >>> 0 : ((Math.floor(rnd() * 0x7fffffff) >>> 0) || 1);
    const core = C().create(D(), { seed: s, turnLimit: TURN_LIMIT });
    return { world: 1, chapterId: CH, patternId: 'W', layoutSeed: s, core, tiles: P().layout(D(), s), used: {}, claimed: {}, rivalMet: false, introSeen: false, arrivalSeen: false };
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
  const evById = (id) => (P().pool() || []).find((e) => e.id === id) || null;

  // ---- 移動（raising.js の step／chooseBranch から） ----
  const KEEP_EV = ['eventDie', 'gate', 'rival', 'reward', 'den', 'goal', 'timeup', 'stop', 'blocked'];
  function after(S, m, ev) {
    const r = m.raise, p = r.pend, c = fieldOf(m).core;
    r.node = c.node; p.left = c.moveLeft;
    const keep = ev.filter((e) => KEEP_EV.includes(e.type)); if (keep.length) p.evs = [...(p.evs || []), ...keep].slice(-12);
    const ch = ev.find((e) => e.type === 'choice');
    if (ch) { const op = C().options(D(), c); p.stage = 'branch'; p.opts = op.map((e) => e.dst); p.segs = op.map((e) => e.seg); return { stage: 'branch', opts: p.opts, ev }; }
    if (c.moveLeft <= 0 || c.done) { p.left = 0; p.stage = 'resolve'; } else p.stage = 'move';
    return { stage: p.stage, node: c.node, ev };
  }
  function step(S, m) {
    const f = fieldOf(m), p = m.raise.pend; if (!f || !p) return { stage: p ? p.stage : null };
    if (f.core.moveLeft <= 0 || f.core.done) { p.left = 0; p.stage = 'resolve'; return { stage: 'resolve' }; }
    return after(S, m, C().stepOnce(D(), f.core, {}));
  }
  function chooseBranch(S, m, id) {
    const f = fieldOf(m), p = m.raise.pend; if (!f || !p || p.stage !== 'branch') return { ok: false };
    const i = (p.opts || []).indexOf(id), seg = Array.isArray(p.segs) ? p.segs[i] : null; if (i < 0 || !seg) return { ok: false };
    delete p.opts; delete p.segs;
    const ev = C().stepOnce(D(), f.core, { choose: seg });
    if (!ev.some((e) => e.type === 'step')) { const o = after(S, m, ev); return { ok: false, ...o }; }
    return { ok: true, ...after(S, m, ev) };
  }
  /** 分かれ道の選択肢（画面用）：[{ id＝次の地点, seg, name, spur }] */
  function branchOptions(m) {
    const p = m && m.raise && m.raise.pend; if (!p || p.stage !== 'branch' || !Array.isArray(p.opts)) return [];
    return p.opts.map((id, i) => { const seg = (p.segs || [])[i]; return { id, seg, name: routeName(seg), spur: SPUR(seg) }; });
  }

  // ---- 止まった地点の中身（raising.js の resolveLanding から。1回だけ） ----
  function dieAt(m, id) { const p = m.raise.pend; return ((p && p.evs) || []).filter((e) => e.type === 'eventDie' && e.at === id).map((e) => ({ kind: e.kind, die: e.die, result: e.result })); }
  function resolve(S, m, id) {
    const f = fieldOf(m), d = D(), role = d.nodes[id] ? d.nodes[id][2] : '', dice = dieAt(m, id);
    const base = { place: PLACE[id] || null, dice };
    if (role === 'goal') return { kind: 'none', note: 'goal', ...base };
    if (role === 'mandatory_rival') { if (f.rivalMet) return { kind: 'none', note: 'rival_done', ...base }; f.rivalMet = true; return { kind: 'battle', battleType: 'rival', ...base }; }
    if (role === 'fixed_reward_dead_end' || role === 'optional_random_unlock_dead_end') {
      const R = T().rewards[id]; if (!R) return { kind: 'none', note: 'normal', ...base };
      if (f.claimed[id] != null) return { kind: 'none', note: 'claimed', title: R.title, ...base };
      f.claimed[id] = f.core.turn;
      return { kind: 'reward', id, den: role !== 'fixed_reward_dead_end', title: R.title, ...apply(S, m, R.eff), ...base };
    }
    const tile = f.tiles[id];
    if (role !== 'ordinary_tile' || !tile || f.used[id] != null) return { kind: 'none', note: role === 'ordinary_tile' ? 'normal' : role, ...base };
    if (tile.t === 'wild') { f.used[id] = f.core.turn; return { kind: 'battle', battleType: tile.rare ? 'rare' : 'wild', ...base }; }
    if (tile.t === 'stat') { f.used[id] = f.core.turn; const amount = addStat(m, tile.k, growthGain(m, tile.k)); return { kind: 'stat', key: tile.k, amount, grade: gradeOf(m, tile.k), ...base }; }
    if (tile.t === 'treasure') { f.used[id] = f.core.turn; return { kind: 'treasure', tier: tile.tier, ...apply(S, m, [{ gold: tile.gold }]), ...base }; }
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

  // ---- raising.js（MMP8）へのつなぎ ----
  const DRIVER = Object.freeze({
    world: true,
    handles: (key) => key === CH,
    turnLimit: () => TURN_LIMIT,
    diceSides: () => DICE,
    onDepart(S, m, key, rnd = Math.random, fresh) { m.raise.fatigue = fresh ? 0 : carry(m.raise.fatigue); m.raise.field = newField(rnd); return { patternId: 'W' }; },
    onDepartOther(S, m, key, fresh) { m.raise.fatigue = fresh ? 0 : carry(m.raise.fatigue); m.raise.field = null; },
    trackFor: () => track(),
    /** ボードを開くとき：配置が無い・壊れている・旧い Chapter 1 の配置なら、Chapter 1 の最初から（大会の途中ならゴールで大会を続ける）。途中の状態の食い違いを直す */
    ensure(S, m, rnd = Math.random) {
      const r = m.raise, f = r.field;
      if (valid(f)) {
        let changed = false; const c = f.core;
        if (r.node !== c.node) { r.node = c.node; changed = true; }
        if (!r.pend && c.moveLeft > 0) { c.discarded += c.moveLeft; c.moveLeft = 0; changed = true; }   // 移動の途中の記録が無い＝残りの目は捨てる
        if (r.pend && (r.pend.stage === 'move' || r.pend.stage === 'branch') && c.moveLeft <= 0) { r.pend.left = 0; r.pend.stage = 'resolve'; delete r.pend.opts; delete r.pend.segs; changed = true; }
        if (r.pend && r.pend.stage === 'branch' && !Array.isArray(r.pend.segs)) { const op = C().options(D(), c); r.pend.opts = op.map((e) => e.dst); r.pend.segs = op.map((e) => e.seg); changed = true; }
        if (c.turn !== r.turnsUsed) { c.turn = r.turnsUsed; changed = true; }
        return { changed };
      }
      r.field = newField(rnd);
      if (r.tour) Object.assign(r, { node: 'GOAL', pend: null, goal: true, turnLimit: TURN_LIMIT });
      else Object.assign(r, { node: 'START', turnsUsed: 0, pend: null, goal: false, turnLimit: TURN_LIMIT });
      if (r.tour) { r.field.core.node = 'GOAL'; r.field.core.done = true; }
      return { changed: true };
    },
    canRoll: (m) => { const f = fieldOf(m); return !!f && clampFat(m.raise.fatigue) < T().fatigueMax && !f.core.done && f.core.moveLeft === 0; },
    onRoll(S, m, v) {
      const f = fieldOf(m), c = f.core; c.turn = m.raise.turnsUsed - 1;
      C().roll(D(), c, v);
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
  function attach(P8 = root.MMP8) { if (!P8 || !P8.registerChapterOverride || root.MM_QA_OLD_CH1) return false; P8.registerChapterOverride(DRIVER); attached = true; return true; }
  function detach(P8 = root.MMP8) { if (P8 && P8.removeChapterOverride) P8.removeChapterOverride(DRIVER); attached = false; }
  /** この個体の今の Chapter がこのボードか（画面の切り替え用） */
  const active = (m) => attached && !!m && isObj(m.raise) && m.raise.ch === CH && !!root.MMP7 && root.MMP7.inChapter(m) && !!fieldOf(m);

  root.MMWD = Object.freeze({ CH, TURN_LIMIT, DICE, ROUTE_NAME, PLACE, DRIVER, attach, detach, active, fieldOf, valid, newField, track, routeName, branchOptions, isAttached: () => attached });
  attach();
})(typeof window !== 'undefined' ? window : globalThis);
