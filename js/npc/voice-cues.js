// =========================================================
// NPC のボイスの出しどころ `MMVOICE`（2026-10-13 開発24・試遊採用）
//  声のファイルと音量は js/audio/audio-registry.js の VOICE_REGISTRY、鳴らす仕組み（専用の音量・ON/OFF・1本だけ・遅れて鳴らない）は MMAUDIO.voice。
//  ここは「どの場面で・どの声を」だけ。CUES の on を false にすれば、その場面の声だけ止まる（声そのものを止めるのは VOICE_REGISTRY の enabled）。
//  ・施設の入口（訪問1回につき1回。施設の中でタブ・メニューを替えても繰り返さない）：ダン＝ベースキャンプ、ニック＝牧場、ベルナ＝アイテム屋、カレン＝市場
//  ・フィナ：台詞の意味が声と合う行だけ（会話の行の voice。npc.js が行の表示に合わせて鳴らし、会話を閉じたら止める）と、Chapter 1 の世界のボードの限られた出来事（見つけた・挑戦の成否・レア）。
//    毎マス・全操作では鳴らさない（同じ出来事の声は CUE_COOLDOWN_MS のあいだ繰り返さない）。
//  エリオット（研究所）の声は同梱だけ・既定 OFF（今回の対象外）。
// =========================================================
(function (root) {
  'use strict';
  const CUES = Object.freeze({
    // 施設の入口
    'facility.farm':   { voice: 'dan_hello', on: true },       // ベースキャンプ（旧ファーム）＝ダン
    'facility.ranch':  { voice: 'nick_hello', on: true },      // 牧場＝ニック
    'facility.shop':   { voice: 'berna_welcome', on: true },   // アイテム屋（補給所）＝ベルナ
    'facility.market': { voice: 'karen_welcome', on: true },   // 市場＝カレン
    'facility.lab':    { voice: 'elliot_hello_OPTIONAL', on: false },   // 研究所＝エリオット（別枠・既定 OFF）
    // Chapter 1 の世界のボード（フィナの短い反応。案内欄のフィナの顔が話す）
    'fina.discover':   { voice: 'fina_look', on: true, cooldown: 45000 },   // 宝箱・宝の行き止まり・隠れ家
    'fina.challengeOk':  { voice: 'fina_yeah', on: true },                 // 封印の遺跡門の挑戦に成功
    'fina.challengeNg':  { voice: 'fina_hmm', on: true },                  // 同・失敗
    // レアモンスターの「なんだろう？」は、初めてのレアのフィナの一言（world-driver.js の ch1_first_rare の行の voice）だけ（遭遇の演出・強制バトルは変えない）
  });
  /** 会話の行に付ける声（データ側で { voice: 'fina_yes' } のように書く）。ここで false にした声は会話でも鳴らさない */
  const LINE_VOICE = Object.freeze({ fina_hello: true, fina_yeah: true, fina_hmm: true, fina_look: true, fina_hey: true, fina_giggle: true, fina_yes: true, fina_wonder: true });
  const CUE_COOLDOWN_MS = 0;
  const last = {}, visit = {}, log = [];
  const A = () => root.MMAUDIO;
  const push = (o) => { log.push({ ...o, at: Date.now() }); if (log.length > 50) log.shift(); };
  /** 場面の声（cue 名）。鳴らし始めた／待ちに入ったら true */
  function cue(name, opts = {}) {
    const c = CUES[name]; if (!c || !c.on) { push({ cue: name, result: c ? 'cue-off' : 'unknown' }); return false; }
    const now = Date.now(), cd = c.cooldown != null ? c.cooldown : CUE_COOLDOWN_MS;
    if (cd && last[name] && now - last[name] < cd) { push({ cue: name, result: 'cooldown' }); return false; }
    last[name] = now;
    const a = A(); if (!a || typeof a.voice !== 'function') return false;
    const ok = a.voice(c.voice, opts);
    push({ cue: name, voice: c.voice, result: (a.voiceLog().slice(-1)[0] || {}).result || (ok ? 'play' : 'no') });
    return ok || (a.voiceLog().slice(-1)[0] || {}).result === 'wait';
  }
  /** 施設の入口：訪問1回につき1回（enter）。施設を出たら visitReset で忘れる */
  function enter(fac) {
    if (visit[fac]) return false;
    visit[fac] = 1;
    return cue('facility.' + fac);
  }
  /** keep 以外の訪問の記録を消す（街へ戻った・Chapter・バトルへ出た） */
  function visitReset(keep) { for (const k of Object.keys(visit)) if (!keep || !keep.includes(k)) delete visit[k]; }
  /** 会話の行の声（npc.js から） */
  function line(id) {
    if (!id || !LINE_VOICE[id]) { push({ line: id, result: 'line-off' }); return false; }
    const a = A(); if (!a || typeof a.voice !== 'function') return false;
    const ok = a.voice(id, { maxWaitMs: 350 });
    push({ line: id, result: (a.voiceLog().slice(-1)[0] || {}).result || (ok ? 'play' : 'no') });
    return ok;
  }
  function stop(ms) { const a = A(); if (a && typeof a.stopVoice === 'function') a.stopVoice(ms); }
  root.MMVOICE = Object.freeze({ CUES, LINE_VOICE, cue, enter, visitReset, line, stop, log: () => log.slice(), visited: () => ({ ...visit }) });
})(typeof window !== 'undefined' ? window : globalThis);
