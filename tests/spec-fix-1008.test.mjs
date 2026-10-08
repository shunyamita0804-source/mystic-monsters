// =========================================================
// 2026-10-08 監査後の仕様確定差分（8項目）
//  SF-01 S ランクへの正式導線：Chapter 4 で A ランク大会に優勝 → 同じ個体のまま最終公式大会（S＝8体7試合）→ 完走
//  SF-02 LEGEND の解禁：S の「優勝」でイベント待ち → イベントのあと解禁。S に参加しただけでは解禁しない。旧 chapter5 は読み替え
//  SF-03 疲れ：Chapter をまたぐと max(0, 疲れ−50)（大会のあとも0にしない）
//  SF-04 能力マスの成長量：全 Chapter 共通の GROWTH_GAIN（A25 B21 C18 D14 E11）。育成を最後まで終えた適性 A が 100→250 前後
//  SF-05 同じ能力・同じ向き・同じ強さのバフ／デバフの掛け直しは、スタックせずに残りターンを更新
//  SF-06 大会で降参した試合の残りライフ% は 0
//  SF-07 素早さ：高い方が必ず先攻・同じ値だけ 50%／50%
//  SF-08 E・D は最初から解放＝E→D の昇格なし。昇格は D→C・C→B・B→A・A→S
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import { loadEngine, lcg } from './chapter-sim.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const HTML = rd('index.html');

const mon = (w, sp = 0) => ({ sp, name: 'テスト', age: 0, span: 30, h: 0, rk: 0, fa: 0, st: 0, last: null, ...w.MMP10M.baseOf(sp), sk: [0, 1, 2, 3], eq: [0, 1, 2, 3, -1, -1] });
/** Chapter key のゴール（大会の受付）にいる個体。cleared＝クリア済みのランク（番号の配列） */
function atGoal(E, key, cleared = []) {
  const { P7, P8, w } = E; const S = P8.newSave(); S.m = P8.initIndividual(S, mon(w)); P7.ensureProg(S.m); const m = S.m;
  for (const r of cleared) m.prog.rankClr[r] = true;
  if (key > 1) Object.assign(m.raise, { state: 'farm', ch: key, log: Array.from({ length: key - 1 }, (_, i) => ({ ch: i + 1, reachedGoal: true })) });
  assert.equal(P8.depart(S, m, lcg(5)).ok, true);
  Object.assign(m.raise, { node: P8.boardOf(m).goal, goal: true, pend: null });
  return { S, m };
}
/** 大会を全試合行う（win＝勝つか）。戻り値＝決着の結果 */
function playTour(P8, S, m, win) {
  let n = 0;
  while (m.raise.tour.status === 'league') {
    const rk = m.raise.tour.rank; assert.equal(P8.beginBattle(S, m, { kind: 'league', rank: rk }).ok, true);
    if (win) S.wins = (S.wins || 0) + 1;   // fight() の勝敗（finishBattle は S.wins の差で判定）
    P8.markBattleDone(S); P8.finishBattle(S, m, lcg(9)); n++;
  }
  return { n, res: m.raise.tour.result };
}

test('SF-01：S ランクへの正式導線＝Chapter 4 で A に優勝 → 同じ個体のまま最終公式大会（S・8体7試合）→ 完走。Chapter 5 は作らない', () => {
  const E = loadEngine(), { P8 } = E;
  const { S, m } = atGoal(E, 4, [0, 1, 2, 3]);
  assert.deepEqual(P8.eligibleRanks(m, 4), [0, 1, 2, 3, 4], 'Chapter 4（B クリア済み）で選べるのは A まで（S はまだ）');
  assert.equal(P8.canStartFinalTournament(S, m).ok, false, 'A に優勝する前は最終公式大会に入れない');
  assert.equal(P8.startTournament(S, m, 4, 123).ok, true);
  const a = playTour(P8, S, m, true); assert.equal(a.res.won, true); assert.equal(a.res.rank, 4);
  assert.equal(a.res.reward.rankUp.to, 5, 'A 優勝 → S 解放');
  const uid = m.uid;
  assert.deepEqual(P8.canStartFinalTournament(S, m), { ok: true, rank: 5 });
  assert.equal(P8.startFinalTournament(S, m, 456).ok, true);
  const t = m.raise.tour; assert.equal(t.rank, 5); assert.equal(t.final, true); assert.equal(m.uid, uid, '同じ個体');
  assert.equal(t.league.entrants.length, 8, 'S＝8体'); assert.deepEqual(t.prev, { rank: 4, place: 1, won: true, firstClear: true });
  assert.equal(P8.canStartFinalTournament(S, m).ok, false, '最終公式大会は1回だけ');
  const s = playTour(P8, S, m, true); assert.equal(s.n, 7, 'プレイヤーは7試合'); assert.equal(s.res.won, true); assert.equal(s.res.reward.firstClear, true);
  assert.equal(m.prog.rankClr[5], true, 'S クリア'); assert.equal(s.res.reward.prize, 1200); assert.equal(s.res.reward.rankUp, null, 'S の上の通常ランクは無い');
  const e = P8.endChapter(S, m); assert.equal(e.ok, true);
  assert.equal(e.entry.tour.rank, 4, 'Chapter の記録：通常の大会（A）'); assert.equal(e.entry.finalTour.rank, 5, '最終公式大会（S）');
  assert.deepEqual([m.raise.state, m.raise.ch], ['farm', 'final'], 'そのあとは従来どおり（A 以上クリア → 最終ルートの前のベースキャンプ）');
  assert.equal(P8.LAST_NORMAL_CHAPTER, 4); assert.ok(!P8.CHAPTER_RULES[5], 'Chapter 5 は無い');
});

test('SF-01b：最終公式大会に入れないとき（Chapter 3・A に負けた・A 以外の大会・辞退）。S に負けても通常どおり Chapter が終わる', () => {
  const E = loadEngine(), { P8 } = E;
  { const { S, m } = atGoal(E, 3, [0, 1, 2]); P8.startTournament(S, m, 3, 1); playTour(P8, S, m, true); assert.equal(P8.canStartFinalTournament(S, m).reason, 'not_final_chapter'); }
  { const { S, m } = atGoal(E, 4, [0, 1, 2, 3]); P8.startTournament(S, m, 4, 1); playTour(P8, S, m, false); assert.equal(P8.canStartFinalTournament(S, m).reason, 'no_a_victory'); }
  { const { S, m } = atGoal(E, 4, [0, 1, 2, 3]); P8.startTournament(S, m, 3, 1); playTour(P8, S, m, true); assert.equal(P8.canStartFinalTournament(S, m).reason, 'no_a_victory', 'B の再優勝では入れない'); }
  { const { S, m } = atGoal(E, 4, [0, 1, 2, 3]); P8.startTournament(S, m, 4, 1); playTour(P8, S, m, true); P8.startFinalTournament(S, m, 2);
    const s = playTour(P8, S, m, false); assert.equal(s.res.won, false); assert.equal(m.prog.rankClr[5], false);
    assert.equal(P8.legendStage(S), 0, 'S に参加しただけ（優勝なし）では解禁しない'); assert.equal(P8.endChapter(S, m).ok, true); }
  // 画面：結果の画面に「最終公式大会へ挑戦する」（挑戦できるときだけ）
  const fn = HTML.match(/function p9TourResult\(msg\)\{[\s\S]*?\nconst P9_SE_SEEN/)[0];
  assert.match(fn, /MMP8\.canStartFinalTournament\(S,m\)\.ok\?`<button class="p9btn p9final" onclick="p9FinalTour\(this\)">最終公式大会へ挑戦する/);
  const ft = HTML.slice(HTML.indexOf('function p9FinalTour(b){'), HTML.indexOf('function p9FinalSkip(){'));
  assert.match(ft, /MMP8\.startFinalTournament\(S,m\);if\(!r\.ok\)return board\(\);save\(\);p9TourOpen\(r\.rank\)/);
});

test('SF-02：LEGEND（三伝説への挑戦）の解禁＝S の「優勝」→ イベント → 解禁。旧 chapter5 は読み替え。本戦・昇格・エンディングは作らない', () => {
  const E = loadEngine(), { P8 } = E;
  const { S, m } = atGoal(E, 4, [0, 1, 2, 3]);
  P8.startTournament(S, m, 4, 7); playTour(P8, S, m, true); P8.startFinalTournament(S, m, 8);
  assert.equal(P8.legendStage(S), 0, 'S に到達・参加しただけでは解禁しない');
  const s = playTour(P8, S, m, true);
  assert.equal(s.res.reward.legend, true); assert.equal(P8.legendStage(S), P8.LEGEND_PENDING, 'S 優勝 → イベント待ち'); assert.equal(P8.legendUnlocked(S), false);
  assert.equal(P8.legendChallengeOpen(m), true, 'その個体は S 優勝済み');
  assert.ok(P8.tourEndSteps(s.res).map((d) => d.step).includes('legendUnlock'), '大会の終わりにイベントの段階');
  assert.equal(P8.completeLegendUnlock(S), true); assert.equal(P8.legendUnlocked(S), true); assert.equal(S.npcFlags.legend, P8.LEGEND_OPEN);
  assert.equal(P8.completeLegendUnlock(S), false, '2回目は何もしない');
  // 旧セーブ：S.npcFlags.chapter5（旧 S 優勝のフラグ）→ イベント待ちとして読み替え
  const old = { npcFlags: { chapter5: 1 } }; assert.equal(P8.legendStage(old), P8.LEGEND_PENDING); assert.equal(P8.completeLegendUnlock(old), true); assert.equal(P8.legendStage(old), P8.LEGEND_OPEN);
  assert.equal(P8.legendStage({}), 0); assert.equal(P8.legendStage({ npcFlags: {} }), 0);
  // 画面：イベント＝最小限のシステム通知（本格的な演出・台詞は後工程）。旧「Chapter 5 は準備中」なし
  assert.match(HTML, /function legendEvent\(\)\{if\(!window\.MMP8\|\|MMP8\.legendStage\(S\)!==MMP8\.LEGEND_PENDING\|\|TEST_TOUR\)return false;/);
  assert.match(HTML, /title:"三伝説への挑戦が解禁された！"/);
  assert.doesNotMatch(HTML, /Chapter 5 は準備中/);
  assert.doesNotMatch(HTML, /finaFlags\(\)\.chapter5=1/, '旧 chapter5 フラグを新しく立てない');
  assert.doesNotMatch(HTML + rd('js/phase8/raising.js'), /legendBattle|astradBattle|function legendScr/, '三伝説との本戦・画面は作らない');
});

test('SF-03：疲れ＝Chapter をまたぐと max(0, 疲れ−50)。大会のあとも 0 にしない（ロジックは従来どおり）', () => {
  const E = loadEngine(), { P8 } = E;
  for (const [f, want] of [[80, 30], [45, 0], [100, 50]]) {
    const { S, m } = atGoal(E, 1); m.raise.fatigue = f;
    P8.startTournament(S, m, 0, 3); playTour(P8, S, m, true);
    assert.equal(m.raise.fatigue, f, '大会の試合では疲れは増えない・大会のあとも0にしない');
    P8.endChapter(S, m); assert.equal(m.raise.fatigue, f, 'Chapter の終わりでも変えない');
    P8.depart(S, m, lcg(1)); assert.equal(m.raise.fatigue, want, `次の Chapter の開始＝max(0, ${f}−50)`);
  }
});

test('SF-04：能力マスの成長量＝全 Chapter 共通の1つの表（A25 B21 C18 D14 E11）。育成を最後まで終えた適性 A の伸びは +150 前後（100→250 前後）', () => {
  const E = loadEngine(), { P7, P8, CH, w } = E, M = w.MMP10M;
  assert.deepEqual({ ...M.GROWTH_GAIN }, { A: 25, B: 21, C: 18, D: 14, E: 11 });
  assert.equal(CH.rulesOf(CH.getConfig(1)).growthGain, undefined, 'Chapter 1 だけの表は無い'); assert.equal(CH.rulesOf(CH.getConfig(2)).growthGain, undefined);
  // 1体を最後まで（Chapter 1〜4 の大会に優勝・S の最終公式大会まで）。ジオル（ちから・丈夫さ＝A）
  const K = ['li', 'po', 'in', 'hi', 'ev', 'de'], gainsA = [], gainsE = [];
  const play = (S, m, rnd) => { for (let g = 0; g < 5000; g++) { const ph = P8.boardPhase(m);
    if (['goal', 'timeup', 'tour', 'tour_done'].includes(ph)) return ph;
    if (ph === 'roll') { if (P8.canRoll(m) && !(CH.fatigue(m) >= 86)) P8.roll(S, m, rnd); else if (P8.canRest(m)) P8.rest(S, m); else P8.roll(S, m, rnd); continue; }
    if (ph === 'move') { P8.step(S, m); continue; }
    if (ph === 'branch') { const o = m.raise.pend.opts; P8.chooseBranch(S, m, o[Math.floor(rnd() * o.length)]); continue; }
    if (ph === 'resolve') { let r = P8.resolveLanding(S, m, rnd); if (r.fx && r.fx.kind === 'choice') r = P8.resolveChoice(S, m, r.fx.options[0].id, rnd); continue; }
    if (ph === 'battle') { P8.beginBattle(S, m, { kind: 'practice', rank: 0 }); P8.markBattleDone(S); P8.finishBattle(S, m, rnd); continue; } } throw new Error('guard'); };
  for (let i = 0; i < 300; i++) {
    const rnd = lcg(4000 + i * 977), S = P8.newSave(); S.m = P8.initIndividual(S, mon(w, 3)); P7.ensureProg(S.m); const m = S.m, b = Object.fromEntries(K.map((k) => [k, m[k]]));
    for (let g = 0; g < 30; g++) { const st = m.raise.state;
      if (st === 'none' || st === 'farm') { if (!P8.canDepart(S, m).ok) { P8.finishWithoutFinal(S, m); break; } P8.depart(S, m, rnd); continue; }
      if (st !== 'board') break;
      if (play(S, m, rnd) === 'goal') { const el = P8.eligibleRanks(m, m.raise.ch); P8.startTournament(S, m, el[el.length - 1], 11); playTour(P8, S, m, true);
        if (P8.canStartFinalTournament(S, m).ok) { P8.startFinalTournament(S, m, 12); playTour(P8, S, m, true); } }
      if (P8.endChapter(S, m).next === 'done') break; }
    if (!m.prog.rankClr[5]) continue;   // 最後まで（S まで）育てた回だけ
    gainsA.push((m.po - b.po + m.de - b.de) / 2); gainsE.push((m.in - b.in + m.ev - b.ev) / 2);
  }
  const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  assert.ok(gainsA.length >= 150, `最後まで育てた回が十分ある（${gainsA.length}）`);
  assert.ok(avg(gainsA) >= 125 && avg(gainsA) <= 175, `適性 A の伸び ${avg(gainsA).toFixed(1)}（目安 +150）`);
  assert.ok(avg(gainsE) < avg(gainsA) - 40, `適性 E は A より伸びない（E ${avg(gainsE).toFixed(1)}）`);
});

// ---- バトル（rules.js。Phase 6 は読むだけ） ----
function loadBattle() {
  const sk = HTML.match(/const SK=(\[.*?\]);/s)[1], eff = HTML.match(/const EFF=(\{.*?\});/s)[1];
  const sp = HTML.match(/const SP=(\[.*?\]\]);/s)[1], djp = HTML.match(/DJP=(\[\{.*?\}\]);/s)[1];
  const ctx = vm.createContext({ console, setTimeout: () => 0, clearTimeout: () => {}, Math });   // 演出のタイマー（画面への表示）は動かさない
  ctx.window = ctx; const w = {}; new Function('window', rd('js/phase10/monsters.js'))(w); ctx.MMP10M = w.MMP10M;
  vm.runInContext(rd('js/battle-bridge.js') + '\n' + rd('js/integration/adapter.js'), ctx);
  vm.runInContext(`var SK=${sk};var EFF=${eff};var SP=${sp};var DJP=${djp};var SKART=new Array(20).fill(0).map((_,i)=>"art"+i);var SFR={};for(let i=0;i<20;i++)SFR[i]={f:[],id:i};var SKM=new Array(20).fill(0).map((_,i)=>["m"+i]);var BPL=null;var S=null;var ban=function(){};`, ctx);
  const base = ctx.MMBattle;
  vm.runInContext(rd('js/battle/official-moves.js'), ctx); vm.runInContext('MMMOVES.install()', ctx);
  vm.runInContext(rd('js/battle/rules.js'), ctx); assert.equal(vm.runInContext('MMRULES.install()', ctx), true);
  return { ctx, R: ctx.MMRULES, B: base, AD: ctx.MMAdapter, SK: ctx.SK, EFF: ctx.EFF };
}
const J = (x) => JSON.parse(JSON.stringify(x));   // vm の中で作った値（別の realm）を比べられる形に
const unit = (name, sp, v = {}) => ({ name, sp, li: v.li ?? 300, po: 100, in: 100, hi: 100, ev: 100, de: 100, eq: [] });

test('SF-05：同じ能力・同じ向き・同じ強さのバフ／デバフを次のラウンドに掛け直すと、スタックせずに残りターンを正式値へ更新（強い方で上書き・弱いのは上書きしない・上げと下げは別、は従来どおり）', () => {
  const E = loadBattle();
  const a = unit('ガウル', 1), b = unit('ソラモ', 0, { li: 999 }), pl = [a, b];
  const sess = E.B.createBattleSession({ unitA: E.AD.legacyUnitToIndividualLike(a, 'p'), unitB: E.AD.legacyUnitToIndividualLike(b, 'e'), battleType: 'official', rng: () => 0.5 });
  const bs = { A: E.AD.legacyUnitToStats(a), B: E.AD.legacyUnitToStats(b) };
  const mv = (k) => E.AD.moveFromLegacySK(E.SK[k], E.EFF[k], { id: 'sk' + k, powerScale: 100 });
  const FIX = { hitRng: () => 0, damageRng: () => 0.5, criticalRng: () => 0.99 };
  const act = (k) => E.R.resolveWith((o) => E.B.resolveAction(o), { session: sess, baseStats: bs, attackerSide: 'A', move: mv(k), rng: FIX }, pl, () => 0.99);
  const endRound = () => { E.B.advanceEffectsForSession(sess, 'A'); E.B.advanceEffectsForSession(sess, 'B'); sess.turn += 1; };
  const ev = () => J(sess.buffs.A.filter((e) => e.category === 'evasion'));
  // ソニックムーブ（13）＝命中・回避 小UP 2ターン
  act(13); assert.deepEqual(ev().map((e) => [e.remainingTurns, e.appliedTurn]), [[2, 1]]); endRound();   // ラウンド1：付与したラウンドは減らない
  act(13); assert.deepEqual(ev().map((e) => [e.remainingTurns, e.appliedTurn]), [[2, 2]], 'ラウンド2の掛け直し → 残り2へ更新（スタックしない）'); endRound();
  assert.deepEqual(ev().map((e) => e.remainingTurns), [2], 'ラウンド2で付け直したので、ラウンド2の終わりでは減らない'); endRound();
  assert.deepEqual(ev().map((e) => e.remainingTurns), [1], 'ラウンド3の終わりで1'); endRound();
  assert.deepEqual(ev(), [], 'ラウンド4の終わりで切れる（更新しなければラウンド3の終わりで切れていた）');
  assert.equal(sess.buffs.A.filter((e) => e.category === 'evasion').length, 0);
  // 強い方・弱い方は従来どおり（refreshSameEffects は同じ強さだけ）
  const s2 = { buffs: { A: [E.B.createEffect({ category: 'attack', direction: 'up', size: 'medium', remainingTurns: 1, appliedTurn: 1 })] }, debuffs: { A: [] } };
  const weak = E.B.createEffect({ category: 'attack', direction: 'up', size: 'small', remainingTurns: 3, appliedTurn: 2 });
  E.R.refreshSameEffects(s2, { effectsApplied: [{ target: 'A', effect: weak }] }); assert.equal(s2.buffs.A[0].size, 'medium', '弱いのは強いのを上書きしない');
  const same = E.B.createEffect({ category: 'attack', direction: 'up', size: 'medium', remainingTurns: 2, appliedTurn: 2 });
  E.R.refreshSameEffects(s2, { effectsApplied: [{ target: 'A', effect: same }] }); assert.deepEqual([s2.buffs.A.length, s2.buffs.A[0].remainingTurns, s2.buffs.A[0].appliedTurn], [1, 2, 2], '同じ強さは残りを更新・1つのまま');
  assert.equal(E.B.applyEffect === undefined ? true : typeof E.B.applyEffect, 'function', 'battle-bridge（Phase 6）はそのまま');
});

test('SF-06：大会で降参した試合の残りライフ% は 0（行動のあと・行動する前のどちらでも）。与えたダメージ・命中回数は実際の値', () => {
  const E = loadBattle(), { ctx } = E;
  const a = unit('ソラモ', 0), b = unit('ガウル', 1), pl = [a, b]; ctx.BPL = pl;
  assert.equal(E.R.battleStats(), null, '降参していない・行動の記録も無い');
  ctx.ban('降参'); assert.equal(E.R.surrendered(), true);
  assert.deepEqual(J(E.R.battleStats()), { me: { life: 0, dmg: 0, hits: 0 }, opp: { life: 100, dmg: 0, hits: 0 }, surrendered: true }, '最初のルーレットの前の降参');
  // 行動のあとの降参
  const pl2 = [unit('ソラモ', 0), unit('ガウル', 1)]; ctx.BPL = pl2;
  const sess = ctx.MMBattle.createBattleSession({ unitA: E.AD.legacyUnitToIndividualLike(pl2[0], 'p'), unitB: E.AD.legacyUnitToIndividualLike(pl2[1], 'e'), battleType: 'official' });
  const bs = { A: E.AD.legacyUnitToStats(pl2[0]), B: E.AD.legacyUnitToStats(pl2[1]) };
  ctx.MMBattle.resolveAction({ session: sess, baseStats: bs, attackerSide: 'A', move: E.AD.moveFromLegacySK(E.SK[0], E.EFF[0], { id: 'sk0', powerScale: 100 }), rng: { hitRng: () => 0, damageRng: () => 0.5, criticalRng: () => 0.99 } });
  const before = E.R.battleStats(); assert.ok(before.me.life > 0 && before.me.dmg > 0 && before.me.hits === 1);
  ctx.ban('降参'); const st = E.R.battleStats();
  assert.deepEqual([st.me.life, st.me.dmg, st.me.hits, st.surrendered], [0, before.me.dmg, 1, true], '残りライフ% だけ 0');
  // 降参していない次のバトルには持ち越さない
  ctx.BPL = [unit('ソラモ', 0), unit('ガウル', 1)]; assert.equal(E.R.surrendered(), false);
  // index.html：after() はこの値を大会の試合の記録に使う（league.recordPlayerResult）
  assert.match(HTML, /const bs=MMRULES\.battleStats\(\);if\(bs\)m\.raise\.battle\.stats=bs/);
});

test('SF-07：素早さ＝高い方が必ず先攻・同じ値だけ 50%／50%（野生・ライバル・大会で同じ。Phase 6 は変えず外側で正式の素早さを渡す）', () => {
  const E = loadBattle(), { ctx } = E;
  const mk = (sp, uid) => ({ uid, speciesId: sp, nickname: 'x', stats: { life: 100, power: 100, wisdom: 100, hit: 100, evasion: 100, toughness: 100 } });
  const first = (a, b, n = 200) => { const seen = new Set(); for (let i = 0; i < n; i++) seen.add(ctx.MMBattle.createBattleSession({ unitA: a, unitB: b, battleType: 'official' }).firstActor); return [...seen].sort().join(''); };
  assert.equal(first(mk(1, 'p'), mk(0, 'e')), 'A', 'ガウル 7 vs ソラモ 5 → 必ずガウル');
  assert.equal(first(mk(0, 'p'), mk(1, 'e')), 'B', 'ソラモ 5 vs ガウル 7 → ソラモは先攻にならない');
  assert.equal(first(mk(0, 'p'), mk(0, 'e')), 'AB', '同じ 5 同士 → どちらも先攻になりうる');
  assert.equal(first(mk(1, 'p'), mk(4, 'e')), 'B', 'ライバル：レグナス 8 vs ガウル 7 → レグナス');
  assert.equal(first(mk(3, 'p'), mk(0, 'e')), 'B', 'ジオル 1 vs ソラモ 5');
  // プレイヤーの個体の speed（S.m）を使う（fight() の写しは素早さ分離処理で speed を外してある）
  ctx.S = { m: { uid: 'u1', sp: 0, speed: 9 } };
  assert.equal(first(mk(0, 'u1'), mk(1, 'e')), 'A', '個体の speed 9 vs ガウル 7');
  assert.equal(E.R.speedOfUnit({ speciesId: 2 }), 2, 'ノビトン 2'); assert.equal(E.R.speedOfUnit({ speciesId: 99 }), null);
  assert.equal(E.B.determineFirstActor(8, 5, () => 0.99), 'B', 'battle-bridge（Phase 6）の確率の表はそのまま（外側で必ず速い側にする）');
  assert.match(HTML, /function p10LegacyBattle\(m,run\)\{const had=/, '素早さ分離処理（Phase 6 保護対象）は変えない');
});

test('SF-08：E・D は最初から解放＝E の優勝で昇格しない・D の優勝で C 解放（E→D の B1〜B7 は流さない）。C→B・B→A・A→S', () => {
  const E = loadEngine(), { P8 } = E;
  const one = (key, cleared, rank) => { const { S, m } = atGoal(E, key, cleared); assert.equal(P8.startTournament(S, m, rank, 3).ok, true); return { m, res: playTour(P8, S, m, true).res }; };
  { const { S, m } = atGoal(E, 1); assert.deepEqual(P8.eligibleRanks(m, 1), [0, 1], '最初から E・D'); }
  { const { m, res } = one(1, [], 0); assert.equal(res.reward.rankUp, null, 'E 優勝 → 昇格なし'); assert.deepEqual(P8.eligibleRanks(m, 2), [0, 1]); }
  { const { m, res } = one(1, [], 1); assert.deepEqual(res.reward.rankUp, { from: 1, to: 2, unlocked: 2 }, 'D 優勝 → C 解放（E→D ではない）'); assert.deepEqual(P8.eligibleRanks(m, 2), [0, 1, 2]); }
  { const { res } = one(2, [0, 1], 2); assert.equal(res.reward.rankUp.to, 3, 'C → B'); }
  { const { res } = one(3, [0, 1, 2], 3); assert.equal(res.reward.rankUp.to, 4, 'B → A'); }
  { const { res } = one(4, [0, 1, 2, 3], 4); assert.equal(res.reward.rankUp.to, 5, 'A → S'); }
  { const { res } = one(2, [0, 1, 2], 1); assert.equal(res.reward.rankUp, null, '再優勝は昇格なし'); }
  { const { res } = one(1, [0], 1); assert.deepEqual(res.reward.rankUp, { from: 1, to: 2, unlocked: 2 }, 'E クリア済みでも D 優勝で C'); }
  // 合体の子（旧フィールド rk を継いでいても）D の初回優勝で C 解放
  { const { S, m } = atGoal(E, 1); m.rk = 3; P8.startTournament(S, m, 1, 4); assert.equal(playTour(P8, S, m, true).res.reward.rankUp.to, 2); }
  assert.match(HTML, /\nconst RANK_UP_ART=\{\};/, 'D→C 以降の正式カットは未着＝演出なし');
});
