// =========================================================
// Chapter 1 Pattern A 道路先行の試作 — 育成の中身 `MMRF_PLAY`（2026-10-09・試作。正式の Chapter 1 ではない）
//
//  道路・移動は js/proto/roadfirst-core.js（MMRF_CORE）のまま（299ノード・370接続・42区間・分岐・停止のルールは触らない）。
//  このファイルは「止まったマスの中身」だけを足す：能力マス6種・イベント・休憩・野生・宝箱・6つの固定報酬と隠れ家・疲れ・休む・試作G・試作アイテム。
//  ・マスの配置とイベントの中身は、その育成の seed から開始時に1回だけ決めて状態に保存する（再読み込みで引き直さない）
//  ・効果は「止まったときだけ」・そのノードで1回だけ（同じマスに戻っても二度目は無い。通るだけでは起きない）
//  ・効果は先に状態へ確定してから表示（notice）。表示を何度出し直しても二重にならない
//  ・能力の上昇量は正式マスター（js/phase10/monsters.js の MMP10M.GROWTH_GAIN／growthOf）。上限 999。レベル・経験値は無い
//  ・モンスターは連れている子の「読み取り専用の写し」（正式セーブ S.m は書き換えない）。いなければ「デモ個体」
//  ・所持金・アイテムは「試作G」「試作アイテム」＝ゲームの所持金・持ち物（S.gold・S.inv）には一切足さない
//  【試作用・要承認】の数値はすべて下の TUNING にまとめた（正式仕様ではない。試遊で確かめて決めるための仮の値）
// =========================================================
(function (root) {
  'use strict';
  const STAT_KEYS = ['li', 'po', 'in', 'hi', 'ev', 'de'];
  const STAT_LABEL = { li: 'ライフ', po: 'ちから', in: 'かしこさ', hi: '命中', ev: '回避', de: '丈夫さ' };
  const STAT_COLOR = { li: '#f2c14e', po: '#d9534f', in: '#5cb85c', hi: '#f06292', ev: '#7fd4e8', de: '#4c7bd9' };   // index.html の STAT_COLOR と同じ（正式色）
  const STAT_MAX = 999, STAT_MIN = 1;

  // ---- 【試作用・要承認】ここだけで決める（正式仕様ではない） ----
  const TUNING = Object.freeze({
    // マスの割合（通常の地点＝ordinary_tile 261 か所のうち。残りは「通常マス」＝何も起きない）
    density: Object.freeze({ stat: 0.30, event: 0.12, rest: 0.06, wild: 0.08, treasure: 0.03 }),
    calmSegments: Object.freeze(['S01', 'EL01', 'ER01']),   // 序盤（スタートの階段と J0 のすぐ先）には野生・休憩・宝箱を置かない
    rareRate: 0.10,                              // 野生マス1つごとにレアになる率（既存 Chapter 1 の rareBattleRate を参考にした仮。RoadFirst 全体の率ではない）
    fatigueByDie: Object.freeze({ 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7 }),   // 移動のサイコロの出目ごとの疲れ（旧 1〜3＝+3/+5/+7 は流用していない）
    fatigueMax: 100,
    restAmount: 30,                              // 「休む」：疲れ −30・1ターン・移動なし（既存のゲームの休むと同じ考え方）
    wildFatigue: 5,                              // 野生の出会い（バトルは未実装）の疲れ
    treasure: Object.freeze([{ w: 4, gold: 50, tier: 'normal' }, { w: 1, gold: 150, tier: 'rare' }]),   // 道中の宝箱（ch1a の treasurePool と同じ比率）
    rewards: Object.freeze({                     // 6つの固定報酬＋隠れ家（中身は未定＝試作の仮）
      L_CHEST: Object.freeze({ title: '左の宝箱', eff: Object.freeze([{ gold: 150 }]) }),
      R_CHEST: Object.freeze({ title: '右の宝箱', eff: Object.freeze([{ gold: 150 }]) }),
      L_ALTAR: Object.freeze({ title: '森の祭壇', eff: Object.freeze([{ statAll: 10 }]) }),
      L_LATE_ALTAR: Object.freeze({ title: '奥の祭壇', eff: Object.freeze([{ statAll: 15 }]) }),
      REWARD5: Object.freeze({ title: '石像の報酬', eff: Object.freeze([{ fat: -50 }, { gold: 100 }]) }),
      R_SPECIAL: Object.freeze({ title: '特別な報酬', eff: Object.freeze([{ best: 30 }]) }),
      RANDOM_DEN: Object.freeze({ title: '隠れ家', eff: Object.freeze([{ gold: 200 }]) }),
    }),
    doubleDie: Object.freeze({ labDefault: 3 }),  // &rfItemLab=1 のときだけ。2個振りの合計【仮】・疲れは2個ぶん【仮】
  });

  function mulberry(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const M = () => root.MMP10M || null;
  const clampStat = (v) => Math.max(STAT_MIN, Math.min(STAT_MAX, Math.round(v)));
  const pickW = (rng, list) => { const tot = list.reduce((a, x) => a + (x.w || x.weight || 1), 0); let r = rng() * tot; for (const x of list) { r -= x.w || x.weight || 1; if (r < 0) return x; } return list[list.length - 1]; };

  // ---- イベントの中身：既存の Chapter 1 の eventPool（js/chapter/configs/ch1a.js）を読むだけの薄いアダプタ（旧 Chapter の処理・セーブには触れない） ----
  let POOL = null;
  function setEventPool(pool) { POOL = Array.isArray(pool) ? pool.slice() : null; }
  function pool() {
    if (POOL) return POOL;
    try { const c = root.MMCH && root.MMCH.getConfig(1); if (c && Array.isArray(c.eventPool)) return c.eventPool; } catch (e) {}
    return [];
  }
  const evById = (id) => pool().find((e) => e.id === id) || null;
  const isRecovery = (e) => !!e.recovery;
  const usableEvent = (e) => !isRecovery(e) && (e.choices || ['stat_random', 'stat_all', 'stat_tired', 'gold', 'fatigue', 'none'].includes(e.handler));

  // ---- モンスター：連れている子の読み取り専用の写し（なければデモ個体） ----
  function monFrom(m) {
    const MM = M(); const ok = m && typeof m === 'object' && Number.isInteger(m.sp) && STAT_KEYS.every((k) => Number.isFinite(m[k]));
    const src = ok ? m : null, sp = ok ? m.sp : 0;
    const spec = MM && MM.byId ? MM.byId(sp) : null;
    const base = {}; STAT_KEYS.forEach((k) => { base[k] = clampStat(src ? src[k] : (spec && spec.base ? spec.base[k] : 100)); });
    const growth = {}; STAT_KEYS.forEach((k) => { growth[k] = MM ? MM.growthOf(src || { sp }, k) : 'C'; });
    return { demo: !ok, name: ok ? String(m.name || (spec && spec.name) || 'モンスター') : `デモ個体（${spec ? spec.name : 'ソラモ'}）`, sp, base, growth };
  }
  const gainOf = (play, k) => { const MM = M(); const g = play.mon.growth[k]; return MM ? MM.GROWTH_GAIN[g] : ({ A: 25, B: 21, C: 18, D: 14, E: 11 })[g]; };

  // ---- マスの配置（開始時に1回・seed から） ----
  function layout(D, seed) {
    const rng = mulberry((seed ^ 0xA5C3E1) >>> 0), dens = TUNING.density, tiles = {};
    const evs = pool().filter(usableEvent), rec = pool().filter(isRecovery);
    let bag = [];
    const nextEvent = () => { if (!bag.length) { bag = evs.map((e) => e.id); for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; } } return bag.pop(); };
    for (const [sid, s] of Object.entries(D.segments)) {
      let prev = null;
      for (const id of s[3]) {
        const n = D.nodes[id]; if (!n || n[2] !== 'ordinary_tile' || tiles[id] !== undefined) { prev = null; continue; }
        const r = rng(); let t = null, acc = 0;
        for (const k of ['stat', 'event', 'rest', 'wild', 'treasure']) { acc += dens[k]; if (r < acc) { t = k; break; } }
        const calm = TUNING.calmSegments.includes(sid);
        if (calm && (t === 'wild' || t === 'rest' || t === 'treasure')) t = null;
        if (t === 'wild' && prev && prev.t === 'wild') t = null;
        let tile = null;
        if (t === 'stat') { const ks = STAT_KEYS.filter((k) => !(prev && prev.t === 'stat' && prev.k === k)); tile = { t, k: ks[Math.floor(rng() * ks.length)] }; }
        else if (t === 'event' && evs.length) { const e = evById(nextEvent()); tile = { t, e: e.id }; if (e.handler === 'stat_random' && !(e.params && e.params.keys)) tile.k = STAT_KEYS[Math.floor(rng() * 6)]; else if (e.params && Array.isArray(e.params.keys) && e.params.keys.length > 1) tile.k = e.params.keys[Math.floor(rng() * e.params.keys.length)]; }
        else if (t === 'rest' && rec.length) tile = { t, e: pickW(rng, rec).id };
        else if (t === 'wild') tile = { t, rare: rng() < TUNING.rareRate };
        else if (t === 'treasure') { const x = pickW(rng, TUNING.treasure); tile = { t, gold: x.gold, tier: x.tier }; }
        if (tile) tiles[id] = tile;
        prev = tile;
      }
    }
    return tiles;
  }

  /** 移動の状態（MMRF_CORE.create）に育成の状態を付ける（v 2） */
  function attach(D, st, o = {}) {
    const mon = monFrom(o.monster);
    st.v = 2;
    st.play = {
      ver: 1, mon, stats: Object.assign({}, mon.base), fat: 0, gold: 0,
      tiles: layout(D, st.seed), used: {}, claimed: {}, hist: [], notice: null, landed: 0, rests: 0, lastRoll: null,
      lab: !!o.lab, items: { dd: o.lab ? (Number.isInteger(o.dd) ? o.dd : TUNING.doubleDie.labDefault) : 0 }, ddArmed: false,
      migrated: !!o.migrated, poolSize: pool().length,
    };
    return st;
  }
  /** 保存された状態の確認と旧形式（v 1＝移動だけ）からの移行。直せないときは null（呼び出し側は元の保存を壊さない） */
  function upgrade(D, st, o = {}) {
    if (!st || typeof st !== 'object' || !D.nodes[st.node] || !Array.isArray(st.trail)) return null;
    if (st.v === 2) return valid(D, st) ? st : null;
    if (st.v === 1) return attach(D, st, Object.assign({}, o, { migrated: true }));
    return null;
  }
  function valid(D, st) {
    const p = st && st.play;
    return !!(p && st.v === 2 && D.nodes[st.node] && Number.isFinite(p.fat) && p.stats && STAT_KEYS.every((k) => Number.isFinite(p.stats[k])) && p.tiles && p.used && p.claimed && Array.isArray(p.hist) && p.mon && p.mon.growth);
  }

  // ---- 効果（先に状態へ確定し、表示用の行を返す） ----
  function applyStat(play, k, amt, why) { const from = play.stats[k], to = clampStat(from + amt); play.stats[k] = to; return { k, from, to, d: to - from, grade: why === 'grow' ? play.mon.growth[k] : null }; }
  function applyFat(play, amt) { const from = play.fat, to = Math.max(0, Math.min(TUNING.fatigueMax, from + amt)); play.fat = to; return { fat: to - from, from, to }; }
  function applyEff(play, eff, ctx = {}) {
    const out = [];
    for (const e of eff) {
      if (e.gold) { play.gold += e.gold; out.push({ gold: e.gold }); }
      if (e.fat) out.push(applyFat(play, e.fat));
      if (e.full) out.push(applyFat(play, -play.fat));
      if (e.stat) out.push(applyStat(play, e.stat, e.amt, e.why));
      if (e.statAll) STAT_KEYS.forEach((k) => out.push(applyStat(play, k, e.statAll)));
      if (e.best) { const order = ['A', 'B', 'C', 'D', 'E']; const k = STAT_KEYS.slice().sort((a, b) => order.indexOf(play.mon.growth[a]) - order.indexOf(play.mon.growth[b]))[0]; out.push(applyStat(play, k, e.best)); }
    }
    return out;
  }
  /** 既存のイベントの handler／params を試作の効果へ読み替える（stat_random の能力はマスの配置で決めた k） */
  function eventEff(h, p = {}, k) {
    p = p || {};
    if (h === 'fatigue') return p.full ? [{ full: true }] : [{ fat: -(p.amount || 0) }];
    if (h === 'gold') return [{ gold: p.amount || 0 }];
    if (h === 'stat_random') return [{ stat: k || (p.keys && p.keys[0]) || 'li', amt: p.amount || 0 }];
    if (h === 'stat_tired') return [{ stat: k || (p.keys && p.keys[0]) || 'li', amt: p.amount || 0 }, { fat: p.fatigue || 0 }];
    if (h === 'stat_all') return STAT_KEYS.filter((x) => x !== 'li').map((x) => ({ stat: x, amt: p.amount || 0 }));
    return [];
  }

  const busyFor = (D, st, C) => !!(st.play.notice || (C && C.needsChoice(D, st)) || st.moveLeft > 0);
  function canRoll(D, st, C) { const p = st.play; return !!p && !st.done && !st.timeUp && st.turn < st.limit && !busyFor(D, st, C) && p.fat < TUNING.fatigueMax; }
  function canRest(D, st, C) { const p = st.play; return !!p && !st.done && !st.timeUp && st.turn < st.limit && !busyFor(D, st, C) && p.fat > 0; }

  /** サイコロ（1ターン）＋疲れ。o.double＝ダブルダイス【仮】（試作アイテムを1個使う・2個の合計） */
  function roll(D, st, C, die, o = {}) {
    const p = st.play; if (!canRoll(D, st, C)) return null;
    let v, dice, fat;
    if ((o.double || p.ddArmed) && p.items.dd > 0) {
      dice = Array.isArray(o.dice) ? o.dice.slice(0, 2) : [C.d6(st), C.d6(st)];
      v = C.roll(D, st, dice[0] + dice[1], { max: 12 }); if (v == null) return null;
      p.items.dd--; p.ddArmed = false; fat = TUNING.fatigueByDie[dice[0]] + TUNING.fatigueByDie[dice[1]];
    } else {
      v = C.roll(D, st, die); if (v == null) return null; dice = [v]; fat = TUNING.fatigueByDie[v] || 0; p.ddArmed = false;
    }
    const f = applyFat(p, fat);
    p.lastRoll = { t: st.turn, v, dice, fat: f.fat };
    return v;
  }
  /** 休む：疲れ −30・1ターン・移動なし。最後のターンなら時間切れ */
  function rest(D, st, C) {
    const p = st.play; if (!canRest(D, st, C)) return null;
    st.turn++; p.rests++; p.landed = st.turn; p.lastRoll = null;
    const f = applyFat(p, -TUNING.restAmount);
    p.hist.push({ t: st.turn, node: st.node, kind: 'rest', title: '休んだ', d: [f] });
    st.log.push({ t: st.turn, rest: true, at: st.node });
    if (st.turn >= st.limit) { st.timeUp = true; }
    p.notice = { kind: 'rest', title: '休んだ', text: `その場で休んだ（1ターン）。`, d: [f], at: st.node, t: st.turn };
    return f;
  }

  /** 移動が終わったあと（分岐の選択待ちでなく、残りの目が無い）に1回だけ、止まった地点の中身を確定する */
  function land(D, st, C) {
    const p = st.play; if (!p || st.turn < 1 || p.landed === st.turn) return null;
    if (st.moveLeft > 0 || (C && C.needsChoice(D, st))) return null;
    p.landed = st.turn;
    const id = st.node, role = D.nodes[id][2];
    let n = null;
    if (role === 'fixed_reward_dead_end' || role === 'optional_random_unlock_dead_end') {
      const R = TUNING.rewards[id];
      if (R && !p.claimed[id]) { p.claimed[id] = st.turn; const d = applyEff(p, R.eff); n = { kind: role === 'fixed_reward_dead_end' ? 'reward' : 'den', title: R.title, text: `${R.title}を見つけた！【試作の中身】`, d }; }
      else if (R) n = { kind: 'reward', title: R.title, text: `${R.title}：もう受け取った（1回の育成で1回だけ）。`, d: [] };
    } else {
      const tile = p.tiles[id];
      if (tile && !p.used[id]) {
        p.used[id] = st.turn;
        if (tile.t === 'stat') { const amt = gainOf(p, tile.k); const d = applyEff(p, [{ stat: tile.k, amt, why: 'grow' }]); n = { kind: 'stat', k: tile.k, title: `${STAT_LABEL[tile.k]}のマス`, text: `${STAT_LABEL[tile.k]}が伸びた！（適性 ${p.mon.growth[tile.k]}）`, d }; }
        else if (tile.t === 'event' || tile.t === 'rest') {
          const e = evById(tile.e);
          if (!e) n = { kind: tile.t, title: '出来事', text: '（この出来事のデータが見つからない＝効果なし）', d: [] };
          else if (e.choices) n = { kind: 'choice', e: e.id, title: e.title || '出来事', text: e.text, lines: (e.lines || []).map((l) => l.text), img: e.image || null, choices: e.choices.map((c) => ({ id: c.id, label: c.label, desc: c.desc || '' })), d: [] };
          else { const d = applyEff(p, eventEff(e.handler, e.params, tile.k)); n = { kind: tile.t, e: e.id, title: e.title || (tile.t === 'rest' ? '休憩マス' : '出来事'), text: e.text, lines: (e.lines || []).map((l) => l.text), img: e.image || null, d }; }
        } else if (tile.t === 'wild') { const d = applyEff(p, [{ fat: TUNING.wildFatigue }]); n = { kind: 'wild', rare: !!tile.rare, title: tile.rare ? 'レアモンスター' : '野生のモンスター', text: `${tile.rare ? 'めずらしいモンスター' : '野生のモンスター'}に出会った（試作：バトルは未実装）。`, d }; }
        else if (tile.t === 'treasure') { const d = applyEff(p, [{ gold: tile.gold }]); n = { kind: 'treasure', title: '宝箱', text: `宝箱を開けた！（${tile.tier === 'rare' ? 'めずらしい箱' : 'ふつうの箱'}）`, d }; }
      }
    }
    if (n) { n.at = id; n.t = st.turn; p.notice = n; p.hist.push({ t: st.turn, node: id, kind: n.kind, title: n.title, d: n.d }); }
    return n;
  }
  /** 2択の出来事を選ぶ（効果は1回だけ。選んだあとは結果の表示に置き換える） */
  function choose(D, st, idx) {
    const p = st.play, n = p && p.notice; if (!n || n.kind !== 'choice') return null;
    const e = evById(n.e), c = e && e.choices && e.choices[idx]; if (!c) return null;
    const tile = p.tiles[n.at];
    const d = applyEff(p, eventEff(c.handler, c.params, tile && tile.k));
    p.notice = { kind: 'event', e: e.id, title: e.title || '出来事', text: c.text || c.label, img: e.image || null, d, at: n.at, t: n.t, chose: c.id };
    const h = p.hist[p.hist.length - 1]; if (h && h.node === n.at && h.t === n.t) { h.d = d; h.chose = c.id; }
    return d;
  }
  function ack(st) { if (st.play && st.play.notice && st.play.notice.kind !== 'choice') st.play.notice = null; }

  /** 表示用：その地点の印（種類・色） */
  function tileLook(st, id) {
    const p = st.play, t = p && p.tiles[id]; if (!t) return null;
    const used = !!p.used[id];
    if (t.t === 'stat') return { t: 'stat', k: t.k, color: STAT_COLOR[t.k], used };
    return { t: t.t, rare: !!t.rare, used };
  }

  // ---- シミュレーション（Node でも動く） ----
  /** 1回の育成（40ターン）。pol＝道の選び方（MMRF_CORE.makePolicy）、restAt＝この疲れ以上なら休む（100＝振れないときだけ）、dd＝ダブルダイスの使い方 */
  function simulate(D, C, o = {}) {
    const st = attach(D, C.create(D, o), { monster: o.monster, lab: o.dd > 0, dd: o.dd || 0 });
    const pol = o.policy || C.makePolicy(o.p || {}, C.mulberry(((o.seed || 1) ^ 0x51ED) >>> 0));
    const pickRng = C.mulberry(((o.seed || 1) ^ 0xC0FFEE) >>> 0), restAt = o.restAt ?? TUNING.fatigueMax;
    let stuck = 0;
    for (let guard = 0; guard < 400 && !st.done && !st.timeUp; guard++) {
      const n = st.play.notice;
      if (n) { if (n.kind === 'choice') choose(D, st, Math.floor(pickRng() * n.choices.length)); ack(st); continue; }
      if (st.play.fat >= restAt || !canRoll(D, st, C)) { if (rest(D, st, C)) continue; stuck++; break; }
      const useDD = o.dd > 0 && st.play.items.dd > 0 && (o.ddWhen ? o.ddWhen(st) : true);
      if (roll(D, st, C, undefined, { double: useDD }) == null) { stuck++; break; }
      let adv = Object.assign({}, o.adv || {});
      for (let g = 0; g < 64; g++) { const ev = C.advance(D, st, adv); const c = ev.find((x) => x.type === 'choice'); if (!c) break; adv = Object.assign({}, o.adv || {}, { choose: pol(D, st, c.options) }); }
      land(D, st, C);
    }
    st.stuck = stuck;
    return st;
  }

  const api = { TUNING, STAT_KEYS, STAT_LABEL, STAT_COLOR, STAT_MAX, setEventPool, pool, monFrom, layout, attach, upgrade, valid, canRoll, canRest, roll, rest, land, choose, ack, tileLook, simulate, eventEff };
  root.MMRF_PLAY = api;
})(typeof window !== 'undefined' ? window : globalThis);
