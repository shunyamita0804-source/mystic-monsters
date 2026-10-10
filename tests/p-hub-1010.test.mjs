// =========================================================
// P ハブ背景共用の独立プレビュー（2026-10-10・試作。prototype/p_hub_1010/）
//  PH1-01 原本：リポジトリの原本グラフ＝ZIP の SOURCE_GRAPH（sha256）・299／42／370・68 Scene 表（sha256）・68 Scene の隣り合う地点はすべて原本の forward
//  PH1-02 scene_registry.json：3 Scene の並び＝68 Scene 表・ZIP の 02 の照合表・原本の forward・画像の中の座標（全地点）・カメラの範囲に全地点が入る・
//         背景は1枚（3 Scene とも同じ asset）・仮背景は art_pass_allowed false・完成背景は未着で座標を空のまま（推測で埋めない）
//  PH1-03 進み方：MMRF_CORE で各 Scene を1マスずつ＝予定の地点・Scene09／20 の終点 P から Scene22 へ・LOWER_GATE で門の出来事・
//         逆向き：原本の reverse_allowed はすべて false・MMRF_CORE.options は1つ前の地点へ戻る接続を出さない
//  PH1-04 原本・道路先行の試作・ゲーム本体を書き換えていない・プレビューは localStorage を使わない
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

test('PH1-02：scene_registry＝3 Scene の並び・背景1枚・Scene ごとの座標とカメラ・仮背景で美術判定しない・完成背景は空のまま', () => {
  assert.deepEqual(Object.keys(REG.scenes), MAN.p_hub_scenes);
  const prov = REG.assets.p_hub_qa_structure, fin = REG.assets.p_hub_final;
  assert.equal(sha(path.join(P, prov.file)), prov.sha256); assert.equal(prov.art_pass_allowed, false); assert.equal(prov.kind, 'provisional');
  const png = readFileSync(path.join(P, prov.file)); assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [prov.w, prov.h]);
  assert.equal(fin.file, null, '完成背景は未着');
  for (const [sid, s] of Object.entries(REG.scenes)) {
    const plan = PLAN.find((r) => r.scene_id === sid), chk = CHECK.find((r) => r.scene_id === sid);
    assert.deepEqual(s.nodes, plan.visible_node_ids_ordered.split(';'), `${sid}：68 Scene 表の並び`);
    assert.deepEqual(s.nodes, chk.visible_node_ids_ordered.split(';'), `${sid}：ZIP の照合表`); assert.equal(s.nodes.length, Number(chk.count));
    assert.ok(s.nodes.length >= 4 && s.nodes.length <= 6, `${sid}：4〜6地点`);
    for (let i = 1; i < s.nodes.length; i++) assert.ok(FWD.has(s.nodes[i - 1] + '>' + s.nodes[i]), `${sid}：forward`);
    const xy = s.xy.p_hub_qa_structure, [x0, y0, x1, y1] = s.camera.p_hub_qa_structure.rect;
    assert.deepEqual(Object.keys(xy).sort(), s.nodes.slice().sort(), `${sid}：全地点に座標`);
    for (const [n, [x, y]] of Object.entries(xy)) {
      assert.ok(x >= 0 && x <= prov.w && y >= 0 && y <= prov.h, `${sid} ${n} は絵の中`);
      assert.ok(x >= x0 + 40 && x <= x1 - 40 && y >= y0 + 40 && y <= y1 - 40, `${sid} ${n} はカメラの範囲の内側（端で切れない）`);
    }
    assert.equal(s.xy.p_hub_final, null, `${sid}：完成背景の座標は空（推測で埋めない）`); assert.equal(s.camera.p_hub_final, null);
    assert.ok(x0 >= 0 && y0 >= 0 && x1 <= prov.w && y1 <= prov.h, `${sid}：カメラの範囲は絵の中`);
  }
  assert.deepEqual(REG.scenes.Scene09.xy.p_hub_qa_structure.P, REG.scenes.Scene20.xy.p_hub_qa_structure.P, '同じ P は同じ位置（同じ背景）');
  assert.deepEqual(REG.scenes.Scene09.xy.p_hub_qa_structure.P, REG.scenes.Scene22.xy.p_hub_qa_structure.P);
  const src = rd(path.join(P, 'index.html'));
  assert.equal((src.match(/<img /g) || []).length, 1, '背景の <img> は1つ（3 Scene で共用）');
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

test('PH1-04：原本・道路先行の試作・ゲーム本体は変えていない・プレビューは保存に触れない', () => {
  const src = rd(path.join(P, 'index.html'));
  assert.doesNotMatch(src, /localStorage|sessionStorage|indexedDB/);
  assert.match(src, /\.\.\/\.\.\/js\/proto\/roadfirst-data\.js/); assert.match(src, /\.\.\/\.\.\/js\/proto\/roadfirst-core\.js/);
  assert.doesNotMatch(rd(path.join(ROOT, 'index.html')), /p_hub_1010/, 'ゲーム本体から読み込まない');
});
