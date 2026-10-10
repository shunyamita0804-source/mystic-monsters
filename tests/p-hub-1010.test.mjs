// =========================================================
// P ハブ背景共用の独立プレビュー（2026-10-10・試作。prototype/p_hub_1010/）
//  PH1-01 原本：リポジトリの原本グラフ＝ZIP の SOURCE_GRAPH（sha256）・299／42／370・68 Scene 表（sha256）・68 Scene の隣り合う地点はすべて原本の forward
//  PH1-02 scene_registry.json：3 Scene の並び＝68 Scene 表・ZIP の 02 の照合表・原本の forward・区域（背景ゾーン）が地点を漏れなく重複なく受け持つ・
//         区域ごとの座標とカメラの範囲・art_pass_allowed false・完成背景は未着で空のまま（推測で埋めない）
//  PH1-03 進み方：MMRF_CORE で各 Scene を1マスずつ＝予定の地点・Scene09／20 の終点 P から Scene22 へ・LOWER_GATE で門の出来事・
//         逆向き：原本の reverse_allowed はすべて false・MMRF_CORE.options は1つ前の地点へ戻る接続を出さない
//  PH1-04 原本を書き換えていない・プレビューは localStorage を使わない・ゲーム本体は区域の表を直接読まない（2026-10-10 RoadFirst への統合は tests/roadfirst-phub-1010.test.mjs）
//  PH1-05 P 中核の候補画像（ZIP Salvage）：7地点・6接続・ZIP の仮座標はそのまま・Scene ごとに P に近い3地点・門の出来事は原本の LOWER_GATE だけ
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = path.join(ROOT, 'prototype/p_hub_1010');
const rd = (p) => readFileSync(p, 'utf8');
const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
await import('../js/proto/roadfirst-data.js');
await import('../js/proto/roadfirst-core.js');
const D = globalThis.MMRF_DATA, C = globalThis.MMRF_CORE;
const G = JSON.parse(rd(path.join(ROOT, 'assets/proto/ch1a_roadfirst_1009/09_original_source_graph.json')));
const FWD = new Set(G.edges.filter((e) => e.direction === 'forward').map((e) => e.source + '>' + e.target));
const REG = JSON.parse(rd(path.join(P, 'scene_registry.json')));
const MAN = JSON.parse(rd(path.join(P, 'source/04_manifest.json')));
function csvRows(f) {
  const t = rd(f).replace(/^﻿/, ''), rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < t.length; i++) { const c = t[i];
    if (q) { if (c === '"' && t[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(cell); cell = ''; } else if (c === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; } else cell += c; }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const h = rows.shift(); return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i]])));
}
const PLAN = csvRows(path.join(P, 'source/SOURCE_SCENE_PLAN_68_UNCHANGED.csv'));
const CHECK = csvRows(path.join(P, 'source/02_P_scenes_source_check.csv'));

test('PH1-01：原本＝ZIP の SOURCE_GRAPH・299／42／370・68 Scene 表・全 Scene の隣り合う地点は原本の forward', () => {
  assert.equal(sha(path.join(ROOT, 'assets/proto/ch1a_roadfirst_1009/09_original_source_graph.json')), MAN.source_sha256);
  assert.equal(sha(path.join(P, 'source/SOURCE_SCENE_PLAN_68_UNCHANGED.csv')), MAN.scenes_sha256);
  assert.equal(Object.keys(G.nodes).length, 299); assert.equal(Object.keys(G.segments).length, 42); assert.equal(G.edges.length, 370);
  assert.deepEqual([Object.keys(D.nodes).length, Object.keys(D.segments).length, D.edges.length], [299, 42, 370], 'MMRF_DATA も同じ数');
  assert.equal(PLAN.length, 68);
  for (const r of PLAN) { const ns = r.visible_node_ids_ordered.split(';');
    for (let i = 1; i < ns.length; i++) assert.ok(FWD.has(ns[i - 1] + '>' + ns[i]), `${r.scene_id}：${ns[i - 1]}→${ns[i]}`); }
});

test('PH1-02：scene_registry＝3 Scene の並び・区域が Scene の地点を漏れなく重複なく受け持つ・区域ごとの座標とカメラ・美術判定しない・完成背景は空のまま', () => {
  assert.deepEqual(Object.keys(REG.scenes), MAN.p_hub_scenes);
  for (const [id, a] of Object.entries(REG.assets)) {
    if (!a.file) { assert.equal(a.kind, 'final', `${id}：ファイルが無いのは未着の完成背景だけ`); continue; }
    assert.equal(sha(path.join(P, a.file)), a.sha256, id); assert.equal(a.art_pass_allowed, false, `${id}：美術の合格を判定しない`);
    const png = readFileSync(path.join(P, a.file)); assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [a.w, a.h], id);
  }
  assert.equal(REG.assets.p_hub_final.file, null, '完成背景は未着');
  for (const [sid, s] of Object.entries(REG.scenes)) {
    const plan = PLAN.find((r) => r.scene_id === sid), chk = CHECK.find((r) => r.scene_id === sid);
    assert.deepEqual(s.nodes, plan.visible_node_ids_ordered.split(';'), `${sid}：68 Scene 表の並び`);
    assert.deepEqual(s.nodes, chk.visible_node_ids_ordered.split(';'), `${sid}：ZIP の照合表`); assert.equal(s.nodes.length, Number(chk.count));
    for (let i = 1; i < s.nodes.length; i++) assert.ok(FWD.has(s.nodes[i - 1] + '>' + s.nodes[i]), `${sid}：forward`);
    for (const [lid, L] of Object.entries(REG.layouts)) {
      const zs = L.scenes[sid].zones;
      assert.deepEqual(zs.flatMap((z) => z.nodes), s.nodes, `${lid}/${sid}：区域は Scene の地点を順に漏れなく重複なく受け持つ`);
      for (const z of zs) {
        const a = REG.assets[z.asset]; assert.ok(a && a.file, `${lid}/${sid}/${z.id}：背景がある`);
        const [x0, y0, x1, y1] = z.camera; assert.ok(x0 >= 0 && y0 >= 0 && x1 <= a.w && y1 <= a.h, `${lid}/${sid}/${z.id}：カメラの範囲は絵の中`);
        for (const tbl of [z.xy, z.xy_zip].filter(Boolean)) {
          assert.deepEqual(Object.keys(tbl).sort(), z.nodes.slice().sort(), `${lid}/${sid}/${z.id}：区域の全地点に座標`);
          for (const [n, [x, y]] of Object.entries(tbl)) assert.ok(x >= x0 + 40 && x <= x1 - 40 && y >= y0 + 40 && y <= y1 - 40, `${lid}/${sid}/${z.id} ${n} はカメラの範囲の内側`);
        }
      }
    }
  }
  const core = (sid) => REG.layouts.core_zones.scenes[sid].zones.find((z) => z.asset === 'p_core_candidate');
  assert.deepEqual(core('Scene09').xy.P, core('Scene20').xy.P, '同じ P は同じ位置（同じ背景）'); assert.deepEqual(core('Scene09').xy.P, core('Scene22').xy.P);
  const src = rd(path.join(P, 'index.html'));
  assert.equal((src.match(/<img /g) || []).length, 1, '<img> を作るのは1か所（背景1枚につき1つ）');
});

test('PH1-05：P 中核の候補画像＝7地点・6接続（原本）・ZIP の仮座標はそのまま・Scene ごとに P に近い3地点だけ・門の出来事は原本の LOWER_GATE だけ', () => {
  const S = path.join(P, 'source/salvage_1010');
  const EDG = csvRows(path.join(S, '04_P_Core_6_Edges_Original_Check.csv'));
  assert.equal(EDG.length, 6);
  for (const r of EDG) { const e = G.edges.find((x) => x.id === r.edge_id); assert.ok(e && e.source === r.source && e.target === r.target && e.direction === 'forward', `${r.edge_id}：原本の forward`); }
  const ZXY = Object.fromEntries(csvRows(path.join(S, '03_P_Core_ImageXY_PROVISIONAL.csv')).map((r) => [r.node_id, [Number(r.image_x), Number(r.image_y)]]));
  const zones = Object.values(REG.layouts.core_zones.scenes).flatMap((s) => s.zones).filter((z) => z.asset === 'p_core_candidate');
  const nodes = [...new Set(zones.flatMap((z) => z.nodes))].sort();
  assert.deepEqual(nodes, Object.keys(ZXY).sort(), '候補画像に載る地点＝ZIP の7地点');
  assert.deepEqual(zones.map((z) => z.nodes), [['EL04_11', 'EL04_12', 'P'], ['ER04_12', 'ER04_13', 'P'], ['P', 'C01_01', 'C01_02']], 'Scene ごとに P に近い3地点');
  for (const z of zones) for (const n of z.nodes) assert.deepEqual(z.xy_zip[n], ZXY[n], `${n}：ZIP の仮座標は書き換えていない`);
  const fail = JSON.parse(rd(path.join(S, '07_BOARD_QA_FAIL_Original.json')));
  assert.equal(fail.decision, 'FAIL'); assert.equal(fail.source_sha256, MAN.source_sha256);
  assert.match(REG.assets.p_core_candidate.status, /保留/, '橋状の P 広場の美術承認は保留');
  const gates = Object.entries(D.nodes).filter(([, v]) => /gate/.test(v[2])).map(([k]) => k);
  assert.ok(!gates.some((g) => nodes.includes(g)), '候補画像の区域に原本の門の地点は無い（絵の門で出来事を起こさない）');
});

function walk(sid) {
  const s = REG.scenes[sid], st = C.create(D, { seed: 1, turnLimit: 999, randOpen: true }); st.node = s.nodes[0]; st.trail = [st.node];
  const evs = [];
  for (let i = 1; i < s.nodes.length; i++) {
    assert.ok(C.roll(D, st, 1)); const op = C.options(D, st), pick = (op.find((e) => e.dst === s.nodes[i]) || {}).seg;
    evs.push(...C.advance(D, st, pick ? { choose: pick } : {}));
    assert.equal(st.node, s.nodes[i], `${sid}：${i}歩目は ${s.nodes[i]}`);
  }
  return { st, evs };
}
test('PH1-03：MMRF_CORE で1マスずつ＝予定の地点・P から Scene22 へ・門・逆向きは許可されない', () => {
  for (const sid of ['Scene09', 'Scene20']) {
    const { st } = walk(sid); assert.equal(st.node, 'P');
    assert.equal(REG.scenes[sid].next_scene_at_last_node, 'Scene22');
    assert.ok(C.roll(D, st, 1)); C.advance(D, st); assert.equal(st.node, 'C01_01', `${sid}：P の次は Scene22 の C01_01（P から出る道は1本）`);
  }
  const { st, evs } = walk('Scene22');
  assert.ok(evs.some((e) => e.type === 'gate' && e.at === 'LOWER_GATE'), '下門で門の出来事'); assert.deepEqual(st.gates, ['LOWER_GATE']);
  const SEGS = ['EL04', 'ER04', 'C01', 'C02'];
  G.edges.filter((e) => SEGS.includes(e.segment_id)).forEach((e) => assert.equal(e.reverse_allowed, false, `${e.id}：逆向き不可`));
  for (const s of Object.values(REG.scenes)) for (let i = 1; i < s.nodes.length; i++) {
    const t = C.create(D, { seed: 1, turnLimit: 999, randOpen: true }); t.node = s.nodes[i];
    assert.ok(!C.options(D, t).some((e) => e.dst === s.nodes[i - 1]), `${s.nodes[i]}→${s.nodes[i - 1]} は MMRF_CORE が出さない`);
    assert.ok(!D.edges.some((e) => e[0] === s.nodes[i] && e[1] === s.nodes[i - 1]), '原本に逆向きの接続は無い');
  }
  const t = C.create(D, { seed: 1, turnLimit: 999, randOpen: true }); t.node = 'P';
  assert.deepEqual(C.options(D, t).map((e) => e.dst), ['C01_01'], 'P から出る道は C01_01 だけ（架空の分かれ道は無い）');
});

test('PH1-04：原本は変えていない・プレビューは保存に触れない・ゲーム本体の index.html は区域の表を直接読まない（RoadFirst の &rfZones=phub だけ＝RZ-01〜）', () => {
  const src = rd(path.join(P, 'index.html'));
  assert.doesNotMatch(src, /localStorage|sessionStorage|indexedDB/);
  assert.match(src, /\.\.\/\.\.\/js\/proto\/roadfirst-data\.js/); assert.match(src, /\.\.\/\.\.\/js\/proto\/roadfirst-core\.js/);
  assert.doesNotMatch(rd(path.join(ROOT, 'index.html')), /p_hub_1010/, 'ゲーム本体から読み込まない');
});
