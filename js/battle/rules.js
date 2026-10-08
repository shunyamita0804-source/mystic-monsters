// バトルの正式ルールの差分 `MMRULES`（2026-10-06・5）：状態異常（まひ・ねむり）・固有スキル（ソラモ・ガウル・ノビトン・ジオル）・
//  ノビトンの正式技（SK の空いた番号 30〜39 に実行時に追加）・純補助技の命中 100%・大会の1試合ごとの旧表示（賞金・ランクアップ）を出さない。
//  fight()・battle-bridge・adapter・ルーレット・.bt 系 CSS（Phase 6）は変えない。外から包むだけ（rival-partner.js と同じ方式）：
//   ・MMBattle.resolveAction を包む（相手の能力・命中の乱数・結果の後処理）。状態はバトルのセッションごとの WeakMap（セーブしない・次のバトルへ持ち越さない）
//   ・ban（「あなたのターン」「相手のターン」＝行動の機会の始まり）で、まひ／ねむりで動けないかを決める
//   ・anim／skb／skSfx（fight() の外の関数）を包み、動けない行動では技の演出を出さない
//   ・#msg（fight() の say）の文を見張り、動けない文・状態異常の文を足す／大会・練習試合の1試合ごとの「賞金」「ランクアップ」を消す
//  レグナスの固有スキル「蒼銀の反撃」は従来どおり js/battle/rival-partner.js（ライバル戦だけ）。
(function (root) {
  'use strict';
  const G = (name) => { try { return (0, eval)(name); } catch (e) { return undefined; } };
  const other = (s) => (s === 'A' ? 'B' : 'A');
  const idx = (s) => (s === 'A' ? 0 : 1), sideOf = (i) => (i === 0 ? 'A' : 'B');

  // ---- 状態異常（正式 2026-10-06） ----
  //  まひ：3回の行動の機会のあいだ・毎回25%で行動に失敗（失敗してもターンを使う）・3回の機会のあとに治る
  //  ねむり：最大2回の行動の機会を失う（攻撃も補助もできない）・ダメージを受けるとすぐ起きる
  //  違う状態異常は同時にかかる（まひ＋ねむり）。同じ状態異常をもう一度受けたら、残りの回数を最初の値に戻す（足さない）
  const AILMENTS = Object.freeze({
    paralysis: Object.freeze({ label: 'まひ', turns: 3, failChance: 0.25 }),
    sleep: Object.freeze({ label: 'ねむり', turns: 2 }),
  });
  const SPECIES = Object.freeze({ 0: 'solamo', 1: 'gauru', 2: 'nobiton', 3: 'jiol', 4: 'regnas' });
  const SKILL = Object.freeze({   // 値は js/phase10/monsters.js の UNIQUE_SKILLS と同じ（そちらが無い環境の控え）
    solamo: { lifeRatioAtMost: 0.2, damageMultiplier: 1.25 },
    gauru: { turnsFromStart: 3, statUpRatio: 0.05 },
    nobiton: { statUpRatio: 0.05 },
    jiol: { chance: 0.1, surviveAtLife: 1 },
  });
  const skillOf = (key) => {
    const U = root.MMP10M && root.MMP10M.UNIQUE_SKILLS, u = U && U['unique_' + key];
    return Object.assign({}, SKILL[key], u && u.params ? u.params : {});
  };

  function newState() { return { ail: { A: {}, B: {} }, armed: { A: false, B: false }, used: { A: {}, B: {} }, block: null }; }
  /** 状態異常をかける（同じものは残りを最初の値に戻すだけ。足さない） */
  function applyAilment(st, side, kind) {
    const d = AILMENTS[kind]; if (!d) return false;
    st.ail[side][kind] = d.turns; return true;
  }
  const hasAilment = (st, side) => Object.keys(st.ail[side]).some((k) => st.ail[side][k] > 0);
  /** 行動の機会の始まり：動けないか（ねむり → まひの順）。機会の回数はどちらの状態異常でも1回ずつ減る */
  function opportunity(st, side, rnd = Math.random) {
    const a = st.ail[side], out = { blocked: false, kind: null, cured: [] };
    if (a.sleep > 0) { out.blocked = true; out.kind = 'sleep'; if (--a.sleep <= 0) { delete a.sleep; out.cured.push('sleep'); } }
    if (a.paralysis > 0) {
      if (!out.blocked && rnd() < AILMENTS.paralysis.failChance) { out.blocked = true; out.kind = 'paralysis'; }
      if (--a.paralysis <= 0) { delete a.paralysis; out.cured.push('paralysis'); }
    }
    return out;
  }
  function cureAll(st, side) { const had = Object.keys(st.ail[side]); st.ail[side] = {}; return had; }

  /** 固有スキルによる能力の倍率（ガウル＝最初の3ターン ちから・かしこさ +5%、ノビトン＝相手が状態異常のあいだ ちから・かしこさ・丈夫さ +5%） */
  function statMul(st, side, sp, turn) {
    const m = { power: 1, wisdom: 1, toughness: 1 }, key = SPECIES[sp];
    if (key === 'gauru') { const p = skillOf('gauru'); if (turn <= p.turnsFromStart) { m.power += p.statUpRatio; m.wisdom += p.statUpRatio; } }
    if (key === 'nobiton' && hasAilment(st, other(side))) { const p = skillOf('nobiton'); m.power += p.statUpRatio; m.wisdom += p.statUpRatio; m.toughness += p.statUpRatio; }
    return m;
  }

  // ---- ノビトンの正式技（SK の 30〜39。ノビトンはまだ市場で買えない＝今のゲームでは出ない。エンジンには入れておく） ----
  const NOBI_FIRST = 30;
  // 旧技の絵を借りる（正式の小さな絵は素材待ち）：No. → 借りる SK の番号
  const NOBI_VISUAL = { 1: 1, 2: 0, 3: 12, 4: 7, 5: 4, 6: 5, 7: 6, 8: 2, 9: 15, 10: 9 };
  const NOBI_EMOJI = ['👃', '💥', '💧', '💤', '🔨', '🌀', '⚡', '✨', '🌫️', '🗻'];
  const STATKEY = { atk: 'atk', de: 'de', hi: 'hi', ev: 'ev' }, LV = { small: 1, medium: 2, large: 3 };
  const BEHAVIOR = {};   // SK の番号 → { ailment, heal, support, owner }
  let installed = false;
  function install() {
    if (installed) return true;
    const SK = G('SK'), EFF = G('EFF'), SKART = G('SKART'), SFR = G('SFR'), SKM = G('SKM');
    const M = root.MMP10M, list = M && M.movesOf ? M.movesOf('nobiton') : [];
    if (!Array.isArray(SK) || !EFF || !list.length) return false;
    list.forEach((mv, i) => {
      const k = NOBI_FIRST + mv.no - 1, heal = mv.type === 'heal', dmg = mv.power != null;
      const desc = heal ? '自分の状態異常をすべて治し、最大ライフの20%を回復する（能力の上げ下げは残る）。' : mv.desc;
      // 旧 SK の並び：[名前, 威力比率, ルーレットの重み, 色, 絵文字, 分類, 説明, "p"|"i", 命中率, クリ率]。特殊（ダウナーミスト）の計算はかしこさ【暫定・要確認】
      SK[k] = [mv.name, dmg ? mv.power / 100 : 0, mv.power >= 120 ? 1 : 2.5, mv.power >= 120 ? '#c79cff' : '#e7a8c8', NOBI_EMOJI[i], dmg ? 'a' : 'd', desc,
        mv.type === 'power' ? 'p' : 'i', dmg ? mv.accuracy : 100, dmg ? mv.critical / 100 : 0];
      if (mv.effects && mv.effects.length) EFF[k] = mv.effects.map((e) => ({ tg: e.target === 'self' ? 0 : 1, st: STATKEY[e.stat], lv: (e.dir === 'down' ? -1 : 1) * LV[e.size], t: e.turns }));
      const v = NOBI_VISUAL[mv.no];
      if (Array.isArray(SKART) && SKART[v] != null) SKART[k] = SKART[v];
      if (SFR && SFR[v] != null) SFR[k] = SFR[v];
      if (SKM && SKM[v] != null) SKM[k] = SKM[v];
      BEHAVIOR[k] = { owner: 'nobiton', no: mv.no, ailment: mv.ailment || null, heal: mv.heal || null, support: !dmg };
    });
    const SPM = G('SPECIAL_MOVES');
    if (SPM && SPM.add) list.filter((m) => m.power >= 120).forEach((m) => SPM.add(NOBI_FIRST + m.no - 1));
    // 純補助技（威力なし）＝ソラモ・ガウル・レグナスの補助技も同じ扱い（基本命中 100%）
    for (let k = 0; k < SK.length; k++) if (SK[k] && !SK[k][1] && !BEHAVIOR[k]) BEHAVIOR[k] = { support: true };
    hookGlobals();
    installed = true;
    return true;
  }
  const kOf = (move) => { const m = /^sk(\d+)$/.exec((move && move.id) || ''); return m ? +m[1] : -1; };

  // ---- resolveAction を包む ----
  const STATES = new WeakMap();
  let surrenderPl = null;   // 降参したバトル（fight() の pl 配列。ban('降参') で記録）
  let cur = null;   // { sess, pl }（今のバトル。ban の時点ではまだ act が無いこともある）
  let last = null;  // 最後のバトル（画面を閉じたあとも、大会の記録のために残す）
  const stateOf = (sess) => { let s = STATES.get(sess); if (!s) { s = newState(); STATES.set(sess, s); } return s; };
  const nameOf = (pl, side) => (pl && pl[idx(side)] && pl[idx(side)].name) || (side === 'A' ? 'あなたのモンスター' : '相手');
  const spOf = (pl, side) => (pl && pl[idx(side)] ? pl[idx(side)].sp : null);

  /**
   * 包んだ resolveAction の本体（テストからも直接呼べる）。base＝元の resolveAction、pl＝[自分, 相手]（sp・name）、rnd＝状態異常・耐える の乱数
   *  戻り値に r.rules＝{ blocked, notes[] } を足す（表示用）
   */
  // 2026-10-08 正式：同じ能力・同じ向き・同じ強さのバフ／デバフを掛け直したら、スタックせずに残りターンを正式値へ更新する。
  //  battle-bridge（Phase 6）の applyEffect は「同じ強さなら残りが厳密に長いときだけ」置き換えるため、付与した次のラウンドの掛け直し（残りが同じ）が
  //  更新されなかった。ここで外側から置き換える（強い方で上書き・弱いのは上書きしない・上げと下げは別、は従来どおり）。
  function refreshSameEffects(sess, r) {
    if (!sess || !r || !Array.isArray(r.effectsApplied)) return;
    for (const a of r.effectsApplied) {
      const e = a && a.effect; if (!e || e.stackable) continue;
      const bucket = e.direction === 'up' ? sess.buffs : sess.debuffs, list = bucket && bucket[a.target];
      if (!Array.isArray(list) || list.includes(e)) continue;
      const i = list.findIndex((x) => x.category === e.category && !x.stackable && x.ratio === e.ratio && x.remainingTurns <= e.remainingTurns);
      if (i < 0) continue;
      const next = list.slice(); next[i] = e; bucket[a.target] = next;
    }
  }
  function resolveWith(base, opts, pl, rnd = Math.random) {
    const sess = opts.session, st = stateOf(sess), atk = opts.attackerSide, def = other(atk);
    const k = kOf(opts.move), bh = BEHAVIOR[k] || {};
    // 動けない（ban の時点で決めた）：何もしない行動（命中・ダメージ・効果・命中回数なし）
    if (st.block && st.block.side === atk) {
      const b = st.block; st.block = null;
      const life = sess.currentLife[def];
      return { actor: atk, target: def, moveId: opts.move.id, hit: false, critical: false, hitRate: 0, damage: 0, targetLifeBefore: life, targetLifeAfter: life, ko: false, effectsApplied: [], rules: { blocked: b.kind, notes: [] } };
    }
    // 固有スキル（能力の倍率）：その行動の計算に使う能力だけを写して変える（元の能力値・セーブは変えない）
    const bs = { A: Object.assign({}, opts.baseStats.A), B: Object.assign({}, opts.baseStats.B) };
    ['A', 'B'].forEach((s) => { const m = statMul(st, s, spOf(pl, s), sess.turn || 1); bs[s].power *= m.power; bs[s].wisdom *= m.wisdom; bs[s].toughness *= m.toughness; });
    const o2 = Object.assign({}, opts, { baseStats: bs });
    if (bh.support) o2.rng = Object.assign({}, opts.rng || {}, { hitRng: () => 0 });   // 純補助技は必ず決まる（基本命中 100%）
    const r = base(o2);
    refreshSameEffects(sess, r);
    // 2026-10-08 監査 M-13：レグナス「蒼銀の反撃」の上乗せダメージ（js/battle/rival-partner.js）は、固有スキルの判定（ソラモの構え・ジオルの耐え）より前に入れる
    //  （ライバル戦の外側の包みで後から足すと、上乗せで初めて20%以下になったソラモの構えが1行動遅れ、ジオルの耐えも打ち消される）
    try { const rp = root.MMRP; if (rp && typeof rp.counter === 'function') rp.counter(opts, r); } catch (e) { /* 演出の失敗でバトルを止めない */ }
    const notes = [];
    // ソラモ「逆境のひと踏ん張り」：構えていれば、この攻撃のダメージを1度だけ ×1.25
    if (SPECIES[spOf(pl, atk)] === 'solamo' && st.armed[atk] && r.hit && r.damage > 0) {
      st.armed[atk] = false;
      const mult = skillOf('solamo').damageMultiplier, total = Math.round(r.damage * mult), extra = total - r.damage;
      const after = Math.max(0, r.targetLifeAfter - extra), actual = r.targetLifeAfter - after;
      sess.currentLife[def] = after; if (sess.totalDamage) sess.totalDamage[atk] += actual;
      r.damage = total; r.targetLifeAfter = after; r.ko = r.ko || after <= 0;
      notes.push({ skill: 'solamo', side: atk, text: '逆境のひと踏ん張り！' });
    }
    // ジオル「大地の守り」：倒れるダメージを受けたとき、10%で1度だけライフ1で耐える
    if (r.ko && SPECIES[spOf(pl, def)] === 'jiol' && !st.used[def].jiol) {
      st.used[def].jiol = true;
      const p = skillOf('jiol');
      if (rnd() < p.chance) {
        const keep = p.surviveAtLife || 1, before = r.targetLifeBefore, lost = r.targetLifeBefore - r.targetLifeAfter, now = Math.max(0, before - keep);
        sess.currentLife[def] = Math.min(before, keep); if (sess.totalDamage) sess.totalDamage[atk] -= Math.max(0, lost - now);
        r.targetLifeAfter = sess.currentLife[def]; r.damage = now; r.ko = false; r.endured = true;
        notes.push({ skill: 'jiol', side: def, text: `${nameOf(pl, def)}は大地の守りで踏みとどまった！` });
      }
    }
    // ねむり：ダメージを受けたらすぐ起きる
    if (r.hit && r.damage > 0 && st.ail[def].sleep > 0) { delete st.ail[def].sleep; notes.push({ side: def, text: `${nameOf(pl, def)}は目を覚ました！` }); }
    // 状態異常をかける（命中・相手が倒れていないとき。成功率は命中とは別の判定）
    if (bh.ailment && r.hit && !r.ko && rnd() < bh.ailment.chance) {
      applyAilment(st, def, bh.ailment.kind);
      notes.push({ side: def, text: bh.ailment.kind === 'sleep' ? `${nameOf(pl, def)}は眠ってしまった！` : `${nameOf(pl, def)}はからだがしびれた！` });
    }
    // ひとやすみ：自分の状態異常をすべて治し、最大ライフの20%を回復（最大値まで・能力の上げ下げは残す）
    if (bh.heal && r.hit) {
      const max = (sess.participants && sess.participants[atk] && sess.participants[atk].maxLife) || 0, before = sess.currentLife[atk];
      const gain = Math.max(0, Math.min(max, before + Math.round(max * bh.heal.lifeRatio)) - before);
      sess.currentLife[atk] = before + gain;
      const cured = bh.heal.cureAilments ? cureAll(st, atk) : [];
      r.healed = gain;
      notes.push({ side: atk, heal: gain, text: `${nameOf(pl, atk)}のライフが${gain}回復した！` + (cured.length ? ' 状態異常が治った！' : '') });
    }
    // ソラモ：ライフが20%以下になったら構える（1バトル1回・重ならない）
    ['A', 'B'].forEach((s) => {
      if (SPECIES[spOf(pl, s)] !== 'solamo' || st.used[s].solamo) return;
      const max = sess.participants && sess.participants[s] && sess.participants[s].maxLife, life = sess.currentLife[s];
      if (max > 0 && life > 0 && life <= max * skillOf('solamo').lifeRatioAtMost) { st.used[s].solamo = true; st.armed[s] = true; notes.push({ side: s, text: `${nameOf(pl, s)}の逆境のひと踏ん張り！ 次の攻撃が強くなる！` }); }
    });
    r.rules = { blocked: null, notes };
    return r;
  }

  /** 参加者の正式の素早さ（1〜10）：個体が持っていればその値、無ければ種族の正式値（レグナスは RIVAL_MONSTERS）。分からなければ null */
  function speedOfUnit(u) {
    const P = root.MMP10M, ok = (v) => Number.isInteger(v) && v >= 1 && v <= 10;
    if (u && ok(u.speed)) return u.speed;
    if (!P || !u) return null;
    // プレイヤーの個体：fight() の写しは「素早さ分離処理」（index.html の p10LegacyBattle＝Phase 6 保護対象）で speed を外してあるので、元の個体（S.m）の値を読む
    { const S = G('S'), m = S && S.m; if (m && u.uid != null && m.uid === u.uid && u.speciesId === m.sp && ok(m.speed)) return m.speed; }
    const s = typeof P.speedOf === 'function' ? P.speedOf(u.speciesId) : null;
    if (ok(s)) return s;
    if (u.speciesId === 4 && typeof P.rivalMonster === 'function') { const r = P.rivalMonster('regnas'); if (r && ok(r.speed)) return r.speed; }
    return null;
  }
  /** createBattleSession の引数へ正式の素早さを入れ、差があれば速い側が必ず先攻になる乱数（0＝「速い側が先攻」の確率の下）にする */
  function withSpeed(o) {
    if (!o || !o.unitA || !o.unitB) return o;
    const a = speedOfUnit(o.unitA), b = speedOfUnit(o.unitB);
    const unitA = a != null ? Object.assign({}, o.unitA, { speed: a }) : o.unitA, unitB = b != null ? Object.assign({}, o.unitB, { speed: b }) : o.unitB;
    const out = Object.assign({}, o, { unitA, unitB });
    if (a != null && b != null && a !== b) out.rng = () => 0;
    return out;
  }
  function wrapBattle() {
    const B = root.MMBattle;
    if (!B || B.__rl || typeof B.resolveAction !== 'function') return;
    const W = Object.assign({}, B);
    W.__rl = true;
    W.resolveAction = function (opts) {
      const pl = G('BPL');
      if (!opts || !opts.session) return B.resolveAction(opts);
      cur = last = { sess: opts.session, pl };
      let r;
      try { r = resolveWith((o) => B.resolveAction(o), opts, pl); } catch (e) { return B.resolveAction(opts); }
      try { show(r, opts.attackerSide); } catch (e) { /* 表示の失敗でバトルを止めない */ }
      return r;
    };
    // 2026-10-08 正式：素早さで先攻を決める（高い方が必ず先攻・同じ値だけ 50%／50%）。battle-bridge（Phase 6）の determineFirstActor は差に応じた確率なので、
    //  外側で正式の素早さ（個体の speed／種族の正式値）を渡し、差があるときは「速い側が先攻」になる乱数を渡す。
    if (typeof B.createBattleSession === 'function') W.createBattleSession = function (o) {
      try { o = withSpeed(o); } catch (e) { /* 失敗しても従来どおり */ }
      return B.createBattleSession(o);
    };
    root.MMBattle = Object.freeze(W);
  }

  // ---- 表示 ----
  let pending = null;      // 次の act の文（#msg）への差し替え／追記
  const mute = { pop: 0, sfx: 0 };   // 動けない行動の MISS の数字・音を出さない（期限の時刻。1回で解ける）
  const now = () => (root.performance && performance.now ? performance.now() : Date.now());
  function blockText(pl, side, kind, cured) {
    const n = nameOf(pl, side);
    let t = kind === 'sleep' ? `${n}はぐっすり眠っている…` : `${n}はからだがしびれて動けない！`;
    cured.forEach((c) => { t += c === 'sleep' ? ` ${n}は目を覚ました！` : ` ${n}のからだのしびれがとれた。` });
    return t;
  }
  function show(r, side) {
    const pl = cur && cur.pl, rules = r && r.rules; if (!rules) return;
    if (rules.blocked) { mute.pop = mute.sfx = now() + 1800; return; }
    const tx = rules.notes.map((n) => n.text).join(' '), nm = nameOf(pl, side);
    if (tx) { if (pending && pending.name === nm && pending.mode === 'append') { pending.text += ' ' + tx; pending.at = now(); } else pending = { name: nm, mode: 'append', text: tx, at: now() }; }
    rules.notes.forEach((n) => { if (n.skill) setTimeout(() => badge(n.side, n.skill === 'solamo' ? '逆境のひと踏ん張り' : '大地の守り'), 720); });
    if (rules.notes.some((n) => n.heal)) setTimeout(() => healBar(r.actor), 720);
    setTimeout(drawAil, 760);
  }
  function healBar(side) {
    const s = cur && cur.sess; if (!s) return;
    const i = idx(side), b = document.getElementById('b' + i), g = b && b.querySelector && b.querySelector('.eg2');
    const max = s.participants[side].maxLife, life = s.currentLife[side];
    if (!g || !max) return;
    const p = Math.max(0, life / max * 100);
    const bar = g.querySelector('i'), tr = g.querySelector('.tr'), n = b.querySelector('small b');
    if (bar) bar.style.width = p + '%'; if (tr) tr.style.width = p + '%'; if (n) n.textContent = Math.round(life);
    g.classList.toggle('lo', p < 30);
  }
  function badge(side, label) {
    const bt = document.getElementById('bt'), mw = document.getElementById('m' + idx(side)); if (!bt) return;
    style();
    const d = document.createElement('div'); d.className = 'mmsk'; d.textContent = label;
    const br = bt.getBoundingClientRect(), r = mw ? mw.getBoundingClientRect() : { left: br.left + br.width / 2, width: 0, top: br.top + br.height / 2, height: 0 };
    d.style.left = (r.left - br.left + r.width / 2) + 'px'; d.style.top = (r.top - br.top + r.height * 0.25) + 'px';
    bt.appendChild(d); setTimeout(() => d.remove(), 1400);
  }
  /** 状態異常の札（HP の枠の中。fight() が描き直す #st の外の別の箱） */
  function drawAil() {
    const s = cur && cur.sess; if (!s || !document.getElementById('bt')) return;
    const st = stateOf(s);
    style();
    [0, 1].forEach((i) => {
      const hp = document.getElementById('hp' + i), host = hp && hp.querySelector && hp.querySelector('.hpb'); if (!host) return;
      let box = document.getElementById('mmail' + i);
      if (!box) { box = document.createElement('div'); box.id = 'mmail' + i; box.className = 'mmail'; host.appendChild(box); }
      const a = st.ail[sideOf(i)];
      box.innerHTML = Object.keys(a).filter((k) => a[k] > 0).map((k) => `<span class="mmail-${k}">${AILMENTS[k].label}<b>${a[k]}</b></span>`).join('');
    });
  }
  function blockedAnim(i, kind) {
    const mw = document.getElementById('m' + i); if (!mw || !mw.animate) return;
    try { mw.animate(kind === 'sleep' ? [{ transform: 'none' }, { transform: 'translateY(3px) scale(.98)' }, { transform: 'none' }] : [{ transform: 'none' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(-2px)' }, { transform: 'none' }], { duration: kind === 'sleep' ? 900 : 420 }); } catch (e) { /* 動きは飾り */ }
    badge(sideOf(i), kind === 'sleep' ? 'ねむり' : 'まひ');
  }

  function style() {
    if (document.getElementById('mmrl-style')) return;
    const st = document.createElement('style'); st.id = 'mmrl-style';
    st.textContent = '#bt .mmail{display:flex;gap:3px;flex-wrap:wrap;margin-top:2px;min-height:0}'
      + '#bt .mmail span{display:inline-flex;align-items:center;gap:2px;padding:0 6px;border-radius:999px;font:700 10px/16px "Noto Sans JP",sans-serif;color:#fff;border:1px solid rgba(255,255,255,.6)}'
      + '#bt .mmail span b{font-size:9px;opacity:.9}#bt .mmail .mmail-paralysis{background:#b88a16}#bt .mmail .mmail-sleep{background:#5b4fa8}'
      + '#bt .mmsk{position:absolute;z-index:12;pointer-events:none;padding:4px 11px;border-radius:999px;font:900 14px "Noto Sans JP",sans-serif;color:#fff;letter-spacing:.05em;'
      + 'background:linear-gradient(180deg,#7a5a1a,#3e2a08);border:2px solid #ffe2a0;box-shadow:0 0 12px rgba(255,210,120,.7);white-space:nowrap;transform:translate(-50%,-50%)}';
    document.head.appendChild(st);
  }

  // ---- 行動の機会（ban）・技の演出（anim・skb・skSfx）・音（sfx）を包む ----
  const TURN_TEXT = { 'あなたのターン': 'A', '相手のターン': 'B' };
  function onBan(t) {
    const side = TURN_TEXT[t]; if (!side) return;
    const pl = G('BPL');
    if (!cur || cur.pl !== pl) return;   // このバトルではまだ何も起きていない（状態異常も無い）
    const st = stateOf(cur.sess);
    st.block = null; mute.pop = mute.sfx = 0;
    const o = opportunity(st, side);
    if (o.blocked) {
      st.block = { side, kind: o.kind };
      mute.pop = mute.sfx = now() + 5000;   // ルーレットが MISS の枠に止まったとき（act を通らない）も MISS を出さない
      pending = { name: nameOf(pl, side), mode: 'replace', text: blockText(pl, side, o.kind, o.cured), at: now() };
      if (side === 'A') setTimeout(() => { const g = document.getElementById('go'); if (g && !g.disabled && typeof g.onclick === 'function') g.click(); }, 1050);   // 動けないときはルーレットをすぐ止める
    } else if (o.cured.length) {
      const n = nameOf(pl, side);
      pending = { name: n, mode: 'append', text: o.cured.map((c) => c === 'sleep' ? `${n}は目を覚ました！` : `${n}のからだのしびれがとれた。`).join(' '), at: now() };
    }
    setTimeout(drawAil, 0);
  }
  const blockedNow = (s) => { const st = cur && cur.pl === G('BPL') && STATES.get(cur.sess); return st && st.block && st.block.side === sideOf(s) ? st.block.kind : null; };
  let hooked = false;
  function hookGlobals() {
    if (hooked) return; hooked = true;
    const wrapFn = (name, mk) => { const f = root[name]; if (typeof f === 'function') root[name] = mk(f); };
    wrapFn('ban', (f) => function (t) { const r = f.apply(this, arguments); try { if (t === '降参') surrenderPl = G('BPL'); onBan(t); } catch (e) { /* */ } return r; });
    wrapFn('anim', (f) => function (k, s) { const b = blockedNow(s); if (b) { try { blockedAnim(s, b); } catch (e) { /* */ } return; } return f.apply(this, arguments); });
    wrapFn('skb', (f) => function (k, s) { if (blockedNow(s)) return; return f.apply(this, arguments); });
    wrapFn('skSfx', (f) => function (k) { if (cur && STATES.get(cur.sess) && STATES.get(cur.sess).block) return; return f.apply(this, arguments); });
    wrapFn('sfx', (f) => function (t) { if (t === 0 && now() < mute.sfx) { mute.sfx = 0; return; } return f.apply(this, arguments); });
    watchMsg();
  }
  /** fx.js から：動けない行動の MISS の数字を出さない（true＝飲み込んだ） */
  function swallow(n) {
    if (now() >= mute.pop || !n || n.tagName !== 'SPAN' || !n.classList || !n.classList.contains('ms') || (n.textContent || '') !== 'MISS') return false;
    mute.pop = 0; n.remove(); return true;
  }

  // ---- #msg：動けない文・状態異常の文・旧表示（賞金・ランクアップ）の削除 ----
  const PRIZE_RE = /\s*賞金\s*\d+G\s*を獲得！/g, RANKUP_RE = /\s*ランク[EDCBAS]にランクアップ！/g;
  /** 大会・練習試合（MMP8 の戦闘）の1試合の結果の文から、旧 fight() の「賞金」「ランクアップ」を消す（データは finishBattle が戻す） */
  function cleanResult(t) { return String(t).replace(PRIZE_RE, '').replace(RANKUP_RE, ''); }
  function inRaiseBattle() { const S = G('S'); return !!(S && S.m && S.m.raise && S.m.raise.battle); }
  function fixMsg(el) {
    const t = el.textContent || '';
    let out = t;
    if ((PRIZE_RE.test(t) || RANKUP_RE.test(t)) && inRaiseBattle()) out = cleanResult(t);
    PRIZE_RE.lastIndex = 0; RANKUP_RE.lastIndex = 0;
    if (pending && now() - pending.at < 6000 && (out.startsWith(pending.name + 'の「') || out.startsWith(pending.name + '：ミス'))) {
      out = pending.mode === 'replace' ? pending.text : out + ' ' + pending.text;
      pending = null;
    }
    if (out !== t) el.textContent = out;
  }
  let msgObs = null, msgEl = null;
  function watchMsg() {
    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return;
    const top = new MutationObserver(() => {
      const el = document.getElementById('bt') && document.getElementById('msg');
      if (el && el !== msgEl) {
        if (msgObs) msgObs.disconnect();
        msgEl = el; pending = null; mute.pop = mute.sfx = 0; wrapBattle();
        msgObs = new MutationObserver(() => fixMsg(el));
        msgObs.observe(el, { childList: true, characterData: true, subtree: true });
      } else if (!el && msgObs) { msgObs.disconnect(); msgObs = null; msgEl = null; cur = null; }
    });
    const start = () => top.observe(document.body, { childList: true });
    if (document.body) start(); else root.addEventListener('DOMContentLoaded', start);
  }

  /** 最後のバトルの内容（大会の順位の計算用）：{ me, opp } 各 { life：残りライフ%, dmg：与えたダメージ, hits：命中回数 }。そのバトルが無ければ null
   *  2026-10-08 正式：プレイヤーが降参した試合は、残りライフ% を 0 として記録する（降参が順位で得にならない）。与えたダメージ・命中回数は実際の値のまま。
   *  1回も行動していないうちの降参（セッションの記録が無い）でも、降参なら me.life 0・相手 100% の内容を返す */
  function battleStats(sess) {
    const pl = G('BPL'), sur = !sess && surrenderPl != null && surrenderPl === pl;
    const s = sess || (last && last.pl === pl ? last.sess : null);
    if (!s || !s.participants) return sur ? { me: { life: 0, dmg: 0, hits: 0 }, opp: { life: 100, dmg: 0, hits: 0 }, surrendered: true } : null;
    const one = (k) => { const max = s.participants[k].maxLife || 1; return { life: Math.max(0, Math.min(100, Math.round(s.currentLife[k] / max * 100))), dmg: Math.round(s.totalDamage[k] || 0), hits: s.hitCount[k] || 0 }; };
    const out = { me: one('A'), opp: one('B') };
    if (sur) { out.me.life = 0; out.surrendered = true; }
    return out;
  }
  /** 今のバトルでプレイヤーが降参したか（fight() の ban('降参') を見ている） */
  const surrendered = () => surrenderPl != null && surrenderPl === G('BPL');

  wrapBattle();
  root.MMRULES = Object.freeze({ AILMENTS, NOBI_FIRST, install, wrapBattle, swallow, cleanResult, battleStats, surrendered, refreshSameEffects, withSpeed, speedOfUnit, current: () => (cur && cur.pl === G('BPL') ? cur.sess : null), drawAil, behavior: (k) => BEHAVIOR[k] || null,
    // テスト用の純粋な処理
    newState, applyAilment, opportunity, cureAll, hasAilment, statMul, resolveWith, stateOf });
})(typeof window !== 'undefined' ? window : globalThis);
