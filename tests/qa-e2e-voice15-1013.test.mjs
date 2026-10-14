// =========================================================
// 2026-10-13 開発25 追加便（実ブラウザ・QA_E2E=1 のときだけ）：NPC のボイス 12本・BGM の候補 3曲
//  VB-1（375×667・390×844・430×932）：公式大会の開幕＝セドリックの1行目で「さあ！いよいよ開幕です！」（cedric_opening）が1回・BGM は CEDRIC のまま・
//         会話のあとの対戦表にセドリックの顔は出ない（従来どおり）
//  VB-2：セルジュ＝登録の受付の1行目で「ようこそ」・管理局の再訪の入口で1回（中でタブを替えても繰り返さない）・登録の前（序盤の導線）は入口で鳴らない
//  VB-3：ゲンシン＝特訓のゴールで「うむ」が1回・ヴァルガス＝ランクを認める一言のときだけ「うむ」（ほかの一言・30秒以内の2回目は鳴らない）
//  VB-4：リュウ＝道中のライバルの遭遇で「よっ！」・ライバル戦に勝つと「やるじゃん」／負け（降参）で「へへっ」（勝敗に合う方だけ・1試合1回）・野生では鳴らない
//  VB-5：フィナ「こんにちは」は新しい音（fina_hello_new.ogg）・ボイス OFF で今回の声はどれも鳴らない・会話を閉じたら止まる
//  VB-6：音源の HTTP 200（新しい声 24ファイル・BGM の候補 3曲）・試聴ページで BGM の候補が読み込めて再生できる（長さ）・三伝説の声は読み込まない
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
const voices = (pg, from = 0) => pg.evaluate((b) => MMAUDIO.playLog().filter((x) => x.kind === 'voice').slice(b).map((x) => x.name), from);
const vcount = (pg) => pg.evaluate(() => MMAUDIO.playLog().filter((x) => x.kind === 'voice').length);
const NEWV = ['cedric_opening', 'serge_welcome', 'genshin_ack', 'vargas_ack', 'ryu_hello', 'ryu_chuckle', 'ryu_praise', 'fina_hello'];
async function ready(pg) {
  await pg.mouse.click(4, 300);
  await pg.waitForFunction((ids) => { const s = MMAUDIO.voiceStatus(); return ids.every((k) => s[k] === 'ready'); }, NEWV, { timeout: 20000 });
}
async function base(pg, stats) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate((st) => { const m = mk(0); m.name = 'ソラ'; Object.assign(m, st || {}); MMP7.ensureProg(m); S.m = m; save(); lobby(); }, stats || null);
  await ready(pg);
}

for (const size of [H.SIZES.se, H.SIZES.base, H.SIZES.max]) {
  test(`VB-1（${size.join('×')}）：公式大会の開幕＝セドリック「さあ！いよいよ開幕です！」が1回・BGM は CEDRIC・対戦表にセドリックの顔なし`, { skip: SKIP, timeout: 120000 }, async () => {
    const p = await openPage({ size, npc: true }); const pg = p.page;
    await base(pg);
    await pg.evaluate(() => { MMP8.depart(S, S.m, () => 0.37); const g = MMCH.graphFor(S.m); Object.assign(S.m.raise, { node: g.goal, goal: true, pend: null }); MMP8.startTournament(S, S.m, 0, 5); save(); window.__v0 = MMAUDIO.playLog().filter((x) => x.kind === 'voice').length; p9TourOpen(0); });
    await pg.waitForSelector('.mmtalk:not(.mmtalk-out)', { timeout: 20000 });
    await pg.waitForFunction(() => MMAUDIO.voiceNow() === 'cedric_opening', null, { timeout: 4000 });
    const st = await pg.evaluate(() => ({ scene: MMAUDIO.status().scene, txt: document.querySelector('.mmtalk-text, .mmtalk .tx, .mmtalk')?.textContent || '', name: document.querySelector('.mmtalk-name')?.textContent || '' }));
    assert.equal(st.scene, 'CEDRIC', '開幕の曲（CEDRIC）は変えない'); assert.match(st.txt, /いよいよ公式ランクE大会の開幕です/); assert.match(st.name, /セドリック/);
    await shot(pg, `vb1_cedric_${size.join('x')}`);
    await H.finishTalk(pg);
    await pg.waitForSelector('.tb1', { timeout: 20000 });
    const v = await pg.evaluate(() => MMAUDIO.playLog().filter((x) => x.kind === 'voice').slice(window.__v0).map((x) => x.name));
    assert.deepEqual(v, ['cedric_opening'], '開幕の声は1回だけ（ほかの行・対戦表では鳴らない）');
    assert.equal(await pg.evaluate(() => document.querySelectorAll('.tb1 .p9ced, .tb1 img[src*="cedric"]').length), 0, '対戦表にセドリックの顔は出ない');
    assert.equal(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('VB-2：セルジュ＝受付の1行目で「ようこそ」・管理局の再訪の入口で1回・登録の前は入口で鳴らない', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({ size: H.SIZES.base }); const pg = p.page;
  await base(pg);
  let n = await vcount(pg);
  await pg.evaluate(() => { MMNPC.talk(OPEN_TALK.serge, { kind: 'event', big: true }); });
  await pg.waitForFunction(() => MMAUDIO.voiceNow() === 'serge_welcome', null, { timeout: 4000 });
  assert.match(await pg.evaluate(() => document.querySelector('.mmtalk').textContent), /ようこそ、聖獣士管理局へ/);
  await H.finishTalk(pg); assert.deepEqual(await voices(pg, n), ['serge_welcome'], '受付の会話で1回だけ（2行目以降は鳴らない）');
  // 再訪の入口（背景が出てから）・中でタブを替えても繰り返さない・街へ出て入り直すとまた
  n = await vcount(pg);
  await pg.evaluate(() => bureauScr()); await pg.waitForTimeout(900);
  assert.equal(await pg.evaluate(() => MMAUDIO.status().scene), 'BUREAU');
  await pg.evaluate(() => bureauScr('card')); await pg.waitForTimeout(700); await pg.evaluate(() => bureauScr('ach')); await pg.waitForTimeout(700);
  assert.deepEqual(await voices(pg, n), ['serge_welcome'], '管理局の再訪＝1回');
  await shot(pg, 'vb2_bureau');
  n = await vcount(pg);
  await pg.evaluate(() => { lobby(); }); await pg.waitForTimeout(300); await pg.evaluate(() => bureauScr()); await pg.waitForTimeout(900);
  assert.deepEqual(await voices(pg, n), ['serge_welcome'], '街へ出て入り直すとまた1回');
  // 登録の前（序盤の導線）は入口で鳴らさない
  n = await vcount(pg);
  await pg.evaluate(() => { lobby(); S.playerNamePending = true; }); await pg.waitForTimeout(300); await pg.evaluate(() => bureauScr()); await pg.waitForTimeout(900);
  assert.deepEqual(await voices(pg, n), [], '登録の前は鳴らない');
  await pg.evaluate(() => { delete S.playerNamePending; });
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('VB-3：ゲンシン＝特訓のゴールで「うむ」が1回・ヴァルガス＝ランクを認める一言のときだけ「うむ」', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({ size: H.SIZES.base }); const pg = p.page;
  await base(pg);
  // ゲンシン：ゴール（trScr の done）
  let n = await vcount(pg);
  await pg.evaluate(() => trScr('ちからが2上がった！', { kind: 'po' })); await pg.waitForTimeout(900);
  assert.deepEqual(await voices(pg, n), ['genshin_ack']);
  assert.match(await pg.evaluate(() => document.querySelector('.gssay').textContent), /よくやった/);
  await shot(pg, 'vb3_genshin');
  n = await vcount(pg); await pg.evaluate(() => hall('s')); await pg.waitForTimeout(500);
  assert.deepEqual(await voices(pg, n), [], '特訓メニュー（ゴール以外）では鳴らない');
  // ヴァルガス：ランク未到達＝認める一言が出ない＝鳴らない
  await pg.evaluate(() => { S.br = -1; S.npcFlags = S.npcFlags || {}; S.npcFlags.first = Object.assign(S.npcFlags.first || {}, { arena: 1 }); lobby(); });
  n = await vcount(pg);
  for (let i = 0; i < 6; i++) { await pg.evaluate(() => townArena()); await pg.waitForTimeout(120); }
  assert.deepEqual(await voices(pg, n), [], 'ランクを認める一言以外では鳴らない');
  // ランクを上げた子：認める一言のときだけ（30秒は繰り返さない）
  await pg.evaluate(() => { S.br = 2; lobby(); });
  const seen = []; n = await vcount(pg);
  for (let i = 0; i < 12; i++) { await pg.evaluate(() => townArena()); await pg.waitForTimeout(150); seen.push(await pg.evaluate(() => NPC_LAST.arena)); }
  const v = await voices(pg, n);
  assert.ok(seen.includes('a_rank'), `認める一言が出た ${seen}`);
  assert.deepEqual(v, ['vargas_ack'], `認める一言で1回（2回目以降はクールダウン）${seen}`);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

async function rivalBattle(pg, stats) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate((st) => { const m = mk(0); m.name = 'ソラ'; Object.assign(m, st); MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); save(); board(); }, stats);
  await pg.waitForSelector('#chf .chf-bg'); await pg.waitForTimeout(800); await ready(pg);
  const n = await vcount(pg);
  await pg.evaluate(() => { const r = S.m.raise; r.node = 'p5_0'; r.pend = { roll: 1, left: 0, stage: 'resolve' }; save(); board(); });
  await pg.waitForSelector('.chbat', { timeout: 20000 });
  return n;
}
async function fightToEnd(pg, maxMs = 200000) {
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) {
    const done = await pg.evaluate(() => { const g = document.getElementById('go'); if (!document.getElementById('bt')) return true; if (g && g.classList.contains('bk')) return true; if (g && !g.disabled) g.click(); return false; }).catch(() => false);
    if (done) return; await pg.waitForTimeout(250);
  }
  throw new Error('バトルが終わらない');
}

test('VB-4：リュウ＝（2026-10-13 開発27：遭遇の「よっ！」なし・勝ちの「やるじゃん」はボードの会話）・負け（降参）で「へへっ」・野生では鳴らない', { skip: SKIP, timeout: 360000 }, async () => {
  // 勝ち
  const p = await openPage({ size: H.SIZES.base }); const pg = p.page;
  let n = await rivalBattle(pg, { li: 999, po: 999, in: 999, hi: 999, ev: 500, de: 999 });
  assert.deepEqual(await voices(pg, n), [], '2026-10-13 開発27（20）：遭遇の演出の「よっ！」は鳴らさない');
  await shot(pg, 'vb4_rival_encounter');
  n = await vcount(pg);
  await pg.evaluate(() => bBattleGo()); await pg.waitForSelector('#bt #m0 .mon', { timeout: 20000 });
  await fightToEnd(pg); await pg.waitForTimeout(1300);
  const ban = await pg.evaluate(() => (document.getElementById('ban') || {}).textContent || '');
  assert.match(ban, /^WIN/, 'この能力ならリュウに勝つ');
  assert.deepEqual(await voices(pg, n), [], '2026-10-13 開発27（24）：勝ちの「やるじゃん」はバトルの裏では鳴らさない（ボードへ戻ってからのリュウの会話＝tests/qa-e2e-dev27-1013 の D27-21）・「へへっ」も鳴らない');
  await shot(pg, 'vb4_rival_win');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  // 負け（降参）
  const q = await openPage({ size: H.SIZES.base, npc: true }); const qg = q.page;   // npc：ボードへ戻ってからのリュウ ↔ フィナの会話（MM_QA_NO_NPC を外す）
  await rivalBattle(qg, { li: 30, po: 20, in: 20, hi: 20, ev: 10, de: 20 });
  n = await vcount(qg);
  await qg.evaluate(() => bBattleGo()); await qg.waitForSelector('#bt #m0 .mon', { timeout: 20000 });
  const SUR = () => { const b = document.getElementById('sur'), bt = document.getElementById('bt'); if (!b || !bt || bt.classList.contains('mma-cine')) return false; const c = getComputedStyle(b); return c.visibility === 'visible' && c.pointerEvents !== 'none' && +c.opacity > 0.5; };
  await qg.waitForFunction(SUR, null, { timeout: 20000 }); await qg.click('#sur', { force: true }); await qg.waitForTimeout(700);
  await qg.waitForFunction(SUR, null, { timeout: 20000 }); await qg.click('#sur', { force: true });
  await fightToEnd(qg); await qg.waitForTimeout(1300);
  assert.match(await qg.evaluate(() => (document.getElementById('ban') || {}).textContent || ''), /^LOSE/);
  // 2026-10-14 実機試遊⑬：決着の画面では鳴らさない → ボードへ戻ってからリュウ ↔ フィナの会話の1行目「へへっ、今日は俺の勝ちだな！」と同時に「へへっ」
  assert.deepEqual(await voices(qg, n), [], '決着の画面（LOSE）では声を出さない');
  await qg.click('#go');
  await qg.waitForFunction(() => /へへっ/.test((document.querySelector('.mmtalk:not(.mmtalk-out)') || {}).textContent || ''), null, { timeout: 20000 });
  await qg.waitForTimeout(600);
  assert.deepEqual(await voices(qg, n), ['ryu_chuckle'], '負け（降参）＝ボードの会話の行で「へへっ」だけ');
  await H.finishTalk(qg); await qg.waitForTimeout(500);
  // 野生では鳴らない（同じページで野生のバトル）
  n = await vcount(qg);
  await qg.evaluate(() => { const g = MMCH.graphFor(S.m), a = S.m.raise.field.nodeAssignments; const id = g.order.find((x) => a[x] && a[x].t === 'battle' && a[x].bt === 'wild'); const r = S.m.raise; r.node = id; r.pend = { roll: 1, left: 0, stage: 'resolve' }; save(); board(); });
  await qg.waitForSelector('.chbat', { timeout: 20000 }); await qg.evaluate(() => bBattleGo()); await qg.waitForSelector('#bt #m0 .mon', { timeout: 20000 });
  await qg.waitForFunction(SUR, null, { timeout: 20000 }); await qg.click('#sur', { force: true }); await qg.waitForTimeout(700);
  await qg.waitForFunction(SUR, null, { timeout: 20000 }); await qg.click('#sur', { force: true });
  await fightToEnd(qg); await qg.waitForTimeout(1300);
  assert.deepEqual((await voices(qg, n)).filter((x) => /^ryu_/.test(x)), [], '野生のバトルではリュウの声は鳴らない');
  assert.deepEqual(q.errors, []); assert.deepEqual(q.bad, []);
});

test('VB-5：フィナ「こんにちは」は新しい音・ボイス OFF で今回の声はどれも鳴らない・会話を閉じたら止まる', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({ size: H.SIZES.base }); const pg = p.page;
  await base(pg);
  let n = await vcount(pg);
  await pg.evaluate(() => { MMNPC.talk(OPEN_TALK.first); });
  await pg.waitForFunction(() => MMAUDIO.voiceNow() === 'fina_hello', null, { timeout: 4000 });
  const pl = await pg.evaluate(() => MMAUDIO.playLog().filter((x) => x.kind === 'voice').slice(-1)[0]);
  assert.match(pl.src, /voice\/npc_1013\/fina_hello_new\.ogg$/, '新しい「こんにちは」'); assert.ok(pl.dur >= 1020 && pl.dur <= 1120, `長さ ${pl.dur}ms（1.071秒＝2026-10-13 開発26 の確定版）`);
  await pg.evaluate(() => MMNPC.close()); assert.equal(await pg.evaluate(() => MMAUDIO.voiceNow()), null, '会話を閉じたら止まる');
  // ボイス OFF：開幕・受付・再訪・特訓・ヴァルガス のどれも鳴らない
  await pg.evaluate(() => MMAUDIO.setVoice({ on: false }));
  n = await vcount(pg); const vl0 = await pg.evaluate(() => MMAUDIO.voiceLog().length);
  await pg.evaluate(() => { MMNPC.talk(OPEN_TALK.serge); }); await pg.waitForTimeout(600); await pg.evaluate(() => MMNPC.close());
  await pg.evaluate(() => { MMNPC.talk(CEDRIC_EV.open(0, false)); }); await pg.waitForTimeout(600); await pg.evaluate(() => MMNPC.close());
  await pg.evaluate(() => bureauScr()); await pg.waitForTimeout(800);
  await pg.evaluate(() => trScr('', { kind: 'po' })); await pg.waitForTimeout(800);
  await pg.evaluate(() => { S.br = 2; S.npcFlags = S.npcFlags || {}; S.npcFlags.first = Object.assign(S.npcFlags.first || {}, { arena: 1 }); lobby(); }); for (let i = 0; i < 8; i++) { await pg.evaluate(() => townArena()); await pg.waitForTimeout(80); }
  assert.deepEqual(await voices(pg, n), [], 'ボイス OFF＝どれも鳴らない');
  const res = await pg.evaluate((b) => MMAUDIO.voiceLog().slice(b).map((x) => [x.id, x.result]), vl0);
  assert.ok(res.length >= 4 && res.every((x) => x[1] === 'off'), `OFF のときの記録 ${JSON.stringify(res)}`);
  // ON に戻すとまた鳴る
  await pg.evaluate(() => { MMAUDIO.setVoice({ on: true }); lobby(); }); await pg.waitForTimeout(300);
  n = await vcount(pg); await pg.evaluate(() => bureauScr()); await pg.waitForTimeout(900);
  assert.deepEqual(await voices(pg, n), ['serge_welcome'], 'ON に戻したら鳴る');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('VB-6：音源の HTTP 200・試聴ページで BGM の候補が読み込めて再生できる・三伝説の声は読み込まない', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({ size: H.SIZES.base }); const pg = p.page;
  await base(pg);
  const st = await pg.evaluate(() => MMAUDIO.voiceStatus());
  for (const k of ['leona_greet', 'leona_prebattle', 'ragnas_greet', 'ragnas_prebattle', 'astrad_greet', 'astrad_prebattle']) assert.equal(st[k], 'disabled', `${k} は登録のみ（読み込まない）`);
  const files = ['fina_hello_new', 'cedric_opening', 'serge_welcome', 'genshin_ack', 'vargas_ack', 'ryu_hello', 'ryu_chuckle', 'ryu_praise', 'leona_greet', 'leona_prebattle', 'ragnas_greet', 'ragnas_prebattle', 'astrad_greet', 'astrad_prebattle'].flatMap((k) => [`assets/audio/voice/npc_1013/${k}.ogg`, `assets/audio/voice/npc_1013/${k}.m4a`])
    .concat(['title_candidate', 'arena_candidate', 'legend_battle_candidate'].map((k) => `assets/audio/bgm/candidates_1013/${k}.ogg`));
  const res = await pg.evaluate(async (fs) => Promise.all(fs.map(async (f) => { const r = await fetch('./' + f); const n = (await r.arrayBuffer()).byteLength; return [f, r.status, r.headers.get('content-type') || '', n]; })), files);
  for (const [f, s, , n] of res) { assert.equal(s, 200, f); assert.ok(n > 5000, `${f} ${n}バイト`); }
  assert.equal(res.length, 31);
  // 試聴ページ
  const url = new URL('prototype/audio_candidates_1013/index.html', pg.url()).href;
  await pg.goto(url); await pg.waitForFunction(() => window.__previewReady === true);
  const rows = await pg.evaluate(() => ({ bgm: document.querySelectorAll('#bgm audio').length, voice: document.querySelectorAll('#voice audio').length }));
  assert.deepEqual(rows, { bgm: 3, voice: 12 });
  // 長さはデコードして測る（テスト用のサーバーは長さの情報を返さない＝<audio> の duration が Infinity になるため）
  const dur = await pg.evaluate(async () => { const c = new (window.AudioContext || window.webkitAudioContext)(); const out = []; for (const a of document.querySelectorAll('#bgm audio')) { const src = a.querySelector('source').src; const b = await (await fetch(src)).arrayBuffer(); const d = await c.decodeAudioData(b); out.push(Math.round(d.duration)); } c.close(); return out; });
  assert.deepEqual(dur, [231, 186, 272], `BGM の候補の長さ ${dur}`);
  const play = await pg.evaluate(async () => { const a = document.querySelector('#bgm audio'); a.muted = true; try { await a.play(); await new Promise((r) => setTimeout(r, 600)); const t = a.currentTime; a.pause(); return t; } catch (e) { return -1; } });
  assert.ok(play > 0.2, `候補の曲が再生できる（${play}秒）`);
  await shot(pg, 'vb6_preview');
  assert.deepEqual(p.bad, []);
});
