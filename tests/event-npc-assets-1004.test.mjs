// =========================================================
// 第二段階・追加アセット（2026-10-04）：Chapter 1 のイベント挿絵 12枚と主要 NPC の表情 32枚（8人 × 4）
//  AS-01〜08。実物の MMCH・MMP8・MMNPC・MMNPCE を Node で動かす（画面は tests/qa-e2e-event-npc.test.mjs）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import { loadEngine, lcg } from './chapter-sim.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const j = (o) => JSON.parse(JSON.stringify(o));
const HTML = rd('index.html');
const STATS = ['li', 'po', 'in', 'hi', 'ev', 'de'];

/** WebP の大きさと透過の有無（VP8X／VP8／VP8L の見出しだけを読む） */
function webpInfo(p) {
  const b = readFileSync(path.join(ROOT, p));
  assert.equal(b.toString('ascii', 0, 4), 'RIFF', p); assert.equal(b.toString('ascii', 8, 12), 'WEBP', p);
  const c = b.toString('ascii', 12, 16);
  if (c === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3), alpha: !!(b[20] & 0x10) };
  if (c === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff, alpha: false };
  if (c === 'VP8L') { const v = b.readUInt32LE(21); return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1, alpha: !!((v >> 28) & 1) }; }
  throw new Error(`${p}：WebP の形式 ${c}`);
}
function load() {
  const E = loadEngine();
  for (const f of ['js/chapter/events.js', 'js/npc/npc-events.js', 'js/phase8/rival.js']) new Function('window', rd(f))(E.w);
  return { ...E, EV: E.w.MMEVT, NE: E.w.MMNPCE };
}
function loadNpc() { const ctx = { console }; ctx.window = ctx; vm.createContext(ctx); vm.runInContext(rd('js/npc/npc.js'), ctx); return ctx.MMNPC; }
function mon(P7, P8, S, st = 100) { const m = P8.initIndividual(S, { sp: 0, name: 'テスト', age: 0, span: 30, h: 0, rk: 0, fa: 0, st: 0, last: null, li: st, po: st, in: st, hi: st, ev: st, de: st, sk: [0, 1, 2, 3], eq: [0, 1, 2, 3, -1, -1] }); P7.ensureProg(m); return m; }
function onEvent(ev, seed = 7, fatigue = 30) {
  const E = load(), { P7, P8, CH } = E, S = P8.newSave(); S.m = mon(P7, P8, S); assert.equal(P8.depart(S, S.m, lcg(seed)).ok, true);
  const m = S.m, g = CH.graphFor(m), A = m.raise.field.nodeAssignments, id = g.order.find((x) => A[x] && A[x].t === 'event' && !A[x].recovery);
  A[id] = { t: 'event', tier: 'normal', ev }; m.raise.node = id; m.raise.pend = { roll: 1, left: 0, stage: 'resolve' }; m.raise.turnsUsed = 3; m.raise.fatigue = fatigue;
  return { ...E, S, m, id };
}
const snap = (m) => ({ ...Object.fromEntries(STATS.map((k) => [k, m[k]])), fat: m.raise.fatigue, gold: null, turns: m.raise.turnsUsed });

// ユーザー指定の対応（画像の番号 → 既存のイベント id）と、正式の効果
const MAP = [
  ['01_tailwind', 'tailwind', '草原の追い風', { ev: 5 }],
  ['02_spring_water', 'spring_water', '澄んだ湧き水', { fat: -15 }],
  ['03_old_grounds', 'old_grounds', '古い訓練跡', null],
  ['04_stone_tablet', 'stone_tablet', '風化した石碑', { in: 5 }],
  ['05_small_shrine', 'small_shrine', '小さな祠', { fat: -10 }],
  ['06_break_with_fina', 'break_with_fina', 'フィナとの休憩', { fat: -15 }],
  ['07_sudden_rain', 'sudden_rain', '突然の通り雨', null],
  ['08_beast_tracks', 'beast_tracks', '獣の足跡', { hi: 5 }],
  ['09_distant_cry', 'distant_cry', '風に乗る鳴き声', { in: 5 }],
  ['10_wild_flowers', 'wild_flowers', '野花の群生', { li: 5 }],
  ['11_traveler_trace', 'traveler_trace', '古い旅人の痕跡', { fat: -10 }],
  ['12_small_animal', 'small_animal', '小さな生き物に導かれる', { ev: 5 }],
];
const CHOICE = { old_grounds: { train: { po: 5, fat: 5 }, check: { hi: 5 } }, sudden_rain: { shelter: { fat: -10 }, go: { de: 5, fat: 5 } } };

test('AS-01：イベント挿絵 12枚：ファイルがあり（1080×720 の WebP）、ユーザー指定の id へ1枚ずつ（使い回しなし）。新しいイベントは足さず、挿絵の無い remember_dan・wind_cry なども残る（候補は減らない）', () => {
  const { CH, EV } = load(), pool = CH.getConfig(1).eventPool, byId = Object.fromEntries(pool.map((e) => [e.id, e]));
  assert.equal(pool.length, 24, 'eventPool の件数は追加前と同じ（24）'); assert.deepEqual(EV.validatePool(pool), []);
  const used = pool.filter((e) => e.image).map((e) => e.image);
  assert.equal(used.length, 12); assert.equal(new Set(used).size, 12, '1枚を複数のイベントに使わない');
  for (const [file, id, title] of MAP) {
    const p = `assets/events/ch1/${file}.webp`, e = byId[id];
    assert.ok(e, `${id}：既存の id`); assert.equal(e.image, `./${p}`, `${id} → ${file}`); assert.equal(e.title, title);
    assert.ok(existsSync(path.join(ROOT, p)), p); const w = webpInfo(p); assert.deepEqual([w.w, w.h], [1080, 720], p);
    assert.ok(statSync(path.join(ROOT, p)).size < 400 * 1024, `${p}：400KB 未満`);
    assert.ok(Array.isArray(e.lines) && e.lines.length === 2, `${id}：フィナの2行`); for (const l of e.lines) assert.ok(l.text && l.expression, id);
  }
  for (const id of ['remember_dan', 'wind_cry', 'shade', 'break', 'spring', 'holy_spring', 'herb', 'coin']) assert.ok(byId[id], `${id} は残す`);
  assert.ok(!byId.remember_dan.image && !byId.wind_cry.image, '挿絵の無いイベントは従来どおり');
  assert.match(rd('assets/events/ch1/README.md'), /01_tailwind\.webp \| tailwind/);
});

test('AS-02：正式の効果（選択肢なし）：止まったら決めた能力だけ +5、または疲れだけが減る。ほかの能力・所持金・ターンは変わらず、1回だけ（使った印・pend は消える）', () => {
  for (const [, id, , eff] of MAP) {
    if (!eff) continue;
    const E = onEvent(id), { P8, S, m } = E, b = snap(m), g0 = S.gold;
    const r = P8.resolveLanding(S, m, lcg(5)); assert.equal(r.ok, true, id); assert.ok(!r.choice, `${id}：選択肢なし`);
    const a = snap(m);
    for (const k of STATS) assert.equal(a[k] - b[k], eff[k] || 0, `${id}：${k}`);
    assert.equal(a.fat - b.fat, eff.fat || 0, `${id}：疲れ`); assert.equal(S.gold, g0, `${id}：所持金は変わらない`); assert.equal(a.turns, b.turns, `${id}：追加ターンなし`);
    assert.equal(m.raise.pend, null, id); assert.ok(m.raise.field.consumedEvents.includes(E.id), id);
    assert.equal(P8.resolveLanding(S, m, lcg(5)).ok, false, `${id}：もう一度は起きない（二重適用なし）`); assert.deepEqual(snap(m), a, id);
  }
});

test('AS-03：2択（古い訓練跡・突然の通り雨）：選ぶまで何も起きず、選んだ効果だけ1回。小さな祠は2択を外した（休憩だけ）。通り雨で追加ターンは無い', () => {
  const { CH } = load(), byId = Object.fromEntries(CH.getConfig(1).eventPool.map((e) => [e.id, e]));
  assert.equal(byId.small_shrine.choices, undefined, '小さな祠は選択肢なし'); assert.equal(byId.small_shrine.handler, 'fatigue');
  assert.deepEqual(byId.old_grounds.choices.map((c) => c.label), ['少し鍛える', '動きを確かめる']);
  assert.deepEqual(byId.sudden_rain.choices.map((c) => c.label), ['雨宿りする', 'このまま進む']);
  for (const [id, opts] of Object.entries(CHOICE)) for (const [opt, eff] of Object.entries(opts)) {
    const E = onEvent(id, 9, 30), { P8, S, m } = E, b = snap(m);
    const r = P8.resolveLanding(S, m, lcg(1)); assert.equal(r.choice, true, id); assert.deepEqual(snap(m), b, `${id}：選ぶ前は変わらない`);
    // 選ぶ前のセーブ → 読み込みでも同じ選択肢・二重に起きない
    const S2 = P8.migrateSave(j(S)); assert.equal(P8.resolveLanding(S2, S2.m, lcg(1)).fx.kind, 'choice'); assert.deepEqual(snap(S2.m), b);
    const c = P8.resolveChoice(S, m, opt, lcg(2)); assert.equal(c.ok, true, `${id}/${opt}`);
    const a = snap(m);
    for (const k of STATS) assert.equal(a[k] - b[k], eff[k] || 0, `${id}/${opt}：${k}`);
    assert.equal(a.fat - b.fat, eff.fat || 0, `${id}/${opt}：疲れ`); assert.equal(a.turns, b.turns, `${id}/${opt}：ターン`);
    assert.deepEqual(P8.resolveChoice(S, m, opt), { ok: false }, '二度は選べない'); assert.deepEqual(snap(m), a);
  }
});

test('AS-04：同じ Chapter で同じイベントは重複しない（挿絵つきの12種も含む）。12種は配置に現れる', () => {
  const { CH } = load(), cfg = CH.getConfig(1), seen = new Set();
  for (let s = 1; s <= 400; s++) {
    const ev = Object.values(CH.generateLayout(cfg, s).assign).filter((a) => a.t === 'event').map((a) => a.ev);
    assert.equal(new Set(ev).size, ev.length, `seed ${s}`); ev.forEach((x) => seen.add(x));
  }
  for (const [, id] of MAP) assert.ok(seen.has(id), `${id} は配置に現れる`);
});

test('AS-05：主要 NPC の表情 32枚（8人 × 4）：closeup（573×760）・full（縦 960）・face（256×256）の透過 WebP がそろい、README に元ファイルと sha256', () => {
  const M = loadNpc();
  const want = { karen: ['guide', 'welcome', 'think', 'sold'], dan: ['normal', 'cheer', 'caution', 'proud'], nick: ['normal', 'gentle', 'serious', 'impressed'], elliot: ['normal', 'smile', 'analyze', 'discover'], vargas: ['normal', 'grin', 'stern', 'acknowledge'], cedric: ['host', 'kickoff', 'tense', 'victory'], genshin: ['guide', 'fired', 'strict', 'approve'], shop: ['normal', 'smile', 'worry', 'recommend'] };
  assert.deepEqual(Object.keys(want).sort(), Object.keys(j(M.EXPR)).sort());
  let n = 0;
  for (const [id, keys] of Object.entries(want)) {
    assert.deepEqual([...M.EXPR[id]], keys, id);
    const readme = rd(`assets/npc/${id}/expr/README.md`);
    keys.forEach((k, i) => {
      for (const [view, dir, size] of [['closeup', 'closeup', [573, 760]], ['fullbody', 'full', null], ['face', 'face', [256, 256]]]) {
        const p = `assets/npc/${id}/expr/${dir}/0${i + 1}_${k}.webp`; assert.ok(existsSync(path.join(ROOT, p)), p);
        const w = webpInfo(p); assert.ok(w.alpha, `${p}：透過あり`); if (size) assert.deepEqual([w.w, w.h], size, p); else assert.equal(w.h, 960, p);
        assert.equal(M.srcOf(id, k, view), p, `${id}/${k}/${view}`);
      }
      assert.match(readme, new RegExp(`\\| ${k} \\| 0${i + 1}_.+\\.jpg \\| \`[0-9a-f]{16}…\``), `${id}/${k}：README`); n++;
    });
  }
  assert.equal(n, 32);
  assert.equal(M.get('shop').name, 'アイテム屋', 'おばあちゃんに名前を付けない');
  assert.equal(M.get('genshin').name, 'ゲンシン'); assert.notEqual(M.get('genshin').name, M.get('dan').name, 'ゲンシンとダンは別人');
});

test('AS-06：表情の切り替えはデータ：旧い表情名は新しい4種へ読み替え（EXPR_ALIAS）、場面ごとの表情（カレンの購入＝sold・ダンの帰還＝proud・ニックの売却＝serious・エリオットの合体＝analyze・ヴァルガス＝grin・セドリックの試合開始＝kickoff・ゲンシンの開始＝fired／終わり＝approve・アイテム屋の購入＝recommend）', () => {
  const M = loadNpc(), { NE } = load(), src = (id, ex, v = 'closeup') => M.imageOf(id, v, ex).src;
  assert.equal(src('karen', 'happy'), 'assets/npc/karen/expr/closeup/04_sold.webp', 'カレンの購入成功（KAREN_TALK の happy）＝04');
  assert.ok(/const KAREN_TALK=\{[\s\S]{0,4000}?expression:"happy"/.test(HTML), 'カレンの購入成功の行は happy');
  assert.ok(NE.RETURN[1].some((l) => l.npc === 'dan' && l.expression === 'proud'), 'ダンの帰還＝04 proud'); assert.equal(src('dan', 'proud'), 'assets/npc/dan/expr/closeup/04_proud.webp');
  assert.ok(/npcSrc\("nick",ft=="d"\?"serious"/.test(HTML), 'ニック：売却（大事な管理）＝03 serious');
  assert.ok(/elSay\(ELLIOT_TALK\.fuse,"analyze"\)/.test(HTML), 'エリオット：合体＝03 analyze');
  assert.ok(NE.first('arena').some((l) => l.npc === 'vargas' && l.expression === 'grin'), 'ヴァルガス：挑戦の受付＝02 grin');
  assert.ok(/p9Ced\(CEDRIC_TALK\.vs,"kickoff"\)/.test(HTML), 'セドリック：試合開始＝02 kickoff');
  assert.ok(/rs\.won\?"victory":"host"/.test(HTML), 'セドリック：勝者発表＝04 victory');
  assert.ok(/gsSay\(GENSHIN_TALK\.go\+\(GENSHIN_TALK\.start\[K\]\?`<span class="gsk">\$\{GENSHIN_TALK\.start\[K\]\}<\/span>`:""\),1,"fired"\)/.test(HTML), 'ゲンシン：特訓開始＝02'); assert.ok(/gsSay\(GENSHIN_TALK\.fin,1,"approve"\)/.test(HTML), 'ゲンシン：終わり＝04');
  assert.ok(HTML.includes('go:"よし。始めるぞ。焦るな。一つずつ確実に進めろ。"'), 'ゲンシンの開始の台本'); assert.ok(HTML.includes('fin:"よくやった。今の感覚を、忘れないことだ。"'), 'ゲンシンの終わりの台本');
  assert.equal(NE.REVISIT.shop.buy.expression, 'recommend', 'アイテム屋：購入＝04'); assert.equal(src('shop', 'recommend', 'fullbody'), 'assets/npc/shop/expr/full/04_recommend.webp');
  // 旧い表情名 → 新しい4種（無い表情は基本の表情。勝手に別の絵を参照しない）
  for (const [id, old, now] of [['karen', 'smile', 'welcome'], ['karen', 'troubled', 'think'], ['dan', 'smile', 'cheer'], ['nick', 'troubled', 'serious'], ['elliot', 'curious', 'discover'], ['vargas', 'approval', 'acknowledge'], ['cedric', 'happy', 'victory'], ['genshin', 'praise', 'approve']]) assert.equal(src(id, old), M.srcOf(id, now, 'closeup'), `${id}：${old} → ${now}`);
  assert.equal(src('cedric', 'nope'), M.srcOf('cedric', 'host', 'closeup'), '無い表情は基本の表情');
});

test('AS-07：初回の会話（特訓＝フィナ ↔ ゲンシン、アイテム屋＝フィナ ↔ おばあちゃん）と再訪の一言（アイテム屋は条件つきだけ・毎回は出さない）。記録は S.npcFlags.first の任意項目（セーブ形式は変えない）', () => {
  const { NE, P8 } = load();
  const tr = NE.first('train'); assert.deepEqual(tr.map((l) => [l.npc, l.expression]), [['fina', 'normal'], ['genshin', 'guide'], ['genshin', 'guide'], ['fina', 'normal']]);
  assert.equal(tr[1].text, '能力を伸ばすだけなら、道中でもできる。'); assert.equal(tr[2].text, 'ここで覚えるべきなのは、その子の力をどう引き出すかだ。');
  const sh = NE.first('shop'); assert.deepEqual(sh.map((l) => [l.npc, l.expression]), [['fina', 'normal'], ['shop', 'smile'], ['fina', 'normal']]);
  assert.equal(sh[1].text, 'いらっしゃい。旅に出るなら、無理をする前に準備しておきなさいね。');
  assert.equal(NE.REVISIT.shop.chance, 0, 'ふつうの一言は出さない（条件のときだけ）');
  assert.equal(NE.revisit('shop', { fatigue: 80 }, () => 0.5).expression, 'worry');
  assert.equal(NE.revisit('shop', { bag: 0, fatigue: 0 }, () => 0.5).expression, 'normal');
  assert.equal(NE.revisit('shop', { bag: 4, fatigue: 0 }, () => 0.5), null);
  const S = P8.newSave(); const S2 = P8.migrateSave(j({ ...S, npcFlags: { first: { train: 1, shop: 1 } } })); assert.deepEqual(S2.npcFlags.first, { train: 1, shop: 1 });
});

test('AS-08：先読み：起動時に NPC の画像を全部は読まない。施設に入ったときにその NPC の表情（npcWarm）、Chapter 1 の挿絵は field-view が少しずつ（evArtPreload）', () => {
  for (const [fn, id] of [['farm', 'nick'], ['museum', 'elliot'], ['fmScr', 'dan'], ['shopScr', 'shop']]) {
    const i = HTML.indexOf(`function ${fn}(`); assert.ok(i > 0, fn); assert.ok(new RegExp(`npcWarm\\("${id}"`).test(HTML.slice(i, i + 2500)), `${fn}：${id}`);
  }
  const fv = rd('js/chapter/field-view.js'); assert.match(fv, /function evArtPreload\(/); assert.match(fv, /evArtPreload\(m\)/);
  const npc = rd('js/npc/npc.js'); assert.match(npc, /function warm\(/);
  const tp = HTML.indexOf('function townPreload('); assert.ok(tp > 0); assert.ok(!/npcWarm\(|\.warm\(/.test(HTML.slice(tp, HTML.indexOf('\n', tp))), '街の先読みで NPC の表情をまとめて読まない');
  assert.equal((npc.match(/\bwarm\(/g) || []).length, 1, 'npc.js は読み込み時に warm を呼ばない（定義だけ）');
});
