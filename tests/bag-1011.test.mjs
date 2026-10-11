// =========================================================
// バッグの正式仕様（2026-10-11）：枠＝プレイヤー全体の最高優勝（未優勝 2／E・D 3／C・B 4／A・S 6）・同じアイテムは1枠10個まで・旧セーブの安全な移行
//  ・使える枠は S.rankRec.cleared（育成中の個体ではない）。旧 S.inv.bagCapUnlocked の意味は変えない（立っていれば 6）
//  ・アイテム＝{ id, n }（n は2個以上のときだけ。旧形式 { id } は1個）。保管庫は1種類1行・個数の上限なし
//  ・旧バッグが新しい枠を超えていたら、数と種類を失わずに保管庫へ。Chapter 進行中のセーブはその場で消さず・動かさず、帰還のあとに整理
//  ・何度読み込んでも増えない・減らない。セーブ version 6・キー mr4v6 は変えない
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const HTML = rd('index.html');
const SRC = ['js/phase7/progression.js', 'js/phase8/league.js', 'js/phase8/raising.js', 'js/phase10/monsters.js', 'js/phase11/player.js', 'js/phase9/chapters.js'].map(rd);
function load() {
  const w = {}; for (const s of SRC) new Function('window', s)(w);
  for (const c of w.MMP9C.CHAPTERS) w.MMP7.registerChapterBoard(c.no, c.track, { provisional: false });
  w.MMP8L.setSpeciesCount(2);
  return { P7: w.MMP7, P8: w.MMP8 };
}
const j = (o) => JSON.parse(JSON.stringify(o));
function mon(over = {}) {
  return { sp: 0, name: 'ソラモ', age: 0, span: 30, h: 0, rk: 0, fa: 0, st: 0, last: null, li: 100, po: 100, in: 100, hi: 100, ev: 100, de: 100,
    sk: [0, 1, 2, 3], eq: [0, 1, 2, 3, -1, -1], ...over };
}
function town({ P7, P8 }) {
  const S = P8.newSave(); S.g = 300; S.playerName = 'テスト'; delete S.playerNamePending; S.npcFlags = { finaIntro: true, raiseIntro: true };
  S.m = P8.initIndividual(S, P7.initProgForNew(mon()));
  return S;
}
const win = (S, r) => { for (let i = 0; i <= r; i++) S.rankRec.cleared[i] = true; };
/** バッグ＋保管庫の id ごとの総数 */
function totals(P7, S) { const t = {}; for (const it of S.inv.bag.concat(S.inv.vault)) t[it.id] = (t[it.id] || 0) + P7.qty(it); return t; }
const reload = (P8, S) => P8.migrateSave(j(S));
function lcg(seed) { let x = seed >>> 0; return () => { x = (Math.imul(x, 1103515245) + 12345) >>> 0; return (x >>> 1) / 0x80000000; }; }

test('BAG-01：新しいゲームは2枠。実績別（未優勝2・E 3・D 3・C 4・B 4・A 6・S 6）', () => {
  const M = load(), { P7, P8 } = M;
  const S = P8.newSave();
  assert.equal(P7.bagCap(S), 2);
  assert.deepEqual([-1, 0, 1, 2, 3, 4, 5].map((r) => P7.bagCapForRank(r)), [2, 3, 3, 4, 4, 6, 6]);
  for (const [r, cap] of [[0, 3], [1, 3], [2, 4], [3, 4], [4, 6], [5, 6]]) { const T = P8.newSave(); win(T, r); assert.equal(P7.bagCap(T), cap, `rank ${r}`); }
  const U = P8.newSave(); U.inv.bagCapUnlocked = true;
  assert.equal(P7.bagCap(U), 6, '旧 bagCapUnlocked（S 初回クリアの記録）は 6 のまま');
  assert.equal(P7.bagCap(reload(P8, U)), 6);
});

test('BAG-02：D を先に → E は3枠のまま。B を先に → 4枠。A の優勝で4枠から6枠へ一度に。同じ段階・再優勝では増えない', () => {
  const M = load(), { P7, P8 } = M;
  const S = town(M);
  assert.deepEqual(P7.recordRankClear(S, S.m, 1).bagCap, { from: 2, to: 3 }, 'D 優勝で3枠');
  assert.equal(P7.recordRankClear(S, S.m, 0).bagCap, null, 'あとの E 優勝で増えない');
  assert.equal(P7.bagCap(S), 3);
  const T = town(M);
  assert.deepEqual(P7.recordRankClear(T, T.m, 3).bagCap, { from: 2, to: 4 }, 'B を先に＝4枠');
  assert.equal(P7.recordRankClear(T, T.m, 2).bagCap, null);
  assert.deepEqual(P7.recordRankClear(T, T.m, 4).bagCap, { from: 4, to: 6 }, 'A 優勝で 4→6 を一度に');
  // 大会の初回報酬に枠の増加が入る（別の個体の同じランクの初回優勝では増えない）
  const U = town(M);
  const w1 = P8.grantTournamentWin(U, U.m, 0, () => 0);
  assert.deepEqual(w1.bagCap, { from: 2, to: 3 });
  const other = P8.initIndividual(U, P7.initProgForNew(mon({ sp: 1, name: 'ガウル' })));
  const w2 = P8.grantTournamentWin(U, other, 0, () => 0);
  assert.equal(w2.firstClear, true, 'その個体には初回');
  assert.equal(w2.bagCap, null, 'プレイヤー全体では同じ段階＝枠は増えない');
});

test('BAG-03：同じ品 10個は1枠・11個目は別の枠。違う ID は別の枠。0個の枠は持たない', () => {
  const M = load(), { P7 } = M;
  const S = town(M); win(S, 0);   // 3枠
  for (let i = 0; i < 10; i++) assert.equal(P7.bagAdd(S, 'potato').ok, true);
  assert.deepEqual(S.inv.bag, [{ id: 'potato', n: 10 }]);
  assert.equal(P7.bagAdd(S, 'potato').ok, true);
  assert.deepEqual(S.inv.bag, [{ id: 'potato', n: 10 }, { id: 'potato' }]);
  assert.equal(P7.bagAdd(S, 'herb').ok, true);
  assert.equal(S.inv.bag.length, 3);
  assert.equal(P7.bagRoomFor(S, 'potato'), 9, '残りは2つ目の枠の9個だけ');
  assert.equal(P7.bagAdd(S, 'potato', 10).ok, false, '全部入らないときは何も入れない（一部だけ入れない）');
  assert.equal(P7.itemCount(S, 'potato'), 11);
  assert.equal(P7.bagAdd(S, 'potato', 9).ok, true);
  assert.deepEqual(S.inv.bag, [{ id: 'potato', n: 10 }, { id: 'potato', n: 10 }, { id: 'herb' }]);
  // 使う：減って、0個で枠が空く
  assert.deepEqual(P7.bagTake(S, 2), { ok: true, itemId: 'herb', left: 0 });
  assert.equal(S.inv.bag.length, 2);
  assert.equal(P7.bagTake(S, 1, 3).left, 7);
  assert.deepEqual(S.inv.bag[1], { id: 'potato', n: 7 });
  assert.equal(P7.bagTake(S, 1, 8).ok, false, '持っている数より多くは使えない');
});

test('BAG-04：保管庫は1種類1行（個数の上限なし）。バッグ⇄保管庫・購入・売却で総数が保たれる', () => {
  const M = load(), { P7 } = M;
  P7.registerItem({ id: 'potato', name: 'ジャガイモ', price: 20, sellPrice: 5 });
  P7.setShopCatalog(['potato']);
  const S = town(M); S.g = 1000;
  for (let i = 0; i < 25; i++) assert.equal(P7.shopBuy(S, 'potato').ok, true);
  assert.deepEqual(S.inv.vault, [{ id: 'potato', n: 25 }], '購入品は保管庫の1行にまとまる');
  assert.equal(S.g, 500);
  assert.deepEqual(P7.moveVaultToBag(S, 0), { ok: true, moved: 10 }, '1回に1枠分（10個）');
  assert.deepEqual(P7.moveVaultToBag(S, 0), { ok: true, moved: 10 });
  assert.equal(P7.moveVaultToBag(S, 0).reason, 'full', '2枠とも10個');
  assert.deepEqual(S.inv.vault, [{ id: 'potato', n: 5 }]);
  assert.equal(P7.itemCount(S, 'potato'), 25);
  assert.deepEqual(P7.moveBagToVault(S, 0), { ok: true, moved: 10 });
  assert.deepEqual(S.inv.vault, [{ id: 'potato', n: 15 }]);
  assert.equal(P7.shopSell(S, 0).ok, true, '1個ずつ売る');
  assert.deepEqual(S.inv.vault, [{ id: 'potato', n: 14 }]);
  assert.equal(S.g, 505);
  assert.equal(P7.itemCount(S, 'potato'), 24);
  // 一部だけ移す（k）
  assert.deepEqual(P7.moveVaultToBag(S, 0, 3), { ok: true, moved: 3 }, '一部だけ移す（k＝3）：空いた枠へ3個');
  assert.deepEqual(S.inv.bag, [{ id: 'potato', n: 10 }, { id: 'potato', n: 3 }]);
  assert.deepEqual(S.inv.vault, [{ id: 'potato', n: 11 }]);
  assert.equal(P7.itemCount(S, 'potato'), 24);
});

test('BAG-05：旧セーブ（v6・5種類5個のバッグ・Chapter 外）→ 2枠に入る分だけ残し、残りは保管庫へ。数と種類は失わない。何度読み込んでも同じ', () => {
  const M = load(), { P7, P8 } = M;
  const S = town(M);
  S.inv.bag = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }];
  S.inv.vault = [{ id: 'b' }, { id: 'x' }, { id: 'x' }];
  const t0 = totals(P7, S);
  const A = reload(P8, S);
  assert.deepEqual(A.inv.bag, [{ id: 'a' }, { id: 'b' }]);
  assert.deepEqual(A.inv.vault, [{ id: 'b' }, { id: 'x', n: 2 }, { id: 'c' }, { id: 'd' }, { id: 'e' }], '保管庫は1種類1行・超過分は後ろへ');
  assert.deepEqual(totals(P7, A), t0, '総数が同じ');
  const B = reload(P8, A), C = reload(P8, B);
  assert.equal(JSON.stringify(B), JSON.stringify(A), '2回目の読み込みで変わらない');
  assert.equal(JSON.stringify(C), JSON.stringify(A), '3回目も同じ（増殖・欠損なし）');
  assert.equal(B.v, 6);
  // 同じアイテムが5個並んだ旧バッグ → 1枠にまとまる（保管庫へ行かない）
  const T = town(M); T.inv.bag = Array.from({ length: 5 }, () => ({ id: 'herb' }));
  const R = reload(P8, T);
  assert.deepEqual(R.inv.bag, [{ id: 'herb', n: 5 }]);
  assert.deepEqual(R.inv.vault, []);
});

test('BAG-06：Chapter 進行中のセーブは、旧バッグが枠を超えていても消さない・動かさない。帰還のあとの整理で保管庫へ', () => {
  const M = load(), { P7, P8 } = M;
  const S = town(M);
  assert.equal(P8.depart(S, S.m).ok, true);
  S.inv.bag = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'herb' }, { id: 'herb' }];
  const t0 = totals(P7, S);
  const A = reload(P8, S);
  assert.equal(P7.inChapter(A.m), true);
  assert.deepEqual(A.inv.bag, [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'herb', n: 2 }], 'まとめるだけ（4枠のまま残す）');
  assert.deepEqual(totals(P7, A), t0);
  assert.deepEqual(P7.tidyInventory(A), { changed: false, moved: 0, held: 2 }, 'Chapter 中は保留');
  assert.equal(JSON.stringify(reload(P8, A)), JSON.stringify(A), 'Chapter 中に何度読み込んでも同じ');
  // Chapter 中の使用・取得（取得は枠に空きが無ければ保管庫へ＝呼び出し側の従来どおり）
  assert.equal(P7.bagAdd(A, 'z').ok, false);
  // 帰還（Chapter の終了）→ 整理
  A.m.raise.turnsUsed = 20; assert.equal(P8.endChapter(A, A.m).ok, true);
  const r = P7.tidyInventory(A);
  assert.equal(r.moved, 3);
  assert.deepEqual(A.inv.bag, [{ id: 'a' }, { id: 'b' }]);
  assert.deepEqual(A.inv.vault, [{ id: 'c' }, { id: 'herb', n: 2 }]);
  assert.deepEqual(totals(P7, A), t0);
  assert.deepEqual(P7.tidyInventory(A), { changed: false, moved: 0, held: 0 }, '2回目は何もしない');
});

test('BAG-07：初期支給（薬草）と旧アイテムが混ざったセーブ・旧 v5 セーブの移行', () => {
  const M = load(), { P7, P8 } = M;
  const S = town(M); win(S, 1);   // D 優勝＝3枠
  S.inv.bag = [{ id: 'herb' }, { id: 'old1' }, { id: 'herb' }, { id: 'old2' }, { id: 'old3' }];
  const A = reload(P8, S);
  assert.deepEqual(A.inv.bag, [{ id: 'herb', n: 2 }, { id: 'old1' }, { id: 'old2' }]);
  assert.deepEqual(A.inv.vault, [{ id: 'old3' }]);
  // v5（Chapter 外・6個のバッグ・S クリア済み）→ v6：6枠に収まる
  const v5 = { v: 5, y: 1000, mo: 4, wk: 1, g: 500, box: [], m: mon(), chap: { status: 'farm', clearedMax: 0, cleared: [] },
    inv: { bag: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }, { id: 'f' }], bagCapUnlocked: true, vault: [], vaultCap: null }, trainTix: 0, trainRun: null,
    rankRec: { cleared: [true, true, true, true, true, true] } };
  const B = P8.migrateSave(v5);
  assert.equal(B.v, 6);
  assert.equal(B.inv.bag.length, 6);
  assert.equal(B.inv.bagCapUnlocked, true, '旧 bagCapUnlocked はそのまま');
  // v5（未優勝・5個）→ 2枠＋保管庫
  const v5b = j(v5); v5b.inv.bagCapUnlocked = false; v5b.rankRec.cleared = [false, false, false, false, false, false];
  const C = P8.migrateSave(v5b);
  assert.equal(C.inv.bag.length, 2);
  assert.equal(C.inv.vault.length, 4);
  assert.deepEqual(totals(P7, C), totals(P7, v5b));
});

test('BAG-08：壊れた個数・0個の枠・正常なセーブは1文字も変わらない', () => {
  const M = load(), { P7, P8 } = M;
  const S = town(M);
  S.inv.bag = [{ id: 'herb' }];
  S.inv.vault = [{ id: 'b' }];
  const A = reload(P8, S);
  assert.equal(JSON.stringify(A.inv), JSON.stringify(S.inv), '正常な（旧形式の）持ち物は読み込みで変わらない');
  const T = town(M);
  T.inv.bag = [{ id: 'a', n: 0 }, { id: 'b', n: -3 }, { id: 'c', n: 'x' }, { id: 'd', n: 2.5 }];
  T.inv.vault = [{ id: 'v', n: 0 }];
  const B = reload(P8, T);
  assert.deepEqual(B.inv.bag, [{ id: 'b' }, { id: 'c' }], 'n===0＝空き枠として外す・壊れた個数は1個（d は2枠目を超えて保管庫へ）');
  assert.deepEqual(B.inv.vault, [{ id: 'd' }]);
  assert.equal(reload(P8, B).inv.bag.length, 2);
});

test('BAG-09：等級 S のアイテムは種類を問わずバッグに合計1個まで（今は等級 S のアイテムが登録されていない）', () => {
  const M = load(), { P7, P8 } = M;
  P7.registerItem({ id: 'elixirS', name: 'テストS1', grade: 'S' });
  P7.registerItem({ id: 'crownS', name: 'テストS2', grade: 'S' });
  const S = town(M); win(S, 4);   // 6枠
  assert.equal(P7.bagAdd(S, 'elixirS').ok, true);
  assert.deepEqual(P7.bagAdd(S, 'crownS'), { ok: false, reason: 's_limit', policy: 'undecided' });
  assert.equal(P7.bagAdd(S, 'elixirS').ok, false, '同じ種類でも2個目は持ち込めない');
  S.inv.vault.push({ id: 'crownS' });
  assert.equal(P7.moveVaultToBag(S, 0).reason, 's_limit');
  // 旧セーブで S が複数あれば2個目以降は保管庫へ
  S.inv.bag = [{ id: 'elixirS', n: 3 }, { id: 'crownS' }, { id: 'herb' }];
  S.inv.vault = [];
  const r = P7.tidyInventory(S);
  assert.equal(r.moved, 3);
  assert.deepEqual(S.inv.bag, [{ id: 'elixirS' }, { id: 'herb' }]);
  assert.deepEqual(S.inv.vault, [{ id: 'elixirS', n: 2 }, { id: 'crownS' }]);
  // 本番では等級を登録していない（正式な等級データが無い＝独断で分類しない）
  assert.doesNotMatch(HTML, /grade:\s*["']S["']/);
  void P8;
});

test('BAG-10：ランダムな操作（取得・移動・使用・購入・売却・読み込み）を続けても、総数が操作どおりに保たれる', () => {
  const M = load(), { P7, P8 } = M;
  P7.registerItem({ id: 'p', name: 'P', price: 1, sellPrice: 1 }); P7.registerItem({ id: 'q', name: 'Q', price: 1, sellPrice: 1 });
  P7.setShopCatalog(['p', 'q']);
  for (let seed = 1; seed <= 40; seed++) {
    const rnd = lcg(seed); let S = town(M); S.g = 99999; win(S, Math.floor(rnd() * 7) - 1 >= 0 ? Math.floor(rnd() * 6) : -1);
    const exp = { p: 0, q: 0, r: 0 };
    for (let k = 0; k < 300; k++) {
      const op = Math.floor(rnd() * 7), id = ['p', 'q', 'r'][Math.floor(rnd() * 3)];
      if (op === 0) { const n = 1 + Math.floor(rnd() * 12); if (P7.bagAdd(S, id, n).ok) exp[id] += n; }
      else if (op === 1 && S.inv.vault.length) P7.moveVaultToBag(S, Math.floor(rnd() * S.inv.vault.length), rnd() < 0.5 ? undefined : 1 + Math.floor(rnd() * 12));
      else if (op === 2 && S.inv.bag.length) P7.moveBagToVault(S, Math.floor(rnd() * S.inv.bag.length));
      else if (op === 3 && S.inv.bag.length) { const i = Math.floor(rnd() * S.inv.bag.length), it = S.inv.bag[i]; if (P7.bagTake(S, i).ok) exp[it.id]--; }
      else if (op === 4 && id !== 'r') { if (P7.shopBuy(S, id).ok) exp[id]++; }
      else if (op === 5 && S.inv.vault.length) { const i = Math.floor(rnd() * S.inv.vault.length), it = S.inv.vault[i]; if (P7.shopSell(S, i).ok) exp[it.id]--; }
      else if (op === 6) S = reload(P8, S);
      const t = totals(P7, S);
      for (const x of ['p', 'q', 'r']) assert.equal(t[x] || 0, exp[x], `seed ${seed} step ${k} ${x}`);
      assert.ok(S.inv.bag.length <= P7.bagCap(S), '枠を超えない');
      assert.ok(S.inv.bag.every((it) => P7.qty(it) <= 10), '1枠10個まで');
      assert.ok(S.inv.bag.concat(S.inv.vault).every((it) => !('n' in it) || (Number.isInteger(it.n) && it.n >= 2)), 'n は2個以上のときだけ');
    }
  }
});

test('BAG-11：Chapter のアイテム（薬草）は1個ずつ減る・画面は個数と枠を表示する', async () => {
  const { loadEngine } = await import('./chapter-sim.mjs');
  const E = loadEngine(), CH = E.MMCH || E.CH || globalThis.MMCH;
  assert.ok(CH && CH.useFatigueItem, 'MMCH');
  CH.registerFatigueItem('herb', { amount: 30 });
  const S = { inv: { bag: [{ id: 'herb', n: 3 }], vault: [] } }, m = { raise: { fatigue: 90 } };
  assert.equal(CH.useFatigueItem(S, m, 0).left, 2);
  assert.deepEqual(S.inv.bag, [{ id: 'herb', n: 2 }]);
  CH.useFatigueItem(S, m, 0);
  assert.deepEqual(S.inv.bag, [{ id: 'herb' }], '1個の枠は { id }');
  CH.useFatigueItem(S, m, 0);
  assert.deepEqual(S.inv.bag, []);
  // 画面：出発準備・アイテム管理は共通の枠（未解放の枠は鍵と条件）・保管庫は個数
  assert.match(HTML, /function bagSlotsHtml\(onItem,onEmpty\)/);
  assert.match(HTML, /const BAG_LOCK_NOTE=i=>i<3\?"E・D優勝":i<4\?"C・B優勝":"A・S優勝";/);
  assert.match(HTML, /function bagSettle\(\)\{try\{if\(!MMP7\.canAccessVault\(S\)\)return;const r=MMP7\.tidyInventory\(S\);if\(r\.changed\)save\(\)\}catch\(e\)\{\}\}/);
  for (const f of ['fmScr', 'prepScr', 'itemScr', 'shopScr']) assert.match(HTML, new RegExp(`function ${f}\\([^)]*\\)\\{[^\\n]*bagSettle\\(\\)`), f);
  assert.match(HTML, /バッグが\$\{d\.bagCap\.to\}枠に拡張された！/);
  assert.doesNotMatch(HTML, /バッグが6枠に拡張/, '旧の固定文言（S 初回だけ）は使わない');
});
