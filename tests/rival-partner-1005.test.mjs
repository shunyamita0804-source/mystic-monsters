// 2026-10-05：ライバルの相棒レグナスの正式技10個・固有スキル「蒼銀の反撃」・技の演出（js/battle/rival-partner.js）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(import.meta.dirname, '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const HTML = rd('index.html');

function load() {
  const ctx = { console, Math: Object.create(Math), setTimeout: (f) => 0, Image: function () {}, matchMedia: () => ({ matches: false }) };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(rd('js/phase10/monsters.js'), ctx);
  vm.runInContext(rd('js/phase7/progression.js'), ctx);
  vm.runInContext('var SK=[];for(let i=0;i<20;i++)SK.push(["x"+i,.5,3,"#fff","*","a","","p",80,.05]);var EFF={3:[{tg:1,st:"atk",lv:-1,t:1}]};var SKART=new Array(20).fill("a.jpg");var IMG=["0","1","2","3"];var SP=[1,2];var SPECIAL_MOVES=new Set();var BPL=null;', ctx);
  vm.runInContext(rd('js/battle/rival-partner.js'), ctx);
  return ctx;
}

test('RP-01：正式技10個（SK の 20〜29）。威力・命中・クリティカル・種類・補助の効果（自分の命中／回避 小・2ターン）・必殺技（9・10）。竜眼ロックの表記', () => {
  const c = load(); assert.equal(c.MMRP.install(), true);
  const SK = c.SK, row = (k) => [SK[k][0], Math.round(SK[k][1] * 100), SK[k][8], Math.round(SK[k][9] * 100), SK[k][7]];
  assert.deepEqual(row(20), ['きりさく', 80, 90, 10, 'p']);
  assert.deepEqual(row(21), ['しっぽアタック', 90, 75, 10, 'p']);
  assert.deepEqual(row(24), ['ドラゴンクラッシュ', 110, 80, 15, 'p']);
  assert.deepEqual(row(25), ['蒼光ブレス', 105, 85, 10, 'i']);
  assert.deepEqual(row(26), ['スナイプファング', 95, 100, 10, 'p']);
  assert.deepEqual(row(27), ['幻影クロー', 90, 85, 35, 'p']);
  assert.deepEqual(row(28), ['蒼刃乱舞', 130, 90, 25, 'p']);
  assert.deepEqual(row(29), ['テイルサイクロン', 125, 95, 20, 'p']);
  assert.equal(SK[22][0], '竜眼ロック'); assert.equal(SK[22][1], 0); assert.equal(SK[23][0], '残影ステップ'); assert.equal(SK[23][1], 0);
  assert.deepEqual(JSON.parse(JSON.stringify(c.EFF[22])), [{ tg: 0, st: 'hi', lv: 1, t: 2 }]);
  assert.deepEqual(JSON.parse(JSON.stringify(c.EFF[23])), [{ tg: 0, st: 'ev', lv: 1, t: 2 }]);
  assert.ok(c.SPECIAL_MOVES.has(28) && c.SPECIAL_MOVES.has(29) && c.SPECIAL_MOVES.size === 2);
  assert.equal(c.SK.length, 30); assert.equal(c.SP.length, 2, 'SP（プレイヤー・野生の種族）には入れない');
  assert.equal(c.IMG[4], './assets/monsters/regnas/regnas_official.webp');
  for (const f of [...rd('js/phase10/monsters.js').matchAll(/龍眼/g)]) assert.fail('龍眼 と書かない：' + f);
  assert.doesNotMatch(rd('js/battle/rival-partner.js'), /龍眼/);
  const ms = c.MMP7.getMoveset('regnas');
  assert.deepEqual(JSON.parse(JSON.stringify(ms)), { initial: [20, 21, 22, 23], po: [24], in: [25], hi: [26], ev: [27], de: [28, 29] });
  assert.equal(c.MMRP.install(), true, '二度呼んでも同じ');
});

test('RP-02：丈夫さ特訓の習得は 1回目＝未習得の 9／10 からランダムに1つ・2回目＝残り', () => {
  const c = load();
  assert.equal(c.MMRP.learnByToughness([], () => 0), 9); assert.equal(c.MMRP.learnByToughness([], () => 0.99), 10);
  assert.equal(c.MMRP.learnByToughness([9], () => 0), 10); assert.equal(c.MMRP.learnByToughness([10], () => 0.99), 9);
  assert.equal(c.MMRP.learnByToughness([9, 10]), null);
});

test('RP-03：ライバル戦の相手をレグナスに（名前・絵・技＝初期の4技）。6能力（ランクの値）はそのまま', () => {
  const c = load(); c.MMRP.install();
  const e = { name: 'ランクDの対戦相手', sp: 1, h: 60, s2: 1, li: 90, po: 90, in: 90, hi: 90, ev: 90, de: 90, eq: [10, 11, 12, 13, -1, -1] }, pl = [{}, e];
  c.MMRP._swap(pl);
  assert.deepEqual([e.name, e.sp, e.h, e.s2], ['レグナス', 4, 0, null]);
  assert.deepEqual([...e.eq], [20, 21, 22, 23, -1, -1]);
  assert.deepEqual([e.li, e.po, e.in, e.hi, e.ev, e.de], [90, 90, 90, 90, 90, 90]);
  assert.ok(c.MMRP._mark.has(pl));
});

test('RP-04：蒼銀の反撃＝相手の攻撃を回避 → 次にレグナスが与えるダメージだけ 1.20倍・1回・重複しない・補助技では消えない・ほかのバトルでは起きない', () => {
  const c = load(); c.MMRP.install();
  const pl = [{}, {}]; c.MMRP._swap(pl); c.BPL = pl;
  const s = { currentLife: { A: 200, B: 200 }, totalDamage: { A: 0, B: 0 } };
  const atk = { power: 80 }, sup = { power: 0 };
  const hitB = (d) => { const before = s.currentLife.A; s.currentLife.A = Math.max(0, before - d); s.totalDamage.B += before - s.currentLife.A; const r = { actor: 'B', target: 'A', hit: true, damage: d, targetLifeBefore: before, targetLifeAfter: s.currentLife.A, ko: s.currentLife.A <= 0 }; c.MMRP._onAction({ session: s, move: atk }, r); return r; };
  const missA = (m) => c.MMRP._onAction({ session: s, move: m }, { actor: 'A', target: 'B', hit: false, damage: 0 });
  // 回避の前は等倍
  assert.equal(hitB(20).damage, 20); assert.equal(s.currentLife.A, 180);
  // 補助技を外しても構えない
  missA(sup); assert.equal(hitB(20).damage, 20);
  // 2回回避しても1回分だけ
  missA(atk); missA(atk);
  // レグナスが外す・補助技では消えない
  c.MMRP._onAction({ session: s, move: atk }, { actor: 'B', target: 'A', hit: false, damage: 0 });
  c.MMRP._onAction({ session: s, move: sup }, { actor: 'B', target: 'A', hit: true, damage: 0, targetLifeAfter: s.currentLife.A });
  const r = hitB(30); assert.equal(r.damage, 36); assert.equal(r.counter, true); assert.equal(s.currentLife.A, 160 - 36); assert.equal(r.targetLifeAfter, s.currentLife.A);
  assert.equal(s.totalDamage.B, 20 + 20 + 36);
  assert.equal(hitB(30).damage, 30, '与えたら消える');
  // KO：ライフは 0 未満にしない
  missA(atk); s.currentLife.A = 40; const k = hitB(35); assert.equal(s.currentLife.A, 0); assert.equal(k.ko, true); assert.equal(k.damage, 42);
  // 新しいバトル（別のセッション）は構えていない
  const s2 = { currentLife: { A: 100, B: 100 }, totalDamage: { A: 0, B: 0 } };
  const r2 = { actor: 'B', target: 'A', hit: true, damage: 10, targetLifeBefore: 100, targetLifeAfter: 90 }; s2.currentLife.A = 90;
  c.MMRP._onAction({ session: s2, move: atk }, r2); assert.equal(r2.damage, 10);
  // レグナス以外の対戦では何もしない
  c.BPL = [{}, {}]; const s3 = { currentLife: { A: 100, B: 100 }, totalDamage: { A: 0, B: 0 } };
  c.MMRP._onAction({ session: s3, move: atk }, { actor: 'A', target: 'B', hit: false, damage: 0 });
  const r3 = { actor: 'B', target: 'A', hit: true, damage: 10, targetLifeBefore: 100, targetLifeAfter: 90 }; c.MMRP._onAction({ session: s3, move: atk }, r3); assert.equal(r3.damage, 10);
});

test('RP-05：index.html はフックを呼ぶだけ（ライバルのバトルだけ arm・anim() の先頭・SK／EFF の定義の行は変えない）。レグナスの名前は index.html に書かない。セーブに入れない', () => {
  assert.match(HTML, /<script src="\.\/js\/battle\/rival-partner\.js"><\/script>/);
  assert.match(HTML, /if\(bt=="rival"&&window\.MMRP\)MMRP\.arm\(\);if\(!MMP8\.beginBattle/);
  assert.match(HTML, /function anim\(k,s\)\{if\(window\.MMSTAGE&&MMSTAGE\.run\(k,s,animRaw\)\)return;animRaw\(k,s\)\}/, '2026-10-06：共通演出（js/battle/stage.js）が先＝レグナスの演出は animRaw の先頭');
  assert.match(HTML, /function animRaw\(k,s\)\{(if\(window\.MM25D&&MM25D\.anim\(k,s\)\)return;)?if\(k>=20&&window\.MMRP&&MMRP\.anim\(k,s\)\)return;if\(SFR\[k\]\)return frm\(k,s\);/);   // 2026-10-08：比較試遊の 2.5D（ソラモ・ガウルの技だけ・?battleArt=2p5d のときだけ）が先
  assert.match(HTML, /\nif\(window\.MMRP\)MMRP\.install\(\);/);
  const JS = rd('js/battle/rival-partner.js');
  assert.doesNotMatch(JS, /localStorage|save\(|S\.npcFlags|mr4v6/, 'スキルの状態はセーブしない');
  assert.match(JS, /new WeakMap\(\)/);
});

test('RP-06：技の演出の素材（ポーズ11・FX 10）が実在。市松模様が焼き込まれた 11_claw_slash_medium・12_claw_slash_large は置かない・使わない', () => {
  const c = load();
  for (const p of [...Object.values(c.MMRP.POSE), ...Object.values(c.MMRP.FX)]) assert.ok(existsSync(path.join(ROOT, 'assets/monsters/regnas/moves', p + '.webp')), p);
  assert.equal(Object.keys(c.MMRP.POSE).length, 11); assert.equal(Object.keys(c.MMRP.FX).length, 10);
  for (const f of ['11_claw_slash_medium', '12_claw_slash_large']) {
    assert.ok(!existsSync(path.join(ROOT, 'assets/monsters/regnas/moves/fx', f + '.webp')));
    assert.doesNotMatch(rd('js/battle/rival-partner.js').replace(/\/\/[^\n]*/g, ''), new RegExp(f));
  }
});
