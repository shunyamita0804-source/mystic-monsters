// 技辞典 `MMMOVEDEX`（2026-10-06）：正式の技アニメーション資料（assets/moves/。緑の背景・1技1枚・複数カット）と技の性能を見る画面。
//  開く場所：技管理の技の詳細（index.html の skSheet「技の演出を見る」）・技の一覧の「技辞典」・研究所の図鑑の詳細（musd）。
//  データは js/phase10/monsters.js の movesOf（ソラモ・ノビトン・ジオル・ガウル・レグナス）の1か所。表示だけ（セーブ・バトルには触れない）。
//  状態異常（まひ・ねむり）・回復は 2026-10-06・5 からバトルで動く（js/battle/rules.js）。ジオルの数値は未同期＝出さない。
(function () {
  'use strict';
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const TYPE = { power: ['ちから', 'p'], wisdom: ['かしこさ', 'i'], support: ['補助', 's'], heal: ['回復・補助', 's'], special: ['特殊', 'x'] };
  const STAT = { atk: '攻撃力（ちから・かしこさ）', de: '丈夫さ（防御力）', hi: '命中', ev: '回避' };
  const SIZE = { small: '小', medium: '中', large: '大' };
  const NAME = { regnas: 'レグナス' };
  let cur = null;

  const M = () => window.MMP10M;
  const listOf = (ref) => (M() && M().movesOf ? M().movesOf(ref) : []);
  const nameOf = (ref) => { if (NAME[ref]) return NAME[ref]; const s = M() && (typeof ref === 'string' ? M().byKey(ref) : M().byId(ref)); return s ? s.name : ''; };
  function hasSlot(k) { return !!(M() && M().moveBySlot && M().moveBySlot(k)); }

  function style() {
    if (document.getElementById('mvdx-style')) return;
    const st = document.createElement('style'); st.id = 'mvdx-style';
    st.textContent = '.mvdx{position:fixed;inset:0;z-index:95;display:flex;flex-direction:column;background:linear-gradient(#0d1a3c,#060c1e);color:#f3ecd9;padding:calc(env(safe-area-inset-top,0px) + 8px) 12px calc(env(safe-area-inset-bottom,0px) + 10px);box-sizing:border-box;touch-action:manipulation}'
      + '.mvdx header{display:flex;align-items:center;gap:8px;flex:none}.mvdx header b{flex:1;font-family:var(--mm-font-head,serif);font-size:18px;letter-spacing:.08em;color:#ffe9b0}'
      + '.mvdx header button{width:40px;height:40px;border-radius:50%;border:1.5px solid #d9b465;background:#0b1838;color:#ffe9b0;font-size:18px}'
      + '.mvdx .mvfig{flex:none;margin:8px 0 6px;border-radius:8px;overflow:hidden;border:1px solid rgba(240,210,130,.7);background:#0a1430;aspect-ratio:4/3;display:grid;place-items:center}'
      + '.mvdx .mvfig img{width:100%;height:100%;object-fit:contain;display:block}'
      + '.mvdx .mvfig .mvnone{font-size:13px;color:#9aa6c4;padding:20px;text-align:center}'
      + '.mvdx .mvinfo{flex:none;padding:8px 10px;border-radius:8px;background:rgba(8,15,34,.86);border:1px solid rgba(240,232,212,.45)}'
      + '.mvdx .mvh{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.mvdx .mvh b{font-family:var(--mm-font-head,serif);font-size:18px}'
      + '.mvdx .mvt{padding:1px 8px;border-radius:999px;font-size:11px;font-weight:700;color:#fff;background:#6a7690}.mvdx .mvt.p{background:#c0503a}.mvdx .mvt.i{background:#3e9a5a}.mvdx .mvt.s{background:#3f6fbf}.mvdx .mvt.x{background:#7a4fb0}'
      + '.mvdx .mvn{display:flex;gap:12px;margin:6px 0 2px;font-size:13px}.mvdx .mvn span b{font-size:16px;color:#ffe9b0;margin-left:3px}'
      + '.mvdx .mvd{margin:4px 0 0;font-size:13px;line-height:1.55;line-break:strict}.mvdx .mvef{margin:4px 0 0;padding-left:1.1em;font-size:12px;line-height:1.5;color:#dfe7ff}.mvdx .mvnote{display:block;margin-top:4px;font-size:11px;color:#c9b98a}'
      + '.mvdx .mvl{flex:1 1 auto;min-height:0;overflow-y:auto;margin-top:8px;display:grid;grid-template-columns:1fr 1fr;gap:6px;align-content:start;overscroll-behavior:contain}'
      + '.mvdx .mvl button{display:flex;align-items:center;gap:6px;min-height:40px;padding:4px 8px;border-radius:8px;text-align:left;color:#f3ecd9;background:rgba(14,24,56,.95);border:1px solid rgba(240,232,212,.4);font-size:13px}'
      + '.mvdx .mvl button i{font-style:normal;font-size:11px;color:#c9b98a;min-width:1.6em}.mvdx .mvl button.on{border-color:#ffd25a;box-shadow:0 0 0 1px #ffd25a,0 0 10px rgba(255,210,90,.45)}'
      + '.mvzoom{position:fixed;inset:0;z-index:96;background:rgba(2,4,10,.96);display:grid;place-items:center;touch-action:pinch-zoom}.mvzoom img{max-width:100vw;max-height:100dvh;object-fit:contain}';
    document.head.appendChild(st);
  }

  function effLine(e) { return `${e.target === 'self' ? '自分' : '相手'}の${STAT[e.stat] || e.stat}が${SIZE[e.size] || ''}${e.dir === 'down' ? '下がる' : '上がる'}（${e.turns}ターン）`; }
  function detail(mv) {
    const t = TYPE[mv.type] || null, num = mv.power != null;
    const ef = (mv.effects || []).map((e) => `<li>${esc(effLine(e))}</li>`).join('');
    const ail = mv.ailment ? `<li>${Math.round(mv.ailment.chance * 100)}%で「${esc(mv.ailment.label)}」</li>` : '';
    const heal = mv.heal ? `<li>最大ライフの${Math.round(mv.heal.lifeRatio * 100)}%を回復${mv.heal.cureAilments ? '・自分の状態異常をすべて治す' : ''}${mv.heal.clearStatChanges === false ? '（能力の上げ下げは残る）' : ''}</li>` : '';
    const na = mv.ailment ? `<small class="mvnote">※ ${esc(mv.ailment.label)}：${mv.ailment.kind === 'sleep' ? '最大2回の行動の機会を失う（ダメージを受けると起きる）' : '3回の行動の機会のあいだ、毎回25%で動けない'}</small>` : '';
    return `<div class="mvh"><b>${esc(mv.name)}</b>${t ? `<span class="mvt ${t[1]}">${t[0]}</span>` : ''}</div>`
      + (num ? `<div class="mvn"><span>威力<b>${mv.power}</b></span><span>命中<b>${mv.accuracy}%</b></span><span>CR<b>${mv.critical}%</b></span></div>` : (mv.type === 'support' || mv.type === 'heal' ? '<div class="mvn"><span>ダメージなし</span></div>' : '<div class="mvn"><span>性能の数値は未同期</span></div>'))
      + (mv.desc ? `<p class="mvd">${esc(mv.desc)}</p>` : '') + (ef || ail || heal ? `<ul class="mvef">${ef}${ail}${heal}</ul>` : '') + na;
  }

  function render() {
    const d = document.getElementById('mvdx'); if (!d || !cur) return;
    const L = cur.list, mv = L[cur.i];
    d.querySelector('.mvfig').innerHTML = mv && mv.sheet ? `<img src="${mv.sheet}" alt="${esc(mv.name)}の技アニメーション" decoding="async">` : '<span class="mvnone">技の資料はまだありません</span>';
    d.querySelector('.mvinfo').innerHTML = mv ? detail(mv) : '';
    d.querySelectorAll('.mvl button').forEach((b, i) => { b.classList.toggle('on', i === cur.i); b.setAttribute('aria-pressed', i === cur.i ? 'true' : 'false'); });
  }

  /** 種族（番号・文字ID・'regnas'）の技辞典を開く。no＝最初に出す技の No.（省略で 1） */
  function open(ref, no) {
    const list = listOf(ref); if (!list.length) return false;
    style(); close();
    cur = { ref, list, i: Math.max(0, list.findIndex((m) => m.no === no)) };
    const d = document.createElement('div'); d.className = 'mvdx'; d.id = 'mvdx'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', '技辞典');
    d.innerHTML = `<header><b>${esc(nameOf(ref))}の技辞典</b><button type="button" class="mvx" aria-label="閉じる">✕</button></header><div class="mvfig"></div><div class="mvinfo"></div>`
      + `<div class="mvl">${list.map((m, i) => `<button type="button" data-i="${i}"><i>${m.no}</i>${esc(m.name)}</button>`).join('')}</div>`;
    document.body.appendChild(d);
    d.querySelector('.mvx').onclick = close;
    d.querySelector('.mvl').onclick = (e) => { const b = e.target.closest && e.target.closest('button[data-i]'); if (!b) return; cur.i = +b.dataset.i; render(); };
    d.querySelector('.mvfig').onclick = () => { const im = d.querySelector('.mvfig img'); if (!im) return; const z = document.createElement('div'); z.className = 'mvzoom'; z.innerHTML = `<img src="${im.src}" alt="">`; z.onclick = () => z.remove(); document.body.appendChild(z); };
    render();
    return true;
  }
  /** 技の番号（SK）から開く（その技を選んだ状態） */
  function openSlot(k) { const mv = M() && M().moveBySlot ? M().moveBySlot(k) : null; return mv ? open(mv.owner, mv.no) : false; }
  function close() { const d = document.getElementById('mvdx'); if (d) d.remove(); document.querySelectorAll('.mvzoom').forEach((z) => z.remove()); cur = null; }

  window.MMMOVEDEX = Object.freeze({ open, openSlot, close, hasSlot, listOf });
})();
