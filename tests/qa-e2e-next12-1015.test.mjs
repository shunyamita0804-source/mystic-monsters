// =========================================================
// 実ブラウザ：2026-10-15 次回便（12項目）の N01〜N03・N05〜N10・N12（N04 は qa-e2e-voice15・dev24／25／27、N11 は tests/flurene-1015.test.mjs）
//  NB-01 技の一覧＝1技1行（3サイズ）：絵が左で大きい・技名は省略しない・右に分類と威力／命中／クリ（補助は「—」）・未習得はロック・横にはみ出さない・タップで詳細
//  NB-02 決着：WIN／LOSE の煙・光の層（.mbfx-end）を出さない・勝った自分は正式の勝利の絵・負けた側は正式 2.5D の「しょんぼり」
//  NB-03 会話の選択肢＝紺の楕円＋金枠（44px 以上）・イベント名の札＝控えめな名札（古い訓練跡）
//  NB-04 Chapter 1 の HUD（4サイズ）：Turn・空腹・G・特訓が横1列で画面の左右いっぱい・切れない・今の Turn の数字はオレンジ
//  NB-05 宝箱：フィナと「見て見て！」なし・宝箱と中身だけ・所持金は1回だけ増える
//  NB-06 運命の分かれ道：案内に左右の矢印（奇数＝左・偶数＝右）・紺の帯の上でサイコロ・出目と進む側を光らせる（奇数／偶数）
//  NB-07 ライバルのマス（A／B／C）：1.25 倍・マスの奥にリュウとレグナスの影（会ったあとは外す）
//  NB-08 バトルの横型ルーレット（追加A）：横長の技カード（16:9 を切らず・伸ばさず大きく・二重の額縁なし）・技名は帯で1行・MISS の板は従来の絵・STOP に重ならない（3サイズ・ソラモ・ガウル・レグナス）
//  NB-09 大会会場の手前（A／B／C）：会場へ続く道のマスは建物に隠れない
//  NB-11 技カードの読み込みが遅いとき（追加A）：旧い絵・空白・途中の絵を出さない
//  NB-10 大会の対戦表の顔＝正式のイラスト6枚（5体＋フルーネのモック）・枠の中・四角のまま（丸くしない）・読めないときの代わり・実際の大会にフルーネは出ない
//  QA_E2E=1 のときだけ実行（tests/e2e/harness.mjs）
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
const SIZES3 = [H.SIZES.se, H.SIZES.base, H.SIZES.max];

/** 世界のボードへ（練習試合・地点の移動の前置き） */
async function toWorld(pg, o = {}) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate((o) => { const m = mk(o.sp || 0); m.name = 'テスト'; if (o.st) Object.assign(m, o.st); if (o.eq) { m.sk = o.eq.slice(); m.eq = o.eq.slice(); } MMP7.ensureProg(m); S.m = m; if (o.g != null) S.g = o.g; if (o.tix != null) S.trainTix = o.tix;
    save(); MMP8.depart(S, m, () => 0.37); S.m.raise.field.introSeen = true; S.npcFlags = S.npcFlags || {}; S.npcFlags.story = Object.assign(S.npcFlags.story || {}, { tut_turns_w: 1, tut_event: 1, tut_treasure: 1, tut_qdie_w: 1, tut_stat: 1 }); save(); board(); }, o);
  await pg.waitForSelector('#wbw #brollbtn', { timeout: 30000 });
  const t0 = Date.now();   // story:true のときはフィナの一言（出発・節目）が出る＝送ってから
  while (Date.now() - t0 < 40000) {
    if (await pg.$('.mmtalk:not(.mmtalk-out)')) { await pg.click('.mmtalk:not(.mmtalk-out)', { force: true }).catch(() => {}); await pg.waitForTimeout(250); continue; }
    if (await pg.evaluate(() => !bBusy && !document.querySelector('.wbrelay,.mmtalk,.d3z'))) break;
    await pg.waitForTimeout(250);
  }
  await pg.waitForTimeout(900);
  if (await pg.$('.mmtalk:not(.mmtalk-out)')) for (let i = 0; i < 40 && await pg.$('.mmtalk:not(.mmtalk-out)'); i++) { await pg.click('.mmtalk:not(.mmtalk-out)', { force: true }).catch(() => {}); await pg.waitForTimeout(250); }
  await pg.waitForFunction(() => !bBusy && !document.querySelector('.mmtalk'), null, { timeout: 20000 }); await pg.waitForTimeout(400);
}
/** 地点へ移す（盤の途中状態を作る。セーブの形式は変えない） */
const tele = (pg, node, pend = null, tile = null) => pg.evaluate(([node, pend, tile]) => { const m = S.m, f = m.raise.field; if (tile) { f.tiles[node] = tile; delete f.used[node]; } f.core.node = node; f.core.trail = (f.core.trail || []).concat([node]); f.core.back = null; m.raise.node = node; m.raise.pend = pend; save(); board(); }, [node, pend, tile]);
const idle = (pg) => pg.waitForFunction(() => !bBusy && !document.querySelector('.mmtalk,.d3z,.wbtr,.wbdask'), null, { timeout: 30000 }).then(() => pg.waitForTimeout(400));

for (const size of SIZES3) {
  test(`NB-01（${size.join('×')}）：技の一覧＝1技1行・絵が左で大きい・技名は省略しない・右に分類と数値（補助は「—」）・未習得はロック`, { skip: SKIP, timeout: 120000 }, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await H.newGame(pg, 'テスト');
    for (const [sp, sk] of [[0, [0, 1, 2, 3, 4, 8]], [1, [11, 12, 10, 13, 14, 19]]]) {
      await pg.evaluate(([sp, sk]) => { const m = mk(sp); m.name = 'テスト'; MMP7.ensureProg(m); m.sk = sk.slice(); S.m = m; save(); hall('w'); }, [sp, sk]);
      await pg.waitForSelector('.dskg.n01 .dsk'); await pg.waitForTimeout(400);
      const r = await pg.evaluate(() => {
        const g = document.querySelector('.dskg.n01'), gr = g.getBoundingClientRect();
        return { sw: document.documentElement.scrollWidth <= innerWidth, cols: getComputedStyle(g).gridTemplateColumns.split(' ').length,
          rows: [...g.querySelectorAll('.dsk')].map((e) => { const b = e.querySelector(':scope>b'), im = e.querySelector('.dska'), r = e.getBoundingClientRect(), ir = im.getBoundingClientRect(), st = e.querySelector('.dsr');
            return { nm: b.textContent, lock: e.classList.contains('dsq'), full: Math.abs(r.width - gr.width) < 2, imgL: ir.left - r.left < 14, imgW: ir.width / r.width, nmOk: b.scrollWidth <= b.clientWidth + 1 && b.scrollHeight <= b.clientHeight + 2, stR: st ? st.getBoundingClientRect().left >= ir.right - 1 : false,
              cat: (e.querySelector('.dsc') || {}).textContent || '', vals: [...e.querySelectorAll('.dsp em')].map((x) => x.textContent) }; }) };
      });
      assert.ok(r.sw, '横にはみ出さない'); assert.equal(r.cols, 1, '1列＝1技1行');
      assert.equal(r.rows.length, 10, '10技すべて');
      for (const x of r.rows) {
        assert.ok(x.full && x.imgL && x.stR, `${x.nm}：幅いっぱいの1行・絵は左・数値は右 ${JSON.stringify(x)}`);
        assert.ok(x.imgW > 0.5, `${x.nm}：絵が主役（行の半分より大きい ${x.imgW.toFixed(2)}）`);
        assert.ok(x.nmOk, `${x.nm}：技名は省略しない`);
        if (!x.lock) { assert.match(x.cat, /ちから|かしこさ|補助/); assert.equal(x.vals.length, 3); if (/補助/.test(x.cat)) { assert.equal(x.vals[0], '—'); assert.equal(x.vals[2], '—'); } else assert.match(x.vals[0], /^\d+$/); }
        else assert.equal(x.nm, '？？？');
      }
      assert.ok(r.rows.filter((x) => x.lock).length >= 3, '未習得はロックのカード');
      // タップで詳細（従来どおり）
      await pg.click('.dskg.n01 .dsk:not(.dsq)'); await pg.waitForSelector('#dsh', { state: 'attached', timeout: 5000 });   // #dsh は入れ物（大きさ0）＝中身は詳細のシート
      await pg.evaluate(() => { const d = document.getElementById('dsh'); if (d) d.remove(); });
    }
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

const STRONG = { li: 999, po: 999, in: 999, hi: 999, ev: 999, de: 999 }, WEAK = { li: 10, po: 5, in: 5, hi: 5, ev: 1, de: 5 };
async function toBand(pg, ms = 200000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const d = await pg.evaluate(() => { const g = document.getElementById('go'), bt = document.getElementById('bt'); if (!bt) return 'gone'; const b = bt.querySelector(':scope>#ban'); if (b && /^(WIN!|LOSE)/.test(b.textContent || '')) return 'band'; if (g && !g.disabled && !g.classList.contains('bk') && !bt.classList.contains('mmsk-cut')) g.click(); return ''; }).catch(() => '');
    if (d === 'band') return; if (d === 'gone') throw new Error('バトルが先に閉じた');
    await pg.waitForTimeout(120);
  }
  throw new Error('決着しない');
}
test('NB-02：決着＝煙・光の層なし・勝った自分は正式の勝利の絵・負けた側は正式 2.5D の「しょんぼり」（勝ち／負け）', { skip: SKIP, timeout: 300000 }, async () => {
  for (const c of [{ st: STRONG, fs: 0, want: ['_victory', 'soramo/03_sad'] }, { st: WEAK, fs: 1, want: ['soramo/03_sad', 'idle_gauru'] }]) {
    const p = await openPage({ worldCh1: true }); const pg = p.page;
    await toWorld(pg, { st: c.st });
    await pg.evaluate((fs) => { const m = S.m, r = m.raise; r.pend = { roll: 1, left: 0, stage: 'battle', fx: { kind: 'battle', battleType: 'wild' } }; save(); bBattleRun(m, 'wild', MMP8.practiceRank(m), fs); }, c.fs);
    await pg.waitForSelector('#bt #m0 .mon', { timeout: 20000 });
    await pg.evaluate(() => { window.__fx = 0; new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) if (n.classList && n.classList.contains('mbfx-end')) window.__fx++; }).observe(document.getElementById('bt'), { childList: true, subtree: true }); });
    await toBand(pg); await pg.waitForTimeout(900);
    const v = await pg.evaluate(() => [0, 1].map((s) => [...document.querySelectorAll(`#m${s} .mon img`)].filter((e) => { const c = getComputedStyle(e); return c.visibility !== 'hidden' && +c.opacity > 0 && c.display !== 'none'; }).map((e) => (e.getAttribute('src') || '').split('/').slice(-2).join('/'))));
    assert.equal(await pg.evaluate(() => window.__fx), 0, '決着の煙・光の層（#28・#29）は出さない');
    for (const s of [0, 1]) { assert.equal(v[s].length, 1, `側${s}：見えている絵は1枚 ${v[s]}`); assert.ok(v[s][0].includes(c.want[s]), `側${s}＝${c.want[s]}（${v[s][0]}）`); }
    const lg = await pg.evaluate(() => MMARENA.finLog().pop());
    assert.equal(lg.lose.kind, 'sad');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  }
});

test('NB-03：会話の選択肢＝紺の楕円＋金枠（44px 以上・枠の画像なし）・イベント名＝控えめな名札（古い訓練跡）', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({ worldCh1: true, story: true }); const pg = p.page;
  await toWorld(pg);
  await tele(pg, 'EL01_03', { roll: 1, left: 0, stage: 'resolve' }, { t: 'event', e: 'old_grounds' });
  for (let i = 0; i < 60 && !(await pg.$('.mmtalk-choice')); i++) { if (await pg.$('.mmtalk:not(.mmtalk-out)')) await pg.click('.mmtalk:not(.mmtalk-out)', { force: true }).catch(() => {}); await pg.waitForTimeout(300); }
  await pg.waitForTimeout(500);
  const r = await pg.evaluate(() => ({ ch: [...document.querySelectorAll('.mmtalk-choice')].map((b) => { const c = getComputedStyle(b), r = b.getBoundingClientRect(); return [b.textContent, r.height, c.borderTopLeftRadius, c.borderImageSource, c.borderTopColor]; }),
    cap: (() => { const c = document.querySelector('.wbcard .cap'), f = document.querySelector('.wbcard figure'); if (!c) return null; const s = getComputedStyle(c), fr = f.getBoundingClientRect(), cr = c.getBoundingClientRect(); return [c.textContent, s.backgroundImage, s.color, s.borderRadius, cr.top >= fr.bottom - 20]; })(),
    win: (() => { const w = document.querySelector('.mmtalk-box') || document.querySelector('.mmtalk'), f = document.querySelector('.wbcard figure'); return w && f ? w.getBoundingClientRect().top >= f.getBoundingClientRect().bottom - 2 : null; })() }));
  assert.equal(r.ch.length, 2, '2択');
  for (const [t, h, rad, bi, bc] of r.ch) { assert.ok(h >= 44, `${t}：押せる高さ ${h}`); assert.ok(parseFloat(rad) >= 20, `${t}：楕円 ${rad}`); assert.equal(bi, 'none', '旧い青い枠の画像なし'); assert.equal(bc, 'rgb(224, 184, 97)', '金枠'); }
  assert.ok(r.cap && r.cap[0] === '古い訓練跡' && /name_label_blank/.test(r.cap[1]) && r.cap[2] === 'rgb(29, 36, 66)', `名札 ${JSON.stringify(r.cap)}`);
  await pg.click('.mmtalk-choice >> nth=1'); await pg.waitForTimeout(1500);
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

for (const size of [H.SIZES.se, H.SIZES.android, H.SIZES.base, H.SIZES.max]) {
  test(`NB-04（${size.join('×')}）：HUD の4つ＝横1列で左右いっぱい・切れない・今の Turn はオレンジ`, { skip: SKIP, timeout: 90000 }, async () => {
    const p = await openPage({ size, worldCh1: true }); const pg = p.page;
    await toWorld(pg, { g: 123456, tix: 12 });
    const r = await pg.evaluate(() => { const ch = [...document.querySelectorAll('.wbh .chh-chips>.chip')]; return { W: innerWidth, row: ch.map((c) => { const r = c.getBoundingClientRect(); return [c.className.split(' ')[0], r.left, r.right, r.top, c.scrollWidth <= c.clientWidth + 1, [...c.querySelectorAll('b')].every((b) => b.getBoundingClientRect().right <= r.right + 0.5)]; }), turn: getComputedStyle(document.querySelector('#chturn')).color, g: document.querySelector('#chgold b').textContent, t: document.querySelector('#chtix b').textContent }; });
    assert.deepEqual(r.row.map((x) => x[0]), ['chh-turn', 'chh-fat', 'chh-gold', 'chh-tix'], '4項目の順は従来どおり');
    assert.ok(r.row.every((x) => Math.abs(x[3] - r.row[0][3]) < 1), '横1列');
    assert.ok(r.row[0][1] <= 10 && r.row[3][2] >= r.W - 10 && r.row[3][2] <= r.W, `左右いっぱい ${r.row[0][1]}〜${r.row[3][2]} / ${r.W}`);
    for (const x of r.row) assert.ok(x[4] && x[5], `${x[0]}：省略・はみ出しなし`);
    assert.equal(r.g, '123456'); assert.equal(r.t, '×12');
    assert.equal(r.turn, 'rgb(255, 157, 46)', '今の Turn の数字はオレンジ');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('NB-05：宝箱＝フィナと「見て見て！」なし・宝箱と中身だけ・所持金は1回だけ増える', { skip: SKIP, timeout: 90000 }, async () => {
  const p = await openPage({ worldCh1: true }); const pg = p.page;
  await toWorld(pg, { g: 1000 });
  await tele(pg, 'EL01_04', { roll: 1, left: 0, stage: 'resolve' }, { t: 'treasure', tier: 'normal', gold: 200 });
  await pg.waitForSelector('.wbtr', { timeout: 15000 }); await pg.waitForTimeout(1300);
  const r = await pg.evaluate(() => { const c = document.querySelector('.wbtr-chest'), k = document.querySelector('.wbtr-card'); const cr = c.getBoundingClientRect(), kr = k.getBoundingClientRect(); return { fina: !!document.querySelector('.wbtr-fina,.wbtr-say'), txt: document.querySelector('.wbtr').textContent, chestC: Math.abs((cr.left + cr.right) / 2 - innerWidth / 2), cardC: Math.abs((kr.left + kr.right) / 2 - innerWidth / 2), g: S.g }; });
  assert.equal(r.fina, false); assert.doesNotMatch(r.txt, /見て見て|フィナ/); assert.match(r.txt, /\+200G/);
  assert.ok(r.chestC < 4 && r.cardC < 4, `宝箱と中身は中央 ${r.chestC} ${r.cardC}`);
  assert.equal(r.g, 1200);
  await idle(pg); assert.equal(await pg.evaluate(() => S.g), 1200, '二重に増えない');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('NB-06：運命の分かれ道＝案内に左右の矢印（奇数＝左・偶数＝右）・紺の帯の上でサイコロ・出目と進む側を光らせる', { skip: SKIP, timeout: 150000 }, async () => {
  for (const die of [3, 4]) {
    const p = await openPage({ worldCh1: true, story: true }); const pg = p.page;
    await toWorld(pg);
    await tele(pg, 'Q', { roll: 1, left: 0, stage: 'resolve', evs: [{ type: 'eventDie', at: 'Q', kind: 'Q', die, result: die % 2 ? 'L' : 'R' }] });
    for (let i = 0; i < 40 && !(await pg.$('.wbdask')); i++) { if (await pg.$('.mmtalk:not(.mmtalk-out)')) await pg.click('.mmtalk:not(.mmtalk-out)', { force: true }).catch(() => {}); await pg.waitForTimeout(300); }
    const ask = await pg.evaluate(() => { const a = document.querySelector('.wbdask'); return { h: a.querySelector('h3').textContent, l: (a.querySelector('.wbdlr .l') || {}).textContent, r: (a.querySelector('.wbdlr .r') || {}).textContent, btn: a.querySelector('.wbdgo').textContent }; });
    assert.match(ask.h, /運命の分かれ道/); assert.doesNotMatch(ask.h, /運命のサイコロ/);
    assert.match(ask.l, /←\s*左の道/); assert.match(ask.l, /奇数/); assert.match(ask.r, /右の道\s*→/); assert.match(ask.r, /偶数/);
    assert.equal(ask.btn, 'サイコロを振る');
    await pg.waitForTimeout(400); await pg.click('.wbdgo');
    await pg.waitForSelector('.wbdband', { timeout: 5000 });
    const band = await pg.evaluate(() => { const b = document.querySelector('.wbdband'), r = b.getBoundingClientRect(); return { h: r.height, bg: getComputedStyle(b).backgroundImage.slice(0, 30), sides: [...b.querySelectorAll('.wbds')].map((x) => x.className) }; });
    assert.ok(band.h >= 120, `帯の高さ ${band.h}`); assert.match(band.bg, /gradient/); assert.deepEqual(band.sides, ['wbds l', 'wbds r']);
    await pg.waitForSelector('.wbdband.done', { timeout: 10000 });
    const done = await pg.evaluate(() => { const b = document.querySelector('.wbdband'); return { cls: b.className, n: b.querySelector('.wbdn').textContent }; });
    assert.match(done.cls, die % 2 ? /go-l/ : /go-r/); assert.equal(done.n, `出目 ${die}`);
    await idle(pg);
    const msg = await pg.evaluate(() => (document.querySelector('#bmsg') || {}).textContent || '');
    assert.match(msg, die % 2 ? /奇数 → ← 左の道/ : /偶数 → 右の道 →/);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
    await p.ctx.close().catch(() => {});
  }
});

test('NB-07：ライバルのマス（A／B／C）＝1.25 倍・奥にリュウとレグナスの影・会ったあとは影を外す', { skip: SKIP, timeout: 200000 }, async () => {
  for (const route of ['A', 'B', 'C']) {
    const p = await openPage({ worldCh1: true, route }); const pg = p.page;
    await toWorld(pg);
    const prev = await pg.evaluate(() => { const D = MMWD.dataOf(S.m); const a = D.edges.find((e) => e[1] === 'RIVAL' && e[3] === 'forward'); return a[0]; });
    await tele(pg, prev); await pg.waitForTimeout(2600);
    const r = await pg.evaluate(() => { const t = document.querySelector('.rfw-tile[data-node="RIVAL"]'), mk = document.querySelector('.rfw-mark.rival'), nb = [...document.querySelectorAll('.rfw-tile:not(.big)')].find((x) => x.style.display !== 'none' && x.dataset.node !== 'RIVAL');
      const sc = (e) => { const m = /scale\(([\d.]+)\)/.exec(e.style.transform); return m ? +m[1] : 0; };
      return { big: t.classList.contains('big'), k: t ? sc(t) : 0, nk: nb ? sc(nb) : 0, mark: !!mk, src: mk && mk.getAttribute('src'), behind: mk ? +mk.style.zIndex < +t.style.zIndex : null, vis: mk ? getComputedStyle(mk).display !== 'none' : false }; });
    assert.ok(r.big, `${route}：ライバルのマスは大きい`);
    assert.ok(r.mark && /rival_mark_1015\/rival_silhouette\.webp$/.test(r.src) && r.behind && r.vis, `${route}：影がマスの奥 ${JSON.stringify(r)}`);
    // 会ったあと（rivalMet）は影を外す
    await pg.evaluate(() => { S.m.raise.field.rivalMet = true; save(); board(); }); await pg.waitForTimeout(600);
    assert.equal(await pg.evaluate(() => !!document.querySelector('.rfw-mark.rival')), false, `${route}：会ったあとは影なし`);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
    await p.ctx.close().catch(() => {});
  }
});

test('NB-08（追加A＝N09 の最新版・3サイズ）：バトルの技ルーレット＝横長の技カード（16:9 の正式カードを切らず・伸ばさず大きく・二重の額縁なし）・技名は下の帯で1行・止まったら中央のカード・MISS の板は従来の絵・STOP に重ならない（ソラモ・ガウル・ライバルのレグナス）', { skip: SKIP, timeout: 400000 }, async () => {
  const cases = [{ sp: 0, eq: [2, 0, 1, 3, 4, 8], bt: 'wild', fs: 0, sizes: SIZES3 }, { sp: 1, eq: [18, 11, 12, 10, 13, 19], bt: 'wild', fs: 1, sizes: [H.SIZES.base] }, { sp: 0, eq: [0, 1, 2, 3, 4, 8], bt: 'rival', fs: -1, sizes: [H.SIZES.base] }];
  const read = (pg) => pg.evaluate(() => { const rh = (document.querySelector('#rl .rh') || {}).textContent || '', gr = document.getElementById('go').getBoundingClientRect(), bt = document.getElementById('bt').getBoundingClientRect();
    return { rh, goT: gr.top, W: bt.width, pl: [...document.querySelectorAll('#bt .mmr .pl')].map((e) => { const ic = e.querySelector('.ic'), im = ic && ic.querySelector('img'), nm = e.querySelector('.nm'), r = e.getBoundingClientRect(), ir = im && im.getBoundingClientRect(), cr = ic && ic.getBoundingClientRect();
      return { ms: e.classList.contains('ms'), cd: e.classList.contains('cd'), c: e.classList.contains('c'), cls: ic ? ic.className : '', fit: im ? getComputedStyle(im).objectFit : null, bg: [...e.querySelectorAll('img.bgp')].map((x) => x.getAttribute('src').split('/').pop()),
        box: [r.left, r.right, r.bottom], img: ir ? [im.offsetWidth, im.offsetHeight, ic.offsetWidth, ic.offsetHeight, im.naturalWidth, im.naturalHeight] : null, src: im ? im.getAttribute('src') : null,   // img＝実寸（板の傾き・遠近の影響を受けない）
        nm: nm ? [nm.textContent, nm.scrollWidth <= nm.clientWidth + 1, +getComputedStyle(nm).opacity, nm.getBoundingClientRect().top >= (cr ? cr.bottom - 1 : 0)] : null }; }) }; });
  for (const c of cases) for (const size of c.sizes) {
    const p = await openPage({ worldCh1: true, size }); const pg = p.page;
    await toWorld(pg, { sp: c.sp, eq: c.eq });
    await pg.evaluate((c) => { const m = S.m, r = m.raise; r.pend = { roll: 1, left: 0, stage: 'battle', fx: { kind: 'battle', battleType: c.bt } }; save(); const rk = c.bt === 'rival' ? MMRIVAL.rankFor(m) : MMP8.practiceRank(m); bBattleRun(m, c.bt, rk, c.fs); }, c);
    await pg.waitForSelector('#bt .mmr.cards .pl', { timeout: 30000 });
    await pg.waitForFunction(() => { const g = document.getElementById('go'); return g && !g.disabled && [...document.querySelectorAll('#bt .mmr .pl.cd img')].every((i) => i.complete); }, null, { timeout: 30000 });
    // 回っている間
    let r = await read(pg);
    assert.ok(/^テスト/.test(r.rh), '自分のルーレット');
    assert.equal(r.pl.length, 7); assert.equal(r.pl.filter((x) => x.ms).length, 1, '自分（6技）の MISS の板は1枚（従来どおり）');
    assert.deepEqual(r.pl.filter((x) => x.ms)[0].bg, ['plate_miss_c.webp'], 'MISS の板は従来の絵（No.26）');
    for (const x of r.pl.filter((y) => !y.ms)) {
      assert.ok(x.cd && /\bmvc\b/.test(x.cls) && !/\bcard\b/.test(x.cls), `横長の技カード（${x.src}）`); assert.deepEqual(x.bg, [], '旧い縦長の板の絵（二重の額縁）は使わない');
      assert.equal(x.fit, 'contain'); assert.ok(/cards_1014\//.test(x.src) && x.img[4] === 640, x.src);
      assert.ok(Math.abs(x.img[0] - x.img[2]) <= 1 && Math.abs(x.img[1] - x.img[3]) <= 1, `絵は窓いっぱい（余りなし） ${x.img}`);
      assert.ok(Math.abs(x.img[2] / x.img[3] - 16 / 9) < 0.05, `窓は 16:9（正式カードと同じ比率＝切らない・伸ばさない） ${x.img}`);
      assert.ok(x.nm[1] && x.nm[3], `技名は1行で欠けず、絵の下の帯 ${x.nm}`);
      if (x.box[0] >= 0 && x.box[1] <= r.W) assert.ok(x.nm[2] > 0.9, `画面の中のカードは左右も帯に技名（空の帯を見せない） ${x.nm}`);
      assert.ok(x.box[2] <= r.goT + 1, 'STOP に重ならない');
    }
    // 止まった瞬間（技の演出で隠れる前）：中央のカードが大きく、技名が読める
    await pg.evaluate(() => { window.__lk = 0; const m = document.querySelector('#bt .mmr'); new MutationObserver(() => { if (m.classList.contains('lock') && !window.__lk) { window.__lk = 1; window.__snap = (() => { const e = document.querySelector('#bt .mmr .pl.c'), im = e && e.querySelector('.ic img'), nm = e && e.querySelector('.nm'); return e ? { ms: e.classList.contains('ms'), w: im ? im.getBoundingClientRect().width : 0, h: im ? im.getBoundingClientRect().height : 0, nm: nm ? nm.textContent : null, op: nm ? +getComputedStyle(nm).opacity : 0, fr: getComputedStyle(document.querySelector('#bt .mmr .fr')).display } : null; })(); } }).observe(m, { attributes: true, attributeFilter: ['class'] }); });
    await pg.click('#go');
    await pg.waitForFunction(() => window.__lk === 1, null, { timeout: 8000, polling: 'raf' });
    const sn = await pg.evaluate(() => window.__snap);
    if (sn.ms) assert.equal(sn.fr, 'block', '中央が MISS のときは従来の中央の枠');
    else { assert.ok(sn.w >= r.W * 0.26, `中央のカードの絵が大きい（${Math.round(sn.w)}px／画面 ${r.W}）`); assert.ok(sn.op > 0.9 && sn.nm, `技名が読める ${sn.nm}`); assert.equal(sn.fr, 'none', '技カードには旧い中央の枠を重ねない'); }
    if (c.bt === 'rival') {   // 相手（レグナス）の番：レグナスの正式カード
      let ok = false;
      for (let i = 0; i < 60 && !ok; i++) { const q = await read(pg).catch(() => null); if (q && /レグナス/.test(q.rh) && q.pl.length >= 7 && q.pl.some((x) => x.src)) { ok = true; for (const x of q.pl.filter((y) => !y.ms)) assert.ok(/cards_1014\/regnas\//.test(x.src) && Math.abs(x.img[2] / x.img[3] - 16 / 9) < 0.05, x.src); } else await pg.waitForTimeout(300); }
      assert.ok(ok, 'ライバルの番のルーレット');
    }
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
    await p.ctx.close().catch(() => {});
  }
});

test('NB-09：大会会場の手前（A／B／C）＝会場へ続く道のマスは建物に隠れない', { skip: SKIP, timeout: 300000 }, async () => {
  for (const route of ['A', 'B', 'C']) {
    const p = await openPage({ worldCh1: true, route }); const pg = p.page;
    await toWorld(pg);
    const nodes = await pg.evaluate(() => { const D = MMWD.dataOf(S.m); const back = (id) => D.edges.filter((e) => e[1] === id && e[3] === 'forward').map((e) => e[0]); const out = []; let cur = ['GOAL']; for (let i = 0; i < 7; i++) { const n = back(cur[0]); if (!n.length) break; out.unshift(n[0]); cur = n; } return out; });
    for (const node of nodes) {
      await tele(pg, node); await pg.waitForTimeout(2200);
      const r = await pg.evaluate(() => { const g = document.querySelector('.rfw-goal'); if (!g || g.style.display === 'none') return { hid: [] }; const gr = g.getBoundingClientRect(), gz = +g.style.zIndex;
        return { hid: [...document.querySelectorAll('.rfw-tile')].filter((t) => t.style.display !== 'none' && !t.classList.contains('far')).filter((t) => { const r = t.getBoundingClientRect(); return r.right > gr.left + 10 && r.left < gr.right - 10 && r.bottom > gr.top + 10 && r.top < gr.bottom - 10 && +t.style.zIndex < gz; }).map((t) => t.dataset.node) }; });
      assert.deepEqual(r.hid, [], `${route}・${node}：建物に隠れたマス ${r.hid}`);
    }
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
    await p.ctx.close().catch(() => {});
  }
});

test('NB-10：大会の対戦表の顔＝正式のイラスト6枚（5体＋フルーネのモック）・枠の中・四角のまま（丸くしない）・読めないときの代わり・実際の大会にフルーネは出ない', { skip: SKIP, timeout: 200000 }, async () => {
  for (const size of SIZES3) {
    const p = await openPage({ size }); const pg = p.page;
    await H.newGame(pg, 'テスト');
    await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); board(); });
    await pg.waitForSelector('#chrcv .rcv-row', { timeout: 20000 });
    await pg.evaluate(() => { S.m.raise.ch = 2; MMP7.recordRankClear(S, S.m, 1); const r = MMP8.startTournament(S, S.m, 2, 7); if (!r.ok) throw new Error('start'); save(); board(); });
    await pg.waitForSelector('.tb1 .tbgo', { timeout: 15000 });
    // 実際の大会の参加者にフルーネ（5）はいない
    const real = await pg.evaluate(() => S.m.raise.tour.league.entrants.map((x) => x.sp));
    assert.ok(!real.includes(5), `実際の参加者 ${real}`);
    // モック：参加者の種族を 0〜5 に（保存しない）
    await pg.evaluate(() => { S.m.raise.tour.league.entrants.forEach((x, i) => { if (!x.player) x.sp = (i - 1) % 6; }); board(); });
    await pg.waitForSelector('.tb1 .tbgo'); await pg.waitForTimeout(600);
    await pg.waitForFunction(() => [...document.querySelectorAll('.tb1 img.tbface')].every((i) => i.complete), null, { timeout: 20000 });
    const r = await pg.evaluate(() => ({ faces: [...document.querySelectorAll('.tb1 .tbrw img.tbface')].map((i) => { const b = i.parentElement.getBoundingClientRect(), r = i.getBoundingClientRect(); return { src: i.getAttribute('src').split('/').pop(), ti: i.classList.contains('ti15'), nw: i.naturalWidth, inside: r.left >= b.left - 0.5 && r.right <= b.right + 0.5 && r.top >= b.top - 0.5 && r.bottom <= b.bottom + 0.5, w: b.width }; }), sw: document.documentElement.scrollWidth <= innerWidth }));
    const want = ['icon_gauru.webp', 'icon_nobiton.webp', 'icon_jiol.webp', 'icon_regnas.webp', 'icon_flurene.webp', 'icon_solamo.webp'];
    for (const f of want) assert.ok(r.faces.some((x) => x.src === f && x.ti && x.nw === 256 && x.inside), `${f} が枠の中に ${JSON.stringify(r.faces)}`);
    assert.ok(r.faces.every((x) => x.w >= 16), '読める大きさ'); assert.ok(r.sw);
    // ほかの試合の観戦の帯の枠（モック）：ユーザー指示＝丸くしないで四角のまま・絵は枠いっぱい
    const band = await pg.evaluate(() => { const d = document.createElement('div'); d.className = 'tbvsx'; d.innerHTML = `<span class="tvx-s"><span class="tbic">${tbIcon({ sp: 5 })}</span></span>`; document.getElementById('app').appendChild(d); const im = d.querySelector('img'), c = getComputedStyle(im), b = d.querySelector('.tbic'); const ir = im.getBoundingClientRect(), br = b.getBoundingClientRect(); const out = { cls: im.className, pad: c.paddingTop, fit: c.objectFit, rad: getComputedStyle(b).borderRadius, fill: ir.width >= br.width - 6 && ir.height >= br.height - 6 }; d.remove(); return out; });
    assert.match(band.cls, /ti15/); assert.equal(band.fit, 'cover'); assert.equal(band.pad, '0px'); assert.equal(band.rad, '5px', '四角（角の小さい丸み）'); assert.ok(band.fill, '絵は枠いっぱい');
    const sq = await pg.evaluate(() => [...document.querySelectorAll('.tb1 .tbic:has(>img.ti15)')].map((b) => getComputedStyle(b).borderRadius));
    assert.ok(sq.length && sq.every((r) => r === '5px'), `対戦表の枠も四角 ${[...new Set(sq)]}`);
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  }
  // 読めないとき：イラスト → 2.5D の横顔 → 丸い顔（フルーネは横顔が無い＝正式の立ち絵）
  const q = await openPage({}); const qg = q.page;
  await qg.route(/icons_1015\//, (r) => r.fulfill({ status: 404, body: '' }));
  await H.newGame(qg, 'テスト');
  const fb = await qg.evaluate(async () => { const d = document.createElement('div'); d.innerHTML = [0, 5].map((sp) => `<span class="tbic">${tbIcon({ sp })}</span>`).join(''); document.getElementById('app').appendChild(d); await new Promise((ok) => setTimeout(ok, 1500)); return [...d.querySelectorAll('img')].map((i) => [i.getAttribute('src'), i.className, i.naturalWidth > 0]); });
  assert.match(fb[0][0], /faces_25d\/face_soramo\.webp$/); assert.match(fb[0][1], /f25/); assert.ok(fb[0][2]);
  assert.match(fb[1][0], /monsters\/2p5d\/flurene\.webp$/); assert.match(fb[1][1], /tbst/); assert.ok(fb[1][2]);
  assert.deepEqual(q.errors, []);
});

test('NB-11（追加A）：技カードの読み込みが遅いとき＝旧い技の絵・白い空白・途中まで描いた絵を出さない（濃紺の枠と技名の帯だけ → 読めたら出す）・抽選と STOP は従来どおり', { skip: SKIP, timeout: 200000 }, async () => {
  const p = await openPage({ worldCh1: true }); const pg = p.page;
  await toWorld(pg, { sp: 0, eq: [2, 0, 1, 3, 4, 8] });
  await pg.route('**/assets/moves/cards_1014/**', async (r) => { await new Promise((res) => setTimeout(res, 7000)); await r.continue().catch(() => {}); });
  await pg.evaluate(() => { window.__bad = []; window.__hid = 0; const tick = () => { for (const im of document.querySelectorAll('#bt .mmr .pl.cd .ic img')) { const src = im.getAttribute('src') || '', op = +getComputedStyle(im).opacity;
      if (!/cards_1014\//.test(src)) window.__bad.push('src ' + src);
      if ((!im.complete || !im.naturalWidth) && op > 0.01) window.__bad.push('未読込なのに見える ' + src + ' ' + op);
      if (!im.complete) window.__hid++; }
    if (!window.__stop) requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
  await pg.evaluate(() => { const m = S.m, r = m.raise; r.pend = { roll: 1, left: 0, stage: 'battle', fx: { kind: 'battle', battleType: 'wild' } }; save(); bBattleRun(m, 'wild', MMP8.practiceRank(m), 0); });
  await pg.waitForSelector('#bt .mmr.cards .pl.cd', { timeout: 30000 });
  const early = await pg.evaluate(() => [...document.querySelectorAll('#bt .mmr .pl.cd')].map((e) => ({ nm: e.querySelector('.nm').textContent, frame: getComputedStyle(e.querySelector('.cf')).backgroundImage !== 'none' })));
  assert.ok(early.length >= 4 && early.every((x) => x.nm && x.frame), `読み込み中も技名の帯と枠 ${JSON.stringify(early)}`);
  await pg.waitForFunction(() => [...document.querySelectorAll('#bt .mmr .pl.cd .ic img')].every((i) => i.complete && i.naturalWidth && i.classList.contains('on') && +getComputedStyle(i).opacity > 0.99), null, { timeout: 30000 });
  const r = await pg.evaluate(() => { window.__stop = 1; return { bad: window.__bad.slice(0, 5), hid: window.__hid }; });
  assert.deepEqual(r.bad, [], '旧い絵・未読込の絵を見せない');
  assert.ok(r.hid > 0, '遅延が効いている（読み込み中の時間があった）');
  await pg.waitForFunction(() => { const g = document.getElementById('go'); return g && !g.disabled; }, null, { timeout: 30000 });
  await pg.click('#go');
  await pg.waitForFunction(() => document.querySelector('#bt .mmr.lock'), null, { timeout: 8000 });
  assert.deepEqual(p.errors, []);
});
