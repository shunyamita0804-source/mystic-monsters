// =========================================================
// QA（実ブラウザ）：2026-10-04 PHASE G（実機試遊の違和感の修正）
//  G-A：新しいゲーム → プロローグの途中で終了（再読み込み）→ 次に開いてもプロローグが出る（「見た」の記録は最後まで見たときだけ）
//  G-B：プロローグの文章は1文字ずつのタイプ表示をしない（各行は最初から全文・下から入って上へ流れる）
//  G-C：開始ボタン → プロローグの間に、旧い見出し（金枠の「ミスティックモンスターズ」）が1フレームも見えない
//  ほかの項目（D〜M）は、同じファイルの後ろに足す
//  Playwright / Chromium が無い環境では省略（skip）する。
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
let L = null;
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });
const OPEN = [];
const openPage = async (o) => { const p = await L.open(o); OPEN.push(p); return p; };
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close().catch(() => {}); });
const T = (name, fn) => test(name, { skip: SKIP }, fn);
const SIZES = [[390, 844], [375, 667]];

/** 毎フレーム、旧い見出し（h1）が画面に見えているかを記録する（全画面の幕に覆われているときは数えない） */
const watchH1 = (pg) => pg.evaluate(() => {
  window.__h1 = []; const cover = '.mmpro,.p11cover,.tveil.on,.mmtscr,.p11reg';
  const tick = () => {
    const h = document.querySelector('h1'); const vis = !!h && getComputedStyle(h).display !== 'none' && h.getBoundingClientRect().height > 0;
    if (vis && !document.querySelector(cover)) window.__h1.push(performance.now());
    if (window.__h1w !== false) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

for (const size of SIZES) {
  T(`G-A（${size.join('×')}）：プロローグの途中で終了 → 再読み込み → 開始ボタン → プロローグがもう一度出る（見た記録は付かない）`, async () => {
    const p = await openPage({ size, prologue: true }); const pg = p.page;
    await pg.click('.p15start');
    await pg.waitForSelector('.mmpro .mmpro-nar p.on', { timeout: 20000 });
    await pg.waitForTimeout(1800);
    const mid = await H.storedSave(pg);
    assert.ok(mid && mid.playerNamePending, '新しいゲームは保存済み（名前はまだ）');
    assert.ok(!(mid.npcFlags && mid.npcFlags.prologue), '途中では「見た」を保存しない');
    await pg.reload(); await pg.waitForFunction(() => typeof window.MMP8 === 'object' && typeof S === 'object');
    await pg.click('.p15start');
    await pg.waitForSelector('.mmpro .mmpro-nar p.on', { timeout: 20000 });
    assert.equal(await pg.evaluate(() => !!document.querySelector('#p11nm')), false, '名前登録へ飛ばない');
    // 最後まで（スキップの確定）→ 記録
    await pg.click('.mmpro-skip'); await pg.waitForTimeout(400); await pg.click('.mmpro-skip');
    await pg.waitForSelector('#p11nm', { timeout: 20000 });
    assert.equal((await H.storedSave(pg)).npcFlags.prologue, 1, 'スキップを確定したら記録');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });

  T(`G-B・G-C（${size.join('×')}）：タイプ表示なし（行は最初から全文・下から入って上へ）。開始 → プロローグの間に旧い見出しが出ない`, async () => {
    const p = await openPage({ size, prologue: true }); const pg = p.page;
    await watchH1(pg);
    await pg.click('.p15start');
    await pg.waitForSelector('.mmpro .mmpro-nar p', { timeout: 20000 });
    // 各行の文字と位置を細かく記録する
    const log = await pg.evaluate(async () => {
      const out = []; const t0 = performance.now();
      while (performance.now() - t0 < 5200) {
        const ps = [...document.querySelectorAll('.mmpro .mmpro-nar p')];
        out.push(ps.map((q) => ({ t: q.textContent, y: q.getBoundingClientRect().top })));
        await new Promise((r) => requestAnimationFrame(r));
      }
      return out;
    });
    const page0 = log.filter((f) => f.length && f[0].t === log[0][0].t);
    const full = page0[0].map((x) => x.t);
    for (const f of page0) f.forEach((x, i) => assert.equal(x.t, full[i], `行 ${i} は最初から全文（タイプ表示なし）`));
    const H0 = size[1];
    const first = page0.map((f) => f[0].y);
    assert.ok(first[0] >= H0 * 0.9, `1行目は画面の下の外で待つ（${Math.round(first[0])}）`);
    const minY = Math.min(...first);
    assert.ok(minY < H0 * 0.66 && minY > H0 * 0.2, `下から上へ流れ、中央より上まで上がる（${Math.round(minY)}）`);
    for (let i = 1; i < first.length; i++) assert.ok(first[i] <= first[i - 1] + 0.5, '1行目は上へ動くだけ（戻らない）');
    await pg.evaluate(() => { window.__h1w = false; });
    assert.deepEqual(await pg.evaluate(() => window.__h1), [], '旧い見出し（h1）は1フレームも見えない');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

/** 画面に見えている常設 NPC（下の画面＝#app の中の立ち絵・吹き出し）の数 */
const visibleStands = (pg) => pg.evaluate(() => [...document.querySelectorAll('#app :is(.nst,.fmdan,.shopnpc,.fbub,.kbub,.gssay,.vgsay,.elsay)')]
  .filter((e) => { const c = getComputedStyle(e); const r = e.getBoundingClientRect(); return c.visibility !== 'hidden' && +c.opacity > 0.05 && r.width > 0 && r.height > 0; }).length);

for (const size of SIZES) {
  T(`G-D（${size.join('×')}）：街の案内の間は、通常の街のフィナ（立ち絵の案内窓）を出さない。フィナは手を振り続けない（アニメなし）。終わったら通常の案内へ戻る`, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await pg.click('.p15start'); await pg.waitForSelector('#p11nm'); await pg.fill('#p11nm', 'テスト'); await pg.click('[onclick*="p11NameGo"]');
    await pg.waitForSelector('.mmtalk:not(.mmtalk-out)');
    for (let i = 0; i < 6; i++) {
      await pg.waitForTimeout(150);
      assert.equal(await visibleStands(pg), 0, '会話の間、下の街のフィナは見えない（フィナは1人）');
      const s = await pg.evaluate(() => ({ anim: MMNPC.animState().running, big: !!document.querySelector('.mmtalk.mmtalk-big'), ev: document.documentElement.dataset.mmev }));
      assert.deepEqual(s, { anim: false, big: true, ev: '1' }, '手を振るアニメのループは無い・大型の会話窓・イベントの表示モード');
    }
    await H.finishTalk(pg); await pg.waitForTimeout(600);
    assert.equal(await pg.evaluate(() => document.documentElement.dataset.mmev || null), null, 'イベントの表示モードは終わる');
    assert.equal(await visibleStands(pg), 1, '会話のあと通常の街のフィナ（案内窓）が戻る');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });

  T(`G-E・G-F（${size.join('×')}）：施設の初回イベント（牧場・研究所）の間は常設 NPC を隠し、下の画面を押せない。終わったら常設 NPC が戻る`, async () => {
    const save = { v: 6, y: 1000, mo: 4, wk: 1, g: 900, box: [], m: null, playerName: 'テスト', npcFlags: { finaIntro: 1, prologue: 1, karenIntro: 1 } };
    const p = await openPage({ size, npc: true, save }); const pg = p.page;
    await pg.evaluate(() => p8Resume()); await pg.waitForSelector('.map.town');
    for (const [go, sel] of [['farm()', '.rnnick'], ['museum()', '.labnpc']]) {
      await pg.evaluate((g) => eval(g), go);
      await pg.waitForSelector('.mmtalk:not(.mmtalk-out)', { timeout: 10000 });
      await pg.waitForTimeout(500);
      assert.equal(await visibleStands(pg), 0, `${go}：会話の間、常設の NPC・吹き出しは見えない`);
      const pe = await pg.evaluate(() => getComputedStyle(document.querySelector('#app')).pointerEvents);
      assert.equal(pe, 'none', '下の画面は押せない');
      await H.finishTalk(pg); await pg.waitForTimeout(600);
      assert.ok(await pg.evaluate((s) => { const e = document.querySelector('#app ' + s); return !!e && getComputedStyle(e).visibility !== 'hidden' && +getComputedStyle(e).opacity > 0.9; }, sel), `${go}：会話のあと常設の NPC が戻る`);
      assert.equal(await pg.evaluate(() => getComputedStyle(document.querySelector('#app')).pointerEvents), 'auto', '下の画面はまた押せる');
      await pg.evaluate(() => lobby()); await pg.waitForSelector('.map.town');
    }
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

/** 新しいゲーム → 育成中の個体を作って Chapter 1 へ */
async function toChapter(pg) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); save(); board(); });
  await pg.waitForSelector('#chf .chf-bg');
}
const fieldIdle = (pg) => pg.waitForFunction(() => !bBusy && !MMCHD.isLocked() && !document.querySelector('.chpop,.chdz,.chf-enc,.chf-fina,.mmtalk'), null, { timeout: 20000 }).then(() => pg.waitForTimeout(250));

for (const size of SIZES) {
  T(`G-G（${size.join('×')}）：Chapter 開始の演出のあと、育成中のモンスターは急に出ず、少し間をおいて画面の下から開始地点へ入る。入り終わるまで START は押せない`, async () => {
    const p = await openPage({ size, intro: true }); const pg = p.page;
    await toChapter(pg);
    const tr = await pg.evaluate(async () => {
      const out = []; const t0 = performance.now();
      while (performance.now() - t0 < 12000) {
        const w = document.querySelector('#bmonw'), fw = document.querySelector('#chfw'); if (!w || !fw) break;
        const r = w.getBoundingClientRect(), op = +getComputedStyle(w).opacity;
        out.push({ y: r.top, op, intro: fw.classList.contains('chf-intro'), wait: fw.classList.contains('chf-monwait'), busy: !!bBusy, t: performance.now() - t0 });
        if (!fw.classList.contains('chf-intro') && !bBusy && out.length > 3 && !out[out.length - 2].busy) break;
        await new Promise((r) => requestAnimationFrame(r));
      }
      return out;
    });
    const after = tr.filter((x) => !x.intro);
    assert.ok(after.length > 5, '演出のあとの記録がある');
    const shown = after.filter((x) => x.op > 0.05 && !x.wait);
    const restY = shown[shown.length - 1].y;
    assert.ok(shown[0].y > restY + 120, `最初に見えたときは開始地点より下（${Math.round(shown[0].y)} → ${Math.round(restY)}）`);
    for (let i = 1; i < shown.length; i++) assert.ok(shown[i].y <= shown[i - 1].y + 1, '下から上へ入る（戻らない）');
    assert.ok(after.some((x) => x.wait), '演出が終わってから少しの間は出さない（急に出ない）');
    assert.ok(shown.filter((x) => x.y > restY + 2).every((x) => x.busy), '入り終わるまで START は押せない');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });

  T(`G-H・G-I（${size.join('×')}）：野生の遭遇で草むらの断片・旧い予兆が1フレームも出ない（正式のモンスター＝バトルの相手）。ライバルは道中（p5_0）で、大会の直前ではない`, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await toChapter(pg); await fieldIdle(pg);
    const sk = await pg.evaluate(() => { const g = MMCH.graphFor(S.m); const k = (id) => g.nodes[id] && (g.nodes[id].kind === 'rival' ? 'rival' : g.nodes[id].tile); return { p5_0: k('p5_0'), p14_0: k('p14_0'), rivals: g.order.filter((id) => k(id) === 'rival') }; });
    assert.deepEqual(sk.rivals, ['p5_0'], 'ライバルは p5_0 だけ'); assert.notEqual(sk.p14_0, 'rival', '大会会場の門前（p14_0）はライバルではない');
    await pg.evaluate(() => { window.__g = { frames: 0, grass: 0 }; const tick = () => { if (document.querySelector('.chf-rustle')) __g.grass++; if (document.querySelector('.chf-enc2')) __g.frames++; if (!document.querySelector('.chbat') && __g.n++ < 4000) requestAnimationFrame(tick); }; __g.n = 0; requestAnimationFrame(tick); });
    const id = await pg.evaluate(() => { const g = MMCH.graphFor(S.m), a = S.m.raise.field.nodeAssignments, id = g.order.find((x) => a[x] && a[x].t === 'battle' && a[x].bt === 'wild'); const r = S.m.raise; r.node = id; r.pend = { roll: 1, left: 0, stage: 'resolve' }; save(); board(); return id; });
    await pg.waitForSelector('.chf-enc2 .ce-mon', { timeout: 15000 });
    const enc = await pg.evaluate(() => ({ src: document.querySelector('.chf-enc2 .ce-mon').getAttribute('src'), band: document.querySelector('.chf-enc2 .ce-band').textContent, cut: !!document.querySelector('.chf-enc-art'), fs: MMCH.foeSpecies(S.m, battleFoeCount()) }));
    assert.equal(enc.band, 'ENCOUNTER'); assert.equal(enc.cut, false, '赤い刃の交差のカットインは出さない');
    await pg.waitForSelector('.chbat', { timeout: 15000 });
    const g = await pg.evaluate(() => window.__g);
    assert.ok(g.frames > 10, `遭遇の演出を見た（${g.frames}）`); assert.equal(g.grass, 0, '草むらの断片（.chf-rustle）は1フレームも出ない');
    await pg.evaluate(() => bBattleGo()); await pg.waitForSelector('#bt #m1 img', { timeout: 15000 });
    const bsrc = await pg.evaluate(() => document.querySelector('#bt #m1 img').getAttribute('src'));
    assert.equal(bsrc, enc.src, `遭遇で見せた相手（${enc.src}）＝バトルの相手（${id}）`);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

/** サイコロ：見た目の上で止まった瞬間（位置が3フレーム続けて同じ）から、消え始めるまでの記録 */
const watchStill = (pg) => pg.evaluate(() => {
  window.__st = { samples: [], stopAt: null, gone: false, prev: null, same: 0 };
  const snap = () => { const ov = document.querySelector('.chdz'); if (!ov) return null; const mv = ov.querySelector('.chdz-mv'), img = ov.querySelector('.chdz-img'), cs = (e) => (e ? getComputedStyle(e) : null);
    return { mv: cs(mv).transform, src: img && img.getAttribute('src'), cur: img && img.currentSrc, cls: img && img.className, rot: img && cs(img).transform, op: img && cs(img).opacity, kids: mv.children.length,
      glow: [...ov.querySelectorAll('.chdz-glow')].map((g) => cs(g).opacity).join(','), out: ov.classList.contains('out') }; };
  const tick = () => {
    const s = snap(), W = window.__st;
    if (!s) { if (W.stopAt != null) { W.gone = true; return; } requestAnimationFrame(tick); return; }
    const vis = getComputedStyle(document.querySelector('.chdz')).visibility !== 'hidden';
    if (W.stopAt == null && vis) { if (W.prev && W.prev.mv !== s.mv) W.moved = true; W.same = W.prev && W.prev.mv === s.mv ? W.same + 1 : 0; W.prev = s; if (W.moved && W.same >= 3) W.stopAt = performance.now(); }   // 投げて動いたあと、位置が3フレーム続けて同じ＝止まった
    if (W.stopAt != null) W.samples.push({ t: performance.now() - W.stopAt, ...s });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});
for (const v of [1, 2, 3]) {
  T(`G-L（出目 ${v}・初回＝画像の読み込みが遅い）：見た目の上で止まってから消えるまで、絵・表示中の画像・class・傾き・光・子要素が変わらない（出目の面＝${v}）`, async () => {
    const p = await openPage(); const pg = p.page;
    await p.ctx.route(/assets\/fields\/ch1a\/dice\//, async (r) => { await new Promise((ok) => setTimeout(ok, 350)); await r.continue(); });   // iPhone の初回に近い：サイコロの絵が遅れて届く
    await toChapter(pg); await fieldIdle(pg);
    await watchStill(pg);
    await pg.evaluate((v) => { window.__mr = Math.random; Math.random = () => ({ 1: 0.1, 2: 0.5, 3: 0.9 }[v]); }, v);
    await pg.click('#brollbtn');
    await pg.evaluate(() => { Math.random = window.__mr; });
    await pg.waitForFunction(() => window.__st.gone, null, { timeout: 20000 });
    const W = await pg.evaluate(() => window.__st);
    const steady = W.samples.filter((s) => !s.out);
    assert.ok(steady.length >= 10, `止まってから消え始めるまでのフレーム（${steady.length}）`);
    const f = steady[0];
    for (const s of steady) for (const k of ['mv', 'src', 'cur', 'cls', 'rot', 'op', 'kids', 'glow']) assert.equal(String(s[k]), String(f[k]), `止まって ${Math.round(s.t)}ms 後に ${k} が変わった（${f[k]} → ${s[k]}）`);
    assert.equal(f.src, `./assets/fields/ch1a/dice/dice_stop_${v}.webp`, '止まった絵＝出目の面');
    assert.ok(steady[steady.length - 1].t >= 900, `止まった姿を約1秒見せる（変わらないまま）（${Math.round(steady[steady.length - 1].t)}ms）`);
    assert.deepEqual(p.errors, []);
  });
}
