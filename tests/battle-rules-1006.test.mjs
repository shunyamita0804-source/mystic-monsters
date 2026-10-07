// =========================================================
// 2026-10-06・5：大会・状態異常・固有スキル・技習得ルートの正式仕様の差分（js/battle/rules.js・js/phase8/raising.js・js/phase8/league.js）
//  BR-01 状態異常（まひ 3回の機会・毎回25%で失敗／ねむり 最大2回・ダメージで起きる／共存／同じものは残りを最初に戻す）
//  BR-02 動けない行動（ダメージ・命中回数なし）・ノビトンの技（はなみず・ひとやすみ・しびれ突き・ダウナーミスト）・純補助技は命中 100%
//  BR-03 能力の上げ下げ（小10 中20 大30・同じ能力の同じ向きは足さない・強い方で上書き・同じ強さは残りを更新・弱いのは上書きしない・上げと下げは別）
//  BR-04 聖なる炎（命中後に自分の ちから・かしこさ・命中・回避・丈夫さ 小UP 1ターン。ライフ・素早さは上げない）
//  BR-05 固有スキル（ソラモ・ガウル・ノビトン・ジオル。レグナスは従来の rival-partner.js）
//  BR-06 技の習得ルート（ソラモ・ガウル。ガウルの初期技の並び）
//  BR-07 大会（初回チケット E1 D1 C1 B2 A2 S2・再優勝は報酬なし・1試合ごとの「賞金」「ランクアップ」を消す・終わりの順）
//  BR-08 Phase 6 に触れない・読み込み・10000G にしない
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const HTML = rd('index.html');
const M = (() => { const w = {}; new Function('window', rd('js/phase10/monsters.js'))(w); return w.MMP10M; })();

function load() {
  const sk = HTML.match(/const SK=(\[.*?\]);/s)[1], eff = HTML.match(/const EFF=(\{.*?\});/s)[1];
  const sp = HTML.match(/const SP=(\[.*?\]\]);/s)[1], djp = HTML.match(/DJP=(\[\{.*?\}\]);/s)[1];
  const ctx = vm.createContext({ console, setTimeout, clearTimeout });
  ctx.window = ctx; ctx.MMP10M = M;
  vm.runInContext(rd('js/battle-bridge.js') + '\n' + rd('js/integration/adapter.js'), ctx);
  vm.runInContext(`var SK=${sk};var EFF=${eff};var SP=${sp};var DJP=${djp};var SKART=new Array(20).fill(0).map((_,i)=>"art"+i);var SFR={};for(let i=0;i<20;i++)SFR[i]={f:[],id:i};var SKM=new Array(20).fill(0).map((_,i)=>["m"+i]);var BPL=null;`, ctx);
  const base = ctx.MMBattle;
  vm.runInContext(rd('js/battle/official-moves.js'), ctx);
  vm.runInContext('MMMOVES.install()', ctx);
  vm.runInContext(rd('js/battle/rules.js'), ctx);
  assert.equal(vm.runInContext('MMRULES.install()', ctx), true);
  return { ctx, R: ctx.MMRULES, B: base, AD: ctx.MMAdapter, SK: ctx.SK, EFF: ctx.EFF };
}
const unit = (name, sp, v) => ({ name, sp, li: v.li ?? 300, po: v.po ?? 100, in: v.in ?? 100, hi: v.hi ?? 100, ev: v.ev ?? 100, de: v.de ?? 100, eq: [] });
function battle(E, a, b) {
  const pl = [a, b];
  const sess = E.B.createBattleSession({ unitA: E.AD.legacyUnitToIndividualLike(a, 'p'), unitB: E.AD.legacyUnitToIndividualLike(b, 'e'), battleType: 'official', rng: () => 0.5 });
  const bs = { A: E.AD.legacyUnitToStats(a), B: E.AD.legacyUnitToStats(b) };
  const mv = (k) => E.AD.moveFromLegacySK(E.SK[k], E.EFF[k], { id: 'sk' + k, powerScale: 100 });
  const FIX = { hitRng: () => 0, damageRng: () => 0.5, criticalRng: () => 0.99 };
  const act = (side, k, rnd = () => 0.99, rng = FIX) => E.R.resolveWith((o) => E.B.resolveAction(o), { session: sess, baseStats: bs, attackerSide: side, move: mv(k), rng }, pl, rnd);
  return { sess, st: E.R.stateOf(sess), act, pl };
}

test('BR-01：状態異常＝まひ（3回の行動の機会・毎回25%で失敗・失敗もターンを使う・3回のあとに治る）／ねむり（最大2回の機会を失う）。共存・同じものは残りを最初の値に戻す（足さない）', () => {
  const { R } = load();
  assert.deepEqual(JSON.parse(JSON.stringify(R.AILMENTS)), { paralysis: { label: 'まひ', turns: 3, failChance: 0.25 }, sleep: { label: 'ねむり', turns: 2 } });
  const st = R.newState();
  R.applyAilment(st, 'B', 'paralysis'); assert.equal(st.ail.B.paralysis, 3);
  // 1回目：25% 未満で失敗
  let o = R.opportunity(st, 'B', () => 0.24); assert.deepEqual([o.blocked, o.kind], [true, 'paralysis']); assert.equal(st.ail.B.paralysis, 2);
  // 同じ状態異常をもう一度：残り 2 → 3（足して 5 にはしない）
  R.applyAilment(st, 'B', 'paralysis'); assert.equal(st.ail.B.paralysis, 3);
  o = R.opportunity(st, 'B', () => 0.25); assert.equal(o.blocked, false, '25% 以上なら動ける');
  o = R.opportunity(st, 'B', () => 0.9); assert.equal(o.blocked, false);
  o = R.opportunity(st, 'B', () => 0.9); assert.deepEqual([...o.cured], ['paralysis'], '3回の機会のあとに治る'); assert.equal(R.hasAilment(st, 'B'), false);
  // ねむり：2回動けない → 起きる
  R.applyAilment(st, 'A', 'sleep');
  o = R.opportunity(st, 'A', () => 0.9); assert.deepEqual([o.blocked, o.kind, [...o.cured]], [true, 'sleep', []]);
  o = R.opportunity(st, 'A', () => 0.9); assert.deepEqual([o.blocked, o.kind, [...o.cured]], [true, 'sleep', ['sleep']]);
  o = R.opportunity(st, 'A', () => 0.9); assert.equal(o.blocked, false, '3回目は動ける');
  // 共存：まひ＋ねむり（ねむりで動けない間も、まひの機会は1回ずつ減る）
  R.applyAilment(st, 'A', 'paralysis'); R.applyAilment(st, 'A', 'sleep');
  assert.deepEqual({ ...st.ail.A }, { paralysis: 3, sleep: 2 });
  o = R.opportunity(st, 'A', () => 0); assert.deepEqual([o.kind, st.ail.A.paralysis, st.ail.A.sleep], ['sleep', 2, 1]);
  R.applyAilment(st, 'A', 'sleep'); assert.equal(st.ail.A.sleep, 2, 'ねむりも残りを最初の値へ（足さない）');
  assert.deepEqual([...R.cureAll(st, 'A')].sort(), ['paralysis', 'sleep']); assert.equal(R.hasAilment(st, 'A'), false);
});

test('BR-02：動けない行動は何もしない（ダメージ・命中回数・効果なし）。ねむりはダメージで起きる。ノビトンの技の効果（はなみず・ひとやすみ・しびれ突き 30%まひ・ダウナーミスト 中DOWN 2T＋20%ねむり）。純補助技は基本命中 100%', () => {
  const E = load(), NF = E.R.NOBI_FIRST;
  // ノビトンの技は SK の 30〜39（実行時に追加）。正式の数値のまま
  const row = (k) => [E.SK[k][0], Math.round(E.SK[k][1] * 100), E.SK[k][8], Math.round(E.SK[k][9] * 100)];
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => row(NF + i)), [['はなビンタ', 65, 90, 5], ['ずつき', 80, 75, 10], ['はなみず', 55, 95, 5], ['ひとやすみ', 0, 100, 0], ['ハンマーノーズ', 105, 80, 15],
    ['ノーズウェーブ', 90, 90, 10], ['しびれ突き', 75, 100, 10], ['ミラージュノーズ', 100, 90, 30], ['ダウナーミスト', 60, 95, 0], ['ギガントノーズ', 150, 75, 25]]);
  assert.deepEqual(JSON.parse(JSON.stringify(E.EFF[NF + 2])), [{ tg: 1, st: 'de', lv: -1, t: 1 }], 'はなみず：相手の丈夫さ 小DOWN 1ターン');
  assert.deepEqual(JSON.parse(JSON.stringify(E.EFF[NF + 8])), [{ tg: 1, st: 'atk', lv: -2, t: 2 }, { tg: 1, st: 'de', lv: -2, t: 2 }], 'ダウナーミスト：相手の攻撃系・丈夫さ 中DOWN 2ターン');
  // 動けない行動
  let b = battle(E, unit('ノビトン', 2, {}), unit('ガウル', 1, {}));
  b.st.block = { side: 'A', kind: 'paralysis' };
  let r = b.act('A', NF);
  assert.deepEqual([r.hit, r.damage, r.rules.blocked, b.sess.hitCount.A, b.sess.currentLife.B], [false, 0, 'paralysis', 0, 300]);
  assert.equal(b.st.block, null, '1回で解ける');
  // しびれ突き：命中して、30% 未満ならまひ（命中とは別の判定）
  r = b.act('A', NF + 6, () => 0.29); assert.equal(b.st.ail.B.paralysis, 3); assert.ok(r.rules.notes.some((n) => /しびれた/.test(n.text)));
  b = battle(E, unit('ノビトン', 2, {}), unit('ガウル', 1, {}));
  b.act('A', NF + 6, () => 0.3); assert.equal(b.st.ail.B.paralysis, undefined, '30% 以上ならかからない');
  // ダウナーミスト：20% 未満でねむり → ダメージを受けたらすぐ起きる
  b.act('A', NF + 8, () => 0.19); assert.equal(b.st.ail.B.sleep, 2);
  assert.equal(b.sess.debuffs.B.length, 2, '攻撃系・丈夫さの中DOWN');
  r = b.act('A', NF); assert.equal(b.st.ail.B.sleep, undefined, 'ダメージで起きる'); assert.ok(r.rules.notes.some((n) => /目を覚ました/.test(n.text)));
  // ひとやすみ：最大ライフの20%（最大値まで）・状態異常をすべて治す・能力の上げ下げは残す
  b = battle(E, unit('ノビトン', 2, { li: 400 }), unit('ガウル', 1, {}));
  b.sess.currentLife.A = 100; E.R.applyAilment(b.st, 'A', 'paralysis'); E.R.applyAilment(b.st, 'A', 'sleep');
  b.act('B', 3);   // 吠える（相手の丈夫さ DOWN）
  const deb = b.sess.debuffs.A.length;
  r = b.act('A', NF + 3);
  assert.deepEqual([b.sess.currentLife.A, r.healed, E.R.hasAilment(b.st, 'A'), b.sess.debuffs.A.length], [180, 80, false, deb]);
  b.sess.currentLife.A = 390; b.act('A', NF + 3); assert.equal(b.sess.currentLife.A, 400, '最大値を超えない');
  assert.equal(b.sess.currentLife.B, 300, 'ひとやすみは攻撃ではない');
  // 純補助技は必ず決まる（命中の乱数を使わない）：回避がとても高い相手にも
  for (const k of [3, 7, 13, NF + 3]) assert.equal(E.R.behavior(k).support, true, E.SK[k][0]);
  b = battle(E, unit('ソラモ', 0, { hi: 1 }), unit('ガウル', 1, { ev: 999 }));
  const NEVER = { hitRng: () => 0.999, damageRng: () => 0.5, criticalRng: () => 0.99 };
  assert.equal(b.act('A', 3, undefined, NEVER).hit, true, '吠える'); assert.equal(b.act('A', 7, undefined, NEVER).hit, true, 'ほしのまもり');
  assert.equal(b.act('A', 0, undefined, NEVER).hit, false, '攻撃技は従来どおり命中の判定');
});

test('BR-03：能力の上げ下げ＝小10 中20 大30。同じ能力の同じ向きは足さない・強い方で上書き・同じ強さは残りを更新・弱いのは上書きしない・上げと下げは別（+20 と −10 → +10）', () => {
  const { B } = load();
  assert.deepEqual({ ...B.EFFECT_SIZE_RATIO }, { small: 0.1, medium: 0.2, large: 0.3 });
  const s = B.createBattleSession({ unitA: { uid: 'a', speciesId: 0, stats: { life: 100, power: 100, wisdom: 100, hit: 100, evasion: 100, toughness: 100 } }, unitB: { uid: 'b', speciesId: 1, stats: { life: 100, power: 100, wisdom: 100, hit: 100, evasion: 100, toughness: 100 } }, battleType: 't', rng: () => 0.5 });
  const ef = (dir, size, t) => B.createEffect({ category: 'attack', direction: dir, size, remainingTurns: t, appliedTurn: 1, stackable: false });
  const BS = { power: 100, wisdom: 100, hit: 100, evasion: 100, toughness: 100 };
  const eff = () => B.getEffectiveStatFromSession(s, 'A', 'power', BS);
  B.applyEffectToSession(s, 'A', ef('up', 'small', 2)); assert.equal(eff(), 110);
  B.applyEffectToSession(s, 'A', ef('up', 'small', 2)); assert.equal(eff(), 110, '同じ強さは足さない'); assert.equal(s.buffs.A.length, 1);
  B.applyEffectToSession(s, 'A', ef('up', 'medium', 1)); assert.equal(eff(), 120, '強い方で上書き');
  B.applyEffectToSession(s, 'A', ef('up', 'small', 5)); assert.equal(eff(), 120, '弱いのは上書きしない');
  B.applyEffectToSession(s, 'A', ef('up', 'medium', 3)); assert.equal(s.buffs.A[0].remainingTurns, 3, '同じ強さは残りを更新');
  B.applyEffectToSession(s, 'A', ef('down', 'small', 2)); assert.equal(eff(), 110, '上げと下げは別の箱（+20 −10＝+10）');
  assert.equal(B.getEffectiveStatFromSession(s, 'A', 'wisdom', BS), 110, '攻撃系＝ちから・かしこさの両方');
});

test('BR-04：聖なる炎（115/90/15）＝命中後に自分の ちから・かしこさ（攻撃系）・命中・回避・丈夫さ 小UP 1ターン。ライフ・素早さは上げない・外れたら上げない', () => {
  const E = load();
  assert.deepEqual([E.SK[19][0], Math.round(E.SK[19][1] * 100), E.SK[19][8], Math.round(E.SK[19][9] * 100)], ['聖なる炎', 115, 90, 15]);
  assert.deepEqual(JSON.parse(JSON.stringify(E.EFF[19])).map((e) => [e.tg, e.st, e.lv, e.t]), [[0, 'atk', 1, 1], [0, 'hi', 1, 1], [0, 'ev', 1, 1], [0, 'de', 1, 1]]);
  const mv = M.movesOf('gauru').find((m) => m.name === '聖なる炎');
  assert.deepEqual(mv.effects.map((e) => e.stat).sort(), ['atk', 'de', 'ev', 'hi'], 'atk＝攻撃系（ちから・かしこさ）。ライフ・素早さは無い');
  let b = battle(E, unit('ガウル', 1, {}), unit('ソラモ', 0, { li: 999 }));
  b.act('A', 19);
  const v = (k) => E.B.getEffectiveStatFromSession(b.sess, 'A', k, { power: 100, wisdom: 100, hit: 100, evasion: 100, toughness: 100 });
  assert.deepEqual(['power', 'wisdom', 'hit', 'evasion', 'toughness'].map(v), [110, 110, 110, 110, 110]);
  assert.ok(b.sess.buffs.A.every((e) => e.remainingTurns === 1));
  b = battle(E, unit('ガウル', 1, {}), unit('ソラモ', 0, { li: 999 }));
  b.act('A', 19, undefined, { hitRng: () => 0.999, damageRng: () => 0.5, criticalRng: () => 0.99 });
  assert.equal(b.sess.buffs.A.length, 0, '外れたら上げない');
});

test('BR-05：固有スキル＝ソラモ（ライフ20%以下で次の攻撃 ×1.25・1回）／ガウル（最初の3ターン ちから・かしこさ +5%）／ノビトン（相手が状態異常の間 ちから・かしこさ・丈夫さ +5%）／ジオル（倒れるダメージを10%で1度だけライフ1で耐える）', () => {
  const E = load();
  // ソラモ
  let b = battle(E, unit('ソラモ', 0, { li: 100 }), unit('ガウル', 1, { li: 999 }));
  const d0 = b.act('A', 0).damage;
  b.sess.currentLife.A = 21; b.act('B', 11);   // 20 以下へ
  assert.equal(b.st.armed.A, true, '20% 以下で構える');
  const d1 = b.act('A', 0).damage; assert.equal(d1, Math.round(d0 * 1.25), '次の攻撃 ×1.25');
  assert.equal(b.act('A', 0).damage, d0, '1回だけ'); assert.equal(b.st.armed.A, false);
  b.act('B', 11); assert.equal(b.st.armed.A, false, '1バトル1回（重ならない）');
  // ガウル：1〜3ターンは +5%、4ターン目から元に戻る
  b = battle(E, unit('ガウル', 1, {}), unit('ソラモ', 0, { li: 9999 }));
  const g1 = b.act('A', 11).damage, g1w = b.act('A', 12).damage;
  b.sess.turn = 4; const g4 = b.act('A', 11).damage, g4w = b.act('A', 12).damage;
  assert.ok(g1 > g4 && g1w > g4w, `ちから・かしこさ ${g1}>${g4} ${g1w}>${g4w}`);
  assert.deepEqual({ ...E.R.statMul(b.st, 'A', 1, 3) }, { power: 1.05, wisdom: 1.05, toughness: 1 });
  assert.deepEqual({ ...E.R.statMul(b.st, 'A', 1, 4) }, { power: 1, wisdom: 1, toughness: 1 });
  // ノビトン：相手が状態異常の間だけ
  b = battle(E, unit('ノビトン', 2, {}), unit('ガウル', 1, {}));
  assert.deepEqual({ ...E.R.statMul(b.st, 'A', 2, 1) }, { power: 1, wisdom: 1, toughness: 1 });
  E.R.applyAilment(b.st, 'B', 'sleep');
  assert.deepEqual({ ...E.R.statMul(b.st, 'A', 2, 1) }, { power: 1.05, wisdom: 1.05, toughness: 1.05 });
  E.R.cureAll(b.st, 'B'); assert.equal(E.R.statMul(b.st, 'A', 2, 1).power, 1, '治ったら元に戻る');
  // ジオル：10% 未満で1度だけ耐える（2回目は倒れる）
  b = battle(E, unit('ガウル', 1, { po: 500 }), unit('ジオル', 3, { li: 10 }));
  let r = b.act('A', 14, () => 0.05);
  assert.deepEqual([r.ko, b.sess.currentLife.B, r.endured], [false, 1, true]);
  b.sess.currentLife.B = 10; r = b.act('A', 14, () => 0.05); assert.equal(r.ko, true, '1バトル1回');
  b = battle(E, unit('ガウル', 1, { po: 500 }), unit('ジオル', 3, { li: 10 }));
  assert.equal(b.act('A', 14, () => 0.1).ko, true, '10% 以上なら耐えない');
  // ほかの種族には付かない
  b = battle(E, unit('ソラモ', 0, {}), unit('ソラモ', 0, {}));
  assert.deepEqual({ ...E.R.statMul(b.st, 'A', 0, 1) }, { power: 1, wisdom: 1, toughness: 1 });
  // レグナス（蒼銀の反撃）は従来の rival-partner.js。動けなかった行動は「回避」に数えない
  const RP = rd('js/battle/rival-partner.js');
  assert.match(RP, /if \(r\.rules && r\.rules\.blocked\) return;/); assert.match(RP, /damageMultiplier\) \|\| SKILL_MULT/);
  // データの値（js/phase10/monsters.js）
  assert.deepEqual(['solamo', 'gauru', 'nobiton', 'jiol'].map((k) => M.UNIQUE_SKILLS['unique_' + k].name), ['逆境のひと踏ん張り', '紅翼の猛攻', 'ふしぎな嗅覚', '大地の守り']);
});

test('BR-06：技の習得ルート（正式）＝ソラモ 初期 たいあたり・ひっかき・しっぽアタック・吠える／ちから スタークラッシュ…丈夫さ スターダストレイ→スターフォール。ガウル 初期 つつく・ウィンド・スパイラルダイブ・ソニックムーブ／…丈夫さ フェザーストーム→聖なる炎', () => {
  const E = load(), SK = E.SK, n = (a) => Array.from(a, (k) => SK[k][0]);
  assert.deepEqual(n(E.ctx.SP[0][6]), ['たいあたり', 'ひっかき', 'しっぽアタック', '吠える']);
  assert.deepEqual(n(E.ctx.SP[1][6]), ['つつく', 'ウィンド', 'スパイラルダイブ', 'ソニックムーブ']);
  const D = E.ctx.DJP, route = (sp) => ['po', 'in', 'hi', 'ev', 'de'].map((x) => n(D[sp][x]));
  assert.deepEqual(route(0), [['スタークラッシュ'], ['ソラモビーム'], ['すなかけ'], ['ほしのまもり'], ['スターダストレイ', 'スターフォール']]);
  assert.deepEqual(route(1), [['紅翼スラッシュ'], ['ファイアボール'], ['フレアレイ'], ['スカイラッシュ'], ['フェザーストーム', '聖なる炎']]);
  // 丈夫さの2段階目は1段階目のあと（従来の dl）
  assert.match(HTML, /const dl=\(k,m\)=>pool\(k,m\)\.filter\(x=>!m\.sk\.includes\(x\)&&\(x!=9\|\|m\.sk\.includes\(8\)\)&&\(x!=19\|\|m\.sk\.includes\(18\)\)\);/);
  // 番号（習得の枠）は変えない＝既存のセーブの m.sk はそのまま
  assert.deepEqual([...E.ctx.MMMOVES.INITIAL[1]], [11, 12, 10, 13]);
});

test('BR-07：大会＝初回チケット E1 D1 C1 B2 A2 S2・賞金は従来の額・再優勝は報酬なし・1試合ごとの「賞金」「ランクアップ」の旧表示は消す・終わりの順', () => {
  const ctx = { window: {} }; ctx.window.window = ctx.window;
  for (const f of ['js/phase7/progression.js', 'js/phase8/league.js', 'js/phase8/raising.js']) new Function('window', 'globalThis', rd(f))(ctx.window, ctx.window);
  const P8 = ctx.window.MMP8;
  assert.deepEqual([...P8.FIRST_CLEAR_TICKETS], [1, 1, 1, 2, 2, 2]);
  assert.deepEqual([...P8.PRIZE], [100, 200, 350, 550, 800, 1200], '賞金の額は変えない');
  assert.deepEqual([...P8.TOUR_END_STEPS], ['final', 'champion', 'firstReward', 'rankUp', 'cedricEnd', 'next']);
  const first = { rank: 1, place: 1, won: true, reward: { firstClear: true, prize: 200, tickets: 1, bonus: [], bagUnlocked: false, rankUp: { from: 0, to: 1, unlocked: 2 } } };
  assert.deepEqual(P8.tourEndSteps(first).map((d) => d.step), ['final', 'champion', 'firstReward', 'rankUp', 'cedricEnd', 'next']);
  const again = { rank: 1, place: 1, won: true, reward: { firstClear: false, prize: 0, tickets: 0, bonus: [], rankUp: null } };
  assert.deepEqual(P8.tourEndSteps(again).map((d) => d.step), ['final', 'champion', 'cedricEnd', 'next'], '再優勝は報酬・ランクアップの段階なし');
  assert.deepEqual(P8.tourEndSteps({ rank: 1, place: 3, won: false, reward: null }).map((d) => d.step), ['final', 'cedricEnd', 'next']);
  // 1試合ごとの旧表示（fight() の結果の文）
  const E = load();
  assert.equal(E.R.cleanResult('勝利！ 賞金 200G を獲得！ ランクDにランクアップ！'), '勝利！');
  assert.equal(E.R.cleanResult('勝利！（判定勝ち） 賞金 1200G を獲得！'), '勝利！（判定勝ち）');
  assert.equal(E.R.cleanResult('敗北…'), '敗北…');
  // 決着（全試合の終了）でだけ報酬・順位。1試合の結果は勝敗と対戦表だけ
  const R8 = rd('js/phase8/raising.js');
  assert.match(R8, /if \(LG\(\)\.isFinished\(t\.league\)\) Object\.assign\(out, settleTournament\(S, m, rnd\)\);/);
  assert.match(R8, /if \(firstClear\) \{\n\s+const pool = \[\.\.\.BONUS_STATS\]/, '再優勝はステータスボーナスなし');
  // 画面：再優勝は「報酬はありません」・終わりの順の差し込み口
  assert.match(HTML, /クリア済みランクのため、報酬はありません/);
  assert.match(HTML, /if\(!P9_SE_SEEN\.has\(rs\)\)\{P9_SE_SEEN\.add\(rs\);P9_END_RS=rs;MMP8\.runTourEnd\(rs\)\}/);
  assert.match(HTML, /m\.raise\.battle\.kind=="league"&&m\.raise\.battle\.done&&window\.MMRULES\)\{const bs=MMRULES\.battleStats\(\);if\(bs\)m\.raise\.battle\.stats=bs\}/, '試合の内容（順位の計算用）');
});

test('BR-08：Phase 6（fight()・battle-bridge・adapter）に触れない・読み込み・所持金の仕様（1000G）は変えない', () => {
  const RL = rd('js/battle/rules.js');
  assert.doesNotMatch(RL, /function fight|\.bt\s*\{|#rl|\.rw\b|#go\s*\{/, '.bt 系 CSS・ルーレットに触れない');
  assert.match(HTML, /<script src="\.\/js\/battle\/official-moves\.js"><\/script>\n<script src="\.\/js\/battle\/rules\.js"><\/script>/);
  assert.match(HTML, /if\(window\.MMRULES\)MMRULES\.install\(\);/);
  assert.match(rd('js/battle/fx.js'), /root\.MMRULES\.swallow\(n\)/);
  assert.doesNotMatch(HTML.replace(/<[^>]*base64[^>]*>/g, ''), /10000G/, '10000G にしない');
  assert.match(HTML, /\{icon:"gold",text:"1000G"\}/);   // 2026-10-07 試遊：1000G と薬草は1つの帯
});
