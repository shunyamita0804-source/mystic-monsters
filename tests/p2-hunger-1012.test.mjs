// =========================================================
// P2：空腹と食事（2026-10-12。食事6種の値・価格・入荷は P2 試遊用の暫定値）
//  P2-01 食事6種のデータ（01・02・03・07・11・22。18 は入れない）・画像は assets/items/body_1012 の6枚だけ（PR #7 と同じファイル）・売値なし
//  P2-02 アイテム屋：入荷＝最高優勝ランク（最初から 01〜03・E 07・D 11・B 22）・未入荷は買えない・購入は保管庫・価格どおり・売れない
//  P2-03 食事の規則：バッグの中だけ・サイコロの前・1ターンに合計1個（種類を変えても・休んだあと／読み込み／再起動／Chapter をまたいでも抜け道なし）・
//        空腹 0 では食べない・空腹 100 でも食べて 99 以下ならサイコロを振れる・食べてもターンは使わない
//  P2-04 新人支援＝1000G＋ジャガイモ10個（1枠）・1回だけ・旧セーブの薬草は消さない・追加で配らない
//  P2-05 休む＝1ターン・空腹 −10（1枚の世界のボード・これまでのエンジン）。出目の増え方・バトル後 +5・Chapter 間 −50 は従来どおり
//  P2-06 言葉：画面の「疲れ」を「空腹」に（回復の出来事9種・チュートリアル・HUD・操作欄）。出来事の数値・重み・挿絵は変えない
//  P2-07 操作欄の画像：原本 deck_start.webp はそのまま・派生 deck_start_hunger.webp（焼き込みの「疲れ -30」を空欄）＋HTML の「空腹 −10」
//  P2-08 ソラモ以外（ガウル・ジオル）でも：Chapter 1（1枚の世界）で食べる → 保存・読み込み → Chapter 2 へ（印は消える・−50）→ 食べる
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const HTML = rd('index.html');
const fnOf = (name) => { const i = HTML.indexOf(`function ${name}(`); assert.ok(i > 0, name); return HTML.slice(i, HTML.indexOf('\nfunction ', i + 10)); };
const FILES = ['js/phase7/progression.js', 'js/phase8/league.js', 'js/phase8/raising.js', 'js/phase10/monsters.js', 'js/phase9/chapters.js', 'js/chapter/engine.js', 'js/items/food.js',
  'js/chapter/configs/ch1a.js', 'js/chapter/configs/ch2a.js', 'js/proto/roadfirst-data.js', 'js/proto/roadfirst-core.js', 'js/proto/roadfirst-play.js', 'js/chapter/world-driver.js'];
const SRC = Object.fromEntries(FILES.map((f) => [f, rd(f)]));
function load() {
  const w = {};
  for (const f of FILES) new Function('window', SRC[f])(w);
  for (const c of w.MMP9C.CHAPTERS) w.MMP7.registerChapterBoard(c.no, c.track, { provisional: false });
  w.MMP7.registerItem({ id: 'herb', name: '薬草' }); w.MMCH.registerFatigueItem('herb', { amount: 30 });   // index.html と同じ登録
  w.MMFOOD.install(w.MMP7, w.MMCH);
  return w;
}
const lcg = (seed) => { let s = seed >>> 0; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; };
const mon = (sp) => ({ sp, name: 'テスト', rk: 0, fa: 0, st: 0, li: 100, po: 100, in: 100, hi: 100, ev: 100, de: 100, sk: [0, 1, 2, 3], eq: [0, 1, 2, 3, -1, -1] });
function setup(w, sp = 0, seed = 1) {
  const { MMP7: P7, MMP8: P8 } = w, S = P8.newSave(); S.m = P8.initIndividual(S, mon(sp)); P7.ensureProg(S.m);
  assert.equal(P8.depart(S, S.m, lcg(seed)).ok, true); return S;
}
const store = (S) => ({ getItem: (k) => (k === 'mr4v6' ? JSON.stringify(S) : null), setItem() {}, removeItem() {} });
const reload = (w, S) => { const r = w.MMP8.loadFromStorage(store(S)); assert.equal(r.status, 'ok'); return r.S; };
const FOOD = [['01', 'potato', 'ジャガイモ', 10, 20, null], ['02', 'sweet_fruit', 'あまい果実', 18, 40, null], ['03', 'fresh_fish', '新鮮な魚', 28, 70, null],
  ['07', 'bone_meat', '骨付き肉', 40, 120, 'E'], ['11', 'nutrition_soup', '栄養スープ', 55, 220, 'D'], ['22', 'energy_charge', 'エネルギーチャージ', 80, 500, 'B']];

test('P2-01：食事6種（01・02・03・07・11・22）・18 は入れない・画像は body_1012 の6枚だけ・売値なし', () => {
  const w = load(), F = w.MMFOOD;
  assert.deepEqual(F.FOODS.map((f) => [f.no, f.id, f.name, f.hunger, f.price, f.unlock]), FOOD);
  assert.ok(F.FOODS.every((f) => f.provisional === true), 'P2 試遊用の暫定値の印');
  assert.equal(F.byId('berna_bento'), null, '18 ベルナの特製弁当は P2 の対象外');
  const dir = readdirSync(path.join(ROOT, 'assets/items/body_1012')).sort(), six = FOOD.map((f) => f[0] + '.webp');
  for (const f of six) assert.ok(dir.includes(f), f);
  if (!dir.includes('README.md')) assert.deepEqual(dir, six.sort(), 'P2 だけのときは6枚だけ（PR #7 の残り32枚・README は混ぜない。PR #7 と統合したあとは38枚＋README＝ITB-01 が見る）');
  for (const f of F.FOODS) { assert.equal(f.img, `./assets/items/body_1012/${f.no}.webp`); assert.ok(existsSync(path.join(ROOT, f.img))); const d = w.MMP7.getItemDef(f.id); assert.deepEqual([d.name, d.price, d.sellPrice, d.grade], [f.name, f.price, null, null], '等級・売値は決定待ち＝付けない'); }
  assert.deepEqual(w.MMP7.getShopCatalog(), FOOD.map((f) => f[1]));
  for (const f of F.FOODS) assert.deepEqual({ ...w.MMCH.fatigueItemEffect(f.id) }, { amount: f.hunger, food: true });
  assert.match(HTML, /<script src="\.\/js\/chapter\/engine\.js"><\/script>\n<!--[^\n]*-->\n<script src="\.\/js\/items\/food\.js"><\/script>/);
  assert.match(HTML, /const ITEM_ICON=Object\.freeze\(\{herb:"\.\/assets\/items\/herb\.webp",\.\.\.\(window\.MMFOOD\?MMFOOD\.icons\(\):\{\}\)\}\);/);
  assert.match(HTML, /if\(window\.MMFOOD\)MMFOOD\.install\(\);/);
});

test('P2-02：アイテム屋＝入荷は最高優勝ランク（最初から 01〜03・E 07・D 11・B 22）。未入荷は買えない・購入は保管庫・売れない', () => {
  const w = load(), { MMP7: P7, MMP8: P8 } = w, S = P8.newSave(); S.m = P8.initIndividual(S, mon(0)); P7.ensureProg(S.m); S.g = 5000;
  const open = () => FOOD.map((f) => P7.shopUnlocked(S, f[1]));
  assert.deepEqual(open(), [true, true, true, false, false, false]);
  assert.deepEqual(P7.shopBuy(S, 'bone_meat'), { ok: false, reason: 'locked' }); assert.equal(S.g, 5000);
  S.rankRec.cleared[0] = true; assert.deepEqual(open(), [true, true, true, true, false, false], 'E 優勝で骨付き肉');
  S.rankRec.cleared[1] = true; assert.deepEqual(open(), [true, true, true, true, true, false], 'D 優勝で栄養スープ');
  S.rankRec.cleared[2] = true; assert.deepEqual(open(), [true, true, true, true, true, false], 'C 優勝ではエネルギーチャージはまだ');
  S.rankRec.cleared[3] = true; assert.deepEqual(open(), [true, true, true, true, true, true], 'B 優勝でエネルギーチャージ');
  const S2 = P8.newSave(); S2.rankRec.cleared[1] = true; assert.equal(P7.shopUnlocked(S2, 'bone_meat'), true, 'D を先に優勝しても E の品は入荷（最高優勝ランク）');
  assert.equal(P7.shopBuy(S, 'energy_charge').ok, true); assert.equal(P7.shopBuy(S, 'potato').ok, true); assert.equal(P7.shopBuy(S, 'potato').ok, true);
  assert.equal(S.g, 5000 - 500 - 40); assert.deepEqual(S.inv.vault, [{ id: 'energy_charge' }, { id: 'potato', n: 2 }]); assert.deepEqual(S.inv.bag, [], 'バッグには入らない（保管庫）');
  assert.deepEqual(P7.shopSell(S, 1), { ok: false, reason: 'no_price' }, '売値は決定待ち＝売れない'); assert.equal(P7.itemCount(S, 'potato'), 2);
  const sh = fnOf('shopScr'); assert.match(sh, /op=MMP7\.shopUnlocked\(S,id\)/); assert.match(sh, /MMFOOD\.unlockText\(id\)/); assert.match(sh, /空腹 −\$\{f\.hunger\}/);
  assert.match(HTML, /const P7_ERR=\{locked:"まだ入荷していません。",/);
});

test('P2-03：食事＝バッグの中だけ・1ターンに合計1個（抜け道なし）・空腹 0 では食べない・100 でも食べて 99 以下なら振れる・ターンは使わない', () => {
  const w = load(), { MMP7: P7, MMP8: P8, MMCH: CH } = w;
  let S = setup(w), m = S.m;
  P7.bagAdd(S, 'potato', 3); P7.bagAdd(S, 'sweet_fruit', 1); S.inv.vault = [{ id: 'fresh_fish', n: 5 }];
  m.raise.fatigue = 0; assert.equal(CH.useFatigueItem(S, m, 0).reason, 'full', '空腹 0 では食べない'); assert.equal(P7.itemCount(S, 'potato', 'bag'), 3);
  m.raise.fatigue = 100; assert.equal(P8.canRoll(m), false);
  const t0 = m.raise.turnsUsed, r = CH.useFatigueItem(S, m, 0);
  assert.deepEqual([r.ok, r.recovered, m.raise.fatigue, m.raise.turnsUsed], [true, 10, 90, t0], 'ターンは使わない');
  assert.equal(P8.canRoll(m), true, '100 から食べて 90＝振れる');
  assert.equal(CH.useFatigueItem(S, m, 1).reason, 'ate', '種類を変えても同じターンは1個まで'); assert.equal(CH.itemUseState(m).reason, 'ate');
  S = reload(w, S); m = S.m; assert.equal(CH.useFatigueItem(S, m, 1).reason, 'ate', '読み込み・再起動のあとも同じターンは食べられない');
  assert.equal(P8.rest(S, m).ok, true); assert.equal(m.raise.fatigue, 80, '休む −10');
  assert.equal(CH.useFatigueItem(S, m, 1).ok, true, '次のターン（休むで1ターン使った）は食べられる'); assert.equal(m.raise.fatigue, 62);
  assert.equal(CH.useFatigueItem(S, m, 0).reason, 'ate');
  assert.equal(P8.roll(S, m, lcg(5)).ok, true); assert.equal(CH.useFatigueItem(S, m, 0).reason, 'busy', '移動の途中は使えない');
  assert.deepEqual(S.inv.vault, [{ id: 'fresh_fish', n: 5 }], '保管庫の食べ物は冒険中に使えない（減らない）');
  const S3 = { inv: { bag: [], vault: [{ id: 'potato' }] } }, m3 = { raise: { fatigue: 50, ch: 1, turnsUsed: 0 } };
  assert.equal(CH.useFatigueItem(S3, m3, 0).ok, false, 'バッグに無ければ使えない');
  // 画面：食べられないときは理由を出してボタンを押せない（world-board・field-view で共通）
  for (const f of ['js/chapter/world-board.js', 'js/chapter/field-view.js']) { const s = rd(f); assert.match(s, /itemUseState\(m\)/, f); assert.match(s, /ITEM_WHY\[st\.reason\]/, f); assert.match(s, /ITEM_WHY\[r\.reason\]/, f); }
  assert.match(rd('js/phase8/raising.js'), /delete m\.raise\.ate;/, '出発で印を消す');
});

test('P2-04：新人支援＝1000G＋ジャガイモ10個（1枠）・1回だけ・旧セーブの薬草は消さない・追加で配らない', () => {
  const w = load(), { MMP7: P7, MMP8: P8 } = w;
  const g = fnOf('grantSupport'), mk = (S) => (S.npcFlags = S.npcFlags || {}, new Function('S', 'finaFlags', 'MMP7', 'save', 'SUPPORT', `let SUPPORT_TO="bag";${g}\nreturn ()=>[grantSupport(),SUPPORT_TO];`)(S, () => S.npcFlags, P7, () => {}, w.MMFOOD.SUPPORT));
  const S = P8.newSave(); S.g = 0; const run = mk(S);
  assert.deepEqual(run(), [true, 'bag']); assert.deepEqual([S.g, S.inv.bag], [1000, [{ id: 'potato', n: 10 }]], '2枠のうち1枠');
  assert.deepEqual(run(), [false, 'bag'], '2回目は受け取らない'); assert.equal(P7.itemCount(S, 'potato'), 10); assert.equal(P7.itemCount(S, 'herb'), 0, '薬草は配らない');
  const O = P8.newSave(); O.npcFlags = { support: 1 }; O.inv.bag = [{ id: 'herb' }];
  const o2 = reload(w, O); assert.deepEqual(o2.inv.bag, [{ id: 'herb' }], '旧セーブの薬草はそのまま'); assert.deepEqual(mk(o2)(), [false, 'bag'], '受け取り済みの旧セーブに追加で配らない');
  const F = P8.newSave(); F.inv.bag = [{ id: 'a' }, { id: 'b' }]; assert.deepEqual(mk(F)(), [true, 'vault']); assert.deepEqual(F.inv.vault, [{ id: 'potato', n: 10 }], 'バッグが埋まっていれば保管庫へ（数を失わない）');
  assert.match(HTML, /ジャガイモ×10を手に入れた/); assert.doesNotMatch(HTML.slice(HTML.indexOf('support:n=>'), HTML.indexOf('support:n=>') + 900), /薬草/, '支援の会話に薬草は出さない');
});

test('P2-05：休む＝1ターン・空腹 −10（1枚の世界・これまでのエンジン）。出目の増え方・バトル後 +5・Chapter 間 −50 は従来どおり', () => {
  const w = load(), { MMP8: P8, MMCH: CH, MMRF_PLAY: RP } = w;
  assert.equal(RP.TUNING.restAmount, 10); assert.equal(CH.rulesOf(CH.getConfig(2)).fatigueRules.rest, 10); assert.equal(CH.rulesOf(CH.getConfig(1)).fatigueRules.rest, 10);
  assert.deepEqual({ ...RP.TUNING.fatigueByDie }, { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7 }); assert.equal(RP.TUNING.wildFatigue, 5);
  assert.deepEqual({ ...CH.rulesOf(CH.getConfig(2)).fatigueRules.roll }, { 1: 3, 2: 5, 3: 7 }); assert.equal(CH.rulesOf(CH.getConfig(2)).fatigueRules.battle, 5); assert.equal(CH.rulesOf(CH.getConfig(2)).fatigueRules.carry, 50);
  const S = setup(w), m = S.m; m.raise.fatigue = 57; const t = m.raise.turnsUsed;
  assert.equal(P8.rest(S, m).ok, true); assert.deepEqual([m.raise.fatigue, m.raise.turnsUsed], [47, t + 1]);
});

test('P2-06：言葉＝画面の「疲れ」を「空腹」に。回復の出来事9種の数値・重み・挿絵は変えない', () => {
  const w = load(), C1 = w.MMCH.getConfig(1), C2 = w.MMCH.getConfig(2), ev = (c, id) => c.eventPool.find((e) => e.id === id);
  const keep = [['shade', 10, 4], ['break', 20, 3], ['spring', 30, 2], ['spring_water', 15, 3], ['break_with_fina', 15, 3], ['traveler_trace', 10, 3], ['small_shrine', 10, 2]];
  for (const [id, amt, wt] of keep) { const e = ev(C1, id); assert.deepEqual([e.handler, e.params.amount, e.weight], ['fatigue', amt, wt], id); assert.doesNotMatch(JSON.stringify(e), /疲れ/, id); }
  const hs = ev(C1, 'holy_spring'); assert.deepEqual([hs.params.full, hs.weight], [true, 1]); assert.match(hs.text, /空腹がすっかりおさまった/);
  const rain = ev(C1, 'sudden_rain'); assert.deepEqual(rain.choices.map((c) => [c.id, c.desc, c.params.amount]), [['shelter', '空腹−10', 10], ['go', '丈夫さ＋5・空腹＋5', 5]]);
  assert.equal(ev(C1, 'spring_water').image, './assets/events/ch1/02_spring_water.webp', '挿絵は同じ');
  for (const id of ['shade', 'break', 'spring', 'holy_spring']) { assert.doesNotMatch(JSON.stringify(ev(C2, id)), /疲れ/, `Chapter 2 ${id}`); assert.equal(ev(C2, id).weight, ev(C1, id).weight); }
  const strip = (s) => s.split('\n').filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).map((l) => l.replace(/\s{2,}\/\/ .*$/, '')).join('\n');
  for (const f of ['js/chapter/configs/ch1a.js', 'js/chapter/configs/ch2a.js', 'js/chapter/world-driver.js', 'js/npc/npc-events.js', 'js/chapter/reactions.js', 'js/chapter/world-board.js', 'js/chapter/field-view.js']) {
    const lits = strip(rd(f)).match(/(['`"])(?:(?!\1)[^\\\n]|\\.)*\1/g) || [];
    assert.deepEqual(lits.filter((s) => s.includes('疲れ')), [], `${f}：画面の文字に「疲れ」を出さない`);
  }
  for (const f of ['js/chapter/world-board.js', 'js/chapter/field-view.js']) assert.match(rd(f), /<span>空腹<\/span>/, `${f}：HUD`);
  assert.match(rd('js/chapter/world-driver.js'), /空腹が100になるとサイコロが振れなくなるから、アイテムで食べさせるか、操作欄の「休む」を使ってね。/);
});

test('P2-07：操作欄＝原本 deck_start.webp はそのまま・派生 deck_start_hunger.webp（「疲れ -30」を空欄）＋HTML の「空腹 −10」', () => {
  const w = load(), dk = w.MMCH.getConfig(1).deck;
  assert.equal(dk.start, './assets/fields/ch1a/ui/deck_start_hunger.webp');
  const sz = (p) => { const b = readFileSync(path.join(ROOT, p)); return [b.toString('ascii', 8, 12), b.toString('ascii', 12, 16)]; };
  assert.deepEqual(sz('assets/fields/ch1a/ui/deck_start.webp')[0], 'WEBP'); assert.ok(existsSync(path.join(ROOT, 'tools/p2/blank_deck_rest.py')));
  for (const f of ['js/chapter/world-board.js', 'js/chapter/field-view.js']) assert.match(rd(f), /<i class="chwlbl" aria-hidden="true">空腹 −\$\{/, f);
  assert.match(HTML, /\.chwing\.chwing-img \.chwlbl\{position:absolute;left:44%;width:27%;top:68%;height:19%;/);
});

test('P2-08：ソラモ以外（ガウル・ジオル）でも：Chapter 1 で食べる → 保存・読み込み → Chapter 2 へ（印は消える・−50）→ 食べる・アイテム屋で買い足す', () => {
  for (const sp of [1, 3]) {
    const w = load(), { MMP7: P7, MMP8: P8, MMCH: CH } = w;
    let S = setup(w, sp, 11 + sp), m = S.m; P7.bagAdd(S, 'potato', 10);
    m.raise.fatigue = 95; assert.equal(CH.useFatigueItem(S, m, 0).ok, true); assert.equal(m.raise.fatigue, 85);
    S = reload(w, S); m = S.m; assert.equal(m.raise.ate, `1:${m.raise.turnsUsed}`); assert.equal(P7.itemCount(S, 'potato', 'bag'), 9);
    m.raise.turnsUsed = 39; m.raise.field.core.turn = 39; assert.equal(P8.rest(S, m).timeUp, true); assert.equal(P8.endChapter(S, m).ok, true);
    assert.equal(P7.canAccessVault(S), true, 'Chapter の間はアイテム屋に行ける'); S.g = 100; assert.equal(P7.shopBuy(S, 'sweet_fruit').ok, true);
    assert.equal(P7.moveVaultToBag(S, 0).ok, true); assert.equal(P7.itemCount(S, 'sweet_fruit', 'bag'), 1);
    assert.equal(P8.depart(S, m, lcg(3)).ok, true); assert.equal(m.raise.ch, 2); assert.equal(m.raise.ate, undefined, '出発で印を消す'); assert.equal(m.raise.fatigue, 25, '75 → max(0, 75−50)');
    const bi = S.inv.bag.findIndex((it) => it.id === 'sweet_fruit'); assert.equal(CH.useFatigueItem(S, m, bi).ok, true); assert.equal(m.raise.fatigue, 7);
    S = reload(w, S); assert.equal(S.v, 6); assert.equal(S.m.raise.ate, '2:0');
  }
});
