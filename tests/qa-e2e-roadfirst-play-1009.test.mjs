// =========================================================
// 実ブラウザ：Chapter 1 Pattern A 道路先行の試作 — 育成の中身（2026-10-09・?chapterBoard=roadfirst・js/proto/roadfirst-play.js）
//  RP-B1 3サイズ（375×667・390×844・430×932）：HUD（疲れ・試作G・能力）とボタンが画面の中・重ならない・能力マスに止まる → 正式の成長量 → 結果の表示 →
//        再読み込みしても同じ表示・効果は二重にならない → OK で次へ・ゲームのセーブ（mr4v6）は変わらない
//  RP-B2 2択の出来事：選ぶ前に再読み込み → 同じ選択肢 → 選ぶ → 再読み込みしても効果は1回
//  RP-B3 疲れ 100：サイコロは振れず主ボタンが「休む」→ 1ターン・移動なし・疲れ −30
//  RP-B4 読めない保存：消さずに案内 → 「最初から」で控え（mmrf_proto_v1_broken）を残して新しく始める・旧形式（v 1）は v 2 へ移行（同じ地点・ターン）
//  RP-B5 能力パネル（6能力・適性・増分・報酬・最近の出来事）と凡例・下の操作を隠さない
//  RP-B6 画面の操作だけで START → GOAL（疲れで休む・出来事の OK を含む）→「大会の入口へ」＝既存の大会受付・セーブは変わらない
//  QA_E2E=1 のときだけ実行（tests/e2e/harness.mjs）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
let L, opened = [];
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });
async function open(opt = {}) { for (const q of opened) await q.ctx.close().catch(() => {}); const p = await L.open(opt); opened = [p]; return p; }
const SHOT = process.env.RF_SHOT_DIR || null;
const shot = (pg, name) => (SHOT ? pg.screenshot({ path: `${SHOT}/${name}.png` }) : null);
const RF = '?chapterBoard=roadfirst';
/** 登録済み・ガウルを連れたセーブ（正式の関数で作る） */
async function registered(pg) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(1); m.name = 'ガウ'; MMP7.ensureProg(m); S.m = m; save(); });
  return pg.evaluate(() => localStorage.getItem('mr4v6'));
}
/** START から出目 d で止まる S01 のマスが kind（と条件）になる seed を探してそこから始める */
async function seedFor(pg, test) {
  return pg.evaluate((src) => {
    const f = new Function('t', 'e', `return (${src})(t, e);`);
    for (let seed = 1; seed < 3000; seed++) {
      const t = MMRF_PLAY.layout(MMRF_DATA, seed), ids = MMRF_DATA.segments.S01[3];
      for (let d = 1; d <= 6; d++) { const x = t[ids[d]]; if (x && f(x, x.e ? MMRF_PLAY.pool().find((e) => e.id === x.e) : null)) return { seed, d, id: ids[d], tile: x }; }
    }
    return null;
  }, test.toString());
}
const box = (pg, s) => pg.evaluate((s) => { const b = document.querySelector(s).getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom]; }, s);
const inView = (b, w, h) => b[0] >= -0.5 && b[1] >= -0.5 && b[2] <= w + 0.5 && b[3] <= h + 0.5;
const overlap = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

test('RP-B1：3サイズ：HUD とボタンが画面の中・能力マスで正式の成長量・再読み込みで二重にならない・mr4v6 不変', { skip: SKIP, timeout: 300000 }, async () => {
  for (const size of [[375, 667], [390, 844], [430, 932]]) {
    const p = await open({ size }); const pg = p.page;
    const save0 = await registered(pg);
    await pg.goto(L.url + 'index.html' + RF); await pg.waitForSelector('#rfp .rf-go');
    const f = await seedFor(pg, (t) => t.t === 'stat');
    assert.ok(f, 'S01 に能力マスがある seed');
    await pg.evaluate((s) => MMRF.reset({ seed: s }), f.seed); await pg.waitForTimeout(300);
    const b = { top: await box(pg, '#rfp .rf-top'), tools: await box(pg, '#rfp .rf-tools'), go: await box(pg, '#rfp .rf-go'), rest: await box(pg, '#rfp .rf-rest'), msg: await box(pg, '#rfp .rf-msg'), mon: await box(pg, '#rfp .rf-mon') };
    for (const [k, v] of Object.entries(b)) assert.ok(inView(v, size[0], size[1]), `${size}：${k} は画面の中 ${v}`);
    assert.ok(!overlap(b.top, b.tools), `${size}：右の道具は上の帯に重ならない`);
    assert.ok(!overlap(b.go, b.rest), `${size}：休むとサイコロは重ならない`);
    assert.ok(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '横にはみ出さない');
    const hud = await pg.$eval('#rfp .rf-play', (e) => e.innerText); assert.match(hud, /疲れ 0\/100/); assert.match(hud, /試作G 0/); assert.match(hud, /能力 \+0/);
    assert.equal(await pg.$$eval('#rfp .rf-tile', (x) => x.length) > 100, true, 'マスの印');
    await shot(pg, `RP-B1_${size.join('x')}_start`);
    const k = f.tile.k, want = await pg.evaluate((k) => MMP10M.GROWTH_GAIN[MMP10M.growthOf(S.m, k)], k);
    const base = await pg.evaluate((k) => MMRF.state().play.stats[k], k);
    await pg.evaluate((d) => MMRF.roll(d), f.d); await pg.waitForFunction(() => !MMRF.busy());
    let s = await pg.evaluate(() => MMRF.state());
    assert.equal(s.node, f.id); assert.equal(s.play.stats[k], base + want, `${k} が +${want}（正式の成長量）`); assert.equal(s.play.notice.kind, 'stat');
    assert.match(await pg.$eval('#rfp .rf-msg', (e) => e.innerText), new RegExp(`適性[A-E]） \\+${want} → ${base + want}`));
    assert.equal(await pg.$eval('#rfp .rf-go', (e) => e.textContent), 'OK（次へ）');
    assert.equal(s.play.fat, f.d + 1, `疲れ +${f.d + 1}【試作用】`);
    await shot(pg, `RP-B1_${size.join('x')}_stat`);
    for (const [kk, v] of Object.entries({ go: await box(pg, '#rfp .rf-go'), msg: await box(pg, '#rfp .rf-msg') })) assert.ok(inView(v, size[0], size[1]), `${size}：結果の表示中も ${kk} は画面の中`);
    // 再読み込み：同じ表示・同じ値（二重にならない）
    await pg.reload(); await pg.waitForSelector('#rfp .rf-go'); await pg.waitForTimeout(200);
    s = await pg.evaluate(() => MMRF.state());
    assert.equal(s.play.stats[k], base + want, '再読み込みしても二重にならない'); assert.equal(s.play.notice.kind, 'stat', '結果の表示はそのまま');
    assert.match(await pg.$eval('#rfp .rf-msg', (e) => e.innerText), /伸びた/);
    await pg.click('#rfp .rf-go'); s = await pg.evaluate(() => MMRF.state()); assert.equal(s.play.notice, null, 'OK で次へ'); assert.equal(s.turn, 1, 'OK はターンを使わない');
    assert.equal(await pg.$eval(`#rfp .rf-tile[data-id="${f.id}"]`, (e) => e.getAttribute('opacity')), '0.32', '使ったマスは薄く');
    assert.equal(await pg.evaluate(() => localStorage.getItem('mr4v6')), save0, 'ゲームのセーブ（mr4v6）は変わらない');
    assert.equal(await pg.evaluate(() => S.m.po + S.m.in + S.m.li), await pg.evaluate(() => { const m = JSON.parse(localStorage.getItem('mr4v6')).m; return m.po + m.in + m.li; }), '連れている子の能力は変わらない');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  }
});

test('RP-B2：2択の出来事：選ぶ前に再読み込み → 同じ選択肢 → 選ぶ → 再読み込みしても効果は1回', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await open({ size: [390, 844] }); const pg = p.page;
  await registered(pg); await pg.goto(L.url + 'index.html' + RF); await pg.waitForSelector('#rfp .rf-go');
  const f = await seedFor(pg, (t, e) => t.t === 'event' && e && !!e.choices);
  assert.ok(f, 'S01 に2択の出来事がある seed');
  await pg.evaluate((s) => MMRF.reset({ seed: s }), f.seed);
  await pg.evaluate((d) => MMRF.roll(d), f.d); await pg.waitForFunction(() => !MMRF.busy());
  const btn = await pg.$$eval('#rfp .rf-ch button', (b) => b.map((x) => x.dataset.nc));
  assert.deepEqual(btn, ['0', '1']); assert.equal(await pg.$eval('#rfp .rf-go', (b) => b.disabled), true, '選ぶまでサイコロは押せない');
  await shot(pg, 'RP-B2_choice');
  const before = await pg.evaluate(() => JSON.stringify(MMRF.state().play.stats) + MMRF.state().play.fat);
  await pg.reload(); await pg.waitForSelector('#rfp .rf-ch button[data-nc="1"]');
  assert.equal(await pg.evaluate(() => JSON.stringify(MMRF.state().play.stats) + MMRF.state().play.fat), before, '選ぶ前の再読み込みでは効果なし');
  await pg.click('#rfp .rf-ch button[data-nc="1"]');
  const after = await pg.evaluate(() => JSON.stringify(MMRF.state().play.stats) + MMRF.state().play.fat);
  assert.notEqual(after, before, '選んだ効果');
  await shot(pg, 'RP-B2_result');
  await pg.reload(); await pg.waitForSelector('#rfp .rf-go'); await pg.evaluate(() => MMRF.choice(0));
  assert.equal(await pg.evaluate(() => JSON.stringify(MMRF.state().play.stats) + MMRF.state().play.fat), after, '選んだあとに再読み込み・もう一度選んでも二重にならない');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('RP-B3：疲れ 100：主ボタンが「休む」→ 1ターン・移動なし・疲れ −30', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await open({ size: [375, 667] }); const pg = p.page;
  await registered(pg); await pg.goto(L.url + 'index.html' + RF + '&rfSeed=8'); await pg.waitForSelector('#rfp .rf-go');
  await pg.evaluate(() => MMRF.reset({ seed: 8 }));
  await pg.evaluate(() => MMRF.roll(2)); await pg.waitForFunction(() => !MMRF.busy());
  await pg.evaluate(() => { const s = JSON.parse(localStorage.getItem('mmrf_proto_v1')); s.play.fat = 100; s.play.notice = null; localStorage.setItem('mmrf_proto_v1', JSON.stringify(s)); });
  await pg.reload(); await pg.waitForSelector('#rfp .rf-go');
  assert.equal(await pg.$eval('#rfp .rf-go', (b) => b.textContent), '休む（疲れ100）');
  assert.match(await pg.$eval('#rfp .rf-fat', (e) => e.className), /hi/);
  await shot(pg, 'RP-B3_tired');
  const s0 = await pg.evaluate(() => MMRF.state());
  await pg.click('#rfp .rf-go');
  const s1 = await pg.evaluate(() => MMRF.state());
  assert.equal(s1.play.fat, 70); assert.equal(s1.turn, s0.turn + 1); assert.equal(s1.node, s0.node);
  assert.match(await pg.$eval('#rfp .rf-msg', (e) => e.innerText), /休んだ/);
  await pg.click('#rfp .rf-go'); assert.equal(await pg.$eval('#rfp .rf-go', (b) => b.textContent), 'サイコロを振る');
  // 休むボタン（疲れがあるとき）
  await pg.click('#rfp .rf-rest'); const s2 = await pg.evaluate(() => MMRF.state()); assert.equal(s2.play.fat, 40); assert.equal(s2.turn, s1.turn + 1);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('RP-B4：読めない保存は消さずに案内 → 最初から で控えを残す・旧形式（v 1）は v 2 へ移行', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await open({ size: [390, 844], query: RF }); const pg = p.page;
  await pg.waitForSelector('#rfp .rf-go');
  await pg.evaluate(() => localStorage.setItem('mmrf_proto_v1', '{"v":9,"broken'));
  await pg.reload(); await pg.waitForSelector('#rfp .rf-go');
  assert.match(await pg.$eval('#rfp .rf-msg', (e) => e.innerText), /読めませんでした/);
  assert.equal(await pg.$eval('#rfp .rf-go', (b) => b.disabled), true);
  assert.equal(await pg.evaluate(() => localStorage.getItem('mmrf_proto_v1')), '{"v":9,"broken', '元の保存は消さない');
  await pg.click('#rfp [data-a="reset"]');
  assert.equal(await pg.evaluate(() => localStorage.getItem('mmrf_proto_v1_broken')), '{"v":9,"broken', '控えを残す');
  assert.equal(await pg.evaluate(() => JSON.parse(localStorage.getItem('mmrf_proto_v1')).v), 2);
  // v 1（移動だけ）の保存 → v 2
  await pg.evaluate(() => { const s = MMRF_CORE.create(MMRF_DATA, { seed: 31 }); MMRF_CORE.roll(MMRF_DATA, s, 4); MMRF_CORE.advance(MMRF_DATA, s); localStorage.setItem('mmrf_proto_v1', JSON.stringify(s)); });
  const v1 = await pg.evaluate(() => JSON.parse(localStorage.getItem('mmrf_proto_v1')));
  await pg.reload(); await pg.waitForSelector('#rfp .rf-go');
  const s = await pg.evaluate(() => MMRF.state());
  assert.equal(s.v, 2); assert.equal(s.play.migrated, true); assert.equal(s.node, v1.node); assert.equal(s.turn, v1.turn); assert.deepEqual(s.trail, v1.trail);
  assert.match(await pg.$eval('#rfp .rf-msg', (e) => e.innerText), /移行/);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('RP-B5：能力パネル（6能力・適性・増分・報酬・出来事・凡例）・下の操作を隠さない', { skip: SKIP, timeout: 120000 }, async () => {
  for (const size of [[375, 667], [430, 932]]) {
    const p = await open({ size }); const pg = p.page;
    await registered(pg); await pg.goto(L.url + 'index.html' + RF + '&rfSeed=3'); await pg.waitForSelector('#rfp .rf-go');
    await pg.click('#rfp [data-a="stats"]');
    const t = await pg.$eval('#rfp .rf-panel', (e) => e.innerText);
    for (const w of ['ライフ', 'ちから', 'かしこさ', '命中', '回避', '丈夫さ', '適性', '固定報酬', '最近の出来事', '【試作用・要承認】', 'ガウ']) assert.ok(t.includes(w), w);
    const pb = await box(pg, '#rfp .rf-panel'), mb = await box(pg, '#rfp .rf-msg'), gb = await box(pg, '#rfp .rf-go');
    assert.ok(pb[3] <= mb[1] + 0.5 && !overlap(pb, gb), `${size}：パネルは下の操作に重ならない`);
    await shot(pg, `RP-B5_${size.join('x')}_panel`);
    await pg.click('#rfp [data-a="stats"]'); assert.equal(await pg.$eval('#rfp .rf-panel', (e) => getComputedStyle(e).display), 'none');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  }
});

test('RP-B6：画面の操作だけで START → GOAL（休む・OK を含む）→ 大会の入口 → 既存の大会受付・セーブは変わらない', { skip: SKIP, timeout: 300000 }, async () => {
  const p = await open({ size: [390, 844] }); const pg = p.page;
  const save0 = await registered(pg);
  let s = null;
  for (const seed of [5, 7, 11, 13, 17]) {
    await pg.goto(L.url + 'index.html' + RF + `&rfSeed=${seed}&rfRand=closed`); await pg.waitForSelector('#rfp .rf-go');
    await pg.evaluate((x) => { MMRF.reset({ seed: x, randOpen: false }); MMRF.fast = true; }, seed);
    for (let i = 0; i < 400; i++) {
      s = await pg.evaluate(() => MMRF.state()); if (s.done || s.timeUp) break;
      await pg.waitForFunction(() => !MMRF.busy());
      const btns = await pg.$$eval('#rfp .rf-ch button', (b) => b.map((x) => x.dataset.seg));
      if (btns.length) { const seg = ['EL01', 'LATE_SAFE'].find((x) => btns.includes(x)) || btns.find((x) => !/^D_/.test(x)) || btns[0]; await pg.click(`#rfp .rf-ch button[data-seg="${seg}"]`); }
      else if (s.play.fat >= 80 && !s.play.notice && await pg.$eval('#rfp .rf-rest', (b) => !b.disabled)) await pg.click('#rfp .rf-rest');
      else await pg.click('#rfp .rf-go');
    }
    if (s.done) break;
  }
  assert.ok(s.done, `GOAL（${s.node}・${s.turn}ターン）`); assert.ok(s.turn <= 40);
  for (const m of ['LOWER_GATE', 'Q', 'UPPER_GATE', 'RIVAL', 'H', 'FINAL', 'GOAL']) assert.ok(s.trail.includes(m), m);
  assert.ok(s.play.hist.length > 3, '止まったマスで出来事が起きた');
  const gain = Object.keys(s.play.stats).reduce((a, k) => a + s.play.stats[k] - s.play.mon.base[k], 0); assert.ok(gain > 0, `能力が伸びた（+${gain}）`);
  await pg.evaluate(() => { MMRF.fast = false; }); await pg.waitForTimeout(200); await shot(pg, 'RP-B6_goal');
  if (s.play.notice) await pg.click('#rfp .rf-go');
  assert.equal(await pg.$eval('#rfp .rf-go', (b) => b.textContent), '大会の入口へ');
  await pg.click('#rfp .rf-go');
  await pg.waitForFunction(() => !document.getElementById('rfp') && /公式大会/.test(document.querySelector('#app').innerText), null, { timeout: 15000 });
  assert.equal(await pg.evaluate(() => localStorage.getItem('mr4v6')), save0, '大会受付に入ってもセーブは変わらない');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});
