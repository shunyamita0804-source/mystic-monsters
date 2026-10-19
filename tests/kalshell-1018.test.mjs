// =========================================================
// 2026-10-18 カルシェル（Kalshell）の正式登録＝未解禁・入手条件なし（ZIP Kalshell_DevAssets_Part01〜07 ＝ Mismon_Kalshell_OfficialPackage_ForDev_20261018・ユーザー承認済みの仕様マスター）
//  KS-01 登録の値：番号 7（予約）・名前・種族表示名は未確定（kind null・候補「甲殻種【要確認／仮置き】」）・サイズ 3・初期能力・成長適性・素早さ・固有スキル「かたい貝殻」・10技（SK＝70＋No−1・習得区分・追加効果は No.3／4／8 だけ・No.9／10＝必殺技）
//  KS-02 隔離：byId／byKey／keyOf では引けない・SPECIES／市場／ライバル／fight() の相手の表／本編の盤・CLAUDE.md・world-board・walk5 に触れていない・index.html は script 1行だけ
//  KS-03 素材：派生 41点（2.5D・待機・表情6・歩行16・技カード10・対戦表の顔・VS・比較の代替・声2×2形式）の実在・大きさ・原本と派生の sha256（derive_art.json ↔ README）・原本（PNG／MP3）・PREVIEW／GIF／MP4 は置かない
//  KS-04 実戦の表と計算：SK 70〜79（威力／100・p／i・命中・CR）・EFF（No.3 相手の命中 小DOWN 1T／No.4 自分の丈夫さ 小UP 2T／No.8 自分の回避 小UP 2T）・必殺技 78・79・習得の表・固有スキル＝被弾ごとに 20% で 25% 軽減（回数の上限なし・ほかの種族には付かない・攻撃側では起きない）
//  KS-05 つなぎ：技アニメ 84枚のデータ（本体 49・効果 35・当たる区切り）・art25d の SK 70〜79・技カード・表情（MMRXART 7）・比較画面の絵・対戦表の顔・鳴き声の登録・歩行（ch1a の monsterSprites）・QA 試遊だけ（trial.js・qa-top）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const sha = (p) => createHash('sha256').update(readFileSync(path.join(ROOT, p))).digest('hex');
const J = (x) => JSON.parse(JSON.stringify(x));
const HTML = rd('index.html');
const M = (() => { const w = {}; new Function('window', rd('js/phase10/monsters.js'))(w); return w.MMP10M; })();
const load = (files, extra = {}) => { const ctx = Object.assign({ console }, extra); ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx); files.forEach((f) => vm.runInContext(rd(f), ctx, { filename: f })); return ctx; };
const DJ = JSON.parse(rd('tools/kalshell1018/derive_art.json'));
/** WebP の幅・高さ（VP8X／VP8L／VP8）と透過（VP8X のときだけ分かる） */
const webp = (p) => {
  const b = readFileSync(path.join(ROOT, p)); assert.equal(b.toString('ascii', 0, 4) + b.toString('ascii', 8, 12), 'RIFFWEBP', p);
  const k = b.toString('ascii', 12, 16);
  if (k === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3), alpha: !!(b[20] & 0x10), k };
  if (k === 'VP8L') { const v = b.readUInt32LE(21); return { w: 1 + (v & 0x3fff), h: 1 + ((v >> 14) & 0x3fff), alpha: null, k }; }
  return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff, alpha: false, k };
};
// 仕様マスター（01_正式素材仕様マスター）の写し：No, 名前, ID, 型, 威力, 命中, CR%, 習得
const SPEC = [
  [1, 'はさむ', 'hasamu', 'power', 70, 95, 5, 'initial'],
  [2, 'シェルタックル', 'shell_tackle', 'power', 80, 85, 10, 'initial'],
  [3, 'あわだま', 'awadama', 'wisdom', 60, 95, 5, 'initial'],
  [4, 'からにこもる', 'kara_ni_komoru', 'support', null, 100, null, 'initial'],
  [5, 'クラッシュクロー', 'crash_claw', 'power', 105, 85, 15, 'po'],
  [6, 'アクアバースト', 'aqua_burst', 'wisdom', 95, 90, 10, 'in'],
  [7, 'コーラルスピア', 'coral_spear', 'power', 95, 100, 10, 'hi'],
  [8, 'しおのステップ', 'shio_no_step', 'support', null, 100, null, 'ev'],
  [9, 'シェルブレイカー', 'shell_breaker', 'power', 120, 80, 15, 'de'],
  [10, 'タイダルクラッシュ', 'tidal_crash', 'power', 125, 85, 20, 'de'],
];
const KINDS = ['joy', 'surprise', 'sad', 'eat', 'hit', 'dodge'];

function loadBattle() {
  const sk = HTML.match(/const SK=(\[.*?\]);/s)[1], eff = HTML.match(/const EFF=(\{.*?\});/s)[1], sp = HTML.match(/const SP=(\[.*?\]\]);/s)[1];
  const ctx = vm.createContext({ console, setTimeout: () => 0, clearTimeout: () => {} });
  ctx.window = ctx; ctx.MMP10M = M;
  vm.runInContext(rd('js/phase7/progression.js'), ctx);
  vm.runInContext(rd('js/battle-bridge.js') + '\n' + rd('js/integration/adapter.js'), ctx);
  vm.runInContext(`var SK=${sk};var EFF=${eff};var SP=${sp};var SKART=new Array(20).fill(0).map((_,i)=>"art"+i);var SFR={};for(let i=0;i<20;i++)SFR[i]={f:[],id:i};var SKM=new Array(20).fill(0).map((_,i)=>["m"+i]);var BPL=null;var SPECIAL_MOVES=new Set();`, ctx);
  vm.runInContext(rd('js/battle/official-moves.js'), ctx); vm.runInContext('MMMOVES.install()', ctx);
  vm.runInContext(rd('js/battle/rules.js'), ctx);
  assert.equal(vm.runInContext('MMRULES.install()', ctx), true);
  return { ctx, R: ctx.MMRULES, B: ctx.MMBattle, AD: ctx.MMAdapter, SK: ctx.SK, EFF: ctx.EFF };
}
const unit = (name, sp, v) => ({ name, sp, li: v.li ?? 600, po: v.po ?? 100, in: v.in ?? 100, hi: v.hi ?? 100, ev: v.ev ?? 100, de: v.de ?? 100, eq: [] });
function battle(E, a, b) {
  const pl = [a, b];
  const sess = E.B.createBattleSession({ unitA: E.AD.legacyUnitToIndividualLike(a, 'p'), unitB: E.AD.legacyUnitToIndividualLike(b, 'e'), battleType: 'official', rng: () => 0.5 });
  const bs = { A: E.AD.legacyUnitToStats(a), B: E.AD.legacyUnitToStats(b) };
  const mv = (k) => E.AD.moveFromLegacySK(E.SK[k], E.EFF[k], { id: 'sk' + k, powerScale: 100 });
  const FIX = { hitRng: () => 0, damageRng: () => 0.5, criticalRng: () => 0.99 };
  const act = (side, k, rnd = () => 0.99, rng = FIX) => E.R.resolveWith((o) => E.B.resolveAction(o), { session: sess, baseStats: bs, attackerSide: side, move: mv(k), rng }, pl, rnd);
  return { sess, st: E.R.stateOf(sess), act, pl };
}

test('KS-01：登録の値（番号 7・名前・種族名は未確定・サイズ 3・能力・適性・素早さ・固有スキル・10技＝SK 70〜79・習得・追加効果・必殺技）＝仕様マスターどおり', () => {
  const K = M.pendingSpecies('kalshell');
  assert.ok(K, 'PENDING_SPECIES に登録'); assert.equal(M.pendingSpecies(7), K, '番号 7 でも引ける');
  assert.deepEqual([K.id, K.key, K.name, K.en, K.kind, K.size, K.speed], [7, 'kalshell', 'カルシェル', null, null, 3, 4]);
  assert.match(K.kindCandidate, /甲殻種.*要確認/, '種族表示名は【要確認／仮置き】＝確定表示しない（kind は null）');
  assert.deepEqual([K.unlocked, K.playerAvailable, K.obtain, K.profileImage], [false, false, null, null], '未解禁・入手条件なし・プロフィール画像は捏造しない');
  assert.deepEqual(J(K.base), { li: 105, po: 90, in: 70, hi: 100, ev: 65, de: 130 });
  assert.equal(Object.values(K.base).reduce((a, b) => a + b, 0), 560, '合計 560');
  assert.deepEqual(J(K.growth), { li: 'C', po: 'C', in: 'D', hi: 'C', ev: 'D', de: 'A' });
  // 固有スキル
  const U = M.UNIQUE_SKILLS.unique_kalshell;
  assert.equal(K.uniqueSkill, U);
  assert.deepEqual([U.name, U.species, U.speciesKey, U.implemented], ['かたい貝殻', 7, 'kalshell', true]);
  assert.deepEqual(J(U.params), { trigger: 'on_damaged', chance: 0.2, damageCut: 0.25, uses: null }, '20% で 25% 軽減・回数の上限なし');
  assert.match(U.desc, /20%.*25%/);
  assert.deepEqual(Object.keys(M.UNIQUE_SKILLS), ['unique_solamo', 'unique_gauru', 'unique_nobiton', 'unique_jiol', 'unique_razuck', 'unique_kalshell']);
  // 10技
  const L = M.movesOf('kalshell');
  assert.equal(K.moves, M.OFFICIAL_MOVES.kalshell.list);
  assert.deepEqual(L.map((m) => [m.no, m.name, m.id, m.type, m.power ?? null, m.accuracy ?? null, m.critical ?? null, m.learn]), SPEC);
  assert.deepEqual(L.map((m) => m.slot), [70, 71, 72, 73, 74, 75, 76, 77, 78, 79], 'SK＝70＋No−1');
  assert.deepEqual(L.map((m) => m.cuts), [4, 4, 4, 4, 5, 5, 5, 4, 6, 8], '技アニメの本体のコマ数');
  assert.deepEqual(L.map((m) => !!m.finisher), [false, false, false, false, false, false, false, false, true, true], '必殺技＝No.9・10');
  assert.deepEqual(L.filter((m) => m.learn === 'de').map((m) => m.deOrder), [1, 2], '丈夫さ①＝シェルブレイカー・②＝タイダルクラッシュ');
  assert.deepEqual(J(L[2].effects), [{ target: 'opponent', stat: 'hi', dir: 'down', size: 'small', turns: 1 }], 'あわだま＝相手の命中 10%DOWN 1T');
  assert.deepEqual(J(L[3].effects), [{ target: 'self', stat: 'de', dir: 'up', size: 'small', turns: 2 }], 'からにこもる＝自分の丈夫さ 10%UP 2T');
  assert.deepEqual(J(L[7].effects), [{ target: 'self', stat: 'ev', dir: 'up', size: 'small', turns: 2 }], 'しおのステップ＝自分の回避 10%UP 2T');
  assert.ok(L.filter((m) => ![3, 4, 8].includes(m.no)).every((m) => !m.effects.length && !m.ailment && !m.heal), '追加効果は No.3・4・8 だけ（状態異常・回復なし）');
  for (const m of L) { const b = M.moveBySlot(m.slot); assert.deepEqual([b.owner, b.no, b.name], ['kalshell', m.no, m.name]); }
  assert.ok(M.moveBySlot(69).owner === 'razuck' && M.moveBySlot(80) == null, '69 まではラズック・80 は無い');
  // ほかの種族の番号・技は変えていない
  const others = ['solamo', 'gauru', 'regnas', 'jiol', 'flurene', 'razuck'].flatMap((k) => M.movesOf(k).map((m) => m.slot));
  assert.ok(others.every((k) => k >= 0 && k <= 69) && L.every((m) => !others.includes(m.slot)), '0〜69 と重ならない');
  assert.deepEqual(M.movesOf('solamo').map((m) => [m.slot, m.power ?? null]), [[0, 70], [1, 60], [2, 85], [4, 105], [7, null], [3, null], [5, 90], [6, null], [8, 120], [9, 140]]);
  assert.deepEqual(M.movesOf('razuck').map((m) => m.slot), [60, 61, 62, 63, 64, 65, 66, 67, 68, 69]);
  assert.deepEqual(M.PENDING_SPECIES.map((x) => [x.id, x.key]), [[5, 'flurene'], [6, 'razuck'], [7, 'kalshell']]);
});

test('KS-02：隔離＝byId／byKey／keyOf では引けない・SPECIES／市場／ライバル／fight() の相手の表／本編の盤には出ない・触ってはいけないファイルに触れていない', () => {
  assert.equal(M.byId(7), null); assert.equal(M.byKey('kalshell'), null); assert.equal(M.keyOf(7), null, '本編の盤（番号 → キー）では引けない');
  assert.deepEqual(M.SPECIES.map((s) => s.key), ['solamo', 'gauru', 'nobiton', 'jiol'], '正式の4原種は不変');
  assert.deepEqual(J(M.byKey('jiol').base), { li: 120, po: 150, in: 80, hi: 70, ev: 30, de: 160 }, '既存の個体の仕様を変えていない');
  assert.ok(!M.MARKET_CATALOG.some((c) => c.key === 'kalshell'), '市場に出さない');
  assert.ok(!Object.values(M.RIVAL_MONSTERS || {}).some((r) => r && r.key === 'kalshell'), 'ライバルの相棒にもしない');
  assert.match(HTML, /\nconst SP=\[\["ソラモ"[^\n]*\["ガウル"[^\n]*\]\]\];/, 'fight() の相手の表 SP は2種のまま');
  assert.equal((HTML.match(/kalshell/g) || []).length, 1, 'index.html は技アニメのデータの script 1行だけ');
  assert.match(HTML, /<script src="\.\/js\/battle\/razuck-moves-data\.js"><\/script>[^\n]*\n<script src="\.\/js\/battle\/kalshell-moves-data\.js"><\/script>/, 'ラズックのデータの直後');
  assert.ok(HTML.indexOf('kalshell-moves-data.js') < HTML.indexOf('js/battle/art25d.js"'), 'art25d より先に読む');
  for (const f of ['js/chapter/world-board.js', 'js/qa/walk5-1016.js', 'CLAUDE.md', 'js/battle-bridge.js', 'js/integration/adapter.js']) assert.ok(!rd(f).includes('kalshell'), `${f}：触れていない`);
  const arena = rd('js/battle/arena.js');
  assert.match(arena, /const IDLE = \{ 0: 'idle_soramo', 1: 'idle_gauru', 2: 'idle_nobiton', 3: 'idle_jiol', 4: 'idle_regnas' \};/, 'バトルの待機絵の表には入れない（QA の間だけ貸す）');
  assert.match(arena, /const FACE = \{ 0: 'R', 1: 'R', 2: 'R', 3: 'R', 4: 'R' \};/, '待機絵は右向き（既定）＝反転の表に足さない');
  // 旧い14枚の Chapter 1（field-view）の歩行 walk には足さない・本編の盤は keyOf(7) が null＝出ない
  const c = load(['js/phase10/monsters.js', 'js/chapter/engine.js', 'js/chapter/configs/ch1a.js']);
  assert.equal(c.MMCH.getConfig(1).monsterSprites.kalshell.walk, undefined);
});

test('KS-03：素材＝派生 41点の実在・大きさ・原本と派生の sha256（derive_art.json ↔ 各 README）・原本の PNG／MP3・PREVIEW／GIF／MP4 は置かない', () => {
  const der = DJ.derived, org = DJ.originals;
  assert.equal(Object.keys(der).length, 41); assert.equal(Object.keys(org).length, 38, '原本 38（2.5D・待機・表情6・歩行16・カード10・顔・VS・声2）');
  for (const [p, h] of Object.entries(der)) { assert.ok(existsSync(path.join(ROOT, p)), p); assert.equal(sha(p), h, `${p}：派生の sha256`); }
  for (const o of Object.values(org)) assert.match(o.sha256, /^[0-9a-f]{64}$/);
  // 大きさ・透過
  const K = M.pendingSpecies('kalshell');
  for (const [k, w, h] of [['image', 720, 680], ['battleIdle', 859, 720], ['tourIcon', 256, 256], ['vsArt', 512, 512]]) {
    const i = K[k], m = webp(i.src.slice(2)); assert.deepEqual([m.w, m.h], [w, h], k); assert.deepEqual([i.w, i.h], [w, h], `${k}：登録の大きさ`);
  }
  assert.ok(webp('assets/monsters/2p5d/kalshell.webp').alpha && webp('assets/battle/idle/idle_kalshell.webp').alpha, '2.5D・待機絵は透過');
  for (const [i, k] of KINDS.entries()) { const m = webp(`assets/monsters/reactions_1012/kalshell/0${i + 1}_${k}.webp`); assert.ok(m.alpha, k); assert.deepEqual([m.w, m.h], [DJ.reactions[k].w, DJ.reactions[k].h], k); }
  for (const dn of ['front', 'back']) for (let i = 1; i <= 8; i++) assert.deepEqual((({ w, h }) => [w, h])(webp(`assets/monsters/walk_25d/kalshell/kalshell_walk_${dn}_0${i}.webp`)), [384, 384], `${dn}_0${i}`);
  for (const [no, , id] of SPEC) { const f = `assets/moves/cards_1014/kalshell/${String(no).padStart(2, '0')}_${id}.webp`; const m = webp(f); assert.equal(m.w, 640, f); assert.equal(m.h, 360, f); }
  assert.deepEqual((({ w, h }) => [w, h])(webp('assets/monsters/compare_1015/kalshell.webp')), [640, 640], '比較画面の代替（待機絵の顔を中心に切った正方形）');
  assert.deepEqual(DJ.portraitBox.length, 3);
  for (const k of ['normal', 'sad']) for (const ext of ['ogg', 'm4a']) { const f = `assets/audio/voice/monster_1017/kalshell_${k}.${ext}`; assert.ok(statSync(path.join(ROOT, f)).size > 4000, f); }
  assert.deepEqual(DJ.voice.map((v) => [v.id, v.kind, v.gain]), [['cry_kalshell_normal', 'normal', 1.189], ['cry_kalshell_sad', 'sad', 1.109]]);
  assert.ok(DJ.voice.every((v) => 20 * Math.log10(v.gain) <= 3.01 && v.peak + 20 * Math.log10(v.gain) <= -1), '持ち上げは +3dB まで・ピーク −1 dBFS 以下');
  // 原本・プレビューは置かない
  const DIRS = ['assets/monsters/reactions_1012/kalshell', 'assets/monsters/walk_25d/kalshell', 'assets/moves/cards_1014/kalshell', 'assets/battle/kalshell_moves_1018', 'assets/tournament/vs_1017', 'assets/audio/voice/monster_1017', 'tools/kalshell1018'];
  for (const d of DIRS) for (const f of readdirSync(path.join(ROOT, d))) assert.doesNotMatch(f, /\.(png|mp3|gif|mp4|jpe?g)$/i, `${d}/${f}：原本・プレビューは置かない`);
  for (const f of readdirSync(path.join(ROOT, 'assets/monsters/reactions_1012/kalshell'))) assert.doesNotMatch(f, /preview|contact|sheet/i);
  // README：原本と派生の sha256
  const has = (md, p) => { assert.ok(rd(md).includes(der[p]), `${md}：${p} の派生の sha256`); };
  const hasO = (md, k) => { assert.ok(rd(md).includes(org[k].sha256), `${md}：${k} の原本の sha256`); };
  has('assets/monsters/2p5d/README.md', 'assets/monsters/2p5d/kalshell.webp'); hasO('assets/monsters/2p5d/README.md', '2p5d');
  has('assets/battle/idle/README.md', 'assets/battle/idle/idle_kalshell.webp'); hasO('assets/battle/idle/README.md', 'idle');
  for (const k of KINDS) { has('assets/monsters/reactions_1012/README.md', `assets/monsters/reactions_1012/kalshell/0${KINDS.indexOf(k) + 1}_${k}.webp`); hasO('assets/monsters/reactions_1012/README.md', 'reaction_' + k); }
  for (const dn of ['front', 'back']) for (let i = 1; i <= 8; i++) { has('assets/monsters/walk_25d/README.md', `assets/monsters/walk_25d/kalshell/kalshell_walk_${dn}_0${i}.webp`); hasO('assets/monsters/walk_25d/README.md', `walk_${dn}_0${i}`); }
  for (const [no, , id] of SPEC) { has('assets/moves/cards_1014/README.md', `assets/moves/cards_1014/kalshell/${String(no).padStart(2, '0')}_${id}.webp`); hasO('assets/moves/cards_1014/README.md', 'card_' + String(no).padStart(2, '0')); }
  has('assets/tournament/icons_1015/README.md', 'assets/tournament/icons_1015/icon_kalshell.webp'); hasO('assets/tournament/icons_1015/README.md', 'icon');
  has('assets/tournament/vs_1017/README.md', 'assets/tournament/vs_1017/vs_kalshell.webp'); hasO('assets/tournament/vs_1017/README.md', 'vs');
  has('assets/monsters/compare_1015/README.md', 'assets/monsters/compare_1015/kalshell.webp'); assert.match(rd('assets/monsters/compare_1015/README.md'), /カルシェル[^\n]*代替/);
  for (const k of ['normal', 'sad']) { hasO('assets/audio/voice/monster_1017/README.md', 'voice_' + k); has('assets/audio/voice/monster_1017/README.md', `assets/audio/voice/monster_1017/kalshell_${k}.ogg`); }
  const mvmd = rd('assets/battle/kalshell_moves_1018/README.md'); assert.match(mvmd, /sha256\.txt/); assert.match(mvmd, /本体 49|49/);
  const lines = rd('assets/battle/kalshell_moves_1018/sha256.txt').split('\n').filter((l) => /^[0-9a-f]{64}  /.test(l));
  assert.equal(lines.length, 98 + 84, '原本 98（本体 49＋効果 49）＋派生 84');
  assert.equal(readdirSync(path.join(ROOT, 'assets/battle/kalshell_moves_1018')).filter((f) => /\.webp$/.test(f)).length, 84);
  for (const l of lines.slice(98)) { const [h, f] = l.split('  '); assert.equal(sha('assets/battle/kalshell_moves_1018/' + f), h, f); }
  assert.doesNotMatch(rd('tools/kalshell1018/derive_art.py') + rd('tools/kalshell1018/build_moves.py'), /\bimport (scipy|cv2)\b|from (scipy|cv2)/, 'PIL＋numpy だけ');
});

test('KS-04：実戦の表（SK 70〜79・EFF・必殺技 78／79・習得の表）と固有スキル「かたい貝殻」＝被弾ごとに 20% で受けるダメージを 25% 軽減（回数の上限なし・ほかの種族と攻撃側には付かない）', () => {
  const E = loadBattle(), SK = J(E.SK), EFF = J(E.EFF);
  assert.equal(E.R.KAL_FIRST, 70); assert.equal(SK.length, 80);
  for (const [no, name, , type, pw, acc, cr] of SPEC) {
    const r = SK[69 + no];
    assert.equal(r[0], name); assert.equal(r[1], pw == null ? 0 : pw / 100, `${name}：威力`);
    assert.equal(r[7], type === 'wisdom' ? 'i' : 'p', `${name}：計算の能力`); assert.equal(r[8], acc, `${name}：命中`);
    assert.equal(r[9], cr == null ? 0 : cr / 100, `${name}：CR`); assert.equal(r[5], pw == null ? 'd' : 'a');
  }
  assert.deepEqual(EFF[72], [{ tg: 1, st: 'hi', lv: -1, t: 1 }], 'あわだま'); assert.deepEqual(EFF[73], [{ tg: 0, st: 'de', lv: 1, t: 2 }], 'からにこもる'); assert.deepEqual(EFF[77], [{ tg: 0, st: 'ev', lv: 1, t: 2 }], 'しおのステップ');
  for (let k = 70; k <= 79; k++) if (![72, 73, 77].includes(k)) assert.equal(EFF[k], undefined, `SK ${k}：追加効果なし`);
  assert.deepEqual(J(vm.runInContext('[...SPECIAL_MOVES]', E.ctx)).filter((k) => k >= 70), [78, 79], '必殺技＝シェルブレイカー・タイダルクラッシュ');
  assert.deepEqual(J(vm.runInContext('MMP7.getMoveset(7)', E.ctx)), { initial: [70, 71, 72, 73], po: [74], in: [75], hi: [76], ev: [77], de: [78, 79] }, '初期4＋特訓6');
  for (let i = 0; i < 70; i++) assert.ok(SK[i] !== undefined || i >= 50, `SK ${i}：ほかの種族の行はそのまま`);
  // 計算：かしこさ技（No.3・6）・ちから技・補助技（ダメージ 0・自分へのバフ）・相手の命中 DOWN
  const dmg = (k, a, b = unit('相手', 0, {})) => battle(E, a, b).act('A', k).damage;
  for (const [no, , , type] of SPEC) {
    if (type === 'support') continue;
    const k = 69 + no, base = dmg(k, unit('カルシェル', 7, {})), po = dmg(k, unit('カルシェル', 7, { po: 300 })), wi = dmg(k, unit('カルシェル', 7, { in: 300 }));
    assert.ok(base > 0, `${no}：ダメージが出る`);
    if (type === 'wisdom') assert.ok(wi > base && po === base, `${no}：かしこさ計算`); else assert.ok(po > base && wi === base, `${no}：ちから計算`);
  }
  let b = battle(E, unit('カルシェル', 7, {}), unit('相手', 0, {}));
  let r = b.act('A', 73); assert.deepEqual([r.hit, r.damage], [true, 0]);
  let buf = J(b.sess.buffs.A); assert.equal(buf.length, 1); assert.deepEqual([buf[0].category, buf[0].ratio, buf[0].remainingTurns, buf[0].direction], ['defense', 0.1, 2, 'up'], 'からにこもる＝丈夫さ 小UP 2T');
  b.act('A', 73); assert.equal(J(b.sess.buffs.A).length, 1, '掛け直しても足さない');
  r = b.act('A', 77); buf = J(b.sess.buffs.A).find((x) => x.category === 'evasion'); assert.deepEqual([r.damage, buf.ratio, buf.remainingTurns, buf.direction], [0, 0.1, 2, 'up'], 'しおのステップ＝回避 小UP 2T');
  r = b.act('A', 72); assert.ok(r.damage > 0); const deb = J(b.sess.debuffs.B).find((x) => x.category === 'hit'); assert.deepEqual([deb.ratio, deb.remainingTurns, deb.direction], [0.1, 1, 'down'], 'あわだま＝相手の命中 小DOWN 1T');
  // 固有スキル：カルシェルが受ける側・rnd < 0.2 のときだけ 25% 軽減（四捨五入）
  b = battle(E, unit('ガウル', 1, { po: 300 }), unit('カルシェル', 7, { li: 600 }));
  const full = b.act('A', 11, () => 0.2).damage; assert.ok(full > 10, `元のダメージ ${full}`); assert.equal(b.sess.currentLife.B, 600 - full);
  assert.equal(J(b.act('A', 11, () => 0.2)).shellCut, undefined, '20% 以上の乱数では起きない');
  const l0 = b.sess.currentLife.B, t0 = b.sess.totalDamage ? b.sess.totalDamage.A : null;
  r = b.act('A', 11, () => 0.19);
  const cut = Math.round(full * 0.75);
  assert.deepEqual([r.damage, r.shellCut, r.targetLifeAfter, b.sess.currentLife.B], [cut, full - cut, l0 - cut, l0 - cut], '19% の乱数で 25% 軽減');
  if (t0 != null) assert.equal(b.sess.totalDamage.A, t0 + cut, '与えたダメージの記録も軽減後');
  assert.ok(r.rules.notes.some((n) => n.side === 'B' && /かたい貝殻 −25%/.test(n.badge)), '小さな札');
  r = b.act('A', 11, () => 0.0); assert.equal(r.damage, cut, '2回目も起きる（回数の上限なし）');
  r = b.act('A', 11, () => 0.999); assert.equal(r.damage, full, 'ふつうのダメージに戻る');
  // 攻撃側がカルシェルでも、相手がほかの種族でも起きない
  b = battle(E, unit('カルシェル', 7, {}), unit('ソラモ', 0, { li: 600 }));
  const d1 = b.act('A', 70, () => 0.0).damage, d2 = b.act('A', 70, () => 0.99).damage; assert.equal(d1, d2, '攻撃側では起きない');
  b = battle(E, unit('ガウル', 1, { po: 300 }), unit('ソラモ', 0, { li: 600 }));
  assert.equal(b.act('A', 11, () => 0.0).damage, b.act('A', 11, () => 0.99).damage, 'ソラモには付かない');
  // 補助技（ダメージ 0）・外れた技では起きない
  b = battle(E, unit('ソラモ', 0, {}), unit('カルシェル', 7, {}));
  assert.equal(J(b.act('A', 3, () => 0.0)).shellCut, undefined, '吠える（補助）では起きない');
  const miss = b.act('A', 0, () => 0.0, { hitRng: () => 0.999, damageRng: () => 0.5, criticalRng: () => 0.99 }); assert.equal(miss.hit, false); assert.equal(miss.shellCut, undefined);
  // 倒れる一撃も 25% 軽減（軽減後に残れば倒れない）
  b = battle(E, unit('ガウル', 1, { po: 300 }), unit('カルシェル', 7, { li: 600 }));
  const big = b.act('A', 11, () => 0.99).damage; b.sess.currentLife.B = Math.round(big * 0.75) + 1;
  r = b.act('A', 11, () => 0.0); assert.deepEqual([r.ko, b.sess.currentLife.B], [false, 1], '軽減で残る');
  // ジオルの耐えとの順：軽減のあとに判定（カルシェルの札はジオルに出ない）
  assert.match(rd('js/battle/rules.js'), /カルシェル「かたい貝殻」[\s\S]*ジオル「大地の守り」/, 'かたい貝殻 → 大地の守り の順');
  assert.deepEqual(J(M.UNIQUE_SKILLS.unique_kalshell.params).chance, 0.2);
});

test('KS-05：つなぎ＝技アニメ 84枚のデータ・art25d（SK 70〜79）・技カード・表情（MMRXART 7）・比較の絵・対戦表の顔・鳴き声・歩行（ch1a）・QA 試遊だけ', () => {
  // 技アニメのデータ（js/battle/kalshell-moves-data.js）
  const D = load(['js/battle/kalshell-moves-data.js']).MMKSMV_DATA;
  assert.deepEqual(Object.keys(D), ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
  let body = 0, fx = 0; for (const d of Object.values(D)) { body += d.cuts.length; fx += d.cuts.filter((c) => c.fx).length + (d.fx || []).length; }
  assert.deepEqual([body, fx], [49, 35], '本体 49・効果 35（空の効果 14 は作らない）');
  assert.deepEqual(Object.values(D).map((d) => d.hit), [3, 3, 4, null, 4, 5, 5, null, 4, 6], '当たる区切り（補助技は無し）');
  assert.deepEqual(Object.values(D).map((d) => d.cuts.length), M.movesOf('kalshell').map((m) => m.cuts));
  const DIR = 'assets/battle/kalshell_moves_1018/';
  for (const d of Object.values(D)) {
    assert.equal(d.dir, './' + DIR);
    for (const c of d.cuts) { assert.ok(existsSync(path.join(ROOT, DIR, c.f)), c.f); assert.ok(['self', 'lunge', 'move', 'contact', 'back'].includes(c.m), c.m); if (c.fx) assert.ok(existsSync(path.join(ROOT, DIR, c.fx)), c.fx); }
    for (const f of d.fx || []) { assert.ok(existsSync(path.join(ROOT, DIR, f.f)), f.f); assert.ok(['tgt', 'launch'].includes(f.at), f.at); }
  }
  // art25d：SK 70〜79 → データ・プレビュー
  const a = rd('js/battle/art25d.js');
  assert.match(a, /k >= 70 && k <= 79 \? 7 : -1/); assert.match(a, /const SRC_OF = \{ 0: OFF, 1: GOFF, 2: NOFF, 3: JSK, 4: ROFF, 5: FSK, 6: ZSK, 7: KSK \};/);
  assert.match(a, /KK\.map\[69 \+ \+no\] = D\[no\]/, 'データは No. → SK 70＋No−1'); assert.match(a, /kind === 'kalshell'/); assert.match(a, /7: 'kalshell'/);
  // 技カード
  const c = load(['js/phase10/monsters.js', 'js/battle/move-cards.js']);
  for (const [no, name, id] of SPEC) { const x = c.MMMVCARD.bySlot(69 + no); assert.ok(x, name); assert.match(x.src, new RegExp(`cards_1014/kalshell/${String(no).padStart(2, '0')}_${id}\\.webp$`), name); }
  // 表情（MMRXART）
  const X = load(['js/monsters/reaction-art.data.js', 'js/monsters/reaction-art.js']).MMRXART;
  assert.equal(X.SPECIES[7], 'kalshell'); assert.equal(X.all().length, 42);
  for (const [i, k] of KINDS.entries()) { const f = X.info(7, k); assert.equal(f.src, `./assets/monsters/reactions_1012/kalshell/0${i + 1}_${k}.webp`); assert.deepEqual([f.w, f.h, f.hRel], [DJ.reactions[k].w, DJ.reactions[k].h, DJ.reactions[k].hRel], k); }
  assert.equal(X.src('kalshell', 'hit'), X.src(7, 'hit'));
  // 比較の絵（代替）・対戦表の顔・体格
  const cmp = load(['js/phase10/monsters.js', 'js/battle/compare.js']).MMCMP;
  assert.equal(cmp.src(7), './assets/monsters/compare_1015/kalshell.webp'); assert.deepEqual(J(cmp.PORTRAIT[7]), { f: 'kalshell', fx: 0.6, fy: 0.5, k: 1.04 }); assert.equal(cmp.src(8), null);
  assert.equal(cmp.skillName(7), 'かたい貝殻', '比較画面の固有スキルの名前');
  const arena = rd('js/battle/arena.js');
  assert.match(arena, /const TOUR_ICON = Object\.freeze\(\{ 0: 'solamo', 1: 'gauru', 2: 'nobiton', 3: 'jiol', 4: 'regnas', 5: 'flurene', 6: 'razuck', 7: 'kalshell' \}\);/);
  assert.match(arena, /7: '#e1e1e1'/, '顔の絵の背景の灰色'); assert.match(arena, /const SCALE = Object\.freeze\(\{[^}]*7: 0\.91 \}\);/);
  assert.match(rd('js/battle/move-tune-1015.js'), /const SIZE = Object\.freeze\(\{ 0: 2, 1: 3, 2: 2, 3: 4, 4: 3, 5: 3, 6: 1, 7: 3 \}\);/, '体格サイズ 3');
  // 鳴き声
  const reg = rd('js/audio/audio-registry.js');
  assert.match(reg, /cry_kalshell_normal: \{ src: \[PC \+ 'kalshell_normal\.ogg', PC \+ 'kalshell_normal\.m4a'\], npc: 'monster', gain: 1\.189 \}/);
  assert.match(reg, /cry_kalshell_sad: \{ src: \[PC \+ 'kalshell_sad\.ogg', PC \+ 'kalshell_sad\.m4a'\], npc: 'monster', gain: 1\.109 \}/);
  assert.match(rd('js/audio/audio-manager.js'), /const CRY_KEYS = fz\(\['solamo', 'gauru', 'nobiton', 'jiol', 'regnas', 'flurene', 'razuck', 'kalshell'\]\);/);
  // 歩行（ch1a の monsterSprites＝番号 → キーで引けないので本編の盤には出ない）
  const ch = load(['js/phase10/monsters.js', 'js/chapter/engine.js', 'js/chapter/configs/ch1a.js']);
  const S = ch.MMCH.getConfig(1).monsterSprites, K = S.kalshell;
  assert.deepEqual(Object.keys(K.dirs), ['front', 'back']); assert.equal(K.standFace, 'none');
  for (const dn of ['front', 'back']) {
    const d = K.dirs[dn]; assert.deepEqual([d.fps, d.idle, d.h, d.foot, d.face], [12, 0, DJ.walk.h, DJ.walk.foot, 'none']);
    assert.deepEqual(J(d.frames), Array.from({ length: 8 }, (_, i) => `./assets/monsters/walk_25d/kalshell/kalshell_walk_${dn}_0${i + 1}.webp`));
  }
  for (const k of ['solamo', 'nobiton', 'jiol', 'flurene']) assert.ok(S[k].dirs.front.frames.length === 8, `${k}：従来のまま`);
  // QA 試遊だけ（trial.js・qa-top）
  const q = rd('js/qa/trial.js');
  assert.match(q, /\{ sp: 7, key: 'kalshell' \}/); assert.match(q, /7: 'idle_kalshell'/); assert.match(q, /\[5, 6, 7\]/, 'QA の間だけ待機絵を貸す（5・6・7）');
  assert.match(q, /n <= 7/); assert.match(q, /MMKSMV_DATA/); assert.match(q, /未解禁（入手方法は未定・QA の確認だけ）/);
  assert.match(rd('js/qa/qa-top-1017.js'), /全\$\{cat\.length\}体×10技＝\$\{mv\.total\} 枠/);
  // 読み込むスクリプトの一覧（qa-static-guards）・公開確認の道具
  assert.match(rd('tests/qa-static-guards.test.mjs'), /js\/battle\/kalshell-moves-data\.js/);
  assert.match(rd('tools/public-check.mjs'), /kalshell|カルシェル/);
});
