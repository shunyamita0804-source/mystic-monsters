// =========================================================
// NPC のボイスの出しどころ `MMVOICE`（2026-10-13 開発24・試遊採用）
//  声のファイルと音量は js/audio/audio-registry.js の VOICE_REGISTRY、鳴らす仕組み（専用の音量・ON/OFF・1本だけ・遅れて鳴らない）は MMAUDIO.voice。
//  ここは「どの場面で・どの声を」だけ。CUES の on を false にすれば、その場面の声だけ止まる（声そのものを止めるのは VOICE_REGISTRY の enabled）。
//  ・施設の入口（訪問1回につき1回。施設の中でタブ・メニューを替えても繰り返さない）：ダン＝ベースキャンプ、ニック＝牧場、ベルナ＝アイテム屋、カレン＝市場
//  ・フィナ：台詞の意味が声と合う行だけ（会話の行の voice。npc.js が行の表示に合わせて鳴らし、会話を閉じたら止める）と、Chapter 1 の世界のボードの限られた出来事（見つけた・挑戦の成否・レア）。
//    毎マス・全操作では鳴らさない（同じ出来事の声は CUE_COOLDOWN_MS のあいだ繰り返さない）。
//  エリオット（研究所）の「やあ」は 2026-10-13 開発25 から再訪の挨拶（既定 ON）。
//  2026-10-13 開発25 追加便：セドリック（大会の開幕）・セルジュ（受付・管理局の再訪）・リュウ（道中の登場・ライバル戦の決着）・ゲンシン（特訓の終わり）・ヴァルガス（ランクを認める一言）。三伝説は登録のみ。
//  2026-10-13 開発25：施設の入口の声は【2回目以降の訪問】だけ。初回の案内（npcFirst・市場のカレンの初回）が出る訪問は skip で「この訪問は済み」にして鳴らさない（index.html の facVoice）。
// =========================================================
(function (root) {
  'use strict';
  const CUES = Object.freeze({
    // 施設の入口
    'facility.farm':   { voice: 'dan_hello', on: true },       // ベースキャンプ（旧ファーム）＝ダン
    'facility.ranch':  { voice: 'nick_hello', on: true },      // 牧場＝ニック
    'facility.shop':   { voice: 'berna_welcome', on: true },   // アイテム屋（補給所）＝ベルナ
    'facility.market': { voice: 'karen_welcome', on: true },   // 市場＝カレン
    'facility.lab':    { voice: 'elliot_hello_OPTIONAL', on: true },    // 研究所＝エリオット（2026-10-13 開発25：ユーザー提供の「やあ」を再訪の挨拶に採用＝既定 ON。id は開発24 のまま）
    // Chapter 1 の世界のボード（フィナの短い反応。案内欄のフィナの顔が話す）
    'fina.discover':   { voice: 'fina_look', on: true, cooldown: 45000 },   // 宝箱・宝の行き止まり・隠れ家（2026-10-15 N06：宝箱のカットインからフィナを外した＝今は呼ぶ所なし。ID は差し替え台帳のために残す）
    'fina.challengeOk':  { voice: 'fina_yeah', on: true },                 // 封印の遺跡門の挑戦に成功
    'fina.challengeNg':  { voice: 'fina_hmm', on: true },                  // 同・失敗
    // レアモンスターの「なんだろう？」は、初めてのレアのフィナの一言（world-driver.js の ch1_first_rare の行の voice）だけ（遭遇の演出・強制バトルは変えない）
    // ---- 2026-10-13 開発25 追加便 ----
    'facility.bureau': { voice: 'serge_welcome', on: true },   // 聖獣士管理局＝セルジュ「ようこそ」（再訪の入口。初めての登録の受付は会話の1行目＝OPEN_TALK.serge の voice）
    'ryu.appear':  { voice: 'ryu_hello', on: false },    // リュウ「よっ！」＝2026-10-13 開発27（20）で不採用（登場の演出から呼ばない・この場面も止める）。声のファイル・VOICE_REGISTRY の登録は残す
    'ryu.won':     { voice: 'ryu_chuckle', on: true },   // リュウ「へへっ」＝ライバル戦の決着でプレイヤーが負けた（リュウの勝ち）
    'ryu.lost':    { voice: 'ryu_praise', on: true },    // リュウ「やるじゃん」＝2026-10-13 開発27（24）からバトルの決着では鳴らさない（ボードへ戻ってからの会話の行の声＝LINE_VOICE の ryu_praise）。この場面の登録だけ残す
    'genshin.ack': { voice: 'genshin_ack', on: true },   // ゲンシン「うむ」＝特訓をやり終えた（「よくやった。…」の一言と同時）
    'vargas.ack':  { voice: 'vargas_ack', on: true, cooldown: 30000 },   // ヴァルガス「うむ」＝闘技場（ロック中）でランクを上げた子を認める一言のときだけ（押すたびに鳴らない）
    // 三伝説（登録のみ・場面が未実装）：再会の挨拶・対戦の直前。VOICE_REGISTRY も enabled:false。アストラッドの新しい声は未着＝無い
    'legend.leona.greet':   { voice: 'leona_greet', on: false },
    'legend.leona.battle':  { voice: 'leona_prebattle', on: false },
    'legend.ragnas.greet':  { voice: 'ragnas_greet', on: false },
    'legend.ragnas.battle': { voice: 'ragnas_prebattle', on: false },
  });
  /** 会話の行に付ける声（データ側で { voice: 'fina_yes' } のように書く）。ここで false にした声は会話でも鳴らさない */
  const LINE_VOICE = Object.freeze({ fina_hello: true, fina_yeah: true, fina_hmm: true, fina_look: true, fina_hey: true, fina_giggle: true, fina_yes: true, fina_wonder: true,
    cedric_opening: true, serge_welcome: true,
    ryu_praise: true, ryu_chuckle: true });   // 2026-10-14 実機試遊⑬：ライバル戦に負けたあと、ボードでのリュウの会話の行（「へへっ、…」）と同時に1回   // 2026-10-13 開発27（24）：ライバル戦に勝ったあと、ボードでのリュウの会話の行（「やるじゃん！ …」）と同時に1回   // 2026-10-13 開発25 追加便：セドリックの開幕の1行目・セルジュの受付の1行目（台詞の頭と声が同じ）
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
  /** 2026-10-13 開発25：この訪問では鳴らさない（初回の案内と重ねない・会話がもう始まっている）。訪問の記録だけ付ける＝同じ訪問の中で後から鳴らない */
  function skip(fac, why) { if (visit[fac]) return false; visit[fac] = 1; push({ cue: 'facility.' + fac, result: why || 'first-visit' }); return true; }
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
  root.MMVOICE = Object.freeze({ CUES, LINE_VOICE, cue, enter, skip, visitReset, line, stop, log: () => log.slice(), visited: () => ({ ...visit }) });
})(typeof window !== 'undefined' ? window : globalThis);
