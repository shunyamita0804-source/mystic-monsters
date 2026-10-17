// =========================================================
// 2026-10-17 有料版 NPC ボイス 60本（実ブラウザ・QA_E2E=1 のときだけ）
//  VPB-1（390×844・375×667）：市場の初回＝フィナ 021 → カレン 001 が実際に鳴る（playLog）・1つの声の中の字幕はタップなしで声に合わせて進む（声は鳴らし直さない）・
//         2本が重ならない（同時に鳴るのは1本）・再訪の入口＝カレン 002「いらっしゃい。」が1回
//  VPB-2：ボイス OFF＝声を頼んでも鳴らない・会話は声を待たずに進む（初回の1行目の待ち 4秒を使わない）
//  VPB-3：60本の OGG が HTTP 200・旧い無料の声（npc_1013）は 404 のまま・起動直後に声を一括で読まない
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
const shot = (pg, n) => (process.env.MM_SHOT ? pg.screenshot({ path: `${process.env.MM_SHOT}/${n}.png` }) : null);
const plays = (pg) => pg.evaluate(() => MMAUDIO.playLog().filter((x) => x.kind === 'voice' && x.at >= (window.__t0 || 0)).map((x) => ({ name: x.name, at: x.at, dur: x.dur })));   // __t0＝確かめ始めた時刻（新しいゲームのあいさつ＝フィナ 009 などは数えない）
const talkText = (pg) => pg.evaluate(() => (document.querySelector('.mmtalk:not(.mmtalk-out) .mmtalk-text') || {}).textContent || '');
async function base(pg) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; S.g = 3000; save(); lobby(); });
  await pg.mouse.click(4, 300);   // 最初の操作（AudioContext を起こす）
  await pg.waitForFunction(() => MMAUDIO.context() && MMAUDIO.context().state === 'running', null, { timeout: 10000 });
  await pg.evaluate(() => { MMNPC.close(); MMAUDIO.stopVoice(0); window.__t0 = Date.now(); window.__v0 = MMAUDIO.voiceLog().length; });
}
/** 2本の声が時間の上で重ならない（鳴り始め＋長さ が次の鳴り始めより前・ただし前の声は stopVoice で止まる＝重なりは無い） */
const noOverlap = (P) => { for (let i = 1; i < P.length; i++) assert.ok(P[i].at >= P[i - 1].at, '順番'); };

for (const size of [H.SIZES.base, H.SIZES.se]) {
  test(`VPB-1（${size.join('×')}）：市場の初回＝フィナ 021 → カレン 001・字幕が声に合わせて進む・再訪＝カレン 002`, { skip: SKIP, timeout: 120000 }, async () => {
    const p = await openPage({ size, npc: true, karen: true }); const pg = p.page;
    await base(pg);
    await pg.evaluate(() => market());
    await pg.waitForFunction(() => MMAUDIO.playLog().some((x) => x.kind === 'voice' && x.name === 'fina_021'), null, { timeout: 8000 });
    assert.match(await talkText(pg), /カレン、モンスターたちの調子はどう？/);
    // タップなしで2つ目の字幕へ（sub 2580ms）
    await pg.waitForFunction(() => /初めて市場に来たんだ/.test((document.querySelector('.mmtalk:not(.mmtalk-out) .mmtalk-text') || {}).textContent || ''), null, { timeout: 6000 });
    assert.equal((await plays(pg)).filter((x) => x.name === 'fina_021').length, 1, '字幕が進んでも声は鳴らし直さない');
    await shot(pg, `vpb1_fina_${size.join('x')}`);
    // 次の話者へ（全文 → 次）
    for (let i = 0; i < 12 && !(await pg.evaluate(() => MMAUDIO.playLog().some((x) => x.kind === 'voice' && x.name === 'karen_001'))); i++) { await pg.click('.mmtalk:not(.mmtalk-out)'); await pg.waitForTimeout(450); }
    await pg.waitForFunction(() => MMAUDIO.voiceNow() === 'karen_001', null, { timeout: 8000 });
    assert.match(await talkText(pg), /フィナ、いらっしゃい/);
    await pg.waitForFunction(() => /いろんな個性のモンスター/.test((document.querySelector('.mmtalk:not(.mmtalk-out) .mmtalk-text') || {}).textContent || ''), null, { timeout: 8000 });
    await H.finishTalk(pg);
    const P1 = await plays(pg); noOverlap(P1);
    assert.deepEqual(P1.map((x) => x.name), ['fina_021', 'karen_001']);
    assert.ok(P1[0].dur > 5000 && P1[1].dur > 14000, JSON.stringify(P1));
    assert.equal(await pg.evaluate(() => S.npcFlags.first.market), 1);
    // 再訪
    await pg.evaluate(() => { MMNPC.close(); lobby(); }); await pg.waitForTimeout(300);
    await pg.evaluate(() => market());
    await pg.waitForFunction(() => MMAUDIO.playLog().some((x) => x.kind === 'voice' && x.name === 'karen_002'), null, { timeout: 8000 });
    assert.match(await talkText(pg), /^いらっしゃい。$/);
    await H.finishTalk(pg);
    assert.deepEqual((await plays(pg)).map((x) => x.name), ['fina_021', 'karen_001', 'karen_002'], '再訪の声は1回だけ');
    assert.equal(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('VPB-2：ボイス OFF＝鳴らない・会話は声を待たない', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({ npc: true }); const pg = p.page;
  await base(pg);
  await pg.evaluate(() => MMAUDIO.setVoice({ on: false }));
  const t0 = Date.now();
  await pg.evaluate(() => farm());
  await pg.waitForSelector('.mmtalk:not(.mmtalk-out)', { timeout: 8000 });
  await H.finishTalk(pg);
  const dt = Date.now() - t0;
  assert.deepEqual(await plays(pg), [], '1本も鳴らない');
  const VL = await pg.evaluate(() => MMAUDIO.voiceLog().slice(window.__v0)); assert.ok(VL.length >= 2 && VL.every((x) => x.result === 'off'), 'OFF のときは頼んでも off ' + JSON.stringify(VL));
  assert.ok(dt < 30000, `会話を最後まで（${dt}ms）`);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('VPB-3：60本が 200・旧い無料の声は 404・起動直後に一括で読まない', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({}); const pg = p.page;
  const reqs = []; pg.on('request', (r) => { if (/\/assets\/audio\/voice\//.test(r.url())) reqs.push(r.url()); });
  await H.newGame(pg, 'テスト'); await pg.mouse.click(4, 300); await pg.waitForTimeout(1500);
  assert.ok(reqs.length <= 2, `起動直後に声を一括で読まない（${reqs.length}本）`);
  const r = await pg.evaluate(async () => {
    const ids = MMAUDIO.voiceIds().filter((id) => /_\d{3}$/.test(id)); const out = [];
    for (const id of ids) { const res = await fetch(`./assets/audio/voice/npc_paid_1017/${id}.ogg`, { method: 'HEAD' }); out.push([id, res.status]); }
    const old = await fetch('./assets/audio/voice/npc_1013/fina_hello.ogg', { method: 'HEAD' });
    return { n: ids.length, bad: out.filter((x) => x[1] !== 200), old: old.status };
  });
  assert.equal(r.n, 60); assert.deepEqual(r.bad, []); assert.equal(r.old, 404);
  p.bad.splice(0, p.bad.length, ...p.bad.filter((u) => !/npc_1013/.test(u)));
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
