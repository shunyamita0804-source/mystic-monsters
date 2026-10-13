// =========================================================
// 2026-10-13 開発25 追加便：NPC のボイス（ZIP「全NPCボイス15本_BGM3本」）と BGM の候補 3曲（Node で動かす部分）
//  VC-01：変換したファイル（OGG／M4A の対）の sha256・registry の登録（ON 7本＋三伝説4本は登録のみ）・フィナ「こんにちは」は参照先だけ差し替え（ほかのフィナ7種は変えない）
//  VC-02：取り込まないもの＝アストラッドの旧音源・研究所の「やあ」の二重登録（開発24 の elliot_hello_OPTIONAL と同じ元音源）
//  （2026-10-13 開発26：確定ボイス15本＝フィナ8本・ダン・ニック・ベルナ・レオナ2本は中身だけ差し替え・アストラッド2本は新規の登録のみ）
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
  fina_hello_new: ['766fb3b74d9fa69871e498787de015529ff4493d5b13723216393342187ed113', 'a4f4b0c11975b598fff7c318d7265ce543c63638cc00150d1d9702e69e84e66b'],   // 2026-10-13 開発26：確定版
  cedric_opening: ['5427f8ff9f9f39bafeb88af00b6b6577115aecc4e68ee3a5152be34ff267a379', 'b6c16c3db98fed4be6f0594041f920b95a0a4a0cc66ad811d81684a3f3e01cad'],
  serge_welcome: ['7bf6ab448dbd05a0062c1217c9c96505aa201c8c32e0443d96765790cefbbfa7', '192fb36c64b148cd74fc83d0d25f5c257d261ff71f1a555461b6e408b4bcb90a'],
  genshin_ack: ['09c5b0e462ced7d12e5a405f73ff77b92d742637c462a3a7aa3b5827957ab39a', '9ba82d6b20c5f9c7819e9ae881f914c24cf7b66134c442e2532dc34247748fbd'],
  vargas_ack: ['16f17e474d306024ccbade8312bcc316140606b6d94153f8de8db5f04f07a197', '411b947caf98485c058576915d7b527a3a58ebafbc389934314554999f5e2f31'],
  ryu_hello: ['79f00c519e18ada9992a2fb51478f6a75adbeea986d642205e40e45831c480fa', 'cd212d1626c71fb697b40ae20970d36dd3b89b577dd04b89f5272c2be5ba825a'],
  ryu_chuckle: ['81a8fe1cf1c6eac1f7ccf11275b61a520083e9d71d9532628176c79302c0efa3', '5a0adf55b51f6944390e6a4bb32b7d6cd44cc8d9cab881c6eecb604528929af0'],
  ryu_praise: ['e6d314206f9b5f0b2785c7951cd8e156a8c36f0a8552feec4eff0275fd8926a4', 'd41c126f094597d60da364c653bad8192529fb58c97c29b15d6d60f924829d36'],
  leona_greet: ['d9d26c74f737c4ee55719b1ec8b84b05d9ca925302cd316d4bd3fef80f2ae00c', 'd5b156ec443599348395a2dd148c15ed3a790441f9e1e067b6cc1722426b2a40'],   // 開発26：確定版
  leona_prebattle: ['0883100e02021d852aa0e740ebb794febf57c47ca151bb870d7f41390f279960', '7ea5e41520d98a22a6fa5a83e1a1d9bd1483e981bd24fbb11070450d42d64d5a'],   // 開発26：確定版
  ragnas_greet: ['bcb50fafb456ec8ee784b5ef5f2b614238b67af7a2eb456feb19c06e96421b60', 'a37dcd25589ef211d957f2cb14b22e60ddd28fa954b846eaef9711fff46ea4ac'],
  ragnas_prebattle: ['02d8c86637b4d03bebee03c0bfddb1a0e56838d14f59272f8cfce79bda81d350', '08023fa1f06e982478327e4bbbc9defe882f86d643d8478f22d5b3360410def6'],
  // 2026-10-13 開発26：確定ボイス（ZIP の manifest_voice15.json と同じ）＝フィナ7種・ダン・ニック・ベルナは中身だけ差し替え、アストラッド2本は新規（登録のみ）
  fina_yeah: ['1588f55ca9945f99fd639a15f0fe0b5230c7f5223af8cacf33a564891fcb1403', 'd1cdf170b6d3c1b197fffc11bf87a1b4ee325aa3c8d7f8ad71d8426f286b39da'],
  fina_hmm: ['fbb79971622541a38392dab047b375df5fa02636e879a3dbf93f37f2c8d39d40', 'bafbbb352fe839739d03754ddacc988a55b7daec038b12dea52bc9d58ebefe84'],
  fina_look: ['19a3864a9c130a6f1ddf604dab6e8ef2b26594ae075a54394495fdedcee2cdeb', '20d8da368049933907615be0231a8649b84d0813839d976da7d50e762a629f48'],
  fina_hey: ['2a1d20e887cf68a78ab425cc6984cb394a1714d5ba6e906783e04046a7a6ebb6', 'e0509dd462ef8c7572974298a348f1176ad97eb8b9539fddb89f92f33edfa813'],
  fina_giggle: ['d708489636186b98369af6ee191a628ac3ee086b2da79349a1e19533c9582ace', 'b490c598a9849c0e7210e2347263a2c7f0c2f00619fb5f636ba57827d19f1249'],
  fina_yes: ['6f0874ef1b55c01ff03205000a3c92614efba0124a3954b13ed0b3ad0650bcbc', '0fb45e27f8436ef7218cd0d62fd482a68dc428cbad7c51dd886e6c8ab6eb1bd0'],
  fina_wonder: ['e7b67b0c707766a20e9f57778c5b52f52807903aaeb32f61ec98ffde5cbb6276', '55c9f37e040ab6d359a330f2b378f666f159cec06742030253d5dcce27268580'],
  berna_welcome: ['2545dcfad61cfd62057c6719a403534ae5053ce537790265f038d95461686c92', 'e81d256fd352f5cad3a47d6e9208979cb6a80e6f341ba8d9bc8dac240022c2fb'],
  nick_hello: ['1fc591ed4cd5ccfc4846331113b3dab480bbd8383877d09f6e2ed152104ae6b3', '4115afffb8222e2624ca481116deee9e54c34f1da16092c19052c541f39966fa'],
  dan_hello: ['64d5ec0274572363c8da363a4c50bb85a172fac8455036c701f2d71b3d7c57b5', '132b2660ec75ffff09ba4fd592202a84e7207c46dfd210acfbb46222d4c3c9ff'],
  astrad_greet: ['24385b57ddc04ce19bb5fc5801b1ffbf34251c03df81b0ee76427fe9a7f9341b', 'b44d5ea8293d90762fb778a8fb80d52081e1f6140bd087c5c3d9e3be5d9f70d7'],
  astrad_prebattle: ['478645adf4ca4775ffcac4c45bd3f57bd53ad5a2ce39e42913d4f243aaa1fca8', 'e459fbb2ba5830159fdc713ed7c3a9f0e242041cdc95b84270624e818a284977'],
};
// 開発24 のまま変えないもの（エリオット）。フィナの7種は 2026-10-13 開発26 で確定版に差し替え＝上の NEW
const OLD = {
  elliot_hello_OPTIONAL: '60f86182e9e7b9067ac95397cb6398e14e082975fb6cf6a7570d2e77f43fbbd0',
};

test('VC-01：変換したファイルの sha256・registry の登録・フィナ「こんにちは」は参照先だけ差し替え', () => {
  for (const [id, [o, m]] of Object.entries(NEW)) { assert.equal(sha(VO + id + '.ogg'), o, id + '.ogg'); assert.equal(sha(VO + id + '.m4a'), m, id + '.m4a'); }
  const { got } = loadRegistry(), V = got.voice;
  assert.deepEqual(V.fina_hello.src, ['./' + VO + 'fina_hello_new.ogg', './' + VO + 'fina_hello_new.m4a'], 'fina_hello は新しい「こんにちは」');
  assert.equal(V.fina_hello.gain, 1.12);
  for (const [id, h] of Object.entries(OLD)) { assert.equal(sha(onDisk(V[id].src[0])), h, `${id} は変えない`); assert.notEqual(V[id].enabled, false, id); }
  assert.ok(existsSync(path.join(ROOT, VO, 'fina_hello.ogg')) && existsSync(path.join(ROOT, VO, 'fina_hello.m4a')), '旧「こんにちは」はファイルだけ残す（戻すときは registry の1行）');
  const on = ['cedric_opening', 'serge_welcome', 'genshin_ack', 'vargas_ack', 'ryu_hello', 'ryu_chuckle', 'ryu_praise', 'fina_yeah', 'fina_hmm', 'fina_look', 'fina_hey', 'fina_giggle', 'fina_yes', 'fina_wonder', 'berna_welcome', 'nick_hello', 'dan_hello'], off = ['leona_greet', 'leona_prebattle', 'ragnas_greet', 'ragnas_prebattle', 'astrad_greet', 'astrad_prebattle'];
  for (const id of on) { assert.ok(V[id], id); assert.notEqual(V[id].enabled, false, id + ' は ON'); assert.deepEqual(V[id].src, ['./' + VO + id + '.ogg', './' + VO + id + '.m4a']); }
  for (const id of off) { assert.ok(V[id], id); assert.equal(V[id].enabled, false, id + ' は登録のみ'); }
  const GAIN = { cedric_opening: 1.51, serge_welcome: 1.17, genshin_ack: 1.94, vargas_ack: 2.39, ryu_hello: 1.16, ryu_chuckle: 2.08, ryu_praise: 0.95, leona_greet: 1.13, leona_prebattle: 1.05, ragnas_greet: 0.96, ragnas_prebattle: 0.6,
    fina_yeah: 1.13, fina_hmm: 1.11, fina_look: 1.12, fina_hey: 1.13, fina_giggle: 1.12, fina_yes: 1.12, fina_wonder: 1.12, berna_welcome: 1.11, nick_hello: 1.12, dan_hello: 1.12, astrad_greet: 1.15, astrad_prebattle: 1.15 };   // 開発26：確定版は約 -19 LUFS＝従来の計算で約 -18 LUFS へ
  for (const [id, g] of Object.entries(GAIN)) assert.equal(V[id].gain, g, id + ' の gain（約 -18 LUFS にそろえる）');
  assert.equal(V.ragnas_greet.npc, 'ragnas'); assert.equal(V.leona_greet.npc, 'leona'); assert.equal(V.astrad_greet.npc, 'astrad'); assert.equal(V.astrad_prebattle.npc, 'astrad');
});

test('VC-02：アストラッドの旧音源・研究所「やあ」の二重登録は無い', () => {
  const { got } = loadRegistry();
  const all = readdirSync(path.join(ROOT, 'assets/audio'), { recursive: true }).map(String);
  // 2026-10-13 開発26：アストラッドは新しい声の2本（「待っていた」「全力でこい！」）だけ＝OGG／M4A の4ファイル・登録のみ（enabled:false）
  assert.deepEqual(all.filter((f) => /astrad|アストラッド/i.test(f)).map((f) => path.basename(f)).sort(), ['astrad_greet.m4a', 'astrad_greet.ogg', 'astrad_prebattle.m4a', 'astrad_prebattle.ogg'], 'アストラッドのファイルは新しい2本だけ（旧音源は使用禁止）');
  assert.deepEqual(Object.keys(got.voice).filter((k) => /astrad/i.test(k)).sort(), ['astrad_greet', 'astrad_prebattle']);
  for (const k of ['astrad_greet', 'astrad_prebattle']) assert.equal(got.voice[k].enabled, false, k + ' は登録のみ');
  assert.equal(Object.keys(got.voice).filter((k) => /elliot/.test(k)).length, 1, 'エリオットの声は開発24 の1本だけ');
  assert.equal(all.filter((f) => /elliot/.test(f)).length, 2, 'elliot_hello_OPTIONAL の OGG／M4A だけ');
  // 旧アストラッド音源（「来たか」「お前の力、見せてみろ！」）は置いていない・登録していない
  const REG = rd('js/audio/audio-registry.js'); assert.doesNotMatch(REG, /astrad_(kitaka|chikara)|アストラッド「(来たか|お前の力)/);
  const OLD_ASTRAD = ['d3ad7bda81895d2c9dcbe5a32ced1abfa6dde42509d719c4343a95dbfd1ec552', '3f485d20eb83871cba3fbcb0d0071f410e238b1cca4a62f617793e25ea1938f5'];
  for (const f of all.filter((x) => /\.(mp3|ogg|m4a|wav)$/i.test(x))) assert.ok(!OLD_ASTRAD.includes(sha('assets/audio/' + f)), f);
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
  for (const [k, v] of Object.entries({ 'facility.bureau': ['serge_welcome', true], 'ryu.appear': ['ryu_hello', false], 'ryu.won': ['ryu_chuckle', true], 'ryu.lost': ['ryu_praise', true], 'genshin.ack': ['genshin_ack', true], 'vargas.ack': ['vargas_ack', true],
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
  // 2026-10-13 開発27（24）：決着で鳴らすのは負け（へへっ）だけ。勝ちの「やるじゃん」はボードへ戻ってからのリュウの会話の行（rivalWinTalk・LINE_VOICE の ryu_praise）
  assert.match(HTML, /if\(t==="LOSE"&&D&&D\.pl&&D\.pl===BPL&&D\.label===PRACTICE_LABEL\.rival\)try\{window\.MMVOICE&&MMVOICE\.cue\("ryu\.won",\{delay:\.55\}\)\}catch\(e\)\{\}/);
  assert.match(HTML, /if\(bt=="rival"&&f\.won&&!f\.interrupted\)rivalWinTalk\(S\.m\);/); assert.ok(V.LINE_VOICE.ryu_praise);
  const fight = HTML.slice(HTML.indexOf('async function fight('), HTML.indexOf('\n$("#snd").textContent'));
  assert.doesNotMatch(fight, /MMVOICE|ryu\.|genshin|vargas_ack|cedric_opening/, 'fight()（Phase 6）には入れない');
  // 2026-10-13 開発27（20）：リュウの登場の「よっ！」は不採用＝どの演出からも呼ばない（声のファイル・登録は残す）
  for (const src of [HTML, rd('js/chapter/world-board.js'), rd('js/chapter/field-view.js')]) assert.doesNotMatch(src, /cue\('ryu\.appear'|cue\("ryu\.appear"/);
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
