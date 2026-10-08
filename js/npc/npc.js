// =========================================================
// 共通NPC表示・共通会話（MMNPC）
//  ・NPCの登録（名前・表示の種類 view ごとの表情 expression 画像）と、画像の取り出し（無い表情でも止まらない）
//  ・会話：NPC画像・名前・本文を表示し、本文は1文字ずつ表示（タイプライター）。
//    表示中にタップ＝全文表示／全文表示後にタップ＝次のセリフ／最後のセリフ＝会話終了。
//  画像とセリフは分けて持つ（同じ表情で別のセリフを使える）。行ごとに npc・view・expression・name・side を指定でき、省略すると前の行を引き継ぐ。
//  NPC同士の会話：行ごとに npc を切り替えると、名前・立ち絵・表情がその話者に切り替わる。side（'left'／'right'）で立ち絵と名前の左右を指定できる
//  （省略時はその話者が前に使った側、はじめてなら left）。2人の同時表示は今後の拡張（今は話している1人だけを出す）。
//  選択肢：行に choices（[{ id, label }]）を書くと、全文表示のあとに選択肢を出し、選ぶまで次へ進まない（本文のタップでは進まない）。
//  選んだ id の続き（talk の opts.branches[id] の行）があれば同じ会話ウィンドウで続け、無ければ会話を終える。talk の Promise は選んだ id で解決する（選ばずに終われば null）。
//  重要な意思決定は「フィナがプレイヤーへ確認 → プレイヤーが選択肢で回答 → フィナが NPC との会話を続ける」の形で使う。
//  この仕組みは画面に何も常設しない。呼ばれたときだけ会話ウィンドウを出し、終わったら消す（セーブにも保存しない）。
// =========================================================
(function (root) {
  'use strict';

  /** 文字送りの速さ（1文字あたりのミリ秒）。変更はここ1か所だけ */
  const TYPE_MS = 32;
  /** 1回のタップが二重に処理されないための最短間隔（ミリ秒） */
  const MIN_TAP_MS = 80;
  /** 会話を開いた直後、タップ・キーを受け付けない時間（ミリ秒）。会話を開いた入力（名前欄の Enter／完了、ダブルタップの2打目）を1回目のタップとして扱わない（画面の会話 talk で使う） */
  const OPEN_GUARD_MS = 200;
  /** 選択肢を出してから、押下を受け付けない時間（ミリ秒）。全文表示のタップ・ダブルタップの2打目で選択肢を確定させない（取り返しのつかない選択のため） */
  const CHOICE_GUARD_MS = 350;
  /** 選択肢の押下は、直前のタップ（本文のタップ・無視した押下も含む）から、この時間あいていないと受け付けない（ミリ秒）。会話を送る連打のリズムのまま選択肢を確定させない（2度押しの確認と同じ0.4秒） */
  const CHOICE_GAP_MS = 400;
  /** 2026-10-06：タップで全文を出した直後、次のセリフへ進む押下を受け付けない時間（ミリ秒）。全文表示のタップの続き（ダブルタップの2打目）で、読む前に次のセリフへ進まない */
  const READ_GUARD_MS = 300;

  // ---------------------------------------------------------
  // NPCの登録
  // ---------------------------------------------------------
  const REG = new Map();
  /**
   * NPCを登録する。def = { name, role, defaultView, defaultExpr, views: { closeup: { normal: src, ... }, fullbody: {...} }, board }
   *  views の画像は、正式素材として存在するものだけを入れる（無い表情を作らない）。
   */
  function register(id, def) {
    if (typeof id !== 'string' || !id || !def || typeof def.name !== 'string') throw new Error('NPCの登録内容が不正です：' + id);
    const views = {}, anims = {};
    for (const [v, ex] of Object.entries(def.views || {})) { views[v] = {}; for (const [e, src] of Object.entries(ex || {})) if (typeof src === 'string' && src) views[v][e] = src; }
    // アニメーション：{ 表示の種類: { 名前: { frames: [画像…], fps, loop } } }。届いたフレームだけを、届いた枚数のまま登録する
    for (const [v, ax] of Object.entries(def.anims || {})) { anims[v] = {}; for (const [a, d] of Object.entries(ax || {})) { const fr = (d && Array.isArray(d.frames) ? d.frames : []).filter((x) => typeof x === 'string' && x); if (fr.length) anims[v][a] = Object.freeze({ frames: Object.freeze(fr), fps: d.fps > 0 ? d.fps : 8, loop: d.loop !== false }); } }
    REG.set(id, Object.freeze({ id, name: def.name, role: def.role || '', board: !!def.board, defaultView: def.defaultView || 'closeup', defaultExpr: def.defaultExpr || 'normal', views, anims }));
    return REG.get(id);
  }
  const get = (id) => REG.get(id) || null;
  const list = () => [...REG.keys()];
  const expressionsOf = (id, view) => { const n = get(id); return n && n.views[view] ? Object.keys(n.views[view]) : []; };
  const animationsOf = (id, view) => { const n = get(id); return n && n.anims[view] ? Object.keys(n.anims[view]) : []; };
  /** アニメーションを取り出す（指定の表示の種類になければ基本の種類から）。無ければ null（静止画で表示を続ける） */
  function animOf(id, view, name) { const n = get(id); if (!n || !name) return null; const v = view || n.defaultView;
    const a = (n.anims[v] && n.anims[v][name]) || (n.anims[n.defaultView] && n.anims[n.defaultView][name]); return a ? { name, frames: a.frames, fps: a.fps, loop: a.loop } : null; }
  /** 登録済みの画像（表情・アニメーション）を先に読み込む */
  function preload(id) { const n = get(id); if (!n || typeof Image === 'undefined') return Promise.resolve([]);
    const src = [...Object.values(n.views).flatMap((x) => Object.values(x)), ...Object.values(n.anims).flatMap((x) => Object.values(x).flatMap((a) => a.frames))];
    return Promise.all(src.map((s) => new Promise((ok) => { const i = new Image(); i.onload = () => ok({ src: s, ok: true, w: i.naturalWidth }); i.onerror = () => ok({ src: s, ok: false }); i.src = s; }))); }

  /**
   * 表示する画像を決める。存在しない表情・表示の種類を指定しても止まらず、次の順で代わりを探す：
   *  指定の種類×指定の表情 → 指定の種類×基本の表情 → 基本の種類×指定の表情 → 基本の種類×基本の表情 → 登録済みの最初の画像 → なし（null）
   */
  function imageOf(id, view, expr) {
    const n = get(id); if (!n) return null;
    const v = view || n.defaultView, e = expr || n.defaultExpr, V = n.views;
    const tries = [[v, e], [v, n.defaultExpr], [n.defaultView, e], [n.defaultView, n.defaultExpr]];
    for (const [a, b] of tries) if (V[a] && V[a][b]) return { src: V[a][b], view: a, expr: b, fallback: !(a === v && b === e) };
    for (const a of Object.keys(V)) for (const b of Object.keys(V[a])) return { src: V[a][b], view: a, expr: b, fallback: true };
    return null;
  }

  // ---------------------------------------------------------
  // 会話の進行（画面に依存しない部分。テストでは時計を差し替えて動かせる）
  // ---------------------------------------------------------
  /** 1文字ずつに分ける（日本語・結合文字・絵文字を1文字として扱う） */
  /**
   * 2026-10-05 PHASE B：日本語の禁則のまとまり（会話の本文）。行頭に置けない文字（句読点・閉じ括弧・小さい仮名・長音・…・―・！？）は前の文字に、開き括弧は次の文字に付ける。
   *  改行（\n）はそれだけで1つ。各行の最後のまとまりが1文字なら前とつなぐ（最後の1文字だけで改行しない）。文字（chars＝splitChars の結果）は変えない＝まとまりの中の文字数の合計は同じ
   */
  const NO_HEAD = '。、，．・：；？！!?)）」』】〕〉》’”…‥―ー〜ゃゅょっぁぃぅぇぉゎャュョッァィゥェォヮヵヶ々', NO_TAIL = '(（「『【〔〈《‘“';
  function kinsokuGroups(chars) {
    const out = []; let line = [];
    const flush = () => { if (line.length > 3 && line[line.length - 1].length === 1) { const a = line.pop(); line[line.length - 1] = line[line.length - 1].concat(a); } out.push(...line); line = []; };
    for (const ch of chars) {
      if (ch === '\n') { flush(); out.push(['\n']); continue; }
      const prev = line.length ? line[line.length - 1] : null, last = prev ? prev[prev.length - 1] : '';
      if (prev && (NO_HEAD.includes(ch) || NO_TAIL.includes(last))) prev.push(ch); else line.push([ch]);
    }
    flush(); return out;
  }
  /**
   * 2026-10-06（試遊修正「会話が早く改行される」）：会話の本文を「語＋うしろの助詞・活用」のまとまり（文節に近い）に分ける。
   *  まとまりの中では折り返さない（span.mtw）＝語の途中・助詞の前では改行しない。まとまりの間でだけ折り返す＝会話窓の横幅をいっぱいに使う。
   *  語の区切りは Intl.Segmenter（word）。続く漢字・続くカタカナは1語に、ひらがなだけの語（助詞・活用）は前の語に付ける（長くなりすぎない範囲）。
   *  「お」「ご」（＋漢字の語）は次の語に。句読点・閉じ括弧は前、開き括弧は次（kinsokuGroups と同じ文字）。行の最後が1文字だけにならない。
   *  Intl.Segmenter が無い環境・とても長い語は従来の kinsokuGroups（1文字ずつ）。文字そのもの（splitChars の結果）は変えない
   */
  const PUNCT_END = '。、，．！？!?…‥」』）)】〕〉》’”', HIRA = /^[ぁ-ゟ]+$/, KANJI = /[一-鿿々]/, KATA = /[ァ-ヺー]/, PHRASE_MAX = 10;
  function phraseGroups(text) {
    const s = String(text == null ? '' : text);
    let Seg = null; try { if (typeof Intl !== 'undefined' && Intl.Segmenter) Seg = new Intl.Segmenter('ja', { granularity: 'word' }); } catch (e) { Seg = null; }
    if (!Seg) return kinsokuGroups(splitChars(s));
    const out = [];
    s.split('\n').forEach((ln, li) => {
      if (li) out.push(['\n']);
      const segs = [...Seg.segment(ln)].map((x) => x.segment), line = []; let pend = null;
      for (let i = 0; i < segs.length; i++) {
        const seg = segs[i], ch = splitChars(seg); if (!ch.length) continue;
        if (pend) { line.push(pend.concat(ch)); pend = null; continue; }
        const prev = line.length ? line[line.length - 1] : null, last = prev ? prev[prev.length - 1] : '', first = ch[0];
        const next = segs[i + 1], prefix = (seg === 'お' || seg === 'ご') && next && !HIRA.test(next);
        if (prev && (NO_HEAD.includes(first) || NO_TAIL.includes(last))) { prev.push(...ch); continue; }   // 句読点・閉じ括弧は前に（長さに関係なく）
        if (NO_TAIL.includes(ch[ch.length - 1]) || prefix) { pend = ch; continue; }                       // 開き括弧・「お」「ご」は次の語に
        const joinable = prev && !PUNCT_END.includes(last) && prev.length + ch.length <= PHRASE_MAX;
        if (joinable && (HIRA.test(seg) || (KANJI.test(first) && KANJI.test(last)) || (KATA.test(first) && KATA.test(last)))) { prev.push(...ch); continue; }
        line.push(ch);
      }
      if (pend) line.push(pend);
      if (line.length > 1 && line[line.length - 1].length === 1) { const a = line.pop(); line[line.length - 1] = line[line.length - 1].concat(a); }   // 最後の1文字だけで改行しない
      for (const g of line) { if (g.length > 14) out.push(...kinsokuGroups(g)); else out.push(g); }   // とても長い語は従来どおり（窓からはみ出さない）
    });
    return out;
  }
  function splitChars(text) {
    const s = String(text == null ? '' : text);
    try { if (typeof Intl !== 'undefined' && Intl.Segmenter) return [...new Intl.Segmenter('ja', { granularity: 'grapheme' }).segment(s)].map((x) => x.segment); } catch (e) { /* 古い環境は下へ */ }
    return Array.from(s);
  }
  /** 行の指定を解決する（省略した npc・view・expression は前の行を引き継ぐ） */
  function resolveLines(lines) {
    let npc = null, view = null, expr = null; const sideOf = {};
    return (Array.isArray(lines) ? lines : [lines]).filter(Boolean).map((l) => {
      if (typeof l === 'string') l = { text: l };
      if (l.npc !== undefined) { if (l.npc !== npc) { view = null; expr = null; } npc = l.npc; }
      const n = get(npc);
      view = l.view || view || (n ? n.defaultView : null); expr = l.expression || l.expr || expr || (n ? n.defaultExpr : null);
      const img = npc ? imageOf(npc, view, expr) : null, anim = l.anim && npc ? animOf(npc, view, l.anim) : null;   // アニメーションは行ごとの指定（引き継がない）
      const side = l.side === 'right' || l.side === 'left' ? l.side : sideOf[npc] || 'left'; sideOf[npc] = side;   // 話者ごとに左右を覚える
      const choices = Array.isArray(l.choices) ? l.choices.filter((c) => c && typeof c.id === 'string' && c.id && typeof c.label === 'string').map((c) => ({ id: c.id, label: c.label })) : [];
      return { npc, view, expr, side, name: l.name != null ? String(l.name) : (n ? n.name : ''), text: String(l.text == null ? '' : l.text), img, anim, choices: choices.length ? choices : null };
    });
  }
  /**
   * 会話の進行役を作る。opts = { schedule(fn, ms), cancel(id), now(), onUpdate(snapshot), onEnd(choice), openGuardMs, branches: { 選択肢のid: [続きの行…] } }
   *  文字送りのタイマーは常に1つだけ。新しい行へ移る・全文表示・終了のときは必ず前のタイマーを止め、番号（token）の古いタイマーは何もしない。
   *  openGuardMs：start() からこの時間（now() で測る）のタップは無視する（省略時は0＝無視しない）。
   */
  function createTalk(lines, opts = {}) {
    let L = resolveLines(lines); const branches = opts.branches && typeof opts.branches === 'object' ? opts.branches : {};
    const schedule = opts.schedule || ((fn, ms) => setTimeout(fn, ms)), cancel = opts.cancel || ((id) => clearTimeout(id));
    const now = opts.now || (() => Date.now()), typeMs = Number.isFinite(opts.typeMs) ? opts.typeMs : TYPE_MS, guardMs = opts.openGuardMs > 0 ? opts.openGuardMs : 0;
    const st = { idx: -1, chars: [], shown: 0, typing: false, ended: false, timer: null, token: 0, lastTap: -1e9, openedAt: -1e9, fullAt: -1e9, choice: null, lastInput: -1e9 };
    const waiting = () => !st.ended && !st.typing && !!(L[st.idx] && L[st.idx].choices);   // 全文表示のあと、選択肢を選ぶのを待っている
    const stop = () => { if (st.timer != null) { cancel(st.timer); st.timer = null; } };
    const snap = () => { const l = L[st.idx] || {}; return { idx: st.idx, total: L.length, npc: l.npc || null, side: l.side || 'left', name: l.name || '', view: l.img ? l.img.view : l.view || null, expr: l.img ? l.img.expr : l.expr || null,
      img: l.img ? l.img.src : null, fallback: !!(l.img && l.img.fallback), anim: l.anim ? l.anim.name : null, frames: l.anim ? l.anim.frames : null, fps: l.anim ? l.anim.fps : 0, loop: l.anim ? l.anim.loop : false, text: st.chars.slice(0, st.shown).join(''), shown: st.shown, full: l.text || '', hasChoices: !!(l.choices && l.choices.length), nChoices: l.choices ? l.choices.length : 0, typing: st.typing, ended: st.ended, timer: st.timer != null,
      choices: waiting() ? l.choices.map((c) => ({ ...c })) : null, choice: st.choice }; };
    const emit = () => { if (opts.onUpdate) opts.onUpdate(snap()); };
    function tick(tok) {
      if (tok !== st.token || st.ended) return;   // 前の行・終了後のタイマーは何もしない
      st.timer = null; st.shown = Math.min(st.chars.length, st.shown + 1);
      if (st.shown >= st.chars.length) { st.typing = false; st.fullAt = now(); } else st.timer = schedule(() => tick(tok), typeMs);
      emit();
    }
    function show(i) {
      stop(); st.token++; st.idx = i; st.chars = splitChars(L[i].text); st.shown = 0; st.typing = st.chars.length > 0; if (!st.typing) st.fullAt = now();
      const tok = st.token; if (st.typing) st.timer = schedule(() => tick(tok), typeMs);
      emit();
    }
    function end() { if (st.ended) return; stop(); st.token++; st.ended = true; st.typing = false; emit(); if (opts.onEnd) opts.onEnd(st.choice); }
    function tap() {
      if (st.ended) return 'ended';
      const t = now(); st.lastInput = t; if (t >= st.openedAt && t - st.openedAt < guardMs) return 'ignored';   // 開いた直後：会話を開いた入力の続き（連打の間隔の記録にも入れない。時計が戻っても止まらない）
      if (t - st.lastTap < MIN_TAP_MS) return 'ignored'; st.lastTap = t;
      if (st.typing) { stop(); st.token++; st.shown = st.chars.length; st.typing = false; st.fullAt = t; st.fullTap = t; emit(); return 'full'; }   // 表示中：全文表示
      if (waiting()) return 'choice';   // 選択肢を待っている：本文のタップでは進まない
      if (t - (st.fullTap || -1e9) < READ_GUARD_MS) return 'ignored';   // 全文を出したタップの続き：まだ次へ進まない（読む間）
      if (st.idx < L.length - 1) { show(st.idx + 1); return 'next'; }   // 全文表示後：次のセリフ
      end(); return 'end';   // 最後のセリフ：会話終了
    }
    /** 選択肢を選ぶ。続き（branches[id]）があれば同じ会話で続け、無ければ会話を終える */
    function choose(id) {
      if (st.ended) return 'ended';
      if (!waiting()) return 'ignored';
      const t = now(), gap = t - st.lastInput; st.lastInput = t;
      if (t - st.fullAt < CHOICE_GUARD_MS || gap < CHOICE_GAP_MS) return 'ignored';   // 選択肢が出た直後・連打のリズムの押下は確定させない（手を止めてから押す）
      if (!L[st.idx].choices.some((c) => c.id === id)) return 'ignored';
      st.choice = id; const more = resolveLines(branches[id] || []);
      L = L.slice(0, st.idx + 1).concat(more); api.lines = L;
      if (more.length) { show(st.idx + 1); return 'next'; }
      end(); return 'end';
    }
    function start() { st.openedAt = now(); if (!L.length) { end(); return api; } show(0); return api; }
    const api = { start, tap, choose, end, state: snap, lines: L };
    return api;
  }

  // ---------------------------------------------------------
  // 会話ウィンドウ（画面）
  // ---------------------------------------------------------
  let CUR = null;   // いま開いている会話（同時に1つだけ）
  const ANIM = { timer: null, key: '', name: '', frame: 0 };   // 会話中の立ち絵アニメーション（同時に1つだけ）
  function stopAnim() { if (ANIM.timer != null) { clearInterval(ANIM.timer); ANIM.timer = null; } ANIM.key = ''; ANIM.name = ''; ANIM.frame = 0; }
  function h(tag, cls) { const e = document.createElement(tag); if (cls) e.className = cls; return e; }
  /**
   * 会話を表示する。lines = [{ npc:'fina', view:'closeup', expression:'smile', text:'…' }, …]（name で名前を上書き可）。
   *  会話が終わると解決する Promise を返す（選択肢があれば選んだ id、無ければ null）。opts.branches＝選択肢ごとの続きの行。すでに会話中なら、前の会話をきちんと終わらせてから始める。
   */
  /** 重要な会話（major）：行に view・anim の指定が無く、同じ表情の全身（fullbody）が登録されていれば全身で出す（無ければ上半身のまま。表情を変えない） */
  function preferFullbody(lines) {
    if (!Array.isArray(lines)) return lines;
    let npc = null, ex = null;
    return lines.map((l) => {
      if (!l || typeof l !== 'object') return l;
      if (l.npc !== undefined) { if (l.npc !== npc) ex = null; npc = l.npc; }
      ex = l.expression || l.expr || ex; const n = get(npc); if (!n || l.view || l.anim) return l;
      const e = ex || n.defaultExpr; return { ...l, view: n.views.fullbody && n.views.fullbody[e] ? 'fullbody' : n.defaultView };
    });
  }
  // ---- イベントの表示モード（2026-10-04 G2）：会話の間は html[data-mmev]。'1'＝施設・案内・ボードのイベント（下の画面の常設 NPC・吹き出し・会話欄を隠す＝同じ人物が2人に見えない）、
  //  'lite'＝短い一言（compact。隠さない）。どちらも下の画面（#app）は押せない（pointer-events。CSS は index.html）。終わったら少し間をおいて、隠した物を短いフェードで戻す（data-mmev-back）
  const docEl = () => (typeof document !== 'undefined' && document.documentElement && document.documentElement.setAttribute ? document.documentElement : null);
  //  data-mmev＝会話の間（下の画面は押せない）。data-mmhide＝常設の NPC を隠している（施設・案内・ボードのイベント）。会話が終わったら操作はすぐ戻し、隠した物だけ少し間をおいて戻す
  //  隠した物を戻すのはタイマーを使わない：data-mmev-back の CSS アニメーション（約0.09秒の間＋0.32秒のフェード）で戻し、そのアニメーションの終わり（animationend）で属性を外す
  function evOn(mode) { const d = docEl(); if (!d) return; d.removeAttribute('data-mmev-back'); d.setAttribute('data-mmev', mode); if (mode === '1') d.setAttribute('data-mmhide', '1'); }
  function evOff() { const d = docEl(); if (!d || CUR) return; d.removeAttribute('data-mmev');
    if (d.getAttribute('data-mmhide') === '1') { d.removeAttribute('data-mmhide'); d.setAttribute('data-mmev-back', '1'); } }
  try { if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('animationend', (e) => { if (e.animationName === 'mmevBack') { const d = docEl(); if (d) d.removeAttribute('data-mmev-back'); } }, true); } catch (e) {}
  /** 会話に出てくる立ち絵を先に読む（表情を変えたとき、読み込み待ちで前の絵が残らない） */
  function warmLines(lines) { try { if (typeof Image === 'undefined') return; for (const l of resolveLines(lines)) if (l.img && l.img.src) { const im = new Image(); im.decoding = 'async'; im.src = standOf(l.npc, l.img.view, l.img.expr) || l.img.src; } } catch (e) {} }
  /** 2026-10-04 PHASE H5：会話の立ち絵の規格（フィナの半身と同じ顔の大きさ・頭の位置・3/4身）。主要 NPC の半身（closeup）の行は、同じ表情の全身（stand＝expr/full）を
   *  CSS（.mmtalk-fig.stand・.nstf[data-npc]・--nk）で上から決まった割合だけ見せる（画像そのものは加工しない）。データ（imageOf・closeup の表情）は従来どおり */
  function standOf(id, view, expr) { const n = id && get(id); if (!n || (view && view !== 'closeup') || !n.views.stand) return null; return n.views.stand[expr] || n.views.stand[n.defaultExpr] || null; }
  function talk(lines, opts = {}) {
    if (typeof document === 'undefined') return Promise.resolve();
    close();
    return new Promise((resolve) => {
      // 表示の種類（2026-10-02）：opts.presentation＝'compact'（短い一言。背景を隠さない小さな窓・小さな立ち絵・暗幕なし）／'standard'（既定）／'major'（重要な出来事。背景を少し暗くして会話に集中）。
      //  opts.kind＝話の種類（'npc'＝NPC会話・'fina'＝フィナの案内・'event'＝重要イベント）。見た目と読み上げの区別に使う（システム通知は会話ウィンドウにしない）
      //  2026-10-04 G2：'board'＝Chapter ボードのフィナの大きな会話窓（チュートリアル・イベント説明。下の操作欄の上に置き、操作欄は押せない）。opts.big＝施設イベントの大型の会話窓（金の額・大きな文字）
      const pres = ['compact', 'major', 'board'].includes(opts.presentation) ? opts.presentation : 'standard';
      if (pres === 'major') lines = preferFullbody(lines);
      warmLines(lines); if (opts.branches) for (const v of Object.values(opts.branches)) warmLines(v);
      evOn(pres === 'compact' ? 'lite' : '1');
      // 2026-10-06：opts.scene（施設の正式背景の URL）＝重要イベント・初回イベントの見せ方。会話の後ろに施設の背景だけを描き、下の画面（通常の UI・モンスター・一覧・コマンド）は丸ごと隠す
      //  （html[data-mmscene]）。会話が終わり始めたら下の画面を戻し、会話のフェードで自然に戻る。常設 NPC だけを隠す data-mmhide では、施設ごとの通常の UI が後ろに残っていた
      const scene = pres !== 'compact' && typeof opts.scene === 'string' && opts.scene ? opts.scene : '';
      { const d = docEl(); if (d) { if (scene) d.setAttribute('data-mmscene', '1'); else d.removeAttribute('data-mmscene'); } }
      // 2026-10-05 PHASE B：イベント会話・大型の NPC 会話・登録の会話・施設の会話（施設の背景つき）は同じ正式の会話窓（event_dialogue_window＝大型の額）にそろえる
      const big = !!(opts.big || pres === 'board' || (pres !== 'compact' && (scene || opts.kind === 'event')));
      const ov = h('div', `mmtalk mmtalk-${pres}${big ? ' mmtalk-big' : ''}${scene ? ' mmtalk-scene' : ''}`), stage = h('div', 'mmtalk-stage'), fig = h('div', 'mmtalk-fig'), img = h('img'), win = h('div', 'mmtalk-win'), nm = h('div', 'mmtalk-name'), tx = h('p', 'mmtalk-text'), nx = h('span', 'mmtalk-next'), ch = h('div', 'mmtalk-choices');
      ov.dataset.pres = pres; if (opts.kind) ov.dataset.kind = String(opts.kind);
      if (scene && opts.noFig) ov.classList.add('mmtalk-nofig');   // 2026-10-07：背景の絵に人物が描かれている場面（セドリックの大会イベント）は立ち絵を重ねない
      if (scene) { const bg = h('div', 'mmtalk-scenebg'); bg.setAttribute('aria-hidden', 'true'); bg.style.backgroundImage = `url("${scene.replace(/"/g, '%22')}")`; ov.appendChild(bg); }
      ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); img.alt = ''; img.draggable = false; nx.textContent = '▼'; nx.setAttribute('aria-hidden', 'true');
      ch.hidden = true; ch.setAttribute('role', 'group'); let chKey = '';
      fig.appendChild(img); { const orn = h('i', 'mmtalk-orn'); orn.setAttribute('aria-hidden', 'true'); win.append(orn); } win.append(nm, tx, ch, nx); stage.append(fig, win); ov.appendChild(stage); document.body.appendChild(ov);
      const onKey = (e) => { if (e.key === 'Enter' || e.key === ' ') { if (e.target && e.target.closest && e.target.closest('.mmtalk-choices')) return;   // 選択肢のボタン上ではボタンの操作に任せる
        e.preventDefault(); c.tap(); } };
      let lineIdx = -1, txLine = -1, txFull = null, txShown = 0, txChars = [];
      let keyT = null;   // keydown を受け付け始めるタイマー（会話を開いたキー操作そのものは会話に届けない）
      const c = createTalk(lines, {
        openGuardMs: OPEN_GUARD_MS,   // ダブルタップの2打目（会話を開いたタップの続き）などで、1行目の文字送りを飛ばさない
        onUpdate(s) {
          if (s.ended) return;
          if (s.idx !== lineIdx) { lineIdx = s.idx; if (typeof opts.onLine === 'function') { try { opts.onLine(s.idx, s); } catch (e) {} } }   // 2026-10-05：行が変わったとき（世界地図のカメラを会話に合わせて動かす等）
          ov.dataset.npc = s.npc || ''; stage.dataset.side = s.side || 'left'; const stand = !s.frames && s.img ? standOf(s.npc, s.view || 'closeup', s.expr) : null; fig.className = 'mmtalk-fig ' + (s.view || 'closeup') + (stand ? ' stand' : ''); fig.hidden = !(s.img || s.frames);   // アニメーションだけのNPCでも立ち絵を隠さない
          const key = s.frames ? `${s.idx}:${s.anim}` : '';
          if (key !== ANIM.key) { stopAnim(); if (s.frames) { ANIM.key = key; ANIM.name = s.anim; ANIM.pre = s.frames.map((f) => { const p = new Image(); p.src = f; return p; });   // 先読みした絵を持っておく（2026-10-03：読み込み途中のコマへは切り替えない＝途中で画面を移っても読み込みを打ち切らない）
            img.src = s.frames[0]; fig.hidden = false; const fr = s.frames, loop = s.loop;
            ANIM.timer = setInterval(() => { if (ANIM.key !== key) return; if (ANIM.frame >= fr.length - 1 && !loop) { clearInterval(ANIM.timer); ANIM.timer = null; return; } const nx = (ANIM.frame + 1) % fr.length, pi = ANIM.pre && ANIM.pre[nx]; if (pi && !(pi.complete && pi.naturalWidth > 0)) return; ANIM.frame = nx; img.src = fr[ANIM.frame]; }, Math.round(1000 / s.fps)); } }
          if (!s.frames && s.img && img.getAttribute('src') !== (stand || s.img)) img.src = stand || s.img;
          img.alt = s.name ? `${s.name}（${s.expr || ''}）` : '';
          nm.textContent = s.name; nm.hidden = !s.name; win.setAttribute('aria-label', (s.name ? s.name + '：' : '') + s.full); nx.hidden = s.typing || !!s.choices;
          // 2026-10-05 PHASE B（文字送りの途中で改行の位置が変わる＝行が組み替わって見える）：行の全文を最初に組んで、改行の位置を決めてから文字を出す。
          //  全部の文字を DOM に置き（禁則のまとまり span.mtw＝折り返さない・1文字ずつ span.mtc）、まだの文字は透明（opacity 0。場所は取る）→ 出た文字から .on。文字の位置は動かない
          if (s.idx !== txLine || s.full !== txFull) { txLine = s.idx; txFull = s.full; txShown = 0; tx.textContent = ''; txChars = [];
            for (const g of phraseGroups(s.full)) { if (g.length === 1 && g[0] === '\n') { tx.appendChild(document.createTextNode('\n')); continue; }
              const w = h('span', 'mtw'); for (const chr of g) { const cs = h('span', 'mtc'); cs.textContent = chr; w.appendChild(cs); txChars.push(cs); } tx.appendChild(w); }
            // 選択肢がある行は、選択肢の場所も最初から取っておく（全文のあとに選択肢が出ても本文が上へずれない）
            ch.classList.toggle('pre', !!(s.hasChoices && !s.choices)); ch.classList.toggle('two', s.nChoices === 2); ch.style.setProperty('--n', String(s.nChoices || 0)); if (s.hasChoices && !s.choices) ch.hidden = false; }
          const want = Math.min(txChars.length, s.shown); if (want < txShown) { for (let i = want; i < txShown; i++) txChars[i].classList.remove('on'); }
          for (let i = txShown; i < want; i++) txChars[i].classList.add('on'); txShown = want;
          if (s.choices) ch.classList.remove('pre');
          const k = s.choices ? s.idx + ':' + s.choices.map((x) => x.id).join(',') : '';   // 選択肢は全文表示のあとだけ（▼の代わり）
          if (k !== chKey) { chKey = k; ch.textContent = ''; ch.hidden = !s.choices && !ch.classList.contains('pre');
            if (s.choices) for (const x of s.choices) { const bt = h('button', 'mmtalk-choice'); bt.type = 'button'; bt.textContent = x.label; bt.dataset.choice = x.id; if (Array.from(x.label).length >= 13) bt.classList.add('long');   /* 2026-10-07 試遊：長い選択肢（13字以上）は文字を少し小さくして1行に収める */
              bt.addEventListener('click', (e) => { e.stopPropagation(); bt.classList.add('on'); c.choose(x.id); });   /* 2026-10-06：押した選択肢を金の枠で光らせる（.on） */ ch.appendChild(bt); } }
        },
        onEnd(choice) { stopAnim(); clearTimeout(keyT); document.removeEventListener('keydown', onKey); if (scene) { const d = docEl(); if (d) d.removeAttribute('data-mmscene'); } if (typeof opts.onClose === 'function' && !ov.__instant) { try { opts.onClose(choice == null ? null : choice); } catch (e) {} }   /* 2026-10-07 試遊：opts.onClose＝閉じ始め（フェードの前）に次の画面を下に描く＝会話のフェードの間に前の画面が一瞬見えない */ if (ov.animate && ov.classList && !ov.__instant) { ov.classList.add('mmtalk-out'); const a = ov.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease-in', fill: 'forwards' }); const done = () => { ov.remove(); try { a.cancel(); } catch (e) {} tx.textContent = ''; txChars = []; evOff(); resolve(choice == null ? null : choice); }; a.finished.then(done, done); } else { ov.remove(); tx.textContent = ''; txChars = []; evOff(); resolve(choice == null ? null : choice); } if (CUR && CUR.c === c) CUR = null;   /* 2026-10-05 PHASE B：閉じたら本文の文字の要素（1文字ずつの span）を片付ける＝閉じた会話の DOM を残さない */ },   // 退場：短くフェード（急に消さない）。Promise はフェードが終わって DOM を消してから解決する（次の画面が会話の上に出ない・会話の要素が残らない）。220ms 後に DOM から外す
        branches: pres === 'major' && opts.branches ? Object.fromEntries(Object.entries(opts.branches).map(([k, v]) => [k, preferFullbody(v)])) : opts.branches,
      });
      ov.addEventListener('click', (e) => { e.stopPropagation(); c.tap(); });
      keyT = setTimeout(() => { keyT = null; document.addEventListener('keydown', onKey); }, 0);   // 名前欄の Enter で開いたとき、その同じ keydown が document へ伝わって1行目を飛ばさないよう、次のタスクから受け付ける
      CUR = { c, ov };
      c.start();
    });
  }
  /** 開いている会話を終わらせる（タイマーも止める） */
  function close() { if (CUR) { const x = CUR; CUR = null; if (x.ov) x.ov.__instant = true; x.c.end(); } }   // 途中で閉じる（次の会話を開く・画面を切り替える）ときはフェードせず即座に消す（ウィンドウを2つ重ねない）
  const state = () => (CUR ? CUR.c.state() : null);
  const animState = () => ({ running: ANIM.timer != null, name: ANIM.name, frame: ANIM.frame });
  /** 既存NPC会話（index.html の NP 形式：{ n: 名前, t: [セリフ…] }）を、文章を変えずに共通会話の行へ変換する */
  const fromLegacy = (entry, idx) => (entry && Array.isArray(entry.t) ? (idx || entry.t.map((_, i) => i)).filter((i) => typeof entry.t[i] === 'string').map((i) => ({ name: entry.n, text: entry.t[i] })) : []);

  // ---------------------------------------------------------
  // 登録済みNPC
  // ---------------------------------------------------------
  // フィナ：主要な案内役（Chapterボードには置かない）。正式素材（上半身の透過PNG）を assets/npc/fina/ に置いている（README.md に元画像との対応）。
  //  全身（fullbody）：2026-10-03 の正式素材 10ポーズ（assets/npc/fina/fullbody/。README.md）。重要な会話（presentation 'major'）で同じ表情の全身があれば全身で出す
  const FINA = 'assets/npc/fina/', FE = ['normal', 'smile', 'happy', 'surprised', 'troubled', 'worried', 'serious', 'guide'], FBE = [...FE, 'wave', 'greet'], fr = (a) => [1, 2, 3, 4, 5, 6].map((i) => `${FINA}animations/${a}/${a}_0${i}.webp`);
  register('fina', { name: 'フィナ', role: '案内役', board: false, defaultView: 'closeup', defaultExpr: 'normal',
    views: { closeup: Object.fromEntries(FE.map((e) => [e, `${FINA}closeup/${e}.webp`])), fullbody: Object.fromEntries(FBE.map((e) => [e, `${FINA}fullbody/${e}.webp`])) },
    anims: { closeup: { wave: { frames: fr('wave'), fps: 8, loop: true }, wave_blink: { frames: fr('wave_blink'), fps: 6, loop: true } } } });

  // カレン：市場担当（アップ画像のみで運用。全身は使わない）。正式素材（背景を透明にした透過PNG）を assets/npc/karen/closeup/ に置いている（README.md に元画像との対応）
  const KAREN = 'assets/npc/karen/closeup/', KE = ['normal', 'smile', 'guide', 'troubled', 'happy', 'serious'];
  register('karen', { name: 'カレン', role: '市場担当', board: false, defaultView: 'closeup', defaultExpr: 'normal',
    views: { closeup: Object.fromEntries(KE.map((e) => [e, `${KAREN}${e}.webp`])) } });

  // ダン：ファーム担当（旧「コウ」の表示を置き換え。アップ画像のみで運用）。正式素材（透過PNG）を assets/npc/dan/closeup/ に置いている（README.md に元画像との対応）
  const DAN = 'assets/npc/dan/closeup/', DE = ['normal', 'smile', 'guide', 'serious', 'troubled', 'happy'];
  register('dan', { name: 'ダン', role: 'ファーム担当', board: false, defaultView: 'closeup', defaultExpr: 'normal',
    views: { closeup: Object.fromEntries(DE.map((e) => [e, `${DAN}${e}.webp`])) } });

  // ニック：牧場の管理者（アップ画像のみで運用）。正式素材（描き込まれた市松模様の背景を透明にした透過PNG）を assets/npc/nick/closeup/ に置いている（README.md に元画像との対応）
  const NICK = 'assets/npc/nick/closeup/', NE = ['normal', 'smile', 'guide', 'troubled', 'happy', 'serious'];
  register('nick', { name: 'ニック', role: '牧場の管理者', board: false, defaultView: 'closeup', defaultExpr: 'normal',
    views: { closeup: Object.fromEntries(NE.map((e) => [e, `${NICK}${e}.webp`])) } });

  // セドリック：公式ランク大会の進行役（アップ画像のみで運用）。正式素材（描き込まれた市松模様の背景を透明にした透過PNG）を assets/npc/cedric/closeup/ に置いている（README.md に元画像との対応）
  const CEDRIC = 'assets/npc/cedric/closeup/', CE = ['normal', 'smile', 'guide', 'happy', 'surprised', 'serious'];
  register('cedric', { name: 'セドリック', role: '公式ランク大会の進行役', board: false, defaultView: 'closeup', defaultExpr: 'normal',
    views: { closeup: Object.fromEntries(CE.map((e) => [e, `${CEDRIC}${e}.webp`])) } });

  // エリオット：研究所の案内・研究・解析を担当する研究者（アップ画像のみで運用）。正式素材（背景の無地の灰色を透明にした透過PNG）を assets/npc/elliot/closeup/ に置いている（README.md に元画像との対応）
  const ELLIOT = 'assets/npc/elliot/closeup/', EE = ['normal', 'smile', 'guide', 'thinking', 'curious', 'serious'];
  register('elliot', { name: 'エリオット', role: '研究所の研究者', board: false, defaultView: 'closeup', defaultExpr: 'normal',
    views: { closeup: Object.fromEntries(EE.map((e) => [e, `${ELLIOT}${e}.webp`])) } });

  // ヴァルガス：闘技場の管理者（アップ画像のみで運用）。正式素材（描き込まれた市松模様の背景を透明にした透過PNG）を assets/npc/vargas/closeup/ に置いている（README.md に元画像との対応）
  const VARGAS = 'assets/npc/vargas/closeup/', VE = ['normal', 'guide', 'stern', 'approval', 'surprised', 'respect'];
  register('vargas', { name: 'ヴァルガス', role: '闘技場の管理者', board: false, defaultView: 'closeup', defaultExpr: 'normal',
    views: { closeup: Object.fromEntries(VE.map((e) => [e, `${VARGAS}${e}.webp`])) } });

  // ゲンシン：特訓の指導役（5種類すべての特訓を担当。アップ画像のみで運用）。正式素材（描き込まれた市松模様の背景を透明にした透過PNG）を assets/npc/genshin/closeup/ に置いている（README.md に元画像との対応）
  const GENSHIN = 'assets/npc/genshin/closeup/', GE = ['normal', 'smile', 'guide', 'serious', 'strict', 'praise'];
  register('genshin', { name: 'ゲンシン', role: '特訓の指導役', board: false, defaultView: 'closeup', defaultExpr: 'normal',
    views: { closeup: Object.fromEntries(GE.map((e) => [e, `${GENSHIN}${e}.webp`])) } });

  // ---------------------------------------------------------
  // 2026-10-04（第二段階・追加アセット）：主要 NPC 8人 × 4表情の正式素材（assets/npc/<id>/expr/。README.md）。
  //  会話の行の expression（データ側）で表情を切り替える。closeup＝半身（573×760＝今までの半身と同じ器）・face＝小さい顔（吹き出し）・fullbody＝全身（重要な会話 major・アイテム屋の店）。
  //  古い表情名（normal・smile…）は、意味の近い新しい表情へ読み替える（古いファイルは残す。同じ会話の中で新旧の絵が混ざらない＝レイアウトが跳ねない）。
  //  アイテム屋のおばあちゃん（id 'shop'）は名前が未確定＝名前の札は「アイテム屋」（役割の名前。固有名は付けない）
  // ---------------------------------------------------------
  const EXPR = Object.freeze({
    karen: ['guide', 'welcome', 'think', 'sold'],        // 01 通常・案内／02 歓迎・笑顔／03 考える・少し真剣／04 嬉しい・購入成立
    dan: ['normal', 'cheer', 'caution', 'proud'],         // 01 通常／02 励ます・笑顔／03 真剣・注意／04 成長を認める・満足
    nick: ['normal', 'gentle', 'serious', 'impressed'],   // 01 通常／02 優しい笑顔／03 真剣／04 成長を見て感心
    elliot: ['normal', 'smile', 'analyze', 'discover'],   // 01 通常／02 小さな笑顔／03 思考・分析／04 発見・控えめな驚き
    vargas: ['normal', 'grin', 'stern', 'acknowledge'],   // 01 通常・威厳／02 不敵な笑み／03 厳しい・真剣／04 良い戦いを認める
    cedric: ['host', 'kickoff', 'tense', 'victory'],      // 01 通常・司会／02 試合開始・盛り上げ／03 緊張感・真剣／04 勝者発表・華やかな笑顔
    genshin: ['guide', 'fired', 'strict', 'approve'],     // 01 通常・指導／02 気合を入れる／03 厳しい・真剣／04 認める・満足
    shop: ['normal', 'smile', 'worry', 'recommend'],      // 01 通常／02 優しい笑顔／03 心配／04 満足・おすすめ
  });
  /** 古い表情名 → 新しい表情（意味の近いもの） */
  const EXPR_ALIAS = Object.freeze({
    karen: { normal: 'guide', smile: 'welcome', troubled: 'think', happy: 'sold', serious: 'think' },
    dan: { smile: 'cheer', guide: 'normal', serious: 'caution', troubled: 'caution', happy: 'proud' },
    nick: { smile: 'gentle', guide: 'gentle', troubled: 'serious', happy: 'impressed' },
    elliot: { guide: 'smile', thinking: 'analyze', curious: 'discover', serious: 'analyze' },
    vargas: { guide: 'normal', approval: 'acknowledge', surprised: 'normal', respect: 'acknowledge' },
    cedric: { normal: 'host', smile: 'host', guide: 'host', happy: 'victory', surprised: 'kickoff', serious: 'tense' },
    genshin: { normal: 'guide', smile: 'approve', serious: 'strict', praise: 'approve' },
    shop: { happy: 'recommend', troubled: 'worry', guide: 'normal' },
  });
  // セルジュ（聖獣士管理局・正式登録の担当。2026-10-05）：名前・役割だけを登録する（正式の透過素材はまだ無い＝立ち絵は出さない。白背景の参考画像は使わない）。
  //  透過素材が届いたら views に closeup／stand を足すだけで、会話と管理局の画面に立つ
  //  2026-10-06：正式の立ち絵（assets/npc/serge/full_normal.webp＝ZIP claude_next_fix_assets_v2 の serge_reference の白背景を透過）。表情は normal だけ
  const SERGE = 'assets/npc/serge/full_normal.webp', SV = { normal: SERGE };
  register('serge', { name: 'セルジュ', role: '聖獣士管理局の職員（正式登録・登録名の確認・聖獣士証・功績の案内）', board: false, defaultView: 'closeup', defaultExpr: 'normal',
    views: { closeup: { ...SV }, fullbody: { ...SV }, stand: { ...SV } } });
  // リュウ（ライバル。2026-10-07：街で最初に会うイベント・Chapter 1 のライバル戦の会話）：正式の全身（assets/npc/ryu/ryu_official_fullbody.webp）。表情は1つ
  //  2026-10-08：正式の表情5種（assets/npc/ryu/expr/＝ZIP の ryu_01〜05。腰から上の透過 PNG を 573×760 の可逆 WebP に）を会話の立ち絵（closeup）に。全身（fullbody）は従来の正式の全身のまま
  const RYU = 'assets/npc/ryu/ryu_official_fullbody.webp', RV = { normal: RYU }, RX = (k) => `assets/npc/ryu/expr/${k}.webp`;
  const RC = { normal: RX('normal'), surprise: RX('surprise'), confident: RX('confident'), serious: RX('serious'), soft_smile: RX('soft_smile') };
  register('ryu', { name: 'リュウ', role: 'ライバル（フィナと同じ町の出身）', board: false, defaultView: 'closeup', defaultExpr: 'normal', views: { closeup: { ...RC }, fullbody: { ...RV } } });   // stand を持たない＝会話は表情の closeup（stand があると全身を切って見せる）
  const NPC_NAME = { karen: ['カレン', '市場担当'], dan: ['ダン', 'ベースキャンプ担当'], nick: ['ニック', '牧場の管理者'], elliot: ['エリオット', '研究所の研究者'], vargas: ['ヴァルガス', '闘技場の管理者'], cedric: ['セドリック', '公式ランク大会の進行役'], genshin: ['ゲンシン', '特訓の指導役'], shop: ['ベルナ', 'アイテム屋（ベースキャンプ）'] };
  for (const [id, keys] of Object.entries(EXPR)) {
    const dir = `assets/npc/${id}/expr/`, file = (v) => Object.fromEntries(keys.map((k, i) => [k, `${dir}${v}/${String(i + 1).padStart(2, '0')}_${k}.webp`]));
    const views = { closeup: file('closeup'), face: file('face'), fullbody: file('full'), stand: file('full') };   // stand＝会話の立ち絵（全身を 3/4身に切って見せる。PHASE H5）
    for (const v of Object.values(views)) for (const [a, k] of Object.entries(EXPR_ALIAS[id] || {})) if (!v[a]) v[a] = v[k];
    const def = keys[0];
    register(id, { name: NPC_NAME[id][0], role: NPC_NAME[id][1], board: false, defaultView: 'closeup', defaultExpr: def, views });
  }
  /** 表情の画像の URL（無ければ基本の表情）。view＝'closeup'（既定）／'face'／'fullbody' */
  const srcOf = (id, expr, view) => { const im = imageOf(id, view || 'closeup', expr); return im ? im.src : ''; };
  /** 施設へ入る直前に、その NPC の表情（既定は半身と小さい顔の 4表情ずつ）だけを先読み・デコードする（起動時に全部は読まない） */
  /** 立ち絵の規格（PHASE H5）：fr＝全身（expr/full。頭の上〜足＝画像の高さ）のうち上から見せる割合。フィナの半身（closeup/normal：顔の高さ≒器の 27%・頭の上≒1%）と
   *  顔の大きさがそろうよう、絵ごとの顔の大きさから決めた値（目で測った値。体格の差は残す）。nk＝器の幅 ÷ 高さ（＝画像の幅 ÷ 高さ ÷ fr）＝CSS の --nk と同じ値 */
  const STAND = Object.freeze({ karen: { fr: 0.84, nk: 0.579 }, dan: { fr: 0.84, nk: 0.77 }, nick: { fr: 0.94, nk: 0.709 }, elliot: { fr: 0.84, nk: 0.786 }, vargas: { fr: 0.69, nk: 0.987 },
    cedric: { fr: 0.74, nk: 0.9 }, genshin: { fr: 0.84, nk: 0.777 }, shop: { fr: 0.79, nk: 0.842 }, serge: { fr: 0.68, nk: 0.867 } });
  const warmed = new Set();
  function warm(id, views = ['stand', 'face']) {
    const n = get(id); if (!n || typeof Image === 'undefined') return;
    for (const v of views) for (const src of new Set(Object.values(n.views[v] || {}))) { if (warmed.has(src)) continue; warmed.add(src); const i = new Image(); i.decoding = 'async'; i.src = src; if (i.decode) i.decode().catch(() => {}); }
  }

  root.MMNPC = Object.freeze({ TYPE_MS, MIN_TAP_MS, register, get, list, expressionsOf, animationsOf, imageOf, animOf, preload, splitChars, resolveLines, createTalk, talk, close, state, animState, fromLegacy, EXPR, EXPR_ALIAS, srcOf, warm, standOf, STAND, kinsokuGroups, phraseGroups });
})(typeof window !== 'undefined' ? window : globalThis);
