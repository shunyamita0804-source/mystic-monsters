// =========================================================
// 2026-10-14 Chapter 1 B／C（景観のパターン。js/proto/roadfirst-world.js の VISUAL・js/chapter/world-driver.js の visualPattern・index.html の出発準備の選択）
//  VP-01 A は従来のまま＝景物の配置（scatter）・川の景物・岩峰の出力がバイト単位で同じ（基準＝main 9ca90aa の sha256）
//  VP-02 B／C＝決まった配置（同じ出力）・A と違う・互いに違う・既存の素材だけ・道／マス／谷／目印／岩峰から離れる・B は小花と水辺が多く C は岩と石柱が多い
//  VP-03 B／C 独立ルート（2026-10-14 後半）＝出発で A／B／C を各 1/3 抽選・景観＝ルート・本物の流れで最後まで
//  VP-04 セーブ互換＝route は任意項目・無い／知らない値は A・再開で決め直さない・旧い配置の作り直しは A
//  VP-05 index.html＝選択ボタンは撤去・routes を読み込む
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEngine } from './chapter-sim.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const sha = (x) => createHash('sha256').update(JSON.stringify(x)).digest('hex');
loadEngine();
await import('../js/proto/roadfirst-data.js'); await import('../js/proto/roadfirst-core.js'); await import('../js/proto/roadfirst-play.js'); await import('../js/proto/roadfirst-world.js');
const D = globalThis.MMRF_DATA, Wd = globalThis.MMRF_WORLD;
const opt = (v) => Object.assign({}, Wd.DEF, { visual: v });
const segs = Object.values(D.segments).map((s) => s[3].map((n) => D.nodes[n]));
const dl = (l, x, y) => { let m = 1e9; for (let i = 0; i < l.length - 1; i++) { const a = l[i], b = l[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / L)); m = Math.min(m, Math.hypot(a[0] + dx * t - x, a[1] + dy * t - y)); } return m; };
const count = (list) => list.reduce((a, q) => { a[q.file] = (a[q.file] || 0) + 1; return a; }, {});

test('VP-01：A は従来のまま（景物の配置・川の景物・岩峰＝main 9ca90aa と同じ出力）', () => {
  assert.equal(Wd.DEF.visual, 'A', '既定は A');
  for (const o of [Object.assign({}, Wd.DEF), opt('A'), opt(undefined), opt('zzz')]) {
    const s = Wd.scatter(D, o), w = Wd.waterProps(D, o);
    assert.equal(s.length, 197); assert.equal(sha(s), '58a0ce1af9fb1661441d6412e6c7f290d32dff3946df415d549525d8497177ac', '景物の配置は従来と同じ');
    assert.equal(w.length, 25); assert.equal(sha(w), '571af4e562322896c832f9b0fdd609f043d65b0018426998e4161825e2dbf3c0', '川の景物は従来と同じ');
    assert.deepEqual(Wd.peaksOf(D, o), Wd.ART.peaks.at, '岩峰は従来の8つ');
  }
  assert.deepEqual(Wd.waterProps(D), Wd.waterProps(D, opt('A')), '引数なしも A');
  assert.equal(Wd.VISUAL.A.props, Wd.ART.props, 'A の割合は ART.props そのもの');
  assert.equal(Wd.VISUAL.A.seed, 0x1010);
});

test('VP-02：B／C＝決まった配置・A と違う・既存の素材だけ・道／マス／谷／目印／岩峰から離れる・B は小花と水辺、C は岩と石柱が多い', () => {
  const out = {};
  for (const v of ['A', 'B', 'C']) {
    const o = opt(v), s = Wd.scatter(D, o), w = Wd.waterProps(D, o), pk = Wd.peaksOf(D, o);
    assert.deepEqual(Wd.scatter(D, o), s, v + '：決まった乱数'); assert.deepEqual(Wd.peaksOf(D, o), pk);
    assert.ok(Math.abs(Wd.VISUAL[v].props.reduce((a, p) => a + p.p, 0) - 1) < 1e-9, v + '：割合の合計 1');
    for (const f of new Set([...s.map((q) => q.file), ...w.map((q) => q.file), ...Wd.VISUAL[v].props.map((p) => p.file)])) assert.ok(existsSync(path.join(ROOT, 'assets/proto/board_art_1010', f)), v + ' ' + f);
    for (const q of s) {
      assert.ok(q.y >= 150, v + '：GOAL の会場のまわりに置かない');
      for (const n of Object.values(D.nodes)) assert.ok(Math.hypot(n[0] - q.x, n[1] - q.y) >= o.roadW / 2 + 9, `${v}：マスに近すぎる (${q.x | 0},${q.y | 0})`);
      assert.equal(Wd.inValley(D, q.x, q.y), null, v + '：谷の外');
      assert.ok(pk.every(([x, y, w0]) => Math.hypot(x - q.x, y - q.y) >= w0 * 0.6), v + '：岩峰のまわりに置かない');
      assert.ok(Wd.ART.landmarks.every((L) => { const at = Wd.landmarkAt(D, L); return !at || Math.hypot(at[0] - q.x, at[1] - q.y) >= L.w * 0.75; }), v + '：目印のまわりに置かない');
    }
    for (const [x, y, w0] of pk.slice(Wd.ART.peaks.at.length)) {   // C の追加の岩峰
      assert.ok(Math.min(...segs.map((l) => dl(l, x, y))) >= 92, `${v}：追加の岩峰 (${x},${y}) は道から離れる`);
      assert.equal(Wd.inValley(D, x, y), null); assert.ok(Wd.TERRAIN.every((T) => !pointIn(Wd.loopPoly(D, T), x, y)), '谷・雲海・森の外');
      assert.ok(w0 >= 44 && w0 <= 60 && x >= 40 && x <= 984 && y >= 170);
    }
    for (const q of w) assert.ok(segs.every((l) => dl(l, q.x, q.y) >= 24) || q.file === Wd.ART.water.fall.file, v + '：川の景物は石橋のまわりに置かない');
    out[v] = { s, w, pk, c: count(s) };
  }
  assert.notEqual(sha(out.B.s), sha(out.A.s)); assert.notEqual(sha(out.C.s), sha(out.A.s)); assert.notEqual(sha(out.B.s), sha(out.C.s));
  assert.ok(out.B.c['prop_flowers.webp'] > out.A.c['prop_flowers.webp'] * 1.5, 'B：小花が多い'); assert.ok(out.B.c['prop_reeds.webp'] >= 8, 'B：葦');
  assert.ok(out.B.w.length > out.A.w.length, 'B：川の景物（睡蓮・渓流の岩・葦）が密'); assert.deepEqual(out.B.pk, Wd.ART.peaks.at, 'B：岩峰は足さない');
  assert.ok(out.C.c['prop_rock.webp'] + out.C.c['prop_mossy_rock.webp'] + out.C.c['prop_pillar.webp'] + out.C.c['rock_pillar.webp'] + out.C.c['cliff_grass_chunk.webp'] > out.C.s.length * 0.55, 'C：岩・石柱・遺跡が過半');
  assert.equal(out.C.pk.length, Wd.ART.peaks.at.length + 7, 'C：岩峰を7つ足す'); assert.deepEqual(out.C.w, out.A.w, 'C：川の景物は A と同じ');
  assert.ok(out.C.c['prop_tree.webp'] + out.C.c['prop_conifer.webp'] > 20, 'C：草原の木も残す');
  for (const q of [...out.B.s, ...out.C.s]) assert.ok(q.w > 5 && q.w < 60, '景物の大きさ');
});
function pointIn(poly, x, y) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }

// ---- 進み方（本物の MMP8 の流れ）----
const FILES = ['js/phase7/progression.js', 'js/phase8/league.js', 'js/phase8/raising.js', 'js/phase10/monsters.js', 'js/phase9/chapters.js', 'js/chapter/engine.js', 'js/chapter/configs/ch1a.js', 'js/chapter/configs/ch2a.js',
  'js/proto/roadfirst-data.js', 'js/proto/roadfirst-routes.js', 'js/proto/roadfirst-core.js', 'js/proto/roadfirst-play.js', 'js/chapter/world-driver.js'];
const SRC = Object.fromEntries(FILES.map((f) => [f, rd(f)]));
function load() { const w = {}; for (const f of FILES) new Function('window', SRC[f])(w); for (const c of w.MMP9C.CHAPTERS) w.MMP7.registerChapterBoard(c.no, c.track, { provisional: false }); return w; }
const lcg = (seed) => { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };
const SIX = ['li', 'po', 'in', 'hi', 'ev', 'de'];
function setup(w, seed, route) {
  const { MMP7: P7, MMP8: P8, MMWD: WD } = w, S = P8.newSave();
  S.m = P8.initIndividual(S, { sp: 0, name: 'テスト', rk: 0, fa: 0, st: 0, li: 100, po: 100, in: 100, hi: 100, ev: 100, de: 100, sk: [0, 1, 2, 3], eq: [0, 1, 2, 3, -1, -1] });
  P7.ensureProg(S.m); if (route !== undefined) WD.setRoute(route);
  assert.equal(P8.depart(S, S.m, lcg(seed)).ok, true);
  return S;
}
/** 同じ乱数・同じ方針（分かれ道は乱数・2択は最初・バトルはやめておく・疲れ86以上なら休む）で最後まで */
function play(w, seed, route) {
  const { MMP8: P8, MMWD: WD } = w, rnd = lcg(seed * 7 + 3), S = setup(w, seed, route), m = S.m;
  const log = [];
  for (let g = 0; g < 3000; g++) {
    P8.ensureBoardPosition(S, m);
    const ph = P8.boardPhase(m);
    if (ph === 'goal' || ph === 'timeup') return { S, m, ph, log };
    if (ph === 'roll') { if (!P8.canRoll(m) || m.raise.fatigue >= 86) { P8.rest(S, m); log.push('rest'); } else log.push('roll' + P8.roll(S, m, rnd).value); }
    else if (ph === 'move') P8.step(S, m);
    else if (ph === 'branch') { const o = WD.branchOptions(m); const r = P8.chooseBranch(S, m, o[Math.floor(rnd() * o.length)].id); assert.equal(r.ok, true); log.push('br'); }
    else if (ph === 'resolve') { const r = P8.resolveLanding(S, m, rnd); if (r.choice) assert.equal(P8.resolveChoice(S, m, r.fx.options[0].id, rnd).ok, true); log.push(r.fx.kind); }
    else if (ph === 'battle') { assert.equal(P8.skipBattleSquare(S, m).ok, true); log.push('bt'); }
    else throw new Error('想定外の局面 ' + ph);
  }
  throw new Error('終わらない seed=' + seed);
}
const snap = (S, m) => ({ st: Object.fromEntries(SIX.map((k) => [k, m[k]])), g: S.g, fat: m.raise.fatigue, used: m.raise.field.used, claimed: m.raise.field.claimed, rival: m.raise.field.rivalMet,
  turns: m.raise.turnsUsed, node: m.raise.node, trail: m.raise.field.core.trail, tiles: m.raise.field.tiles, seed: m.raise.field.layoutSeed, bag: S.inv.bag });

test('VP-03：B／C 独立ルート＝出発で A／B／C を各 1/3 で抽選・景観はルートと同じ・本物の流れで最後まで進む・同じ seed でも B／C の道は A と違う', () => {
  const w = load(), { MMWD: WD, MMP8: P8 } = w;
  const n = { A: 0, B: 0, C: 0 };
  const mb = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  for (let seed = 1; seed <= 600; seed++) { const S = w.MMP8.newSave(); S.m = w.MMP8.initIndividual(S, { sp: 0, name: 'テスト', rk: 0, fa: 0, st: 0, li: 100, po: 100, in: 100, hi: 100, ev: 100, de: 100, sk: [0, 1, 2, 3], eq: [0, 1, 2, 3, -1, -1] });
    w.MMP7.ensureProg(S.m); assert.equal(w.MMP8.depart(S, S.m, mb(seed)).ok, true); const f = S.m.raise.field; n[f.route]++; assert.equal(f.visualPattern, f.route, '景観＝ルート'); assert.equal(f.patternId, 'W'); }
  for (const k of ['A', 'B', 'C']) assert.ok(n[k] > 160 && n[k] < 240, `${k} が約 1/3（${n[k]}／600）`);
  for (const seed of [1, 2, 3, 7, 11, 23]) for (const r of ['B', 'C']) {
    const x = play(w, seed, r); assert.equal(x.m.raise.field.route, r); assert.ok(['goal', 'timeup'].includes(x.ph), `${r} seed ${seed}：最後まで（${x.ph}）`);
    assert.ok(x.m.raise.field.core.trail.every((id) => WD.routeData(r).nodes[id]), `${r}：通った地点はすべて ${r} の道`);
    if (x.ph === 'goal') assert.ok(x.m.raise.field.core.trail.includes('RIVAL'), 'ライバルを通る');
  }
  // 同じ seed で作った配置：B／C は A と別の道（接続の地点 ID が違う）・固定の地点 ID は同じ
  const fa = WD.newField(undefined, 12345, 'A'), fb = WD.newField(undefined, 12345, 'B'), fc = WD.newField(undefined, 12345, 'C');
  assert.deepEqual([fa.route, fb.route, fc.route], ['A', 'B', 'C']);
  assert.ok(WD.routeData('B').nodes.C05_09 && !WD.routeData('A').nodes.C05_09, 'B の接続の地点は A に無い');
  for (const id of ['START', 'GOAL', 'RIVAL', 'H', 'J0', 'Q', 'L_CHEST', 'RANDOM_DEN']) assert.ok(WD.routeData('B').nodes[id] && WD.routeData('C').nodes[id], id);
});

test('VP-04：セーブ互換＝route は配置の任意項目・無い／知らない値は A（旧セーブは景観 B／C でも A の道のまま）・再開で決め直さない・旧い配置の作り直しは A', () => {
  const w = load(); const { MMP8: P8, MMWD: WD } = w;
  assert.deepEqual(WD.ROUTES, ['A', 'B', 'C']); assert.equal(WD.setRoute('C'), 'C'); assert.equal(WD.setRoute('x'), null);
  WD.setRoute('B'); const S = setup(w, 5);
  assert.equal(S.m.raise.field.route, 'B'); assert.equal(WD.routeOf(S.m), 'B'); assert.equal(WD.forcedRoute(), null, '固定は1回で戻す'); assert.equal(WD.valid(S.m.raise.field), true);
  assert.equal(WD.dataOf(S.m), WD.routeData('B'));
  const r = P8.loadFromStorage({ getItem: (k) => (k === 'mr4v6' ? JSON.stringify(S) : null), setItem() {}, removeItem() {} });
  assert.equal(r.status, 'ok'); assert.equal(r.S.m.raise.field.route, 'B', '保存 → 読み込みで残る');
  const before = JSON.stringify(r.S.m.raise.field); P8.ensureBoardPosition(r.S, r.S.m);
  assert.equal(JSON.stringify(r.S.m.raise.field), before, 'ボードを開き直しても道も配置も決め直さない');
  // 旧セーブ：route なし（景観 B で A の道を進んでいた個体）
  WD.setRoute('A'); const S1 = setup(w, 9); const f1 = S1.m.raise.field; delete f1.route; f1.visualPattern = 'B';
  assert.equal(WD.routeOf(S1.m), 'A'); assert.equal(WD.visualOf(S1.m), 'B'); assert.equal(WD.valid(f1), true); assert.equal(WD.dataOf(S1.m), w.MMRF_DATA, 'A の道');
  const b1 = JSON.stringify(f1); P8.ensureBoardPosition(S1, S1.m); assert.equal(JSON.stringify(S1.m.raise.field), b1, '旧セーブの配置はそのまま');
  f1.route = 'Z'; assert.equal(WD.routeOf(S1.m), 'A', '知らない値は A');
  // 旧い（壊れた）配置の作り直し（ensure）は A（ここでは抽選しない）
  for (let i = 0; i < 20; i++) { const S2 = setup(w, 30 + i); S2.m.raise.field = { world: 1, chapterId: 1, layoutSeed: 'bad' }; P8.ensureBoardPosition(S2, S2.m); assert.equal(S2.m.raise.field.route, 'A'); }
  // B の育成中の地点が A に無くても消えない（B のデータで確かめる）
  WD.setRoute('B'); const S3 = setup(w, 4); S3.m.raise.field.core.node = 'C05_09'; S3.m.raise.node = 'C05_09'; assert.equal(WD.valid(S3.m.raise.field), true);
  assert.equal(w.MMWD.DRIVER.sanitize(S3.m).raise.field != null, true, 'sanitize で消えない');
  for (const f of ['js/proto/roadfirst-core.js', 'js/phase8/raising.js', 'js/chapter/engine.js']) assert.doesNotMatch(rd(f), /visualPattern|MMRF_ROUTES/, f + ' はルート・景観を読まない');
});

test('VP-05：index.html＝出発準備の景色の選択ボタンは無い・routes を読み込む・world-board は配置の景観とルートのデータを渡す', () => {
  const H = rd('index.html');
  assert.doesNotMatch(H, /PP_VISUAL|ppVisualHtml|class="ppvis"|\.ppvb\{/, '選択ボタン・その CSS は無い');
  assert.match(H, /<b>\$\{chName\|\|"ー"\}<\/b>\$\{art\}\$\{note\}/);
  assert.match(H, /<script src="\.\/js\/proto\/roadfirst-data\.js"><\/script><script src="\.\/js\/proto\/roadfirst-routes\.js"><\/script>/);
  const WB = rd('js/chapter/world-board.js'); assert.match(WB, /visual: vis, skin: skinKey\(\) \}\);/); assert.match(WB, /W = WD\(m\), vis = W && W\.visualOf \? W\.visualOf\(m\) : 'A'/);   // 2026-10-16：Chapter 2 も同じ画面（WD(m)＝その個体の Chapter の進行） assert.match(WB, /MMRF_WORLD\.create\(V\.el\.querySelector\('\.wbv'\), D\(m\)/);
  const RW = rd('js/proto/roadfirst-world.js'); assert.doesNotMatch(RW.slice(RW.indexOf('const VISUAL = {'), RW.indexOf('const visualOf')), /filter|hue|tint/, '景観は景物の混ぜ方と配置だけ');
});
