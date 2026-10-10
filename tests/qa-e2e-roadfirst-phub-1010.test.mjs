// =========================================================
// 実ブラウザ：RoadFirst の試遊画面に P ハブの背景ゾーン（2026-10-10・?chapterBoard=roadfirst&rfZones=phub・js/proto/roadfirst-zones.js）
//  RZ-B1 390×844・375×667 × 左から／右から：START から実際の MMRF_CORE（MMRF.roll・choose）で歩いて P へ → C01_01 → C01_02 → 下の門 → C02_01 → 区域の外
//        区域（Scene・区域・背景）・違う背景のときだけフェード・P をまたいでも同じ背景・今の地点と次の行き先が空いている所（HUD に重ならない）・
//        絵の外（余白）0・P の次は C01_01 だけ（分岐の選択なし）・歩いた跡はすべて原本の forward の接続・背景1枚につき読み込み1回
//  RZ-B2 保存 → 再読み込みで地点と区域が一致（P 左／P 右／C01_01／下の門）・連打しても1ターン・旧形式の保存（区域の項目なし）も同じ
//  RZ-B3 フラグなし（?chapterBoard=roadfirst だけ）は区域を出さない・区域の表の 404 は図面のまま進める
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
const URL_Z = '?chapterBoard=roadfirst&rfZones=phub&rfRand=closed&rfSeed=';
const overlap = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];

async function boot(pg, seed) {
  await pg.goto(L.url + 'index.html' + URL_Z + seed); await pg.waitForSelector('#rfp .rf-go');
  await pg.waitForFunction(() => MMRF.zones().ready || MMRF.zones().failed, null, { timeout: 20000 });
}
/** 区域の外は早送りで、出目を選んで target にちょうど止まる（MMRF.roll・choose＝実際の進行）。出来事は OK／最初の選択肢 */
async function walkTo(pg, side, target, o = {}) {
  await pg.evaluate(({ side, target, fast }) => { window.__rz = { side, target }; MMRF.fast = fast; }, { side, target, fast: o.fast !== false });
  for (let i = 0; i < 200; i++) {
    await pg.waitForFunction(() => !MMRF.busy());
    const r = await pg.evaluate(() => {
      const s = MMRF.state(), D = MMRF_DATA, sg = D.segments, w = window.__rz;
      const route = [...new Set([...sg.S01[3], ...(w.side === 'L' ? ['EL01', 'EL02', 'EL03', 'EL04'] : ['ER01', 'ER02', 'ER03', 'ER04']).flatMap((k) => sg[k][3]), ...sg.C01[3], ...sg.C02[3]])];
      if (s.node === w.target && !s.moveLeft) return { done: true, s };
      if (s.play.notice && s.play.notice.kind === 'choice') { MMRF.choice(0); return { a: 'choice' }; }
      if (MMRF_CORE.needsChoice(D, s)) { const op = MMRF_CORE.options(D, s).map((e) => e.seg); MMRF.choose(op.find((x) => x === (w.side === 'L' ? 'EL01' : 'ER01')) || op.find((x) => !/^D_/.test(x))); return { a: 'branch' }; }
      if (s.play.fat >= 100) { MMRF.rest(); return { a: 'rest' }; }
      const left = route.indexOf(w.target) - route.indexOf(s.node);
      if (left <= 0) return { err: `目標 ${w.target} を通り過ぎた（${s.node}）` };
      MMRF.roll(Math.min(6, left)); return { a: 'roll' };
    });
    if (r.err) throw new Error(r.err);
    if (r.done) return r.s;
  }
  throw new Error('着かない');
}
/** 今の画面の測り（区域・カメラ・今の地点と次の行き先の箱・HUD の箱・絵が画面を覆うか） */
const measure = (pg) => pg.evaluate(() => {
  const bx = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom]; };
  const z = MMRF.zones(), vp = bx(document.querySelector('#rfp .rf-vp'));
  const lay = document.querySelector('#rfp .rf-zone.on .rf-zl.on img');
  return { z, vp, img: bx(lay), cur: bx(document.querySelector(`#rfp .rf-zl.on .rf-zm[data-node="${z.node}"]`)), mon: bx(document.querySelector('#rfp .rf-zl.on .rf-zmon img')),
    nx: [...document.querySelectorAll('#rfp .rf-zl.on .rf-zm.nx')].map((e) => ({ n: e.dataset.node, b: bx(e) })),
    top: bx(document.querySelector('#rfp .rf-top')), tools: bx(document.querySelector('#rfp .rf-tools')), bot: bx(document.querySelector('#rfp .rf-bot')),
    zoneOn: !!document.querySelector('#rfp .rf-zone.on'), branchBtns: document.querySelectorAll('#rfp .rf-ch button:not([data-nc])').length,
    row: (document.querySelector('#rfp .rf-zrow') || {}).textContent || '', sw: document.documentElement.scrollWidth, iw: innerWidth };
});
function checkView(m, label) {
  assert.ok(m.zoneOn && m.img, `${label}：区域の背景が出ている`);
  // 絵の外（余白）0：絵が画面全体を覆う
  assert.ok(m.img[0] <= m.vp[0] + 0.5 && m.img[1] <= m.vp[1] + 0.5 && m.img[2] >= m.vp[2] - 0.5 && m.img[3] >= m.vp[3] - 0.5, `${label}：絵の外が見えない ${m.img} ⊇ ${m.vp}`);
  // 今の地点・次の行き先の印は空いている所（上の帯・右の道具・下の操作に重ならない・画面の中）
  for (const [k, b] of [['今の地点', m.cur], ['モンスター', m.mon], ...m.nx.map((x) => [`次の行き先 ${x.n}`, x.b])]) {
    assert.ok(b, `${label}：${k} の印がある`);
    assert.ok(b[0] >= -0.5 && b[2] <= m.iw + 0.5 && b[1] >= -0.5 && b[3] <= m.vp[3] + 0.5, `${label}：${k} は画面の中 ${b}`);
    for (const [hk, hb] of [['上の帯', m.top], ['右の道具', m.tools], ['下の操作', m.bot]]) assert.ok(!overlap(b, hb), `${label}：${k} が ${hk} に重ならない ${b} / ${hb}`);
  }
  assert.ok(m.sw <= m.iw, `${label}：横にはみ出さない`);
}

for (const size of [[390, 844], [375, 667]]) for (const side of ['L', 'R']) {
  test(`RZ-B1：${size.join('×')}・${side === 'L' ? '左から' : '右から'} P へ → C01_01 → C01_02 → 下の門 → 区域の外（実際の進行・フェード・余白0・HUD に重ならない）`, { skip: SKIP, timeout: 300000 }, async () => {
    const p = await open({ size }); const pg = p.page;
    const req = []; pg.on('request', (r) => { if (/p_hub_1010\/assets\//.test(r.url())) req.push(r.url().split('/').pop()); });
    await boot(pg, 101);
    assert.ok(await pg.evaluate(() => MMRF.zones().ready), '区域の背景を読み込んだ');
    const pre = side === 'L' ? 'EL04_10' : 'ER04_11', first = side === 'L' ? 'EL04_11' : 'ER04_12';
    await walkTo(pg, side, pre);
    let m = await measure(pg);
    assert.equal(m.z.zone, null, `${pre}（approach）は RoadFirst の図面のまま`); assert.ok(!m.zoneOn);
    await pg.evaluate(() => { MMRF.fast = false; });
    // 図面 → P 中核の候補画像：0.32秒のフェード（途中の不透明度は 0 と 1 の間）
    // 1フレームごとに区域の器の不透明度を測る（ページの中で）
    const ops = await pg.evaluate(async () => { const out = []; MMRF.roll(1); for (let i = 0; i < 120; i++) { await new Promise((r) => requestAnimationFrame(r)); out.push(Number(getComputedStyle(document.querySelector('#rfp .rf-zone')).opacity)); if (out[out.length - 1] === 1 && out.length > 5) break; } return out; });
    assert.ok(ops.some((v) => v > 0.05 && v < 0.95), `区域の背景へフェード（途中の不透明度あり ${ops.filter((v) => v > 0 && v < 1).map((v) => v.toFixed(2)).join(',')}）`);
    assert.equal(ops[ops.length - 1], 1, 'フェードのあと不透明');
    await pg.waitForFunction(() => !MMRF.busy());
    const seq = side === 'L' ? [['EL04_11', 'Scene09', 'core'], ['EL04_12', 'Scene09', 'core'], ['P', 'Scene09', 'core']]
      : [['ER04_12', 'Scene20', 'core'], ['ER04_13', 'Scene20', 'core'], ['P', 'Scene20', 'core']];
    seq.push(['C01_01', 'Scene22', 'core'], ['C01_02', 'Scene22', 'core'], ['LOWER_GATE', 'Scene22', 'gate'], ['C02_01', 'Scene22', 'gate']);
    let prevAsset = null;
    for (let i = 0; i < seq.length; i++) {
      const [node, scene, zone] = seq[i];
      if (i > 0) {
        await pg.evaluate(() => { const s = MMRF.state(); if (s.play.notice && s.play.notice.kind === 'choice') MMRF.choice(0); });
        await pg.waitForFunction(() => !MMRF.busy());
        const fat = await pg.evaluate(() => MMRF.state().play.fat); if (fat >= 100) { await pg.evaluate(() => MMRF.rest()); }
        await pg.evaluate(() => MMRF.roll(1));
        if (prevAsset === 'p_core_candidate' && zone === 'core') {   // P をまたいでも同じ背景＝層は付いたまま（フェードしない）
          await pg.waitForTimeout(90);
          const o = await pg.evaluate(() => ({ a: MMRF.zones().asset, op: Number(getComputedStyle(document.querySelector('#rfp .rf-zl[data-asset="p_core_candidate"]')).opacity), zo: Number(getComputedStyle(document.querySelector('#rfp .rf-zone')).opacity) }));
          assert.equal(o.a, 'p_core_candidate'); assert.equal(o.op, 1, `${node}：同じ背景の層は不透明のまま`); assert.equal(o.zo, 1, `${node}：区域の器も不透明のまま`);
        }
        await pg.waitForFunction(() => !MMRF.busy()); await pg.waitForTimeout(380);
      }
      m = await measure(pg);
      assert.equal(m.z.node, node, `地点 ${node}`); assert.equal(m.z.scene, scene, `${node} の Scene`); assert.equal(m.z.zone, zone, `${node} の区域`);
      checkView(m, `${size.join('×')} ${node}`);
      if (node === 'P') {
        assert.deepEqual(m.z.next, ['C01_01'], 'P の次は C01_01 だけ（第4の道・逆向きは無い）');
        assert.equal(m.branchBtns, 0, 'P で分岐の選択は出ない');
        assert.deepEqual(m.nx.map((x) => x.n), ['C01_01'], '次の行き先の印は C01_01 だけ');
        assert.ok(m.row.includes('次の行き先') && m.row.includes('C01_01'), 'HUD に次の行き先');
        await shot(pg, `RZ-B1_${size.join('x')}_${side}_P`);
      }
      if (node === first || node === 'C01_02' || node === 'LOWER_GATE') await shot(pg, `RZ-B1_${size.join('x')}_${side}_${node}`);
      prevAsset = m.z.asset;
    }
    // C02_01 → C02_02（区域の外）：区域の背景は消えて図面へ
    await pg.evaluate(() => { const s = MMRF.state(); if (s.play.notice && s.play.notice.kind === 'choice') MMRF.choice(0); if (s.play.fat >= 100) MMRF.rest(); });
    await pg.waitForFunction(() => !MMRF.busy()); await pg.evaluate(() => MMRF.roll(1)); await pg.waitForFunction(() => !MMRF.busy());
    m = await measure(pg); assert.equal(m.z.node, 'C02_02'); assert.equal(m.z.zone, null); assert.ok(!m.zoneOn, '区域の外は図面');
    // 歩いた跡はすべて原本の forward の接続（第4の道・逆向きの移動は無い）・門は LOWER_GATE だけ
    const chk = await pg.evaluate(() => { const s = MMRF.state(), E = new Set(MMRF_DATA.edges.filter((e) => e[3] === 'forward').map((e) => e[0] + '>' + e[1]));
      return { bad: s.trail.slice(1).map((n, i) => s.trail[i] + '>' + n).filter((k) => !E.has(k)), gates: s.gates, trail: s.trail }; });
    assert.deepEqual(chk.bad, [], '原本に無い接続を歩いていない');
    assert.deepEqual(chk.gates, ['LOWER_GATE'], '門の出来事は LOWER_GATE だけ');
    for (const n of ['P', 'C01_01', 'C01_02', 'LOWER_GATE']) assert.ok(chk.trail.includes(n), n);
    // 背景1枚につき読み込みは1回（区域をまたいでも src を差し替えない）
    for (const f of ['p_core_candidate.png', 'p_hub_qa_structure.png']) assert.equal(req.filter((x) => x === f).length, 1, `${f} の読み込みは1回`);
  });
}

test('RZ-B2：保存 → 再読み込みで地点と区域が一致（P 左／P 右／C01_01／下の門）・連打しても1ターン・旧形式の保存も同じ', { skip: SKIP, timeout: 400000 }, async () => {
  const p = await open({ size: [390, 844] }); const pg = p.page;
  const cases = [['L', 'P', 'Scene09', 'core'], ['R', 'P', 'Scene20', 'core'], ['L', 'C01_01', 'Scene22', 'core'], ['R', 'LOWER_GATE', 'Scene22', 'gate']];
  for (const [side, node, scene, zone] of cases) {
    await boot(pg, 202); await pg.evaluate(() => MMRF.reset({ seed: 202, randOpen: false }));
    await walkTo(pg, side, node);
    const before = await pg.evaluate(() => ({ z: MMRF.zones(), s: MMRF.state() }));
    assert.equal(before.z.scene, scene); assert.equal(before.z.zone, zone);
    const saved = await pg.evaluate(() => localStorage.getItem(MMRF.KEY));
    assert.ok(!/"zone"|"scene"/.test(saved), '区域は保存しない（地点と歩いた跡から決まる）');
    await boot(pg, 202);
    const after = await pg.evaluate(() => ({ z: MMRF.zones(), s: MMRF.state() }));
    assert.equal(after.s.node, node, `${node}：再読み込みで同じ地点`); assert.equal(after.s.turn, before.s.turn, '同じターン');
    assert.equal(after.z.scene, scene, `${side} の ${node}：同じ Scene`); assert.equal(after.z.zone, zone, '同じ区域'); assert.equal(after.z.asset, before.z.asset, '同じ背景');
    checkView(await measure(pg), `再読み込み ${side} ${node}`);
    if (node === 'P' && side === 'R') await shot(pg, 'RZ-B2_reload_P_right');
  }
  // 連打：サイコロのボタンを素早く5回 → 1ターンだけ
  await pg.evaluate(() => { MMRF.fast = false; const s = MMRF.state(); if (s.play.notice) MMRF.ok(); });
  await pg.waitForFunction(() => !MMRF.busy());
  const t0 = await pg.evaluate(() => MMRF.state().turn);
  await pg.evaluate(() => { const b = document.querySelector('#rfp .rf-go'); for (let i = 0; i < 5; i++) b.click(); });
  await pg.waitForFunction(() => !MMRF.busy()); await pg.waitForTimeout(200);
  const t1 = await pg.evaluate(() => MMRF.state().turn);
  assert.equal(t1, t0 + 1, `連打しても1ターン（${t0} → ${t1}）`);
  // 旧形式の保存（v 1＝移動だけ）でも区域は地点と歩いた跡から同じ
  const v1 = await pg.evaluate(() => { const D = MMRF_DATA, C = MMRF_CORE, s = C.create(D, { seed: 9, randOpen: false });
    s.trail = [...new Set([...D.segments.S01[3], ...['ER01', 'ER02', 'ER03', 'ER04'].flatMap((k) => D.segments[k][3])])]; s.node = 'P'; s.turn = 12; return JSON.stringify(s); });
  await pg.evaluate((t) => localStorage.setItem(MMRF.KEY, t), v1);
  await boot(pg, 202);
  const z = await pg.evaluate(() => ({ z: MMRF.zones(), s: MMRF.state() }));
  assert.equal(z.s.node, 'P'); assert.equal(z.s.turn, 12); assert.equal(z.z.scene, 'Scene20', '旧形式：右から来た P は Scene20'); assert.equal(z.z.zone, 'core');
});

test('RZ-B3：フラグなしは区域を出さない・区域の表の 404 は図面のまま進める', { skip: SKIP, timeout: 200000 }, async () => {
  const p = await open({ size: [390, 844] }); const pg = p.page;
  await pg.goto(L.url + 'index.html?chapterBoard=roadfirst&rfSeed=3'); await pg.waitForSelector('#rfp .rf-go');
  assert.equal(await pg.evaluate(() => !!document.querySelector('#rfp .rf-zone')), false, 'フラグなし：区域の層を作らない');
  assert.equal(await pg.evaluate(() => MMRF.zones().on), false);
  await pg.route('**/scene_registry.json', (r) => r.fulfill({ status: 404, body: 'nf' }));
  await boot(pg, 3);
  const z = await pg.evaluate(() => MMRF.zones());
  assert.ok(z.failed && !z.ready, '404 を知らせる');
  await pg.evaluate(() => MMRF.roll(2)); await pg.waitForFunction(() => !MMRF.busy());
  assert.equal(await pg.evaluate(() => MMRF.state().turn), 1, '図面のまま進める');
  assert.ok(await pg.evaluate(() => !document.querySelector('#rfp .rf-zone.on')));
});
