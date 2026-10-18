// =========================================================
// 2026-10-17 QA トップ `MMQAT`（URL に ?qaTop=1 のときだけ・QA 用。通常の URL では何もしない）
//  ・版（MM_BUILD）・version.json（build・branch・base＝元のコミット）を表示＝iPhone で古いキャッシュと取り違えない
//  ・Chapter 1／2 の A／B／C をすぐに試遊（?ch1trial／?ch2trial＝セーブを控えて保存しない）。カメラ（従来／C案）・道路（従来／新）・歩行（従来／新 10-17）・
//    固定の seed（?qaSeed＝出発の乱数）・連れていく子（?qaMon＝0〜4）を選んでから開く。Chapter 3（2026-10-18・?ch3trial）
//  ・全7体×10技＝70枠の状態（実戦／プレビュー／未実装）・音声の試聴（NPC 60・鳴き声 14）・バトル技ステージ＝?mmQaTrial=1 の QA 画面
//  ・初見プレイ（?qaFresh=1＝セーブを別の名前へ読み替え・本当のセーブは触らない）・やり直し（?qaFresh=reset）・QA を出る（通常の URL）
// =========================================================
(function (root) {
  'use strict';
  let P = null; try { P = new URLSearchParams(root.location.search); } catch (e) {}
  const ON = !!(P && P.get('qaTop'));
  const G = (n) => { try { return (0, eval)(n); } catch (e) { return undefined; } };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const OPT = { cam: '', road: '', walk: '', seed: '', mon: '0' };
  const base = () => root.location.pathname;
  function href(kind, route) {
    const u = new URLSearchParams();
    if (kind === 'ch1') u.set('ch1trial', route); else if (kind === 'ch2') u.set('ch2trial', route); else if (kind === 'ch3') u.set('ch3trial', route);
    if (OPT.cam) u.set('qaCam', OPT.cam); if (OPT.road) u.set('qaRoadArt', OPT.road); if (OPT.walk) u.set('qaWalk', OPT.walk);
    if (OPT.seed) u.set('qaSeed', OPT.seed); if (OPT.mon && OPT.mon !== '0') u.set('qaMon', OPT.mon);
    return base() + '?' + u.toString();
  }
  function moves() {
    const Q = root.MMQA; let cat = []; try { cat = Q && Q.catalog ? Q.catalog() : []; } catch (e) {}
    const n = { battle: 0, preview: 0, none: 0 };
    const rows = cat.map((c) => `<tr><th>${esc(c.name)}</th>${c.moves.map((m) => { const k = m.status === 'battle' ? 'battle' : m.status === 'preview' ? 'preview' : 'none'; n[k]++; return `<td class="${k}" title="${esc(m.name)}">${k === 'battle' ? '実' : k === 'preview' ? 'プ' : '未'}</td>`; }).join('')}</tr>`).join('');
    return { html: `<table class="qtm"><tbody>${rows}</tbody></table><small>実＝実戦で使える（QA の試合）・プ＝技アニメのプレビューだけ（性能が未決）・未＝未実装／要仕様確認。合計 ${cat.reduce((a, c) => a + c.moves.length, 0)} 枠＝実戦 ${n.battle}・プレビュー ${n.preview}・未実装 ${n.none}</small>`, n, total: cat.reduce((a, c) => a + c.moves.length, 0) };
  }
  function seg(name, list) { return `<div class="qts" data-k="${name}">${list.map(([v, t]) => `<button type="button" data-v="${esc(v)}"${OPT[name] === v ? ' class="on"' : ''}>${esc(t)}</button>`).join('')}</div>`; }
  function render(vj) {
    let el = document.getElementById('mmqat');
    if (!el) { el = document.createElement('div'); el.id = 'mmqat'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'QA トップ'); document.body.appendChild(el); }
    const mv = moves(), V = vj || {};
    el.innerHTML = `<div class="qtw"><h2>ミスモン QA トップ</h2>
      <p class="qtv">版 <b>${esc(G('MM_BUILD') || '?')}</b>${V.build && V.build !== G('MM_BUILD') ? `（公開中の version.json＝${esc(V.build)}・一致しない＝再読み込み）` : ''}<br>ブランチ ${esc(V.branch || '—')}・元のコミット ${esc(V.base || '—')}</p>
      <h3>Chapter をすぐに試遊（セーブを控えて保存しない）</h3>
      <label>カメラ</label>${seg('cam', [['', 'C案（正式）'], ['old', '従来（比較）']])}
      <label>道路の絵</label>${seg('road', [['', '新（正式・2026-10-18）'], ['old', '従来（比較）']])}
      <label>歩行</label>${seg('walk', [['', '新（正式・8方向）'], ['old', '従来 8コマ（比較）']])}
      <label>連れていく子</label>${seg('mon', [['0', 'ソラモ'], ['1', 'ガウル'], ['2', 'ノビトン'], ['3', 'ジオル'], ['4', 'レグナス']])}
      <label>出発の乱数（seed・空＝毎回ちがう）</label><input class="qtseed" inputmode="numeric" value="${esc(OPT.seed)}" placeholder="例 42">
      <div class="qtl">${['A', 'B', 'C'].map((r) => `<a class="qtb" data-k="ch1" data-r="${r}" href="${esc(href('ch1', r))}">Chapter 1 ・ ${r}</a>`).join('')}${['A', 'B', 'C'].map((r) => `<a class="qtb" data-k="ch2" data-r="${r}" href="${esc(href('ch2', r))}">Chapter 2 ・ ${r}（新しい盤＝未承認）</a>`).join('')}${['A', 'B', 'C'].map((r) => `<a class="qtb" data-k="ch3" data-r="${r}" href="${esc(href('ch3', r))}">Chapter 3 ・ ${r}</a>`).join('')}</div>
      <small>盤の左の「QA移動」で、分かれ道・門・橋・ライバル・封印の門・寄り道・野生／レア・宝箱・ゴールの手前へ直接移れます（次の出目も固定できる）。Chapter 3 の A＝白亜の大橋・B＝雲海の螺旋・C＝風の浮島めぐり。フルーネ・ラズックは盤に出せない（未解禁）＝新歩行は QA 画面の「新歩行 10-17」で確認</small>
      <h3>全7体×10技＝${mv.total} 枠</h3>${mv.html}
      <div class="qtl"><a class="qtb" href="${esc(base() + '?mmQaTrial=1&qaDirect=1')}">QA 画面（全技の試合・バトル技ステージ・音声の試聴・新歩行）</a></div>
      <h3>初見プレイ（本当のセーブは触らない）</h3>
      <div class="qtl"><a class="qtb" href="${esc(base() + '?qaFresh=1')}">初見プレイを始める／続ける</a><a class="qtb red" href="${esc(base() + '?qaFresh=reset')}">初見プレイを最初から（別の名前のセーブを消す）</a></div>
      <small>?qaFresh=1：開始画面 → 新しいゲーム → 案内 → 登録 → 街 → 最初の子 → Chapter 1。途中で閉じても同じ URL で続きから。ゲームの本当のセーブ（mr4v6）は読まない・書かない</small>
      <div class="qtl"><a class="qtb dim" href="${esc(base())}">QA を出る（通常の URL）</a></div></div>`;
    el.querySelectorAll('.qts').forEach((g) => g.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; OPT[g.dataset.k] = b.dataset.v; render(vj); }));
    const sd = el.querySelector('.qtseed'); sd.addEventListener('change', () => { OPT.seed = /^\d{1,9}$/.test(sd.value.trim()) ? sd.value.trim() : ''; render(vj); });
  }
  function style() {
    const s = document.createElement('style');
    s.textContent = `#mmqat{position:fixed;inset:0;z-index:2000;overflow:auto;background:#0b1636;color:#fff3d6;font:500 13px/1.5 "Noto Sans JP",sans-serif}
#mmqat .qtw{max-width:480px;margin:0 auto;padding:calc(env(safe-area-inset-top,0px) + 12px) 14px calc(env(safe-area-inset-bottom,0px) + 24px)}
#mmqat h2{margin:0 0 4px;font:800 20px/1.3 "Shippori Mincho",serif;color:#ffde59}#mmqat h3{margin:14px 0 6px;font-size:14px;color:#ffde59}
#mmqat label{display:block;margin:8px 0 3px;font-size:11.5px;color:#cfd8ff}#mmqat small{display:block;margin-top:4px;font-size:10.5px;color:#cdbf98}
#mmqat .qtv{margin:0;font-size:11.5px}#mmqat .qts{display:flex;flex-wrap:wrap;gap:4px}
#mmqat .qts button{min-height:36px;padding:4px 10px;border:1.5px solid #d8b25a;border-radius:9px;background:#1d2f66;color:#fff3d6;font:700 12px/1.2 "Noto Sans JP",sans-serif}
#mmqat .qts button.on{background:#c27a12;color:#fff;border-color:#fff0c0}
#mmqat .qtseed{width:120px;min-height:34px;font-size:16px;border-radius:8px;border:1.5px solid #d8b25a;background:#13224f;color:#fff}
#mmqat .qtl{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
#mmqat .qtb{display:inline-flex;align-items:center;min-height:44px;padding:6px 12px;border:2px solid #fff0c0;border-radius:12px;background:linear-gradient(180deg,#fbe39a,#c58d2a);color:#3b2406;font:800 13px/1.2 "Noto Sans JP",sans-serif;text-decoration:none}
#mmqat .qtb.red{background:linear-gradient(180deg,#e9867a,#9b2d22);color:#fff}#mmqat .qtb.dim{background:#1d2f66;color:#fff3d6;border-color:#d8b25a}
#mmqat .qtm{border-collapse:collapse;font-size:11px}#mmqat .qtm th{padding:2px 6px 2px 0;text-align:left;font-weight:700;white-space:nowrap}
#mmqat .qtm td{width:24px;height:22px;text-align:center;border:1px solid rgba(255,255,255,.18)}#mmqat .qtm td.battle{background:#2f7d43}#mmqat .qtm td.preview{background:#8a6b14}#mmqat .qtm td.none{background:#6b2a2a}`;
    document.head.appendChild(s);
  }
  function open() {
    style(); render(null);
    try { const x = new XMLHttpRequest(); x.open('GET', './version.json?t=' + Date.now(), true); x.onload = () => { try { render(JSON.parse(x.responseText)); } catch (e) {} }; x.send(); } catch (e) {}
  }
  root.MMQAT = Object.freeze({ on: ON, open, href, opt: OPT, moves });
  if (ON) root.addEventListener('load', () => setTimeout(open, 200));
})(typeof window !== 'undefined' ? window : globalThis);
