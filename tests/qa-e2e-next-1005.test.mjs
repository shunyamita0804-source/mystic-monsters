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
async function readTalk(pg, max = 40) {
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
    await pg.waitForSelector('.opbu');
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
    await nextTalk(pg, done[done.length - 1].full);
    const nm = await readTalk(pg);
    assert.match(nm[0].full, /ミナトさん、っていうんだね/, 'フィナが初めて名前を呼ぶ');
    await nextTalk(pg, nm[nm.length - 1].full);
    const org = await readTalk(pg);
    assert.match(org[0].full, /フェルナ地方の出身/); assert.ok(await pg.$('.wmap.guide'), '世界地図が出る');
    assert.equal(org[0].map.focus, 'ferna');
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
    const ps2 = await pins(pg);
    assert.deepEqual(ps2.filter((x) => x.go).map((x) => x.on), ['market()'], '最初の相棒＝市場を案内');
    assert.ok(ps2.every((x) => !x.dis), '登録のあとは自由に動ける');
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
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

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
