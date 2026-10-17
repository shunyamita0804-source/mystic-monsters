// =========================================================
// 2026-10-15：ジオルの正式10技（ZIP Mismon_Jiol_10Moves_Battle_Addendum_20261015 の 02_Jiol_Approved_Moves.tsv＝ユーザー正式承認）
//  JM-01 データ：名前・ID・型・威力・命中・CR・習得区分が承認表と同じ・SK＝40＋No−1（ほかの種族の 0〜39 と重ならない）・技カードと同じ番号
//  JM-02 実戦の表（SK・EFF）：威力／100・ちから（p）／かしこさ（i）・命中・CR（%→0〜1）・No.9／10＝必殺技・No.3＝自分の攻撃力 中UP 2ターン
//  JM-03 実際の計算（battle-bridge は変えない）：No.6／10＝かしこさ・ほか＝ちから／No.3＝ダメージ 0・中UP（20%）2T・掛け直しても足さない／No.7 は命中100でも外れることがある
//  JM-04 つなぎ：技アニメ（art25d の SK 40〜49 → 96枚のデータ）・習得の表（MMP7.registerMoveset(3)）・解禁しない（市場・野生・合体・相手の表）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const J = (x) => JSON.parse(JSON.stringify(x));
const HTML = rd('index.html');
const M = (() => { const w = {}; new Function('window', rd('js/phase10/monsters.js'))(w); return w.MMP10M; })();
// 承認表（02_Jiol_Approved_Moves.tsv の写し）：No, 名前, ID, 型, 威力, 命中, CR%, 習得
const TSV = [
  [1, 'パンチ', 'punch', 'power', 70, 95, 5, 'initial'],
  [2, 'キック', 'kick', 'power', 85, 85, 10, 'initial'],
  [3, '力をためる', 'chikara_wo_tameru', 'support', null, 100, null, 'initial'],
  [4, 'のしかかり', 'noshikakari', 'power', 95, 75, 10, 'initial'],
  [5, 'グランドハンマー', 'ground_hammer', 'power', 115, 80, 15, 'po'],
  [6, 'クリスタルレイ', 'crystal_ray', 'wisdom', 100, 95, 10, 'in'],
  [7, 'グランドスパイク', 'ground_spike', 'power', 95, 100, 10, 'hi'],
  [8, 'ロックアッパー', 'rock_upper', 'power', 105, 90, 20, 'ev'],
  [9, 'ジオインパクト', 'geo_impact', 'power', 140, 75, 25, 'de'],
  [10, 'クリスタルノヴァ', 'crystal_nova', 'wisdom', 145, 90, 20, 'de'],
];

function load() {
  const sk = HTML.match(/const SK=(\[.*?\]);/s)[1], eff = HTML.match(/const EFF=(\{.*?\});/s)[1];
  const sp = HTML.match(/const SP=(\[.*?\]\]);/s)[1];
  const ctx = vm.createContext({ console, setTimeout: () => 0, clearTimeout: () => {} });   // 演出（document）のタイマーは動かさない
  ctx.window = ctx; ctx.MMP10M = M;
  vm.runInContext(rd('js/phase7/progression.js'), ctx);
  vm.runInContext(rd('js/battle-bridge.js') + '\n' + rd('js/integration/adapter.js'), ctx);
  vm.runInContext(`var SK=${sk};var EFF=${eff};var SP=${sp};var SKART=new Array(20).fill(0).map((_,i)=>"art"+i);var SFR={};for(let i=0;i<20;i++)SFR[i]={f:[],id:i};var SKM=new Array(20).fill(0).map((_,i)=>["m"+i]);var BPL=null;var SPECIAL_MOVES=new Set();`, ctx);
  vm.runInContext(rd('js/battle/official-moves.js'), ctx); vm.runInContext('MMMOVES.install()', ctx);
  vm.runInContext(rd('js/battle/rules.js'), ctx);
  assert.equal(vm.runInContext('MMRULES.install()', ctx), true);
  return { ctx, R: ctx.MMRULES, B: ctx.MMBattle, AD: ctx.MMAdapter, SK: ctx.SK, EFF: ctx.EFF };
}
const unit = (name, sp, v) => ({ name, sp, li: 600, po: v.po ?? 100, in: v.in ?? 100, hi: v.hi ?? 100, ev: v.ev ?? 100, de: v.de ?? 100, eq: [] });
function battle(E, a, b) {
  const pl = [a, b];
  const sess = E.B.createBattleSession({ unitA: E.AD.legacyUnitToIndividualLike(a, 'p'), unitB: E.AD.legacyUnitToIndividualLike(b, 'e'), battleType: 'official', rng: () => 0.5 });
  const bs = { A: E.AD.legacyUnitToStats(a), B: E.AD.legacyUnitToStats(b) };
  const mv = (k) => E.AD.moveFromLegacySK(E.SK[k], E.EFF[k], { id: 'sk' + k, powerScale: 100 });
  const act = (side, k, rng = { hitRng: () => 0, damageRng: () => 0.5, criticalRng: () => 0.99 }) => E.R.resolveWith((o) => E.B.resolveAction(o), { session: sess, baseStats: bs, attackerSide: side, move: mv(k), rng }, pl, () => 0.99);
  return { sess, act };
}

test('JM-01：承認表どおり（名前・ID・型・威力・命中・CR・習得）・SK＝40＋No−1・ほかの種族の番号と重ならない・技カードと同じ番号', () => {
  const L = M.movesOf('jiol');
  assert.deepEqual(L.map((m) => [m.no, m.name, m.id, m.type, m.power ?? null, m.accuracy ?? null, m.critical ?? null, m.learn]), TSV);
  assert.deepEqual(L.map((m) => m.slot), [40, 41, 42, 43, 44, 45, 46, 47, 48, 49]);
  assert.deepEqual(L.map((m) => m.cuts), [4, 4, 4, 4, 4, 4, 4, 4, 12, 4], '技アニメの本体のコマ数');
  assert.ok(L.every((m) => !m.ailment && !m.heal), '状態異常・回復は付けない');
  assert.deepEqual(J(L[2].effects), [{ target: 'self', stat: 'atk', dir: 'up', size: 'medium', turns: 2 }]);
  assert.ok(L.filter((m) => m.no !== 3).every((m) => !m.effects.length), '追加効果は No.3 だけ');
  const others = ['solamo', 'gauru', 'regnas'].flatMap((k) => M.movesOf(k).map((m) => m.slot));
  assert.ok(others.every((k) => k >= 0 && k <= 29) && L.every((m) => !others.includes(m.slot)), 'ソラモ・ガウル 0〜19・レグナス 20〜29・ノビトン 30〜39 と重ならない');
  for (const m of L) { const b = M.moveBySlot(m.slot); assert.deepEqual([b.owner, b.no], ['jiol', m.no]); }
  const ctx = { console }; ctx.window = ctx; ctx.MMP10M = M; vm.createContext(ctx); vm.runInContext(rd('js/battle/move-cards.js'), ctx);
  for (const m of L) assert.match(ctx.MMMVCARD.bySlot(m.slot).src, new RegExp(`cards_1014/jiol/${String(m.no).padStart(2, '0')}_${m.id}\\.webp$`), m.name);
  // 他の種族の技は変えていない
  assert.deepEqual(M.movesOf('solamo').map((m) => [m.slot, m.power ?? null]), [[0, 70], [1, 60], [2, 85], [4, 105], [7, null], [3, null], [5, 90], [6, null], [8, 120], [9, 140]]);
  // 解禁しない：市場・野生（相手の表 SP は2種）・正式マスターの初期能力は不変
  assert.ok(!M.MARKET_CATALOG.some((c) => c.key === 'jiol')); assert.match(HTML, /\nconst SP=\[\["ソラモ"[^\n]*\["ガウル"[^\n]*\]\]\];/);
  assert.deepEqual(J(M.byKey('jiol').base), { li: 120, po: 150, in: 80, hi: 70, ev: 30, de: 160 }); assert.equal(M.byKey('jiol').speed, 1);
});

test('JM-02：実戦の表＝SK 40〜49（威力／100・p／i・命中・CR を 0〜1 に）・No.9／10＝必殺技・No.3＝EFF 自分の攻撃力 中UP 2T・習得の表', () => {
  const E = load(), SK = J(E.SK), EFF = J(E.EFF);
  for (const [no, name, , type, pw, acc, cr] of TSV) {
    const k = 39 + no, r = SK[k];
    assert.equal(r[0], name);
    assert.equal(r[1], pw == null ? 0 : pw / 100, `${name}：威力`);
    assert.equal(r[7], type === 'wisdom' ? 'i' : 'p', `${name}：計算の能力`);
    assert.equal(r[8], acc, `${name}：命中`);
    assert.equal(r[9], cr == null ? 0 : cr / 100, `${name}：CR（%→0〜1）`);
    assert.equal(r[5], pw == null ? 'd' : 'a');
  }
  assert.deepEqual(EFF[42], [{ tg: 0, st: 'atk', lv: 2, t: 2 }]);
  for (let k = 40; k <= 49; k++) if (k !== 42) assert.equal(EFF[k], undefined, `SK ${k}：追加効果なし`);
  const spm = vm.runInContext('[...SPECIAL_MOVES]', E.ctx);
  assert.deepEqual(J(spm).filter((k) => k >= 40 && k <= 49), [48, 49], '必殺技＝ジオインパクト・クリスタルノヴァ（従来の 120 以上の規則）');
  assert.ok(SK[48][2] < SK[47][2] && SK[49][2] < SK[45][2], 'ルーレットの重みは従来の大技と同じ扱い');
  assert.deepEqual(J(vm.runInContext('MMP7.getMoveset(3)', E.ctx)), { initial: [40, 41, 42, 43], po: [44], in: [45], hi: [46], ev: [47], de: [48, 49] }, '初期4＋特訓6');
  assert.equal(SK.length, 70, '2026-10-17：60〜69＝ラズック（50〜59 は空き）');
});

test('JM-03：実際の計算＝No.6／10 はかしこさ・ほかはちから／No.3＝ダメージ 0・中UP（20%）2T・掛け直しても足さない／No.7＝命中100でも必中ではない', () => {
  const E = load(), J3 = unit('ジオル', 3, {}), foe = unit('相手', 0, {});
  const dmg = (k, a) => { const B = battle(E, a, unit('相手', 0, {})); return B.act('A', k).damage; };
  for (const [no, , , type] of TSV) {
    if (type === 'support') continue;
    const k = 39 + no, base = dmg(k, unit('ジオル', 3, {})), po = dmg(k, unit('ジオル', 3, { po: 300 })), wi = dmg(k, unit('ジオル', 3, { in: 300 }));
    assert.ok(base > 0, `${no}：ダメージが出る`);
    if (type === 'wisdom') assert.ok(wi > base && po === base, `${no}：かしこさ計算（${base}／ちから↑${po}／かしこさ↑${wi}）`);
    else assert.ok(po > base && wi === base, `${no}：ちから計算（${base}／ちから↑${po}／かしこさ↑${wi}）`);
  }
  assert.ok(dmg(48, J3) > dmg(43, J3), 'ジオインパクト（140）＞のしかかり（95）');
  // No.3
  const B = battle(E, J3, foe), r = B.act('A', 42);
  assert.equal(r.damage, 0); assert.equal(r.hit, true);
  const buf = J(B.sess.buffs.A); assert.equal(buf.length, 1); assert.deepEqual([buf[0].category, buf[0].ratio, buf[0].remainingTurns, buf[0].direction], ['attack', 0.2, 2, 'up']);
  B.act('A', 42); const buf2 = J(B.sess.buffs.A); assert.equal(buf2.length, 1, '掛け直しても足さない（残りターンを更新）'); assert.equal(buf2[0].ratio, 0.2);
  const after = battle(E, J3, foe); after.act('A', 42); const up = after.act('A', 40).damage, plain = battle(E, J3, foe).act('A', 40).damage;
  assert.ok(up > plain, `力をためたあとはちからの技が強い（${plain} → ${up}）`);
  // No.7：相手の回避が高く命中の乱数が大きいと外れる
  const miss = battle(E, J3, unit('相手', 0, { ev: 400 })).act('A', 46, { hitRng: () => 0.999, damageRng: () => 0.5, criticalRng: () => 0.99 });
  assert.equal(miss.hit, false, 'グランドスパイク（命中100）でも必中ではない'); assert.equal(miss.damage, 0);
});

test('JM-04：技アニメ（SK 40〜49 → 96枚のデータ）・QA は実戦（静止画・プレビューではない）・本番は解禁しない', () => {
  const a = rd('js/battle/art25d.js');
  assert.match(a, /k >= 40 && k <= 49 \? 3 : k >= 60 && k <= 69 \? 6 : -1/); assert.match(a, /const SRC_OF = \{ 0: OFF, 1: GOFF, 2: NOFF, 3: JSK, 4: ROFF, 6: ZSK \};/);
  assert.match(a, /JK\.map\[39 \+ \+no\] = D\[no\]/, 'データは No. → SK 40＋No−1');
  assert.match(a, /OFF_DUR = \{ 48: 2700/, 'ジオインパクト（12コマ）は長め');
  const D = (() => { const c = {}; c.window = c; vm.createContext(c); vm.runInContext(rd('js/battle/jiol-moves-data.js'), c); return c.MMJIMV_DATA; })();
  let body = 0, fx = 0; for (const d of Object.values(D)) { body += d.cuts.length; fx += d.cuts.filter((c) => c.fx).length + d.fx.length; }
  assert.deepEqual([body, fx], [48, 48]);
  assert.deepEqual(Object.values(D).map((d) => d.hit), [3, 3, null, 3, 3, 3, 3, 3, 6, 3], '当たる区切り（No.3＝補助技は無し）');
  assert.deepEqual(M.movesOf('jiol').map((m) => m.cuts), Object.values(D).map((d) => d.cuts.length));
  const q = rd('js/qa/trial.js'); assert.match(q, /if \(slot != null && SK && SK\[slot\]\) return 'battle';/);
  assert.match(rd('js/battle/rules.js'), /if \(P7 && P7\.registerMoveset && !P7\.getMoveset\(3\)\)/);
});
