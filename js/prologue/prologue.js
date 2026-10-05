// =========================================================
// プロローグ（window.MMPRO）：新しいゲームの最初に1回（2026-10-05 正式：4枚・本文はユーザー指定のとおり）。
//  1＝人と聖獣の共生／2＝約百年前、異質な力を宿す聖獣の出現と聖獣士の始まり／3＝十年前、三人のレジェンドが脅威を退けた／4＝十年後のミストリアへ、聖獣士を夢見る若者が来る。
//  三人のレジェンド（レオナ＋グリフェル・アストラッド＋ゼルヴァーン・バルド＋ドラグノル）はいまも語り継がれる存在（死亡・消滅・引退などの設定は足さない）。
//  見せ方（2026-10-05 正式）：段落（空行で区切る）ごとに、画面の中央よりやや上で1文字ずつ「スッ」と現れる（文字ごとに opacity 0→1・下から 3px・ぼかし 1.5px→0。
//   開始間隔 48ms・各文字 160ms＝前の文字が出きる前に次が始まる。段落全体の一括フェードはしない）→ 読む間 → 段落がフェードで消える → 次の段落。
//  2026-10-06 正式（固定尺のオープニング）：画面のタップでは何も進まない（全文表示・次の段落・次の画像・「タップで先へ」の表示は廃止）。
//   決まった時刻表（schedule）を、裏に回っている間は止まる時計で進める＝正式のプロローグ BGM（54.2秒）と同じ時間軸（Scene 2＝7.782秒・Scene 3＝21.226秒・Scene 4＝37.342秒・最後の本文の終わり＝50.786秒）。
//   「スキップ」は2度押し。文字は画像に焼き込まない（HTML の別の層）
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
  const T = fz({ chGap: 48, chFade: 160, chRise: 3, chBlur: 1.5, readBase: 1300, perChar: 42, outMs: 560, gap: 160, cross: 1200, startHold: 700, endHold: 1400, fadeOut: 900 });
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
   * 時刻表（ms・Scene 1 の開始＝0）：背景の切り替え（bg）・段落が現れる（show）・全部出た（full）・消え始める（out）・最後の余韻のあと（end）。
   *  正式のプロローグ BGM はこの時刻表に合わせて作られている（Scene 2＝7782・Scene 3＝21226・Scene 4＝37342・最後の本文の終わり＝50786）。時刻を変えるときは BGM と合わせること
   */
  function schedule() {
    const ev = []; let t = 0;
    SLIDES.forEach((sl, si) => {
      ev.push({ t, k: 'bg', si }); if (si === 0) t += T.startHold;
      for (const pg of sl.pages) for (const u of units(pg)) { ev.push({ t, k: 'show', u }); t += revealMs(u); ev.push({ t, k: 'full' }); t += readMs(u); ev.push({ t, k: 'out' }); t += T.outMs + T.gap; ev.push({ t, k: 'clear' }); }
    });
    ev.push({ t, k: 'lastText' }); t += T.endHold; ev.push({ t, k: 'end' });
    return fz(ev.map(fz));
  }
  /** 各 Scene の開始時刻（ms） */
  const sceneStarts = () => schedule().filter((e) => e.k === 'bg').map((e) => e.t);
  /**
   * 再生する。最後まで見た・スキップを確定した ときだけ true で resolve（呼び出し側はそのときだけ「見た」を保存する）。同時に2つは再生しない
   *  opts.cover：すでに画面を覆っている要素（前の画面から黒へつないだ幕）。プロローグの幕が出たら消す
   *  opts.onStart()：Scene 1 を見せる直前に呼ぶ（Promise なら待つ）＝ここで正式のプロローグ BGM を始める（背景の読み込み待ちの間に BGM を先に鳴らさない）
   *  opts.audioTime()／opts.seek(秒)：BGM の今の位置（秒・鳴っていなければ null）と位置合わせ。映像の時計が基準で、ずれが 0.15秒を超えたら BGM を合わせる
   *  時計：裏に回っている間（document.hidden）は止まる（BGM も Audio Manager が止める）。表に戻ると両方とも続きから＝Scene と音楽がずれない
   */
  async function play(opts = {}) {
    if (busy || typeof document === 'undefined' || !document.body) return false;
    busy = true;
    const ov = document.createElement('div'); ov.className = 'mmpro'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'プロローグ');
    ov.innerHTML = '<div class="mmpro-bg a"></div><div class="mmpro-bg b"></div><div class="mmpro-shade"></div><div class="mmpro-nar" aria-live="polite"></div><button class="mmpro-skip" type="button">スキップ</button><div class="mmpro-veil"></div>';
    document.body.appendChild(ov);
    if (opts.cover && opts.cover.remove) opts.cover.remove();
    const bgs = [ov.querySelector('.mmpro-bg.a'), ov.querySelector('.mmpro-bg.b')], nar = ov.querySelector('.mmpro-nar'), skip = ov.querySelector('.mmpro-skip');
    let front = 0, last = 0, quit = false, wake = null;
    const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
    skip.addEventListener('click', (e) => {
      e.stopPropagation(); const t = now(); if (t - last < 300) return; last = t;
      if (skip.dataset.arm !== '1') { skip.dataset.arm = '1'; skip.textContent = 'もう一度でスキップ'; setTimeout(() => { if (skip.isConnected) { skip.dataset.arm = ''; skip.textContent = 'スキップ'; } }, 3000); return; }
      quit = true; if (wake) wake();
    });
    // 時計：表に出ている間だけ進む（裏に回っている間は止まる）
    let acc = 0, t0 = null; const hidden = () => !!document.hidden;
    const clock = () => acc + (t0 == null ? 0 : now() - t0);
    const onVis = () => { if (hidden()) { if (t0 != null) { acc += now() - t0; t0 = null; } } else if (t0 == null && started) { t0 = now(); syncAudio(true); } if (wake) wake(); };
    let started = false, lastSync = 0;
    const syncAudio = (force) => {
      if (!opts.audioTime || !opts.seek) return; const c = clock(); if (!force && c - lastSync < 400) return; lastSync = c;
      try { const a = opts.audioTime(); if (a != null && Number.isFinite(a) && Math.abs(a * 1000 - c) > 150) opts.seek(c / 1000); } catch (e) {}
    };
    document.addEventListener('visibilitychange', onVis);
    const showBg = (src) => { const nx = bgs[1 - front]; nx.style.backgroundImage = `url(${src})`; nx.classList.add('on'); bgs[front].classList.remove('on'); front = 1 - front; };
    const esc = (t) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

    let cur = null;
    const apply = (e) => {
      if (e.k === 'bg') showBg(SLIDES[e.si].bg);
      else if (e.k === 'show') { let k = 0; const c = calm(); nar.innerHTML = `<div class="mmpro-u${c ? ' full' : ''}" style="top:${(POS.y * 100).toFixed(1)}%;--chf:${T.chFade}ms;--chr:${T.chRise}px;--chb:${T.chBlur}px">${e.u.map((t) => `<p>${kinsoku(t).map((w) => `<span class="mpw">${Array.from(w).map((ch) => `<span class="mpc" style="--d:${(k++) * T.chGap}ms">${ch === ' ' ? '&nbsp;' : esc(ch)}</span>`).join('')}</span>`).join('')}</p>`).join('')}</div>`; cur = nar.firstElementChild; }
      else if (e.k === 'full') { if (cur) cur.classList.add('full'); }
      else if (e.k === 'out') { if (cur) { const o = cur.animate ? cur.animate([{ opacity: 1 }, { opacity: 0 }], { duration: T.outMs, easing: 'ease-out', fill: 'forwards' }) : null; if (!o) cur.style.opacity = '0'; } }
      else if (e.k === 'clear') { nar.innerHTML = ''; cur = null; }
    };
    const EV = schedule();
    let done = false;
    try {
      showBg(SLIDES[0].bg);
      let a0 = null; if (opts.onStart) { try { a0 = await opts.onStart(); } catch (e) {} }   // Scene 1 の開始＝BGM の開始（ここが 0.000秒）
      started = true; if (Number.isFinite(a0) && a0 > 0 && a0 < 0.5) acc = a0 * 1000;   // BGM が実際に鳴り始めた位置から時計を始める（数十 ms のずれも持ち込まない）
      if (!hidden()) t0 = now();
      let i = 1;   // EV[0]＝Scene 1 の背景（上で出した）
      while (!quit && i < EV.length) {
        const c = clock();
        while (i < EV.length && EV[i].t <= c) { if (EV[i].k === 'end') { i = EV.length; break; } apply(EV[i]); i++; }
        if (i >= EV.length) break;
        syncAudio(false);
        const dt = hidden() ? 1e9 : Math.max(8, Math.min(250, EV[i].t - c));
        await new Promise((r) => { const tm = setTimeout(() => { wake = null; r(); }, dt); wake = () => { clearTimeout(tm); wake = null; r(); }; });
      }
      done = true;   // 最後まで見た（時計は表に出ている間だけ進む＝裏で最後まで進まない）または スキップを2度押しで確定した
      ov.classList.add('end'); await wait(calm() ? 0 : T.fadeOut);
    } finally { document.removeEventListener('visibilitychange', onVis); ov.remove(); busy = false; }
    return done;
  }
  // 2026-10-06：日本語の禁則（文字ごとの span は行の途中のどこでも折り返せてしまう＝「。」「、」などが行頭に1文字だけ落ちていた）。
  //  折り返さないまとまり（span.mpw＝white-space:nowrap）に分ける：行頭に置けない文字（句読点・閉じ括弧・小さい仮名・長音・…・―）は前の文字に、開き括弧は次の文字に付ける。
  //  段落の最後の1文字だけが次の行へ落ちないよう、最後のまとまりが1文字なら前のまとまりとつなぐ。本文は変えない
  const NO_HEAD = '。、，．・：；？！!?)）」』】〕〉》’”…‥―ー〜ゃゅょっぁぃぅぇぉゎャュョッァィゥェォヮヵヶ々', NO_TAIL = '(（「『【〔〈《‘“';
  function kinsoku(t) {
    const out = [];
    for (const ch of Array.from(String(t))) {
      const prev = out.length ? out[out.length - 1] : null;
      if (prev != null && (NO_HEAD.includes(ch) || NO_TAIL.includes(prev.slice(-1)))) out[out.length - 1] = prev + ch; else out.push(ch);
    }
    if (out.length > 3 && Array.from(out[out.length - 1]).length === 1) out.splice(-2, 2, out[out.length - 2] + out[out.length - 1]);
    return out;
  }
  root.MMPRO = fz({ SLIDES, LEGENDS, T, POS, units, kinsoku, revealMs, readMs, play, ready, readyOrTimeout, pageMs, schedule, sceneStarts, isBusy: () => busy });
})(typeof window !== 'undefined' ? window : globalThis);
