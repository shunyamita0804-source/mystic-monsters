// =========================================================
// 本編の Chapter 2「潮風の海岸」＝1枚の世界のボード（2026-10-16・試遊ブランチ。js/chapter/world-driver-ch2.js の MMWD2）
//  CW-01 出発：Chapter 2 は新しい盤（サイコロ 1〜6・40ターン・ルート A／B／C を抽選・m.raise.field）・Chapter 1 は従来の MMWD・MM_QA_OLD_CH2 なら旧エンジン
//  CW-02 旧 Chapter 2 のセーブ（案1）：旧の盤（chapterId 2・world なし）を持つ個体は読み込み後も旧エンジン（1〜3・旧の配置のまま）。盤の無い個体は新しい盤
//  CW-03 通し（A／B／C 各 120回）：本物の流れでゴールか40ターンで終わる・ゴールまでにライバルは1回・道路データ不変・能力は 0〜999・保存→読み込みで同じ進み方
//  CW-04 中身：固定報酬は道のデータの rewards（【仮】）・出来事は Chapter 2 の eventPool・能力マスは Chapter 2 の成長量・名前は道のデータの names／places・?ch2route の固定は1回
//  CW-05 index.html の読み込み順・自動テストの既定（MM_QA_OLD_CH2）・Chapter 1 の MMWD は従来と同じ（STORY・handles）
//  CW-06 正式美術 68点（Part01〜03＋Part04A／04B の再送）：派生 68 枚・欠品 0・台帳の SHA-256・描画が名前で参照する絵はすべてある・再送の8点の使い道
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const FILES = ['js/phase7/progression.js', 'js/phase8/league.js', 'js/phase8/raising.js', 'js/phase10/monsters.js', 'js/phase9/chapters.js', 'js/chapter/engine.js', 'js/chapter/configs/ch1a.js', 'js/chapter/configs/ch2a.js',
  'js/proto/roadfirst-data.js', 'js/proto/roadfirst-routes.js', 'js/proto/roadfirst-core.js', 'js/proto/roadfirst-play.js', 'js/proto/ch2-routes.js', 'js/chapter/world-driver.js', 'js/chapter/world-driver-ch2.js'];
const SRC = Object.fromEntries(FILES.map((f) => [f, rd(f)]));
function load(pre = {}) {
  const w = { MM_CH2_NEW: true, ...pre };   // 2026-10-17：新しい盤は QA（?ch2trial・MM_CH2_NEW）のときだけ＝CW-07
  for (const f of FILES) new Function('window', 'module', SRC[f])(w, undefined);
  for (const c of w.MMP9C.CHAPTERS) w.MMP7.registerChapterBoard(c.no, c.track, { provisional: false });
  return w;
}
const lcg = (seed) => { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };
const SIX = ['li', 'po', 'in', 'hi', 'ev', 'de'];
/** Chapter 1 を終えてベースキャンプ（次は Chapter 2）にいる個体 → Chapter 2 へ出発 */
function setup(w, seed = 1, route = null) {
  const { MMP7: P7, MMP8: P8 } = w, S = P8.newSave();
  S.m = P8.initIndividual(S, { sp: 0, name: 'テスト', rk: 0, fa: 0, st: 0, li: 100, po: 100, in: 100, hi: 100, ev: 100, de: 100, sk: [0, 1, 2, 3], eq: [0, 1, 2, 3, -1, -1] });
  P7.ensureProg(S.m);
  Object.assign(S.m.raise, { state: 'farm', ch: 2, log: [{ ch: 1, reachedGoal: true, turnsUsed: 30 }], field: null, fatigue: 0 });
  if (route && w.MMWD2) w.MMWD2.setRoute(route);
  const r = P8.depart(S, S.m, lcg(seed)); assert.equal(r.ok, true, JSON.stringify(r)); assert.equal(r.key, 2);
  return S;
}
const store = (S) => ({ getItem: (k) => (k === 'mr4v6' ? JSON.stringify(S) : null), setItem() {}, removeItem() {} });
const reload = (w, S) => { const r = w.MMP8.loadFromStorage(store(S)); assert.equal(r.status, 'ok'); return r.S; };
function play(w, seed, route, every = 0) {
  const { MMP8: P8, MMWD2: WD } = w, rnd = lcg(seed * 7 + 3);
  let S = setup(w, seed, route), m = S.m;
  const seen = { rival: 0, stat: 0, reward: 0, branch: 0, events: [] };
  for (let g = 0; g < 4000; g++) {
    if (every && g % every === 0) { S = reload(w, S); m = S.m; }
    P8.ensureBoardPosition(S, m);
    const ph = P8.boardPhase(m);
    if (ph === 'goal' || ph === 'timeup') return { S, m, ph, seen };
    if (ph === 'roll') { if (!P8.canRoll(m) || m.raise.fatigue >= 86) P8.rest(S, m); else P8.roll(S, m, rnd); }
    else if (ph === 'move') P8.step(S, m);
    else if (ph === 'branch') { seen.branch++; const o = WD.branchOptions(m); assert.ok(o.length >= 2); assert.equal(P8.chooseBranch(S, m, o[Math.floor(rnd() * o.length)].id).ok, true); }
    else if (ph === 'resolve') { const r = P8.resolveLanding(S, m, rnd); if (r.choice) assert.equal(P8.resolveChoice(S, m, r.fx.options[0].id, rnd).ok, true); if (r.fx.kind === 'stat') seen.stat++; if (r.fx.kind === 'reward') seen.reward++; if (r.fx.ev) seen.events.push(r.fx.ev); }
    else if (ph === 'battle') { if (m.raise.pend.fx.battleType === 'rival') seen.rival++; assert.equal(P8.skipBattleSquare(S, m).ok, true); }
    else throw new Error('想定外の局面 ' + ph);
  }
  throw new Error('終わらない seed=' + seed);
}

test('CW-01：Chapter 2 は新しい盤（1〜6・40ターン・ルート抽選）・Chapter 1 は従来・MM_QA_OLD_CH2 なら旧エンジン', () => {
  const w = load(), S = setup(w, 5), m = S.m, f = m.raise.field;
  assert.equal(w.MMP8.driverFor(1), w.MMWD.DRIVER); assert.equal(w.MMP8.driverFor(2, m), w.MMWD2.DRIVER);
  assert.equal(f.world, 1); assert.equal(f.chapterId, 2); assert.ok(['A', 'B', 'C'].includes(f.route)); assert.equal(f.visualPattern, f.route);
  assert.equal(m.raise.turnLimit, 40); assert.equal(w.MMP8.diceSides(m), 6); assert.equal(m.raise.node, 'START'); assert.ok(w.MMWD2.valid(f)); assert.equal(f.core.limit, 40);
  assert.equal(w.MMWD2.active(m), true); assert.equal(w.MMWD.active(m), false, 'Chapter 1 の進行は Chapter 2 の個体を担当しない');
  const cnt = { A: 0, B: 0, C: 0 }; for (let i = 0; i < 300; i++) cnt[setup(w, Math.imul(100 + i, 2654435761) >>> 0).m.raise.field.route]++;
  for (const k of 'ABC') assert.ok(cnt[k] > 70 && cnt[k] < 130, `ルートは各 1/3（${JSON.stringify(cnt)}）`);
  const o = load({ MM_QA_OLD_CH2: true }), So = setup(o, 5), mo = So.m;
  assert.equal(o.MMWD2.isAttached(), false); assert.equal(o.MMP8.driverFor(2, mo), o.MMCH.DRIVER); assert.equal(mo.raise.field.world, undefined); assert.equal(o.MMP8.diceSides(mo), 3);
});

test('CW-02：旧 Chapter 2 の盤を持つ個体は旧エンジンのまま・盤の無い個体は新しい盤', () => {
  const o = load({ MM_QA_OLD_CH2: true }), So = setup(o, 7), mo = So.m, rnd = lcg(9);
  for (let i = 0; i < 6; i++) { o.MMP8.ensureBoardPosition(So, mo); const ph = o.MMP8.boardPhase(mo); if (ph === 'roll') o.MMP8.roll(So, mo, rnd); else if (ph === 'move') o.MMP8.step(So, mo); else if (ph === 'resolve') o.MMP8.resolveLanding(So, mo, rnd); else if (ph === 'battle') o.MMP8.skipBattleSquare(So, mo); else if (ph === 'branch') o.MMP8.chooseBranch(So, mo, mo.raise.pend.opts[0]); }
  const before = JSON.stringify(mo.raise.field);
  const w = load(), S = reload(w, So), m = S.m;   // 新しいコード（Chapter 2 の盤あり）で読み込む
  assert.equal(w.MMWD2.oldBoard(m), true); assert.equal(w.MMP8.driverFor(2, m), w.MMCH.DRIVER, '旧の盤＝従来のエンジン'); assert.equal(w.MMWD2.active(m), false);
  w.MMP8.ensureBoardPosition(S, m); assert.equal(JSON.stringify(m.raise.field), before, '旧の盤・配置は書き換えない'); assert.equal(w.MMP8.diceSides(m), 3);
  for (let i = 0; i < 20; i++) { w.MMP8.ensureBoardPosition(S, m); const ph = w.MMP8.boardPhase(m); if (ph === 'roll') { if (w.MMP8.canRoll(m)) { const r = w.MMP8.roll(S, m, rnd); assert.ok(r.value >= 1 && r.value <= 3); } else w.MMP8.rest(S, m); } else if (ph === 'move') w.MMP8.step(S, m); else if (ph === 'resolve') w.MMP8.resolveLanding(S, m, rnd); else if (ph === 'battle') w.MMP8.skipBattleSquare(S, m); else if (ph === 'branch') w.MMP8.chooseBranch(S, m, m.raise.pend.opts[0]); }
  assert.equal(m.raise.field.world, undefined, '旧の盤のまま進む'); assert.equal(m.raise.field.chapterId, 2);
  const S2 = setup(w, 8); assert.equal(S2.m.raise.field.world, 1, '盤の無い個体は新しい盤');
});

test('CW-03：通し（A／B／C 各 120回）＝ゴールか40ターン・ライバル1回・道路データ不変・保存→読み込みで同じ', () => {
  const w = load(), H = (D) => createHash('sha256').update(JSON.stringify([D.nodes, D.edges, D.segments])).digest('hex');
  const H0 = Object.fromEntries('ABC'.split('').map((k) => [k, H(w.MMRF_CH2[k])]));
  for (const route of 'ABC') {
    let goal = 0;
    for (let seed = 1; seed <= 120; seed++) {
      const { m, ph, seen } = play(w, seed, route);
      assert.equal(m.raise.field.route, route); assert.ok(m.raise.turnsUsed <= 40);
      if (ph === 'goal') { goal++; assert.equal(m.raise.node, 'GOAL'); assert.equal(seen.rival, 1, 'ゴールまでにライバルは必ず1回'); }
      for (const k of SIX) assert.ok(m[k] >= 0 && m[k] <= 999);
    }
    assert.ok(goal > 40, `ルート ${route}：ゴールに着く回がある（${goal}/120）`);
    for (const seed of [4, 17]) { const a = play(w, seed, route), b = play(w, seed, route, 3);
      assert.deepEqual([b.m.raise.node, b.m.raise.turnsUsed, b.ph, b.m.raise.fatigue, ...SIX.map((k) => b.m[k])], [a.m.raise.node, a.m.raise.turnsUsed, a.ph, a.m.raise.fatigue, ...SIX.map((k) => a.m[k])], `${route} seed ${seed}`); }
  }
  for (const k of 'ABC') assert.equal(H(w.MMRF_CH2[k]), H0[k], `ルート ${k} の道路データは変わらない`);
  assert.deepEqual('ABC'.split('').map((k) => Object.keys(w.MMRF_CH2[k].nodes).length), [298, 284, 304]);
});

test('CW-04：報酬＝道のデータの rewards・出来事＝Chapter 2 の eventPool・成長量＝Chapter 2・名前＝道のデータ・?ch2route の固定は1回', () => {
  const w = load(), { MMP8: P8, MMP10M: M } = w;
  const S = setup(w, 21, 'A'), m = S.m, f = m.raise.field, D = w.MMRF_CH2.A;
  assert.equal(f.route, 'A'); assert.notEqual(setup(w, 22).m.raise.field.route, undefined);
  const at = (id) => { m.raise.node = id; f.core.node = id; m.raise.pend = { roll: 1, left: 0, stage: 'resolve' }; return P8.resolveLanding(S, m, () => 0.5); };
  const g0 = S.g, rw = at('L_CHEST'); assert.equal(rw.fx.kind, 'reward'); assert.equal(rw.fx.title, D.rewardTitles.L_CHEST); assert.equal(S.g - g0, D.rewards.L_CHEST.eff[0].gold);
  const statId = Object.keys(f.tiles).find((id) => f.tiles[id].t === 'stat'), k = f.tiles[statId].k, b = m[k];
  at(statId); assert.equal(m[k] - b, M.GROWTH_GAIN_BY_CH[2][M.growthOf(m, k)], 'Chapter 2 の成長量');
  const ids2 = new Set(w.MMCH.getConfig(2).eventPool.map((e) => e.id));
  const evIds = Object.values(f.tiles).filter((t) => t.t === 'event' || t.t === 'rest').map((t) => t.e).filter(Boolean);
  assert.ok(evIds.length > 10 && evIds.every((id) => ids2.has(id)), '出来事は Chapter 2 の eventPool から');
  assert.equal(w.MMWD2.placeOf('CHALLENGE', 'A'), D.places.CHALLENGE); assert.equal(w.MMWD2.routeName('EL01', 'A'), D.names.EL01);
  assert.equal(at('RIVAL').fx.battleType, 'rival');
});

test('CW-05：index.html の読み込み順・自動テストの既定・Chapter 1 の MMWD は従来どおり', () => {
  const html = rd('index.html'), i1 = html.indexOf('js/chapter/world-driver.js'), i2 = html.indexOf('js/chapter/world-driver-ch2.js'), i3 = html.indexOf('js/chapter/world-board.js'), ir = html.indexOf('js/proto/ch2-routes.js');
  assert.ok(ir > 0 && ir < i2 && i1 < i2 && i2 < i3, '道のデータ → Chapter 1 の進行 → Chapter 2 の進行 → 画面');
  assert.match(rd('tests/e2e/harness.mjs'), /MM_QA_OLD_CH2 = true/);
  const w = load(); assert.equal(w.MMWD.CH, 1); assert.equal(w.MMWD2.CH, 2); assert.ok(w.MMWD.STORY.length > w.MMWD2.STORY.length);
  assert.ok(w.MMWD2.STORY.every((e) => e.scope === 'save'), 'Chapter 2 の一言はチュートリアルだけ（Chapter 1 の景色の一言は出さない）');
  assert.equal(w.MMWD.DRIVER.handles(1), true); assert.equal(w.MMWD.DRIVER.handles(2), false);
});

test('CW-06：正式美術 68点の派生（欠品 0）・描画が参照する絵はすべてある・再送の8点の使い道', () => {
  const dir = 'assets/fields/ch2/art_1016', d = JSON.parse(rd(dir + '/derive.json'));
  assert.equal(d.assets.length, 68); assert.deepEqual(d.missing, []);
  assert.equal(new Set(d.assets.map((a) => a.name)).size, 68, '重複なし');
  for (const a of d.assets) {
    assert.match(a.sha256, /^[0-9a-f]{64}$/);
    assert.equal(createHash('sha256').update(readFileSync(path.join(ROOT, dir, a.out))).digest('hex'), a.out_sha256, a.out);
  }
  const have = new Set(d.assets.map((a) => a.out.replace(/\.webp$/, '')));
  const w = {}; new Function('window', 'module', rd('js/proto/ch2-routes.js') + '\n' + rd('js/proto/ch2-world.js'))(w, undefined);
  const S = w.MMRF_SEA;
  const names = [...Object.values(S.TEX).map((t) => t[0]), ...Object.values(S.STRIPS), ...S.PLAZA, ...S.ALL_LM];
  for (const n of names) assert.ok(/^\.\//.test(n) ? existsSync(path.join(ROOT, n)) : have.has(n), '派生がある：' + n);   // './' で始まる名前は art_1016 の外のファイル（2026-10-19 正面向きの港の門）
  // 再送の8点：欄干の左右（海面の帯）・分かれ目の塔（海上の自由な分かれ道）・泡（海中の光の層）・ふちの景物・ゾーン名札（Chapter 2 の題字）
  assert.equal(S.STRIPS.railL, 'sea_bridge_railing_left'); assert.equal(S.STRIPS.railR, 'sea_bridge_railing_right');
  // 2026-10-19 P0：分かれ目の塔は、道から約 26 単位離せる所がある分かれ道だけ（C は道が集まっていて置けない＝立てない。広場の真ん中に立たない）
  for (const r of ['A', 'B']) assert.ok(S.lm(w.MMRF_CH2[r]).some((L) => /sea_junction_tower/.test(L.file) && /free_fork/.test(w.MMRF_CH2[r].nodes[L.node][2])), r + ' 分かれ目の塔');
  for (const r of ['A', 'B', 'C']) { const D = w.MMRF_CH2[r], segs = Object.values(D.segments).map((sg) => sg[3].map((id) => D.nodes[id]));
    for (const L of S.lm(D).filter((x) => /sea_junction_tower/.test(x.file))) { const n = D.nodes[L.node], x = n[0] + L.off[0], y = n[1] + L.off[1];
      const near = segs.some((l) => l.some((p, i) => i && (() => { const a = l[i - 1], dx = p[0] - a[0], dy = p[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(a[0] + dx * t - x, a[1] + dy * t - y) < 26; })()));
      assert.ok(!near, r + ' 塔が道に近すぎない：' + L.node); } }
  const src = rd('js/proto/ch2-world.js');
  for (const n of ['undersea_bubble_light_fx', 'coral_shoal_edge', 'white_coastal_cliff_edge', 'undersea_cliff_edge']) assert.ok(src.includes(n), n);
  assert.match(rd('js/chapter/world-board.js'), /plate: A2 \+ 'sea_zone_nameplate\.webp'/);
  assert.ok(!src.includes("'shore_foam_edge'"), 'shore_foam_edge は波打ち際（E03）と同じ用途＝使わない');
});

test('CW-07（2026-10-18 v2：QA と通常本編は同一の正式ボード）：通常の URL の Chapter 2 も新しい盤・旧い盤の途中（1ターン以上）は旧いまま・0ターンの旧い盤は新しい盤へ', () => {
  const w = load({ location: { search: '' } }), S = setup(w);
  assert.equal(w.MMWD2.DRIVER.handles(2, S.m), true, '通常の URL＝新しい盤');
  const q = load({ location: { search: '?ch2trial=B' } }); assert.equal(q.MMWD2.DRIVER.handles(2, setup(q).m), true, '?ch2trial も同じ');
  const m = { raise: { field: { chapterId: 2, world: 1 } } }; assert.equal(w.MMWD2.DRIVER.handles(2, m), true, '新しい盤を持つ個体はそのまま');
  assert.equal(w.MMWD2.DRIVER.handles(2, { raise: { turnsUsed: 3, field: { chapterId: 2 } } }), false, '旧の盤の途中（1ターン以上）は旧のまま＝巻き戻さない');
  assert.equal(w.MMWD2.DRIVER.handles(2, { raise: { turnsUsed: 0, field: { chapterId: 2 } } }), true, '旧の盤でも0ターン（出発した直後）＝新しい盤の START（失う進み具合なし）');
  assert.equal(w.MMWD2.DRIVER.handles(2, { raise: { turnsUsed: 0, pend: { stage: 'move' }, field: { chapterId: 2 } } }), false, '途中の状態があれば旧のまま');
  const o = load({ MM_QA_OLD_CH2: true }); assert.equal(o.MMWD2.isAttached(), false, '自動テストの旧エンジン指定（MM_QA_OLD_CH2）');
  assert.doesNotMatch(rd('tests/e2e/harness.mjs'), /MM_CH2_NEW = true/, 'MM_CH2_NEW は要らない');
});
