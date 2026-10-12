// =========================================================
// 観客の声 `MMCROWD`（2026-10-13 開発24）：観客のいる公式大会の会場だけで、技の結果に合わせて短く鳴らす。
//  ・命中（威力のある技が当たった）＝歓声 CROWD_HIT／ルーレットの MISS（技が出ない）＝落胆 CROWD_MISS／発動した技を相手がかわした＝ブーイング CROWD_EVADE
//  ・結果は fight()・Battle Engine が決めたもの（js/battle/arena.js が act() の resolveAction の結果とダメージの数字・ルーレットの止まった枠を見て、1行動1回だけ react を呼ぶ）。判定は変えない
//  ・補助技・回復技（威力なし）・まひ／ねむりで動けない行動・野外のバトル（野生・レア・ライバル）・修行では鳴らさない（会場に観客がいない＝既定 OFF）
//  ・比較の設定（普段のバトル画面には出さない。設定の画面・メニューの「音・画面の設定」）：長さ＝短い（既定）／1秒／なし、音量＝標準（既定）／控えめ。localStorage mmcrowd（セーブとは別）
//  音源・音量は js/audio/audio-registry.js（CROWD_*）。鳴らすのは MMAUDIO.se（SE の GainNode・全体のミュートが効く）
// =========================================================
(function (root) {
  'use strict';
  const KEY = 'mmcrowd';
  const MODES = Object.freeze(['short', 'long', 'off']);
  const GAINS = Object.freeze({ std: 1, soft: 0.6 });
  const DEF = Object.freeze({ mode: 'short', level: 'std' });
  const SE = Object.freeze({ hit: { short: 'CROWD_HIT', long: 'CROWD_HIT_LONG' }, miss: { short: 'CROWD_MISS', long: 'CROWD_MISS_LONG' }, evade: { short: 'CROWD_EVADE', long: 'CROWD_EVADE_LONG' } });
  const DELAY = Object.freeze({ hit: 0.06, miss: 0, evade: 0 });   // 命中は打撃の音の直後に重ねる（秒）
  const log = [];
  let cur = { ...DEF };
  try { const v = JSON.parse((root.localStorage && root.localStorage.getItem(KEY)) || 'null'); if (v && typeof v === 'object') { if (MODES.includes(v.mode)) cur.mode = v.mode; if (v.level in GAINS) cur.level = v.level; } } catch (e) {}
  function settings() { return { ...cur }; }
  function set(o = {}) {
    if (MODES.includes(o.mode)) cur.mode = o.mode;
    if (o.level in GAINS) cur.level = o.level;
    try { root.localStorage && root.localStorage.setItem(KEY, JSON.stringify(cur)); } catch (e) {}
    return settings();
  }
  /** 観客のいる会場か：公式ランク大会（TEST 大会を含む）。練習試合（野生・レア・ライバル＝#bt の data-mmprac）・修行は観客なし */
  function audience(bt) {
    bt = bt || (typeof document !== 'undefined' && document.getElementById('bt'));
    if (!bt || !bt.dataset) return false;
    if (bt.dataset.mmprac === '1') return false;
    const A = root.MMARENA; const r = A && A.rankOf ? A.rankOf(bt) : null;
    return !!r;
  }
  /** kind＝'hit'｜'miss'｜'evade'。鳴らしたら true */
  function react(kind, bt) {
    const name = SE[kind] && SE[kind][cur.mode];
    const rec = { kind, mode: cur.mode, level: cur.level, name: name || null, at: Date.now(), result: '' };
    try {
      if (!SE[kind]) rec.result = 'unknown';
      else if (!audience(bt)) rec.result = 'no-audience';
      else if (cur.mode === 'off') rec.result = 'off';
      else {
        const A = root.MMAUDIO;
        const ok = !!(A && A.se(name, { volume: GAINS[cur.level], delay: DELAY[kind] }));
        rec.result = ok ? 'se' : 'no-se';
      }
    } catch (e) { rec.result = 'error'; }
    log.push(rec); if (log.length > 60) log.shift();
    return rec.result === 'se';
  }
  /** 鳴らしそうな音を先に読む（バトル画面が出たとき・観客のいる会場だけ） */
  function prefetch(bt) {
    if (!audience(bt) || cur.mode === 'off') return;
    const A = root.MMAUDIO; if (!A || !A.prefetchSe) return;
    for (const k of Object.keys(SE)) A.prefetchSe(SE[k][cur.mode]);
  }
  root.MMCROWD = Object.freeze({ KEY, MODES, GAINS, DEF, SE, settings, set, audience, react, prefetch, log: () => log.map((x) => ({ ...x })) });
})(typeof window !== 'undefined' ? window : globalThis);
