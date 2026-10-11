// =========================================================
// 実ブラウザ：RoadFirst の rfZones=all（68 Scene 全域・2026-10-10・試作）
//  S68-B1 390×844・375×667：代表3つ＝①図面だけの Scene（Scene01 → Scene02）②P の背景ゾーン（左から P＝Scene09・区域 core）
//         ③背景 → 図面の境目（C02_01＝Scene22 の門の区域 → C02_02＝Scene23 の図面）。上の帯の Scene・HUD に重ならない・区域では絵の外 0・
//         再読み込みで地点と Scene・区域が同じ・JS の例外 0
//  QA_E2E=1 のときだけ実行（tests/e2e/harness.mjs）。スクリーンショットは RF_SHOT_DIR があるときだけ
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
const overlap = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

async function boot(pg, seed) {
  await pg.goto(L.url + 'index.html?chapterBoard=roadfirst&rfZones=all&rfRand=closed&rfSeed=' + seed); await pg.waitForSelector('#rfp .rf-go');
  await pg.waitForFunction(() => (MMRF.zones().ready && MMRF.zones().index) || MMRF.zones().failed, null, { timeout: 20000 });
}
/** 出目を選んで target にちょうど止まる（MMRF.roll・choose＝実際の進行）。出来事は OK／最初の選択肢 */
async function walkTo(pg, target) {
  await pg.evaluate((target) => { window.__rz = { target }; MMRF.fast = true; }, target);
  for (let i = 0; i < 200; i++) {
    await pg.waitForFunction(() => !MMRF.busy());
    const r = await pg.evaluate(() => {
      const s = MMRF.state(), D = MMRF_DATA, sg = D.segments, w = window.__rz;
      const route = [...new Set([...sg.S01[3], ...['EL01', 'EL02', 'EL03', 'EL04'].flatMap((k) => sg[k][3]), ...sg.C01[3], ...sg.C02[3]])];
      if (s.node === w.target && !s.moveLeft) return { done: true };
      if (s.play.notice && s.play.notice.kind === 'choice') { MMRF.choice(0); return {}; }
      if (MMRF_CORE.needsChoice(D, s)) { const op = MMRF_CORE.options(D, s).map((e) => e.seg); MMRF.choose(op.includes('EL01') ? 'EL01' : op.find((x) => !/^D_/.test(x))); return {}; }
      if (s.play.fat >= 100) { MMRF.rest(); return {}; }
      const left = route.indexOf(w.target) - route.indexOf(s.node); if (left <= 0) return { err: `${w.target} を通り過ぎた（${s.node}）` };
      MMRF.roll(Math.min(6, left)); return {};
    });
    if (r.err) throw new Error(r.err);
    if (r.done) { await pg.evaluate(() => { MMRF.fast = false; }); await pg.waitForTimeout(450); return; }
  }
  throw new Error('着かない');
}
const measure = (pg) => pg.evaluate(() => {
  const bx = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom]; };
  const z = MMRF.zones(), on = !!document.querySelector('#rfp .rf-zone.on');
  return { z, on, vp: bx(document.querySelector('#rfp .rf-vp')), img: on ? bx(document.querySelector('#rfp .rf-zl.on img')) : null,
    mon: bx(document.querySelector(on ? '#rfp .rf-zl.on .rf-zmon img' : '#rfp .rf-mon img')),
    top: bx(document.querySelector('#rfp .rf-top')), tools: bx(document.querySelector('#rfp .rf-tools')), bot: bx(document.querySelector('#rfp .rf-bot')),
    row: (document.querySelector('#rfp .rf-zrow') || {}).textContent || '', sw: document.documentElement.scrollWidth, iw: innerWidth };
});
function check(m, label, scene, zone) {
  assert.equal(m.z.scene68, scene, `${label}：Scene`); assert.equal(m.z.ambiguous, false);
  assert.ok(m.row.includes(scene), `${label}：上の帯に ${scene}（${m.row}）`);
  assert.equal(m.z.zone, zone, `${label}：区域`); assert.equal(m.on, !!zone, `${label}：区域の背景の表示`);
  if (zone) assert.ok(m.img[0] <= 0.5 && m.img[1] <= 0.5 && m.img[2] >= m.vp[2] - 0.5 && m.img[3] >= m.vp[3] - 0.5, `${label}：絵の外（暗い余白）0`);
  else assert.ok(m.row.includes('図面'), `${label}：図面と表示`);
  for (const [k, b] of [['上の帯', m.top], ['右の道具', m.tools], ['下の操作', m.bot]]) assert.ok(!overlap(m.mon, b), `${label}：モンスターが ${k} に重ならない ${m.mon} / ${b}`);
  assert.ok(m.mon[1] >= -0.5 && m.mon[3] <= m.vp[3] + 0.5, `${label}：モンスターは画面の中`);
  assert.ok(m.sw <= m.iw, `${label}：横にはみ出さない`);
}

for (const size of [[390, 844], [375, 667]]) {
  test(`S68-B1：${size.join('×')}：図面の Scene・P の背景ゾーン・背景 → 図面の境目・再読み込み・例外 0`, { skip: SKIP, timeout: 300000 }, async () => {
    const p = await open({ size }); const pg = p.page, errs = []; pg.on('pageerror', (e) => errs.push(String(e)));
    const tag = size.join('x');
    await boot(pg, 404); await pg.evaluate(() => MMRF.reset({ seed: 404, randOpen: false }));
    // ① 図面だけの Scene
    await walkTo(pg, 'S01_02'); check(await measure(pg), `${tag} S01_02`, 'Scene01', null); await shot(pg, `S68-B1_${tag}_1_Scene01`);
    await walkTo(pg, 'S01_06'); check(await measure(pg), `${tag} S01_06`, 'Scene02', null);
    await boot(pg, 404); check(await measure(pg), `${tag} 再読み込み S01_06`, 'Scene02', null);
    // ② P の背景ゾーン
    await walkTo(pg, 'P'); check(await measure(pg), `${tag} P`, 'Scene09', 'core'); await shot(pg, `S68-B1_${tag}_2_P`);
    assert.deepEqual((await measure(pg)).z.next, ['C01_01']);
    await boot(pg, 404); check(await measure(pg), `${tag} 再読み込み P`, 'Scene09', 'core');
    // ③ 背景 → 図面の境目
    await walkTo(pg, 'C02_01'); check(await measure(pg), `${tag} C02_01`, 'Scene22', 'gate');
    await walkTo(pg, 'C02_02'); check(await measure(pg), `${tag} C02_02`, 'Scene23', null); await shot(pg, `S68-B1_${tag}_3_Scene23`);
    await boot(pg, 404); check(await measure(pg), `${tag} 再読み込み C02_02`, 'Scene23', null);
    assert.deepEqual(errs, [], 'JS の例外 0');
  });
}
