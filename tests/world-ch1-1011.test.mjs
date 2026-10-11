// =========================================================
// 本編の Chapter 1＝1枚の世界のボード（2026-10-11。js/chapter/world-driver.js の MMWD が raising.js の Chapter 1 を受け持つ）
//  WC-01 出発：Chapter 1 は新ボード（サイコロ 1〜6・40ターン・配置は m.raise.field）・Chapter 2 はこれまでのエンジン・MM_QA_OLD_CH1 なら旧ボード
//  WC-02 通し（300回）：本物の育成の流れ（roll → step → 分かれ道 → 停止 → バトル）で必ずゴールか40ターンで終わる・道路データは変わらない・能力は 0〜999・
//        何手かごとに保存 → 読み込みしても同じ配置・同じ進み方
//  WC-03 停止の中身：能力マス＝成長適性の値（GROWTH_GAIN）を1回だけ・宝の行き止まりは1回だけ・ライバルは1回だけバトル・野生／レアはバトル・2択の出来事
//  WC-04 旧い Chapter 1 の途中のセーブ：能力・所持金・疲れはそのままで Chapter 1 の最初から（大会の途中なら大会を続ける）
//  WC-05 Chapter の終わり：40ターン切れ → 大会なしでベースキャンプ（Chapter 2 の前）・疲れは −50 を持ち越す・配置は消える
//  WC-06 index.html：読み込み順・board() の切り替え・field-view は新ボードを担当しない・テストの既定（MM_QA_OLD_CH1）
//  WC-07 フィナの節目の一言（MMWD.storyEvents）：出発＝40ターン・1〜6 の説明・このセーブで1回（S.npcFlags.story）／この Chapter で1回（field.storySeen）・
//        条件（止まった地点の結果・通った区間・分かれ道の寄り道・運命のサイコロ）・優先度・pass の区間 ID は原本に実在する・旧ボードの「45ターン」は出さない
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const FILES = ['js/phase7/progression.js', 'js/phase8/league.js', 'js/phase8/raising.js', 'js/phase10/monsters.js', 'js/phase9/chapters.js', 'js/chapter/engine.js', 'js/chapter/configs/ch1a.js', 'js/chapter/configs/ch2a.js',
  'js/proto/roadfirst-data.js', 'js/proto/roadfirst-core.js', 'js/proto/roadfirst-play.js', 'js/chapter/world-driver.js'];
const SRC = Object.fromEntries(FILES.map((f) => [f, rd(f)]));
function load(pre = {}) {
  const w = { ...pre };
  for (const f of FILES) new Function('window', SRC[f])(w);
  for (const c of w.MMP9C.CHAPTERS) w.MMP7.registerChapterBoard(c.no, c.track, { provisional: false });
  return w;
}
const lcg = (seed) => { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };
const SIX = ['li', 'po', 'in', 'hi', 'ev', 'de'];
function setup(w, seed = 1, over = {}) {
  const { MMP7: P7, MMP8: P8 } = w, S = P8.newSave();
  S.m = P8.initIndividual(S, { sp: 0, name: 'テスト', rk: 0, fa: 0, st: 0, li: 100, po: 100, in: 100, hi: 100, ev: 100, de: 100, sk: [0, 1, 2, 3], eq: [0, 1, 2, 3, -1, -1], ...over });
  P7.ensureProg(S.m);
  assert.equal(P8.depart(S, S.m, lcg(seed)).ok, true);
  return S;
}
const store = (S) => ({ getItem: (k) => (k === 'mr4v6' ? JSON.stringify(S) : null), setItem() {}, removeItem() {} });
const reload = (w, S) => { const r = w.MMP8.loadFromStorage(store(S)); assert.equal(r.status, 'ok'); return r.S; };
/** 本物の流れで1回の Chapter 1 を最後まで（分かれ道は乱数・バトルはやめておく・疲れ86以上なら休む）。every＝何手ごとに保存→読み込み */
function play(w, seed, every = 0) {
  const { MMP8: P8, MMWD: WD } = w, rnd = lcg(seed * 7 + 3);
  let S = setup(w, seed), m = S.m;
  const seen = { battle: 0, rival: 0, stat: 0, reward: 0, choice: 0, branch: 0 };
  for (let g = 0; g < 3000; g++) {
    if (every && g % every === 0) { S = reload(w, S); m = S.m; }
    P8.ensureBoardPosition(S, m);
    const ph = P8.boardPhase(m);
    if (ph === 'goal' || ph === 'timeup') return { S, m, ph, seen };
    if (ph === 'roll') { if (!P8.canRoll(m) || m.raise.fatigue >= 86) P8.rest(S, m); else P8.roll(S, m, rnd); }
    else if (ph === 'move') P8.step(S, m);
    else if (ph === 'branch') { seen.branch++; const o = WD.branchOptions(m); assert.ok(o.length >= 2, '分かれ道の選択肢は2つ以上'); const r = P8.chooseBranch(S, m, o[Math.floor(rnd() * o.length)].id); assert.equal(r.ok, true); }
    else if (ph === 'resolve') { const r = P8.resolveLanding(S, m, rnd); if (r.choice) { seen.choice++; assert.equal(P8.resolveChoice(S, m, r.fx.options[0].id, rnd).ok, true); } if (r.fx.kind === 'stat') seen.stat++; if (r.fx.kind === 'reward') seen.reward++; }
    else if (ph === 'battle') { seen.battle++; if (m.raise.pend.fx.battleType === 'rival') seen.rival++; assert.equal(P8.skipBattleSquare(S, m).ok, true); }
    else throw new Error('想定外の局面 ' + ph);
  }
  throw new Error('終わらない seed=' + seed);
}

test('WC-01：出発＝Chapter 1 は新ボード（1〜6・40ターン）・Chapter 2 はエンジン・MM_QA_OLD_CH1 なら旧ボード', () => {
  const w = load(), S = setup(w, 5), m = S.m;
  assert.equal(w.MMWD.isAttached(), true); assert.equal(w.MMP8.driverFor(1), w.MMWD.DRIVER); assert.equal(w.MMP8.driverFor(2), w.MMCH.DRIVER);
  assert.equal(m.raise.turnLimit, 40); assert.equal(w.MMP8.diceSides(m), 6); assert.equal(m.raise.node, 'START');
  const f = m.raise.field; assert.equal(f.world, 1); assert.equal(f.chapterId, 1); assert.ok(w.MMWD.valid(f)); assert.equal(f.core.limit, 40);
  assert.ok(Object.keys(f.tiles).length > 100, '通常の地点にマスの中身');
  const vals = new Set(); for (let i = 0; i < 6; i++) { const S2 = setup(w, 9 + i); const r = w.MMP8.roll(S2, S2.m, () => (i + 0.5) / 6); vals.add(r.value); }
  assert.deepEqual([...vals].sort(), [1, 2, 3, 4, 5, 6], 'サイコロは 1〜6');
  const o = load({ MM_QA_OLD_CH1: true }); assert.equal(o.MMWD.isAttached(), false); assert.equal(o.MMP8.driverFor(1), o.MMCH.DRIVER, '自動テスト用：旧い Chapter 1');
});

test('WC-02：通し300回＝ゴールか40ターンで終わる・道路データは不変・能力は 0〜999・保存→読み込みで同じ進み方', () => {
  const w = load(), D = w.MMRF_DATA, h = () => createHash('sha256').update(JSON.stringify([D.nodes, D.edges, D.segments])).digest('hex'), H0 = h();
  let goal = 0, rival = 0, branch = 0, stat = 0;
  for (let seed = 1; seed <= 300; seed++) {
    const { m, ph, seen } = play(w, seed);
    assert.ok(m.raise.turnsUsed <= 40, `seed ${seed}：40ターン以内`);
    if (ph === 'goal') { goal++; assert.equal(m.raise.node, 'GOAL'); assert.equal(seen.rival, 1, 'ゴールまでにライバルは必ず1回'); }
    for (const k of SIX) assert.ok(m[k] >= 0 && m[k] <= 999);
    rival += seen.rival; branch += seen.branch; stat += seen.stat;
  }
  assert.equal(h(), H0, '299ノード・370接続・42区間は変わらない');
  assert.equal(Object.keys(D.nodes).length, 299); assert.equal(D.edges.length, 370);
  assert.ok(goal > 100, `ゴールに着く回がある（${goal}/300）`); assert.ok(stat > 300 && branch > 300 && rival > 100);
  for (const seed of [4, 17, 33]) {   // 3手ごとに保存→読み込みしても、同じ乱数なら同じ結果
    const a = play(w, seed), b = play(w, seed, 3);
    assert.deepEqual([b.m.raise.node, b.m.raise.turnsUsed, b.ph, b.m.raise.fatigue, ...SIX.map((k) => b.m[k])], [a.m.raise.node, a.m.raise.turnsUsed, a.ph, a.m.raise.fatigue, ...SIX.map((k) => a.m[k])], `seed ${seed}`);
  }
});

test('WC-03：停止の中身＝能力マスは成長適性を1回・宝の行き止まりは1回・ライバルは1回・野生はバトル・2択', () => {
  const w = load(), { MMP8: P8, MMP10M: M } = w;
  const S = setup(w, 21), m = S.m, f = m.raise.field;
  const at = (id) => { m.raise.node = id; f.core.node = id; m.raise.pend = { roll: 1, left: 0, stage: 'resolve' }; return P8.resolveLanding(S, m, () => 0.5); };
  const statId = Object.keys(f.tiles).find((id) => f.tiles[id].t === 'stat'), k = f.tiles[statId].k, b = m[k];
  const r1 = at(statId); assert.equal(r1.fx.kind, 'stat'); assert.equal(m[k] - b, M.growthGain(m, k), '成長適性の値（GROWTH_GAIN）'); assert.equal(M.growthGain(m, k), M.GROWTH_GAIN[M.growthOf(m, k)]);
  const r2 = at(statId); assert.equal(r2.fx.kind, 'none'); assert.equal(m[k] - b, M.growthGain(m, k), '同じ能力マスは1回だけ');
  const g0 = S.g, rw = at('L_CHEST'); assert.equal(rw.fx.kind, 'reward'); assert.ok(S.g > g0 || rw.fx.gains.length || rw.fx.fatigue, '報酬の中身');
  assert.equal(at('L_CHEST').fx.note, 'claimed', '宝の行き止まりは1回だけ');
  const rv = at('RIVAL'); assert.equal(rv.fx.kind, 'battle'); assert.equal(rv.fx.battleType, 'rival'); assert.equal(P8.skipBattleSquare(S, m).ok, true);
  assert.equal(at('RIVAL').fx.kind, 'none', 'ライバルは1回だけ');
  const wildId = Object.keys(f.tiles).find((id) => f.tiles[id].t === 'wild'), wr = at(wildId);
  assert.equal(wr.fx.kind, 'battle'); assert.ok(['wild', 'rare'].includes(wr.fx.battleType)); assert.equal(P8.boardPhase(m), 'battle');
  assert.equal(P8.skipBattleSquare(S, m).ok, true);
  const pool = w.MMCH.getConfig(1).eventPool, choiceEv = pool.find((e) => Array.isArray(e.choices) && e.choices.length);
  const evId = Object.keys(f.tiles).find((id) => f.tiles[id].t === 'event' && !f.used[id]); f.tiles[evId] = { ...f.tiles[evId], e: choiceEv.id };
  const ch = at(evId); assert.equal(ch.fx.kind, 'choice'); assert.equal(f.used[evId], undefined, '選ぶまで使った印を付けない');
  const ok = P8.resolveChoice(S, m, choiceEv.choices[0].id, () => 0.5); assert.equal(ok.ok, true); assert.equal(ok.fx.choice, choiceEv.choices[0].id); assert.ok(f.used[evId] != null);
  const reg = (P8.loadFromStorage(store(S)).S); assert.ok(w.MMWD.valid(reg.m.raise.field), '保存しても配置はそのまま');
});

test('WC-04：旧い Chapter 1 の途中のセーブ＝能力・所持金・疲れはそのままで最初から／大会の途中なら大会を続ける', () => {
  const o = load({ MM_QA_OLD_CH1: true }), S0 = setup(o, 3, { po: 222 }); S0.g = 777; S0.m.raise.fatigue = 40;
  o.MMP8.roll(S0, S0.m, () => 0.6); o.MMP8.step(S0, S0.m);
  assert.notEqual(S0.m.raise.field.world, 1, '旧ボードの配置');
  const fat0 = S0.m.raise.fatigue, w = load(), S = reload(w, S0), m = S.m;
  assert.equal(m.raise.field, null, '読み込みで旧い配置は外す');
  assert.equal(w.MMP8.ensureBoardPosition(S, m).changed, true);
  assert.deepEqual([m.raise.node, m.raise.turnsUsed, m.raise.pend, m.raise.turnLimit, m.po, S.g, m.raise.fatigue], ['START', 0, null, 40, 222, 777, fat0]);
  assert.ok(w.MMWD.valid(m.raise.field), '新しい配置');
  // 大会の途中（受付の後）：ゴールで大会を続ける
  const S1 = setup(o, 4); S1.m.raise.goal = true; S1.m.raise.pend = null; S1.m.raise.node = 'p14_3';
  assert.equal(o.MMP8.startTournament(S1, S1.m, 0).ok, true);
  const S2 = reload(w, S1); w.MMP8.ensureBoardPosition(S2, S2.m);
  assert.equal(S2.m.raise.node, 'GOAL'); assert.ok(S2.m.raise.tour, '大会はそのまま'); assert.equal(w.MMP8.boardPhase(S2.m), 'tour');
});

test('WC-05：40ターン切れ → 大会なしでベースキャンプ（Chapter 2 の前）・疲れは −50 を持ち越す・配置は消える', () => {
  const w = load(), { MMP8: P8 } = w, S = setup(w, 8), m = S.m;
  m.raise.turnsUsed = 39; m.raise.field.core.turn = 39; m.raise.fatigue = 70;
  const r = P8.rest(S, m); assert.equal(r.ok, true); assert.equal(r.timeUp, true);
  assert.equal(P8.boardPhase(m), 'timeup');
  const e = P8.endChapter(S, m); assert.equal(e.ok, true); assert.equal(e.entry.reachedGoal, false); assert.equal(e.entry.tour, null);
  assert.deepEqual([m.raise.state, m.raise.ch, m.raise.field], ['farm', 2, null]);
  assert.equal(P8.depart(S, m, lcg(1)).ok, true); assert.equal(m.raise.fatigue, 0, '疲れ 40 → 次の Chapter は max(0, 40−50)');
  assert.equal(m.raise.field.world, undefined, 'Chapter 2 はこれまでのエンジンの配置');
});

test('WC-06：index.html＝読み込み順・board() の切り替え・field-view は新ボードを担当しない・テストの既定', () => {
  const html = rd('index.html');
  const i = (s) => { const k = html.indexOf(s); assert.ok(k > 0, s); return k; };
  assert.ok(i('js/proto/roadfirst-play.js') < i('js/chapter/world-driver.js') && i('js/proto/roadfirst-world.js') < i('js/chapter/world-board.js') && i('js/chapter/world-board.js') < i('<script>\nconst $='), '読み込み順');
  assert.ok(i('if(window.MMWB&&MMWB.active(m))return MMWB.board(msg)') < i('if(window.chfActive&&chfActive(m))return chfBoard(msg)'), 'board() は新ボードを先に');
  assert.match(html, /MMWB\.release\(\)/);
  assert.match(rd('js/chapter/field-view.js'), /function chfActive\(m\) \{[^}]*!\(root\.MMWD && root\.MMWD\.active\(m\)\)/);
  assert.match(rd('tests/e2e/harness.mjs'), /if \(!opt\.worldCh1\) await ctx\.addInitScript\(\(\) => \{ window\.MM_QA_OLD_CH1 = true; \}\)/);
  assert.doesNotMatch(rd('js/chapter/world-driver.js') + rd('js/chapter/world-board.js'), /localStorage|mmrf_proto_v1/, '保存はゲームのセーブ（mr4v6）だけ');
});

test('WC-07：フィナの節目の一言（MMWD.storyEvents）＝出発の説明・1回だけ・条件・優先度', () => {
  const w = load(), S = setup(w, 9), m = S.m, WD = w.MMWD, d = w.MMRF_DATA, flags = {};
  const first = (tr, ctx = {}) => (WD.storyEvents(m, tr, { flags, ...ctx })[0] || {}).id || null;
  // 出発：このセーブで1回の説明（40ターン・1〜6）→ 見たら次は ch1_start（この Chapter で1回）→ どちらも見たら出ない
  assert.equal(first('start'), 'tut_turns_w');
  const tx = WD.STORY.find((e) => e.id === 'tut_turns_w').lines.map((l) => l.text).join('');
  assert.match(tx, /40ターン/); assert.match(tx, /1〜6/); assert.doesNotMatch(tx, /45ターン|30ターン/);
  WD.markStory(m, 'tut_turns_w', flags); assert.deepEqual(flags.story, ['tut_turns_w']);
  assert.equal(first('start'), 'ch1_start');
  WD.markStory(m, 'ch1_start', flags); assert.deepEqual(m.raise.field.storySeen, ['ch1_start']);
  assert.equal(first('start'), null);
  // flags を渡さない古い呼び方では、このセーブで1回のものは出さない（二度出さないため）
  assert.equal((WD.storyEvents(m, 'land', { fx: { kind: 'stat' } })[0] || {}).id, undefined);
  // 止まった地点の結果
  assert.equal(first('land', { fx: { kind: 'stat', key: 'po', amount: 18 } }), 'tut_stat');
  assert.equal(first('land', { fx: { kind: 'event', recovery: true } }), 'tut_rest');
  assert.equal(first('land', { fx: { kind: 'event', recovery: false } }), 'tut_event');
  assert.equal(first('land', { fx: { kind: 'battle', battleType: 'rival' } }), 'tut_rival');
  assert.equal(first('land', { fx: { kind: 'battle', battleType: 'rare' } }), 'ch1_first_rare');
  assert.equal(first('land', { fx: { kind: 'reward' } }), 'tut_reward_w');
  assert.equal(first('land', { fx: { kind: 'none' }, goal: true }), 'tut_goal');
  // 分かれ道：最初は分かれ道の説明 → 寄り道がある分かれ道では寄り道の説明 → 封印の遺跡門
  assert.equal(first('branch', { segs: ['EL01', 'ER01'] }), 'tut_branch'); WD.markStory(m, 'tut_branch', flags);
  assert.equal(first('branch', { segs: ['EL01', 'ER01'] }), null);
  assert.equal(first('branch', { segs: ['EL03', 'D_LC'] }), 'tut_spur_w');
  assert.equal(first('branch', { segs: ['LATE_SAFE', 'LATE_L1', 'LATE_R1'] }), 'tut_challenge_w');
  assert.equal(first('die', { dice: [{ kind: 'Q', die: 3 }] }), 'tut_qdie_w');
  assert.equal(first('die', { dice: [{ kind: 'CHALLENGE', die: 5 }] }), null);
  // 通った区間（pass）：区間の途中の地点で判定・ライバルの手前の一言はライバルに止まったときは出さない
  m.raise.node = d.segments.ER01[3][3];
  assert.equal(first('land', { fx: { kind: 'none', note: 'normal' }, path: [d.segments.ER01[3][2]] }), 'w_right');
  m.raise.node = 'RIVAL';
  assert.notEqual(first('land', { fx: { kind: 'none' }, path: ['C04_01', 'C04_02'] }), 'w_rival_before');
  m.raise.node = 'C04_02'; assert.equal(first('land', { fx: { kind: 'none' }, path: ['UPPER_GATE', 'C04_01'] }), 'w_rival_before');
  // データの検査：id は重ならない・pass に書いた地点／区間は原本にある・条件の名前は既知
  const ids = WD.STORY.map((e) => e.id); assert.equal(new Set(ids).size, ids.length);
  for (const e of WD.STORY) for (const x of (e.when && e.when.pass) || []) assert.ok(d.nodes[x] || d.segments[x], `${e.id} の pass ${x} は原本にある`);
  assert.equal(WD.segOf(d.segments.EL01[3][1]), 'EL01'); assert.equal(WD.segOf('J0'), null);
});
