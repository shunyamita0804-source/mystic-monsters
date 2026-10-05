// =========================================================
// 実ブラウザ：PHASE B（2026-10-05）
//  PB-B1 新しいゲームの確認：「最初からやり直す」のあとの開始画面で開始 → 確認（後ろの開始ボタンは押せない）→ 戻る＝つづきから／確認しました＝新しいゲーム。開始画面は無音（390×844・375×667）
//  PB-B2 会話の文字送り：改行の位置・文字の位置が途中で変わらない（選択肢が出ても本文は動かない）。タップ＝全文 → 0.3秒 → 次（390×844・375×667）
//  PB-B3 ライバル遭遇：リュウの正式立ち絵が画面の中に見える（読み込み済み・不透明・背景に埋もれない）（390×844・375×667）
//  PB-B4 大会ランク：TEST 大会の受付＝正式の行（E・D＝赤・参加可能・押せる／C〜S＝青＋鎖＋錠・参加不可・押せない）。やめると記録・所持金は始める前のまま
//  PB-B5 アイテム：ベースキャンプの「アイテム管理」（薬草の正式アイコン・バッグ ⇄ 保管庫・保存）・アイテム補給所（購入／売却／アイテム図鑑）・Chapter のアイテムに薬草のアイコン
//  PB-B6 聖獣士管理局の BGM（入る＝BUREAU・出る＝TOWN）・街の名札「ミストリア」と札が重ならない（4サイズ）・システム通知の帯（古いセーブの救済）
//  QA_E2E=1 のときだけ実行（tests/e2e/harness.mjs）
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
let L, opened = [];
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });
async function open(opt = {}) { for (const q of opened) await q.ctx.close().catch(() => {}); const p = await L.open(opt); opened = [p]; return p; }
const SIZES = [[390, 844], [375, 667]];
const stored = (pg) => pg.evaluate(() => localStorage.getItem(MMP8.SAVE_KEY));
const idle = (pg) => pg.waitForFunction(() => !bBusy && !MMCHD.isLocked() && !document.querySelector('.chpop,.chdz,.chf-fina'), null, { timeout: 30000 }).then(() => pg.waitForTimeout(200));
const box = (pg, s) => pg.evaluate((s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; }, s);

for (const size of SIZES) {
  test(`PB-B1（${size.join('×')}）：新しいゲームの確認（後ろは押せない・戻る＝つづきから・確認しました＝新しいゲーム）。開始画面は無音`, { skip: SKIP }, async () => {
    const p = await open({ size }); const pg = p.page;
    await H.newGame(pg, 'テスト');
    await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; S.m = m; save(); P_NEWGAME = true; title(); });
    await pg.waitForSelector('.p15start'); await pg.waitForTimeout(500);
    const before = await stored(pg);
    assert.equal(await pg.evaluate(() => MMAUDIO.status().slots.filter((x) => x.active).length), 0, '開始画面は無音');
    await pg.click('.p15start'); await pg.waitForSelector('#ngm .ngm-ok');
    const sb = await box(pg, '.p15start'), mb = await box(pg, '.ngm-p');
    assert.ok(mb.l >= 0 && mb.r <= size[0] && mb.t >= 0 && mb.b <= size[1], '確認の窓は画面に収まる');
    assert.equal(await pg.evaluate(({ x, y }) => !!document.elementFromPoint(x, y).closest('#ngm'), { x: sb.l + sb.w / 2, y: sb.t + sb.h / 2 }), true, '開始ボタンの上は確認の幕が受け止める');
    await pg.mouse.click(sb.l + sb.w / 2, sb.t + sb.h / 2); await pg.waitForTimeout(700);
    assert.ok(await pg.$('#ngm'), '後ろの開始ボタンは押せない（窓は残る）'); assert.equal(await stored(pg), before, 'まだ何も変わらない');
    await pg.waitForTimeout(200); await pg.click('#ngm .ngm-back');
    await pg.waitForSelector('#ngm', { state: 'detached' });
    assert.match(await pg.textContent('.tcap'), /つづきから/, '戻る＝つづきからの開始画面'); assert.equal(await stored(pg), before);
    // もう一度「最初からやり直す」→ 確認しました
    await pg.evaluate(() => { P_NEWGAME = true; title(); }); await pg.waitForSelector('.p15start'); await pg.waitForTimeout(400);
    await pg.click('.p15start'); await pg.waitForSelector('#ngm .ngm-ok'); await pg.waitForTimeout(450);
    await pg.click('#ngm .ngm-ok');
    await pg.waitForSelector('#p11nm', { timeout: 15000 });
    assert.equal(await pg.evaluate(() => !!S.m || S.box.length > 0), false, '新しいゲーム');
    assert.ok((await pg.evaluate(() => MMAUDIO.seLog())).includes('TITLE_START'), '開始の音は正式 SE');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });

  test(`PB-B2（${size.join('×')}）：会話の文字送りで改行・文字の位置が変わらない（選択肢が出ても本文は動かない）。タップ＝全文 → 0.3秒は進まない → 次`, { skip: SKIP }, async () => {
    const p = await open({ size }); const pg = p.page;
    await pg.evaluate(() => { MMNPC.talk([{ npc: 'fina', expression: 'smile', text: 'あの……もしかして、今日ミストリアで聖獣士登録をする予定の方ですか？', choices: [{ id: 'y', label: 'はい' }, { id: 'n', label: 'ちがいます' }] }], { kind: 'fina', big: true, scene: BUREAU_BG }); });
    const snap = () => pg.evaluate(() => { const cs = [...document.querySelectorAll('.mmtalk-text .mtc')], w = document.querySelector('.mmtalk-win').getBoundingClientRect(); return { pos: cs.map((c) => { const r = c.getBoundingClientRect(); return `${Math.round(r.left)},${Math.round(r.top)}`; }).join(' '), on: cs.filter((c) => c.classList.contains('on')).length, n: cs.length, win: `${Math.round(w.top)}/${Math.round(w.height)}` }; });
    await pg.waitForSelector('.mmtalk-text .mtc');
    const ss = []; for (let i = 0; i < 16; i++) { ss.push(await snap()); await pg.waitForTimeout(70); }
    await pg.waitForSelector('.mmtalk-choice'); await pg.waitForTimeout(250); ss.push(await snap());
    assert.ok(ss.some((x) => x.on > 0 && x.on < x.n), '文字送りの途中を見た');
    assert.equal(new Set(ss.map((x) => x.pos)).size, 1, '文字の位置は最初から最後まで同じ（改行の位置が変わらない）');
    assert.equal(new Set(ss.map((x) => x.win)).size, 1, '選択肢が出ても会話窓の大きさ・位置は同じ');
    assert.equal(ss[ss.length - 1].on, ss[0].n, '最後は全部見える');
    await pg.evaluate(() => MMNPC.close());
    // タップ＝全文 → すぐのタップでは進まない → 次
    await pg.evaluate(() => { MMNPC.talk([{ npc: 'fina', text: 'これは読むための長めのセリフです。最後まで読めますか？' }, { text: '二つ目。' }]); });
    await pg.waitForSelector('.mmtalk:not(.mmtalk-out)'); await pg.waitForTimeout(300);
    const p0 = (await snap()).pos; await pg.click('.mmtalk'); const s1 = await snap();
    assert.equal(s1.on, s1.n, 'タップで全文'); assert.equal(s1.pos, p0, '全文にしても文字は動かない');
    assert.equal(await pg.evaluate(() => new Promise((ok) => setTimeout(() => { document.querySelector('.mmtalk').click(); ok(MMNPC.state().idx); }, 100))), 0, '0.3秒は進まない（間隔はページの中で測る）');
    await pg.waitForTimeout(400); await pg.click('.mmtalk'); assert.equal(await pg.evaluate(() => MMNPC.state().idx), 1, '次のセリフ');
    await H.finishTalk(pg);
    assert.deepEqual(p.errors, []);
  });

  test(`PB-B3（${size.join('×')}）：ライバル遭遇でリュウの正式立ち絵が見える（画面の中・読み込み済み・不透明・文面と進行はそのまま）`, { skip: SKIP }, async () => {
    const p = await open({ size }); const pg = p.page;
    await H.newGame(pg, 'テスト');
    await pg.evaluate(() => { finaFlags().story = ['tut_turns']; const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); save(); board(); });
    await pg.waitForSelector('#chf .chf-bg'); await idle(pg);
    await pg.evaluate(() => { const g = MMCH.graphFor(S.m), id = g.order.find((x) => g.nodes[x].kind === 'rival'), from = g.order[g.order.indexOf(id) - 1]; const r = S.m.raise; r.node = from; r.pend = null; r.field.fieldId = g.nodes[from].field; save(); board(); });
    await idle(pg);
    await pg.evaluate(() => { window.__mr = Math.random; Math.random = () => 0.1; }); await pg.click('#brollbtn'); await pg.evaluate(() => { Math.random = window.__mr; });
    await pg.waitForSelector('.chf-enc2.t-rival .ce-rival', { timeout: 20000 }); await pg.waitForTimeout(700);
    const r = await pg.evaluate(() => { const i = document.querySelector('.chf-enc2 .ce-rival'), b = i.getBoundingClientRect(), cs = getComputedStyle(i), x = b.left + b.width / 2, y = b.top + b.height * 0.3, hit = document.elementFromPoint(x, y); return { ok: i.complete && i.naturalWidth > 0, src: i.getAttribute('src'), b: [b.left, b.top, b.right, b.bottom], op: +cs.opacity, vis: cs.visibility, encTop: (() => { const e = document.querySelector('.chf-enc2'), z = +getComputedStyle(e).zIndex || 0, ce = getComputedStyle(e); return +ce.opacity > 0.9 && ce.visibility === 'visible' && [...e.parentElement.children].filter((c) => c !== e && !c.classList.contains('chf-enc2')).every((c) => (+getComputedStyle(c).zIndex || 0) <= z || getComputedStyle(c).visibility === 'hidden' || +getComputedStyle(c).opacity === 0); })(), tx: document.querySelector('.chf-enc2 .ce-tx').textContent }; });
    assert.ok(r.ok, 'リュウの絵が読み込まれている'); assert.match(r.src, /assets\/npc\/ryu\/ryu_official_fullbody\.webp$/);
    assert.ok(r.b[0] >= 0 && r.b[2] <= size[0] && r.b[1] >= 0 && r.b[3] <= size[1], `画面の中 ${r.b.map(Math.round)}`);
    assert.ok(r.op > 0.9 && r.vis === 'visible' && r.encTop, `不透明・見えている（遭遇の層は画面のいちばん上・背景に埋もれない）${JSON.stringify([r.op, r.vis, r.encTop])}`);
    assert.equal(r.tx, 'リュウが立ちはだかった！', '文面はそのまま');
    await pg.waitForSelector('.chbat', { timeout: 20000 });
    assert.equal(await pg.evaluate(() => S.m.raise.pend && S.m.raise.pend.fx && S.m.raise.pend.fx.battleType), 'rival', '進行はそのまま（ライバルのバトルの案内）');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('PB-B4：TEST 大会の受付＝正式のランク行（E・D＝赤・参加可能／C〜S＝青＋鎖＋錠・参加不可・押せない）。やめると記録・所持金は始める前のまま', { skip: SKIP }, async () => {
  for (const size of SIZES) {
    const p = await open({ size }); const pg = p.page;
    await H.newGame(pg, 'テスト');
    await pg.evaluate(() => { const m = mk(1); m.name = 'ガウ'; MMP7.ensureProg(m); S.m = m; save(); lobby(); }); await pg.waitForSelector('.map.town .ttest');
    const before = await stored(pg);
    await pg.click('.map.town .ttest'); await pg.waitForSelector('.rcv-row'); await pg.waitForTimeout(500);
    const rows = await pg.evaluate(() => [...document.querySelectorAll('.rcv-row')].map((r) => { const pl = getComputedStyle(r.querySelector('.rcv-plate'), '::before').backgroundImage, b = r.getBoundingClientRect(); return { k: +r.dataset.rank, st: r.dataset.state, tag: r.tagName, chains: r.querySelectorAll('.rcv-chain').length, lock: !!r.querySelector('.rcv-lock'), chip: r.querySelector('.rcv-st').textContent, info: r.querySelector('.rcv-info small').textContent, red: /163, 25, 43|124, 15, 32/.test(pl), blue: /44, 76, 158|27, 52, 120/.test(pl), inView: b.left >= -1 && b.right <= innerWidth + 1 && b.top >= 0 && b.bottom <= innerHeight }; }));
    assert.deepEqual(rows.map((r) => r.k), [5, 4, 3, 2, 1, 0], 'S→E（F は無い）');
    for (const r of rows.filter((x) => x.k >= 2)) { assert.deepEqual([r.st, r.tag, r.chains, r.lock, r.blue], ['lock', 'DIV', 2, true, true], `ランク${r.k}＝青＋鎖＋錠・押せない`); assert.match(r.chip, /参加不可/); assert.match(r.info, /参加者 8体 \/ 7試合/); }
    for (const r of rows.filter((x) => x.k < 2)) { assert.deepEqual([r.tag, r.chains, r.lock, r.red], ['BUTTON', 0, false, true], `ランク${r.k}＝赤・参加可能・押せる`); assert.match(r.chip, /参加可能/); assert.match(r.info, /参加者 6体 \/ 5試合/); }
    assert.ok(rows.every((r) => r.inView), '6段とも画面の中');
    await pg.click('.rcv-row[data-rank="0"]'); await pg.waitForTimeout(450);
    assert.equal(await pg.evaluate(() => document.querySelector('#p9join').disabled), false, 'E を選ぶと参加できる');
    await pg.evaluate(() => p9Menu()); await pg.waitForSelector('#p9ov .ttest'); await pg.click('#p9ov .ttest'); await pg.waitForSelector('.map.town');
    assert.equal(await stored(pg), before, '記録・所持金は始める前のまま（TEST 大会は保存しない）');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  }
});

test('PB-B5：アイテム管理（薬草の正式アイコン・バッグ ⇄ 保管庫・保存。購入・売却は無い）・アイテム補給所（購入／売却／アイテム図鑑）・Chapter のアイテムに薬草のアイコン', { skip: SKIP }, async () => {
  for (const size of SIZES) {
    const p = await open({ size }); const pg = p.page;
    await H.newGame(pg, 'テスト');
    await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); hall('t'); });
    await pg.waitForSelector('.bcitem'); const bb = await box(pg, '.bcitem');
    assert.ok(bb.l >= 0 && bb.t >= 0 && bb.h >= 44, 'アイテム管理の導線（押せる大きさ）');
    await pg.click('.bcitem'); await pg.waitForSelector('.ds.itemmg');
    await pg.waitForFunction(() => [...document.querySelectorAll('#app .itic')].every((i) => i.complete), null, { timeout: 5000 }).catch(() => {});   // 画像の読み込みを待つ（出た直後の1フレームでは読み込み中のことがある）
    const t = await pg.evaluate(() => ({ tx: document.querySelector('#app').innerText, icons: [...document.querySelectorAll('#app .itic')].map((i) => [i.getAttribute('src'), i.complete && i.naturalWidth > 0]), buy: !!document.querySelector('[onclick^="p7Buy"],[onclick^="p7Sell"]') }));
    assert.match(t.tx, /アイテム管理/); assert.match(t.tx, /薬草/); assert.equal(t.buy, false, '購入・売却は置かない');
    assert.ok(t.icons.length >= 2 && t.icons.every(([s, ok]) => /herb\.webp$/.test(s) && ok), '薬草の正式アイコン');
    await pg.click('.imslots .ppsl.on'); await pg.waitForTimeout(300);
    assert.deepEqual(await pg.evaluate(() => [S.inv.bag.length, S.inv.vault.map((x) => x.id)]), [0, ['herb']], 'バッグ → 保管庫');
    assert.deepEqual(JSON.parse(await stored(pg)).inv.vault.map((x) => x.id), ['herb'], '保存された');
    await pg.click('[onclick^="imToBag"]'); await pg.waitForTimeout(300);
    assert.deepEqual(await pg.evaluate(() => [S.inv.bag.map((x) => x.id), S.inv.vault.length]), [['herb'], 0], '保管庫 → バッグ');
    // アイテム補給所
    await pg.evaluate(() => shopScr()); await pg.waitForSelector('.shmenu'); await H.finishTalk(pg).catch(() => {});
    const ents = await pg.evaluate(() => [...document.querySelectorAll('.shent')].map((b) => { const r = b.getBoundingClientRect(), i = b.querySelector('img'); return [b.querySelector('b').textContent, i.complete && i.naturalWidth > 0, r.bottom <= innerHeight + 1]; }));
    assert.deepEqual(ents.map((x) => x[0]), ['購入', '売却', 'アイテム図鑑']); assert.ok(ents.every((x) => x[1]), '正式アイコン'); assert.ok(ents.every((x) => x[2]), '3つとも画面の中');
    await pg.click('.shent:nth-child(3)'); await pg.waitForSelector('.shbook');
    assert.match(await pg.textContent('.shbook'), /薬草[\s\S]*疲れを30回復[\s\S]*非売品・所持 1/);
    await pg.click('.dback'); await pg.waitForSelector('.shmenu'); await pg.click('.shent:nth-child(1)'); await pg.waitForSelector('.ds.shop .dcard');
    assert.match(await pg.textContent('.ds.shop .dbody'), /商品は準備中です/, '購入：商品・価格は従来どおり（未登録）');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  }
  // Chapter のアイテムに薬草のアイコン
  const p = await open({}); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { finaFlags().story = ['tut_turns']; const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); m.raise.fatigue = 50; save(); board(); });
  await pg.waitForSelector('#chf .chf-bg'); await idle(pg);
  await pg.evaluate(() => chfItems()); await pg.waitForSelector('#chitems .itic');
  assert.ok(await pg.evaluate(() => { const i = document.querySelector('#chitems .itic'); return /herb\.webp$/.test(i.getAttribute('src')) && i.complete && i.naturalWidth > 0; }));
  await pg.click('#chitems button[onclick^="chfItemUse"]'); await pg.waitForTimeout(500);
  assert.deepEqual(await pg.evaluate(() => [S.m.raise.fatigue, S.inv.bag.length]), [20, 0], '効果（疲れ −30）はそのまま');
  assert.deepEqual(p.errors, []);
});

test('PB-B6：聖獣士管理局の BGM（入る＝BUREAU のループ・出る＝街の曲）・街の名札「ミストリア」と札は重ならない（4サイズ）・古いセーブの救済はシステム通知の帯（顔・名前なし）', { skip: SKIP }, async () => {
  const p = await open({}); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => bureauScr()); await pg.waitForTimeout(1200);
  const a = await pg.evaluate(() => ({ scene: MMAUDIO.status().scene, act: MMAUDIO.status().slots.filter((x) => x.active).map((x) => x.src) }));
  assert.equal(a.scene, 'BUREAU'); assert.ok(a.act.length === 1 && /mystic_monsters_bureau_bgm_official\.ogg$/.test(a.act[0]), '管理局の正式 BGM が1本');
  await pg.evaluate(() => bureauScr('ach')); await pg.waitForTimeout(500);
  assert.deepEqual(await pg.evaluate(() => MMAUDIO.status().slots.filter((x) => x.active).map((x) => x.src)), a.act, '管理局の中で画面を変えても鳴らし直さない');
  await pg.evaluate(() => lobby()); await pg.waitForTimeout(1200);
  assert.equal(await pg.evaluate(() => MMAUDIO.status().scene), 'TOWN', '出たら街の曲');
  // 古いセーブの救済（0体・300G）＝帯
  await pg.evaluate(() => { S.m = null; S.box = []; S.g = 300; save(); adopt(0, 'ソラ'); });
  await pg.waitForSelector('.mmnote');
  const n = await pg.evaluate(() => ({ tx: document.querySelector('.mmnote').innerText, nm: !!document.querySelector('.mmnote .dnm,.mmnote .mmtalk-name'), msg: (document.querySelector('#msg') || {}).textContent || '' }));
  assert.match(n.tx, /ソラをつれて帰った！[\s\S]*はじめての1体のため、所持金を500Gまで補填しました/); assert.equal(n.nm, false, '顔・名前なし'); assert.doesNotMatch(n.msg, /補填/, '街の通知と二重にしない');
  await pg.evaluate(() => MMNOTE.flush());
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  for (const size of [[390, 844], [375, 667], [360, 800], [430, 932]]) {
    const q = await open({ size }); const g = q.page;
    await H.newGame(g, 'テスト'); await g.evaluate(() => lobby()); await g.waitForSelector('.map.town .tcity'); await g.waitForTimeout(400);
    const r = await g.evaluate(() => { const bx = (e) => { const b = e.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom]; }, all = [...document.querySelectorAll('.map.town .tpin span')].map(bx), city = bx(document.querySelector('.tcity')), ov = (a, b) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3]; return { city, hit: all.filter((x) => ov(x, city)).length, pair: all.some((x, i) => all.some((y, j) => i < j && ov(x, y))), news: bx(document.querySelector('.tnews')), conf: bx(document.querySelector('.tconf')) }; });
    assert.equal(r.hit, 0, `${size}：名札に札が重ならない`); assert.equal(r.pair, false, `${size}：札どうしが重ならない`);
    assert.ok(r.city[0] >= r.news[2] && r.city[2] <= r.conf[0], `${size}：お知らせと設定の間`);
    assert.deepEqual(q.errors, []);
  }
});
