// =========================================================
// RoadFirst の rfZones=all：68 Scene 全域（2026-10-10・試作。prototype/scene68_1010/・js/proto/roadfirst-zones.js の sceneOf／resolveAll）
//  S68-01 原本：68 Scene の CSV の sha256・原本グラフの sha256・299／42／370
//  S68-02 索引：tools/roadfirst/build_scene68.mjs の出力と同じ（手で書き換えていない）・68 Scene・表示する地点はすべて原本の 299 にある・
//         68 Scene で 299 地点を漏れなく受け持つ・Scene の中の並びは原本の forward の接続
//  S68-03 Scene の決め方：370 の接続すべてで「今の地点＋1つ前の地点」から Scene が1つに決まる・START は Scene01・
//         シミュレーション（報酬の枝・左右・H の3つ・D_RAND）でも決められない地点 0
//  S68-04 背景：区域があるのは Scene09・20・22 だけ（P の測った座標・暫定）・それ以外は ROADFIRST_FALLBACK（図面・仮表示）・P は phub と同じ
//  S68-05 状況表 68_scene_asset_status.csv：68 行・背景の不足・景観のまとまり・座標や完成の判定の列は無い
//  S68-06 フラグ：rfZones=all／phub／無指定・index.html は読み込む JS を増やしていない
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, csvRows, FALLBACK } from '../tools/roadfirst/build_scene68.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const sha = (p) => createHash('sha256').update(readFileSync(path.join(ROOT, p))).digest('hex');
await import('../js/proto/roadfirst-data.js');
await import('../js/proto/roadfirst-core.js');
await import('../js/proto/roadfirst-zones.js');
const D = globalThis.MMRF_DATA, C = globalThis.MMRF_CORE, Z = globalThis.MMRF_ZONES;
const IDX = JSON.parse(rd('prototype/scene68_1010/scene_index_68.json'));
const REG = JSON.parse(rd('prototype/p_hub_1010/scene_registry.json'));
const SK = Z.ROADFIRST_SKIP;

test('S68-01：原本（68 Scene の CSV・原本グラフ）・299／42／370', () => {
  assert.equal(sha('prototype/p_hub_1010/source/SOURCE_SCENE_PLAN_68_UNCHANGED.csv'), '2852ba56ca6a6861c820ad3349422be75167e7c4153e1f2b065c132ea9dd1571');
  assert.match(rd('prototype/scene68_1010/source_checksum.txt'), /2852ba56ca6a6861c820ad3349422be75167e7c4153e1f2b065c132ea9dd1571/);
  assert.equal(sha('assets/proto/ch1a_roadfirst_1009/09_original_source_graph.json'), JSON.parse(rd('prototype/p_hub_1010/source/04_manifest.json')).source_sha256);
  assert.equal(Object.keys(D.nodes).length, 299); assert.equal(Object.keys(D.segments).length, 42); assert.equal(D.edges.length, 370);
});

test('S68-02：索引＝生成物のまま・68 Scene が 299 地点を受け持つ・Scene の中の並びは原本の forward', () => {
  const b = build();
  assert.deepEqual(IDX.scenes, b.scenes, 'scene_index_68.json は build_scene68.mjs の出力のまま');
  assert.equal(IDX.scenes.length, 68); assert.equal(IDX.fallback, FALLBACK);
  const all = new Set(), fwd = new Set(D.edges.filter((e) => e[3] === 'forward').map((e) => e[0] + '>' + e[1]));
  for (const s of IDX.scenes) {
    for (const n of s.nodes) { assert.ok(D.nodes[n], `${s.id} の ${n} は原本にある`); all.add(n); }
    for (let i = 1; i < s.nodes.length; i++) assert.ok(fwd.has(s.nodes[i - 1] + '>' + s.nodes[i]), `${s.id}：${s.nodes[i - 1]}>${s.nodes[i]}`);
  }
  assert.equal(all.size, 299, '68 Scene で 299 地点を漏れなく');
});

test('S68-03：Scene は地点＋1つ前の地点から1つに決まる（370 接続・シミュレーション）', () => {
  for (const e of D.edges) { const r = Z.sceneOf(IDX, e[1], [e[0], e[1]]); assert.ok(r.scene && !r.ambiguous, `${e[0]}>${e[1]}（${e[3]}）`); assert.ok(r.scene.nodes.includes(e[1])); }
  assert.equal(Z.sceneOf(IDX, 'START', ['START']).scene.id, 'Scene01');
  const spurs = Object.keys(D.segments).filter((k) => /^D_/.test(k)), seen = new Set(); let bad = 0;
  for (let seed = 1; seed <= 400; seed++) {
    const st = C.simulate(D, { seed, turnLimit: 400, randOpen: seed % 2 === 0, p: { spurs: spurs.filter((_, i) => (seed >> i) & 1), j0: seed % 3 ? 'L' : 'R', h: ['safe', 'left', 'right'][seed % 3] } });
    for (let i = 0; i < st.trail.length; i++) { const r = Z.sceneOf(IDX, st.trail[i], st.trail.slice(0, i + 1)); if (r.scene) seen.add(r.scene.id); else bad++; }
  }
  assert.equal(bad, 0, '決められない地点 0'); assert.equal(seen.size, 68, '68 Scene すべてに入った');
});

test('S68-04：区域は Scene09・20・22 だけ・ほかは図面・P は phub と同じ', () => {
  assert.deepEqual(IDX.scenes.filter((s) => s.zones).map((s) => s.id), ['Scene09', 'Scene20', 'Scene22']);
  for (const side of ['L', 'R']) {
    const r = [...new Set([...D.segments.S01[3], ...(side === 'L' ? ['EL01', 'EL02', 'EL03', 'EL04'] : ['ER01', 'ER02', 'ER03', 'ER04']).flatMap((k) => D.segments[k][3]), ...D.segments.C01[3], ...D.segments.C02[3]])];
    for (let i = 0; i < r.length; i++) {
      const t = r.slice(0, i + 1), a = Z.resolveAll(REG, IDX, r[i], t, SK), p = Z.resolve(REG, r[i], t, null, SK);
      assert.ok(a.scene, r[i]);
      assert.deepEqual(a.zone && [a.zone.scene, a.zone.id, a.zone.asset, a.zone.at], p && [p.scene, p.id, p.asset, p.at], `${side} ${r[i]}：phub と同じ区域`);
    }
  }
  assert.equal(Z.resolveAll(REG, IDX, 'S01_02', ['START', 'S01_01', 'S01_02'], SK).zone, null, 'Scene01 は図面');
  assert.equal(Z.resolveAll(REG, IDX, 'C02_02', ['C02_01', 'C02_02'], SK).scene.id, 'Scene23');
  assert.equal(Z.resolveAll(REG, IDX, 'C02_02', ['C02_01', 'C02_02'], SK).zone, null, 'Scene23 は図面');
});

test('S68-05：状況表＝68 行・背景の不足・景観のまとまり・座標や完成の判定は無い', () => {
  const rows = csvRows(rd('prototype/scene68_1010/68_scene_asset_status.csv'));
  assert.equal(rows.length, 68);
  const b = build(); assert.deepEqual(rows.map((r) => r.scene_id), b.status.map((s) => s.scene_id));
  for (const r of rows) {
    assert.ok(['正式', '暫定', '仮表示'].includes(r.display_status));
    assert.ok(r.background_ids, r.scene_id); assert.ok(r.landscape_category && /^M\d\d$/.test(r.landscape_group));
    if (['Scene09', 'Scene20', 'Scene22'].includes(r.scene_id)) assert.equal(r.display_status, '暫定'); else { assert.equal(r.background_ids, FALLBACK); assert.equal(r.display_status, '仮表示'); }
    assert.equal(r.background_missing, 'あり', `${r.scene_id}：完成背景は無い`);
  }
  assert.ok(!Object.keys(rows[0]).some((k) => /xy|camera|coord|座標/i.test(k)), '座標の列は無い');
  assert.ok(!rows.some((r) => r.display_status === '正式'));
});

test('S68-06：rfZones=all／phub／無指定・読み込む JS は増やしていない', () => {
  const v = rd('js/proto/roadfirst-view.js');
  assert.match(v, /const ZON = ZMODE === 'phub' \|\| ZMODE === 'all', ZALL = ZMODE === 'all'/);
  assert.match(v, /scene68_1010\/scene_index_68\.json/);
  assert.doesNotMatch(v, /\bfetch\s*\(/);
  assert.equal((rd('index.html').match(/js\/proto\//g) || []).length, 14, '2026-10-20 第4便 board-gl（WebGL の盤）を追加・2026-10-20 追加指示 board-display（Chapter 1・3 の円の広場の表示の配置）を追加・2026-10-19 Chapter 4 の ch4-routes・ch4-world を追加・2026-10-18 ch3-routes（Chapter 3）を追加・data・routes・core・play・zones・world・ch2-routes・ch2-world・view の9本（2026-10-10 world・2026-10-14 routes＝Chapter 1 B／C 独立ルート・2026-10-15 ch2-routes＝Chapter 2 A／B／C 設計案の試作データを追加）・2026-10-15 追補 ch2-world＝Chapter 2 設計案の海の世界の描画');
});
