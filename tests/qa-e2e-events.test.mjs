// =========================================================
// QA（実ブラウザ）：第二段階（2026-10-04）のイベント基盤
//  EV-B1：イベントマス＝挿絵（2026-10-04 追加アセット）→ フィナの会話 → 結果 → 初回だけチュートリアル（会話窓）。2回目はチュートリアル無し
//  EV-B2：2択の出来事＝会話の最後に選択肢 → 選ぶまで結果は決まらない（再読み込みでも同じ選択肢）→ 選んだ効果
//  EV-B3：能力マスの初回チュートリアルは1回だけ
//  EV-B4：施設の初回訪問（市場・牧場・研究所・闘技場・ファーム）はフィナ ↔ NPC の会話、再訪では出ない
//  EV-B5：Chapter を終えてファームへ戻ると帰還イベント（ダン＋フィナ・噂）。再読み込みでは出ない
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

/** フィナの吹き出し（.chf-fina）が出ていれば、タップで進める（出てから0.3秒は無視されるので少し待つ） */
async function clearFina(pg, max = 8) { for (let i = 0; i < max; i++) { if (!(await pg.$('.chf-fina'))) return; await pg.waitForTimeout(380); const f = await pg.$('.chf-fina'); if (f) await f.click().catch(() => {}); await pg.waitForTimeout(300); } }
async function start(pg) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); save(); board(); });
  await pg.waitForSelector('#chf .chf-bg'); await pg.waitForTimeout(700);
  await clearFina(pg);
  for (let i = 0; i < 4; i++) { if (await pg.$('.mmtalk:not(.mmtalk-out)')) { await H.finishTalk(pg); await pg.waitForTimeout(500); } else if (await pg.$('.chf-fina')) await pg.waitForFunction(() => !document.querySelector('.chf-fina'), null, { timeout: 8000 }).catch(() => {}); else break; }   // 2026-10-05：出発のときの「30ターン」の説明（会話窓・このセーブで1回）を送る
  await clearFina(pg);
  await pg.waitForFunction(() => !bBusy && !MMCHD.isLocked(), null, { timeout: 20000 }); await pg.waitForTimeout(250);
}
const idle = (pg) => pg.waitForFunction(() => !bBusy && !MMCHD.isLocked() && !document.querySelector('.chpop,.chdz,.chf-enc,.chf-fina,.mmtalk'), null, { timeout: 20000 }).then(() => pg.waitForTimeout(250));
/** 指定の出来事（ev）のイベントマス（序盤の背景 1〜4）に「止まった直後」の状態を作る */
const landOn = (pg, ev, type = 'event') => pg.evaluate(([ev, type]) => {
  const g = MMCH.graphFor(S.m), a = S.m.raise.field.nodeAssignments, used = S.m.raise.field.consumedEvents.concat(S.m.raise.field.clearedStats);
  const id = g.order.find((x) => a[x] && a[x].t === type && !a[x].recovery && g.nodes[x].field <= 4 && !used.includes(x));
  if (type === 'event') a[id] = { t: 'event', tier: 'normal', ev };
  const r = S.m.raise; r.node = id; r.pend = { roll: 1, left: 0, stage: 'resolve' }; r.turnsUsed = 3; save(); board(); return id;
}, [ev, type]);
const fina = (pg, re) => pg.waitForFunction((src) => { const f = document.querySelector('.chf-fina span'); return !!f && new RegExp(src).test(f.textContent); }, re, { timeout: 15000 });
const talk = (pg, re) => pg.waitForFunction((src) => { const t = document.querySelector('.mmtalk:not(.mmtalk-out)'); return !!t && new RegExp(src).test(t.textContent); }, re, { timeout: 15000 });

/** 会話を送って選択肢まで進める（選択肢は最後の行の全文表示のあと） */
async function toChoice(pg) { for (let i = 0; i < 20 && !(await pg.$('.mmtalk-choice')); i++) { await pg.click('.mmtalk:not(.mmtalk-out)', { force: true }).catch(() => {}); await pg.waitForTimeout(120); } await pg.waitForSelector('.mmtalk-choice', { timeout: 15000 }); }

T('EV-B1：イベントマス（挿絵つき・澄んだ湧き水）：背景を暗く → 挿絵とイベント名 → フィナの会話（小さな会話窓・タップで進む）→ 挿絵が消える → 結果（疲れ −15 が HUD へ）→ 初めてのイベントのチュートリアル（会話窓）。2回目のイベント（挿絵なし）ではチュートリアルは出ない。記録は S.npcFlags.story', async () => {
  const p = await openPage({ story: true }); const pg = p.page;
  await start(pg);
  await pg.evaluate(() => { S.m.raise.fatigue = 30; save(); });
  const id = await landOn(pg, 'spring_water');
  await pg.waitForSelector('.chf-evc.on[data-ev="spring_water"]', { timeout: 15000 });
  assert.match(await pg.textContent('.chf-evc figcaption'), /澄んだ湧き水/);
  await talk(pg, 'すごく澄んでる');
  assert.equal(await pg.evaluate(() => document.querySelector('.mmtalk').dataset.pres), 'compact', '挿絵を隠さない小さな窓');
  await H.finishTalk(pg);
  await pg.waitForSelector('.chpop.ev', { timeout: 15000 });
  assert.equal(await pg.evaluate(() => !!document.querySelector('.chf-evc')), false, '結果の前に挿絵は消える');
  assert.match(await pg.textContent('.chpop.ev'), /湧き水[\s\S]*疲れ −15/);
  await talk(pg, 'イベントマスは、止まるたびに');
  assert.equal(await pg.evaluate(() => document.querySelector('.mmtalk').dataset.pres), 'board', '2026-10-04 G2：チュートリアルはボードの大きな会話窓（操作欄の上）');
  await H.finishTalk(pg); await idle(pg);
  const s1 = await pg.evaluate(() => ({ fat: S.m.raise.fatigue, used: S.m.raise.field.consumedEvents, story: S.npcFlags.story, pend: S.m.raise.pend, hud: document.querySelector('#chfat b').textContent }));
  assert.equal(s1.fat, 15); assert.ok(s1.used.includes(id)); assert.deepEqual(s1.story, ['tut_turns', 'tut_event'], '2026-10-05：出発の「30ターン」の説明（tut_turns）のあとに初めてのイベント'); assert.equal(s1.pend, null); assert.equal(s1.hud, '15');
  assert.deepEqual((await H.storedSave(pg)).npcFlags.story, ['tut_turns', 'tut_event'], 'セーブに残る');
  // 2回目：挿絵の無い出来事（ダンの言葉）＝フィナの吹き出しと結果だけ（チュートリアル無し）
  await landOn(pg, 'remember_dan');
  await fina(pg, 'ダンが言ってた'); await clearFina(pg);
  await pg.waitForSelector('.chpop.ev', { timeout: 15000 }); await pg.waitForFunction(() => !document.querySelector('.chpop'), null, { timeout: 15000 });
  await pg.waitForTimeout(1200);
  assert.equal(await pg.evaluate(() => !!document.querySelector('.mmtalk,.chf-evc')), false, '2回目はチュートリアルを出さない・挿絵の無い出来事にカードは出ない');
  await idle(pg);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

T('EV-B2：2択の出来事（古い訓練跡）：挿絵 → 会話の最後に選択肢 → 選ぶまで結果は決まらず・使った印も付かない（再読み込みで同じ挿絵と選択肢がもう一度）→「動きを確かめる」で命中 +5 → 結果', async () => {
  const p = await openPage({ story: true }); const pg = p.page;
  await start(pg);
  await pg.evaluate(() => { S.m.raise.fatigue = 40; save(); });
  const hi0 = await pg.evaluate(() => S.m.hi);
  const id = await landOn(pg, 'old_grounds');
  await pg.waitForSelector('.chf-evc.on[data-ev="old_grounds"]', { timeout: 15000 });
  await talk(pg, '昔の訓練場みたい'); await toChoice(pg);
  const c = await pg.evaluate(() => [...document.querySelectorAll('.mmtalk-choice')].map((b) => [b.dataset.choice, b.textContent]));
  assert.deepEqual(c.map((x) => x[0]), ['train', 'check']); assert.match(c[0][1], /少し鍛える/); assert.match(c[1][1], /動きを確かめる/);
  const sv = await H.storedSave(pg);
  assert.equal(sv.m.raise.pend.stage, 'resolve'); assert.equal(sv.m.raise.pend.fx.kind, 'choice'); assert.ok(!sv.m.raise.field.consumedEvents.includes(id)); assert.equal(sv.m.raise.fatigue, 40);
  // 選ぶ前に再読み込み → 同じ挿絵・選択肢
  await pg.reload(); await pg.waitForFunction(() => typeof window.MMP8 === 'object'); await pg.click('.p15start');
  await pg.waitForSelector('.chf-evc.on[data-ev="old_grounds"]', { timeout: 20000 });
  await talk(pg, '昔の訓練場みたい'); await toChoice(pg);
  assert.deepEqual(await pg.evaluate(() => [S.m.raise.fatigue, S.m.hi]), [40, hi0], 'まだ何も起きていない');
  await H.chooseTalk(pg, 'check');
  await pg.waitForSelector('.chpop.ev', { timeout: 15000 }); assert.match(await pg.textContent('.chpop.ev'), /動きを確かめた[\s\S]*命中/);
  await talk(pg, 'イベントマスは'); await H.finishTalk(pg); await idle(pg);
  const s1 = await pg.evaluate(() => ({ fat: S.m.raise.fatigue, hi: S.m.hi, used: S.m.raise.field.consumedEvents.includes(S.m.raise.node), pend: S.m.raise.pend, phase: MMP8.boardPhase(S.m), start: !!document.querySelector('#brollbtn'), card: !!document.querySelector('.chf-evc') }));
  assert.deepEqual(s1, { fat: 40, hi: hi0 + 5, used: true, pend: null, phase: 'roll', start: true, card: false });
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

T('EV-B3：能力マスの初回チュートリアル：結果の枠のあとにフィナの会話（1回だけ）。2回目の能力マスでは出ない', async () => {
  const p = await openPage({ story: true }); const pg = p.page;
  await start(pg);
  await landOn(pg, null, 'stat');
  await pg.waitForSelector('.chpop.stat', { timeout: 15000 });
  await talk(pg, '能力マスだよ'); await H.finishTalk(pg); await idle(pg);
  assert.deepEqual(await pg.evaluate(() => S.npcFlags.story), ['tut_turns', 'tut_stat']);
  await landOn(pg, null, 'stat');
  await pg.waitForSelector('.chpop.stat', { timeout: 15000 }); await pg.waitForFunction(() => !document.querySelector('.chpop'), null, { timeout: 15000 });
  await pg.waitForTimeout(1200); assert.equal(await pg.evaluate(() => !!document.querySelector('.mmtalk')), false);
  await idle(pg);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

T('EV-B4：施設の初回訪問：市場（フィナ ↔ カレン）・牧場（ニック）・研究所（エリオット）・闘技場（ヴァルガス）・ファーム（ダン）で1回だけ会話。再訪・再読み込みでは出ない（記録は S.npcFlags.first）', async () => {
  const p = await openPage({ npc: true, karen: true }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.waitForSelector('.tpin[onclick="market()"]');
  await pg.click('.tpin[onclick="market()"]'); await talk(pg, 'ここが市場');
  assert.equal(await pg.evaluate(() => document.querySelector('.mmtalk').dataset.pres), 'standard');
  await H.finishTalk(pg);
  await pg.waitForFunction(() => { const b = document.querySelector('#p10kbar'); return !!b && !b.classList.contains('wait'); }, null, { timeout: 10000 });
  let f = (await H.storedSave(pg)).npcFlags; assert.equal(f.first.market, 1); assert.equal(f.karenIntro, 1, '旧い2行の説明は出さない（会話に含めた）');
  await pg.click('.p10mk .p10back'); await pg.waitForSelector('.tpin[onclick="market()"]');
  await pg.click('.tpin[onclick="market()"]'); await pg.waitForSelector('.p10mk'); await pg.waitForTimeout(900);
  assert.equal(await pg.evaluate(() => !!document.querySelector('.mmtalk-standard')), false, '再訪では初回の会話を出さない（一言は小さな窓だけ）');
  await pg.evaluate(() => { if (window.MMNPC) MMNPC.close(); lobby(); }); await pg.waitForSelector('.tpin[onclick="farm()"]');
  await pg.click('.tpin[onclick="farm()"]'); await talk(pg, '育成を終えた子たちは'); await H.finishTalk(pg); await pg.waitForSelector('.rn');
  await pg.evaluate(() => lobby()); await pg.click('.tpin[onclick="museum()"]'); await talk(pg, '図鑑に残ります'); await H.finishTalk(pg); await pg.waitForSelector('.lab');
  await pg.evaluate(() => lobby()); await pg.waitForSelector('.tpin[onclick="townArena()"]'); await pg.click('.tpin[onclick="townArena()"]'); await talk(pg, 'そのまま結果になる'); await H.finishTalk(pg);
  assert.match(await pg.textContent('#msg'), /闘技場は、まだ利用できません/);
  await pg.evaluate(() => { const m = mk(0); MMP7.ensureProg(m); S.m = m; save(); lobby(); }); await pg.waitForSelector('.tbar button[onclick="hall()"]');
  await pg.click('.tbar button[onclick="hall()"]'); await talk(pg, '出発前の準備は'); await H.finishTalk(pg); await pg.waitForSelector('.fm .fmgo');
  f = (await H.storedSave(pg)).npcFlags; assert.deepEqual(f.first, { market: 1, ranch: 1, lab: 1, arena: 1, farm: 1 });
  await pg.reload(); await pg.waitForFunction(() => typeof window.MMP8 === 'object'); await pg.click('.p15start'); await pg.waitForSelector('.tpin[onclick="market()"]');
  for (const sel of ['.tpin[onclick="farm()"]', '.tpin[onclick="museum()"]', '.tpin[onclick="townArena()"]', '.tbar button[onclick="hall()"]']) { await pg.click(sel); await pg.waitForTimeout(700); assert.equal(await pg.evaluate(() => !!document.querySelector('.mmtalk')), false, `${sel}：再読み込み後の再訪で初回の会話を出さない`); await pg.evaluate(() => lobby()); await pg.waitForSelector('.tpin[onclick="market()"]'); }
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

T('EV-B5：Chapter 1 を終えてファームへ戻ると帰還イベント（ダン＋フィナ・重要な会話）。次の Chapter の噂を添える。記録は m.raise.evSeen＝再読み込みでは出ない', async () => {
  const p = await openPage({ npc: true }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  const r = await pg.evaluate(() => { const m = mk(0); MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); m.raise.node = g.goal; m.raise.goal = true; m.raise.pend = null; const r = MMP8.declineTournament(S, m); save(); hall('t'); return { ok: r.ok, state: MMP7.raiseState(m), log: m.raise.log.length }; });
  assert.deepEqual(r, { ok: true, state: 'farm', log: 1 });
  await talk(pg, '戻ったよ、ダン');
  assert.equal(await pg.evaluate(() => document.querySelector('.mmtalk').dataset.pres), 'major', '帰還は重要な会話（大きな立ち絵）');
  const exp = await pg.evaluate(() => ({ next: MMP8.chapterName(2), lines: MMNPCE.returnEvent(1, { reachedGoal: true, declined: true, placed: null, nextName: MMP8.chapterName(2), rumor: true }).lines.map((l) => l.text) }));
  assert.ok(exp.next && exp.lines.some((t) => t.includes(`「${exp.next}」の話`)) && exp.lines.some((t) => /珍しいモンスターを見た者がいるらしい/.test(t)), `次の Chapter（${exp.next}）の噂を添える`);
  await H.finishTalk(pg);
  await pg.waitForFunction(() => !document.querySelector('.mmtalk'), null, { timeout: 15000 });
  const sv = await H.storedSave(pg); assert.deepEqual(sv.m.raise.evSeen, ['ret1', 'rumor'], '帰還と噂を見た記録');
  await pg.reload(); await pg.waitForFunction(() => typeof window.MMP8 === 'object'); await pg.click('.p15start'); await pg.waitForSelector('.fm .fmgo', { timeout: 20000 }); await pg.waitForTimeout(900);
  assert.equal(await pg.evaluate(() => !!document.querySelector('.mmtalk')), false, '再読み込みでは出ない');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
