// =========================================================
// 2026-10-13 開発25（実ブラウザ・QA_E2E=1 のときだけ）：大会UI・正式サイコロ・施設のボイス・Chapter 1 の題字
//  D25-A：対戦前比較の能力の棒＝999 を 100% とした長さ（0 は空）・「対戦表にもどる」は無い・「対戦開始」で始まる（3サイズ）
//  D25-E：Chapter 1 のサイコロ＝正式の絵（skin 'official'）・止まった正面の目＝出目・1回の START で DICE_CUBE が1回・1.30秒で止まる
//  D25-F：施設の初回の説明（MMNPCE）がある訪問は入口の声を出さない（説明と声が重ならない）・説明のあとの再訪で1回だけ・研究所＝エリオット
//  D25-A2（残件A）：対戦前比較の固有スキルの説明は能力の枠に重ならない・全文（切り捨てなし）・語の途中で折り返さない・「対戦開始」の位置は従来どおり（3サイズ×ソラモ／ガウル）
//  D25-B2（残件B）：対戦表の試合結果の通知は題字の下＝表のマス（名前・○×・次の試合）を隠さない（3サイズ×6体／8体・実際の勝ち／負けは 375×667）
//  D25-G：中継カットの絵が見えてから題字（CHAPTER 1／はじまりの草原）が中央に1文字ずつ → 題字が消えてから地図の全景 → START。地図の上に題字（.rfw-title）は無い
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
const SIZES = [[375, 667], [390, 844], [430, 932]];

test('D25-A：対戦前比較の棒は 999＝100%（0 は空）・「対戦表にもどる」なし・「対戦開始」で始まる（3サイズ）', { skip: SKIP, timeout: 240000 }, async () => {
  for (const size of SIZES) {
    const p = await openPage({ size }); const pg = p.page;
    await H.newGame(pg, 'テスト');
    await pg.evaluate(() => { const m = mk(0); m.name = 'テスト'; Object.assign(m, { li: 0, po: 70, in: 100, hi: 999, ev: 500, de: 250 }); MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); MMP8.startTournament(S, m, 1, 7); save(); p9CompareScr(); });
    await pg.waitForSelector('.p9cmps .pcgo');
    await pg.waitForTimeout(900);   // 棒の伸びる動きが終わるまで
    const r = await pg.evaluate(() => {
      const L = [...document.querySelectorAll('.tb3 .pcb:not(.r)')].slice(0, 6);
      return { back: document.querySelectorAll('.pcback').length, txt: document.body.innerText.includes('対戦表にもどる'),
        pct: L.map((b) => b.querySelector('i').style.width), px: L.map((b) => [Math.round(b.querySelector('i').getBoundingClientRect().width), Math.round(b.getBoundingClientRect().width)]),
        go: (() => { const g = document.querySelector('.p9cmps .pcgo'); const rr = g.getBoundingClientRect(); return rr.bottom <= innerHeight && rr.top >= 0; })() };
    });
    assert.equal(r.back, 0, '「対戦表にもどる」のボタンは無い'); assert.equal(r.txt, false);
    assert.ok(r.go, '「対戦開始」は画面の中');
    const pc = (v) => `${+(v / 999 * 100).toFixed(2)}%`;
    assert.deepEqual(r.pct, [pc(0), pc(70), pc(100), '100%', pc(500), pc(250)], `999 基準の割合 ${r.pct}`);
    assert.equal(r.px[0][0], 0, '0 は空の棒');
    assert.ok(Math.abs(r.px[3][0] - r.px[3][1]) <= 3, `999 は棒いっぱい ${r.px[3]}`);
    assert.ok(Math.abs(r.px[1][0] / r.px[3][0] - 70 / 999) < 0.03, `70 は約7% ${r.px[1]}`);
    await pg.click('.p9cmps .pcgo');   // 2026-10-13 開発27（29）：1回の押下
    await pg.waitForFunction(() => !!document.getElementById('tvs') || !!document.getElementById('bt'), null, { timeout: 15000 });
  }
});

test('D25-E：正式サイコロ＝6面とも正式の絵・出目どおり（目の見た目はスクリーンショットで確認）・DICE_CUBE は1回・1.30秒（3サイズ×出目 1・4・6）', { skip: SKIP, timeout: 300000 }, async () => {
  for (const size of SIZES) {
    const p = await openPage({ size, worldCh1: true }); const pg = p.page;
    await H.newGame(pg, 'テスト');
    await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); save(); board(); });
    await pg.waitForSelector('#wbw #brollbtn');
    const idle = () => pg.waitForFunction(() => !bBusy && !MMDICE3D.isLocked() && !document.querySelector('.wb-pop,.chf-enc2,.mmtalk,.chdz,.d3z,.wbrelay'), null, { timeout: 30000 }).then(() => pg.waitForTimeout(300));
    await idle(); await pg.mouse.click(4, 300);
    for (const v of [1, 4, 6]) {
      await idle();
      const n0 = await pg.evaluate(() => MMAUDIO.playLog().filter((x) => x.name === 'DICE_CUBE').length);
      await pg.evaluate((v) => { const mr = Math.random; Math.random = () => (v - 0.5) / 6; document.getElementById('brollbtn').click(); Math.random = mr; }, v);
      await pg.waitForSelector('.d3z.off');
      const busy = await pg.evaluate(() => { const b = document.getElementById('brollbtn'); return !!(b && b.disabled) || bBusy; });
      assert.ok(busy, '回っている間は START を押せない');
      await pg.waitForTimeout(1360);
      const r = await pg.evaluate(() => {
        const z = document.querySelector('.d3z'); const cube = z && z.querySelector('.d3-f') && z.querySelector('.d3-f').parentElement;
        const faces = [...z.querySelectorAll('.d3-f')]; const bi = faces.map((f) => getComputedStyle(f).backgroundImage);
        return { off: z.classList.contains('off'), bi, last: MMDICE3D.lastTiming() };
      });
      assert.ok(r.off, '正式の絵（skin official）');
      assert.ok(r.bi.every((b) => /cube_1014s\/face_[1-6]\.webp/.test(b)), `6面とも正式の面の絵（2026-10-14 開発29：正式デザイン A・実機試遊③の対称版 cube_1014s）${r.bi}`);
      assert.deepEqual(r.last.values, [v]);
      assert.ok(r.last.lock > 1250 && r.last.lock < 1420, `1.30秒で止まる ${r.last.lock}`);
      await pg.waitForFunction(() => !document.querySelector('.d3z'), null, { timeout: 8000 });
      const se = await pg.evaluate((n0) => MMAUDIO.playLog().filter((x) => x.name === 'DICE_CUBE').slice(n0), n0);
      assert.equal(se.length, 1, 'DICE_CUBE は1回');
      assert.ok(/dice_1013\/dice_cube_throw_land\.ogg$/.test(se[0].src), se[0].src);
      assert.equal(await pg.evaluate(() => MMAUDIO.playLog().filter((x) => /^DICE_(THROW|LAND|ROLL|STOP)$/.test(x.name)).length), 0, '旧サイコロの音は鳴らない');
      for (let k = 0; k < 20; k++) { const b = await pg.$('.wb-pop button, .chsheet button, .mmtalk'); if (!b) break; await b.click().catch(() => {}); await pg.waitForTimeout(400); }
    }
  }
});

test('D25-F：初回の説明がある訪問は入口の声なし・説明のあとの再訪で1回だけ（牧場・研究所・アイテム屋・ベースキャンプ・市場）', { skip: SKIP, timeout: 240000 }, async () => {
  const p = await openPage({ size: H.SIZES.base, npc: true, karen: true }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'テスト'; MMP7.ensureProg(m); S.m = m; save(); lobby(); });
  await pg.mouse.click(4, 300); await pg.waitForFunction(() => MMAUDIO.voiceStatus().nick_hello === 'ready' && MMAUDIO.voiceStatus().elliot_hello_OPTIONAL === 'ready', null, { timeout: 15000 });
  const FAC = ['nick_hello', 'elliot_hello_OPTIONAL', 'berna_welcome', 'dan_hello', 'karen_welcome'];   // 施設の入口の声（会話の行の声＝フィナの「うん」などは説明の一部なので数えない）
  const voices = () => pg.evaluate((F) => MMAUDIO.playLog().filter((x) => x.kind === 'voice' && F.includes(x.name)).map((x) => x.name), FAC);
  const drain = async () => { for (let k = 0; k < 60; k++) { const t = await pg.$('.mmtalk:not(.mmtalk-out)'); if (!t) break; await H.finishTalk(pg); await pg.waitForTimeout(150); } };
  const visit = async (fn, label) => {
    const n0 = (await voices()).length;
    await pg.evaluate(fn); await pg.waitForTimeout(250);
    const talked = !!(await pg.$('.mmtalk:not(.mmtalk-out)'));
    await pg.waitForTimeout(500); const during = (await voices()).slice(n0);
    await drain(); await pg.waitForTimeout(700);
    const all = (await voices()).slice(n0);
    return { talked, during, all, label };
  };
  const CASES = [['farm', () => farm(), 'nick_hello'], ['lab', () => museum(), 'elliot_hello_OPTIONAL'], ['shop', () => shopScr(), 'berna_welcome'], ['basecamp', () => hall('t'), 'dan_hello'], ['market', () => market(), 'karen_welcome']];
  for (const [name, fn, vo] of CASES) {
    const first = await visit(fn, name + ' 1回目');
    assert.ok(first.talked, `${name}：初回の説明が出る`);
    assert.deepEqual(first.all, [], `${name}：初回の説明の訪問は入口の声なし ${JSON.stringify(first)}`);
    await pg.evaluate(() => lobby()); await pg.waitForTimeout(200);
    const again = await visit(fn, name + ' 再訪');
    assert.deepEqual(again.all, [vo], `${name}：再訪で1回 ${JSON.stringify(again)}`);
    const third = await visit(fn, name + ' 同じ訪問の中で描き直し');
    assert.deepEqual(third.all, [], `${name}：同じ訪問の中では繰り返さない`);
    await pg.evaluate(() => lobby()); await pg.waitForTimeout(200);
  }
  // 記録は施設の初回のフラグだけ（新しいセーブ項目なし）
  const keys = await pg.evaluate(() => Object.keys(S.npcFlags.first || {}).sort());
  assert.ok(['farm', 'lab', 'market', 'ranch', 'shop'].every((k) => keys.includes(k)), JSON.stringify(keys));
  // ボイス OFF なら再訪でも鳴らない
  await pg.evaluate(() => MMAUDIO.setVoice({ on: false }));
  const off = await visit(() => museum(), 'OFF');
  assert.deepEqual(off.all, []);
  await pg.evaluate(() => MMAUDIO.setVoice({ on: true }));
});

test('D25-G：題字は中継カットの絵が見えてから中央に1文字ずつ → 消えてから地図の全景 → START（3サイズ・視差を減らす設定は止めて表示）', { skip: SKIP, timeout: 300000 }, async () => {
  for (const [size, calm] of [[[375, 667], false], [[390, 844], false], [[430, 932], false], [[390, 844], true]]) {
    const p = await openPage({ size, worldCh1: true, intro: true }); const pg = p.page;
    if (calm) await pg.emulateMedia({ reducedMotion: 'reduce' });
    await p.ctx.route(/ch1_intro_overview\.webp/, async (r) => { await new Promise((ok) => setTimeout(ok, 700)); r.continue(); });
    await H.newGame(pg, 'テスト');
    await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); save(); });
    await pg.evaluate(() => {
      const R = window.__g = { rows: [] }; const t0 = performance.now();
      const tick = () => { const rl = document.querySelector('.wbrelay'), t = document.querySelector('.wbr-t'), img = document.querySelector('.wbr-img');
        const rt = t && t.getBoundingClientRect();
        R.rows.push({ ms: Math.round(performance.now() - t0), relay: !!rl, ton: !!(rl && rl.classList.contains('ton')), imgOk: !!(img && img.complete && img.naturalWidth), tOp: t ? +getComputedStyle(t).opacity : 0,
          ch: t ? [...t.querySelectorAll('i')].filter((i) => +getComputedStyle(i).opacity > 0.5).length : 0, cy: rt ? rt.top + rt.height / 2 : null,
          rfw: document.querySelectorAll('.rfw-title').length, intro: !!document.querySelector('#wbw.wb-intro'), start: !!(document.getElementById('brollbtn') && !document.getElementById('brollbtn').disabled) });
        if (R.rows.length < 900) requestAnimationFrame(tick); };
      requestAnimationFrame(tick); board();
    });
    await pg.waitForFunction(() => { const r = window.__g.rows; return r.length && r[r.length - 1].start && !r[r.length - 1].relay; }, null, { timeout: 30000 });
    const rows = await pg.evaluate(() => window.__g.rows);
    const tonAt = rows.find((r) => r.ton);
    assert.ok(tonAt && tonAt.imgOk, `題字は導入の絵が読めてから ${JSON.stringify(tonAt)}`);
    assert.ok(rows.filter((r) => r.ton && r.relay).every((r) => Math.abs(r.cy - size[1] / 2) < size[1] * 0.12), '題字は画面の中央付近');
    if (calm) assert.ok(rows.filter((r) => r.ton && r.tOp > 0.9).every((r) => r.ch === 16), '視差を減らす設定では最初から全部');
    else { const mid = rows.filter((r) => r.ton && r.relay && r.tOp > 0.9); assert.ok(mid.some((r) => r.ch > 0 && r.ch < 16) && mid.some((r) => r.ch === 16), '1文字ずつ出そろう'); }
    const firstIntro = rows.findIndex((r) => r.intro);
    assert.ok(firstIntro > 0, '地図の全景（intro）がある');
    const bad = rows.slice(firstIntro).filter((r) => r.tOp >= 0.05); assert.ok(!bad.length, `地図の全景の間は題字が見えない ${size} ${calm} ${JSON.stringify(bad.slice(0, 3))} ${JSON.stringify(rows[firstIntro - 1])}`);
    assert.ok(rows.every((r) => r.rfw === 0), '地図の上の大きな題字（.rfw-title）は無い');
    assert.ok(rows.findIndex((r) => r.start) > firstIntro, 'START はそのあと');
  }
});

async function toTour(pg, { sp = 0, rank = 1, stats = null } = {}) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate(({ sp, rank, stats }) => { const m = mk(sp); m.name = 'テストテスト'; Object.assign(m, stats || { li: 0, po: 70, in: 100, hi: 999, ev: 500, de: 250 }); MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); if (rank >= 2) { m.raise.ch = 2; MMP7.recordRankClear(S, m, rank - 1); } const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); if (!MMP8.startTournament(S, m, rank, 7).ok) throw new Error('start'); save(); }, { sp, rank, stats });
}

test('D25-A2：（2026-10-14 実機試遊⑯：比較画面は名前とスキル名だけ＝説明は出さない）スキル名は能力の枠に重ならない・「対戦開始」と数値は画面の中（3サイズ×ソラモ／ガウル）', { skip: SKIP, timeout: 300000 }, async () => {
  for (const size of SIZES) for (const sp of [0, 1]) {
    const p = await openPage({ size }); const pg = p.page;
    await toTour(pg, { sp });
    await pg.evaluate(() => p9CompareScr()); await pg.waitForSelector('.p9cmps .pcgo'); await pg.waitForTimeout(900);
    const r = await pg.evaluate(() => {
      const R = (e) => e.getBoundingClientRect();
      const st = R(document.querySelector('.tb3 .tbst')), go = R(document.querySelector('.pcgo'));
      const d = [...document.querySelectorAll('.tb3 .tbskd')], sn = [...document.querySelectorAll('.tb3 .tbskn')];
      const want = [MMP10M.skillText(S.m.sp).name];
      return { stT: st.top, goT: Math.round(go.top), goB: go.bottom, H: innerHeight, W: innerWidth,
        desc: d.length, names: sn.map((e) => ({ b: R(e).bottom, txt: e.textContent.replace(/^スキル/, '') })), want,
        vals: [...document.querySelectorAll('.tb3 .pcv')].map((e) => { const b = R(e); return b.left >= 0 && b.right <= innerWidth && b.bottom <= innerHeight; }),
        bars: [...document.querySelectorAll('.tb3 .pcb:not(.r) i')].map((i) => i.style.width) };
    });
    const tag = `${size.join('×')} sp${sp}`;
    assert.equal(r.desc, 0, `${tag}：説明は出さない`);
    for (const x of r.names) assert.ok(x.b <= r.stT - 2, `${tag}：スキル名（下端 ${x.b}）は能力の枠（上端 ${r.stT}）に重ならない`);
    assert.equal(r.names[0].txt, r.want[0], `${tag}：スキル名は正式のまま`);
    assert.ok(r.goB <= r.H && r.vals.every(Boolean), `${tag}：数値・ボタンは画面の中`);
    assert.equal(r.bars[3], '100%', `${tag}：999 は満タン`);
    assert.equal(await pg.$('.pcback'), null);
  }
});

test('D25-B2：試合結果の通知は表のマスを隠さない（3サイズ×6体／8体）・実際の勝ち／負けの直後（375×667）も観戦の帯と重ならない', { skip: SKIP, timeout: 400000 }, async () => {
  const cover = () => { const R = (e) => e && e.getBoundingClientRect(); const n = R(document.querySelector('.tb1 .p9tmsg')); if (!n) return null;
    return { n: [n.top, n.bottom], cells: [...document.querySelectorAll('.tb1g .tbrw, .tb1g .tbh, .tb1g .tbc')].map(R).filter((c) => c.bottom > n.top && c.top < n.bottom && c.right > n.left && c.left < n.right).length,
      band: (() => { const b = R(document.querySelector('.tbvsx .tvx-c')); return b ? b.top < n.bottom && b.bottom > n.top : false; })(), go: (() => { const g = R(document.querySelector('.tb1 .tbgo')); return g.top >= n.bottom || g.bottom <= n.top; })(),
      txt: document.querySelector('.tb1 .p9tmsg').textContent, scroll: document.documentElement.scrollHeight <= innerHeight + 1 && document.documentElement.scrollWidth <= innerWidth + 1 }; };
  for (const size of SIZES) for (const rank of [1, 2]) {
    const p = await openPage({ size }); const pg = p.page;
    await toTour(pg, { rank }); await pg.evaluate(() => p8TourScr('第1試合：勝ち！')); await pg.waitForSelector('.tb1 .p9tmsg'); await pg.waitForTimeout(450);
    const r = await pg.evaluate(cover);
    assert.equal(r.cells, 0, `${size.join('×')} ${rank === 1 ? '6体' : '8体'}：通知（${r.n}）は表のマスを隠さない`); assert.ok(r.go && r.scroll, '「対戦する」は隠れない・ページは伸びない');
  }
  for (const [mode, stats] of [['win', { li: 900, po: 900, in: 900, hi: 900, ev: 300, de: 900 }], ['lose', { li: 30, po: 10, in: 10, hi: 10, ev: 1, de: 1 }]]) {
    const p = await openPage({ size: [375, 667], tourfx: true }); const pg = p.page;
    await toTour(pg, { stats }); await pg.evaluate(() => p8TourScr()); await pg.waitForSelector('.tb1 .tbgo'); await pg.mouse.click(4, 4);
    await pg.evaluate(() => p8TourFight()); await pg.waitForSelector('#bt #go');
    for (let i = 0; i < 600; i++) { const s = await pg.evaluate(() => { const g = document.getElementById('go'); return !document.getElementById('bt') ? 'gone' : g && g.classList.contains('bk') ? 'bk' : g && !g.disabled ? 'go' : 'w'; }); if (s === 'gone') break; if (s === 'bk') { await pg.waitForTimeout(500); await pg.click('#go').catch(() => {}); } else if (s === 'go') await pg.click('#go').catch(() => {}); await pg.waitForTimeout(150); }
    await pg.waitForSelector('.tb1 .p9tmsg', { timeout: 30000 }); await pg.waitForTimeout(600);
    const r = await pg.evaluate(cover);
    assert.match(r.txt, mode === 'win' ? /第1試合：勝ち/ : /第1試合：負け/, '通知の文は従来どおり');
    assert.equal(r.cells, 0, `${mode}：通知は表のマスを隠さない`); assert.equal(r.band, false, `${mode}：中央の観戦の帯と重ならない`); assert.ok(r.go, '「対戦する」は隠れない');
  }
});
