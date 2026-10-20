// =========================================================
// 2026-10-20 通し試遊の品質改善：育成全体（Chapter 1〜4。本編の1枚の世界のボード＝MMWD・MMWD2・MMWD3・MMWD4）の能力の伸びのシミュレーション（テストではない道具）
//  本物の進行（MMP8＋各 Chapter の driver・マスの配置 MMRF_PLAY.layout・成長量 GROWTH_GAIN_BY_CH・固定報酬・出来事・大会の初回優勝ボーナス・特訓）を node の中で回す。
//  方針（policy）：
//    random  ＝分かれ道は乱数・寄り道は 25%（ふつうの進行）
//    focus   ＝分かれ道は「伸ばしたい能力（その子の得意＝適性が最も高い能力）」の道（道の偏り statLanes）を選ぶ・寄り道 25%（能力重視の道）
//    explore ＝寄り道は 75%（探索重視・寄り道多め）
//  食事：空腹 80 以上でジャガイモを1個（tests/chapter-sim.mjs の eatIfHungry と同じ方針。ゲームは自動では食べない＝プレイヤーがアイテムで食べさせる想定）・空腹 100 で休む（正式）。careful＝空腹 86 で休む（参考）。出発の前にジャガイモを買い足す（restock）
//  バトル：ボードの野生・レア・ライバルは勝ち負けで能力が変わらない（疲れ +5 だけ）＝練習試合として終える。大会：選べる最高ランクに出て全勝（上限の目安）・Chapter 4 の後の最終大会 S は数えない
//  特訓：初回優勝のチケットで、Chapter の間に得意の能力の特訓（本物の MMP7 の特訓。出目は乱数）
//  A 検証体：ソラモの初期値（全 100）・成長適性を「ちから A・ほか C」にした個体（m.growth＝個体ごとの適性。ゲームの表は変えない）＝「初期 100 前後の適性 A の能力」の伸びを本物の進行で測る
//  使い方：node tools/fullplay1020/sim-growth.mjs [回数=2000] [JSON の上書き＝MM_BALANCE_OVERRIDE（gainByCh・density など）]
//    環境変数：POLICIES（random,focus,explore,careful）・MONS（0,1,2,3,A,flurene,razuck,kalshell）・SEED0・FOOD（eat80＝空腹 80 以上で食べる理想のプレイヤー／none＝食べない＝休むだけ）
//  2026-10-20 追加指示（集計の定義の見直し）：各 Chapter を「入った（E）・GOAL に着いた（G）・大会で優勝（T）・次の Chapter が解放された（U）」の別の出来事として数える。
//    E＝その Chapter へ出発した・G＝boardPhase が goal（40 ターン以内に GOAL）・T＝大会の結果 won（G のときだけ大会に出る）・U＝Chapter を閉じた後に次の Chapter へ出発できる（MMP8.canDepart＝ランクの条件 CHAPTER_RANK_GATE）。
//    Chapter 4 は U の代わりに F＝最終 Chapter の解放（Chapter 4 の終わりで A 以上をクリア済み）。「1〜4 を通して遊べた」＝Chapter 4 の G（GOAL に着いた）。
//    旧版（2026-10-20 full1 の REPORT）の completed4 は「Chapter 4 に入った」割合（E4）だった＝ラベルの誤り
//  pending の種族（flurene・razuck・kalshell）は未解禁＝市場で選べない。正式の能力と適性で個体を作る参考値（sp 0 の個体に base と m.growth を写す）
// =========================================================
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const FILES = ['js/phase7/progression.js', 'js/phase8/league.js', 'js/phase8/raising.js', 'js/phase10/monsters.js', 'js/phase9/chapters.js', 'js/chapter/engine.js', 'js/chapter/configs/ch1a.js', 'js/chapter/configs/ch2a.js',
  'js/proto/roadfirst-data.js', 'js/proto/roadfirst-routes.js', 'js/proto/ch3-routes.js', 'js/proto/roadfirst-core.js', 'js/proto/roadfirst-play.js', 'js/proto/ch2-routes.js', 'js/chapter/world-driver.js',
  'js/chapter/event-themes.js', 'js/chapter/world-driver-ch2.js', 'js/chapter/world-driver-ch3.js', 'js/proto/ch4-routes.js', 'js/chapter/world-driver-ch4.js', 'js/items/food.js'];
const N = +(process.argv[2] || 2000), OVER = process.argv[3] ? JSON.parse(process.argv[3]) : null, SEED0 = +(process.env.SEED0 || 0);
const POLICIES = (process.env.POLICIES || 'random,focus,explore,careful').split(',');
const MONS = (process.env.MONS || '0,1,2,3,A').split(',');
const FOOD = process.env.FOOD || 'eat80';
const K = ['li', 'po', 'in', 'hi', 'ev', 'de'], ORDER = ['A', 'B', 'C', 'D', 'E'];
const lcg = (seed) => { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };
const SRC = Object.fromEntries(FILES.map((f) => [f, rd(f)]));
function load() {
  const w = {}; if (OVER) w.MM_BALANCE_OVERRIDE = OVER;
  for (const f of FILES) new Function('window', 'module', SRC[f])(w, undefined);
  for (const c of w.MMP9C.CHAPTERS) w.MMP7.registerChapterBoard(c.no, c.track, { provisional: false });
  w.MMFOOD.install(w.MMP7, w.MMCH);
  return w;
}
const w = load(), P7 = w.MMP7, P8 = w.MMP8, CH = w.MMCH, M = w.MMP10M, PLAY = w.MMRF_PLAY;
const WD = (ch) => (ch === 4 ? w.MMWD4 : ch === 3 ? w.MMWD3 : ch === 2 ? w.MMWD2 : w.MMWD);
const lanesOf = (D) => D.statLanes || PLAY.TUNING.statBias.lanes;
function eat(S, m) { if (FOOD === 'none' || CH.fatigue(m) < 80 || !CH.itemUseState(m).ok) return 0; const bag = S.inv.bag; let best = -1, amt = 0; bag.forEach((it, i) => { const e = CH.fatigueItemEffect(it.id); if (e && (e.amount || 0) > amt) { best = i; amt = e.amount; } }); if (best < 0) return 0; const r = CH.useFatigueItem(S, m, best); return r && r.ok === false ? 0 : 1; }
const restock = (S) => { for (let k = 0; k < 60 && P7.bagRoomFor(S, 'potato') > 0; k++) { if (!P7.shopBuy(S, 'potato').ok) break; const vi = S.inv.vault.findIndex((it) => it.id === 'potato'); P7.moveVaultToBag(S, vi, 1); } };
function playTour(S, m) { while (m.raise.tour && m.raise.tour.status === 'league') { const rk = m.raise.tour.rank; P8.beginBattle(S, m, { kind: 'league', rank: rk }); S.wins = (S.wins || 0) + 1; P8.markBattleDone(S); P8.finishBattle(S, m, lcg(9)); } }
const snap = (m) => Object.fromEntries(K.map((k) => [k, m[k]]));
function bestKey(m) { return K.slice().sort((a, b) => ORDER.indexOf(M.growthOf(m, a)) - ORDER.indexOf(M.growthOf(m, b)) || (m[b] - m[a]))[0]; }
function train(S, m, k, rnd, src) {
  for (let g = 0; g < 8; g++) {
    if (!P7.canStartTraining(S, m, k).ok) return;
    const b = m[k]; P7.startTraining(S, m, k);
    for (let i = 0; i < 40 && m.raise.trainRun && m.raise.trainRun.pos < P7.TRAIN_LEN; i++) P7.advanceTraining(S, m, P7.DICE_MIN + Math.floor(rnd() * (P7.DICE_MAX - P7.DICE_MIN + 1)), rnd);
    P7.finishTraining(S, m, rnd); src.train += m[k] - b;
  }
}
function runOne(mon, policy, seed) {
  const rnd = lcg(seed), S = P8.newSave();
  const pend = /^\d+$/.test(mon) || mon === 'A' ? null : M.pendingSpecies(mon);
  const sp = mon === 'A' || pend ? 0 : +mon;
  S.m = P8.initIndividual(S, { sp, name: 'シム', age: 0, span: 30, h: 0, rk: 0, fa: 0, st: 0, last: null, ...(pend ? { ...pend.base } : M.baseOf(sp)), sk: [0, 1, 2, 3], eq: [0, 1, 2, 3, -1, -1] });
  const m = S.m; if (mon === 'A') m.growth = { li: 'C', po: 'A', in: 'C', hi: 'C', ev: 'C', de: 'C' }; else if (pend) m.growth = { ...pend.growth };
  P7.ensureProg(m); S.g = 500; P7.bagAdd(S, 'potato', 10);
  const tk = bestKey(m), base = snap(m), per = {};
  const restAt = policy === 'careful' ? 86 : 100, spurP = policy === 'explore' ? 0.75 : 0.25;
  for (let g = 0; g < 12; g++) {
    const st = m.raise.state;
    if (st === 'none' || st === 'farm') {
      if (m.raise.ch === 'final' || m.raise.ch == null && st === 'farm') break;
      if (!P8.canDepart(S, m).ok) break;
      restock(S); const r = P8.depart(S, m, rnd); if (!r.ok) break;
      continue;
    }
    if (st !== 'board') break;
    const cn = m.raise.ch; if (!(cn >= 1 && cn <= 4)) break;
    const W = WD(cn), D = W.dataOf(m), route = (m.raise.field && m.raise.field.route) || 'A';
    const row = { route, start: snap(m), src: { stat: Object.fromEntries(K.map((k) => [k, 0])), event: 0, reward: 0, tour: 0, train: 0 }, hits: Object.fromEntries(K.map((k) => [k, 0])), stops: {}, eat: 0, rests: 0, goal: false, turns: 0 };
    for (let i = 0; i < 8000; i++) {
      const ph = P8.boardPhase(m);
      if (['goal', 'timeup', 'tour', 'tour_done'].includes(ph)) break;
      if (ph === 'roll') { row.eat += eat(S, m); if (P8.canRoll(m) && CH.fatigue(m) < restAt) P8.roll(S, m, rnd); else if (P8.canRest(m)) { P8.rest(S, m); row.rests++; } else P8.roll(S, m, rnd); continue; }
      if (ph === 'move') { P8.step(S, m); continue; }
      if (ph === 'branch') {
        const bo = W.branchOptions(m), main = bo.filter((x) => !x.spur), spur = bo.filter((x) => x.spur);
        let pool = spur.length && rnd() < spurP ? spur : main.length ? main : bo;
        if (policy === 'focus' && pool === main) { const L = lanesOf(D), fav = main.filter((x) => (L[x.seg] || []).includes(tk)); if (fav.length) pool = fav; }
        P8.chooseBranch(S, m, pool[Math.floor(rnd() * pool.length)].id); continue;
      }
      if (ph === 'resolve') {
        const b = snap(m); let r = P8.resolveLanding(S, m, rnd);
        if (r.fx && r.fx.kind === 'choice') r = P8.resolveChoice(S, m, r.fx.options[Math.floor(rnd() * r.fx.options.length)].id, rnd);
        const fx = r.fx || {}, kind = fx.kind || 'none'; row.stops[kind] = (row.stops[kind] || 0) + 1;
        const d = K.reduce((a, k) => a + (m[k] - b[k]), 0);
        if (kind === 'stat') { row.src.stat[fx.key] += fx.amount; row.hits[fx.key]++; }
        else if (kind === 'reward') row.src.reward += m[tk] - b[tk];
        else if (kind === 'event') row.src.event += m[tk] - b[tk];
        void d; continue;
      }
      if (ph === 'battle') { P8.beginBattle(S, m, { kind: 'practice', rank: 0 }); P8.markBattleDone(S); P8.finishBattle(S, m, rnd); continue; }
    }
    row.goal = P8.boardPhase(m) === 'goal'; row.turns = m.raise.turnsUsed;
    if (row.goal) { const b = m[tk], el = P8.eligibleRanks(m, cn); row.tourRank = el[el.length - 1]; P8.startTournament(S, m, row.tourRank, 11); playTour(S, m); row.src.tour += m[tk] - b;
      const res = m.raise.tour && m.raise.tour.result; row.tourWon = !!(res && res.won); }
    row.end = snap(m);
    const e = P8.endChapter(S, m); per[cn] = row; row.next = e.next;
    if (cn === 4) { row.finalOpen = e.ok && e.next === 'final'; break; }
    if (!e.ok || e.next === 'done' || e.next === 'final') { if (e.ok && cn < 4) per.broke = true; break; }
    train(S, m, tk, rnd, row.src);   // 特訓は次の Chapter の前（この Chapter の「その他」に数える）
    row.endAfterTrain = snap(m);
    { const c = P8.canDepart(S, m); row.unlockNext = !!c.ok; row.gate = c.ok ? null : c.reason + (c.need != null ? `(need ${c.need} have ${c.have})` : ''); }
  }
  return { mon, policy, tk, base, per, entered4: !!per[4], goal4: !!(per[4] && per[4].goal) };
}
const q = (a, p) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1)))]; };
const avg = (a) => (a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : null);
const NAME = { 0: 'ソラモ', 1: 'ガウル', 2: 'ノビトン', 3: 'ジオル', A: 'A検証体（初期100・ちからA）', flurene: 'フルーネ（未解禁）', razuck: 'ラズック（未解禁）', kalshell: 'カルシェル（未解禁）' };
const out = {};
for (const mon of MONS) for (const pol of POLICIES) {
  const R = []; for (let i = 1; i <= N; i++) R.push(runOne(mon, pol, (i + SEED0) * 7919 + (mon === 'A' ? 99 : /^\d+$/.test(mon) ? +mon : 200 + [...mon].reduce((a, c) => a + c.charCodeAt(0), 0)) * 104729 + POLICIES.indexOf(pol) * 31));
  const tk = R[0].tk, F = R.filter((r) => r.goal4), F4 = R.filter((r) => r.entered4);
  const pend = /^\d+$/.test(mon) || mon === 'A' ? null : M.pendingSpecies(mon);
  const grade = M.growthOf(mon === 'A' ? { sp: 0, growth: { po: 'A' } } : pend ? { sp: 0, growth: pend.growth } : { sp: +mon }, tk);
  const pc = (k) => +(k / N * 100).toFixed(1);
  // 通し（funnel）：全 N 回を分母にした割合。cond＝その Chapter に入った個体を分母にした割合
  const funnel = {};
  for (const c of [1, 2, 3, 4]) {
    const xs = R.map((r) => r.per[c]).filter(Boolean), nE = xs.length, nG = xs.filter((x) => x.goal).length, nT = xs.filter((x) => x.tourWon).length;
    const nU = c < 4 ? xs.filter((x) => x.unlockNext).length : xs.filter((x) => x.finalOpen).length;
    funnel[c] = { entered: pc(nE), goal: pc(nG), tourWon: pc(nT), [c < 4 ? 'unlockNext' : 'finalOpen']: pc(nU), goalIfEntered: nE ? +(nG / nE * 100).toFixed(1) : null, turnsIfGoal: avg(xs.filter((x) => x.goal).map((x) => x.turns)) };
  }
  const row = { target: tk, grade, base: R[0].base[tk], runs: N, food: FOOD, entered4: pc(F4.length), goal4: pc(F.length), funnel, perCh: {}, final: null, finalIfEntered4: null };
  const fin = F.map((r) => (r.per[4].endAfterTrain || r.per[4].end)[tk]), fin4 = F4.map((r) => r.per[4].end[tk]);
  row.final = { p10: q(fin, 0.1), p50: q(fin, 0.5), p90: q(fin, 0.9), avg: avg(fin), max: fin.length ? Math.max(...fin) : null };   // Chapter 4 の GOAL に着いた個体の Chapter 4 終了時（大会の後）
  row.finalIfEntered4 = { p10: q(fin4, 0.1), p50: q(fin4, 0.5), p90: q(fin4, 0.9) };   // 参考：Chapter 4 に入った個体（GOAL に着かなかった個体を含む）
  for (const c of [1, 2, 3, 4]) {
    const rows = R.map((r) => r.per[c]).filter(Boolean);
    const byRoute = {};
    for (const rt of ['A', 'B', 'C', 'all']) {
      const xs = rows.filter((x) => rt === 'all' || x.route === rt); if (!xs.length) continue;
      const s0 = xs.map((x) => x.start[tk]), s1 = xs.map((x) => (x.endAfterTrain || x.end)[tk]), gain = xs.map((x) => (x.endAfterTrain || x.end)[tk] - x.start[tk]);
      byRoute[rt] = { n: xs.length, goal: +(xs.filter((x) => x.goal).length / xs.length * 100).toFixed(1), turns: avg(xs.map((x) => x.turns)),
        start: { p10: q(s0, 0.1), p50: q(s0, 0.5), p90: q(s0, 0.9) }, end: { p10: q(s1, 0.1), p50: q(s1, 0.5), p90: q(s1, 0.9) }, gain: { p10: q(gain, 0.1), p50: q(gain, 0.5), p90: q(gain, 0.9), avg: avg(gain) },
        src: { statTiles: avg(xs.map((x) => x.src.stat[tk])), hits: avg(xs.map((x) => x.hits[tk])), event: avg(xs.map((x) => x.src.event)), reward: avg(xs.map((x) => x.src.reward)), tour: avg(xs.map((x) => x.src.tour)), train: avg(xs.map((x) => x.src.train)) },
        statStops: avg(xs.map((x) => x.stops.stat || 0)), eventStops: avg(xs.map((x) => x.stops.event || 0)), battles: avg(xs.map((x) => x.stops.battle || 0)), meals: avg(xs.map((x) => x.stops.meal || 0)), rests: avg(xs.map((x) => x.rests)), ate: avg(xs.map((x) => x.eat)) };
    }
    row.perCh[c] = byRoute;
  }
  out[`${NAME[mon]}｜${pol}`] = row;
  process.stderr.write(`done ${NAME[mon]} ${pol} ${FOOD} goal4=${row.goal4}% entered4=${row.entered4}% final p50=${row.final.p50}\n`);
}
console.log(JSON.stringify({ N, OVER, SEED0, FOOD, defs: 'funnel[c]: entered＝その Chapter へ出発・goal＝40ターン以内に GOAL・tourWon＝大会で優勝（大会は全勝の仮定）・unlockNext＝次の Chapter へ出発できる（CHAPTER_RANK_GATE）・finalOpen＝最終 Chapter の解放。分母は全 N 回（goalIfEntered だけ入った個体）。goal4＝Chapter 1〜4 を通して Chapter 4 の GOAL に着いた割合', seedRule: '(i+SEED0)*7919 + mon*104729 + policyIndex*31, i=1..N（mon＝番号・A＝99・名前の種族＝200＋文字コードの和）', out }, null, 1));
