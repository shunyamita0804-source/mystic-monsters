// 開発30（2026-10-14）：正式5体×10技＝50技の静止カード `MMMVCARD`（表示だけ）。
//  画像＝assets/moves/cards_1014/{種族}/{カードの番号}_{技ID}.webp（ユーザーが正式採用した「背景あり」PNG を幅 640px の WebP にしただけ。tools/movecards1014/derive.py・README.md）。
//  対応＝ユーザー納品の対応表（全5体50技_画像ファイル名と正式技ID対応.tsv）。カードの番号と技の No.・SK の番号は一致しない＝技ID で引く。
//  SK の番号：ソラモ・ガウル＝js/phase10/monsters.js の OFFICIAL_MOVES の slot、レグナス＝20＋No−1（js/battle/rival-partner.js）、
//  ノビトン＝MMRULES.NOBI_FIRST（30）＋No−1（js/battle/rules.js）、ジオル＝SK の番号なし（未決）＝技管理には出ない。
//  技の性能・名前・習得・バトル・技辞典・ルーレットの抽選は変えない（このファイルは画像のパスを返すだけ）。
(function (root) {
  'use strict';
  const DIR = './assets/moves/cards_1014/';
  // [カードの番号, 技ID]（技ID＝コードの正式 ID。カードの番号＝納品の画像の番号）
  const CARDS = {
    solamo: [[1, 'taiatari'], [2, 'hikkaki'], [3, 'shippo_attack'], [4, 'hoeru'], [5, 'star_crash'], [6, 'soramo_beam'], [7, 'sunakake'], [8, 'hoshi_no_mamori'], [9, 'stardust_ray'], [10, 'star_fall']],
    gauru: [[1, 'tsutsuku'], [2, 'wind'], [3, 'spiral_dive'], [4, 'sonic_move'], [5, 'kouyoku_slash'], [6, 'fireball'], [7, 'sky_rush'], [8, 'flare_ray'], [9, 'feather_storm'], [10, 'seinaru_honoo']],
    nobiton: [[1, 'hana_binta'], [2, 'zutsuki'], [3, 'hanamizu'], [4, 'hitoyasumi'], [5, 'makitsuku'], [6, 'nose_wave'], [7, 'shibire_tsuki'], [8, 'mirage_nose'], [9, 'downer_mist'], [10, 'gigant_nose']],
    jiol: [[1, 'punch'], [2, 'kick'], [3, 'chikara_wo_tameru'], [4, 'noshikakari'], [5, 'ground_hammer'], [6, 'crystal_ray'], [7, 'ground_spike'], [8, 'rock_upper'], [9, 'geo_impact'], [10, 'crystal_nova']],
    regnas: [[1, 'kirisaku'], [2, 'shippo_attack'], [3, 'ryugan_lock'], [4, 'zanei_step'], [5, 'dragon_crash'], [6, 'soukou_breath'], [7, 'snipe_fang'], [8, 'genei_claw'], [9, 'soujin_ranbu'], [10, 'tail_cyclone']],
  };
  const pad = (n) => (n < 10 ? '0' : '') + n;
  const srcOf = (sp, id) => {
    const c = (CARDS[sp] || []).find((x) => x[1] === id);
    return c ? DIR + sp + '/' + pad(c[0]) + '_' + id + '.webp' : null;
  };
  const M = () => root.MMP10M || null;
  const movesList = (sp) => {
    const m = M();
    if (!m) return [];
    if (sp === 'regnas') { const r = m.rivalMonster ? m.rivalMonster('regnas') : null; return (r && r.moves && r.moves.list) || []; }
    const L = m.movesOf ? m.movesOf(sp) : null;
    return Array.isArray(L) ? L : (L && L.list) || [];
  };
  // SK の番号 → 技
  const slotOf = (sp, mv) => {
    if (sp === 'regnas') return 20 + mv.no - 1;
    if (sp === 'nobiton') return ((root.MMRULES && root.MMRULES.NOBI_FIRST) || 30) + mv.no - 1;
    return mv.slot == null ? null : mv.slot;
  };
  let BY_SLOT = null;
  const build = () => {
    const t = {};
    for (const sp of Object.keys(CARDS)) for (const mv of movesList(sp)) {
      const k = slotOf(sp, mv), s = srcOf(sp, mv.id);
      if (k != null && s) t[k] = { sp, id: mv.id, no: mv.no, name: mv.name, src: s };
    }
    return t;
  };
  const bySlot = (k) => { if (!BY_SLOT || !Object.keys(BY_SLOT).length) BY_SLOT = build(); return BY_SLOT[k] || null; };
  // 技管理・技の一覧・技の詳細の画像：正式カードがあればそれ、無ければ従来の絵（fb）
  const src = (k, fb) => { const c = bySlot(k); return c ? c.src : fb; };
  // 検証用：種族ごとの10枚（技管理に出ないジオルを含む）
  const list = (sp) => movesList(sp).map((mv) => ({ sp, no: mv.no, id: mv.id, name: mv.name, slot: slotOf(sp, mv), src: srcOf(sp, mv.id) }));
  root.MMMVCARD = Object.freeze({ DIR, CARDS, srcOf, bySlot, src, list, SPECIES: Object.keys(CARDS) });
})(typeof window !== 'undefined' ? window : globalThis);
