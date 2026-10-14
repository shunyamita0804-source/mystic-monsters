// =========================================================
// 2026-10-14 Chapter 1 B／C（景観のパターン。js/proto/roadfirst-world.js の VISUAL・js/chapter/world-driver.js の visualPattern・index.html の出発準備の選択）
//  VP-01 A は従来のまま＝景物の配置（scatter）・川の景物・岩峰の出力がバイト単位で同じ（基準＝main 9ca90aa の sha256）
//  VP-02 B／C＝決まった配置（同じ出力）・A と違う・互いに違う・既存の素材だけ・道／マス／谷／目印／岩峰から離れる・B は小花と水辺が多く C は岩と石柱が多い
//  VP-03 進み方は共通＝同じ seed で A／B／C の配置（tiles・core）は同じ・本物の流れで最後まで進めた結果（能力・所持金・使ったマス・報酬・ターン・地点）が同じ
//  VP-04 セーブ互換＝visualPattern は配置の任意項目・無い／知らない値は A・出発の1回だけ読む（使ったら A へ戻す）・旧い配置の作り直しは A
//  VP-05 index.html＝出発準備の選択（Chapter 1 だけ・既定 A）・CSS で色を変えない
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
  'js/proto/roadfirst-data.js', 'js/proto/roadfirst-core.js', 'js/proto/roadfirst-play.js', 'js/chapter/world-driver.js'];
const SRC = Object.fromEntries(FILES.map((f) => [f, rd(f)]));
function load() { const w = {}; for (const f of FILES) new Function('window', SRC[f])(w); for (const c of w.MMP9C.CHAPTERS) w.MMP7.registerChapterBoard(c.no, c.track, { provisional: false }); return w; }
const lcg = (seed) => { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };
const SIX = ['li', 'po', 'in', 'hi', 'ev', 'de'];
function setup(w, seed, visual) {
  const { MMP7: P7, MMP8: P8, MMWD: WD } = w, S = P8.newSave();
  S.m = P8.initIndividual(S, { sp: 0, name: 'テスト', rk: 0, fa: 0, st: 0, li: 100, po: 100, in: 100, hi: 100, ev: 100, de: 100, sk: [0, 1, 2, 3], eq: [0, 1, 2, 3, -1, -1] });
  P7.ensureProg(S.m); if (visual !== undefined) WD.setVisual(visual);
  assert.equal(P8.depart(S, S.m, lcg(seed)).ok, true);
  return S;
}
/** 同じ乱数・同じ方針（分かれ道は乱数・2択は最初・バトルはやめておく・疲れ86以上なら休む）で最後まで */
function play(w, seed, visual) {
  const { MMP8: P8, MMWD: WD } = w, rnd = lcg(seed * 7 + 3), S = setup(w, seed, visual), m = S.m;
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

test('VP-03：進み方は共通＝同じ seed なら A／B／C の配置は同じ・本物の流れの結果（能力・所持金・使ったマス・報酬・ターン・地点・持ち物）が同じ', () => {
  const w = load();
  for (const seed of [1, 2, 3, 7, 11, 23, 42, 100]) {
    const R = {}; for (const v of ['A', 'B', 'C']) { const r = play(w, seed, v); R[v] = { ...snap(r.S, r.m), ph: r.ph, log: r.log, vp: r.m.raise.field.visualPattern }; }
    assert.equal(R.A.vp, 'A'); assert.equal(R.B.vp, 'B'); assert.equal(R.C.vp, 'C');
    for (const v of ['B', 'C']) { const { vp: _a, ...a } = R.A, { vp: _b, ...b } = R[v]; assert.deepEqual(b, a, `seed ${seed}：${v} の結果は A と同じ`); }
    assert.ok(R.A.turns >= 10 && Object.keys(R.A.used).length >= 3, `seed ${seed}：実際に進んでいる（${R.A.turns}ターン・${R.A.log.length}手）`);
  }
  // 配置そのもの（newField）も seed が同じなら同じ（visualPattern だけ違う）
  const { MMWD: WD } = w, fa = WD.newField(undefined, 12345, 'A'), fb = WD.newField(undefined, 12345, 'B'), fc = WD.newField(undefined, 12345, 'C');
  const strip = (f) => { const { visualPattern, ...r } = f; return r; };
  assert.deepEqual(strip(fb), strip(fa)); assert.deepEqual(strip(fc), strip(fa)); assert.deepEqual([fa.visualPattern, fb.visualPattern, fc.visualPattern], ['A', 'B', 'C']);
  assert.equal(fa.patternId, 'W', 'patternId は W のまま');
});

test('VP-04：セーブ互換＝visualPattern は配置の任意項目・無い／知らない値は A・出発の1回だけ読む・旧い配置の作り直しは A・ensure は配置を引き直さない', () => {
  const w = load(); const { MMP8: P8, MMWD: WD } = w;
  assert.deepEqual(WD.VISUALS, ['A', 'B', 'C']);
  assert.equal(WD.pendingVisual(), 'A'); assert.equal(WD.setVisual('C'), 'C'); assert.equal(WD.setVisual('x'), 'A'); assert.equal(WD.setVisual('B'), 'B');
  const S = setup(w, 5);   // 直前の setVisual('B') を出発の1回だけ読む
  assert.equal(S.m.raise.field.visualPattern, 'B'); assert.equal(WD.pendingVisual(), 'A', '使ったら A へ戻す'); assert.equal(WD.visualOf(S.m), 'B');
  assert.equal(WD.valid(S.m.raise.field), true);
  delete S.m.raise.field.visualPattern; assert.equal(WD.visualOf(S.m), 'A', '旧セーブ（項目なし）は A'); assert.equal(WD.valid(S.m.raise.field), true, '項目が無くても配置は有効');
  S.m.raise.field.visualPattern = 'Z'; assert.equal(WD.visualOf(S.m), 'A', '知らない値は A');
  S.m.raise.field.visualPattern = 'C';
  const r = P8.loadFromStorage({ getItem: (k) => (k === 'mr4v6' ? JSON.stringify(S) : null), setItem() {}, removeItem() {} });
  assert.equal(r.status, 'ok'); assert.equal(r.S.m.raise.field.visualPattern, 'C', '保存 → 読み込みで残る'); assert.equal(WD.visualOf(r.S.m), 'C');
  const before = JSON.stringify(r.S.m.raise.field); WD.setVisual('B'); P8.ensureBoardPosition(r.S, r.S.m);
  assert.equal(JSON.stringify(r.S.m.raise.field), before, 'ボードを開き直しても配置も景観も引き直さない'); WD.setVisual('A');
  assert.equal(WD.visualOf(null), 'A'); assert.equal(WD.visualOf({ raise: { field: null } }), 'A');
  // 旧い（壊れた）配置の作り直し（ensure）は A
  const S2 = setup(w, 6, 'C'); S2.m.raise.field = { world: 1, chapterId: 1, layoutSeed: 'bad' }; WD.setVisual('B'); P8.ensureBoardPosition(S2, S2.m);
  assert.equal(S2.m.raise.field.visualPattern, 'A', '作り直した配置は A（選んでいた景観を勝手に使わない）'); WD.setVisual('A');
  // 性能に関わる所は visualPattern を読まない
  const src = rd('js/chapter/world-driver.js'); assert.equal((src.match(/visualPattern/g) || []).length, 3, 'world-driver は保存・読み取り（visualOf）だけ');
  for (const f of ['js/proto/roadfirst-core.js', 'js/proto/roadfirst-play.js', 'js/phase8/raising.js', 'js/chapter/engine.js']) assert.doesNotMatch(rd(f), /visualPattern|VISUAL\b/, f + ' は景観を読まない');
});

test('VP-05：index.html＝出発準備の景色の選択（Chapter 1 だけ・既定 A・3つ）・world-board は配置の景観を渡す・色を変える CSS なし', () => {
  const H = rd('index.html');
  assert.match(H, /let PP_VISUAL="A";/); assert.match(H, /function ppVisualHtml\(nx,c\)\{if\(nx!=1\|\|!window\.MMWD/, 'Chapter 1 だけ');
  assert.match(H, /function ppVisual\(k\)\{if\(!window\.MMWD\|\|!MMWD\.VISUALS\.includes\(k\)\)return;PP_VISUAL=k;MMWD\.setVisual\(k\)/);
  assert.match(H, /<section class="ppcard"><div class="ppcin"><small>\$\{chNo\}<\/small><b>\$\{chName\|\|"ー"\}<\/b>\$\{art\}\$\{vis\}\$\{note\}/);
  const css = H.slice(H.indexOf('/* 2026-10-14 Chapter 1 B／C'), H.indexOf('@media (max-height:700px){.ppvb'));
  assert.doesNotMatch(css, /filter|hue-rotate|saturate/, '色を変えない');
  const WB = rd('js/chapter/world-board.js'); assert.match(WB, /visual: vis, skin: skinKey\(\) \}\);/); assert.match(WB, /MMWD\.visualOf\(m\)/);
  const RW = rd('js/proto/roadfirst-world.js'); assert.doesNotMatch(RW.slice(RW.indexOf('const VISUAL = {'), RW.indexOf('const visualOf')), /filter|hue|tint/, '景観は景物の混ぜ方と配置だけ');
});
