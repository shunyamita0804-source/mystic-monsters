// =========================================================
// プロローグ A〜E（2026-10-03 品質向上。window.MMPRO）：新しいゲームの最初に1回（名前登録＝聖獣士登録の前）。
//  背景を大きく → 短いナレーションが画面の下から1行ずつ浮かび上がる → 読み終わる少し前から次の背景へクロスフェード → E のあと本編のミストリアへ。
//  文字は画像に焼き込まない（HTML の別の層）。タップ：表示中の文章をすぐ全部出す → もう一度で次へ（0.45秒未満の連打は無視＝誤タップで何枚も飛ばない）。
//  「スキップ」は2度押し。背景の画像が5枚そろうまでは出さない（ready()。2026-10-03 に A・B の正式画像を受け取り、5枚そろった）。
//  役割（2026-10-03 ユーザー確認）：A＝世界と聖獣・約百年前の第一次大災厄と英雄・聖獣士の制度／B＝五年前の第二次魔物災害に、三人のレジェンドとそれぞれの聖獣が共に立ち向かう
//   （三人＋三体はすべて味方。いまも存命）／C＝五年後の現在・平和と繁栄・ミストリアの全盛／D＝各地から聖獣士がミストリアへ・主人公もその一人／E＝ミストリアに到着
// =========================================================
(function (root) {
  'use strict';
  const fz = Object.freeze, P = './assets/prologue/';
  const SLIDES = fz([
    fz({ id: 'A', bg: P + 'prologue_a.webp', pages: fz([
      fz(['この世界には、', '人と共に生きる不思議な生命――', '『聖獣』がいる。', '', '人々は彼らと暮らし、', '時にその力を借りながら、', '長い歴史を歩んできた。']),
      fz(['今から、およそ百年前――。', '', '大陸全土を覆う、', 'かつてない災厄が起きた。', '', 'その脅威に立ち向かったのは、', '一人の英雄と、一体の聖獣。', '長い戦いの末、', '災厄は退けられた。']),
      fz(['この出来事を境に、', '聖獣と共に戦う者たちの制度は整えられ、', 'やがて『聖獣士』という道が', '広く知られるようになった。', '', 'その仕組みは、いまの', '聖獣士管理局へと受け継がれている。']),
    ]) }),
    fz({ id: 'B', bg: P + 'prologue_b.webp', pages: fz([
      fz(['それから時は流れ――', '五年前。', '', '再び、', '大きな魔物災害が人々を襲った。']),
      fz(['その危機に立ち向かったのは、', 'ミストリアを拠点とする', '三人の聖獣士と、', 'それぞれの聖獣たちだった。', '', '三人と三体は力を合わせ、', '災厄を退けた。']),
      fz(['彼らは今も、', '『レジェンド』として', '多くの聖獣士たちの', '憧れであり続けている。']),
    ]) }),
    fz({ id: 'C', bg: P + 'prologue_c.webp', pages: fz([
      fz(['三人のレジェンドの活躍から、五年。', '', '災害は収まり、', '世界は再び平和と繁栄を取り戻した。', '', 'なかでもミストリアは、', '聖獣士たちが集う街として', 'かつてない賑わいを見せていた。']),
    ]) }),
    fz({ id: 'D', bg: P + 'prologue_d.webp', pages: fz([
      fz(['各地から、', '新たな出会いと強さを求めて', '多くの聖獣士がこの街を目指す。', '', 'そして――', '', 'あなたもまた、', 'その一人だった。']),
    ]) }),
    fz({ id: 'E', bg: P + 'prologue_e.webp', pages: fz([
      fz(['アステリア地方――', '大都市、ミストリア。', '', 'ここには、', '聖獣を育てるための施設と、', '腕を競うための舞台が集まっている。']),
      fz(['正式な聖獣士として', '新たな一歩を踏み出すため、', '', 'あなたは今、', 'この街へやってきた。', '', 'あなたと聖獣たちの物語は――', 'ここから始まる。']),
    ]) }),
  ]);
  /** 時間（ms）：1行が入ってくる間隔（文字数で少し伸ばす）・読み終わってからの余韻・背景のクロスフェード・最後の余韻とフェードアウト
   *  enter＝1行が画面の下から決まった位置まで上がる時間、shift＝前の行が1行ぶん上へ送られる時間、pageOut＝ページの終わりに文章が上へ抜けて消える時間 */
  const T = fz({ lineBase: 640, perChar: 40, emptyLine: 300, hold: 1900, cross: 1200, startHold: 700, endHold: 1600, fadeOut: 900, tapGuard: 450,
    enter: 1500, shift: 1100, fast: 420, pageOut: 650 });
  /** 文章の位置（画面の高さに対する割合）：新しい行が落ち着く位置（rest）・入ってくる前に待っている位置（from＝画面の下の外）。
   *  前の行は上へ送られ、ページの最初の行はおよそ画面の中央より少し上まで上がる（2026-10-04 G1：1文字ずつのタイプ表示はやめた） */
  const POS = fz({ rest: 0.66, from: 1.04 });
  const calm = () => !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  let readyMemo = null, busy = false;
  function lineDelay(t) { return t ? T.lineBase + t.length * T.perChar : T.emptyLine; }
  /** 1ページの読む時間の目安（自動で進む時刻） */
  function pageMs(lines) { return lines.reduce((a, t) => a + lineDelay(t), 0) + T.hold; }
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
    const sleep = (ms) => new Promise((r) => { const t = setTimeout(() => { wake = null; r('time'); }, ms); wake = () => { clearTimeout(t); wake = null; r('tap'); }; });
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
    /** 1行の縦の位置（px）。transition はその都度（入ってくる行＝ゆっくり、送られる行＝少し速く） */
    const place = (p, y, ms) => { p.style.transition = ms ? `transform ${ms}ms cubic-bezier(.22,.61,.24,1)` : 'none'; p.style.transform = `translate3d(0,${Math.round(y)}px,0)`; };
    /**
     * 1ページ：全部の行を最初から全文で描いておき（画面の下の外で待つ）、1行ずつ下からゆっくり入ってきて上へ流れる。
     *  入ってきた行は rest の位置に落ち着き、前の行はその行の高さぶん上へ送られる。タップ＝残りの行もすぐ入れる
     */
    const showPage = async (lines) => {
      nar.innerHTML = lines.map((t) => `<p class="${t ? '' : 'sp'}">${t ? t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]) : '&nbsp;'}</p>`).join('');
      nar.classList.remove('out');
      const ps = [...nar.querySelectorAll('p')], H = nar.clientHeight || root.innerHeight || 800;
      const hs = ps.map((p) => p.offsetHeight || 30), rest = H * POS.rest, from = H * POS.from;
      ps.forEach((p) => place(p, from, 0));
      void nar.offsetHeight;   // 待っている位置を先に確定（下から入ってくる動きにする）
      const layout = (k, msNew, msOld) => {   // 0〜k 行目を入れた状態：k 行目の下端が rest。上の行は積み上がる
        let y = rest;
        for (let i = k; i >= 0; i--) { y -= hs[i]; place(ps[i], y, i === k ? msNew : msOld); ps[i].classList.add('on'); }
      };
      fullNow = calm();
      for (let i = 0; i < ps.length && !quit; i++) {
        if (fullNow) { layout(ps.length - 1, calm() ? 0 : T.fast, calm() ? 0 : T.fast); break; }
        layout(i, T.enter, T.shift);
        const r = await sleep(lineDelay(lines[i])); if (r === 'tap') { fullNow = true; layout(ps.length - 1, T.fast, T.fast); break; }
      }
      if (quit) return;
      await sleep(fullNow ? 60000 : T.hold);   // 全部出たら：タップで次へ（自動でも少しの余韻で次へ）
    };
    /** ページの終わり：文章はそのまま上へ少し流れながら消える（上の端で急に切れない） */
    const pageOut = async () => {
      if (calm()) { nar.classList.add('out'); return; }
      [...nar.querySelectorAll('p.on')].forEach((p) => { const m = /translate3d\(0,(-?\d+)px/.exec(p.style.transform); place(p, (m ? +m[1] : 0) - 70, T.pageOut); });
      nar.classList.add('out'); await wait(T.pageOut);
    };
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
      done = true;   // 最後まで見た（または スキップを2度押しで確定した）
      ov.classList.add('end'); await wait(calm() ? 0 : T.fadeOut);
    } finally { ov.remove(); busy = false; }
    return done;
  }
  root.MMPRO = fz({ SLIDES, T, POS, play, ready, readyOrTimeout, pageMs, isBusy: () => busy });
})(typeof window !== 'undefined' ? window : globalThis);
