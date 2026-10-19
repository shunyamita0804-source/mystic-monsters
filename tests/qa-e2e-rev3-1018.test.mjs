// =========================================================
// 実ブラウザ：2026-10-18 REV3（iPhone 実機 QA の修正・正式採用の本編反映）
//  R3-B1（390×844・375×667）：通常の URL（フラグなし）の Chapter 1＝新歩行（walk_1018・7体の 5方向×4コマ）と C案カメラ・止まると正面（front_2）
//  R3-B2：通常の Chapter 2（従来の画面）＝新歩行（歩く間は後ろ姿・止まると正面）／撤去した ?qaWalk=old を付けても新歩行のまま（2026-10-19）
//  R3-B3（375×667・390×844・393×852）：体格（正式 F）＝ジオル＞ガウル＞ソラモ・HP の帯・技名・画面の左右に重ならない
//  R3-B4：本編の Chapter 1 の開始では鳴かない（intro:true。イベントの1回は qa-e2e-cry-1017 の CRY-B3）
//  R3-B5：特訓の初回の会話の背景＝特訓場（Farm の札の絵ではない）・特訓メニューの「クリア」の行が切れない（375×667）
//  R3-B6：QA のバトル技ステージに「実際に使うデータ」（モード・最初のコマ・sha256）が出る・通常の画面には出ない
//  R3-B7（opening:true）：初対面でフィナ 009 を頼む（1回）
//  QA_E2E=1 のときだけ実行（tests/e2e/harness.mjs）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
let L = null;
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });
const OPEN = [];
const openPage = async (o = {}) => { const p = await L.open(o); OPEN.push(p); return p; };
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close().catch(() => {}); });
const T = (name, fn) => test(name, { skip: SKIP, timeout: 600000 }, fn);
const idle = (pg) => pg.waitForFunction(() => !bBusy && !MMCHD.isLocked() && !document.querySelector('.wb-pop,.chf-enc2,.mmtalk,.chdz,.d3w'), null, { timeout: 30000 }).then(() => pg.waitForTimeout(300));
const LOG1 = { ch: 1, reachedGoal: true, turnsUsed: 14, turnLimit: 40, declined: false, tour: { rank: 0, place: 1, won: true, firstClear: true } };

T('R3-B1：通常の Chapter 1＝新歩行（7体）と C案カメラが既定・止まると正面', async () => {
  for (const size of [[390, 844], [375, 667]]) {
    const p = await openPage({ worldCh1: true, size }); const pg = p.page;
    await H.newGame(pg, 'テスト');
    await pg.evaluate(() => { const m = mk(1); m.name = 'ガウ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); save(); board(); });
    await pg.waitForSelector('#wbw #brollbtn'); await idle(pg);
    const a = await pg.evaluate(() => ({ qw: window.MMQAW && [MMQAW.active, MMQAW.new7, MMQAW.legacy], cam: MMWB.world() && MMWB.world().qa ? MMWB.world().qa().camMode : null,
      walk: document.querySelector('.rfw-mon')?.dataset.qawalk, on: [...document.querySelectorAll('.rfw-mon img.wk.on')].map((i) => i.getAttribute('src')), search: location.search }));
    assert.equal(a.search, '', 'フラグなしの URL');
    assert.deepEqual(a.qw, [true, true, false], '新歩行が既定');
    assert.equal(a.cam, 'c', 'C案カメラが既定');
    assert.equal(a.walk, '1018');   // 2026-10-18 夜間 GO：本編の既定の素材は walk_1018
    assert.deepEqual(a.on, ['./assets/monsters/walk_1018/gauru/front_2.webp'], `止まっている姿は正面（${size}）`);
    await pg.evaluate(() => { window.__mr = Math.random; Math.random = () => 0.99; });
    await pg.click('#brollbtn'); await pg.evaluate(() => { Math.random = window.__mr; });
    const seen = new Set(); const t0 = Date.now();
    while (Date.now() - t0 < 8000) { const s = await pg.evaluate(() => [...document.querySelectorAll('.rfw-mon img.wk.on')].map((i) => i.getAttribute('src'))); s.forEach((x) => seen.add(x)); if (await pg.evaluate(() => !bBusy && !MMCHD.isLocked() && !document.querySelector('.d3w'))) break; await pg.waitForTimeout(60); }
    assert.ok([...seen].some((x) => /walk_1018\/gauru\/(back|backd|side|front|frontd)_[1-4]\.webp/.test(x) && !/front_2/.test(x)), `歩く間は新歩行のコマ（${[...seen].join(' ')}）`);
    await idle(pg);
    assert.deepEqual(await pg.evaluate(() => [...document.querySelectorAll('.rfw-mon img.wk.on')].map((i) => i.getAttribute('src'))), ['./assets/monsters/walk_1018/gauru/front_2.webp'], '止まったら正面');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  }
});

async function toCh2(pg) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate((LOG1) => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; Object.assign(m.raise, { state: 'farm', ch: 2, log: [LOG1] }); m.rk = 1; S.br = 1; save(); hall('t'); }, LOG1);
  await pg.waitForSelector('.fm'); await pg.evaluate(() => prepScr()); await pg.waitForSelector('#app button[onclick="p7Depart(this)"]'); await pg.waitForTimeout(400); await pg.click('#app button[onclick="p7Depart(this)"]');
  await pg.waitForSelector('#chf .chf-bg'); await pg.waitForFunction(() => !document.querySelector('.chintro') && !bBusy, null, { timeout: 30000 }); await pg.waitForTimeout(500);
}
T('R3-B2：通常の Chapter 2（従来の画面）＝新歩行・止まると正面・歩くと後ろ姿／撤去した ?qaWalk=old でも新歩行', async () => {
  const p = await openPage(); const pg = p.page; await toCh2(pg);
  const on = () => pg.evaluate(() => [...document.querySelectorAll('#bmonw .chf-spr img.on')].map((i) => i.getAttribute('src')));
  assert.deepEqual(await on(), ['./assets/monsters/walk_1018/solamo/front_2.webp'], '止まっている姿は正面');
  await pg.evaluate(() => { window.__mr = Math.random; Math.random = () => 0.9; }); await pg.click('#brollbtn'); await pg.evaluate(() => { Math.random = window.__mr; });
  await pg.waitForFunction(() => document.querySelector('#bmonw.walk'), null, { timeout: 15000 }); await pg.waitForTimeout(200);
  assert.match((await on())[0], /walk_1018\/solamo\/back_[1-4]\.webp$/, '歩く間は後ろ姿');
  await pg.waitForFunction(() => !document.querySelector('#bmonw.walk') && !bBusy, null, { timeout: 30000 }); await pg.waitForTimeout(400);
  assert.deepEqual(await on(), ['./assets/monsters/walk_1018/solamo/front_2.webp'], '止まったら正面');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  const q = await openPage({ query: '?qaWalk=old' }); await toCh2(q.page);
  assert.deepEqual(await q.page.evaluate(() => [...document.querySelectorAll('#bmonw .chf-spr img.on')].map((i) => i.getAttribute('src'))), ['./assets/monsters/walk_1018/solamo/front_2.webp'], '?qaWalk=old を付けても新歩行（旧い静止の絵に戻らない）');
  assert.deepEqual(q.errors, []); assert.deepEqual(q.bad, []);
});

T('R3-B3：体格（正式 F）＝ジオル＞ガウル＞ソラモ・HP の帯／技名／画面の左右に重ならない（3サイズ）', async () => {
  for (const size of [[375, 667], [390, 844], [393, 852]]) {
    const p = await openPage({ size, stage: true, query: '?mmQaTrial=1' }); const pg = p.page;
    await H.newGame(pg, 'テスト');
    for (const [me, foe] of [[3, 0], [1, 3]]) {
      const r = await pg.evaluate(async ({ me, foe }) => {
        const old = document.getElementById('bt'); if (old) old.remove();
        const m = MMQA.makeMon(me); m.speed = 10; m.raise = { battle: { kind: 'practice', rank: 0, done: false, qa: true, snap: { g: S.g, wins: S.wins, br: S.br, rk: m.rk, fa: m.fa, st: m.st } } }; S.m = m;
        battleDress({ rank: 0, label: 'QA', name: '相手' }); battleFoeOnce(foe > 1 ? 0 : foe); TB_SKIP_INTRO = true; fight(0); battleDressDom();
        const A = MMARENA, T = MMTUNE, wait = (ms) => new Promise((r) => setTimeout(r, ms));
        const calm = () => { const g = document.getElementById('go'), v = document.querySelector('#bt .vs'), t = v ? getComputedStyle(v).transform : 'none', mm = /matrix\(([^,]+),/.exec(t); return g && !g.disabled && !g.classList.contains('bk') && !document.querySelector('#bt .mmskc') && (t === 'none' || (mm && Math.abs(+mm[1] - 1) < 0.001)); };
        for (let i = 0; i < 150 && !calm(); i++) await wait(100);
        const set = (s, sp) => { const mon = document.querySelector(`#bt #m${s} .mon`), img = mon.querySelector('.mma-idle'); img.src = A.idleSrc(sp); mon.style.setProperty('--mma-k', String((A.SCALE[sp] || 0.91) * T.sizeK(sp))); };
        set(0, me); set(1, foe); await wait(500);
        const R = (e) => e.getBoundingClientRect(), hud = R(document.querySelector('#bt .hpr')), W = innerWidth;
        skb(0, 0); await wait(60); const ban = R(document.querySelector('#bt .skb3'));
        return [0, 1].map((s) => { const sp = s ? foe : me, r = R(document.querySelector(`#bt #m${s} .mon .mma-idle`)), top = r.bottom - r.height * T.VIS_H[sp] / A.SCALE[sp];
          return { sp, h: r.bottom - top, hud: top - hud.bottom, ban: top - ban.bottom, l: r.left, r: W - r.right, k: T.sizeK(sp) }; });
      }, { me, foe });
      for (const x of r) { assert.ok(x.hud > 0 && x.ban > 0 && x.l >= 0 && x.r >= 0, `${size} 種族 ${x.sp}：${JSON.stringify(x)}`); }
      if (me === 3) assert.ok(r[0].h > r[1].h * 1.25, `ジオル（4）＞ソラモ（2）：${r[0].h} ${r[1].h}`); else assert.ok(r[1].h > r[0].h * 1.08, `ジオル（4）＞ガウル（3）：${r[1].h} ${r[0].h}`);
    }
    assert.deepEqual(p.errors, []);
  }
});

T('R3-B4：本編の Chapter 1（世界のボード）の開始では鳴かない（intro:true）', async () => {
  const p = await openPage({ worldCh1: true, intro: true }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); lobby(); });
  await pg.mouse.click(4, 300); await pg.waitForFunction(() => MMAUDIO.context() && MMAUDIO.context().state === 'running', null, { timeout: 10000 });
  await pg.evaluate(() => { MMNPC.close(); MMAUDIO.stopVoice(0); MMAUDIO.cryReset(); MMP8.depart(S, S.m, () => 0.37); save(); board(); });
  await pg.waitForSelector('#wbw #brollbtn'); await pg.waitForFunction(() => !MMWB.state().intro, null, { timeout: 40000 }); await pg.waitForTimeout(3000);
  assert.deepEqual(await pg.evaluate(() => MMAUDIO.voiceLog().filter((x) => x.cry).map((x) => x.id)), [], 'Chapter の開始では鳴き声を頼まない（俯瞰のあとも）');
  assert.ok(await pg.evaluate(() => typeof MMAUDIO.cryAfter === 'function'));
  assert.deepEqual(p.errors, []);
});

T('R3-B5：特訓の初回の会話の背景は特訓場（Farm の札の絵ではない）・メニューの「クリア」の行が切れない（375×667）', async () => {
  const p = await openPage({ size: [375, 667], npc: true }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate((LOG1) => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; Object.assign(m.raise, { state: 'farm', ch: 2, log: [LOG1] }); S.trainTix = 2; S.npcFlags.first = Object.assign(S.npcFlags.first || {}, { farm: 1 }); save(); hall('s'); }, LOG1);
  await pg.waitForSelector('.mmtalk-scenebg');
  assert.match(await pg.evaluate(() => document.querySelector('.mmtalk-scenebg').style.backgroundImage), /assets\/scenes\/train_po\.jpg/);
  await H.finishTalk(pg); await pg.waitForTimeout(500);
  const r = await pg.evaluate(() => [...document.querySelectorAll('.ds-s button.p12tc')].map((b) => { const br = b.getBoundingClientRect(), sm = b.querySelector('.rkt small').getBoundingClientRect(); return [Math.round(sm.bottom), Math.round(br.bottom)]; }));
  assert.equal(r.length, 5); for (const [sb, bb] of r) assert.ok(sb <= bb, `「クリア」の行がカードの中（${sb} ≤ ${bb}）`);
  assert.match(await pg.evaluate(() => document.querySelector('.ds-s .dtitle img').getAttribute('src')), /genshin\/face\.webp/, '見出しの旧い絵（修行の文字）を出さない');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

T('R3-B6：QA のバトル技ステージに実際のデータ（モード・最初のコマ・sha256）・通常の画面には出ない', async () => {
  const p = await openPage({ stage: true, query: '?mmQaTrial=1' }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  const ok = await pg.evaluate(() => { if (!MMQA.isOn()) MMQA.on('farm'); return MMQA.isOn() && MMQAS.open(1, 8); });
  assert.ok(ok, 'ガウル 08 フレアレイを開く');
  await pg.waitForFunction(() => { const e = document.getElementById('mmqas-info'); return e && /[0-9a-f]{12}/.test(e.textContent); }, null, { timeout: 20000 });
  const t = await pg.evaluate(() => { const e = document.getElementById('mmqas-info'); return { text: e.textContent, mode: e.dataset.mode, first: e.dataset.first }; });
  assert.equal(t.mode, 'コマ（2.5D の技アニメ）'); assert.match(t.first, /gauru_moves_1012\/16_01\.webp$/); assert.match(t.text, /修正 05/);
  const q = await openPage(); await H.newGame(q.page, 'テスト');
  assert.equal(await q.page.evaluate(() => !!document.getElementById('mmqas-info') || /データ：/.test(document.body.innerText)), false, '通常の画面には出ない');
});

T('R3-B7：新しいゲームの初対面でフィナ 009 の自己紹介（声を1回頼む）', async () => {
  const p = await openPage({ opening: true }); const pg = p.page;
  await pg.click('.p15start');
  await pg.waitForFunction(() => window.MMNPC && MMNPC.state() && /聖獣士登録をする予定/.test(MMNPC.state().full), null, { timeout: 30000 });
  await H.chooseTalk(pg, 'yes');
  for (let i = 0; i < 60; i++) { const f = await pg.evaluate(() => (window.MMNPC && MMNPC.state() ? MMNPC.state().full : '')); if (/はじめまして。私はフィナ。/.test(f)) break; await pg.waitForTimeout(450); await pg.click('.mmtalk:not(.mmtalk-out)', { force: true }).catch(() => {}); }
  assert.match(await pg.evaluate(() => MMNPC.state().full), /はじめまして。私はフィナ。/);
  const v = await pg.evaluate(() => MMAUDIO.voiceLog().filter((x) => x.id === 'fina_009').map((x) => x.result));
  assert.ok(v.length >= 1, `fina_009 を頼んだ（${JSON.stringify(v)}）`);
});
