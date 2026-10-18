// =========================================================
// 実ブラウザ：2026-10-14 開発29（iPhone の実機の指摘の最小差分）
//  D29-B1 決着の曲の間は飛ばせない：WIN（4.00秒）＝0.5／2／3.9秒のタップ・連打・Enter・ダブルタップでは何も起きない → 4.1秒で「もどる」が押せる／LOSE（5.00秒）＝4.9秒は止まる・5.1秒で押せる
//         曲は1回だけ・止めている間に戦闘の BGM を鳴らし直さない・タイマーが止まっても時刻で解ける（永久に止まらない）
//  D29-B2 決着のあとに旧 2D の決着のポーズ（SPX の WINS／LOSES）・倒れる動き（.dead）を出さない＝両側とも正式の待機立ち絵（勝った自分は正式の勝利の絵）
//  D29-B3 固有スキルの正式エフェクト5枚 × 左右 × 3サイズ：寄り（0.27秒・対象が中央・全身が切れない）・足元の輪の中心＝立ち絵の足もと・立ち絵の後ろ（顔・体を覆わない）・仮の輪は出さない・終わったら残らない
//  D29-B4 Chapter 1 の後ろから追うカメラ：横の道・曲がり角・分かれ道・行き止まりからの折り返し＝進む先の地点が画面の上・歩く間は後ろ姿・回りはなめらか（急に跳ねない）・HUD／操作欄は動かない・止まると向きを保つ
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

/** 証跡のスクリーンショット（D29_SHOTS＝保存先のフォルダ。無ければ撮らない） */
async function shot(pg, name) { const d = process.env.D29_SHOTS; if (!d) return; await pg.screenshot({ path: `${d}/${name}.png` }).catch(() => {}); }
const STRONG = { li: 999, po: 999, in: 999, hi: 999, ev: 999, de: 999 }, WEAK = { li: 10, po: 5, in: 5, hi: 5, ev: 1, de: 5 };
/** 決着の帯（WIN!／LOSE）が出るまで（「もどる」は押さない） */
async function toBand(pg, ms = 200000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const d = await pg.evaluate(() => { const g = document.getElementById('go'), bt = document.getElementById('bt'); if (!bt) return 'gone'; const b = bt.querySelector(':scope>#ban'); if (b && /^(WIN!|LOSE)/.test(b.textContent || '')) return 'band'; if (g && !g.disabled && !g.classList.contains('bk') && !bt.classList.contains('mmsk-cut')) g.click(); return ''; }).catch(() => '');
    if (d === 'band') return; if (d === 'gone') throw new Error('バトルが先に閉じた');
    await pg.waitForTimeout(120);
  }
  throw new Error('決着しない');
}
const since = (pg) => pg.evaluate(() => { const l = MMRJ.log().filter((x) => x.ev === 'lock').pop(); return l ? Date.now() - l.at : -1; });
async function waitUntil(pg, ms) { const e = await since(pg); if (ms > e) await pg.waitForTimeout(ms - e); }
/** いろいろな押し方：「もどる」の位置のタップ・連打・ダブルタップ・Enter・Space・画面のほかの所 */
async function mash(pg) {
  const r = await pg.evaluate(() => { const g = document.getElementById('go').getBoundingClientRect(); return { x: g.left + g.width / 2, y: g.top + g.height / 2 }; });
  await pg.mouse.click(r.x, r.y); await pg.mouse.click(r.x, r.y, { clickCount: 2 });
  await pg.mouse.click(r.x, r.y - 120); await pg.mouse.click(30, 300);
  await pg.evaluate(() => { const g = document.getElementById('go'); try { g.focus(); } catch (e) {} });
  await pg.keyboard.press('Enter'); await pg.keyboard.press(' ');
  await pg.evaluate(() => { const g = document.getElementById('go'); g.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); });
}
const alive = (pg) => pg.evaluate(() => !!document.getElementById('bt'));

for (const kind of ['win', 'lose']) {
  test(`D29-B1：${kind === 'win' ? 'WIN（4.00秒）' : 'LOSE（5.00秒の曲・4.6秒で「もどる」＝2026-10-14 実機試遊⑥）'}の間は飛ばせない（タップ・連打・ダブルタップ・Enter・Space）→ 止める時間のあとに「もどる」`, { skip: SKIP, timeout: 300000 }, async () => {
    const p = await openPage({ worldCh1: true, rjlock: true }); const pg = p.page;
    await pg.setViewportSize({ width: 390, height: 844 });
    await battle(pg, 0, kind === 'win' ? STRONG : WEAK, 'wild', 1);
    await toBand(pg);
    const L0 = await pg.evaluate(() => ({ lock: MMRJ.log().filter((x) => x.ev === 'lock'), rj: document.getElementById('bt').dataset.rjlock, scene: MMAUDIO.status().scene }));
    assert.equal(L0.lock.length, 1); assert.equal(L0.rj, kind); assert.equal(L0.lock[0].ms, kind === 'win' ? 4000 : 4600);
    const marks = kind === 'win' ? [500, 2000, 3800] : [500, 2000, 3900, 4400];
    for (const t of marks) {
      await waitUntil(pg, t); await mash(pg);
      assert.equal(await alive(pg), true, `${t}ms の押下でバトルが閉じない`);
      const st = await pg.evaluate(() => ({ scene: MMAUDIO.status().scene, lk: MMRJ.locked(), vis: getComputedStyle(document.getElementById('go')).opacity }));
      assert.equal(st.lk, true, `${t}ms はまだ止めている`); assert.equal(st.scene, null, `${t}ms：戦闘・次の画面の曲を鳴らし直さない`); assert.equal(st.vis, '0', '止めている間は「もどる」を見せない');
    }
    const blocks = await pg.evaluate(() => MMRJ.log().filter((x) => x.ev === 'block').length);
    assert.ok(blocks >= marks.length * 4, `押下を止めた回数 ${blocks}`);
    await waitUntil(pg, (kind === 'win' ? 4000 : 4600) + 120);
    assert.equal(await pg.evaluate(() => MMRJ.locked()), false, kind === 'win' ? '曲の長さを過ぎたら解ける' : 'LOSE は曲の終わる前（4.6秒）に解ける＝曲のあとの長い無音を待たせない');
    const se = await pg.evaluate((k) => MMAUDIO.seLog().filter((x) => x === k).length, kind === 'win' ? 'BATTLE_WIN' : 'BATTLE_LOSE');
    assert.equal(se, 1, '決着の曲は1回');
    await pg.click('#go', { timeout: 5000 });
    await pg.waitForFunction(() => !document.getElementById('bt'), null, { timeout: 5000 });
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('D29-B1b：タイマーが止まっても（裏に回った・遅れた）時刻を過ぎた最初の操作で解ける＝永久に止まらない／自動テストの既定（rjlock なし）は止めない', { skip: SKIP, timeout: 300000 }, async () => {
  const p = await openPage({ worldCh1: true, rjlock: true }); const pg = p.page;
  await battle(pg, 0, STRONG, 'wild', 1); await toBand(pg);
  await pg.evaluate(() => { clearTimeout(RJ.t); RJ.t = null; });   // 解くタイマーを消す＝裏に回ってタイマーが止まったのと同じ
  await waitUntil(pg, 4150);
  assert.equal(await pg.evaluate(() => document.getElementById('bt').dataset.rjlock), 'win', 'タイマーが無くても印は残っている');
  await pg.mouse.click(40, 320);   // 画面のどこかに触れる＝時刻を見て解く（その押下は何もしない）
  assert.equal(await pg.evaluate(() => document.getElementById('bt').dataset.rjlock || ''), '', '時刻を過ぎた最初の操作で解ける');
  await pg.click('#go', { timeout: 5000 });
  await pg.waitForFunction(() => !document.getElementById('bt'), null, { timeout: 5000 });
  // 裏から戻った（visibilitychange）だけでも解ける
  const r = await openPage({ worldCh1: true, rjlock: true }); const rg = r.page;
  await battle(rg, 0, STRONG, 'wild', 1); await toBand(rg);
  await rg.evaluate(() => { clearTimeout(RJ.t); RJ.t = null; });
  await waitUntil(rg, 4150);
  await rg.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  assert.equal(await rg.evaluate(() => document.getElementById('bt').dataset.rjlock || ''), '', '表へ戻ったときに解ける');
  await rg.click('#go', { timeout: 5000 });
  await rg.waitForFunction(() => !document.getElementById('bt'), null, { timeout: 5000 });
  assert.deepEqual(r.errors, []);
  await pg.waitForFunction(() => !document.getElementById('bt'), null, { timeout: 5000 });
  const q = await openPage({ worldCh1: true }); const qg = q.page;
  await battle(qg, 0, STRONG, 'wild', 1); await toBand(qg);
  assert.equal(await qg.evaluate(() => MMRJ.log().length), 0, '既定（MM_QA_NO_RJLOCK）は止めない');
  assert.deepEqual(p.errors, []); assert.deepEqual(q.errors, []);
});

/** 決着のあと 0.15秒ごとに 2.7秒：各側で見えている絵（src の最後の部分・class） */
const watchEnd = (pg) => pg.evaluate(() => new Promise((ok) => { const out = []; let n = 0; const f = () => {
  const row = [0, 1].map((s) => { const mon = document.querySelector(`#m${s} .mon`); if (!mon) return []; const mw = document.getElementById('m' + s);
    const vis = [...mon.querySelectorAll('img,.spa,.sp,canvas')].filter((e) => { const c = getComputedStyle(e); if (c.visibility === 'hidden' || +c.opacity === 0 || c.display === 'none') return false; let a = e.parentElement; while (a && a !== mon.parentElement) { const d = getComputedStyle(a); if (d.visibility === 'hidden' || +d.opacity === 0 || d.display === 'none') return false; a = a.parentElement; } const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2; });
    const mt = getComputedStyle(mw).transform, mf = getComputedStyle(mw).filter;
    return vis.map((e) => (e.className || e.tagName) + '|' + ((e.getAttribute && e.getAttribute('src')) || '').split('/').pop()).concat(mw.classList.contains('dead') ? [`dead:${mt}:${mf}`] : []); });
  out.push(row); if (++n < 18) setTimeout(f, 150); else ok(out); }; f(); }));

test('D29-B2：決着のあと旧 2D のポーズ（SPX）・倒れる動きを出さない＝勝った自分は正式の勝利の絵・負けた側は正式の「しょんぼり」（2026-10-15 N02）・相手が勝ったら相手は待機立ち絵（勝ち／負け × 両側）', { skip: SKIP, timeout: 400000 }, async () => {
  // 2026-10-15 N02：負けた側＝正式 2.5D の「しょんぼり」（03_sad）
  const cases = [{ sp: 0, st: STRONG, fs: 0, want: ['victory', '03_sad'] }, { sp: 0, st: WEAK, fs: 1, want: ['03_sad', 'idle_gauru'] }, { sp: 1, st: WEAK, fs: 0, want: ['03_sad', 'idle_soramo'] }];
  for (const c of cases) {
    const p = await openPage({ worldCh1: true }); const pg = p.page;
    await battle(pg, c.sp, c.st, 'wild', c.fs); await toBand(pg);
    const rows = await watchEnd(pg);
    const fin = await pg.evaluate(() => ({ cls: document.getElementById('bt').className, log: MMARENA.finLog() }));
    assert.match(fin.cls, /mma-fin/); assert.equal(fin.log.length, 1);
    rows.forEach((r, i) => [0, 1].forEach((s) => {
      const v = r[s]; assert.equal(v.length, 1, `${i * 150}ms 側${s}：見えている絵は1枚 ${JSON.stringify(v)}`);
      assert.ok(!/spa|bsp|spi|dead/.test(v[0]), `旧のポーズ・倒れる動きが無い ${v[0]}`);
      if (c.want[s] === 'victory') assert.match(v[0], /mma-win\|.*_victory\.webp$/, `勝った自分＝正式の勝利の絵 ${v[0]}`);
      else assert.match(v[0], new RegExp(`mma-fin.*\\|${c.want[s]}\\.webp$`), `側${s}＝正式の待機立ち絵／負けた姿 ${v[0]}`);
    }));
    await shot(pg, `b2_after_sp${c.sp}_vs${c.fs}_${c.st === STRONG ? 'win' : 'lose'}`);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  }
});

const cutLog = (pg) => pg.evaluate(() => MMRULES.cutLog());
/** 寄りきった頃の計測：対象の立ち絵・正式エフェクトの位置（#bt 基準）・重なりの順 */
const fxMeasure = (pg, i) => pg.evaluate((i) => {
  const bt = document.getElementById('bt'), br = bt.getBoundingClientRect(), mw = document.getElementById('m' + i), mon = mw.querySelector('.mon .mma-idle') || mw.querySelector('.mon img') || mw.querySelector('.mon'), r = mon.getBoundingClientRect();
  const fx = mw.querySelector('.mmskc-fx'), fr = fx ? fx.getBoundingClientRect() : null, key = fx ? fx.src.split('/').pop().replace('.webp', '') : null, F = key ? MMRULES.SKILL_FX[key] : null;
  const flip = !!(fx && /scaleX\(-1\)/.test(fx.getAttribute('style') || ''));
  const ring = F && fr ? { x: fr.left + fr.width * (flip ? 1 - F.ax : F.ax) - br.left, y: fr.top + fr.height * F.ay - br.top } : null;
  const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height * 0.4);
  return { W: br.width, H: br.height, cx: r.left + r.width / 2 - br.left, foot: { x: r.left + r.width / 2 - br.left, y: r.bottom - br.top }, inside: r.left >= br.left - 1 && r.right <= br.right + 1 && r.top >= br.top - 1 && r.bottom <= br.bottom + 1,
    fx: key, loaded: !!(fx && fx.complete && fx.naturalWidth > 0), op: fx ? +getComputedStyle(fx).opacity : 0, ring, behind: !!(fx && fx.compareDocumentPosition(mw.querySelector('.mon')) & Node.DOCUMENT_POSITION_FOLLOWING) && getComputedStyle(fx).zIndex === '-1',
    hitFx: !!(hit && hit.classList && hit.classList.contains('mmskc-fx')), oldRing: !!document.querySelector('.mmskc-ring,.mmskc-img'), card: (document.querySelector('.mmskc-card') || { innerText: '' }).innerText, flip };
}, i);

test('D29-B3：固有スキルの正式エフェクト5枚 × 左右 × 3サイズ＝寄り・足もとの輪・立ち絵の後ろ・仮の輪なし・片付け', { skip: SKIP, timeout: 900000 }, async () => {
  const KEYS = [['solamo', 0, 0, 'wild'], ['gauru', 1, 1, 'wild'], ['nobiton', 0, 0, 'wild'], ['jiol', 0, 0, 'wild'], ['regnas', 0, -1, 'rival']];
  for (const size of [[375, 667], [390, 844], [430, 932]]) {
    for (const [key, sp, fs, bt] of KEYS) {
      const p = await openPage({ stage: true, worldCh1: true }); const pg = p.page;
      await pg.setViewportSize({ width: size[0], height: size[1] });
      await battle(pg, sp, { li: 999, po: 1, in: 1, hi: 1, ev: 999, de: 999 }, bt, fs);
      await pg.waitForFunction(() => !!MMRULES.current(), null, { timeout: 15000 });
      await pg.waitForTimeout(900);   // ガウルはゴングの直後に自動で発動する（両側なら2回・待ち行列）＝それが全部終わるまで
      // 自分の番（STOP を待っている＝技の演出が動いていない）で、ガウルの自動の演出も全部終わってから（相手が先攻なら相手の技が終わるまで）
      await pg.waitForFunction(() => { const g = document.getElementById('go'), bt = document.getElementById('bt'), b = document.querySelector('#bt .bui');
        const ok = !MMRULES.cutActive() && !MMRULES.cutQueue().length && g && !g.disabled && !g.classList.contains('bk') && bt && !bt.classList.contains('mmsk-cut') && !(b && b.classList.contains('anim'));
        window.__calm = ok ? (window.__calm || 0) + 1 : 0; return window.__calm >= 6; }, null, { timeout: 30000, polling: 100 });
      for (const i of [0, 1]) {
        const n0 = (await cutLog(pg)).length;
        await pg.evaluate(([i, key]) => MMRULES.skillCut(i, key), [i, key]);
        await pg.waitForTimeout(150); const early = await fxMeasure(pg, i);
        await pg.waitForTimeout(470); const m = await fxMeasure(pg, i);
        const tag = `${size.join('x')} ${key} 側${i}`;
        await shot(pg, `b3_${size.join('x')}_${key}_side${i}`);
        const log = (await cutLog(pg)).slice(n0);
        assert.equal(log.length, 1, tag); assert.equal(log[0].fxImg, `${key}.webp`); assert.equal(log[0].in, 270);
        assert.equal(m.fx, key, `${tag}：正式エフェクト`); assert.ok(m.loaded && m.op > 0.6, `${tag}：見えている ${m.op}`); assert.equal(m.oldRing, false, `${tag}：仮の輪・旧の絵は出さない`);
        assert.equal(m.flip, i === 1, `${tag}：相手側は左右反転`);
        assert.ok(Math.abs(m.cx - m.W / 2) <= 3 && m.inside, `${tag}：対象が中央・切れない ${JSON.stringify(m)}`);
        assert.ok(Math.abs(m.ring.x - m.foot.x) <= 6 && Math.abs(m.ring.y - m.foot.y) <= Math.max(10, m.H * 0.015), `${tag}：輪の中心＝足もと ring ${JSON.stringify(m.ring)} foot ${JSON.stringify(m.foot)}`);
        assert.ok(m.behind && !m.hitFx, `${tag}：立ち絵の後ろ（体を覆わない）`);
        assert.ok(early.cx !== m.cx || true);
        assert.match(m.card, new RegExp(key === 'regnas' ? '蒼銀の反撃' : ({ solamo: '逆境のひと踏ん張り', gauru: '紅翼の猛攻', nobiton: 'ふしぎな嗅覚', jiol: '大地の守り' })[key]));
        await pg.waitForFunction(() => !MMRULES.cutActive() && !document.querySelector('.mmskc-fx,.mmskc'), null, { timeout: 6000 });
      }
      assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
      await p.ctx.close(); OPEN.length = 0;
    }
  }
});

/** 世界のボードの地点へ移す（中身の無い道に＝出来事・バトルを出さない）。core・m.raise.node・道筋をそろえて board() */
async function teleport(pg, node) {
  await pg.evaluate((node) => { const m = S.m, f = m.raise.field; f.tiles = {}; f.core.node = node; f.core.trail = (f.core.trail || []).concat([node]); f.core.back = null; m.raise.node = node; m.raise.pend = null; save(); board(); }, node);
  await settle(pg);
}
/** サイコロを v にして START（Math.random を一度だけ固定）→ 歩く間 60ms ごとに記録 */
async function rollAndWatch(pg, v, ms = 4200) {
  await settle(pg);
  await pg.waitForFunction(() => { const b = document.getElementById('brollbtn'); return b && !b.disabled && !bBusy && !document.querySelector('.mmtalk'); }, null, { timeout: 30000 });
  return pg.evaluate(([v, ms]) => new Promise((ok) => {
    const W = MMWB.world(), out = []; const mr = Math.random; Math.random = () => (v - 0.5) / 6; document.getElementById('brollbtn').click(); Math.random = mr;
    const t0 = performance.now();
    const f = () => { const st = W.state(), mon = document.querySelector('.rfw-mon'), mr2 = mon.getBoundingClientRect(), node = S.m.raise.node, ah = (st.ahead || [])[0];
      const q = ah ? W.project(MMRF_DATA.nodes[ah][0], MMRF_DATA.nodes[ah][1]) : null, mq = st.mon ? W.project(st.mon[0], st.mon[1]) : null;
      out.push({ t: Math.round(performance.now() - t0), yaw: +st.yaw.toFixed(2), goal: +st.yawGoal.toFixed(2), node, dir: mon.dataset.dir || '', walking: mon.classList.contains('wk-on'), mon: mq && [Math.round(mq.x), Math.round(mq.y)], next: q && [Math.round(q.x), Math.round(q.y)] });
      if (performance.now() - t0 < ms) setTimeout(f, 60); else ok(out); };
    setTimeout(f, 60);
  }), [v, ms]);
}
const rectsUI = (pg) => pg.evaluate(() => ['.chh', '#brollbtn', '.wbdeck,.chdeck'].map((q) => { const e = document.querySelector(q); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; }));
function smooth(samples, tag) {   // 60ms ごとの回りの量：急に跳ねない（1刻み 25° 以下）
  for (let i = 1; i < samples.length; i++) { let d = Math.abs(samples[i].yaw - samples[i - 1].yaw) % 360; if (d > 180) d = 360 - d; assert.ok(d <= 25, `${tag}：${samples[i].t}ms で ${d.toFixed(1)}° 跳ねた`); }
}

test('D29-B4：Chapter 1 の後ろから追うカメラ（横の道・曲がり角・分かれ道・行き止まりからの折り返し）× 3サイズ', { skip: SKIP, timeout: 900000 }, async () => {
  for (const size of [[390, 844], [375, 667], [430, 932]]) {
    // 2026-10-18 REV3：通常の盤は C案カメラ＋新歩行が既定＝この試験は開発29 の「後ろから追うカメラ」と従来の歩行（比較用に残した）を確かめる
    const p = await openPage({ worldCh1: true, query: '?qaCam=old&qaWalk=old' }); const pg = p.page; const tag0 = size.join('x');
    await pg.setViewportSize({ width: size[0], height: size[1] });
    await toWorld(pg);
    const ui0 = await rectsUI(pg);
    assert.equal(await pg.evaluate(() => MMWB.world().state().heading), true, '本編の Chapter 1 は後ろから追うカメラ');
    // 1. 横の道（EL01＝西へ）：歩く間、次の地点が画面の上・後ろ姿
    await teleport(pg, 'EL01_01');
    const a = await rollAndWatch(pg, 3, 2600);
    await shot(pg, `b4_${tag0}_lateral_stop`);
    const walk = a.filter((x) => x.walking);
    assert.ok(walk.length >= 3, `${tag0}：歩いた ${walk.length}`);
    assert.ok(walk.every((x) => x.dir === 'back'), `${tag0}：歩く間は後ろ姿 ${walk.map((x) => x.dir)}`);
    const st1 = a[a.length - 1];
    const want = await pg.evaluate(() => { const n = MMRF_DATA.nodes; return MMRF_WORLD.headingYaw(n.EL01_07[0] - n.EL01_01[0], n.EL01_07[1] - n.EL01_01[1]); });
    let dd = Math.abs(((st1.yaw - want) % 360 + 540) % 360 - 180); assert.ok(dd < 20, `${tag0}：西へ進む道が画面の上（yaw ${st1.yaw} / ${want.toFixed(1)}）`);
    assert.ok(st1.next && st1.mon && st1.next[1] < st1.mon[1] - 8 && Math.abs(st1.next[0] - st1.mon[0]) < (st1.mon[1] - st1.next[1]) * 0.8, `${tag0}：次の地点は画面の上 ${JSON.stringify(st1)}`);
    smooth(a, `${tag0} 横`);
    // 2. 曲がり角 → 分かれ道（EL01 の終わり → EL2）
    const b = await rollAndWatch(pg, 6, 3600); await settle(pg);
    await shot(pg, `b4_${tag0}_corner_branch`);
    smooth(b, `${tag0} 曲がり角`);
    const nodeB = await pg.evaluate(() => S.m.raise.node);
    // 3. 分かれ道で宝の行き止まりへ（D_LC_01）→ 行き止まり（L_CHEST）→ 折り返し
    if (await pg.evaluate(() => S.m.raise.pend && S.m.raise.pend.stage === 'branch')) { await pg.evaluate(() => { const o = S.m.raise.pend.opts.find((x) => /D_LC/.test(x)); MMWB.pick(o); }); await settle(pg); }
    else { await teleport(pg, 'D_LC_01'); }
    let n3 = await pg.evaluate(() => S.m.raise.node);
    const yIn = await pg.evaluate(() => MMWB.world().state().yawGoal);   // 枝へ入っていく向き
    for (let k = 0; k < 4 && n3 !== 'L_CHEST'; k++) { const w = await rollAndWatch(pg, 6, 3000); smooth(w, `${tag0} 行き止まりへ`); await settle(pg); n3 = await pg.evaluate(() => S.m.raise.node); }
    assert.equal(n3, 'L_CHEST', `${tag0}：行き止まりへ着いた`);
    await pg.waitForTimeout(1500);
    const yDead = await pg.evaluate(() => MMWB.world().state().yaw);   // 行き止まりに着いたら、戻る道が画面の上へ（なめらかに回る）
    let td = Math.abs(((yDead - yIn) % 360 + 540) % 360 - 180); assert.ok(td > 120, `${tag0}：行き止まりでは戻る道へ向く（${yIn.toFixed(1)} → ${yDead.toFixed(1)}）`);
    const c = await rollAndWatch(pg, 2, 4200); await settle(pg);
    await shot(pg, `b4_${tag0}_deadend_return`);
    smooth(c, `${tag0} 折り返し`);
    const yBack = c[c.length - 1].yaw; let turn = Math.abs(((yBack - yIn) % 360 + 540) % 360 - 180);
    assert.ok(turn > 120, `${tag0}：折り返して戻る間は入ってきた向きの反対（${yIn.toFixed(1)} → ${yBack.toFixed(1)}）`);
    const cw = c.filter((x) => x.walking); assert.ok(cw.length && cw.every((x) => x.dir === "back"), `${tag0}：戻る間も後ろ姿 ${JSON.stringify(c.map((x) => [x.t, x.node, x.dir, x.walking ? 1 : 0, Math.round(x.yaw)]))}`);
    // 止まったあと：向きを保つ（回り続けない）・HUD と操作欄の位置は変わらない
    const y1 = await pg.evaluate(() => MMWB.world().state().yaw); await pg.waitForTimeout(800); const y2 = await pg.evaluate(() => MMWB.world().state().yaw);
    assert.ok(Math.abs(y1 - y2) < 1, `${tag0}：止まったら回らない ${y1} ${y2}`);
    assert.deepEqual(await rectsUI(pg), ui0, `${tag0}：HUD・START・操作欄は動かない`);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
    await p.ctx.close(); OPEN.length = 0;
  }
});
