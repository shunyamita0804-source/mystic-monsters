// =========================================================
// 2026-10-13 開発25 追加便：NPC のボイス（ZIP「全NPCボイス15本_BGM3本」）と BGM の候補 3曲（Node で動かす部分）
//  VC-01：変換したファイル（OGG／M4A の対）の sha256・registry の登録（ON 7本＋三伝説4本は登録のみ）・フィナ「こんにちは」は参照先だけ差し替え（ほかのフィナ7種は変えない）
//  VC-02：取り込まないもの＝アストラッドの旧音源・研究所の「やあ」の二重登録（開発24 の elliot_hello_OPTIONAL と同じ元音源）
//  VC-03：BGM の候補は MMAUDIO に登録しない（どの場面からも鳴らない）・TITLE の無音・ARENA・公式戦／野生／レア／ライバルの曲は変えていない
//  VC-04：出しどころ（voice-cues.js の CUES と index.html・world-board.js・field-view.js）＝既存の場面に1回・三伝説は on:false
//  VC-05：MMVOICE の動き＝OFF は鳴らさない・クールダウン・同じ cue の登録外は鳴らさない（偽の MMAUDIO）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const sha = (p) => crypto.createHash('sha256').update(readFileSync(path.join(ROOT, p))).digest('hex');
const onDisk = (s) => s.replace(/^\.\//, '');
const HTML = rd('index.html');
function loadRegistry() {
  const got = { bgm: {}, se: {}, voice: {} }, w = { MMAUDIO: { registerAll: (r) => { Object.assign(got.bgm, r.bgm); Object.assign(got.se, r.se); Object.assign(got.voice, r.voice || {}); got.keys = Object.keys(r); } } };
  new Function('window', rd('js/audio/audio-registry.js'))(w);
  return { got, REG: w.MMAUDIO_REGISTRY };
}
const VO = 'assets/audio/voice/npc_1013/';
const NEW = {   // id → [OGG, M4A] の sha256（AUDIO_CREDITS.md の表と同じ）
  fina_hello_new: ['f7ee69d402c9a14fd145770765c0ae4fc40d21ddd0a19799b9eef3d60f852cb7', 'a7e11053d81fdbc9d01851f574e7b4dd682754f1d7a2c97915440e0eef45fddf'],
  cedric_opening: ['5427f8ff9f9f39bafeb88af00b6b6577115aecc4e68ee3a5152be34ff267a379', 'b6c16c3db98fed4be6f0594041f920b95a0a4a0cc66ad811d81684a3f3e01cad'],
  serge_welcome: ['7bf6ab448dbd05a0062c1217c9c96505aa201c8c32e0443d96765790cefbbfa7', '192fb36c64b148cd74fc83d0d25f5c257d261ff71f1a555461b6e408b4bcb90a'],
  genshin_ack: ['09c5b0e462ced7d12e5a405f73ff77b92d742637c462a3a7aa3b5827957ab39a', '9ba82d6b20c5f9c7819e9ae881f914c24cf7b66134c442e2532dc34247748fbd'],
  vargas_ack: ['16f17e474d306024ccbade8312bcc316140606b6d94153f8de8db5f04f07a197', '411b947caf98485c058576915d7b527a3a58ebafbc389934314554999f5e2f31'],
  ryu_hello: ['79f00c519e18ada9992a2fb51478f6a75adbeea986d642205e40e45831c480fa', 'cd212d1626c71fb697b40ae20970d36dd3b89b577dd04b89f5272c2be5ba825a'],
  ryu_chuckle: ['81a8fe1cf1c6eac1f7ccf11275b61a520083e9d71d9532628176c79302c0efa3', '5a0adf55b51f6944390e6a4bb32b7d6cd44cc8d9cab881c6eecb604528929af0'],
  ryu_praise: ['e6d314206f9b5f0b2785c7951cd8e156a8c36f0a8552feec4eff0275fd8926a4', 'd41c126f094597d60da364c653bad8192529fb58c97c29b15d6d60f924829d36'],
  leona_greet: ['bf6f0a80d2ab81dac99d0acd103670afa44a5af2f5c816df84e1ff833522e79c', 'ab8b741acea99a36231505d9d1fb2421fedc87220eeffec7c081bbeed71d4d86'],
  leona_prebattle: ['5385274790b791133b69662911fcd73d576036091f87cb7d0b79951ad8befab2', 'f78bd4989eea385566126f38428db21bf96724866feb07176ee5ef61dfeaaeab'],
  ragnas_greet: ['bcb50fafb456ec8ee784b5ef5f2b614238b67af7a2eb456feb19c06e96421b60', 'a37dcd25589ef211d957f2cb14b22e60ddd28fa954b846eaef9711fff46ea4ac'],
  ragnas_prebattle: ['02d8c86637b4d03bebee03c0bfddb1a0e56838d14f59272f8cfce79bda81d350', '08023fa1f06e982478327e4bbbc9defe882f86d643d8478f22d5b3360410def6'],
};
// 開発24 のフィナの7種と施設の5種（変えない）
const OLD = {
  fina_yeah: 'cf8640e2e949f0fa33428d0f6ba48958fd2f1d37b18f6fb6c9a4ff0688b13c42', fina_hmm: 'efbb76da020ba5f92a9d4a914f3f5306fba2387a50b6e5821839ce1f999bd860',
  fina_look: '8173b2160c82cb13b855fcd0afaa9595519ed439ef7035f6f99adfce442d575a', fina_hey: '0c8dc7bbf060ba246a01ff4a8a851390679e4c05c407cfe7d50efd2e67d33eac',
  fina_giggle: '128dd2785d6cddc7b2ce977d872d71e1281c1797ef280ff4705be301fe9faa3e', fina_yes: '7a5b1da316c84f5fb893ea05082452654b4abf70512043fcc515f3aa5446689b',
  fina_wonder: 'b5542fec30eb45a501f7974c5662aca6dc643d23acc5855de4ba875b8049566c', elliot_hello_OPTIONAL: '60f86182e9e7b9067ac95397cb6398e14e082975fb6cf6a7570d2e77f43fbbd0',
};

test('VC-01：変換したファイルの sha256・registry の登録・フィナ「こんにちは」は参照先だけ差し替え', () => {
  for (const [id, [o, m]] of Object.entries(NEW)) { assert.equal(sha(VO + id + '.ogg'), o, id + '.ogg'); assert.equal(sha(VO + id + '.m4a'), m, id + '.m4a'); }
  const { got } = loadRegistry(), V = got.voice;
  assert.deepEqual(V.fina_hello.src, ['./' + VO + 'fina_hello_new.ogg', './' + VO + 'fina_hello_new.m4a'], 'fina_hello は新しい「こんにちは」');
  assert.equal(V.fina_hello.gain, 0.88);
  for (const [id, h] of Object.entries(OLD)) { assert.equal(sha(onDisk(V[id].src[0])), h, `${id} は変えない`); assert.notEqual(V[id].enabled, false, id); }
  assert.ok(existsSync(path.join(ROOT, VO, 'fina_hello.ogg')) && existsSync(path.join(ROOT, VO, 'fina_hello.m4a')), '旧「こんにちは」はファイルだけ残す（戻すときは registry の1行）');
  const on = ['cedric_opening', 'serge_welcome', 'genshin_ack', 'vargas_ack', 'ryu_hello', 'ryu_chuckle', 'ryu_praise'], off = ['leona_greet', 'leona_prebattle', 'ragnas_greet', 'ragnas_prebattle'];
  for (const id of on) { assert.ok(V[id], id); assert.notEqual(V[id].enabled, false, id + ' は ON'); assert.deepEqual(V[id].src, ['./' + VO + id + '.ogg', './' + VO + id + '.m4a']); }
  for (const id of off) { assert.ok(V[id], id); assert.equal(V[id].enabled, false, id + ' は登録のみ'); }
  const GAIN = { cedric_opening: 1.51, serge_welcome: 1.17, genshin_ack: 1.94, vargas_ack: 2.39, ryu_hello: 1.16, ryu_chuckle: 2.08, ryu_praise: 0.95, leona_greet: 0.9, leona_prebattle: 0.81, ragnas_greet: 0.96, ragnas_prebattle: 0.6 };
  for (const [id, g] of Object.entries(GAIN)) assert.equal(V[id].gain, g, id + ' の gain（約 -18 LUFS にそろえる）');
  assert.equal(V.ragnas_greet.npc, 'ragnas'); assert.equal(V.leona_greet.npc, 'leona');
});

test('VC-02：アストラッドの旧音源・研究所「やあ」の二重登録は無い', () => {
  const { got } = loadRegistry();
  const all = readdirSync(path.join(ROOT, 'assets/audio'), { recursive: true }).map(String);
  assert.equal(all.filter((f) => /astrad|アストラッド/i.test(f)).length, 0, 'アストラッドのファイルは無い（旧音源は使用禁止・新しい声は未着）');
  assert.equal(Object.keys(got.voice).filter((k) => /astrad/i.test(k)).length, 0);
  assert.equal(Object.keys(got.voice).filter((k) => /elliot/.test(k)).length, 1, 'エリオットの声は開発24 の1本だけ');
  assert.equal(all.filter((f) => /elliot/.test(f)).length, 2, 'elliot_hello_OPTIONAL の OGG／M4A だけ');
  // 旧アストラッド音源の sha256 が assets のどこにも無い（MP3 も変換後も置いていない）
  const REG = rd('js/audio/audio-registry.js'); assert.doesNotMatch(REG, /astrad_(greet|prebattle|kitaka|chikara)/);
  assert.match(rd('AUDIO_CREDITS.md'), /d3ad7bda81895d2c9dcbe5a32ced1abfa6dde42509d719c4343a95dbfd1ec552）・「お前の力、見せてみろ！」（3f485d20eb83871cba3fbcb0d0071f410e238b1cca4a62f617793e25ea1938f5）＝使用禁止の旧音源/);
});

test('VC-03：BGM の候補は MMAUDIO に登録しない・今の正式の BGM は変えていない', () => {
  const { got, REG } = loadRegistry();
  assert.deepEqual(got.keys.sort(), ['bgm', 'bgmCandidates', 'se', 'voice']);
  const C = REG.bgmCandidates;
  assert.deepEqual(Object.keys(C).sort(), ['ARENA_CANDIDATE', 'LEGEND_BATTLE_CANDIDATE', 'TITLE_CANDIDATE']);
  const H = { TITLE_CANDIDATE: 'd032ae4f001caad1338fd8e1e29e32f443f9ee18736273e76bb9b88172afba25', ARENA_CANDIDATE: 'db1bbbd34c5b4774a282ad9cfc36eadd7befb17ce1f3fdf7eadb3d362157ec31', LEGEND_BATTLE_CANDIDATE: '28f56e01360c7887c7d92df0291af1de7c98ab3324a84456b44e3a27d060f542' };
  for (const [k, h] of Object.entries(H)) assert.equal(sha(onDisk(C[k].src)), h, k);
  for (const k of Object.keys(C)) assert.ok(!(k in got.bgm), `${k} は BGM の場面に登録しない`);
  const bgmSrc = JSON.stringify(got.bgm); assert.doesNotMatch(bgmSrc, /candidates_1013/, 'どの場面も候補の曲を指さない');
  assert.deepEqual(got.bgm.TITLE, { silent: true }, 'TITLE は無音のまま');
  assert.match(got.bgm.ARENA.src, /11_arena_swords_at_midnight_loop\.ogg$/);
  assert.match(got.bgm.TOURNAMENT_BATTLE_LOW.src, /licensed_20261012\/official_rank_battle\.ogg$/);
  for (const k of ['WILD_BATTLE', 'RARE_WILD_BATTLE', 'RIVAL_BATTLE', 'SPECIAL_BATTLE', 'CEDRIC']) assert.doesNotMatch(JSON.stringify(got.bgm[k]), /candidates|legend/i, k);
  // MMAUDIO の場面の一覧にも足していない
  assert.doesNotMatch(rd('js/audio/audio-manager.js'), /LEGEND_BATTLE|_CANDIDATE/);
  // 本編（index.html・js/）から試聴ページへのつながりが無い
  assert.doesNotMatch(HTML, /audio_candidates_1013|candidates_1013/);
  assert.ok(existsSync(path.join(ROOT, 'prototype/audio_candidates_1013/index.html')));
});

test('VC-04：出しどころ＝既存の場面に1回・三伝説は on:false', () => {
  const w = {}; new Function('window', rd('js/npc/voice-cues.js'))(w); const V = w.MMVOICE;
  const C = Object.fromEntries(Object.entries(V.CUES).map(([k, v]) => [k, [v.voice, v.on]]));
  for (const [k, v] of Object.entries({ 'facility.bureau': ['serge_welcome', true], 'ryu.appear': ['ryu_hello', true], 'ryu.won': ['ryu_chuckle', true], 'ryu.lost': ['ryu_praise', true], 'genshin.ack': ['genshin_ack', true], 'vargas.ack': ['vargas_ack', true],
    'legend.leona.greet': ['leona_greet', false], 'legend.leona.battle': ['leona_prebattle', false], 'legend.ragnas.greet': ['ragnas_greet', false], 'legend.ragnas.battle': ['ragnas_prebattle', false] })) assert.deepEqual(C[k], v, k);
  assert.equal(V.CUES['vargas.ack'].cooldown, 30000, 'ヴァルガスは押すたびに鳴らない');
  assert.ok(V.LINE_VOICE.cedric_opening && V.LINE_VOICE.serge_welcome);
  // セドリック：開幕の会話の1行目（台詞の頭＝声）
  assert.match(HTML, /L=\[\{npc:"cedric",expression:"kickoff",voice:"cedric_opening",text:`さあ、いよいよ公式ランク\$\{R\}大会の開幕です！`\}\]/);
  assert.equal((HTML.match(/cedric_opening/g) || []).length, 1);
  // セルジュ：登録の受付の1行目・管理局の再訪（登録の前＝序盤の導線の間は鳴らさない）
  assert.match(HTML, /serge:\[\{npc:"serge",voice:"serge_welcome",text:"ようこそ、聖獣士管理局へ。/);
  assert.match(HTML, /function bureauScr\(tab\)\{if\(p8Blocked\(\)\)return;bgm\("bureau"\);facVoice\("bureau",!!S\.playerNamePending\);/);
  // ゲンシン：特訓のゴールの1回（trScr の done）
  assert.match(HTML, /bgm\("train"\);p9Immersive\(true\);if\(done\)try\{window\.MMVOICE&&MMVOICE\.cue\("genshin\.ack",\{delay:\.35\}\)\}catch\(e\)\{\}/);
  // リュウ：ライバル戦の決着（fight() の WIN!／LOSE＝ban）だけ。勝ち→やるじゃん・負け→へへっ。大会・野生・レアでは鳴らない（BATTLE_DRESS のラベル）
  assert.match(HTML, /if\(\(t==="WIN!"\|\|t==="LOSE"\)&&D&&D\.pl&&D\.pl===BPL&&D\.label===PRACTICE_LABEL\.rival\)try\{window\.MMVOICE&&MMVOICE\.cue\(t==="WIN!"\?"ryu\.lost":"ryu\.won",\{delay:\.55\}\)\}catch\(e\)\{\}/);
  const fight = HTML.slice(HTML.indexOf('async function fight('), HTML.indexOf('\n$("#snd").textContent'));
  assert.doesNotMatch(fight, /MMVOICE|ryu\.|genshin|vargas_ack|cedric_opening/, 'fight()（Phase 6）には入れない');
  // リュウの登場：世界のボードとフィールドのライバルの遭遇の演出
  assert.match(rd('js/chapter/world-board.js'), /el\.classList\.add\('p2'\); try \{ if \(root\.MMVOICE && fig\) root\.MMVOICE\.cue\('ryu\.appear'\);/);
  assert.match(rd('js/chapter/field-view.js'), /if \(rival && rvFig\) \{ try \{ if \(root\.MMVOICE\) root\.MMVOICE\.cue\('ryu\.appear', \{ delay: 0\.45 \}\);/);
  // 三伝説の場面は呼ばれない
  for (const src of [HTML, rd('js/chapter/world-board.js'), rd('js/chapter/field-view.js'), rd('js/npc/npc.js')]) assert.doesNotMatch(src, /legend\.(leona|ragnas)|leona_|ragnas_/);
});

test('VC-05：MMVOICE の動き（偽の MMAUDIO）＝on:false の場面は鳴らさない・クールダウン・OFF のときは MMAUDIO が鳴らさない', () => {
  const played = [], log = [], w = { MMAUDIO: { voice: (id, o) => { played.push([id, o && o.delay]); log.push({ result: 'play' }); return true; }, voiceLog: () => log, stopVoice: () => {} } };
  new Function('window', rd('js/npc/voice-cues.js'))(w); const V = w.MMVOICE;
  assert.equal(V.cue('legend.ragnas.greet'), false); assert.equal(V.log().slice(-1)[0].result, 'cue-off');
  assert.equal(V.cue('ryu.lost', { delay: 0.55 }), true); assert.deepEqual(played.pop(), ['ryu_praise', 0.55]);
  assert.equal(V.cue('ryu.won'), true); assert.deepEqual(played.pop()[0], 'ryu_chuckle');
  assert.equal(V.cue('vargas.ack'), true); assert.equal(V.cue('vargas.ack'), false, '30秒は繰り返さない'); assert.equal(V.log().slice(-1)[0].result, 'cooldown');
  assert.equal(V.enter('bureau'), true); assert.equal(V.enter('bureau'), false, '同じ訪問では1回'); assert.deepEqual(played.pop()[0], 'serge_welcome');
  assert.equal(V.line('cedric_opening'), true); assert.equal(V.line('serge_welcome'), true); assert.equal(V.line('ryu_hello'), false, 'リュウの声は会話の行には付けない（場面の cue だけ）');
});
