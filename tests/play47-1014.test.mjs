// =========================================================
// 2026-10-14 実機試遊47項目（ZIP「ミスモン_47項目_実機動画7本_最高品質化_Claude今夜一括修正_20261014」）
//  P47-01 牧場は最大20体（ユーザー正式）・所持上限 21・牧場の画面の「同行中／預かり中」
//  P47-02 育成バランス⑲：Chapter ごとの成長量（GROWTH_GAIN_BY_CH）・Chapter 1 の配置の割合（TUNING.density）
//  P47-03 遭遇⑩：「バトルする」の確認を出さない（世界のボード・Chapter 2 の盤・旧ボード）・自動の開始は1回だけ・bBattleGo は二重に始めない
//  P47-04 前後の順①㉒：回したあとの奥行きで z を決める・向きが変わったら並べ直す・GOAL の大会会場⑭
//  P47-05 音⑤⑨⑫：立体サイコロの投げる音つきの1本・まだ読めていない SE は合成音へ落とさずデコードしだい鳴らす・固有スキルの発動の音（Mixkit 3.500秒）
//  P47-06 バトル⑥⑪⑬⑯⑰：LOSE は 4.6秒で「もどる」・固有スキルのカメラの余韻・ライバル戦のあとの会話・比較画面の説明なし・ルーレットの正式カード
//  P47-07 盤のイベント④⑮㉜：宝箱のカットイン（用途の決まった宝箱だけ）・正門前 → ロビー・案内文
//  P47-08 施設・UI：アイテム屋の商品カード・セーブのスロット・プロローグの字幕（文章・時刻は不変）・正式 UI の絵を読めるまで見せない
//  P47-09 サイコロ③：対称版の面（README の sha256）・着地で縦横の比を変えない
//  P47-10 除外3項目（No.23・No.26・Q01）は変えていない
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const HTML = rd('index.html');
const sha = (p) => crypto.createHash('sha256').update(readFileSync(path.join(ROOT, p))).digest('hex');
const fnOf = (name) => { const i = HTML.indexOf(`function ${name}(`); assert.ok(i >= 0, name); return HTML.slice(i, HTML.indexOf('\n', i)); };
const fnBody = (name) => { const i = HTML.indexOf(`function ${name}(`); assert.ok(i >= 0, name); return HTML.slice(i, HTML.indexOf('\nfunction ', i + 10)); };
const loadMon = () => { const w = {}; new Function('window', rd('js/phase10/monsters.js'))(w); return w.MMP10M; };

test('P47-01：牧場は最大20体（2026-10-14 ユーザー正式）・所持上限は牧場20＋連れている1＝21体・牧場の画面は「同行中／預かり中（空き）」', () => {
  const M = loadMon();
  assert.equal(M.RANCH_LIMIT, 20); assert.equal(M.OWN_LIMIT, 21);
  assert.equal(M.canPurchase({ g: 9999 }, 'solamo', 20).ok, true); assert.deepEqual(M.canPurchase({ g: 9999 }, 'solamo', 21), { ok: false, reason: 'full' });
  const f = fnBody('farm');
  assert.ok(f.includes('同行中（連れている子）') && f.includes('預かり中（牧場にいる子）'), '見出し');
  assert.match(f, /預かり中 <b>\$\{S\.box\.length\}<\/b> \/ \$\{L\}<small>（空き \$\{Math\.max\(0,L-S\.box\.length\)\}）<\/small>/);
  assert.match(fnOf('dep'), /if\(S\.box\.length>=MMP10M\.RANCH_LIMIT\)return farm\("牧場がいっぱいです。","b"\);/, '上限の判定は従来の1か所');
});

test('P47-02：育成バランス⑲＝Chapter ごとの成長量（Chapter 1 は1回の上昇を下げ、2→3→4 と穏やかに上げる）・Chapter 1 の配置は能力マスを増やし無地を減らす', () => {
  const M = loadMon();
  assert.deepEqual(JSON.parse(JSON.stringify(M.GROWTH_GAIN_BY_CH)), { 1: { A: 20, B: 18, C: 16, D: 12, E: 9 }, 2: { A: 25, B: 23, C: 20, D: 16, E: 12 }, 3: { A: 29, B: 27, C: 23, D: 18, E: 14 }, 4: { A: 33, B: 30, C: 26, D: 20, E: 15 } });
  for (const g of ['A', 'B', 'C', 'D', 'E']) for (let c = 1; c < 4; c++) assert.ok(M.GROWTH_GAIN_BY_CH[c + 1][g] > M.GROWTH_GAIN_BY_CH[c][g], `${g}：Chapter ${c} → ${c + 1} で上がる`);
  assert.deepEqual({ ...M.GROWTH_GAIN }, { A: 25, B: 21, C: 18, D: 14, E: 11 }, 'Chapter の分からない所の控えは従来の表');
  const mon = (ch, sp = 3) => ({ sp, raise: ch == null ? null : { ch } });
  assert.equal(M.growthGain(mon(1), 'po'), 20); assert.equal(M.growthGain(mon(2), 'po'), 25); assert.equal(M.growthGain(mon(3), 'po'), 29); assert.equal(M.growthGain(mon(4), 'po'), 33);
  assert.equal(M.growthGain(mon(1), 'in'), 9, 'ジオルのかしこさ E＝Chapter 1 の +9'); assert.equal(M.growthGain(mon(null), 'po'), 25, '育成の外＝控えの表');
  const w = {}; for (const f of ['js/phase10/monsters.js', 'js/chapter/engine.js', 'js/chapter/configs/ch1a.js', 'js/proto/roadfirst-data.js', 'js/proto/roadfirst-routes.js', 'js/proto/roadfirst-core.js', 'js/proto/roadfirst-play.js']) new Function('window', rd(f))(w);
  assert.deepEqual({ ...w.MMRF_PLAY.TUNING.density }, { stat: 0.45, event: 0.15, rest: 0.06, wild: 0.08, treasure: 0.06 });
  // 配置の実物：無地が約2割まで減る（序盤の落ち着いた区間・固定の地点を除いた割合）
  let stat = 0, empty = 0, all = 0;
  for (let s = 1; s <= 40; s++) { const L = w.MMRF_PLAY.layout(w.MMRF_DATA, (s * 2654435761) >>> 0, { bias: true }); for (const id of Object.keys(w.MMRF_DATA.nodes)) { const t = L.tiles ? L.tiles[id] : L[id]; if (w.MMRF_DATA.nodes[id] == null) continue; all++; if (!t) empty++; else if (t.t === 'stat') stat++; } }
  assert.ok(stat / all > 0.33 && empty / all < 0.33, `能力 ${(100 * stat / all).toFixed(1)}%・無地 ${(100 * empty / all).toFixed(1)}%`);
});

test('P47-03：遭遇⑩＝「バトルする」の確認は出さない（世界のボード・Chapter 2 の盤・旧ボード）・1つの遭遇で自動の開始は1回・bBattleGo は二重に始めない', () => {
  const WB = rd('js/chapter/world-board.js'), FV = rd('js/chapter/field-view.js');
  assert.doesNotMatch(WB + FV, /onclick="bBattleGo\(\)"/, '盤に「バトルする」のボタンは無い');
  assert.doesNotMatch(HTML, /onclick="bBattleGo\(\)">練習試合に挑戦する/, '旧ボードの確認のボタンも無い');
  assert.match(WB, /const AUTO_BT = new WeakSet\(\);/); assert.match(WB, /function autoBattle\(m, ms\) \{\n    const p = m\.raise\.pend; if \(!p \|\| AUTO_BT\.has\(p\)\) return; AUTO_BT\.add\(p\);/);
  assert.match(FV, /const AUTO_BT = new WeakSet\(\);/); assert.match(FV, /if \(ph === 'battle'\) autoBattle\(m, 900\);/);
  assert.match(HTML, /const P9_AUTO_BT=new WeakSet\(\);/); assert.match(HTML, /setTimeout\(\(\)=>p9AutoBattle\(m\),0\)/);
  assert.match(fnOf('bBattleGo'), /^function bBattleGo\(\)\{const m=S\.m;if\(bBusy\|\|!m\|\|document\.getElementById\("bt"\)\|\|document\.getElementById\("tvs"\)\|\|MMP8\.boardPhase\(m\)!=="battle"\)return;/);
  // VS に入るときボードの曲を止める⑧・影は相手の待機立ち絵から㉔・「あなた／相手」の札㉕
  assert.match(HTML, /try\{MMAUDIO\.stopBgm\(\{fade:"quick"\}\)\}catch\(e\)\{\} \/\/ 2026-10-14 実機試遊⑧/);
  assert.match(WB, /MMARENA\.flipOf\(1, /); assert.match(WB, /\.idleSrc\(/);
  assert.match(rd('js/battle/arena.js'), /2026-10-14 実機試遊㉕/);
  // 負けたあとは再戦しない（pend が無ければ何もしない）・自動の開始は会話・演出の間は待つ
  assert.match(WB, /m\.raise\.pend !== p \|\| P8\(\)\.boardPhase\(m\) !== 'battle'\) return;/);
  assert.match(FV, /document\.querySelector\('\.mmtalk,\.chintro,\.chf-enc2'\)/);
});

test('P47-04：前後の順①㉒＝回したあとの奥行き（x·sinθ＋y·cosθ）・向きが 3°以上変わったら並べ直す・大会会場はカメラから見て GOAL のすぐ奥⑭', () => {
  const RW = rd('js/proto/roadfirst-world.js');
  assert.match(RW, /const zOf = \(y, dz, x\) => \{ const a = rad\(zYaw\); return Z0 \+ Math\.round\(\(\(x \|\| 0\) \* Math\.sin\(a\) \+ y \* Math\.cos\(a\)\) \* 4\) \+ \(dz \|\| 0\); \};/);
  assert.match(RW, /function zSync\(yaw\)/);
  assert.match(RW, /const gp = props\[props\.length - 1\]; gp\.solid = true;/);
  // 回したあとの奥行き：北が上（θ=0）は従来どおり y の順・90° 回すと x の順
  const zOf = (y, x, deg) => { const a = deg * Math.PI / 180; return Math.round((x * Math.sin(a) + y * Math.cos(a)) * 4); };
  assert.ok(zOf(100, 0, 0) > zOf(50, 900, 0), '北が上＝y だけ'); assert.ok(zOf(50, 900, 90) > zOf(100, 0, 90), '90° 回すと x の大きいほうが手前');
});

test('P47-05：音⑤⑨⑫＝立体サイコロの投げる音つきの1本（1ロール1回）・まだ読めていない SE はデコードしだい鳴らす（合成音へ落とさない）・固有スキルの発動の音（Mixkit 3.500秒）', () => {
  const R = rd('js/audio/audio-registry.js');
  assert.match(R, /DICE_CUBE:\s*\{ src: SE_DIR \+ 'dice_1014\/dice_cube_throw_land2\.ogg', gain: 0\.9 \}/);
  assert.equal(sha('assets/audio/se/dice_1014/dice_cube_throw_land2.ogg'), 'd7bc60c14e735c5fc3d5edb65846038d35241267d62b55ac924bb6b2d2aff45b');
  assert.ok(rd('assets/audio/se/dice_1014/README.md').includes('d7bc60c14e735c5fc3d5edb65846038d35241267d62b55ac924bb6b2d2aff45b'));
  assert.match(rd('tools/dice1014/se_throw.py'), /01_dice_large_full\.ogg/);
  const AM = rd('js/audio/audio-manager.js');
  assert.match(AM, /const SE_LATE_MS = 800;/); assert.match(AM, /f\.want = \{ opts: \{ \.\.\.opts, wait: 0 \}, until: now \+ \(opts\.late != null \? opts\.late : SE_LATE_MS\) \}/);
  assert.match(rd('js/chapter/world-board.js'), /const PRE_SE = \['DICE_CUBE', 'DICE_THROW', 'WILD_ALERT', 'RARE_ALERT', 'RIVAL_APPEAR', 'MATCHUP', 'BATTLE_START', 'BATTLE_WIN', 'BATTLE_LOSE'/);
  assert.match(R, /SKILL_ACTIVATE:\s*\{ src: \[SKL \+ 'skill_activate_shot_light_energy_3p5s\.ogg', SKL \+ 'skill_activate_shot_light_energy_3p5s\.m4a'\], gain: 0\.55 \}/);
  assert.match(R, /TREASURE_TIER_4:\s*\{ src: MMO \+ '12_treasure_open_tier4\.ogg'/, '宝箱の第4段階の登録はそのまま');
  for (const [f, h] of [['skill_activate_shot_light_energy_3p5s.ogg', 'ea917590bebd0cbc4a8102ed6640d49dea611f97eff06bbde0d4664e89ac97d2'], ['skill_activate_shot_light_energy_3p5s.m4a', 'b78af09cec677ae01c610ae81592c8f67152ce700a708e9505ec35908f04f0d9']]) {
    assert.equal(sha(`assets/audio/se/skill_1014/${f}`), h, `${f}＝ユーザーの納品と同じ（加工なし）`); assert.ok(rd('assets/audio/se/skill_1014/README.md').includes(h));
  }
  const C = rd('AUDIO_CREDITS.md'); assert.match(C, /Mixkit「Shot light energy flowing」（音源 ID 2589）/); assert.match(C, /単体で配布しない/);
});

test('P47-06：バトル⑥⑪⑬⑯⑰＝LOSE は 4.6秒で「もどる」（WIN 4.0秒）・固有スキルのカメラは寄り終わってから長く・ライバル戦のあとの会話（ボードへ戻ってから）・比較画面は説明なし・ルーレットの絵は正式カード', () => {
  assert.match(HTML, /RJ_MS=\{win:4000,lose:4600\}/);
  assert.match(rd('js/battle/arena.js'), /'#bt\[data-rj\] \.gow,#bt\[data-rj\] #go\{transition:opacity \.3s ease-out\}'/);
  assert.match(rd('js/battle/rules.js'), /const CUT = Object\.freeze\(\{ in: 270, hold: 1740, out: 330,/);
  assert.match(HTML, /const RYU_WIN_TALK=\{1:\[\{npc:"ryu",expression:"soft_smile",text:"やるじゃん！ でも、次は負けないからな。",voice:"ryu_praise"\},\{npc:"fina"/);
  assert.match(HTML, /const RYU_LOSE_TALK=\{1:\[\{npc:"ryu",expression:"confident",text:"へへっ、今日は俺の勝ちだな！",voice:"ryu_chuckle"\},\{npc:"fina"/);
  assert.match(HTML, /if\(bt=="rival"&&!f\.interrupted\)rivalWinTalk\(S\.m,!f\.won\);/);
  const ban = HTML.slice(HTML.indexOf('function ban(t,c,keep,sm){'), HTML.indexOf('\nfunction ', HTML.indexOf('function ban(t,c,keep,sm){') + 10)).replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(ban, /MMVOICE/, '決着の帯では声を出さない');
  assert.match(fnOf('tbSkillDesc'), /^function tbSkillDesc\(x,noDesc\)\{/); assert.match(HTML, /tbSkillDesc\(m,1\)/); assert.match(HTML, /tbSkillDesc\(o,1\)/);
  const A = rd('js/battle/arena.js'); assert.match(A, /2026-10-14 実機試遊⑰/); assert.match(A, /MMMVCARD/);
  const fight = HTML.slice(HTML.indexOf('async function fight('), HTML.indexOf('\n$("#snd").textContent'));
  assert.doesNotMatch(fight, /RJ_MS|rivalWinTalk|MMMVCARD|P9_AUTO_BT/, 'fight()（Phase 6）には入れない');
});

test('P47-07：盤のイベント④⑮㉜＝宝箱のカットイン（ふつう chest_01・特別 chest_04・rare は宝箱の絵なし）・正門前 → ロビー・操作の案内は最初の数ターンだけ', () => {
  const WB = rd('js/chapter/world-board.js');
  assert.match(WB, /const CHEST = Object\.freeze\(\{ normal: 'chest_01', special: 'chest_04' \}\);/);
  assert.doesNotMatch(WB.replace(/\/\/.*$/gm, ''), /chest_02|chest_03/, '用途の決まっていない宝箱は使わない（コメントを除く）');
  for (const n of ['chest_01', 'chest_04']) for (let i = 1; i <= 4; i++) assert.ok(existsSync(path.join(ROOT, `assets/chests/${n}_anim_0${i}.webp`)) || existsSync(path.join(ROOT, `assets/chests/${n}_base/anim_0${i}.webp`)) || rd('assets/chests/README.md').includes(n), `${n} の素材`);
  assert.match(WB, /const GATE_BG = '\.\/assets\/fields\/ch1a\/final\/event\/ch1_bg_15_event\.webp';/);
  assert.match(WB, /const ARRIVE_GATE = Object\.freeze\(\[\{ npc: 'fina', view: 'closeup', expression: 'happy', text: 'ようやく着いたね、\{name\}さん！' \}/);
  assert.match(WB, /const ARRIVE_LOBBY = Object\.freeze\(\[\{ npc: 'fina', view: 'closeup', expression: 'guide', text: '公式大会は、ランクEからSまで。/);
  assert.match(WB, /f\.arrivalSeen = true; doSave\(\);/, '見た記録は最後に1回');
  assert.match(WB, /2026-10-14 実機試遊㉜/);
  assert.match(WB, /vcue\('fina\.discover'\)|fina\.discover/, '「見て見て」は既存の声の出しどころ');
});

test('P47-08：施設・UI＝アイテム屋の商品カード（価格・所持数・条件）・セーブのスロット（ランクの札・進行・日時）・プロローグの字幕のコントラスト・正式 UI の絵を読めるまで見せない', () => {
  const sh = HTML.slice(HTML.indexOf('function shopScr('), HTML.indexOf('\nfunction p7Buy('));
  assert.match(sh, /<b class="shnm">\$\{p11Esc\(d\.name\)\}<\/b>/); assert.match(sh, /<small class="shpr">\$\{op\?\(pr\?`\$\{GCOIN\}\$\{d\.price\}G`:"価格未設定"\)/);
  assert.match(sh, /poor\?"所持金が足りません":`所持 \$\{own\}`/); assert.match(sh, /MMP7\.shopBuy|p7Buy\('\$\{id\}'\)/);
  assert.match(HTML, /const slabName=d=>\{if\(!\(d&&d\.m\)\)return "モンスターなし";/);
  assert.match(HTML, /const slotProg=\(d,slot\)=>\{/); assert.match(HTML, /localStorage\.setItem\("mr4s"\+n\+"t",String\(Date\.now\(\)\)\)/);
  assert.match(fnOf('slotSave'), /localStorage\.setItem\("mr4s"\+n,j\)/, 'セーブの本体（スロット）の形は従来どおり');
  assert.match(HTML, /function uiReady\(el,urls,max\)\{/); assert.match(HTML, /#app>\.uiwait\{visibility:hidden\}/);
  assert.match(HTML, /\.mmpro-nar p\{text-shadow:0 0 1px #000,/);
  // プロローグの文章・時刻（Q01＝対象外）は変えていない
  const P = rd('js/prologue/prologue.js');
  assert.match(P, /const CUES = fz\(\{ scenes: fz\(\[0, 7800, 16100, 24400, 34100, 42500\]\), lastText: 50900, end: 51900 \}\);/);
  // 「ファーム」→「ベースキャンプ」㉑（ユーザー向けの表示）
  assert.match(HTML, /◀ ベースキャンプ/); assert.match(HTML, /ベースキャンプにもどる/);
});

test('P47-09：サイコロ③＝対称版の面（cube_1014s・README の sha256）・着地で縦横の比を変えない・出目の向きは不変', () => {
  const R = rd('assets/fields/ch1a/dice/cube_1014s/README.md');
  for (let v = 1; v <= 6; v++) { const m = new RegExp(`\\| face_${v}\\.webp \\| ([0-9a-f]{64}) \\|`).exec(R); assert.ok(m, `face_${v}`); assert.equal(sha(`assets/fields/ch1a/dice/cube_1014s/face_${v}.webp`), m[1]); }
  const ctx = { performance: { now: () => 0 } }; ctx.globalThis = ctx; vm.runInNewContext(rd('js/chapter/dice-cube.js'), ctx);
  const D = ctx.MMDICE3D; assert.equal(D.SKIN.official, './assets/fields/ch1a/dice/cube_1014s/face_');
  assert.deepEqual(JSON.parse(JSON.stringify(D.BASE)), { 1: [0, 0], 6: [0, 180], 3: [0, -90], 4: [0, 90], 5: [-90, 0], 2: [90, 0] });
  assert.doesNotMatch(rd('js/chapter/dice-cube.js'), /scale\(1\.\d+, ?0\.\d+\)|scaleY\(0\.\d+\)/, '縦横の比を変える動きは無い');
  assert.ok(existsSync(path.join(ROOT, 'tools/dice1014/faces_sym.py')));
});

test('P47-10：除外3項目（No.23 TEST大会の撤去・No.26 MISS の表示・Q01 プロローグの尺／テンポ／スキップ）は変えていない', () => {
  assert.match(HTML, /const TEST_MODE=true;/, 'No.23：TEST 大会の入口は残す');
  const P = rd('js/prologue/prologue.js'); assert.match(P, /lastText: 50900, end: 51900/);
  assert.match(HTML, /function proPlay\(/);
});
