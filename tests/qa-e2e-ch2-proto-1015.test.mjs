// =========================================================
// 実ブラウザ：Chapter 2 A／B／C 設計案の限定試作（2026-10-15・?chapterBoard=roadfirst&rfData=ch2&ch2route=A|B|C&rfView=world）
//  CP-B1 375×667・390×844・430×932 × A／B／C：題字が Chapter 2・開始の俯瞰 → START へ寄る → 実際の MMRF.roll／choose で数ターン（分かれ道を選ぶ・
//        運命のサイコロ／特殊挑戦／ライバルで止まる）・JS の例外 0・横にはみ出さない。スクリーンショットは RF_SHOT_DIR があるときだけ
//  CP-B2 隔離：保存の鍵は mmrf_proto_ch2_<route>_v1 だけ（Chapter 1 の試作の鍵 mmrf_proto_v1・通常のセーブ mr4v6 には書かない）・再読み込みで同じ地点・
//        通常の URL では何もしない（#rfp が無い）・rfData=ch2 なしは従来の Chapter 1 の試作
//  QA_E2E=1 のときだけ
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
const URL_W = (r, seed) => `index.html?chapterBoard=roadfirst&rfData=ch2&ch2route=${r}&rfView=world&rfRand=open&rfSeed=${seed}`;
const idle = (pg) => pg.waitForFunction(() => !MMRF.busy() && !(MMRF.world() && MMRF.world().intro), null, { timeout: 20000 });
const SIZES = { '375x667': [375, 667], '390x844': [390, 844], '430x932': [430, 932] };

async function playTurns(pg, n) {   // n ターン進むまで（出来事の OK・2択は自動で送る。最大 n×4 回）
  const seen = [];
  for (let i = 0; i < n * 4; i++) {
    if (seen.length && seen[seen.length - 1].turn >= n) break;
    const r = await pg.evaluate(async () => {
      const st0 = MMRF.state(); if (st0.done || st0.timeUp) return { end: true };
      if (st0.play && st0.play.notice) { if (st0.play.notice.kind === 'choice') MMRF.choice(0); else MMRF.ok(); return { ack: true }; }
      MMRF.fast = true;
      const die = 1 + (st0.turn % 6);
      await MMRF.roll(die);
      for (let g = 0; g < 8; g++) { const st = MMRF.state(); if (!st.moveLeft) break; const ops = MMRF_CORE.options(MMRF_CH2[MMRF.CH2], st); if (ops.length > 1) await MMRF.choose(ops[g % ops.length].seg); else break; }
      const st = MMRF.state(); return { node: st.node, turn: st.turn, rival: st.rival, q: st.qDie, chal: st.chal, trail: st.trail.length };
    });
    if (r.end) break;
    if (!r.ack) seen.push(r);
    await pg.waitForFunction(() => !MMRF.busy(), null, { timeout: 20000 });
  }
  return seen;
}

for (const [label, size] of Object.entries(SIZES)) for (const route of ['A', 'B', 'C']) {
  test(`CP-B1 ${label} ルート ${route}：題字・俯瞰 → START・数ターンの進行・例外なし・横はみ出しなし`, { skip: SKIP }, async () => {
    const p = await open({ size }); const pg = p.page;
    await pg.goto(L.url + URL_W(route, 7)); await pg.waitForSelector('#rfp .rfw');
    const t = await pg.evaluate(() => ({ title: document.querySelector('#rfp .rfw-title').textContent, head: document.querySelector('#rfp .rf-top b').textContent, route: MMRF.CH2, key: MMRF.SKEY, nodes: Object.keys(MMRF_CH2[MMRF.CH2].nodes).length }));
    assert.match(t.title, /CHAPTER 2/); assert.match(t.title, /潮風の海岸/); assert.match(t.head, new RegExp(`Chapter 2 ルート ${route}`)); assert.equal(t.route, route); assert.equal(t.key, `mmrf_proto_ch2_${route}_v1`);
    await shot(pg, `ch2proto_${route}_${label}_overview`);
    await pg.evaluate(() => MMRF.skipIntro()); await idle(pg); await pg.waitForTimeout(400);
    await shot(pg, `ch2proto_${route}_${label}_start`);
    const seen = await playTurns(pg, 12);
    assert.ok(seen.some((s) => s.turn >= 10), 'ターンが進む（' + JSON.stringify(seen.slice(-1)) + '）');
    const st = await pg.evaluate(() => MMRF.state());
    assert.ok(st.trail.length > 10, '歩いた跡がある'); assert.equal(st.turn, seen[seen.length - 1].turn);
    await pg.waitForTimeout(500); await shot(pg, `ch2proto_${route}_${label}_mid`);
    const m = await pg.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, mon: !!document.querySelector('#rfp .rfw-mon img') }));
    assert.ok(m.sw <= m.iw + 1, '横にはみ出さない'); assert.ok(m.mon);
    assert.deepEqual(p.errors, []);
  });
}

test('CP-B2 隔離：保存の鍵・再読み込み・通常の URL・rfData なしは Chapter 1 の試作', { skip: SKIP }, async () => {
  const p = await open({}); const pg = p.page;
  await pg.goto(L.url + URL_W('B', 11)); await pg.waitForSelector('#rfp .rfw'); await pg.evaluate(() => MMRF.skipIntro()); await idle(pg);
  const before = await pg.evaluate(() => Object.fromEntries(Object.keys(localStorage).filter((k) => /^mr4/.test(k)).map((k) => [k, localStorage.getItem(k)])));   // ゲーム本体が起動時に作る通常のセーブ
  await playTurns(pg, 5);
  const k1 = await pg.evaluate(() => ({ keys: Object.keys(localStorage).sort(), node: MMRF.state().node, turn: MMRF.state().turn, mr4: Object.fromEntries(Object.keys(localStorage).filter((k) => /^mr4/.test(k)).map((k) => [k, localStorage.getItem(k)])) }));
  assert.ok(k1.keys.includes('mmrf_proto_ch2_B_v1')); assert.ok(!k1.keys.includes('mmrf_proto_v1'), 'Chapter 1 の試作の鍵には書かない'); assert.deepEqual(k1.mr4, before, '通常のセーブ（mr4…）は試作で変わらない');
  await pg.reload(); await pg.waitForSelector('#rfp .rfw'); await idle(pg);
  const k2 = await pg.evaluate(() => ({ node: MMRF.state().node, turn: MMRF.state().turn, route: MMRF.CH2 }));
  assert.equal(k2.node, k1.node); assert.equal(k2.turn, k1.turn); assert.equal(k2.route, 'B');
  // 同じ試作でルートを変えると別の鍵＝最初から
  await pg.goto(L.url + URL_W('C', 11)); await pg.waitForSelector('#rfp .rfw');
  const k3 = await pg.evaluate(() => ({ node: MMRF.state().node, turn: MMRF.state().turn, keys: Object.keys(localStorage).sort() }));
  assert.equal(k3.turn, 0); assert.equal(k3.node, 'START'); assert.ok(k3.keys.includes('mmrf_proto_ch2_B_v1') && k3.keys.includes('mmrf_proto_ch2_C_v1'));
  // rfData なし＝従来の Chapter 1 の試作（別の鍵・別のデータ）
  await pg.goto(L.url + 'index.html?chapterBoard=roadfirst&rfView=world&rfSeed=11'); await pg.waitForSelector('#rfp .rfw');
  const k4 = await pg.evaluate(() => ({ ch2: MMRF.CH2, key: MMRF.SKEY, title: document.querySelector('#rfp .rfw-title').textContent }));
  assert.equal(k4.ch2, null); assert.equal(k4.key, 'mmrf_proto_v1'); assert.match(k4.title, /CHAPTER 1/);
  // 通常の URL では何もしない
  await pg.goto(L.url + 'index.html'); await pg.waitForTimeout(1500);
  assert.equal(await pg.evaluate(() => !!document.getElementById('rfp')), false);
  assert.deepEqual(p.errors, []);
});
