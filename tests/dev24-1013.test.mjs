// =========================================================
// 2026-10-13 開発24：バトル画面（構図・低いルーレット・技の発動中の表示）・観客の声・NPC のボイス・最新の版への読み込み直し（Node で動かす部分）
//  DV-01：registry＝観客の声 6本（OGG／M4A の対・gain の初期値）・ボイス 13本（12本 ON・エリオットは OFF）・SE の名前の一覧（ホワイトリスト）に登録
//  DV-02：ボイスの仕組み（偽の Web Audio）＝専用の GainNode（Master の下）・ON/OFF／音量はボイスだけ（mmaudio は変えない）・1本だけ・止める・待ちすぎた声は鳴らさない・OFF／ミュート／無効の声は鳴らない
//  DV-03：形式の予備（OGG が読めない・デコードできない → M4A を1回だけ）・どれも駄目でもゲームは止めない・再生の記録（playLog）は実際に start したものだけ
//  DV-04：観客の声 MMCROWD＝公式大会だけ・練習試合／修行は鳴らさない・短い／1秒／なし・標準／控えめ（設定は mmcrowd）
//  DV-05：出しどころ MMVOICE＝施設は訪問1回に1回・グループ（ベースキャンプ ↔ アイテム屋）・CUES の on／LINE_VOICE で止められる・会話の行の voice は意味が合う行だけ
//  DV-06：バトル画面（arena.js）＝新しい画面は既定・「旧」で戻せる・低い板の派生画像（元の4枚は変えない）・威力／命中率／クリ率を出さない・相手の番の説明を出さない・技の発動中は opacity／visibility だけ
//  DV-07：最新の版へ：index.html の MM_BUILD と version.json が同じ・読み込み直しは15分に1回まで・standalone（ホーム画面の別アプリ）にはしない（iOS は保存領域が別＝セーブが見えなくなる）
//  DV-08：守るもの＝fight()・battle-bridge・adapter・legacy のハッシュ（Phase 6）は tests/phase7.test.mjs。ここでは fight() の中に新しい呼び出しが無いこと・セーブの形に新しい項目が無いこと
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const HTML = rd('index.html');
const tick = (ms = 0) => new Promise((ok) => setTimeout(ok, ms));
/** 条件が成り立つまで待つ（偽の XHR・デコードは非同期。負荷が高くても待てるように最大2秒） */
const until = async (fn, ms = 2000) => { const t0 = Date.now(); while (!fn() && Date.now() - t0 < ms) await tick(5); return fn(); };
const onDisk = (src) => path.join(ROOT, src.replace(/^\.\//, ''));

function loadRegistry() {
  const got = { bgm: {}, se: {}, voice: {} }, w = { MMAUDIO: { registerAll: (r) => { Object.assign(got.bgm, r.bgm); Object.assign(got.se, r.se); Object.assign(got.voice, r.voice || {}); } } };
  new Function('window', rd('js/audio/audio-registry.js'))(w);
  return got;
}
/** 偽の Web Audio・XHR（o.fail＝読めない URL の正規表現・o.decodeFail＝デコードできない URL の正規表現） */
function env(o = {}) {
  const log = { xhr: [], starts: [], stops: 0 };
  class Param { constructor(v) { this.value = v; } setValueAtTime(v) { this.value = v; } linearRampToValueAtTime(v) { this.value = v; } cancelScheduledValues() {} }
  class Node { constructor(kind) { this.kind = kind; this.gain = new Param(1); this.out = []; } connect(n) { this.out.push(n); return n; } disconnect() {} }
  class Buf { constructor(ch, len, sr) { this.numberOfChannels = ch; this.length = len; this.sampleRate = sr; this.duration = len / sr; this.ch = Array.from({ length: ch }, () => new Float32Array(len)); } getChannelData(i) { return this.ch[i]; } copyToChannel(a, i) { this.ch[i].set(a); } }
  let lastUrl = '';
  class Ctx {
    constructor() { this.state = o.ctxState || 'running'; this.currentTime = 0; this.destination = { dest: true }; }
    resume() { this.state = 'running'; return Promise.resolve(); }
    suspend() { this.state = 'suspended'; return Promise.resolve(); }
    createGain() { return new Node('gain'); }
    createBuffer(ch, len, sr) { return new Buf(ch, len, sr); }
    createBufferSource() { const n = new Node('src'); n.start = () => { log.starts.push(n); n.started = true; }; n.stop = () => { log.stops++; n.stopped = true; }; return n; }
    decodeAudioData(ab, ok, ng) { const u = ab.__url || ''; if (o.decodeFail && o.decodeFail.test(u)) { ng(new Error('EncodingError')); return; } const b = new Buf(1, 44100, 44100); b.ch[0][100] = 0.5; b.ch[0][40000] = 0.2; if (o.decodeDelay) setTimeout(() => ok(b), o.decodeDelay); else ok(b); }
  }
  class Audio { canPlayType() { return 'probably'; } addEventListener() {} play() { return Promise.resolve(); } pause() {} load() {} }
  class XHR { open(m, u) { this.url = u; } send() { log.xhr.push(this.url); setTimeout(() => { if (o.fail && o.fail.test(this.url)) { this.status = 404; this.response = null; } else { this.status = 200; const ab = new ArrayBuffer(8); ab.__url = this.url; ab.slice = () => ab; this.response = ab; } this.onload && this.onload(); }, 0); } }
  const doc = { hidden: false, ls: {}, addEventListener(t, f) { (this.ls[t] = this.ls[t] || []).push(f); }, emit(t) { (this.ls[t] || []).forEach((f) => f()); } };
  const store = o.store || { d: {}, getItem(k) { return this.d[k] ?? null; }, setItem(k, v) { this.d[k] = String(v); } };
  const w = { localStorage: store, Audio, XMLHttpRequest: XHR, document: doc, AudioContext: Ctx };
  new Function('window', rd('js/audio/audio-manager.js'))(w);
  return { A: w.MMAUDIO, log, w, doc, store, lastUrl };
}

test('DV-01：registry＝観客の声 6本（OGG／M4A の対）・ボイス 13本（2026-10-13 開発25 から13本とも ON＝エリオットは再訪の挨拶）・SE の名前の一覧に登録', () => {
  const got = loadRegistry(), { A } = env();
  const want = { CROWD_HIT: 1.08, CROWD_MISS: 1.11, CROWD_EVADE: 0.39, CROWD_HIT_LONG: 1.19, CROWD_MISS_LONG: 1.06, CROWD_EVADE_LONG: 0.30 };   // 2026-10-14 開発29（7）：約 +6dB
  for (const [k, g] of Object.entries(want)) {
    assert.ok(A.SE.includes(k), `SE の名前の一覧（ホワイトリスト）：${k}`);
    const v = got.se[k]; assert.ok(v, k); assert.equal(v.gain, g, `${k} の gain`);
    assert.equal(v.src.length, 2); assert.match(v.src[0], /\.ogg$/); assert.match(v.src[1], /\.m4a$/);
    for (const s of v.src) assert.ok(existsSync(onDisk(s)), s);
  }
  assert.match(got.se.CROWD_HIT.src[0], /hit_cheer_2p0_2p7_700ms/); assert.match(got.se.CROWD_HIT_LONG.src[0], /hit_cheer_2p0_3p0_1000ms/);
  assert.match(got.se.CROWD_MISS.src[0], /miss_disappointment_0p5_1p2_700ms/); assert.match(got.se.CROWD_MISS_LONG.src[0], /miss_disappointment_0p5_1p5_1000ms/);
  assert.match(got.se.CROWD_EVADE.src[0], /evade_boo_0p0_0p6_600ms/); assert.match(got.se.CROWD_EVADE_LONG.src[0], /evade_boo_0p0_1p0_1000ms/);
  const ids = Object.keys(got.voice);
  // 2026-10-13 開発25 追加便：セドリック・セルジュ・ゲンシン・ヴァルガス・リュウ3種（ON）＋三伝説4種（レオナ・ラグナス＝登録のみ・enabled:false）。アストラッドは未着の新音源待ち（旧音源は取り込まない）
  assert.deepEqual(ids.sort(), ['astrad_greet', 'astrad_prebattle', 'berna_welcome', 'cedric_opening', 'dan_hello', 'elliot_hello_OPTIONAL', 'fina_giggle', 'fina_hello', 'fina_hey', 'fina_hmm', 'fina_look', 'fina_wonder', 'fina_yeah', 'fina_yes', 'genshin_ack', 'karen_welcome', 'leona_greet', 'leona_prebattle', 'nick_hello', 'ragnas_greet', 'ragnas_prebattle', 'ryu_chuckle', 'ryu_hello', 'ryu_praise', 'serge_welcome', 'vargas_ack']);
  assert.equal(ids.filter((k) => got.voice[k].enabled !== false).length, 20);
  assert.deepEqual(ids.filter((k) => got.voice[k].enabled === false).sort(), ['astrad_greet', 'astrad_prebattle', 'leona_greet', 'leona_prebattle', 'ragnas_greet', 'ragnas_prebattle'], '三伝説の声は登録のみ（場面が未実装。アストラッドは 2026-10-13 開発26）');
  assert.notEqual(got.voice.elliot_hello_OPTIONAL.enabled, false, '開発25：研究所（エリオット）の「やあ」はユーザーが正式に提供＝既定 ON（再訪だけ）');
  for (const v of Object.values(got.voice)) { assert.equal(v.src.length, 2); for (const s of v.src) assert.ok(existsSync(onDisk(s)), s); assert.ok(v.gain > 0 && v.gain <= 3); }
  const CR = rd('AUDIO_CREDITS.md'); for (const t of ['観客の声 3種', 'DRAGON-STUDIO', 'Universfield', 'pixabay.com/service/license-summary/', 'NPC のボイス', '利用規約・声の権利関係は、会話からは特定できていない']) assert.ok(CR.includes(t), `AUDIO_CREDITS.md：${t}`);
});

test('DV-02：ボイス＝専用の GainNode・ON/OFF と音量はボイスだけ（mmaudio は変えない）・1本だけ・止める・OFF／ミュート／無効は鳴らない', async () => {
  const { A, log, store, doc } = env();
  new Function('window', rd('js/audio/audio-registry.js'))(Object.assign({}, { MMAUDIO: A }));
  A.unlock(); await until(() => Object.values(A.voiceStatus()).every((v) => v !== 'loading'));
  assert.equal(A.voiceStatus().fina_yes, 'ready'); assert.equal(A.voiceStatus().elliot_hello_OPTIONAL, 'ready');
  assert.equal(A.voice('fina_yes'), true); assert.equal(A.voiceNow(), 'fina_yes');
  const p1 = A.playLog().filter((x) => x.kind === 'voice'); assert.equal(p1.length, 1); assert.match(p1[0].src, /fina_yes\.ogg$/); assert.equal(p1[0].ctx, 'running'); assert.equal(p1[0].gain, 1.12);
  const s1 = log.starts[log.starts.length - 1];
  assert.equal(A.voice('dan_hello'), true); assert.ok(s1.stopped, '新しい声は前の声を止める（二重に鳴らない）'); assert.equal(A.voiceNow(), 'dan_hello');
  A.stopVoice(); assert.equal(A.voiceNow(), null);
  A.registerVoice('x_disabled', ['./x.ogg'], { enabled: false }); assert.equal(A.voice('x_disabled'), false); assert.equal(A.voiceLog().slice(-1)[0].result, 'disabled');
  assert.equal(A.voice('nope'), false); assert.equal(A.voiceLog().slice(-1)[0].result, 'unknown');
  A.setVoice({ on: false }); assert.equal(A.voice('fina_yes'), false); assert.equal(A.voiceLog().slice(-1)[0].result, 'off');
  assert.deepEqual(JSON.parse(store.getItem('mmvoice')), { on: false, vol: 0.85 }); assert.equal(store.getItem('mmaudio'), null, 'BGM・SE の設定（mmaudio）は変えない');
  A.setVoice({ on: true, vol: 0.5 }); assert.deepEqual(A.voiceSettings(), { on: true, vol: 0.5 }); assert.deepEqual(A.status().volume, { bgm: 0.8, se: 0.9 }, 'BGM・SE の音量はそのまま');
  A.setMuted(true); assert.equal(A.voice('fina_yes'), false); assert.equal(A.voiceLog().slice(-1)[0].result, 'muted'); A.setMuted(false);
  // 場面（施設・バトル）が変わったら前の声を止める
  A.registerBgm('TOWN', './bgm/t.ogg'); A.registerBgm('MARKET', './bgm/m.ogg');
  A.scene('TOWN'); A.voice('karen_welcome'); assert.equal(A.voiceNow(), 'karen_welcome'); A.scene('MARKET'); assert.equal(A.voiceNow(), null);
  // 裏に回ったら止める（戻っても鳴らし直さない）
  A.voice('fina_yes'); assert.equal(A.voiceNow(), 'fina_yes'); doc.hidden = true; doc.emit('visibilitychange'); assert.equal(A.voiceNow(), null);
  assert.equal(A.voice('fina_yes'), false, '裏にいる間は鳴らさない'); doc.hidden = false; doc.emit('visibilitychange'); assert.equal(A.voiceNow(), null);
});

test('DV-02b：読み込みが間に合わない声は短い待ち（既定 0.4秒）を過ぎたら鳴らさない＝画面が変わってから遅れて鳴らない', async () => {
  const { A } = env({ decodeDelay: 600 });
  A.registerVoice('v', ['./a.ogg']); A.unlock();
  assert.equal(A.voice('v'), false); assert.equal(A.voiceLog().slice(-1)[0].result, 'wait');
  await tick(700);
  assert.equal(A.voiceLog().slice(-1)[0].result, 'drop'); assert.equal(A.playLog().length, 0);
  // 間に合う待ちなら鳴る
  const e2 = env({ decodeDelay: 50 }); e2.A.registerVoice('v', ['./a.ogg']); e2.A.unlock();
  e2.A.voice('v', { maxWaitMs: 400 }); await until(() => e2.A.playLog().length === 1, 380);
  assert.equal(e2.A.voiceLog().slice(-1)[0].result, 'play'); assert.equal(e2.A.playLog().length, 1);
  // 待っている間に止めた（会話を閉じた・画面を移った）＝鳴らない
  const e3 = env({ decodeDelay: 50 }); e3.A.registerVoice('v', ['./a.ogg']); e3.A.unlock();
  e3.A.voice('v', { maxWaitMs: 400 }); e3.A.stopVoice(); await tick(120);
  assert.equal(e3.A.playLog().length, 0);
});

test('DV-03：OGG が読めない（404）・デコードできない → M4A を1回だけ。どれも駄目なら鳴らさない（投げない）。playLog は start したものだけ', async () => {
  const a = env({ fail: /\.ogg$/ }); a.A.registerSe('CROWD_HIT', ['./c.ogg', './c.m4a'], { gain: 0.55 }); a.A.unlock(); await until(() => a.A.status().se.CROWD_HIT === 'ready');
  assert.equal(a.A.status().se.CROWD_HIT, 'ready'); assert.equal(a.A.se('CROWD_HIT'), true);
  assert.match(a.A.playLog()[0].src, /c\.m4a$/); assert.deepEqual(a.log.xhr, ['./c.ogg', './c.m4a'], 'OGG のあと M4A を1回だけ');
  const b = env({ decodeFail: /\.ogg$/ }); b.A.registerVoice('v', ['./v.ogg', './v.m4a']); b.A.unlock(); await until(() => b.A.voiceStatus().v === 'ready');
  assert.equal(b.A.voiceStatus().v, 'ready'); assert.equal(b.A.voice('v'), true); assert.match(b.A.playLog()[0].src, /v\.m4a$/);
  const c = env({ fail: /./ }); c.A.registerSe('CROWD_MISS', ['./x.ogg', './x.m4a']); c.A.registerVoice('w', ['./w.ogg', './w.m4a']); c.A.unlock(); await until(() => c.A.status().se.CROWD_MISS === 'failed' && c.A.voiceStatus().w === 'failed');
  assert.equal(c.A.status().se.CROWD_MISS, 'failed'); assert.doesNotThrow(() => c.A.se('CROWD_MISS'));
  assert.equal(c.A.voice('w'), false); assert.equal(c.A.playLog().length, 0, '鳴っていない音は記録しない（seLog は「頼まれた」だけ）');
  assert.ok(c.A.seLog().includes('CROWD_MISS'));
});

test('DV-04：観客の声＝公式大会だけ・練習試合／修行は鳴らさない・短い／1秒／なし・標準／控えめ（mmcrowd）', () => {
  const calls = [], store = { d: {}, getItem(k) { return this.d[k] ?? null; }, setItem(k, v) { this.d[k] = String(v); } };
  const bt = (prac, rank) => ({ dataset: { mmprac: prac ? '1' : '', mmrank: rank || '' } });
  const w = { localStorage: store, MMAUDIO: { se: (n, o) => { calls.push([n, o.volume, o.delay]); return true; }, prefetchSe: () => {} }, MMARENA: { rankOf: (b) => b.dataset.mmrank || null } };
  new Function('window', rd('js/battle/crowd.js'))(w);
  const C = w.MMCROWD;
  assert.deepEqual(C.settings(), { mode: 'long', level: 'std' }, '既定＝通常（1.0秒）・標準（2026-10-13 開発28：0.7秒は短すぎるとの試遊の判断。元の音源が無く再カットできないので今ある最長の 1.0秒を既定に）');
  assert.equal(C.react('hit', bt(false, 'E')), true); assert.deepEqual(calls.pop(), ['CROWD_HIT_LONG', 1, 0.06]);
  assert.equal(C.react('miss', bt(false, 'S')), true); assert.equal(calls.pop()[0], 'CROWD_MISS_LONG');
  assert.equal(C.react('evade', bt(false, 'C')), true); assert.equal(calls.pop()[0], 'CROWD_EVADE_LONG');
  C.set({ mode: 'short' }); assert.equal(C.react('hit', bt(false, 'E')), true); assert.equal(calls.pop()[0], 'CROWD_HIT', '短い（0.7秒）の版も選べる'); C.set({ mode: 'long' });
  assert.equal(C.react('hit', bt(true, 'E')), false, '野生・レア・ライバル（練習試合）は観客なし'); assert.equal(C.log().slice(-1)[0].result, 'no-audience');
  assert.equal(C.react('hit', bt(false, '')), false, '修行など会場のランクが無い'); assert.equal(calls.length, 0);
  C.set({ mode: 'long', level: 'soft' }); assert.deepEqual(JSON.parse(store.getItem('mmcrowd')), { mode: 'long', level: 'soft' });
  C.react('evade', bt(false, 'E')); assert.deepEqual(calls.pop().slice(0, 2), ['CROWD_EVADE_LONG', 0.6]);
  C.set({ mode: 'off' }); assert.equal(C.react('hit', bt(false, 'E')), false); assert.equal(C.log().slice(-1)[0].result, 'off'); assert.equal(calls.length, 0);
  C.set({ mode: 'bad', level: 'bad' }); assert.deepEqual(C.settings(), { mode: 'off', level: 'soft' }, '不正な値は無視');
});

test('DV-05：出しどころ＝施設は訪問1回に1回・CUES／LINE_VOICE で止められる・会話の行の voice は意味が合う行だけ', () => {
  const played = [], w = { MMAUDIO: { voice: (id) => { played.push(id); return true; }, voiceLog: () => [{ result: 'play' }], stopVoice: () => played.push('stop') } };
  new Function('window', rd('js/npc/voice-cues.js'))(w);
  const V = w.MMVOICE;
  assert.deepEqual(Object.fromEntries(Object.entries(V.CUES).filter(([k]) => /^facility/.test(k)).map(([k, v]) => [k, [v.voice, v.on]])),
    { 'facility.farm': ['dan_hello', true], 'facility.ranch': ['nick_hello', true], 'facility.shop': ['berna_welcome', true], 'facility.market': ['karen_welcome', true], 'facility.lab': ['elliot_hello_OPTIONAL', true], 'facility.bureau': ['serge_welcome', true] }, '施設と声の対応（市場＝カレン・アイテム屋＝ベルナ・牧場＝ニック・ベースキャンプ＝ダン）');
  assert.equal(V.enter('market'), true); assert.equal(V.enter('market'), false, '同じ訪問の中では繰り返さない'); V.visitReset(); assert.equal(V.enter('market'), true, '街へ出て入り直したらまた');
  assert.equal(V.enter('lab'), true, '開発25：エリオットも再訪で鳴る'); assert.deepEqual(played, ['karen_welcome', 'karen_welcome', 'elliot_hello_OPTIONAL']);
  // 開発25 F：初回の案内の訪問は skip（鳴らさずに「この訪問は済み」）→ 同じ訪問では鳴らない・次の訪問で鳴る
  V.visitReset(); assert.equal(V.skip('ranch', 'first-visit'), true); assert.equal(V.enter('ranch'), false, '初回の案内の訪問は鳴らない'); V.visitReset(); assert.equal(V.enter('ranch'), true, '再訪で鳴る');
  // index.html：施設のグループ（ベースキャンプの中のアイテム屋は別の施設・ベースキャンプへ戻ってもダンは繰り返さない）
  assert.match(HTML, /const FAC_GROUP=\{farm:\["farm"\],shop:\["farm","shop"\],ranch:\["ranch"\],market:\["market"\],lab:\["lab"\],bureau:\["bureau"\]\};/);
  for (const [fn, fac] of [['function farm(msg,tab){', 'ranch'], ['function market(msg,focus){', 'market'], ['function fmScr(msg){', 'farm'], ['function shopScr(msg,bought,tab){', 'shop'], ['function museum(tab){', 'lab'], ['function bureauScr(tab){', 'bureau']]) {
    const line = HTML.slice(HTML.indexOf(fn), HTML.indexOf('\n', HTML.indexOf(fn))); assert.ok(line.includes(`facVoice("${fac}",`), `${fn} → ${fac}（開発25：初回の案内の訪問かを渡す）`);
  }
  // 会話の行の voice（意味の合う行だけ・フィナの8種）
  const SRC = HTML + rd('js/npc/npc-events.js') + rd('js/chapter/configs/ch1a.js') + rd('js/chapter/world-driver.js');
  const lines = [...SRC.matchAll(/\{[^{}\n]*?voice:\s*["'](fina_\w+)["'][^{}\n]*?\}/g)].map((m) => [m[1], (/text:\s*["`']([^"`']*)/.exec(m[0]) || [])[1]]).filter((x) => x[1] != null)
    .concat([...SRC.matchAll(/F\('\w+', ['`]([^'`]*)['`], \{ voice: '(fina_\w+)' \}\)/g)].map((m) => [m[2], m[1]]))
    .concat([...SRC.matchAll(/\{ \.\.\.L\('\w+', '([^']*)'\), voice: '(fina_\w+)' \}/g)].map((m) => [m[2], m[1]]));
  const START = { fina_yes: /^うん/, fina_look: /^見て/, fina_hey: /^もう/ };
  for (const [id, t] of lines) if (START[id]) assert.match(t, START[id], `${id} の行の始まり：${t}`);
  assert.ok(lines.length >= 10, `声の付いた行 ${lines.length}`);
  // 2026-10-13 開発25 追加便：フィナの8種＋セドリック（開幕の1行目）・セルジュ（受付の1行目）＝台詞の頭と声が同じ行だけ
  assert.ok(Object.values(V.LINE_VOICE).every(Boolean) && Object.keys(V.LINE_VOICE).length === 12, '2026-10-13 開発27（24）：リュウ「やるじゃん」（ライバル戦の勝利のあとのボードの会話の行）・2026-10-14 実機試遊⑬：リュウ「へへっ」（負けたあとのボードの会話の行）を足して12');
  assert.match(HTML, /const RYU_LOSE_TALK=\{1:\[\{npc:"ryu",expression:"\w+",text:"へへっ/, 'ryu_chuckle の行は「へへっ」で始まる（声の発音と同じ）');
  assert.match(HTML, /const RYU_WIN_TALK=\{1:\[\{npc:"ryu",expression:"soft_smile",text:"やるじゃん！/, 'ryu_praise の行は「やるじゃん！」で始まる');
  const NPCL = [...SRC.matchAll(/\{npc:"(cedric|serge)",(?:expression:"\w+",)?voice:"(\w+)",text:["`]([^"`]*)/g)].map((m) => [m[2], m[3]]);
  assert.deepEqual(NPCL.map((x) => x[0]).sort(), ['cedric_opening', 'serge_welcome'], '声の付いた NPC の行は2つだけ');
  for (const [id, t] of NPCL) assert.match(t, id === 'cedric_opening' ? /^さあ、いよいよ/ : /^ようこそ/, `${id} の行の始まり：${t}`);
});

test('DV-06：バトル画面＝新しい画面は既定・「旧」で戻せる・低い板の派生（元の4枚は変えない）・数値を出さない・相手の番の説明を出さない', () => {
  const A = rd('js/battle/arena.js');
  assert.match(A, /const UI_KEY = 'mmbattleui';/); assert.match(A, /if \(v24\(\)\) bt\.classList\.add\('mma-v24'\);/);
  assert.match(A, /HIDE_MSG = \/\^\(タイミングよくボタンを押せ！\|相手がルーレットを回している…\|/);
  assert.match(A, /\$\{NEW \? '' : '<div class="st">/, '新しい画面は威力・命中率・クリ率を出さない');
  assert.match(A, /mma-cine \.hpr,#bt\.mma-v24\.mma-cine \.tm,#bt\.mma-v24\.mma-cine button\.sur,#bt\.mma-v24\.mma-cine \.bui\{opacity:0!important;visibility:hidden;pointer-events:none!important/);
  assert.doesNotMatch(A.slice(A.indexOf('---- 2026-10-13 開発24（#bt.mma-v24）----'), A.indexOf("].join('\\n');")), /display:none/, '技の発動中の表示は display:none を使わない（座標を壊さない）');
  const SHA = { 'plate_normal.webp': '033979ee9cc6d4165aa8c92f54412ac6f65dfaf72b18a40cd724debb8d3c9036', 'plate_selected.webp': '5307571c2a13a07d46131cc115214d1d189880c3d5511cb01862a64262a81c6c', 'plate_miss.webp': 'dbfe4db115cc32134cb3d012be486c4a062769cc4805f0c12c44ca7d9d69f278', 'center_frame.webp': '6ad9552796c371ef2e78caf2977403c1cf3e435d30c274b75ae2b38379c70a53' };
  for (const [f, h] of Object.entries(SHA)) assert.equal(crypto.createHash('sha256').update(readFileSync(path.join(ROOT, 'assets/battle/roulette', f))).digest('hex'), h, `正式素材 ${f} は変えない`);
  for (const f of ['plate_normal_c', 'plate_selected_c', 'plate_miss_c', 'center_frame_c']) assert.ok(existsSync(path.join(ROOT, `assets/battle/roulette/compact_1013/${f}.webp`)), f);
  // ルーレットの縦：新しい画面は従来の約 2/3（--mmr-h＝pw × 板の縦横比 × 1.16 ＋ 余白）
  const h = (hk, pad, pw = 78) => pw * hk * 1.16 + pad;
  const r = h(256 / 229, 12) / h(360 / 229, 28); assert.ok(r > 0.62 && r < 0.75, `縦 ${Math.round((1 - r) * 100)}% 減`);
});

test('DV-07：最新の版へ＝MM_BUILD と version.json が同じ・15分に1回まで・standalone にしない・Service Worker は無い', () => {
  const b = JSON.parse(rd('version.json')).build;
  assert.equal((HTML.match(/const MM_BUILD="([^"]+)";/) || [])[1], b);
  assert.match(HTML, /if\(r&&r\.b===b&&Date\.now\(\)-r\.t<15\*60\*1000\)return;/);
  assert.doesNotMatch(HTML.slice(0, HTML.indexOf('<style>')), /apple-mobile-web-app-capable|rel="manifest"/, 'ホーム画面のアイコンは従来どおり Safari で開く（standalone にすると保存領域が別になりセーブが見えなくなる）');
  assert.doesNotMatch(HTML, /serviceWorker\.register/);
});

test('DV-08：fight() の中に新しい呼び出しは無い・セーブの形（v6・mr4v6）に新しい項目は無い', () => {
  const f = HTML.slice(HTML.indexOf('async function fight('), HTML.indexOf('\n$("#snd").textContent'));
  assert.doesNotMatch(f, /MMCROWD|MMVOICE|crowd|voice|mma-cine/);
  for (const f2 of ['js/battle/crowd.js', 'js/npc/voice-cues.js']) assert.doesNotMatch(rd(f2), /\bsave\(|mr4v6|S\.npcFlags/, `${f2} はセーブに触れない`);
  assert.doesNotMatch(rd('js/audio/audio-manager.js').replace(/\/\/[^\n]*/g, ''), /mr4v6|localStorage\.setItem\(['"]mr4/);
});
