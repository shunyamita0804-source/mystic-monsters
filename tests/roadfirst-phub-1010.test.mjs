// =========================================================
// RoadFirst の試遊画面に P ハブの背景ゾーン（2026-10-10・試作。js/proto/roadfirst-zones.js・roadfirst-view.js の &rfZones=phub）
//  RZ-01 原本は変えていない：原本グラフの sha256・299／42／370・68 Scene 表・MMRF_DATA と原本が同じ
//  RZ-02 区域の決め方：左から（EL04_12 → P）＝Scene09・右から（ER04_13 → P）＝Scene20・P の次＝Scene22・C01_xx＝Scene22 core・LOWER_GATE／C02_01＝gate・
//        approach（EL04_09・10／ER04_09〜11）とハブの外は区域なし（図面）・区域は歩いた跡から決まる（保存しない）
//  RZ-03 実際の MMRF_CORE で 6接続（EL04_11→EL04_12→P・ER04_12→ER04_13→P・P→C01_01→C01_02）を1マスずつ・P の次は C01_01 だけ・逆向きなし・門は LOWER_GATE だけ
//  RZ-04 カメラ：2サイズ（HUD の実測に近い空き）で今の地点と次の行き先が空いている所・絵の外（余白）0・P をまたいでも同じ背景
//  RZ-05 フラグ：?chapterBoard=roadfirst&rfZones=phub のときだけ・保存の鍵と形式は同じ・index.html は zones を view の前に読む
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const sha = (p) => createHash('sha256').update(readFileSync(path.join(ROOT, p))).digest('hex');
await import('../js/proto/roadfirst-data.js');
await import('../js/proto/roadfirst-core.js');
await import('../js/proto/roadfirst-zones.js');
const D = globalThis.MMRF_DATA, C = globalThis.MMRF_CORE, Z = globalThis.MMRF_ZONES;
const REG = JSON.parse(rd('prototype/p_hub_1010/scene_registry.json'));
const SK = Z.ROADFIRST_SKIP;
const route = (side) => [...new Set([...D.segments.S01[3], ...(side === 'L' ? ['EL01', 'EL02', 'EL03', 'EL04'] : ['ER01', 'ER02', 'ER03', 'ER04']).flatMap((k) => D.segments[k][3]), ...D.segments.C01[3], ...D.segments.C02[3]])];

test('RZ-01：原本・299／42／370・68 Scene 表は変えていない', () => {
  const man = JSON.parse(rd('prototype/p_hub_1010/source/04_manifest.json'));
  assert.equal(sha('assets/proto/ch1a_roadfirst_1009/09_original_source_graph.json'), man.source_sha256);
  assert.ok(sha('prototype/p_hub_1010/source/SOURCE_SCENE_PLAN_68_UNCHANGED.csv').startsWith('2852ba56'), '68 Scene 表');
  assert.equal(Object.keys(D.nodes).length, 299); assert.equal(Object.keys(D.segments).length, 42); assert.equal(D.edges.length, 370);
  assert.equal(REG.assets.p_core_candidate.art_pass_allowed, false); assert.equal(REG.assets.p_hub_final.file, null);
});

test('RZ-02：区域は地点と歩いた跡から決まる（左＝Scene09・右＝Scene20・P の次＝Scene22）・approach とハブの外は図面', () => {
  for (const side of ['L', 'R']) {
    const r = route(side), at = (n) => Z.resolve(REG, n, r.slice(0, r.indexOf(n) + 1), null, SK);
    const pz = at('P'); assert.equal(pz.scene, side === 'L' ? 'Scene09' : 'Scene20'); assert.equal(pz.id, 'core'); assert.equal(pz.asset, 'p_core_candidate');
    for (const n of ['C01_01', 'C01_02']) { const q = at(n); assert.equal(q.scene, 'Scene22'); assert.equal(q.id, 'core'); assert.equal(q.asset, 'p_core_candidate'); }
    for (const n of ['LOWER_GATE', 'C02_01']) { const q = at(n); assert.equal(q.scene, 'Scene22'); assert.equal(q.id, 'gate'); assert.equal(q.asset, 'p_hub_qa_structure'); }
    const far = side === 'L' ? ['EL04_08', 'EL04_09', 'EL04_10'] : ['ER04_08', 'ER04_09', 'ER04_10', 'ER04_11'];
    for (const n of far.concat('C02_02', 'START', 'J0', 'Q')) assert.equal(at(n) || Z.resolve(REG, n, [n], null, SK), null, `${n} は区域なし（図面）`);
    // 独立プレビューと同じ表・同じ座標（作り直していない）
    assert.deepEqual(pz.at, REG.layouts.core_zones.scenes[pz.scene].zones.find((z) => z.id === 'core').xy.P);
  }
  assert.equal(Z.resolve(REG, 'P', ['P'], null, SK).scene, 'Scene22', '1つ前が無い P は Scene22');
  const cov = Z.coverage(REG, null, SK);
  assert.deepEqual(cov.nodes.sort(), ['C01_01', 'C01_02', 'C02_01', 'EL04_11', 'EL04_12', 'ER04_12', 'ER04_13', 'LOWER_GATE', 'P'].sort());
  assert.deepEqual(cov.standIn.sort(), ['C02_01', 'LOWER_GATE'], '構図参考図で代用する地点');
  assert.deepEqual(Z.assets(REG, null, SK).sort(), ['p_core_candidate', 'p_hub_qa_structure']);
});

test('RZ-03：実際の MMRF_CORE で 6接続を1マスずつ・P の次は C01_01 だけ・逆向きなし・門は LOWER_GATE だけ', () => {
  for (const side of ['L', 'R']) {
    const r = route(side), from = side === 'L' ? 'EL04_11' : 'ER04_12';
    const st = C.create(D, { seed: 3, randOpen: false, turnLimit: 999 }); st.trail = r.slice(0, r.indexOf(from) + 1); st.node = from;
    const walked = [];
    for (let i = 0; i < 6; i++) {
      if (st.node === 'P') assert.deepEqual(C.options(D, st).map((e) => e.dst), ['C01_01'], 'P の次は C01_01 だけ');
      assert.ok(C.options(D, st).every((e) => e.dir === 'forward'), `${st.node}：逆向きの候補なし`);
      assert.ok(!C.options(D, st).some((e) => st.trail.includes(e.dst)), `${st.node}：来た道へ戻る候補なし`);
      C.roll(D, st, 1); const ev = C.advance(D, st); assert.ok(!ev.some((x) => x.type === 'choice'), '分岐の選択なし');
      walked.push(st.node);
      const z = Z.resolve(REG, st.node, st.trail, null, SK); if (z) assert.ok(z.at, `${st.node} の座標`);
    }
    assert.deepEqual(walked, side === 'L' ? ['EL04_12', 'P', 'C01_01', 'C01_02', 'LOWER_GATE', 'C02_01'] : ['ER04_13', 'P', 'C01_01', 'C01_02', 'LOWER_GATE', 'C02_01']);
    assert.deepEqual(st.gates, ['LOWER_GATE']);
    const fwd = new Set(D.edges.filter((e) => e[3] === 'forward').map((e) => e[0] + '>' + e[1]));
    for (let i = 1; i < st.trail.length; i++) assert.ok(fwd.has(st.trail[i - 1] + '>' + st.trail[i]), st.trail[i - 1] + '>' + st.trail[i]);
  }
  // 区域のある地点の原本の接続は forward・reverse_allowed なし
  for (const k of ['EL04', 'ER04', 'C01', 'C02']) assert.ok(!D.edges.some((e) => e[2] === k && e[3] !== 'forward'), `${k} に逆向きの接続なし`);
});

test('RZ-04：カメラ（2サイズ）：今の地点と次の行き先が空いている所・絵の外 0', () => {
  for (const [W, H, top, bot] of [[390, 844, 136, 670], [375, 667, 153, 495]]) {
    const view = { W, H, top, bottom: bot, right: W - 78 };
    for (const side of ['L', 'R']) {
      const r = route(side);
      for (let i = 0; i < r.length; i++) {
        const t = r.slice(0, i + 1), z = Z.resolve(REG, r[i], t, null, SK); if (!z) continue;
        const nxt = r[i + 1], q = nxt && Z.resolve(REG, nxt, t.concat(nxt), null, SK), focus = q && q.asset === z.asset ? [q.at] : [];
        const c = Z.camera(REG, z, view, focus), a = REG.assets[z.asset];
        assert.ok(c.tx <= 0.01 && c.ty <= 0.01 && c.tx + a.w * c.s >= W - 0.01 && c.ty + a.h * c.s >= H - 0.01, `${W}×${H} ${r[i]}：絵の外が見えない`);
        for (const p of [z.at].concat(focus)) {
          const x = p[0] * c.s + c.tx, y = p[1] * c.s + c.ty;
          assert.ok(x >= Z.MARGIN.side - 1 && x <= view.right - Z.MARGIN.side + 1 && y >= top + Z.MARGIN.top - 1 && y <= bot - Z.MARGIN.bottom + 1, `${W}×${H} ${side} ${r[i]}：(${x | 0},${y | 0}) は空いている所`);
        }
      }
    }
  }
});

test('RZ-05：フラグのときだけ・保存の鍵と形式は同じ・index.html の読み込み順', () => {
  const v = rd('js/proto/roadfirst-view.js'), html = rd('index.html');
  assert.match(v, /const ZMODE = ON \? Q\.get\('rfZones'\) : null/); assert.match(v, /const ZON = ZMODE === 'phub' \|\| ZMODE === 'all'/);   // 2026-10-10：rfZones=all を追加（phub は同じ）
  assert.match(v, /const KEY = 'mmrf_proto_v1'/);
  assert.doesNotMatch(v, /st\.(zone|scene)\s*=/, '区域を保存の状態に書かない');
  assert.doesNotMatch(rd('js/proto/roadfirst-zones.js'), /localStorage|fetch\(|XMLHttpRequest/, 'zones は純粋な関数だけ');
  const i = html.indexOf('roadfirst-zones.js'), j = html.indexOf('roadfirst-view.js');
  assert.ok(i > 0 && i < j && html.indexOf('roadfirst-core.js') < i, 'core → zones → view');
  assert.doesNotMatch(html, /p_hub_1010/);
});
