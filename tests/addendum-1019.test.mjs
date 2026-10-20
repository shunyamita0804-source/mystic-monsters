// =========================================================
// 2026-10-19 追加指令（巨大火山 4分割・旧混入の監査・Chapter ごとの分岐の見た目）
//  AD-01 巨大火山：4枚の原本の sha256・4つの重なり帯が全 RGBA で一致・各タイル＝復元した 2880×2880 のその位置・派生 2点（sha256 一致）・3072×3072 に並べていない
//  AD-02 Chapter 4 の目印＝Chapter 1 の目印（board_art_1010 の lm_*）を1枚も使わない（A／B／C）・目印の対応表（LM_SUB）が効いている（以前はコメントの中で効いていなかった）
//  AD-03 Chapter 2 の目印＝Chapter 2 の正式美術（art_1016）だけ
//  AD-04 分岐の見た目の差し替えの口：素材が無い（null）＝何も足さない・入れると道標＝自由な分かれ道（2）・分岐の印＝分かれ道（3）・合流の印（3）を道から離して立てる（Chapter 1〜4）
//  AD-05 巨大火山の置き場所：Chapter 4 の題字の中継・空の層・正門前（会場の門の奥）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const sha = (p) => createHash('sha256').update(readFileSync(path.join(ROOT, p))).digest('hex');
function load(files) { const w = {}; for (const f of files) new Function('window', 'module', rd(f))(w, undefined); return w; }

test('AD-01：巨大火山＝4枚の原本・重なりの一致・2880×2880 の復元・派生の sha256', () => {
  const J = JSON.parse(rd('tools/ch4art1019/derive_volcano.json'));
  assert.deepEqual(Object.fromEntries(Object.entries(J.originals).map(([k, v]) => [k, v.sha256])), {
    'C4_VOLCANO_TL_v2.png': '779d7395f1078f7a35205e4dfd7de423608bdb1d4acfb7bb3ab5090048c34a98', 'C4_VOLCANO_TR_v2.png': '67c82f4d92d46fea2a39a3bc936cc625bd510ac55abec2172d0306aff05ec478',
    'C4_VOLCANO_BL_v2.png': '2f6a5f3f35c46fe77dc55ffc2f3f85132e0e3389cf9f0f15c57ced497b0f68e2', 'C4_VOLCANO_BR_v2.png': 'c5ff542a570953eca13d7c0137c13f8943bc303cd8bff06dc5b6f5f38aa9d1f2' });
  assert.deepEqual(Object.fromEntries(Object.entries(J.originals).map(([k, v]) => [k, v.origin])), { 'C4_VOLCANO_TL_v2.png': [0, 0], 'C4_VOLCANO_TR_v2.png': [1344, 0], 'C4_VOLCANO_BL_v2.png': [0, 1344], 'C4_VOLCANO_BR_v2.png': [1344, 1344] });
  assert.deepEqual(J.seams_equal, { 'TL|TR': true, 'BL|BR': true, 'TL/BL': true, 'TR/BR': true }, '192px の重なり帯は全 RGBA で一致');
  assert.deepEqual(J.tiles_equal_master_crop, { TL: true, TR: true, BL: true, BR: true }, '各タイル＝復元したマスターのその位置の切り出し');
  assert.deepEqual(J.master.size, [2880, 2880], '3072×3072 ではない');
  const py = rd('tools/ch4art1019/derive_volcano.py');
  for (const s of ["'TL': ((0, 0, 1440, 1440), (0, 0))", "'TR': ((96, 0, 1536, 1440), (1440, 0))", "'BL': ((0, 96, 1440, 1536), (0, 1440))", "'BR': ((96, 96, 1536, 1536), (1440, 1440))"]) assert.ok(py.includes(s), s);
  for (const [f, v] of Object.entries(J.derived)) { assert.ok(existsSync(path.join(ROOT, 'assets/fields/ch4/art_1019', f)), f); assert.equal(sha('assets/fields/ch4/art_1019/' + f), v.sha256, f); }
  for (const f of Object.keys(J.originals)) assert.ok(!existsSync(path.join(ROOT, 'assets/fields/ch4/art_1019', f)), `原本 ${f} はリポジトリに置かない`);
  const md = rd('assets/fields/ch4/art_1019/README.md'); for (const f of Object.keys(J.derived)) assert.ok(md.includes(f), `README に ${f}`);
});

const W4 = () => load(['js/proto/ch4-routes.js', 'js/proto/ch4-world.js']);
test('AD-02：Chapter 4 の目印は Chapter 1 の目印を使わない（A／B／C）', () => {
  const w = W4(), V = w.MMRF_VOLC;
  for (const r of ['A', 'B', 'C']) {
    const L = V.lm(w.MMRF_CH4[r]);
    assert.ok(L.length >= 8, r);
    for (const x of L) assert.ok(/assets\/fields\/ch4\/art_1019\//.test(x.file) && !/lm_|board_art_1010/.test(x.file), `${r} ${x.node}：${x.file}`);
    for (const x of L) if (x.open) assert.ok(/art_1019\//.test(x.open), `${r} ${x.node} open：${x.open}`);
    assert.ok(!L.some((x) => ['START', 'LOWER_GATE', 'GOAL'].includes(x.node)), 'START・下の門（Chapter 1 の白い門）・GOAL は出さない');
  }
  const src = rd('js/proto/ch4-world.js');
  assert.ok(!/\/\/[^\n]*\.map\(\(L\) => \(LM_SUB/.test(src), 'LM_SUB の .map がコメントの中に入っていない');
});

test('AD-03：Chapter 2 の目印は Chapter 2 の正式美術（art_1016）だけ', () => {
  const w = load(['js/proto/ch2-routes.js', 'js/proto/ch2-world.js']), S = w.MMRF_SEA;
  for (const r of ['A', 'B', 'C']) for (const x of S.lm(w.MMRF_CH2[r])) assert.ok(/assets\/fields\/ch2\/art_10(16|19|20)\//.test(x.file) && !/board_art_1010|ch1a/.test(x.file), `${r} ${x.node}：${x.file}`);   // art_1019＝正式の港の門の正面向きの派生（2026-10-19 P0）・art_1020＝その植え込みと階段を切った派生（2026-10-20）
});

test('AD-04：分岐の見た目の差し替えの口（Chapter 1〜4・未採用は null＝何も足さない）', () => {
  const w = load(['js/proto/roadfirst-data.js', 'js/proto/roadfirst-routes.js', 'js/proto/ch2-routes.js', 'js/proto/ch3-routes.js', 'js/proto/ch4-routes.js', 'js/proto/roadfirst-world.js']);
  const W = w.MMRF_WORLD;
  const sets = { 1: w.MMRF_DATA, '1B': w.MMRF_ROUTES.B, 2: w.MMRF_CH2.A, 3: w.MMRF_CH3.A, 4: w.MMRF_CH4.A, '4B': w.MMRF_CH4.B, '4C': w.MMRF_CH4.C };
  for (const [k, D] of Object.entries(sets)) {
    assert.deepEqual(W.branchMarks(D, {}), [], `${k}：skin なし`);
    assert.deepEqual(W.branchMarks(D, { branchSkin: { junction: null, merge: null, post: null, board: null } }), [], `${k}：未採用（null）`);
    const out = W.branchMarks(D, { branchSkin: { junction: 'j.webp', merge: 'm.webp', post: 'p.webp' } });
    const n = (f) => out.filter((x) => x.file === f).length;
    //  2026-10-20 第4便：道標は地面の上だけ＝Chapter 2 A の H（まわりが海）は立てない
    assert.deepEqual([n('p.webp'), n('j.webp'), n('m.webp')], [k === '2' ? 1 : 2, 3, 3], `${k}：道標＝自由な分かれ道 2・分岐の印 3（運命の分かれ道を含む）・合流の印 3`);
    const lines = Object.values(D.segments).map((s) => s[3].map((id) => D.nodes[id]));
    const dist = (L, x, y) => { let m = 1e9; for (let i = 0; i < L.length - 1; i++) { const [ax, ay] = L[i], [bx, by] = L[i + 1], dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l)); m = Math.min(m, Math.hypot(ax + t * dx - x, ay + t * dy - y)); } return m; };
    for (const x of out) assert.ok(lines.every((L) => dist(L, x.x, x.y) >= 14), `${k} ${x.node}：道の上に立てない`);
  }
  const wb = rd('js/chapter/world-board.js');
  const m = /const BRANCH_SKIN = Object\.freeze\(\{([\s\S]*?)\}\);\n/.exec(wb); assert.ok(m);
  //  2026-10-20 第4便：道標は Chapter 1〜4 とも正面向きの正式素材（E02）。分岐の印・合流の印・選ぶ看板は未採用＝null
  for (const ch of [1, 2, 3, 4]) { assert.match(m[1], new RegExp(`${ch}: Object\\.freeze\\(\\{ junction: null, merge: null, post: FR \\+ 'ch${ch}_signpost_front\\.webp', postW: 18, postAh: [0-9.]+, board: null \\}\\)`), `Chapter ${ch} の道標`);
    assert.ok(existsSync(path.join(ROOT, `assets/fields/front_1020/ch${ch}_signpost_front.webp`))); }
  assert.match(wb, /const FR = '\.\/assets\/fields\/front_1020\/';/);
  assert.match(wb, /branchSkin: branchSkin\(m\)(, symbols: symbolsFor\(m\))? \}\);/, '盤を作るときに渡す（QA と本編は同じ）');
  assert.match(wb, /\.wbw \.wbbr\[data-bskin\] \.chroute\{background:var\(--wbbr-board\)/, '選ぶ看板の地の絵は CSS の変数（文字は HTML）');
  { const cw = rd('js/proto/ch4-world.js'), sc = cw.slice(cw.indexOf('function scatter('), cw.indexOf('function build3d(')).replace(/^\s*\/\/.*$/gm, ''); assert.ok(sc.length > 100 && !/signpost/.test(sc), 'Chapter 4 の道標は scatter から外した（二重に立てない）'); }
});

test('AD-05：巨大火山の置き場所＝題字の中継・空の層・正門前', () => {
  const wb = rd('js/chapter/world-board.js'), cw = rd('js/proto/ch4-world.js');
  assert.match(wb, /relayFg: A4 \+ 'volcano_1440\.webp'/);
  assert.match(wb, /class="wbr-fg" src="\$\{chi\(m\)\.relayFg\}"/);
  assert.match(wb, /gateBg: `url\(\$\{A4\}goal_gate\.webp\)[^`]*url\(\$\{A4\}volcano_720\.webp\)[^`]*url\(\$\{A4\}sky_night\.webp\)/, '門 → 火山 → 夜空の順（門が手前）');
  assert.match(cw, /<b style="background-image:url\(\$\{U\('volcano_1440'\)\}\)"><\/b>/, '空の層の地平');
  assert.ok(!/C4_VOLCANO_|volcano_3072|3072/.test(cw + wb), '3072 の並べ方や原本を直接読まない');
});
