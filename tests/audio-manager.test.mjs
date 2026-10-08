// =========================================================
// Audio 基盤（2026-10-02 正式改修）：js/audio/audio-manager.js（MMAUDIO）・js/audio/audio-registry.js・index.html の互換層
//  AUDIO-1〜15（Node で動かす。AudioContext・<audio>・XMLHttpRequest は偽物。画面の確認は tests/qa-e2e-feel.test.mjs の FE-7〜）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const HTML = rd('index.html');
const tick = (ms = 0) => new Promise((ok) => setTimeout(ok, ms));

/** 偽の Web Audio・<audio>・XHR で Audio Manager を読む */
function env(o = {}) {
  const log = { audios: [], xhr: [], plays: 0, ctxs: 0 };
  class Param { constructor(v) { this.value = v; } setValueAtTime(v) { this.value = v; } linearRampToValueAtTime(v) { this.value = v; } cancelScheduledValues() {} }
  class Node { constructor() { this.gain = new Param(1); this.out = []; } connect(n) { this.out.push(n); return n; } disconnect() {} }
  class Buf { constructor(ch, len, sr) { this.numberOfChannels = ch; this.length = len; this.sampleRate = sr; this.ch = Array.from({ length: ch }, () => new Float32Array(len)); } getChannelData(i) { return this.ch[i]; } copyToChannel(a, i) { this.ch[i].set(a); } }
  class Ctx {
    constructor() { this.state = o.ctxState || 'running'; this.currentTime = 0; this.sampleRate = 44100; this.destination = { dest: true }; log.ctxs++; }
    resume() { this.state = 'running'; return Promise.resolve(); }
    suspend() { this.state = 'suspended'; return Promise.resolve(); }
    createGain() { return new Node(); }
    createMediaElementSource(el) { el.wired = (el.wired || 0) + 1; if (el.wired > 1) throw new Error('InvalidStateError: HTMLMediaElement already connected'); return new Node(); }
    createBuffer(ch, len, sr) { return new Buf(ch, len, sr); }
    createBufferSource() { const n = new Node(); n.start = () => { if (n.buffer && n.buffer.length > 1) log.plays++; n.started = true; }; n.stop = () => {}; return n; }
    decodeAudioData(ab, ok, ng) { if (o.decodeFail) { ng(new Error('EncodingError')); return; } const b = new Buf(1, 44100 * 6, 44100); b.ch[0][100] = 0.5; b.ch[0][4000] = 0.2; if (o.decodeDelay) setTimeout(() => ok(b), o.decodeDelay); else ok(b); }
  }
  class Audio {
    constructor() { this.src = ''; this.volume = 1; this.loop = false; this.paused = true; this.ls = {}; this.plays = 0; log.audios.push(this); }
    canPlayType() { return o.canPlay === false ? '' : 'probably'; }
    addEventListener(t, f) { (this.ls[t] = this.ls[t] || []).push(f); }
    emit(t) { (this.ls[t] || []).forEach((f) => f()); }
    play() { this.plays++; if (o.rejectPlay) { this.paused = true; const e = new Error('NotAllowedError'); e.name = 'NotAllowedError'; return Promise.reject(e); } this.paused = false; return Promise.resolve(); }
    pause() { this.paused = true; }
    load() {}
  }
  class XHR { open(m, u) { this.url = u; } send() { log.xhr.push(this.url); setTimeout(() => { if (o.xhrFail) { this.status = 404; this.response = null; } else { this.status = 200; this.response = new ArrayBuffer(8); } this.onload && this.onload(); }, 0); } }
  const doc = { hidden: false, ls: {}, addEventListener(t, f) { (this.ls[t] = this.ls[t] || []).push(f); }, emit(t) { (this.ls[t] || []).forEach((f) => f()); } };
  const store = o.store || { d: {}, getItem(k) { return this.d[k] ?? null; }, setItem(k, v) { this.d[k] = String(v); } };
  const w = { localStorage: store, Audio, XMLHttpRequest: XHR, document: doc };
  if (!o.noWebAudio) w.AudioContext = Ctx;
  new Function('window', rd('js/audio/audio-manager.js'))(w);
  return { A: w.MMAUDIO, log, w, doc, store };
}
/** 合成音（legacy）の偽物：呼ばれた記録だけ */
function legacySpy(A) {
  const L = { bgm: [], stop: 0, sfx: [], muted: false };
  A.attachLegacy({ bgm: (s) => L.bgm.push(s), stop: () => { L.stop++; }, sfx: (n, o) => { L.sfx.push([n, o && o.legacy]); return true; }, muted: () => L.muted, setMuted: (on) => { L.muted = on; } });
  return L;
}
const active = (A) => A.status().slots.filter((s) => s.active);
const BGM = (A, k = 'TOWN', src = './bgm/town.ogg', gain = 0.7) => A.registerBgm(k, src, { gain });

test('AUDIO-1：同じ場面を続けて指定しても BGM は増えない（<audio> は2本だけ・鳴っているのは1本・play() は1回）', async () => {
  const { A, log } = env(); legacySpy(A); BGM(A);
  assert.equal(A.scene('TOWN'), true); assert.equal(A.scene('TOWN'), false); assert.equal(A.scene('TOWN'), false); A.scene('TOWN', { fade: 'quick' });
  await tick(20);
  assert.equal(active(A).length, 1); assert.equal(log.audios.filter((a) => a.src === './bgm/town.ogg').length, 1);
  assert.equal(log.audios.find((a) => a.src === './bgm/town.ogg').plays, 1, 'play() は1回');
  assert.ok(log.audios.length <= 3, '<audio> はプール2本（＋canPlayType 用の1本）だけ：' + log.audios.length);
  assert.equal(A.status().plays, 1);
});

test('AUDIO-2：A → B で B だけが残る（A はフェードアウトして止まる。B はクロスフェードで上がる）', async () => {
  const { A, log } = env(); legacySpy(A); BGM(A, 'TOWN', './bgm/a.ogg', 0.7); BGM(A, 'MARKET', './bgm/b.ogg', 0.5);
  A.scene('TOWN'); await tick(5); A.scene('MARKET'); await tick(800);
  const a = log.audios.find((x) => x.src === './bgm/a.ogg'), b = log.audios.find((x) => x.src === './bgm/b.ogg');
  assert.ok(a.paused, 'A は止まる'); assert.ok(!b.paused, 'B は鳴っている');
  const s = A.status(); assert.equal(active(A).length, 1); assert.equal(active(A)[0].src, './bgm/b.ogg'); assert.equal(active(A)[0].gain, 0.5, 'B の音量＝registry の gain（GainNode）');
  assert.equal(s.slots.find((x) => x.src === './bgm/a.ogg'), undefined, 'A の slot は空になる'); assert.equal(s.scene, 'MARKET'); assert.equal(s.source, 'file');
});

test('AUDIO-3：A → B → C を続けて切り替えても C だけが残る。<audio> への MediaElementSource の接続は要素ごとに1回だけ', async () => {
  const { A, log } = env(); legacySpy(A);
  for (const [k, f] of [['TOWN', 'a'], ['MARKET', 'b'], ['RANCH', 'c'], ['FARM', 'd']]) BGM(A, k, `./bgm/${f}.ogg`);
  A.scene('TOWN'); A.scene('MARKET'); A.scene('RANCH'); await tick(800);
  const el = (f) => log.audios.find((x) => x.src === `./bgm/${f}.ogg`);
  assert.ok(!el('c').paused, 'C は鳴っている'); assert.equal(active(A).length, 1); assert.equal(active(A)[0].src, './bgm/c.ogg'); assert.ok(active(A)[0].gain > 0);
  assert.ok(log.audios.filter((x) => !x.paused).length === 1, '鳴っている <audio> は1本');
  for (let i = 0; i < 12; i++) A.scene(['TOWN', 'MARKET', 'RANCH', 'FARM'][i % 4]);
  await tick(800);
  assert.equal(active(A).length, 1); assert.equal(active(A)[0].src, './bgm/d.ogg'); assert.equal(log.audios.filter((x) => !x.paused).length, 1);
  for (const x of log.audios) assert.ok(!x.wired || x.wired === 1, 'createMediaElementSource は要素ごとに1回');
  assert.deepEqual(A.status().errors, []);
});

test('AUDIO-4：正式な BGM が鳴る場面では合成 BGM を止め、鳴らさない（二重再生なし）。曲の無い場面は合成 BGM', async () => {
  const { A } = env(); const L = legacySpy(A); BGM(A, 'TOWN', './bgm/town.ogg');
  A.scene('TOWN'); await tick(5);
  assert.deepEqual(L.bgm, [], '正式な曲の場面では合成 BGM を呼ばない'); assert.ok(L.stop >= 1, '合成 BGM は止める');
  A.scene('TRAINING'); await tick(5);
  assert.deepEqual(L.bgm, ['TRAINING']); assert.equal(A.status().source, 'legacy'); assert.equal(active(A).length, 0, 'ファイルの BGM はフェードアウトに入る');
  await tick(800); assert.equal(A.status().slots.filter((s) => !s.paused).length, 0);
  A.scene('TOWN'); await tick(5); assert.equal(A.status().source, 'file'); assert.deepEqual(L.bgm, ['TRAINING'], '戻っても合成 BGM は呼ばれない');
  assert.equal(L.stop >= 2, true);
});

test('AUDIO-5：正式な BGM の読み込み失敗（404・デコード不可）・再生できない形式は、合成 BGM へ落ちる。同じファイルを何度も試さない', async () => {
  const { A, log } = env(); const L = legacySpy(A); BGM(A, 'TOWN', './bgm/missing.ogg');
  A.scene('TOWN'); await tick(5);
  const el = log.audios.find((x) => x.src === './bgm/missing.ogg'); el.emit('error'); await tick(5);
  assert.deepEqual(L.bgm, ['TOWN'], '失敗したら同じ場面を合成 BGM で'); assert.equal(A.status().source, 'legacy'); assert.deepEqual(A.status().failed, ['./bgm/missing.ogg']);
  assert.equal(A.status().errors.length, 1);
  A.scene('MARKET'); A.scene('TOWN'); await tick(5);
  assert.equal(log.audios.filter((x) => x.src === './bgm/missing.ogg').length, 1, '失敗したファイルは試し直さない'); assert.deepEqual(L.bgm, ['TOWN', 'MARKET', 'TOWN']);
  assert.equal(A.status().errors.length, 1, '同じエラーは1回だけ記録');
  // 形式が再生できない（canPlayType が空）→ 最初から合成 BGM
  const e2 = env({ canPlay: false }); const L2 = legacySpy(e2.A); BGM(e2.A, 'TOWN', './bgm/town.ogg'); e2.A.scene('TOWN'); await tick(5);
  assert.deepEqual(L2.bgm, ['TOWN']); assert.equal(e2.log.audios.filter((x) => x.src === './bgm/town.ogg').length, 0);
  // src が配列なら再生できる形式を選ぶ
  const e3 = env(); legacySpy(e3.A); e3.A.registerBgm('TOWN', ['./bgm/town.xyz', './bgm/town.ogg']); e3.A.scene('TOWN'); await tick(5);
  assert.equal(active(e3.A)[0].src, './bgm/town.ogg');
});

test('AUDIO-6：ミュートで全部の経路が止まる（Master の GainNode＝ファイル BGM・合成 BGM、ファイル SE・合成 SE は鳴らさない）', async () => {
  const { A, log, w } = env(); const L = legacySpy(A); BGM(A, 'TOWN', './bgm/town.ogg'); A.registerSe('UI_CONFIRM', './se/ok.ogg');
  A.unlock(); await tick(10); A.scene('TOWN'); await tick(5);
  assert.equal(A.se('UI_CONFIRM'), true); assert.equal(log.plays, 1, 'ファイル SE は AudioBuffer で鳴る');
  A.setMuted(true);
  assert.equal(L.muted, true); assert.equal(A.status().muted, true);
  assert.equal(A.se('UI_CONFIRM'), false); assert.equal(A.se('DICE_LAND'), false); assert.equal(log.plays, 1); assert.deepEqual(L.sfx, [], 'ミュート中は合成 SE も呼ばない');
  const master = A.status(); assert.equal(master.source, 'file');
  // Master の gain が 0（GainNode。iPhone でも効く）
  const ctxMaster = w.__master; // 直接は見えないので、状態で確かめる：ミュート後に合成 BGM へ切り替えても鳴らさない
  A.scene('TRAINING'); await tick(5); assert.deepEqual(L.bgm, [], 'ミュート中は合成 BGM を始めない'); assert.equal(A.status().source, 'legacy');
  assert.equal(ctxMaster, undefined);
});

test('AUDIO-7：ミュート解除で BGM が増えない（ファイル BGM は鳴らし直さない。合成 BGM はその場面だけ1回）', async () => {
  const { A, log } = env(); const L = legacySpy(A); BGM(A, 'TOWN', './bgm/town.ogg');
  A.unlock(); A.scene('TOWN'); await tick(5);
  const n0 = log.audios.length, p0 = log.audios.find((x) => x.src === './bgm/town.ogg').plays;
  A.setMuted(true); A.setMuted(false); A.setMuted(true); A.setMuted(false); await tick(5);
  assert.equal(log.audios.length, n0); assert.equal(log.audios.find((x) => x.src === './bgm/town.ogg').plays, p0, 'ファイル BGM は鳴らし直さない'); assert.equal(active(A).length, 1);
  assert.deepEqual(L.bgm, []);
  A.scene('TRAINING'); await tick(5); assert.deepEqual(L.bgm, ['TRAINING']);
  const s1 = L.stop; A.setMuted(true); assert.ok(L.stop > s1, 'ミュートで合成 BGM は止める'); A.setMuted(false); assert.deepEqual(L.bgm, ['TRAINING', 'TRAINING'], '合成 BGM はその場面を1回だけ鳴らし直す');
});

test('AUDIO-8：音量は localStorage mmaudio（{ bgm, se }）と互換。既存の値を読み、0〜1 に収めて保存する', () => {
  const store = { d: { mmaudio: JSON.stringify({ bgm: 0.5, se: 0.3 }) }, getItem(k) { return this.d[k] ?? null; }, setItem(k, v) { this.d[k] = String(v); } };
  const { A } = env({ store });
  assert.deepEqual(A.status().volume, { bgm: 0.5, se: 0.3 });
  A.setVolume('bgm', 3); A.setVolume('se', -1); A.setVolume('nope', 1);
  assert.deepEqual(A.status().volume, { bgm: 1, se: 0 }); assert.deepEqual(JSON.parse(store.getItem('mmaudio')), { bgm: 1, se: 0 });
  const bad = { d: { mmaudio: '{broken' }, getItem(k) { return this.d[k] ?? null; }, setItem(k, v) { this.d[k] = String(v); } };
  assert.deepEqual(env({ store: bad }).A.status().volume, { bgm: 0.8, se: 0.9 }, '壊れた値は既定値');
});

test('AUDIO-9：旧 sfx(n) → 出来事の名前 → MMAUDIO。fight()（Phase 6）の中の sfx(n) も届く。合成音へ落ちるときは元の番号の音のまま', () => {
  assert.match(HTML, /function sfx\(t,dl\)\{const n=sfxEventOf\(t\);if\(n&&MMAUDIO\.se\(n,\{delay:dl,legacy:t\}\)\)return;sfxSynth\(t,dl\)\}/);
  assert.match(HTML, /function sfxSynth\(t,dl\)\{const c=AU\.ctx;/);
  assert.match(HTML, /sfx:\(n,o\)=>\{const t=o&&o\.legacy!=null\?o\.legacy:LEGACY_SE\[n\];if\(t==null\)return false;sfxSynth\(t,o&&o\.delay\);return true\}/, '合成音は元の番号で鳴らす');
  const T = new Function(HTML.match(/const SFX_EVENT=\{[^;]*\};/)[0] + 'return SFX_EVENT;')();
  const { A } = env(); const L = legacySpy(A);
  for (const [n, [a, b]] of Object.entries(T)) { for (const x of [a, b]) if (x) assert.ok(A.SE.includes(x), `${n} → ${x} は SE の名前`); }
  assert.deepEqual(T[7], ['DICE_THROW', 'ROULETTE_TICK'], 'バトル中の 7 はルーレットのコマ送り');
  assert.equal(A.se('DICE_THROW', { legacy: 7 }), true); assert.deepEqual(L.sfx, [['DICE_THROW', 7]]);
  // fight() の中は変えていない（sfx の呼び出しが残っている）。本体のハッシュは tests/phase7.test.mjs
  const fight = HTML.slice(HTML.indexOf('async function fight(i,teach){'), HTML.indexOf('$("#snd").textContent', HTML.indexOf('async function fight(i,teach){')));
  assert.ok(/sfx\(9\)/.test(fight) && /sfx\(7\)/.test(fight) && /sfx\(3\)/.test(fight) && /skSfx\(k\)/.test(fight));
  assert.match(HTML, /function sfxEventOf\(t\)\{const b=!!document\.getElementById\("bt"\)/);
  // 画面の鍵 → 場面（音源のパスは index.html に書かない）
  assert.match(HTML, /function bgm\(sc\)\{const s=audioSceneFor\(sc\);if\(s\)MMAUDIO\.scene\(s\)\}/);
  assert.doesNotMatch(HTML, /new Audio\(|\.mp3|\.ogg|\.wav|assets\/audio/, 'index.html に音源のファイル名・パスを書かない（registry だけ）');
  for (const f of ['js/chapter/field-view.js', 'js/chapter/dice-renderer.js', 'js/feel/game-feel.js', 'js/phase8/raising.js']) assert.doesNotMatch(rd(f), /\.ogg|\.mp3|assets\/audio/, f);
  assert.doesNotMatch(rd('js/chapter/field-view.js'), /root\.sfx\(7\)/, 'サイコロの合成音の直接呼び出し（DICE_THROW と二重）は無い');
  const LB = new Function(HTML.match(/const LEGACY_BGM=\{[^}]*\};/)[0] + 'return LEGACY_BGM;')();
  for (const s of A.SCENES) assert.ok(LB[s], `${s} の合成 BGM がある`);
  for (const s of Object.keys(LB)) assert.ok(A.SCENES.includes(s), s);
  const LS = new Function(HTML.match(/const LEGACY_SE=\{[^}]*\};/)[0] + 'return LEGACY_SE;')();
  for (const k of Object.keys(LS)) assert.ok(A.SE.includes(k), k);
  for (const k of ['STEP', 'TILE_STOP', 'CHAPTER_START', 'CHAPTER_CLEAR', 'TOURNAMENT_START']) assert.equal(LS[k], undefined, `${k} は合成音では鳴らさない`);
});

test('AUDIO-10：未登録の SE・場面、404、decode の失敗、play() の拒否でもゲームは止まらない（false／記録だけ。同じ記録は1回）', async () => {
  const { A } = env({ xhrFail: true }); A.attachLegacy({ bgm() {}, stop() {}, sfx: (n) => n === 'UI_CONFIRM', muted: () => false, setMuted() {} });
  assert.equal(A.se('NOPE'), false); assert.equal(A.scene('NOPE'), false); assert.equal(A.se('BATTLE_BLOCK'), false, '登録も合成音も無い SE は何もしない');
  A.registerSe('UI_CONFIRM', './se/missing.ogg'); A.unlock(); await tick(10);
  assert.equal(A.status().se.UI_CONFIRM, 'failed'); assert.equal(A.se('UI_CONFIRM'), true, '合成音へ'); await tick(40); A.se('UI_CONFIRM'); assert.equal(A.status().errors.filter((e) => /se-load/.test(e)).length, 1, '同じ読み込み失敗は1回だけ記録');
  const e2 = env({ decodeFail: true }); legacySpy(e2.A); e2.A.registerSe('STAT_UP', './se/x.ogg'); e2.A.unlock(); await tick(10);
  assert.equal(e2.A.status().se.STAT_UP, 'failed'); assert.doesNotThrow(() => e2.A.se('STAT_UP'));
  const e3 = env({ rejectPlay: true }); legacySpy(e3.A); BGM(e3.A, 'TITLE', './bgm/title.ogg'); assert.doesNotThrow(() => e3.A.scene('TITLE')); await tick(10);
  assert.equal(e3.A.status().pendingScene, 'TITLE', '拒否は保留して最初の操作で再開'); assert.doesNotThrow(() => e3.A.unlock());
  assert.throws(() => A.registerBgm('NOPE', 'x.ogg')); assert.throws(() => A.registerSe('NOPE', 'x.ogg')); assert.throws(() => A.registerBgm('TOWN', [], { fallback: 'NOPE' }));
  assert.doesNotThrow(() => { A.stopBgm(); A.setMuted(true); A.setMuted(false); A.unlock(); });
});

test('AUDIO-11：AudioContext は1つだけ。suspended → 最初の操作で resume。裏に回ったら suspend、戻ったら resume して BGM を続ける', async () => {
  const { A, log, doc } = env({ ctxState: 'suspended' }); legacySpy(A); BGM(A, 'TOWN', './bgm/town.ogg'); A.registerSe('UI_CONFIRM', './se/ok.ogg');
  A.scene('TOWN'); await tick(10);
  assert.equal(A.status().context, 'suspended'); assert.equal(A.se('UI_CONFIRM'), true, '止まっている間は合成音へ'); assert.equal(log.plays, 0);
  A.unlock(); A.unlock(); A.unlock(); await tick(5);
  assert.equal(A.status().context, 'running'); assert.equal(log.ctxs, 1, 'AudioContext は1つ'); assert.equal(A.context(), A.context());
  await tick(40); assert.equal(A.se('UI_CONFIRM'), true); assert.equal(log.plays, 1, '動き出したらファイルの SE（AudioBuffer）');
  doc.hidden = true; doc.emit('visibilitychange'); assert.equal(A.status().context, 'suspended'); assert.ok(log.audios.find((x) => x.src === './bgm/town.ogg').paused, '裏では BGM も止める');
  doc.hidden = false; doc.emit('visibilitychange'); await tick(5);
  assert.equal(A.status().context, 'running'); assert.ok(!log.audios.find((x) => x.src === './bgm/town.ogg').paused, '戻ったら続きから'); assert.equal(active(A).length, 1);
  // 中断（electron 以外の 'interrupted' など）からの復帰：operation の unlock で play() し直す
  const el = log.audios.find((x) => x.src === './bgm/town.ogg'); el.paused = true; A.unlock(); assert.ok(!el.paused);
});

test('AUDIO-12：Web Audio が使えない環境でも止まらない（<audio> の volume で鳴らし、SE は合成音へ。AudioContext は作らない）', async () => {
  const { A, log } = env({ noWebAudio: true }); const L = legacySpy(A); BGM(A, 'TOWN', './bgm/town.ogg', 0.5); A.registerSe('UI_CONFIRM', './se/ok.ogg');
  assert.doesNotThrow(() => { A.unlock(); A.scene('TOWN'); A.se('UI_CONFIRM'); A.setMuted(true); A.setMuted(false); A.setVolume('bgm', 0.5); });
  await tick(800);
  const el = log.audios.find((x) => x.src === './bgm/town.ogg'); assert.ok(el && !el.paused); assert.ok(Math.abs(el.volume - 0.25) < 0.01, `volume＝bgm 0.5 × gain 0.5：${el.volume}`);
  assert.equal(A.status().webAudio, false); assert.equal(A.status().context, null); assert.deepEqual(L.sfx, [['UI_CONFIRM', undefined]]);
  A.setMuted(true); await tick(300); assert.ok(el.volume < 0.01, 'ミュートは volume で'); A.setMuted(false); await tick(300); assert.ok(el.volume > 0.2);
});

/** registry（js/audio/audio-registry.js）を読む：MMAUDIO の偽物に登録させて中身を取り出す */
function loadRegistry() {
  const got = { bgm: {}, se: {} }, w = { MMAUDIO: { registerAll: (r) => { Object.assign(got.bgm, r.bgm); Object.assign(got.se, r.se); } } };
  new Function('window', rd('js/audio/audio-registry.js'))(w);
  return { got, REG: w.MMAUDIO_REGISTRY };
}
const srcsOf = (v) => (typeof v === 'string' ? [v] : [].concat(v.srcs || v.src || []));
const onDisk = (src) => path.join(ROOT, src.replace(/^\.\//, '').replace(/[?#].*$/, ''));   // ?v=… はキャッシュよけ（ファイル名ではない）

test('AUDIO-13：registry の BGM：場面の名前が正しく、ファイルが実在し、gain が正の数、fallback の場面が存在する。index.html から読み込む順も正しい', () => {
  const { got, REG } = loadRegistry(), { A } = env();
  assert.ok(Object.keys(got.bgm).length >= 8, 'BGM の登録がある');
  for (const [k, v] of Object.entries(got.bgm)) {
    assert.ok(A.SCENES.includes(k), `場面の名前：${k}`);
    const srcs = srcsOf(v); if (!srcs.length) assert.ok(v.silent === true || (v.fallback && A.SCENES.includes(v.fallback)), `${k}：曲か fallback か silent が要る`);
    for (const s of srcs) { assert.match(s, /^\.\/assets\/audio\/bgm\//, s); assert.ok(existsSync(onDisk(s)) && statSync(onDisk(s)).size > 1000, `ファイルが実在：${s}`); }
    if (v.gain != null) assert.ok(Number.isFinite(v.gain) && v.gain > 0 && v.gain <= 1.5, `${k} の gain`);
    if (v.fallback) assert.ok(srcsOf(got.bgm[v.fallback] || {}).length, `${k} の fallback（${v.fallback}）には曲がある`);
  }
  assert.doesNotThrow(() => A.registerAll(REG));
  // 同じ曲を多数の場面へ使い回していない（1曲＝1場面。fallback は別）
  const used = {}; for (const [k, v] of Object.entries(got.bgm)) for (const s of srcsOf(v)) { used[s] = used[s] || []; used[s].push(k); }
  for (const [s, ks] of Object.entries(used)) assert.equal(ks.length, 1, `${s} は1場面だけ：${ks}`);
  assert.match(HTML, /<script src="\.\/js\/audio\/audio-manager\.js"><\/script>\n<script src="\.\/js\/audio\/audio-registry\.js"><\/script>/, 'registry は Audio Manager の直後に読む');
  assert.doesNotMatch(rd('js/audio/audio-registry.js'), /\bfetch\s*\(|^\s*import\s|^\s*export\s/m);
});

test('AUDIO-14：registry の SE：出来事の名前が正しく、ファイルが実在し、gain が正の数。ふだんは鳴らない5つ（STEP…）も registry で決めてある（ファイルか silent）', () => {
  const { got } = loadRegistry(), { A } = env();
  assert.ok(Object.keys(got.se).length >= 15);
  for (const [k, v] of Object.entries(got.se)) {
    assert.ok(A.SE.includes(k), `出来事の名前：${k}`);
    const srcs = srcsOf(v); assert.ok(srcs.length || v.silent === true, `${k}：ファイルか silent`);
    for (const s of srcs) { assert.match(s, /^\.\/assets\/audio\/se\//, s); assert.ok(existsSync(onDisk(s)) && statSync(onDisk(s)).size > 100, `ファイルが実在：${s}`); }
    if (v.gain != null) assert.ok(Number.isFinite(v.gain) && v.gain > 0 && v.gain <= 8, `${k} の gain`);
  }
  for (const k of ['UI_CONFIRM', 'UI_CANCEL', 'UI_ERROR', 'DICE_THROW', 'DICE_LAND', 'STAT_UP', 'GOLD_GET', 'CHEST_OPEN', 'WILD_ALERT', 'BATTLE_START', 'STEP', 'TILE_STOP', 'CHAPTER_START', 'CHAPTER_CLEAR', 'TOURNAMENT_START']) assert.ok(got.se[k], k);
});

test('AUDIO-15：assets/audio に同じ曲の別形式（ogg／mp3／wav…）の重複が無く、ZIP・WAV・一時ファイルも無い。置いたファイルはすべて registry から参照されている', () => {
  const files = []; const walk = (d) => { for (const n of readdirSync(d)) { const p = path.join(d, n); if (statSync(p).isDirectory()) walk(p); else files.push(p); } };
  walk(path.join(ROOT, 'assets/audio'));
  const audio = files.filter((f) => !/README\.md$/.test(f));
  for (const f of audio) assert.match(f, /\.(ogg|m4a|mp3)$/, `音源の形式：${f}`);
  const stems = {}; for (const f of audio) { const k = f.replace(/\.[a-z0-9]+$/i, ''); (stems[k] = stems[k] || []).push(f); }
  for (const [k, v] of Object.entries(stems)) assert.equal(v.length, 1, `同じ曲の別形式：${v}`);
  for (const f of files) assert.doesNotMatch(f, /\.(zip|wav|tmp|bak|DS_Store)$/i, f);
  const { got } = loadRegistry(); const ref = new Set([...Object.values(got.bgm), ...Object.values(got.se)].flatMap(srcsOf).map(onDisk));
  for (const f of audio) assert.ok(ref.has(f), `registry から参照されていないファイル：${path.relative(ROOT, f)}`);
  assert.ok(existsSync(path.join(ROOT, 'AUDIO_CREDITS.md')) && existsSync(path.join(ROOT, 'assets/audio/README.md')));
  const credits = rd('AUDIO_CREDITS.md'); for (const n of ['JP Soundworks', 'CC BY 4.0', 'Interface SFX Pack 1', 'Ivokard', 'CC0', 'alkakrab', 'Free 25 Fantasy RPG Game Tracks Vol.3', 'HydroGene']) assert.ok(credits.includes(n), n);
});

test('AUDIO-16：場面の別名（旧名）は正式名へ読み替える。fallback の連鎖で曲を引き継ぐ場面は、同じ曲なら鳴らし直さない', async () => {
  const { A, log } = env(); legacySpy(A); BGM(A, 'WILD_BATTLE', './bgm/battle.ogg'); A.registerBgm('RARE_WILD_BATTLE', [], { fallback: 'WILD_BATTLE' }); A.registerBgm('RIVAL_BATTLE', [], { fallback: 'RARE_WILD_BATTLE' });
  assert.equal(A.resolveScene('FACILITY'), 'MARKET'); assert.equal(A.resolveScene('BATTLE'), 'WILD_BATTLE'); assert.equal(A.resolveScene('TOURNAMENT'), 'TOURNAMENT_LOBBY_LOW'); assert.equal(A.resolveScene('SPECIAL'), 'SPECIAL_BATTLE'); assert.equal(A.resolveScene('x'), null);
  assert.equal(A.resolveBgm('RIVAL_BATTLE').key, 'WILD_BATTLE');
  A.scene('BATTLE'); await tick(5); assert.equal(A.status().scene, 'WILD_BATTLE');
  A.scene('RIVAL_BATTLE'); await tick(5); assert.equal(A.status().scene, 'RIVAL_BATTLE'); assert.equal(log.audios.find((x) => x.src === './bgm/battle.ogg').plays, 1, '同じ曲は鳴らし直さない'); assert.equal(active(A).length, 1);
  assert.deepEqual(A.status().inherits, ['RARE_WILD_BATTLE', 'RIVAL_BATTLE']);
});

test('AUDIO-17：registry の silent：場面は BGM も合成 BGM も鳴らさない（ほかの曲は止める・同じ場面は何もしない）。出来事は合成音にも落とさない', async () => {
  const { A, log } = env(); const L = legacySpy(A); BGM(A, 'MARKET', './bgm/m.ogg'); A.registerBgm('TOWN', [], { silent: true }); A.registerSe('STEP', [], { silent: true });
  A.scene('MARKET'); await tick(5); A.scene('TOWN'); await tick(800);
  assert.equal(A.status().source, 'silent'); assert.equal(active(A).length, 0); assert.ok(log.audios.find((x) => x.src === '' || x.paused), 'ほかの曲は止める'); assert.deepEqual(L.bgm, [], '合成 BGM も鳴らさない'); assert.ok(L.stop >= 1);
  assert.equal(A.scene('TOWN'), false, '同じ無音の場面は何もしない');
  A.setMuted(true); A.setMuted(false); assert.deepEqual(L.bgm, [], 'ミュート解除でも鳴らさない');
  assert.equal(A.se('STEP'), true); assert.deepEqual(L.sfx, [], '合成音へ落とさない'); assert.deepEqual(A.status().silent, { bgm: ['TOWN'], se: ['STEP'] });
  assert.doesNotThrow(() => A.registerAll({ bgm: { CHAPTER_1: { silent: true } }, se: { DICE_THROW: { silent: true } } }));
});

test('AUDIO-18：最初のタップ（AudioContext の resume を頼んだ直後・まだ suspended）でも、ファイルの SE は予約して1回だけ鳴る（合成音へ二重に落ちない）。裏に回っている間は予約しない', async () => {
  const { A, log, doc } = env({ ctxState: 'suspended' }); const L = legacySpy(A); A.registerSe('TITLE_START', './se/start.ogg');
  A.context(); await tick(20);
  let resumed = 0; const c = A.context(); c.resume = () => { resumed++; return new Promise((ok) => setTimeout(() => { c.state = 'running'; ok(); }, 30)); };
  A.unlock(); assert.equal(c.state, 'suspended');
  assert.equal(A.se('TITLE_START'), true); assert.equal(log.plays, 1, 'resume を待たずに予約'); assert.deepEqual(L.sfx, [], '合成音は鳴らさない');
  await tick(60); assert.equal(c.state, 'running'); assert.equal(resumed, 1);
  c.state = 'suspended'; doc.hidden = true; doc.emit('visibilitychange'); await tick(5); assert.equal(A.se('TITLE_START'), true); assert.equal(log.plays, 1, '裏では予約しない（合成音へ）');
});

test('AUDIO-19：index.html：開始のタップは TITLE_START の1音だけ（ファイルが鳴らなければ合成のファンファーレ）。名前登録まで TITLE の曲。VS（対戦相手の発表）・能力比較は TOURNAMENT_MATCHUP、実戦の曲は「FIGHT!」の開始音のあと。ゴールは TOURNAMENT_ENTRY', () => {
  assert.match(HTML, /unlock\(\);clearInterval\(AU\.tm\);AU\.tm=null;AU\.sc=null;if\(!MMAUDIO\.se\("TITLE_START",\{wait:900\}\)\)fanfare\(\);/, '2026-10-04：正式の開始音。最初のタップでデコード中でも合成音へ落とさず、出来しだい鳴らす');
  assert.match(HTML, /class="p15start" data-nsfx="1"/, '開始ボタンは UI_CONFIRM を鳴らさない');
  assert.match(HTML, /function p11NameScr\(msg\)\{bgm\(opOn\(\)\?"bureau":"title"\);/, '2026-10-05 PHASE B：正式の序盤導線では登録は管理局＝管理局の曲（BUREAU）。従来の名前登録の画面（自動テストの既定）は開始画面＝無音（TITLE は silent）');
  assert.match(HTML, /bgm\("matchup"\);try\{MMFEEL\.emit\("battle\.matchup"\)\}catch\(e\)\{\}p9Immersive\(true\);/, 'VS は BGM を止めて発表の音');
  assert.match(HTML, /data-nsfx="1" onclick="p9VsGo\(this\)"/, '対戦開始のボタンの決定音と開始の音を重ねない（2026-10-03：VS 画面は fight() の導入だけ）');
  assert.match(HTML, /function p9PreBattle\(kind,rank,go\)\{const m=S\.m;bgm\("matchup"\);/, '能力比較は発表と同じ場面（音を重ねない）');
  const fight = HTML.slice(HTML.indexOf('async function fight(i,teach){'), HTML.indexOf('$("#snd").textContent', HTML.indexOf('async function fight(i,teach){')));
  assert.ok(fight.startsWith('async function fight(i,teach){if(document.getElementById("bt")||!S.m)return;bgm(teach!=null?"dojo":"battle");'), 'fight() は変えていない');
  assert.match(fight, /sfx\(9\);done\(\)/, 'STOP は sfx(9)'); assert.match(fight, /ban\("FIGHT!","#ff5a3a"\);sfx\(3\);/, '開始は sfx(3)');
  // 画面の鍵 → 場面・実戦の曲の予約（S・AU・MMAUDIO・document の偽物）
  const src = HTML.match(/const BGM_SCENE=\{[^}]*\};/)[0] + HTML.match(/const SFX_EVENT=\{[^\n]*\};/)[0] + HTML.slice(HTML.indexOf('function sfxEventOf(t){'), HTML.indexOf('function bgm(sc){'));
  const mk = (raise, bt) => { const calls = [], timers = [], AU = {}, S = { m: raise ? { raise } : null };
    const env = { S, AU, MMAUDIO: { scene: (s, o) => calls.push(['scene', s]), stopBgm: (o) => calls.push(['stop', o && o.fade]) }, MMP8: { boardPhase: (m) => (m.raise.goal ? 'goal' : 'roll') },
      document: { getElementById: (id) => (id === 'bt' && bt ? {} : null) }, setTimeout: (f, ms) => { timers.push([f, ms]); return timers.length; }, clearTimeout: () => {} };
    const f = new Function(...Object.keys(env), src + 'return { audioSceneFor, sfxEventOf, battleSceneFor };')(...Object.values(env));
    return { ...f, calls, timers, AU };
  };
  const t = mk({ ch: 1, goal: true }); assert.equal(t.audioSceneFor('chapter'), 'TOURNAMENT_ENTRY'); assert.equal(mk({ ch: 2 }).audioSceneFor('chapter'), 'CHAPTER_2');
  assert.equal(t.audioSceneFor('matchup'), 'TOURNAMENT_MATCHUP'); assert.equal(t.audioSceneFor('entry'), 'TOURNAMENT_ENTRY');
  const b = mk({ battle: { kind: 'league', rank: 4 }, tour: { status: 'league', rank: 4 } }, true);
  assert.equal(b.audioSceneFor('battle'), null, 'fight() の最初では曲を始めない'); assert.deepEqual(b.calls, [['stop', 'quick']], 'それまでの曲は短く止める'); assert.equal(b.AU.btScene, 'TOURNAMENT_BATTLE_HIGH');
  assert.equal(b.sfxEventOf(9), 'ROULETTE_STOP'); assert.equal(b.sfxEventOf(7), 'ROULETTE_TICK');
  assert.equal(b.sfxEventOf(3), 'BATTLE_START'); const go = b.timers.find((x) => x[1] === 450); assert.ok(go, '開始音の0.45秒後に実戦の曲');
  go[0](); assert.deepEqual(b.calls.at(-1), ['scene', 'TOURNAMENT_BATTLE_HIGH']); assert.equal(b.sfxEventOf(3), 'VICTORY');
  assert.equal(mk({ battle: { kind: 'league', rank: 1 }, tour: { status: 'league', rank: 1 } }).battleSceneFor(), 'TOURNAMENT_BATTLE_LOW');
  for (const [bt, sc] of [['wild', 'WILD_BATTLE'], ['rare', 'RARE_WILD_BATTLE'], ['rival', 'RIVAL_BATTLE']]) assert.equal(mk({ pend: { fx: { battleType: bt } }, battle: { kind: 'practice', rank: 0 } }).battleSceneFor(), sc);
  assert.equal(mk({}, false).sfxEventOf(9), 'BATTLE_ATTACK', 'バトルの外の 9');
  // field-view：止まるマスでは足音を鳴らさない・大会会場は専用の出来事と受付の場面
  const FV = rd('js/chapter/field-view.js');
  assert.match(FV, /markCur\(id\); if \(!last\) feel\('step', \{ id \}\);/);
  assert.equal((FV.match(/id="brollbtn" data-nsfx="1"/g) || []).length, 2, 'START は決定音を鳴らさない（投げる音だけ）');
  assert.match(HTML, /if\(AU\.on\)setTimeout\(\(\)=>MMAUDIO\.se\("UI_CONFIRM"\),250\)\}/, '音を戻した合図は UI_CONFIRM（バトル中の sfx(3)＝開始・勝利と取り違えない）'); assert.match(FV, /feel\('tournament\.arrive'\);/); assert.match(FV, /if \(root\.bgm\) root\.bgm\('chapter'\);/);
});

test('AUDIO-20：ループ区間（loopStart／loopEnd）：終わりの手前で次の1本を loopStart で待たせ、loopEnd でクロスフェード。鳴っているのは1本だけ・常駐のタイマーなし。最後まで来たら loopStart へ。次の1本を鳴らせなければ元の1本へ戻す', async () => {
  const { A, log } = env(); legacySpy(A); A.registerBgm('TOWN', './bgm/t.ogg', { gain: 0.8, loopStart: 2, loopEnd: 20, loopXfade: 0.5 }); A.unlock(); A.scene('TOWN'); await tick(10);
  const el0 = log.audios.find((x) => x.src === './bgm/t.ogg');
  assert.equal(el0.loop, false, 'ループ区間のある曲は <audio> の loop を使わない');
  el0.currentTime = 15; el0.emit('timeupdate'); assert.equal(log.audios.filter((x) => /t\.ogg#t=2$/.test(x.src)).length, 0, 'まだ準備しない');
  el0.currentTime = 16.6; el0.emit('timeupdate');
  const el1 = log.audios.find((x) => x.src === './bgm/t.ogg#t=2'); assert.ok(el1 && el1.paused, '次の1本を loopStart（#t=2）で待たせる（鳴らさない）');
  assert.equal(A.status().slots.filter((s) => s.waiting).length, 1);
  const p1 = el1.plays;   // 最初の操作のときに無音で1回鳴らしてある（iPhone 用の準備）
  el0.currentTime = 19.2; el0.emit('timeupdate'); el0.emit('timeupdate');   // 渡すのは1回だけ
  await tick(450);
  const s1 = A.status(); assert.equal(s1.slots.filter((s) => s.active).length, 1, '鳴らしているのは1本'); assert.ok(!el1.paused, '次の1本が鳴る'); assert.equal(el1.plays - p1, 1, 'play() は1回');
  await tick(650); assert.ok(el0.paused, '前の1本はクロスフェードのあと止まる'); assert.equal(log.audios.filter((x) => !x.paused).length, 1);
  assert.equal(A.status().slots.find((s) => s.active).gain, 0.8, '音量は registry の gain');
  // 最後まで来た（裏でタイマーが遅れたなど）→ loopStart から
  const cur = log.audios.find((x) => !x.paused); cur.currentTime = 30; cur.emit('ended'); assert.equal(cur.currentTime, 2);
  // 次の1本を鳴らせない（iPhone の自動再生の制約など）→ 元の1本で続ける
  cur.currentTime = 16.6; cur.emit('timeupdate'); const nx = log.audios.find((x) => x !== cur && /#t=2$/.test(x.src) && x.paused);
  assert.ok(nx); nx.play = () => Promise.reject(Object.assign(new Error('NotAllowedError'), { name: 'NotAllowedError' }));
  cur.currentTime = 19.3; cur.emit('timeupdate'); await tick(400);
  assert.equal(A.status().slots.filter((s) => s.active).length, 1); assert.ok(!cur.paused, '元の1本が鳴り続ける'); assert.equal(cur.currentTime, 2, 'loopStart から');
  // 不正なループ区間はふつうのループ
  const e2 = env(); legacySpy(e2.A); e2.A.registerBgm('TOWN', './bgm/u.ogg', { loopStart: 10, loopEnd: 12 }); e2.A.unlock(); e2.A.scene('TOWN'); await tick(5);
  assert.equal(e2.log.audios.find((x) => x.src === './bgm/u.ogg').loop, true);
  // 場面を変えたら、待たせていた1本はその場面の曲に使い回す（増えない）
  const e3 = env(); legacySpy(e3.A); e3.A.registerBgm('TOWN', './bgm/t.ogg', { loopEnd: 20 }); e3.A.registerBgm('MARKET', './bgm/m.ogg'); e3.A.unlock(); e3.A.scene('TOWN'); await tick(5);
  const t0 = e3.log.audios.find((x) => x.src === './bgm/t.ogg'); t0.currentTime = 17; t0.emit('timeupdate');
  e3.A.scene('MARKET'); await tick(800);
  assert.equal(e3.A.status().slots.filter((s) => s.active).length, 1); assert.equal(e3.log.audios.filter((x) => !x.paused).length, 1); assert.ok(e3.log.audios.length <= 3);
});

test('AUDIO-21：SE の maxMs／fadeMs：長い余韻の素材を、ファイルを変えずに短く鳴らす（最後に音量を下げて止める）', async () => {
  const { A, log } = env(); legacySpy(A); A.registerSe('WILD_ALERT', './se/fx3.ogg', { gain: 2, maxMs: 2000, fadeMs: 700 }); A.registerSe('UI_CONFIRM', './se/ok.ogg');
  const c = A.context(); await tick(20); const gains = [], stops = [];
  const cg = c.createGain.bind(c); c.createGain = () => { const g = cg(); const p = g.gain, sv = p.setValueAtTime.bind(p), lr = p.linearRampToValueAtTime.bind(p); p.setValueAtTime = (v, t) => { gains.push(['set', v, t]); sv(v, t); }; p.linearRampToValueAtTime = (v, t) => { gains.push(['ramp', v, t]); lr(v, t); }; return g; };
  const cs = c.createBufferSource.bind(c); c.createBufferSource = () => { const n = cs(); n.stop = (t) => stops.push(t); return n; };
  assert.equal(A.se('WILD_ALERT'), true); assert.equal(log.plays, 1);
  assert.deepEqual(gains, [['set', 2, 1.3], ['ramp', 0, 2]], '1.3秒から下げて2秒で0'); assert.deepEqual(stops, [2.02], '2秒で止める');
  gains.length = 0; stops.length = 0; A.se('UI_CONFIRM'); assert.deepEqual([gains, stops], [[], []], 'maxMs の無い SE は最後まで');
  assert.equal(A.registryOf('se').WILD_ALERT.maxMs, 2000);
});

test('AUDIO-22：registry のループ区間・maxMs は正しい値（loopEnd は loopStart＋4秒より後・クロスフェードは区間の半分以下）。第3弾で採用したファイルは alkakrab のパック', () => {
  const { got } = loadRegistry(), { A } = env(); A.registerAll({ bgm: got.bgm, se: got.se });
  const R = A.registryOf('bgm');
  for (const [k, v] of Object.entries(got.bgm)) if (v.loopEnd != null) assert.ok(R[k].loopRange, `${k} のループ区間が有効`);
  // 2026-10-07：RIVAL_BATTLE・TOURNAMENT_BATTLE_HIGH は正式採用の BGM へ（AUDIO-30）。alkakrab のパックは Fx（SE）だけ使う
  for (const k of ['CHAPTER_START']) assert.match(srcsOf(got.se[k])[0], /alkakrab_fantasy_rpg_vol3\//, k);   // MATCHUP は第4弾で NG → silent。WILD_ALERT は 2026-10-06 から正式 SE（AUDIO-27）
  for (const [k, v] of Object.entries(got.se)) if (v.maxMs != null) assert.ok(v.maxMs >= 300 && v.maxMs <= 4000 && (v.fadeMs == null || v.fadeMs <= v.maxMs), k);
  assert.notEqual(got.bgm.CHAPTER_1.silent, true, 'Chapter 1 は第5弾で HydroGene「Spirits Forest」を仮採用（第3弾の候補 Epic Quest・Forest of Mysteries は使わない）');
  for (const f of ['action_4', 'action_5']) assert.ok(!JSON.stringify(got.bgm).includes(f), f);
});

test('AUDIO-23：2026-10-03 第4弾の試遊で NG の音は無音（silent＝合成音にも落とさない・代わりの音を選ばない）。OK の音（CHAPTER_START・MARKET など）はそのまま。NG のファイルは置かない', () => {
  const { got } = loadRegistry();
  // BGM の TOWN・FARM・大会（受付〜結果）は第4弾で無音 → 第5弾で別の曲（HydroGene）を仮採用（AUDIO-24）。NG の曲そのものは使わない（下）
  assert.deepEqual(got.se.TITLE_START, { src: './assets/audio/se/mystic_monsters_official/title_start.ogg', gain: 0.8 }, '2026-10-04：開始の音は正式素材（ユーザー提供）');
  for (const k of ['UI_CONFIRM', 'DICE_LAND', 'DICE_ROLL', 'DICE_STOP', 'TILE_STOP', 'TOURNAMENT_ARRIVAL', 'MATCHUP']) assert.deepEqual(got.se[k], { silent: true }, `SE ${k}`);   // DICE_THROW は 2026-10-06 から正式の完成 SE（AUDIO-27。LAND／ROLL／STOP は鳴らさないまま）
  assert.match(srcsOf(got.se.CHAPTER_START)[0], /fx_2\.ogg$/, 'Chapter 開始の音は OK（そのまま）'); assert.match(srcsOf(got.bgm.MARKET)[0], /town_village_theme_2\.ogg$/, '市場の曲は OK（そのまま）');
  const all = JSON.stringify(got);
  for (const f of ['ambient_4_tranquil_radiance', 'ambient_3_lost_river', 'event_music_4', 'event_music_3', 'town_village_theme_1', 'dungeon_exploration', 'confirm_style_1_004', 'confirm_style_5_001', 'pluck_3', 'pluck_5', 'fx_1.ogg']) assert.ok(!all.includes(f), `NG の音 ${f} を別の場面へ使い回さない`);
  const HTML = readFileSync(path.join(ROOT, 'index.html'), 'utf8'), intro = HTML.slice(HTML.indexOf('function p9TourIntro('), HTML.indexOf('// ---- Phase 9：公式大会（大会掲示板'));
  assert.doesNotMatch(intro, /sfx\(/, '大会開始の演出で音を鳴らさない（風切り音は NG）');
  const DR = readFileSync(path.join(ROOT, 'js/chapter/dice-renderer.js'), 'utf8'), GF = readFileSync(path.join(ROOT, 'js/feel/game-feel.js'), 'utf8');
  assert.match(GF, /'dice\.stop': \{ level: 2, se: 'DICE_STOP' \}/, '停止の音の差し込み口＝dice.stop → DICE_STOP（今は無音）');
  assert.match(DR, /await frame\(\);   \/\/ 止まった姿が描かれたフレームで「完全停止」\n    ov\.dataset\.stopped = '1'; feel\('dice\.stop'\);/, 'dice.stop はサイコロが見た目の上で止まったフレーム');
});

test('AUDIO-24：2026-10-03 第5弾の仮採用（HydroGene 16-bit・CC0）：街・ファーム・特訓・Chapter 1〜4・大会の受付と結果（Royal Castle）', async () => {
  const { got } = loadRegistry(), HG = /hydrogene_16bit_rpg\//;
  const want = { TOWN: '02_lively_city', FARM: '04_peaceful_village', TRAINING: '20_military_base', CHAPTER_1: '07_spirits_forest_full', CHAPTER_2: '17_unknown_island', CHAPTER_3: '14_traveling_the_sky', CHAPTER_4: '15_volcanic_crater', TOURNAMENT_ENTRY: '03_royal_castle' };
  for (const [k, f] of Object.entries(want)) { const s = srcsOf(got.bgm[k])[0]; assert.match(s, HG, k); assert.ok(s.endsWith(f + '.ogg'), `${k}：${s}`); }
  assert.deepEqual(got.bgm.RESULT, { fallback: 'TOURNAMENT_ENTRY' }, '大会の結果は受付と同じ Royal Castle（2026-10-07：対戦表・対戦前比較は正式採用の BGM＝AUDIO-30）');
  // 変えない：市場・牧場・研究所（2026-10-07：野生・レア・ライバル・大会の実戦は正式採用の BGM＝AUDIO-30）
  const keep = { MARKET: 'town_village_theme_2', RANCH: 'town_village_theme_3', LABORATORY: 'event_music_2' };
  for (const [k, f] of Object.entries(keep)) assert.ok(srcsOf(got.bgm[k])[0].endsWith(f + '.ogg'), k);
  assert.deepEqual([got.bgm.CHAPTER_1.loopStart, got.bgm.CHAPTER_1.loopEnd], [27.344, 81.98], 'Spirits Forest は前奏のあとのループ部へ戻る（配布の intro 27.34秒＋loop 54.64秒＝full）');
  // 受付 → 実戦 → 結果：<audio> は同時に1本だけ（二重再生しない）
  const { A } = env(); A.registerAll({ bgm: got.bgm, se: got.se });
  A.scene('TOURNAMENT_ENTRY'); await tick(5); assert.equal(active(A).length, 1); assert.match(active(A)[0].src, /03_royal_castle/);
  A.stopBgm({ fade: 'quick' }); A.scene('TOURNAMENT_BATTLE_LOW'); await tick(800); assert.equal(active(A).length, 1); assert.match(active(A)[0].src, /14_official_rank_battle/);
  A.scene('RESULT'); await tick(800); assert.equal(active(A).length, 1, '二重再生しない'); assert.match(active(A)[0].src, /03_royal_castle/);
});

test('AUDIO-25：2026-10-03 総監査：登録済みで呼ばれていなかった UI の SE をつなぐ（新しい音は足さない）。街へ戻る＝UI_CANCEL（戻る音）・市場の選択の切り替え＝UI_SELECT（1回の操作で1回）。決定音 UI_CONFIRM は NG のため無音のまま・NG のファイルを使わない', () => {
  const { REG } = loadRegistry(), se = REG.se;
  assert.equal(se.UI_CONFIRM.silent, true, '決定音は無音のまま（代わりの音を判断で選ばない）');
  assert.match(se.UI_CANCEL.src, /back_style_4_002\.ogg$/); assert.match(se.UI_SELECT.src, /cursor_style_2\.ogg$/);
  for (const k of ['UI_CANCEL', 'UI_SELECT']) assert.doesNotMatch(se[k].src, /confirm_style_1_004|confirm_style_5_001|pluck_3|pluck_5|fx_1\.ogg/, `${k} は NG の音ではない`);
  // 戻る：街へ戻るボタン（MMFEEL の back）は、押下を見せる経路（game-feel）でも、すぐ移る経路（index.html の共通のクリック）でも UI_CANCEL を1回
  // 2026-10-04 SE 監査：通常のコマンド・施設へ移動＝既存の UI_SELECT（決定音の正式素材が無いため「既存 UI_SELECT で統一」＝ユーザー指示）。戻る＝UI_CANCEL。バトル画面（#bt）の中は fight() の sfx だけ（二重にしない）
  assert.match(rd('js/feel/game-feel.js'), /emit\(kind === 'back' \? 'ui\.cancel' : \(el\.dataset\.se \? null : 'ui\.select'\)\)/);
  assert.match(HTML, /&&!\(b\.closest&&b\.closest\("#bt"\)\)\)MMAUDIO\.se\(b\.dataset&&b\.dataset\.se\|\|\(window\.MMFEEL&&MMFEEL\.navKind\(b\)=="back"\?"UI_CANCEL":"UI_SELECT"\)\)/, 'data-se＝そのボタンの SE・戻る＝UI_CANCEL・ほか＝UI_SELECT・バトル画面の中は鳴らさない');
  // 選択の切り替え：p10Step の始まりで1回（遠い候補へ1つずつ回す続きの p10Step では鳴らさない）。矢印は決定音を重ねない（data-nsfx）
  assert.match(HTML, /p10Place\(\);if\(!p10Step\.ch&&window\.MMAUDIO\)MMAUDIO\.se\("UI_SELECT"\);/);
  assert.match(HTML, /p10Step\.ch=1;try\{p10Step\(/);
  assert.equal((HTML.match(/class="p10arw (?:prev|next)"[^>]*data-nsfx="1"/g) || []).length, 2);
});

test('AUDIO-26：2026-10-04 正式の開始音（TITLE_START）：最初のタップ（unlock と同時にデコードが始まる）でも se(name, { wait }) はデコードを待って1回だけ鳴らす（合成音へ落とさない）。期限を過ぎたら鳴らさない。PROLOGUE・STEP・RIVAL_APPEAR は無音のまま', async () => {
  for (const [wait, want] of [[900, 1], [5, 0]]) {
    const { A, log } = env({ ctxState: 'suspended', decodeDelay: 40 }); const L = legacySpy(A); A.registerSe('TITLE_START', './assets/audio/se/mystic_monsters_official/title_start.ogg', { gain: 0.8 });
    await tick(20); A.unlock();
    assert.equal(A.se('TITLE_START', { wait }), true); assert.equal(log.plays, 0, 'まだデコード中'); assert.deepEqual(L.sfx, [], '合成音（ファンファーレ）へ落とさない');
    await tick(80); assert.equal(log.plays, want, wait > 40 ? 'デコードが終わったら鳴る' : '期限を過ぎたら鳴らさない');
    assert.equal(A.status().se.TITLE_START, 'ready');
  }
  const { got } = loadRegistry();
  assert.ok(existsSync(path.join(ROOT, 'assets/audio/se/mystic_monsters_official/title_start.ogg')), 'OGG がある'); assert.ok(!existsSync(path.join(ROOT, 'assets/audio/se/mystic_monsters_official/title_start.mp3')), '同じ音の MP3 は置かない');
  assert.deepEqual(got.se.STEP, { silent: true }, '1マスごとの足音は無音のまま');   // PROLOGUE・RIVAL_APPEAR は 2026-10-06 から正式素材（AUDIO-27）
});

test('AUDIO-27：2026-10-06 正式音源（ユーザー提供・ゲームの所有素材）：TITLE・PROLOGUE（ループしない）の BGM と正式 SE 15種。サイコロは1ロール1回・宝箱は段階ごとに1つ・野生／レア／ライバルは別の音・旧い音を重ねない', async () => {
  const { got } = loadRegistry(), MMB = './assets/audio/bgm/mystic_monsters_official/', MMO = './assets/audio/se/mystic_monsters_official/';
  assert.deepEqual(got.bgm.TITLE, { silent: true }, '2026-10-05 PHASE B：開始画面に BGM は無い');
  assert.deepEqual(got.bgm.PROLOGUE, { silent: true }, '2026-10-06 重大修正：プロローグ BGM は削除（プツプツ鳴る）');
  assert.deepEqual(got.se.TITLE_START, { src: MMO + 'title_start.ogg', gain: 0.8 }, '開始の音はそのまま');
  const want = { DICE_THROW: '01_dice_large_full', TRAINING_ITEM_SPAWN: '02_training_item_spawn', MARKET_PURCHASE: '03_market_purchase_confirm', TRAINING_SUCCESS: '04_training_success', MONSTER_ENTRY: '05_small_monster_entry_steps_4step',
    WILD_ALERT: '06_encounter_wild', RARE_ALERT: '07_encounter_rare', RIVAL_APPEAR: '08_encounter_rival', TREASURE_TIER_1: '09_treasure_open_tier1', TREASURE_TIER_2: '10_treasure_open_tier2', TREASURE_TIER_3: '11_treasure_open_tier3', TREASURE_TIER_4: '12_treasure_open_tier4',
    REST_RECOVER: '13_rest_recover', EVENT_TRIGGER: '14_event_trigger', BRANCH_SELECT: '15_branch_select' };
  for (const [k, f] of Object.entries(want)) { assert.equal(srcsOf(got.se[k])[0], MMO + f + '.ogg', k); assert.ok(got.se[k].gain > 0.5 && got.se[k].gain <= 1.2, `${k} の gain`); assert.ok(existsSync(path.join(ROOT, MMO, f + '.ogg')), f); }
  assert.ok(existsSync(path.join(ROOT, MMB, 'mystic_monsters_bureau_bgm_official.ogg'))); assert.ok(!existsSync(path.join(ROOT, MMB, 'mystic_monsters_prologue_bgm_official.ogg')), '2026-10-06：プロローグ BGM のファイルは置かない');
  assert.ok(!existsSync(path.join(ROOT, MMB, 'mystic_monsters_title_theme_official.ogg')), '旧タイトル曲は置かない（読み込まない）');
  for (const k of ['DICE_LAND', 'DICE_ROLL', 'DICE_STOP', 'STEP']) assert.deepEqual(got.se[k], { silent: true }, `${k}：完成 SE と重ねない`);
  assert.ok(!existsSync(path.join(ROOT, 'assets/audio/bgm/pgs_fantasy_rpg/event_music_1.ogg')) && !existsSync(path.join(ROOT, 'assets/audio/se/alkakrab_fantasy_rpg_vol3/fx_3.ogg')), '使わなくなった旧い音源は置かない');
  // 出来事 → SE：1つの出来事に1つの音
  const w = {}; new Function('window', rd('js/feel/game-feel.js'))(w); const E = w.MMFEEL.EVENTS;
  const map = { 'dice.throw': 'DICE_THROW', 'dice.land': 'DICE_LAND', 'dice.stop': 'DICE_STOP', 'dice.result': 'DICE_ROLL', 'stat.up': 'TRAINING_SUCCESS', 'train.item': 'TRAINING_ITEM_SPAWN', 'market.buy': 'MARKET_PURCHASE', 'monster.enter': 'MONSTER_ENTRY',
    'wild.alert': 'WILD_ALERT', 'rare.alert': 'RARE_ALERT', 'rival.appear': 'RIVAL_APPEAR', 'chest.open.normal': 'TREASURE_TIER_1', 'chest.open.rare': 'TREASURE_TIER_2', 'chest.open.special': 'TREASURE_TIER_3', 'rest.recover': 'REST_RECOVER', 'event': 'EVENT_TRIGGER', 'branch.select': 'BRANCH_SELECT' };
  for (const [ev, se] of Object.entries(map)) assert.equal(E[ev].se, se, ev);
  assert.ok(!Object.values(E).some((x) => x.se === 'TREASURE_TIER_4'), '宝箱4の音はどこからも鳴らさない（第4の段階は無い）');
  const FV = rd('js/chapter/field-view.js'), DR = rd('js/chapter/dice-renderer.js'), H = rd('index.html');
  assert.match(FV, /cue = rival \? 'rival\.appear' : bt === 'rare' \? 'rare\.alert' : 'wild\.alert'/);
  assert.match(FV, /feel\(\['normal', 'rare', 'special'\]\.includes\(fx\.tier\) \? `chest\.open\.\$\{fx\.tier\}` : 'chest\.open'/, '宝箱は段階ごとに1つだけ');
  assert.equal((FV.match(/feel\('stat\.up'/g) || []).length, 1); assert.ok(FV.indexOf("feel('train.item'") < FV.indexOf("feel('stat.up'"), '道具の出現 → 成功の順');
  assert.match(FV, /feel\('stat\.up', \{ key: fx\.key, amount: fx\.amount \}\);[^\n]*\n\s+await popup\(/, '成功の音は能力UPの表示が出る瞬間');
  assert.match(FV, /res = P8\(\)\.rest\(gS\(\), m\); doSave\(\); if \(MMCH\.fatigue\(m\) < before\) feel\('rest\.recover'\)/, '休む＝回復が成立したときだけ');
  assert.match(FV, /doSave\(\); feel\('branch\.select', \{ id \}\)/); assert.equal((FV.match(/feel\('monster\.enter'\)/g) || []).length, 1, '4歩の音は登場の1回だけ（1マスごとではない）');
  for (const f of [FV, DR]) assert.doesNotMatch(f.split('\n').map((l) => l.replace(/\/\/.*$/, '')).join('\n'), /\.ogg|\.wav|\.mp3/, '画面のコードに音源のファイル名を書かない');
  // 購入：成立した（purchase が ok・保存した）あとだけ。不足・満員（!r.ok）では鳴らさない
  const adopt = H.slice(H.indexOf('function adopt('), H.indexOf('\n', H.indexOf('function adopt(')));
  assert.ok(adopt.indexOf('if(!r.ok)return market(') < adopt.indexOf('MMFEEL.emit("market.buy")') && adopt.indexOf('save();') < adopt.indexOf('MMFEEL.emit("market.buy")'));
  // サイコロ：Chapter のサイコロは描き方ごとに dice.throw を1回だけ
  const { A, log } = env(); A.registerAll({ bgm: got.bgm, se: got.se }); await tick(5);
  A.se('DICE_THROW'); A.se('DICE_LAND'); A.se('DICE_STOP'); A.se('DICE_ROLL'); await tick(5);
  assert.ok(log.plays <= 1, `1ロールで鳴る音は1つ（${log.plays}）`);
});


test('AUDIO-28：2026-10-05 試遊（Chapter のフィールド BGM が途切れる）：buffer の場面はデコード後に AudioBuffer で鳴らす・同じ場面の再指定で鳴らし直さない・バトルから戻ると続きから', async () => {
  const { A, log, w } = env(); legacySpy(A);
  A.registerBgm('CHAPTER_1', './bgm/ch1.ogg', { gain: 1.1, buffer: true }); A.registerBgm('WILD_BATTLE', './bgm/wild.ogg', { gain: 0.6 });
  A.unlock(); A.scene('CHAPTER_1'); await tick(30);
  let s = A.status(); assert.ok(s.buffer && s.buffer.src === './bgm/ch1.ogg', 'デコード後は AudioBuffer で鳴る'); assert.equal(active(A).length, 0, '<audio> はフェードアウトして止まる');
  const xhr = log.xhr.filter((u) => u === './bgm/ch1.ogg').length;
  for (let i = 0; i < 5; i++) assert.equal(A.scene('CHAPTER_1'), false, '同じ場面は何もしない');
  assert.equal(log.xhr.filter((u) => u === './bgm/ch1.ogg').length, xhr, '読み直さない');
  // 曲の位置を進めてからバトルへ → 戻ると続きから
  const ctx = A.context(); ctx.currentTime += 2.5;
  A.stopBgm({ fade: 'quick' }); A.scene('WILD_BATTLE'); await tick(10); A.scene('CHAPTER_1'); await tick(10);
  s = A.status(); assert.ok(s.buffer, 'Chapter の曲はすぐ AudioBuffer で鳴る（デコード済み）'); assert.ok(s.buffer.pos >= 2.4 && s.buffer.pos <= 2.6, '続きの位置から：' + s.buffer.pos);
  assert.ok(A.registryOf('bgm').CHAPTER_1.buffer, 'registry の buffer');
  // registry の Chapter 1〜4 は buffer
  const R = {}; new Function('window', rd('js/audio/audio-registry.js'))({ MMAUDIO: { registerAll: (r) => Object.assign(R, r) } });
  const reg = R.bgm || R.BGM || {}; for (const k of ['CHAPTER_1', 'CHAPTER_2', 'CHAPTER_3', 'CHAPTER_4']) assert.equal(reg[k] && reg[k].buffer, true, k);
  assert.match(HTML, /navigator\.audioSession\.type!="playback"/, 'audioSession はタップのたびに設定し直さない');
  void w;
});

test('AUDIO-29：2026-10-06 重大修正（iOS）：アラームなどで AudioContext が止められた（interrupted）→ 表に戻る・pageshow・focus・次の操作で resume し、今の曲だけを続きから（二重に鳴らない）。ミュート・音量はそのまま。動かなければ操作の中で suspend → resume をやり直し、無音の1音も鳴らし直す', async () => {
  const { A, log, doc } = env(); legacySpy(A); BGM(A, 'TOWN', './bgm/town.ogg');
  A.unlock(); A.scene('TOWN'); await tick(20);
  A.setVolume('bgm', 0.4); A.setMuted(true);
  const c = A.context(), el = log.audios.find((x) => x.src === './bgm/town.ogg'), plays0 = el.plays;
  // システムが止める（アラーム）：ページは隠れない・<audio> も止まる
  c.state = 'interrupted'; c.onstatechange(); el.paused = true;
  assert.equal(A.status().interrupted, true);
  A.wake(); await tick(5);
  assert.equal(c.state, 'running', 'resume'); assert.equal(el.plays, plays0 + 1, '今の曲を続きから（1回だけ）'); assert.equal(active(A).length, 1, '新しい曲を始めない＝二重に鳴らない');
  assert.equal(A.status().muted, true, 'ミュートはそのまま'); assert.equal(A.status().volume.bgm, 0.4, '音量はそのまま'); assert.equal(A.status().interrupted, false);
  // resume しても動かない（iOS）→ 次の操作で suspend → resume をやり直す・無音の1音を鳴らし直す
  let stuck = 1; c.resume = function () { if (stuck-- > 0) { this.state = 'interrupted'; return Promise.resolve(); } this.state = 'running'; return Promise.resolve(); };
  let ticks = 0; const mk = c.createBufferSource.bind(c); c.createBufferSource = () => { const n = mk(); const st = n.start; n.start = () => { if (n.buffer && n.buffer.length === 1) ticks++; st(); }; return n; };
  c.state = 'interrupted'; c.onstatechange();
  A.unlock(); await tick(300);
  assert.equal(c.state, 'running', '操作の中でやり直して戻る'); assert.equal(ticks, 1, '無音の1音を鳴らし直す（iOS は操作の中で音を始めないと戻らない）');
  // 自分で裏に回って止めた suspend は中断として数えない
  doc.hidden = true; doc.emit('visibilitychange'); c.onstatechange(); assert.equal(A.status().interrupted, false);
  doc.hidden = false; doc.emit('visibilitychange'); await tick(5); assert.equal(c.state, 'running');
  const src = rd('js/audio/audio-manager.js'); assert.match(src, /root\.addEventListener\('pageshow'/); assert.match(src, /root\.addEventListener\('focus', \(\) => wake\(\)\)/);
});

test('AUDIO-30：2026-10-07 正式採用の BGM 14曲：プロローグ6場面・セドリック・対戦表（17秒から）・対戦前比較のジングル・ライバル・闘技場・野生・レア・公式ランク戦。ファイルは OGG・実在・場面ごとに1曲（誤った戦闘曲にしない）', async () => {
  const { got } = loadRegistry(), L = './assets/audio/bgm/licensed_20261007/';
  const want = { PROLOGUE_1: '01_prologue_peace', PROLOGUE_2: '02_prologue_calamity', PROLOGUE_3: '03_prologue_hopeful', PROLOGUE_4: '04_prologue_legend_battle', PROLOGUE_5: '05_prologue_tournament', PROLOGUE_6: '06_prologue_departure', CEDRIC: '07_cedric_pre_tournament', TOURNAMENT_LOBBY_LOW: '08_tournament_table_start17s', TOURNAMENT_MATCHUP: '09_prebattle_compare_jingle', RIVAL_BATTLE: '10_rival_battle', ARENA: '11_arena_swords_at_midnight_loop', WILD_BATTLE: '12_wild_battle', RARE_WILD_BATTLE: '13_rare_monster_battle', TOURNAMENT_BATTLE_LOW: '14_official_rank_battle' };
  for (const [k, f] of Object.entries(want)) { assert.equal(srcsOf(got.bgm[k])[0], L + f + '.ogg', k); assert.ok(existsSync(path.join(ROOT, L, f + '.ogg')), f); assert.ok(got.bgm[k].gain > 0 && got.bgm[k].gain <= 1.2, `${k} gain`); }
  assert.deepEqual([got.bgm.TOURNAMENT_LOBBY_HIGH, got.bgm.TOURNAMENT_BATTLE_HIGH], [{ fallback: 'TOURNAMENT_LOBBY_LOW' }, { fallback: 'TOURNAMENT_BATTLE_LOW' }], 'B〜S も同じ曲');
  assert.equal(got.bgm.TOURNAMENT_LOBBY_LOW.start, 17, '対戦表は17秒付近から'); assert.equal(got.bgm.TOURNAMENT_LOBBY_LOW.loopStart, 17);
  for (let i = 1; i <= 6; i++) assert.equal(got.bgm['PROLOGUE_' + i].loop, false, `PROLOGUE_${i} は頭から1回`);
  assert.equal(got.bgm.TOURNAMENT_MATCHUP.loop, false, '対戦前比較は短いジングル（ループしない）');
  assert.deepEqual(got.bgm.PROLOGUE, { silent: true }, '旧1曲のプロローグ BGM は削除のまま');
  // 開始位置：メディアフラグメント #t=17（ファイルは加工しない）
  const { A, log } = env(); A.registerAll({ bgm: got.bgm, se: got.se });
  A.scene('TOURNAMENT_LOBBY_LOW'); await tick(5); assert.ok(log.audios.some((x) => /08_tournament_table_start17s\.ogg#t=17$/.test(x.src)), '17秒から鳴らす');
  A.scene('TOURNAMENT_MATCHUP'); await tick(800); assert.equal(active(A).length, 1); assert.match(active(A)[0].src, /09_prebattle_compare_jingle/);
  // 画面 → 場面
  const HTML = readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.match(HTML, /MMPRO\.play\(\{cover:cv,onScene:si=>\{if\(A&&si===0\)\{A\.scene\("PROLOGUE_1",\{fade:"quick"\}\);proWarm\(2\)\}\},audioLeadMs:PRO_AUDIO_LEAD,onSceneAudio:si=>\{if\(A\)A\.scene\("PROLOGUE_"\+\(si\+1\),\{fade:"normal"\}\);proWarm\(si\+2\)\}\}\)\)/, 'プロローグの Scene ごとに曲を切り替える（2026-10-07 試遊：Scene 2〜6 は切り替えの少し前からクロスフェード）');
  assert.match(HTML, /const PRO_AUDIO_LEAD=500;/);
  assert.match(HTML.slice(HTML.indexOf('function p9CompareScr('), HTML.indexOf('function p9CompareScr(') + 400), /bgm\("matchup"\)/, '対戦前比較はジングル');
  assert.match(HTML, /cedric:"CEDRIC"/); assert.match(HTML.slice(HTML.indexOf('async function p9TourOpen('), HTML.indexOf('async function p9TourOpen(') + 600), /bgm\("cedric"\)/, 'セドリックの大会前の導入で CEDRIC');
  assert.ok(!existsSync(path.join(ROOT, 'assets/audio/bgm/pgs_fantasy_rpg/battle_music_1.ogg')) && !existsSync(path.join(ROOT, 'assets/audio/bgm/alkakrab_fantasy_rpg_vol3/action_2_battle_of_the_skies.ogg')), '置き換えた旧い戦闘曲は置かない');
  for (const f of ['.mp3', '.wav']) assert.ok(!readFileSync(path.join(ROOT, 'js/audio/audio-registry.js'), 'utf8').includes(f + "'"), `${f} は使わない（OGG に変換）`);
});

test('AUDIO-31：2026-10-08（監査 L-22）：曲を止めた（stopBgm＝フェードアウト中）すぐあとに次の場面の曲を始めても、フェード中の1本を奪わない＝前の曲が途中で切れない', async () => {
  const { A, log } = env(); legacySpy(A);
  A.registerBgm('PROLOGUE_1', './bgm/p1.ogg', { gain: 0.6, loop: false }); A.registerBgm('PROLOGUE_2', './bgm/p2.ogg', { gain: 0.6, loop: false }); A.registerBgm('PROLOGUE_3', './bgm/p3.ogg', { gain: 0.6, loop: false }); A.registerBgm('TOWN', './bgm/town.ogg');
  A.unlock(); const F = A.FADE.normal + 80; A.scene('PROLOGUE_1'); await tick(F); A.scene('PROLOGUE_2'); await tick(F); A.scene('PROLOGUE_3'); await tick(F);   // Scene は数秒ずつ＝前の曲のクロスフェードは終わっている   // プロローグの Scene 1→2→3（slot 0→1→0）
  const p3 = log.audios.find((x) => x.src === './bgm/p3.ogg'); assert.ok(p3 && !p3.paused);
  A.stopBgm({ fade: 'normal' });   // スキップ：P3 をフェードアウト
  A.scene('TOWN'); await tick(10);   // すぐ次の場面
  assert.equal(p3.src, './bgm/p3.ogg', 'フェード中の P3 の <audio> は差し替えない'); assert.equal(p3.paused, false, 'P3 はフェードの間は鳴り続ける（途中で切れない）');
  const town = log.audios.find((x) => x.src === './bgm/town.ogg'); assert.ok(town && town !== p3, '次の曲は別の1本で');
  assert.equal(active(A).length, 1);
  // 両方フェード中（切り替えの直後に止めた）でも、先にフェードを始めた1本を使う
  const e2 = env(); legacySpy(e2.A); for (const k of ['PROLOGUE_1', 'PROLOGUE_2', 'TOWN']) e2.A.registerBgm(k, `./bgm/${k}.ogg`, { loop: false });
  e2.A.unlock(); e2.A.scene('PROLOGUE_1'); await tick(10); e2.A.scene('PROLOGUE_2'); await tick(30); e2.A.stopBgm({ fade: 'normal' }); e2.A.scene('TOWN'); await tick(10);
  assert.equal(e2.log.audios.find((x) => x.src === './bgm/PROLOGUE_2.ogg') ? 1 : 0, 1, 'あとからフェードを始めた PROLOGUE_2 は残る');
});

test('AUDIO-32：2026-10-08（監査 M-11）：1回きりの曲（対戦前比較のジングル）が鳴り終わったあと、タップ（unlock）で頭から鳴らし直さない。ループ曲の中断からの復帰は従来どおり', async () => {
  const { A, log } = env(); legacySpy(A);
  A.registerBgm('TOURNAMENT_MATCHUP', './bgm/jingle.ogg', { gain: 0.6, loop: false }); A.registerBgm('TOWN', './bgm/town.ogg');
  A.unlock(); A.scene('TOURNAMENT_MATCHUP'); await tick(30);
  const j = log.audios.find((x) => x.src === './bgm/jingle.ogg'); assert.ok(j && !j.paused); const n = j.plays;
  j.ended = true; j.paused = true; j.emit('ended');   // 鳴り終わった
  A.unlock(); A.unlock(); await tick(10);
  assert.equal(j.plays, n, 'タップで play() を呼ばない'); assert.equal(j.paused, true);
  // ループ曲が中断で止まった（ended ではない）なら、タップで続きから
  A.scene('TOWN'); await tick(A.FADE.normal + 80);
  const t = log.audios.find((x) => x.src === './bgm/town.ogg'); t.paused = true; const m = t.plays;
  A.unlock(); await tick(10); assert.equal(t.plays, m + 1, '中断したループ曲は再開する');
});

test('AUDIO-33：2026-10-08（監査 M-12）：プロローグ Scene 5 の曲は頭の無音（0.88秒）を飛ばして 0.38秒から（先に鳴らす 0.5秒と合わせて、Scene の切り替えの瞬間に音が出る）。ほかの Scene は頭から', () => {
  const src = rd('js/audio/audio-registry.js');
  assert.match(src, /PROLOGUE_5: \{ src: LIC \+ '05_prologue_tournament\.ogg', gain: 0\.42, loop: false, start: 0\.38 \}/);
  for (const n of [1, 2, 3, 4, 6]) assert.doesNotMatch(src.split('\n').find((l) => l.includes(`PROLOGUE_${n}:`)), /start:/, `PROLOGUE_${n} は頭から`);
  assert.match(HTML, /const PRO_AUDIO_LEAD=500;/);
  const { A, log } = env(); legacySpy(A); A.registerBgm('PROLOGUE_5', './bgm/p5.ogg', { loop: false, start: 0.38 }); A.unlock(); A.scene('PROLOGUE_5');
  assert.ok(log.audios.some((x) => x.src === './bgm/p5.ogg#t=0.38'), 'メディアフラグメント #t=0.38 で読む');
});
