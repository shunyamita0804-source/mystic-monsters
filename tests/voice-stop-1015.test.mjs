// =========================================================
// 2026-10-15 N04：NPC のボイスの全停止・公開配信からの除外（ユーザー指示・最優先）
//  VS-01：MMAUDIO の VOICE_BLOCKED＝利用者の設定（mmvoice の on）が残っていても鳴らさない・ファイルを取りに行かない
//  VS-02：声のファイルは今の木に無い・画面のコードに声のファイルのパスは無い・設定の画面は「準備中」の表示だけ
//  VS-03：台詞・出しどころ（CUES・LINE_VOICE・会話の行の voice）は残す＝新しい声の差し替え先。MMVOICE は投げない
//  VS-04：止めていないもの（BGM・SE・観客の声・固有スキルの音）は従来どおり登録・ファイルあり
//  VS-05：差し替え台帳（docs/voice-replacement-ledger.md）＝26 の id・手順・未解決（git の履歴）
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

function env(store) {
  const xhr = [];
  class Param { constructor(v) { this.value = v; } setValueAtTime(v) { this.value = v; } linearRampToValueAtTime(v) { this.value = v; } cancelScheduledValues() {} }
  class Node { constructor() { this.gain = new Param(1); } connect(n) { return n; } disconnect() {} }
  class Ctx { constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; } resume() { return Promise.resolve(); } suspend() { return Promise.resolve(); } createGain() { return new Node(); } createBufferSource() { const n = new Node(); n.start = () => {}; n.stop = () => {}; return n; } decodeAudioData(a, ok) { ok({ duration: 1, numberOfChannels: 1, length: 10, sampleRate: 10, getChannelData: () => new Float32Array(10) }); } }
  class Audio { canPlayType() { return 'probably'; } addEventListener() {} play() { return Promise.resolve(); } pause() {} load() {} }
  class XHR { open(m, u) { this.url = u; } send() { xhr.push(this.url); } }
  const doc = { hidden: false, addEventListener() {} };
  const w = { localStorage: store, Audio, XMLHttpRequest: XHR, document: doc, AudioContext: Ctx };
  new Function('window', rd('js/audio/audio-manager.js'))(w);
  new Function('window', rd('js/audio/audio-registry.js'))(w);
  return { A: w.MMAUDIO, w, xhr };
}
const memStore = (init) => ({ d: { ...init }, getItem(k) { return this.d[k] ?? null; }, setItem(k, v) { this.d[k] = String(v); } });

test('VS-01：利用者の設定が on のままでも NPC の声は鳴らない・取りに行かない', async () => {
  const { A, xhr } = env(memStore({ mmvoice: JSON.stringify({ on: true, vol: 1 }) }));
  assert.equal(A.voiceBlocked(), true);
  assert.deepEqual(A.voiceSettings(), { on: true, vol: 1 }, '端末に残っている設定は読む（消さない）');
  A.unlock(); A.voicePrefetch(); await tick(20);
  for (const id of Object.keys(A.voiceStatus())) { assert.equal(A.voice(id, { maxWaitMs: 2000 }), false, id); assert.equal(A.voiceLog().slice(-1)[0].result, 'blocked'); }
  await tick(20);
  assert.equal(A.playLog().filter((x) => x.kind === 'voice').length, 0);
  assert.equal(A.voiceNow(), null);
  assert.deepEqual(xhr.filter((u) => /voice/.test(u)), []);
  assert.match(rd('js/audio/audio-manager.js'), /const VOICE_BLOCKED = true;/);
});

test('VS-02：声のファイルは今の木に無い・画面のコードに声のパスは無い・設定は「準備中」', () => {
  const files = readdirSync(path.join(ROOT, 'assets/audio/voice'), { recursive: true }).map(String);
  assert.deepEqual(files.filter((f) => /\.(ogg|m4a|mp3|wav|aac)$/i.test(f)), []);
  assert.ok(existsSync(path.join(ROOT, 'assets/audio/voice/npc_1013/README.md')), '削除の記録の README は残す');
  for (const f of ['index.html', 'js/audio/audio-registry.js', 'js/npc/voice-cues.js', 'js/npc/npc.js', 'js/chapter/world-board.js', 'prototype/audio_candidates_1013/index.html']) assert.doesNotMatch(rd(f), /assets\/audio\/voice\/[^'"\s]+\.(ogg|m4a)/, f);
  assert.match(HTML, /voiceBlocked\(\)\?`<div class="pfrow trow tvoff"><dt>ボイス<\/dt><dd><span class="tnote">準備中（新しい声の収録待ち）<\/span>/);
});

test('VS-03：台詞・出しどころは残す（新しい声の差し替え先）・MMVOICE は鳴らさず投げない', () => {
  const { A, w } = env(memStore({}));
  new Function('window', rd('js/npc/voice-cues.js'))(w);
  const V = w.MMVOICE;
  for (const c of ['facility.farm', 'facility.ranch', 'facility.shop', 'facility.market', 'facility.lab', 'facility.bureau', 'fina.discover', 'fina.challengeOk', 'fina.challengeNg', 'ryu.won', 'ryu.lost', 'genshin.ack', 'vargas.ack']) {
    assert.ok(V.CUES[c] && V.CUES[c].on, c + ' の出しどころは残す'); assert.ok(A.voiceStatus()[V.CUES[c].voice], c + ' の声の id は registry に');
  }
  for (const id of ['fina_hello', 'fina_yeah', 'fina_hmm', 'fina_look', 'fina_hey', 'fina_giggle', 'fina_yes', 'fina_wonder', 'cedric_opening', 'serge_welcome', 'ryu_praise', 'ryu_chuckle']) assert.equal(V.LINE_VOICE[id], true, id);
  A.unlock();
  assert.equal(V.enter('farm'), false); assert.equal(V.cue('fina.discover'), false); assert.equal(V.line('fina_yes'), false);
  assert.doesNotThrow(() => V.stop(90));
  assert.equal(A.playLog().filter((x) => x.kind === 'voice').length, 0);
  // 会話の行の voice（データ）は残す：序盤・出来事・NPC イベント
  assert.match(rd('js/npc/npc-events.js'), /voice: 'fina_giggle'/); assert.match(rd('js/chapter/configs/ch1a.js'), /voice: 'fina_look'/);
});

test('VS-04：止めていないもの＝BGM・SE・観客の声・固有スキルの音（Mixkit 3.5秒）・サイコロ・決着の曲', () => {
  const { A } = env(memStore({}));
  const st = A.status();
  for (const k of ['SKILL_ACTIVATE', 'CROWD_HIT', 'CROWD_MISS', 'CROWD_EVADE', 'DICE_CUBE', 'BATTLE_WIN', 'BATTLE_LOSE', 'RIVAL_APPEAR']) assert.ok(k in st.se, k);
  const reg = {}; const w = { MMAUDIO: { registerAll: (r) => Object.assign(reg, r) } }; new Function('window', rd('js/audio/audio-registry.js'))(w);
  for (const k of ['SKILL_ACTIVATE', 'CROWD_HIT_LONG', 'DICE_CUBE', 'BATTLE_LOSE']) for (const s of [].concat(reg.se[k].src)) assert.ok(existsSync(path.join(ROOT, s.replace(/^\.\//, ''))), s);
  assert.match([].concat(reg.se.SKILL_ACTIVATE.src)[0], /skill_activate_shot_light_energy_3p5s\.ogg$/);
});

test('VS-05：差し替え台帳＝26 の id・新しい声の手順・未解決（git の履歴）を書いている', () => {
  const L = rd('docs/voice-replacement-ledger.md');
  assert.equal((L.match(/^\| `[a-zA-Z_]+` \|/gm) || []).length, 26);
  for (const t of ['VOICE_BLOCKED', '旧い無料の声を「作り直したから」と戻さない', 'git の履歴', 'max-age=600', '54本']) assert.ok(L.includes(t), t);
  assert.equal((L.match(/^[0-9a-f]{64}  [a-zA-Z_]+\.(ogg|m4a)$/gm) || []).length, 54);
});
