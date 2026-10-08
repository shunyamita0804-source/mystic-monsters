// =========================================================
// Phase 11：プレイヤー情報（window.MMP11P）
//  ・プレイヤー名はセーブ全体の項目 playerName（v6のまま追加。v7にはしない）
//  ・初期名は「アルト」。空欄・空白だけ・読めない値は「アルト」にする
//  ・新規ゲームでは playerNamePending=true にして、最初に名前を決める画面を出す（決めたら消える）
//  ・名前が無い旧セーブ（v4〜v6）は、読み込み時に「アルト」を補う（名前を決める画面は出さない。ほかのデータは変えない）
//  MMP8 のセーブ補正フックに登録し、新規セーブ作成時と、すべてのセーブ読み込み時に必ず通る。
// =========================================================
(function (root) {
  'use strict';
  const DEFAULT_NAME = 'アルト';
  const MAX_LEN = 8;   // 既存のモンスター名入力と同じ8文字まで（絵文字などは1文字として数える）
  // 2026-10-08（監査 H-05）：プレイヤーが付ける名前（プレイヤー名・モンスター名・合体後の名前）の共通の正規化。
  //  fight()（Phase 6）はバトルの HUD に名前をそのまま innerHTML で入れるため、記号の名前でバトルが止まる・
  //  セーブコード経由でスクリプトが動くことがあった。→ 名前の入口（登録・市場・名前変更・合体・セーブの読み込み）で
  //  HTML の記号 < > & " ' ` \ を全角へ、制御文字・見えない方向制御文字を除き、前後の空白を取り、8文字（コードポイント）まで。
  const UNSAFE = /[<>&"'`\\]/g;
  const WIDE = { '<': '＜', '>': '＞', '&': '＆', '"': '＂', "'": '＇', '`': '｀', '\\': '＼' };
  const INVISIBLE = /[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u2064\u2066-\u2069\ufeff]/g;
  /** 名前を整える（空なら fallback）。どの入口からの名前もここを通す */
  function cleanName(v, fallback) {
    const t = typeof v === 'string' ? v.replace(INVISIBLE, '').replace(UNSAFE, (c) => WIDE[c]).trim() : '';
    const r = Array.from(t).slice(0, MAX_LEN).join('').trim();
    return r || (fallback == null ? '' : cleanName(String(fallback), null));
  }
  /** 入力されたプレイヤー名を整える。空なら「アルト」 */
  function sanitize(v) { return cleanName(v, DEFAULT_NAME); }
  /** モンスターの名前を整える。空なら種族名（無ければ「モンスター」） */
  function monsterName(v, sp) {
    const M = root.MMP10M, s = M && typeof M.byId === 'function' ? M.byId(sp) : null;
    return cleanName(v, (s && s.name) || 'モンスター');
  }
  function normalizeSave(S, ctx) {
    if (ctx && ctx.isNew) { S.playerName = DEFAULT_NAME; S.playerNamePending = true; return S; }
    S.playerName = sanitize(S.playerName);   // 名前が無い旧セーブは「アルト」。記号・長すぎる名前も整える
    [S.m, ...(Array.isArray(S.box) ? S.box : [])].forEach((x) => { if (x && typeof x === 'object') x.name = monsterName(x.name, x.sp); });
    return S;
  }
  /** 名前を決める（新規ゲームの名前入力画面から） */
  function confirmName(S, v) { S.playerName = sanitize(v); delete S.playerNamePending; return S.playerName; }
  if (root.MMP8 && typeof root.MMP8.addSaveNormalizer === 'function') root.MMP8.addSaveNormalizer(normalizeSave);
  root.MMP11P = Object.freeze({ DEFAULT_NAME, MAX_LEN, sanitize, cleanName, monsterName, normalizeSave, confirmName });
})(typeof window !== 'undefined' ? window : globalThis);
