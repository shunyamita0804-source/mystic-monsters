// =========================================================
// 2026-10-17 モンスターの鳴き声 14本（実ブラウザ・QA_E2E=1 のときだけ）＝配置設計（05_モンスターボイス配置設計）の A〜E
//  CRY-B1 A：市場で仲間入り（手に入れた！の演出）＝その子の正式ボイス・合体の誕生＝子の正式ボイス
//  CRY-B2 B：牧場でモンスターをタップ＝その子の正式ボイス・同じ子は10秒あける・描き直し／タブでは鳴らない
//  CRY-B3 C・D：Chapter の開始で歩いて入る＝連れている子の正式ボイス（4歩の音のあと）・野生の遭遇＝相手の正式ボイス（バトルに入る前）
//  CRY-B4 E：LOSE＝曲（5.0秒）のあとに自分の子の悲しみボイス・WIN は既定で鳴かない
//  CRY-B5 QA の試聴：鳴き声 14本・NPC ボイス 60本が1本ずつ鳴る（?mmQaTrial=1 のときだけ・通常のセーブを書き換えない）
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
const cries = (pg) => pg.evaluate(() => MMAUDIO.playLog().filter((x) => x.kind === 'voice' && /^cry_/.test(x.name)).map((x) => x.name));
const waitCry = (pg, id, ms = 6000) => pg.waitForFunction((x) => MMAUDIO.playLog().some((e) => e.kind === 'voice' && e.name === x), id, { timeout: ms });
async function start(pg, sp = 0) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate((sp) => { const m = mk(sp); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; S.g = 3000; save(); lobby(); }, sp);
  await pg.mouse.click(4, 300);
  await pg.waitForFunction(() => MMAUDIO.context() && MMAUDIO.context().state === 'running', null, { timeout: 10000 });
  await pg.evaluate(() => { MMNPC.close(); MMAUDIO.stopVoice(0); MMAUDIO.cryReset(); });
}

test('CRY-B1（A）：市場の仲間入り・合体の誕生＝その子の正式ボイスが1回', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({ got: true }); const pg = p.page;
  await start(pg);
  await pg.evaluate(() => gotShow({ name: 'ガウ', sp: 1 }));
  await waitCry(pg, 'cry_gauru_normal');
  await pg.waitForFunction(() => !document.querySelector('.mkgot'), null, { timeout: 6000 });
  assert.deepEqual(await cries(pg), ['cry_gauru_normal']);
  // 合体の誕生（育成完了2体・200G）
  await pg.evaluate(() => { MMAUDIO.cryReset(); const a = mk(0), b = mk(3); a.name = 'A'; b.name = 'B'; for (const x of [a, b]) { MMP7.ensureProg(x); x.raise = { done: true }; } S.m = a; S.box = [b]; save(); sel = [0, 1]; });
  await pg.evaluate(() => fuse());
  await pg.waitForFunction(() => MMAUDIO.playLog().filter((e) => e.kind === 'voice' && /^cry_/.test(e.name)).length >= 2, null, { timeout: 12000 });
  const c = await pg.evaluate(() => ({ last: MMAUDIO.playLog().filter((e) => /^cry_/.test(e.name)).slice(-1)[0].name, key: MMAUDIO.CRY_KEYS[S.m.sp] }));
  assert.equal(c.last, `cry_${c.key}_normal`, '子の種族の声');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('CRY-B2（B）：牧場のタップ＝その子の声・同じ子は10秒あける・描き直しでは鳴らない', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({}); const pg = p.page;
  await start(pg);
  await pg.evaluate(() => { const b = mk(3); b.name = 'ジオ'; MMP7.ensureProg(b); S.box = [b]; save(); farm(); });
  await pg.waitForSelector('#app>.rn'); await pg.waitForTimeout(500);
  assert.deepEqual(await cries(pg), [], '入っただけでは鳴かない');
  await pg.evaluate(() => rnPick(S.box[0].uid)); await waitCry(pg, 'cry_jiol_normal');
  await pg.waitForTimeout(1500);
  await pg.evaluate(() => rnPick(S.box[0].uid)); await pg.waitForTimeout(900);
  assert.equal((await cries(pg)).length, 1, '同じ子の連続タップは鳴かない');
  assert.equal(await pg.evaluate(() => MMAUDIO.voiceLog().slice(-1)[0].result), 'cool-mon');
  await pg.evaluate(() => farm('', 'e')); await pg.waitForTimeout(600);
  assert.equal((await cries(pg)).length, 1, 'タブを替えても鳴かない');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('CRY-B3（C・D）：Chapter の開始で歩いて入る＝連れている子・野生の遭遇＝相手（バトルの前）', { skip: SKIP, timeout: 180000 }, async () => {
  const p = await openPage({ intro: true }); const pg = p.page;
  await start(pg, 1);
  await pg.evaluate(() => { MMP8.depart(S, S.m, () => 0.37); save(); board(); });
  await waitCry(pg, 'cry_gauru_normal', 20000);
  const t = await pg.evaluate(() => { const L = MMAUDIO.playLog(), c = L.find((e) => e.name === 'cry_gauru_normal'), se = MMAUDIO.seLog(); return { cry: c.at, seMon: se.includes('MONSTER_ENTRY') }; });
  assert.ok(t.seMon, '4歩の音（MONSTER_ENTRY）のあと');
  // D：野生の遭遇（相手の種族の声）
  await pg.waitForTimeout(800);
  await pg.evaluate(() => { MMAUDIO.cryReset(); const g = MMCH.graphFor(S.m), a = S.m.raise.field.nodeAssignments; const id = g.order.find((x) => a[x] && a[x].t === 'battle' && a[x].bt === 'wild'); const r = S.m.raise; r.node = id; r.pend = { roll: 1, left: 0, stage: 'resolve' }; save(); board(); });
  await pg.waitForSelector('.chf-enc2', { timeout: 15000 });
  const foe = await pg.evaluate(() => MMAUDIO.CRY_KEYS[MMCH.foeSpecies(S.m, battleFoeCount())]);
  await waitCry(pg, `cry_${foe}_normal`);
  assert.equal(await pg.evaluate(() => !document.getElementById('bt')), true, 'バトルに入る前');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('CRY-B4（E）：LOSE の曲のあとに自分の子の悲しみボイス・WIN は既定で鳴かない', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({}); const pg = p.page;
  await start(pg, 2);
  const fight1 = async () => { await pg.evaluate(() => { MMP8.depart(S, S.m, () => 0.37); const g = MMCH.graphFor(S.m); Object.assign(S.m.raise, { node: g.goal, goal: true, pend: null }); S.m.raise.field.arrivalSeen = true; MMP8.startTournament(S, S.m, 0, 7); save(); p8TourFight(); }); await pg.waitForSelector('#bt #m0 .mon', { timeout: 20000 }); await pg.waitForTimeout(1200); };
  await fight1();
  await pg.evaluate(() => { MMAUDIO.cryReset(); window.__t = Date.now(); ban('LOSE', '#38b6ff'); });
  await pg.waitForTimeout(3000);
  assert.deepEqual(await cries(pg), [], 'LOSE の曲の間は鳴かない');
  await waitCry(pg, 'cry_nobiton_sad', 6000);
  const dt = await pg.evaluate(() => MMAUDIO.playLog().find((e) => e.name === 'cry_nobiton_sad').at - window.__t);
  assert.ok(dt >= 4900, `曲（5.0秒）のあと ${dt}ms`);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  const q = await openPage({}); const pq = q.page;
  await start(pq, 2);
  await pq.evaluate(() => { MMP8.depart(S, S.m, () => 0.37); const g = MMCH.graphFor(S.m); Object.assign(S.m.raise, { node: g.goal, goal: true, pend: null }); S.m.raise.field.arrivalSeen = true; MMP8.startTournament(S, S.m, 0, 7); save(); p8TourFight(); });
  await pq.waitForSelector('#bt #m0 .mon', { timeout: 20000 }); await pq.waitForTimeout(1200);
  await pq.evaluate(() => { MMAUDIO.cryReset(); ban('WIN!', '#ffd34d'); });
  await pq.waitForTimeout(5500);
  assert.deepEqual(await cries(pq), [], 'WIN は既定で鳴かない');
});

test('CRY-B5：QA の試聴＝鳴き声 14本・NPC ボイス 60本が1本ずつ鳴る・通常のセーブを書き換えない', { skip: SKIP, timeout: 300000 }, async () => {
  const p = await openPage({ query: '?mmQaTrial=1' }); const pg = p.page;
  await H.newGame(pg, 'テスト'); await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); farm(); });
  await pg.mouse.click(4, 300);
  const s0 = await pg.evaluate(() => localStorage.getItem('mr4v6'));
  await pg.waitForSelector('#mmqa-sw'); await pg.click('#mmqa-sw'); await pg.waitForSelector('#mmqa .qaud');
  await pg.click('#mmqa .qaud'); await pg.waitForSelector('#mmqa .qaudp .qcry');
  const n = await pg.evaluate(() => [document.querySelectorAll('#mmqa .qcry').length, document.querySelectorAll('#mmqa .qnpv').length]);
  assert.deepEqual(n, [14, 60]);
  const bad = [];
  for (const sel of ['.qcry', '.qnpv']) {
    const k = await pg.evaluate((s) => document.querySelectorAll('#mmqa ' + s).length, sel);
    for (let i = 0; i < k; i++) {
      const id = await pg.evaluate(({ s, i }) => { const b = document.querySelectorAll('#mmqa ' + s)[i]; return b.dataset.id || `cry_${b.dataset.k}_${b.dataset.kind}`; }, { s: sel, i });
      const id2 = await pg.evaluate((x) => MMAUDIO.voiceResolve(x), id);
      await pg.evaluate(({ s, i }) => document.querySelectorAll('#mmqa ' + s)[i].click(), { s: sel, i });
      try { await waitCry(pg, id2, 5000); } catch (e) { bad.push(id); }
    }
  }
  assert.deepEqual(bad, [], '鳴らなかった声');
  assert.equal(await pg.evaluate(() => localStorage.getItem('mr4v6')), s0, '通常のセーブを書き換えない');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
