// 開発30（2026-10-14）：技管理の横長6枠・技の一覧の正式技カード（実ブラウザ）
//  MCB-1 3サイズ×ガウル／ソラモ：6行が画面の中・絵は正式カード（読み込める・16:9）・▲▼✕は押しやすい大きさ・横はみ出しなし
//  MCB-2 セット（枠 → 一覧 → セット）・▲▼・✕・保存と再読み込みは従来どおり／フィルタ／未習得は伏せカードのまま
//  MCB-3 通常プレイに出ない種族の確認（テストの中だけ SKS を足す＝ノビトン・レグナス）と確認ページの50枚（ジオルを含む）
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as H from './e2e/harness.mjs';
const skip = H.skipReason();
const SIZES = [[375, 667], [390, 844], [430, 932]];
const setup = (pg, sp, sk, eq) => pg.evaluate(({ sp, sk, eq }) => { const m = mk(sp); m.sk = sk; m.eq = eq; S.m = m; MMP7.ensureProg(m); save(); hall('w'); }, { sp, sk, eq });
const eager = (pg) => pg.evaluate(() => Promise.all([...document.querySelectorAll('#app img')].map((i) => { i.loading = 'eager'; return i.decode().catch(() => {}); })));

test('MCB-1：3サイズ×ガウル／ソラモ：横長6行・正式カードの絵・押しやすい大きさ', { skip }, async () => {
  const L = await H.launch();
  try {
    for (const size of SIZES) for (const [sp, sk, eq] of [[1, [10, 11, 12, 13], [11, 12, 10, 13, -1, -1]], [0, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], [0, 3, 7, 5, 8, -1]]]) {
      const { page: pg, errors, bad } = await L.open({ size });
      await H.newGame(pg, 'テスト'); await setup(pg, sp, sk, eq); await eager(pg);
      const r = await pg.evaluate(() => {
        const rows = [...document.querySelectorAll('.drl .mvr')];
        return { vw: innerWidth, sw: document.documentElement.scrollWidth,
          rows: rows.map((e) => { const b = e.getBoundingClientRect(), im = e.querySelector('img.rt'), n = e.querySelector('.rn').getBoundingClientRect();
            return { l: b.left, r: b.right, h: b.height, ms: e.classList.contains('ms'), src: im && im.getAttribute('src'), nw: im && im.naturalWidth, ar: im && (im.getBoundingClientRect().width / im.getBoundingClientRect().height),
              nameIn: n.left >= b.left && n.right <= b.right, btn: [...e.querySelectorAll('button')].map((x) => { const q = x.getBoundingClientRect(); return Math.min(q.width, q.height); }) }; }),
          list: [...document.querySelectorAll('.dskg .dsk:not(.dsq) .dska img')].map((i) => [i.getAttribute('src'), i.naturalWidth]) };
      });
      assert.equal(r.rows.length, 6); assert.equal(r.sw, r.vw, '横はみ出しなし');
      for (const x of r.rows) {
        assert.ok(x.l >= 0 && x.r <= r.vw, '行が画面の中'); assert.ok(x.h >= 60 && x.h <= 84, '行の高さ ' + x.h); assert.ok(x.nameIn);
        for (const b of x.btn) assert.ok(b >= 24, 'ボタン ' + b);
        if (!x.ms) { assert.match(x.src, /^\.\/assets\/moves\/cards_1014\/(solamo|gauru)\//); assert.ok(x.nw > 0, x.src); assert.ok(Math.abs(x.ar - 16 / 9) < 0.05, '16:9 ' + x.ar); }
      }
      assert.ok(r.list.length >= 4); for (const [s, w] of r.list) { assert.match(s, /cards_1014/); assert.ok(w > 0, s); }
      assert.deepEqual(errors, []); assert.deepEqual(bad, []);
    }
  } finally { await L.close(); }
});

test('MCB-2：セット・並び替え・外す・保存と再読み込み・フィルタ・未習得は従来どおり', { skip }, async () => {
  const L = await H.launch();
  try {
    const { page: pg, errors } = await L.open();
    await H.newGame(pg, 'テスト'); await setup(pg, 1, [10, 11, 12, 13], [11, 12, -1, -1, -1, -1]);
    await pg.click('.drl .mvr:nth-child(3)');
    await pg.click('.dskg .dsk:has(img[src*="03_spiral_dive"])');
    await pg.click('#dsh .dput');
    assert.deepEqual((await H.getS(pg)).m.eq.slice(0, 3), [11, 12, 10], 'セット');
    await pg.click('.drl .mvr:nth-child(3) .wmv button:first-child');
    assert.deepEqual((await H.getS(pg)).m.eq.slice(0, 3), [11, 10, 12], '▲');
    await pg.click('.drl .mvr:nth-child(1) button.wx2');
    const eq = (await H.getS(pg)).m.eq; assert.equal(eq[0], -1, '✕');
    await pg.evaluate(() => save()); await pg.reload(); await pg.waitForFunction(() => typeof S === 'object' && S.m);
    assert.deepEqual((await H.getS(pg)).m.eq, eq, '再読み込み');
    await pg.evaluate(() => hall('w'));
    assert.match(await pg.getAttribute('.drl .mvr:nth-child(2) img.rt', 'src'), /gauru\/03_spiral_dive/);
    await pg.click('.dflt button:nth-child(2)');
    const p = await pg.evaluate(() => [...document.querySelectorAll('.dskg .dsk')].map((e) => e.classList.contains('kp')));
    assert.ok(p.length && p.every(Boolean), 'ちから');
    await pg.click('.dflt button:nth-child(1)');
    const lk = await pg.evaluate(() => [...document.querySelectorAll('.dskg .dsk.dsq')].map((e) => [e.querySelector('img').getAttribute('src'), e.querySelector('b').textContent]));
    assert.equal(lk.length, 6, '未習得は6つ'); for (const [s, b] of lk) { assert.match(s, /locked_skill_panel/); assert.equal(b, '？？？'); }
    assert.deepEqual(errors, []);
  } finally { await L.close(); }
});

test('MCB-3：ノビトン・レグナスの10枚（テストの中だけ）・確認ページの50枚（ジオルを含む）＋フルーネの10枚（2026-10-15）', { skip }, async () => {
  const L = await H.launch();
  try {
    for (const size of SIZES) {
      const { page: pg, errors, bad } = await L.open({ size });
      await H.newGame(pg, 'テスト');
      for (const [sp, base, name] of [[2, 30, 'nobiton'], [4, 20, 'regnas']]) {
        await pg.evaluate(({ sp, base }) => { SKS[sp] = Array.from({ length: 10 }, (_, i) => base + i); const m = mk(0); m.sp = sp; m.sk = SKS[sp].slice(); m.eq = SKS[sp].slice(0, 6); S.m = m; hall('w'); }, { sp, base });
        await eager(pg);
        const r = await pg.evaluate(() => ({ rows: [...document.querySelectorAll('.drl .mvr img.rt')].map((i) => [i.getAttribute('src'), i.naturalWidth]), list: [...document.querySelectorAll('.dskg .dska img')].map((i) => [i.getAttribute('src'), i.naturalWidth]), sw: document.documentElement.scrollWidth, vw: innerWidth }));
        assert.equal(r.rows.length, 6); assert.equal(r.list.length, 10, name); assert.equal(r.sw, r.vw);
        assert.equal(new Set(r.list.map((x) => x[0])).size, 10);
        for (const [s, w] of [...r.rows, ...r.list]) { assert.match(s, new RegExp('cards_1014/' + name + '/')); assert.ok(w > 0, s); }
      }
      assert.deepEqual(errors, []); assert.deepEqual(bad, []);
      await pg.goto(L.url + 'prototype/movecards_1014/index.html');
      await pg.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
      const q = await pg.evaluate(() => ({ n: [...document.images].filter((i) => i.naturalWidth > 0).length, bad: document.querySelectorAll('.c.bad').length,
        per: [...document.querySelectorAll('h2')].map((h) => h.textContent), jiol: [...document.querySelectorAll('h2[data-sp="jiol"] + .g img')].map((i) => i.getAttribute('src')), sw: document.documentElement.scrollWidth, vw: innerWidth }));
      assert.equal(q.n, 90, '50枚＋フルーネの10枚（2026-10-15）＋ラズックの10枚（2026-10-17）＋カルシェルの10枚（2026-10-18）＋ミュロルの10枚（2026-10-19）'); assert.equal(q.bad, 0); assert.equal(q.sw, q.vw);
      for (const t of q.per) assert.match(t, /（10 \/ 10）/);
      assert.equal(q.jiol.length, 10); for (const s of q.jiol) assert.match(s, /cards_1014\/jiol\//);
      assert.deepEqual(bad, []);
    }
  } finally { await L.close(); }
});
