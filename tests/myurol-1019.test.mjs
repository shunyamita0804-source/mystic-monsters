// =========================================================
// 2026-10-19 ミュロル（Myurol）の正式登録＝未解禁・入手条件なし（正式納品「ミュロル 開発本体向け 正式素材仕様一式」PART01〜07・ユーザー承認済みの仕様マスター＋採用状態一覧）
//  MY-01 登録の値：番号 8（予約）・名前・種族表示名は未確定（kind null・候補「水棲種【要確認／仮置き】」）・サイズ 2・初期能力・成長適性・素早さ・固有スキル「しめったはだ」・10技（SK＝80＋No−1・習得区分・追加効果は No.4／8 だけ・No.10＝必殺技・No.3＝「タックル」）
//  MY-02 隔離：byId／byKey／keyOf では引けない・SPECIES／市場／ライバル／fight() の相手の表／本編の盤・CLAUDE.md・world-board・ch1a に触れていない・index.html は script 1行だけ
//  MY-03 素材：派生の実在・大きさ・原本と派生の sha256（derive_art.json ↔ README）・歩行 20コマ（同じ正方形のキャンバス・透過・縦横比）・原本（PNG／MP3）・プレビューは置かない
//  MY-04 実戦の表と計算：SK 80〜89（威力／100・p／i・命中・CR）・EFF（No.4 自分の丈夫さ 小UP 2T／No.8 自分の回避 小UP 2T＝相手にダメージも効果も無し）・必殺技 89・習得の表・
//        固有スキル＝被弾ごとに 20% で攻撃した相手のちから（攻撃系）小ダウン 2T（重ならない・再発動で残りを更新・回数の上限なし・強い下げは上書きしない・攻撃側／補助技／外れ／倒れたときは起きない）
//  MY-05 つなぎ：技アニメ（manifest の 150枚 → 90枚のデータ・区切りの長さ・当たる区切り・No.10 の舞台の座標）・art25d（SK 80〜89・舞台の座標）・技カード・表情（MMRXART 8）・比較の絵・対戦表の顔・鳴き声・歩行（SPEC1018）・QA 試遊だけ
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
const DJ = JSON.parse(rd('tools/myurol1019/derive_art.json'));
const webp = (p) => {
  const b = readFileSync(path.join(ROOT, p)); assert.equal(b.toString('ascii', 0, 4) + b.toString('ascii', 8, 12), 'RIFFWEBP', p);
  const k = b.toString('ascii', 12, 16);
  if (k === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3), alpha: !!(b[20] & 0x10), k };
  if (k === 'VP8L') { const v = b.readUInt32LE(21); return { w: 1 + (v & 0x3fff), h: 1 + ((v >> 14) & 0x3fff), alpha: !!((v >> 28) & 1), k }; }
  return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff, alpha: false, k };
};
// 仕様マスター（01_ミュロル_正式素材仕様マスター_20261019 §3）の写し：No, 名前, ID, 型, 威力, 命中, CR%, 習得
const SPEC = [
  [1, 'しっぽうち', 'shippo_uchi', 'power', 65, 100, 5, 'initial'],
  [2, 'みずでっぽう', 'mizudeppo', 'wisdom', 70, 95, 5, 'initial'],
  [3, 'タックル', 'tackle', 'power', 80, 90, 10, 'initial'],
  [4, 'あわのまもり', 'awa_no_mamori', 'support', null, 100, null, 'initial'],
  [5, 'テールスイング', 'tail_swing', 'power', 100, 85, 15, 'po'],
  [6, 'アクアバブル', 'aqua_bubble', 'wisdom', 100, 90, 10, 'in'],
  [7, 'バブルスナイプ', 'bubble_snipe', 'wisdom', 90, 100, 10, 'hi'],
  [8, 'すいすいステップ', 'suisui_step', 'support', null, 100, null, 'ev'],
  [9, 'スパイラルテール', 'spiral_tail', 'power', 115, 85, 15, 'de'],
  [10, 'マリンストリーム', 'marine_stream', 'wisdom', 125, 85, 20, 'de'],
];
const KINDS = ['joy', 'surprise', 'sad', 'eat', 'hit', 'dodge'];
// 技アニメの manifest（05_skill_animations/NN_技名/manifest.json）の写し：区切りの長さ（duration_ms）・命中エフェクトのある最初のコマ
const MS = [[140, 160, 180, 160], [160, 120, 210, 160], [150, 130, 190, 170], [150, 190, 280, 190], [150, 110, 120, 240, 170], [150, 150, 130, 190, 160], [190, 150, 150, 140, 180],
  [120, 100, 120, 170], [150, 170, 130, 180, 290, 220, 180], [180, 225, 225, 285, 240, 335, 280, 220]];
const HIT = [3, 4, 3, null, 4, 4, 4, null, 5, 6];

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

test('MY-01：登録の値（番号 8・名前・種族名は未確定・サイズ 2・能力・適性・素早さ・固有スキル・10技＝SK 80〜89・習得・追加効果・必殺技・タックル）＝仕様マスターどおり', () => {
  const Y = M.pendingSpecies('myurol');
  assert.ok(Y, 'PENDING_SPECIES に登録'); assert.equal(M.pendingSpecies(8), Y, '番号 8 でも引ける');
  assert.deepEqual([Y.id, Y.key, Y.name, Y.en, Y.kind, Y.size, Y.speed], [8, 'myurol', 'ミュロル', null, null, 2, 6]);
  assert.match(Y.kindCandidate, /水棲種.*要確認/, '種族表示名は【要確認／仮置き】＝確定表示しない（kind は null）');
  assert.deepEqual([Y.unlocked, Y.playerAvailable, Y.obtain, Y.profileImage], [false, false, null, null], '未解禁・入手条件なし・プロフィール画像は捏造しない');
  assert.deepEqual(J(Y.base), { li: 110, po: 70, in: 105, hi: 100, ev: 95, de: 80 });
  assert.equal(Object.values(Y.base).reduce((a, b) => a + b, 0), 560, '合計 560');
  assert.deepEqual(J(Y.growth), { li: 'C', po: 'E', in: 'C', hi: 'B', ev: 'C', de: 'E' });
  const U = M.UNIQUE_SKILLS.unique_myurol;
  assert.equal(Y.uniqueSkill, U);
  assert.deepEqual([U.name, U.species, U.speciesKey, U.implemented], ['しめったはだ', 8, 'myurol', true]);
  assert.deepEqual(J(U.params), { trigger: 'on_damaged', chance: 0.2, target: 'attacker', stat: 'atk', dir: 'down', size: 'small', turns: 2, stack: false, uses: null }, '20%・攻撃した相手のちから小ダウン 2T・重ならない・回数の上限なし');
  assert.match(U.desc, /20%.*ちから.*小ダウン.*-10%.*2ターン/);
  assert.deepEqual(Object.keys(M.UNIQUE_SKILLS).slice(-2), ['unique_kalshell', 'unique_myurol']);
  const L = M.movesOf('myurol');
  assert.equal(Y.moves, M.OFFICIAL_MOVES.myurol.list);
  assert.deepEqual(L.map((m) => [m.no, m.name, m.id, m.type, m.power ?? null, m.accuracy ?? null, m.critical ?? null, m.learn]), SPEC);
  assert.ok(!L.some((m) => /ぷに/.test(m.name)), '旧名「ぷにタックル」は使わない');
  assert.deepEqual(L.map((m) => m.slot), [80, 81, 82, 83, 84, 85, 86, 87, 88, 89], 'SK＝80＋No−1');
  assert.deepEqual(L.map((m) => m.cuts), [4, 4, 4, 4, 5, 5, 5, 4, 7, 8], '技アニメの本体のコマ数（manifest の frame_count）');
  assert.deepEqual(L.map((m) => !!m.finisher), [false, false, false, false, false, false, false, false, false, true], '必殺技＝No.10 だけ（No.9 は威力 115）');
  assert.deepEqual(L.filter((m) => m.learn === 'de').map((m) => m.deOrder), [1, 2], '丈夫さ①＝スパイラルテール・②＝マリンストリーム');
  assert.deepEqual(J(L[3].effects), [{ target: 'self', stat: 'de', dir: 'up', size: 'small', turns: 2 }], 'あわのまもり＝自分の丈夫さ 10%UP 2T');
  assert.deepEqual(J(L[7].effects), [{ target: 'self', stat: 'ev', dir: 'up', size: 'small', turns: 2 }], 'すいすいステップ＝自分の回避 10%UP 2T');
  assert.ok(L.filter((m) => ![4, 8].includes(m.no)).every((m) => !m.effects.length && !m.ailment && !m.heal), '追加効果は No.4・8 だけ');
  for (const m of L) { const b = M.moveBySlot(m.slot); assert.deepEqual([b.owner, b.no, b.name], ['myurol', m.no, m.name]); }
  assert.ok(M.moveBySlot(79).owner === 'kalshell' && M.moveBySlot(90) == null, '79 まではカルシェル・90 は無い');
  const others = ['solamo', 'gauru', 'regnas', 'jiol', 'flurene', 'razuck', 'kalshell'].flatMap((k) => M.movesOf(k).map((m) => m.slot));
  assert.ok(others.every((k) => k >= 0 && k <= 79) && L.every((m) => !others.includes(m.slot)), '0〜79 と重ならない');
  assert.deepEqual(M.PENDING_SPECIES.map((x) => [x.id, x.key]), [[5, 'flurene'], [6, 'razuck'], [7, 'kalshell'], [8, 'myurol']]);
});

test('MY-02：隔離＝byId／byKey／keyOf では引けない・SPECIES／市場／ライバル／fight() の相手の表／本編の盤には出ない・触ってはいけないファイルに触れていない', () => {
  assert.equal(M.byId(8), null); assert.equal(M.byKey('myurol'), null); assert.equal(M.keyOf(8), null, '本編の盤（番号 → キー）では引けない');
  assert.equal(M.speedOf(8), null, '種族の素早さの表（本編）にも入れない');
  assert.deepEqual(M.SPECIES.map((s) => s.key), ['solamo', 'gauru', 'nobiton', 'jiol'], '正式の4原種は不変');
  assert.ok(!M.MARKET_CATALOG.some((c) => c.key === 'myurol'), '市場に出さない');
  assert.ok(!Object.values(M.RIVAL_MONSTERS || {}).some((r) => r && r.key === 'myurol'), 'ライバルの相棒にもしない');
  assert.match(HTML, /\nconst SP=\[\["ソラモ"[^\n]*\["ガウル"[^\n]*\]\]\];/, 'fight() の相手の表 SP は2種のまま');
  assert.equal((HTML.match(/myurol/g) || []).length, 1, 'index.html は技アニメのデータの script 1行だけ');
  assert.match(HTML, /<script src="\.\/js\/battle\/kalshell-moves-data\.js"><\/script>[^\n]*\n<script src="\.\/js\/battle\/myurol-moves-data\.js"><\/script>/, 'カルシェルのデータの直後');
  assert.ok(HTML.indexOf('myurol-moves-data.js') < HTML.indexOf('js/battle/art25d.js"'), 'art25d より先に読む');
  // CLAUDE.md は親のセッションが §3 に記録する（docs/next_1019/claude_md_myurol.md）＝ここでは見ない
  for (const f of ['js/chapter/world-board.js', 'js/chapter/configs/ch1a.js', 'js/chapter/configs/ch2a.js', 'js/battle-bridge.js', 'js/integration/adapter.js', 'js/chapter/world-driver.js'])
    assert.ok(!rd(f).includes('myurol'), `${f}：触れていない（本編の盤・野生・Phase 6）`);
  const arena = rd('js/battle/arena.js');
  assert.match(arena, /const IDLE = \{ 0: 'idle_soramo', 1: 'idle_gauru', 2: 'idle_nobiton', 3: 'idle_jiol', 4: 'idle_regnas' \};/, 'バトルの待機絵の表には入れない（QA の間だけ貸す）');
  assert.match(arena, /const FACE = \{ 0: 'R', 1: 'R', 2: 'R', 3: 'R', 4: 'R' \};/, '待機絵は右向き（既定）');
  // 合体・図鑑・大会の参加者：種族の表（SPECIES）と旧 SP にしか無い＝ミュロルは入らない
  assert.ok(!/myurol|ミュロル/.test(rd('js/phase8/raising.js') + rd('js/phase8/league.js') + rd('js/phase7/progression.js')), '育成・大会・合体の処理に名前で出てこない');
});

test('MY-03：素材＝派生の実在・大きさ・原本と派生の sha256（derive_art.json ↔ 各 README）・歩行 20コマ・原本の PNG／MP3・プレビューは置かない', () => {
  const der = DJ.derived, org = DJ.originals;
  assert.equal(Object.keys(der).length, 45, '2.5D・待機・表情6・カード10・顔・VS・比較・声4・歩行20'); assert.equal(Object.keys(org).length, 42, '原本 42（2.5D・待機・表情6・カード10・顔・VS・声2・歩行20）');
  for (const [p, h] of Object.entries(der)) { assert.ok(existsSync(path.join(ROOT, p)), p); assert.equal(sha(p), h, `${p}：派生の sha256`); }
  for (const o of Object.values(org)) assert.match(o.sha256, /^[0-9a-f]{64}$/);
  assert.equal(org.voice_normal.file, '07_audio/A_tiny_fantasy_aquat_#3-1792332367994.mp3', '通常＝仕様マスター §5 の対応');
  assert.equal(org.voice_sad.file, '07_audio/The_same_tiny_fantas_#1-1792332426355.mp3', '悲しい＝仕様マスター §5 の対応');
  assert.notEqual(org.voice_normal.sha256, org.voice_sad.sha256, '2本は別の中身（同じ大きさだが別物）');
  assert.match(org['2p5d'].file, /02_reactions\/ミュロル_正式2\.5D立ち絵\.png$/); assert.match(org.idle.file, /02_reactions\/ミュロル_正式バトル待機絵\.png$/, '「正式」の名前の待機絵（01_art の Candidate ではない）');
  assert.deepEqual([DJ.artCompare.idle.onlyInOtherMaxAlpha, DJ.artCompare.idle.onlyInUsed, DJ.artCompare.idle.diffWhereBoth], [1, 0, 0], '01_art の候補との差はアルファ 1 の見えない画素だけ');
  const Y = M.pendingSpecies('myurol');
  for (const [k, w, h] of [['image', ...DJ.size2p5d], ['battleIdle', ...DJ.sizeIdle], ['tourIcon', 256, 256], ['vsArt', 512, 512]]) {
    const i = Y[k], m = webp(i.src.slice(2)); assert.deepEqual([m.w, m.h], [w, h], k); assert.deepEqual([i.w, i.h], [w, h], `${k}：登録の大きさ`);
  }
  assert.equal(DJ.sizeIdle[1], 720); assert.equal(Math.max(...DJ.size2p5d), 720);
  assert.ok(webp('assets/monsters/2p5d/myurol.webp').alpha && webp('assets/battle/idle/idle_myurol.webp').alpha, '2.5D・待機絵は透過');
  for (const [i, k] of KINDS.entries()) { const m = webp(`assets/monsters/reactions_1012/myurol/0${i + 1}_${k}.webp`); assert.ok(m.alpha, k); assert.deepEqual([m.w, m.h], [DJ.reactions[k].w, DJ.reactions[k].h], k); }
  for (const [no, , id] of SPEC) { const f = `assets/moves/cards_1014/myurol/${String(no).padStart(2, '0')}_${id}.webp`; const m = webp(f); assert.deepEqual([m.w, m.h], [640, 360], f); }
  assert.deepEqual((({ w, h }) => [w, h])(webp('assets/monsters/compare_1015/myurol.webp')), [640, 640], '比較画面の代替');
  for (const k of ['normal', 'sad']) for (const ext of ['ogg', 'm4a']) { const f = `assets/audio/voice/monster_1017/myurol_${k}.${ext}`; assert.ok(statSync(path.join(ROOT, f)).size > 4000, f); }
  assert.deepEqual(DJ.voice.map((v) => [v.id, v.kind]), [['cry_myurol_normal', 'normal'], ['cry_myurol_sad', 'sad']]);
  assert.ok(DJ.voice.every((v) => v.gain > 0.3 && v.gain < 2 && v.peak + 20 * Math.log10(v.gain) <= -1), 'ピーク −1 dBFS 以下');
  assert.ok(20 * Math.log10(DJ.voice[1].gain) <= 3.01, '悲しみの持ち上げは +3dB まで');
  // 歩行 20コマ（walk_1018 のほかの7体と同じ形）
  const sizes = new Set();
  for (const d of ['front', 'back', 'side', 'backd', 'frontd']) for (let i = 1; i <= 4; i++) {
    const f = `assets/monsters/walk_1018/myurol/${d}_${i}.webp`, m = webp(f); assert.equal(m.w, m.h, `${f}：正方形`); assert.ok(m.alpha, `${f}：透過`); sizes.add(m.w);
  }
  assert.deepEqual([...sizes], [DJ.walk.side], '20コマは同じキャンバス');
  const fr = JSON.parse(rd('tools/walk1018/frames.json')).myurol;
  assert.equal(fr.frames.length, 20); assert.equal(fr.side, DJ.walk.side);
  for (const f of fr.frames) { assert.ok(f.y + f.h === fr.base, `${f.name}：足もとは基線にそろう`); assert.ok(f.w <= f.bbox[2] - f.bbox[0] && f.h === f.bbox[3] - f.bbox[1], `${f.name}：原寸のまま（伸ばしていない＝縦横比は原本のまま）`); }
  assert.deepEqual(fr.frames.map((f) => f.src), Array.from({ length: 20 }, (_, i) => String(i).padStart(2, '0') + '.png'), '00〜19 の順＝front・back・side・backd・frontd');
  assert.deepEqual(JSON.parse(rd('tools/walk1018/derive.json')).myurol, { h: DJ.walk.h, foot: DJ.walk.foot });
  // 原本・プレビューは置かない
  const DIRS = ['assets/monsters/reactions_1012/myurol', 'assets/monsters/walk_1018/myurol', 'assets/moves/cards_1014/myurol', 'assets/battle/myurol_moves_1019', 'assets/tournament/vs_1017', 'assets/audio/voice/monster_1017', 'tools/myurol1019'];
  for (const d of DIRS) for (const f of readdirSync(path.join(ROOT, d))) assert.doesNotMatch(f, /\.(png|mp3|gif|mp4|jpe?g)$/i, `${d}/${f}：原本・プレビューは置かない`);
  // README：原本と派生の sha256
  const has = (md, p) => { assert.ok(rd(md).includes(der[p]), `${md}：${p} の派生の sha256`); };
  const hasO = (md, k) => { assert.ok(rd(md).includes(org[k].sha256), `${md}：${k} の原本の sha256`); };
  has('assets/monsters/2p5d/README.md', 'assets/monsters/2p5d/myurol.webp'); hasO('assets/monsters/2p5d/README.md', '2p5d');
  has('assets/battle/idle/README.md', 'assets/battle/idle/idle_myurol.webp'); hasO('assets/battle/idle/README.md', 'idle');
  assert.match(rd('assets/battle/idle/README.md'), /承認待ち[^\n]*採用状態一覧[^\n]*検収合格/, '古い README と新しい採用状態一覧の食い違いを記録');
  for (const [i, k] of KINDS.entries()) { has('assets/monsters/reactions_1012/README.md', `assets/monsters/reactions_1012/myurol/0${i + 1}_${k}.webp`); hasO('assets/monsters/reactions_1012/README.md', 'reaction_' + k); }
  for (const [no, , id] of SPEC) { has('assets/moves/cards_1014/README.md', `assets/moves/cards_1014/myurol/${String(no).padStart(2, '0')}_${id}.webp`); hasO('assets/moves/cards_1014/README.md', 'card_' + String(no).padStart(2, '0')); }
  has('assets/tournament/icons_1015/README.md', 'assets/tournament/icons_1015/icon_myurol.webp'); hasO('assets/tournament/icons_1015/README.md', 'icon');
  has('assets/tournament/vs_1017/README.md', 'assets/tournament/vs_1017/vs_myurol.webp'); hasO('assets/tournament/vs_1017/README.md', 'vs');
  has('assets/monsters/compare_1015/README.md', 'assets/monsters/compare_1015/myurol.webp'); assert.match(rd('assets/monsters/compare_1015/README.md'), /ミュロル[^\n]*代替/);
  for (const k of ['normal', 'sad']) { hasO('assets/audio/voice/monster_1017/README.md', 'voice_' + k); has('assets/audio/voice/monster_1017/README.md', `assets/audio/voice/monster_1017/myurol_${k}.ogg`); }
  for (let n = 0; n < 20; n++) hasO('assets/monsters/walk_1018/README.md', 'walk_' + String(n).padStart(2, '0'));
  assert.doesNotMatch(rd('tools/myurol1019/derive_art.py') + rd('tools/myurol1019/build_moves.py'), /\bimport (scipy|cv2)\b|from (scipy|cv2)/, 'PIL＋numpy だけ');
});

test('MY-04：実戦の表（SK 80〜89・EFF・必殺技 89・習得の表）・補助技は相手に何もしない・固有スキル「しめったはだ」（20%・ちから小ダウン 2T・重ならず更新・上限なし）', () => {
  const E = loadBattle(), SK = J(E.SK), EFF = J(E.EFF);
  assert.equal(E.R.MYU_FIRST, 80); assert.equal(SK.length, 90);
  for (const [no, name, , type, pw, acc, cr] of SPEC) {
    const r = SK[79 + no];
    assert.equal(r[0], name); assert.equal(r[1], pw == null ? 0 : pw / 100, `${name}：威力`);
    assert.equal(r[7], type === 'wisdom' ? 'i' : 'p', `${name}：計算の能力`); assert.equal(r[8], acc, `${name}：命中`);
    assert.equal(r[9], cr == null ? 0 : cr / 100, `${name}：CR`); assert.equal(r[5], pw == null ? 'd' : 'a');
  }
  assert.deepEqual(EFF[83], [{ tg: 0, st: 'de', lv: 1, t: 2 }], 'あわのまもり'); assert.deepEqual(EFF[87], [{ tg: 0, st: 'ev', lv: 1, t: 2 }], 'すいすいステップ');
  for (let k = 80; k <= 89; k++) if (![83, 87].includes(k)) assert.equal(EFF[k], undefined, `SK ${k}：追加効果なし`);
  assert.deepEqual(J(vm.runInContext('[...SPECIAL_MOVES]', E.ctx)).filter((k) => k >= 80), [89], '必殺技＝マリンストリームだけ');
  assert.deepEqual(J(vm.runInContext('MMP7.getMoveset(8)', E.ctx)), { initial: [80, 81, 82, 83], po: [84], in: [85], hi: [86], ev: [87], de: [88, 89] }, '初期4＋特訓6');
  assert.equal(SK[79][0], 'タイダルクラッシュ', 'カルシェルの行はそのまま');
  // 計算：かしこさ技・ちから技
  const dmg = (k, a, b = unit('相手', 0, {})) => battle(E, a, b).act('A', k).damage;
  for (const [no, , , type] of SPEC) {
    if (type === 'support') continue;
    const k = 79 + no, base = dmg(k, unit('ミュロル', 8, {})), po = dmg(k, unit('ミュロル', 8, { po: 300 })), wi = dmg(k, unit('ミュロル', 8, { in: 300 }));
    assert.ok(base > 0, `${no}：ダメージが出る`);
    if (type === 'wisdom') assert.ok(wi > base && po === base, `${no}：かしこさ計算`); else assert.ok(po > base && wi === base, `${no}：ちから計算`);
  }
  // 補助技：ダメージ 0・相手のライフと能力は変わらない・自分にだけ 小UP 2T・掛け直しても足さない
  let b = battle(E, unit('ミュロル', 8, {}), unit('相手', 0, { li: 600 }));
  for (const [k, cat] of [[83, 'defense'], [87, 'evasion']]) {
    const r = b.act('A', k, () => 0.0);
    assert.deepEqual([r.hit, r.damage, b.sess.currentLife.B], [true, 0, 600], `SK ${k}：相手にダメージを与えない`);
    assert.ok(r.effectsApplied.every((e) => e.target === 'A'), `SK ${k}：効果は自分だけ`);
    assert.deepEqual([J(b.sess.buffs.B).length, J(b.sess.debuffs.B).length], [0, 0], `SK ${k}：相手の能力は変わらない`);
    const buf = J(b.sess.buffs.A).filter((x) => x.category === cat); assert.equal(buf.length, 1); assert.deepEqual([buf[0].ratio, buf[0].remainingTurns, buf[0].direction], [0.1, 2, 'up']);
  }
  b.act('A', 83); assert.equal(J(b.sess.buffs.A).filter((x) => x.category === 'defense').length, 1, '掛け直しても足さない');
  // 固有スキル：ミュロルが受ける側・rnd < 0.2 のときだけ、攻撃した側（A）の攻撃系を 小DOWN 2T
  b = battle(E, unit('ガウル', 1, { po: 300 }), unit('ミュロル', 8, { li: 999 }));
  const d0 = b.act('A', 11, () => 0.2).damage; assert.ok(d0 > 10, `元のダメージ ${d0}`);
  assert.equal(J(b.sess.debuffs.A).length, 0, '20% 以上の乱数では起きない');
  let r = b.act('A', 11, () => 0.19);
  assert.equal(r.damage, d0, 'ダメージは変えない（受けたあとに起きる）'); assert.equal(r.dampSkin, true);
  let deb = J(b.sess.debuffs.A); assert.equal(deb.length, 1);
  assert.deepEqual([deb[0].category, deb[0].ratio, deb[0].remainingTurns, deb[0].direction, deb[0].stackable], ['attack', 0.1, 2, 'down', false], '攻撃した相手のちから（攻撃系）小ダウン 2T');
  assert.ok(r.effectsApplied.some((e) => e.target === 'A' && e.effect.category === 'attack' && e.effect.direction === 'down'), 'fight() の文と能力の札へ（effectsApplied）');
  assert.ok(r.rules.notes.some((n) => n.side === 'B' && n.badge === 'しめったはだ'), '小さな札');
  assert.ok(b.act('A', 11, () => 0.99).damage < d0, '下がったあとはガウルのダメージが減る');
  // 重ならない・再発動で残りターンを更新・回数の上限なし
  b.sess.debuffs.A = b.sess.debuffs.A.map((x) => Object.assign({}, x, { remainingTurns: 1 }));
  r = b.act('A', 11, () => 0.0); deb = J(b.sess.debuffs.A);
  assert.deepEqual([deb.length, deb[0].remainingTurns, deb[0].ratio], [1, 2, 0.1], '2回目＝足さずに残りを 2 へ更新');
  r = b.act('A', 11, () => 0.0); assert.equal(J(b.sess.debuffs.A).length, 1, '3回目も重ならない（回数の上限なし）'); assert.equal(r.dampSkin, true);
  // 強い下げ（中）が既にあれば上書きしない（従来の規則）
  b = battle(E, unit('ガウル', 1, { po: 300 }), unit('ミュロル', 8, { li: 999 }));
  b.sess.debuffs.A = [E.B.createEffect({ category: 'attack', direction: 'down', size: 'medium', remainingTurns: 2, appliedTurn: 1, stackable: false })];
  r = b.act('A', 11, () => 0.0); deb = J(b.sess.debuffs.A);
  assert.deepEqual([deb.length, deb[0].ratio, r.dampSkin, r.rules.notes.some((n) => n.badge === 'しめったはだ')], [1, 0.2, undefined, false], '中の下げはそのまま・札も出ない');
  // 攻撃側がミュロル・相手がほかの種族・補助技・外れ・倒れたときは起きない
  b = battle(E, unit('ミュロル', 8, {}), unit('ソラモ', 0, { li: 600 })); b.act('A', 80, () => 0.0);
  assert.deepEqual([J(b.sess.debuffs.A).length, J(b.sess.debuffs.B).length], [0, 0], '攻撃側では起きない');
  b = battle(E, unit('ガウル', 1, {}), unit('ソラモ', 0, { li: 600 })); b.act('A', 11, () => 0.0); assert.equal(J(b.sess.debuffs.A).length, 0, 'ソラモには付かない');
  b = battle(E, unit('ソラモ', 0, {}), unit('ミュロル', 8, {}));
  r = b.act('A', 3, () => 0.0); assert.ok(!r.dampSkin, '吠える（補助）では起きない');
  r = b.act('A', 0, () => 0.0, { hitRng: () => 0.999, damageRng: () => 0.5, criticalRng: () => 0.99 }); assert.equal(r.hit, false); assert.ok(!r.dampSkin, '外れでは起きない');
  b = battle(E, unit('ガウル', 1, { po: 300 }), unit('ミュロル', 8, { li: 600 })); b.sess.currentLife.B = 1;
  r = b.act('A', 11, () => 0.0); assert.equal(r.ko, true); assert.ok(!r.dampSkin, '倒れたときは起きない');
  assert.match(rd('js/battle/rules.js'), /カルシェル「かたい貝殻」[\s\S]*ミュロル「しめったはだ」[\s\S]*ジオル「大地の守り」/, '受けたダメージが決まったあと');
});

test('MY-05：つなぎ＝技アニメ（manifest 150枚 → 90枚・区切りの長さ・当たる区切り・No.10 の舞台の座標）・art25d・技カード・表情・比較の絵・対戦表の顔・鳴き声・歩行・QA 試遊だけ', () => {
  const D = load(['js/battle/myurol-moves-data.js']).MMMYMV_DATA;
  assert.deepEqual(Object.keys(D), ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
  const V = Object.values(D);
  assert.equal(V.reduce((a, d) => a + d.files, 0), 150, 'manifest の 150枚（本体・技エフェクト・命中エフェクト）');
  assert.deepEqual(V.map((d) => d.steps), M.movesOf('myurol').map((m) => m.cuts));
  assert.deepEqual(V.map((d) => J(d.ms)), MS, '区切りの長さ＝manifest の duration_ms');
  assert.deepEqual(V.map((d) => d.hit), HIT, '当たる区切り（補助技は無し）＝命中エフェクトのある最初のコマ');
  assert.deepEqual(V.map((d) => d.cuts.filter((c) => c.fx).length), [1, 2, 1, 3, 4, 4, 3, 3, 4, 0], '本体と同じ切り出しの技エフェクト');
  assert.deepEqual(V.map((d) => d.fx.filter((f) => f.at === 'tgt').length), [1, 1, 1, 0, 2, 1, 1, 0, 2, 0], '相手の位置の命中エフェクト');
  const DIR = 'assets/battle/myurol_moves_1019/';
  for (const d of V) {
    assert.equal(d.dir, './' + DIR);
    for (const c of d.cuts) { assert.ok(existsSync(path.join(ROOT, DIR, c.f)), c.f); assert.ok(['self', 'move', 'contact'].includes(c.m), c.m); if (c.fx) assert.ok(existsSync(path.join(ROOT, DIR, c.fx)), c.fx); if (c.r) assert.ok(c.r[0] > 0 && c.r[0] < 0.6 && c.m !== 'self', `${c.src}：前へ出る割合 ${c.r}`); }
    for (const f of d.fx) { assert.ok(existsSync(path.join(ROOT, DIR, f.f)), f.f); assert.ok(['tgt', 'stage'].includes(f.at), f.at); }
  }
  assert.deepEqual(J(D[1].cuts[2].r), [0.317, 0.317], 'しっぽうち 3コマ目＝dx 260 ÷ 820');
  // No.10：舞台の座標（本体の動きに付けない）
  const T = D[10];
  assert.deepEqual([J(T.stage.size), J(T.stage.bodyRect), J(T.stage.target), T.stage.sc], [[1280, 720], [66, 270, 315, 315], [1070, 510], 0.45]);
  assert.deepEqual(J(T.stage.order), ['fx', 'body', 'hit_fx'], '描く順＝津波 → 本体 → 命中');
  assert.ok(T.cuts.every((c) => c.m === 'self' && !c.fx), '本体はその場・同じ切り出しの効果なし');
  const st = J(T.fx).filter((f) => f.at === 'stage');
  assert.deepEqual(st.filter((f) => f.layer === 'fx').map((f) => f.t[0]), [0, 1, 2, 3, 4, 5, 6], '津波＝1〜7コマ目');
  assert.deepEqual(st.filter((f) => f.layer === 'hit').map((f) => f.t[0]), [5, 6], '命中＝6・7コマ目');
  for (const f of st) { const [l, t, w, h] = f.sr, [L, Tp, W, H] = f.rect; assert.ok(l >= L - 0.01 && t >= Tp - 0.01 && l + w <= L + W + 0.01 && t + h <= Tp + H + 0.01, `${f.src}：切り出しは manifest の矩形の中`); }
  const h6 = st.find((f) => f.layer === 'hit' && f.t[0] === 5); assert.ok(Math.abs(h6.sr[0] + h6.sr[2] / 2 - 1070) < 60, '命中の中心は舞台の相手の中心の近く');
  const w1 = st.find((f) => f.layer === 'fx' && f.t[0] === 0); assert.ok(w1.sr[0] + w1.sr[2] / 2 < T.stage.feet[0], '1コマ目の津波は本体の後ろ（左）から');
  // sha256.txt：原本 150・派生 90（中身と一致）
  const lines = rd(DIR + 'sha256.txt').split('\n').filter((l) => /^[0-9a-f]{64}  /.test(l));
  assert.equal(lines.length, 150 + 90);
  assert.equal(readdirSync(path.join(ROOT, DIR)).filter((f) => /\.webp$/.test(f)).length, 90);
  for (const l of lines.slice(150)) { const [h, f] = l.split('  '); assert.equal(sha(DIR + f), h, f); }
  assert.ok(lines.slice(0, 150).every((l) => /05_skill_animations\/\d\d_[^/]+\/(body|fx|hit_fx)\/[^/]+\.png$/.test(l)), '原本は manifest のパス');
  // art25d：SK 80〜89 → データ・舞台の座標・区切りの長さ・プレビュー
  const a = rd('js/battle/art25d.js');
  assert.match(a, /k >= 80 && k <= 89 \? 8 : -1/); assert.match(a, /const SRC_OF = \{ 0: OFF, 1: GOFF, 2: NOFF, 3: JSK, 4: ROFF, 5: FSK, 6: ZSK, 7: KSK, 8: YSK \};/);
  assert.match(a, /YK\.map\[79 \+ \+no\] = D\[no\]/, 'データは No. → SK 80＋No−1'); assert.match(a, /kind === 'myurol'/); assert.match(a, /8: 'myurol'/);
  assert.match(a, /c\.at === 'stage'/); assert.match(a, /put\(im, c\.layer === 'fx' \? 6 : 8\)/, '津波は本体（7）の後ろ・命中は前');
  assert.match(a, /Array\.isArray\(d\.ms\)/, '区切りの長さ（ms）の比');
  // 技カード
  const c = load(['js/phase10/monsters.js', 'js/battle/move-cards.js']);
  for (const [no, name, id] of SPEC) { const x = c.MMMVCARD.bySlot(79 + no); assert.ok(x, name); assert.match(x.src, new RegExp(`cards_1014/myurol/${String(no).padStart(2, '0')}_${id}\\.webp$`), name); }
  // 表情（MMRXART）
  const X = load(['js/monsters/reaction-art.data.js', 'js/monsters/reaction-art.js']).MMRXART;
  assert.equal(X.SPECIES[8], 'myurol'); assert.equal(X.all().length, 48);
  for (const [i, k] of KINDS.entries()) { const f = X.info(8, k); assert.equal(f.src, `./assets/monsters/reactions_1012/myurol/0${i + 1}_${k}.webp`); assert.deepEqual([f.w, f.h, f.hRel], [DJ.reactions[k].w, DJ.reactions[k].h, DJ.reactions[k].hRel], k); }
  // 比較の絵（代替）・対戦表の顔・体格
  const cmp = load(['js/phase10/monsters.js', 'js/battle/compare.js']).MMCMP;
  assert.equal(cmp.src(8), './assets/monsters/compare_1015/myurol.webp'); assert.deepEqual(J(cmp.PORTRAIT[8]), { f: 'myurol', fx: DJ.portraitFace[0], fy: DJ.portraitFace[1], k: 1.04 }); assert.equal(cmp.src(9), null);
  assert.equal(cmp.skillName(8), 'しめったはだ', '比較画面の固有スキルの名前');
  const arena = rd('js/battle/arena.js');
  assert.match(arena, /const TOUR_ICON = Object\.freeze\(\{[^}]*7: 'kalshell', 8: 'myurol' \}\);/);
  assert.ok(arena.includes(`8: '${DJ.iconBg}'`), '顔の絵の背景の灰色'); assert.match(arena, /const SCALE = Object\.freeze\(\{[^}]*8: 0\.91 \}\);/);
  const tune = rd('js/battle/move-tune-1015.js');
  assert.match(tune, /const SIZE = Object\.freeze\(\{ 0: 2, 1: 3, 2: 2, 3: 4, 4: 3, 5: 3, 6: 1, 7: 3, 8: 2 \}\);/, '体格サイズ 2'); assert.match(tune, /8: 0\.906 \}\);/);
  // 鳴き声
  const reg = rd('js/audio/audio-registry.js');
  for (const v of DJ.voice) assert.ok(reg.includes(`${v.id}: { src: [PC + 'myurol_${v.kind}.ogg', PC + 'myurol_${v.kind}.m4a'], npc: 'monster', gain: ${v.gain} }`), v.id);
  assert.match(rd('js/audio/audio-manager.js'), /const CRY_KEYS = fz\(\['solamo', 'gauru', 'nobiton', 'jiol', 'regnas', 'flurene', 'razuck', 'kalshell', 'myurol'\]\);/);
  // 歩行（walk_1018 と同じ・本編の盤は keyOf(8)＝null で引けない）
  const W = load(['js/qa/walk5-1016.js'], { location: { search: '' }, URLSearchParams }).MMQAW;
  assert.deepEqual(J(W.SPEC7.myurol), { h: DJ.walk.h, foot: DJ.walk.foot }); assert.equal(W.sets('myurol').frontd.frames[3], './assets/monsters/walk_1018/myurol/frontd_4.webp');
  assert.equal(W.sets('myurol').side.face, 'right', '右向きの絵＝左は反転');
  // QA 試遊だけ（trial.js）
  const q = rd('js/qa/trial.js');
  assert.match(q, /\{ sp: 8, key: 'myurol' \}/); assert.match(q, /8: 'idle_myurol'/); assert.match(q, /\[5, 6, 7, 8\]/, 'QA の間だけ待機絵を貸す');
  assert.match(q, /n <= 8/); assert.match(q, /MMMYMV_DATA/); assert.match(q, /if \(sp === 8\) \{ const f = m\.pendingSpecies\('myurol'\)/);
  assert.match(rd('tests/qa-static-guards.test.mjs'), /js\/battle\/myurol-moves-data\.js/);
  assert.match(rd('tools/public-check.mjs'), /myurol|ミュロル/);
});
