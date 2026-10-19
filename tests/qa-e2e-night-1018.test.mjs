// 2026-10-18 夜間 GO：PHASE 1 の修正の実ブラウザテスト（390×844）
//  NT-B1（B02・B03）：ライバルに負けた＝LOSE の曲（5.0秒）を最後まで・悲しい声は結果の画面に居るときだけ1回・曲のあとに次の画面の曲（Chapter）が鳴る（もどるを待つ間に無音の穴を作らない）
//  NT-B2（B03）：LOSE の曲の途中で「もどる」を押す（rjlock なし）＝悲しい声は鳴らない（ボードで遅れて鳴らない）
//  NT-B3（B06）：ライバルの遭遇＝フィナの一言のあとにリュウの正式ボイス 008 → 006（字幕＝声の書き起こし）
//  NT-B4（PHASE 2）：本編の盤の歩行＝walk_1018（止まると正面 front_2・歩く間は 1018 のコマ）
import test from 'node:test'; import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';
const SKIP = H.skipReason();
let L = null;
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });
const OPEN = []; const openPage = async (o) => { const p = await L.open(o); OPEN.push(p); return p; };
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close().catch(() => {}); });
async function settle(pg, ms = 60000) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await pg.$('.mmtalk:not(.mmtalk-out)')) { await H.finishTalk(pg); continue; } if (await pg.evaluate(() => !bBusy && !document.querySelector('.wbrelay,.wb-pop,.chf-enc2,.d3z'))) break; await pg.waitForTimeout(300); } await pg.waitForTimeout(400); }
async function toWorld(pg, stats, flags) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate(([st, fl]) => { const m = mk(0); m.name = 'ソラ'; if (st) Object.assign(m, st); MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); S.m.raise.field.introSeen = true; if (fl) { S.npcFlags = S.npcFlags || {}; S.npcFlags.story = fl; } save(); board(); }, [stats || null, flags || null]);
  await pg.waitForSelector('#wbw #brollbtn'); await settle(pg);
}
const toRival = (pg) => pg.evaluate(() => { const r = S.m.raise, c = r.field.core; r.node = 'RIVAL'; c.node = 'RIVAL'; c.trail.push('RIVAL'); c.moveLeft = 0; c.back = null; c.exclude = null; r.pend = { stage: 'resolve' }; save(); board(); });
async function surrender(pg) {
  await pg.waitForSelector('#bt #m1 img', { timeout: 40000 });
  await pg.waitForFunction(() => { const g = document.getElementById('go'); return g && !g.disabled; }, null, { timeout: 30000 });
  for (let k = 0; k < 2; k++) { await pg.click('#sur', { force: true }).catch(() => {}); await pg.waitForTimeout(320); }
  await pg.waitForFunction(() => { const b = document.getElementById('ban'); return b && /LOSE/.test(b.textContent); }, null, { timeout: 30000 });
}
const WEAK = { li: 60, po: 10, in: 10, hi: 10, ev: 1, de: 1 };

test('NT-B1：LOSE の曲を最後まで → 悲しい声1回（結果の画面で）→ 次の画面の曲が鳴る（無音の穴なし）', { skip: SKIP, timeout: 240000 }, async () => {
  const p = await openPage({ worldCh1: true, npc: true, rjlock: true }); const pg = p.page;
  await toWorld(pg, WEAK); await toRival(pg); await surrender(pg);
  const v0 = await pg.evaluate(() => MMAUDIO.voiceLog().length), t0 = Date.now(), rows = [];
  while (Date.now() - t0 < 8000) { await pg.waitForTimeout(250); rows.push(await pg.evaluate(() => { const s = MMAUDIO.status(); return { t: 0, scene: s.scene, playing: s.playing, bt: !!document.getElementById('bt'), v: (MMAUDIO.voicePlaying() || {}).id || null }; })); rows[rows.length - 1].t = Date.now() - t0; }
  const lose = await pg.evaluate(() => MMAUDIO.playLog().filter((x) => x.name === 'BATTLE_LOSE').slice(-1)[0]);
  assert.ok(lose && lose.dur >= 4950, `LOSE の曲は 5.0秒を最後まで（${lose && lose.dur}ms）`);
  const sad = rows.filter((r) => r.v === 'cry_solamo_sad'); assert.ok(sad.length >= 1 && sad.every((r) => r.bt), '悲しい声は結果の画面に居るあいだ');
  const firstMusic = rows.find((r) => r.playing && r.scene === 'CHAPTER_1'); assert.ok(firstMusic && firstMusic.bt && firstMusic.t < 7500, `もどるを待つ間に次の曲（${JSON.stringify(firstMusic)}）`);
  assert.equal(await pg.evaluate((n) => MMAUDIO.voiceLog().slice(n).filter((x) => x.id === 'cry_solamo_sad' && x.result === 'play').length, v0), 1);
  await pg.click('#go'); await pg.waitForTimeout(1500);
  assert.deepEqual(await pg.evaluate(() => [MMAUDIO.status().scene, MMAUDIO.status().playing]), ['CHAPTER_1', true], 'ボードへ戻っても同じ曲のまま（鳴らし直さない）');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('NT-B2：LOSE の途中で「もどる」＝悲しい声はボードで遅れて鳴らない', { skip: SKIP, timeout: 240000 }, async () => {
  const p = await openPage({ worldCh1: true, npc: true }); const pg = p.page;
  await toWorld(pg, WEAK); await toRival(pg); await surrender(pg);
  const v0 = await pg.evaluate(() => MMAUDIO.voiceLog().length);
  await pg.waitForTimeout(1200); await pg.click('#go'); await pg.waitForTimeout(6500);
  const vl = await pg.evaluate((n) => MMAUDIO.voiceLog().slice(n), v0);
  assert.equal(vl.filter((x) => /^cry_/.test(x.id) && x.result === 'play').length, 0, `ボードで悲しい声が鳴らない ${JSON.stringify(vl)}`);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('NT-B3：ライバルの遭遇＝フィナの一言のあとリュウの正式ボイス 008 → 006・字幕は書き起こしどおり', { skip: SKIP, timeout: 240000 }, async () => {
  const p = await openPage({ worldCh1: true, npc: true, story: true }); const pg = p.page;
  await toWorld(pg, WEAK, { tut_turns_w: 1 }); const v0 = await pg.evaluate(() => MMAUDIO.voiceLog().length);
  await toRival(pg);
  const seen = []; const t0 = Date.now();
  while (Date.now() - t0 < 60000 && !(await pg.$('#bt'))) {
    const s = await pg.evaluate(() => (document.querySelector('.mmtalk:not(.mmtalk-out)') && window.MMNPC && MMNPC.state() ? { npc: MMNPC.state().npc, t: document.querySelector('.mmtalk-text').textContent } : null));
    if (s && (!seen.length || seen[seen.length - 1].t !== s.t)) seen.push(s);
    if (s) { await pg.waitForTimeout(700); await pg.click('.mmtalk:not(.mmtalk-out)', { force: true }).catch(() => {}); }
    await pg.waitForTimeout(250);
  }
  const ryu = seen.filter((x) => x.npc === 'ryu').map((x) => x.t);
  const L = await pg.evaluate(() => [MMAUDIO.voiceLine('ryu_008'), MMAUDIO.voiceLine('ryu_006')]);
  assert.ok(ryu.includes(L[0]) && ryu.includes(L[1]), `リュウの字幕＝書き起こし ${JSON.stringify(seen)}`);
  const fi = seen.findIndex((x) => x.npc === 'fina'), ri = seen.findIndex((x) => x.npc === 'ryu'); assert.ok(fi >= 0 && fi < ri, 'フィナの一言のあと');
  const played = await pg.evaluate((n) => MMAUDIO.voiceLog().slice(n).filter((x) => x.result === 'play').map((x) => x.id), v0);
  assert.ok(played.includes('ryu_008') && played.includes('ryu_006'), `声が鳴った ${played}`);
  assert.ok(await pg.$('#bt'), 'そのままバトル');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('NT-B4：本編の盤の歩行は walk_1018（止まると正面・歩く間は 1018 のコマ）', { skip: SKIP, timeout: 240000 }, async () => {
  const p = await openPage({ worldCh1: true }); const pg = p.page;
  await toWorld(pg); await pg.waitForTimeout(800);
  assert.deepEqual(await pg.evaluate(() => [...document.querySelectorAll('.rfw-mon img.wk.on')].map((i) => i.getAttribute('src'))), ['./assets/monsters/walk_1018/solamo/front_2.webp']);
  await pg.evaluate(() => { window.__seen = new Set(); const el = document.querySelector('.rfw-mon'); new MutationObserver(() => { const on = el.querySelector('img.wk.on'); if (on) window.__seen.add(on.getAttribute('src')); }).observe(el, { attributes: true, subtree: true, attributeFilter: ['class'] }); });
  await pg.click('#brollbtn'); await settle(pg);
  const seen = await pg.evaluate(() => [...window.__seen]);
  assert.ok(seen.length >= 3 && seen.every((s) => /walk_1018\/solamo\//.test(s)), seen.join(' '));
  const ar = await pg.evaluate(() => [...document.querySelectorAll('.rfw-mon img.wk')].every((i) => !i.naturalWidth || i.style.aspectRatio === `${i.naturalWidth} / ${i.naturalHeight}`));
  assert.ok(ar, '歩行のコマの縦横比は絵のまま');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
