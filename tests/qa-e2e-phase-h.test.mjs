// =========================================================
// QA（実ブラウザ）：2026-10-04 PHASE H（正式デザインの統合・施設の作り直し）。390×844・375×667
//  H-A：ベースキャンプ（未育成・Chapter間）：名札・所持金・メニュー・音／ダン＋育成中の個体＋一言／次の Chapter＋「冒険」／下の1列5つが画面に収まる・横にはみ出さない
//  H-B：牧場20体：一覧だけがスクロール（ページ・下のボタンは動かない）・20体で預けられない・名前変更・売却（2度押し）・合体のボタンは無い
//  H-C：聖獣士管理局：街の札から入る・聖獣士証の値はセーブのまま・功績一覧・街へ戻る
//  H-D：NPC の立ち絵の規格：主要 NPC の顔の位置（頭の上）がフィナと同じ高さ・表情を変えても器が跳ねない
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
const inView = (pg, sel) => pg.evaluate((s) => [...document.querySelectorAll(s)].map((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.left >= -1 && r.right <= innerWidth + 1 && r.top >= -1 && r.bottom <= innerHeight + 1; }), sel);

for (const size of SIZES) {
  T(`H-A（${size.join('×')}）：ベースキャンプ：上・中央・冒険・下の1列5つが画面に収まる（未育成＝街へ戻る／Chapter間＝中断・育成放棄はメニュー）`, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await H.newGame(pg, 'アルト');
    await pg.evaluate(() => { const m = mk(1); m.name = 'ガウ'; MMP7.ensureProg(m); S.m = m; S.trainTix = 2; save(); hall(); });
    await pg.waitForSelector('.fm.bc .bcbar'); await pg.waitForTimeout(500);
    const a = await pg.evaluate(() => ({ plq: document.querySelector('.bcplq').textContent.trim(), gold: document.querySelector('.bcgold').textContent.replace(/\s+/g, ''), ch: document.querySelector('.bcch').textContent.replace(/\s+/g, ' ').trim(),
      go: document.querySelector('.bcgo .fmgo b').textContent.trim(), sub: (document.querySelector('.bcgo .fmgo .bcsub') || {}).textContent, cmd: [...document.querySelectorAll('.bcbar .bcb')].map((b) => b.querySelector('span').textContent), tix: document.querySelector('.bctix'),
      name: document.querySelector('.bcname').textContent, sw: document.documentElement.scrollWidth, text: document.querySelector('#app').innerText }));
    assert.equal(a.plq, 'ベースキャンプ'); assert.equal(a.gold, `${await pg.evaluate(() => S.g)}G`); assert.match(a.ch, /Chapter 1\s*はじまりの草原/); assert.equal(a.go, '出発する'); assert.match(a.sub || '', /CHAPTER 1/);
    assert.deepEqual(a.cmd, ['特訓', 'アイテム', 'ステータス', '技管理', '街へ戻る']); assert.equal(a.tix, null, '特訓チケットの札は出さない（2026-10-06）'); assert.match(a.name, /ガウ/);
    assert.doesNotMatch(a.text, /ファーム|育成を始める|育成準備中/); assert.equal(a.sw, size[0], '横にはみ出さない');
    assert.ok((await inView(pg, '.bcbar .bcb, .bcgo .fmgo, .bchd .bcrb, .bcplq, .fmmon, .bcname')).every(Boolean), '主な部品はすべて画面の中');
    assert.ok(await pg.evaluate(() => { const g = document.querySelector('.bcgo .fmgo').getBoundingClientRect(), b = document.querySelector('.bcbar').getBoundingClientRect(), mn = document.querySelector('.bcmonw').getBoundingClientRect(); return !document.querySelector('.fmdan,.kdan') && b.top - g.bottom >= 24 && Math.abs((mn.left + mn.right) / 2 - innerWidth / 2) < 8; }), '2026-10-06：ダンの常設なし・モンスターが中央の主役・「出発する」は下のバーから少し上（24px 以上）');
    // 冒険 → 出発準備（従来の prepScr）
    await pg.click('.bcgo .fmgo'); await pg.waitForSelector('button[onclick="p7Depart(this)"]');
    // Chapter間：5つ目は中断・育成放棄はメニュー
    await pg.evaluate(() => { const m = S.m; MMP8.depart(S, m, () => 0.4); Object.assign(m.raise, { state: 'farm', ch: 2, node: null, log: [{ ch: 1, reachedGoal: true }] }); save(); hall('t'); });
    await pg.waitForSelector('.fm.bc.fm-farm'); await pg.waitForTimeout(400); await H.finishTalk(pg).catch(() => {});
    assert.deepEqual(await pg.evaluate(() => [...document.querySelectorAll('.bcbar .bcb span')].map((s) => s.textContent)), ['特訓', 'アイテム', 'ステータス', '技管理', '中断']);
    assert.equal(await pg.evaluate(() => document.querySelectorAll('#app [onclick*="lobby("]').length), 0, '育成中は街へ戻れない');
    await pg.click('.bcrb[onclick="bcMenu()"]'); await pg.waitForSelector('#p9ov .fmab');
    assert.ok((await inView(pg, '#p9ov .fmab')).every(Boolean)); await pg.evaluate(() => p9MenuClose());
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });

  T(`H-B（${size.join('×')}）：牧場8体：一覧だけがスクロール・8体で預けられない・名前変更・売却（2度押し）・合体は無い`, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await H.newGame(pg, 'アルト');
    await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; for (let i = 0; i < 8; i++) { const x = mk(i % 2); x.name = 'M' + i; MMP7.ensureProg(x); S.box.push(x); } save(); farm(); });
    await pg.waitForSelector('.rn2 .rngrid'); await pg.waitForTimeout(500); await H.finishTalk(pg).catch(() => {});
    const a = await pg.evaluate(() => { const g = document.querySelector('.rngrid'); return { cnt: document.querySelector('.rncnt').textContent.replace(/\s+/g, ''), cells: g.querySelectorAll('.rnc').length, cols: getComputedStyle(g).gridTemplateColumns.split(' ').length, scroll: g.scrollHeight > g.clientHeight,
      page: document.documentElement.scrollHeight, act: [...document.querySelectorAll('.rnact .rna span')].map((s) => s.textContent), fuse: /合体|Fuse/.test(document.querySelector('#app').innerText), sw: document.documentElement.scrollWidth }; });
    assert.equal(a.cnt, '8/8'); assert.equal(a.cells, 8); assert.equal(a.cols, 2);   /* 2026-10-06：牧場は8体（一覧はスクロールできる器のまま） */ assert.equal(a.page, size[1], 'ページはスクロールしない');
    assert.deepEqual(a.act, ['見る', '名前変更', '預ける', '売る']);   /* 2026-10-06：最初は連れている子を選ぶ＝預ける */ assert.equal(a.fuse, false, '牧場に合体は無い'); assert.equal(a.sw, size[0]);
    const before = await pg.evaluate(() => document.querySelector('.rnact').getBoundingClientRect().top);
    await pg.evaluate(() => { document.querySelector('.rngrid').scrollTop = 9999; }); await pg.waitForTimeout(200);
    assert.equal(await pg.evaluate(() => document.querySelector('.rnact').getBoundingClientRect().top), before, '下のボタンは動かない');
    assert.ok((await inView(pg, '.rnact .rna')).every(Boolean));
    // 連れている子を選ぶ → 預ける（8体なので押せない）
    await pg.click('.rncur .rnc'); await pg.waitForSelector('.rna[onclick="dep()"]');
    assert.equal(await pg.evaluate(() => document.querySelector('.rna[onclick="dep()"]').disabled), true, '8体のときは預けられない');
    // 名前変更
    await pg.click('.rngrid .rnc[data-uid]'); await pg.waitForTimeout(200);
    const uid = await pg.evaluate(() => rnSel);
    await pg.click('.rna[onclick="farm(\'\',\'n\')"]'); await pg.waitForSelector('#rnnm'); await pg.fill('#rnnm', '<b>ポチ</b>'); await pg.click('.rnren .go');
    await pg.waitForSelector('.rngrid');
    assert.equal(await pg.evaluate((u) => S.box.find((x) => x.uid === u).name, uid), '<b>ポチ</b>'.slice(0, 8), '保存する名前はそのまま（8文字まで）');
    assert.equal(await pg.evaluate((u) => document.querySelector(`.rnc[data-uid="${u}"] b`).textContent, uid), '<b>ポチ</b>'.slice(0, 8), '表示は文字のまま（p11Esc）');
    assert.equal((await H.storedSave(pg)).box.find((x) => x.uid === uid).name, '<b>ポチ</b>'.slice(0, 8), '保存された');
    // 売却（2度押し）
    const g0 = await pg.evaluate(() => S.g);
    await pg.click('.rna.rnsell'); await pg.waitForSelector('.pfsell'); await pg.click('button[onclick="pfSellGo(this)"]');
    assert.equal(await pg.evaluate(() => S.box.length), 8, '1回目は確定しない'); await pg.waitForTimeout(600); await pg.click('button[onclick="pfSellGo(this)"]');
    await pg.waitForSelector('.rngrid'); assert.deepEqual(await pg.evaluate(() => [S.box.length, S.g]), [7, g0 + 50], '未育成は50G');
    // 預けられるようになる
    await pg.click('.rncur .rnc'); await pg.waitForSelector('.rna[onclick="dep()"]'); assert.equal(await pg.evaluate(() => document.querySelector('.rna[onclick="dep()"]').disabled), false);
    await pg.click('.rna[onclick="dep()"]'); await pg.waitForSelector('.rngrid'); assert.deepEqual(await pg.evaluate(() => [S.box.length, S.m]), [8, null]);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });

  T(`H-C（${size.join('×')}）：聖獣士管理局：街の札から入る・聖獣士証の値はセーブのまま・功績一覧・戻る`, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await H.newGame(pg, 'ユウ');
    await pg.evaluate(() => { S.wins = 3; S.br = 1; S.fuseCnt = 2; S.raiseRec = { done: 4, fromStart: true }; save(); lobby(); });
    await pg.waitForSelector('.tpin[onclick="townGuild()"]'); await pg.click('.tpin[onclick="townGuild()"]');
    await pg.waitForSelector('.bu .bucard'); await pg.waitForTimeout(400);
    const rows = await pg.evaluate(() => [...document.querySelectorAll('.burows>div')].map((d) => [d.querySelector('dt').textContent, d.querySelector('dd').textContent.replace(/\s+/g, '')]));
    assert.deepEqual(rows, [['プレイヤー名', 'ユウ'], ['大会到達ランク', 'D'], ['育成完了数', `${await pg.evaluate(() => MMP8.raiseDoneCount(S))}回`], ['合体回数', '2回'], ['発見モンスター数', '2種'], ['大会優勝記録', '3回']]);
    assert.ok((await inView(pg, '.bunav .bub, .buhd .burb')).every(Boolean)); assert.equal(await pg.evaluate(() => document.documentElement.scrollWidth), size[0]);
    assert.doesNotMatch(await pg.evaluate(() => document.querySelector('#app').innerText), /聖獣士登録|聖獣士証を発行/);
    await pg.click('.bub[onclick="bureauScr(\'ach\')"]'); await pg.waitForSelector('.buachw.all');
    const ach = await pg.evaluate(() => [...document.querySelectorAll('.buach li')].map((l) => [l.dataset.ach, l.classList.contains('ok')]));
    const n = await pg.evaluate(() => MMP8.raiseDoneCount(S));
    assert.deepEqual(ach.filter((x) => x[1]).map((x) => x[0]), [...(n >= 1 ? ['raise1'] : []), ...(n >= 5 ? ['raise5'] : []), 'fuse1', 'win1', 'rankE', 'rankD'], '達成＝今のセーブの値から');
    assert.ok(ach.find((x) => x[0] === 'rankC' && !x[1]), 'C 以上は未達成');
    await pg.click('.burb[onclick="lobby()"]'); await pg.waitForSelector('.map.town');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });

  T(`H-D（${size.join('×')}）：NPC の立ち絵の規格：頭の上の位置がフィナとそろう・表情を変えても器の大きさが変わらない`, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await H.newGame(pg, 'アルト');
    const head = async (id, ex) => { await pg.evaluate(([i, e]) => { MMNPC.talk([{ npc: i, expression: e, text: 'テスト' }], {}); }, [id, ex]);
      await pg.waitForFunction(() => { const i = document.querySelector('.mmtalk-fig img'); return i && i.complete && i.naturalWidth > 0; });
      const r = await pg.evaluate(() => { const i = document.querySelector('.mmtalk-fig img'), b = i.getBoundingClientRect(), c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight;
        const x = c.getContext('2d'); x.drawImage(i, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; let top = 0;
        for (let y = 0; y < c.height && !top; y++) for (let k = 0; k < c.width; k++) if (d[(y * c.width + k) * 4 + 3] > 40) { top = y; break; }
        const s2 = getComputedStyle(i).objectFit === 'cover' ? Math.max(b.width / i.naturalWidth, b.height / i.naturalHeight) : Math.min(b.width / i.naturalWidth, b.height / i.naturalHeight);
        return { y: b.top + top * s2, w: b.width, h: b.height }; });   // cover・上寄せ（stand）／contain・下寄せの差は小さい（フィナの半身は器いっぱい）
      await pg.evaluate(() => MMNPC.close()); return r; };
    const fina = await head('fina', 'normal');
    for (const id of ['karen', 'dan', 'nick', 'elliot', 'vargas', 'cedric', 'genshin', 'shop']) {
      const a = await head(id, null), exs = await pg.evaluate((i) => MMNPC.EXPR[i], id);
      assert.ok(Math.abs(a.y - fina.y) <= size[1] * 0.04, `${id}：頭の上の位置（${a.y.toFixed(0)} / フィナ ${fina.y.toFixed(0)}）`);
      for (const e of exs) { const b = await head(id, e); assert.deepEqual([Math.round(b.w), Math.round(b.h)], [Math.round(a.w), Math.round(a.h)], `${id}/${e}：器が跳ねない`); }
    }
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

for (const size of SIZES) {
  T(`H-E（${size.join('×')}）：大会ランク選択は進行で状態が変わる（はじめ：E・D 参加可能＝D が挑戦目標／E クリア後：E クリア済・D 挑戦目標）。未解放は押せない・参加者と試合数が見える・画面に収まる・選んで参加できる`, async () => {
    for (const [clr, want] of [[[0, 0, 0, 0, 0, 0], 'S:lock A:lock B:lock C:lock D:next E:open'], [[1, 0, 0, 0, 0, 0], 'S:lock A:lock B:lock C:lock D:next E:clear']]) {
      const p = await openPage({ size }); const pg = p.page;
      await H.newGame(pg, 'ユウ');
      await pg.evaluate((clr) => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); m.prog.rankClr = clr.map(Boolean); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); board(); }, clr);
      await pg.waitForSelector('.rcv-row', { timeout: 20000 }); await pg.waitForTimeout(600);
      const r = await pg.evaluate(() => ({ st: [...document.querySelectorAll('.rcv-row')].map((x) => RN[+x.dataset.rank] + ':' + x.dataset.state).join(' '), info: [...document.querySelectorAll('.rcv-row')].map((x) => x.querySelector('small').textContent),
        lab: [...document.querySelectorAll('.rcv-row .rcv-st')].map((x) => x.textContent), btns: [...document.querySelectorAll('.rcv-row')].map((x) => x.tagName), sw: document.documentElement.scrollWidth,
        inView: [...document.querySelectorAll('.rcv-row, #p9join, .rcv-dec')].every((e) => { const b = e.getBoundingClientRect(); return b.top >= 0 && b.bottom <= innerHeight + 1 && b.left >= -1 && b.right <= innerWidth + 1; }) }));
      assert.equal(r.st, want);
      assert.deepEqual(r.info, ['参加者 8体 / 7試合', '参加者 8体 / 7試合', '参加者 8体 / 7試合', '参加者 8体 / 7試合', '参加者 6体 / 5試合', '参加者 6体 / 5試合']);
      assert.deepEqual(r.lab.slice(0, 4), ['参加不可', '参加不可', '参加不可', '参加不可']); assert.equal(r.lab[4], '参加可能'); assert.equal(r.lab[5], clr[0] ? 'クリア済' : '参加可能');
      assert.deepEqual(r.btns, ['DIV', 'DIV', 'DIV', 'DIV', 'BUTTON', 'BUTTON'], '未解放は押せない（クリア済の E は再挑戦できる）');
      assert.ok(r.inView, '6段・参加・辞退が画面に収まる'); assert.equal(r.sw, size[0]);
      assert.ok(await pg.evaluate(() => !!document.querySelector('.rcv-row.st-next .rcv-next')), '挑戦目標の札');
      await pg.click('.rcv-row[data-rank="1"]'); await pg.waitForTimeout(500);
      assert.equal(await pg.evaluate(() => document.querySelector('#p9join').disabled), false);
      await pg.click('#p9join'); await pg.waitForFunction(() => S.m.raise.tour && S.m.raise.tour.rank === 1, null, { timeout: 15000 });
      assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
      await p.ctx.close();
    }
  });
}
