// 2026-10-15：QA 試遊モード `MMQA`（ZIP「Mismon_CompareScreen_And_QA_Instructions_20261015」の C）。
//  ・URL に ?mmQaTrial=1 を付けたときだけ、ベースキャンプと牧場に『QA：全モンスター・全技試遊 ON/OFF』の切り替えを出す（普段の URL では何も出さない・何も動かない）。
//  ・ON：今のセーブ（S）をページの中に控え、通常のセーブへ一切書かない（index.html の save() は何もしない＋localStorage のセーブのキー mr4… への書き込みを止める）。
//    試遊専用の画面に 6体（ソラモ・ガウル・ノビトン・ジオル・レグナス〔QA だけの貸与〕・フルーネ〔未解禁〕）×各10技＝60 の技カードを並べる。
//    実戦できる技（技の番号 SK があるもの＝ソラモ・ガウル・ノビトン・レグナス）は「この技で QA 試合」＝ルーレットの6枠をすべてその技にして、
//    安全なテスト相手（ランク E の練習試合の相手・ソラモ）と戦う（戦闘の計算・技の性能・ルーレットは変えない）。
//    ジオル＝技の性能が未決（SK の番号なし）＝実戦は無し・技アニメのコマのプレビュー（MM25D.preview）だけ。
//    フルーネ＝技の性能・技アニメが未承認＝静止カード・待機絵・比較画面の確認だけ（『未実装／要仕様確認』と出す）。
//  ・OFF：控えたセーブへ戻して（ページの中の S を元どおり）通常の画面（切り替えた所＝牧場／ベースキャンプ）へ。再読み込みすると必ず OFF（QA の状態は保存しない）。
//  ・通常の牧場の数・所有・市場・合体・図鑑・技の習得・G・報酬・チケット・順位・記録は増減しない（すべて控えた S ごと捨てる）。
(function (root) {
  'use strict';
  const doc = root.document;
  const qs = (() => { try { return new URLSearchParams(root.location && root.location.search || ''); } catch (e) { return null; } })();
  const ENABLED = !!(qs && qs.get('mmQaTrial') === '1');
  // 6体（番号は表示の順。sp＝バトルの絵の番号＝IMG の番号。フルーネの 5 は予約＝バトルの絵は無い）
  const MONS = Object.freeze([
    Object.freeze({ sp: 0, key: 'solamo' }), Object.freeze({ sp: 1, key: 'gauru' }), Object.freeze({ sp: 2, key: 'nobiton' }),
    Object.freeze({ sp: 3, key: 'jiol' }), Object.freeze({ sp: 4, key: 'regnas' }), Object.freeze({ sp: 5, key: 'flurene' }),
  ]);
  const KS = ['li', 'po', 'in', 'hi', 'ev', 'de'];
  const ST = { on: false, snap: null, from: null, mon: 0, sel: null, battling: false, prev: false, wrap: false, set: null, rem: null };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const G = (n) => { try { return (0, eval)(n); } catch (e) { return undefined; } };   // index.html の大域（S・SK・fight など）を呼ぶ時点で読む
  const M = () => root.MMP10M;
  const SAVE_KEY_RE = /^mr4(v6|s\d+t?|ng)?$/;   // 通常のセーブのキー（mr4v6・旧 mr4・スロット mr4s1〜3・保存時刻 mr4s1t・新しいゲームの印 mr4ng）。音の設定 mr4a などは対象外

  // ---- データ ----
  function info(sp) {
    const m = M(); if (!m) return null;
    if (sp === 4) { const r = m.rivalMonster('regnas'); return r && { name: r.name, base: r.base, speed: r.speed, img: r.image && r.image.src, idle: './assets/battle/idle/idle_regnas.webp', note: '貸与（QA だけ）' }; }
    if (sp === 5) { const f = m.pendingSpecies('flurene'); return f && { name: f.name, base: f.base, speed: f.speed, img: f.image && f.image.src, idle: f.battleIdle && f.battleIdle.src, note: '未解禁（QA の確認だけ）' }; }
    const s = m.byId(sp); return s && { name: s.name, base: s.base, speed: s.speed, img: s.image && s.image.src, idle: null, note: '' };
  }
  function moveData(key) {
    const m = M(); if (!m) return [];
    if (key === 'regnas') { const r = m.rivalMonster('regnas'); return (r && r.moves && r.moves.list) || []; }
    if (key === 'flurene') { const f = m.pendingSpecies('flurene'); return (f && f.moves) || []; }
    const L = m.movesOf(key); return Array.isArray(L) ? L : (L && L.list) || [];
  }
  /** 技の状態：battle＝実戦可能（SK の番号があり技のデータがある）／preview＝技アニメのコマのプレビューだけ（ジオル）／static＝静止カードだけ（フルーネ＝未実装／要仕様確認） */
  function statusOf(key, slot) {
    const SK = G('SK');
    if (slot != null && SK && SK[slot]) return 'battle';
    if (key === 'jiol') return 'preview';
    return 'static';
  }
  /** 6体×10技の一覧（テスト・画面の共通） */
  function catalog() {
    const C = root.MMMVCARD;
    return MONS.map((x) => {
      const inf = info(x.sp) || {}, md = moveData(x.key), cards = C ? C.list(x.key) : [];
      const moves = cards.map((c) => {
        const d = md.find((v) => v.no === c.no) || {};
        return { no: c.no, id: c.id, name: c.name || d.name, slot: c.slot, src: c.src, status: statusOf(x.key, c.slot), type: d.type || null,
          power: d.power == null ? null : d.power, accuracy: d.accuracy == null ? null : d.accuracy, critical: d.critical == null ? null : d.critical, desc: d.desc || null };
      });
      return { sp: x.sp, key: x.key, name: inf.name, note: inf.note, img: inf.img, idle: inf.idle, moves };
    });
  }
  function counts() {
    const c = { battle: 0, preview: 0, static: 0, total: 0 };
    catalog().forEach((x) => x.moves.forEach((mv) => { c[mv.status]++; c.total++; }));
    return c;
  }

  // ---- 通常のセーブを守る ----
  function guardStorage(on) {
    const P = root.Storage && root.Storage.prototype; if (!P) return;
    if (on && !ST.set) {
      ST.set = P.setItem; ST.rem = P.removeItem;
      P.setItem = function (k, v) { if (ST.on && this === root.localStorage && SAVE_KEY_RE.test(String(k))) return undefined; return ST.set.call(this, k, v); };
      P.removeItem = function (k) { if (ST.on && this === root.localStorage && SAVE_KEY_RE.test(String(k))) return undefined; return ST.rem.call(this, k); };
    } else if (!on && ST.set) { P.setItem = ST.set; P.removeItem = ST.rem; ST.set = ST.rem = null; }
  }

  // ---- 切り替え（ベースキャンプ・牧場だけ） ----
  function where() {
    if (!doc) return null;
    if (doc.querySelector('#app>.rn')) return 'ranch';
    if (doc.querySelector('#app>.fm.bc')) return 'basecamp';
    return null;
  }
  function style() {
    if (!doc || doc.getElementById('mmqa-css')) return;
    const s = doc.createElement('style'); s.id = 'mmqa-css';
    s.textContent = [
      '#mmqa-sw{position:fixed;z-index:850;right:0;top:33%;display:flex;flex-direction:column;align-items:center;gap:5px;padding:7px 8px 7px 9px;border:2px solid #ffde59;border-right:0;border-radius:12px 0 0 12px;background:repeating-linear-gradient(135deg,#b3122e 0 10px,#8c0d24 10px 20px);color:#fff;font:800 12px/1.15 "Noto Sans JP",sans-serif;box-shadow:-2px 3px 12px rgba(0,0,0,.5);cursor:pointer}',
      '#mmqa-sw span{display:block;text-align:center;white-space:nowrap}',
      '#mmqa-sw b{display:block;padding:3px 4px;border-radius:6px;background:#0b1636;color:#ffde59;font-size:11px;padding:3px 10px}',
      '#mmqa{position:fixed;inset:0;z-index:860;display:flex;flex-direction:column;background:#0b1636;color:#fff3d6;font-family:"Noto Sans JP",sans-serif;overflow:hidden}',
      '#mmqa .qh{flex:none;padding:calc(env(safe-area-inset-top,0px) + 8px) 10px 8px;background:repeating-linear-gradient(135deg,#b3122e 0 12px,#8c0d24 12px 24px);border-bottom:3px solid #ffde59;text-align:center}',
      '#mmqa .qh b{display:block;font:900 16px/1.25 "Noto Sans JP",sans-serif;color:#fff;text-shadow:0 1px 0 #000}',
      '#mmqa .qh small{display:block;margin-top:2px;font:700 11px/1.3 "Noto Sans JP",sans-serif;color:#ffe9a8}',
      '#mmqa .qoff{margin-top:6px;padding:7px 14px;border:2px solid #fff;border-radius:10px;background:#0b1636;color:#fff;font:800 13px/1 "Noto Sans JP",sans-serif;cursor:pointer}',
      '#mmqa .qtabs{flex:none;display:grid;grid-template-columns:repeat(6,1fr);gap:4px;padding:6px}',
      '#mmqa .qtab{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 2px;border:1.5px solid rgba(216,178,90,.5);border-radius:10px;background:#13224f;color:#fff3d6;font:700 10px/1.15 "Noto Sans JP",sans-serif;cursor:pointer;min-width:0}',
      '#mmqa .qtab img{width:100%;max-width:56px;aspect-ratio:1;object-fit:contain}',
      '#mmqa .qtab.on{border-color:#ffde59;background:#24387a;box-shadow:0 0 0 2px rgba(255,222,89,.45)}',
      '#mmqa .qtab i{font-style:normal;font-size:9px;color:#cfd8ff}',
      '#mmqa .qbody{flex:1 1 auto;overflow:auto;-webkit-overflow-scrolling:touch;padding:4px 8px calc(env(safe-area-inset-bottom,0px) + 14px)}',
      '#mmqa .qmon{display:flex;align-items:center;gap:10px;margin:2px 0 8px;padding:8px;border:1.5px solid rgba(216,178,90,.45);border-radius:12px;background:rgba(19,34,79,.85)}',
      '#mmqa .qmon img{width:72px;height:72px;object-fit:contain;flex:none}',
      '#mmqa .qmon b{display:block;font:800 17px/1.2 "Shippori Mincho",serif}',
      '#mmqa .qmon small{display:block;font-size:11px;line-height:1.45;color:#e8cf8c}',
      '#mmqa .qmon .qbt{margin-left:auto;flex:none;padding:8px 10px;border:1.5px solid #d8b25a;border-radius:10px;background:#1d2f66;color:#fff3d6;font:700 11px/1.2 "Noto Sans JP",sans-serif;cursor:pointer}',
      '#mmqa .qgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
      '#mmqa .qcard{display:flex;flex-direction:column;gap:3px;padding:5px;border:1.5px solid rgba(216,178,90,.55);border-radius:10px;background:#101d46;color:#fff3d6;text-align:left;cursor:pointer;font:inherit}',
      '#mmqa .qcard.on{border-color:#ffde59;box-shadow:0 0 0 2px rgba(255,222,89,.5)}',
      '#mmqa .qcard img{width:100%;aspect-ratio:16/9;object-fit:contain;background:#000;border-radius:6px}',
      '#mmqa .qcard b{font:700 12.5px/1.25 "Noto Sans JP",sans-serif}',
      '#mmqa .qst{align-self:flex-start;padding:1px 7px;border-radius:999px;font:800 10px/1.5 "Noto Sans JP",sans-serif}',
      '#mmqa .qst.battle{background:#1f8a4c;color:#fff}#mmqa .qst.preview{background:#c27a12;color:#fff}#mmqa .qst.static{background:#7a2333;color:#fff}',
      '#mmqa .qdet{position:fixed;inset:0;z-index:2;display:flex;align-items:flex-end;justify-content:center;background:rgba(4,8,22,.72)}',
      '#mmqa .qdet>div{width:100%;max-width:480px;max-height:92dvh;overflow:auto;padding:12px 12px calc(env(safe-area-inset-bottom,0px) + 14px);border-top:3px solid #ffde59;border-radius:16px 16px 0 0;background:#0f1b42}',
      '#mmqa .qdet img.big{width:100%;aspect-ratio:16/9;object-fit:contain;background:#000;border-radius:8px}',
      '#mmqa .qdet h3{margin:8px 0 2px;font:800 18px/1.25 "Shippori Mincho",serif}',
      '#mmqa .qdet p{margin:4px 0;font-size:12px;line-height:1.55;color:#e9e2cc}',
      '#mmqa .qdet .qrow{display:flex;gap:8px;margin-top:10px}',
      '#mmqa .qdet .qrow button{flex:1;min-height:46px;border-radius:12px;font:800 14px/1.2 "Noto Sans JP",sans-serif;cursor:pointer}',
      '#mmqa .qgo{border:2px solid #fff0c0;background:linear-gradient(180deg,#fbe39a,#c58d2a);color:#3b2406}',
      '#mmqa .qno{border:1.5px solid #d8b25a;background:#1d2f66;color:#fff3d6}',
      '#mmqa .qpics{display:flex;gap:6px;margin-top:6px}#mmqa .qpics figure{flex:1;margin:0;text-align:center;font-size:10px;color:#cfd8ff}#mmqa .qpics img{width:100%;aspect-ratio:1;object-fit:contain;background:rgba(255,255,255,.06);border-radius:8px}',
      '#mmqa-bar{position:fixed;z-index:60;left:6px;right:6px;bottom:calc(env(safe-area-inset-bottom,0px) + 6px);display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:5px;padding:6px;border:2px solid #ffde59;border-radius:12px;background:rgba(140,13,36,.92);color:#fff;font:800 11px/1.2 "Noto Sans JP",sans-serif}',
      '#mmqa-bar.top{bottom:auto;top:calc(env(safe-area-inset-top,0px) + 98px);left:6px;right:auto;padding:4px 6px}',
      '#mmqa-bar button{min-width:38px;min-height:34px;padding:4px 8px;border:1.5px solid #fff;border-radius:8px;background:#0b1636;color:#fff;font:800 12px/1 "Noto Sans JP",sans-serif;cursor:pointer}',
      '#bt.mmqa-prev .bui,#bt.mmqa-prev .mmr,#bt.mmqa-prev .gow,#bt.mmqa-prev #go{visibility:hidden!important}',
    ].join('\n');
    doc.head.appendChild(s);
  }
  function syncSwitch() {
    if (!ENABLED || !doc || !doc.body) return;
    const w = !ST.on && !doc.getElementById('bt') && where();
    let b = doc.getElementById('mmqa-sw');
    if (!w) { if (b) b.remove(); return; }
    if (!b) {
      style(); b = doc.createElement('button'); b.id = 'mmqa-sw'; b.type = 'button'; b.setAttribute('data-nsfx', '1');
      b.innerHTML = '<span>QA：全モンスター<br>・全技試遊</span><b>OFF</b>'; b.setAttribute('aria-label', 'QA：全モンスター・全技試遊 OFF（押すと ON）');
      b.addEventListener('click', (e) => { e.stopPropagation(); on(where()); });
      doc.body.appendChild(b);
    }
  }

  // ---- ON／OFF ----
  function on(from) {
    if (!ENABLED || ST.on) return false;
    const S = G('S'); if (!S) return false;
    ST.snap = JSON.stringify(S); ST.from = from || where() || 'ranch'; ST.on = true; ST.sel = null;
    guardStorage(true); syncSwitch(); show();
    return true;
  }
  function off() {
    if (!ST.on) return false;
    const snap = ST.snap; hideBar(); const v = doc && doc.getElementById('mmqa'); if (v) v.remove();
    const cmp = doc && doc.getElementById('cmp'); if (cmp) cmp.remove();
    try { (0, eval)('S=JSON.parse(' + JSON.stringify(snap) + ')'); } catch (e) {}
    ST.on = false; ST.snap = null; ST.battling = false; ST.prev = false; guardStorage(false);
    const from = ST.from; ST.from = null;
    try { if (from === 'basecamp' && G('S') && G('S').m) G('fmScr')(); else G('farm')(); } catch (e) { try { G('lobby')(); } catch (er) {} }
    syncSwitch();
    return true;
  }

  // ---- 試遊の画面 ----
  function show() {
    if (!doc) return; style();
    let v = doc.getElementById('mmqa');
    if (v && v.style.display !== 'none' && v.firstChild) return;   // もう出ている（QA 試合の終わりに重ねて呼ばれても描き直さない＝開いた詳細を消さない）
    if (!v) { v = doc.createElement('div'); v.id = 'mmqa'; v.setAttribute('role', 'dialog'); v.setAttribute('aria-label', 'QA 試遊モード'); doc.body.appendChild(v); }
    v.style.display = '';
    render();
  }
  function render() {
    const v = doc.getElementById('mmqa'); if (!v) return;
    const cat = catalog(), x = cat[ST.mon] || cat[0];
    const sum = (mv) => mv.status === 'battle' ? '実戦可能' : mv.status === 'preview' ? '技アニメのプレビュー' : '未実装／要仕様確認';
    const monNote = x.key === 'jiol' ? '技の性能が未決＝実戦は無し（技アニメのコマのプレビューだけ）' : x.key === 'flurene' ? '未解禁・技の性能と技アニメは未承認＝静止カードと絵の確認だけ（未実装／要仕様確認）' : x.key === 'regnas' ? 'ライバル専用のモンスター＝QA だけの貸与（本番では使えない）' : '全10技を QA 試合で確認できる';
    v.innerHTML = `<div class="qh"><b>QA モード：全モンスター・全技試遊（ON）</b><small>試遊専用・通常のセーブには保存しません（OFF または再読み込みで元どおり）</small><button class="qoff" type="button" data-nsfx="1">QA を OFF にして通常へ戻る</button></div>`
      + `<div class="qtabs" role="tablist">${cat.map((c, i) => `<button class="qtab${i === ST.mon ? ' on' : ''}" type="button" data-i="${i}" data-nsfx="1" role="tab" aria-selected="${i === ST.mon}"><img src="${esc(c.img)}" alt="">${esc(c.name)}<i>${c.moves.filter((m) => m.status === 'battle').length ? '実戦' : c.key === 'jiol' ? 'プレビュー' : '静止画'}</i></button>`).join('')}</div>`
      + `<div class="qbody"><div class="qmon" data-key="${esc(x.key)}"><img src="${esc(x.img)}" alt=""><div><b>${esc(x.name)}${x.note ? `<small style="display:inline;margin-left:6px">${esc(x.note)}</small>` : ''}</b><small>${esc(monNote)}</small></div><button class="qbt qcmp" type="button" data-nsfx="1">比較画面を確認</button></div>`
      + `<div class="qgrid">${x.moves.map((mv, i) => `<button class="qcard${ST.sel === i ? ' on' : ''}" type="button" data-n="${i}" data-status="${mv.status}" data-nsfx="1"><img src="${esc(mv.src)}" alt="" loading="lazy" decoding="async"><b>${String(mv.no).padStart(2, '0')} ${esc(mv.name)}</b><span class="qst ${mv.status}">${sum(mv)}</span></button>`).join('')}</div></div>`;
    v.querySelector('.qoff').onclick = () => off();
    v.querySelectorAll('.qtab').forEach((b) => { b.onclick = () => { ST.mon = +b.dataset.i; ST.sel = null; render(); }; });
    v.querySelectorAll('.qcard').forEach((b) => { b.onclick = () => { ST.sel = +b.dataset.n; detail(); }; });
    v.querySelector('.qcmp').onclick = () => compare(x, null);
  }
  function detail() {
    const v = doc.getElementById('mmqa'); if (!v) return;
    const x = catalog()[ST.mon], mv = x && x.moves[ST.sel]; if (!mv) return;
    const old = v.querySelector('.qdet'); if (old) old.remove();
    const d = doc.createElement('div'); d.className = 'qdet';
    const stat = mv.type === 'support' ? '補助技（威力なし）' : mv.power != null ? `威力 ${mv.power}／命中 ${mv.accuracy}／クリ ${mv.critical}` : '性能：未決（データなし）';
    const act = mv.status === 'battle' ? '<button class="qgo" type="button" data-nsfx="1">この技で QA 試合</button>' : mv.status === 'preview' ? '<button class="qgo" type="button" data-nsfx="1">技アニメを再生（QA 画面）</button>' : '';
    const pics = x.key === 'flurene' ? `<div class="qpics"><figure><img src="${esc(x.img)}" alt="">正式立ち絵</figure><figure><img src="${esc(x.idle)}" alt="">バトル待機絵</figure><figure><img src="${esc(root.MMCMP ? root.MMCMP.src(5) : '')}" alt="">比較画面の絵</figure></div>` : '';
    const what = mv.status === 'battle' ? 'ルーレットの6枠をすべてこの技にして、テスト相手（ランク E の練習試合の相手・ソラモ）と戦います。勝敗・G・ランクは保存されません。'
      : mv.status === 'preview' ? 'ジオルの技は性能（威力・命中など）が未決のため実戦はありません。バトル画面で技アニメのコマだけを再生します（判定・ダメージなし）。'
        : '未実装／要仕様確認：フルーネの技は性能・技アニメが未承認のため、静止カードだけを確認できます（実戦・技アニメはありません）。';
    d.innerHTML = `<div><img class="big" src="${esc(mv.src)}" alt=""><h3>${String(mv.no).padStart(2, '0')} ${esc(mv.name)}</h3><span class="qst ${mv.status}">${mv.status === 'battle' ? '実戦可能' : mv.status === 'preview' ? '技アニメのプレビュー（実戦不可）' : '未実装／要仕様確認'}</span><p>${esc(stat)}${mv.desc ? '<br>' + esc(mv.desc) : ''}</p><p>${esc(what)}</p>${pics}<div class="qrow">${act}<button class="qno" type="button" data-nsfx="1">閉じる</button></div></div>`;
    v.appendChild(d);
    d.querySelector('.qno').onclick = () => d.remove();
    d.addEventListener('click', (e) => { if (e.target === d) d.remove(); });
    const g = d.querySelector('.qgo'); if (g) g.onclick = () => { d.remove(); if (mv.status === 'battle') compare(x, mv); else preview(x, mv); };
  }

  // ---- QA の個体（控えた S には入れない・ページの中だけ） ----
  function makeMon(sp) {
    const inf = info(sp); if (!inf) return null;
    const m = { sp, name: inf.name, age: 0, span: 30, h: 0, rk: 0, fa: 0, st: 0, last: null, sk: [], eq: [-1, -1, -1, -1, -1, -1], qa: true };
    KS.forEach((k) => { m[k] = inf.base[k] | 0; });
    try { root.MMP7 && root.MMP7.initProgForNew(m); } catch (e) {}
    try { root.MMP8 && root.MMP8.initIndividual(G('S'), m); } catch (e) {}
    m.speed = inf.speed; m.name = inf.name;
    return m;
  }
  const FOE = Object.freeze({ sp: 0, rank: 0 });   // 安全なテスト相手：ランク E の練習試合の相手（能力はランク E の一律の値）・種族はソラモ
  function foeSide() { const v = (root.MMP8L && root.MMP8L.PROVISIONAL_OPPONENT_STAT[FOE.rank]) || 70, o = { sp: FOE.sp }; KS.forEach((k) => { o[k] = v; }); return o; }
  /** 比較画面（QA）。mv があれば「対戦開始」で QA 試合、無ければ確認だけ（閉じて一覧へ） */
  function compare(x, mv) {
    if (!root.MMCMP) { if (mv) battle(x, mv); return; }
    const side = (o, name) => { const st = {}; KS.forEach((k) => { st[k] = Math.max(0, (o && o[k]) | 0); }); return { sp: o.sp, name, stats: st, skill: skillName(o.sp) }; };
    const me = makeMon(x.sp) || Object.assign({ sp: x.sp }, (info(x.sp) || {}).base);
    const v = doc.getElementById('mmqa'); if (v) v.style.display = 'none';
    const ui = root.MMCMP.overlay({ bg: (root.MMARENA && root.MMARENA.fieldSrc && root.MMARENA.fieldSrc(1)) || '', sub: mv ? `QA 試遊：${mv.name}` : 'QA 試遊：比較画面の確認', me: side(me, x.name), op: side(foeSide(), 'テスト相手') });
    ui.el.classList.add('mmqa-cmp');
    const back = doc.createElement('button'); back.type = 'button'; back.textContent = '◀ QA 一覧へ'; back.setAttribute('data-nsfx', '1');
    back.style.cssText = 'position:absolute;z-index:9;left:8px;top:calc(env(safe-area-inset-top,0px) + 74px);padding:6px 10px;border:2px solid #ffde59;border-radius:9px;background:#8c0d24;color:#fff;font:800 12px/1 "Noto Sans JP",sans-serif';
    back.onclick = () => { ui.close(0); show(); };
    ui.el.appendChild(back);
    ui.pressed.then(() => { if (mv) { battle(x, mv); if (doc.getElementById('bt')) setTimeout(() => ui.close(), 60); else { ui.close(0); show(); } } else { ui.close(); show(); } });
  }
  const skillName = (sp) => (root.MMCMP && root.MMCMP.skillName ? root.MMCMP.skillName(sp) : '');
  function wrapAfter() {
    const A = root.after; if (typeof A !== 'function' || A.__mmqa) return;
    const W = function () { if (ST.on && ST.battling) { ST.battling = false; ST.prev = false; hideBar(); setTimeout(show, 0); return undefined; } return A.apply(this, arguments); };
    W.__mmqa = true; root.after = W;
  }
  function start(m, prev) {
    const S = G('S'); if (!S || !m) return false;
    // fight() は「戦闘前の記録（m.raise.battle）」がある呼び出しだけを動かす＝QA の個体（控えた S には無い・ページの中だけ）に練習試合の記録を直接持たせる（MMP8.beginBattle は Chapter の中の遭遇だけ）
    m.raise = m.raise || {}; m.raise.battle = { kind: 'practice', rank: FOE.rank, done: false, qa: true, snap: { g: S.g, wins: S.wins, br: S.br, rk: m.rk, fa: m.fa, st: m.st } };
    S.m = m; ST.battling = true; ST.prev = !!prev; wrapAfter();
    const v = doc.getElementById('mmqa'); if (v) v.style.display = 'none';
    try { G('battleDress')({ rank: FOE.rank, label: 'QA 試遊', name: 'テスト相手' }); } catch (e) {}
    try { G('battleFoeOnce')(FOE.sp); } catch (e) {}
    try { (0, eval)('TB_SKIP_INTRO=true'); setTimeout(() => { try { (0, eval)('TB_SKIP_INTRO=false'); } catch (e) {} }, 4000); } catch (e) {}
    try { G('fight')(FOE.rank); } catch (e) { ST.battling = false; show(); return false; }
    try { G('battleDressDom')(); } catch (e) {}
    return true;
  }
  function battle(x, mv) {
    const m = makeMon(x.sp); if (!m || mv.slot == null) return false;
    m.sk = [mv.slot]; m.eq = [mv.slot, mv.slot, mv.slot, mv.slot, mv.slot, mv.slot];   // QA だけ：6枠すべて選んだ技（MISS の枠は従来どおり）
    const ok = start(m, false); if (ok) bar(`QA：${mv.name}`, []); return ok;
  }
  function preview(x, mv) {
    const m = makeMon(x.sp); if (!m) return false;
    m.sk = [0]; m.eq = [0, 0, 0, 0, 0, 0];   // ルーレット・STOP は隠す（技は使わない）＝技アニメのコマを順に見せるだけ
    if (!start(m, true)) return false;
    const play = (no) => { try { root.MM25D && root.MM25D.preview(x.key, no, 0); } catch (e) {} };
    const wait = () => { const b = doc.getElementById('bt'); if (!b) return void setTimeout(wait, 80); b.classList.add('mmqa-prev'); };
    wait();
    bar(`QA：${x.name}の技アニメ`, x.moves.map((v) => ({ t: String(v.no).padStart(2, '0'), f: () => play(v.no), cur: v.no === mv.no })));
    setTimeout(() => play(mv.no), 1600);
    return true;
  }
  function bar(title, btns) {
    hideBar(); style();
    const d = doc.createElement('div'); d.id = 'mmqa-bar'; if (!btns.length) d.classList.add('top');
    d.innerHTML = `<span>${esc(title)}</span>`;
    btns.forEach((b) => { const e = doc.createElement('button'); e.type = 'button'; e.textContent = b.t; e.setAttribute('data-nsfx', '1'); if (b.cur) e.style.background = '#c27a12'; e.onclick = (ev) => { ev.stopPropagation(); b.f(); }; d.appendChild(e); });
    const q = doc.createElement('button'); q.type = 'button'; q.textContent = 'QA 一覧へ'; q.setAttribute('data-nsfx', '1'); q.onclick = (ev) => { ev.stopPropagation(); endBattle(); }; d.appendChild(q);
    doc.body.appendChild(d);
  }
  function hideBar() { const d = doc && doc.getElementById('mmqa-bar'); if (d) d.remove(); }
  /** QA 試合を終える：降参（2度押し）→ 試合を進める STOP → 「もどる」（いずれも既存のボタンを押すだけ） */
  function endBattle() {
    if (!ST.on) return;
    const sur = doc.getElementById('sur'); let n = 0;
    const step = () => {
      const bt = doc.getElementById('bt'); if (!bt || !ST.battling) { if (ST.on && !doc.getElementById('bt')) { ST.battling = false; hideBar(); show(); } return; }
      if (n < 2 && sur) { sur.click(); n++; return void setTimeout(step, 460); }
      const go = doc.getElementById('go'); if (go && !go.disabled) go.click();
      if (++n < 120) setTimeout(step, 400);
    };
    step();
  }

  // ---- 起動 ----
  if (ENABLED && doc) {
    const boot = () => {
      style();
      const app = doc.getElementById('app');
      const mo = new MutationObserver(() => syncSwitch());
      mo.observe(doc.body, { childList: true, subtree: false });
      if (app) mo.observe(app, { childList: true });
      syncSwitch();
    };
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
  }

  root.MMQA = Object.freeze({
    ENABLED, MONS, SAVE_KEY_RE, catalog, counts, statusOf,
    on, off, isOn: () => ST.on, active: () => ST.on, battling: () => ST.battling, snapshot: () => ST.snap,
    select: (i) => { ST.mon = Math.max(0, Math.min(5, i | 0)); ST.sel = null; render(); }, battle: (i, no) => { if (!ST.on) return false; const x = catalog()[i]; const mv = x && x.moves.find((v) => v.no === no); return x && mv ? (mv.status === 'battle' ? battle(x, mv) : mv.status === 'preview' ? preview(x, mv) : false) : false; },
    endBattle, makeMon, FOE,
  });
})(typeof window !== 'undefined' ? window : globalThis);
