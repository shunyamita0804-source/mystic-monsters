// 2026-10-15：QA 試遊モード `MMQA`（ZIP「Mismon_CompareScreen_And_QA_Instructions_20261015」の C）。
//  ・URL に ?mmQaTrial=1 を付けたときだけ、ベースキャンプと牧場に『QA：全モンスター・全技試遊 ON/OFF』の切り替えを出す（普段の URL では何も出さない・何も動かない）。
//  ・ON：今のセーブ（S）をページの中に控え、通常のセーブへ一切書かない（index.html の save() は何もしない＋localStorage のセーブのキー mr4… への書き込みを止める）。
//    試遊専用の画面に 6体（ソラモ・ガウル・ノビトン・ジオル・レグナス〔QA だけの貸与〕・フルーネ〔未解禁〕）×各10技＝60 の技カードを並べる。
//    実戦できる技（技の番号 SK があるもの＝ソラモ・ガウル・ノビトン・レグナス・ジオル〔2026-10-15 正式 SK 40〜49〕）は「この技で QA 試合」＝ルーレットの6枠をすべてその技にして、
//    安全なテスト相手（ランク E の練習試合の相手・ソラモ）と戦う（戦闘の計算・技の性能・ルーレットは変えない）。
//    ジオル＝2026-10-15 から正式10技（承認の性能表・SK 40〜49）で実戦できる（旧：技アニメのコマのプレビューだけ）。
//    フルーネ＝技の性能が未承認＝実戦は無し。2026-10-15：技アニメ 77枚（本体 42＋効果 35）のプレビュー（MM25D.preview('flurene', No)）と
//      2.5D 歩行 front・back 各8コマの確認（「歩行を確認」）。効果の無い技（09 は2枚・10 は0枚）は『FX追加待ち』と出す（作らない）。
//      プレビューの間だけ、ページの中の IMG[5]・MMARENA.IDLE[5] にフルーネの絵を入れる（終わり・OFF で消す＝本編のデータ・セーブは変えない）。
//  ・OFF：控えたセーブへ戻して（ページの中の S を元どおり）通常の画面（切り替えた所＝牧場／ベースキャンプ）へ。再読み込みすると必ず OFF（QA の状態は保存しない）。
//  ・通常の牧場の数・所有・市場・合体・図鑑・技の習得・G・報酬・チケット・順位・記録は増減しない（すべて控えた S ごと捨てる）。
(function (root) {
  'use strict';
  const doc = root.document;
  const qs = (() => { try { return new URLSearchParams(root.location && root.location.search || ''); } catch (e) { return null; } })();
  const ENABLED = !!(qs && qs.get('mmQaTrial') === '1');
  // 2026-10-16：試遊の入口（trial.html）から直接 QA の画面へ＝?mmQaTrial=1&qaDirect=1（開始画面の上に QA を開く・qaMon=0〜5 で最初のタブ）。普段の URL では動かない
  const DIRECT = ENABLED && qs.get('qaDirect') === '1';
  const DIRECT_MON = (() => { const n = qs && parseInt(qs.get('qaMon'), 10); return n >= 0 && n <= 8 ? n : 0; })();
  // 6体（番号は表示の順。sp＝バトルの絵の番号＝IMG の番号。フルーネの 5 は予約＝バトルの絵は無い）
  const MONS = Object.freeze([
    Object.freeze({ sp: 0, key: 'solamo' }), Object.freeze({ sp: 1, key: 'gauru' }), Object.freeze({ sp: 2, key: 'nobiton' }),
    Object.freeze({ sp: 3, key: 'jiol' }), Object.freeze({ sp: 4, key: 'regnas' }), Object.freeze({ sp: 5, key: 'flurene' }),
    Object.freeze({ sp: 6, key: 'razuck' }),   // 2026-10-17：ラズック（登録のみ・正式10技＝SK 60〜69 で実戦可能・絵は参考画像の派生と制作候補＝QA だけ）
    Object.freeze({ sp: 7, key: 'kalshell' }),
    Object.freeze({ sp: 8, key: 'myurol' }),   // 2026-10-19：ミュロル（登録のみ・入手方法は未決・正式10技＝SK 80〜89 で実戦可能・正式採用の絵と声＝QA だけ）   // 2026-10-18：カルシェル（登録のみ・入手方法は未決・正式10技＝SK 70〜79 で実戦可能・正式採用の絵と声＝QA だけ）
  ]);
  const KS = ['li', 'po', 'in', 'hi', 'ev', 'de'];
  const ST = { on: false, snap: null, from: null, mon: 0, sel: null, battling: false, prev: false, wrap: false, set: null, rem: null, flr: null };
  const FL = () => root.MMFLMV_DATA || null;   // フルーネの技アニメ（js/battle/flurene-moves-data.js）
  /** フルーネの技アニメの枚数（本体・効果）。効果が本体より少ない技＝『FX追加待ち』 */
  function animInfo(key, no) {
    if (key === 'razuck') { const z = root.MMRZMV_DATA && root.MMRZMV_DATA[no]; return z ? { bodies: z.bodies, effects: z.effects, wait: false } : null; }   // 2026-10-17：ラズック（統合便 81枚）
    if (key === 'myurol') { const z = root.MMMYMV_DATA && root.MMMYMV_DATA[no]; return z ? { bodies: z.bodies, effects: z.effects, hits: z.hitEffects, stage: !!z.stage, wait: false } : null; }   // 2026-10-19：ミュロル（正式納品 150枚＝本体・技エフェクト・命中エフェクト）
    if (key === 'kalshell') { const z = root.MMKSMV_DATA && root.MMKSMV_DATA[no]; return z ? { bodies: z.bodies, effects: z.effects, wait: false } : null; }   // 2026-10-18：カルシェル（正式納品 98枚・空でない効果 35）
    if (key !== 'flurene') return null;
    if (no === 9 && root.MMRD) return { rd: true, bodies: root.MMRD.FRAMES.length, effects: 0, wait: false };   // 2026-10-16：09 はルートドレインの補修版10コマ（本体と効果が1枚）＝旧「生命のしずく」の枚数は出さない
    const d = FL() && FL()[no]; if (!d) return null;
    // 2026-10-16（バトル最終統合）：技10 の専用の根4＋命中3（js/battle/move-tune-1015.js の MOVES の addFx）も数える
    const T = root.MMTUNE, t = T && T.keyOf && T.MOVES[T.keyOf(d, d.dir)], add = t && t.addFx ? t.addFx.filter((f) => /^F\d+_D\d+$/.test(f.src)).length : 0, ef = d.effects + add;
    return { bodies: d.bodies, effects: ef, wait: ef < d.bodies && !add };
  }
  const animTxt = (a) => a ? (a.rd ? `ルートドレイン ${a.bodies}コマ（補修版）` : `本体 ${a.bodies}・効果 ${a.effects}${a.hits != null ? `・命中 ${a.hits}` : ''}${a.stage ? '（舞台の座標＝津波 V2）' : ''}${a.wait ? '（FX追加待ち）' : ''}`) : '';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const G = (n) => { try { return (0, eval)(n); } catch (e) { return undefined; } };   // index.html の大域（S・SK・fight など）を呼ぶ時点で読む
  const M = () => root.MMP10M;
  const SAVE_KEY_RE = /^mr4(v6|s\d+t?|ng)?$/;   // 通常のセーブのキー（mr4v6・旧 mr4・スロット mr4s1〜3・保存時刻 mr4s1t・新しいゲームの印 mr4ng）。音の設定 mr4a などは対象外

  // ---- データ ----
  function info(sp) {
    const m = M(); if (!m) return null;
    if (sp === 4) { const r = m.rivalMonster('regnas'); return r && { name: r.name, base: r.base, speed: r.speed, img: r.image && r.image.src, idle: './assets/battle/idle/idle_regnas.webp', note: '貸与（QA だけ）' }; }
    if (sp === 5) { const f = m.pendingSpecies('flurene'); return f && { name: f.name, base: f.base, speed: f.speed, img: f.image && f.image.src, idle: f.battleIdle && f.battleIdle.src, note: '未解禁（QA の確認だけ）' }; }
    if (sp === 6) { const f = m.pendingSpecies('razuck'); return f && { name: f.name, base: f.base, speed: f.speed, img: f.image && f.image.src, idle: f.battleIdle && f.battleIdle.src, note: '未解禁（QA の確認だけ・絵は参考画像の派生）' }; }
    if (sp === 8) { const f = m.pendingSpecies('myurol'); return f && { name: f.name, base: f.base, speed: f.speed, img: f.image && f.image.src, idle: f.battleIdle && f.battleIdle.src, note: '未解禁（入手方法は未定・QA の確認だけ）' }; }   // 2026-10-19 ミュロル
    if (sp === 7) { const f = m.pendingSpecies('kalshell'); return f && { name: f.name, base: f.base, speed: f.speed, img: f.image && f.image.src, idle: f.battleIdle && f.battleIdle.src, note: '未解禁（入手方法は未定・QA の確認だけ）' }; }   // 2026-10-18 カルシェル
    const s = m.byId(sp); return s && { name: s.name, base: s.base, speed: s.speed, img: s.image && s.image.src, idle: null, note: '' };
  }
  function moveData(key) {
    const m = M(); if (!m) return [];
    if (key === 'regnas') { const r = m.rivalMonster('regnas'); return (r && r.moves && r.moves.list) || []; }
    if (key === 'flurene') { const f = m.pendingSpecies('flurene'); return (f && f.moves) || []; }
    const L = m.movesOf(key); return Array.isArray(L) ? L : (L && L.list) || [];
  }
  /** 技の状態：battle＝実戦可能（SK の番号があり技のデータがある）／preview＝技アニメのコマのプレビューだけ（フルーネ。ジオルは SK が入る前だけ）／static＝静止カードだけ（技アニメのデータが無いとき） */
  function statusOf(key, slot) {
    const SK = G('SK');
    if (slot != null && SK && SK[slot]) return 'battle';
    if (key === 'jiol') return 'preview';
    if (key === 'flurene' && FL() && slot == null) return 'preview';
    return 'static';
  }
  /** 7体×10技の一覧（テスト・画面の共通。2026-10-17：ラズックを追加＝70枠） */
  function catalog() {
    const C = root.MMMVCARD;
    return MONS.map((x) => {
      const inf = info(x.sp) || {}, md = moveData(x.key), cards = C ? C.list(x.key) : [];
      const moves = cards.map((c) => {
        const d = md.find((v) => v.no === c.no) || {};
        // 2026-10-16：フルーネ技09「ルートドレイン」は QA だけ SK 58（js/battle/rules.js）＝実戦で確認できる。名前は登録の新しい名前（カードの絵は旧「生命のしずく」のまま＝新しいカードは素材待ち）
        const fl = x.key === 'flurene' && G('SK') && G('SK')[50 + c.no - 1] ? 50 + c.no - 1 : null, slot = c.slot != null ? c.slot : fl;
        return { no: c.no, id: c.id, name: x.key === 'flurene' ? d.name || c.name : c.name || d.name, slot, src: c.src, status: statusOf(x.key, slot), anim: animInfo(x.key, c.no), type: d.type || null,
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
      '#mmqa .qstg{display:block;width:100%;margin-top:6px;min-height:44px;padding:8px 10px;border:2px solid #fff0c0;border-radius:10px;background:linear-gradient(180deg,#fbe39a,#c58d2a);color:#3b2406;font:900 14px/1.2 "Noto Sans JP",sans-serif;cursor:pointer}',
      '#mmqa-entry{position:fixed;z-index:850;right:8px;top:calc(env(safe-area-inset-top,0px) + 62px);padding:9px 12px;border:2px solid #ffde59;border-radius:12px;background:repeating-linear-gradient(135deg,#b3122e 0 10px,#8c0d24 10px 20px);color:#fff;font:900 13px/1.2 "Noto Sans JP",sans-serif;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,.4)}',
      '#mmqa .qoff{margin-top:6px;padding:7px 14px;border:2px solid #fff;border-radius:10px;background:#0b1636;color:#fff;font:800 13px/1 "Noto Sans JP",sans-serif;cursor:pointer}',
      '#mmqa .qtabs{flex:none;display:grid;grid-template-columns:repeat(6,1fr);gap:4px;padding:6px}',
      '#mmqa .qtab{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 2px;border:1.5px solid rgba(216,178,90,.5);border-radius:10px;background:#13224f;color:#fff3d6;font:700 10px/1.15 "Noto Sans JP",sans-serif;cursor:pointer;min-width:0}',
      '#mmqa .qtab img{width:100%;max-width:56px;aspect-ratio:1;object-fit:contain}',
      '#mmqa .qaudg{display:grid;grid-template-columns:repeat(2,1fr);gap:5px}', '#mmqa .qaudg .qbt{display:flex;flex-direction:column;align-items:flex-start;text-align:left;font-size:11px;line-height:1.3;padding:6px}', '#mmqa .qaudg .qbt small{font-size:9.5px;opacity:.8}', '#mmqa .qaudp{overflow:auto}',
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
      '#mmqa .qfx{display:block;font-size:10px;color:#ffd27a}',
      '#mmqa .qwalk{position:fixed;inset:0;z-index:3;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:10px;background:rgba(4,8,22,.88)}',
      '#mmqa .qwalk.q7{justify-content:flex-start;overflow:auto;color:#fff3d6}', '#mmqa .qwalk.q7.light{background:rgba(232,236,226,.97);color:#13224f}', '#mmqa .q7g{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;width:100%;max-width:460px}', '#mmqa .q7c{margin:0;text-align:center;font-size:10px}', '#mmqa .q7c>div{position:relative;aspect-ratio:1;border:1px solid rgba(216,178,90,.4);border-radius:8px}', '#mmqa .q7c img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0}', '#mmqa .q7c img.on{opacity:1}', '#mmqa .q7c.fl img{transform:scaleX(-1)}',
      '#mmqa .qwst{position:relative;width:min(92vw,360px);height:min(46dvh,330px);border:2px solid #d8b25a;border-radius:12px;overflow:hidden;background:#1b2033}',
      '#mmqa .qwst.light{background:#e8e2d0}',
      '#mmqa .qwst i{position:absolute;left:8%;right:8%;bottom:14%;height:2px;background:rgba(255,222,89,.7)}',
      '#mmqa .qwbox{position:absolute;left:50%;bottom:14%;width:0;height:58%}',
      '#mmqa .qwbox img{position:absolute;left:50%;transform:translateX(-50%);max-width:none;pointer-events:none}',
      '#mmqa .qwbox img.qwf{opacity:0}#mmqa .qwbox img.qwf.on{opacity:1}',
      '#mmqa .qwbox img.qws{opacity:.38;filter:none}#mmqa .qwbox img.qws[hidden]{display:none}',
      '#mmqa .qwinfo{font:800 13px/1.3 "Noto Sans JP",sans-serif;color:#fff3d6;text-align:center}',
      '#mmqa .qwbtn{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;max-width:400px}',
      '#mmqa .qwbtn button{min-height:40px;min-width:62px;padding:6px 10px;border:1.5px solid #d8b25a;border-radius:10px;background:#1d2f66;color:#fff3d6;font:800 12px/1.2 "Noto Sans JP",sans-serif;cursor:pointer}',
      '#mmqa .qwbtn button.on{background:#c27a12;color:#fff;border-color:#fff0c0}',
      '#mmqa .qwnote{max-width:400px;font-size:11px;line-height:1.5;color:#e8cf8c;text-align:center}',
    ].join('\n');
    doc.head.appendChild(s);
  }
  function syncSwitch() {
    if (!ENABLED || !doc || !doc.body) return;
    // 2026-10-16（バトル最終統合）：?mmQaTrial=1 の直リンクで開いた開始画面に『QA を開く』（押すと牧場から ON にしたのと同じ＝通常のセーブへは書かない）
    const ttl = !ST.on && !!doc.querySelector('#app>.mmtscr') && !doc.getElementById('bt');
    let en = doc.getElementById('mmqa-entry');
    if (!ttl) { if (en) en.remove(); } else if (!en) {
      style(); en = doc.createElement('button'); en.id = 'mmqa-entry'; en.type = 'button'; en.setAttribute('data-nsfx', '1'); en.textContent = 'QA を開く（全モンスター・全技）';
      en.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); try { root.MMAUDIO && root.MMAUDIO.stopBgm({ fade: 'quick' }); } catch (er) {} on('ranch'); });
      doc.body.appendChild(en);
    }
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
    ST.on = false; ST.snap = null; ST.battling = false; ST.prev = false; guardStorage(false); unlendFlurene();
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
    const monNote = x.key === 'myurol' ? '未解禁（入手方法・出現場所は未定＝仕様マスターの「Chapter2 野生」は想定だけ）。正式10技（2026-10-19 納品の仕様マスター）を QA 試合で確認できる。No.10 マリンストリームは津波 V2（舞台の座標で背後から押し寄せる）。絵（2.5D・待機・表情6・技カード10・技アニメ・対戦表・VS・歩行 5方向）と声2本は正式採用済み。種族表示名「水棲種」は要確認・プロフィール画像は未納' : x.key === 'kalshell' ? '未解禁（入手方法・出現場所は未定＝ユーザーが後日決める）。正式10技（2026-10-18 納品の仕様マスター）を QA 試合で確認できる。絵（2.5D・待機・表情6・技カード10・技アニメ・対戦表・VS）と声2本は正式採用済み。種族表示名「甲殻種」は要確認・プロフィール画像は未納' : x.key === 'jiol' && !x.moves.some((m) => m.status === 'battle') ? '技の性能が未決＝実戦は無し（技アニメのコマのプレビューだけ）' : x.key === 'flurene' ? (FL() ? '未解禁・技の性能は未承認＝実戦は無し（技アニメのプレビューと歩行の確認だけ）' : '未解禁・技の性能と技アニメは未承認＝静止カードと絵の確認だけ（未実装／要仕様確認）') : x.key === 'regnas' ? 'ライバル専用のモンスター＝QA だけの貸与（本番では使えない）' : x.key === 'razuck' ? '未解禁・正式10技（2026-10-17 確定）を QA 試合で確認できる。絵（待機・表情・カード・対戦表・VS）は参考画像の派生と制作候補＝ユーザーの美術承認前' : '全10技を QA 試合で確認できる';
    v.innerHTML = `<div class="qh"><b>QA モード：全モンスター・全技試遊（ON）</b><small>試遊専用・通常のセーブには保存しません（OFF または再読み込みで元どおり）</small><small class="qver">版：画面 ${esc(String(G('MM_BUILD') || '?'))}／技アニメ ${esc(String((root.MMTUNE && root.MMTUNE.BUILD) || '古い版'))}${G('MM_BUILD') && root.MMTUNE && root.MMTUNE.BUILD === G('MM_BUILD') ? '' : '（一致しない＝再読み込みしてください）'}</small><button class="qstg" type="button" data-nsfx="1">▶ バトル技ステージ（1技ずつ／全10技を連続再生）</button><button class="qstg qaud" type="button" data-nsfx="1">♪ 音声の試聴（NPC ボイス 60・モンスターの鳴き声 14）</button><button class="qoff" type="button" data-nsfx="1">QA を OFF にして通常へ戻る</button></div>`
      + `<div class="qtabs" role="tablist">${cat.map((c, i) => `<button class="qtab${i === ST.mon ? ' on' : ''}" type="button" data-i="${i}" data-nsfx="1" role="tab" aria-selected="${i === ST.mon}"><img src="${esc(c.img)}" alt="">${esc(c.name)}<i>${c.moves.filter((m) => m.status === 'battle').length ? '実戦' : c.moves.some((m) => m.status === 'preview') ? 'プレビュー' : '静止画'}</i></button>`).join('')}</div>`
      + `<div class="qbody"><div class="qmon" data-key="${esc(x.key)}"><img src="${esc(x.img)}" alt=""><div><b>${esc(x.name)}${x.note ? `<small style="display:inline;margin-left:6px">${esc(x.note)}</small>` : ''}</b><small>${esc(monNote)}</small></div><div style="margin-left:auto;display:flex;flex-direction:column;gap:5px">${walkSets(x.key) ? '<button class="qbt qwk" type="button" data-nsfx="1">歩行を確認</button>' : ''}<button class="qbt qwk7" type="button" data-nsfx="1">新歩行 10-17（8方向）</button><button class="qbt qcmp" type="button" data-nsfx="1">比較画面を確認</button></div></div>`
      + `<div class="qgrid">${x.moves.map((mv, i) => `<button class="qcard${ST.sel === i ? ' on' : ''}" type="button" data-n="${i}" data-status="${mv.status}" data-nsfx="1"><img src="${esc(mv.src)}" alt="" loading="lazy" decoding="async"><b>${String(mv.no).padStart(2, '0')} ${esc(mv.name)}</b><span class="qst ${mv.status}">${sum(mv)}</span>${mv.anim ? `<span class="qfx">${esc(animTxt(mv.anim))}</span>` : ''}</button>`).join('')}</div></div>`;
    v.querySelector('.qoff').onclick = () => off();
    v.querySelector('.qstg:not(.qaud)').onclick = () => stage(ST.mon, 1);
    v.querySelector('.qaud').onclick = () => audition();
    v.querySelectorAll('.qtab').forEach((b) => { b.onclick = () => { ST.mon = +b.dataset.i; ST.sel = null; render(); }; });
    v.querySelectorAll('.qcard').forEach((b) => { b.onclick = () => { ST.sel = +b.dataset.n; detail(); }; });
    v.querySelector('.qcmp').onclick = () => compare(x, null);
    const wk = v.querySelector('.qwk'); if (wk) wk.onclick = () => walk(x);
    const wk7 = v.querySelector('.qwk7'); if (wk7) wk7.onclick = () => walk7(x);
  }
  // ---- 2026-10-17：音声の試聴（QA だけ）＝有料版 NPC ボイス 60本（三伝説の「登録のみ」も qa で1本ずつ）とモンスターの鳴き声 14本を単独で再生。
  //  再生は本編と同じ経路（MMAUDIO.voice／cry・声の音量・声 OFF・ミュートに従う）。鳴き声の間隔（全体8秒・同じ子10秒）はここでは無視（force）
  function audition() {
    const v = doc.getElementById('mmqa'); if (!v) return;
    const old = v.querySelector('.qaudp'); if (old) { old.remove(); return; }
    const A = root.MMAUDIO, R = root.MMAUDIO_REGISTRY || {}, VR = R.voice || {}, CR = R.cry || {};
    const npcs = Object.keys(VR).filter((k) => /_\d{3}$/.test(k)).sort();
    const NAME = { solamo: 'ソラモ', gauru: 'ガウル', nobiton: 'ノビトン', jiol: 'ジオル', regnas: 'レグナス', flurene: 'フルーネ', razuck: 'ラズック', kalshell: 'カルシェル', myurol: 'ミュロル' };
    const d = doc.createElement('div'); d.className = 'qdet qaudp';
    const vs = A && A.voiceSettings ? A.voiceSettings() : { on: true };
    d.innerHTML = `<div><h3>音声の試聴</h3><small>声の設定：${vs.on ? 'オン' : 'オフ（設定でオンにすると鳴る）'}。iPhone では一度画面に触れてから。結果：play＝鳴った・wait＝読み込み中（すぐ鳴る）・disabled／off など＝鳴らない</small>`
      + `<h3 style="margin-top:8px">モンスターの鳴き声 14本</h3><div class="qaudg">${Object.keys(CR).map((id) => { const m = /^cry_(\w+)_(normal|sad)$/.exec(id); return m ? `<button class="qbt qcry" type="button" data-nsfx="1" data-k="${m[1]}" data-kind="${m[2]}">${esc(NAME[m[1]] || m[1])}・${m[2] === 'sad' ? '悲しみ' : '正式'}<small>gain ${CR[id].gain}</small></button>` : ''; }).join('')}</div>`
      + `<label style="display:block;margin:6px 0"><input type="checkbox" class="qcwin"${root.MM_CRY_WIN ? ' checked' : ''}> 勝ったときにも正式ボイス（QA の比較だけ・本番は無効）</label>`
      + `<h3 style="margin-top:8px">NPC ボイス ${npcs.length}本</h3><div class="qaudg">${npcs.map((id) => `<button class="qbt qnpv" type="button" data-nsfx="1" data-id="${esc(id)}">${esc(id)}${VR[id].enabled === false ? '（登録のみ）' : ''}<small>${esc(VR[id].line || '')}</small></button>`).join('')}</div>`
      + `<p class="qaudr" aria-live="polite"></p><button class="qno" type="button" data-nsfx="1">閉じる</button></div>`;
    const res = (t) => { const r = d.querySelector('.qaudr'); if (r) r.textContent = t; };
    const after = (id) => setTimeout(() => { const L = A && A.voiceLog ? A.voiceLog() : []; const e = [...L].reverse().find((x) => x.id === id); const p = A && A.playLog ? [...A.playLog()].reverse().find((x) => x.kind === 'voice' && x.name === id) : null; res(`${id}：${e ? e.result : '—'}${p ? `（${p.dur}ms・gain ${p.gain}）` : ''}`); }, 900);
    d.querySelectorAll('.qcry').forEach((b) => { b.onclick = () => { if (!A || !A.cry) return; try { A.unlock && A.unlock(); A.stopVoice && A.stopVoice(0); } catch (e) {} A.cry(b.dataset.k, b.dataset.kind, { force: true, maxWaitMs: 3000 }); after(`cry_${b.dataset.k}_${b.dataset.kind}`); }; });
    d.querySelectorAll('.qnpv').forEach((b) => { b.onclick = () => { if (!A || !A.voice) return; try { A.unlock && A.unlock(); } catch (e) {} A.voice(b.dataset.id, { qa: true, maxWaitMs: 3000 }); after(b.dataset.id); }; });
    d.querySelector('.qcwin').onchange = (e) => { root.MM_CRY_WIN = !!e.target.checked; };
    d.querySelector('.qno').onclick = () => { try { A && A.stopVoice && A.stopVoice(60); } catch (e) {} d.remove(); };
    v.appendChild(d);
  }
  function detail() {
    const v = doc.getElementById('mmqa'); if (!v) return;
    const x = catalog()[ST.mon], mv = x && x.moves[ST.sel]; if (!mv) return;
    const old = v.querySelector('.qdet'); if (old) old.remove();
    const d = doc.createElement('div'); d.className = 'qdet';
    const stat = mv.type === 'support' ? '補助技（威力なし）' : mv.power != null ? `威力 ${mv.power}／命中 ${mv.accuracy}／クリ ${mv.critical}` : '性能：未決（データなし）';
    const act = (mv.status === 'battle' ? '<button class="qgo qbt1" type="button" data-nsfx="1">この技で QA 試合</button>' : mv.status === 'preview' ? '<button class="qgo qbt1" type="button" data-nsfx="1">技アニメを再生（QA 画面）</button>' : '') + (mv.status === 'battle' || mv.status === 'preview' ? '<button class="qgo qsg1" type="button" data-nsfx="1">ステージで再生</button>' : '');
    const RX = ['01_joy', '02_surprise', '03_sad', '04_eat', '05_hit', '06_dodge'];
    if (x.key === 'razuck') { const pz = `<div class="qpics"><figure><img src="${esc(x.idle)}" alt="">バトル待機（参考画像の派生）</figure><figure><img src="${esc(root.MMCMP ? root.MMCMP.src(6) : '')}" alt="">比較画面</figure><figure><img src="./assets/tournament/icons_1015/icon_razuck.webp" alt="">対戦表（候補・RGB）</figure><figure><img src="./assets/tournament/vs_1017/vs_razuck.webp" alt="">VS（候補・RGB・左向き）</figure>${RX.map((r) => `<figure><img src="./assets/monsters/reactions_1017_razuck/${r}.webp" alt="">表情 ${r.slice(3)}（候補）</figure>`).join('')}</div>`; d.dataset.razuckPics = '1'; d.__pics = pz; }
    if (x.key === 'kalshell') { d.__pics = `<div class="qpics"><figure><img src="${esc(x.img)}" alt="">正式 2.5D 立ち絵</figure><figure><img src="${esc(x.idle)}" alt="">バトル待機絵（右向き）</figure><figure><img src="${esc(root.MMCMP ? root.MMCMP.src(7) : '')}" alt="">比較画面（待機絵から切った代替）</figure><figure><img src="./assets/tournament/icons_1015/icon_kalshell.webp" alt="">対戦表（正式・RGB）</figure><figure><img src="./assets/tournament/vs_1017/vs_kalshell.webp" alt="">VS（正式・RGB・左向き）</figure>${RX.map((r) => `<figure><img src="./assets/monsters/reactions_1012/kalshell/${r}.webp" alt="">表情 ${r.slice(3)}（正式）</figure>`).join('')}</div>`; d.dataset.kalshellPics = '1'; }   // 2026-10-18 カルシェル（正式採用の絵）
    if (x.key === 'myurol') { d.__pics = `<div class="qpics"><figure><img src="${esc(x.img)}" alt="">正式 2.5D 立ち絵</figure><figure><img src="${esc(x.idle)}" alt="">バトル待機絵（右向き）</figure><figure><img src="${esc(root.MMCMP ? root.MMCMP.src(8) : '')}" alt="">比較画面（待機絵から切った代替）</figure><figure><img src="./assets/tournament/icons_1015/icon_myurol.webp" alt="">対戦表（正式・RGB）</figure><figure><img src="./assets/tournament/vs_1017/vs_myurol.webp" alt="">VS（正式・RGB・左向き）</figure>${RX.map((r) => `<figure><img src="./assets/monsters/reactions_1012/myurol/${r}.webp" alt="">表情 ${r.slice(3)}（正式）</figure>`).join('')}</div>`; d.dataset.myurolPics = '1'; }   // 2026-10-19 ミュロル（正式採用の絵）
    const pics = x.key === 'razuck' || x.key === 'kalshell' || x.key === 'myurol' ? d.__pics : x.key === 'flurene' ? `<div class="qpics"><figure><img src="${esc(x.img)}" alt="">正式立ち絵</figure><figure><img src="${esc(x.idle)}" alt="">バトル待機絵</figure><figure><img src="${esc(root.MMCMP ? root.MMCMP.src(5) : '')}" alt="">比較画面の絵</figure></div>` : '';
    const what = mv.status === 'battle' ? 'ルーレットの6枠をすべてこの技にして、テスト相手（ランク E の練習試合の相手・ソラモ）と戦います。勝敗・G・ランクは保存されません。'
      : mv.status === 'preview' ? `${x.key === 'flurene' ? 'フルーネ' : 'ジオル'}の技は性能（威力・命中など）が未決のため実戦はありません。バトル画面で技アニメのコマだけを再生します（判定・ダメージなし）。${mv.anim ? `この技の絵＝${animTxt(mv.anim)}。${mv.anim.wait ? '効果の絵はまだ届いていません（作っていません）。' : ''}` : ''}`
        : '未実装／要仕様確認：フルーネの技は性能・技アニメが未承認のため、静止カードだけを確認できます（実戦・技アニメはありません）。';
    d.innerHTML = `<div><img class="big" src="${esc(mv.src)}" alt=""><h3>${String(mv.no).padStart(2, '0')} ${esc(mv.name)}</h3><span class="qst ${mv.status}">${mv.status === 'battle' ? '実戦可能' : mv.status === 'preview' ? '技アニメのプレビュー（実戦不可）' : '未実装／要仕様確認'}</span>${mv.anim ? `<span class="qfx">${esc(animTxt(mv.anim))}</span>` : ''}<p>${esc(stat)}${mv.desc ? '<br>' + esc(mv.desc) : ''}</p><p>${esc(what)}</p>${pics}<div class="qrow">${act}<button class="qno" type="button" data-nsfx="1">閉じる</button></div></div>`;
    v.appendChild(d);
    d.querySelector('.qno').onclick = () => d.remove();
    d.addEventListener('click', (e) => { if (e.target === d) d.remove(); });
    const g = d.querySelector('.qbt1'); if (g) g.onclick = () => { d.remove(); if (mv.status === 'battle') compare(x, mv); else preview(x, mv); };
    const g2 = d.querySelector('.qsg1'); if (g2) g2.onclick = () => { d.remove(); stage(ST.mon, mv.no); };
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
    const W = function () { if (ST.on && ST.battling) { ST.battling = false; ST.prev = false; hideBar(); unlendFlurene(); setTimeout(show, 0); return undefined; } return A.apply(this, arguments); };
    W.__mmqa = true; root.after = W;
  }
  function start(m, prev) {
    const S = G('S'); if (!S || !m) return false;
    // fight() は「戦闘前の記録（m.raise.battle）」がある呼び出しだけを動かす＝QA の個体（控えた S には無い・ページの中だけ）に練習試合の記録を直接持たせる（MMP8.beginBattle は Chapter の中の遭遇だけ）
    m.raise = m.raise || {}; m.raise.battle = { kind: 'practice', rank: FOE.rank, done: false, qa: true, snap: { g: S.g, wins: S.wins, br: S.br, rk: m.rk, fa: m.fa, st: m.st } };
    S.m = m; ST.battling = true; ST.prev = !!prev; wrapAfter(); if (m.sp >= 5) lendFlurene(m.sp); else unlendFlurene();
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
    m.speed = 10;   // QA の個体だけ：先にこちらの番＝ルーレットを隠したまま止まる（相手は動かない＝技アニメのコマに相手の攻撃が重ならない）
    if (!start(m, true)) return false;
    const play = (no) => { try { root.MM25D && root.MM25D.preview(x.key, no, 0); } catch (e) {} };
    const wait = () => { const b = doc.getElementById('bt'); if (!b) return void setTimeout(wait, 80); b.classList.add('mmqa-prev'); };
    wait();
    bar(`QA：${x.name}の技アニメ`, x.moves.map((v) => ({ t: String(v.no).padStart(2, '0') + (v.anim && v.anim.wait ? '*' : ''), f: () => play(v.no), cur: v.no === mv.no })).concat(x.key === 'flurene' && x.moves.some((v) => v.anim && v.anim.wait) ? [{ t: '* FX追加待ち', f: () => {} }] : []));
    setTimeout(() => play(mv.no), 1600);
    return true;
  }
  /** 2026-10-16（バトル最終統合）：常設バトル QA のステージ（js/qa/battle-stage.js の MMQAS）。全モンスター・全技を1つの画面で */
  function stage(mon, no) { if (!ST.on || !root.MMQAS) return false; const v = doc.getElementById('mmqa'); const ok = root.MMQAS.open(mon, no); if (ok && v) v.style.display = 'none'; return ok; }
  /** QA のプレビューの間だけ、フルーネ（予約番号 5）のバトルの絵をページの中に置く（IMG[5]・MMARENA.IDLE[5]）。終わり・OFF で元へ */
  //  2026-10-17：ラズック（予約番号 6）も同じ（sp を指定。省略＝5 と 6 の両方＝ステージで相手にも出せる）
  const LEND_IDLE = { 5: 'idle_flurene', 6: 'idle_razuck', 7: 'idle_kalshell', 8: 'idle_myurol' };   // 2026-10-18：7＝カルシェル・2026-10-19：8＝ミュロル
  function lendFlurene(sp) {
    const IMG = G('IMG'), A = root.MMARENA, sps = sp ? [sp] : [5, 6, 7, 8];
    const r = ST.flr || { len: IMG ? IMG.length : 0, img: [], idle: [] };
    sps.forEach((k) => { const inf = info(k); if (!inf) return;
      if (IMG && !Object.isFrozen(IMG) && IMG[k] === undefined) { IMG[k] = inf.img; r.img.push(k); }
      if (A && A.IDLE && !Object.isFrozen(A.IDLE) && A.IDLE[k] === undefined) { A.IDLE[k] = LEND_IDLE[k]; r.idle.push(k); } });
    ST.flr = r;
  }
  function unlendFlurene() {
    const r = ST.flr; if (!r) return; ST.flr = null;
    const IMG = G('IMG'), A = root.MMARENA;
    if (r.img.length && IMG) IMG.length = r.len;
    if (A && A.IDLE) r.idle.forEach((k) => { delete A.IDLE[k]; });
  }
  /** 歩行の確認（ch1a.js の monsterSprites[種族].dirs の front・back を、本編の盤と同じ fps・大きさ（h）・足（foot）で再生する。止めると front の1コマ目＝本編の盤の停止の姿） */
  function walkSets(key) {
    try { const c = root.MMCH && root.MMCH.getConfig && root.MMCH.getConfig(1), sp = c && c.monsterSprites && c.monsterSprites[key]; return (key === 'flurene' || key === 'kalshell') && sp && sp.dirs && sp.dirs.front && sp.dirs.back ? sp.dirs : null; } catch (e) { return null; }   // 2026-10-18：カルシェル（正式納品の front・back 8コマ）も
  }
  const WK = { t: null };
  // ---- 歩行（本編と同じ walk_1018・7体×5方向×4コマ）の確認（QA だけ・開いたときにその種族の20コマだけ読む）。
  //  8方向＝5方向＋左右反転（左・左斜め後ろ・左斜め前）
  function walk7(x) {
    const v = doc.getElementById('mmqa'); if (!v) return;
    const old = v.querySelector('.qwalk'); if (old) old.remove();
    const B = ((root.MMQAW && root.MMQAW.BASE7) || './assets/monsters/walk_1018/') + x.key + '/';   // 本編と同じ素材（walk_1018）
    const CELLS = [['back', 0, '後ろ'], ['backd', 0, '右斜め後ろ'], ['side', 0, '右'], ['frontd', 0, '右斜め前'], ['front', 0, '前'], ['frontd', 1, '左斜め前（反転）'], ['side', 1, '左（反転）'], ['backd', 1, '左斜め後ろ（反転）']];
    let OLD = null; try { const c = root.MMCH && root.MMCH.getConfig && root.MMCH.getConfig(1), sp = c && c.monsterSprites && c.monsterSprites[x.key]; OLD = sp && sp.dirs ? ['front', 'back'].filter((k) => sp.dirs[k] && sp.dirs[k].frames).map((k) => [k, sp.dirs[k].frames]) : null; } catch (e) {}
    const cell = (d, fl, lab) => `<figure class="q7c${fl ? ' fl' : ''}"><div>${[1, 2, 3, 4].map((i) => `<img data-i="${i - 1}" src="${esc(B + d + '_' + i + '.webp')}" alt="" decoding="async">`).join('')}</div><figcaption>${esc(lab)}</figcaption></figure>`;
    const oldCell = ([k, fr]) => `<figure class="q7c old"><div>${fr.map((f, i) => `<img data-i="${i}" src="${esc(f)}" alt="" decoding="async">`).join('')}</div><figcaption>旧 ${k}（${fr.length}コマ）</figcaption></figure>`;
    const w = doc.createElement('div'); w.className = 'qwalk q7'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', '新歩行の確認');
    w.innerHTML = `<b>${esc(x.name)}：歩行 10-18（5方向×4コマ・左は反転）</b><div class="q7g">${CELLS.map((c) => cell(c[0], c[1], c[2])).join('')}</div>`
      + (OLD && OLD.length ? `<b>旧の歩行（本編の盤・比較用）</b><div class="q7g">${OLD.map(oldCell).join('')}</div>` : '<small>旧の 8コマの歩行は無い種族（本編の盤は静止の立ち絵）</small>')
      + `<div class="qwbtn"><button type="button" data-a="play" data-nsfx="1">歩く／止める</button><button type="button" data-a="bg" data-nsfx="1">背景 濃／淡</button><button type="button" data-a="close" data-nsfx="1">閉じる</button></div><p class="qwnote">8fps（4コマで 0.5秒の1周）。止めると各向きの2コマ目（足をそろえた姿）。本編の盤と同じ素材（walk_1018）。iPhone の実機は未確認。</p>`;
    v.appendChild(w);
    const st = { i: 0, play: true };
    const draw = () => w.querySelectorAll('.q7c').forEach((c) => { const im = c.querySelectorAll('img'), n = im.length, k = st.play ? st.i % n : (c.classList.contains('old') ? 0 : 1); im.forEach((e, j) => e.classList.toggle('on', j === k)); });
    draw(); if (WK.t) clearInterval(WK.t);
    WK.t = setInterval(() => { if (!w.isConnected) { clearInterval(WK.t); WK.t = null; return; } if (st.play) { st.i++; draw(); } }, 125);
    w.querySelector('.qwbtn').onclick = (e) => { const a = e.target && e.target.dataset && e.target.dataset.a; if (a === 'play') { st.play = !st.play; draw(); } else if (a === 'bg') w.classList.toggle('light'); else if (a === 'close') { clearInterval(WK.t); WK.t = null; w.remove(); } };
  }

  function walk(x) {
    const v = doc.getElementById('mmqa'), D = walkSets(x.key); if (!v || !D) return;
    const old = v.querySelector('.qwalk'); if (old) old.remove();
    const st = { dir: 'front', i: 0, play: true, light: false, stand: false };
    const w = doc.createElement('div'); w.className = 'qwalk'; w.setAttribute('role', 'dialog'); w.setAttribute('aria-label', '歩行の確認');
    const frames = (dn) => D[dn].frames.map((f, i) => `<img class="qwf" data-dir="${dn}" data-i="${i}" src="${esc(f)}" alt="" decoding="async">`).join('');
    w.innerHTML = `<div class="qwinfo"></div><div class="qwst"><i></i><div class="qwbox"><img class="qws" hidden src="${esc(x.img)}" alt="">${frames('front')}${frames('back')}</div></div>`
      + '<div class="qwbtn"><button type="button" data-a="front" data-nsfx="1">前（front）</button><button type="button" data-a="back" data-nsfx="1">後ろ（back）</button><button type="button" data-a="play" data-nsfx="1">歩く／止める</button><button type="button" data-a="prev" data-nsfx="1">◀ コマ</button><button type="button" data-a="next" data-nsfx="1">コマ ▶</button><button type="button" data-a="bg" data-nsfx="1">背景 濃／淡</button><button type="button" data-a="stand" data-nsfx="1">立ち絵と重ねる</button><button type="button" data-a="close" data-nsfx="1">閉じる</button></div>'
      + '<p class="qwnote">本編の盤と同じ 12fps・同じ大きさ／足の位置の計算。止めると前（front）の1コマ目（本編の盤の停止の姿）。原本は加工済み・実機未検収（back_03・back_05・front_01 は見切れの可能性）。</p>';
    v.appendChild(w);
    const box = w.querySelector('.qwbox'), info2 = w.querySelector('.qwinfo'), stand = w.querySelector('.qws');
    const lay = () => {   // 静止の立ち絵の箱の高さ＝ステージの 58%（box の高さ）。歩行のコマ＝その h 倍の正方形・下を foot だけ下げる
      const H = box.getBoundingClientRect().height;
      w.querySelectorAll('img.qwf').forEach((im) => { const s = D[im.dataset.dir], sz = H * s.h; im.style.width = sz + 'px'; im.style.height = sz + 'px'; im.style.bottom = (-sz * (s.foot || 0)) + 'px'; });
      stand.style.height = H + 'px'; stand.style.width = 'auto'; stand.style.bottom = '0px';
    };
    const draw = () => {
      const s = D[st.dir], n = s.frames.length, i = (st.play || st.manual) ? st.i : (s.idle || 0);
      w.querySelectorAll('img.qwf').forEach((im) => im.classList.toggle('on', im.dataset.dir === st.dir && +im.dataset.i === i));
      info2.textContent = `${st.dir === 'front' ? '前（front）' : '後ろ（back）'} ${i + 1} / ${n}・${st.play ? `歩行中 ${s.fps}fps` : st.manual ? 'コマ送り' : '停止（front の1コマ目）'}`;
      w.querySelector('.qwst').classList.toggle('light', st.light); stand.hidden = !st.stand;
      w.querySelectorAll('.qwbtn button').forEach((b) => b.classList.toggle('on', (b.dataset.a === st.dir) || (b.dataset.a === 'play' && st.play) || (b.dataset.a === 'stand' && st.stand) || (b.dataset.a === 'bg' && st.light)));
      w.dataset.dir = st.dir; w.dataset.i = String(i); w.dataset.play = st.play ? '1' : '0';
    };
    const tick = () => { if (!w.isConnected) return stop(); if (st.play) { st.i = (st.i + 1) % D[st.dir].frames.length; draw(); } };
    const stop = () => { if (WK.t) { clearInterval(WK.t); WK.t = null; } };
    const run = () => { stop(); WK.t = setInterval(tick, 1000 / (D[st.dir].fps || 12)); };
    w.querySelector('.qwbtn').onclick = (e) => {
      const a = e.target && e.target.dataset && e.target.dataset.a; if (!a) return;
      if (a === 'front' || a === 'back') { st.dir = a; st.i = 0; st.manual = !st.play; }
      else if (a === 'play') { st.play = !st.play; st.manual = false; if (!st.play) st.dir = 'front'; st.i = st.play ? 0 : (D.front.idle || 0); }
      else if (a === 'prev' || a === 'next') { st.play = false; st.manual = true; const n = D[st.dir].frames.length; st.i = (st.i + (a === 'next' ? 1 : n - 1)) % n; }
      else if (a === 'bg') st.light = !st.light;
      else if (a === 'stand') st.stand = !st.stand;
      else if (a === 'close') { stop(); w.remove(); return; }
      draw();
    };
    lay(); draw(); run();
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

  /** 入口（trial.html）から：開始画面が出て S ができたら、開始画面の曲を止めて QA を ON（OFF は牧場へ） */
  function direct() {
    let n = 0;
    const tick = () => {
      if (ST.on) return;
      const app = doc.getElementById('app');
      if (G('S') && app && app.firstElementChild) { try { root.MMAUDIO && root.MMAUDIO.stopBgm({ fade: 'quick' }); } catch (e) {} ST.mon = DIRECT_MON; on('ranch'); return; }
      if (++n < 200) setTimeout(tick, 100);
    };
    setTimeout(tick, 300);
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
      if (DIRECT) direct();
    };
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot); else boot();
  }

  root.MMQA = Object.freeze({ audition, walk7: (i) => { const x = catalog()[i]; if (!ST.on || !x) return false; walk7(x); return true; },
    ENABLED, DIRECT, MONS, SAVE_KEY_RE, catalog, counts, statusOf,
    on, off, isOn: () => ST.on, active: () => ST.on, battling: () => ST.battling, snapshot: () => ST.snap,
    select: (i) => { ST.mon = Math.max(0, Math.min(MONS.length - 1, i | 0)); ST.sel = null; render(); }, battle: (i, no) => { if (!ST.on) return false; const x = catalog()[i]; const mv = x && x.moves.find((v) => v.no === no); return x && mv ? (mv.status === 'battle' ? battle(x, mv) : mv.status === 'preview' ? preview(x, mv) : false) : false; },
    // 2026-10-18 REV3：フルーネは正式10技（実戦）になった＝技アニメのコマだけの再生（判定なし）は QA の道具として残す
    preview: (i, no) => { if (!ST.on) return false; const x = catalog()[i]; const mv = x && x.moves.find((v) => v.no === no); return x && mv && mv.status !== 'static' ? preview(x, mv) : false; },
    endBattle, makeMon, FOE, animInfo, stage, _start: (m, prev) => start(m, prev), _lend: (sp) => lendFlurene(sp), _unlend: () => unlendFlurene(), show, walk: (i) => { if (!ST.on) return false; const x = catalog()[i]; if (!x || !walkSets(x.key)) return false; walk(x); return true; },
  });
})(typeof window !== 'undefined' ? window : globalThis);
