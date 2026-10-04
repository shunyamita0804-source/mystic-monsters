// =========================================================
// プロローグ（window.MMPRO）：新しいゲームの最初に1回（2026-10-05 正式：4枚・本文はユーザー指定のとおり）。
//  1＝人と聖獣の共生／2＝約百年前、異質な力を宿す聖獣の出現と聖獣士の始まり／3＝十年前、三人のレジェンドが脅威を退けた／4＝十年後のミストリアへ、聖獣士を夢見る若者が来る。
//  三人のレジェンド（レオナ＋グリフェル・アストラッド＋ゼルヴァーン・バルド＋ドラグノル）はいまも語り継がれる存在（死亡・消滅・引退などの設定は足さない）。
//  見せ方（2026-10-05 正式）：段落（空行で区切る）ごとに、画面の中央よりやや上で1文字ずつ「スッ」と現れる（文字ごとに opacity 0→1・下から 3px・ぼかし 1.5px→0。
//   開始間隔 48ms・各文字 160ms＝前の文字が出きる前に次が始まる。段落全体の一括フェードはしない）→ 読む間 → 段落がフェードで消える → 次の段落。
//  タップ：文字が出ている途中＝その段落をすぐ全部出す／全部出ていれば次へ（0.45秒未満の連打は無視）。「スキップ」は2度押し。文字は画像に焼き込まない（HTML の別の層）
// =========================================================
(function (root) {
  'use strict';
  const fz = Object.freeze, P = './assets/prologue/';
  const SLIDES = fz([
    fz({ id: '1', bg: P + 'prologue_01_coexistence.webp', pages: fz([
      fz(['遥か昔から、人と聖獣は共に生きてきた。', '力を貸し、心を通わせ、時に支え合いながら、', '同じ大地を歩む存在として――。']),
    ]) }),
    fz({ id: '2', bg: P + 'prologue_02_anomaly.webp', pages: fz([
      fz(['だが、およそ百年前。', 'これまで知られていなかった、異質な力を宿す聖獣が現れ、', '世界はかつてない脅威にさらされた。', '', 'その出来事をきっかけに、人々は各地で聖獣士を育て、', '聖獣を鍛え、来るべき危機に備えるようになった。']),
    ]) }),
    fz({ id: '3', bg: P + 'prologue_03_three_legends.webp', pages: fz([
      fz(['そして十年前――。', '再び世界を揺るがす大きな脅威が現れた。', '', 'その脅威に立ち向かったのは、', 'ミストリアの三人の聖獣士と、その聖獣たち。', '激しい戦いの末、彼らは脅威を退け、世界を救った。', '', 'その名は今も、伝説として語り継がれている。']),
    ]) }),
    fz({ id: '4', bg: P + 'prologue_04_arrival_mistoria.webp', pages: fz([
      fz(['それから十年。', '戦いの傷を乗り越えたミストリアは、', '今や世界有数の聖獣士が集う街として、新たな時代を迎えていた。', '', 'そして今日――。', 'その街に憧れ、一人前の聖獣士になることを夢見る一人の若者が、', 'ミストリアを訪れる。']),
    ]) }),
  ]);
  /** 三人のレジェンド（世界設定の記録。プロローグの本文には名前を出さない。将来、闘技場の裏要素で使えるように残す） */
  const LEGENDS = fz([fz({ name: 'レオナ', beast: 'グリフェル' }), fz({ name: 'アストラッド', beast: 'ゼルヴァーン' }), fz({ name: 'バルド', beast: 'ドラグノル' })]);
  /** 時間（ms）：chGap＝文字の開始間隔・chFade＝1文字が現れる時間・chRise＝下からの距離（px）・chBlur＝ぼかし（px）・readBase／perChar＝全部出たあとの読む時間・outMs＝段落が消える時間・gap＝次の段落までの間 */
  const T = fz({ chGap: 48, chFade: 160, chRise: 3, chBlur: 1.5, readBase: 1300, perChar: 42, outMs: 560, gap: 160, cross: 1200, startHold: 700, endHold: 1400, fadeOut: 900, tapGuard: 450 });
  /** 文章の位置（画面の高さに対する割合）：段落の中心＝画面の中央よりやや上 */
  const POS = fz({ y: 0.42 });
  /** ページを表示の単位（段落＝空行で区切る）に分ける。本文・行の順は変えない */
  function units(lines) { const out = []; let cur = []; for (const t of lines) { if (!t) { if (cur.length) out.push(cur); cur = []; continue; } cur.push(t); } if (cur.length) out.push(cur); return out; }
  const charsOf = (u) => u.reduce((a, t) => a + Array.from(t).length, 0);
  /** 段落の文字が全部出るまでの時間 */
  const revealMs = (u) => Math.max(0, charsOf(u) - 1) * T.chGap + T.chFade;
  /** 全部出たあとの読む時間 */
  const readMs = (u) => T.readBase + charsOf(u) * T.perChar;
  const calm = () => !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let readyMemo = null, busy = false;
  /** 1ページの読む時間の目安（自動で進む時刻） */
  function pageMs(lines) { return units(lines).reduce((a, u) => a + revealMs(u) + readMs(u) + T.outMs + T.gap, 0); }
  /** 背景の画像がそろっているか（読み込めるかを確かめる。1回だけ） */
  function ready() {
    if (readyMemo) return readyMemo;
    if (typeof Image === 'undefined') return (readyMemo = Promise.resolve(false));
    if (SLIDES.some((s) => !s.bg)) return (readyMemo = Promise.resolve(false));   // 背景が未着（null）の間は読みに行かない（404 を出さない）
    readyMemo = Promise.all(SLIDES.map((s) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im.naturalWidth > 0); im.onerror = () => ok(false); im.src = s.bg; }))).then((a) => a.every(Boolean));
    return readyMemo;
  }
  /** 背景を待つ（最大 ms。読み込みが遅い・届かない回線でもプロローグを飛ばさない＝2026-10-04 G1） */
  function readyOrTimeout(ms = 6000) { return Promise.race([ready().then(() => true), wait(ms).then(() => true)]); }
  /**
   * 再生する。最後まで見た・スキップを確定した ときだけ true で resolve（呼び出し側はそのときだけ「見た」を保存する）。同時に2つは再生しない
   *  opts.cover：すでに画面を覆っている要素（前の画面から黒へつないだ幕）。プロローグの幕が出たら消す
   */
  async function play(opts = {}) {
    if (busy || typeof document === 'undefined' || !document.body) return false;
    busy = true;
    const ov = document.createElement('div'); ov.className = 'mmpro'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'プロローグ');
    ov.innerHTML = '<div class="mmpro-bg a"></div><div class="mmpro-bg b"></div><div class="mmpro-shade"></div><div class="mmpro-nar" aria-live="polite"></div><button class="mmpro-skip" type="button">スキップ</button><div class="mmpro-hint">タップで先へ</div><div class="mmpro-veil"></div>';
    document.body.appendChild(ov);
    if (opts.cover && opts.cover.remove) opts.cover.remove();
    const bgs = [ov.querySelector('.mmpro-bg.a'), ov.querySelector('.mmpro-bg.b')], nar = ov.querySelector('.mmpro-nar'), skip = ov.querySelector('.mmpro-skip');
    let front = 0, last = 0, wake = null, quit = false, fullNow = false;
    const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
    // 2026-10-06：アプリが裏に回っている間（document.hidden）は進めない。以前は裏でもタイマーで最後まで進み「見た」が保存され、
    //  そのままタスクキルすると次の起動でプロローグを飛ばしていた（iPhone）。表に戻ったら続きから
    const gate = () => (typeof document !== 'undefined' && document.hidden) ? new Promise((r) => { const f = () => { if (!document.hidden) { document.removeEventListener('visibilitychange', f); r(); } }; document.addEventListener('visibilitychange', f); }) : Promise.resolve();
    const sleep = (ms) => new Promise((r) => { const t = setTimeout(() => { wake = null; gate().then(() => r('time')); }, ms); wake = () => { clearTimeout(t); wake = null; r('tap'); }; });
    ov.addEventListener('click', (e) => {
      if (e.target === skip) return;
      const t = now(); if (t - last < T.tapGuard) return; last = t;
      if (wake) wake();
    });
    skip.addEventListener('click', (e) => {
      e.stopPropagation(); const t = now(); if (t - last < 300) return; last = t;
      if (skip.dataset.arm !== '1') { skip.dataset.arm = '1'; skip.textContent = 'もう一度でスキップ'; setTimeout(() => { if (skip.isConnected) { skip.dataset.arm = ''; skip.textContent = 'スキップ'; } }, 3000); return; }
      quit = true; if (wake) wake();
    });
    const showBg = async (src, first) => {
      const nx = bgs[1 - front]; nx.style.backgroundImage = `url(${src})`;
      nx.classList.add('on'); bgs[front].classList.remove('on'); front = 1 - front;
    };
    const esc = (t) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
    /**
     * 1ページ（2026-10-05 正式）：段落ごとに、文字単位で現れる（各文字が独立したアニメーション。前の文字が出きる前に次が始まる）→ 読む間 → フェードで消える → 次の段落。
     *  タップ：文字が出ている途中＝その段落をすぐ全部出す（.full）→ 全部出ていれば次の段落へ
     */
    const showPage = async (lines) => {
      nar.classList.remove('out');
      for (const u of units(lines)) {
        if (quit) return;
        let k = 0; const c = calm();
        nar.innerHTML = `<div class="mmpro-u${c ? ' full' : ''}" style="top:${(POS.y * 100).toFixed(1)}%;--chf:${T.chFade}ms;--chr:${T.chRise}px;--chb:${T.chBlur}px">${u.map((t) => `<p>${Array.from(t).map((ch) => `<span class="mpc" style="--d:${(k++) * T.chGap}ms">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join('')}</p>`).join('')}</div>`;
        const el = nar.firstElementChild;
        let r = c ? 'time' : await sleep(revealMs(u));
        if (quit) return;
        el.classList.add('full');   // 全部出た（タップで途中から全部出したときも同じ）
        r = await sleep(readMs(u));
        if (quit) return;
        const o = el.animate ? el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: T.outMs, easing: 'ease-out', fill: 'forwards' }) : null;
        await wait(o ? T.outMs : 0); if (!o) el.style.opacity = '0';
        await wait(T.gap);
      }
      nar.innerHTML = '';
    };
    /** ページの終わり：文はもう消えている（何もしない。互換のため残す） */
    const pageOut = async () => {};
    let done = false;
    try {
      for (let si = 0; si < SLIDES.length && !quit; si++) {
        const sl = SLIDES[si]; await showBg(sl.bg, si === 0);
        if (si === 0) await sleep(calm() ? 0 : T.startHold);
        for (let pi = 0; pi < sl.pages.length && !quit; pi++) {
          await showPage(sl.pages[pi]);
          if (quit) break;
          await pageOut();
        }
      }
      if (!quit) await sleep(calm() ? 0 : T.endHold);
      await gate();   // 最後まで見た＝表に出ているときに終わった場合だけ
      done = true;   // 最後まで見た（または スキップを2度押しで確定した）
      ov.classList.add('end'); await wait(calm() ? 0 : T.fadeOut);
    } finally { ov.remove(); busy = false; }
    return done;
  }
  root.MMPRO = fz({ SLIDES, LEGENDS, T, POS, units, revealMs, readMs, play, ready, readyOrTimeout, pageMs, isBusy: () => busy });
})(typeof window !== 'undefined' ? window : globalThis);
