// =========================================================
// 2026-10-20 第5便（iPhone 試遊 road5 の指摘 8 点＋マスの密集・レアの特別感・ユーザー納品 F01〜F06）
//  R5-01 素材：F01〜F06 を assets/ に（WebP）・取り込みの道具（tools/fullplay1020/r5-art.py）
//  R5-02 表示の配置（planLayout）：Chapter 1・3・4 の A／B／C で、マスどうしが重ならない（隙間 1 単位以上・小さくしたマスは小さくした大きさで）・
//        広場の中にマスを置かない・地点の座標（進行のデータ）は書き換えない
//  R5-03 近すぎる別の道どうしを離す（MMRF_DISP.separate・sep）：Chapter 4 の近い地点が減る・地点の ID とつながりは同じ
//  R5-04 分かれ道の矢印（F05）・ライバル登場（F04・声は幕の中＝ユーザー決定 A）・レアの遭遇（F06・カードの文はユーザー決定）
//  R5-05 Chapter 2：残りの門を正面向き（F03）・海底の道とトンネル（F01・F02＝WebGL）・透明な所は深さを書かない
//  R5-06 Chapter 4 C の寄り道 D_LLA 7→5 歩：旧いセーブの位置（D_LLA_05・06）を読み替える（配置を消さない）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
function load(files) { const w = {}; for (const f of files) new Function('window', 'module', rd(f))(w, undefined); return w; }

test('R5-01：F01〜F06 の素材（WebP）と取り込みの道具', () => {
  const F = ['fields/ch2/tunnel_1020/glass_panel', 'fields/ch2/tunnel_1020/rib_front', 'fields/ch2/tunnel_1020/portal_front',
    ...['glass_floor', 'glass_curb', 'sunken_road', 'sunken_curb', 'sunken_plaza'].map((k) => 'fields/gl_1020/ch2_' + k),
    ...['descent_gate', 'ascent_gate', 'sealed_sea_gate', 'arena_gate'].map((k) => `fields/front_1020/ch2_${k}_front`),
    ...['rival_bg', 'rival_aura', 'rival_nameplate', 'rival_slash'].map((k) => 'chapter/rival_1020/' + k),
    ...['gold', 'blue', 'green'].flatMap((c) => [`chapter/fork_1020/arrow_${c}`, `chapter/fork_1020/badge_${c}`]),
    ...[1, 2, 3, 4].map((c) => `chapter/rare_1020/rare_bg_ch${c}`), 'chapter/rare_1020/rare_aura', 'chapter/rare_1020/rare_card_frame'];
  for (const f of F) assert.ok(existsSync(path.join(ROOT, 'assets', f + '.webp')), f);
  const t = rd('tools/fullplay1020/r5-art.py');
  assert.match(t, /def defringe\(im, n=2\):/, '縁の紫（背景抜きの残り）を透明に');
  assert.match(t, /ys = np\.where\(sd > 3\)\[0\]/, '背景の上下の単色の余白を切る');
});

const DATA = ['js/proto/roadfirst-data.js', 'js/proto/roadfirst-routes.js', 'js/proto/ch3-routes.js', 'js/proto/ch4-routes.js', 'js/proto/board-display.js', 'js/proto/roadfirst-world.js', 'js/proto/ch4-world.js'];
test('R5-02：表示の配置＝マスは重ならない・広場の中に置かない・進行のデータは同じ', () => {
  const w = load(DATA), X = w.MMRF_DISP, W = w.MMRF_WORLD, H = { roadChains: W.roadChains, roadPts: W.roadPts };
  const C4 = { clear: 24, gap: 14, minD: 11, uniform: true, sep: 34 };
  const sets = { '1A': [X.clearPlazas(w.MMRF_DATA, { sep: 27 }), 13], '1B': [X.clearPlazas(w.MMRF_ROUTES.B, { sep: 27 }), 13], '1C': [X.clearPlazas(w.MMRF_ROUTES.C, { sep: 27 }), 13],
    '3A': [X.clearPlazas(w.MMRF_CH3.A, { sep: 27 }), 13], '3B': [X.clearPlazas(w.MMRF_CH3.B, { sep: 27 }), 13], '3C': [X.clearPlazas(w.MMRF_CH3.C, { sep: 27 }), 13],
    '4A': [X.clearPlazas(w.MMRF_CH4.A, C4), 11.5], '4B': [X.clearPlazas(w.MMRF_CH4.B, C4), 11.5], '4C': [X.clearPlazas(w.MMRF_CH4.C, C4), 11.5] };
  for (const [k, [D, tw]] of Object.entries(sets)) {
    const before = JSON.stringify(D.nodes), ch4 = k[0] === '4', L = (ch4 ? w.MMRF_VOLC.lines(D, H) : W.roadLinesOf(D)).map((l) => Object.assign({}, l, { P: l.P.map((p) => p.slice()) }));
    const hubs = new Set(W.hubsOf(D).hubs), roadW = ch4 ? 30.4 : 23;
    const rOf = (id) => (hubs.has(id) ? (ch4 ? 17 : W.ART.strip.w * 0.8) : /dead_end/.test(D.nodes[id][2] || '') ? (ch4 ? 15.5 : W.ART.strip.w * 0.7) : 0);   // Chapter 4 の広場は 15.5〜19（ch4-world.js の radius）
    const P = W.planLayout(D, L, { tw, S: tw * 1.35, rOf, extend: true, extMax: 80, onGround: W.groundOf(D), roadW, W: 1024, H: 1536 });
    assert.equal(JSON.stringify(D.nodes), before, `${k}：地点の座標（進行のデータ）は書き換えない`);
    const at = (id) => P.pos[id] || D.nodes[id];
    let worst = 1e9, where = '';
    for (const l of L) for (let i = 0; i < l.ids.length - 1; i++) { const a = l.ids[i], b = l.ids[i + 1]; if (P.r[a] || P.r[b]) continue;
      const g = Math.hypot(at(a)[0] - at(b)[0], at(a)[1] - at(b)[1]) - tw / 2 * ((P.k[a] || 1) + (P.k[b] || 1)); if (g < worst) { worst = g; where = a + '-' + b; } }
    assert.ok(worst >= 1, `${k}：隣のマスとの隙間 ${worst.toFixed(1)}（${where}）`);
    for (const l of L) for (const id of l.ids.slice(1, -1)) for (const e of [l.ids[0], l.ids[l.ids.length - 1]]) if (P.r[e]) assert.ok(Math.hypot(at(id)[0] - at(e)[0], at(id)[1] - at(e)[1]) >= P.r[e] + tw / 2 * (P.k[id] || 1) - 0.6, `${k} ${id}：広場 ${e} の外`);
  }
  const src = rd('js/proto/roadfirst-world.js');
  assert.match(src, /const PLAN = planLayout\(D, LINES, \{ tw: o\.tileW, S: o\.tileW \* 1\.35, rOf: rOf0, extend: !!RR && !SEA3, extMax: 80,/);
  assert.match(src, /const NP = PLAN\.pos, at = \(id\) => NP\[id\] \|\| D\.nodes\[id\];/);
  assert.match(src, /LINES = cp\(SEA && SEA\.lines/, '線は写し（roadPts の線を書き換えない）');
  assert.match(src, /tiles\[id\] = \{[^}]*kd: PLAN\.k\[id\] \|\| 1 \}/);
});

test('R5-03：近すぎる別の道どうしを離す（sep）・つながりは同じ', () => {
  const w = load(DATA), X = w.MMRF_DISP;
  const dseg = (p, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1e-9, t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)); return Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dy * t); };
  const close = (D, rw) => { const P = X.plazaIds(D), segs = Object.values(D.segments).map((s) => s[3]); let n = 0;
    for (const A of segs) for (const B of segs) { if (A === B) continue; const sh = [A[0], A[A.length - 1]].filter((e) => B.includes(e));
      for (const id of A.slice(1, -1)) { if (P.has(id)) continue; const p = D.nodes[id]; if (sh.some((e) => Math.hypot(p[0] - D.nodes[e][0], p[1] - D.nodes[e][1]) < rw * 1.6)) continue;
        let m = 1e9; for (let q = 0; q < B.length - 1; q++) m = Math.min(m, dseg(p, D.nodes[B[q]], D.nodes[B[q + 1]])); if (m < rw * 0.95) n++; } } return n; };
  let before = 0, after = 0;
  for (const r of ['A', 'B', 'C']) { const D0 = w.MMRF_CH4[r], a = X.clearPlazas(D0, { clear: 24, gap: 14, minD: 11, uniform: true }), b = X.clearPlazas(D0, { clear: 24, gap: 14, minD: 11, uniform: true, sep: 34 });
    assert.deepEqual(Object.keys(b.nodes), Object.keys(D0.nodes)); assert.equal(b.edges, D0.edges); assert.equal(b.segments, D0.segments);
    before += close(a, 30.4); after += close(b, 30.4); }
  assert.ok(after * 3 <= before && after <= 3, `Chapter 4 の近すぎる地点 ${before} → ${after}`);
  assert.match(rd('js/chapter/world-driver.js'), /const SEP_OPT = Object\.freeze\(\{ sep: 27 \}\);/);
  assert.match(rd('js/chapter/world-driver-ch3.js'), /clearPlazas\(d, \{ sep: 27 \}\)/);
  assert.match(rd('js/chapter/world-driver-ch4.js'), /const DISP_OPT = \{ clear: 24, gap: 14, minD: 11, uniform: true, sep: 34 \};/);
});

test('R5-04：分かれ道の矢印・ライバル登場（声は幕の中）・レアの遭遇（カードの文）', () => {
  const wb = rd('js/chapter/world-board.js'), rw = rd('js/proto/roadfirst-world.js');
  //  分かれ道：道の上に色の矢印（金・青・緑）・ボタンに同じ色の印・選んだら消す
  assert.match(wb, /const FORK = '\.\/assets\/chapter\/fork_1020\/', FORK_C = Object\.freeze\(\['gold', 'blue', 'green'\]\);/);
  assert.match(wb, /if \(ph !== 'branch' \|\| !m\.raise \|\| !m\.raise\.node\) \{ if \(V\.fork\) \{ w\.arrows\(null\); V\.fork = null; \} return; \}/);
  assert.match(wb, /<i class="wbfk" style="--fk:url\(\$\{FORK\}badge_\$\{FORK_C\[i % 3\]\}\.webp\)"/);
  assert.match(rw, /arrows\(from, list\) \{/); assert.match(rw, /plane\.style\.zIndex = '2';/, 'WebGL の盤の平面（矢印）は地面の上');
  //  ライバル：F04 の背景・光・名札・斬撃（旧の X は使わない）・声は登場の幕の中（ryuLine）・幕で話したら land のあとの一言は出さない
  assert.match(wb, /const RV = '\.\/assets\/chapter\/rival_1020\/';/);
  assert.match(wb, /A0\.voice\(id, \{ maxWaitMs: 900, when: \(\) => el\.isConnected \}\)/);
  assert.match(wb, /if \(battleGo && fx\.battleType === 'rival' && !V\.ryuSaid\) await rivalGreet\(m\);/);
  assert.ok(!/FXF\.clash\b(?!:)/.test(wb.slice(wb.indexOf('async function rivalCut'), wb.indexOf('function ryuLine'))), '旧の赤と青の X は使わない');
  //  レア：Chapter ごとの全画面の背景・カード＝「野外で、特別なモンスターを見つけた！」と「名前（レアモンスター）」だけ（★レア・Lv・調べる／逃げるは出さない）
  const rc = wb.slice(wb.indexOf('async function rareCut'), wb.indexOf('/** ライバル（リュウ）'));
  assert.match(rc, /rare_bg_ch\$\{ch\}\.webp/);
  assert.match(rc, /<small>野外で、特別なモンスターを見つけた！<\/small>/);
  assert.match(rc, /<b>\$\{esc\(foe\.name\)\}<span>（レアモンスター）<\/span><\/b>/);
  assert.ok(!/★|Lv|調べる|逃げる/.test(rc), '★レア・Lv・調べる／逃げるは出さない');
  assert.match(wb, /if \(rare && foe\) return rareCut\(ui, foe, cue\);/);
});

test('R5-05：Chapter 2 の正面の門（F03）・海底の道とトンネル（F01・F02）', () => {
  const rw = rd('js/proto/roadfirst-world.js'), c2 = rd('js/proto/ch2-world.js'), gl = rd('js/proto/board-gl.js');
  for (const k of ['undersea_descent_gate', 'undersea_ascent_gate', 'L09_western_sealed_sea_gate', 'arena_approach_gate', 'glass_corridor_arch', 'rival_pass_gate', 'U03_sunken_temple_gate']) assert.ok(rw.includes(k + '\\.webp$/'), k);
  assert.match(c2, /function undersea\(G, D, H, dep, under\)/);
  for (const t of ['glassFloor', 'glassCurb', 'sunkenRoad', 'sunkenCurb', 'sunkenPlaza', 'tunnelGlass', 'tunnelRib']) assert.ok(c2.includes(t + ':'), t);
  assert.match(c2, /const R = GLASS_W \/ 2 \+ CW \+ 1\.4, HW = 13, HT = 26, ring = \[\];/, 'トンネル＝壁 13・天井 26 単位（モンスターがくぐれる）');
  assert.match(c2, /if \(G\.at\) undersea\(G, D, H, dep, under\);/);
  assert.match(gl, /if \(o\.a < 0\.004\) discard;/, '透明な所は深さを書かない');
  assert.match(gl, /const n = cfg\.D\.nodes\[id\] && \(cfg\.at \? cfg\.at\(id\) : cfg\.D\.nodes\[id\]\);/, '広場は描く位置（延ばした枝）');
});

test('R5-06：Chapter 4 C の寄り道 D_LLA 7→5 歩・旧いセーブの位置を読み替える', () => {
  const w = load(['js/proto/ch4-routes.js']); const D = w.MMRF_CH4.C;
  assert.equal(Object.keys(D.nodes).length, 292); assert.ok(D.nodes.D_LLA_04 && !D.nodes.D_LLA_05 && !D.nodes.D_LLA_06);
  assert.equal(D.segments.D_LLA[3].length, 6, 'D_LLA は 5 歩');
  const spec = JSON.parse(rd('tools/ch4/routes/spec_C.json')); assert.equal(spec.segs.D_LLA[4], 5);
  const src = rd('js/chapter/world-driver.js');
  assert.match(src, /function alias\(m\) \{/); assert.match(src, /ensure\(S, m, rnd = Math\.random\) \{\n      alias\(m\);/); assert.match(src, /if \(r\.ch === CH\) alias\(m\);/);
  assert.match(rd('js/chapter/world-driver-ch4.js'), /nodeAlias: \{ C: \{ D_LLA_05: 'D_LLA_04', D_LLA_06: 'D_LLA_04' \} \}/);
});
