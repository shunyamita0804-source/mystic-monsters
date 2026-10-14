// =========================================================
// 実ブラウザ：2026-10-13 開発28（PHASE A）
//  D28-B1 開始画面の BGM：自動再生が止められた（iOS の制約を再現）ときだけ「♪ タップで音楽」の印 → 印のタップで鳴り始めて印が消える。開始ボタンでは鳴らさない（開始の音だけ）
//  D28-B2 決着の曲：勝ち＝WIN! の帯と同時に BATTLE_WIN が1回（旧 VICTORY なし・戦闘の BGM は止まる）／負け＝LOSE の帯で BATTLE_LOSE が1回（BATTLE_WIN なし）
//  D28-B3 固有スキルのカメラ（ガウル＝ゴングの直後・最初の行動の前）：左右・2サイズ＝対象が画面の中央・切れない・STOP とコマンドが隠れて押せない・名前と正式の説明・終わったら元へ（STOP が戻る・演出の要素が残らない）。両側ガウル＝待ち行列で順に
//  D28-B4 ソラモ＝ライフ 20% 以下の成立の瞬間（実戦で）・1バトル1回／レグナス＝反撃の構えの成立（回避）の瞬間・構え中の再回避では出ない
//  D28-B5 ノビトン・ジオル（今のバトルには出ない）＝演出の見た目（名前・正式の説明）と待ち行列・視差を減らす設定（寄らない・短い）
//  D28-B6 立体サイコロ：正式の面に12本の面取りと8つの角の飾り・面の角が丸い・止まったあとの傾き（出目の面は読める）
//  D28-B7 全景 → 盤：ズームは Web Animations（地面の板のアニメーション）・マスの幅を毎フレーム書き換えない・倍率は単調・途切れない（刻みの最大 ≤ 0.25秒）・終わったらアニメーションが残らない
//  D28-B8 観客の声の既定＝通常（1.0秒）・利用者の設定（短い）は残る
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
const openPage = async (o) => { const p = await L.open(o); OPEN.push(p); return p; };
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close().catch(() => {}); });

async function settle(pg, ms = 60000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    if (await pg.$('.mmtalk:not(.mmtalk-out)')) { await H.finishTalk(pg); continue; }
    if (await pg.evaluate(() => !bBusy && !document.querySelector('.wbrelay,.wb-pop,.chf-enc2,.d3z'))) break;
    await pg.waitForTimeout(300);
  }
  await pg.waitForTimeout(400);
}
async function toWorld(pg, sp = 0, stats = null) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate(([sp, st]) => { const m = mk(sp); m.name = sp === 1 ? 'ガウ' : 'ソラ'; if (st) Object.assign(m, st); MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); S.m.raise.field.introSeen = true; save(); board(); }, [sp, stats]);
  await pg.waitForSelector('#wbw #brollbtn', { timeout: 30000 }); await settle(pg);
}
/** 世界のボードの途中状態（止まったマス＝バトル）を作って練習試合へ。fs＝相手の種族（0 ソラモ・1 ガウル・-1＝ライバル） */
async function battle(pg, sp, stats, bt = 'wild', fs = 0, eq = null) {
  await toWorld(pg, sp, stats);
  await pg.evaluate(([bt, fs, eq]) => { const m = S.m, r = m.raise; if (eq) { m.eq = eq.slice(); } r.pend = { roll: 1, left: 0, stage: 'battle', fx: { kind: 'battle', battleType: bt } }; save();
    const rk = bt === 'rival' ? MMRIVAL.rankFor(m) : MMP8.practiceRank(m); bBattleRun(m, bt, rk, fs); }, [bt, fs, eq]);
  await pg.waitForSelector('#bt #m0 .mon', { timeout: 20000 });
}
const stopReady = (pg) => pg.evaluate(() => { const g = document.getElementById('go'), bt = document.getElementById('bt'); return !!g && !!bt && !g.disabled && !g.classList.contains('bk') && !bt.classList.contains('mmsk-cut'); });   // #go は正式の STOP の絵（.gow .mma-stop）の下の透明なボタン（arena.js）＝opacity では見ない
async function pressStop(pg) { if (await stopReady(pg)) await pg.click('#go').catch(() => {}); }
async function fightToEnd(pg, ms = 200000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const d = await pg.evaluate(() => { const g = document.getElementById('go'); if (!document.getElementById('bt')) return true; if (g && g.classList.contains('bk')) return true; if (g && !g.disabled && !document.getElementById('bt').classList.contains('mmsk-cut')) g.click(); return false; }).catch(() => false);
    if (d) return; await pg.waitForTimeout(250);
  }
  throw new Error('バトルが終わらない');
}
const seCount = (pg, k) => pg.evaluate((k) => MMAUDIO.seLog().filter((x) => x === k).length, k);
const cutLog = (pg) => pg.evaluate(() => MMRULES.cutLog());
/** 演出の途中の計測（#bt 基準）：対象の中心・画面の中・STOP が隠れて押せない・説明の札 */
const measure = (pg, i) => pg.evaluate((i) => {
  const bt = document.getElementById('bt'), br = bt.getBoundingClientRect(), mon = document.querySelector(`#m${i} .mon .mma-idle`) || document.querySelector(`#m${i} .mon img`) || document.querySelector(`#m${i} .mon`), r = mon.getBoundingClientRect();
  const go = document.getElementById('go'), gow = go.closest('.gow') || go, gr = go.getBoundingClientRect(), st = getComputedStyle(gow), hit = document.elementFromPoint(gr.left + gr.width / 2, gr.top + gr.height / 2);
  const card = document.querySelector('.mmskc-card');
  return { cut: bt.classList.contains('mmsk-cut'), cx: r.left + r.width / 2 - br.left, cy: r.top + r.height / 2 - br.top, W: br.width, H: br.height, inside: r.left >= br.left - 1 && r.right <= br.right + 1 && r.top >= br.top - 1 && r.bottom <= br.bottom + 1,
    stopHidden: st.visibility === 'hidden' || +st.opacity === 0, stopHit: !!(hit && (hit === go || hit.closest('.gow') || hit.closest('.bui'))), card: card ? card.innerText : null, ring: !!document.querySelector('.mmskc-ring'), img: !!document.querySelector('.mmskc-img'), fx: (document.querySelector('.mmskc-fx') || { src: '' }).src.split('/').pop() || null,
    anims: document.getAnimations().filter((a) => a.effect && a.effect.target && (a.effect.target.classList.contains('vs') || a.effect.target.classList.contains('bgs'))).length,
    msgHidden: getComputedStyle(document.getElementById('msg')).visibility === 'hidden', turn: (MMRULES.current() || {}).turn, dmg: (MMRULES.current() || { totalDamage: null }).totalDamage };
}, i);

test('D28-B1：開始画面の BGM＝自動再生が止められたときだけ「♪ タップで音楽」→ タップで鳴り始めて消える。開始ボタンでは鳴らさない（開始の音 TITLE_START だけ）', { skip: SKIP, timeout: 90000 }, async () => {
  const p = await openPage({}); const pg = p.page;
  await pg.waitForSelector('.mmtscr .p15start');
  // Chromium のテストでは自動再生が許されている＝印は出ない（iOS では最初の操作まで鳴らせない）
  const a0 = await pg.evaluate(() => ({ pend: MMAUDIO.status().pendingScene, scene: MMAUDIO.status().scene, hint: !!document.querySelector('.tsndhint:not([hidden])') }));
  assert.equal(a0.scene, 'TITLE', '開始画面の BGM は TITLE'); assert.equal(a0.hint, false, '鳴らせているときは印を出さない');
  // iOS の制約を再現：play() を拒否する → 開始画面を出し直す → 保留（pendingScene＝TITLE）＝印が出る
  await pg.evaluate(() => { MMAUDIO.stopBgm({ fade: 'none' }); const P = HTMLMediaElement.prototype.play; window.__P = P; window.__allow = false;
    HTMLMediaElement.prototype.play = function () { if (window.__allow) return P.apply(this, arguments); try { this.pause(); } catch (e) {} return Promise.reject(new DOMException('NotAllowedError: play() failed because the user didn\'t interact with the document first.', 'NotAllowedError')); };
    title(); });
  await pg.waitForFunction(() => MMAUDIO.status().pendingScene === 'TITLE' && !!document.querySelector('.tsndhint:not([hidden])'), null, { timeout: 5000 });
  const a1 = await pg.evaluate(() => { const b = document.querySelector('.tsndhint'), r = b.getBoundingClientRect(); return { text: b.textContent, playing: [...document.querySelectorAll('audio')].some((a) => !a.paused), inside: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, overStart: (() => { const s = document.querySelector('.p15start').getBoundingClientRect(); return !(r.bottom < s.top || r.top > s.bottom || r.right < s.left || r.left > s.right); })(), title: document.querySelector('.tpage.mmt img.mmtimg') != null }; });
  assert.equal(a1.text, '♪ タップで音楽'); assert.equal(a1.playing, false, '鳴っていない（<audio> はすべて停止）'); assert.ok(a1.inside && !a1.overStart, '画面の中・開始ボタンに重ならない'); assert.ok(a1.title, '開始画面の作りは従来のまま');
  // 印のタップ＝最初の操作 → 鳴り始める → 印が消える
  await pg.evaluate(() => { window.__allow = true; });
  const n0 = await pg.evaluate(() => MMAUDIO.seLog().length);
  await pg.click('.tsndhint');
  await pg.waitForFunction(() => MMAUDIO.status().pendingScene === null && MMAUDIO.status().scene === 'TITLE' && MMAUDIO.status().playing && (document.querySelector('.tsndhint') || { hidden: true }).hidden, null, { timeout: 5000 });
  assert.deepEqual(await pg.evaluate((n) => MMAUDIO.seLog().slice(n), n0), [], '印のタップで決定音・開始の音を鳴らさない');
  // もう一度保留にして、開始ボタンの押下（titlePress）＝保留中の TITLE を始めずに止める → 開始の音だけ → 次の画面
  await pg.evaluate(() => { MMAUDIO.stopBgm({ fade: 'none' }); window.__allow = false; title(); });
  await pg.waitForFunction(() => MMAUDIO.status().pendingScene === 'TITLE', null, { timeout: 5000 });
  await pg.evaluate(() => { window.__allow = true; titlePress({}, 1); });
  await pg.waitForTimeout(150);
  const a15 = await pg.evaluate(() => ({ st: MMAUDIO.status(), playing: [...document.querySelectorAll('audio')].some((a) => !a.paused) }));
  assert.equal(a15.st.pendingScene, null); assert.equal(a15.st.scene, null, '開始ボタンの押下で保留中の TITLE を止める（鳴らし始めない）'); assert.equal(a15.playing, false);
  const n1 = await pg.evaluate(() => MMAUDIO.seLog().length);
  await pg.click('.tpage [onclick*="startGame"], [onclick*="startGame"]');
  await pg.waitForSelector('#p11nm', { timeout: 8000 });
  const a2 = await pg.evaluate((n) => ({ st: MMAUDIO.status(), se: MMAUDIO.seLog().slice(n) }), n1);
  assert.ok(a2.se.includes('TITLE_START'), `開始の音 ${a2.se}`);
  assert.equal(a2.st.pendingScene, null, '保留のまま残らない');   // 自動テストの近道（名前登録の画面）は従来どおり TITLE の場面＝本番はプロローグの曲へ
  await pg.evaluate(() => { HTMLMediaElement.prototype.play = window.__P; });
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('D28-B2：決着の曲＝勝ち：WIN! と同時に BATTLE_WIN が1回（旧 VICTORY なし・戦闘の BGM は止まる）／負け：LOSE で BATTLE_LOSE が1回', { skip: SKIP, timeout: 300000 }, async () => {
  const p = await openPage({ worldCh1: true }); const pg = p.page;
  await battle(pg, 0, { li: 999, po: 999, in: 999, hi: 999, ev: 999, de: 999 }, 'wild', 1);
  await pg.waitForFunction(() => /BATTLE/.test(MMAUDIO.status().scene || ''), null, { timeout: 20000 });   // FIGHT! の 0.45秒後に実戦の曲（battleBgmGo）
  await fightToEnd(pg); await pg.waitForTimeout(400);
  const w = await pg.evaluate(() => ({ ban: document.getElementById('ban').textContent, rj: document.getElementById('bt').dataset.rj, st: MMAUDIO.status(), log: MMAUDIO.seLog() }));   // 1回の印（data-rj）はバトルの器 #bt に付く（バトルごとに作り直される）
  // 2026-10-13 開発28 B（監査）：WIN のあと正式の勝利の絵（mma-win）が出たら、技のあとの静止の絵への戻し（mma-on）でも消えない＝主役が空白にならない（0.15秒ごとに 2.4秒）
  const gap = await pg.evaluate(() => new Promise((ok) => { const seen = []; let n = 0; const f = () => { const im = document.querySelector('#m0 .mon .mma-win'), on = !!(im && getComputedStyle(im).visibility !== 'hidden' && +getComputedStyle(im).opacity > 0.5 && getComputedStyle(im).display !== 'none'); seen.push(on ? 1 : 0); if (++n < 16) setTimeout(f, 150); else ok(seen); }; f(); }));
  const first = gap.indexOf(1); assert.ok(first >= 0, `勝利の絵が出る ${gap}`); assert.ok(gap.slice(first).every((x) => x === 1), `勝利の絵が出たあと消えない ${gap.join('')}`);
  assert.match(w.ban, /^WIN!/); assert.equal(w.rj, 'win');
  assert.equal(w.log.filter((x) => x === 'BATTLE_WIN').length, 1, `BATTLE_WIN は1回（${w.log.filter((x) => /BATTLE_|VICTORY/.test(x))}）`);
  assert.equal(w.log.filter((x) => x === 'VICTORY' || x === 'BATTLE_LOSE').length, 0);
  assert.equal(w.st.scene, null, '戦闘の BGM は止める'); assert.equal(w.st.pendingScene, null);
  await pg.waitForTimeout(1500);
  assert.equal(await seCount(pg, 'BATTLE_WIN'), 1, '帯の描き直しでも1回');
  // 負け
  const q = await openPage({ worldCh1: true }); const qg = q.page;
  await battle(qg, 0, { li: 10, po: 5, in: 5, hi: 5, ev: 1, de: 5 }, 'wild', 1);
  await fightToEnd(qg); await qg.waitForTimeout(400);
  const l = await qg.evaluate(() => ({ ban: document.getElementById('ban').textContent, rj: document.getElementById('bt').dataset.rj, st: MMAUDIO.status(), log: MMAUDIO.seLog() }));
  assert.match(l.ban, /^LOSE/); assert.equal(l.rj, 'lose');
  assert.equal(l.log.filter((x) => x === 'BATTLE_LOSE').length, 1, `BATTLE_LOSE は1回（${l.log.filter((x) => /BATTLE_|VICTORY/.test(x))}）`);
  assert.equal(l.log.filter((x) => x === 'BATTLE_WIN' || x === 'VICTORY').length, 0, '負けに勝ちの曲は鳴らない');
  assert.equal(l.st.scene, null);
  assert.deepEqual(p.errors, []); assert.deepEqual(q.errors, []); assert.deepEqual(p.bad, []); assert.deepEqual(q.bad, []);
});

test('D28-B3：ガウル「紅翼の猛攻」＝ゴングの直後・最初の行動の前に1回。左右 × 2サイズ：対象が中央・切れない・STOP／コマンド／説明が隠れて押せない・名前と正式の説明・終わったら元へ。両側ガウル＝待ち行列で順に（重ねない）', { skip: SKIP, timeout: 400000 }, async () => {
  const STRONG = { li: 999, po: 999, in: 999, hi: 999, ev: 999, de: 999 };
  for (const size of [[375, 667], [390, 844]]) for (const mine of [1, 0]) {
    const p = await openPage({ size, stage: true, worldCh1: true }); const pg = p.page;
    await battle(pg, mine ? 1 : 0, STRONG, 'wild', mine ? 0 : 1);
    await pg.waitForFunction(() => document.getElementById('bt').classList.contains('mmsk-cut'), null, { timeout: 15000 });
    await pg.waitForTimeout(CUT_PEAK);
    const i = mine ? 0 : 1, m = await measure(pg, i), log = await cutLog(pg);
    const tag = `${size.join('x')} ${mine ? '自分' : '相手'}`;
    assert.equal(log.length, 1, `${tag}：演出は1回 ${JSON.stringify(log)}`); assert.deepEqual([log[0].side, log[0].key, log[0].name], [i, 'gauru', '紅翼の猛攻']);
    assert.ok(log[0].k > 1.15 && log[0].k <= 1.45, `${tag}：寄り ${log[0].k}`); assert.ok(log[0].total >= 1500 && log[0].total <= 2100);
    assert.ok(m.cut && Math.abs(m.cx - m.W / 2) <= 3 && m.inside, `${tag}：対象が中央・切れない ${JSON.stringify(m)}`);
    assert.ok(m.cy > m.H * 0.2 && m.cy < m.H * 0.5, `${tag}：縦は HUD の下・説明の上 ${m.cy}/${m.H}`);
    assert.ok(m.stopHidden && !m.stopHit && m.msgHidden, `${tag}：STOP・説明が隠れて押せない`);
    assert.ok(!m.ring && !m.img && m.fx === 'gauru.webp', `足元の正式エフェクト（2026-10-14 開発29）＝仮の輪は出さない ${m.fx}`);
    const desc = await pg.evaluate(() => MMP10M.skillText(1));
    assert.ok(m.card && m.card.includes(mine ? '固有スキル' : '相手の固有スキル') && m.card.includes('紅翼の猛攻') && m.card.includes(desc.desc), `${tag}：札 ${m.card}`);
    assert.ok(m.anims >= 1, 'カメラは Web Animations');
    assert.ok(!m.turn || m.turn <= 1, '最初の行動の前'); assert.ok(!m.dmg || (m.dmg.A === 0 && m.dmg.B === 0), 'まだ誰も攻撃していない');
    // 終わり
    await pg.waitForFunction(() => !document.getElementById('bt').classList.contains('mmsk-cut') && !document.querySelector('.mmskc'), null, { timeout: 6000 });
    await pg.waitForTimeout(300);
    const after = await measure(pg, i);
    assert.ok(!after.cut && after.anims === 0 && after.card === null && !after.ring && !after.fx, `${tag}：片付け ${JSON.stringify(after)}`);
    assert.ok(Math.abs(after.cx - m.cx) > 20, '元の位置へ戻る');
    await pg.waitForFunction(() => { const g = document.querySelector('#bt .gow'); return g && getComputedStyle(g).visibility !== 'hidden' && +getComputedStyle(g).opacity > 0; }, null, { timeout: 10000 });   // 正式の STOP（.gow）が戻る
    assert.equal((await cutLog(pg)).length, 1, `${tag}：1回だけ`);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
    await p.ctx.close();
  }
  // 両側ガウル＝2回を順に（重ねない）
  const p = await openPage({ stage: true, worldCh1: true }); const pg = p.page;
  await battle(pg, 1, STRONG, 'wild', 1);
  await pg.waitForFunction(() => MMRULES.cutLog().length >= 2, null, { timeout: 15000 });
  const log = await cutLog(pg);
  assert.deepEqual(log.map((x) => [x.side, x.key]).sort(), [[0, 'gauru'], [1, 'gauru']]);
  assert.ok(log[1].at - log[0].at >= log[0].total - 60, `順に（${log[1].at - log[0].at}ms 後）`);
  assert.deepEqual(await pg.evaluate(() => MMRULES.cutQueue()), []);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
const CUT_PEAK = 620;   // 寄りきった頃（in 270ms ＋ 少し。2026-10-14 開発29 で 330 → 270）

test('D28-B4：ソラモ「逆境のひと踏ん張り」＝ライフ 20% 以下になった瞬間（実戦）・1バトル1回／レグナス「蒼銀の反撃」＝構えの成立（回避）の瞬間・構え中の再回避では出ない', { skip: SKIP, timeout: 400000 }, async () => {
  // ソラモ：自分（li 999・回避 1＝相手の攻撃が当たる・丈夫さ 1＝1発で 11 以上減る）。ライフを 210（21%）にしてから相手の攻撃で 20% 以下へ（0 にはならない）
  const p = await openPage({ stage: true, worldCh1: true }); const pg = p.page;
  await battle(pg, 0, { li: 999, po: 1, in: 1, hi: 999, ev: 1, de: 1 }, 'wild', 1);
  await pg.waitForFunction(() => !!MMRULES.current(), null, { timeout: 15000 });
  await pg.waitForFunction(() => MMRULES.cutLog().length >= 1, null, { timeout: 15000 });   // 相手のガウルのゴング
  await pg.waitForFunction(() => !document.getElementById('bt').classList.contains('mmsk-cut'), null, { timeout: 8000 });
  await pg.evaluate(() => { MMRULES.current().currentLife.A = 210; });
  let got = null; const tS = Date.now();
  while (Date.now() - tS < 90000 && !got) { await pressStop(pg); await pg.waitForTimeout(400); got = await pg.evaluate(() => MMRULES.cutLog().find((x) => x.key === 'solamo') || null); if (await pg.evaluate(() => !document.getElementById('bt') || document.getElementById('go').classList.contains('bk'))) break; }
  assert.ok(got, 'ソラモの演出が出た'); assert.equal(got.side, 0);
  const st = await pg.evaluate(() => ({ armed: MMRULES.stateOf(MMRULES.current()).armed.A, life: MMRULES.current().currentLife.A, max: MMRULES.current().participants.A.maxLife, card: (document.querySelector('.mmskc-card') || {}).innerText || null, cut: document.getElementById('bt').classList.contains('mmsk-cut') }));
  assert.ok(st.life <= st.max * 0.2 && st.life > 0, `20% 以下の成立 ${st.life}/${st.max}`); assert.equal(st.armed, true, '構えた瞬間');
  if (st.cut) assert.ok(st.card && st.card.includes('逆境のひと踏ん張り'), st.card);
  // そのあと攻撃で消費しても、再び 20% 以下でも出ない（1バトル1回）
  for (let i = 0; i < 12; i++) { await pressStop(pg); await pg.waitForTimeout(400); if (await pg.evaluate(() => !document.getElementById('bt') || document.getElementById('go').classList.contains('bk'))) break; }
  assert.equal(await pg.evaluate(() => MMRULES.cutLog().filter((x) => x.key === 'solamo').length), 1, '1バトル1回');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  // レグナス：命中 1＝こちらの攻撃が外れる → 反撃の構え → 演出（相手側）。回避 999＝相手の攻撃は当たらない（終わらない）
  const q = await openPage({ stage: true, worldCh1: true }); const qg = q.page;
  await battle(qg, 0, { li: 999, po: 1, in: 1, hi: 1, ev: 999, de: 999 }, 'rival', -1, [0, 1, 2, 0, 1, 2]);
  await qg.waitForFunction(() => !!MMRULES.current(), null, { timeout: 15000 });
  // こちらの攻撃を必ず外す（resolveAction の中の乱数だけ 0.999＝命中の判定を外れ側へ。ルーレット・相手の行動の乱数は従来どおり）
  await qg.evaluate(() => { const R = Math.random; window.__rand = R; Math.random = function () { return new Error().stack.includes('resolveAction') ? 0.999 : R.apply(this, arguments); }; });
  let rg = null; const tR = Date.now();
  while (Date.now() - tR < 90000 && !rg) { await pressStop(qg); await qg.waitForTimeout(400); rg = await qg.evaluate(() => MMRULES.cutLog().find((x) => x.key === 'regnas') || null); }
  assert.ok(rg, 'レグナスの演出が出た'); assert.deepEqual([rg.side, rg.name], [1, '蒼銀の反撃']);
  const misses0 = await qg.evaluate(() => MMRULES.cutLog().filter((x) => x.key === 'regnas').length);
  const tR2 = Date.now(); while (Date.now() - tR2 < 12000) { await pressStop(qg); await qg.waitForTimeout(400); }   // 構えたまま、さらに外し続ける
  await qg.evaluate(() => { Math.random = window.__rand; });
  assert.equal(await qg.evaluate(() => MMRULES.cutLog().filter((x) => x.key === 'regnas').length), misses0, '構え中の再回避では出ない（1回）');
  assert.equal(misses0, 1);
  assert.deepEqual(q.errors, []); assert.deepEqual(q.bad, []);
});

test('D28-B5：ノビトン・ジオル（今のバトルには出ない）の演出の見た目＝名前と正式の説明・足元の仮の輪・同時なら待ち行列・視差を減らす設定＝寄らない（k 1）・短い', { skip: SKIP, timeout: 200000 }, async () => {
  const p = await openPage({ stage: true, worldCh1: true }); const pg = p.page;
  await battle(pg, 0, { li: 999, po: 1, in: 1, hi: 1, ev: 999, de: 999 }, 'wild', 0);
  await pg.waitForFunction(() => !!MMRULES.current(), null, { timeout: 15000 }); await pg.waitForTimeout(600);
  await pg.evaluate(() => { MMRULES.skillCut(1, 'jiol'); MMRULES.skillCut(0, 'nobiton'); });
  await pg.waitForTimeout(CUT_PEAK);
  const a = await measure(pg, 1), q0 = await pg.evaluate(() => MMRULES.cutQueue());
  const tx = await pg.evaluate(() => ({ j: MMP10M.skillText(3), n: MMP10M.skillText(2) }));
  assert.ok(a.cut && a.card && a.card.includes('大地の守り') && a.card.includes(tx.j.desc), a.card);
  assert.deepEqual(q0, [{ i: 0, key: 'nobiton' }], '出ている間の発動は待ち行列');
  await pg.waitForFunction(() => MMRULES.cutLog().length >= 2, null, { timeout: 6000 });
  await pg.waitForTimeout(CUT_PEAK);
  const b = await measure(pg, 0);
  assert.ok(b.cut && b.card && b.card.includes('ふしぎな嗅覚') && b.card.includes(tx.n.desc) && Math.abs(b.cx - b.W / 2) <= 3, JSON.stringify(b));
  const log = await cutLog(pg);
  assert.deepEqual(log.map((x) => [x.side, x.key]), [[1, 'jiol'], [0, 'nobiton']]); assert.ok(log[1].at - log[0].at >= log[0].total - 60, '順に');
  await pg.waitForFunction(() => !document.querySelector('.mmskc') && !document.getElementById('bt').classList.contains('mmsk-cut'), null, { timeout: 6000 });
  // 視差を減らす設定
  await pg.emulateMedia({ reducedMotion: 'reduce' });
  await pg.evaluate(() => MMRULES.skillCut(0, 'solamo'));
  await pg.waitForTimeout(300);
  const c = await measure(pg, 0), l2 = await cutLog(pg);
  const last = l2[l2.length - 1];
  assert.deepEqual([last.key, last.calm, last.k, last.dx, last.dy, last.total], ['solamo', true, 1, 0, 0, 1300]);
  assert.ok(c.cut && c.anims === 0 && c.card && c.card.includes('逆境のひと踏ん張り') && c.stopHidden, JSON.stringify(c));
  await pg.waitForFunction(() => !document.querySelector('.mmskc'), null, { timeout: 4000 });
  await pg.emulateMedia({ reducedMotion: 'no-preference' });
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('D28-B6：立体サイコロ＝正式の面（2026-10-14 開発29 から正式デザイン A の絵）・面の角が丸い・止まったあと少し斜めで出目の面は読める', { skip: SKIP, timeout: 200000 }, async () => {
  const p = await openPage({ worldCh1: true }); const pg = p.page;
  await toWorld(pg); await pg.mouse.click(4, 300);
  await pg.evaluate(() => { const mr = Math.random; Math.random = () => (3 - 0.5) / 6; document.getElementById('brollbtn').click(); Math.random = mr; });
  await pg.waitForSelector('.d3z', { timeout: 8000 });
  // 2026-10-14 開発29（2）：正式の面＝正式デザイン A の絵（面取り・角の飾りは絵の中）＝面取りの帯・角の丸い飾りは出さない・中の金の芯 6枚
  const a = await pg.evaluate(() => { const z = document.querySelector('.d3z'); return { off: z.classList.contains('off'), skin: z.dataset.skin, e: z.querySelectorAll('.d3-e').length, c: z.querySelectorAll('.d3-c').length, k: z.querySelectorAll('.d3-k').length, f: z.querySelectorAll('.d3-f').length, radius: getComputedStyle(z.querySelector('.d3-f')).borderRadius, bi: getComputedStyle(z.querySelector('.d3-f')).backgroundImage }; });
  assert.deepEqual([a.off, a.skin, a.e, a.c, a.k, a.f], [true, 'official', 0, 0, 6, 6], JSON.stringify(a));
  assert.ok(parseFloat(a.radius) > 0, `角が丸い ${a.radius}`); assert.match(a.bi, /cube_1014\/face_[1-6]\.webp/, '正式デザイン A の面');
  await pg.waitForFunction(() => document.querySelector('.d3z') && document.querySelector('.d3z').dataset.final, null, { timeout: 8000 });
  const r = await pg.evaluate(() => { const t = document.querySelector('.d3z .d3-tilt'); const m = /matrix3d\(([^)]+)\)/.exec(getComputedStyle(t).transform); return { fin: document.querySelector('.d3z').dataset.final, n: m ? m[1].split(',').map(Number) : null }; });
  assert.equal(r.fin, '3');
  assert.ok(r.n && Math.abs(r.n[10]) >= 0.96 && (Math.abs(r.n[8]) > 0.05 || Math.abs(r.n[9]) > 0.05), `少し斜め・出目の面は正面（${r.n && r.n.slice(8, 11)}）`);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('D28-B7：全景 → 盤のズーム＝地面の板の Web Animations・マスの幅を毎フレーム書き換えない・倍率は単調で途切れない（刻み ≤ 0.25秒）・終わったら残らない', { skip: SKIP, timeout: 200000 }, async () => {
  const p = await openPage({ worldCh1: true, intro: true }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMRF_WORLD.warmArt(); MMP8.depart(S, m, () => 0.37); save(); board(); });
  await pg.waitForSelector('#wbw .rfw-plane', { timeout: 30000 });
  // 地面の板のアニメーションが始まるまで待ち、倍率を rAF ごとに記録する（マスの style の書き換えも数える）
  //  rAF の刻みはメインスレッドの混み具合（画像のデコード・同時に動くほかのテスト）で伸びることがある＝250ms を超えたら、もう一度出発して測り直す（2回とも超えたら失敗）
  const measure = () => pg.evaluate(() => new Promise((ok) => {
    const plane = document.querySelector('#wbw .rfw-plane'), tiles = [...document.querySelectorAll('#wbw .rfw-tile')];
    const t0 = performance.now(), writes = []; const mo = new MutationObserver((ms) => { writes.push([Math.round(performance.now() - t0), ms.length, ms.slice(0, 3).map((m) => (m.target.dataset.id || m.target.className) + ':' + String(m.oldValue).slice(0, 40) + '→' + m.target.getAttribute('style').slice(0, 40))]); }); for (const t of tiles) mo.observe(t, { attributes: true, attributeFilter: ['style'], attributeOldValue: true });
    const sc = (el) => { const m = /matrix(3d)?\(([^)]+)\)/.exec(getComputedStyle(el).transform); if (!m) return 1; const n = m[2].split(',').map(Number); return m[1] ? Math.hypot(n[0], n[1], n[2]) : Math.hypot(n[0], n[1]); };
    const s = []; let lastRun = 0;
    const f = (t) => { const run = document.getAnimations().some((a) => a.effect && a.effect.target === plane && a.playState === 'running'); s.push([Math.round(t - t0), +sc(plane).toFixed(4)]); if (run) lastRun = Math.round(t - t0); if (run && t - t0 < 8000) requestAnimationFrame(f); else setTimeout(() => { mo.disconnect(); ok({ s, writes, lastRun, tiles: tiles.length }); }, 50); };
    requestAnimationFrame(f);
  }));
  const gapOf = (s) => { let g = 0, at = 0; for (let i = 1; i < s.length; i++) if (s[i][0] - s[i - 1][0] > g) { g = s[i][0] - s[i - 1][0]; at = s[i][0]; } return { g, at }; };
  let r = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    await pg.waitForFunction(() => document.getAnimations().some((a) => a.effect && a.effect.target && a.effect.target.classList.contains('rfw-plane') && a.playState === 'running'), null, { timeout: 30000 });
    r = await measure();
    if (gapOf(r.s).g <= 250) break;
    if (attempt === 0) {   // もう一度（読み込み直して開始の俯瞰から）
      await settle(pg); await pg.evaluate(() => { S.m.raise.field.introSeen = false; save(); });
      await pg.reload(); await pg.waitForFunction(() => typeof S === 'object' && !!S.m, null, { timeout: 60000 });
      await pg.evaluate(() => { MMRF_WORLD.warmArt(); board(); }); await pg.waitForSelector('#wbw .rfw-plane', { timeout: 30000 });
    }
  }
  assert.ok(r.tiles > 200 && r.s.length > 20, `${r.tiles} マス・${r.s.length} フレーム`);
  // 動いている間はマスの style を書き換えない（Web Animations だけ）。終わったとき（finishIntro）に最後の姿を1回ずつ入れる
  const during = r.writes.filter((w) => w[0] < r.lastRun - 20).reduce((a, w) => a + w[1], 0), total = r.writes.reduce((a, w) => a + w[1], 0);
  assert.ok(during <= 2, `ズームの間の書き換えは毎フレームではない（${during} 回。${JSON.stringify(r.writes.filter((w) => w[0] < r.lastRun - 20).slice(0, 4))} … 終わり ${r.lastRun}ms）`);   // 見える範囲に入ったマスの display の切り替え（最大数回）は毎フレームの幅・zIndex の書き換えではない
  // 2026-10-14 進入時のクラッシュ対策：寄る間だけ縮めた幅を終わりで戻す＝終わりの1回の処理でマスごとに最大2つ（幅を戻す・最後の姿）
  assert.ok(total <= r.tiles * 2, `終わりの1回だけ（${total} ≤ ${r.tiles} × 2）`);
  const dec = []; for (let i = 1; i < r.s.length; i++) { if (r.s[i][1] < r.s[i - 1][1] - 1e-6) dec.push([i, r.s[i - 2], r.s[i - 1], r.s[i], r.s[i + 1]]); }
  const gap = gapOf(r.s);
  assert.equal(dec.length, 0, `倍率は単調に増える（逆行 ${JSON.stringify(dec)}・${r.s.length} フレーム・終わり ${r.lastRun}ms）`); assert.ok(gap.g <= 250, `途切れない（最大の刻み ${gap.g}ms・${gap.at}ms の所・${r.s.length} フレーム）`);
  assert.ok(r.s[r.s.length - 1][1] > r.s[0][1] * 2, `全景 → START へ寄る（${r.s[0][1]} → ${r.s[r.s.length - 1][1]}）`);
  await settle(pg);
  // 残るのは盤の常時のアニメーション（レアの紋章の脈動・START の光など）だけ＝寄りの道筋（地面の板・マス・景物・モンスター・題字）のアニメーションは残らない
  const after = await pg.evaluate(() => ({ anims: document.getAnimations().filter((a) => { const e = a.effect && a.effect.target; return !!(e && e.classList && /(^|\s)rfw-(plane|tile|prop|mon|title)(\s|$)/.test(e.className.toString())); }).map((a) => a.effect.target.className.toString().slice(0, 20)), intro: MMWB.state().intro }));
  assert.equal(after.intro, false); assert.deepEqual(after.anims, [], '寄りのアニメーションが残らない');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('D28-B8：観客の声の既定＝通常（1.0秒）・利用者が選んだ設定（短い）はそのまま', { skip: SKIP, timeout: 60000 }, async () => {
  const p = await openPage({}); const pg = p.page;
  await pg.waitForSelector('.mmtscr');
  assert.deepEqual(await pg.evaluate(() => MMCROWD.settings()), { mode: 'long', level: 'std' });
  const q = await openPage({ raw: { mmcrowd: JSON.stringify({ mode: 'short', level: 'soft' }) } }); const qg = q.page;
  await qg.waitForSelector('.mmtscr');
  assert.deepEqual(await qg.evaluate(() => MMCROWD.settings()), { mode: 'short', level: 'soft' }, '利用者の設定は残る');
  assert.deepEqual(p.errors, []); assert.deepEqual(q.errors, []);
});
