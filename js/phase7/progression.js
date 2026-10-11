// =========================================================
// Phase 7：育成進行の基盤（window.MMP7）
//  ・セーブv5（v4→v5マイグレーション）
//  ・Chapter登録／ファーム帰還状態
//  ・修行（15マス一本道ボード）／修行チケット
//  ・種族ごとの10技（初期4・ちから1・かしこさ1・命中1・回避1・丈夫さ2）登録構造
//  ・ランククリア実績（Cランク→丈夫さ修行解放。バッグの枠はプレイヤー全体の最高優勝で 2／3／4／6）
//  ・通常合体の技継承（初期4＋親の追加技から1つ）
//  ・バッグ／保管庫／アイテム屋の基盤
//  ・（Phase 8）個体の育成状態 m.raise の読み取り。修行・保管庫の可否は「個体」の状態で判定する
//    （Chapter進行・セーブv6本体は js/phase8/raising.js）
//
//  このファイルは「状態の計算・検証」だけを行う純粋ロジック層です。
//  画面描画・SE・Battle Engineには一切触れません（Phase 6部分は無変更）。
//
//  【未確定のため、ここでは値を決めていないもの】
//   ・正式Chapterマップ（registerChapterBoard で後から登録）
//   ・正式10技（registerMoveset で後から登録。本番は未登録）
//   ・アイテム一覧／価格（registerItem / setShopCatalog で後から登録。本番は空）
//   ・保管庫容量（vaultCap = null ＝未設定）
//   ・修行チケットの入手方法（本番では配布しない。初期値0）
//   ・バッグ満杯時の処理（setBagFullHandler で後から差し込む。本番は未設定）
//   ・合体専用種（addFusionSpeciesResolver で後から登録。本番は未登録）
// =========================================================
(function (root) {
  'use strict';

  const SAVE_VERSION = 5;

  // ---------- ランク ----------
  const RANK_COUNT = 6;          // E, D, C, B, A, S（index.html の RN と同じ並び）
  const RANK_C = 2;
  const RANK_B = 3;
  // Phase 8：丈夫さ修行の解放条件＝Cランク以上の大会クリア（旧：Bランククリア）
  const TOUGH_UNLOCK_RANK = RANK_C;
  const RANK_S = 5;

  // ---------- バッグ（2026-10-11 正式） ----------
  // 使える枠＝プレイヤー全体の最高優勝実績（S.rankRec.cleared。育成中の個体ではない）：未優勝 2／E・D 3／C・B 4／A・S 6。最大6枠。
  //  旧 S.inv.bagCapUnlocked（S 初回クリアの記録）は意味を変えずに残し、立っていれば S と同じ扱い（6枠）。
  const BAG_BASE_CAP = 2;        // 未優勝（新しいゲーム）の枠
  const BAG_UNLOCKED_CAP = 6;    // 最大の枠（A・S の優勝）
  const BAG_CAP_BY_WIN = Object.freeze([3, 3, 4, 4, 6, 6]);   // 最高優勝ランク（E〜S）→ 枠
  const STACK_MAX = 10;          // 同じアイテムは1枠に10個まで（違う ID は別の枠）。保管庫は1種類1行・個数の上限なし
  const S_GRADE_LIMIT = 1;       // 等級 S のアイテムは種類を問わずバッグに合計1個まで（今は等級 S のアイテムが登録されていない）

  // ---------- 修行 ----------
  const TRAIN_KINDS = Object.freeze(['po', 'in', 'hi', 'ev', 'de']);
  const TRAIN_LEN = 15;          // 15マス（スタート地点0は含まない。15マス目がゴール）
  const TOUGH_MAX_CLEARS = 2;
  // 1個体あたりの修行クリア上限（ちから・かしこさ・命中・回避は各1回、丈夫さは必殺技2つのため2回。合計6回）
  const TRAIN_MAX = Object.freeze({ po: 1, in: 1, hi: 1, ev: 1, de: TOUGH_MAX_CLEARS });
  const DICE_MIN = 1;
  const DICE_MAX = 3;
  // 1〜14マス目の種類（15マス目はゴール）。n=何も起きない / s=専用能力マス（対応能力とライフが同時に小上昇）
  // 正式仕様：独立したライフマスは廃止（旧 4・9・14マス目の 'l' は通常マス 'n' へ）。ライフは専用能力マスの追加効果で上がる。
  const TRAIN_TEMPLATE = Object.freeze(['n', 's', 'n', 'n', 'n', 'n', 's', 'n', 'n', 'n', 's', 'n', 'n', 'n']);
  // 専用能力マス1回あたり：対応能力 +2〜3、ライフ +2〜3（正式仕様。通常Chapterの能力マス +5〜7 より控えめ）。
  const TRAIN_GAIN = Object.freeze({ stat: Object.freeze([2, 3]), life: Object.freeze([2, 3]) });
  const STAT_MAX = 999;

  // ---------- Phase 8：個体の育成状態（m.raise） ----------
  // 育成進行は個体ごとに持つ（セーブ全体には持たない）。進行の管理は js/phase8/raising.js（MMP8）が行い、
  // ここでは修行・保管庫の可否判定に必要な読み取りだけを行う。
  const RAISE = Object.freeze({ NONE: 'none', BOARD: 'board', FARM: 'farm', FINAL: 'final', DONE: 'done' });

  // ---------- 技（種族ごとの10枠） ----------
  const MOVESET_SLOTS = Object.freeze({ initial: 4, po: 1, in: 1, hi: 1, ev: 1, de: 2 });

  // ---------- Chapter ----------
  const CHAPTER_DEFS = Object.freeze([
    Object.freeze({ no: 1, name: 'はじまりの草原' }),
    Object.freeze({ no: 2, name: '潮風の海岸' }),
    Object.freeze({ no: 3, name: '天空の浮島' }),
    Object.freeze({ no: 4, name: '灼熱の火山' }),
  ]);
  const CHAPTER_COUNT = CHAPTER_DEFS.length;
  // ここはChapterの番号と名前だけ。ターン上限・挑戦ランク上限などのルールは js/phase8/raising.js の CHAPTER_RULES で管理する（Phase 8）。
  // Phase 7.1：v4→v5移行時点で「ボード進行中のまま」引き継いでも安全なChapter数。
  // 現在は正式Chapter 1のみ地図が用意されている（Chapter 2〜4は未実装）。
  // Chapter 2〜4の地図が実装されたら、この値もあわせて見直すこと。
  const MIGRATABLE_IN_PROGRESS_CHAPTERS = 1;

  const STATUS_FARM = 'farm';    // Chapter外（ファームで準備中）
  const STATUS_BOARD = 'board';  // Chapter進行中

  // =========================================================
  // 内部レジストリ（本番はすべて空。後のPhaseで登録する）
  // =========================================================
  const chapterBoards = {};      // no -> { track, provisional, note }
  const movesets = {};           // speciesId -> 10枠
  const itemDefs = {};           // itemId -> { id, name, price, sellPrice }
  let shopCatalog = [];          // itemId[]
  const fusionSpeciesResolvers = [];
  let legacyHooks = { initialMoves: () => [], specialMoves: () => [] };

  const clone = (o) => JSON.parse(JSON.stringify(o));
  const isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);

  // =========================================================
  // 旧データ参照フック（index.html の SP / DJP を渡す）
  // =========================================================
  function configureLegacy(hooks) {
    legacyHooks = { ...legacyHooks, ...(hooks || {}) };
  }

  // =========================================================
  // 個体の進行データ（m.prog）
  // =========================================================
  function newProg() {
    return {
      rankClr: Array(RANK_COUNT).fill(false),                 // この個体のランク大会クリア実績
      train: { po: 0, in: 0, hi: 0, ev: 0, de: 0 },           // 修行ごとのクリア回数
      learnSrc: {},                                           // 技ID -> 'init' | 'po' | 'in' | 'hi' | 'ev' | 'de' | 'inherit'
    };
  }
  function ensureProg(m) {
    if (!m) return m;
    if (!isObj(m.prog)) m.prog = newProg();
    const p = m.prog;
    if (!Array.isArray(p.rankClr)) p.rankClr = Array(RANK_COUNT).fill(false);
    while (p.rankClr.length < RANK_COUNT) p.rankClr.push(false);
    if (!isObj(p.train)) p.train = {};
    for (const k of TRAIN_KINDS) if (!Number.isInteger(p.train[k]) || p.train[k] < 0) p.train[k] = 0;
    if (!isObj(p.learnSrc)) p.learnSrc = {};
    return m;
  }
  /** 新規個体用：初期技の出自を記録した prog を付ける */
  function initProgForNew(m) {
    m.prog = newProg();
    for (const k of m.sk || []) m.prog.learnSrc[k] = 'init';
    return m;
  }
  function raiseState(m) { return m && isObj(m.raise) && typeof m.raise.state === 'string' ? m.raise.state : RAISE.NONE; }
  function trainRunOf(m) { return m && isObj(m.raise) && isObj(m.raise.trainRun) ? m.raise.trainRun : null; }
  /** 育成中（育成開始〜育成完了の間。Chapter進行中・Chapter間ファーム・最終Chapter進行中） */
  function isRaising(m) { const s = raiseState(m); return s === RAISE.BOARD || s === RAISE.FARM || s === RAISE.FINAL; }
  /** Chapter（最終Chapterを含む）のボードを進行中 */
  function inChapter(m) { const s = raiseState(m); return s === RAISE.BOARD || s === RAISE.FINAL; }
  /** その個体が指定のChapterを終えたか（ゴールの有無・大会の結果は問わない） */
  function hasEndedChapter(m, no) { return !!(m && isObj(m.raise) && Array.isArray(m.raise.log) && m.raise.log.some((e) => e && e.ch === no)); }

  // =========================================================
  // セーブ v5
  // =========================================================
  function defaultV5Fields() {
    return {
      chap: { status: STATUS_FARM, clearedMax: 0, cleared: [] },
      inv: { bag: [], bagCapUnlocked: false, vault: [], vaultCap: null },
      trainTix: 0,
      trainRun: null,
      rankRec: { cleared: Array(RANK_COUNT).fill(false) },
    };
  }

  function newSave() {
    return { v: SAVE_VERSION, y: 1000, mo: 4, wk: 1, g: 1000, box: [], m: null, ...defaultV5Fields() };
  }

  function monstersOf(S) {
    return [S.m, ...(Array.isArray(S.box) ? S.box : [])].filter(Boolean);
  }

  /** v5 の欠けたフィールドを補う（既存の値は変更しない） */
  function normalizeV5(S) {
    const d = defaultV5Fields();
    if (!isObj(S.chap)) S.chap = d.chap;
    if (S.chap.status !== STATUS_FARM && S.chap.status !== STATUS_BOARD) S.chap.status = STATUS_FARM;
    if (!Number.isInteger(S.chap.clearedMax) || S.chap.clearedMax < 0) S.chap.clearedMax = 0;
    if (!Array.isArray(S.chap.cleared)) S.chap.cleared = [];
    if (!isObj(S.inv)) S.inv = d.inv;
    if (!Array.isArray(S.inv.bag)) S.inv.bag = [];
    if (!Array.isArray(S.inv.vault)) S.inv.vault = [];
    if (typeof S.inv.bagCapUnlocked !== 'boolean') S.inv.bagCapUnlocked = false;
    if (!('vaultCap' in S.inv) || !(S.inv.vaultCap === null || (Number.isInteger(S.inv.vaultCap) && S.inv.vaultCap >= 0))) S.inv.vaultCap = null;
    if (!Number.isInteger(S.trainTix) || S.trainTix < 0) S.trainTix = 0;
    if (S.trainRun !== null && !(isObj(S.trainRun) && TRAIN_KINDS.includes(S.trainRun.kind))) S.trainRun = null;
    if (!isObj(S.rankRec) || !Array.isArray(S.rankRec.cleared)) S.rankRec = d.rankRec;
    while (S.rankRec.cleared.length < RANK_COUNT) S.rankRec.cleared.push(false);
    if (!Array.isArray(S.box)) S.box = [];
    monstersOf(S).forEach(ensureProg);
    return S;
  }

  /**
   * セーブデータを v5 に変換する。元のオブジェクトは変更しない（新しいオブジェクトを返す）。
   * v4 → v5：既存フィールドはそのまま保持し、新規フィールドを追加する。
   * 読めないデータ・未知のバージョンは null。
   */
  function migrateSave(raw) {
    if (!isObj(raw)) return null;
    if (raw.v !== 4 && raw.v !== 5) return null;
    if ('box' in raw && !Array.isArray(raw.box)) return null;
    const S = clone(raw);
    if (!Array.isArray(S.box)) S.box = [];

    if (S.v === 4) {
      const d = defaultV5Fields();
      // --- Chapter：旧 S.board.ch は「現在のChapter番号」。ch-1 章までクリア済みとみなす ---
      const bd = isObj(S.board) ? S.board : null;
      const ch = bd && Number.isInteger(bd.ch) && bd.ch >= 1 ? bd.ch : 1;
      const clearedMax = Math.min(CHAPTER_COUNT, ch - 1);
      // 旧版はChapterクリア後にスタート地点("s")へ戻るだけだった。スタート地点以外にいれば進行中とみなす。
      const inProgress = !!(bd && bd.node && bd.node !== 's');
      // Phase 7.1：地図が存在しないChapter（現在はChapter2〜4）の途中だった場合、
      // 「ボード進行中」のまま引き継ぐと地図が見つからず進行不能（ソフトロック）になる。
      // 正式な地図を仮実装する代わりに、安全なファーム帰還状態へ退避する
      // （個体・所持金・ランク実績など他のデータは一切変更しない。途中位置だけを失う）。
      const stuckOnUnmappedChapter = inProgress && ch > MIGRATABLE_IN_PROGRESS_CHAPTERS;
      d.chap = {
        status: (inProgress && !stuckOnUnmappedChapter) ? STATUS_BOARD : STATUS_FARM,
        clearedMax,
        cleared: Array.from({ length: clearedMax }, (_, i) => i + 1),
      };
      // --- ランク実績（セーブ全体）：旧 S.br は「勝ったことのある最高ランク」 ---
      const br = Number.isInteger(S.br) ? S.br : -1;
      d.rankRec.cleared = Array.from({ length: RANK_COUNT }, (_, i) => i <= br);
      // --- 旧 bagCapUnlocked：旧セーブでSランク大会に勝っていれば立てる（枠は S.rankRec から決まる） ---
      d.inv.bagCapUnlocked = br >= RANK_S;
      Object.assign(S, d);
      if (stuckOnUnmappedChapter) {
        // 途中位置（node）だけを手放し、次に出発し直せる「ファーム待機中」の形に揃える。
        // 元のv4原文はp7Load側でmr4_v4backupへ必ず退避されるため、必要なら復元できる。
        S.board = { ch, node: null, done: false };
      }
      // --- 個体：旧 rk は「勝ってランクアップした回数」。rk未満のランクはクリア済みとみなす ---
      monstersOf(S).forEach((m) => {
        m.prog = newProg();
        const rk = Number.isInteger(m.rk) ? m.rk : 0;
        for (let i = 0; i < Math.min(rk, RANK_COUNT); i++) m.prog.rankClr[i] = true;
      });
      S.migratedFrom = 4;
      S.v = SAVE_VERSION;
    }
    return normalizeV5(S);
  }

  // =========================================================
  // Chapter
  // =========================================================
  function getChapterDef(no) { return CHAPTER_DEFS.find((c) => c.no === no) || null; }
  function registerChapterBoard(no, track, meta) {
    if (!getChapterDef(no)) throw new Error(`存在しないChapterです：${no}`);
    if (!isObj(track) || !isObj(track.nodes) || !isObj(track.conn) || !track.start || !track.nodes[track.start]) throw new Error('ボードデータが不正です');
    chapterBoards[no] = { track, provisional: !!(meta && meta.provisional), note: (meta && meta.note) || '' };
  }
  function getChapterBoard(no) { return chapterBoards[no] || null; }
  function isChapterPlayable(no) { return !!chapterBoards[no]; }
  // Phase 8：Chapterの出発・終了・次Chapterは「個体ごとの進行」として js/phase8/raising.js（MMP8）が管理する（セーブ全体の S.chap は廃止）。
  /** 「何も起きないマス」判定 */
  const NOTHING_SQUARE = 'normal';
  function isNothingSquare(type) { return type === NOTHING_SQUARE; }

  // =========================================================
  // 技（種族ごとの10枠）
  // =========================================================
  function registerMoveset(speciesId, def) {
    if (!isObj(def)) throw new Error('技データが不正です');
    const all = [];
    for (const [slot, n] of Object.entries(MOVESET_SLOTS)) {
      const a = def[slot];
      if (!Array.isArray(a) || a.length !== n) throw new Error(`${slot} は ${n} 個の技IDが必要です`);
      for (const id of a) {
        if (!(Number.isInteger(id) || (typeof id === 'string' && id))) throw new Error(`技IDが不正です：${id}`);
        all.push(id);
      }
    }
    if (new Set(all).size !== all.length) throw new Error('同じ技IDが複数の枠に登録されています');
    const frozen = {};
    for (const slot of Object.keys(MOVESET_SLOTS)) frozen[slot] = Object.freeze([...def[slot]]);
    movesets[speciesId] = Object.freeze(frozen);
  }
  function getMoveset(speciesId) { return movesets[speciesId] || null; }

  // =========================================================
  // ランククリア実績
  // =========================================================
  function hasClearedRank(m, rank) { ensureProg(m); return !!m.prog.rankClr[rank]; }
  /** 指定ランク以上のどれかをクリアしているか */
  function hasClearedRankAtLeast(m, rank) { ensureProg(m); return m.prog.rankClr.some((v, i) => v && i >= rank); }
  /** ランク大会に勝利したときに呼ぶ。実績（S.rankRec）を付け、バッグの枠が増えたら bagCap:{from,to}（Sランク初回は旧 bagCapUnlocked も立てる） */
  function recordRankClear(S, m, rank) {
    if (!Number.isInteger(rank) || rank < 0 || rank >= RANK_COUNT) throw new Error(`ランクが不正です：${rank}`);
    // Phase 8：上位ランクをクリアしたら、それ以下のランクもクリア扱い（飛ばした下位ランクの初回報酬は呼び出し側で付与しない）
    if (m) { ensureProg(m); for (let i = 0; i <= rank; i++) m.prog.rankClr[i] = true; }
    const cap0 = bagCap(S);
    for (let i = 0; i <= rank; i++) S.rankRec.cleared[i] = true;
    let bagUnlocked = false;
    if (rank === RANK_S && !S.inv.bagCapUnlocked) { S.inv.bagCapUnlocked = true; bagUnlocked = true; }
    // バッグの枠（2026-10-11）：プレイヤー全体の最高優勝で増えたときだけ { from, to }（同じ段階の優勝・再優勝では増えない）
    const cap1 = bagCap(S);
    return { bagUnlocked, bagCap: cap1 > cap0 ? { from: cap0, to: cap1 } : null };
  }

  // =========================================================
  // 修行
  // =========================================================
  /** 面の数を指定して振る（1〜sides を等確率）。Chapterフィールドエンジンの config（rules.diceSides）から使う。特訓ボード・旧Chapterは rollDice（1〜3）のまま */
  function rollDie(sides, rng = Math.random) {
    if (!Number.isInteger(sides) || sides < 1) throw new Error(`サイコロの面の数が不正です：${sides}`);
    const r = rng();
    if (!(r >= 0 && r < 1)) throw new Error(`乱数は[0, 1)の範囲である必要があります：${r}`);
    return DICE_MIN + Math.floor(r * sides);
  }
  function rollDice(rng = Math.random) { return rollDie(DICE_MAX - DICE_MIN + 1, rng); }
  /** 1〜15マス目の種類。15マス目は 'g'（ゴール） */
  function trainSquare(pos) {
    if (pos === TRAIN_LEN) return 'g';
    if (pos >= 1 && pos < TRAIN_LEN) return TRAIN_TEMPLATE[pos - 1];
    return null;
  }
  function canStartTraining(S, m, kind) {
    if (!TRAIN_KINDS.includes(kind)) return { ok: false, reason: 'bad_kind' };
    if (!m) return { ok: false, reason: 'no_monster' };
    // Phase 8：可否は個体の育成状態で判定する（セーブ全体の状態は見ない）
    const st = raiseState(m);
    if (st === RAISE.BOARD || st === RAISE.FINAL) return { ok: false, reason: 'not_at_farm' };
    if (st === RAISE.DONE) return { ok: false, reason: 'finished' };
    if (trainRunOf(m)) return { ok: false, reason: 'in_progress' };
    // 修行は、その個体がChapter 1を終えてChapter間ファームにいる間だけ
    if (st !== RAISE.FARM || !hasEndedChapter(m, 1)) return { ok: false, reason: 'before_ch1' };
    ensureProg(m);
    if (kind === 'de' && !hasClearedRankAtLeast(m, TOUGH_UNLOCK_RANK)) return { ok: false, reason: 'locked' };
    if (m.prog.train[kind] >= TRAIN_MAX[kind]) return { ok: false, reason: 'max' };
    if (S.trainTix < 1) return { ok: false, reason: 'no_ticket' };
    return { ok: true };
  }
  function startTraining(S, m, kind) {
    const c = canStartTraining(S, m, kind);
    if (!c.ok) return c;
    S.trainTix -= 1;
    m.raise.trainRun = { kind, pos: 0 };   // 修行中の状態は個体が持つ
    return { ok: true };
  }
  /** サイコロの出目ぶん進み、止まったマスの効果だけを適用する。
   *  専用能力マス（'s'）：対応能力（gain）とライフ（lifeGain）を同時に上げる。乱数は対応能力→ライフの順に1回ずつ使う */
  function advanceTraining(S, m, steps, rng = Math.random) {
    const run = trainRunOf(m);
    if (!run) throw new Error('特訓中ではありません');
    if (!Number.isInteger(steps) || steps < DICE_MIN || steps > DICE_MAX) throw new Error(`出目が不正です：${steps}`);
    const from = run.pos;
    const to = Math.min(TRAIN_LEN, from + steps);
    run.pos = to;
    const sq = trainSquare(to);
    const up = (key, [lo, hi]) => {
      const amount = lo + Math.floor(rng() * (hi - lo + 1));
      const before = m[key];
      m[key] = Math.min(STAT_MAX, m[key] + amount);
      return { key, amount: m[key] - before };
    };
    let gain = null, lifeGain = null;
    if (sq === 's') {
      gain = up(run.kind, TRAIN_GAIN.stat);
      lifeGain = up('li', TRAIN_GAIN.life);
    }
    return { from, to, square: sq, gain, lifeGain, goal: to === TRAIN_LEN };
  }
  /** ゴール到達時：技習得（固定対応・重複なし）とクリア回数の記録 */
  function finishTraining(S, m, rng = Math.random) {
    const run = trainRunOf(m);
    if (!run || run.pos !== TRAIN_LEN) throw new Error('まだゴールしていません');
    ensureProg(m);
    const kind = run.kind;
    const ms = getMoveset(m.sp);
    let learned = null;
    let reason = null;
    if (!ms) {
      reason = 'unregistered';
    } else {
      const pool = ms[kind].filter((id) => !(m.sk || []).includes(id));
      if (pool.length === 0) reason = 'already';
      else {
        learned = kind === 'de' ? pool[Math.floor(rng() * pool.length)] : pool[0];
        m.sk = [...(m.sk || []), learned];
        m.prog.learnSrc[learned] = kind;
        // 旧修行と同じく、空き枠（未修得MISS）があれば自動でセットする
        if (Array.isArray(m.eq)) { const z = m.eq.indexOf(-1); if (z >= 0) m.eq[z] = learned; }
      }
    }
    m.prog.train[kind] += 1;
    m.raise.trainRun = null;
    return { kind, learned, reason };
  }

  // =========================================================
  // 合体（通常合体の技継承）
  // =========================================================
  function addFusionSpeciesResolver(fn) { if (typeof fn === 'function') fusionSpeciesResolvers.push(fn); }
  /** 子の種族を決める拡張ポイント。合体専用種は未登録のため、現状は親1の種族（従来どおり） */
  function resolveFusionSpecies(a, b) {
    for (const fn of fusionSpeciesResolvers) {
      const r = fn(a, b);
      if (r && r.sp != null) return { sp: r.sp, special: true };
    }
    return { sp: a.sp, special: false };
  }
  function initialSetOf(m) {
    const s = new Set();
    const ms = getMoveset(m.sp);
    if (ms) ms.initial.forEach((k) => s.add(k));
    (legacyHooks.initialMoves(m) || []).forEach((k) => s.add(k));
    const src = (m.prog && m.prog.learnSrc) || {};
    Object.keys(src).forEach((k) => { if (src[k] === 'init') s.add(isNaN(+k) ? k : +k); });
    return s;
  }
  function specialSetOf(m) {
    const s = new Set();
    const ms = getMoveset(m.sp);
    if (ms) ms.de.forEach((k) => s.add(k));
    (legacyHooks.specialMoves(m) || []).forEach((k) => s.add(k));
    const src = (m.prog && m.prog.learnSrc) || {};
    Object.keys(src).forEach((k) => { if (src[k] === 'de') s.add(isNaN(+k) ? k : +k); });
    return s;
  }
  /** 継承候補：両親が実際に持つ技のうち、親自身の初期技・必殺技・子の初期技を除いたもの */
  function fusionInheritCandidates(a, b, childInitial) {
    const out = [];
    for (const p of [a, b]) {
      const ini = initialSetOf(p);
      const spc = specialSetOf(p);
      for (const k of p.sk || []) {
        if (ini.has(k) || spc.has(k) || (childInitial || []).includes(k) || out.includes(k)) continue;
        out.push(k);
      }
    }
    return out;
  }
  function pickFusionInherit(a, b, childInitial, rng = Math.random) {
    const c = fusionInheritCandidates(a, b, childInitial);
    return c.length ? c[Math.floor(rng() * c.length)] : null;
  }

  // =========================================================
  // バッグ／保管庫／アイテム屋
  // =========================================================
  // アイテム1つ＝{ id, n }（n＝個数。2個以上のときだけ n を持つ＝1個は旧形式と同じ { id }。旧セーブはそのまま1個として読める）。0個の枠は持たない（空き枠）
  const qty = (it) => (it && Number.isInteger(it.n) && it.n >= 1 ? it.n : 1);
  const setN = (it, n) => { if (n > 1) it.n = n; else delete it.n; return it; };
  const mkItem = (id, n = 1) => setN({ id }, n);
  const plain = (it) => isObj(it) && typeof it.id === 'string' && it.id && Object.keys(it).every((k) => k === 'id' || k === 'n');
  /** プレイヤー全体の最高優勝ランク（-1＝未優勝）。S.rankRec.cleared を見る（上位の優勝で下位も true になる）。旧 bagCapUnlocked は S */
  function bestWinRank(S) {
    const c = S && isObj(S.rankRec) && Array.isArray(S.rankRec.cleared) ? S.rankRec.cleared : [];
    let r = -1; for (let i = 0; i < RANK_COUNT; i++) if (c[i] === true) r = i;
    if (S && isObj(S.inv) && S.inv.bagCapUnlocked === true) r = RANK_S;
    return r;
  }
  const bagCapForRank = (r) => (Number.isInteger(r) && r >= 0 ? BAG_CAP_BY_WIN[Math.min(r, RANK_COUNT - 1)] : BAG_BASE_CAP);
  function bagCap(S) { return bagCapForRank(bestWinRank(S)); }
  function bagFree(S) { return Math.max(0, bagCap(S) - S.inv.bag.length); }
  function vaultHasRoom(S) { return S.inv.vaultCap === null || S.inv.vault.length < S.inv.vaultCap; }
  /** 保管庫・アイテム屋を使えるのは、連れている個体がChapter進行中・修行中でない間だけ（Phase 8：個体の状態で判定） */
  function canAccessVault(S) { const m = S.m; return !(m && (inChapter(m) || trainRunOf(m))); }
  const itemGrade = (id) => (itemDefs[id] && itemDefs[id].grade) || null;
  const countIn = (list, id) => (Array.isArray(list) ? list.reduce((a, it) => a + (it && it.id === id ? qty(it) : 0), 0) : 0);
  /** 所持数：where＝'bag'｜'vault'｜省略（両方） */
  function itemCount(S, id, where) { const inv = S && S.inv; if (!inv) return 0; return (where === 'vault' ? 0 : countIn(inv.bag, id)) + (where === 'bag' ? 0 : countIn(inv.vault, id)); }
  const sGradeInBag = (S) => S.inv.bag.reduce((a, it) => a + (it && itemGrade(it.id) === 'S' ? qty(it) : 0), 0);
  /** そのアイテムを今バッグにあと何個入れられるか（同じアイテムの枠の残り＋空き枠×10。等級 S は合計1個まで） */
  function bagRoomFor(S, id) {
    let room = bagFree(S) * STACK_MAX;
    for (const it of S.inv.bag) if (it && it.id === id && qty(it) < STACK_MAX) room += STACK_MAX - qty(it);
    if (itemGrade(id) === 'S') room = Math.min(room, Math.max(0, S_GRADE_LIMIT - sGradeInBag(S)));
    return room;
  }
  // 入る分だけ入れる（同じアイテムの枠から埋めて、残りは新しい枠）。呼ぶ前に bagRoomFor で数を確かめる
  function bagPut(S, id, n) {
    for (const it of S.inv.bag) { if (!n) break; if (it && it.id === id && qty(it) < STACK_MAX) { const k = Math.min(n, STACK_MAX - qty(it)); setN(it, qty(it) + k); n -= k; } }
    while (n > 0) { const k = Math.min(n, STACK_MAX); S.inv.bag.push(mkItem(id, k)); n -= k; }
  }
  /** 保管庫へ入れる（同じアイテムの行にまとめる。個数の上限なし） */
  function vaultAdd(S, id, n = 1) {
    if (typeof id !== 'string' || !id || !Number.isInteger(n) || n < 1) return { ok: false, reason: 'bad_item' };
    const it = S.inv.vault.find((x) => plain(x) && x.id === id);
    if (it) { setN(it, qty(it) + n); return { ok: true }; }
    if (!vaultHasRoom(S)) return { ok: false, reason: 'vault_full' };
    S.inv.vault.push(mkItem(id, n)); return { ok: true };
  }

  // ---- バッグ満杯時の扱い：【未確定】 ----
  // 満杯のバッグへアイテムを取得しようとしたときの正式な処理（取得不可／入れ替え／捨てる／保管庫へ送る 等）は
  // まだ決まっていない。ここでは処理を固定せず、将来 setBagFullHandler() で差し込めるようにしておく。
  // ハンドラ未設定の間は「方針未決定」であることを返すだけで、状態は変更しない（正式仕様ではない）。
  let bagFullHandler = null;
  function setBagFullHandler(fn) { bagFullHandler = typeof fn === 'function' ? fn : null; }
  /**
   * バッグへ n 個入れる（同じアイテムは1枠10個まで・容量は bagCap）。全部入るときだけ入れる（一部だけ入れることはしない）。
   * 入らないときは bagFullHandler に委ねる（未設定なら reason:'full'｜'s_limit', policy:'undecided' を返すのみ＝状態は変えない）。
   */
  function bagAdd(S, itemId, n = 1) {
    if (typeof itemId !== 'string' || !itemId || !Number.isInteger(n) || n < 1) return { ok: false, reason: 'bad_item' };
    if (bagRoomFor(S, itemId) >= n) { bagPut(S, itemId, n); return { ok: true }; }
    if (bagFullHandler) return bagFullHandler(S, mkItem(itemId, n));
    return { ok: false, reason: itemGrade(itemId) === 'S' && sGradeInBag(S) >= S_GRADE_LIMIT ? 's_limit' : 'full', policy: 'undecided' };
  }
  /** バッグの枠から k 個使う・減らす（0個になったら枠を空ける）。Chapter のアイテムの使用など */
  function bagTake(S, bagIndex, k = 1) {
    const it = S.inv.bag[bagIndex];
    if (!it || !Number.isInteger(k) || k < 1 || qty(it) < k) return { ok: false, reason: 'bad_index' };
    const left = qty(it) - k; if (left > 0) setN(it, left); else S.inv.bag.splice(bagIndex, 1);
    return { ok: true, itemId: it.id, left };
  }
  /** 保管庫の行からバッグへ。k 省略＝入るだけ（1回に最大10個＝1枠分）。戻り値 moved＝移した数 */
  function moveVaultToBag(S, vaultIndex, k) {
    if (!canAccessVault(S)) return { ok: false, reason: 'vault_locked' };
    if (!(vaultIndex >= 0 && vaultIndex < S.inv.vault.length)) return { ok: false, reason: 'bad_index' };
    const it = S.inv.vault[vaultIndex], id = it && it.id;
    if (typeof id !== 'string' || !id) return { ok: false, reason: 'bad_index' };
    const room = bagRoomFor(S, id);
    if (room < 1) return { ok: false, reason: itemGrade(id) === 'S' && sGradeInBag(S) >= S_GRADE_LIMIT ? 's_limit' : 'full' };
    const want = Number.isInteger(k) && k >= 1 ? k : STACK_MAX;
    const take = Math.min(want, room, qty(it));
    bagPut(S, id, take);
    const left = qty(it) - take; if (left > 0) setN(it, left); else S.inv.vault.splice(vaultIndex, 1);
    return { ok: true, moved: take };
  }
  /** バッグの枠を丸ごと保管庫へ（同じアイテムの行にまとめる） */
  function moveBagToVault(S, bagIndex) {
    if (!canAccessVault(S)) return { ok: false, reason: 'vault_locked' };
    if (!(bagIndex >= 0 && bagIndex < S.inv.bag.length)) return { ok: false, reason: 'bad_index' };
    const it = S.inv.bag[bagIndex];
    if (plain(it)) { const k = qty(it), r = vaultAdd(S, it.id, k); if (!r.ok) return r; S.inv.bag.splice(bagIndex, 1); return { ok: true, moved: k }; }
    if (!vaultHasRoom(S)) return { ok: false, reason: 'vault_full' };
    S.inv.bag.splice(bagIndex, 1); S.inv.vault.push(it);
    return { ok: true, moved: qty(it) };
  }
  /**
   * 持ち物の整理（読み込み・帰還のたびに呼んでよい。何度呼んでも数は増えも減りもしない）。
   *  ①個数の形をそろえる（1個＝{ id }・2個以上＝{ id, n }。旧形式の { id } は1個のまま）。n===0 の枠は空き枠として外す（ID の無い壊れた形は触らない）
   *  ②保管庫は1種類1行にまとめる　③バッグは同じアイテムを10個ずつの枠にまとめ直す（元の並びの順）
   *  ④Chapter 進行中・特訓中でなければ、枠数（bagCap）を超えた分と等級 S の2個目以降を保管庫へ（数・種類は失わない）。
   *    Chapter 進行中はバッグの物を消さず・動かさずに残す（帰還のあとに整理）
   *  戻り値 { changed, moved（保管庫へ移した個数）, held（Chapter 中で保留した超過の枠数） }
   */
  function tidyInventory(S) {
    if (!S || !isObj(S.inv) || !Array.isArray(S.inv.bag) || !Array.isArray(S.inv.vault)) return { changed: false, moved: 0, held: 0 };
    const inv = S.inv, before = JSON.stringify([inv.bag, inv.vault]);
    const norm = (list) => list.filter((it) => !(isObj(it) && it.n === 0)).map((it) => (plain(it) ? mkItem(it.id, qty(it)) : it));
    // 保管庫：同じアイテムを1行に
    const vault = [];
    for (const it of norm(inv.vault)) { const e = plain(it) && vault.find((x) => plain(x) && x.id === it.id); if (e) setN(e, qty(e) + qty(it)); else vault.push(it); }
    // バッグ：同じアイテムを10個ずつの枠に（最初に出てきた順）
    const order = [], tot = {}, odd = [];
    for (const it of norm(inv.bag)) { if (!plain(it)) { odd.push(it); continue; } if (!(it.id in tot)) { order.push(it.id); tot[it.id] = 0; } tot[it.id] += qty(it); }
    let bag = [];
    for (const id of order) for (let n = tot[id]; n > 0; n -= STACK_MAX) bag.push(mkItem(id, Math.min(n, STACK_MAX)));
    bag = bag.concat(odd);
    inv.vault = vault; inv.bag = bag;
    let moved = 0, held = 0;
    const toVault = (it) => { if (plain(it)) vaultAdd(S, it.id, qty(it)); else inv.vault.push(it); moved += qty(it); };
    if (canAccessVault(S)) {
      // 等級 S は合計1個まで（2個目以降は保管庫）
      let sLeft = S_GRADE_LIMIT;
      inv.bag = inv.bag.filter((it) => { if (!(plain(it) && itemGrade(it.id) === 'S')) return true; const n = qty(it), keep = Math.min(sLeft, n); sLeft -= keep; if (n > keep) { toVault(mkItem(it.id, n - keep)); setN(it, keep); } return keep > 0; });
      const cap = bagCap(S);
      if (inv.bag.length > cap) inv.bag.splice(cap).forEach(toVault);
    } else held = Math.max(0, inv.bag.length - bagCap(S));
    return { changed: JSON.stringify([inv.bag, inv.vault]) !== before, moved, held };
  }

  function registerItem(def) {
    if (!isObj(def) || typeof def.id !== 'string' || !def.id) throw new Error('アイテムIDが不正です');
    // grade：アイテムの等級（'S' のときバッグに合計1個まで）。正式な等級データは未登録＝今はどのアイテムにも無い
    itemDefs[def.id] = Object.freeze({ id: def.id, name: def.name || def.id, price: def.price ?? null, sellPrice: def.sellPrice ?? null, grade: def.grade ?? null });
  }
  function getItemDef(id) { return itemDefs[id] || null; }
  /** 登録済みのアイテムの定義（登録順。2026-10-05 PHASE B：アイテム図鑑＝既存のデータを見るだけ） */
  function listItemDefs() { return Object.values(itemDefs); }
  function setShopCatalog(ids) { shopCatalog = Array.isArray(ids) ? [...ids] : []; }
  function getShopCatalog() { return shopCatalog.filter((id) => itemDefs[id]); }
  /** 購入品は保管庫へ入る（同じアイテムの行にまとめる。アイテム屋はバッグを直接操作しない） */
  function shopBuy(S, itemId) {
    if (!canAccessVault(S)) return { ok: false, reason: 'not_at_farm' };
    const d = itemDefs[itemId];
    if (!d || !shopCatalog.includes(itemId)) return { ok: false, reason: 'not_sold' };
    if (!Number.isInteger(d.price) || d.price < 0) return { ok: false, reason: 'no_price' };
    if ((S.g || 0) < d.price) return { ok: false, reason: 'no_money' };
    if (!S.inv.vault.some((x) => plain(x) && x.id === itemId) && !vaultHasRoom(S)) return { ok: false, reason: 'vault_full' };
    S.g -= d.price;
    vaultAdd(S, itemId, 1);
    return { ok: true };
  }
  /** 保管庫の行から1個売る（0個になったら行を消す） */
  function shopSell(S, vaultIndex) {
    if (!canAccessVault(S)) return { ok: false, reason: 'not_at_farm' };
    const it = S.inv.vault[vaultIndex];
    if (!it) return { ok: false, reason: 'bad_index' };
    const d = itemDefs[it.id];
    if (!d || !Number.isInteger(d.sellPrice) || d.sellPrice < 0) return { ok: false, reason: 'no_price' };
    if (qty(it) > 1) setN(it, qty(it) - 1); else S.inv.vault.splice(vaultIndex, 1);
    S.g = (S.g || 0) + d.sellPrice;
    return { ok: true };
  }

  root.MMP7 = Object.freeze({
    SAVE_VERSION, RANK_B, RANK_S, RANK_COUNT, BAG_BASE_CAP, BAG_UNLOCKED_CAP,
    TRAIN_KINDS, TRAIN_LEN, TRAIN_TEMPLATE, TRAIN_GAIN, TOUGH_MAX_CLEARS, TRAIN_MAX, DICE_MIN, DICE_MAX,
    MOVESET_SLOTS, CHAPTER_DEFS, CHAPTER_COUNT, STATUS_FARM, STATUS_BOARD, NOTHING_SQUARE,
    configureLegacy, newProg, ensureProg, initProgForNew,
    RAISE, raiseState, trainRunOf, isRaising, inChapter, hasEndedChapter, TOUGH_UNLOCK_RANK, hasClearedRankAtLeast,
    newSave, migrateSave, normalizeV5,
    getChapterDef, registerChapterBoard, getChapterBoard, isChapterPlayable,
    isNothingSquare,
    registerMoveset, getMoveset,
    hasClearedRank, recordRankClear,
    rollDice, rollDie, trainSquare, canStartTraining, startTraining, advanceTraining, finishTraining,
    addFusionSpeciesResolver, resolveFusionSpecies, fusionInheritCandidates, pickFusionInherit,
    bagCap, bagFree, vaultHasRoom, canAccessVault, bagAdd, setBagFullHandler, moveVaultToBag, moveBagToVault,
    STACK_MAX, S_GRADE_LIMIT, BAG_CAP_BY_WIN, bestWinRank, bagCapForRank, qty, itemCount, bagRoomFor, bagTake, vaultAdd, tidyInventory,
    registerItem, getItemDef, setShopCatalog, getShopCatalog, shopBuy, shopSell, listItemDefs,
  });
})(typeof window !== 'undefined' ? window : globalThis);
