// =========================================================
// QA（実ブラウザ）：次期総合改修（2026-10-05）
//  OP-B1：新しいゲームの序盤（プロローグのあと）＝街 → フィナの声かけ（はい／ちがいます＝どちらも管理局へ）→ 聖獣士管理局だけが光って押せる
//         → セルジュの正式登録 → 名前の確認（書き直す／この名前で登録する）→ 登録完了 → フィナが初めて名前を呼ぶ
//         → 出身地の会話と世界地図（フェルナ → アステリア → リベルナ＝出身地 → ミストリア＝現在地）→ 世界地図の解放 → 市場へ（390×844・375×667）
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

for (const [si, size] of SIZES.entries()) {
  T(`OP-B1（${size.join('×')}）：新しいゲームの序盤＝フィナの2択 → 管理局だけ光る → セルジュの登録 → 名前の確認 → 名前を呼ぶ → 出身地と世界地図 → 市場へ。登録前は名前を呼ばない・セーブは v6`, async () => {
    const p = await openPage({ size, opening: true }); const pg = p.page;
    await pg.click('.p15start');
    await pg.waitForSelector('.map.town');
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
    // 2026-10-06：登録完了のすぐあと＝新人支援（セルジュ）。1000G と薬草×1（システム通知は顔・名前なし）。受け取りは会話の前に確定して保存
    await nextTalk(pg, done[done.length - 1].full);
    const sup = await readTalk(pg);
    assert.match(sup.map((x) => x.full).join('|'), /新人聖獣士支援制度.*1000G を受け取った！.*薬草 を1つ受け取った！.*疲れを30回復/, '支援の会話の順');
    assert.ok(['1000G を受け取った！', '薬草 を1つ受け取った！'].every((t) => sup.some((x) => x.full === t && !x.npc && !x.name)), 'システム通知（顔・名前なし）');
    const SS = await H.storedSave(pg);
    assert.deepEqual([SS.g, SS.inv.bag.map((i) => i.id), SS.npcFlags.support], [1000, ['herb'], 1], '1000G・薬草×1・受け取りの記録');
    await nextTalk(pg, sup[sup.length - 1].full);
    const nm = await readTalk(pg);
    assert.match(nm[0].full, /ミナトさん、っていうんだね/, 'フィナが初めて名前を呼ぶ');
    await nextTalk(pg, nm[nm.length - 1].full);
    const org = await readTalk(pg);
    assert.match(org[0].full, /フェルナ地方の出身/); assert.ok(await pg.$('.wmap.guide'), '世界地図が出る');
    assert.equal(org[0].map.focus, 'ferna');
    assert.ok(await pg.evaluate(() => { const v = document.querySelector('.wmap .wm-view').getBoundingClientRect(), i = document.querySelector('.wmap .wm-img').getBoundingClientRect(); return i.left >= v.left - 1 && i.right <= v.right + 1 && i.width <= v.width + 1; }), '2026-10-06：世界地図の全体が見える（寄りすぎない）');
    assert.ok(await pg.evaluate(() => { const r = document.querySelector('.wmap .wm-reg.on[data-spot="ferna"]').getBoundingClientRect(), t = document.querySelector('.mmtalk-win').getBoundingClientRect(); return r.bottom > 0 && r.top < t.top; }), '光っている地点は会話窓・選択肢に隠れない');
    assert.deepEqual(org[org.length - 1].choices, ['a', 'b']);
    await choose(pg, si ? 'b' : 'a');
    const mi = await readTalk(pg);
    const atLib = mi.find((x) => /リベルナ/.test(x.full)), atMis = mi.find((x) => /ここがミストリア/.test(x.full));
    assert.ok(atLib && atLib.map.on.includes('liberna') && atLib.map.notes.includes('出身地'), `リベルナ＝出身地の印 ${JSON.stringify(atLib && atLib.map)}`);
    assert.ok(atMis && atMis.map.focus === 'mistoria' && atMis.map.notes.includes('現在地'), 'ミストリア＝現在地');
    await pg.waitForFunction(() => !document.querySelector('.wmap'), null, { timeout: 5000 });
    await nextTalk(pg, mi[mi.length - 1].full);
    const un = await readTalk(pg);
    assert.match(un.map((x) => x.full).join('|'), /世界地図は、この管理局でいつでも.*市場で最初の相棒/);
    await pg.waitForSelector('.map.town');
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
    await pg.evaluate((got) => { S = p10NewSave(); S.playerName = 'ミナト'; delete S.playerNamePending; finaFlags().op = 'map'; if (got) { finaFlags().support = 1; S.g = 1000; MMP7.bagAdd(S, 'herb'); } save(); }, got);
    await pg.reload(); await pg.waitForFunction(() => typeof window.MMP8 === 'object'); await pg.click('.p15start');
    await pg.waitForSelector('.mmtalk:not(.mmtalk-out)');
    const t = await readTalk(pg);
    if (got) assert.doesNotMatch(t.map((x) => x.full).join('|'), /支援/, '受け取り済みなら支援の会話を出さない');
    else assert.match(t.map((x) => x.full).join('|'), /新人聖獣士支援制度/);
    assert.deepEqual(await pg.evaluate(() => [S.g, S.inv.bag.map((i) => i.id), finaFlags().support]), [1000, ['herb'], 1], `二重に受け取らない（${got}）`);
    await pg.reload(); await pg.waitForFunction(() => typeof window.MMP8 === 'object');
    assert.deepEqual(await pg.evaluate(() => [S.g, S.inv.bag.length]), [1000, 1], 'もう一度読み込んでも同じ');
    assert.deepEqual(p.errors, []);
    void sv;
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

T('PRO-B4（2026-10-06）：プロローグの途中で裏に回って戻る → 映像と PROLOGUE BGM は同じ時間軸で止まって続きから（Scene 3 に切り替わる瞬間の BGM の位置が 15.161秒（正式 v6）からずれない）。BGM はループしない', async () => {
  const p = await openPage({ opening: true, prologue: true }); const pg = p.page;
  await pg.evaluate(() => { window.__bg = []; new MutationObserver(() => { const on = document.querySelector('.mmpro .mmpro-bg.on'); const k = on ? (/prologue_(\d\d)/.exec(on.style.backgroundImage) || [])[1] : null; if (k && k !== window.__last) { window.__last = k; window.__bg.push([k, performance.now(), window.MMAUDIO ? MMAUDIO.bgmTime('PROLOGUE') : null]); } }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style'] }); });
  await pg.click('.p15start');
  await pg.waitForFunction(() => (window.__bg || []).some((x) => x[0] === '02'), null, { timeout: 30000 });
  await pg.waitForTimeout(1500);
  await pg.evaluate(() => { window.__hid = true; Object.defineProperty(document, 'hidden', { configurable: true, get: () => !!window.__hid }); document.dispatchEvent(new Event('visibilitychange')); });
  await pg.waitForTimeout(500);
  const hid = await pg.evaluate(() => ({ t: MMAUDIO.status().slots.find((x) => x.active).time, paused: MMAUDIO.status().slots.find((x) => x.active).paused, bg: window.__last }));
  await pg.waitForTimeout(5000);
  const still = await pg.evaluate(() => ({ t: MMAUDIO.status().slots.find((x) => x.active).time, bg: window.__last }));
  assert.ok(hid.paused && Math.abs(still.t - hid.t) < 0.05 && still.bg === hid.bg, `裏の間は BGM も映像も進まない ${JSON.stringify([hid, still])}`);
  await pg.evaluate(() => { window.__hid = false; document.dispatchEvent(new Event('visibilitychange')); });
  await pg.waitForFunction(() => (window.__bg || []).some((x) => x[0] === '03'), null, { timeout: 30000 });
  const e3 = await pg.evaluate(() => window.__bg.find((x) => x[0] === '03'));
  assert.ok(e3[2] != null && Math.abs(e3[2] - 15.161) < 0.25, `戻ったあとも Scene 3 は BGM の 15.161秒（実測 ${e3[2]}）`);
  const loop = await pg.evaluate(() => { const r = MMAUDIO.registryOf('bgm').PROLOGUE; return [r.loop, MMAUDIO.status().slots.find((x) => x.active && /prologue_bgm/.test(x.src || '')) ? true : false]; });
  assert.deepEqual(loop, [false, true], 'PROLOGUE は1回だけ（ループしない）');
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
