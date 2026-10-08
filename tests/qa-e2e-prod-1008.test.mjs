// =========================================================
// 2026-10-08 深層監査の修正・第2便（実ブラウザ）
//  PR-B1：本番の設定（施設の会話・参加の確認・ランク開始の演出・VS・バトルの共通演出・到着の会話をすべて有効＝harness が既定で止めている機能を止めない）で、
//         Chapter 1 の大会会場への到着 → ランク選択 → 参加の確認 → 開始の演出 → セドリック → 対戦表 → 比較 → VS → 実際の fight() を5試合 → 終わりの正式の順（監査 M-17）
//         各試合：相手の名前＝対戦表の参加者名・色相回転なし・重ね絵なし（M-06・M-07）、「ランクD大会」の帯は1行（M-08）、正式ルーレットの止まった板＝発動した技（arena.js）
//  PR-B2：野生の練習試合＝帯・上の札は「野生のモンスター」・相手は種族名・会場は従来どおりランクの絵（M-06）→ 降参の経路（2度押し → フィールドへ戻る）
//  PR-B3：ベースキャンプ／冒険中のメニュー＝見出しと ✕ が枠の中・✕ で閉じる・同じ部品と名前（M-09。4サイズ）
//  PR-B4：8体の対戦表＝参加者名が省略されない（8文字は2行まで）（M-10。4サイズ）
//  PR-B5：大会データが壊れたセーブでも、開始画面からの再開で黒い画面のまま詰まない（M-15）・「つづきからにもどる」で mr4ng を消す（L-13）
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
const SIZES4 = [H.SIZES.base, H.SIZES.se, H.SIZES.android, H.SIZES.max];

/** 強い個体で Chapter 1 のゴールへ（大会会場の到着イベントはこのあと field-view が出す） */
async function toGoal(pg, stat = 999) {
  await H.newGame(pg, 'テスト');
  await pg.evaluate((v) => { const m = mk(1); m.name = 'ガウ'; Object.assign(m, { li: v, po: v, in: v, hi: v, ev: v, de: v }); MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); save(); board(); }, stat);
}
/** 今のバトルの相手と帯（fight() が作った直後） */
const foeInfo = (pg) => pg.evaluate(() => {
  const e = BPL && BPL[1], ban = document.getElementById('ban'), tm = document.querySelector('#bt .tm small');
  return { name: e && e.name, h: e && e.h, s2: e && e.s2, tm: tm && tm.textContent, ban: ban && ban.textContent,
    banLines: ban ? (() => { const r = document.createRange(); r.selectNodeContents(ban); const t = [...r.getClientRects()].map((x) => x.top); return t.filter((y, i) => t.every((z, j) => j >= i || Math.abs(z - y) > 4)).length; })() : 0, rank: document.getElementById('bt').dataset.mmrank,
    bg: (document.querySelector('#bt .mma-bg') || {}).src || '' };
});

test('PR-B1：本番の設定で大会を最後まで（到着 → 確認 → 開始演出 → セドリック → 対戦表 → 比較 → VS → 5試合 → 終わりの正式の順）', { skip: SKIP, timeout: 1500000 }, async () => {
  const p = await openPage({ size: H.SIZES.base, npc: true, tourconf: true, tourvs: true, tourfx: true, stage: true, arrival: true }); const pg = p.page;
  await toGoal(pg);
  const seen = { talks: 0, confirm: 0, start: 0, vs: 0, compare: 0, battles: [], arena: [] };
  let phase = 'arrive';
  for (let step = 0; step < 4000; step++) {
    const s = await pg.evaluate(() => ({
      talk: !!document.querySelector('.mmtalk:not(.mmtalk-out)'), choices: !!(window.MMNPC && MMNPC.state() && MMNPC.state().choices),
      rcv: !!document.querySelector('#chrcv .rcv-row, .p9rcvw .rcv-row'), yn: !!document.querySelector('#p9conf .p9conf-yes, #ynm .ynm-y'),
      fx: !!document.querySelector('.p9tfx, .p9frames, #p9fr'), tb: !!document.querySelector('.tb1 .tbgo'), cmp: !!document.querySelector('.p9cmps .pcgo'), vs: !!document.getElementById('tvs'),
      bt: !!document.getElementById('bt'), back: (() => { const g = document.getElementById('go'); return !!g && g.classList.contains('bk'); })(),
      end: !!document.querySelector('.p9tour.p9end'),       status: S.m && S.m.raise.tour ? S.m.raise.tour.status : null }));
    if (s.bt) {
      if (phase !== 'battle') {
        phase = 'battle';
        const pm = await pg.evaluate(() => { const t = S.m.raise.tour, m = MMP8.tourNext(S.m); return m && MMP8L.entrantView(t.league, m.opp).name; });
        const f = await foeInfo(pg); seen.battles.push({ ...f, want: pm });
      }
      const f = await foeInfo(pg);
      if (f.ban === 'ランクD大会') seen.battles[seen.battles.length - 1].bandLines = f.banLines;
      if (s.back) { await pg.click('#go'); phase = 'after'; await pg.waitForTimeout(400); continue; }
      const can = await pg.evaluate(() => { const g = document.getElementById('go'); return !!g && !g.disabled && !g.classList.contains('bk'); });
      if (can) {
        await pg.click('#go').catch(() => {});
        // 正式ルーレット（arena.js）：吸着したら、中央の板＝止まった行（fight() の #rl .hit）
        const a = await pg.waitForFunction(() => { const S = window.MMARENA_LAST, rl = document.getElementById('rl'); if (!S || !rl) return null; const hit = rl.querySelector('.rw.hit'); if (!hit || S.mode !== 'locked') return null;
          const c = document.querySelector('.mmr .pl.c'); return { hit: hit.classList.contains('ms') ? 'MISS' : (hit.querySelector('.rn') || {}).textContent, plate: c ? (c.classList.contains('ms') ? 'MISS' : (c.querySelector('.nm') || {}).textContent) : null }; }, null, { timeout: 8000 }).then((h) => h.jsonValue()).catch(() => null);
        if (a) seen.arena.push(a);
      }
      await pg.waitForTimeout(300); continue;
    }
    if (s.talk) { seen.talks++; if (s.choices) { const ids = await pg.evaluate(() => MMNPC.state().choices.map((c) => c.id)); await H.chooseTalk(pg, ids[0]); } else await pg.click('.mmtalk:not(.mmtalk-out)', { force: true }).catch(() => {}); await pg.waitForTimeout(40); continue; }
    if (s.yn) { seen.confirm++; await pg.waitForTimeout(420); await pg.click('#p9conf .p9conf-yes, #ynm .ynm-y').catch(() => {}); await pg.waitForTimeout(200); continue; }
    if (s.vs) { seen.vs++; await pg.waitForTimeout(400); continue; }
    if (s.cmp) { seen.compare++; await pg.waitForTimeout(450); await pg.click('.pcgo').catch(() => {}); await pg.waitForTimeout(600); await pg.click('.pcgo').catch(() => {}); await pg.waitForTimeout(400); continue; }
    if (s.tb && s.status === 'league') { phase = 'board'; await pg.waitForTimeout(300); await pg.click('.tb1 .tbgo').catch(() => {}); await pg.waitForTimeout(400); continue; }
    if (s.rcv && !s.status) {
      const ok = await pg.$('button.rcv-row[data-rank="1"]');
      if (ok) { await pg.click('button.rcv-row[data-rank="1"]'); await pg.waitForTimeout(450); await pg.click('#p9join').catch(() => {}); }
      await pg.waitForTimeout(400); continue;
    }
    if (s.end && s.status === 'settled') {
      const done = await pg.evaluate(() => MMP8.tourEndSeen(S.m.raise.tour.result, 'next'));
      if (done && !s.talk) break;
    }
    await pg.waitForTimeout(150);
  }
  const res = await pg.evaluate(() => { const t = S.m.raise.tour, r = t.result; return { rank: t.rank, won: r && r.won, played: t.league.round, seen: r && r.endSeen, cOpen: MMP8.eligibleRanks(S.m).includes(2) }; });
  if (process.env.PR_DEBUG) console.log(JSON.stringify({ res, seen }));
  assert.equal(res.rank, 1, 'D ランク'); assert.equal(res.played, 5, '5試合'); assert.equal(res.won, true, '優勝');
  assert.deepEqual(res.seen, ['final', 'champion', 'firstReward', 'rankUp', 'cedricEnd', 'next'], '大会の終わりの正式の順');
  assert.equal(res.cOpen, true, 'D の初回優勝で C が解放');
  assert.ok(seen.confirm >= 1, '参加の確認（はい／いいえ）が出た'); assert.ok(seen.talks >= 3, 'セドリックなどの会話が出た：' + seen.talks);
  assert.ok(seen.vs >= 1 && seen.compare >= 5, `比較 ${seen.compare}・VS ${seen.vs}`);
  assert.equal(seen.battles.length, 5);
  for (const b of seen.battles) {
    assert.equal(b.name, b.want, '相手の名前＝対戦表の参加者名');
    assert.deepEqual([b.h, b.s2], [0, null], '色相回転・重ね絵なし（正式画像の色）');
    assert.equal(b.tm, 'ランクD大会'); assert.equal(b.rank, 'D'); assert.match(b.bg, /venue_D\.webp$/);
    if (b.bandLines) assert.equal(b.bandLines, 1, '「ランクD大会」の帯は1行');
  }
  assert.ok(seen.arena.length >= 5, 'ルーレットを止めた回数 ' + seen.arena.length);
  for (const a of seen.arena) assert.equal(a.plate, a.hit, '中央の板＝止まった技');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

test('PR-B2：野生の練習試合の帯・札・相手名・会場（M-06・M-07）→ 降参の経路', { skip: SKIP, timeout: 120000 }, async () => {
  const p = await openPage({ size: H.SIZES.se }); const pg = p.page;
  await H.newGame(pg, 'テスト');
  await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); m.prog.rankClr = [true, true, true, true, false, false]; S.m = m; save(); MMP8.depart(S, m, () => 0.37); save(); board(); });
  await pg.waitForSelector('#chf .chf-bg');
  await pg.waitForFunction(() => !bBusy && !MMCHD.isLocked() && !document.querySelector('.chpop,.chdz,.chf-enc,.chf-fina,.mmtalk'), null, { timeout: 20000 });
  await pg.evaluate(() => { const g = MMCH.graphFor(S.m), a = S.m.raise.field.nodeAssignments; const id = g.order.find((x) => a[x] && a[x].t === 'battle' && a[x].bt === 'wild'); const r = S.m.raise; r.node = id; r.pend = { roll: 1, left: 0, stage: 'resolve' }; save(); board(); });
  await pg.waitForSelector('.chbat', { timeout: 20000 });
  const sp = await pg.evaluate(() => MMCH.foeSpecies(S.m, SP.length));
  await pg.evaluate(() => bBattleGo());
  await pg.waitForSelector('#bt #m1 img', { timeout: 15000 });
  let f = await foeInfo(pg);
  const want = await pg.evaluate((i) => SP[i][0], sp);
  assert.equal(f.name, want, '相手は種族名（旧「ランクXの対戦相手」）');
  assert.deepEqual([f.h, f.s2], [0, null]);
  assert.equal(f.tm, '野生のモンスター', '上の札に「ランクX大会」と出さない');
  const rk = await pg.evaluate(() => RN[MMP8.practiceRank(S.m)]);
  assert.equal(f.rank, rk); assert.match(f.bg, new RegExp(`venue_${rk}\\.webp$`), '会場の絵は従来どおり練習試合のランク');
  await pg.waitForFunction(() => (document.getElementById('ban') || {}).textContent === '野生のモンスター', null, { timeout: 8000 });
  f = await foeInfo(pg); assert.equal(f.banLines, 1, '帯は1行');
  assert.equal(await pg.evaluate(() => /ランク.大会|ランク.の対戦相手/.test(document.getElementById('bt').innerText)), false);
  // 降参（2度押し）
  await pg.waitForFunction(() => { const g = document.getElementById('go'); return g && !g.disabled; }, null, { timeout: 15000 });
  await pg.click('#sur'); await pg.waitForTimeout(300); await pg.click('#sur');
  await pg.click('#go').catch(() => {});   // 今のターンを進めて降参を確定
  await pg.waitForFunction(() => { const g = document.getElementById('go'); return !!g && g.classList.contains('bk'); }, null, { timeout: 30000 });
  assert.match(await pg.evaluate(() => document.getElementById('msg').textContent), /降参|敗北|負け/);
  await pg.click('#go');
  await pg.waitForFunction(() => !document.getElementById('bt') && !!document.querySelector('#chf'), null, { timeout: 20000 });
  assert.equal(await pg.evaluate(() => S.m.raise.battle), null, 'バトルの途中状態は残らない');
  assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
});

for (const size of SIZES4) {
  test(`PR-B3：メニューの見出しと ✕ は枠の中・✕ で閉じる・同じ部品と名前（${size.join('×')}）`, { skip: SKIP, timeout: 90000 }, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await H.newGame(pg, 'テスト');
    await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; save(); hall('t'); });
    await pg.waitForTimeout(500);
    for (const open of ['bcMenu()', 'MMP8.depart(S,S.m,()=>0.37);save();board();p9Menu()']) {
      await pg.evaluate((o) => { p9MenuClose(); eval(o); }, open);
      await pg.waitForSelector('#p9ov .p9x', { timeout: 20000 }); await pg.waitForTimeout(300);
      const r = await pg.evaluate(() => { const b = (s) => document.querySelector(s).getBoundingClientRect(), c = b('#p9ov .p9ovc'), h = b('#p9ov .p9ovh'), x = b('#p9ov .p9x'), xs = getComputedStyle(document.querySelector('#p9ov .p9x'));
        return { inH: h.top >= c.top - 1 && h.bottom <= c.bottom + 1, inX: x.left >= 0 && x.right <= innerWidth && x.top >= c.top - 1, vis: xs.color !== 'rgba(0, 0, 0, 0)' && xs.visibility !== 'hidden' && parseFloat(xs.fontSize) > 0,
          labels: [...document.querySelectorAll('#p9ov .p8menu button')].map((e) => e.textContent), cls: [...document.querySelectorAll('#p9ov .p8menu button')].map((e) => e.className) }; });
      assert.equal(r.inH, true, '見出しは枠の中'); assert.equal(r.inX, true, '✕ は画面の中'); assert.equal(r.vis, true, '✕ が見える');
      assert.ok(r.labels.includes('⚔️ 技管理') && r.labels.includes('📊 ステータス'), JSON.stringify(r.labels));
      assert.ok(!r.labels.some((t) => /わざ|技設定/.test(t)));
      assert.ok(r.cls.every((c) => c === '' || c === 'p8danger'), '同じ部品（.p8menu の button）');
      await pg.click('#p9ov .p9x'); await pg.waitForSelector('#p9ov', { state: 'detached' });
    }
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });

  test(`PR-B4：8体の対戦表で参加者名が省略されない（8文字は2行まで）（${size.join('×')}）`, { skip: SKIP, timeout: 90000 }, async () => {
    const p = await openPage({ size }); const pg = p.page;
    await H.newGame(pg, 'テスト');
    await pg.evaluate(() => { const m = mk(0); m.name = 'ソラモノスケ八文字'.slice(0, 8); MMP7.ensureProg(m); S.m = m; save(); MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); m.raise.field.arrivalSeen = true; save(); board(); });
    await pg.waitForSelector('#chrcv .rcv-row', { timeout: 20000 });
    await pg.evaluate(() => { S.m.raise.ch = 2; MMP7.recordRankClear(S, S.m, 1); MMP8.startTournament(S, S.m, 2, 7); save(); board(); });
    await pg.waitForSelector('.tb1 .tbgo', { timeout: 15000 }); await pg.waitForTimeout(700);
    const r = await pg.evaluate(() => ({ rows: [...document.querySelectorAll('.tb1g.n8 .tbnm b')].map((b) => ({ t: b.textContent, cut: b.scrollWidth > b.clientWidth + 1 || b.scrollHeight > b.clientHeight + 1, lines: Math.round(b.clientHeight / parseFloat(getComputedStyle(b).lineHeight)) })),
      right: document.querySelector('.tb1g').getBoundingClientRect().right, go: document.querySelector('.tbgo').getBoundingClientRect().bottom }));
    assert.equal(r.rows.length, 8);
    for (const x of r.rows) { assert.equal(x.cut, false, `省略されない：${x.t}`); assert.ok(x.lines <= 2, `${x.t} は2行まで`); }
    assert.ok(r.right <= size[0], '表は画面の中'); assert.ok(r.go <= size[1], '「対戦する」は画面の中');
    assert.deepEqual(p.errors, []); assert.deepEqual(p.bad, []);
  });
}

test('PR-B5：大会データが壊れたセーブでも再開で黒い画面のまま詰まない（M-15）・「つづきからにもどる」で印 mr4ng を消す（L-13）', { skip: SKIP, timeout: 120000 }, async () => {
  let p = await openPage({ size: H.SIZES.base }); let pg = p.page;
  await H.newGame(pg, 'テスト');
  const bad = await pg.evaluate(() => { const m = mk(0); m.name = 'ソラ'; MMP7.ensureProg(m); S.m = m; MMP8.depart(S, m, () => 0.37); const g = MMCH.graphFor(m); Object.assign(m.raise, { node: g.goal, goal: true, pend: null }); MMP8.startTournament(S, m, 0, 7); save();
    const s = JSON.parse(localStorage.getItem('mr4v6')); s.m.raise.tour.league.rounds = [[{ a: 0, b: 99 }]]; s.m.raise.tour.league.entrants = 'x'; return JSON.stringify(s); });
  await p.ctx.close(); OPEN.splice(OPEN.indexOf(p), 1);
  p = await openPage({ size: H.SIZES.base, raw: { mr4v6: bad } }); pg = p.page;
  await pg.waitForSelector('[onclick*="startGame"]'); await pg.click('[onclick*="startGame"]');
  await pg.waitForFunction(() => !document.querySelector('.tveil') && !!document.querySelector('#app > *') && !document.querySelector('.mmtscr'), null, { timeout: 15000 });
  const r = await pg.evaluate(() => ({ tour: S.m.raise.tour, txt: document.getElementById('app').innerText.length, veil: !!document.querySelector('.tveil') }));
  assert.equal(r.tour, null, '読めない大会データは大会の前（受付）へ'); assert.ok(r.txt > 0, '画面が出ている'); assert.equal(r.veil, false, '暗転が残らない');
  assert.deepEqual(p.errors, []);
  // 「最初からやり直す」→ 開始画面の「つづきからにもどる」→ 印が消える（保存が起きなくても）
  await pg.evaluate(() => { P_NEWGAME = true; title(); });
  assert.equal(await pg.evaluate(() => localStorage.getItem('mr4ng')), '1');
  await pg.click('.tcancel');
  assert.equal(await pg.evaluate(() => localStorage.getItem('mr4ng')), null, 'つづきからに戻った時点で印は消える');
  await pg.reload(); await pg.waitForSelector('[onclick*="startGame"]');
  assert.equal(await pg.evaluate(() => P_NEWGAME), false, '次の起動は「つづきから」');
});
