// =========================================================
// 2026-10-17：NPC の有料ボイス 60本（Mismon_NPC_PaidVoice60_GenshinV2_20261017・02_manifest_v2.tsv が正本）の接続
//  （2026-10-15 N04 の全停止＝tests/voice-stop-1015 の VS-01〜03 は、ユーザーの 2026-10-17 の指示で解除＝このファイルへ置き換え。VS-04・VS-05 は残す）
//  VP-01：60本の派生（OGG＋M4A）がある・README に原本の sha256（manifest_v2 と同じ・ゲンシン 001／002 は差し替え版）・旧い無料の声は無い
//  VP-02：起動・最初の操作では声を取りに行かない・voiceWarm は指定の声だけ圧縮のまま・鳴らすときにデコード・デコード済みは最大 6本・設定 OFF は鳴らさず取りに行かない
//  VP-03：今までの出しどころ（alias）→ 新しいファイル・三伝説は鳴らさない（QA の試聴だけ）・「うむ」は割り当てない・止めた cue（ryu.appear）は止めたまま
//  VP-04：施設の初回＝フィナ 021〜027 → 施設の NPC 001（市場・牧場・ベースキャンプ・研究所・闘技場・アイテム屋・特訓）・字幕の時刻（sub）は声の長さの中で増える
//  VP-05：再訪の入口の一言（FAC_ENTRY）＝各 NPC 002 の書き起こし・闘技場と特訓の入口・カレンの来店は1行目「いらっしゃい。」
//  VS-04・VS-05（2026-10-15 から残す）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const HTML = rd('index.html');
const tick = (ms = 0) => new Promise((ok) => setTimeout(ok, ms));
const DIR = 'assets/audio/voice/npc_paid_1017/';
function env(store) {
  const xhr = [];
  class Param { constructor(v) { this.value = v; } setValueAtTime(v) { this.value = v; } linearRampToValueAtTime(v) { this.value = v; } cancelScheduledValues() {} }
  class Node { constructor() { this.gain = new Param(1); } connect(n) { return n; } disconnect() {} }
  class Ctx { constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; } resume() { return Promise.resolve(); } suspend() { return Promise.resolve(); } createGain() { return new Node(); } createBuffer() { return {}; } createBufferSource() { const n = new Node(); n.start = () => {}; n.stop = () => {}; return n; } decodeAudioData(a, ok) { ok({ duration: 1, numberOfChannels: 1, length: 10, sampleRate: 10, getChannelData: () => new Float32Array(10) }); } }
  class Audio { canPlayType(t) { return /ogg/.test(t) ? 'probably' : 'maybe'; } addEventListener() {} play() { return Promise.resolve(); } pause() {} load() {} }
  class XHR { open(m, u) { this.url = u; } send() { xhr.push(this.url); this.status = 200; this.response = new ArrayBuffer(8); setTimeout(() => this.onload && this.onload(), 1); } }
  const doc = { hidden: false, addEventListener() {} };
  const w = { localStorage: store, Audio, XMLHttpRequest: XHR, document: doc, AudioContext: Ctx };
  new Function('window', rd('js/audio/audio-manager.js'))(w);
  new Function('window', rd('js/audio/audio-registry.js'))(w);
  return { A: w.MMAUDIO, w, xhr };
}
const memStore = (init) => ({ d: { ...init }, getItem(k) { return this.d[k] ?? null; }, setItem(k, v) { this.d[k] = String(v); } });
const reg = () => { const r = {}; new Function('window', rd('js/audio/audio-registry.js'))({ MMAUDIO: { registerAll: (x) => Object.assign(r, x) } }); return r; };

test('VP-01：60本の派生（OGG＋M4A）・README に原本の sha256（ゲンシンは差し替え版）・旧い無料の声は無い', () => {
  const R = reg().voice, files = Object.entries(R).filter(([, v]) => v.src && v.src.length);
  assert.equal(files.length, 60, '60本');
  for (const [id, v] of files) { assert.deepEqual(v.src, [`./${DIR}${id}.ogg`, `./${DIR}${id}.m4a`], id); for (const s of v.src) assert.ok(existsSync(path.join(ROOT, s.slice(2))), s); assert.ok(v.gain > 0 && v.gain <= 2.5, id); assert.ok(v.line, id); }
  const md = rd(DIR + 'README.md');
  assert.equal((md.match(/^\| [a-z]+_\d{3} \|/gm) || []).length, 60);
  assert.ok(md.includes('a7777872ee933131698b04349f1c9021b98fd76958280c0d5755f5d7bf9053a8') && md.includes('7f7fd7c0c727b2e17fcaa196a73db21ef812d57a9e03de937c835013274ef6c1'), 'ゲンシン 001／002＝2026-10-17 の差し替え版');
  assert.deepEqual(readdirSync(path.join(ROOT, DIR)).filter((f) => /\.mp3$/.test(f)), [], '原本の MP3 は置かない');
  assert.deepEqual(readdirSync(path.join(ROOT, 'assets/audio/voice/npc_1013')).filter((f) => /\.(ogg|m4a)$/.test(f)), [], '旧い無料の声は無い');
  assert.match(rd('js/audio/audio-manager.js'), /const VOICE_BLOCKED = false;/);

});

test('VP-02：一括で取りに行かない・voiceWarm は指定の声だけ・鳴らすときにデコード・最大 6本・OFF は鳴らさない', async () => {
  const { A, xhr } = env(memStore({}));
  A.unlock(); A.voicePrefetch(); await tick(10);
  assert.deepEqual(xhr.filter((u) => /voice/.test(u)), [], '最初の操作で声を取りに行かない');
  assert.equal(A.voiceWarm(['dan_hello', 'karen_001']), 2); await tick(10);
  assert.deepEqual(xhr.filter((u) => /voice/.test(u)).map((u) => u.split('/').pop()), ['dan_002.ogg', 'karen_001.ogg'], 'alias を解いて・指定の2本だけ');
  assert.equal(A.voiceStatus().dan_002, 'loading', '圧縮のまま（まだデコードしない）');
  A.voice('dan_hello'); assert.equal(A.voiceLog().slice(-1)[0].result, 'wait', '圧縮のデータからデコードして鳴らす'); await tick(5); assert.equal(A.voicePlaying().id, 'dan_002');
  for (const id of ['fina_001', 'fina_002', 'fina_003', 'fina_004', 'fina_005', 'fina_006', 'fina_007']) { A.voice(id, { maxWaitMs: 500 }); await tick(10); }
  assert.ok(Object.values(A.voiceStatus()).filter((s) => s === 'ready').length <= 6, 'デコード済みは最大 6本');
  const off = env(memStore({ mmvoice: JSON.stringify({ on: false, vol: 1 }) }));
  off.A.unlock(); assert.equal(off.A.voiceWarm(['dan_hello']), 0); assert.equal(off.A.voice('dan_hello', { maxWaitMs: 2000 }), false); assert.equal(off.A.voiceLog().slice(-1)[0].result, 'off');
  assert.deepEqual(off.xhr.filter((u) => /voice/.test(u)), [], '声 OFF は取りに行かない（待ちもしない）');
});

test('VP-03：alias・三伝説は鳴らさない（QA だけ）・「うむ」は無し・止めた cue は止めたまま', async () => {
  const { A, w } = env(memStore({}));
  new Function('window', rd('js/npc/voice-cues.js'))(w);
  const V = w.MMVOICE, al = A.voiceAliases();
  assert.deepEqual(al, { fina_hello: 'fina_016', fina_yeah: 'fina_005', fina_hmm: 'fina_011', fina_look: 'fina_004', fina_hey: 'fina_007', fina_giggle: 'fina_014', fina_yes: 'fina_012', fina_wonder: 'fina_008',
    dan_hello: 'dan_002', nick_hello: 'nick_002', berna_welcome: 'berna_002', karen_welcome: 'karen_002', elliot_hello_OPTIONAL: 'elliot_002', cedric_opening: 'cedric_001', serge_welcome: 'serge_001',
    ryu_hello: 'ryu_004', ryu_chuckle: 'ryu_009', ryu_praise: 'ryu_003', leona_greet: 'leona_001', leona_prebattle: 'leona_002', ragnas_greet: 'ragnas_001', ragnas_prebattle: 'ragnas_002', astrad_greet: 'astrad_001', astrad_prebattle: 'astrad_002',
    genshin_train: 'genshin_002', vargas_hello: 'vargas_002' });
  A.unlock();
  for (const id of ['astrad_001', 'leona_002', 'ragnas_001', 'leona_greet']) { assert.equal(A.voice(id), false, id); assert.equal(A.voiceLog().slice(-1)[0].result, 'disabled'); }
  assert.notEqual(A.voice('astrad_001', { qa: true, maxWaitMs: 500 }) || A.voiceLog().slice(-1)[0].result, 'disabled', 'QA の試聴だけ鳴らせる');
  for (const c of ['legend.leona.greet', 'legend.ragnas.battle', 'ryu.appear']) assert.equal(V.CUES[c].on, false, c);
  assert.deepEqual([reg().voice.genshin_ack.src, reg().voice.vargas_ack.src], [[], []], '新60本に「うむ」は無い＝割り当てない');
  assert.deepEqual([V.CUES['facility.arena'].voice, V.CUES['facility.train'].voice], ['vargas_hello', 'genshin_train']);
});

test('VP-04：施設の初回＝フィナ 021〜027 → NPC 001・字幕の時刻は声の長さの中で増える', () => {
  const w = {}; new Function('window', rd('js/npc/npc-events.js'))(w);
  const R = reg().voice, durOf = (id) => +((rd(DIR + 'README.md').match(new RegExp('^\\| ' + id + ' \\| [^|]+ \\| ([\\d.]+) \\|', 'm')) || [])[1]);
  const want = { market: ['fina_021', 'karen_001'], ranch: ['fina_022', 'nick_001'], farm: ['fina_023', 'dan_001'], lab: ['fina_024', 'elliot_001'], arena: ['fina_025', 'vargas_001'], shop: ['fina_026', 'berna_001'], train: ['fina_027', 'genshin_001'] };
  for (const [fac, ids] of Object.entries(want)) {
    const L = w.MMNPCE.first(fac); assert.deepEqual(w.MMNPCE.firstVoices(fac), ids, fac);
    for (const id of ids) {
      const i = L.findIndex((l) => l.voice === id); assert.ok(i >= 0 && R[id], id); assert.equal(L[i].voiceWait, 4000);
      let last = 0, k = i + 1; for (; k < L.length && L[k].sub != null; k++) { assert.ok(L[k].sub > last && L[k].sub < durOf(id) * 1000, `${id} ${L[k].sub}`); last = L[k].sub; assert.equal(L[k].npc, L[i].npc); }
    }
    assert.equal(L[L.length - 1].voice, undefined, fac + '：最後の行は声なし（今までの案内）');
  }
});

test('VP-05：再訪の一言＝各 NPC 002 の書き起こし・闘技場と特訓の入口・カレンの来店', () => {
  const R = reg().voice, norm = (s) => s.replace(/[\s、。？！?!]/g, '');
  const E = HTML.slice(HTML.indexOf('const FAC_ENTRY={'), HTML.indexOf('let FAC_ENTRY_OPEN'));
  for (const [fac, id] of [['ranch', 'nick_002'], ['farm', 'dan_002'], ['shop', 'berna_002'], ['lab', 'elliot_002'], ['bureau', 'serge_001'], ['arena', 'vargas_002'], ['train', 'genshin_002']]) {
    const t = (E.match(new RegExp(fac + ':\\{npc:"[a-z]+",expr:"[a-z]+",text:"([^"]+)"')) || [])[1];
    assert.equal(norm(t || ''), norm(R[id].line), fac);
  }
  assert.match(HTML, /function townArena\(\)\{townLock\("闘技場は、まだ利用できません。"\);if\(npcFirst\("arena"\)\)return;if\(facEntryOn\("arena"\)/);
  assert.match(HTML, /npcWarm\("genshin"\);facVoice\("train",npcFirstWill\("train"\)\)/);
  assert.match(HTML, /karenSay\(\[\{npc:"karen",expression:"welcome",voice:"karen_welcome",voiceWait:2500,text:"いらっしゃい。"\},/);
  assert.match(HTML, /const W=\{npc:"karen",expression:"welcome",voice:"karen_welcome",voiceWait:2500,text:"いらっしゃい。"\};karenSay\(l\?\[W,/, '再訪の1行目＝カレン 002（声と字幕）');
  assert.match(HTML, /facVoice\("market",npcFirstWill\("market"\)\|\|!window\.MM_QA_NO_KAREN\)/, 'カレンが話すときは入口の声を別に鳴らさない');
  assert.match(HTML, /facVoice\(null\);townPreload\(\);voiceWarmTown\(\);/);
});

test('VS-04：止めていないもの＝BGM・SE・観客の声・固有スキルの音（Mixkit 3.5秒）・サイコロ・決着の曲', () => {
  const { A } = env(memStore({}));
  const st = A.status();
  for (const k of ['SKILL_ACTIVATE', 'CROWD_HIT', 'CROWD_MISS', 'CROWD_EVADE', 'DICE_CUBE', 'BATTLE_WIN', 'BATTLE_LOSE', 'RIVAL_APPEAR']) assert.ok(k in st.se, k);
  const r = reg();
  for (const k of ['SKILL_ACTIVATE', 'CROWD_HIT_LONG', 'DICE_CUBE', 'BATTLE_LOSE']) for (const s of [].concat(r.se[k].src)) assert.ok(existsSync(path.join(ROOT, s.replace(/^\.\//, ''))), s);
  assert.match([].concat(r.se.SKILL_ACTIVATE.src)[0], /skill_activate_shot_light_energy_3p5s\.ogg$/);
});

test('VS-05：差し替え台帳＝26 の id・新しい声の手順・未解決（git の履歴）を書いている', () => {
  const L = rd('docs/voice-replacement-ledger.md');
  assert.equal((L.match(/^\| `[a-zA-Z_]+` \|/gm) || []).length, 26);
  for (const t of ['VOICE_BLOCKED', '旧い無料の声を「作り直したから」と戻さない', 'git の履歴', 'max-age=600', '54本', '2026-10-17']) assert.ok(L.includes(t), t);
  assert.equal((L.match(/^[0-9a-f]{64}  [a-zA-Z_]+\.(ogg|m4a)$/gm) || []).length, 54);
});

test('VP-06：モンスターの鳴き声 14本（7体×normal／sad）＝派生の OGG＋M4A・原本の sha256（受領一覧と同じ）・NPC の声が優先・全体の間隔・同じ子の間隔・OFF・不明な種族は鳴らさない', async () => {
  const R = reg().cry, J = JSON.parse(rd('tools/monvoice1017/derive.json'));
  assert.equal(Object.keys(R).length, 16, '14本（7体）＋2026-10-18 カルシェル2本');
  const KEYS = ['solamo', 'gauru', 'nobiton', 'jiol', 'regnas', 'flurene', 'razuck', 'kalshell'];
  for (const k of KEYS) for (const kind of ['normal', 'sad']) { const id = `cry_${k}_${kind}`, v = R[id]; assert.ok(v, id); for (const s of v.src) assert.ok(existsSync(path.join(ROOT, s.slice(2))), s); assert.ok(v.gain > 0.3 && v.gain < 2, id); }
  const ORIG = { soramo_normal: 'd8f8676e262805d750a4afbb746190e3763bd27b22c351b25b557482e0981324', fulune_sad: 'ab1d2c5fbd757d41b62ae4df3282a9d24c14eea7d155d08586d4b68262688351', razuck_sad: '982f9fbc3a6a0efd56979500fbd7fa066282c696e094c7b1eeffb83a230d8f95' };
  for (const [k, h] of Object.entries(ORIG)) assert.equal(J.find((r) => r.orig === `voice_${k}.mp3`).origSha, h, k);
  assert.ok(J.filter((r) => r.kind === 'sad').every((r) => 20 * Math.log10(r.gain) <= 3.01), '悲しみは +3dB まで');
  assert.deepEqual(readdirSync(path.join(ROOT, 'assets/audio/voice/monster_1017')).filter((f) => /\.mp3$/.test(f)), [], '原本の MP3 は置かない');
  const { A } = env(memStore({}));
  A.unlock(); await tick(5);
  assert.equal(A.cryIds().length, 16, '14本＋2026-10-18 カルシェル2本'); assert.ok(!A.voiceIds().some((k) => /^cry_/.test(k)), 'NPC の声の一覧には入れない（会話の行に使えない）');
  const last = () => A.voiceLog().slice(-1)[0].result;
  A.cry(9, 'normal'); assert.equal(last(), 'unknown', '表に無い種族は鳴らさない');
  A.cry(0, 'normal'); assert.equal(last(), 'wait'); await tick(10); assert.equal(A.voicePlaying().id, 'cry_solamo_normal');
  A.cry(1, 'normal'); assert.equal(last(), 'cool', '全体の間隔（8秒）');
  A.cryReset(); A.voice('dan_hello', { maxWaitMs: 500 }); await tick(10); assert.equal(A.voicePlaying().id, 'dan_002', 'NPC の声は鳴き声を止めて鳴る');
  A.cry(1, 'normal'); assert.equal(last(), 'npc', 'NPC の声の間は鳴らさない');
  A.stopVoice(0); A.cryReset();
  A.cry('gauru', 'sad', { perMs: 10000, gapMs: 0 }); A.cry('gauru', 'sad', { perMs: 10000, gapMs: 0 }); assert.equal(last(), 'cool-mon', '同じ子の間隔');
  A.cry('gauru', 'sad', { force: true }); assert.notEqual(last(), 'cool-mon', 'QA の試聴は間隔を無視');
  A.cryReset(); A.setVoice({ on: false }); A.cry(3, 'normal'); assert.equal(last(), 'off', '声 OFF は鳴き声も止める');
  // 出しどころ（A〜E）：既存の場面だけ・WIN は既定で無し
  assert.match(HTML, /document\.body\.appendChild\(el\);monCry\(x\.sp,"normal",650,/, 'A：市場で仲間入り');
  assert.match(HTML, /が生まれた！`\);try\{monCry\(c\.sp,"normal",350\)\}catch\(e\)\{\}/, 'A：合体の誕生');
  assert.match(HTML, /function rnPick\(uid\)\{[^\n]*monCry\(x\.sp,"normal",120,[^\n]*\{perMs:10000,gapMs:6000\}\)\}/, 'B：牧場のタップ（同じ子10秒）');
  // 2026-10-18 REV3 D2：Chapter の開始では鳴かない（Ch1 の俯瞰のあと・Ch2 の歩いて入るの鳴き声は外した）。D3：イベントで1回（cryAfter＝NPC の声のあと）
  assert.doesNotMatch(rd('js/chapter/world-board.js'), /feel\('chapter\.start'\); if \(m\) monCry/, 'C：Chapter 1 の開始では鳴かない');
  assert.doesNotMatch(rd('js/chapter/field-view.js'), /feel\('monster\.enter'\); \{ const S0 = gS\(\), mm = S0 && S0\.m; if \(!quick && mm\) monCry/, 'C：Chapter 2 の歩いて入るでも鳴かない');
  for (const f of ['js/chapter/world-board.js', 'js/chapter/field-view.js']) assert.match(rd(f), /A\.cryAfter\(/, `${f}：イベントの鳴き声は cryAfter`);
  assert.match(rd('js/chapter/world-board.js'), /if \(foe && foe\.sp != null\) monCry\(foe\.sp, 'normal', 800,/, 'D：野生・レアの相手（ライバルは無し）');
  assert.match(HTML, /if\(!win\)monCry\(sp,"sad",5000,here,\{gapMs:0,when:here\}\);else if\(window\.MM_CRY_WIN\)/, 'E：LOSE の曲（5.0秒）のあと・結果の画面に居るときだけ（2026-10-18 夜間 B03）・WIN は既定で無し');
  for (const f of ['js/battle/stage.js', 'js/battle/art25d.js', 'js/battle/rules.js', 'js/chapter/dice-cube.js', 'js/chapter/dice-renderer.js']) assert.doesNotMatch(rd(f), /\.cry\(|monCry/, `${f}：バトルの進行・サイコロでは鳴かない`);
});
