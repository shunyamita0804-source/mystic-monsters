// 68 Scene の表（原本 CSV）と P ハブの区域の表から、RoadFirst の rfZones=all 用の索引と背景の状況表を作る（2026-10-10・試作）。
//   node tools/roadfirst/build_scene68.mjs
//   入力：prototype/p_hub_1010/source/SOURCE_SCENE_PLAN_68_UNCHANGED.csv（原本・sha256 2852ba56…）・prototype/p_hub_1010/scene_registry.json
//   出力：prototype/scene68_1010/scene_index_68.json（画面が読む）・prototype/scene68_1010/68_scene_asset_status.csv（次の背景発注の入力）
//   画像の座標・完成判定は作らない（registry に測った座標がある区域だけを数える）
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CSV = 'prototype/p_hub_1010/source/SOURCE_SCENE_PLAN_68_UNCHANGED.csv';
const SHA = '2852ba56ca6a6861c820ad3349422be75167e7c4153e1f2b065c132ea9dd1571';
const OUT = 'prototype/scene68_1010';
const SKIP = ['approach'];   // js/proto/roadfirst-zones.js の ROADFIRST_SKIP と同じ（RoadFirst の画面では使わない区域）
export const FALLBACK = 'ROADFIRST_FALLBACK';

export function csvRows(t) {
  t = t.replace(/^﻿/, ''); const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < t.length; i++) { const c = t[i];
    if (q) { if (c === '"' && t[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(cell); cell = ''; } else if (c === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; } else cell += c; }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const h = rows.shift(); return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i]])));
}
const esc = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };

export function build() {
  const buf = readFileSync(path.join(ROOT, CSV));
  const sha = createHash('sha256').update(buf).digest('hex');
  if (sha !== SHA) throw new Error(`68 Scene の原本の sha256 が違う：${sha}`);
  const plan = csvRows(buf.toString('utf8'));
  const reg = JSON.parse(readFileSync(path.join(ROOT, 'prototype/p_hub_1010/scene_registry.json'), 'utf8'));
  const lay = reg.layouts[reg.default_layout];
  const groups = [];   // 景観（background_motif）ごとのまとまり＝同じ用途の背景をまとめられる候補
  for (const r of plan) if (!groups.includes(r.background_motif)) groups.push(r.background_motif);
  const gid = (m) => 'M' + String(groups.indexOf(m) + 1).padStart(2, '0');
  const gsize = (m) => plan.filter((r) => r.background_motif === m).length;
  const scenes = [], status = [];
  for (const r of plan) {
    const nodes = r.visible_node_ids_ordered.split(';');
    const zs = (lay.scenes[r.scene_id] || { zones: [] }).zones.filter((z) => !SKIP.includes(z.id) && reg.assets[z.asset] && reg.assets[z.asset].file);
    const covered = nodes.filter((n) => zs.some((z) => z.nodes.includes(n) && z.xy && Array.isArray(z.xy[n])));
    const assets = [...new Set(zs.map((z) => z.asset))];
    const kinds = assets.map((a) => reg.assets[a].kind);
    const bg = assets.concat(covered.length < nodes.length ? [FALLBACK] : []);
    const disp = kinds.includes('final') && covered.length === nodes.length ? '正式' : kinds.includes('candidate') ? '暫定' : '仮表示';
    scenes.push({ id: r.scene_id, title: r.provisional_title, route: r.route_id, region: r.region, nodes, zones: !!zs.length });
    status.push({
      scene_id: r.scene_id, provisional_title: r.provisional_title, region: r.region, route_id: r.route_id,
      background_ids: bg.join(';'), display_status: disp,
      display_note: disp === '暫定' ? `${covered.length < nodes.length ? '一部の地点（' + covered.join('・') + '）' : '全地点'}が候補画像／構図参考図（美術は未承認）${covered.length < nodes.length ? '。残りは図面' : ''}` : 'RoadFirst の2D道路図面（背景は未制作）',
      node_count: nodes.length, nodes_with_image: covered.length, nodes_fallback: nodes.length - covered.length,
      landscape_category: r.background_motif, landscape_group: gid(r.background_motif), landscape_group_size: gsize(r.background_motif),
      landmark: r.landmark, physical_support: r.art_physical_support_notes, fork_merge_dead_end_event: r.fork_merge_dead_end_event,
      background_missing: kinds.includes('final') && covered.length === nodes.length ? 'なし' : 'あり',
    });
  }
  return { sha, scenes, status, groups: groups.map((m) => ({ id: gid(m), motif: m, scenes: plan.filter((r) => r.background_motif === m).map((r) => r.scene_id) })) };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const b = build();
  const idx = { note: '68 Scene の索引（原本 CSV から tools/roadfirst/build_scene68.mjs が作る。手で書き換えない）。nodes＝visible_node_ids_ordered。背景・座標は prototype/p_hub_1010/scene_registry.json の区域だけ（zones: true の Scene）', source_sha256: b.sha, fallback: FALLBACK, scenes: b.scenes };
  writeFileSync(path.join(ROOT, OUT, 'scene_index_68.json'), JSON.stringify(idx) + '\n');
  const cols = Object.keys(b.status[0]);
  writeFileSync(path.join(ROOT, OUT, '68_scene_asset_status.csv'), '﻿' + [cols.join(','), ...b.status.map((s) => cols.map((c) => esc(s[c])).join(','))].join('\n') + '\n');
  const miss = b.status.filter((s) => s.background_missing === 'あり').length;
  console.log(`68 Scene：背景が足りない ${miss}・暫定 ${b.status.filter((s) => s.display_status === '暫定').length}・景観のまとまり ${b.groups.length}`);
  for (const g of b.groups) console.log(`${g.id}（${g.scenes.length}）${g.motif}｜${g.scenes.join(' ')}`);
}
