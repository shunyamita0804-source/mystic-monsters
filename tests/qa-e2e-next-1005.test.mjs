// =========================================================
// QA（実ブラウザ）：次期総合改修（2026-10-05）
//  OP-B1：新しいゲームの序盤（プロローグのあと）＝街 → フィナの声かけ（はい／ちがいます＝どちらも管理局へ）→ 聖獣士管理局だけが光って押せる
//         → セルジュの正式登録 → 名前の確認（書き直す／この名前で登録する）→ 登録完了 → フィナが初めて名前を呼ぶ
//         → 新人支援の帯 → フィナの説明 → 町へ → 町で出身地の会話と世界地図（フェルナ → アステリア → リベルナ＝出身地 → ミストリア＝現在地）→ 解放の帯 → リュウ（3択）→ 市場へ（2026-10-12 開発21。390×844・375×667）
//  OP-B4（2026-10-12）：管理局を出たあと・地図の会話のあとに閉じた → 続きから（支援・解放・リュウは1回だけ）
//  OP-B2：登録済みの古いセーブでは序盤の導線が出ない（街の札はすべて押せる）
//  ST-B1：正式ステータス画面（名前・英字名・種類・固有スキル・能力のレーダーと棒＝999 まで。Lv・経験値・個体ランクは出さない）
//  DK-B1：Chapter の操作欄（START）が画面の下に寄りすぎない（safe-area を含めて余白がある）
//  Playwright / Chromium が無い環境では省略（skip）する。
// =========================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';

const SKIP = H.skipReason();
let L = null;
test.before(async () => { if (!SKIP) L = await H.launch(); });
test.after(async () => { if (L) await L.close(); });
const OPEN = [];
const openPage = async (o) => { const p = await L.open(o); OPEN.push(p); return p; };
test.afterEach(async () => { for (const p of OPEN.splice(0)) await p.ctx.close().catch(() => {}); });
const T = (name, fn) => test(name, { skip: SKIP }, fn);
const SIZES = [[390, 844], [375, 667]];

const talkState = (pg) => pg.evaluate(() => (document.querySelector('.mmtalk:not(.mmtalk-out)') && window.MMNPC ? MMNPC.state() : null));
/** 会話を1行ずつ送り、各行の話者・本文・地図の様子を記録する（選択肢は記録して止まる） */
async function readTalk(pg, max = 160) {   // 2026-10-06：全文を出したタップから0.3秒は次へ進まない（読む間）ので回数を多めに
  const out = [];
  for (let i = 0; i < max; i++) {
    const s = await talkState(pg); if (!s) break;
    if (s.typing) { await pg.click('.mmtalk:not(.mmtalk-out)', { force: true }); await pg.waitForTimeout(40); continue; }
    if (await pg.$('.wmap')) await pg.waitForTimeout(1500);   // 地図のカメラ・印が出そろうのを待つ
    const map = await pg.evaluate(() => { const w = document.querySelector('.wmap'); return w ? { focus: w.dataset.focus || 'world', on: [...w.querySelectorAll('.wm-pin.on,.wm-reg.on')].map((e) => e.dataset.spot), notes: [...w.querySelectorAll('.wm-pin.on .wm-note')].map((e) => e.textContent) } : null; });
    if (!out.length || out[out.length - 1].full !== s.full) out.push({ npc: s.npc, name: s.name, full: s.full, choices: s.choices ? s.choices.map((c) => c.id) : null, map });
    if (s.choices) return out;
    await pg.waitForTimeout(60);
    await pg.click('.mmtalk:not(.mmtalk-out)', { force: true });
    await pg.waitForTimeout(60);
  }
  await pg.waitForFunction(() => !document.querySelector('.mmtalk'), null, { timeout: 5000 }).catch(() => {});
  return out;
}
/** 次の会話（前の会話が閉じたあとに開く別の会話）を待つ */
const nextTalk = (pg, prev) => pg.waitForFunction((prev) => { const w = document.querySelector('.mmtalk:not(.mmtalk-out)'), s = w && window.MMNPC && MMNPC.state(); return !!s && s.full !== prev; }, prev, { timeout: 10000 });
const choose = async (pg, id) => { await pg.waitForTimeout(450); await pg.click(`.mmtalk-choice[data-choice="${id}"]`); await pg.waitForTimeout(80); };
const pins = (pg) => pg.evaluate(() => [...document.querySelectorAll('.map.town .tpin')].map((b) => ({ on: b.getAttribute('onclick') || '', go: b.classList.contains('opgo'), dis: b.disabled })));

for (const [si, size] of [...SIZES, [430, 932]].entries()) {   // 2026-10-12：3サイズ
  T(`OP-B1（${size.join('×')}）：新しいゲームの序盤＝フィナの2択 → 管理局だけ光る → セルジュの登録 → 名前の確認 → 名前を呼ぶ → 出身地と世界地図 → 市場へ。登録前は名前を呼ばない・セーブは v6`, async () => {
    const p = await openPage({ size, opening: true }); const pg = p.page;
    await pg.click('.p15start');
    await pg.waitForSelector('.map.town', { state: 'attached' });   // フィナの声かけ（施設の背景つきの会話）の間は街の UI が隠れる
    assert.equal(await pg.$('#p11nm'), null, '登録画面へ直接行かない（街から始まる）');
    await pg.waitForSelector('.mmtalk:not(.mmtalk-out)', { timeout: 8000 });
    const first = await readTalk(pg);
    assert.equal(first[0].npc, 'fina'); assert.match(first[0].full, /聖獣士登録をする予定の方ですか/); assert.deepEqual(first[0].choices, ['yes', 'no']);
    const ans = si ? 'no' : 'yes';
    await choose(pg, ans);
    const after = await readTalk(pg);
    assert.match(after.map((x) => x.full).join('|'), ans === 'yes' ? /話は聞いてるよ.*管理局まで案内する/ : /えっ、違うの.*管理局で確認してみよっか/, `「${ans}」の続き（どちらも管理局へ）`);
    await pg.waitForSelector('.tlow.on');
    assert.match(await pg.textContent('.tlow'), /聖獣士管理局は、あの光っている建物/);
    const ps = await pins(pg);
    assert.deepEqual(ps.filter((x) => x.go).map((x) => x.on), ['townGuild()'], '光るのは聖獣士管理局だけ');
    assert.ok(ps.filter((x) => !x.go).every((x) => x.dis), 'ほかの札は押せない');
    assert.ok(await pg.evaluate(() => [...document.querySelectorAll('.map.town .tbar button')].every((b) => b.disabled)), '下のバーも押せない（登録前に自由に動かない）');
    assert.ok(await pg.$('.tpin.opgo .opmk'), '「タップ」の印');
    await pg.click('.tpin.opgo');
    await pg.waitForSelector('.opbu', { state: 'attached' });   // 2026-10-06：セルジュの会話の間は施設の背景だけ（下の画面は隠れる）
    await pg.waitForSelector('.mmtalk:not(.mmtalk-out)');
    const serge = await readTalk(pg);
    assert.equal(serge[0].npc, 'serge'); assert.equal(serge[0].name, 'セルジュ'); assert.match(serge[0].full, /登録を担当しております、セルジュ/);
    assert.ok(serge.some((x) => x.npc === 'fina'), 'フィナが案内する');
    await pg.waitForSelector('#p11nm');
    await pg.fill('#p11nm', 'ミナト'); await pg.click('[onclick*="p11NameGo"]');
    await pg.waitForSelector('.mmtalk:not(.mmtalk-out)');
    let cf = await readTalk(pg);
    assert.match(cf[0].full, /「ミナト」さん、ですね/); assert.deepEqual(cf[0].choices, ['ok', 'fix']);
    if (si) {   // 書き直す → もう一度
      await choose(pg, 'fix'); await readTalk(pg); await pg.waitForFunction(() => !document.querySelector('.mmtalk'));
      assert.ok((await H.getS(pg)).playerNamePending, '書き直すときは登録しない');
      await pg.waitForSelector('#p11nm'); await pg.fill('#p11nm', 'ミナト'); await pg.click('[onclick*="p11NameGo"]');
      await pg.waitForSelector('.mmtalk:not(.mmtalk-out)'); cf = await readTalk(pg);
    }
    await choose(pg, 'ok');
    await nextTalk(pg, cf[0].full);
    const done = await readTalk(pg);
    assert.match(done[0].full, /登録が完了しました。ミナトさん、本日から正式な聖獣士です/);
    const S1 = await H.storedSave(pg);
    assert.equal(S1.playerName, 'ミナト'); assert.ok(!S1.playerNamePending); assert.equal(S1.v, 6, 'セーブ version 6（キー mr4v6）');
    // 登録より前の会話に名前は出ていない
    for (const x of [...first, ...after, ...serge]) assert.doesNotMatch(x.full, /ミナト/);
    // 2026-10-06：登録完了のすぐあと＝新人支援（セルジュ）。1000G と支援の品（2026-10-12 P2：ジャガイモ×10。旧 薬草×1）（システム通知は顔・名前なし）。受け取りは会話の前に確定して保存
    // 2026-10-05 PHASE B：受け取りの知らせは会話とは別の層＝システム通知の帯（MMNOTE・顔と名前なし）。会話（セルジュ）→ 帯 1000G → 会話 → 帯 薬草（正式アイコン）→ 会話
    // 2026-10-12 開発21：セルジュは受付の一言だけ → 帯（1000G・ジャガイモ×10・会話の枠なし）→ フィナが名前を呼んで、ジャガイモと空腹を説明 → 管理局を出て町へ
    await nextTalk(pg, done[done.length - 1].full);
    const sup = await readTalk(pg);
    assert.ok(sup.length >= 1 && sup.every((x) => x.npc === 'serge'), '支援の会話はセルジュの受付の一言だけ'); assert.match(sup[0].full, /新人の聖獣士には、管理局から旅立ちの支援/);
    assert.doesNotMatch(sup.map((x) => x.full).join('|'), /こちらもお持ちください|空腹|1ターンに1個/, 'セルジュは説明しない');
    await pg.waitForSelector('.mmnote', { timeout: 8000 });
    const sawNote = await pg.evaluate(() => { const e = document.querySelector('.mmnote'); return { talk: !!document.querySelector('.mmtalk:not(.mmtalk-out)'), name: !!e.querySelector('.mmtalk-name,.dnm'), imgs: e.querySelectorAll('img').length }; });
    assert.equal(sawNote.talk, false, '帯の間は会話窓を出さない（別の層）'); assert.equal(sawNote.name, false, '顔・名前なし');
    const notes = await pg.evaluate(() => MMNOTE.log().map((x) => x.title + '|' + x.icon));
    assert.deepEqual(notes.slice(0, 1), ['1000G／ジャガイモ×10を手に入れた|rows'], 'システム通知の帯（1000G と支援の品を1つに。2026-10-12 P2：ジャガイモ×10）');
    const SS = await H.storedSave(pg);
    assert.deepEqual([SS.g, SS.inv.bag.map((i) => i.id), SS.npcFlags.support], [1000, ['potato'], 1], '1000G・ジャガイモ×10・受け取りの記録');
    await nextTalk(pg, sup[sup.length - 1].full);
    const nm = await readTalk(pg);
    assert.match(nm[0].full, /ミナトさん、っていうんだね/, 'フィナが初めて名前を呼ぶ');
    assert.ok(nm.every((x) => x.npc === 'fina'), '支給品と空腹の説明はフィナ');
    assert.match(nm.map((x) => x.full).join('|'), /ジャガイモももらえたね.*お腹がすいていく.*1ターンに1個.*アイテム屋.*町に出よう/);
    // 町へ（管理局の中で世界地図を続けない）
    await pg.waitForFunction(() => !!document.querySelector('#app>.map.town') && !document.querySelector('.opbu'), null, { timeout: 10000 });
    assert.equal((await H.storedSave(pg)).npcFlags.op, 'town', '管理局を出た記録');
    await nextTalk(pg, nm[nm.length - 1].full);
    const org = await readTalk(pg);
    assert.ok(await pg.evaluate(() => !!document.querySelector('#app>.map.town') && !document.querySelector('.opbu')), '世界地図の会話は町で');
    assert.match(org[0].full, /世界地図を見てみよう/); assert.ok(await pg.$('.wmap.guide'), '世界地図が出る');
    assert.ok(org.some((x) => /フェルナ地方の出身/.test(x.full) && x.map && x.map.focus === 'ferna'), 'フェルナ地方');
    assert.ok(await pg.evaluate(() => { const v = document.querySelector('.wmap .wm-view').getBoundingClientRect(), i = document.querySelector('.wmap .wm-img').getBoundingClientRect(); return i.left >= v.left - 1 && i.right <= v.right + 1 && i.width <= v.width + 1; }), '2026-10-06：世界地図の全体が見える（寄りすぎない）');
    assert.ok(await pg.evaluate(() => { const r = document.querySelector('.wmap .wm-pin.on[data-spot="liberna"]').getBoundingClientRect(), t = document.querySelector('.mmtalk-win').getBoundingClientRect(); return r.bottom > 0 && r.top < t.top; }), '光っている地点は会話窓・選択肢に隠れない');
    assert.deepEqual(org[org.length - 1].choices, ['a', 'b']);
    assert.deepEqual(await pg.evaluate(() => [...document.querySelectorAll('.mmtalk-choice')].map((b) => b.textContent)), ['うん、リベルナから来たよ', 'ミストリアは初めてで少し緊張してる'], '意味の違う2択');
    await choose(pg, si ? 'b' : 'a');
    const mi = await readTalk(pg);
    assert.match(mi[0].full, si ? /私も初めて来たときはドキドキ/ : /アステリア地方の西のほう/, '選んだ返答');
    const atMis = mi.find((x) => /ここがミストリア/.test(x.full));
    assert.ok(org[org.length - 1].map && org[org.length - 1].map.on.includes('liberna') && org[org.length - 1].map.notes.includes('出身地'), `リベルナ＝出身地の印 ${JSON.stringify(org[org.length - 1].map)}`);
    assert.ok(atMis && atMis.map.focus === 'mistoria' && atMis.map.notes.includes('現在地'), 'ミストリア＝現在地');
    assert.match(mi.map((x) => x.full).join('|'), /世界地図は、聖獣士管理局でいつでも見られる/);
    await pg.waitForFunction(() => !document.querySelector('.wmap'), null, { timeout: 5000 });
    // 町で世界地図の解放（地図の印と文字だけ・会話の枠なし）→ その後にリュウ
    await pg.waitForFunction(() => MMNOTE.log().some((x) => x.title === '世界地図が使えるようになった'), null, { timeout: 8000 });
    assert.equal(await pg.evaluate(() => !!document.querySelector('.mmtalk:not(.mmtalk-out)')), false, '解放の帯の間は会話窓なし');
    assert.ok(await pg.evaluate(() => !!document.querySelector('#app>.map.town')), '解放の帯は町で');
    assert.equal((await H.storedSave(pg)).npcFlags.worldMap, 1);
    // 2026-10-12 F 案（試遊用の仮の台詞）：リュウ＋3択（リュウの一言だけ分岐）→ 共通 → 先に出発
    await nextTalk(pg, mi[mi.length - 1].full);
    const ry = await readTalk(pg);
    assert.ok(ry.some((x) => x.npc === 'ryu' && x.name === 'リュウ') && ry.some((x) => x.npc === 'fina'), 'リュウとフィナの会話');
    assert.deepEqual(ry[ry.length - 1].choices, ['a', 'b', 'c'], '返答の3択');
    assert.match(ry.map((x) => x.full).join('|'), /あれ？ フィナじゃないか.*君が今日登録した新人.*初対面からそんな言い方しないの.*同じ町の出身.*俺はリュウ。ま、顔くらい/);
    await choose(pg, si ? 'c' : 'a');
    const ry2 = await readTalk(pg);
    const rj = ry2.map((x) => x.full).join('|');
    assert.match(rj, si ? /^自信じゃないさ/ : /^へえ、言うじゃん/, '選んだ返答（リュウの一言）');
    assert.doesNotMatch(rj, si ? /言うじゃん|その度胸/ : /自信じゃないさ|その度胸/, 'ほかの返答は出ない');
    assert.match(rj, /Sランクまで駆け上がって.*はじまりの草原.*じゃあな.*昔からああなの.*負けてられないね/, '共通の会話');
    assert.doesNotMatch(ry.concat(ry2).map((x) => x.full).join('|'), /同じように旅してるリュウ/);
    await pg.waitForSelector('.map.town');
    assert.equal((await H.storedSave(pg)).npcFlags.ryuMet, 1, 'リュウの初対面は1回だけ');
    const S2 = await H.storedSave(pg);
    assert.equal(S2.npcFlags.op, 'done'); assert.equal(S2.npcFlags.worldMap, 1);
    assert.deepEqual([S2.g, S2.inv.bag.length], [1000, 1], '支援は1回だけ（二重に受け取らない）');
    const ps2 = await pins(pg);
    assert.deepEqual(ps2.filter((x) => x.go).map((x) => x.on), ['market()'], '最初の相棒＝市場を案内');
    assert.ok(ps2.every((x) => !x.dis), '登録のあとは自由に動ける');
    // 2026-10-06（S-1）：登録のあとは下のバー（ベースキャンプ・プロフィール・セーブ／ロード）とお知らせも押せる（以前は opOn() で止めたままだった）
    assert.deepEqual((await pg.evaluate(() => [...document.querySelectorAll('#app .tbar button, #app .tnews')].map((b) => [b.getAttribute('onclick'), b.disabled, b.classList.contains('oplk')]))).filter((x) => x[1] && x[0] !== 'hall()' || x[2]), [], '下のバー・お知らせは押せる（ベースキャンプは連れている子がいないときだけ押せない＝従来どおり）');
    assert.equal(await pg.evaluate(() => document.querySelectorAll('#app .tbar button').length), 3, '下のバーは3つ');
    await pg.click('#app .tbar button[onclick="profileScr()"]'); await pg.waitForFunction(() => !document.querySelector('.map.town'));
    assert.ok(await pg.evaluate(() => /プロフィール/.test(document.querySelector('#app').innerText)), 'プロフィールへ移れる');
    await pg.evaluate(() => lobby()); await pg.waitForSelector('.map.town');
    // 管理局の常設「世界地図」
    await pg.click('.tpin[onclick="townGuild()"]');
    await pg.waitForSelector('.bumap');
    await pg.click('.bumap'); await pg.waitForSelector('.wmap.view.in');
    assert.deepEqual(await pg.evaluate(() => [...document.querySelectorAll('.wmap .wm-pin.on')].map((e) => e.dataset.spot).sort()), ['liberna', 'mistoria']);
    assert.ok(await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), '横にはみ出さない');
    await pg.click('.wm-x'); await pg.waitForFunction(() => !document.querySelector('.wmap'));
    // 再読み込みしても序盤はくり返さない
    await pg.reload(); await pg.waitForFunction(() => typeof window.MMP8 === 'object'); await pg.click('.p15start'); await pg.waitForSelector('.map.town'); await pg.waitForTimeout(800);
    assert.equal(await pg.$('.mmtalk'), null, '再読み込みで序盤の会話は出ない');
    assert.deepEqual(await pg.evaluate(() => [S.g, S.inv.bag.length]), [1000, 1], '再読み込みしても支援を二重に受け取らない');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

T('OP-B3（2026-10-06）：新人支援は1回だけ。登録の直後（支援の会話の前・途中）に再読み込み → 受け取っていなければ1回だけ受け取る／受け取っていれば会話も受け取りも出ない', async () => {
  for (const got of [false, true]) {
    const sv = { v: 6 }; const p = await openPage({ opening: true }); const pg = p.page;
    await pg.evaluate((got) => { S = p10NewSave(); S.playerName = 'ミナト'; delete S.playerNamePending; finaFlags().op = 'map'; if (got) { finaFlags().support = 1; S.g = 1000; MMP7.bagAdd(S, 'potato', 10); } save(); }, got);
    await pg.reload(); await pg.waitForFunction(() => typeof window.MMP8 === 'object'); await pg.click('.p15start');
    await pg.waitForSelector('.mmtalk:not(.mmtalk-out)');
    const t = await readTalk(pg);
    if (got) assert.doesNotMatch(t.map((x) => x.full).join('|'), /支援/, '受け取り済みなら支援の会話を出さない');
    else assert.match(t.map((x) => x.full).join('|'), /新人の聖獣士には、管理局から旅立ちの支援/);
    assert.deepEqual(await pg.evaluate(() => [S.g, S.inv.bag.map((i) => i.id), finaFlags().support]), [1000, ['potato'], 1], `二重に受け取らない（${got}）`);
    await pg.reload(); await pg.waitForFunction(() => typeof window.MMP8 === 'object');
    assert.deepEqual(await pg.evaluate(() => [S.g, S.inv.bag.length]), [1000, 1], 'もう一度読み込んでも同じ');
    assert.deepEqual(p.errors, []);
    void sv;
  }
});

T('OP-B4（2026-10-12）：管理局を出たあと（op town）に閉じた → 次は町の世界地図から（支援は受け取らない）／地図の会話を見たあと（worldMap 1）に閉じた → 解放の帯だけ → リュウ。解放・リュウは1回だけ', async () => {
  for (const seen of [false, true]) {
    const p = await openPage({ opening: true }); const pg = p.page;
    await pg.evaluate((seen) => { S = p10NewSave(); S.playerName = 'ミナト'; delete S.playerNamePending; const f = finaFlags(); f.op = 'town'; f.support = 1; S.g = 1000; MMP7.bagAdd(S, 'potato', 10); if (seen) f.worldMap = 1; save(); }, seen);
    await pg.reload(); await pg.waitForFunction(() => typeof window.MMP8 === 'object'); await pg.click('.p15start');
    if (!seen) {
      await pg.waitForSelector('.mmtalk:not(.mmtalk-out)');
      assert.ok(await pg.evaluate(() => !!document.querySelector('#app>.map.town')), '町から');
      const t = await readTalk(pg); assert.match(t[0].full, /世界地図を見てみよう/); assert.doesNotMatch(t.map((x) => x.full).join('|'), /支援/);
      await choose(pg, 'a'); await readTalk(pg);
    }
    await pg.waitForFunction(() => MMNOTE.log().some((x) => x.title === '世界地図が使えるようになった'), null, { timeout: 10000 });
    await pg.waitForSelector('.mmtalk:not(.mmtalk-out)', { timeout: 10000 });
    const ry = await readTalk(pg); assert.equal(ry[0].npc, 'ryu', `リュウ（${seen}）`);
    await choose(pg, 'b'); const r2 = await readTalk(pg); assert.match(r2[0].full, /いいね、その度胸/);
    await pg.waitForSelector('.map.town'); await pg.waitForTimeout(500);
    const sv = await H.storedSave(pg);
    assert.deepEqual([sv.npcFlags.op, sv.npcFlags.worldMap, sv.npcFlags.ryuMet, sv.g, sv.inv.bag.length], ['done', 1, 1, 1000, 1]);
    assert.equal(await pg.evaluate(() => MMNOTE.log().filter((x) => x.title === '世界地図が使えるようになった').length), 1, '解放の帯は1回');
    await pg.reload(); await pg.waitForFunction(() => typeof window.MMP8 === 'object'); await pg.click('.p15start'); await pg.waitForSelector('.map.town'); await pg.waitForTimeout(900);
    assert.equal(await pg.$('.mmtalk'), null, 'もう一度読み込んでも序盤は出ない');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  }
});

T('OP-B2：登録済みの古いセーブ（序盤の記録なし）では序盤の導線を出さない。街の札はすべて押せる', async () => {
  const p = await openPage({ opening: true }); const pg = p.page;
  await pg.evaluate(() => { const s = MMP8.newSave(); delete s.playerNamePending; s.playerName = 'ふるい'; localStorage.setItem('mr4v6', JSON.stringify(s)); });
  await pg.reload(); await pg.waitForFunction(() => typeof window.MMP8 === 'object');
  await pg.click('.p15start'); await pg.waitForSelector('.map.town'); await pg.waitForTimeout(900);
  assert.equal(await pg.$('.mmtalk'), null);
  assert.ok((await pins(pg)).every((x) => !x.dis && !/townGuild/.test(x.go ? x.on : '')));
  assert.equal(await pg.$('.tpin.opgo[onclick="townGuild()"]'), null);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

for (const size of SIZES) {
  T(`ST-B1（${size.join('×')}）：正式ステータス画面＝名前・英字名・種類・固有スキル・レーダーと6能力の棒（999 まで）。Lv・経験値・個体ランクは出さない。画面に収まる`, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await H.newGame(pg, 'テスト');
    for (const [sp, skill, en] of [[0, '逆境のひと踏ん張り', 'SORAMO'], [1, '紅翼の猛攻', 'GAURU'], [2, 'ふしぎな嗅覚', 'NOBITON'], [3, '大地の守り', null]]) {
      await pg.evaluate((sp) => { const m = mk(sp < 2 ? sp : 0); m.sp = sp; m.name = 'あいぼう'; MMP7.ensureProg(m); m.po = 321; S.m = m; save(); hall('st'); }, sp);
      await pg.waitForSelector('.sts .stradar, .sts svg');
      const r = await pg.evaluate(() => {
        const t = document.querySelector('.sts').innerText, bars = [...document.querySelectorAll('.sts .stb')];
        return { t, n: bars.length, po: (document.querySelector('.sts .stb[data-k="po"] .stbg i') || {}).style.width, en: (document.querySelector('.sts .sten') || {}).textContent || null, sw: document.documentElement.scrollWidth, W: innerWidth,
          over: [...document.querySelectorAll('.sts .stcard, .sts .sthd')].map((e) => e.getBoundingClientRect()).some((b) => b.left < -1 || b.right > innerWidth + 1) };
      });
      assert.equal(r.n, 6, '6能力');
      assert.equal(r.po, `${(321 / 999 * 100).toFixed(1)}%`, '棒は 999 を最大とした絶対の目盛り');
      assert.ok(r.t.includes(skill), `固有スキル ${skill}`); assert.ok(r.t.includes('あいぼう'));
      assert.equal(r.en, en, '英字名（ジオルは未確定＝出さない）');
      assert.doesNotMatch(r.t, /Lv|LV|レベル|経験値|EXP|ランク/, 'Lv・経験値・個体ランクは無い');
      assert.ok(r.sw <= r.W + 1 && !r.over, '横にはみ出さない');
    }
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });

  T(`DK-B1（${size.join('×')}）：Chapter の操作欄（START）は下に寄りすぎない＝ボタンの下に余白がある`, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await H.newGame(pg, 'テスト');
    await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); save(); board(); });
    await pg.waitForSelector('#chf .chf-bg'); await pg.waitForSelector('#brollbtn');
    const r = await pg.evaluate(() => { const b = document.querySelector('#brollbtn').getBoundingClientRect(), d = document.querySelector('.chdeck').getBoundingClientRect(); return { bb: b.bottom, bt: b.top, dt: d.top, db: d.bottom, H: innerHeight }; });
    assert.ok(r.db <= r.H + 1 && r.dt > r.H * 0.65, `操作欄は画面の下（${JSON.stringify(r)}）`);
    assert.ok(r.H - r.bb >= 12, `START の下に余白（${Math.round(r.H - r.bb)}px）`);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

T('MO-B1：短いイベント＝最初の相棒を迎えた直後にフィナの吹き出し（1回だけ）。2体目では出ない・初めての公式大会の最初にフィナの説明（1回だけ）', async () => {
  const p = await openPage({ npc: true }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { S.g = 2000; save(); adopt(0, 'いちばん'); });
  await H.finishTalk(pg);   // カレン（購入成功）
  await pg.waitForSelector('.map.town');
  await pg.waitForFunction(() => { const s = window.MMNPC && MMNPC.state(); return !!s && /最初の相棒/.test(s.full); }, null, { timeout: 5000 });
  assert.match(await pg.evaluate(() => MMNPC.state().full), /いちばんが、最初の相棒だね/);
  await H.finishTalk(pg);
  assert.equal((await H.storedSave(pg)).npcFlags.moment.partner, 1);
  await pg.evaluate(() => adopt(1, 'にばん')); await H.finishTalk(pg); await pg.waitForSelector('.map.town'); await pg.waitForTimeout(900);
  assert.equal(await pg.$('.mmtalk'), null, '2体目では出ない');
  // 初めての公式大会（大会進行の最初）
  await pg.evaluate(() => { const m = S.m; MMP7.ensureProg(m); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); MMP8.startTournament(S, m, 0, 7); save(); board(); });
  await pg.waitForFunction(() => { const s = window.MMNPC && MMNPC.state(); return !!s && /初めての公式大会/.test(s.full); }, null, { timeout: 5000 });
  await H.finishTalk(pg);
  await pg.evaluate(() => board()); await pg.waitForTimeout(1300);
  assert.equal(await pg.$('.mmtalk'), null, '2回目は出ない');
  assert.equal((await H.storedSave(pg)).npcFlags.moment.tour, 1);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

T('PRO-B3（S-2）：プロローグの途中でアプリが裏に回ったら進まない（裏で最後まで進んで「見た」が保存されない）→ タスクキル相当（再読み込み）→ 次の起動でもプロローグから', async () => {
  const p = await openPage({ opening: true, prologue: true }); const pg = p.page;
  await pg.click('.p15start');
  await pg.waitForSelector('.mmpro .mmpro-u', { timeout: 20000 });
  // 裏に回す（document.hidden＝true・visibilitychange）。時間を早送りしても最後まで進まない
  await pg.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  const t0 = await pg.evaluate(() => document.querySelector('.mmpro .mmpro-u').textContent);
  await pg.waitForTimeout(9000);
  const st = await pg.evaluate(() => ({ open: !!document.querySelector('.mmpro'), saved: !!(JSON.parse(localStorage.getItem('mr4v6')).npcFlags || {}).prologue }));
  assert.deepEqual(st, { open: true, saved: false }, '裏の間は進まず・「見た」は保存しない');
  const t1 = await pg.evaluate(() => document.querySelector('.mmpro .mmpro-u') && document.querySelector('.mmpro .mmpro-u').textContent);
  assert.ok(t1 === t0 || t1, '同じ場面のまま（せいぜい1段落）');
  await pg.reload(); await pg.waitForFunction(() => typeof window.MMP8 === 'object');
  await pg.click('.p15start');
  await pg.waitForSelector('.mmpro .mmpro-u', { timeout: 20000 });
  assert.equal(await pg.evaluate(() => !!document.querySelector('.map.town,#p11nm')), false, '街・登録へ飛ばない');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

T('PRO-B4（2026-10-06）：プロローグの途中で裏に回って戻る → 映像の時計は止まって続きから（Scene 3 は時計の 15.161秒）。2026-10-06 重大修正：プロローグ BGM は鳴らない（裏から戻っても鳴り出さない）', async () => {
  const p = await openPage({ opening: true, prologue: true }); const pg = p.page;
  await pg.evaluate(() => { window.__bg = []; new MutationObserver(() => { const on = document.querySelector('.mmpro .mmpro-bg.on'); const k = on ? (/prologue_(\d\d)/.exec(on.style.backgroundImage) || [])[1] : null; if (k && k !== window.__last) { window.__last = k; window.__bg.push([k, performance.now(), window.MMPRO ? MMPRO.clock() : null]); } }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style'] }); });
  await pg.click('.p15start');
  await pg.waitForFunction(() => (window.__bg || []).some((x) => x[0] === '02'), null, { timeout: 30000 });
  await pg.waitForTimeout(1500);
  await pg.evaluate(() => { window.__hid = true; Object.defineProperty(document, 'hidden', { configurable: true, get: () => !!window.__hid }); document.dispatchEvent(new Event('visibilitychange')); });
  await pg.waitForTimeout(500);
  const hid = await pg.evaluate(() => ({ c: MMPRO.clock(), bg: window.__last }));
  await pg.waitForTimeout(5000);
  const still = await pg.evaluate(() => ({ c: MMPRO.clock(), bg: window.__last }));
  assert.ok(Math.abs(still.c - hid.c) < 60 && still.bg === hid.bg, `裏の間は映像が進まない ${JSON.stringify([hid, still])}`);
  await pg.evaluate(() => { window.__hid = false; document.dispatchEvent(new Event('visibilitychange')); });
  await pg.waitForFunction(() => (window.__bg || []).some((x) => x[0] === '03'), null, { timeout: 30000 });
  const e3 = await pg.evaluate(() => window.__bg.find((x) => x[0] === '03'));
  assert.ok(e3[2] != null && Math.abs(e3[2] - 16100) < 300, `戻ったあとも Scene 3 は時計の 16.1秒（2026-10-08：各 Scene を延長）（実測 ${e3[2]}）`);
  const a = await pg.evaluate(() => ({ active: MMAUDIO.status().slots.filter((x) => x.active).length, pro: MMAUDIO.registryOf('bgm').PROLOGUE.silent, scene: MMAUDIO.status().scene }));
  assert.ok(a.active <= 1 && a.pro === true && /^PROLOGUE_[34]$/.test(a.scene), `2026-10-07：Scene ごとの曲（旧1曲の PROLOGUE は無音のまま）・裏から戻っても二重に鳴らない ${JSON.stringify(a)}`);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

for (const size of SIZES) {
  T(`EVS-B1（${size.join('×')}・S-3）：施設の初回イベント（牧場＝ニック）・ベースキャンプの帰還（ダン）は、施設の背景＋大型の NPC＋会話だけ。通常の一覧・モンスター・コマンドは隠れ、終わると戻る`, async () => {
    const p = await openPage({ size, npc: true }); const pg = p.page;
    await H.newGame(pg, 'テスト');
    await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; S.box = [mk(1)]; save(); farm(); });
    await pg.waitForSelector('.mmtalk:not(.mmtalk-out)'); await pg.waitForTimeout(500);
    const during = await pg.evaluate(() => ({ app: getComputedStyle(document.querySelector('#app')).visibility, grid: !!document.querySelector('#app .rngrid'), bg: !!document.querySelector('.mmtalk .mmtalk-scenebg'), bgImg: getComputedStyle(document.querySelector('.mmtalk .mmtalk-scenebg')).backgroundImage }));
    assert.equal(during.app, 'hidden', '下の画面（一覧・コマンド・モンスター）は隠れる'); assert.ok(during.grid, '一覧そのものは消さない（戻すため）'); assert.ok(during.bg && /ranch_main/.test(during.bgImg), '会話の後ろは牧場の正式背景');
    await H.finishTalk(pg); await pg.waitForTimeout(300);
    assert.equal(await pg.evaluate(() => getComputedStyle(document.querySelector('#app')).visibility), 'visible', '終わったら戻る');
    // ベースキャンプの帰還（ダン）
    await pg.evaluate(() => { const m = S.m; Object.assign(m.raise, { state: 'farm', ch: 2, log: [{ ch: 1, reachedGoal: true, turnsUsed: 20, turnLimit: 30, declined: true }] }); save(); hall('t'); });
    await pg.waitForSelector('.mmtalk:not(.mmtalk-out)', { timeout: 8000 }); await pg.waitForTimeout(500);
    assert.deepEqual(await pg.evaluate(() => [getComputedStyle(document.querySelector('#app')).visibility, /basecamp_main/.test(getComputedStyle(document.querySelector('.mmtalk .mmtalk-scenebg')).backgroundImage)]), ['hidden', true]);
    await H.finishTalk(pg); await pg.waitForTimeout(300);
    assert.equal(await pg.evaluate(() => getComputedStyle(document.querySelector('#app')).visibility), 'visible');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}
