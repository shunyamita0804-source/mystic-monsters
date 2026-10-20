// =========================================================
// 2026-10-20 通し試遊の追加指示（全 Chapter の円の広場・門を仕上げる）
//  BD-01 Chapter 1（A＝原本 MMRF_DATA・B・C）・Chapter 3（A・B・C）の表示の配置（js/proto/board-display.js の MMRF_DISP.clearPlazas）：
//        ID・種類・区間・接続は原本と同じ（同じものを共有）・原本の座標は書き換えない・円の広場の隣の地点は広場の中から出る（残るのは短い枝だけ）・道の中の間隔は 15（または原本の最小）より詰めない
//  BD-02 本編の進行（MMWD・MMWD3 の dataOf）は表示の配置を返す・地点の ID と歩数（盤のつながり）は原本と同じ＝出来事の配置・サイコロの歩数・分岐・保存は変わらない
//  BD-03 Chapter 3 の門：START は円の広場の出口（along 20）・アーチの口が道幅より広い幅（START・下の門 46）／Chapter 2 の港の門は足もとの影つきの派生（門の画素は元の派生と同じ）・斜路の板は円の広場の中に敷かない
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
function load(files) { const w = {}; for (const f of files) new Function('window', 'module', rd(f))(w, undefined); return w; }
const DATA = ['js/proto/roadfirst-data.js', 'js/proto/roadfirst-routes.js', 'js/proto/ch3-routes.js', 'js/proto/board-display.js'];
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const PLAZA_R = 23 * 0.8, TILE_R = 13 / 2;   // js/proto/roadfirst-world.js：広場の縁石の外（ART.strip.w × 0.8）・マスの幅 tileW 13

test('BD-01：Chapter 1・3 の表示の配置＝座標だけ・広場の中に隣のマスを並べない', () => {
  const w = load(DATA), X = w.MMRF_DISP;
  const sets = { '1A': w.MMRF_DATA, '1B': w.MMRF_ROUTES.B, '1C': w.MMRF_ROUTES.C, '3A': w.MMRF_CH3.A, '3B': w.MMRF_CH3.B, '3C': w.MMRF_CH3.C };
  for (const [k, D0] of Object.entries(sets)) {
    const before = JSON.stringify(D0.nodes);
    const D = X.clearPlazas(D0);
    assert.equal(JSON.stringify(D0.nodes), before, `${k}：原本の座標は書き換えない`);
    assert.equal(X.clearPlazas(D0), D, `${k}：同じ原本には同じ写し`);
    assert.equal(X.sourceOf(D), D0);
    assert.equal(D.edges, D0.edges); assert.equal(D.segments, D0.segments);
    assert.deepEqual(Object.keys(D.nodes), Object.keys(D0.nodes), `${k}：地点の ID と並びは同じ`);
    for (const [id, n] of Object.entries(D.nodes)) assert.deepEqual(n.slice(2), D0.nodes[id].slice(2), `${k} ${id}：種類・区間は同じ`);
    assert.ok(D.display.moved >= 60, `${k}：動かした地点 ${D.display.moved}`);
    // 広場の隣の地点：広場（縁石の外＋マスの半分）の中に残るのは短い枝だけ（1 ルート 8 以下）
    const P = X.plazaIds(D), nb = {}; for (const e of D.edges) { (nb[e[0]] = nb[e[0]] || new Set()).add(e[1]); (nb[e[1]] = nb[e[1]] || new Set()).add(e[0]); }
    let inside = 0, inside0 = 0, total = 0;
    for (const h of P) for (const n of nb[h]) { if (P.has(n)) continue; total++; if (dist(D.nodes[n], D.nodes[h]) < PLAZA_R + TILE_R) inside++; if (dist(D0.nodes[n], D0.nodes[h]) < PLAZA_R + TILE_R) inside0++; }
    assert.ok(inside * 3 <= inside0, `${k}：広場の中の隣のマス ${inside0} → ${inside}（3分の1以下）`);
    assert.ok(inside <= 8, `${k}：広場の中に残る隣のマス ${inside}/${total}`);
    // 道の中の隣どうしの間隔：15（道の生成の下限）か原本のいちばん狭い間隔の小さいほうより詰めない
    let min0 = Infinity, min1 = Infinity;
    for (const s of Object.values(D.segments)) for (let i = 0; i < s[3].length - 1; i++) { min0 = Math.min(min0, dist(D0.nodes[s[3][i]], D0.nodes[s[3][i + 1]])); min1 = Math.min(min1, dist(D.nodes[s[3][i]], D.nodes[s[3][i + 1]])); }
    assert.ok(min1 >= Math.min(min0, 15) - 0.5, `${k}：最小の間隔 ${min1.toFixed(1)}（原本 ${min0.toFixed(1)}・道の生成の下限 15）`);
    // 動かした地点は元の道筋の近く（道の形は変わらない＝区間の元の折れ線から 3 単位以内）
    for (const s of Object.values(D.segments)) {
      const line = s[3].map((id) => D0.nodes[id]);
      for (const id of s[3]) {
        const p = D.nodes[id]; let best = Infinity;
        for (let i = 0; i < line.length - 1; i++) { const a = line[i], b = line[i + 1], L2 = (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2 || 1, t = Math.max(0, Math.min(1, ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / L2)); best = Math.min(best, dist(p, [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])])); }
        if (best > 3) { const ch = Object.values(D.segments).some((t) => t !== s && t[3].includes(id)); assert.ok(ch, `${k} ${id}：元の道筋から ${best.toFixed(1)} 離れた`); }
      }
    }
  }
});

test('BD-02：本編の進行（MMWD・MMWD3）は表示の配置を返し、盤のつながりは原本と同じ', () => {
  const FILES = ['js/phase7/progression.js', 'js/phase8/league.js', 'js/phase8/raising.js', 'js/phase10/monsters.js', 'js/phase9/chapters.js', 'js/chapter/engine.js', 'js/chapter/configs/ch1a.js', 'js/chapter/configs/ch2a.js',
    'js/proto/roadfirst-data.js', 'js/proto/roadfirst-routes.js', 'js/proto/ch3-routes.js', 'js/proto/board-display.js', 'js/proto/roadfirst-core.js', 'js/proto/roadfirst-play.js', 'js/proto/ch2-routes.js', 'js/chapter/world-driver.js',
    'js/chapter/event-themes.js', 'js/chapter/world-driver-ch2.js', 'js/chapter/world-driver-ch3.js', 'js/proto/ch4-routes.js', 'js/chapter/world-driver-ch4.js', 'js/items/food.js'];
  const w = load(FILES);
  for (const [W, raw] of [[w.MMWD, { A: w.MMRF_DATA, B: w.MMRF_ROUTES.B, C: w.MMRF_ROUTES.C }], [w.MMWD3, w.MMRF_CH3]]) {
    for (const r of ['A', 'B', 'C']) {
      const m = { raise: { ch: W === w.MMWD ? 1 : 3, state: 'board', field: { world: 1, chapterId: W === w.MMWD ? 1 : 3, route: r } } };
      const D = W.dataOf(m);
      assert.ok(D && D.display, `${r}：表示の配置`);
      assert.equal(w.MMRF_DISP.sourceOf(D), raw[r], `${r}：原本の写し`);
      // 進行（MMRF_CORE）・マスの配置（MMRF_PLAY.layout）は原本と表示の配置で同じ（座標を使わない）＝出来事の配置・サイコロの歩数・分岐が同じ
      const C = w.MMRF_CORE, P = w.MMRF_PLAY;
      for (const seed of [1, 7, 42]) {
        const a = C.simulate(raw[r], { seed }), b = C.simulate(D, { seed });
        assert.deepEqual([b.node, b.turn, b.done, b.timeUp, b.trail], [a.node, a.turn, a.done, a.timeUp, a.trail], `${r} seed ${seed}：進行`);
        assert.deepEqual(P.layout(D, seed, { route: r, bias: true, ch: m.raise.ch }), P.layout(raw[r], seed, { route: r, bias: true, ch: m.raise.ch }), `${r} seed ${seed}：マスの配置`);
      }
    }
  }
  const src = rd('js/chapter/world-driver.js');
  assert.match(src, /const dataOf = cfg\.dataOf \|\| \(\(k\) => disp\(/, 'Chapter 1 の dataOf だけ表示の配置（Chapter 2／4 は道の生成で同じ規則）');
  assert.match(rd('js/chapter/world-driver-ch3.js'), /MMRF_DISP\.clearPlazas\(d\)/);
  assert.match(rd('index.html'), /<script src="\.\/js\/proto\/board-display\.js"><\/script><script src="\.\/js\/proto\/roadfirst-core\.js">/);
});

test('BD-03：Chapter 3 の門の幅と位置・Chapter 2 の港の門の足もとの影', () => {
  const w = load(['js/proto/ch3-routes.js']);
  for (const r of ['A', 'B', 'C']) {
    const L = w.MMRF_CH3[r].art.landmarks, st = L.find((x) => x.node === 'START'), lo = L.find((x) => x.node === 'LOWER_GATE');
    assert.equal(st.along, 20, `${r}：START の門は円の広場（半径 ${PLAZA_R.toFixed(1)}）の出口`); assert.ok(st.along > PLAZA_R);
    for (const g of [st, lo]) assert.ok(g.w * 0.55 > 23 + 1, `${r} ${g.node}：アーチの口 ${(g.w * 0.55).toFixed(1)}＞道幅 23`);
  }
  assert.match(rd('tools/ch3/build_ch3_routes.py'), /'node': 'START', 'file': SKY \+ 'C3_ARCH_white_bridge_arch_pier\.webp', 'w': 46, 'along': 20/);
  assert.ok(existsSync(path.join(ROOT, 'assets/fields/ch2/art_1020/harbor_start_gate_open_foot.webp')));
  const cw = rd('js/proto/ch2-world.js');
  // 2026-10-20 道路美術 P0：折り返しの派生（art_1019・art_1020）は使わない＝正式の原画 harbor_start_gate をそのまま START の広場の左脇（道の外）に置く（A／B／C 同じ）
  assert.ok(!/art_10(19|20)\/harbor_start_gate/.test(cw.replace(/^\s*\/\/.*$/gm, '')), '派生の門を読まない（コメントを除く）');
  assert.match(cw, /START: \['harbor_start_gate', 52, 4, null, null, -42, 'S01_01', -30\]/);
  assert.ok(!/S01_02: \[/.test(cw), 'C の S01_02 の門は外した');
  // 斜路（螺旋塔の上り坂・潮の塔の下り坂）の板は円の広場の中に敷かない。広場の一覧のキャッシュ（海面の道だけ）は斜路から作らない＝海底の分かれ目を海面の広場にしない
  assert.match(cw, /const inPl = \(q\) => Math\.abs\(q\[2\]\) < 1\.5 && PLs\.some/);
  assert.ok(!/plazaList\(D, Object\.entries\(D\.segments\)/.test(cw), '斜路は plazaList（キャッシュ）を呼ばない');
  // 分かれ目の塔は入ってくる向き（3 地点前から）の前 65° 以内だけ・通り過ぎた建物（足もとがモンスターより手前でモンスターの 30% 以上に重なる）は消す
  assert.match(cw, /\(cx \* ix \+ cy \* iy\) \/ il < 0\.42\) continue;/);
  const rw = rd('js/proto/roadfirst-world.js');
  assert.match(rw, /if \(!past && mr && c\.s >= 1 && q\.y > mr\[3\] \+ 4\)/);
  assert.match(rw, /ow \* oh > \(mr\[2\] - mr\[0\]\) \* \(mr\[3\] - mr\[1\]\) \* 0\.3/);
});

test('BD-04：Chapter 4 の円の広場（ぼかしの絵を使わない・縁石の円）・表示の配置・道しるべは分かれ道の手前の路肩', () => {
  const v = rd('js/proto/ch4-world.js');
  assert.ok(!/plaza_disc/.test(v.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*\*[\s\S]*?\*\//g, '')), 'C4_ROAD_03_CENTER_BLEND（ふちが白くぼける絵）を読まない');
  assert.match(v, /const PLAZA_RMAX = 21, PLAZA_RMIN = 16;/);
  assert.match(v, /function disc\(g, x, y, r, dirs, rp, curb\)/);
  assert.match(rd('js/chapter/world-driver-ch4.js'), /const DISP_OPT = \{ clear: 30, gap: 13, minD: 12 \};/);
  const w = load(['js/proto/ch4-routes.js', 'js/proto/board-display.js']), X = w.MMRF_DISP;
  for (const r of ['A', 'B', 'C']) {
    const D0 = w.MMRF_CH4[r], D = X.clearPlazas(D0, { clear: 30, gap: 13, minD: 12 });
    assert.deepEqual(Object.keys(D.nodes), Object.keys(D0.nodes)); assert.equal(D.edges, D0.edges);
    const P = X.plazaIds(D), nb = {}; for (const e of D.edges) { (nb[e[0]] = nb[e[0]] || new Set()).add(e[1]); (nb[e[1]] = nb[e[1]] || new Set()).add(e[0]); }
    let i0 = 0, i1 = 0; for (const h of P) for (const n of nb[h]) { if (P.has(n)) continue; if (dist(D0.nodes[n], D0.nodes[h]) < 25 + 6.5) i0++; if (dist(D.nodes[n], D.nodes[h]) < 21 + 6.5) i1++; }
    assert.ok(i1 * 1.5 < i0, `${r}：広場の中の隣のマス ${i0} → ${i1}`);
  }
  assert.match(rd('js/proto/roadfirst-world.js'), /const put = \(file, w, d, cls\) => \{ const s = \(cls === 'rfw-bpost' && \(approach\(id, n\) \|\| ahead\(id, n, d\)\)\) \|\| side\(n, d\);/);
});

test('BD-05：Chapter 3 の道（描画で作る白亜の帯）の縁石に側面（厚み）と金の線・Chapter 2 の広場の床は道の床と向きをそろえる', () => {
  const a = rd('js/qa/road-art-1017.js');
  assert.match(a, /const W = g\.canvas\.width, side = Math\.round\(h \* 0\.3\), top = h - side;/);
  assert.match(a, /const t = Math\.round\(224 \+/);
  const c = rd('js/proto/ch2-world.js');
  assert.match(c, /fp\.setTransform\(new root\.DOMMatrix\(\)\.translate\(o\[0\], o\[1\]\)\.rotate\(th0 \* 180 \/ Math\.PI\)/);
  assert.ok(!/const ao = g\.createRadialGradient\(x, y, r \* 0\.55, x, y, r - th\)/.test(c), '広場の床のふちの放射の陰はやめた');
});
